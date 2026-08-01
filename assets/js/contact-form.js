/**
 * CAP — contact form.
 *
 * Two delivery modes, picked automatically:
 *
 *  1. Express backend (`POST /api/contact`) when the site is served by
 *     server/index.js — the secret Supabase key stays on the server.
 *  2. Direct insert into Supabase with the publishable key, used on static
 *     hosting (GitHub Pages) where no backend exists.
 *
 * The publishable key is designed to be public: the row-level security policy
 * on `clientes_web` only allows INSERT with origen='web', and grants no read
 * access whatsoever. Never put the secret key in this file.
 */
(function () {
  var SUPABASE_URL = "https://dzslnlqylsnxotnidfhi.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KLKEa0gXMYcqcpV47KNYqg_DLkdJZQX";

  // On localhost the Express backend is available; anywhere else we go direct.
  var USE_BACKEND =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  var button = document.getElementById("submit-btn");
  if (!form || !status || !button) return;

  var defaultLabel = button.textContent;

  function show(message, kind) {
    status.textContent = message;
    status.hidden = false;
    status.style.color = kind === "error" ? "#ff6b6b" : "#00e599";
  }

  function hide() {
    status.hidden = true;
    status.textContent = "";
  }

  function setBusy(busy) {
    button.disabled = busy;
    button.style.opacity = busy ? ".45" : "1";
    button.style.cursor = busy ? "not-allowed" : "pointer";
    button.textContent = busy ? "Sending…" : defaultLabel;
  }

  // --- Delivery ------------------------------------------------------------

  async function sendViaBackend(payload) {
    var response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var result = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !result.ok) {
      var firstError = result.errors && Object.values(result.errors)[0];
      throw new Error(firstError || result.error || "Something went wrong. Please try again.");
    }
  }

  async function sendToSupabase(payload) {
    // No `Prefer: return=representation` here: the RLS policy grants INSERT
    // only, so asking for the row back would make the request fail.
    var response = await fetch(SUPABASE_URL + "/rest/v1/clientes_web", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        nombre_contacto: payload.name,
        nombre_negocio: payload.company || payload.name,
        email: payload.email,
        mensaje: payload.message || null,
        origen: "web",
      }),
    });
    if (!response.ok) {
      throw new Error("We could not save your request. Please try again in a moment.");
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hide();

    var data = Object.fromEntries(new FormData(form).entries());

    // Honeypot: only bots fill the hidden field.
    if ((data.website_url || "").trim()) {
      form.reset();
      show("Thanks — we received your request and will get back to you shortly.", "success");
      return;
    }

    var payload = {
      name: (data.name || "").trim(),
      company: (data.company || "").trim(),
      email: (data.email || "").trim(),
      message: (data.message || "").trim(),
      consent: form.consent.checked,
    };

    if (!payload.name) return show("Please enter your name.", "error");
    if (!payload.email) return show("Please enter your email.", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
      return show("That email address does not look valid.", "error");
    }
    if (!payload.consent) return show("You must accept the Privacy Policy.", "error");

    setBusy(true);

    try {
      if (USE_BACKEND) await sendViaBackend(payload);
      else await sendToSupabase(payload);

      form.reset();
      show("Thanks — we received your request and will get back to you shortly.", "success");
      setBusy(true);
      button.textContent = "Request sent";
    } catch (err) {
      show(err.message || "Could not reach the server. Please try again in a moment.", "error");
      setBusy(false);
    }
  });
})();
