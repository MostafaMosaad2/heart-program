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
const YT_TRACK_ID = "Ri3WsPDi4MY"; // Feelings — Peder B. Helland

const Music = {
  ctx: null,
  master: null,
  started: false,
  muted: false,
  player: null,
  ytReady: false,
  wantPlay: false,

  init() {
    window.onYouTubeIframeAPIReady = () => this.setupPlayer();
    if (window.YT && window.YT.Player) {
      this.setupPlayer();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  },

  bury(el) {
    if (!el || !el.style) return;
    const css = {
      position: "fixed",
      left: "-200vw",
      top: "-200vh",
      width: "200px",
      height: "112px",
      opacity: "0",
      "pointer-events": "none",
      transform: "translate(-200vw,-200vh)",
      "z-index": "-9999",
      overflow: "hidden",
      border: "0",
    };
    Object.entries(css).forEach(([key, value]) => el.style.setProperty(key, value, "important"));
    if (el.setAttribute) {
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("width", "200");
      el.setAttribute("height", "112");
    }
  },

  hideFrames() {
    this.bury($("#yt-wrap"));
    this.bury($("#yt-player"));
    document.querySelectorAll("iframe").forEach((frame) => this.bury(frame));
  },

  setupPlayer() {
    if (this.player || !(window.YT && window.YT.Player)) return;
    if (!this._watchFrames) {
      this._watchFrames = new MutationObserver(() => this.hideFrames());
      this._watchFrames.observe(document.body, { childList: true, subtree: true });
      this._hideTimer = setInterval(() => this.hideFrames(), 300);
    }
    this.player = new YT.Player("yt-player", {
      width: "200",
      height: "112",
      videoId: YT_TRACK_ID,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        loop: 1,
        playlist: YT_TRACK_ID,
        fs: 0,
        iv_load_policy: 3,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          this.ytReady = true;
          this.hideFrames();
          e.target.setVolume(72);
          if (this.wantPlay) this.playNow();
        },
        onStateChange: (e) => {
          this.hideFrames();
          if (e.data === YT.PlayerState.ENDED) {
            e.target.seekTo(0);
            e.target.playVideo();
          }
        },
      },
    });
  },

  playNow() {
    if (!this.player || typeof this.player.playVideo !== "function") return;
    if (this.muted) this.player.mute();
    else this.player.unMute();
    this.player.setVolume(72);
    this.player.playVideo();
    this.hideFrames();
    $("#mute").classList.remove("hidden");
  },

  start() {
    this.wantPlay = true;
    if (!this.started) {
      this.started = true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
      }
    } else if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.ytReady) this.playNow();
    else this.init();
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
    if (this.player) {
      if (this.muted) this.player.mute();
      else this.player.unMute();
    }
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

async function playSecurity() {
  await showScene("scene-security");
  const denied = $("#sec-denied");
  const scan = $("#sec-scan");
  const fill = $("#sec-fill");
  const pct = $("#sec-pct");
  const card = $("#sec-card");
  const enter = $("#enter-homeland");

  denied.classList.remove("hidden");
  scan.classList.add("hidden");
  card.classList.add("hidden");
  enter.classList.add("hidden");
  fill.style.width = "0%";
  pct.textContent = "0%";

  await sleep(2200);
  denied.classList.add("hidden");
  scan.classList.remove("hidden");
  await sleep(400);

  const steps = [0, 18, 37, 37, 52, 68, 68, 84, 93, 100];
  for (const p of steps) {
    fill.style.width = p + "%";
    pct.textContent = p + "%";
    await sleep(p === 100 ? 350 : 220);
  }

  await sleep(450);
  scan.classList.add("hidden");
  card.classList.remove("hidden");
  await sleep(900);
  enter.classList.remove("hidden");
}

function revealStoryBeat(index) {
  const beat = $(`.story-beat[data-beat="${index}"]`);
  if (!beat) return;
  beat.classList.add("is-on");
  beat.scrollIntoView({ behavior: "smooth", block: "center" });
  if (index === 3) {
    setTimeout(() => {
      $("#story-to-gifts").classList.remove("hidden");
      $("#story-to-gifts").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 1400);
  }
}

async function playStory() {
  await showScene("scene-story");
  $$(".story-beat").forEach((beat) => beat.classList.remove("is-on"));
  $("#story-to-gifts").classList.add("hidden");
  await sleep(500);
  revealStoryBeat(0);
}

function rainHearts() {
  const field = $("#heart-field");
  field.innerHTML = "";
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

function burstCelebrate() {
  const field = $("#confetti-field");
  field.innerHTML = "";
  const colors = ["#006c35", "#1a8f52", "#d4b56a", "#f3ead8", "#ff8a9a", "#ffffff"];
  const hearts = ["❤️", "🤍", "💚"];

  for (let i = 0; i < 58; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti-bit";
    bit.style.background = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 58 + Math.random() * 0.4;
    const dist = 90 + Math.random() * 220;
    bit.style.setProperty("--x", Math.cos(angle) * dist + "px");
    bit.style.setProperty("--y", Math.sin(angle) * dist - 40 + "px");
    bit.style.setProperty("--r", -80 + Math.random() * 160 + "deg");
    bit.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    field.appendChild(bit);
  }

  for (let i = 0; i < 24; i++) {
    const heart = document.createElement("span");
    heart.className = "confetti-heart";
    heart.textContent = hearts[i % hearts.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 240;
    heart.style.setProperty("--x", Math.cos(angle) * dist + "px");
    heart.style.setProperty("--y", Math.sin(angle) * dist - 80 + "px");
    heart.style.setProperty("--r", -40 + Math.random() * 80 + "deg");
    heart.style.fontSize = 14 + Math.random() * 16 + "px";
    heart.style.animationDuration = 2 + Math.random() * 1.4 + "s";
    field.appendChild(heart);
  }

  for (let i = 0; i < 36; i++) {
    const span = document.createElement("span");
    span.className = "falling-heart";
    span.textContent = hearts[i % hearts.length];
    span.style.left = Math.random() * 100 + "%";
    span.style.fontSize = 12 + Math.random() * 18 + "px";
    span.style.animationDuration = 4.5 + Math.random() * 5 + "s";
    span.style.animationDelay = Math.random() * 2.2 + "s";
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

async function playMission() {
  await showScene("scene-mission");
  $("#mission-complete").classList.remove("hidden");
  $("#mission-twist").classList.add("hidden");
  $("#twist-1").classList.remove("hidden");
  ["twist-1", "twist-2", "twist-3", "twist-4"].forEach((id) => {
    document.getElementById(id).classList.remove("is-on");
  });
  $("#last-promise").classList.add("hidden");
  rainHearts();

  await sleep(5200);
  await sleep(2000);

  const blackout = $("#blackout");
  blackout.classList.add("is-on");
  await sleep(2000);

  $("#mission-complete").classList.add("hidden");
  $("#heart-field").innerHTML = "";
  $("#mission-twist").classList.remove("hidden");
  blackout.classList.remove("is-on");

  await sleep(700);
  $("#twist-1").classList.add("is-on");
  await sleep(1800);
  $("#twist-1").classList.add("hidden");
  $("#twist-2").classList.add("is-on");
  await sleep(2000);
  $("#twist-3").classList.add("is-on");
  await sleep(1800);
  $("#twist-4").classList.add("is-on");
  await sleep(1600);
  $("#last-promise").classList.remove("hidden");
}

async function playLastLove() {
  await showScene("scene-last");
  const letter = $("#last-letter");
  letter.classList.remove("is-gone");
  $("#the-end").disabled = false;
  const field = $("#confetti-field");
  field.classList.remove("is-screen");
  field.innerHTML = "";
}

function popHearts(field, count) {
  const hearts = ["❤️", "🤍", "💚", "💖"];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "pop-heart";
    heart.textContent = hearts[i % hearts.length];
    heart.style.left = 4 + Math.random() * 92 + "%";
    heart.style.top = 4 + Math.random() * 90 + "%";
    heart.style.fontSize = 22 + Math.random() * 34 + "px";
    heart.style.animationDelay = Math.random() * 0.45 + "s";
    field.appendChild(heart);
  }
}

function endProgram() {
  const btn = $("#the-end");
  if (btn.disabled) return;
  btn.disabled = true;
  $("#last-letter").classList.add("is-gone");
  $("#mute").classList.add("hidden");

  const field = $("#confetti-field");
  field.classList.add("is-screen");
  field.innerHTML = "";
  document.body.appendChild(field);
  popHearts(field, 28);
  setTimeout(() => popHearts(field, 36), 280);
  setTimeout(() => popHearts(field, 24), 700);
}

function bindUi() {
  $("#her-name").textContent = CONFIG.herName + "🤍";

  const introBtn = $("[data-music]");
  if (introBtn) {
    introBtn.addEventListener("pointerdown", () => Music.start());
  }

  document.addEventListener("click", async (e) => {
    const nextBeat = e.target.closest("[data-reveal]");
    if (nextBeat) {
      nextBeat.classList.add("hidden");
      revealStoryBeat(Number(nextBeat.getAttribute("data-reveal")));
      return;
    }

    const btn = e.target.closest("[data-go]");
    if (!btn) return;
    if (btn.hasAttribute("data-music")) Music.start();
    const dest = btn.getAttribute("data-go");
    if (dest === "countdown") return playCountdown();
    if (dest === "security") return playSecurity();
    if (dest === "story") return playStory();
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
    $("#gift-gate").classList.remove("hidden");
  });

  $("#smile-promise").addEventListener("click", async () => {
    $("#gift-gate").classList.add("hidden");
    await sleep(180);
    $("#second-gift").classList.remove("hidden");
    $("#second-gift").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("#before-close").addEventListener("click", () => playMission());
  $("#last-promise").addEventListener("click", () => playLastLove());
  $("#the-end").addEventListener("click", () => endProgram());
}

function applyPreview() {
  const scene = new URLSearchParams(location.search).get("scene");
  if (!scene) return;
  document.documentElement.classList.add("preview");
  if (scene === "countdown") {
    showScene("scene-countdown", true);
    $("#count-num").textContent = "3";
    return;
  }
  showScene("scene-" + scene, true);
  if (scene === "security") {
    $("#sec-scan").classList.add("hidden");
    $("#sec-card").classList.remove("hidden");
    $("#enter-homeland").classList.remove("hidden");
  }
  if (scene === "story") {
    $$(".story-beat").forEach((beat) => beat.classList.add("is-on"));
    $("#story-to-gifts").classList.remove("hidden");
  }
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
  if (scene === "mission") {
    $("#mission-complete").classList.add("hidden");
    $("#mission-twist").classList.remove("hidden");
    $("#twist-1").classList.add("hidden");
    ["twist-2", "twist-3", "twist-4"].forEach((id) => {
      document.getElementById(id).classList.add("is-on");
    });
    $("#last-promise").classList.remove("hidden");
  }
}

createStars();
Music.init();
bindUi();
applyPreview();
