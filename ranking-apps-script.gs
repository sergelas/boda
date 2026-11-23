/**
 * Ranking de "Atrapa el ramo" — Google Apps Script
 *
 * Cómo instalarlo (5 minutos, solo una vez):
 *  1. Crea una hoja de cálculo nueva en Google Sheets (p. ej. "Ranking boda").
 *  2. Menú Extensiones → Apps Script. Borra lo que haya y pega este archivo entero. Guarda.
 *  3. Botón "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *       - Ejecutar como: Yo
 *       - Quién tiene acceso: Cualquier usuario
 *     Pulsa "Implementar" y acepta los permisos (es tu propia hoja).
 *  4. Copia la "URL de la aplicación web" (acaba en /exec) y pégala en CONFIG.rankingUrl de script.js.
 *
 * La hoja guarda una fila por jugador con su mejor puntuación. Para borrar a alguien, borra su fila.
 */

const SHEET_NAME = "Ranking";
const MAX_SCORE = 400;   // en 30 segundos no se puede sacar más; evita trampas obvias
const TOP = 10;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Nombre", "Puntos", "Actualizado"]);
  }
  return sh;
}

function rows_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 2).getValues()
    .map(([name, score]) => ({ name: String(name), score: Number(score) || 0 }))
    .sort((a, b) => b.score - a.score);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, top: rows_().slice(0, TOP) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 20)
      .replace(/^[=+\-@]/, "'$&"); // evita fórmulas en la hoja
    const score = Math.max(0, Math.min(MAX_SCORE, Math.floor(Number(body.score) || 0)));
    if (!name) return json_({ ok: false, error: "Falta el nombre" });

    const sh = sheet_();
    const last = sh.getLastRow();
    const names = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0]).toLowerCase()) : [];
    const i = names.indexOf(name.toLowerCase());
    if (i === -1) {
      sh.appendRow([name, score, new Date()]);
    } else {
      const cell = sh.getRange(i + 2, 2);
      if (score > Number(cell.getValue())) {
        cell.setValue(score);
        sh.getRange(i + 2, 3).setValue(new Date());
      }
    }

    const all = rows_();
    const rank = all.findIndex((r) => r.name.toLowerCase() === name.toLowerCase()) + 1;
    return json_({ ok: true, top: all.slice(0, TOP), rank, total: all.length });
  } finally {
    lock.releaseLock();
  }
}
