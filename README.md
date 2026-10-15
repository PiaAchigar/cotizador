# Cotizador web

Página estática donde el cliente elige qué módulos quiere en su sitio y ve el presupuesto al instante.

## Ajustar precios

Todo está en `js/servicios.js`:

- `CONFIG.valorHora`: dos valores (no se muestran). Se aplican **por parte**: cada módulo usa `web` salvo que tenga `mercado: "sistemas"` (agenda, tienda, gestión). Así la misma parte cuesta igual en todas las tarjetas.
- `CONFIG`: además, imprevistos (solo para el plazo), horas por semana, WhatsApp y formas de pago.
- `CONFIG.pagos.tarjeta.recargo` / `CONFIG.pagos.plan.recargo`: % de recargo de las cuotas. En `null` la página muestra "recargo a confirmar".
- `MODULOS`: cada parte del trabajo con horas `min`/`max`, o un `detalle` con el desglose (las horas se suman solas).
- `PAQUETES`: los tipos de proyecto del paso 1 y qué módulos incluyen. `mercado` elige en qué grupo de tarjetas aparece; `precio` fija un precio cerrado (como la landing con plantilla); `provee` lista extras que el paquete ya trae.
- `req` en un módulo: extras que necesita (ej.: categorías requiere el panel). Al prenderlo se suman solos.
- `EXTRAS`: lo opcional del paso 2. `en` limita en qué paquetes aparece.

Precio de cada módulo = horas **mínimas** × valor hora, redondeado. Las horas máximas son solo referencia.
Plazo = horas promedio con imprevistos ÷ horas por semana.

## Probar en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicar en GitHub Pages

```bash
git init && git add . && git commit -m "Cotizador inicial"
git branch -M main
git remote add origin git@github.com:USUARIO/cotizador.git
git push -u origin main
```

En GitHub: Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)`.
Queda en `https://USUARIO.github.io/cotizador/`.

## Links para clientes

La URL guarda la selección (`#p=turnos&e=sena,form&pay=plan`).

Para armar una propuesta personalizada, abrí la página con `#admin` al final:
`https://USUARIO.github.io/cotizador/#admin`. Aparece un campo para el nombre del cliente.
Elegí paquete y extras, y tocá "Copiar link para el cliente" (solo aparece en modo admin): el link no tiene el modo admin y
abre con el título "Presupuesto para <cliente>" y todo ya marcado.

## Presupuesto descargable

"Descargar presupuesto" abre `presupuesto.html` con la misma selección (`#p=...`) en una pestaña nueva.
Ahí, "Descargar PDF" abre la ventana de imprimir del navegador: elegir "Guardar como PDF".
Los cálculos están en `js/calc.js`, compartidos entre la calculadora y el presupuesto.
