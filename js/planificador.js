// ========== PLANIFICADOR.JS - TopLiderCoach HUB ==========
// Ejercicios, sesiones, PDF sesión, calendario unificado
let sesionEditandoId = null;

// Registro en el sistema de navegación
registrarInit(function() {
    cargarFiltrosOpciones();
    cargarEjercicios();
    cargarJugadoresSesion();
    renderizarSesion();
});

registrarModulo('planificador', function() {
    cargarJugadoresSesion();
});

registrarSubTab('planificador', 'mis-sesiones', cargarMisSesiones);
registrarSubTab('planificador', 'calendario', cargarCalendarioUnificado);

        async function cargarEjercicios(pagina = 1) {
            paginaEjercicios = pagina;
            const lista = document.getElementById('lista-ejercicios');
            lista.innerHTML = '<div class="loading">Cargando...</div>';
            
            try {
                // Construir URL con filtros
                let url = `${API_BASE}/ejercicios?page=${pagina}&per_page=10`;
                
                const buscar = document.getElementById('filtro-buscar')?.value;
                const entrenador = document.getElementById('filtro-entrenador')?.value;
                const equipo = document.getElementById('filtro-equipo')?.value;
                const tema = document.getElementById('filtro-tema')?.value;
                const dificultad = document.getElementById('filtro-dificultad')?.value;
                
                if (buscar) url += `&search=${encodeURIComponent(buscar)}`;
                if (entrenador) url += `&entrenador=${encodeURIComponent(entrenador)}`;
                if (equipo) url += `&equipo=${encodeURIComponent(equipo)}`;
                if (tema) url += `&tema=${encodeURIComponent(tema)}`;
                if (dificultad) url += `&dificultad=${dificultad}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (!data.ejercicios || data.ejercicios.length === 0) {
                    lista.innerHTML = '<p style="text-align:center;color:#9ca3af;">No hay ejercicios</p>';
                    return;
                }
                
                lista.innerHTML = data.ejercicios.map(ej => {
                    const ejercicioData = {
                        id: ej.id,
                        titulo: ej.titulo,
                        imagen: ej.imagen,
                        duracion: ej.duracion || 10
                    };
                    
                    return `
                    <div class="ejercicio-card" onclick="seleccionarEjercicio('${ej.id}')">
                        <img src="${ej.imagen || 'https://via.placeholder.com/80x60?text=Sin+img'}" alt="">
                        <div class="info">
                            <div class="titulo">${ej.titulo}</div>
                            <div class="tags">
                                ${ej.tema ? `<span class="tag">${ej.tema}</span>` : ''}
                                ${ej.dificultad ? `<span class="tag dificultad">Dif: ${ej.dificultad}</span>` : ''}
                            </div>
                        </div>
                        <button class="btn-agregar" 
                                data-ejercicio='${JSON.stringify(ejercicioData).replace(/'/g, "&#39;")}'
                                onclick="event.stopPropagation(); agregarEjercicioDesdeBoton(this)">
                            + Anadir
                        </button>
                    </div>
                `}).join('');
                
                // Paginación
                const pag = document.getElementById('paginacion-ejercicios');
                pag.innerHTML = `
                    <button class="btn-secondary" onclick="cargarEjercicios(${pagina - 1})" ${pagina <= 1 ? 'disabled' : ''}>Anterior</button>
                    <span style="margin: 0 15px;">Pagina ${pagina}</span>
                    <button class="btn-secondary" onclick="cargarEjercicios(${pagina + 1})" ${data.ejercicios.length < 10 ? 'disabled' : ''}>Siguiente</button>
                `;
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar</p>';
            }
        }
        var jugadoresPlantilla = [];
        var jugadoresSeleccionados = [];
        var gpsAsignaciones = {};
        var gpsColapsado = false;

        // Modo Club: recargar jugadores al cambiar el equipo del selector
        document.addEventListener('cmTeamChanged', function() {
            try { cargarJugadoresSesion(); } catch (e) { console.error(e); }
        });
        
        async function cargarJugadoresSesion() {
            const grid = document.getElementById('jugadores-sesion-grid');
            
            if (!seasonId) {
                grid.innerHTML = '<p style="color:#9ca3af;font-size:12px;grid-column:1/-1;text-align:center;">No hay temporada activa</p>';
                return;
            }
            
            try {
               let qJug = supabaseClient
                    .from('season_players')
                    .select('id, player_id, shirt_number, players(id, name, photo_url, position)')
                    .eq('season_id', seasonId);
                // Modo Club: filtrar por el equipo seleccionado en el header
                if (typeof cmState !== 'undefined' && cmState.activo && cmState.equipoSeleccionado) {
                    // Del equipo seleccionado O sin equipo asignado (datos historicos de clubes de un solo equipo)
                    qJug = qJug.or('team_id.eq.' + cmState.equipoSeleccionado.id + ',team_id.is.null');
                }
                const { data: jugadores, error } = await qJug.order('shirt_number');
                
                if (error) throw error;
                
                jugadoresPlantilla = jugadores || [];
                jugadoresSeleccionados = [];
                gpsAsignaciones = {};
                
                if (jugadoresPlantilla.length === 0) {
                    grid.innerHTML = '<p style="color:#9ca3af;font-size:12px;grid-column:1/-1;text-align:center;">No hay jugadores en la plantilla</p>';
                    return;
                }
                
                renderizarJugadoresSesion();
                
            } catch (error) {
                console.error('Error cargando jugadores:', error);
                grid.innerHTML = '<p style="color:red;font-size:12px;grid-column:1/-1;text-align:center;">Error al cargar</p>';
            }
        }
        
      var PLAN_GRUPOS_POS = [
            { nombre: 'PORTERIA', codigos: ['POR'] },
            { nombre: 'DEFENSA', codigos: ['LD','LI','CAD','CAI','DCD','DCC','DCI'] },
            { nombre: 'CENTRO DEL CAMPO', codigos: ['PIV','MCD','MC','MCI','MD','MI','ID','II','MP'] },
            { nombre: 'ATAQUE', codigos: ['ED','EI','DC'] }
        ];

        // Traduce cualquier formato de posicion (codigo o texto completo) al codigo canonico
        function planPosCodigo(pos) {
            if (!pos) return null;
            var up = String(pos).trim().toUpperCase();
            var codigos = ['POR','LD','LI','CAD','CAI','DCD','DCC','DCI','PIV','MCD','MC','MCI','MD','MI','ID','II','MP','ED','EI','DC'];
            if (codigos.indexOf(up) > -1) return up;
            var t = String(pos).toLowerCase();
            if (t.indexOf('portero') > -1) return 'POR';
            if (t.indexOf('lateral derecho') > -1) return 'LD';
            if (t.indexOf('lateral izquierdo') > -1) return 'LI';
            if (t.indexOf('carrilero derecho') > -1) return 'CAD';
            if (t.indexOf('carrilero izquierdo') > -1) return 'CAI';
            if (t.indexOf('central derecho') > -1) return 'DCD';
            if (t.indexOf('central izquierdo') > -1) return 'DCI';
            if (t.indexOf('central') > -1 || t.indexOf('defens') > -1) return 'DCC';
            if (t.indexOf('pivote') > -1 || t.indexOf('mediocentro defensivo') > -1) return 'PIV';
            if (t.indexOf('mediocentro derecho') > -1) return 'MCD';
            if (t.indexOf('mediocentro izquierdo') > -1) return 'MCI';
            if (t.indexOf('medio derecho') > -1) return 'MD';
            if (t.indexOf('medio izquierdo') > -1) return 'MI';
            if (t.indexOf('interior derecho') > -1) return 'ID';
            if (t.indexOf('interior izquierdo') > -1) return 'II';
            if (t.indexOf('mediapunta') > -1 || t.indexOf('media punta') > -1) return 'MP';
            if (t.indexOf('mediocentro') > -1 || t.indexOf('medio centro') > -1) return 'MC';
            if (t.indexOf('extremo derecho') > -1) return 'ED';
            if (t.indexOf('extremo izquierdo') > -1) return 'EI';
            if (t.indexOf('delantero') > -1 || t.indexOf('punta') > -1 || t.indexOf('ariete') > -1) return 'DC';
            return null;
        }

        function planAgruparPorPosicion(lista) {
            var grupos = [];
            var usados = {};
            lista.forEach(function(sp) {
                sp._posCode = planPosCodigo(sp.players ? sp.players.position : null);
            });
            PLAN_GRUPOS_POS.forEach(function(g) {
                var jugs = lista.filter(function(sp) {
                    return sp._posCode && g.codigos.indexOf(sp._posCode) > -1;
                });
                jugs.sort(function(a, b) {
                    var pa = g.codigos.indexOf(a._posCode);
                    var pb = g.codigos.indexOf(b._posCode);
                    if (pa !== pb) return pa - pb;
                    return (parseInt(a.shirt_number) || 999) - (parseInt(b.shirt_number) || 999);
                });
                jugs.forEach(function(sp) { usados[sp.id] = true; });
                if (jugs.length > 0) grupos.push({ nombre: g.nombre, jugadores: jugs });
            });
            var sinPos = lista.filter(function(sp) { return !usados[sp.id]; });
            if (sinPos.length > 0) grupos.push({ nombre: 'SIN POSICION', jugadores: sinPos });
            return grupos;
        }

      function renderizarJugadoresSesion() {
            const grid = document.getElementById('jugadores-sesion-grid');
            grid.style.maxHeight = 'none';
            grid.style.overflowY = 'visible';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(175px, 1fr))';
            grid.style.gap = '6px';
            grid.style.alignItems = 'stretch';
            
            const grupos = planAgruparPorPosicion(jugadoresPlantilla);
            
            grid.innerHTML = grupos.map(grupo => {
                const cabecera = `<div style="grid-column:1/-1;font-size:11px;font-weight:800;color:#7c3aed;letter-spacing:0.06em;border-bottom:2px solid #e9d5ff;padding:8px 2px 3px;">${grupo.nombre} (${grupo.jugadores.length})</div>`;
                const fichas = grupo.jugadores.map(sp => {
                const jugador = sp.players;
                const seleccionado = jugadoresSeleccionados.some(id => String(id) === String(sp.id));
                const foto = jugador?.photo_url;
                const inicial = jugador?.name ? jugador.name.charAt(0).toUpperCase() : '?';
                const posBadge = sp._posCode ? `<span style="font-size:9px;font-weight:700;color:#7c3aed;margin-left:auto;flex-shrink:0;">${sp._posCode}</span>` : '';
                return `
                    <div class="jugador-check ${seleccionado ? 'selected' : ''}" data-id="${sp.id}" style="display:flex;align-items:center;gap:7px;padding:6px 9px;border:1.5px solid ${seleccionado ? '#7c3aed' : '#e5e7eb'};background:${seleccionado ? '#f5f3ff' : '#fff'};border-radius:10px;cursor:pointer;min-width:0;">
                        <div class="jugador-foto-mini" style="flex-shrink:0;">
                            ${foto ? `<img src="${foto}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;">` 
                                   : `<span class="jugador-inicial" style="width:32px;height:32px;border-radius:50%;background:#6b21a8;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;">${inicial}</span>`}
                        </div>
                        <span class="dorsal" style="flex-shrink:0;font-size:11px;font-weight:800;color:#26215C;min-width:18px;text-align:center;">${sp.shirt_number || '?'}</span>
                        <span class="nombre" style="flex:1;min-width:0;font-size:12px;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${jugador?.name || 'Sin nombre'}</span>
                        ${posBadge}
                    </div>
                `;
                }).join('');
                return cabecera + fichas;
            }).join('');
            
            // Añadir eventos de clic
            grid.querySelectorAll('.jugador-check').forEach(el => {
                el.addEventListener('click', function() {
                    const spId = this.dataset.id;
                    toggleJugadorSesion(spId);
                });
            });
            
            actualizarContadorJugadores();
            renderizarSeccionGPS();
        }
        
      function toggleJugadorSesion(spId) {
            const idx = jugadoresSeleccionados.findIndex(id => String(id) === String(spId));
            if (idx > -1) {
                jugadoresSeleccionados.splice(idx, 1);
            } else {
                jugadoresSeleccionados.push(spId);
            }
            renderizarJugadoresSesion();
        }
        
        function toggleTodosJugadores() {
            if (jugadoresSeleccionados.length === jugadoresPlantilla.length) {
                jugadoresSeleccionados = [];
            } else {
                jugadoresSeleccionados = jugadoresPlantilla.map(sp => sp.id);
            }
            renderizarJugadoresSesion();
        }
        
        function actualizarContadorJugadores() {
            document.getElementById('contador-jugadores').textContent = `${jugadoresSeleccionados.length} seleccionados`;
            var inpNJ = document.getElementById('sesion-jugadores');
            if (inpNJ && jugadoresSeleccionados.length) inpNJ.value = jugadoresSeleccionados.length;
        }
        
        function obtenerJugadoresParaGuardar() {
            return jugadoresPlantilla
                .filter(sp => jugadoresSeleccionados.includes(sp.id))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.players?.position || null,
                    gps: gpsAsignaciones[sp.id] || null
                }));
        }

        // ========== ASIGNACION DE GPS (vestuario) ==========
        function gpsEnsureSeccion() {
            var grid = document.getElementById('jugadores-sesion-grid');
            if (!grid) return null;
            var sec = document.getElementById('gps-asignacion-seccion');
            if (!sec) {
                sec = document.createElement('div');
                sec.id = 'gps-asignacion-seccion';
                sec.style.cssText = 'margin-top:12px;border:1.5px solid #e5e7eb;border-radius:12px;background:#fff;overflow:hidden;';
                grid.insertAdjacentElement('afterend', sec);
            }
            return sec;
        }

        function gpsSeleccionados() {
            return jugadoresPlantilla.filter(function(sp) {
                return jugadoresSeleccionados.some(function(id) { return String(id) === String(sp.id); });
            }).sort(function(a, b) {
                return (parseInt(a.shirt_number) || 999) - (parseInt(b.shirt_number) || 999);
            });
        }

        function renderizarSeccionGPS() {
            var sec = gpsEnsureSeccion();
            if (!sec) return;
            var lista = gpsSeleccionados();
            if (lista.length === 0) { sec.style.display = 'none'; sec.innerHTML = ''; return; }
            sec.style.display = 'block';

            var filas = lista.map(function(sp) {
                var j = sp.players || {};
                var val = gpsAsignaciones[sp.id] || '';
                return '<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid #f3f4f6;">' +
                    '<span style="flex-shrink:0;font-size:11px;font-weight:800;color:#26215C;min-width:22px;text-align:center;">' + (sp.shirt_number || '?') + '</span>' +
                    '<span style="flex:1;min-width:0;font-size:12px;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (j.name || 'Sin nombre') + '</span>' +
                    '<span style="font-size:9px;font-weight:700;color:#7c3aed;flex-shrink:0;">' + (sp._posCode || '') + '</span>' +
                    '<input type="text" class="gps-input" data-spid="' + sp.id + '" value="' + String(val).replace(/"/g, '&quot;') + '" placeholder="GPS" maxlength="12" ' +
                    'style="flex-shrink:0;width:70px;padding:4px 6px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-weight:700;text-align:center;color:#26215C;">' +
                    '</div>';
            }).join('');

            sec.innerHTML =
                '<div id="gps-header" style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f5f3ff;cursor:pointer;flex-wrap:wrap;">' +
                    '<span style="font-size:12px;font-weight:800;color:#7c3aed;letter-spacing:0.04em;">ASIGNACI\u00d3N DE GPS</span>' +
                    '<span id="gps-contador" style="font-size:11px;color:#6b7280;"></span>' +
                    '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;">' +
                        '<button type="button" id="gps-btn-auto" style="font-size:11px;padding:4px 9px;border:1px solid #ddd6fe;background:#fff;border-radius:8px;cursor:pointer;color:#6b21a8;font-weight:600;">Auto 1,2,3...</button>' +
                        '<button type="button" id="gps-btn-ultima" style="font-size:11px;padding:4px 9px;border:1px solid #ddd6fe;background:#fff;border-radius:8px;cursor:pointer;color:#6b21a8;font-weight:600;">Copiar \u00faltima sesi\u00f3n</button>' +
                        '<button type="button" id="gps-btn-limpiar" style="font-size:11px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;cursor:pointer;color:#6b7280;">Limpiar</button>' +
                        '<button type="button" id="gps-btn-pdf" style="font-size:11px;padding:4px 9px;border:none;background:#7c3aed;border-radius:8px;cursor:pointer;color:#fff;font-weight:700;">PDF vestuario</button>' +
                    '</span>' +
                '</div>' +
                '<div id="gps-body" style="display:' + (gpsColapsado ? 'none' : 'block') + ';max-height:300px;overflow-y:auto;">' + filas + '</div>';

            sec.querySelector('#gps-header').addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') return;
                gpsColapsado = !gpsColapsado;
                document.getElementById('gps-body').style.display = gpsColapsado ? 'none' : 'block';
            });
            sec.querySelectorAll('.gps-input').forEach(function(inp) {
                inp.addEventListener('input', function() {
                    var v = this.value.trim();
                    if (v) { gpsAsignaciones[this.dataset.spid] = v; } else { delete gpsAsignaciones[this.dataset.spid]; }
                    gpsRefrescarEstado();
                });
                inp.addEventListener('click', function(e) { e.stopPropagation(); });
            });
            sec.querySelector('#gps-btn-auto').addEventListener('click', gpsAsignarAuto);
            sec.querySelector('#gps-btn-ultima').addEventListener('click', gpsCopiarUltimaAsignacion);
            sec.querySelector('#gps-btn-limpiar').addEventListener('click', function() {
                gpsAsignaciones = {};
                renderizarSeccionGPS();
            });
            sec.querySelector('#gps-btn-pdf').addEventListener('click', gpsGenerarPDF);

            gpsRefrescarEstado();
        }

        function gpsRefrescarEstado() {
            var sec = document.getElementById('gps-asignacion-seccion');
            if (!sec) return;
            var inputs = sec.querySelectorAll('.gps-input');
            var conteo = {};
            inputs.forEach(function(inp) {
                var v = inp.value.trim().toUpperCase();
                if (v) conteo[v] = (conteo[v] || 0) + 1;
            });
            var asignados = 0;
            inputs.forEach(function(inp) {
                var v = inp.value.trim().toUpperCase();
                if (v) asignados++;
                var dup = v && conteo[v] > 1;
                inp.style.borderColor = dup ? '#dc2626' : '#e5e7eb';
                inp.style.background = dup ? '#fef2f2' : '#fff';
            });
            var cont = document.getElementById('gps-contador');
            if (cont) cont.textContent = asignados + '/' + inputs.length + ' con GPS';
        }

        function gpsHayDuplicados() {
            var vals = [];
            gpsSeleccionados().forEach(function(sp) {
                var v = (gpsAsignaciones[sp.id] || '').trim().toUpperCase();
                if (v) vals.push(v);
            });
            return vals.length !== new Set(vals).size;
        }

        function gpsAsignarAuto() {
            var n = 1;
            gpsSeleccionados().forEach(function(sp) {
                gpsAsignaciones[sp.id] = String(n++);
            });
            renderizarSeccionGPS();
        }

        async function gpsCopiarUltimaAsignacion() {
            try {
                var res = await supabaseClient
                    .from('training_sessions')
                    .select('id, session_date, players')
                    .eq('club_id', clubId)
                    .order('session_date', { ascending: false })
                    .limit(15);
                if (res.error) throw res.error;
                var sesiones = (res.data || []).filter(function(s) { return String(s.id) !== String(sesionEditandoId); });
                var origen = null;
                for (var i = 0; i < sesiones.length; i++) {
                    var ps = sesiones[i].players;
                    if (Array.isArray(ps) && ps.some(function(j) { return j && j.gps; })) { origen = sesiones[i]; break; }
                }
                if (!origen) { showToast('No hay ninguna sesi\u00f3n anterior con GPS asignados'); return; }
                var mapa = {};
                origen.players.forEach(function(j) { if (j && j.player_id && j.gps) mapa[j.player_id] = j.gps; });
                var aplicados = 0;
                gpsSeleccionados().forEach(function(sp) {
                    if (mapa[sp.player_id]) { gpsAsignaciones[sp.id] = mapa[sp.player_id]; aplicados++; }
                });
                renderizarSeccionGPS();
                showToast('Copiados ' + aplicados + ' GPS de la sesi\u00f3n del ' + (origen.session_date || ''));
            } catch (e) {
                console.error('Error copiando GPS:', e);
                showToast('Error al copiar la \u00faltima asignaci\u00f3n');
            }
        }

        async function gpsGenerarPDF() {
            var lista = gpsSeleccionados().filter(function(sp) { return gpsAsignaciones[sp.id]; });
            if (lista.length === 0) { showToast('Asigna al menos un GPS antes de generar el PDF'); return; }
            if (gpsHayDuplicados()) { showToast('Hay n\u00fameros de GPS duplicados, rev\u00edsalos antes del PDF'); return; }

            lista.sort(function(a, b) {
                var va = String(gpsAsignaciones[a.id]), vb = String(gpsAsignaciones[b.id]);
                var na = parseInt(va, 10), nb = parseInt(vb, 10);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return va.localeCompare(vb, 'es', { numeric: true });
            });

            var clubNombre = '';
            try {
                var rc = await supabaseClient.from('clubs').select('name').eq('id', clubId).single();
                clubNombre = (rc.data && rc.data.name) || '';
            } catch (e) {}

            var nombreSesion = (document.getElementById('sesion-nombre').value || '').trim();
            var fechaVal = document.getElementById('sesion-fecha').value;
            var fechaTxt = '';
            if (fechaVal) {
                var d = new Date(fechaVal + 'T12:00:00');
                fechaTxt = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            }

            var doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
            var W = 210, margen = 15;

            function cabecera() {
                doc.setFillColor(38, 33, 92);
                doc.rect(0, 0, W, 26, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(17);
                doc.setFont(undefined, 'bold');
                doc.text('ASIGNACI\u00d3N DE GPS', margen, 12);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                var sub = [clubNombre, nombreSesion, fechaTxt].filter(Boolean).join('  |  ');
                doc.text(sub || ' ', margen, 20);
                doc.setTextColor(0, 0, 0);
            }

            var altoFila = 11;
            var y;
            function cabeceraTabla() {
                doc.setFillColor(124, 58, 237);
                doc.rect(margen, y, W - margen * 2, 9, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('GPS', margen + 6, y + 6.3);
                doc.text('DORSAL', margen + 32, y + 6.3);
                doc.text('JUGADOR', margen + 60, y + 6.3);
                doc.text('POS', W - margen - 16, y + 6.3);
                doc.setTextColor(0, 0, 0);
                y += 9;
            }

            cabecera();
            y = 34;
            cabeceraTabla();

            lista.forEach(function(sp, i) {
                if (y + altoFila > 285) {
                    doc.addPage();
                    cabecera();
                    y = 34;
                    cabeceraTabla();
                }
                if (i % 2 === 0) {
                    doc.setFillColor(245, 243, 255);
                    doc.rect(margen, y, W - margen * 2, altoFila, 'F');
                }
                var j = sp.players || {};
                doc.setFontSize(15);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(124, 58, 237);
                doc.text(String(gpsAsignaciones[sp.id]), margen + 6, y + 7.6);
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(String(sp.shirt_number || '-'), margen + 36, y + 7.4);
                doc.setFont(undefined, 'normal');
                doc.text(String(j.name || 'Sin nombre').substring(0, 32), margen + 60, y + 7.4);
                doc.setFontSize(10);
                doc.text(String(sp._posCode || ''), W - margen - 16, y + 7.2);
                y += altoFila;
            });

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('TopLiderCoach', margen, 292);

            var nombreArchivo = 'GPS_' + (fechaVal || 'sesion') + '.pdf';
            doc.save(nombreArchivo);
        }
      function toggleInfoSesion() {
            const info = document.getElementById('sesion-info-grid');
            const toggle = document.querySelector('.info-sesion-toggle');
            info.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        }
        function toggleFiltros() {
            const filtros = document.getElementById('filtros-biblioteca');
            const toggle = document.getElementById('filtros-toggle');
            filtros.classList.toggle('collapsed');
            toggle.classList.toggle('collapsed');
        }
        function limpiarFiltros() {
            document.getElementById('filtro-buscar').value = '';
            document.getElementById('filtro-entrenador').value = '';
            document.getElementById('filtro-equipo').value = '';
            document.getElementById('filtro-tema').value = '';
            document.getElementById('filtro-dificultad').value = '';
            cargarEjercicios(1);
        }
        
    async function cargarFiltrosOpciones() {
            try {
                const response = await fetch(`${API_BASE}/filtros`);
                const data = await response.json();
                
                if (data.success && data.filtros) {
                    if (data.filtros.entrenadores) {
                        const select = document.getElementById('filtro-entrenador');
                        data.filtros.entrenadores.forEach(e => {
                            select.innerHTML += `<option value="${e}">${e.replace(/_/g, ' ')}</option>`;
                        });
                    }
                    
                    if (data.filtros.equipos) {
                        const select = document.getElementById('filtro-equipo');
                        data.filtros.equipos.forEach(e => {
                            select.innerHTML += `<option value="${e}">${e.replace(/_/g, ' ')}</option>`;
                        });
                    }
                    
                    if (data.filtros.temas) {
                        const select = document.getElementById('filtro-tema');
                        data.filtros.temas.forEach(t => {
                            select.innerHTML += `<option value="${t}">${t}</option>`;
                        });
                    }
                }
            } catch (error) {
                console.error('Error cargando filtros:', error);
            }
        }
        
        function seleccionarEjercicio(ejercicioId) {
            // Si el ID es un UUID (ejercicio propio), redirigir a seleccionarMiEjercicio
            if (typeof ejercicioId === 'string' && ejercicioId.indexOf('-') > 0) {
                return seleccionarMiEjercicio(ejercicioId);
            }
            const detalle = document.getElementById('detalle-ejercicio');
            detalle.innerHTML = '<div class="loading">Cargando detalles...</div>';
            
            fetch(`${API_BASE}/ejercicio/${ejercicioId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const ej = data.ejercicio;
                        ejercicioSeleccionado = ej;
                        
                        detalle.className = 'detalle-ejercicio active';
                        detalle.innerHTML = `
                            <img src="${ej.imagen || 'https://via.placeholder.com/400x300?text=Sin+imagen'}" alt="${ej.titulo}">
                            <h3>${ej.titulo}</h3>
                            <div class="meta" style="font-size:13px;color:#666;line-height:1.8;margin-bottom:10px;">
                                ${ej.entrenador ? `<strong>Entrenador:</strong> ${ej.entrenador.replace(/_/g, ' ')}<br>` : ''}
                                ${ej.equipo ? `<strong>Equipo:</strong> ${ej.equipo.replace(/_/g, ' ')}<br>` : ''}
                                ${ej.tema ? `<strong>Tema:</strong> ${ej.tema}<br>` : ''}
                                ${ej.dificultad ? `<strong>Dificultad:</strong> ${ej.dificultad}<br>` : ''}
                                <strong>Duracion:</strong> ${ej.duracion || 10} min
                            </div>
                            ${ej.objetivo ? `
                                <div class="detalle-seccion">
                                    <h4>Objetivo</h4>
                                    <p>${ej.objetivo}</p>
                                </div>
                            ` : ''}
                            ${ej.organizacion ? `
                                <div class="detalle-seccion">
                                    <h4>Organizacion y Desarrollo</h4>
                                    <p>${ej.organizacion}</p>
                                </div>
                            ` : ''}
                            ${ej.url ? `<a href="${ej.url}" target="_blank" class="btn-ver-completo" title="Necesitas estar logeado en la página principal, no solo en el planificador">🎬 Ver video ejercicio</a>` : ''}
                            <button class="btn-primary purple" style="width:100%;margin-top:10px;" onclick="abrirModalSeccion()">Anadir a Sesion</button>
                        `;
                    } else {
                        detalle.innerHTML = '<p style="color:red;">Error al cargar el ejercicio</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    detalle.innerHTML = '<p style="color:red;">Error de conexion</p>';
                });
        }
        
        function abrirModalSeccion() {
            if (!ejercicioSeleccionado) return;
            document.getElementById('modal-seccion').style.display = 'flex';
        }
        
        function cerrarModalSeccion(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-seccion').style.display = 'none';
        }
        
    function seleccionarSeccion(seccion) {
            if (!ejercicioSeleccionado) return;
            
            // Funcion para limpiar HTML
            function limpiarHTML(html) {
                if (!html) return '';
                const temp = document.createElement('div');
                temp.innerHTML = html;
                return temp.textContent || temp.innerText || '';
            }
            
            const ejercicioParaSesion = {
                id: ejercicioSeleccionado.id,
                titulo: ejercicioSeleccionado.titulo,
                duracion: parseInt(document.getElementById('ejercicio-duracion-input').value) || 15,
                imagen: ejercicioSeleccionado.imagen || '',
                objetivo: limpiarHTML(ejercicioSeleccionado.objetivo),
                entrenador: ejercicioSeleccionado.entrenador || '',
                equipo: ejercicioSeleccionado.equipo || ''
            };
            
            sesion[seccion].push(ejercicioParaSesion);
            cerrarModalSeccion();
            renderizarSesion();
        }
        
        async function agregarEjercicioDesdeBoton(btn) {
            const ejercicioData = JSON.parse(btn.dataset.ejercicio);
            
            // Cargar detalles completos del ejercicio
            try {
                const response = await fetch(`${API_BASE}/ejercicio/${ejercicioData.id}`);
                const data = await response.json();
                
                if (data.success) {
                    const ej = data.ejercicio;
                    
                    // Funcion para limpiar HTML
                    function limpiarHTML(html) {
                        if (!html) return '';
                        const temp = document.createElement('div');
                        temp.innerHTML = html;
                        return temp.textContent || temp.innerText || '';
                    }
                    
                    ejercicioSeleccionado = {
                        id: ej.id,
                        titulo: ej.titulo,
                        duracion: ej.duracion || 10,
                        imagen: ej.imagen || '',
                        objetivo: limpiarHTML(ej.objetivo),
                        entrenador: ej.entrenador || '',
                        equipo: ej.equipo || ''
                    };
                    
                    abrirModalSeccion();
                }
            } catch (error) {
                console.error('Error cargando ejercicio:', error);
                showToast('Error al cargar el ejercicio');
            }
        }
        
        function renderizarSesion() {
            let duracionTotal = 0;
            
            ['previo', 'calentamiento', 'principal', 'enfriamiento', 'postcampo'].forEach(seccion => {
                const lista = document.getElementById(`lista-${seccion}`);
                const tiempo = document.getElementById(`tiempo-${seccion}`);
                
                const totalMin = sesion[seccion].reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                duracionTotal += totalMin;
                tiempo.textContent = `${totalMin} min`;
                
                if (sesion[seccion].length === 0) {
                    lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;font-size:13px;">Arrastra ejercicios aqui</p>';
              } else {
                    const totalEnSeccion = sesion[seccion].length;
                    lista.innerHTML = sesion[seccion].map((ej, idx) => `
                        <div class="ejercicio-en-sesion" ${ej.tipo === 'libre' ? 'style="border-left:4px solid #8b5cf6;"' : `onclick="seleccionarEjercicio('${ej.id}')" style="cursor: pointer;"`}>
                            <div>
                                <div class="nombre">${ej.tipo === 'libre' ? '📋 ' : ''}${ej.titulo}</div>
                                <div class="duracion">${ej.duracion} min${ej.tipo === 'libre' && ej.notas ? ' · <span style="font-style:italic;color:#8b5cf6;">' + (ej.notas.length > 60 ? ej.notas.slice(0, 60) + '…' : ej.notas) + '</span>' : ''}</div>
                            </div>
                            <button onclick="event.stopPropagation(); moverEjercicio('${seccion}', ${idx}, -1)" title="Subir" ${idx === 0 ? 'disabled' : ''} style="background:#e5e7eb; border:none; border-radius:4px; padding:4px 8px; cursor:${idx === 0 ? 'not-allowed' : 'pointer'}; opacity:${idx === 0 ? '0.3' : '1'}; font-size:11px; color:#374151; margin-right:2px;">▲</button>
                            <button onclick="event.stopPropagation(); moverEjercicio('${seccion}', ${idx}, 1)" title="Bajar" ${idx === totalEnSeccion - 1 ? 'disabled' : ''} style="background:#e5e7eb; border:none; border-radius:4px; padding:4px 8px; cursor:${idx === totalEnSeccion - 1 ? 'not-allowed' : 'pointer'}; opacity:${idx === totalEnSeccion - 1 ? '0.3' : '1'}; font-size:11px; color:#374151; margin-right:4px;">▼</button>
                            <button onclick="event.stopPropagation(); eqAbrirModal('${seccion}', ${idx})" title="Montar equipos" style="background:#ede9fe;color:#7c3aed;border:1px solid #c4b5fd;border-radius:6px;margin-right:4px;">👥${ej.equipos && ej.equipos.series ? ' ' + ej.equipos.series.length : ''}</button>
                            <button onclick="event.stopPropagation(); quitarEjercicio('${seccion}', ${idx})">Quitar</button>
                        </div>
                    `).join('');
                }
            });
            
            document.getElementById('duracion-total').textContent = `${duracionTotal} min`;
        }
        let bloqueLibreSeccion = null;
        function abrirModalBloqueLibre(seccion) {
            bloqueLibreSeccion = seccion;
            document.getElementById('bloque-libre-titulo').value = '';
            document.getElementById('bloque-libre-minutos').value = 15;
            document.getElementById('bloque-libre-notas').value = '';
            document.getElementById('modal-bloque-libre').style.display = 'flex';
        }
        function cerrarModalBloqueLibre() {
            document.getElementById('modal-bloque-libre').style.display = 'none';
        }
        function guardarBloqueLibre() {
            const titulo = document.getElementById('bloque-libre-titulo').value.trim();
            const minutos = parseInt(document.getElementById('bloque-libre-minutos').value) || 0;
            const notas = document.getElementById('bloque-libre-notas').value.trim();
            if (!titulo) { showToast('Pon un titulo al bloque (ej: Charla tactica)'); return; }
            if (!minutos || minutos < 1) { showToast('Indica los minutos del bloque'); return; }
            sesion[bloqueLibreSeccion].push({ tipo: 'libre', id: null, titulo: titulo, duracion: minutos, notas: notas, imagen: '', objetivo: '' });
            cerrarModalBloqueLibre();
            renderizarSesion();
        }

        function quitarEjercicio(seccion, idx) {
            sesion[seccion].splice(idx, 1);
            renderizarSesion();
        }
        function moverEjercicio(seccion, idx, direccion) {
            const nuevoIdx = idx + direccion;
            if (nuevoIdx < 0 || nuevoIdx >= sesion[seccion].length) return;
            const tmp = sesion[seccion][idx];
            sesion[seccion][idx] = sesion[seccion][nuevoIdx];
            sesion[seccion][nuevoIdx] = tmp;
            renderizarSesion();
        }
        
       function limpiarSesion() {
            if (typeof scCargarModelo === 'function') { scCargarModelo(); }
            if (typeof scReset === 'function') { scReset(); }
            sesionEditandoId = null;
            const ahora = new Date();
const fechaHoy = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0');
sesion = { nombre: '', fecha: fechaHoy, previo: [], calentamiento: [], principal: [], enfriamiento: [], postcampo: [] };
            document.getElementById('sesion-nombre').value = '';
            document.getElementById('sesion-fecha').value = sesion.fecha;
            document.getElementById('sesion-hora').value = '';
            document.getElementById('sesion-microciclo').value = '';
            document.getElementById('sesion-md').value = '';
            document.getElementById('sesion-jugadores').value = '';
            document.getElementById('sesion-equipo').value = '';
            document.getElementById('sesion-objetivo').value = '';
            document.getElementById('sesion-material').value = '';
            document.getElementById('sesion-notas').value = '';
            document.getElementById('sesion-rpe').value = '';
            renderizarSesion();
            jugadoresSeleccionados = [];
            renderizarJugadoresSesion();
        }
        
        async function guardarSesion() {
            const nombre = document.getElementById('sesion-nombre').value.trim();
            const fecha = document.getElementById('sesion-fecha').value;
            const hora = document.getElementById('sesion-hora').value;
            const microciclo = document.getElementById('sesion-microciclo').value.trim();
            const md = document.getElementById('sesion-md').value.trim();
            const jugadores = document.getElementById('sesion-jugadores').value;
            const equipo = document.getElementById('sesion-equipo').value.trim();
            const objetivo = document.getElementById('sesion-objetivo').value.trim();
            const material = document.getElementById('sesion-material').value.trim();
            const notas = document.getElementById('sesion-notas').value.trim();
            
            if (!nombre) {
                showToast('El nombre de la sesion es obligatorio');
                return;
            }
            
            try {
                const datosGuardar = {
                    club_id: clubId,
                    season_id: seasonId,
                    name: nombre,
                    session_date: fecha,
                    session_time: hora || null,
                    microciclo: microciclo || null,
                    match_day: md || null,
                    num_players: (typeof jugadoresSeleccionados !== 'undefined' && jugadoresSeleccionados.length) ? jugadoresSeleccionados.length : (jugadores ? parseInt(jugadores) : null),
                    team_category: equipo || null,
                    objective: objetivo || null,
                    materials: material || null,
                   notes: notas || null,
                    rpe: document.getElementById('sesion-rpe').value ? parseFloat(document.getElementById('sesion-rpe').value) : null,
                     warm_up: sesion.calentamiento,
                    main_part: sesion.principal,
                    cool_down: sesion.enfriamiento,
                    pre_field_work: sesion.previo,
                    post_field_work: sesion.postcampo,
                    players: obtenerJugadoresParaGuardar(),
                    fase: (typeof window._scFase !== 'undefined' ? window._scFase : null)
                };
                
                let sesionId;
                
                if (sesionEditandoId) {
                    // Actualizar sesión existente
                    const { error } = await supabaseClient
                        .from('training_sessions')
                        .update(datosGuardar)
                        .eq('id', sesionEditandoId);
                    
                    if (error) throw error;
                    sesionId = sesionEditandoId;
                } else {
                    // Crear nueva sesión
                    const { data: sesionCreada, error } = await supabaseClient
                        .from('training_sessions')
                        .insert(datosGuardar)
                        .select('id')
                        .single();
                    
                    if (error) throw error;
                    sesionId = sesionCreada?.id;
                }

// Solo crear asistencia automática al crear sesión NUEVA (no al editar)
if (!sesionEditandoId) {
    const jugadoresParaAsistencia = obtenerJugadoresParaGuardar();
    if (jugadoresParaAsistencia.length > 0 && sesionId) {
        const registrosAsistencia = jugadoresParaAsistencia.map(j => ({
            sesion_id: sesionId,
            jugador_id: j.player_id,
            asistio: true,
            motivo_ausencia: null,
            peso: null,
            wellness: null,
            estado_muscular: null,
            notas: null
        }));
        
        await supabaseClient
            .from('asistencia_sesiones')
            .insert(registrosAsistencia);
    }
}

if (typeof scGuardarConceptos === 'function') { await scGuardarConceptos(sesionId, !!sesionEditandoId); }
                showToast(sesionEditandoId ? 'Sesión actualizada correctamente' : 'Sesión guardada correctamente');
                sesionEditandoId = sesionId; // Permanecer en la sesión tras guardar (Nueva Sesion = empezar de cero)
                
            } catch (error) {
                showToast('Error al guardar: ' + error.message);
            }
        }
        
        // ========== PLANIFICADOR: MIS SESIONES ==========
        async function cargarMisSesiones() {
            const lista = document.getElementById('lista-mis-sesiones');
            lista.innerHTML = '<div class="loading">Cargando sesiones...</div>';
            
            try {
                const fechaDesde = document.getElementById('filtro-sesion-desde').value;
                const fechaHasta = document.getElementById('filtro-sesion-hasta').value;
                
                let query = supabaseClient
                    .from('training_sessions')
                    .select('*')
                    .eq('club_id', clubId);
                
                if (fechaDesde) query = query.gte('session_date', fechaDesde);
                if (fechaHasta) query = query.lte('session_date', fechaHasta);
                
                query = query.order('session_date', { ascending: false });
                
                const { data, error } = await query;
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    lista.innerHTML = '<div class="empty-state"><h3>No hay sesiones guardadas</h3><p>Crea tu primera sesion de entrenamiento</p></div>';
                    return;
                }
                
                lista.innerHTML = data.map(s => {
                    const cal = s.warm_up || [];
                    const pri = s.main_part || [];
                    const enf = s.cool_down || [];
                    const pre = s.pre_field_work || [];
                    const post = s.post_field_work || [];
                    const tPre = pre.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tPost = post.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    
                    const tCal = cal.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tPri = pri.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tEnf = enf.reduce((sum, ej) => sum + (ej.duracion || 0), 0);
                    const tTotal = tCal + tPri + tEnf + tPre + tPost;
                    const totalEj = pre.length + cal.length + pri.length + enf.length + post.length;
                    
                    const fechaObj = new Date(s.session_date + 'T12:00:00');
                    const diaSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][fechaObj.getDay()];
                    const diaNum = fechaObj.getDate();
                    const mesCorto = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][fechaObj.getMonth()];
                    const anio = fechaObj.getFullYear();
                    const hora = s.session_time ? s.session_time.slice(0, 5) : '';
                    
                    const microciclo = s.microciclo || '';
                    const md = s.match_day || '';
                    const equipo = s.team_category || '';
                    const objetivo = s.objective || '';
                    const numJugadores = s.num_players || (s.players ? s.players.length : 0);
                    
                    // Tags info
                    let tagsHTML = '';
                    if (microciclo) tagsHTML += `<span class="sc-tag micro">${microciclo}</span>`;
                    if (md) tagsHTML += `<span class="sc-tag md">${md}</span>`;
                    if (equipo) tagsHTML += `<span class="sc-tag equipo">${equipo}</span>`;
                    
                    return `
                        <div class="sc-card">
                            <div class="sc-date-strip">
                                <div class="sc-date-day">${diaSemana}</div>
                                <div class="sc-date-num">${diaNum}</div>
                                <div class="sc-date-month">${mesCorto} ${anio}</div>
                                ${hora ? `<div class="sc-date-time">⏱ ${hora}</div>` : ''}
                            </div>
                            <div class="sc-body">
                                <div class="sc-top-row">
                                    <h3 class="sc-title">${s.name}</h3>
                                    <div class="sc-total-badge">${tTotal} min</div>
                                </div>
                                ${tagsHTML ? `<div class="sc-tags">${tagsHTML}</div>` : ''}
                                ${objetivo ? `<div class="sc-objetivo"><span class="sc-obj-label">Objetivo:</span> ${objetivo}</div>` : ''}
                                <div class="sc-phases">
                                    ${pre.length ? `
                                    <div class="sc-phase" style="border-left-color:#8b5cf6;">
                                        <div class="sc-phase-bar" style="background:#8b5cf6;"></div>
                                        <div class="sc-phase-info">
                                            <span class="sc-phase-name">Trabajo previo</span>
                                            <span class="sc-phase-data"><strong>${pre.length}</strong> ej · ${tPre} min</span>
                                        </div>
                                    </div>` : ''}
                                    <div class="sc-phase warm">
                                        <div class="sc-phase-bar"></div>
                                        <div class="sc-phase-info">
                                            <span class="sc-phase-name">Calentamiento</span>
                                            <span class="sc-phase-data"><strong>${cal.length}</strong> ej · ${tCal} min</span>
                                        </div>
                                    </div>
                                    <div class="sc-phase main">
                                        <div class="sc-phase-bar"></div>
                                        <div class="sc-phase-info">
                                            <span class="sc-phase-name">Parte Principal</span>
                                            <span class="sc-phase-data"><strong>${pri.length}</strong> ej · ${tPri} min</span>
                                        </div>
                                    </div>
                                    <div class="sc-phase cool">
                                        <div class="sc-phase-bar"></div>
                                        <div class="sc-phase-info">
                                            <span class="sc-phase-name">Parte Final</span>
                                            <span class="sc-phase-data"><strong>${enf.length}</strong> ej · ${tEnf} min</span>
                                        </div>
                                    </div>
                                    ${post.length ? `
                                    <div class="sc-phase" style="border-left-color:#64748b;">
                                        <div class="sc-phase-bar" style="background:#64748b;"></div>
                                        <div class="sc-phase-info">
                                            <span class="sc-phase-name">Trabajo post-campo</span>
                                            <span class="sc-phase-data"><strong>${post.length}</strong> ej · ${tPost} min</span>
                                        </div>
                                    </div>` : ''}
                                </div>
                                <div class="sc-footer">
                                    <div class="sc-stats">
                                        <span class="sc-stat">🏋️ ${totalEj} ejercicios</span>
                                        ${numJugadores ? `<span class="sc-stat">👥 ${numJugadores} jugadores</span>` : ''}
                                    </div>
                                    <div class="sc-actions">
                                        <button class="sc-btn" style="background:#1e1b4b;" onclick="abrirModoVestuario('${s.id}')" title="Modo vestuario (presentacion)">📽️</button>
                                        <button class="sc-btn" style="background:#7c2d12;" onclick="abrirMontajesSesion('${s.id}')" title="Montajes de campo">🏟️</button>
                                        <button class="sc-btn sc-btn-cargar" onclick="cargarSesionEnEditor('${s.id}')" title="Cargar">✏️</button>
                                        <button class="sc-btn sc-btn-asistencia" onclick="abrirModalAsistenciaSesion('${s.id}')" title="Asistencia">📋</button>
                                        <button class="sc-btn sc-btn-pdf" onclick="abrirModalPDFSesion('${s.id}')" title="PDF">📄</button>
                                        <button class="sc-btn sc-btn-eliminar" onclick="eliminarSesion('${s.id}')" title="Eliminar">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar</p>';
            }
        }
        
        function limpiarFiltroSesiones() {
            document.getElementById('filtro-sesion-desde').value = '';
            document.getElementById('filtro-sesion-hasta').value = '';
            cargarMisSesiones();
        }
        
        async function cargarSesionEnEditor(id) {
            try {
                const { data } = await supabaseClient
                    .from('training_sessions')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                sesionEditandoId = id;
                if (typeof scCargarModelo === 'function') { await scCargarModelo(); }
                if (typeof scSetFase === 'function') { scSetFase(data.fase || null); }
                if (typeof scCargarConceptosDeSesion === 'function') { await scCargarConceptosDeSesion(id); }
                
                sesion = {
                    nombre: data.name,
                    fecha: data.session_date,
                    previo: data.pre_field_work || [],
                    calentamiento: data.warm_up || [],
                    principal: data.main_part || [],
                    enfriamiento: data.cool_down || [],
                    postcampo: data.post_field_work || []
                };
                
                // Campos principales
                document.getElementById('sesion-nombre').value = data.name || '';
                document.getElementById('sesion-fecha').value = data.session_date || '';
                document.getElementById('sesion-hora').value = data.session_time || '';
                document.getElementById('sesion-microciclo').value = data.microciclo || '';
                document.getElementById('sesion-md').value = data.match_day || '';
                document.getElementById('sesion-jugadores').value = data.num_players || '';
                document.getElementById('sesion-equipo').value = data.team_category || '';
                document.getElementById('sesion-objetivo').value = data.objective || '';
                document.getElementById('sesion-material').value = data.materials || '';
              document.getElementById('sesion-notas').value = data.notes || '';
                document.getElementById('sesion-rpe').value = data.rpe || '';
                
                // Cargar jugadores seleccionados
                if (data.players && Array.isArray(data.players)) {
                    jugadoresSeleccionados = data.players.map(j => j.id || j);
                    gpsAsignaciones = {};
                    data.players.forEach(function(j) { if (j && j.id && j.gps) gpsAsignaciones[j.id] = j.gps; });
                    renderizarJugadoresSesion();
                }
                
                renderizarSesion();
                
                // Cambiar a pestaña crear
                document.querySelector('.planificador-subtabs .sub-tab').click();
                
            } catch (error) {
                console.error('Error al cargar sesion:', error);
                showToast('Error al cargar sesion');
            }
        }
        
        async function eliminarSesion(id) {
            if (!await showConfirm('¿Eliminar esta sesion?')) return;
            
            await supabaseClient.from('training_sessions').delete().eq('id', id);
            cargarMisSesiones();
        }
        let sesionPDFId = null;

function abrirModalPDFSesion(id) {
    sesionPDFId = id;
    document.getElementById('modal-pdf-sesion').style.display = 'flex';
}

function cerrarModalPDFSesion(event) {
    if (!event || event.target.classList.contains('modal-overlay')) {
        document.getElementById('modal-pdf-sesion').style.display = 'none';
    }
}

function descargarPDFSesion(conTitulos) {
    const hojaPorEjercicio = document.getElementById('pdf-hoja-por-ejercicio') ? document.getElementById('pdf-hoja-por-ejercicio').checked : false;
    cerrarModalPDFSesion();
    exportarSesionPDF(sesionPDFId, conTitulos, hojaPorEjercicio);
}
async function exportarSesionPDF(id, conTitulos = true, hojaPorEjercicio = false) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            const { data: s } = await supabaseClient.from('training_sessions').select('*').eq('id', id).single();
            const { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
            
            const fecha = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
            const hora = s.session_time ? s.session_time.substring(0, 5) : '';
            
            // Funcion para limpiar texto
            function limpiarTexto(texto) {
                if (!texto) return '';
                return texto
                    .replace(/<[^>]*>/g, '')
                    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                    .replace(/[\u{2600}-\u{26FF}]/gu, '')
                    .replace(/[\u{2700}-\u{27BF}]/gu, '')
                    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
                    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
                    .replace(/[^\x00-\x7F\xA0-\xFF\u0100-\u017F]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            // Calcular duracion total
            const duracionTotal = (s.warm_up || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.main_part || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.cool_down || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.pre_field_work || []).reduce((sum, e) => sum + (e.duracion || 0), 0) +
                                  (s.post_field_work || []).reduce((sum, e) => sum + (e.duracion || 0), 0);
            
            // ===== HEADER =====
            doc.setFillColor(0, 51, 102);
            doc.rect(0, 0, 210, 28, 'F');
            
            // Escudo del club (si existe)
            let tituloX = 10;
            if (club && club.logo_url) {
                try {
                    doc.addImage(club.logo_url, 'PNG', 8, 3, 22, 22);
                    tituloX = 35;
                } catch (e) {
                    console.log('No se pudo cargar el escudo');
                }
            }
            
            // Titulo sesion
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(s.name.toUpperCase(), tituloX, 10);
            
            // Nombre del club
            if (club && club.name) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(club.name, tituloX, 16);
            }
            
            // Info en header (fila)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            const headerInfo = [];
            headerInfo.push(`Fecha: ${fecha}`);
            if (hora) headerInfo.push(`Hora: ${hora}`);
            if (s.microciclo) headerInfo.push(`Microciclo: ${s.microciclo}`);
            if (s.match_day) headerInfo.push(`MD: ${s.match_day}`);
            if (s.num_players) headerInfo.push(`Jugadores: ${s.num_players}`);
            if (s.team_category) headerInfo.push(`Equipo: ${s.team_category}`);
            headerInfo.push(`Duracion: ${duracionTotal} min`);
            
            doc.text(headerInfo.join('   |   '), tituloX, 24);
            
            // Linea amarilla decorativa
            doc.setFillColor(255, 204, 0);
            doc.rect(0, 28, 210, 2, 'F');
            
            let y = 35;
            
            // ===== Jugadores aptos para entrenar =====
         // ===== Jugadores aptos para entrenar =====
if (s.players && s.players.length > 0) {
    s.players.forEach(j => { j._posCode = planPosCodigo(j.position); });
    const hayPosiciones = s.players.some(j => j._posCode);

    if (!hayPosiciones) {
        // Sesiones antiguas sin posicion guardada: formato plano
        const nombresJugadores = s.players.map(j => `${j.shirt_number || '?'}.${j.name}`).join('  |  ');
        const jugadoresLines = doc.splitTextToSize(nombresJugadores, 155);
        const alturaBloque = 10 + (jugadoresLines.length * 4);

        doc.setFillColor(240, 240, 240);
        doc.rect(10, y, 190, alturaBloque, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('CONVOCADOS:', 12, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);

        jugadoresLines.forEach((linea, idx) => {
            doc.text(linea, 38, y + 5 + (idx * 4));
        });

        y += alturaBloque + 4;
    } else {
        // Agrupar convocados por linea (posicion general)
        const gruposPDF = [
            { nombre: 'PORTERIA', codigos: ['POR'] },
            { nombre: 'DEFENSA', codigos: ['LD','LI','CAD','CAI','DCD','DCC','DCI'] },
            { nombre: 'CENTRO CAMPO', codigos: ['PIV','MCD','MC','MCI','MD','MI','ID','II','MP'] },
            { nombre: 'ATAQUE', codigos: ['ED','EI','DC'] }
        ];
        const filasPDF = [];
        const usadosPDF = {};
        gruposPDF.forEach(g => {
            const jugs = s.players.filter(j => j._posCode && g.codigos.indexOf(j._posCode) > -1);
            jugs.sort((a, b) => {
                const pa = g.codigos.indexOf(a._posCode);
                const pb = g.codigos.indexOf(b._posCode);
                if (pa !== pb) return pa - pb;
                return (parseInt(a.shirt_number) || 999) - (parseInt(b.shirt_number) || 999);
            });
            jugs.forEach(j => { usadosPDF[j.id] = true; });
            if (jugs.length > 0) {
                const texto = jugs.map(j => `${j.shirt_number || '?'}.${j.name}`).join('  |  ');
                filasPDF.push({ titulo: g.nombre, lineas: doc.splitTextToSize(texto, 126) });
            }
        });
        const sinPosPDF = s.players.filter(j => !usadosPDF[j.id]);
        if (sinPosPDF.length > 0) {
            const texto = sinPosPDF.map(j => `${j.shirt_number || '?'}.${j.name}`).join('  |  ');
            filasPDF.push({ titulo: 'SIN POSICION', lineas: doc.splitTextToSize(texto, 126) });
        }

        const totalLineas = filasPDF.reduce((sum, f) => sum + f.lineas.length, 0);
        const alturaBloque = 8 + (totalLineas * 4);

        doc.setFillColor(240, 240, 240);
        doc.rect(10, y, 190, alturaBloque, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('CONVOCADOS:', 12, y + 5);

        doc.setFontSize(7);
        let yLinea = y + 5;
        filasPDF.forEach(f => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 51, 102);
            doc.text(f.titulo + ':', 40, yLinea);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            f.lineas.forEach(linea => {
                doc.text(linea, 68, yLinea);
                yLinea += 4;
            });
        });

        y += alturaBloque + 4;
    }
}
            
            y += 3;
            
            // ===== OBJETIVO GENERAL =====
            if (s.objective) {
                doc.setFillColor(240, 240, 240);
                doc.rect(10, y - 4, 190, 12, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 51, 102);
                doc.text('OBJETIVO:', 12, y + 2);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(50, 50, 50);
                const objText = doc.splitTextToSize(limpiarTexto(s.objective), 150);
                doc.text(objText[0], 35, y + 2);
                y += 14;
            }
            
            // ===== MATERIAL =====
            if (s.materials) {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 100, 100);
                doc.text('Material: ', 10, y);
                doc.setFont('helvetica', 'normal');
                doc.text(limpiarTexto(s.materials), 28, y);
                y += 8;
            }
            
            // ===== SECCIONES =====
            const secciones = [
                { nombre: 'TRABAJO PREVIO A CAMPO', datos: s.pre_field_work || [], color: [139, 92, 246] },
                { nombre: 'CALENTAMIENTO', datos: s.warm_up || [], color: [255, 153, 0] },
                { nombre: 'PARTE PRINCIPAL', datos: s.main_part || [], color: [0, 102, 204] },
                { nombre: 'PARTE FINAL', datos: s.cool_down || [], color: [0, 153, 76] },
                { nombre: 'TRABAJO POST-CAMPO', datos: s.post_field_work || [], color: [100, 116, 139] }
            ];
            
            // Recuperar miniaturas de ejercicios propios que se guardaron sin imagen
            for (const sec of secciones) {
                for (const ej of sec.datos) {
                    if ((!ej.imagen || ej.imagen.indexOf('data:') !== 0) && typeof ej.id === 'string' && ej.id.indexOf('-') > 0) {
                        try {
                            const resEj = await supabaseClient.from('custom_exercises').select('thumbnail_svg').eq('id', ej.id).single();
                            if (resEj.data && resEj.data.thumbnail_svg) {
                                if (resEj.data.thumbnail_svg.indexOf('data:') === 0) {
                                    ej.imagen = resEj.data.thumbnail_svg;
                                } else {
                                    ej.imagen = await ejSvgToPng(resEj.data.thumbnail_svg);
                                }
                            }
                        } catch(e) { /* sin miniatura, se deja vacío */ }
                    }
                }
            }
            
            for (const sec of secciones) {
                if (sec.datos.length > 0) {
                    const tiempoSeccion = sec.datos.reduce((sum, e) => sum + (e.duracion || 0), 0);
                    
                    // En modo "hoja por ejercicio": la primera seccion con ejercicios va en la portada,
                    // y cada seccion siguiente empieza en pagina nueva junto a su primer ejercicio
                    if (hojaPorEjercicio && secciones.findIndex(x => x.datos.length > 0) !== secciones.indexOf(sec)) {
                        doc.addPage();
                        y = 20;
                    } else if (y > 260) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    // Header seccion
                    doc.setFillColor(...sec.color);
                    doc.rect(10, y, 190, 8, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text(sec.nombre, 12, y + 6);
                    doc.text(tiempoSeccion + ' min', 195, y + 6, { align: 'right' });
                    y += 12;
                    
                    // Ejercicios de la seccion
                    for (let i = 0; i < sec.datos.length; i++) {
                        const ej = sec.datos[i];

                        if (ej.tipo === 'libre') {
                            if (hojaPorEjercicio && i > 0) { doc.addPage(); y = 20; }
                            const notasLineas = ej.notas ? doc.splitTextToSize(limpiarTexto(ej.notas), 180) : [];
                            const alturaBloque = 14 + notasLineas.length * 4;
                            if (y + alturaBloque > 280) { doc.addPage(); y = 20; }
                            doc.setFillColor(237, 233, 254);
                            doc.rect(10, y, 190, 7, 'F');
                            doc.setTextColor(76, 29, 149);
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`${i + 1}. ${ej.titulo}`, 12, y + 5);
                            doc.setFont('helvetica', 'normal');
                            doc.text(`${ej.duracion} min`, 195, y + 5, { align: 'right' });
                            y += 10;
                            if (notasLineas.length) {
                                doc.setFontSize(8);
                                doc.setTextColor(60, 60, 60);
                                doc.text(notasLineas, 12, y + 3);
                                y += notasLineas.length * 4 + 3;
                            }
                            y += 3;
                            continue;
                        }

                        const alturaEjercicio = 45;
                        
                        // Modo "una hoja por ejercicio": salto de pagina solo ENTRE ejercicios
                        // (el primer ejercicio de cada seccion va pegado a su encabezado)
                        if (hojaPorEjercicio && i > 0) {
                            doc.addPage();
                            y = 20;
                        }
                        
                  
                        
                        // Verificar espacio, nueva pagina si necesario
                        if (y + alturaEjercicio > 280) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        // Fila del titulo
                        doc.setFillColor(245, 245, 245);
                        doc.rect(10, y, 190, 7, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'bold');
                        doc.text(conTitulos ? `${i + 1}. ${ej.titulo}` : `Ejercicio ${i + 1}`, 12, y + 5);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(100, 100, 100);
                        doc.text(`${ej.duracion} min`, 195, y + 5, { align: 'right' });
                        y += 9;
                        
                        const contenidoY = y;
                        
                        // === COLUMNA 1: IMAGEN (izquierda) ===
                        const imgX = 10;
                        const imgWidth = 55;
                        const imgHeight = 35;
                        
                        if (ej.imagen) {
                            try {
                                doc.addImage(ej.imagen, 'JPEG', imgX, contenidoY, imgWidth, imgHeight);
                            } catch (e) {
                                doc.setDrawColor(200, 200, 200);
                                doc.rect(imgX, contenidoY, imgWidth, imgHeight);
                                doc.setFontSize(7);
                                doc.setTextColor(150, 150, 150);
                                doc.text('Sin imagen', imgX + 18, contenidoY + 18);
                            }
                        } else {
                            doc.setDrawColor(200, 200, 200);
                            doc.rect(imgX, contenidoY, imgWidth, imgHeight);
                            doc.setFontSize(7);
                            doc.setTextColor(150, 150, 150);
                            doc.text('Sin imagen', imgX + 18, contenidoY + 18);
                        }
                        
                        // === COLUMNA 2: DESCRIPCION (centro) ===
                        const descX = 70;
                        const descWidth = 65;
                        
                        doc.setDrawColor(230, 230, 230);
                        doc.rect(descX, contenidoY, descWidth, imgHeight);
                        
                        if (ej.objetivo) {
                            doc.setFontSize(7);
                            doc.setTextColor(60, 60, 60);
                            const objetivoLimpio = limpiarTexto(ej.objetivo);
                            const objetivoLines = doc.splitTextToSize(objetivoLimpio, descWidth - 4);
                            const lineasMostrar = objetivoLines.slice(0, 8);
                            doc.text(lineasMostrar, descX + 2, contenidoY + 4);
                        } else {
                            doc.setFontSize(7);
                            doc.setTextColor(180, 180, 180);
                            doc.text('Sin descripcion', descX + 15, contenidoY + 18);
                        }
                        
                        // === COLUMNA 3: NOTAS ENTRENADOR (derecha) ===
                        const notasX = 140;
                        const notasWidth = 60;
                        
                        doc.setDrawColor(230, 230, 230);
                        doc.rect(notasX, contenidoY, notasWidth, imgHeight);
                        
                        // Titulo "Notas"
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.setTextColor(150, 150, 150);
                        doc.text('Notas:', notasX + 2, contenidoY + 4);
                        doc.setFont('helvetica', 'normal');
                        
                        // Lineas para escribir
                        doc.setDrawColor(220, 220, 220);
                        for (let lineY = contenidoY + 10; lineY < contenidoY + imgHeight - 2; lineY += 6) {
                            doc.line(notasX + 2, lineY, notasX + notasWidth - 2, lineY);
                        }
                        
                        y = contenidoY + imgHeight + 5;
                        
                        // Dibujar los equipos del ejercicio (si los tiene)
                        if (ej.equipos && typeof eqDibujarEquiposPDF === 'function') {
                            y = eqDibujarEquiposPDF(doc, ej, s.players || [], y, hojaPorEjercicio);
                        }
                    }
                    
                    y += 5;
                }
            }
            
            // ===== NOTAS GENERALES =====
            if (s.notes) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFillColor(255, 255, 200);
                const notasLines = doc.splitTextToSize(limpiarTexto(s.notes), 180);
                doc.rect(10, y, 190, 8 + notasLines.length * 4, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 80, 0);
                doc.text('NOTAS:', 12, y + 5);
                doc.setFont('helvetica', 'normal');
                doc.text(notasLines, 30, y + 5);
            }
            
            // ===== FOOTER =====
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('TopLiderCoach.com', 105, 292, { align: 'center' });
            }
            
            doc.save(`sesion_${s.name.replace(/\s+/g, '_')}.pdf`);
        }
            
          
       
        
        // ========== CALENDARIO UNIFICADO (Sesiones + Partidos) ==========
        
        let calendarioMes = new Date().getMonth();
        let calendarioAnio = new Date().getFullYear();
        
        async function cargarCalendarioUnificado() {
            const mesActualEl = document.getElementById('mes-actual-calendario');
            if (mesActualEl) mesActualEl.textContent = `${MESES[calendarioMes]} ${calendarioAnio}`;
            
            const primerDia = new Date(calendarioAnio, calendarioMes, 1);
            const ultimoDia = new Date(calendarioAnio, calendarioMes + 1, 0);
            
            const inicioMes = `${calendarioAnio}-${String(calendarioMes + 1).padStart(2, '0')}-01`;
            const finMes = `${calendarioAnio}-${String(calendarioMes + 1).padStart(2, '0')}-${ultimoDia.getDate()}`;
            
            // Cargar sesiones del mes
            const { data: sesiones, error: errorSesiones } = await supabaseClient
                .from('training_sessions')
                .select('id, name, session_date, session_time')
                .eq('club_id', clubId)
                .gte('session_date', inicioMes)
                .lte('session_date', finMes)
                .order('session_date');
            
            if (errorSesiones) console.error('Error cargando sesiones:', errorSesiones);
            
            // Cargar partidos del mes
            let queryPartidos = supabaseClient
                .from('matches')
                .select('*')
                .eq('club_id', clubId)
                .gte('match_date', inicioMes)
                .lte('match_date', finMes)
                .order('match_date');
            
            if (seasonId) queryPartidos = queryPartidos.eq('season_id', seasonId);
            
            const { data: partidos } = await queryPartidos;
            
            // Cargar marcadores del mes (descanso, voluntario, viaje, otro)
            const { data: marcadores } = await supabaseClient
                .from('calendario_marcadores')
                .select('*')
                .eq('club_id', clubId)
                .gte('fecha', inicioMes)
                .lte('fecha', finMes);
            const marcadoresPorDia = {};
            (marcadores || []).forEach(m => {
                const dia = new Date(m.fecha + 'T12:00:00').getDate();
                if (!marcadoresPorDia[dia]) marcadoresPorDia[dia] = [];
                marcadoresPorDia[dia].push(m);
            });
            
            // Agrupar por día
            const sesionesPorDia = {};
            (sesiones || []).forEach(s => {
                const dia = new Date(s.session_date + 'T12:00:00').getDate();
                if (!sesionesPorDia[dia]) sesionesPorDia[dia] = [];
                sesionesPorDia[dia].push(s);
            });
            
            const partidosPorDia = {};
            (partidos || []).forEach(p => {
                const dia = new Date(p.match_date + 'T12:00:00').getDate();
                if (!partidosPorDia[dia]) partidosPorDia[dia] = [];
                partidosPorDia[dia].push(p);
            });
            
            // Escudo del club
            const miEscudo = clubData?.logo_url || '';
            
            // Generar grid
            const grid = document.getElementById('calendario-unificado');
            let html = '';
            
            // Headers
            ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(d => {
                html += `<div class="calendario-dia-header">${d}</div>`;
            });
            
            // Días vacíos
            let diaInicio = primerDia.getDay() || 7;
            for (let i = 1; i < diaInicio; i++) {
                html += '<div class="calendario-dia otro-mes"></div>';
            }
            
            // Días del mes
            const hoy = new Date();
            for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
                const esHoy = dia === hoy.getDate() && calendarioMes === hoy.getMonth() && calendarioAnio === hoy.getFullYear();
                const tieneSesion = sesionesPorDia[dia] && sesionesPorDia[dia].length > 0;
                const tienePartido = partidosPorDia[dia] && partidosPorDia[dia].length > 0;
                const esSabado = new Date(calendarioAnio, calendarioMes, dia).getDay() === 6;
                const esDomingo = new Date(calendarioAnio, calendarioMes, dia).getDay() === 0;
                
                let eventosHTML = '';
                
                // Sesiones del día
                if (tieneSesion) {
                    sesionesPorDia[dia].forEach(s => {
                        const hora = s.session_time ? s.session_time.slice(0, 5) : '';
                        eventosHTML += `
                            <div class="cal-evento cal-sesion" onclick="cargarSesionEnEditor('${s.id}')">
                                <span class="cal-evento-nombre">${s.name}</span>
                                ${hora ? `<span class="cal-evento-hora">${hora}</span>` : ''}
                            </div>`;
                    });
                }
                
                // Partidos del día
                if (tienePartido) {
                    partidosPorDia[dia].forEach(p => {
                        const esLocal = p.home_away === 'home';
                        const jugado = !!p.result;
                        const resultClass = jugado ? (p.result === 'win' ? 'victoria' : (p.result === 'draw' ? 'empate' : 'derrota')) : 'pendiente';
                        
                        let info = '';
                        if (jugado) {
                            const gF = p.team_goals || 0;
                            const gC = p.opponent_goals || 0;
                            info = esLocal ? `${gF}-${gC}` : `${gC}-${gF}`;
                        } else {
                            info = p.kick_off_time ? p.kick_off_time.slice(0, 5) : 'TBD';
                        }
                        
                        const escudoRival = p.opponent_logo 
                            ? `<img src="${p.opponent_logo}" class="cal-escudo">` 
                            : '';
                        
                        eventosHTML += `
                            <div class="cal-evento cal-partido ${resultClass}" onclick="verPartido('${p.id}')">
                                ${escudoRival}
                                <span class="cal-evento-nombre">${p.opponent}</span>
                                <span class="cal-partido-resultado">${info}</span>
                            </div>`;
                    });
                }
                
                // Marcadores del día
                const fechaISO = `${calendarioAnio}-${String(calendarioMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                if (marcadoresPorDia[dia]) {
                    marcadoresPorDia[dia].forEach(m => {
                        const infoM = CAL_TIPOS_MARCADOR[m.tipo] || CAL_TIPOS_MARCADOR.otro;
                        const etiqueta = (m.tipo === 'otro' && m.nota) ? m.nota : infoM.label;
                        eventosHTML += `
                            <div class="cal-evento" onclick="calQuitarMarcador('${m.id}', '${etiqueta.replace(/['"]/g, '')}')" title="Clic para quitar este marcador" style="background:${infoM.bg};color:${infoM.color};cursor:pointer">
                                <span class="cal-evento-nombre">${infoM.icono} ${etiqueta}</span>
                            </div>`;
                    });
                }
                
                html += `
                    <div class="calendario-dia ${esHoy ? 'hoy' : ''} ${esSabado || esDomingo ? 'fin-semana' : ''} ${tienePartido ? 'dia-partido' : ''}" style="position:relative">
                        <div class="numero">${dia}</div>
                        <span onclick="calAbrirMenuMarcador('${fechaISO}')" title="Marcar día (descanso, voluntario, viaje...)" style="position:absolute;top:4px;right:6px;cursor:pointer;color:#94a3b8;font-size:13px;font-weight:700;line-height:1">＋</span>
                        ${eventosHTML}
                    </div>
                `;
            }
            
            grid.innerHTML = html;
            
            // Resumen del mes
            const resumenEl = document.getElementById('calendario-resumen');
            if (resumenEl) {
                const numSesiones = (sesiones || []).length;
                const numPartidos = (partidos || []).length;
                const victorias = (partidos || []).filter(p => p.result === 'win').length;
                const empates = (partidos || []).filter(p => p.result === 'draw').length;
                const derrotas = (partidos || []).filter(p => p.result === 'loss').length;
                const pendientes = (partidos || []).filter(p => !p.result).length;
                
                resumenEl.innerHTML = `
                    <div class="resumen-item"><span class="resumen-num">${numSesiones}</span><span class="resumen-label">Sesiones</span></div>
                    <div class="resumen-item"><span class="resumen-num">${numPartidos}</span><span class="resumen-label">Partidos</span></div>
                    <div class="resumen-item victoria"><span class="resumen-num">${victorias}</span><span class="resumen-label">Victorias</span></div>
                    <div class="resumen-item empate"><span class="resumen-num">${empates}</span><span class="resumen-label">Empates</span></div>
                    <div class="resumen-item derrota"><span class="resumen-num">${derrotas}</span><span class="resumen-label">Derrotas</span></div>
                    <div class="resumen-item pendiente"><span class="resumen-num">${pendientes}</span><span class="resumen-label">Pendientes</span></div>
                `;
            }
        }
        
        function mesAnteriorCalendario() {
            calendarioMes--;
            if (calendarioMes < 0) { calendarioMes = 11; calendarioAnio--; }
            cargarCalendarioUnificado();
        }
        
        function mesSiguienteCalendario() {
            calendarioMes++;
            if (calendarioMes > 11) { calendarioMes = 0; calendarioAnio++; }
            cargarCalendarioUnificado();
        }
        
        // ===== Marcadores de día del calendario =====
        const CAL_TIPOS_MARCADOR = {
            descanso:   { label: 'Descanso',   icono: '🛌', bg: '#e2e8f0', color: '#334155' },
            voluntario: { label: 'Voluntario', icono: '🤝', bg: '#dcfce7', color: '#166534' },
            viaje:      { label: 'Viaje',      icono: '🚌', bg: '#ede9fe', color: '#5b21b6' },
            otro:       { label: 'Otro',       icono: '📝', bg: '#fef9c3', color: '#854d0e' }
        };
        
        function calAbrirMenuMarcador(fechaISO) {
            const prev = document.getElementById('cal-marc-ov');
            if (prev) prev.remove();
            const fFmt = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            let botones = '';
            Object.keys(CAL_TIPOS_MARCADOR).forEach(t => {
                const i = CAL_TIPOS_MARCADOR[t];
                botones += `<button onclick="calElegirMarcador('${fechaISO}','${t}')" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:10px 14px;margin-bottom:6px;background:${i.bg};color:${i.color};border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">${i.icono} ${t === 'otro' ? 'Otro (con nota)' : i.label}</button>`;
            });
            const ov = document.createElement('div');
            ov.id = 'cal-marc-ov';
            ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
            ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
            ov.innerHTML = `
                <div style="background:#fff;border-radius:14px;padding:20px;max-width:320px;width:100%">
                    <div style="font-weight:700;color:#1f2937;margin-bottom:2px">Marcar día</div>
                    <div style="font-size:12px;color:#6b7280;margin-bottom:14px;text-transform:capitalize">${fFmt}</div>
                    ${botones}
                    <div id="cal-marc-nota" style="display:none;margin-top:4px">
                        <input type="text" id="cal-marc-nota-input" placeholder="Ej: charla táctica, acto del club..." style="width:100%;padding:9px 11px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;box-sizing:border-box;margin-bottom:8px">
                        <button onclick="calGuardarMarcador(document.getElementById('cal-marc-ov').dataset.fecha,'otro',document.getElementById('cal-marc-nota-input').value)" style="width:100%;padding:9px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Guardar</button>
                    </div>
                </div>`;
            ov.dataset.fecha = fechaISO;
            document.body.appendChild(ov);
        }
        
        function calElegirMarcador(fechaISO, tipo) {
            if (tipo === 'otro') {
                const zona = document.getElementById('cal-marc-nota');
                if (zona) { zona.style.display = 'block'; document.getElementById('cal-marc-nota-input').focus(); }
                return;
            }
            calGuardarMarcador(fechaISO, tipo, null);
        }
        
        async function calGuardarMarcador(fechaISO, tipo, nota) {
            try {
                const { error } = await supabaseClient
                    .from('calendario_marcadores')
                    .insert({ club_id: clubId, fecha: fechaISO, tipo: tipo, nota: (nota || '').trim() || null });
                if (error) {
                    if (String(error.message).indexOf('duplicate') > -1 || String(error.code) === '23505') {
                        showToast('Ese día ya tiene ese marcador');
                    } else { throw error; }
                } else {
                    showToast('Día marcado');
                }
                const ov = document.getElementById('cal-marc-ov');
                if (ov) ov.remove();
                cargarCalendarioUnificado();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }
        
        async function calQuitarMarcador(id, etiqueta) {
            if (!confirm('¿Quitar el marcador "' + etiqueta + '" de este día?')) return;
            try {
                const { error } = await supabaseClient.from('calendario_marcadores').delete().eq('id', id);
                if (error) throw error;
                showToast('Marcador quitado');
                cargarCalendarioUnificado();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }
        
        window.calAbrirMenuMarcador = calAbrirMenuMarcador;
        window.calElegirMarcador = calElegirMarcador;
        window.calGuardarMarcador = calGuardarMarcador;
        window.calQuitarMarcador = calQuitarMarcador;
        // ========== PDF DEL CALENDARIO (mes en cuadricula / rangos en lista) ==========

function calPdfMenu(btn) {
    let menu = document.getElementById('cal-pdf-menu');
    if (menu) { menu.remove(); return; }
    menu = document.createElement('div');
    menu.id = 'cal-pdf-menu';
    menu.style.cssText = 'position:absolute;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:6px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.4);min-width:180px;';
    const opciones = [
        { l: 'Semana para jugadores', r: 'semana_jug' },
        { l: 'Este mes', r: 'mes' },
        { l: 'Trimestre (3 meses)', r: 'trimestre' },
        { l: 'Semestre (6 meses)', r: 'semestre' },
        { l: 'Temporada completa', r: 'temporada' }
    ];
    let h = '';
    opciones.forEach(function(o) {
        var accion = (o.r === 'semana_jug') ? 'calPdfSemanaJugadores()' : ('calGenerarPDF(\'' + o.r + '\')');
        h += '<div onclick="' + accion + '" style="padding:8px 12px;color:#e2e8f0;font-size:13px;cursor:pointer;border-radius:6px" onmouseenter="this.style.background=\'#334155\'" onmouseleave="this.style.background=\'transparent\'">' + o.l + '</div>';
    });
    menu.innerHTML = h;
    const rect = btn.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 4) + 'px';
    menu.style.left = (window.scrollX + rect.left) + 'px';
    document.body.appendChild(menu);
    setTimeout(function() {
        document.addEventListener('click', function cerrar(e) {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', cerrar);
            }
        });
    }, 50);
}

async function calCargarRango(inicioISO, finISO) {
    let qSes = supabaseClient
        .from('training_sessions')
        .select('id, name, session_date, session_time')
        .eq('club_id', clubId)
        .gte('session_date', inicioISO)
        .lte('session_date', finISO)
        .order('session_date');
    const { data: sesiones } = await qSes;

    let qPar = supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .gte('match_date', inicioISO)
        .lte('match_date', finISO)
        .order('match_date');
    if (seasonId) qPar = qPar.eq('season_id', seasonId);
    const { data: partidos } = await qPar;

    let qMar = supabaseClient
        .from('calendario_marcadores')
        .select('*')
        .eq('club_id', clubId)
        .gte('fecha', inicioISO)
        .lte('fecha', finISO)
        .order('fecha');
    const { data: marcadores } = await qMar;

    return { sesiones: sesiones || [], partidos: partidos || [], marcadores: marcadores || [] };
}

async function calGenerarPDF(rango) {
    const menu = document.getElementById('cal-pdf-menu');
    if (menu) menu.remove();

    // Calcular fechas de inicio y fin segun rango
    let inicio, fin, titulo;
    const base = new Date(calendarioAnio, calendarioMes, 1);

    if (rango === 'mes') {
        inicio = new Date(calendarioAnio, calendarioMes, 1);
        fin = new Date(calendarioAnio, calendarioMes + 1, 0);
        titulo = MESES[calendarioMes] + ' ' + calendarioAnio;
    } else if (rango === 'trimestre') {
        inicio = new Date(calendarioAnio, calendarioMes, 1);
        fin = new Date(calendarioAnio, calendarioMes + 3, 0);
        titulo = 'Trimestre: ' + MESES[inicio.getMonth()] + ' - ' + MESES[fin.getMonth()] + ' ' + fin.getFullYear();
    } else if (rango === 'semestre') {
        inicio = new Date(calendarioAnio, calendarioMes, 1);
        fin = new Date(calendarioAnio, calendarioMes + 6, 0);
        titulo = 'Semestre: ' + MESES[inicio.getMonth()] + ' - ' + MESES[fin.getMonth()] + ' ' + fin.getFullYear();
    } else { // temporada: julio a junio
        const anioTemp = calendarioMes >= 6 ? calendarioAnio : calendarioAnio - 1;
        inicio = new Date(anioTemp, 6, 1);
        fin = new Date(anioTemp + 1, 5, 30);
        titulo = 'Temporada ' + anioTemp + '/' + (anioTemp + 1);
    }

    const toISO = function(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    showToast('Generando PDF...');
    const datos = await calCargarRango(toISO(inicio), toISO(fin));

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const nombreClub = (clubData && clubData.name) ? clubData.name : 'Club';

    if (rango === 'mes') {
        calPdfCuadricula2(doc, calendarioMes, calendarioAnio, datos, nombreClub);
    } else {
        calPdfLista(doc, inicio, fin, datos, nombreClub, titulo);
    }

    const nombreArchivo = 'Calendario_' + titulo.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    doc.save(nombreArchivo);
    showToast('PDF generado');
}

function calPdfCuadricula(doc, mes, anio, datos, nombreClub) {
    const W = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(nombreClub, W / 2, 18, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(90, 90, 90);
    doc.text(MESES[mes] + ' ' + anio, W / 2, 26, { align: 'center' });

    // Agrupar eventos por dia
    const porDia = {};
    datos.sesiones.forEach(function(s) {
        const d = new Date(s.session_date + 'T12:00:00').getDate();
        if (!porDia[d]) porDia[d] = [];
        const hora = s.session_time ? s.session_time.slice(0, 5) + ' ' : '';
        porDia[d].push({ t: 'S', txt: hora + s.name });
    });
    datos.partidos.forEach(function(p) {
        const d = new Date(p.match_date + 'T12:00:00').getDate();
        if (!porDia[d]) porDia[d] = [];
        const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) + ' ' : '';
        porDia[d].push({ t: 'P', txt: hora + 'vs ' + p.opponent });
    });
    (datos.marcadores || []).forEach(function(m) {
        const d = new Date(m.fecha + 'T12:00:00').getDate();
        if (!porDia[d]) porDia[d] = [];
        const nombresM = { descanso: 'Descanso', voluntario: 'Voluntario', viaje: 'Viaje', otro: 'Otro' };
        const txtM = (m.tipo === 'otro' && m.nota) ? m.nota : (nombresM[m.tipo] || m.tipo);
        porDia[d].push({ t: 'M', txt: txtM });
    });

    // Cuadricula 7 columnas
    const dows = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const margenX = 10;
    const anchoCol = (W - margenX * 2) / 7;
    let y = 34;
    const altoFila = 24;

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(38, 33, 92);
    for (let i = 0; i < 7; i++) {
        doc.rect(margenX + i * anchoCol, y, anchoCol, 7, 'F');
        doc.text(dows[i], margenX + i * anchoCol + anchoCol / 2, y + 5, { align: 'center' });
    }
    y += 7;

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    let diaInicio = primerDia.getDay() || 7;
    let col = diaInicio - 1;

    doc.setDrawColor(200, 200, 200);

    for (let i = 0; i < col; i++) {
        doc.rect(margenX + i * anchoCol, y, anchoCol, altoFila);
    }

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const x = margenX + col * anchoCol;
        doc.rect(x, y, anchoCol, altoFila);
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text(String(dia), x + 2, y + 4);

        const eventos = porDia[dia] || [];
        let ey = y + 8;
        doc.setFontSize(6);
        eventos.slice(0, 3).forEach(function(ev) {
            if (ev.t === 'P') doc.setTextColor(163, 45, 45);
            else if (ev.t === 'M') doc.setTextColor(107, 114, 128);
            else doc.setTextColor(83, 74, 183);
            const linea = doc.splitTextToSize(ev.txt, anchoCol - 3)[0] || '';
            doc.text(linea, x + 2, ey);
            ey += 3.5;
        });
        if (eventos.length > 3) {
            doc.setTextColor(120, 120, 120);
            doc.text('+' + (eventos.length - 3), x + 2, ey);
        }

        col++;
        if (col > 6) { col = 0; y += altoFila; }
    }
    if (col > 0) {
        for (let i = col; i < 7; i++) {
            doc.rect(margenX + i * anchoCol, y, anchoCol, altoFila);
        }
    }

    // Leyenda
    y += altoFila + 8;
    doc.setFontSize(8);
    doc.setTextColor(83, 74, 183);
    doc.text('Sesion', margenX, y);
    doc.setTextColor(163, 45, 45);
    doc.text('Partido', margenX + 25, y);
    doc.setTextColor(107, 114, 128);
    doc.text('Dia marcado (descanso, voluntario, viaje...)', margenX + 50, y);
}

function calPdfLista(doc, inicio, fin, datos, nombreClub, titulo) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(nombreClub, W / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(90, 90, 90);
    doc.text(titulo, W / 2, 26, { align: 'center' });

    // Unir y ordenar todos los eventos por fecha
    const eventos = [];
    datos.sesiones.forEach(function(s) {
        eventos.push({
            fecha: s.session_date,
            hora: s.session_time ? s.session_time.slice(0, 5) : '',
            tipo: 'Sesion',
            texto: s.name,
            esPartido: false
        });
    });
    datos.partidos.forEach(function(p) {
        eventos.push({
            fecha: p.match_date,
            hora: p.kick_off_time ? p.kick_off_time.slice(0, 5) : '',
            tipo: 'Partido',
            texto: 'vs ' + p.opponent + (p.home_away === 'home' ? ' (Local)' : ' (Visitante)'),
            esPartido: true
        });
    });
    (datos.marcadores || []).forEach(function(m) {
        const nombresM = { descanso: 'Descanso', voluntario: 'Entrenamiento voluntario', viaje: 'Viaje / concentracion', otro: 'Otro' };
        eventos.push({
            fecha: m.fecha,
            hora: '',
            tipo: 'Dia',
            texto: (m.tipo === 'otro' && m.nota) ? m.nota : (nombresM[m.tipo] || m.tipo),
            esPartido: false
        });
    });
    eventos.sort(function(a, b) {
        if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
        return a.fecha.localeCompare(b.fecha);
    });

    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    let y = 36;
    let mesActualImpreso = '';

    if (eventos.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(120, 120, 120);
        doc.text('No hay sesiones ni partidos en este periodo.', W / 2, y + 10, { align: 'center' });
        return;
    }

    eventos.forEach(function(ev) {
        if (y > H - 20) {
            doc.addPage();
            y = 20;
        }

        const fechaObj = new Date(ev.fecha + 'T12:00:00');
        const mesEv = MESES[fechaObj.getMonth()] + ' ' + fechaObj.getFullYear();
        if (mesEv !== mesActualImpreso) {
            mesActualImpreso = mesEv;
            y += 4;
            doc.setFontSize(11);
            doc.setTextColor(38, 33, 92);
            doc.text(mesEv, 12, y);
            doc.setDrawColor(200, 200, 200);
            doc.line(12, y + 1.5, W - 12, y + 1.5);
            y += 7;
        }

        const diaSemana = dias[fechaObj.getDay()];
        const fechaTxt = diaSemana + ' ' + fechaObj.getDate();

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(fechaTxt, 14, y);

        if (ev.esPartido) doc.setTextColor(163, 45, 45);
        else doc.setTextColor(83, 74, 183);
        doc.setFontSize(8);
        doc.text(ev.tipo, 50, y);

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(9);
        const linea = (ev.hora ? ev.hora + ' · ' : '') + ev.texto;
        doc.text(doc.splitTextToSize(linea, W - 75), 72, y);

        y += 6;
    });
}
        // ========== BIBLIOTECA: FUENTE DE EJERCICIOS ==========
let bibliotecaFuente = 'tlc';

function cambiarFuenteBiblioteca(fuente, btn) {
    bibliotecaFuente = fuente;
    // Actualizar tabs visuales
    document.querySelectorAll('.bib-tab').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#7c3aed';
        b.classList.remove('active');
    });
    btn.style.background = '#7c3aed';
    btn.style.color = 'white';
    btn.classList.add('active');
    
    // Mostrar/ocultar filtros (solo para TLC)
    const filtrosToggle = document.getElementById('filtros-toggle');
    const filtrosBiblioteca = document.getElementById('filtros-biblioteca');
    if (filtrosToggle) filtrosToggle.style.display = fuente === 'tlc' ? '' : 'none';
    if (filtrosBiblioteca) filtrosBiblioteca.style.display = fuente === 'tlc' ? '' : 'none';
    const filtrosMis = document.getElementById('filtros-mis-ejercicios');
    if (filtrosMis) filtrosMis.style.display = fuente === 'tlc' ? 'none' : '';
    
    if (fuente === 'tlc') {
        cargarEjercicios(1);
    } else {
        cargarMisEjerciciosBiblioteca();
    }
}

let misEjerciciosCache = [];
let misEjerciciosThumbs = {};

async function planifCargarThumbsBiblioteca(ids) {
    ids = ids.filter(function(id){ return !(id in misEjerciciosThumbs); });
    const LOTE = 4;
    for (let i = 0; i < ids.length; i += LOTE) {
        const grupo = ids.slice(i, i + LOTE);
        try {
            const { data, error } = await supabaseClient
                .from('custom_exercises')
                .select('id, thumbnail_svg')
                .in('id', grupo);
            if (error || !data) continue;
            data.forEach(function(ej) {
                if (!ej.thumbnail_svg) return;
                var thumbSrc = '';
                try {
                    if (ej.thumbnail_svg.startsWith('data:')) {
                        thumbSrc = ej.thumbnail_svg;
                    } else {
                        var blob = new Blob([ej.thumbnail_svg], {type: 'image/svg+xml'});
                        thumbSrc = URL.createObjectURL(blob);
                    }
                } catch(e) { return; }
                misEjerciciosThumbs[ej.id] = thumbSrc;
                var img = document.querySelector('#lista-ejercicios img[data-ejid="' + ej.id + '"]');
                if (img) img.src = thumbSrc;
                var card = img ? img.closest('.ejercicio-card') : null;
                var btn = card ? card.querySelector('.btn-agregar') : null;
                if (btn) {
                    try {
                        var d = JSON.parse(btn.getAttribute('data-ejercicio').replace(/&#39;/g, "'"));
                        d.imagen = thumbSrc;
                        btn.setAttribute('data-ejercicio', JSON.stringify(d).replace(/'/g, '&#39;'));
                    } catch(e) {}
                }
            });
        } catch(e) {}
    }
}

async function cargarMisEjerciciosBiblioteca() {
    const lista = document.getElementById('lista-ejercicios');
    const pag = document.getElementById('paginacion-ejercicios');
    lista.innerHTML = '<div class="loading">Cargando mis ejercicios...</div>';
    if (pag) pag.innerHTML = '';
    
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises')
            .select('id, name, category, tema, difficulty, duration_min, players_count, game_phase')
            .or((typeof cmState !== 'undefined' && cmState.activo && typeof clubId !== 'undefined' && clubId) ? ('club_id.eq.' + clubId + ',coach_id.eq.' + String(usuario.id)) : ('coach_id.eq.' + String(usuario.id)))
            .order('created_at', { ascending: false })
            .limit(1000);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">No tienes ejercicios propios.<br>Crea uno desde la Pizarra.</p>';
            return;
        }
        
        misEjerciciosCache = data;
        construirFiltrosMisEjercicios(data);
        renderMisEjercicios(data);
    } catch(err) {
        lista.innerHTML = '<p style="color:red;">Error: ' + err.message + '</p>';
    }
}

function renderMisEjercicios(data) {
    var lista = document.getElementById('lista-ejercicios');
    if (!lista) return;
    if (!data.length) {
        lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;">Ningún ejercicio coincide con los filtros.</p>';
        return;
    }
    setTimeout(function(){ planifCargarThumbsBiblioteca(data.map(function(ej){ return ej.id; })); }, 50);
    lista.innerHTML = data.map(ej => {
            var thumbSrc = misEjerciciosThumbs[ej.id] || '';
            
            if (ej.thumbnail_svg) {
                try {
                    if (ej.thumbnail_svg.startsWith('data:')) {
                        thumbSrc = ej.thumbnail_svg;
                    } else {
                        var blob = new Blob([ej.thumbnail_svg], {type: 'image/svg+xml'});
                        thumbSrc = URL.createObjectURL(blob);
                    }
                } catch(e) {
                    thumbSrc = '';
                }
            }
            
            var tags = [];
            if (ej.tema) tags.push('<span class="tag">' + ej.tema + '</span>');
            if (ej.difficulty) tags.push('<span class="tag dificultad">Dif: ' + ej.difficulty + '</span>');
            if (ej.category) tags.push('<span class="tag">' + ej.category + '</span>');
            
            var ejercicioData = JSON.stringify({
                id: ej.id,
                titulo: ej.name,
                imagen: thumbSrc,
                duracion: ej.duration_min || 15,
                fuente: 'custom'
            }).replace(/'/g, "&#39;");
            
            return '<div class="ejercicio-card" onclick="seleccionarMiEjercicio(\'' + ej.id + '\')">' +
                '<img data-ejid="' + ej.id + '" src="' + (thumbSrc || 'https://via.placeholder.com/80x60?text=Cargando') + '" alt="" style="border-radius:6px">' +
                '<div class="info">' +
                    '<div class="titulo">' + ej.name + '</div>' +
                    '<div class="tags">' + tags.join('') + '</div>' +
                '</div>' +
                '<button class="btn-agregar" data-ejercicio=\'' + ejercicioData + '\' onclick="event.stopPropagation(); agregarMiEjercicioDesdeBoton(this)">+ Añadir</button>' +
            '</div>';
        }).join('');
        
}

function construirFiltrosMisEjercicios(data) {
    var lista = document.getElementById('lista-ejercicios');
    var barra = document.getElementById('filtros-mis-ejercicios');
    if (!barra) {
        barra = document.createElement('div');
        barra.id = 'filtros-mis-ejercicios';
        lista.parentNode.insertBefore(barra, lista);
    }
    barra.style.display = '';
    var temas = ['Calentamiento','Cambios de orientación','Centros laterales','Contraataque','Defensa en bloque bajo','Defensa en inferioridad','Duelos','Finalización','Físico-Técnico','Juego de posición','Juego interior','Juegos Lúdicos','Partidos','Porteros','Posesiones','Presión','Press perdida','Progresión en el juego','Rondos','Ruedas de pases','Salida de balón','Tercer hombre','Trabajo táctico','Transiciones','Técnica individual'];
    var fases = ['Organización ofensiva','Organización defensiva','Transición ataque','Transición defensa','Balón parado'];
    data.forEach(function(e){
        if (e.tema && temas.indexOf(e.tema) === -1) temas.push(e.tema);
        if (e.game_phase && fases.indexOf(e.game_phase) === -1) fases.push(e.game_phase);
    });
    var st = 'padding:6px 8px;font-size:12px;border:1px solid #d1d5db;border-radius:6px;background:white;color:#374151';
    barra.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;align-items:center">' +
            '<input type="text" id="mis-filtro-nombre" placeholder="🔍 Buscar por nombre..." oninput="filtrarMisEjercicios()" style="flex:1;min-width:130px;' + st + '">' +
            '<input type="number" id="mis-filtro-jug" placeholder="Nº jug" min="1" oninput="filtrarMisEjercicios()" style="width:75px;' + st + '">' +
            '<select id="mis-filtro-tema" onchange="filtrarMisEjercicios()" style="' + st + ';cursor:pointer">' +
                '<option value="">Tema (todos)</option>' + temas.map(function(t){ return '<option>' + t + '</option>'; }).join('') +
            '</select>' +
            '<select id="mis-filtro-fase" onchange="filtrarMisEjercicios()" style="' + st + ';cursor:pointer">' +
                '<option value="">Fase (todas)</option>' + fases.map(function(f){ return '<option>' + f + '</option>'; }).join('') +
            '</select>' +
            '<button onclick="limpiarFiltrosMisEjercicios()" style="padding:6px 10px;font-size:12px;border:1px solid #7c3aed;color:#7c3aed;background:white;border-radius:6px;cursor:pointer;font-weight:600">Limpiar</button>' +
        '</div>';
}

function filtrarMisEjercicios() {
    var q = (document.getElementById('mis-filtro-nombre')?.value || '').toLowerCase();
    var jug = parseInt(document.getElementById('mis-filtro-jug')?.value) || 0;
    var tema = document.getElementById('mis-filtro-tema')?.value || '';
    var fase = document.getElementById('mis-filtro-fase')?.value || '';
    var filtrados = misEjerciciosCache.filter(function(e){
        return (!q || (e.name || '').toLowerCase().indexOf(q) !== -1) &&
               (!jug || e.players_count == jug) &&
               (!tema || e.tema === tema) &&
               (!fase || e.game_phase === fase);
    });
    renderMisEjercicios(filtrados);
}

function limpiarFiltrosMisEjercicios() {
    ['mis-filtro-nombre','mis-filtro-jug'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
    ['mis-filtro-tema','mis-filtro-fase'].forEach(function(id){ var el = document.getElementById(id); if (el) el.selectedIndex = 0; });
    renderMisEjercicios(misEjerciciosCache);
}

function seleccionarMiEjercicio(id) {
    const detalle = document.getElementById('detalle-ejercicio');
    detalle.innerHTML = '<div class="loading">Cargando...</div>';
    
    supabaseClient.from('custom_exercises').select('*').eq('id', id).single()
        .then(function(res) {
            if (res.error) throw res.error;
            var ej = res.data;
          ejercicioSeleccionado = {
                id: ej.id,
                titulo: ej.name,
                duracion: ej.duration_min || 15,
                imagen: '',
                objetivo: (ej.objectives ? ej.objectives + '\n\n' : '') + (ej.description || ''),
                entrenador: '',
                equipo: '',
                fuente: 'custom'
            };
            // Convertir SVG a PNG para que funcione en el PDF
            if (ej.thumbnail_svg) {
                ejSvgToPng(ej.thumbnail_svg).then(function(pngData) {
                    ejercicioSeleccionado.imagen = pngData;
                });
            }
            
           // Generar miniatura
            var thumbHTML = '';
            if (ej.thumbnail_svg) {
                try {
                    var imgSrc;
                    if (ej.thumbnail_svg.startsWith('data:')) {
                        imgSrc = ej.thumbnail_svg;
                    } else {
                        var blob = new Blob([ej.thumbnail_svg], {type: 'image/svg+xml'});
                        imgSrc = URL.createObjectURL(blob);
                    }
                    thumbHTML = '<img src="' + imgSrc + '" alt="' + ej.name + '" style="width:100%;border-radius:8px;margin-bottom:10px">';
                } catch(e) {}
            }
            
            detalle.className = 'detalle-ejercicio active';
            detalle.innerHTML = thumbHTML +
                '<h3>' + ej.name + '</h3>' +
                '<div class="meta" style="font-size:13px;color:#666;line-height:1.8;margin-bottom:10px;">' +
                    (ej.category ? '<strong>Categoría:</strong> ' + ej.category + '<br>' : '') +
                    (ej.tema ? '<strong>Tema:</strong> ' + ej.tema + '<br>' : '') +
                    (ej.game_phase ? '<strong>Fase:</strong> ' + ej.game_phase + '<br>' : '') +
                    (ej.difficulty ? '<strong>Dificultad:</strong> ' + ej.difficulty + '<br>' : '') +
                    '<strong>Duración:</strong> ' + (ej.duration_min || 15) + ' min' +
                    (ej.players_count ? '<br><strong>Jugadores:</strong> ' + ej.players_count : '') +
                    (ej.materials ? '<br><strong>Material:</strong> ' + ej.materials : '') +
                    (ej.eii ? '<br><strong>EII:</strong> ' + ej.eii + ' m²/jug' : '') +
                '</div>' +
                (ej.objectives ? '<div class="detalle-seccion"><h4>Objetivos</h4><p>' + ej.objectives + '</p></div>' : '') +
                (ej.description ? '<div class="detalle-seccion"><h4>Descripción</h4><p>' + ej.description + '</p></div>' : '') +
                (ej.variants ? '<div class="detalle-seccion"><h4>Variantes</h4><p>' + ej.variants + '</p></div>' : '') +
                (ej.coach_notes ? '<div class="detalle-seccion"><h4>Notas del entrenador</h4><p>' + ej.coach_notes + '</p></div>' : '') +
                '<button class="btn-primary purple" style="width:100%;margin-top:10px;" onclick="abrirModalSeccion()">Añadir a Sesión</button>';
        })
        .catch(function(err) {
            detalle.innerHTML = '<p style="color:red;">Error: ' + err.message + '</p>';
        });
}

async function agregarMiEjercicioDesdeBoton(btn) {
    var data = JSON.parse(btn.dataset.ejercicio);
    var imagen = '';
    var objetivo = '';
    
    // Cargar datos completos del ejercicio
    if (data.fuente === 'custom') {
        try {
            var res = await supabaseClient.from('custom_exercises').select('thumbnail_svg, objectives, description').eq('id', data.id).single();
            if (res.data) {
                if (res.data.thumbnail_svg) {
                    imagen = await ejSvgToPng(res.data.thumbnail_svg);
                }
                objetivo = (res.data.objectives ? res.data.objectives + '\n\n' : '') + (res.data.description || '');
            }
        } catch(e) { console.warn('No se pudo cargar datos:', e); }
    }
    
    ejercicioSeleccionado = {
        id: data.id,
        titulo: data.titulo,
        duracion: data.duracion || 15,
        imagen: imagen,
        objetivo: objetivo,
        entrenador: '',
        equipo: '',
        fuente: data.fuente || 'custom'
    };
    abrirModalSeccion();
}
// Convertir SVG a PNG data URL para PDFs
function ejSvgToPng(svgString) {
    return new Promise(function(resolve) {
        var canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        var ctx = canvas.getContext('2d');
        var img = new Image();
        var blob = new Blob([svgString], {type: 'image/svg+xml'});
        var url = URL.createObjectURL(blob);
        img.onload = function() {
            ctx.drawImage(img, 0, 0, 800, 500);
            resolve(canvas.toDataURL('image/png'));
            URL.revokeObjectURL(url);
        };
        img.onerror = function() { resolve(''); URL.revokeObjectURL(url); };
        img.src = url;
    });
}
// ===== PDF DEL CALENDARIO v2 (diseño con escudo y pildoras de color) =====
function calPdfCuadricula2(doc, mes, anio, datos, nombreClub) {
    const W = doc.internal.pageSize.getWidth();

    // Cabecera con banda morada y escudo
    doc.setFillColor(38, 33, 92);
    doc.rect(0, 0, W, 30, 'F');
    try {
        if (clubData && clubData.logo_url) doc.addImage(clubData.logo_url, 'PNG', 9, 4, 22, 22);
    } catch (e) {}
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(nombreClub, 36, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 215);
    doc.text('Calendario — ' + MESES[mes] + ' ' + anio, 36, 21);

    // Agrupar eventos por dia con su tipo y color
    const porDia = {};
    function anadir(d, ev) { if (!porDia[d]) porDia[d] = []; porDia[d].push(ev); }
    datos.sesiones.forEach(function(s) {
        const d = new Date(s.session_date + 'T12:00:00').getDate();
        const hora = s.session_time ? s.session_time.slice(0, 5) + ' ' : '';
        anadir(d, { txt: hora + s.name, bg: [38, 33, 92], fg: [255, 255, 255] });
    });
    datos.partidos.forEach(function(p) {
        const d = new Date(p.match_date + 'T12:00:00').getDate();
        let bg = [100, 116, 139];
        let txt;
        if (p.result) {
            bg = p.result === 'win' ? [22, 163, 74] : (p.result === 'draw' ? [217, 119, 6] : [220, 38, 38]);
            const gF = p.team_goals || 0, gC = p.opponent_goals || 0;
            const marcador = p.home_away === 'home' ? (gF + '-' + gC) : (gC + '-' + gF);
            txt = marcador + ' ' + p.opponent;
        } else {
            txt = (p.kick_off_time ? p.kick_off_time.slice(0, 5) + ' ' : '') + 'vs ' + p.opponent;
        }
        anadir(d, { txt: txt, bg: bg, fg: [255, 255, 255] });
    });
    const estilosM = {
        descanso:   { bg: [226, 232, 240], fg: [51, 65, 85],  label: 'Descanso' },
        voluntario: { bg: [220, 252, 231], fg: [22, 101, 52], label: 'Voluntario' },
        viaje:      { bg: [237, 233, 254], fg: [91, 33, 182], label: 'Viaje' },
        otro:       { bg: [254, 249, 195], fg: [133, 77, 14], label: 'Otro' }
    };
    (datos.marcadores || []).forEach(function(m) {
        const d = new Date(m.fecha + 'T12:00:00').getDate();
        const est = estilosM[m.tipo] || estilosM.otro;
        const txt = (m.tipo === 'otro' && m.nota) ? m.nota : est.label;
        anadir(d, { txt: txt, bg: est.bg, fg: est.fg });
    });

    // Cabecera de dias de la semana
    const dows = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    const margenX = 8;
    const anchoCol = (W - margenX * 2) / 7;
    let y = 36;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    for (let i = 0; i < 7; i++) {
        doc.setFillColor(83, 74, 183);
        doc.rect(margenX + i * anchoCol, y, anchoCol, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(dows[i], margenX + i * anchoCol + anchoCol / 2, y + 4.8, { align: 'center' });
    }
    y += 7;

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    let diaInicio = primerDia.getDay() || 7;
    let col = diaInicio - 1;
    const altoFila = 26;

    function celda(c, fila_y, esFinde) {
        const x = margenX + c * anchoCol;
        if (esFinde) {
            doc.setFillColor(255, 251, 235);
            doc.rect(x, fila_y, anchoCol, altoFila, 'F');
        }
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, fila_y, anchoCol, altoFila);
        return x;
    }

    for (let i = 0; i < col; i++) celda(i, y, i >= 5);

    for (let dia = 1; dia <= ultimoDia; dia++) {
        const x = celda(col, y, col >= 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(String(dia), x + 2, y + 4.5);

        const eventos = porDia[dia] || [];
        let ey = y + 6.5;
        doc.setFont('helvetica', 'normal');
        eventos.slice(0, 3).forEach(function(ev) {
            doc.setFillColor(ev.bg[0], ev.bg[1], ev.bg[2]);
            doc.roundedRect(x + 1.3, ey, anchoCol - 2.6, 4.8, 1, 1, 'F');
            doc.setTextColor(ev.fg[0], ev.fg[1], ev.fg[2]);
            doc.setFontSize(5.6);
            const linea = doc.splitTextToSize(ev.txt, anchoCol - 6)[0] || '';
            doc.text(linea, x + 2.6, ey + 3.3);
            ey += 5.8;
        });
        if (eventos.length > 3) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(5.6);
            doc.text('+' + (eventos.length - 3) + ' mas', x + 2.6, ey + 2.5);
        }

        col++;
        if (col > 6) { col = 0; y += altoFila; }
    }
    if (col > 0) {
        for (let i = col; i < 7; i++) celda(i, y, i >= 5);
        y += altoFila;
    }

    // Leyenda con muestras de color
    y += 8;
    const leyenda = [
        { label: 'Sesion',      bg: [38, 33, 92],    fg: [255, 255, 255] },
        { label: 'Victoria',    bg: [22, 163, 74],   fg: [255, 255, 255] },
        { label: 'Empate',      bg: [217, 119, 6],   fg: [255, 255, 255] },
        { label: 'Derrota',     bg: [220, 38, 38],   fg: [255, 255, 255] },
        { label: 'Pendiente',   bg: [100, 116, 139], fg: [255, 255, 255] },
        { label: 'Descanso',    bg: [226, 232, 240], fg: [51, 65, 85] },
        { label: 'Voluntario',  bg: [220, 252, 231], fg: [22, 101, 52] },
        { label: 'Viaje',       bg: [237, 233, 254], fg: [91, 33, 182] },
        { label: 'Otro',        bg: [254, 249, 195], fg: [133, 77, 14] }
    ];
    let lx = margenX;
    doc.setFontSize(6.5);
    leyenda.forEach(function(l) {
        const wPill = doc.getTextWidth(l.label) + 6;
        doc.setFillColor(l.bg[0], l.bg[1], l.bg[2]);
        doc.roundedRect(lx, y, wPill, 5, 1.2, 1.2, 'F');
        doc.setTextColor(l.fg[0], l.fg[1], l.fg[2]);
        doc.text(l.label, lx + 3, y + 3.5);
        lx += wPill + 4;
    });

    // Resumen del mes
    y += 11;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    doc.text(datos.sesiones.length + ' sesiones  ·  ' + datos.partidos.length + ' partidos  ·  ' + (datos.marcadores || []).length + ' dias marcados', margenX, y);
}
// ================================================================
// PUENTE UTILLERO (Club Mode) + Copiar lista de material
// ================================================================
function _parsearMaterialSesion() {
    const raw = document.getElementById('sesion-material').value.trim();
    if (!raw) return [];
    const items = [];
    raw.split(/[\n,]+/).forEach(function(l) {
        l = l.trim();
        if (!l) return;
        const m = l.match(/^(\d+)\s*x?\s+(.+)$/);
        if (m) items.push({ quantity: parseInt(m[1]), name: m[2] });
        else items.push({ quantity: 1, name: l });
    });
    return items;
}

function _fechaSesionBonita() {
    const f = document.getElementById('sesion-fecha').value;
    if (!f) return '';
    const p = f.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : f;
}

function copiarMaterialSesion() {
    const items = _parsearMaterialSesion();
    if (!items.length) { showToast('El campo de material esta vacio'); return; }
    const nombre = document.getElementById('sesion-nombre').value.trim();
    const fecha = _fechaSesionBonita();
    let texto = 'MATERIAL - ' + (nombre || 'Sesion') + (fecha ? ' (' + fecha + ')' : '') + ':\n';
    items.forEach(function(it) { texto += '- ' + it.quantity + ' ' + it.name + '\n'; });
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function() {
            showToast('Lista copiada. Pegala en WhatsApp o donde quieras');
        }).catch(function() { _copiarFallback(texto); });
    } else { _copiarFallback(texto); }
}

function _copiarFallback(texto) {
    const ta = document.createElement('textarea');
    ta.value = texto; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
    showToast('Lista copiada. Pegala en WhatsApp o donde quieras');
}

async function enviarMaterialUtillero() {
    if (typeof cmState === 'undefined' || !cmState.activo) {
        showToast('Esta opcion solo esta disponible en Modo Club');
        return;
    }
    const items = _parsearMaterialSesion();
    if (!items.length) { showToast('El campo de material esta vacio'); return; }
    const nombre = document.getElementById('sesion-nombre').value.trim();
    const fecha = document.getElementById('sesion-fecha').value || null;
    const quien = (typeof usuario !== 'undefined' && usuario && (usuario.nombre || usuario.display_name || usuario.name)) || 'Entrenador';

    const res = await supabaseClient.from('cm_util_requests').insert({
        club_id: clubId,
        requested_by: (typeof usuario !== 'undefined' && usuario) ? usuario.id : 0,
        requester_name: quien,
        requester_role: 'entrenador',
        items: items,
        urgency: 'normal',
        status: 'pending',
        source: 'sesion',
        session_id: sesionEditandoId || null,
        session_date: fecha,
        notes: nombre ? 'Sesion: ' + nombre : null
    });
    if (res.error) { showToast('Error enviando al utillero: ' + res.error.message); return; }

    try {
        const resumen = items.map(function(it) { return it.quantity + ' ' + it.name; }).join(', ');
        await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: 'material_request',
            title: 'Material para sesion' + (fecha ? ' del ' + _fechaSesionBonita() : '') + ' - ' + quien,
            message: resumen,
            icon: 'material',
            target_permission: 'modulo_utillero',
            created_by: (typeof usuario !== 'undefined' && usuario) ? usuario.id : null
        });
    } catch (e) { console.error('Error notificacion utillero:', e); }

    showToast('Material enviado al utillero');
}

(function _mostrarBotonUtillero() {
    let n = 0;
    const iv = setInterval(function() {
        n++; if (n > 20) { clearInterval(iv); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        clearInterval(iv);
        const b = document.getElementById('btn-enviar-utillero');
        if (b) b.style.display = '';
    }, 500);
})();
// ===== PEDIDO AL UTILLERO CON LISTA CERRADA (sustituye a la version de texto libre) =====
async function enviarMaterialUtillero() {
    if (typeof cmState === 'undefined' || !cmState.activo) { showToast('Esta opcion solo esta disponible en Modo Club'); return; }
    let items = [];
    try {
        const r = await supabaseClient.from('cm_util_items').select('id, name, category, qty_available').eq('club_id', clubId).eq('archived', false).order('category').order('name');
        items = r.data || [];
    } catch (e) {}
    const prev = document.getElementById('util-pedido-ov'); if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.id = 'util-pedido-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    const CATS = { balones:'Balones', textil_entreno:'Textil de entreno', equipacion_oficial:'Equipacion oficial', porterias_campo:'Porterias y campo', botiquin_campo:'Botiquin de campo', hidratacion:'Hidratacion', tecnologia:'Tecnologia', consumibles:'Consumibles', otros:'Otros' };
    let lista = '';
    let catAct = null;
    items.forEach(function(it) {
        if (it.category !== catAct) { catAct = it.category; lista += '<div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;margin:10px 0 4px">' + (CATS[catAct] || catAct) + '</div>'; }
        lista += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f3f4f6">'
            + '<div style="flex:1;font-size:13px;color:#1f2937">' + it.name + ' <span style="color:#9ca3af;font-size:11px">(disp. ' + it.qty_available + ')</span></div>'
            + '<input type="number" class="util-ped-qty" data-name="' + String(it.name).replace(/"/g, '') + '" min="0" max="999" value="0" style="width:64px;padding:5px 7px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center">'
            + '</div>';
    });
    if (!items.length) lista = '<div style="font-size:12px;color:#9ca3af;padding:8px 0">El utillero aun no tiene articulos en su inventario. Usa el campo de abajo.</div>';
    ov.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:460px;width:100%;max-height:86vh;display:flex;flex-direction:column">'
        + '<div style="padding:16px 18px 8px"><div style="font-weight:700;color:#1f2937">📦 Pedir material al utillero</div>'
        + '<div style="font-size:12px;color:#6b7280">Marca cantidades del inventario o anade material libre abajo</div></div>'
        + '<div style="padding:0 18px;overflow-y:auto;flex:1">' + lista
        + '<div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;margin:12px 0 4px">Otro material</div>'
        + '<textarea id="util-ped-otros" placeholder="Ej: 2 escaleras de coordinacion, 1 bomba de aire" style="width:100%;min-height:54px;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;box-sizing:border-box"></textarea></div>'
        + '<div style="display:flex;gap:8px;justify-content:flex-end;padding:14px 18px">'
        + '<button onclick="document.getElementById(\'util-pedido-ov\').remove()" style="padding:9px 16px;background:#f3f4f6;border:1px solid #d1d5db;color:#374151;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button>'
        + '<button onclick="utilEnviarPedido()" style="padding:9px 16px;background:#f59e0b;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">Enviar pedido</button>'
        + '</div></div>';
    document.body.appendChild(ov);
}

async function utilEnviarPedido() {
    const items = [];
    document.querySelectorAll('.util-ped-qty').forEach(function(inp) {
        const q = parseInt(inp.value);
        if (q > 0) items.push({ quantity: q, name: inp.dataset.name });
    });
    const otros = (document.getElementById('util-ped-otros').value || '').trim();
    if (otros) {
        otros.split(/[\n,]+/).forEach(function(l) {
            l = l.trim(); if (!l) return;
            const m = l.match(/^(\d+)\s*x?\s+(.+)$/);
            if (m) items.push({ quantity: parseInt(m[1]), name: m[2] });
            else items.push({ quantity: 1, name: l });
        });
    }
    if (!items.length) { showToast('No has marcado ningun material'); return; }
    const nombre = document.getElementById('sesion-nombre').value.trim();
    const fecha = document.getElementById('sesion-fecha').value || null;
    const quien = (typeof clubData !== 'undefined' && clubData && clubData.name) ? clubData.name : 'Club';
    const res = await supabaseClient.from('cm_util_requests').insert({
        club_id: clubId,
        requested_by: (typeof usuario !== 'undefined' && usuario) ? usuario.id : 0,
        requester_name: quien,
        requester_role: 'entrenador',
        items: items,
        urgency: 'normal',
        status: 'pending',
        source: 'sesion',
        session_id: (typeof sesionEditandoId !== 'undefined' ? sesionEditandoId : null) || null,
        session_date: fecha,
        notes: nombre ? 'Sesion: ' + nombre : null
    });
    if (res.error) { showToast('Error enviando al utillero: ' + res.error.message); return; }
    const ta = document.getElementById('sesion-material');
    if (ta) ta.value = items.map(function(it) { return it.quantity + ' ' + it.name; }).join(', ');
    try {
        const resumen = items.map(function(it) { return it.quantity + ' ' + it.name; }).join(', ');
        await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: 'material_request',
            title: 'Material para sesion' + (fecha ? ' del ' + _fechaSesionBonita() : '') + ' - ' + quien,
            message: resumen,
            icon: 'material',
            target_permission: 'modulo_utillero',
            created_by: (typeof usuario !== 'undefined' && usuario) ? usuario.id : null
        });
    } catch (e) { console.error('Error notificacion utillero:', e); }
    const ov = document.getElementById('util-pedido-ov'); if (ov) ov.remove();
    showToast('Pedido enviado al utillero');
}// ========== PDF SEMANAL PARA JUGADORES ==========
function calPdfSemanaJugadores() {
    var menu = document.getElementById('cal-pdf-menu');
    if (menu) menu.remove();
    var hoy = new Date();
    var iso = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    var ov = document.createElement('div');
    ov.id = 'cal-semana-modal';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:99999';
    ov.innerHTML = '<div style="background:#1e293b;border-radius:12px;padding:24px;width:330px;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.4)">' +
        '<p style="margin:0 0 6px;font-size:15px;font-weight:600">Semana para jugadores</p>' +
        '<p style="margin:0 0 14px;font-size:13px;color:#94a3b8">Elige un dia y se genera su semana completa (lunes a domingo).</p>' +
        '<input type="date" id="cal-semana-fecha" value="' + iso + '" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:14px">' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">' +
        '<button onclick="document.getElementById(\'cal-semana-modal\').remove()" style="padding:8px 18px;border-radius:8px;border:1px solid #475569;background:transparent;color:#fff;cursor:pointer">Cancelar</button>' +
        '<button onclick="calPdfSemanaGenerar()" style="padding:8px 18px;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-weight:600;cursor:pointer">Generar PDF</button>' +
        '</div></div>';
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
}

async function calPdfSemanaGenerar() {
    var input = document.getElementById('cal-semana-fecha');
    if (!input || !input.value) { showToast('Elige una fecha'); return; }

    var base = new Date(input.value + 'T12:00:00');
    var dow = base.getDay();
    var offset = (dow === 0) ? -6 : 1 - dow;
    var lunes = new Date(base);
    lunes.setDate(base.getDate() + offset);

    function fISO(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    var dias = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        dias.push(d);
    }
    var desde = fISO(dias[0]);
    var hasta = fISO(dias[6]);

    var modal = document.getElementById('cal-semana-modal');
    if (modal) modal.remove();

    try {
        var res = await supabaseClient
            .from('training_sessions')
            .select('name, session_date, session_time')
            .eq('club_id', clubId)
            .gte('session_date', desde)
            .lte('session_date', hasta)
            .order('session_date');
        var sesiones = res.data || [];

        var doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
        var nombreClub = (clubData && clubData.name) ? clubData.name : 'Club';
        var MESES_S = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        var DIAS_S = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

        doc.setFillColor(38, 33, 92);
        doc.rect(0, 0, 210, 34, 'F');
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 34, 210, 2, 'F');
        try {
            if (clubData && clubData.logo_url) doc.addImage(clubData.logo_url, 'PNG', 9, 5, 24, 24);
        } catch (e) {}
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.text(nombreClub.toUpperCase(), 38, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 215);
        doc.text('Semana del ' + dias[0].getDate() + ' al ' + dias[6].getDate() + ' de ' + MESES_S[dias[6].getMonth()] + ' de ' + dias[6].getFullYear(), 38, 24);

        var y = 48;
        dias.forEach(function(dia, idx) {
            var key = fISO(dia);
            var delDia = sesiones.filter(function(s) { return s.session_date === key; });
            var alto = Math.max(24, 14 + delDia.length * 10);

            if (y + alto > 285) { doc.addPage(); y = 20; }

            if (delDia.length) {
                doc.setFillColor(241, 245, 249);
            } else {
                doc.setFillColor(250, 250, 252);
            }
            doc.roundedRect(14, y, 182, alto, 3, 3, 'F');

            if (delDia.length) {
                doc.setFillColor(124, 58, 237);
            } else {
                doc.setFillColor(203, 213, 225);
            }
            doc.rect(14, y, 3, alto, 'F');

            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(DIAS_S[idx] + ' ' + dia.getDate(), 22, y + 9);

            if (!delDia.length) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text('Libre', 22, y + 18);
            } else {
                var ly = y + 18;
                delDia.forEach(function(s) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(124, 58, 237);
                    doc.text(s.session_time ? String(s.session_time).substring(0, 5) : '--:--', 22, ly);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 41, 59);
                    doc.text(String(s.name || 'Sesion'), 48, ly);
                    ly += 10;
                });
            }
            y += alto + 4;
        });

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('TopLiderCoach', 105, 290, { align: 'center' });
        doc.save('semana-' + desde + '.pdf');
    } catch (e) {
        console.error('calPdfSemanaGenerar:', e);
        showToast('Error al generar el PDF');
    }
}

// ========== MODO VESTUARIO (presentacion de la sesion) ==========
var mvSlides = [];
var mvIdx = 0;

async function abrirModoVestuario(id) {
    try {
        const { data: s } = await supabaseClient.from('training_sessions').select('*').eq('id', id).single();
        if (!s) { showToast('No se pudo cargar la sesion'); return; }

        const secciones = [
            { nombre: 'Trabajo previo a campo', datos: s.pre_field_work || [], color: '#8b5cf6' },
            { nombre: 'Calentamiento', datos: s.warm_up || [], color: '#f97316' },
            { nombre: 'Parte principal', datos: s.main_part || [], color: '#2563eb' },
            { nombre: 'Parte final', datos: s.cool_down || [], color: '#16a34a' },
            { nombre: 'Trabajo post-campo', datos: s.post_field_work || [], color: '#64748b' }
        ];

        // Recuperar miniaturas que se guardaron sin imagen (mismo patron que el PDF)
        for (const sec of secciones) {
            for (const ej of sec.datos) {
                if ((!ej.imagen || ej.imagen.indexOf('data:') !== 0) && typeof ej.id === 'string' && ej.id.indexOf('-') > 0) {
                    try {
                        const resEj = await supabaseClient.from('custom_exercises').select('thumbnail_svg').eq('id', ej.id).single();
                        if (resEj.data && resEj.data.thumbnail_svg) {
                            if (resEj.data.thumbnail_svg.indexOf('data:') === 0) ej.imagen = resEj.data.thumbnail_svg;
                            else if (typeof ejSvgToPng === 'function') ej.imagen = await ejSvgToPng(resEj.data.thumbnail_svg);
                        }
                    } catch (e) { /* sin miniatura */ }
                }
            }
        }

        // Construir slides: portada + un slide por ejercicio
        const fechaObj = new Date(s.session_date + 'T12:00:00');
        const fechaTxt = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const hora = s.session_time ? s.session_time.substring(0, 5) : '';
        let totalEj = 0;
        secciones.forEach(function(sec) { totalEj += sec.datos.length; });

        mvSlides = [{
            tipo: 'portada',
            nombre: s.name || 'Sesion',
            fecha: fechaTxt + (hora ? ' · ' + hora : ''),
            micro: s.microciclo || '',
            md: s.match_day || '',
            objetivo: s.objective || '',
            totalEj: totalEj
        }];
        let n = 0;
        secciones.forEach(function(sec) {
            sec.datos.forEach(function(ej) {
                n++;
                mvSlides.push({
                    tipo: 'ejercicio',
                    fase: sec.nombre,
                    color: sec.color,
                    num: n,
                    total: totalEj,
                    titulo: 'Ejercicio ' + n,
                    imagen: ej.imagen || null,
                    duracion: ej.duracion || null,
                    texto: (ej.tipo === 'libre' && ej.titulo) ? (ej.titulo + (ej.notas ? ' · ' + ej.notas : '')) : (ej.objetivo || ej.notas || '')
                });
            });
        });

        if (mvSlides.length === 1) { showToast('La sesion no tiene ejercicios'); return; }
        mvIdx = 0;
        mvRender();
        const ov = document.getElementById('mv-overlay');
        if (ov && ov.requestFullscreen) { ov.requestFullscreen().catch(function() {}); }
        document.addEventListener('keydown', mvTeclado);
    } catch (e) {
        console.error('Modo vestuario:', e);
        showToast('Error al abrir el modo vestuario');
    }
}

function mvRender() {
    let ov = document.getElementById('mv-overlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'mv-overlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0b0f1a;z-index:2147483000;display:flex;flex-direction:column;color:#fff;font-family:inherit';
        document.body.appendChild(ov);
    }
    const sl = mvSlides[mvIdx];
    let cuerpo = '';
    if (sl.tipo === 'portada') {
        cuerpo =
            '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4vh 6vw">' +
                '<div style="font-size:2.2vh;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;margin-bottom:2vh">' + (sl.fecha || '') + '</div>' +
                '<h1 style="font-size:6.5vh;margin:0 0 2vh;line-height:1.1">' + sl.nombre + '</h1>' +
                '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:4vh">' +
                    (sl.micro ? '<span style="background:#7c3aed;padding:6px 18px;border-radius:20px;font-size:2vh;font-weight:700">' + sl.micro + '</span>' : '') +
                    (sl.md ? '<span style="background:#334155;padding:6px 18px;border-radius:20px;font-size:2vh;font-weight:700">' + sl.md + '</span>' : '') +
                    '<span style="background:#334155;padding:6px 18px;border-radius:20px;font-size:2vh;font-weight:700">' + sl.totalEj + ' ejercicios</span>' +
                '</div>' +
                (sl.objetivo ?
                    '<div style="max-width:70vw;background:#111827;border:1px solid #1f2937;border-left:6px solid #7c3aed;border-radius:12px;padding:3vh 3vw">' +
                        '<div style="font-size:1.8vh;letter-spacing:2px;color:#a78bfa;text-transform:uppercase;margin-bottom:1vh">Objetivo de la sesion</div>' +
                        '<div style="font-size:3.4vh;line-height:1.35">' + sl.objetivo + '</div>' +
                    '</div>' : '') +
            '</div>';
    } else {
        cuerpo =
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:2vh 3vw 0">' +
                '<span style="background:' + sl.color + ';padding:5px 16px;border-radius:16px;font-size:1.9vh;font-weight:800;text-transform:uppercase;letter-spacing:1px">' + sl.fase + '</span>' +
                '<span style="color:#64748b;font-size:2vh;font-weight:700">' + sl.num + ' / ' + sl.total + '</span>' +
            '</div>' +
            '<div style="flex:1;display:flex;gap:3vw;padding:2vh 3vw;min-height:0;align-items:stretch">' +
                '<div style="flex:1.4;display:flex;align-items:center;justify-content:center;background:#111827;border-radius:14px;overflow:hidden">' +
                    (sl.imagen
                        ? '<img src="' + sl.imagen + '" onclick="mvZoomImagen()" title="Ampliar" style="max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in">'
                        : '<span style="color:#334155;font-size:2.4vh">Sin imagen</span>') +
                '</div>' +
                '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;min-width:0">' +
                    '<h2 style="font-size:4.6vh;margin:0 0 2vh;line-height:1.15">' + sl.titulo + '</h2>' +
                    (sl.duracion ? '<div style="font-size:2.6vh;color:#fbbf24;font-weight:800;margin-bottom:2vh">&#9201; ' + sl.duracion + ' min</div>' : '') +
                    (sl.texto ? '<div style="font-size:2.7vh;line-height:1.5;color:#cbd5e1;overflow-y:auto;max-height:46vh">' + sl.texto + '</div>' : '') +
                '</div>' +
            '</div>';
    }
    ov.innerHTML = cuerpo +
        '<div style="display:flex;align-items:center;justify-content:center;gap:20px;padding:0 0 2.5vh">' +
            '<button onclick="mvMover(-1)" style="background:#1f2937;border:none;color:#fff;font-size:2.6vh;padding:1vh 3vw;border-radius:10px;cursor:pointer">&#8592;</button>' +
            '<button onclick="mvCerrar()" style="background:#7f1d1d;border:none;color:#fff;font-size:2vh;padding:1vh 2.5vw;border-radius:10px;cursor:pointer">Salir</button>' +
            '<button onclick="mvMover(1)" style="background:#1f2937;border:none;color:#fff;font-size:2.6vh;padding:1vh 3vw;border-radius:10px;cursor:pointer">&#8594;</button>' +
        '</div>';
}

function mvMover(d) {
    const nuevo = mvIdx + d;
    if (nuevo < 0 || nuevo >= mvSlides.length) return;
    mvIdx = nuevo;
    mvRender();
}

function mvZoomImagen() {
    const ov = document.getElementById('mv-overlay');
    const sl = mvSlides[mvIdx];
    if (!ov || !sl || !sl.imagen) return;
    if (document.getElementById('mv-zoom')) return;
    const z = document.createElement('div');
    z.id = 'mv-zoom';
    z.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(3,6,15,.96);display:flex;align-items:center;justify-content:center;cursor:zoom-out;z-index:10';
    z.innerHTML =
        '<img src="' + sl.imagen + '" style="width:96%;height:92%;object-fit:contain">' +
        '<span style="position:absolute;top:2vh;right:2vw;color:#94a3b8;font-size:2vh;background:#1f2937;padding:6px 14px;border-radius:10px">Clic o Esc para cerrar</span>';
    z.addEventListener('click', mvZoomCerrar);
    ov.appendChild(z);
}

function mvZoomCerrar() {
    const z = document.getElementById('mv-zoom');
    if (z) z.remove();
}

function mvTeclado(e) {
    if (!document.getElementById('mv-overlay')) return;
    if (e.key === 'Escape' && document.getElementById('mv-zoom')) { e.preventDefault(); mvZoomCerrar(); return; }
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); mvMover(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); mvMover(-1); }
    else if (e.key === 'Escape') { mvCerrar(); }
}

function mvCerrar() {
    document.removeEventListener('keydown', mvTeclado);
    if (document.fullscreenElement) { document.exitFullscreen().catch(function() {}); }
    const ov = document.getElementById('mv-overlay');
    if (ov) ov.remove();
}


// ========== MONTAJES DE CAMPO DE LA SESION (ver, ordenar, borrar, PDF) ==========
var msLista = [];
var msSesionId = null;

async function abrirMontajesSesion(sesionId) {
    msSesionId = sesionId;
    let ov = document.getElementById('ms-modal');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'ms-modal';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:2147483000';
    ov.innerHTML =
        '<div style="background:#1e293b;border-radius:12px;padding:22px;width:560px;max-width:94%;max-height:88vh;overflow-y:auto;color:#fff">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
                '<h3 style="margin:0;font-size:16px">🏟️ Montajes de campo</h3>' +
                '<div style="display:flex;gap:8px">' +
                    '<span style="color:#94a3b8;font-size:11px;align-self:center">📄 PDF:</span>' +
                    '<button onclick="msImprimirPDF(1)" style="padding:7px 10px;border-radius:8px;border:none;background:#f97316;color:#fff;font-weight:700;cursor:pointer;font-size:12px">1/folio</button>' +
                    '<button onclick="msImprimirPDF(2)" style="padding:7px 10px;border-radius:8px;border:none;background:#ea580c;color:#fff;font-weight:700;cursor:pointer;font-size:12px">2/folio</button>' +
                    '<button onclick="msImprimirPDF(6)" style="padding:7px 10px;border-radius:8px;border:none;background:#c2410c;color:#fff;font-weight:700;cursor:pointer;font-size:12px">6/folio</button>' +
                    '<button onclick="document.getElementById(\'ms-modal\').remove()" style="padding:7px 12px;border-radius:8px;border:1px solid #475569;background:transparent;color:#fff;cursor:pointer;font-size:12px">Cerrar</button>' +
                '</div>' +
            '</div>' +
            '<p style="margin:0 0 12px;font-size:12px;color:#94a3b8">Se dibujan en la Pizarra y se guardan con el boton "Guardar montaje de sesion".</p>' +
            '<div id="ms-lista"><p style="color:#64748b;text-align:center;padding:20px">Cargando...</p></div>' +
        '</div>';
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    await msCargar();
}

async function msCargar() {
    const cont = document.getElementById('ms-lista');
    try {
        const { data, error } = await supabaseClient.from('sesion_montajes')
            .select('*').eq('session_id', msSesionId).order('orden');
        if (error) throw error;
        msLista = data || [];
        if (!msLista.length) {
            cont.innerHTML = '<p style="color:#64748b;text-align:center;padding:24px">Esta sesion no tiene montajes todavia.<br>Ve a la Pizarra, dibuja el montaje y pulsa "🏟️ Guardar montaje de sesion".</p>';
            return;
        }
        let h = '';
        msLista.forEach(function(m, i) {
            const url = supabaseClient.storage.from('sesion-montajes').getPublicUrl(m.image_path).data.publicUrl;
            h += '<div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px;margin-bottom:10px;display:flex;gap:12px;align-items:center">' +
                '<img src="' + url + '" onclick="msVerGrande(' + i + ')" title="Ver en grande" style="width:150px;border-radius:6px;background:#1e293b;cursor:zoom-in">' +
                '<div style="flex:1;min-width:0">' +
                    '<div style="font-weight:600;font-size:13px;margin-bottom:4px">' + (m.orden) + '. ' + (m.titulo || 'Montaje') + '</div>' +
                    '<div style="display:flex;gap:6px">' +
                        '<button onclick="msMover(' + i + ',-1)" ' + (i === 0 ? 'disabled' : '') + ' style="padding:4px 10px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:12px">▲</button>' +
                        '<button onclick="msMover(' + i + ',1)" ' + (i === msLista.length - 1 ? 'disabled' : '') + ' style="padding:4px 10px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:12px">▼</button>' +
                        '<button onclick="msBorrar(\'' + m.id + '\')" style="padding:4px 10px;border-radius:6px;border:none;background:#7f1d1d;color:#fecaca;cursor:pointer;font-size:12px">Borrar</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        cont.innerHTML = h;
    } catch (e) {
        console.error('msCargar:', e);
        cont.innerHTML = '<p style="color:#f87171;text-align:center">Error al cargar los montajes.</p>';
    }
}

function msVerGrande(i) {
    const m = msLista[i];
    if (!m) return;
    const url = supabaseClient.storage.from('sesion-montajes').getPublicUrl(m.image_path).data.publicUrl;
    let ov = document.getElementById('ms-ver');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'ms-ver';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2147483200;cursor:zoom-out';
    ov.innerHTML =
        '<div style="color:#fff;font-weight:600;font-size:15px;margin-bottom:10px">' + (m.orden) + '. ' + (m.titulo || 'Montaje') + '</div>' +
        '<img src="' + url + '" style="max-width:96vw;max-height:88vh;border-radius:10px;background:#1e293b">' +
        '<div style="color:#94a3b8;font-size:12px;margin-top:10px">Clic en cualquier sitio para cerrar</div>';
    ov.addEventListener('click', function() { ov.remove(); });
    document.body.appendChild(ov);
}

async function msMover(i, d) {
    const a = msLista[i], b = msLista[i + d];
    if (!a || !b) return;
    await supabaseClient.from('sesion_montajes').update({ orden: b.orden }).eq('id', a.id);
    await supabaseClient.from('sesion_montajes').update({ orden: a.orden }).eq('id', b.id);
    await msCargar();
}

async function msBorrar(id) {
    if (!confirm('¿Borrar este montaje?')) return;
    const m = msLista.find(function(x) { return x.id === id; });
    await supabaseClient.from('sesion_montajes').delete().eq('id', id);
    if (m && m.image_path) {
        try { await supabaseClient.storage.from('sesion-montajes').remove([m.image_path]); } catch (e) {}
    }
    await msCargar();
}

async function msImprimirPDF(porFolio) {
    porFolio = porFolio || 1;
    if (!msLista.length) { showToast('No hay montajes que imprimir'); return; }
    try {
        const { data: s } = await supabaseClient.from('training_sessions')
            .select('name, session_date').eq('id', msSesionId).single();
        const conf = {
            1: { o: 'l', W: 297, H: 210, c: 1, f: 1 },
            2: { o: 'l', W: 297, H: 210, c: 1, f: 2 },
            6: { o: 'p', W: 210, H: 297, c: 2, f: 3 }
        }[porFolio] || { o: 'l', W: 297, H: 210, c: 1, f: 1 };
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(conf.o, 'mm', 'a4');
        const margen = 8, sep = 5, cab = 18;
        const celW = (conf.W - margen * 2 - (conf.c - 1) * sep) / conf.c;
        const areaH = conf.H - cab - margen;
        const celH = (areaH - (conf.f - 1) * sep) / conf.f;
        const porPagina = conf.c * conf.f;

        for (let i = 0; i < msLista.length; i++) {
            const pos = i % porPagina;
            if (i > 0 && pos === 0) doc.addPage();
            if (pos === 0) {
                doc.setFillColor(38, 33, 92);
                doc.rect(0, 0, conf.W, 14, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('Montajes de campo', 8, 9.5);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(200, 200, 215);
                doc.text((s ? (s.name + ' · ' + s.session_date) : ''), conf.W - 8, 9.5, { align: 'right' });
            }
            const m = msLista[i];
            const col = pos % conf.c;
            const fila = Math.floor(pos / conf.c);
            const x = margen + col * (celW + sep);
            const y = cab + fila * (celH + sep);

            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(porFolio === 6 ? 8.5 : 10.5);
            const tit = doc.splitTextToSize((m.orden) + '. ' + (m.titulo || 'Montaje'), celW);
            doc.text(tit[0], x, y + 3.5);

            const url = supabaseClient.storage.from('sesion-montajes').getPublicUrl(m.image_path).data.publicUrl;
            const img = await msCargarImagen(url);
            if (img) {
                const zonaW = celW, zonaH = celH - 6;
                const esc = Math.min(zonaW / img.w, zonaH / img.h);
                const dw = img.w * esc, dh = img.h * esc;
                const dx = x + (zonaW - dw) / 2;
                const dy = y + 5 + (zonaH - dh) / 2;
                doc.addImage(img.dataUrl, 'PNG', dx, dy, dw, dh, undefined, 'FAST');
            }
        }
        doc.save('montajes-' + (s ? s.session_date : 'sesion') + '.pdf');
    } catch (e) {
        console.error('msImprimirPDF:', e);
        showToast('Error al generar el PDF de montajes');
    }
}

// Carga una imagen y devuelve dataURL + dimensiones reales (para mantener proporcion)
function msCargarImagen(url) {
    return msUrlADataUrl(url).then(function(dataUrl) {
        if (!dataUrl) return null;
        return new Promise(function(res) {
            const im = new Image();
            im.onload = function() { res({ dataUrl: dataUrl, w: im.naturalWidth, h: im.naturalHeight }); };
            im.onerror = function() { res(null); };
            im.src = dataUrl;
        });
    });
}

function msUrlADataUrl(url) {
    return fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
        return new Promise(function(res) {
            const rd = new FileReader();
            rd.onload = function() { res(rd.result); };
            rd.onerror = function() { res(null); };
            rd.readAsDataURL(blob);
        });
    }).catch(function() { return null; });
}
