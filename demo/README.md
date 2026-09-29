# Demo pública del Modo Club — guía de uso

Última revisión: 29 de septiembre de 2026.

## 1. Direcciones

| Qué | URL |
|---|---|
| Demo (la que se comparte) | **https://toplidercoach.com/demo** → redirige a `https://club.toplidercoach.com/demo/` |
| Entrar directo a un despacho | `https://club.toplidercoach.com/demo/?rol=fisio` (slugs: `direccion`, `entrenador`, `director-deportivo`, `medico`, `fisio`, `preparador-fisico`, `analista`, `economico`, `cantera`, `utillero`) |
| HUB (clientes) | `https://club.toplidercoach.com/` (también `toplidercoach.com/planificadorpro`, redirigido) |
| Oferta Club Prioritario | `https://club.toplidercoach.com/demo/#oferta` |

El HUB se sirve desde GitHub Pages (repo `toplidercoach-hub`, rama `main`, dominio `club.toplidercoach.com`). Las redirecciones cortas viven en WordPress → Herramientas → Redirection.

## 2. Cómo funciona por dentro

- **Rapid Alianza** es el club de demostración (`club_id 00000000-0000-4000-8000-00000000de30`). 7 equipos, 142 jugadores, 19 personas de staff sin login.
- **La puerta**: `demo/index.html` guarda en el navegador un "pase de visitante" (`hub_user` con `demo:true`, `hub_token=demo`, `tlc_demo_role`) y manda al HUB. El HUB lo reconoce como miembro de Rapid Alianza con su cargo y sus permisos reales.
- **Solo lectura**: el trigger `demo_guard()` (en todas las tablas con `club_id`) bloquea cualquier escritura sobre Rapid Alianza que venga de un visitante anónimo. Tú puedes editar la demo entrando con `demo@toplidercoach.com` (usuario de Supabase Auth).
- **Siempre en el presente**: la función `demo_refrescar_fechas()` mueve todas las fechas del club demo hasta hoy. Se ejecuta sola **cada lunes a las 5:00** (pg_cron, tarea `demo-refrescar-fechas`). Para forzarla: `SELECT demo_refrescar_fechas();` en el SQL Editor. Copia de seguridad del código: `sql/demo_refrescar_fechas.sql`.
- **Dentro del HUB** (solo con pase de visitante): `js/demo-tour.js` pone la barra morada "Modo demo · Ver como", el recorrido rápido con voz y la oferta; `js/demo-inicio.js` pone la pantalla de inicio por despacho. Para un cliente real no hacen nada.

## 3. Leads

Cada entrada a la demo guarda email (obligatorio), teléfono (opcional) y el despacho elegido en la tabla `demo_leads`. Para verlos, en el SQL Editor de Supabase:

```sql
SELECT email, phone, role_slug, created_at FROM demo_leads ORDER BY created_at DESC;
```

Un mismo email aparece una vez por cada despacho por el que entró: sirve para saber qué le interesó.

## 4. Dónde se cambia cada cosa

| Quiero cambiar… | Archivo | Qué buscar |
|---|---|---|
| Textos de la landing, tarjetas, tutorial con voz | `demo/index.html` | Bloque `ROLES` (tarjetas) y `PASOS` (tutorial) |
| Precio, plazas o texto de la oferta | `demo/index.html` | Sección `<section class="offer">` y, dentro del HUB, `js/demo-inicio.js` (banda final) |
| Vídeo del hero o su portada | `demo/index.html` | `VIDEO_URL` y `POSTER_URL` |
| Textos de los recorridos rápidos (5 destacados por despacho) | `js/demo-tour.js` | Bloque `DEMO_RECORRIDOS` al final |
| Saludo y frase de situación de cada cargo en la pantalla de inicio | `js/demo-inicio.js` | Bloque `PERSONAS` |
| Título/descripción de cada tarjeta de módulo en inicio | `js/demo-inicio.js` | Bloque `MODS` |
| Número de WhatsApp | `demo/index.html` y `js/demo-tour.js` | `wa.me/34611126983` |
| Fotos de las tarjetas (opcional) | `demo/img/inicio/<clave>.jpg` (16:9) y `demo/img/despacho-<slug>.jpg` (4:5) | Si existe el archivo, se usa; si no, degradado |

Después de cualquier cambio: `git add … ; git commit -m '…' ; git push`. GitHub Pages tarda entre 1 y 10 minutos en publicarlo.

## 5. Probar como un visitante

Siempre en **ventana de incógnito** (Ctrl+Shift+N). Si pruebas en tu navegador normal, tu sesión de Supabase hace que el guardián te deje escribir y que veas cosas que un visitante no ve.

Circuito recomendado: `toplidercoach.com/demo` → Entrenador → pantalla de inicio → recorrido → "Ver como → Médico" → "Ver como → Fisio".

## 6. Editar la demo (añadir datos, corregir algo)

Entra en `club.toplidercoach.com` con `demo@toplidercoach.com`. Verás Rapid Alianza como Dirección y podrás escribir. Si añades tablas nuevas con fechas, hay que incluirlas en `demo_refrescar_fechas()` (ver `sql/demo_refrescar_fechas.sql`).

## 7. Si algo va mal

| Síntoma | Causa habitual | Solución |
|---|---|---|
| Al pulsar "Entrar" aparece el login del HUB | La landing y el HUB están en dominios distintos | `HUB_URL` en `demo/index.html` debe ser `https://club.toplidercoach.com/` |
| Un visitante puede guardar cambios | Está probando con sesión propia de Supabase | Incógnito. Si sigue, revisar que el trigger `trg_demo_guard` existe: `SELECT count(*) FROM information_schema.triggers WHERE trigger_name='trg_demo_guard';` |
| Un cliente real ve la barra morada de demo | Pase de visitante antiguo en su navegador | Ya no debería pasar (solo se activa con `demo:true`); si ocurre, que pulse Salir y vuelva a entrar |
| El refresco falla por "duplicate key" | Una tabla nueva con fecha en una regla UNIQUE | Hacer la regla `DEFERRABLE` y añadir `SET CONSTRAINTS … DEFERRED` en la función (ver cm_fisio_daily_reports en el SQL) |
| Las fechas de la demo están en el pasado | pg_cron no corrió | `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;` y ejecutar a mano `SELECT demo_refrescar_fechas();` |
| La voz no suena o se come las primeras palabras | Navegador sin voces en español / bloqueo de audio hasta interactuar | Es normal en algunos navegadores; el tutorial funciona igual con texto |

## 8. Pendientes conocidos

- Fotos para las tarjetas (inicio y puertas).
- Contador real de plazas de Club Prioritario (ahora es un texto fijo "Quedan 50").
- Afinado responsive de los despachos con capturas reales de móvil.
- Huecos menores de datos en Rapid Alianza: interacciones de Dirección Deportiva, checklists del utillero.
