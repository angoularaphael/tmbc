# -*- coding: utf-8 -*-
"""Convert WeTransfer JPGs into SEO-named WebP for TMBC."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "wetransfer_photos-pub-boxing-center-mardi_080-jpg_2026-08-29_0908"
MEDIA = ROOT / "public" / "assets" / "media"
GAL = MEDIA / "galerie"
GAL.mkdir(parents=True, exist_ok=True)

GALLERY_NAMES = {
    "tmbc-018": "cours-boxe-anglaise-toulouse-01.webp",
    "tmbc-020": "club-boxe-toulouse-minimes-cours.webp",
    "tmbc-155": "cours-boxe-toulouse-minimes.webp",
    "tmbc-158": "cours-boxe-loisirs-toulouse-minimes.webp",
    "tmbc-161": "boxe-debutant-toulouse-tmbc.webp",
    "tmbc-171": "entrainement-boxe-anglaise-toulouse.webp",
    "tmbc-181": "cours-collectif-boxe-toulouse.webp",
    "tmbc-182": "assaut-boxe-anglaise-toulouse.webp",
    "tmbc-183": "club-boxe-toulouse-barriere-de-paris.webp",
    "tmbc-186": "boxe-anglaise-toulouse-minimes.webp",
    "tmbc-193": "cours-boxe-toulouse-rue-de-fenouillet.webp",
    "tmbc-201": "tmbc-cours-boxe-anglaise-toulouse.webp",
    "mardi_012": "salle-boxe-toulouse-minimes.webp",
    "mardi_013": "coach-mehdi-tmbc-toulouse.webp",
    "mardi_075": "salle-boxe-toulouse-500m2.webp",
    "mardi_077": "salle-boxe-toulouse-ring.webp",
    "mardi_080": "salle-boxe-toulouse-barriere-de-paris.webp",
}


def convert(src: Path, dest: Path, max_side: int = 1600, quality: int = 80) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.name} {im.size[0]}x{im.size[1]}")


def gallery_name(filename: str) -> str:
    lower = filename.lower()
    for key, dest in GALLERY_NAMES.items():
        if key in lower:
            return dest
    raise SystemExit(f"Pas de nom SEO pour {filename}")


def main() -> None:
    files = sorted(SRC.glob("*.jpg"), key=lambda p: p.name.lower())
    if not files:
        raise SystemExit(f"Aucune photo dans {SRC}")

    featured = {}
    for src in files:
        key = src.name.lower()
        convert(src, GAL / gallery_name(src.name))
        if "mardi_013" in key:
            featured["mehdi"] = src
        elif "tmbc-020" in key:
            featured["pourquoi"] = src
        elif "tmbc-158" in key:
            featured["loisirs"] = src

    missing = [k for k in ("mehdi", "pourquoi", "loisirs") if k not in featured]
    if missing:
        raise SystemExit(f"Photos manquantes: {missing}")

    convert(featured["mehdi"], MEDIA / "coach-mehdi-boxe-anglaise-toulouse.webp", max_side=1800, quality=82)
    convert(featured["pourquoi"], MEDIA / "club-boxe-anglaise-toulouse-minimes.webp", max_side=1600, quality=82)
    convert(featured["loisirs"], MEDIA / "cours-boxe-debutant-loisirs-toulouse.webp", max_side=1600, quality=82)


if __name__ == "__main__":
    main()
