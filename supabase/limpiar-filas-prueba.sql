-- CAP — borrar las filas de prueba de la verificación.
--
-- Al comprobar que el aviso por email funciona se insertaron varias filas de
-- prueba en `clientes_web`. La RLS impide borrarlas con la clave pública (es
-- lo correcto), así que hay que hacerlo desde aquí.
--
-- Supabase → SQL Editor → pegar y ejecutar.

-- 1. Ver qué se va a borrar ANTES de borrarlo.
select id, nombre_contacto, nombre_negocio, email, created_at
from public.clientes_web
where nombre_contacto like '\_\_TEST%'      -- pruebas del webhook
   or nombre_contacto like '\_\_E2E%'       -- prueba del formulario
   or nombre_contacto like '\_\_PRUEBA%'    -- prueba de la función
   or nombre_contacto like '\_\_AUDIT%'     -- auditoría
   or char_length(nombre_contacto) > 500    -- fila de 100.000 caracteres
order by created_at desc;

-- 2. Si la lista de arriba solo tiene filas de prueba, ejecutar el borrado.
delete from public.clientes_web
where nombre_contacto like '\_\_TEST%'
   or nombre_contacto like '\_\_E2E%'
   or nombre_contacto like '\_\_PRUEBA%'
   or nombre_contacto like '\_\_AUDIT%'
   or char_length(nombre_contacto) > 500;

-- 3. Comprobar que no queda ninguna.
select count(*) as filas_de_prueba_restantes
from public.clientes_web
where nombre_contacto like '\_\_%';
