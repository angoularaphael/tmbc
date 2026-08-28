export const SITE = {
  name: "Toulouse Minimes Boxing Club",
  short: "TMBC",
  url: "https://toulouse-minimes-boxing-club.fr",
  phone: "05 62 24 46 82",
  tel: "+33562244682",
  email: "boxingcenter31@gmail.com",
  address: "12 rue de Fenouillet",
  zip: "31200",
  city: "Toulouse",
  hours: "Lun–sam 10h–21h30",
  instagram: "https://www.instagram.com/boxingcentertoulouse/",
  facebook: "https://www.facebook.com/BoxingCenterToulouse/",
};

export const LINKS = {
  boutique: "https://boutique.boxingcenter.fr/",
  rentree: "https://boutique.boxingcenter.fr/offre/29",
  saison: "https://boutique.boxingcenter.fr/offre/259",
  essai: "https://boutique.boxingcenter.fr/seance-essai",
  abos: "https://boutique.boxingcenter.fr/abonnements",
  wordpress: "https://boxe-toulouse.com/",
  groupe: "https://boxingcenter.fr/",
};

export const NAV = [
  { href: "/", label: "Accueil", id: "home" },
  { href: "/club/", label: "Le club", id: "club" },
  { href: "/disciplines/", label: "Disciplines", id: "disciplines" },
  { href: "/planning-tarifs/", label: "Planning & tarifs", id: "planning" },
  { href: "/galerie/", label: "Galerie", id: "galerie" },
  { href: "/contact/", label: "Contact", id: "contact" },
];

export const SALLES = [
  { name: "Minimes", tag: "Le club historique", url: "https://boxe-toulouse.com/" },
  { name: "Portet-sur-Garonne", tag: "Le vaisseau amiral", url: "https://boxingcenter.fr/salle-de-sport-toulouse/salle-de-boxe-portet-sur-garonne-2/" },
  { name: "États-Unis", tag: "Le colosse", url: "https://boxingcenter.fr/salle-de-sport-toulouse/boxing-center-salle-de-toulouse-etats-unis/" },
  { name: "Saint-Cyprien", tag: "La rive gauche", url: "https://boxingcenter.fr/salle-de-sport-toulouse/boxing-center-salle-de-toulouse-saint-cyprien/" },
  { name: "Ramonville", tag: "L’octogone à ciel ouvert", url: "https://boxingcenter.fr/salle-de-sport-toulouse/salle-de-boxe-toulouse-ramonville/" },
];

export const GEO = {
  lat: 43.6256,
  lng: 1.4309,
  region: "FR-31",
  placename: "Toulouse — Les Minimes / Barrière de Paris",
};

export const OG_IMAGE = "/assets/media/ring-tmbc-1200.webp";
export const OG_ALT = "Ring du club de boxe TMBC à Toulouse Minimes — boxe anglaise, loisirs et compétition";

export const KEYWORDS = {
  home: "club de boxe Toulouse, salle de boxe Toulouse, cours de boxe Toulouse, boxe anglaise Toulouse, boxing club Toulouse, club de boxe Minimes, salle de boxe Barrière de Paris, boxe Toulouse nord, boxe débutant Toulouse, boxe femme Toulouse, école de boxe Toulouse, baby boxe Toulouse, boxing lady Toulouse, club de boxe 31200, gym boxe Toulouse, association boxe Toulouse, TMBC, Toulouse Minimes Boxing Club",
  club: "association boxe Toulouse, club de boxe Minimes, salle de boxe Toulouse historique, coach boxe Toulouse, ring de boxe Toulouse, sacs de frappe Toulouse, FFBoxe Toulouse, club boxe anglaise Toulouse, boxing center Minimes, berceau Boxing Center",
  disciplines: "cours de boxe Toulouse, boxe anglaise Toulouse, boxing lady Toulouse, boxe femme Toulouse, école de boxe Toulouse, baby boxe Toulouse, boxe enfants Toulouse, boxe compétition Toulouse, boxing camp Toulouse, cardio boxing Toulouse, pieds-poings Toulouse, cours boxe débutant Toulouse",
  planning: "planning boxe Toulouse, horaires club de boxe Toulouse, tarif boxe Toulouse, prix cours de boxe Toulouse, essai boxe 10 euros, offre boxe 29 euros, abonnement boxe 259 euros, inscription boxe Toulouse, planning TMBC Minimes",
  galerie: "photos club de boxe Toulouse, photos salle de boxe Minimes, ring boxe Toulouse, galerie TMBC, images boxe anglaise Toulouse",
  contact: "club de boxe Toulouse adresse, salle de boxe Barrière de Paris, 12 rue de Fenouillet, métro Barrière de Paris boxe, club de boxe Minimes accès, téléphone salle de boxe Toulouse, boxe Lalande, boxe Borderouge, boxe Bonnefoy, boxe Aucamville, boxe Launaguet",
};

export function clubGraph({ title, description, url, crumbs = [] }) {
  const clubId = `${SITE.url}/#club`;
  const siteId = `${SITE.url}/#website`;
  const pageId = `${url}#webpage`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SportsClub", "SportsActivityLocation"],
        "@id": clubId,
        name: SITE.name,
        alternateName: ["TMBC", "Toulouse Minimes Boxing Center", "Boxing Center Minimes"],
        url: `${SITE.url}/`,
        telephone: SITE.tel,
        email: SITE.email,
        image: `${SITE.url}${OG_IMAGE}`,
        logo: `${SITE.url}/assets/img/favicon.svg`,
        sport: ["Boxing", "English boxing", "Boxe anglaise"],
        description:
          "Club de boxe à Toulouse Minimes : salle de boxe anglaise, cours débutants, Boxing Lady, école dès 3 ans, compétition. 12 rue de Fenouillet, métro B Barrière de Paris.",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address,
          postalCode: SITE.zip,
          addressLocality: SITE.city,
          addressRegion: "Occitanie",
          addressCountry: "FR",
        },
        geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lng },
        hasMap: `https://www.google.com/maps/search/?api=1&query=${GEO.lat},${GEO.lng}`,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "10:00",
          closes: "21:30",
        },
        sameAs: [SITE.instagram, SITE.facebook, LINKS.wordpress, LINKS.groupe, LINKS.boutique],
        priceRange: "€",
        memberOf: { "@type": "Organization", name: "Boxing Center", url: LINKS.groupe },
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: `${SITE.url}/`,
        name: SITE.name,
        inLanguage: "fr-FR",
        publisher: { "@id": clubId },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url,
        name: title,
        description,
        inLanguage: "fr-FR",
        isPartOf: { "@id": siteId },
        about: { "@id": clubId },
        primaryImageOfPage: { "@type": "ImageObject", url: `${SITE.url}${OG_IMAGE}` },
      },
      crumbs.length
        ? {
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.name,
              item: c.href.startsWith("http") ? c.href : `${SITE.url}${c.href}`,
            })),
          }
        : null,
    ].filter(Boolean),
  };
}
