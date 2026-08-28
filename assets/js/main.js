(() => {
  document.documentElement.classList.add("js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
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
      if (trail) {
        trail.style.opacity = "0.7";
        trail.style.left = `${tx}px`;
        trail.style.top = `${ty}px`;
      }
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
      $$(".magnet, .shot, .price, .plan-day, .btn").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const d = Math.hypot(dx, dy);
        if (d > 280) return;
        const force = (1 - d / 280) * 18;
        el.style.setProperty("--fx", `${(dx / (d || 1)) * force}px`);
        el.style.setProperty("--fy", `${(dy / (d || 1)) * force}px`);
        el.style.setProperty("--fr", `${(dx > 0 ? 1 : -1) * 3}deg`);
        el.classList.remove("is-flinch");
        void el.offsetWidth;
        el.classList.add("is-flinch");
      });
    });
    window.addEventListener("pointerup", () => fist.classList.remove("is-down"));
  }

  $$(".btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--px", `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty("--py", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });

  /* Ring ropes follow the fist */
  const ropes = () => {
    const svg = $(".ropes");
    if (!svg || reduce) return;
    const paths = $$("path", svg);
    const w = () => svg.clientWidth || innerWidth;
    const sag = [10, 16, 10];
    const draw = () => {
      const width = w();
      const mx = pointer.x / innerWidth;
      paths.forEach((p, i) => {
        const y = 6 + i * 8;
        const cpx = width * mx;
        const cpy = y + sag[i] + Math.sin(mx * Math.PI) * 6;
        p.setAttribute("d", `M0 ${y} Q ${cpx} ${cpy} ${width} ${y}`);
      });
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", () => {
      svg.setAttribute("viewBox", `0 0 ${innerWidth} 28`);
    });
    svg.setAttribute("viewBox", `0 0 ${innerWidth} 28`);
  };

  /* Hero parallax: boxer vs gym */
  const parallax = () => {
    const gym = $(".hero__layer--gym");
    const boxer = $(".hero__layer--boxer");
    if (!gym || reduce || coarse) return;
    window.addEventListener("pointermove", (e) => {
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      gym.style.transform = `translate3d(${x * -12}px, ${y * -8}px, 0) scale(1.06)`;
      if (boxer) boxer.style.transform = `translate3d(${x * 28}px, ${y * 14}px, 0) scale(1.08)`;
    }, { passive: true });
  };

  /* Rosin / chalk canvas — punch bursts */
  const dust = () => {
    const canvas = $("#fx-dust");
    const hero = $(".hero");
    if (!canvas || reduce) return;
    if (hero) {
      canvas.hidden = false;
      hero.appendChild(canvas);
    }
    else { canvas.remove(); return; }
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const parts = Array.from({ length: 70 }, () => spawn(true));
    function spawn(randomY) {
      return {
        x: Math.random(),
        y: randomY ? Math.random() : 0.55 + Math.random() * 0.2,
        r: 0.5 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.0004,
        vy: -0.00008 - Math.random() * 0.0003,
        a: 0.08 + Math.random() * 0.22,
        life: 1,
      };
    }
    const burst = (nx, ny) => {
      for (let i = 0; i < 28; i++) {
        const p = spawn(false);
        p.x = nx;
        p.y = ny;
        p.vx = (Math.random() - 0.5) * 0.012;
        p.vy = (Math.random() - 0.65) * 0.012;
        p.a = 0.35;
        p.life = 1;
        parts.push(p);
      }
    };
    const resize = () => {
      w = canvas.width = hero.clientWidth * devicePixelRatio;
      h = canvas.height = hero.clientHeight * devicePixelRatio;
      canvas.style.width = `${hero.clientWidth}px`;
      canvas.style.height = `${hero.clientHeight}px`;
    };
    hero.addEventListener("pointerdown", (e) => {
      const r = hero.getBoundingClientRect();
      burst((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });
    resize();
    window.addEventListener("resize", resize);
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx + (pointer.x / innerWidth - 0.5) * 0.0002;
        p.y += p.vy;
        p.life -= 0.0015;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < 0) p.x += 1;
        if (p.x > 1) p.x -= 1;
        if (p.life <= 0 && parts.length > 70) {
          parts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(244,241,234,${p.a * Math.max(p.life, 0.2)})`;
        ctx.arc(p.x * w, p.y * h, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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
    root.querySelectorAll?.("[data-punch] .punch-letter").forEach((s) => s.classList.add("is-in"));
  };

  const observeReveals = () => {
    const nodes = $$("[data-combo], [data-stagger], [data-reveal]");
    nodes.forEach((n) => {
      if (!n.hasAttribute("data-combo") && !n.hasAttribute("data-reveal")) {
        n.setAttribute("data-combo", "jab");
      }
    });
    const all = $$("[data-combo], [data-reveal]");
    if (reduce) {
      all.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const combos = ["jab", "cross", "hook", "uppercut"];
    all.forEach((n, i) => {
      if (!n.hasAttribute("data-combo")) n.setAttribute("data-combo", combos[i % 4]);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          armPunches(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    all.forEach((n) => io.observe(n));
    requestAnimationFrame(() => {
      all.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < innerHeight * 0.92 && r.bottom > 40) {
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
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateZ(12px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  };

  const pageName = () => {
    const file = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
    const map = {
      index: "ACCUEIL",
      club: "LE CLUB",
      disciplines: "DISCIPLINES",
      planning: "PLANNING",
      galerie: "GALERIE",
      contact: "CONTACT",
    };
    return map[file] || "TMBC";
  };

  const guardNav = () => {
    const card = $(".between__t");
    if (card) card.textContent = sessionStorage.getItem("tmbc-round") || pageName();
    if (reduce) return;
    const go = (href, label) => {
      sessionStorage.setItem("tmbc-round", label);
      sessionStorage.setItem("tmbc-from-nav", "1");
      if (card) card.textContent = label;
      document.documentElement.classList.add("js-guarding");
      document.body.classList.add("is-guarding");
      setTimeout(() => {
        location.href = href;
      }, 620);
    };
    $$('a[href$=".html"], a[href^="index.html"]').forEach((a) => {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && !url.hash) return;
      if (url.hash && url.pathname === location.pathname) return;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
        e.preventDefault();
        const label = (a.textContent || "").trim().toUpperCase() || "ROUND";
        go(a.href, label);
      });
    });
    window.addEventListener("pageshow", () => {
      document.body.classList.remove("is-guarding");
      if (sessionStorage.getItem("tmbc-from-nav")) {
        sessionStorage.removeItem("tmbc-from-nav");
        document.body.classList.add("is-unguarding");
        setTimeout(() => document.body.classList.remove("is-unguarding"), 680);
      }
    });
  };

  const boot = () => {
    const el = $(".boot");
    if (!el) return;
    if (reduce) {
      el.remove();
      document.body.classList.remove("is-booting");
      return;
    }
    document.body.classList.add("is-booting");
    setTimeout(() => {
      el.classList.add("is-out");
      document.body.classList.remove("is-booting");
      setTimeout(() => el.remove(), 720);
    }, 900);
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
            item.style.animation = `letter-hit 0.55s var(--ease-hit) ${i * 30}ms both`;
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
    if (!el) return;
    let left = 180;
    const stamp = () => {
      const m = String(Math.floor(left / 60)).padStart(2, "0");
      const s = String(left % 60).padStart(2, "0");
      el.textContent = `${m}:${s}`;
    };
    stamp();
    if (reduce) return;
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
  boot();
  ropes();
  parallax();
  dust();
  splitPunches();
  observeReveals();
  roundWatcher();
  scoreboards();
  magnets();
  guardNav();
  filterSet("#plan-filters", ".plan-day li", "data-disc");
  filterSet("#gal-filters", ".gallery-grid .shot", "data-zone");
  lightbox();
  pocketVideo();
  clock();
})();
