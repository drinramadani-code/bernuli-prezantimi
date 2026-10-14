// =====================================================================
//  EKUACIONI I ENERGJISË (EKUACIONI I BERNULIT) DHE ZBATIMI I TIJ.
//  MATJA E PRESIONIT – Programi interaktiv (p5.js)
//
//  Hidraulika dhe Termodinamika · FIM, Universiteti i Prishtinës
//  Punuan: Bahtir Vojvoda, Drin Ramadani, Fehmi Qallapeku,
//          Liburn Hajdari, Trim Ferizi
//
//  Struktura e skedarit:
//    PJESA 1 – konstantet dhe funksionet ndihmëse për vizatim
//    PJESA 2 – modulet (një për çdo temë)
//    PJESA 3 – aplikacioni (menyja, kontrollet, nisja e skicave)
// =====================================================================

// =====================================================================
//  PJESA 1 – konstantet, ngjyrat dhe funksionet ndihmëse për vizatim
//  Të gjitha skicat vizatojnë në një "letër" virtuale 1000 × 560 njësi.
//  Aplikacioni (në fund të skedarit) e shkallëzon sipas gjerësisë së ekranit.
// =====================================================================

const W = 1000, H = 560;
const g = 9.81;              // m/s²
const P_ATM = 101325;        // Pa – presioni atmosferik normal
const P_AVULL = 2340;        // Pa – presioni i avullimit të ujit në 20 °C

// Dendësitë sipas tabelës nga ligjërata "Vetitë fizike të fluideve" (20 °C)
const LENGJET = {
  uji:     { emri: "Ujë (20 °C)",  rho: 998.2 },
  deti:    { emri: "Ujë deti",     rho: 1025 },
  alkool:  { emri: "Alkool",       rho: 790 },
  benzine: { emri: "Benzinë",      rho: 740 },
  vaj:     { emri: "Vaj motori",   rho: 918 },
  merkur:  { emri: "Mërkur",       rho: 13546 },
  ajer:    { emri: "Ajër",         rho: 1.2 }
};

// Ngjyrat – tema e Universitetit të Prishtinës (e kuqe + e zezë, si logoja)
const NGJ = {
  boja:   "#1f1a17",   // tekst dhe kontura
  boja2:  "#5f5a58",
  kuqe:   "#c0392b",
  z:      "#8a6a34",   // lartësia / energjia potenciale
  p:      "#1f5fae",   // presioni
  v:      "#d4691e",   // shpejtësia / energjia kinetike
  uji:    "#b5d6f0",
  ujiErr: "#6b9fcc",
  merkur: "#a3abb5",
  merkurErr: "#6c747e",
  rrjeta: "#f1eeec",
  letra:  "#ffffff",
  metal:  "#cfd4dc",
  metalErr: "#8c929b",
  dru:    "#d9b98c",
  bar:    "#7aa66a",
  up:     "#1f1a17",
  ari:    "#cd2e31"
};

// Shkronjat – një familje e vetme, e pastër, si në sllajde
// p5 e vendos emrin në thonjëza, prandaj lista e rezervave shkruhet kështu → "Source Sans 3", "Segoe UI", "Arial"
const SHKRONJA = 'Source Sans 3", "Segoe UI", "Arial';
const SHKRONJA_DORE = SHKRONJA;
const SHKALLA_SHKRONJES = 0.9;   // Source Sans është më e gjerë se shkronja e dorës e mëparshme

// ---------- formatimi i numrave (presje dhjetore, si në shqip) ----------
function fmt(x, d = 2) {
  if (!isFinite(x)) return "–";
  return x.toFixed(d).replace(".", ",").replace(/^-0(,0+)?$/, "0$1");
}

// ---------- letra me katrorë ----------
function letra(p) {
  p.background(NGJ.letra);
  // rrjetë shumë e lehtë, si letër milimetrike në sllajd
  p.stroke(NGJ.rrjeta);
  p.strokeWeight(1);
  for (let x = 0; x <= W; x += 40) p.line(x, 0, x, H);
  for (let y = 0; y <= H; y += 40) p.line(0, y, W, y);
}

// ---------- tekst ----------
// në ekrane të ngushta teksti në skicë zmadhohet pak, që të lexohet
let ZMADHIMI_TEKSTIT = 1;

function shkruaj(p, txt, x, y, opt = {}) {
  p.push();
  p.noStroke();
  p.fill(opt.ngjyra || NGJ.boja);
  p.textFont(opt.dore === false ? SHKRONJA : SHKRONJA_DORE);
  const madh = (opt.madhesia || 18) * ZMADHIMI_TEKSTIT * SHKALLA_SHKRONJES;
  p.textSize(madh);
  if (opt.trash) p.textStyle(p.BOLD);
  // thyesat shkruhen si {numëruesi|emëruesi} dhe vizatohen njëra mbi tjetrën
  const pjeset = String(txt).split(/(\{[^{}|]*\|[^{}]*\})/).filter((t) => t !== "");
  const kaThyese = pjeset.some((t) => t[0] === "{");
  const gjeresia = (t) => {
    if (t[0] !== "{") return p.textWidth(t);
    const [a, b] = t.slice(1, -1).split("|");
    p.textSize(madh * 0.86); const w = Math.max(p.textWidth(a), p.textWidth(b)) + madh * 0.2; p.textSize(madh);
    return w;
  };
  const w = pjeset.reduce((s, t) => s + gjeresia(t), 0);
  const rr = opt.rreshtim || p.LEFT;
  let x0 = x;
  if (rr === p.CENTER) x0 = x - w / 2;
  if (rr === p.RIGHT) x0 = x - w;
  if (opt.sfond) {
    const h = kaThyese ? madh * 1.9 : madh * 1.1;
    p.fill(opt.sfond);
    p.rect(x0 - 4, y - (kaThyese ? madh * 1.25 : madh * 0.85), w + 8, h, 3);
    p.fill(opt.ngjyra || NGJ.boja);
  }
  if (!kaThyese) {
    p.textAlign(rr, opt.vertikal || p.BASELINE);
    p.text(txt, x, y);
  } else {
    p.textAlign(p.LEFT, p.BASELINE);
    let xx = x0;
    const yv = y - madh * 0.3;            // lartësia e vijës së thyesës
    for (const t of pjeset) {
      const wt = gjeresia(t);
      if (t[0] !== "{") { p.text(t, xx, y); }
      else {
        const [a, b] = t.slice(1, -1).split("|");
        p.textSize(madh * 0.86); p.textAlign(p.CENTER, p.BASELINE);
        p.text(a, xx + wt / 2, yv - madh * 0.12);
        p.text(b, xx + wt / 2, yv + madh * 0.62);
        p.stroke(opt.ngjyra || NGJ.boja); p.strokeWeight(Math.max(1, madh * 0.06));
        p.line(xx + madh * 0.06, yv, xx + wt - madh * 0.06, yv); p.noStroke();
        p.textSize(madh); p.textAlign(p.LEFT, p.BASELINE);
      }
      xx += wt;
    }
  }
  p.pop();
}

// ---------- shigjeta ----------
function shigjeta(p, x1, y1, x2, y2, ngjyra = NGJ.boja, trashesia = 2, koka = 9) {
  p.push();
  p.stroke(ngjyra); p.strokeWeight(trashesia); p.fill(ngjyra);
  p.line(x1, y1, x2, y2);
  const a = Math.atan2(y2 - y1, x2 - x1);
  p.translate(x2, y2); p.rotate(a);
  p.noStroke();
  p.triangle(0, 0, -koka, -koka * 0.45, -koka, koka * 0.45);
  p.pop();
}

// shigjetë me dy maja për përmasat (kuota)
function kuota(p, x1, y1, x2, y2, etiketa, ngjyra = NGJ.boja2, ana = "djathtas") {
  shigjeta(p, (x1 + x2) / 2, (y1 + y2) / 2, x1, y1, ngjyra, 1.3, 7);
  shigjeta(p, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, ngjyra, 1.3, 7);
  if (etiketa) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = ana === "djathtas" ? 8 : -8;
    shkruaj(p, etiketa, mx + dx, my + 6, { ngjyra, madhesia: 17, rreshtim: ana === "djathtas" ? p.LEFT : p.RIGHT });
  }
}

// vijë e ndërprerë
function vijeNderprere(p, x1, y1, x2, y2, gjat = 8, hapesira = 6) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.floor(d / (gjat + hapesira));
  const ux = (x2 - x1) / d, uy = (y2 - y1) / d;
  for (let i = 0; i <= n; i++) {
    const s = i * (gjat + hapesira);
    const e = Math.min(s + gjat, d);
    p.line(x1 + ux * s, y1 + uy * s, x1 + ux * e, y1 + uy * e);
  }
}

// vijë toke (e vizatuar si në vizatim teknik me vija të pjerrëta)
function toka(p, x1, x2, y, ngjyra = NGJ.boja) {
  p.push();
  p.stroke(ngjyra); p.strokeWeight(2);
  p.line(x1, y, x2, y);
  p.strokeWeight(1);
  for (let x = x1; x < x2; x += 14) p.line(x, y + 1, x - 9, y + 11);
  p.pop();
}

// manometër me akrep (Bourdon) – vlera në [0, max]
function manometerBourdon(p, cx, cy, r, vlera, max, njesia, etiketa) {
  p.push();
  p.stroke(NGJ.boja); p.strokeWeight(2.5); p.fill("#fff");
  p.circle(cx, cy, 2 * r);
  p.strokeWeight(1); p.circle(cx, cy, 2 * r - 8);
  const a0 = p.radians(135), a1 = p.radians(405);
  // vijat e shkallës
  for (let i = 0; i <= 10; i++) {
    const a = a0 + (a1 - a0) * i / 10;
    const r1 = r - 6, r2 = i % 5 === 0 ? r - 18 : r - 12;
    p.strokeWeight(i % 5 === 0 ? 2 : 1);
    p.line(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a), cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
    if (i % 5 === 0) {
      shkruaj(p, fmt(max * i / 10, max < 10 ? 1 : 0), cx + (r - 24) * Math.cos(a), cy + (r - 24) * Math.sin(a) + 5,
        { madhesia: 12, rreshtim: p.CENTER, dore: false });
    }
  }
  // zona e kuqe mbi 90 %
  p.noFill(); p.stroke(NGJ.kuqe); p.strokeWeight(3);
  p.arc(cx, cy, 2 * r - 14, 2 * r - 14, a0 + (a1 - a0) * 0.9, a1);
  // akrepi
  const t = Math.max(0, Math.min(1, vlera / max));
  const a = a0 + (a1 - a0) * t;
  p.stroke(NGJ.kuqe); p.strokeWeight(3);
  p.line(cx, cy, cx + (r - 14) * Math.cos(a), cy + (r - 14) * Math.sin(a));
  p.noStroke(); p.fill(NGJ.boja); p.circle(cx, cy, 10);
  shkruaj(p, njesia, cx, cy + r * 0.72, { madhesia: 11, rreshtim: p.CENTER, dore: false, ngjyra: NGJ.boja2 });
  if (etiketa) shkruaj(p, etiketa, cx, cy + r + 22, { madhesia: 17, rreshtim: p.CENTER });
  p.pop();
}

// grimcat e ujit që lëvizin nëpër tub – ndihmojnë të shihet shpejtësia
class Grimcat {
  constructor(n, xMin, xMax) {
    this.xMin = xMin; this.xMax = xMax;
    this.lista = [];
    for (let i = 0; i < n; i++) this.lista.push({ x: xMin + Math.random() * (xMax - xMin), f: Math.random() * 2 - 1 });
  }
  // shpejtesia(x) kthen shpejtësinë në px/s, pozita(x, f) kthen [px, py]
  levize(dt, shpejtesia) {
    for (const g of this.lista) {
      g.x += shpejtesia(g.x) * dt;
      if (g.x > this.xMax) { g.x = this.xMin + (g.x - this.xMax); g.f = Math.random() * 2 - 1; }
    }
  }
  vizato(p, pozita, ngjyra = "#ffffff") {
    p.push(); p.noStroke(); p.fill(ngjyra);
    for (const g of this.lista) { const [x, y] = pozita(g.x, g.f); p.circle(x, y, 4); }
    p.pop();
  }
}

// interpolim linear
function lerp(a, b, t) { return a + (b - a) * t; }
function kufizo(x, a, b) { return Math.max(a, Math.min(b, x)); }

// regjistri i moduleve – çdo skedar mXX shton modulin e vet këtu
const MODULET = [];
function regjistro(m) { MODULET.push(m); }

// ---------- thyesat në HTML: a/b shndërrohet në thyesë njëra mbi tjetrën ----------
const NJESITE_L = new Set(["m", "km", "kg", "L", "J", "m³", "N", "kN", "Pa", "kPa"]);
const NJESITE_D = new Set(["s", "h", "m³", "kg", "N", "m²", "s²", "m"]);
function hiqKllapat(t) {
  if (t[0] !== "(" || t[t.length - 1] !== ")") return t;
  let d = 0;
  for (let i = 0; i < t.length; i++) { if (t[i] === "(") d++; else if (t[i] === ")") { d--; if (d === 0 && i < t.length - 1) return t; } }
  return t.slice(1, -1);
}
function thyesatTekst(t) {
  const op = "(?:[^\\s=+−·,;:()/<>]*\\((?:[^()]|\\([^()]*\\))*\\)|[^\\s=+−·,;:()/<>]+)";
  const re = new RegExp("(" + op + ")/(" + op + ")", "g");
  return t.replace(re, (m, a, b) => {
    let pas = "";
    const pk = b.match(/\.+$/);
    if (pk) { pas = pk[0]; b = b.slice(0, -pas.length); }
    if (NJESITE_L.has(a) && NJESITE_D.has(b)) return m;
    if (/^[\d,.]+$/.test(a) && /^[\d,.]+$/.test(b)) return m;
    return '<span class="frx"><span>' + hiqKllapat(a) + '</span><span>' + hiqKllapat(b) + '</span></span>' + pas;
  });
}
function thyesatHTML(html) {
  if (!html || html.indexOf("/") < 0) return html;
  return String(html).split(/(<[^>]+>)/).map((c) => (c[0] === "<" ? c : thyesatTekst(c))).join("");
}

// =====================================================================
//  PJESA 2 – modulet. Çdo modul ndjek një pjesë të dokumentit.
// =====================================================================

// ---------------------------------------------------------------------
//  Moduli 0 – Kreu
// ---------------------------------------------------------------------
regjistro({
  id: "kreu", nr: 0, grupi: "Hyrje",
  titulli: "Kreu", titulliShkurt: "Kreu",
  nentitulli: "Programi interaktiv",
  html(el) {
    el.innerHTML = `
    <section class="ballina">
      <div class="ballina-shirit">
        <div class="ballina-logo logo-up" role="img" aria-label="Logo e Universitetit të Prishtinës"></div>
        <p class="ballina-uni">Universiteti i Prishtinës “Hasan Prishtina”<br>Fakulteti i Inxhinierisë Mekanike · Mekatronikë</p>
        <h2 class="ballina-titulli">Ekuacioni i energjisë<br><span>(Ekuacioni i Bernulit) dhe zbatimi i tij.</span><br>Matja e presionit</h2>
        <p class="ballina-lenda">Hidraulika dhe Termodinamika · Projekt seminarik</p>
        <button class="btn-ari" onclick="hapModulin('formulat')">Fillo</button>
      </div>
      <div class="ballina-info">
        <div class="info-bllok">
          <h3>Punuan</h3>
          <ul class="ekipi">
            <li>Bahtir Vojvoda</li><li>Drin Ramadani</li><li>Fehmi Qallapeku</li><li>Liburn Hajdari</li><li>Trim Ferizi</li>
          </ul>
        </div>
        <div class="info-bllok">
          <h3>Mentoret</h3>
          <ul class="ekipi"><li>Prof. Asst. Blerina Bylykbashi</li><li>MSc. Kosovare Latifaj</li></ul>
        </div>
      </div>
    </section>

    <section class="permbajtja-kartat">
      <h3>Përmbajtja</h3>
      <ol class="lista-permbajtjes">
        <li><a onclick="hapModulin('formulat')"><b>01</b>Formulat paraprake</a></li>
        <li><a onclick="hapModulin('qetesi')"><b>02</b>Fluidi në qetësi</a></li>
        <li><a onclick="hapModulin('levizje')"><b>03</b>Fluidi në lëvizje</a></li>
        <li><a onclick="hapModulin('sifoni')"><b>04</b>Shpejtësia e rrjedhjes: sifoni</a></li>
        <li><a onclick="hapModulin('pesha')"><b>05</b>Forma për njësi peshe</a></li>
        <li><a onclick="hapModulin('masa')"><b>06</b>Forma për njësi mase</a></li>
        <li><a onclick="hapModulin('parfumi')"><b>07</b>Bernuli në jetën e përditshme: spërkatësi</a></li>
        <li><a onclick="hapModulin('rezervuari')"><b>08</b>Shembull nga hidraulika: rezervuari</a></li>
      </ol>
      <div class="ballina-fund">
        <div class="ngjyrat">
          <span><i style="background:${NGJ.p}"></i>presioni</span>
          <span><i style="background:${NGJ.z}"></i>energjia potenciale (lartësia)</span>
          <span><i style="background:${NGJ.v}"></i>energjia kinetike (shpejtësia)</span>
        </div>
        <p class="ndihme-e-vogel">Vlerat ndryshohen me rrëshqitës · <kbd>←</kbd> <kbd>→</kbd> kalim mes temave · <kbd>P</kbd> modaliteti i prezantimit</p>
      </div>
    </section>`;
  }
});

// ---------------------------------------------------------------------
//  Moduli 1 – Formulat paraprake (me llogaritës të vegjël)
// ---------------------------------------------------------------------
(function () {
  const KARTAT = [
    { t: "Dendësia e fluidit", fx: "ρ = m/V", d: "Masa në njësinë e vëllimit.",
      h: [["m", "Masa m (kg)", 998.2], ["V", "Vëllimi V (m³)", 1]],
      r: (v) => `ρ = ${fmt(v.m / v.V, 1)} kg/m³` },
    { t: "Pesha e trupit", fx: "G = m · g", d: "g ≈ 9,81 m/s² – nxitimi gravitacional.",
      h: [["m", "Masa m (kg)", 10]],
      r: (v) => `G = ${fmt(v.m * g, 1)} N` },
    { t: "Presioni", fx: "p = F/A", d: "Forca pingul mbi njësinë e sipërfaqes; 1 atm = 101 325 Pa.",
      h: [["F", "Forca F (N)", 700], ["A", "Sipërfaqja A (m²)", 0.05]],
      r: (v) => { const pr = v.F / v.A; return `p = ${fmt(pr, 0)} Pa = ${fmt(pr / P_ATM, 3)} atm`; } },
    { t: "Presioni hidrostatik", fx: "p = p₀ + ρ · g · h", d: "Presioni në thellësinë h nën sipërfaqen e lirë të fluidit në qetësi.",
      h: [["p0", "p₀ (Pa)", 101325], ["rho", "ρ (kg/m³)", 998.2], ["h", "Thellësia h (m)", 5]],
      r: (v) => `p = ${fmt(v.p0 + v.rho * g * v.h, 0)} Pa` },
    { t: "Energjia kinetike", fx: "Eₖ = ½ · m · v²", d: "Energjia e trupit për shkak të lëvizjes.",
      h: [["m", "Masa m (kg)", 2], ["v", "Shpejtësia v (m/s)", 3]],
      r: (v) => `Eₖ = ${fmt(0.5 * v.m * v.v * v.v, 2)} J` },
    { t: "Energjia potenciale", fx: "Eₚ = m · g · h", d: "Energjia e trupit për shkak të lartësisë.",
      h: [["m", "Masa m (kg)", 2], ["h", "Lartësia h (m)", 5]],
      r: (v) => `Eₚ = ${fmt(v.m * g * v.h, 2)} J` },
    { t: "Puna e forcës", fx: "W = F · s", d: "Forca e shumëzuar me rrugën në drejtim të forcës.",
      h: [["F", "Forca F (N)", 50], ["s", "Rruga s (m)", 4]],
      r: (v) => `W = ${fmt(v.F * v.s, 1)} J` },
    { t: "Ruajtja e energjisë", fx: "Eₖ + Eₚ = konst", d: "Një trup bie lirisht nga lartësia h: e gjithë Eₚ bëhet Eₖ.",
      h: [["m", "Masa m (kg)", 1], ["h", "Lartësia h (m)", 5]],
      r: (v) => `Eₚ = Eₖ = ${fmt(v.m * g * v.h, 1)} J, pra v = √(2gh) = ${fmt(Math.sqrt(2 * g * Math.max(0, v.h)), 2)} m/s` },
    { t: "Prurja vëllimore", fx: "Q = A · v", d: "Vëllimi i fluidit që kalon nëpër prerje në një sekondë.",
      h: [["A", "Sipërfaqja A (m²)", 0.00785], ["v", "Shpejtësia v (m/s)", 2]],
      r: (v) => { const Q = v.A * v.v; return `Q = ${fmt(Q, 5)} m³/s = ${fmt(Q * 1000, 2)} L/s`; } },
    { t: "Ekuacioni i vazhdueshmërisë", fx: "A₁ · v₁ = A₂ · v₂", d: "Për fluid të pakompresueshëm, sa hyn aq del.",
      h: [["A1", "A₁ (m²)", 0.01], ["v1", "v₁ (m/s)", 1.5], ["A2", "A₂ (m²)", 0.005]],
      r: (v) => `v₂ = ${fmt(v.A1 * v.v1 / v.A2, 2)} m/s` },
    { t: "Fluidi ideal", fx: "ρ = konst, pa viskozitet", d: "Fluid jo-viskoz dhe i pakompresueshëm, që rrjedh në mënyrë stacionare përgjatë vijave të rrjedhjes. Me këtë supozim nxirret ekuacioni i Bernulit.",
      h: [], r: () => "" }
  ];

  regjistro({
    id: "formulat", nr: 1, grupi: "Hyrje",
    titulli: "Formulat paraprake", titulliShkurt: "Formulat paraprake",
    nentitulli: "Madhësitë bazë nga mekanika dhe hidrostatika mbi të cilat mbështetet ligji i Bernulit",
    html(el) {
      const grid = document.createElement("div");
      grid.className = "formulat";
      KARTAT.forEach((k) => {
        const c = document.createElement("div");
        c.className = "fkarte";
        c.innerHTML = `<h4>${k.t}</h4><div class="fx">${thyesatHTML(k.fx)}</div><p class="pershkrim">${thyesatHTML(k.d)}</p>`;
        const hy = document.createElement("div"); hy.className = "hyrjet";
        const vl = {};
        const rez = document.createElement("div"); rez.className = "rez";
        const llog = () => { try { rez.textContent = k.r(vl); } catch (e) { rez.textContent = "–"; } };
        k.h.forEach(([id, et, def]) => {
          vl[id] = def;
          const lab = document.createElement("label"); lab.textContent = et;
          const inp = document.createElement("input"); inp.type = "number"; inp.value = def; inp.step = "any";
          inp.addEventListener("input", () => { const x = parseFloat(inp.value); vl[id] = isFinite(x) ? x : 0; llog(); });
          hy.appendChild(lab); hy.appendChild(inp);
        });
        if (k.h.length) c.appendChild(hy);
        if (k.h.length) c.appendChild(rez);
        llog();
        grid.appendChild(c);
      });
      el.appendChild(grid);
    }
  });
})();

// ---------------------------------------------------------------------
//  Gypi i përbashkët për fluidin në qetësi dhe në lëvizje:
//  pjesa e majtë në lartësinë y₁, kalimi, pjesa e djathtë në lartësinë y₂
// ---------------------------------------------------------------------
const GYPI = { XA: 90, XB: 910, XK1: 380, XK2: 560, R1: 26, BAZA: 500 };

function gypi(x, y1px, y2px, r2) {
  let t = (x - GYPI.XK1) / (GYPI.XK2 - GYPI.XK1);
  t = kufizo(t, 0, 1);
  const s = 3 * t * t - 2 * t * t * t;
  return { y: lerp(y1px, y2px, s), r: lerp(GYPI.R1, r2, s) };
}

function vizatoGypin(p, y1px, y2px, r2, ngjyraLengu, mbyllur) {
  const lart = [], posht = [];
  for (let x = GYPI.XA; x <= GYPI.XB; x += 5) {
    const q = gypi(x, y1px, y2px, r2);
    lart.push([x, q.y - q.r]); posht.push([x, q.y + q.r]);
  }
  p.noStroke(); p.fill(ngjyraLengu);
  p.beginShape();
  for (const [x, y] of lart) p.vertex(x, y);
  for (let i = posht.length - 1; i >= 0; i--) p.vertex(posht[i][0], posht[i][1]);
  p.endShape(p.CLOSE);
  p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
  p.beginShape(); for (const [x, y] of lart) p.vertex(x, y); p.endShape();
  p.beginShape(); for (const [x, y] of posht) p.vertex(x, y); p.endShape();
  if (mbyllur) {
    p.strokeWeight(5);
    p.line(GYPI.XA, y1px - GYPI.R1 - 2, GYPI.XA, y1px + GYPI.R1 + 2);
    p.line(GYPI.XB, y2px - r2 - 2, GYPI.XB, y2px + r2 + 2);
  }
}

function boksiVleres(p, x, y, tekst, ngjyra) {
  p.push();
  p.textFont(SHKRONJA); p.textSize(17 * ZMADHIMI_TEKSTIT);
  const w = p.textWidth(tekst) + 18;
  p.stroke(ngjyra || NGJ.boja); p.strokeWeight(1.5); p.fill("#ffffff");
  p.rect(x - w / 2, y - 16, w, 30, 4);
  p.pop();
  shkruaj(p, tekst, x, y + 5, { madhesia: 17, rreshtim: p.CENTER, dore: false, ngjyra: ngjyra || NGJ.boja });
}

// ---------------------------------------------------------------------
//  Fluidi në qetësi
// ---------------------------------------------------------------------
(function () {
  const PXM = 60, X1 = 230, X2 = 740;
  const yp = (y) => GYPI.BAZA - y * PXM;

  regjistro({
    id: "qetesi", nr: 3, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Fluidi në qetësi", titulliShkurt: "Fluidi në qetësi",
    nentitulli: "Ndryshimi i presionit ndërmjet dy pikave të fluidit në qetësi varet nga diferenca e lartësisë.",
    kontrollet: [
      { lloji: "rreshqites", id: "y1", etiketa: "Lartësia e pikës 1, y₁", min: 0.3, max: 3, hapi: 0.1, vlera: 1, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "y2", etiketa: "Lartësia e pikës 2, y₂", min: 0.3, max: 5.5, hapi: 0.1, vlera: 4, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "P2", etiketa: "Presioni në pikën 2, P₂", min: 0, max: 200, hapi: 1, vlera: 50, njesia: "kPa", dhjetore: 0 },
      { lloji: "zgjedh", id: "leng", etiketa: "Fluidi", vlera: "uji",
        opsionet: [["uji", "Ujë (998 kg/m³)"], ["deti", "Ujë deti (1025 kg/m³)"], ["vaj", "Vaj (918 kg/m³)"], ["merkur", "Mërkur (13 546 kg/m³)"]] }
    ],
    shpjegimi: `
      <p>Fillojmë me rastin më të thjeshtë, kur fluidi në gyp nuk lëviz. Sa më poshtë të jetë pika, aq më i madh është presioni, sepse mbi të ka më shumë fluid që e shtyp. Diferenca e presionit ndërmjet dy pikave është P₁ − P₂ = ρgh, ku h është diferenca e lartësisë ndërmjet tyre.</p>
      <p>Termi ρgh ka të njëjtën formë si energjia potenciale mgh, vetëm se është pjesëtuar me vëllimin. Njësia e presionit, paskali, është e njëjtë me xhaul për metër kub. Kjo do të thotë se presionin mund ta shohim si energjinë që përmban një metër kub fluid.</p>
      <p>Në simulim mund t'i zhvendosni pikat dhe ta ndërroni fluidin, për të parë si ndryshon presioni.</p>`,
    formula: `P₁ − P₂ = ρg(y₂ − y₁) = ρgh &nbsp;&nbsp; ρgh = <span class="frx"><span>mgh</span><span>V</span></span><small>njësia e presionit: Pa = J/m³, pra energji për vëllim</small>`,

    vizato(p, K) {
      const y1 = K.v("y1"), y2 = K.v("y2"), P2 = K.v("P2") * 1000;
      const leng = LENGJET[K.v("leng")], rho = leng.rho;
      const h = y2 - y1;
      const P1 = P2 + rho * g * h;
      const y1px = yp(y1), y2px = yp(y2);

      // rrafshi krahasues dhe boshti y
      p.stroke(NGJ.boja2); p.strokeWeight(1); vijeNderprere(p, 40, GYPI.BAZA, 980, GYPI.BAZA, 12, 5);
      shkruaj(p, "0", 30, GYPI.BAZA + 5, { madhesia: 15, ngjyra: NGJ.boja2, rreshtim: p.RIGHT });
      shigjeta(p, 40, GYPI.BAZA - 10, 40, GYPI.BAZA - 120, NGJ.boja, 1.8, 9);
      shkruaj(p, "y", 40, GYPI.BAZA - 130, { madhesia: 20, rreshtim: p.CENTER });

      vizatoGypin(p, y1px, y2px, GYPI.R1, K.v("leng") === "merkur" ? NGJ.merkur : NGJ.uji, true);
      shkruaj(p, "fluidi në qetësi (v = 0)", 500, GYPI.BAZA + 40, { madhesia: 17, rreshtim: p.CENTER, ngjyra: NGJ.boja2 });

      // lartësitë y1, y2
      for (const [x, yy, emri] of [[X1, y1, "1"], [X2, y2, "2"]]) {
        p.stroke(NGJ.z); p.strokeWeight(1); vijeNderprere(p, x, yp(yy), x, GYPI.BAZA, 4, 4);
        shkruaj(p, "y" + (emri === "1" ? "₁" : "₂") + " = " + fmt(yy, 1) + " m", x + 8, (yp(yy) + GYPI.BAZA) / 2 + 30, { madhesia: 16, ngjyra: NGJ.z });
        p.noStroke(); p.fill(NGJ.kuqe); p.circle(x, yp(yy), 12);
        shkruaj(p, emri, x - 18, yp(yy) - 10, { madhesia: 22, ngjyra: NGJ.kuqe, rreshtim: p.RIGHT });
      }
      // kuota h
      if (Math.abs(h) > 0.15) {
        const xh = 870;
        p.stroke(NGJ.boja2); p.strokeWeight(1);
        vijeNderprere(p, X1, y1px, xh + 10, y1px, 3, 4);
        kuota(p, xh, y1px, xh, y2px, "h = " + fmt(h, 1) + " m", NGJ.boja, "majtas");
      }

      // vlerat e presionit
      boksiVleres(p, X1, y1px - GYPI.R1 - 34, "P₁ = " + fmt(P1 / 1000, 1) + " kPa", NGJ.p);
      boksiVleres(p, X2, y2px - GYPI.R1 - 34, "P₂ = " + fmt(P2 / 1000, 1) + " kPa", NGJ.p);

      // kubi 1 m³ – energji për njësi vëllimi
      const cx = 120, cy = 60, a = 60;
      p.stroke(NGJ.boja); p.strokeWeight(1.5); p.fill("#e8d9bf");
      p.quad(cx, cy + 15, cx + a, cy + 15, cx + a, cy + 15 + a, cx, cy + 15 + a);
      p.fill("#f2e7d3"); p.quad(cx, cy + 15, cx + 15, cy, cx + a + 15, cy, cx + a, cy + 15);
      p.fill("#d8c39e"); p.quad(cx + a, cy + 15, cx + a + 15, cy, cx + a + 15, cy + a, cx + a, cy + 15 + a);
      shkruaj(p, "1 m³", cx + a / 2, cy + 52, { madhesia: 17, rreshtim: p.CENTER });
      shkruaj(p, "P₁ − P₂ = ρgh = " + fmt((P1 - P2) / 1000, 2) + " kPa", 220, 80, { madhesia: 21 });
      shkruaj(p, "= " + fmt((P1 - P2) / 1000, 2) + " kJ energji për çdo 1 m³ fluid", 220, 108, { madhesia: 18, ngjyra: NGJ.z });

      K.lexo(`
        <div class="rresht"><span>Dendësia ρ</span><b>${fmt(rho, 1)} kg/m³</b></div>
        <div class="rresht"><span>h = y₂ − y₁</span><b>${fmt(h, 2)} m</b></div>
        <div class="rresht"><span>ρgh</span><b>${fmt(rho * g * h, 0)} Pa = ${fmt(rho * g * h, 0)} J/m³</b></div>
        <div class="rresht"><span>P₂ (i dhënë)</span><b>${fmt(P2 / 1000, 2)} kPa</b></div>
        <div class="rresht"><span>P₁ = P₂ + ρgh</span><b>${fmt(P1 / 1000, 2)} kPa</b></div>`);
    },

    shtyp(p, K) {
      const d1 = Math.hypot(K.mx - X1, K.my - yp(K.v("y1"))), d2 = Math.hypot(K.mx - X2, K.my - yp(K.v("y2")));
      if (Math.min(d1, d2) < 45) { K.duke_terhequr = true; K.gj.kap = d1 < d2 ? "y1" : "y2"; }
    },
    terhiq(p, K) {
      const yy = (GYPI.BAZA - K.my) / PXM;
      if (K.gj.kap === "y1") K.vendos("y1", Math.round(kufizo(yy, 0.3, 3) * 10) / 10);
      else K.vendos("y2", Math.round(kufizo(yy, 0.3, 5.5) * 10) / 10);
    },
    lesho(p, K) { K.duke_terhequr = false; }
  });
})();

// ---------------------------------------------------------------------
//  Fluidi në lëvizje
// ---------------------------------------------------------------------
(function () {
  const PXM = 55, X1 = 230, X2 = 740, RHO = 998.2;
  const yp = (y) => GYPI.BAZA - y * PXM;

  regjistro({
    id: "levizje", nr: 4, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Fluidi në lëvizje", titulliShkurt: "Fluidi në lëvizje",
    nentitulli: "Kur fluidi lëviz, presioni, lartësia dhe shpejtësia ndryshojnë, por shuma e energjive mbetet e njëjtë.",
    kontrollet: [
      { lloji: "rreshqites", id: "v1", etiketa: "Shpejtësia në seksionin 1, v₁", min: 0, max: 4, hapi: 0.1, vlera: 2, njesia: "m/s", dhjetore: 1 },
      { lloji: "rreshqites", id: "r", etiketa: "Raporti i prerjeve A₁/A₂", min: 1, max: 3, hapi: 0.05, vlera: 2, njesia: "", dhjetore: 2 },
      { lloji: "rreshqites", id: "h1", etiketa: "Lartësia e seksionit 1, h₁", min: 0.2, max: 2, hapi: 0.1, vlera: 1, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "h2", etiketa: "Lartësia e seksionit 2, h₂", min: 0.2, max: 4, hapi: 0.1, vlera: 3, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "P1", etiketa: "Presioni në seksionin 1, P₁", min: 0, max: 100, hapi: 1, vlera: 30, njesia: "kPa", dhjetore: 0 }
    ],
    shpjegimi: `
      <p>Kur fluidi vihet në lëvizje, përveç presionit kemi edhe energji kinetike dhe energji potenciale. Nëse të tria i shprehim për një metër kub fluid, fitojmë ½ρv² për energjinë kinetike, ρgh për energjinë potenciale dhe P për presionin.</p>
      <p>Sipas ligjit të ruajtjes së energjisë, shuma e këtyre tri madhësive mbetet konstante përgjatë një vije rrjedhjeje. Ky është ekuacioni i Bernulit. Kur fluidi ngjitet ose shpejton, një pjesë e energjisë merret nga presioni, prandaj presioni bie.</p>
      <p>Në simulim shtyllat pranë gypit tregojnë si ndahet energjia në secilin seksion, ndërsa shuma e tyre mbetet gjithmonë e njëjtë.</p>`,
    formula: `½ρv₁² + ρgh₁ + P₁ = ½ρv₂² + ρgh₂ + P₂<small>ekuacioni i Bernulit për dy seksione</small>`,

    fillo(p, K) { K.gj.gr = new Grimcat(130, GYPI.XA, GYPI.XB); },

    vizato(p, K) {
      const v1 = K.v("v1"), r = K.v("r"), h1 = K.v("h1"), h2 = K.v("h2"), P1 = K.v("P1") * 1000;
      const v2 = v1 * r;
      const P2 = P1 + 0.5 * RHO * (v1 * v1 - v2 * v2) + RHO * g * (h1 - h2);
      const y1px = yp(h1), y2px = yp(h2), r2 = GYPI.R1 / Math.sqrt(r);

      p.stroke(NGJ.boja2); p.strokeWeight(1); vijeNderprere(p, 40, GYPI.BAZA, 980, GYPI.BAZA, 12, 5);
      shkruaj(p, "0", 30, GYPI.BAZA + 5, { madhesia: 15, ngjyra: NGJ.boja2, rreshtim: p.RIGHT });

      vizatoGypin(p, y1px, y2px, r2, NGJ.uji, false);
      // grimcat lëvizin me shpejtësinë lokale v = v₁·A₁/A
      K.gj.gr.levize(K.dt, (x) => { const q = gypi(kufizo(x, GYPI.XA, GYPI.XB), y1px, y2px, r2); const rr = (GYPI.R1 / q.r) ** 2; return v1 > 0 ? 18 + v1 * rr * 35 : 0; });
      K.gj.gr.vizato(p, (x, f) => { const q = gypi(kufizo(x, GYPI.XA, GYPI.XB), y1px, y2px, r2); return [x, q.y + f * q.r * 0.8]; });
      if (v1 > 0) { shigjeta(p, 40, y1px, 82, y1px, NGJ.boja2, 2, 9); shigjeta(p, 918, y2px, 965, y2px, NGJ.boja2, 2, 9); }

      // seksionet dhe lartësitë
      for (const [x, yy, hh, emri] of [[X1, y1px, h1, "1"], [X2, y2px, h2, "2"]]) {
        const q = gypi(x, y1px, y2px, r2);
        p.stroke(NGJ.kuqe); p.strokeWeight(2); p.line(x, q.y - q.r, x, q.y + q.r);
        shkruaj(p, emri, x, q.y + q.r + 22, { madhesia: 22, ngjyra: NGJ.kuqe, rreshtim: p.CENTER });
        p.stroke(NGJ.z); p.strokeWeight(1); vijeNderprere(p, x + 14, yy, x + 14, GYPI.BAZA, 3, 4);
        shkruaj(p, "h" + (emri === "1" ? "₁" : "₂"), x + 20, (yy + GYPI.BAZA) / 2 + 20, { madhesia: 16, ngjyra: NGJ.z });
      }

      // shiritat e energjisë për njësi vëllimi
      const komp = (P, h, v) => [[P, NGJ.p, "P"], [RHO * g * h, NGJ.z, "ρgh"], [0.5 * RHO * v * v, NGJ.v, "½ρv²"]];
      const k1 = komp(P1, h1, v1), k2 = komp(P2, h2, v2);
      const shuma = k1.reduce((a, b) => a + b[0], 0);
      const lartMax = Math.min(y1px, y2px) - GYPI.R1 - 50;
      const bazaSh = Math.min(240, lartMax), sh = (bazaSh - 50) / Math.max(20000, shuma, k2[1][0] + k2[2][0]);
      for (const [x, kk, emri] of [[X1, k1, "1"], [X2, k2, "2"]]) {
        let yy = bazaSh;
        const w = 70;
        for (const [val, c, t] of kk) {
          if (val <= 0) continue;
          const hh = val * sh;
          p.noStroke(); p.fill(c); p.rect(x - w / 2, yy - hh, w, hh);
          p.stroke(NGJ.letra); p.strokeWeight(2); p.line(x - w / 2, yy - hh, x + w / 2, yy - hh);
          shkruaj(p, t + " = " + fmt(val / 1000, 1), x + w / 2 + 8, yy - hh / 2 + 5, { madhesia: 15, ngjyra: c, dore: false });
          yy -= hh;
        }
        if (kk[0][0] < 0) shkruaj(p, "P" + (emri === "1" ? "₁" : "₂") + " < 0 (nënpresion)", x, bazaSh + 22, { madhesia: 15, ngjyra: NGJ.kuqe, rreshtim: p.CENTER });
        p.stroke(NGJ.boja); p.strokeWeight(1.5); p.line(x - w / 2 - 6, bazaSh, x + w / 2 + 6, bazaSh);
      }
      const ySum = bazaSh - shuma * sh;
      p.stroke(NGJ.kuqe); p.strokeWeight(1.5); vijeNderprere(p, X1 + 150, ySum, X2 - 45, ySum, 8, 5);
      shkruaj(p, "Σ = " + fmt(shuma / 1000, 1) + " kJ/m³ = konst", (X1 + 150 + X2 - 45) / 2, ySum - 10, { madhesia: 18, ngjyra: NGJ.kuqe, rreshtim: p.CENTER });
      shkruaj(p, "vlerat në kPa = kJ/m³", 990, 26, { madhesia: 14, ngjyra: NGJ.boja2, rreshtim: p.RIGHT });

      K.lexo(`
        <table><tr><th></th><th>Seksioni 1</th><th>Seksioni 2</th></tr>
        <tr><td>v (m/s)</td><td>${fmt(v1, 2)}</td><td>${fmt(v2, 2)}</td></tr>
        <tr><td>P (kPa)</td><td>${fmt(P1 / 1000, 2)}</td><td class="${P2 < 0 ? "kujdes" : ""}">${fmt(P2 / 1000, 2)}</td></tr>
        <tr><td>ρgh (kJ/m³)</td><td>${fmt(k1[1][0] / 1000, 2)}</td><td>${fmt(k2[1][0] / 1000, 2)}</td></tr>
        <tr><td>½ρv² (kJ/m³)</td><td>${fmt(k1[2][0] / 1000, 2)}</td><td>${fmt(k2[2][0] / 1000, 2)}</td></tr>
        <tr><td><b>Shuma</b></td><td><b>${fmt(shuma / 1000, 2)}</b></td><td><b>${fmt(shuma / 1000, 2)}</b></td></tr></table>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Sifoni
// ---------------------------------------------------------------------
(function () {
  const PXM = 31, TOKA = 528;              // 1 m = 31 px, shkallë reale
  const Y1 = 0.5;                          // dalja e sifonit 0,5 m mbi tokë
  const yp = (y) => TOKA - y * PXM;
  const RHO = 998.2, D_TUB = 0.010;        // tub me diametër 10 mm
  const XE0 = 90, XE1 = 330;               // ena
  const XH = 290, XD = 520;                // krahu në enë dhe krahu i daljes

  function pikaNeVije(pikat, s) {
    for (let i = 1; i < pikat.length; i++) {
      const [x1, y1] = pikat[i - 1], [x2, y2] = pikat[i];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (s <= d) return [x1 + (x2 - x1) * s / d, y1 + (y2 - y1) * s / d];
      s -= d;
    }
    return pikat[pikat.length - 1];
  }

  regjistro({
    id: "sifoni", nr: 9, grupi: "2. Zbatimi i ekuacionit",
    titulli: "Shpejtësia e rrjedhjes: sifoni", titulliShkurt: "Sifoni",
    nentitulli: "Shpejtësia me të cilën lëngu del nga sifoni varet vetëm nga diferenca e lartësive.",
    kontrollet: [
      { lloji: "rreshqites", id: "h", etiketa: "Diferenca e lartësive h = y₂ − y₁", min: 0.2, max: 3, hapi: 0.05, vlera: 1.5, njesia: "m", dhjetore: 2 },
      { lloji: "rreshqites", id: "d", etiketa: "Lartësia e sifonit mbi sipërfaqe, d", min: 0.5, max: 12, hapi: 0.1, vlera: 1.2, njesia: "m", dhjetore: 1 }
    ],
    shpjegimi: `
      <p>Sifoni është një gyp i lakuar, me të cilin lëngu kalon mbi buzën e enës dhe derdhet më poshtë. Në këtë mënyrë zbrazet akuariumi ose kalohet karburanti nga një rezervuar në tjetrin.</p>
      <p>Sipërfaqja e lëngut në enë dhe dalja e sifonit janë të hapura ndaj atmosferës, prandaj kanë të njëjtin presion. Sipërfaqja në enë ulet shumë ngadalë, kështu që shpejtësinë e saj e marrim zero. Kur këto i zëvendësojmë në ekuacionin e Bernulit, fitojmë v = √(2gh), që është e njëjta shpejtësi si e një trupi që bie lirisht nga lartësia h.</p>
      <p>Sifoni punon vetëm nëse pjesa e tij më e lartë nuk është më shumë se rreth 10 m mbi sipërfaqen e lëngut, sepse presioni atmosferik nuk mund ta mbajë një shtyllë uji më të lartë.</p>`,
    formula: `v₁ = √(2gh)<small>vlen kur d &lt; pₐ/(ρg) ≈ 10,3 m</small>`,

    fillo(p, K) { K.gj.s = 0; },

    vizato(p, K) {
      const h = K.v("h"), d = K.v("d");
      const y1 = Y1, y2 = Y1 + h, yk = y2 + d;
      const v1 = Math.sqrt(2 * g * h);
      const kufiri = P_ATM / (RHO * g);                               // ≈ 10,3 m – shtylla që mban pₐ
      const punon = d < kufiri;                                       // kushti që sifoni të punojë

      // toka
      toka(p, 20, 980, TOKA);
      // ena mbi mbajtëse
      const yFund = y2 - 0.9;
      p.stroke(NGJ.boja); p.strokeWeight(2.5);
      p.line(XE0 + 20, yp(yFund), XE0 + 20, TOKA); p.line(XE1 - 20, yp(yFund), XE1 - 20, TOKA);
      p.strokeWeight(1); p.line(XE0 + 20, (yp(yFund) + TOKA) / 2, XE1 - 20, (yp(yFund) + TOKA) / 2);
      p.noStroke(); p.fill(NGJ.uji); p.rect(XE0 + 2, yp(y2), XE1 - XE0 - 4, yp(yFund) - yp(y2));
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.line(XE0, yp(y2 + 0.25), XE0, yp(yFund)); p.line(XE0, yp(yFund), XE1, yp(yFund)); p.line(XE1, yp(yFund), XE1, yp(y2 + 0.25));
      p.stroke(NGJ.ujiErr); p.strokeWeight(1.5); p.line(XE0 + 2, yp(y2), XE1 - 2, yp(y2));
      shkruaj(p, "▽", XE0 + 30, yp(y2) - 4, { madhesia: 15, ngjyra: NGJ.p });

      // tubi i sifonit: krahu në enë, harku (gjysmë-elipsë) me majë në lartësinë y₂ + d, krahu i daljes
      const R = (XD - XH) / 2, xc = (XH + XD) / 2, RV = 20;
      const yFillimHarku = yk - RV / PXM;          // lartësia ku fillon harku
      const rruga = [];
      for (let yy = yFund + 0.15; yy < yFillimHarku; yy += 0.1) rruga.push([XH, yp(yy)]);
      for (let a = Math.PI; a >= -0.0001; a -= Math.PI / 30) rruga.push([xc + R * Math.cos(a), yp(yFillimHarku) - RV * Math.sin(a)]);
      for (let yy = yFillimHarku; yy > y1; yy -= 0.1) rruga.push([XD, yp(yy)]);
      rruga.push([XD, yp(y1)]);
      p.noFill(); p.stroke(NGJ.boja); p.strokeWeight(11);
      p.beginShape(); for (const [x, y] of rruga) p.vertex(x, y); p.endShape();
      p.stroke(punon ? NGJ.uji : "#eef2f6"); p.strokeWeight(7);
      p.beginShape(); for (const [x, y] of rruga) p.vertex(x, y); p.endShape();
      if (!punon) {
        // uji mbetet vetëm deri në lartësinë që mban presioni atmosferik
        const yMaks = y2 + kufiri;
        p.stroke(NGJ.uji); p.strokeWeight(7);
        p.line(XH, yp(yFund + 0.15), XH, yp(Math.min(yMaks, yk)));
      }

      // grimcat dhe rryma në dalje
      if (punon) {
        let L = 0; for (let i = 1; i < rruga.length; i++) L += Math.hypot(rruga[i][0] - rruga[i - 1][0], rruga[i][1] - rruga[i - 1][1]);
        K.gj.s = (K.gj.s + v1 * 40 * K.dt) % 34;
        p.noStroke(); p.fill("#ffffff");
        for (let s = K.gj.s; s < L; s += 34) { const [x, y] = pikaNeVije(rruga, s); p.circle(x, y, 4); }
        p.stroke(NGJ.ujiErr); p.strokeWeight(3); p.line(XD, yp(y1), XD, TOKA - 2);
        p.noStroke(); p.fill(NGJ.ujiErr); for (let i = 0; i < 4; i++) p.circle(XD + p.random(-8, 8), TOKA - p.random(2, 7), 3);
      }

      // nivelet dhe kuotat
      p.stroke(NGJ.boja2); p.strokeWeight(1);
      vijeNderprere(p, 40, yp(y2), 700, yp(y2), 7, 5);
      vijeNderprere(p, 40, yp(y1), 700, yp(y1), 7, 5);
      vijeNderprere(p, xc, yp(yk), 700, yp(yk), 3, 4);
      shkruaj(p, "y₂", 34, yp(y2) + 6, { madhesia: 19, rreshtim: p.RIGHT });
      shkruaj(p, "y₁", 34, yp(y1) + 6, { madhesia: 19, rreshtim: p.RIGHT });
      kuota(p, 600, yp(y2), 600, yp(y1), "h = " + fmt(h, 2) + " m", NGJ.boja);
      kuota(p, 630, yp(y2), 630, yp(yk), "d = " + fmt(d, 1) + " m", NGJ.kuqe);
      p.noStroke(); p.fill(NGJ.kuqe); p.circle(XE0 + 60, yp(y2), 9); p.circle(XD, yp(y1), 9);
      shkruaj(p, "2", XE0 + 60, yp(y2) - 10, { madhesia: 20, ngjyra: NGJ.kuqe, rreshtim: p.CENTER });
      shkruaj(p, "1", XD + 12, yp(y1) + 18, { madhesia: 20, ngjyra: NGJ.kuqe });

      // kufiri i presionit atmosferik
      const yKufi = yp(y2 + kufiri);
      p.stroke(NGJ.kuqe); p.strokeWeight(1.5); vijeNderprere(p, XE0, yKufi, 980, yKufi, 10, 6);
      shkruaj(p, "kufiri: {pₐ|ρg} ≈ 10,3 m mbi sipërfaqe", 975, yKufi - 8, { madhesia: 16, ngjyra: NGJ.kuqe, rreshtim: p.RIGHT });

      // paneli i rezultatit
      const bx = 735, by = 300;
      p.stroke(NGJ.boja); p.strokeWeight(1.2); p.fill(NGJ.letra); p.rect(bx, by, 250, 150, 4);
      if (punon) {
        shkruaj(p, "v₁ = √(2gh)", bx + 14, by + 32, { madhesia: 20 });
        shkruaj(p, "v₁ = " + fmt(v1, 2) + " m/s", bx + 14, by + 66, { madhesia: 26, ngjyra: NGJ.v });
        shkruaj(p, "(" + fmt(v1 * 3.6, 1) + " km/h)", bx + 14, by + 94, { madhesia: 17, ngjyra: NGJ.boja2 });
        shkruaj(p, "sifoni punon", bx + 14, by + 130, { madhesia: 18, ngjyra: "#3f7a32" });
      } else {
        shkruaj(p, "Sifoni nuk punon!", bx + 14, by + 36, { madhesia: 22, ngjyra: NGJ.kuqe });
        shkruaj(p, "Presioni atmosferik nuk mund", bx + 14, by + 70, { madhesia: 16 });
        shkruaj(p, "ta ngrejë ujin deri në kreshtë.", bx + 14, by + 92, { madhesia: 16 });
        shkruaj(p, "Zvogëloni d.", bx + 14, by + 126, { madhesia: 17, ngjyra: NGJ.boja2 });
      }

      const A = Math.PI * D_TUB * D_TUB / 4;
      K.lexo(`
        <div class="rresht"><span>P₁ = P₂ = pₐ</span><b>101 325 Pa</b></div>
        <div class="rresht"><span>v₂ (sipërfaqja e lirë)</span><b>≈ 0</b></div>
        <div class="rresht"><span>v₁ = √(2gh)</span><b>${punon ? fmt(v1, 2) + " m/s" : "–"}</b></div>
        <div class="rresht"><span>Prurja Q = A·v₁ (tub Ø 10 mm)</span><b>${punon ? fmt(A * v1 * 1000, 3) + " L/s" : "0"}</b></div>
        <div class="rresht"><span>Kufiri pₐ/(ρg)</span><b>≈ ${fmt(kufiri, 1)} m</b></div>
        <div class="rresht"><span>d &lt; pₐ/(ρg)?</span><b class="${punon ? "" : "kujdes"}">${punon ? "Po – sifoni punon" : "Jo – sifoni nuk punon"}</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 5 – Forma me gjatësi: z + p/ρg + v²/2g = H = konst
//  Rezervuar me nivel konstant + tub me ngushtim dhe ngjitje
// ---------------------------------------------------------------------

(function () {
  const BAZA = 500, PXM = 45;           // 1 m = 45 px (horizontalisht dhe vertikalisht)
  const y = (z) => BAZA - z * PXM;
  const D1 = 0.10, RV = 17;             // diametri real dhe rrezja e vizatuar
  const XT = 130, XK1 = 330, XK2 = 380, XK3 = 480, XK4 = 560, XN1 = 600, XN2 = 700, XF = 960;
  const STAC = [{ x: 250, emri: "1" }, { x: 430, emri: "2" }, { x: 840, emri: "3" }];

  function gjeometria(x, D2, z1, z3) {
    let D = D1;
    if (x >= XK1 && x < XK2) D = lerp(D1, D2, (x - XK1) / (XK2 - XK1));
    else if (x >= XK2 && x < XK3) D = D2;
    else if (x >= XK3 && x < XK4) D = lerp(D2, D1, (x - XK3) / (XK4 - XK3));
    let z = z1;
    if (x >= XN1 && x < XN2) z = lerp(z1, z3, (x - XN1) / (XN2 - XN1));
    else if (x >= XN2) z = z3;
    return { D, z };
  }

  regjistro({
    id: "pesha", nr: 5, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Forma me gjatësi (lartësi)", titulliShkurt: "Forma me gjatësi [m]",
    nentitulli: "Kur ekuacioni pjesëtohet me ρg, të gjithë termat bëhen gjatësi dhe maten në metra.",
    kontrollet: [
      { lloji: "rreshqites", id: "Q", etiketa: "Prurja Q = A·v", min: 0, max: 20, hapi: 0.5, vlera: 12, njesia: "L/s", dhjetore: 1 },
      { lloji: "rreshqites", id: "D2", etiketa: "Diametri në ngushtim D₂", min: 40, max: 100, hapi: 1, vlera: 60, njesia: "mm", dhjetore: 0 },
      { lloji: "rreshqites", id: "z3", etiketa: "Lartësia e seksionit 3, z₃", min: 1, max: 4.5, hapi: 0.1, vlera: 3, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "H", etiketa: "Niveli në rezervuar H", min: 5, max: 9, hapi: 0.1, vlera: 8, njesia: "m", dhjetore: 1 },
      { lloji: "buton", id: "mbyll", etiketa: "Mbyll ventilin" },
      { lloji: "buton", id: "hap", etiketa: "Hap ventilin" }
    ],
    shpjegimi: `
      <p>Në hidraulikë ekuacioni i Bernulit shkruhet më shpesh në formë gjatësie. Kjo fitohet kur ekuacioni pjesëtohet me ρg, pra me peshën e një metri kub fluid, kështu që secili term ka njësinë e gjatësisë, metrin. Termat quhen lartësi: z është lartësia gjeometrike, p/ρg lartësia piezometrike dhe v²/2g lartësia e shpejtësisë. Shuma e tyre quhet lartësia e plotë H.</p>
      <p>Përparësia e kësaj forme është se termat e saj maten drejtpërdrejt. Piezometri tregon lartësinë piezometrike, kurse tubi Pitot tregon edhe lartësinë e shpejtësisë. Majat e piezometrave formojnë vijën piezometrike, ndërsa vija energjetike te fluidi ideal mbetet horizontale.</p>
      <p>Në simulim mund të ndryshohet prurja, ngushtimi dhe lartësia e gypit. Kur ventili mbyllet, uji ndalet dhe të gjithë piezometrat ngjiten deri në nivelin e rezervuarit.</p>`,
    formula: `<span class="z">z</span> + <span class="p"><span class="frx"><span>p</span><span>ρg</span></span></span> + <span class="v"><span class="frx"><span>v²</span><span>2g</span></span></span> = H = konst<small>të gjithë termat janë gjatësi, njësia: metër (m)</small>`,

    fillo(p, K) { K.gj.gr = new Grimcat(170, XT, XF); K.gj.Qcak = null; },

    vizato(p, K) {
      // animimi i ventilit
      if (K.klikuar("mbyll")) K.gj.Qcak = 0;
      if (K.klikuar("hap")) K.gj.Qcak = 12;
      if (K.gj.Qcak !== null) {
        const q = K.v("Q"), d = K.gj.Qcak - q;
        if (Math.abs(d) < 0.25) { K.vendos("Q", K.gj.Qcak); K.gj.Qcak = null; }
        else K.vendos("Q", Math.round((q + Math.sign(d) * Math.min(Math.abs(d), 10 * K.dt)) * 100) / 100);
      }

      const Q = K.v("Q") / 1000, D2 = K.v("D2") / 1000, z3 = K.v("z3"), Hr = K.v("H");
      const z1 = 1.0;

      // ---------- llogaritja përgjatë tubit ----------
      const pikat = [];
      const E = Hr;
      const A1 = Math.PI * D1 * D1 / 4, v1 = Q / A1;
      for (let x = XT; x <= XF; x += 5) {
        const { D, z } = gjeometria(x, D2, z1, z3);
        const v = Q / (Math.PI * D * D / 4);
        const hv = v * v / (2 * g);
        pikat.push({ x, D, z, v, hv, pg: E - z - hv, E });
      }
      const ne = (x) => pikat[Math.round((x - XT) / 5)];

      // ---------- rrafshi krahasues ----------
      p.stroke(NGJ.boja2); p.strokeWeight(1);
      vijeNderprere(p, 20, BAZA, 990, BAZA, 14, 5);
      shkruaj(p, "0", 26, BAZA - 6, { madhesia: 16, ngjyra: NGJ.boja2 });
      shkruaj(p, "0", 980, BAZA - 6, { madhesia: 16, ngjyra: NGJ.boja2 });
      shkruaj(p, "rrafshi krahasues", 560, BAZA + 22, { madhesia: 15, ngjyra: NGJ.boja2 });

      // ---------- rezervuari ----------
      p.noStroke(); p.fill(NGJ.uji); p.rect(32, y(Hr), XT - 32, y(0.3) - y(Hr));
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.line(30, y(9.6), 30, y(0.3)); p.line(30, y(0.3), XT, y(0.3));
      p.line(XT, y(0.3), XT, y(z1) + RV); p.line(XT, y(z1) - RV, XT, y(9.6));
      p.stroke(NGJ.ujiErr); p.strokeWeight(1.5); p.line(32, y(Hr), XT, y(Hr));
      shkruaj(p, "▽", 95, y(Hr) - 4, { madhesia: 15, ngjyra: NGJ.p });
      // furnizimi që e mban nivelin konstant
      p.stroke(NGJ.ujiErr); p.strokeWeight(5); p.line(10, y(9.9), 70, y(9.9)); p.line(70, y(9.9), 70, y(9.5));
      p.strokeWeight(2); p.line(70, y(9.4), 70, y(Hr));

      // ---------- tubi ----------
      const rr = (D) => RV * D / D1;
      p.noStroke(); p.fill(NGJ.uji);
      p.beginShape();
      for (const q of pikat) p.vertex(q.x, y(q.z) - rr(q.D));
      for (let i = pikat.length - 1; i >= 0; i--) p.vertex(pikat[i].x, y(pikat[i].z) + rr(pikat[i].D));
      p.endShape(p.CLOSE);
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.beginShape(); for (const q of pikat) p.vertex(q.x, y(q.z) - rr(q.D)); p.endShape();
      p.beginShape(); for (const q of pikat) p.vertex(q.x, y(q.z) + rr(q.D)); p.endShape();
      // ventili në dalje
      p.fill(NGJ.letra); p.strokeWeight(2);
      p.triangle(XF - 14, y(z3) - 14, XF - 14, y(z3) + 14, XF, y(z3)); p.triangle(XF + 14, y(z3) - 14, XF + 14, y(z3) + 14, XF, y(z3));
      p.line(XF, y(z3), XF, y(z3) - 26); p.line(XF - 10, y(z3) - 26, XF + 10, y(z3) - 26);
      if (Q > 0) { p.stroke(NGJ.ujiErr); p.strokeWeight(3); p.noFill(); p.bezier(XF + 14, y(z3), XF + 30, y(z3), XF + 34, y(z3) + 20, XF + 36, BAZA - 4); }

      // grimcat
      if (Q > 0) {
        K.gj.gr.levize(K.dt, (x) => Math.min(380, ne(Math.min(XF, Math.max(XT, x))).v * 22 + 4));
        K.gj.gr.vizato(p, (x, f) => { const q = ne(Math.min(XF, Math.max(XT, x))); return [x, y(q.z) + f * rr(q.D) * 0.8]; });
      }

      // ---------- vija energjetike dhe piezometrike ----------
      p.strokeWeight(2);
      p.stroke(NGJ.kuqe);
      for (let i = 1; i < pikat.length; i++) if (i % 3 !== 0) p.line(pikat[i - 1].x, y(pikat[i - 1].E), pikat[i].x, y(pikat[i].E));
      p.stroke(NGJ.p);
      for (let i = 1; i < pikat.length; i++) if (i % 3 !== 1) p.line(pikat[i - 1].x, y(pikat[i - 1].z + pikat[i - 1].pg), pikat[i].x, y(pikat[i].z + pikat[i].pg));
      shkruaj(p, "vija energjetike", XF + 8, y(pikat[pikat.length - 1].E) - 8, { madhesia: 15, ngjyra: NGJ.kuqe, rreshtim: p.RIGHT });
      shkruaj(p, "vija piezometrike", XK4 + 10, y(ne(XK4 + 10).z + ne(XK4 + 10).pg) + 20, { madhesia: 15, ngjyra: NGJ.p });

      // ---------- stacionet: piezometri + tubi Pitot + shtylla e energjisë ----------
      let tab = `<table><tr><th>Seks.</th><th>z</th><th>p/ρg</th><th>v²/2g</th><th>Σ = H</th></tr>`;
      for (const s of STAC) {
        const q = ne(s.x);
        const yc = y(q.z), r = rr(q.D);

        // shtylla e energjisë (majtas stacionit)
        const xb = s.x - 34;
        p.noStroke();
        p.fill(NGJ.z); p.rect(xb, y(q.z), 9, BAZA - y(q.z));
        if (q.pg > 0) { p.fill(NGJ.p); p.rect(xb, y(q.z + q.pg), 9, q.pg * PXM); }
        p.fill(NGJ.v); p.rect(xb, y(q.E), 9, q.hv * PXM);
        if (q.pg < 0) { p.fill(NGJ.kuqe); p.rect(xb, y(q.z), 9, -q.pg * PXM * 0.999); }

        // piezometri
        const xp = s.x;
        p.noStroke(); p.fill(NGJ.uji);
        if (q.pg > 0) p.rect(xp - 3, y(q.z + q.pg), 6, yc - r - y(q.z + q.pg));
        p.stroke(NGJ.boja); p.strokeWeight(1.5); p.noFill();
        const yMaj = y(Math.max(9.6, Hr + 0.4));
        p.line(xp - 4, yMaj, xp - 4, yc - r); p.line(xp + 4, yMaj, xp + 4, yc - r);
        // tubi Pitot (i kthyer kundër rrjedhës)
        const xt = s.x + 18;
        p.noStroke(); p.fill(NGJ.uji);
        const hTot = q.z + q.pg + q.hv;
        if (hTot > q.z) p.rect(xt - 3, y(hTot), 6, yc - y(hTot));
        p.stroke(NGJ.boja); p.strokeWeight(1.5);
        p.line(xt - 4, yMaj, xt - 4, yc - 4); p.line(xt + 4, yMaj, xt + 4, yc + 4);
        p.line(xt - 4, yc - 4, xt - 16, yc - 4); p.line(xt + 4, yc + 4, xt - 16, yc + 4);
        shkruaj(p, s.emri, s.x + 4, yc + r + 24, { madhesia: 22, rreshtim: p.CENTER, ngjyra: NGJ.kuqe });
        if (q.pg < 0) shkruaj(p, "nënpresion", s.x, yc - r - 10, { madhesia: 15, rreshtim: p.CENTER, ngjyra: NGJ.kuqe, sfond: NGJ.letra });

        tab += `<tr><td>${s.emri}</td><td>${fmt(q.z, 2)}</td><td class="${q.pg < 0 ? "kujdes" : ""}">${fmt(q.pg, 2)}</td><td>${fmt(q.hv, 2)}</td><td>${fmt(q.z + q.pg + q.hv, 2)}</td></tr>`;
      }
      tab += `</table>`;

      // legjenda
      const lx = 160, ly = 30;
      p.noStroke();
      [[NGJ.z, "z"], [NGJ.p, "{p|ρg}"], [NGJ.v, "{v²|2g}"]].forEach(([c, t], i) => {
        p.fill(c); p.rect(lx + i * 95, ly, 16, 10);
        shkruaj(p, t, lx + i * 95 + 22, ly + 11, { madhesia: 17 });
      });
      shkruaj(p, "FLUID IDEAL", 990, 30, { madhesia: 19, rreshtim: p.RIGHT });
      if (Q === 0) shkruaj(p, "Fluidi në qetësi (v = 0): z + {p|ρg} = H", 600, 70, { madhesia: 20, ngjyra: NGJ.p, rreshtim: p.CENTER, sfond: NGJ.letra });

      K.lexo(tab + `<div class="rresht"><span>Të gjitha vlerat janë gjatësi, në metra</span><b>v₁ = ${fmt(v1, 2)} m/s</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 6 – Forma për njësi mase: P/ρ + v²/2 + gh = konst (ek. 1.8)
//  Ndiqet 1 kg lëng nga seksioni 1 në seksionin 2
// ---------------------------------------------------------------------
(function () {
  const RHO = 998.2;
  const XA = 70, XB = 930, X1 = 230, X2 = 770;
  const BAZA_SH = 360;                       // baza e shiritave

  function tubi(x, h1, h2, r) {
    let t = kufizo((x - 420) / 200, 0, 1);
    const s = 3 * t * t - 2 * t * t * t;
    const y = 520 - lerp(h1, h2, s) * 22;    // lartësia e tubit, e ngjeshur vertikalisht
    return { y, r: lerp(22, 22 / Math.sqrt(r), s) };
  }

  regjistro({
    id: "masa", nr: 6, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Forma për njësi mase", titulliShkurt: "Njësi mase [J/kg]",
    nentitulli: "Kur ekuacioni pjesëtohet me ρ, secili term tregon energjinë e një kilogrami lëng.",
    kontrollet: [
      { lloji: "rreshqites", id: "P1", etiketa: "Presioni në seksionin 1, P₁", min: 0, max: 100, hapi: 1, vlera: 30, njesia: "kPa", dhjetore: 0 },
      { lloji: "rreshqites", id: "v1", etiketa: "Shpejtësia v₁", min: 0, max: 4, hapi: 0.1, vlera: 2, njesia: "m/s", dhjetore: 1 },
      { lloji: "rreshqites", id: "r", etiketa: "Raporti i prerjeve A₁/A₂", min: 1, max: 3, hapi: 0.05, vlera: 2, njesia: "", dhjetore: 2 },
      { lloji: "rreshqites", id: "h1", etiketa: "Lartësia h₁", min: 0, max: 5, hapi: 0.1, vlera: 1, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "h2", etiketa: "Lartësia h₂", min: 0, max: 5, hapi: 0.1, vlera: 3, njesia: "m", dhjetore: 1 }
    ],
    shpjegimi: `
      <p>Nëse ekuacionin e Bernulit e pjesëtojmë me dendësinë, të gjithë termat shprehen në xhaul për kilogram. P/ρ është energjia e presionit, gh energjia potenciale dhe v²/2 energjia kinetike e një kilogrami lëng. Kjo formë përdoret te pompat, turbinat dhe në termodinamikë.</p>
      <p>Me vlerat fillestare, në të dy seksionet shuma është 41,9 J/kg. Meqë në seksionin e dytë lëngu është më lart dhe lëviz më shpejt, energjia e presionit zvogëlohet nga 30,1 në 4,4 J/kg, pra presioni bie nga 30 kPa në rreth 4,4 kPa.</p>`,
    formula: `<span class="p"><span class="frx"><span>P</span><span>ρ</span></span></span> + <span class="v"><span class="frx"><span>v²</span><span>2</span></span></span> + <span class="z">gh</span> = konst<small>njësia J/kg</small>`,

    fillo(p, K) { K.gj.t = 0; },

    vizato(p, K) {
      const P1 = K.v("P1") * 1000, v1 = K.v("v1"), r = K.v("r"), h1 = K.v("h1"), h2 = K.v("h2");
      const v2 = v1 * r;
      const E1 = [P1 / RHO, g * h1, v1 * v1 / 2];
      const tot = E1[0] + E1[1] + E1[2];
      const E2 = [tot - g * h2 - v2 * v2 / 2, g * h2, v2 * v2 / 2];
      const P2 = E2[0] * RHO;

      // ---------- tubi poshtë ----------
      const lart = [], posht = [];
      for (let x = XA; x <= XB; x += 5) { const q = tubi(x, h1, h2, r); lart.push([x, q.y - q.r]); posht.push([x, q.y + q.r]); }
      p.noStroke(); p.fill(NGJ.uji);
      p.beginShape(); for (const [x, y] of lart) p.vertex(x, y); for (let i = posht.length - 1; i >= 0; i--) p.vertex(posht[i][0], posht[i][1]); p.endShape(p.CLOSE);
      p.stroke(NGJ.boja); p.strokeWeight(2.5); p.noFill();
      p.beginShape(); for (const [x, y] of lart) p.vertex(x, y); p.endShape();
      p.beginShape(); for (const [x, y] of posht) p.vertex(x, y); p.endShape();

      // 1 kg lëng që lëviz nga seksioni 1 te seksioni 2
      if (v1 > 0) K.gj.t = (K.gj.t + K.dt * 0.22) % 1;
      const xk = lerp(X1, X2, K.gj.t), qk = tubi(xk, h1, h2, r);
      p.stroke(NGJ.kuqe); p.strokeWeight(1.5); p.fill("#ffffff"); p.rect(xk - 24, qk.y - 11, 48, 22, 4);
      shkruaj(p, "1 kg", xk, qk.y + 6, { madhesia: 15, rreshtim: p.CENTER, ngjyra: NGJ.kuqe, dore: false });
      for (const [x, emri] of [[X1, "seksioni 1"], [X2, "seksioni 2"]]) {
        const q = tubi(x, h1, h2, r);
        shkruaj(p, emri, x, q.y + q.r + 20, { madhesia: 16, rreshtim: p.CENTER, ngjyra: NGJ.boja2 });
      }

      // ---------- shiritat (J/kg) ----------
      const maks = Math.max(30, tot, E2[1] + E2[2]);
      const sh = (BAZA_SH - 70) / maks, w = 120;
      const ngjyrat = [NGJ.p, NGJ.z, NGJ.v];
      for (const [x, E, emri] of [[X1, E1, "1"], [X2, E2, "2"]]) {
        let y = BAZA_SH;
        E.forEach((val, k) => {
          if (val <= 0) return;
          const hh = val * sh;
          p.noStroke(); p.fill(ngjyrat[k]); p.rect(x - w / 2, y - hh, w, hh);
          p.stroke(NGJ.letra); p.strokeWeight(2); p.line(x - w / 2, y - hh, x + w / 2, y - hh);
          const t = fmt(val, 1) + " J/kg";
          if (hh > 26) shkruaj(p, t, x, y - hh / 2 + 6, { madhesia: 17, rreshtim: p.CENTER, ngjyra: "#ffffff", dore: false });
          else shkruaj(p, t, x + w / 2 + 8, y - hh / 2 + 6, { madhesia: 15, ngjyra: ngjyrat[k], dore: false });
          y -= hh;
        });
        if (E[0] < 0) shkruaj(p, "{P|ρ} = " + fmt(E[0], 1) + " J/kg (nënpresion)", x, BAZA_SH + 22, { madhesia: 15, rreshtim: p.CENTER, ngjyra: NGJ.kuqe, dore: false });
        p.stroke(NGJ.boja); p.strokeWeight(1.5); p.line(x - w / 2 - 8, BAZA_SH, x + w / 2 + 8, BAZA_SH);
        shkruaj(p, "Σ = " + fmt(E[0] + E[1] + E[2], 1) + " J/kg", x, BAZA_SH - tot * sh - 14, { madhesia: 20, rreshtim: p.CENTER, dore: false });
      }
      const ySum = BAZA_SH - tot * sh;
      p.stroke(NGJ.kuqe); p.strokeWeight(1.5); vijeNderprere(p, X1 + w / 2 + 90, ySum, X2 - w / 2 - 4, ySum, 8, 5);
      shkruaj(p, "energjia e 1 kg lëng mbetet e njëjtë", (X1 + X2) / 2, ySum + 26, { madhesia: 17, rreshtim: p.CENTER, ngjyra: NGJ.kuqe });

      // legjenda
      [["{P|ρ}  energjia e presionit", NGJ.p], ["gh  energjia potenciale", NGJ.z], ["{v²|2}  energjia kinetike", NGJ.v]].forEach(([t, c], i) => {
        p.noStroke(); p.fill(c); p.rect(395, 200 + i * 34, 18, 14);
        shkruaj(p, t, 422, 213 + i * 34, { madhesia: 17 });
      });

      K.lexo(`
        <table><tr><th></th><th>Seksioni 1</th><th>Seksioni 2</th></tr>
        <tr><td>v (m/s)</td><td>${fmt(v1, 2)}</td><td>${fmt(v2, 2)}</td></tr>
        <tr><td>P/ρ (J/kg)</td><td>${fmt(E1[0], 1)}</td><td class="${E2[0] < 0 ? "kujdes" : ""}">${fmt(E2[0], 1)}</td></tr>
        <tr><td>gh (J/kg)</td><td>${fmt(E1[1], 1)}</td><td>${fmt(E2[1], 1)}</td></tr>
        <tr><td>v²/2 (J/kg)</td><td>${fmt(E1[2], 1)}</td><td>${fmt(E2[2], 1)}</td></tr>
        <tr><td><b>Shuma</b></td><td><b>${fmt(tot, 1)}</b></td><td><b>${fmt(tot, 1)}</b></td></tr>
        <tr><td>P (kPa)</td><td>${fmt(P1 / 1000, 1)}</td><td class="${P2 < 0 ? "kujdes" : ""}">${fmt(P2 / 1000, 1)}</td></tr></table>`);
    }
  });
})();


// ---------------------------------------------------------------------
//  Moduli 7 – Fluidi real: humbjet gjatësore dhe lokale
// ---------------------------------------------------------------------
(function () {
  const XR0 = 30, XR1 = 130, XA = 130, XB = 950, XV = 545, YG = 470;
  const PIEZO = [230, 400, 690, 860];
  regjistro({
    id: "humbjet", nr: 7, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Fluidi real: humbjet e energjisë", titulliShkurt: "Humbjet e energjisë",
    nentitulli: "Te fluidi real një pjesë e energjisë humbet nga fërkimi, prandaj vija energjetike bie përgjatë gypit.",
    kontrollet: [
      { lloji: "rreshqites", id: "v", etiketa: "Shpejtësia e ujit në gyp, v", min: 0.2, max: 4, hapi: 0.1, vlera: 2, njesia: "m/s", dhjetore: 1 },
      { lloji: "rreshqites", id: "L", etiketa: "Gjatësia e gypit, L", min: 20, max: 500, hapi: 10, vlera: 200, njesia: "m", dhjetore: 0 },
      { lloji: "rreshqites", id: "d", etiketa: "Diametri i gypit, d", min: 50, max: 300, hapi: 5, vlera: 100, njesia: "mm", dhjetore: 0 },
      { lloji: "rreshqites", id: "lam", etiketa: "Koeficienti i fërkimit, λ", min: 0.01, max: 0.05, hapi: 0.001, vlera: 0.02, njesia: "", dhjetore: 3 },
      { lloji: "rreshqites", id: "zeta", etiketa: "Koeficienti i ventilit, ζ (0,2 = i hapur)", min: 0, max: 20, hapi: 0.1, vlera: 5, njesia: "", dhjetore: 1 },
      { lloji: "rreshqites", id: "H", etiketa: "Niveli i ujit mbi gyp, H", min: 10, max: 40, hapi: 0.5, vlera: 20, njesia: "m", dhjetore: 1 }
    ],
    shpjegimi: `
      <p>Deri tani fluidin e kemi marrë ideal, pa viskozitet. Te fluidet reale shfaqet fërkimi ndërmjet shtresave të fluidit dhe ndërmjet fluidit dhe mureve të gypit. Për shkak të tij, një pjesë e energjisë shndërrohet në nxehtësi dhe nuk mund të shfrytëzohet më për rrjedhjen. Prandaj ekuacionit të Bernulit i shtohet termi i humbjeve h<sub>h</sub>.</p>
      <p>Humbjet gjatësore ndodhin përgjatë gjithë gypit dhe rriten me gjatësinë e gypit dhe me katrorin e shpejtësisë, ndërsa zvogëlohen kur gypi është më i gjerë. Humbjet lokale ndodhin aty ku rrjedha ndryshon drejtim ose prerje, si te bërrylat dhe ventilat.</p>
      <p>Në simulim gypi është horizontal dhe ka diametër të njëjtë, kështu që shpejtësia nuk ndryshon. E gjithë energjia që humbet shfaqet si rënie e presionit, që e shohim në piezometra.</p>`,
    formula: `<span style="font-size:20px">z₁ + p₁/ρg + v₁²/2g = z₂ + p₂/ρg + v₂²/2g + h<sub>h</sub></span><br>h<sub>f</sub> = λ(L/d)·v²/2g &nbsp;&nbsp; h<sub>m</sub> = ζ·v²/2g<small>h<sub>f</sub> humbjet gjatësore, h<sub>m</sub> humbjet lokale</small>`,
    fillo(p, K) { K.gj.s = 0; },
    vizato(p, K) {
      const v = K.v("v"), L = K.v("L"), d = K.v("d") / 1000, lam = K.v("lam"), zeta = K.v("zeta"), H = K.v("H");
      const hv = v * v / (2 * g), hf = lam * (L / d) * hv, hm = zeta * hv, hh = hf + hm;
      const PX = 330 / H, yp = (z) => YG - z * PX;
      const xm = (x) => (x - XA) / (XB - XA) * L;                       // pozita në metra
      const E = (x) => H - lam * (xm(x) / d) * hv - (x > XV ? hm : 0);
      const Pz = (x) => E(x) - hv;
      const r = Math.max(6, K.v("d") * 0.09);
      // rezervuari
      p.noStroke(); p.fill(NGJ.uji); p.rect(XR0, yp(H), XR1 - XR0, YG + r - yp(H));
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.line(XR0, yp(H) - 30, XR0, YG + r + 20); p.line(XR0, YG + r + 20, XR1, YG + r + 20); p.line(XR1, YG + r + 20, XR1, YG + r); p.line(XR1, YG - r, XR1, yp(H) - 30);
      shkruaj(p, "▽", XR0 + 40, yp(H) - 4, { madhesia: 15, ngjyra: NGJ.p });
      // gypi
      p.noStroke(); p.fill(NGJ.uji); p.rect(XA, YG - r, XB - XA, 2 * r);
      p.stroke(NGJ.boja); p.strokeWeight(3); p.line(XA, YG - r, XV - 14, YG - r); p.line(XA, YG + r, XV - 14, YG + r); p.line(XV + 14, YG - r, XB, YG - r); p.line(XV + 14, YG + r, XB, YG + r);
      K.gj.s = (K.gj.s + v * 40 * K.dt) % 40;
      p.noStroke(); p.fill("#fff");
      for (let x = XA + K.gj.s; x < XB; x += 40) { p.circle(x, YG - r * 0.4, 4); p.circle(x + 20, YG + r * 0.4, 4); }
      // ventili
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill("#cfd4dc");
      p.triangle(XV - 14, YG - r - 6, XV - 14, YG + r + 6, XV, YG); p.triangle(XV + 14, YG - r - 6, XV + 14, YG + r + 6, XV, YG);
      p.line(XV, YG - r - 6, XV, YG - r - 26); p.line(XV - 12, YG - r - 26, XV + 12, YG - r - 26);
      shkruaj(p, "ventili, ζ = " + fmt(zeta, 1), XV, YG + r + 30, { madhesia: 16, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      shkruaj(p, "L = " + fmt(L, 0) + " m,  d = " + fmt(K.v("d"), 0) + " mm", XB, YG + r + 30, { madhesia: 16, ngjyra: NGJ.boja2, rreshtim: p.RIGHT });
      // vija ideale
      p.stroke(150); p.strokeWeight(1.5); vijeNderprere(p, XA, yp(H), XB, yp(H), 4, 4);
      // vija energjetike dhe piezometrike
      const vija = (f, ngj) => {
        p.stroke(ngj); p.strokeWeight(2.5);
        vijeNderprere(p, XA, yp(Math.max(0, f(XA))), XV, yp(Math.max(0, f(XV - 0.01))), 9, 6);
        p.line(XV, yp(Math.max(0, f(XV - 0.01))), XV, yp(Math.max(0, f(XV + 0.01))));
        vijeNderprere(p, XV, yp(Math.max(0, f(XV + 0.01))), XB, yp(Math.max(0, f(XB))), 9, 6);
      };
      vija(E, NGJ.kuqe); vija(Pz, NGJ.p);
      // legjenda
      const leg = [["vija energjetike", NGJ.kuqe], ["vija piezometrike", NGJ.p], ["fluid ideal (pa humbje)", 150]];
      leg.forEach(([t, c], i) => { const y = 34 + i * 24; p.stroke(c); p.strokeWeight(2.5); vijeNderprere(p, 700, y - 5, 740, y - 5, 7, 4); shkruaj(p, t, 750, y, { madhesia: 16, ngjyra: NGJ.boja }); });
      // piezometrat
      for (const x of PIEZO) {
        const top = Math.max(0, Pz(x));
        p.noStroke(); p.fill(NGJ.p); p.rect(x - 4, yp(top), 8, YG - r - yp(top));
        p.stroke(NGJ.boja); p.strokeWeight(1.3); p.line(x - 6, YG - r, x - 6, yp(H) - 20); p.line(x + 6, YG - r, x + 6, yp(H) - 20);
      }
      // kuotat
      if (hh > 0.05 && E(XB) > 0) { kuota(p, XB - 40, yp(H), XB - 40, yp(E(XB)), "", NGJ.kuqe); shkruaj(p, "hₕ = " + fmt(hh, 2) + " m", XB - 50, (yp(H) + yp(E(XB))) / 2 + 6, { madhesia: 18, ngjyra: NGJ.kuqe, rreshtim: p.RIGHT, sfond: NGJ.letra }); }
      if (hm > 0.05) shkruaj(p, "hₘ = " + fmt(hm, 2) + " m", XV + 10, (yp(E(XV - 0.01)) + yp(E(XV + 0.01))) / 2 + 6, { madhesia: 16, ngjyra: NGJ.kuqe, sfond: NGJ.letra });
      const ok = Pz(XB) > 0;
      const dp = 998.2 * g * hh;
      shkruaj(p, ok ? "Rënia e presionit: Δp = ρg·hₕ = " + fmt(dp / 1000, 1) + " kPa" : "Humbjet e kalojnë nivelin në rezervuar: uji nuk rrjedh dot me këtë shpejtësi.", 40, 40, { madhesia: 19, ngjyra: ok ? NGJ.boja : NGJ.kuqe, trash: true });
      K.lexo(`
        <div class="rresht"><span>Lartësia e shpejtësisë v²/2g</span><b>${fmt(hv, 3)} m</b></div>
        <div class="rresht"><span>Humbjet gjatësore h<sub>f</sub> = λ(L/d)v²/2g</span><b>${fmt(hf, 2)} m</b></div>
        <div class="rresht"><span>Humbja lokale h<sub>m</sub> = ζv²/2g</span><b>${fmt(hm, 2)} m</b></div>
        <div class="rresht"><span>Humbjet gjithsej h<sub>h</sub></span><b>${fmt(hh, 2)} m</b></div>
        <div class="rresht"><span>Rënia e presionit Δp = ρg·h<sub>h</sub></span><b>${fmt(dp / 1000, 1)} kPa</b></div>
        <div class="rresht"><span>Prurja Q = A·v</span><b>${fmt(Math.PI * d * d / 4 * v * 1000, 2)} L/s</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 7 – Bernuli në jetën e përditshme: spërkatësi i parfumit
// ---------------------------------------------------------------------
(function () {
  const RHO_A = 1.2;              // kg/m³ – ajri
  const A_B = 10e-4;              // m² – sipërfaqja e pompës së gomës ku shtyp gishti (10 cm²)
  const PXCM = 16;                // 1 cm = 16 px
  const XT = 520, YT = 255;       // maja e gypit të hollë (gypi zhytës)
  const YA = 247;                 // boshti i gypit të ajrit
  const XN = 505;                 // gryka e ajrit
  const LENG = {
    parfum: { emri: "Parfum (me bazë alkooli)", rho: 850 },
    uji:    { emri: "Ujë", rho: 998.2 },
    vaj:    { emri: "Vaj", rho: 918 }
  };

  regjistro({
    id: "parfumi", nr: 8, grupi: "2. Zbatimi i ekuacionit",
    titulli: "Spërkatësi i parfumit", titulliShkurt: "Spërkatësi i parfumit",
    nentitulli: "Rryma e shpejtë e ajrit mbi gyp e ul presionin dhe lëngu ngjitet nga shishja.",
    kontrollet: [
      { lloji: "rreshqites", id: "F", etiketa: "Forca e shtypjes së pompës, F", min: 0, max: 2, hapi: 0.02, vlera: 0.8, njesia: "N", dhjetore: 2 },
      { lloji: "rreshqites", id: "h", etiketa: "Lartësia nga sipërfaqja e lëngut deri te maja e gypit, h", min: 4, max: 15, hapi: 0.1, vlera: 7, njesia: "cm", dhjetore: 1 },
      { lloji: "zgjedh", id: "l", etiketa: "Lëngu në shishe", vlera: "parfum",
        opsionet: Object.entries(LENG).map(([k, o]) => [k, o.emri + " – " + fmt(o.rho, 0) + " kg/m³"]) }
    ],
    shpjegimi: `
      <p>Kur shtypim pompën e gomës, ajri brenda saj fiton mbipresion dhe del me shpejtësi të madhe nëpër grykën e ngushtë. Kjo rrymë kalon pikërisht mbi majën e një gypi të hollë që është zhytur në lëng.</p>
      <p>Aty ku ajri lëviz shpejt, presioni bie nën presionin atmosferik. Mbi lëngun në shishe vepron presioni atmosferik, kështu që diferenca e presionit e shtyn lëngun lart nëpër gyp. Kur lëngu arrin majën, rryma e ajrit e copëton në pika të imëta.</p>
      <p>Lëngu arrin majën vetëm kur forca e shtypjes është mjaft e madhe. Prandaj, kur shishja është gati e zbrazët, pompën duhet ta shtypim më fort.</p>`,
    formula: `p = F/A &nbsp;&nbsp; v = √(2p/ρₐ) &nbsp;&nbsp; Δp = ½ρₐv²<br>lëngu spërkatet kur F &gt; ρₗghA`,

    fillo(p, K) { K.gj.t = 0; K.gj.pika = []; K.gj.ajri = []; K.gj.shtylla = 0; },

    vizato(p, K) {
      const F = K.v("F"), hcm = K.v("h"), h = hcm / 100;
      const L = LENG[K.v("l")] || LENG.parfum;
      const pb = F / A_B;                                 // Pa
      const va = Math.sqrt(2 * pb / RHO_A);               // m/s
      const dp = 0.5 * RHO_A * va * va;                   // Pa
      const hmax = dp / (L.rho * g);                      // m
      const sperkat = hmax > h;
      const u = sperkat ? Math.sqrt(2 * g * (hmax - h)) : 0;  // shpejtësia e lëngut në gyp
      const gj = K.gj;
      gj.t += K.dt;

      // shtylla e lëngut në gyp ngrihet/ulet butë
      const synimi = Math.min(h, hmax);
      gj.shtylla += (synimi - gj.shtylla) * Math.min(1, K.dt * 6);

      const ySip = YT + hcm * PXCM;                       // sipërfaqja e lëngut në shishe
      const yFund = 520;

      // ---------- tavolina ----------
      toka(p, 300, 720, yFund + 2);

      // ---------- shishja ----------
      const bx0 = 420, bx1 = 620, dy = YT - 192, yQafa = 212 + dy, ySup = 252 + dy;
      // lëngu brenda shishes
      p.fill("#e7c7d9");
      const yL = Math.max(ySip, ySup);
      p.rect(bx0 + 3, yL, bx1 - bx0 - 6, yFund - yL - 2, 0, 0, 22, 22);
      p.stroke("#b58aa4"); p.strokeWeight(1.5); p.line(bx0 + 4, yL, bx1 - 4, yL);
      // konturi i shishes
      p.noFill(); p.stroke(NGJ.boja); p.strokeWeight(2.5);
      p.beginShape();
      p.vertex(490, yQafa); p.vertex(490, 230 + dy);
      p.bezierVertex(490, 244 + dy, bx0, 238 + dy, bx0, ySup + 14);
      p.vertex(bx0, yFund - 22); p.bezierVertex(bx0, yFund, bx0, yFund, bx0 + 22, yFund);
      p.vertex(bx1 - 22, yFund); p.bezierVertex(bx1, yFund, bx1, yFund, bx1, yFund - 22);
      p.vertex(bx1, ySup + 14);
      p.bezierVertex(bx1, 238 + dy, 550, 244 + dy, 550, 230 + dy); p.vertex(550, yQafa);
      p.endShape();
      // shkëlqimi i qelqit
      p.stroke("#ffffff"); p.strokeWeight(5); p.line(bx0 + 16, ySup + 30, bx0 + 16, yFund - 40);
      // kapaku
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill(NGJ.metal);
      p.rect(484, yQafa - 10, 72, 14, 3);
      // vrima e ajrit në kapak (që pₐ të veprojë mbi lëng)
      p.noStroke(); p.fill(NGJ.boja); p.circle(545, yQafa - 3, 4);

      // ---------- gypi zhytës ----------
      const yGypFund = yFund - 14;
      p.stroke(NGJ.boja); p.strokeWeight(7); p.line(XT, YT, XT, yGypFund);
      p.stroke("#f4f6f9"); p.strokeWeight(4); p.line(XT, YT + 1, XT, yGypFund);
      // lëngu në gyp: deri në sipërfaqe është i mbushur, mbi të ngrihet sipas diferencës së presionit
      p.stroke("#c98bb0"); p.strokeWeight(4);
      p.line(XT, yGypFund, XT, ySip);
      const yMajaShtylles = ySip - gj.shtylla * 100 * PXCM;
      if (gj.shtylla > 0.0005) p.line(XT, ySip, XT, Math.max(YT, yMajaShtylles));

      // ---------- pompa e gomës ----------
      const f = F / 2;
      const cx = 165, cy = YA;
      const rx = 78 * (1 - 0.12 * f), ry = 56 * (1 - 0.38 * f);
      p.stroke(NGJ.boja); p.strokeWeight(2.5); p.fill("#c4534a");
      p.ellipse(cx, cy, 2 * rx, 2 * ry);
      p.noStroke(); p.fill(255, 255, 255, 70); p.ellipse(cx - rx * 0.35, cy - ry * 0.4, rx * 0.6, ry * 0.35);
      // qafa e pompës
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill("#a8433b");
      p.rect(cx + rx - 6, YA - 9, 30, 18, 3);
      // gypi i ajrit deri te gryka
      p.stroke(NGJ.boja); p.strokeWeight(12); p.line(cx + rx + 22, YA, XN, YA);
      p.stroke("#f4f6f9"); p.strokeWeight(8); p.line(cx + rx + 22, YA, XN - 1, YA);
      // gryka e ngushtë
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill(NGJ.metal);
      p.quad(XN - 24, YA - 7, XN, YA - 3, XN, YA + 3, XN - 24, YA + 7);

      // forcat e gishtave mbi pompë (pa paraqitur dorën)
      if (F > 0.01) {
        const gjat = 18 + 32 * f;
        shigjeta(p, cx, cy - ry - 8 - gjat, cx, cy - ry - 6, NGJ.kuqe, 2.5, 11);
        shigjeta(p, cx, cy + ry + 8 + gjat, cx, cy + ry + 6, NGJ.kuqe, 2.5, 11);
        shkruaj(p, "F", cx + 12, cy - ry - 18, { madhesia: 22, ngjyra: NGJ.kuqe });
        shkruaj(p, "F", cx + 12, cy + ry + 30, { madhesia: 22, ngjyra: NGJ.kuqe });
      }
      shkruaj(p, "pompa e gomës", cx, cy + ry + 66, { madhesia: 17, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      shkruaj(p, "p = {F|A}", cx, cy + 6, { madhesia: 19, ngjyra: "#fff", rreshtim: p.CENTER });

      // ---------- rryma e ajrit ----------
      if (va > 0.5) {
        const sa = Math.min(3, va / 12);
        for (let k = 0; k < sa; k++) if (gj.ajri.length < 70 && p.random() < sa / 3) gj.ajri.push({ x: XN + 2, a: p.random(-0.13, 0.13), dy: p.random(-2, 2) });
        p.strokeWeight(2);
        for (const a of gj.ajri) {
          a.x += va * 5 * K.dt;
          const d = a.x - XN, y = YA + a.dy + a.a * d;
          p.stroke(42, 98, 168, Math.max(0, 230 * (1 - d / 300)));
          p.line(a.x, y, a.x - 9, y - a.a * 9);
        }
        gj.ajri = gj.ajri.filter((a) => a.x < XN + 300);
        shigjeta(p, XN - 175, YA - 24, XN - 175 + Math.min(150, 25 + va * 1.3), YA - 24, NGJ.v, 2.5, 11);
        shkruaj(p, "v = " + fmt(va, 0) + " m/s", XN - 175, YA - 34, { madhesia: 19, ngjyra: NGJ.v });
      } else gj.ajri = [];

      // ---------- pikat e spërkatura ----------
      if (sperkat && gj.shtylla > h * 0.97) {
        const n = Math.min(5, 1 + u * 3);
        for (let i = 0; i < n; i++)
          gj.pika.push({ x: XT + 2, y: YT - 2, vx: va * (4.5 + p.random(2.5)), vy: p.random(-30, 30) * (0.3 + va / 80), r: p.random(1.5, 3.5), jeta: 0 });
      }
      p.noStroke();
      for (const d of gj.pika) {
        d.x += d.vx * K.dt; d.y += d.vy * K.dt; d.vx *= (1 - 0.9 * K.dt); d.vy += 22 * K.dt; d.jeta += K.dt;
        const al = Math.max(0, 255 - d.jeta * 140);
        p.fill(201, 139, 176, al); p.circle(d.x, d.y, d.r * 2);
      }
      gj.pika = gj.pika.filter((d) => d.jeta < 1.8 && d.x < 990);

      // ---------- shënimet e presionit ----------
      // presion i ulët mbi majën e gypit
      p.noFill(); p.stroke(NGJ.p); p.strokeWeight(1.5);
      vijeNderprere(p, XT + 2, YT - 6, XT + 70, YT - 92, 5, 4);
      shkruaj(p, "P = pₐ − ½ρₐv²", XT + 74, YT - 94, { madhesia: 18, ngjyra: NGJ.p, sfond: NGJ.letra });
      shkruaj(p, "(presion i ulët mbi gyp)", XT + 74, YT - 74, { madhesia: 15, ngjyra: NGJ.boja2, sfond: NGJ.letra });
      // presioni atmosferik mbi sipërfaqen e lëngut
      for (const x of [450, 585]) shigjeta(p, x, yL - 30, x, yL - 4, NGJ.p, 2, 9);
      shkruaj(p, "pₐ", 450 + 10, yL - 18, { madhesia: 18, ngjyra: NGJ.p });
      shkruaj(p, "pₐ", 585 + 10, yL - 18, { madhesia: 18, ngjyra: NGJ.p });
      // kuota h
      p.stroke(NGJ.boja2); p.strokeWeight(1);
      vijeNderprere(p, XT, YT, 650, YT, 4, 4);
      vijeNderprere(p, bx1, yL, 650, yL, 4, 4);
      kuota(p, 645, YT, 645, yL, "h = " + fmt(hcm, 1) + " cm", NGJ.z);
      // h_max – sa lart mund ta ngrejë lëngun diferenca e presionit
      const yHmax = ySip - hmax * 100 * PXCM;
      if (!sperkat && hmax > 0.002) {
        p.stroke(sperkat ? "#3f7a32" : NGJ.kuqe); p.strokeWeight(1.5);
        vijeNderprere(p, XT - 60, yHmax, XT + 8, yHmax, 6, 4);
        shkruaj(p, "hₘₐₓ", XT - 64, yHmax + 5, { madhesia: 17, ngjyra: sperkat ? "#3f7a32" : NGJ.kuqe, rreshtim: p.RIGHT });
      }

      // ---------- paneli i rezultatit ----------
      const px = 765, py = 290;
      p.stroke(NGJ.boja); p.strokeWeight(1.2); p.fill(NGJ.letra); p.rect(px, py, 225, 228, 4);
      let yy = py + 30;
      const rr = (t, c, m) => { shkruaj(p, t, px + 12, yy, { madhesia: m || 17, ngjyra: c || NGJ.boja }); yy += 30; };
      rr("p = {F|A} = " + fmt(pb, 0) + " Pa");
      rr("v = √{2p|ρₐ} = " + fmt(va, 1) + " m/s", NGJ.v);
      rr("Δp = ½ρₐv² = " + fmt(dp, 0) + " Pa", NGJ.p);
      rr("hₘₐₓ = {Δp|ρg} = " + fmt(hmax * 100, 1) + " cm");
      rr("h = " + fmt(hcm, 1) + " cm", NGJ.z);
      yy += 6;
      if (sperkat) rr("Parfumi spërkatet", "#3f7a32", 21);
      else rr(F < 0.01 ? "Shtypni pompën" : "Lëngu nuk arrin majën", NGJ.kuqe, 21);

      K.lexo(`
        <div class="rresht"><span>Mbipresioni në pompë p = F/A (A = 10 cm²)</span><b>${fmt(pb, 0)} Pa</b></div>
        <div class="rresht"><span>Shpejtësia e ajrit v = √(2p/ρₐ)</span><b>${fmt(va, 1)} m/s</b></div>
        <div class="rresht"><span>Rënia e presionit mbi gyp Δp = ½ρₐv²</span><b>${fmt(dp, 0)} Pa</b></div>
        <div class="rresht"><span>Presioni për ta ngritur lëngun deri te maja ρgh</span><b>${fmt(L.rho * g * h, 0)} Pa</b></div>
        <div class="rresht"><span>Forca minimale që lëngu të arrijë majën</span><b>${fmt(L.rho * g * h * A_B, 2)} N</b></div>
        <div class="rresht"><span>Shpejtësia e lëngut në majë të gypit √(2g(hₘₐₓ − h))</span><b class="${sperkat ? "" : "kujdes"}">${sperkat ? fmt(u, 2) + " m/s" : "lëngu nuk del"}</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 8 – Shembull nga hidraulika: furnizimi i ndërtesës nga rezervuari
// ---------------------------------------------------------------------
(function () {
  const RHO_W = 1000;                  // kg/m³
  const TOKA = 505;
  let PXM = 11;                        // px për 1 m – përshtatet sipas z₀
  const yp = (z) => TOKA - z * PXM;
  const XR0 = 45, XR1 = 205, XRG = 125;   // rezervuari dhe gypi që zbret
  const XS1 = 480;                        // seksioni 1 (në tokë)
  const XV = 640;                         // gypi vertikal në ndërtesë
  const XS2 = 725;                        // seksioni 2
  const XB0 = 600, XB1 = 800;             // ndërtesa
  const XN0 = 790, XN1 = 818;             // gryka dalëse (seksioni 3)
  const trash = (dmm) => Math.max(4, dmm * 0.12);   // trashësia e gypit në px

  function gjatesia(pk) { let L = 0; for (let i = 1; i < pk.length; i++) L += Math.hypot(pk[i][0] - pk[i - 1][0], pk[i][1] - pk[i - 1][1]); return L; }
  function pikaNe(pk, s) {
    for (let i = 1; i < pk.length; i++) {
      const [x1, y1] = pk[i - 1], [x2, y2] = pk[i];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (s <= d) return [x1 + (x2 - x1) * s / d, y1 + (y2 - y1) * s / d];
      s -= d;
    }
    return pk[pk.length - 1];
  }
  function gyp(p, pk, w, mbushur) {
    p.noFill(); p.strokeJoin(p.ROUND);
    p.stroke(NGJ.boja); p.strokeWeight(w + 4);
    p.beginShape(); for (const [x, y] of pk) p.vertex(x, y); p.endShape();
    p.stroke(mbushur ? NGJ.uji : "#eef2f6"); p.strokeWeight(w);
    p.beginShape(); for (const [x, y] of pk) p.vertex(x, y); p.endShape();
  }

  regjistro({
    id: "rezervuari", nr: 12, grupi: "2. Zbatimi i ekuacionit",
    titulli: "Furnizimi i ndërtesës me ujë nga rezervuari", titulliShkurt: "Rezervuari dhe ndërtesa",
    nentitulli: "Shpejtësia, prurja dhe presionet në një rrjet të thjeshtë ujësjellësi.",
    kontrollet: [
      { lloji: "cek", id: "hapur", etiketa: "Dalja e hapur (uji rrjedh)", vlera: true },
      { lloji: "rreshqites", id: "z0", etiketa: "Niveli i ujit në rezervuar, z₀", min: 15, max: 40, hapi: 0.5, vlera: 25, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "z2", etiketa: "Lartësia e daljes (kati), z₂ = z₃", min: 2, max: 30, hapi: 0.5, vlera: 10, njesia: "m", dhjetore: 1 },
      { lloji: "rreshqites", id: "d1", etiketa: "Diametri i gypit kryesor, d₁", min: 80, max: 250, hapi: 5, vlera: 150, njesia: "mm", dhjetore: 0 },
      { lloji: "rreshqites", id: "d2", etiketa: "Diametri i gypit në ndërtesë, d₂", min: 50, max: 200, hapi: 5, vlera: 100, njesia: "mm", dhjetore: 0 },
      { lloji: "rreshqites", id: "d3", etiketa: "Diametri i grykës dalëse, d₃", min: 15, max: 100, hapi: 1, vlera: 40, njesia: "mm", dhjetore: 0 }
    ],
    shpjegimi: `
      <p>Rezervuari i lagjes është i hapur ndaj atmosferës. Uji zbret me gypin kryesor deri në tokë, ngjitet nëpër ndërtesë dhe del nga një grykë në njërin nga katet. Kur ekuacionin e Bernulit e zbatojmë ndërmjet sipërfaqes së ujit në rezervuar dhe daljes, fitojmë shpejtësinë e daljes, e cila varet vetëm nga diferenca e lartësive.</p>
      <p>Vija e kuqe në simulim është vija energjetike dhe mbetet në lartësinë e ujit në rezervuar. Shtyllat blu në piezometra tregojnë presionin në secilin seksion. Kur dalja mbyllet, uji ndalet dhe piezometrat ngjiten deri në nivelin e rezervuarit; ky është presioni hidrostatik. Kur dalja hapet, presioni bie, sepse një pjesë e energjisë shndërrohet në shpejtësi.</p>
      <p>Me vlerat fillestare, nga rezervuari me nivel 25 m uji del në katin e katërt me rreth 17 m/s, kurse prurja është afërsisht 21,6 L/s.</p>`,
    formula: `z + <span class="frx"><span>p</span><span>ρg</span></span> + <span class="frx"><span>v²</span><span>2g</span></span> = H &nbsp;·&nbsp; v₃ = √(2g(z₀ − z₃)) &nbsp;·&nbsp; Q = A·v`,

    fillo(p, K) { K.gj.hapja = K.v("hapur") ? 1 : 0; K.gj.s1 = 0; K.gj.s2 = 0; K.gj.rryma = []; },

    vizato(p, K) {
      let z0 = K.v("z0"), z2 = K.v("z2");
      if (z2 > z0 - 1) { z2 = z0 - 1; K.vendos("z2", z2); }
      PXM = 430 / (z0 + 2.5);
      const d1 = K.v("d1") / 1000, d2 = K.v("d2") / 1000, d3 = K.v("d3") / 1000;
      const gj = K.gj;
      const synimi = K.v("hapur") ? 1 : 0;
      gj.hapja += (synimi - gj.hapja) * Math.min(1, K.dt * 4);
      if (Math.abs(synimi - gj.hapja) < 0.005) gj.hapja = synimi;
      const o = gj.hapja;

      const A1 = Math.PI * d1 * d1 / 4, A2 = Math.PI * d2 * d2 / 4, A3 = Math.PI * d3 * d3 / 4;
      const v3max = Math.sqrt(2 * g * (z0 - z2));
      const v3 = o * v3max, Q = A3 * v3;
      const v1 = Q / A1, v2 = Q / A2;
      const k1 = v1 * v1 / (2 * g), k2 = v2 * v2 / (2 * g), k3 = v3 * v3 / (2 * g);
      const H = z0;
      const h1 = H - 0 - k1, h2 = H - z2 - k2;                 // p/ρg
      const p1 = RHO_W * g * h1, p2 = RHO_W * g * h2;          // Pa
      const p1s = RHO_W * g * z0, p2s = RHO_W * g * (z0 - z2); // hidrostatike

      const w1 = trash(K.v("d1")), w2 = trash(K.v("d2")), w3 = trash(K.v("d3"));
      const yG = TOKA - w1 / 2 - 3;           // boshti i gypit në tokë
      const yZ2 = yp(z2);

      // ---------- ndërtesa ----------
      const zCati = Math.min(z2 + 3, 40);
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill("#efe6d6");
      p.rect(XB0, yp(zCati), XB1 - XB0, TOKA - yp(zCati));
      p.stroke("#cdbfa6"); p.strokeWeight(1);
      for (let z = 3; z < zCati - 0.1; z += 3) vijeNderprere(p, XB0, yp(z), XB1, yp(z), 6, 5);
      p.noStroke(); p.fill("#d6e4ef");
      for (let z = 0.9; z < zCati - 1.5; z += 3) { p.rect(XB0 + 20, yp(z + 1.6), 26, 1.4 * PXM); p.rect(XB1 - 46, yp(z + 1.6), 26, 1.4 * PXM); }
      shkruaj(p, "ndërtesa", 740, TOKA - 8, { madhesia: 16, ngjyra: NGJ.boja2, rreshtim: p.CENTER });

      // ---------- rezervuari mbi kullë ----------
      const zFund = z0 - 3, zMaje = z0 + 1.5;
      p.stroke(NGJ.boja); p.strokeWeight(2.5);
      p.line(XR0 + 22, yp(zFund), XR0 + 8, TOKA); p.line(XR1 - 22, yp(zFund), XR1 - 8, TOKA);
      p.strokeWeight(1);
      for (let z = 3; z < zFund - 1; z += 4) {
        const t = z / zFund, xa = lerp(XR0 + 8, XR0 + 22, t), xb = lerp(XR1 - 8, XR1 - 22, t);
        const t2 = Math.min(1, (z + 4) / zFund), xa2 = lerp(XR0 + 8, XR0 + 22, t2), xb2 = lerp(XR1 - 8, XR1 - 22, t2);
        p.line(xa, yp(z), xb2, yp(Math.min(z + 4, zFund))); p.line(xb, yp(z), xa2, yp(Math.min(z + 4, zFund)));
      }
      p.noStroke(); p.fill(NGJ.uji); p.rect(XR0 + 2, yp(z0), XR1 - XR0 - 4, yp(zFund) - yp(z0));
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.line(XR0, yp(zMaje), XR0, yp(zFund)); p.line(XR0, yp(zFund), XR1, yp(zFund)); p.line(XR1, yp(zFund), XR1, yp(zMaje));
      p.stroke(NGJ.ujiErr); p.strokeWeight(1.5); p.line(XR0 + 2, yp(z0), XR1 - 2, yp(z0));
      shkruaj(p, "▽", XR0 + 16, yp(z0) - 4, { madhesia: 15, ngjyra: NGJ.p });
      shkruaj(p, "0", XR0 + 40, yp(z0) - 6, { madhesia: 19, ngjyra: NGJ.kuqe });
      shkruaj(p, "pₐ", XR1 - 32, yp(z0) - 8, { madhesia: 17, ngjyra: NGJ.p });

      // ---------- gypat ----------
      const rr1 = [[XRG, yp(zFund) - 2], [XRG, yG], [XV, yG]];
      const rr2 = [[XV, yG], [XV, yZ2], [XN0, yZ2]];
      gyp(p, rr2, w2, true);
      gyp(p, rr1, w1, true);
      // gryka dalëse
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill(NGJ.uji);
      p.quad(XN0, yZ2 - w2 / 2 - 2, XN1, yZ2 - w3 / 2 - 2, XN1, yZ2 + w3 / 2 + 2, XN0, yZ2 + w2 / 2 + 2);
      // valvola para grykës
      const xVal = 772;
      p.stroke(NGJ.boja); p.strokeWeight(2); p.fill(o > 0.5 ? "#3f7a32" : NGJ.kuqe);
      p.triangle(xVal - 8, yZ2 - w2 / 2 - 4, xVal + 8, yZ2 - w2 / 2 - 4, xVal, yZ2 - w2 / 2 - 12);
      p.line(xVal, yZ2 - w2 / 2 - 12, xVal, yZ2 - w2 / 2 - 20); p.line(xVal - 8, yZ2 - w2 / 2 - 20, xVal + 8, yZ2 - w2 / 2 - 20);
      if (o < 0.5) { p.stroke(NGJ.kuqe); p.strokeWeight(3); p.line(xVal, yZ2 - w2 / 2, xVal, yZ2 + w2 / 2); }

      // ---------- grimcat ----------
      const L1 = gjatesia(rr1), L2 = gjatesia(rr2) + (XN1 - XN0);
      gj.s1 = (gj.s1 + v1 * 30 * K.dt) % 26; gj.s2 = (gj.s2 + v2 * 30 * K.dt) % 26;
      if (o > 0.02) {
        p.noStroke(); p.fill("#ffffff");
        for (let s = gj.s1; s < L1; s += 26) { const [x, y] = pikaNe(rr1, s); p.circle(x, y, 4); }
        for (let s = gj.s2; s < L2 - (XN1 - XN0); s += 26) { const [x, y] = pikaNe(rr2, s); p.circle(x, y, 4); }
      }

      // ---------- rryma e daljes (hedhje horizontale) ----------
      if (v3 > 0.3) {
        p.noFill(); p.stroke(NGJ.ujiErr); p.strokeWeight(Math.max(2, w3 * 0.8));
        p.beginShape();
        for (let t = 0; t < 4; t += 0.02) {
          const x = XN1 + v3 * t * PXM, y = yZ2 + 0.5 * g * t * t * PXM;
          if (y > TOKA - 2 || x > 995) { p.vertex(Math.min(x, 995), Math.min(y, TOKA - 2)); break; }
          p.vertex(x, y);
        }
        p.endShape();
      }
      p.noStroke(); p.fill(NGJ.kuqe); p.circle(XN1 + 4, yZ2, 8);
      shkruaj(p, "3", XN1 + 6, yZ2 - 12, { madhesia: 19, ngjyra: NGJ.kuqe });

      // ---------- vija energjetike dhe ajo piezometrike ----------
      p.stroke(NGJ.kuqe); p.strokeWeight(1.6);
      vijeNderprere(p, XR1 + 5, yp(H), 990, yp(H), 10, 6);
      shkruaj(p, "vija energjetike  H = z₀ = " + fmt(H, 1) + " m", 985, yp(H) - 8, { madhesia: 16, ngjyra: NGJ.kuqe, rreshtim: p.RIGHT });
      if (o > 0.02) {
        p.stroke(NGJ.p); p.strokeWeight(1.4);
        const yP1 = yp(H - k1), yP2 = yp(H - k2);
        vijeNderprere(p, XR1 + 5, yp(H), XS1 - 60, yP1, 5, 4);
        vijeNderprere(p, XS1 - 60, yP1, XV, yP1, 5, 4);
        vijeNderprere(p, XV, yP2, XN0, yP2, 5, 4);
        vijeNderprere(p, XN0, yP2, XN1, yZ2, 3, 3);
        shkruaj(p, "vija piezometrike", XV - 10, yP1 + 16, { madhesia: 15, ngjyra: NGJ.p, rreshtim: p.RIGHT });
      }

      // ---------- piezometrat ----------
      const piezometer = (x, yBaze, zBaze, hP, nr, w) => {
        const yMaje = yp(zBaze + hP);
        const yTop = Math.min(yMaje, yp(H)) - 14;
        p.stroke(NGJ.boja); p.strokeWeight(1.5); p.fill("#f6f9fc");
        p.rect(x - 4, yTop, 8, yBaze - w / 2 - yTop);
        p.noStroke(); p.fill(NGJ.p);
        p.rect(x - 2.5, yMaje, 5, yBaze - w / 2 - yMaje);
        // v²/2g – hapësira deri te vija energjetike
        if (yMaje - yp(H) > 3) { p.fill(NGJ.v); p.rect(x + 6, yp(H), 4, yMaje - yp(H)); }
        p.noStroke(); p.fill(NGJ.kuqe); p.circle(x, yBaze, 8);
        shkruaj(p, nr, x - 18, yBaze - w / 2 - 6, { madhesia: 19, ngjyra: NGJ.kuqe });
      };
      piezometer(XS1, yG, 0, h1, "1", w1);
      piezometer(XS2, yZ2, z2, h2, "2", w2);
      shkruaj(p, "{p₁|ρg} = " + fmt(h1, 2) + " m", XS1 + 14, Math.max(yp(z0) + 40, (yp(h1) + yG) / 2), { madhesia: 16, ngjyra: NGJ.p, sfond: NGJ.letra });
      shkruaj(p, "{p₂|ρg} = " + fmt(h2, 2) + " m", XS2 - 12, Math.max(yp(z0) + 40, (yp(z2 + h2) + yZ2) / 2), { madhesia: 16, ngjyra: NGJ.p, rreshtim: p.RIGHT, sfond: NGJ.letra });

      // ---------- manometrat ----------
      const pMax = 400;
      p.stroke(NGJ.boja); p.strokeWeight(2); p.line(370, yG - w1 / 2, 370, yG - 44);
      manometerBourdon(p, 370, yG - 92, 48, p1 / 1000, pMax, "kPa", null);
      shkruaj(p, "p₁ = " + fmt(p1 / 1000, 1) + " kPa", 370, yG - 152, { madhesia: 17, rreshtim: p.CENTER, sfond: NGJ.letra });

      // ---------- kuotat ----------
      p.stroke(NGJ.boja2); p.strokeWeight(1);
      vijeNderprere(p, XN1 + 4, yZ2, 985, yZ2, 4, 5);
      kuota(p, 975, TOKA, 975, yZ2, "z₂", NGJ.z, "majtas");
      kuota(p, 18, TOKA, 18, yp(z0), "", NGJ.z);
      shkruaj(p, "z₀", 24, (TOKA + yp(z0)) / 2 + 6, { madhesia: 18, ngjyra: NGJ.z });
      toka(p, 10, 995, TOKA);

      // ---------- paneli ----------
      const bx = 232, by = yp(H) + 30;
      p.stroke(NGJ.boja); p.strokeWeight(1.2); p.fill(NGJ.letra); p.rect(bx, by, 170, 112, 4);
      shkruaj(p, "v₃ = " + fmt(v3, 2) + " m/s", bx + 10, by + 26, { madhesia: 18, ngjyra: NGJ.v });
      shkruaj(p, "Q = " + fmt(Q * 1000, 1) + " L/s", bx + 10, by + 52, { madhesia: 18 });
      shkruaj(p, "p₂ = " + fmt(p2 / 1000, 1) + " kPa", bx + 10, by + 78, { madhesia: 18, ngjyra: NGJ.p });
      shkruaj(p, o > 0.5 ? "dalja e hapur" : "dalja e mbyllur", bx + 10, by + 102, { madhesia: 15, ngjyra: o > 0.5 ? "#3f7a32" : NGJ.kuqe });

      const rresht = (s, z, h, k) => `<tr><td>${s}</td><td>${fmt(z, 2)}</td><td>${fmt(h, 2)}</td><td>${fmt(k, 2)}</td><td>${fmt(z + h + k, 2)}</td></tr>`;
      K.lexo(`
        <div class="rresht"><span>Shpejtësia e daljes v₃ = √(2g(z₀ − z₃))</span><b>${fmt(v3, 2)} m/s</b></div>
        <div class="rresht"><span>Prurja Q = A₃·v₃</span><b>${fmt(Q, 4)} m³/s = ${fmt(Q * 1000, 1)} L/s</b></div>
        <div class="rresht"><span>v₁ = Q/A₁ · v₂ = Q/A₂</span><b>${fmt(v1, 2)} · ${fmt(v2, 2)} m/s</b></div>
        <div class="rresht"><span>p₁ – hidrodinamik / hidrostatik</span><b>${fmt(p1 / 1000, 1)} / ${fmt(p1s / 1000, 1)} kPa</b></div>
        <div class="rresht"><span>p₂ – hidrodinamik / hidrostatik</span><b>${fmt(p2 / 1000, 1)} / ${fmt(p2s / 1000, 1)} kPa</b></div>
        <table class="tabela-energjise">
          <tr><th>Seksioni</th><th>z [m]</th><th>p/ρg [m]</th><th>v²/2g [m]</th><th>H [m]</th></tr>
          ${rresht("0 – rezervuari", z0, 0, 0)}
          ${rresht("1 – toka", 0, h1, k1)}
          ${rresht("2 – kati", z2, h2, k2)}
          ${rresht("3 – dalja", z2, (1 - o) * (z0 - z2), k3)}
        </table>`);
    }
  });
})();

// =====================================================================
//  Modulet e reja: vazhdueshmëria, aeroplani, karburatori,
//  presionet, manometri dhe tubi Pitot
// =====================================================================

// ---------------------------------------------------------------------
//  Moduli 2 – Rregulli i masës (prurja)
// ---------------------------------------------------------------------
(function () {
  const XA = 60, XB = 940, YC = 300, X1 = 380, X2 = 560;
  regjistro({
    id: "vazhdueshmeria", nr: 2, grupi: "1. Ekuacioni i Bernulit",
    titulli: "Rregulli i masës (prurja)", titulliShkurt: "Rregulli i masës",
    nentitulli: "Sa më e ngushtë të jetë prerja e gypit, aq më shpejt lëviz fluidi nëpër të.",
    kontrollet: [
      { lloji: "rreshqites", id: "v1", etiketa: "Shpejtësia në pjesën e gjerë, v₁", min: 0.2, max: 3, hapi: 0.05, vlera: 1, njesia: "m/s", dhjetore: 2 },
      { lloji: "rreshqites", id: "d1", etiketa: "Diametri i pjesës së gjerë, d₁", min: 60, max: 200, hapi: 5, vlera: 150, njesia: "mm", dhjetore: 0 },
      { lloji: "rreshqites", id: "d2", etiketa: "Diametri i pjesës së ngushtë, d₂", min: 30, max: 200, hapi: 5, vlera: 75, njesia: "mm", dhjetore: 0 }
    ],
    shpjegimi: `
      <p>Gjatë rrjedhjes masa e fluidit nuk humbet dhe nuk krijohet. Prandaj në çdo sekondë nëpër secilën prerje të gypit kalon e njëjta sasi fluidi, të cilën e quajmë prurje dhe e shënojmë me Q. Prurja është e barabartë me sipërfaqen e prerjes shumëzuar me shpejtësinë e fluidit.</p>
      <p>Nëse gypi ngushtohet, i njëjti vëllim duhet të kalojë nëpër një hapësirë më të vogël, kështu që fluidi lëviz më shpejt. Këtë e kemi parë të gjithë kur e ngushtojmë me gisht zorrën e ujit dhe uji arrin më larg.</p>
      <p>Ky rregull na tregon si ndryshon shpejtësia, por jo edhe si ndryshon presioni. Për presionin na duhet ekuacioni i Bernulit, të cilin e nxjerrim në vazhdim.</p>`,
    formula: `Q = A · v &nbsp;&nbsp;&nbsp; A₁v₁ = A₂v₂`,
    fillo(p, K) { K.gj.gr = new Grimcat(150, XA, XB); },
    vizato(p, K) {
      const v1 = K.v("v1"), d1 = K.v("d1") / 1000, d2 = K.v("d2") / 1000;
      const A1 = Math.PI * d1 * d1 / 4, A2 = Math.PI * d2 * d2 / 4, Q = A1 * v1, v2 = Q / A2;
      const r1 = K.v("d1") * 0.55, r2 = K.v("d2") * 0.55;
      const s = (x) => { const t = kufizo((x - X1) / (X2 - X1), 0, 1); return 3 * t * t - 2 * t * t * t; };
      const rr = (x) => lerp(r1, r2, s(x));
      // gypi
      p.noStroke(); p.fill(NGJ.uji); p.beginShape();
      for (let x = XA; x <= XB; x += 5) p.vertex(x, YC - rr(x));
      for (let x = XB; x >= XA; x -= 5) p.vertex(x, YC + rr(x));
      p.endShape(p.CLOSE);
      // vëllimet e barabarta ΔV në 0,15 s
      const L1 = 85, L2 = L1 * A1 / A2;
      p.fill(42, 98, 168, 70); p.stroke(NGJ.p); p.strokeWeight(1.5);
      p.rect(130, YC - r1, L1, 2 * r1);
      const x2s = 575;
      if (L2 < XB - 580) p.rect(x2s, YC - r2, L2, 2 * r2);
      shkruaj(p, "ΔV", 130 + L1 / 2, YC + 7, { madhesia: 22, ngjyra: NGJ.p, rreshtim: p.CENTER, trash: true });
      if (L2 < XB - 580) shkruaj(p, "ΔV", x2s + L2 / 2, YC + 7, { madhesia: 22, ngjyra: NGJ.p, rreshtim: p.CENTER, trash: true });
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.beginShape(); for (let x = XA; x <= XB; x += 5) p.vertex(x, YC - rr(x)); p.endShape();
      p.beginShape(); for (let x = XA; x <= XB; x += 5) p.vertex(x, YC + rr(x)); p.endShape();
      // grimcat
      K.gj.gr.levize(K.dt, (x) => 60 * v1 * (r1 * r1) / (rr(x) * rr(x)));
      K.gj.gr.vizato(p, (x, f) => [x, YC + f * rr(x) * 0.85]);
      // shigjetat e shpejtësisë
      shigjeta(p, 150, YC - r1 - 30, 150 + 40 * v1, YC - r1 - 30, NGJ.v, 3, 12);
      shkruaj(p, "v₁ = " + fmt(v1, 2) + " m/s", 150, YC - r1 - 42, { madhesia: 20, ngjyra: NGJ.v });
      shigjeta(p, 650, YC - r2 - 30, 650 + Math.min(280, 40 * v2), YC - r2 - 30, NGJ.v, 3, 12);
      shkruaj(p, "v₂ = " + fmt(v2, 2) + " m/s", 650, YC - r2 - 42, { madhesia: 20, ngjyra: NGJ.v });
      shkruaj(p, "A₁ = " + fmt(A1 * 1e4, 1) + " cm²", 150, YC + r1 + 34, { madhesia: 18 });
      shkruaj(p, "A₂ = " + fmt(A2 * 1e4, 1) + " cm²", 650, YC + r2 + 34, { madhesia: 18 });
      shkruaj(p, "Q = A₁v₁ = A₂v₂ = " + fmt(Q * 1000, 2) + " L/s", 500, 520, { madhesia: 24, rreshtim: p.CENTER, trash: true });
      K.lexo(`
        <div class="rresht"><span>Prurja Q = A₁·v₁</span><b>${fmt(Q * 1000, 2)} L/s</b></div>
        <div class="rresht"><span>A₁ / A₂</span><b>${fmt(A1 / A2, 2)}</b></div>
        <div class="rresht"><span>v₂ = v₁·A₁/A₂</span><b>${fmt(v2, 2)} m/s</b></div>
        <div class="rresht"><span>Masa që kalon në 1 s (ujë)</span><b>${fmt(Q * 998.2, 2)} kg/s</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 9 – Krahu i aeroplanit
// ---------------------------------------------------------------------
(function () {
  const C = 470, OX = 250, OY = 300;
  function naca(t) { // kthen [yu, yl] për x në [0,1]
    const m = 0.04, pp = 0.4, th = 0.13;
    const yt = 5 * th * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1036 * t ** 4);
    const yc = t < pp ? m / (pp * pp) * (2 * pp * t - t * t) : m / ((1 - pp) ** 2) * ((1 - 2 * pp) + 2 * pp * t - t * t);
    return [yc + yt, yc - yt];
  }
  const RHO = { det: 1.225, m3000: 0.909, m10000: 0.413 };
  regjistro({
    id: "aeroplani", nr: 10, grupi: "2. Zbatimi i ekuacionit",
    titulli: "Krahu i aeroplanit", titulliShkurt: "Krahu i aeroplanit",
    nentitulli: "Ajri mbi krah lëviz më shpejt se ai nën krah, prandaj presioni sipër është më i vogël.",
    kontrollet: [
      { lloji: "rreshqites", id: "v", etiketa: "Shpejtësia e aeroplanit, v", min: 0, max: 90, hapi: 1, vlera: 55, njesia: "m/s", dhjetore: 0 },
      { lloji: "rreshqites", id: "a", etiketa: "Këndi i krahut ndaj rrymës, α", min: 0, max: 12, hapi: 0.5, vlera: 5, njesia: "°", dhjetore: 1 },
      { lloji: "rreshqites", id: "A", etiketa: "Sipërfaqja e krahëve, A<sub>k</sub>", min: 10, max: 30, hapi: 0.5, vlera: 16.2, njesia: "m²", dhjetore: 1 },
      { lloji: "zgjedh", id: "rho", etiketa: "Lartësia e fluturimit", vlera: "det", opsionet: [["det", "Niveli i detit – ρ = 1,225 kg/m³"], ["m3000", "3000 m – ρ = 0,909 kg/m³"], ["m10000", "10 000 m – ρ = 0,413 kg/m³"]] }
    ],
    shpjegimi: `
      <p>Krahu i aeroplanit ka profil të lakuar dhe vendoset me një kënd të vogël ndaj rrymës së ajrit. Për shkak të kësaj forme, ajri mbi krah lëviz më shpejt se ajri nën krah. Sipas ekuacionit të Bernulit, aty ku shpejtësia është më e madhe, presioni është më i vogël.</p>
      <p>Diferenca e presionit ndërmjet anës së poshtme dhe asaj të sipërme, e shumëzuar me sipërfaqen e krahëve, jep forcën ngritëse. Kjo forcë rritet me katrorin e shpejtësisë dhe zvogëlohet në lartësi të mëdha, ku ajri është më i rrallë.</p>
      <p>Bernuli e shpjegon vetëm një pjesë të forcës ngritëse; pjesa tjetër vjen nga devijimi i ajrit poshtë, sipas ligjit të tretë të Njutonit. Në simulim shpejtësitë mbi dhe nën krah janë vlerësuar në mënyrë të thjeshtuar.</p>`,
    formula: `Δp = ½ρ(vₛ² − vₚ²) &nbsp;&nbsp; F = Δp · A<sub>k</sub>`,
    fillo(p, K) { K.gj.gr = []; for (let i = 0; i < 70; i++) K.gj.gr.push({ x: Math.random() * 1000, k: Math.floor(Math.random() * 8) }); },
    vizato(p, K) {
      const v = K.v("v"), al = K.v("a") * Math.PI / 180, Ak = K.v("A"), rho = RHO[K.v("rho")] || 1.225;
      const ks = 0.05 + 0.9 * al, kp = 0.6 * al;             // vlerësim i thjeshtuar
      const vs = v * (1 + ks), vp = v * (1 - kp);
      const dp = 0.5 * rho * (vs * vs - vp * vp), F = dp * Ak;
      const G = 1100 * g;                                     // aeroplan i vogël ≈ 1100 kg
      // krahu
      const pts = [];
      for (let i = 0; i <= 60; i++) { const t = (1 - Math.cos(Math.PI * i / 60)) / 2; pts.push([t, naca(t)]); }
      const tr = (x, y) => [OX + C * (x * Math.cos(al) + y * Math.sin(al)), OY - C * (-x * Math.sin(al) + y * Math.cos(al))];   // hunda lart, bishti poshtë
      // vijat e rrjedhjes
      const lart = [64, 114, 164], posht = [82, 132, 182];
      const yS = (x, y0, sh) => {
        const m = OX + C * 0.35, b = Math.exp(-(((x - m) / 210) ** 2));
        const t = kufizo((x - (OX + C * 0.7)) / (C * 0.9), 0, 1), poshte = (3 * t * t - 2 * t * t * t) * (10 + 420 * al) / (1 + Math.abs(y0) / 90);   // ajri devijohet poshtë pas krahut
        return OY - y0 - sh * b * (60 + 600 * al) / (1 + Math.abs(y0) / 60) + poshte;
      };
      p.strokeWeight(1.6);
      p.stroke(NGJ.p); for (const y0 of lart) { p.noFill(); p.beginShape(); for (let x = 20; x <= 980; x += 10) p.vertex(x, yS(x, y0, 1)); p.endShape(); }
      p.stroke(NGJ.ujiErr); for (const y0 of posht) { p.noFill(); p.beginShape(); for (let x = 20; x <= 980; x += 10) p.vertex(x, yS(x, -y0, -0.25)); p.endShape(); }
      // grimcat: më shpejt sipër
      p.noStroke();
      for (const g0 of K.gj.gr) {
        const up = g0.k < 4, y0 = up ? lart[g0.k % 3] : -posht[g0.k % 3];
        const near = Math.exp(-(((g0.x - (OX + C * 0.35)) / 260) ** 2));
        const sp = 3 * v * (up ? 1 + ks * near * 1.4 : 1 - kp * near);
        g0.x += sp * K.dt; if (g0.x > 980) g0.x = 20;
        p.fill(up ? NGJ.p : NGJ.ujiErr); p.circle(g0.x, yS(g0.x, y0, up ? 1 : -0.25), 5);
      }
      // ngjyra e presionit
      p.noStroke(); p.fill(42, 98, 168, 40);
      p.beginShape(); for (const [t, [yu]] of pts) { const [x, y] = tr(t, yu); p.vertex(x, y - 6); } for (let i = pts.length - 1; i >= 0; i--) { const [x, y] = tr(pts[i][0], pts[i][1][0]); p.vertex(x, y - 60); } p.endShape(p.CLOSE);
      p.fill(179, 53, 43, 30);
      p.beginShape(); for (const [t, [, yl]] of pts) { const [x, y] = tr(t, yl); p.vertex(x, y + 6); } for (let i = pts.length - 1; i >= 0; i--) { const [x, y] = tr(pts[i][0], pts[i][1][1]); p.vertex(x, y + 50); } p.endShape(p.CLOSE);
      p.stroke(NGJ.boja); p.strokeWeight(2.5); p.fill("#dfe3e8");
      p.beginShape(); for (const [t, [yu]] of pts) p.vertex(...tr(t, yu)); for (let i = pts.length - 1; i >= 0; i--) p.vertex(...tr(pts[i][0], pts[i][1][1])); p.endShape(p.CLOSE);
      for (const xx of [0.25, 0.45, 0.65]) { const [x, y] = tr(xx, naca(xx)[0]); shkruaj(p, "−", x, y - 26, { madhesia: 28, ngjyra: NGJ.p, rreshtim: p.CENTER }); const [x2, y2] = tr(xx, naca(xx)[1]); shkruaj(p, "+", x2, y2 + 38, { madhesia: 24, ngjyra: NGJ.kuqe, rreshtim: p.CENTER }); }
      // forca
      const [fx, fy] = tr(0.33, naca(0.33)[0]);
      const Lf = Math.min(200, F / 150);
      if (Lf > 4) { shigjeta(p, fx, fy, fx, fy - Lf, NGJ.kuqe, 5, 18); shkruaj(p, "F = " + fmt(F / 1000, 1) + " kN", fx + 14, fy - Lf + 12, { madhesia: 22, ngjyra: NGJ.kuqe, trash: true }); }
      const Lg = Math.min(200, G / 150);
      const [gx, gy] = tr(0.33, naca(0.33)[1]);
      shigjeta(p, gx, gy + 4, gx, gy + 4 + Lg * 0.55, NGJ.boja2, 3, 12);
      shkruaj(p, "G ≈ " + fmt(G / 1000, 1) + " kN (1100 kg)", gx + 12, gy + 4 + Lg * 0.55, { madhesia: 17, ngjyra: NGJ.boja2, sfond: NGJ.letra });
      shkruaj(p, "Sipër krahut: vₛ = " + fmt(vs, 1) + " m/s, presion më i vogël", 980, 60, { madhesia: 18, ngjyra: NGJ.p, rreshtim: p.RIGHT });
      shkruaj(p, "Nën krah: vₚ = " + fmt(vp, 1) + " m/s, presion më i madh", 980, 520, { madhesia: 18, ngjyra: NGJ.ujiErr, rreshtim: p.RIGHT });
      const ngrihet = F >= G;
      shkruaj(p, ngrihet ? "Forca ngritëse e kalon peshën: aeroplani ngrihet" : "Forca ngritëse është më e vogël se pesha", 30, 520, { madhesia: 22, ngjyra: ngrihet ? "#2f7a3e" : NGJ.kuqe, trash: true });
      K.lexo(`
        <div class="rresht"><span>Shpejtësia mbi krah v<sub>s</sub></span><b>${fmt(vs, 1)} m/s</b></div>
        <div class="rresht"><span>Shpejtësia nën krah v<sub>p</sub></span><b>${fmt(vp, 1)} m/s</b></div>
        <div class="rresht"><span>Δp = ½ρ(v<sub>s</sub>² − v<sub>p</sub>²)</span><b>${fmt(dp, 0)} Pa</b></div>
        <div class="rresht"><span>Forca ngritëse F = Δp·A<sub>k</sub></span><b>${fmt(F / 1000, 2)} kN</b></div>
        <div class="rresht"><span>Pesha e aeroplanit (1100 kg)</span><b>${fmt(G / 1000, 2)} kN</b></div>
        <div class="rresht"><span>A ngrihet?</span><b class="${ngrihet ? "" : "kujdes"}">${ngrihet ? "Po" : "Jo"}</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 10 – Karburatori
// ---------------------------------------------------------------------
(function () {
  const YC = 200, XA = 30, XB = 860, X1 = 260, X2 = 400, X3 = 560, X4 = 700, PXCM = 22;
  const RHO_A = 1.2, RHO_B = 740;
  regjistro({
    id: "karburatori", nr: 11, grupi: "2. Zbatimi i ekuacionit",
    titulli: "Karburatori", titulliShkurt: "Karburatori",
    nentitulli: "Në ngushtimin e gypit ajri shpejton, presioni bie dhe benzina thithet në rrymën e ajrit.",
    kontrollet: [
      { lloji: "rreshqites", id: "v1", etiketa: "Shpejtësia e ajrit në hyrje (pedali i gazit), v₁", min: 0, max: 25, hapi: 0.5, vlera: 10, njesia: "m/s", dhjetore: 1 },
      { lloji: "rreshqites", id: "r", etiketa: "Raporti i prerjeve A₁/A₂", min: 1, max: 4, hapi: 0.1, vlera: 2.5, njesia: "", dhjetore: 1 },
      { lloji: "rreshqites", id: "h", etiketa: "Lartësia e fytit mbi benzinë, h", min: 1, max: 8, hapi: 0.1, vlera: 4, njesia: "cm", dhjetore: 1 }
    ],
    shpjegimi: `
      <p>Karburatori e përzien benzinën me ajrin para se përzierja të hyjë në motor. Ajri që thith motori kalon nëpër një gyp me një ngushtim në mes, i cili quhet fyt.</p>
      <p>Nga rregulli i masës, në fyt ajri lëviz më shpejt, ndërsa nga ekuacioni i Bernulit presioni aty bie. Fyti lidhet përmes një gypi të hollë me dhomën e benzinës, mbi të cilën vepron presioni atmosferik. Kur diferenca e presionit e mund peshën e shtyllës së benzinës, benzina ngjitet dhe shpërndahet në rrymën e ajrit.</p>
      <p>Kur shoferi shtyp pedalin e gazit, ajri rrjedh më shpejt, presioni në fyt bie edhe më shumë dhe në motor hyn më shumë benzinë.</p>`,
    formula: `v₂ = v₁A₁/A₂ &nbsp;&nbsp; p₂ = p₁ − ½ρₐ(v₂² − v₁²)`,
    fillo(p, K) { K.gj.gr = new Grimcat(110, XA, XB); K.gj.pika = []; K.gj.sh = 0; },
    vizato(p, K) {
      const v1 = K.v("v1"), r = K.v("r"), h = K.v("h") / 100;
      const v2 = v1 * r, dp = 0.5 * RHO_A * (v2 * v2 - v1 * v1), hmax = dp / (RHO_B * g), ok = hmax > h;
      const R1 = 90, R2 = R1 / Math.sqrt(r);
      const s = (x) => { const a = kufizo((x - X1) / (X2 - X1), 0, 1), b = kufizo((x - X3) / (X4 - X3), 0, 1); return (3 * a * a - 2 * a ** 3) - (3 * b * b - 2 * b ** 3); };
      const rr = (x) => lerp(R1, R2, s(x));
      p.noStroke(); p.fill("#eef3f8"); p.beginShape();
      for (let x = XA; x <= XB; x += 5) p.vertex(x, YC - rr(x)); for (let x = XB; x >= XA; x -= 5) p.vertex(x, YC + rr(x)); p.endShape(p.CLOSE);
      K.gj.gr.levize(K.dt, (x) => 25 * v1 * (R1 * R1) / (rr(x) * rr(x)));
      K.gj.gr.vizato(p, (x, f) => [x, YC + f * rr(x) * 0.85], NGJ.ujiErr);
      p.stroke(NGJ.boja); p.strokeWeight(3); p.noFill();
      p.beginShape(); for (let x = XA; x <= XB; x += 5) p.vertex(x, YC - rr(x)); p.endShape();
      p.beginShape(); for (let x = XA; x <= XB; x += 5) p.vertex(x, YC + rr(x)); p.endShape();
      // valvula
      p.strokeWeight(5); p.line(780, YC - 50, 820, YC + 50); p.noStroke(); p.fill(NGJ.boja); p.circle(800, YC, 10);
      shkruaj(p, "valvula e gazit", 800, YC - R1 - 14, { madhesia: 16, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      shkruaj(p, "drejt motorit", 870, YC + 6, { madhesia: 16, ngjyra: NGJ.boja2 });
      // dhoma e benzinës
      const xm = (X2 + X3) / 2, yLvl = YC + R2 + h * 100 * PXCM;
      const bx0 = 560, bx1 = 760, by1 = Math.min(548, yLvl + 70);
      p.noStroke(); p.fill("#ecd28a"); p.rect(bx0, yLvl, bx1 - bx0, by1 - yLvl);
      p.stroke(NGJ.boja); p.strokeWeight(2.5); p.noFill(); p.rect(bx0, yLvl - 40, bx1 - bx0, by1 - yLvl + 40);
      p.fill("#cfd4dc"); p.strokeWeight(1.5); p.rect(680, yLvl - 12, 50, 24); shkruaj(p, "pluskuesi", 705, yLvl + 40, { madhesia: 14, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      shigjeta(p, 600, yLvl - 34, 600, yLvl - 4, NGJ.p, 2, 9); shkruaj(p, "pₐ", 608, yLvl - 16, { madhesia: 18, ngjyra: NGJ.p });
      // gypi i benzinës
      const yJet = YC + R2;
      p.stroke(NGJ.boja); p.strokeWeight(9); p.noFill(); p.beginShape(); p.vertex(xm, yJet); p.vertex(xm, by1 - 15); p.vertex(bx0 + 30, by1 - 15); p.endShape();
      p.stroke("#f4f6f9"); p.strokeWeight(5); p.beginShape(); p.vertex(xm, yJet); p.vertex(xm, by1 - 15); p.vertex(bx0 + 30, by1 - 15); p.endShape();
      K.gj.sh += (Math.min(hmax, h) - K.gj.sh) * Math.min(1, K.dt * 5);
      p.stroke("#d9a92b"); p.strokeWeight(5);
      p.line(bx0 + 30, by1 - 15, xm, by1 - 15); p.line(xm, by1 - 15, xm, yLvl);
      if (K.gj.sh > 0.0005) p.line(xm, yLvl, xm, Math.max(yJet, yLvl - K.gj.sh * 100 * PXCM));
      // pikat
      if (ok && K.gj.sh > h * 0.97) for (let i = 0; i < 3; i++) K.gj.pika.push({ x: xm, y: yJet - 2, vx: 25 * v2 * (0.5 + Math.random()), vy: -20 - 40 * Math.random(), j: 0 });
      p.noStroke(); p.fill("#d39b2a");
      for (const d of K.gj.pika) { d.x += d.vx * K.dt; d.y += d.vy * K.dt; d.vy += 60 * K.dt; d.j += K.dt; p.circle(d.x, Math.min(d.y, YC + R1 - 4), 4); }
      K.gj.pika = K.gj.pika.filter((d) => d.j < 1.2 && d.x < 850);
      // kuota h
      p.stroke(NGJ.boja2); p.strokeWeight(1); vijeNderprere(p, xm - 120, yLvl, bx0, yLvl, 4, 4);
      kuota(p, xm - 100, yJet, xm - 100, yLvl, "h", NGJ.z, "majtas");
      shkruaj(p, "1", 140, YC - R1 - 12, { madhesia: 20, ngjyra: NGJ.kuqe, trash: true });
      shkruaj(p, "2 (fyti)", xm, YC - R2 - 12, { madhesia: 20, ngjyra: NGJ.kuqe, rreshtim: p.CENTER, trash: true });
      // paneli
      const bx = 30, by = 330;
      p.stroke(NGJ.boja); p.strokeWeight(1.2); p.fill(NGJ.letra); p.rect(bx, by, 330, 200, 6);
      let yy = by + 32;
      const rr2 = (t, c) => { shkruaj(p, t, bx + 14, yy, { madhesia: 19, ngjyra: c || NGJ.boja }); yy += 32; };
      rr2("v₂ = v₁·{A₁|A₂} = " + fmt(v2, 1) + " m/s", NGJ.v);
      rr2("pₐ − p₂ = " + fmt(dp, 0) + " Pa", NGJ.p);
      rr2("ρ·g·h (benzina) = " + fmt(RHO_B * g * h, 0) + " Pa");
      rr2("hₘₐₓ = " + fmt(hmax * 100, 1) + " cm");
      shkruaj(p, ok ? "Benzina hyn në rrymën e ajrit" : "Benzina nuk arrin deri në fyt", bx + 14, yy + 4, { madhesia: 21, ngjyra: ok ? "#2f7a3e" : NGJ.kuqe, trash: true });
      K.lexo(`
        <div class="rresht"><span>Shpejtësia në fyt v₂</span><b>${fmt(v2, 1)} m/s</b></div>
        <div class="rresht"><span>Rënia e presionit pₐ − p₂</span><b>${fmt(dp, 0)} Pa</b></div>
        <div class="rresht"><span>Pesha e shtyllës së benzinës ρ<sub>b</sub>gh</span><b>${fmt(RHO_B * g * h, 0)} Pa</b></div>
        <div class="rresht"><span>Shpejtësia minimale e ajrit</span><b>${fmt(Math.sqrt(2 * RHO_B * g * h / (RHO_A * (r * r - 1 || 1e-9))), 1)} m/s</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 12 – Presioni absolut, manometrik dhe vakuumi
// ---------------------------------------------------------------------
(function () {
  const PA = { det: 101.325, m1000: 89.9, m2000: 79.5 };
  regjistro({
    id: "presionet", nr: 13, grupi: "3. Matja e presionit",
    titulli: "Presioni absolut, manometrik dhe vakuumi", titulliShkurt: "Presioni absolut dhe manometrik",
    nentitulli: "I njëjti presion lexohet ndryshe, varësisht se nga cili nivel e matim.",
    kontrollet: [
      { lloji: "rreshqites", id: "pabs", etiketa: "Presioni absolut i matur, p<sub>abs</sub>", min: 0, max: 400, hapi: 1, vlera: 321, njesia: "kPa", dhjetore: 0 },
      { lloji: "zgjedh", id: "pa", etiketa: "Vendi (presioni atmosferik)", vlera: "det", opsionet: [["det", "Niveli i detit – 101,3 kPa"], ["m1000", "1000 m mbi det – 89,9 kPa"], ["m2000", "2000 m mbi det – 79,5 kPa"]] }
    ],
    shpjegimi: `
      <p>Presionin mund ta matim duke u nisur nga vakuumi absolut, ku presioni është zero, ose nga presioni atmosferik. Në rastin e parë flasim për presion absolut. Kur presioni është më i madh se ai atmosferik, diferenca quhet mbipresion ose presion manometrik, ndërsa kur është më i vogël, flasim për nënpresion ose vakuum.</p>
      <p>Pothuajse të gjithë manometrat matin mbipresionin. Kur themi se goma e veturës ka 2,2 bar, kjo është vlera mbi atmosferën, ndërsa presioni absolut në gomë është rreth 3,2 bar. Presioni atmosferik zvogëlohet me lartësinë mbi det, prandaj i njëjti presion absolut jep lexime të ndryshme në vende të ndryshme.</p>`,
    formula: `pₘ = p<sub>abs</sub> − pₐ &nbsp;&nbsp; p<sub>v</sub> = pₐ − p<sub>abs</sub>`,
    vizato(p, K) {
      const pabs = K.v("pabs"), pa = PA[K.v("pa")] || 101.325;
      const Y0 = 500, SC = 1.05, yp = (v) => Y0 - v * SC, X = 300;
      // boshti
      toka(p, 120, 560, Y0);
      shkruaj(p, "p = 0 (vakuum absolut)", 570, Y0 + 6, { madhesia: 18 });
      p.stroke(NGJ.p); p.strokeWeight(2); vijeNderprere(p, 120, yp(pa), 560, yp(pa), 10, 6);
      shkruaj(p, "pₐ = " + fmt(pa, 1) + " kPa (atmosfera)", 570, yp(pa) + 6, { madhesia: 18, ngjyra: NGJ.p });
      // shtylla absolute
      shigjeta(p, X, Y0, X, yp(pabs), NGJ.boja, 3, 14);
      shkruaj(p, "p abs = " + fmt(pabs, 0) + " kPa", X - 16, (Y0 + yp(pabs)) / 2, { madhesia: 20, rreshtim: p.RIGHT, trash: true });
      p.noStroke(); p.fill(NGJ.kuqe); p.circle(X, yp(pabs), 14);
      const pm = pabs - pa;
      if (pm >= 0) {
        shigjeta(p, X + 60, yp(pa), X + 60, yp(pabs), NGJ.kuqe, 3, 12);
        shkruaj(p, "pₘ = " + fmt(pm, 1) + " kPa", X + 76, (yp(pa) + yp(pabs)) / 2 + 6, { madhesia: 20, ngjyra: NGJ.kuqe, trash: true });
        shkruaj(p, "mbipresion", X + 76, (yp(pa) + yp(pabs)) / 2 + 28, { madhesia: 16, ngjyra: NGJ.kuqe });
      } else {
        shigjeta(p, X + 60, yp(pa), X + 60, yp(pabs), NGJ.p, 3, 12);
        shkruaj(p, "pᵥ = " + fmt(-pm, 1) + " kPa", X + 76, (yp(pa) + yp(pabs)) / 2 + 6, { madhesia: 20, ngjyra: NGJ.p, trash: true });
        shkruaj(p, "nënpresion (vakuum)", X + 76, (yp(pa) + yp(pabs)) / 2 + 28, { madhesia: 16, ngjyra: NGJ.p });
      }
      // manometri dhe vakuummetri
      manometerBourdon(p, 820, 170, 80, Math.max(0, pm), 300, "kPa", "manometri: " + fmt(Math.max(0, pm), 0) + " kPa");
      shkruaj(p, pm >= 0 ? "(mat mbipresionin)" : "(manometri tregon 0 – duhet vakuummetër)", 820, 300, { madhesia: 15, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      shkruaj(p, "në bar: " + fmt(pm / 100, 2) + " bar mbi atmosferën", 820, 340, { madhesia: 17, rreshtim: p.CENTER });
      K.lexo(`
        <div class="rresht"><span>Presioni absolut p<sub>abs</sub></span><b>${fmt(pabs, 1)} kPa</b></div>
        <div class="rresht"><span>Presioni atmosferik pₐ</span><b>${fmt(pa, 1)} kPa</b></div>
        <div class="rresht"><span>${pm >= 0 ? "Mbipresioni pₘ = p<sub>abs</sub> − pₐ" : "Nënpresioni p<sub>v</sub> = pₐ − p<sub>abs</sub>"}</span><b>${fmt(Math.abs(pm), 1)} kPa = ${fmt(Math.abs(pm) / 100, 3)} bar</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 13 – Manometri: piezometri, manometri U dhe diferenciali
// ---------------------------------------------------------------------
(function () {
  const LM = { uji: ["Ujë", 998.2], merkur: ["Mërkur", 13546] };
  regjistro({
    id: "manometri", nr: 14, grupi: "3. Matja e presionit",
    titulli: "Matja e presionit me manometër", titulliShkurt: "Manometri",
    nentitulli: "Diferenca e presionit lexohet si diferencë e lartësisë së një shtylle lëngu.",
    kontrollet: [
      { lloji: "zgjedh", id: "lloji", etiketa: "Lloji i manometrit", vlera: "U", opsionet: [["piezo", "Piezometri (ujë në enë)"], ["U", "Manometri U – gaz, krahu tjetër i hapur"], ["dif", "Manometri diferencial – ujë në gyp"]] },
      { lloji: "rreshqites", id: "dp", etiketa: "Presioni ose diferenca e presionit, Δp", min: 0, max: 30, hapi: 0.1, vlera: 1.2, njesia: "kPa", dhjetore: 1 },
      { lloji: "zgjedh", id: "lm", etiketa: "Lëngu manometrik", vlera: "uji", opsionet: [["uji", "Ujë – 998 kg/m³"], ["merkur", "Mërkur – 13 546 kg/m³"]] }
    ],
    shpjegimi: `
      <p>Manometri në formë U është një gyp i tejdukshëm me lëng me dendësi të njohur, zakonisht ujë ose mërkur. Kur presionet në dy krahët nuk janë të barabarta, lëngu zhvendoset derisa pesha e shtyllës me lartësi Δh ta baraspeshojë diferencën e presionit.</p>
      <p>Rasti më i thjeshtë është piezometri, një gyp i hapur ku lëngu ngjitet deri në lartësinë h = p/ρg. Për presione më të mëdha përdoret mërkuri, i cili është rreth 13,6 herë më i rëndë se uji. Manometri diferencial lidhet në dy pika të një gypi dhe tregon sa bie presioni ndërmjet tyre, për shembull para dhe pas një filtri.</p>
      <p>Leximi bëhet gjithmonë si diferencë vertikale e niveleve. Për shembull, kur uji në manometër zhvendoset për 12 cm, mbipresioni është rreth 1,18 kPa.</p>`,
    formula: `pₘ = ρₘgΔh &nbsp;&nbsp; Δp = (ρₘ − ρ<sub>f</sub>)gΔh`,
    vizato(p, K) {
      const lloji = K.v("lloji"), dp = K.v("dp") * 1000, [emri, rm] = LM[K.v("lm")] || LM.uji, rf = 998.2;
      let dh;
      if (lloji === "piezo") dh = dp / (rf * g);
      else if (lloji === "U") dh = dp / (rm * g);
      else dh = rm > rf + 1 ? dp / ((rm - rf) * g) : NaN;
      const maxPx = 380, sc = isFinite(dh) ? Math.min(400, maxPx / Math.max(dh, 0.4)) : 0;   // px për m
      const Ybaze = 470, dhPx = isFinite(dh) ? Math.min(maxPx, dh * sc) : 0;
      const ngjLM = K.v("lm") === "merkur" ? NGJ.merkur : NGJ.uji;
      if (lloji === "piezo") {
        // enë me ujë nën presion dhe piezometër
        p.stroke(NGJ.boja); p.strokeWeight(3); p.fill(NGJ.uji); p.rect(120, 360, 300, 140, 6);
        shkruaj(p, "ujë nën presion pₘ", 270, 440, { madhesia: 20, rreshtim: p.CENTER });
        const top = 360 - dhPx;
        p.noStroke(); p.fill(NGJ.uji); p.rect(350, Math.min(360, top), 22, 360 - Math.min(360, top));
        p.stroke(NGJ.boja); p.strokeWeight(2); p.line(348, 40, 348, 360); p.line(374, 40, 374, 360);
        kuota(p, 420, 360, 420, top, "h = " + fmt(dh * 100, 1) + " cm", NGJ.kuqe);
        shkruaj(p, "piezometri", 361, 30, { madhesia: 17, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      } else {
        const xl = 360, xr = 560, w = 26, yb = 500, y0 = 330;
        const hl = y0 + dhPx / 2, hr = y0 - dhPx / 2;
        // lëngu manometrik
        p.noStroke(); p.fill(ngjLM);
        p.rect(xl - w / 2, hl, w, yb - hl); p.rect(xr - w / 2, hr, w, yb - hr); p.rect(xl - w / 2, yb - 4, xr - xl + w, 26);
        if (lloji === "dif") { p.fill(NGJ.uji); p.rect(xl - w / 2, 120, w, hl - 120); p.rect(xr - w / 2, 120, w, hr - 120); }
        p.stroke(NGJ.boja); p.strokeWeight(2.5); p.noFill();
        p.line(xl - w / 2, 120, xl - w / 2, yb + 22); p.line(xl + w / 2, 120, xl + w / 2, yb - 4);
        p.line(xr - w / 2, 60, xr - w / 2, yb - 4); p.line(xr + w / 2, 60, xr + w / 2, yb + 22);
        p.line(xl + w / 2, yb - 4, xr - w / 2, yb - 4); p.line(xl - w / 2, yb + 22, xr + w / 2, yb + 22);
        if (lloji === "U") {
          p.fill("#eef3f8"); p.stroke(NGJ.boja); p.strokeWeight(3); p.rect(60, 60, 220, 160, 8);
          shkruaj(p, "gaz", 170, 130, { madhesia: 22, ngjyra: NGJ.boja2, rreshtim: p.CENTER }); shkruaj(p, "p = pₐ + pₘ", 170, 165, { madhesia: 20, ngjyra: NGJ.p, rreshtim: p.CENTER });
          p.strokeWeight(2.5); p.line(280, 110, xl - w / 2, 110); p.line(280, 136, xl + w / 2, 136); p.line(xl - w / 2, 110, xl - w / 2, 120); p.line(xl + w / 2, 136, xl + w / 2, 120);
          shigjeta(p, xr, 10, xr, 52, NGJ.p, 2.5, 12); shkruaj(p, "pₐ", xr + 14, 36, { madhesia: 20, ngjyra: NGJ.p });
        } else {
          p.noStroke(); p.fill(NGJ.uji); p.rect(40, 70, 900, 50);
          p.stroke(NGJ.boja); p.strokeWeight(3); p.line(40, 70, 400, 70); p.line(40, 120, 400, 120); p.line(520, 70, 940, 70); p.line(520, 120, 940, 120);
          p.fill("#d9dde3"); p.rect(400, 50, 120, 90, 6); shkruaj(p, "filtër", 460, 102, { madhesia: 18, rreshtim: p.CENTER });
          p.noStroke(); p.fill(NGJ.uji); p.rect(xr - w / 2 + 1, 100, w - 2, 30); p.rect(xl - w / 2 + 1, 100, w - 2, 30);
          shkruaj(p, "1 (p₁)", xl, 40, { madhesia: 20, ngjyra: NGJ.kuqe, rreshtim: p.CENTER, trash: true });
          shkruaj(p, "2 (p₂)", xr, 40, { madhesia: 20, ngjyra: NGJ.kuqe, rreshtim: p.CENTER, trash: true });
          shigjeta(p, 60, 95, 140, 95, NGJ.boja2, 2, 10);
        }
        p.stroke(NGJ.boja2); p.strokeWeight(1); vijeNderprere(p, xl - 50, hl, xr + 120, hl, 6, 4); vijeNderprere(p, xr - 50, hr, xr + 120, hr, 6, 4);
        if (dhPx > 4) kuota(p, xr + 100, hl, xr + 100, hr, "Δh = " + (isFinite(dh) ? fmt(dh * 100, 1) + " cm" : "–"), NGJ.kuqe);
        shkruaj(p, "lëngu manometrik: " + emri, (xl + xr) / 2, yb + 50, { madhesia: 17, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      }
      const f = lloji === "piezo" ? "h = {pₘ|ρg}" : lloji === "U" ? "pₘ = ρₘ g Δh" : "Δp = (ρₘ − ρ) g Δh";
      shkruaj(p, f, 760, 470, { madhesia: 26, rreshtim: p.CENTER, trash: true });
      if (lloji === "dif" && K.v("lm") === "uji") shkruaj(p, "Me ujë në të dy anët Δh nuk krijohet – zgjidhni mërkurin", 760, 520, { madhesia: 15, ngjyra: NGJ.kuqe, rreshtim: p.CENTER });
      K.lexo(`
        <div class="rresht"><span>Presioni / diferenca</span><b>${fmt(dp, 0)} Pa</b></div>
        <div class="rresht"><span>Lëngu manometrik</span><b>${lloji === "piezo" ? "ujë (vetë lëngu)" : emri}</b></div>
        <div class="rresht"><span>${lloji === "piezo" ? "Lartësia në piezometër h" : "Diferenca e niveleve Δh"}</span><b>${isFinite(dh) ? fmt(dh * 100, 2) + " cm" : "–"}</b></div>
        <div class="rresht"><span>Presioni absolut (për pₐ = 101,3 kPa)</span><b>${lloji === "dif" ? "–" : fmt(101.325 + dp / 1000, 2) + " kPa"}</b></div>`);
    }
  });
})();

// ---------------------------------------------------------------------
//  Moduli 14 – Tubi Pitot-statik
// ---------------------------------------------------------------------
(function () {
  const FL = { ajer: ["Ajër", 1.2], uji: ["Ujë", 998.2] };
  const LM = { uji: ["Ujë", 998.2], merkur: ["Mërkur", 13546] };
  regjistro({
    id: "pitot", nr: 15, grupi: "3. Matja e presionit",
    titulli: "Tubi Pitot-statik", titulliShkurt: "Tubi Pitot",
    nentitulli: "Nga diferenca ndërmjet presionit total dhe atij statik llogaritet shpejtësia e rrjedhës.",
    kontrollet: [
      { lloji: "rreshqites", id: "v", etiketa: "Shpejtësia e rrjedhës, v", min: 0, max: 40, hapi: 0.2, vlera: 20.2, njesia: "m/s", dhjetore: 1 },
      { lloji: "zgjedh", id: "fl", etiketa: "Fluidi që rrjedh", vlera: "ajer", opsionet: [["ajer", "Ajër – 1,2 kg/m³"], ["uji", "Ujë – 998 kg/m³"]] },
      { lloji: "zgjedh", id: "lm", etiketa: "Lëngu në manometër", vlera: "uji", opsionet: [["uji", "Ujë – 998 kg/m³"], ["merkur", "Mërkur – 13 546 kg/m³"]] }
    ],
    shpjegimi: `
      <p>Tubi Pitot vendoset me hapjen kundër rrymës. Në majë të tij fluidi ndalet plotësisht, prandaj aty matet presioni total. Vrimat anësore të sondës janë paralele me rrjedhën dhe matin presionin statik.</p>
      <p>Sipas ekuacionit të Bernulit, presioni total është i barabartë me presionin statik plus presionin dinamik ½ρv². Kur këtë diferencë e matim me një manometër, mund ta llogaritim shpejtësinë e rrjedhës. Për shembull, një diferencë prej 2,5 cm ujë në një kanal ajri tregon shpejtësi rreth 20 m/s, ose 73 km/h.</p>
      <p>Në këtë mënyrë e mat shpejtësinë edhe aeroplani, ndërsa në laboratorë tubi Pitot përdoret në tunelet e erës dhe në kanalet e ventilimit.</p>`,
    formula: `pₜ = pₛ + ½ρv² &nbsp;&nbsp; v = √(2(pₜ − pₛ)/ρ)`,
    fillo(p, K) { K.gj.gr = new Grimcat(90, 40, 960); },
    vizato(p, K) {
      const v = K.v("v"), [fe, rho] = FL[K.v("fl")] || FL.ajer, [le, rm] = LM[K.v("lm")] || LM.uji;
      const pd = 0.5 * rho * v * v, ok = rm > rho + 1, dh = ok ? pd / ((rm - rho) * g) : NaN;
      const YC = 150, R = 80;
      p.noStroke(); p.fill(K.v("fl") === "uji" ? NGJ.uji : "#eef3f8"); p.rect(40, YC - R, 920, 2 * R);
      K.gj.gr.levize(K.dt, () => 12 * v + 2);
      K.gj.gr.vizato(p, (x, f) => [x, YC + f * R * 0.85], NGJ.ujiErr);
      p.stroke(NGJ.boja); p.strokeWeight(3); p.line(40, YC - R, 960, YC - R); p.line(40, YC + R, 960, YC + R);
      // sonda
      const nx = 300, L = 280;
      p.fill("#cfd4dc"); p.strokeWeight(2); p.rect(nx, YC - 12, L, 24, 12);
      p.noStroke(); p.fill(NGJ.kuqe); p.circle(nx, YC, 9);
      p.fill(NGJ.boja); for (const xx of [nx + 110, nx + 135]) { p.circle(xx, YC - 12, 6); p.circle(xx, YC + 12, 6); }
      shkruaj(p, "hapja ballore (pₜ)", nx - 10, YC - 30, { madhesia: 16, ngjyra: NGJ.v, rreshtim: p.RIGHT });
      shkruaj(p, "vrimat anësore (pₛ)", nx + 125, YC - 30, { madhesia: 16, ngjyra: NGJ.p, rreshtim: p.CENTER });
      shkruaj(p, "rryma: " + fe + ", v = " + fmt(v, 1) + " m/s", 60, YC + R + 30, { madhesia: 18, ngjyra: NGJ.boja2 });
      // gypat te manometri
      const x1 = 680, x2 = 800, w = 24, yb = 520, y0 = 410;
      const sc = isFinite(dh) ? Math.min(2000, 150 / Math.max(dh, 0.02)) : 0, dhPx = isFinite(dh) ? Math.min(150, dh * sc) : 0;
      const hl = y0 + dhPx / 2, hr = y0 - dhPx / 2;
      p.noFill(); p.strokeWeight(3);
      p.stroke(NGJ.v); p.line(nx + L - 10, YC + 12, nx + L - 10, 270); p.line(nx + L - 10, 270, x1, 270); p.line(x1, 270, x1, 300);
      p.stroke(NGJ.p); p.line(nx + L + 6, YC + 12, nx + L + 6, 250); p.line(nx + L + 6, 250, x2, 250); p.line(x2, 250, x2, 300);
      p.noStroke(); p.fill(K.v("lm") === "merkur" ? NGJ.merkur : NGJ.uji);
      p.rect(x1 - w / 2, hl, w, yb - hl); p.rect(x2 - w / 2, hr, w, yb - hr); p.rect(x1 - w / 2, yb - 4, x2 - x1 + w, 24);
      p.stroke(NGJ.boja); p.strokeWeight(2.5); p.noFill();
      p.line(x1 - w / 2, 300, x1 - w / 2, yb + 20); p.line(x1 + w / 2, 300, x1 + w / 2, yb - 4);
      p.line(x2 - w / 2, 300, x2 - w / 2, yb - 4); p.line(x2 + w / 2, 300, x2 + w / 2, yb + 20);
      p.line(x1 + w / 2, yb - 4, x2 - w / 2, yb - 4); p.line(x1 - w / 2, yb + 20, x2 + w / 2, yb + 20);
      shkruaj(p, "pₜ", x1 - 22, 300, { madhesia: 20, ngjyra: NGJ.v, rreshtim: p.RIGHT }); shkruaj(p, "pₛ", x2 + 22, 300, { madhesia: 20, ngjyra: NGJ.p });
      p.stroke(NGJ.boja2); p.strokeWeight(1); vijeNderprere(p, x1 - 40, hl, x2 + 110, hl, 6, 4); vijeNderprere(p, x2 - 40, hr, x2 + 110, hr, 6, 4);
      if (dhPx > 4) kuota(p, x2 + 90, hl, x2 + 90, hr, "Δh", NGJ.kuqe);
      shkruaj(p, "manometër me " + le.toLowerCase(), (x1 + x2) / 2, yb + 48, { madhesia: 16, ngjyra: NGJ.boja2, rreshtim: p.CENTER });
      // paneli
      const bx = 40, by = 290;
      p.stroke(NGJ.boja); p.strokeWeight(1.2); p.fill(NGJ.letra); p.rect(bx, by, 520, 230, 6);
      let yy = by + 36;
      const r = (t, c, m) => { shkruaj(p, t, bx + 16, yy, { madhesia: m || 20, ngjyra: c || NGJ.boja }); yy += 38; };
      r("pₜ − pₛ = ½ρv² = " + fmt(pd, pd < 1000 ? 1 : 0) + " Pa", NGJ.p);
      r("Δh = {pₜ − pₛ|(ρₘ − ρ)g} = " + (isFinite(dh) ? fmt(dh * 1000, 1) + " mm" : "–"), NGJ.kuqe);
      r("v = √{2(ρₘ − ρ)gΔh|ρ} = " + fmt(v, 1) + " m/s", NGJ.v);
      r("(" + fmt(v * 3.6, 1) + " km/h)", NGJ.boja2, 17);
      if (!ok) r("Lëngu manometrik duhet të jetë më i rëndë se fluidi!", NGJ.kuqe, 17);
      K.lexo(`
        <div class="rresht"><span>Presioni dinamik ½ρv²</span><b>${fmt(pd, 1)} Pa</b></div>
        <div class="rresht"><span>Leximi i manometrit Δh</span><b>${isFinite(dh) ? fmt(dh * 1000, 1) + " mm" : "–"}</b></div>
        <div class="rresht"><span>Shpejtësia</span><b>${fmt(v, 1)} m/s = ${fmt(v * 3.6, 1)} km/h</b></div>`);
    }
  });
})();

// Stili i prezantimit (vendoset nga programi, që të punojë edhe pa style.css)
const STILI = "/* Prezantimi \"Ekuacioni i energjisë\" – tema e Universitetit të Prishtinës\n   Ngjyrat e logos: e kuqe #cd2e31, e zezë #1f1a17, hiri. Sllajde 16:9 (1280 × 720). */\n:root {\n  --kuqe-up: #cd2e31; --kuqe-err: #a8232a; --zeza: #1f1a17; --hiri: #5f5a58; --hiri-2: #938d8a;\n  --sfondi: #e9e6e4; --karta: #ffffff; --kufiri: #e3dfdd; --vija: #ebe7e5; --zbehte: #f7f5f4;\n  --kuqe: #c0392b; --gjelber: #2f7a3e; --z: #8a6a34; --p: #1f5fae; --v: #d4691e;\n  --tekst: \"Source Sans 3\", \"Segoe UI\", Arial, sans-serif;\n  --math: \"Cambria Math\", Cambria, \"Times New Roman\", serif;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; height: 100%; }\nbody { background: #2a2523; color: var(--zeza); font-family: var(--tekst); overflow: hidden; -webkit-font-smoothing: antialiased; }\n.logo-up { background: url(\"data:image/png;base64,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\") center / contain no-repeat; background-color: #fff; border-radius: 50%; }\nbutton { font: inherit; cursor: pointer; }\n\n/* ---------- skena dhe sllajdi ---------- */\n.skena { position: fixed; inset: 0 0 52px 0; display: grid; place-items: center; overflow: hidden; }\n.sllajd {\n  width: 1280px; height: 720px; flex-shrink: 0;\n  background: var(--karta); position: relative; overflow: hidden;\n  box-shadow: 0 20px 60px rgba(0,0,0,.45);\n  transform-origin: center center;\n  display: flex; flex-direction: column;\n  font-size: 20px; line-height: 1.45;\n}\n.sllajd.hyr { animation: hyr .35s ease; }\n@keyframes hyr { from { opacity: 0; } to { opacity: 1; } }\n\n.sl-koka { height: 64px; flex-shrink: 0; display: flex; align-items: center; gap: 14px; padding: 0 40px; border-bottom: 1px solid var(--vija); }\n.sl-koka .logo-up { width: 40px; height: 40px; box-shadow: 0 0 0 2px var(--kuqe-up); }\n.sl-koka .uni { font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: var(--hiri); line-height: 1.3; }\n.sl-koka .uni b { color: var(--zeza); letter-spacing: .06em; }\n.sl-koka .grupi { margin-left: auto; font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--kuqe-up); }\n.sl-trupi { flex: 1; min-height: 0; padding: 26px 40px 18px; position: relative; overflow: auto; }\n.sl-fund { height: 40px; flex-shrink: 0; display: flex; align-items: center; gap: 16px; padding: 0 40px; font-size: 13px; color: var(--hiri-2); border-top: 1px solid var(--vija); }\n.sl-fund .nr { margin-left: auto; font-weight: 700; color: var(--zeza); font-variant-numeric: tabular-nums; }\n.sllajd::before { content: \"\"; position: absolute; left: 0; top: 0; bottom: 0; width: 8px; background: var(--kuqe-up); }\n\n/* titujt */\n.vetulla { margin: 0 0 6px; font-size: 16px; font-weight: 600; color: var(--kuqe-up); }\n.vetulla .nr-m { background: var(--zeza); color: #fff; border-radius: 5px; padding: 1px 8px; }\n.sl-titulli { margin: 0; font-size: 40px; font-weight: 800; line-height: 1.08; letter-spacing: -.01em; }\n.sl-titulli::after { content: \"\"; display: block; width: 72px; height: 5px; background: var(--kuqe-up); border-radius: 3px; margin-top: 12px; }\n.sl-nen { margin: 10px 0 0; color: var(--hiri); font-size: 19px; }\n.ref { display: inline-block; font-size: 14px; font-weight: 700; border: 1px solid var(--kufiri); border-radius: 999px; padding: 3px 12px; color: var(--zeza); background: var(--zbehte); }\n\n/* ---------- sllajdi i shpjegimit ---------- */\n.shp { display: grid; grid-template-columns: 1.35fr 1fr; gap: 40px; height: 100%; }\n.shp-majtas { min-height: 0; display: flex; flex-direction: column; }\n.shp-teksti { margin-top: 16px; font-size: 18.5px; }\n.shp-teksti p { margin: 0 0 12px; }\n.shp-teksti ul { margin: 0 0 12px; padding-left: 22px; }\n.shp-teksti li { margin-bottom: 8px; }\n.shp-teksti li::marker { color: var(--kuqe-up); }\n.shp-djathtas { display: flex; flex-direction: column; gap: 18px; justify-content: center; }\n.kutia-formula { background: var(--zeza); color: #fff; border-radius: 14px; padding: 26px 26px 20px; }\n.kutia-formula h4 { margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #e2a3a5; }\n.kutia-formula .formula { font-family: var(--math); font-size: 25px; line-height: 1.6; }\n.kutia-formula .formula small { display: block; font-family: var(--tekst); font-size: 14px; color: #b5aeab; margin-top: 10px; }\n.kutia-formula .formula .z, .kutia-formula .formula .p, .kutia-formula .formula .v { color: #fff; }\n.drejt-modulit { font-size: 16px; color: var(--hiri); display: flex; align-items: center; gap: 10px; }\n.drejt-modulit b { color: var(--kuqe-up); }\n.shenim { font-size: 17px; color: var(--hiri); background: var(--zbehte); border-left: 4px solid var(--kuqe-up); padding: 10px 14px; border-radius: 0 8px 8px 0; margin-top: 6px; }\n\n/* ---------- sllajdi i modulit ---------- */\n.mod-koka { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 14px; }\n.mod-koka .sl-titulli { font-size: 30px; }\n.mod-koka .sl-titulli::after { width: 56px; height: 4px; margin-top: 8px; }\n.mod-koka .ref { margin-left: auto; }\n.mod { display: grid; grid-template-columns: 860px 1fr; gap: 20px; height: calc(100% - 66px); min-height: 0; }\n.kanavca { width: 860px; height: 482px; border: 1px solid var(--kufiri); border-top: 4px solid var(--kuqe-up); border-radius: 10px; overflow: hidden; line-height: 0; background: #fff; touch-action: pan-y; }\n.kanavca canvas { display: block; }\n.paneli { min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; font-size: 15px; }\n.kontrollet { display: flex; flex-direction: column; gap: 8px; }\n.kontrollet:empty { display: none; }\n.kontroll { display: flex; flex-direction: column; gap: 1px; }\n.kontroll label { font-size: 13.5px; color: var(--hiri); line-height: 1.3; }\n.kontroll label b { color: var(--kuqe-err); font-weight: 700; font-variant-numeric: tabular-nums; }\n.kontroll input[type=\"range\"] { width: 100%; accent-color: var(--kuqe-up); height: 22px; margin: 0; }\n.kontroll select { font: inherit; font-size: 14px; padding: 4px 6px; border: 1px solid var(--kufiri); border-radius: 6px; background: #fff; }\n.kontroll.cek { flex-direction: row; align-items: center; gap: 8px; }\n.kontroll.cek input { width: 18px; height: 18px; accent-color: var(--kuqe-up); }\n.kontroll.cek label { color: var(--zeza); font-weight: 600; font-size: 14.5px; }\n.kontroll button { border: 1.5px solid var(--zeza); background: #fff; border-radius: 6px; padding: 4px 10px; font-size: 14px; font-weight: 600; }\n.kontroll button:hover { background: var(--zeza); color: #fff; }\n.lexime { border-top: 2px solid var(--zeza); padding-top: 6px; font-size: 14px; font-variant-numeric: tabular-nums; }\n.lexime .rresht { display: flex; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--vija); padding: 4px 0; }\n.lexime .rresht span { color: var(--hiri); }\n.lexime .rresht b { font-weight: 700; text-align: right; }\n.kujdes { color: var(--kuqe); font-weight: 700; }\n.tabela-energjise { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; font-variant-numeric: tabular-nums; }\n.tabela-energjise th, .tabela-energjise td { border-bottom: 1px solid var(--vija); padding: 3px 4px; text-align: right; }\n.tabela-energjise th:first-child, .tabela-energjise td:first-child { text-align: left; }\n.tabela-energjise th { color: #fff; background: var(--zeza); }\n.frx { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.05; margin: 0 2px; }\n.frx > span:first-child { border-bottom: 1.2px solid currentColor; padding: 0 3px; }\n\n/* ---------- sllajdet e errëta: titulli, ndarësit, fundi ---------- */\n.sllajd.erret { background: radial-gradient(circle at 85% 15%, rgba(205,46,49,.35) 0, transparent 45%), linear-gradient(135deg, #0d0b0a, #1f1a17 60%, #2e2826); color: #fff; }\n.sllajd.erret::before { width: 0; }\n.sllajd.erret .sl-koka, .sllajd.erret .sl-fund { border-color: rgba(255,255,255,.12); }\n.sllajd.erret .sl-koka .uni, .sllajd.erret .sl-fund { color: #b5aeab; }\n.sllajd.erret .sl-koka .uni b, .sllajd.erret .sl-fund .nr { color: #fff; }\n.rrethi { position: absolute; right: -120px; bottom: -160px; width: 520px; height: 520px; border: 2px solid rgba(205,46,49,.45); border-radius: 50%; pointer-events: none; }\n.rrethi.i2 { right: 40px; bottom: -260px; width: 380px; height: 380px; border-color: rgba(255,255,255,.08); }\n\n.titulli-faqe { display: grid; grid-template-columns: 1.55fr 1fr; gap: 50px; height: 100%; align-items: center; padding: 0 20px; }\n.titulli-faqe .logo-up { width: 104px; height: 104px; box-shadow: 0 0 0 4px var(--kuqe-up), 0 8px 24px rgba(0,0,0,.4); margin-bottom: 26px; }\n.titulli-faqe .uni2 { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: #b5aeab; margin: 0 0 18px; line-height: 1.5; }\n.titulli-faqe h1 { margin: 0; font-size: 58px; font-weight: 800; line-height: 1.02; }\n.titulli-faqe h1 span { display: block; font-weight: 400; font-size: 30px; color: #d6d1ce; margin: 8px 0; }\n.titulli-faqe h1::after { content: \"\"; display: block; width: 90px; height: 6px; background: var(--kuqe-up); border-radius: 3px; margin-top: 22px; }\n.titulli-faqe .lenda { margin: 18px 0 0; font-size: 20px; color: #d6d1ce; }\n.ekipi-kuti { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 24px 26px; position: relative; z-index: 1; }\n.ekipi-kuti h3 { margin: 0 0 10px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: #e2a3a5; }\n.ekipi-kuti ul { list-style: none; margin: 0 0 20px; padding: 0; }\n.ekipi-kuti li { padding: 6px 0 6px 14px; border-left: 3px solid var(--kuqe-up); margin-bottom: 6px; font-weight: 600; font-size: 19px; }\n.ekipi-kuti ul:last-child { margin-bottom: 0; }\n\n.ndares { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 60px; position: relative; z-index: 1; }\n.ndares .numri-madh { font-size: 150px; font-weight: 800; line-height: .9; color: var(--kuqe-up); }\n.ndares h2 { margin: 10px 0 0; font-size: 50px; font-weight: 800; line-height: 1.08; max-width: 900px; }\n.ndares ol { margin: 30px 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; max-width: 980px; }\n.ndares li { font-size: 21px; color: #d6d1ce; padding-left: 16px; border-left: 3px solid rgba(205,46,49,.7); }\n\n.permbajtja { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 26px; margin-top: 24px; }\n.permbajtja .kol h3 { margin: 0 0 10px; font-size: 22px; font-weight: 800; }\n.permbajtja .kol h3 span { color: var(--kuqe-up); margin-right: 6px; }\n.permbajtja .kol a { display: block; padding: 7px 12px; border: 1px solid var(--kufiri); border-radius: 8px; margin-bottom: 7px; color: var(--zeza); text-decoration: none; font-size: 17px; cursor: pointer; }\n.permbajtja .kol a:hover { border-color: var(--kuqe-up); background: #fbeeee; }\n.permbajtja .kol a b { color: var(--kuqe-up); margin-right: 6px; font-variant-numeric: tabular-nums; }\n\n.fundi { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; z-index: 1; }\n.fundi .logo-up { width: 110px; height: 110px; box-shadow: 0 0 0 4px var(--kuqe-up); margin-bottom: 28px; }\n.fundi h2 { margin: 0; font-size: 60px; font-weight: 800; }\n.fundi p { margin: 14px 0 0; font-size: 22px; color: #d6d1ce; }\n.fundi .linku { margin-top: 26px; font-size: 17px; color: #e2a3a5; }\n\n.btn-kuq { background: var(--kuqe-up); color: #fff; border: 0; border-radius: 8px; padding: 12px 24px; font-weight: 700; font-size: 18px; margin-top: 28px; }\n.btn-kuq:hover { background: #fff; color: var(--zeza); }\n\n/* ---------- formulat paraprake ---------- */\n.formulat { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }\n.fkarte { border: 1px solid var(--kufiri); border-top: 3px solid var(--kuqe-up); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; font-size: 13.5px; background: #fff; }\n.fkarte h4 { margin: 0; font-size: 15px; font-weight: 700; }\n.fkarte .fx { font-family: var(--math); font-size: 18px; }\n.fkarte .pershkrim { margin: 0; color: var(--hiri); font-size: 12.5px; line-height: 1.3; }\n.fkarte .hyrjet { display: grid; grid-template-columns: 1fr auto; gap: 3px 6px; align-items: center; color: var(--hiri); font-size: 12.5px; }\n.fkarte input[type=\"number\"] { width: 86px; font: inherit; font-size: 13px; padding: 2px 6px; border: 1px solid var(--kufiri); border-radius: 5px; }\n.fkarte .rez { margin-top: auto; padding: 4px 8px; border-radius: 6px; background: #fbeeee; color: var(--kuqe-err); font-weight: 700; font-size: 13px; }\n\n/* ---------- kuizi ---------- */\n.kuizi { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }\n.pyetja { border: 1px solid var(--kufiri); border-radius: 10px; padding: 10px 14px; font-size: 14.5px; }\n.pyetja h4 { margin: 0 0 6px; font-size: 15px; }\n.pyetja .opsionet { display: grid; gap: 4px; }\n.pyetja button { text-align: left; border: 1px solid var(--kufiri); background: var(--zbehte); border-radius: 6px; padding: 3px 8px; font-size: 13.5px; }\n.pyetja button:hover { border-color: var(--kuqe-up); }\n.pyetja button.sakte { background: #e4f2e6; border-color: var(--gjelber); }\n.pyetja button.gabim { background: #f9e3e0; border-color: var(--kuqe); }\n.pyetja .sqarim { display: none; margin-top: 6px; font-size: 13px; color: var(--hiri); }\n.pyetja.pergjigjur .sqarim { display: block; }\n.rezultati { grid-column: 1 / -1; font-size: 20px; font-weight: 800; padding: 10px 16px; border-left: 5px solid var(--kuqe-up); background: var(--zbehte); border-radius: 0 8px 8px 0; }\nkbd { border: 1px solid #999; border-bottom-width: 2px; border-radius: 4px; padding: 0 5px; font-size: .85em; font-family: inherit; }\n\n/* ---------- shiriti i navigimit ---------- */\n.shiriti { position: fixed; left: 0; right: 0; bottom: 0; height: 52px; display: flex; align-items: center; justify-content: center; gap: 10px; background: #1a1614; border-top: 2px solid var(--kuqe-up); z-index: 10; }\n.btn-ikone { width: 40px; height: 36px; border-radius: 8px; border: 1px solid #4a4340; background: #2a2523; color: #fff; font-size: 20px; line-height: 1; }\n.btn-ikone:hover { background: var(--kuqe-up); border-color: var(--kuqe-up); }\n.numri { color: #d6d1ce; min-width: 90px; text-align: center; font-variant-numeric: tabular-nums; font-size: 15px; }\n.menyja { position: fixed; left: 0; top: 0; bottom: 52px; width: 330px; background: #fff; z-index: 20; overflow: auto; transform: translateX(-100%); transition: transform .2s; box-shadow: 4px 0 30px rgba(0,0,0,.35); padding: 14px 10px 20px; }\n.menyja.hapur { transform: none; }\n.menyja .grupi { font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--kuqe-up); margin: 14px 8px 4px; }\n.menyja a { display: flex; gap: 8px; padding: 5px 8px; border-radius: 6px; color: var(--zeza); text-decoration: none; font-size: 14.5px; cursor: pointer; }\n.menyja a .n { color: var(--hiri-2); width: 26px; font-variant-numeric: tabular-nums; flex-shrink: 0; }\n.menyja a:hover { background: var(--zbehte); }\n.menyja a.aktiv { background: #fbeeee; font-weight: 700; }\n\n/* ---------- ekranet e ngushta: sllajdi rrjedh vertikalisht ---------- */\nbody.rrjedh { overflow: auto; background: var(--sfondi); }\nbody.rrjedh .skena { position: static; display: block; padding-bottom: 60px; }\nbody.rrjedh .sllajd { width: 100%; height: auto; min-height: calc(100vh - 52px); transform: none !important; box-shadow: none; font-size: 17px; }\nbody.rrjedh .sl-koka { padding: 0 14px 0 20px; height: 54px; }\nbody.rrjedh .sl-koka .uni { font-size: 10.5px; }\nbody.rrjedh .sl-koka .grupi { display: none; }\nbody.rrjedh .sl-trupi { padding: 16px 16px 16px 22px; overflow: visible; }\nbody.rrjedh .sl-fund { padding: 0 14px 0 20px; }\nbody.rrjedh .sl-titulli { font-size: 28px; }\nbody.rrjedh .sl-nen { font-size: 17px; }\nbody.rrjedh .shp, body.rrjedh .mod, body.rrjedh .titulli-faqe, body.rrjedh .permbajtja { grid-template-columns: 1fr; height: auto; gap: 18px; }\nbody.rrjedh .shp-teksti { font-size: 17px; }\nbody.rrjedh .kutia-formula .formula { font-size: 19px; }\nbody.rrjedh .kanavca { width: 100%; height: auto; }\nbody.rrjedh .mod-koka { flex-wrap: wrap; }\nbody.rrjedh .mod-koka .sl-titulli { font-size: 24px; }\nbody.rrjedh .titulli-faqe { padding: 20px 0; }\nbody.rrjedh .titulli-faqe h1 { font-size: 36px; }\nbody.rrjedh .titulli-faqe h1 span { font-size: 20px; }\nbody.rrjedh .ndares { padding: 30px 6px; }\nbody.rrjedh .ndares .numri-madh { font-size: 90px; }\nbody.rrjedh .ndares h2 { font-size: 30px; }\nbody.rrjedh .ndares ol, body.rrjedh .formulat, body.rrjedh .kuizi { grid-template-columns: 1fr; }\nbody.rrjedh .fundi { padding: 60px 0; }\nbody.rrjedh .fundi h2 { font-size: 36px; }\nbody.rrjedh .rrethi { display: none; }\n\n/* sfondi interaktiv dhe pa rrëshqitje horizontale */\n.sllajd.erret .sl-trupi { overflow: hidden; }\n.sllajd.erret .sl-koka, .sllajd.erret .sl-trupi, .sllajd.erret .sl-fund { position: relative; z-index: 1; }\n.sfondi-p5 { position: absolute; inset: 0; z-index: 0; line-height: 0; }\n.sfondi-p5 canvas { display: block; }\n.sllajd.erret .sl-trupi > * { position: relative; }\n.sllajd.erret .rrethi { position: absolute; }\n.udhezim { position: absolute !important; right: 24px; bottom: 6px; margin: 0; font-size: 14px; color: #b5aeab; z-index: 2; }\n.ekipi-kuti, .titulli-faqe > div:first-child, .fundi { pointer-events: auto; }\nbody, .sl-trupi { overflow-x: hidden; }\nbody.rrjedh .udhezim { display: none; }\n\n.ref-teksti { font-size: 16px; color: var(--hiri); }\n.udhezim { display: none !important; }\n";

// =====================================================================
//  PJESA 3 – aplikacioni: prezantimi me sllajde 16:9
//  Çdo temë ka një sllajd me shpjegim dhe një sllajd me modulin interaktiv.
//  Skicat përdorin p5 në "instance mode".
// =====================================================================

(function () {
  const el = (id) => document.getElementById(id);
  const SW = 1280, SH = 720;
  let instanca = null, vezhguesi = null, indeksi = 0, leximiFundit = "";
  const SLLAJDET = [];
  const KAPITUJT = {
    "1.": "Ekuacioni i Bernulit si rrjedhojë e ligjit të ruajtjes së energjisë",
    "2.": "Zbatimi i ekuacionit të Bernulit në jetën e përditshme",
    "3.": "Matja e presionit (hidrostatik dhe hidrodinamik)"
  };
  const LINKU = "https://editor.p5js.org/DrinRamadani/full/RlYc8hsGt";

  // Objekti K i jepet çdo moduli: vlerat e kontrolleve dhe gjendja e skicës
  const K = {
    vlerat: {}, klikime: new Set(), gj: {},
    v(id) { return this.vlerat[id]; },
    vendos(id, vlera) {
      this.vlerat[id] = vlera;
      const inp = document.querySelector(`[data-id="${id}"]`);
      if (!inp) return;
      if (inp.type === "checkbox") inp.checked = !!vlera; else inp.value = vlera;
      perditesoEtiketen(id);
    },
    klikuar(id) { if (this.klikime.has(id)) { this.klikime.delete(id); return true; } return false; },
    lexo(html) { const l = el("lexime"); if (l && html !== leximiFundit) { l.innerHTML = thyesatHTML(html); leximiFundit = html; } }
  };
  const etiketat = {};
  function perditesoEtiketen(id) {
    const e = etiketat[id]; if (!e) return;
    e.b.textContent = fmt(K.vlerat[id], (e.k.dhjetore != null ? e.k.dhjetore : 0)) + (e.k.njesia ? " " + e.k.njesia : "");
  }

  // ---------- lista e sllajdeve ----------
  function ndertoSllajdet() {
    MODULET.sort((a, b) => a.nr - b.nr);
    SLLAJDET.push({ lloji: "titulli", emri: "Titulli", grupi: "" });
    SLLAJDET.push({ lloji: "permbajtja", emri: "Përmbajtja", grupi: "" });
    let kap = null;
    for (const m of MODULET) {
      if (m.id === "kreu") continue;
      const k = (m.grupi || "").slice(0, 2);
      if (KAPITUJT[k] && k !== kap) { kap = k; SLLAJDET.push({ lloji: "ndares", kap: k, emri: KAPITUJT[k], grupi: m.grupi }); }
      if (m.html) { SLLAJDET.push({ lloji: "html", m, emri: m.titulli, grupi: m.grupi }); continue; }
      if (m.shpjegimi) SLLAJDET.push({ lloji: "shpjegim", m, emri: m.titulli, grupi: m.grupi });
      if (m.vizato) SLLAJDET.push({ lloji: "modul", m, emri: m.titulli + ", simulimi", grupi: m.grupi });
    }
    SLLAJDET.push({ lloji: "fundi", emri: "Faleminderit", grupi: "" });
  }

  // ---------- pjesët e përbashkëta ----------
  const koka = (grupi) => `<header class="sl-koka"><div class="logo-up"></div><div class="uni"><b>Universiteti i Prishtinës</b><br>Fakulteti i Inxhinierisë Mekanike · Mekatronikë</div><div class="grupi">${grupi || ""}</div></header>`;
  const fund = () => `<footer class="sl-fund"><span>Ekuacioni i energjisë dhe zbatimi i tij. Matja e presionit</span><span>·</span><span>Hidraulika dhe Termodinamika</span><span class="nr">${indeksi + 1} / ${SLLAJDET.length}</span></footer>`;
  const nrM = (m) => String(m.nr).padStart(2, "0");

  function htmlSllajdi(s) {
    const m = s.m;
    switch (s.lloji) {
      case "titulli": return `
        ${koka("")}<div class="sl-trupi">
        <div class="titulli-faqe"><div>
          <div class="logo-up"></div>
          <p class="uni2">Universiteti i Prishtinës “Hasan Prishtina”<br>Fakulteti i Inxhinierisë Mekanike · Mekatronikë</p>
          <h1>Ekuacioni i energjisë<span>(Ekuacioni i Bernulit) dhe zbatimi i tij.</span>Matja e presionit</h1>
          <p class="lenda">Lënda: Hidraulika dhe Termodinamika · Prishtinë, 2026</p>
          <button class="btn-kuq" onclick="hapSllajdin(1)">Fillo</button>
        </div>
        <div class="ekipi-kuti"><h3>Punuan</h3><ul><li>Bahtir Vojvoda</li><li>Drin Ramadani</li><li>Fehmi Qallapeku</li><li>Liburn Hajdari</li><li>Trim Ferizi</li></ul>
        <h3>Mentoret</h3><ul><li>Prof. Asst. Blerina Bylykbashi</li><li>MSc. Kosovare Latifaj</li></ul></div></div></div>${fund()}`;
      case "permbajtja": {
        const kol = { "Hyrje": [], "1.": [], "2.": [], "3.": [], "Kontrolli": [] };
        SLLAJDET.forEach((x, i) => {
          if (!x.m || x.lloji === "modul") return;
          const k = KAPITUJT[(x.grupi || "").slice(0, 2)] ? x.grupi.slice(0, 2) : x.grupi;
          (kol[k] || (kol[k] = [])).push(`<a onclick="hapSllajdin(${i})"><b>${nrM(x.m)}</b>${x.m.titulliShkurt || x.m.titulli}</a>`);
        });
        return `${koka("")}<div class="sl-trupi"><h2 class="sl-titulli">Përmbajtja</h2>
          <div class="permbajtja">
            <div class="kol"><h3>Hyrje</h3>${kol["Hyrje"].join("")}<h3 style="margin-top:16px"><span>1.</span>Ekuacioni i Bernulit</h3>${kol["1."].join("")}</div>
            <div class="kol"><h3><span>2.</span>Zbatimi i ekuacionit</h3>${kol["2."].join("")}</div>
            <div class="kol"><h3><span>3.</span>Matja e presionit</h3>${kol["3."].join("")}</div>
          </div></div>${fund()}`;
      }
      case "ndares": {
        const temat = MODULET.filter((x) => (x.grupi || "").startsWith(s.kap)).map((x) => `<li>${x.titulli}</li>`).join("");
        return `${koka(s.grupi)}<div class="sl-trupi"><div class="ndares"><div class="numri-madh">${s.kap.replace(".", "")}</div><h2>${s.emri}</h2><ol>${temat}</ol></div></div>${fund()}`;
      }
      case "fundi": return `
        ${koka("")}<div class="sl-trupi"><div class="fundi">
          <div class="logo-up"></div><h2>Faleminderit për vëmendjen!</h2>
          <p>Pyetje?</p></div></div>${fund()}`;
      case "html": return `${koka(m.grupi)}<div class="sl-trupi">
          <p class="vetulla">${m.grupi}</p>
          <h2 class="sl-titulli">${m.titulli}</h2>${m.nentitulli ? `<p class="sl-nen">${m.nentitulli}</p>` : ""}
          <div id="permbajtjaHtml"></div></div>${fund()}`;
      case "shpjegim": return `${koka(m.grupi)}<div class="sl-trupi"><div class="shp">
          <div class="shp-majtas"><p class="vetulla">${m.grupi}</p>
            <h2 class="sl-titulli">${m.titulli}</h2><p class="sl-nen">${m.nentitulli || ""}</p>
            <div class="shp-teksti">${m.shpjegimi}</div></div>
          <div class="shp-djathtas">
            <div class="kutia-formula"><h4>Formulat kryesore</h4><div class="formula">${m.formula || ""}</div></div>
          </div></div></div>${fund()}`;
      case "modul": return `${koka(m.grupi)}<div class="sl-trupi">
          <div class="mod-koka"><div><p class="vetulla">Simulimi</p><h2 class="sl-titulli">${m.titulli}</h2></div></div>
          <div class="mod"><div id="kanavca" class="kanavca"></div>
            <div class="paneli"><div id="kontrollet" class="kontrollet"></div><div id="lexime" class="lexime"></div></div></div></div>${fund()}`;
    }
    return "";
  }

  // ---------- kontrollet ----------
  function ndertoKontrollet(m) {
    const kont = el("kontrollet"); if (!kont) return;
    kont.innerHTML = "";
    K.vlerat = {}; K.klikime.clear();
    for (const k in etiketat) delete etiketat[k];
    (m.kontrollet || []).forEach((k) => {
      const d = document.createElement("div");
      d.className = "kontroll";
      if (k.lloji === "rreshqites") {
        K.vlerat[k.id] = k.vlera;
        d.innerHTML = `<label>${thyesatHTML(k.etiketa)}: <b></b></label>`;
        const inp = document.createElement("input");
        inp.type = "range"; inp.min = k.min; inp.max = k.max; inp.step = k.hapi; inp.value = k.vlera; inp.dataset.id = k.id;
        inp.addEventListener("input", () => { K.vlerat[k.id] = parseFloat(inp.value); perditesoEtiketen(k.id); });
        d.appendChild(inp);
        etiketat[k.id] = { b: d.querySelector("b"), k };
      } else if (k.lloji === "zgjedh") {
        K.vlerat[k.id] = k.vlera;
        d.innerHTML = `<label>${k.etiketa}</label>`;
        const s = document.createElement("select"); s.dataset.id = k.id;
        k.opsionet.forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; s.appendChild(o); });
        s.value = k.vlera;
        s.addEventListener("change", () => { K.vlerat[k.id] = s.value; });
        d.appendChild(s);
      } else if (k.lloji === "cek") {
        K.vlerat[k.id] = !!k.vlera; d.className = "kontroll cek";
        const inp = document.createElement("input"); inp.type = "checkbox"; inp.checked = !!k.vlera; inp.id = "c_" + k.id; inp.dataset.id = k.id;
        inp.addEventListener("change", () => { K.vlerat[k.id] = inp.checked; });
        const lab = document.createElement("label"); lab.htmlFor = inp.id; lab.textContent = k.etiketa;
        d.appendChild(inp); d.appendChild(lab);
      } else if (k.lloji === "buton") {
        d.className = "kontroll cek";
        const b = document.createElement("button"); b.textContent = k.etiketa;
        b.addEventListener("click", () => K.klikime.add(k.id));
        d.appendChild(b);
      }
      kont.appendChild(d);
      if (etiketat[k.id]) perditesoEtiketen(k.id);
    });
  }

  // ---------- skica p5 ----------
  let treguesi = null;   // pozita e fundit e miut/gishtit në ekran
  window.addEventListener("pointermove", (e) => { treguesi = [e.clientX, e.clientY]; }, { passive: true });
  window.addEventListener("pointerdown", (e) => { treguesi = [e.clientX, e.clientY]; }, { passive: true });

  function ndalSkicen() {
    if (instanca) { instanca.remove(); instanca = null; }
    if (vezhguesi) { vezhguesi.disconnect(); vezhguesi = null; }
  }
  function nisSkicen(m) {
    const kontejneri = el("kanavca"); if (!kontejneri) return;
    K.gj = {};
    const masa = () => { const w = Math.max(260, Math.floor(kontejneri.clientWidth || 860)); return [w, Math.round(w * H / W)]; };
    instanca = new p5((p) => {
      let shk = 1, kanv = null;
      const poz = () => {
        if (!treguesi || !kanv) return [-1, -1];
        const r = kanv.elt.getBoundingClientRect();
        return [(treguesi[0] - r.left) / r.width * W, (treguesi[1] - r.top) / r.height * H];
      };
      const brenda = () => { const [x, y] = poz(); return x >= 0 && y >= 0 && x <= W && y <= H; };
      const rifresko = () => { const [w, h] = masa(); if (w !== p.width || h !== p.height) p.resizeCanvas(w, h); shk = w / W; };
      p.setup = () => {
        const [w, h] = masa();
        kanv = p.createCanvas(w, h); shk = w / W;
        p.pixelDensity(Math.min(2.5, (window.devicePixelRatio || 1) * 1.5));
        if (m.fillo) m.fillo(p, K);
        if ("ResizeObserver" in window) { vezhguesi = new ResizeObserver(() => requestAnimationFrame(rifresko)); vezhguesi.observe(kontejneri); }
      };
      p.windowResized = rifresko;
      p.draw = () => {
        [K.mx, K.my] = poz();
        K.dt = Math.min(p.deltaTime / 1000, 0.05);
        const shkVizuale = kanv ? kanv.elt.getBoundingClientRect().width / W : shk;
        ZMADHIMI_TEKSTIT = Math.min(1.15, Math.max(1, 0.62 / shkVizuale));
        p.push(); p.scale(shk); letra(p); m.vizato(p, K); p.pop();
      };
      p.mousePressed = () => { if (brenda() && m.shtyp) { [K.mx, K.my] = poz(); m.shtyp(p, K); } };
      p.mouseDragged = () => { if (m.terhiq && K.duke_terhequr) { [K.mx, K.my] = poz(); m.terhiq(p, K); return false; } };
      p.mouseReleased = () => { if (m.lesho) m.lesho(p, K); };
      p.touchStarted = () => { if (brenda() && m.shtyp) { [K.mx, K.my] = poz(); m.shtyp(p, K); if (K.duke_terhequr) return false; } };
      p.touchMoved = () => { if (m.terhiq && K.duke_terhequr) { [K.mx, K.my] = poz(); m.terhiq(p, K); return false; } };
      p.touchEnded = () => { if (m.lesho) m.lesho(p, K); };
    }, kontejneri);
  }

  // ---------- sfondi interaktiv i sllajdeve të errëta ----------
  // Rrjedhë potenciale rreth një cilindri që ndjek miun: anash pengesës
  // grimcat shpejtojnë (presion më i ulët) – parimi i Bernulit.
  function nisSfondin(sl) {
    const d = document.createElement("div");
    d.className = "sfondi-p5";
    sl.insertBefore(d, sl.firstChild);
    instanca = new p5((p) => {
      const N = 230, U = 2.2, R = 70;
      let gr = [], cx = -999, cy = -999, tx = 0, ty = 0;
      const ri = () => { gr = []; for (let i = 0; i < N; i++) gr.push({ x: Math.random() * p.width, y: Math.random() * p.height, j: Math.random() * 200 }); };
      p.setup = () => { p.createCanvas(d.clientWidth || 1280, d.clientHeight || 720); p.pixelDensity(1); ri(); cx = p.width * 0.7; cy = p.height * 0.62; p.background(0, 0); };
      p.draw = () => {
        // pozita e miut brenda sllajdit (sllajdi mund të jetë i shkallëzuar)
        if (treguesi) {
          const r = d.getBoundingClientRect();
          const mx = (treguesi[0] - r.left) / r.width * p.width, my = (treguesi[1] - r.top) / r.height * p.height;
          if (mx > 0 && my > 0 && mx < p.width && my < p.height) { tx = mx; ty = my; }
        } else { tx = p.width * 0.7 + 120 * Math.sin(p.frameCount / 90); ty = p.height * 0.62 + 60 * Math.cos(p.frameCount / 70); }
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        p.clear();
        p.noFill(); p.stroke(205, 46, 49, 150); p.strokeWeight(2); p.circle(cx, cy, 2 * R);
        p.stroke(205, 46, 49, 40); p.circle(cx, cy, 2 * R + 26);
        for (const g of gr) {
          const x = g.x - cx, y = g.y - cy, r2 = x * x + y * y;
          let u = U, v = 0;
          if (r2 > R * R) { const r4 = r2 * r2; u = U * (1 - R * R * (x * x - y * y) / r4); v = -U * 2 * R * R * x * y / r4; }
          else { g.x = -5; g.y = Math.random() * p.height; continue; }
          const sp = Math.hypot(u, v);
          const nx = g.x + u * 1.6, ny = g.y + v * 1.6;
          const a = Math.min(220, 50 + 60 * sp);
          if (sp > U * 1.25) p.stroke(235, 90, 90, a); else p.stroke(255, 255, 255, a * 0.3);
          p.strokeWeight(sp > U * 1.25 ? 2.2 : 1.6);
          p.line(g.x, g.y, g.x - u * 5, g.y - v * 5);
          g.x = nx; g.y = ny;
          if (g.x > p.width + 10 || g.y < -10 || g.y > p.height + 10) { g.x = -5 - Math.random() * 40; g.y = Math.random() * p.height; }
        }
      };
    }, d);
  }

  // ---------- shkallëzimi i sllajdit ----------
  function shkallezo() {
    const rr = window.innerWidth < 760 || window.innerHeight < 380;
    document.body.classList.toggle("rrjedh", rr);
    const s = el("sllajdi");
    if (rr) { s.style.transform = ""; return; }
    const k = Math.min(window.innerWidth / SW, (window.innerHeight - 52) / SH) * 0.98;
    s.style.transform = `scale(${k})`;
  }

  // ---------- hapja e një sllajdi ----------
  function hap(i) {
    indeksi = Math.max(0, Math.min(SLLAJDET.length - 1, i));
    const s = SLLAJDET[indeksi];
    ndalSkicen();
    leximiFundit = "";
    const sl = el("sllajdi");
    sl.className = "sllajd" + (["titulli", "ndares", "fundi"].includes(s.lloji) ? " erret" : "");
    sl.innerHTML = thyesatHTML(htmlSllajdi(s));
    void sl.offsetWidth; sl.classList.add("hyr");
    if (s.lloji === "html") s.m.html(el("permbajtjaHtml"), K);
    if (s.lloji === "modul") { ndertoKontrollet(s.m); nisSkicen(s.m); }
    if (s.lloji === "titulli" || s.lloji === "fundi" || s.lloji === "ndares") nisSfondin(sl);
    el("numri").textContent = (indeksi + 1) + " / " + SLLAJDET.length;
    document.querySelectorAll(".menyja a").forEach((a, j) => a.classList.toggle("aktiv", j === indeksi));
    try { history.replaceState(null, "", "#" + (indeksi + 1)); } catch (e) { /* p.sh. brenda editorit */ }
    if (document.body.classList.contains("rrjedh")) window.scrollTo({ top: 0 });
  }

  function ndertoMenyne() {
    const nav = el("menyja"); nav.innerHTML = "";
    let grupi = null;
    SLLAJDET.forEach((s, i) => {
      const g = s.grupi || "Prezantimi";
      if (g !== grupi) { grupi = g; const d = document.createElement("div"); d.className = "grupi"; d.textContent = g; nav.appendChild(d); }
      const a = document.createElement("a");
      a.innerHTML = `<span class="n">${i + 1}</span><span>${s.lloji === "shpjegim" ? s.emri : s.lloji === "modul" ? "simulimi" : s.emri}</span>`;
      a.addEventListener("click", () => { hap(i); nav.classList.remove("hapur"); });
      nav.appendChild(a);
    });
  }

  function pergatitFaqen() {
    if (!document.getElementById("stili-prezantimit")) {
      const st = document.createElement("style");
      st.id = "stili-prezantimit"; st.textContent = STILI;
      document.head.appendChild(st);
    }
    if (!document.querySelector('link[href*="Source+Sans+3"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    if (!el("sllajdi")) {
      document.querySelectorAll("body > main, body > canvas").forEach((n) => n.remove());
      document.body.insertAdjacentHTML("beforeend", `
        <div id="skena" class="skena"><div id="sllajdi" class="sllajd"></div></div>
        <nav class="shiriti" aria-label="Navigimi">
          <button id="btnMenyja" class="btn-ikone" title="Lista e sllajdeve (M)">☰</button>
          <button id="btnPara" class="btn-ikone" title="Para">‹</button>
          <span id="numri" class="numri"></span>
          <button id="btnPas" class="btn-ikone" title="Pas">›</button>
          <button id="btnPlot" class="btn-ikone" title="Ekran i plotë (F)">⛶</button>
        </nav>
        <aside id="menyja" class="menyja" aria-label="Sllajdet"></aside>`);
    }
  }

  function nis() {
    pergatitFaqen();
    ndertoSllajdet();
    ndertoMenyne();
    shkallezo();
    window.addEventListener("resize", shkallezo);
    const nga = parseInt((location.hash || "").slice(1), 10);
    hap(isFinite(nga) && nga >= 1 ? nga - 1 : 0);
    el("btnPara").addEventListener("click", () => hap(indeksi - 1));
    el("btnPas").addEventListener("click", () => hap(indeksi + 1));
    el("btnMenyja").addEventListener("click", () => el("menyja").classList.toggle("hapur"));
    const plot = () => { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) { /* */ } };
    el("btnPlot").addEventListener("click", plot);
    document.addEventListener("keydown", (e) => {
      const a = document.activeElement;
      if (a && (a.tagName === "INPUT" || a.tagName === "SELECT" || a.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); hap(indeksi + 1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); hap(indeksi - 1); }
      else if (e.key === "Home") hap(0);
      else if (e.key === "End") hap(SLLAJDET.length - 1);
      else if (e.key === "f" || e.key === "F") plot();
      else if (e.key === "m" || e.key === "M") el("menyja").classList.toggle("hapur");
      else if (e.key === "Escape") el("menyja").classList.remove("hapur");
    });
    window.hapSllajdin = (i) => hap(i);
    window.hapModulin = (id) => { const i = SLLAJDET.findIndex((s) => s.m && s.m.id === id); if (i >= 0) hap(i); };
  }

  // Programi është shkruar për p5.js 1.x. Nëse faqja ka ngarkuar p5.js 2.x
  // (si në editor.p5js.org), ngarkohet versioni 1.9.4 para se të fillojë.
  function filloMeP5() {
    const v = window.p5 && window.p5.VERSION ? String(window.p5.VERSION) : "";
    if (v && parseInt(v, 10) < 2) { nis(); return; }
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js";
    sc.onload = nis;
    sc.onerror = nis;
    document.head.appendChild(sc);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", filloMeP5);
  else filloMeP5();
})();
