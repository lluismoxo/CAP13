# Aviso por email al recibir un contacto

Cuando alguien rellena el formulario de [contact.html](../contact.html), los datos
se guardan en la tabla `clientes_web` de Supabase. Esta carpeta añade el aviso
por email: un **Database Webhook** dispara una **Edge Function** que envía el
correo con **Resend**.

```
Formulario web  →  INSERT en clientes_web  →  Webhook  →  Edge Function  →  Resend  →  tu correo
```

El aviso va por detrás del guardado: si el email fallara, el contacto ya está
en la base de datos. Nunca se pierde un lead por un problema de correo.

---

## Configuración (una sola vez, ~10 minutos)

### 1. Clave de Resend

En [resend.com](https://resend.com) → **API Keys** → crea una con permiso de
envío. Empieza por `re_`.

**Sobre el remitente:** si tienes `capconsultor.eu` verificado en Resend
(Domains → Add Domain, y añadir los registros DNS), puedes enviar desde
`avisos@capconsultor.eu`. Si no lo tienes, usa `onboarding@resend.dev`, que
funciona sin verificar nada **pero solo puede enviar a la dirección con la que
te registraste en Resend**. Para este aviso sirve, porque el destino eres tú.

### 2. Desplegar la función

**Opción A — con la CLI** (`npm i -g supabase`):

```bash
supabase login
supabase link --project-ref dzslnlqylsnxotnidfhi
supabase functions deploy notificar-contacto --no-verify-jwt
```

`--no-verify-jwt` es necesario: el webhook de la base de datos no manda un JWT
de usuario. El acceso se protege con la cabecera secreta del paso 4.

**Opción B — desde el panel:** Supabase → **Edge Functions** → *Deploy a new
function* → nombre `notificar-contacto` → pega el contenido de
[functions/notificar-contacto/index.ts](functions/notificar-contacto/index.ts).
Después, en los ajustes de la función, desactiva *Verify JWT*.

### 3. Secrets de la función

Supabase → **Edge Functions** → `notificar-contacto` → **Secrets**:

| Nombre | Valor | |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | obligatorio |
| `AVISO_PARA` | `lluismoxo@gmail.com` | opcional, es el valor por defecto |
| `AVISO_DESDE` | `avisos@capconsultor.eu` | opcional; sin dominio verificado, deja `onboarding@resend.dev` |
| `WEBHOOK_SECRET` | una cadena larga al azar | recomendable, ver paso 4 |

Para generar el secreto: `openssl rand -hex 24`

### 4. Crear el webhook

Supabase → **Database** → **Webhooks** → *Create a new hook*:

- **Name:** `avisar-nuevo-contacto`
- **Table:** `public.clientes_web`
- **Events:** solo **Insert**
- **Type:** *Supabase Edge Functions* → `notificar-contacto`
- **HTTP Headers:** si has puesto `WEBHOOK_SECRET`, añade
  `x-webhook-secret` con ese mismo valor.

Sin la cabecera, cualquiera que descubriera la URL de la función podría
provocar envíos de correo. Con ella, la función rechaza esas peticiones.

### 5. Comprobar

Rellena el formulario en la web (o en local) y revisa:

1. La fila aparece en `clientes_web`.
2. Llega el email a `lluismoxo@gmail.com`.
3. Supabase → Edge Functions → `notificar-contacto` → **Logs** muestra
   `Aviso enviado a ...`.

Si no llega el correo, los logs dicen por qué. El más habitual es
`dominio no verificado`: el remitente de `AVISO_DESDE` no está verificado en
Resend. Cámbialo a `onboarding@resend.dev` o verifica el dominio.

---

## Notas

- El email lleva `reply_to` con la dirección del cliente: al responder, le
  contestas directamente a él.
- Se envía en HTML y en texto plano.
- Todo lo que escribe el usuario se escapa antes de meterlo en el HTML.
- La función devuelve 200 aunque falle el envío, para que Supabase no reintente
  el webhook una y otra vez. El fallo queda en los logs.
- Si algún día amplías el webhook a UPDATE, la función ignora esos eventos: solo
  avisa de altas nuevas.
