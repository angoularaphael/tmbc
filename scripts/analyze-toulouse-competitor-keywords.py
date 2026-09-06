#!/usr/bin/env python3
"""Build a reproducible SEO keyword inventory for Toulouse boxing competitors."""

from __future__ import annotations

import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


COMPETITORS = {
    "boxingcenter": "https://boxingcenter.fr/",
    "toulouse_fight_club": "https://www.fight-club.fr/",
    "academie_boxe_toulouse": "https://academieboxetoulouse.fr/",
    "as_boxing": "https://www.as-boxing.com/",
    "boxing_montane": "https://www.montaneboxingtoulouse.com/",
    "royal_naresuan_boxing": "https://www.royalnaresuanboxing.com/",
    "toulouse_savate_club": "https://www.tsc31.fr/",
    "cage_fight": "https://club-mma-toulouse.com/",
    "tactical_fight_team": "https://www.tactical-fight-team.com/",
    "cornebarrieu_fitness_center": "https://www.cfc31.fr/",
    "sport_and_perf": "https://www.sportandperf.fr/",
}
OUTPUT = Path(__file__).resolve().parents[1] / "src" / "data" / "concurrents-toulouse-mots-cles.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; TMBC-SEO-Research/2.0)"}
MAX_URLS_PER_SITE = 1000
NON_HTML_EXTENSIONS = {
    ".avif", ".css", ".csv", ".doc", ".docx", ".gif", ".ico", ".jpeg", ".jpg",
    ".js", ".json", ".mp3", ".mp4", ".pdf", ".png", ".svg", ".webm", ".webp",
    ".xls", ".xlsx", ".xml", ".zip",
}

STOPWORDS = {
    "a", "afin", "ainsi", "alors", "au", "aucun", "aucune", "aux", "avec", "avoir",
    "car", "ce", "ces", "cet", "cette", "chez", "comme", "comment", "dans", "de", "des",
    "donc", "du", "elle", "elles", "en", "encore", "est", "et", "etre", "eux", "fait",
    "font", "grace", "il", "ils", "je", "la", "le", "les", "leur", "leurs", "mais", "mes",
    "mon", "ne", "nos", "notre", "nous", "on", "ont", "ou", "par", "pas", "plus", "pour",
    "que", "quel", "quelle", "qui", "sa", "sans", "se", "ses", "si", "son", "sont", "sur",
    "tous", "tout", "toute", "toutes", "un", "une", "vos", "votre", "vous", "y",
    "accueil", "contact", "copyright", "menu", "lire", "voir", "decouvrez", "cliquez",
}
CLUSTERS = {
    "boxe_anglaise": r"\b(boxe anglaise|noble art|boxeur|boxe loisir|boxe amateur|boxe professionnelle)\b",
    "boxe_thai_kickboxing": r"\b(boxe thai|muay thai|kick boxing|kickboxing|k1|striking|pieds poings)\b",
    "mma": r"\b(mma|mixed martial arts|arts martiaux mixtes|octogone|cage fight|ufc)\b",
    "boxe_educative_enfants": r"\b(boxe educative|baby boxe|enfant|enfants|ado|ados|jeune boxeur|ecole de boxe)\b",
    "grappling_jjb_sol": r"\b(grappling|jiu jitsu|jujitsu|jjb|no gi|combat au sol|soumission)\b",
    "savate_boxe_francaise": r"\b(savate|boxe francaise|canne de combat|fouette|chasse)\b",
    "self_defense_lutte": r"\b(krav maga|self defense|lutte|combat rapproche)\b",
    "fitness_condition_physique": r"\b(cross training|crossfit|fitness|musculation|cardio|hyrox|boxing camp|boxing training|remise en forme)\b",
    "femmes_inclusion": r"\b(boxing lady|lady boxing|boxe feminine|mma feminin|femme|femmes|handiboxe|sport adapte|inclusif)\b",
    "technique_entrainement": r"\b(pattes d ours|paos|sparring|open sparring|entrainement|technique|sac de frappe|preparation physique)\b",
    "niveaux_objectifs": r"\b(debutant|confirme|loisir|competition|competiteur|professionnel|tous niveaux|initiation|perte de poids|performance)\b",
    "localites": r"\b(toulouse|minimes|barriere de paris|portet|ramonville|saint cyprien|st cyprien|etats unis|balma|gramont|montaudran|purpan|basso cambo|saint michel|cornebarrieu|blagnac|colomiers|muret|roques|leguevin|patte d oie|saouzelong)\b",
    "offres_conversion": r"\b(tarif|prix|abonnement|adhesion|formule|offre|promo|inscription|seance d essai|cours d essai|planning|horaires|pass sport)\b",
    "encadrement_valeurs": r"\b(coach|entraineur|diplome|discipline|respect|confiance en soi|maitrise de soi|perseverance|convivial)\b",
    "evenements_actualites": r"\b(gala|fight event|boxing trophy|combat|champion|championnat|actualite|stage|tournoi)\b",
    "entreprises_services": r"\b(entreprise|cse|coaching individuel|coaching prive|personal training|team training|cours particulier)\b",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(c for c in value if not unicodedata.combining(c)).lower()
    value = value.replace("’", "'")
    value = re.sub(r"[^a-z0-9€'\-]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def fetch(url: str, timeout: int = 20) -> requests.Response:
    response = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    return response


def sitemap_locations(xml_url: str, seen: set[str] | None = None) -> list[str]:
    seen = seen or set()
    if xml_url in seen:
        return []
    seen.add(xml_url)
    try:
        response = fetch(xml_url)
        if "xml" not in response.headers.get("content-type", "") and not response.text.lstrip().startswith("<?xml"):
            return []
        soup = BeautifulSoup(response.text, "xml")
        locations = [tag.get_text(strip=True) for tag in soup.find_all("loc")]
        nested = [loc for loc in locations if loc.lower().split("?")[0].endswith(".xml")]
        if nested:
            urls: list[str] = []
            for child in nested:
                urls.extend(sitemap_locations(child, seen))
            return urls
        return locations
    except Exception:
        return []


def discover_urls(root: str) -> list[str]:
    candidates = [urljoin(root, "sitemap_index.xml"), urljoin(root, "sitemap.xml")]
    try:
        robots = fetch(urljoin(root, "robots.txt")).text
        candidates = re.findall(r"(?im)^sitemap:\s*(\S+)", robots) + candidates
    except Exception:
        pass
    root_host = urlparse(root).netloc.lower().removeprefix("www.")
    urls: list[str] = []
    for sitemap in dict.fromkeys(candidates):
        urls.extend(sitemap_locations(sitemap))
    valid = []
    for url in dict.fromkeys([root] + urls):
        parsed = urlparse(url)
        host = parsed.netloc.lower().removeprefix("www.")
        suffix = Path(parsed.path).suffix.lower()
        is_html_page = not suffix or suffix in {".html", ".htm", ".php"}
        is_content_page = not re.search(r"(?:^|/)(?:wp-admin|feed|inscription-send)(?:/|$)", parsed.path)
        if host == root_host and parsed.scheme in {"http", "https"} and is_html_page and is_content_page:
            valid.append(url)
    return valid[:MAX_URLS_PER_SITE]


def phrase_counter(value: str, max_ngram: int = 4) -> Counter[str]:
    words = [word.strip("'-") for word in normalize(value).split() if word.strip("'-")]
    output: Counter[str] = Counter()
    for size in range(1, max_ngram + 1):
        for index in range(len(words) - size + 1):
            chunk = words[index:index + size]
            if chunk[0] in STOPWORDS or chunk[-1] in STOPWORDS:
                continue
            if all(word in STOPWORDS or word.isdigit() for word in chunk):
                continue
            phrase = " ".join(chunk)
            if len(phrase) >= 4 and not re.fullmatch(r"[\d€\- ]+", phrase):
                output[phrase] += 1
    return output


def extract_page(site_id: str, url: str) -> dict:
    response = fetch(url)
    soup = BeautifulSoup(response.text, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    description_tag = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    description = description_tag.get("content", "").strip() if description_tag else ""
    headings = {
        level: [tag.get_text(" ", strip=True) for tag in soup.find_all(level)]
        for level in ("h1", "h2", "h3")
    }
    for tag in soup(["script", "style", "noscript", "svg", "form"]):
        tag.decompose()
    for selector in ("header", "footer", "nav"):
        for tag in soup.select(selector):
            tag.decompose()
    body = soup.get_text(" ", strip=True)
    weighted: Counter[str] = Counter()
    for value, weight in (
        (title, 12), (description, 7), (" ".join(headings["h1"]), 10),
        (" ".join(headings["h2"]), 5), (" ".join(headings["h3"]), 3), (body, 1),
    ):
        for phrase, count in phrase_counter(value).items():
            weighted[phrase] += count * weight
    slug = urlparse(response.url).path.strip("/").replace("-", " ")
    for phrase, count in phrase_counter(slug).items():
        weighted[phrase] += count * 10
    return {
        "site_id": site_id,
        "url": response.url,
        "title": title,
        "meta_description": description,
        "h1": headings["h1"],
        "_scores": weighted,
    }


def quality(phrase: str, score: float) -> bool:
    words = phrase.split()
    if score < 5 or len(words) > 4:
        return False
    if len(words) == 1 and (score < 20 or words[0] in STOPWORDS):
        return False
    return not re.search(r"\b(cookie|privacy|politique confidentialite|mentions legales)\b", phrase)


def intent(phrase: str) -> str:
    if re.search(r"\b(prix|tarif|abonnement|adhesion|offre|promo|inscription|essai|formule|pass sport)\b", phrase):
        return "transactionnelle"
    if re.search(CLUSTERS["localites"], phrase):
        return "locale"
    if re.search(r"\b(planning|horaires|contact|salle|club|coach)\b", phrase):
        return "navigation_locale"
    if re.search(r"\b(comment|pourquoi|bienfait|technique|definition|conseil)\b", phrase):
        return "informationnelle"
    return "informationnelle"


def priority(score: float, rank: int) -> str:
    if rank < 20 or score >= 130:
        return "haute"
    if rank < 80 or score >= 55:
        return "moyenne"
    return "longue_traine"


def ranked_keywords(pages: list[dict], limit: int) -> list[dict]:
    df: Counter[str] = Counter()
    for page in pages:
        df.update(page["_scores"].keys())
    scores: Counter[str] = Counter()
    for page in pages:
        for phrase, raw in page["_scores"].items():
            weighted = raw * (math.log((len(pages) + 1) / (df[phrase] + 1)) + 1)
            if quality(phrase, weighted):
                scores[phrase] += weighted
    ranked = sorted(scores.items(), key=lambda item: (-item[1], -len(item[0]), item[0]))[:limit]
    return [
        {
            "keyword": phrase,
            "score_presence": round(score, 2),
            "pages": df[phrase],
            "intention": intent(phrase),
            "priority": priority(score, index),
        }
        for index, (phrase, score) in enumerate(ranked)
    ]


def compact_page(page: dict, all_pages: list[dict]) -> dict:
    local = ranked_keywords([page], 35)
    return {
        "url": page["url"],
        "title": page["title"],
        "meta_description": page["meta_description"],
        "h1": page["h1"],
        "keywords": local,
    }


def main() -> None:
    discovered = {site_id: discover_urls(root) for site_id, root in COMPETITORS.items()}
    jobs = [(site_id, url) for site_id, urls in discovered.items() for url in urls]
    pages: list[dict] = []
    failures: list[dict] = []
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(extract_page, site_id, url): (site_id, url) for site_id, url in jobs}
        for future in as_completed(futures):
            site_id, url = futures[future]
            try:
                page = future.result()
                pages.append(page)
                print(f"OK {site_id}: {url}")
            except Exception as error:
                failures.append({"site_id": site_id, "url": url, "error": str(error)})
                print(f"FAIL {site_id}: {url}: {error}")

    global_keywords = ranked_keywords(pages, 1000)
    global_clusters: dict[str, list[dict]] = defaultdict(list)
    for item in global_keywords:
        for cluster, pattern in CLUSTERS.items():
            if re.search(pattern, normalize(item["keyword"])):
                global_clusters[cluster].append(item)

    competitors = {}
    for site_id, root in COMPETITORS.items():
        site_pages = sorted((p for p in pages if p["site_id"] == site_id), key=lambda p: p["url"])
        site_keywords = ranked_keywords(site_pages, 400) if site_pages else []
        site_clusters: dict[str, list[dict]] = defaultdict(list)
        for item in site_keywords:
            for cluster, pattern in CLUSTERS.items():
                if re.search(pattern, normalize(item["keyword"])):
                    site_clusters[cluster].append(item)
        competitors[site_id] = {
            "domain": urlparse(root).netloc,
            "root_url": root,
            "urls_discovered": len(discovered[site_id]),
            "pages_analyzed": len(site_pages),
            "keywords": site_keywords,
            "clusters": dict(site_clusters),
            "pages": [compact_page(page, pages) for page in site_pages],
        }

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "language": "fr",
            "scope": "Tous les mots-clés SEO observables des 11 concurrents demandés, toutes disciplines et intentions",
            "competitors": len(COMPETITORS),
            "pages_discovered": len(jobs),
            "pages_analyzed": len(pages),
            "pages_failed": len(failures),
            "keyword_limit_global": 1000,
            "methodology": (
                "Crawl des sitemaps et pages publiques; extraction pondérée des titles, meta descriptions, "
                "H1-H3, slugs et contenu visible; n-grammes de 1 à 4 mots, déduplication et pondération par "
                "spécificité inter-pages. score_presence mesure la force éditoriale observée, pas le volume Google."
            ),
        },
        "summary": {
            "global_keywords_listed": len(global_keywords),
            "clusters": list(CLUSTERS.keys()),
            "domains": [urlparse(url).netloc for url in COMPETITORS.values()],
        },
        "all_keywords": global_keywords,
        "clusters": dict(global_clusters),
        "competitors": competitors,
        "failures": failures,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {OUTPUT}: {len(pages)} pages, {len(global_keywords)} global keywords")


if __name__ == "__main__":
    main()
