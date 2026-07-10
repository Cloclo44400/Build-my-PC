// app.js — logique principale de l'application Build my PC

let state = {
  currentPage: "accueil",
  currentConfig: null,      // config en cours d'édition
  activeChallenge: null,    // défi en cours (ou null en création libre)
};

// ---------- NAVIGATION ----------

function navigate(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById("page-" + pageId).classList.add("active");
  document.querySelectorAll(`.nav-btn[data-nav="${pageId}"]`).forEach(b => b.classList.add("active"));

  state.currentPage = pageId;

  if (pageId === "accueil") renderHome();
  if (pageId === "defis") renderChallenges();
  if (pageId === "communaute") renderCommunity();
  if (pageId === "profil") renderProfile();
}

document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", () => navigate(el.dataset.nav));
});

// ---------- ACCUEIL ----------

function renderHome() {
  const configs = Storage.getConfigs()
    .filter(c => c.published)
    .sort((a, b) => b.date - a.date)
    .slice(0, 3);

  document.getElementById("home-latest").innerHTML = configs.length
    ? configs.map(renderConfigCard).join("")
    : `<p class="muted">Aucune configuration publiée pour le moment. Sois le premier !</p>`;

  const popularChallenges = CHALLENGES.slice(0, 3);
  document.getElementById("home-challenges").innerHTML = popularChallenges.map(renderChallengeCard).join("");

  attachCardEvents();
}

// ---------- DEFIS ----------

function renderChallenges() {
  document.getElementById("challenge-list").innerHTML = CHALLENGES.map(renderChallengeCard).join("");
  attachCardEvents();
}

function renderChallengeCard(ch) {
  return `
    <div class="card" data-challenge="${ch.id}">
      <span class="badge ${ch.difficulty}">${difficultyLabel(ch.difficulty)}</span>
      <h3>${ch.title}</h3>
      <p class="meta">${ch.description}</p>
      <div class="price">${ch.budget} € max</div>
      <div class="footer-row">
        <span>${ch.constraints.length} contrainte(s)</span>
        <button class="btn small">Relever le défi</button>
      </div>
    </div>
  `;
}

function difficultyLabel(d) {
  return { easy: "Facile", medium: "Moyen", hard: "Difficile" }[d] || d;
}

function attachCardEvents() {
  document.querySelectorAll("[data-challenge]").forEach(card => {
    card.addEventListener("click", () => startChallenge(card.dataset.challenge));
  });
  document.querySelectorAll("[data-config]").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return; // les boutons gèrent leurs propres clics
      openConfigModal(card.dataset.config);
    });
  });
  document.querySelectorAll("[data-like]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(btn.dataset.like);
    });
  });
}

function startChallenge(challengeId) {
  const challenge = CHALLENGES.find(c => c.id === challengeId);
  state.activeChallenge = challenge;
  state.currentConfig = newEmptyConfig();
  state.currentConfig.budget = challenge.budget;
  state.currentConfig.challengeId = challenge.id;

  document.getElementById("builder-title").textContent = "Défi : " + challenge.title;
  const banner = document.getElementById("builder-challenge-info");
  banner.style.display = "block";
  banner.innerHTML = `
    <strong>${challenge.title}</strong> — ${challenge.description}<br>
    <span class="muted">Contraintes : ${challenge.constraints.join(" · ")}</span>
  `;
  document.getElementById("challenge-score").style.display = "block";
  document.getElementById("cfg-budget").value = challenge.budget;

  loadConfigIntoBuilder(state.currentConfig);
  navigate("creation");
}

// ---------- BUILDER (création libre + défis) ----------

function newEmptyConfig() {
  return {
    id: Storage.uid(),
    name: "",
    description: "",
    budget: null,
    components: [],
    author: getProfile().pseudo,
    date: Date.now(),
    published: false,
    likes: [],
    views: 0,
    ratings: [],
    challengeId: null
  };
}

function componentRowTemplate(component) {
  return `
    <div class="component-row" data-comp-id="${component.id}">
      <div class="row-head">
        <select class="comp-type">
          ${COMPONENT_TYPES.map(t => `<option value="${t}" ${t === component.type ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <button class="remove-component" title="Supprimer">✕</button>
      </div>
      <input type="text" class="comp-name" placeholder="Nom du composant" value="${escapeHtml(component.name)}">
      <input type="number" class="comp-price" placeholder="Prix (€)" value="${component.price || ""}">
      <input type="url" class="comp-link full" placeholder="Lien du produit (optionnel)" value="${escapeHtml(component.link || "")}">
      <input type="text" class="comp-store" placeholder="Magasin" value="${escapeHtml(component.store || "")}">
      <select class="comp-state">
        <option value="Neuf" ${component.state === "Neuf" ? "selected" : ""}>Neuf</option>
        <option value="Occasion" ${component.state === "Occasion" ? "selected" : ""}>Occasion</option>
      </select>
      <input type="text" class="comp-comments full" placeholder="Commentaires (optionnel)" value="${escapeHtml(component.comments || "")}">
    </div>
  `;
}

function renderComponents() {
  const list = document.getElementById("components-list");
  list.innerHTML = state.currentConfig.components.map(componentRowTemplate).join("");

  list.querySelectorAll(".component-row").forEach(row => {
    const id = row.dataset.compId;
    row.querySelector(".comp-type").addEventListener("change", e => updateComponent(id, "type", e.target.value));
    row.querySelector(".comp-name").addEventListener("input", e => updateComponent(id, "name", e.target.value));
    row.querySelector(".comp-price").addEventListener("input", e => updateComponent(id, "price", e.target.value));
    row.querySelector(".comp-link").addEventListener("input", e => updateComponent(id, "link", e.target.value));
    row.querySelector(".comp-store").addEventListener("input", e => updateComponent(id, "store", e.target.value));
    row.querySelector(".comp-state").addEventListener("change", e => updateComponent(id, "state", e.target.value));
    row.querySelector(".comp-comments").addEventListener("input", e => updateComponent(id, "comments", e.target.value));
    row.querySelector(".remove-component").addEventListener("click", () => removeComponent(id));
  });

  updateSummary();
}

function updateComponent(id, field, value) {
  const comp = state.currentConfig.components.find(c => c.id === id);
  if (comp) comp[field] = value;
  updateSummary();
}

function removeComponent(id) {
  state.currentConfig.components = state.currentConfig.components.filter(c => c.id !== id);
  renderComponents();
}

document.getElementById("add-component").addEventListener("click", () => {
  state.currentConfig.components.push({
    id: Storage.uid(),
    type: "CPU",
    name: "",
    price: "",
    link: "",
    store: "",
    state: "Neuf",
    comments: ""
  });
  renderComponents();
});

function updateSummary() {
  const components = state.currentConfig.components;
  const total = components.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
  const budget = parseFloat(document.getElementById("cfg-budget").value) || null;

  document.getElementById("sum-total").textContent = total.toFixed(2) + " €";
  document.getElementById("sum-count").textContent = components.length;
  document.getElementById("sum-budget").textContent = budget ? budget + " €" : "-";

  const diffEl = document.getElementById("sum-diff");
  if (budget) {
    const diff = total - budget;
    diffEl.textContent = (diff > 0 ? "+" : "") + diff.toFixed(2) + " €";
    diffEl.style.color = diff > 0 ? "var(--red)" : "var(--green)";
  } else {
    diffEl.textContent = "-";
    diffEl.style.color = "var(--text)";
  }

  const compatResults = Compat.check(components, budget);
  document.getElementById("compat-list").innerHTML = compatResults.map(r =>
    `<li class="${r.ok ? "compat-ok" : "compat-warn"}">${r.ok ? "✓" : "⚠"} ${r.text}</li>`
  ).join("");

  if (state.activeChallenge) {
    const { score } = Compat.computeScore(components, state.activeChallenge);
    document.getElementById("score-value").textContent = score + " / 100";
  }
}

document.getElementById("cfg-budget").addEventListener("input", updateSummary);

function loadConfigIntoBuilder(config) {
  document.getElementById("cfg-name").value = config.name || "";
  document.getElementById("cfg-desc").value = config.description || "";
  document.getElementById("cfg-budget").value = config.budget || "";
  renderComponents();
}

function syncBuilderToState() {
  state.currentConfig.name = document.getElementById("cfg-name").value.trim();
  state.currentConfig.description = document.getElementById("cfg-desc").value.trim();
  state.currentConfig.budget = parseFloat(document.getElementById("cfg-budget").value) || null;
}

document.getElementById("save-config").addEventListener("click", () => {
  if (!state.currentConfig) state.currentConfig = newEmptyConfig();
  syncBuilderToState();

  if (!state.currentConfig.name) {
    alert("Merci de donner un nom à ta configuration avant de sauvegarder.");
    return;
  }

  // Vérifie succès du défi
  if (state.activeChallenge) {
    const { score } = Compat.computeScore(state.currentConfig.components, state.activeChallenge);
    if (score >= 60) {
      const profile = getProfile();
      if (!profile.challengesCompleted.includes(state.activeChallenge.id)) {
        profile.challengesCompleted.push(state.activeChallenge.id);
        Storage.saveProfile(profile);
      }
    }
  }

  Storage.addOrUpdateConfig(state.currentConfig);
  alert("Configuration sauvegardée ✅");
});

document.getElementById("publish-config").addEventListener("click", () => {
  if (!state.currentConfig) state.currentConfig = newEmptyConfig();
  syncBuilderToState();

  if (!state.currentConfig.name) {
    alert("Merci de donner un nom à ta configuration avant de publier.");
    return;
  }
  if (state.currentConfig.components.length === 0) {
    alert("Ajoute au moins un composant avant de publier.");
    return;
  }

  state.currentConfig.published = true;
  state.currentConfig.date = Date.now();
  Storage.addOrUpdateConfig(state.currentConfig);
  alert("Configuration publiée dans la Communauté 🎉");
  navigate("communaute");
});

document.getElementById("export-config").addEventListener("click", () => {
  if (!state.currentConfig) return;
  syncBuilderToState();
  const blob = new Blob([JSON.stringify(state.currentConfig, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (state.currentConfig.name || "config") + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-config").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      imported.id = Storage.uid(); // évite les collisions
      state.currentConfig = imported;
      state.activeChallenge = null;
      document.getElementById("builder-challenge-info").style.display = "none";
      document.getElementById("challenge-score").style.display = "none";
      document.getElementById("builder-title").textContent = "Création libre";
      loadConfigIntoBuilder(imported);
    } catch (err) {
      alert("Fichier JSON invalide.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// Nouveau bouton "Création libre" doit réinitialiser le builder
document.querySelectorAll('.nav-btn[data-nav="creation"], .btn[data-nav="creation"]').forEach(btn => {
  btn.addEventListener("click", () => {
    if (!state.currentConfig || (state.currentConfig.published === undefined)) {
      // rien
    }
  });
});

// ---------- COMMUNAUTE ----------

function renderConfigCard(config) {
  const avgRating = getAverageRating(config);
  const isLiked = config.likes.includes(getProfile().pseudo);
  return `
    <div class="card" data-config="${config.id}">
      <span class="badge">${config.name ? "" : ""}</span>
      <h3>${escapeHtml(config.name)}</h3>
      <p class="meta">${escapeHtml(config.author)} · ${formatDate(config.date)}</p>
      <div class="price">${configTotal(config).toFixed(2)} €${config.budget ? " / " + config.budget + " €" : ""}</div>
      <div class="footer-row">
        <span>⭐ ${avgRating ? avgRating.toFixed(1) : "-"} · 👁 ${config.views}</span>
        <div class="actions">
          <button data-like="${config.id}" class="${isLiked ? "liked" : ""}">❤ ${config.likes.length}</button>
        </div>
      </div>
    </div>
  `;
}

function configTotal(config) {
  return config.components.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);
}

function getAverageRating(config) {
  if (!config.ratings || config.ratings.length === 0) return null;
  const sum = config.ratings.reduce((s, r) => s + r.value, 0);
  return sum / config.ratings.length;
}

function toggleLike(configId) {
  const configs = Storage.getConfigs();
  const config = configs.find(c => c.id === configId);
  if (!config) return;
  const pseudo = getProfile().pseudo;
  const idx = config.likes.indexOf(pseudo);
  if (idx >= 0) config.likes.splice(idx, 1);
  else config.likes.push(pseudo);
  Storage.saveConfigs(configs);
  renderCommunity();
  renderHome();
}

function renderCommunity() {
  let configs = Storage.getConfigs().filter(c => c.published);

  const searchTerm = (document.getElementById("search-input").value || "").toLowerCase();
  if (searchTerm) {
    configs = configs.filter(c =>
      c.name.toLowerCase().includes(searchTerm) ||
      (c.author || "").toLowerCase().includes(searchTerm)
    );
  }

  const sortBy = document.getElementById("sort-select").value;
  configs = sortConfigs(configs, sortBy);

  document.getElementById("community-list").innerHTML = configs.length
    ? configs.map(renderConfigCard).join("")
    : `<p class="muted">Aucune configuration ne correspond à ta recherche.</p>`;

  attachCardEvents();
}

function sortConfigs(configs, sortBy) {
  const copy = [...configs];
  switch (sortBy) {
    case "popular": return copy.sort((a, b) => b.likes.length - a.likes.length);
    case "budget": return copy.sort((a, b) => configTotal(a) - configTotal(b));
    case "rating": return copy.sort((a, b) => (getAverageRating(b) || 0) - (getAverageRating(a) || 0));
    case "views": return copy.sort((a, b) => b.views - a.views);
    default: return copy.sort((a, b) => b.date - a.date);
  }
}

document.getElementById("search-input").addEventListener("input", renderCommunity);
document.getElementById("sort-select").addEventListener("change", renderCommunity);

// ---------- MODALE FICHE CONFIG ----------

function openConfigModal(configId) {
  const configs = Storage.getConfigs();
  const config = configs.find(c => c.id === configId);
  if (!config) return;

  config.views = (config.views || 0) + 1;
  Storage.saveConfigs(configs);

  const avg = getAverageRating(config);
  const total = configTotal(config);

  document.getElementById("modal-content").innerHTML = `
    <h2>${escapeHtml(config.name)}</h2>
    <p class="meta">Par ${escapeHtml(config.author)} · ${formatDate(config.date)}</p>
    <p>${escapeHtml(config.description || "")}</p>
    <div class="summary-box" style="margin: 16px 0;">
      <div class="summary-row"><span>Prix total</span><strong>${total.toFixed(2)} €</strong></div>
      ${config.budget ? `<div class="summary-row"><span>Budget</span><strong>${config.budget} €</strong></div>` : ""}
      <div class="summary-row"><span>Vues</span><strong>${config.views}</strong></div>
      <div class="summary-row"><span>Likes</span><strong>${config.likes.length}</strong></div>
      <div class="summary-row"><span>Note moyenne</span><strong>${avg ? avg.toFixed(1) + " / 5" : "Pas encore noté"}</strong></div>
    </div>
    <h3>Composants</h3>
    <ul class="modal-comp-list">
      ${config.components.map(c => `
        <li>
          <span>${c.type} — ${escapeHtml(c.name || "?")} ${c.state === "Occasion" ? "(occasion)" : ""}</span>
          <span>${c.price ? parseFloat(c.price).toFixed(2) + " €" : "-"}</span>
        </li>
      `).join("")}
    </ul>
    <h3>Noter cette configuration</h3>
    <div class="rating-widget">
      ${[1,2,3,4,5].map(n => `<button class="btn small rate-btn" data-rate="${n}">${n} ⭐</button>`).join(" ")}
    </div>
  `;

  document.getElementById("modal-content").querySelectorAll(".rate-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      rateConfig(config.id, parseInt(btn.dataset.rate));
      document.getElementById("modal-overlay").classList.remove("active");
    });
  });

  document.getElementById("modal-overlay").classList.add("active");

  // refresh listings behind modal
  if (state.currentPage === "communaute") renderCommunity();
  if (state.currentPage === "accueil") renderHome();
}

function rateConfig(configId, value) {
  const configs = Storage.getConfigs();
  const config = configs.find(c => c.id === configId);
  if (!config) return;
  const pseudo = getProfile().pseudo;
  config.ratings = config.ratings || [];
  const existing = config.ratings.find(r => r.user === pseudo);
  if (existing) existing.value = value;
  else config.ratings.push({ user: pseudo, value });
  Storage.saveConfigs(configs);
  renderCommunity();
}

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("modal-overlay").classList.remove("active");
});
document.getElementById("modal-overlay").addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") e.target.classList.remove("active");
});

// ---------- PROFIL ----------

function getProfile() {
  return Storage.getProfile();
}

function renderProfile() {
  const profile = getProfile();
  document.getElementById("profile-pseudo").value = profile.pseudo;
  document.getElementById("profile-bio").value = profile.bio;

  const myConfigs = Storage.getConfigs().filter(c => c.author === profile.pseudo);
  const totalLikes = myConfigs.reduce((sum, c) => sum + c.likes.length, 0);

  document.getElementById("stat-configs").textContent = myConfigs.length;
  document.getElementById("stat-challenges").textContent = profile.challengesCompleted.length;
  document.getElementById("stat-likes").textContent = totalLikes;

  document.getElementById("profile-configs").innerHTML = myConfigs.length
    ? myConfigs.map(renderConfigCard).join("")
    : `<p class="muted">Tu n'as pas encore créé de configuration.</p>`;

  attachCardEvents();
}

document.getElementById("profile-pseudo").addEventListener("change", (e) => {
  const profile = getProfile();
  const oldPseudo = profile.pseudo;
  profile.pseudo = e.target.value.trim() || "Joueur";
  Storage.saveProfile(profile);

  // met à jour l'auteur des configs existantes liées à l'ancien pseudo
  const configs = Storage.getConfigs();
  configs.forEach(c => { if (c.author === oldPseudo) c.author = profile.pseudo; });
  Storage.saveConfigs(configs);

  renderProfile();
});

document.getElementById("profile-bio").addEventListener("change", (e) => {
  const profile = getProfile();
  profile.bio = e.target.value;
  Storage.saveProfile(profile);
});

// ---------- UTILS ----------

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ---------- INIT ----------

state.currentConfig = newEmptyConfig();
renderComponents();
navigate("accueil");
