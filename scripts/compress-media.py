# -*- coding: utf-8 -*-
"""Compress TMBC media: gallery thumbs, tighter full images, hero WebP."""
from pathlib import Path
from urllib.request import urlopen, Request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "public" / "assets" / "media"
GAL = MEDIA / "galerie"
THUMBS = GAL / "thumbs"
IMG = ROOT / "public" / "assets" / "img"
YT_ID = "JsoneKRdNLk"


def convert(src: Path, dest: Path, max_side: int, quality: int) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    before = src.stat().st_size if src.exists() else 0
    after = dest.stat().st_size
    print(f"{dest.relative_to(ROOT)} {im.size[0]}x{im.size[1]} {after/1024:.0f}KB")


def fetch_yt_poster() -> Path:
    dest = MEDIA / "gala-boxe-toulouse-2023.webp"
    from io import BytesIO

    best = None
    for name in ("maxresdefault.jpg", "sddefault.jpg", "hqdefault.jpg"):
        url = f"https://i.ytimg.com/vi/{YT_ID}/{name}"
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0 TMBC"})
            with urlopen(req, timeout=20) as res:
                data = res.read()
            im = Image.open(BytesIO(data)).convert("RGB")
            if im.size[0] < 800:
                print(f"skip {name} {im.size}")
                continue
            w, h = im.size
            scale = min(1.0, 1600 / max(w, h))
            if scale < 1:
                im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, "WEBP", quality=82, method=6)
            print(f"{dest.name} from {name} {im.size[0]}x{im.size[1]} {dest.stat().st_size/1024:.0f}KB")
            return dest
        except Exception as err:
            print(f"skip {name}: {err}")
            best = dest if dest.exists() else best
    if dest.exists():
        return dest
    raise SystemExit("Impossible de recuperer la miniature YouTube")


def main() -> None:
    fetch_yt_poster()

    hero = IMG / "hero.png"
    if hero.exists():
        convert(hero, IMG / "hero.webp", max_side=1600, quality=76)

    for src in sorted(GAL.glob("*.webp")):
        convert(src, THUMBS / src.name, max_side=640, quality=62)

    # Homepage / inner photos: cap weight without a new filename (cache-bust via css/js).
    for src in sorted(MEDIA.glob("*.webp")):
        if src.stat().st_size < 90_000:
            continue
        convert(src, src, max_side=1200, quality=72)


if __name__ == "__main__":
    main()
