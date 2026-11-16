// ========== EQUIPACION.JS - TopLiderCoach HUB ==========
// Mi Club · pestaña "Equipación y pizarra".
// Aquí se definen las cuatro equipaciones del club y los colores de tarea.
// Se guardan en clubs.pizarra_config (dentro de "kits" y "tarea") y los leen
// la pizarra y el resto de módulos con eqConfig().

registrarSubTab('config', 'equipacion', eqAbrir);

var EQ_KITS = [
    ['jug1', 'Jugadores · Primera'],
    ['jug2', 'Jugadores · Segunda'],
    ['por1', 'Porteros · Primera'],
    ['por2', 'Porteros · Segunda']
];
var EQ_DISENOS = [
    ['liso', 'Sin decoración'],
    ['mitadV', 'Mitad vertical'],
    ['mitadH', 'Mitad horizontal'],
    ['lineaV', 'Línea vertical'],
    ['lineaH', 'Línea horizontal'],
    ['diagonal', 'Banda diagonal'],
    ['rayasV', 'Rayas verticales'],
    ['rayasH', 'Rayas horizontales'],
    ['rayasD', 'Rayas diagonales'],
    ['cruz', 'Cruz'],
    ['damero', 'Damero'],
    ['mangas', 'Mangas de otro color']
];
var EQ_COLORES = ['#ffffff', '#111827', '#1d4ed8', '#0ea5e9', '#16a34a', '#facc15', '#f97316', '#dc2626', '#7c3aed', '#7f1d1d'];
var EQ_ROLES = [
    ['portero', 'Portero'],
    ['comodin', 'Comodín'],
    ['peto1', 'Peto 1'],
    ['peto2', 'Peto 2'],
    ['peto3', 'Peto 3'],
    ['peto4', 'Peto 4']
];
var EQ_COLORES_TAREA = ['#dc2626', '#ea580c', '#facc15', '#84cc16', '#16a34a', '#0ea5e9', '#1e3a8a', '#9333ea', '#111827', '#ffffff'];

function eqDefecto() {
    return {
        kits: {
            jug1: { d: 'liso', c1: '#1d4ed8', c2: '#ffffff', p: '#ffffff' },
            jug2: { d: 'liso', c1: '#ffffff', c2: '#1d4ed8', p: '#1d4ed8' },
            por1: { d: 'liso', c1: '#facc15', c2: '#111827', p: '#111827' },
            por2: { d: 'liso', c1: '#16a34a', c2: '#111827', p: '#111827' }
        },
        tarea: { portero: '#dc2626', comodin: '#ffffff', peto1: '#16a34a', peto2: '#1e3a8a', peto3: '#0ea5e9', peto4: '#9333ea' }
    };
}

// Equipación y colores de tarea del club, completados con los valores por defecto.
// Es la función que usan los demás módulos para leerlos.
function eqConfig() {
    var def = eqDefecto();
    var guardado = (typeof clubData !== 'undefined' && clubData && clubData.pizarra_config) || {};
    var hex = function (v, d) { return (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v : d; };
    var out = { kits: {}, tarea: {} };
    EQ_KITS.forEach(function (k) {
        var g = (guardado.kits && guardado.kits[k[0]]) || {}, d = def.kits[k[0]];
        out.kits[k[0]] = {
            d: EQ_DISENOS.some(function (x) { return x[0] === g.d; }) ? g.d : d.d,
            c1: hex(g.c1, d.c1), c2: hex(g.c2, d.c2), p: hex(g.p, d.p)
        };
    });
    EQ_ROLES.forEach(function (r) { out.tarea[r[0]] = hex(guardado.tarea && guardado.tarea[r[0]], def.tarea[r[0]]); });
    return out;
}

// Dibujo de un diseño dentro de un rectángulo. Quien lo llama lo recorta
// con la forma que quiera (camiseta o círculo).
function eqDibujo(d, c1, c2, x, y, w, h) {
    var R = function (rx, ry, rw, rh, fill, extra) {
        return '<rect x="' + rx.toFixed(2) + '" y="' + ry.toFixed(2) + '" width="' + rw.toFixed(2) + '" height="' + rh.toFixed(2) + '" fill="' + fill + '"' + (extra || '') + '/>';
    };
    var s = R(x, y, w, h, c1), i, n;
    var cx = x + w / 2, cy = y + h / 2;
    if (d === 'mitadV') s += R(cx, y, w / 2, h, c2);
    else if (d === 'mitadH') s += R(x, cy, w, h / 2, c2);
    else if (d === 'lineaV') s += R(cx - w * 0.11, y, w * 0.22, h, c2);
    else if (d === 'lineaH') s += R(x, y + h * 0.36, w, h * 0.2, c2);
    else if (d === 'diagonal') s += R(x - w, cy - h * 0.1, w * 3, h * 0.2, c2, ' transform="rotate(-38 ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')"');
    else if (d === 'rayasV') { n = 7; for (i = 0; i < n; i++) if (i % 2 === 1) s += R(x + i * w / n, y, w / n, h, c2); }
    else if (d === 'rayasH') { n = 7; for (i = 0; i < n; i++) if (i % 2 === 1) s += R(x, y + i * h / n, w, h / n, c2); }
    else if (d === 'rayasD') {
        s += '<g transform="rotate(-38 ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')">';
        n = 12; for (i = 0; i < n; i++) if (i % 2 === 1) s += R(x - w, y - h * 0.5 + i * h * 2 / n, w * 3, h * 2 / n, c2);
        s += '</g>';
    }
    else if (d === 'cruz') { s += R(cx - w * 0.09, y, w * 0.18, h, c2); s += R(x, y + h * 0.3, w, h * 0.16, c2); }
    else if (d === 'damero') {
        n = 6; var m = Math.round(n * h / w) || n, a, b;
        for (a = 0; a < n; a++) for (b = 0; b < m; b++) if ((a + b) % 2 === 1) s += R(x + a * w / n, y + b * h / m, w / n, h / m, c2);
    }
    else if (d === 'mangas') { s += R(x, y, w * 0.2, h, c2); s += R(x + w * 0.8, y, w * 0.2, h, c2); }
    return s;
}

var _eqN = 0;
// Camiseta completa (para Mi Club): diseño, cuello y pantalón.
function eqCamisetaSVG(kit, ancho) {
    var id = 'eqc' + (++_eqN);
    var forma = 'M38 8 L10 22 L18 46 L30 40 L30 96 L90 96 L90 40 L102 46 L110 22 L82 8 Q60 26 38 8 Z';
    return '<svg viewBox="0 0 120 124" width="' + ancho + '" height="' + Math.round(ancho * 124 / 120) + '" style="display:block">'
        + '<defs><clipPath id="' + id + '"><path d="' + forma + '"/></clipPath></defs>'
        + '<rect x="32" y="98" width="56" height="18" rx="3" fill="' + kit.p + '" stroke="#94a3b8" stroke-width="1"/>'
        + '<g clip-path="url(#' + id + ')">' + eqDibujo(kit.d, kit.c1, kit.c2, 10, 8, 100, 88) + '</g>'
        + '<path d="' + forma + '" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/>'
        + '<path d="M38 8 Q60 26 82 8" fill="none" stroke="' + kit.c2 + '" stroke-width="5" stroke-linecap="round"/>'
        + '<path d="M38 8 Q60 26 82 8" fill="none" stroke="#94a3b8" stroke-width="1"/>'
        + '</svg>';
}

// ---------- Pestaña ----------
var eqEstado = { cfg: null, kit: 'jug1', rol: 'portero', sucio: false };

function eqEstilos() {
    if (document.getElementById('eq-estilos')) return;
    var st = document.createElement('style');
    st.id = 'eq-estilos';
    st.textContent = [
        '.eq-wrap{max-width:1100px;display:flex;flex-direction:column;gap:20px}',
        '.eq-wrap .card-header{display:flex;align-items:center;justify-content:space-between;gap:12px}',
        '.eq-wrap .card-header p{margin:4px 0 0;color:#6b7280;font-size:13px;font-weight:400}',
        '.eq-kits{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}',
        '.eq-kit{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;font-size:13px;color:#374151;font-family:inherit}',
        '.eq-kit.on{border-color:#667eea;background:#eef2ff;color:#4338ca;font-weight:600}',
        '.eq-editor{display:grid;grid-template-columns:240px 1fr;gap:24px;align-items:start}',
        '.eq-previa{background:#f3f4f6;border-radius:14px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#6b7280;font-size:12px}',
        '.eq-t{font-size:13px;font-weight:700;color:#111827;margin:0 0 8px}',
        '.eq-t span{font-weight:400;color:#6b7280}',
        '.eq-disenos{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;margin-bottom:18px}',
        '.eq-dis{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:2px solid #e5e7eb;border-radius:10px;background:#fff;cursor:pointer;font-size:11px;color:#374151;font-family:inherit;line-height:1.2;text-align:center}',
        '.eq-dis.on{border-color:#667eea;background:#eef2ff;color:#4338ca;font-weight:600}',
        '.eq-cols{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:16px}',
        '.eq-cols button{width:30px;height:30px;padding:0;border-radius:50%;border:2px solid #d1d5db;cursor:pointer}',
        '.eq-cols button.on{border-color:#111827;box-shadow:0 0 0 2px #fff,0 0 0 4px #111827}',
        '.eq-cols label{display:flex;align-items:center;gap:6px;margin-left:6px;padding:3px 8px 3px 4px;border:1px solid #d1d5db;border-radius:8px;font-size:12px;color:#374151;cursor:pointer}',
        '.eq-cols input[type=color]{width:24px;height:24px;padding:0;border:none;background:none;cursor:pointer}',
        '.eq-tarea{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}',
        '.eq-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}',
        '.eq-rol{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;font-size:12px;color:#374151;font-family:inherit}',
        '.eq-rol.on{border-color:#667eea;background:#eef2ff;color:#4338ca;font-weight:600}',
        '.eq-rol i{width:28px;height:28px;border-radius:50%;border:2px solid #9ca3af;display:block}',
        '.eq-caja{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px}',
        '.eq-link{background:none;border:1px solid #d1d5db;border-radius:8px;padding:6px 12px;font-size:12px;color:#374151;cursor:pointer;margin-top:12px}',
        '.eq-pie{display:flex;align-items:center;justify-content:flex-end;gap:14px}',
        '.eq-aviso{font-size:13px;color:#b45309;font-weight:600}',
        '.eq-campo{border-radius:12px;overflow:hidden}',
        '@media (max-width:900px){.eq-kits{grid-template-columns:repeat(2,1fr)}.eq-editor,.eq-tarea{grid-template-columns:1fr}.eq-previa{flex-direction:row;justify-content:center}}'
    ].join('\n');
    document.head.appendChild(st);
}

function eqAbrir() {
    eqEstilos();
    eqEstado.cfg = eqConfig();
    eqEstado.sucio = false;
    eqPintar();
}

function eqMuestras(lista, actual, accion) {
    var esLista = lista.some(function (c) { return c.toLowerCase() === String(actual).toLowerCase(); });
    return '<div class="eq-cols">' + lista.map(function (c) {
        return '<button type="button" class="' + (c.toLowerCase() === String(actual).toLowerCase() ? 'on' : '') + '" style="background:' + c + '" title="' + c + '" onclick="' + accion + '(\'' + c + '\')"></button>';
    }).join('') + '<label title="Elegir cualquier otro color"><input type="color" value="' + actual + '" onchange="' + accion + '(this.value)">' + (esLista ? 'Otro' : actual.toUpperCase()) + '</label></div>';
}

// Campo pequeño de muestra con las equipaciones y los colores de tarea
function eqCampoPrevia() {
    var c = eqEstado.cfg, s = '';
    var ficha = function (x, y, color) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + color + '" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>'; };
    var kit = function (x, y, k, n) {
        var id = 'eqf' + (++_eqN);
        return '<defs><clipPath id="' + id + '"><circle cx="' + x + '" cy="' + y + '" r="11"/></clipPath></defs><g clip-path="url(#' + id + ')">' + eqDibujo(k.d, k.c1, k.c2, x - 11, y - 11, 22, 22) + '</g>'
            + '<circle cx="' + x + '" cy="' + y + '" r="11" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>';
    };
    s += '<rect width="420" height="250" fill="#1a6b30"/>';
    for (var i = 0; i < 7; i++) if (i % 2 === 0) s += '<rect x="' + (i * 60) + '" y="0" width="60" height="250" fill="#217a38"/>';
    s += '<g fill="none" stroke="#fff" stroke-width="2"><rect x="18" y="20" width="190" height="210"/><rect x="232" y="20" width="170" height="96"/><rect x="232" y="134" width="170" height="96"/></g>';
    // tarea con porteros, petos y comodín
    s += ficha(34, 125, c.tarea.portero) + ficha(192, 125, c.tarea.portero);
    [[70, 60], [110, 110], [78, 170], [140, 60]].forEach(function (p) { s += ficha(p[0], p[1], c.tarea.peto1); });
    [[150, 150], [120, 195], [165, 100], [60, 115]].forEach(function (p) { s += ficha(p[0], p[1], c.tarea.peto2); });
    s += ficha(113, 150, c.tarea.comodin);
    [[262, 48], [318, 40], [372, 60], [300, 88]].forEach(function (p) { s += ficha(p[0], p[1], c.tarea.peto3); });
    [[280, 66], [350, 92], [340, 44]].forEach(function (p) { s += ficha(p[0], p[1], c.tarea.peto4); });
    // equipaciones
    s += kit(262, 182, c.kits.por1) + kit(300, 160, c.kits.jug1) + kit(300, 204, c.kits.jug1) + kit(340, 182, c.kits.jug1) + kit(378, 160, c.kits.jug2) + kit(378, 204, c.kits.por2);
    return '<svg class="eq-campo" viewBox="0 0 420 250" width="100%" style="display:block">' + s + '</svg>';
}

function eqPintar() {
    var cont = document.getElementById('config-equipacion');
    if (!cont) return;
    var st = eqEstado, c = st.cfg, kit = c.kits[st.kit];
    var nombreKit = (EQ_KITS.find(function (k) { return k[0] === st.kit; }) || [])[1] || '';
    var nombreRol = (EQ_ROLES.find(function (r) { return r[0] === st.rol; }) || [])[1] || '';
    var h = '<div class="eq-wrap">';

    // --- Equipación ---
    h += '<div class="card"><div class="card-header"><div><h3>Equipación</h3><p>Las camisetas de tu club. La pizarra y el resto del HUB dibujan a tus jugadores con ellas.</p></div></div><div class="card-body">';
    h += '<div class="eq-kits">' + EQ_KITS.map(function (k) {
        return '<button type="button" class="eq-kit' + (st.kit === k[0] ? ' on' : '') + '" onclick="eqElegirKit(\'' + k[0] + '\')">' + eqCamisetaSVG(c.kits[k[0]], 52) + k[1] + '</button>';
    }).join('') + '</div>';
    h += '<div class="eq-editor"><div class="eq-previa">' + eqCamisetaSVG(kit, 190) + '<span>' + nombreKit + '</span></div><div>';
    h += '<p class="eq-t">Diseño <span>· ' + EQ_DISENOS.length + ' estilos</span></p><div class="eq-disenos">' + EQ_DISENOS.map(function (d) {
        return '<button type="button" class="eq-dis' + (kit.d === d[0] ? ' on' : '') + '" onclick="eqDiseno(\'' + d[0] + '\')">' + eqCamisetaSVG({ d: d[0], c1: kit.c1, c2: kit.c2, p: kit.p }, 44) + d[1] + '</button>';
    }).join('') + '</div>';
    h += '<p class="eq-t">Color principal</p>' + eqMuestras(EQ_COLORES, kit.c1, 'eqColorC1');
    h += '<p class="eq-t">Color secundario</p>' + eqMuestras(EQ_COLORES, kit.c2, 'eqColorC2');
    h += '<p class="eq-t">Pantalón</p>' + eqMuestras(EQ_COLORES, kit.p, 'eqColorP');
    h += '</div></div></div></div>';

    // --- Colores de tarea ---
    h += '<div class="card"><div class="card-header"><div><h3>Colores de la pizarra de tareas</h3><p>Los colores de los petos, el comodín y el portero cuando dibujas una tarea de entrenamiento.</p></div></div><div class="card-body"><div class="eq-tarea"><div>';
    h += '<div class="eq-roles">' + EQ_ROLES.map(function (r) {
        return '<button type="button" class="eq-rol' + (st.rol === r[0] ? ' on' : '') + '" onclick="eqElegirRol(\'' + r[0] + '\')"><i style="background:' + c.tarea[r[0]] + '"></i>' + r[1] + '</button>';
    }).join('') + '</div>';
    h += '<div class="eq-caja"><p class="eq-t">Color para ' + nombreRol + '</p>' + eqMuestras(EQ_COLORES_TAREA, c.tarea[st.rol], 'eqColorRol') + '</div>';
    h += '<button type="button" class="eq-link" onclick="eqRestablecerTarea()">↺ Restablecer colores por defecto</button>';
    h += '</div><div>' + eqCampoPrevia() + '</div></div></div></div>';

    // --- Guardar ---
    h += '<div class="eq-pie">' + (st.sucio ? '<span class="eq-aviso">Hay cambios sin guardar</span>' : '') + '<button class="btn-primary" onclick="eqGuardar()">Guardar equipación</button></div>';
    h += '</div>';
    cont.innerHTML = h;
}

function eqElegirKit(k) { eqEstado.kit = k; eqPintar(); }
function eqElegirRol(r) { eqEstado.rol = r; eqPintar(); }
function eqCambiar() { eqEstado.sucio = true; eqPintar(); }
function eqDiseno(d) { eqEstado.cfg.kits[eqEstado.kit].d = d; eqCambiar(); }
function eqColorC1(c) { eqEstado.cfg.kits[eqEstado.kit].c1 = c; eqCambiar(); }
function eqColorC2(c) { eqEstado.cfg.kits[eqEstado.kit].c2 = c; eqCambiar(); }
function eqColorP(c) { eqEstado.cfg.kits[eqEstado.kit].p = c; eqCambiar(); }
function eqColorRol(c) { eqEstado.cfg.tarea[eqEstado.rol] = c; eqCambiar(); }
function eqRestablecerTarea() { eqEstado.cfg.tarea = eqDefecto().tarea; eqCambiar(); }

async function eqGuardar() {
    if (!clubId) { showToast('No se ha podido identificar el club', 'error'); return; }
    // Se conserva lo que la pizarra ya tenga guardado (fondo, escudo, fichas) y se cambian solo kits y tarea
    var actual = (clubData && clubData.pizarra_config) || {};
    try {
        var leido = await supabaseClient.from('clubs').select('pizarra_config').eq('id', clubId).maybeSingle();
        if (leido && !leido.error && leido.data && leido.data.pizarra_config) actual = leido.data.pizarra_config;
    } catch (e) { /* si no se puede leer, se usa lo que hay en memoria */ }
    var nuevo = Object.assign({}, actual, { kits: eqEstado.cfg.kits, tarea: eqEstado.cfg.tarea });
    var r = await supabaseClient.from('clubs').update({ pizarra_config: nuevo }).eq('id', clubId);
    if (r && r.error) { console.error('pizarra_config:', r.error); showToast('No se ha podido guardar la equipación: ' + r.error.message, 'error'); return; }
    if (clubData) clubData.pizarra_config = nuevo;
    eqEstado.sucio = false;
    eqPintar();
    showToast('Equipación guardada', 'success');
}
