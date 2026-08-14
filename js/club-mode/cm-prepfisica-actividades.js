// ========== CM-PREPFISICA-ACTIVIDADES.JS - Actividades (ejercicios) dentro de la sesion GPS ==========
// 🌉 PUENTE: lee training_sessions (Plan Entrenador) en SOLO LECTURA para ofrecer
// los ejercicios planificados del dia; guarda en cm_pf_gps_player_data (Club Mode).
// Importa los CSV por-ejercicio del dispositivo (Estadisticas de equipo, rangos de
// velocidad, HID, sprints, aceleraciones, deceleraciones) como un SEGMENTO de la
// sesion, vinculado al ejercicio real del banco via activity_ref (id TLC o uuid
// propio). El selector de segmentos del informe (cm-prepfisica-sesion.js) los
// muestra automaticamente. Formato de estos CSV: campos entrecomillados, decimales
// con coma, miles con punto y "-" para vacio.
// Cargar DESPUES de cm-prepfisica-sesion.js.

var cmPfAct = {
    planificada: null,     // training_session del dia (si existe)
    ejercicios: [],        // [{ref, titulo, seccion, duracion}]
    archivos: [],          // [{nombre, tipo, filas}] tipo: stats|rangos|hid|sprints|acc|dec
    jugadores: {},         // dorsal -> datos fusionados
    listaClub: [],         // club_players para el select
    asignacion: {}         // dorsal -> player_id
};

// ---------- Hook: boton "Anadir actividad" en el informe de sesion ----------
(function () {
    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        if (typeof cmPfSes2Render === 'function' || intentos > 40) {
            clearInterval(t);
            if (typeof cmPfSes2Render !== 'function') return;
            var orig = cmPfSes2Render;
            cmPfSes2Render = function () {
                orig();
                var barra = document.querySelector('#cmpfses2-overlay .cmpfses2-vistas');
                if (barra && !document.getElementById('cmpfact-btn')) {
                    var b = document.createElement('button');
                    b.className = 'cmpfses2-vbtn';
                    b.id = 'cmpfact-btn';
                    b.textContent = 'Anadir actividad';
                    b.onclick = cmPfActAbrir;
                    var grupo = barra.querySelector('div[style*="margin-left:auto"]');
                    if (grupo) grupo.insertBefore(b, grupo.firstChild);
                    else barra.appendChild(b);
                }
            };
            console.log('[PrepFisica] Actividades por ejercicio enganchadas al informe de sesion');
        }
    }, 300);
})();

// ---------- Utilidades ----------
function cmPfActParseLinea(l) {
    var out = [];
    var re = /"([^"]*)"/g, m;
    while ((m = re.exec(l)) !== null) out.push(m[1]);
    return out;
}

function cmPfActNum(v) {
    // "1.099" -> 1099 | "5,805" -> 5.805 | "3.863,5" -> 3863.5 | "-" -> null
    if (v === undefined || v === null) return null;
    v = String(v).trim();
    if (v === '' || v === '-') return null;
    var n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
}

function cmPfActTiempo(t) {
    // "9' 17''" -> minutos decimales
    if (!t || t === '-') return null;
    var m = String(t).match(/(\d+)'\s*(\d+)?/);
    if (!m) return null;
    return parseInt(m[1]) + (m[2] ? parseInt(m[2]) / 60 : 0);
}

// ---------- Abrir modal ----------
async function cmPfActAbrir() {
    cmPfActCerrar();
    cmPfAct.archivos = [];
    cmPfAct.jugadores = {};
    cmPfAct.asignacion = {};
    cmPfAct.planificada = null;
    cmPfAct.ejercicios = [];

    var ov = document.createElement('div');
    ov.id = 'cmpfact-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);z-index:9600;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) cmPfActCerrar(); };
    ov.innerHTML =
    '<style>' +
        '.cmpfact-modal{background:#0f172a;border-radius:14px;width:100%;max-width:760px;max-height:92vh;overflow-y:auto;border:1px solid #14b8a6;padding:22px}' +
        '.cmpfact-modal h3{color:#e2e8f0;font-size:17px;margin:0}' +
        '.cmpfact-modal h4{color:#e2e8f0;font-size:13px;margin:16px 0 8px}' +
        '.cmpfact-sel,.cmpfact-inp{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 9px;border-radius:6px;font-size:12px}' +
        '.cmpfact-ej{display:block;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:9px 12px;margin-top:6px;color:#e2e8f0;font-size:12px;cursor:pointer}' +
        '.cmpfact-ej:hover{border-color:#14b8a6}' +
        '.cmpfact-ej.sel{border-color:#14b8a6;background:#0f3d3e}' +
        '.cmpfact-ej .sec{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.4px}' +
        '.cmpfact-chip{display:inline-block;background:#1e293b;color:#cbd5e1;padding:4px 10px;border-radius:10px;font-size:11px;margin:4px 6px 0 0}' +
        '.cmpfact-chip.ok{background:#052e16;color:#86efac}' +
        '.cmpfact-chip.err{background:#450a0a;color:#fca5a5}' +
        '.cmpfact-tabla{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}' +
        '.cmpfact-tabla th{color:#94a3b8;text-align:left;padding:5px 8px;border-bottom:1px solid #334155;font-size:10px;text-transform:uppercase}' +
        '.cmpfact-tabla td{color:#e2e8f0;padding:5px 8px;border-bottom:1px solid #1e293b}' +
        '.cmpfact-tabla select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 6px;border-radius:5px;font-size:12px;max-width:180px}' +
    '</style>' +
    '<div class="cmpfact-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>Anadir actividad a la sesion</h3>' +
            '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfActCerrar()">x</button>' +
        '</div>' +
        '<h4>1. Elige el ejercicio</h4>' +
        '<div id="cmpfact-ejercicios"><p style="color:#94a3b8;font-size:12px">Buscando la sesion planificada de ese dia...</p></div>' +
        '<h4>2. Sube los CSV del ejercicio (los 6 de golpe, o los que tengas)</h4>' +
        '<input type="file" accept=".csv" multiple style="color:#e2e8f0;font-size:13px" onchange="cmPfActLeerArchivos(this)">' +
        '<div id="cmpfact-archivos"></div>' +
        '<div id="cmpfact-jugadores"></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
            '<button class="cmpfses2-vbtn" onclick="cmPfActCerrar()">Cancelar</button>' +
            '<button class="cmpfses2-vbtn act" id="cmpfact-guardar" onclick="cmPfActGuardar()" style="display:none">Guardar actividad</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(ov);

    cmPfActCargarPlanificada();
}

function cmPfActCerrar() {
    var ov = document.getElementById('cmpfact-overlay');
    if (ov) ov.remove();
}

// ---------- Sesion planificada del dia (puente con Plan Entrenador, solo lectura) ----------
async function cmPfActCargarPlanificada() {
    var cont = document.getElementById('cmpfact-ejercicios');
    try {
        var fecha = cmPfSes2.ses.session_date;
        var r = await supabaseClient.from('training_sessions')
            .select('id, name, warm_up, main_part, cool_down')
            .eq('club_id', clubId).eq('session_date', fecha)
            .order('created_at', { ascending: false }).limit(1);
        var ts = (r.data && r.data[0]) || null;
        cmPfAct.planificada = ts;
        cmPfAct.ejercicios = [];
        if (ts) {
            var secciones = [['warm_up', 'Calentamiento'], ['main_part', 'Parte principal'], ['cool_down', 'Parte final']];
            secciones.forEach(function (s) {
                (ts[s[0]] || []).forEach(function (ej) {
                    cmPfAct.ejercicios.push({
                        ref: ej.id !== undefined && ej.id !== null ? String(ej.id) : null,
                        titulo: ej.titulo || 'Ejercicio',
                        seccion: s[1],
                        duracion: ej.duracion || null
                    });
                });
            });
        }
        cmPfActRenderEjercicios();
    } catch (e) {
        if (cont) cont.innerHTML = '<p style="color:#fca5a5;font-size:12px">Error buscando la sesion planificada: ' + (e.message || e) + '</p>';
        cmPfActRenderEjercicios(true);
    }
}

function cmPfActRenderEjercicios(soloLibre) {
    var cont = document.getElementById('cmpfact-ejercicios');
    if (!cont) return;
    var h = '';
    if (!soloLibre && cmPfAct.ejercicios.length) {
        h += '<div style="color:#94a3b8;font-size:11px">Sesion planificada: <b style="color:#e2e8f0">' + (cmPfAct.planificada.name || '') + '</b></div>';
        cmPfAct.ejercicios.forEach(function (ej, i) {
            h += '<label class="cmpfact-ej" id="cmpfact-ej-' + i + '" onclick="cmPfActElegir(' + i + ')">' +
                '<span class="sec">' + ej.seccion + (ej.duracion ? ' &middot; ' + ej.duracion + ' min' : '') + '</span><br>' + ej.titulo +
            '</label>';
        });
    } else if (!soloLibre) {
        h += '<p style="color:#94a3b8;font-size:12px">No hay sesion planificada en el HUB para ese dia.</p>';
    }
    h += '<div style="margin-top:10px;color:#94a3b8;font-size:11px">O escribe el nombre de la actividad a mano:</div>' +
        '<input type="text" class="cmpfact-inp" id="cmpfact-libre" placeholder="Ej: Rondo 6x2" style="width:100%;max-width:320px;margin-top:4px" oninput="cmPfActElegir(-1)">';
    cont.innerHTML = h;
    cmPfAct.elegido = null;
}

function cmPfActElegir(i) {
    cmPfAct.elegido = i;
    cmPfAct.ejercicios.forEach(function (ej, j) {
        var el = document.getElementById('cmpfact-ej-' + j);
        if (el) el.className = 'cmpfact-ej' + (i === j ? ' sel' : '');
    });
}

// ---------- Lectura y clasificacion de los CSV ----------
function cmPfActTipoArchivo(nombre, cab) {
    var n = nombre.toLowerCase();
    var cabTxt = cab.join('|');
    if (cabTxt.indexOf('Tiempo jugado') !== -1) return 'stats';
    if (cabTxt.indexOf('0 - 7 km/h') !== -1) return 'rangos';
    if (cabTxt.indexOf('> 19 km/h') !== -1 && cabTxt.indexOf('> 21 km/h') !== -1) return 'hid';
    if (cabTxt.indexOf('> 25 km/h') !== -1 && cab.length <= 3) return 'sprints';
    if (cabTxt.indexOf('m/s2') !== -1) {
        if (n.indexOf('desacel') !== -1 || n.indexOf('decel') !== -1) return 'dec';
        if (n.indexOf('acel') !== -1 || n.indexOf('accel') !== -1) return 'acc';
        return 'accdec_dudoso';
    }
    return 'desconocido';
}

async function cmPfActLeerArchivos(input) {
    var files = input.files;
    if (!files || !files.length) return;
    cmPfAct.archivos = [];
    cmPfAct.jugadores = {};

    for (var i = 0; i < files.length; i++) {
        try {
            var texto = await new Promise(function (res, rej) {
                var r = new FileReader();
                r.onload = function (e) { res(e.target.result); };
                r.onerror = function () { rej(new Error('lectura')); };
                r.readAsText(files[i], 'UTF-8');
            });
            texto = texto.replace(/^\uFEFF/, '');
            var lineas = texto.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
            var cab = cmPfActParseLinea(lineas[0]);
            var tipo = cmPfActTipoArchivo(files[i].name, cab);
            var filas = [];
            for (var li = 1; li < lineas.length; li++) {
                var v = cmPfActParseLinea(lineas[li]);
                if (v.length >= 2) filas.push(v);
            }
            cmPfAct.archivos.push({ nombre: files[i].name, tipo: tipo, cab: cab, filas: filas });
        } catch (e) {
            cmPfAct.archivos.push({ nombre: files[i].name, tipo: 'error', cab: [], filas: [] });
        }
    }
    cmPfActFusionar();
    cmPfActRenderArchivos();
    await cmPfActEmparejar();
}

function cmPfActFusionar() {
    // Fusiona todos los archivos por dorsal (columna "#")
    cmPfAct.jugadores = {};
    var J = cmPfAct.jugadores;
    var get = function (d) {
        if (!J[d]) J[d] = { dorsal: d, nombre: '' };
        return J[d];
    };
    // En estos CSV el "-" en zonas/HID/sprints/acc/dec significa 0 (no dato ausente)
    var cero = function (v) { var n = cmPfActNum(v); return n === null ? 0 : n; };
    cmPfAct.archivos.forEach(function (a) {
        a.filas.forEach(function (v) {
            var d = v[0], nombre = v[1];
            var j = get(d);
            if (nombre) j.nombre = nombre;
            if (a.tipo === 'stats') {
                j.minutos = cmPfActTiempo(v[2]);
                j.td = cmPfActNum(v[3]);
                j.vavg = cmPfActNum(v[4]);
                j.vmax = cmPfActNum(v[5]);
                j.hr_avg = cmPfActNum(v[6]);
                j.hr_max = cmPfActNum(v[7]);
            } else if (a.tipo === 'rangos') {
                j.z1 = cero(v[2]); j.z2 = cero(v[3]);
                j.z3 = cero(v[4]); j.z4 = cero(v[5]);
            } else if (a.tipo === 'hid') {
                j.hid19 = cero(v[2]); j.hid21 = cero(v[3]); j.hid24 = cero(v[4]);
            } else if (a.tipo === 'sprints') {
                j.nspr = cero(v[2]);
            } else if (a.tipo === 'acc') {
                j.acc25 = cero(v[2]); j.acc30 = cero(v[3]); j.acc40 = cero(v[4]);
            } else if (a.tipo === 'dec') {
                j.dec25 = cero(v[2]); j.dec30 = cero(v[3]); j.dec40 = cero(v[4]);
            }
        });
    });
}

function cmPfActRenderArchivos() {
    var cont = document.getElementById('cmpfact-archivos');
    if (!cont) return;
    var etiquetas = { stats: 'Estadisticas', rangos: 'Rangos velocidad', hid: 'Alta intensidad', sprints: 'Sprints', acc: 'Aceleraciones', dec: 'Deceleraciones', accdec_dudoso: 'ACC o DEC?', desconocido: 'No reconocido', error: 'Error' };
    var h = '';
    cmPfAct.archivos.forEach(function (a, i) {
        var mal = a.tipo === 'desconocido' || a.tipo === 'error';
        var dudoso = a.tipo === 'accdec_dudoso';
        h += '<span class="cmpfact-chip' + (mal ? ' err' : (dudoso ? '' : ' ok')) + '">' + a.nombre + ' &rarr; ' + etiquetas[a.tipo];
        if (dudoso) {
            h += ' <select onchange="cmPfAct.archivos[' + i + '].tipo=this.value;cmPfActFusionar();" class="cmpfact-sel" style="padding:2px 4px;font-size:10px">' +
                '<option value="accdec_dudoso">elige...</option><option value="acc">ACC</option><option value="dec">DEC</option></select>';
        }
        h += '</span>';
    });
    cont.innerHTML = h;
}

// ---------- Emparejar dorsales con jugadores del club ----------
async function cmPfActEmparejar() {
    var cont = document.getElementById('cmpfact-jugadores');
    if (cont) cont.innerHTML = '<p style="color:#94a3b8;font-size:12px;margin-top:10px">Emparejando jugadores...</p>';
    try {
        if (!cmPfAct.listaClub.length) {
            var pr = await supabaseClient.from('club_players')
                .select('id, name').eq('club_id', clubId).eq('active', true).order('name');
            var sr = await supabaseClient.from('club_player_seasons')
                .select('player_id, shirt_number').eq('club_id', clubId).eq('active', true);
            var dorsalMap = {};
            (sr.data || []).forEach(function (s) {
                if (s.shirt_number !== null && s.shirt_number !== undefined) dorsalMap[s.player_id] = s.shirt_number;
            });
            cmPfAct.listaClub = (pr.data || []).map(function (p) {
                return { id: p.id, name: p.name, dorsal: dorsalMap[p.id] !== undefined ? dorsalMap[p.id] : null };
            });
        }
        var norm = function (s) { return (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); };
        cmPfAct.asignacion = {};
        Object.keys(cmPfAct.jugadores).forEach(function (d) {
            var j = cmPfAct.jugadores[d];
            var pid = '';
            var dn = parseInt(d);
            if (!isNaN(dn)) {
                var porDorsal = cmPfAct.listaClub.filter(function (c) { return c.dorsal === dn; });
                if (porDorsal.length === 1) pid = porDorsal[0].id;
            }
            if (!pid) {
                var nc = norm(j.nombre);
                var porNombre = cmPfAct.listaClub.filter(function (c) {
                    var nj = norm(c.name);
                    return nj === nc || nj.indexOf(nc) !== -1 || nc.indexOf(nj) !== -1;
                });
                if (porNombre.length === 1) pid = porNombre[0].id;
            }
            cmPfAct.asignacion[d] = pid;
        });
        cmPfActRenderJugadores();
    } catch (e) {
        if (cont) cont.innerHTML = '<p style="color:#fca5a5;font-size:12px">Error: ' + (e.message || e) + '</p>';
    }
}

function cmPfActRenderJugadores() {
    var cont = document.getElementById('cmpfact-jugadores');
    if (!cont) return;
    var dorsales = Object.keys(cmPfAct.jugadores).sort(function (a, b) { return parseInt(a) - parseInt(b); });
    if (!dorsales.length) { cont.innerHTML = ''; return; }

    var h = '<h4>3. Revisa los jugadores</h4><table class="cmpfact-tabla"><thead><tr><th>CSV</th><th>Jugador del club</th><th>Min</th><th>Dist</th><th>Vmax</th></tr></thead><tbody>';
    dorsales.forEach(function (d) {
        var j = cmPfAct.jugadores[d];
        var opts = '<option value="">-- No importar --</option>';
        cmPfAct.listaClub.forEach(function (c) {
            var sel = cmPfAct.asignacion[d] === c.id ? ' selected' : '';
            opts += '<option value="' + c.id + '"' + sel + '>' + (c.dorsal !== null ? c.dorsal + ' - ' : '') + c.name + '</option>';
        });
        h += '<tr><td>' + d + ' - ' + j.nombre + '</td>' +
            '<td><select onchange="cmPfAct.asignacion[\'' + d + '\']=this.value">' + opts + '</select></td>' +
            '<td>' + (j.minutos !== null && j.minutos !== undefined ? Math.round(j.minutos) + "'" : '-') + '</td>' +
            '<td>' + (j.td !== null && j.td !== undefined ? Math.round(j.td) + ' m' : '-') + '</td>' +
            '<td>' + (j.vmax !== null && j.vmax !== undefined ? (Math.round(j.vmax * 10) / 10) : '-') + '</td></tr>';
    });
    h += '</tbody></table>';
    cont.innerHTML = h;
    var btn = document.getElementById('cmpfact-guardar');
    if (btn) btn.style.display = '';
}

// ---------- Guardar ----------
async function cmPfActGuardar() {
    // Actividad elegida
    var nombreAct = '', ref = null;
    var libre = (document.getElementById('cmpfact-libre') || {}).value.trim();
    if (cmPfAct.elegido !== null && cmPfAct.elegido >= 0) {
        var ej = cmPfAct.ejercicios[cmPfAct.elegido];
        nombreAct = ej.titulo;
        ref = ej.ref;
    } else if (libre) {
        nombreAct = libre;
    }
    if (!nombreAct) { if (typeof showToast === 'function') showToast('Elige un ejercicio o escribe el nombre de la actividad'); return; }

    var dorsales = Object.keys(cmPfAct.jugadores).filter(function (d) { return cmPfAct.asignacion[d]; });
    if (!dorsales.length) { if (typeof showToast === 'function') showToast('No hay jugadores emparejados'); return; }

    var btn = document.getElementById('cmpfact-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        var sid = cmPfSes2.ses.id;

        // Nombre de segmento unico (si la misma actividad ya existe, sufijo (2), (3)...)
        var nombres = {};
        cmPfSes2.allData.forEach(function (r) { nombres[r.segment_name] = true; });
        var segNombre = nombreAct, n = 2;
        while (nombres[segNombre]) { segNombre = nombreAct + ' (' + n + ')'; n++; }

        var rows = [];
        dorsales.forEach(function (d) {
            var j = cmPfAct.jugadores[d];
            var td = j.td !== undefined ? j.td : null;
            var z5 = null;
            if (td !== null && j.z1 != null && j.z2 != null && j.z3 != null && j.z4 != null) {
                z5 = Math.max(0, Math.round((td - j.z1 - j.z2 - j.z3 - j.z4) * 100) / 100);
            }
            var mmin = (td !== null && j.minutos) ? Math.round(td / j.minutos * 10) / 10 : null;
            rows.push({
                club_id: clubId, session_id: sid, player_id: cmPfAct.asignacion[d],
                segment_name: segNombre,
                activity_ref: ref,
                total_distance_m: td !== null ? Math.round(td) : null,
                hsr_distance_m: j.hid19 != null ? Math.round(j.hid19) : null,
                sprint_distance_m: j.hid24 != null ? Math.round(j.hid24) : null,
                max_speed_kmh: j.vmax != null ? j.vmax : null,
                sprint_count: j.nspr != null ? Math.round(j.nspr) : null,
                accel_count: j.acc30 != null ? Math.round(j.acc30) : null,
                decel_count: j.dec30 != null ? Math.round(j.dec30) : null,
                player_load: null,
                duration_min: j.minutos != null ? Math.round(j.minutos) : null,
                hr_avg: j.hr_avg != null ? Math.round(j.hr_avg) : null,
                hr_max: j.hr_max != null ? Math.round(j.hr_max) : null,
                z1_distance_m: j.z1 != null ? j.z1 : null,
                z2_distance_m: j.z2 != null ? j.z2 : null,
                z3_distance_m: j.z3 != null ? j.z3 : null,
                z4_distance_m: j.z4 != null ? j.z4 : null,
                z5_distance_m: z5,
                extra_metrics: {
                    distance_per_min: mmin,
                    avg_speed_kmh: j.vavg != null ? j.vavg : null,
                    hid21_m: j.hid21 != null ? j.hid21 : null,
                    acc_25: j.acc25 != null ? Math.round(j.acc25) : null,
                    acc_40: j.acc40 != null ? Math.round(j.acc40) : null,
                    dec_25: j.dec25 != null ? Math.round(j.dec25) : null,
                    dec_40: j.dec40 != null ? Math.round(j.dec40) : null,
                    activity_name: nombreAct
                },
                notes: null
            });
        });

        var res = await supabaseClient.from('cm_pf_gps_player_data').insert(rows);
        if (res.error) throw res.error;

        if (typeof showToast === 'function') showToast('Actividad "' + segNombre + '" guardada con ' + rows.length + ' jugadores');
        cmPfActCerrar();
        // Recargar el informe para que aparezca el nuevo segmento en el selector
        if (typeof cmPfVerSesionCompleta === 'function') cmPfVerSesionCompleta(sid);
    } catch (e) {
        if (typeof showToast === 'function') showToast('Error guardando: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar actividad'; }
    }
}

console.log('[PrepFisica] cm-prepfisica-actividades.js cargado (actividades por ejercicio)');
