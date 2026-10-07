// ========== EJ-USOS.JS (v1) - Historial de uso de los ejercicios en las sesiones ==========
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

function ejUsosCerrar() { var ov = document.getElementById('ejusos-overlay'); if (ov) ov.remove(); }

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

console.log('[EjUsos] ej-usos.js v1 cargado');
