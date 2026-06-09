/* ============================================================
   cm-rfef.js  —  Modulo Control Economico RFEF  (Club Mode / Oficina)
   FASE 1: Panel de cumplimiento + Saldo Patrimonial Neto (del balance)
            + deteccion de Dificultad Economica.
   Autonomo: calcula el patrimonio neto leyendo los asientos contables
   (cm_eco_journal / _lines / cm_eco_accounts). Depende de core.js
   (supabaseClient, clubId, cmState, cmPuedeVer, registrarModulo).
   ============================================================ */
(function () {
'use strict';

var cmRfefState = {
    settings: null,
    ejercicio: null,
    pnBase: 0,        // patrimonio neto sin resultado (centimos)
    resultado: 0,     // resultado del ejercicio (centimos)
    spn: null,        // Saldo Patrimonial Neto (centimos) o null si no hay datos
    tieneContab: false,
    squad: null,      // registro cm_rfef_squad_cost del ejercicio (o null)
    editandoCoste: false,
    obligaciones: [], // catalogo aplicable al nivel del club
    submissions: {},  // estado por obligation_id
    editObl: null,    // obligacion en edicion
    plan: null,       // plan de ajuste del ejercicio (o null)
    editandoPlan: false,
    debt: null,       // deuda vencida del ejercicio (o null)
    editandoDeuda: false,
    tab: 'panel'
};

var CMRF_RANK = { elemental: 1, intermedio: 2, avanzado: 3 };

var CMRF_NIVEL = { avanzado: 'Avanzado', intermedio: 'Intermedio', elemental: 'Elemental' };
var CMRF_CAT = {
    primera: 'Primera Federacion', primera_femenino: 'Primera Federacion Femenino',
    segunda: 'Segunda Federacion', tercera: 'Tercera Federacion',
    futsal_primera: 'Primera Division Futbol Sala'
};
// Si no hay control_level guardado, se deduce de la categoria
var CMRF_CAT_NIVEL = {
    primera: 'avanzado', futsal_primera: 'avanzado',
    primera_femenino: 'intermedio', segunda: 'intermedio',
    tercera: 'elemental'
};

// ---------- helpers ----------
function cmRfefEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
}
function cmRfefEur(cents) {
    var v = (cents || 0) / 100;
    return v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' &euro;';
}
function cmRfefNivel() {
    var s = cmRfefState.settings || {};
    var nivel = s.control_level || (s.rfef_category ? CMRF_CAT_NIVEL[s.rfef_category] : null);
    return nivel || null;
}

// ---------- estilos ----------
function cmRfefInyectarEstilos() {
    if (document.getElementById('cmrf-styles')) return;
    var st = document.createElement('style');
    st.id = 'cmrf-styles';
    st.textContent = [
        '.cmrf-wrap{background:#0f172a;min-height:100%;padding:22px;color:#e2e8f0;font-family:inherit}',
        '.cmrf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:18px}',
        '.cmrf-title{font-size:22px;font-weight:800;color:#f8fafc;margin:0}',
        '.cmrf-sub{color:#94a3b8;font-size:13px;margin-top:4px}',
        '.cmrf-badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700}',
        '.cmrf-badge-av{background:#7f1d1d;color:#fecaca}.cmrf-badge-in{background:#78350f;color:#fde68a}.cmrf-badge-el{background:#14532d;color:#bbf7d0}',
        '.cmrf-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}',
        '.cmrf-tab{background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit}',
        '.cmrf-tab.active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}',
        '.cmrf-banner{border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:14px;display:flex;gap:10px;align-items:center}',
        '.cmrf-banner-ok{background:#052e16;border:1px solid #166534;color:#bbf7d0}',
        '.cmrf-banner-bad{background:#450a0a;border:1px solid #b91c1c;color:#fecaca}',
        '.cmrf-banner-warn{background:#1e293b;border:1px solid #334155;color:#cbd5e1}',
        '.cmrf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}',
        '.cmrf-card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px}',
        '.cmrf-card .lab{color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}',
        '.cmrf-card .val{font-size:24px;font-weight:800;color:#f8fafc}',
        '.cmrf-card .note{font-size:12px;margin-top:8px}',
        '.cmrf-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}',
        '.cmrf-g{background:#22c55e}.cmrf-a{background:#f59e0b}.cmrf-r{background:#ef4444}.cmrf-n{background:#64748b}',
        '.cmrf-soon{display:inline-block;margin-top:8px;font-size:11px;color:#94a3b8;background:#0b1220;border:1px solid #334155;border-radius:6px;padding:2px 8px}',
        '.cmrf-empty{text-align:center;padding:46px 20px;color:#94a3b8}.cmrf-empty .ic{font-size:40px;margin-bottom:10px}',
        '.cmrf-btn{background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit}',
        '.cmrf-detail{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:18px;margin-top:6px}',
        '.cmrf-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #243043;font-size:14px}',
        '.cmrf-row:last-child{border-bottom:none}.cmrf-row .k{color:#cbd5e1}.cmrf-row .v{font-weight:700;color:#f8fafc}',
        '.cmrf-input{width:100%;box-sizing:border-box;padding:8px 10px;background:#0b1220;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;font-family:inherit}',
        '.cmrf-input:focus{border-color:#3b82f6;outline:none}',
        '.cmrf-flabel{color:#94a3b8;font-size:12px;margin-bottom:5px;display:block}.cmrf-fg{margin-bottom:14px}',
        '.cmrf-bar{height:12px;border-radius:7px;background:#0b1220;border:1px solid #334155;overflow:visible;position:relative;margin:10px 0}',
        '.cmrf-bar-fill{height:100%;border-radius:7px}',
        '.cmrf-bar-limit{position:absolute;top:-3px;bottom:-3px;width:2px;background:#e2e8f0}',
        '.cmrf-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}',
        '.cmrf-btn-primary{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:600}'
    ].join('');
    document.head.appendChild(st);
}

// ---------- carga de datos ----------
async function cmRfefCargarDatos() {
    var rs = await supabaseClient.from('cm_eco_settings').select('*').eq('club_id', clubId).maybeSingle();
    cmRfefState.settings = rs.data || null;

    var rf = await supabaseClient.from('cm_eco_fiscal_years').select('*').eq('club_id', clubId).eq('is_current', true).maybeSingle();
    cmRfefState.ejercicio = rf.data || null;

    cmRfefState.pnBase = 0; cmRfefState.resultado = 0; cmRfefState.spn = null; cmRfefState.tieneContab = false;
    if (!cmRfefState.ejercicio) return;

    var rac = await supabaseClient.from('cm_eco_accounts').select('id,account_type').eq('club_id', clubId).eq('is_active', true).range(0, 9999);
    var tipoById = {}; (rac.data || []).forEach(function (c) { tipoById[c.id] = c.account_type; });

    var rj = await supabaseClient.from('cm_eco_journal')
        .select('id, cm_eco_journal_lines(account_id,debit_cents,credit_cents)')
        .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).range(0, 9999);

    var pn = 0, ing = 0, gas = 0, n = 0;
    (rj.data || []).forEach(function (a) {
        (a.cm_eco_journal_lines || []).forEach(function (l) {
            var t = tipoById[l.account_id], d = l.debit_cents || 0, h = l.credit_cents || 0;
            n++;
            if (t === 'patrimonio_neto') pn += (h - d);
            else if (t === 'ingreso') ing += (h - d);
            else if (t === 'gasto') gas += (d - h);
        });
    });
    cmRfefState.pnBase = pn;
    cmRfefState.resultado = ing - gas;
    cmRfefState.spn = pn + (ing - gas);
    cmRfefState.tieneContab = n > 0;

    // coste de plantilla (Fase 2)
    var rq = await supabaseClient.from('cm_rfef_squad_cost').select('*')
        .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).maybeSingle();
    cmRfefState.squad = rq.data || null;

    // obligaciones (Fase 3): catalogo estandar + propias, filtradas por nivel
    var nivel = cmRfefNivel();
    var rnk = CMRF_RANK[nivel] || 1;
    var ro = await supabaseClient.from('cm_rfef_obligations').select('*')
        .or('club_id.is.null,club_id.eq.' + clubId).eq('active', true).order('sort_order').range(0, 9999);
    cmRfefState.obligaciones = (ro.data || []).filter(function (o) { return (CMRF_RANK[o.min_level] || 1) <= rnk; });
    var rsub = await supabaseClient.from('cm_rfef_submissions').select('*')
        .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).range(0, 9999);
    var map = {}; (rsub.data || []).forEach(function (s) { map[s.obligation_id] = s; });
    cmRfefState.submissions = map;

    // plan de ajuste (Fase 4)
    var rp = await supabaseClient.from('cm_rfef_adjustment_plan').select('*')
        .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).maybeSingle();
    cmRfefState.plan = rp.data || null;

    // deuda vencida
    var rd = await supabaseClient.from('cm_rfef_debt').select('*')
        .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).maybeSingle();
    cmRfefState.debt = rd.data || null;
}

// total de deuda vencida (centimos) o null si no se ha registrado
function cmRfefDeudaTotal() {
    var d = cmRfefState.debt;
    if (!d) return null;
    return (d.hacienda_cents || 0) + (d.ss_cents || 0) + (d.sporting_cents || 0) + (d.other_cents || 0);
}

// fecha YYYY-MM-DD -> dd/mm/aaaa
function cmRfefFechaCorta(d) {
    if (!d) return '';
    var p = String(d).slice(0, 10).split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : d;
}
function cmRfefHoyStr() {
    var h = new Date();
    return h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') + '-' + String(h.getDate()).padStart(2, '0');
}
// estado de caducidad de un documento: ok | pronto | caducado | null
function cmRfefCaducidad(validUntil) {
    if (!validUntil) return null;
    var hoy = new Date(cmRfefHoyStr()), v = new Date(String(validUntil).slice(0, 10));
    var dias = Math.round((v - hoy) / 86400000);
    if (dias < 0) return 'caducado';
    if (dias <= 30) return 'pronto';
    return 'ok';
}
function cmRfefOblPorCode(code) {
    for (var i = 0; i < cmRfefState.obligaciones.length; i++) {
        if (cmRfefState.obligaciones[i].code === code) return cmRfefState.obligaciones[i];
    }
    return null;
}

// euros (texto es-ES) -> centimos
function cmRfefEurToCents(str) {
    if (str == null) return 0;
    var s = String(str).trim().replace(/\s|€/g, '').replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * 100);
}

// Calcula el estado del ratio de coste de plantilla
function cmRfefRatio() {
    var q = cmRfefState.squad;
    if (!q || q.applies === false) return { aplica: q ? false : null, hayDatos: false };
    var coste = q.squad_cost_cents || 0;
    var ing = q.expected_income_cents || 0;
    var limite = parseFloat(q.ratio_limit_pct != null ? q.ratio_limit_pct : 70);
    if (ing <= 0) return { aplica: true, hayDatos: false, limite: limite };
    var ratio = (coste / ing) * 100;
    var tope = ing * limite / 100;            // gasto maximo permitido (centimos)
    var margen = tope - coste;                // positivo = margen; negativo = exceso
    var estado = ratio > limite ? 'r' : (ratio >= limite * 0.9 ? 'a' : 'g');
    return { aplica: true, hayDatos: true, coste: coste, ing: ing, limite: limite, ratio: ratio, margen: margen, estado: estado };
}

// subida/visionado de documentos (reutiliza la Edge Function del modulo Economico)
function cmRfefFileToBase64(file) {
    return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(String(r.result).split(',')[1]); };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}
async function cmRfefInvoke(fn, body) {
    var r = await supabaseClient.functions.invoke(fn, { body: body });
    if (r.error) throw r.error;
    return r.data;
}
window.cmRfefVerDoc = async function (path) {
    try {
        var d = await cmRfefInvoke('eco-upload-receipt', { action: 'sign', path: path });
        if (d && d.signed_url) window.open(d.signed_url, '_blank');
        else cmRfefToast('No se pudo abrir el documento', 'error');
    } catch (e) { console.error('cmRfefVerDoc:', e); cmRfefToast('No se pudo abrir el documento', 'error'); }
};
window.cmRfefSubirDoc = async function (obId) {
    var inp = document.getElementById('cmrf-ob-file');
    if (!inp || !inp.files || !inp.files[0]) { cmRfefToast('Elige un archivo primero', 'error'); return; }
    var f = inp.files[0];
    try {
        var b64 = await cmRfefFileToBase64(f);
        var up = await cmRfefInvoke('eco-upload-receipt', { action: 'upload', file_base64: b64, media_type: f.type, club_id: clubId });
        var path = up && up.path ? up.path : null;
        if (!path) throw new Error('sin ruta');
        await cmRfefUpsertSub(obId, { document_path: path });
        if (typeof showToast === 'function') showToast('Documento subido');
        cmRfefCambiarTab(cmRfefState.tab);
    } catch (e) { console.error('cmRfefSubirDoc:', e); cmRfefToast('Error al subir el documento', 'error'); }
};

// ---------- shell ----------
function cmRfefInit(containerId) {
    cmRfefInyectarEstilos();
    var cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '<div class="cmrf-wrap"><div class="cmrf-empty"><div class="ic">&#8987;</div><p>Cargando control economico...</p></div></div>';
    cmRfefCargarDatos().then(function () {
        cmRfefRenderShell(cont);
    }).catch(function (e) {
        console.error('[Control RFEF] cargar:', e);
        cont.innerHTML = '<div class="cmrf-wrap"><div class="cmrf-empty"><div class="ic">&#9888;</div><p>No se pudo cargar el control economico.</p></div></div>';
    });
}

function cmRfefRenderShell(cont) {
    var nivel = cmRfefNivel();
    var s = cmRfefState.settings || {};
    var nivelTxt = nivel ? CMRF_NIVEL[nivel] : 'Sin configurar';
    var badgeCls = nivel === 'avanzado' ? 'cmrf-badge-av' : (nivel === 'intermedio' ? 'cmrf-badge-in' : (nivel === 'elemental' ? 'cmrf-badge-el' : 'cmrf-badge-in'));
    var catTxt = s.rfef_category ? (CMRF_CAT[s.rfef_category] || s.rfef_category) : 'Competicion no indicada';
    var ejTxt = cmRfefState.ejercicio ? cmRfefEsc(cmRfefState.ejercicio.name || '') : 'Sin ejercicio activo';

    cont.innerHTML =
        '<div class="cmrf-wrap">' +
            '<div class="cmrf-head">' +
                '<div>' +
                    '<h2 class="cmrf-title">&#128737; Control Economico RFEF</h2>' +
                    '<div class="cmrf-sub">' + cmRfefEsc(catTxt) + ' &middot; Ejercicio ' + ejTxt + '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                    '<span class="cmrf-badge ' + badgeCls + '">Nivel ' + nivelTxt + '</span>' +
                    '<div style="margin-top:8px"><button class="cmrf-btn" onclick="cmRfefRecargar()">Actualizar</button></div>' +
                '</div>' +
            '</div>' +
            '<div class="cmrf-tabs">' +
                '<button class="cmrf-tab" id="cmrf-t-panel" onclick="cmRfefCambiarTab(\'panel\')">Panel</button>' +
                '<button class="cmrf-tab" id="cmrf-t-indicadores" onclick="cmRfefCambiarTab(\'indicadores\')">Indicadores</button>' +
                '<button class="cmrf-tab" id="cmrf-t-calendario" onclick="cmRfefCambiarTab(\'calendario\')">Calendario</button>' +
                '<button class="cmrf-tab" id="cmrf-t-documentos" onclick="cmRfefCambiarTab(\'documentos\')">Documentos</button>' +
                '<button class="cmrf-tab" id="cmrf-t-plan" onclick="cmRfefCambiarTab(\'plan\')">Plan de ajuste</button>' +
            '</div>' +
            '<div id="cmrf-cont"></div>' +
        '</div>';
    cmRfefCambiarTab(cmRfefState.tab || 'panel');
}

function cmRfefCambiarTab(tab) {
    cmRfefState.tab = tab;
    ['panel', 'indicadores', 'calendario', 'documentos', 'plan'].forEach(function (t) {
        var b = document.getElementById('cmrf-t-' + t);
        if (b) b.className = 'cmrf-tab' + (t === tab ? ' active' : '');
    });
    var c = document.getElementById('cmrf-cont');
    if (!c) return;
    if (tab === 'panel') return cmRfefPanel(c);
    if (tab === 'indicadores') return cmRfefIndicadores(c);
    if (tab === 'calendario') return cmRfefCalendario(c);
    if (tab === 'documentos') return cmRfefDocumentos(c);
    return cmRfefPlan(c);
}

// ---------- tarjeta indicador ----------
function cmRfefCard(lab, valHtml, dotCls, note, noteColor, soon) {
    return '<div class="cmrf-card"><div class="lab">' + lab + '</div>' +
        '<div class="val"><span class="cmrf-dot ' + dotCls + '"></span>' + valHtml + '</div>' +
        (note ? '<div class="note" style="color:' + (noteColor || '#94a3b8') + '">' + note + '</div>' : '') +
        (soon ? '<div class="cmrf-soon">Fase siguiente</div>' : '') +
        '</div>';
}

// ---------- PANEL ----------
function cmRfefPanel(c) {
    if (!cmRfefState.ejercicio) {
        c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#129518;</div><h3 style="color:#e2e8f0">Sin ejercicio contable activo</h3>' +
            '<p>El control economico se calcula sobre la contabilidad del club. Activa un ejercicio en el modulo Economico.</p></div>';
        return;
    }
    var spn = cmRfefState.spn;
    var enDificultad = (spn != null && spn < 0);

    // banner global (Fase 1: se basa en el SPN, unico indicador ya calculado)
    var banner;
    if (!cmRfefState.tieneContab) {
        banner = '<div class="cmrf-banner cmrf-banner-warn"><span>&#8505;</span><span>Aun no hay asientos contables en este ejercicio. En cuanto registres movimientos en el modulo Economico, el patrimonio neto se calculara aqui automaticamente.</span></div>';
    } else if (enDificultad) {
        banner = '<div class="cmrf-banner cmrf-banner-bad"><span>&#9888;</span><span><b>Entidad en Dificultad Economica.</b> El patrimonio neto es negativo. La RFEF exige presentar un plan de ajuste para corregirlo.</span></div>';
    } else {
        banner = '<div class="cmrf-banner cmrf-banner-ok"><span>&#10003;</span><span><b>Patrimonio neto positivo.</b> El club cumple el requisito patrimonial basico del control economico.</span></div>';
    }

    // tarjeta SPN
    var spnCard;
    if (spn == null || !cmRfefState.tieneContab) {
        spnCard = cmRfefCard('Saldo Patrimonial Neto', '&mdash;', 'cmrf-n', 'Sin movimientos contables todavia', '#94a3b8', false);
    } else {
        spnCard = cmRfefCard('Saldo Patrimonial Neto', cmRfefEur(spn),
            spn >= 0 ? 'cmrf-g' : 'cmrf-r',
            spn >= 0 ? 'Positivo &mdash; requisito cumplido' : 'Negativo &mdash; Dificultad Economica',
            spn >= 0 ? '#4ade80' : '#f87171', false);
    }

    // tarjeta coste de plantilla (Fase 2): ratio contra el limite configurado del club
    var r = cmRfefRatio();
    var ratioCard;
    if (r.aplica === false) {
        ratioCard = cmRfefCard('Coste de plantilla', 'No aplica', 'cmrf-n', 'Desactivado para este nivel', '#94a3b8', false);
    } else if (!r.hayDatos) {
        ratioCard = cmRfefCard('Coste de plantilla', '&mdash;', 'cmrf-n', 'Sin configurar (limite ' + (r.limite != null ? r.limite : 70) + '%)', '#94a3b8', false);
    } else {
        var dot = r.estado === 'r' ? 'cmrf-r' : (r.estado === 'a' ? 'cmrf-a' : 'cmrf-g');
        var col = r.estado === 'r' ? '#f87171' : (r.estado === 'a' ? '#fbbf24' : '#4ade80');
        var nota = r.estado === 'r' ? ('Supera el ' + r.limite + '% (exceso ' + cmRfefEur(-r.margen) + ')')
            : (r.estado === 'a' ? ('Cerca del limite del ' + r.limite + '%') : ('Dentro del ' + r.limite + '%'));
        ratioCard = cmRfefCard('Coste de plantilla', r.ratio.toFixed(1) + '%', dot, nota, col, false);
    }

    var dt = cmRfefDeudaTotal();
    var deudaCard;
    if (dt == null) deudaCard = cmRfefCard('Deuda vencida', '&mdash;', 'cmrf-n', 'Sin registrar (debe estar a cero)', '#94a3b8', false);
    else if (dt === 0) deudaCard = cmRfefCard('Deuda vencida', cmRfefEur(0), 'cmrf-g', 'Sin deuda vencida', '#4ade80', false);
    else deudaCard = cmRfefCard('Deuda vencida', cmRfefEur(dt), 'cmrf-r', 'Debe regularizarse', '#f87171', false);
    var ce = cmRfefEstadoCertificados();
    var certCard = ce
        ? cmRfefCard('Al corriente de pago', ce.txt, ce.dot, ce.nota, ce.col, false)
        : cmRfefCard('Al corriente de pago', '&mdash;', 'cmrf-n', 'Hacienda y Seguridad Social', '#94a3b8', true);

    var pend = cmRfefContarPendientes();
    var pie = '<div style="margin-top:16px;color:#94a3b8;font-size:13px">' +
        (pend ? ('<b style="color:#fbbf24">' + pend + '</b> obligaciones pendientes. ') : 'Sin obligaciones pendientes. ') +
        'Ver detalle en <b style="color:#cbd5e1">Calendario</b>.</div>';

    c.innerHTML = banner + '<div class="cmrf-grid">' + spnCard + ratioCard + deudaCard + certCard + '</div>' + pie;
}

function cmRfefEstadoCertificados() {
    var codes = ['HACIENDA_OK', 'SS_OK'], hay = false, pend = false, cad = false;
    codes.forEach(function (code) {
        var ob = cmRfefOblPorCode(code); if (!ob) return; hay = true;
        var s = cmRfefState.submissions[ob.id];
        if (!s || s.status !== 'presentado') { pend = true; return; }
        if (cmRfefCaducidad(s.valid_until) === 'caducado') cad = true;
    });
    if (!hay) return null;
    if (cad) return { dot: 'cmrf-r', txt: 'Caducado', col: '#f87171', nota: 'Algun certificado caducado' };
    if (pend) return { dot: 'cmrf-a', txt: 'Pendiente', col: '#fbbf24', nota: 'Falta presentar o renovar' };
    return { dot: 'cmrf-g', txt: 'Al dia', col: '#4ade80', nota: 'Hacienda y Seguridad Social' };
}

// ---------- INDICADORES ----------
function cmRfefIndicadores(c) {
    if (!cmRfefState.ejercicio) {
        c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#129518;</div><h3 style="color:#e2e8f0">Sin ejercicio activo</h3></div>';
        return;
    }
    c.innerHTML = cmRfefBloqueSPN() + '<div style="height:24px"></div>' + cmRfefBloqueCoste() + '<div style="height:24px"></div>' + cmRfefBloqueDeuda();
}

function cmRfefBloqueSPN() {
    var spn = cmRfefState.spn;
    var html = '<h3 style="color:#f8fafc;margin:0 0 4px">Saldo Patrimonial Neto</h3>' +
        '<p style="color:#94a3b8;font-size:13px;margin:0 0 12px">Indicador patrimonial comun a todos los niveles de control: debe ser positivo. Se calcula desde el Balance de situacion del modulo Economico (patrimonio neto mas el resultado del ejercicio).</p>';
    if (!cmRfefState.tieneContab) {
        return html + '<div class="cmrf-banner cmrf-banner-warn"><span>&#8505;</span><span>Todavia no hay asientos en este ejercicio.</span></div>';
    }
    html += '<div class="cmrf-detail">' +
        '<div class="cmrf-row"><span class="k">Patrimonio neto (sin resultado)</span><span class="v">' + cmRfefEur(cmRfefState.pnBase) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Resultado del ejercicio</span><span class="v" style="color:' + (cmRfefState.resultado >= 0 ? '#4ade80' : '#f87171') + '">' + cmRfefEur(cmRfefState.resultado) + '</span></div>' +
        '<div class="cmrf-row"><span class="k"><b>Saldo Patrimonial Neto</b></span><span class="v" style="color:' + (spn >= 0 ? '#4ade80' : '#f87171') + ';font-size:17px">' + cmRfefEur(spn) + '</span></div>' +
        '</div>' +
        '<div class="cmrf-banner ' + (spn >= 0 ? 'cmrf-banner-ok' : 'cmrf-banner-bad') + '" style="margin-top:12px"><span>' + (spn >= 0 ? '&#10003;' : '&#9888;') + '</span><span>' +
        (spn >= 0 ? 'Por encima de cero: el club cumple el requisito patrimonial.' : 'Por debajo de cero: el club esta en Dificultad Economica y debe presentar un plan de ajuste.') +
        '</span></div>';
    return html;
}

function cmRfefBloqueCoste() {
    var q = cmRfefState.squad || {};
    var r = cmRfefRatio();
    var limite = (q.ratio_limit_pct != null ? q.ratio_limit_pct : 70);
    var head = '<h3 style="color:#f8fafc;margin:0 0 4px">Coste de plantilla deportiva</h3>' +
        '<p style="color:#94a3b8;font-size:13px;margin:0 0 12px">El coste de la plantilla (salarios, seguros sociales, amortizaciones de derechos y comisiones) no debe superar el limite configurado sobre los ingresos previstos. Limite actual: <b style="color:#cbd5e1">' + limite + '%</b>.</p>';

    if (cmRfefState.editandoCoste) return head + cmRfefFormCoste();

    var puedeEditar = (typeof cmPuedeEditar !== 'function') || cmPuedeEditar('cumplimiento_rfef');
    var btn = puedeEditar ? '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefEditarCoste()">' + (r.hayDatos ? 'Editar datos' : 'Configurar') + '</button></div>' : '';

    if (q.applies === false) {
        return head + '<div class="cmrf-banner cmrf-banner-warn"><span>&#8505;</span><span>Este control esta marcado como <b>no aplicable</b> para el nivel del club.</span></div>' + btn;
    }
    if (!r.hayDatos) {
        return head + '<div class="cmrf-banner cmrf-banner-warn"><span>&#8505;</span><span>Aun no has indicado el coste de plantilla y los ingresos previstos.</span></div>' + btn;
    }
    var pct = Math.max(0, Math.min(100, r.ratio));
    var fillCol = r.estado === 'r' ? '#ef4444' : (r.estado === 'a' ? '#f59e0b' : '#22c55e');
    var limitPos = Math.min(100, r.limite);
    var bar = '<div class="cmrf-bar"><div class="cmrf-bar-fill" style="width:' + pct + '%;background:' + fillCol + '"></div><div class="cmrf-bar-limit" style="left:' + limitPos + '%"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8"><span>0%</span><span>limite ' + r.limite + '%</span><span>100%</span></div>';
    var detalle = '<div class="cmrf-detail" style="margin-top:10px">' +
        '<div class="cmrf-row"><span class="k">Coste de plantilla</span><span class="v">' + cmRfefEur(r.coste) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Ingresos previstos</span><span class="v">' + cmRfefEur(r.ing) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Ratio</span><span class="v" style="color:' + fillCol + '">' + r.ratio.toFixed(1) + '%</span></div>' +
        '<div class="cmrf-row"><span class="k">' + (r.margen >= 0 ? 'Margen disponible' : 'Exceso sobre el limite') + '</span><span class="v" style="color:' + (r.margen >= 0 ? '#4ade80' : '#f87171') + '">' + cmRfefEur(Math.abs(r.margen)) + '</span></div>' +
        '</div>';
    var banner = r.estado === 'r'
        ? '<div class="cmrf-banner cmrf-banner-bad" style="margin-top:12px"><span>&#9888;</span><span>Supera el limite del ' + r.limite + '%. La RFEF puede sancionar el exceso.</span></div>'
        : (r.estado === 'a' ? '<div class="cmrf-banner cmrf-banner-warn" style="margin-top:12px"><span>&#8505;</span><span>Cerca del limite. Vigila los proximos fichajes o renovaciones.</span></div>'
        : '<div class="cmrf-banner cmrf-banner-ok" style="margin-top:12px"><span>&#10003;</span><span>Dentro del limite permitido.</span></div>');
    return head + bar + detalle + banner + btn;
}

function cmRfefFormCoste() {
    var q = cmRfefState.squad || {};
    var coste = q.squad_cost_cents ? (q.squad_cost_cents / 100) : '';
    var ing = q.expected_income_cents ? (q.expected_income_cents / 100) : '';
    var lim = (q.ratio_limit_pct != null ? q.ratio_limit_pct : 70);
    var aplica = (q.applies === false) ? '' : 'checked';
    return '<div class="cmrf-detail">' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Coste de plantilla deportiva (EUR)</label><input class="cmrf-input" id="cmrf-coste" inputmode="decimal" value="' + coste + '" placeholder="Ej: 350000"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Ingresos previstos (EUR)</label><input class="cmrf-input" id="cmrf-ing" inputmode="decimal" value="' + ing + '" placeholder="Ej: 600000"><div class="cmrf-actions"><button class="cmrf-btn" onclick="cmRfefTraerPresupuesto()">Traer del presupuesto</button></div></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Limite permitido (% sobre ingresos)</label><input class="cmrf-input" id="cmrf-lim" inputmode="decimal" value="' + lim + '"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel"><input type="checkbox" id="cmrf-aplica" ' + aplica + '> Este control aplica al club (segun su nivel)</label></div>' +
        '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefGuardarCoste()">Guardar</button><button class="cmrf-btn" onclick="cmRfefCancelarCoste()">Cancelar</button></div>' +
    '</div>';
}

function cmRfefToast(msg, tipo) { if (typeof showToast === 'function') showToast(msg, tipo); else if (tipo === 'error') alert(msg); }

function cmRfefBloqueDeuda() {
    var d = cmRfefState.debt || {};
    var head = '<h3 style="color:#f8fafc;margin:0 0 4px">Deuda vencida</h3>' +
        '<p style="color:#94a3b8;font-size:13px;margin:0 0 12px">Deuda liquida, vencida y exigible no pagada (Hacienda, Seguridad Social, deudas deportivas u otras). Debe estar a cero a la fecha de control.</p>';
    if (cmRfefState.editandoDeuda) return head + cmRfefFormDeuda(d);
    var puedeEditar = (typeof cmPuedeEditar !== 'function') || cmPuedeEditar('cumplimiento_rfef');
    var dt = cmRfefDeudaTotal();
    var btn = puedeEditar ? '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefEditarDeuda()">' + (cmRfefState.debt ? 'Editar datos' : 'Configurar') + '</button></div>' : '';
    if (dt == null) {
        return head + '<div class="cmrf-banner cmrf-banner-warn"><span>&#8505;</span><span>Aun no has registrado la deuda vencida del club.</span></div>' + btn;
    }
    var detalle = '<div class="cmrf-detail">' +
        '<div class="cmrf-row"><span class="k">Hacienda</span><span class="v">' + cmRfefEur(d.hacienda_cents) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Seguridad Social</span><span class="v">' + cmRfefEur(d.ss_cents) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Deudas deportivas</span><span class="v">' + cmRfefEur(d.sporting_cents) + '</span></div>' +
        '<div class="cmrf-row"><span class="k">Otras</span><span class="v">' + cmRfefEur(d.other_cents) + '</span></div>' +
        '<div class="cmrf-row"><span class="k"><b>Total deuda vencida</b></span><span class="v" style="color:' + (dt === 0 ? '#4ade80' : '#f87171') + ';font-size:17px">' + cmRfefEur(dt) + '</span></div>' +
        (d.as_of_date ? '<div class="cmrf-row"><span class="k">A fecha de</span><span class="v">' + cmRfefFechaCorta(d.as_of_date) + '</span></div>' : '') +
        '</div>';
    var banner = dt === 0
        ? '<div class="cmrf-banner cmrf-banner-ok" style="margin-top:12px"><span>&#10003;</span><span>Sin deuda vencida: requisito cumplido.</span></div>'
        : '<div class="cmrf-banner cmrf-banner-bad" style="margin-top:12px"><span>&#9888;</span><span>Existe deuda vencida. Debe regularizarse para cumplir el control.</span></div>';
    return head + detalle + banner + btn;
}
function cmRfefFormDeuda(d) {
    d = d || {};
    var v = function (c) { return c ? (c / 100) : ''; };
    return '<div class="cmrf-detail">' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Deuda con Hacienda (EUR)</label><input class="cmrf-input" id="cmrf-dh" inputmode="decimal" value="' + v(d.hacienda_cents) + '" placeholder="0"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Deuda con Seguridad Social (EUR)</label><input class="cmrf-input" id="cmrf-dss" inputmode="decimal" value="' + v(d.ss_cents) + '" placeholder="0"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Deudas deportivas (jugadores, tecnicos, clubes) (EUR)</label><input class="cmrf-input" id="cmrf-dsp" inputmode="decimal" value="' + v(d.sporting_cents) + '" placeholder="0"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Otras deudas vencidas (EUR)</label><input class="cmrf-input" id="cmrf-dot" inputmode="decimal" value="' + v(d.other_cents) + '" placeholder="0"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">A fecha de</label><input type="date" class="cmrf-input" id="cmrf-dfecha" value="' + (d.as_of_date ? String(d.as_of_date).slice(0, 10) : '') + '"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Notas</label><input type="text" class="cmrf-input" id="cmrf-dnotas" value="' + cmRfefEsc(d.notes || '') + '"></div>' +
        '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefGuardarDeuda()">Guardar</button><button class="cmrf-btn" onclick="cmRfefCancelarDeuda()">Cancelar</button></div>' +
    '</div>';
}
window.cmRfefEditarDeuda = function () { cmRfefState.editandoDeuda = true; cmRfefState.tab = 'indicadores'; cmRfefCambiarTab('indicadores'); };
window.cmRfefCancelarDeuda = function () { cmRfefState.editandoDeuda = false; cmRfefCambiarTab('indicadores'); };
window.cmRfefGuardarDeuda = async function () {
    var g = function (x) { var el = document.getElementById(x); return el ? el.value : ''; };
    var payload = {
        club_id: clubId, fiscal_year_id: cmRfefState.ejercicio.id,
        hacienda_cents: cmRfefEurToCents(g('cmrf-dh')), ss_cents: cmRfefEurToCents(g('cmrf-dss')),
        sporting_cents: cmRfefEurToCents(g('cmrf-dsp')), other_cents: cmRfefEurToCents(g('cmrf-dot')),
        as_of_date: g('cmrf-dfecha') || null, notes: g('cmrf-dnotas') || null,
        updated_by: (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null,
        updated_at: new Date().toISOString()
    };
    try {
        var r = await supabaseClient.from('cm_rfef_debt').upsert(payload, { onConflict: 'club_id,fiscal_year_id' }).select().single();
        if (r.error) throw r.error;
        cmRfefState.debt = r.data;
        cmRfefState.editandoDeuda = false;
        cmRfefCambiarTab('indicadores');
        if (typeof showToast === 'function') showToast('Deuda vencida guardada');
    } catch (e) { console.error('cmRfefGuardarDeuda:', e); cmRfefToast('Error al guardar: ' + (e.message || e), 'error'); }
};

// ---------- CALENDARIO DE OBLIGACIONES ----------
function cmRfefBadgeEstado(estado) {
    var m = { pendiente: ['#78350f', '#fde68a', 'Pendiente'], presentado: ['#14532d', '#bbf7d0', 'Presentado'], no_aplica: ['#334155', '#cbd5e1', 'No aplica'] };
    var x = m[estado] || m.pendiente;
    return '<span class="cmrf-badge" style="background:' + x[0] + ';color:' + x[1] + '">' + x[2] + '</span>';
}
function cmRfefContarPendientes() {
    var n = 0;
    cmRfefState.obligaciones.forEach(function (ob) {
        var s = cmRfefState.submissions[ob.id];
        var est = s ? s.status : 'pendiente';
        if (est !== 'presentado' && est !== 'no_aplica') n++;
    });
    return n;
}
function cmRfefCalendario(c) {
    if (!cmRfefState.ejercicio) { c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#129518;</div><h3 style="color:#e2e8f0">Sin ejercicio activo</h3></div>'; return; }
    if (!cmRfefState.obligaciones.length) { c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#128203;</div><h3 style="color:#e2e8f0">Sin obligaciones</h3><p>No hay obligaciones definidas para este nivel.</p></div>'; return; }
    var puedeEditar = (typeof cmPuedeEditar !== 'function') || cmPuedeEditar('cumplimiento_rfef');
    var pend = cmRfefContarPendientes();
    var head = '<div style="margin-bottom:14px;color:#cbd5e1;font-size:13px">' + cmRfefState.obligaciones.length +
        ' obligaciones para el nivel actual &middot; <b style="color:' + (pend ? '#fbbf24' : '#4ade80') + '">' + pend + ' pendientes</b></div>';
    c.innerHTML = head + cmRfefState.obligaciones.map(function (ob) { return cmRfefFilaObligacion(ob, puedeEditar); }).join('');
}
function cmRfefFilaObligacion(ob, puedeEditar) {
    var s = cmRfefState.submissions[ob.id] || null;
    var estado = s ? s.status : 'pendiente';
    var top = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">' +
        '<div><div style="color:#f8fafc;font-weight:600;font-size:14px">' + cmRfefEsc(ob.name) + '</div>' +
        (ob.due_label ? '<div style="color:#94a3b8;font-size:12px;margin-top:2px">' + cmRfefEsc(ob.due_label) + '</div>' : '') + '</div>' +
        cmRfefBadgeEstado(estado) + '</div>';
    if (cmRfefState.editObl === ob.id) {
        return '<div class="cmrf-card" style="margin-bottom:10px">' + top + cmRfefFormObl(ob, s) + '</div>';
    }
    var extra = '';
    if (estado === 'presentado' && s) {
        if (s.submitted_on) extra += '<div style="color:#94a3b8;font-size:12px;margin-top:6px">Presentado el ' + cmRfefFechaCorta(s.submitted_on) + '</div>';
        if (ob.has_validity && s.valid_until) {
            var cad = cmRfefCaducidad(s.valid_until);
            var col = cad === 'caducado' ? '#f87171' : (cad === 'pronto' ? '#fbbf24' : '#4ade80');
            var txt = cad === 'caducado' ? 'Caducado' : (cad === 'pronto' ? 'Caduca pronto' : 'Vigente');
            extra += '<div style="color:' + col + ';font-size:12px;margin-top:2px">' + txt + ' (hasta ' + cmRfefFechaCorta(s.valid_until) + ')</div>';
        }
    }
    if (s && s.responsible) extra += '<div style="color:#94a3b8;font-size:12px;margin-top:2px">Responsable: ' + cmRfefEsc(s.responsible) + '</div>';
    if (s && s.notes) extra += '<div style="color:#94a3b8;font-size:12px;margin-top:2px">' + cmRfefEsc(s.notes) + '</div>';
    var acciones = '<div class="cmrf-actions">';
    if (s && s.document_path) acciones += '<button class="cmrf-btn" onclick="cmRfefVerDoc(\'' + s.document_path + '\')">Ver documento</button>';
    if (puedeEditar) {
        if (estado !== 'presentado') acciones += '<button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefMarcarPresentado(\'' + ob.id + '\')">Marcar presentado</button>';
        acciones += '<button class="cmrf-btn" onclick="cmRfefEditarObl(\'' + ob.id + '\')">Editar</button>';
    }
    acciones += '</div>';
    return '<div class="cmrf-card" style="margin-bottom:10px">' + top + extra + acciones + '</div>';
}
function cmRfefFormObl(ob, s) {
    s = s || {};
    var opt = function (v, t) { return '<option value="' + v + '"' + ((s.status || 'pendiente') === v ? ' selected' : '') + '>' + t + '</option>'; };
    var vig = ob.has_validity ?
        '<div class="cmrf-fg"><label class="cmrf-flabel">Vigencia (caduca el)</label><input type="date" class="cmrf-input" id="cmrf-ob-vig" value="' + (s.valid_until ? String(s.valid_until).slice(0, 10) : '') + '"></div>' : '';
    var doc = '';
    if (ob.requires_document) {
        var actual = s.document_path
            ? '<div style="margin-bottom:6px;color:#4ade80;font-size:12px">Documento adjunto. <button class="cmrf-btn" style="margin-left:6px" onclick="cmRfefVerDoc(\'' + s.document_path + '\')">Ver</button></div>'
            : '';
        doc = '<div class="cmrf-fg"><label class="cmrf-flabel">Documento (PDF o imagen)</label>' + actual +
            '<input type="file" class="cmrf-input" id="cmrf-ob-file" accept="image/*,application/pdf">' +
            '<div class="cmrf-actions"><button class="cmrf-btn" onclick="cmRfefSubirDoc(\'' + ob.id + '\')">' + (s.document_path ? 'Reemplazar documento' : 'Subir documento') + '</button></div></div>';
    }
    return '<div style="margin-top:10px">' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Estado</label><select class="cmrf-input" id="cmrf-ob-estado">' +
            opt('pendiente', 'Pendiente') + opt('presentado', 'Presentado') + opt('no_aplica', 'No aplica') + '</select></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Fecha de presentacion</label><input type="date" class="cmrf-input" id="cmrf-ob-fecha" value="' + (s.submitted_on ? String(s.submitted_on).slice(0, 10) : '') + '"></div>' +
        vig +
        doc +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Responsable</label><input type="text" class="cmrf-input" id="cmrf-ob-resp" value="' + cmRfefEsc(s.responsible || '') + '"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Notas</label><input type="text" class="cmrf-input" id="cmrf-ob-notas" value="' + cmRfefEsc(s.notes || '') + '"></div>' +
        '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefGuardarObl(\'' + ob.id + '\')">Guardar</button><button class="cmrf-btn" onclick="cmRfefCancelarObl()">Cancelar</button></div>' +
    '</div>';
}

// ---------- DOCUMENTOS (vista de los que requieren documento / vigencia) ----------
function cmRfefDocumentos(c) {
    if (!cmRfefState.ejercicio) { c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#129518;</div><h3 style="color:#e2e8f0">Sin ejercicio activo</h3></div>'; return; }
    var docs = cmRfefState.obligaciones.filter(function (o) { return o.requires_document; });
    if (!docs.length) { c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#128193;</div><h3 style="color:#e2e8f0">Sin documentos requeridos</h3></div>'; return; }
    var head = '<p style="color:#94a3b8;font-size:13px;margin:0 0 14px">Documentos exigidos en tu nivel y su estado. La subida del archivo se anadira en la siguiente fase; por ahora se controla el estado y la vigencia desde el Calendario.</p>';
    var filas = docs.map(function (ob) {
        var s = cmRfefState.submissions[ob.id] || null;
        var estado = s ? s.status : 'pendiente';
        var vigTxt = '';
        if (ob.has_validity) {
            if (s && s.valid_until) {
                var cad = cmRfefCaducidad(s.valid_until);
                var col = cad === 'caducado' ? '#f87171' : (cad === 'pronto' ? '#fbbf24' : '#4ade80');
                vigTxt = '<div style="color:' + col + ';font-size:12px;margin-top:4px">' + (cad === 'caducado' ? 'Caducado' : cad === 'pronto' ? 'Caduca pronto' : 'Vigente') + ' (hasta ' + cmRfefFechaCorta(s.valid_until) + ')</div>';
            } else {
                vigTxt = '<div style="color:#94a3b8;font-size:12px;margin-top:4px">Sin fecha de vigencia</div>';
            }
        }
        var verBtn = (s && s.document_path) ? '<div class="cmrf-actions"><button class="cmrf-btn" onclick="cmRfefVerDoc(\'' + s.document_path + '\')">Ver documento</button></div>' : '';
        return '<div class="cmrf-card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">' +
            '<div style="color:#f8fafc;font-weight:600;font-size:14px">' + cmRfefEsc(ob.name) + '</div>' + cmRfefBadgeEstado(estado) + '</div>' + vigTxt + verBtn + '</div>';
    }).join('');
    c.innerHTML = head + filas;
}

// ---------- guardado de estados ----------
async function cmRfefUpsertSub(obId, patch) {
    var base = cmRfefState.submissions[obId] || {};
    var payload = {
        club_id: clubId, fiscal_year_id: cmRfefState.ejercicio.id, obligation_id: obId,
        status: base.status || 'pendiente', submitted_on: base.submitted_on || null,
        valid_until: base.valid_until || null, responsible: base.responsible || null, notes: base.notes || null
    };
    for (var k in patch) payload[k] = patch[k];
    payload.updated_by = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
    payload.updated_at = new Date().toISOString();
    var r = await supabaseClient.from('cm_rfef_submissions').upsert(payload, { onConflict: 'club_id,fiscal_year_id,obligation_id' }).select().single();
    if (r.error) throw r.error;
    cmRfefState.submissions[obId] = r.data;
    return r.data;
}

window.cmRfefEditarObl = function (id) { cmRfefState.editObl = id; cmRfefCambiarTab(cmRfefState.tab); };
window.cmRfefCancelarObl = function () { cmRfefState.editObl = null; cmRfefCambiarTab(cmRfefState.tab); };
window.cmRfefMarcarPresentado = async function (id) {
    try {
        var base = cmRfefState.submissions[id] || {};
        await cmRfefUpsertSub(id, { status: 'presentado', submitted_on: base.submitted_on || cmRfefHoyStr() });
        cmRfefCambiarTab(cmRfefState.tab);
        if (typeof showToast === 'function') showToast('Marcado como presentado');
    } catch (e) { console.error('cmRfefMarcarPresentado:', e); cmRfefToast('Error al guardar', 'error'); }
};
window.cmRfefGuardarObl = async function (id) {
    var get = function (x) { var el = document.getElementById(x); return el ? el.value : ''; };
    var patch = {
        status: get('cmrf-ob-estado') || 'pendiente',
        submitted_on: get('cmrf-ob-fecha') || null,
        valid_until: (document.getElementById('cmrf-ob-vig') ? (get('cmrf-ob-vig') || null) : (cmRfefState.submissions[id] ? cmRfefState.submissions[id].valid_until : null)),
        responsible: get('cmrf-ob-resp') || null,
        notes: get('cmrf-ob-notas') || null
    };
    try {
        await cmRfefUpsertSub(id, patch);
        cmRfefState.editObl = null;
        cmRfefCambiarTab(cmRfefState.tab);
        if (typeof showToast === 'function') showToast('Obligacion actualizada');
    } catch (e) { console.error('cmRfefGuardarObl:', e); cmRfefToast('Error al guardar: ' + (e.message || e), 'error'); }
};

// ---------- PLAN DE AJUSTE ----------
function cmRfefBadgePlan(status) {
    var m = { borrador: ['#334155', '#cbd5e1', 'Borrador'], activo: ['#1e3a8a', '#bfdbfe', 'Activo'], cumplido: ['#14532d', '#bbf7d0', 'Cumplido'], cerrado: ['#334155', '#cbd5e1', 'Cerrado'] };
    var x = m[status] || m.borrador;
    return '<span class="cmrf-badge" style="background:' + x[0] + ';color:' + x[1] + '">' + x[2] + '</span>';
}
function cmRfefPlanRow(k, v) {
    return '<div style="padding:9px 0;border-bottom:1px solid #243043"><div style="color:#94a3b8;font-size:12px;margin-bottom:3px">' + k + '</div>' +
        '<div style="color:#e2e8f0;font-size:14px;white-space:pre-wrap">' + (v ? cmRfefEsc(v) : '&mdash;') + '</div></div>';
}
function cmRfefPlan(c) {
    if (!cmRfefState.ejercicio) { c.innerHTML = '<div class="cmrf-empty"><div class="ic">&#129518;</div><h3 style="color:#e2e8f0">Sin ejercicio activo</h3></div>'; return; }
    var spn = cmRfefState.spn;
    var enDif = (spn != null && spn < 0);
    var puedeEditar = (typeof cmPuedeEditar !== 'function') || cmPuedeEditar('cumplimiento_rfef');
    var p = cmRfefState.plan;

    var top = enDif
        ? '<div class="cmrf-banner cmrf-banner-bad"><span>&#9888;</span><span><b>Club en Dificultad Economica</b> (patrimonio neto ' + cmRfefEur(spn) + '). La RFEF exige un plan de ajuste para corregirlo.</span></div>'
        : '<div class="cmrf-banner cmrf-banner-ok"><span>&#10003;</span><span>El club no esta en Dificultad Economica. El plan no es obligatorio ahora, pero puedes prepararlo de forma preventiva.</span></div>';

    if (cmRfefState.editandoPlan) { c.innerHTML = top + cmRfefFormPlan(p); return; }

    if (!p) {
        c.innerHTML = top + '<div class="cmrf-empty"><div class="ic">&#128221;</div><h3 style="color:#e2e8f0">Sin plan de ajuste</h3><p>Aun no hay un plan para este ejercicio.</p>' +
            (puedeEditar ? '<div class="cmrf-actions" style="justify-content:center"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefEditarPlan()">Crear plan</button></div>' : '') + '</div>';
        return;
    }
    var rows = cmRfefPlanRow('Objetivo', p.objective) +
        (p.target_date ? cmRfefPlanRow('Fecha objetivo', cmRfefFechaCorta(p.target_date)) : '') +
        cmRfefPlanRow('Medidas', p.measures) +
        cmRfefPlanRow('Seguimiento', p.follow_up);
    var btn = puedeEditar ? '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefEditarPlan()">Editar plan</button></div>' : '';
    c.innerHTML = top +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="color:#f8fafc;margin:0">Plan de ajuste</h3>' + cmRfefBadgePlan(p.status) + '</div>' +
        '<div class="cmrf-detail">' + rows + '</div>' + btn;
}
function cmRfefFormPlan(p) {
    p = p || {};
    var opt = function (v, t) { return '<option value="' + v + '"' + ((p.status || 'borrador') === v ? ' selected' : '') + '>' + t + '</option>'; };
    return '<div class="cmrf-detail">' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Estado</label><select class="cmrf-input" id="cmrf-pl-estado">' +
            opt('borrador', 'Borrador') + opt('activo', 'Activo') + opt('cumplido', 'Cumplido') + opt('cerrado', 'Cerrado') + '</select></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Objetivo de mejora del patrimonio</label><textarea class="cmrf-input" id="cmrf-pl-obj" rows="2">' + cmRfefEsc(p.objective || '') + '</textarea></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Fecha objetivo</label><input type="date" class="cmrf-input" id="cmrf-pl-fecha" value="' + (p.target_date ? String(p.target_date).slice(0, 10) : '') + '"></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Medidas a adoptar</label><textarea class="cmrf-input" id="cmrf-pl-med" rows="4">' + cmRfefEsc(p.measures || '') + '</textarea></div>' +
        '<div class="cmrf-fg"><label class="cmrf-flabel">Seguimiento / avance</label><textarea class="cmrf-input" id="cmrf-pl-seg" rows="3">' + cmRfefEsc(p.follow_up || '') + '</textarea></div>' +
        '<div class="cmrf-actions"><button class="cmrf-btn cmrf-btn-primary" onclick="cmRfefGuardarPlan()">Guardar</button><button class="cmrf-btn" onclick="cmRfefCancelarPlan()">Cancelar</button></div>' +
    '</div>';
}
window.cmRfefEditarPlan = function () { cmRfefState.editandoPlan = true; cmRfefState.tab = 'plan'; cmRfefCambiarTab('plan'); };
window.cmRfefCancelarPlan = function () { cmRfefState.editandoPlan = false; cmRfefCambiarTab('plan'); };
window.cmRfefGuardarPlan = async function () {
    var get = function (x) { var el = document.getElementById(x); return el ? el.value : ''; };
    var payload = {
        club_id: clubId, fiscal_year_id: cmRfefState.ejercicio.id,
        status: get('cmrf-pl-estado') || 'borrador',
        objective: get('cmrf-pl-obj') || null,
        target_date: get('cmrf-pl-fecha') || null,
        measures: get('cmrf-pl-med') || null,
        follow_up: get('cmrf-pl-seg') || null,
        updated_by: (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null,
        updated_at: new Date().toISOString()
    };
    if (!cmRfefState.plan) payload.created_by = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
    try {
        var r = await supabaseClient.from('cm_rfef_adjustment_plan').upsert(payload, { onConflict: 'club_id,fiscal_year_id' }).select().single();
        if (r.error) throw r.error;
        cmRfefState.plan = r.data;
        cmRfefState.editandoPlan = false;
        cmRfefCambiarTab('plan');
        if (typeof showToast === 'function') showToast('Plan de ajuste guardado');
    } catch (e) { console.error('cmRfefGuardarPlan:', e); cmRfefToast('Error al guardar: ' + (e.message || e), 'error'); }
};

// recarga
window.cmRfefRecargar = function () {
    var cont = document.getElementById('modulo-cumplimiento_rfef');
    if (cont) cmRfefInit('modulo-cumplimiento_rfef');
};
window.cmRfefInit = cmRfefInit;
window.cmRfefCambiarTab = cmRfefCambiarTab;

window.cmRfefEditarCoste = function () { cmRfefState.editandoCoste = true; cmRfefState.tab = 'indicadores'; cmRfefCambiarTab('indicadores'); };
window.cmRfefCancelarCoste = function () { cmRfefState.editandoCoste = false; cmRfefCambiarTab('indicadores'); };

window.cmRfefTraerPresupuesto = async function () {
    try {
        var rc = await supabaseClient.from('cm_eco_categories').select('id').eq('club_id', clubId).eq('kind', 'ingreso').range(0, 9999);
        var ids = (rc.data || []).map(function (x) { return x.id; });
        if (!ids.length) { cmRfefToast('No hay categorias de ingreso con presupuesto', 'error'); return; }
        var rb = await supabaseClient.from('cm_eco_budget').select('amount_cents,category_id')
            .eq('club_id', clubId).eq('fiscal_year_id', cmRfefState.ejercicio.id).in('category_id', ids).range(0, 9999);
        var tot = (rb.data || []).reduce(function (s, x) { return s + (x.amount_cents || 0); }, 0);
        var el = document.getElementById('cmrf-ing');
        if (el) el.value = (tot / 100).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        if (typeof showToast === 'function') showToast('Ingresos traidos del presupuesto');
    } catch (e) { console.error('cmRfefTraerPresupuesto:', e); cmRfefToast('Error al traer el presupuesto', 'error'); }
};

window.cmRfefGuardarCoste = async function () {
    var coste = cmRfefEurToCents((document.getElementById('cmrf-coste') || {}).value);
    var ing = cmRfefEurToCents((document.getElementById('cmrf-ing') || {}).value);
    var limStr = String((document.getElementById('cmrf-lim') || {}).value || '70').replace(',', '.');
    var lim = parseFloat(limStr); if (isNaN(lim) || lim <= 0) lim = 70;
    var aplica = !!(document.getElementById('cmrf-aplica') || {}).checked;
    try {
        var r = await supabaseClient.from('cm_rfef_squad_cost').upsert({
            club_id: clubId, fiscal_year_id: cmRfefState.ejercicio.id,
            squad_cost_cents: coste, expected_income_cents: ing,
            ratio_limit_pct: lim, applies: aplica,
            updated_by: (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'club_id,fiscal_year_id' }).select().single();
        if (r.error) throw r.error;
        cmRfefState.squad = r.data;
        cmRfefState.editandoCoste = false;
        cmRfefCambiarTab('indicadores');
        if (typeof showToast === 'function') showToast('Coste de plantilla guardado');
    } catch (e) { console.error('cmRfefGuardarCoste:', e); cmRfefToast('Error al guardar: ' + (e.message || e), 'error'); }
};

// ========== AUTO-MONTAJE ==========
(function cmRfefAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function () {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('cumplimiento_rfef')) return;
        if (document.getElementById('cm-tab-cumplimiento_rfef')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;
        clearInterval(intervalo);
        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-cumplimiento_rfef';
        tab.setAttribute('onclick', "cambiarModulo('cumplimiento_rfef', this)");
        tab.innerHTML = '<span class="tab-icon">&#128737;</span><span>Control RFEF</span>';
        mainTabs.appendChild(tab);
        if (!document.getElementById('modulo-cumplimiento_rfef')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-cumplimiento_rfef';
            var ult = document.querySelector('.vista-modulo:last-of-type');
            if (ult && ult.parentElement) { ult.parentElement.insertBefore(vista, ult.nextSibling); }
            else { document.body.appendChild(vista); }
        }
        if (typeof registrarModulo === 'function') {
            registrarModulo('cumplimiento_rfef', function () { cmRfefInit('modulo-cumplimiento_rfef'); });
        }
        console.log('[Control RFEF] Auto-montado y registrado');
    }, 300);
})();

})();
