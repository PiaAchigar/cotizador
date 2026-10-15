// Cálculos compartidos entre la calculadora (index.html) y el presupuesto descargable (presupuesto.html).
// Depende de servicios.js. No toca el DOM.
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const num = n => (Math.round(n * 10) / 10).toLocaleString("es-AR");
const PKG = Object.fromEntries(PAQUETES.map(p => [p.id, p]));
const STORE = "cotizador-v2";

let state = { pkg: "landing", extras: {}, qty: {}, quitados: {}, mant: "", pay: "base", cliente: "" };
const isAdmin = () => new URLSearchParams(location.hash.slice(1)).has("admin");

// ── Cálculos ────────────────────────────────────────────────
const pkg = () => PKG[state.pkg] || PAQUETES[0];
const qtyOf = (id, p = pkg()) => MODULOS[id].qty ? Math.max(1, Number(state.qty[id] ?? p.qty?.[id] ?? MODULOS[id].qty) || 1) : 1;
// Horas totales (lo que se muestra) y horas cobradas (sin lo marcado como gratis)
function baseHours(id, soloCobradas = false) {
  const m = MODULOS[id];
  if (soloCobradas && m.gratis) return [0, 0];
  if (!m.detalle) return [m.min, m.max];
  return m.detalle.filter(([, , , o]) => !(soloCobradas && o?.gratis)).reduce(([a, b], [, mn, mx]) => [a + mn, b + mx], [0, 0]);
}
function hoursOf(id, p, soloCobradas = false) { const [a, b] = baseHours(id, soloCobradas), q = qtyOf(id, p); return [a * q, b * q]; }
// La tarifa depende de la parte (web o sistemas), no del paquete: la misma línea cuesta igual en todas las tarjetas
const rateOf = id => CONFIG.valorHora[MODULOS[id].mercado || "web"];
// Precio = horas MÍNIMAS × valor hora (sin margen). Las horas máximas solo se muestran como referencia.
const priceFromHours = ([a], rate) => Math.round(a * rate / CONFIG.redondeo) * CONFIG.redondeo;
const priceOf = (id, p = pkg()) => priceFromHours(hoursOf(id, p, true), rateOf(id));
const valueOf = (id, p = pkg()) => priceFromHours(hoursOf(id, p), rateOf(id));
// Se pueden destildar: los módulos con opcionalInfo (ej.: identidad visual) y, por paquete, los de "opcionales"
const isOptional = (id, p = pkg()) => !!MODULOS[id].opcionalInfo || (p.opcionales || []).includes(id);
const optionalInfo = (id, p = pkg()) => (p.opcionalesInfo || {})[id] || MODULOS[id].opcionalInfo || "";
// Un extra puede "cubrir" un módulo incluido (ej.: el manual de marca cubre la identidad visual) y entonces no se cobra dos veces
const coveredBy = (id, p = pkg()) => chosenExtras(p).find(e => (MODULOS[e].cubre || []).includes(id));
const isOff = (id, p = pkg()) => (isOptional(id, p) && state.quitados[id]) || !!coveredBy(id, p);
const activeIncl = (p = pkg()) => p.incluye.filter(id => !isOff(id, p));
// Etiquetas de "Qué incluye": "free" = sin cargo (siempre incluido); "base" = forma parte de la propuesta y no se puede quitar
const tagOf = (id, p = pkg()) => {
  if (MODULOS[id].gratis) return "free";
  if (p.incluye.includes(id) && !isOptional(id, p)) return "base";
  return null;
};
const orderedIncl = (p = pkg()) => [...ORDEN.filter(id => p.incluye.includes(id)), ...p.incluye.filter(id => !ORDEN.includes(id))];
const roundTo = n => Math.round(n / CONFIG.redondeo) * CONFIG.redondeo;

const extrasFor = p => EXTRAS.map(g => ({ ...g, items: g.items.filter(e => (e.en || WEB).includes(p.id) && !p.incluye.includes(e.id)) }))
  .filter(g => g.items.length);
// Requisitos entre extras (ej.: categorías necesita el panel). Se cumplen con otro extra elegido o con algo que el paquete ya trae.
const reqsOf = (id, p = pkg()) => (MODULOS[id].req || []).filter(r => !(p.provee || []).includes(r) && !p.incluye.includes(r));
const chosenExtras = (p = pkg()) => {
  const on = extrasFor(p).flatMap(g => g.items).filter(e => state.extras[e.id]).map(e => e.id);
  return on.filter(id => reqsOf(id, p).every(r => on.includes(r)));
};

function totals(p = pkg(), withExtras = true) {
  const incl = activeIncl(p), extras = withExtras ? chosenExtras(p) : [];
  const ids = [...incl, ...extras];
  const hrs = ids.reduce(([a, b], id) => { const [x, y] = hoursOf(id, p); return [a + x, b + y]; }, [0, 0]);
  // Paquete con precio cerrado: el precio fijo reemplaza la suma de sus módulos
  const total = (p.precio ?? incl.reduce((s, id) => s + priceOf(id, p), 0)) + extras.reduce((s, id) => s + priceOf(id, p), 0);
  const bonif = ids.reduce((s, id) => s + valueOf(id, p) - priceOf(id, p), 0);
  const weeks = Math.max(1, Math.ceil((hrs[0] + hrs[1]) / 2 * (1 + CONFIG.imprevistos / 100) / CONFIG.horasSemana));
  return { ids, hrs, total, bonif, weeks };
}
const MANT = Object.fromEntries(CONFIG.mantenimiento.map(m => [m.id, m]));
const mantPrice = m => money.format(roundTo(m.horas * CONFIG.valorHora.web));
const weeksText = w => w === 1 ? "1 semana" : `${w} semanas`;

function payPlans(total, p = pkg()) {
  const { tarjeta, plan } = CONFIG.pagos;
  const base = CONFIG.pagos[p.pago];
  const tTotal = tarjeta.recargo == null ? total : total * (1 + tarjeta.recargo / 100);
  const ant = roundTo(total * plan.anticipo / 100);
  const resto = (total - ant) * (plan.recargo == null ? 1 : 1 + plan.recargo / 100);
  const surcharge = r => r == null ? " + recargo a confirmar" : r > 0 ? ` (incluye ${r}% de recargo)` : " sin recargo";
  return {
    base: {
      icon: p.pago === "hitos" ? "flag" : "contrast",
      title: p.pago === "hitos" ? `En ${base.length} etapas` : "Mitad y mitad",
      desc: p.pago === "hitos" ? "Pagás a medida que ves avances." : "La forma más simple.",
      lines: base.map(b => [`${b.pct}% ${b.cuando.toLowerCase()}`, money.format(roundTo(total * b.pct / 100))]),
    },
    tarjeta: {
      icon: "credit_card", title: `Hasta ${tarjeta.cuotas} cuotas con tarjeta`, desc: `Por Mercado Pago${surcharge(tarjeta.recargo)}.`,
      lines: [[`${tarjeta.cuotas} cuotas de`, money.format(roundTo(tTotal / tarjeta.cuotas))]],
    },
    plan: {
      icon: "event_repeat", title: `Plan en ${plan.cuotas + 1} pagos`, desc: `Anticipo y ${plan.cuotas} cuotas mensuales${surcharge(plan.recargo)}.`,
      lines: [[`Anticipo (${plan.anticipo}%)`, money.format(ant)], [`${plan.cuotas} cuotas de`, money.format(roundTo(resto / plan.cuotas))]],
    },
  };
}

// ── Estado: link (#p=...) → navegador → por defecto ─────────
function load() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.has("p")) {
    state.pkg = PKG[h.get("p")] ? h.get("p") : "landing";
    state.extras = {}; state.qty = {};
    (h.get("e") || "").split(",").filter(id => MODULOS[id]).forEach(id => { state.extras[id] = true; });
    state.quitados = {};
    (h.get("x") || "").split(",").filter(id => MODULOS[id]).forEach(id => { state.quitados[id] = true; });
    (h.get("q") || "").split(",").filter(Boolean).forEach(s => { const [id, n] = s.split(":"); if (MODULOS[id]) state.qty[id] = Number(n) || 1; });
    state.pay = ["base", "tarjeta", "plan"].includes(h.get("pay")) ? h.get("pay") : "base";
    state.cliente = (h.get("c") || "").slice(0, 60);
    state.mant = MANT[h.get("m")] ? h.get("m") : (h.has("m") ? CONFIG.mantenimiento[0].id : "");
    return;
  }
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.pkg) state = { ...state, ...s, cliente: "" }; } catch {}
}
function shareHash(withAdmin = isAdmin()) {
  const p = new URLSearchParams({ p: state.pkg });
  const e = chosenExtras(); if (e.length) p.set("e", e.join(","));
  const x = pkg().incluye.filter(id => isOptional(id, pkg()) && state.quitados[id]); if (x.length) p.set("x", x.join(","));
  const q = [...pkg().incluye, ...e].filter(id => MODULOS[id].qty && qtyOf(id) !== (pkg().qty?.[id] ?? MODULOS[id].qty)).map(id => `${id}:${qtyOf(id)}`);
  if (q.length) p.set("q", q.join(","));
  if (state.pay !== "base") p.set("pay", state.pay);
  if (state.cliente) p.set("c", state.cliente);
  if (MANT[state.mant]) p.set("m", state.mant);
  if (withAdmin) p.set("admin", "");
  return p.toString().replace(/%2C/g, ",").replace(/%3A/g, ":").replace(/admin=$/, "admin");
}
const shareUrl = () => location.href.split("#")[0] + "#" + shareHash(false);

// Menos de 1 h se muestra en minutos; desde 10 h, en horas enteras
const hfmt = n => n >= 10 ? String(Math.round(n)) : num(Math.round(n * 2) / 2);
const hrsLabel = ([a, b]) => b < 1 ? (a === b ? `${a * 60} min` : `${a * 60}–${b * 60} min`)
  : hfmt(a) === hfmt(b) ? `${hfmt(a)} h` : `${hfmt(a)}–${hfmt(b)} h`;
