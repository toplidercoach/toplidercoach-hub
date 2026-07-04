// ========== SESION-CONCEPTOS.JS - TopLiderCoach HUB ==========
// Capa 2: vincular conceptos del modelo de juego a las sesiones del planificador

const SC_MOMENTOS = {
    ataque:       { nombre: 'Ataque organizado', icono: '⚔️', color: '#0F6E56' },
    defensa:      { nombre: 'Defensa organizada', icono: '🛡️', color: '#A32D2D' },
    trans_of_def: { nombre: 'Transición of-def', icono: '🔻', color: '#854F0B' },
    trans_def_of: { nombre: 'Transición def-of', icono: '🔺', color: '#185FA5' }
};

const SC_NIVELES_TRABAJO = ['Individual', 'Sectorial', 'Completo'];

let scConceptosModelo = [];      // biblioteca completa del club
let scConceptosSesion = [];      // los añadidos a la sesión actual (en memoria)

(function() {
    if (document.getElementById('sc-styles')) return;
    const st = document.createElement('style');
    st.id = 'sc-styles';
    st.textContent = `
        .sc-bloque { margin-top:8px; }
        .sc-fase-row { display:flex; gap:10px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
        .sc-fase-row label { font-size:13px; color:#374151; font-weight:600; }
        .sc-fase-btn { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:6px 14px; font-size:13px; cursor:pointer; }
        .sc-fase-btn.activa { background:#7c3aed; color:#fff; border-color:#7c3aed; }
        .sc-lista { display:flex; flex-direction:column; gap:8px; margin-bottom:10px; }
        .sc-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .sc-item-info { flex:1; min-width:150px; }
        .sc-item-nombre { font-size:14px; color:#1f2937; font-weight:600; }
        .sc-item-momento { font-size:11px; color:#6b7280; }
        .sc-item-nivel { display:flex; gap:4px; }
        .sc-nivel-btn { background:#fff; border:1px solid #d1d5db; color:#6b7280; border-radius:6px; padding:4px 9px; font-size:12px; cursor:pointer; }
        .sc-nivel-btn.activo { background:#0F6E56; color:#fff; border-color:#0F6E56; }
        .sc-item-quitar { background:none; border:none; color:#dc2626; cursor:pointer; font-size:15px; padding:2px 6px; }
        .sc-add-btn { background:#ede9fe; border:1px dashed #7c3aed; color:#7c3aed; border-radius:8px; padding:9px 14px; font-size:14px; cursor:pointer; font-weight:600; }
        .sc-vacio { font-size:13px; color:#9ca3af; padding:6px 0; }
        .sc-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1300; padding:20px; }
        .sc-modal { background:#fff; border-radius:14px; padding:20px; max-width:520px; width:100%; max-height:80vh; overflow-y:auto; }
        .sc-modal h3 { margin:0 0 14px; font-size:17px; color:#1f2937; }
        .sc-mom-grupo { margin-bottom:14px; }
        .sc-mom-titulo { font-size:13px; font-weight:700; margin-bottom:6px; }
        .sc-opcion { padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:5px; cursor:pointer; font-size:14px; color:#1f2937; }
        .sc-opcion:hover { background:#f3f4f6; }
        .sc-opcion.ya-anadido { opacity:0.4; cursor:not-allowed; }
        .sc-opcion .sub { font-size:12px; color:#9ca3af; }
        .sc-modal-cerrar { width:100%; margin-top:10px; padding:11px; background:#f3f4f6; border:1px solid #d1d5db; border-radius:8px; font-size:14px; cursor:pointer; }
        .sc-modal-vacio { text-align:center; color:#9ca3af; padding:20px; font-size:14px; }
    `;
    document.head.appendChild(st);
})();

// Carga la biblioteca del modelo de juego del club
async function scCargarModelo() {
    try {
        if (typeof clubId === 'undefined' || !clubId) return;
        const { data, error } = await supabaseClient
            .from('modelo_conceptos')
            .select('*')
            .eq('club_id', clubId)
            .eq('archived', false)
            .order('orden');
        if (error) throw error;
        scConceptosModelo = data || [];
    } catch (e) {
        console.error('Error cargando modelo para sesión:', e);
        scConceptosModelo = [];
    }
}

// Reinicia el bloque de conceptos (al crear sesión nueva)
function scReset() {
    scConceptosSesion = [];
    scSetFase(null);
    scRenderLista();
}

function scSetFase(fase) {
    window._scFase = fase;
    document.querySelectorAll('.sc-fase-btn').forEach(b => {
        b.classList.toggle('activa', b.dataset.fase === fase);
    });
}

function scRenderLista() {
    const cont = document.getElementById('sc-lista-conceptos');
    if (!cont) return;
    if (scConceptosSesion.length === 0) {
        cont.innerHTML = '<div class="sc-vacio">Aún no has añadido conceptos a esta sesión.</div>';
        return;
    }
    let html = '';
    scConceptosSesion.forEach((c, idx) => {
        const mom = SC_MOMENTOS[c.momento] || { nombre: '', icono: '', color: '#666' };
        let botonesNivel = '';
        SC_NIVELES_TRABAJO.forEach(n => {
            botonesNivel += `<button type="button" class="sc-nivel-btn ${c.nivel_trabajo === n ? 'activo' : ''}" onclick="scSetNivel(${idx},'${n}')">${n}</button>`;
        });
        html += `
            <div class="sc-item">
                <div class="sc-item-info">
                    <div class="sc-item-nombre">${scEscapar(c.cadena || c.nombre)}</div>
                    <div class="sc-item-momento">${mom.icono} ${mom.nombre}</div>
                </div>
                <div class="sc-item-nivel">${botonesNivel}</div>
                <button type="button" class="sc-item-quitar" onclick="scQuitar(${idx})" title="Quitar">✕</button>
            </div>
        `;
    });
    cont.innerHTML = html;
}

function scEscapar(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

// Construye la cadena completa: "Salida de balón › En corto lateralizada"
function scCadenaConcepto(conceptoId) {
    const partes = [];
    let actual = scConceptosModelo.find(c => c.id === conceptoId);
    let guardia = 0;
    while (actual && guardia < 10) {
        partes.unshift(actual.nombre);
        actual = actual.parent_id ? scConceptosModelo.find(c => c.id === actual.parent_id) : null;
        guardia++;
    }
    return partes.join(' › ');
}

function scSetNivel(idx, nivel) {
    if (scConceptosSesion[idx]) {
        scConceptosSesion[idx].nivel_trabajo = nivel;
        scRenderLista();
    }
}

function scQuitar(idx) {
    scConceptosSesion.splice(idx, 1);
    scRenderLista();
}

// Abre el selector para elegir un concepto de la biblioteca
async function scAbrirSelector() {
    // Asegurar que el modelo está cargado (por si no se cargó antes)
    if (scConceptosModelo.length === 0) {
        await scCargarModelo();
    }
    if (scConceptosModelo.length === 0) {
        alert('Aún no has creado tu modelo de juego. Ve a Planificador → Modelo de juego para definir tus principios primero.');
        return;
    }

    const yaAnadidos = scConceptosSesion.map(c => c.concepto_id);

    let html = '<div class="sc-modal-ov" id="sc-modal-ov"><div class="sc-modal"><h3>Elige un concepto</h3>';
    let hayAlguno = false;

    Object.keys(SC_MOMENTOS).forEach(momKey => {
        const mom = SC_MOMENTOS[momKey];
        const conceptosMom = scConceptosModelo.filter(c => c.momento === momKey);
        if (conceptosMom.length === 0) return;
        hayAlguno = true;
        html += `<div class="sc-mom-grupo"><div class="sc-mom-titulo" style="color:${mom.color};">${mom.icono} ${mom.nombre}</div>`;
        conceptosMom.forEach(c => {
            const ya = yaAnadidos.includes(c.id);
            const nivelLabel = c.nivel === 'principio' ? '' : (c.nivel === 'subprincipio' ? '— ' : '· ');
            html += `
                <div class="sc-opcion ${ya ? 'ya-anadido' : ''}" ${ya ? '' : `onclick="scElegir('${c.id}')"`}>
                    ${nivelLabel}${scEscapar(c.nombre)}
                    <span class="sub"> (${c.nivel})</span>
                </div>
            `;
        });
        html += '</div>';
    });

    if (!hayAlguno) {
        html += '<div class="sc-modal-vacio">No hay conceptos en tu modelo de juego todavía.</div>';
    }

    html += '<button type="button" class="sc-modal-cerrar" onclick="scCerrarSelector()">Cerrar</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function scCerrarSelector() {
    const ov = document.getElementById('sc-modal-ov');
    if (ov) ov.remove();
}

function scElegir(conceptoId) {
    const c = scConceptosModelo.find(x => x.id === conceptoId);
    if (!c) return;
    scConceptosSesion.push({
        concepto_id: c.id,
        nombre: c.nombre,
        cadena: scCadenaConcepto(c.id),
        momento: c.momento,
        nivel: c.nivel,
        nivel_trabajo: 'Completo'  // por defecto
    });
    scCerrarSelector();
    scRenderLista();
}

// Guarda los conceptos vinculados a una sesión (llamado desde guardarSesion)
async function scGuardarConceptos(sesionId, esEdicion) {
    if (!sesionId) return;
    try {
        // Si es edición, borrar los vínculos anteriores y reinsertar
        if (esEdicion) {
            await supabaseClient.from('sesion_conceptos').delete().eq('sesion_id', sesionId);
        }
        if (scConceptosSesion.length === 0) return;
        const registros = scConceptosSesion.map(c => ({
            sesion_id: sesionId,
            concepto_id: c.concepto_id,
            nivel_trabajo: c.nivel_trabajo || null
        }));
        const { error } = await supabaseClient.from('sesion_conceptos').insert(registros);
        if (error) throw error;
    } catch (e) {
        console.error('Error guardando conceptos de la sesión:', e);
    }
}

// Carga los conceptos de una sesión al editarla
async function scCargarConceptosDeSesion(sesionId) {
    scConceptosSesion = [];
    try {
        const { data, error } = await supabaseClient
            .from('sesion_conceptos')
            .select('concepto_id, nivel_trabajo, modelo_conceptos(nombre, momento, nivel)')
            .eq('sesion_id', sesionId);
        if (error) throw error;
        (data || []).forEach(row => {
            const mc = row.modelo_conceptos;
            if (mc) {
                scConceptosSesion.push({
                    concepto_id: row.concepto_id,
                    nombre: mc.nombre,
                    cadena: scCadenaConcepto(row.concepto_id) || mc.nombre,
                    momento: mc.momento,
                    nivel: mc.nivel,
                    nivel_trabajo: row.nivel_trabajo || 'Completo'
                });
            }
        });
    } catch (e) {
        console.error('Error cargando conceptos de la sesión:', e);
    }
    scRenderLista();
}
