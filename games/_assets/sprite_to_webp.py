"""
Sprite Sheet -> Animated WebP Converter
=======================================
가로로 N프레임이 배치된 PNG 스프라이트시트를 받아
ffmpeg로 게임용 가벼운 애니메이션 WebP를 생성한다.

사용법:
    python sprite_to_webp.py <input.png> <frames> [options]

예시:
    python sprite_to_webp.py sprites/cow_walk.png 8
    python sprite_to_webp.py sprites/pig_idle.png 4 --fps 12 --quality 75
    python sprite_to_webp.py sprites/dog.png 6 --output videos/dog_anim.webp

요구:
    - ffmpeg가 시스템 PATH에 있어야 함 (winget install Gyan.FFmpeg)
    - Python 3.8+ (PIL 사용해 프레임 폭 자동 산출)
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow 필요. pip install Pillow", file=sys.stderr)
    sys.exit(1)


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "videos"


def check_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        print("[ERROR] ffmpeg를 PATH에서 찾을 수 없음.", file=sys.stderr)
        sys.exit(2)


def slice_sprite(input_path: Path, frames: int, work_dir: Path) -> tuple[int, int]:
    """스프라이트시트를 frames개로 잘라 work_dir/frame_%04d.png 로 저장.
    반환: (frame_width, frame_height)
    """
    img = Image.open(input_path).convert("RGBA")
    sheet_w, sheet_h = img.size
    if sheet_w % frames != 0:
        print(
            f"[WARN] 시트폭 {sheet_w} 가 프레임수 {frames} 로 나눠지지 않음. "
            f"잔여 픽셀은 마지막 프레임에서 잘림.",
            file=sys.stderr,
        )
    fw = sheet_w // frames
    fh = sheet_h
    for i in range(frames):
        crop = img.crop((i * fw, 0, (i + 1) * fw, fh))
        crop.save(work_dir / f"frame_{i:04d}.png")
    return fw, fh


def encode_webp(
    work_dir: Path,
    output_path: Path,
    fps: int,
    quality: int,
    loop: int,
) -> None:
    """ffmpeg로 frame_%04d.png -> animated.webp 인코딩."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-framerate", str(fps),
        "-i", str(work_dir / "frame_%04d.png"),
        "-vcodec", "libwebp",
        "-lossless", "0",
        "-compression_level", "6",
        "-q:v", str(quality),
        "-loop", str(loop),
        "-preset", "default",
        "-an",
        "-vsync", "0",
        str(output_path),
    ]
    print("[CMD]", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sprite sheet -> Animated WebP")
    parser.add_argument("input", type=Path, help="가로 스프라이트시트 PNG")
    parser.add_argument("frames", type=int, help="가로 프레임 개수")
    parser.add_argument("--fps", type=int, default=10, help="기본 10fps")
    parser.add_argument("--quality", type=int, default=80, help="0-100 (높을수록 화질)")
    parser.add_argument("--loop", type=int, default=0, help="0=무한, N=N회")
    parser.add_argument("--output", type=Path, default=None, help="출력 경로 (.webp)")
    args = parser.parse_args()

    check_ffmpeg()
    if not args.input.exists():
        print(f"[ERROR] 입력 없음: {args.input}", file=sys.stderr)
        sys.exit(1)

    output = args.output or (DEFAULT_OUTPUT_DIR / (args.input.stem + ".webp"))

    with tempfile.TemporaryDirectory(prefix="spritewebp_") as tmp:
        work_dir = Path(tmp)
        fw, fh = slice_sprite(args.input, args.frames, work_dir)
        print(f"[INFO] 프레임 폭/높이: {fw}x{fh}, 프레임수: {args.frames}")
        encode_webp(work_dir, output, args.fps, args.quality, args.loop)

    print(f"[OK] 생성됨: {output}")


if __name__ == "__main__":
    main()
