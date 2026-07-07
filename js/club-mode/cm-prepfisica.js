// ============================================================
// CM-PREPFISICA.JS · Preparacion Fisica · Club Mode Paso 3
// ============================================================
var cmPfJugadorActual=null,cmPfTabActiva='pruebas',cmPfCatalogoPruebas=[],cmPfCatalogosReady=false;
var cmPfFiltroEquipo='all',cmPfAntroEditId=null,cmPfJugadoresData=[],cmPfEquipos=[];
// Obedecer al selector global de la cabecera (Opcion A)
document.addEventListener('cmTeamChanged', function() {
    cmPfFiltroEquipo = (typeof cmState !== 'undefined' && cmState.equipoSeleccionado) ? cmState.equipoSeleccionado.id : 'all';
    if (document.getElementById('cmpf-player-grid')) cmPfRenderJugadores();
});
var cmPfGpsConfig=null,cmPfCsvData=null,cmPfCsvMapping={},cmPfCsvPlayerMapping={};
var cmPfInformeData=null,cmPfInformeFiltroTipo='',cmPfInformeFiltroPos='';
var cmPfVistaActiva='jugadores',cmPfSesionesData=[],cmPfEjerciciosClub=[];

async function cmPfInit(cid){var c=document.getElementById(cid);if(!c)return;if(!cmPfCatalogosReady)await cmPfCargarCatalogos();await cmPfCargarGpsConfig();await cmPfCargarEjercicios();cmPfRenderPanel(c);await cmPfCargarJugadores();}
async function cmPfCargarCatalogos(){try{var r=await supabaseClient.from('cm_pf_test_catalog').select('*').or('club_id.is.null,club_id.eq.'+clubId).eq('active',true).order('sort_order');cmPfCatalogoPruebas=r.data||[];}catch(e){cmPfCatalogoPruebas=[];}cmPfCatalogosReady=true;}
async function cmPfCargarGpsConfig(){try{var r=await supabaseClient.from('cm_pf_gps_config').select('*').eq('club_id',clubId).maybeSingle();if(r.data){cmPfGpsConfig=r.data;}else{var i=await supabaseClient.from('cm_pf_gps_config').insert({club_id:clubId}).select().single();cmPfGpsConfig=i.data;}}catch(e){cmPfGpsConfig={zone_thresholds:[0,7,14.4,19.8,25.2],zone_names:["Parado","Trote","Carrera media","HSR","Sprint"],hsr_threshold_kmh:19.8,sprint_threshold_kmh:25.2,acc_threshold_high:3,hmld_threshold:25.5,acwr_chronic_weeks:4};}}
function cmPfRenderPanel(container){
container.innerHTML=
'<style>'+
'.cmpf-wrap{background:#0f172a;min-height:100vh;padding:0 0 40px 0;margin:-20px -20px 0 -20px}.cmpf-panel{padding:20px;max-width:1200px;margin:0 auto}'+
'.cmpf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}.cmpf-header h2{margin:0;color:#e2e8f0;font-size:20px}'+
'.cmpf-filtro-bar{display:flex;gap:10px;align-items:center}.cmpf-filtro-bar label{color:#94a3b8;font-size:12px;font-weight:600}.cmpf-filtro-bar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer}'+
'.cmpf-stats-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}.cmpf-stat{background:#1e293b;border-radius:10px;padding:14px 18px;flex:1;min-width:110px;text-align:center;border:2px solid #334155}.cmpf-stat .num{font-size:28px;font-weight:700;color:#14b8a6}.cmpf-stat .label{font-size:12px;color:#94a3b8;margin-top:2px}'+
'.cmpf-player-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}'+
'.cmpf-player-card{background:#1e293b;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid #334155;transition:all .2s}.cmpf-player-card:hover{border-color:#14b8a6;transform:translateY(-1px)}'+
'.cmpf-player-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#e2e8f0;background:#334155;overflow:hidden}.cmpf-player-avatar img{width:100%;height:100%;object-fit:cover}'+
'.cmpf-player-info{flex:1;min-width:0}.cmpf-player-name{color:#e2e8f0;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmpf-player-meta{color:#94a3b8;font-size:11px;margin-top:1px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
'.cmpf-player-team-tag{background:#0f3d3e;color:#14b8a6;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600}.cmpf-player-dorsal{color:#64748b;font-size:13px;font-weight:600;min-width:24px;text-align:center}.cmpf-player-tests-tag{font-size:10px;color:#60a5fa;background:#1e3a5f;padding:1px 6px;border-radius:3px}'+
'.cmpf-ficha-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9000;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}'+
'.cmpf-ficha{background:#0f172a;border-radius:14px;width:100%;max-width:950px;max-height:90vh;overflow-y:auto;border:1px solid #334155}'+
'.cmpf-ficha-header{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #1e293b;position:sticky;top:0;background:#0f172a;z-index:10;border-radius:14px 14px 0 0}.cmpf-ficha-header h3{margin:0;color:#e2e8f0;font-size:18px;display:flex;align-items:center;gap:10px}.cmpf-ficha-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;padding:4px 8px}.cmpf-ficha-close:hover{color:#ef4444}'+
'.cmpf-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;padding:0 24px;background:#0f172a;position:sticky;top:60px;z-index:9}'+
'.cmpf-tab{padding:10px 18px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none}.cmpf-tab:hover{color:#e2e8f0}.cmpf-tab.active{color:#14b8a6;border-bottom-color:#14b8a6}'+
'.cmpf-tab-content{padding:20px 24px;display:none}.cmpf-tab-content.active{display:block}'+
'.cmpf-form-group{margin-bottom:14px}.cmpf-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}'+
'.cmpf-form-group input,.cmpf-form-group select,.cmpf-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}.cmpf-form-group input:focus,.cmpf-form-group select:focus{border-color:#14b8a6;outline:none}'+
'.cmpf-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cmpf-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.cmpf-form-row-4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px}'+
'.cmpf-btn{padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}.cmpf-btn-primary{background:#14b8a6;color:#fff}.cmpf-btn-primary:hover{background:#0d9488}.cmpf-btn-success{background:#059669;color:#fff}.cmpf-btn-danger{background:#dc2626;color:#fff}.cmpf-btn-secondary{background:#334155;color:#e2e8f0}.cmpf-btn-secondary:hover{background:#475569}.cmpf-btn-sm{padding:5px 12px;font-size:12px}.cmpf-btn-warning{background:#d97706;color:#fff}'+
'.cmpf-table{width:100%;border-collapse:collapse;font-size:13px}.cmpf-table th{text-align:left;padding:8px 10px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #334155}.cmpf-table td{padding:8px 10px;color:#e2e8f0;border-bottom:1px solid #1e293b}.cmpf-table tr:hover td{background:#1e293b}'+
'.cmpf-cat-header{color:#14b8a6;font-size:14px;font-weight:700;margin:20px 0 8px 0;padding-bottom:4px;border-bottom:1px solid #1e293b;text-transform:capitalize}'+
'.cmpf-result-improve{font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px}.cmpf-result-improve.up{background:#052e16;color:#22c55e}.cmpf-result-improve.down{background:#450a0a;color:#ef4444}.cmpf-result-improve.same{background:#1e293b;color:#64748b}'+
'.cmpf-chart-container{background:#1e293b;border-radius:8px;padding:16px;margin-top:16px}'+
'.cmpf-derived-panel{background:#1e293b;border-radius:10px;padding:16px;margin-top:16px;border:1px solid #334155}.cmpf-derived-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}.cmpf-derived-item{text-align:center;padding:10px;background:#0f172a;border-radius:8px}.cmpf-derived-item .val{font-size:22px;font-weight:700;color:#14b8a6}.cmpf-derived-item .lbl{font-size:11px;color:#94a3b8;margin-top:2px}'+
'.cmpf-section-title{color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px 0;padding-bottom:4px;border-bottom:1px solid #1e293b}'+
'.cmpf-anthro-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:8px;cursor:pointer;border-left:4px solid #a78bfa;transition:all .2s}.cmpf-anthro-card:hover{border-left-color:#14b8a6}.cmpf-anthro-card .date{color:#a78bfa;font-weight:600;font-size:14px}.cmpf-anthro-card .summary{color:#94a3b8;font-size:12px;margin-top:4px;display:flex;gap:12px;flex-wrap:wrap}.cmpf-anthro-card .summary span{color:#e2e8f0;font-weight:600}'+
'.cmpf-empty{text-align:center;padding:40px 20px;color:#64748b}.cmpf-empty .icon{font-size:40px;margin-bottom:10px}.cmpf-empty p{font-size:14px}.cmpf-filter-count{color:#64748b;font-size:12px;margin-bottom:10px}'+
'.cmpf-wip{text-align:center;padding:60px 20px;color:#475569}.cmpf-wip .icon{font-size:48px;margin-bottom:12px;opacity:.5}.cmpf-wip h4{color:#94a3b8;margin:0 0 8px 0}.cmpf-wip p{font-size:13px}'+
'.cmpf-gps-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:8px;cursor:pointer;border-left:4px solid #fbbf24;transition:all .2s}.cmpf-gps-card:hover{border-left-color:#14b8a6}.cmpf-gps-card .title{color:#fbbf24;font-weight:600;font-size:14px}.cmpf-gps-card .meta{color:#94a3b8;font-size:12px;margin-top:4px;display:flex;gap:12px;flex-wrap:wrap}.cmpf-gps-card .meta span{color:#e2e8f0;font-weight:600}'+
'.cmpf-gps-type{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase}.cmpf-gps-type.training{background:#1e3a5f;color:#60a5fa}.cmpf-gps-type.match{background:#3b0764;color:#c084fc}'+
'.cmpf-zone-bar{display:flex;height:24px;border-radius:4px;overflow:hidden;margin-bottom:4px}.cmpf-zone-bar div{display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff;min-width:1px}'+
'.cmpf-acwr-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700}.cmpf-acwr-badge.optimal{background:#052e16;color:#22c55e}.cmpf-acwr-badge.under{background:#1e3a5f;color:#60a5fa}.cmpf-acwr-badge.risk{background:#451a03;color:#f59e0b}.cmpf-acwr-badge.danger{background:#450a0a;color:#ef4444}'+
'.cmpf-seg-btn{padding:4px 10px;border-radius:4px;border:1px solid #334155;background:#0f172a;color:#94a3b8;font-size:11px;cursor:pointer}.cmpf-seg-btn:hover{border-color:#14b8a6}.cmpf-seg-btn.active{background:#14b8a6;color:#fff;border-color:#14b8a6}'+
'.cmpf-metric-mini{display:inline-block;padding:4px 8px;background:#0f172a;border-radius:4px;margin:2px;font-size:11px;color:#94a3b8}.cmpf-metric-mini span{color:#e2e8f0;font-weight:600}'+
'@media(max-width:640px){.cmpf-form-row,.cmpf-form-row-3,.cmpf-form-row-4{grid-template-columns:1fr}.cmpf-player-grid{grid-template-columns:1fr}.cmpf-tabs{overflow-x:auto}.cmpf-ficha-overlay{padding:10px}.cmpf-stats-bar{gap:8px}.cmpf-stat{min-width:70px;padding:10px 8px}.cmpf-stat .num{font-size:22px}.cmpf-derived-grid{grid-template-columns:1fr 1fr}}'+
'.cmpf-vista-toggle{display:flex;gap:0;margin-bottom:20px;background:#1e293b;border-radius:8px;overflow:hidden;border:1px solid #334155}.cmpf-vista-btn{flex:1;padding:10px 20px;background:none;border:none;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}.cmpf-vista-btn:hover{color:#e2e8f0}.cmpf-vista-btn.active{background:#14b8a6;color:#fff}'+
'.cmpf-ses-filtros{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center}.cmpf-ses-filtros select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer}'+
'</style>'+
'<div class="cmpf-wrap"><div class="cmpf-panel">'+
'<div class="cmpf-header"><h2>Preparacion Fisica</h2></div>'+
'<div class="cmpf-vista-toggle"><button class="cmpf-vista-btn active" data-vista="jugadores" onclick="cmPfCambiarVista(\'jugadores\')">Jugadores</button><button class="cmpf-vista-btn" data-vista="sesiones" onclick="cmPfCambiarVista(\'sesiones\')">Sesiones GPS</button><button class="cmpf-vista-btn" data-vista="cargas" onclick="cmPfCambiarVista(\'cargas\')">Cargas RPE</button></div>'+
'<div id="cmpf-vista-cargas" style="display:none"><div style="background:#f1f5f9;border-radius:12px;padding:16px"><div id="cmpf-cargas-contenido"></div></div></div>'+
'<div id="cmpf-vista-jugadores">'+
'<div class="cmpf-stats-bar"><div class="cmpf-stat"><div class="num" id="cmpf-stat-total">-</div><div class="label">Jugadores</div></div><div class="cmpf-stat"><div class="num" id="cmpf-stat-tests" style="color:#60a5fa">-</div><div class="label">Con pruebas</div></div><div class="cmpf-stat"><div class="num" id="cmpf-stat-anthro" style="color:#a78bfa">-</div><div class="label">Antropometria</div></div><div class="cmpf-stat"><div class="num" id="cmpf-stat-gps" style="color:#fbbf24">-</div><div class="label">Con GPS</div></div></div>'+
'<div class="cmpf-filter-count" id="cmpf-filter-count"></div>'+
'<div class="cmpf-player-grid" id="cmpf-player-grid"><div class="cmpf-empty"><div class="icon">...</div><p>Cargando...</p></div></div>'+
'</div>'+
'<div id="cmpf-vista-sesiones" style="display:none">'+
'<div class="cmpf-ses-filtros"><select id="cmpf-ses-filtro-tipo" onchange="cmPfCargarSesiones()"><option value="">Tipo: Todos</option><option value="training">Entreno</option><option value="match">Partido</option></select><select id="cmpf-ses-filtro-equipo" onchange="cmPfCargarSesiones()"><option value="">Equipo: Todos</option></select><select id="cmpf-ses-filtro-ejercicio" onchange="cmPfCargarSesiones()"><option value="">Ejercicio: Todos</option></select><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfToggleConfig()" style="margin-left:auto">Config GPS</button></div>'+
'<div id="cmpf-gps-config-panel" style="display:none;background:#1e293b;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #334155"><h4 style="color:#e2e8f0;margin:0 0 12px 0;font-size:14px">Metricas personalizadas del club</h4><p style="color:#64748b;font-size:11px;margin-bottom:12px">Define hasta 8 metricas extra que apareceran en los formularios y tablas GPS.</p><div id="cmpf-custom-metrics-list"></div><div class="cmpf-form-row-3" style="margin-top:10px"><div class="cmpf-form-group"><label>Nombre</label><input type="text" id="cmpf-cm-name" placeholder="ADI"></div><div class="cmpf-form-group"><label>Unidad</label><input type="text" id="cmpf-cm-unit" placeholder="au"></div><div style="display:flex;align-items:flex-end"><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfAddCustomMetric()">Anadir</button></div></div></div>'+
'<div id="cmpf-sesiones-list"><div class="cmpf-empty"><p>Pulsa Sesiones GPS para ver las sesiones</p></div></div>'+
'</div>'+
'</div></div>'+
'<div class="cmpf-ficha-overlay" id="cmpf-ficha-overlay" style="display:none;" onclick="if(event.target===this)cmPfCerrarFicha()"><div class="cmpf-ficha" id="cmpf-ficha"></div></div>';}

// ========== CARGAR JUGADORES ==========
async function cmPfCargarJugadores(){var grid=document.getElementById('cmpf-player-grid');if(!grid)return;try{var tr=await supabaseClient.from('club_teams').select('id,name,category').eq('club_id',clubId).eq('active',true).order('category').order('name');cmPfEquipos=tr.data||[];var pr=await supabaseClient.from('club_players').select('id,name,photo_url,positions_main').eq('club_id',clubId).eq('active',true).order('name');var pd=pr.data||[];if(!pd.length){grid.innerHTML='<div class="cmpf-empty"><p>No hay jugadores</p></div>';return;}var sel=document.getElementById('cmpf-filtro-equipo');if(sel){var o='<option value="all">Todos ('+cmPfEquipos.length+')</option>';cmPfEquipos.forEach(function(t){o+='<option value="'+t.id+'">'+t.name+(t.category?' ('+t.category+')':'')+'</option>';});sel.innerHTML=o;if(cmPfFiltroEquipo!=='all')sel.value=cmPfFiltroEquipo;}var tn={};cmPfEquipos.forEach(function(t){tn[t.id]=t.name;});var sr=await supabaseClient.from('club_player_seasons').select('player_id,team_id,shirt_number,position').eq('club_id',clubId).eq('active',true);var sp={};(sr.data||[]).forEach(function(s){if(!sp[s.player_id])sp[s.player_id]=[];sp[s.player_id].push(s);});var tc={},ac={},gc={};var r1=await supabaseClient.from('cm_pf_test_results').select('player_id').eq('club_id',clubId).eq('archived',false);(r1.data||[]).forEach(function(r){tc[r.player_id]=(tc[r.player_id]||0)+1;});var r2=await supabaseClient.from('cm_pf_anthropometry').select('player_id').eq('club_id',clubId).eq('archived',false);(r2.data||[]).forEach(function(r){ac[r.player_id]=(ac[r.player_id]||0)+1;});var r3=await supabaseClient.from('cm_pf_gps_player_data').select('player_id').eq('club_id',clubId).eq('archived',false).eq('segment_name','TOTAL');(r3.data||[]).forEach(function(r){gc[r.player_id]=(gc[r.player_id]||0)+1;});cmPfJugadoresData=pd.map(function(p){var ss=sp[p.id]||[];var tid=ss.length?ss[0].team_id:null;return{id:p.id,name:p.name,photo_url:p.photo_url,position:(p.positions_main&&p.positions_main[0])||(ss.length?ss[0].position:'')||'',team_id:tid,team_name:tid?(tn[tid]||''):'',dorsal:ss.length?ss[0].shirt_number:null,test_count:tc[p.id]||0,anthro_count:ac[p.id]||0,gps_count:gc[p.id]||0};});cmPfRenderJugadores();}catch(e){console.error(e);grid.innerHTML='<div class="cmpf-empty"><p>Error</p></div>';}}
function cmPfFiltrarEquipo(v){cmPfFiltroEquipo=v;cmPfRenderJugadores();}
function cmPfRenderJugadores(){var g=document.getElementById('cmpf-player-grid');if(!g)return;var jj=cmPfJugadoresData;if(typeof cmJugadorVisible==='function')jj=jj.filter(function(j){return cmJugadorVisible(j.team_id?[j.team_id]:[]);});if(cmPfFiltroEquipo!=='all')jj=jj.filter(function(j){return j.team_id===cmPfFiltroEquipo;});var el=function(i,v){var e=document.getElementById(i);if(e)e.textContent=v;};el('cmpf-stat-total',jj.length);el('cmpf-stat-tests',jj.filter(function(j){return j.test_count>0;}).length);el('cmpf-stat-anthro',jj.filter(function(j){return j.anthro_count>0;}).length);el('cmpf-stat-gps',jj.filter(function(j){return j.gps_count>0;}).length);var fc=document.getElementById('cmpf-filter-count');if(fc)fc.textContent=cmPfFiltroEquipo!=='all'?jj.length+' jugadores':'';if(!jj.length){g.innerHTML='<div class="cmpf-empty"><p>Sin jugadores</p></div>';return;}var h='';jj.forEach(function(j){var av=j.photo_url?'<img src="'+j.photo_url+'">':(j.name?j.name.split(' ').map(function(p){return p.charAt(0);}).join('').substring(0,2).toUpperCase():'?');var m='';if(j.position)m+=j.position;if(j.team_name)m+='<span class="cmpf-player-team-tag">'+j.team_name+'</span>';h+='<div class="cmpf-player-card" onclick="cmPfAbrirFicha(\''+j.id+'\')"><div class="cmpf-player-avatar">'+av+'</div><div class="cmpf-player-info"><div class="cmpf-player-name">'+(j.name||'?')+'</div><div class="cmpf-player-meta">'+m+'</div></div>'+(j.dorsal?'<div class="cmpf-player-dorsal">#'+j.dorsal+'</div>':'')+'</div>';});g.innerHTML=h;}

// ========== FICHA ==========
function cmPfAbrirFicha(pid){var j=cmPfJugadoresData.find(function(j){return j.id===pid;});if(!j)return;cmPfJugadorActual=j;cmPfTabActiva='pruebas';var o=document.getElementById('cmpf-ficha-overlay');if(o)o.style.display='flex';cmPfRenderFicha();}
function cmPfCerrarFicha(){cmPfJugadorActual=null;var o=document.getElementById('cmpf-ficha-overlay');if(o)o.style.display='none';}
function cmPfCambiarTab(t){cmPfTabActiva=t;document.querySelectorAll('.cmpf-tab').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tab')===t);});document.querySelectorAll('.cmpf-tab-content').forEach(function(c){c.classList.toggle('active',c.id==='cmpf-tab-'+t);});if(t==='pruebas')cmPfCargarPruebas();else if(t==='antropometria')cmPfCargarAntropometria();else if(t==='gps')cmPfCargarGps();else if(t==='informe')cmPfCargarInforme();}
function cmPfRenderFicha(){var f=document.getElementById('cmpf-ficha');if(!f||!cmPfJugadorActual)return;var j=cmPfJugadorActual;f.innerHTML='<div class="cmpf-ficha-header"><h3>'+j.name+'<span style="font-size:13px;color:#94a3b8;font-weight:400"> '+(j.position||'')+(j.team_name?' \u00B7 '+j.team_name:'')+(j.dorsal?' #'+j.dorsal:'')+'</span></h3><button class="cmpf-ficha-close" onclick="cmPfCerrarFicha()">&times;</button></div><div class="cmpf-tabs"><button class="cmpf-tab active" data-tab="pruebas" onclick="cmPfCambiarTab(\'pruebas\')">Pruebas</button><button class="cmpf-tab" data-tab="antropometria" onclick="cmPfCambiarTab(\'antropometria\')">Antropometria</button><button class="cmpf-tab" data-tab="gps" onclick="cmPfCambiarTab(\'gps\')">GPS</button><button class="cmpf-tab" data-tab="informe" onclick="cmPfCambiarTab(\'informe\')">Informe</button></div><div class="cmpf-tab-content active" id="cmpf-tab-pruebas"><div class="cmpf-empty"><div class="icon">...</div><p>Cargando...</p></div></div><div class="cmpf-tab-content" id="cmpf-tab-antropometria"></div><div class="cmpf-tab-content" id="cmpf-tab-gps"></div><div class="cmpf-tab-content" id="cmpf-tab-informe"></div>';cmPfCargarPruebas();}

// ================================================================
// TAB 1: PRUEBAS FISICAS
// ================================================================
async function cmPfCargarPruebas(){var c=document.getElementById('cmpf-tab-pruebas');if(!c||!cmPfJugadorActual)return;try{var r=await supabaseClient.from('cm_pf_test_results').select('*,cm_pf_test_catalog(name,category,unit,higher_is_better)').eq('club_id',clubId).eq('player_id',cmPfJugadorActual.id).eq('archived',false).order('test_date',{ascending:false});cmPfRenderPruebasTab(c,r.data||[]);}catch(e){c.innerHTML='<div class="cmpf-empty"><p>Error</p></div>';}}
function cmPfRenderPruebasTab(ct,res){var pp={};res.forEach(function(r){if(!pp[r.test_id])pp[r.test_id]=[];pp[r.test_id].push(r);});
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px"><div style="color:#94a3b8;font-size:13px">'+Object.keys(pp).length+' pruebas · '+res.length+' resultados</div><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfMostrarFormRegistro()">+ Registrar</button></div>';
    h+='<div id="cmpf-form-registro" style="display:none;background:#1e293b;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #14b8a6"><h4 style="color:#e2e8f0;margin:0 0 12px 0;font-size:14px">Registrar resultado</h4><div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Prueba</label><select id="cmpf-reg-test" onchange="cmPfActualizarUnidad()"><option value="">--</option>'+cmPfGenerarOpcionesPruebas()+'</select></div><div class="cmpf-form-group"><label>Fecha</label><input type="date" id="cmpf-reg-fecha" value="'+cmPfHoy()+'"></div><div class="cmpf-form-group"><label>Resultado <span id="cmpf-reg-unidad" style="color:#14b8a6"></span></label><input type="number" id="cmpf-reg-valor" step="0.001"></div></div><div class="cmpf-form-group"><label>Notas</label><input type="text" id="cmpf-reg-notas"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfOcultarFormRegistro()">Cancelar</button><button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" onclick="cmPfGuardarResultado()">Guardar</button></div></div>';
    h+='<div id="cmpf-chart-evolucion" style="display:none"></div>';
    if(!res.length){h+='<div class="cmpf-empty"><p>Sin pruebas registradas</p></div>';}
    else{var pc={};Object.keys(pp).forEach(function(tid){var p=pp[tid][0];var cat=p.cm_pf_test_catalog?p.cm_pf_test_catalog.category:'otra';if(!pc[cat])pc[cat]=[];pc[cat].push({testId:tid,resultados:pp[tid]});});
    ['velocidad','resistencia','fuerza','potencia','agilidad','flexibilidad','otra'].forEach(function(cat){if(!pc[cat])return;h+='<div class="cmpf-cat-header">'+cat+'</div><table class="cmpf-table"><thead><tr><th>Prueba</th><th>Ultimo</th><th>Fecha</th><th>Mejor</th><th>N</th><th></th></tr></thead><tbody>';
    pc[cat].forEach(function(it){var rs=it.resultados;var u=rs[0];var c=u.cm_pf_test_catalog||{};var un=c.unit||'';var hb=c.higher_is_better!==false;var mj=rs.reduce(function(b,r){return hb?(r.value>b.value?r:b):(r.value<b.value?r:b);},rs[0]);var t='';if(rs.length>=2){var d=parseFloat(u.value)-parseFloat(rs[1].value);t=(hb?d>0:d<0)?'<span class="cmpf-result-improve up">+</span>':((hb?d<0:d>0)?'<span class="cmpf-result-improve down">-</span>':'<span class="cmpf-result-improve same">=</span>');}
    h+='<tr><td style="font-weight:600">'+(c.name||'?')+' '+t+'</td><td><span style="color:#14b8a6;font-weight:700">'+parseFloat(u.value)+'</span> <span style="color:#64748b;font-size:11px">'+un+'</span></td><td style="color:#94a3b8;font-size:12px">'+cmPfFormatFecha(u.test_date)+'</td><td>'+parseFloat(mj.value)+' '+un+'</td><td style="color:#64748b">'+rs.length+'</td><td><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfVerEvolucion(\''+it.testId+'\')">Evol.</button></td></tr>';});h+='</tbody></table>';});}ct.innerHTML=h;}
function cmPfGenerarOpcionesPruebas(){var cs={};cmPfCatalogoPruebas.forEach(function(t){if(!cs[t.category])cs[t.category]=[];cs[t.category].push(t);});var h='';['velocidad','resistencia','fuerza','potencia','agilidad','flexibilidad'].forEach(function(c){if(!cs[c])return;h+='<optgroup label="'+c.charAt(0).toUpperCase()+c.slice(1)+'">';cs[c].forEach(function(t){h+='<option value="'+t.id+'" data-unit="'+(t.unit||'')+'">'+t.name+'</option>';});h+='</optgroup>';});return h;}
function cmPfMostrarFormRegistro(){var f=document.getElementById('cmpf-form-registro');if(f)f.style.display='block';}
function cmPfOcultarFormRegistro(){var f=document.getElementById('cmpf-form-registro');if(f)f.style.display='none';}
function cmPfActualizarUnidad(){var s=document.getElementById('cmpf-reg-test');var sp=document.getElementById('cmpf-reg-unidad');if(!s||!sp)return;var o=s.options[s.selectedIndex];sp.textContent=o&&o.dataset.unit?'('+o.dataset.unit+')':'';}
async function cmPfGuardarResultado(){var ti=document.getElementById('cmpf-reg-test').value;var fe=document.getElementById('cmpf-reg-fecha').value;var va=document.getElementById('cmpf-reg-valor').value;var no=(document.getElementById('cmpf-reg-notas')||{}).value||null;if(!ti){showToast('Selecciona prueba');return;}if(!fe){showToast('Indica fecha');return;}if(!va||isNaN(parseFloat(va))){showToast('Resultado numerico');return;}try{var wp=JSON.parse(localStorage.getItem('hub_user')||'{}');var res=await supabaseClient.from('cm_pf_test_results').insert({club_id:clubId,player_id:cmPfJugadorActual.id,test_id:ti,test_date:fe,value:parseFloat(va),notes:no,registered_by:wp.id||null});if(res.error)throw res.error;showToast('Guardado');cmPfOcultarFormRegistro();cmPfCargarPruebas();}catch(e){showToast('Error: '+(e.message||e));}}
async function cmPfVerEvolucion(testId){var ct=document.getElementById('cmpf-chart-evolucion');if(!ct||!cmPfJugadorActual)return;try{var r=await supabaseClient.from('cm_pf_test_results').select('*,cm_pf_test_catalog(name,unit,higher_is_better)').eq('club_id',clubId).eq('player_id',cmPfJugadorActual.id).eq('test_id',testId).eq('archived',false).order('test_date',{ascending:true});var d=r.data||[];if(!d.length)return;var ca=d[0].cm_pf_test_catalog||{};var nm=ca.name||'?';var un=ca.unit||'';var lb=d.map(function(x){return cmPfFormatFecha(x.test_date);});var vl=d.map(function(x){return parseFloat(x.value);});ct.style.display='block';ct.innerHTML='<div class="cmpf-chart-container"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h4 style="margin:0;color:#e2e8f0;font-size:15px">'+nm+'</h4><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="document.getElementById(\'cmpf-chart-evolucion\').style.display=\'none\'">X</button></div><canvas id="cmpf-canvas-evolucion" height="200"></canvas></div>';ct.scrollIntoView({behavior:'smooth',block:'nearest'});var ctx=document.getElementById('cmpf-canvas-evolucion');if(ctx&&typeof Chart!=='undefined'){if(window.cmPfChartEvolucion)window.cmPfChartEvolucion.destroy();window.cmPfChartEvolucion=new Chart(ctx,{type:'line',data:{labels:lb,datasets:[{label:nm,data:vl,borderColor:'#14b8a6',backgroundColor:'rgba(20,184,166,0.1)',fill:true,tension:.3,pointRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}},y:{ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}}}}});}}catch(e){ct.style.display='block';ct.innerHTML='<div class="cmpf-chart-container"><p style="color:#ef4444">Error</p></div>';}}

// ================================================================
// TAB 2: ANTROPOMETRIA
// ================================================================
async function cmPfCargarAntropometria(){var c=document.getElementById('cmpf-tab-antropometria');if(!c||!cmPfJugadorActual)return;c.innerHTML='<div class="cmpf-empty"><div class="icon">...</div><p>Cargando...</p></div>';try{var r=await supabaseClient.from('cm_pf_anthropometry').select('*').eq('club_id',clubId).eq('player_id',cmPfJugadorActual.id).eq('archived',false).order('measure_date',{ascending:false});cmPfRenderAntroTab(c,r.data||[]);}catch(e){c.innerHTML='<div class="cmpf-empty"><p>Error</p></div>';}}
function cmPfRenderAntroTab(ct,mm){
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px"><div style="color:#94a3b8;font-size:13px">'+mm.length+' mediciones</div><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfMostrarFormAntro()">+ Nueva</button></div>';
    h+='<div id="cmpf-form-antro" style="display:none;background:#1e293b;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #a78bfa">';
    h+='<h4 style="color:#e2e8f0;margin:0 0 16px 0;font-size:14px" id="cmpf-antro-form-title">Nueva medicion</h4>';
    h+='<div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Fecha</label><input type="date" id="cmpf-antro-fecha" value="'+cmPfHoy()+'"></div><div></div><div></div></div>';
    h+='<div class="cmpf-section-title">Basicas</div><div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>Peso(kg)</label><input type="number" id="cmpf-antro-weight" step="0.1"></div><div class="cmpf-form-group"><label>Talla(cm)</label><input type="number" id="cmpf-antro-height" step="0.1"></div><div class="cmpf-form-group"><label>T.sentado(cm)</label><input type="number" id="cmpf-antro-sitting" step="0.1"></div><div class="cmpf-form-group"><label>Enverg.(cm)</label><input type="number" id="cmpf-antro-span" step="0.1"></div></div>';
    h+='<div class="cmpf-section-title">Pliegues(mm)</div><div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Triceps</label><input type="number" id="cmpf-antro-skf-triceps" step="0.1"></div><div class="cmpf-form-group"><label>Subescapular</label><input type="number" id="cmpf-antro-skf-subscapular" step="0.1"></div><div class="cmpf-form-group"><label>Supraespinal</label><input type="number" id="cmpf-antro-skf-supraspinal" step="0.1"></div></div><div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Abdominal</label><input type="number" id="cmpf-antro-skf-abdominal" step="0.1"></div><div class="cmpf-form-group"><label>Muslo</label><input type="number" id="cmpf-antro-skf-thigh" step="0.1"></div><div class="cmpf-form-group"><label>Pierna</label><input type="number" id="cmpf-antro-skf-calf" step="0.1"></div></div>';
    h+='<div class="cmpf-section-title">Perimetros(cm)</div><div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>Br.relaj.</label><input type="number" id="cmpf-antro-girth-arm-rel" step="0.1"></div><div class="cmpf-form-group"><label>Br.contr.</label><input type="number" id="cmpf-antro-girth-arm-flex" step="0.1"></div><div class="cmpf-form-group"><label>Antebrazo</label><input type="number" id="cmpf-antro-girth-forearm" step="0.1"></div><div class="cmpf-form-group"><label>Cintura</label><input type="number" id="cmpf-antro-girth-waist" step="0.1"></div></div><div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Cadera</label><input type="number" id="cmpf-antro-girth-hip" step="0.1"></div><div class="cmpf-form-group"><label>Muslo</label><input type="number" id="cmpf-antro-girth-thigh" step="0.1"></div><div class="cmpf-form-group"><label>Pierna</label><input type="number" id="cmpf-antro-girth-calf" step="0.1"></div></div>';
    h+='<div class="cmpf-section-title">Diametros(cm)</div><div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>Humero</label><input type="number" id="cmpf-antro-breadth-humerus" step="0.1"></div><div class="cmpf-form-group"><label>Femur</label><input type="number" id="cmpf-antro-breadth-femur" step="0.1"></div><div class="cmpf-form-group"><label>Biacromial</label><input type="number" id="cmpf-antro-breadth-biacrom" step="0.1"></div><div class="cmpf-form-group"><label>Biiliocrestal</label><input type="number" id="cmpf-antro-breadth-biilio" step="0.1"></div></div>';
    h+='<div class="cmpf-form-group"><label>Notas</label><input type="text" id="cmpf-antro-notas"></div>';
    h+='<div id="cmpf-antro-derivados" class="cmpf-derived-panel" style="display:none"><div style="color:#94a3b8;font-size:12px;font-weight:600;margin-bottom:10px;text-transform:uppercase">Calculados</div><div class="cmpf-derived-grid" id="cmpf-antro-derivados-grid"></div></div>';
    h+='<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfOcultarFormAntro()">Cancelar</button><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfCalcularYMostrar()">Calcular</button><button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" onclick="cmPfGuardarAntropometria()">Guardar</button></div></div>';
    if(!mm.length){h+='<div class="cmpf-empty"><p>Sin mediciones</p></div>';}
    else{if(mm.length>=2)h+='<div class="cmpf-chart-container" style="margin-bottom:20px"><canvas id="cmpf-canvas-antro" height="200"></canvas></div>';
    h+='<div class="cmpf-section-title">Historial</div>';mm.forEach(function(m){h+='<div class="cmpf-anthro-card" onclick="cmPfVerDetalleAntro(\''+m.id+'\')"><div style="display:flex;justify-content:space-between;align-items:center"><div class="date">'+cmPfFormatFecha(m.measure_date)+'</div><div style="display:flex;gap:4px"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" style="padding:2px 8px;font-size:11px" onclick="event.stopPropagation();cmPfEditarAntro(\''+m.id+'\')">Editar</button><button class="cmpf-btn cmpf-btn-danger cmpf-btn-sm" style="padding:2px 8px;font-size:11px" onclick="event.stopPropagation();cmPfArchivarAntro(\''+m.id+'\')">x</button></div></div><div class="summary"><div>Peso:<span>'+(m.weight_kg?m.weight_kg+'kg':'--')+'</span></div><div>Talla:<span>'+(m.height_cm?m.height_cm+'cm':'--')+'</span></div><div>IMC:<span>'+(m.calc_bmi||'--')+'</span></div><div>Grasa:<span>'+(m.calc_body_fat_pct?m.calc_body_fat_pct+'%':'--')+'</span></div><div>Sum6P:<span>'+(m.calc_sum_6skf?m.calc_sum_6skf+'mm':'--')+'</span></div><div>Somato:<span>'+((m.calc_endomorphy&&m.calc_mesomorphy&&m.calc_ectomorphy)?m.calc_endomorphy+'-'+m.calc_mesomorphy+'-'+m.calc_ectomorphy:'--')+'</span></div></div></div>';});}
    ct.innerHTML=h;if(mm.length>=2)cmPfRenderAntroChart(mm.slice().reverse());}
function cmPfMostrarFormAntro(){cmPfAntroEditId=null;var t=document.getElementById('cmpf-antro-form-title');if(t)t.textContent='Nueva medicion';['cmpf-antro-fecha','cmpf-antro-weight','cmpf-antro-height','cmpf-antro-sitting','cmpf-antro-span','cmpf-antro-skf-triceps','cmpf-antro-skf-subscapular','cmpf-antro-skf-supraspinal','cmpf-antro-skf-abdominal','cmpf-antro-skf-thigh','cmpf-antro-skf-calf','cmpf-antro-girth-arm-rel','cmpf-antro-girth-arm-flex','cmpf-antro-girth-forearm','cmpf-antro-girth-waist','cmpf-antro-girth-hip','cmpf-antro-girth-thigh','cmpf-antro-girth-calf','cmpf-antro-breadth-humerus','cmpf-antro-breadth-femur','cmpf-antro-breadth-biacrom','cmpf-antro-breadth-biilio','cmpf-antro-notas'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});document.getElementById('cmpf-antro-fecha').value=cmPfHoy();var d=document.getElementById('cmpf-antro-derivados');if(d)d.style.display='none';var f=document.getElementById('cmpf-form-antro');if(f)f.style.display='block';}
function cmPfOcultarFormAntro(){var f=document.getElementById('cmpf-form-antro');if(f)f.style.display='none';cmPfAntroEditId=null;}
async function cmPfEditarAntro(id){try{var r=await supabaseClient.from('cm_pf_anthropometry').select('*').eq('id',id).single();var m=r.data;if(!m)return;cmPfAntroEditId=id;var t=document.getElementById('cmpf-antro-form-title');if(t)t.textContent='Editar '+cmPfFormatFecha(m.measure_date);var f=document.getElementById('cmpf-form-antro');if(f)f.style.display='block';var s=function(i,v){var e=document.getElementById(i);if(e&&v!=null)e.value=v;};s('cmpf-antro-fecha',m.measure_date);s('cmpf-antro-weight',m.weight_kg);s('cmpf-antro-height',m.height_cm);s('cmpf-antro-sitting',m.sitting_height_cm);s('cmpf-antro-span',m.arm_span_cm);s('cmpf-antro-skf-triceps',m.skf_triceps);s('cmpf-antro-skf-subscapular',m.skf_subscapular);s('cmpf-antro-skf-supraspinal',m.skf_supraspinal);s('cmpf-antro-skf-abdominal',m.skf_abdominal);s('cmpf-antro-skf-thigh',m.skf_thigh);s('cmpf-antro-skf-calf',m.skf_calf);s('cmpf-antro-girth-arm-rel',m.girth_arm_relaxed);s('cmpf-antro-girth-arm-flex',m.girth_arm_flexed);s('cmpf-antro-girth-forearm',m.girth_forearm);s('cmpf-antro-girth-waist',m.girth_waist);s('cmpf-antro-girth-hip',m.girth_hip);s('cmpf-antro-girth-thigh',m.girth_thigh);s('cmpf-antro-girth-calf',m.girth_calf);s('cmpf-antro-breadth-humerus',m.breadth_humerus);s('cmpf-antro-breadth-femur',m.breadth_femur);s('cmpf-antro-breadth-biacrom',m.breadth_biacromial);s('cmpf-antro-breadth-biilio',m.breadth_biiliocristal);s('cmpf-antro-notas',m.notes);showToast('Editando...');if(f)f.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){showToast('Error');}}
function cmPfLeerFormAntro(){var v=function(i){var e=document.getElementById(i);return e&&e.value?parseFloat(e.value):null;};return{weight_kg:v('cmpf-antro-weight'),height_cm:v('cmpf-antro-height'),sitting_height_cm:v('cmpf-antro-sitting'),arm_span_cm:v('cmpf-antro-span'),skf_triceps:v('cmpf-antro-skf-triceps'),skf_subscapular:v('cmpf-antro-skf-subscapular'),skf_supraspinal:v('cmpf-antro-skf-supraspinal'),skf_abdominal:v('cmpf-antro-skf-abdominal'),skf_thigh:v('cmpf-antro-skf-thigh'),skf_calf:v('cmpf-antro-skf-calf'),girth_arm_relaxed:v('cmpf-antro-girth-arm-rel'),girth_arm_flexed:v('cmpf-antro-girth-arm-flex'),girth_forearm:v('cmpf-antro-girth-forearm'),girth_waist:v('cmpf-antro-girth-waist'),girth_hip:v('cmpf-antro-girth-hip'),girth_thigh:v('cmpf-antro-girth-thigh'),girth_calf:v('cmpf-antro-girth-calf'),breadth_humerus:v('cmpf-antro-breadth-humerus'),breadth_femur:v('cmpf-antro-breadth-femur'),breadth_biacromial:v('cmpf-antro-breadth-biacrom'),breadth_biiliocristal:v('cmpf-antro-breadth-biilio')};}
function cmPfCalcularDerivados(d){var r={};if(d.weight_kg&&d.height_cm){var hm=d.height_cm/100;r.calc_bmi=Math.round((d.weight_kg/(hm*hm))*10)/10;}if(d.skf_triceps!=null&&d.skf_subscapular!=null&&d.skf_supraspinal!=null&&d.skf_abdominal!=null&&d.skf_thigh!=null&&d.skf_calf!=null)r.calc_sum_6skf=Math.round((d.skf_triceps+d.skf_subscapular+d.skf_supraspinal+d.skf_abdominal+d.skf_thigh+d.skf_calf)*10)/10;if(r.calc_sum_6skf!=null)r.calc_body_fat_pct=Math.round((r.calc_sum_6skf*0.1051+2.585)*10)/10;if(d.weight_kg&&r.calc_body_fat_pct!=null)r.calc_muscle_mass_kg=Math.round(d.weight_kg*(1-r.calc_body_fat_pct/100)*0.54*100)/100;if(d.skf_triceps!=null&&d.skf_subscapular!=null&&d.skf_supraspinal!=null&&d.height_cm){var X=(d.skf_triceps+d.skf_subscapular+d.skf_supraspinal)*(170.18/d.height_cm);r.calc_endomorphy=Math.round(Math.max(0.1,-0.7182+0.1451*X-0.00068*X*X+0.0000014*X*X*X)*10)/10;}if(d.breadth_humerus!=null&&d.breadth_femur!=null&&d.girth_arm_flexed!=null&&d.girth_calf!=null&&d.skf_triceps!=null&&d.skf_calf!=null&&d.height_cm){var cag=d.girth_arm_flexed-(d.skf_triceps/10);var ccg=d.girth_calf-(d.skf_calf/10);r.calc_mesomorphy=Math.round(Math.max(0.1,0.858*d.breadth_humerus+0.601*d.breadth_femur+0.188*cag+0.161*ccg-0.131*d.height_cm+4.5)*10)/10;}if(d.weight_kg&&d.height_cm){var hwr=d.height_cm/Math.pow(d.weight_kg,1/3);var ec;if(hwr>=40.75)ec=0.732*hwr-28.58;else if(hwr>=38.25)ec=0.463*hwr-17.63;else ec=0.1;r.calc_ectomorphy=Math.round(Math.max(0.1,ec)*10)/10;}return r;}
function cmPfCalcularYMostrar(){var d=cmPfLeerFormAntro();var r=cmPfCalcularDerivados(d);var p=document.getElementById('cmpf-antro-derivados');var g=document.getElementById('cmpf-antro-derivados-grid');if(!p||!g)return;var it=[];if(r.calc_bmi!=null)it.push({v:r.calc_bmi,l:'IMC'});if(r.calc_sum_6skf!=null)it.push({v:r.calc_sum_6skf+'mm',l:'Sum 6P'});if(r.calc_body_fat_pct!=null)it.push({v:r.calc_body_fat_pct+'%',l:'%Grasa'});if(r.calc_muscle_mass_kg!=null)it.push({v:r.calc_muscle_mass_kg+'kg',l:'M.musc.'});if(r.calc_endomorphy!=null)it.push({v:r.calc_endomorphy,l:'Endo'});if(r.calc_mesomorphy!=null)it.push({v:r.calc_mesomorphy,l:'Meso'});if(r.calc_ectomorphy!=null)it.push({v:r.calc_ectomorphy,l:'Ecto'});if(!it.length){p.style.display='none';showToast('Rellena peso y talla');return;}g.innerHTML=it.map(function(i){return'<div class="cmpf-derived-item"><div class="val">'+i.v+'</div><div class="lbl">'+i.l+'</div></div>';}).join('');p.style.display='block';showToast('Calculado');}
async function cmPfGuardarAntropometria(){var fe=document.getElementById('cmpf-antro-fecha').value;if(!fe){showToast('Fecha');return;}var d=cmPfLeerFormAntro();if(!d.weight_kg&&!d.height_cm){showToast('Peso o talla');return;}var r=cmPfCalcularDerivados(d);var no=(document.getElementById('cmpf-antro-notas')||{}).value||null;var wp=JSON.parse(localStorage.getItem('hub_user')||'{}');var row={measure_date:fe,weight_kg:d.weight_kg,height_cm:d.height_cm,sitting_height_cm:d.sitting_height_cm,arm_span_cm:d.arm_span_cm,skf_triceps:d.skf_triceps,skf_subscapular:d.skf_subscapular,skf_supraspinal:d.skf_supraspinal,skf_abdominal:d.skf_abdominal,skf_thigh:d.skf_thigh,skf_calf:d.skf_calf,girth_arm_relaxed:d.girth_arm_relaxed,girth_arm_flexed:d.girth_arm_flexed,girth_forearm:d.girth_forearm,girth_waist:d.girth_waist,girth_hip:d.girth_hip,girth_thigh:d.girth_thigh,girth_calf:d.girth_calf,breadth_humerus:d.breadth_humerus,breadth_femur:d.breadth_femur,breadth_biacromial:d.breadth_biacromial,breadth_biiliocristal:d.breadth_biiliocristal,calc_bmi:r.calc_bmi||null,calc_sum_6skf:r.calc_sum_6skf||null,calc_body_fat_pct:r.calc_body_fat_pct||null,calc_muscle_mass_kg:r.calc_muscle_mass_kg||null,calc_endomorphy:r.calc_endomorphy||null,calc_mesomorphy:r.calc_mesomorphy||null,calc_ectomorphy:r.calc_ectomorphy||null,notes:no,registered_by:wp.id||null};try{var er;if(cmPfAntroEditId){var rs=await supabaseClient.from('cm_pf_anthropometry').update(row).eq('id',cmPfAntroEditId);er=rs.error;}else{row.club_id=clubId;row.player_id=cmPfJugadorActual.id;var rs=await supabaseClient.from('cm_pf_anthropometry').insert(row);er=rs.error;}if(er)throw er;showToast(cmPfAntroEditId?'Actualizada':'Guardada');cmPfOcultarFormAntro();cmPfCargarAntropometria();}catch(e){showToast('Error: '+(e.message||e));}}
async function cmPfArchivarAntro(id){if(typeof showConfirm==='function')showConfirm('Archivar?',function(){(async function(){try{await supabaseClient.from('cm_pf_anthropometry').update({archived:true,archived_at:new Date().toISOString()}).eq('id',id);showToast('Archivada');cmPfCargarAntropometria();}catch(e){showToast('Error');}})();});else{try{await supabaseClient.from('cm_pf_anthropometry').update({archived:true,archived_at:new Date().toISOString()}).eq('id',id);showToast('Archivada');cmPfCargarAntropometria();}catch(e){showToast('Error');}}}
function cmPfVerDetalleAntro(id){(async function(){try{var r=await supabaseClient.from('cm_pf_anthropometry').select('*').eq('id',id).single();var m=r.data;if(!m)return;var L=[];if(m.weight_kg)L.push('Peso: '+m.weight_kg+'kg');if(m.height_cm)L.push('Talla: '+m.height_cm+'cm');L.push('');if(m.skf_triceps!=null)L.push('Triceps: '+m.skf_triceps+'mm');if(m.skf_subscapular!=null)L.push('Subesc: '+m.skf_subscapular+'mm');if(m.skf_supraspinal!=null)L.push('Suprae: '+m.skf_supraspinal+'mm');if(m.skf_abdominal!=null)L.push('Abdom: '+m.skf_abdominal+'mm');if(m.skf_thigh!=null)L.push('Muslo: '+m.skf_thigh+'mm');if(m.skf_calf!=null)L.push('Pierna: '+m.skf_calf+'mm');L.push('');if(m.calc_bmi!=null)L.push('IMC: '+m.calc_bmi);if(m.calc_body_fat_pct!=null)L.push('Grasa: '+m.calc_body_fat_pct+'%');if(m.calc_sum_6skf!=null)L.push('Sum6P: '+m.calc_sum_6skf+'mm');if(m.calc_endomorphy!=null)L.push('Somato: '+m.calc_endomorphy+'-'+m.calc_mesomorphy+'-'+m.calc_ectomorphy);if(m.notes)L.push('\\nNotas: '+m.notes);var ov=document.createElement('div');ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9500;display:flex;justify-content:center;align-items:center;padding:20px';ov.onclick=function(e){if(e.target===ov)document.body.removeChild(ov);};ov.innerHTML='<div style="background:#0f172a;border:1px solid #a78bfa;border-radius:12px;padding:24px;max-width:400px;width:100%;max-height:70vh;overflow-y:auto"><div style="display:flex;justify-content:space-between;margin-bottom:16px"><h4 style="margin:0;color:#e2e8f0">'+cmPfFormatFecha(m.measure_date)+'</h4><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="this.closest(\'div[style*=fixed]\').remove()">&times;</button></div><pre style="color:#e2e8f0;font-size:13px;font-family:inherit;white-space:pre-wrap;line-height:1.8">'+L.join('\\n')+'</pre></div>';document.body.appendChild(ov);}catch(e){}})();}
function cmPfRenderAntroChart(mm){var ctx=document.getElementById('cmpf-canvas-antro');if(!ctx||typeof Chart==='undefined'||mm.length<2)return;if(window.cmPfChartAntro)window.cmPfChartAntro.destroy();window.cmPfChartAntro=new Chart(ctx,{type:'line',data:{labels:mm.map(function(m){return cmPfFormatFecha(m.measure_date);}),datasets:[{label:'Peso(kg)',data:mm.map(function(m){return m.weight_kg;}),borderColor:'#14b8a6',fill:false,tension:.3,yAxisID:'y',pointRadius:4},{label:'%Grasa',data:mm.map(function(m){return m.calc_body_fat_pct;}),borderColor:'#f59e0b',fill:false,tension:.3,yAxisID:'y1',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#94a3b8',font:{size:11}}}},scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}},y:{position:'left',title:{display:true,text:'Peso',color:'#14b8a6'},ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}},y1:{position:'right',title:{display:true,text:'%Grasa',color:'#f59e0b'},ticks:{color:'#94a3b8'},grid:{drawOnChartArea:false}}}}});}

// ================================================================
// TAB 3: CARGA GPS — Completa
// ================================================================
async function cmPfCargarGps(){var c=document.getElementById('cmpf-tab-gps');if(!c||!cmPfJugadorActual)return;c.innerHTML='<div class="cmpf-empty"><div class="icon">...</div><p>Cargando GPS...</p></div>';try{var r=await supabaseClient.from('cm_pf_gps_player_data').select('*,cm_pf_gps_sessions(id,session_date,session_type,title,opponent,duration_min)').eq('club_id',clubId).eq('player_id',cmPfJugadorActual.id).eq('segment_name','TOTAL').eq('archived',false).order('created_at',{ascending:false});var datos=r.data||[];var acwr=cmPfCalcularAcwr(datos);cmPfRenderGpsTab(c,datos,acwr);}catch(e){console.error(e);c.innerHTML='<div class="cmpf-empty"><p>Error</p></div>';}}
function cmPfCalcularAcwr(datos){if(datos.length<2)return null;var hoy=new Date();var sem=(cmPfGpsConfig&&cmPfGpsConfig.acwr_chronic_weeks)||4;var agMs=7*864e5;var crMs=sem*7*864e5;var mets=['total_distance_m','hsr_distance_m','sprint_distance_m','player_load'];var res={};mets.forEach(function(m){var ag=0,cr=0,nCr=0;datos.forEach(function(d){if(!d.cm_pf_gps_sessions)return;var f=new Date(d.cm_pf_gps_sessions.session_date+'T12:00:00');var df=hoy-f;var val=parseFloat(d[m])||0;if(df<=agMs)ag+=val;if(df<=crMs){cr+=val;nCr++;}});var crSem=nCr>0?(cr/sem):0;res[m]=crSem>0?Math.round((ag/crSem)*100)/100:null;});res.main=res.total_distance_m;if(res.main!==null){if(res.main<0.8)res.zone='under';else if(res.main<=1.3)res.zone='optimal';else if(res.main<=1.5)res.zone='risk';else res.zone='danger';}return res;}
function cmPfRenderGpsTab(ct,datos,acwr){
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px"><div style="display:flex;align-items:center;gap:12px"><span style="color:#94a3b8;font-size:13px">'+datos.length+' sesiones GPS</span>';
    if(acwr&&acwr.main!==null){var lb={under:'Infraprep.',optimal:'Optimo',risk:'Riesgo',danger:'Peligro'};h+='<span class="cmpf-acwr-badge '+acwr.zone+'">ACWR: '+acwr.main+' - '+lb[acwr.zone]+'</span>';}
    h+='</div><div style="display:flex;gap:6px"><button class="cmpf-btn cmpf-btn-warning cmpf-btn-sm" onclick="cmPfMostrarImportCsv()">Importar CSV</button><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfMostrarFormGps()">+ Manual</button></div></div>';
    // Form manual
    h+='<div id="cmpf-form-gps" style="display:none;background:#1e293b;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #fbbf24">';
    h+='<h4 style="color:#e2e8f0;margin:0 0 12px 0;font-size:14px">Nueva sesion GPS</h4>';
    h+='<div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>Tipo</label><select id="cmpf-gps-type"><option value="training">Entreno</option><option value="match">Partido</option></select></div><div class="cmpf-form-group"><label>Fecha</label><input type="date" id="cmpf-gps-date" value="'+cmPfHoy()+'"></div><div class="cmpf-form-group"><label>Titulo/Drill</label><input type="text" id="cmpf-gps-title" placeholder="Sesion tactica..."></div><div class="cmpf-form-group"><label>Duracion(min)</label><input type="number" id="cmpf-gps-duration" placeholder="90"></div></div>';
    h+='<div class="cmpf-form-row-3"><div class="cmpf-form-group"><label>Rival</label><input type="text" id="cmpf-gps-opponent"></div><div class="cmpf-form-group"><label>Equipo</label><select id="cmpf-gps-team"><option value="">--</option>';
    cmPfEquipos.forEach(function(t){h+='<option value="'+t.id+'">'+t.name+'</option>';});
    h+='</select></div><div class="cmpf-form-group"><label>Segmento</label><select id="cmpf-gps-segment" onchange="var cs=document.getElementById(\'cmpf-gps-custom-seg\');if(cs)cs.style.display=this.value===\'custom\'?\'block\':\'none\'"><option value="TOTAL">TOTAL</option><option value="1st_half">1a Parte</option><option value="2nd_half">2a Parte</option>';
    for(var i=0;i<90;i+=5)h+='<option value="'+String(i).padStart(2,'0')+'-'+String(i+5).padStart(2,'0')+'">'+i+'-'+(i+5)+' min</option>';
    h+='<option value="custom">Otro (drill)</option></select></div></div>';
    h+='<div id="cmpf-gps-custom-seg" style="display:none" class="cmpf-form-group"><label>Nombre segmento</label><input type="text" id="cmpf-gps-custom-seg-name" placeholder="Rondo 4v2"></div>';
    h+='<div class="cmpf-form-group"><label>Vincular ejercicio (opcional)</label><select id="cmpf-gps-exercise"><option value="">-- Sin vincular --</option>';
    cmPfEjerciciosClub.forEach(function(e){h+='<option value="'+e.id+'">'+e.name+(e.category?' ('+e.category+')':'')+'</option>';});
    h+='</select></div>';
    h+='<div class="cmpf-section-title">Metricas</div><div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>TD(m)</label><input type="number" id="cmpf-gps-td" step="1"></div><div class="cmpf-form-group"><label>HSR(m)</label><input type="number" id="cmpf-gps-hsr" step="1"></div><div class="cmpf-form-group"><label>Sprint(m)</label><input type="number" id="cmpf-gps-sprint" step="1"></div><div class="cmpf-form-group"><label>Vmax(km/h)</label><input type="number" id="cmpf-gps-vmax" step="0.1"></div></div>';
    h+='<div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>N.Sprints</label><input type="number" id="cmpf-gps-nsprints"></div><div class="cmpf-form-group"><label>Acc HI</label><input type="number" id="cmpf-gps-acc"></div><div class="cmpf-form-group"><label>Dec HI</label><input type="number" id="cmpf-gps-dec"></div><div class="cmpf-form-group"><label>HMLD(m)</label><input type="number" id="cmpf-gps-hmld" step="1"></div></div>';
    h+='<div class="cmpf-form-row-4"><div class="cmpf-form-group"><label>Player Load</label><input type="number" id="cmpf-gps-pl" step="0.1"></div><div class="cmpf-form-group"><label>Pot.Met(W/kg)</label><input type="number" id="cmpf-gps-metpow" step="0.1"></div><div class="cmpf-form-group"><label>m/min</label><input type="number" id="cmpf-gps-mmin" step="0.1"></div><div class="cmpf-form-group"><label>Vmax ref</label><input type="number" id="cmpf-gps-vmaxref" step="0.1" title="Vmax referencia para zonas relativas"></div></div>';
    h+='<div class="cmpf-section-title">Zonas velocidad (m) — opcional</div>';
    // Custom metrics from config
    var customMets=(cmPfGpsConfig&&cmPfGpsConfig.custom_metrics)||[];
    if(customMets.length){h+='<div class="cmpf-section-title">Metricas personalizadas</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';customMets.forEach(function(cm){h+='<div class="cmpf-form-group" style="flex:1;min-width:100px"><label>'+cm.label+(cm.unit?' ('+cm.unit+')':'')+'</label><input type="number" id="cmpf-gps-custom-'+cm.key+'" step="0.01"></div>';});h+='</div>';}
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
    var zn=(cmPfGpsConfig&&cmPfGpsConfig.zone_names)||["Z1","Z2","Z3","Z4","Z5"];
    for(var i=0;i<5;i++)h+='<div class="cmpf-form-group" style="flex:1;min-width:80px"><label>'+(zn[i]||'Z'+(i+1))+'</label><input type="number" id="cmpf-gps-z'+(i+1)+'" step="1"></div>';
    h+='</div><div class="cmpf-form-group"><label>Notas</label><input type="text" id="cmpf-gps-notes"></div>';
    h+='<div style="display:flex;gap:8px;justify-content:flex-end"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="cmPfOcultarFormGps()">Cancelar</button><button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" onclick="cmPfGuardarGps()">Guardar</button></div></div>';
    // CSV area
    h+='<div id="cmpf-csv-import" style="display:none;background:#1e293b;border-radius:10px;padding:16px;margin-bottom:20px;border:1px solid #d97706"><h4 style="color:#e2e8f0;margin:0 0 12px 0;font-size:14px">Importar CSV</h4><div id="cmpf-csv-steps"></div></div>';
    // ACWR detail
    if(acwr&&acwr.main!==null){h+='<div class="cmpf-derived-panel" style="margin-bottom:20px;border-color:#fbbf24"><div style="color:#fbbf24;font-size:12px;font-weight:700;margin-bottom:8px;text-transform:uppercase">ACWR — Carga Aguda:Cronica ('+((cmPfGpsConfig&&cmPfGpsConfig.acwr_chronic_weeks)||4)+' sem)</div><div class="cmpf-derived-grid">';var ai=[{v:acwr.total_distance_m,l:'Dist.Total'},{v:acwr.hsr_distance_m,l:'HSR'},{v:acwr.sprint_distance_m,l:'Sprint'},{v:acwr.player_load,l:'Player Load'}];ai.forEach(function(a){if(a.v!=null){var z=a.v<0.8?'under':a.v<=1.3?'optimal':a.v<=1.5?'risk':'danger';var col={under:'#60a5fa',optimal:'#22c55e',risk:'#f59e0b',danger:'#ef4444'}[z];h+='<div class="cmpf-derived-item"><div class="val" style="color:'+col+'">'+a.v+'</div><div class="lbl">'+a.l+'</div></div>';}});h+='</div></div>';}
    // Historial
    if(!datos.length){h+='<div class="cmpf-empty"><p>Sin datos GPS. Usa entrada manual o importa CSV</p></div>';}
    else{h+='<div class="cmpf-section-title">Sesiones GPS</div>';datos.forEach(function(d){var s=d.cm_pf_gps_sessions||{};var tipo=s.session_type==='match'?'<span class="cmpf-gps-type match">Partido</span>':'<span class="cmpf-gps-type training">Entreno</span>';var tit=s.title||(s.opponent?'vs '+s.opponent:'Sesion');h+='<div class="cmpf-gps-card" onclick="cmPfVerSesionGps(\''+d.session_id+'\')"><div style="display:flex;justify-content:space-between;align-items:center"><div class="title">'+cmPfFormatFecha(s.session_date)+' '+tipo+' '+tit+'</div><button class="cmpf-btn cmpf-btn-danger cmpf-btn-sm" style="padding:2px 8px;font-size:11px" onclick="event.stopPropagation();cmPfArchivarGps(\''+d.id+'\')">x</button></div><div class="meta">';if(d.total_distance_m)h+='<div>TD:<span>'+Math.round(d.total_distance_m)+'m</span></div>';if(d.hsr_distance_m)h+='<div>HSR:<span>'+Math.round(d.hsr_distance_m)+'m</span></div>';if(d.sprint_distance_m)h+='<div>Sprint:<span>'+Math.round(d.sprint_distance_m)+'m</span></div>';if(d.max_speed_kmh)h+='<div>Vmax:<span>'+d.max_speed_kmh+'</span></div>';if(d.player_load)h+='<div>PL:<span>'+d.player_load+'</span></div>';h+='</div>';
    if(d.z1_distance_m||d.z2_distance_m||d.z3_distance_m||d.z4_distance_m||d.z5_distance_m){var zz=[d.z1_distance_m||0,d.z2_distance_m||0,d.z3_distance_m||0,d.z4_distance_m||0,d.z5_distance_m||0];var zt=zz.reduce(function(a,b){return a+b;},0);if(zt>0){var colors=['#3b82f6','#22c55e','#eab308','#f97316','#ef4444'];h+='<div class="cmpf-zone-bar" style="margin-top:8px">';zz.forEach(function(z,i){var pct=Math.round(z/zt*100);if(pct>0)h+='<div style="width:'+pct+'%;background:'+colors[i]+'" title="Z'+(i+1)+': '+Math.round(z)+'m">'+pct+'%</div>';});h+='</div>';}}h+='</div>';});}ct.innerHTML=h;}
function cmPfMostrarFormGps(){var f=document.getElementById('cmpf-form-gps');if(f)f.style.display='block';}
function cmPfOcultarFormGps(){var f=document.getElementById('cmpf-form-gps');if(f)f.style.display='none';}
async function cmPfGuardarGps(){var tipo=document.getElementById('cmpf-gps-type').value;var fecha=document.getElementById('cmpf-gps-date').value;if(!fecha){showToast('Indica fecha');return;}var titulo=(document.getElementById('cmpf-gps-title')||{}).value||'';var dur=document.getElementById('cmpf-gps-duration').value;var riv=(document.getElementById('cmpf-gps-opponent')||{}).value||'';var tid=document.getElementById('cmpf-gps-team').value||null;var segSel=document.getElementById('cmpf-gps-segment').value;var segN=segSel==='custom'?((document.getElementById('cmpf-gps-custom-seg-name')||{}).value||'TOTAL'):segSel;var exerciseId=document.getElementById('cmpf-gps-exercise')?document.getElementById('cmpf-gps-exercise').value||null:null;var v=function(id){var e=document.getElementById(id);return e&&e.value?parseFloat(e.value):null;};try{var sr=await supabaseClient.from('cm_pf_gps_sessions').select('id').eq('club_id',clubId).eq('session_date',fecha).eq('session_type',tipo).eq('title',titulo).maybeSingle();var sid;if(sr.data){sid=sr.data.id;}else{var ins=await supabaseClient.from('cm_pf_gps_sessions').insert({club_id:clubId,session_date:fecha,session_type:tipo,title:titulo||null,duration_min:dur?parseInt(dur):null,opponent:riv||null,team_id:tid,exercise_id:exerciseId}).select('id').single();if(ins.error)throw ins.error;sid=ins.data.id;}var row={club_id:clubId,session_id:sid,player_id:cmPfJugadorActual.id,segment_name:segN,total_distance_m:v('cmpf-gps-td'),hsr_distance_m:v('cmpf-gps-hsr'),sprint_distance_m:v('cmpf-gps-sprint'),max_speed_kmh:v('cmpf-gps-vmax'),sprint_count:v('cmpf-gps-nsprints')?parseInt(v('cmpf-gps-nsprints')):null,accel_count:v('cmpf-gps-acc')?parseInt(v('cmpf-gps-acc')):null,decel_count:v('cmpf-gps-dec')?parseInt(v('cmpf-gps-dec')):null,player_load:v('cmpf-gps-pl'),extra_metrics:(function(){var em={hmld_m:v('cmpf-gps-hmld'),avg_metabolic_power:v('cmpf-gps-metpow'),distance_per_min:v('cmpf-gps-mmin')};var cms=(cmPfGpsConfig&&cmPfGpsConfig.custom_metrics)||[];cms.forEach(function(cm){var val=v('cmpf-gps-custom-'+cm.key);if(val!=null)em[cm.key]=val;});return em;})(),vmax_reference_kmh:v('cmpf-gps-vmaxref'),duration_min:dur?parseInt(dur):null,z1_distance_m:v('cmpf-gps-z1'),z2_distance_m:v('cmpf-gps-z2'),z3_distance_m:v('cmpf-gps-z3'),z4_distance_m:v('cmpf-gps-z4'),z5_distance_m:v('cmpf-gps-z5'),notes:(document.getElementById('cmpf-gps-notes')||{}).value||null};var res=await supabaseClient.from('cm_pf_gps_player_data').insert(row);if(res.error)throw res.error;showToast('GPS guardado');cmPfOcultarFormGps();cmPfCargarGps();}catch(e){showToast('Error: '+(e.message||e));}}

// Session detail overlay
async function cmPfVerSesionGps(sessionId){try{var sr=await supabaseClient.from('cm_pf_gps_sessions').select('*').eq('id',sessionId).single();var ses=sr.data;if(!ses)return;var sg=await supabaseClient.from('cm_pf_gps_player_data').select('*').eq('session_id',sessionId).eq('player_id',cmPfJugadorActual.id).eq('archived',false).order('segment_name');var segs=sg.data||[];if(!segs.length){showToast('Sin datos');return;}var tipo=ses.session_type==='match'?'Partido':'Entreno';var tit=ses.title||(ses.opponent?'vs '+ses.opponent:'Sesion');var zn=(cmPfGpsConfig&&cmPfGpsConfig.zone_names)||["Z1","Z2","Z3","Z4","Z5"];var colors=['#3b82f6','#22c55e','#eab308','#f97316','#ef4444'];
    var html='<div style="background:#0f172a;border:1px solid #fbbf24;border-radius:12px;padding:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto"><div style="display:flex;justify-content:space-between;margin-bottom:16px"><h4 style="margin:0;color:#e2e8f0">'+cmPfFormatFecha(ses.session_date)+' · '+tipo+' · '+tit+'</h4><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="this.closest(\'div[style*=fixed]\').remove()">&times;</button></div>';
    if(segs.length>1){html+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px">';segs.forEach(function(s,i){html+='<button class="cmpf-seg-btn'+(i===0?' active':'')+'" onclick="cmPfSelSeg(this,'+i+')" data-idx="'+i+'">'+s.segment_name+'</button>';});html+='</div>';}
    segs.forEach(function(s,i){html+='<div class="cmpf-seg-detail" style="'+(i>0?'display:none':'')+'"><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';[{k:'total_distance_m',l:'TD',u:'m'},{k:'hsr_distance_m',l:'HSR',u:'m'},{k:'sprint_distance_m',l:'Sprint',u:'m'},{k:'max_speed_kmh',l:'Vmax',u:'km/h'},{k:'sprint_count',l:'N.Sprint',u:''},{k:'accel_count',l:'AccHI',u:''},{k:'decel_count',l:'DecHI',u:''},{k:'hmld_m',l:'HMLD',u:'m'},{k:'player_load',l:'PL',u:''},{k:'avg_metabolic_power',l:'P.Met',u:'W/kg'},{k:'distance_per_min',l:'m/min',u:''}].forEach(function(m){if(s[m.k]!=null)html+='<span class="cmpf-metric-mini">'+m.l+': <span>'+s[m.k]+m.u+'</span></span>';});html+='</div>';
    var zz=[s.z1_distance_m||0,s.z2_distance_m||0,s.z3_distance_m||0,s.z4_distance_m||0,s.z5_distance_m||0];var zt=zz.reduce(function(a,b){return a+b;},0);if(zt>0){html+='<div style="margin-top:8px"><div style="color:#94a3b8;font-size:11px;margin-bottom:4px">Zonas de velocidad</div><div class="cmpf-zone-bar">';zz.forEach(function(z,j){var pct=Math.round(z/zt*100);if(pct>0)html+='<div style="width:'+pct+'%;background:'+colors[j]+'">'+pct+'%</div>';});html+='</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">';zz.forEach(function(z,j){if(z>0)html+='<span style="font-size:10px;color:'+colors[j]+'">'+zn[j]+': '+Math.round(z)+'m</span>';});html+='</div></div>';}
    if(s.notes)html+='<div style="color:#64748b;font-size:12px;margin-top:8px">'+s.notes+'</div>';html+='</div>';});
    html+='</div>';var ov=document.createElement('div');ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9500;display:flex;justify-content:center;align-items:center;padding:20px';ov.onclick=function(e){if(e.target===ov)document.body.removeChild(ov);};ov.innerHTML=html;document.body.appendChild(ov);}catch(e){showToast('Error cargando sesion');}}
function cmPfSelSeg(btn,idx){btn.closest('div').querySelectorAll('.cmpf-seg-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');var dets=btn.closest('div').parentElement.querySelectorAll('.cmpf-seg-detail');dets.forEach(function(d,i){d.style.display=i===idx?'block':'none';});}
async function cmPfArchivarGps(id){if(typeof showConfirm==='function')showConfirm('Archivar?',function(){(async function(){try{await supabaseClient.from('cm_pf_gps_player_data').update({archived:true,archived_at:new Date().toISOString()}).eq('id',id);showToast('Archivada');cmPfCargarGps();}catch(e){showToast('Error');}})();});else{try{await supabaseClient.from('cm_pf_gps_player_data').update({archived:true,archived_at:new Date().toISOString()}).eq('id',id);showToast('Archivada');cmPfCargarGps();}catch(e){showToast('Error');}}}

// ========== CSV IMPORT WIZARD ==========
function cmPfMostrarImportCsv(){var a=document.getElementById('cmpf-csv-import');if(!a)return;a.style.display='block';cmPfCsvData=null;cmPfCsvMapping={};cmPfCsvPlayerMapping={};document.getElementById('cmpf-csv-steps').innerHTML='<div style="margin-bottom:12px"><h5 style="color:#e2e8f0;margin:0 0 8px 0;font-size:14px">Paso 1: Seleccionar archivo CSV</h5><input type="file" id="cmpf-csv-file" accept=".csv,.txt" onchange="cmPfCsvParsear()" style="color:#e2e8f0"><p style="color:#64748b;font-size:11px;margin-top:8px">Formato: una fila por jugador, columnas con metricas GPS. Soporta STATSports, Catapult, GPSports y similares.</p></div><div id="cmpf-csv-step2" style="display:none"></div><div id="cmpf-csv-step3" style="display:none"></div>';}
function cmPfCsvParsear(){var fi=document.getElementById('cmpf-csv-file');if(!fi||!fi.files.length)return;var reader=new FileReader();reader.onload=function(e){var txt=e.target.result;var lines=txt.split(/\r?\n/).filter(function(l){return l.trim();});if(lines.length<2){showToast('CSV vacio');return;}var sep=lines[0].indexOf(';')>=0?';':',';var hd=lines[0].split(sep).map(function(h){return h.trim().replace(/^"|"$/g,'');});var rows=[];for(var i=1;i<lines.length;i++){var v=lines[i].split(sep).map(function(x){return x.trim().replace(/^"|"$/g,'');});if(v.length>=hd.length*0.5)rows.push(v);}cmPfCsvData={headers:hd,rows:rows,sep:sep};cmPfCsvStep2();};reader.readAsText(fi.files[0]);}
function cmPfCsvStep2(){var s2=document.getElementById('cmpf-csv-step2');if(!s2)return;var hd=cmPfCsvData.headers;var mm=[{key:'player_name',label:'Nombre jugador',auto:['player','name','nombre','jugador','athlete']},{key:'total_distance_m',label:'Dist.Total(m)',auto:['total distance','distance','dist','td','distancia']},{key:'hsr_distance_m',label:'HSR(m)',auto:['hsr','high speed','alta intensidad']},{key:'sprint_distance_m',label:'Sprint(m)',auto:['sprint','spd']},{key:'max_speed_kmh',label:'Vmax(km/h)',auto:['max speed','vmax','vel max','top speed','velocidad']},{key:'sprint_count',label:'N.Sprints',auto:['sprint count','num sprint','sprints']},{key:'accel_count',label:'Acc HI',auto:['accel','acc','accelerat']},{key:'decel_count',label:'Dec HI',auto:['decel','dec','deceler']},{key:'hmld_m',label:'HMLD(m)',auto:['hmld','metabolic load','high metabolic']},{key:'player_load',label:'Player Load',auto:['player load','pl','load']},{key:'avg_metabolic_power',label:'Pot.Met',auto:['metabolic power','met pow']},{key:'distance_per_min',label:'m/min',auto:['m/min','dist/min','intensity']},{key:'segment_name',label:'Segmento/Drill',auto:['drill','segment','period','ejercicio','actividad']},{key:'z1_distance_m',label:'Zona 1(m)',auto:['zone 1','z1','zona 1']},{key:'z2_distance_m',label:'Zona 2(m)',auto:['zone 2','z2','zona 2']},{key:'z3_distance_m',label:'Zona 3(m)',auto:['zone 3','z3','zona 3']},{key:'z4_distance_m',label:'Zona 4(m)',auto:['zone 4','z4','zona 4']},{key:'z5_distance_m',label:'Zona 5(m)',auto:['zone 5','z5','zona 5']}];cmPfCsvMapping={};mm.forEach(function(m){for(var i=0;i<hd.length;i++){var hl=hd[i].toLowerCase();if(m.auto.some(function(a){return hl.indexOf(a)>=0;})){cmPfCsvMapping[m.key]=i;break;}}});
    var html='<h5 style="color:#e2e8f0;margin:0 0 8px 0;font-size:14px">Paso 2: Mapear columnas</h5><p style="color:#94a3b8;font-size:12px;margin-bottom:12px">'+hd.length+' columnas · '+cmPfCsvData.rows.length+' filas</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';mm.forEach(function(m){html+='<div class="cmpf-form-group" style="margin-bottom:6px"><label>'+m.label+'</label><select id="cmpf-csv-map-'+m.key+'" style="font-size:12px;padding:4px 8px"><option value="">-- No --</option>';hd.forEach(function(h,i){html+='<option value="'+i+'"'+(cmPfCsvMapping[m.key]===i?' selected':'')+'>'+h+'</option>';});html+='</select></div>';});
    html+='</div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="document.getElementById(\'cmpf-csv-import\').style.display=\'none\'">Cancelar</button><button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfCsvStep3()">Siguiente</button></div>';s2.innerHTML=html;s2.style.display='block';}
function cmPfCsvStep3(){var keys=['player_name','total_distance_m','hsr_distance_m','sprint_distance_m','max_speed_kmh','sprint_count','accel_count','decel_count','hmld_m','player_load','avg_metabolic_power','distance_per_min','segment_name','z1_distance_m','z2_distance_m','z3_distance_m','z4_distance_m','z5_distance_m'];cmPfCsvMapping={};keys.forEach(function(k){var sel=document.getElementById('cmpf-csv-map-'+k);if(sel&&sel.value!=='')cmPfCsvMapping[k]=parseInt(sel.value);});if(cmPfCsvMapping.player_name===undefined){showToast('Mapea la columna de nombre');return;}
    var csvN={};cmPfCsvData.rows.forEach(function(r){var n=r[cmPfCsvMapping.player_name];if(n)csvN[n]=true;});var uN=Object.keys(csvN);cmPfCsvPlayerMapping={};uN.forEach(function(cn){cmPfJugadoresData.forEach(function(j){var jl=(j.name||'').toLowerCase();var cl=cn.toLowerCase();if(jl===cl||(jl.indexOf(cl)>=0||cl.indexOf(jl)>=0))cmPfCsvPlayerMapping[cn]=j.id;});});
    var s3=document.getElementById('cmpf-csv-step3');var html='<h5 style="color:#e2e8f0;margin:0 0 8px 0;font-size:14px">Paso 3: Mapear jugadores</h5><p style="color:#94a3b8;font-size:12px;margin-bottom:12px">'+uN.length+' jugadores en CSV</p><div style="max-height:300px;overflow-y:auto">';uN.forEach(function(cn){var safeId='cmpf-csv-player-'+cn.replace(/[^a-zA-Z0-9]/g,'_');html+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><span style="color:#e2e8f0;font-size:13px;min-width:140px">'+cn+'</span><select id="'+safeId+'" style="flex:1;font-size:12px;padding:4px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;border-radius:4px"><option value="">-- Ignorar --</option>';cmPfJugadoresData.forEach(function(j){html+='<option value="'+j.id+'"'+(cmPfCsvPlayerMapping[cn]===j.id?' selected':'')+'>'+j.name+'</option>';});html+='</select></div>';});
    html+='</div><div class="cmpf-form-row-3" style="margin-top:12px"><div class="cmpf-form-group"><label>Tipo</label><select id="cmpf-csv-type"><option value="training">Entreno</option><option value="match">Partido</option></select></div><div class="cmpf-form-group"><label>Fecha</label><input type="date" id="cmpf-csv-date" value="'+cmPfHoy()+'"></div><div class="cmpf-form-group"><label>Titulo</label><input type="text" id="cmpf-csv-title" placeholder="Sesion GPS"></div></div>';
    html+='<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="cmpf-btn cmpf-btn-secondary cmpf-btn-sm" onclick="document.getElementById(\'cmpf-csv-import\').style.display=\'none\'">Cancelar</button><button class="cmpf-btn cmpf-btn-success cmpf-btn-sm" onclick="cmPfCsvImportar()">Importar</button></div>';s3.innerHTML=html;s3.style.display='block';}
async function cmPfCsvImportar(){var tipo=document.getElementById('cmpf-csv-type').value;var fecha=document.getElementById('cmpf-csv-date').value;var titulo=(document.getElementById('cmpf-csv-title')||{}).value||'';if(!fecha){showToast('Indica fecha');return;}var csvN={};cmPfCsvData.rows.forEach(function(r){var n=r[cmPfCsvMapping.player_name];if(n)csvN[n]=true;});var pm={};Object.keys(csvN).forEach(function(cn){var sel=document.getElementById('cmpf-csv-player-'+cn.replace(/[^a-zA-Z0-9]/g,'_'));if(sel&&sel.value)pm[cn]=sel.value;});try{var ins=await supabaseClient.from('cm_pf_gps_sessions').insert({club_id:clubId,session_date:fecha,session_type:tipo,title:titulo||null,source:'csv'}).select('id').single();if(ins.error)throw ins.error;var sid=ins.data.id;var rows=[];var mp=cmPfCsvMapping;var vf=function(row,key){if(mp[key]===undefined)return null;var v=row[mp[key]];if(!v||v==='')return null;var n=parseFloat(v.replace(',','.'));return isNaN(n)?null:n;};cmPfCsvData.rows.forEach(function(row){var cn=row[mp.player_name];var pid=pm[cn];if(!pid)return;var seg=mp.segment_name!==undefined&&row[mp.segment_name]?row[mp.segment_name]:'TOTAL';rows.push({club_id:clubId,session_id:sid,player_id:pid,segment_name:seg,total_distance_m:vf(row,'total_distance_m'),hsr_distance_m:vf(row,'hsr_distance_m'),sprint_distance_m:vf(row,'sprint_distance_m'),max_speed_kmh:vf(row,'max_speed_kmh'),sprint_count:vf(row,'sprint_count'),accel_count:vf(row,'accel_count'),decel_count:vf(row,'decel_count'),player_load:vf(row,'player_load'),extra_metrics:{hmld_m:vf(row,'hmld_m'),avg_metabolic_power:vf(row,'avg_metabolic_power'),distance_per_min:vf(row,'distance_per_min')},z1_distance_m:vf(row,'z1_distance_m'),z2_distance_m:vf(row,'z2_distance_m'),z3_distance_m:vf(row,'z3_distance_m'),z4_distance_m:vf(row,'z4_distance_m'),z5_distance_m:vf(row,'z5_distance_m')});});if(!rows.length){showToast('Ningun jugador mapeado');return;}var res=await supabaseClient.from('cm_pf_gps_player_data').insert(rows);if(res.error)throw res.error;showToast(rows.length+' registros importados');document.getElementById('cmpf-csv-import').style.display='none';cmPfCargarGps();}catch(e){showToast('Error: '+(e.message||e));}}

// ================================================================
// TAB 4: INFORME Y COMPARATIVAS GPS
// ================================================================

async function cmPfCargarInforme(){
    var c=document.getElementById('cmpf-tab-informe');
    if(!c||!cmPfJugadorActual)return;
    c.innerHTML='<div class="cmpf-empty"><div class="icon">...</div><p>Cargando comparativas...</p></div>';
    try{
        var r=await supabaseClient.from('cm_pf_gps_player_data')
            .select('player_id,total_distance_m,hsr_distance_m,sprint_distance_m,max_speed_kmh,sprint_count,accel_count,decel_count,player_load,extra_metrics,cm_pf_gps_sessions(session_date,session_type)')
            .eq('club_id',clubId).eq('segment_name','TOTAL').eq('archived',false);
        var allData=r.data||[];
        var pr=await supabaseClient.from('club_players').select('id,name,positions_main')
            .eq('club_id',clubId).eq('active',true);
        var players={};
        (pr.data||[]).forEach(function(p){players[p.id]=p;});
        cmPfInformeData={raw:allData,players:players};
        cmPfRenderInforme();
    }catch(e){console.error(e);c.innerHTML='<div class="cmpf-empty"><p>Error cargando datos</p></div>';}
}

function cmPfGetPosGroup(pos){
    if(!pos)return'otro';
    var p=pos.toLowerCase();
    if(p.indexOf('portero')>=0||p==='gk'||p==='pt')return'portero';
    if(p.indexOf('central')>=0||p.indexOf('lateral')>=0||p.indexOf('defens')>=0||p==='df'||p==='dfc'||p==='ld'||p==='li'||p==='cb'||p==='rb'||p==='lb')return'defensa';
    if(p.indexOf('medio')>=0||p.indexOf('pivote')>=0||p.indexOf('interior')>=0||p==='mc'||p==='mcd'||p==='mco'||p==='cm'||p==='cdm'||p==='cam')return'medio';
    if(p.indexOf('extrem')>=0||p.indexOf('delant')>=0||p.indexOf('punt')>=0||p==='dc'||p==='ei'||p==='ed'||p==='st'||p==='lw'||p==='rw'||p==='cf')return'delantero';
    return'otro';
}

function cmPfCalcularEstadisticas(){
    if(!cmPfInformeData)return null;
    var raw=cmPfInformeData.raw;
    var players=cmPfInformeData.players;
    var jugActual=cmPfJugadorActual;
    var metrics=['total_distance_m','hsr_distance_m','sprint_distance_m','max_speed_kmh','sprint_count','accel_count','decel_count','player_load'];
    var metLabels={total_distance_m:'TD(m)',hsr_distance_m:'HSR(m)',sprint_distance_m:'Sprint(m)',max_speed_kmh:'Vmax(km/h)',sprint_count:'N.Sprint',accel_count:'Acc HI',decel_count:'Dec HI',player_load:'PL'};

    // Filtrar por tipo sesion
    var filtered=raw;
    if(cmPfInformeFiltroTipo){
        filtered=raw.filter(function(d){return d.cm_pf_gps_sessions&&d.cm_pf_gps_sessions.session_type===cmPfInformeFiltroTipo;});
    }

    // Agrupar por jugador y calcular promedios
    var porJugador={};
    filtered.forEach(function(d){
        if(!porJugador[d.player_id])porJugador[d.player_id]={count:0,sums:{}};
        var pj=porJugador[d.player_id];
        pj.count++;
        metrics.forEach(function(m){
            var v=parseFloat(d[m])||0;
            if(v>0){
                if(!pj.sums[m])pj.sums[m]={total:0,n:0};
                pj.sums[m].total+=v;pj.sums[m].n++;
            }
        });
        // m/min y hmld desde extra_metrics
        if(d.extra_metrics){
            var mmin=parseFloat(d.extra_metrics.distance_per_min)||0;
            if(mmin>0){if(!pj.sums['m_min'])pj.sums['m_min']={total:0,n:0};pj.sums['m_min'].total+=mmin;pj.sums['m_min'].n++;}
            var hmld=parseFloat(d.extra_metrics.hmld_m)||0;
            if(hmld>0){if(!pj.sums['hmld'])pj.sums['hmld']={total:0,n:0};pj.sums['hmld'].total+=hmld;pj.sums['hmld'].n++;}
        }
    });

    var allMetrics=metrics.concat(['m_min','hmld']);
    var allLabels=Object.assign({},metLabels,{m_min:'m/min',hmld:'HMLD(m)'});

    // Promedios por jugador
    var promedios={};
    Object.keys(porJugador).forEach(function(pid){
        var pj=porJugador[pid];
        promedios[pid]={count:pj.count};
        allMetrics.forEach(function(m){
            if(pj.sums[m]&&pj.sums[m].n>0)promedios[pid][m]=Math.round(pj.sums[m].total/pj.sums[m].n*100)/100;
            else promedios[pid][m]=null;
        });
    });

    // Grupo de comparacion (equipo o misma posicion)
    var posActual=cmPfGetPosGroup((jugActual.position||''));
    var grupoIds=Object.keys(promedios);
    if(cmPfInformeFiltroPos==='misma'&&posActual!=='otro'){
        grupoIds=grupoIds.filter(function(pid){
            var p=players[pid];if(!p)return false;
            return cmPfGetPosGroup((p.positions_main&&p.positions_main[0])||'')===posActual;
        });
    }

    // Media y desviacion tipica del grupo
    var grupoStats={};
    allMetrics.forEach(function(m){
        var vals=grupoIds.map(function(pid){return promedios[pid][m];}).filter(function(v){return v!=null&&v>0;});
        if(vals.length>=2){
            var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
            var variance=vals.reduce(function(a,v){return a+(v-mean)*(v-mean);},0)/vals.length;
            grupoStats[m]={mean:Math.round(mean*100)/100,sd:Math.round(Math.sqrt(variance)*100)/100,n:vals.length};
        }else if(vals.length===1){
            grupoStats[m]={mean:vals[0],sd:0,n:1};
        }
    });

    // Z-scores del jugador actual
    var jugProm=promedios[jugActual.id]||{};
    var zScores={};
    allMetrics.forEach(function(m){
        if(jugProm[m]!=null&&grupoStats[m]&&grupoStats[m].sd>0){
            zScores[m]=Math.round((jugProm[m]-grupoStats[m].mean)/grupoStats[m].sd*100)/100;
        }else{zScores[m]=null;}
    });

    // Percentiles para radar (0-100)
    var percentiles={};
    allMetrics.forEach(function(m){
        var vals=grupoIds.map(function(pid){return promedios[pid][m];}).filter(function(v){return v!=null&&v>0;});
        vals.sort(function(a,b){return a-b;});
        if(vals.length>=2&&jugProm[m]!=null){
            var rank=0;vals.forEach(function(v){if(jugProm[m]>=v)rank++;});
            percentiles[m]=Math.round(rank/vals.length*100);
        }
    });

    // Rankings por metrica
    var rankings={};
    allMetrics.forEach(function(m){
        var arr=grupoIds.filter(function(pid){return promedios[pid][m]!=null&&promedios[pid][m]>0;}).map(function(pid){
            var p=players[pid]||{};
            return{pid:pid,name:p.name||'?',pos:(p.positions_main&&p.positions_main[0])||'',value:promedios[pid][m],count:promedios[pid].count};
        });
        arr.sort(function(a,b){return b.value-a.value;});
        arr.forEach(function(r,i){r.rank=i+1;});
        rankings[m]=arr;
    });

    return{jugProm:jugProm,grupoStats:grupoStats,zScores:zScores,percentiles:percentiles,rankings:rankings,allMetrics:allMetrics,allLabels:allLabels,nJugadores:grupoIds.length,posActual:posActual};
}

function cmPfRenderInforme(){
    var c=document.getElementById('cmpf-tab-informe');
    if(!c||!cmPfJugadorActual)return;
    var stats=cmPfCalcularEstadisticas();
    if(!stats||!stats.jugProm.count){
        c.innerHTML='<div class="cmpf-empty"><p>Sin datos GPS suficientes para comparar.<br>Registra sesiones GPS del jugador y del equipo primero.</p></div>';return;
    }

    var h='';
    // Filtros
    h+='<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    h+='<select id="cmpf-inf-tipo" onchange="cmPfInformeFiltroTipo=this.value;cmPfRenderInforme()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px">';
    h+='<option value=""'+(cmPfInformeFiltroTipo===''?' selected':'')+'>Tipo: Todos</option>';
    h+='<option value="training"'+(cmPfInformeFiltroTipo==='training'?' selected':'')+'>Solo entrenos</option>';
    h+='<option value="match"'+(cmPfInformeFiltroTipo==='match'?' selected':'')+'>Solo partidos</option></select>';
    h+='<select id="cmpf-inf-pos" onchange="cmPfInformeFiltroPos=this.value;cmPfRenderInforme()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px">';
    h+='<option value=""'+(cmPfInformeFiltroPos===''?' selected':'')+'>Grupo: Equipo completo</option>';
    h+='<option value="misma"'+(cmPfInformeFiltroPos==='misma'?' selected':'')+'>Solo mi posicion ('+stats.posActual+')</option></select>';
    h+='<span style="color:#64748b;font-size:11px">'+stats.nJugadores+' jugadores | '+stats.jugProm.count+' sesiones propias</span>';
    h+='<button class="cmpf-btn cmpf-btn-primary cmpf-btn-sm" onclick="cmPfGenerarPdfInforme()" style="margin-left:auto">Exportar PDF</button>';
    h+='</div>';

    // SECCION 1: Z-SCORES
    h+='<div class="cmpf-section-title">Z-Scores — Jugador vs Grupo</div>';
    h+='<div style="overflow-x:auto"><table class="cmpf-table"><thead><tr><th>Metrica</th><th style="text-align:right">Tu media</th><th style="text-align:right">Media grupo</th><th style="text-align:right">Desv.Tip</th><th style="text-align:center">Z-Score</th><th style="text-align:center">Percentil</th></tr></thead><tbody>';
    stats.allMetrics.forEach(function(m){
        var gs=stats.grupoStats[m];if(!gs)return;
        var jv=stats.jugProm[m];var z=stats.zScores[m];var pct=stats.percentiles[m];
        var zColor='#94a3b8',zBg='#1e293b';
        if(z!=null){
            if(z>=1){zColor='#22c55e';zBg='#052e16';}
            else if(z>=0.5){zColor='#4ade80';zBg='#052e16';}
            else if(z<=-1){zColor='#ef4444';zBg='#450a0a';}
            else if(z<=-0.5){zColor='#f87171';zBg='#450a0a';}
        }
        h+='<tr><td style="font-weight:600">'+stats.allLabels[m]+'</td>';
        h+='<td style="text-align:right;color:#14b8a6;font-weight:700">'+(jv!=null?jv:'-')+'</td>';
        h+='<td style="text-align:right">'+gs.mean+'</td>';
        h+='<td style="text-align:right;color:#64748b">'+gs.sd+'</td>';
        h+='<td style="text-align:center"><span style="display:inline-block;padding:2px 10px;border-radius:4px;font-weight:700;background:'+zBg+';color:'+zColor+'">'+(z!=null?z:'-')+'</span></td>';
        h+='<td style="text-align:center">'+(pct!=null?'<span style="color:#a78bfa;font-weight:600">P'+pct+'</span>':'-')+'</td>';
        h+='</tr>';
    });
    h+='</tbody></table></div>';

    // SECCION 2: RADAR
    h+='<div class="cmpf-section-title" style="margin-top:24px">Perfil Radar — Percentiles</div>';
    h+='<div class="cmpf-chart-container" style="max-width:500px;margin:0 auto"><canvas id="cmpf-canvas-radar" height="350"></canvas></div>';

    // SECCION 3: RANKINGS
    h+='<div class="cmpf-section-title" style="margin-top:24px">Ranking por metrica</div>';
    h+='<div style="margin-bottom:10px"><select id="cmpf-rank-metric" onchange="cmPfRenderRankingTable(this.value)" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px">';
    stats.allMetrics.forEach(function(m,i){
        if(!stats.grupoStats[m])return;
        h+='<option value="'+m+'"'+(i===0?' selected':'')+'>'+stats.allLabels[m]+'</option>';
    });
    h+='</select></div>';
    h+='<div id="cmpf-ranking-table"></div>';

    c.innerHTML=h;
    cmPfRenderRadarChart(stats);
    var firstMetric=stats.allMetrics.find(function(m){return stats.grupoStats[m];});
    if(firstMetric)cmPfRenderRankingTable(firstMetric);
}

function cmPfRenderRadarChart(stats){
    var ctx=document.getElementById('cmpf-canvas-radar');
    if(!ctx||typeof Chart==='undefined')return;
    if(window.cmPfChartRadar)window.cmPfChartRadar.destroy();
    var radarMetrics=stats.allMetrics.filter(function(m){
        return stats.jugProm[m]!=null&&stats.percentiles[m]!=null&&stats.grupoStats[m];
    });
    if(radarMetrics.length<3){ctx.parentElement.innerHTML='<p style="color:#64748b;font-size:12px;text-align:center;padding:20px">Minimo 3 metricas con datos para generar radar</p>';return;}
    var labels=radarMetrics.map(function(m){return stats.allLabels[m];});
    var playerData=radarMetrics.map(function(m){return stats.percentiles[m]||0;});
    var groupData=radarMetrics.map(function(){return 50;});
    window.cmPfChartRadar=new Chart(ctx,{
        type:'radar',
        data:{labels:labels,datasets:[
            {label:cmPfJugadorActual.name,data:playerData,borderColor:'#14b8a6',backgroundColor:'rgba(20,184,166,0.15)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#14b8a6'},
            {label:'Media grupo (P50)',data:groupData,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.08)',borderWidth:1,borderDash:[4,4],pointRadius:3,pointBackgroundColor:'#f59e0b'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#94a3b8',font:{size:11}}}},
            scales:{r:{beginAtZero:true,max:100,
                ticks:{display:false,stepSize:25},
                grid:{color:'#334155'},angleLines:{color:'#334155'},
                pointLabels:{color:'#e2e8f0',font:{size:11}}
            }}
        }
    });
}

function cmPfRenderRankingTable(metricKey){
    var cont=document.getElementById('cmpf-ranking-table');if(!cont)return;
    var stats=cmPfCalcularEstadisticas();if(!stats)return;
    var ranking=stats.rankings[metricKey]||[];
    if(!ranking.length){cont.innerHTML='<p style="color:#64748b;font-size:12px">Sin datos para esta metrica</p>';return;}
    var h='<div style="overflow-x:auto"><table class="cmpf-table"><thead><tr><th style="width:40px">#</th><th>Jugador</th><th>Pos</th><th style="text-align:right">Media</th><th style="text-align:right">Sesiones</th></tr></thead><tbody>';
    ranking.forEach(function(r){
        var isMe=r.pid===cmPfJugadorActual.id;
        var rowBg=isMe?'background:#0d3d3e;':'';
        var borderL=isMe?'border-left:3px solid #14b8a6;':'';
        var nameCol=isMe?'color:#14b8a6;font-weight:700':'font-weight:600';
        var medal='';
        if(r.rank===1)medal='&#129351; ';else if(r.rank===2)medal='&#129352; ';else if(r.rank===3)medal='&#129353; ';
        h+='<tr style="'+rowBg+borderL+'"><td style="color:#64748b;font-weight:700">'+medal+r.rank+'</td>';
        h+='<td style="'+nameCol+'">'+r.name+'</td>';
        h+='<td style="color:#94a3b8;font-size:11px">'+r.pos+'</td>';
        h+='<td style="text-align:right;color:#e2e8f0;font-weight:600">'+r.value+'</td>';
        h+='<td style="text-align:right;color:#64748b">'+r.count+'</td></tr>';
    });
    h+='</tbody></table></div>';
    cont.innerHTML=h;
}

async function cmPfGenerarPdfInforme(){
    if(!cmPfJugadorActual||typeof jspdf==='undefined'){showToast('jsPDF no disponible');return;}
    var stats=cmPfCalcularEstadisticas();
    if(!stats||!stats.jugProm.count){showToast('Sin datos');return;}
    var doc=new jspdf.jsPDF('p','mm','a4');
    var w=doc.internal.pageSize.getWidth();
    var y=20;

    // Cabecera
    doc.setFontSize(18);doc.setTextColor(20,184,166);
    doc.text('Informe Comparativo GPS',w/2,y,{align:'center'});y+=10;
    doc.setFontSize(12);doc.setTextColor(60,60,60);
    doc.text(cmPfJugadorActual.name+(cmPfJugadorActual.position?' - '+cmPfJugadorActual.position:'')+(cmPfJugadorActual.team_name?' - '+cmPfJugadorActual.team_name:''),w/2,y,{align:'center'});y+=7;
    doc.setFontSize(9);doc.setTextColor(120,120,120);
    var filtroTxt='Grupo: '+(cmPfInformeFiltroPos==='misma'?'misma posicion ('+stats.posActual+')':'equipo completo');
    filtroTxt+=' | Tipo: '+(cmPfInformeFiltroTipo==='training'?'entrenos':cmPfInformeFiltroTipo==='match'?'partidos':'todos');
    filtroTxt+=' | '+stats.nJugadores+' jugadores | '+stats.jugProm.count+' sesiones propias';
    doc.text(filtroTxt,w/2,y,{align:'center'});y+=4;
    doc.setDrawColor(200);doc.line(15,y,w-15,y);y+=8;

    // Tabla Z-Scores
    doc.setFontSize(11);doc.setTextColor(40,40,40);
    doc.text('Z-Scores',15,y);y+=6;
    doc.setFontSize(7);doc.setTextColor(120,120,120);
    var cols=[{x:15,t:'Metrica'},{x:55,t:'Tu media'},{x:80,t:'Media grupo'},{x:110,t:'Desv.Tip'},{x:138,t:'Z-Score'},{x:165,t:'Percentil'}];
    cols.forEach(function(c){doc.text(c.t,c.x,y);});y+=2;
    doc.line(15,y,w-15,y);y+=4;
    doc.setFontSize(9);
    stats.allMetrics.forEach(function(m){
        var gs=stats.grupoStats[m];if(!gs)return;
        var jv=stats.jugProm[m];var z=stats.zScores[m];var pct=stats.percentiles[m];
        doc.setTextColor(50,50,50);doc.text(stats.allLabels[m],15,y);
        doc.setTextColor(20,184,166);doc.text(jv!=null?String(jv):'-',55,y);
        doc.setTextColor(90,90,90);doc.text(String(gs.mean),80,y);
        doc.setTextColor(150,150,150);doc.text(String(gs.sd),110,y);
        if(z!=null){
            if(z>=0.5)doc.setTextColor(34,197,94);
            else if(z<=-0.5)doc.setTextColor(239,68,68);
            else doc.setTextColor(100,100,100);
            doc.text(String(z),138,y);
        }else{doc.setTextColor(150,150,150);doc.text('-',138,y);}
        doc.setTextColor(120,120,120);doc.text(pct!=null?'P'+pct:'-',165,y);
        y+=5;
    });
    y+=4;

    // Radar como imagen
    var radarCanvas=document.getElementById('cmpf-canvas-radar');
    if(radarCanvas){
        try{
            var imgData=radarCanvas.toDataURL('image/png');
            var imgW=80,imgH=80;
            if(y+imgH+10>275){doc.addPage();y=20;}
            doc.setFontSize(11);doc.setTextColor(40,40,40);
            doc.text('Perfil Radar (percentiles)',15,y);y+=4;
            doc.addImage(imgData,'PNG',(w-imgW)/2,y,imgW,imgH);y+=imgH+6;
        }catch(e){console.warn('No se pudo exportar radar',e);}
    }

    // Top 5 TD
    var tdRanking=stats.rankings['total_distance_m']||[];
    if(tdRanking.length){
        if(y+50>280){doc.addPage();y=20;}
        doc.setFontSize(11);doc.setTextColor(40,40,40);
        doc.text('Ranking - Distancia Total (Top 5)',15,y);y+=6;
        doc.setFontSize(7);doc.setTextColor(120,120,120);
        doc.text('#',15,y);doc.text('Jugador',25,y);doc.text('Pos',95,y);doc.text('Media',115,y);doc.text('Sesiones',145,y);y+=2;
        doc.line(15,y,w-15,y);y+=4;
        doc.setFontSize(9);
        tdRanking.slice(0,5).forEach(function(r){
            if(r.pid===cmPfJugadorActual.id)doc.setTextColor(20,184,166);else doc.setTextColor(60,60,60);
            doc.text(String(r.rank),15,y);doc.text(r.name.substring(0,30),25,y);doc.text(r.pos,95,y);doc.text(String(r.value),115,y);doc.text(String(r.count),145,y);
            y+=5;
        });
        var meInRank=tdRanking.find(function(r){return r.pid===cmPfJugadorActual.id;});
        if(meInRank&&meInRank.rank>5){
            y+=2;doc.setTextColor(100,100,100);doc.text('...',18,y);y+=4;
            doc.setTextColor(20,184,166);
            doc.text(String(meInRank.rank),15,y);doc.text(meInRank.name.substring(0,30),25,y);doc.text(meInRank.pos,95,y);doc.text(String(meInRank.value),115,y);doc.text(String(meInRank.count),145,y);
        }
    }

    // Pie de pagina
    var totalPages=doc.internal.getNumberOfPages();
    for(var pg=1;pg<=totalPages;pg++){
        doc.setPage(pg);
        doc.setFontSize(7);doc.setTextColor(170,170,170);
        doc.text('TopLiderCoach HUB - Informe generado '+new Date().toLocaleDateString('es-ES'),w/2,doc.internal.pageSize.getHeight()-8,{align:'center'});
    }

    doc.save('Informe_GPS_'+cmPfJugadorActual.name.replace(/\s+/g,'_')+'.pdf');
    showToast('PDF generado');
}

// ================================================================
// HELPERS
// ================================================================
function cmPfHoy(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function cmPfFormatFecha(s){if(!s)return'';var d=new Date(s+'T12:00:00');return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}

// ================================================================
// SECCION: SESIONES GPS A NIVEL MODULO
// Vista de equipo: todas las sesiones, tabla jugadores, medias
// ================================================================

// --- Variables nuevas (anadir junto a las existentes al inicio) ---
// var cmPfVistaActiva = 'jugadores';
// var cmPfSesionesData = [];
// var cmPfEjerciciosClub = [];

async function cmPfCargarEjercicios() {
    try {
        var r = await supabaseClient.from('custom_exercises').select('id,name,category,description')
            .eq('club_id', clubId).order('name');
        cmPfEjerciciosClub = r.data || [];
    } catch(e) { cmPfEjerciciosClub = []; }
}

function cmPfCambiarVista(vista) {
    cmPfVistaActiva = vista;
    document.querySelectorAll('.cmpf-vista-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-vista') === vista);
    });
    var vj = document.getElementById('cmpf-vista-jugadores');
    var vs = document.getElementById('cmpf-vista-sesiones');
    var vc = document.getElementById('cmpf-vista-cargas');
    if (vj) vj.style.display = vista === 'jugadores' ? 'block' : 'none';
    if (vs) vs.style.display = vista === 'sesiones' ? 'block' : 'none';
    if (vc) vc.style.display = vista === 'cargas' ? 'block' : 'none';
    if (vista === 'cargas' && typeof cargarPanelCargas === 'function') {
        cargarPanelCargas('cmpf-cargas-contenido');
    }
    if (vista === 'sesiones') {
        // Rellenar filtros
        var selEq = document.getElementById('cmpf-ses-filtro-equipo');
        if (selEq && selEq.options.length <= 1) {
            cmPfEquipos.forEach(function(t) { var o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selEq.appendChild(o); });
        }
        var selEj = document.getElementById('cmpf-ses-filtro-ejercicio');
        if (selEj && selEj.options.length <= 1) {
            cmPfEjerciciosClub.forEach(function(e) { var o = document.createElement('option'); o.value = e.id; o.textContent = e.name; selEj.appendChild(o); });
        }
        cmPfCargarSesiones();
    }
}

// ========== CONFIG METRICAS CUSTOM ==========
function cmPfToggleConfig(){var p=document.getElementById('cmpf-gps-config-panel');if(!p)return;p.style.display=p.style.display==='none'?'block':'none';if(p.style.display==='block')cmPfRenderCustomMetrics();}
function cmPfRenderCustomMetrics(){var c=document.getElementById('cmpf-custom-metrics-list');if(!c)return;var mets=(cmPfGpsConfig&&cmPfGpsConfig.custom_metrics)||[];if(!mets.length){c.innerHTML='<p style="color:#64748b;font-size:12px">Sin metricas custom definidas</p>';return;}var h='<div style="display:flex;flex-wrap:wrap;gap:6px">';mets.forEach(function(m,i){h+='<span style="display:inline-flex;align-items:center;gap:6px;background:#0f172a;padding:6px 12px;border-radius:6px;font-size:13px;color:#e2e8f0"><strong>'+m.label+'</strong><span style="color:#64748b;font-size:11px">'+m.unit+'</span><button style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0 2px" onclick="cmPfRemoveCustomMetric('+i+')">&times;</button></span>';});h+='</div>';c.innerHTML=h;}
async function cmPfAddCustomMetric(){var nm=(document.getElementById('cmpf-cm-name')||{}).value;var un=(document.getElementById('cmpf-cm-unit')||{}).value;if(!nm){showToast('Nombre requerido');return;}var mets=(cmPfGpsConfig&&cmPfGpsConfig.custom_metrics)||[];if(mets.length>=8){showToast('Maximo 8 metricas');return;}var key=nm.toLowerCase().replace(/[^a-z0-9]/g,'_');if(mets.some(function(m){return m.key===key;})){showToast('Ya existe');return;}mets.push({key:key,label:nm.trim(),unit:(un||'').trim()});try{await supabaseClient.from('cm_pf_gps_config').update({custom_metrics:mets,updated_at:new Date().toISOString()}).eq('club_id',clubId);cmPfGpsConfig.custom_metrics=mets;document.getElementById('cmpf-cm-name').value='';document.getElementById('cmpf-cm-unit').value='';cmPfRenderCustomMetrics();showToast('Metrica "'+nm+'" anadida');}catch(e){showToast('Error');}}
async function cmPfRemoveCustomMetric(idx){var mets=(cmPfGpsConfig&&cmPfGpsConfig.custom_metrics)||[];if(idx<0||idx>=mets.length)return;var name=mets[idx].label;mets.splice(idx,1);try{await supabaseClient.from('cm_pf_gps_config').update({custom_metrics:mets,updated_at:new Date().toISOString()}).eq('club_id',clubId);cmPfGpsConfig.custom_metrics=mets;cmPfRenderCustomMetrics();showToast('"'+name+'" eliminada');}catch(e){showToast('Error');}}

async function cmPfCargarSesiones() {
    var cont = document.getElementById('cmpf-sesiones-list');
    if (!cont) return;
    cont.innerHTML = '<div class="cmpf-empty"><div class="icon">...</div><p>Cargando sesiones...</p></div>';
    try {
        // Cargar sesiones del club
        var fEquipo = document.getElementById('cmpf-ses-filtro-equipo');
        var fTipo = document.getElementById('cmpf-ses-filtro-tipo');
        var fEj = document.getElementById('cmpf-ses-filtro-ejercicio');
        var q = supabaseClient.from('cm_pf_gps_sessions').select('*,custom_exercises(id,name)')
            .eq('club_id', clubId).eq('archived', false).order('session_date', {ascending: false}).limit(50);
        if (fEquipo && fEquipo.value) q = q.eq('team_id', fEquipo.value);
        if (fTipo && fTipo.value) q = q.eq('session_type', fTipo.value);
        if (fEj && fEj.value) q = q.eq('exercise_id', fEj.value);
        var r = await q;
        var sesiones = r.data || [];
        if (!sesiones.length) { cont.innerHTML = '<div class="cmpf-empty"><p>Sin sesiones GPS</p></div>'; return; }

        // Para cada sesion, contar jugadores y obtener medias del TOTAL
        var sesIds = sesiones.map(function(s) { return s.id; });
        var pd = await supabaseClient.from('cm_pf_gps_player_data')
            .select('session_id,player_id,total_distance_m,hsr_distance_m,sprint_distance_m,max_speed_kmh,player_load')
            .in('session_id', sesIds).eq('segment_name', 'TOTAL').eq('archived', false);
        var playerData = pd.data || [];

        // Agrupar por sesion
        var porSesion = {};
        playerData.forEach(function(p) {
            if (!porSesion[p.session_id]) porSesion[p.session_id] = [];
            porSesion[p.session_id].push(p);
        });

        var h = '';
        sesiones.forEach(function(s) {
            var jugadores = porSesion[s.id] || [];
            var n = jugadores.length;
            var tipo = s.session_type === 'match' ? '<span class="cmpf-gps-type match">Partido</span>' : '<span class="cmpf-gps-type training">Entreno</span>';
            var titulo = s.title || (s.opponent ? 'vs ' + s.opponent : 'Sesion');
            var ejNombre = s.custom_exercises ? s.custom_exercises.name : '';

            // Calcular medias
            var media = {};
            if (n > 0) {
                ['total_distance_m','hsr_distance_m','sprint_distance_m','max_speed_kmh','player_load'].forEach(function(k) {
                    var vals = jugadores.map(function(j) { return parseFloat(j[k]) || 0; }).filter(function(v) { return v > 0; });
                    if (vals.length) media[k] = Math.round(vals.reduce(function(a,b) { return a+b; }, 0) / vals.length);
                });
            }

            h += '<div class="cmpf-gps-card" onclick="cmPfVerSesionCompleta(\'' + s.id + '\')">';
            h += '<div style="display:flex;justify-content:space-between;align-items:center">';
            h += '<div class="title">' + cmPfFormatFecha(s.session_date) + ' ' + tipo + ' ' + titulo + '</div>';
            h += '<span style="color:#64748b;font-size:12px">' + n + ' jugadores' + (s.duration_min ? ' · ' + s.duration_min + 'min' : '') + '</span></div>';
            if (ejNombre) h += '<div style="color:#a78bfa;font-size:11px;margin-top:2px">Ejercicio: ' + ejNombre + '</div>';
            if (n > 0) {
                h += '<div class="meta" style="margin-top:6px">';
                if (media.total_distance_m) h += '<div>TD med:<span>' + media.total_distance_m + 'm</span></div>';
                if (media.hsr_distance_m) h += '<div>HSR med:<span>' + media.hsr_distance_m + 'm</span></div>';
                if (media.sprint_distance_m) h += '<div>Sprint med:<span>' + media.sprint_distance_m + 'm</span></div>';
                if (media.max_speed_kmh) h += '<div>Vmax med:<span>' + media.max_speed_kmh + '</span></div>';
                if (media.player_load) h += '<div>PL med:<span>' + media.player_load + '</span></div>';
                h += '</div>';
            }
            h += '</div>';
        });
        cont.innerHTML = h;
    } catch(e) { console.error('cmPfCargarSesiones:', e); cont.innerHTML = '<div class="cmpf-empty"><p>Error</p></div>'; }
}

async function cmPfVerSesionCompleta(sessionId) {
    try {
        var sr = await supabaseClient.from('cm_pf_gps_sessions').select('*,custom_exercises(id,name)').eq('id', sessionId).single();
        var ses = sr.data;
        if (!ses) return;

        // Cargar TODOS los datos de la sesion (todos jugadores, todos segmentos)
        var pd = await supabaseClient.from('cm_pf_gps_player_data').select('*')
            .eq('session_id', sessionId).eq('archived', false).order('segment_name').order('player_id');
        var allData = pd.data || [];
        if (!allData.length) { showToast('Sin datos en esta sesion'); return; }

        // Obtener nombres de jugadores
        var playerIds = [];
        allData.forEach(function(d) { if (playerIds.indexOf(d.player_id) === -1) playerIds.push(d.player_id); });
        var pRes = await supabaseClient.from('club_players').select('id,name,positions_main').in('id', playerIds);
        var playerMap = {};
        (pRes.data || []).forEach(function(p) { playerMap[p.id] = p; });

        // Obtener segmentos unicos
        var segmentos = [];
        allData.forEach(function(d) { if (segmentos.indexOf(d.segment_name) === -1) segmentos.push(d.segment_name); });
        // Poner TOTAL primero
        segmentos.sort(function(a, b) { if (a === 'TOTAL') return -1; if (b === 'TOTAL') return 1; return a.localeCompare(b); });


        cmPfRenderSesionCompleta(ses, allData, playerMap, segmentos);
    } catch(e) { console.error(e); showToast('Error cargando sesion'); }
}

function cmPfRenderSesionCompleta(ses, allData, playerMap, segmentos) {
    var tipo = ses.session_type === 'match' ? 'Partido' : 'Entrenamiento';
    var titulo = ses.title || (ses.opponent ? 'vs ' + ses.opponent : 'Sesion');
    var ejNombre = ses.custom_exercises ? ses.custom_exercises.name : '';
    var colors = ['#3b82f6','#22c55e','#eab308','#f97316','#ef4444'];
    var metCols = [
        {k:'total_distance_m', l:'TD(m)', fmt:function(v){return Math.round(v);}},
        {k:'hsr_distance_m', l:'HSR(m)', fmt:function(v){return Math.round(v);}},
        {k:'sprint_distance_m', l:'Sprint(m)', fmt:function(v){return Math.round(v);}},
        {k:'max_speed_kmh', l:'Vmax', fmt:function(v){return v;}},
        {k:'sprint_count', l:'N.Spr', fmt:function(v){return v;}},
        {k:'accel_count', l:'Acc', fmt:function(v){return v;}},
        {k:'decel_count', l:'Dec', fmt:function(v){return v;}},
        {k:'hmld_m', l:'HMLD', fmt:function(v){return Math.round(v);}},
        {k:'player_load', l:'PL', fmt:function(v){return v;}},
        {k:'distance_per_min', l:'m/min', fmt:function(v){return v;}}
    ];

    var html = '<div style="background:#0f172a;border:1px solid #fbbf24;border-radius:12px;padding:24px;max-width:95vw;width:100%;max-height:90vh;overflow-y:auto">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    html += '<h4 style="margin:0;color:#e2e8f0">' + cmPfFormatFecha(ses.session_date) + ' · ' + tipo + ' · ' + titulo + '</h4>';
    html += '<button style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer" onclick="this.closest(\'div[style*=fixed]\').remove()">&times;</button></div>';
    if (ejNombre) html += '<div style="color:#a78bfa;font-size:12px;margin-bottom:8px">Ejercicio vinculado: <strong>' + ejNombre + '</strong></div>';
    if (ses.duration_min) html += '<span style="color:#64748b;font-size:12px">' + ses.duration_min + ' min</span> ';
    if (ses.opponent) html += '<span style="color:#64748b;font-size:12px">vs ' + ses.opponent + '</span>';

    // Segment tabs
    if (segmentos.length > 1) {
        html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:16px 0 12px 0">';
        segmentos.forEach(function(seg, i) {
            html += '<button class="cmpf-seg-btn' + (i === 0 ? ' active' : '') + '" onclick="cmPfSelSegCompleta(this,\'' + seg.replace(/'/g,"\\'") + '\')" data-seg="' + seg + '">' + seg + '</button>';
        });
        html += '</div>';
    }

    // Tabla por segmento
    segmentos.forEach(function(seg, si) {
        var segData = allData.filter(function(d) { return d.segment_name === seg; });
        var n = segData.length;

        html += '<div class="cmpf-seg-completa" data-seg="' + seg + '" style="' + (si > 0 ? 'display:none' : '') + '">';

        // Determinar que columnas tienen datos
        var activeCols = metCols.filter(function(mc) {
            return segData.some(function(d) { return d[mc.k] != null && d[mc.k] !== 0; });
        });

        html += '<div style="overflow-x:auto"><table class="cmpf-table"><thead><tr><th>Jugador</th><th>Pos</th>';
        activeCols.forEach(function(mc) { html += '<th style="text-align:right">' + mc.l + '</th>'; });
        html += '<th>Zonas</th></tr></thead><tbody>';

        // Filas de jugadores
        segData.forEach(function(d) {
            var p = playerMap[d.player_id] || {};
            var pos = (p.positions_main && p.positions_main[0]) || '';
            html += '<tr><td style="font-weight:600;white-space:nowrap">' + (p.name || '?') + '</td><td style="color:#94a3b8;font-size:11px">' + pos + '</td>';
            activeCols.forEach(function(mc) {
                var v = d[mc.k];
                html += '<td style="text-align:right">' + (v != null ? mc.fmt(v) : '-') + '</td>';
            });
            // Mini zone bar
            var zz = [d.z1_distance_m||0,d.z2_distance_m||0,d.z3_distance_m||0,d.z4_distance_m||0,d.z5_distance_m||0];
            var zt = zz.reduce(function(a,b){return a+b;},0);
            html += '<td style="min-width:80px">';
            if (zt > 0) {
                html += '<div class="cmpf-zone-bar" style="height:14px">';
                zz.forEach(function(z,i) { var pct = Math.round(z/zt*100); if (pct>0) html += '<div style="width:'+pct+'%;background:'+colors[i]+'"></div>'; });
                html += '</div>';
            } else { html += '-'; }
            html += '</td></tr>';
        });

        // Fila de MEDIA
        if (n >= 2) {
            html += '<tr style="border-top:2px solid #334155;font-weight:700"><td style="color:#14b8a6">MEDIA</td><td></td>';
            activeCols.forEach(function(mc) {
                var vals = segData.map(function(d) { return parseFloat(d[mc.k]) || 0; }).filter(function(v) { return v > 0; });
                var media = vals.length ? vals.reduce(function(a,b){return a+b;},0) / vals.length : 0;
                html += '<td style="text-align:right;color:#14b8a6">' + (media ? mc.fmt(Math.round(media*10)/10) : '-') + '</td>';
            });
            html += '<td></td></tr>';

            // Fila de DESV.TIP
            html += '<tr style="font-size:11px"><td style="color:#64748b">DESV.TIP</td><td></td>';
            activeCols.forEach(function(mc) {
                var vals = segData.map(function(d) { return parseFloat(d[mc.k]) || 0; }).filter(function(v) { return v > 0; });
                if (vals.length >= 2) {
                    var media = vals.reduce(function(a,b){return a+b;},0) / vals.length;
                    var varianza = vals.reduce(function(a,v){return a + (v-media)*(v-media);},0) / vals.length;
                    var sd = Math.round(Math.sqrt(varianza)*10)/10;
                    html += '<td style="text-align:right;color:#64748b">' + sd + '</td>';
                } else { html += '<td style="text-align:right">-</td>'; }
            });
            html += '<td></td></tr>';

            // Fila MAX
            html += '<tr style="font-size:11px"><td style="color:#22c55e">MAX</td><td></td>';
            activeCols.forEach(function(mc) {
                var vals = segData.map(function(d) { return parseFloat(d[mc.k]) || 0; }).filter(function(v) { return v > 0; });
                var mx = vals.length ? Math.max.apply(null, vals) : 0;
                html += '<td style="text-align:right;color:#22c55e">' + (mx ? mc.fmt(mx) : '-') + '</td>';
            });
            html += '<td></td></tr>';

            // Fila MIN
            html += '<tr style="font-size:11px"><td style="color:#ef4444">MIN</td><td></td>';
            activeCols.forEach(function(mc) {
                var vals = segData.map(function(d) { return parseFloat(d[mc.k]) || 0; }).filter(function(v) { return v > 0; });
                var mn = vals.length ? Math.min.apply(null, vals) : 0;
                html += '<td style="text-align:right;color:#ef4444">' + (mn ? mc.fmt(mn) : '-') + '</td>';
            });
            html += '<td></td></tr>';
        }

        html += '</tbody></table></div>';
        html += '<div style="color:#64748b;font-size:11px;margin-top:6px">' + n + ' jugadores en segmento ' + seg + '</div>';
        html += '</div>';
    });

    html += '</div>';

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9500;display:flex;justify-content:center;align-items:center;padding:20px;overflow-y:auto';
    ov.onclick = function(e) { if (e.target === ov) document.body.removeChild(ov); };
    ov.innerHTML = html;
    document.body.appendChild(ov);
}

function cmPfSelSegCompleta(btn, seg) {
    btn.closest('div').querySelectorAll('.cmpf-seg-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var container = btn.closest('div').parentElement;
    container.querySelectorAll('.cmpf-seg-completa').forEach(function(d) {
        d.style.display = d.getAttribute('data-seg') === seg ? 'block' : 'none';
    });
}


// ================================================================
// AUTO-MONTAJE
// ================================================================
(function cmPfAutoMontar(){
    var n=0;var iv=setInterval(function(){
        n++;if(n>40){clearInterval(iv);return;}
        if(typeof cmState==='undefined'||!cmState.activo)return;
        if(typeof cmPuedeVer!=='function'||!cmPuedeVer('modulo_preparacion_fisica'))return;
        if(document.getElementById('cm-tab-prepfisica')){clearInterval(iv);return;}
        var mt=document.querySelector('.main-tabs');if(!mt)return;
        clearInterval(iv);
        var t=document.createElement('button');t.className='main-tab';t.id='cm-tab-prepfisica';
        t.setAttribute('onclick',"cambiarModulo('prepfisica',this)");
        t.innerHTML='<span class="tab-icon">&#127947;</span><span>Prep. Fisica</span>';mt.appendChild(t);
        if(!document.getElementById('modulo-prepfisica')){
            var v=document.createElement('div');v.className='vista-modulo';v.id='modulo-prepfisica';
            var u=document.querySelector('.vista-modulo:last-of-type');
            if(u&&u.parentElement)u.parentElement.insertBefore(v,u.nextSibling);else document.body.appendChild(v);
        }
        if(typeof registrarModulo==='function')registrarModulo('prepfisica',function(){cmPfInit('modulo-prepfisica');});
        var pd=document.getElementById('cm-pantalla-desarrollo');
        if(pd){pd.style.display='none';var mt2=document.querySelector('.main-tabs');if(mt2)mt2.style.display='';document.querySelectorAll('.vista-modulo').forEach(function(v){v.style.display='';});}
        var tv=Array.from(document.querySelectorAll('.main-tab')).filter(function(b){return b.style.display!=='none';});
        if(tv.length===1&&tv[0].id==='cm-tab-prepfisica')cambiarModulo('prepfisica',t);
        console.log('[Prep. Fisica] Auto-montado');
    },300);
})();