#!/usr/bin/env node
/**
 * CAP — translation catalogue check.
 *
 * The catalogues in assets/i18n are keyed by the Spanish string as it appears
 * in the HTML. Editing Spanish copy therefore orphans its translations: the
 * key no longer matches anything on the page, and the site silently falls back
 * to Spanish for that string in every other language.
 *
 * This script re-extracts the keys from the HTML the same way the runtime does
 * and reports, per language, what is missing (Spanish edited, translation not
 * updated) and what is stale (translation for a string no longer on the site).
 *
 * Run it after any change to the Spanish copy:
 *
 *   node tools/i18n-check.js
 *
 * Exits non-zero if anything is missing, so it can be wired into CI.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const I18N = path.join(ROOT, "assets", "i18n");
const LANGS = ["en", "fr", "it", "de", "pt"];

// Strings that are deliberately left as-is: brand and product names, people,
// addresses. They appear in the HTML but never in a catalogue.
const PROPER = new Set([
  "CAP", "CAP Consultor", "LinkedIn", "Claude", "n8n", "Supabase", "Apollo",
  "Instantly", "Apache Airflow", "Canva", "Higgsfield", "SaaS B2B",
  "Digital Cube", "Synaptix", "Pupsik", "Rift Valley", "Rift Valley Expeditions",
  "Silvia Creus", "Psicóloga Silvia Creus", "Lluís Moxó", "Lluís Moxó Pérez-Sala",
  "Marcel Partal", "Jaume Dalmau", "Pol Ruiz", "Marc Codina", "Andrés Jordán",
  "Adrián Jordán", "contact@capconsultor.eu", "capconsultor.eu", "www.aepd.es",
  "Agencia IA Solutions", "GitHub Pages (GitHub, Inc.)", "Ecommerce",
  "Reporting", "Chatbots", "Marketing", "Email:", "Industrial",
]);

function decode(s) {
  return s
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Collect the translatable strings from every page, in document order. */
function extractKeys() {
  const keys = [];
  const seen = new Set();
  const add = (raw) => {
    const s = decode(raw).trim();
    if (!s || !/[A-Za-zÀ-ÿ]/.test(s) || seen.has(s)) return;
    seen.add(s);
    keys.push(s);
  };

  const files = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".html") && !f.startsWith("google"))
    .sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ROOT, file), "utf8");

    const bodyStart = raw.indexOf("<body");
    const body = (bodyStart === -1 ? raw : raw.slice(bodyStart)).replace(
      /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/g,
      ""
    );

    for (const m of body.matchAll(/>([^<>]+)</g)) add(m[1]);
    for (const attr of ["placeholder", "aria-label", "title", "alt"]) {
      for (const m of body.matchAll(new RegExp(attr + '="([^"]*)"', "g"))) add(m[1]);
    }

    const head = raw.slice(0, raw.indexOf("</head>"));
    const title = head.match(/<title>([^<]+)<\/title>/);
    if (title) add(title[1]);
    for (const m of head.matchAll(
      /<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)"/g
    )) {
      add(m[1]);
    }
  }

  return keys.filter((k) => !PROPER.has(k));
}

const keys = extractKeys();
const keySet = new Set(keys);
let failed = false;

console.log(`Cadenas traducibles en el HTML: ${keys.length}\n`);

for (const lang of LANGS) {
  const file = path.join(I18N, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.log(`${lang}: FALTA el archivo ${file}`);
    failed = true;
    continue;
  }

  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  const missing = keys.filter((k) => !(k in dict));
  const stale = Object.keys(dict).filter((k) => !keySet.has(k));
  const empty = Object.entries(dict)
    .filter(([, v]) => typeof v !== "string" || !v.trim())
    .map(([k]) => k);

  const ok = !missing.length && !stale.length && !empty.length;
  console.log(
    `${lang}: ${Object.keys(dict).length} claves` +
      (ok ? "  ✓" : `  — faltan ${missing.length}, sobran ${stale.length}, vacías ${empty.length}`)
  );

  for (const k of missing) console.log(`   FALTA   ${JSON.stringify(k)}`);
  for (const k of stale) console.log(`   SOBRA   ${JSON.stringify(k)}`);
  for (const k of empty) console.log(`   VACÍA   ${JSON.stringify(k)}`);

  if (missing.length || empty.length) failed = true;
}

if (failed) {
  console.log("\nHay traducciones que faltan. Añádelas antes de desplegar.");
  process.exit(1);
}
console.log("\nTodo correcto.");
