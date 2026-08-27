(() => {
  document.documentElement.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const header = $(".site-header");
  const roundEl = $("[data-round]");

  const onScrollHeader = () => {
    if (header) header.classList.toggle("is-solid", window.scrollY > 24);
  };

  const toggle = $(".nav-toggle");
  const nav = $("#nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  const splitPunches = () => {
    if (reduce) return;
    $$("[data-punch]").forEach((el) => {
      const text = el.textContent.trim();
      el.textContent = "";
      [...text].forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "punch-letter";
        span.textContent = ch === " " ? "\u00a0" : ch;
        span.style.animationDelay = `${i * 55}ms`;
        el.appendChild(span);
      });
    });
  };

  const armPunches = (root = document) => {
    root.querySelectorAll?.(".punch-letter")?.forEach((s) => s.classList.add("is-in"));
    if (root.classList?.contains?.("punch-letter")) root.classList.add("is-in");
    root.querySelectorAll?.("[data-punch] .punch-letter").forEach((s) => s.classList.add("is-in"));
  };

  const observeReveals = () => {
    const nodes = $$("[data-reveal], [data-stagger]");
    nodes.forEach((n) => {
      if (!n.hasAttribute("data-reveal") && n.hasAttribute("data-stagger")) {
        n.setAttribute("data-reveal", "");
      }
    });
    const all = $$("[data-reveal]");
    if (!all.length) return;
    if (reduce) {
      all.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          armPunches(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    all.forEach((n) => io.observe(n));
    requestAnimationFrame(() => {
      all.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 40) {
          n.classList.add("is-in");
          armPunches(n);
          io.unobserve(n);
        }
      });
    });
  };

  const roundWatcher = () => {
    if (!roundEl) return;
    const sections = $$("[data-round-id]");
    if (!sections.length) return;
    let last = "";
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!vis) return;
        const id = vis.target.getAttribute("data-round-id");
        if (id === last) return;
        last = id;
        roundEl.textContent = id;
        roundEl.parentElement.classList.remove("is-hit");
        void roundEl.parentElement.offsetWidth;
        roundEl.parentElement.classList.add("is-hit");
      },
      { threshold: [0.35, 0.55, 0.75] }
    );
    sections.forEach((s) => io.observe(s));
  };

  const scoreboards = () => {
    $$("[data-count]").forEach((el) => {
      const target = Number(el.getAttribute("data-count"));
      const suffix = el.getAttribute("data-suffix") || "";
      if (reduce) {
        el.textContent = `${target}${suffix}`;
        return;
      }
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      io.observe(el);
    });
  };

  const magnets = () => {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    $$(".magnet").forEach((card) => {
      const slab = card.classList.contains("card3d");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rx = (0.5 - y) * (slab ? 7 : 5);
        const ry = (x - 0.5) * (slab ? 10 : 7);
        card.style.transform = slab
          ? `rotateY(${-16 + ry}deg) rotateX(${7 + rx}deg) translateZ(36px)`
          : `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  };

  const dust = () => {
    const canvas = $("#fx-dust");
    const hero = $(".hero");
    if (!canvas || reduce) return;
    if (hero) hero.appendChild(canvas);
    else canvas.remove();
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const parts = Array.from({ length: 22 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.00016,
      vy: -0.0001 - Math.random() * 0.00022,
      a: 0.08 + Math.random() * 0.16,
    }));
    const pointer = { x: 0.5, y: 0.5 };
    const resize = () => {
      const box = hero || canvas.parentElement;
      const width = box?.clientWidth || window.innerWidth;
      const height = box?.clientHeight || window.innerHeight;
      w = canvas.width = width * devicePixelRatio;
      h = canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
    }, { passive: true });
    resize();
    window.addEventListener("resize", resize);
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.x += p.vx + (pointer.x - 0.5) * 0.00016;
        p.y += p.vy;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < 0) p.x += 1;
        if (p.x > 1) p.x -= 1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(239,232,220,${p.a})`;
        ctx.arc(p.x * w, p.y * h, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const guardNav = () => {
    if (reduce) return;
    const go = (href) => {
      document.documentElement.classList.add("js-guarding");
      document.body.classList.add("is-guarding");
      setTimeout(() => {
        window.location.href = href;
      }, 480);
    };
    $$("a[href]").forEach((a) => {
      const raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (a.target === "_blank") return;
      if (url.pathname === window.location.pathname && url.hash) return;
      if (url.pathname === window.location.pathname && !url.hash) return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(a.href);
      });
    });
    window.addEventListener("pageshow", () => {
      document.body.classList.remove("is-guarding");
      document.body.classList.add("is-unguarding");
      setTimeout(() => document.body.classList.remove("is-unguarding"), 520);
    });
  };

  const ringSpin = () => {
    const ring = $("[data-ring3d] .ring3d__stage");
    if (!ring || reduce) return;
    const tick = () => {
      const t = performance.now() / 3800;
      const s = window.scrollY / 800;
      ring.style.transform = `rotateX(${58 + Math.sin(t) * 5}deg) rotateZ(${-8 + Math.cos(t) * 4}deg) rotateY(${-18 + Math.sin(t + s) * 24}deg)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
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
        items.forEach((item, i) => {
          const hit = val === "all" || item.getAttribute(attr) === val || (item.getAttribute(attr) || "").includes(val);
          item.classList.toggle("is-off", !hit);
          if (hit) {
            item.style.animation = "none";
            void item.offsetWidth;
            item.style.animation = `card-3d 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 40}ms both`;
          }
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
    const close = () => {
      box.classList.remove("is-on");
      box.setAttribute("aria-hidden", "true");
    };
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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  };

  const pocketVideo = () => {
    $$(".video-pocket video").forEach((video) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      }, { threshold: 0.35 });
      io.observe(video);
    });
  };

  const clock = () => {
    const el = $("[data-clock]");
    if (!el || reduce) return;
    let left = 180;
    const stamp = () => {
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      el.textContent = `${m}:${s}`;
    };
    stamp();
    setInterval(() => {
      left = left <= 0 ? 180 : left - 1;
      stamp();
    }, 1000);
  };

  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const box = $("#form-ok");
      form.hidden = true;
      if (box) box.hidden = false;
    });
  }

  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  splitPunches();
  observeReveals();
  roundWatcher();
  scoreboards();
  magnets();
  dust();
  guardNav();
  ringSpin();
  filterSet("#plan-filters", ".plan-day li", "data-disc");
  filterSet("#gal-filters", ".gallery-grid .shot", "data-zone");
  lightbox();
  pocketVideo();
  clock();
})();
