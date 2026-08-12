// ========== CM-PREPFISICA-GPS.JS - Importador CSV del dispositivo GPS ==========
// Importa el CSV exportado por la plataforma del dispositivo (separador ';',
// campos entrecomillados, BOM) con todos los jugadores de una sesion.
// Auto-empareja jugadores por dorsal (club_player_seasons.shirt_number) con
// respaldo por nombre, valida calidad de datos y guarda en las tablas
// existentes cm_pf_gps_sessions + cm_pf_gps_player_data (segmento TOTAL).
// No modifica cm-prepfisica.js: inyecta su boton envolviendo cmPfRenderPanel.

var cmPfDev = {
    filas: [],          // filas parseadas del CSV
    fechaCsv: null,     // YYYY-MM-DD detectada
    tituloCsv: '',      // sugerido desde el nombre del archivo
    jugadores: [],      // [{id, name, dorsal}]
    asignacion: {}      // indice de fila -> player_id | '' (no importar)
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
        if (envolver() || intentos > 40) {
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
    '</style>' +
    '<div class="cmpfdev-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>Importar sesion del dispositivo GPS</h3>' +
            '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfDevCerrar()">x</button>' +
        '</div>' +
        '<p style="color:#94a3b8;font-size:13px;margin:6px 0 14px">Sube el CSV exportado por la plataforma del dispositivo (todos los jugadores de la sesion en un archivo).</p>' +
        '<input type="file" id="cmpfdev-file" accept=".csv" style="color:#e2e8f0;font-size:13px" onchange="cmPfDevLeerArchivo(this)">' +
        '<div id="cmpfdev-contenido" style="margin-top:16px"></div>' +
    '</div>';
    document.body.appendChild(ov);
}

function cmPfDevCerrar() {
    var ov = document.getElementById('cmpfdev-overlay');
    if (ov) ov.remove();
    cmPfDev.filas = [];
    cmPfDev.asignacion = {};
}

// ---------- Leer y parsear el archivo ----------
function cmPfDevLeerArchivo(input) {
    var file = input.files && input.files[0];
    if (!file) return;

    // Titulo sugerido desde el nombre: "Pretemporada_RSG_B-PCF_-_09-08..." -> "Pretemporada RSG B-PCF"
    var base = file.name.replace(/\.csv$/i, '');
    var corte = base.search(/_-_|_\d{2}-\d{2}-\d{4}/);
    cmPfDev.tituloCsv = (corte > 0 ? base.substring(0, corte) : base).replace(/_/g, ' ').trim();

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var texto = e.target.result.replace(/^\uFEFF/, ''); // quitar BOM
            var lineas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
            if (lineas.length < 2) { showToast('El CSV no tiene datos', 'error'); return; }

            var cab = cmPfDevParseLinea(lineas[0]);
            var idx = {};
            cab.forEach(function (c, i) { idx[c] = i; });

            // Columnas minimas del formato del dispositivo
            var requeridas = ['Player No.', 'Player Name', 'Time Played', 'Distance (m)'];
            for (var r = 0; r < requeridas.length; r++) {
                if (idx[requeridas[r]] === undefined) {
                    showToast('Formato no reconocido: falta la columna "' + requeridas[r] + '"', 'error');
                    return;
                }
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

            cmPfDev.filas = [];
            cmPfDev.fechaCsv = null;

            for (var li = 1; li < lineas.length; li++) {
                var v = cmPfDevParseLinea(lineas[li]);
                if (v.length < 5) continue;
                if (!cmPfDev.fechaCsv) cmPfDev.fechaCsv = cmPfDevParseFecha(v[idx['Activity Date']]);

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
                var mmin = (td !== null && minutos) ? Math.round(td / minutos * 10) / 10 : null;

                cmPfDev.filas.push({
                    dorsal_csv: v[idx['Player No.']],
                    nombre_csv: v[idx['Player Name']],
                    posicion_csv: idx['Player Position'] !== undefined ? v[idx['Player Position']] : '',
                    minutos: minutos,
                    total_distance_m: td,
                    hsr_distance_m: cHid19 >= 0 ? cmPfDevNum(v[cHid19]) : null,
                    hid21_m: cHid21 >= 0 ? cmPfDevNum(v[cHid21]) : null,
                    sprint_distance_m: cHid24 >= 0 ? cmPfDevNum(v[cHid24]) : null,
                    sprint_count: cSpr >= 0 ? cmPfDevNum(v[cSpr]) : null,
                    max_speed_kmh: cVmax >= 0 ? cmPfDevNum(v[cVmax]) : null,
                    avg_speed_kmh: cVavg >= 0 ? cmPfDevNum(v[cVavg]) : null,
                    accel_count: cAcc30 >= 0 ? cmPfDevNum(v[cAcc30]) : null,
                    decel_count: cDec30 >= 0 ? cmPfDevNum(v[cDec30]) : null,
                    acc25: cAcc25 >= 0 ? cmPfDevNum(v[cAcc25]) : null,
                    acc40: cAcc40 >= 0 ? cmPfDevNum(v[cAcc40]) : null,
                    dec25: cDec25 >= 0 ? cmPfDevNum(v[cDec25]) : null,
                    dec40: cDec40 >= 0 ? cmPfDevNum(v[cDec40]) : null,
                    z1_distance_m: z1, z2_distance_m: z2, z3_distance_m: z3, z4_distance_m: z4, z5_distance_m: z5,
                    distance_per_min: mmin
                });
            }

            if (cmPfDev.filas.length === 0) { showToast('No se han podido leer filas del CSV', 'error'); return; }
            cmPfDevCargarJugadoresYRender();
        } catch (err) {
            showToast('Error leyendo CSV: ' + (err.message || err), 'error');
        }
    };
    reader.readAsText(file, 'UTF-8');
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

        // Auto-emparejar: 1) dorsal exacto, 2) nombre contenido (sin acentos, mayusculas)
        var norm = function (s) {
            return (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        };
        cmPfDev.asignacion = {};
        cmPfDev.filas.forEach(function (f, i) {
            var pid = '';
            var d = parseInt(f.dorsal_csv);
            if (!isNaN(d)) {
                var porDorsal = cmPfDev.jugadores.filter(function (j) { return j.dorsal === d; });
                if (porDorsal.length === 1) pid = porDorsal[0].id;
            }
            if (!pid) {
                var nc = norm(f.nombre_csv);
                var porNombre = cmPfDev.jugadores.filter(function (j) {
                    var nj = norm(j.name);
                    return nj === nc || nj.indexOf(nc) !== -1 || nc.indexOf(nj) !== -1;
                });
                if (porNombre.length === 1) pid = porNombre[0].id;
            }
            cmPfDev.asignacion[i] = pid;
        });

        cmPfDevRenderPreview();
    } catch (e) {
        if (cont) cont.innerHTML = '<p style="color:#fca5a5;font-size:13px">Error: ' + (e.message || e) + '</p>';
    }
}

function cmPfDevRenderPreview() {
    var cont = document.getElementById('cmpfdev-contenido');
    if (!cont) return;

    // Evento
    var equiposOpts = '<option value="">-- Equipo --</option>';
    (typeof cmPfEquipos !== 'undefined' ? cmPfEquipos : []).forEach(function (t) {
        equiposOpts += '<option value="' + t.id + '">' + t.name + (t.category ? ' (' + t.category + ')' : '') + '</option>';
    });

    var h = '<div class="cmpf-form-row-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' +
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
        if (f.distance_per_min !== null && f.distance_per_min > 160) {
            calidad = '<span class="cmpfdev-warn" title="Ritmo fisicamente improbable: revisa si el dispositivo quedo encendido">' + f.distance_per_min + ' m/min</span>';
        } else if (!cmPfDev.asignacion[i]) {
            calidad = '<span class="cmpfdev-warn">Sin emparejar</span>';
        }

        h += '<tr>' +
            '<td>' + (f.dorsal_csv ? f.dorsal_csv + ' - ' : '') + f.nombre_csv + '</td>' +
            '<td><select onchange="cmPfDev.asignacion[' + i + ']=this.value">' + opts + '</select></td>' +
            '<td>' + (f.minutos !== null ? Math.round(f.minutos) + "'" : '-') + '</td>' +
            '<td>' + (f.total_distance_m !== null ? Math.round(f.total_distance_m) + ' m' : '-') + '</td>' +
            '<td>' + (f.distance_per_min !== null ? f.distance_per_min : '-') + '</td>' +
            '<td>' + (f.max_speed_kmh !== null ? f.max_speed_kmh : '-') + '</td>' +
            '<td>' + calidad + '</td>' +
        '</tr>';
    });
    h += '</tbody></table>';

    h += '<p style="color:#64748b;font-size:11px;margin-top:10px">Zonas: 0-7 / 7-14 / 14-19 / 19-25 / +25 km/h (la Z5 se calcula por diferencia con la distancia total). HSR = HID &gt;19 · Sprint = HID &gt;24. Los HID &gt;21 y acc/dec a 2,5 y 4 m/s&sup2; se guardan en metricas extra.</p>';

    h += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">' +
        '<button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfDevCerrar()">Cancelar</button>' +
        '<button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" id="cmpfdev-btn-guardar" onclick="cmPfDevGuardar()">Importar sesion</button>' +
    '</div>';

    cont.innerHTML = h;
}

// ---------- Guardar ----------
async function cmPfDevGuardar() {
    var fecha = (document.getElementById('cmpfdev-fecha') || {}).value;
    if (!fecha) { showToast('Indica la fecha'); return; }
    var tipo = (document.getElementById('cmpfdev-tipo') || {}).value || 'training';
    var titulo = ((document.getElementById('cmpfdev-titulo') || {}).value || '').trim();
    var rival = ((document.getElementById('cmpfdev-rival') || {}).value || '').trim();
    var tid = (document.getElementById('cmpfdev-equipo') || {}).value || null;

    var seleccionadas = cmPfDev.filas.filter(function (f, i) { return cmPfDev.asignacion[i]; });
    if (seleccionadas.length === 0) { showToast('No hay ningun jugador emparejado'); return; }

    var btn = document.getElementById('cmpfdev-btn-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Importando...'; }

    try {
        // Reutilizar sesion existente (misma fecha+tipo+titulo) o crearla
        var sr = await supabaseClient.from('cm_pf_gps_sessions').select('id')
            .eq('club_id', clubId).eq('session_date', fecha).eq('session_type', tipo)
            .eq('title', titulo).maybeSingle();
        var sid;
        var durMax = 0;
        cmPfDev.filas.forEach(function (f) { if (f.minutos && f.minutos > durMax) durMax = f.minutos; });
        if (sr.data) {
            sid = sr.data.id;
        } else {
            var ins = await supabaseClient.from('cm_pf_gps_sessions').insert({
                club_id: clubId, session_date: fecha, session_type: tipo,
                title: titulo || null, opponent: rival || null, team_id: tid,
                duration_min: durMax ? Math.round(durMax) : null, source: 'device_csv'
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
            rows.push({
                club_id: clubId, session_id: sid, player_id: pid, segment_name: 'TOTAL',
                total_distance_m: f.total_distance_m !== null ? Math.round(f.total_distance_m) : null,
                hsr_distance_m: f.hsr_distance_m !== null ? Math.round(f.hsr_distance_m) : null,
                sprint_distance_m: f.sprint_distance_m !== null ? Math.round(f.sprint_distance_m) : null,
                max_speed_kmh: f.max_speed_kmh,
                sprint_count: f.sprint_count !== null ? Math.round(f.sprint_count) : null,
                accel_count: f.accel_count !== null ? Math.round(f.accel_count) : null,
                decel_count: f.decel_count !== null ? Math.round(f.decel_count) : null,
                player_load: null,
                duration_min: f.minutos !== null ? Math.round(f.minutos) : null,
                z1_distance_m: f.z1_distance_m, z2_distance_m: f.z2_distance_m,
                z3_distance_m: f.z3_distance_m, z4_distance_m: f.z4_distance_m,
                z5_distance_m: f.z5_distance_m,
                extra_metrics: {
                    distance_per_min: f.distance_per_min,
                    avg_speed_kmh: f.avg_speed_kmh,
                    hid21_m: f.hid21_m,
                    acc_25: f.acc25 !== null ? Math.round(f.acc25) : null,
                    acc_40: f.acc40 !== null ? Math.round(f.acc40) : null,
                    dec_25: f.dec25 !== null ? Math.round(f.dec25) : null,
                    dec_40: f.dec40 !== null ? Math.round(f.dec40) : null
                },
                notes: null
            });
        });

        if (rows.length === 0) {
            showToast(saltados > 0 ? 'Todos los jugadores ya estaban importados en esta sesion' : 'Nada que importar');
            if (btn) { btn.disabled = false; btn.textContent = 'Importar sesion'; }
            return;
        }

        var res = await supabaseClient.from('cm_pf_gps_player_data').insert(rows);
        if (res.error) throw res.error;

        showToast(rows.length + ' jugadores importados' + (saltados > 0 ? ' (' + saltados + ' ya existian)' : ''));
        cmPfDevCerrar();
        if (typeof cmPfCargarSesiones === 'function') cmPfCargarSesiones();
    } catch (e) {
        showToast('Error importando: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Importar sesion'; }
    }
}

console.log('[PrepFisica] cm-prepfisica-gps.js cargado (importador CSV dispositivo)');
