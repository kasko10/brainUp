const defQ = [
  { q: "Қазақстанның астанасы қай қала?", o: ["Алматы", "Астана", "Шымкент", "Түркістан"], c: 1 },
  { q: "Ең үлкен ғаламшар қалай аталады?", o: ["Марс", "Жер", "Юпитер", "Сатурн"], c: 2 },
  { q: "1 байтта неше бит бар?", o: ["4 бит", "8 бит", "16 бит", "32 бит"], c: 1 },
  { q: "Абай Құнанбайұлы қай жылы туған?", o: ["1845", "1835", "1855", "1865"], c: 0 }
];

// Құпиясөздің шифрланған ізі (SHA-256)
const SECRET_HASH = "e719c264ef1d9319c7e4e2a50a31a2fc57379f44d2a1b43b155770415c9b8b49";
let isAuth = false;
let fails = 0;
let lockUntil = Number(localStorage.getItem("bu_lock")) || 0;

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadShared() {
  try {
    const p = new URLSearchParams(window.location.search).get("q");
    if (p) return JSON.parse(decodeURIComponent(escape(atob(p))));
  } catch (e) {}
  return null;
}

const sharedQ = loadShared();
let qs = sharedQ || JSON.parse(localStorage.getItem("bu_q")) || defQ;
let leads = JSON.parse(localStorage.getItem("bu_l")) || [{ n: "Әлихан", s: 520 }, { n: "Айзере", s: 440 }];
let idx = 0, pts = 0, ok = 0, t = 15, tm, usr = "", lock = false, log = [];

function show(id) {
  clearInterval(tm);
  ["v-home", "v-login", "v-quiz", "v-res", "v-adm"].forEach(v => document.getElementById(v).classList.add("hide"));
  document.getElementById(id).classList.remove("hide");
  document.getElementById("board").classList.toggle("hide", id !== "v-home");
  document.getElementById("t-user").classList.toggle("on", id !== "v-adm" && id !== "v-login");
  document.getElementById("t-adm").classList.toggle("on", id === "v-adm" || id === "v-login");
  document.getElementById("q-info").innerText = (sharedQ ? "🔗 Арнайы сілтемедегі тест: " : "Платформада ") + qs.length + " сұрақ дайын";
  const b = document.getElementById("l-list"); b.innerHTML = "";
  leads.slice(0, 3).forEach((x, i) => b.innerHTML += `<div class="row"><span>${i + 1}. ${x.n}</span><b>${x.s} ұпай</b></div>`);
}
show("v-home");

function openStudio() {
  if (isAuth) { show("v-adm"); renderAdm(); }
  else { show("v-login"); checkLockState(); }
}

function logoutStudio() {
  isAuth = false;
  show("v-home");
}

function checkLockState() {
  const now = Date.now();
  const btn = document.getElementById("login-btn");
  const msg = document.getElementById("lock-msg");
  if (lockUntil > now) {
    btn.disabled = true;
    const sec = Math.ceil((lockUntil - now) / 1000);
    msg.style.color = "#fca5a5";
    msg.innerText = `Қауіпсіздік бұғаты: ${sec} секунд күтіңіз`;
    setTimeout(checkLockState, 1000);
  } else {
    btn.disabled = false;
    msg.style.color = "#94a3b8";
    msg.innerText = "Жүйеге кіру үшін құпиясөзді енгізіңіз";
  }
}

async function checkPass() {
  if (Date.now() < lockUntil) return;
  const val = document.getElementById("apass").value;
  const hashed = await sha256(val);
  if (hashed === SECRET_HASH) {
    isAuth = true; fails = 0;
    document.getElementById("apass").value = "";
    show("v-adm"); renderAdm();
  } else {
    fails++;
    document.getElementById("apass").value = "";
    if (fails >= 3) {
      lockUntil = Date.now() + 60000;
      localStorage.setItem("bu_lock", lockUntil);
      fails = 0;
      checkLockState();
    } else {
      alert(`Құпиясөз қате! Қалған мүмкіндік: ${3 - fails}`);
    }
  }
}

function renderAdm() {
  if (!isAuth) return show("v-login");
  const b = document.getElementById("adm-list"); b.innerHTML = "";
  qs.forEach((x, i) => b.innerHTML += `<div class="item"><span>${i + 1}. ${x.q} <b>(${"ABCD"[x.c]})</b></span><button class="del" onclick="delQ(${i})">Өшіру</button></div>`);
}

function addQ() {
  if (!isAuth) return show("v-login");
  const q = document.getElementById("nq").value.trim();
  const o0 = document.getElementById("o0").value.trim(), o1 = document.getElementById("o1").value.trim();
  const o2 = document.getElementById("o2").value.trim(), o3 = document.getElementById("o3").value.trim();
  if (!q || !o0 || !o1 || !o2 || !o3) return alert("Барлық жолды толтырыңыз!");
  qs.push({ q, o: [o0, o1, o2, o3], c: Number(document.getElementById("nc").value) });
  localStorage.setItem("bu_q", JSON.stringify(qs));
  ["nq", "o0", "o1", "o2", "o3"].forEach(i => document.getElementById(i).value = ""); renderAdm();
}

function delQ(i) {
  if (!isAuth) return show("v-login");
  if (qs.length <= 1) return alert("Кемінде 1 сұрақ қалуы керек!");
  qs.splice(i, 1); localStorage.setItem("bu_q", JSON.stringify(qs)); renderAdm();
}

function shareQuiz() {
  if (!isAuth) return show("v-login");
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(qs))));
  const url = window.location.origin + window.location.pathname + "?q=" + encoded;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => alert("✅ Сілтеме көшірілді!"));
  } else {
    prompt("Сілтемені көшіріп алыңыз:", url);
  }
}

function startQuiz() {
  usr = document.getElementById("uname").value.trim() || usr || "Қонақ";
  idx = 0; pts = 0; ok = 0; log = []; show("v-quiz"); nextQ();
}

function nextQ() {
  clearInterval(tm); lock = false; t = 15;
  document.getElementById("sec").innerText = t;
  document.getElementById("q-num").innerText = `Сұрақ ${idx + 1} / ${qs.length}`;
  document.getElementById("pfill").style.width = ((idx + 1) / qs.length * 100) + "%";
  document.getElementById("q-txt").innerText = qs[idx].q;
  const b = document.getElementById("q-opts"); b.innerHTML = "";
  qs[idx].o.forEach((txt, i) => {
    const btn = document.createElement("button"); btn.className = "opt";
    btn.innerText = txt; btn.onclick = () => pick(i); b.appendChild(btn);
  });
  tm = setInterval(() => { t--; document.getElementById("sec").innerText = t; if (t <= 0) { clearInterval(tm); pick(-1); } }, 1000);
}

function pick(sel) {
  if (lock) return; lock = true; clearInterval(tm);
  const item = qs[idx], cor = item.c;
  document.querySelectorAll(".opt").forEach((b, i) => { b.disabled = true; if (i === cor) b.classList.add("ok"); else if (i === sel) b.classList.add("no"); });
  const isRight = (sel === cor);
  if (isRight) { ok++; pts += 100 + t * 10; }
  log.push({ q: item.q, u: sel >= 0 ? item.o[sel] : "Уақыт бітті ⏱", c: item.o[cor], right: isRight });

  setTimeout(() => {
    idx++; if (idx < qs.length) nextQ();
    else finish();
  }, 850);
}

function finish() {
  leads.unshift({ n: usr, s: pts }); leads.sort((a, b) => b.s - a.s);
  localStorage.setItem("bu_l", JSON.stringify(leads.slice(0, 5)));
  show("v-res");
  document.getElementById("r-hi").innerText = "Жарайсыз, " + usr + "!";
  document.getElementById("r-pts").innerText = pts + " ұпай";
  document.getElementById("r-stat").innerText = `${qs.length} сұрақтың ${ok}-і дұрыс`;

  const rev = document.getElementById("review-list");
  rev.innerHTML = "<div style='font-weight:700;margin-bottom:10px;color:#a5b4fc'>📋 Қателермен жұмыс:</div>";
  log.forEach((h, i) => {
    rev.innerHTML += `<div style="background:#0b0f19;border-left:4px solid ${h.right ? '#10b981' : '#ef4444'};padding:10px 14px;border-radius:8px;margin-bottom:8px;text-align:left;font-size:0.92rem">
      <div style="font-weight:700;margin-bottom:4px">${i + 1}. ${h.q}</div>
      <div style="color:${h.right ? '#6ee7b7' : '#fca5a5'}">Сіздің жауабыңыз: <b>${h.u}</b></div>
      ${!h.right ? `<div style="color:#6ee7b7">Дұрыс жауап: <b>${h.c}</b></div>` : ''}
    </div>`;
  });
  if (ok > 0) confetti();
}

function confetti() {
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  let p = Array.from({ length: 60 }, () => ({ x: Math.random() * cv.width, y: -20, r: Math.random() * 6 + 3, c: ["#6366f1", "#a855f7", "#10b981", "#f59e0b"][Math.floor(Math.random() * 4)], v: Math.random() * 4 + 2 }));
  let f = 0; (function d() { ctx.clearRect(0, 0, cv.width, cv.height); p.forEach(i => { i.y += i.v; ctx.fillStyle = i.c; ctx.beginPath(); ctx.arc(i.x, i.y, i.r, 0, 7); ctx.fill(); }); if (++f < 90) requestAnimationFrame(d); else ctx.clearRect(0, 0, cv.width, cv.height); })();
}
