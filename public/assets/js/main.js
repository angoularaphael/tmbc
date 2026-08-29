(() => {
  document.documentElement.classList.add("fx");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const nav = $(".nav");
  const onScroll = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".burger");
  const menu = $("#menu");
  if (burger && menu) {
    const close = () => {
      menu.classList.remove("is-open");
      menu.hidden = true;
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", () => {
      const open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  const observe = () => {
    const nodes = $$("[data-reveal], [data-reveal-group]");
    if (!nodes.length) return;
    if (reduce) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((n) => io.observe(n));
    requestAnimationFrame(() => {
      nodes.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < innerHeight * 0.9) {
          n.classList.add("is-in");
          io.unobserve(n);
        }
      });
    });
  };

  const counts = () => {
    $$("[data-count]").forEach((el) => {
      const target = Number(el.getAttribute("data-count"));
      if (reduce) { el.textContent = String(target); return; }
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / 1200);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 4))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      io.observe(el);
    });
  };

  const ticker = () => {
    const track = $("#marquee");
    const items = window.TMBC?.ticker;
    if (!track || !items) return;
    const row = items.map((i) => `<span>${i}</span>`).join("");
    track.innerHTML = row + row;
  };

  const configurator = () => {
    const list = $("#config-list");
    const mediaBox = $("#config-media");
    const body = $("#config-body");
    const bg = $("#config-bg");
    const discs = window.TMBC?.disciplines;
    if (!list || !discs) return;
    const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    if (bg) {
      bg.innerHTML = discs.map((d, i) =>
        `<div class="media ${i === 0 ? "is-active" : ""}"><img src="${d.img}" alt="" /></div>`
      ).join("");
    }
    list.innerHTML = discs.map((d, i) => `
      <button class="cfg ${i === 0 ? "is-active" : ""}" type="button" role="tab"
        aria-selected="${i === 0}" id="cfg-${d.key}" data-i="${i}">
        <span class="cfg__n">${d.n}</span>
        <span class="cfg__name">${d.name}</span>
        <span class="cfg__tag">${d.tag}</span>
      </button>`).join("");
    if (mediaBox) {
      mediaBox.innerHTML = discs.map((d, i) =>
        `<div class="media ${i === 0 ? "is-active" : ""}"><img src="${d.img}" alt="${esc(d.alt)}" /></div>`
      ).join("");
    }
    const sheet = (d) => `
      <div class="config__facts">
        <span><b>Jours</b> ${d.jours}</span>
        <span><b>Niveau</b> ${d.niveau}</span>
      </div>
      <p class="config__desc">${d.teaser}</p>
      <div class="config__cta">
        <a class="btn btn--primary" href="${window.TMBC.boutique.essai}">Essayer · 10 €</a>
        <a class="btn" href="${window.TMBC.planning}" target="_blank" rel="noopener">Les créneaux</a>
        <a class="btn" href="/activites#${d.key}">En détail</a>
      </div>`;
    if (body) body.innerHTML = sheet(discs[0]);
    let curr = 0;
    let seq = 0;
    let hoverT = 0;
    const select = (i) => {
      if (i === curr || !discs[i]) return;
      curr = i;
      const token = ++seq;
      const d = discs[i];
      [...list.children].forEach((b, k) => {
        b.classList.toggle("is-active", k === i);
        b.setAttribute("aria-selected", String(k === i));
      });
      if (mediaBox) [...mediaBox.children].forEach((m, k) => m.classList.toggle("is-active", k === i));
      if (bg) [...bg.children].forEach((m, k) => m.classList.toggle("is-active", k === i));
      if (!body) return;
      body.classList.add("is-swapping");
      setTimeout(() => {
        if (token !== seq) return;
        body.innerHTML = sheet(d);
        body.classList.remove("is-swapping");
      }, reduce ? 0 : 180);
    };
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    list.addEventListener("click", (e) => {
      const b = e.target.closest(".cfg");
      if (b) { clearTimeout(hoverT); select(+b.dataset.i); }
    });
    list.addEventListener("pointerover", (e) => {
      if (!fine.matches || e.pointerType === "touch") return;
      const b = e.target.closest(".cfg");
      if (!b) return;
      clearTimeout(hoverT);
      hoverT = setTimeout(() => select(+b.dataset.i), 80);
    });
  };

  const wipeNav = () => {
    if (reduce) return;
    const go = (href) => {
      sessionStorage.setItem("tmbc-wipe", "1");
      document.body.classList.add("is-leaving");
      setTimeout(() => { window.location.href = href; }, 460);
    };
    $$("a[href]").forEach((a) => {
      const raw = a.getAttribute("href") || "";
      if (!raw.startsWith("/") && !raw.endsWith(".html")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && !url.hash) return;
      if (url.hash && url.pathname === location.pathname) return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
        e.preventDefault();
        go(a.href);
      });
    });
    if (sessionStorage.getItem("tmbc-wipe")) {
      sessionStorage.removeItem("tmbc-wipe");
      document.body.classList.add("is-entering");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.body.classList.add("is-entered");
          document.body.classList.remove("is-entering");
          setTimeout(() => document.body.classList.remove("is-entered"), 500);
        });
      });
    }
  };

  const filterSet = (rootSel, itemSel, attr) => {
    const root = $(rootSel);
    if (!root) return;
    const chips = $$("[data-filter]", root);
    const items = $$(itemSel);
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => {
          c.classList.toggle("is-on", c === chip);
          c.setAttribute("aria-pressed", String(c === chip));
        });
        const val = chip.getAttribute("data-filter");
        items.forEach((item) => {
          const hit = val === "all" || item.getAttribute(attr) === val;
          item.classList.toggle("is-off", !hit);
        });
        $$(".plan-day").forEach((day) => {
          const rows = $$("li", day);
          if (!rows.length) return;
          day.hidden = rows.every((row) => row.classList.contains("is-off"));
        });
      });
    });
  };

  const lightbox = () => {
    const box = $("#lightbox");
    if (!box) return;
    const img = $("img", box);
    const close = () => { box.classList.remove("is-on"); box.setAttribute("aria-hidden", "true"); };
    $$("[data-full]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        img.src = a.getAttribute("data-full");
        img.alt = $("img", a)?.alt || "";
        box.classList.add("is-on");
        box.setAttribute("aria-hidden", "false");
      });
    });
    box.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  };

  $$(".video-pocket video").forEach((video) => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.35 });
    io.observe(video);
  });

  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const prenom = String(fd.get("prenom") || "").trim();
      const tel = String(fd.get("tel") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const msg = String(fd.get("msg") || "").trim();
      const body = encodeURIComponent(
        `Prénom : ${prenom}\nTéléphone : ${tel}\nE-mail : ${email}\n\n${msg}`
      );
      window.location.href = `mailto:boxingcentertls@gmail.com?subject=${encodeURIComponent("Contact TMBC — " + prenom)}&body=${body}`;
      form.hidden = true;
      const ok = $("#form-ok");
      if (ok) ok.hidden = false;
    });
  }

  const parallax = () => {
    if (reduce) return;
    const nodes = $$("[data-parallax]");
    if (!nodes.length) return;
    const tick = () => {
      nodes.forEach((n) => {
        const r = n.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        n.style.transform = `translate3d(0, ${p * 24}px, 0) scale(1.06)`;
      });
    };
    window.addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true });
    tick();
  };

  observe();
  counts();
  ticker();
  configurator();
  wipeNav();
  filterSet("#plan-filters", ".plan-day li", "data-disc");
  filterSet("#gal-filters", ".gallery-grid .shot", "data-zone");
  lightbox();
  parallax();

  const totop = document.createElement("button");
  totop.className = "totop";
  totop.type = "button";
  totop.setAttribute("aria-label", "Retour en haut de la page");
  totop.textContent = "↑";
  document.body.appendChild(totop);
  const tickTop = () => totop.classList.toggle("is-on", window.scrollY > 480);
  window.addEventListener("scroll", tickTop, { passive: true });
  tickTop();
  totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  const shop = window.TMBC?.boutique || {};
  const offre29 = shop.offre29 || "https://boutique.boxingcenter.fr/offre/29";
  const offre259 = shop.offre259 || "https://boutique.boxingcenter.fr/offre/259";
  const OFFERS = [
    { price: 29, label: "4 semaines", lead: "Sans engagement · toutes activités", href: offre29 },
    { price: 259, label: "12 mois", lead: "1× ou 4× sans frais · 5 salles", href: offre259 },
  ];

  const dockBar = () => {
    if (document.querySelector(".dock")) return;
    const bar = document.createElement("div");
    bar.className = "dock";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Inscription");
    const prices = ["29&nbsp;€", "259&nbsp;€"];
    bar.innerHTML = `
      <p class="dock__copy"><span class="dock__live"><i></i>Tirage</span>Offre rentrée<span>4 semaines ou saison</span></p>
      <div class="dock__reel" aria-hidden="true"><span class="dock__mark"></span><div class="dock__strip">${Array.from({ length: 8 }, (_, i) => `<div class="dock__row">${prices[i % 2]}</div>`).join("")}</div></div>
      <p class="dock__btns">
        <a class="btn btn--primary" data-dock-29 href="${offre29}">29 €</a>
        <a class="btn btn--ghost" data-dock-259 href="${offre259}">259 €</a>
      </p>`;
    document.body.appendChild(bar);
    const btn29 = $("[data-dock-29]", bar);
    const btn259 = $("[data-dock-259]", bar);
    const hotSwap = () => {
      if (reduce) return;
      const hot29 = Math.random() < 0.5;
      btn29.classList.toggle("btn--primary", hot29);
      btn29.classList.toggle("btn--ghost", !hot29);
      btn29.classList.toggle("is-hot", hot29);
      btn29.classList.toggle("is-dim", !hot29);
      btn259.classList.toggle("btn--primary", !hot29);
      btn259.classList.toggle("btn--ghost", hot29);
      btn259.classList.toggle("is-hot", !hot29);
      btn259.classList.toggle("is-dim", hot29);
    };
    if (!reduce) setInterval(hotSwap, 2800);
    const show = () => {
      const drawOpen = !!document.querySelector(".draw.is-open");
      const on = !drawOpen && (window.scrollY > 280 || document.body.classList.contains("dock-ready"));
      bar.classList.toggle("is-on", on);
      document.body.classList.toggle("has-dock", on);
    };
    window.addEventListener("scroll", show, { passive: true });
    show();
    dockBar.refresh = show;
  };
  dockBar.refresh = () => {};

  const offerDraw = () => {
    const home = location.pathname === "/" || /\/index\.html?$/.test(location.pathname);
    if (!home) return;
    try {
      if (sessionStorage.getItem("tmbc_draw_seen") === "1") return;
    } catch { /* continue */ }

    const rows = [];
    for (let i = 0; i < 18; i += 1) rows.push(OFFERS[i % 2]);
    const pick = OFFERS[Math.random() < 0.5 ? 0 : 1];
    const stopAt = 12 + (pick.price === 29 ? 0 : 1);

    const root = document.createElement("div");
    root.className = "draw";
    root.id = "offerDraw";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "drawTitle");
    root.innerHTML = `
      <div class="draw__panel">
        <button type="button" class="draw__close" data-draw-close aria-label="Fermer">×</button>
        <span class="draw__eyebrow">Offre du jour</span>
        <h2 class="draw__title" id="drawTitle">29 € ou 259 €</h2>
        <p class="draw__lead">On fait défiler le tableau. Ça s’arrête sur une offre.</p>
        <div class="draw__board" aria-hidden="true">
          <span class="draw__mark"></span>
          <div class="draw__window">
            <div class="draw__strip" id="drawStrip">
              ${rows.map((o, i) => `<div class="draw__row${i === stopAt ? " is-hit" : ""}"><b>${o.price}&nbsp;€</b></div>`).join("")}
            </div>
          </div>
        </div>
        <div class="draw__actions">
          <button type="button" class="btn btn--primary" data-draw-go>Lancer le tableau</button>
          <a class="draw__alt" href="${offre29}">Voir les deux offres</a>
        </div>
      </div>`;
    document.body.appendChild(root);

    const strip = $("#drawStrip", root);
    const goBtn = $("[data-draw-go]", root);
    const rowH = 56;
    const centerOffset = 56;
    const setY = (index, ms) => {
      const y = -(index * rowH) + centerOffset;
      strip.style.transition = reduce || !ms ? "none" : `transform ${ms}ms cubic-bezier(0.13, 0.82, 0.18, 1)`;
      strip.style.transform = `translateY(${y}px)`;
    };
    setY(1, 0);

    const markSeen = () => {
      try { sessionStorage.setItem("tmbc_draw_seen", "1"); } catch { /* ignore */ }
    };
    const close = () => {
      root.classList.remove("is-open");
      markSeen();
      document.body.classList.remove("draw-open");
      document.body.classList.add("dock-ready");
      dockBar.refresh();
    };
    const land = () => {
      if (root.classList.contains("is-landed")) return;
      root.classList.add("is-landed");
      const cta = document.createElement("a");
      cta.className = "btn btn--primary";
      cta.href = pick.href;
      cta.textContent = `Je prends ${pick.price} € — ${pick.label}`;
      goBtn.replaceWith(cta);
      const lead = $(".draw__lead", root);
      if (lead) lead.textContent = `${pick.price} € · ${pick.lead}`;
      const other = OFFERS.find((o) => o.price !== pick.price);
      const alt = $(".draw__alt", root);
      if (alt && other) {
        alt.href = other.href;
        alt.textContent = `Plutôt ${other.price} € ?`;
      }
    };

    const spin = () => {
      if (root.classList.contains("is-spinning") || root.classList.contains("is-landed")) return;
      root.classList.add("is-spinning");
      goBtn.disabled = true;
      goBtn.textContent = "…";
      if (reduce) {
        setY(stopAt, 0);
        land();
        return;
      }
      setY(stopAt, 2200);
      setTimeout(land, 2250);
    };

    goBtn.addEventListener("click", spin);
    root.querySelectorAll("[data-draw-close]").forEach((b) => b.addEventListener("click", close));
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("is-open")) close(); });

    setTimeout(() => {
      root.classList.add("is-open");
      document.body.classList.add("draw-open");
      dockBar.refresh();
    }, 800);
  };

  dockBar();
  offerDraw();
})();
