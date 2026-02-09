/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/feedback.js

export function renderFeedbackView() {
  const view = document.getElementById("view-feedback");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view settings-page-variant suggestions-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Suggestions / Am\u00e9liorations";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Partagez vos id\u00e9es d'am\u00e9lioration.";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const aboutTitle = document.createElement("label");
  aboutTitle.textContent = "\u00c0 propos";

  const aboutText = document.createElement("p");
  aboutText.className = "settings-note";
  aboutText.textContent =
    "Pour proposer une suggestion, une am\u00e9lioration ou signaler un bug visuel, contactez-nous par email en joignant une capture d'\u00e9cran.";

  const contactLink = document.createElement("a");
  contactLink.className = "settings-btn primary";
  const emailAddress = "planningo@outlook.fr";
  const subject = "Planningo - Suggestion ou amelioration";
  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}`;
  const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(emailAddress)}&subject=${encodeURIComponent(subject)}`;

  contactLink.href = mailtoUrl;
  contactLink.textContent = "Contacter par email";
  contactLink.style.display = "flex";
  contactLink.style.alignItems = "center";
  contactLink.style.justifyContent = "center";
  contactLink.style.textAlign = "center";
  contactLink.style.textDecoration = "none";

  contactLink.addEventListener("click", (event) => {
    event.preventDefault();

    let handled = false;
    let fallbackTimer = null;
    const finish = () => {
      if (handled) return;
      handled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (fallbackTimer != null) {
        clearTimeout(fallbackTimer);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        finish();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    fallbackTimer = setTimeout(() => {
      if (handled) return;
      finish();
      window.location.href = outlookComposeUrl;
    }, 900);

    try {
      window.location.href = mailtoUrl;
    } catch {
      finish();
      window.location.href = outlookComposeUrl;
    }
  });

  card.append(aboutTitle, aboutText, contactLink);

  root.append(header, card);
  view.appendChild(root);
}

