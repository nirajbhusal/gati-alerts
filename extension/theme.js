/* Runs before the page paints. Theme is "auto" (follow the computer), "light" or "dark".
   Kept in localStorage as well as chrome.storage so the popup never flashes the wrong colours. */
(function () {
  var t = "auto";
  try { t = localStorage.getItem("gati-theme") || "auto"; } catch (e) {}
  if (["auto", "light", "dark"].indexOf(t) < 0) t = "auto";
  document.documentElement.dataset.theme = t;
})();
