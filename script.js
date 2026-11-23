/* =========================================================
   CONFIGURACIÓN: lo único que tendréis que tocar
   ========================================================= */
const CONFIG = {
  // Fecha y hora de la ceremonia (hora de Madrid, invierno = +01:00)
  fechaBoda: "2027-12-04T13:00:00+01:00",

  // Fecha límite para confirmar. Déjalo vacío ("") para no mostrarla.
  // Ejemplo: "1 de noviembre de 2027"
  fechaLimite: "",

  // IBAN. Mientras esté vacío se muestra "Lo publicaremos pronto".
  iban: "",

  // Ranking del juego: URL de la "Aplicación web" de Google Apps Script (ver ranking-apps-script.gs).
  // Mientras esté vacío, el ranking solo guarda las partidas de este dispositivo.
  rankingUrl: "",

  // Google Form al que se envían las respuestas (se guardan en vuestra hoja de Google)
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLSdQKm17lzDf4Cireh675uH0OTEeBuyw3bkKtCmTJWNp9Yxqmg/formResponse",
  campos: {
    nombres: "entry.1902519707",  // "Nombre y apellidos de los asistentes"
    bus: "entry.287847995",       // "¿Necesitarás autobús desde Valladolid?"  (Si / No)
    asiste: "entry.1182325569",   // "¿Asistirás a la boda?"                   (Si / No)
    alergias: "entry.863025090",  // "Alergias, intolerancias alimentarias o menú infantil"
  },
};

/* ---------- Navegación ---------- */
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");

toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  toggle.textContent = open ? "Menú" : "Cerrar";
  menu.classList.toggle("is-open", !open);
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a") && toggle.getAttribute("aria-expanded") === "true") toggle.click();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { toggle.click(); toggle.focus(); }
});
addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 8), { passive: true });

/* ---------- Cuenta atrás ---------- */
const boda = new Date(CONFIG.fechaBoda).getTime();
const cd = { d: document.getElementById("cd-dias"), h: document.getElementById("cd-horas"), m: document.getElementById("cd-min") };
function tick() {
  const diff = Math.max(0, boda - Date.now());
  cd.d.textContent = Math.floor(diff / 864e5);
  cd.h.textContent = Math.floor(diff / 36e5) % 24;
  cd.m.textContent = Math.floor(diff / 6e4) % 60;
}
tick();
setInterval(tick, 30000);

/* ---------- Fecha límite e IBAN ---------- */
if (CONFIG.fechaLimite) {
  const el = document.getElementById("deadline");
  el.textContent = `Por favor, confirma antes del ${CONFIG.fechaLimite}.`;
  el.hidden = false;
}
if (CONFIG.iban) {
  document.getElementById("iban-num").textContent = CONFIG.iban;
  const btn = document.getElementById("iban-copy");
  const status = document.getElementById("iban-status");
  btn.hidden = false;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.iban.replace(/\s/g, ""));
      status.textContent = "IBAN copiado. ¡Gracias!";
    } catch {
      status.textContent = "No se pudo copiar; selecciónalo a mano.";
    }
  });
}

/* ---------- Formulario de confirmación ---------- */
const form = document.getElementById("rsvp-form");
const status = document.getElementById("form-status");
const onlyYes = form.querySelectorAll(".only-yes");

/* Casillas de personas: Persona 1, + Añadir otra persona (máx. 6) */
const MAX_PERSONAS = 6;
const peopleList = document.getElementById("people");
const addBtn = document.getElementById("people-add");

function personInputs() { return [...peopleList.querySelectorAll("input")]; }

function renumber() {
  const rows = [...peopleList.children];
  rows.forEach((li, i) => {
    const n = i + 1;
    const input = li.querySelector("input");
    input.id = `persona-${n}`;
    li.querySelector("label").setAttribute("for", input.id);
    li.querySelector("label").textContent = `Persona ${n}`;
    const rm = li.querySelector("button");
    rm.setAttribute("aria-label", `Quitar persona ${n}`);
    rm.disabled = rows.length === 1;
  });
  addBtn.disabled = rows.length >= MAX_PERSONAS;
  addBtn.lastChild.textContent = rows.length >= MAX_PERSONAS ? " Máximo 6 por formulario" : " Añadir otra persona";
}

function addPerson(focus) {
  if (peopleList.children.length >= MAX_PERSONAS) return;
  const li = document.createElement("li");
  li.className = "person";
  li.innerHTML = `<label></label>
    <input type="text" name="persona" autocomplete="off" maxlength="80" aria-describedby="nombres-help">
    <button class="person__remove" type="button"><span aria-hidden="true">×</span></button>`;
  const first = peopleList.children.length === 0;
  li.querySelector("input").placeholder = first ? "Ej.: Lucía García Pérez" : "Nombre y apellidos";
  li.querySelector("button").addEventListener("click", () => {
    const idx = [...peopleList.children].indexOf(li);
    li.remove();
    renumber();
    personInputs()[Math.max(0, idx - 1)].focus();
  });
  li.querySelector("input").addEventListener("keydown", (e) => {
    // Enter en la última casilla con texto: añade otra persona en vez de enviar
    if (e.key === "Enter") {
      e.preventDefault();
      if (li === peopleList.lastElementChild && e.target.value.trim()) addPerson(true);
      else li.nextElementSibling?.querySelector("input").focus();
    }
  });
  peopleList.append(li);
  renumber();
  if (focus) li.querySelector("input").focus();
}
addBtn.addEventListener("click", () => addPerson(true));
addPerson(false);

function asisteValue() { return form.querySelector('input[name="asiste"]:checked')?.value; }
function syncYes() {
  const no = asisteValue() === "No";
  onlyYes.forEach((el) => (el.hidden = no));
}
form.addEventListener("change", syncYes);

function showError(id, show, field) {
  document.getElementById(id).hidden = !show;
  if (field) field.setAttribute("aria-invalid", show ? "true" : "false");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const asiste = asisteValue();
  const nombres = personInputs().map((i) => i.value.trim()).filter(Boolean).join("\n");
  const bus = asiste === "No" ? "No" : form.querySelector('input[name="bus"]:checked')?.value;
  const firstPerson = personInputs()[0];

  showError("err-asiste", !asiste);
  showError("err-nombres", !nombres, firstPerson);
  showError("err-bus", asiste === "Si" && !bus);

  const firstBad = !asiste ? form.querySelector('input[name="asiste"]')
    : !nombres ? firstPerson
    : asiste === "Si" && !bus ? form.querySelector('input[name="bus"]') : null;
  if (firstBad) { firstBad.focus(); status.className = "form__status bad"; status.textContent = "Revisa los campos marcados."; return; }

  const data = new URLSearchParams();
  data.append(CONFIG.campos.nombres, nombres);
  data.append(CONFIG.campos.asiste, asiste);
  data.append(CONFIG.campos.bus, bus);
  data.append(CONFIG.campos.alergias, asiste === "Si" ? form.alergias.value.trim() : "");

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.className = "form__status";
  status.textContent = "Enviando…";

  try {
    // Google no deja leer la respuesta (no-cors), pero si la red responde, la respuesta queda guardada.
    await fetch(CONFIG.formAction, { method: "POST", mode: "no-cors", body: data });
    const si = asiste === "Si";
    form.classList.add("is-sent");
    form.innerHTML = si
      ? `<h3>¡Confirmado!</h3><p>Gracias por confirmar. Nos vemos el 4 de diciembre.</p><p><a class="btn btn--ghost" href="boda.ics" download>Añadir al calendario</a></p>`
      : `<h3>Te echaremos de menos</h3><p>Gracias por avisarnos. Brindaremos por ti.</p>`;
    form.setAttribute("tabindex", "-1");
    form.focus();
    if (si) confetti();
  } catch {
    button.disabled = false;
    status.className = "form__status bad";
    status.innerHTML = 'No se ha podido enviar. Revisa tu conexión o usa el <a href="https://docs.google.com/forms/d/e/1FAIpQLSdQKm17lzDf4Cireh675uH0OTEeBuyw3bkKtCmTJWNp9Yxqmg/viewform" target="_blank" rel="noopener">formulario de Google</a>.';
  }
});

/* ---------- Confeti al confirmar ---------- */
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas");
  c.setAttribute("aria-hidden", "true");
  Object.assign(c.style, { position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 99 });
  document.body.append(c);
  const ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const colors = ["#a8743a", "#5f7458", "#e8c9a0", "#c98b7a", "#f7f2e8"];
  const bits = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5,
    vx: (Math.random() - .5) * 2, vy: 2 + Math.random() * 3,
    s: 4 + Math.random() * 6, r: Math.random() * 6, col: colors[(Math.random() * colors.length) | 0],
  }));
  const end = performance.now() + 3500;
  (function frame(t) {
    ctx.clearRect(0, 0, c.width, c.height);
    bits.forEach((b) => {
      b.x += b.vx; b.y += b.vy; b.r += .1;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.col; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
    });
    t < end ? requestAnimationFrame(frame) : c.remove();
  })(performance.now());
}

/* ---------- Ranking ---------- */
const Ranking = (() => {
  const list = document.getElementById("ranking-list");
  const statusEl = document.getElementById("ranking-status");
  const player = document.getElementById("player");
  const online = Boolean(CONFIG.rankingUrl);
  const LOCAL_KEY = "ramo-ranking";

  player.value = localStorage.getItem("ramo-nombre") || "";
  player.addEventListener("change", () => localStorage.setItem("ramo-nombre", player.value.trim()));

  const cleanName = (s) => s.replace(/\s+/g, " ").trim().slice(0, 20);
  const getName = () => cleanName(player.value);

  function render(top, me) {
    list.replaceChildren(...top.map((row) => {
      const li = document.createElement("li");
      const n = document.createElement("span"); n.className = "name"; n.textContent = row.name;
      const p = document.createElement("span"); p.className = "pts"; p.textContent = `${row.score} pts`;
      if (me && row.name.toLowerCase() === me.toLowerCase()) li.classList.add("is-me");
      li.append(n, p);
      return li;
    }));
    if (!top.length) statusEl.textContent = "Aún no juega nadie. Estrénalo tú.";
  }

  // Ranking guardado en este dispositivo (cuando no hay rankingUrl)
  function localTop() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; } }
  function localSave(name, score) {
    const all = localTop();
    const i = all.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
    if (i === -1) all.push({ name, score });
    else if (score > all[i].score) all[i].score = score;
    all.sort((a, b) => b.score - a.score);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 10)));
    return all.slice(0, 10);
  }

  async function load() {
    if (!online) {
      render(localTop(), getName());
      if (localTop().length) statusEl.textContent = "Ranking de este dispositivo. El ranking compartido se activará pronto.";
      return;
    }
    statusEl.textContent = "Cargando ranking…";
    try {
      const res = await fetch(`${CONFIG.rankingUrl}?action=top`);
      const data = await res.json();
      render(data.top || [], getName());
      if (data.top?.length) statusEl.textContent = "";
    } catch {
      statusEl.textContent = "No se ha podido cargar el ranking ahora mismo.";
    }
  }

  // Devuelve un texto corto para el final de la partida
  async function submit(score) {
    const name = getName();
    if (!name) return "Escribe tu nombre para salir en el ranking.";
    localStorage.setItem("ramo-nombre", name);
    if (!online) {
      const top = localSave(name, score);
      render(top, name);
      statusEl.textContent = "Ranking de este dispositivo. El ranking compartido se activará pronto.";
      const pos = top.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
      return pos >= 0 ? `Vas ${pos + 1}º en el ranking.` : "";
    }
    try {
      const res = await fetch(CONFIG.rankingUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita la comprobación CORS previa
        body: JSON.stringify({ name, score }),
      });
      const data = await res.json();
      render(data.top || [], name);
      statusEl.textContent = "";
      return data.rank ? `Vas ${data.rank}º de ${data.total} en el ranking.` : "";
    } catch {
      statusEl.textContent = "No se ha podido guardar tu puntuación. Prueba otra vez en un rato.";
      return "";
    }
  }

  document.getElementById("ranking-refresh").addEventListener("click", load);
  load();
  return { submit };
})();

/* ---------- Juego: Atrapa el ramo ---------- */
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const overlay = document.getElementById("game-overlay");
  const msg = document.getElementById("game-msg");
  const startBtn = document.getElementById("game-start");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");

  const ITEMS = [
    { e: "💐", pts: 1, w: 62 },
    { e: "💍", pts: 5, w: 10 },
    { e: "🧾", pts: -3, w: 28 },
  ];
  const totalW = ITEMS.reduce((a, b) => a + b.w, 0);
  const pick = () => { let r = Math.random() * totalW; return ITEMS.find((it) => (r -= it.w) < 0); };

  let best = Number(localStorage.getItem("ramo-record") || 0);
  bestEl.textContent = best;

  let state, keys = {}, last = 0, raf;
  const basket = { x: W / 2, w: 110, h: 22, y: H - 40 };

  function reset() {
    state = { running: true, score: 0, time: 30, items: [], spawn: 0, pops: [] };
    basket.x = W / 2;
    scoreEl.textContent = 0; timeEl.textContent = 30;
  }

  function drawBasket() {
    const x = basket.x - basket.w / 2, y = basket.y;
    ctx.fillStyle = "#a8743a";
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + basket.w, y);
    ctx.lineTo(x + basket.w - 12, y + basket.h); ctx.lineTo(x + 12, y + basket.h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#8a5d2c"; ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * basket.w / 6, y + 2); ctx.lineTo(x + i * basket.w / 6, y + basket.h - 2); ctx.stroke(); }
    ctx.beginPath(); ctx.strokeStyle = "#a8743a"; ctx.lineWidth = 4;
    ctx.arc(basket.x, y, basket.w / 2 - 6, Math.PI, 0); ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#efe7d6"; ctx.fillRect(0, H - 14, W, 14);
    ctx.font = "40px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    state?.items.forEach((it) => ctx.fillText(it.e, it.x, it.y));
    drawBasket();
    ctx.font = "700 26px Manrope, sans-serif";
    state?.pops.forEach((p) => { ctx.globalAlpha = p.a; ctx.fillStyle = p.pts > 0 ? "#3f5039" : "#a3341f"; ctx.fillText((p.pts > 0 ? "+" : "") + p.pts, p.x, p.y); });
    ctx.globalAlpha = 1;
  }

  function update(dt) {
    const s = state;
    s.time -= dt;
    if (s.time <= 0) return finish();
    timeEl.textContent = Math.ceil(s.time);

    const speed = 520;
    if (keys.ArrowLeft) basket.x -= speed * dt;
    if (keys.ArrowRight) basket.x += speed * dt;
    basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, basket.x));

    const level = 1 + (30 - s.time) / 15; // se acelera con el tiempo
    s.spawn -= dt;
    if (s.spawn <= 0) {
      const it = pick();
      s.items.push({ ...it, x: 30 + Math.random() * (W - 60), y: -30, v: (150 + Math.random() * 120) * level });
      s.spawn = .65 / level;
    }
    s.items = s.items.filter((it) => {
      it.y += it.v * dt;
      if (it.y > basket.y - 14 && it.y < basket.y + basket.h && Math.abs(it.x - basket.x) < basket.w / 2 + 8) {
        s.score = Math.max(0, s.score + it.pts);
        scoreEl.textContent = s.score;
        s.pops.push({ x: it.x, y: basket.y - 30, a: 1, pts: it.pts });
        return false;
      }
      return it.y < H + 30;
    });
    s.pops = s.pops.filter((p) => ((p.y -= 40 * dt), (p.a -= 1.4 * dt), p.a > 0));
  }

  function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (state.running) { update(dt); draw(); raf = requestAnimationFrame(loop); }
  }

  function verdict(s) {
    if (s >= 60) return "Nivel: te casas tú la próxima.";
    if (s >= 35) return "Nivel: el ramo es tuyo, avisa a tu pareja.";
    if (s >= 15) return "Nivel: buena mano, poca suerte.";
    return "Nivel: tú mejor a la barra.";
  }

  async function finish() {
    state.running = false;
    cancelAnimationFrame(raf);
    const s = state.score;
    const record = s > best;
    if (record) { best = s; localStorage.setItem("ramo-record", s); bestEl.textContent = s; }
    timeEl.textContent = 0;
    const base = `${s} puntos${record ? " · ¡nuevo récord!" : ""}. ${verdict(s)}`;
    msg.textContent = base;
    startBtn.textContent = "Jugar otra vez";
    startBtn.disabled = true;
    overlay.hidden = false;
    const extra = await Ranking.submit(s);
    if (extra) msg.textContent = `${base} ${extra}`;
    startBtn.disabled = false;
    startBtn.focus();
  }

  function start() {
    reset();
    overlay.hidden = true;
    canvas.setAttribute("tabindex", "0");
    canvas.focus({ preventScroll: true });
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", start);

  // Teclado (solo cuando el juego tiene el foco, para no bloquear el scroll de la página)
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { keys[e.key] = true; e.preventDefault(); }
  });
  canvas.addEventListener("keyup", (e) => { keys[e.key] = false; });
  canvas.addEventListener("blur", () => { keys = {}; });

  // Ratón y dedo
  function pointer(e) {
    if (!state?.running) return;
    const rect = canvas.getBoundingClientRect();
    basket.x = ((e.clientX - rect.left) / rect.width) * W;
  }
  canvas.addEventListener("pointermove", pointer);
  canvas.addEventListener("pointerdown", pointer);

  draw();
})();
