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
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
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
        <a class="btn" href="planning.html">Les créneaux</a>
        <a class="btn" href="activites.html#${d.key}">En détail</a>
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
    $$('a[href$=".html"]').forEach((a) => {
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
      form.hidden = true;
      const ok = $("#form-ok");
      if (ok) ok.hidden = false;
    });
  }

  const progress = () => {
    let bar = $(".scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.prepend(bar);
    }
    const tick = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    window.addEventListener("scroll", tick, { passive: true });
    tick();
  };

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
  progress();
  parallax();
})();
