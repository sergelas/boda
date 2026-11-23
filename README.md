# Guadalupe & Sergio · 4 de diciembre de 2027

Web de la boda. HTML, CSS y JavaScript sin dependencias: se sube tal cual a GitHub Pages.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Todo el contenido (textos, secciones) |
| `styles.css` | Diseño y colores |
| `script.js` | Cuenta atrás, formulario, juego. **Arriba del todo está `CONFIG`**: fecha límite, IBAN y campos del formulario |
| `boda.ics` | Evento para "Añadir al calendario" |
| `img/` | Fotos |

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo `boda`).
2. Sube todos los archivos de esta carpeta (botón **Add file → Upload files**, arrastra todo).
3. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
4. En un par de minutos estará en `https://TU-USUARIO.github.io/boda/`.

## Dónde llegan las confirmaciones

El formulario de la web envía las respuestas a vuestro Google Form, así que aparecen en
**Respuestas** del formulario (y en la hoja de cálculo si la tenéis enlazada).

**Importante:** en el Google Form la pregunta *"Nombre y apellidos de los asistentes"* tiene que ser de tipo
**Párrafo** (ahora mismo es una escala del 1 al 6 y Google rechazaría los nombres).
Después de cambiarla, comprueba que el código `entry.` no ha cambiado
(en el formulario: ⋮ → *Obtener enlace rellenado previamente*, rellena y mira la URL) y, si cambia, actualízalo en `script.js`.

## Ranking del juego "Atrapa el ramo"

Los jugadores escriben su nombre y su mejor puntuación se guarda en una hoja de Google.
Mientras no lo configures, el ranking solo guarda las partidas de cada móvil.

1. Crea una hoja nueva en Google Sheets (p. ej. "Ranking boda").
2. **Extensiones → Apps Script**, borra lo que haya y pega el contenido de `ranking-apps-script.gs`. Guarda.
3. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como: *Yo*. Acceso: *Cualquier usuario*. Acepta los permisos.
4. Copia la URL que acaba en `/exec` y pégala en `CONFIG.rankingUrl` de `script.js`.

Para quitar a alguien del ranking, borra su fila en la hoja.

## Cambiar cosas rápidas

- **Fecha límite para confirmar:** `CONFIG.fechaLimite` en `script.js`.
- **IBAN:** `CONFIG.iban` en `script.js` (aparece el botón "Copiar IBAN" automáticamente).
- **Horarios / textos:** en `index.html`.
