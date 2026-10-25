/* H. Scroll-driven motion. Without JS nothing is hidden. Above-the-fold content shows at once.
   Alert cards, the Breaking bar and the Am I affected card never wait on animation. */
(function () {
  var d = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SEL = ".card,.tdcard,.svcard,.ccard,.fcard,.mecard,.gbar,.bars,.pmonth,.tdaq,section.panel";
  var NEVER = ".card.alert,.brk,.afcard,#gintro";
  var io = !reduce && "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function mark(root) {
    (root.querySelectorAll ? root.querySelectorAll(SEL) : []).forEach(function (el) {
      if (el.dataset.rv) return; el.dataset.rv = 1;
      if (el.closest(NEVER)) { el.classList.add("rv-in", "rv-now"); return; }
      if (el.parentElement && el.parentElement.closest(".rv,.rv-in")) return; /* the revealed ancestor drives it */
      var r = el.getBoundingClientRect();
      if (!io || r.top < innerHeight) { el.classList.add("rv-in", "rv-now"); return; }
      el.classList.add("rv"); io.observe(el);
    });
  }
  if (io) d.classList.add("gm");
  function go() { mark(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { mark(n.parentNode || n); } }); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
