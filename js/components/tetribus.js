// js/components/tetribus.js
// Intégration propre du mini-jeu Tetribus (ES modules)

import { Tetribus } from "../games/tetribus/tetribus.game.js";

let started = false;

function hideAllViews() {
  [
    "view-home",
    "view-day",
    "view-month",
    "view-guided-month",
    "view-tetribus",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

// ⛔ masquer l’UI globale
document.getElementById("menu-toggle")?.classList.add("hidden");
document.getElementById("side-menu")?.classList.add("hidden");
document.getElementById("menu-overlay")?.classList.add("hidden");

function renderTetribusHTML(container) {
  container.innerHTML = `
    <div id="tetribus">
      <div id="game-container">

        <div id="header">
          <button id="tetribus-back">←</button>
          <div id="score">Score : <span id="score-value">0</span></div>
          <div id="level">Niveau : <span id="level-value">1</span></div>
        </div>
        <div id="high-score">
          Record : <span id="high-score-value">0</span>
        </div>


        <div id="game-area">
          <div id="canvas-wrapper">
            <canvas id="game-canvas"></canvas>

            <div id="game-over" class="hidden">
              <h2>Game Over</h2>
              <p>Score : <span id="final-score">0</span></p>
              <button id="restart-btn">Rejouer</button>
            </div>
          </div>
        </div>

        <div id="controls-area">
          <div id="btn-left" class="control-btn btn-left"></div>
          <div id="btn-rotate" class="control-btn btn-rotate"></div>
          <div id="btn-right" class="control-btn btn-right"></div>
        </div>

      </div>
    </div>
  `;
}

export function showTetribus() {
  const view = document.getElementById("view-tetribus");
  if (!view) {
    console.error("view-tetribus introuvable");
    return;
  }

  hideAllViews();
  view.style.display = "block";

  if (!started) {
    renderTetribusHTML(view); // 1️⃣ le HTML est créé
    started = true;
    Tetribus.init(); // 2️⃣ le jeu démarre

    // 3️⃣ ICI — PAS AILLEURS
    document.getElementById("tetribus-back").addEventListener("click", () => {
      // 1) arrêter le jeu
      Tetribus.stop();
      started = false;

      // 2) réafficher le menu et le bouton ☰
      document.getElementById("menu-toggle")?.classList.remove("hidden");
      document.getElementById("side-menu")?.classList.remove("hidden");
      document.getElementById("menu-overlay")?.classList.remove("hidden");

      // 3) retour à l’accueil
      import("../router.js").then(({ showHome }) => {
        showHome();
      });
    });
  }
}

export function stopTetribus() {
  Tetribus.stop();
  started = false;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // onglet / app en arrière-plan → arrêt total
    if (window.Tetribus) {
      window.Tetribus.stop();
    }
  }
});
