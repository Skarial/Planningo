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

function toDotSlash(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return normalized.startsWith("./") ? normalized : `./${normalized}`;
}

function extractEssentialAssets() {
  const source = readRootFile("service-worker.js");
  const match = source.match(/const ESSENTIAL_ASSETS = \[(?<list>[\s\S]*?)\];/);
  assert(match, "ESSENTIAL_ASSETS introuvable dans service-worker.js");
  return Array.from(match.groups.list.matchAll(/"(\.\/[^"]+)"/g)).map(
    (entry) => entry[1],
  );
}

function extractModuleEntrypointsFromIndex() {
  const html = readRootFile("index.html");
  return Array.from(
    html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g),
  ).map((entry) => entry[1]);
}

function resolveImportPath(importerRelativePath, specifier) {
  const importerAbsoluteDir = path.dirname(
    path.join(ROOT_DIR, importerRelativePath),
  );
  let resolved = path.resolve(importerAbsoluteDir, specifier);
  if (!path.extname(resolved)) {
    resolved = `${resolved}.js`;
  }
  return resolved;
}

function buildStartupStaticImportGraph(entrypoints) {
  const importPattern = /^\s*import\s+(?:[^'"]+from\s+)?['"](\.[^'"]+)['"]/gm;
  const stack = entrypoints.map((entry) =>
    path.resolve(ROOT_DIR, entry.replace(/^\.\//, "")),
  );
  const visited = new Set();

  while (stack.length > 0) {
    const currentAbsolutePath = stack.pop();
    if (visited.has(currentAbsolutePath)) continue;
    visited.add(currentAbsolutePath);

    const currentRelativePath = path.relative(ROOT_DIR, currentAbsolutePath);
    const source = fs.readFileSync(currentAbsolutePath, "utf8");
    for (const entry of source.matchAll(importPattern)) {
      const specifier = entry[1];
      const importedAbsolutePath = resolveImportPath(currentRelativePath, specifier);
      if (!fs.existsSync(importedAbsolutePath)) continue;
      stack.push(importedAbsolutePath);
    }
  }

  return Array.from(visited).map((absolutePath) =>
    toDotSlash(path.relative(ROOT_DIR, absolutePath)),
  );
}

test("pwa-integrity - essential assets exist and are unique", () => {
  const assets = extractEssentialAssets();
  assert(assets.length > 0, "ESSENTIAL_ASSETS ne doit pas etre vide");

  const unique = new Set(assets);
  assert(
    unique.size === assets.length,
    "ESSENTIAL_ASSETS contient des doublons",
  );

  for (const asset of assets) {
    const relativePath = asset.replace(/^\.\//, "");
    const absolutePath = path.join(ROOT_DIR, relativePath);
    assert(
      fs.existsSync(absolutePath),
      `Asset manquant dans ESSENTIAL_ASSETS: ${asset}`,
    );
  }
});

test("pwa-integrity - startup import graph is fully precached", () => {
  const entrypoints = extractModuleEntrypointsFromIndex().filter((value) =>
    value.startsWith("./js/"),
  );
  assert(entrypoints.length > 0, "Aucun entrypoint module JS trouve dans index.html");

  const startupGraph = buildStartupStaticImportGraph(entrypoints);
  const essential = new Set(extractEssentialAssets());

  const missing = startupGraph.filter((modulePath) => !essential.has(modulePath));
  assert(
    missing.length === 0,
    `Modules de demarrage absents du precache: ${missing.join(", ")}`,
  );
});

test("pwa-integrity - manifest icons are valid and precached", () => {
  const manifest = JSON.parse(readRootFile("manifest.webmanifest"));
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  assert(icons.length > 0, "manifest.webmanifest doit contenir des icones");

  const essential = new Set(extractEssentialAssets());
  for (const icon of icons) {
    const src = String(icon?.src || "");
    assert(src.startsWith("./"), `Icone manifest invalide: ${src}`);
    const absolutePath = path.join(ROOT_DIR, src.replace(/^\.\//, ""));
    assert(fs.existsSync(absolutePath), `Icone manifest manquante: ${src}`);
    assert(
      essential.has(src),
      `Icone manifest absente du precache SW: ${src}`,
    );
  }
});
