// ========== PLAN-GPS-OBJETIVO.JS (v1) - Carga estimada de la sesion con datos GPS ==========
// En el editor de sesion (Planificador > Mi Sesion) pinta un panel con la carga
// fisica estimada: ritmo GPS de cada ejercicio del banco (vista cm_pf_ej_gps_resumen)
// multiplicado por los minutos que tiene en la sesion. Permite fijar un objetivo
// por parametro y ver cuanto falta o sobra.
// Tambien anade una etiqueta con el ritmo GPS en las tarjetas de "Mis ejercicios".
// No modifica planificador.js ni guarda nada en la base de datos.
// Cargar DESPUES de planificador.js.

var planGps = { mapa: null, mapaClub: null, cargando: false, ultimaCarga: 0, obj: {}, abierto: true, detalle: false };

var PLANGPS_MET = [
    { k: 'td',     campo: 'td_min',      lbl: 'Distancia',        uni: 'm', dec: 0 },
    { k: 'hsr19',  campo: 'hsr19_min',   lbl: 'HSR >19 km/h',     uni: 'm', dec: 0 },
    { k: 'hsr24',  campo: 'hsr24_min',   lbl: 'HSR >24 km/h',     uni: 'm', dec: 0 },
    { k: 'spr',    campo: 'sprints_min', lbl: 'Sprints',          uni: '',  dec: 1 },
    { k: 'acc',    campo: 'acc30_min',   lbl: 'Aceleraciones >3', uni: '',  dec: 1 },
    { k: 'dec',    campo: 'dec30_min',   lbl: 'Desaceleraciones >3', uni: '', dec: 1 }
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

// ---------- Calculo ----------
// Devuelve {tot:{k:valor}, items:[{titulo, min, datos:true|false, n, v:{k:valor}}], minCon, minSin, nSin}
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
                    var ritmo = parseFloat(r[m.campo]);
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
function planGpsHtml(ses, mapa, obj, abierto, detalle) {
    var c = planGpsCalcular(ses, mapa);
    var cab = '<div onclick="planGpsToggle()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:9px 12px;background:linear-gradient(135deg,#0f766e,#115e59);color:#fff;border-radius:8px 8px ' + (abierto ? '0 0' : '8px 8px') + ';font-size:13px;font-weight:600">' +
        '<span>Carga estimada (GPS)</span><span style="font-size:11px;font-weight:400">' +
        (c.nCon ? planGpsFmt(c.tot.td, 0) + ' m &middot; ' : '') + (abierto ? '&#9650;' : '&#9660;') + '</span></div>';
    if (!abierto) return cab;

    var cuerpo = '<div style="border:1px solid #99f6e4;border-top:none;border-radius:0 0 8px 8px;padding:10px 12px;background:#f0fdfa">';
    if (!mapa) {
        cuerpo += '<div style="color:#64748b;font-size:12px">Cargando datos GPS de tus ejercicios...</div></div>';
        return cab + cuerpo;
    }
    if (!c.items.length) {
        cuerpo += '<div style="color:#64748b;font-size:12px">A&ntilde;ade ejercicios a la sesi&oacute;n y aqu&iacute; ver&aacute;s la carga f&iacute;sica estimada con los datos GPS de tu banco.</div></div>';
        return cab + cuerpo;
    }

    PLANGPS_MET.forEach(function (m) {
        var est = c.tot[m.k];
        var o = parseFloat(obj[m.k]);
        var tieneObj = !isNaN(o) && o > 0;
        var pct = tieneObj ? est / o * 100 : 0;
        var color = '#14b8a6', txt = '';
        if (tieneObj) {
            var dif = o - est;
            if (pct < 90) { color = '#f59e0b'; txt = 'faltan ' + planGpsFmt(dif, m.dec) + (m.uni ? ' ' + m.uni : ''); }
            else if (pct <= 110) { color = '#22c55e'; txt = 'objetivo cumplido'; }
            else { color = '#ef4444'; txt = 'sobran ' + planGpsFmt(-dif, m.dec) + (m.uni ? ' ' + m.uni : ''); }
        }
        cuerpo += '<div style="margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#134e4a">' +
                '<span style="font-weight:600">' + m.lbl + '</span>' +
                '<span style="display:flex;align-items:center;gap:6px"><b>' + planGpsFmt(est, m.dec) + (m.uni ? ' ' + m.uni : '') + '</b>' +
                '<span style="color:#64748b">/</span>' +
                '<input type="number" min="0" step="any" value="' + (tieneObj ? o : '') + '" placeholder="objetivo" onclick="event.stopPropagation()" onchange="planGpsSetObj(\'' + m.k + '\', this.value)" ' +
                    'style="width:78px;padding:3px 6px;border:1px solid #99f6e4;border-radius:5px;font-size:12px;text-align:right;background:#fff;color:#134e4a"></span>' +
            '</div>' +
            (tieneObj
                ? '<div style="height:8px;background:#ccfbf1;border-radius:4px;overflow:hidden;margin-top:4px"><div style="height:100%;width:' + Math.min(100, Math.round(pct)) + '%;background:' + color + '"></div></div>' +
                  '<div style="font-size:11px;color:' + color + ';margin-top:2px;font-weight:600">' + Math.round(pct) + '% &middot; ' + txt + '</div>'
                : '') +
        '</div>';
    });

    var aviso = '';
    if (c.nSin) {
        aviso = '<div style="font-size:11px;color:#b45309;background:#fef3c7;border-radius:6px;padding:5px 8px;margin-top:6px">' +
            c.nSin + (c.nSin === 1 ? ' ejercicio' : ' ejercicios') + ' sin datos GPS (' + planGpsFmt(c.minSin, 0) + ' min): la estimaci&oacute;n no los cuenta.</div>';
    }
    cuerpo += aviso;

    cuerpo += '<div style="margin-top:8px"><a href="#" onclick="planGpsToggleDetalle();return false" style="font-size:11px;color:#0f766e">' + (detalle ? 'Ocultar' : 'Ver') + ' desglose por ejercicio</a></div>';
    if (detalle) {
        cuerpo += '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px;color:#134e4a"><thead><tr>' +
            '<th style="text-align:left;padding:3px 4px;border-bottom:1px solid #99f6e4">Ejercicio</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">Min</th>' +
            '<th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">Dist.</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">HSR19</th>' +
            '<th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">HSR24</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">Spr</th>' +
            '<th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">Acc</th><th style="text-align:right;padding:3px 4px;border-bottom:1px solid #99f6e4">Dec</th></tr></thead><tbody>';
        c.items.forEach(function (it) {
            var td = function (v, dec) { return '<td style="text-align:right;padding:3px 4px;border-bottom:1px solid #ccfbf1">' + (it.datos ? planGpsFmt(v, dec) : '-') + '</td>'; };
            cuerpo += '<tr' + (it.datos ? '' : ' style="color:#94a3b8"') + '><td style="padding:3px 4px;border-bottom:1px solid #ccfbf1;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + planGpsEsc(it.titulo) + (it.datos ? ' (medido en ' + it.n + (it.n === 1 ? ' sesion)' : ' sesiones)') : ' (sin datos GPS)') + '">' + planGpsEsc(it.titulo) + '</td>' +
                '<td style="text-align:right;padding:3px 4px;border-bottom:1px solid #ccfbf1">' + planGpsFmt(it.min, 0) + '</td>' +
                td(it.v.td, 0) + td(it.v.hsr19, 0) + td(it.v.hsr24, 0) + td(it.v.spr, 1) + td(it.v.acc, 1) + td(it.v.dec, 1) + '</tr>';
        });
        cuerpo += '</tbody></table>';
    }
    cuerpo += '<div style="font-size:10px;color:#64748b;margin-top:8px;line-height:1.4">Media por jugador: ritmo GPS del ejercicio &times; minutos en esta sesi&oacute;n. No incluye porteros ni las pausas entre ejercicios.</div>';
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
    caja.innerHTML = planGpsHtml(ses, planGps.mapa, planGps.obj, planGps.abierto, planGps.detalle);
    if (!planGps.mapa || planGps.mapaClub !== (typeof clubId !== 'undefined' ? clubId : null)) planGpsCargarMapa(false);
}
function planGpsSetObj(k, valor) {
    var n = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(n) || n <= 0) delete planGps.obj[k]; else planGps.obj[k] = n;
    planGpsRender();
}
function planGpsToggle() { planGps.abierto = !planGps.abierto; planGpsRender(); }
function planGpsToggleDetalle() { planGps.detalle = !planGps.detalle; planGpsRender(); }

// ---------- Enganche: repintar cada vez que cambia la sesion ----------
(function () {
    if (typeof renderizarSesion !== 'function') { console.warn('[PlanGps] renderizarSesion no encontrada'); return; }
    var original = renderizarSesion;
    renderizarSesion = function () {
        var r = original.apply(this, arguments);
        try { planGpsRender(); } catch (e) { console.warn('[PlanGps] render:', e); }
        return r;
    };
})();

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

console.log('[PlanGps] plan-gps-objetivo.js v1 cargado');
