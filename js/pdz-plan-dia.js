// ========== PDZ-PLAN-DIA.JS (v1) - Planificar la carga de un dia desde Periodizacion ==========
// Se abre al pulsar una celda de la fila "Planificado" del panel de carga del microciclo
// (pdz-carga.js). Muestra la sesion de ese dia con lo que aporta cada ejercicio (ritmo GPS
// medido x minutos), el objetivo del dia por parametro (bandas MD x perfil de partido) y
// permite anadir ejercicios del banco con datos GPS a la parte de la sesion que se elija,
// cambiar minutos o quitar ejercicios. Escribe directamente en training_sessions (solo la
// columna de la parte afectada), releyendo antes la sesion para no pisar cambios.
// Cargar DESPUES de pdz-carga.js.

var pdzPD = { fecha: null, sesiones: [], idx: 0, ritmo: {}, banco: [], filtro: '', sucio: false, ocupado: false };

var PDZPD_SEC = [
    { col: 'pre_field_work',  lbl: 'Trabajo previo' },
    { col: 'warm_up',         lbl: 'Calentamiento' },
    { col: 'main_part',       lbl: 'Parte principal' },
    { col: 'cool_down',       lbl: 'Vuelta a la calma' },
    { col: 'post_field_work', lbl: 'Post campo' }
];
var PDZPD_MET = [
    { k: 'td',     lbl: 'Distancia',      uni: 'm', dec: 0, ritmo: function (x) { return pdzPDNum(x.td_min); } },
    { k: 'hsr',    lbl: 'HSR >19',        uni: 'm', dec: 0, ritmo: function (x) { return pdzPDNum(x.hsr19_min); } },
    { k: 'sprint', lbl: 'Sprint >24',     uni: 'm', dec: 0, ritmo: function (x) { return pdzPDNum(x.hsr24_min); } },
    { k: 'accdec', lbl: 'Acel + Desacel', uni: '',  dec: 0, ritmo: function (x) { return pdzPDNum(x.acc30_min) + pdzPDNum(x.dec30_min); } }
];

function pdzPDNum(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function pdzPDEsc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pdzPDFmt(v, dec) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    var p = Math.pow(10, dec || 0), n = Math.round(v * p) / p;
    var partes = String(n).split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return partes.join(',');
}
function pdzPDLista(v) {
    if (!v) return [];
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return []; } }
    return Array.isArray(v) ? v : [];
}
function pdzPDAviso(msg, tipo) { if (typeof showToast === 'function') showToast(msg, tipo || 'success'); else if (tipo === 'error') alert(msg); }

// Objetivo del dia [min, max] para una metrica: banda MD del dia x perfil de partido del equipo
function pdzPDObjetivo(fecha, k) {
    var D = (typeof pdzCg !== 'undefined') ? pdzCg.datos : null;
    if (!D || !D.bandas || !D.perfilEquipo || !D.mdLabel) return null;
    var lab = D.mdLabel[fecha] || '';
    if (!lab || lab === 'MD' || lab.indexOf('MD+') === 0) return null;
    var b = D.bandas[lab];
    var ref = pdzPDNum(D.perfilEquipo[k]);
    if (!b || !b[k] || !(ref > 0)) return null;
    return [b[k][0] / 100 * ref, b[k][1] / 100 * ref];
}

// ---------- Abrir / cerrar ----------
async function pdzPlanDiaAbrir(fecha) {
    pdzPD.fecha = fecha; pdzPD.idx = 0; pdzPD.filtro = ''; pdzPD.sucio = false; pdzPD.ocupado = false;
    pdzPDCerrar(true);
    var ov = document.createElement('div');
    ov.id = 'pdzpd-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10040;display:flex;justify-content:center;align-items:flex-start;padding:22px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) pdzPDCerrar(); };
    ov.innerHTML = '<div style="background:#0f172a;border:1px solid #22c55e;border-radius:14px;padding:28px;color:#94a3b8;font-size:13px">Cargando el dia...</div>';
    document.body.appendChild(ov);
    try {
        await pdzPDCargar();
        pdzPDRender();
    } catch (e) {
        console.error('[PlanDia]', e);
        ov.innerHTML = '<div style="background:#0f172a;border:1px solid #dc2626;border-radius:14px;padding:28px;color:#fca5a5;font-size:13px">Error cargando el dia: ' + pdzPDEsc(e.message || e) +
            '<br><br><button onclick="pdzPDCerrar()" style="padding:6px 14px;background:#334155;border:none;color:#cbd5e1;border-radius:8px;cursor:pointer">Cerrar</button></div>';
    }
}

function pdzPDCerrar(silencioso) {
    var ov = document.getElementById('pdzpd-overlay');
    if (ov) ov.remove();
    if (!silencioso && pdzPD.sucio && typeof pdzCargaMicro === 'function' && typeof pdzCg !== 'undefined' && pdzCg.periodo) {
        pdzPD.sucio = false;
        pdzCargaMicro(pdzCg.periodo);   // refresca la fila Planificado de la semana
    }
}

async function pdzPDCargar() {
    var cols = 'id, name, session_date, session_time, ' + PDZPD_SEC.map(function (s) { return s.col; }).join(', ');
    var rs = await supabaseClient.from('training_sessions').select(cols).eq('club_id', clubId).eq('session_date', pdzPD.fecha).order('session_time', { ascending: true });
    if (rs.error) throw rs.error;
    pdzPD.sesiones = rs.data || [];
    if (pdzPD.idx >= pdzPD.sesiones.length) pdzPD.idx = 0;

    var rr = await supabaseClient.from('cm_pf_ej_gps_resumen').select('*').eq('club_id', clubId);
    if (rr.error) throw rr.error;
    pdzPD.ritmo = {};
    (rr.data || []).forEach(function (x) { pdzPD.ritmo[x.activity_ref] = x; });

    var ids = Object.keys(pdzPD.ritmo).filter(function (id) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id); });
    pdzPD.banco = [];
    if (ids.length) {
        var rb = await supabaseClient.from('custom_exercises')
            .select('id, name, category, tema, duration_min, players_count, field_width, field_length, materials, objectives, description')
            .in('id', ids).order('name');
        if (!rb.error) pdzPD.banco = rb.data || [];
    }
}

// ---------- Calculo de la sesion activa ----------
function pdzPDCalc(ses) {
    var out = { tot: {}, nSin: 0, minSin: 0, minTotal: 0, secciones: [] };
    PDZPD_MET.forEach(function (m) { out.tot[m.k] = 0; });
    PDZPD_SEC.forEach(function (sec) {
        var items = pdzPDLista(ses ? ses[sec.col] : null).map(function (ej, i) {
            var min = pdzPDNum(ej && ej.duracion);
            var x = (ej && ej.id !== null && ej.id !== undefined) ? pdzPD.ritmo[String(ej.id)] : null;
            var it = { i: i, id: ej ? ej.id : null, titulo: (ej && ej.titulo) || 'Ejercicio', min: min, datos: !!x, v: {} };
            out.minTotal += min;
            if (x) PDZPD_MET.forEach(function (m) { it.v[m.k] = m.ritmo(x) * min; out.tot[m.k] += it.v[m.k]; });
            else { out.nSin++; out.minSin += min; }
            return it;
        });
        out.secciones.push({ col: sec.col, lbl: sec.lbl, items: items });
    });
    return out;
}

// ---------- Render ----------
function pdzPDRender() {
    var ov = document.getElementById('pdzpd-overlay');
    if (!ov) return;
    var f = pdzPD.fecha;
    var d = new Date(f + 'T12:00:00');
    var dia = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
    var lab = (typeof pdzCg !== 'undefined' && pdzCg.datos && pdzCg.datos.mdLabel) ? (pdzCg.datos.mdLabel[f] || '') : '';

    var css = '<style>' +
        '.pdzpd-modal{background:#0f172a;border:1px solid #22c55e;border-radius:14px;width:100%;max-width:980px;padding:20px;color:#e2e8f0}' +
        '.pdzpd-h{font-size:12px;font-weight:700;color:#e2e8f0;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.4px}' +
        '.pdzpd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:12px}' +
        '.pdzpd-kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 12px}' +
        '.pdzpd-t{width:100%;border-collapse:collapse;font-size:12px}' +
        '.pdzpd-t th{color:#94a3b8;font-size:10px;text-transform:uppercase;text-align:right;padding:5px 6px;border-bottom:1px solid #334155;white-space:nowrap}' +
        '.pdzpd-t td{padding:5px 6px;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap}' +
        '.pdzpd-t th:first-child,.pdzpd-t td:first-child{text-align:left;white-space:normal}' +
        '.pdzpd-inp{background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:6px;padding:4px 6px;font-size:12px}' +
        '.pdzpd-btn{padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid #22c55e;background:#14532d;color:#bbf7d0;font-weight:600}' +
        '.pdzpd-x{padding:3px 8px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid #7f1d1d;background:transparent;color:#fca5a5}' +
        '</style>';
    var cierre = '<button onclick="pdzPDCerrar()" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:15px;flex-shrink:0">x</button>';
    var cab = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div>' +
        '<div style="font-size:17px;font-weight:700">Planificar ' + dia + (lab ? ' <span style="color:#38bdf8;font-size:13px">' + pdzPDEsc(lab) + '</span>' : '') + '</div>';

    if (!pdzPD.sesiones.length) {
        ov.innerHTML = css + '<div class="pdzpd-modal">' + cab + '</div>' + cierre + '</div>' +
            '<p style="color:#94a3b8;font-size:13px;margin-top:16px">No hay ninguna sesion creada este dia. Creala primero en el Planificador (basta con el nombre y la fecha) y vuelve aqui para rellenarla.</p></div>';
        return;
    }
    var ses = pdzPD.sesiones[pdzPD.idx];
    var selSes = '';
    if (pdzPD.sesiones.length > 1) {
        selSes = '<select class="pdzpd-inp" style="margin-top:6px" onchange="pdzPDCambiarSesion(this.value)">' + pdzPD.sesiones.map(function (s, i) {
            return '<option value="' + i + '"' + (i === pdzPD.idx ? ' selected' : '') + '>' + pdzPDEsc(s.name || 'Sesion') + (s.session_time ? ' (' + String(s.session_time).substring(0, 5) + ')' : '') + '</option>';
        }).join('') + '</select>';
    }
    cab += '<div style="color:#94a3b8;font-size:12px;margin-top:3px">' + (selSes || pdzPDEsc(ses.name || 'Sesion')) + '</div></div>' + cierre + '</div>';

    var c = pdzPDCalc(ses);

    // Tarjetas de objetivo por parametro
    var kpis = '<div class="pdzpd-kpis">';
    PDZPD_MET.forEach(function (m) {
        var v = c.tot[m.k], obj = pdzPDObjetivo(f, m.k);
        var color = '#e2e8f0', nota = 'sin objetivo para este dia', pct = 0;
        if (obj) {
            pct = Math.min(100, v / obj[1] * 100);
            if (v < obj[0]) { color = '#fbbf24'; nota = 'faltan ' + pdzPDFmt(obj[0] - v, m.dec) + (m.uni ? ' ' + m.uni : '') + ' para el minimo'; }
            else if (v > obj[1]) { color = '#f87171'; nota = 'sobran ' + pdzPDFmt(v - obj[1], m.dec) + (m.uni ? ' ' + m.uni : ''); }
            else { color = '#4ade80'; nota = 'dentro del objetivo'; }
        }
        kpis += '<div class="pdzpd-kpi"><div style="font-size:10px;color:#94a3b8;text-transform:uppercase">' + m.lbl + '</div>' +
            '<div style="font-size:20px;font-weight:700;color:' + color + '">' + pdzPDFmt(v, m.dec) + (m.uni ? ' <span style="font-size:11px">' + m.uni + '</span>' : '') + '</div>' +
            (obj ? '<div style="font-size:10px;color:#38bdf8">objetivo ' + pdzPDFmt(obj[0], m.dec) + ' - ' + pdzPDFmt(obj[1], m.dec) + '</div>' +
                   '<div style="height:6px;background:#0f172a;border-radius:3px;overflow:hidden;margin:5px 0 3px;position:relative"><div style="height:100%;width:' + Math.round(pct) + '%;background:' + color + '"></div>' +
                   '<div style="position:absolute;top:0;bottom:0;left:' + Math.round(obj[0] / obj[1] * 100) + '%;width:2px;background:#38bdf8" title="minimo"></div></div>' : '') +
            '<div style="font-size:10px;color:' + (obj ? color : '#64748b') + '">' + nota + '</div></div>';
    });
    kpis += '</div>';
    var aviso = c.nSin ? '<div style="font-size:11px;color:#fcd34d;background:#422006;border-radius:6px;padding:6px 10px;margin-top:10px">' + c.nSin + (c.nSin === 1 ? ' ejercicio' : ' ejercicios') + ' de la sesion sin datos GPS (' + pdzPDFmt(c.minSin, 0) + ' min): no cuentan en la suma, asi que el planificado real sera mayor.</div>' : '';

    // Ejercicios de la sesion
    var tabla = '<table class="pdzpd-t"><thead><tr><th>Ejercicio</th><th>Min</th><th>Dist.</th><th>HSR&gt;19</th><th>Sprint&gt;24</th><th>Acc+Dec</th><th></th></tr></thead><tbody>';
    var hayEj = false;
    c.secciones.forEach(function (sec) {
        if (!sec.items.length) return;
        hayEj = true;
        tabla += '<tr><td colspan="7" style="color:#38bdf8;font-size:10px;font-weight:700;text-transform:uppercase;padding-top:9px">' + sec.lbl + '</td></tr>';
        sec.items.forEach(function (it) {
            var cel = function (k, dec) { return '<td style="color:' + (it.datos ? '#e2e8f0' : '#475569') + '">' + (it.datos ? pdzPDFmt(it.v[k], dec) : '-') + '</td>'; };
            tabla += '<tr><td style="color:' + (it.datos ? '#e2e8f0' : '#94a3b8') + '">' + pdzPDEsc(it.titulo) + (it.datos ? '' : ' <span style="color:#64748b;font-size:10px">(sin datos GPS)</span>') + '</td>' +
                '<td><input type="number" min="1" max="180" class="pdzpd-inp" style="width:58px;text-align:right" value="' + it.min + '" onchange="pdzPDCambiarMin(\'' + sec.col + '\',' + it.i + ',this.value)"></td>' +
                cel('td', 0) + cel('hsr', 0) + cel('sprint', 0) + cel('accdec', 0) +
                '<td><button class="pdzpd-x" onclick="pdzPDQuitar(\'' + sec.col + '\',' + it.i + ')">Quitar</button></td></tr>';
        });
    });
    if (!hayEj) tabla += '<tr><td colspan="7" style="color:#64748b;text-align:center;padding:14px">La sesion todavia no tiene ejercicios.</td></tr>';
    tabla += '<tr><td style="font-weight:700;color:#4ade80;border-top:1px solid #334155">TOTAL PLANIFICADO</td><td style="font-weight:700;border-top:1px solid #334155">' + pdzPDFmt(c.minTotal, 0) + '</td>' +
        PDZPD_MET.map(function (m) { return '<td style="font-weight:700;color:#4ade80;border-top:1px solid #334155">' + pdzPDFmt(c.tot[m.k], m.dec) + '</td>'; }).join('') + '<td style="border-top:1px solid #334155"></td></tr>';
    tabla += '</tbody></table>';

    // Banco con datos GPS
    var optsSec = PDZPD_SEC.map(function (s) { return '<option value="' + s.col + '"' + (s.col === 'main_part' ? ' selected' : '') + '>' + s.lbl + '</option>'; }).join('');
    var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var nf = norm(pdzPD.filtro);
    var lista = pdzPD.banco.filter(function (e) { return !nf || norm(e.name).indexOf(nf) !== -1 || norm(e.category).indexOf(nf) !== -1; });
    var banco = '<input type="text" class="pdzpd-inp" id="pdzpd-filtro" placeholder="Filtrar por nombre o categoria..." value="' + pdzPDEsc(pdzPD.filtro) + '" style="width:100%;max-width:300px;margin-bottom:8px" onchange="pdzPDFiltrar(this.value)">';
    if (!pdzPD.banco.length) {
        banco += '<p style="color:#94a3b8;font-size:12px">Todavia no hay ejercicios del banco con datos GPS. Vincula actividades en las sesiones GPS de Preparacion Fisica para que aparezcan aqui.</p>';
    } else {
        banco += '<table class="pdzpd-t"><thead><tr><th>Ejercicio con datos GPS</th><th>m/min</th><th>HSR/min</th><th>Ses.</th><th>Min</th><th>Parte</th><th></th></tr></thead><tbody>';
        lista.forEach(function (e) {
            var x = pdzPD.ritmo[e.id];
            banco += '<tr><td><b>' + pdzPDEsc(e.name) + '</b>' + (e.category ? ' <span style="color:#64748b;font-size:10px">' + pdzPDEsc(e.category) + '</span>' : '') + '</td>' +
                '<td>' + pdzPDFmt(pdzPDNum(x.td_min), 1) + '</td><td>' + pdzPDFmt(pdzPDNum(x.hsr19_min), 1) + '</td><td style="color:' + (x.n_sesiones >= 3 ? '#4ade80' : '#fbbf24') + '" title="Sesiones en las que se ha medido">' + x.n_sesiones + '</td>' +
                '<td><input type="number" min="1" max="180" class="pdzpd-inp" style="width:58px;text-align:right" id="pdzpd-min-' + e.id + '" value="' + (Math.round(pdzPDNum(x.min_medios)) || e.duration_min || 10) + '"></td>' +
                '<td><select class="pdzpd-inp" id="pdzpd-sec-' + e.id + '">' + optsSec + '</select></td>' +
                '<td><button class="pdzpd-btn" onclick="pdzPDAnadir(\'' + e.id + '\')">+ Anadir</button></td></tr>';
        });
        if (!lista.length) banco += '<tr><td colspan="7" style="color:#64748b;text-align:center;padding:12px">Ningun ejercicio coincide con el filtro.</td></tr>';
        banco += '</tbody></table>';
    }

    ov.innerHTML = css + '<div class="pdzpd-modal">' + cab + kpis + aviso +
        '<div class="pdzpd-h">Ejercicios de la sesion</div><div style="overflow-x:auto">' + tabla + '</div>' +
        '<div class="pdzpd-h">Anadir del banco</div><div style="overflow-x:auto">' + banco + '</div>' +
        '<div style="font-size:10px;color:#64748b;margin-top:12px;line-height:1.5">Media por jugador: ritmo GPS medido del ejercicio x minutos. Los cambios se guardan al momento en la sesion (la misma que ves en el Planificador). No tengas esa sesion abierta a la vez en el Planificador: si la guardas alli despues, pisaria lo anadido aqui.</div>' +
    '</div>';
}

function pdzPDCambiarSesion(i) { pdzPD.idx = parseInt(i, 10) || 0; pdzPDRender(); }
function pdzPDFiltrar(v) { pdzPD.filtro = v || ''; pdzPDRender(); }

// ---------- Escritura en la sesion ----------
// Relee la columna de la sesion, aplica el cambio y guarda solo esa columna.
async function pdzPDEscribir(col, cambio) {
    if (pdzPD.ocupado) return false;
    var ses = pdzPD.sesiones[pdzPD.idx];
    if (!ses) return false;
    pdzPD.ocupado = true;
    try {
        var r = await supabaseClient.from('training_sessions').select('id, ' + col).eq('id', ses.id).single();
        if (r.error) throw r.error;
        var arr = pdzPDLista(r.data[col]).slice();
        var nuevo = cambio(arr);
        if (!nuevo) { pdzPD.ocupado = false; return false; }
        var payload = {}; payload[col] = nuevo;
        var u = await supabaseClient.from('training_sessions').update(payload).eq('id', ses.id);
        if (u.error) throw u.error;
        ses[col] = nuevo;
        pdzPD.sucio = true;
        pdzPD.ocupado = false;
        pdzPDRender();
        return true;
    } catch (e) {
        pdzPD.ocupado = false;
        console.error('[PlanDia] guardar:', e);
        pdzPDAviso('No se pudo guardar: ' + (e.message || e), 'error');
        return false;
    }
}

// Comprueba que el ejercicio en esa posicion sigue siendo el mismo que se ve en pantalla
function pdzPDMismo(arr, col, i) {
    var ses = pdzPD.sesiones[pdzPD.idx];
    var local = pdzPDLista(ses[col])[i], remoto = arr[i];
    if (!local || !remoto || String(local.id) !== String(remoto.id) || (local.titulo || '') !== (remoto.titulo || '')) {
        pdzPDAviso('La sesion ha cambiado desde que abriste esta ventana. Cierrala y vuelve a abrirla.', 'error');
        return false;
    }
    return true;
}

async function pdzPDAnadir(id) {
    var e = pdzPD.banco.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    var inpMin = document.getElementById('pdzpd-min-' + id), selSec = document.getElementById('pdzpd-sec-' + id);
    var min = parseInt(inpMin ? inpMin.value : '', 10);
    var col = selSec ? selSec.value : 'main_part';
    if (!(min > 0)) { pdzPDAviso('Pon los minutos del ejercicio', 'error'); return; }

    // Imagen en el mismo formato que usa el Planificador (PNG a partir de la miniatura)
    var imagen = '';
    try {
        var rt = await supabaseClient.from('custom_exercises').select('thumbnail_svg').eq('id', id).single();
        if (rt.data && rt.data.thumbnail_svg && typeof ejSvgToPng === 'function') imagen = await ejSvgToPng(rt.data.thumbnail_svg);
    } catch (eImg) { console.warn('[PlanDia] imagen:', eImg); }

    var nuevoEj = {
        id: e.id,
        titulo: e.name,
        duracion: min,
        imagen: imagen || '',
        objetivo: (e.objectives ? e.objectives + '\n\n' : '') + (e.description || ''),
        entrenador: '',
        equipo: '',
        jugadores: e.players_count || '',
        espacio: (e.field_width && e.field_length) ? e.field_width + 'x' + e.field_length + ' m' : '',
        tema: e.tema || e.category || '',
        material: e.materials || ''
    };
    var ok = await pdzPDEscribir(col, function (arr) { arr.push(nuevoEj); return arr; });
    if (ok) pdzPDAviso('Ejercicio anadido a la sesion');
}

async function pdzPDCambiarMin(col, i, valor) {
    var min = parseInt(valor, 10);
    if (!(min > 0)) { pdzPDRender(); return; }
    await pdzPDEscribir(col, function (arr) {
        if (!pdzPDMismo(arr, col, i)) return null;
        arr[i] = Object.assign({}, arr[i], { duracion: min });
        return arr;
    });
}

async function pdzPDQuitar(col, i) {
    var ses = pdzPD.sesiones[pdzPD.idx];
    var ej = pdzPDLista(ses[col])[i];
    if (!ej) return;
    if (!confirm('Quitar "' + (ej.titulo || 'ejercicio') + '" de la sesion?')) return;
    await pdzPDEscribir(col, function (arr) {
        if (!pdzPDMismo(arr, col, i)) return null;
        arr.splice(i, 1);
        return arr;
    });
}

console.log('[PlanDia] pdz-plan-dia.js v1 cargado');
