/**
 * CAP — chatbot launcher for the website.
 *
 * Loads the real assistant (Next.js app deployed on Vercel) inside an iframe,
 * opened from a floating bubble in the bottom-right corner.
 *
 * The chatbot lives in its own repo (lluismoxo/CAP-CHATBOT) and only allows
 * being embedded from the origins listed in its `frame-ancestors` CSP:
 * capconsultor.eu, www.capconsultor.eu and localhost:3000 / :3001.
 *
 * Override the target with, before this script loads:
 *   <script>window.CAP_WIDGET = { url: "https://…/", color: "#00e599" };</script>
 */
(function () {
  "use strict";

  if (window.__capChatLoaded) return;
  window.__capChatLoaded = true;

  var cfg = window.CAP_WIDGET || {};
  var CHAT_URL = cfg.url || "https://capchatbotfinal.vercel.app/";
  var COLOR = cfg.color || "#00e599";
  var DARK = "#0b0c0c";
  var Z = 2147483000;

  var open = false;
  var loaded = false;

  // --- Chat iframe (created lazily on first open) ---------------------------
  var frame = document.createElement("iframe");
  frame.title = "CAP Assistant";
  frame.setAttribute("allow", "clipboard-write");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = [
    "position:fixed",
    "bottom:96px",
    "right:24px",
    "width:min(46vw,520px)",
    "height:min(52vh,560px)",
    "min-width:min(340px,calc(100vw - 32px))",
    "min-height:min(460px,calc(100vh - 120px))",
    "max-width:520px",
    "max-height:720px",
    "border:1px solid rgba(255,255,255,.16)",
    "background:" + DARK,
    "box-shadow:0 12px 40px rgba(0,0,0,.35)",
    "z-index:" + Z,
    "opacity:0",
    "transform:translateY(12px)",
    "pointer-events:none",
    "transition:opacity .2s ease, transform .2s ease",
  ].join(";");

  // --- Bubble button --------------------------------------------------------
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Open chat");
  btn.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "width:56px",
    "height:56px",
    "border:1px solid rgba(255,255,255,.18)",
    "background:" + DARK,
    "color:#fff",
    "cursor:pointer",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "box-shadow:0 6px 20px rgba(0,0,0,.28)",
    "z-index:" + (Z + 1),
    "transition:border-color .2s, background .2s",
  ].join(";");
  btn.onmouseenter = function () {
    btn.style.borderColor = COLOR;
    btn.style.background = "#141616";
  };
  btn.onmouseleave = function () {
    btn.style.borderColor = "rgba(255,255,255,.18)";
    btn.style.background = DARK;
  };

  var ICON_CHAT =
    '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">' +
    '<rect x="1.5" y="2.5" width="19" height="14" stroke="currentColor"></rect>' +
    '<path d="M6 19.5V16.5" stroke="currentColor"></path>' +
    '<path d="M5.5 7.5h11M5.5 11.5h7" stroke="' + COLOR + '"></path></svg>';
  var ICON_CLOSE =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  btn.innerHTML = ICON_CHAT;

  function setOpen(v) {
    open = v;
    if (open && !loaded) {
      frame.src = CHAT_URL;
      loaded = true;
    }
    frame.style.opacity = open ? "1" : "0";
    frame.style.transform = open ? "translateY(0)" : "translateY(12px)";
    frame.style.pointerEvents = open ? "auto" : "none";
    frame.setAttribute("aria-hidden", open ? "false" : "true");
    btn.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  }

  btn.addEventListener("click", function () {
    setOpen(!open);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) setOpen(false);
  });

  function mount() {
    document.body.appendChild(frame);
    document.body.appendChild(btn);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
