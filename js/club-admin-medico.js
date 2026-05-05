// ========== CLUB-ADMIN-MEDICO.JS ==========
// Modulo medico: lesiones, sesiones, pruebas, staff, revisiones

var medicoStaff=[], medicoLesiones=[], medicoSesiones=[];

function initSecMedico(){
    document.getElementById('sec-medico').innerHTML=
        '<div class="sb" style="grid-template-columns:repeat(4,1fr)">' +
        '<div class="sc"><div class="sl">Lesiones activas</div><div class="sv2" id="sm-activas" style="color:var(--danger)">0</div></div>' +
        '<div class="sc"><div class="sl">En readaptacion</div><div class="sv2" id="sm-readapt" style="color:var(--warn)">0</div></div>' +
        '<div class="sc"><div class="sl">Revisiones pendientes</div><div class="sv2" id="sm-rev" style="color:var(--accent)">0</div></div>' +
        '<div class="sc"><div class="sl">Sesiones hoy</div><div class="sv2" id="sm-hoy" style="color:var(--a2)">0</div></div>' +
        '</div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-body" style="padding:12px 20px"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div class="fg" style="margin:0;flex:0 0 180px"><label>Equipo</label><select id="med-fil-team" onchange="cargarMedico()" style="width:100%;padding:7px 10px;background:var(--bg-deep);border:1px solid var(--border);border-radius:var(--rs);color:var(--tp);font-family:inherit;font-size:12px"><option value="">Todos</option></select></div><div class="fg" style="margin:0;flex:0 0 180px"><label>Jugador</label><input id="med-fil-name" placeholder="Buscar por nombre..." oninput="cargarMedico()" style="width:100%;padding:7px 10px;background:var(--bg-deep);border:1px solid var(--border);border-radius:var(--rs);color:var(--tp);font-family:inherit;font-size:12px"></div><div class="fg" style="margin:0;flex:0 0 140px"><label>Estado lesion</label><select id="med-fil-status" onchange="cargarMedico()" style="width:100%;padding:7px 10px;background:var(--bg-deep);border:1px solid var(--border);border-radius:var(--rs);color:var(--tp);font-family:inherit;font-size:12px"><option value="">Todos</option><option value="activa">Activa</option><option value="en_tratamiento">En tratamiento</option><option value="en_readaptacion">En readaptacion</option><option value="alta">Alta</option></select></div></div></div></div>' +
        '<div class="tabs" id="med-tabs" style="margin-bottom:16px">' +
        '<button class="tab active" onclick="medNav(\'lesiones\',this)">Lesiones</button>' +
        '<button class="tab" onclick="medNav(\'sesiones\',this)">Sesiones</button>' +
        '<button class="tab" onclick="medNav(\'pruebas\',this)">Pruebas</button>' +
        '<button class="tab" onclick="medNav(\'revisiones\',this)">Revisiones</button>' +
        '<button class="tab" onclick="medNav(\'staff\',this)">Staff medico</button>' +
        '</div>' +
        '<div id="med-lesiones" class="med-sec active"></div>' +
        '<div id="med-sesiones" class="med-sec"></div>' +
        '<div id="med-pruebas" class="med-sec"></div>' +
        '<div id="med-revisiones" class="med-sec"></div>' +
        '<div id="med-staff" class="med-sec"></div>';
    // Inyectar estilo para med-sec
    if(!document.getElementById('med-sec-style')){var st=document.createElement('style');st.id='med-sec-style';st.textContent='.med-sec{display:none}.med-sec.active{display:block;animation:fadeUp .3s ease}';document.head.appendChild(st)}
    cargarMedico();
}

function medNav(n,b){
    document.querySelectorAll('.med-sec').forEach(function(s){s.classList.remove('active')});
    document.querySelectorAll('#med-tabs .tab').forEach(function(t){t.classList.remove('active')});
    document.getElementById('med-'+n).classList.add('active');
    if(b)b.classList.add('active');
}

async function cargarMedico(){
    var selTeam=document.getElementById('med-fil-team');
    if(selTeam&&selTeam.options.length<=1){selTeam.innerHTML='<option value="">Todos</option>'+equipos.map(function(e){return'<option value="'+e.id+'">'+e.name+'</option>'}).join('')}
    await cargarMedTeamPlayers();
    await Promise.all([cargarMedLesiones(),cargarMedSesiones(),cargarMedPruebas(),cargarMedRevisiones(),cargarMedStaff()]);
    actualizarStatsMed();
}
var _medTeamPlayers={};
async function cargarMedTeamPlayers(){
    var{data}=await SB.from('club_player_seasons').select('player_id,team_id').eq('club_id',CI);
    _medTeamPlayers={};
    (data||[]).forEach(function(r){if(!_medTeamPlayers[r.team_id])_medTeamPlayers[r.team_id]={};_medTeamPlayers[r.team_id][r.player_id]=true});
}
function getMedFilters(){
    var team=document.getElementById('med-fil-team')?.value||'';
    var name=(document.getElementById('med-fil-name')?.value||'').toLowerCase().trim();
    var status=document.getElementById('med-fil-status')?.value||'';
    return{team:team,name:name,status:status};
}
function medFiltrar(items){
    var f=getMedFilters();
    return items.filter(function(item){
        var j=item.club_players||{};
        if(f.name&&j.name&&j.name.toLowerCase().indexOf(f.name)===-1)return false;
        if(f.status&&item.status&&item.status!==f.status)return false;
        if(f.team&&_medTeamPlayers[f.team]&&!_medTeamPlayers[f.team][item.player_id])return false;
        return true;
    });
}

// ===== STATS =====
async function actualizarStatsMed(){
    var{data:act}=await SB.from('club_player_medical').select('id',{count:'exact'}).eq('status','activa').in('type',['lesion','intervencion']);
    var{data:readapt}=await SB.from('club_player_medical').select('id',{count:'exact'}).eq('status','en_readaptacion');
    var{data:rev}=await SB.from('club_medical_reviews').select('id',{count:'exact'}).eq('status','pendiente');
    var hoy=new Date().toISOString().split('T')[0];
    var{data:sesHoy}=await SB.from('club_medical_sessions').select('id',{count:'exact'}).eq('date',hoy);
    document.getElementById('sm-activas').textContent=(act||[]).length;
    document.getElementById('sm-readapt').textContent=(readapt||[]).length;
    document.getElementById('sm-rev').textContent=(rev||[]).length;
    document.getElementById('sm-hoy').textContent=(sesHoy||[]).length;
}

// ===== LESIONES =====
// ===== BODY MAP =====
var _bodyChart=null,_bodyChartBack=null,_selectedZone=null;
var BODY_MAP_IDS={
    'cabeza':['head','head-back','face'],'nuca':['head-back','nape'],'cervical':['neck-right','neck-left','nape'],'cuello':['neck-right','neck-left','nape'],
    'hombro izquierdo':['shoulder-front-left','shoulder-side-left','deltoid-rear-left'],'hombro derecho':['shoulder-front-right','shoulder-side-right','deltoid-rear-right'],'hombro':['shoulder-front-left','shoulder-front-right','shoulder-side-left','shoulder-side-right'],
    'trapecio':['traps-upper-left','traps-upper-right','traps-mid-left','traps-mid-right'],'trapecio izquierdo':['traps-upper-left','traps-mid-left','traps-lower-left'],'trapecio derecho':['traps-upper-right','traps-mid-right','traps-lower-right'],
    'pecho':['chest-upper-left','chest-upper-right','chest-lower-left','chest-lower-right'],
    'costillas':['obliques-left','obliques-right','serratus-anterior-left','serratus-anterior-right'],'abdomen':['abs-upper-left','abs-upper-right','abs-lower-left','abs-lower-right'],
    'biceps izquierdo':['biceps-left'],'biceps derecho':['biceps-right'],'biceps':['biceps-left','biceps-right'],
    'triceps izquierdo':['triceps-long-left','triceps-lateral-left'],'triceps derecho':['triceps-long-right','triceps-lateral-right'],
    'antebrazo izquierdo':['forearm-left','forearm-flexors-left','forearm-extensors-left'],'antebrazo derecho':['forearm-right','forearm-flexors-right','forearm-extensors-right'],
    'muneca izquierda':['hand-left','hand-back-left'],'muneca derecha':['hand-right','hand-back-right'],'mano izquierda':['hand-left','hand-back-left'],'mano derecha':['hand-right','hand-back-right'],
    'dorsal':['lats-upper-left','lats-upper-right','lats-mid-left','lats-mid-right'],'espalda':['lats-upper-left','lats-upper-right','lats-mid-left','lats-mid-right','lats-lower-left','lats-lower-right','lower-back-erectors-left','lower-back-erectors-right'],
    'lumbar':['lower-back-erectors-left','lower-back-erectors-right','lower-back-ql-left','lower-back-ql-right'],'zona lumbar':['lower-back-erectors-left','lower-back-erectors-right','lower-back-ql-left','lower-back-ql-right'],
    'gluteo izquierdo':['gluteus-maximus-left','gluteus-medius-left'],'gluteo derecho':['gluteus-maximus-right','gluteus-medius-right'],'gluteo':['gluteus-maximus-left','gluteus-maximus-right','gluteus-medius-left','gluteus-medius-right'],
    'cadera izquierda':['hip-flexor-left','gluteus-medius-left'],'cadera derecha':['hip-flexor-right','gluteus-medius-right'],'cadera':['hip-flexor-left','hip-flexor-right'],
    'ingle':['adductors-left','adductors-right','hip-flexor-left','hip-flexor-right'],'aductor izquierdo':['adductors-left'],'aductor derecho':['adductors-right'],'aductores':['adductors-left','adductors-right'],
    'cuadriceps izquierdo':['quads-left'],'cuadriceps derecho':['quads-right'],'cuadriceps':['quads-left','quads-right'],
    'isquiotibial izquierdo':['hamstrings-medial-left','hamstrings-lateral-left'],'isquiotibial derecho':['hamstrings-medial-right','hamstrings-lateral-right'],'isquiotibiales':['hamstrings-medial-left','hamstrings-lateral-left','hamstrings-medial-right','hamstrings-lateral-right'],
    'muslo izquierdo':['quads-left','hamstrings-medial-left','hamstrings-lateral-left'],'muslo derecho':['quads-right','hamstrings-medial-right','hamstrings-lateral-right'],
    'rodilla izquierda':['knee-left','knee-back-left'],'rodilla derecha':['knee-right','knee-back-right'],'rodilla':['knee-left','knee-right','knee-back-left','knee-back-right'],
    'tibial izquierdo':['tibialis-anterior-left'],'tibial derecho':['tibialis-anterior-right'],'espinilla':['tibialis-anterior-left','tibialis-anterior-right'],
    'gemelo izquierdo':['calves-gastroc-medial-left','calves-gastroc-lateral-left'],'gemelo derecho':['calves-gastroc-medial-right','calves-gastroc-lateral-right'],'gemelos':['calves-gastroc-medial-left','calves-gastroc-lateral-left','calves-gastroc-medial-right','calves-gastroc-lateral-right'],
    'soleo izquierdo':['calves-soleus-left'],'soleo derecho':['calves-soleus-right'],
    'tobillo izquierdo':['foot-left','foot-back-left'],'tobillo derecho':['foot-right','foot-back-right'],'tobillo':['foot-left','foot-right','foot-back-left','foot-back-right'],
    'aquiles izquierdo':['calves-soleus-left','foot-back-left'],'aquiles derecho':['calves-soleus-right','foot-back-right'],'tendon de aquiles':['calves-soleus-left','calves-soleus-right'],
    'pie izquierdo':['foot-left','foot-back-left'],'pie derecho':['foot-right','foot-back-right'],'pie':['foot-left','foot-right','foot-back-left','foot-back-right'],
    'planta izquierda':['foot-left','foot-back-left'],'planta derecha':['foot-right','foot-back-right']
};

var MUSCLE_NAMES_ES={
    'head':'Cabeza','neck':'Cuello','trapezius-left':'Trapecio izq.','trapezius-right':'Trapecio der.',
    'deltoid-left':'Hombro izq.','deltoid-right':'Hombro der.',
    'chest-upper-left':'Pectoral sup. izq.','chest-upper-right':'Pectoral sup. der.','chest-lower-left':'Pectoral inf. izq.','chest-lower-right':'Pectoral inf. der.',
    'biceps-left':'Biceps izq.','biceps-right':'Biceps der.','triceps-left':'Triceps izq.','triceps-right':'Triceps der.',
    'forearm-left':'Antebrazo izq.','forearm-right':'Antebrazo der.','hand-left':'Mano izq.','hand-right':'Mano der.',
    'abs-upper':'Abdomen superior','abs-lower':'Abdomen inferior','obliques-left':'Oblicuo izq.','obliques-right':'Oblicuo der.',
    'upper-back-left':'Dorsal izq.','upper-back-right':'Dorsal der.','lower-back-left':'Lumbar izq.','lower-back-right':'Lumbar der.',
    'gluteal-left':'Gluteo izq.','gluteal-right':'Gluteo der.','hip-left':'Cadera izq.','hip-right':'Cadera der.',
    'adductor-left':'Aductor izq.','adductor-right':'Aductor der.',
    'quadriceps-left':'Cuadriceps izq.','quadriceps-right':'Cuadriceps der.',
    'hamstring-left':'Isquiotibial izq.','hamstring-right':'Isquiotibial der.',
    'knee-left':'Rodilla izq.','knee-right':'Rodilla der.',
    'shin-left':'Tibial izq.','shin-right':'Tibial der.','calf-left':'Gemelo izq.','calf-right':'Gemelo der.',
    'achilles-left':'Aquiles izq.','achilles-right':'Aquiles der.',
    'ankle-left':'Tobillo izq.','ankle-right':'Tobillo der.','foot-left':'Pie izq.','foot-right':'Pie der.'
};
function muscleNameES(id,fallback){return MUSCLE_NAMES_ES[id]||fallback||id}
function bodyPartToMuscleIds(bodyPart){
    if(!bodyPart)return[];
    var bp=bodyPart.toLowerCase().trim();
    if(BODY_MAP_IDS[bp])return BODY_MAP_IDS[bp];
    var found=[];
    Object.keys(BODY_MAP_IDS).forEach(function(k){if(bp.indexOf(k)!==-1||k.indexOf(bp)!==-1)found=found.concat(BODY_MAP_IDS[k])});
    return[...new Set(found)];
}

function buildBodyState(lesiones){
    var state={};
    var statusIntensity={activa:9,en_tratamiento:6,en_readaptacion:4,alta:1,derivada:7};
    lesiones.forEach(function(m){
        var ids=bodyPartToMuscleIds(m.body_part);
        var intensity=statusIntensity[m.status]||5;
        ids.forEach(function(id){
            if(!state[id]||state[id].intensity<intensity){
                state[id]={intensity:intensity,selected:false,_injury:m};
            }
        });
    });
    return state;
}

function initBodyMap(containerId,lesiones){
    var container=document.getElementById(containerId);
    if(!container||typeof BodyMuscles==='undefined')return;
    container.innerHTML='<div style="display:flex;gap:16px;align-items:flex-start"><div id="bm-front" style="flex:1;min-width:0"></div><div id="bm-back" style="flex:1;min-width:0"></div></div>';
    var bs=buildBodyState(lesiones);
    var BC=BodyMuscles.BodyChart,VS=BodyMuscles.ViewSide;
    if(_bodyChart){try{_bodyChart.destroy()}catch(e){}}
    if(_bodyChartBack){try{_bodyChartBack.destroy()}catch(e){}}
    _bodyChart=new BC(document.getElementById('bm-front'),{view:VS.FRONT,bodyState:bs,showViewLabel:false,onMuscleClick:function(id,name){onBodyClick(id,name,lesiones)}});
    _bodyChartBack=new BC(document.getElementById('bm-back'),{view:VS.BACK,bodyState:bs,showViewLabel:false,onMuscleClick:function(id,name){onBodyClick(id,name,lesiones)}});
    setTimeout(function(){document.querySelectorAll('#bm-front path[data-muscle-id], #bm-back path[data-muscle-id], #bm-front [role="button"], #bm-back [role="button"]').forEach(function(el){var id=el.getAttribute('data-muscle-id')||el.getAttribute('aria-label')||'';var es=MUSCLE_NAMES_ES[id];if(es){el.setAttribute('title',es);el.setAttribute('aria-label',es)}else{var t=el.getAttribute('title')||'';Object.keys(MUSCLE_NAMES_ES).forEach(function(k){if(t.toLowerCase().indexOf(k.replace(/-/g,' '))!==-1||t.toLowerCase().indexOf(MUSCLE_NAMES_ES[k].toLowerCase())!==-1)el.setAttribute('title',MUSCLE_NAMES_ES[k])})}})},200);
}

function onBodyClick(muscleId,muscleName,lesiones){
    muscleName=muscleNameES(muscleId,muscleName);
    var matches=lesiones.filter(function(m){
        var ids=bodyPartToMuscleIds(m.body_part);
        return ids.indexOf(muscleId)!==-1;
    });
    var panel=document.getElementById('bm-detail');
    if(!panel)return;
    if(!matches.length){
        panel.innerHTML='<div style="padding:12px;font-size:12px;color:var(--ts2)"><strong style="color:var(--tp)">'+muscleName+'</strong><p style="margin:6px 0">Sin lesiones en esta zona.</p><button class="btn btn-primary btn-sm" onclick="abrirMedLesion({body_part:\''+muscleName+'\'})">+ Registrar lesion aqui</button></div>';
        return;
    }
    var h='<div style="padding:12px"><div style="font-size:13px;font-weight:600;color:var(--tp);margin-bottom:8px">'+muscleName+' ('+matches.length+' lesion'+(matches.length>1?'es':'')+')</div>';
    matches.forEach(function(m){
        var j=m.club_players||{};
        var stColor=m.status==='activa'?'badge-red':m.status==='en_tratamiento'?'badge-amber':m.status==='en_readaptacion'?'badge-purple':'badge-green';
        h+='<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">';
        h+='<div style="font-weight:600;color:var(--accent)">'+(j.name||'?')+'</div>';
        h+='<div>'+m.description+' <span class="badge '+stColor+'" style="font-size:10px">'+(m.status||'').replace(/_/g,' ')+'</span></div>';
        h+='<div style="color:var(--ts2)">'+m.date_start+(m.date_end?' → '+m.date_end:'')+(m.days_out?' | '+m.days_out+' dias':'')+'</div>';
        h+='</div>';
    });
    h+='<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="abrirMedLesion({body_part:\''+muscleName+'\'})">+ Nueva lesion</button></div>';
    panel.innerHTML=h;
}

async function cargarMedLesiones(){
    var{data}=await SB.from('club_player_medical').select('*,club_players(name,photo_url)').order('date_start',{ascending:false}).limit(50);
    var _allLesiones=data||[];medicoLesiones=medFiltrar(_allLesiones);
    var el=document.getElementById('med-lesiones');
    el.innerHTML='<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Mapa corporal</h3></div><div class="card-body"><div style="display:grid;grid-template-columns:1fr 280px;gap:16px"><div id="bm-container"></div><div id="bm-detail" style="background:var(--bg-deep);border-radius:var(--rs);min-height:200px"><div style="padding:12px;font-size:12px;color:var(--ts2)">Haz clic en una zona del cuerpo para ver las lesiones</div></div></div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Lesiones y registros medicos</h3><button class="btn btn-primary" onclick="abrirMedLesion()">+ Nueva lesion</button></div><div class="card-body">' +
        (medicoLesiones.length?'<table class="tbl"><thead><tr><th></th><th>Jugador</th><th>Tipo</th><th>Descripcion</th><th>Fecha</th><th>Estado</th><th>Fase</th><th></th></tr></thead><tbody>' +
        medicoLesiones.map(function(m){
            var j=m.club_players||{};
            var stColor=m.status==='activa'?'badge-red':m.status==='en_tratamiento'?'badge-amber':m.status==='en_readaptacion'?'badge-purple':m.status==='alta'?'badge-green':'badge-gray';
            return'<tr><td>'+avt(j.photo_url,j.name,'avatar-sm')+'</td>' +
                '<td><span class="tnl" onclick="verJugador(\''+m.player_id+'\',\'club\')">'+(j.name||'?')+'</span></td>' +
                '<td><span class="badge badge-blue">'+m.type+'</span></td>' +
                '<td style="font-size:12px">'+m.description+'</td>' +
                '<td style="font-size:12px;color:var(--ts2)">'+m.date_start+(m.date_end?' → '+m.date_end:'')+'</td>' +
                '<td><span class="badge '+stColor+'">'+(m.status||'activa').replace(/_/g,' ')+'</span></td>' +
                '<td style="font-size:11px;color:var(--ts2)">'+(m.recovery_phase?m.recovery_phase.replace(/_/g,' '):'—')+'</td>' +
                '<td><div class="row-actions"><button class="btn btn-secondary btn-sm" onclick="editarMedLesion(\''+m.id+'\')">Editar</button></div></td></tr>'
        }).join('')+'</tbody></table>':'<div class="empty"><p>Sin registros medicos</p></div>') +
        '</div></div>';
    setTimeout(function(){initBodyMap('bm-container',_allLesiones)},100);
}

function abrirMedLesion(data){
    var d=data||{};
    var html='<div class="modal-bg open" id="m-medles"><div class="modal" style="max-width:700px"><div class="modal-head"><h3>'+(d.id?'Editar':'Nueva lesion')+'</h3><button class="modal-close" onclick="document.getElementById(\'m-medles\').remove()">&times;</button></div><div class="modal-body">' +
        '<input type="hidden" id="ml-id" value="'+(d.id||'')+'">' +
        '<div class="fr"><div class="fg"><label>Jugador *</label><select id="ml-player">'+jugadoresClub.map(function(j){return'<option value="'+j.id+'"'+(d.player_id===j.id?' selected':'')+'>'+j.name+'</option>'}).join('')+'</select></div><div class="fg"><label>Tipo *</label><select id="ml-type"><option value="lesion"'+(d.type==='lesion'?' selected':'')+'>Lesion</option><option value="enfermedad"'+(d.type==='enfermedad'?' selected':'')+'>Enfermedad</option><option value="revision"'+(d.type==='revision'?' selected':'')+'>Revision</option><option value="intervencion"'+(d.type==='intervencion'?' selected':'')+'>Intervencion</option><option value="rehabilitacion"'+(d.type==='rehabilitacion'?' selected':'')+'>Rehabilitacion</option></select></div></div>' +
        '<div class="fg"><label>Descripcion *</label><input id="ml-desc" value="'+(d.description||'')+'"></div>' +
        '<div class="fr3"><div class="fg"><label>Gravedad</label><select id="ml-sev"><option value="">—</option><option value="leve"'+(d.severity==='leve'?' selected':'')+'>Leve</option><option value="moderada"'+(d.severity==='moderada'?' selected':'')+'>Moderada</option><option value="grave"'+(d.severity==='grave'?' selected':'')+'>Grave</option></select></div><div class="fg"><label>Zona corporal</label><input id="ml-body" value="'+(d.body_part||'')+'"></div><div class="fg"><label>Mecanismo</label><input id="ml-mech" value="'+(d.injury_mechanism||'')+'" placeholder="Giro, choque, sobrecarga..."></div></div>' +
        '<div class="fr3"><div class="fg"><label>Fecha inicio *</label><input type="date" id="ml-start" value="'+(d.date_start||new Date().toISOString().split('T')[0])+'"></div><div class="fg"><label>Fecha fin</label><input type="date" id="ml-end" value="'+(d.date_end||'')+'"></div><div class="fg"><label>Dias baja</label><input type="number" id="ml-days" value="'+(d.days_out||'')+'"></div></div>' +
        '<div class="fr3"><div class="fg"><label>Estado</label><select id="ml-status"><option value="activa"'+(d.status==='activa'?' selected':'')+'>Activa</option><option value="en_tratamiento"'+(d.status==='en_tratamiento'?' selected':'')+'>En tratamiento</option><option value="en_readaptacion"'+(d.status==='en_readaptacion'?' selected':'')+'>En readaptacion</option><option value="alta"'+(d.status==='alta'?' selected':'')+'>Alta</option><option value="derivada"'+(d.status==='derivada'?' selected':'')+'>Derivada</option></select></div><div class="fg"><label>Fase recuperacion</label><select id="ml-phase"><option value="">—</option><option value="reposo"'+(d.recovery_phase==='reposo'?' selected':'')+'>Reposo</option><option value="fisioterapia"'+(d.recovery_phase==='fisioterapia'?' selected':'')+'>Fisioterapia</option><option value="gimnasio"'+(d.recovery_phase==='gimnasio'?' selected':'')+'>Gimnasio</option><option value="campo_individual"'+(d.recovery_phase==='campo_individual'?' selected':'')+'>Campo individual</option><option value="campo_parcial"'+(d.recovery_phase==='campo_parcial'?' selected':'')+'>Campo parcial</option><option value="campo_completo"'+(d.recovery_phase==='campo_completo'?' selected':'')+'>Campo completo</option><option value="competicion"'+(d.recovery_phase==='competicion'?' selected':'')+'>Competicion</option></select></div><div class="fg"><label>Recidiva</label><select id="ml-rec"><option value="false">No</option><option value="true"'+(d.recurrence?' selected':'')+'>Si</option></select></div></div>' +
        '<div class="fr3"><div class="fg"><label>Vuelta prevista</label><input type="date" id="ml-ret" value="'+(d.return_date||'')+'"></div><div class="fg"><label>Vuelta real</label><input type="date" id="ml-retact" value="'+(d.actual_return_date||'')+'"></div><div class="fg"><label>Vuelta competicion</label><input type="date" id="ml-retcomp" value="'+(d.competition_return_date||'')+'"></div></div>' +
        '<div class="fr"><div class="fg"><label>Registrado por</label><input id="ml-by" value="'+(d.registered_by||'')+'"></div><div class="fg"><label>Rol</label><select id="ml-staff"><option value="medico">Medico</option><option value="fisio"'+(d.staff_type==='fisio'?' selected':'')+'>Fisio</option><option value="readaptador"'+(d.staff_type==='readaptador'?' selected':'')+'>Readaptador</option></select></div></div>' +
        '<div class="fg"><label>Tratamiento</label><textarea id="ml-treat">'+(d.treatment||'')+'</textarea></div>' +
        '<div class="fg"><label>Notas</label><textarea id="ml-notes">'+(d.notes||'')+'</textarea></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-medles\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarMedLesion()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function editarMedLesion(id){
    var les=medicoLesiones.find(function(m){return m.id===id});
    if(les)abrirMedLesion(les);
}

async function guardarMedLesion(){
    var id=document.getElementById('ml-id').value;
    var obj={
        player_id:document.getElementById('ml-player').value,
        type:document.getElementById('ml-type').value,
        description:document.getElementById('ml-desc').value.trim(),
        severity:document.getElementById('ml-sev').value||null,
        body_part:document.getElementById('ml-body').value.trim()||null,
        injury_mechanism:document.getElementById('ml-mech').value.trim()||null,
        date_start:document.getElementById('ml-start').value,
        date_end:document.getElementById('ml-end').value||null,
        days_out:parseInt(document.getElementById('ml-days').value)||null,
        status:document.getElementById('ml-status').value,
        recovery_phase:document.getElementById('ml-phase').value||null,
        recurrence:document.getElementById('ml-rec').value==='true',
        return_date:document.getElementById('ml-ret').value||null,
        actual_return_date:document.getElementById('ml-retact').value||null,
        competition_return_date:document.getElementById('ml-retcomp').value||null,
        registered_by:document.getElementById('ml-by').value.trim()||null,
        staff_type:document.getElementById('ml-staff').value,
        treatment:document.getElementById('ml-treat').value.trim()||null,
        notes:document.getElementById('ml-notes').value.trim()||null
    };
    if(!obj.description||!obj.date_start){toast('Descripcion y fecha obligatorios');return}
    var r;
    if(id)r=await SB.from('club_player_medical').update(obj).eq('id',id);
    else r=await SB.from('club_player_medical').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-medles')?.remove();toast('OK');await cargarMedLesiones();actualizarStatsMed();
}

// ===== SESIONES =====
async function cargarMedSesiones(){
    var{data}=await SB.from('club_medical_sessions').select('*,club_players(name,photo_url)').order('date',{ascending:false}).limit(50);
    medicoSesiones=medFiltrar(data||[]);
    var el=document.getElementById('med-sesiones');
    el.innerHTML='<div class="card"><div class="card-head"><h3>Sesiones de tratamiento</h3><button class="btn btn-primary" onclick="abrirMedSesion()">+ Nueva sesion</button></div><div class="card-body">' +
        (medicoSesiones.length?'<table class="tbl"><thead><tr><th></th><th>Jugador</th><th>Tipo</th><th>Profesional</th><th>Fecha</th><th>Dolor</th><th>Duracion</th><th></th></tr></thead><tbody>' +
        medicoSesiones.map(function(s){
            var j=s.club_players||{};
            return'<tr><td>'+avt(j.photo_url,j.name,'avatar-sm')+'</td>' +
                '<td style="font-size:12px;font-weight:600">'+(j.name||'?')+'</td>' +
                '<td><span class="badge badge-blue">'+s.type+'</span></td>' +
                '<td style="font-size:12px">'+(s.professional||'—')+'</td>' +
                '<td style="font-size:12px;color:var(--ts2)">'+s.date+'</td>' +
                '<td style="font-size:12px">'+(s.pain_level_before!=null?s.pain_level_before+'→'+s.pain_level_after:'—')+'</td>' +
                '<td style="font-size:12px">'+(s.duration_minutes?s.duration_minutes+'min':'—')+'</td>' +
                '<td><div class="row-actions"><button class="btn btn-danger btn-sm" onclick="eliminarMedReg(\'club_medical_sessions\',\''+s.id+'\')">X</button></div></td></tr>'
        }).join('')+'</tbody></table>':'<div class="empty"><p>Sin sesiones</p></div>') +
        '</div></div>';
}

function abrirMedSesion(){
    var html='<div class="modal-bg open" id="m-medses"><div class="modal" style="max-width:700px"><div class="modal-head"><h3>Nueva sesion</h3><button class="modal-close" onclick="document.getElementById(\'m-medses\').remove()">&times;</button></div><div class="modal-body">' +
        '<div class="fr"><div class="fg"><label>Jugador *</label><select id="ms-player">'+jugadoresClub.map(function(j){return'<option value="'+j.id+'">'+j.name+'</option>'}).join('')+'</select></div><div class="fg"><label>Fecha *</label><input type="date" id="ms-date" value="'+new Date().toISOString().split('T')[0]+'"></div></div>' +
        '<div class="fr3"><div class="fg"><label>Tipo *</label><select id="ms-type"><option value="fisioterapia">Fisioterapia</option><option value="masaje">Masaje</option><option value="readaptacion">Readaptacion</option><option value="revision">Revision</option><option value="valoracion">Valoracion</option><option value="otro">Otro</option></select></div><div class="fg"><label>Profesional</label><input id="ms-prof"></div><div class="fg"><label>Rol</label><select id="ms-staff"><option value="fisio">Fisio</option><option value="masajista">Masajista</option><option value="readaptador">Readaptador</option><option value="medico">Medico</option></select></div></div>' +
        '<div class="fr"><div class="fg"><label>Duracion (min)</label><input type="number" id="ms-dur"></div><div class="fg"><label>Zona</label><input id="ms-body"></div></div>' +
        '<div class="fg"><label>Descripcion</label><textarea id="ms-desc" placeholder="Que se hizo en la sesion"></textarea></div>' +
        '<div class="fg"><label>Tecnicas</label><input id="ms-tech" placeholder="Cyriax, ultrasonidos, TENS..."></div>' +
        '<div class="fr"><div class="fg"><label>Dolor antes (0-10)</label><input type="number" id="ms-pain1" min="0" max="10"></div><div class="fg"><label>Dolor despues (0-10)</label><input type="number" id="ms-pain2" min="0" max="10"></div></div>' +
        '<div class="fg"><label>Movilidad / rango articular</label><input id="ms-mob"></div>' +
        '<div class="fsec">Readaptacion (si aplica)</div>' +
        '<div class="fr3"><div class="fg"><label>Tipo ejercicio</label><select id="ms-extype"><option value="">—</option><option value="gimnasio">Gimnasio</option><option value="carrera">Carrera</option><option value="campo">Campo</option><option value="especifico">Especifico</option></select></div><div class="fg"><label>Intensidad</label><select id="ms-intens"><option value="">—</option><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div><div class="fg"><label>Min. de carga</label><input type="number" id="ms-load"></div></div>' +
        '<div class="fg"><label>Feedback del jugador</label><textarea id="ms-feedback"></textarea></div>' +
        '<div class="fg"><label>Notas proxima sesion</label><textarea id="ms-next"></textarea></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-medses\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarMedSesion()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function guardarMedSesion(){
    var obj={player_id:document.getElementById('ms-player').value,date:document.getElementById('ms-date').value,type:document.getElementById('ms-type').value,professional:document.getElementById('ms-prof').value.trim()||null,staff_type:document.getElementById('ms-staff').value,duration_minutes:parseInt(document.getElementById('ms-dur').value)||null,body_area:document.getElementById('ms-body').value.trim()||null,description:document.getElementById('ms-desc').value.trim()||null,techniques:document.getElementById('ms-tech').value.trim()||null,pain_level_before:parseInt(document.getElementById('ms-pain1').value)||null,pain_level_after:parseInt(document.getElementById('ms-pain2').value)||null,mobility_notes:document.getElementById('ms-mob').value.trim()||null,exercise_type:document.getElementById('ms-extype').value||null,intensity:document.getElementById('ms-intens').value||null,load_minutes:parseInt(document.getElementById('ms-load').value)||null,player_feedback:document.getElementById('ms-feedback').value.trim()||null,next_session_notes:document.getElementById('ms-next').value.trim()||null};
    if(!obj.date){toast('Fecha obligatoria');return}
    var r=await SB.from('club_medical_sessions').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-medses')?.remove();toast('OK');await cargarMedSesiones();actualizarStatsMed();
}

// ===== PRUEBAS =====
async function cargarMedPruebas(){
    var{data}=await SB.from('club_medical_tests').select('*,club_players(name,photo_url)').order('date',{ascending:false}).limit(50);
    var pruebas=data||[];
    var el=document.getElementById('med-pruebas');
    el.innerHTML='<div class="card"><div class="card-head"><h3>Pruebas medicas</h3><button class="btn btn-primary" onclick="abrirMedPrueba()">+ Nueva prueba</button></div><div class="card-body">' +
        (pruebas.length?'<table class="tbl"><thead><tr><th></th><th>Jugador</th><th>Tipo</th><th>Zona</th><th>Fecha</th><th>Centro</th><th>Estado</th><th></th></tr></thead><tbody>' +
        pruebas.map(function(p){var j=p.club_players||{};return'<tr><td>'+avt(j.photo_url,j.name,'avatar-sm')+'</td><td style="font-size:12px;font-weight:600">'+(j.name||'?')+'</td><td><span class="badge badge-blue">'+p.type+'</span></td><td style="font-size:12px">'+(p.body_area||'—')+'</td><td style="font-size:12px">'+p.date+'</td><td style="font-size:12px">'+(p.clinic||'—')+'</td><td><span class="badge '+(p.status==='realizada'?'badge-green':p.status==='informada'?'badge-blue':'badge-amber')+'">'+p.status+'</span></td><td><div class="row-actions"><button class="btn btn-danger btn-sm" onclick="eliminarMedReg(\'club_medical_tests\',\''+p.id+'\')">X</button></div></td></tr>'}).join('')+'</tbody></table>':'<div class="empty"><p>Sin pruebas</p></div>') +
        '</div></div>';
}

function abrirMedPrueba(){
    var html='<div class="modal-bg open" id="m-medtest"><div class="modal"><div class="modal-head"><h3>Nueva prueba</h3><button class="modal-close" onclick="document.getElementById(\'m-medtest\').remove()">&times;</button></div><div class="modal-body">' +
        '<div class="fr"><div class="fg"><label>Jugador *</label><select id="mt-player">'+jugadoresClub.map(function(j){return'<option value="'+j.id+'">'+j.name+'</option>'}).join('')+'</select></div><div class="fg"><label>Fecha *</label><input type="date" id="mt-date" value="'+new Date().toISOString().split('T')[0]+'"></div></div>' +
        '<div class="fr3"><div class="fg"><label>Tipo *</label><select id="mt-type"><option value="radiografia">Radiografia</option><option value="resonancia">Resonancia</option><option value="ecografia">Ecografia</option><option value="analitica">Analitica</option><option value="electrocardiograma">ECG</option><option value="otro">Otro</option></select></div><div class="fg"><label>Zona</label><input id="mt-body"></div><div class="fg"><label>Urgencia</label><select id="mt-urg"><option value="normal">Normal</option><option value="urgente">Urgente</option></select></div></div>' +
        '<div class="fr"><div class="fg"><label>Centro/clinica</label><input id="mt-clinic"></div><div class="fg"><label>Profesional</label><input id="mt-prof"></div></div>' +
        '<div class="fg"><label>Resultado</label><textarea id="mt-result"></textarea></div>' +
        '<div class="fg"><label>Estado</label><select id="mt-status"><option value="pendiente">Pendiente</option><option value="realizada">Realizada</option><option value="informada">Informada</option></select></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-medtest\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarMedPrueba()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function guardarMedPrueba(){
    var obj={player_id:document.getElementById('mt-player').value,date:document.getElementById('mt-date').value,type:document.getElementById('mt-type').value,body_area:document.getElementById('mt-body').value.trim()||null,urgency:document.getElementById('mt-urg').value,clinic:document.getElementById('mt-clinic').value.trim()||null,professional:document.getElementById('mt-prof').value.trim()||null,result:document.getElementById('mt-result').value.trim()||null,status:document.getElementById('mt-status').value};
    if(!obj.date){toast('Fecha obligatoria');return}
    var r=await SB.from('club_medical_tests').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-medtest')?.remove();toast('OK');await cargarMedPruebas();
}

// ===== REVISIONES =====
async function cargarMedRevisiones(){
    var{data}=await SB.from('club_medical_reviews').select('*,club_players(name,photo_url)').order('scheduled_date',{ascending:false}).limit(50);
    var revs=data||[];
    var el=document.getElementById('med-revisiones');
    el.innerHTML='<div class="card"><div class="card-head"><h3>Revisiones medicas</h3><button class="btn btn-primary" onclick="abrirMedRevision()">+ Nueva revision</button></div><div class="card-body">' +
        (revs.length?'<table class="tbl"><thead><tr><th></th><th>Jugador</th><th>Tipo</th><th>Programada</th><th>Estado</th><th>Resultado</th><th></th></tr></thead><tbody>' +
        revs.map(function(r){var j=r.club_players||{};return'<tr><td>'+avt(j.photo_url,j.name,'avatar-sm')+'</td><td style="font-size:12px;font-weight:600">'+(j.name||'?')+'</td><td><span class="badge badge-blue">'+r.type+'</span></td><td style="font-size:12px">'+(r.scheduled_date||'—')+'</td><td><span class="badge '+(r.status==='completada'?'badge-green':r.status==='vencida'?'badge-red':'badge-amber')+'">'+r.status+'</span></td><td style="font-size:12px">'+(r.result||'—')+'</td><td><div class="row-actions"><button class="btn btn-danger btn-sm" onclick="eliminarMedReg(\'club_medical_reviews\',\''+r.id+'\')">X</button></div></td></tr>'}).join('')+'</tbody></table>':'<div class="empty"><p>Sin revisiones</p></div>') +
        '</div></div>';
}

function abrirMedRevision(){
    var html='<div class="modal-bg open" id="m-medrev"><div class="modal"><div class="modal-head"><h3>Nueva revision</h3><button class="modal-close" onclick="document.getElementById(\'m-medrev\').remove()">&times;</button></div><div class="modal-body">' +
        '<div class="fr"><div class="fg"><label>Jugador *</label><select id="mr-player">'+jugadoresClub.map(function(j){return'<option value="'+j.id+'">'+j.name+'</option>'}).join('')+'</select></div><div class="fg"><label>Tipo</label><select id="mr-type"><option value="anual">Anual</option><option value="pretemporada">Pretemporada</option><option value="especial">Especial</option></select></div></div>' +
        '<div class="fr"><div class="fg"><label>Fecha programada</label><input type="date" id="mr-sched"></div><div class="fg"><label>Fecha realizada</label><input type="date" id="mr-done"></div></div>' +
        '<div class="fr"><div class="fg"><label>Estado</label><select id="mr-status"><option value="pendiente">Pendiente</option><option value="completada">Completada</option><option value="vencida">Vencida</option></select></div><div class="fg"><label>Resultado</label><select id="mr-result"><option value="">—</option><option value="apto">Apto</option><option value="apto_con_restricciones">Apto con restricciones</option><option value="no_apto">No apto</option></select></div></div>' +
        '<div class="fg"><label>Restricciones</label><input id="mr-restr"></div>' +
        '<div class="fr"><div class="fg"><label>Profesional</label><input id="mr-prof"></div><div class="fg"><label>Centro</label><input id="mr-clinic"></div></div>' +
        '<div class="fg"><label>Proxima revision</label><input type="date" id="mr-next"></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-medrev\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarMedRevision()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function guardarMedRevision(){
    var obj={player_id:document.getElementById('mr-player').value,type:document.getElementById('mr-type').value,scheduled_date:document.getElementById('mr-sched').value||null,completed_date:document.getElementById('mr-done').value||null,status:document.getElementById('mr-status').value,result:document.getElementById('mr-result').value||null,restrictions:document.getElementById('mr-restr').value.trim()||null,professional:document.getElementById('mr-prof').value.trim()||null,clinic:document.getElementById('mr-clinic').value.trim()||null,next_review_date:document.getElementById('mr-next').value||null,season_name:tempActual()};
    var r=await SB.from('club_medical_reviews').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-medrev')?.remove();toast('OK');await cargarMedRevisiones();actualizarStatsMed();
}

// ===== STAFF MEDICO =====
async function cargarMedStaff(){
    var{data}=await SB.from('club_medical_staff').select('*').eq('club_id',CI).eq('active',true).order('role');
    medicoStaff=data||[];
    var el=document.getElementById('med-staff');
    el.innerHTML='<div class="card"><div class="card-head"><h3>Staff medico</h3><button class="btn btn-primary" onclick="abrirMedStaff()">+ Añadir</button></div><div class="card-body">' +
        (medicoStaff.length?'<table class="tbl"><thead><tr><th>Nombre</th><th>Rol</th><th>Especialidad</th><th>Colegiado</th><th>Tel</th><th>Externo</th><th></th></tr></thead><tbody>' +
        medicoStaff.map(function(s){return'<tr><td><span class="tn">'+s.name+'</span></td><td><span class="badge badge-blue">'+s.role+'</span></td><td style="font-size:12px">'+(s.specialization||'—')+'</td><td style="font-size:12px">'+(s.license_number||'—')+'</td><td style="font-size:12px">'+(s.phone||'—')+'</td><td>'+(s.is_external?'<span class="badge badge-amber">'+(s.clinic_name||'Externo')+'</span>':'<span class="badge badge-green">Interno</span>')+'</td><td><div class="row-actions"><button class="btn btn-danger btn-sm" onclick="eliminarMedReg(\'club_medical_staff\',\''+s.id+'\')">X</button></div></td></tr>'}).join('')+'</tbody></table>':'<div class="empty"><p>Sin staff medico</p></div>') +
        '</div></div>';
}

function abrirMedStaff(){
    var html='<div class="modal-bg open" id="m-medstaff"><div class="modal"><div class="modal-head"><h3>Añadir staff</h3><button class="modal-close" onclick="document.getElementById(\'m-medstaff\').remove()">&times;</button></div><div class="modal-body">' +
        '<div class="fr"><div class="fg"><label>Nombre *</label><input id="mst-name"></div><div class="fg"><label>Rol *</label><select id="mst-role"><option value="medico">Medico</option><option value="fisioterapeuta">Fisioterapeuta</option><option value="masajista">Masajista</option><option value="readaptador">Readaptador</option><option value="nutricionista">Nutricionista</option><option value="psicologo">Psicologo</option></select></div></div>' +
        '<div class="fr"><div class="fg"><label>Especialidad</label><input id="mst-spec" placeholder="Traumatologia deportiva"></div><div class="fg"><label>N. colegiado</label><input id="mst-lic"></div></div>' +
        '<div class="fr"><div class="fg"><label>Telefono</label><input id="mst-phone"></div><div class="fg"><label>Email</label><input id="mst-email"></div></div>' +
        '<div class="fg"><label>Horario</label><input id="mst-sched" placeholder="Lunes a Viernes 9-14"></div>' +
        '<div class="fg"><label>Es externo</label><select id="mst-ext" onchange="document.getElementById(\'mst-clinic-sec\').style.display=this.value===\'true\'?\'block\':\'none\'"><option value="false">No - interno del club</option><option value="true">Si - clinica externa</option></select></div>' +
        '<div id="mst-clinic-sec" style="display:none"><div class="fr"><div class="fg"><label>Clinica</label><input id="mst-cname"></div><div class="fg"><label>Direccion</label><input id="mst-caddr"></div></div><div class="fg"><label>Tel. clinica</label><input id="mst-cphone"></div></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="document.getElementById(\'m-medstaff\').remove()">Cancelar</button><button class="btn btn-success" onclick="guardarMedStaff()">Guardar</button></div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);
}

async function guardarMedStaff(){
    var obj={club_id:CI,name:document.getElementById('mst-name').value.trim(),role:document.getElementById('mst-role').value,specialization:document.getElementById('mst-spec').value.trim()||null,license_number:document.getElementById('mst-lic').value.trim()||null,phone:document.getElementById('mst-phone').value.trim()||null,email:document.getElementById('mst-email').value.trim()||null,schedule:document.getElementById('mst-sched').value.trim()||null,is_external:document.getElementById('mst-ext').value==='true',clinic_name:document.getElementById('mst-cname')?.value?.trim()||null,clinic_address:document.getElementById('mst-caddr')?.value?.trim()||null,clinic_phone:document.getElementById('mst-cphone')?.value?.trim()||null};
    if(!obj.name){toast('Nombre obligatorio');return}
    var r=await SB.from('club_medical_staff').insert(obj);
    if(r.error){toast(r.error.message);return}
    document.getElementById('m-medstaff')?.remove();toast('OK');await cargarMedStaff();
}

// ===== ELIMINAR GENERICO =====
async function eliminarMedReg(tabla,id){
    if(!confirm('Eliminar?'))return;
    await SB.from(tabla).delete().eq('id',id);
    toast('Eliminado');await cargarMedico();
}

console.log('Club Admin Medico cargado');
