/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, test } from "../run-tests.js";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(TEST_DIR, "..", "..");

function readRootFile(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function getBlock(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  return match ? match[1] : "";
}

test("ui-css - guided action buttons keep desktop thickness", () => {
  const css = readRootFile("css/style.css");
  const guidedAction = getBlock(css, ".guided-action");

  assert(guidedAction.includes("height: 48px;"), "Desktop: .guided-action doit rester a 48px");
  assert(
    guidedAction.includes("font-size: 0.95rem;"),
    "Desktop: .guided-action doit garder la taille texte d'origine",
  );
});

test("ui-css - guided action buttons have mobile coarse-pointer override", () => {
  const css = readRootFile("css/style.css");

  const mediaMatch = css.match(
    /@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?)\n\}/,
  );
  assert(mediaMatch, "Media query tactile manquante pour .guided-action");

  const mediaBody = mediaMatch[1];
  assert(mediaBody.includes(".guided-action"), "Override mobile .guided-action manquant");
  assert(mediaBody.includes("height: 48px;"), "Mobile: hauteur .guided-action inattendue");
  assert(mediaBody.includes("min-height: 48px;"), "Mobile: min-height .guided-action manquant");
});

test("ui-css - active rest day keeps selected blue color", () => {
  const css = readRootFile("css/style.css");
  const activeRest = getBlock(css, ".day-circle.rest.active");

  assert(
    activeRest.includes("background: var(--color-day-selected);"),
    "Jour repos/conges actif doit rester bleu",
  );
  assert(
    activeRest.includes("border-color: var(--color-day-selected);"),
    "Bordure du jour repos/conges actif doit suivre la couleur selectionnee",
  );
});
