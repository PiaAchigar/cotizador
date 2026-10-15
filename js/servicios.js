// ─────────────────────────────────────────────────────────────
// Configuración del cotizador. Es lo único que necesitás tocar.
// El valor hora NO se muestra en la página: el cliente ve horas, plazo y precio.
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  marca: "piaDev",               // logo de texto del encabezado (el punto lo agrega el diseño)
  portfolio: "https://www.piadev.com.ar", // link del logo
  vigenciaDias: 30,              // días corridos de validez del presupuesto
  nombre: "Pia",                 // se usa en el mensaje de WhatsApp
  whatsapp: "",                  // tu número con código de país, sin + ni espacios. Ej: "5491112345678"
  // Valor hora en pesos (no se muestra). Se aplica por PARTE, no por paquete:
  // web = diseño, secciones, SEO, extras de página y mantenimiento (compite con plantillas y freelancers locales)
  // sistemas = partes con mercado: "sistemas" (agenda, tienda, gestión e integraciones de sistema)
  valorHora: { web: 45000, sistemas: 70000 },
  imprevistos: 15,               // % que se suma a las horas de cada módulo
  redondeo: 1000,                // los precios se redondean a este múltiplo
  horasSemana: 15,               // horas por semana que le dedicás → plazo de entrega
  // Planes de mantenimiento: se cobran por mes (horas × valor hora), aparte del total. El cliente elige uno o ninguno.
  mantenimiento: [
    { id: "basico", name: "Mantenimiento básico", horas: 2, incluye: [
      "Cambios chicos de textos, precios o imágenes",
      "Actualizaciones técnicas y de seguridad",
      "Revisión mensual: formularios, links y botón de WhatsApp funcionando",
      "Aviso antes de que venza tu dominio",
      "Consultas por WhatsApp o mail" ] },
    { id: "plus", name: "Mantenimiento plus", horas: 4, incluye: [
      "Todo lo del básico",
      "Pequeñas reestructuraciones: reordenar secciones, sumar o quitar un bloque",
      "Publicar una promoción, novedad o servicio nuevo",
      "Informe breve de visitas del mes (si tenés medición de visitas)",
      "Prioridad en tus pedidos" ] },
  ],
  pagos: {
    mitades: [{ pct: 50, cuando: "Al empezar" }, { pct: 50, cuando: "Al entregar" }],
    hitos:   [{ pct: 40, cuando: "Al empezar" }, { pct: 30, cuando: "Al aprobar el diseño" }, { pct: 30, cuando: "Al entregar" }],
    tarjeta: { cuotas: 6, recargo: null },               // % de recargo por cuotas con tarjeta en Mercado Pago. null = "a confirmar"
    plan:    { anticipo: 30, cuotas: 5, recargo: null }, // plan propio: anticipo % + cuotas mensuales. null = "a confirmar"
  },
};

// ─────────────────────────────────────────────────────────────
// Módulos: cada parte del trabajo, con horas mínimas y máximas.
// Si tiene "detalle", las horas salen de la suma del detalle (se muestra al cliente como desglose).
// Cada línea del detalle: [texto, min, max, { info: "para qué sirve", gratis: true }] (el 4.º elemento es opcional).
// gratis: true → se muestran las horas pero no se cobra (aparece como "Sin cargo").
// ─────────────────────────────────────────────────────────────
const MODULOS = {
  // Siempre incluido
  relev:      { name: "Reunión inicial", gratis: true, desc: "Charlamos sobre tu negocio, a quién le vendés y qué tiene que lograr la página. No se cobra.", min: 1, max: 2 },
  setup:      { name: "Publicación en internet", desc: "Dejo la página online, con tu dominio y el candado de seguridad (https).", detalle: [
                ["Armado del proyecto", 0.5, 0.5], ["Hosting y publicación", 0.25, 0.5], ["Conexión de tu dominio y certificado de seguridad", 0.25, 0.5] ] },
  responsive: { name: "Se ve perfecta en celulares", desc: "La mayoría de tus visitas llegan desde el celular. Pruebo en distintos tamaños de pantalla y navegadores.", min: 1, max: 2 },
  seo:        { name: "Preparada para Google y la IA (SEO + GEO)", desc: "SEO: que te encuentren en Google cuando buscan lo que ofrecés. GEO: que asistentes como ChatGPT, Gemini o Perplexity te puedan recomendar.", detalle: [
                ["Título y descripción de cada página", 0.5, 0.5, { info: "Es lo primero que la gente lee en Google, antes de decidir si entra." }],
                ["Vista previa al compartir el link", 0.25, 0.5, { info: "En WhatsApp y redes tu link aparece con imagen y título, no como un enlace suelto." }],
                ["Mapa del sitio para Google", 0.25, 0.25, { info: "Google encuentra todas tus páginas más rápido." }],
                ["Datos de negocio local", 0.25, 0.5, { info: "Aparecés en búsquedas como «cerca de mí», con dirección y horarios." }],
                ["Contenido preparado para IA (GEO)", 0.5, 1, { info: "Información ordenada y respuestas claras, para que la IA entienda qué hacés y te mencione." }] ] },
  qa:         { name: "Pruebas finales y lanzamiento", desc: "Reviso links, formularios y cada pantalla antes de publicar la versión definitiva.", min: 1, max: 1.5 },
  revisiones: { name: "Dos rondas de cambios menores", gratis: true, desc: "Ajustes chicos sobre la versión publicada: mover un botón, cambiar un color, reemplazar una imagen que no te gustó. No se cobran. Cambios de estructura o funciones nuevas se presupuestan aparte.", min: 1.5, max: 3 },

  // Landing con plantilla
  relevCorto: { name: "Llamada inicial", gratis: true, desc: "Una charla corta para conocer tu negocio y qué tiene que mostrar la página. No se cobra.", min: 0.5, max: 1 },
  plElegir:   { name: "Elegís tu plantilla", desc: "Te muestro diseños ya probados y elegís el que más te guste.", min: 0.5, max: 1 },
  plAdaptar:  { name: "Adaptación a tu marca", desc: "Pongo tu logo, tus colores y tus datos en la plantilla elegida.", min: 1.5, max: 2.5 },
  plCarga:    { name: "Carga de tus textos e imágenes", desc: "Vos me pasás el contenido y lo ubico en cada sección: portada, servicios, sobre vos y contacto.", min: 1.5, max: 2 },
  plCelular:  { name: "Revisión en celulares", desc: "La plantilla ya se adapta al celular; reviso que con tu contenido se vea bien.", min: 0.5, max: 1 },
  plSeo:      { name: "SEO básico", desc: "Título, descripción y vista previa al compartir, para que Google y las redes muestren bien tu página.", min: 0.5, max: 1 },
  plCambios:  { name: "Una ronda de cambios menores", gratis: true, desc: "Un ajuste chico sobre la versión publicada: un texto, un color, una imagen. No se cobra.", min: 0.5, max: 1 },

  // Diseño
  estilo:     { name: "Identidad visual", desc: "Colores, tipografías y botones a partir de tu logo, para que la página se vea como tu marca.", min: 2, max: 3,
                opcionalInfo: "¿Ya tenés manual de marca? Si contás con tu manual de marca en digital (logo, colores y tipografías), destildá esta opción: tomo el diseño de ahí y no se cobra." },
  maqueta:    { name: "Diseño a medida", desc: "Te muestro cómo va a quedar, en celular y computadora, antes de programar. Nada de plantillas.", detalle: [
                ["Propuesta de diseño en celular y computadora", 3, 5],
                ["Reunión de presentación: elegís la propuesta y con esa avanzamos", 1, 1, { gratis: true, info: "Antes de programar nos juntamos de nuevo; lo que elijas en esa reunión es lo que se construye." }] ] },
  pantallas:  { mercado: "sistemas", name: "Diseño de pantallas", desc: "Pantallas simples y claras para que tu equipo las use todos los días sin capacitación larga.", min: 8, max: 14 },

  // Secciones
  estructura: { name: "Portada, menú y pie de página", desc: "El mensaje principal con botón de contacto, menú que se adapta al celular y tus datos al pie.", min: 2, max: 3 },
  servicios:  { name: "Sección de servicios o productos", cambios: true, desc: "Tarjetas con lo que ofrecés y sus precios. Para cambiarlos después hay dos caminos: los cambio yo, con un plan de mantenimiento mensual, o los cambiás vos, sumando el panel para editar tus servicios.", min: 1.5, max: 2 },
  nosotros:   { name: "Quiénes somos", desc: "Tu historia, tu equipo o tus profesionales. Genera confianza.", min: 1, max: 1.5 },
  contacto:   { name: "WhatsApp, mapa y redes", desc: "Botón flotante que abre el chat con un mensaje ya escrito, ubicación en Google Maps, horarios y redes.", min: 1, max: 2 },
  paginas:    { name: "Páginas internas", desc: "Servicios, Nosotros, Contacto u otras, cada una con diseño propio.", min: 2, max: 3, qty: 1 },

  // Funcionalidades grandes
  agenda:     { mercado: "sistemas", name: "Turnos online propios", desc: "Tus clientes reservan solos, a cualquier hora, y vos ves la agenda del día en un calendario.", detalle: [
                ["Base de datos de turnos, servicios y profesionales", 6, 10], ["Horarios por profesional y cálculo de turnos libres", 30, 50],
                ["Reserva online: elegir servicio, día y horario", 16, 24], ["Usuario y contraseña para tu equipo", 6, 10],
                ["Calendario interno: mover, cancelar y reagendar", 30, 45], ["Avisos de confirmación y recordatorio por mail", 8, 16] ] },
  tienda:     { mercado: "sistemas", name: "Tienda completa", desc: "Tus clientes compran y pagan online; vos cargás productos y seguís los pedidos desde un panel.", detalle: [
                ["Base de datos de productos, variantes y stock", 8, 14], ["Usuario y contraseña para el panel", 6, 10],
                ["Panel para cargar productos, precios y stock", 20, 32], ["Catálogo público con categorías y filtros", 10, 16],
                ["Carrito de compras", 12, 20], ["Pago con Mercado Pago integrado", 12, 20], ["Envíos y retiro en el local", 8, 16],
                ["Panel de pedidos", 16, 24], ["Mails de confirmación de compra", 6, 10] ] },
  procesos:   { mercado: "sistemas", name: "Análisis de cómo trabajás hoy", desc: "Relevo tus procesos, planillas y herramientas para que el sistema se adapte a vos, no al revés.", min: 6, max: 12 },
  usuarios:   { mercado: "sistemas", name: "Usuarios y permisos", desc: "Cada persona de tu equipo entra con su usuario y ve solo lo que le corresponde.", min: 8, max: 14 },
  crm:        { mercado: "sistemas", name: "Fichas de clientes", desc: "Datos, historial de visitas o compras, notas y búsqueda rápida de cada cliente.", min: 24, max: 40 },
  agendaInt:  { mercado: "sistemas", name: "Agenda interna", desc: "Turnos por profesional, en vista de día y semana, con cambios y cancelaciones.", min: 30, max: 50 },
  reportes:   { mercado: "sistemas", name: "Reportes y tablero", desc: "Ventas, turnos y clientes del mes en un vistazo.", min: 16, max: 24 },
  capacitacion: { name: "Capacitación", desc: "Videollamada o video grabado explicando cómo usar tu panel.", min: 1, max: 2 },

  // Extras
  manual:     { name: "Manual de marca", cubre: ["estilo"], desc: "Un documento con las reglas de tu marca para que se vea igual en la web, en redes y en todo lo que imprimas. Si no tenés logo, sumá también el diseño de logo. Incluye la identidad visual de la página, que deja de cobrarse aparte.", detalle: [
                ["Reunión de marca: valores, público y personalidad", 1, 1, { gratis: true }],
                ["Paleta de colores", 1.5, 1.5, { info: "Colores principales y secundarios, con sus códigos y cuándo usar cada uno." }],
                ["Tipografías y jerarquía de textos", 1, 1.5, { info: "Qué letra va en títulos, textos y botones." }],
                ["Uso del logo", 2, 2.5, { info: "Versiones, tamaños mínimos, espacio alrededor y usos incorrectos." }],
                ["Estilo de imágenes e íconos", 1, 1, { info: "Qué tipo de fotos e íconos van con tu marca." }],
                ["Tono de voz", 1, 1.5, { info: "Cómo habla tu marca: cercana, formal, divertida." }],
                ["Ejemplos aplicados", 1.5, 2, { info: "Cómo se ve en redes, tarjeta personal y web." }],
                ["Documento PDF y archivos finales", 1, 1, { info: "Todo listo para pasarle a cualquier diseñador o imprenta." }] ] },
  panelServ:  { name: "Panel para editar tus servicios", desc: "Entrás con usuario y contraseña y cambiás vos textos, precios e imágenes de tus servicios, cuando quieras. Sin este panel, los cambios los hago yo dentro de un plan de mantenimiento mensual.", detalle: [
                ["Base de datos para tus servicios", 1, 1.5, { info: "Donde se guardan textos, precios e imágenes." }],
                ["Usuario y contraseña (acceso seguro)", 1.5, 2, { info: "Solo vos podés entrar a editar." }],
                ["Pantallas para crear, editar y borrar servicios", 3, 4.5],
                ["Subida de imágenes", 1, 1.5, { info: "Subís la foto y se ajusta sola al tamaño de la página." }],
                ["Conexión con tu página", 1, 1.5, { info: "Lo que cambiás en el panel se ve en la web al instante." }],
                ["Seguridad y pruebas", 0.5, 1, { info: "Que nadie más pueda modificar tus datos." }],
                ["Capacitación", 0.5, 1, { info: "Te muestro cómo usar el panel, en videollamada o con un video grabado." }] ] },
  categorias: { name: "Organizado por categorías", req: ["panelServ"], desc: "Para cuando tenés muchos servicios: los agrupás en categorías desde tu panel y en la página aparecen ordenados, con un menú para saltar a cada una.", detalle: [
                ["Categorías en tu panel", 1, 1.5, { info: "Creás, renombrás y ordenás categorías vos." }],
                ["Menú de categorías en la página", 1.5, 2.5, { info: "Tus clientes van directo a lo que buscan." }],
                ["Vista por categoría", 0.5, 1] ] },
  textos:     { name: "Te escribo los textos", desc: "Títulos, servicios, quiénes somos y llamados a la acción, pensados para que te contacten.", min: 2, max: 4 },
  imagenes:   { name: "Busco y preparo las imágenes", desc: "Si no tenés fotos propias, busco imágenes libres de uso que vayan con tu marca. Las recorto y comprimo (tuyas o nuevas) para que se vean bien y la página cargue rápido.", min: 1, max: 2 },
  logo:       { name: "Diseño de logo", desc: "Si todavía no tenés. Propuestas, ajustes y archivos finales.", min: 4, max: 8 },
  testimonios:{ name: "Tus reseñas de Google en la web", desc: "Conecto tu ficha de Google para mostrar las reseñas de tus clientes en grilla o carrusel. Es lo que más convence a quien no te conoce.", min: 2, max: 3 },
  faq:        { name: "Preguntas frecuentes", desc: "Respondé las dudas de siempre antes de que te escriban.", min: 1, max: 1.5 },
  galeria:    { name: "Galería de trabajos", desc: "Fotos con vista ampliada, antes y después.", min: 1.5, max: 2.5 },
  animaciones:{ name: "Animaciones sutiles", desc: "Secciones que aparecen al bajar y botones con efecto. Se siente más cuidada.", min: 0.5, max: 1 },
  blog:       { name: "Blog o novedades", desc: "Publicá notas y novedades; suma visitas desde Google.", min: 6, max: 10 },
  form:       { name: "Formulario de contacto", desc: "Te llega un mail cada vez que alguien escribe. Con protección contra spam.", min: 2, max: 3 },
  gbp:        { name: "Tu negocio en Google (Google Business)", desc: "Creo u optimizo tu perfil de empresa: el recuadro que aparece en Google y Google Maps con horarios, fotos, teléfono y reseñas. No es el mapa de la página, que ya está incluido.", min: 1, max: 2 },
  analytics:  { name: "Medir visitas", desc: "Google Analytics o Meta Pixel: cuánta gente entra y cuántos te contactan.", min: 1, max: 2 },
  velocidad:  { name: "Carga ultrarrápida", desc: "Optimización para que abra en un segundo en el celular.", min: 1, max: 2 },
  legales:    { name: "Páginas legales", desc: "Privacidad, términos y cookies, armadas con los textos que te pase tu asesor. Obligatorias si pedís datos o cobrás online.", min: 0.5, max: 1 },
  integracion:{ name: "Otra integración", desc: "¿Necesitás conectar tu página con una herramienta que no está en la lista? Por ejemplo, tu CRM, un sistema de envíos o una planilla de Google. Contame cuál y la evaluamos.", min: 4, max: 6, qty: 1 },
  turnosExt:  { name: "Reservas con Calendly o Google Calendar", desc: "Una agenda que ya existe, integrada a tu página. La opción económica.", min: 1, max: 2 },
  linkMP:     { name: "Cobros con Mercado Pago", desc: "Un botón de pago que lleva a la pantalla segura de Mercado Pago; tu cliente paga ahí y vuelve a tu página.", min: 3.5, max: 4.5 },
  sena:       { mercado: "sistemas", name: "Cobrar seña al reservar", desc: "El turno se confirma solo cuando paga la seña por Mercado Pago.", detalle: [["Pago con Mercado Pago integrado", 12, 20], ["Seña y confirmación del turno", 8, 14]] },
  vencimiento:{ mercado: "sistemas", name: "Reservas que vencen", desc: "Si no se confirma a tiempo, el turno se libera solo.", min: 6, max: 10 },
  promos:     { req: ["panelServ"], name: "Promociones y combos", desc: "Descuentos, combos y destacados en la portada.", min: 5, max: 8 },
  buscador:   { req: ["panelServ"], name: "Buscador", desc: "Encontrar por nombre o categoría.", min: 2, max: 4 },
  buscadorIA: { req: ["panelServ"], name: "Buscador con inteligencia artificial", desc: "La persona escribe lo que quiere lograr y aparece lo que le sirve.", min: 8, max: 12 },
  facturacion:{ mercado: "sistemas", name: "Facturación electrónica (ARCA)", desc: "Emití facturas desde el sistema, sin entrar a la web de ARCA.", min: 30, max: 50 },
  whatsappIA: { mercado: "sistemas", name: "Atención automática por WhatsApp con IA", desc: "Responde consultas, informa precios y agenda turnos las 24 horas.", min: 40, max: 80 },
  migracion:  { mercado: "sistemas", name: "Pasar tus datos actuales", desc: "Importo tus clientes y datos desde Excel u otro sistema.", min: 8, max: 20 },
  pagosMP:    { mercado: "sistemas", name: "Cobros con Mercado Pago", desc: "Registrá pagos online y su estado automáticamente.", min: 12, max: 20 },
  avisos:     { mercado: "sistemas", name: "Recordatorios automáticos", desc: "Mails o WhatsApp de recordatorio de turnos y vencimientos.", min: 8, max: 16 },
};

const SIEMPRE = ["relev", "setup", "responsive", "seo", "qa", "revisiones"];

// ─────────────────────────────────────────────────────────────
// Paso 1: tipos de proyecto. "incluye" = módulos fijos (los que tienen "opcionalInfo" el cliente los puede destildar).
// "mercado" = en qué grupo de tarjetas aparece. "precio" = precio fijo (ignora las horas). "pago" = esquema de pago.
// "provee" = extras que el paquete ya trae adentro (cumplen los requisitos "req" de otros extras).
// ─────────────────────────────────────────────────────────────
const PAQUETES = [
  { id: "plantilla", icon: "dashboard_customize", name: "Landing con plantilla", tagline: "Tu página online en una semana, a precio cerrado.",
    ideal: "Para arrancar: emprendimientos que necesitan estar en internet ya y tienen sus textos e imágenes.",
    incluye: ["relevCorto", "plElegir", "plAdaptar", "plCarga", "contacto", "plCelular", "plSeo", "setup", "plCambios"],
    noIncluye: "Diseño a medida, redacción de textos, búsqueda de imágenes y secciones que no estén en la plantilla (se pueden sumar como extras).",
    mercado: "web", precio: 350000, pago: "mitades" },
  { id: "landing", icon: "web", name: "Landing a medida", tagline: "Una página diseñada para tu marca, que te haga destacar.",
    ideal: "Negocios y profesionales que quieren diferenciarse de la competencia y recibir más consultas.",
    incluye: [...SIEMPRE, "estilo", "maqueta", "estructura", "servicios", "nosotros", "contacto"], mercado: "web", pago: "mitades" },
  { id: "sitio", icon: "auto_stories", name: "Sitio de varias páginas", tagline: "Más espacio para contar todo lo que hacés.",
    ideal: "Negocios con muchos servicios o información que no entra en una sola página.",
    incluye: [...SIEMPRE, "estilo", "maqueta", "estructura", "servicios", "nosotros", "contacto", "paginas"], qty: { paginas: 3 }, mercado: "web", pago: "mitades" },
  { id: "turnos", icon: "event_available", name: "Turnos online", tagline: "Tus clientes reservan solos, las 24 horas.",
    ideal: "Centros de estética, consultorios, estudios y cualquier negocio que trabaje con turnos.",
    incluye: [...SIEMPRE, "estilo", "maqueta", "estructura", "servicios", "nosotros", "contacto", "agenda", "capacitacion"], mercado: "sistemas", pago: "hitos" },
  { id: "tienda", icon: "shopping_cart", name: "Tienda online", tagline: "Vendé y cobrá por internet, con tu propia tienda.",
    ideal: "Marcas con productos que quieren vender online sin pagar comisión mensual a una plataforma.",
    incluye: [...SIEMPRE, "estilo", "maqueta", "estructura", "nosotros", "contacto", "tienda", "legales", "capacitacion"], provee: ["panelServ", "categorias"], mercado: "sistemas", pago: "hitos" },
  { id: "gestion", icon: "dashboard", name: "Sistema de gestión", tagline: "Clientes, agenda y números de tu negocio en un solo lugar.",
    ideal: "Negocios que hoy se organizan con planillas, papel o varias apps sueltas.",
    incluye: ["relev", "procesos", "setup", "pantallas", "usuarios", "crm", "agendaInt", "reportes", "responsive", "qa", "revisiones", "capacitacion"], mercado: "sistemas", pago: "hitos" },
];

// ─────────────────────────────────────────────────────────────
// Paso 2: extras. "en" = en qué paquetes aparece (si falta, en todos menos gestión).
// ─────────────────────────────────────────────────────────────
const WEB = ["plantilla", "landing", "sitio", "turnos", "tienda"];
const EXTRAS = [
  { title: "Contenido", icon: "edit", items: [
    { id: "textos" }, { id: "imagenes" } ]},
  { title: "Diseño", icon: "palette", items: [
    { id: "logo" }, { id: "manual", en: [...WEB, "gestion"] }, { id: "animaciones", en: ["landing", "sitio", "turnos", "tienda"] } ]},
  { id: "grp-panel", title: "Cambiá vos tus precios", icon: "edit_note", items: [
    { id: "panelServ", en: ["landing", "sitio"] }, { id: "categorias", en: ["landing", "sitio"] } ]},
  { title: "Más secciones", icon: "view_agenda", items: [
    { id: "faq" }, { id: "galeria" },
    { id: "paginas", en: ["landing", "turnos", "tienda"] }, { id: "blog", en: ["landing", "sitio", "turnos", "tienda"] } ]},
  { title: "Que te encuentren", icon: "campaign", items: [
    { id: "gbp" }, { id: "velocidad", en: ["landing", "sitio", "turnos", "tienda"] },
    { id: "legales", en: ["plantilla", "landing", "sitio", "turnos"] } ]},
  { title: "Integraciones", icon: "hub", note: "Conecto tu página con otras herramientas.", items: [
    { id: "form" }, { id: "testimonios" }, { id: "analytics" },
    { id: "turnosExt", en: ["plantilla", "landing", "sitio"] }, { id: "linkMP", en: ["plantilla", "landing", "sitio", "turnos"] },
    { id: "integracion", en: [...WEB, "gestion"] } ]},
  { title: "Para tus turnos", icon: "event", items: [
    { id: "sena", en: ["turnos"] }, { id: "vencimiento", en: ["turnos"] } ]},
  { title: "Potenciá tu catálogo", icon: "bolt", note: "En landing y sitio requieren el panel para editar tus servicios.", items: [
    { id: "promos", en: ["landing", "sitio", "tienda"] }, { id: "buscador", en: ["landing", "sitio", "tienda"] }, { id: "buscadorIA", en: ["landing", "sitio", "tienda"] } ]},
  { title: "Sumale al sistema", icon: "extension", items: [
    { id: "facturacion", en: ["gestion"] }, { id: "pagosMP", en: ["gestion"] }, { id: "avisos", en: ["gestion"] },
    { id: "whatsappIA", en: ["gestion"] }, { id: "migracion", en: ["gestion"] } ]},
];
