/* Copy-link button on permalink pages. */
document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
  const G = window.Gati, url = btn.dataset.copy;
  try { await navigator.clipboard.writeText(url); } catch (e) { const t = document.createElement("textarea"); t.value = url; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); }
  const old = btn.innerHTML; btn.textContent = G && G.lang === "en" ? "Copied" : "कपी भयो"; setTimeout(() => (btn.innerHTML = old), 1800);
}));
