// ========== CM-PREPFISICA-GPS.JS - Importador CSV de dispositivos GPS (v2, multimarca) ==========
// Importa el CSV que exporta la plataforma del GPS con todos los jugadores de una sesion.
// Reconoce la marca sola, por las columnas del archivo:
//   - 'dispositivo' : formato del dispositivo TopLiderCoach (separador ';', campos entrecomillados,
//                     columnas "Player No.", "Player Name", "Time Played", "Distance (m)"...).
//   - 'soccerlab'   : exportacion de SoccerLab (separador ',', linea entera entre comillas,
//                     columnas name, time_active, totaldistance, walkdistance...).
// Empareja jugadores por: 1) emparejamiento recordado de otras importaciones, 2) dorsal,
// 3) nombre exacto, 4) nombre contenido, 5) nombre parecido (se marca "Revisar").
// Guarda en las tablas existentes cm_pf_gps_sessions + cm_pf_gps_player_data (segmento TOTAL).
// Lo que una marca trae de mas va a extra_metrics; no quedan columnas vacias de otras marcas.
// No modifica cm-prepfisica.js: inyecta su boton envolviendo cmPfRenderPanel.

var cmPfDev = {
    formato: null,      // 'dispositivo' | 'soccerlab'
    filas: [],          // filas normalizadas del CSV
    fechaCsv: null,     // YYYY-MM-DD detectada
    tituloCsv: '',      // sugerido desde el nombre del archivo
    jugadores: [],      // [{id, name, dorsal}]
    asignacion: {},     // indice de fila -> player_id | '' (no importar)
    metodo: {}          // indice de fila -> 'alias' | 'dorsal' | 'nombre' | 'aprox' | ''
};

var CMPF_DEV_FORMATOS = {
    dispositivo: {
        etiqueta: 'Dispositivo TopLiderCoach',
        source: 'device_csv',
        nota: 'Zonas: 0-7 / 7-14 / 14-19 / 19-25 / +25 km/h (la Z5 se calcula por diferencia con la distancia total). HSR = HID &gt;19 &middot; Sprint = HID &gt;24. Los HID &gt;21 y acc/dec a 2,5 y 4 m/s&sup2; se guardan en metricas extra.'
    },
    soccerlab: {
        etiqueta: 'SoccerLab',
        source: 'soccerlab_csv',
        nota: 'Zonas: andar 0-7,2 / trote 7,2-14,4 / carrera 14,4-19,8 / sprint 19,8-25,2 / sprint alto +25,2 km/h. HSR = distancia a mas de 19,8 &middot; Sprint = distancia a mas de 25,2 (high intensity). Acc y Dec = totales (&gt;2 m/s&sup2;). Minutos = tiempo activo. Pulso, TRIMP, cambios de direccion, impactos y el resto se guardan en metricas extra. Los jugadores con menos de 1 minuto activo no se importan.'
    }
};

// ---------- Inyeccion del boton en la barra de filtros de Sesiones GPS ----------
(function () {
    function inyectarBoton() {
        if (document.getElementById('cmpf-btn-import-dev')) return;
        var barra = document.querySelector('.cmpf-ses-filtros');
        if (!barra) return;
        var btnConfig = barra.querySelector('button[onclick*="cmPfToggleConfig"]');
        var b = document.createElement('button');
        b.className = 'cmpf-btn cmpf-btn-warning cmpf-btn-sm';
        b.id = 'cmpf-btn-import-dev';
        b.textContent = 'Importar dispositivo';
        b.onclick = cmPfDevAbrir;
        if (btnConfig) barra.insertBefore(b, btnConfig);
        else barra.appendChild(b);
    }

    function envolver() {
        if (typeof cmPfRenderPanel !== 'function') return false;
        var orig = cmPfRenderPanel;
        cmPfRenderPanel = function (c) {
            orig(c);
            inyectarBoton();
        };
        return true;
    }

    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        if (envolver() || intentos > 600) {
            clearInterval(t);
            inyectarBoton();
        }
    }, 300);
})();

// ---------- Utilidades de parseo ----------
function cmPfDevParseLinea(linea) {
    // Campos entrecomillados separados por ';'
    var out = [];
    var re = /"([^"]*)"/g, m;
    while ((m = re.exec(linea)) !== null) out.push(m[1]);
    return out;
}

function cmPfDevParseTiempo(t) {
    // "49' 43''" -> minutos decimales
    if (!t) return null;
    var m = t.match(/(\d+)'\s*(\d+)?/);
    if (!m) return null;
    return parseInt(m[1]) + (m[2] ? parseInt(m[2]) / 60 : 0);
}

function cmPfDevParseFecha(f) {
    // "08/08/2026 12:30" -> "2026-08-08"
    if (!f) return null;
    var m = f.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    return m[3] + '-' + m[2] + '-' + m[1];
}

function cmPfDevNum(v) {
    if (v === undefined || v === null || v === '') return null;
    var n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
}

function cmPfDevRed(v, dec) {
    if (v === null || v === undefined) return null;
    var f = Math.pow(10, dec || 0);
    return Math.round(v * f) / f;
}

// Nombre normalizado: mayusculas, sin acentos, solo letras y numeros separados por un espacio
function cmPfDevNorm(s) {
    return (s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Z0-9]+/g, ' ').trim();
}

// Texto del archivo: UTF-8 si es valido; si no, Windows-1252 (asi no se rompen la ñ ni los acentos)
function cmPfDevDecodificar(buffer) {
    var texto;
    try {
        texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        texto = new TextDecoder('windows-1252').decode(buffer);
    }
    return texto.replace(/^﻿/, '');
}

// ---------- Deteccion de formato ----------
function cmPfDevDetectar(cabecera) {
    var disp = cmPfDevParseLinea(cabecera);
    if (disp.indexOf('Player No.') !== -1 && disp.indexOf('Player Name') !== -1) return 'dispositivo';
    var sl = cabecera.replace(/"/g, '').toLowerCase().split(',').map(function (c) { return c.trim(); });
    if (sl.indexOf('name') !== -1 && sl.indexOf('totaldistance') !== -1 && sl.indexOf('time_active') !== -1) return 'soccerlab';
    return null;
}

// ---------- Parseo: dispositivo TopLiderCoach ----------
function cmPfDevParsearDispositivo(lineas) {
    var cab = cmPfDevParseLinea(lineas[0]);
    var idx = {};
    cab.forEach(function (c, i) { idx[c] = i; });

    var requeridas = ['Player No.', 'Player Name', 'Time Played', 'Distance (m)'];
    for (var r = 0; r < requeridas.length; r++) {
        if (idx[requeridas[r]] === undefined) throw new Error('Formato no reconocido: falta la columna "' + requeridas[r] + '"');
    }

    // Localizar columnas por patron (los umbrales podrian variar entre exportaciones)
    var col = function (patron) {
        for (var i = 0; i < cab.length; i++) { if (cab[i].indexOf(patron) === 0) return i; }
        return -1;
    };
    var cHid19 = col('HID distance (> 19'), cHid21 = col('HID distance (> 21'), cHid24 = col('HID distance (> 24');
    var cSpr = col('# of Sprints'), cVmax = col('Max Speed'), cVavg = col('Avg Speed');
    var cAcc25 = col('# of Accelerations (> 2.5'), cAcc30 = col('# of Accelerations (> 3'), cAcc40 = col('# of Accelerations (> 4');
    var cDec25 = col('# of Decelerations (> 2.5'), cDec30 = col('# of Decelerations (> 3'), cDec40 = col('# of Decelerations (> 4');
    var cR1 = col('Distance Speed Range (0'), cR2 = col('Distance Speed Range (7'), cR3 = col('Distance Speed Range (14'), cR4 = col('Distance Speed Range (19');

    var filas = [], fecha = null;
    for (var li = 1; li < lineas.length; li++) {
        var v = cmPfDevParseLinea(lineas[li]);
        if (v.length < 5) continue;
        if (!fecha) fecha = cmPfDevParseFecha(v[idx['Activity Date']]);

        var td = cmPfDevNum(v[idx['Distance (m)']]);
        var minutos = cmPfDevParseTiempo(v[idx['Time Played']]);
        var z1 = cR1 >= 0 ? cmPfDevNum(v[cR1]) : null;
        var z2 = cR2 >= 0 ? cmPfDevNum(v[cR2]) : null;
        var z3 = cR3 >= 0 ? cmPfDevNum(v[cR3]) : null;
        var z4 = cR4 >= 0 ? cmPfDevNum(v[cR4]) : null;
        // Z5 (+25 km/h) por diferencia con la distancia total (verificado con datos reales)
        var z5 = null;
        if (td !== null && z1 !== null && z2 !== null && z3 !== null && z4 !== null) {
            z5 = Math.max(0, Math.round((td - z1 - z2 - z3 - z4) * 100) / 100);
        }
        var acc25 = cAcc25 >= 0 ? cmPfDevNum(v[cAcc25]) : null, acc40 = cAcc40 >= 0 ? cmPfDevNum(v[cAcc40]) : null;
        var dec25 = cDec25 >= 0 ? cmPfDevNum(v[cDec25]) : null, dec40 = cDec40 >= 0 ? cmPfDevNum(v[cDec40]) : null;

        filas.push({
            dorsal_csv: v[idx['Player No.']],
            nombre_csv: v[idx['Player Name']],
            minutos: minutos,
            duracion_sesion: null,
            inactivo: false,
            total_distance_m: td,
            hsr_distance_m: cHid19 >= 0 ? cmPfDevNum(v[cHid19]) : null,
            sprint_distance_m: cHid24 >= 0 ? cmPfDevNum(v[cHid24]) : null,
            sprint_count: cSpr >= 0 ? cmPfDevNum(v[cSpr]) : null,
            max_speed_kmh: cVmax >= 0 ? cmPfDevNum(v[cVmax]) : null,
            accel_count: cAcc30 >= 0 ? cmPfDevNum(v[cAcc30]) : null,
            decel_count: cDec30 >= 0 ? cmPfDevNum(v[cDec30]) : null,
            player_load: null,
            hr_avg: null, hr_max: null,
            z1_distance_m: z1, z2_distance_m: z2, z3_distance_m: z3, z4_distance_m: z4, z5_distance_m: z5,
            distance_per_min: (td !== null && minutos) ? Math.round(td / minutos * 10) / 10 : null,
            extra: {
                avg_speed_kmh: cVavg >= 0 ? cmPfDevNum(v[cVavg]) : null,
                hid21_m: cHid21 >= 0 ? cmPfDevNum(v[cHid21]) : null,
                acc_25: acc25 !== null ? Math.round(acc25) : null,
                acc_40: acc40 !== null ? Math.round(acc40) : null,
                dec_25: dec25 !== null ? Math.round(dec25) : null,
                dec_40: dec40 !== null ? Math.round(dec40) : null
            }
        });
    }
    return { filas: filas, fecha: fecha };
}

// ---------- Parseo: SoccerLab ----------
// walk + jog + run + sprint = distancia total (comprobado con archivos reales).
// 'hisprintdistance' (>25,2 km/h) esta DENTRO de 'sprintdistance' (>19,8) y 'speedzone_6_distance'
// dentro de 'hisprintdistance': no se suman como zonas aparte para no contar metros dos veces.
function cmPfDevParsearSoccerlab(lineas) {
    var partir = function (l) { return l.replace(/"/g, '').split(',').map(function (c) { return c.trim(); }); };
    var cab = partir(lineas[0]).map(function (c) { return c.toLowerCase(); });
    var idx = {};
    cab.forEach(function (c, i) { idx[c] = i; });

    var filas = [];
    for (var li = 1; li < lineas.length; li++) {
        var v = partir(lineas[li]);
        if (v.length < 5 || !v[idx['name']]) continue;
        var g = function (k) { return idx[k] === undefined ? null : cmPfDevNum(v[idx[k]]); };

        var td = g('totaldistance');
        var minutos = g('time_active');
        var sprint = g('sprintdistance');      // > 19,8 km/h (incluye el sprint alto)
        var hisprint = g('hisprintdistance');  // > 25,2 km/h
        var z4 = (sprint !== null && hisprint !== null) ? Math.max(0, sprint - hisprint) : sprint;
        var inactivo = (minutos === null || minutos < 1);

        filas.push({
            dorsal_csv: '',
            nombre_csv: v[idx['name']],
            minutos: minutos,
            duracion_sesion: g('duration'),
            inactivo: inactivo,
            total_distance_m: td,
            hsr_distance_m: sprint,
            sprint_distance_m: hisprint,
            sprint_count: g('numberofsprints'),
            max_speed_kmh: cmPfDevRed(g('maxspeed'), 2),
            accel_count: g('total_accelerations'),
            decel_count: g('total_decelerations'),
            player_load: cmPfDevRed(g('playerload3d'), 1),
            hr_avg: g('avghr'), hr_max: g('maxhr'),
            z1_distance_m: cmPfDevRed(g('walkdistance'), 1),
            z2_distance_m: cmPfDevRed(g('jogdistance'), 1),
            z3_distance_m: cmPfDevRed(g('rundistance'), 1),
            z4_distance_m: cmPfDevRed(z4, 1),
            z5_distance_m: cmPfDevRed(hisprint, 1),
            distance_per_min: (td !== null && minutos && !inactivo) ? Math.round(td / minutos * 10) / 10 : null,
            extra: {
                avg_speed_kmh: cmPfDevRed(g('avgspeed'), 2),
                hmld_m: cmPfDevRed(g('high_metabolic_load_distance'), 0),
                avg_metabolic_power: cmPfDevRed(g('mp'), 2),
                energy_expenditure: cmPfDevRed(g('energy_expenditure'), 2),
                player_load_2d: cmPfDevRed(g('playerload2d'), 1),
                z6_distance_m: cmPfDevRed(g('speedzone_6_distance'), 1),
                repeated_sprints: g('numberofrepeatedsprints'),
                hi_sprints: g('numberofhisprints'),
                acc_high: g('high_accelerations'),
                dec_high: g('high_decelerations'),
                impacts_high: g('high_impacts'),
                impacts_total: g('total_impacts'),
                cod: g('cod'),
                hr_z1_min: cmPfDevRed(g('hrzone1'), 1),
                hr_z2_min: cmPfDevRed(g('hrzone2'), 1),
                hr_z3_min: cmPfDevRed(g('hrzone3'), 1),
                hr_z4_min: cmPfDevRed(g('hrzone4'), 1),
                hr_z5_min: cmPfDevRed(g('hrzone5'), 1),
                hr_anaerobic_min: cmPfDevRed(g('hrzoneanaerobic'), 1),
                hr_trimp: cmPfDevRed(g('hrtrimp'), 1),
                hr_quality: cmPfDevRed(g('hr_quality'), 0),
                session_duration_min: cmPfDevRed(g('duration'), 1)
            }
        });
    }
    return { filas: filas, fecha: null };
}

// Fecha y titulo desde el nombre del archivo de SoccerLab: "SOCCERLAB_20261109T171925.937794MONSCALPE.csv"
function cmPfDevNombreSoccerlab(nombre) {
    var base = (nombre || '').replace(/\.csv$/i, '');
    var m = base.match(/(\d{4})(\d{2})(\d{2})T\d{6}(?:\.\d+)?(.*)$/);
    if (!m) return { fecha: null, titulo: '' };
    var resto = (m[4] || '').replace(/_/g, ' ').trim();
    resto = resto.replace(/\s*\(\d+\)\s*$/, '').trim(); if (!/[A-Za-z]/.test(resto)) resto = '';
    return { fecha: m[1] + '-' + m[2] + '-' + m[3], titulo: resto };
}

// ---------- Parseo general: devuelve {formato, filas, fecha, titulo} o lanza Error ----------
function cmPfDevParsear(texto, nombreArchivo) {
    var lineas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (lineas.length < 2) throw new Error('El CSV no tiene datos');

    var formato = cmPfDevDetectar(lineas[0]);
    if (!formato) throw new Error('Formato no reconocido. Marcas admitidas: dispositivo TopLiderCoach y SoccerLab.');

    var res, fecha, titulo;
    if (formato === 'soccerlab') {
        res = cmPfDevParsearSoccerlab(lineas);
        var n = cmPfDevNombreSoccerlab(nombreArchivo);
        fecha = n.fecha; titulo = n.titulo;
    } else {
        res = cmPfDevParsearDispositivo(lineas);
        fecha = res.fecha;
        // Titulo sugerido desde el nombre: "Pretemporada_RSG_B-PCF_-_09-08..." -> "Pretemporada RSG B-PCF"
        var base = (nombreArchivo || '').replace(/\.csv$/i, '');
        var corte = base.search(/_-_|_\d{2}-\d{2}-\d{4}/);
        titulo = (corte > 0 ? base.substring(0, corte) : base).replace(/_/g, ' ').trim();
    }
    if (res.filas.length === 0) throw new Error('No se han podido leer filas del CSV');
    return { formato: formato, filas: res.filas, fecha: fecha, titulo: titulo };
}

// ---------- Emparejado de jugadores ----------
function cmPfDevLev(a, b) {
    if (a === b) return 0;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
        var cur = [i];
        for (j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}

function cmPfDevTokenIgual(a, b) {
    if (a === b) return true;
    var corto = Math.min(a.length, b.length);
    if (corto >= 7) return cmPfDevLev(a, b) <= 2;
    if (corto >= 5) return cmPfDevLev(a, b) <= 1;
    return false;
}

// Devuelve {asignacion:{i:pid|''}, metodo:{i:'alias'|'dorsal'|'nombre'|'aprox'|''}}
function cmPfDevEmparejar(filas, jugadores, alias) {
    alias = alias || {};
    var asignacion = {}, metodo = {};
    var porId = {};
    jugadores.forEach(function (j) { porId[j.id] = j; });
    var tokens = function (s) { return cmPfDevNorm(s).split(' ').filter(function (t) { return t.length >= 3; }); };

    filas.forEach(function (f, i) {
        var pid = '', met = '';
        var nc = cmPfDevNorm(f.nombre_csv);

        // 1) Emparejamiento recordado
        if (nc && alias[nc] && porId[alias[nc]]) { pid = alias[nc]; met = 'alias'; }

        // 2) Dorsal exacto
        if (!pid) {
            var d = parseInt(f.dorsal_csv);
            if (!isNaN(d)) {
                var porDorsal = jugadores.filter(function (j) { return j.dorsal === d; });
                if (porDorsal.length === 1) { pid = porDorsal[0].id; met = 'dorsal'; }
            }
        }

        // 3) Nombre exacto  4) nombre contenido
        if (!pid && nc) {
            var exacto = jugadores.filter(function (j) { return cmPfDevNorm(j.name) === nc; });
            if (exacto.length === 1) { pid = exacto[0].id; met = 'nombre'; }
            else {
                var cont = jugadores.filter(function (j) {
                    var nj = cmPfDevNorm(j.name);
                    return nj && (nj.indexOf(nc) !== -1 || nc.indexOf(nj) !== -1);
                });
                if (cont.length === 1) { pid = cont[0].id; met = 'nombre'; }
            }
        }

        // 5) Nombre parecido: el jugador con mas palabras en comun, si es el unico mejor
        if (!pid && nc) {
            var tc = tokens(f.nombre_csv);
            var mejor = 0, candidatos = [];
            jugadores.forEach(function (j) {
                var tj = tokens(j.name);
                var n = 0;
                tc.forEach(function (a) { if (tj.some(function (b) { return cmPfDevTokenIgual(a, b); })) n++; });
                if (n > mejor) { mejor = n; candidatos = [j]; }
                else if (n === mejor && n > 0) candidatos.push(j);
            });
            if (mejor > 0 && candidatos.length === 1) { pid = candidatos[0].id; met = 'aprox'; }
        }

        // Sin actividad: no se importa por defecto (el usuario puede asignarlo a mano)
        if (f.inactivo) { pid = ''; met = ''; }

        asignacion[i] = pid;
        metodo[i] = met;
    });

    // Un mismo jugador no puede quedar asignado a dos filas por parecido: se deja la primera
    var usados = {};
    filas.forEach(function (f, i) {
        var p = asignacion[i];
        if (!p) return;
        if (usados[p] !== undefined && metodo[i] === 'aprox') { asignacion[i] = ''; metodo[i] = ''; return; }
        usados[p] = i;
    });

    return { asignacion: asignacion, metodo: metodo };
}

function cmPfDevAlias() {
    return (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.import_aliases) || {};
}

// ---------- Abrir modal ----------
function cmPfDevAbrir() {
    cmPfDevCerrar();
    var ov = document.createElement('div');
    ov.id = 'cmpfdev-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9500;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) cmPfDevCerrar(); };
    ov.innerHTML =
    '<style>' +
        '.cmpfdev-modal{background:#0f172a;border-radius:14px;width:100%;max-width:860px;max-height:90vh;overflow-y:auto;border:1px solid #fbbf24;padding:22px}' +
        '.cmpfdev-modal h3{color:#e2e8f0;font-size:18px;margin:0}' +
        '.cmpfdev-tabla{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}' +
        '.cmpfdev-tabla th{color:#94a3b8;text-align:left;padding:6px 8px;border-bottom:1px solid #334155;font-size:11px;text-transform:uppercase;letter-spacing:.5px}' +
        '.cmpfdev-tabla td{color:#e2e8f0;padding:6px 8px;border-bottom:1px solid #1e293b}' +
        '.cmpfdev-tabla select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 6px;border-radius:5px;font-size:12px;max-width:180px}' +
        '.cmpfdev-warn{background:#451a03;color:#fcd34d;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}' +
        '.cmpfdev-ok{background:#052e16;color:#86efac;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}' +
        '.cmpfdev-off{background:#1e293b;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}' +
        '.cmpfdev-marca{display:inline-block;background:#1e3a5f;color:#93c5fd;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;margin-bottom:12px}' +
    '</style>' +
    '<div class="cmpfdev-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>Importar sesion del dispositivo GPS</h3>' +
            '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfDevCerrar()">x</button>' +
        '</div>' +
        '<p style="color:#94a3b8;font-size:13px;margin:6px 0 14px">Sube el CSV que exporta la plataforma de tu GPS (todos los jugadores de la sesion en un archivo). La marca se reconoce sola: dispositivo TopLiderCoach y SoccerLab.</p>' +
        '<input type="file" id="cmpfdev-file" accept=".csv" style="color:#e2e8f0;font-size:13px" onchange="cmPfDevLeerArchivo(this)">' +
        '<div id="cmpfdev-contenido" style="margin-top:16px"></div>' +
    '</div>';
    document.body.appendChild(ov);
}

function cmPfDevCerrar() {
    var ov = document.getElementById('cmpfdev-overlay');
    if (ov) ov.remove();
    cmPfDev.formato = null;
    cmPfDev.filas = [];
    cmPfDev.asignacion = {};
    cmPfDev.metodo = {};
}

// ---------- Leer y parsear el archivo ----------
function cmPfDevLeerArchivo(input) {
    var file = input.files && input.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var texto = cmPfDevDecodificar(e.target.result);
            var res = cmPfDevParsear(texto, file.name);
            cmPfDev.formato = res.formato;
            cmPfDev.filas = res.filas;
            cmPfDev.fechaCsv = res.fecha;
            cmPfDev.tituloCsv = res.titulo || '';
            cmPfDevCargarJugadoresYRender();
        } catch (err) {
            showToast((err && err.message) ? err.message : 'Error leyendo CSV', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

// ---------- Emparejar jugadores y renderizar vista previa ----------
async function cmPfDevCargarJugadoresYRender() {
    var cont = document.getElementById('cmpfdev-contenido');
    if (cont) cont.innerHTML = '<p style="color:#94a3b8;font-size:13px">Emparejando jugadores...</p>';

    try {
        var pr = await supabaseClient.from('club_players')
            .select('id, name').eq('club_id', clubId).eq('active', true).order('name');
        var sr = await supabaseClient.from('club_player_seasons')
            .select('player_id, shirt_number').eq('club_id', clubId).eq('active', true);
        var dorsalMap = {};
        (sr.data || []).forEach(function (s) {
            if (s.shirt_number !== null && s.shirt_number !== undefined) dorsalMap[s.player_id] = s.shirt_number;
        });
        cmPfDev.jugadores = (pr.data || []).map(function (p) {
            return { id: p.id, name: p.name, dorsal: dorsalMap[p.id] !== undefined ? dorsalMap[p.id] : null };
        });

        var em = cmPfDevEmparejar(cmPfDev.filas, cmPfDev.jugadores, cmPfDevAlias());
        cmPfDev.asignacion = em.asignacion;
        cmPfDev.metodo = em.metodo;

        cmPfDevRenderPreview();
    } catch (e) {
        if (cont) cont.innerHTML = '<p style="color:#fca5a5;font-size:13px">Error: ' + (e.message || e) + '</p>';
    }
}

function cmPfDevAsignar(i, valor) {
    cmPfDev.asignacion[i] = valor;
    cmPfDev.metodo[i] = valor ? 'manual' : '';
}

function cmPfDevRenderPreview() {
    var cont = document.getElementById('cmpfdev-contenido');
    if (!cont) return;
    var fmt = CMPF_DEV_FORMATOS[cmPfDev.formato] || CMPF_DEV_FORMATOS.dispositivo;

    // Equipo: si el club solo tiene uno, o hay uno elegido en la cabecera, se preselecciona
    var equipos = (typeof cmPfEquipos !== 'undefined' ? cmPfEquipos : []);
    var equipoSel = '';
    if (typeof cmState !== 'undefined' && cmState && cmState.equipoSeleccionado && cmState.equipoSeleccionado.id) equipoSel = cmState.equipoSeleccionado.id;
    else if (equipos.length === 1) equipoSel = equipos[0].id;
    var equiposOpts = '<option value="">-- Equipo --</option>';
    equipos.forEach(function (t) {
        equiposOpts += '<option value="' + t.id + '"' + (t.id === equipoSel ? ' selected' : '') + '>' + t.name + (t.category ? ' (' + t.category + ')' : '') + '</option>';
    });

    var nInactivos = cmPfDev.filas.filter(function (f) { return f.inactivo; }).length;

    var h = '<div class="cmpfdev-marca">Formato detectado: ' + fmt.etiqueta + ' &middot; ' + cmPfDev.filas.length + ' jugadores' +
        (nInactivos ? ' (' + nInactivos + ' sin actividad)' : '') + '</div>';

    h += '<div class="cmpf-form-row-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' +
        '<div class="cmpf-form-group"><label>Tipo</label><select id="cmpfdev-tipo"><option value="training">Entreno</option><option value="match">Partido</option></select></div>' +
        '<div class="cmpf-form-group"><label>Fecha</label><input type="date" id="cmpfdev-fecha" value="' + (cmPfDev.fechaCsv || '') + '"></div>' +
        '<div class="cmpf-form-group"><label>Titulo</label><input type="text" id="cmpfdev-titulo" value="' + cmPfDev.tituloCsv.replace(/"/g, '&quot;') + '"></div>' +
        '<div class="cmpf-form-group"><label>Rival</label><input type="text" id="cmpfdev-rival"></div>' +
    '</div>' +
    '<div class="cmpf-form-group" style="max-width:280px"><label>Equipo</label><select id="cmpfdev-equipo">' + equiposOpts + '</select></div>';

    // Tabla de jugadores
    h += '<table class="cmpfdev-tabla"><thead><tr>' +
        '<th>CSV</th><th>Jugador del club</th><th>Min</th><th>Dist</th><th>m/min</th><th>Vmax</th><th>Calidad</th>' +
        '</tr></thead><tbody>';

    cmPfDev.filas.forEach(function (f, i) {
        var opts = '<option value="">-- No importar --</option>';
        cmPfDev.jugadores.forEach(function (j) {
            var sel = cmPfDev.asignacion[i] === j.id ? ' selected' : '';
            opts += '<option value="' + j.id + '"' + sel + '>' + (j.dorsal !== null ? j.dorsal + ' - ' : '') + j.name + '</option>';
        });

        var calidad = '<span class="cmpfdev-ok">OK</span>';
        if (f.inactivo) {
            calidad = '<span class="cmpfdev-off" title="Menos de 1 minuto activo: no se importa">Sin actividad</span>';
        } else if (f.distance_per_min !== null && f.distance_per_min > 160) {
            calidad = '<span class="cmpfdev-warn" title="Ritmo fisicamente improbable: revisa si el dispositivo quedo encendido">' + f.distance_per_min + ' m/min</span>';
        } else if (!cmPfDev.asignacion[i]) {
            calidad = '<span class="cmpfdev-warn">Sin emparejar</span>';
        } else if (cmPfDev.metodo[i] === 'aprox') {
            calidad = '<span class="cmpfdev-warn" title="Emparejado por nombre parecido: comprueba que es el jugador correcto. Al importar se recordara.">Revisar</span>';
        }

        h += '<tr' + (f.inactivo ? ' style="opacity:.55"' : '') + '>' +
            '<td>' + (f.dorsal_csv ? f.dorsal_csv + ' - ' : '') + f.nombre_csv + '</td>' +
            '<td><select onchange="cmPfDevAsignar(' + i + ',this.value)">' + opts + '</select></td>' +
            '<td>' + (f.minutos !== null ? Math.round(f.minutos) + "'" : '-') + '</td>' +
            '<td>' + (f.total_distance_m !== null ? Math.round(f.total_distance_m) + ' m' : '-') + '</td>' +
            '<td>' + (f.distance_per_min !== null ? f.distance_per_min : '-') + '</td>' +
            '<td>' + (f.max_speed_kmh !== null ? f.max_speed_kmh : '-') + '</td>' +
            '<td>' + calidad + '</td>' +
        '</tr>';
    });
    h += '</tbody></table>';

    h += '<p style="color:#64748b;font-size:11px;margin-top:10px">' + fmt.nota + '</p>';

    h += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">' +
        '<button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfDevCerrar()">Cancelar</button>' +
        '<button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" id="cmpfdev-btn-guardar" onclick="cmPfDevGuardar()">Importar sesion</button>' +
    '</div>';

    cont.innerHTML = h;
}

// ---------- Fila de la tabla cm_pf_gps_player_data a partir de una fila normalizada ----------
function cmPfDevFilaBD(f, pid, sid) {
    var ent = function (v) { return (v !== null && v !== undefined) ? Math.round(v) : null; };
    var extra = { distance_per_min: f.distance_per_min };
    Object.keys(f.extra || {}).forEach(function (k) { extra[k] = f.extra[k]; });
    if (cmPfDev.formato && cmPfDev.formato !== 'dispositivo') extra.gps_brand = cmPfDev.formato;
    return {
        club_id: clubId, session_id: sid, player_id: pid, segment_name: 'TOTAL', archived: false, archived_at: null,
        total_distance_m: ent(f.total_distance_m),
        hsr_distance_m: ent(f.hsr_distance_m),
        sprint_distance_m: ent(f.sprint_distance_m),
        max_speed_kmh: f.max_speed_kmh,
        sprint_count: ent(f.sprint_count),
        accel_count: ent(f.accel_count),
        decel_count: ent(f.decel_count),
        player_load: f.player_load,
        hr_avg: ent(f.hr_avg),
        hr_max: ent(f.hr_max),
        duration_min: ent(f.minutos),
        z1_distance_m: f.z1_distance_m, z2_distance_m: f.z2_distance_m,
        z3_distance_m: f.z3_distance_m, z4_distance_m: f.z4_distance_m,
        z5_distance_m: f.z5_distance_m,
        extra_metrics: extra,
        notes: null
    };
}

// ---------- Recordar el emparejamiento nombre-del-CSV -> jugador para la proxima vez ----------
async function cmPfDevGuardarAlias() {
    try {
        if (typeof cmPfGpsConfig === 'undefined' || !cmPfGpsConfig) return;
        var alias = {};
        var previos = cmPfGpsConfig.import_aliases || {};
        Object.keys(previos).forEach(function (k) { alias[k] = previos[k]; });
        var cambios = 0;
        cmPfDev.filas.forEach(function (f, i) {
            var pid = cmPfDev.asignacion[i];
            var k = cmPfDevNorm(f.nombre_csv);
            if (!pid || !k) return;
            if (alias[k] !== pid) { alias[k] = pid; cambios++; }
        });
        if (!cambios) return;
        var r = await supabaseClient.from('cm_pf_gps_config')
            .update({ import_aliases: alias, updated_at: new Date().toISOString() }).eq('club_id', clubId);
        if (!r.error) cmPfGpsConfig.import_aliases = alias;
    } catch (e) { console.warn('[PrepFisica] No se pudo recordar el emparejamiento', e); }
}

// ---------- Guardar ----------
async function cmPfDevGuardar() {
    var fecha = (document.getElementById('cmpfdev-fecha') || {}).value;
    if (!fecha) { showToast('Indica la fecha'); return; }
    var tipo = (document.getElementById('cmpfdev-tipo') || {}).value || 'training';
    var titulo = ((document.getElementById('cmpfdev-titulo') || {}).value || '').trim();
    var rival = ((document.getElementById('cmpfdev-rival') || {}).value || '').trim();
    var tid = (document.getElementById('cmpfdev-equipo') || {}).value || null;
    var fmt = CMPF_DEV_FORMATOS[cmPfDev.formato] || CMPF_DEV_FORMATOS.dispositivo;

    var seleccionadas = cmPfDev.filas.filter(function (f, i) { return cmPfDev.asignacion[i]; });
    if (seleccionadas.length === 0) { showToast('No hay ningun jugador emparejado'); return; }

    // Un jugador del club no puede recibir dos filas del CSV
    var visto = {}, repetido = null;
    cmPfDev.filas.forEach(function (f, i) {
        var p = cmPfDev.asignacion[i];
        if (!p) return;
        if (visto[p]) repetido = f.nombre_csv;
        visto[p] = true;
    });
    if (repetido) { showToast('Hay un jugador del club asignado a dos filas del CSV (' + repetido + ')', 'error'); return; }

    var btn = document.getElementById('cmpfdev-btn-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Importando...'; }

    try {
        // Reutilizar sesion existente (misma fecha+tipo+titulo) o crearla
        // (una sesion eliminada/archivada no se reutiliza: se crea una nueva limpia)
        var q = supabaseClient.from('cm_pf_gps_sessions').select('id')
            .eq('club_id', clubId).eq('session_date', fecha).eq('session_type', tipo);
        q = titulo ? q.eq('title', titulo) : q.is('title', null);
        var sr = await q.or('archived.is.null,archived.eq.false').limit(1).maybeSingle();
        var sid;
        var durMax = 0;
        cmPfDev.filas.forEach(function (f) {
            var d = f.duracion_sesion || f.minutos;
            if (d && d > durMax) durMax = d;
        });
        if (sr.data) {
            sid = sr.data.id;
        } else {
            var ins = await supabaseClient.from('cm_pf_gps_sessions').insert({
                club_id: clubId, session_date: fecha, session_type: tipo,
                title: titulo || null, opponent: rival || null, team_id: tid,
                duration_min: durMax ? Math.round(durMax) : null, source: fmt.source
            }).select('id').single();
            if (ins.error) throw ins.error;
            sid = ins.data.id;
        }

        // Evitar duplicados: jugadores que ya tienen TOTAL en esta sesion
        var ex = await supabaseClient.from('cm_pf_gps_player_data').select('player_id')
            .eq('session_id', sid).eq('segment_name', 'TOTAL').eq('archived', false);
        var yaExisten = {};
        (ex.data || []).forEach(function (r) { yaExisten[r.player_id] = true; });

        var rows = [], saltados = 0;
        cmPfDev.filas.forEach(function (f, i) {
            var pid = cmPfDev.asignacion[i];
            if (!pid) return;
            if (yaExisten[pid]) { saltados++; return; }
            rows.push(cmPfDevFilaBD(f, pid, sid));
        });

        if (rows.length === 0) {
            showToast(saltados > 0 ? 'Todos los jugadores ya estaban importados en esta sesion' : 'Nada que importar');
            if (btn) { btn.disabled = false; btn.textContent = 'Importar sesion'; }
            return;
        }

        // upsert: si el jugador tenia un registro archivado (borrado) en esta sesion, se sustituye por el nuevo
        var res = await supabaseClient.from('cm_pf_gps_player_data').upsert(rows, { onConflict: 'session_id,player_id,segment_name' });
        if (res.error) throw res.error;

        await cmPfDevGuardarAlias();

        showToast(rows.length + ' jugadores importados' + (saltados > 0 ? ' (' + saltados + ' ya existian)' : ''));
        cmPfDevCerrar();
        if (typeof cmPfCargarSesiones === 'function') cmPfCargarSesiones();
        if (typeof cmPfSes2SincronizarMinutos === 'function') cmPfSes2SincronizarMinutos(sid, true);
    } catch (e) {
        showToast('Error importando: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Importar sesion'; }
    }
}

console.log('[PrepFisica] cm-prepfisica-gps.js cargado (importador CSV multimarca: dispositivo + SoccerLab)');
