# -*- coding: utf-8 -*-
"""복구한 모차르트 영상을 LevelPlay 자체 탑재용으로 경량화 (재실행 안전).

무음이라 내렸던 10곡을 오디오 복구 후 다시 싣는다. 유튜브 업로드본은 아직
무음이므로 임베드가 아니라 저장소 자체 탑재로 간다(외부 게시 없이 즉시 반영).

  원본 1080p ~20MB → 720p CRF28 ~3MB (편당) → assets/videos/mozart/<K>.mp4
실행:  python pack_fixed_videos.py
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"D:\AI\08_컨텐츠\Mozart_MV_Project\output"
OUT = os.path.join(HERE, "assets", "videos", "mozart")
KEYS = ["K280", "K283", "K265", "K466", "K467", "K488", "K453", "K183", "K299", "K465"]
SILENCE_DBFS = -70.0


def run(cmd, timeout=1800):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                          encoding="utf-8", errors="replace")


def mean_dbfs(p):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", p, "-af", "volumedetect",
             "-f", "null", "-"], timeout=300)
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", (r.stderr or "") + (r.stdout or ""))
    return float(m.group(1)) if m else None


def main():
    os.makedirs(OUT, exist_ok=True)
    ok, bad, total = 0, [], 0
    print("%-7s %-11s %-11s %s" % ("곡", "원본MB", "경량MB", "음량 확인"))
    print("-" * 56)
    for k in KEYS:
        src = os.path.join(SRC, "Mozart_%s_studio_fixed.mp4" % k)
        if not os.path.isfile(src):
            bad.append((k, "복구본 없음")); print("%-7s 복구본 없음" % k); continue

        db_src = mean_dbfs(src)
        if db_src is None or db_src < SILENCE_DBFS:
            bad.append((k, "원본이 무음 %.1f" % (db_src or -99)))
            print("%-7s ★원본 무음 %.1f dBFS — 제외" % (k, db_src or -99)); continue

        dst = os.path.join(OUT, "%s.mp4" % k)
        if not (os.path.isfile(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
            r = run(["ffmpeg", "-y", "-v", "error", "-i", src,
                     "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "veryfast",
                     "-crf", "28", "-profile:v", "high", "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", dst])
            if not os.path.isfile(dst):
                bad.append((k, "인코딩 실패")); print("%-7s ★인코딩 실패" % k); continue

        db_dst = mean_dbfs(dst)
        if db_dst is None or db_dst < SILENCE_DBFS:
            bad.append((k, "경량본 무음")); print("%-7s ★경량본 무음 — 제외" % k); continue

        s_mb = os.path.getsize(src) / 1024 / 1024
        d_mb = os.path.getsize(dst) / 1024 / 1024
        total += d_mb
        ok += 1
        print("%-7s %-11.1f %-11.1f %.1f → %.1f dBFS ✅" % (k, s_mb, d_mb, db_src, db_dst))

    print("-" * 56)
    print("완료 %d곡 / 합계 %.1f MB → %s" % (ok, total, OUT))
    if bad:
        print("제외 %d곡:" % len(bad))
        for k, w in bad:
            print("   ", k, w)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
