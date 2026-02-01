/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export async function renderLegalView() {
  const view = document.getElementById("view-legal");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Mentions legales";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent =
    "Consultez les droits, restrictions et informations de contact.";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card legal-card";

  const summary = document.createElement("div");
  summary.className = "legal-summary";
  summary.textContent =
    "Tous droits reserves. Aucune licence n'est accordee sans autorisation ecrite.";

  const link = document.createElement("a");
  link.className = "legal-link";
  link.href = "./LICENSE";
  link.textContent = "Ouvrir la licence complete (LICENSE)";

  const pre = document.createElement("pre");
  pre.className = "legal-text";
  pre.textContent = "Chargement du texte de licence...";

  card.append(summary, link, pre);
  root.append(header, card);
  view.appendChild(root);

  try {
    const res = await fetch("./LICENSE", { cache: "no-cache" });
    if (!res.ok) throw new Error("license_fetch_failed");
    const text = await res.text();
    pre.textContent = text.trim();
  } catch (err) {
    pre.textContent =
      "Le texte de licence est disponible a la racine du projet (LICENSE).";
  }
}

