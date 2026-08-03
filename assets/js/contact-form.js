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
    button.textContent = busy ? "Enviando…" : defaultLabel;
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
      throw new Error(firstError || result.error || "Algo ha salido mal. Inténtalo de nuevo.");
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
      throw new Error("No hemos podido guardar tu solicitud. Inténtalo de nuevo en un momento.");
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hide();

    var data = Object.fromEntries(new FormData(form).entries());

    // Honeypot: only bots fill the hidden field.
    if ((data.website_url || "").trim()) {
      form.reset();
      show("Gracias — hemos recibido tu solicitud y te responderemos en breve.", "success");
      return;
    }

    var payload = {
      name: (data.name || "").trim(),
      company: (data.company || "").trim(),
      email: (data.email || "").trim(),
      message: (data.message || "").trim(),
      consent: form.consent.checked,
    };

    if (!payload.name) return show("Introduce tu nombre.", "error");
    if (!payload.email) return show("Introduce tu email.", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
      return show("Ese email no parece válido.", "error");
    }
    if (!payload.consent) return show("Debes aceptar la Política de Privacidad.", "error");

    setBusy(true);

    try {
      if (USE_BACKEND) await sendViaBackend(payload);
      else await sendToSupabase(payload);

      form.reset();
      show("Gracias — hemos recibido tu solicitud y te responderemos en breve.", "success");
      setBusy(true);
      button.textContent = "Solicitud enviada";
    } catch (err) {
      show(err.message || "No se ha podido contactar con el servidor. Inténtalo de nuevo en un momento.", "error");
      setBusy(false);
    }
  });
})();
