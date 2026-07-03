// ========== MODELO-JUEGO.JS - TopLiderCoach HUB ==========
// Capa 1: Arbol del modelo de juego (Momentos -> Principios -> Subprincipios -> Sub-subprincipios)

const MJ_MOMENTOS = [
    { key: 'ataque',       nombre: 'Ataque organizado',     icono: '⚔️', color: '#0F6E56', bg: '#E1F5EE' },
    { key: 'defensa',      nombre: 'Defensa organizada',    icono: '🛡️', color: '#A32D2D', bg: '#FCEBEB' },
    { key: 'trans_of_def', nombre: 'Transición of-def',     icono: '🔻', color: '#854F0B', bg: '#FAEEDA' },
    { key: 'trans_def_of', nombre: 'Transición def-of',     icono: '🔺', color: '#185FA5', bg: '#E6F1FB' }
];

const MJ_NIVELES = {
    principio: { label: 'Principio', siguiente: 'subprincipio' },
    subprincipio: { label: 'Subprincipio', siguiente: 'subsubprincipio' },
    subsubprincipio: { label: 'Sub-subprincipio', siguiente: null }
};

let mjClubId = null;
let mjConceptos = [];

(function() {
    if (document.getElementById('mj-styles')) return;
    const st = document.createElement('style');
    st.id = 'mj-styles';
    st.textContent = `
        .mj-cab { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:8px; }
        .mj-cab h2 { font-size:20px; color:#1f2937; margin:0; }
        .mj-info { font-size:13px; color:#6b7280; margin-bottom:16px; }
        .mj-momento { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:12px; }
        .mj-momento-cab { padding:12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; }
        .mj-momento-cab .titulo { font-weight:600; font-size:15px; }
        .mj-momento-cab .cuenta { font-size:12px; opacity:0.8; }
        .mj-momento-body { padding:8px 16px 14px; }
        .mj-principio { border-left:3px solid #cbd5e1; padding-left:12px; margin-bottom:14px; }
        .mj-fila { display:flex; justify-content:space-between; align-items:center; padding:5px 0; gap:8px; }
        .mj-fila .nombre { font-size:14px; color:#1f2937; flex:1; }
        .mj-fila .nivel-tag { font-size:10px; color:#9ca3af; letter-spacing:0.04em; }
        .mj-fila .acc { display:flex; gap:4px; opacity:0; transition:opacity 0.15s; }
        .mj-fila:hover .acc { opacity:1; }
        .mj-fila .acc button { background:none; border:none; cursor:pointer; font-size:13px; padding:2px 5px; border-radius:5px; }
        .mj-fila .acc button:hover { background:#f3f4f6; }
        .mj-sub { margin-left:18px; }
        .mj-subsub { margin-left:18px; }
        .mj-subsub .nombre { font-size:13px; color:#4b5563; }
        .mj-add { font-size:13px; color:#7c3aed; cursor:pointer; padding:4px 0; display:inline-block; }
        .mj-add:hover { text-decoration:underline; }
        .mj-vacio-momento { font-size:13px; color:#9ca3af; padding:6px 0; }
        .mj-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1200; padding:20px; }
        .mj-modal { background:#fff; border-radius:14px; padding:22px; max-width:460px; width:100%; }
        .mj-modal h3 { margin:0 0 4px; font-size:17px; color:#1f2937; }
        .mj-modal .ctx { font-size:13px; color:#6b7280; margin-bottom:14px; }
        .mj-modal label { display:block; font-size:13px; color:#374151; margin:10px 0 4px; }
        .mj-modal input, .mj-modal textarea { width:100%; padding:9px 11px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; font-family:inherit; }
        .mj-modal textarea { min-height:60px; resize:vertical; }
        .mj-modal-btns { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
        .mj-btn-cancel { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:9px 16px; font-size:14px; cursor:pointer; }
        .mj-btn-ok { background:#7c3aed; border:none; color:#fff; border-radius:8px; padding:9px 16px; font-size:14px; font-weight:600; cursor:pointer; }
    `;
    document.head.appendChild(st);
})();

registrarSubTab('planificador', 'modelo-juego', function() {
    cargarModeloJuego();
});

async function cargarModeloJuego() {
    const cont = document.getElementById('modelo-juego-contenido');
    if (!cont) return;
    cont.innerHTML = '<div class="mj-vacio-momento">Cargando modelo de juego...</div>';

    try {
        const { data: clubInfo } = await supabaseClient
            .from('clubs').select('id').eq('wp_user_id', usuario.id).single();
        if (!clubInfo) throw new Error('Club no encontrado');
        mjClubId = clubInfo.id;

        const { data, error } = await supabaseClient
            .from('modelo_conceptos')
            .select('*')
            .eq('club_id', mjClubId)
            .eq('archived', false)
            .order('orden');
        if (error) throw error;

        mjConceptos = data || [];
        mjRender();
    } catch (e) {
        console.error('Error cargando modelo de juego:', e);
        cont.innerHTML = '<div class="mj-vacio-momento">Error al cargar: ' + e.message + '</div>';
    }
}

function mjHijos(parentId, nivel) {
    return mjConceptos.filter(c => c.parent_id === parentId && c.nivel === nivel);
}

function mjPrincipios(momentoKey) {
    return mjConceptos.filter(c => c.momento === momentoKey && c.nivel === 'principio' && !c.parent_id);
}

function mjEscapar(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

function mjRender() {
    const cont = document.getElementById('modelo-juego-contenido');
    let html = `
        <div class="mj-cab"><h2>📋 Mi modelo de juego</h2></div>
        <div class="mj-info">Define tus principios, subprincipios y sub-subprincipios organizados por los 4 momentos del juego.</div>
    `;

    MJ_MOMENTOS.forEach(m => {
        const principios = mjPrincipios(m.key);
        html += `
            <div class="mj-momento">
                <div class="mj-momento-cab" style="background:${m.bg};">
                    <span class="titulo" style="color:${m.color};">${m.icono} ${m.nombre}</span>
                    <span class="cuenta" style="color:${m.color};">${principios.length} principio${principios.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="mj-momento-body">
        `;

        if (principios.length === 0) {
            html += '<div class="mj-vacio-momento">Aún no hay principios en este momento.</div>';
        }

        principios.forEach(p => {
            html += `
                <div class="mj-principio">
                    <div class="mj-fila">
                        <span class="nombre"><strong>${mjEscapar(p.nombre)}</strong></span>
                        <span class="nivel-tag">PRINCIPIO</span>
                        <span class="acc">
                            <button onclick="mjAbrirModal('subprincipio','${p.id}','${m.key}')" title="Añadir subprincipio">➕</button>
                            <button onclick="mjEditar('${p.id}')" title="Editar">✏️</button>
                            <button onclick="mjBorrar('${p.id}')" title="Borrar">🗑️</button>
                        </span>
                    </div>
            `;
            const subs = mjHijos(p.id, 'subprincipio');
            subs.forEach(s => {
                html += `
                    <div class="mj-sub">
                        <div class="mj-fila">
                            <span class="nombre">— ${mjEscapar(s.nombre)}</span>
                            <span class="nivel-tag">SUBPRINCIPIO</span>
                            <span class="acc">
                                <button onclick="mjAbrirModal('subsubprincipio','${s.id}','${m.key}')" title="Añadir sub-subprincipio">➕</button>
                                <button onclick="mjEditar('${s.id}')" title="Editar">✏️</button>
                                <button onclick="mjBorrar('${s.id}')" title="Borrar">🗑️</button>
                            </span>
                        </div>
                `;
                const subsubs = mjHijos(s.id, 'subsubprincipio');
                subsubs.forEach(ss => {
                    html += `
                        <div class="mj-subsub">
                            <div class="mj-fila">
                                <span class="nombre">· ${mjEscapar(ss.nombre)}</span>
                                <span class="nivel-tag">SUB-SUB</span>
                                <span class="acc">
                                    <button onclick="mjEditar('${ss.id}')" title="Editar">✏️</button>
                                    <button onclick="mjBorrar('${ss.id}')" title="Borrar">🗑️</button>
                                </span>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            });
            html += '</div>';
        });

        html += `
                    <span class="mj-add" onclick="mjAbrirModal('principio',null,'${m.key}')">➕ Añadir principio</span>
                </div>
            </div>
        `;
    });

    cont.innerHTML = html;
}

function mjAbrirModal(nivel, parentId, momentoKey, conceptoExistente) {
    const esEdicion = !!conceptoExistente;
    const nivelLabel = MJ_NIVELES[nivel] ? MJ_NIVELES[nivel].label : nivel;
    let ctx = '';
    if (parentId) {
        const padre = mjConceptos.find(c => c.id === parentId);
        if (padre) ctx = 'Dentro de: ' + padre.nombre;
    } else {
        const m = MJ_MOMENTOS.find(x => x.key === momentoKey);
        if (m) ctx = m.nombre;
    }

    const nombreVal = esEdicion ? mjEscapar(conceptoExistente.nombre) : '';
    const descVal = esEdicion ? mjEscapar(conceptoExistente.descripcion || '') : '';

    const ov = document.createElement('div');
    ov.className = 'mj-modal-ov';
    ov.id = 'mj-modal-ov';
    ov.innerHTML = `
        <div class="mj-modal">
            <h3>${esEdicion ? 'Editar' : 'Nuevo'} ${nivelLabel.toLowerCase()}</h3>
            <div class="ctx">${ctx}</div>
            <label>Nombre</label>
            <input type="text" id="mj-input-nombre" placeholder="Ej: Salida de balón" value="${nombreVal}">
            <label>Descripción (opcional)</label>
            <textarea id="mj-input-desc" placeholder="Notas sobre este concepto...">${descVal}</textarea>
            <div class="mj-modal-btns">
                <button class="mj-btn-cancel" onclick="mjCerrarModal()">Cancelar</button>
                <button class="mj-btn-ok" onclick="mjGuardar('${nivel}','${parentId || ''}','${momentoKey}','${esEdicion ? conceptoExistente.id : ''}')">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(ov);
    document.getElementById('mj-input-nombre').focus();
}

function mjCerrarModal() {
    const ov = document.getElementById('mj-modal-ov');
    if (ov) ov.remove();
}

function mjEditar(id) {
    const c = mjConceptos.find(x => x.id === id);
    if (c) mjAbrirModal(c.nivel, c.parent_id, c.momento, c);
}

async function mjGuardar(nivel, parentId, momentoKey, idEdicion) {
    const nombre = document.getElementById('mj-input-nombre').value.trim();
    const desc = document.getElementById('mj-input-desc').value.trim();
    if (!nombre) {
        showToast('Pon un nombre al concepto');
        return;
    }

    try {
        if (idEdicion) {
            const { error } = await supabaseClient
                .from('modelo_conceptos')
                .update({ nombre: nombre, descripcion: desc || null })
                .eq('id', idEdicion);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('modelo_conceptos')
                .insert({
                    club_id: mjClubId,
                    momento: momentoKey,
                    nivel: nivel,
                    nombre: nombre,
                    descripcion: desc || null,
                    parent_id: parentId || null,
                    orden: mjConceptos.length
                });
            if (error) throw error;
        }
        mjCerrarModal();
        showToast('Guardado');
        cargarModeloJuego();
    } catch (e) {
        console.error('Error guardando concepto:', e);
        showToast('Error al guardar: ' + e.message);
    }
}

async function mjBorrar(id) {
    const c = mjConceptos.find(x => x.id === id);
    if (!c) return;
    const hijos = mjConceptos.filter(x => x.parent_id === id);
    let msg = '¿Borrar "' + c.nombre + '"?';
    if (hijos.length > 0) {
        msg += '\n\nSe borrarán también sus ' + hijos.length + ' concepto(s) hijo(s).';
    }
    if (!confirm(msg)) return;

    try {
        const { error } = await supabaseClient
            .from('modelo_conceptos')
            .update({ archived: true })
            .eq('id', id);
        if (error) throw error;
        showToast('Borrado');
        cargarModeloJuego();
    } catch (e) {
        console.error('Error borrando concepto:', e);
        showToast('Error al borrar: ' + e.message);
    }
}
