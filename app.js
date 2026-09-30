import * as THREE from "three";

const DEMO_EMAIL = "demo@lumenroast.com";
const DEMO_PASSWORD = "lumen123";

const DEALS = [
  {
    id: "starter",
    name: "Starter Flight",
    bags: 3,
    price: 28,
    perBag: 9.33,
    copy: "Ethiopia, Colombia, and a house espresso blend.",
  },
  {
    id: "house",
    name: "House Favorite",
    bags: 5,
    price: 42,
    perBag: 8.4,
    copy: "Five origins, roasted this week. Best price per bag.",
    best: true,
  },
  {
    id: "vault",
    name: "Tasting Vault",
    bags: 8,
    price: 72,
    perBag: 9,
    copy: "The full board: rare microlots plus two decafs.",
  },
];

const canvas = document.getElementById("scene");
const stageLabel = document.getElementById("stage-label");
const panels = {
  login: document.getElementById("panel-login"),
  deals: document.getElementById("panel-deals"),
  checkout: document.getElementById("panel-checkout"),
  done: document.getElementById("panel-done"),
};

let selectedDeal = null;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0c0908, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 1.4, 8);

scene.add(new THREE.AmbientLight(0xffe6cc, 0.55));
const key = new THREE.DirectionalLight(0xffd9a8, 1.35);
key.position.set(4, 6, 5);
scene.add(key);
const rim = new THREE.PointLight(0xd7b56d, 18, 18);
rim.position.set(-3, 2, 2);
scene.add(rim);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(9, 64),
  new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    metalness: 0.2,
    roughness: 0.8,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.6;
scene.add(floor);

const packs = [];
const palette = [0x8f3b24, 0xd7b56d, 0x3d7a58];

function makePack(color, x) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 1.5, 0.42),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.15,
    })
  );
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.12, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xf4ece2, roughness: 0.4 })
  );
  lid.position.y = 0.82;
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a140f, metalness: 0.6 })
  );
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, 0.2, 0.22);
  group.add(body, lid, seal);
  group.position.set(x, 0, 0);
  scene.add(group);
  packs.push(group);
}

makePack(palette[0], -2.1);
makePack(palette[1], 0);
makePack(palette[2], 2.1);

const particles = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0xd7b56d, size: 0.035 })
);
const count = 180;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count; i += 1) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = Math.random() * 5;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
}
particles.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
scene.add(particles);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let screen = "login";
function setScreen(next) {
  screen = next;
  Object.entries(panels).forEach(([key, el]) => {
    const show = key === next;
    el.classList.toggle("hidden", !show);
    el.hidden = !show;
  });
  const labels = {
    login: "Sign in",
    deals: "Deals",
    checkout: "Checkout",
    done: "Confirmed",
  };
  stageLabel.textContent = labels[next];
}

function renderDeals() {
  const grid = document.getElementById("deal-grid");
  grid.innerHTML = "";
  DEALS.forEach((deal) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `deal-card${deal.best ? " best" : ""}${
      selectedDeal?.id === deal.id ? " selected" : ""
    }`;
    btn.innerHTML = `
      ${deal.best ? `<span class="badge">Best value</span>` : ""}
      <h2>${deal.name}</h2>
      <div class="price">$${deal.price} · ${deal.bags} bags</div>
      <p>$${deal.perBag.toFixed(2)} per bag</p>
      <p>${deal.copy}</p>
    `;
    btn.addEventListener("click", () => selectDeal(deal.id));
    grid.appendChild(btn);
  });
}

function selectDeal(id) {
  selectedDeal = DEALS.find((d) => d.id === id) ?? null;
  document.getElementById("btn-continue").disabled = !selectedDeal;
  renderDeals();
  packs.forEach((pack, i) => {
    const active = DEALS[i]?.id === id;
    pack.scale.setScalar(active ? 1.12 : 0.92);
  });
}

function bestDeal() {
  return DEALS.reduce((winner, deal) =>
    deal.perBag < winner.perBag ? deal : winner
  );
}

function renderSummary() {
  const deal = selectedDeal;
  document.getElementById("order-summary").innerHTML = `
    <h2>${deal.name}</h2>
    <p>${deal.bags} coffee sampler bags</p>
    <p>${deal.copy}</p>
    <p class="price">Total $${deal.price}.00</p>
  `;
}

document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const error = document.getElementById("login-error");
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    error.hidden = false;
    error.textContent = "Use the demo email and password shown above.";
    return;
  }
  error.hidden = true;
  renderDeals();
  setScreen("deals");
});

document.getElementById("btn-best").addEventListener("click", () => {
  selectDeal(bestDeal().id);
});

document.getElementById("btn-continue").addEventListener("click", () => {
  if (!selectedDeal) return;
  renderSummary();
  setScreen("checkout");
});

document.getElementById("btn-back").addEventListener("click", () => {
  setScreen("deals");
});

document.getElementById("pay-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const card = String(data.get("card") || "").replace(/\s+/g, "");
  const error = document.getElementById("pay-error");
  if (!/^\d{13,19}$/.test(card)) {
    error.hidden = false;
    error.textContent = "Enter a fake 13–19 digit card number to continue.";
    return;
  }
  error.hidden = true;
  document.getElementById("done-copy").textContent =
    `${selectedDeal.name} ($${selectedDeal.price}) is confirmed. This was a local demo — no charge was made.`;
  setScreen("done");
});

document.getElementById("btn-reset").addEventListener("click", () => {
  selectedDeal = null;
  document.getElementById("login-form").reset();
  document.getElementById("pay-form").reset();
  document.getElementById("btn-continue").disabled = true;
  packs.forEach((pack) => pack.scale.setScalar(1));
  setScreen("login");
});

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  packs.forEach((pack, i) => {
    pack.rotation.y = Math.sin(t * 0.6 + i) * 0.25;
    pack.position.y = Math.sin(t * 1.2 + i) * 0.12;
  });
  camera.position.x = Math.sin(t * 0.15) * (screen === "login" ? 0.4 : 1.2);
  camera.lookAt(0, 0.2, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
