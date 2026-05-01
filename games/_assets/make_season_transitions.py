"""
계절 전환 컷씬 생성기 (봄/여름/가을/겨울)
==========================================
봄/여름/가을/겨울 각 계절별 정지 이미지에 ffmpeg로
페이드 전환 + 색감 그레이딩을 적용해 컷씬 4개를 생성.

입력 (이 스크립트 폴더 기준 ./seasons/):
    seasons/spring.png  (또는 .jpg) — 봄 배경
    seasons/summer.png
    seasons/autumn.png
    seasons/winter.png
    seasons/farm_base.png — 공통 베이스 (선택, 페이드 시작 프레임)

출력 (_assets/videos/):
    season_spring.mp4 (3초)
    season_summer.mp4
    season_autumn.mp4
    season_winter.mp4

각 컷씬 구성:
    - 1080p 30fps
    - farm_base.png 1초 -> 계절 이미지로 페이드 인 1초 -> 유지 1초
    - 계절별 색감 그레이딩 (curves + colorbalance)

사용법:
    python make_season_transitions.py            (4개 모두)
    python make_season_transitions.py spring     (특정 계절만)
    python make_season_transitions.py --duration 5 --fade 1.5
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SEASON_DIR = SCRIPT_DIR / "seasons"
OUTPUT_DIR = SCRIPT_DIR / "videos"

# 계절별 색감 그레이딩 필터 (ffmpeg eq + colorbalance)
# eq: contrast/brightness/saturation/gamma
# colorbalance: rs/gs/bs (shadow), rm/gm/bm (mid), rh/gh/bh (highlight)
SEASON_GRADES: dict[str, str] = {
    "spring": (
        "eq=contrast=1.05:brightness=0.04:saturation=1.20:gamma_g=1.05,"
        "colorbalance=rs=-0.05:gs=0.08:bs=0.05:rm=0.0:gm=0.10:bm=0.0"
    ),
    "summer": (
        "eq=contrast=1.10:brightness=0.06:saturation=1.30:gamma_b=0.95,"
        "colorbalance=rs=0.05:gs=0.05:bs=-0.10:rm=0.08:gm=0.04:bm=-0.08"
    ),
    "autumn": (
        "eq=contrast=1.08:brightness=-0.02:saturation=1.10:gamma_b=0.90,"
        "colorbalance=rs=0.15:gs=0.05:bs=-0.20:rm=0.18:gm=0.0:bm=-0.18:"
        "rh=0.10:gh=-0.05:bh=-0.15"
    ),
    "winter": (
        "eq=contrast=1.05:brightness=0.02:saturation=0.75:gamma_r=0.95,"
        "colorbalance=rs=-0.10:gs=-0.05:bs=0.18:rm=-0.08:gm=0.0:bm=0.15:"
        "rh=-0.05:gh=0.0:bh=0.18"
    ),
}

VALID_EXTS = (".png", ".jpg", ".jpeg", ".webp")


def check_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        print("[ERROR] ffmpeg를 PATH에서 찾을 수 없음.", file=sys.stderr)
        sys.exit(2)


def find_image(stem: str) -> Path | None:
    for ext in VALID_EXTS:
        p = SEASON_DIR / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def build_filter(grade: str, fade_in: float, hold: float, base_dur: float) -> str:
    """베이스->계절 페이드 + 색감 그레이딩 필터 그래프."""
    total = base_dur + fade_in + hold
    return (
        # [0]=base, [1]=season
        f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,"
        f"trim=duration={base_dur + fade_in},setpts=PTS-STARTPTS,format=yuv420p[bg];"
        f"[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,"
        f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,"
        f"{grade},"
        f"trim=duration={fade_in + hold},setpts=PTS-STARTPTS,format=yuv420p[season];"
        f"[bg][season]xfade=transition=fade:duration={fade_in}:offset={base_dur}[v]"
    )


def render_season(
    season: str,
    base_image: Path,
    season_image: Path,
    fade_in: float,
    hold: float,
    base_dur: float,
) -> Path:
    grade = SEASON_GRADES[season]
    output = OUTPUT_DIR / f"season_{season}.mp4"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total = base_dur + fade_in + hold

    filter_complex = build_filter(grade, fade_in, hold, base_dur)
    cmd = [
        "ffmpeg",
        "-y",
        "-loop", "1", "-t", f"{base_dur + fade_in}", "-i", str(base_image),
        "-loop", "1", "-t", f"{fade_in + hold}", "-i", str(season_image),
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-t", f"{total}",
        "-r", "30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output),
    ]
    print(f"[CMD][{season}]", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="계절 전환 컷씬 4종 생성")
    parser.add_argument(
        "seasons",
        nargs="*",
        choices=list(SEASON_GRADES) + [],
        help="대상 계절 (생략시 전체)",
    )
    parser.add_argument("--duration", type=float, default=3.0, help="총 길이(초)")
    parser.add_argument("--fade", type=float, default=1.0, help="페이드 길이(초)")
    parser.add_argument(
        "--base",
        type=Path,
        default=None,
        help="베이스 이미지 (기본 seasons/farm_base.*)",
    )
    args = parser.parse_args()

    check_ffmpeg()
    targets = args.seasons or list(SEASON_GRADES.keys())

    base_image = args.base or find_image("farm_base")
    if base_image is None or not base_image.exists():
        print(
            f"[ERROR] 베이스 이미지 없음. {SEASON_DIR}/farm_base.png 를 두세요.",
            file=sys.stderr,
        )
        sys.exit(1)

    base_dur = max(0.5, args.duration - args.fade - 1.0)
    hold = max(0.5, args.duration - args.fade - base_dur)

    for season in targets:
        season_img = find_image(season)
        if season_img is None:
            print(f"[SKIP] {season} 이미지 없음 ({SEASON_DIR}/{season}.png)")
            continue
        out = render_season(season, base_image, season_img, args.fade, hold, base_dur)
        print(f"[OK] {season} -> {out}")


if __name__ == "__main__":
    main()
