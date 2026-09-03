# -*- coding: utf-8 -*-
"""Convert the 2nd WeTransfer folder (WhatsApp JPEGs) into SEO-named WebP."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "wetransfer_photos-tmbc_2026-08-29_1023"
MEDIA = ROOT / "public" / "assets" / "media"
GAL = MEDIA / "galerie"
GAL.mkdir(parents=True, exist_ok=True)

FEATURED = {
    "whatsapp image 2023-11-29 at 17.12.32.jpeg": [
        ("hero-club-boxe-toulouse-minimes.webp", 1800, 82),
        ("cours-boxe-loisirs-debutant-toulouse.webp", 1600, 82),
    ],
    "whatsapp image 2023-11-29 at 18.08.40.jpeg": [
        ("boxe-anglaise-competiteurs-toulouse.webp", 1600, 82),
    ],
    "whatsapp image 2023-12-01 at 13.15.36.jpeg": [
        ("ecole-boxe-enfants-toulouse-tmbc.webp", 1600, 82),
    ],
}

SLUGS = [
    "boxe-anglaise-toulouse-minimes",
    "club-boxe-toulouse-tmbc",
    "cours-boxe-anglaise-toulouse",
    "salle-boxe-toulouse-minimes",
    "entrainement-boxe-toulouse",
    "club-boxe-barriere-de-paris",
    "tmbc-boxe-anglaise-toulouse",
    "cours-boxe-debutant-toulouse",
    "assaut-boxe-toulouse-minimes",
    "ring-boxe-toulouse-tmbc",
    "club-boxe-anglaise-minimes",
    "cours-collectif-boxe-toulouse",
    "boxe-loisirs-toulouse-minimes",
    "salle-boxe-rue-de-fenouillet",
    "tmbc-club-boxe-toulouse",
]

ALTS = [
    "Boxe anglaise à Toulouse Minimes, club TMBC",
    "Club de boxe Toulouse TMBC pendant un cours",
    "Cours de boxe anglaise à Toulouse Minimes",
    "Salle de boxe Toulouse Minimes, 10 rue de Fenouillet",
    "Entraînement de boxe à Toulouse, club TMBC",
    "Club de boxe Toulouse Barrière de Paris",
    "TMBC, boxe anglaise à Toulouse Minimes",
    "Cours de boxe débutant à Toulouse Minimes",
    "Assaut de boxe à Toulouse Minimes, TMBC",
    "Ring de boxe au club TMBC Toulouse",
    "Club de boxe anglaise Toulouse Minimes",
    "Cours collectif de boxe à Toulouse",
    "Boxe loisirs à Toulouse Minimes",
    "Salle de boxe, rue de Fenouillet à Toulouse",
    "TMBC, club de boxe à Toulouse",
]


def convert(src: Path, dest: Path, max_side: int = 1400, quality: int = 75) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.relative_to(MEDIA)} {im.size[0]}x{im.size[1]}")


def main() -> None:
    files = sorted(
        [p for p in SRC.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}],
        key=lambda p: p.name.lower(),
    )
    if not files:
        raise SystemExit(f"Aucune photo dans {SRC}")

    featured_names = set()
    for name, outputs in FEATURED.items():
        src = SRC / name
        # Windows / WhatsApp casing
        match = next((p for p in files if p.name.lower() == name), None)
        if match is None:
            raise SystemExit(f"Photo manquante: {name}")
        featured_names.add(match.name.lower())
        for dest_name, max_side, quality in outputs:
            convert(match, MEDIA / dest_name, max_side=max_side, quality=quality)

    shots = []
    n = 0
    for src in files:
        if src.name.lower() in featured_names:
            continue
        n += 1
        slug = SLUGS[(n - 1) % len(SLUGS)]
        cycle = (n - 1) // len(SLUGS) + 1
        dest_name = f"photos-{slug}-{cycle:02d}.webp"
        convert(src, GAL / dest_name, max_side=1400, quality=74)
        alt = ALTS[(n - 1) % len(ALTS)]
        zone = "salle" if n % 5 == 0 else "anglaise"
        shots.append({"src": f"/assets/media/galerie/{dest_name}", "zone": zone, "alt": alt})

    out = ROOT / "src" / "data" / "galerie-folder2.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    import json

    if out.exists():
        for item in json.loads(out.read_text(encoding="utf-8")):
            old = ROOT / "public" / item["src"].lstrip("/")
            if old.exists() and not old.name.startswith("photos-"):
                old.unlink()
                print(f"removed collide {old.name}")

    out.write_text(json.dumps(shots, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(shots)} photos galerie -> {out}")


if __name__ == "__main__":
    main()
