// ============================================================
// CM-FISIO-EXTRAS.JS · Edicion, archivado e informe PDF
// TopLiderCoach HUB · Club Mode
// ============================================================
// Carga DESPUES de cm-fisio.js
// Anade: editar/archivar tratamientos y sesiones,
// informe diario completo en PDF (jsPDF)
// ============================================================


// ========== CONFIRMACION DE ARCHIVADO (GENERICA) ==========
function cmFisioConfirmarAccion(mensaje, callback) {
    var overlay = document.createElement('div');
    overlay.id = 'cmfisio-confirm-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9800;display:flex;justify-content:center;align-items:center';
    overlay.innerHTML =
        '<div style="background:#0f172a;border:1px solid #ef4444;border-radius:12px;padding:24px;max-width:400px;text-align:center">' +
            '<div style="font-size:36px;margin-bottom:12px">!!</div>' +
            '<p style="color:#e2e8f0;font-size:15px;margin:0 0 8px">' + mensaje + '</p>' +
            '<p style="color:#94a3b8;font-size:13px;margin:0 0 20px">Esta accion no se puede deshacer.</p>' +
            '<div style="display:flex;gap:10px;justify-content:center">' +
                '<button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-confirm-overlay\').remove()">Cancelar</button>' +
                '<button class="cmfisio-btn cmfisio-btn-danger" id="cmfisio-confirm-btn">Eliminar</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    document.getElementById('cmfisio-confirm-btn').onclick = function() {
        overlay.remove();
        callback();
    };
}


// ========== ARCHIVAR TRATAMIENTO ==========
function cmFisioArchivarTratamiento(treatmentId) {
    cmFisioConfirmarAccion('Vas a eliminar este plan de tratamiento y todas sus sesiones asociadas quedaran sin vinculo.', async function() {
        var res = await supabaseClient.from('cm_fisio_treatments').update({
            archived: true, archived_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).eq('id', treatmentId);
        if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
        showToast('Tratamiento eliminado');
        cmFisioCargarTratamientos(cmFisioJugadorActual);
    });
}


// ========== EDITAR TRATAMIENTO ==========
async function cmFisioEditarTratamiento(treatmentId) {
    var res = await supabaseClient.from('cm_fisio_treatments').select('*').eq('id', treatmentId).single();
    if (res.error || !res.data) { showToast('Error cargando tratamiento', 'error'); return; }
    var t = res.data;

    var techCheckboxes = '';
    var cats = {};
    cmFisioTecnicasCatalog.forEach(function(tc) {
        if (!cats[tc.category]) cats[tc.category] = [];
        cats[tc.category].push(tc);
    });
    var planned = t.techniques_planned || [];
    Object.keys(cats).forEach(function(cat) {
        techCheckboxes += '<div style="margin-bottom:8px"><div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:4px">' + cat + '</div><div class="cmfisio-tech-grid">';
        cats[cat].forEach(function(tc) {
            var checked = planned.indexOf(tc.code) !== -1 ? ' checked' : '';
            techCheckboxes += '<label class="cmfisio-tech-check"><input type="checkbox" value="' + tc.code + '"' + checked + '> ' + tc.name_es + '</label>';
        });
        techCheckboxes += '</div></div>';
    });

    var container = document.getElementById('cmfisio-form-treatment-container');
    container.innerHTML =
        '<div style="background:#0f172a;border:1px solid #f59e0b;border-radius:10px;padding:16px;margin-bottom:14px">' +
        '<h4 style="margin:0 0 12px;color:#f59e0b;font-size:14px">Editar tratamiento</h4>' +
        '<input type="hidden" id="cmfisio-treat-edit-id" value="' + t.id + '">' +
        '<div class="cmfisio-form-group"><label>Titulo *</label><input type="text" id="cmfisio-treat-title" value="' + (t.title || '').replace(/"/g, '&quot;') + '"></div>' +
        '<div class="cmfisio-form-group"><label>Objetivo</label><textarea id="cmfisio-treat-objective">' + (t.objective || '') + '</textarea></div>' +
        '<div class="cmfisio-form-row">' +
            '<div class="cmfisio-form-group"><label>Fecha inicio *</label><input type="date" id="cmfisio-treat-start" value="' + (t.start_date || '') + '"></div>' +
            '<div class="cmfisio-form-group"><label>Frecuencia (sesiones/semana)</label><input type="number" id="cmfisio-treat-freq" min="1" max="7" value="' + (t.frequency_per_week || '') + '"></div>' +
        '</div>' +
        '<div class="cmfisio-form-row">' +
            '<div class="cmfisio-form-group"><label>Fecha fin estimada</label><input type="date" id="cmfisio-treat-end-est" value="' + (t.estimated_end_date || '') + '"></div>' +
            '<div class="cmfisio-form-group"><label>Estado</label><select id="cmfisio-treat-status"><option value="active"' + (t.status === 'active' ? ' selected' : '') + '>Activo</option><option value="paused"' + (t.status === 'paused' ? ' selected' : '') + '>Pausado</option><option value="completed"' + (t.status === 'completed' ? ' selected' : '') + '>Completado</option><option value="cancelled"' + (t.status === 'cancelled' ? ' selected' : '') + '>Cancelado</option></select></div>' +
        '</div>' +
        '<div class="cmfisio-form-group"><label>Tecnicas planificadas</label>' + techCheckboxes + '</div>' +
        '<div class="cmfisio-form-group"><label>Notas</label><textarea id="cmfisio-treat-notes">' + (t.notes || '') + '</textarea></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-form-treatment-container\').innerHTML=\'\'">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioActualizarTratamiento()">Guardar cambios</button></div></div>';

    // Scroll al formulario
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function cmFisioActualizarTratamiento() {
    var treatId = document.getElementById('cmfisio-treat-edit-id').value;
    var titulo = document.getElementById('cmfisio-treat-title').value.trim();
    var fechaInicio = document.getElementById('cmfisio-treat-start').value;
    if (!titulo) { showToast('El titulo es obligatorio', 'error'); return; }
    if (!fechaInicio) { showToast('La fecha de inicio es obligatoria', 'error'); return; }

    var tecnicas = [];
    document.querySelectorAll('#cmfisio-form-treatment-container .cmfisio-tech-check input:checked').forEach(function(cb) { tecnicas.push(cb.value); });

    var nuevoEstado = document.getElementById('cmfisio-treat-status').value;
    var updateData = {
        title: titulo,
        objective: document.getElementById('cmfisio-treat-objective').value.trim() || null,
        start_date: fechaInicio,
        estimated_end_date: document.getElementById('cmfisio-treat-end-est').value || null,
        frequency_per_week: parseInt(document.getElementById('cmfisio-treat-freq').value) || null,
        techniques_planned: tecnicas.length > 0 ? tecnicas : null,
        notes: document.getElementById('cmfisio-treat-notes').value.trim() || null,
        status: nuevoEstado,
        updated_at: new Date().toISOString()
    };
    if (nuevoEstado === 'completed' && !updateData.actual_end_date) {
        updateData.actual_end_date = new Date().toISOString().split('T')[0];
    }

    var res = await supabaseClient.from('cm_fisio_treatments').update(updateData).eq('id', treatId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Tratamiento actualizado');
    cmFisioCargarTratamientos(cmFisioJugadorActual);
}


// ========== ARCHIVAR SESION ==========
function cmFisioArchivarSesion(sessionId) {
    cmFisioConfirmarAccion('Vas a eliminar esta sesion de fisioterapia.', async function() {
        var res = await supabaseClient.from('cm_fisio_sessions').update({
            archived: true, archived_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }).eq('id', sessionId);
        if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
        showToast('Sesion eliminada');
        cmFisioCargarSesiones(cmFisioJugadorActual);
    });
}


// ========== EDITAR SESION ==========
async function cmFisioEditarSesion(sessionId) {
    var res = await supabaseClient.from('cm_fisio_sessions').select('*').eq('id', sessionId).single();
    if (res.error || !res.data) { showToast('Error cargando sesion', 'error'); return; }
    var s = res.data;

    // Cargar tratamientos activos para el selector
    var treatRes = await supabaseClient.from('cm_fisio_treatments').select('id, title').eq('club_id', clubId).eq('player_id', cmFisioJugadorActual).eq('archived', false);
    var treatments = treatRes.data || [];
    var treatOpts = '<option value="">Sin tratamiento asociado</option>';
    treatments.forEach(function(t) {
        var sel = s.treatment_id === t.id ? ' selected' : '';
        treatOpts += '<option value="' + t.id + '"' + sel + '>' + t.title + '</option>';
    });

    // Checkboxes tecnicas
    var applied = s.techniques_applied || [];
    var techChecks = '';
    var cats = {};
    cmFisioTecnicasCatalog.forEach(function(t) {
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
    });
    Object.keys(cats).forEach(function(cat) {
        techChecks += '<div style="margin-bottom:6px"><div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:3px">' + cat + '</div><div class="cmfisio-tech-grid">';
        cats[cat].forEach(function(t) {
            var checked = applied.indexOf(t.code) !== -1 ? ' checked' : '';
            techChecks += '<label class="cmfisio-tech-check"><input type="checkbox" value="' + t.code + '"' + checked + '> ' + t.name_es + '</label>';
        });
        techChecks += '</div></div>';
    });

    // Mostrar formulario en lugar de la lista
    var formContainer = document.getElementById('cmfisio-form-session');
    formContainer.style.display = 'block';
    formContainer.style.borderColor = '#f59e0b';
    formContainer.innerHTML =
        '<h4 style="margin:0 0 12px;color:#f59e0b;font-size:14px">Editar sesion</h4>' +
        '<input type="hidden" id="cmfisio-ses-edit-id" value="' + s.id + '">' +
        '<div class="cmfisio-form-row-3">' +
            '<div class="cmfisio-form-group"><label>Fecha *</label><input type="date" id="cmfisio-ses-date" value="' + (s.session_date || '') + '"></div>' +
            '<div class="cmfisio-form-group"><label>Hora inicio</label><input type="time" id="cmfisio-ses-start" value="' + (s.time_start || '').substring(0, 5) + '"></div>' +
            '<div class="cmfisio-form-group"><label>Hora fin</label><input type="time" id="cmfisio-ses-end" value="' + (s.time_end || '').substring(0, 5) + '"></div>' +
        '</div>' +
        '<div class="cmfisio-form-group"><label>Tratamiento asociado</label><select id="cmfisio-ses-treatment">' + treatOpts + '</select></div>' +
        '<div class="cmfisio-form-row">' +
            '<div class="cmfisio-form-group"><label>S - Subjetivo</label><textarea id="cmfisio-ses-subj">' + (s.soap_subjective || '') + '</textarea></div>' +
            '<div class="cmfisio-form-group"><label>Nivel de dolor (0-10)</label><input type="range" id="cmfisio-ses-pain" min="0" max="10" value="' + (s.pain_level || 0) + '" oninput="document.getElementById(\'cmfisio-pain-val\').textContent=this.value" style="width:100%"><div style="text-align:center;color:#14b8a6;font-weight:700;font-size:18px" id="cmfisio-pain-val">' + (s.pain_level || 0) + '</div></div>' +
        '</div>' +
        '<div class="cmfisio-form-group"><label>O - Objetivo</label><textarea id="cmfisio-ses-obj">' + (s.soap_objective || '') + '</textarea></div>' +
        '<div class="cmfisio-form-group"><label>A - Tecnicas aplicadas</label>' + techChecks + '</div>' +
        '<div class="cmfisio-form-group"><label>Detalle de la actuacion</label><textarea id="cmfisio-ses-action">' + (s.soap_action || '') + '</textarea></div>' +
        '<div class="cmfisio-form-group"><label>P - Plan</label><textarea id="cmfisio-ses-plan">' + (s.soap_plan || '') + '</textarea></div>' +
        '<div class="cmfisio-form-row">' +
            '<div class="cmfisio-form-group"><label>Recomendacion para el entrenador</label><select id="cmfisio-ses-rec"><option value="">-- Sin recomendacion --</option><option value="apto"' + (s.coach_recommendation === 'apto' ? ' selected' : '') + '>Apto</option><option value="limitado"' + (s.coach_recommendation === 'limitado' ? ' selected' : '') + '>Limitado</option><option value="no_disponible"' + (s.coach_recommendation === 'no_disponible' ? ' selected' : '') + '>No disponible</option></select></div>' +
            '<div class="cmfisio-form-group"><label>Nota para el entrenador</label><input type="text" id="cmfisio-ses-coach-note" value="' + (s.coach_note || '').replace(/"/g, '&quot;') + '"></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="cmFisioCargarSesiones(cmFisioJugadorActual)">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioActualizarSesion()">Guardar cambios</button></div>';

    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function cmFisioActualizarSesion() {
    var sesId = document.getElementById('cmfisio-ses-edit-id').value;
    var fecha = document.getElementById('cmfisio-ses-date').value;
    if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }

    var tecnicas = [];
    document.querySelectorAll('#cmfisio-form-session .cmfisio-tech-check input:checked').forEach(function(cb) { tecnicas.push(cb.value); });

    var updateData = {
        session_date: fecha,
        time_start: document.getElementById('cmfisio-ses-start').value || null,
        time_end: document.getElementById('cmfisio-ses-end').value || null,
        treatment_id: document.getElementById('cmfisio-ses-treatment').value || null,
        soap_subjective: document.getElementById('cmfisio-ses-subj').value.trim() || null,
        pain_level: parseInt(document.getElementById('cmfisio-ses-pain').value),
        soap_objective: document.getElementById('cmfisio-ses-obj').value.trim() || null,
        soap_action: document.getElementById('cmfisio-ses-action').value.trim() || null,
        techniques_applied: tecnicas.length > 0 ? tecnicas : null,
        soap_plan: document.getElementById('cmfisio-ses-plan').value.trim() || null,
        coach_recommendation: document.getElementById('cmfisio-ses-rec').value || null,
        coach_note: document.getElementById('cmfisio-ses-coach-note').value.trim() || null,
        updated_at: new Date().toISOString()
    };

    var res = await supabaseClient.from('cm_fisio_sessions').update(updateData).eq('id', sesId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Sesion actualizada');
    cmFisioCargarSesiones(cmFisioJugadorActual);
}


// ========== OVERRIDE: TRATAMIENTOS CON BOTONES EDITAR/ELIMINAR ==========
// Sobreescribe la funcion original para anadir botones
var _cmFisioCargarTratamientos_original = cmFisioCargarTratamientos;
cmFisioCargarTratamientos = async function(playerId) {
    var container = document.getElementById('cmfisio-tab-tratamientos');
    var res = await supabaseClient.from('cm_fisio_treatments').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('created_at', { ascending: false });
    var treatments = res.data || [];

    var statusLabels = { active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado' };
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Planes de tratamiento</h4><button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" onclick="cmFisioMostrarFormTratamiento()">+ Nuevo tratamiento</button></div>';
    html += '<div id="cmfisio-form-treatment-container"></div>';

    if (treatments.length === 0) {
        html += '<div class="cmfisio-empty"><div class="icon">--</div><p>Sin tratamientos. Crea uno para empezar a registrar sesiones.</p></div>';
    } else {
        treatments.forEach(function(t) {
            var fechaInicio = new Date(t.start_date + 'T12:00:00').toLocaleDateString('es-ES');
            html += '<div class="cmfisio-treatment-card ' + t.status + '">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div style="flex:1"><div style="color:#e2e8f0;font-weight:600;font-size:14px">' + t.title + '</div>' +
                    '<div style="color:#94a3b8;font-size:12px;margin-top:4px">Desde ' + fechaInicio + (t.frequency_per_week ? ' | ' + t.frequency_per_week + 'x/semana' : '') + '</div>' +
                    (t.objective ? '<div style="color:#94a3b8;font-size:12px;margin-top:2px">Objetivo: ' + t.objective + '</div>' : '') +
                    ((t.techniques_planned && t.techniques_planned.length > 0) ? '<div style="margin-top:6px">' + t.techniques_planned.map(function(tc) { return '<span class="cmfisio-technique-tag">' + tc + '</span>'; }).join('') + '</div>' : '') +
                    '</div>' +
                    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
                        '<span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#1e293b;color:#94a3b8">' + (statusLabels[t.status] || t.status) + '</span>' +
                        '<div style="display:flex;gap:4px">' +
                            '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="event.stopPropagation();cmFisioEditarTratamiento(\'' + t.id + '\')" title="Editar">Editar</button>' +
                            '<button class="cmfisio-btn cmfisio-btn-danger cmfisio-btn-sm" onclick="event.stopPropagation();cmFisioArchivarTratamiento(\'' + t.id + '\')" title="Eliminar">X</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
    }

    container.innerHTML = html;
};


// ========== OVERRIDE: SESIONES CON BOTONES EDITAR/ELIMINAR ==========
var _cmFisioCargarSesiones_original = cmFisioCargarSesiones;
cmFisioCargarSesiones = async function(playerId) {
    var container = document.getElementById('cmfisio-tab-sesiones');

    var treatRes = await supabaseClient.from('cm_fisio_treatments').select('id, title').eq('club_id', clubId).eq('player_id', playerId).eq('status', 'active').eq('archived', false);
    var treatments = treatRes.data || [];

    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('session_date', { ascending: false }).order('time_start', { ascending: false }).limit(30);
    var sessions = sesRes.data || [];

    var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
    var sessionHtml = '';
    if (sessions.length === 0) {
        sessionHtml = '<div class="cmfisio-empty"><div class="icon">--</div><p>Sin sesiones registradas</p></div>';
    } else {
        sessions.forEach(function(s) {
            var fecha = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
            var hora = '';
            if (s.time_start) hora = ' | ' + s.time_start.substring(0, 5);
            if (s.time_end) hora += '-' + s.time_end.substring(0, 5);
            var techs = (s.techniques_applied || []).map(function(tc) { return '<span class="cmfisio-technique-tag">' + tc + '</span>'; }).join('');
            var rec = s.coach_recommendation ? '<span class="cmfisio-recommendation ' + s.coach_recommendation + '">' + (recLabels[s.coach_recommendation] || s.coach_recommendation) + '</span>' : '';

            sessionHtml += '<div class="cmfisio-session-card">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div class="cmfisio-session-date">' + fecha + hora + (s.pain_level !== null && s.pain_level !== undefined ? ' | Dolor: ' + s.pain_level + '/10' : '') + ' ' + rec + '</div>' +
                    '<div style="display:flex;gap:4px">' +
                        '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="cmFisioEditarSesion(\'' + s.id + '\')" title="Editar">Editar</button>' +
                        '<button class="cmfisio-btn cmfisio-btn-danger cmfisio-btn-sm" onclick="cmFisioArchivarSesion(\'' + s.id + '\')" title="Eliminar">X</button>' +
                    '</div>' +
                '</div>' +
                (s.soap_subjective ? '<div class="cmfisio-soap-section"><strong>S - Subjetivo</strong><p>' + s.soap_subjective + '</p></div>' : '') +
                (s.soap_objective ? '<div class="cmfisio-soap-section"><strong>O - Objetivo</strong><p>' + s.soap_objective + '</p></div>' : '') +
                (techs ? '<div class="cmfisio-soap-section"><strong>A - Tecnicas aplicadas</strong><div style="margin-top:4px">' + techs + '</div>' + (s.soap_action ? '<p>' + s.soap_action + '</p>' : '') + '</div>' : '') +
                (s.soap_plan ? '<div class="cmfisio-soap-section"><strong>P - Plan</strong><p>' + s.soap_plan + '</p></div>' : '') +
                (s.coach_note ? '<div class="cmfisio-soap-section"><strong>Nota para el entrenador</strong><p>' + s.coach_note + '</p></div>' : '') +
            '</div>';
        });
    }

    // Selector de tratamiento para nueva sesion
    var treatOpts = '<option value="">Sin tratamiento asociado</option>';
    treatments.forEach(function(t) { treatOpts += '<option value="' + t.id + '">' + t.title + '</option>'; });

    // Checkboxes tecnicas
    var techChecks = '';
    var cats = {};
    cmFisioTecnicasCatalog.forEach(function(t) {
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
    });
    Object.keys(cats).forEach(function(cat) {
        techChecks += '<div style="margin-bottom:6px"><div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:3px">' + cat + '</div><div class="cmfisio-tech-grid">';
        cats[cat].forEach(function(t) {
            techChecks += '<label class="cmfisio-tech-check"><input type="checkbox" value="' + t.code + '"> ' + t.name_es + '</label>';
        });
        techChecks += '</div></div>';
    });

    container.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Sesiones de fisioterapia</h4><button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" onclick="document.getElementById(\'cmfisio-form-session\').style.display=document.getElementById(\'cmfisio-form-session\').style.display===\'none\'?\'block\':\'none\'">+ Nueva sesion</button></div>' +
        '<div id="cmfisio-form-session" style="display:none;background:#0f172a;border:1px solid #14b8a6;border-radius:10px;padding:16px;margin-bottom:14px">' +
            '<h4 style="margin:0 0 12px;color:#14b8a6;font-size:14px">Registrar sesion</h4>' +
            '<div class="cmfisio-form-row-3">' +
                '<div class="cmfisio-form-group"><label>Fecha *</label><input type="date" id="cmfisio-ses-date" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
                '<div class="cmfisio-form-group"><label>Hora inicio</label><input type="time" id="cmfisio-ses-start"></div>' +
                '<div class="cmfisio-form-group"><label>Hora fin</label><input type="time" id="cmfisio-ses-end"></div>' +
            '</div>' +
            '<div class="cmfisio-form-group"><label>Tratamiento asociado</label><select id="cmfisio-ses-treatment">' + treatOpts + '</select></div>' +
            '<div class="cmfisio-form-row">' +
                '<div class="cmfisio-form-group"><label>S - Subjetivo</label><textarea id="cmfisio-ses-subj" placeholder="Dolor, sensaciones, molestias..."></textarea></div>' +
                '<div class="cmfisio-form-group"><label>Nivel de dolor (0-10)</label><input type="range" id="cmfisio-ses-pain" min="0" max="10" value="0" oninput="document.getElementById(\'cmfisio-pain-val\').textContent=this.value" style="width:100%"><div style="text-align:center;color:#14b8a6;font-weight:700;font-size:18px" id="cmfisio-pain-val">0</div></div>' +
            '</div>' +
            '<div class="cmfisio-form-group"><label>O - Objetivo</label><textarea id="cmfisio-ses-obj" placeholder="ROM, fuerza, inflamacion, test funcional..."></textarea></div>' +
            '<div class="cmfisio-form-group"><label>A - Tecnicas aplicadas</label>' + techChecks + '</div>' +
            '<div class="cmfisio-form-group"><label>Detalle de la actuacion</label><textarea id="cmfisio-ses-action" placeholder="Descripcion detallada..."></textarea></div>' +
            '<div class="cmfisio-form-group"><label>P - Plan</label><textarea id="cmfisio-ses-plan" placeholder="Progresion, ejercicios para casa..."></textarea></div>' +
            '<div class="cmfisio-form-row">' +
                '<div class="cmfisio-form-group"><label>Recomendacion para el entrenador</label><select id="cmfisio-ses-rec"><option value="">-- Sin recomendacion --</option><option value="apto">Apto</option><option value="limitado">Limitado</option><option value="no_disponible">No disponible</option></select></div>' +
                '<div class="cmfisio-form-group"><label>Nota para el entrenador</label><input type="text" id="cmfisio-ses-coach-note" placeholder="Breve nota..."></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-form-session\').style.display=\'none\'">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioGuardarSesion()">Guardar sesion</button></div>' +
        '</div>' +
        '<div id="cmfisio-sessions-list">' + sessionHtml + '</div>';
};


// ========== INFORME DIARIO COMPLETO EN PDF ==========
// Sobreescribe la funcion original
cmFisioGenerarInformeDiario = async function() {
    var hoy = new Date().toISOString().split('T')[0];
    var hoyDisplay = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Sesiones de hoy de ESTE fisio
    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('*').eq('club_id', clubId).eq('session_date', hoy).eq('performed_by', usuario ? usuario.id : 0).eq('archived', false).order('time_start');
    var sesiones = sesRes.data || [];

    if (sesiones.length === 0) {
        showToast('No tienes sesiones registradas hoy. Registra sesiones primero.', 'error');
        return;
    }

    // Nombres de jugadores
    var playerIds = [...new Set(sesiones.map(function(s) { return s.player_id; }))];
    var playerRes = await supabaseClient.from('season_players').select('player_id, team_id, shirt_number, players(id, name, position)').in('player_id', playerIds);
    var playerMap = {};
    (playerRes.data || []).forEach(function(sp) {
        if (sp.players && !playerMap[sp.players.id]) {
            playerMap[sp.players.id] = {
                name: sp.players.name,
                position: sp.players.position || '-',
                dorsal: sp.shirt_number || '-',
                teamId: sp.team_id
            };
        }
    });

    var teamMap = {};
    cmFisioEquipos.forEach(function(t) { teamMap[t.id] = t.name; });

    // Tratamientos asociados
    var treatIds = sesiones.map(function(s) { return s.treatment_id; }).filter(function(id) { return id; });
    var treatMap = {};
    if (treatIds.length > 0) {
        var treatRes = await supabaseClient.from('cm_fisio_treatments').select('id, title').in('id', treatIds);
        (treatRes.data || []).forEach(function(t) { treatMap[t.id] = t.title; });
    }

    // Disponibilidad
    var availRes = await supabaseClient.from('club_player_availability').select('player_id, status').eq('club_id', clubId).in('player_id', playerIds);
    var availMap = {};
    (availRes.data || []).forEach(function(a) { availMap[a.player_id] = a.status; });

    // Nombre del fisio
    var fisioName = usuario ? (usuario.display_name || usuario.name || 'Fisioterapeuta') : 'Fisioterapeuta';

    // Nombres de tecnicas
    var techNameMap = {};
    cmFisioTecnicasCatalog.forEach(function(t) { techNameMap[t.code] = t.name_es; });

    // ===== GENERAR PDF CON jsPDF =====
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        showToast('jsPDF no esta cargado. No se puede generar el PDF.', 'error');
        return;
    }
    var _jsPDF = (typeof jspdf !== 'undefined') ? jspdf.jsPDF : jsPDF;
    var doc = new _jsPDF('p', 'mm', 'a4');
    var pageW = 210;
    var marginL = 15;
    var marginR = 15;
    var contentW = pageW - marginL - marginR;
    var y = 15;

    // Colores
    var teal = [20, 184, 166];
    var dark = [15, 23, 42];
    var gray = [148, 163, 184];
    var white = [226, 232, 240];
    var green = [34, 197, 94];
    var amber = [245, 158, 11];
    var red = [239, 68, 68];

    // ===== CABECERA =====
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DIARIO DE FISIOTERAPIA', marginL, 18);
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(hoyDisplay.charAt(0).toUpperCase() + hoyDisplay.slice(1), marginL, 26);
    doc.text('Fisioterapeuta: ' + fisioName, marginL, 33);
    doc.text('Jugadores tratados: ' + sesiones.length, pageW - marginR, 33, { align: 'right' });

    y = 48;

    // ===== RESUMEN RAPIDO (tabla de semaforos) =====
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de disponibilidad', marginL, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('Jugador', marginL, y);
    doc.text('Pos.', marginL + 55, y);
    doc.text('Equipo', marginL + 72, y);
    doc.text('Dolor', marginL + 115, y);
    doc.text('Recomendacion', marginL + 133, y);
    y += 2;
    doc.setDrawColor(50, 65, 85);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    sesiones.forEach(function(s) {
        if (y > 270) { doc.addPage(); y = 20; }
        var p = playerMap[s.player_id] || {};
        var teamName = p.teamId ? (teamMap[p.teamId] || '-') : '-';
        var recText = s.coach_recommendation === 'apto' ? 'APTO' : s.coach_recommendation === 'limitado' ? 'LIMITADO' : s.coach_recommendation === 'no_disponible' ? 'NO DISPONIBLE' : '-';
        var recColor = s.coach_recommendation === 'apto' ? green : s.coach_recommendation === 'limitado' ? amber : s.coach_recommendation === 'no_disponible' ? red : gray;

        // Semaforo circulo
        var avail = availMap[s.player_id] || 'green';
        var semaColor = avail === 'green' ? green : avail === 'amber' ? amber : red;
        doc.setFillColor(semaColor[0], semaColor[1], semaColor[2]);
        doc.circle(marginL - 3, y - 1.5, 1.8, 'F');

        doc.setTextColor(white[0], white[1], white[2]);
        doc.text((p.name || 'Jugador').substring(0, 25), marginL + 1, y);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text((p.position || '-').substring(0, 8), marginL + 55, y);
        doc.text(teamName.substring(0, 18), marginL + 72, y);
        doc.text(s.pain_level !== null && s.pain_level !== undefined ? s.pain_level + '/10' : '-', marginL + 115, y);
        doc.setTextColor(recColor[0], recColor[1], recColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(recText, marginL + 133, y);
        doc.setFont('helvetica', 'normal');
        y += 6;
    });

    y += 6;

    // ===== DETALLE POR JUGADOR =====
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de sesiones', marginL, y);
    y += 8;

    sesiones.forEach(function(s) {
        if (y > 240) { doc.addPage(); y = 20; }

        var p = playerMap[s.player_id] || {};
        var treatTitle = s.treatment_id ? (treatMap[s.treatment_id] || '') : '';

        // Cabecera jugador
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(marginL, y - 4, contentW, 10, 2, 2, 'F');
        doc.setTextColor(teal[0], teal[1], teal[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text((p.dorsal || '') + '  ' + (p.name || 'Jugador'), marginL + 3, y + 2);
        if (s.time_start) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFontSize(9);
            doc.text(s.time_start.substring(0, 5) + (s.time_end ? ' - ' + s.time_end.substring(0, 5) : ''), pageW - marginR - 3, y + 2, { align: 'right' });
        }
        y += 10;

        doc.setFontSize(9);

        if (treatTitle) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFont('helvetica', 'italic');
            doc.text('Tratamiento: ' + treatTitle, marginL + 3, y);
            y += 5;
        }

        if (s.pain_level !== null && s.pain_level !== undefined) {
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.setFont('helvetica', 'normal');
            doc.text('Dolor: ' + s.pain_level + '/10', marginL + 3, y);
            y += 5;
        }

        // SOAP sections
        var sections = [
            { label: 'S - SUBJETIVO', text: s.soap_subjective },
            { label: 'O - OBJETIVO', text: s.soap_objective },
            { label: 'A - TECNICAS APLICADAS', text: ((s.techniques_applied || []).map(function(tc) { return techNameMap[tc] || tc; }).join(', ')) + (s.soap_action ? '\n' + s.soap_action : '') },
            { label: 'P - PLAN', text: s.soap_plan },
            { label: 'NOTA ENTRENADOR', text: s.coach_note }
        ];

        sections.forEach(function(sec) {
            if (!sec.text) return;
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setTextColor(teal[0], teal[1], teal[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(sec.label, marginL + 3, y);
            y += 4;
            doc.setTextColor(white[0], white[1], white[2]);
            doc.setFont('helvetica', 'normal');
            var lines = doc.splitTextToSize(sec.text, contentW - 6);
            doc.text(lines, marginL + 3, y);
            y += lines.length * 4 + 2;
        });

        // Recomendacion
        if (s.coach_recommendation) {
            if (y > 268) { doc.addPage(); y = 20; }
            var recText2 = s.coach_recommendation === 'apto' ? 'APTO PARA ENTRENAR' : s.coach_recommendation === 'limitado' ? 'LIMITADO' : 'NO DISPONIBLE';
            var recCol = s.coach_recommendation === 'apto' ? green : s.coach_recommendation === 'limitado' ? amber : red;
            doc.setTextColor(recCol[0], recCol[1], recCol[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('RECOMENDACION: ' + recText2, marginL + 3, y);
            y += 5;
        }

        // Separador
        y += 3;
        doc.setDrawColor(50, 65, 85);
        doc.line(marginL, y, pageW - marginR, y);
        y += 6;
    });

    // ===== PIE =====
    if (y > 265) { doc.addPage(); y = 20; }
    y += 4;
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Generado por TopLiderCoach HUB | ' + new Date().toLocaleString('es-ES'), marginL, y);
    doc.text('Documento confidencial - Uso interno del club', pageW - marginR, y, { align: 'right' });

    // ===== GUARDAR Y DESCARGAR =====
    var nombreArchivo = 'Informe-Fisio-' + hoy + '.pdf';
    doc.save(nombreArchivo);
    showToast('PDF descargado: ' + nombreArchivo);

    // ===== GUARDAR EN BD + NOTIFICACION =====
    var summary = sesiones.map(function(s) {
        var p = playerMap[s.player_id] || {};
        return {
            player_id: s.player_id,
            name: p.name || 'Jugador',
            position: p.position || '-',
            team: p.teamId ? (teamMap[p.teamId] || '-') : '-',
            pain: s.pain_level,
            techniques: (s.techniques_applied || []).map(function(tc) { return techNameMap[tc] || tc; }).join(', '),
            subjective: s.soap_subjective || '',
            objective: s.soap_objective || '',
            action: s.soap_action || '',
            plan: s.soap_plan || '',
            recommendation: s.coach_recommendation || 'apto',
            coach_note: s.coach_note || ''
        };
    });

    var reportRes = await supabaseClient.from('cm_fisio_daily_reports').upsert({
        club_id: clubId,
        report_date: hoy,
        physio_wp_user_id: usuario ? usuario.id : 0,
        players_summary: summary,
        general_notes: null,
        sent_at: new Date().toISOString()
    }, { onConflict: 'club_id,report_date,physio_wp_user_id' }).select().single();

    // Notificacion al entrenador
    var resumenCorto = summary.map(function(s) {
        var icon = s.recommendation === 'apto' ? 'OK' : s.recommendation === 'limitado' ? '!!' : 'NO';
        return icon + ' ' + s.name;
    }).join(' | ');

    try {
        await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: 'physio_report',
            title: 'Informe fisio - ' + fisioName + ' (' + new Date().toLocaleDateString('es-ES') + ')',
            message: resumenCorto,
            icon: 'physio',
            related_type: 'cm_fisio_daily_reports',
            related_id: reportRes.data ? reportRes.data.id : null,
            target_permission: 'entrenamientos',
            created_by: usuario ? usuario.id : null
        });
    } catch (e) { console.error('Error notificacion:', e); }
};

console.log('[Panel Fisio] cm-fisio-extras.js cargado (edicion, archivado, PDF)');
