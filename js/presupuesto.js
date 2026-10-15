// Presupuesto descargable: lee la misma selección que la calculadora (#p=...) y la muestra como documento A4.
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fechaHoy = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

function detalleRows(id) {
  const m = MODULOS[id];
  if (!m.detalle) return "";
  return `<ul class="sub">${m.detalle.map(([t, a, b, o = {}]) =>
    `<li><span>${t}${o.gratis ? ` <em class="free">sin cargo</em>` : ""}</span><span>${hrsLabel([a, b])}</span></li>`).join("")}</ul>`;
}

function itemRow(id, p, kind) {
  const m = MODULOS[id], price = priceOf(id, p), value = valueOf(id, p), cover = coveredBy(id, p);
  let amount;
  if (cover) amount = `<span class="muted">En tu ${MODULOS[cover].name.toLowerCase()}</span>`;
  else if (isOff(id, p)) amount = `<s>${money.format(value)}</s>`;
  else if (kind === "incl" && p.precio && price > 0) amount = `<span class="muted">Incluido</span>`;
  else if (price === 0) amount = `<s>${money.format(value)}</s> <span class="free">Sin cargo</span>`;
  else amount = money.format(price) + (price < value ? `<small class="free">${money.format(value - price)} sin cargo</small>` : "");
  const off = isOff(id, p);
  const tag = tagOf(id, p), tagTxt = tag === "free" ? "Siempre incluido" : tag === "base" ? "Base" : "";
  return `<tr class="${off ? "off" : ""}">
    <td><b>${m.name}${m.qty ? ` ×${qtyOf(id, p)}` : ""}</b>${tagTxt ? ` <span class="ptag ptag-${tag}">${tagTxt}</span>` : ""}<p>${m.desc}</p>${off ? "" : detalleRows(id)}</td>
    <td class="h">${hrsLabel(hoursOf(id, p))}</td>
    <td class="n">${amount}</td>
  </tr>`;
}

// "Tu elección": la cuenta que arma el total, en lenguaje simple. Propuesta + módulos = total.
function choice(p, t, base, ex, mt) {
  const notes = p.incluye.filter(id => isOff(id, p)).map(id => {
    const c = coveredBy(id, p);
    return c ? `${MODULOS[id].name}: incluida en el ${MODULOS[c].name.toLowerCase()}` : `${MODULOS[id].name}: la aportás vos`;
  });
  const line = (sign, label, name, amount, extra = "") =>
    `<div class="ch-row"><span class="ch-sign">${sign}</span><span class="ch-label">${label}</span><span class="ch-name">${name}${extra}</span><span class="ch-amt">${amount}</span></div>`;
  return `<section class="block choice">
    <h2>Tu elección</h2>
    <div class="ch">
      ${line("", "Propuesta", `<b>${esc(p.name)}</b>`, money.format(base.total), notes.length ? `<small>${notes.join(" · ")}</small>` : "")}
      ${ex.length ? ex.map(id => line("+", "Módulo", `${MODULOS[id].name}${MODULOS[id].qty ? ` ×${qtyOf(id, p)}` : ""}`, money.format(priceOf(id, p)))).join("")
        : line("+", "Módulos", `<span class="muted">Sin módulos sumados</span>`, "—")}
      <div class="ch-row ch-total"><span class="ch-sign">=</span><span class="ch-label">Total</span><span class="ch-name">${ex.length ? `Propuesta + ${ex.length} ${ex.length === 1 ? "módulo" : "módulos"}` : "Propuesta"}</span><span class="ch-amt">${money.format(t.total)}</span></div>
      ${mt ? `<div class="ch-row ch-aside"><span class="ch-sign"></span><span class="ch-label">Aparte</span><span class="ch-name">${mt.name} (${mt.horas} h/mes)</span><span class="ch-amt">${mantPrice(mt)} /mes</span></div>` : ""}
    </div>
  </section>`;
}

function render() {
  const p = pkg(), t = totals(), base = totals(p, false), ex = chosenExtras(p);
  const plan = payPlans(t.total)[state.pay], mt = MANT[state.mant];
  const all = orderedIncl(p);
  const table = (rows, kind) => `<table class="items">
    <thead><tr><th>Detalle</th><th class="h">Trabajo</th><th class="n">Importe</th></tr></thead>
    <tbody>${rows.map(id => itemRow(id, p, kind)).join("")}</tbody></table>`;

  document.title = `Presupuesto ${p.name}${state.cliente ? ` - ${state.cliente}` : ""} - ${CONFIG.marca}`;
  $("backLink").href = "index.html" + location.hash;

  $("sheet").innerHTML = `
  <header class="doc-head">
    <div>
      <div class="logo">${esc(CONFIG.marca)}<span>.</span></div>
      <div class="brand-sub">Desarrollo web · ${esc(CONFIG.portfolio.replace(/^https?:\/\//, ""))}</div>
    </div>
    <div class="meta">
      <div><span>Fecha</span><b>${fechaHoy}</b></div>
      <div><span>Validez</span><b>${CONFIG.vigenciaDias} días corridos</b></div>
    </div>
  </header>

  <section class="title-block">
    <h1>Presupuesto de ${esc(p.name)}</h1>
    ${state.cliente ? `<p class="for">Para <b>${esc(state.cliente)}</b></p>` : ""}
    <p class="tagline">${p.tagline}</p>
  </section>

  <section class="kpis">
    <div class="kpi kpi-main"><span>Total</span><b>${money.format(t.total)}</b></div>
    <div class="kpi"><span>Trabajo</span><b>${hrsLabel(t.hrs)}</b></div>
    <div class="kpi"><span>Entrega estimada</span><b>≈ ${weeksText(t.weeks)}</b></div>
    <div class="kpi"><span>Forma de pago</span><b>${plan.title}</b></div>
  </section>

  ${choice(p, t, base, ex, mt)}

  <section class="block">
    <h2>Qué incluye la propuesta</h2>
    ${table(all, "incl")}
    ${p.noIncluye ? `<p class="note"><b>No incluye:</b> ${p.noIncluye}</p>` : ""}
  </section>

  ${ex.length ? `<section class="block"><h2>Módulos sumados</h2>${table(ex, "extra")}</section>` : ""}


  <section class="block stack">
    <div>
      <h2>Forma de pago</h2>
      <p class="pay-title">${plan.title}</p>
      <table class="mini">${plan.lines.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("")}</table>
      <p class="small">${plan.desc}</p>
    </div>
    <div>
      <h2>Mantenimiento mensual</h2>
      ${mt ? `<p class="pay-title">${mt.name} · ${mantPrice(mt)} /mes</p>
        <ul class="checks">${mt.incluye.map(i => `<li>${i}</li>`).join("")}</ul>
        <p class="small">${mt.horas} h por mes. Se paga aparte del total y se puede dar de baja cuando quieras.</p>`
      : `<p class="small">No incluido. Se puede sumar en cualquier momento: básico (2 h/mes) o plus (4 h/mes).</p>`}
    </div>
  </section>

  <div class="end">
  <section class="block two">
    <div>
      <h2>No incluido en ningún caso</h2>
      <ul class="dots">
        <li>Dominio (.com.ar o .com), queda a tu nombre.</li>
        <li>Planes pagos de hosting, si algún día los necesitás.</li>
        <li>Comisiones de Mercado Pago y servicios de envío de mails o WhatsApp.</li>
        <li>Fotos profesionales o imágenes de bancos pagos.</li>
        <li>Costos de uso de inteligencia artificial (tokens para embeddings y respuestas).</li>
      </ul>
    </div>
    <div>
      <h2>Condiciones</h2>
      <ul class="dots">
        <li><b>Vigencia:</b> ${CONFIG.vigenciaDias} días corridos desde que recibís este presupuesto.</li>
        <li><b>Con el primer pago, el precio queda congelado</b> para todo lo incluido.</li>
        <li>Lo que se sume después se presupuesta aparte, con el mismo criterio.</li>
      </ul>
    </div>
  </section>

  <footer class="doc-foot">
    <span class="logo sm">${esc(CONFIG.marca)}<span>.</span></span>
    <span>${esc(CONFIG.portfolio.replace(/^https?:\/\//, ""))}</span>
  </footer>
  </div>`;
}

const $ = id => document.getElementById(id);
$("printBtn").addEventListener("click", () => window.print());
load();
render();
