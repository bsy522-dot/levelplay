"""PWA 아이콘 생성기 (병석님 비서 / PRISM Studio)

요구 사양:
  - icon-192.png         (192x192, "any" purpose)
  - icon-512.png         (512x512, "any" purpose)
  - icon-maskable-512.png(512x512, safe-zone 80% 안쪽 maskable)

옵션 A (권장): ComfyUI z_image_turbo (localhost:8188)로 512x512 1장 생성
옵션 B (폴백): Pillow 절차생성 (#4a7c3f 둥근 사각형 + 태양/풀밭/동물 이모지)

추가:
  - 둥근 모서리 마스크 적용 (any purpose 아이콘)
  - maskable: safe-zone 80% 안쪽으로 그래픽 축소 + 단색 배경 패딩
  - 사이즈/포맷 검증 로그
"""
from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.request
import urllib.error
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

COMFY_URL = "http://127.0.0.1:8188"
OUT_DIR = Path("D:/AI/04_게임/동물농장/_assets/icons")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BG_COLOR = "#4a7c3f"

POSITIVE = (
    "cute pixel art farm logo, animals chicken cow pig, green field, sun, "
    "simple flat icon, 64x64 pixel art style upscaled, vibrant colors, "
    "white background"
)
NEGATIVE = (
    "text, letters, watermark, signature, low quality, blurry, "
    "photorealistic, dark, scary, multiple panels, gore"
)

WORKFLOW = {
    "3": {"class_type": "KSampler", "inputs": {
        "seed": 20260501, "steps": 8, "cfg": 1.0,
        "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
        "model": ["11", 0], "positive": ["6", 0],
        "negative": ["7", 0], "latent_image": ["5", 0]}},
    "11": {"class_type": "UNETLoader", "inputs": {
        "unet_name": "z_image_turbo_bf16.safetensors",
        "weight_dtype": "default"}},
    "12": {"class_type": "CLIPLoader", "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "qwen_image"}},
    "13": {"class_type": "VAELoader", "inputs": {
        "vae_name": "flux2_vae.safetensors"}},
    "5": {"class_type": "EmptyLatentImage", "inputs": {
        "width": 512, "height": 512, "batch_size": 1}},
    "6": {"class_type": "CLIPTextEncode", "inputs": {
        "text": POSITIVE, "clip": ["12", 0]}},
    "7": {"class_type": "CLIPTextEncode", "inputs": {
        "text": NEGATIVE, "clip": ["12", 0]}},
    "8": {"class_type": "VAEDecode", "inputs": {
        "samples": ["3", 0], "vae": ["13", 0]}},
    "10": {"class_type": "SaveImage", "inputs": {
        "images": ["8", 0], "filename_prefix": "pwa_icon_animal_farm"}},
}


def comfy_ping() -> bool:
    try:
        with urllib.request.urlopen(f"{COMFY_URL}/system_stats", timeout=3):
            return True
    except Exception:
        return False


def comfy_generate() -> Image.Image | None:
    """ComfyUI POST /prompt → poll history → fetch image."""
    payload = json.dumps({"prompt": WORKFLOW}).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFY_URL}/prompt", data=payload,
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            resp = json.loads(r.read())
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
        print(f"[ComfyUI] queue 실패: {e}", file=sys.stderr)
        return None

    prompt_id = resp.get("prompt_id")
    if not prompt_id:
        print(f"[ComfyUI] prompt_id 없음: {resp}", file=sys.stderr)
        return None
    print(f"[ComfyUI] queued prompt_id={prompt_id}, polling...")

    deadline = time.time() + 180
    while time.time() < deadline:
        time.sleep(2)
        try:
            with urllib.request.urlopen(
                    f"{COMFY_URL}/history/{prompt_id}", timeout=5) as r:
                hist = json.loads(r.read())
        except Exception:
            continue
        entry = hist.get(prompt_id)
        if not entry:
            continue
        status = entry.get("status", {})
        if status.get("status_str") == "error":
            print(f"[ComfyUI] error: {status}", file=sys.stderr)
            return None
        outputs = entry.get("outputs", {}).get("10", {})
        images = outputs.get("images", [])
        if images:
            img_info = images[0]
            url = (f"{COMFY_URL}/view?filename={img_info['filename']}"
                   f"&subfolder={img_info.get('subfolder', '')}"
                   f"&type={img_info.get('type', 'output')}")
            try:
                with urllib.request.urlopen(url, timeout=10) as r:
                    data = r.read()
                img = Image.open(BytesIO(data)).convert("RGB")
                print(f"[ComfyUI] 생성 성공: {img.size}")
                return img
            except Exception as e:
                print(f"[ComfyUI] 이미지 fetch 실패: {e}", file=sys.stderr)
                return None
    print("[ComfyUI] 타임아웃 (180s)", file=sys.stderr)
    return None


def fallback_pillow() -> Image.Image:
    """Pillow 절차생성: #4a7c3f 배경 + 라디얼 글로우 + 태양 + 풀밭 + 동물 이모지."""
    print("[Fallback] Pillow 절차생성 시작")
    size = 512
    img = Image.new("RGB", (size, size), BG_COLOR)

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = size // 2, size // 2
    max_r = size // 2
    for r in range(max_r, 0, -3):
        ratio = r / max_r
        alpha = int(80 * (1 - ratio))
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(0x9c, 0xc8, 0x6f, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 태양 (오른쪽 위)
    draw.ellipse([size - 150, 35, size - 35, 150],
                 fill="#f5c542", outline="#f5edd6", width=5)
    sun_cx, sun_cy = size - 92, 92
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        x1 = sun_cx + math.cos(rad) * 70
        y1 = sun_cy + math.sin(rad) * 70
        x2 = sun_cx + math.cos(rad) * 95
        y2 = sun_cy + math.sin(rad) * 95
        draw.line([x1, y1, x2, y2], fill="#f5c542", width=6)

    # 풀밭
    grass_top = size - 140
    draw.rectangle([0, grass_top, size, size], fill="#2d5a1e")
    for x in range(20, size, 30):
        draw.polygon(
            [(x, grass_top), (x + 8, grass_top - 18), (x + 16, grass_top)],
            fill="#5a9437")

    # 동물 이모지
    try:
        font = ImageFont.truetype("seguiemj.ttf", 130)
    except Exception:
        font = ImageFont.load_default()
    draw.text((70, 175), "🐄", font=font, embedded_color=True)
    draw.text((200, 175), "🐔", font=font, embedded_color=True)
    draw.text((340, 175), "🐖", font=font, embedded_color=True)

    return img


def rounded_corners(img: Image.Image, radius_ratio: float = 0.18) -> Image.Image:
    """둥근 모서리 마스크 (any purpose 아이콘용)."""
    img = img.convert("RGBA")
    w, h = img.size
    radius = int(min(w, h) * radius_ratio)
    mask = Image.new("L", (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, w, h], radius=radius, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def make_maskable(src: Image.Image, target: int = 512,
                  safe_zone_ratio: float = 0.80) -> Image.Image:
    """maskable: safe-zone 80% 안쪽으로 축소 + 단색 배경 패딩.

    OS가 둥근/사각/원형 등 임의 마스크를 적용해도 그래픽이 잘리지 않도록
    중앙 80% 안쪽에만 그래픽을 배치하고 가장자리는 단색 배경 (#4a7c3f).
    """
    src = src.convert("RGB")
    inner = int(target * safe_zone_ratio)
    resized = src.resize((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (target, target), BG_COLOR)
    offset = (target - inner) // 2
    canvas.paste(resized, (offset, offset))
    return canvas


def verify(path: Path, expected_size: tuple[int, int]) -> bool:
    if not path.exists():
        print(f"  [FAIL] missing: {path}")
        return False
    with Image.open(path) as im:
        ok_size = im.size == expected_size
        ok_fmt = im.format == "PNG"
    kb = path.stat().st_size / 1024
    flag = "OK" if (ok_size and ok_fmt) else "FAIL"
    print(f"  [{flag}] {path.name}: {im.size} {im.format}  {kb:.1f} KB")
    return ok_size and ok_fmt


def main() -> int:
    raw = None
    if comfy_ping():
        print("[ComfyUI] 핑 OK — 옵션 A 시도")
        raw = comfy_generate()
    else:
        print("[ComfyUI] 미응답 — 옵션 B 폴백")

    if raw is None:
        raw = fallback_pillow()

    raw_512 = raw.resize((512, 512), Image.LANCZOS) if raw.size != (512, 512) else raw

    # icon-512.png (any) — 둥근 모서리
    p512 = OUT_DIR / "icon-512.png"
    rounded_corners(raw_512).save(p512, "PNG", optimize=True)

    # icon-192.png (any) — 다운스케일 후 둥근 모서리
    raw_192 = raw_512.resize((192, 192), Image.LANCZOS)
    p192 = OUT_DIR / "icon-192.png"
    rounded_corners(raw_192).save(p192, "PNG", optimize=True)

    # icon-maskable-512.png (maskable, safe-zone 80%)
    pmask = OUT_DIR / "icon-maskable-512.png"
    make_maskable(raw_512, 512, 0.80).save(pmask, "PNG", optimize=True)

    print("\n[검증]")
    ok = all([
        verify(p192, (192, 192)),
        verify(p512, (512, 512)),
        verify(pmask, (512, 512)),
    ])
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
