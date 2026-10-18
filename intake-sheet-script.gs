// Happy Birth with Anna: receives the new client form from happybirth-doula.co.uk
// and keeps the Sheet easy to read.
//   "Answers" tab     – one row per client, newest at the top
//   "Client card" tab – pick a name, read their answers top to bottom
//   "Consultations" tab – answers from the shorter consultation form, newest at the top
// After pasting: run setupSheet once, then Deploy → Manage deployments → Edit → New version.

const NOTIFY = "anna@happybirth-doula.co.uk";   // who gets the "new form" email
const ANSWERS = "Answers";
const CARD = "Client card";
const CONSULTS = "Consultations";
const CHECKS = "Breastfeeding checks";
const CHECK_ORDER = ["Received", "Full name", "Phone", "Email", "Preferred contact", "Result", "Noticed", "Language", "Consent to hold this information", "Form"];
const BLUSH = "#F5EEEB";

const SECTIONS = [
  ["About you", ["Full name", "Date of birth", "Estimated due date", "Mobile", "Email", "Home address", "Relationship status", "Occupation"]],
  ["Partner", ["Partner's name", "Partner's phone", "Partner's email"]],
  ["Emergency contact", ["Emergency contact name", "Emergency contact relationship", "Emergency contact mobile", "Emergency contact other phone"]],
  ["Midwife or doctor", ["Type of care provider", "Midwife, doctor or team", "Hospital, practice or NHS trust", "Care provider phone", "Care provider knows about doula", "Planned place of birth"]],
  ["Previous pregnancies", ["First pregnancy", "Children (names and ages)", "Types of birth experienced", "Number of births", "Pregnancies carried to term (37+ weeks)", "Preterm births (24-37 weeks)", "Multiples", "Length of previous labours", "Conditions in previous pregnancies"]],
  ["Anything else", ["Anything else"]],
  ["Consent and form details", ["Agrees to personal data being held", "Explicit consent to hold health information", "Received", "Language", "Form"]]
];
const FIRST = ["Received", "Full name", "Estimated due date"];
const ORDER = FIRST.concat(SECTIONS.flatMap(s => s[1]).filter(k => FIRST.indexOf(k) === -1));
const CONSULT_ORDER = ["Received", "Full name", "Consultation topic", "Goal for this consultation", "How you will know it helped",
  "Closeness to goal now (0-10)", "Due date or baby's date of birth", "First baby", "Anything to know beforehand",
  "Email", "Phone", "Preferred contact", "Preferred language", "How they heard about Anna",
  "Consent to hold this information", "Language", "Form"];
const DATES = ["Date of birth", "Estimated due date", "Due date or baby's date of birth"];
const WIDE = ["Noticed", "Goal for this consultation", "How you will know it helped", "Anything to know beforehand", "Home address", "Children (names and ages)", "Types of birth experienced", "Conditions in previous pregnancies", "Anything else"];

// ---------- receiving a form ----------
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return ok();                                  // spam robot
    data["Received"] = new Date();
    const consult = data["Form"] === "Consultation", check = data["Form"] === "Breastfeeding check";
    const sh = check ? checkSheet() : consult ? consultSheet() : answersSheet();
    const h = ensureHeaders(sh, Object.keys(data), check ? CHECK_ORDER : consult ? CONSULT_ORDER : ORDER);
    sh.insertRowBefore(2);                                          // newest at the top
    sh.getRange(2, 1, 1, h.length).setValues([h.map(k => toCell(k, data[k]))]);
    formatRows(sh, 2, 1, h);
    if (check) {
      MailApp.sendEmail(NOTIFY, "Breastfeeding check: " + (data["Full name"] || "unnamed"),
        (data["Full name"] || "Someone") + " took the breastfeeding check and left their details.\nResult: " + (data["Result"] || "") +
        "\nContact: " + (data["Preferred contact"] || "") + " " + (data["Phone"] || "") +
        "\n\nOpen the Breastfeeding checks tab to read the answers:\n" + SpreadsheetApp.getActiveSpreadsheet().getUrl());
      return ok();
    }
    if (consult) {
      MailApp.sendEmail(NOTIFY, "Consultation form: " + (data["Full name"] || "unnamed"),
        (data["Full name"] || "Someone") + " has filled in the consultation form (" +
        (data["Consultation topic"] || "topic not given") + ").\n\nOpen the Consultations tab to read it:\n" +
        SpreadsheetApp.getActiveSpreadsheet().getUrl());
      return ok();
    }
    const card = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CARD);
    if (card) card.getRange("B1").setValue(data["Full name"] || "");   // card opens on the newest client

    MailApp.sendEmail(NOTIFY, "New client form: " + (data["Full name"] || "unnamed"),
      "A new client form has arrived from " + (data["Full name"] || "someone") +
      " (due " + (data["Estimated due date"] || "?") + ").\n\nOpen the Sheet to read it:\n" +
      SpreadsheetApp.getActiveSpreadsheet().getUrl());
    return ok();
  } finally {
    lock.releaseLock();
  }
}

function ok() { return ContentService.createTextOutput("ok"); }

// ---------- one-time tidy-up: run this once from the editor ----------
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = answersSheet();

  // reorder any existing answers into the standard column order
  const old = sh.getDataRange().getValues();
  const oldHead = old.length ? old[0] : [];
  const rows = old.slice(1).filter(r => r.join("") !== "").map(r => {
    const o = {}; oldHead.forEach((k, i) => { if (k) o[k] = r[i]; }); return o;
  });
  rows.sort((a, b) => new Date(b["Received"] || 0) - new Date(a["Received"] || 0));
  sh.clear(); sh.clearFormats();
  const h = ORDER.concat(oldHead.filter(k => k && ORDER.indexOf(k) === -1));
  sh.getRange(1, 1, 1, h.length).setValues([h])
    .setFontWeight("bold").setBackground(BLUSH).setWrap(true).setVerticalAlignment("middle");
  if (rows.length) {
    sh.getRange(2, 1, rows.length, h.length).setValues(rows.map(o => h.map(k => toCell(k, o[k]))));
    formatRows(sh, 2, rows.length, h);
  }
  sh.setFrozenRows(1); sh.setFrozenColumns(2);
  sh.setRowHeight(1, 48);
  h.forEach((k, i) => sh.setColumnWidth(i + 1, k === "Received" ? 130 : WIDE.indexOf(k) > -1 ? 300 : 170));

  buildCard(ss, sh);

  // Consultations tab
  const cs = consultSheet();
  if (!cs.getLastRow()) ensureHeaders(cs, [], CONSULT_ORDER);
  cs.setFrozenRows(1); cs.setFrozenColumns(2); cs.setRowHeight(1, 48);
  const ch = cs.getRange(1, 1, 1, cs.getLastColumn()).getValues()[0];
  ch.forEach((k, i) => cs.setColumnWidth(i + 1, k === "Received" ? 130 : WIDE.indexOf(k) > -1 ? 300 : 170));

  ss.setActiveSheet(ss.getSheetByName(CARD));
}

// ---------- the Client card tab ----------
function buildCard(ss, answers) {
  let c = ss.getSheetByName(CARD);
  if (!c) c = ss.insertSheet(CARD, 0);
  c.clear(); c.clearFormats(); c.getRange("A:B").clearDataValidations();
  c.setHiddenGridlines(true);
  c.setColumnWidth(1, 280); c.setColumnWidth(2, 520);

  c.getRange("A1").setValue("Choose a client ▸").setFontWeight("bold").setFontSize(12);
  const pick = c.getRange("B1");
  pick.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(answers.getRange("B2:B"), true).setAllowInvalid(false).build());
  pick.setValue(answers.getRange("B2").getValue() || "")
    .setFontWeight("bold").setFontSize(12).setBackground(BLUSH);
  c.setRowHeight(1, 34);
  c.getRange("A1:B1").setVerticalAlignment("middle");
  c.setFrozenRows(1);

  let r = 3;
  SECTIONS.forEach(([title, keys]) => {
    c.getRange(r, 1, 1, 2).merge().setValue(title)
      .setFontWeight("bold").setFontSize(12).setBackground(BLUSH);
    r++;
    keys.forEach(k => {
      c.getRange(r, 1).setValue(k).setFontColor("#7A706D");
      const cell = c.getRange(r, 2);
      cell.setFormula('=IFERROR(INDEX(' + ANSWERS + '!$A$2:$ZZ$5000, MATCH($B$1, ' + ANSWERS +
        '!$B$2:$B$5000, 0), MATCH($A' + r + ', ' + ANSWERS + '!$1:$1, 0)), "")');
      if (DATES.indexOf(k) > -1) cell.setNumberFormat("dd/mm/yyyy");
      if (k === "Received") cell.setNumberFormat("dd/mm/yyyy hh:mm");
      r++;
    });
    r++;
  });
  c.getRange(3, 1, r, 2).setWrap(true).setVerticalAlignment("top");
}

// ---------- helpers ----------
function answersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ANSWERS);
  if (!sh) { sh = ss.getSheets().filter(s => [CARD, CONSULTS, CHECKS].indexOf(s.getName()) === -1)[0] || ss.insertSheet(); sh.setName(ANSWERS); }
  return sh;
}

function checkSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(CHECKS) || ss.insertSheet(CHECKS);
}

function consultSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(CONSULTS) || ss.insertSheet(CONSULTS);
}

function ensureHeaders(sh, keys, order) {
  let h = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].filter(String) : [];
  if (!h.length) h = (order || ORDER).slice();
  keys.forEach(k => { if (k !== "website" && h.indexOf(k) === -1) h.push(k); });
  sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight("bold").setBackground(BLUSH).setWrap(true);
  return h;
}

function toCell(k, v) {
  if (v == null) return "";
  if (DATES.indexOf(k) > -1 && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const p = v.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); }
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;       // never run text as a formula
  return v;
}

function formatRows(sh, row, n, h) {
  sh.getRange(row, 1, n, h.length).setFontWeight("normal").setBackground(null).setWrap(true).setVerticalAlignment("top");
  h.forEach((k, i) => {
    if (k === "Received") sh.getRange(row, i + 1, n, 1).setNumberFormat("dd/mm/yyyy hh:mm");
    else if (DATES.indexOf(k) > -1) sh.getRange(row, i + 1, n, 1).setNumberFormat("dd/mm/yyyy");
  });
  sh.getRange(row, 2, n, 1).setFontWeight("bold");                      // client's name
}
