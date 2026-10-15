const $ = id => document.getElementById(id);
function save() {
  try { const { cliente, ...rest } = state; localStorage.setItem(STORE, JSON.stringify(rest)); } catch {}
  history.replaceState(null, "", "#" + shareHash());
}

// ── Render ──────────────────────────────────────────────────
const openMods = new Set();
const TAGS = {
  free: { icon: "verified", label: "Siempre incluido", tip: "Siempre incluido: no tiene costo." },
  base: { icon: "layers", label: "Base", tip: "Base: forma parte de esta propuesta, no se puede quitar." },
};
const ms = name => `<span class="ms" aria-hidden="true">${name}</span>`;

function qtyInput(id) {
  return `<span class="qty"><label for="q-${id}">Cantidad</label>
    <button type="button" class="qbtn" data-step="-1" data-q="${id}" aria-label="Una menos">−</button>
    <input type="number" min="1" max="20" id="q-${id}" data-q="${id}" value="${qtyOf(id)}">
    <button type="button" class="qbtn" data-step="1" data-q="${id}" aria-label="Una más">+</button></span>`;
}
function detalleList(id) {
  const m = MODULOS[id];
  if (!m.detalle) return "";
  return `<ul class="det">${m.detalle.map(([t, a, b, o = {}]) => `<li>
    <span><span class="det-t">${t}</span>${o.info ? `<span class="det-info">${o.info}</span>` : ""}</span>
    <span class="det-h">${hrsLabel([a, b])}${o.gratis ? `<span class="free-tag">sin cargo</span>` : ""}</span></li>`).join("")}</ul>`;
}

const MERCADOS = [
  { id: "web", icon: "language", title: "Páginas web", desc: "Para que te encuentren, te conozcan y te escriban." },
  { id: "sistemas", icon: "settings_suggest", title: "Sistemas a medida", desc: "Para automatizar tu negocio: reservas, ventas y gestión." },
];
const closedMk = new Set(); // grupos que el visitante plegó
function renderPkgs() {
  $("pkgs").innerHTML = MERCADOS.map(mk => {
    const list = PAQUETES.filter(p => (p.mercado || "web") === mk.id);
    const sel = list.find(p => p.id === state.pkg);
    return `<details class="mk mk-${mk.id}" data-mk="${mk.id}" ${closedMk.has(mk.id) ? "" : "open"}>
      <summary class="mk-head">
        <span class="mk-ic">${ms(mk.icon)}</span>
        <span class="mk-text"><span class="mk-title">${mk.title}</span><span class="mk-desc">${mk.desc}</span></span>
        ${sel ? `<span class="mk-sel">${ms("check_circle")} ${sel.name}</span>` : `<span class="mk-count">${list.length} opciones</span>`}
        <span class="ms mk-chev" aria-hidden="true">expand_more</span>
      </summary>
      <div class="pkg-grid">${list.map(pkgCard).join("")}</div>
    </details>`;
  }).join("");
}
function pkgCard(p) {
  {
    const t = totals(p, false), on = p.id === state.pkg;
    return `<label class="pkg ${on ? "on" : ""}">
      <input type="radio" name="pkg" value="${p.id}" ${on ? "checked" : ""}>
      <span class="pkg-ic">${ms(p.icon)}</span>
      <span class="pkg-name">${p.name}</span>
      <span class="pkg-tag">${p.tagline}</span>
      <span class="pkg-ideal">${p.ideal}</span>
      <span class="pkg-foot"><span><small>${p.precio ? "precio cerrado" : "desde"}</small><b>${money.format(t.total)}</b></span><span class="pill">${ms("calendar_month")} ${weeksText(t.weeks)}</span></span>
    </label>`;
  }
}

function renderIncl() {
  const p = pkg();
  const ordered = orderedIncl(p);
  const row = id => {
    const m = MODULOS[id], h = hoursOf(id), cover = coveredBy(id, p), opt = isOptional(id, p) && !cover, off = isOff(id, p);
    const tag = tagOf(id, p), T = TAGS[tag];
    const always = T ? `<span class="always ${tag === "base" ? "is-base" : ""}" tabindex="0" aria-label="${T.label}">
        <span class="ms" aria-hidden="true">${T.icon}</span><span class="always-txt">${T.label}</span>
        <span class="always-tip" role="tooltip">${T.tip}</span></span>` : "";
    const price = priceOf(id), value = valueOf(id);
    const priceCell = cover ? `<span class="mod-p mod-off">En tu ${MODULOS[cover].name.toLowerCase()}</span>`
      : off ? `<span class="mod-p mod-off"><s>${money.format(value)}</s></span>`
      : p.precio && price > 0 ? `<span class="mod-p mod-inc">Incluido</span>`
      : price === 0 ? `<span class="mod-p mod-free"><s>${money.format(value)}</s> Sin cargo</span>`
      : `<span class="mod-p">${money.format(price)}${price < value ? `<small>${money.format(value - price)} sin cargo</small>` : ""}</span>`;
    const check = opt ? `<span class="opt">
        <input type="checkbox" data-opt="${id}" id="opt-${id}" ${off ? "" : "checked"} aria-label="Incluir ${m.name}" aria-describedby="tip-${id}">
        <span class="tip" tabindex="0" aria-label="Más información">${ms("help")}<span class="tip-txt" role="tooltip" id="tip-${id}">${optionalInfo(id, p)}</span></span>
      </span>` : "";
    return `<details class="mod ${off ? "off" : ""}" data-mod="${id}" ${openMods.has(id) ? "open" : ""}>
      <summary><span class="ms chev" aria-hidden="true">expand_more</span><span class="mod-name">${m.name}${m.qty ? ` <em>×${qtyOf(id)}</em>` : ""}${check}${always}${m.cambios && p.id !== "turnos" ? cambiosNote() : ""}</span>
        <span class="mod-h">${hrsLabel(h)}</span>${priceCell}</summary>
      <div class="mod-body"><p>${m.desc}</p>${m.cambios && p.id === "turnos" ? `<p class="ok-txt">${ms("check_circle")} Esta propuesta trae el panel por defecto, así que los cambios los vas a poder realizar vos.</p>` : ""}${detalleList(id)}${m.qty ? qtyInput(id) : ""}</div>
    </details>`;
  };
  const t = totals(p, false);
  $("inclName").textContent = p.name;
  $("inclHours").innerHTML = `${ms("schedule")} ${hrsLabel(t.hrs)} de trabajo`;
  $("incl").innerHTML = `<div class="mod-group"><h4>Lo que hace a tu ${p.id === "gestion" ? "sistema" : "página"}</h4>${ordered.map(row).join("")}</div>
     ${p.noIncluye ? `<p class="no-incl">${ms("info")}<span><b>No incluye:</b> ${p.noIncluye}</span></p>` : ""}`;
}

// Sin el panel de notas, las notas las carga Pia con el mantenimiento mensual
function blogDep() {
  return chosenExtras().includes("panelNotas")
    ? `<span class="dep ok">${ms("check_circle")} Vos cargás las notas desde tu panel.</span>`
    : `<span class="dep warn">${ms("info")}<span>Sin panel: las notas las cargo yo, con un <a href="#grp-mant">plan de mantenimiento</a>.</span></span>`;
}

// Quién cambia los precios después: depende del panel (extra) o de un plan de mantenimiento
function cambiosNote() {
  if (pkg().id === "turnos") return ""; // se explica en el texto de la parte
  const panel = chosenExtras().includes("panelServ"), mant = MANT[state.mant];
  if (panel) return `<span class="dep ok">${ms("check_circle")} Los cambios los hacés vos desde tu panel.</span>`;
  if (mant) return `<span class="dep ok">${ms("check_circle")} Los cambios los hago yo, con tu ${mant.name.toLowerCase()}.</span>`;
  const canPanel = extrasFor(pkg()).some(g => g.items.some(e => e.id === "panelServ"));
  return `<span class="dep warn">${ms("info")}<span>¿Quién cambia los precios después? Sumá un <a href="#grp-mant">plan de mantenimiento</a> (los cambio yo)${canPanel ? ` o el <a href="#grp-panel">panel para editar</a> (los cambiás vos)` : ""}.</span></span>`;
}

function renderExtras() {
  const groups = extrasFor(pkg());
  $("extras").innerHTML = groups.map(g => `<div class="xgroup"${g.id ? ` id="${g.id}"` : ""}>
    <h3>${ms(g.icon)} ${g.title}</h3>${g.note ? `<p class="xnote">${g.note}</p>` : ""}
    <div class="xgrid">${g.items.map(({ id }) => {
      const m = MODULOS[id], on = !!state.extras[id];
      return `<div class="x ${on ? "on" : ""}">
        <label class="x-main">
          <input type="checkbox" data-x="${id}" id="x-${id}" ${on ? "checked" : ""}>
          <span class="switch" aria-hidden="true"></span>
          <span class="x-text"><span class="x-name">${m.name}</span><span class="x-desc">${m.desc}</span>${reqsOf(id).length ? `<span class="x-req">${ms("link")} Requiere: ${reqsOf(id).map(r => MODULOS[r].name).join(", ")} (se suma solo)</span>` : ""}</span>
        </label>
        ${m.detalle ? `<details class="x-det"><summary>Ver detalle</summary>${detalleList(id)}</details>` : ""}
        ${m.qty && on ? qtyInput(id) : ""}
        ${id === "blog" ? blogDep() : ""}
        <div class="x-foot"><span>${ms("schedule")} ${hrsLabel(hoursOf(id))}</span><b>+ ${money.format(priceOf(id))}</b></div>
      </div>`;
    }).join("")}</div>
  </div>`).join("") + `<div class="xgroup" id="grp-mant">
    <h3>${ms("build")} Después de publicar</h3>
    <p class="xnote">Planes de mantenimiento mensual. Elegí uno o ninguno; se pagan por mes, aparte del total, y los podés dar de baja cuando quieras. Las horas que no se usan no se acumulan.</p>
    <div class="xgrid">${CONFIG.mantenimiento.map(m => {
      const on = state.mant === m.id;
      return `<div class="x x-mant ${on ? "on" : ""}">
        <label class="x-main">
          <input type="checkbox" data-mant="${m.id}" id="x-mant-${m.id}" ${on ? "checked" : ""}>
          <span class="switch" aria-hidden="true"></span>
          <span class="x-text"><span class="x-name">${m.name}</span><span class="x-desc">${m.horas} horas de trabajo por mes.</span></span>
        </label>
        <ul class="mant-list">${m.incluye.map(t => `<li>${ms("check")}<span>${t}</span></li>`).join("")}</ul>
        <div class="x-foot"><span>${ms("schedule")} ${m.horas} h por mes</span><b>${mantPrice(m)} /mes</b></div>
      </div>`;
    }).join("")}</div>
  </div>`;
}

function renderPays() {
  const plans = payPlans(totals().total);
  $("pays").innerHTML = Object.entries(plans).map(([k, v]) => `<label class="pay ${state.pay === k ? "on" : ""}">
    <input type="radio" name="pay" value="${k}" ${state.pay === k ? "checked" : ""}>
    <span class="pay-ic">${ms(v.icon)}</span>
    <span class="pay-title">${v.title}</span>
    <span class="pay-desc">${v.desc}</span>
    <span class="pay-lines">${v.lines.map(([a, b]) => `<span><span>${a}</span><b>${b}</b></span>`).join("")}</span>
  </label>`).join("");
}

function renderSummary() {
  $("pdfLink").href = "presupuesto.html#" + shareHash(false);
  const p = pkg(), t = totals(), plan = payPlans(t.total)[state.pay];
  $("sIcon").textContent = p.icon;
  $("sPkg").textContent = p.name;
  $("sTotal").textContent = money.format(t.total);
  $("sBonif").textContent = t.bonif ? `Incluye ${money.format(t.bonif)} en reuniones y cambios menores sin cargo` : "";
  $("sHours").textContent = hrsLabel(t.hrs);
  $("sWeeks").textContent = `≈ ${weeksText(t.weeks)}`;
  $("sExtras").textContent = chosenExtras().length;
  $("paso2").dataset.tone = $("inclCard").dataset.tone = pkg().mercado || "web";
  const mt = MANT[state.mant];
  $("sMaint").textContent = mt ? `${mt.name.replace("Mantenimiento ", "").replace(/^./, c => c.toUpperCase())}: ${mantPrice(mt)} /mes` : "No incluido";
  $("sMaint").classList.toggle("on", !!mt);
  $("sPay").innerHTML = `<small>${plan.title}</small>${plan.lines.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join("")}<p>${plan.desc}</p>`;
  $("mPkg").textContent = p.name;
  $("mTotal").textContent = money.format(t.total);
  $("mWeeks").textContent = `≈ ${weeksText(t.weeks)}`;
}

// El título alterna "tu página web" / "tu sistema a medida". Con nombre de cliente, el título es fijo.
const TITLE_HTML = $("title").innerHTML;
let titleMode = "rot";
function renderTitle() {
  const h1 = $("title"), mode = state.cliente ? "cliente:" + state.cliente : "rot";
  if (mode === titleMode) return; // no reiniciar la animación en cada cambio
  titleMode = mode;
  if (!state.cliente) { h1.innerHTML = TITLE_HTML; h1.setAttribute("aria-label", "Armá el presupuesto de tu página web o tu sistema a medida"); return; }
  h1.removeAttribute("aria-label");
  h1.textContent = "Presupuesto para ";
  const s = document.createElement("span"); s.className = "grad"; s.textContent = state.cliente; h1.append(s);
}
// Rotación: cambia cada 3,2 s; se pausa con la pestaña oculta o el título fuera de pantalla
(function rotateTitle() {
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($("title"));
  setInterval(() => {
    const rot = document.querySelector("#title .rot");
    if (!rot || !visible || document.hidden) return;
    const on = rot.querySelector(".is-on"), next = on.nextElementSibling || rot.firstElementChild;
    on.classList.replace("is-on", "is-out");
    next.classList.remove("is-out"); next.classList.add("is-on");
    setTimeout(() => on.classList.remove("is-out"), 700);
  }, 3200);
})();

function render() {
  const active = document.activeElement?.id;
  renderPkgs(); renderIncl(); renderExtras(); renderPays(); renderSummary(); renderTitle();
  if (active && $(active)) $(active).focus({ preventScroll: true });
}

// ── Texto para WhatsApp / copiar ────────────────────────────
function summaryText() {
  const p = pkg(), t = totals(), plan = payPlans(t.total)[state.pay];
  const lines = [`Hola ${CONFIG.nombre}! Armé este presupuesto en tu cotizador:`, "", `*Propuesta:* ${p.name} — ${money.format(totals(p, false).total)}`];
  const ex = chosenExtras();
  if (ex.length) {
    lines.push("", `*Módulos sumados (${ex.length})*`);
    ex.forEach(id => lines.push(`- ${MODULOS[id].name}${MODULOS[id].qty ? ` (x${qtyOf(id)})` : ""}: ${money.format(priceOf(id))}`));
  }
  const quit = p.incluye.filter(id => isOptional(id, p) && state.quitados[id]);
  if (quit.length) lines.push("", `Lo aporto yo: ${quit.map(id => MODULOS[id].name).join(", ")}`);
  if (MANT[state.mant]) lines.push("", `${MANT[state.mant].name} (${MANT[state.mant].horas} h/mes): ${mantPrice(MANT[state.mant])} por mes, aparte del total`);
  if (t.bonif) lines.push("", `Sin cargo: reuniones y cambios menores (valor ${money.format(t.bonif)})`);
  lines.push("", `*Total estimado: ${money.format(t.total)}*`, `Trabajo: ${hrsLabel(t.hrs)} · Entrega: ≈ ${weeksText(t.weeks)}`);
  lines.push(`Pago: ${plan.title} (${plan.lines.map(([a, b]) => `${a} ${b}`).join(", ")})`);
  lines.push("", `Link: ${shareUrl()}`);
  return lines.join("\n");
}
function flash(msg) { $("copyMsg").textContent = msg; clearTimeout(flash.t); flash.t = setTimeout(() => { $("copyMsg").textContent = ""; }, 3000); }
function copy(text, ok) {
  const fb = $("copyFallback");
  navigator.clipboard.writeText(text).then(() => { flash(ok); fb.hidden = true; })
    .catch(() => { fb.value = text; fb.hidden = false; fb.select(); $("copyMsg").textContent = "Seleccioná el texto y copialo con Ctrl+C"; });
}

// ── Eventos ─────────────────────────────────────────────────
// Prender un extra prende lo que necesita; apagarlo apaga lo que depende de él
function toggleExtra(id, on) {
  state.extras[id] = on;
  if (on) reqsOf(id).forEach(r => { if (!state.extras[r]) toggleExtra(r, true); });
  else Object.keys(MODULOS).forEach(o => { if (state.extras[o] && (MODULOS[o].req || []).includes(id)) toggleExtra(o, false); });
}
document.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "pkg") state.pkg = t.value;
  else if (t.name === "pay") state.pay = t.value;
  else if (t.dataset.x) toggleExtra(t.dataset.x, t.checked);
  else if (t.dataset.opt) state.quitados[t.dataset.opt] = !t.checked;
  else if (t.dataset.mant) state.mant = t.checked ? t.dataset.mant : ""; // uno o ninguno
  else if (t.dataset.q) state.qty[t.dataset.q] = Math.min(20, Math.max(1, Number(t.value) || 1));
  else return;
  save(); render();
  if (t.name === "pkg") {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => $("inclCard").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }
});
document.addEventListener("click", e => {
  if (e.target.closest("summary .tip")) { e.preventDefault(); return; }
  const b = e.target.closest(".qbtn");
  if (!b) return;
  const id = b.dataset.q;
  state.qty[id] = Math.min(20, Math.max(1, qtyOf(id) + Number(b.dataset.step)));
  save(); render();
});
// Mantener abiertos los desplegables al re-renderizar
document.addEventListener("toggle", e => {
  const d = e.target;
  if (d.dataset?.mod) d.open ? openMods.add(d.dataset.mod) : openMods.delete(d.dataset.mod);
  if (d.dataset?.mk) d.open ? closedMk.delete(d.dataset.mk) : closedMk.add(d.dataset.mk);
}, true);

load();

$("copyBtn").addEventListener("click", () => copy(summaryText(), "Resumen copiado"));
$("linkBtn").addEventListener("click", () => copy(shareUrl(), "Link copiado"));
$("ledeContact").href = CONFIG.whatsapp
  ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Hola ${CONFIG.nombre}! Vi tu cotizador y quiero consultarte por un proyecto.`)}`
  : CONFIG.portfolio;
if (CONFIG.whatsapp) {
  const wa = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
  $("waBtn").hidden = false;
  $("waBtn").addEventListener("click", () => window.open(wa(summaryText()), "_blank", "noopener"));
  $("navWa").hidden = false;
  $("navWa").href = wa(`Hola ${CONFIG.nombre}! Tengo una consulta sobre una página web.`);
}
if (isAdmin()) {
  $("admin").hidden = false;
  $("linkBtn").hidden = false;
  $("clientName").value = state.cliente;
  $("clientName").addEventListener("input", e => { state.cliente = e.target.value.slice(0, 60); save(); renderTitle(); renderSummary(); });
}
$("brand").textContent = $("brand2").textContent = CONFIG.marca;
["brandLink", "brandLink2", "portfolioLink"].forEach(id => { $(id).href = CONFIG.portfolio; });
$("portfolioLink").firstChild.textContent = CONFIG.portfolio.replace(/^https?:\/\//, "") + " ";
$("vigDias").textContent = CONFIG.vigenciaDias;

render();
