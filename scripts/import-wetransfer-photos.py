# -*- coding: utf-8 -*-
"""Convert WeTransfer JPGs into web-sized WebP for TMBC."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "wetransfer_photos-pub-boxing-center-mardi_080-jpg_2026-08-29_0908"
MEDIA = ROOT / "public" / "assets" / "media"
GAL = MEDIA / "galerie"
GAL.mkdir(parents=True, exist_ok=True)


def convert(src: Path, dest: Path, max_side: int = 1600, quality: int = 80) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.name} {im.size[0]}x{im.size[1]}")


def slug(name: str) -> str:
    lower = name.lower()
    if "mardi_" in lower:
        num = lower.rsplit("_", 1)[-1].replace(".jpg", "")
        return f"mardi-{num}"
    if "tmbc-" in lower:
        num = lower.split("tmbc-")[-1].replace("-.jpg", "").replace(".jpg", "").strip("-")
        return f"cecile-{num}"
    return Path(name).stem.lower().replace(" ", "-")


def main() -> None:
    files = sorted(SRC.glob("*.jpg"), key=lambda p: p.name.lower())
    if not files:
        raise SystemExit(f"Aucune photo dans {SRC}")

    featured = {}
    for src in files:
        key = src.name.lower()
        gal_name = f"galerie-{slug(src.name)}.webp"
        convert(src, GAL / gal_name)
        if "mardi_013" in key:
            featured["mehdi"] = src
        elif "tmbc-020" in key:
            featured["pourquoi"] = src
        elif "tmbc-158" in key:
            featured["loisirs"] = src

    missing = [k for k in ("mehdi", "pourquoi", "loisirs") if k not in featured]
    if missing:
        raise SystemExit(f"Photos manquantes: {missing}")

    convert(featured["mehdi"], MEDIA / "coach-mehdi-photo.webp", max_side=1800, quality=82)
    convert(featured["pourquoi"], MEDIA / "pourquoi-tmbc-1200.webp", max_side=1600, quality=82)
    convert(featured["loisirs"], MEDIA / "cours-assaut-1200.webp", max_side=1600, quality=82)


if __name__ == "__main__":
    main()
