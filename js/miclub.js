// ========== MICLUB.JS - TopLiderCoach HUB ==========
// Datos del club, temporadas, plantilla de jugadores

registrarModulo('config', cargarDatosClub);
registrarSubTab('config', 'temporadas', cargarTemporadas);
registrarSubTab('config', 'plantilla', async function() {
    await cargarSelectorTemporadas();
    cargarPlantilla();
});
registrarSubTab('config', 'datos', cargarDatosClub);

        async function cargarDatosClub() {
            if (!clubId) return;
            
            const { data } = await supabaseClient.from('clubs').select('*').eq('id', clubId).single();
            clubData = data;
            
            document.getElementById('club-nombre').value = data.name || '';
            document.getElementById('club-pais').value = data.country || 'Espana';
            document.getElementById('club-formato').value = data.team_format || '11';
            
            if (data.logo_url) {
                document.getElementById('escudo-preview').src = data.logo_url;
                document.getElementById('escudo-preview').style.display = 'block';
                document.getElementById('escudo-placeholder').style.display = 'none';
            }
        }
        
        function previsualizarEscudo(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { showToast('Maximo 2MB'); return; }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('escudo-preview').src = e.target.result;
                document.getElementById('escudo-preview').style.display = 'block';
                document.getElementById('escudo-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        
        async function guardarClub() {
            const nombre = document.getElementById('club-nombre').value.trim();
            if (!nombre) { showToast('El nombre es obligatorio'); return; }
            
            let logoUrl = clubData?.logo_url;
            const escudoInput = document.getElementById('escudo-input');
            
            if (escudoInput.files.length > 0) {
                const file = escudoInput.files[0];
                const fileName = `club-${clubId}-${Date.now()}.${file.name.split('.').pop()}`;
                const { error: upErr } = await supabaseClient.storage.from('logos').upload(fileName, file);
                if (!upErr) {
                    const { data: urlData } = supabaseClient.storage.from('logos').getPublicUrl(fileName);
                    logoUrl = urlData.publicUrl;
                }
            }
            
            await supabaseClient.from('clubs').update({
                name: nombre,
                country: document.getElementById('club-pais').value,
                team_format: document.getElementById('club-formato').value,
                logo_url: logoUrl
            }).eq('id', clubId);
            
            clubData.name = nombre;
            clubData.logo_url = logoUrl;
            
            // Actualizar header
            document.getElementById('club-nombre-header').textContent = nombre;
            if (logoUrl) {
                document.getElementById('club-badge').innerHTML = `<img src="${logoUrl}" alt=""><span>${nombre}</span>`;
            }
            
            showToast('Club guardado');
        }
        
        // ========== MI CLUB: TEMPORADAS ==========
        async function cargarTemporadas() {
            const lista = document.getElementById('lista-temporadas');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            if (!data || data.length === 0) {
                lista.innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay temporadas</p>';
                return;
            }
            
            lista.innerHTML = data.map(t => {
                const isActive = t.is_active;
                const fI = t.start_date ? new Date(t.start_date).toLocaleDateString('es-ES') : '';
                const fF = t.end_date ? new Date(t.end_date).toLocaleDateString('es-ES') : '';
                const startVal = t.start_date || '';
                const endVal = t.end_date || '';
                
                return `
                    <div class="temporada-card ${isActive ? 'active' : ''}" id="temp-card-${t.id}">
                        <div class="temporada-info" id="temp-view-${t.id}">
                            <h4>${t.name} ${isActive ? '<span class="temporada-badge">ACTIVA</span>' : ''}</h4>
                            <p>${fI} - ${fF}</p>
                        </div>
                        <div class="temporada-edit" id="temp-edit-${t.id}" style="display:none;flex:1;">
                            <input type="text" id="temp-edit-nombre-${t.id}" value="${t.name}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:6px;font-size:14px;">
                            <div style="display:flex;gap:8px;">
                                <div style="flex:1;"><label style="font-size:11px;color:#6b7280;">Inicio</label><input type="date" id="temp-edit-inicio-${t.id}" value="${startVal}" style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;"></div>
                                <div style="flex:1;"><label style="font-size:11px;color:#6b7280;">Fin</label><input type="date" id="temp-edit-fin-${t.id}" value="${endVal}" style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;"></div>
                            </div>
                            <div style="display:flex;gap:6px;margin-top:8px;">
                                <button onclick="guardarEdicionTemporada('${t.id}')" style="padding:5px 14px;background:#059669;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Guardar</button>
                                <button onclick="cancelarEdicionTemporada('${t.id}')" style="padding:5px 14px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Cancelar</button>
                            </div>
                        </div>
                        <div class="temporada-actions">
                            <button class="btn-edit-temp" onclick="editarTemporada('${t.id}')" title="Editar">✏️</button>
                            <button class="btn-delete-temp" onclick="eliminarTemporada('${t.id}', '${t.name.replace(/'/g, "\\'")}', ${isActive})" title="Eliminar">🗑️</button>
                            ${!isActive ? `<button class="btn-activar" onclick="activarTemporada('${t.id}')">Activar</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        function editarTemporada(tempId) {
            document.getElementById('temp-view-' + tempId).style.display = 'none';
            document.getElementById('temp-edit-' + tempId).style.display = 'block';
        }
        
        function cancelarEdicionTemporada(tempId) {
            document.getElementById('temp-view-' + tempId).style.display = '';
            document.getElementById('temp-edit-' + tempId).style.display = 'none';
        }
        
        async function guardarEdicionTemporada(tempId) {
            const nombre = document.getElementById('temp-edit-nombre-' + tempId).value.trim();
            if (!nombre) { showToast('El nombre es obligatorio'); return; }
            
            const { error } = await supabaseClient.from('seasons').update({
                name: nombre,
                start_date: document.getElementById('temp-edit-inicio-' + tempId).value || null,
                end_date: document.getElementById('temp-edit-fin-' + tempId).value || null
            }).eq('id', tempId);
            
            if (error) { showToast('Error: ' + error.message); return; }
            
            cargarTemporadas();
            cargarSelectorTemporadas();
        }
        
        async function eliminarTemporada(tempId, nombre, isActive) {
            if (isActive) {
                showToast('No se puede eliminar la temporada activa. Activa otra temporada primero.');
                return;
            }
            
            const confirmacion = prompt(`⚠️ ATENCIÓN: Esto eliminará la temporada "${nombre}" y TODOS sus datos asociados (jugadores de plantilla, partidos, estadísticas, sesiones...).\n\nEsta acción es IRREVERSIBLE.\n\nEscribe el nombre de la temporada para confirmar:`);
            
            if (confirmacion === null) return;
            if (confirmacion.trim() !== nombre.trim()) {
                showToast('El nombre no coincide. Eliminación cancelada.');
                return;
            }
            
            try {
                // Eliminar season_players de esa temporada
                await supabaseClient.from('season_players').delete().eq('season_id', tempId);
                // Eliminar stats de partidos de esa temporada
                const { data: matches } = await supabaseClient.from('matches').select('id').eq('season_id', tempId);
                if (matches && matches.length > 0) {
                    const matchIds = matches.map(m => m.id);
                    await supabaseClient.from('match_player_stats').delete().in('match_id', matchIds);
                }
                // Eliminar partidos
                await supabaseClient.from('matches').delete().eq('season_id', tempId);
                // Eliminar sesiones de entrenamiento
                await supabaseClient.from('training_sessions').delete().eq('season_id', tempId);
                // Eliminar la temporada
                await supabaseClient.from('seasons').delete().eq('id', tempId);
                
                showToast('Temporada eliminada correctamente.');
                cargarTemporadas();
                cargarSelectorTemporadas();
            } catch (err) {
                showToast('Error al eliminar: ' + err.message);
            }
        }

        async function crearTemporada() {
            const nombre = document.getElementById('nueva-temp-nombre').value.trim();
            if (!nombre) { showToast('El nombre es obligatorio'); return; }
            
            await supabaseClient.from('seasons').insert({
                club_id: clubId,
                name: nombre,
                start_date: document.getElementById('nueva-temp-inicio').value || null,
                end_date: document.getElementById('nueva-temp-fin').value || null,
                is_active: false
            });
            
            document.getElementById('nueva-temp-nombre').value = '';
            document.getElementById('nueva-temp-inicio').value = '';
            document.getElementById('nueva-temp-fin').value = '';
            
            showToast('Temporada creada');
            cargarTemporadas();
        }
        
        async function activarTemporada(tempId) {
            if (!await showConfirm('Activar esta temporada?')) return;
            
            await supabaseClient.from('seasons').update({ is_active: false }).eq('club_id', clubId);
            await supabaseClient.from('seasons').update({ is_active: true }).eq('id', tempId);
            
            seasonId = tempId;
            showToast('Temporada activada');
            cargarTemporadas();
        }
        
        // ========== MI CLUB: PLANTILLA ==========
        async function cargarSelectorTemporadas() {
            const select = document.getElementById('plantilla-temporada');
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            select.innerHTML = (data || []).map(t => {
                const selected = t.is_active ? 'selected' : '';
                return `<option value="${t.id}" ${selected}>${t.name} ${t.is_active ? '(activa)' : ''}</option>`;
            }).join('');
        }
        
     async function cargarPlantilla() {
            const tempId = document.getElementById('plantilla-temporada').value;
            if (!tempId) return;
            
            const lista = document.getElementById('lista-jugadores');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            try {
                const { data, error } = await supabaseClient
                    .from('season_players')
                    .select('id, player_id, shirt_number, players(id, name, status, position, position_detail, position_secondary, is_sub23, acquisition, photo_url, birth_date, height_cm, weight_kg, dominant_foot)')
                    .eq('season_id', tempId)
                    .order('shirt_number');
                
                if (error) throw error;
                
                // Cargar estadísticas de todos los jugadores de la temporada
                const playerIds = (data || []).map(sp => sp.player_id).filter(Boolean);
                let statsMap = {};
                if (playerIds.length > 0) {
                    const { data: allStats } = await supabaseClient
                        .from('match_player_stats')
                        .select('player_id, minutes_played, goals, assists, yellow_cards, red_cards, matches!inner(season_id)')
                        .in('player_id', playerIds)
                        .eq('matches.season_id', tempId);
                    
                    (allStats || []).forEach(s => {
                        if (!statsMap[s.player_id]) statsMap[s.player_id] = { pj:0, min:0, g:0, a:0, ta:0, tr:0 };
                        if (s.minutes_played > 0) statsMap[s.player_id].pj++;
                        statsMap[s.player_id].min += s.minutes_played || 0;
                        statsMap[s.player_id].g += s.goals || 0;
                        statsMap[s.player_id].a += s.assists || 0;
                        statsMap[s.player_id].ta += s.yellow_cards || 0;
                        statsMap[s.player_id].tr += s.red_cards || 0;
                    });
                }
                
                const count = (data || []).length;
                
                const maxJug = (clubData && clubData.max_players) ? clubData.max_players : 40;
                const contador = document.getElementById('plantilla-contador');
                contador.textContent = `${count} / ${maxJug} jugadores`;
                contador.className = 'plantilla-contador';
                if (count >= maxJug - 5) contador.classList.add('warning');
                if (count >= maxJug) contador.classList.add('full');
                
                function posColor(pos) {
                    if (!pos) return '#6b7280';
                    const p = pos.toLowerCase();
                    if (p.includes('porter')) return '#f59e0b';
                    if (p.includes('lateral') || p.includes('central') || p.includes('defens') || p.includes('libre')) return '#3b82f6';
                    if (p.includes('extrem') || p.includes('delanter') || p.includes('punta') || p.includes('mediapunta')) return '#ef4444';
                    if (p.includes('medio') || p.includes('centro') || p.includes('pivote') || p.includes('interior')) return '#22c55e';
                    return '#6b7280';
                }
                
                function posAbrev(pos) {
                    if (!pos) return '—';
                    const p = pos.toLowerCase();
                    if (p.includes('porter')) return 'POR';
                    if (p.includes('lateral derecho')) return 'LD';
                    if (p.includes('lateral izquierdo')) return 'LI';
                    if (p.includes('central')) return 'DFC';
                    if (p.includes('defens')) return 'DEF';
                    if (p.includes('mediocentro') || p.includes('medio centro')) return 'MC';
                    if (p.includes('mediapunta')) return 'MP';
                    if (p.includes('pivote')) return 'PIV';
                    if (p.includes('interior')) return 'INT';
                    if (p.includes('extremo derecho')) return 'ED';
                    if (p.includes('extremo izquierdo')) return 'EI';
                    if (p.includes('delantero centro')) return 'DC';
                    if (p.includes('delanter')) return 'DEL';
                    return pos.substring(0, 3).toUpperCase();
                }
                
                function calcEdad(bd) {
                    if (!bd) return null;
                    const hoy = new Date();
                    const nac = new Date(bd);
                    let edad = hoy.getFullYear() - nac.getFullYear();
                    const m = hoy.getMonth() - nac.getMonth();
                    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
                    return edad;
                }
                
                let html = (data || []).map(sp => {
                    const j = sp.players || {};
                    const st = statsMap[sp.player_id] || { pj:0, min:0, g:0, a:0, ta:0, tr:0 };
                    const statusClass = j.status || 'available';
                    const statusIcon = { available: '●', injured: '🏥', suspended: '⛔' }[statusClass] || '●';
                    const statusText = { available: 'OK', injured: 'Lesión', suspended: 'Sanc.' }[statusClass] || 'OK';
                    const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
                    const col = posColor(j.position);
                    const posAb = posAbrev(j.position);
                    const edad = calcEdad(j.birth_date);
                    const pie = j.dominant_foot ? (j.dominant_foot === 'Derecho' || j.dominant_foot === 'Right' ? 'D' : j.dominant_foot === 'Izquierdo' || j.dominant_foot === 'Left' ? 'I' : 'A') : '';
                    const altura = j.height_cm ? j.height_cm + 'cm' : '';
                    const apellido = j.name ? j.name.split(' ').pop().toUpperCase() : 'SIN NOMBRE';
                    const nombre = j.name ? j.name.split(' ').slice(0, -1).join(' ') : '';

return `
    <div class="pcard" onclick="abrirFichaJugador('${j.id}')" style="--pos-color:${col};position:relative;overflow:hidden" data-pos="${j.position_detail||''}" data-sub23="${j.is_sub23?'1':'0'}" data-origen="${j.acquisition||''}">
        ${j.is_sub23 ? '<div style="position:absolute;top:0;right:0;width:74px;height:74px;overflow:hidden;pointer-events:none;z-index:5"><div style="position:absolute;transform:rotate(45deg);background:#7c3aed;color:#fff;font-size:10px;font-weight:800;letter-spacing:.5px;text-align:center;width:100px;top:16px;right:-26px;padding:3px 0;box-shadow:0 1px 4px rgba(0,0,0,.35)">U23</div></div>' : ''}
        ${j.acquisition === 'prueba' ? '<div style="position:absolute;top:0;left:0;width:74px;height:74px;overflow:hidden;pointer-events:none;z-index:5"><div style="position:absolute;transform:rotate(-45deg);background:#f97316;color:#fff;font-size:9px;font-weight:800;text-align:center;width:100px;top:16px;left:-26px;padding:3px 0;box-shadow:0 1px 4px rgba(0,0,0,.35)">A PRUEBA</div></div>' : ''}
        ${j.acquisition === 'prueba' ? '<div style="position:absolute;top:0;left:0;width:74px;height:74px;overflow:hidden;pointer-events:none;z-index:5"><div style="position:absolute;transform:rotate(-45deg);background:#f97316;color:#fff;font-size:9px;font-weight:800;letter-spacing:.3px;text-align:center;width:100px;top:16px;left:-26px;padding:3px 0;box-shadow:0 1px 4px rgba(0,0,0,.35)">A PRUEBA</div></div>' : ''}
        <div class="pcard-top">
            <div class="pcard-dorsal">${sp.shirt_number || '-'}</div>
            <div class="pcard-pos-badge">${posAb}</div>
            <div class="pcard-status pcard-st-${statusClass}" title="${statusText}">${statusIcon}</div>
        </div>
        <div class="pcard-foto">
            ${j.photo_url 
                ? `<img src="${j.photo_url}" alt="${j.name}">` 
                : `<div class="pcard-nofoto">${inicial}</div>`
            }
        </div>
        <div class="pcard-name-bar">
            <div class="pcard-apellido">${apellido}</div>
            ${nombre ? `<div class="pcard-nombre-small">${nombre}</div>` : ''}
        </div>
        <div class="pcard-meta">
            ${edad ? `<span>${edad} años</span>` : ''}
            ${altura ? `<span>${altura}</span>` : ''}
            ${pie ? `<span>Pie ${pie}</span>` : ''}
        </div>
        <div class="pcard-stats">
            <div class="pcard-stat"><span class="pcard-stat-val">${st.pj}</span><span class="pcard-stat-lbl">PJ</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${st.min}</span><span class="pcard-stat-lbl">MIN</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${st.g}</span><span class="pcard-stat-lbl">GOL</span></div>
            <div class="pcard-stat"><span class="pcard-stat-val">${st.a}</span><span class="pcard-stat-lbl">ASI</span></div>
            <div class="pcard-stat pcard-stat-ta"><span class="pcard-stat-val">${st.ta}</span><span class="pcard-stat-lbl">TA</span></div>
        </div>
        <div class="pcard-actions">
            <button class="pcard-btn-edit" onclick="event.stopPropagation();editarJugador('${j.id}', '${sp.id}')">✏️</button>
            <button class="pcard-btn-del" onclick="event.stopPropagation();eliminarJugadorDePlantilla('${sp.id}')">🗑️</button>
        </div>
    </div>
`;
                }).join('');
                
                if (count < maxJug) {
                    html += `<div class="add-jugador-card" onclick="abrirModalJugador()"><div class="icon">+</div><span>Añadir Jugador</span></div>`;
                }
                
                lista.innerHTML = html;
                cmMiClubInyectarFiltros();
                cmMiClubFiltrar();
                
            } catch (err) {
                console.error('Error cargando plantilla:', err);
                lista.innerHTML = '<p style="color:red;">Error al cargar jugadores</p>';
            }
        }
        
        function cmMiClubInyectarFiltros() {
            if (document.getElementById('mc-plantilla-filtros')) return;
            var lista = document.getElementById('lista-jugadores');
            if (!lista) return;
            var grupos = [
                ['Portería', [['POR','Portero']]],
                ['Defensa', [['LD','Lateral Derecho'],['LI','Lateral Izquierdo'],['CAD','Carrilero Derecho'],['CAI','Carrilero Izquierdo'],['DCD','Central Derecho'],['DCC','Central'],['DCI','Central Izquierdo']]],
                ['Centro del campo', [['PIV','Pivote'],['MCD','Mediocentro Derecho'],['MC','Mediocentro'],['MCI','Mediocentro Izquierdo'],['MD','Medio Derecho'],['MI','Medio Izquierdo'],['ID','Interior Derecho'],['II','Interior Izquierdo'],['MP','Mediapunta'],['MPI','Mediapunta Izquierda'],['MPC','Mediapunta Central'],['MPD','Mediapunta Derecha']]],
                ['Ataque', [['ED','Extremo Derecho'],['EI','Extremo Izquierdo'],['DC','Delantero Centro']]]
            ];
            var posOpts = '<option value="">Todas las posiciones</option>';
            grupos.forEach(function(g) {
                posOpts += '<optgroup label="' + g[0] + '">';
                g[1].forEach(function(o) { posOpts += '<option value="' + o[0] + '">' + o[0] + ' · ' + o[1] + '</option>'; });
                posOpts += '</optgroup>';
            });
            var estilo = 'padding:8px 10px;border-radius:8px;border:1px solid #cbd5e1;font-size:13px;background:#fff';
            var bar = document.createElement('div');
            bar.id = 'mc-plantilla-filtros';
            bar.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 16px 0';
            bar.innerHTML =
                '<select id="mc-f-pos" onchange="cmMiClubFiltrar()" style="' + estilo + '">' + posOpts + '</select>' +
                '<select id="mc-f-sub23" onchange="cmMiClubFiltrar()" style="' + estilo + '">' +
                  '<option value="">Sub-23: todos</option><option value="1">Solo Sub-23</option><option value="0">Solo no Sub-23</option></select>' +
                '<select id="mc-f-origen" onchange="cmMiClubFiltrar()" style="' + estilo + '">' +
                  '<option value="">Todos los orígenes</option>' +
                  '<option value="nueva_incorporacion">Nueva incorporación</option>' +
                  '<option value="cantera">Cantera</option>' +
                  '<option value="propiedad">En propiedad</option><option value="prueba">A prueba</option></select>' +
                '<span id="mc-f-count" style="margin-left:auto;color:#64748b;font-size:13px"></span>';
            lista.parentNode.insertBefore(bar, lista);
        }

        function cmMiClubFiltrar() {
            var fp = (document.getElementById('mc-f-pos') || {}).value || '';
            var fs = (document.getElementById('mc-f-sub23') || {}).value || '';
            var fo = (document.getElementById('mc-f-origen') || {}).value || '';
            var cards = document.querySelectorAll('#lista-jugadores .pcard');
            var vis = 0;
            cards.forEach(function(c) {
                var ok = true;
                if (fp && c.dataset.pos !== fp) ok = false;
                if (fs && c.dataset.sub23 !== fs) ok = false;
                if (fo && c.dataset.origen !== fo) ok = false;
                c.style.display = ok ? '' : 'none';
                if (ok) vis++;
            });
            var cnt = document.getElementById('mc-f-count');
            if (cnt) cnt.textContent = vis + ' mostrados';
        }

        function cmMiClubMejorarFicha() {
            var sel = document.getElementById('jugador-posicion');
            if (!sel || sel.dataset.mejorada === '1') return;
            sel.dataset.mejorada = '1';
            var grupos = [
                ['Portería', [['POR','Portero']]],
                ['Defensa', [['LD','Lateral Derecho'],['LI','Lateral Izquierdo'],['CAD','Carrilero Derecho'],['CAI','Carrilero Izquierdo'],['DCD','Central Derecho'],['DCC','Central'],['DCI','Central Izquierdo']]],
                ['Centro del campo', [['PIV','Pivote'],['MCD','Mediocentro Derecho'],['MC','Mediocentro'],['MCI','Mediocentro Izquierdo'],['MD','Medio Derecho'],['MI','Medio Izquierdo'],['ID','Interior Derecho'],['II','Interior Izquierdo'],['MP','Mediapunta'],['MPI','Mediapunta Izquierda'],['MPC','Mediapunta Central'],['MPD','Mediapunta Derecha']]],
                ['Ataque', [['ED','Extremo Derecho'],['EI','Extremo Izquierdo'],['DC','Delantero Centro']]]
            ];
            function opts(vacioLabel) {
                var h = '<option value="">' + vacioLabel + '</option>';
                grupos.forEach(function(g) {
                    h += '<optgroup label="' + g[0] + '">';
                    g[1].forEach(function(o) { h += '<option value="' + o[0] + '">' + o[0] + ' · ' + o[1] + '</option>'; });
                    h += '</optgroup>';
                });
                return h;
            }
            sel.innerHTML = opts('Seleccionar...');
            if (!document.getElementById('jugador-posicion-sec')) {
                var fila = sel.closest('.form-row') || sel.parentElement;
                var wrap = document.createElement('div');
                wrap.innerHTML =
                    '<div class="form-row">' +
                      '<div class="form-group"><label>Posición secundaria</label>' +
                        '<select id="jugador-posicion-sec">' + opts('— Ninguna —') + '</select></div>' +
                      '<div class="form-group"><label>Origen</label>' +
                        '<select id="jugador-origen"><option value="">—</option>' +
                        '<option value="nueva_incorporacion">Nueva incorporación</option>' +
                        '<option value="cantera">Cantera</option>' +
                        '<option value="propiedad">En propiedad</option><option value="prueba">A prueba</option></select></div>' +
                    '</div>' +
                    '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
                      '<input type="checkbox" id="jugador-sub23" style="width:auto;margin:0"> Sub-23</label></div>';
                var ref = fila;
                Array.prototype.slice.call(wrap.children).forEach(function(node) {
                    ref.parentNode.insertBefore(node, ref.nextSibling);
                    ref = node;
                });
            }
        }

        function abrirModalJugador() {
            cmMiClubMejorarFicha();
            jugadorEditando = null;
            document.getElementById('modal-jugador-titulo').textContent = 'Nuevo Jugador';
            
            document.getElementById('jugador-id').value = '';
            document.getElementById('jugador-sp-id').value = '';
            document.getElementById('jugador-nombre').value = '';
            document.getElementById('jugador-dorsal').value = '';
            document.getElementById('jugador-posicion').value = '';
            var _secN = document.getElementById('jugador-posicion-sec'); if (_secN) _secN.value = '';
            var _oriN = document.getElementById('jugador-origen'); if (_oriN) _oriN.value = '';
            var _s23N = document.getElementById('jugador-sub23'); if (_s23N) _s23N.checked = false;
            document.getElementById('jugador-nacimiento').value = '';
            document.getElementById('jugador-pie').value = 'Derecho';
            document.getElementById('jugador-altura').value = '';
            document.getElementById('jugador-peso').value = '';
            document.getElementById('jugador-telefono').value = '';
            document.getElementById('jugador-email').value = '';
            document.getElementById('jugador-estado').value = 'available';
            document.getElementById('jugador-documento').value = '';
            document.getElementById('jugador-licencia').value = '';
            document.getElementById('jugador-foto-preview').style.display = 'none';
            document.getElementById('jugador-foto-placeholder').style.display = 'flex';
            
            document.getElementById('modal-jugador').style.display = 'flex';
        }
        
        async function editarJugador(playerId, spId) {
            cmMiClubMejorarFicha();
            jugadorEditando = { playerId, spId };
            document.getElementById('modal-jugador-titulo').textContent = 'Editar Jugador';
            
            const { data: player } = await supabaseClient.from('players').select('*').eq('id', playerId).single();
            const { data: sp } = await supabaseClient.from('season_players').select('shirt_number').eq('id', spId).single();
            
            document.getElementById('jugador-id').value = playerId;
            document.getElementById('jugador-sp-id').value = spId;
            document.getElementById('jugador-nombre').value = player.name || '';
            document.getElementById('jugador-dorsal').value = sp?.shirt_number || '';
            document.getElementById('jugador-posicion').value = player.position_detail || '';
            var _sec = document.getElementById('jugador-posicion-sec'); if (_sec) _sec.value = player.position_secondary || '';
            var _ori = document.getElementById('jugador-origen'); if (_ori) _ori.value = player.acquisition || '';
            var _s23 = document.getElementById('jugador-sub23'); if (_s23) _s23.checked = !!player.is_sub23;
            document.getElementById('jugador-nacimiento').value = player.birth_date || '';
            document.getElementById('jugador-pie').value = player.dominant_foot || 'Derecho';
            document.getElementById('jugador-altura').value = player.height_cm || '';
            document.getElementById('jugador-peso').value = player.weight_kg || '';
            document.getElementById('jugador-telefono').value = player.phone || '';
            document.getElementById('jugador-email').value = player.email || '';
            document.getElementById('jugador-estado').value = player.status || 'available';
            document.getElementById('jugador-documento').value = player.document_number || '';
            document.getElementById('jugador-licencia').value = player.federation_license || '';
            
            if (player.photo_url) {
                document.getElementById('jugador-foto-preview').src = player.photo_url;
                document.getElementById('jugador-foto-preview').style.display = 'block';
                document.getElementById('jugador-foto-placeholder').style.display = 'none';
            } else {
                document.getElementById('jugador-foto-preview').style.display = 'none';
                document.getElementById('jugador-foto-placeholder').style.display = 'flex';
            }
            
            document.getElementById('modal-jugador').style.display = 'flex';
        }
        
        function cerrarModalJugador(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-jugador').style.display = 'none';
            jugadorEditando = null;
        }
        // ========== ESCUDO RIVAL EN MODAL PARTIDO ==========

        function previsualizarFotoJugador(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('jugador-foto-preview').src = e.target.result;
                document.getElementById('jugador-foto-preview').style.display = 'block';
                document.getElementById('jugador-foto-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        
        async function guardarJugador() {
            const nombre = document.getElementById('jugador-nombre').value.trim();
            const dorsal = document.getElementById('jugador-dorsal').value;
            const posicion = document.getElementById('jugador-posicion').value;
            const _secG = document.getElementById('jugador-posicion-sec'); const posicionSec = _secG ? (_secG.value || null) : null;
            const _s23G = document.getElementById('jugador-sub23'); const sub23 = _s23G ? _s23G.checked : false;
            const _oriG = document.getElementById('jugador-origen'); const origen = _oriG ? (_oriG.value || null) : null;
            
            if (!nombre || !dorsal || !posicion) {
                showToast('Nombre, dorsal y posicion son obligatorios');
                return;
            }
            
            const tempId = document.getElementById('plantilla-temporada').value;
            
            let photoUrl = null;
            const fotoInput = document.getElementById('jugador-foto-input');
            if (fotoInput.files.length > 0) {
                const file = fotoInput.files[0];
                const fileName = `player-${Date.now()}.${file.name.split('.').pop()}`;
                const { error: upErr } = await supabaseClient.storage.from('photos').upload(fileName, file);
                if (!upErr) {
                    const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(fileName);
                    photoUrl = urlData.publicUrl;
                }
            }
            
            // El 'position' antiguo (texto) se guarda en version gruesa para que MatchStats / Plan de Partido / Analisis sigan funcionando
            const POS_GRUESA = {
                POR:'Portero', LD:'Lateral Derecho', CAD:'Lateral Derecho',
                LI:'Lateral Izquierdo', CAI:'Lateral Izquierdo',
                DCD:'Defensa Central', DCC:'Defensa Central', DCI:'Defensa Central',
                PIV:'Mediocentro Defensivo', MCD:'Mediocentro', MC:'Mediocentro', MCI:'Mediocentro',
                MD:'Mediocentro', MI:'Mediocentro', ID:'Mediocentro', II:'Mediocentro',
                MP:'Mediapunta', MPI:'Mediapunta', MPC:'Mediapunta', MPD:'Mediapunta', ED:'Extremo Derecho', EI:'Extremo Izquierdo', DC:'Delantero Centro'
            };
            const playerData = {
                club_id: clubId,
                name: nombre,
                position: POS_GRUESA[posicion] || posicion,
                position_detail: posicion,
                position_secondary: posicionSec,
                is_sub23: sub23,
                acquisition: origen,
                birth_date: document.getElementById('jugador-nacimiento').value || null,
                dominant_foot: document.getElementById('jugador-pie').value,
                height_cm: document.getElementById('jugador-altura').value || null,
                weight_kg: document.getElementById('jugador-peso').value || null,
                phone: document.getElementById('jugador-telefono').value,
                email: document.getElementById('jugador-email').value,
         status: document.getElementById('jugador-estado').value,
                document_number: document.getElementById('jugador-documento').value || null,
                federation_license: document.getElementById('jugador-licencia').value || null
            };
            
            if (photoUrl) playerData.photo_url = photoUrl;
            
            if (jugadorEditando) {
                await supabaseClient.from('players').update(playerData).eq('id', jugadorEditando.playerId);
                await supabaseClient.from('season_players').update({ shirt_number: parseInt(dorsal) }).eq('id', jugadorEditando.spId);
            } else {
                const { data: newPlayer } = await supabaseClient.from('players').insert(playerData).select().single();
                await supabaseClient.from('season_players').insert({
                    season_id: tempId,
                    player_id: newPlayer.id,
                    shirt_number: parseInt(dorsal)
                });
            }
            
            cerrarModalJugador();
            cargarPlantilla();
            showToast('Jugador guardado');
        }
        
        async function eliminarJugadorDePlantilla(spId) {
            if (!await showConfirm('Eliminar este jugador de la plantilla?')) return;
            await supabaseClient.from('season_players').delete().eq('id', spId);
            cargarPlantilla();
        }
        // ========== VIDEO DEL PARTIDO ==========
// Añadir estas funciones en la sección de JavaScript

// Detectar plataforma del video
// ========== DESCARGAR PLANTILLA PDF ==========

function abrirModalDescargarPlantilla() {
    document.getElementById('modal-descargar-plantilla').style.display = 'flex';
}

function cerrarModalDescargarPlantilla(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-descargar-plantilla').style.display = 'none';
}

function seleccionarTodosCamposPDF(marcar) {
    document.querySelectorAll('.campo-pdf-check').forEach(cb => cb.checked = marcar);
}

async function generarPDFPlantilla() {
    const campos = [];
    document.querySelectorAll('.campo-pdf-check:checked').forEach(cb => campos.push(cb.value));
    
    if (campos.length === 0) {
        showToast('Selecciona al menos un campo');
        return;
    }
    
    const orientacion = document.querySelector('input[name="pdf-orientacion"]:checked').value;
    
    const tempId = document.getElementById('plantilla-temporada').value;
    if (!tempId) { showToast('Selecciona una temporada'); return; }
    
    const { data, error } = await supabaseClient
        .from('season_players')
        .select('shirt_number, players(name, position, birth_date, dominant_foot, height_cm, weight_kg, phone, email, status, document_number, federation_license)')
        .eq('season_id', tempId)
        .order('shirt_number');
    
    if (error || !data || data.length === 0) {
        showToast('No hay jugadores en la plantilla');
        return;
    }
    
    const tempSelect = document.getElementById('plantilla-temporada');
    const tempNombre = tempSelect.options[tempSelect.selectedIndex].text;
    
    const campoConfig = {
        dorsal:      { header: 'Dorsal', getValue: (sp) => sp.shirt_number || '-' },
        nombre:      { header: 'Nombre', getValue: (sp) => sp.players?.name || '-' },
        posicion:    { header: 'Posición', getValue: (sp) => sp.players?.position || '-' },
        nacimiento:  { header: 'F. Nacimiento', getValue: (sp) => sp.players?.birth_date ? new Date(sp.players.birth_date).toLocaleDateString('es-ES') : '-' },
        edad:        { header: 'Edad', getValue: (sp) => {
            if (!sp.players?.birth_date) return '-';
            const hoy = new Date(); const nac = new Date(sp.players.birth_date);
            let e = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
            return e;
        }},
        pie:         { header: 'Pie', getValue: (sp) => sp.players?.dominant_foot || '-' },
        altura:      { header: 'Altura', getValue: (sp) => sp.players?.height_cm ? sp.players.height_cm + ' cm' : '-' },
        peso:        { header: 'Peso', getValue: (sp) => sp.players?.weight_kg ? sp.players.weight_kg + ' kg' : '-' },
        telefono:    { header: 'Teléfono', getValue: (sp) => sp.players?.phone || '-' },
        email:       { header: 'Email', getValue: (sp) => sp.players?.email || '-' },
        documento:   { header: 'Nº Documento', getValue: (sp) => sp.players?.document_number || '-' },
        licencia:    { header: 'Nº Licencia', getValue: (sp) => sp.players?.federation_license || '-' },
        estado:      { header: 'Estado', getValue: (sp) => {
            const st = sp.players?.status;
            return st === 'available' ? 'Disponible' : st === 'injured' ? 'Lesionado' : st === 'suspended' ? 'Sancionado' : '-';
        }}
    };
    
    const headers = campos.map(c => campoConfig[c].header);
    const rows = data.map(sp => campos.map(c => String(campoConfig[c].getValue(sp))));
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: orientacion, unit: 'mm', format: 'a4' });
    
    const pageW = doc.internal.pageSize.getWidth();
    const clubNombre = clubData?.name || 'Mi Club';
    
    // === AJUSTE DINÁMICO según número de campos ===
    const numCampos = campos.length;
    let fontSize, headFontSize, cellPadding, margin;
    
    if (numCampos <= 5) {
        fontSize = 9; headFontSize = 9; cellPadding = 3; margin = 15;
    } else if (numCampos <= 8) {
        fontSize = 7.5; headFontSize = 7.5; cellPadding = 2.5; margin = 10;
    } else if (numCampos <= 10) {
        fontSize = 6.5; headFontSize = 6.5; cellPadding = 2; margin = 8;
    } else {
        fontSize = 5.5; headFontSize = 5.5; cellPadding = 1.5; margin = 6;
    }
    
    // Header con fondo oscuro
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 28, 'F');
    
    let logoX = margin;
    if (clubData?.logo_url) {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = clubData.logo_url;
            });
            doc.addImage(img, 'PNG', margin, 2, 22, 22);
            logoX = margin + 26;
        } catch(e) {}
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(clubNombre, logoX, 12);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Plantilla - ' + tempNombre, logoX, 20);
    
    doc.setFontSize(7);
    doc.text('Generado: ' + new Date().toLocaleDateString('es-ES'), pageW - margin, 20, { align: 'right' });
    
    // === Anchos de columna dinámicos ===
    const tableWidth = pageW - (margin * 2);
    
    // Campos estrechos vs normales vs anchos
    const camposEstrechos = ['dorsal', 'edad', 'altura', 'peso'];
    const camposAnchos = ['nombre', 'email', 'telefono', 'licencia'];
    
    const columnStyles = {};
    campos.forEach((c, i) => {
        if (camposEstrechos.includes(c)) {
            columnStyles[i] = { halign: 'center', cellWidth: numCampos > 8 ? 12 : 15 };
        }
        if (c === 'nombre') {
            columnStyles[i] = { fontStyle: 'bold' };
        }
        if (c === 'estado') {
            columnStyles[i] = { halign: 'center', cellWidth: numCampos > 8 ? 16 : 20 };
        }
    });
    
    doc.autoTable({
        startY: 33,
        head: [headers],
        body: rows,
        theme: 'grid',
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        styles: {
            fontSize: fontSize,
            cellPadding: cellPadding,
            lineColor: [200, 200, 200],
            lineWidth: 0.3,
            overflow: 'linebreak',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: headFontSize,
            halign: 'center',
            cellPadding: cellPadding
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: columnStyles,
        didDrawPage: function(data) {
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            doc.text('TopLiderCoach HUB', margin, doc.internal.pageSize.getHeight() - 6);
            doc.text('Pág. ' + doc.internal.getNumberOfPages(), pageW - margin, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
        }
    });
    
    const finalY = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Total: ' + data.length + ' jugadores', margin, finalY);
    
    doc.save('plantilla_' + clubNombre.replace(/\s+/g, '_') + '.pdf');
    cerrarModalDescargarPlantilla();
}