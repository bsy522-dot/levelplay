"""
Animal Farm Pixel Sprite Generator (ComfyUI batch driver)
=========================================================
Posts the workflow in comfyui_pixel_workflow.json once per item to a running
ComfyUI server, listens via the WebSocket /ws endpoint until the prompt is
done, copies the resulting PNG into _assets/sprites/<category>/<key>.png and
moves on. Generates 12 animals + 10 crops + 10 buildings = 32 sprites at
64x64 (rendered at 512x512, downscaled nearest-exact in the workflow).

Usage:
    1. Start ComfyUI:  D:\\AI\\06_도구\\ComfyUI\\run_nvidia_gpu.bat
    2. python generate_sprites.py [--server 127.0.0.1:8188] [--only animals|crops|buildings|all]

Requires: requests, websocket-client  (python -m pip install requests websocket-client)
"""
from __future__ import annotations

import argparse
import json
import os
import random
import shutil
import sys
import time
import urllib.parse
import uuid
from pathlib import Path

try:
    import requests
    import websocket  # type: ignore  # websocket-client
except ImportError:
    print("Missing deps. Run: python -m pip install requests websocket-client")
    sys.exit(1)


HERE = Path(__file__).resolve().parent
WORKFLOW_PATH = HERE / "comfyui_pixel_workflow.json"
SPRITES_DIR = HERE / "sprites"

# ---------------------------------------------------------------------------
# Prompt catalogue — 32 sprites total
# ---------------------------------------------------------------------------
COMMON_STYLE = (
    "16-bit pixel art sprite, single subject, centered, clean silhouette, "
    "transparent or flat solid background, vibrant saturated colors, "
    "front view, game asset, cute chibi proportions, sharp pixels, no text"
)
NEGATIVE = (
    "photorealistic, 3d render, blurry, anti-aliased, text, watermark, "
    "signature, multiple subjects, complex background, gradient, noise, "
    "out of frame, cropped"
)

ANIMALS: dict[str, str] = {
    "chicken":  "cartoon chicken, white feathers, red comb, yellow beak, standing",
    "cow":      "cartoon cow, black and white spots, pink udder, friendly face",
    "pig":      "cartoon pig, pink, curly tail, snout up, plump body",
    "sheep":    "cartoon sheep, white fluffy wool, black face and legs",
    "duck":     "cartoon duck, yellow feathers, orange beak and feet, side waddle",
    "goat":     "cartoon goat, brown and white, small horns, beard",
    "dog":      "cartoon puppy dog, golden retriever color, floppy ears, wagging tail",
    "cat":      "cartoon kitten, orange tabby, big eyes, small paws",
    "bee":      "cartoon honey bee, yellow and black stripes, transparent wings",
    "rabbit":   "cartoon rabbit, white fur, long ears, pink nose",
    "horse":    "cartoon horse, brown coat, black mane, standing pose",
    "fish":     "cartoon koi fish, orange and white, side view, fins spread",
}

CROPS: dict[str, str] = {
    "potato":   "single potato tuber, brown skin, oval shape",
    "strawberry": "single ripe strawberry with green leaves on top, red glossy",
    "lettuce":  "single round lettuce head, layered green leaves",
    "watermelon": "single whole watermelon, dark green stripes, round",
    "corn":     "single ear of corn with husk pulled back, yellow kernels",
    "tomato":   "single ripe tomato with green stem, glossy red",
    "apple":    "single red apple with green leaf and brown stem",
    "pear":     "single yellow-green pear with brown stem",
    "sweetpotato": "single sweet potato, purple-red skin, oblong shape",
    "spinach":  "single bunch of fresh spinach leaves, dark green",
}

BUILDINGS: dict[str, str] = {
    "barn":         "small red barn with white roof, single building, wooden doors",
    "windmill":     "white windmill with four red blades on a small hill",
    "silo":         "tall metal grain silo, gray cylindrical body, conical top",
    "greenhouse":   "small glass greenhouse, white frame, transparent panels",
    "market_b":     "wooden farmers market stall building, striped awning, produce baskets",
    "pond":         "small round farm pond, blue water, grass border, lily pad",
}

CATEGORIES = {"animals": ANIMALS, "crops": CROPS, "buildings": BUILDINGS}


def build_prompt(name: str, item_prompt: str) -> str:
    return f"{item_prompt}, {COMMON_STYLE}"


# ---------------------------------------------------------------------------
# ComfyUI API client
# ---------------------------------------------------------------------------
class ComfyClient:
    def __init__(self, server: str):
        self.server = server.rstrip("/")
        self.client_id = str(uuid.uuid4())
        self.http = f"http://{self.server}"
        self.ws_url = f"ws://{self.server}/ws?clientId={self.client_id}"

    def queue(self, workflow: dict) -> str:
        r = requests.post(
            f"{self.http}/prompt",
            json={"prompt": workflow, "client_id": self.client_id},
            timeout=30,
        )
        r.raise_for_status()
        return r.json()["prompt_id"]

    def wait(self, prompt_id: str, timeout: int = 600) -> None:
        ws = websocket.WebSocket()
        ws.connect(self.ws_url, timeout=timeout)
        ws.settimeout(timeout)
        try:
            while True:
                raw = ws.recv()
                if not isinstance(raw, str):
                    continue
                msg = json.loads(raw)
                if msg.get("type") == "executing":
                    data = msg.get("data", {})
                    if data.get("node") is None and data.get("prompt_id") == prompt_id:
                        return
        finally:
            ws.close()

    def history(self, prompt_id: str) -> dict:
        r = requests.get(f"{self.http}/history/{prompt_id}", timeout=30)
        r.raise_for_status()
        return r.json().get(prompt_id, {})

    def fetch_image(self, filename: str, subfolder: str, folder_type: str) -> bytes:
        params = {"filename": filename, "subfolder": subfolder, "type": folder_type}
        r = requests.get(
            f"{self.http}/view?{urllib.parse.urlencode(params)}", timeout=60
        )
        r.raise_for_status()
        return r.content


def fill_workflow(template: dict, *, positive: str, negative: str, seed: int, prefix: str) -> dict:
    """Replace placeholder strings in the workflow JSON template."""
    raw = json.dumps(template)
    raw = raw.replace('"{SEED}"', str(seed))
    raw = raw.replace("{POSITIVE}", json.dumps(positive)[1:-1])
    raw = raw.replace("{NEGATIVE}", json.dumps(negative)[1:-1])
    raw = raw.replace("{FILENAME_PREFIX}", prefix)
    wf = json.loads(raw)
    wf.pop("_meta", None)
    return wf


def run(server: str, only: str) -> None:
    if not WORKFLOW_PATH.exists():
        sys.exit(f"workflow not found: {WORKFLOW_PATH}")
    template = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    client = ComfyClient(server)

    selected = (
        CATEGORIES if only == "all"
        else {only: CATEGORIES[only]}
    )
    total = sum(len(v) for v in selected.values())
    done = 0
    t0 = time.time()

    for category, items in selected.items():
        out_dir = SPRITES_DIR / category
        out_dir.mkdir(parents=True, exist_ok=True)
        for key, item_prompt in items.items():
            done += 1
            target = out_dir / f"{key}.png"
            # Overwrite placeholders (< 2KB) but keep real generated sprites
            if target.exists() and target.stat().st_size > 2048:
                print(f"[{done}/{total}] skip (real sprite exists) {category}/{key}")
                continue
            seed = random.randint(1, 2**31 - 1)
            prefix = f"farm/{category}_{key}"
            wf = fill_workflow(
                template,
                positive=build_prompt(key, item_prompt),
                negative=NEGATIVE,
                seed=seed,
                prefix=prefix,
            )
            print(f"[{done}/{total}] {category}/{key}  seed={seed}")
            try:
                pid = client.queue(wf)
                client.wait(pid)
                hist = client.history(pid)
                outputs = hist.get("outputs", {})
                save_node = outputs.get("10") or next(iter(outputs.values()), {})
                images = save_node.get("images", [])
                if not images:
                    print(f"   ! no image returned for {key}")
                    continue
                img = images[0]
                blob = client.fetch_image(img["filename"], img.get("subfolder", ""), img.get("type", "output"))
                target.write_bytes(blob)
                print(f"   -> {target}")
            except Exception as exc:  # noqa: BLE001
                print(f"   ! error on {key}: {exc}")

    elapsed = time.time() - t0
    print(f"done. {done} items in {elapsed:.1f}s. output: {SPRITES_DIR}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default=os.environ.get("COMFYUI_SERVER", "127.0.0.1:8188"))
    ap.add_argument("--only", choices=["animals", "crops", "buildings", "all"], default="all")
    args = ap.parse_args()
    run(args.server, args.only)


if __name__ == "__main__":
    main()
