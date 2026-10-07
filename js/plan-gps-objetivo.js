// ========== PLAN-GPS-OBJETIVO.JS (v2) - Carga estimada de la sesion con datos GPS ==========
// En el editor de sesion (Planificador > Mi Sesion) pinta un panel con la carga fisica
// estimada: ritmo GPS de cada ejercicio del banco (vista cm_pf_ej_gps_resumen) x minutos.
// v2: el objetivo del dia se carga SOLO desde Periodizacion (bandas MD del club o los
//     objetivos propios de la semana x perfil de partido del equipo), segun la fecha de la
//     sesion. Se puede seguir poniendo un objetivo manual, que manda sobre el automatico.
// Tambien anade una etiqueta con el ritmo GPS en las tarjetas de "Mis ejercicios".
// No modifica planificador.js. Cargar DESPUES de planificador.js.

var planGps = { mapa: null, mapaClub: null, cargando: false, ultimaCarga: 0, obj: {}, abierto: true, detalle: false,
                auto: null, autoClave: null, autoCargando: null };

// kObj = clave del parametro en las bandas de Periodizacion (null = sin objetivo automatico)
var PLANGPS_MET = [
    { k: 'td',     kObj: 'td',     lbl: 'Distancia',           uni: 'm', dec: 0, ritmo: function (r) { return parseFloat(r.td_min); } },
    { k: 'hsr19',  kObj: 'hsr',    lbl: 'HSR >19 km/h',        uni: 'm', dec: 0, ritmo: function (r) { return parseFloat(r.hsr19_min); } },
    { k: 'hsr24',  kObj: 'sprint', lbl: 'Sprint >24 km/h',     uni: 'm', dec: 0, ritmo: function (r) { return parseFloat(r.hsr24_min); } },
    { k: 'accdec', kObj: 'accdec', lbl: 'Acel + Desacel >3',   uni: '',  dec: 0, ritmo: function (r) { return (parseFloat(r.acc30_min) || 0) + (parseFloat(r.dec30_min) || 0); } },
    { k: 'spr',    kObj: null,     lbl: 'N. de sprints',       uni: '',  dec: 1, ritmo: function (r) { return parseFloat(r.sprints_min); } }
];
var PLANGPS_SECCIONES = ['previo', 'calentamiento', 'principal', 'enfriamiento', 'postcampo'];   // porteros no suma, igual que la duracion total

function planGpsEsc(t) {
    return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function planGpsFmt(v, dec) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    var p = Math.pow(10, dec || 0);
    var n = Math.round(v * p) / p;
    var partes = String(n).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return partes.join(',');
}
function planGpsNorm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
function planGpsFechaSesion() {
    var el = document.getElementById('sesion-fecha');
    var f = el && el.value ? el.value : ((typeof sesion !== 'undefined' && sesion && sesion.fecha) ? sesion.fecha : '');
    return /^\d{4}-\d{2}-\d{2}$/.test(f || '') ? f : '';
}

// ---------- Ritmos GPS de los ejercicios del club ----------
async function planGpsCargarMapa(forzar) {
    if (typeof clubId === 'undefined' || !clubId || typeof supabaseClient === 'undefined') return;
    if (planGps.cargando) return;
    if (!forzar && planGps.mapa && planGps.mapaClub === clubId && Date.now() - planGps.ultimaCarga < 120000) return;
    planGps.cargando = true;
    try {
        var r = await supabaseClient.from('cm_pf_ej_gps_resumen')
            .select('activity_ref, n_sesiones, td_min, hsr19_min, hsr24_min, sprints_min, acc30_min, dec30_min')
            .eq('club_id', clubId);
        if (!r.error) {
            var m = {};
            (r.data || []).forEach(function (x) { m[x.activity_ref] = x; });
            planGps.mapa = m;
            planGps.mapaClub = clubId;
            planGps.ultimaCarga = Date.now();
            planGpsRender();
        }
    } catch (e) { /* sin datos GPS el planificador funciona igual */ }
    planGps.cargando = false;
}

// ---------- Objetivo automatico del dia (mismo criterio que Periodizacion > Carga por jugador y dia) ----------
// Devuelve { lab, rangos: { td:[min,max], hsr:[..], sprint:[..], accdec:[..] }, propio, post } o { lab:'', rangos:null, motivo }
async function planGpsCalcularObjetivo(fecha) {
    var out = { lab: '', rangos: null, propio: false, post: false, motivo: '' };

    // 1) Bandas del club
    var rc = await supabaseClient.from('cm_pf_gps_config').select('md_bands').eq('club_id', clubId).maybeSingle();
    var bandas = rc && rc.data ? rc.data.md_bands : null;
    if (!bandas) { out.motivo = 'no hay bandas de carga configuradas'; return out; }

    // 2) Etiqueta MD del dia: partido anterior (o del mismo dia) y siguiente
    var dPrev = null, dNext = null;
    var t = new Date(fecha + 'T12:00:00').getTime();
    var ra = await supabaseClient.from('matches').select('match_date').eq('club_id', clubId).lte('match_date', fecha).order('match_date', { ascending: false }).limit(1);
    if (ra.data && ra.data.length) dPrev = Math.round((t - new Date(ra.data[0].match_date + 'T12:00:00').getTime()) / 864e5);
    var rs = await supabaseClient.from('matches').select('match_date').eq('club_id', clubId).gt('match_date', fecha).order('match_date', { ascending: true }).limit(1);
    if (rs.data && rs.data.length) dNext = Math.round((new Date(rs.data[0].match_date + 'T12:00:00').getTime() - t) / 864e5);
    var lab = '';
    if (dPrev === 0) lab = 'MD';
    else if (dPrev === 1) lab = 'MD+1';
    else if (dPrev === 2) lab = 'MD+2';
    else if (dNext !== null && dNext <= 6) lab = 'MD-' + dNext;
    else if (dPrev !== null && dPrev <= 3) lab = 'MD+' + dPrev;
    out.lab = lab;
    if (lab === 'MD') { out.motivo = 'es dia de partido'; return out; }

    // 3) Objetivos propios de la semana (microciclo que contiene la fecha), si los hay
    var banda = null;
    try {
        var rp = await supabaseClient.from('training_periods').select('date_start, date_end, md_bands')
            .eq('club_id', clubId).lte('date_start', fecha).gte('date_end', fecha).not('md_bands', 'is', null);
        if (!rp.error && rp.data && rp.data.length) {
            var per = rp.data.slice().sort(function (a, b) {
                return (new Date(a.date_end) - new Date(a.date_start)) - (new Date(b.date_end) - new Date(b.date_start));
            })[0];
            if (per.md_bands && per.md_bands[fecha]) { banda = per.md_bands[fecha]; out.propio = true; }
        }
    } catch (ePer) { /* sin objetivos propios se usan los del club */ }

    // 4) Si no, la banda del club para esa etiqueta (post-partido: la de recuperacion)
    if (lab === 'MD+1' || lab === 'MD+2') out.post = true;
    if (!banda) {
        if (!lab) { out.motivo = 'no hay partido cercano en el calendario'; return out; }
        banda = out.post ? bandas['MD+1'] : bandas[lab];
    }
    if (!banda) { out.motivo = 'no hay banda definida para ' + lab; return out; }

    // 5) Perfil de partido del equipo: media de los jugadores de la plantilla con perfil (igual que Periodizacion)
    var idTemporada = (typeof seasonId !== 'undefined' && seasonId) ? seasonId : null;
    if (!idTemporada) {
        var rt = await supabaseClient.from('seasons').select('id').eq('club_id', clubId).eq('is_active', true).maybeSingle();
        idTemporada = rt && rt.data ? rt.data.id : null;
    }
    var idsPlantilla = {}, porNombre = {}, puente = {};
    var rpl = await supabaseClient.from('season_players').select('player_id, players(id, name, status, fecha_baja)').eq('season_id', idTemporada);
    (rpl.data || []).forEach(function (sp) {
        if (!sp.players) return;
        if (sp.players.status === 'baja' && sp.players.fecha_baja && sp.players.fecha_baja <= fecha) return;
        idsPlantilla[sp.player_id] = true;
        porNombre[planGpsNorm(sp.players.name)] = sp.player_id;
    });
    var rcp = await supabaseClient.from('club_players').select('id, name, legacy_player_id').eq('club_id', clubId);
    (rcp.data || []).forEach(function (cp) {
        if (cp.legacy_player_id && idsPlantilla[cp.legacy_player_id]) puente[cp.id] = cp.legacy_player_id;
        else if (porNombre[planGpsNorm(cp.name)]) puente[cp.id] = porNombre[planGpsNorm(cp.name)];
    });
    var rpf = await supabaseClient.from('cm_pf_perfil_partido').select('player_id, total_distance_90, hsr_90, sprint_90, accel_90, decel_90').eq('club_id', clubId);
    var acc = { td: [], hsr: [], sprint: [], accdec: [] };
    (rpf.data || []).forEach(function (p) {
        if (!(idsPlantilla[p.player_id] || puente[p.player_id])) return;
        var fila = {
            td: parseFloat(p.total_distance_90) || 0, hsr: parseFloat(p.hsr_90) || 0, sprint: parseFloat(p.sprint_90) || 0,
            accdec: (parseFloat(p.accel_90) || 0) + (parseFloat(p.decel_90) || 0)
        };
        Object.keys(acc).forEach(function (k) { if (fila[k] > 0) acc[k].push(fila[k]); });
    });
    var rangos = {}, alguno = false;
    Object.keys(acc).forEach(function (k) {
        var ref = acc[k].length ? acc[k].reduce(function (a, b) { return a + b; }, 0) / acc[k].length : 0;
        if (ref > 0 && banda[k]) { rangos[k] = [banda[k][0] / 100 * ref, banda[k][1] / 100 * ref]; alguno = true; }
    });
    if (!alguno) { out.motivo = 'todavia no hay perfil de partido del equipo'; return out; }
    out.rangos = rangos;
    return out;
}

function planGpsPedirObjetivo() {
    if (typeof clubId === 'undefined' || !clubId || typeof supabaseClient === 'undefined') return;
    var fecha = planGpsFechaSesion();
    var clave = fecha ? clubId + '|' + fecha : '';
    if (clave === planGps.autoClave || clave === planGps.autoCargando) return;
    if (!fecha) { planGps.auto = null; planGps.autoClave = ''; return; }
    planGps.autoCargando = clave;
    planGpsCalcularObjetivo(fecha).then(function (res) {
        if (planGps.autoCargando !== clave) return;
        planGps.auto = res; planGps.autoClave = clave; planGps.autoCargando = null;
        planGpsRender();
    }).catch(function (e) {
        console.warn('[PlanGps] objetivo del dia:', e);
        if (planGps.autoCargando !== clave) return;
        planGps.auto = { lab: '', rangos: null, motivo: 'no se pudo leer la periodizacion' }; planGps.autoClave = clave; planGps.autoCargando = null;
        planGpsRender();
    });
}

// ---------- Calculo ----------
function planGpsCalcular(ses, mapa) {
    var out = { tot: {}, items: [], minCon: 0, minSin: 0, nSin: 0, nCon: 0 };
    PLANGPS_MET.forEach(function (m) { out.tot[m.k] = 0; });
    PLANGPS_SECCIONES.forEach(function (sec) {
        (ses && ses[sec] ? ses[sec] : []).forEach(function (ej) {
            var min = parseFloat(ej.duracion) || 0;
            var r = (ej.id !== null && ej.id !== undefined && mapa) ? mapa[String(ej.id)] : null;
            var it = { titulo: ej.titulo || 'Ejercicio', min: min, datos: !!r, n: r ? r.n_sesiones : 0, v: {} };
            if (r) {
                PLANGPS_MET.forEach(function (m) {
                    var ritmo = m.ritmo(r);
                    var val = isNaN(ritmo) ? null : ritmo * min;
                    it.v[m.k] = val;
                    if (val !== null) out.tot[m.k] += val;
                });
                out.minCon += min; out.nCon++;
            } else {
                out.minSin += min; out.nSin++;
            }
            out.items.push(it);
        });
    });
    return out;
}

// ---------- HTML del panel ----------
function planGpsHtml(ses, mapa, obj, abierto, detalle, auto) {
    var c = planGpsCalcular(ses, mapa);
    var cab = '<div onclick="planGpsToggle()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:9px 12px;background:linear-gradient(135deg,#0f766e,#115e59);color:#fff;border-radius:8px 8px ' + (abierto ? '0 0' : '8px 8px') + ';font-size:13px;font-weight:600">' +
        '<span>Carga estimada (GPS)' + (auto && auto.lab ? ' <span style="font-weight:400;font-size:11px;background:rgba(255,255,255,.18);border-radius:10px;padding:1px 8px;margin-left:4px">' + planGpsEsc(auto.lab) + '</span>' : '') + '</span><span style="font-size:11px;font-weight:400">' +
        (c.nCon ? planGpsFmt(c.tot.td, 0) + ' m &middot; ' : '') + (abierto ? '&#9650;' : '&#9660;') + '</span></div>';
    if (!abierto) return cab;

    var cuerpo = '<div style="border:1px solid #99f6e4;border-top:none;border-radius:0 0 8px 8px;padding:10px 12px;background:#f0fdfa">';
    if (!mapa) {
        cuerpo += '<div style="color:#64748b;font-size:12px">Cargando datos GPS de tus ejercicios...</div></div>';
        return cab + cuerpo;
    }

    // De donde sale el objetivo
    var origen = '';
    if (auto && auto.rangos) {
        origen = 'Objetivo del d&iacute;a <b>' + planGpsEsc(auto.lab || '') + '</b> cargado de Periodizaci&oacute;n' +
            (auto.propio ? ' (objetivos propios de esta semana)' : '') +
            (auto.post && !auto.propio ? '. D&iacute;a post-partido: se muestra el objetivo de recuperaci&oacute;n; los que jugaron poco tienen el compensatorio' : '') + '.';
    } else if (auto) {
        origen = 'Sin objetivo autom&aacute;tico: ' + planGpsEsc(auto.motivo || 'no disponible') + '. Puedes escribir uno a mano.';
    } else {
        origen = 'Pon la fecha de la sesi&oacute;n para cargar el objetivo del d&iacute;a desde Periodizaci&oacute;n.';
    }
    cuerpo += '<div style="font-size:11px;color:#0f766e;background:#ccfbf1;border-radius:6px;padding:5px 8px;margin-bottom:10px;line-height:1.4">' + origen + '</div>';

    PLANGPS_MET.forEach(function (m) {
        var est = c.tot[m.k];
        var uni = m.uni ? ' ' + m.uni : '';
        var manual = parseFloat(obj[m.k]);
        var hayManual = !isNaN(manual) && manual > 0;
        var rango = (!hayManual && auto && auto.rangos && m.kObj && auto.rangos[m.kObj]) ? auto.rangos[m.kObj] : null;
        var color = '#14b8a6', txt = '', pct = 0, marca = '';
        if (hayManual) {
            pct = est / manual * 100;
            var dif = manual - est;
            if (pct < 90) { color = '#f59e0b'; txt = Math.round(pct) + '% &middot; faltan ' + planGpsFmt(dif, m.dec) + uni; }
            else if (pct <= 110) { color = '#22c55e'; txt = Math.round(pct) + '% &middot; objetivo cumplido'; }
            else { color = '#ef4444'; txt = Math.round(pct) + '% &middot; sobran ' + planGpsFmt(-dif, m.dec) + uni; }
        } else if (rango) {
            var lo = Math.round(rango[0]), hi = Math.round(rango[1]), e = Math.round(est);
            pct = hi > 0 ? est / hi * 100 : 0;
            if (e < lo) { color = '#f59e0b'; txt = 'faltan ' + planGpsFmt(lo - e, 0) + uni + ' para el m&iacute;nimo'; }
            else if (e > hi) { color = '#ef4444'; txt = 'sobran ' + planGpsFmt(e - hi, 0) + uni; }
            else { color = '#22c55e'; txt = 'dentro del objetivo'; }
            marca = '<div style="position:absolute;top:0;bottom:0;left:' + (hi > 0 ? Math.round(lo / hi * 100) : 0) + '%;width:2px;background:#0f766e" title="minimo"></div>';
        }
        var hayObj = hayManual || !!rango;
        cuerpo += '<div style="margin-bottom:9px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#134e4a">' +
                '<span style="font-weight:600">' + m.lbl + '</span>' +
                '<span style="display:flex;align-items:center;gap:6px"><b>' + planGpsFmt(est, m.dec) + uni + '</b>' +
                (rango ? '<span style="color:#0f766e;font-size:11px">de ' + planGpsFmt(rango[0], 0) + ' - ' + planGpsFmt(rango[1], 0) + '</span>' : '<span style="color:#64748b">/</span>') +
                '<input type="number" min="0" step="any" value="' + (hayManual ? manual : '') + '" placeholder="' + (rango ? 'manual' : 'objetivo') + '" title="Objetivo manual: si lo rellenas, manda sobre el de Periodizacion" onclick="event.stopPropagation()" onchange="planGpsSetObj(\'' + m.k + '\', this.value)" ' +
                    'style="width:' + (rango ? 58 : 78) + 'px;padding:3px 6px;border:1px solid #99f6e4;border-radius:5px;font-size:11px;text-align:right;background:#fff;color:#134e4a"></span>' +
            '</div>' +
            (hayObj
                ? '<div style="height:8px;background:#ccfbf1;border-radius:4px;overflow:hidden;margin-top:4px;position:relative"><div style="height:100%;width:' + Math.min(100, Math.round(pct)) + '%;background:' + color + '"></div>' + marca + '</div>' +
                  '<div style="font-size:11px;color:' + color + ';margin-top:2px;font-weight:600">' + txt + '</div>'
                : '') +
        '</div>';
    });

    if (!c.items.length) {
        cuerpo += '<div style="color:#64748b;font-size:12px">A&ntilde;ade ejercicios a la sesi&oacute;n para ver cu&aacute;nto llevas.</div>';
    }
    if (c.nSin) {
        cuerpo += '<div style="font-size:11px;color:#b45309;background:#fef3c7;border-radius:6px;padding:5px 8px;margin-top:6px">' +
            c.nSin + (c.nSin === 1 ? ' ejercicio' : ' ejercicios') + ' sin datos GPS (' + planGpsFmt(c.minSin, 0) + ' min): la estimaci&oacute;n no los cuenta.</div>';
    }

    if (c.items.length) {
        cuerpo += '<div style="margin-top:8px"><a href="#" onclick="planGpsToggleDetalle();return false" style="font-size:11px;color:#0f766e">' + (detalle ? 'Ocultar' : 'Ver') + ' desglose por ejercicio</a></div>';
    }
    if (detalle && c.items.length) {
        var th = 'style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4"';
        cuerpo += '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px;color:#134e4a"><thead><tr>' +
            '<th style="text-align:left;padding:3px 4px;border-bottom:1px solid #99f6e4">Ejercicio</th><th ' + th + '>Min</th>' +
            '<th ' + th + '>Dist.</th><th ' + th + '>HSR19</th><th ' + th + '>Spr24</th><th ' + th + '>Acc+Dec</th></tr></thead><tbody>';
        c.items.forEach(function (it) {
            var td = function (v, dec) { return '<td style="text-align:right;padding:3px 4px;border-bottom:1px solid #ccfbf1">' + (it.datos ? planGpsFmt(v, dec) : '-') + '</td>'; };
            cuerpo += '<tr' + (it.datos ? '' : ' style="color:#94a3b8"') + '><td style="padding:3px 4px;border-bottom:1px solid #ccfbf1;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + planGpsEsc(it.titulo) + (it.datos ? ' (medido en ' + it.n + (it.n === 1 ? ' sesion)' : ' sesiones)') : ' (sin datos GPS)') + '">' + planGpsEsc(it.titulo) + '</td>' +
                '<td style="text-align:right;padding:3px 4px;border-bottom:1px solid #ccfbf1">' + planGpsFmt(it.min, 0) + '</td>' +
                td(it.v.td, 0) + td(it.v.hsr19, 0) + td(it.v.hsr24, 0) + td(it.v.accdec, 0) + '</tr>';
        });
        cuerpo += '</tbody></table>';
    }
    cuerpo += '<div style="font-size:10px;color:#64748b;margin-top:8px;line-height:1.4">Media por jugador: ritmo GPS del ejercicio &times; minutos en esta sesi&oacute;n. No incluye porteros.</div>';
    return cab + cuerpo + '</div>';
}

// ---------- Pintar en el editor ----------
function planGpsRender() {
    var ancla = document.getElementById('lista-previo');
    if (!ancla) return;
    var caja = document.getElementById('plan-gps-objetivo');
    if (!caja) {
        var seccion = ancla.closest ? ancla.closest('.seccion-ejercicios') : ancla.parentNode;
        if (!seccion || !seccion.parentNode) return;
        caja = document.createElement('div');
        caja.id = 'plan-gps-objetivo';
        caja.style.cssText = 'margin-bottom:12px';
        seccion.parentNode.insertBefore(caja, seccion);
    }
    var ses = (typeof sesion !== 'undefined') ? sesion : null;
    var fecha = planGpsFechaSesion();
    var claveActual = (fecha && typeof clubId !== 'undefined' && clubId) ? clubId + '|' + fecha : '';
    var auto = (planGps.autoClave === claveActual) ? planGps.auto : null;
    caja.innerHTML = planGpsHtml(ses, planGps.mapa, planGps.obj, planGps.abierto, planGps.detalle, auto);
    if (!planGps.mapa || planGps.mapaClub !== (typeof clubId !== 'undefined' ? clubId : null)) planGpsCargarMapa(false);
    planGpsPedirObjetivo();
}
function planGpsSetObj(k, valor) {
    var n = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(n) || n <= 0) delete planGps.obj[k]; else planGps.obj[k] = n;
    planGpsRender();
}
function planGpsToggle() { planGps.abierto = !planGps.abierto; planGpsRender(); }
function planGpsToggleDetalle() { planGps.detalle = !planGps.detalle; planGpsRender(); }

// ---------- Enganches: repintar cuando cambia la sesion o su fecha ----------
(function () {
    if (typeof renderizarSesion !== 'function') { console.warn('[PlanGps] renderizarSesion no encontrada'); return; }
    var original = renderizarSesion;
    renderizarSesion = function () {
        var r = original.apply(this, arguments);
        try { planGpsRender(); } catch (e) { console.warn('[PlanGps] render:', e); }
        return r;
    };
})();
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'sesion-fecha') { try { planGpsRender(); } catch (er) { console.warn('[PlanGps] fecha:', er); } }
    });
}

// ---------- Etiqueta de ritmo GPS en las tarjetas de "Mis ejercicios" ----------
function planGpsMarcarBiblioteca() {
    var lista = document.getElementById('lista-ejercicios');
    if (!lista) return;
    var imgs = lista.querySelectorAll('img[data-ejid]');
    if (!imgs.length) return;
    if (!planGps.mapa) { planGpsCargarMapa(false); return; }
    for (var i = 0; i < imgs.length; i++) {
        var id = imgs[i].getAttribute('data-ejid');
        var r = planGps.mapa[id];
        var card = imgs[i].parentNode;
        if (!r || !card || card.querySelector('.plangps-tag')) continue;
        var tags = card.querySelector('.tags');
        if (!tags) continue;
        var s = document.createElement('span');
        s.className = 'tag plangps-tag';
        s.style.cssText = 'background:#ccfbf1;color:#0f766e;font-weight:600';
        s.title = 'Ritmo medido con GPS en ' + r.n_sesiones + (r.n_sesiones === 1 ? ' sesion' : ' sesiones');
        s.textContent = 'GPS ' + planGpsFmt(parseFloat(r.td_min), 0) + ' m/min' + (parseFloat(r.hsr19_min) >= 0.5 ? ' · HSR ' + planGpsFmt(parseFloat(r.hsr19_min), 1) + '/min' : '');
        tags.appendChild(s);
    }
}
setInterval(planGpsMarcarBiblioteca, 1500);

console.log('[PlanGps] plan-gps-objetivo.js v2 cargado');
