(() => {
  document.documentElement.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) document.documentElement.classList.add("is-touch");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const header = $(".site-header");
  const roundEl = $("[data-round]");
  const clockEl = $("[data-clock]");

  const onScrollHeader = () => {
    if (header) header.classList.toggle("is-solid", window.scrollY > 24);
  };

  /* Boot: T-M-B-C slam, bell, then open */
  const boot = () => {
    const gate = $(".split-gate");
    const home = document.body.classList.contains("is-home");
    if (!gate || reduce || !home) {
      document.body.classList.remove("is-booting");
      return;
    }
    const seen = sessionStorage.getItem("tmbc-boot");
    if (seen) {
      document.body.classList.remove("is-booting");
      return;
    }
    sessionStorage.setItem("tmbc-boot", "1");
    document.body.classList.add("is-booting");
    setTimeout(() => document.body.classList.add("is-unbooting"), 980);
    setTimeout(() => document.body.classList.remove("is-booting", "is-unbooting"), 1720);
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

  /* Fist cursor + punch shockwaves + flinch */
  const fist = $(".fist");
  const trail = $(".fist-trail");
  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  if (fist && !reduce && !coarse) {
    let tx = pointer.x;
    let ty = pointer.y;
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      fist.style.left = `${e.clientX}px`;
      fist.style.top = `${e.clientY}px`;
      if (trail) trail.style.opacity = "0.7";
    }, { passive: true });
    const follow = () => {
      tx += (pointer.x - tx) * 0.18;
      ty += (pointer.y - ty) * 0.18;
      if (trail) {
        trail.style.left = `${tx}px`;
        trail.style.top = `${ty}px`;
      }
      requestAnimationFrame(follow);
    };
    follow();
    window.addEventListener("pointerdown", (e) => {
      fist.classList.add("is-down");
      const shock = document.createElement("i");
      shock.className = "shock";
      shock.style.left = `${e.clientX}px`;
      shock.style.top = `${e.clientY}px`;
      document.body.appendChild(shock);
      setTimeout(() => shock.remove(), 720);
      $$(".magnet, .shot, .price, .plan-day, .btn, .cfg").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(cx - e.clientX, cy - e.clientY);
        if (d > 280) return;
        const force = (1 - d / 280) * 16;
        const ox = ((cx - e.clientX) / (d || 1)) * force;
        const oy = ((cy - e.clientY) / (d || 1)) * force;
        el.style.transition = "transform 0.45s cubic-bezier(0.22,1.55,0.32,1)";
        el.style.transform = `translate(${ox}px, ${oy}px)`;
        setTimeout(() => { el.style.transform = ""; }, 420);
      });
    });
    window.addEventListener("pointerup", () => fist.classList.remove("is-down"));
  }

  /* Physics ropes that sag toward the pointer */
  const ropes = () => {
    const svg = $(".ropes");
    if (!svg) return;
    const paths = $$("path", svg);
    if (paths.length < 3) return;
    const W = () => window.innerWidth;
    let mx = W() / 2;
    window.addEventListener("pointermove", (e) => { mx = e.clientX; }, { passive: true });
    const draw = () => {
      const w = W();
      const pull = reduce || coarse ? 0 : (mx / w - 0.5) * 28;
      paths.forEach((p, i) => {
        const y = 6 + i * 7;
        const sag = 4 + i * 2 + Math.abs(pull) * 0.15;
        p.setAttribute("d", `M0 ${y} C ${w * 0.33} ${y + sag + pull} ${w * 0.66} ${y + sag - pull} ${w} ${y}`);
      });
      const red = paths[1];
      if (red && !reduce) {
        const max = document.documentElement.scrollHeight - innerHeight;
        const t = max > 0 ? window.scrollY / max : 0;
        red.style.strokeDasharray = "12 6";
        red.style.strokeDashoffset = String(-t * 80);
      }
      requestAnimationFrame(draw);
    };
    draw();
  };

  const splitPunches = () => {
    if (reduce) return;
    $$("[data-punch]").forEach((el) => {
      const text = el.textContent.trim();
      el.textContent = "";
      [...text].forEach((ch, i) => {
        const span = document.createElement("span");
        span.className = "punch-letter";
        span.textContent = ch === " " ? "\u00a0" : ch;
        span.style.animationDelay = `${i * 48}ms`;
        el.appendChild(span);
      });
    });
  };

  const armPunches = (root = document) => {
    root.querySelectorAll?.(".punch-letter")?.forEach((s) => s.classList.add("is-in"));
    root.querySelectorAll?.("[data-punch] .punch-letter").forEach((s) => s.classList.add("is-in"));
  };

  const observeReveals = () => {
    const nodes = $$("[data-reveal], [data-stagger], [data-combo]");
    nodes.forEach((n) => {
      if (!n.hasAttribute("data-reveal") && (n.hasAttribute("data-stagger") || n.hasAttribute("data-combo"))) {
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
          $$("[data-combo]", e.target).forEach((c) => c.classList.add("is-in"));
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    all.forEach((n) => io.observe(n));
    requestAnimationFrame(() => {
      all.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 40) {
          n.classList.add("is-in");
          armPunches(n);
          $$("[data-combo]", n).forEach((c) => c.classList.add("is-in"));
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
      { threshold: [0.28, 0.5, 0.7] }
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
    if (reduce || coarse) return;
    $$(".magnet").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rx = (0.5 - y) * 6;
        const ry = (x - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  };

  const dust = () => {
    const canvas = $("#fx-dust");
    const hero = $(".hero");
    if (!canvas || reduce || !hero) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const parts = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: -0.00008 - Math.random() * 0.00024,
      a: 0.08 + Math.random() * 0.18,
    }));
    const resize = () => {
      w = canvas.width = hero.clientWidth * devicePixelRatio;
      h = canvas.height = hero.clientHeight * devicePixelRatio;
      canvas.style.width = `${hero.clientWidth}px`;
      canvas.style.height = `${hero.clientHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.x += p.vx + (pointer.x / innerWidth - 0.5) * 0.00018;
        p.y += p.vy;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < 0) p.x += 1;
        if (p.x > 1) p.x -= 1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(244,241,234,${p.a})`;
        ctx.arc(p.x * w, p.y * h, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const heroParallax = () => {
    const hero = $(".hero");
    const photo = $(".hero__photo");
    const spot = $(".hero__spot");
    if (!hero || !photo || reduce) return;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      hero.classList.add("is-lit");
      hero.style.setProperty("--sx", `${x * 100}%`);
      hero.style.setProperty("--sy", `${y * 100}%`);
      photo.style.transform = `scale(1.08) translate(${(x - 0.5) * -18}px, ${(y - 0.5) * -12}px)`;
    });
    hero.addEventListener("pointerleave", () => {
      hero.classList.remove("is-lit");
      photo.style.transform = "";
    });
    if (spot) { /* used via CSS vars */ }
  };

  const guardNav = () => {
    if (reduce) return;
    const go = (href) => {
      document.documentElement.classList.add("is-guarding");
      document.body.classList.add("is-guarding");
      setTimeout(() => { window.location.href = href; }, 640);
    };
    $$('a[href$=".html"], a[href="./"], a[href="index.html"]').forEach((a) => {
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && !url.hash) return;
      if (url.hash && url.pathname === window.location.pathname) return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
        e.preventDefault();
        go(a.href);
      });
    });
    window.addEventListener("pageshow", () => {
      document.body.classList.remove("is-guarding");
      document.body.classList.add("is-unguarding");
      setTimeout(() => document.body.classList.remove("is-unguarding"), 700);
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
    const bell = $("#config-bell");
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
        aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" id="cfg-${d.key}" data-i="${i}">
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
        <a class="btn" href="${window.TMBC.boutique.essai}"><span>Essayer · 10 €</span></a>
        <a class="btn btn--ghost" href="planning.html"><span>Les créneaux</span></a>
        <a class="btn btn--ghost" href="activites.html#${d.key}"><span>En détail</span></a>
      </div>`;
    if (body) body.innerHTML = sheet(discs[0]);
    let curr = 0;
    let seq = 0;
    const select = (i) => {
      if (i === curr || !discs[i]) return;
      curr = i;
      const token = ++seq;
      const d = discs[i];
      [...list.children].forEach((b, k) => {
        b.classList.toggle("is-active", k === i);
        b.setAttribute("aria-selected", String(k === i));
        if (k === i) {
          b.classList.remove("is-hit");
          void b.offsetWidth;
          b.classList.add("is-hit");
        }
      });
      if (mediaBox) [...mediaBox.children].forEach((m, k) => m.classList.toggle("is-active", k === i));
      if (bg) [...bg.children].forEach((m, k) => m.classList.toggle("is-active", k === i));
      if (bell) {
        bell.classList.remove("is-ring");
        void bell.offsetWidth;
        bell.classList.add("is-ring");
        setTimeout(() => bell.classList.remove("is-ring"), 720);
      }
      if (!body) return;
      body.classList.add("is-swapping");
      setTimeout(() => {
        if (token !== seq) return;
        body.innerHTML = sheet(d);
        body.classList.remove("is-swapping");
      }, reduce ? 0 : 180);
    };
    let hoverT = 0;
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
      hoverT = setTimeout(() => select(+b.dataset.i), 90);
    });
    list.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const next = e.key === "ArrowDown" ? (curr + 1) % discs.length : (curr - 1 + discs.length) % discs.length;
      select(next);
      list.children[curr]?.focus();
    });
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
            item.style.animation = `jab-in 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 28}ms both`;
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
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
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
    if (!clockEl || reduce) return;
    let left = 180;
    const stamp = () => {
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      clockEl.textContent = `${m}:${s}`;
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

  boot();
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  splitPunches();
  observeReveals();
  roundWatcher();
  scoreboards();
  magnets();
  dust();
  heroParallax();
  ropes();
  guardNav();
  ticker();
  configurator();
  filterSet("#plan-filters", ".plan-day li", "data-disc");
  filterSet("#gal-filters", ".gallery-grid .shot", "data-zone");
  lightbox();
  pocketVideo();
  clock();
})();
