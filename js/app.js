const state = {
  day: 1,
  coins: 120,
  reputation: 100,
  combo: 1,
  energy: 10,
  dayTime: 45,
  guests: [],
  spawnEvery: 3200,
  tick: null,
  spawn: null,
  clockMinutes: 9 * 60,
  upgrades: { desk: 0, house: 0, cart: 0, aura: 0 }
};

const needSet = ["checkin", "clean", "snack", "decor"];
const faces = ["🧑‍💼","👩‍🎤","🧑‍🍳","👨‍🎨","👩‍💻","🧑‍🚀","👩‍🔬","🧸"];
const names = ["Mika","Leo","Nina","Toto","Ravi","June","Pip","Luna","Kai","Momo"];

const els = {
  day: document.getElementById("day"),
  coins: document.getElementById("coins"),
  rep: document.getElementById("rep"),
  combo: document.getElementById("combo"),
  energy: document.getElementById("energy"),
  time: document.getElementById("time"),
  guests: document.getElementById("guests"),
  log: document.getElementById("log"),
  clock: document.getElementById("clock")
};

function rnd(n) { return Math.floor(Math.random() * n); }
function pick(a) { return a[rnd(a.length)]; }

function addLog(text) {
  const line = document.createElement("div");
  line.textContent = `• ${text}`;
  els.log.prepend(line);
  while (els.log.children.length > 28) els.log.removeChild(els.log.lastChild);
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}

function render() {
  els.day.textContent = state.day;
  els.coins.textContent = state.coins;
  els.rep.textContent = Math.max(0, Math.floor(state.reputation));
  els.combo.textContent = `x${state.combo}`;
  els.energy.textContent = state.energy;
  els.time.textContent = Math.ceil(state.dayTime);

  els.guests.innerHTML = state.guests.map(g => {
    const p = Math.max(0, Math.min(1, g.time / g.maxTime));
    const tags = g.needs.map(n => ({checkin:"🛎️",clean:"🧼",snack:"🧁",decor:"🌸"}[n])).join(" ");
    return `<article class="guest" data-id="${g.id}">
      <div class="avatar">${g.face}</div>
      <div>
        <strong>${g.name}</strong>
        <div class="needs">Needs: ${tags}</div>
        <div class="bar"><i style="transform:scaleX(${p})"></i></div>
      </div>
      <div class="timer">${g.time.toFixed(1)}s</div>
    </article>`;
  }).join("");
}

function spawnGuest() {
  const complexity = Math.min(4, 1 + Math.floor((state.day - 1) / 2));
  const shuffled = [...needSet].sort(() => Math.random() - 0.5);
  state.guests.push({
    id: crypto.randomUUID(),
    name: pick(names),
    face: pick(faces),
    needs: shuffled.slice(0, complexity),
    maxTime: Math.max(8, 17 - state.day),
    time: Math.max(8, 17 - state.day)
  });
  if (state.guests.length > 10) state.guests.shift();
  render();
}

function serve(type) {
  if (state.energy <= 0) return toast("No energy! Wait for recharge ✨");
  const target = state.guests.find(g => g.needs.includes(type));
  state.energy -= 1;

  if (!target) {
    state.combo = 1;
    state.reputation -= 2;
    addLog("Oops! Wrong action, staff got confused.");
    return render();
  }

  target.needs = target.needs.filter(n => n !== type);
  if (target.needs.length === 0) {
    const reward = 14 + 3 * state.combo + state.upgrades.aura;
    state.coins += reward;
    state.reputation = Math.min(100, state.reputation + 1.6);
    state.combo = Math.min(12, state.combo + 1);
    state.guests = state.guests.filter(g => g.id !== target.id);
    toast(`Happy guest! +${reward} coins 💖`);
    addLog(`Guest delighted! Combo up to x${state.combo}.`);
  } else {
    state.coins += 2;
    addLog("Nice service! Keep going for a full clear.");
  }
  render();
}

function buyUpgrade(kind, cost) {
  if (state.coins < cost) return toast("Not enough coins");
  state.coins -= cost;
  state.upgrades[kind] += 1;
  if (kind === "desk") state.spawnEvery = Math.max(1400, state.spawnEvery - 180);
  if (kind === "house") state.reputation = Math.min(100, state.reputation + 8);
  if (kind === "cart") state.energy += 2;
  if (kind === "aura") state.combo = Math.min(12, state.combo + 1);
  addLog(`Upgrade purchased: ${kind} Lv.${state.upgrades[kind]}`);
  render();
  restartSpawnLoop();
}

function restartSpawnLoop() {
  clearInterval(state.spawn);
  state.spawn = setInterval(spawnGuest, state.spawnEvery);
}

function endDay() {
  clearInterval(state.tick);
  clearInterval(state.spawn);
  const bonus = Math.floor(state.reputation + state.combo * 8);
  state.coins += bonus;
  toast(`Day ${state.day} done! Bonus +${bonus} 🌟`);
  addLog(`Day ${state.day} complete. Bonus ${bonus}.`);

  state.day += 1;
  state.dayTime = 45;
  state.energy = 10 + state.upgrades.cart * 2;
  state.combo = 1;
  state.reputation = Math.max(35, state.reputation - 5 + state.upgrades.house * 2);
  state.spawnEvery = Math.max(1300, 3200 - state.day * 140 - state.upgrades.desk * 120);
  state.guests = [];

  startDay();
}

function startDay() {
  addLog(`Day ${state.day} started. Keep guests smiling!`);
  restartSpawnLoop();
  clearInterval(state.tick);
  state.tick = setInterval(() => {
    state.dayTime -= 0.2;
    state.clockMinutes += 1;
    els.clock.textContent = `${String(Math.floor((state.clockMinutes % (24*60))/60)).padStart(2,"0")}:${String(state.clockMinutes%60).padStart(2,"0")}`;

    state.guests.forEach(g => g.time -= 0.2);
    const before = state.guests.length;
    state.guests = state.guests.filter(g => g.time > 0);
    const left = before - state.guests.length;
    if (left > 0) {
      state.reputation -= left * 6;
      state.combo = 1;
      addLog(`${left} guest(s) left upset...`);
    }

    if (Math.random() < 0.18) state.energy = Math.min(16, state.energy + 1);

    if (state.dayTime <= 0 || state.reputation <= 0) return endDay();
    render();
  }, 200);

  spawnGuest();
  render();
}

document.querySelectorAll("button[data-action]").forEach(btn => {
  btn.addEventListener("click", () => serve(btn.dataset.action));
});

document.querySelectorAll("button[data-upgrade]").forEach(btn => {
  const cost = Number(btn.textContent.match(/\((\d+)\)/)?.[1] || 0);
  btn.addEventListener("click", () => buyUpgrade(btn.dataset.upgrade, cost));
});

addLog("Welcome manager! Keep this cute hotel thriving.");
startDay();
