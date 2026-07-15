// ========== STAFF.JS - TopLiderCoach HUB ==========
// Asistentes IA: Johan, Valeri, Arrigo. Integración Groq API

 // ========== TU CUERPO TÉCNICO (IA) ==========
const GROQ_API_KEY = CONFIG.GROQ_API_KEY;

const staffConfig = {
    johan: {
        nombre: 'Johan',
        rol: 'Tu Planificador de Sesiones',
        color: '#f59e0b',
        emoji: '🧠',
        imagen: 'https://toplidercoach.com/wp-content/uploads/2025/12/captura-de-pantalla-2025-12-11-214833.png',
        systemPrompt: `Eres Johan, un experto planificador de sesiones de fútbol inspirado en la filosofía de Johan Cruyff.
Tu especialidad es diseñar sesiones de entrenamiento usando ejercicios REALES de la biblioteca de TopLiderCoach.

IMPORTANTE: Tienes acceso a una biblioteca de ejercicios reales. Cuando el usuario te pida una sesión:
1. Analiza los ejercicios disponibles que te proporciono en el contexto
2. Selecciona los más apropiados para el objetivo
3. Estructura la sesión en: Calentamiento, Parte Principal y Vuelta a la Calma
4. Indica el nombre EXACTO del ejercicio de la biblioteca, su duración y objetivo

Formato de respuesta para sesiones:
📋 NOMBRE DE LA SESIÓN
⏱️ Duración total: X min
🎯 Objetivo: [objetivo]
🏃 Jugadores: X

CALENTAMIENTO (X min):
1. [Nombre ejercicio de la biblioteca] - X min
   Objetivo: [descripción]

PARTE PRINCIPAL (X min):
2. [Nombre ejercicio de la biblioteca] - X min
   Objetivo: [descripción]
...

VUELTA A LA CALMA (X min):
...

Si no encuentras ejercicios apropiados en la biblioteca, sugiere ejercicios genéricos pero indica que no están en la biblioteca.
Responde siempre en español y sé cercano pero profesional.`
    },
    valeri: {
        nombre: 'Valeri',
        rol: 'Tu Analista de Rendimiento',
        color: '#3b82f6',
        emoji: '📊',
        imagen: 'https://toplidercoach.com/wp-content/uploads/2025/12/captura-de-pantalla-2025-12-11-214736.png',
        systemPrompt: `Eres Valeri, un analista de rendimiento deportivo inspirado en Valeriy Lobanovskyi.
Tu especialidad es analizar estadísticas REALES de los jugadores del equipo.

IMPORTANTE: Tienes acceso a las estadísticas reales del equipo:
- Partidos jugados, resultados, goles
- Estadísticas individuales: minutos, goles, asistencias, tarjetas
- Puedes comparar jugadores entre sí
- Puedes detectar tendencias y patrones

Cuando analices datos:
1. Usa SOLO los datos reales que te proporciono
2. Sé objetivo y preciso con los números
3. Compara con promedios del equipo
4. Identifica fortalezas y áreas de mejora
5. Sugiere acciones concretas basadas en los datos

Formato de análisis:
📊 ANÁLISIS: [título]
📈 Datos clave:
- [dato 1]
- [dato 2]
...
💡 Conclusiones:
- [conclusión 1]
- [conclusión 2]
✅ Recomendaciones:
- [recomendación 1]
...

Si te preguntan por algo que no está en los datos, indícalo claramente.
Responde siempre en español.`
    },
    arrigo: {
        nombre: 'Arrigo',
        rol: 'Tu Entrenador Táctico',
        color: '#10b981',
        emoji: '⚽',
        imagen: 'https://toplidercoach.com/wp-content/uploads/2025/12/captura-de-pantalla-2025-12-11-214756.png',
        systemPrompt: `Eres Arrigo, un maestro de la táctica futbolística inspirado en Arrigo Sacchi.
Tu especialidad es recomendar ejercicios TÁCTICOS de la biblioteca de TopLiderCoach.

IMPORTANTE: Tienes acceso a ejercicios reales filtrados por TEMA TÁCTICO.
Cuando el usuario pregunte sobre táctica:
1. Explica el concepto táctico claramente
2. Recomienda ejercicios REALES de la biblioteca relacionados con ese tema
3. Indica el nombre exacto del ejercicio
4. Explica cómo aplicarlo

Temas tácticos que dominas:
- Pressing alto y pressing tras pérdida
- Transiciones ofensivas y defensivas
- Juego de posición y posesión
- Movimientos sin balón
- Desmarques y combinaciones
- Sistemas de juego (4-3-3, 4-4-2, 3-5-2, etc.)
- Jugadas a balón parado
- Defensa en zona vs individual

Formato de respuesta:
⚽ CONCEPTO TÁCTICO: [nombre]
📖 Explicación:
[explicación clara del concepto]

🏋️ EJERCICIOS RECOMENDADOS:
1. [Nombre ejercicio de la biblioteca]
   - Tema: [tema]
   - Cómo aplicarlo: [descripción]
2. ...

💡 Consejos de aplicación:
- [consejo 1]
- [consejo 2]

Responde siempre en español con pasión por la táctica.`
    }
};

let currentStaff = null;
let chatHistory = [];

// ========== FUNCIONES DE CONTEXTO PARA IA ==========

// Obtener datos del club y plantilla
async function obtenerContextoClub() {
    try {
        const { data: jugadores } = await supabaseClient
            .from('season_players')
            .select('id, shirt_number, players(id, name, position)')
            .eq('season_id', seasonId)
            .order('shirt_number');
        
        return {
            clubNombre: clubData?.name || 'Mi Club',
            jugadores: (jugadores || []).map(sp => ({
                id: sp.players?.id,
                nombre: sp.players?.name,
                dorsal: sp.shirt_number,
                posicion: sp.players?.position
            }))
        };
    } catch (e) {
        console.error('Error obteniendo contexto club:', e);
        return { clubNombre: 'Mi Club', jugadores: [] };
    }
}

// Obtener estadísticas para Valeri
async function obtenerContextoEstadisticas() {
    try {
        // Partidos de la temporada
        const { data: partidos } = await supabaseClient
            .from('matches')
            .select('*')
            .eq('season_id', seasonId)
            .order('match_date', { ascending: false });
        
        // Estadísticas de jugadores
        const { data: stats } = await supabaseClient
            .from('match_player_stats')
            .select('*, players(id, name, position), matches!inner(id, opponent, match_date, result, team_goals, opponent_goals, season_id)')
            .eq('matches.season_id', seasonId);
        
        // Agrupar stats por jugador
        const jugadorStats = {};
        (stats || []).forEach(s => {
            const pid = s.player_id;
            if (!jugadorStats[pid]) {
                jugadorStats[pid] = {
                    nombre: s.players?.name,
                    posicion: s.players?.position,
                    partidos: 0,
                    minutos: 0,
                    goles: 0,
                    asistencias: 0,
                    amarillas: 0,
                    rojas: 0
                };
            }
            if (s.minutes_played > 0) jugadorStats[pid].partidos++;
            jugadorStats[pid].minutos += s.minutes_played || 0;
            jugadorStats[pid].goles += s.goals || 0;
            jugadorStats[pid].asistencias += s.assists || 0;
            jugadorStats[pid].amarillas += s.yellow_cards || 0;
            jugadorStats[pid].rojas += s.red_cards || 0;
        });
        
        // Resumen de partidos
        const victorias = partidos?.filter(p => p.result === 'win').length || 0;
        const empates = partidos?.filter(p => p.result === 'draw').length || 0;
        const derrotas = partidos?.filter(p => p.result === 'loss').length || 0;
        const golesFavor = partidos?.reduce((sum, p) => sum + (p.team_goals || 0), 0) || 0;
        const golesContra = partidos?.reduce((sum, p) => sum + (p.opponent_goals || 0), 0) || 0;
        
        return {
            totalPartidos: partidos?.length || 0,
            partidosJugados: partidos?.filter(p => p.result).length || 0,
            victorias,
            empates,
            derrotas,
            golesFavor,
            golesContra,
            estadisticasJugadores: Object.values(jugadorStats).sort((a, b) => b.goles - a.goles),
            ultimosPartidos: (partidos || []).slice(0, 5).map(p => ({
                rival: p.opponent,
                fecha: p.match_date,
                resultado: p.result,
                marcador: `${p.team_goals || 0}-${p.opponent_goals || 0}`
            }))
        };
    } catch (e) {
        console.error('Error obteniendo estadísticas:', e);
        return null;
    }
}

// Obtener ejercicios de la API para Johan
async function obtenerEjerciciosPorTema(tema = '', limite = 15) {
    try {
        let url = `${API_BASE}/ejercicios?per_page=${limite}`;
        if (tema) url += `&tema=${encodeURIComponent(tema)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return (data.ejercicios || []).map(ej => ({
            id: ej.id,
            titulo: ej.titulo,
            tema: ej.tema,
            dificultad: ej.dificultad,
            duracion: ej.duracion || 10,
            imagen: ej.imagen
        }));
    } catch (e) {
        console.error('Error obteniendo ejercicios:', e);
        return [];
    }
}

// Obtener temas disponibles
async function obtenerTemasDisponibles() {
    try {
        const response = await fetch(`${API_BASE}/filtros`);
        const data = await response.json();
        return data.filtros?.temas || [];
    } catch (e) {
        console.error('Error obteniendo temas:', e);
        return [];
    }
}

// Obtener sesiones recientes para Johan
async function obtenerContextoSesiones() {
    try {
        const { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date, objective, warm_up, main_part, cool_down')
            .eq('club_id', clubId)
            .order('session_date', { ascending: false })
            .limit(10);
        
        return {
            totalSesiones: sesiones?.length || 0,
            ultimasSesiones: (sesiones || []).map(s => ({
                nombre: s.name,
                fecha: s.session_date,
                objetivo: s.objective,
                duracion: (s.warm_up?.length || 0) + (s.main_part?.length || 0) + (s.cool_down?.length || 0),
                fase: s.objective ? 'completa' : 'sin objetivo'
            }))
        };
    } catch (e) {
        console.error('Error obteniendo sesiones:', e);
        return { totalSesiones: 0, ultimasSesiones: [] };
    }
}

// Generar contexto según el asistente
function generarContextoParaIA(staff, contextoClub, contextoStats, contextoSesiones, ejercicios, temas) {
    let contexto = `\n\n--- DATOS DEL EQUIPO ---\n`;
    contexto += `Club: ${contextoClub.clubNombre}\n`;
    contexto += `Plantilla (${contextoClub.jugadores.length} jugadores):\n`;
    contextoClub.jugadores.forEach(j => {
        contexto += `- #${j.dorsal} ${j.nombre} (${j.posicion})\n`;
    });
    
    if (staff === 'valeri' && contextoStats) {
        contexto += `\n--- ESTADÍSTICAS DE TEMPORADA ---\n`;
        contexto += `Partidos jugados: ${contextoStats.partidosJugados}\n`;
        contexto += `Victorias: ${contextoStats.victorias} | Empates: ${contextoStats.empates} | Derrotas: ${contextoStats.derrotas}\n`;
        contexto += `Goles a favor: ${contextoStats.golesFavor} | Goles en contra: ${contextoStats.golesContra}\n`;
        
        if (contextoStats.ultimosPartidos.length > 0) {
            contexto += `\nÚltimos partidos:\n`;
            contextoStats.ultimosPartidos.forEach(p => {
                const res = p.resultado === 'win' ? '✅' : p.resultado === 'draw' ? '🟡' : '❌';
                contexto += `${res} vs ${p.rival}: ${p.marcador}\n`;
            });
        }
        
        if (contextoStats.estadisticasJugadores.length > 0) {
            contexto += `\nEstadísticas por jugador:\n`;
            contextoStats.estadisticasJugadores.forEach(j => {
                contexto += `- ${j.nombre} (${j.posicion}): ${j.partidos} PJ, ${j.minutos} min, ${j.goles} goles, ${j.asistencias} asist, ${j.amarillas} TA, ${j.rojas} TR\n`;
            });
        }
    }
    
    if (staff === 'johan') {
        if (contextoSesiones && contextoSesiones.ultimasSesiones.length > 0) {
            contexto += `\n--- SESIONES RECIENTES ---\n`;
            contextoSesiones.ultimasSesiones.forEach(s => {
                contexto += `- ${s.fecha}: "${s.nombre}" - Objetivo: ${s.objetivo || 'No definido'}\n`;
            });
        }
        
        if (ejercicios && ejercicios.length > 0) {
            contexto += `\n--- EJERCICIOS DISPONIBLES EN LA BIBLIOTECA ---\n`;
            ejercicios.forEach(ej => {
                contexto += `- "${ej.titulo}" | Tema: ${ej.tema || 'General'} | Duración: ${ej.duracion} min | Dificultad: ${ej.dificultad || '?'}\n`;
            });
        }
        
        if (temas && temas.length > 0) {
            contexto += `\nTemas disponibles para filtrar: ${temas.join(', ')}\n`;
        }
    }
    
    if (staff === 'arrigo') {
        if (temas && temas.length > 0) {
            contexto += `\n--- TEMAS DE ENTRENAMIENTO DISPONIBLES ---\n`;
            contexto += temas.join(', ') + '\n';
        }
        
        if (ejercicios && ejercicios.length > 0) {
            contexto += `\n--- EJERCICIOS TÁCTICOS DISPONIBLES ---\n`;
            ejercicios.forEach(ej => {
                contexto += `- "${ej.titulo}" | Tema: ${ej.tema || 'General'} | Duración: ${ej.duracion} min\n`;
            });
        }
    }
    
    return contexto;
}

// ========== FUNCIONES DEL CHAT ==========

async function abrirChatStaff(staffId) {
    currentStaff = staffId;
    const staff = staffConfig[staffId];
    
    // Configurar modal
    document.getElementById('chat-nombre').textContent = staff.nombre;
    document.getElementById('chat-rol').textContent = staff.rol;
    document.getElementById('chat-avatar').innerHTML = `<img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    document.getElementById('chat-avatar').style.background = `linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%)`;
    document.getElementById('chat-header').style.background = `linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%)`;
    document.getElementById('chat-header').style.color = 'white';
    
    // Limpiar chat
    chatHistory = [];
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = `
        <div class="chat-message assistant">
            <div class="avatar" style="background: linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%);"><img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <div class="contenido">
                <em>Cargando datos del equipo...</em>
            </div>
        </div>
    `;
    
    document.getElementById('modal-chat-staff').style.display = 'flex';
    
    // Cargar contexto según el asistente
    try {
        const contextoClub = await obtenerContextoClub();
        let contextoStats = null;
        let contextoSesiones = null;
        let ejercicios = [];
        let temas = [];
        
        if (staffId === 'valeri') {
            contextoStats = await obtenerContextoEstadisticas();
        }
        
        if (staffId === 'johan') {
            contextoSesiones = await obtenerContextoSesiones();
            ejercicios = await obtenerEjerciciosPorTema('', 20);
            temas = await obtenerTemasDisponibles();
        }
        
        if (staffId === 'arrigo') {
            temas = await obtenerTemasDisponibles();
            // Cargar ejercicios de varios temas tácticos
            ejercicios = await obtenerEjerciciosPorTema('', 25);
        }
        
        // Guardar contexto para usarlo en las consultas
        window.currentStaffContext = generarContextoParaIA(staffId, contextoClub, contextoStats, contextoSesiones, ejercicios, temas);
        
        // Mensaje de bienvenida personalizado
     // DESPUÉS (más natural):
let saludoExtra = '';
if (staffId === 'valeri' && contextoStats) {
    saludoExtra = `Ya he revisado las estadísticas de la temporada.`;
} else if (staffId === 'johan') {
    saludoExtra = `Estoy listo para diseñar tu próxima sesión.`;
} else if (staffId === 'arrigo') {
    saludoExtra = `¿Qué aspecto táctico quieres trabajar?`;
}
        
        messagesDiv.innerHTML = `
            <div class="chat-message assistant">
                <div class="avatar" style="background: linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%);"><img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="contenido">
                    ¡Hola! Soy <strong>${staff.nombre}</strong>, ${staff.rol.toLowerCase()}. 
                    ${contextoClub.jugadores.length > 0 
                        ? `Veo que tienes ${contextoClub.jugadores.length} jugadores en la plantilla de ${contextoClub.clubNombre}.` 
                        : 'No veo jugadores en tu plantilla actual.'}
                    ${saludoExtra}
                    <br><br>¿En qué puedo ayudarte?
                </div>
            </div>
        `;
        
    } catch (e) {
        console.error('Error cargando contexto:', e);
        messagesDiv.innerHTML = `
            <div class="chat-message assistant">
                <div class="avatar" style="background: linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%);"><img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="contenido">
                    ¡Hola! Soy <strong>${staff.nombre}</strong>. No he podido cargar todos los datos del equipo, pero puedo ayudarte con consultas generales. ¿En qué puedo ayudarte?
                </div>
            </div>
        `;
    }
    
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input').focus();
}

function cerrarChatStaff(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-chat-staff').style.display = 'none';
    currentStaff = null;
    chatHistory = [];
    window.currentStaffContext = null;
}

async function enviarMensajeChat() {
    const input = document.getElementById('chat-input');
    const mensaje = input.value.trim();
    
    if (!mensaje || !currentStaff) return;
    
    const staff = staffConfig[currentStaff];
    const messagesDiv = document.getElementById('chat-messages');
    
    // Añadir mensaje del usuario
    messagesDiv.innerHTML += `
        <div class="chat-message user">
            <div class="avatar">👤</div>
            <div class="contenido">${mensaje}</div>
        </div>
    `;
    
    input.value = '';
    
    // Mostrar indicador de escritura
    const typingId = 'typing-' + Date.now();
    messagesDiv.innerHTML += `
        <div class="chat-typing" id="${typingId}">
            <div class="avatar" style="background: linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;"><img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <span>${staff.nombre} está escribiendo...</span>
            <div class="dots"><span></span><span></span></div>
        </div>
    `;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Añadir a historial
    chatHistory.push({ role: 'user', content: mensaje });
    
    try {
        // ========== BÚSQUEDA DINÁMICA DE EJERCICIOS ==========
        if (currentStaff === 'johan' || currentStaff === 'arrigo') {
            
            // Obtener temas disponibles
            const temasDisponibles = await obtenerTemasDisponibles();
            
            // Detectar si el usuario menciona algún tema
            const mensajeLower = mensaje.toLowerCase();
            let temasEncontrados = temasDisponibles.filter(tema => 
                mensajeLower.includes(tema.toLowerCase())
            );
            
            // Palabras clave comunes que mapean a temas
            const mapeoTemas = {
                'pressing': ['pressing', 'presion', 'presionar'],
                'posesion': ['posesion', 'posesión', 'tener el balon', 'mantener'],
                'transicion': ['transicion', 'transición', 'contragolpe', 'contra'],
                'finalizacion': ['finalizacion', 'finalización', 'remate', 'gol', 'disparar'],
                'defensa': ['defensa', 'defender', 'defensivo'],
                'ataque': ['ataque', 'atacar', 'ofensivo'],
                'rondo': ['rondo', 'rondos'],
                'calentamiento': ['calentamiento', 'calentar', 'activacion'],
                'fisico': ['fisico', 'físico', 'resistencia', 'fuerza', 'velocidad'],
                'tactica': ['tactica', 'táctica', 'tactico', 'táctico', 'sistema'],
                'tecnica': ['tecnica', 'técnica', 'control', 'pase', 'conduccion']
            };
            
            // Buscar en el mapeo
            for (const [tema, keywords] of Object.entries(mapeoTemas)) {
                if (keywords.some(kw => mensajeLower.includes(kw))) {
                    // Buscar el tema real que coincida
                    const temaReal = temasDisponibles.find(t => 
                        t.toLowerCase().includes(tema) || tema.includes(t.toLowerCase())
                    );
                    if (temaReal && !temasEncontrados.includes(temaReal)) {
                        temasEncontrados.push(temaReal);
                    }
                }
            }
            
            // Buscar ejercicios de los temas encontrados
            let ejerciciosRelevantes = [];
            
            if (temasEncontrados.length > 0) {
                // Buscar por cada tema encontrado
                for (const tema of temasEncontrados.slice(0, 3)) { // Máximo 3 temas
                    const ejerciciosTema = await obtenerEjerciciosPorTema(tema, 15);
                    ejerciciosRelevantes = ejerciciosRelevantes.concat(ejerciciosTema);
                }
            } else {
                // Si no hay tema, buscar por palabras clave en el título
                const palabrasBusqueda = mensajeLower
                    .split(' ')
                    .filter(p => p.length > 3 && !['para', 'como', 'quiero', 'dame', 'necesito', 'crear', 'hacer'].includes(p));
                
                if (palabrasBusqueda.length > 0) {
                    // Buscar por la primera palabra clave relevante
                    const response = await fetch(`${API_BASE}/ejercicios?search=${encodeURIComponent(palabrasBusqueda[0])}&per_page=20`);
                    const data = await response.json();
                    ejerciciosRelevantes = (data.ejercicios || []).map(ej => ({
                        id: ej.id,
                        titulo: ej.titulo,
                        tema: ej.tema,
                        dificultad: ej.dificultad,
                        duracion: ej.duracion || 10
                    }));
                }
                
                // Si aún no hay ejercicios, cargar algunos generales
                if (ejerciciosRelevantes.length === 0) {
                    ejerciciosRelevantes = await obtenerEjerciciosPorTema('', 20);
                }
            }
            
            // Eliminar duplicados
            const ejerciciosUnicos = [];
            const idsVistos = new Set();
            for (const ej of ejerciciosRelevantes) {
                if (!idsVistos.has(ej.id)) {
                    idsVistos.add(ej.id);
                    ejerciciosUnicos.push(ej);
                }
            }
            
            // Actualizar contexto con ejercicios encontrados
            if (ejerciciosUnicos.length > 0) {
                let contextoEjercicios = `\n\n--- EJERCICIOS ENCONTRADOS PARA TU CONSULTA ---\n`;
                // DESPUÉS:
contextoEjercicios += `\n`;
                
                ejerciciosUnicos.forEach((ej, idx) => {
                    contextoEjercicios += `${idx + 1}. "${ej.titulo}"\n`;
                    contextoEjercicios += `   - Tema: ${ej.tema || 'General'}\n`;
                    contextoEjercicios += `   - Duración: ${ej.duracion} min\n`;
                    contextoEjercicios += `   - Dificultad: ${ej.dificultad || 'No especificada'}\n\n`;
                });
                
                window.currentStaffContext = (window.currentStaffContext || '') + contextoEjercicios;
            }
        }
        
        // Construir prompt con contexto
        const promptConContexto = staff.systemPrompt + (window.currentStaffContext || '');
        
        const respuesta = await llamarGroq(promptConContexto, chatHistory);
        
        // Quitar indicador de escritura
        document.getElementById(typingId)?.remove();
        
        // Añadir respuesta
        chatHistory.push({ role: 'assistant', content: respuesta });
        
        messagesDiv.innerHTML += `
            <div class="chat-message assistant">
                <div class="avatar" style="background: linear-gradient(135deg, ${staff.color} 0%, ${staff.color}dd 100%);"><img src="${staff.imagen}" alt="${staff.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="contenido">${formatearRespuesta(respuesta)}</div>
            </div>
        `;
        
    } catch (error) {
        document.getElementById(typingId)?.remove();
        messagesDiv.innerHTML += `
            <div class="chat-message assistant">
                <div class="avatar" style="background: #ef4444;">⚠️</div>
                <div class="contenido" style="color: #dc2626;">Lo siento, ha ocurrido un error. Inténtalo de nuevo.</div>
            </div>
        `;
        console.error('Error Groq:', error);
    }
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
async function llamarGroq(systemPrompt, messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 2500
        })
    });
    
    if (!response.ok) {
        throw new Error('Error en la API de Groq');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

function formatearRespuesta(texto) {
    return texto
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}
