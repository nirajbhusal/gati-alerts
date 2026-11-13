/* Community pages people follow (data/community.json). Links out only.
   These are not sources: Gati does not verify their posts and never relays them. See docs/VERIFICATION.md. */
(function () {
  const box = document.getElementById("community"), G = window.Gati; if (!box || !G) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, PAGE = document.body.dataset.page;
  let D = null;
  const draw = () => { const L = D ? D.pages.filter((p) => !p.show || p.show.includes(PAGE)) : []; if (!L.length) { box.hidden = true; return; } box.hidden = false;
    box.innerHTML = `<h2 id="community-h">${T("मानिसले पछ्याउने सामुदायिक पृष्ठ", "Community pages people follow")}</h2>
      <p class="cmwarn"><strong>${T("यी स्रोत होइनन्।", "These are not sources.")}</strong> ${T("गतिले यिनका पोस्ट प्रमाणित गरेको छैन र प्रसारण गर्दैन। यात्राको निर्णय गर्नुअघि प्रहरी (१००) वा सडक विभागको आधिकारिक सूचना हेर्नुहोस्।", "Gati has not verified their posts and does not relay them. Before deciding to travel, check the official notice from the police (100) or the Department of Roads.")}</p>
      <ul class="cmlist">${L.map((p) => `<li><a href="${E(p.url)}" target="_blank" rel="noopener nofollow"><b>${E(T(p.name_ne, p.name_en))}</b> <span class="cmtag">${E(p.platform)} ↗</span></a>
        <span class="cmabout">${E(T(p.about_ne, p.about_en))}</span><span class="meta">${T("क्षेत्र", "Area")}: ${E(T(p.area_ne, p.area_en))} · <span class="cmbadge">${T("सामुदायिक पृष्ठ, प्रमाणित होइन", "Community page, not verified")}</span></span></li>`).join("")}</ul>`; };
  (G.rawJson ? G.rawJson("data/community.json") : G.json("data/community.json")).then((d) => { D = d; draw(); G.onLang(draw); }).catch(() => { box.hidden = true; });
})();
