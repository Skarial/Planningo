/*

  Copyright (c) 2026 Jordan

  All Rights Reserved.

  See LICENSE for terms.

*/

// js/components/tetribus.js

// Integration propre du mini-jeu Tetribus (ES modules)

import { Tetribus } from "../games/tetribus/tetribus.game.js";

let started = false;

function enterFullscreen() {
  if (document.fullscreenElement) return;

  const root = document.documentElement;

  if (root.requestFullscreen) {
    root.requestFullscreen().catch(() => {});
  }
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;

  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function hideAllViews() {
  document.querySelectorAll("#app-main > section").forEach((el) => {
    el.hidden = true;

    el.style.display = "";
  });
}

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

  view.hidden = false;

  view.style.display = "block";

  document.getElementById("menu-toggle").classList.add("hidden");

  document.getElementById("side-menu").classList.add("hidden");

  document.getElementById("menu-overlay").classList.add("hidden");

  // Si on revient trop vite et que le canvas est detach, on reconstruit

  const canvasMissing = !document.getElementById("game-canvas");

  if (started && canvasMissing) {
    started = false;
  }

  if (!started) {
    renderTetribusHTML(view); // 1) le HTML est cree

    started = true;

    Tetribus.init(); // 2) le jeu demarre

    // 3) ICI  PAS AILLEURS

    document.getElementById("tetribus-back").addEventListener("click", () => {
      // 1) pause du jeu (etat conserve)

      Tetribus.pause();

      // 2) reafficher le menu et le bouton

      document.getElementById("menu-toggle").classList.remove("hidden");

      document.getElementById("side-menu").classList.remove("hidden");

      document.getElementById("menu-overlay").classList.remove("hidden");

      // 3) masquer la vue jeu immediatement

      view.hidden = true;

      view.style.display = "";

      // 4) retour a l'accueil

      import("../router.js").then(({ showHome }) => {
        showHome();
      });
    });
  } else {
    let attempts = 0;

    const tryResume = () => {
      attempts += 1;

      const ok = Tetribus.refreshLayout();

      if (ok) {
        Tetribus.resume();

        return;
      }

      if (attempts < 6) {
        requestAnimationFrame(tryResume);

        return;
      }

      // Fallback : reconstruction propre si le canvas reste invalide

      Tetribus.stop();

      started = false;

      renderTetribusHTML(view);

      started = true;

      Tetribus.init();
    };

    requestAnimationFrame(tryResume);
  }
}

export function stopTetribus() {
  Tetribus.pause();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // onglet / app en arriere-plan -> pause

    Tetribus.pause();
  }
});
