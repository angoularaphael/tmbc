# -*- coding: utf-8 -*-
"""Renomme les photos WeTransfer fiche Google avec des noms SEO."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "wetransfer_photos-tmbc-fiche-google_2026-09-03_0954"

RENAMES = {
    "DSC01412.jpg": "google-fiche-sacs-de-frappe-boxe-toulouse-tmbc.jpg",
    "DSC01416.jpg": "google-fiche-entrainement-sac-de-frappe-toulouse.jpg",
    "DSC01424.jpg": "google-fiche-salle-boxe-toulouse-deux-rings.jpg",
    "DSC01479.jpg": "google-fiche-sparring-ring-boxe-toulouse-01.jpg",
    "DSC01525.jpg": "google-fiche-sparring-ring-boxe-toulouse-02.jpg",
    "DSC01539.jpg": "google-fiche-assaut-boxe-anglaise-toulouse-ring.jpg",
    "DSC01551.jpg": "google-fiche-cours-sparring-boxe-toulouse-minimes.jpg",
    "DSC01585.jpg": "google-fiche-entrainement-collectif-boxe-toulouse.jpg",
    "DSC01611.jpg": "google-fiche-boxeurs-champion-boxing-center-toulouse.jpg",
    "IMG_5335-Avec accentuation-Bruit.jpg": "google-fiche-salle-boxe-toulouse-interieur.jpg",
    "PHOTO-2025-04-19-18-15-13 18.jpg": "google-fiche-combat-boxe-professionnel-wbc-01.jpg",
    "PHOTO-2025-04-19-18-15-13 19.jpg": "google-fiche-combat-boxe-professionnel-coup-poing.jpg",
    "PHOTO-2025-04-19-18-15-13 20.jpg": "google-fiche-combat-boxe-professionnel-wbc-02.jpg",
    "WhatsApp Image 2023-05-04 at 20.26.56.jpeg": "google-fiche-portrait-boxeur-metal-boxe-toulouse.jpeg",
    "WhatsApp Image 2023-08-11 at 16.42.40 (1).jpeg": "google-fiche-coach-pattes-dours-boxe-toulouse.jpeg",
    "WhatsApp Image 2024-10-02 at 09.13.56 (2).jpeg": "google-fiche-boxeur-competition-amateur-toulouse.jpeg",
    "WhatsApp Image 2025-03-05 at 21.02.00 (1).jpeg": "google-fiche-boxeur-ring-competition-toulouse.jpeg",
    "WhatsApp Image 2025-03-06 at 09.53.05.jpeg": "google-fiche-boxeur-amateur-casque-boxing-center.jpeg",
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
