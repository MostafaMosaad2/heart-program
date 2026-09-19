/* =========================================================
   غيّري التفاصيل من هنا قبل ما ترسليها
   ========================================================= */
const CONFIG = {
  herName: "يارا",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* -------------------- stars -------------------- */
function createStars() {
  const canvas = $("#stars");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let raf = 0;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.min(140, Math.floor((canvas.width * canvas.height) / 14000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      a: Math.random() * Math.PI * 2,
      s: 0.15 + Math.random() * 0.45,
      tw: Math.random() * 0.8 + 0.2,
    }));
  };

  const draw = (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      star.y -= star.s * 0.12;
      star.x += Math.sin(star.a + t / 4000) * 0.05;
      if (star.y < -4) star.y = canvas.height + 4;
      const twinkle = 0.25 + Math.abs(Math.sin(t * 0.001 * star.tw + star.a)) * 0.75;
      ctx.beginPath();
        ctx.fillStyle = `rgba(150, 255, 188, ${0.28 + twinkle * 0.65})`;
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}

/* -------------------- audio -------------------- */
const Music = {
  ctx: null,
  master: null,
  started: false,
  muted: false,
  track: null,

  start() {
    if (this.started) return;
    this.started = true;

    this.track = $("#bg-music");
    this.track.volume = 0.72;
    this.track.loop = true;
    this.track.currentTime = 0;
    const playPromise = this.track.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {
        this.started = false;
      });
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }

    $("#mute").classList.remove("hidden");
  },

  heartbeat() {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const thump = (when, freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, when);
      osc.frequency.exponentialRampToValueAtTime(40, when + 0.16);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.4, when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
      osc.connect(gain).connect(this.master);
      osc.start(when);
      osc.stop(when + 0.3);
    };
    const t = this.ctx.currentTime;
    thump(t, 110);
    thump(t + 0.22, 80);
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.track) this.track.muted = this.muted;
    if (this.master) this.master.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
    $("#mute").classList.toggle("is-muted", this.muted);
    $("#mute").textContent = this.muted ? "🔇" : "♪";
  },
};

/* -------------------- scenes -------------------- */
async function showScene(id, instant = false) {
  const next = document.getElementById(id);
  const current = $(".scene.is-on");
  if (current === next) return;
  if (current) {
    current.classList.remove("is-on");
    if (!instant) await sleep(950);
  }
  next.scrollTop = 0;
  next.classList.add("is-on");
}

async function playCountdown() {
  await showScene("scene-countdown");
  const num = $("#count-num");
  const ring = $("#heartbeat-ring");
  await sleep(500);
  for (const n of ["3", "2", "1"]) {
    num.textContent = n;
    ring.classList.remove("beat");
    void ring.offsetWidth;
    ring.classList.add("beat");
    Music.heartbeat();
    await sleep(1150);
  }
  await showScene("scene-peak");
}

function observeMemories() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-seen");
      });
    },
    { threshold: 0.28 }
  );
  $$("[data-observe]").forEach((el) => io.observe(el));
}

function rainHearts() {
  const field = $("#heart-field");
  const glyphs = ["🤍", "❤️", "💚"];
  for (let i = 0; i < 70; i++) {
    const span = document.createElement("span");
    span.className = "falling-heart";
    span.textContent = glyphs[i % glyphs.length];
    span.style.left = Math.random() * 100 + "%";
    span.style.fontSize = 12 + Math.random() * 18 + "px";
    span.style.animationDuration = 4.5 + Math.random() * 5 + "s";
    span.style.animationDelay = Math.random() * 2.4 + "s";
    field.appendChild(span);
  }
}

async function playFinale() {
  await showScene("scene-finale");
  const lines = ["f1", "f2", "f3", "f4"];
  const delays = [400, 2800, 2600, 1800];
  for (let i = 0; i < lines.length; i++) {
    await sleep(delays[i]);
    document.getElementById(lines[i]).classList.add("show");
  }
  await sleep(2200);
  $("#before-close").classList.remove("hidden");
}

function bindUi() {
  $("#her-name").textContent = CONFIG.herName + "🤍";

  const introBtn = $("[data-music]");
  if (introBtn) {
    introBtn.addEventListener("pointerdown", () => Music.start());
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-go]");
    if (!btn) return;
    if (btn.hasAttribute("data-music")) Music.start();
    const dest = btn.getAttribute("data-go");
    if (dest === "countdown") return playCountdown();
    if (dest === "finale") return playFinale();
    await showScene("scene-" + dest);
  });

  $("#mute").addEventListener("click", () => Music.toggleMute());

  $("#final-love-btn").addEventListener("click", () => {
    $("#final-love").classList.remove("hidden");
    $("#final-love-btn").classList.add("hidden");
  });

  $("#open-gift-1").addEventListener("click", async () => {
    const env = $("#envelope");
    env.classList.add("is-ready");
    $("#open-gift-1").classList.add("hidden");
    await sleep(350);
    env.classList.add("is-open");
    await sleep(900);
    $("#letter").classList.add("is-shown");
    env.classList.add("is-gone");
    await sleep(400);
    $("#gift-two-stage").classList.remove("hidden");
    $("#gift-two-stage").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("#open-gift-2").addEventListener("click", () => {
    $("#open-gift-2").classList.add("hidden");
    $("#second-gift").classList.remove("hidden");
  });

  $("#before-close").addEventListener("click", async () => {
    await showScene("scene-mission");
    rainHearts();
  });
}

function applyPreview() {
  const scene = new URLSearchParams(location.search).get("scene");
  if (!scene) return;
  document.documentElement.classList.add("preview");
  $$(".memory").forEach((el) => el.classList.add("is-seen"));
  if (scene === "countdown") {
    showScene("scene-countdown", true);
    $("#count-num").textContent = "3";
    return;
  }
  showScene("scene-" + scene, true);
  if (scene === "gifts") {
    $("#open-gift-1").classList.add("hidden");
    $("#envelope").classList.add("is-ready", "is-open", "is-gone");
    $("#letter").classList.add("is-shown");
    $("#gift-two-stage").classList.remove("hidden");
  }
  if (scene === "finale") {
    $$(".finale-line").forEach((el) => el.classList.add("show"));
    $("#before-close").classList.remove("hidden");
  }
  if (scene === "mission") rainHearts();
}

createStars();
observeMemories();
bindUi();
applyPreview();
