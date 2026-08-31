/**
 * CAP — multilanguage.
 *
 * The site ships as static HTML written in Spanish. Rather than duplicating
 * every page per language, this script swaps the text at runtime:
 *
 *  1. Walk the document and collect every text node, plus the attributes that
 *     are user-visible (placeholder, aria-label, alt, title, meta content).
 *  2. Look each Spanish string up in the catalogue for the chosen language.
 *  3. Replace it, remembering the original so we can switch back without a
 *     reload.
 *
 * Spanish is the source of truth: it stays in the HTML, so the page reads
 * correctly with JavaScript disabled and search engines index it normally.
 *
 * Keying by the Spanish string (not by an id) means no markup changes are
 * needed. The trade-off is that editing Spanish copy in the HTML orphans its
 * translations — `npm run i18n:check` (tools/i18n-check.js) reports those.
 */
(function () {
  "use strict";

  var LANGS = [
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
  ];
  var DEFAULT = "es";
  var STORAGE_KEY = "cap-lang";
  var BASE = "assets/i18n/";

  var cache = {};
  var current = DEFAULT;

  // --- Collecting the translatable bits ------------------------------------

  // Text inside these never gets touched: it is code, style or script, not copy.
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  // Attributes that hold user-visible text.
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];

  var nodes = null; // [{node, original}]
  var attrs = null; // [{el, attr, original}]
  var metas = null; // [{el, original}]

  function collect() {
    nodes = [];
    attrs = [];
    metas = [];

    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (SKIP_TAGS[node.parentNode.nodeName]) return NodeFilter.FILTER_REJECT;
          // A node worth translating has at least one letter in it; this drops
          // whitespace, bullets and lone punctuation between tags.
          if (!/[A-Za-zÀ-ÿ]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );
    var n;
    while ((n = walker.nextNode())) nodes.push({ node: n, original: n.nodeValue });

    for (var i = 0; i < ATTRS.length; i++) {
      var attr = ATTRS[i];
      var els = document.querySelectorAll("[" + attr + "]");
      for (var j = 0; j < els.length; j++) {
        var v = els[j].getAttribute(attr);
        if (v && /[A-Za-zÀ-ÿ]/.test(v)) {
          attrs.push({ el: els[j], attr: attr, original: v });
        }
      }
    }

    // <title> and the description/og/twitter meta tags.
    var t = document.querySelector("title");
    if (t) metas.push({ el: t, prop: "textContent", original: t.textContent });
    var ms = document.querySelectorAll(
      'meta[name="description"],meta[property="og:title"],meta[property="og:description"],' +
        'meta[name="twitter:title"],meta[name="twitter:description"]'
    );
    for (var k = 0; k < ms.length; k++) {
      metas.push({ el: ms[k], prop: "content", original: ms[k].getAttribute("content") });
    }
  }

  // --- Applying a language --------------------------------------------------

  /**
   * Translations are keyed by the trimmed Spanish string, but text nodes carry
   * their surrounding whitespace (which is meaningful for inline layout, e.g.
   * "texto <strong>en negrita</strong>"). Translate the trimmed core and put
   * the original padding back.
   */
  function swap(value, dict) {
    var key = value.trim();
    if (!key) return null;
    var hit = dict[key];
    if (hit == null) return null;
    var lead = value.match(/^\s*/)[0];
    var trail = value.match(/\s*$/)[0];
    return lead + hit + trail;
  }

  function apply(lang) {
    var dict = lang === DEFAULT ? null : cache[lang];
    var i;

    for (i = 0; i < nodes.length; i++) {
      var item = nodes[i];
      if (!dict) {
        item.node.nodeValue = item.original;
      } else {
        var next = swap(item.original, dict);
        item.node.nodeValue = next === null ? item.original : next;
      }
    }

    for (i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (!dict) {
        a.el.setAttribute(a.attr, a.original);
      } else {
        var av = swap(a.original, dict);
        a.el.setAttribute(a.attr, av === null ? a.original : av);
      }
    }

    for (i = 0; i < metas.length; i++) {
      var m = metas[i];
      var mv = dict ? swap(m.original, dict) : null;
      var val = mv === null || mv === undefined ? m.original : mv;
      if (m.prop === "content") m.el.setAttribute("content", val);
      else m.el.textContent = val;
    }

    document.documentElement.lang = lang;
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* private browsing — the choice just will not persist */
    }
    render();
    document.dispatchEvent(new CustomEvent("cap:langchange", { detail: { lang: lang } }));
  }

  function load(lang) {
    if (lang === DEFAULT) return Promise.resolve();
    if (cache[lang]) return Promise.resolve();
    return fetch(BASE + lang + ".json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        cache[lang] = data;
      });
  }

  function setLang(lang) {
    if (!LANGS.some(function (l) { return l.code === lang; })) lang = DEFAULT;
    return load(lang).then(
      function () { apply(lang); },
      function () {
        // A missing or broken catalogue must never blank the page: stay on the
        // Spanish that is already in the HTML.
        if (lang !== DEFAULT) apply(DEFAULT);
      }
    );
  }

  // --- The picker -----------------------------------------------------------

  function meta(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return LANGS[0];
  }

  /** Refresh every mounted picker (desktop header + mobile panel). */
  function render() {
    var m = meta(current);
    var roots = document.querySelectorAll(".cap-lang");
    for (var r = 0; r < roots.length; r++) {
      var b = roots[r].querySelector(".cap-lang-btn");
      if (!b) continue;
      b.querySelector(".cap-lang-flag").textContent = m.flag;
      b.querySelector(".cap-lang-code").textContent = m.code.toUpperCase();
      b.setAttribute("aria-label", "Idioma: " + m.label);
      var opts = roots[r].querySelectorAll("[data-lang]");
      for (var i = 0; i < opts.length; i++) {
        var on = opts[i].getAttribute("data-lang") === current;
        opts[i].setAttribute("aria-selected", on ? "true" : "false");
        opts[i].classList.toggle("is-active", on);
      }
    }
  }

  // Only one picker is ever open at a time; these track whichever it is so the
  // document-level listeners can close it.
  var openRoot = null;
  var openButton = null;

  function open(root, button) {
    if (openRoot && openRoot !== root) close();
    openRoot = root;
    openButton = button;
    root.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey, true);
  }

  function close() {
    if (!openRoot) return;
    openRoot.classList.remove("is-open");
    openButton.setAttribute("aria-expanded", "false");
    openRoot = null;
    openButton = null;
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey, true);
  }

  function onDocClick(e) {
    if (openRoot && !openRoot.contains(e.target)) close();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      var b = openButton;
      close();
      if (b) b.focus();
    }
  }

  function build() {
    var root = document.createElement("div");
    root.className = "cap-lang";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "cap-lang-btn";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML =
      '<span class="cap-lang-flag" aria-hidden="true"></span>' +
      '<span class="cap-lang-code"></span>' +
      '<svg class="cap-lang-caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">' +
      '<path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var menu = document.createElement("ul");
    menu.className = "cap-lang-menu";
    menu.setAttribute("role", "listbox");

    LANGS.forEach(function (l) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-lang", l.code);
      li.setAttribute("tabindex", "0");
      li.innerHTML =
        '<span class="cap-lang-flag" aria-hidden="true">' + l.flag + "</span>" +
        "<span>" + l.label + "</span>";
      function pick() {
        setLang(l.code);
        close();
        button.focus();
      }
      li.addEventListener("click", pick);
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
      menu.appendChild(li);
    });

    button.addEventListener("click", function (e) {
      e.stopPropagation();
      root.classList.contains("is-open") ? close() : open(root, button);
    });

    root.appendChild(button);
    root.appendChild(menu);
    return root;
  }

  /**
   * Desktop: next to the Contacto button in the header.
   * Mobile: below 1024px the header collapses to a burger and the inline
   * picker is hidden by CSS, so a second copy goes inside the slide-out panel
   * (#cap-mnav, built by cap-mobile-nav.js). Without it there would be no way
   * to change language on a phone at all.
   */
  function mount() {
    var el = build();
    var cta = document.querySelector('header a[href="./contact.html"]');
    var slot = cta && cta.parentNode;
    if (slot) {
      slot.insertBefore(el, cta);
    } else {
      var header = document.querySelector("header > div");
      if (header) {
        header.appendChild(el);
      } else {
        // 404.html has no header at all. Float the picker in the corner so the
        // page is not the one place where language cannot be changed.
        el.classList.add("cap-lang--floating");
        document.body.appendChild(el);
      }
    }
    mountMobile();
  }

  /**
   * cap-mobile-nav.js also runs deferred and builds its panel on DOMContentLoaded,
   * so it may not exist yet when we mount. Poll briefly rather than depending on
   * script order.
   */
  function mountMobile() {
    var tries = 0;
    (function attempt() {
      var panel = document.getElementById("cap-mnav");
      if (panel) {
        if (panel.querySelector(".cap-lang")) return;
        var clone = build();
        clone.classList.add("cap-lang--mobile");
        var foot = panel.querySelector(".cap-mnav-foot");
        foot ? panel.insertBefore(clone, foot) : panel.appendChild(clone);
        // The panel was built after our first pass, so its links ("Servicios",
        // "Contacto", …) are not in `nodes` yet. Re-scan, and re-apply if the
        // visitor is already on a non-Spanish language.
        collect();
        if (current !== DEFAULT) apply(current);
        else render();
        return;
      }
      if (++tries < 40) setTimeout(attempt, 100);
    })();
  }

  // --- Boot -----------------------------------------------------------------

  function init() {
    collect();
    mount();

    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }

    // First visit: follow the browser, but only if we actually speak it.
    if (!saved) {
      var nav = (navigator.languages || [navigator.language || ""])
        .map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
      for (var i = 0; i < nav.length; i++) {
        if (LANGS.some(function (l) { return l.code === nav[i]; })) {
          saved = nav[i];
          break;
        }
      }
    }

    if (saved && saved !== DEFAULT) setLang(saved);
    else render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.capI18n = { set: setLang, get: function () { return current; }, langs: LANGS };
})();
