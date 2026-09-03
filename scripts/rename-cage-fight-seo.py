# -*- coding: utf-8 -*-
"""Renomme les photos WeTransfer Cage Fight avec des noms SEO."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "wetransfer_photos-cage-fight-fiche-google_2026-09-03_1024"

RENAMES = {
    "2024_PHOTOS_BOXING_CENTER_MMA_001.jpg": "cage-fight-mma-fighter-octagon-boxing-center-toulouse.jpg",
    "2024_PHOTOS_BOXING_CENTER_MMA_006.jpg": "cage-fight-grappling-sol-octagon-boxing-center-01.jpg",
    "2024_PHOTOS_BOXING_CENTER_MMA_014.jpg": "cage-fight-victoire-combattant-octagon-toulouse.jpg",
    "2024_PHOTOS_BOXING_CENTER_MMA_043.jpg": "cage-fight-grappling-sol-octagon-boxing-center-02.jpg",
    "2024_PHOTOS_BOXING_CENTER_MMA_049.jpg": "cage-fight-coup-de-pied-haut-octagon-toulouse.jpg",
    "8.png": "cage-fight-affiche-roi-doccitanie-2-kharotai-roussy.png",
    "club mma (2).jpg": "cage-fight-face-a-face-octagon-mma-toulouse.jpg",
    "Design sans titre (47).png": "cage-fight-logo-mma-boxing-center.png",
}


def main() -> None:
    if not SRC.is_dir():
        raise SystemExit(f"Dossier introuvable: {SRC}")

    files = {p.name: p for p in SRC.iterdir() if p.is_file()}
    missing = [name for name in RENAMES if name not in files]
    if missing:
        raise SystemExit(f"Fichiers manquants: {missing}")

    temp = []
    for old_name, new_name in RENAMES.items():
        src = files[old_name]
        if src.name == new_name:
            continue
        tmp = SRC / f"__tmp__{new_name}"
        src.rename(tmp)
        temp.append((tmp, SRC / new_name))
        print(f"  {old_name} -> {new_name}")

    for tmp, dest in temp:
        tmp.rename(dest)

    print(f"\n{len(RENAMES)} fichiers renommés dans {SRC.name}")


if __name__ == "__main__":
    main()
