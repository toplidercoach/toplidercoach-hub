// ========== DASHBOARD.JS - TopLiderCoach HUB ==========
registrarModulo('dashboard', function() { cargarSelectorTemporadasDashboard(); cargarDashboard(); });
registrarInit(function() { cargarSelectorTemporadasDashboard(); cargarDashboard(); });

async function cargarSelectorTemporadasDashboard() {
    const select = document.getElementById('dashboard-temporada');
    if (!select) return;
    const { data: temporadas } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
    select.innerHTML = '<option value="">Todas</option>';
    if (temporadas) temporadas.forEach(t => { const o = document.createElement('option'); o.value = t.id; o.textContent = t.name; if (t.id === seasonId) o.selected = true; select.appendChild(o); });
}

async function cargarDashboard() {
    cargarHeroBanner();
    await cargarDatosPartidosDashboard();
    await cargarTopPerformers();
    await cargarEstadoPlantilla();
    await cargarDatosEntrenamientosDashboard();
    await cargarProximosEventos();
    await cargarAlertasWellness();
}

function cargarHeroBanner() {
    const logoEl = document.getElementById('dash-club-logo');
    const nameEl = document.getElementById('dash-club-name');
    if (clubData) {
        nameEl.textContent = clubData.name || 'Mi Equipo';
        logoEl.innerHTML = clubData.logo_url ? `<img src="${clubData.logo_url}" alt="">` : '⚽';
    }
}

function actualizarHeroStats(pj,v,e,d,gf,gc) {
    document.getElementById('dh-pj').textContent = pj;
    document.getElementById('dh-v').textContent = v;
    document.getElementById('dh-e').textContent = e;
    document.getElementById('dh-d').textContent = d;
    document.getElementById('dh-gf').textContent = gf;
    document.getElementById('dh-gc').textContent = gc;
    const dif = gf - gc;
    const difEl = document.getElementById('dh-dif');
    difEl.textContent = (dif >= 0 ? '+' : '') + dif;
    difEl.style.color = dif >= 0 ? '#22c55e' : '#ef4444';
    document.getElementById('dh-pct').textContent = (pj > 0 ? Math.round((v/pj)*100) : 0) + '%';
}

async function cargarDatosPartidosDashboard() {
    const tempId = document.getElementById('dashboard-temporada')?.value || seasonId;
    let query = supabaseClient.from('matches').select('*').eq('club_id', clubId).order('match_date', { ascending: false });
    if (tempId) query = query.eq('season_id', tempId);
    const { data: partidos } = await query;
    if (!partidos || partidos.length === 0) { actualizarHeroStats(0,0,0,0,0,0); mostrarSinDatosPartidos(); return; }
    const pj = partidos.filter(p => p.result);
    const v = pj.filter(p => p.result === 'win').length, e = pj.filter(p => p.result === 'draw').length, d = pj.filter(p => p.result === 'loss').length;
    const gf = pj.reduce((s,p) => s + (p.team_goals||0), 0), gc = pj.reduce((s,p) => s + (p.opponent_goals||0), 0);
    actualizarHeroStats(pj.length, v, e, d, gf, gc);
    const difEl = document.getElementById('dash-diferencia-goles');
    if (difEl) { difEl.textContent = (gf-gc >= 0 ? '+' : '') + (gf-gc); difEl.style.color = gf>=gc ? '#22c55e' : '#ef4444'; }
    const jugados = pj.slice(0,5), pend = partidos.filter(p => !p.result).reverse().slice(0,5);
    mostrarUltimosPartidos([...jugados,...pend].sort((a,b) => new Date(a.match_date)-new Date(b.match_date)).slice(-10));
    crearGraficosResultadosPorCompeticion(pj);
    crearGraficoGoles(gf, gc);
}

function mostrarSinDatosPartidos() {
    const d = document.getElementById('dash-diferencia-goles'); if(d) d.textContent = '+0';
    document.getElementById('dash-ultimos-partidos').innerHTML = '<div class="sin-datos"><div class="icono">⚽</div><p>No hay partidos registrados</p></div>';
    crearGraficosResultadosPorCompeticion([]);
    crearGraficoGoles(0, 0);
}

// ========== TOP PERFORMERS ==========
async function cargarTopPerformers() {
    const tempId = document.getElementById('dashboard-temporada')?.value || seasonId;
    const grid = document.getElementById('dash-perf-grid');
    const container = document.getElementById('dash-performers');
    if (!grid || !tempId) { if(container) container.style.display='none'; return; }
    const { data: stats } = await supabaseClient.from('match_player_stats').select('player_id, minutes_played, goals, assists, yellow_cards, red_cards, matches!inner(season_id)').eq('matches.season_id', tempId);
    if (!stats || stats.length === 0) { container.style.display='none'; return; }
    const agg = {};
    stats.forEach(s => { const pid = s.player_id; if (!agg[pid]) agg[pid]={pj:0,min:0,g:0,a:0}; if(s.minutes_played>0) agg[pid].pj++; agg[pid].min+=s.minutes_played||0; agg[pid].g+=s.goals||0; agg[pid].a+=s.assists||0; });
    const playerIds = Object.keys(agg);
    const { data: players } = await supabaseClient.from('players').select('id, name, photo_url, position').in('id', playerIds);
    const pm = {}; (players||[]).forEach(p => pm[p.id]=p);
    const topG = Object.entries(agg).sort((a,b)=>b[1].g-a[1].g)[0];
    const topA = Object.entries(agg).sort((a,b)=>b[1].a-a[1].a)[0];
    const topM = Object.entries(agg).sort((a,b)=>b[1].min-a[1].min)[0];
    const topP = Object.entries(agg).sort((a,b)=>b[1].pj-a[1].pj)[0];
    const perfs = [
        {label:'Máx. Goleador',icon:'⚽',pid:topG?.[0],val:topG?.[1]?.g||0,unit:'goles',color:'#22c55e'},
        {label:'Máx. Asistente',icon:'👟',pid:topA?.[0],val:topA?.[1]?.a||0,unit:'asist.',color:'#3b82f6'},
        {label:'Más Minutos',icon:'⏱️',pid:topM?.[0],val:topM?.[1]?.min||0,unit:'min',color:'#8b5cf6'},
        {label:'Más Partidos',icon:'🏟️',pid:topP?.[0],val:topP?.[1]?.pj||0,unit:'PJ',color:'#f59e0b'}
    ];
    if (!perfs.some(p=>p.val>0)) { container.style.display='none'; return; }
    container.style.display = '';
    grid.innerHTML = perfs.filter(p=>p.val>0).map(p => {
        const pl = pm[p.pid]||{};
        const nombre = pl.name ? pl.name.split(' ').pop().toUpperCase() : '—';
        const foto = pl.photo_url ? `<img src="${pl.photo_url}" alt="">` : `<div class="dash-perf-nofoto">${(pl.name||'?').charAt(0)}</div>`;
        return `<div class="dash-perf-card" style="--perf-color:${p.color}"><div class="dash-perf-foto">${foto}</div><div class="dash-perf-info"><div class="dash-perf-name">${nombre}</div><div class="dash-perf-pos">${pl.position||''}</div></div><div class="dash-perf-stat"><span class="dash-perf-val">${p.val}</span><span class="dash-perf-unit">${p.unit}</span></div><div class="dash-perf-label">${p.icon} ${p.label}</div></div>`;
    }).join('');
}

// ========== ESTADO PLANTILLA ==========
async function cargarEstadoPlantilla() {
    const c = document.getElementById('dash-squad-status'); if(!c) return;
    const { data: sp } = await supabaseClient.from('season_players').select('shirt_number, players(id, name, photo_url, position, status)').eq('season_id', seasonId).order('shirt_number');
    if (!sp || sp.length===0) { c.innerHTML='<div class="sin-datos"><div class="icono">👥</div><p>Sin plantilla</p></div>'; return; }
    const inj = sp.filter(s=>s.players?.status==='injured'), sus = sp.filter(s=>s.players?.status==='suspended'), avail = sp.filter(s=>s.players?.status==='available'||!s.players?.status);
    if (inj.length===0 && sus.length===0) { c.innerHTML=`<div class="dash-squad-ok"><div class="dash-squad-ok-icon">✅</div><div class="dash-squad-ok-text">Plantilla completa</div><div class="dash-squad-ok-count">${avail.length} disponibles</div></div>`; return; }
    let html = `<div class="dash-squad-summary"><span class="dash-sq-avail">${avail.length} disp.</span>${inj.length?`<span class="dash-sq-inj">${inj.length} lesion.</span>`:''}${sus.length?`<span class="dash-sq-sus">${sus.length} sanc.</span>`:''}</div>`;
    [...inj.map(s=>({...s,tipo:'injured'})),...sus.map(s=>({...s,tipo:'suspended'}))].forEach(s => {
        const j=s.players||{};
        const foto=j.photo_url?`<img src="${j.photo_url}" alt="">`:`<span>${(j.name||'?').charAt(0)}</span>`;
        html+=`<div class="dash-sq-player ${s.tipo==='injured'?'inj':'sus'}"><div class="dash-sq-foto">${foto}</div><div class="dash-sq-info"><div class="dash-sq-name">${j.name||''}</div><div class="dash-sq-pos">${j.position||''} · #${s.shirt_number||'-'}</div></div><div class="dash-sq-badge ${s.tipo==='injured'?'inj':'sus'}">${s.tipo==='injured'?'🏥 Lesión':'⛔ Sanción'}</div></div>`;
    });
    c.innerHTML = html;
}

// ========== ÚLTIMOS PARTIDOS ==========
function mostrarUltimosPartidos(partidos) {
    const c = document.getElementById('dash-ultimos-partidos');
    if (!partidos||partidos.length===0) { c.innerHTML='<div class="sin-datos"><div class="icono">⚽</div><p>No hay partidos</p></div>'; return; }
    const miEsc = clubData?.logo_url?`<img src="${clubData.logo_url}" alt="" class="escudo-mini">`:'<span class="escudo-placeholder">🏠</span>';
    const miN = clubData?.name||'Mi Equipo';
    c.innerHTML = partidos.map(p => {
        const loc=p.home_away==='home', jug=!!p.result;
        const fechaStr = new Date(p.match_date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
        let comp = p.competition||''; if(comp&&p.round) comp+='. '+p.round;
        const rivEsc = p.opponent_logo?`<img src="${p.opponent_logo}" alt="" class="escudo-mini">`:'<span class="escudo-placeholder">🏟️</span>';
        let centro='';
        if(jug){const gf=p.team_goals||0,gc=p.opponent_goals||0;centro=`<span class="match-score">${loc?gf+'-'+gc:gc+'-'+gf}</span>`;}
        else{centro=`<span class="match-time">${p.kick_off_time?p.kick_off_time.slice(0,5):'TBD'}</span>`;}
        const badge=jug?`<span class="match-badge badge-${p.result==='win'?'win':p.result==='draw'?'draw':'loss'}"></span>`:'';
        return `<div class="match-row ${jug?'played':'upcoming'}" onclick="verPartido('${p.id}')">${badge}${comp?`<div class="match-competition">${comp}</div>`:''}<div class="match-teams"><div class="match-team left"><span class="team-name">${loc?miN:p.opponent}</span>${loc?miEsc:rivEsc}</div><div class="match-center">${centro}</div><div class="match-team right">${loc?rivEsc:miEsc}<span class="team-name">${loc?p.opponent:miN}</span></div></div><div class="match-date">${fechaStr}</div></div>`;
    }).join('');
}

// ========== CHARTS ==========
let chartsCompeticion = [];
function crearGraficosResultadosPorCompeticion(pj) {
    chartsCompeticion.forEach(c=>c.destroy()); chartsCompeticion=[];
    const tv=pj.filter(p=>p.result==='win').length,te=pj.filter(p=>p.result==='draw').length,td=pj.filter(p=>p.result==='loss').length,tp=tv+te+td;
    const ctx=document.getElementById('chart-resultados-total');
    if(ctx){const ch=crearDonut(ctx,tv,te,td);if(ch)chartsCompeticion.push(ch);}
    const st=document.getElementById('stats-total');if(st)st.innerHTML=`<span class="donut-stat-line">${tp}PJ · ${tv}V · ${te}E · ${td}D</span>`;
    const porComp={};pj.forEach(p=>{const c=p.competition||'Sin clasificar';if(!porComp[c])porComp[c]=[];porComp[c].push(p);});
    const cont=document.getElementById('donuts-competiciones');if(!cont)return;cont.innerHTML='';
    Object.keys(porComp).sort().forEach(comp=>{
        const ps=porComp[comp],v=ps.filter(p=>p.result==='win').length,e=ps.filter(p=>p.result==='draw').length,d=ps.filter(p=>p.result==='loss').length,n=v+e+d;
        const cid='chart-comp-'+comp.replace(/\s+/g,'-').toLowerCase();
        const w=document.createElement('div');w.className='resultado-donut mini';
        w.innerHTML=`<canvas id="${cid}"></canvas><div class="donut-label">${comp}</div><div class="donut-stats"><span class="donut-stat-line">${n}PJ·${v}V·${e}E·${d}D</span></div>`;
        cont.appendChild(w);const cx=document.getElementById(cid);if(cx){const ch=crearDonut(cx,v,e,d);if(ch)chartsCompeticion.push(ch);}
    });
}

function crearDonut(ctx,vic,emp,der) {
    const t=vic+emp+der;
    if(t===0) return new Chart(ctx,{type:'doughnut',data:{labels:['Sin partidos'],datasets:[{data:[1],backgroundColor:['#e5e7eb'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false},tooltip:{enabled:false}}}});
    const ctp={id:'centerText',afterDraw:function(chart){const{ctx:c,chartArea}=chart;const cx=(chartArea.left+chartArea.right)/2,cy=(chartArea.top+chartArea.bottom)/2;c.save();c.textAlign='center';c.textBaseline='middle';const big=chart.canvas.parentElement.classList.contains('principal');c.font='bold '+(big?'22px':'16px')+' system-ui';c.fillStyle='#22c55e';c.fillText(Math.round((vic/t)*100)+'%',cx,cy-6);c.font=(big?'11px':'9px')+' system-ui';c.fillStyle='#9ca3af';c.fillText('victorias',cx,cy+12);c.restore();}};
    return new Chart(ctx,{type:'doughnut',data:{labels:['Victorias','Empates','Derrotas'],datasets:[{data:[vic,emp,der],backgroundColor:['#22c55e','#f59e0b','#ef4444'],borderWidth:2,borderColor:'#fff',hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:true,cutout:'68%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return c.label+': '+c.raw+' ('+Math.round((c.raw/t)*100)+'%)';}}}}},plugins:[ctp]});
}

function crearGraficoGoles(f,c) {
    const ctx=document.getElementById('chart-goles');if(!ctx)return;
    if(chartGoles)chartGoles.destroy();
    chartGoles=new Chart(ctx,{type:'bar',data:{labels:['A favor','En contra','Diferencia'],datasets:[{data:[f,c,f-c],backgroundColor:['#22c55e','#ef4444',f>=c?'#3b82f6':'#f97316'],borderRadius:8,barThickness:50}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f0f0f0'}},x:{grid:{display:false}}}}});
}

// ========== ENTRENAMIENTOS ==========
async function cargarDatosEntrenamientosDashboard() {
    const now=new Date(),ini=new Date(now.getFullYear(),now.getMonth(),1).toLocaleDateString('en-CA'),fin=new Date(now.getFullYear(),now.getMonth()+1,0).toLocaleDateString('en-CA');
    const{data:ses}=await supabaseClient.from('training_sessions').select('id').eq('club_id',clubId).gte('session_date',ini).lte('session_date',fin);
    const n=ses?.length||0;document.getElementById('dash-sesiones').textContent=n;
    if(n===0){document.getElementById('dash-asistencia-media').textContent='-';document.getElementById('dash-wellness-medio').textContent='-';return;}
    const{data:att}=await supabaseClient.from('attendance').select('asistio, wellness').in('sesion_id',ses.map(s=>s.id));
    if(att&&att.length>0){const tot=att.length,ok=att.filter(a=>a.asistio).length;document.getElementById('dash-asistencia-media').textContent=Math.round((ok/tot)*100)+'%';const wv=att.filter(a=>a.wellness).map(a=>a.wellness);document.getElementById('dash-wellness-medio').textContent=wv.length>0?(wv.reduce((a,b)=>a+b,0)/wv.length).toFixed(1):'-';}
    else{document.getElementById('dash-asistencia-media').textContent='-';document.getElementById('dash-wellness-medio').textContent='-';}
}

// ========== PRÓXIMOS EVENTOS ==========
async function cargarProximosEventos() {
    const c=document.getElementById('dash-proximos-eventos');const n=new Date();const hoy=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
    const{data:pa}=await supabaseClient.from('matches').select('*').eq('club_id',clubId).gte('match_date',hoy).is('result',null).order('match_date').limit(3);
    const{data:se}=await supabaseClient.from('training_sessions').select('*').eq('club_id',clubId).gte('session_date',hoy).order('session_date').limit(3);
    const ev=[];
    (pa||[]).forEach(p=>ev.push({tipo:'partido',fecha:p.match_date,titulo:`vs ${p.opponent}`,sub:p.home_away==='home'?'Local':'Visitante',hora:p.kick_off_time?p.kick_off_time.slice(0,5):''}));
    (se||[]).forEach(s=>ev.push({tipo:'sesion',fecha:s.session_date,titulo:s.name,sub:s.objective||'Entrenamiento',hora:s.hora_inicio||''}));
    ev.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
    if(ev.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">📅</div><p>No hay eventos próximos</p></div>';return;}
    c.innerHTML=ev.slice(0,5).map(e=>{const f=new Date(e.fecha+'T12:00:00');return`<div class="evento-item ${e.tipo}"><div class="evento-fecha"><div class="dia">${f.getDate()}</div><div class="mes">${f.toLocaleDateString('es-ES',{month:'short'}).toUpperCase()}</div></div><div class="evento-info"><div class="titulo">${e.titulo}</div><div class="subtitulo">${e.sub}${e.hora?' - '+e.hora:''}</div></div><div class="evento-tipo ${e.tipo}">${e.tipo==='partido'?'⚽':'🏃'}</div></div>`;}).join('');
}

// ========== ALERTAS WELLNESS ==========
async function cargarAlertasWellness() {
    const c=document.getElementById('dash-alertas-wellness');
    const{data:us}=await supabaseClient.from('training_sessions').select('id').eq('club_id',clubId).order('session_date',{ascending:false}).limit(1).single();
    if(!us){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>Sin datos recientes</p></div>';return;}
    const{data:att}=await supabaseClient.from('attendance').select('wellness, estado_muscular, jugador_id, players(name)').eq('sesion_id',us.id).eq('asistio',true);
    if(!att||att.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>Sin registros</p></div>';return;}
    const al=[];
    att.forEach(a=>{if(a.wellness&&a.wellness<=5)al.push({j:a.players?.name||'Jugador',t:'Wellness bajo',v:a.wellness,cl:a.wellness<=3?'':'warning'});if(a.estado_muscular&&a.estado_muscular>=6)al.push({j:a.players?.name||'Jugador',t:'Daño muscular',v:a.estado_muscular,cl:a.estado_muscular>=8?'':'warning'});});
    if(al.length===0){c.innerHTML='<div class="sin-datos"><div class="icono">✅</div><p>¡Equipo en buenas condiciones!</p></div>';return;}
    c.innerHTML=al.slice(0,5).map(a=>`<div class="alerta-item ${a.cl}"><div><div class="jugador-nombre">${a.j}</div><div class="alerta-detalle">${a.t}</div></div><div class="valor">${a.v}</div></div>`).join('');
}
// ================================================================
// DASHBOARD 2.0 - Arreglos de datos + fila de widgets CRM
// (las funciones con el mismo nombre sustituyen a las antiguas)
// ================================================================

// --- ARREGLO 1: asistencia y wellness del mes (tabla correcta) ---
async function cargarDatosEntrenamientosDashboard() {
    const now = new Date();
    const ini = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
    const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
    const { data: ses } = await supabaseClient.from('training_sessions').select('id').eq('club_id', clubId).gte('session_date', ini).lte('session_date', fin);
    const n = (ses && ses.length) || 0;
    const elS = document.getElementById('dash-sesiones');
    if (elS) elS.textContent = n;
    const elA = document.getElementById('dash-asistencia-media');
    const elW = document.getElementById('dash-wellness-medio');
    if (n === 0) { if (elA) elA.textContent = '-'; if (elW) elW.textContent = '-'; return; }
    const { data: att } = await supabaseClient.from('asistencia_sesiones').select('asistio, sueno, fatiga, estres').in('sesion_id', ses.map(s => s.id));
    if (att && att.length > 0) {
        const ok = att.filter(a => a.asistio).length;
        if (elA) elA.textContent = Math.round((ok / att.length) * 100) + '%';
        const medias = att.map(a => {
            const v = [a.sueno, a.fatiga, a.estres].filter(x => x !== null && x !== undefined);
            return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
        }).filter(x => x !== null);
        if (elW) elW.textContent = medias.length ? (medias.reduce((x, y) => x + y, 0) / medias.length).toFixed(1) : '-';
    } else { if (elA) elA.textContent = '-'; if (elW) elW.textContent = '-'; }
}

// --- ARREGLO 2: alertas de bienestar (tabla y campos correctos) ---
async function cargarAlertasWellness() {
    const c = document.getElementById('dash-alertas-wellness');
    if (!c) return;
    const { data: us } = await supabaseClient.from('training_sessions').select('id, session_date').eq('club_id', clubId).lte('session_date', new Date().toLocaleDateString('en-CA')).order('session_date', { ascending: false }).limit(1).maybeSingle();
    if (!us) { c.innerHTML = '<div class="sin-datos"><div class="icono">✅</div><p>Sin datos recientes</p></div>'; return; }
    const { data: att } = await supabaseClient.from('asistencia_sesiones').select('jugador_id, sueno, fatiga, estres, estado_muscular').eq('sesion_id', us.id);
    if (!att || att.length === 0) { c.innerHTML = '<div class="sin-datos"><div class="icono">✅</div><p>Sin registros</p></div>'; return; }
    const ids = [...new Set(att.map(a => a.jugador_id))];
    const nombres = {};
    if (ids.length) {
        const { data: jugs } = await supabaseClient.from('players').select('id, name').in('id', ids);
        (jugs || []).forEach(j => { nombres[j.id] = j.name; });
    }
    const al = [];
    att.forEach(a => {
        const v = [a.sueno, a.fatiga, a.estres].filter(x => x !== null && x !== undefined);
        const bien = v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
        if (bien !== null && bien <= 5) al.push({ j: nombres[a.jugador_id] || 'Jugador', t: 'Bienestar bajo', v: bien.toFixed(1), cl: bien <= 3.5 ? '' : 'warning' });
        if (a.estado_muscular !== null && a.estado_muscular >= 6) al.push({ j: nombres[a.jugador_id] || 'Jugador', t: 'Daño muscular', v: a.estado_muscular, cl: a.estado_muscular >= 8 ? '' : 'warning' });
    });
    if (al.length === 0) { c.innerHTML = '<div class="sin-datos"><div class="icono">✅</div><p>¡Equipo en buenas condiciones!</p></div>'; return; }
    c.innerHTML = al.slice(0, 5).map(a => '<div class="alerta-item ' + a.cl + '"><div><div class="jugador-nombre">' + a.j + '</div><div class="alerta-detalle">' + a.t + '</div></div><div class="valor">' + a.v + '</div></div>').join('');
}

// --- NUEVO: fila de widgets CRM (racha, cargas, carga semanal, cumpleanos) ---
function dashInyectarEstilosInsights() {
    if (document.getElementById('dash-ins-styles')) return;
    const st = document.createElement('style');
    st.id = 'dash-ins-styles';
    st.textContent = '.dash-ins-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px;margin-bottom:18px}' +
        '.dash-ins{background:#fff;border:1px solid #e9ecf2;border-radius:14px;padding:14px 16px;box-shadow:0 2px 10px rgba(15,23,42,.05)}' +
        '.dash-ins-t{font-size:11px;font-weight:800;color:#8a93a6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:9px;display:flex;align-items:center;gap:6px}' +
        '.dash-racha{display:flex;gap:6px}.dash-racha span{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}' +
        '.dash-ch{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:7px;font-size:12px;font-weight:800;margin:0 5px 5px 0}' +
        '.dash-cumple{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:#374151}' +
        '.dash-cumple b{color:#26215C}.dash-ins-big{font-size:26px;font-weight:900;color:#26215C;line-height:1.1}' +
        '.dash-ins-sub{font-size:11px;color:#9ca3af;margin-top:3px}' +
        '.dash-ins-link{margin-top:8px;font-size:11.5px;color:#7c3aed;font-weight:700;cursor:pointer;display:inline-block}';
    document.head.appendChild(st);
}

function dashISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dashAddDias(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return dashISO(d); }

async function cargarInsightsDashboard() {
    dashInyectarEstilosInsights();
    const grid = document.querySelector('#modulo-dashboard .dash-main-grid');
    if (!grid) return;
    let row = document.getElementById('dash-ins-row');
    if (!row) {
        row = document.createElement('div');
        row.id = 'dash-ins-row';
        row.className = 'dash-ins-row';
        grid.parentElement.insertBefore(row, grid);
    }
    row.innerHTML = '<div class="dash-ins"><div class="dash-ins-t">🔥 Racha (últimos 5)</div><div class="dash-racha" id="dash-ins-racha"><span style="background:#e5e7eb;color:#9ca3af">-</span></div></div>' +
        '<div class="dash-ins"><div class="dash-ins-t">🚦 Estado de cargas (ACWR)</div><div id="dash-ins-cargas" style="font-size:12px;color:#9ca3af">Calculando...</div><span class="dash-ins-link" onclick="dashIrACargas()">Ver panel de cargas →</span></div>' +
        '<div class="dash-ins"><div class="dash-ins-t">💪 Carga equipo · 7 días</div><div class="dash-ins-big" id="dash-ins-carga7">-</div><div class="dash-ins-sub" id="dash-ins-carga7-sub">media UA por jugador</div></div>' +
        '<div class="dash-ins"><div class="dash-ins-t" style="display:flex;justify-content:space-between;align-items:center;gap:6px">🎂 Próximos cumpleaños <button onclick="dashCumplesPDF()" style="background:#26215C;color:#fff;border:none;border-radius:6px;padding:3px 9px;font-size:11px;cursor:pointer;font-weight:700">📄 PDF</button></div><div id="dash-ins-cumples" style="font-size:12px;color:#9ca3af">-</div></div>';

    // Racha: ultimos 5 partidos con resultado
    try {
        const { data: pj } = await supabaseClient.from('matches').select('result, opponent, match_date').eq('club_id', clubId).not('result', 'is', null).order('match_date', { ascending: false }).limit(5);
        const el = document.getElementById('dash-ins-racha');
        if (pj && pj.length) {
            el.innerHTML = pj.reverse().map(p => {
                const col = p.result === 'win' ? '#22c55e' : (p.result === 'draw' ? '#f59e0b' : '#ef4444');
                const letra = p.result === 'win' ? 'V' : (p.result === 'draw' ? 'E' : 'D');
                return '<span style="background:' + col + '" title="vs ' + (p.opponent || '') + '">' + letra + '</span>';
            }).join('');
        } else { el.innerHTML = '<span style="background:#e5e7eb;color:#9ca3af;width:auto;padding:0 10px;font-size:11px;font-weight:600">Sin partidos jugados</span>'; }
    } catch (e) {}

    // Cargas: ACWR de cada jugador (35 dias de datos)
    try {
        const hoy = dashISO(new Date());
        const desde = dashAddDias(hoy, -35);
        const { data: ses } = await supabaseClient.from('training_sessions').select('id, session_date, duration_minutes').eq('club_id', clubId).gte('session_date', desde).lte('session_date', hoy);
        const sesMap = {}; (ses || []).forEach(s => { sesMap[s.id] = s; });
        let att = [];
        if (ses && ses.length) {
            const r = await supabaseClient.from('asistencia_sesiones').select('sesion_id, jugador_id, asistio, rpe, duracion_real').in('sesion_id', ses.map(s => s.id));
            att = r.data || [];
        }
        const cargas = {};
        att.forEach(a => {
            const s = sesMap[a.sesion_id];
            if (!s || !a.asistio || a.rpe === null || a.rpe === undefined) return;
            const mins = a.duracion_real || s.duration_minutes || 0;
            if (!cargas[a.jugador_id]) cargas[a.jugador_id] = {};
            cargas[a.jugador_id][s.session_date] = (cargas[a.jugador_id][s.session_date] || 0) + a.rpe * mins;
        });
        let opt = 0, aten = 0, riesgo = 0, agudaTotal = 0, nJug = 0;
        Object.keys(cargas).forEach(jid => {
            let aguda = 0, total28 = 0;
            for (let i = 0; i < 28; i++) {
                const v = cargas[jid][dashAddDias(hoy, -i)] || 0;
                total28 += v;
                if (i < 7) aguda += v;
            }
            if (total28 <= 0) return;
            nJug++;
            agudaTotal += aguda;
            const acwr = aguda / (total28 / 4);
            if (acwr > 1.5) riesgo++;
            else if (acwr < 0.8 || acwr > 1.3) aten++;
            else opt++;
        });
        const elC = document.getElementById('dash-ins-cargas');
        if (nJug === 0) { elC.innerHTML = '<span style="font-size:12px;color:#9ca3af">Aún sin registros de RPE</span>'; }
        else {
            elC.innerHTML = '<span class="dash-ch" style="background:#dcfce7;color:#15803d">🟢 ' + opt + ' óptimo</span>' +
                '<span class="dash-ch" style="background:#fef3c7;color:#b45309">🟡 ' + aten + ' atención</span>' +
                '<span class="dash-ch" style="background:#fee2e2;color:#b91c1c">🔴 ' + riesgo + ' riesgo</span>';
        }
        const el7 = document.getElementById('dash-ins-carga7');
        if (el7) el7.textContent = nJug > 0 ? Math.round(agudaTotal / nJug) + ' UA' : '-';
    } catch (e) {}

    // Cumpleanos en los proximos 30 dias
    try {
        const { data: jugs } = await supabaseClient.from('players').select('name, birth_date').eq('club_id', clubId).not('birth_date', 'is', null);
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const lista = [];
        (jugs || []).forEach(j => {
            const b = new Date(j.birth_date + 'T12:00:00');
            let prox = new Date(hoy.getFullYear(), b.getMonth(), b.getDate());
            if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, b.getMonth(), b.getDate());
            const dias = Math.round((prox - hoy) / 86400000);
            lista.push({ n: j.name, dias: dias, edad: prox.getFullYear() - b.getFullYear() });
        });
        lista.sort((a, b) => a.dias - b.dias);
        const el = document.getElementById('dash-ins-cumples');
        if (!lista.length) { el.innerHTML = '<span style="font-size:12px;color:#9ca3af">Sin fechas de nacimiento</span>'; }
        else {
            el.innerHTML = lista.slice(0, 3).map(c => '<div class="dash-cumple">🎂 <b>' + c.n + '</b> · ' + (c.dias === 0 ? '¡HOY!' : 'en ' + c.dias + ' día' + (c.dias === 1 ? '' : 's')) + ' (' + c.edad + ')</div>').join('');
        }
    } catch (e) {}
}

function dashIrACargas() {
    const tabPlan = document.querySelector('.main-tab[onclick*="planificador"]');
    if (tabPlan) tabPlan.click();
    setTimeout(function() {
        const sub = document.querySelector('.sub-tab[onclick*="\'cargas\'"]');
        if (sub) sub.click();
    }, 300);
}

// Enganche: cada vez que se recargue el dashboard, se anade la fila nueva
const _cargarDashboardOriginal = cargarDashboard;
cargarDashboard = async function() {
    await _cargarDashboardOriginal();
    cargarInsightsDashboard();
};
// --- PDF de cumpleaños (solo nueva incorporación y en propiedad) ---
async function dashCumplesPDF() {
    try {
        const { data: jugs } = await supabaseClient
            .from('players')
            .select('id, name, shirt_number, birth_date, acquisition')
            .eq('club_id', clubId)
            .in('acquisition', ['nueva_incorporacion', 'propiedad'])
            .not('birth_date', 'is', null);

        let lista = jugs || [];
        if (typeof seasonId !== 'undefined' && seasonId) {
            const { data: sps } = await supabaseClient
                .from('season_players')
                .select('player_id, shirt_number')
                .eq('season_id', seasonId);
            const mapa = {};
            (sps || []).forEach(sp => { mapa[sp.player_id] = sp; });
            lista = lista.filter(j => mapa[j.id]);
            lista.forEach(j => { if (mapa[j.id] && mapa[j.id].shirt_number) j.shirt_number = mapa[j.id].shirt_number; });
        }

        if (!lista.length) { showToast('No hay jugadores de nueva incorporación o en propiedad con fecha de nacimiento', 'warning'); return; }

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const filas = lista.map(function(j) {
            const b = new Date(j.birth_date + 'T12:00:00');
            let prox = new Date(hoy.getFullYear(), b.getMonth(), b.getDate());
            if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, b.getMonth(), b.getDate());
            const dias = Math.round((prox - hoy) / 86400000);
            return {
                dorsal: j.shirt_number || '-',
                nombre: j.name,
                nac: b.toLocaleDateString('es-ES'),
                cumple: prox.toLocaleDateString('es-ES'),
                dias: dias,
                edad: prox.getFullYear() - b.getFullYear(),
                origen: j.acquisition === 'propiedad' ? 'En propiedad' : 'Nueva incorporación'
            };
        }).sort(function(a, b) { return a.dias - b.dias; });

        const doc = new jspdf.jsPDF();
        doc.setFontSize(16); doc.setTextColor(30, 41, 59);
        doc.text('Cumpleaños de la plantilla', 14, 18);
        doc.setFontSize(10); doc.setTextColor(100, 116, 139);
        doc.text('Ordenado por próximo cumpleaños · ' + new Date().toLocaleDateString('es-ES'), 14, 25);
        doc.autoTable({
            startY: 30,
                      head: [['Dorsal', 'Jugador', 'Nacimiento', 'Próximo cumpleaños', 'Cumple']],
                      body: filas.map(function(f) { return [f.dorsal, f.nombre, f.nac, f.cumple, f.edad]; }),
            styles: { fontSize: 9, textColor: [30, 41, 59] },
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
        });
        doc.save('cumpleanos_plantilla.pdf');
    } catch (e) {
        console.error('Error generando PDF de cumpleaños:', e);
        showToast('Error al generar el PDF: ' + e.message, 'error');
    }
}