// ========== EJ-USOS.JS (v2) - Historial de uso de los ejercicios en las sesiones ==========
// Ventana con buscador: que ejercicios se han usado en las sesiones del club, cuantas veces,
// cuantos minutos, cuando fue la ultima vez y en que sesiones (fecha, nombre, parte y minutos).
// Lee la vista pdz_ejercicios_usados (saca id, titulo y minutos de los ejercicios guardados
// dentro de training_sessions, sin descargar las imagenes). Solo lectura.
// Se abre con ejUsosAbrir(). Cargar despues de core.js.

var ejUsos = { filas: null, grupos: [], q: '', orden: 'veces', abiertos: {}, libres: false };

function ejUsosEsc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ejUsosNorm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
function ejUsosFecha(f) {
    var d = new Date(f + 'T12:00:00');
    return ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function ejUsosCerrar() { var ov = document.getElementById('ejusos-overlay'); if (ov) ov.remove(); if (ejUsos.qTemporal) { ejUsos.q = ''; ejUsos.qTemporal = false; } }

async function ejUsosAbrir() {
    ejUsosCerrar();
    var ov = document.createElement('div');
    ov.id = 'ejusos-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:10060;display:flex;justify-content:center;align-items:flex-start;padding:22px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) ejUsosCerrar(); };
    ov.innerHTML = '<div style="background:#0f172a;border:1px solid #a78bfa;border-radius:14px;padding:28px;color:#94a3b8;font-size:13px">Cargando el historial de ejercicios...</div>';
    document.body.appendChild(ov);
    try {
        // Paginado de 1000 en 1000 (limite de Supabase)
        var todas = [], desde = 0, PAG = 1000;
        while (true) {
            var r = await supabaseClient.from('pdz_ejercicios_usados')
                .select('session_id, session_name, session_date, orden, parte, ejercicio_id, titulo, minutos, tipo')
                .eq('club_id', clubId).order('session_date', { ascending: false }).order('session_id').order('orden')
                .range(desde, desde + PAG - 1);
            if (r.error) throw r.error;
            todas = todas.concat(r.data || []);
            if (!r.data || r.data.length < PAG) break;
            desde += PAG;
        }
        ejUsos.filas = todas;
        ejUsos.abiertos = {};
        ejUsosAgrupar();
        // Abierto desde la ficha de un ejercicio (ejUsosVer): se muestra solo ese, ya desplegado
        if (ejUsos.abrirId) {
            var gSel = ejUsos.grupos.filter(function (g) { return g.clave === 'id:' + ejUsos.abrirId; })[0];
            if (gSel) { ejUsos.q = gSel.titulo; ejUsos.qTemporal = true; ejUsos.orden = 'veces'; ejUsos.abiertos[gSel.clave] = true; }
            ejUsos.abrirId = null;
        }
        ejUsosRender();
    } catch (e) {
        console.error('[EjUsos]', e);
        ov.innerHTML = '<div style="background:#0f172a;border:1px solid #dc2626;border-radius:14px;padding:28px;color:#fca5a5;font-size:13px">Error cargando el historial: ' + ejUsosEsc(e.message || e) +
            '<br><br><button onclick="ejUsosCerrar()" style="padding:6px 14px;background:#334155;border:none;color:#cbd5e1;border-radius:8px;cursor:pointer">Cerrar</button></div>';
    }
}

// Agrupa por ejercicio: por id del banco si lo tiene; los bloques libres, por su titulo
function ejUsosAgrupar() {
    var mapa = {};
    (ejUsos.filas || []).forEach(function (f) {
        var libre = f.tipo === 'libre' || !f.ejercicio_id;
        var clave = libre ? 'libre:' + ejUsosNorm(f.titulo) : 'id:' + f.ejercicio_id;
        var g = mapa[clave];
        if (!g) g = mapa[clave] = { clave: clave, titulo: f.titulo, libre: libre, usos: [], sesiones: {}, min: 0, ultima: f.session_date, primera: f.session_date, nombres: {} };
        g.usos.push(f);
        g.sesiones[f.session_id] = true;
        g.min += parseFloat(f.minutos) || 0;
        g.nombres[ejUsosNorm(f.titulo)] = f.titulo;
        if (f.session_date > g.ultima) { g.ultima = f.session_date; g.titulo = f.titulo; }
        if (f.session_date < g.primera) g.primera = f.session_date;
    });
    ejUsos.grupos = Object.keys(mapa).map(function (k) {
        var g = mapa[k];
        g.veces = Object.keys(g.sesiones).length;
        g.busca = ejUsosNorm(Object.keys(g.nombres).join(' '));
        return g;
    });
}

function ejUsosRender() {
    var ov = document.getElementById('ejusos-overlay');
    if (!ov) return;
    var nq = ejUsosNorm(ejUsos.q);
    var lista = ejUsos.grupos.filter(function (g) { return (ejUsos.libres || !g.libre) && (!nq || g.busca.indexOf(nq) !== -1); });
    lista.sort(function (a, b) {
        if (ejUsos.orden === 'reciente') return a.ultima < b.ultima ? 1 : (a.ultima > b.ultima ? -1 : b.veces - a.veces);
        if (ejUsos.orden === 'nombre') return ejUsosNorm(a.titulo).localeCompare(ejUsosNorm(b.titulo), 'es');
        return (b.veces - a.veces) || (a.ultima < b.ultima ? 1 : -1);
    });
    var nSes = {};
    (ejUsos.filas || []).forEach(function (f) { nSes[f.session_id] = true; });
    var inp = 'background:#1e293b;border:1px solid #475569;color:#e2e8f0;border-radius:6px;padding:6px 9px;font-size:12px';

    var h = '<div style="background:#0f172a;border:1px solid #a78bfa;border-radius:14px;width:100%;max-width:900px;padding:20px;color:#e2e8f0">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div style="font-size:17px;font-weight:700">Ejercicios usados en las sesiones</div>' +
        '<div style="font-size:11px;color:#94a3b8;margin-top:3px">' + ejUsos.grupos.filter(function (g) { return !g.libre; }).length + ' ejercicios distintos en ' + Object.keys(nSes).length + ' sesiones. Pulsa un ejercicio para ver en que sesiones lo has usado.</div></div>' +
        '<button onclick="ejUsosCerrar()" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:15px;flex-shrink:0">x</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px">' +
            '<input type="text" id="ejusos-q" placeholder="Buscar ejercicio por nombre..." value="' + ejUsosEsc(ejUsos.q) + '" oninput="ejUsosBuscar(this.value)" style="' + inp + ';flex:1;min-width:200px">' +
            '<select onchange="ejUsosOrden(this.value)" style="' + inp + '">' +
                [['veces', 'Mas usados'], ['reciente', 'Usados mas recientemente'], ['nombre', 'Por nombre']].map(function (o) { return '<option value="' + o[0] + '"' + (ejUsos.orden === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
            '<label style="font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox"' + (ejUsos.libres ? ' checked' : '') + ' onchange="ejUsosLibres(this.checked)"> Incluir bloques libres</label>' +
        '</div>' +
        '<div id="ejusos-lista" style="margin-top:12px">' + ejUsosHtmlLista(lista) + '</div></div>';
    ov.innerHTML = h;
    var q = document.getElementById('ejusos-q');
    if (q && ejUsos._foco) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) {} }
}

function ejUsosHtmlLista(lista) {
    if (!ejUsos.filas || !ejUsos.filas.length) return '<p style="color:#94a3b8;font-size:13px;padding:14px 0">Todavia no hay sesiones con ejercicios.</p>';
    if (!lista.length) return '<p style="color:#94a3b8;font-size:13px;padding:14px 0">Ningun ejercicio coincide con la busqueda.</p>';
    var MAX = 150;
    var h = '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>' +
        '<th style="text-align:left;padding:6px 8px;color:#94a3b8;font-size:10px;text-transform:uppercase;border-bottom:1px solid #334155">Ejercicio</th>' +
        ['Sesiones', 'Min totales', 'Ultima vez'].map(function (t) { return '<th style="text-align:right;padding:6px 8px;color:#94a3b8;font-size:10px;text-transform:uppercase;border-bottom:1px solid #334155;white-space:nowrap">' + t + '</th>'; }).join('') + '</tr></thead><tbody>';
    lista.slice(0, MAX).forEach(function (g) {
        var abierto = !!ejUsos.abiertos[g.clave];
        var otros = Object.keys(g.nombres).length > 1 ? ' <span style="color:#64748b;font-size:10px" title="' + ejUsosEsc(Object.keys(g.nombres).map(function (k) { return g.nombres[k]; }).join(' | ')) + '">(+' + (Object.keys(g.nombres).length - 1) + ' titulos)</span>' : '';
        h += '<tr onclick="ejUsosToggle(\'' + ejUsosEsc(g.clave).replace(/'/g, '\\\'') + '\')" style="cursor:pointer;border-bottom:1px solid #1e293b' + (abierto ? ';background:#1e1b4b' : '') + '">' +
            '<td style="padding:7px 8px"><span style="color:#a78bfa;display:inline-block;width:14px">' + (abierto ? '&#9660;' : '&#9654;') + '</span><b>' + ejUsosEsc(g.titulo) + '</b>' + otros + (g.libre ? ' <span style="color:#a78bfa;font-size:10px">bloque libre</span>' : '') + '</td>' +
            '<td style="padding:7px 8px;text-align:right;font-weight:700;color:#c4b5fd">' + g.veces + '</td>' +
            '<td style="padding:7px 8px;text-align:right">' + Math.round(g.min) + '</td>' +
            '<td style="padding:7px 8px;text-align:right;white-space:nowrap;color:#cbd5e1">' + ejUsosFecha(g.ultima) + '</td></tr>';
        if (abierto) {
            h += '<tr><td colspan="4" style="padding:4px 8px 12px 30px;background:#0b1120"><table style="width:100%;border-collapse:collapse;font-size:11px">';
            g.usos.forEach(function (u) {
                h += '<tr style="border-bottom:1px solid #1e293b"><td style="padding:4px 6px;white-space:nowrap;color:#cbd5e1;width:120px">' + ejUsosFecha(u.session_date) + '</td>' +
                    '<td style="padding:4px 6px"><b>' + ejUsosEsc(u.session_name || 'Sesion') + '</b>' + (ejUsosNorm(u.titulo) !== ejUsosNorm(g.titulo) ? ' <span style="color:#64748b">como "' + ejUsosEsc(u.titulo) + '"</span>' : '') + '</td>' +
                    '<td style="padding:4px 6px;color:#38bdf8;white-space:nowrap">' + ejUsosEsc(u.parte) + '</td>' +
                    '<td style="padding:4px 6px;text-align:right;white-space:nowrap">' + (u.minutos !== null && u.minutos !== undefined ? Math.round(parseFloat(u.minutos)) + ' min' : '-') + '</td></tr>';
            });
            h += '</table></td></tr>';
        }
    });
    h += '</tbody></table>';
    if (lista.length > MAX) h += '<div style="font-size:11px;color:#64748b;margin-top:8px">Se muestran los ' + MAX + ' primeros de ' + lista.length + '. Escribe en el buscador para afinar.</div>';
    return h;
}

function ejUsosBuscar(v) { ejUsos.q = v || ''; ejUsos._foco = true; ejUsosRender(); ejUsos._foco = false; }
function ejUsosOrden(v) { ejUsos.orden = v; ejUsosRender(); }
function ejUsosLibres(v) { ejUsos.libres = !!v; ejUsosRender(); }
function ejUsosToggle(clave) { ejUsos.abiertos[clave] = !ejUsos.abiertos[clave]; ejUsosRender(); }

// ========== v2: uso de los ejercicios en la biblioteca del planificador ==========
// Ficha del ejercicio con tres pestanas: Resumen (lo que ya pintaba planificador.js) / Uso de la comunidad / Tu uso.
//  - "Tu uso": sesiones del club en las que sale el ejercicio (misma vista que el historial de arriba).
//  - "Uso de la comunidad": tabla ejercicios_uso, que Supabase recalcula cada noche (fn_ejercicios_uso_recalcular)
//    con las sesiones de todos los clubes, sin nombres. Cubre la biblioteca TopLiderCoach y la Comunidad.
// Se monta sobre la ficha y las tarjetas que ya dibuja planificador.js, sin tocar ese archivo.
var ejUsosRes = { usos: null, club: null, t: 0, cargando: false, global: {}, pidiendo: {}, sesiones: {}, listas: { com: [], tu: [] } };
var EJUSOS_MD = ['MD+1', 'MD+2', 'MD+3', 'MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1'];
var EJUSOS_PARTES = ['Trabajo previo', 'Calentamiento', 'Parte principal', 'Vuelta a la calma', 'Post campo', 'Porteros'];
var EJUSOS_SECCION_PARTE = { previo: 'Trabajo previo', calentamiento: 'Calentamiento', principal: 'Parte principal', enfriamiento: 'Vuelta a la calma', postcampo: 'Post campo', porteros: 'Porteros' };
var EJUSOS_MIN_GRAFICA = 10;   // con menos sesiones los porcentajes enganan: se ensenan los numeros

// Misma lectura del dia MD que hace la funcion de Supabase (campo libre "MD (Match Day)" de la sesion)
function ejUsosMd(txt) {
    var x = String(txt || '').toUpperCase().replace(/\s/g, '').replace(/^M([+-])/, 'MD$1');
    if (x === 'MD-6') return 'MD-5';
    return EJUSOS_MD.indexOf(x) !== -1 ? x : null;
}

async function ejUsosCargarResumen(forzar) {
    if (typeof clubId === 'undefined' || !clubId || typeof supabaseClient === 'undefined') return;
    if (ejUsosRes.cargando) return;
    if (!forzar && ejUsosRes.usos && ejUsosRes.club === clubId && Date.now() - ejUsosRes.t < 120000) return;
    ejUsosRes.cargando = true;
    var club = clubId, m = {};
    try {
        var md = {}, desde = 0, PAG = 1000, r;
        while (true) {
            r = await supabaseClient.from('training_sessions').select('id, match_day').eq('club_id', club).order('id').range(desde, desde + PAG - 1);
            if (r.error) throw r.error;
            (r.data || []).forEach(function (s) { md[s.id] = ejUsosMd(s.match_day); });
            if (!r.data || r.data.length < PAG) break;
            desde += PAG;
        }
        desde = 0;
        while (true) {
            r = await supabaseClient.from('pdz_ejercicios_usados')
                .select('ejercicio_id, session_id, session_name, session_date, orden, parte, minutos')
                .eq('club_id', club).not('ejercicio_id', 'is', null)
                .order('session_id').order('orden')
                .range(desde, desde + PAG - 1);
            if (r.error) throw r.error;
            (r.data || []).forEach(function (f) {
                var u = m[f.ejercicio_id];
                if (!u) u = m[f.ejercicio_id] = { ses: {}, n: 0, ultima: f.session_date, filas: [] };
                if (!u.ses[f.session_id]) { u.ses[f.session_id] = true; u.n++; }
                if (f.session_date > u.ultima) u.ultima = f.session_date;
                f.md = md[f.session_id] || null;
                u.filas.push(f);
            });
            if (!r.data || r.data.length < PAG) break;
            desde += PAG;
        }
    } catch (e) {
        console.warn('[EjUsos] uso del club:', e);   // sin estos datos la biblioteca funciona igual
    }
    var porSesion = {};
    Object.keys(m).forEach(function (id) { Object.keys(m[id].ses).forEach(function (sid) { (porSesion[sid] = porSesion[sid] || []).push(id); }); });
    ejUsosRes.usos = m; ejUsosRes.sesiones = porSesion; ejUsosRes.club = club; ejUsosRes.t = Date.now();
    ejUsosRes.cargando = false;
    ejUsosMarcar();
    ejUsosPintarPanel('tu');
}

// Uso de la comunidad de uno o varios ejercicios (se guarda tambien "no hay fila" para no volver a pedirlo)
async function ejUsosPedirGlobal(ids) {
    ids = (ids || []).map(String).filter(function (id) { return !(id in ejUsosRes.global) && !ejUsosRes.pidiendo[id]; });
    if (!ids.length || typeof supabaseClient === 'undefined') return;
    ids.forEach(function (id) { ejUsosRes.pidiendo[id] = true; });
    try {
        var r = await supabaseClient.from('ejercicios_uso').select('ejercicio_id, n_sesiones, n_clubes, n_favoritas, n_copias, min_mediana, md, partes, junto').in('ejercicio_id', ids);
        if (r.error) throw r.error;
        ids.forEach(function (id) { ejUsosRes.global[id] = null; });
        (r.data || []).forEach(function (x) { ejUsosRes.global[x.ejercicio_id] = x; });
    } catch (e) {
        console.warn('[EjUsos] uso de la comunidad:', e);
        ids.forEach(function (id) { ejUsosRes.global[id] = null; });
    }
    ids.forEach(function (id) { delete ejUsosRes.pidiendo[id]; });
    ejUsosMarcar();
    ejUsosPintarPanel('com');
    ejUsosPintarPanel('tu');
}

function ejUsosVeces(n) { return n + (n === 1 ? ' vez' : ' veces'); }
function ejUsosSesiones(n) { return n + (n === 1 ? ' sesión' : ' sesiones'); }
function ejUsosNum(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function ejUsosEsTlc(id) { return /^[0-9]+$/.test(String(id)); }

function ejUsosCss() {
    if (document.getElementById('ejusos-css')) return;
    var st = document.createElement('style');
    st.id = 'ejusos-css';
    st.textContent =
        '.ejusos-tabs{display:flex;gap:4px;background:#f1f5f9;border-radius:10px;padding:4px;margin:0 0 12px}' +
        '.ejusos-tabs button{flex:1;border:0;background:transparent;color:#475569;font-size:13px;font-weight:600;padding:8px 6px;border-radius:7px;cursor:pointer;white-space:nowrap}' +
        '.ejusos-tabs button.on{background:#fff;color:#6d28d9;box-shadow:0 1px 3px rgba(15,23,42,.14)}' +
        '.ejusos-pane{display:none}.ejusos-pane.on{display:block}' +
        '.ejusos-caja{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin:0 0 12px;background:#fff}' +
        '.ejusos-cifras{display:flex;padding:0}.ejusos-cifras>div{flex:1;padding:11px 14px;border-left:1px solid #e2e8f0;min-width:0}.ejusos-cifras>div:first-child{border-left:0}' +
        '.ejusos-rot{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin:0 0 6px}' +
        '.ejusos-cifras b{display:block;font-size:19px;color:#0f172a;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ejusos-cifras>div:first-child b{font-size:27px}' +
        '.ejusos-barras{display:flex;align-items:flex-end;gap:6px;height:118px;margin-top:4px}' +
        '.ejusos-barras>div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:0}' +
        '.ejusos-barras i{display:block;width:100%;border-radius:6px;background:#ddd6fe;min-height:4px}' +
        '.ejusos-barras .max i{background:#7c3aed}' +
        '.ejusos-barras span{font-size:11.5px;font-weight:700;color:#334155;margin-bottom:4px}' +
        '.ejusos-barras em{font-style:normal;font-size:11px;color:#64748b;margin-top:6px;white-space:nowrap}.ejusos-barras .max em{color:#0f172a;font-weight:700}' +
        '.ejusos-barras .sep{flex:0 0 1px;background:#e2e8f0;height:100%}' +
        '.ejusos-eje{display:flex;justify-content:space-between;font-size:10.5px;color:#94a3b8;margin-top:6px}' +
        '.ejusos-partes{display:flex;gap:6px;flex-wrap:wrap}' +
        '.ejusos-partes>div{flex:1;min-width:104px;border:1px solid #e2e8f0;border-radius:8px;padding:7px 9px}' +
        '.ejusos-partes>div.max{border-color:#7c3aed;box-shadow:inset 0 0 0 1px #7c3aed}' +
        '.ejusos-partes small{display:block;font-size:11px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ejusos-partes b{font-size:15px;color:#0f172a}' +
        '.ejusos-partes u{display:block;height:4px;border-radius:2px;background:#ede9fe;margin-top:5px;text-decoration:none;overflow:hidden}.ejusos-partes u>s{display:block;height:100%;background:#a78bfa;text-decoration:none}.ejusos-partes .max u>s{background:#7c3aed}' +
        '.ejusos-nota{font-size:11.5px;color:#94a3b8;margin:0 0 12px;line-height:1.4}' +
        '.ejusos-vacio{border:1px dashed #cbd5e1;border-radius:10px;padding:34px 18px;text-align:center;color:#475569;font-size:13.5px;margin:0 0 12px}.ejusos-vacio b{display:block;color:#0f172a;font-size:14.5px;margin-bottom:6px}' +
        '.ejusos-lista{width:100%;border-collapse:collapse;font-size:12.5px}.ejusos-lista td{padding:5px 4px;border-top:1px solid #f1f5f9;color:#334155;vertical-align:top}.ejusos-lista tr:first-child td{border-top:0}' +
        '.ejusos-btn{background:#fff;border:1px solid #c4b5fd;color:#6d28d9;border-radius:7px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;margin-top:8px}' +
        '.ejusos-junto td>b{display:block;color:#0f172a}.ejusos-junto td>span{font-size:11.5px;color:#64748b}.ejusos-junto td{vertical-align:middle;padding:7px 4px}' +
        '.ejusos-btn-on{background:#7c3aed;border-color:#7c3aed;color:#fff}.ejusos-btn:disabled{opacity:.6;cursor:default}' +
        '.ejusos-frente td{padding:6px 4px}.ejusos-frente tr:first-child td{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;border-top:0}.ejusos-frente td:first-child{color:#64748b}' +
        '.ejusos-gps{background:#f0fdfa;border-color:#99f6e4;color:#0f766e;font-size:13px}';
    document.head.appendChild(st);
}

// ---------- Etiquetas en las tarjetas de la biblioteca ----------
// Recuento propio de un ejercicio (dias MD, partes de la sesion, minutos), calculado una vez
function ejUsosCuentas(u) {
    if (u.cuentas) return u.cuentas;
    var md = {}, partes = {}, vistoMd = {}, vistoParte = {}, mins = [];
    u.filas.forEach(function (f) {
        if (f.md && !vistoMd[f.session_id]) { vistoMd[f.session_id] = true; md[f.md] = (md[f.md] || 0) + 1; }
        if (!vistoParte[f.session_id + '|' + f.parte]) { vistoParte[f.session_id + '|' + f.parte] = true; partes[f.parte] = (partes[f.parte] || 0) + 1; }
        mins.push(parseFloat(f.minutos) || 0);
    });
    u.cuentas = { md: md, partes: partes, med: ejUsosMediana(mins) };
    return u.cuentas;
}
function ejUsosMasHabitual(cuenta, claves) {
    var tot = 0, max = 0, cual = null;
    claves.forEach(function (k) { var n = (cuenta && cuenta[k]) || 0; tot += n; if (n > max) { max = n; cual = k; } });
    return { tot: tot, cual: cual, n: max, parte: tot ? max / tot : 0 };
}
// La sesion que se esta montando: dia MD escrito en la sesion y bloque desde el que se abrio la biblioteca
function ejUsosContexto() {
    var inp = document.getElementById('sesion-md');
    var sec = (typeof planBibSeccion !== 'undefined' && planBibSeccion) ? planBibSeccion : null;
    return { md: inp ? ejUsosMd(inp.value) : null, parte: sec ? (EJUSOS_SECCION_PARTE[sec] || null) : null };
}
// Encaja con la sesion? Devuelve p. ej. ['MD-2', 'calentamiento'].
// El dia MD cuenta si alli esta al menos 1 de cada 4 usos; el bloque, si esta al menos el 40 % (la parte principal no se marca: lo es casi todo).
function ejUsosEncaja(md, partes, ctx, minimo) {
    var out = [];
    if (ctx.md) { var a = ejUsosMasHabitual(md, EJUSOS_MD); if (a.tot >= minimo && ((md[ctx.md] || 0) / a.tot) >= 0.25) out.push(ctx.md); }
    if (ctx.parte && ctx.parte !== 'Parte principal') { var b = ejUsosMasHabitual(partes, EJUSOS_PARTES); if (b.tot >= minimo && ((partes[ctx.parte] || 0) / b.tot) >= 0.4) out.push(ctx.parte.toLowerCase()); }
    return out;
}
function ejUsosPonerTag(tags, texto, titulo, estilo) {
    var s = document.createElement('span');
    s.className = 'tag ejusos-tag';
    s.style.cssText = estilo;
    s.textContent = texto; s.title = titulo;
    tags.appendChild(s);
}
function ejUsosMarcar() {
    var lista = document.getElementById('lista-ejercicios');
    var cards = lista ? lista.querySelectorAll('.ejercicio-card') : [];
    if (typeof clubId === 'undefined' || !clubId) return;
    if (!cards.length && !document.querySelector('#detalle-ejercicio h3')) return;
    if (!ejUsosRes.usos || ejUsosRes.club !== clubId || Date.now() - ejUsosRes.t >= 120000) {
        ejUsosCargarResumen(false);
        if (!ejUsosRes.usos || ejUsosRes.club !== clubId) return;
    }
    var enCom = (typeof bibliotecaFuente !== 'undefined' && bibliotecaFuente === 'com');
    var ctx = ejUsosContexto();
    var sello = (ctx.md || '') + '|' + (ctx.parte || '') + '|' + (enCom ? 'c' : 'x') + '|' + ejUsosRes.t;
    var pedir = [];
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (card.getAttribute('data-ejusos') === sello) continue;
        var mm = /seleccionar(?:Mi)?Ejercicio\('([^']+)'\)/.exec(card.getAttribute('onclick') || '');
        var tags = card.querySelector('.tags');
        if (!mm || !tags) continue;
        var id = mm[1], conGlobal = enCom || ejUsosEsTlc(id);
        if (conGlobal && !(id in ejUsosRes.global)) { pedir.push(id); continue; }
        var viejas = card.querySelectorAll('.ejusos-tag');
        for (var v = 0; v < viejas.length; v++) viejas[v].parentNode.removeChild(viejas[v]);
        var c = conGlobal ? ejUsosRes.global[id] : null, u = ejUsosRes.usos[id];
        // 1) encaja con la sesion que se esta montando (primero con los datos de todos; si no llegan, con los propios)
        var enc = c ? ejUsosEncaja(c.md || {}, c.partes || {}, ctx, EJUSOS_MIN_GRAFICA) : [];
        if (enc.length) ejUsosPonerTag(tags, 'Habitual en ' + enc.join(' y '), 'Los entrenadores de TopLiderCoach lo usan a menudo en ' + enc.join(' y ') + ', como la sesión que estás montando.', 'background:#dcfce7;color:#166534;font-weight:700');
        else if (u) {
            var cu = ejUsosCuentas(u), encTu = ejUsosEncaja(cu.md, cu.partes, ctx, 3);
            if (encTu.length) ejUsosPonerTag(tags, 'Lo sueles usar en ' + encTu.join(' y '), 'En tus sesiones lo pones a menudo en ' + encTu.join(' y ') + ', como la sesión que estás montando.', 'background:#dcfce7;color:#166534;font-weight:700');
        }
        // favoritos: numero junto a la estrella (cuantos entrenadores lo tienen guardado)
        if (c && c.n_favoritas > 0 && card.querySelector('.ejf-star')) {
            var fv = document.createElement('span');
            fv.className = 'ejusos-tag ejusos-fav';
            fv.style.cssText = 'position:absolute;top:1px;right:1px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:8px;background:#7c3aed;color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center;z-index:3;pointer-events:none';
            fv.textContent = c.n_favoritas;
            fv.title = c.n_favoritas + (c.n_favoritas === 1 ? ' entrenador lo tiene' : ' entrenadores lo tienen') + ' en favoritos';
            card.appendChild(fv);
        }
        // 2) cuanto se usa
        if (enCom) {
            if (c && c.n_sesiones > 0) ejUsosPonerTag(tags, 'Comunidad: ' + ejUsosSesiones(c.n_sesiones), 'Usado en ' + ejUsosSesiones(c.n_sesiones) + ' de ' + c.n_clubes + (c.n_clubes === 1 ? ' club' : ' clubes') + '. Se actualiza cada noche.', 'background:#dbeafe;color:#1d4ed8;font-weight:600');
        } else if (u) {
            ejUsosPonerTag(tags, 'Usado ' + ejUsosVeces(u.n), 'Lo has puesto en ' + ejUsosSesiones(u.n) + '. Última vez: ' + ejUsosFecha(u.ultima) + '.', 'background:#ede9fe;color:#6d28d9;font-weight:600');
        }
        card.setAttribute('data-ejusos', sello);
    }
    if (pedir.length) ejUsosPedirGlobal(pedir);
}

// ---------- Piezas de los paneles ----------
function ejUsosHtmlCifras(celdas) {
    return '<div class="ejusos-caja ejusos-cifras">' + celdas.map(function (c) {
        return '<div><div class="ejusos-rot">' + c[0] + '</div><b title="' + ejUsosEsc(c[1]) + '">' + ejUsosEsc(c[1]) + '</b></div>';
    }).join('') + '</div>';
}
// cuenta = { 'MD-2': 31, ... } en sesiones
function ejUsosHtmlMd(cuenta, titulo) {
    var tot = 0, max = 0;
    EJUSOS_MD.forEach(function (k) { var n = (cuenta && cuenta[k]) || 0; tot += n; if (n > max) max = n; });
    if (!tot) return '';
    var h = '<div class="ejusos-caja"><div class="ejusos-rot">' + titulo + '</div>';
    if (tot < EJUSOS_MIN_GRAFICA) {
        h += '<div style="font-size:13px;color:#334155">' + EJUSOS_MD.filter(function (k) { return cuenta[k]; }).map(function (k) { return '<b>' + k + '</b>: ' + ejUsosSesiones(cuenta[k]); }).join(' · ') + '</div>' +
            '<div class="ejusos-nota" style="margin:6px 0 0">Pocas sesiones todavía para sacar porcentajes.</div></div>';
        return h;
    }
    h += '<div class="ejusos-barras">';
    EJUSOS_MD.forEach(function (k, i) {
        var n = cuenta[k] || 0, pc = Math.round(100 * n / tot);
        if (i === 3) h += '<div class="sep"></div>';
        h += '<div' + (n === max ? ' class="max"' : '') + ' title="' + ejUsosSesiones(n) + '"><span>' + pc + '%</span><i style="height:' + Math.max(3, Math.round(78 * n / max)) + 'px"></i><em>' + k + '</em></div>';
    });
    h += '</div><div class="ejusos-eje"><span>← Después del partido</span><span>Antes del partido →</span></div>' +
        '<div class="ejusos-nota" style="margin:6px 0 0">Sobre ' + ejUsosSesiones(tot) + ' con el día MD indicado. MD-5 incluye MD-6.</div></div>';
    return h;
}
// cuenta = { 'Calentamiento': 90, ... } en sesiones
function ejUsosHtmlPartes(cuenta, titulo) {
    var tot = 0, max = 0, hay = [];
    EJUSOS_PARTES.forEach(function (k) { var n = (cuenta && cuenta[k]) || 0; if (n) hay.push(k); tot += n; if (n > max) max = n; });
    if (!tot) return '';
    return '<div class="ejusos-caja"><div class="ejusos-rot">' + titulo + '</div><div class="ejusos-partes">' + hay.map(function (k) {
        var n = cuenta[k], pc = Math.round(100 * n / tot);
        return '<div' + (n === max ? ' class="max"' : '') + ' title="' + ejUsosSesiones(n) + '"><small>' + k + '</small><b>' + (tot < EJUSOS_MIN_GRAFICA ? n : pc + '%') + '</b><u><s style="width:' + pc + '%"></s></u></div>';
    }).join('') + '</div></div>';
}
function ejUsosMediana(v) {
    v = v.filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Lista "suele ir con": filas = [{ id, titulo, n, min }]; cual = 'com' | 'tu'
function ejUsosHtmlJunto(filas, cual, titulo) {
    ejUsosRes.listas[cual] = filas || [];
    if (!filas || !filas.length) return '';
    return '<div class="ejusos-caja"><div class="ejusos-rot">' + titulo + '</div><table class="ejusos-lista ejusos-junto">' + filas.map(function (f, i) {
        return '<tr><td><b>' + ejUsosEsc(f.titulo || 'Ejercicio') + '</b><span>Juntos en ' + ejUsosSesiones(f.n) + '</span></td>' +
            '<td style="text-align:right;white-space:nowrap"><button type="button" class="ejusos-btn" style="margin:0" onclick="ejUsosJuntoVer(\'' + cual + '\',' + i + ')">Ver</button> ' +
            '<button type="button" class="ejusos-btn ejusos-btn-on" style="margin:0" onclick="ejUsosJuntoAnadir(\'' + cual + '\',' + i + ', this)">+ Añadir</button></td></tr>';
    }).join('') + '</table></div>';
}
function ejUsosJuntoVer(cual, i) {
    var f = ejUsosRes.listas[cual][i];
    if (f && typeof seleccionarEjercicio === 'function') seleccionarEjercicio(String(f.id));
}
// Anade el ejercicio sugerido al bloque abierto sin cambiar la ficha que se esta viendo
async function ejUsosJuntoAnadir(cual, i, btn) {
    var f = ejUsosRes.listas[cual][i];
    if (!f) return;
    var antes = (typeof ejercicioSeleccionado !== 'undefined') ? ejercicioSeleccionado : null;
    var falso = { dataset: { ejercicio: JSON.stringify({ id: ejUsosEsTlc(f.id) ? parseInt(f.id, 10) : f.id, titulo: f.titulo || 'Ejercicio', duracion: Math.round(f.min) || 15, imagen: '', fuente: 'custom' }) } };
    if (btn) { btn.disabled = true; btn.textContent = 'Añadiendo...'; }
    try {
        if (ejUsosEsTlc(f.id)) await agregarEjercicioDesdeBoton(falso); else await agregarMiEjercicioDesdeBoton(falso);
        if (btn) btn.textContent = 'Añadido';
    } catch (e) {
        console.warn('[EjUsos] anadir sugerido:', e);
        if (btn) { btn.disabled = false; btn.textContent = '+ Añadir'; }
    }
    // con la biblioteca abierta el alta es directa: la ficha sigue siendo la del ejercicio que se estaba viendo
    if (typeof planBibSeccion !== 'undefined' && planBibSeccion && antes) ejercicioSeleccionado = antes;
}
// Ejercicios que el propio club pone en las mismas sesiones que este
function ejUsosJuntoPropio(id) {
    var u = ejUsosRes.usos[id], cuenta = {};
    if (!u) return [];
    Object.keys(u.ses).forEach(function (sid) {
        (ejUsosRes.sesiones[sid] || []).forEach(function (otro) { if (otro !== id) cuenta[otro] = (cuenta[otro] || 0) + 1; });
    });
    return Object.keys(cuenta).filter(function (k) { return cuenta[k] >= 2; }).sort(function (a, b) { return (cuenta[b] - cuenta[a]) || (a < b ? -1 : 1); }).slice(0, 3).map(function (k) {
        var o = ejUsosRes.usos[k], ult = o.filas.slice().sort(function (a, b) { return a.session_date < b.session_date ? 1 : -1; })[0];
        return { id: k, titulo: ult ? ult.titulo : 'Ejercicio', n: cuenta[k], min: ejUsosCuentas(o).med };
    });
}
function ejUsosHtmlFrente(cu, c) {
    if (!c || c.n_sesiones < EJUSOS_MIN_GRAFICA) return '';
    var filas = [];
    if (cu.med !== null && c.min_mediana !== null && c.min_mediana !== undefined) filas.push(['Duración', Math.round(cu.med) + "'", Math.round(parseFloat(c.min_mediana)) + "'", '']);
    var a = ejUsosMasHabitual(cu.md, EJUSOS_MD), b = ejUsosMasHabitual(c.md || {}, EJUSOS_MD);
    if (a.cual && b.cual && b.tot >= EJUSOS_MIN_GRAFICA) filas.push(['Día más habitual', a.cual, b.cual, ' (' + Math.round(100 * b.parte) + '%)']);
    var pa = ejUsosMasHabitual(cu.partes, EJUSOS_PARTES), pb = ejUsosMasHabitual(c.partes || {}, EJUSOS_PARTES);
    if (pa.cual && pb.cual) filas.push(['Parte de la sesión', pa.cual, pb.cual, ' (' + Math.round(100 * pb.parte) + '%)']);
    if (!filas.length) return '';
    return '<div class="ejusos-caja"><div class="ejusos-rot">Tú frente a la comunidad</div><table class="ejusos-lista ejusos-frente"><tr><td></td><td>Tú</td><td>Comunidad</td></tr>' + filas.map(function (f) {
        return '<tr><td>' + f[0] + '</td><td><b' + (f[1] !== f[2] ? ' style="color:#6d28d9"' : '') + '>' + f[1] + '</b></td><td>' + f[2] + f[3] + '</td></tr>';
    }).join('') + '</table></div>';
}

function ejUsosHtmlTu(id) {
    ejUsosRes.listas.tu = [];
    if (!ejUsosRes.usos) return '<div class="ejusos-vacio">Cargando tu uso...</div>';
    var u = ejUsosRes.usos[id];
    if (!u) return '<div class="ejusos-vacio"><b>Todavía no has usado este ejercicio</b>Cuando lo pongas en tus sesiones, verás aquí cómo lo usas.</div>';
    var cu = ejUsosCuentas(u);
    var h = ejUsosHtmlCifras([['Sesiones', ejUsosNum(u.n)], ['Última vez', ejUsosFecha(u.ultima).slice(4)], ['Duración mediana', cu.med === null ? '-' : Math.round(cu.med) + "'"]]);
    var g = (typeof planGps !== 'undefined' && planGps && planGps.mapa) ? planGps.mapa[id] : null;
    if (g && !isNaN(parseFloat(g.td_min))) {
        h += '<div class="ejusos-caja ejusos-gps"><div class="ejusos-rot" style="color:#0f766e">Tu medición con GPS</div><b>' + ejUsosNum(parseFloat(g.td_min)) + ' m/min</b> por jugador' +
            (parseFloat(g.hsr19_min) >= 0.05 ? ' · alta velocidad <b>' + String(Math.round(parseFloat(g.hsr19_min) * 10) / 10).replace('.', ',') + ' m/min</b>' : '') +
            ' · medido en ' + ejUsosSesiones(g.n_sesiones) + '</div>';
    }
    h += ejUsosHtmlFrente(cu, ejUsosRes.global[id]);
    h += ejUsosHtmlMd(cu.md, 'Cuándo lo usas') + ejUsosHtmlPartes(cu.partes, 'En qué parte de la sesión lo pones');
    h += ejUsosHtmlJunto(ejUsosJuntoPropio(id), 'tu', 'Lo sueles poner con');
    var ult = u.filas.slice().sort(function (a, b) { return a.session_date < b.session_date ? 1 : (a.session_date > b.session_date ? -1 : 0); }).slice(0, 5);
    h += '<div class="ejusos-caja"><div class="ejusos-rot">Últimas sesiones</div><table class="ejusos-lista">' + ult.map(function (f) {
        return '<tr><td style="white-space:nowrap;color:#64748b">' + ejUsosFecha(f.session_date) + '</td><td><b>' + ejUsosEsc(f.session_name || 'Sesión') + '</b></td><td style="white-space:nowrap">' + ejUsosEsc(f.parte) + '</td><td style="text-align:right;white-space:nowrap">' + (f.minutos !== null && f.minutos !== undefined ? Math.round(parseFloat(f.minutos)) + ' min' : '') + '</td></tr>';
    }).join('') + '</table><button type="button" class="ejusos-btn" onclick="ejUsosVer(\'' + ejUsosEsc(id) + '\')">Ver todas en el historial</button></div>';
    return h;
}

function ejUsosHtmlCom(id) {
    ejUsosRes.listas.com = [];
    if (!(id in ejUsosRes.global)) return '<div class="ejusos-vacio">Cargando el uso de la comunidad...</div>';
    var c = ejUsosRes.global[id];
    if (!c || !c.n_sesiones) return '<div class="ejusos-vacio"><b>Todavía no hay datos de uso</b>Cuando los entrenadores lo pongan en sus sesiones, verás aquí cuándo y cómo lo usan.</div>' +
        '<div class="ejusos-nota">Se actualiza cada noche.</div>';
    var cifras = [['Sesiones', ejUsosNum(c.n_sesiones)], ['Clubes', ejUsosNum(c.n_clubes)]];
    cifras.push(ejUsosEsTlc(id) ? ['Favoritas', ejUsosNum(c.n_favoritas || 0)] : ['Copiado', ejUsosNum(c.n_copias || 0)]);
    cifras.push(['Duración mediana', c.min_mediana === null || c.min_mediana === undefined ? '-' : Math.round(parseFloat(c.min_mediana)) + "'"]);
    return ejUsosHtmlCifras(cifras) + ejUsosHtmlMd(c.md || {}, 'Cuándo se usa') + ejUsosHtmlPartes(c.partes || {}, 'En qué parte de la sesión se pone') +
        ejUsosHtmlJunto(Array.isArray(c.junto) ? c.junto : [], 'com', 'Suele ir en la misma sesi\u00f3n que') +
        '<div class="ejusos-nota">Suma de las sesiones de todos los clubes de TopLiderCoach, sin nombres de club ni de entrenador. No cuenta las sesiones de ejemplo. Se actualiza cada noche.</div>';
}

// ---------- Ficha con pestanas ----------
function ejUsosIdFicha() {
    return (typeof ejercicioSeleccionado !== 'undefined' && ejercicioSeleccionado && ejercicioSeleccionado.id !== null && ejercicioSeleccionado.id !== undefined) ? String(ejercicioSeleccionado.id) : null;
}
function ejUsosTab(cual) {
    var det = document.getElementById('detalle-ejercicio');
    if (!det) return;
    ejUsosRes.tab = cual;
    var bs = det.querySelectorAll('.ejusos-tabs button'), ps = det.querySelectorAll('.ejusos-pane');
    for (var i = 0; i < bs.length; i++) bs[i].className = bs[i].getAttribute('data-p') === cual ? 'on' : '';
    for (var j = 0; j < ps.length; j++) ps[j].className = 'ejusos-pane' + (ps[j].getAttribute('data-p') === cual ? ' on' : '');
    det.scrollTop = 0;
    if (det.parentNode && det.parentNode.scrollTop) det.parentNode.scrollTop = 0;
}
function ejUsosPintarPanel(cual) {
    var det = document.getElementById('detalle-ejercicio');
    var id = det ? det.getAttribute('data-ejusos-id') : null;
    if (!id) return;
    var p = det.querySelector('.ejusos-pane[data-p="' + cual + '"]');
    if (cual === 'com') {
        // la pestana de la comunidad solo existe para la biblioteca TopLiderCoach y para los ejercicios de la Comunidad
        var hayFila = !!ejUsosRes.global[id];
        var b = det.querySelector('.ejusos-tabs button[data-p="com"]');
        if (b) b.style.display = (ejUsosEsTlc(id) || hayFila) ? '' : 'none';
        if (b && b.style.display === 'none' && ejUsosRes.tab === 'com') ejUsosTab('res');
    }
    if (p) p.innerHTML = cual === 'com' ? ejUsosHtmlCom(id) : ejUsosHtmlTu(id);
}
function ejUsosMontarFicha() {
    var det = document.getElementById('detalle-ejercicio');
    if (!det) return;
    if (!det.__ejUsosObs && typeof MutationObserver !== 'undefined') {
        det.__ejUsosObs = new MutationObserver(function () { try { ejUsosMontarFicha(); } catch (e) {} });
        det.__ejUsosObs.observe(det, { childList: true });
    }
    var h3 = null;
    for (var k = 0; k < det.children.length; k++) if (det.children[k].tagName === 'H3') { h3 = det.children[k]; break; }
    if (!h3 || det.querySelector('.ejusos-tabs')) return;
    var id = ejUsosIdFicha();
    if (!id) return;
    ejUsosCss();
    var res = document.createElement('div');
    res.className = 'ejusos-pane on'; res.setAttribute('data-p', 'res');
    var hijos = Array.prototype.slice.call(det.children), boton = null;
    hijos.forEach(function (n) {
        if (n === h3) return;
        if (n.tagName === 'BUTTON' && /btn-primary/.test(n.className)) { boton = n; return; }   // "Anadir a Sesion" se queda fuera, pegado abajo
        res.appendChild(n);
    });
    var tabs = document.createElement('div');
    tabs.className = 'ejusos-tabs';
    tabs.innerHTML = '<button type="button" data-p="res" class="on" onclick="ejUsosTab(\'res\')">Resumen</button>' +
        '<button type="button" data-p="com" onclick="ejUsosTab(\'com\')"' + (ejUsosEsTlc(id) ? '' : ' style="display:none"') + '>Uso de la comunidad</button>' +
        '<button type="button" data-p="tu" onclick="ejUsosTab(\'tu\')">Tu uso</button>';
    var com = document.createElement('div'); com.className = 'ejusos-pane'; com.setAttribute('data-p', 'com');
    var tu = document.createElement('div'); tu.className = 'ejusos-pane'; tu.setAttribute('data-p', 'tu');
    det.setAttribute('data-ejusos-id', id);
    ejUsosRes.tab = 'res';
    det.insertBefore(tu, boton); det.insertBefore(com, tu); det.insertBefore(res, com); det.insertBefore(tabs, res); det.insertBefore(h3, tabs);
    ejUsosPintarPanel('tu');
    ejUsosPintarPanel('com');
    ejUsosPedirGlobal([id]);
    if (!ejUsosRes.usos || ejUsosRes.club !== clubId) ejUsosCargarResumen(false);
}

// Abre el historial mostrando solo ese ejercicio, con sus sesiones desplegadas
function ejUsosVer(id) { ejUsos.abrirId = String(id); ejUsosAbrir(); }

if (!window.__ejUsosMarcarIv) window.__ejUsosMarcarIv = setInterval(function () { try { ejUsosMontarFicha(); ejUsosMarcar(); } catch (e) {} }, 1200);

console.log('[EjUsos] ej-usos.js v2 cargado');
