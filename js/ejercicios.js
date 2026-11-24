// =============================================
// MÓDULO EJERCICIOS — TopLiderCoach HUB
// v2.0 — Pizarra táctica completa
// =============================================

// ---- COLORES DE EQUIPO ----
const EJ_TEAM_COLORS = {
    blue:      { fill: '#3b82f6', stroke: '#2563eb', name: 'Azul' },
    red:       { fill: '#ef4444', stroke: '#dc2626', name: 'Rojo' },
    yellow:    { fill: '#eab308', stroke: '#ca8a04', name: 'Amarillo' },
    white:     { fill: '#f8fafc', stroke: '#cbd5e1', name: 'Blanco' },
    black:     { fill: '#1e293b', stroke: '#0f172a', name: 'Negro' },
    green:     { fill: '#22c55e', stroke: '#16a34a', name: 'Verde' },
    orange:    { fill: '#f97316', stroke: '#ea580c', name: 'Naranja' },
    purple:    { fill: '#a855f7', stroke: '#9333ea', name: 'Morado' },
    atletico:  { fill: '#ef4444', fill2: '#ffffff', stroke: '#dc2626', name: 'Atlético', striped: true },
    barcelona: { fill: '#a855f7', fill2: '#dc2626', stroke: '#7c3aed', name: 'Barcelona', striped: true },
    milan:     { fill: '#ef4444', fill2: '#1e293b', stroke: '#dc2626', name: 'Milan',    striped: true },
    juventus:  { fill: '#ffffff', fill2: '#1e293b', stroke: '#cbd5e1', name: 'Juventus', striped: true },
    inter:     { fill: '#3b82f6', fill2: '#1e293b', stroke: '#2563eb', name: 'Inter',    striped: true }
};

// ---- FORMACIONES ----
const EJ_FORMATIONS = {
    '4-4-2': [{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
              {x:.40,y:.15},{x:.40,y:.38},{x:.40,y:.62},{x:.40,y:.85},{x:.60,y:.35},{x:.60,y:.65}],
    '4-3-3': [{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
              {x:.38,y:.30},{x:.38,y:.50},{x:.38,y:.70},{x:.58,y:.20},{x:.62,y:.50},{x:.58,y:.80}],
    '3-5-2': [{x:.06,y:.50},{x:.18,y:.25},{x:.18,y:.50},{x:.18,y:.75},
              {x:.35,y:.10},{x:.35,y:.35},{x:.35,y:.50},{x:.35,y:.65},{x:.35,y:.90},{x:.55,y:.35},{x:.55,y:.65}],
    '4-2-3-1':[{x:.06,y:.50},{x:.20,y:.15},{x:.20,y:.38},{x:.20,y:.62},{x:.20,y:.85},
               {x:.35,y:.35},{x:.35,y:.65},{x:.50,y:.15},{x:.50,y:.50},{x:.50,y:.85},{x:.65,y:.50}],
    '5-3-2': [{x:.06,y:.50},{x:.18,y:.10},{x:.18,y:.30},{x:.18,y:.50},{x:.18,y:.70},{x:.18,y:.90},
              {x:.38,y:.25},{x:.38,y:.50},{x:.38,y:.75},{x:.55,y:.35},{x:.55,y:.65}]
};

// ---- COLORES DE LÍNEA ----
const EJ_LINE_COLORS = [
    {c:'#ffffff',n:'Blanco'},{c:'#ef4444',n:'Rojo'},{c:'#3b82f6',n:'Azul'},{c:'#22c55e',n:'Verde'},
    {c:'#eab308',n:'Amarillo'},{c:'#f97316',n:'Naranja'},{c:'#a855f7',n:'Morado'},{c:'#000000',n:'Negro'}
];

// ---- IMÁGENES DE EQUIPAMIENTO (del proyecto FBT) ----


// ---- TIPOS DE EQUIPAMIENTO ----
const EJ_EQUIPMENT_TYPES = [
    { key: 'ball',       name: 'Balón',         w: 40, h: 43 },
    { key: 'cone',       name: 'Cono',           w: 36, h: 40 },
    { key: 'marker',     name: 'Marcador',       w: 36, h: 36 },
    { key: 'stickRed',   name: 'Pica Roja',      w: 28, h: 50 },
    { key: 'stickYellow',name: 'Pica Amarilla',  w: 28, h: 50 },
    { key: 'wall',       name: 'Barrera',        w: 40, h: 42 },
    { key: 'smallGoal',  name: 'Mini Portería',  w: 50, h: 42 },
    { key: 'goalSmall',  name: 'Portería S',     w: 55, h: 46 },
    { key: 'goalMedium', name: 'Portería M',     w: 60, h: 50 },
    { key: 'goalLarge',  name: 'Portería L',     w: 65, h: 55 },
    { key: 'manikin',    name: 'Maniquí',        w: 34, h: 48 },
    { key: 'ladder',     name: 'Escalera',       w: 50, h: 55 },
    { key: 'ringRed',    name: 'Aro Rojo',       w: 44, h: 44 },
    { key: 'ringGreen',  name: 'Aro Verde',      w: 44, h: 44 },
    { key: 'hurdle',     name: 'Valla',          w: 48, h: 42 },
    { key: 'discBlue',   name: 'Disco Azul',     w: 32, h: 32 },
    { key: 'discRed',    name: 'Disco Rojo',     w: 32, h: 32 },
    { key: 'rubberBand', name: 'Banda Elástica', w: 48, h: 30 },
    { key: 'bench',      name: 'Banco',          w: 55, h: 40 },
    { key: 'benchPress', name: 'Press Banca',    w: 50, h: 50 },
    { key: 'dumbbell',   name: 'Mancuerna',      w: 44, h: 44 },
    { key: 'fitball',    name: 'Fitball',        w: 44, h: 44 },
    { key: 'bosu',       name: 'Bosu',           w: 50, h: 36 }
];

// ---- MATERIAL QUE ADMITE COLOR (plano) ----
const EJ_COLORABLE_EQUIP = ['cone','marker','discBlue','discRed','ringRed','ringGreen','stickRed','stickYellow','hurdle'];
const EJ_EQUIP_COLORS = [
    { c: null,      n: 'Original' },
    { c: '#3b82f6', n: 'Azul' },
    { c: '#ef4444', n: 'Rojo' },
    { c: '#eab308', n: 'Amarillo' },
    { c: '#22c55e', n: 'Verde' },
    { c: '#f97316', n: 'Naranja' },
    { c: '#a855f7', n: 'Morado' },
    { c: '#ec4899', n: 'Rosa' },
    { c: '#06b6d4', n: 'Cian' }
];

// ---- IMÁGENES DEL CAMPO ----
const EJ_FIELD_IMAGES = {
    full:  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzFhNmIzMCIvPjxjbGlwUGF0aCBpZD0iZmMiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjZmMpIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI4MyIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iMjEwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjI3NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PHJlY3QgeD0iNDAwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPjxyZWN0IHg9IjQ2NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iNTkwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjY1NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PC9nPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PGxpbmUgeDE9IjQwMCIgeTE9IjE1IiB4Mj0iNDAwIiB5Mj0iNDg1Ii8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iMjUwIiByPSI2NSIvPjxyZWN0IHg9IjIwIiB5PSIxMzMiIHdpZHRoPSIxMDgiIGhlaWdodD0iMjM0Ii8+PHJlY3QgeD0iNjcyIiB5PSIxMzMiIHdpZHRoPSIxMDgiIGhlaWdodD0iMjM0Ii8+PHJlY3QgeD0iMjAiIHk9IjE5NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjExMCIvPjxyZWN0IHg9Ijc0MCIgeT0iMTk1IiB3aWR0aD0iNDAiIGhlaWdodD0iMTEwIi8+PHJlY3QgeD0iMTAiIHk9IjIyMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjYwIi8+PHJlY3QgeD0iNzgwIiB5PSIyMjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI2MCIvPjxwYXRoIGQ9Ik0xMjggMTk5IEE2NSA2NSAwIDAgMSAxMjggMzAxIi8+PHBhdGggZD0iTTY3MiAxOTkgQTY1IDY1IDAgMCAwIDY3MiAzMDEiLz48cGF0aCBkPSJNMjAgMjIgQTcgNyAwIDAgMSAyNyAxNSIvPjxwYXRoIGQ9Ik03NzMgMTUgQTcgNyAwIDAgMSA3ODAgMjIiLz48cGF0aCBkPSJNNzgwIDQ3OCBBNyA3IDAgMCAxIDc3MyA0ODUiLz48cGF0aCBkPSJNMjcgNDg1IEE3IDcgMCAwIDEgMjAgNDc4Ii8+PC9nPjxjaXJjbGUgY3g9IjQwMCIgY3k9IjI1MCIgcj0iMy41IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMjUwIiByPSIzLjUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI3MDAiIGN5PSIyNTAiIHI9IjMuNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPgo=',
   half:  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMxYTZiMzAiLz4KPGNsaXBQYXRoIGlkPSJmaCI+PHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNzYwIiBoZWlnaHQ9IjQ3MCIgcng9IjEiLz48L2NsaXBQYXRoPgo8ZyBjbGlwLXBhdGg9InVybCgjZmgpIj4KPHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjgzIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjIxMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iMjc0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjxyZWN0IHg9IjQwMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz4KPHJlY3QgeD0iNDY0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjU5MCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iNjU0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjwvZz4KPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjwhLS0gRmllbGQgYm91bmRhcnkgLS0+CjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+CjwhLS0gR29hbCAoNy4zMm0gd2lkZSwgYWJvdmUgZmllbGQgbGluZSkgLS0+CjxyZWN0IHg9IjM1OSIgeT0iMiIgd2lkdGg9IjgyIiBoZWlnaHQ9IjEzIi8+CjwhLS0gUGVuYWx0eSBhcmVhICg0MC4zMm0gd2lkZSB4IDE2LjVtIGRlZXApIC0tPgo8cmVjdCB4PSIxNzUiIHk9IjE1IiB3aWR0aD0iNDUwIiBoZWlnaHQ9IjE0OCIvPgo8IS0tIEdvYWwgYXJlYSAoMTguMzJtIHdpZGUgeCA1LjVtIGRlZXApIC0tPgo8cmVjdCB4PSIyOTgiIHk9IjE1IiB3aWR0aD0iMjA0IiBoZWlnaHQ9IjUwIi8+CjwhLS0gUGVuYWx0eSBhcmMgKG9ubHkgcGFydCBvdXRzaWRlIHBlbmFsdHkgYXJlYSwgZWxsaXB0aWNhbCkgLS0+CjxwYXRoIGQ9Ik0zMTkgMTYzIEExMDIgODIgMCAwIDAgNDgxIDE2MyIvPgo8IS0tIENlbnRlciBzZW1pY2lyY2xlIGF0IGJvdHRvbSBsaW5lIC0tPgo8cGF0aCBkPSJNMjk4IDQ4NSBBMTAyIDgyIDAgMCAxIDUwMiA0ODUiLz4KPCEtLSBDb3JuZXIgYXJjcyB0b3AgLS0+CjxwYXRoIGQ9Ik0yMCAyMiBBNyA3IDAgMCAxIDI3IDE1Ii8+CjxwYXRoIGQ9Ik03NzMgMTUgQTcgNyAwIDAgMSA3ODAgMjIiLz4KPC9nPgo8IS0tIFBlbmFsdHkgc3BvdCAtLT4KPGNpcmNsZSBjeD0iNDAwIiBjeT0iMTEzIiByPSIzLjUiIGZpbGw9IiNmZmYiLz4KPCEtLSBDZW50ZXIgc3BvdCBhdCBib3R0b20gLS0+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjQ4NSIgcj0iMy41IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=',
   halfDown: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMxYTZiMzAiLz4KPGNsaXBQYXRoIGlkPSJmZCI+PHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNzYwIiBoZWlnaHQ9IjQ3MCIgcng9IjEiLz48L2NsaXBQYXRoPgo8ZyBjbGlwLXBhdGg9InVybCgjZmQpIj4KPHJlY3QgeD0iMjAiIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjgzIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjIxMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iMjc0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjxyZWN0IHg9IjQwMCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz4KPHJlY3QgeD0iNDY0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPgo8cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+CjxyZWN0IHg9IjU5MCIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz4KPHJlY3QgeD0iNjU0IiB5PSIxNSIgd2lkdGg9IjYzIiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPgo8cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+CjwvZz4KPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjwhLS0gRmllbGQgYm91bmRhcnkgLS0+CjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+CjwhLS0gR29hbCBhdCBib3R0b20gLS0+CjxyZWN0IHg9IjM1OSIgeT0iNDg1IiB3aWR0aD0iODIiIGhlaWdodD0iMTMiLz4KPCEtLSBQZW5hbHR5IGFyZWEgZnJvbSBib3R0b20gLS0+CjxyZWN0IHg9IjE3NSIgeT0iMzM3IiB3aWR0aD0iNDUwIiBoZWlnaHQ9IjE0OCIvPgo8IS0tIEdvYWwgYXJlYSBmcm9tIGJvdHRvbSAtLT4KPHJlY3QgeD0iMjk4IiB5PSI0MzUiIHdpZHRoPSIyMDQiIGhlaWdodD0iNTAiLz4KPCEtLSBQZW5hbHR5IGFyYyAob3V0c2lkZSBwZW5hbHR5IGFyZWEsIGN1cnZpbmcgdXB3YXJkKSAtLT4KPHBhdGggZD0iTTMxOSAzMzcgQTEwMiA4MiAwIDAgMSA0ODEgMzM3Ii8+CjwhLS0gQ2VudGVyIHNlbWljaXJjbGUgYXQgdG9wIGxpbmUgLS0+CjxwYXRoIGQ9Ik0yOTggMTUgQTEwMiA4MiAwIDAgMCA1MDIgMTUiLz4KPCEtLSBDb3JuZXIgYXJjcyBib3R0b20gLS0+CjxwYXRoIGQ9Ik0yNyA0ODUgQTcgNyAwIDAgMSAyMCA0NzgiLz4KPHBhdGggZD0iTTc4MCA0NzggQTcgNyAwIDAgMSA3NzMgNDg1Ii8+CjwvZz4KPCEtLSBQZW5hbHR5IHNwb3QgLS0+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjM4NyIgcj0iMy41IiBmaWxsPSIjZmZmIi8+CjwhLS0gQ2VudGVyIHNwb3QgYXQgdG9wIC0tPgo8Y2lyY2xlIGN4PSI0MDAiIGN5PSIxNSIgcj0iMy41IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo=',
    blank: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzFhNmIzMCIvPjxjbGlwUGF0aCBpZD0iZmIiPjxyZWN0IHg9IjIwIiB5PSIxNSIgd2lkdGg9Ijc2MCIgaGVpZ2h0PSI0NzAiIHJ4PSIxIi8+PC9jbGlwUGF0aD48ZyBjbGlwLXBhdGg9InVybCgjZmIpIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI4MyIgeT0iMTUiIHdpZHRoPSI2NCIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSIxNDciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iMjEwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjI3NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSIzMzciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PHJlY3QgeD0iNDAwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzIwNzMzMiIvPjxyZWN0IHg9IjQ2NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMxYTZiMzAiLz48cmVjdCB4PSI1MjciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMjA3MzMyIi8+PHJlY3QgeD0iNTkwIiB5PSIxNSIgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ3MCIgZmlsbD0iIzFhNmIzMCIvPjxyZWN0IHg9IjY1NCIgeT0iMTUiIHdpZHRoPSI2MyIgaGVpZ2h0PSI0NzAiIGZpbGw9IiMyMDczMzIiLz48cmVjdCB4PSI3MTciIHk9IjE1IiB3aWR0aD0iNjMiIGhlaWdodD0iNDcwIiBmaWxsPSIjMWE2YjMwIi8+PC9nPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIj48cmVjdCB4PSIyMCIgeT0iMTUiIHdpZHRoPSI3NjAiIGhlaWdodD0iNDcwIiByeD0iMSIvPjwvZz48L3N2Zz4K'
};

// ---- ESTADO DE LA PIZARRA ----
(function() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">'
        + '<rect width="800" height="500" fill="#1a6b30"/>'
        + '<clipPath id="fart"><rect x="20" y="15" width="760" height="470" rx="1"/></clipPath>'
        + '<g clip-path="url(#fart)">'
        + '<rect x="20" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="147" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="274" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="400" y="15" width="64" height="470" fill="#207332"/>'
        + '<rect x="527" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="654" y="15" width="63" height="470" fill="#207332"/>'
        + '</g>'
        + '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<rect x="20" y="15" width="760" height="470" rx="1"/>'
        + '<line x1="400" y1="15" x2="400" y2="485"/>'
        + '<circle cx="400" cy="250" r="65"/>'
        + '<rect x="20" y="105" width="119" height="290"/>'
        + '<rect x="661" y="105" width="119" height="290"/>'
        + '<rect x="20" y="184" width="40" height="132"/>'
        + '<rect x="740" y="184" width="40" height="132"/>'
        + '<rect x="10" y="220" width="10" height="60"/>'
        + '<rect x="780" y="220" width="10" height="60"/>'
        + '<path d="M139 198 A65 65 0 0 1 139 302"/>'
        + '<path d="M661 198 A65 65 0 0 0 661 302"/>'
        + '<path d="M20 22 A7 7 0 0 1 27 15"/>'
        + '<path d="M773 15 A7 7 0 0 1 780 22"/>'
        + '<path d="M780 478 A7 7 0 0 1 773 485"/>'
        + '<path d="M27 485 A7 7 0 0 1 20 478"/>'
        + '</g>'
        + '<circle cx="400" cy="250" r="3.5" fill="#fff"/>'
        + '<circle cx="100" cy="250" r="3.5" fill="#fff"/>'
        + '<circle cx="700" cy="250" r="3.5" fill="#fff"/>'
        + '<g fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">'
        + '<rect x="55" y="15" width="290" height="470"/>'
        + '<line x1="55" y1="250" x2="345" y2="250"/>'
        + '<rect x="135" y="15" width="130" height="65"/>'
        + '<rect x="135" y="420" width="130" height="65"/>'
        + '<rect x="455" y="15" width="290" height="470"/>'
        + '<line x1="455" y1="250" x2="745" y2="250"/>'
        + '<rect x="575" y="15" width="130" height="65"/>'
        + '<rect x="575" y="420" width="130" height="65"/>'
        + '</g>'
        + '<circle cx="200" cy="250" r="2.5" fill="#eab308"/>'
        + '<circle cx="600" cy="250" r="2.5" fill="#eab308"/>'
        + '</svg>';
    EJ_FIELD_IMAGES.artificial = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
})();

const ejP = {
    fieldType: 'full',
    showCarriles: false,
    showZonas: false,
    showRejilla: false,
    camAngle: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    fieldColor: '#1a6b30',
    fieldFondo: 'cruzado',
    escudo: { ver: true, op: 0.18, tam: 1 },
    svgW: 800, svgH: 500,
    fieldRealW: 105, fieldRealH: 68,
    showEII: false,
    numTeams: 2,

    activeTool: 'select',
    myColor: 'blue',
    rivalColor: 'red',
    myGkColor: 'yellow',
    rivalGkColor: 'orange',
    selectedSize: 'small',
    showNumbers: true,            // manda el selector de datos de la barra de jugadores
    hasVest: false,
    vestColor: 'yellow',

    lineColor: '#ffffff',
    lineDashed: false,
    lineWidth: 3,
    shapeFill: false,
    shapeFillOpacity: 0.3,
    shapeFillType: 'solid',

    players: [],
    lines: [],
    shapes: [],
    texts: [],
    equipment: [],
    connections: [],
    selectedEquipmentType: 'cone',
   equipDefaultMul: 1,
    equipDefaultColor: null,

    selectedId: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isDrawing: false,
    drawStart: null,
    tempShape: null,
    freehandPts: [],

    history: [],
    histIdx: -1,
    isUndoRedo: false,
    playerCounts: {},
    expandedSection: 'players',
nextId: 1,

    // ---- ANIMACIÓN ----
    animMode: false,
    frames: [],
    currentFrame: 0,
    isPlaying: false,
    playSpeed: 800,
    _animId: null, _exportingVideo: false, _lastVideoUrl: null, _videoDesactualizado: false
};

// =============================================
// HISTORIA (UNDO / REDO)
// =============================================
function ejSaveHistory() {
    if (ejP.isUndoRedo) return;
    // No se guardan dos pasos iguales seguidos
    const ult = ejP.history[ejP.histIdx];
    if (ult && ult.players === JSON.stringify(ejP.players) && ult.lines === JSON.stringify(ejP.lines) && ult.shapes === JSON.stringify(ejP.shapes)
        && ult.texts === JSON.stringify(ejP.texts) && ult.equipment === JSON.stringify(ejP.equipment) && ult.connections === JSON.stringify(ejP.connections)) return;
    if (ejP.animMode) ejP._videoDesactualizado = true;
    const snap = {
        players: JSON.stringify(ejP.players),
        lines:   JSON.stringify(ejP.lines),
        shapes:  JSON.stringify(ejP.shapes),
        texts:     JSON.stringify(ejP.texts),
        equipment: JSON.stringify(ejP.equipment), connections: JSON.stringify(ejP.connections)
    };
    ejP.history = ejP.history.slice(0, ejP.histIdx + 1);
    ejP.history.push(snap);
    if (ejP.history.length > 50) ejP.history.shift();
    ejP.histIdx = ejP.history.length - 1;
}

function ejUndo() {
    if (ejP.histIdx <= 0) { ejRenderToolbar(); ejObjBar(); return; }
    ejP.histIdx--;
    const s = ejP.history[ejP.histIdx];
    ejP.isUndoRedo = true;
    ejP.players   = JSON.parse(s.players);
    ejP.lines     = JSON.parse(s.lines);
    ejP.shapes    = JSON.parse(s.shapes);
    ejP.texts     = JSON.parse(s.texts);
    ejP.equipment = s.equipment ? JSON.parse(s.equipment) : []; ejP.connections = s.connections ? JSON.parse(s.connections) : [];
    ejP.selectedId = null;
    ejP.isUndoRedo = false;
    ejRenderSVG();
    ejRenderToolbar();
    ejObjBar();
}

function ejRedo() {
    if (ejP.histIdx >= ejP.history.length - 1) { ejRenderToolbar(); ejObjBar(); return; }
    ejP.histIdx++;
    const s = ejP.history[ejP.histIdx];
    ejP.isUndoRedo = true;
    ejP.players   = JSON.parse(s.players);
    ejP.lines     = JSON.parse(s.lines);
    ejP.shapes    = JSON.parse(s.shapes);
    ejP.texts     = JSON.parse(s.texts);
    ejP.equipment = s.equipment ? JSON.parse(s.equipment) : []; ejP.connections = s.connections ? JSON.parse(s.connections) : [];
    ejP.selectedId = null;
    ejP.isUndoRedo = false;
    ejRenderSVG();
    ejRenderToolbar();
    ejObjBar();
}

// =============================================
// RENDER SVG
// =============================================
function ejRenderSVG() {
    if (ejEqCfg()) ejKitSync();
    const svg = document.getElementById('ej-svg');
    if (!svg) { ejObjBar(); return; }
    const W = ejP.svgW, H = ejP.svgH;

    let defs = '<defs>';
    // Patrones rayados para jugadores
    for (const p of ejP.players) {
        const tc = EJ_TEAM_COLORS[p.color];
        if (tc && tc.striped) {
            defs += `<pattern id="stp-${p.id}" patternUnits="userSpaceOnUse" width="6" height="10">
                <rect width="3" height="10" fill="${tc.fill}"/>
                <rect x="3" width="3" height="10" fill="${tc.fill2}"/>
            </pattern>`;
        }
        if (p.photo) {
            var _pr = 14 * (p.scale ?? 1);
            defs += '<clipPath id="pclip-' + p.id + '"><circle cx="0" cy="0" r="' + _pr + '"/></clipPath>';
        }
    }
    for (const s of ejP.shapes) {
        if (s.fillType === 'hatched') {
            var hCol = s.color || '#ffffff';
            var hOp = s.fillOpacity ?? 0.5;
            defs += '<pattern id="hatch-' + s.id + '" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">';
            defs += '<rect width="10" height="10" fill="' + hCol + '" opacity="' + (hOp * 0.15) + '"/>';
            defs += '<line x1="0" y1="0" x2="0" y2="10" stroke="' + hCol + '" stroke-width="2.5" opacity="' + hOp + '"/>';
            defs += '</pattern>';
        }
    }
    defs += '</defs>';

    // Campo
    let html = defs;
    html += ejGetFieldSVG(ejP.fieldType, ejFondoColor()) + ejEscudoSVG();
    html += ejCarrilesZonasSVG();
    html += ejRejillaMetrosSVG();

    // Formas
    for (const s of ejP.shapes) {
        if (ejP.animMode && s.fromFrame !== undefined && (ejP.currentFrame < s.fromFrame || (s.toFrame !== undefined && ejP.currentFrame >= s.toFrame))) continue;
        const sel = s.id === ejP.selectedId;
        const sw = s.strokeWidth || 3;
        const dash = s.dashed ? '10 5' : 'none';
        if (s.type === 'rect') {
            var _rf = s.fillType === 'hatched' ? 'url(#hatch-' + s.id + ')' : (s.fill || 'none');
            var _selMode = ejP.activeTool === 'select';
            html += `<rect data-id="${s.id}" data-type="shape"
                x="${s.x||0}" y="${s.y||0}" width="${s.w||0}" height="${s.h||0}"
                fill="${_rf}" stroke="${s.color}" stroke-width="${sel?sw+1:sw}"
                stroke-dasharray="${dash}" style="cursor:${_selMode?'move':'crosshair'};pointer-events:${_selMode?'all':'none'}"/>`;
            if (sel) {
                html += `<rect x="${s.x-3}" y="${s.y-3}" width="${s.w+6}" height="${s.h+6}"
                    fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="2" style="pointer-events:none"/>`;
                var _hc = [['tl',s.x,s.y,'nwse'],['tr',s.x+s.w,s.y,'nesw'],['bl',s.x,s.y+s.h,'nesw'],['br',s.x+s.w,s.y+s.h,'nwse']];
                for (var _hi=0; _hi<4; _hi++) {
                    html += '<circle cx="'+_hc[_hi][1]+'" cy="'+_hc[_hi][2]+'" r="7" fill="#22c55e" stroke="#fff" stroke-width="2" data-rsz="'+s.id+'-'+_hc[_hi][0]+'" style="cursor:'+_hc[_hi][3]+'-resize"/>';
                }
            }
            html += ejEtiquetaZonaSVG(s);
        } else if (s.type === 'ellipse') {
            var _ef = s.fillType === 'hatched' ? 'url(#hatch-' + s.id + ')' : (s.fill || 'none');
            html += `<ellipse data-id="${s.id}" data-type="shape"
                cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"
                fill="${_ef}" stroke="${s.color}" stroke-width="${sel?sw+1:sw}"
                stroke-dasharray="${dash}" style="cursor:${ejP.activeTool==='select'?'move':'crosshair'};pointer-events:${ejP.activeTool==='select'?'auto':'none'}"/>`;
            if (sel) {
                html += `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx+3}" ry="${s.ry+3}"
                    fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2"/>`;
            }
        }
    }


    // Equipamiento
    for (const eq of ejP.equipment) {
        const eqType = EJ_EQUIPMENT_TYPES.find(t => t.key === eq.eqType);
        const w = (eqType ? eqType.w : 40) * (eq.scale || 1);
        const h = (eqType ? eqType.h : 40) * (eq.scale || 1);
        const sel = eq.id === ejP.selectedId;
        const img = EJ_EQUIPMENT_IMAGES[eq.eqType];
        html += `<g data-id="${eq.id}" data-type="equipment" style="cursor:move" transform="rotate(${(eq.rotation||0) + ejGiroDe(eq.id)},${eq.x},${eq.y})">
           ${eq.color ? `<filter id="eqtint-${eq.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" result="g"/><feComponentTransfer in="g" result="gb"><feFuncR type="linear" slope="0.55" intercept="0.5"/><feFuncG type="linear" slope="0.55" intercept="0.5"/><feFuncB type="linear" slope="0.55" intercept="0.5"/></feComponentTransfer><feFlood flood-color="${eq.color}" result="c"/><feBlend in="c" in2="gb" mode="multiply" result="t"/><feComposite in="t" in2="SourceGraphic" operator="in"/></filter>` : ''}
            <image href="${img}" x="${eq.x - w/2}" y="${eq.y - h/2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"${eq.color ? ` filter="url(#eqtint-${eq.id})"` : ''}/>
            ${sel ? `<rect x="${eq.x - w/2 - 3}" y="${eq.y - h/2 - 3}" width="${w+6}" height="${h+6}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="3"/>` : ''}
        </g>`;
    }

    // Conexiones entre jugadores
    for (var _ci = 0; _ci < ejP.connections.length; _ci++) { var conn = ejP.connections[_ci]; var _pFrom = ejP.players.find(function(p) { return p.id === conn.from; }); var _pTo = ejP.players.find(function(p) { return p.id === conn.to; }); if (_pFrom && _pTo) { var _cSel = conn.id === ejP.selectedId; var _cSw = conn.strokeWidth || 3; var _cDash = conn.dashed ? '10 5' : 'none'; html += '<g data-id="' + conn.id + '" data-type="connection" style="cursor:pointer"><line x1="' + _pFrom.x + '" y1="' + _pFrom.y + '" x2="' + _pTo.x + '" y2="' + _pTo.y + '" stroke="transparent" stroke-width="16"/><line x1="' + _pFrom.x + '" y1="' + _pFrom.y + '" x2="' + _pTo.x + '" y2="' + _pTo.y + '" stroke="' + conn.color + '" stroke-width="' + (_cSel ? _cSw + 1 : _cSw) + '" stroke-dasharray="' + _cDash + '" stroke-linecap="round"/>' + (_cSel ? '<circle cx="' + _pFrom.x + '" cy="' + _pFrom.y + '" r="6" fill="#22c55e" opacity="0.7"/><circle cx="' + _pTo.x + '" cy="' + _pTo.y + '" r="6" fill="#22c55e" opacity="0.7"/>' : '') + '</g>'; } }
    // Líneas y flechas
    for (const l of ejP.lines) {
        if (ejP.animMode && l.fromFrame !== undefined && (ejP.currentFrame < l.fromFrame || (l.toFrame !== undefined && ejP.currentFrame >= l.toFrame))) continue;
        const sel = l.id === ejP.selectedId;
        const sw = l.strokeWidth || 3;
        const dash = l.dashed ? '10 5' : 'none';
        if (l.type === 'freehand') {
            if (!l.points || l.points.length < 2) continue;
            const d = l.points.map((p,i) => `${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            const last = l.points[l.points.length-1];
            const prev = l.points[l.points.length-2];
            const ang = Math.atan2(last.y-prev.y, last.x-prev.x);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:${ejP.activeTool==='select'?'move':'pointer'}">
                <path d="${d}" stroke="transparent" stroke-width="16" fill="none"/>
                <g transform="translate(1.4,2.2)" opacity="0.28" style="pointer-events:none">
                    <path d="${d}" stroke="#000" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <polygon points="${last.x},${last.y} ${last.x-hl*Math.cos(ang-.4)},${last.y-hl*Math.sin(ang-.4)} ${last.x-hl*Math.cos(ang+.4)},${last.y-hl*Math.sin(ang+.4)}" fill="#000"/>
                </g>
                <path d="${d}" stroke="${l.color}" stroke-width="${sel?sw+1:sw}"
                    stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <polygon points="${last.x},${last.y} ${last.x-hl*Math.cos(ang-.4)},${last.y-hl*Math.sin(ang-.4)} ${last.x-hl*Math.cos(ang+.4)},${last.y-hl*Math.sin(ang+.4)}" fill="${l.color}"/>
            </g>`;
        } else if (l.type === 'curved') {
            const cx = l.cx ?? (l.x1+l.x2)/2;
            const cy = l.cy ?? (l.y1+l.y2)/2 - 50;
            const ang = Math.atan2(l.y2-cy, l.x2-cx);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:${ejP.activeTool==='select'?'move':'pointer'}">
                <path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}" stroke="transparent" stroke-width="16" fill="none"/>
                <g transform="translate(1.4,2.2)" opacity="0.28" style="pointer-events:none">
                    <path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}" stroke="#000" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round"/>
                    <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="#000"/>
                </g>
                <path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}"
                    stroke="${l.color}" stroke-width="${sel?sw+1:sw}"
                    stroke-dasharray="${dash}" fill="none" stroke-linecap="round"/>
                <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${l.color}"/>
                ${sel ? `<circle cx="${cx}" cy="${cy}" r="7" fill="#22c55e" stroke="white" stroke-width="2" data-ctrl="${l.id}" style="cursor:grab"/>` : ''}
                ${sel ? `<circle cx="${l.x1}" cy="${l.y1}" r="5" fill="#22c55e" data-ep="${l.id}-1"/><circle cx="${l.x2}" cy="${l.y2}" r="5" fill="#22c55e" data-ep="${l.id}-2"/>` : ''}
            </g>`;
        } else if (l.type === 'dribble') {
            const ang = Math.atan2(l.y2-l.y1, l.x2-l.x1);
            const hl = 8+sw;
            const wd = ejWavyPath(l.x1, l.y1, l.x2, l.y2, 5, 18);
            html += `<g data-id="${l.id}" data-type="line" style="cursor:${ejP.activeTool==='select'?'move':'pointer'}">
                <line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="transparent" stroke-width="16"/>
                <g transform="translate(1.4,2.2)" opacity="0.28" style="pointer-events:none">
                    <path d="${ejWavyPath(l.x1, l.y1, l.x2, l.y2, 5, 18)}" stroke="#000" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="#000"/>
                </g>
                <path d="${wd}" stroke="${l.color}" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${l.color}"/>
                ${sel ? `<circle cx="${l.x1}" cy="${l.y1}" r="5" fill="#22c55e" data-ep="${l.id}-1"/><circle cx="${l.x2}" cy="${l.y2}" r="5" fill="#22c55e" data-ep="${l.id}-2"/>` : ''}
            </g>`;
        } else {
            // line / arrow
            const dx = l.x2-l.x1, dy = l.y2-l.y1;
            const ang = Math.atan2(dy,dx);
            const hl = 8+sw;
            html += `<g data-id="${l.id}" data-type="line" style="cursor:${ejP.activeTool==='select'?'move':'pointer'}">
                <line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="transparent" stroke-width="16"/>
                <line x1="${l.x1+1.4}" y1="${l.y1+2.2}" x2="${l.x2+1.4}" y2="${l.y2+2.2}"
                    stroke="#000" opacity="0.28" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" stroke-linecap="round" style="pointer-events:none"/>
                <line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"
                    stroke="${l.color}" stroke-width="${sel?sw+1:sw}" stroke-dasharray="${dash}" stroke-linecap="round"/>
                ${l.hasArrow ? `<polygon points="${l.x2+1.4},${l.y2+2.2} ${l.x2-hl*Math.cos(ang-.4)+1.4},${l.y2-hl*Math.sin(ang-.4)+2.2} ${l.x2-hl*Math.cos(ang+.4)+1.4},${l.y2-hl*Math.sin(ang+.4)+2.2}" fill="#000" opacity="0.28" style="pointer-events:none"/><polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${l.color}"/>` : ''}
                ${sel ? `<circle cx="${l.x1}" cy="${l.y1}" r="5" fill="#22c55e" data-ep="${l.id}-1"/><circle cx="${l.x2}" cy="${l.y2}" r="5" fill="#22c55e" data-ep="${l.id}-2"/>` : ''}
            </g>`;
        }
    }

    // Línea temporal mientras dibuja
    if (ejP.tempShape) {
        const t = ejP.tempShape;
        const sw = ejP.lineWidth;
        const dash = ejP.lineDashed ? '10 5' : 'none';
        if (t.type === 'line' || t.type === 'arrow') {
            html += `<line x1="${t.x1}" y1="${t.y1}" x2="${t.x2}" y2="${t.y2}" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
        } else if (t.type === 'rect') {
            var prevFill = ejP.shapeFill ? ejHexToRgba(ejP.lineColor, ejP.shapeFillOpacity) : 'none';
            html += `<rect x="${Math.min(t.x, t.x + t.w)}" y="${Math.min(t.y, t.y + t.h)}" width="${Math.abs(t.w)}" height="${Math.abs(t.h)}" fill="${prevFill}" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
            html += ejEtiquetaZonaSVG(t);
        } else if (t.type === 'ellipse') {
            var prevFill = ejP.shapeFill ? ejHexToRgba(ejP.lineColor, ejP.shapeFillOpacity) : 'none';
            html += `<ellipse cx="${t.cx}" cy="${t.cy}" rx="${t.rx}" ry="${t.ry}" fill="${prevFill}" stroke="${ejP.lineColor}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.7"/>`;
} else if (t.type === 'freehand' && t.points.length > 1) {
            const d = t.points.map((p,i)=>`${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            html += `<path d="${d}" stroke="${ejP.lineColor}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
        } else if (t.type === 'curved') {
            const cx = t.cx ?? (t.x1+t.x2)/2, cy = t.cy ?? (t.y1+t.y2)/2 - 40;
            html += `<path d="M${t.x1} ${t.y1} Q${cx} ${cy} ${t.x2} ${t.y2}" stroke="${ejP.lineColor}" stroke-width="${sw}" fill="none" opacity="0.7"/>`;
            html += `<circle cx="${cx}" cy="${cy}" r="5" fill="#facc15" opacity="0.7"/>`;
        } else if (t.type === 'dribble') {
            html += `<path d="${ejWavyPath(t.x1, t.y1, t.x2, t.y2, 5, 18)}" stroke="${ejP.lineColor}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
        }
    }

    // Textos
    for (const t of ejP.texts) {
        const sel = t.id === ejP.selectedId;
        const tsize = t.size || 16;
        const tweight = t.bold ? 700 : 500;
        const tcolor = t.color || '#ffffff';
        const tlines = String(t.text).split('\n');
        const lineH = tsize * 1.3;
        const maxLen = tlines.reduce(function(m, l){ return Math.max(m, l.length); }, 1);
        const approxW = (maxLen * tsize * 0.56) + 16;
        const boxH = (tlines.length - 1) * lineH + tsize + 12;
        const tfont = t.font || 'system-ui, sans-serif';
        const tspans = function(dx, dy) {
            return tlines.map(function(l, i) {
                const ly = (i - (tlines.length - 1) / 2) * lineH + dy;
                return `<tspan x="${dx}" y="${ly}">${ejEscXml(l)}</tspan>`;
            }).join('');
        };
        html += `<g data-id="${t.id}" data-type="text" transform="translate(${t.x},${t.y})" style="cursor:move">
            ${t.bg ? `<rect x="${-approxW/2}" y="${-boxH/2}" width="${approxW}" height="${boxH}" rx="5" fill="rgba(15,23,42,0.82)" stroke="${tcolor}" stroke-width="1.2"/>` : ''}
            ${!t.bg ? `<text text-anchor="middle" dominant-baseline="central" fill="#000" opacity="0.35" font-size="${tsize}" font-weight="${tweight}" font-family="${tfont}" style="pointer-events:none">${tspans(1.2, 2)}</text>` : ''}
            <text text-anchor="middle" dominant-baseline="central" fill="${tcolor}" font-size="${tsize}" font-weight="${tweight}" font-family="${tfont}">${tspans(0, 0)}</text>
            ${sel ? `<rect x="${-approxW/2-4}" y="${-boxH/2-4}" width="${approxW+8}" height="${boxH+8}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="5" style="pointer-events:none"/>` : ''}
        </g>`;
    }

    // Jugadores (encima de todo)
    for (const p of ejP.players) {
        const isGk = p.number == 1 && p.team !== 'tarea';
        const gkColor = ejEsRival(p) ? ejP.rivalGkColor : ejP.myGkColor;
        const effectiveColor = isGk ? gkColor : p.color;
        const tc = ejFichaColores(p, effectiveColor);
        const vc = EJ_TEAM_COLORS[p.vestColor] || EJ_TEAM_COLORS.yellow;
        const sel = p.id === ejP.selectedId;
        const scale = p.scale ?? 1.0;
        const r = 14 * scale;
        const fs = 11 * scale;
        const textColor = tc.texto || (['yellow','white','atletico','juventus'].includes(p.color) ? '#1e293b' : '#ffffff');
        const fillAttr = tc.kitFill || (tc.striped ? `url(#stp-${p.id})` : tc.fill); html += tc.defs || '';

        if (p.soloTexto && !p.anon) {
            const _stName = ejEscXml(p.name || '');
            const _stFs = 12 * scale;
            const _stW = Math.max(30, _stName.length * _stFs * 0.62);
            html += `<g data-id="${p.id}" data-type="player" transform="translate(${p.x},${p.y})" style="cursor:move">
            <rect x="${-_stW/2}" y="${-_stFs*0.75}" width="${_stW}" height="${_stFs*1.5}" fill="transparent"/>
            <text text-anchor="middle" dominant-baseline="central" x="1" y="1" fill="#000" opacity="0.55" font-size="${_stFs}" font-weight="700" font-family="system-ui" style="pointer-events:none">${_stName}</text>
            <text text-anchor="middle" dominant-baseline="central" fill="${tc.fill}" font-size="${_stFs}" font-weight="700" font-family="system-ui" style="pointer-events:none">${_stName}</text>
            ${sel ? `<rect x="${-_stW/2-4}" y="${-_stFs*0.75-4}" width="${_stW+8}" height="${_stFs*1.5+8}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4 2" rx="4" style="pointer-events:none"/>` : ''}
        </g>`;
            continue;
        }
        var _est = p.estilo || 'foto', _anon = !!p.anon, _hasPhoto = !!p.photo && _est === 'foto' && !_anon, _verNum = p.showNumber && p.number && !_anon, _verNom = p.showName && p.name && !_anon;
        html += `<g data-id="${p.id}" data-type="player" transform="translate(${p.x},${p.y})" style="cursor:move">
            <ellipse cx="${r*0.18}" cy="${r*0.62}" rx="${r*0.92}" ry="${r*0.42}" fill="rgba(0,0,0,0.30)" style="pointer-events:none"/>
            ${p.hasVest ? `<circle r="${r+4}" fill="none" stroke="${vc.fill}" stroke-width="4" stroke-dasharray="8 4"/>` : ''}`;
        if (_est === 'camiseta') { html += ejCamisetaSVG(r, fillAttr, sel ? '#22c55e' : tc.stroke, sel, _verNum ? p.number : '', textColor, fs); } else if (_hasPhoto) {
            html += `<circle r="${r}" fill="#0f172a"/>
            <image href="${ejFotoCache[p.photo] || p.photo}" x="${-r}" y="${-r}" width="${r*2}" height="${r*2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pclip-${p.id})" style="pointer-events:none"/>
            <circle r="${r}" fill="none" stroke="${sel?'#22c55e':tc.stroke}" stroke-width="${sel?3:2.5}"/>
            ${_verNum ? `<circle cx="${r*0.72}" cy="${r*0.72}" r="${r*0.56}" fill="${tc.fill}" stroke="#fff" stroke-width="1.2"/><text x="${r*0.72}" y="${r*0.72}" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-size="${fs*0.82}" font-weight="700" font-family="system-ui">${p.number}</text>` : ''}`;
        } else {
            html += `<circle r="${r}" fill="${fillAttr}" stroke="${sel?'#22c55e':tc.stroke}" stroke-width="${sel?3:2}"/>
            <ellipse cx="0" cy="${-r*0.32}" rx="${r*0.62}" ry="${r*0.40}" fill="rgba(255,255,255,0.16)" style="pointer-events:none"/>
            ${_verNum ? `<text text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-size="${fs}" font-weight="700" font-family="system-ui">${p.number}</text>` : ''}`;
        }
        html += `${_verNom ? `<text text-anchor="middle" y="${r+11}" fill="#ffffff" font-size="9" font-weight="600" font-family="system-ui" style="text-shadow:0 1px 2px rgba(0,0,0,.8)">${ejEscXml(p.name)}</text>` : ''}
        </g>`;
    }
// Fantasmas del frame anterior - no mostrar durante exportación
if (ejP.animMode && !ejP._exporting && ejP.currentFrame > 0) {
    const prevF = ejP.frames[ejP.currentFrame - 1];
    if (prevF) {
        for (const fp of prevF.players) {
            const cur = ejP.players.find(p => p.id === fp.id);
            const movido = cur && (Math.abs(cur.x - fp.x) > 3 || Math.abs(cur.y - fp.y) > 3);
            if (movido || (cur && ejP.isPlaying)) {
                html += `<circle${ejP.isPlaying ? ` data-fant="${fp.id}"` : ''} cx="${fp.x}" cy="${fp.y}" r="14" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.25"${movido ? '' : ' style="display:none"'}/>`;
            }
        }
    }
}

// Trayectorias del frame actual (modo animación) - no mostrar durante exportación
if (ejP.animMode && !ejP._exporting && ejP.frames[ejP.currentFrame]) {
    const trajs = ejP.frames[ejP.currentFrame].trajectories || [];
for (const l of trajs) {
        if (l.isMovement && l.fromX !== undefined) {
            html += `<circle cx="${l.fromX}" cy="${l.fromY}" r="13" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.3"/>`;
        }
        const sw = l.strokeWidth || 3;
        const dash = l.dashed ? '10 5' : 'none';
        const col = l.color || '#facc15';
        if (l.type === 'freehand' && l.points && l.points.length > 1) {
            const d = l.points.map((p,i) => `${i===0?'M':'L'}${p.x} ${p.y}`).join(' ');
            html += `<path d="${d}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
        } else if (l.type === 'curved') {
            const cx = l.cx ?? (l.x1+l.x2)/2, cy = l.cy ?? (l.y1+l.y2)/2;
            const ang = Math.atan2(l.y2-cy, l.x2-cx);
            const hl = 8+sw;
            html += `<path d="M${l.x1} ${l.y1} Q${cx} ${cy} ${l.x2} ${l.y2}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" fill="none" opacity="0.85"/>
            <polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${col}" opacity="0.85"/>`;
            if (!ejP.isPlaying) {
                html += `<line x1="${(l.x1+l.x2)/2}" y1="${(l.y1+l.y2)/2}" x2="${cx}" y2="${cy}" stroke="#facc15" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>`;
                html += `<circle cx="${cx}" cy="${cy}" r="9" fill="#facc15" stroke="white" stroke-width="2" data-traj-ctrl="${l.id}" style="cursor:grab;opacity:0.9"/>`;
            }
        } else if (l.type === 'rect') {
            html += `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
        } else if (l.type === 'ellipse') {
            html += `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
        } else if (l.x1 !== undefined) {
            const ang = Math.atan2(l.y2-l.y1, l.x2-l.x1);
            const hl = 8+sw;
            html += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${col}" stroke-width="${sw}" stroke-dasharray="${dash}" opacity="0.85"/>`;
            if (l.hasArrow) html += `<polygon points="${l.x2},${l.y2} ${l.x2-hl*Math.cos(ang-.4)},${l.y2-hl*Math.sin(ang-.4)} ${l.x2-hl*Math.cos(ang+.4)},${l.y2-hl*Math.sin(ang+.4)}" fill="${col}" opacity="0.85"/>`;
        }
    }
}
    // Panel de parámetros flotante: visible en todos los rectángulos con análisis activo
    if (ejP.showEII && !ejP._exporting) {
        for (var _pi = 0; _pi < ejP.shapes.length; _pi++) {
            var _psh = ejP.shapes[_pi];
            if (_psh.type === 'rect') html += ejPanelParametrosSVG(_psh);
        }
    }
    // Recuadro de selección múltiple + marcadores de seleccionados
    if (ejP._marquee) {
        var _mx = Math.min(ejP._marquee.x1, ejP._marquee.x2);
        var _my = Math.min(ejP._marquee.y1, ejP._marquee.y2);
        var _mw = Math.abs(ejP._marquee.x2 - ejP._marquee.x1);
        var _mh = Math.abs(ejP._marquee.y2 - ejP._marquee.y1);
        html += '<rect x="'+_mx+'" y="'+_my+'" width="'+_mw+'" height="'+_mh+'" fill="rgba(34,197,94,0.12)" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6 4" style="pointer-events:none"/>';
    }
    if (ejP.multiSel && ejP.multiSel.length > 0) {
        ejP.multiSel.forEach(function(m) {
            if (m.type === 'player') {
                var _p = ejP.players.find(function(x){ return x.id === m.id; });
                if (_p) { var _r = 14 * (_p.scale != null ? _p.scale : 1); html += '<circle cx="'+_p.x+'" cy="'+_p.y+'" r="'+(_r+6)+'" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="5 3" style="pointer-events:none"/>'; }
            } else if (m.type === 'equipment') {
                var _eq = ejP.equipment.find(function(x){ return x.id === m.id; });
                if (_eq) { var _et = EJ_EQUIPMENT_TYPES.find(function(t){ return t.key === _eq.eqType; }); var _w = (_et ? _et.w : 40) * (_eq.scale || 1); var _h = (_et ? _et.h : 40) * (_eq.scale || 1); html += '<rect x="'+(_eq.x-_w/2-4)+'" y="'+(_eq.y-_h/2-4)+'" width="'+(_w+8)+'" height="'+(_h+8)+'" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="5 3" rx="4" style="pointer-events:none"/>'; }
            } else if (m.type === 'text') {
                var _t = ejP.texts.find(function(x){ return x.id === m.id; });
                if (_t) html += '<circle cx="'+_t.x+'" cy="'+_t.y+'" r="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="5 3" style="pointer-events:none"/>';
            }
        });
        html += '<text x="12" y="24" fill="#22c55e" font-size="13" font-weight="700" style="pointer-events:none">'+ejP.multiSel.length+' seleccionados — arrastra uno para mover el bloque</text>';
    }
    if ((ejP.camAngle || 0) > 0) {
        var _vz = ejP.zoom || 1, _vw = ejP.svgW/_vz, _vh = ejP.svgH/_vz, _vx = ejP.panX||0, _vy = ejP.panY||0;
        html += '<circle id="ej-cal-0" cx="'+(_vx+1)+'" cy="'+(_vy+1)+'" r="0.4" fill="transparent" style="pointer-events:none"/>'
              + '<circle id="ej-cal-1" cx="'+(_vx+_vw-1)+'" cy="'+(_vy+1)+'" r="0.4" fill="transparent" style="pointer-events:none"/>'
              + '<circle id="ej-cal-2" cx="'+(_vx+_vw-1)+'" cy="'+(_vy+_vh-1)+'" r="0.4" fill="transparent" style="pointer-events:none"/>'
              + '<circle id="ej-cal-3" cx="'+(_vx+1)+'" cy="'+(_vy+_vh-1)+'" r="0.4" fill="transparent" style="pointer-events:none"/>';
        ejP._calPts = [[_vx+1,_vy+1],[_vx+_vw-1,_vy+1],[_vx+_vw-1,_vy+_vh-1],[_vx+1,_vy+_vh-1]];
    }
    svg.innerHTML = html;
    ejAplicarViewBox();
    ejAplicarCamara();
    ejObjBar();
    // El área de trabajo toma el color del campo: así no quedan franjas oscuras a los lados
    if (!ejP._presentOn) {
        const areaCampo = document.getElementById('ej-canvas-area');
        if (areaCampo) { const cf = ejFondoColor(); areaCampo.style.background = cf === 'grid' ? '#fbfcfe' : cf; }
    }
}

// =============================================
// POSICIÓN DEL PUNTERO (mouse + touch)
// =============================================
function ejGetPos(e) {
    const svg = document.getElementById('ej-svg');
    const cX = e.touches ? e.touches[0].clientX : (e.clientX ?? e.x);
    const cY = e.touches ? e.touches[0].clientY : (e.clientY ?? e.y);
    if ((ejP.camAngle || 0) > 0) {
        const p = ejProyInversa(cX, cY);
        if (p) return p;
    }
    const pt = svg.createSVGPoint();
    pt.x = cX; pt.y = cY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
}

// =============================================
// EVENT HANDLERS DEL SVG
// =============================================
// Detecta si hay un jugador o material justo bajo el punto (para priorizarlo sobre las zonas)
function ejHitElemento(pos) {
    for (var i = ejP.players.length - 1; i >= 0; i--) {
        var p = ejP.players[i];
        var r = 14 * (p.scale != null ? p.scale : 1);
        var dx = pos.x - p.x, dy = pos.y - p.y;
        if (dx * dx + dy * dy <= (r + 3) * (r + 3)) return { id: p.id, type: 'player' };
    }
    for (var j = ejP.equipment.length - 1; j >= 0; j--) {
        var eq = ejP.equipment[j];
        var et = EJ_EQUIPMENT_TYPES.find(function(t){ return t.key === eq.eqType; });
        var w = (et ? et.w : 40) * (eq.scale || 1);
        var h = (et ? et.h : 40) * (eq.scale || 1);
        if (Math.abs(pos.x - eq.x) <= w / 2 && Math.abs(pos.y - eq.y) <= h / 2) return { id: eq.id, type: 'equipment' };
    }
    return null;
}

function ejPunteroBajar(e) {
    const svg = document.getElementById('ej-svg');
    if (!svg) return;
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);

    const pos = ejGetPos(e);
    const target = e.target;

    // Click en punto de control de flecha curva
    if (target.dataset.ctrl) {
        ejP.isDragging = true;
        ejP._ctrlId = target.dataset.ctrl;
        return;
    }

    // Click en endpoint de línea (redimensionar)
    if (target.dataset.ep) {
        ejP.isDragging = true;
        ejP._epDrag = target.dataset.ep;
        return;
    }

    // Click en tirador de redimensión de rectángulo
    if (target.dataset.rsz) {
        var _parts = target.dataset.rsz.split('-');
        var _rid = parseInt(_parts[0]);
        var _corner = _parts[1];
        var _sh = ejP.shapes.find(function(s){ return s.id === _rid; });
        if (_sh) {
            ejP.isDragging = true;
            ejP._rszId = _rid;
            ejP._rszCorner = _corner;
            if (_corner === 'tl') ejP._rszAnchor = { x: _sh.x + _sh.w, y: _sh.y + _sh.h };
            else if (_corner === 'tr') ejP._rszAnchor = { x: _sh.x, y: _sh.y + _sh.h };
            else if (_corner === 'bl') ejP._rszAnchor = { x: _sh.x + _sh.w, y: _sh.y };
            else ejP._rszAnchor = { x: _sh.x, y: _sh.y };
        }
        return;
    }

    // Click en elemento existente
    const el = target.closest ? target.closest('[data-id]') : null;
    const isBackground = !el || target.dataset.bg;

  if (!isBackground && ejP.activeTool === 'select') {
    var id = parseInt(el.dataset.id);
    var type = el.dataset.type;
    // Prioridad: si el clic cae sobre una zona/forma pero hay un jugador o material justo debajo, se coge ese
    if (type === 'shape') {
        var _hit = ejHitElemento(pos);
        if (_hit) { id = _hit.id; type = _hit.type; }
    }
    // Si el elemento pertenece a la selección múltiple → mover todo el bloque
    if (ejP.multiSel && ejP.multiSel.length > 0 && ejP.multiSel.some(function(m){ return m.id === id; })) {
        ejP._blockDrag = true;
        ejP._blockLast = { x: pos.x, y: pos.y };
        ejP.isDragging = true;
        return;
    }
    ejP.multiSel = [];
    ejP.selectedId = id;
    ejP.isDragging = true;
    ejP._ctrlId = null;
    if (!ejP._abrirPanelAlSeleccionar) { /* las opciones salen junto al objeto */ } else if (type === 'player') ejP.expandedSection = 'players';
    else if (type === 'equipment') ejP.expandedSection = 'material';
    else ejP.expandedSection = 'draw';

    
    if (type === 'player') {
        const p = ejP.players.find(p => p.id === id);
        if (p) {
            ejP.dragOffset = { x: pos.x - p.x, y: pos.y - p.y };
            ejP._dragOriginal = ejP.animMode ? { id, elemType: 'player', x: p.x, y: p.y } : null;
        }
    } else if (type === 'equipment') {
        const eq = ejP.equipment.find(eq => eq.id === id);
        if (eq) {
            ejP.dragOffset = { x: pos.x - eq.x, y: pos.y - eq.y };
            ejP._dragOriginal = ejP.animMode ? { id, elemType: 'equipment', x: eq.x, y: eq.y } : null;
        }
    } else {
        ejP._dragOriginal = null;
        // Calcular offset para text/shape/line
        const tx = ejP.texts.find(t => t.id === id);
        if (tx) {
            ejP.dragOffset = { x: pos.x - tx.x, y: pos.y - tx.y };
        }
        const sh = ejP.shapes.find(s => s.id === id);
        if (sh) {
            if (sh.x !== undefined) ejP.dragOffset = { x: pos.x - sh.x, y: pos.y - sh.y };
            else if (sh.cx !== undefined) ejP.dragOffset = { x: pos.x - sh.cx, y: pos.y - sh.cy };
        }
        const ln = ejP.lines.find(l => l.id === id);
        if (ln) {
            ejP.dragOffset = { x: pos.x - (ln.x1 ?? 0), y: pos.y - (ln.y1 ?? 0) };
        }
    }
    ejRenderSVG();
    return;
}
// Herramienta conectar jugadores
if (ejP.activeTool === 'connect') { if (!isBackground && el) { var _cid = parseInt(el.dataset.id); var _ctype = el.dataset.type; if (_ctype === 'player') { if (!ejP._connectFrom) { ejP._connectFrom = _cid; ejToast('Jugador seleccionado — clic en otro para conectar', 'info'); } else if (ejP._connectFrom !== _cid) { ejSaveHistory(); var _connId = ejP.nextId++; ejP.connections.push({ id: _connId, from: ejP._connectFrom, to: _cid, color: ejP.lineColor, strokeWidth: ejP.lineWidth, dashed: ejP.lineDashed }); ejP._connectFrom = _cid; ejP.selectedId = _connId; ejRenderSVG(); ejRenderToolbar(); } } } else { ejP._connectFrom = null; ejP.activeTool = 'select'; ejRenderToolbar(); } return; }    // Herramienta jugador
    if (ejP.activeTool === 'player' && isBackground) {
        ejSaveHistory();
        const scale = ejP.selectedSize === 'small' ? 0.6 : ejP.selectedSize === 'large' ? 1.4 : 1.0;
        const id = ejP.nextId++;

        if (ejP._plantillaMode && ejP._plantilla && ejP._plantillaSelIdx !== undefined) {
            const p = ejP._plantilla[ejP._plantillaSelIdx];
            const posTxt = (p.position || '').toLowerCase();
            const isGk = posTxt.includes('portero') || posTxt === 'por';
            const color = ejP._plantillaEsRival
                ? (isGk ? ejP.rivalGkColor : ejP.rivalColor)
                : (isGk ? ejP.myGkColor : ejP.myColor);
            ejP.players.push({
                id, x: pos.x, y: pos.y, color, team: ejP._plantillaEsRival ? 'rival' : 'my',
                scale, number: p.number, name: p.name,
                photo: (ejP._plantillaLabel === 'nofoto' || ejP._plantillaLabel === 'solotexto') ? null : (p.photo || null),
                showNumber: ejP._plantillaLabel !== 'name' && ejP._plantillaLabel !== 'solotexto',
                showName: ejP._plantillaLabel === 'name' || ejP._plantillaLabel === 'both' || ejP._plantillaLabel === 'nofoto' || ejP._plantillaLabel === 'solotexto', soloTexto: ejP._plantillaLabel === 'solotexto',
                hasVest: false, vestColor: ejP.vestColor, estilo: ejP.fichaEstilo || 'foto', anon: !!ejP.fichaAnon
            });
            ejP._plantillaMode = false;
            ejP._plantillaSelIdx = undefined;
            ejP.activeTool = 'select';
        } else {
            const color = ejP._tareaColor || (ejP._addingRival ? ejP.rivalColor : ejP.myColor);
            const counts = ejP.playerCounts;
            counts[color] = (counts[color] || 0) + 1;
            ejP.players.push({
                id, x: pos.x, y: pos.y, color, team: ejP._tareaColor ? 'tarea' : (ejP._addingRival ? 'rival' : 'my'),
                scale, number: ejP.showNumbers ? counts[color] : '',
                showNumber: ejP.showNumbers,
                hasVest: ejP.hasVest, vestColor: ejP.vestColor, estilo: ejP.fichaEstilo || 'foto', anon: !!ejP.fichaAnon
            });
            // Mantener activo "Añadir jugador" para colocar varios seguidos
        }
        ejP.selectedId = id;
        ejRenderSVG();
        ejRenderToolbar();
        return;
    }

    // Herramienta equipamiento
    if (ejP.activeTool === 'equipment' && isBackground) {
        ejSaveHistory();
        const id = ejP.nextId++;
        ejP.equipment.push({ id, x: pos.x, y: pos.y, eqType: ejP.selectedEquipmentType, scale: Math.round(({'ball':0.20,'cone':0.20,'marker':0.20,'goalSmall':0.95}[ejP.selectedEquipmentType] || 0.5) * (ejP.equipDefaultMul || 1) * 100) / 100, rotation: 0, color: (EJ_COLORABLE_EQUIP.includes(ejP.selectedEquipmentType) ? (ejP.equipDefaultColor || null) : null) });
ejP.selectedId = id;
        ejP.expandedSection = 'material';
ejRenderSVG();
ejRenderToolbar();
return;
    }

    // Herramienta texto
    if (ejP.activeTool === 'text' && isBackground) {
        ejPromptTexto('Introduce el texto:', 'Texto', function(text) {
            if (text) {
                ejSaveHistory();
                const id = ejP.nextId++;
                ejP.texts.push({ id, x: pos.x, y: pos.y, text, color: ejP.lineColor || '#ffffff', size: 18, bold: false, bg: false });
                ejP.selectedId = id;
                ejP.activeTool = 'select';
                ejP.expandedSection = 'draw';
                ejRenderSVG();
                ejRenderToolbar();
            }
        });
        return;
    }

 // Herramientas de dibujo
    const drawTools = ['arrow','line','rect','ellipse','curved','pencil','dribble'];
    // En animación, un trazo que empieza sobre una ficha o un balón puede ser la orden de moverlo
    // o un simple dibujo: lo decide el selector del panel de Dibujo. Rectángulos y círculos siempre son dibujo.
    if (drawTools.includes(ejP.activeTool) && ejP.animMode && ejP.animTrazoMueve !== false && ejP.activeTool !== 'rect' && ejP.activeTool !== 'ellipse') {
        const SNAP_PLAYER = 30;
        const SNAP_BALL = 22;
        const SNAP_EQUIP = 26;
        let snapElem = null;
        let snapDist = 9999;

        // Primero buscar balón (prioridad máxima, radio pequeño)
        for (const eq of ejP.equipment) {
            if (eq.eqType !== 'ball') continue;
            const dx = pos.x - eq.x, dy = pos.y - eq.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < SNAP_BALL && d < snapDist) { snapElem = eq; snapDist = d; }
        }
        // Luego otro equipamiento
        if (!snapElem) {
            for (const eq of ejP.equipment) {
                if (eq.eqType === 'ball') continue;
                const dx = pos.x - eq.x, dy = pos.y - eq.y;
                const d = Math.sqrt(dx*dx+dy*dy);
                if (d < SNAP_EQUIP && d < snapDist) { snapElem = eq; snapDist = d; }
            }
        }
        // Finalmente jugadores (solo si no hay balón/equipamiento más cerca)
        for (const p of ejP.players) {
            const dx = pos.x - p.x, dy = pos.y - p.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < SNAP_PLAYER && d < snapDist) { snapElem = p; snapDist = d; }
        }
if (snapElem) {
            const elemType = ejP.players.find(p => p.id === snapElem.id) ? 'player' : 'equipment';
            ejP._animDrawSnap = { id: snapElem.id, elemType };
            ejP.isDrawing = true;
            ejP.drawStart = { x: snapElem.x, y: snapElem.y };
            if (ejP.activeTool === 'pencil') {
                ejP.tempShape = { type: 'freehand', points: [{ x: snapElem.x, y: snapElem.y }] };
            } else if (ejP.activeTool === 'curved') {
                ejP.tempShape = { type: 'curved', x1: snapElem.x, y1: snapElem.y, x2: snapElem.x, y2: snapElem.y };
            } else {
                ejP.tempShape = { type: 'line', x1: snapElem.x, y1: snapElem.y, x2: snapElem.x, y2: snapElem.y };
            }
            return;
        }
    }
    // Con una herramienta de dibujo activa se dibuja desde donde se pulse, también encima de una ficha o del material
    if (drawTools.includes(ejP.activeTool)) {
        ejP.isDrawing = true;
        ejP.drawStart = pos;
        if (ejP.activeTool === 'pencil') {
            ejP.tempShape = { type: 'freehand', points: [pos] };
        } else if (ejP.activeTool === 'rect') {
            ejP.tempShape = { type: 'rect', x: pos.x, y: pos.y, w: 0, h: 0 };
        } else if (ejP.activeTool === 'ellipse') {
            ejP.tempShape = { type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0 };
        } else {
            ejP.tempShape = { type: ejP.activeTool === 'curved' ? 'curved' : (ejP.activeTool === 'dribble' ? 'dribble' : 'line'),
                x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        }
        return;
    }

    // Click en fondo con select = deseleccionar e iniciar recuadro de selección múltiple
    if (ejP.activeTool === 'select' && isBackground) {
        ejP.selectedId = null;
        ejP.multiSel = [];
        ejP._marquee = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
        ejRenderSVG();
    }
}

function ejPunteroMover(e) {
    const pos = ejGetPos(e);

    // Recuadro de selección múltiple en curso
    if (ejP._marquee) {
        ejP._marquee.x2 = pos.x; ejP._marquee.y2 = pos.y;
        ejRenderSVG();
        return;
    }

    // Mover selección múltiple en bloque
    if (ejP.isDragging && ejP._blockDrag) {
        var bdx = pos.x - ejP._blockLast.x;
        var bdy = pos.y - ejP._blockLast.y;
        ejP._blockLast = { x: pos.x, y: pos.y };
        ejMoverMultiSel(bdx, bdy);
        ejRenderSVG();
        return;
    }

  // Arrastrar punto de control de curva
    if (ejP.isDragging && ejP._ctrlId) {
        const id = parseInt(ejP._ctrlId);
        ejP.lines = ejP.lines.map(l => l.id === id ? { ...l, cx: pos.x, cy: pos.y } : l);
        ejRenderSVG();
        return;
    }

    // Arrastrar endpoint de línea (redimensionar)
    if (ejP.isDragging && ejP._epDrag) {
        const parts = ejP._epDrag.split('-');
        const id = parseInt(parts[0]);
        const ep = parts[1];
        ejP.lines = ejP.lines.map(l => {
            if (l.id !== id) return l;
            if (ep === '1') return { ...l, x1: pos.x, y1: pos.y };
            return { ...l, x2: pos.x, y2: pos.y };
        });
        ejRenderSVG();
        return;
    }

    // Arrastrar punto de control de trayectoria curva (animación)
    if (ejP.isDragging && ejP._trajCtrlId) {
        const id = parseInt(ejP._trajCtrlId);
        const frame = ejP.frames[ejP.currentFrame];
        if (frame && frame.trajectories) {
            const traj = frame.trajectories.find(t => t.id === id);
            if (traj) { traj.cx = pos.x; traj.cy = pos.y; }
        }
        ejRenderSVG();
        return;
    }

    // Redimensionar rectángulo con tirador
    if (ejP.isDragging && ejP._rszId) {
        var _shr = ejP.shapes.find(function(s){ return s.id === ejP._rszId; });
        if (_shr) {
            var ax = ejP._rszAnchor.x, ay = ejP._rszAnchor.y;
            _shr.x = Math.min(ax, pos.x);
            _shr.y = Math.min(ay, pos.y);
            _shr.w = Math.abs(pos.x - ax);
            _shr.h = Math.abs(pos.y - ay);
            if (_shr.w < 8) _shr.w = 8;
            if (_shr.h < 8) _shr.h = 8;
        }
        ejRenderSVG();
        return;
    }

    // Arrastrar jugador/equipamiento
    if (ejP.isDragging && ejP.selectedId) {
        const id = ejP.selectedId;
        const p = ejP.players.find(p => p.id === id);
        if (p) {
            p.x = pos.x - ejP.dragOffset.x;
            p.y = pos.y - ejP.dragOffset.y;
        } else {
            const eq = ejP.equipment.find(eq => eq.id === id);
            if (eq) {
                eq.x = pos.x - ejP.dragOffset.x;
                eq.y = pos.y - ejP.dragOffset.y;
            } else {
                const tx = ejP.texts.find(t => t.id === id);
                if (tx) { tx.x = pos.x - ejP.dragOffset.x; tx.y = pos.y - ejP.dragOffset.y; }
                const sh = ejP.shapes.find(s => s.id === id);
                if (sh) {
                    if (sh.x !== undefined) { sh.x = pos.x - ejP.dragOffset.x; sh.y = pos.y - ejP.dragOffset.y; }
                    else if (sh.cx !== undefined) { sh.cx = pos.x - ejP.dragOffset.x; sh.cy = pos.y - ejP.dragOffset.y; }
                }
                const ln = ejP.lines.find(l => l.id === id);
                if (ln && ln.x1 !== undefined) {
                    const dx = (pos.x - ejP.dragOffset.x) - ln.x1;
                    const dy = (pos.y - ejP.dragOffset.y) - ln.y1;
                    ln.x1 += dx; ln.y1 += dy; ln.x2 += dx; ln.y2 += dy;
                    if (ln.cx !== undefined) { ln.cx += dx; ln.cy += dy; }
                }
            }
        }
        ejRenderSVG();
        return;
    }

    // Actualizar trazo mientras dibuja
    if (ejP.isDrawing && ejP.tempShape) {
        const t = ejP.tempShape;
        if (t.type === 'freehand') {
            t.points.push(pos);
        } else if (t.type === 'rect') {
            t.w = pos.x - t.x; t.h = pos.y - t.y;
        } else if (t.type === 'ellipse') {
            t.rx = Math.abs(pos.x - t.cx); t.ry = Math.abs(pos.y - t.cy);
        } else if (t.type === 'curved') {
            t.x2 = pos.x; t.y2 = pos.y;
            t.cx = (t.x1 + pos.x) / 2; t.cy = (t.y1 + pos.y) / 2 - 40;
        } else {
            t.x2 = pos.x; t.y2 = pos.y;
        }
        ejRenderSVG();
    }
}

function ejPunteroSoltar(e) {
    const pos = ejGetPos(e);

    // Fin del recuadro de selección múltiple
    if (ejP._marquee) {
        ejSeleccionarEnRecuadro();
        ejP._marquee = null;
        ejP.isDragging = false;
        ejRenderSVG();
        ejRenderToolbar();
        return;
    }

    // Fin de arrastre en bloque
    if (ejP.isDragging && ejP._blockDrag) {
        ejP._blockDrag = false;
        ejP.isDragging = false;
        ejSaveHistory();
        if (ejP.animMode) ejFrameSaveCurrent();
        ejRenderSVG();
        return;
    }

    // Fin de arrastre
    if (ejP.isDragging && (ejP.selectedId || ejP._epDrag)) {
        ejSaveHistory();
        if (ejP.animMode) ejFrameSaveCurrent();
    }
    ejP.isDragging = false;
    ejP._ctrlId = null;
    ejP._trajCtrlId = null;
    ejP._epDrag = null;
    ejP._rszId = null;
    ejP._rszCorner = null;
    ejP._rszAnchor = null;

    // Fin de dibujo
    if (ejP.isDrawing && ejP.drawStart) {
        const id = ejP.nextId++;
        const color = ejP.lineColor;
        const sw = ejP.lineWidth;
        const dashed = ejP.lineDashed;
        const t = ejP.tempShape;
        let newLine = null;

        if (ejP.activeTool === 'pencil' && t && t.points && t.points.length > 2) {
            newLine = { id, type: 'freehand', points: [...t.points], color, strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'rect' && t && Math.abs(t.w) > 5 && Math.abs(t.h) > 5) {
            // El rectángulo vale en cualquier dirección en que se arrastre
            if (t.w < 0) { t.x += t.w; t.w = -t.w; }
            if (t.h < 0) { t.y += t.h; t.h = -t.h; }
            var shapeFillVal = ejP.shapeFill ? (ejP.shapeFillType === 'hatched' ? 'hatched' : ejHexToRgba(color, ejP.shapeFillOpacity)) : 'none';
            newLine = { id, type: 'rect', x: t.x, y: t.y, w: t.w, h: t.h, color, fill: shapeFillVal, fillType: ejP.shapeFill ? ejP.shapeFillType : null, fillOpacity: ejP.shapeFillOpacity, strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'ellipse' && t && t.rx > 5 && t.ry > 5) {
            var shapeFillVal = ejP.shapeFill ? (ejP.shapeFillType === 'hatched' ? 'hatched' : ejHexToRgba(color, ejP.shapeFillOpacity)) : 'none';
            newLine = { id, type: 'ellipse', cx: t.cx, cy: t.cy, rx: t.rx, ry: t.ry, color, fill: shapeFillVal, fillType: ejP.shapeFill ? ejP.shapeFillType : null, fillOpacity: ejP.shapeFillOpacity, strokeWidth: sw, dashed };
        } else if (ejP.activeTool === 'curved' && t) {
            newLine = { id, type: 'curved', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2,
                cx: t.cx ?? (t.x1+t.x2)/2, cy: t.cy ?? (t.y1+t.y2)/2 - 40,
                color, strokeWidth: sw, dashed, hasArrow: true };
        } else if (ejP.activeTool === 'dribble' && t) {
            var _drDx = pos.x - ejP.drawStart.x, _drDy = pos.y - ejP.drawStart.y;
            if (Math.sqrt(_drDx*_drDx + _drDy*_drDy) > 5) {
                newLine = { id, type: 'dribble', x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2,
                    color, strokeWidth: sw, dashed, hasArrow: true };
            }
        } else if (ejP.activeTool !== 'rect' && ejP.activeTool !== 'ellipse') {
            const dx = pos.x - ejP.drawStart.x, dy = pos.y - ejP.drawStart.y;
            if (Math.sqrt(dx*dx+dy*dy) > 5) {
                newLine = { id, type: 'line', x1: ejP.drawStart.x, y1: ejP.drawStart.y,
                    x2: pos.x, y2: pos.y, color, strokeWidth: sw, dashed,
                    hasArrow: ejP.activeTool === 'arrow' };
            }
        }

        if (newLine) {
            if (ejP.animMode && ejP.frames[ejP.currentFrame]) {
                const frame = ejP.frames[ejP.currentFrame];
                if (!frame.trajectories) frame.trajectories = [];
                if (!frame.undoStack) frame.undoStack = [];
                const snap = ejP._animDrawSnap;
                if (snap) {
                    const endX = newLine.x2 ?? newLine.points?.[newLine.points.length-1]?.x ?? pos.x;
                    const endY = newLine.y2 ?? newLine.points?.[newLine.points.length-1]?.y ?? pos.y;
                    const elem = snap.elemType === 'player'
                        ? ejP.players.find(p => p.id === snap.id)
                        : ejP.equipment.find(eq => eq.id === snap.id);
                    if (elem) {
                        newLine.isMovement = true;
                        newLine.fromX = elem.x;
                        newLine.fromY = elem.y;
                        newLine.toX = endX;
                        newLine.toY = endY;
                        newLine.linkedId = snap.id;
                        newLine.color = '#facc15';
                        newLine.strokeWidth = 2;
                        newLine.dashed = true;
                        frame.trajectories.push(newLine);
                        frame.undoStack = frame.undoStack || [];
                        frame.undoStack.push({ type: 'traj', trajId: newLine.id });
                    }
} else {
                    newLine.fromFrame = ejP.currentFrame;
                    if (newLine.type === 'rect' || newLine.type === 'ellipse') ejP.shapes.push(newLine);
                    else ejP.lines.push(newLine);
                    ejSaveHistory();
                }
                ejP._animDrawSnap = null;
            } else {
                if (newLine.type === 'rect' || newLine.type === 'ellipse') ejP.shapes.push(newLine);
                else ejP.lines.push(newLine);
                ejSaveHistory();
            }
        }

        ejP.isDrawing = false;
        ejP.drawStart = null;
        ejP.tempShape = null;
    }
    ejRenderSVG();
}
// =============================================
// ACCIONES
// =============================================
function ejBorrarSeleccion() {
    if (ejP.multiSel && ejP.multiSel.length > 0) {
        ejSaveHistory();
        var _ids = {};
        ejP.multiSel.forEach(function(m){ _ids[m.type + '_' + m.id] = true; });
        ejP.players = ejP.players.filter(function(p){ return !_ids['player_' + p.id]; });
        ejP.equipment = ejP.equipment.filter(function(q){ return !_ids['equipment_' + q.id]; });
        ejP.texts = ejP.texts.filter(function(t){ return !_ids['text_' + t.id]; });
        ejP.shapes = ejP.shapes.filter(function(s){ return !_ids['shape_' + s.id]; });
        ejP.lines = ejP.lines.filter(function(l){ return !_ids['line_' + l.id]; });
        ejP.connections = ejP.connections.filter(function(c){ return !_ids['player_' + c.from] && !_ids['player_' + c.to]; });
        ejP.multiSel = [];
        if (ejP.animMode) ejFrameSaveCurrent();
        ejRenderSVG();
        ejRenderToolbar();
        return;
    }
    if (!ejP.selectedId) return;
    ejSaveHistory();
    const id = ejP.selectedId;
    
    // En modo animación, las formas/líneas con fromFrame no se borran, se les pone toFrame
    if (ejP.animMode) {
        var shape = ejP.shapes.find(s => s.id === id && s.fromFrame !== undefined);
        var line = ejP.lines.find(l => l.id === id && l.fromFrame !== undefined);
        if (shape) {
            shape.toFrame = ejP.currentFrame;
            ejP.selectedId = null;
            ejRenderSVG();
            ejRenderToolbar();
            return;
        }
        if (line) {
            line.toFrame = ejP.currentFrame;
            ejP.selectedId = null;
            ejRenderSVG();
            ejRenderToolbar();
            return;
        }
    }
    
    // Borrado normal (sin fromFrame o modo estático)
    ejP.players = ejP.players.filter(p => p.id !== id);
    ejP.lines   = ejP.lines.filter(l => l.id !== id);
    ejP.shapes  = ejP.shapes.filter(s => s.id !== id);
    ejP.texts     = ejP.texts.filter(t => t.id !== id);
    ejP.equipment = ejP.equipment.filter(eq => eq.id !== id); ejP.connections = ejP.connections.filter(c => c.id !== id && c.from !== id && c.to !== id);
    ejP.selectedId = null;
    ejRenderSVG();
    ejRenderToolbar();
}
function ejElegirModo(modo) {
    // Ocultar overlay
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay) overlay.style.display = 'none';
    
    if (modo === 'animado') {
        // Activar modo animación directamente
        if (!ejP.animMode) ejToggleAnimMode();
    } else {
        // Modo estático: desactivar animación y ocultar SIEMPRE la barra
        ejP.animMode = false;
        ejP.frames = [];
        ejP.currentFrame = 0;
        var bar = document.getElementById('ej-timeline-bar');
        if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
    }
    // Abrir sección jugadores por defecto
    // Mostrar toolbar
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = '';
    ejP.expandedSection = '';
    ejRenderToolbar();
}
// ========== PROYECTOS DE PIZARRA ==========
function ejProyCoachId() {
    if (window.ejCoachId) return String(window.ejCoachId);
    try { const u = JSON.parse(localStorage.getItem('hub_user') || '{}'); if (u && u.id) return String(u.id); } catch (e) {}
    return null;
}
let ejProyActual = null;
let ejProyItems = [];
let ejProyIdx = -1;
let ejProyFaseCargadaId = null; // id de la fase cuyo contenido esta en la pizarra (para autoguardado)
// Id del ejercicio del Banco cuyo dibujo está ahora en la pizarra (null = dibujo nuevo o de un proyecto).
// "Ver ficha" abre los datos de un ejercicio SIN cargar su dibujo: al guardar desde ahí no se toca el dibujo
// guardado. Antes se sustituía por lo que hubiera en la pizarra (o se borraba si estaba vacía).
var ejPizarraDeId = null;

function ejProyPanel() {
    let p = document.getElementById('ej-proy-panel');
    if (p) { p.style.display = 'flex'; ejProyListar(); return; }
    p = document.createElement('div');
    p.id = 'ej-proy-panel';
    p.style.cssText = 'position:fixed;right:16px;bottom:16px;width:360px;max-height:70vh;background:#0f172a;border:1px solid #334155;border-radius:12px;z-index:99998;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.5);overflow:hidden';
    p.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#1e3a5f;">' +
        '<strong style="color:#93c5fd;font-size:13px">📁 Proyectos de pizarra</strong>' +
        '<span><button id="ej-proy-min" onclick="ejProyPlegar()" title="Plegar" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;margin-right:6px">—</button><button onclick="document.getElementById(\'ej-proy-panel\').style.display=\'none\'" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer">✕</button></span></div>' +
        '<div id="ej-proy-body" style="padding:12px;overflow:auto;color:#e2e8f0;font-size:13px"></div>';
    document.body.appendChild(p);
    (function() {
        const header = p.firstElementChild;
        header.style.cursor = 'move';
        let dx = 0, dy = 0, drag = false;
        header.addEventListener('mousedown', function(ev) {
            if (ev.target.tagName === 'BUTTON') return;
            drag = true;
            const r = p.getBoundingClientRect();
            dx = ev.clientX - r.left; dy = ev.clientY - r.top;
            p.style.right = 'auto'; p.style.bottom = 'auto';
            ev.preventDefault();
        });
        document.addEventListener('mousemove', function(ev) {
            if (!drag) return;
            p.style.left = Math.max(0, ev.clientX - dx) + 'px';
            p.style.top = Math.max(0, ev.clientY - dy) + 'px';
        });
        document.addEventListener('mouseup', function() { drag = false; });
    })();
    ejProyListar();
}

async function ejProyListar() {
    ejProyAutoguardar();
    ejProyActual = null; ejProyItems = []; ejProyIdx = -1;
    const body = document.getElementById('ej-proy-body');
    body.innerHTML = 'Cargando...';
    const { data, error } = await supabaseClient.from('pizarra_proyectos').select('id,nombre').or(window.ejClubId ? ('club_id.eq.' + window.ejClubId + ',coach_id.eq.' + ejProyCoachId()) : ('coach_id.eq.' + ejProyCoachId())).order('updated_at', { ascending: false });
    if (error) { body.innerHTML = '<span style="color:#f87171">Error: ' + error.message + '</span>'; return; }
    let html = '<button onclick="ejProyCrear()" style="width:100%;padding:8px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;margin-bottom:10px">+ Nuevo proyecto</button>';
    if (!data || !data.length) html += '<p style="color:#64748b">Sin proyectos todavia. Crea el primero (ej: "Presion alta").</p>';
    else html += data.map(pr =>
        '<div style="display:flex;align-items:center;justify-content:space-between;background:#1e293b;border-radius:8px;padding:8px 10px;margin-bottom:6px">' +
        '<span onclick="ejProyAbrir(\'' + pr.id + '\',\'' + (pr.nombre || '').replace(/'/g, "\\'") + '\')" style="cursor:pointer;font-weight:600;flex:1">' + pr.nombre + '</span>' +
        '<button onclick="ejProyBorrar(\'' + pr.id + '\')" title="Eliminar proyecto (no borra las pizarras)" style="background:none;border:none;color:#64748b;cursor:pointer">🗑</button></div>'
    ).join('');
    body.innerHTML = html;
}

async function ejProyCrear() {
    const nombre = prompt('Nombre del proyecto (ej: Presion alta):');
    if (!nombre || !nombre.trim()) return;
    const { error } = await supabaseClient.from('pizarra_proyectos').insert({ coach_id: ejProyCoachId(), nombre: nombre.trim(), club_id: window.ejClubId || null });
    if (error) { ejToast('Error: ' + error.message, 'error'); return; }
    ejProyListar();
}

async function ejProyBorrar(id) {
    if (!confirm('Eliminar el proyecto? (las pizarras NO se borran, solo la coleccion)')) return;
    await supabaseClient.from('pizarra_proyectos').delete().eq('id', id);
    ejProyListar();
}

async function ejProyAbrir(id, nombre) {
    ejProyAutoguardar();
    ejProyActual = { id: id, nombre: nombre };
    const body = document.getElementById('ej-proy-body');
    body.innerHTML = 'Cargando...';
    const { data, error } = await supabaseClient.from('pizarra_proyecto_items')
        .select('id, orden, exercise_id, nombre, board_data, thumbnail_svg, custom_exercises(id, name, thumbnail_svg)')
        .eq('proyecto_id', id).order('orden');
    if (error) { body.innerHTML = '<span style="color:#f87171">Error: ' + error.message + '</span>'; return; }
    ejProyItems = data || [];
    ejProyIdx = -1;
    ejProyPintar();
}

function ejProyPintar() {
    const body = document.getElementById('ej-proy-body');
    let html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<button onclick="ejProyListar()" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;padding:4px 8px;cursor:pointer">←</button>' +
        '<strong style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + ejProyActual.nombre + '</strong>' +
        '<button onclick="ejProyNav(-1)" title="Fase anterior (flecha izquierda)" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:6px;padding:4px 10px;cursor:pointer">◀</button>' +
        '<button onclick="ejProyNav(1)" title="Fase siguiente (flecha derecha)" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:6px;padding:4px 10px;cursor:pointer">▶</button></div>' +
        '<button onclick="ejProyAnadirFase()" style="width:100%;padding:7px;background:#16a34a;border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;margin-bottom:6px">+ Anadir fase (captura el dibujo actual)</button>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px">' +
        '<button onclick="ejProyEnviarBanco()" title="Crea una ficha en Mis Ejercicios para poder meterla en sesiones" style="flex:1;padding:6px;background:#1e293b;border:1px solid #7c3aed;color:#c4b5fd;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">📤 Enviar al banco</button>' +
        '<button onclick="ejProyPDF()" title="PDF del proyecto con todas las fases" style="flex:1;padding:6px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">📄 PDF</button></div>';
    if (!ejProyItems.length) html += '<p style="color:#64748b">Proyecto vacio. Dibuja la fase en la pizarra y pulsa "Anadir fase".</p>';
    else html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + ejProyItems.map(function(it, i) {
        const ex = it.custom_exercises || {};
        const nombreItem = it.nombre || ex.name || '(pizarra)';
        const svgThumb = it.thumbnail_svg || ex.thumbnail_svg;
        const thumb = svgThumb ? 'data:image/svg+xml;utf8,' + encodeURIComponent(svgThumb) : '';
        return '<div onclick="ejProyIr(' + i + ')" title="' + nombreItem.replace(/"/g, '&quot;') + '" style="cursor:pointer;background:' + (i === ejProyIdx ? '#1d4ed8' : '#1e293b') + ';border-radius:8px;padding:6px;position:relative;min-width:0;overflow:hidden">' +
            (thumb ? '<img src="' + thumb + '" style="width:100%;height:64px;object-fit:contain;border-radius:6px;background:#14532d">' : '<div style="height:64px;background:#14532d;border-radius:6px"></div>') +
            '<div style="font-size:10px;color:#cbd5e1;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (i + 1) + '. ' + nombreItem + '</div>' +
            '<button onclick="event.stopPropagation();ejProyRenombrar(\'' + it.id + '\')" title="Renombrar fase" style="position:absolute;top:4px;right:26px;background:rgba(0,0,0,.5);border:none;color:#93c5fd;border-radius:4px;cursor:pointer;font-size:11px">✎</button>' +
            '<button onclick="event.stopPropagation();ejProyQuitar(\'' + it.id + '\')" title="Quitar del proyecto" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);border:none;color:#f87171;border-radius:4px;cursor:pointer;font-size:11px">✕</button>' +
            (i > 0 ? '<button onclick="event.stopPropagation();ejProyMover(\'' + it.id + '\',-1)" title="Mover antes" style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,.5);border:none;color:#e2e8f0;border-radius:4px;cursor:pointer;font-size:11px">◀</button>' : '') +
            (i < ejProyItems.length - 1 ? '<button onclick="event.stopPropagation();ejProyMover(\'' + it.id + '\',1)" title="Mover despues" style="position:absolute;top:4px;left:26px;background:rgba(0,0,0,.5);border:none;color:#e2e8f0;border-radius:4px;cursor:pointer;font-size:11px">▶</button>' : '') + '</div>';
    }).join('') + '</div>';
    body.innerHTML = html;
}

async function ejProyAnadirFase() {
    if (!ejProyActual) return;
    const hayDibujo = ejP.players.length > 0 || ejP.lines.length > 0 || ejP.shapes.length > 0 || ejP.equipment.length > 0 || ejP.texts.length > 0;
    if (!hayDibujo) { ejToast('La pizarra esta vacia: dibuja la fase antes de anadirla', 'warning'); return; }
    const nombre = prompt('Nombre de la fase:', 'Fase ' + (ejProyItems.length + 1));
    if (nombre === null) return;
    const bd = ejProyBoardDataActual();
    let thumb = null;
    const svgEl = document.getElementById('ej-svg');
    if (svgEl) {
        thumb = new XMLSerializer().serializeToString(svgEl)
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="100%"');
        thumb = ejComprimirThumbSVG(thumb);
    }
    const { error } = await supabaseClient.from('pizarra_proyecto_items')
        .insert({ proyecto_id: ejProyActual.id, nombre: (nombre.trim() || 'Fase ' + (ejProyItems.length + 1)), board_data: bd, thumbnail_svg: thumb, orden: ejProyItems.length });
    if (error) { ejToast('Error: ' + error.message, 'error'); return; }
    // El dibujo actual pertenece ahora a la fase recien creada: desvincular la anterior
    // para que ejProyAbrir no autoguarde esta variante sobre la fase de origen
    ejProyFaseCargadaId = null;
    ejProyAbrir(ejProyActual.id, ejProyActual.nombre);
}

async function ejProyRenombrar(itemId) {
    const it = ejProyItems.find(function(x) { return x.id === itemId; });
    if (!it) return;
    const actual = it.nombre || (it.custom_exercises && it.custom_exercises.name) || '';
    const nuevo = prompt('Nuevo nombre de la fase:', actual);
    if (nuevo === null) return;
    const limpio = nuevo.trim();
    if (!limpio) { ejToast('El nombre no puede quedar vacio', 'warning'); return; }
    const { error } = await supabaseClient.from('pizarra_proyecto_items').update({ nombre: limpio }).eq('id', itemId);
    if (error) { ejToast('Error: ' + error.message, 'error'); return; }
    it.nombre = limpio;
    ejProyPintar();
}

async function ejProyMover(itemId, dir) {
    const i = ejProyItems.findIndex(function(x) { return x.id === itemId; });
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ejProyItems.length) return;
    const tmp = ejProyItems[i]; ejProyItems[i] = ejProyItems[j]; ejProyItems[j] = tmp;
    if (ejProyIdx === i) ejProyIdx = j; else if (ejProyIdx === j) ejProyIdx = i;
    ejProyPintar();
    for (let k = 0; k < ejProyItems.length; k++) {
        if (ejProyItems[k].orden === k) continue;
        ejProyItems[k].orden = k;
        const { error } = await supabaseClient.from('pizarra_proyecto_items').update({ orden: k }).eq('id', ejProyItems[k].id);
        if (error) { ejToast('Error al guardar el orden: ' + error.message, 'error'); return; }
    }
}

async function ejProyQuitar(itemId) {
    await supabaseClient.from('pizarra_proyecto_items').delete().eq('id', itemId);
    ejProyAbrir(ejProyActual.id, ejProyActual.nombre);
}

function ejProyCoachId() {
    return window.ejCoachId || null;
}

async function ejProyEnviarBanco() {
    if (!ejProyActual || !ejProyItems.length) { ejToast('Abre un proyecto con fases primero', 'warning'); return; }
    if (ejProyIdx < 0) { ejToast('Selecciona primero la fase que hara de portada (clic en su miniatura)', 'warning'); return; }
    const it = ejProyItems[ejProyIdx];
    if (!it.board_data && it.exercise_id) { ejToast('Esa fase ya es una pizarra del banco', 'warning'); return; }
    const desc = prompt('Descripcion para la ficha del banco (opcional):', '');
    if (desc === null) return;
    const item = {
        club_id: window.ejClubId || null,
        coach_id: ejProyCoachId(),
        name: ejProyActual.nombre,
        description: (desc && desc.trim()) ? desc.trim() : null,
        board_data: it.board_data || null,
        thumbnail_svg: await ejMiniaturaCompacta(it.thumbnail_svg || null),
        visibility: 'private',
        approval_status: 'approved',
        source: 'custom'
    };
    const { error } = await supabaseClient.from('custom_exercises').insert(item);
    if (error) { ejToast('Error: ' + error.message, 'error'); return; }
    ejToast('Ficha creada en Mis Ejercicios: ya puedes anadirla a una sesion');
}

function ejProySvgAPng(svgStr) {
    return new Promise(function(resolve, reject) {
        let s = svgStr.replace('width="100%"', 'width="1200"').replace('height="100%"', 'height="800"');
        const img = new Image();
        img.onload = function() {
            const c = document.createElement('canvas');
            c.width = 1200; c.height = 800;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
}

async function ejProyPDF() {
    if (!ejProyActual || !ejProyItems.length) { ejToast('Abre un proyecto con fases primero', 'warning'); return; }
    ejToast('Generando PDF del proyecto...');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(ejProyActual.nombre, 105, 14, { align: 'center' });
    let y = 30;
    for (let i = 0; i < ejProyItems.length; i++) {
        const it = ejProyItems[i];
        const nombre = it.nombre || (it.custom_exercises && it.custom_exercises.name) || ('Fase ' + (i + 1));
        const svg = it.thumbnail_svg || (it.custom_exercises && it.custom_exercises.thumbnail_svg);
        const alto = 108;
        if (y + alto + 4 > 290) { doc.addPage(); y = 15; }
        doc.setFillColor(237, 233, 254);
        doc.rect(10, y, 190, 8, 'F');
        doc.setTextColor(76, 29, 149);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text((i + 1) + '. ' + nombre, 12, y + 5.5);
        y += 10;
        if (svg) {
            try {
                const png = await ejProySvgAPng(svg);
                doc.addImage(png, 'PNG', 20, y, 170, alto - 12);
            } catch (e) {}
        }
        y += alto - 8;
    }
    doc.save('proyecto-' + ejProyActual.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.pdf');
    ejToast('PDF del proyecto descargado');
}

// Construye el board_data del dibujo actual (mismo formato que Anadir fase)
function ejProyBoardDataActual() {
    return {
        players: ejP.players, lines: ejP.lines,
        shapes: ejP.shapes, texts: ejP.texts,
        equipment: ejP.equipment, connections: ejP.connections,
        fieldType: ejP.fieldType, fondo: ejP.fieldFondo, fondoColor: ejP.fieldColor, showCarriles: ejP.showCarriles, showZonas: ejP.showZonas, showRejilla: ejP.showRejilla,
        animFrames: ejP.animMode ? ejP.frames : [],
        animMode: ejP.animMode,
        teamColors: { my: ejP.myColor, myGk: ejP.myGkColor, rival: ejP.rivalColor, rivalGk: ejP.rivalGkColor }
    };
}

// Autoguardado de fase: si el dibujo actual pertenece a una fase y ha cambiado,
// lo persiste (memoria + BD + miniatura) antes de navegar a otro sitio
function ejProyAutoguardar() {
    if (ejProyIdx < 0 || !ejProyItems[ejProyIdx]) return;
    const it = ejProyItems[ejProyIdx];
    if (!it.board_data || it.id !== ejProyFaseCargadaId) return;
    // Nunca autoguardar una pizarra vacia (protege la fase si se limpio el dibujo)
    const hayDibujo = ejP.players.length > 0 || ejP.lines.length > 0 || ejP.shapes.length > 0 || ejP.equipment.length > 0 || ejP.texts.length > 0;
    if (!hayDibujo) return;
    const bd = ejProyBoardDataActual();
    if (JSON.stringify(bd) === JSON.stringify(it.board_data)) return; // sin cambios
    let thumb = it.thumbnail_svg || null;
    const svgEl = document.getElementById('ej-svg');
    if (svgEl) {
        thumb = new XMLSerializer().serializeToString(svgEl)
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="100%"');
        thumb = ejComprimirThumbSVG(thumb);
    }
    it.board_data = JSON.parse(JSON.stringify(bd));
    it.thumbnail_svg = thumb;
    supabaseClient.from('pizarra_proyecto_items')
        .update({ board_data: it.board_data, thumbnail_svg: thumb })
        .eq('id', it.id)
        .then(function(res) { if (res && res.error) ejToast('No se pudo autoguardar la fase: ' + res.error.message, 'error'); });
}

function ejProyIr(i) {
    if (i < 0 || i >= ejProyItems.length) return;
    ejProyAutoguardar();
    ejProyIdx = i;
    const it = ejProyItems[i];
    if (it.board_data) { ejProyCargarFase(it); }
    else if (it.exercise_id) { ejBancoCargar(it.exercise_id); }
    ejProyPintar();
}

function ejProyCargarFase(it) {
    // Copia profunda: la pizarra no debe compartir referencias con la copia
    // en memoria de la fase (si no, la deteccion de cambios del autoguardado falla)
    const bd = JSON.parse(JSON.stringify(it.board_data));
    ejProyFaseCargadaId = it.id; ejPizarraDeId = null;
    ejFrameStop();
    ejSaveHistory();
    ejP.players = ejColoresResolver(bd.players || []);
    ejP.lines = bd.lines || [];
    ejP.shapes = bd.shapes || [];
    ejP.texts = bd.texts || [];
    ejP.equipment = bd.equipment || [];
    ejP.connections = bd.connections || [];
    ejP.fieldType = bd.fieldType || 'full'; ejFondoCargar(bd);
    ejP.showCarriles = !!bd.showCarriles;
    ejP.showZonas = !!bd.showZonas;
    ejP.showRejilla = !!bd.showRejilla;
    if (bd.teamColors) {
        ejP.myColor = bd.teamColors.my || ejP.myColor;
        ejP.myGkColor = bd.teamColors.myGk || ejP.myGkColor;
        ejP.rivalColor = bd.teamColors.rival || ejP.rivalColor;
        ejP.rivalGkColor = bd.teamColors.rivalGk || ejP.rivalGkColor;
    }
    ejEtiquetarEquipos();
    ejP.selectedId = null;
    ejP.nextId = [].concat(ejP.players, ejP.lines, ejP.shapes, ejP.texts, ejP.equipment, ejP.connections).reduce(function(max, e) { return (e.id > max ? e.id : max); }, 0) + 1;
    if (bd.animFrames && bd.animFrames.length > 0) {
        ejP.frames = bd.animFrames;
        ejP.currentFrame = 0;
        ejP.animMode = bd.animMode || false;
        ejFrameRestore(ejP.frames[0]);
    } else {
        ejP.animMode = false;
        ejP.frames = [];
        ejP.currentFrame = 0;
    }
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay) overlay.style.display = 'none';
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = '';
    ejRenderSVG();
    var tlBar = document.getElementById('ej-timeline-bar');
    if (tlBar) tlBar.style.display = ejP.animMode ? 'block' : 'none';
    ejRenderTimeline();
    var lbl = document.getElementById('ej-pizarra-nombre-label');
    if (lbl) lbl.textContent = (ejProyActual ? ejProyActual.nombre + ' · ' : '') + (it.nombre || 'Fase');
}

function ejProyNav(delta) {
    if (!ejProyItems.length) return;
    let i = ejProyIdx + delta;
    if (i < 0) i = ejProyItems.length - 1;
    if (i >= ejProyItems.length) i = 0;
    ejProyIr(i);
}

document.addEventListener('keydown', function(e) {
    const panel = document.getElementById('ej-proy-panel');
    if (!panel || panel.style.display === 'none' || !ejProyActual) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { ejProyNav(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { ejProyNav(-1); e.preventDefault(); }
});

function ejNuevaPizarra() {
    ejConfirm('¿Limpiar la pizarra y empezar desde cero?', () => {
    ejSaveHistory();
    ejProyFaseCargadaId = null; // el dibujo nuevo ya no pertenece a ninguna fase
    ejPizarraDeId = null;
    ejP.players = []; ejP.lines = []; ejP.shapes = []; ejP.texts = []; ejP.equipment = []; ejP.connections = [];
    ejP.selectedId = null; ejP.playerCounts = {}; ejP.nextId = 1;
    ejFrameStop();
    ejP.animMode = false;
    ejP.frames = [];
    ejP.currentFrame = 0;
    ejP._lastVideoUrl = null;
    ejP._exportingVideo = false;
    ejP._exporting = false;
    window._ejPdfThumbData = null;
    window.ejThumbnailPendiente = null;
    ejEditandoId = null;
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = 'none';
    const lbl = document.getElementById('ej-pizarra-nombre-label');
    if (lbl) lbl.textContent = 'Pizarra libre';
    ejRenderSVG();
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay) overlay.style.display = 'flex';
    ejRenderToolbar();
    });
}
function ejClearAll() {
    ejConfirm('¿Borrar toda la pizarra?', () => {
    ejSaveHistory();
    ejP.players = []; ejP.lines = []; ejP.shapes = []; ejP.texts = []; ejP.equipment = []; ejP.connections = [];
    ejP.selectedId = null; ejP.playerCounts = {};
    ejRenderSVG();
    ejRenderToolbar();
    });
}

function ejSetTool(tool) {
    ejP.activeTool = tool;
    ejP._addingRival = false;
    ejP._connectFrom = null;
    ejRenderToolbar();
    ejRenderSVG();
}
function ejHexToRgba(hex, opacity) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+opacity+')';
}

// ====== ANÁLISIS EII (juegos reducidos) ======
const EJ_CAMPO_PX = { w: 760, h: 470 };

// Matriz de Castellano y Casamichana (2016)
function ejCualidadEII(eii, nJug) {
    if (!nJug || nJug <= 0) return null;
    var pocos = nJug <= 4;
    var pocoEspacio = eii <= 100;
    if (pocos && pocoEspacio)  return { label: 'Fuerza',      col: '#f97316' };
    if (pocos && !pocoEspacio) return { label: 'Resistencia', col: '#22c55e' };
    if (!pocos && pocoEspacio) return { label: 'Activación',  col: '#eab308' };
    return { label: 'Velocidad', col: '#3b82f6' };
}

function ejContarJugadoresEnRect(s) {
    var x1 = Math.min(s.x, s.x + s.w), x2 = Math.max(s.x, s.x + s.w);
    var y1 = Math.min(s.y, s.y + s.h), y2 = Math.max(s.y, s.y + s.h);
    var n = 0;
    for (var i = 0; i < ejP.players.length; i++) {
        var p = ejP.players[i];
        if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) n++;
    }
    return n;
}

// Interpolación lineal por tramos entre puntos de anclaje conocidos del campo
function ejInterpPx(val, px, m) {
    if (val <= px[0]) {
        var f0 = (val - px[0]) / (px[1] - px[0]);
        return m[0] + f0 * (m[1] - m[0]);
    }
    for (var i = 0; i < px.length - 1; i++) {
        if (val <= px[i+1]) {
            var f = (val - px[i]) / (px[i+1] - px[i]);
            return m[i] + f * (m[i+1] - m[i]);
        }
    }
    var n = px.length;
    var fn = (val - px[n-2]) / (px[n-1] - px[n-2]);
    return m[n-2] + fn * (m[n-1] - m[n-2]);
}

// Anclas px→m según tipo de campo, con largo (L) y ancho (A) totales.
// El área grande es fija: 40,32 m (ancho) × 16,5 m (fondo).
function ejAnclasCampo() {
    var ft = ejP.fieldType;
    var L = ejP.fieldRealW || 105;
    var A = ejP.fieldRealH || 68;
    var lat = (A - 40.32) / 2;
    if (ft === 'half') {
        return {
            xPx: [20, 175, 625, 780], xM: [0, lat, lat + 40.32, A],
            yPx: [15, 163, 485],      yM: [0, 16.5, L / 2]
        };
    }
    if (ft === 'halfDown') {
        return {
            xPx: [20, 175, 625, 780], xM: [0, lat, lat + 40.32, A],
            yPx: [15, 337, 485],      yM: [L / 2, 16.5, 0]
        };
    }
    if (ft === 'blank') {
        return {
            xPx: [20, 780], xM: [0, L],
            yPx: [15, 485], yM: [0, A]
        };
    }
    return {
        xPx: [20, 139, 400, 661, 780], xM: [0, 16.5, L / 2, L - 16.5, L],
        yPx: [15, 105, 395, 485],      yM: [0, lat, lat + 40.32, A]
    };
}

// Bandas del modelo tridimensional (Casamichana y Castellano)
function ejBandaEII(eii) {
    if (eii < 50) return 0;
    if (eii < 100) return 1;
    if (eii < 200) return 2;
    if (eii <= 300) return 3;
    return -1; // fuera del rango de juego reducido
}
function ejBandaJug(jpe) {
    if (jpe <= 3) return 0;
    if (jpe <= 5) return 1;
    if (jpe <= 7) return 2;
    return 3;
}
// Demandas físicas estimadas (Tabla 6 del libro). Niveles 1-4 (+ a ++++)
function ejDemandas(eii, jpe) {
    var fE = ejBandaEII(eii);
    if (fE < 0) return null;
    var cJ = ejBandaJug(jpe);
    var A = [4, 3, 2, 1][fE];
    var V = [1, 2, 3, 4][fE];
    var pocos = cJ <= 1;
    var FC = (fE <= 1) ? (pocos ? 3 : 1) : (pocos ? 4 : 2);
    return { A: A, FC: FC, V: V };
}

function ejAnalizarZona(s) {
    var an = ejAnclasCampo();
    var x1 = Math.min(s.x, s.x + s.w), x2 = Math.max(s.x, s.x + s.w);
    var y1 = Math.min(s.y, s.y + s.h), y2 = Math.max(s.y, s.y + s.h);
    var anchoM = Math.abs(ejInterpPx(x2, an.xPx, an.xM) - ejInterpPx(x1, an.xPx, an.xM));
    var largoM = Math.abs(ejInterpPx(y2, an.yPx, an.yM) - ejInterpPx(y1, an.yPx, an.yM));
    var areaM2 = anchoM * largoM;
    var nJug = ejContarJugadoresEnRect(s);
    var nEq = ejP.numTeams || 2;
    var jugEq = nJug > 0 ? Math.round(nJug / nEq) : 0;
    var eii = nJug > 0 ? areaM2 / nJug : null;
    var cual = (eii != null) ? ejCualidadEII(eii, jugEq) : null;
    var demandas = (eii != null) ? ejDemandas(eii, jugEq) : null;
    return { anchoM: anchoM, largoM: largoM, areaM2: areaM2, nJug: nJug, jugEq: jugEq, eii: eii, cual: cual, demandas: demandas };
}

function ejEtiquetaZonaSVG(s) {
    if (!ejP.showEII) return '';
    if (Math.abs(s.w) < 25 || Math.abs(s.h) < 25) return '';
    var z = ejAnalizarZona(s);
    var rx = Math.min(s.x, s.x + s.w);
    var ry = Math.min(s.y, s.y + s.h);
    var rw = Math.abs(s.w);
    var rh = Math.abs(s.h);
    var dimTxt = z.anchoM.toFixed(1) + ' × ' + z.largoM.toFixed(1) + ' m';
    var out = '';
    var dimW = dimTxt.length * 6.5 + 12;
    var dimX = rx + rw / 2;
    var dimY = ry - 10; if (dimY < 12) dimY = ry + 16;
    out += '<rect x="' + (dimX - dimW/2) + '" y="' + (dimY - 11) + '" width="' + dimW + '" height="16" rx="3" fill="rgba(15,23,42,0.85)"/>';
    out += '<text x="' + dimX + '" y="' + (dimY - 3) + '" text-anchor="middle" fill="#fff" font-size="11" font-weight="600" font-family="system-ui">' + dimTxt + '</text>';
    if (z.nJug > 0 && z.cual) {
        var fueraRango = z.eii > 300;
        var badgeLabel = fueraRango ? 'ESPACIO AMPLIO' : z.cual.label.toUpperCase();
        var badgeCol = fueraRango ? '#f59e0b' : z.cual.col;
        var datos = Math.round(z.areaM2) + ' m² · ' + z.nJug + ' jug · EII ' + z.eii.toFixed(0);
        var bw = datos.length * 6.2 + badgeLabel.length * 7 + 36;
        var bx = rx + rw / 2 - bw / 2;
        var by = ry + rh + 8;
        if (by + 24 > 500) by = ry - 50;
        out += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="22" rx="5" fill="rgba(15,23,42,0.9)" stroke="' + badgeCol + '" stroke-width="1.5"/>';
        out += '<text x="' + (bx + 8) + '" y="' + (by + 15) + '" fill="#cbd5e1" font-size="10" font-family="system-ui">' + datos + '</text>';
        var badgeW = badgeLabel.length * 7 + 14;
        out += '<rect x="' + (bx + bw - badgeW - 5) + '" y="' + (by + 4) + '" width="' + badgeW + '" height="14" rx="3" fill="' + badgeCol + '"/>';
        out += '<text x="' + (bx + bw - badgeW/2 - 5) + '" y="' + (by + 14) + '" text-anchor="middle" fill="#0f172a" font-size="10" font-weight="700" font-family="system-ui">' + badgeLabel + '</text>';
    } else {
        var l0 = Math.round(z.areaM2) + ' m² · 0 jug';
        var bw0 = l0.length * 6.2 + 16;
        var bx0 = rx + rw / 2 - bw0 / 2;
        var by0 = ry + rh + 8;
        if (by0 + 20 > 500) by0 = ry - 26;
        out += '<rect x="' + bx0 + '" y="' + by0 + '" width="' + bw0 + '" height="18" rx="4" fill="rgba(15,23,42,0.85)"/>';
        out += '<text x="' + (bx0 + 8) + '" y="' + (by0 + 13) + '" fill="#94a3b8" font-size="10" font-family="system-ui">' + l0 + '</text>';
    }
    return out;
}
function ejPanelParametrosSVG(s) {
    var z = ejAnalizarZona(s);
    if (!z.nJug) return '';
    var cardW = 196, cardH = 172;
    var rx = Math.min(s.x, s.x + s.w), ry = Math.min(s.y, s.y + s.h);
    var rw = Math.abs(s.w);
    var cx = rx + rw + 12;
    if (cx + cardW > 795) cx = rx - cardW - 12;
    if (cx < 5) cx = 5;
    var cy = ry;
    if (cy + cardH > 495) cy = 495 - cardH;
    if (cy < 5) cy = 5;
    var fuera = z.eii > 300;
    var col = fuera ? '#f59e0b' : (z.cual ? z.cual.col : '#64748b');
    var lbl = fuera ? 'ESPACIO AMPLIO' : (z.cual ? z.cual.label.toUpperCase() : '-');
    var px = cx + 12, py = cy + 16;
    var g = '<g style="pointer-events:none" font-family="system-ui">';
    g += '<rect x="' + cx + '" y="' + cy + '" width="' + cardW + '" height="' + cardH + '" rx="9" fill="rgba(15,23,42,0.96)" stroke="' + col + '" stroke-width="1.5"/>';
    g += '<text x="' + px + '" y="' + py + '" fill="#64748b" font-size="9" font-weight="700" letter-spacing="1">PARAMETROS</text>';
    py += 26;
    var eiiTxt = z.eii.toFixed(0);
    g += '<text x="' + px + '" y="' + py + '" fill="#fff" font-size="26" font-weight="800">' + eiiTxt + '</text>';
    g += '<text x="' + (px + eiiTxt.length * 16 + 6) + '" y="' + py + '" fill="#94a3b8" font-size="10">m2/jug</text>';
    py += 18;
    var bw = lbl.length * 6.5 + 14;
    g += '<rect x="' + px + '" y="' + (py - 10) + '" width="' + bw + '" height="16" rx="4" fill="' + col + '"/>';
    g += '<text x="' + (px + bw / 2) + '" y="' + (py + 1) + '" text-anchor="middle" fill="#0f172a" font-size="9.5" font-weight="700">' + lbl + '</text>';
    py += 22;
    g += '<text x="' + px + '" y="' + py + '" fill="#cbd5e1" font-size="9">' + Math.round(z.areaM2) + ' m2 . ' + z.nJug + ' jug . ' + z.jugEq + '/equipo</text>';
    py += 8;
    function fila(yy, etiqueta, nivel, c) {
        var o = '<text x="' + px + '" y="' + (yy + 8) + '" fill="#94a3b8" font-size="9.5" font-weight="600">' + etiqueta + '</text>';
        var bx0 = px + 34;
        for (var i = 0; i < 4; i++) {
            var on = nivel && i < nivel;
            o += '<rect x="' + (bx0 + i * 16) + '" y="' + yy + '" width="13" height="9" rx="2" fill="' + (on ? c : '#1e293b') + '" stroke="' + (on ? c : '#334155') + '" stroke-width="1"/>';
        }
        o += '<text x="' + (bx0 + 70) + '" y="' + (yy + 8) + '" fill="' + (nivel ? c : '#475569') + '" font-size="9.5" font-weight="700">' + (nivel ? Array(nivel + 1).join('+') : '-') + '</text>';
        return o;
    }
    var dem = z.demandas;
    g += fila(py, 'ACC', dem ? dem.A : 0, '#f97316'); py += 16;
    g += fila(py, 'FC', dem ? dem.FC : 0, '#ef4444'); py += 16;
    g += fila(py, 'VEL', dem ? dem.V : 0, '#3b82f6'); py += 16;
    if (fuera) g += '<text x="' + px + '" y="' + (py + 6) + '" fill="#f59e0b" font-size="8.5">Fuera de rango de juego reducido</text>';
    g += '</g>';
    return g;
}

function ejWavyPath(x1, y1, x2, y2, amplitude, wavelength) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx*dx + dy*dy);
    if (len < 1) return 'M' + x1 + ' ' + y1;
    var ux = dx / len, uy = dy / len;
    var px = -uy, py = ux;
    var waves = Math.max(2, Math.round(len / wavelength));
    var steps = waves * 10;
    var d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1);
    for (var i = 1; i <= steps; i++) {
        var tt = i / steps;
        var along = tt * len;
        var taper = tt > 0.82 ? (1 - tt) / 0.18 : 1;
        var off = Math.sin(tt * waves * Math.PI * 2) * amplitude * taper;
        var bx = x1 + ux * along + px * off;
        var by = y1 + uy * along + py * off;
        d += ' L' + bx.toFixed(1) + ' ' + by.toFixed(1);
    }
    return d;
}

function ejGetFieldSVG(type, color) {
    var isGrid = (color === 'grid');
    var c1, c2, brightness, lineCol, dotCol;
    if (isGrid) {
        c1 = '#fbfcfe'; c2 = '#fbfcfe';
        brightness = 255;
        lineCol = '#3a4a5a'; dotCol = '#3a4a5a';
    } else {
        c1 = color; c2 = ejLightenColor(color, 12);
        var r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
        brightness = (r * 299 + g * 587 + b * 114) / 1000;
        lineCol = brightness > 160 ? '#222' : '#fff';
        dotCol = brightness > 160 ? '#333' : '#fff';
        if (color === '#ffffff') { c2 = '#f0f0f0'; }
    }
    var W = 800, H = 500;
    var s = '';
    // Degradados para dar profundidad al césped (solo campos verdes/oscuros)
    var _depth = !isGrid && brightness <= 160;
    if (_depth) {
        s += '<defs>'
            + '<linearGradient id="ejGrassShade" x1="0" y1="0" x2="0" y2="1">'
            + '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.07"/>'
            + '<stop offset="42%" stop-color="#ffffff" stop-opacity="0"/>'
            + '<stop offset="100%" stop-color="#000000" stop-opacity="0.14"/>'
            + '</linearGradient>'
            + '<radialGradient id="ejVignette" cx="50%" cy="47%" r="62%">'
            + '<stop offset="58%" stop-color="#000000" stop-opacity="0"/>'
            + '<stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>'
            + '</radialGradient>'
            + '</defs>';
    }
    // Fondo + franjas (o cuadrícula tipo cuaderno)
    s += '<rect width="'+W+'" height="'+H+'" fill="'+c1+'"/>';
    if (isGrid) {
        s += '<defs>'
            + '<pattern id="ejGridSmall" width="24" height="24" patternUnits="userSpaceOnUse">'
            + '<path d="M24 0 L0 0 0 24" fill="none" stroke="#d4deec" stroke-width="0.8"/>'
            + '</pattern>'
            + '<pattern id="ejGridBig" width="120" height="120" patternUnits="userSpaceOnUse">'
            + '<path d="M120 0 L0 0 0 120" fill="none" stroke="#b9c8de" stroke-width="1.3"/>'
            + '</pattern>'
            + '</defs>';
        s += '<rect x="20" y="15" width="760" height="470" fill="url(#ejGridSmall)"/>';
        s += '<rect x="20" y="15" width="760" height="470" fill="url(#ejGridBig)"/>';
    } else {
        s += ejFondoSVG(c1, c2); for (var i = 0; i < 0; i++) {
            s += '<rect x="'+(20+i*63.3)+'" y="15" width="63" height="470" fill="'+(i%2===0?c2:c1)+'"/>';
        }
    }
    // Capa de luz/sombra + viñeta sobre el césped
    if (_depth) {
        s += '<rect x="20" y="15" width="760" height="470" fill="url(#ejGrassShade)" pointer-events="none"/>';
        s += '<rect x="20" y="15" width="760" height="470" fill="url(#ejVignette)" pointer-events="none"/>';
    }
    // Líneas según tipo
    var L = 'fill="none" stroke="'+lineCol+'" stroke-width="2"';
    s += '<defs><pattern id="ejNet" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M3.2 0 L0 0 0 3.2" fill="none" stroke="'+lineCol+'" stroke-width="0.5"/></pattern></defs>'; s += '<g '+L+' stroke-linecap="round" stroke-linejoin="round">';
    s += '<rect x="20" y="15" width="760" height="470" rx="1"/>';
    if (type === 'full') {
        s += '<line x1="400" y1="15" x2="400" y2="485"/>';
        s += '<circle cx="400" cy="250" r="65"/>';
        s += '<rect x="20" y="105" width="119" height="290"/>';
        s += '<rect x="661" y="105" width="119" height="290"/>';
        s += '<rect x="20" y="184" width="40" height="132"/>';
        s += '<rect x="740" y="184" width="40" height="132"/>';
        s += '<rect x="10" y="220" width="10" height="60" fill="url(#ejNet)"/>';
        s += '<rect x="780" y="220" width="10" height="60" fill="url(#ejNet)"/>';
        s += '<path d="M139 198 A65 65 0 0 1 139 302"/>';
        s += '<path d="M661 198 A65 65 0 0 0 661 302"/>';
        s += '<path d="M20 22 A7 7 0 0 1 27 15"/><path d="M773 15 A7 7 0 0 1 780 22"/>';
        s += '<path d="M780 478 A7 7 0 0 1 773 485"/><path d="M27 485 A7 7 0 0 1 20 478"/>';
        s += '</g><circle cx="400" cy="250" r="3.5" fill="'+dotCol+'"/>';
        s += '<circle cx="100" cy="250" r="3.5" fill="'+dotCol+'"/><circle cx="700" cy="250" r="3.5" fill="'+dotCol+'"/>';
    } else if (type === 'half') {
        s += '<rect x="359" y="2" width="82" height="13" fill="url(#ejNet)"/>';
        s += '<rect x="175" y="15" width="450" height="148"/>';
        s += '<rect x="298" y="15" width="204" height="50"/>';
        s += '<path d="M319 163 A102 82 0 0 0 481 163"/>';
        s += '<path d="M298 485 A102 82 0 0 1 502 485"/>';
        s += '<path d="M20 22 A7 7 0 0 1 27 15"/><path d="M773 15 A7 7 0 0 1 780 22"/>';
        s += '</g><circle cx="400" cy="113" r="3.5" fill="'+dotCol+'"/><circle cx="400" cy="485" r="3.5" fill="'+dotCol+'"/>';
    } else if (type === 'artificial') {
        s += '<line x1="400" y1="15" x2="400" y2="485"/>';
        s += '<circle cx="400" cy="250" r="65"/>';
        s += '<rect x="20" y="105" width="119" height="290"/>';
        s += '<rect x="661" y="105" width="119" height="290"/>';
        s += '<rect x="20" y="184" width="40" height="132"/>';
        s += '<rect x="740" y="184" width="40" height="132"/>';
        s += '<rect x="10" y="220" width="10" height="60" fill="url(#ejNet)"/>';
        s += '<rect x="780" y="220" width="10" height="60" fill="url(#ejNet)"/>';
        s += '<path d="M139 198 A65 65 0 0 1 139 302"/>';
        s += '<path d="M661 198 A65 65 0 0 0 661 302"/>';
        s += '<path d="M20 22 A7 7 0 0 1 27 15"/><path d="M773 15 A7 7 0 0 1 780 22"/>';
        s += '<path d="M780 478 A7 7 0 0 1 773 485"/><path d="M27 485 A7 7 0 0 1 20 478"/>';
        s += '</g>';
        s += '<g fill="none" stroke="#eab308" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">';
        s += '<line x1="60" y1="15" x2="60" y2="485"/>';
        s += '<line x1="385" y1="15" x2="385" y2="485"/>';
        s += '<line x1="415" y1="15" x2="415" y2="485"/>';
        s += '<line x1="740" y1="15" x2="740" y2="485"/>';
        s += '<line x1="60" y1="101" x2="385" y2="101"/>';
        s += '<line x1="415" y1="101" x2="740" y2="101"/>';
        s += '<line x1="60" y1="399" x2="385" y2="399"/>';
        s += '<line x1="415" y1="399" x2="740" y2="399"/>';
        s += '<rect x="136" y="15" width="173" height="60"/>';
        s += '<rect x="136" y="425" width="173" height="60"/>';
        s += '<rect x="491" y="15" width="173" height="60"/>';
        s += '<rect x="491" y="425" width="173" height="60"/>';
        s += '</g>';
        s += '<circle cx="400" cy="250" r="3.5" fill="'+dotCol+'"/>';
        s += '<circle cx="100" cy="250" r="3.5" fill="'+dotCol+'"/><circle cx="700" cy="250" r="3.5" fill="'+dotCol+'"/>';
} else if (type === 'halfDown') {
        s += '<rect x="359" y="485" width="82" height="13" fill="url(#ejNet)"/>';
        s += '<rect x="175" y="337" width="450" height="148"/>';
        s += '<rect x="298" y="435" width="204" height="50"/>';
        s += '<path d="M319 337 A102 82 0 0 1 481 337"/>';
        s += '<path d="M298 15 A102 82 0 0 0 502 15"/>';
        s += '<path d="M27 485 A7 7 0 0 1 20 478"/><path d="M780 478 A7 7 0 0 1 773 485"/>';
        s += '</g><circle cx="400" cy="387" r="3.5" fill="'+dotCol+'"/><circle cx="400" cy="15" r="3.5" fill="'+dotCol+'"/>';
    } else {
        s += '</g>';
    }
    return s;
}

function ejLightenColor(hex, pct) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + Math.round(r * pct / 100));
    g = Math.min(255, g + Math.round(g * pct / 100));
    b = Math.min(255, b + Math.round(b * pct / 100));
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function ejSetFieldColor(color) {
    if (color === 'grid') { ejSetFondo('cuaderno'); return; }
    if (ejFondoDef().color) ejP.fieldFondo = 'cruzado';
    ejP.fieldColor = color;
    ejRenderSVG();
    ejRenderToolbar();
}
function ejSetField(type) {
    ejP.fieldType = type;
    ejRenderSVG();
    ejRenderToolbar();
}

function ejApplyFormation(key, isRival) {
    const positions = EJ_FORMATIONS[key];
    if (!positions) return;
    ejSaveHistory();
    const color = isRival ? ejP.rivalColor : ejP.myColor;
    const scale = ejP.selectedSize === 'small' ? 0.6 : ejP.selectedSize === 'large' ? 1.4 : 1.0;
    const ts = Date.now();
    if (!isRival) {
        // Reemplazar mi equipo
        ejP.players = ejP.players.filter(p => ejEsRival(p) || p.team === 'tarea'); // mantener rivales y fichas de tarea
        ejP.playerCounts[color] = 0;
    }
    const offset = ejP.nextId;
    const newPlayers = positions.map((pos, i) => ({
        id: ejP.nextId++,
        x: isRival ? (1 - pos.x) * ejP.svgW : pos.x * ejP.svgW,
        y: pos.y * ejP.svgH,
        color, team: isRival ? 'rival' : 'my',
        scale,
        number: i + 1, estilo: ejP.fichaEstilo || 'foto', anon: !!ejP.fichaAnon,
        showNumber: ejP.showNumbers,
        hasVest: ejP.hasVest,
        vestColor: ejP.vestColor
    }));
    ejP.players = ejP.players.concat(newPlayers);
    ejP.playerCounts[color] = positions.length;
    ejP.selectedId = null;
    ejRenderSVG();
}

function ejChangePlayerSize(dir) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p => {
        if (p.id !== ejP.selectedId) return p;
        const step = 0.1;
        const newScale = dir === 'up'
            ? Math.min((p.scale ?? 1) + step, 2.5)
            : Math.max((p.scale ?? 1) - step, 0.3);
        return { ...p, scale: Math.round(newScale * 100) / 100 };
    });
    ejSaveHistory();
    ejRenderSVG();
}

function ejChangePlayerColor(color) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, color } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}
function ejChangePlayerNumber(val) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, number: val } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}

function ejTogglePlayerNumber(show) {
    if (!ejP.selectedId) return;
    ejP.players = ejP.players.map(p =>
        p.id === ejP.selectedId ? { ...p, showNumber: show } : p
    );
    ejSaveHistory();
    ejRenderSVG();
}

function ejChangeEquipDefault(dir) {
    const step = 0.15;
    const cur = ejP.equipDefaultMul || 1;
    ejP.equipDefaultMul = dir === 'up' ? Math.min(cur + step, 3.0) : Math.max(cur - step, 0.4);
    ejP.equipDefaultMul = Math.round(ejP.equipDefaultMul * 100) / 100;
    ejRenderToolbar();
}
function ejChangeEquipmentColor(color) {
    if (!ejP.selectedId) return;
    ejP.equipment = ejP.equipment.map(function(eq){ return eq.id === ejP.selectedId ? Object.assign({}, eq, { color: color || null }) : eq; });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejSetEquipDefaultColor(color) {
    ejP.equipDefaultColor = color || null;
    ejRenderToolbar();
}
function ejChangeEquipmentSize(dir) {
    if (!ejP.selectedId) return;
    ejP.equipment = ejP.equipment.map(eq => {
        if (eq.id !== ejP.selectedId) return eq;
        const step = 0.15;
        const newScale = dir === 'up'
            ? Math.min((eq.scale ?? 1) + step, 3.0)
            : Math.max((eq.scale ?? 1) - step, 0.3);
        return { ...eq, scale: Math.round(newScale * 100) / 100 };
    });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejRotateEquipment(deg) {
    if (!ejP.selectedId) return;
    ejP.equipment = ejP.equipment.map(eq => {
        if (eq.id !== ejP.selectedId) return eq;
        const current = eq.rotation || 0;
        return { ...eq, rotation: (current + deg + 360) % 360 };
    });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}

function ejChangeLineColor(color) {
    if (!ejP.selectedId) return;
    ejP.lines  = ejP.lines.map(l  => l.id === ejP.selectedId  ? {...l, color} : l);
    ejP.shapes = ejP.shapes.map(s => s.id === ejP.selectedId ? {...s, color} : s);
    ejSaveHistory();
    ejRenderSVG();
}
async function ejCapturarParaFicha() {
    const svgEl = document.getElementById('ej-svg');
    if (!svgEl) { ejToast('No hay pizarra para capturar', 'warning'); return; }
    await ejPrecargarFotosJugadores();
    
    // Limpiar datos del ejercicio anterior si es pizarra libre
    const lbl = document.getElementById('ej-pizarra-nombre-label');
    if (!ejEditandoId || (lbl && lbl.textContent === 'Pizarra libre')) {
        ejEditandoId = null;
        ejP._lastVideoUrl = null;
        window._ejPdfThumbData = null;
        ejLimpiarFicha();
        ejBuildFicha();
    } else {
        ejPizarraDeId = ejEditandoId;   // "usar en ficha": el dibujo de la pizarra pasa a ser el de este ejercicio
    }
    
    // Capturar SVG limpio (sin fantasmas ni trayectorias)
    var prevSelected = ejP.selectedId;
    var prevExporting = ejP._exporting;
    ejP.selectedId = null;
    ejP._exporting = true;
    ejRenderSVG();
    
    window.ejThumbnailPendiente = new XMLSerializer().serializeToString(svgEl);
    
    // Restaurar estado
    ejP.selectedId = prevSelected;
    ejP._exporting = prevExporting || false;
    ejRenderSVG();
    
    ejPrepararThumbParaPDF();
    
    // Cambiar a la pestaña Ficha
    ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
    
    // Actualizar miniatura y vídeo en la ficha
    setTimeout(() => {
        ejActualizarFichaMedia();
        ejAutoRellenarEIIDesdePizarra();
        const msg = document.getElementById('ej-ficha-msg');
        if (msg) msg.innerHTML = '<span style="color:#a855f7">📸 Miniatura y medidas capturadas — revisa los datos y pulsa Guardar</span>';
        setTimeout(() => { if (msg) msg.innerHTML = ''; }, 4000);
    }, 300);
}
var ejFotoCache = {};
async function ejPrecargarFotosJugadores() {
    var urls = [];
    for (var i = 0; i < ejP.players.length; i++) {
        var u = ejP.players[i].photo;
        if (u && !ejFotoCache[u] && urls.indexOf(u) < 0) urls.push(u);
    }
    for (var k = 0; k < urls.length; k++) {
        var url = urls[k];
        try {
            var resp = await fetch(url, { mode: 'cors' });
            if (!resp.ok) continue;
            var blob = await resp.blob();
            ejFotoCache[url] = await new Promise(function(res, rej){
                var rd = new FileReader();
                rd.onload = function(){ res(rd.result); };
                rd.onerror = function(){ rej(new Error('read')); };
                rd.readAsDataURL(blob);
            });
        } catch(e) { /* CORS u otro problema: se queda con la URL original */ }
    }
}
async function ejExportPNG() {
    await ejPrecargarFotosJugadores();
    ejP.selectedId = null;
    ejRenderSVG();
    setTimeout(() => {
        const svg = document.getElementById('ej-svg');
        // Clonar el SVG y ponerle dimensiones explícitas
        const clone = svg.cloneNode(true);
        clone.setAttribute('width', ejP.svgW);
        clone.setAttribute('height', ejP.svgH);
        const data = new XMLSerializer().serializeToString(clone);
        const canvas = document.createElement('canvas');
        canvas.width = ejP.svgW * 2;
        canvas.height = ejP.svgH * 2;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0, ejP.svgW, ejP.svgH);
            const a = document.createElement('a');
            a.download = 'pizarra_tactica.png';
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
    }, 100);
}

// =============================================
// TOOLBAR HTML
// =============================================
function ejRenderToolbar() {
    const tb = document.getElementById('ej-toolbar');
    // Sin pregunta inicial: si la pizarra espera a que se elija modo, se abre en estático
    const ovModo = document.getElementById('ej-modo-overlay');
    if (ovModo && ovModo.style.display !== 'none') { ejCfgAplicar(); ejElegirModo('estatico'); return; }
    if (ejP.activeTool !== 'player') ejP._tareaColor = null;
    if (ejP._apariencia === undefined) ejP._apariencia = true;
    if (!tb) { ejBarrasSync(); return; }

    const t = ejP.activeTool;
    const sel = ejP.selectedId;
    const selPlayer    = sel ? ejP.players.find(p => p.id === sel) : null;
    const selLine      = sel ? (ejP.lines.find(l => l.id === sel) || ejP.shapes.find(s => s.id === sel)) : null;
    const selEquipment = sel ? ejP.equipment.find(eq => eq.id === sel) : null;
    const selText      = sel ? ejP.texts.find(tx => tx.id === sel) : null;

    // Generar swatches de color
    function colorSwatches(colorKey, solid, striped, onclickFn) {
        let html = '<div class="ej-swatches">';
        for (const [k, v] of Object.entries(EJ_TEAM_COLORS)) {
            if (v.striped && !striped) continue;
            if (!v.striped && !solid) continue;
            const active = colorKey === k;
            if (v.striped) {
                html += `<div class="ej-swatch${active?' active':''}" title="${v.name}"
                    style="background:repeating-linear-gradient(90deg,${v.fill} 0px,${v.fill} 4px,${v.fill2} 4px,${v.fill2} 8px)"
                    onclick="${onclickFn}('${k}')"></div>`;
            } else {
                html += `<div class="ej-swatch${active?' active':''}" title="${v.name}"
                    style="background:${v.fill}" onclick="${onclickFn}('${k}')"></div>`;
            }
        }
        return html + '</div>';
    }

    function sectionHeader(id, icon, label) {
        const open = ejP.expandedSection === id;
        return `<div class="ej-section-header ej-sec-${id}${open?' open':''}" onclick="ejToggleSection('${id}')">${icon} ${label}</div>`;
    }

    const playersOpen = ejP.expandedSection === 'players';
    const drawOpen    = ejP.expandedSection === 'draw';
    const actionsOpen = ejP.expandedSection === 'actions';

    tb.innerHTML = `
    <!-- BOTÓN SELECCIONAR — siempre visible -->
    <button class="ej-btn-tool${t==='select'?' active':''}" onclick="ejSetTool('select')" title="Seleccionar y mover" style="justify-content:center;font-weight:600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0L4 20L9 15H16L4 0Z"/></svg>
        Seleccionar / Mover
    </button>
   
   
   
   
    <div style="display:flex;gap:6px;margin-bottom:6px">
        <button onclick="ejUndo()" title="Deshacer (Ctrl+Z)" style="flex:1;padding:7px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600"><i class="ej-ico ej-ico-deshacer"></i> Deshacer</button>
        <button onclick="ejRedo()" title="Rehacer (Ctrl+Y)" style="flex:1;padding:7px;background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:12px"><i class="ej-ico ej-ico-rehacer"></i> Rehacer</button>
    </div>
 ${(ejP.multiSel && ejP.multiSel.length > 0) ? `
    <div style="margin-bottom:8px;padding:8px;background:#0f172a;border:1px solid #22c55e;border-radius:8px">
        <div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:6px">${ejP.multiSel.length} seleccionados</div>
        <div style="display:flex;gap:4px">
            <button onclick="ejResizeMultiSel('down')" style="flex:1;padding:6px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#f97316;border-radius:6px;cursor:pointer">− Menor todos</button>
            <button onclick="ejResizeMultiSel('up')" style="flex:1;padding:6px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#22c55e;border-radius:6px;cursor:pointer">+ Mayor todos</button>
        </div>
    </div>` : ''}
  <!-- PANEL MODO ANIMACION -->
${ejP.animMode ? `<div style="background:#7c3aed;border:1px solid #a855f7;margin-bottom:6px;width:100%;padding:8px;border-radius:6px;text-align:center;color:#fff;font-size:12px;font-weight:600">
        <i class="ej-ico ej-ico-animar"></i> Modo Animación ON
    </div>` : ''}

    <!-- SECCIÓN JUGADORES -->
    ${sectionHeader('players','⚽','Jugadores')}
    ${playersOpen ? `
    <div class="ej-section-body">
        <div class="ej-section-header ej-sec-apariencia${ejP._apariencia?' open':''}" onclick="ejP._apariencia=!ejP._apariencia;ejRenderToolbar()" style="margin-top:2px"><i class="ej-ico ej-ico-paleta"></i> Apariencia</div>
        ${ejP._apariencia ? `
        <div class="ej-section-body">
            ${!ejP._addingRival && ejEqCfg() ? `<div class="ej-eq-nota">Tu equipo se dibuja con la equipación del club.<button type="button" onclick="ejIrEquipacion()">Cambiar en Mi Club</button></div>` : `
            <label style="font-size:11px;color:#9ca3af">Color ${ejP._addingRival?'rival':'mi equipo'}:</label>
            ${colorSwatches(ejP._addingRival?ejP.rivalColor:ejP.myColor, true, true, ejP._addingRival?'ejSetRivalColor':'ejSetMyColor')}
            <label style="font-size:11px;color:#9ca3af;margin-top:4px;display:block">Portero (nº1):</label>
            ${colorSwatches(ejP._addingRival?ejP.rivalGkColor:ejP.myGkColor, true, false, ejP._addingRival?'ejSetRivalGkColor':'ejSetMyGkColor')}`}
            <div class="ej-size-row" style="margin-top:6px">
                <span>Tamaño:</span>
                ${['small','medium','large'].map(s=>
                    `<button class="ej-sz${ejP.selectedSize===s?' active':''}" onclick="ejSetSize('${s}')">${s==='small'?'S':s==='medium'?'M':'L'}</button>`
                ).join('')}
            </div>
            <label class="ej-check"><input type="checkbox" ${ejP.hasVest?'checked':''} onchange="ejSetVest(this.checked)"> Con peto</label>
            ${ejP.hasVest ? `<div class="ej-swatches">${
                Object.entries(EJ_TEAM_COLORS).filter(([,v])=>!v.striped).map(([k,v])=>
                    `<div class="ej-swatch${ejP.vestColor===k?' active':''}" style="background:${v.fill}" onclick="ejSetVestColor('${k}')"></div>`
                ).join('')
            }</div>` : ''}
            <div style="font-size:10px;color:#64748b;margin-top:4px">Se aplica a los jugadores ${ejP._addingRival?'del rival':'de mi equipo'} que ya están en la pizarra y a los nuevos.</div>
        </div>` : ''}
        ${selPlayer ? `
        <div class="ej-selected-block">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Jugador seleccionado</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <label style="font-size:11px;color:#9ca3af">Nº camiseta:</label>
                <input type="text" value="${selPlayer.number||''}" maxlength="3"
                    onchange="ejChangePlayerNumber(this.value)"
                    style="width:50px;padding:4px 6px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;font-size:14px;font-weight:700;text-align:center"/>
                <label style="font-size:11px;color:#9ca3af;margin-left:4px">
                    <input type="checkbox" ${selPlayer.showNumber?'checked':''} onchange="ejTogglePlayerNumber(this.checked)"> Ver nº
                </label>
            </div>
            <label style="font-size:11px;color:#9ca3af">Cambiar color:</label>
            ${colorSwatches(selPlayer.color, true, true, 'ejChangePlayerColor')}
        </div>` : ''}
    </div>` : ''}

    <!-- SECCIÓN CAMPO -->
    ${sectionHeader('campo','🏟️','Campo')}
    ${ejP.expandedSection === 'campo' ? `
    <div class="ej-section-body">
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Tipo de campo</div>
        <div class="ej-field-btns">
            ${['full','half','halfDown','blank','artificial'].map(f=>`<button class="ej-btn-sm${ejP.fieldType===f?' active':''}" onclick="ejSetField('${f}')">${f==='full'?'Completo':f==='half'?'Medio ↑':f==='halfDown'?'Medio ↓':f==='blank'?'Libre':'Artificial'}</button>`).join('')}
            <button class="ej-btn-sm${ejP.showCarriles?' active':''}" onclick="ejToggleCarriles()" title="5 carriles del juego posicional"><i class="ej-ico ej-ico-carriles"></i> Carriles</button>
            <button class="ej-btn-sm${ejP.showZonas?' active':''}" onclick="ejToggleZonas()" title="3 tercios del campo"><i class="ej-ico ej-ico-zonas"></i> Zonas</button>
        </div>
        <div class="ej-field-btns" style="margin-top:6px">
            <button class="ej-btn-sm${ejP.showRejilla?' active':''}" onclick="ejToggleRejilla()" title="Rejilla de metros del campo Artificial (105x65, marcas cada 5 m)"><i class="ej-ico ej-ico-rejilla"></i> Rejilla</button>
        </div>
        <div style="font-size:11px;color:#9ca3af;margin:10px 0 4px"><i class="ej-ico ej-ico-camara"></i> Cámara</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px">
            <button class="ej-btn-sm${!ejP.camAngle?' active':''}" onclick="ejSetCamara(0)">Cenital</button>
            <button class="ej-btn-sm${ejP.camAngle===35?' active':''}" onclick="ejSetCamara(35)">TV</button>
            <button class="ej-btn-sm${ejP.camAngle===52?' active':''}" onclick="ejSetCamara(52)">Rasante</button>
        </div>
        <input type="range" min="0" max="60" value="${ejP.camAngle||0}" oninput="ejSetCamara(parseInt(this.value))" style="width:100%;accent-color:#22c55e"/>
        ${ejP.camAngle?`<div style="font-size:10px;color:#f59e0b;margin-top:2px">Vista ${ejP.camAngle}° — puedes editar también en esta vista</div>`:''}
        <div style="font-size:11px;color:#9ca3af;margin:10px 0 4px"><i class="ej-ico ej-ico-zoom"></i> Zoom <span id="ej-zoom-pct">${Math.round((ejP.zoom||1)*100)}%</span></div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <button class="ej-btn-sm" onclick="ejZoomCambiar(-0.25)">−</button>
            <button class="ej-btn-sm" onclick="ejZoomReset()">100%</button>
            <button class="ej-btn-sm" onclick="ejZoomCambiar(0.25)">+</button>
            <button class="ej-btn-sm" onclick="ejPan(0,-1)"><i class="ej-ico ej-ico-arriba"></i></button>
            <button class="ej-btn-sm" onclick="ejPan(0,1)"><i class="ej-ico ej-ico-abajo"></i></button>
            <button class="ej-btn-sm" onclick="ejPan(-1,0)"><i class="ej-ico ej-ico-izq"></i></button>
            <button class="ej-btn-sm" onclick="ejPan(1,0)"><i class="ej-ico ej-ico-der"></i></button>
        </div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">Consejo: Ctrl + rueda del ratón para hacer zoom donde apunta el cursor</div>
        <div style="display:none">
        </div>
        <div><div class="ej-fondos-t">Fondo del campo</div>${ejFondoMiniaturas("ejSetFondo('$k')")}</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin:8px 0 2px">Color del césped</div>
        <div style="display:flex;gap:4px${ejFondoDef().color ? ';opacity:0.35' : ''}"${ejFondoDef().color ? ' title="Este fondo tiene su propio color. Al elegir un color se vuelve al césped."' : ''}>
            ${['#1a6b30','#1a8540','#2d8a4e','#0f4c2a','#1e3a5f','#0a1628','#2c2c2c','#ffffff'].map(c =>
                '<div onclick="ejSetFieldColor(\''+c+'\')" style="width:22px;height:22px;border-radius:50%;background:'+c+';cursor:pointer;border:2px solid '+(ejP.fieldColor===c?(c==='#ffffff'?'#3b82f6':'#fff'):'transparent')+(c==='#ffffff'?';box-shadow:inset 0 0 0 1px #cbd5e1':'')+'"></div>'
            ).join('')}
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#9ca3af;margin-bottom:6px">
                <input type="checkbox" ${ejP.showEII?'checked':''} onchange="ejP.showEII=this.checked;ejRenderSVG()">
                <span style="color:${ejP.showEII?'#22c55e':'#9ca3af'};font-weight:${ejP.showEII?'600':'400'}"><i class="ej-ico ej-ico-analisis"></i> Análisis de zona (EII)</span>
            </label>
            <div style="font-size:10px;color:#64748b;margin-bottom:4px">Introduce las medidas totales de tu campo (m)</div>
            <div style="display:flex;gap:4px;align-items:center">
                <input type="number" min="1" value="${ejP.fieldRealW}" onchange="ejP.fieldRealW=parseFloat(this.value)||105;ejRenderSVG()" title="Largo del campo (de portería a portería)" style="width:54px;padding:4px 6px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;font-size:12px;text-align:center">
                <span style="color:#64748b;font-size:11px">largo ×</span>
                <input type="number" min="1" value="${ejP.fieldRealH}" onchange="ejP.fieldRealH=parseFloat(this.value)||68;ejRenderSVG()" title="Ancho del campo (de banda a banda)" style="width:54px;padding:4px 6px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;font-size:12px;text-align:center">
                <span style="color:#64748b;font-size:11px">ancho m</span>
            </div>
            <div style="font-size:9px;color:#475569;margin-top:3px">El área se mantiene en 40,3 × 16,5 m; cambia lo que mide el resto</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                <span style="font-size:10px;color:#64748b">Equipos:</span>
                ${[1,2,3].map(function(nt){ return '<button onclick="ejP.numTeams='+nt+';ejRenderToolbar();ejRenderSVG()" style="width:26px;padding:3px;font-size:11px;border-radius:5px;border:1px solid '+((ejP.numTeams||2)===nt?'#22c55e':'#334155')+';background:'+((ejP.numTeams||2)===nt?'#0f4c2a':'transparent')+';color:'+((ejP.numTeams||2)===nt?'#22c55e':'#94a3b8')+';cursor:pointer">'+nt+'</button>'; }).join('')}
            </div>
        </div>
    </div>` : ''}

    <!-- SECCIÓN DIBUJO -->
    ${sectionHeader('draw','✏️','Dibujo')}
    ${drawOpen ? `
    <div class="ej-section-body">
        ${ejP.animMode ? `<div class="ej-trazo-modo" style="margin-bottom:8px">
            <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Al trazar desde una ficha o el balón</div>
            <div style="display:flex;gap:4px;background:#0b1220;padding:3px;border-radius:8px;border:1px solid #2f405c">
                <button type="button" onclick="ejAnimTrazoModo(true)" title="El trazo es la orden de moverse: la ficha o el balón irá hasta donde acabe" style="flex:1;border:none;border-radius:6px;padding:6px 4px;font-size:11px;font-weight:700;cursor:pointer;${ejP.animTrazoMueve !== false ? 'background:#facc15;color:#1e293b' : 'background:none;color:#94a3b8'}"><i class="ej-ico ej-ico-mover"></i> Lo mueve</button>
                <button type="button" onclick="ejAnimTrazoModo(false)" title="El trazo es solo un dibujo: se queda pintado y la ficha no se mueve" style="flex:1;border:none;border-radius:6px;padding:6px 4px;font-size:11px;font-weight:700;cursor:pointer;${ejP.animTrazoMueve === false ? 'background:#3b82f6;color:#fff' : 'background:none;color:#94a3b8'}"><i class="ej-ico ej-ico-lapiz"></i> Solo dibuja</button>
            </div>
            <div style="font-size:10px;color:#94a3b8;margin-top:4px;line-height:1.3">${ejP.animTrazoMueve !== false ? 'La flecha amarilla marca el recorrido hasta el siguiente fotograma.' : 'La flecha se queda dibujada desde este fotograma. Nada se mueve.'}</div>
        </div>` : ''}
        <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Herramientas</div>
        <div class="ej-equipment-grid">
            ${[
                {k:'pencil',  ico:'lapiz', lbl:'Lápiz'},
                {k:'arrow',   ico:'flecha', lbl:'Flecha'},
                {k:'curved',  ico:'curva', lbl:'Curva'},
                {k:'dribble', ico:'conduccion', lbl:'Conducción'},
                {k:'line',    ico:'linea', lbl:'Línea'},
                {k:'rect',    ico:'rect', lbl:'Rect.'},
                {k:'ellipse', ico:'circulo', lbl:'Círculo'},
                {k:'text',    ico:'texto',  lbl:'Texto'},
                {k:'connect', ico:'conectar', lbl:'Conectar'}
            ].map(item=>`<button class="ej-btn-equipment${t===item.k?' active':''}" onclick="ejSetTool(ejP.activeTool==='${item.k}'?'select':'${item.k}')" title="${item.lbl}"><i class="ej-ico ej-ico-${item.ico}" style="font-size:19px"></i><span>${item.lbl}</span></button>`).join('')}
        </div>
        <div class="ej-draw-opts" style="margin-top:8px">
            <span>Grosor: <input type="range" min="1" max="10" value="${ejP.lineWidth}" oninput="ejP.lineWidth=+this.value" style="width:80px;vertical-align:middle;accent-color:#22c55e"></span>
            <label><input type="checkbox" ${ejP.lineDashed?'checked':''} onchange="ejP.lineDashed=this.checked;ejRenderToolbar()"> Discontinua</label>
        </div>
        <div class="ej-draw-opts" style="margin-top:6px;padding-top:6px;border-top:1px solid #1e293b">
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#9ca3af">
                <input type="checkbox" ${ejP.shapeFill?'checked':''} onchange="ejP.shapeFill=this.checked;ejRenderToolbar()">
                <span style="color:${ejP.shapeFill?'#22c55e':'#9ca3af'};font-weight:${ejP.shapeFill?'600':'400'}"><i class="ej-ico ej-ico-paleta"></i> Relleno zona</span>
            </label>
            ${ejP.shapeFill ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px"><span style="font-size:10px;color:#64748b">Tipo:</span><button onclick="ejP.shapeFillType='solid';ejRenderToolbar()" style="padding:2px 8px;font-size:10px;border-radius:4px;border:1px solid ${ejP.shapeFillType==='solid'?'#22c55e':'#334155'};background:${ejP.shapeFillType==='solid'?'#0f4c2a':'transparent'};color:${ejP.shapeFillType==='solid'?'#22c55e':'#64748b'};cursor:pointer">Sólido</button><button onclick="ejP.shapeFillType='hatched';ejRenderToolbar()" style="padding:2px 8px;font-size:10px;border-radius:4px;border:1px solid ${ejP.shapeFillType==='hatched'?'#f97316':'#334155'};background:${ejP.shapeFillType==='hatched'?'#78350f':'transparent'};color:${ejP.shapeFillType==='hatched'?'#f97316':'#64748b'};cursor:pointer">Rallado</button></div>` : ''}
            ${ejP.shapeFill ? '<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><span style="font-size:10px;color:#64748b">Opacidad:</span><input type="range" min="10" max="70" value="'+Math.round(ejP.shapeFillOpacity*100)+'" oninput="ejP.shapeFillOpacity=this.value/100;ejRenderToolbar()" style="width:80px;accent-color:#22c55e"><span style="font-size:10px;color:#94a3b8;min-width:28px">'+Math.round(ejP.shapeFillOpacity*100)+'%</span></div>' : ''}
        </div>
        <label style="font-size:11px;color:#9ca3af;margin-top:4px">Color de línea:</label>
        <div class="ej-line-colors">
            ${EJ_LINE_COLORS.map(c=>`<div class="ej-lcolor${ejP.lineColor===c.c?' active':''}" style="background:${c.c}" title="${c.n}" onclick="ejP.lineColor='${c.c}';ejRenderToolbar()"></div>`).join('')}
        </div>
        ${selText ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155;background:#0b1220;border:1px solid #2f405c;border-radius:8px;padding:8px">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Texto seleccionado</div>
            <button onclick="ejEditarTexto()" style="width:100%;padding:7px;margin-bottom:8px;background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600"><i class="ej-ico ej-ico-lapiz"></i> Editar texto</button>
            <label style="font-size:11px;color:#9ca3af;display:block;margin-bottom:3px">Tipo de letra:</label>
            <select onchange="ejChangeTextFont(this.value)" style="width:100%;padding:5px 6px;margin-bottom:8px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:6px;font-size:12px;cursor:pointer">
                ${[['system-ui, sans-serif','Moderna'],['Georgia, serif','Clásica'],["'Arial Black', Impact, sans-serif",'Titular'],["'Trebuchet MS', sans-serif",'Redondeada'],["'Courier New', monospace",'Máquina']].map(function(o){ var cur=(selText.font||'system-ui, sans-serif')===o[0]; return '<option value="'+o[0]+'"'+(cur?' selected':'')+' style="font-family:'+o[0]+'">'+o[1]+'</option>'; }).join('')}
            </select>
            <div class="ej-size-row" style="margin-bottom:6px">
                <span style="font-size:11px;color:#9ca3af">Tamaño:</span>
                ${[['S',14],['M',18],['L',26],['XL',36]].map(function(o){ return '<button class="ej-sz'+(((selText.size||18)===o[1])?' active':'')+'" onclick="ejChangeTextSize('+o[1]+')">'+o[0]+'</button>'; }).join('')}
            </div>
            <label class="ej-check"><input type="checkbox" ${selText.bold?'checked':''} onchange="ejToggleTextBold(this.checked)"> Negrita</label>
            <label class="ej-check"><input type="checkbox" ${selText.bg?'checked':''} onchange="ejToggleTextBg(this.checked)"> Recuadro de fondo</label>
            <label style="font-size:11px;color:#9ca3af;margin-top:4px;display:block">Color del texto:</label>
            <div class="ej-line-colors">
                ${EJ_LINE_COLORS.map(function(c){ return '<div class="ej-lcolor'+((selText.color===c.c)?' active':'')+'" style="background:'+c.c+'" title="'+c.n+'" onclick="ejChangeTextColor(\''+c.c+'\')"></div>'; }).join('')}
            </div>
        </div>` : ''}
        <div class="ej-actions-row" style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <button class="ej-act-btn undo" onclick="ejUndo()" title="Deshacer (Ctrl+Z)"><i class="ej-ico ej-ico-deshacer"></i> Deshacer</button>
            <button class="ej-act-btn redo" onclick="ejRedo()" title="Rehacer (Ctrl+Y)"><i class="ej-ico ej-ico-rehacer"></i> Rehacer</button>
        </div>
    </div>` : ''}
    <!-- SECCIÓN MATERIAL -->
    ${sectionHeader('material','🏅','Material')}
    ${ejP.expandedSection === 'material' ? `
    <div class="ej-section-body">
        <div class="ej-equipment-grid">
            ${EJ_EQUIPMENT_TYPES.map(eq => `
            <button class="ej-btn-equipment${ejP.selectedEquipmentType===eq.key&&t==='equipment'?' active':''}"
                onclick="if(ejP.activeTool==='equipment'&&ejP.selectedEquipmentType==='${eq.key}'){ejSetTool('select')}else{ejP.selectedEquipmentType='${eq.key}';ejSetTool('equipment')}"
                title="${eq.name}">
                <img src="${EJ_EQUIPMENT_IMAGES[eq.key]}" alt="${eq.name}" class="ej-eq-thumb"/>
                <span>${eq.name}</span>
            </button>`).join('')}
    </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Tamaño al colocar: <strong style="color:#fff">×${(ejP.equipDefaultMul||1).toFixed(2)}</strong></div>
            <div style="display:flex;gap:4px">
                <button onclick="ejChangeEquipDefault('down')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#f97316;border-radius:6px;cursor:pointer">− Menor</button>
                <button onclick="ejChangeEquipDefault('up')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#22c55e;border-radius:6px;cursor:pointer">+ Mayor</button>
            </div>
        </div>
          <div style="margin-top:6px">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Color al colocar (conos, discos, aros...):</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">${EJ_EQUIP_COLORS.map(function(c){ var call = c.c ? "ejSetEquipDefaultColor('"+c.c+"')" : "ejSetEquipDefaultColor(null)"; var bg = c.c || "conic-gradient(from 0deg,#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)"; var brd = ((ejP.equipDefaultColor||null)===c.c) ? "#22c55e" : "#334155"; return '<div title="'+c.n+'" onclick="'+call+'" style="width:20px;height:20px;border-radius:50%;cursor:pointer;border:2px solid '+brd+';background:'+bg+'"></div>'; }).join('')}</div>
        </div>
        ${selEquipment ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334155">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Material seleccionado: <strong style="color:#fff">${EJ_EQUIPMENT_TYPES.find(e=>e.key===selEquipment.eqType)?.name||''}</strong></div>
            <div style="display:flex;gap:4px;margin-bottom:6px">
                <button onclick="ejChangeEquipmentSize('down')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#f97316;border-radius:6px;cursor:pointer">− Menor</button>
                <button onclick="ejChangeEquipmentSize('up')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#22c55e;border-radius:6px;cursor:pointer">+ Mayor</button>
            </div>
            ${EJ_COLORABLE_EQUIP.includes(selEquipment.eqType) ? `<div style="font-size:11px;color:#9ca3af;margin:2px 0 4px">Color:</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${EJ_EQUIP_COLORS.map(function(c){ var call = c.c ? "ejChangeEquipmentColor('"+c.c+"')" : "ejChangeEquipmentColor(null)"; var bg = c.c || "conic-gradient(from 0deg,#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)"; var brd = ((selEquipment.color||null)===c.c) ? "#22c55e" : "#334155"; return '<div title="'+c.n+'" onclick="'+call+'" style="width:20px;height:20px;border-radius:50%;cursor:pointer;border:2px solid '+brd+';background:'+bg+'"></div>'; }).join('')}</div>` : ''}
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Rotación: ${selEquipment.rotation||0}°</div>
            <div style="display:flex;gap:3px;margin-bottom:4px">
                <button onclick="ejRotateEquipment(-45)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">−45°</button>
                <button onclick="ejRotateEquipment(-10)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">−10°</button>
                <button onclick="ejRotateEquipment(10)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">+10°</button>
                <button onclick="ejRotateEquipment(45)" style="flex:1;padding:4px;font-size:10px;background:#1e293b;border:1px solid #334155;color:#9ca3af;border-radius:4px;cursor:pointer">+45°</button>
            </div>
            <input type="range" min="0" max="359" value="${selEquipment.rotation||0}" oninput="ejRotateEquipment(parseInt(this.value)-(${selEquipment.rotation||0}))" style="width:100%;accent-color:#a855f7"/>
        </div>` : ''}
    </div>` : ''}


    <!-- BOTONES PRINCIPALES -->
    <button type="button" class="ej-anim-btn${ejP.animMode ? ' on' : ''}" onclick="ejAnimConmutar()">${ejP.animMode ? '<i class="ej-ico ej-ico-animar"></i> Quitar animación' : '<i class="ej-ico ej-ico-animar"></i> Animar'}</button>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${ejP.animMode && ejEditandoId ? '' : '<button class="ej-act-btn purple full" onclick="ejCapturarParaFicha()" style="width:100%;padding:10px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600"><i class="ej-ico ej-ico-guardar"></i> Guardar ejercicio</button>'}
        <button class="ej-act-btn green full" onclick="ejExportPNG()" style="width:100%;padding:8px;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:12px"><i class="ej-ico ej-ico-descargar"></i> Exportar PNG</button>
        <button class="ej-act-btn full" onclick="ejMontajeAbrir()" style="width:100%;padding:8px;background:#7c2d12;border:1px solid #9a3412;color:#fdba74;border-radius:8px;cursor:pointer;font-size:12px;margin-top:6px"><i class="ej-ico ej-ico-montaje"></i> Guardar montaje de sesion</button>
        <button class="ej-act-btn red full" onclick="ejDelete()" ${!sel?'disabled':''} style="width:100%;padding:8px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px"><i class="ej-ico ej-ico-papelera"></i> Eliminar seleccionado</button>
    </div>
    `;
    ejBarrasSync();
}

function ejSvgDblClick(e) {
    var el = e.target.closest ? e.target.closest('[data-type="text"]') : null;
    if (!el) return;
    ejEditarTexto(parseInt(el.dataset.id));
}
function ejEditarTexto(id) {
    var tid = id != null ? id : ejP.selectedId;
    var t = ejP.texts.find(function(x){ return x.id === tid; });
    if (!t) return;
    ejPromptTexto('Editar texto:', t.text, function(nuevo) {
        if (nuevo != null) {
            ejSaveHistory();
            t.text = nuevo;
            ejP.selectedId = tid;
            ejRenderSVG();
            ejRenderToolbar();
        }
    });
}
function ejChangeTextColor(color) {
    if (!ejP.selectedId) return;
    ejP.texts = ejP.texts.map(function(t){ return t.id === ejP.selectedId ? Object.assign({}, t, { color: color }) : t; });
    ejSaveHistory(); ejRenderSVG(); ejRenderToolbar();
}
function ejChangeTextSize(size) {
    if (!ejP.selectedId) return;
    ejP.texts = ejP.texts.map(function(t){ return t.id === ejP.selectedId ? Object.assign({}, t, { size: size }) : t; });
    ejSaveHistory(); ejRenderSVG(); ejRenderToolbar();
}
function ejChangeTextFont(font) {
    if (!ejP.selectedId) return;
    ejP.texts = ejP.texts.map(function(t){ return t.id === ejP.selectedId ? Object.assign({}, t, { font: font }) : t; });
    ejSaveHistory(); ejRenderSVG(); ejRenderToolbar();
}
function ejToggleTextBold(b) {
    if (!ejP.selectedId) return;
    ejP.texts = ejP.texts.map(function(t){ return t.id === ejP.selectedId ? Object.assign({}, t, { bold: b }) : t; });
    ejSaveHistory(); ejRenderSVG(); ejRenderToolbar();
}
function ejToggleTextBg(b) {
    if (!ejP.selectedId) return;
    ejP.texts = ejP.texts.map(function(t){ return t.id === ejP.selectedId ? Object.assign({}, t, { bg: b }) : t; });
    ejSaveHistory(); ejRenderSVG(); ejRenderToolbar();
}
function ejToggleSection(id) {
    ejP.expandedSection = ejP.expandedSection === id ? '' : id;
    ejRenderToolbar();
}

// Wrappers para onclick (no se puede pasar booleano directamente)
function ejApplyFormation_my(key)    { ejApplyFormation(key, false); }
function ejApplyFormation_rival(key) { ejApplyFormation(key, true);  }
// ---- Equipo de un jugador (pizarras antiguas no tienen el campo team: se deduce por color) ----
function ejEsRival(p) {
    if (p.team) return p.team === 'rival';
    return p.color === ejP.rivalColor || p.color === ejP.rivalGkColor;
}
function ejEtiquetarEquipos() {
    var sinEquipo = ejP.players.filter(function(p) { return !p.team; });
    if (!sinEquipo.length) return;
    var misCols = [ejP.myColor, ejP.myGkColor], rivCols = [ejP.rivalColor, ejP.rivalGkColor];
    var pendientes = [];
    sinEquipo.forEach(function(p) {
        if (misCols.indexOf(p.color) >= 0) p.team = 'my';
        else if (rivCols.indexOf(p.color) >= 0) p.team = 'rival';
        else pendientes.push(p);
    });
    if (pendientes.length) {
        var hayMy = ejP.players.some(function(p) { return p.team === 'my'; });
        var hayRival = ejP.players.some(function(p) { return p.team === 'rival'; });
        if (hayMy && !hayRival) {
            pendientes.forEach(function(p) { p.team = 'rival'; });
        } else if (hayRival && !hayMy) {
            pendientes.forEach(function(p) { p.team = 'my'; });
        } else {
            // Ninguno identificado: el color mas repetido es mi equipo, el resto rival
            var cuenta = {};
            pendientes.forEach(function(p) { if (p.number != 1) cuenta[p.color] = (cuenta[p.color] || 0) + 1; });
            var colMy = Object.keys(cuenta).sort(function(a, b) { return cuenta[b] - cuenta[a]; })[0];
            pendientes.forEach(function(p) { p.team = (p.color === colMy || p.number == 1 && colMy === undefined) ? 'my' : 'rival'; });
        }
    }
    // Que las muestras de color reflejen lo que hay en la pizarra
    ['my', 'rival'].forEach(function(t) {
        var cuenta = {};
        ejP.players.forEach(function(p) { if (p.team === t && p.number != 1 && p.color) cuenta[p.color] = (cuenta[p.color] || 0) + 1; });
        var col = Object.keys(cuenta).sort(function(a, b) { return cuenta[b] - cuenta[a]; })[0];
        if (col) { if (t === 'my') ejP.myColor = col; else ejP.rivalColor = col; }
    });
}
function ejJugadoresDelEquipo(rival) {
    ejEtiquetarEquipos();
    return ejP.players.filter(function(p) { return p.team !== 'tarea' && (p.team === 'rival') === !!rival; });
}
function ejSetMyColor(c) {
    ejSaveHistory();
    ejJugadoresDelEquipo(false).forEach(function(p) { p.color = c; });
    ejP.myColor = c; ejRenderToolbar(); ejRenderSVG();
}
function ejSetRivalColor(c) {
    ejSaveHistory();
    ejJugadoresDelEquipo(true).forEach(function(p) { p.color = c; });
    ejP.rivalColor = c; ejRenderToolbar(); ejRenderSVG();
}
// Apariencia: aplican al equipo seleccionado (pestaña Mi equipo / Rival), a los que ya están y a los nuevos
function ejSetSize(s) {
    ejSaveHistory();
    ejP.selectedSize = s;
    var scale = s === 'small' ? 0.6 : s === 'large' ? 1.4 : 1.0;
    ejJugadoresDelEquipo(ejP._addingRival).forEach(function(p) { p.scale = scale; });
    ejRenderToolbar(); ejRenderSVG();
}
function ejSetShowNumbers(v) {
    ejSaveHistory();
    ejP.showNumbers = !!v;
    var n = 0;
    ejJugadoresDelEquipo(ejP._addingRival).forEach(function(p) {
        n++;
        if (v && (p.number === undefined || p.number === null || p.number === '')) p.number = n;
        p.showNumber = !!v;
    });
    ejRenderToolbar(); ejRenderSVG();
}
function ejSetVest(v) {
    ejSaveHistory();
    ejP.hasVest = !!v;
    ejJugadoresDelEquipo(ejP._addingRival).forEach(function(p) { p.hasVest = !!v; if (v) p.vestColor = ejP.vestColor; });
    ejRenderToolbar(); ejRenderSVG();
}
function ejSetVestColor(c) {
    ejSaveHistory();
    ejP.vestColor = c;
    ejJugadoresDelEquipo(ejP._addingRival).forEach(function(p) { if (p.hasVest) p.vestColor = c; });
    ejRenderToolbar(); ejRenderSVG();
}
function ejSetMyGkColor(c)    { ejP.myGkColor   = c; ejRenderToolbar(); ejRenderSVG(); }
function ejSetRivalGkColor(c) { ejP.rivalGkColor = c; ejRenderToolbar(); ejRenderSVG(); }

// =============================================
// LAYOUT PRINCIPAL DE LA PIZARRA
// =============================================
function ejBuildPizarraLayout() {
    const root = document.getElementById('ej-pizarra-container');
    if (!root) return;
root.innerHTML = `
<div id="ej-pizarra-wrap">
        <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <div id="ej-pizarra-topbar" style="display:flex;align-items:center;justify-content:space-between;background:#1e3a5f;border:1px solid #2563eb;border-radius:8px;padding:8px 14px;margin-bottom:8px;gap:10px">
            <div style="display:flex;align-items:center;gap:8px;min-width:0">
                <span style="font-size:14px;color:#93c5fd"><i class="ej-ico ej-ico-ficha"></i></span>
                <span id="ej-pizarra-nombre-label" style="color:#93c5fd;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Pizarra libre</span>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0"><button onclick="ejProyPanel()" class="ej-tb-btn" title="Proyectos"><i class="ej-ico ej-ico-carpeta"></i><span class="ej-txt">Proyectos</span></button><button onclick="ejPresentar()" class="ej-tb-btn pri" title="Presentar a pantalla completa"><i class="ej-ico ej-ico-presentar"></i><span class="ej-txt">Presentar</span></button><button onclick="ejNuevaPizarra()" class="ej-tb-btn" title="Nueva pizarra"><i class="ej-ico ej-ico-nueva"></i><span class="ej-txt">Nueva pizarra</span></button></div>
</div>
        <div id="ej-toolbar"></div>
        </div>
        <div id="ej-canvas-area" style="position:relative">
        <div id="ej-modo-overlay" style="position:absolute;inset:0;background:rgba(15,23,42,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;border-radius:8px;gap:20px">
                <div style="color:#e2e8f0;font-size:18px;font-weight:700;text-align:center">¿Qué tipo de ejercicio quieres crear?</div>
                <div style="display:flex;gap:16px">
                    <button onclick="ejElegirModo('estatico')" style="padding:16px 32px;background:#3b82f6;border:none;color:white;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:6px">
                        <span style="font-size:28px">🖼️</span>
                        Ejercicio estático
                    </button>
                    <button onclick="ejElegirModo('animado')" style="padding:16px 32px;background:#7c3aed;border:none;color:white;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:6px">
                        <span style="font-size:28px">🎬</span>
                        Ejercicio animado
                    </button>
                </div>
                <p style="color:#64748b;font-size:12px;margin:0">Puedes cambiar de modo en cualquier momento</p>
            </div>
            <svg id="ej-svg"
                width="100%"
                viewBox="0 0 ${ejP.svgW} ${ejP.svgH}"
                style="width:100%;height:auto;display:block;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.5);touch-action:none;cursor:crosshair">
          </svg>
          <div id="ej-timeline-bar" style="display:none"></div>
        </div>
        </div>`;

    const svg = document.getElementById('ej-svg');
    svg.addEventListener('pointerdown', ejSvgPointerDown);
    svg.addEventListener('pointermove', ejSvgPointerMove);
    svg.addEventListener('pointerup',   ejSvgPointerUp);
    svg.addEventListener('pointerleave', ejSvgPointerUp);
    svg.addEventListener('dblclick', ejSvgDblClick);

    // Teclas
// Empezar con todo colapsado
    ejP.expandedSection = '';
    // Ocultar toolbar hasta que elija modo
    var tb = document.getElementById('ej-toolbar');
    if (tb) tb.style.display = 'none';
    ejSaveHistory();
    ejRenderToolbar();
    ejRenderSVG();
    // Tecla Supr para eliminar seleccionado
    document.addEventListener('keydown', function(e) {
        const foco = document.activeElement;
        const enInput = foco && (foco.tagName === 'INPUT' || foco.tagName === 'TEXTAREA');
        if (!enInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); ejUndo(); return; }
        if (!enInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); ejRedo(); return; }
        if ((e.key === 'Delete' || e.key === 'Backspace') && (ejP.selectedId || (ejP.multiSel && ejP.multiSel.length > 0))) {
            const focused = document.activeElement;
            const isInput = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
            if (!isInput) {
                e.preventDefault();
                ejDelete();
            }
        }
    });
}

// =============================================
// SECCIÓN FICHA DEL EJERCICIO
// =============================================
function ejBuildFicha() {
    const root = document.getElementById('ej-ficha-container');
    if (!root) return;
    root.innerHTML = `
    <div class="ej-ficha-form" style="max-width:960px;margin:0 auto">

        <!-- MEDIA: MINIATURA + VÍDEO -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden;margin-bottom:16px">
            <div style="padding:14px 16px;border-right:1px solid #1e3a5f">
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎨 Miniatura <button onclick="document.getElementById('ej-img-file').click()" style="float:right;padding:2px 8px;background:#7c3aed;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;text-transform:none;letter-spacing:0">📷 Subir imagen</button><input type="file" id="ej-img-file" accept="image/*" style="display:none" onchange="ejSubirImagenFicha(this)"></div>;
                <div id="ej-ficha-thumb" style="width:100%;height:200px;border-radius:8px;background:#1e3a5f;display:flex;align-items:center;justify-content:center;overflow:hidden">
                    <span style="color:#475569;font-size:11px">Dibuja en la pizarra y pulsa "Usar en ficha"</span>
                </div>
                
            </div>
            <div style="padding:14px 16px">
                <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎬 Vídeo animación</div>
                <div id="ej-ficha-video" style="width:100%;height:200px;border-radius:8px;background:#1e3a5f;display:flex;align-items:center;justify-content:center;overflow:hidden">
                    <span style="color:#475569;font-size:11px">Exporta MP4 desde la pizarra</span>
                </div>
                <div id="ej-ficha-video-btns" style="margin-top:6px;display:flex;gap:6px"></div>
            </div>
        </div>

        <!-- DATOS PRINCIPALES -->
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:16px;margin-bottom:16px">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Nombre del ejercicio *</label>
                    <input type="text" id="ej-nombre" placeholder="Ej: Rondo 4x1">
                    <div id="ej-nombre-lock-msg" style="display:none;font-size:10px;color:#64748b;margin-top:2px">🔒 El nombre no se puede cambiar</div>
                </div>
                <div class="ej-field">
                    <label>Duración (min)</label>
                    <input type="number" id="ej-duracion" min="1" max="90" placeholder="15">
                </div>
                <div class="ej-field">
                    <label>Nº jugadores</label>
                    <input type="number" id="ej-jugadores" min="1" max="30" placeholder="14" oninput="ejCalcEII()">
                </div>
                <div class="ej-field">
                    <label>Dificultad</label>
                    <select id="ej-dificultad">
                        <option value="">--</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Categoría</label>
                    <select id="ej-categoria">
                        <option value="">-- Seleccionar --</option>
                        <option>Técnica individual</option>
                        <option>Posesión</option>
                        <option>Pressing</option>
                        <option>Ataque posicional</option>
                        <option>Defensa</option>
                        <option>Transiciones</option>
                        <option>Portería</option>
                        <option>Físico</option>
                        <option>Táctica</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Categoría de edad</label>
                    <select id="ej-edad">
                        <option value="">-- Todas --</option>
                        <option>Prebenjamín</option><option>Benjamín</option><option>Alevín</option>
                        <option>Infantil</option><option>Cadete</option><option>Juvenil</option>
                        <option>Senior</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Tema</label>
                    <select id="ej-tema">
                        <option value="">-- Seleccionar --</option>
                        <option>Calentamiento</option>
                        <option>Cambios de orientación</option>
                        <option>Centros laterales</option>
                        <option>Contraataque</option>
                        <option>Defensa en bloque bajo</option>
                        <option>Defensa en inferioridad</option>
                        <option>Duelos</option>
                        <option>Finalización</option>
                        <option>Físico-Técnico</option>
                        <option>Juego de posición</option>
                        <option>Juego interior</option>
                        <option>Juegos Lúdicos</option>
                        <option>Partidos</option>
                        <option>Porteros</option>
                        <option>Posesiones</option>
                        <option>Presión</option>
                        <option>Press perdida</option>
                        <option>Progresión en el juego</option>
                        <option>Rondos</option>
                        <option>Ruedas de pases</option>
                        <option>Salida de balón</option>
                        <option>Tercer hombre</option>
                        <option>Trabajo táctico</option>
                        <option>Transiciones</option>
                        <option>Técnica individual</option>
                    </select>
                </div>
                <div class="ej-field">
                    <label>Fase de juego</label>
                    <select id="ej-fase">
                        <option value="">-- Todas --</option>
                        <option>Organización ofensiva</option>
                        <option>Organización defensiva</option>
                        <option>Transición ataque</option>
                        <option>Transición defensa</option>
                        <option>Balón parado</option>
                    </select>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px">
                <div class="ej-field">
                    <label>Nº porteros</label>
                    <input type="number" id="ej-porteros" min="0" max="4" placeholder="0"><label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;cursor:pointer;text-transform:none"><input type="checkbox" id="ej-es-portero" onchange="ejTogglePortero()"> 🧤 Específico de porteros</label><select id="ej-subcat-portero" style="display:none;margin-top:4px;width:100%"><option value="">-- Subcategoría --</option><option>Activación</option><option>Táctico</option><option>Coordinación</option><option>Juego aéreo</option><option>Juego de pies</option><option>Lúdico</option><option>Aspectos técnicos</option><option>Fuerza explosiva</option><option>Velocidad de reacción</option><option>Fuerza resistencia</option></select>
                </div>
                <div class="ej-field">
                    <label>Espacio (ancho × largo)</label>
                    <div style="display:flex;gap:4px;align-items:center">
                        <input type="number" id="ej-ancho" placeholder="20" min="1" oninput="ejCalcEII()" style="width:60px">
                        <span style="color:#64748b;font-size:12px">×</span>
                        <input type="number" id="ej-largo" placeholder="25" min="1" oninput="ejCalcEII()" style="width:60px">
                        <span style="color:#64748b;font-size:11px">m</span>
                    </div>
                </div>
                <div class="ej-field">
                    <label>EII</label>
                    <span id="ej-eii-display" style="color:#9ca3af;font-size:13px;padding-top:6px;display:block"></span>
                </div>
                <div class="ej-field">
                    <label>Material</label>
                    <input type="text" id="ej-material" placeholder="Conos, picas, petos...">
                </div>
            </div>
        </div>

        <!-- TEXTOS -->
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:16px;margin-bottom:16px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                <div class="ej-field">
                    <label>Objetivos</label>
                    <textarea id="ej-objetivos" rows="2" placeholder="¿Qué trabaja este ejercicio?"></textarea>
                </div>
                <div class="ej-field">
                    <label>Descripción / Desarrollo</label>
                    <textarea id="ej-descripcion" rows="2" placeholder="Describe cómo se ejecuta..."></textarea>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="ej-field">
                    <label>Variantes</label>
                    <textarea id="ej-variantes" rows="2" placeholder="Versiones más fáciles o difíciles..."></textarea>
                </div>
                <div class="ej-field">
                    <label>Notas del entrenador</label>
                    <textarea id="ej-notas" rows="2" placeholder="Observaciones, puntos clave..."></textarea>
                </div>
            </div>
        </div>

        <!-- BOTONES -->
        <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap">
        <button onclick="ejEditarDibujo()" style="padding:9px 16px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600" id="ej-btn-editar-dibujo">✏️ Editar dibujo</button>
            <button class="ej-btn-save" onclick="ejGuardarEjercicio()" style="padding:9px 22px">💾 Guardar ejercicio</button>
            <button class="ej-btn-cancel" onclick="ejLimpiarFicha()" style="padding:9px 16px">✕ Limpiar</button>
            <button onclick="ejExportarPDF()" style="padding:9px 16px;background:#7c3aed;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">📄 Exportar PDF</button>
            <button onclick="ejComunidadAbrir()" id="ej-btn-comunidad" title="Publicar una copia de este ejercicio para todos los usuarios" style="display:none;padding:9px 16px;background:#0f766e;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600"><i class="ej-ico ej-ico-comunidad"></i> Comunidad</button>
            <button onclick="ejEliminarEjercicio()" style="padding:9px 16px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px" id="ej-btn-eliminar">🗑 Eliminar</button>
        </div>
        <div id="ej-ficha-msg" style="margin-top:8px"></div>
    </div>`;
}
function ejSubirImagenFicha(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { ejToast('Imagen demasiado grande (máx. 8 MB)', 'warning'); input.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 500;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 800, 500);
            var esc = Math.min(800 / img.width, 500 / img.height);
            var w = Math.round(img.width * esc), h = Math.round(img.height * esc);
            ctx.drawImage(img, Math.round((800 - w) / 2), Math.round((500 - h) / 2), w, h);
            var dataUrl = canvas.toDataURL('image/png');
            window.ejThumbnailPendiente = dataUrl;
            window._ejPdfThumbData = dataUrl;
            ejActualizarFichaMedia();
            var msg = document.getElementById('ej-ficha-msg');
            if (msg) msg.innerHTML = '<span style="color:#a855f7">📷 Imagen cargada — se guardará con el ejercicio</span>';
            setTimeout(function(){ if (msg) msg.innerHTML = ''; }, 3000);
        };
        img.onerror = function() { ejToast('No se pudo leer la imagen', 'error'); };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
}

function ejCapturarMiniatura() {
    const svgEl = document.getElementById('ej-svg');
    if (!svgEl) { ejToast('Ve a la Pizarra y dibuja primero', 'warning'); return; }
    const thumbContainer = document.getElementById('ej-ficha-thumb');
    if (!thumbContainer) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width', '100%');
    clone.setAttribute('height', '100%');
    clone.removeAttribute('style');
    clone.style.borderRadius = '8px';
    thumbContainer.innerHTML = '';
    thumbContainer.appendChild(clone);
    window.ejThumbnailPendiente = new XMLSerializer().serializeToString(svgEl);
    if (ejEditandoId) ejPizarraDeId = ejEditandoId;
    ejPrepararThumbParaPDF();
    const msg = document.getElementById('ej-ficha-msg');
    if (msg) msg.innerHTML = '<span style="color:#a855f7">📸 Miniatura capturada — se guardará con el ejercicio</span>';
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 3000);
}

function ejActualizarFichaMedia() {
    // Miniatura — usar siempre <img> (como el Banco)
    const thumbContainer = document.getElementById('ej-ficha-thumb');
    if (thumbContainer) {
        const svgSource = window.ejThumbnailPendiente;
        if (svgSource) {
            var imgSrc = '';
            var trimmed = (typeof svgSource === 'string') ? svgSource.trim() : svgSource;
            if (trimmed.indexOf('data:') === 0) {
                imgSrc = trimmed;
            } else {
                try {
                    var blob = new Blob([trimmed], {type: 'image/svg+xml'});
                    imgSrc = URL.createObjectURL(blob);
                } catch(e) { console.warn('Blob thumb error', e); }
            }
            if (imgSrc) {
                thumbContainer.innerHTML = '<img src="' + imgSrc + '" style="width:100%;height:100%;object-fit:contain;border-radius:8px;display:block">';
            }
        } else {
            thumbContainer.innerHTML = '<span style="color:#475569;font-size:11px">Dibuja en la pizarra y pulsa "Usar en ficha"</span>';
        }
    }
    // Vídeo
    const videoContainer = document.getElementById('ej-ficha-video');
    const videoBtns = document.getElementById('ej-ficha-video-btns');
    const url = ejP._lastVideoUrl;
    if (videoContainer) {
        if (url) {
            videoContainer.innerHTML = '<video src="'+url+'" controls playsinline loop style="width:100%;height:100%;border-radius:8px;background:#000"></video>';
            if (videoBtns) videoBtns.innerHTML = '<a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url='+encodeURIComponent(url)+'" target="_blank" style="flex:1;padding:8px;background:#f97316;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;text-align:center;text-decoration:none">📥 Descargar MP4</a>';
        } else {
            videoContainer.innerHTML = '<span style="color:#475569;font-size:11px">Exporta MP4 desde la pizarra</span>';
            if (videoBtns) videoBtns.innerHTML = '';
        }
    }
}

function ejExportarPDF() {
    const nombre = document.getElementById('ej-nombre')?.value?.trim();
    if (!nombre) { ejToast('Pon un nombre al ejercicio primero', 'warning'); return; }

    const svgSource = window.ejThumbnailPendiente;
    if (svgSource && !window._ejPdfThumbData) {
        ejPrepararThumbParaPDF();
        setTimeout(() => ejGenerarPDF(nombre), 600);
    } else {
        ejGenerarPDF(nombre);
    }
}

function ejGenerarPDF(nombre) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, H = 297;
    const mL = 15, mR = 15;
    const contentW = W - mL - mR;
    let y = 0;

    // === PALETA ===
    const brand    = [37, 99, 235];
    const brandDk  = [25, 70, 176];
    const black    = [33, 37, 41];
    const dark     = [55, 65, 81];
    const gray     = [107, 114, 128];
    const lightBg  = [248, 250, 252];
    const tableBg  = [241, 245, 249];
    const borderC  = [226, 232, 240];
    const accentGreen = [22, 163, 74];
    const accentAmber = [217, 119, 6];

    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
    };

    // ======================================================
    // HEADER — banda de color con marca
    // ======================================================
    doc.setFillColor(...brand);
    doc.rect(0, 0, W, 28, 'F');

    // Acento diagonal decorativo
    doc.setFillColor(...brandDk);
    doc.triangle(0, 28, 60, 28, 0, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('TopLiderCoach', mL, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 255);
    doc.text('FICHA DE EJERCICIO', mL, 18);

    // Fecha a la derecha
    const hoy = new Date();
    const fecha = hoy.getDate() + '/' + (hoy.getMonth() + 1) + '/' + hoy.getFullYear();
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 255);
    doc.text(fecha, W - mR, 12, { align: 'right' });

    y = 34;

    // ======================================================
    // NOMBRE DEL EJERCICIO
    // ======================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...black);
    doc.text(nombre, mL, y);

    // Badges inline
    const dif = getValue('ej-dificultad');
    const edad = getValue('ej-edad');
    let badgeX = mL + doc.getTextWidth(nombre) + 4;

    if (dif) {
        const difColors = {'1':[22,163,74],'2':[22,163,74],'3':[217,119,6],'4':[234,88,12],'5':[220,38,38]};
        const dc = difColors[dif] || gray;
        doc.setFillColor(...dc);
        doc.roundedRect(badgeX, y - 4.5, 18, 6, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Dif: ' + dif, badgeX + 9, y - 0.8, { align: 'center' });
        badgeX += 21;
    }
    if (edad) {
        doc.setFillColor(...tableBg);
        doc.setDrawColor(...borderC);
        doc.roundedRect(badgeX, y - 4.5, doc.getTextWidth(edad) * 0.55 + 8, 6, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...dark);
        doc.text(edad, badgeX + 4, y - 0.8);
    }

    y += 4;
    doc.setDrawColor(...brand);
    doc.setLineWidth(0.6);
    doc.line(mL, y, mL + 40, y);
    y += 6;

    // ======================================================
    // MINIATURA
    // ======================================================
    if (window._ejPdfThumbData) {
        const thumbW = contentW;
        const thumbH = thumbW * (500 / 800);
        doc.setDrawColor(...borderC);
        doc.setLineWidth(0.3);
        doc.roundedRect(mL - 0.5, y - 0.5, thumbW + 1, thumbH + 1, 2, 2, 'S');
        doc.addImage(window._ejPdfThumbData, 'PNG', mL, y, thumbW, thumbH);
        y += thumbH + 3;
    }

    // ======================================================
    // DATOS EN DOS COLUMNAS (key-value cards)
    // ======================================================
    const a = parseFloat(getValue('ej-ancho'));
    const l = parseFloat(getValue('ej-largo'));
    const j = parseFloat(getValue('ej-jugadores'));
    const eii = (a && l && j) ? ((a * l) / j).toFixed(1) + ' m2/jug' : '';
    const espacio = (a && l) ? a + ' x ' + l + ' m' : '';

    const campos = [
        { label: 'Categoria',    value: getValue('ej-categoria') },
        { label: 'Edad',         value: getValue('ej-edad') },
        { label: 'Tema',         value: getValue('ej-tema') },
        { label: 'Fase de juego',value: getValue('ej-fase') },
        { label: 'Duracion',     value: getValue('ej-duracion') ? getValue('ej-duracion') + ' min' : '' },
        { label: 'Jugadores',    value: getValue('ej-jugadores') },
        { label: 'Porteros',     value: getValue('ej-porteros') },
        { label: 'Dificultad',   value: dif },
        { label: 'Espacio',      value: espacio },
        { label: 'Material',     value: getValue('ej-material') },
        { label: 'EII',          value: eii }
    ];

    if (campos.length > 0) {
        // Fondo card
        const rows = Math.ceil(campos.length / 3);
        const cardH = rows * 12 + 4;
        doc.setFillColor(...lightBg);
        doc.roundedRect(mL, y, contentW, cardH, 2, 2, 'F');

        let cx = mL + 5;
        let cy = y + 6;
        const colW = (contentW - 10) / 3;

        campos.forEach((c, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const px = mL + 5 + col * colW;
            const py = y + 6 + row * 12;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...gray);
            doc.text(c.label.toUpperCase(), px, py);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...black);
            doc.text(c.value, px, py + 4.5);
        });

        y += cardH + 5;
    }

    // ======================================================
    // ANALISIS JUEGOS REDUCIDOS (cualidad + demandas)
    // ======================================================
    var analisisTxt = ejTextoAnalisisEII(a, l, j);
    if (analisisTxt) {
        analisisTxt = analisisTxt.replace(/ · /g, '   |   ');
        doc.setFillColor(...tableBg);
        doc.roundedRect(mL, y, contentW, 10, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...gray);
        doc.text('ANALISIS JUEGOS REDUCIDOS', mL + 4, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...black);
        doc.text(analisisTxt, mL + 4, y + 8);
        y += 13;
    }

    // ======================================================
    // SECCIONES DE TEXTO
    // ======================================================
    var sections = [
        { t: 'Objetivos', v: getValue('ej-objetivos') || '—' },
        { t: 'Descripcion / Desarrollo', v: getValue('ej-descripcion') || '—' },
        { t: 'Variantes', v: getValue('ej-variantes') || '—' },
        { t: 'Notas del entrenador', v: getValue('ej-notas') || '—' }
    ];

    var colW2 = (contentW - 6) / 2;
    for (var si = 0; si < sections.length; si += 2) {
        if (y > H - 30) { doc.addPage(); y = 15; }
        for (var ci = 0; ci < 2; ci++) {
            var sec = sections[si + ci];
            if (!sec) break;
            var sx = mL + ci * (colW2 + 6);
            doc.setFillColor(...brand);
            doc.rect(sx, y, 1, 5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...brand);
            doc.text(sec.t, sx + 3, y + 3.5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...dark);
            var lines = doc.splitTextToSize(sec.v, colW2 - 6);
            if (lines.length > 4) lines = lines.slice(0, 4);
            doc.text(lines, sx + 3, y + 8);
        }
        var maxLines = 4;
        y += 8 + maxLines * 3.5 + 4;
    }

    // ======================================================
    // FOOTER
    // ======================================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Línea fina
        doc.setDrawColor(...borderC);
        doc.setLineWidth(0.2);
        doc.line(mL, H - 12, W - mR, H - 12);

        // Banda de color fina
        doc.setFillColor(...brand);
        doc.rect(0, H - 4, W, 4, 'F');

        // Texto footer
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text('TopLiderCoach HUB  |  toplidercoach.com', mL, H - 7);
        doc.text('Pag. ' + i + ' / ' + pageCount, W - mR, H - 7, { align: 'right' });
    }

    // ======================================================
    // GUARDAR
    // ======================================================
    const filename = nombre.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    doc.save('Ejercicio_' + filename + '.pdf');
}
function ejComprimirThumbSVG(svgStr) {
    var campo = '<rect width="800" height="500" fill="#1a6b30"/>'
        + '<clipPath id="fc"><rect x="20" y="15" width="760" height="470" rx="1"/></clipPath>'
        + '<g clip-path="url(#fc)">'
        + '<rect x="20" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="83" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="147" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="210" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="274" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="337" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '<rect x="400" y="15" width="64" height="470" fill="#207332"/>'
        + '<rect x="464" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '<rect x="527" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="590" y="15" width="64" height="470" fill="#1a6b30"/>'
        + '<rect x="654" y="15" width="63" height="470" fill="#207332"/>'
        + '<rect x="717" y="15" width="63" height="470" fill="#1a6b30"/>'
        + '</g>'
        + '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<rect x="20" y="15" width="760" height="470" rx="1"/>'
        + '<line x1="400" y1="15" x2="400" y2="485"/>'
        + '<circle cx="400" cy="250" r="65"/>'
        + '<rect x="20" y="105" width="119" height="290"/>'
        + '<rect x="661" y="105" width="119" height="290"/>'
        + '<rect x="20" y="184" width="40" height="132"/>'
        + '<rect x="740" y="184" width="40" height="132"/>'
        + '<rect x="10" y="220" width="10" height="60"/>'
        + '<rect x="780" y="220" width="10" height="60"/>'
        + '<path d="M139 198 A65 65 0 0 1 139 302"/>'
        + '<path d="M661 198 A65 65 0 0 0 661 302"/>'
        + '<path d="M20 22 A7 7 0 0 1 27 15"/>'
        + '<path d="M773 15 A7 7 0 0 1 780 22"/>'
        + '<path d="M780 478 A7 7 0 0 1 773 485"/>'
        + '<path d="M27 485 A7 7 0 0 1 20 478"/>'
        + '</g>'
        + '<circle cx="400" cy="250" r="3.5" fill="#fff"/>'
+ '<circle cx="100" cy="250" r="3.5" fill="#fff"/>'
        + '<circle cx="700" cy="250" r="3.5" fill="#fff"/>';
    return svgStr
        .replace(/<image[^>]*href="data:image\/webp;base64,[^"]*"[^>]*data-bg="1"[^>]*\/>/g, campo)
        .replace(/<image[^>]*data-bg="1"[^>]*href="data:image\/webp;base64,[^"]*"[^>]*\/>/g, campo)
        .replace(/<image[^>]*href="data:image\/svg\+xml;base64,[^"]*"[^>]*data-bg="1"[^>]*\/>/g, campo)
        .replace(/<image[^>]*data-bg="1"[^>]*href="data:image\/svg\+xml;base64,[^"]*"[^>]*\/>/g, campo)
        .replace(/<image[^>]*data-bg="1"[^>]*href="data:image\/png;base64,[^"]*"[^>]*\/?>(<\/image>)?/g, '');
}
// ---- Miniatura compacta ----
// El dibujo se guarda como una foto comprimida metida en un SVG mínimo, en vez de como el dibujo
// vectorial entero (que arrastra dentro cada cono, balón, foto y escudo y pesa cerca de 1 MB).
// Sigue siendo un SVG, así que se ve igual en todos los sitios que ya pintaban miniaturas.
var EJ_MINI_W = 960, EJ_MINI_H = 600, EJ_MINI_MARCA = 'data-tlc-mini="1"';
function ejMiniaturaEsCompacta(t) {
    return typeof t === 'string' && t.length < 400000 && t.slice(0, 200).indexOf(EJ_MINI_MARCA) >= 0;
}
async function ejMiniaturaCompacta(origen) {
    if (!origen || typeof origen !== 'string') return origen || null;
    var t = origen.trim();
    if (ejMiniaturaEsCompacta(t)) return t;      // ya lo está: no se vuelve a comprimir
    var temporal = null;
    try {
        var W = EJ_MINI_W, H = EJ_MINI_H, esFoto = t.indexOf('data:') === 0, src = t;
        if (!esFoto) {
            // Solo se retoca la etiqueta inicial (medidas fijas, sin estilos) y se pinta desde un archivo
            // temporal en memoria: así aguanta también miniaturas antiguas de muchos MB
            var ini = t.match(/<svg\b[^>]*>/);
            if (!ini) return origen;
            var etiqueta = ini[0].replace(/\s(width|height|style)="[^"]*"/g, '').replace(/^<svg/, '<svg width="' + W + '" height="' + H + '"');
            temporal = URL.createObjectURL(new Blob([t.slice(0, ini.index), etiqueta, t.slice(ini.index + ini[0].length)], { type: 'image/svg+xml' }));
            src = temporal;
        }
        var img = new Image();
        img.src = src;
        await img.decode();
        var lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        var ctx = lienzo.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        if (esFoto) {
            // Una imagen subida entra entera, centrada, sin deformarse
            var iw = img.naturalWidth || W, ih = img.naturalHeight || H, esc = Math.min(W / iw, H / ih);
            var dw = Math.round(iw * esc), dh = Math.round(ih * esc);
            ctx.drawImage(img, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
        } else {
            ctx.drawImage(img, 0, 0, W, H);
        }
        var datos = lienzo.toDataURL('image/webp', 0.82);
        if (datos.indexOf('data:image/webp') !== 0) datos = lienzo.toDataURL('image/jpeg', 0.85);
        return '<svg xmlns="http://www.w3.org/2000/svg" ' + EJ_MINI_MARCA + ' viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%">'
            + '<image href="' + datos + '" x="0" y="0" width="' + W + '" height="' + H + '"/></svg>';
    } catch (e) {
        console.warn('ejMiniaturaCompacta: se guarda sin comprimir:', e && e.message);
        return origen;
    } finally {
        if (temporal) URL.revokeObjectURL(temporal);
    }
}
function ejPrepararThumbParaPDF() {
    const svgSource = window.ejThumbnailPendiente || (() => {
        const el = document.getElementById('ej-svg');
        return el ? new XMLSerializer().serializeToString(el) : null;
    })();
    if (!svgSource) return;
    // Si ya es data URL (PNG/JPG), usarlo directamente para el PDF
    if (typeof svgSource === 'string' && svgSource.trim().indexOf('data:') === 0) {
        window._ejPdfThumbData = svgSource.trim();
        return;
    }
    const parser = new DOMParser();
    const clone = parser.parseFromString(svgSource, 'image/svg+xml').documentElement;
    clone.setAttribute('width', 800);
    clone.setAttribute('height', 500);
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, 800, 500);
        window._ejPdfThumbData = canvas.toDataURL('image/png');
    };
    img.onerror = () => {
        console.warn('ejPrepararThumbParaPDF: fallo al cargar SVG');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
async function ejEliminarDesdeBanco(id) {
    const e = ejBancoCache.find(x => x.id === id);
    ejConfirm('¿Eliminar "' + (e ? e.name : '') + '"? No se puede deshacer.', async () => {
    try {
        const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', id);
        if (error) throw error;
        ejBancoCache = ejBancoCache.filter(x => x.id !== id);
        ejBancoSearch();
    } catch(err) {
        ejToast('Error: ' + err.message, 'error');
    }
    });
}
async function ejEliminarEjercicio() {
    if (!ejEditandoId) { ejToast('No hay ejercicio cargado para eliminar', 'warning'); return; }
    ejConfirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.', async () => {
    try {
        const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', ejEditandoId);
        if (error) throw error;
        ejBancoCache = ejBancoCache.filter(x => x.id !== ejEditandoId);
        ejEditandoId = null;
        ejP._lastVideoUrl = null;
        window.ejThumbnailPendiente = null;
        ejLimpiarFicha();
        ejBuildFicha();
        ejShowTab('banco', document.querySelector('[onclick*="\'banco\'"]'));
    } catch(err) {
        ejToast('Error al eliminar: ' + err.message, 'error');
    }
    });
}
function ejAutoRellenarEIIDesdePizarra() {
    // Coge el rectángulo con más jugadores dentro (la zona de análisis principal)
    var mejor = null, maxJug = 0;
    for (var i = 0; i < ejP.shapes.length; i++) {
        var s = ejP.shapes[i];
        if (s.type !== 'rect') continue;
        var z = ejAnalizarZona(s);
        if (z.nJug > maxJug) { maxJug = z.nJug; mejor = z; }
    }
    if (!mejor || maxJug === 0) return;
    var anchoEl = document.getElementById('ej-ancho');
    var largoEl = document.getElementById('ej-largo');
    var jugEl = document.getElementById('ej-jugadores');
    // Solo rellena lo que esté vacío, para no pisar lo que el entrenador haya escrito
    if (anchoEl && !anchoEl.value) anchoEl.value = mejor.anchoM.toFixed(1);
    if (largoEl && !largoEl.value) largoEl.value = mejor.largoM.toFixed(1);
    if (jugEl && !jugEl.value) jugEl.value = mejor.nJug;
    ejCalcEII();
}
function ejTextoAnalisisEII(a, l, j) {
    if (!a || !l || !j) return '';
    var eiiNum = (a * l) / j;
    var nEq = ejP.numTeams || 2;
    var jugEq = Math.round(j / nEq);
    var fuera = eiiNum > 300;
    var cual = ejCualidadEII(eiiNum, jugEq);
    var dem = ejDemandas(eiiNum, jugEq);
    var lbl = fuera ? 'Espacio amplio' : (cual ? cual.label : '');
    var partes = [];
    if (lbl) partes.push(lbl);
    if (dem) {
        partes.push('ACC ' + Array(dem.A + 1).join('+'));
        partes.push('FC ' + Array(dem.FC + 1).join('+'));
        partes.push('VEL ' + Array(dem.V + 1).join('+'));
    } else {
        partes.push('Fuera de rango de juego reducido');
    }
    return partes.join(' · ');
}
function ejCalcEII() {
    const a = parseFloat(document.getElementById('ej-ancho')?.value);
    const l = parseFloat(document.getElementById('ej-largo')?.value);
    const j = parseFloat(document.getElementById('ej-jugadores')?.value);
    const el = document.getElementById('ej-eii-display');
    if (!el) return;
    if (a && l && j) {
        var eiiNum = (a * l) / j;
        var nEq = ejP.numTeams || 2;
        var jugEq = Math.round(j / nEq);
        var fuera = eiiNum > 300;
        var cual = ejCualidadEII(eiiNum, jugEq);
        var dem = ejDemandas(eiiNum, jugEq);
        var col = fuera ? '#f59e0b' : (cual ? cual.col : '#9ca3af');
        var lbl = fuera ? 'ESPACIO AMPLIO' : (cual ? cual.label.toUpperCase() : '');
        var out = '<span style="color:#e2e8f0;font-weight:700">' + eiiNum.toFixed(1) + '</span> <span style="color:#64748b;font-size:11px">m²/jug</span>';
        if (lbl) out += ' <span style="background:' + col + ';color:#0f172a;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px">' + lbl + '</span>';
        if (dem) {
            out += '<div style="font-size:10px;color:#94a3b8;margin-top:3px">'
                + 'ACC <span style="color:#f97316;font-weight:700">' + Array(dem.A + 1).join('+') + '</span> · '
                + 'FC <span style="color:#ef4444;font-weight:700">' + Array(dem.FC + 1).join('+') + '</span> · '
                + 'VEL <span style="color:#3b82f6;font-weight:700">' + Array(dem.V + 1).join('+') + '</span></div>';
        } else {
            out += '<div style="font-size:10px;color:#f59e0b;margin-top:3px">Fuera de rango de juego reducido</div>';
        }
        el.innerHTML = out;
    } else {
        el.innerHTML = '';
    }
}
async function ejSubirThumbnail(ejercicioId) {
    const svgEl = document.getElementById('ej-pizarra-svg');
    if (!svgEl) return null;
    try {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const res = await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-thumbnail.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer toplider_thumb_2026'
            },
            body: JSON.stringify({ svg: svgData, id: String(ejercicioId) })
        });
        const data = await res.json();
        return data.ok ? data.url : null;
    } catch (e) {
        console.warn('Error subiendo thumbnail:', e);
        return null;
    }
}
async function ejEditarDibujo() {
    if (!ejEditandoId) {
        ejToast('Primero guarda el ejercicio para poder editar el dibujo.', 'warning');
        return;
    }
    try {
        var res = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (res.error) throw res.error;
        var data = res.data;
        ejPizarraDeId = data.id;
        if (!data.board_data) {
            // No hay dibujo, abrir pizarra con selector de modo
            var overlay = document.getElementById('ej-modo-overlay');
            if (overlay) overlay.style.display = 'flex';
            var tb = document.getElementById('ej-toolbar');
            if (tb) tb.style.display = 'none';
            ejShowTab('pizarra', document.querySelector('[onclick*="pizarra"]'));
            return;
        }
        // Cargar dibujo
        ejP.players   = ejColoresResolver(data.board_data.players || []);
        ejP.lines     = data.board_data.lines   || [];
        ejP.shapes    = data.board_data.shapes  || [];
        ejP.texts     = data.board_data.texts   || [];
        ejP.equipment = data.board_data.equipment || [];
        ejP.connections = data.board_data.connections || [];
        ejP.fieldType = data.board_data.fieldType || 'full'; ejFondoCargar(data.board_data); ejP.showCarriles = !!data.board_data.showCarriles; ejP.showZonas = !!data.board_data.showZonas; ejP.showRejilla = !!data.board_data.showRejilla;
        ejP.selectedId = null;
        ejP._lastVideoUrl = data.animation_url || null;

        ejP.nextId = [].concat(ejP.players, ejP.lines, ejP.shapes, ejP.texts, ejP.equipment, ejP.connections).reduce(function(max, e){ return (e.id > max ? e.id : max); }, 0) + 1;
        
        // Ocultar overlay y mostrar toolbar
        var overlay = document.getElementById('ej-modo-overlay');
        if (overlay) overlay.style.display = 'none';
        var tb = document.getElementById('ej-toolbar');
        if (tb) tb.style.display = '';
        
        // Activar modo correcto
        if (data.board_data.animMode) {
            ejP.animMode = true;
            if (data.board_data.animFrames && data.board_data.animFrames.length > 0) {
                ejP.frames = data.board_data.animFrames;
                ejP.currentFrame = 0;
                ejFrameRestore(ejP.frames[0]);
            }
            var bar = document.getElementById('ej-timeline-bar');
            if (bar) bar.style.display = 'block';
            ejRenderTimeline();
        } else {
            ejP.animMode = false;
            ejP.frames = [];
            ejP.currentFrame = 0;
            var bar = document.getElementById('ej-timeline-bar');
            if (bar) bar.style.display = 'none';
        }
        
        // Mostrar nombre en topbar
        var lbl = document.getElementById('ej-pizarra-nombre-label');
        if (lbl) lbl.textContent = data.name;
        
        ejRenderSVG();
        ejRenderToolbar();
        ejShowTab('pizarra', document.querySelector('[onclick*="pizarra"]'));
    } catch(err) {
        ejToast('Error al cargar dibujo: ' + err.message, 'error');
    }
}
async function ejGuardarEjercicio() {
    const nombre = document.getElementById('ej-nombre')?.value?.trim();
    if (!nombre) { ejToast('El nombre del ejercicio es obligatorio', 'warning'); return; }

    const msg = document.getElementById('ej-ficha-msg');
    if (msg) msg.innerHTML = '<span style="color:#9ca3af">Guardando...</span>';

    const a = parseFloat(document.getElementById('ej-ancho')?.value) || null;
    const l = parseFloat(document.getElementById('ej-largo')?.value) || null;
    const j = parseFloat(document.getElementById('ej-jugadores')?.value) || null;
    const eii = (a && l && j) ? parseFloat(((a * l) / j).toFixed(2)) : null;

    // ¿El dibujo de la pizarra es el de este ejercicio? (nuevo, o cargado con Editar / Editar dibujo / Usar en ficha)
    const ejConDibujo = !ejEditandoId || ejPizarraDeId === ejEditandoId;
    // Capturar miniatura del SVG
let thumbnailSvg = window.ejThumbnailPendiente || null;
    if (!thumbnailSvg && ejConDibujo) {
        const svgEl = document.getElementById('ej-svg');
        if (svgEl) thumbnailSvg = new XMLSerializer().serializeToString(svgEl);
    }
    if (thumbnailSvg) {
        thumbnailSvg = thumbnailSvg
            .replace(/width="[^"]*"/, 'width="100%"')
            .replace(/height="[^"]*"/, 'height="100%"');
    }
    window.ejThumbnailPendiente = null;

    const data = {
        club_id:     window.ejClubId || null,
        coach_id:    window.ejCoachId || null,
        name:        nombre,
        category:    document.getElementById('ej-categoria')?.value || null,
        age_group:   document.getElementById('ej-edad')?.value || null,
        duration_min: parseInt(document.getElementById('ej-duracion')?.value) || null,
        players_count: j,
        difficulty:  document.getElementById('ej-dificultad')?.value || null,
        game_phase:  document.getElementById('ej-fase')?.value || null,
        objectives:  document.getElementById('ej-objetivos')?.value || null,
        description: document.getElementById('ej-descripcion')?.value || null,
        variants:    document.getElementById('ej-variantes')?.value || null,
        coach_notes: document.getElementById('ej-notas')?.value || null,
        field_width:  a, field_length: l, field_area: (a && l ? a*l : null),
        eii,
        eii_analysis: ejTextoAnalisisEII(a, l, j),
        materials:   document.getElementById('ej-material')?.value || null,
        tema:        document.getElementById('ej-tema')?.value || null,
        num_goalkeepers: parseInt(document.getElementById('ej-porteros')?.value) || null,
        es_portero: !!document.getElementById('ej-es-portero')?.checked,
        subcategoria_portero: (document.getElementById('ej-es-portero')?.checked ? document.getElementById('ej-subcat-portero')?.value : null) || null,
        board_data:  (ejP.players.length > 0 || ejP.lines.length > 0 || ejP.shapes.length > 0 || ejP.equipment.length > 0 || ejP.texts.length > 0) ? {
            players: ejP.players, lines: ejP.lines,
            shapes: ejP.shapes, texts: ejP.texts,
            equipment: ejP.equipment,connections: ejP.connections,
            fieldType: ejP.fieldType, fondo: ejP.fieldFondo, fondoColor: ejP.fieldColor, showCarriles: ejP.showCarriles, showZonas: ejP.showZonas, showRejilla: ejP.showRejilla, showCarriles: ejP.showCarriles, showZonas: ejP.showZonas, showRejilla: ejP.showRejilla,
            animFrames: ejP.animMode ? ejP.frames : [],
            animMode: ejP.animMode
        } : null,
        thumbnail_svg: await ejMiniaturaCompacta((thumbnailSvg ? ejComprimirThumbSVG(thumbnailSvg) : null) || window._ejPdfThumbData),
        
        source: 'custom'
    };
    if (!ejConDibujo) {
        // Solo se han cambiado los datos de la ficha: el dibujo guardado no se toca
        delete data.board_data;
        if (!data.thumbnail_svg) delete data.thumbnail_svg;
    }

 try {
        let res, error;
        if (ejEditandoId) {
            // Actualizar ejercicio existente
            ({ data: res, error } = await supabaseClient
                .from('custom_exercises').update(data).eq('id', ejEditandoId).select());
        } else {
            // Crear nuevo ejercicio
            ({ data: res, error } = await supabaseClient
                .from('custom_exercises').insert([data]).select());
        }
        if (error) throw error;
        if (res && res[0]) {
            ejEditandoId = res[0].id;
            if (ejConDibujo) ejPizarraDeId = ejEditandoId;
            if (ejConDibujo && ejP.players.length > 0) {
                const thumbUrl = await ejSubirThumbnail(ejEditandoId);
                if (thumbUrl) {
                    await supabaseClient.from('custom_exercises').update({ thumbnail_url: thumbUrl }).eq('id', ejEditandoId);
                }
            }
        }
        // Actualizar caché local para que el Banco refleje los cambios al instante
        if (res && res[0]) {
            const idx = ejBancoCache.findIndex(x => x.id === res[0].id);
            if (idx >= 0) ejBancoCache[idx] = { ...ejBancoCache[idx], ...res[0] };
            else ejBancoCache.unshift(res[0]);
        }
        var videoAviso = ejP.animMode ? '<br><span style="color:#f97316">⚠️ Si has hecho cambios en la animación, pulsa MP4 en la pizarra para actualizar el vídeo.</span>' : '';
        if (msg) msg.innerHTML = '<span style="color:#22c55e">✅ Ejercicio guardado correctamente</span>' + videoAviso;
        setTimeout(() => { if (msg) msg.innerHTML = ''; }, 6000);
    } catch(err){
        console.error(err);
        if (msg) msg.innerHTML = `<span style="color:#ef4444">❌ Error: ${err.message}</span>`;
    }
}

function ejTogglePortero() {
    var chk = document.getElementById('ej-es-portero');
    var sel = document.getElementById('ej-subcat-portero');
    if (!chk || !sel) return;
    sel.style.display = chk.checked ? 'block' : 'none';
    if (!chk.checked) sel.selectedIndex = 0;
}

function ejLimpiarFicha() {
    ejEditandoId = null;
    ['ej-nombre','ej-objetivos','ej-descripcion','ej-variantes','ej-notas','ej-material',
     'ej-duracion','ej-jugadores','ej-ancho','ej-largo','ej-porteros'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    var chkP = document.getElementById('ej-es-portero'); if (chkP) chkP.checked = false; ejTogglePortero();
    ['ej-categoria','ej-edad','ej-dificultad','ej-fase','ej-tema','ej-subcat-portero'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    const eii = document.getElementById('ej-eii-display');
    if (eii) eii.textContent = '';
    var nombreInput = document.getElementById('ej-nombre');
    if (nombreInput) { nombreInput.readOnly = false; nombreInput.style.background = ''; nombreInput.style.color = ''; }
    var lockMsg = document.getElementById('ej-nombre-lock-msg');
    if (lockMsg) lockMsg.style.display = 'none';
}

// =============================================
// SECCIÓN BANCO DE EJERCICIOS
// =============================================
function ejBuildBanco() {
    const root = document.getElementById('ej-banco-container');
    if (!root) return;
    root.innerHTML = `
    <div class="ej-banco-wrap">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px">
            <h3 class="ej-ficha-title" style="margin:0">🗂 Banco de ejercicios</h3>
            <div style="display:flex;gap:6px">
                <button type="button" id="ej-banco-tab-mio" onclick="ejBancoCambiarFuente('mio')" style="padding:6px 14px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer">Mis ejercicios</button>
                <button type="button" id="ej-banco-tab-com" onclick="ejBancoCambiarFuente('com')" style="padding:6px 14px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer">Comunidad</button>
                <button type="button" id="ej-banco-tab-rev" onclick="ejBancoCambiarFuente('rev')" style="display:none;padding:6px 14px;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer" title="Ejercicios que los usuarios han enviado a la Comunidad y esperan tu revisión">Por revisar</button>
            </div>
        </div>
        <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:12px 14px;margin-bottom:14px">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
                <input type="text" id="ej-search" placeholder="🔍 Buscar por nombre..." oninput="ejBancoSearch()" style="flex:1">
                <span id="ej-banco-count" style="font-size:11px;background:#1e3a5f;color:#93c5fd;padding:3px 10px;border-radius:6px;white-space:nowrap"></span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <select id="ej-filter-tema" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Tema ▾</option>
                    <option>Calentamiento</option><option>Cambios de orientación</option><option>Centros laterales</option>
                    <option>Contraataque</option><option>Defensa en bloque bajo</option><option>Defensa en inferioridad</option>
                    <option>Duelos</option><option>Finalización</option><option>Físico-Técnico</option>
                    <option>Juego de posición</option><option>Juego interior</option><option>Juegos Lúdicos</option>
                    <option>Partidos</option><option>Porteros</option><option>Posesiones</option>
                    <option>Presión</option><option>Press perdida</option><option>Progresión en el juego</option>
                    <option>Rondos</option><option>Ruedas de pases</option><option>Salida de balón</option>
                    <option>Tercer hombre</option><option>Trabajo táctico</option><option>Transiciones</option>
                    <option>Técnica individual</option>
                </select>
                <select id="ej-filter-cat" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Categoría ▾</option>
                    <option>Técnica individual</option><option>Posesión</option><option>Pressing</option>
                    <option>Ataque posicional</option><option>Defensa</option><option>Transiciones</option>
                    <option>Portería</option><option>Físico</option><option>Táctica</option>
                </select>
                <select id="ej-filter-edad" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Edad ▾</option>
                    <option>Prebenjamín</option><option>Benjamín</option><option>Alevín</option>
                    <option>Infantil</option><option>Cadete</option><option>Juvenil</option><option>Senior</option>
                </select>
                <select id="ej-filter-dif" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Dificultad ▾</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                    <option value="4">4</option><option value="5">5</option>
                </select>
                <select id="ej-filter-fase" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">
                    <option value="">Fase ▾</option>
                    <option>Organización ofensiva</option><option>Organización defensiva</option>
                    <option>Transición ataque</option><option>Transición defensa</option><option>Balón parado</option>
                </select>
                <input type="number" id="ej-filter-jug" placeholder="Jugadores" min="1" max="30" oninput="ejBancoSearch()" style="width:75px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <select id="ej-filter-gk" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer"><option value="">🧤 Todos ▾</option><option value="si">Solo porteros</option><option value="no">Sin porteros</option></select>
                <select id="ej-filter-gksub" onchange="ejBancoSearch()" style="padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer"><option value="">Subcat. portero ▾</option><option>Activación</option><option>Táctico</option><option>Coordinación</option><option>Juego aéreo</option><option>Juego de pies</option><option>Lúdico</option><option>Aspectos técnicos</option><option>Fuerza explosiva</option><option>Velocidad de reacción</option><option>Fuerza resistencia</option></select>
                <input type="number" id="ej-filter-port" placeholder="Porteros" min="0" max="4" oninput="ejBancoSearch()" style="width:70px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <input type="number" id="ej-filter-dur" placeholder="Min." min="1" oninput="ejBancoSearch()" style="width:55px;padding:4px 8px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px">
                <button onclick="document.getElementById('ej-import-file').click()" style="padding:4px 10px;font-size:11px;background:#7c3aed;border:none;color:#fff;border-radius:6px;cursor:pointer;white-space:nowrap">📥 Importar JSON</button><input type="file" id="ej-import-file" accept=".json,application/json" style="display:none" onchange="ejImportarJSON(this)">
                <button onclick="ejLimpiarFiltros()" style="padding:4px 10px;font-size:11px;background:#334155;border:none;color:#94a3b8;border-radius:6px;cursor:pointer;white-space:nowrap">✕ Limpiar</button>
            </div>
        </div>
        
        <div id="ej-banco-aporte"></div>
        <div id="ej-banco-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;overflow:hidden">
            <div style="color:#9ca3af;padding:20px">Cargando ejercicios...</div>
        </div>
    </div>`;
    ejBancoPintarTabs();
    ejBancoLoad();
}
let ejBancoCache = [];
// Qué se ve en el Banco: 'mio' (ejercicios propios), 'com' (Comunidad) o 'rev' (envíos por revisar, solo administradores)
var ejBancoFuente = 'mio';
// Envíos a la Comunidad hechos por este usuario: { id del ejercicio original: estado }
var ejBancoEnvios = {};
function ejBancoFiltroFuente() {
    if (ejBancoFuente === 'com') return 'and(visibility.eq.community,approval_status.eq.approved)';
    if (ejBancoFuente === 'rev') return 'and(visibility.eq.community,or(approval_status.eq.pending_review,retirada_solicitada_at.not.is.null))';
    return window.ejClubId ? ('club_id.eq.' + window.ejClubId + ',coach_id.eq.' + String(window.ejCoachId)) : ('coach_id.eq.' + String(window.ejCoachId));
}
function ejBancoPintarTabs() {
    [['mio', 'ej-banco-tab-mio'], ['com', 'ej-banco-tab-com'], ['rev', 'ej-banco-tab-rev']].forEach(function (t) {
        var b = document.getElementById(t[1]); if (!b) return;
        var on = ejBancoFuente === t[0];
        b.style.background = on ? '#7c3aed' : 'transparent';
        b.style.color = on ? '#fff' : '#c4b5fd';
        b.style.border = '2px solid #7c3aed';
    });
    // Importar solo tiene sentido en los ejercicios propios
    var imp = document.getElementById('ej-import-file');
    if (imp && imp.previousElementSibling) imp.previousElementSibling.style.display = ejBancoFuente === 'mio' ? '' : 'none';
    ejBancoPendientes();
    ejBancoAporte();
}
// ---- Avisos de la Comunidad al entrar en la aplicación ----
// Sin tabla de avisos: se leen del propio estado de los envíos.
//  · Administrador: cuántos envíos y solicitudes de retirada esperan revisión.
//  · Usuario: envíos suyos aprobados o rechazados cuyo resultado aún no ha visto (resultado_visto_at vacío).
function ejComunidadAvisoCaja(html) {
    var c = document.getElementById('ej-comunidad-aviso');
    if (!c) { c = document.createElement('div'); c.id = 'ej-comunidad-aviso'; document.body.appendChild(c); }
    c.style.cssText = 'position:fixed;right:18px;top:74px;z-index:9000;width:370px;max-width:calc(100vw - 36px);background:#111a2b;border:1px solid #2f405c;border-left:4px solid #7c3aed;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.45);padding:14px 16px;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.45';
    c.innerHTML = html;
}
function ejComunidadAvisoCerrar() { var c = document.getElementById('ej-comunidad-aviso'); if (c) c.remove(); }
async function ejComunidadAvisos() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    var yo = ejComunidadYo();
    if (!yo) return;
    var bt = 'border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:12px;font-weight:700';
    var cab = '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px"><b style="font-size:14px">Comunidad</b>'
        + '<button type="button" onclick="CIERRE" title="Cerrar" style="background:none;border:none;color:#94a3b8;font-size:20px;line-height:1;cursor:pointer;padding:0 2px">×</button></div>';
    try {
        if (ejComunidadEsAdmin()) {
            var r = await supabaseClient.from('custom_exercises').select('id,approval_status').eq('visibility', 'community').or('approval_status.eq.pending_review,retirada_solicitada_at.not.is.null').limit(200);
            if (r.error) return;
            var filas = r.data || [], envios = filas.filter(function (x) { return x.approval_status === 'pending_review'; }).length, retiradas = filas.length - envios;
            var clave = envios + '/' + retiradas, visto = null;
            try { visto = sessionStorage.getItem('tlc_comunidad_aviso'); } catch (e) {}
            if (!filas.length || visto === clave) return;     // nada pendiente, o ya se cerró este mismo aviso en esta sesión
            var partes = [];
            if (envios) partes.push('<b>' + envios + '</b> ' + (envios === 1 ? 'ejercicio enviado' : 'ejercicios enviados'));
            if (retiradas) partes.push('<b>' + retiradas + '</b> ' + (retiradas === 1 ? 'solicitud de retirada' : 'solicitudes de retirada'));
            ejComunidadAvisoCaja(cab.replace('CIERRE', "ejComunidadAvisoDescartar('" + clave + "')")
                + '<div>Tienes ' + partes.join(' y ') + ' por revisar.</div>'
                + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button type="button" onclick="ejComunidadAvisoDescartar(\'' + clave + '\')" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Luego</button>'
                + '<button type="button" onclick="ejComunidadAvisoDescartar(\'' + clave + '\');ejComunidadIrARevisar()" style="' + bt + ';background:#7c3aed;color:#fff">Ir a revisar</button></div>');
            return;
        }
        var u = await supabaseClient.from('custom_exercises').select('id,name,approval_status,approval_notes').eq('visibility', 'community').eq('shared_by', yo).or('approval_status.eq.approved,approval_status.eq.rejected').is('resultado_visto_at', null).limit(50);
        if (u.error) return;
        var res = u.data || [];
        if (!res.length) return;
        var ok = res.filter(function (x) { return x.approval_status === 'approved'; }), no = res.filter(function (x) { return x.approval_status === 'rejected'; });
        var lista = ok.map(function (x) { return '<div style="margin-top:8px"><span style="color:#4ade80;font-weight:700">Publicado</span> · «' + ejComEsc(x.name) + '» ya está en la Comunidad.</div>'; }).join('')
            + no.map(function (x) { return '<div style="margin-top:8px"><span style="color:#f87171;font-weight:700">No aceptado</span> · «' + ejComEsc(x.name) + '»' + (x.approval_notes ? '<div style="color:#cbd5e1;background:#1e293b;border-radius:6px;padding:6px 8px;margin-top:4px;white-space:pre-wrap"><b>Motivo:</b> ' + ejComEsc(x.approval_notes) + '</div>' : '') + '</div>'; }).join('');
        var ids = res.map(function (x) { return x.id; }).join(',');
        ejComunidadAvisoCaja(cab.replace('CIERRE', "ejComunidadAvisoVisto('" + ids + "')")
            + '<div style="max-height:46vh;overflow:auto">' + lista + '</div>'
            + (ok.length ? '<div style="color:#c4b5fd;margin-top:10px">Sumas <b>' + (ok.length * EJ_COMUNIDAD_PUNTOS) + ' puntos</b>. Gracias por aportar.</div>' : '')
            + (no.length ? '<div style="color:#94a3b8;margin-top:8px">Para corregirlo, ábrelo en tu Banco, cámbialo, guarda y pulsa <b>Comunidad</b> para enviarlo de nuevo.</div>' : '')
            + '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button type="button" onclick="ejComunidadAvisoVisto(\'' + ids + '\')" style="' + bt + ';background:#7c3aed;color:#fff">Entendido</button></div>');
    } catch (e) { /* los avisos nunca deben estorbar el arranque */ }
}
function ejComunidadAvisoDescartar(clave) {
    try { sessionStorage.setItem('tlc_comunidad_aviso', clave); } catch (e) {}
    ejComunidadAvisoCerrar();
}
// El usuario ha visto el resultado: no se le vuelve a enseñar, tampoco en otro ordenador
async function ejComunidadAvisoVisto(ids) {
    ejComunidadAvisoCerrar();
    try {
        await supabaseClient.from('custom_exercises').update({ resultado_visto_at: new Date().toISOString() }).in('id', String(ids).split(',')).eq('visibility', 'community').eq('shared_by', ejComunidadYo());
    } catch (e) { /* se volverá a enseñar la próxima vez */ }
}
// Lleva al administrador a Pizarra > Banco > Por revisar
function ejComunidadIrARevisar() {
    var tab = document.querySelector('.main-tab.pizarra');
    if (tab && typeof cambiarModulo === 'function' && !(document.getElementById('modulo-pizarra') || {}).classList.contains('active')) cambiarModulo('pizarra', tab);
    var intentos = 0, espera = setInterval(function () {
        intentos++;
        if (document.getElementById('ej-tab-banco')) {
            clearInterval(espera);
            ejShowTab('banco', document.querySelector('.ej-nav-btn[onclick*="\'banco\'"]'));
            if (ejBancoFuente !== 'rev') ejBancoCambiarFuente('rev'); else { ejBancoCache = []; ejBancoLoad(true); }
        } else if (intentos > 40) clearInterval(espera);
    }, 150);
}
if (typeof registrarInit === 'function') registrarInit(function () { setTimeout(ejComunidadAvisos, 2500); });

// ---- Puntos por aportar a la Comunidad ----
// No hay tabla de puntos: se cuentan en el momento los ejercicios PUBLICADOS de cada usuario
// (EJ_COMUNIDAD_PUNTOS por cada uno). Si un ejercicio se retira, deja de contar. Lo publicado por
// los administradores no entra en la clasificación.
var EJ_COMUNIDAD_PUNTOS = 5;
async function ejComunidadClasificacion() {
    var r = await supabaseClient.from('custom_exercises').select('shared_by,shared_by_name,approval_status').eq('visibility', 'community').limit(1000);
    if (r.error) throw r.error;
    var mapa = {};
    (r.data || []).forEach(function (x) {
        var id = x.shared_by == null ? '' : String(x.shared_by);
        if (!id || EJ_COMUNIDAD_ADMINS.indexOf(id) > -1) return;
        var u = mapa[id] || (mapa[id] = { id: id, nombre: null, publicados: 0, revision: 0 });
        if (x.shared_by_name) u.nombre = x.shared_by_name;
        if (x.approval_status === 'approved') u.publicados++;
        else if (x.approval_status === 'pending_review') u.revision++;
    });
    var lista = Object.keys(mapa).map(function (k) { var u = mapa[k]; u.puntos = u.publicados * EJ_COMUNIDAD_PUNTOS; return u; });
    lista.sort(function (a, b) { return b.puntos - a.puntos || (a.id < b.id ? -1 : 1); });
    // Mismo puesto para los que empatan a puntos; solo tienen puesto los que han publicado algo
    var puesto = 0, anterior = null, conPuntos = 0;
    lista.forEach(function (u, i) {
        if (!u.puntos) { u.puesto = null; return; }
        conPuntos++;
        if (u.puntos !== anterior) { puesto = i + 1; anterior = u.puntos; }
        u.puesto = puesto;
    });
    return { lista: lista, participantes: conPuntos };
}
// Panel encima de las tarjetas: al usuario, sus puntos y su puesto; al administrador, en "Por revisar", la lista entera
async function ejBancoAporte() {
    var caja = document.getElementById('ej-banco-aporte');
    if (!caja) return;
    var fuente = ejBancoFuente, admin = ejComunidadEsAdmin();
    if (admin && fuente !== 'rev') { caja.innerHTML = ''; return; }
    try {
        var c = await ejComunidadClasificacion();
        if (fuente !== ejBancoFuente) return;
        var marco = 'margin-bottom:10px;padding:10px 14px;background:#111a2b;border:1px solid #1e3a5f;border-radius:10px;font-size:13px;color:#e2e8f0';
        if (!admin) {
            var yo = c.lista.filter(function (u) { return u.id === ejComunidadYo(); })[0] || { publicados: 0, puntos: 0, revision: 0, puesto: null };
            var dato = function (n, t) { return '<span style="white-space:nowrap"><b style="font-size:16px;color:#c4b5fd">' + n + '</b> <span style="color:#94a3b8">' + t + '</span></span>'; };
            caja.innerHTML = '<div style="' + marco + ';display:flex;align-items:center;gap:8px 20px;flex-wrap:wrap">'
                + '<b>Tu aportación a la Comunidad</b>'
                + dato(yo.publicados, yo.publicados === 1 ? 'ejercicio publicado' : 'ejercicios publicados')
                + dato(yo.puntos, 'puntos')
                + (yo.puesto ? dato(yo.puesto + 'º', 'de ' + c.participantes + (c.participantes === 1 ? ' entrenador' : ' entrenadores')) : '')
                + (yo.revision ? '<span style="color:#fbbf24;white-space:nowrap">' + yo.revision + ' en revisión</span>' : '')
                + '<span style="color:#64748b;font-size:12px">' + (yo.publicados ? 'Cada ejercicio publicado suma ' + EJ_COMUNIDAD_PUNTOS + ' puntos.' : 'Abre un ejercicio tuyo y pulsa Comunidad para enviarlo: cada uno publicado suma ' + EJ_COMUNIDAD_PUNTOS + ' puntos.') + '</span>'
                + '</div>';
            return;
        }
        // Administrador: nombre del club de quien no quiso mostrar el suyo, para saber quién es
        var sin = c.lista.filter(function (u) { return !u.nombre; }).map(function (u) { return u.id; }).filter(function (id) { return /^[0-9]+$/.test(id); });
        var clubes = {};
        if (sin.length) {
            try {
                var k = await supabaseClient.from('clubs').select('wp_user_id,name').in('wp_user_id', sin);
                (k.data || []).forEach(function (x) { if (x.name && !clubes[String(x.wp_user_id)]) clubes[String(x.wp_user_id)] = x.name; });
            } catch (e) { /* sin nombres de club */ }
            if (fuente !== ejBancoFuente) return;
        }
        var th = 'text-align:left;padding:5px 10px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #1e3a5f', td = 'padding:6px 10px;border-bottom:1px solid #16233a';
        caja.innerHTML = '<div style="' + marco + '">'
            + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><b>Aportaciones de los usuarios</b><span style="color:#64748b;font-size:12px">' + EJ_COMUNIDAD_PUNTOS + ' puntos por ejercicio publicado. Solo lo ves tú.</span></div>'
            + (c.lista.length
                ? '<div style="max-height:220px;overflow:auto;margin-top:6px"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr><th style="' + th + '">Puesto</th><th style="' + th + '">Usuario</th><th style="' + th + '">Publicados</th><th style="' + th + '">Puntos</th><th style="' + th + '">En revisión</th></tr>'
                  + c.lista.map(function (u) {
                        var quien = u.nombre ? ejComEsc(u.nombre) : (clubes[u.id] ? ejComEsc(clubes[u.id]) + ' <span style="color:#64748b">(club; no muestra su nombre)</span>' : '<span style="color:#94a3b8">Usuario ' + ejComEsc(u.id) + '</span>');
                        return '<tr><td style="' + td + '">' + (u.puesto ? u.puesto + 'º' : '–') + '</td><td style="' + td + '">' + quien + ' <span style="color:#475569;font-size:11px">#' + ejComEsc(u.id) + '</span></td><td style="' + td + '">' + u.publicados + '</td><td style="' + td + ';font-weight:700;color:#c4b5fd">' + u.puntos + '</td><td style="' + td + ';color:' + (u.revision ? '#fbbf24' : '#475569') + '">' + u.revision + '</td></tr>';
                    }).join('') + '</table></div>'
                : '<div style="color:#64748b;margin-top:6px">Todavía ningún usuario ha enviado ejercicios.</div>')
            + '</div>';
    } catch (e) { caja.innerHTML = ''; }
}
// Muestra a los administradores la pestaña "Por revisar" con el número de envíos pendientes
async function ejBancoPendientes() {
    var b = document.getElementById('ej-banco-tab-rev');
    if (!b) return;
    if (!ejComunidadEsAdmin()) { b.style.display = 'none'; return; }
    b.style.display = '';
    try {
        var r = await supabaseClient.from('custom_exercises').select('id').eq('visibility', 'community').or('approval_status.eq.pending_review,retirada_solicitada_at.not.is.null').limit(200);
        if (r.error) return;
        var n = (r.data || []).length;
        b.textContent = 'Por revisar' + (n ? ' (' + n + ')' : '');
    } catch (e) { /* sin número: la pestaña sigue funcionando */ }
}
function ejBancoCambiarFuente(f) {
    if (f === ejBancoFuente) return;
    ejBancoFuente = f;
    ejBancoPintarTabs();
    ejBancoCache = [];
    var grid = document.getElementById('ej-banco-grid');
    if (grid) grid.innerHTML = '<div style="color:#9ca3af;padding:20px">Cargando ejercicios...</div>';
    ejBancoLoad(true);
}
let ejEditandoId = null;

async function ejBancoLoad(conservarEdicion) {
    var ejFuenteCarga = ejBancoFuente;
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises')
            .select('id,name,category,age_group,difficulty,duration_min,players_count,game_phase,field_width,field_length,eii,objectives,description,variants,coach_notes,materials, animation_url,tema,num_goalkeepers,es_portero,subcategoria_portero')
            
            .or(ejBancoFiltroFuente())
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .range(0, 999);
        if (error) throw error;
        if (!conservarEdicion) ejEditandoId = null;
        // Páginas siguientes (Supabase devuelve como mucho 1000 filas por petición)
        let ejTodos = data || [], ejDesde = 1000;
        while (ejTodos.length === ejDesde) {
            const ejPag = await supabaseClient
                .from('custom_exercises')
                .select('id,name,category,age_group,difficulty,duration_min,players_count,game_phase,field_width,field_length,eii,objectives,description,variants,coach_notes,materials, animation_url,tema,num_goalkeepers,es_portero,subcategoria_portero')
                .or(ejBancoFiltroFuente())
                .order('created_at', { ascending: false })
                .order('id', { ascending: true })
                .range(ejDesde, ejDesde + 999);
            if (ejPag.error) break;
            ejTodos = ejTodos.concat(ejPag.data || []);
            ejDesde += 1000;
        }
        if (ejFuenteCarga !== ejBancoFuente) return; // se cambió de pestaña mientras cargaba
        if (ejFuenteCarga !== 'mio') ejTodos.forEach(function (e) { e._com = ejFuenteCarga; });
        if (ejFuenteCarga === 'rev' && ejTodos.length) {
            // Cuáles son solicitudes de retirada (y su motivo), y cuáles cambios de algo ya publicado
            try {
                var ejSol = await supabaseClient.from('custom_exercises').select('id,approval_status,retirada_solicitada_at,retirada_motivo,shared_by_name').in('id', ejTodos.map(function (e) { return e.id; }));
                var ejSolMapa = {};
                (ejSol.data || []).forEach(function (x) { ejSolMapa[x.id] = x; });
                ejTodos.forEach(function (e) { var x = ejSolMapa[e.id] || {}; e._retirada = (x.approval_status === 'approved' && x.retirada_solicitada_at) ? (x.retirada_motivo || 'sin motivo') : null; e._autor = x.shared_by_name || null; });
            } catch (e) { /* sin detalle */ }
            if (ejFuenteCarga !== ejBancoFuente) return;
        }
        if (ejFuenteCarga === 'mio') {
            // Estado de lo que este usuario ha enviado a la Comunidad, para marcarlo en sus tarjetas
            ejBancoEnvios = {};
            try {
                var ejEnv = await supabaseClient.from('custom_exercises').select('shared_from,approval_status').eq('visibility', 'community').eq('shared_by', ejComunidadYo()).limit(1000);
                // Si hay dos filas (publicada y cambios), manda lo que está en revisión; lo publicado gana a lo rechazado
                var ejPeso = { pending_review: 3, approved: 2, rejected: 1 };
                (ejEnv.data || []).forEach(function (x) { if (x.shared_from && (ejPeso[x.approval_status] || 0) > (ejPeso[ejBancoEnvios[x.shared_from]] || 0)) ejBancoEnvios[x.shared_from] = x.approval_status; });
            } catch (e) { /* sin marcas */ }
            if (ejFuenteCarga !== ejBancoFuente) return;
        }
        ejBancoCache = ejTodos;
        ejBancoRender(ejBancoCache);
        ejBancoCargarThumbs();
    } catch(err) {
        const grid = document.getElementById('ej-banco-grid');
        if (grid) grid.innerHTML = `<div style="color:#ef4444">Error: ${err.message}</div>`;
    }
}

async function ejBancoCargarThumbs() {
    var pendientes = ejBancoCache.filter(function(e){ return e.thumbnail_svg === undefined; });
    var LOTE = 5;
    for (var i = 0; i < pendientes.length; i += LOTE) {
        var grupo = pendientes.slice(i, i + LOTE);
        var ids = grupo.map(function(e){ return e.id; });
        try {
            var res = await supabaseClient.from('custom_exercises').select('id,thumbnail_svg').in('id', ids);
            if (res.error) continue;
            var mapa = {};
            (res.data || []).forEach(function(r){ mapa[r.id] = r.thumbnail_svg || null; });
            grupo.forEach(function(e){ e.thumbnail_svg = (mapa[e.id] !== undefined) ? mapa[e.id] : null; });
            var grid = document.getElementById('ej-banco-grid');
            if (!grid) return;
            grupo.forEach(function(e){
                var img = grid.querySelector('img[data-ej-id="' + e.id + '"]');
                if (!img) return;
                if (e.thumbnail_svg) {
                    try {
                        if (e.thumbnail_svg.startsWith('data:')) { img.src = e.thumbnail_svg; }
                        else { img.src = URL.createObjectURL(new Blob([e.thumbnail_svg], {type:'image/svg+xml'})); }
                    } catch(err2) {}
                } else {
                    var cont = img.parentElement;
                    if (cont) cont.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#475569;font-size:11px">sin dibujo</div>';
                }
            });
        } catch(err) {}
    }
}
async function ejImportarJSON(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    input.value = '';
    var lista;
    try { lista = JSON.parse(await file.text()); } catch(e) { ejToast('El archivo no es un JSON válido', 'error'); return; }
    if (!Array.isArray(lista) || !lista.length) { ejToast('El JSON no contiene ejercicios', 'warning'); return; }
    var PERMITIDOS = ['name','description','objectives','variants','coach_notes','materials','category','tema','entrenador','equipo','age_group','difficulty','game_phase','duration_min','players_count','num_goalkeepers','field_width','field_length','es_portero','subcategoria_portero','thumbnail_svg','source','board_data'];
    ejConfirm('Se van a importar ' + lista.length + ' ejercicios a tu banco. ¿Continuar?', async function() {
        var LOTE = 10, ok = 0, fallos = 0;
        var countEl = document.getElementById('ej-banco-count');
        for (var i = 0; i < lista.length; i += LOTE) {
            var filas = lista.slice(i, i + LOTE).map(function(e) {
                var fila = { coach_id: window.ejCoachId || null, club_id: window.ejClubId || null };
                PERMITIDOS.forEach(function(k) { if (e[k] !== undefined) fila[k] = e[k]; });
                if (!fila.name) fila.name = 'Ejercicio importado';
                if (!fila.source) fila.source = 'import';
                // Ejercicio que trae el dibujo de la pizarra pero no su miniatura: se dibuja aquí, con el estilo del club
                // Las fichas marcadas como "@mi" o "@rival" toman el color de equipo de este club, y así llevan su equipación
                if (fila.board_data && fila.board_data.players) ejColoresResolver(fila.board_data.players);
                if (fila.board_data && !fila.thumbnail_svg) fila.thumbnail_svg = ejMiniaturaDeDatos(fila.board_data);
                return fila;
            });
            for (var m = 0; m < filas.length; m++) { if (filas[m].thumbnail_svg) filas[m].thumbnail_svg = await ejMiniaturaCompacta(filas[m].thumbnail_svg); }
            var res = await supabaseClient.from('custom_exercises').insert(filas);
            if (res.error) { fallos += filas.length; console.warn('Lote fallido', i, res.error.message); }
            else ok += filas.length;
            if (countEl) countEl.textContent = 'Importando ' + Math.min(i + LOTE, lista.length) + ' / ' + lista.length + '...';
        }
        ejToast('Importados ' + ok + ' ejercicios' + (fallos ? ' · ' + fallos + ' fallidos (ver consola)' : ''), fallos ? 'warning' : 'success');
        ejBancoLoad();
    });
}

// ---- Comunidad: ejercicios compartidos con todos los usuarios ----
// Compartir publica una COPIA con las fichas anónimas; el ejercicio original no se toca.
// Los administradores publican directamente. El resto de usuarios ENVÍA el ejercicio: queda pendiente
// (approval_status 'pending_review') y solo aparece en la Comunidad cuando un administrador lo aprueba.
var EJ_COMUNIDAD_ADMINS = ['1433'];
function ejComunidadEsAdmin() {
    var id = (typeof usuario !== 'undefined' && usuario && usuario.id != null) ? String(usuario.id) : (window.ejCoachId ? String(window.ejCoachId) : '');
    return EJ_COMUNIDAD_ADMINS.indexOf(id) > -1;
}
function ejComunidadBoton() {
    var b = document.getElementById('ej-btn-comunidad');
    if (b) { b.style.display = ''; b.title = ejComunidadEsAdmin() ? 'Publicar una copia de este ejercicio para todos los usuarios' : 'Enviar una copia de este ejercicio a la Comunidad (se publica cuando TopLiderCoach la aprueba)'; }
}
function ejComunidadYo() { return String((typeof usuario !== 'undefined' && usuario && usuario.id != null) ? usuario.id : (window.ejCoachId || '')); }
// Lo que le falta a un ejercicio para poder enviarse a la Comunidad (lista vacía = completo)
// En la Comunidad solo entran ejercicios DIBUJADOS con la pizarra de TopLiderCoach (diseño uniforme): una imagen subida
// no vale, tampoco para el administrador. Se pide un mínimo de elementos para que no se cuele un dibujo simbólico.
var EJ_COMUNIDAD_MIN_DIBUJO = 5;
function ejComunidadElementos(bd) {
    var n = 0;
    if (bd && typeof bd === 'object') ['players', 'lines', 'equipment', 'shapes'].forEach(function (k) { if (Array.isArray(bd[k])) n += bd[k].length; });
    return n;
}
// Motivo por el que el dibujo no sirve para la Comunidad, o '' si sirve
function ejComunidadDibujoFalta(o) {
    var n = ejComunidadElementos(o && o.board_data);
    if (n >= EJ_COMUNIDAD_MIN_DIBUJO) return '';
    if (n > 0) return 'Dibujo más completo: tiene ' + n + (n === 1 ? ' elemento' : ' elementos') + ' y hacen falta al menos ' + EJ_COMUNIDAD_MIN_DIBUJO + ' (jugadores, material, flechas...)';
    return 'Dibujo hecho con la pizarra de TopLiderCoach' + (o && o.thumbnail_svg ? ' (las imágenes subidas no valen para la Comunidad: pulsa «Editar dibujo» y dibújalo)' : '');
}
// Imagen que se publica: sale SIEMPRE del dibujo, nunca de una imagen subida
async function ejComunidadMiniatura(bdAnonimo, o) {
    var mini = ejMiniaturaDeDatos(bdAnonimo, true);
    if (!mini && o && o.thumbnail_svg && o.thumbnail_svg.indexOf('data:') !== 0) mini = o.thumbnail_svg;   // miniatura que ya generó la pizarra
    if (!mini) throw new Error('no se ha podido generar la imagen del dibujo; abre la pizarra y vuelve a intentarlo');
    return await ejMiniaturaCompacta(mini);
}
function ejComunidadFaltan(o) {
    var f = [], txt = function (v) { return String(v == null ? '' : v).trim(); };
    var dibujo = ejComunidadDibujoFalta(o);
    if (!txt(o.name)) f.push('Nombre');
    if (dibujo) f.push(dibujo);
    if (!(parseInt(o.duration_min) > 0)) f.push('Duración');
    if (!(parseInt(o.players_count) > 0)) f.push('Nº de jugadores');
    if (!txt(o.category)) f.push('Categoría');
    if (!txt(o.tema)) f.push('Tema');
    if (!o.es_portero) {
        if (!txt(o.game_phase)) f.push('Fase de juego');
        if (!(parseFloat(o.field_width) > 0) || !(parseFloat(o.field_length) > 0)) f.push('Espacio (ancho y largo)');
    }
    if (txt(o.objectives).length < 20) f.push('Objetivos (al menos 20 letras)');
    if (txt(o.description).length < 40) f.push('Descripción / desarrollo (al menos 40 letras)');
    return f;
}
// Las fichas guardadas con color "@mi", "@rival"... toman el color de equipo de quien las abre
function ejColoresResolver(players) {
    (players || []).forEach(function (p) {
        if (p.color === '@mi') p.color = ejP.myColor;
        else if (p.color === '@miGk') p.color = ejP.myGkColor;
        else if (p.color === '@rival') p.color = ejP.rivalColor;
        else if (p.color === '@rivalGk') p.color = ejP.rivalGkColor;
    });
    return players;
}
// Copia de un dibujo lista para publicarse: sin nombres ni fotos, y con los colores de equipo como marcas
function ejComunidadAnonimizar(bd) {
    var c = JSON.parse(JSON.stringify(bd || {}));
    (c.players || []).forEach(function (p) {
        p.name = ''; p.photo = null; p.showName = false; p.soloTexto = false;
        if (p.estilo === 'foto') p.estilo = 'circulo';
        if (p.team === 'tarea') return;
        var rival = p.team === 'rival';
        if (!rival && p.color === ejP.myColor) p.color = '@mi';
        else if (!rival && p.color === ejP.myGkColor) p.color = '@miGk';
        else if (rival && p.color === ejP.rivalColor) p.color = '@rival';
        else if (rival && p.color === ejP.rivalGkColor) p.color = '@rivalGk';
    });
    (c.animFrames || []).forEach(function (f) {
        (f.players || []).forEach(function (p) { delete p.name; delete p.photo; });
    });
    return c;
}
function ejComunidadCaja(html, ancho) {
    ejComunidadCerrar();
    var m = document.createElement('div');
    m.id = 'ej-comunidad-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;padding:12px';
    m.innerHTML = '<div style="background:#111a2b;border:1px solid #2f405c;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);width:' + (ancho || 470) + 'px;max-width:100%;padding:18px 20px;color:#e2e8f0;font-family:system-ui,sans-serif">' + html + '</div>';
    document.body.appendChild(m);
}
function ejComunidadCerrar() { var m = document.getElementById('ej-comunidad-modal'); if (m) m.remove(); }
async function ejComunidadAbrir() {
    if (!ejComunidadEsAdmin()) { ejComunidadEnviarAbrir(); return; }
    if (!ejEditandoId) { ejToast('Guarda primero el ejercicio para poder compartirlo.', 'warning'); return; }
    var copia = null;
    try {
        var res = await supabaseClient.from('custom_exercises').select('id, approval_status, created_at, updated_at').eq('shared_from', ejEditandoId).eq('visibility', 'community').limit(20);
        if (res.error) throw res.error;
        copia = (res.data || []).filter(function (x) { return x.approval_status === 'approved'; })[0] || (res.data || [])[0] || null;
    } catch (e) { ejToast('No se ha podido consultar la Comunidad: ' + e.message, 'error'); return; }
    var bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
    var cab = '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">Compartir en la Comunidad</b>'
        + '<button type="button" onclick="ejComunidadCerrar()" title="Cerrar" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer"><i class="ej-ico ej-ico-nueva"></i></button></div>';
    // Sin dibujo de pizarra no se ofrece compartir ni actualizar (si ya hay una copia publicada, sí se puede retirar)
    var sinDibujo = '';
    try {
        var rd = await supabaseClient.from('custom_exercises').select('board_data, thumbnail_svg').eq('id', ejEditandoId).single();
        if (rd.error) throw rd.error;
        sinDibujo = ejComunidadDibujoFalta(rd.data);
    } catch (e) { ejToast('No se ha podido leer el ejercicio: ' + (e.message || e), 'error'); return; }
    if (sinDibujo) {
        ejComunidadCaja(cab + '<div style="font-size:13px;color:#fca5a5;margin-top:8px;line-height:1.5"><b>Este ejercicio no se puede compartir.</b> En la Comunidad solo entran ejercicios dibujados con la pizarra de TopLiderCoach.</div>'
            + '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#fca5a5;line-height:1.7"><li>Falta: ' + sinDibujo + '</li></ul>'
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap">'
            + (copia ? '<button type="button" onclick="ejComunidadRetirar(\'' + copia.id + '\')" style="' + bt + ';background:#7f1d1d;color:#fecaca">Retirar la copia de la Comunidad</button>' : '')
            + '<button type="button" onclick="ejComunidadCerrar()" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Entendido</button></div>');
        return;
    }
    var notas = '<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#cbd5e1;line-height:1.6">'
        + '<li>Se publica <b>una copia</b>. Tu ejercicio no cambia.</li>'
        + '<li>En la copia las fichas van <b>sin nombres ni fotos</b>.</li>'
        + '<li>Cada club la verá con <b>su equipación</b>.</li>'
        + '<li>El vídeo no se comparte.</li></ul>';
    if (!copia) {
        ejComunidadCaja(cab + '<div style="font-size:13px;color:#94a3b8;margin-top:6px">Lo verán y podrán usarlo todos los usuarios de TopLiderCoach.</div>' + notas
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" onclick="ejComunidadCerrar()" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Cancelar</button>'
            + '<button type="button" onclick="ejComunidadPublicar(null)" style="' + bt + ';background:#22c55e;color:#052e14">Compartir</button></div>');
    } else {
        var f = new Date(copia.updated_at || copia.created_at);
        var publicado = copia.approval_status === 'approved';
        ejComunidadCaja(cab + (publicado
              ? '<div style="font-size:13px;color:#4ade80;margin-top:6px"><i class="ej-ico ej-ico-ok"></i> Este ejercicio ya está en la Comunidad' + (isNaN(f) ? '' : ' (publicado el ' + f.toLocaleDateString('es-ES') + ')') + '.</div>'
                + '<div style="font-size:13px;color:#cbd5e1;margin-top:8px;line-height:1.5">Si lo has cambiado, puedes <b>actualizar</b> la copia publicada con la versión de ahora, o <b>retirarlo</b> para que deje de verse.</div>'
              : '<div style="font-size:13px;color:#fbbf24;margin-top:6px">Hay un envío de este ejercicio que <b>todavía no está publicado</b> (' + (copia.approval_status === 'rejected' ? 'rechazado' : 'pendiente de revisión') + (isNaN(f) ? '' : ', del ' + f.toLocaleDateString('es-ES')) + ').</div>'
                + '<div style="font-size:13px;color:#cbd5e1;margin-top:8px;line-height:1.5"><b>Actualizar</b> lo publica ahora con la versión actual del ejercicio. <b>Retirar</b> borra el envío.</div>')
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap"><button type="button" onclick="ejComunidadRetirar(\'' + copia.id + '\')" style="' + bt + ';background:#7f1d1d;color:#fecaca">Retirar</button>'
            + '<button type="button" onclick="ejComunidadPublicar(\'' + copia.id + '\')" style="' + bt + ';background:#22c55e;color:#052e14">Actualizar</button></div>');
    }
}
// Publica (o actualiza, si se pasa el id de la copia) el ejercicio cargado en la ficha
async function ejComunidadPublicar(idCopia) {
    if (!ejComunidadEsAdmin() || !ejEditandoId) return;
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (r.error) throw r.error;
        var o = r.data, campos = ['name','description','objectives','variants','coach_notes','materials','category','tema','age_group','difficulty','game_phase','duration_min','players_count','num_goalkeepers','field_width','field_length','field_area','eii','eii_analysis','es_portero','subcategoria_portero'];
        var fila = {};
        campos.forEach(function (k) { if (o[k] !== undefined) fila[k] = o[k]; });
        var sinDibujo = ejComunidadDibujoFalta(o);
        if (sinDibujo) { ejComunidadCerrar(); ejToast('No se puede compartir. Falta: ' + sinDibujo, 'warning'); return; }
        fila.board_data = ejComunidadAnonimizar(o.board_data);
        fila.thumbnail_svg = await ejComunidadMiniatura(fila.board_data, o);
        var ahora = new Date().toISOString(), quien = String(usuario && usuario.id != null ? usuario.id : window.ejCoachId);
        Object.assign(fila, { club_id: null, coach_id: 'comunidad', source: 'comunidad', visibility: 'community', approval_status: 'approved',
            approved_by: quien, approved_at: ahora, shared_from: o.id, shared_by: quien, shared_by_name: 'TopLiderCoach', updated_at: ahora });
        var w = idCopia ? await supabaseClient.from('custom_exercises').update(fila).eq('id', idCopia)
                        : await supabaseClient.from('custom_exercises').insert(fila);
        if (w.error) throw w.error;
        ejComunidadCerrar();
        ejToast(idCopia ? 'Copia de la Comunidad actualizada.' : 'Ejercicio compartido en la Comunidad.', 'success');
    } catch (e) {
        console.error('ejComunidadPublicar:', e);
        ejToast('No se ha podido compartir: ' + (e.message || e), 'error');
    }
}
// Retirar. Un usuario solo puede cancelar un envío suyo que todavía NO está publicado.
// Lo publicado solo lo retira un administrador: el usuario lo solicita (ejComunidadSolicitarRetirada).
async function ejComunidadRetirar(idCopia) {
    if (!idCopia) return;
    try {
        var q = supabaseClient.from('custom_exercises').delete().eq('id', idCopia).eq('visibility', 'community');
        if (!ejComunidadEsAdmin()) q = q.eq('shared_by', ejComunidadYo()).neq('approval_status', 'approved');
        var w = await q.select('id');
        if (w.error) throw w.error;
        if (!(w.data || []).length) { ejToast('No se ha podido retirar: no es un envío tuyo o ya está publicado.', 'warning'); return; }
        ejComunidadCerrar();
        ejToast(ejComunidadEsAdmin() ? 'Ejercicio retirado de la Comunidad.' : 'Envío cancelado.', 'success');
        if (document.getElementById('ej-banco-grid')) { if (ejBancoFuente !== 'mio') ejBancoCache = []; ejBancoLoad(true); }
        ejBancoPendientes();
        ejBancoAporte();
    } catch (e) { ejToast('No se ha podido retirar: ' + (e.message || e), 'error'); }
}

// ---- Envío de un usuario a la Comunidad (queda pendiente de revisión) ----
// De un mismo ejercicio puede haber dos filas en la Comunidad: la PUBLICADA y un ENVÍO (cambios pendientes o
// rechazados). Enviar cambios no quita de la vista lo publicado: cuando se aprueban, sustituyen a la publicada.
async function ejComunidadCopias(idOriginal) {
    var c = await supabaseClient.from('custom_exercises').select('id, approval_status, approval_notes, shared_by, created_at, updated_at, retirada_solicitada_at').eq('shared_from', idOriginal).eq('visibility', 'community').limit(20);
    if (c.error) throw c.error;
    var filas = c.data || [];
    return { publicada: filas.filter(function (x) { return x.approval_status === 'approved'; })[0] || null,
             envio: filas.filter(function (x) { return x.approval_status === 'pending_review'; })[0] || filas.filter(function (x) { return x.approval_status === 'rejected'; })[0] || null };
}
async function ejComunidadEnviarAbrir() {
    if (!ejEditandoId) { ejToast('Guarda primero el ejercicio para poder enviarlo.', 'warning'); return; }
    var o, pub, env;
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (r.error) throw r.error;
        o = r.data;
        var cs = await ejComunidadCopias(ejEditandoId);
        pub = cs.publicada; env = cs.envio;
    } catch (e) { ejToast('No se ha podido consultar la Comunidad: ' + (e.message || e), 'error'); return; }
    if (o.shared_from) { ejToast('Este ejercicio lo clonaste de la Comunidad: ya está allí.', 'warning'); return; }
    var bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
    var cab = '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">Enviar a la Comunidad</b>'
        + '<button type="button" onclick="ejComunidadCerrar()" title="Cerrar" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer"><i class="ej-ico ej-ico-nueva"></i></button></div>';
    var gris = bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c', verde = bt + ';background:#22c55e;color:#052e14', rojo = bt + ';background:#7f1d1d;color:#fecaca';
    var yo = ejComunidadYo(), dia = function (x) { var f = new Date(x.updated_at || x.created_at); return isNaN(f) ? '' : ' (' + f.toLocaleDateString('es-ES') + ')'; };
    var estado = '';
    if (pub) estado += '<div style="font-size:13px;color:#4ade80;margin-top:8px"><i class="ej-ico ej-ico-ok"></i> Este ejercicio está publicado en la Comunidad' + dia(pub) + '.</div>'
        + (pub.retirada_solicitada_at ? '<div style="font-size:13px;color:#fbbf24;margin-top:6px">Has solicitado su retirada. TopLiderCoach la revisará.</div>' : '');
    if (env && env.approval_status === 'rejected') estado += '<div style="font-size:13px;color:#fca5a5;margin-top:8px">' + (pub ? 'Los cambios que enviaste no se han aceptado' : 'No se ha aceptado en la Comunidad') + dia(env) + '.</div>'
        + (env.approval_notes ? '<div style="font-size:13px;color:#e2e8f0;background:#1e293b;border-left:3px solid #f87171;border-radius:6px;padding:8px 10px;margin-top:6px;white-space:pre-wrap"><b>Motivo:</b> ' + ejComEsc(env.approval_notes) + '</div>' : '');
    else if (env) estado += '<div style="font-size:13px;color:#fbbf24;margin-top:8px">' + (pub ? 'Has enviado cambios' : 'Enviado') + dia(env) + '. ' + (pub ? 'Están pendientes' : 'Está pendiente') + ' de revisión.</div>';
    if ((pub && pub.shared_by !== yo) || (env && env.shared_by !== yo)) {
        ejComunidadCaja(cab + estado + '<div style="font-size:13px;color:#94a3b8;margin-top:8px">Lo envió otra persona de tu club: solo ella puede cambiarlo.</div>'
            + '<div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" onclick="ejComunidadCerrar()" style="' + gris + '">Cerrar</button></div>');
        return;
    }
    // Botones de la izquierda: cancelar un envío sin publicar, o solicitar la retirada de lo publicado
    var extra = '';
    if (env) extra += '<button type="button" onclick="ejComunidadRetirar(\'' + env.id + '\')" style="' + rojo + '">' + (env.approval_status === 'rejected' ? 'Borrar el envío' : 'Cancelar el envío') + '</button>';
    if (pub && !pub.retirada_solicitada_at) extra += '<button type="button" onclick="ejComunidadRetiradaAbrir(\'' + pub.id + '\')" style="' + gris + '">Solicitar retirada</button>';
    var faltan = ejComunidadFaltan(o);
    if (faltan.length) {
        ejComunidadCaja(cab + estado + '<div style="font-size:13px;color:#cbd5e1;margin-top:8px;line-height:1.5">Para que la Comunidad tenga ejercicios completos, antes de enviarlo rellena en la ficha y <b>guarda</b>:</div>'
            + '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#fca5a5;line-height:1.7">' + faltan.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap">' + extra + '<button type="button" onclick="ejComunidadCerrar()" style="' + gris + '">Entendido</button></div>');
        return;
    }
    var nombre = (typeof usuario !== 'undefined' && usuario && (usuario.display_name || usuario.name)) || '';
    // Así se verá en la Comunidad: se dibuja ahora con los datos guardados, para que se vea antes de enviar
    var vista = null;
    try {
        vista = (o.board_data && (o.board_data.players || o.board_data.lines || o.board_data.equipment)) ? (ejMiniaturaDeDatos(ejComunidadAnonimizar(o.board_data), true) || o.thumbnail_svg) : o.thumbnail_svg;
    } catch (e) { vista = o.thumbnail_svg || null; }
    var vistaHtml = vista ? '<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-top:12px">Así se verá en la Comunidad</div>'
        + '<div style="width:100%;aspect-ratio:8/5;border-radius:8px;overflow:hidden;background:#0f4c2a;margin-top:4px"><img id="ej-comunidad-vista" alt="" style="width:100%;height:100%;object-fit:contain;display:block"></div>'
        + '<div style="font-size:12px;color:#94a3b8;margin-top:4px">Si no es el dibujo de este ejercicio, cancela, pulsa <b>Editar dibujo</b>, corrígelo y guarda.</div>' : '';
    var notas = vistaHtml + '<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#cbd5e1;line-height:1.6">'
        + '<li>Se envía <b>una copia</b>. Tu ejercicio no cambia.</li>'
        + '<li>En la copia las fichas van <b>sin nombres ni fotos</b>, y el vídeo no se comparte.</li>'
        + '<li><b>TopLiderCoach la revisa</b> antes de publicarla. Verás el resultado en este botón y en tu Banco.</li>'
        + (pub ? '<li>Mientras se revisan los cambios, en la Comunidad <b>se sigue viendo la versión publicada</b>.</li>'
               : '<li>Una vez publicada <b>pasa a formar parte de la Comunidad</b>: para retirarla hay que solicitarlo a TopLiderCoach.</li>') + '</ul>'
        + (nombre ? '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:#e2e8f0;cursor:pointer"><input type="checkbox" id="ej-comunidad-autor" checked> Mostrar mi nombre como autor (' + ejComEsc(nombre) + ')</label>' : '');
    ejComunidadCaja(cab + estado + (pub || env ? '' : '<div style="font-size:13px;color:#94a3b8;margin-top:6px">Cuando se apruebe, lo verán y podrán usarlo todos los usuarios de TopLiderCoach.</div>') + notas
        + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap">' + extra
        + '<button type="button" onclick="ejComunidadCerrar()" style="' + gris + '">Cancelar</button>'
        + '<button type="button" id="ej-comunidad-enviar" onclick="ejComunidadEnviar(' + (env ? "\'" + env.id + "\'" : 'null') + ')" style="' + verde + '">' + (env ? 'Enviar de nuevo' : pub ? 'Enviar cambios' : 'Enviar a revisión') + '</button></div>', 540);
    var iv = document.getElementById('ej-comunidad-vista');
    if (iv && vista) iv.src = vista.indexOf('data:') === 0 ? vista : URL.createObjectURL(new Blob([vista], { type: 'image/svg+xml' }));
}
// idEnvio: id del envío pendiente o rechazado que se sustituye; null = envío nuevo (aunque ya haya una versión publicada)
async function ejComunidadEnviar(idEnvio) {
    if (!ejEditandoId) return;
    var boton = document.getElementById('ej-comunidad-enviar'), rotulo = boton ? boton.textContent : '';
    if (boton) { if (boton.disabled) return; boton.disabled = true; boton.textContent = 'Enviando...'; }
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (r.error) throw r.error;
        var o = r.data;
        if (ejComunidadFaltan(o).length) { ejComunidadEnviarAbrir(); return; }
        var campos = ['name','description','objectives','variants','coach_notes','materials','category','tema','age_group','difficulty','game_phase','duration_min','players_count','num_goalkeepers','field_width','field_length','field_area','eii','eii_analysis','es_portero','subcategoria_portero'];
        var fila = {};
        campos.forEach(function (k) { if (o[k] !== undefined) fila[k] = o[k]; });
        fila.board_data = ejComunidadAnonimizar(o.board_data);
        fila.thumbnail_svg = await ejComunidadMiniatura(fila.board_data, o);
        var chk = document.getElementById('ej-comunidad-autor'), yo = ejComunidadYo();
        var nombre = (chk && chk.checked && typeof usuario !== 'undefined' && usuario) ? (usuario.display_name || usuario.name || null) : null;
        Object.assign(fila, { club_id: null, coach_id: 'comunidad', source: 'comunidad', visibility: 'community', approval_status: 'pending_review',
            approved_by: null, approved_at: null, approval_notes: null, resultado_visto_at: null, shared_from: o.id, shared_by: yo, shared_by_name: nombre, updated_at: new Date().toISOString() });
        var w = idEnvio ? await supabaseClient.from('custom_exercises').update(fila).eq('id', idEnvio).eq('shared_by', yo).neq('approval_status', 'approved').select('id')
                        : await supabaseClient.from('custom_exercises').insert(fila).select('id');
        if (w.error) throw w.error;
        if (!(w.data || []).length) throw new Error('no se ha guardado el envío');
        ejComunidadCerrar();
        ejToast('Enviado. Lo verás publicado cuando se revise.', 'success');
        if (ejBancoFuente === 'mio' && document.getElementById('ej-banco-grid')) ejBancoLoad(true);
        ejBancoAporte();
    } catch (e) {
        console.error('ejComunidadEnviar:', e);
        if (boton) { boton.disabled = false; boton.textContent = rotulo || 'Enviar a revisión'; }
        ejToast('No se ha podido enviar: ' + (e.message || e), 'error');
    }
}
// El usuario no retira lo publicado: lo solicita, con su motivo, y decide el administrador
function ejComunidadRetiradaAbrir(idPublicada) {
    var bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
    ejComunidadCaja('<b style="font-size:16px">Solicitar la retirada</b>'
        + '<div style="font-size:13px;color:#cbd5e1;margin-top:8px;line-height:1.5">Los ejercicios publicados forman parte de la Comunidad. Cuéntanos por qué quieres retirarlo y TopLiderCoach lo revisará. Mientras tanto <b>sigue publicado</b>.</div>'
        + '<textarea id="ej-comunidad-motivo" rows="4" placeholder="Motivo de la solicitud" style="width:100%;box-sizing:border-box;margin-top:10px;padding:9px 10px;background:#0b1220;border:1px solid #2f405c;border-radius:8px;color:#e2e8f0;font-size:13px;font-family:inherit;resize:vertical"></textarea>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button type="button" onclick="ejComunidadCerrar()" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Cancelar</button>'
        + '<button type="button" onclick="ejComunidadSolicitarRetirada(\'' + idPublicada + '\')" style="' + bt + ';background:#f59e0b;color:#1c1917">Enviar solicitud</button></div>');
    var t = document.getElementById('ej-comunidad-motivo'); if (t) t.focus();
}
async function ejComunidadSolicitarRetirada(idPublicada) {
    var t = document.getElementById('ej-comunidad-motivo'), motivo = t ? t.value.trim() : '';
    if (motivo.length < 5) { ejToast('Escribe el motivo de la solicitud.', 'warning'); return; }
    try {
        var w = await supabaseClient.from('custom_exercises').update({ retirada_solicitada_at: new Date().toISOString(), retirada_motivo: motivo })
            .eq('id', idPublicada).eq('visibility', 'community').eq('shared_by', ejComunidadYo()).select('id');
        if (w.error) throw w.error;
        if (!(w.data || []).length) throw new Error('solo puede solicitarlo quien lo envió');
        ejComunidadCerrar();
        ejToast('Solicitud enviada. El ejercicio sigue publicado hasta que se revise.', 'success');
    } catch (e) { ejToast('No se ha podido enviar la solicitud: ' + (e.message || e), 'error'); }
}

// ---- Revisión de los envíos (solo administradores) ----
async function ejComunidadRevisar(id, aprobar, motivo) {
    if (!ejComunidadEsAdmin() || !id) return;
    try {
        var ahora = new Date().toISOString(), yo = ejComunidadYo(), hecho = false;
        if (aprobar) {
            // Si son cambios de un ejercicio ya publicado, se vuelcan en la fila publicada (conserva su id, y con él
            // los clones y el historial) y el envío se borra. Si no, el envío pasa a publicado.
            var r = await supabaseClient.from('custom_exercises').select('*').eq('id', id).eq('visibility', 'community').single();
            if (r.error) throw new Error('el envío ya no existe (puede que lo hayan cancelado)');
            var e = r.data;
            if (ejComunidadElementos(e.board_data) < EJ_COMUNIDAD_MIN_DIBUJO) throw new Error('no está dibujado con la pizarra (tiene ' + ejComunidadElementos(e.board_data) + ' elementos). Recházalo indicando el motivo');
            var p = e.shared_from ? await supabaseClient.from('custom_exercises').select('id').eq('shared_from', e.shared_from).eq('visibility', 'community').eq('approval_status', 'approved').limit(1) : { data: [] };
            if (p.error) throw p.error;
            var publicada = (p.data || []).filter(function (x) { return x.id !== id; })[0];
            if (publicada) {
                var campos = ['name','description','objectives','variants','coach_notes','materials','category','tema','age_group','difficulty','game_phase','duration_min','players_count','num_goalkeepers','field_width','field_length','field_area','eii','eii_analysis','es_portero','subcategoria_portero','board_data','thumbnail_svg','shared_by_name'];
                var nuevo = { approved_by: yo, approved_at: ahora, approval_notes: null, updated_at: ahora, resultado_visto_at: null };
                campos.forEach(function (k) { nuevo[k] = e[k] === undefined ? null : e[k]; });
                var u = await supabaseClient.from('custom_exercises').update(nuevo).eq('id', publicada.id).select('id');
                if (u.error) throw u.error;
                if (!(u.data || []).length) throw new Error('no se ha podido actualizar la versión publicada');
                var d = await supabaseClient.from('custom_exercises').delete().eq('id', id).eq('visibility', 'community').neq('approval_status', 'approved');
                if (d.error) throw d.error;
                hecho = true;
            }
        }
        if (!hecho) {
            var cambio = aprobar ? { approval_status: 'approved', approved_by: yo, approved_at: ahora, approval_notes: null, resultado_visto_at: null }
                                 : { approval_status: 'rejected', approved_by: yo, approved_at: ahora, approval_notes: motivo || null, resultado_visto_at: null };
            var w = await supabaseClient.from('custom_exercises').update(cambio).eq('id', id).eq('visibility', 'community').eq('approval_status', 'pending_review').select('id');
            if (w.error) throw w.error;
            if (!(w.data || []).length) throw new Error('el envío ya no existe o ya estaba revisado');
        }
        ejComunidadCerrar();
        ejToast(aprobar ? 'Aprobado. Ya está en la Comunidad.' : 'Rechazado. El usuario verá el motivo.', 'success');
    } catch (err) { ejToast('No se ha podido guardar la revisión: ' + (err.message || err), 'error'); }
    if (ejBancoFuente === 'rev') { ejBancoCache = []; ejBancoLoad(true); }
    ejBancoPendientes();
    ejBancoAporte();
}
function ejComunidadRechazarAbrir(id) {
    if (!ejComunidadEsAdmin()) return;
    var bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
    ejComunidadCaja('<b style="font-size:16px">Rechazar el envío</b>'
        + '<div style="font-size:13px;color:#cbd5e1;margin-top:8px">Escribe el motivo. El usuario lo verá y podrá corregir el ejercicio y volver a enviarlo.</div>'
        + '<textarea id="ej-comunidad-motivo" rows="4" placeholder="Ej: falta explicar el desarrollo; el dibujo no se entiende..." style="width:100%;box-sizing:border-box;margin-top:10px;padding:9px 10px;background:#0b1220;border:1px solid #2f405c;border-radius:8px;color:#e2e8f0;font-size:13px;font-family:inherit;resize:vertical"></textarea>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button type="button" onclick="ejComunidadCerrar()" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Cancelar</button>'
        + '<button type="button" onclick="ejComunidadRechazar(\'' + id + '\')" style="' + bt + ';background:#7f1d1d;color:#fecaca">Rechazar</button></div>');
    var t = document.getElementById('ej-comunidad-motivo'); if (t) t.focus();
}
function ejComunidadRechazar(id) {
    var t = document.getElementById('ej-comunidad-motivo'), motivo = t ? t.value.trim() : '';
    if (motivo.length < 5) { ejToast('Escribe el motivo para que el usuario sepa qué corregir.', 'warning'); return; }
    ejComunidadRevisar(id, false, motivo);
}
// Solicitudes de retirada: el administrador retira el ejercicio o lo mantiene publicado
async function ejComunidadRetiradaResolver(id, retirar) {
    if (!ejComunidadEsAdmin() || !id) return;
    try {
        var w = retirar ? await supabaseClient.from('custom_exercises').delete().eq('id', id).eq('visibility', 'community').select('id')
                        : await supabaseClient.from('custom_exercises').update({ retirada_solicitada_at: null, retirada_motivo: null }).eq('id', id).eq('visibility', 'community').select('id');
        if (w.error) throw w.error;
        ejComunidadCerrar();
        ejToast(retirar ? 'Retirado de la Comunidad.' : 'Se mantiene publicado.', 'success');
    } catch (e) { ejToast('No se ha podido guardar: ' + (e.message || e), 'error'); }
    if (ejBancoFuente === 'rev') { ejBancoCache = []; ejBancoLoad(true); }
    ejBancoPendientes();
    ejBancoAporte();
}

function ejComEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
// Ficha de solo lectura de un ejercicio de la Comunidad (no se puede editar: para cambiarlo hay que clonarlo)
async function ejComunidadVer(id) {
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', id).single();
        if (r.error) throw r.error;
        var o = r.data, bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
        var datos = [];
        if (ejComunidadEsAdmin() && o.visibility === 'community') datos.push('Pizarra: ' + ejComunidadElementos(o.board_data) + ' elementos');
        if (o.tema) datos.push(o.tema);
        if (o.category) datos.push(o.category);
        if (o.game_phase) datos.push(o.game_phase);
        if (o.age_group) datos.push(o.age_group);
        if (o.duration_min) datos.push(o.duration_min + ' min');
        if (o.players_count) datos.push(o.players_count + ' jugadores');
        if (o.num_goalkeepers) datos.push(o.num_goalkeepers + ' porteros');
        if (o.field_width && o.field_length) datos.push(o.field_width + ' × ' + o.field_length + ' m');
        if (o.materials) datos.push(o.materials);
        var bloque = function (tit, txt) {
            return txt ? '<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em">' + tit + '</div><div style="font-size:13px;color:#e2e8f0;line-height:1.5;white-space:pre-wrap">' + ejComEsc(txt) + '</div></div>' : '';
        };
        var textos = bloque('Objetivos', o.objectives) + bloque('Descripción', o.description) + bloque('Variantes', o.variants) + bloque('Notas', o.coach_notes);
        ejComunidadCaja('<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><b style="font-size:16px">' + ejComEsc(o.name) + '</b>'
            + '<button type="button" onclick="ejComunidadCerrar()" title="Cerrar" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer"><i class="ej-ico ej-ico-nueva"></i></button></div>'
            + '<div style="font-size:11px;color:#a78bfa;margin-top:2px">' + (o.approval_status === 'pending_review' ? 'Pendiente de revisión' : 'Comunidad') + (o.shared_by_name ? ' · ' + ejComEsc(o.shared_by_name) : '') + '</div>'
            + '<div style="max-height:70vh;overflow:auto;margin-top:10px">'
            + '<div style="width:100%;aspect-ratio:8/5;border-radius:8px;overflow:hidden;background:#0f4c2a"><img id="ej-comunidad-img" alt="" style="width:100%;height:100%;object-fit:contain;display:block"></div>'
            + (datos.length ? '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px">' + datos.map(function (d) { return '<span style="font-size:11px;color:#cbd5e1;background:#1e293b;padding:2px 8px;border-radius:5px">' + ejComEsc(d) + '</span>'; }).join('') + '</div>' : '')
            + (textos || '<div style="font-size:13px;color:#64748b;margin-top:10px">Este ejercicio no tiene texto.</div>')
            + '</div>'
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button type="button" onclick="ejComunidadCerrar()" style="' + bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c">Cerrar</button>'
            + (o.approval_status === 'pending_review' && ejComunidadEsAdmin()
                ? '<button type="button" onclick="ejComunidadRechazarAbrir(\'' + o.id + '\')" style="' + bt + ';background:#7f1d1d;color:#fecaca">Rechazar</button><button type="button" onclick="ejComunidadRevisar(\'' + o.id + '\', true)" style="' + bt + ';background:#16a34a;color:#fff">Aprobar</button>'
                : '<button type="button" onclick="ejComunidadClonar(\'' + o.id + '\')" style="' + bt + ';background:#7c3aed;color:#fff">Clonar a mis ejercicios</button>') + '</div>', 720);
        var img = document.getElementById('ej-comunidad-img');
        if (img && o.thumbnail_svg) {
            img.src = o.thumbnail_svg.indexOf('data:') === 0 ? o.thumbnail_svg : URL.createObjectURL(new Blob([o.thumbnail_svg], { type: 'image/svg+xml' }));
        } else if (img) { img.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#475569;font-size:12px">sin dibujo</div>'; }
    } catch (e) { ejToast('No se ha podido abrir: ' + (e.message || e), 'error'); }
}
// Clonar: copia un ejercicio de la Comunidad a "Mis ejercicios". La copia es del usuario y puede cambiarla; la de la Comunidad no se toca.
async function ejComunidadClonar(id) {
    var mio = String(window.ejCoachId || (typeof usuario !== 'undefined' && usuario && usuario.id != null ? usuario.id : ''));
    if (!mio) { ejToast('No se ha podido identificar tu usuario.', 'error'); return; }
    try {
        var ya = await supabaseClient.from('custom_exercises').select('id').eq('shared_from', id).eq('coach_id', mio).limit(1);
        if (ya.error) throw ya.error;
        if ((ya.data || []).length) { ejConfirm('Ya tienes una copia de este ejercicio en Mis ejercicios. ¿Quieres clonarlo otra vez?', function () { ejComunidadClonarHacer(id, mio); }); return; }
        await ejComunidadClonarHacer(id, mio);
    } catch (e) { ejToast('No se ha podido clonar: ' + (e.message || e), 'error'); }
}
async function ejComunidadClonarHacer(id, mio) {
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', id).eq('visibility', 'community').eq('approval_status', 'approved').single();
        if (r.error) throw r.error;
        var o = r.data, campos = ['name','description','objectives','variants','coach_notes','materials','category','tema','age_group','difficulty','game_phase','duration_min','players_count','num_goalkeepers','field_width','field_length','field_area','eii','eii_analysis','es_portero','subcategoria_portero'];
        var fila = {};
        campos.forEach(function (k) { if (o[k] !== undefined) fila[k] = o[k]; });
        if (o.board_data && (o.board_data.players || o.board_data.lines || o.board_data.equipment)) {
            // Las fichas de equipo toman el color y la equipación del club que lo clona
            fila.board_data = JSON.parse(JSON.stringify(o.board_data));
            ejColoresResolver(fila.board_data.players);
            fila.thumbnail_svg = await ejMiniaturaCompacta(ejMiniaturaDeDatos(fila.board_data) || o.thumbnail_svg || null);
        } else {
            fila.board_data = o.board_data || null;
            fila.thumbnail_svg = o.thumbnail_svg || null;
        }
        Object.assign(fila, { coach_id: mio, club_id: window.ejClubId || null, source: 'comunidad', visibility: 'private', shared_from: o.id, shared_by_name: o.shared_by_name || null });
        var w = await supabaseClient.from('custom_exercises').insert(fila);
        if (w.error) throw w.error;
        ejComunidadCerrar();
        ejToast('Clonado. Ya lo tienes en Mis ejercicios.', 'success');
    } catch (e) {
        console.error('ejComunidadClonar:', e);
        ejToast('No se ha podido clonar: ' + (e.message || e), 'error');
    }
}

// Dibuja unos datos de pizarra sin abrirlos y devuelve su miniatura, dejando la pizarra como estaba
function ejMiniaturaDeDatos(bd, neutra) {
    var svg = document.getElementById('ej-svg');
    if (!svg || !bd) return null;
    var claves = ['players','lines','shapes','texts','equipment','connections','fieldType','fieldFondo','fieldColor','showCarriles','showZonas','showRejilla','showEII','selectedId','multiSel','_exporting','animMode','miKit','_sinKit','escudo'];
    var antes = {}, mini = null;
    claves.forEach(function (k) { antes[k] = ejP[k]; });
    try {
        ejP.players = ejColoresResolver(JSON.parse(JSON.stringify(bd.players || []))); ejP.lines = bd.lines || []; ejP.shapes = bd.shapes || []; ejP.texts = bd.texts || [];
        // Miniatura neutra: sin la equipación ni el escudo de este club (para lo que ven otros clubes)
        if (neutra) { ejP._sinKit = true; ejP.escudo = Object.assign({}, ejP.escudo || {}, { ver: false }); }
        ejP.equipment = bd.equipment || []; ejP.connections = bd.connections || [];
        ejP.fieldType = bd.fieldType || 'full'; ejFondoCargar(bd);
        ejP.showCarriles = !!bd.showCarriles; ejP.showZonas = !!bd.showZonas; ejP.showRejilla = !!bd.showRejilla; ejP.showEII = false;
        ejP.selectedId = null; ejP.multiSel = []; ejP._exporting = true; ejP.animMode = false;
        ejRenderSVG();
        var txt = new XMLSerializer().serializeToString(svg).replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"');
        mini = ejComprimirThumbSVG(txt);
    } catch (e) { console.warn('No se pudo dibujar la miniatura:', e && e.message); }
    claves.forEach(function (k) { ejP[k] = antes[k]; });
    ejRenderSVG();
    return mini;
}

function ejLimpiarFiltros() {
    ['ej-search','ej-filter-jug','ej-filter-port','ej-filter-dur'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['ej-filter-tema','ej-filter-cat','ej-filter-edad','ej-filter-dif','ej-filter-fase','ej-filter-gk','ej-filter-gksub'].forEach(id => {
        const el = document.getElementById(id); if (el) el.selectedIndex = 0;
    });
    ejBancoSearch();
}
 
function ejBancoSearch() {
    const q    = document.getElementById('ej-search')?.value?.toLowerCase() || '';
    const tema = document.getElementById('ej-filter-tema')?.value || '';
    const cat  = document.getElementById('ej-filter-cat')?.value || '';
    const edad = document.getElementById('ej-filter-edad')?.value || '';
    const dif  = document.getElementById('ej-filter-dif')?.value || '';
    const fase = document.getElementById('ej-filter-fase')?.value || '';
    const jug  = parseInt(document.getElementById('ej-filter-jug')?.value) || 0;
    const port = parseInt(document.getElementById('ej-filter-port')?.value) || 0;
    const gk    = document.getElementById('ej-filter-gk')?.value || '';
    const gksub = document.getElementById('ej-filter-gksub')?.value || '';
    const dur  = parseInt(document.getElementById('ej-filter-dur')?.value) || 0;
    const filtered = ejBancoCache.filter(e =>
        (!q    || e.name?.toLowerCase().includes(q)) &&
        (!tema || e.tema === tema) &&
        (!cat  || e.category === cat) &&
        (!edad || e.age_group === edad) &&
        (!dif  || String(e.difficulty) === dif) &&
        (!fase || e.game_phase === fase) &&
        (!jug  || e.players_count == jug) &&
        (!port || e.num_goalkeepers == port) &&
        (!gk    || (gk === 'si' ? e.es_portero === true : !e.es_portero)) &&
        (!gksub || e.subcategoria_portero === gksub) &&
        (!dur  || e.duration_min == dur)
    );
    const countEl = document.getElementById('ej-banco-count');
    if (countEl) countEl.textContent = filtered.length + ' ejercicio' + (filtered.length !== 1 ? 's' : '');
    ejBancoRender(filtered);
}

function ejBancoRender(list) {
    const grid = document.getElementById('ej-banco-grid');
    if (!grid) return;

    var esRev = ejBancoFuente === 'rev', esCom = ejBancoFuente === 'com' || esRev;
    // En cada pestaña solo lo suyo (un ejercicio propio recién guardado no se cuela en la Comunidad)
    list = list.filter(function (e) { return (e._com || 'mio') === ejBancoFuente; });
    var ENVIO = { pending_review: ['En revisión', '#fbbf24'], approved: ['En la Comunidad', '#4ade80'], rejected: ['No aceptado', '#f87171'] };
    var MAX = 1000;
    if (list.length > MAX) list = list.slice(0, MAX);
    var countEl = document.getElementById('ej-banco-count');
    if (countEl) countEl.textContent = list.length + ' ejercicio' + (list.length !== 1 ? 's' : '');

    if (!list.length) {
        grid.innerHTML = '<div style="color:#64748b;padding:30px;text-align:center;grid-column:1/-1">' + (esRev && !ejBancoCache.length ? 'No hay ejercicios pendientes de revisar.' : esCom && !ejBancoCache.length ? 'Todavía no hay ejercicios en la Comunidad.' : 'No hay ejercicios con estos filtros.') + '</div>';
        return;
    }

    var difColors = {'1':'#22c55e','2':'#22c55e','3':'#eab308','4':'#f97316','5':'#ef4444'};
    var html = '';

    for (var idx = 0; idx < list.length; idx++) {
        var e = list[idx];
        var difCol = difColors[e.difficulty] || '#6b7280';
        var tags = [];
        if (e.tema) tags.push(e.tema);
        if (e.age_group) tags.push(e.age_group);
        if (e.duration_min) tags.push(e.duration_min + 'min');
        if (e.players_count) tags.push(e.players_count + ' jug');
        var borderR = (idx % 4 !== 3) ? 'border-right:1px solid #1e3a5f;' : '';
        var tagsHTML = '';
        for (var t = 0; t < tags.length; t++) {
            tagsHTML += '<span style="font-size:10px;color:#94a3b8;background:#1e293b;padding:1px 6px;border-radius:4px">' + tags[t] + '</span>';
        }

           var thumbHTML;
        if (e.thumbnail_svg !== null) {
            thumbHTML = '<img data-ej-id="' + e.id + '" style="width:100%;height:100%;object-fit:cover;display:block;background:#0f4c2a" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" loading="lazy"/>';
        } else {
            thumbHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#475569;font-size:11px">sin dibujo</div>';
        }

        html += '<div style="padding:12px;' + borderR + 'border-bottom:1px solid #1e3a5f;min-width:0;overflow:hidden">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px">'
            + '<span style="font-size:13px;font-weight:600;color:#e2e8f0;line-height:1.3;flex:1;margin-right:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + e.name + '</span>'
            + (e.difficulty ? '<span style="font-size:10px;background:' + difCol + '20;color:' + difCol + ';padding:1px 7px;border-radius:4px;flex-shrink:0">' + e.difficulty + '</span>' : '')
            + '</div>'
            + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">' + tagsHTML
            + (!esCom && ENVIO[ejBancoEnvios[e.id]] ? '<span title="Estado de tu envío a la Comunidad" style="font-size:10px;font-weight:700;color:' + ENVIO[ejBancoEnvios[e.id]][1] + ';border:1px solid ' + ENVIO[ejBancoEnvios[e.id]][1] + ';padding:0 6px;border-radius:4px">' + ENVIO[ejBancoEnvios[e.id]][0] + '</span>' : '')
            + '</div>'
            + '<div onclick="' + (esCom ? 'ejComunidadVer' : 'ejVerFicha') + '(\'' + e.id + '\')" style="width:100%;aspect-ratio:8/5;overflow:hidden;border-radius:6px;margin-bottom:8px;background:#0f4c2a;cursor:pointer">'
            + thumbHTML
            + '</div>'
            + (esRev && e._retirada ? '<div style="font-size:11px;color:#fbbf24;background:#1e293b;border-left:3px solid #f59e0b;border-radius:5px;padding:5px 7px;margin-bottom:6px;white-space:pre-wrap;max-height:64px;overflow:auto"><b>Solicita retirarlo' + (e._autor ? ' (' + ejComEsc(e._autor) + ')' : '') + ':</b> ' + ejComEsc(e._retirada) + '</div><div style="display:flex;gap:4px">'
                + '<button onclick="ejComunidadVer(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#93c5fd;border-radius:6px;cursor:pointer">Ver</button>'
                + '<button onclick="ejComunidadRetiradaResolver(\'' + e.id + '\', false)" style="flex:1;padding:5px;font-size:11px;font-weight:700;background:#16a34a;border:1px solid #16a34a;color:#fff;border-radius:6px;cursor:pointer">Mantener</button>'
                + '<button onclick="ejConfirm(\'¿Retirar este ejercicio de la Comunidad? No se puede deshacer.\', function(){ ejComunidadRetiradaResolver(\'' + e.id + '\', true); })" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #7f1d1d;color:#fca5a5;border-radius:6px;cursor:pointer">Retirar</button>'
                + '</div></div>' : esRev ? '<div style="display:flex;gap:4px">'
                + '<button onclick="ejComunidadVer(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#93c5fd;border-radius:6px;cursor:pointer">Ver</button>'
                + '<button onclick="ejComunidadRevisar(\'' + e.id + '\', true)" style="flex:1;padding:5px;font-size:11px;font-weight:700;background:#16a34a;border:1px solid #16a34a;color:#fff;border-radius:6px;cursor:pointer">Aprobar</button>'
                + '<button onclick="ejComunidadRechazarAbrir(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #7f1d1d;color:#fca5a5;border-radius:6px;cursor:pointer">Rechazar</button>'
                + '</div></div>' : esCom ? '<div style="display:flex;gap:4px">'
                + '<button onclick="ejComunidadVer(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#93c5fd;border-radius:6px;cursor:pointer">Ver</button>'
                + '<button onclick="ejComunidadClonar(\'' + e.id + '\')" style="flex:2;padding:5px;font-size:11px;font-weight:700;background:#7c3aed;border:1px solid #7c3aed;color:#fff;border-radius:6px;cursor:pointer" title="Copiar a Mis ejercicios para usarlo y cambiarlo">Clonar a mis ejercicios</button>'
                + '</div></div>' : '')
            + (esCom ? '' : '<div style="display:flex;gap:4px">'
            + '<button onclick="ejVerFicha(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#93c5fd;border-radius:6px;cursor:pointer">Ver ficha</button>'
            + '<button onclick="ejBancoCargar(\'' + e.id + '\')" style="flex:1;padding:5px;font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;cursor:pointer">Editar</button>'
            + '<button data-ejgps="' + e.id + '" onclick="ejGpsFicha(\'' + e.id + '\')" style="display:none;padding:5px 8px;font-size:11px;background:#0f3d3e;border:1px solid #14b8a6;color:#5eead4;border-radius:6px;cursor:pointer" title="Datos GPS medidos en este ejercicio">GPS</button>'
            + '<button onclick="ejEliminarDesdeBanco(\'' + e.id + '\')" style="padding:5px 6px;font-size:11px;background:#1e293b;border:1px solid #7f1d1d;color:#fca5a5;border-radius:6px;cursor:pointer" title="Eliminar">🗑</button>'
            + '</div>'
            + '</div>');
    }

grid.innerHTML = html;

    // Convertir SVGs a Blob URLs
    setTimeout(function() {
                var imgs = grid.querySelectorAll('img[data-ej-id]');
        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var ejId = img.getAttribute('data-ej-id');
            var ex = ejBancoCache.find(function(x){ return String(x.id) === ejId; });
            if (ex && ex.thumbnail_svg) {
                try {
                    if (ex.thumbnail_svg.startsWith('data:')) {
                        img.src = ex.thumbnail_svg;
                    } else {
                        var blob = new Blob([ex.thumbnail_svg], {type: 'image/svg+xml'});
                        img.src = URL.createObjectURL(blob);
                    }
                } catch(err) {}
            }
        }
    }, 100);
}
async function ejVerFicha(id) {
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises').select('*').eq('id', id).single();
        if (error) throw error;
        ejEditandoId = data.id;
        // Vaciar antes todos los campos: si no, lo que este ejercicio tiene vacío se quedaba con el texto
        // del ejercicio abierto antes, y al guardar se le copiaba.
        ['ej-nombre','ej-objetivos','ej-descripcion','ej-variantes','ej-notas','ej-material',
         'ej-duracion','ej-jugadores','ej-ancho','ej-largo','ej-porteros'].forEach(function (fid) {
            var el = document.getElementById(fid); if (el) el.value = '';
        });
        ['ej-categoria','ej-edad','ej-dificultad','ej-fase','ej-tema','ej-subcat-portero'].forEach(function (fid) {
            var el = document.getElementById(fid); if (el) el.selectedIndex = 0;
        });
        const set = (fid, val) => { const el = document.getElementById(fid); if (el && val != null && val !== '') el.value = val; };
        set('ej-nombre', data.name);
        var nombreInput = document.getElementById('ej-nombre');
        if (nombreInput) { nombreInput.readOnly = true; nombreInput.style.background = '#1e293b'; nombreInput.style.color = '#64748b'; }
        var lockMsg = document.getElementById('ej-nombre-lock-msg');
        if (lockMsg) lockMsg.style.display = 'block';
        set('ej-categoria', data.category);
        set('ej-edad', data.age_group);
        set('ej-duracion', data.duration_min);
        set('ej-jugadores', data.players_count);
        set('ej-dificultad', data.difficulty);
        set('ej-fase', data.game_phase);
        set('ej-objetivos', data.objectives);
        set('ej-descripcion', data.description);
        set('ej-variantes', data.variants);
        set('ej-notas', data.coach_notes);
        set('ej-material', data.materials);
        set('ej-tema', data.tema);
        set('ej-porteros', data.num_goalkeepers);
        var chkA = document.getElementById('ej-es-portero'); if (chkA) chkA.checked = !!data.es_portero; ejTogglePortero();
        set('ej-subcat-portero', data.subcategoria_portero);
        set('ej-ancho', data.field_width);
        set('ej-largo', data.field_length);
        ejCalcEII();
        if (data.thumbnail_svg) window.ejThumbnailPendiente = data.thumbnail_svg;
        ejP._lastVideoUrl = data.animation_url || null;
        ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
        setTimeout(() => { ejActualizarFichaMedia(); ejPrepararThumbParaPDF(); }, 300);
    } catch(err) {
        ejToast('Error al cargar: ' + err.message, 'error');
    }
}
async function ejBancoCargar(id) {
    try {
        const { data, error } = await supabaseClient
            .from('custom_exercises').select('*').eq('id', id).single();
        if (error) throw error;

        // 1. Parar animación si estaba reproduciéndose
        ejFrameStop();
        ejProyFaseCargadaId = null; // la pizarra pasa a mostrar un ejercicio del banco
        ejPizarraDeId = data.id;   // "Editar" deja en la pizarra el dibujo de este ejercicio (o la vacía si no tiene)

        // 1b. Limpiar media del ejercicio anterior
        window.ejThumbnailPendiente = null;
        window._ejPdfThumbData = null;
        ejP._lastVideoUrl = null;

        // 2. Cargar board_data en la pizarra
        if (data.board_data) {
            ejSaveHistory();
            ejP.players   = ejColoresResolver(data.board_data.players || []);
            ejP.lines     = data.board_data.lines   || [];
            ejP.shapes    = data.board_data.shapes  || [];
            ejP.texts     = data.board_data.texts   || [];
            ejP.equipment = data.board_data.equipment || [];
            ejP.connections = data.board_data.connections || [];
            ejP.fieldType = data.board_data.fieldType || 'full'; ejFondoCargar(data.board_data); ejP.showCarriles = !!data.board_data.showCarriles; ejP.showZonas = !!data.board_data.showZonas; ejP.showRejilla = !!data.board_data.showRejilla;
            ejP.selectedId = null;
            ejP._lastVideoUrl = data.animation_url || null;

            ejP.nextId = [].concat(ejP.players, ejP.lines, ejP.shapes, ejP.texts, ejP.equipment, ejP.connections).reduce(function(max, e){ return (e.id > max ? e.id : max); }, 0) + 1;

            // 3. Restaurar animación o resetearla
            if (data.board_data.animFrames && data.board_data.animFrames.length > 0) {
                ejP.frames = data.board_data.animFrames;
                ejP.currentFrame = 0;
                ejP.animMode = data.board_data.animMode || false;
                ejFrameRestore(ejP.frames[0]);
            } else {
                ejP.animMode = false;
                ejP.frames = [];
                ejP.currentFrame = 0;
            }

            // 4. Ocultar overlay y mostrar toolbar
            var overlay = document.getElementById('ej-modo-overlay');
            if (overlay) overlay.style.display = 'none';
            var tb = document.getElementById('ej-toolbar');
            if (tb) tb.style.display = '';

            ejRenderSVG();
        } else {
            // Sin dibujo: resetear pizarra
            ejP.players = []; ejP.lines = []; ejP.shapes = []; ejP.texts = []; ejP.equipment = []; ejP.connections = [];
            ejP.selectedId = null;
            ejP.animMode = false;
            ejP.frames = [];
            ejP.currentFrame = 0;
            ejRenderSVG();
        }

        // 5. Siempre actualizar timeline según el estado real
        var tlBar = document.getElementById('ej-timeline-bar');
        if (tlBar) tlBar.style.display = ejP.animMode ? 'block' : 'none';
        ejRenderTimeline();

        // 5. Asignar ID de edición
        ejEditandoId = data.id;

        // 6. Limpiar TODOS los campos de la ficha antes de rellenar
        ['ej-nombre','ej-objetivos','ej-descripcion','ej-variantes','ej-notas','ej-material',
         'ej-duracion','ej-jugadores','ej-ancho','ej-largo','ej-porteros'].forEach(function(fid) {
            var el = document.getElementById(fid); if (el) el.value = '';
        });
        ['ej-categoria','ej-edad','ej-dificultad','ej-fase','ej-tema'].forEach(function(fid) {
            var el = document.getElementById(fid); if (el) el.selectedIndex = 0;
        });

        // 7. Rellenar ficha con los datos del ejercicio
        var setVal = function(fid, val) { var el = document.getElementById(fid); if (el && val != null && val !== '') el.value = val; };
        setVal('ej-nombre', data.name);
        setVal('ej-categoria', data.category);
        setVal('ej-edad', data.age_group);
        setVal('ej-duracion', data.duration_min);
        setVal('ej-jugadores', data.players_count);
        setVal('ej-dificultad', data.difficulty);
        setVal('ej-fase', data.game_phase);
        setVal('ej-objetivos', data.objectives);
        setVal('ej-descripcion', data.description);
        setVal('ej-variantes', data.variants);
        setVal('ej-notas', data.coach_notes);
        setVal('ej-material', data.materials);
        setVal('ej-tema', data.tema);
         setVal('ej-porteros', data.num_goalkeepers);
        var chkB = document.getElementById('ej-es-portero'); if (chkB) chkB.checked = !!data.es_portero; ejTogglePortero();
        setVal('ej-subcat-portero', data.subcategoria_portero);
        setVal('ej-ancho', data.field_width);
        setVal('ej-largo', data.field_length);
        ejCalcEII();

        // 8. Thumbnail y vídeo
        ejP._lastVideoUrl = data.animation_url || null;
        // Capturar miniatura en vivo desde la pizarra (colores fiables)
        var svgEl = document.getElementById('ej-svg');
        if (svgEl && ejP.players.length > 0) {
            var prevSel = ejP.selectedId;
            var prevExp = ejP._exporting;
            ejP.selectedId = null;
            ejP._exporting = true;
            ejRenderSVG();
            window.ejThumbnailPendiente = new XMLSerializer().serializeToString(svgEl);
            ejP.selectedId = prevSel;
            ejP._exporting = prevExp || false;
            ejRenderSVG();
        } else if (data.thumbnail_svg) {
            window.ejThumbnailPendiente = data.thumbnail_svg;
        }

        // 9. Mostrar ficha y actualizar media
        ejShowTab('ficha', document.querySelector('[onclick*="\'ficha\'"]'));
        setTimeout(function() { ejActualizarFichaMedia(); ejPrepararThumbParaPDF(); }, 300);

        // 10. Mostrar barra con nombre del ejercicio cargado
        var topbar = document.getElementById('ej-pizarra-topbar');
        var lbl = document.getElementById('ej-pizarra-nombre-label');
        if (topbar && lbl) { lbl.textContent = data.name; topbar.style.display = 'flex'; }

        // 11. Actualizar toolbar
        ejRenderToolbar();
    } catch(err) {
        ejToast('Error al cargar: ' + err.message, 'error');
    }
}

// =============================================
// MODAL FICHA EJERCICIO
// =============================================
function ejAbrirModal(id) {
    const e = ejBancoCache.find(x => x.id === id);
    if (!e) return;

    const difColor = { basico: '#22c55e', medio: '#eab308', avanzado: '#ef4444' };

    // Eliminar modal previo si existe
    const prev = document.getElementById('ej-modal-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ej-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px)';

    const difBadge = e.difficulty
        ? `<span style="font-size:11px;background:${difColor[e.difficulty]||'#6b7280'}25;color:${difColor[e.difficulty]||'#9ca3af'};padding:2px 10px;border-radius:10px;margin-left:8px;border:1px solid ${difColor[e.difficulty]||'#6b7280'}40">${e.difficulty}</span>`
        : '';

    const metaTags = [
        e.category    && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">📁 ${e.category}</span>`,
        e.age_group   && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">🎂 ${e.age_group}</span>`,
        e.duration_min && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">⏱ ${e.duration_min} min</span>`,
        e.players_count && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">👥 ${e.players_count} jug.</span>`,
        e.game_phase  && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">⚽ ${e.game_phase}</span>`,
        e.eii         && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">📐 EII: ${e.eii} m²/jug</span>`,
        e.materials   && `<span style="background:#1e3a5f;padding:3px 10px;border-radius:6px">🧰 ${e.materials}</span>`
    ].filter(Boolean).join('');

    function infoBlock(label, icon, value) {
        if (!value) return '';
        return `<div style="background:#0f172a;border-radius:8px;padding:10px 12px">
            <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">${icon} ${label}</div>
            <div style="color:#e2e8f0;font-size:13px;line-height:1.5">${value}</div>
        </div>`;
    }

    overlay.innerHTML = `
    <div style="background:#1e293b;border-radius:14px;max-width:920px;width:100%;max-height:92vh;overflow-y:auto;position:relative;box-shadow:0 25px 60px rgba(0,0,0,.6)">

        <!-- Header -->
        <div style="padding:20px 24px 16px;border-bottom:1px solid #334155;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
            <div>
                <h2 style="color:#f8fafc;margin:0 0 8px;font-size:20px;font-weight:700">${e.name}${difBadge}</h2>
                <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px;color:#94a3b8">${metaTags || '<span style="color:#475569">Sin categoría</span>'}</div>
            </div>
            <button id="ej-modal-close" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center">✕</button>
        </div>

        <!-- Body -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

            <!-- Columna izquierda: dibujo -->
            <div style="padding:20px 12px 20px 24px;border-right:1px solid #334155">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">🎨 Pizarra táctica</div>
                <div id="ej-modal-svg-container" style="width:100%;aspect-ratio:8/5;overflow:hidden;border-radius:10px;background:#0f4c2a;margin-bottom:14px;box-shadow:inset 0 2px 8px rgba(0,0,0,.4)">
                    <div style="color:#475569;font-size:12px;display:flex;align-items:center;justify-content:center;height:100%">Sin dibujo guardado</div>
                </div>
                <button id="ej-modal-cargar-btn" style="width:100%;padding:10px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
                    📋 Cargar en pizarra
                </button>
            ${e.animation_url ? `
                <div style="margin-top:10px">
                    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎬 Animación del ejercicio</div>
                    <video src="${e.animation_url}" controls playsinline loop style="width:100%;border-radius:8px;background:#000"></video>
<a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url=${encodeURIComponent(e.animation_url)}" target="_blank" style="display:block;width:100%;margin-top:8px;padding:10px;background:#f97316;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;text-align:center;text-decoration:none">
                    </a>
                </div>` : ''}
            </div>

            <!-- Columna derecha: info -->
            <div style="padding:20px 24px 20px 12px;display:flex;flex-direction:column;gap:8px">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">📄 Detalles del ejercicio</div>
                ${infoBlock('Objetivos', '🎯', e.objectives)}
                ${infoBlock('Descripción', '📝', e.description)}
                ${infoBlock('Variantes', '🔀', e.variants)}
                ${infoBlock('Notas del entrenador', '💬', e.coach_notes)}
                ${!e.objectives && !e.description && !e.variants && !e.coach_notes
                    ? '<div style="color:#475569;font-size:13px;padding:20px 0">Sin información adicional.</div>'
                    : ''}
            </div>
        </div>

        <!-- Footer -->
        <div style="padding:14px 24px;border-top:1px solid #334155;display:flex;justify-content:flex-end;gap:8px">
            <button id="ej-modal-eliminar-btn" style="padding:8px 16px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:8px;cursor:pointer;font-size:12px">🗑 Eliminar</button>
            <button id="ej-modal-cerrar-btn" style="padding:8px 16px;background:#334155;border:none;color:#cbd5e1;border-radius:8px;cursor:pointer;font-size:12px">Cerrar</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);

    // Insertar SVG de forma segura (evita romper el template si contiene backticks)
    if (e.thumbnail_svg) {
        const svgContainer = document.getElementById('ej-modal-svg-container');
        if (svgContainer) svgContainer.innerHTML = (e.thumbnail_svg.trim().indexOf('data:') === 0) ? '<img src="' + e.thumbnail_svg.trim() + '" style="width:100%;height:100%;object-fit:contain;display:block">' : e.thumbnail_svg;
    }

    // Eventos de botones via addEventListener (sin problemas de escapado)
    document.getElementById('ej-modal-close').addEventListener('click', () => overlay.remove());
    document.getElementById('ej-modal-cerrar-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove(); });

    document.getElementById('ej-modal-cargar-btn').addEventListener('click', () => {
        ejBancoCargar(e.id);
        overlay.remove();
    });

    document.getElementById('ej-modal-eliminar-btn').addEventListener('click', () => {
        ejConfirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.', async () => {
            try {
                const { error } = await supabaseClient.from('custom_exercises').delete().eq('id', e.id);
                if (error) throw error;
                overlay.remove();
                ejBancoCache = ejBancoCache.filter(x => x.id !== e.id);
                ejBancoRender(ejBancoCache);
            } catch(err) {
                ejToast('Error al eliminar: ' + err.message, 'error');
            }
        });
    });
}
// =============================================
// SISTEMA DE ANIMACIÓN POR FRAMES
// =============================================

function ejToggleAnimMode() {
    ejP.animMode = !ejP.animMode;
    if (ejP.animMode) {
        ejP.activeTool = 'select';  
        // Al activar: guardar estado actual como frame 0
        ejP.frames = [ejFrameSnapshot()];
        ejP.currentFrame = 0;
        ejP.isPlaying = false;
    } else {
        // Al desactivar: parar reproducción
        ejFrameStop();
        ejP.frames = [];
        ejP.currentFrame = 0;
    }
    const bar = document.getElementById('ej-timeline-bar');
    if (bar) bar.style.display = ejP.animMode ? 'block' : 'none';
    ejRenderTimeline();
    ejRenderToolbar();
}

// Captura las posiciones actuales de jugadores y equipamiento
function ejFrameSnapshot() {
    return {
        players: ejP.players.map(p => ({ id: p.id, x: p.x, y: p.y })),
        equipment: ejP.equipment.map(eq => ({ id: eq.id, x: eq.x, y: eq.y })),
        trajectories: []
    };
}

// Restaura posiciones desde un frame guardado
function ejFrameRestore(frame) {
    if (!frame) return;
    for (const fp of frame.players) {
        const p = ejP.players.find(pl => pl.id === fp.id);
        if (p) { p.x = fp.x; p.y = fp.y; }
    }
    for (const fe of frame.equipment) {
        const eq = ejP.equipment.find(e => e.id === fe.id);
        if (eq) { eq.x = fe.x; eq.y = fe.y; }
    }
}

// Guarda el estado actual en el frame actual
function ejFrameSaveCurrent() {
    if (!ejP.animMode || ejP.frames.length === 0) return;
    const existing = ejP.frames[ejP.currentFrame];
    const snap = ejFrameSnapshot();
    // Preservar trayectorias y undoStack al guardar posiciones
    snap.trajectories = existing ? (existing.trajectories || []) : [];
    snap.undoStack = existing ? (existing.undoStack || []) : [];
    ejP.frames[ejP.currentFrame] = snap;
}

// Añade un nuevo frame (clona posiciones del frame actual)
function ejFrameAdd() {
    if (!ejP.animMode) return;
    if (ejP.animMode) ejP._videoDesactualizado = true;
    ejFrameSaveCurrent();
    // Aplicar trayectorias: mover elementos a su destino
    const cf = ejP.frames[ejP.currentFrame];
    if (cf && cf.trajectories) {
        for (const traj of cf.trajectories) {
            if (!traj.isMovement || traj.toX === undefined) continue;
            const pl = ejP.players.find(p => p.id === traj.linkedId);
            if (pl) { pl.x = traj.toX; pl.y = traj.toY; }
            const eq = ejP.equipment.find(e => e.id === traj.linkedId);
            if (eq) { eq.x = traj.toX; eq.y = traj.toY; }
        }
    }
    const newFrame = ejFrameSnapshot();
    ejP.frames.push(newFrame);
    ejP.currentFrame = ejP.frames.length - 1;
    ejRenderSVG();
    ejRenderTimeline();
}

// Elimina el último frame
function ejFrameDeleteLast() {
    if (!ejP.animMode || ejP.frames.length <= 1) return;
    ejConfirm('¿Eliminar el último frame?', () => {
    ejP.frames.pop();
    if (ejP.currentFrame >= ejP.frames.length) {
        ejP.currentFrame = ejP.frames.length - 1;
    }
    ejFrameRestore(ejP.frames[ejP.currentFrame]);
    ejRenderSVG();
    ejRenderTimeline();
    });
}
function ejFrameUndoTraj() {
    if (!ejP.animMode) return;
    const frame = ejP.frames[ejP.currentFrame];
    if (!frame || !frame.undoStack || frame.undoStack.length === 0) return;
    const action = frame.undoStack.pop();
    if (frame.trajectories) frame.trajectories = frame.trajectories.filter(t => t.id !== action.trajId);
    ejRenderSVG();
    ejRenderTimeline();
}
// Navega a un frame específico
function ejFrameGo(idx) {
    if (!ejP.animMode || idx < 0 || idx >= ejP.frames.length) return;
    if (ejP.isPlaying) ejFrameStop();
    // Guardar posiciones actuales antes de cambiar
    ejFrameSaveCurrent();
    ejP.currentFrame = idx;
    ejFrameRestore(ejP.frames[idx]);
    ejRenderSVG();
    ejRenderTimeline();
}

function ejFramePrev() {
    if (ejP.currentFrame > 0) ejFrameGo(ejP.currentFrame - 1);
}

function ejFrameNext() {
    if (ejP.currentFrame < ejP.frames.length - 1) ejFrameGo(ejP.currentFrame + 1);
}

// Reproducción
function ejFramePlay(fromFrame) {
    if (!ejP.animMode || ejP.frames.length < 2) return;
    ejFrameSaveCurrent();
    const startIdx = (fromFrame !== undefined) ? fromFrame : ejP.currentFrame;
    if (startIdx >= ejP.frames.length - 1) {
        ejP.currentFrame = 0;
        ejFrameRestore(ejP.frames[0]);
        ejRenderSVG();
    } else {
        ejP.currentFrame = startIdx;
    }
    ejP.isPlaying = true;
    ejP._animDom = null;
    ejP._giros = null;
    ejP._sonidoSeg = -1;
    if (ejSonidoActivo()) ejSonidoPreparar();
    ejP._animFrame = ejP.currentFrame;
    ejP._animProgress = 0;
    ejP._globalProgress = ejP.currentFrame; // progreso global continuo
    ejP._animLastTime = performance.now();
    ejP._animId = requestAnimationFrame(ejFrameAnimate);
    ejRenderTimeline();
}

function ejFrameStop() {
    ejP.isPlaying = false;
    ejP._animDom = null;
    ejP._giros = null;
    ejP._globalProgress = 0;
    if (ejP._animId) {
        cancelAnimationFrame(ejP._animId);
        ejP._animId = null;
    }
    // Restaurar el frame actual limpio
    if (ejP.frames[ejP.currentFrame]) {
        ejFrameRestore(ejP.frames[ejP.currentFrame]);
        ejRenderSVG();
    }
    ejRenderTimeline();
}

// Catmull-Rom spline: suaviza curvas entre 4 puntos (p0,p1,p2,p3)
// Mezcla 70% lineal + 30% spline para estabilidad
function ejCatmullRom(p0, p1, p2, p3, t) {
    var spline = 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2*p0 - 5*p1 + 4*p2 - p3) * t*t +
        (-p0 + 3*p1 - 3*p2 + p3) * t*t*t
    );
    var linear = p1 + (p2 - p1) * t;
    return linear * 0.7 + spline * 0.3;
}

// Helper: interpola un elemento usando trayectoria o Catmull-Rom entre frames
function ejInterpolateElem(id, fA, fB, ease, frameIdx, elemType) {
    var aList = elemType === 'player' ? fA.players : fA.equipment;
    var bList = elemType === 'player' ? fB.players : fB.equipment;
    var liveList = elemType === 'player' ? ejP.players : ejP.equipment;
    var pa = aList.find(function(p) { return p.id === id; });
    var pb = bList.find(function(p) { return p.id === id; });
    var elem = liveList.find(function(p) { return p.id === id; });
    if (!pa || !pb || !elem) return;

    // Buscar trayectoria freehand
    var trajFree = (fA.trajectories || []).find(function(tr) {
        return tr.isMovement && tr.linkedId === id && tr.type === 'freehand' && tr.points && tr.points.length > 1;
    });
    if (trajFree) {
        var pts = trajFree.points;
        var pos = ease * (pts.length - 1);
        var idx = Math.min(Math.floor(pos), pts.length - 2);
        var frac = pos - idx;
        elem.x = pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac;
        elem.y = pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac;
        return;
    }

    // Buscar trayectoria curva
    var trajCurved = (fA.trajectories || []).find(function(tr) {
        return tr.isMovement && tr.linkedId === id && tr.type === 'curved';
    });
    if (trajCurved) {
        var cx = trajCurved.cx ?? (trajCurved.x1 + trajCurved.x2) / 2;
        var cy = trajCurved.cy ?? (trajCurved.y1 + trajCurved.y2) / 2 - 40;
        elem.x = (1-ease)*(1-ease)*trajCurved.x1 + 2*(1-ease)*ease*cx + ease*ease*trajCurved.x2;
        elem.y = (1-ease)*(1-ease)*trajCurved.y1 + 2*(1-ease)*ease*cy + ease*ease*trajCurved.y2;
        return;
    }

    // Sin trayectoria: Catmull-Rom con frames vecinos para suavidad
    if (Math.abs(pa.x - pb.x) < 2 && Math.abs(pa.y - pb.y) < 2) {
        elem.x = pa.x; elem.y = pa.y;
        return;
    }
    var prevFrame = ejP.frames[frameIdx - 1];
    var nextFrame = ejP.frames[frameIdx + 2];
    var pPrev = prevFrame ? (elemType === 'player' ? prevFrame.players : prevFrame.equipment).find(function(p) { return p.id === id; }) : null;
    var pNext = nextFrame ? (elemType === 'player' ? nextFrame.players : nextFrame.equipment).find(function(p) { return p.id === id; }) : null;
    var x0 = pPrev ? pPrev.x : pa.x;
    var y0 = pPrev ? pPrev.y : pa.y;
    var x3 = pNext ? pNext.x : pb.x;
    var y3 = pNext ? pNext.y : pb.y;
    elem.x = ejCatmullRom(x0, pa.x, pb.x, x3, ease);
    elem.y = ejCatmullRom(y0, pa.y, pb.y, y3, ease);
}

// Loop de animación con interpolación suave
// Easing GLOBAL: solo frena al inicio y al final de toda la secuencia.
// Entre frames intermedios el movimiento fluye continuo sin paradas.
function ejFrameAnimate(now) {
    if (!ejP.isPlaying) return;
    const dt = now - ejP._animLastTime;
    ejP._animLastTime = now;

    // Progreso global continuo (0 → totalFrames-1)
    var totalSegs = ejP.frames.length - 1;
    if (totalSegs < 1) { ejFrameStop(); return; }
    var segDuration = ejP.playSpeed * 1.2;
    ejP._globalProgress = (ejP._globalProgress || 0) + dt / segDuration;

    if (ejP._globalProgress >= totalSegs) {
        // Fin de la secuencia
        ejP.currentFrame = ejP.frames.length - 1;
        ejFrameRestore(ejP.frames[ejP.currentFrame]);
        ejRenderSVG();
        ejP._globalProgress = 0;
        ejFrameStop();
        return;
    }

    // Aplicar easing global: suavizar solo el 15% inicial y el 15% final
    var rawT = ejP._globalProgress / totalSegs; // 0→1 global
    var easeZone = 0.15;
    var easedT;
    if (rawT < easeZone) {
        // Ease-in: acelera suavemente desde parado
        var local = rawT / easeZone;
        easedT = easeZone * (local * local * (3 - 2 * local));
    } else if (rawT > 1 - easeZone) {
        // Ease-out: frena suavemente al final
        var local = (rawT - (1 - easeZone)) / easeZone;
        easedT = (1 - easeZone) + easeZone * (local * local * (3 - 2 * local));
    } else {
        // Medio: velocidad constante, fluido
        easedT = rawT;
    }

    // Convertir progreso global eased a segmento + fracción
    var globalPos = easedT * totalSegs;
    var seg = Math.min(Math.floor(globalPos), totalSegs - 1);
    var frac = globalPos - seg;

    ejP.currentFrame = seg;
    ejP._animFrame = seg;

    var fA = ejP.frames[seg];
    var fB = ejP.frames[seg + 1];
    if (!fA || !fB) { ejFrameStop(); return; }

    // Interpolar jugadores
    for (var i = 0; i < fA.players.length; i++) {
        ejInterpolateElem(fA.players[i].id, fA, fB, frac, seg, 'player');
    }
    // Interpolar equipamiento
    for (var i = 0; i < fA.equipment.length; i++) {
        ejInterpolateElem(fA.equipment[i].id, fA, fB, frac, seg, 'equipment');
    }

    ejAnimGiros();
    if (ejP._sonidoSeg !== seg) { ejP._sonidoSeg = seg; if (ejSonidoActivo() && ejAnimGolpeEn(seg)) ejSonidoGolpeAhora(); }
    // Solo se redibuja la pizarra al cambiar de tramo; dentro del tramo se mueven las fichas ya dibujadas
    if (!ejAnimMover(seg)) {
        ejRenderSVG();
        ejRenderTimeline();
        ejAnimPreparar(seg);
    }
    ejP._animId = requestAnimationFrame(ejFrameAnimate);
}

// Reproducción fluida: tras dibujar la pizarra una vez por tramo, se guardan las piezas que se mueven
// (fichas, material, uniones y marcas de posición anterior) para desplazarlas sin volver a dibujarlo todo.
function ejAnimPreparar(seg) {
    const svg = document.getElementById('ej-svg');
    ejP._animDom = null;
    if (!svg) return;
    const d = { seg: seg, svg: svg, jug: [], mat: [], uni: [], fant: [] };
    ejP.players.forEach(function (p) {
        const g = svg.querySelector('g[data-type="player"][data-id="' + p.id + '"]');
        if (g) d.jug.push({ p: p, g: g, x: p.x, y: p.y });
    });
    ejP.equipment.forEach(function (q) {
        const g = svg.querySelector('g[data-type="equipment"][data-id="' + q.id + '"]');
        if (g) d.mat.push({ q: q, g: g, x0: q.x, y0: q.y, x: q.x, y: q.y, giro0: ejGiroDe(q.id), giro: ejGiroDe(q.id), base: g.getAttribute('transform') || '' });
    });
    ejP.connections.forEach(function (c) {
        const g = svg.querySelector('g[data-type="connection"][data-id="' + c.id + '"]');
        const a = ejP.players.find(function (p) { return p.id === c.from; });
        const b = ejP.players.find(function (p) { return p.id === c.to; });
        if (g && a && b) d.uni.push({ a: a, b: b, lineas: g.querySelectorAll('line') });
    });
    svg.querySelectorAll('circle[data-fant]').forEach(function (c) {
        const id = c.getAttribute('data-fant');
        const p = ejP.players.find(function (x) { return String(x.id) === id; });
        if (p) d.fant.push({ p: p, c: c, x: parseFloat(c.getAttribute('cx')), y: parseFloat(c.getAttribute('cy')), ver: c.style.display !== 'none' });
    });
    d.centinela = svg.firstElementChild;
    ejP._animDom = d;
}
// ---- Sonido del golpeo ----
// Suena un golpe seco cuando el balón arranca un desplazamiento largo (pase, tiro, despeje).
// Las conducciones cortas no suenan, y un pase partido en dos fotogramas seguidos en la misma dirección suena una vez.
var EJ_GOLPE_MIN_PX = 60, EJ_GOLPE_MISMO_RUMBO = 25;
function ejSonidoActivo() {
    if (ejP.animSonido === undefined) {
        var v = null;
        try { v = localStorage.getItem('tlc_pizarra_sonido'); } catch (e) {}
        ejP.animSonido = v !== '0';
    }
    return ejP.animSonido;
}
function ejSonidoConmutar() {
    ejP.animSonido = !ejSonidoActivo();
    try { localStorage.setItem('tlc_pizarra_sonido', ejP.animSonido ? '1' : '0'); } catch (e) {}
    if (ejP.animSonido) { ejSonidoPreparar(); ejSonidoGolpeAhora(); }
    ejRenderTimeline();
}
// ¿Algún balón arranca un golpeo en el tramo que va del fotograma seg al seg+1?
function ejAnimGolpeEn(seg) {
    var fA = ejP.frames[seg], fB = ejP.frames[seg + 1], f0 = ejP.frames[seg - 1];
    if (!fA || !fB) return false;
    for (var i = 0; i < ejP.equipment.length; i++) {
        var q = ejP.equipment[i];
        if (q.eqType !== 'ball') continue;
        var a = fA.equipment.find(function (x) { return x.id === q.id; }), b = fB.equipment.find(function (x) { return x.id === q.id; });
        if (!a || !b) continue;
        var dx = b.x - a.x, dy = b.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < EJ_GOLPE_MIN_PX) continue;
        var z = f0 && f0.equipment.find(function (x) { return x.id === q.id; });
        if (z) {
            var px = a.x - z.x, py = a.y - z.y;
            if (Math.sqrt(px * px + py * py) >= EJ_GOLPE_MIN_PX) {
                // Ya venía en movimiento: solo es otro golpeo si cambia de rumbo
                var dif = Math.abs(Math.atan2(dy, dx) - Math.atan2(py, px)) * 180 / Math.PI;
                if (dif > 180) dif = 360 - dif;
                if (dif < EJ_GOLPE_MISMO_RUMBO) continue;
            }
        }
        return true;
    }
    return false;
}
// El golpe: un tono grave que cae rápido más un chasquido corto. Sirve para el altavoz y para el vídeo.
function ejSonidoGolpe(ctx, cuando) {
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, cuando);
    osc.frequency.exponentialRampToValueAtTime(52, cuando + 0.09);
    g.gain.setValueAtTime(0.0001, cuando);
    g.gain.exponentialRampToValueAtTime(0.9, cuando + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.16);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(cuando); osc.stop(cuando + 0.18);
    var n = Math.floor(ctx.sampleRate * 0.03), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var ruido = ctx.createBufferSource(), filtro = ctx.createBiquadFilter(), gr = ctx.createGain();
    ruido.buffer = buf; filtro.type = 'bandpass'; filtro.frequency.value = 1400; filtro.Q.value = 0.8;
    gr.gain.setValueAtTime(0.35, cuando); gr.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.03);
    ruido.connect(filtro); filtro.connect(gr); gr.connect(ctx.destination);
    ruido.start(cuando);
}
function ejSonidoPreparar() {
    try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        if (!ejP._audioCtx) ejP._audioCtx = new AC();
        if (ejP._audioCtx.state === 'suspended') ejP._audioCtx.resume();
        return ejP._audioCtx;
    } catch (e) { return null; }
}
function ejSonidoGolpeAhora() {
    var ctx = ejSonidoPreparar();
    if (!ctx) return;
    try { ejSonidoGolpe(ctx, ctx.currentTime + 0.01); } catch (e) {}
}
// El balón gira mientras se mueve: cuanto más recorre, más gira, y en el sentido en que avanza.
// El giro solo existe durante la reproducción o al crear el vídeo; no se guarda en el ejercicio.
var EJ_GIRO_GRADOS_POR_PX = 4.5, EJ_GIRO_MAX_PASO = 40;
function ejGiroDe(id) {
    var g = ejP._giros && ejP._giros[id];
    return g ? g.deg : 0;
}
function ejAnimGiros() {
    if (!ejP._giros) ejP._giros = {};
    for (var i = 0; i < ejP.equipment.length; i++) {
        var q = ejP.equipment[i];
        if (q.eqType !== 'ball') continue;
        var g = ejP._giros[q.id];
        if (!g) { ejP._giros[q.id] = { x: q.x, y: q.y, deg: 0 }; continue; }
        var dx = q.x - g.x, dy = q.y - g.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.01) continue;
        var sentido = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 1 : -1) : (dy >= 0 ? 1 : -1);
        g.deg = Math.round(((g.deg + sentido * Math.min(d * EJ_GIRO_GRADOS_POR_PX, EJ_GIRO_MAX_PASO)) % 360) * 10) / 10;
        g.x = q.x; g.y = q.y;
    }
}
function ejAnimMover(seg) {
    const d = ejP._animDom;
    // Si ha cambiado el tramo o alguien ha redibujado la pizarra, hay que volver a prepararla
    if (!d || d.seg !== seg || !d.centinela || !d.centinela.isConnected || d.svg.firstElementChild !== d.centinela
        || d.jug.length !== ejP.players.length || d.mat.length !== ejP.equipment.length) return false;
    var i, o;
    for (i = 0; i < d.jug.length; i++) {
        o = d.jug[i];
        if (o.p.x !== o.x || o.p.y !== o.y) { o.x = o.p.x; o.y = o.p.y; o.g.setAttribute('transform', 'translate(' + o.x + ',' + o.y + ')'); }
    }
    for (i = 0; i < d.mat.length; i++) {
        o = d.mat[i];
        var giro = ejGiroDe(o.q.id);
        if (o.q.x !== o.x || o.q.y !== o.y || giro !== o.giro) {
            o.x = o.q.x; o.y = o.q.y; o.giro = giro;
            o.g.setAttribute('transform', 'translate(' + (o.x - o.x0) + ',' + (o.y - o.y0) + ') ' + (giro !== o.giro0 ? 'rotate(' + (giro - o.giro0) + ',' + o.x0 + ',' + o.y0 + ') ' : '') + o.base);
        }
    }
    for (i = 0; i < d.uni.length; i++) {
        o = d.uni[i];
        for (var k = 0; k < o.lineas.length; k++) {
            var ln = o.lineas[k];
            ln.setAttribute('x1', o.a.x); ln.setAttribute('y1', o.a.y); ln.setAttribute('x2', o.b.x); ln.setAttribute('y2', o.b.y);
        }
    }
    for (i = 0; i < d.fant.length; i++) {
        o = d.fant[i];
        var ver = Math.abs(o.p.x - o.x) > 3 || Math.abs(o.p.y - o.y) > 3;
        if (ver !== o.ver) { o.ver = ver; o.c.style.display = ver ? '' : 'none'; }
    }
    return true;
}

function ejFrameSetSpeed(ms) {
    ejP.playSpeed = ms;
    ejRenderTimeline();
}

// Renderiza la barra de timeline
function ejRenderTimeline() {
    const bar = document.getElementById('ej-timeline-bar');
    if (!bar || !ejP.animMode) return;

    const total = ejP.frames.length;
    const cur = ejP.currentFrame;

    let dots = '';
    for (let i = 0; i < total; i++) {
        dots += `<button type="button" class="ej-tl-punto${i === cur ? ' on' : ''}" onclick="ejFrameGo(${i})" title="Fotograma ${i+1}">${i+1}</button>`;
    }
    const vel = ejP.playSpeed >= 1500 ? 0 : (ejP.playSpeed >= 800 ? 1 : 2);

    bar.innerHTML = `
    <div class="ej-tl">
        <div class="ej-tl-g">
            ${ejP.isPlaying
                ? '<button class="ej-tl-btn pri parar" onclick="ejFrameStop()"><i class="ej-ico ej-ico-stop"></i><span>Parar</span></button>'
                : '<button class="ej-tl-btn pri" onclick="ejFramePlay()" ' + (total<2?'disabled':'') + '><i class="ej-ico ej-ico-play"></i><span>Play</span></button>'
            }
            <button class="ej-tl-btn ico" onclick="ejFramePrev()" title="Fotograma anterior" ${cur<=0?'disabled':''}><i class="ej-ico ej-ico-izq"></i></button>
            <button class="ej-tl-btn ico" onclick="ejFrameNext()" title="Fotograma siguiente" ${cur>=total-1?'disabled':''}><i class="ej-ico ej-ico-der"></i></button>
        </div>
        <div class="ej-tl-puntos">
            ${dots}
        </div>
        <div class="ej-tl-g">
            <button class="ej-tl-btn" onclick="ejFrameAdd()" title="Añadir un fotograma con la posición actual"><i class="ej-ico ej-ico-mas"></i><span>Fotograma</span></button>
            <button class="ej-tl-btn peligro" onclick="ejFrameDeleteLast()" title="Borrar el último fotograma" ${total<=1?'disabled':''}><i class="ej-ico ej-ico-papelera"></i><span>Fotograma</span></button>
            <button class="ej-tl-btn" onclick="ejFrameUndoTraj()" title="Deshacer la última trayectoria de este fotograma"><i class="ej-ico ej-ico-deshacer"></i><span>Trayectoria</span></button>
        </div>
        <div class="ej-tl-g ej-tl-vel" title="Velocidad de reproducción">
            <button class="ej-tl-btn mini${vel===0?' on':''}" onclick="ejFrameSetSpeed(1500)">0.5x</button>
            <button class="ej-tl-btn mini${vel===1?' on':''}" onclick="ejFrameSetSpeed(800)">1x</button>
            <button class="ej-tl-btn mini${vel===2?' on':''}" onclick="ejFrameSetSpeed(400)">2x</button>
            <button class="ej-tl-btn mini${ejSonidoActivo()?' on':''}" onclick="ejSonidoConmutar()" title="${ejSonidoActivo() ? 'Sonido del golpeo activado. Pulsa para quitarlo.' : 'Sin sonido. Pulsa para que suene el golpeo del balón.'}">${ejSonidoActivo() ? '<i class="ej-ico ej-ico-sonido"></i>' : '<i class="ej-ico ej-ico-mudo"></i>'}</button>
        </div>
        <span class="ej-tl-cuenta">${cur+1} / ${total}</span>
        <button class="ej-tl-btn acento" onclick="ejVideoAbrir()" title="Descargar la animación como vídeo MP4" ${total<2?'disabled':''}><i class="ej-ico ej-ico-descargar"></i><span>Vídeo</span></button>
        ${ejEditandoId && ejPizarraDeId === ejEditandoId ? `<button class="ej-tl-btn pri" onclick="ejGuardarYExportar()" title="Guardar los cambios del ejercicio y su vídeo">${ejP._exportingVideo ? '<i class="ej-ico ej-ico-espera"></i><span>Generando…</span>' : '<i class="ej-ico ej-ico-guardar"></i><span>Guardar</span>'}</button>` : ''}
    </div>
    <div id="ej-anim-msg" style="font-size:11px;color:#9ca3af;margin-top:4px;text-align:center">${ejP._exportingVideo ? '<i class="ej-ico ej-ico-espera"></i> Generando vídeo… no toques nada' : ejP._lastVideoUrl ? '<span style="color:#22c55e"><i class="ej-ico ej-ico-ok"></i> Vídeo MP4 guardado</span> — <a href="'+ejP._lastVideoUrl+'" target="_blank" style="color:#93c5fd;text-decoration:underline">Ver vídeo</a> · <a href="https://toplidercoach.com/wp-content/uploads/ejercicios/download-video.php?url='+encodeURIComponent(ejP._lastVideoUrl)+'" target="_blank" style="color:#93c5fd;text-decoration:underline">Descargar</a>' : ''}</div>`;
}
async function ejCargarPlantilla() {
    try {
        // Obtener temporada activa
        // Buscar temporada activa del club actual
        // Usar variables globales del sistema
        const clubIdActual = window.clubId || clubId;
        let seasonIdActual = window.seasonId || seasonId;

        if (!seasonIdActual) {
            const { data: seasons } = await supabaseClient
                .from('seasons')
                .select('id')
                .eq('club_id', clubIdActual)
                .eq('is_active', true)
                .limit(1);
            if (!seasons || !seasons.length) {
                ejToast('No hay temporada activa. Configura una en Mi Club.', 'warning');
                return;
            }
            seasonIdActual = seasons[0].id;
        }

        // Cargar jugadores de la temporada
        let qPlantilla = supabaseClient
            .from('season_players')
            .select('shirt_number, player_id, players(name, position, photo_url, status)')
            .eq('season_id', seasonIdActual)
            .order('shirt_number', { ascending: true });
        if (typeof cmAplicarFiltroEquipo === 'function') qPlantilla = cmAplicarFiltroEquipo(qPlantilla); // mi equipo + cedidos
        const { data, error } = await qPlantilla;

        if (error) throw error;
        ejP._plantillaEsRival = false; ejP._plantilla = (data || []).filter(sp => !(sp.players && sp.players.status === 'baja')).map(sp => ({
            playerId: sp.player_id,
            number: sp.shirt_number,
            name: sp.players?.name || '?',
            position: sp.players?.position || '',
            photo: sp.players?.photo_url || null
        }));
        ejRenderToolbar();
    } catch(err) {
        console.error('Error cargando plantilla:', err);
        ejToast('Error: ' + err.message, 'error');
    }
}

async function ejCargarPlantillaRival() {
    try {
        const cId = window.clubId || clubId;
        const { data: equipos, error } = await supabaseClient
            .from('equipos_rivales')
            .select('id, nombre')
            .eq('club_id', cId)
            .order('nombre');
        if (error) throw error;
        if (!equipos || equipos.length === 0) {
            ejToast('No tienes equipos rivales. Créalos en Gestión de Competición → Rivales.', 'warning');
            return;
        }
        if (equipos.length === 1) { ejCargarJugadoresRival(equipos[0].id, equipos[0].nombre); return; }
        const prev = document.getElementById('ej-rival-overlay');
        if (prev) prev.remove();
        const ov = document.createElement('div');
        ov.id = 'ej-rival-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;';
        let lista = '';
        equipos.forEach(function(e) {
            const nom = String(e.nombre).replace(/</g, '&lt;');
            lista += '<button onclick="ejCargarJugadoresRival(\'' + e.id + '\', this.textContent)" style="display:block;width:100%;text-align:left;padding:10px 14px;margin-bottom:6px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">' + nom + '</button>';
        });
        ov.innerHTML = '<div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:22px;max-width:340px;width:100%"><div style="color:#e2e8f0;font-size:15px;font-weight:700;margin-bottom:12px">🛡️ Elige el equipo rival</div>' + lista + '<button onclick="document.getElementById(\'ej-rival-overlay\').remove()" style="width:100%;margin-top:6px;padding:9px;background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button></div>';
        ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
        document.body.appendChild(ov);
    } catch(err) {
        ejToast('Error: ' + err.message, 'error');
    }
}

async function ejCargarJugadoresRival(equipoId, nombreEquipo) {
    const ov = document.getElementById('ej-rival-overlay');
    if (ov) ov.remove();
    try {
        const { data, error } = await supabaseClient
            .from('jugadores_rivales')
            .select('id, nombre, dorsal, posicion')
            .eq('equipo_rival_id', equipoId)
            .order('dorsal');
        if (error) throw error;
        if (!data || data.length === 0) { ejToast('Ese equipo rival no tiene jugadores todavía.', 'warning'); return; }
        ejP._plantilla = data.map(function(j) {
            return { playerId: j.id, number: j.dorsal || '', name: j.nombre, position: j.posicion || '', photo: null };
        });
        ejP._plantillaEsRival = true;
        ejP._addingRival = true;
        ejToast('Plantilla rival cargada: ' + (nombreEquipo || ''), 'success');
        ejRenderToolbar();
    } catch(err) {
        ejToast('Error: ' + err.message, 'error');
    }
}

function ejSetPlantillaLabel(opt) {
    ejP._plantillaLabel = opt;
    var _esRivalPl = !!ejP._plantillaEsRival;
    var fotos = {};
    (ejP._plantilla || []).forEach(function(j) { if (j.number !== undefined && j.number !== '') fotos[String(j.number)] = j.photo || null; });
    var cambiados = 0;
    ejP.players.forEach(function(p) {
        if (!p.name || ejEsRival(p) !== _esRivalPl) return;
        p.photo = (opt === 'nofoto' || opt === 'solotexto') ? null : (fotos[String(p.number)] || null);
        p.showNumber = opt !== 'name' && opt !== 'solotexto';
        p.showName = opt !== 'num';
        p.soloTexto = opt === 'solotexto';
        cambiados++;
    });
    if (cambiados > 0) { ejSaveHistory(); if (ejP.animMode) ejFrameSaveCurrent(); }
    ejRenderSVG();
    ejRenderToolbar();
}
function ejColocarJugadorPlantilla(idx) {
    const p = ejP._plantilla[idx];
    if (!p) return;
    ejP._plantillaSelIdx = idx;
    ejP.activeTool = 'player';
    ejP._plantillaMode = true;
    ejRenderToolbar();
}async function ejGuardarYExportar() {
    if (!ejEditandoId) {
        ejToast('Guarda el ejercicio primero desde la Ficha.', 'warning');
        return;
    }
    if (ejP._exportingVideo) return;
    // Este botón guarda en el ejercicio lo que hay en la pizarra. Si la pizarra tiene el dibujo de otro
    // (se abrió la ficha con "Ver ficha", o se cargó una fase de un proyecto), no se guarda nada.
    if (ejPizarraDeId !== ejEditandoId) {
        ejToast('La pizarra no tiene cargado el dibujo de este ejercicio. Ábrelo desde el Banco con Editar y vuelve a intentarlo. No se ha guardado nada.', 'warning');
        return;
    }
    
    // 1. Capturar miniatura limpia
    var prevSelected = ejP.selectedId;
    var prevExporting = ejP._exporting;
    ejP.selectedId = null;
    ejP._exporting = true;
    ejRenderSVG();
    var svgEl = document.getElementById('ej-svg');
    var thumbnailSvg = new XMLSerializer().serializeToString(svgEl);
    ejP.selectedId = prevSelected;
    ejP._exporting = prevExporting || false;
    ejRenderSVG();
    
    if (thumbnailSvg) {
        thumbnailSvg = thumbnailSvg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"');
    }
    
    // 2. Guardar board_data + miniatura en Supabase
    var msgEl = document.getElementById('ej-anim-msg');
    if (msgEl) msgEl.innerHTML = '<span style="color:#3b82f6">💾 Guardando ejercicio...</span>';
    
    try {
        ejFrameSaveCurrent();
        var updateData = {
            board_data: {
                players: ejP.players, lines: ejP.lines,
                shapes: ejP.shapes, texts: ejP.texts,
                equipment: ejP.equipment,connections: ejP.connections,
                fieldType: ejP.fieldType, fondo: ejP.fieldFondo, fondoColor: ejP.fieldColor, showCarriles: ejP.showCarriles, showZonas: ejP.showZonas, showRejilla: ejP.showRejilla, showCarriles: ejP.showCarriles, showZonas: ejP.showZonas, showRejilla: ejP.showRejilla,
                animFrames: ejP.frames,
                animMode: ejP.animMode
            },
            thumbnail_svg: thumbnailSvg ? await ejMiniaturaCompacta(ejComprimirThumbSVG(thumbnailSvg)) : null
        };
        var res = await supabaseClient.from('custom_exercises').update(updateData).eq('id', ejEditandoId).select();
        if (res.error) throw res.error;
        
        // Actualizar caché
        if (res.data && res.data[0]) {
            var idx = ejBancoCache.findIndex(x => x.id === ejEditandoId);
            if (idx >= 0) ejBancoCache[idx] = { ...ejBancoCache[idx], ...res.data[0] };
        }
        
        if (msgEl) msgEl.innerHTML = '<span style="color:#22c55e">✅ Ejercicio guardado. Generando vídeo...</span>';
        
        // 3. Exportar MP4
        await ejExportarAnimacionMP4();
        
        // 4. Actualizar ficha con nuevo vídeo
        window.ejThumbnailPendiente = thumbnailSvg;
        ejPrepararThumbParaPDF();
        setTimeout(function() { ejActualizarFichaMedia(); }, 500);
        
    } catch(err) {
        if (msgEl) msgEl.innerHTML = '<span style="color:#ef4444">❌ Error: ' + err.message + '</span>';
    }
}
// Vídeo de la ficha: se crea en el navegador igual que el de "Descargar vídeo" y se sube ya hecho.
// Si el navegador no puede crearlo o el servidor no lo admite, se usa el método anterior (grabación en directo).
async function ejExportarAnimacionMP4() {
    if (!ejP.animMode || ejP.frames.length < 2) { ejToast('Activa el modo animación y crea al menos 2 frames.', 'warning'); return; }
    if (!ejEditandoId) { ejToast('Guarda el ejercicio primero desde la Ficha antes de exportar vídeo.', 'warning'); return; }
    if (ejP._videoHaciendo) return;
    var aviso = function (html) { var m = document.getElementById('ej-anim-msg'); if (m) m.innerHTML = html; };
    var url = null;
    ejP._exportingVideo = true; ejRenderTimeline();
    try {
        ejP._videoHaciendo = true; ejP._videoCancelar = false;
        var blob = await ejVideoCrear(EJ_VIDEO_FICHA, function (pc) { aviso('<span style="color:#f97316;font-weight:600"><i class="ej-ico ej-ico-espera"></i> Creando el vídeo… ' + pc + ' %</span>'); });
        ejP._videoHaciendo = false;
        aviso('<span style="color:#3b82f6;font-weight:600"><i class="ej-ico ej-ico-espera"></i> Subiendo el vídeo…</span>');
        url = await ejVideoSubir(blob, ejEditandoId);
    } catch (e) {
        ejP._videoHaciendo = false;
        console.warn('Vídeo nuevo no disponible, se usa la grabación en directo:', e && e.message);
    }
    if (!url) { ejP._exportingVideo = false; return ejExportarAnimacionGrabada(); }
    await supabaseClient.from('custom_exercises').update({ animation_url: url }).eq('id', ejEditandoId);
    var idx = ejBancoCache.findIndex(function (x) { return x.id === ejEditandoId; });
    if (idx >= 0) ejBancoCache[idx].animation_url = url;
    ejP._exportingVideo = false; ejP._lastVideoUrl = url; ejP._videoDesactualizado = false;
    ejRenderTimeline();
    aviso('<span style="color:#22c55e"><i class="ej-ico ej-ico-ok"></i> Vídeo MP4 guardado</span> — <a href="' + url + '" target="_blank" style="color:#93c5fd;text-decoration:underline">Ver vídeo</a>');
}
// Sube un vídeo al servidor (primero el de vídeo, y si falla el de la web) y devuelve su dirección, o null
async function ejVideoSubir(blob, id) {
    var base64 = await new Promise(function (ok, mal) {
        var rd = new FileReader();
        rd.onload = function () { ok(rd.result.split(',')[1]); };
        rd.onerror = function () { mal(new Error('No se ha podido leer el vídeo')); };
        rd.readAsDataURL(blob);
    });
    var cuerpo = JSON.stringify({ video: base64, id: String(id) });
    var cab = { 'Content-Type': 'application/json', 'Authorization': 'Bearer toplider_thumb_2026' };
    var res;
    try {
        res = await fetch('https://gpu.toplidercoach.com/upload-video', { method: 'POST', headers: cab, body: cuerpo });
        if (!res.ok) throw new Error('GPU HTTP ' + res.status);
    } catch (e) {
        res = await fetch('https://toplidercoach.com/wp-content/uploads/ejercicios/upload-video.php', { method: 'POST', headers: cab, body: cuerpo });
    }
    var data = await res.json();
    if (!data.ok) throw new Error(data.error || 'El servidor no ha admitido el vídeo');
    return data.url;
}
// Método anterior, de reserva: graba la animación en directo y el servidor la convierte a MP4
async function ejExportarAnimacionGrabada() {
    if (!ejP.animMode || ejP.frames.length < 2) {
        ejToast('Activa el modo animación y crea al menos 2 frames.', 'warning');
        return;
    }
    if (!ejEditandoId) {
        ejToast('Guarda el ejercicio primero desde la Ficha antes de exportar vídeo.', 'warning');
        return;
    }

    await ejPrecargarFotosJugadores();

    const msg = document.getElementById('ej-anim-msg');
    ejP._exportingVideo = true; ejRenderTimeline();
    var progDiv = document.getElementById('ej-anim-msg');
    if (progDiv) progDiv.innerHTML = '<span style="color:#f97316;font-weight:600">⏳ Generando vídeo MP4... no toques nada, puede tardar hasta 1 minuto</span>';

    const svg = document.getElementById('ej-svg');
    const W = ejP.svgW;
    const H = ejP.svgH;

    // Canvas offscreen para grabar
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');

    // Configurar grabación
    const stream = canvas.captureStream(60);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
    }
    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10000000
    });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    // Guardar estado actual
    ejP._exporting = true;
    const savedFrame = ejP.currentFrame;
    const savedPlaying = ejP.isPlaying;
    if (savedPlaying) ejFrameStop();

    // Helper: renderizar SVG actual al canvas
    function renderSVGToCanvas() {
        return new Promise((resolve) => {
            const clone = svg.cloneNode(true);
            clone.setAttribute('width', W);
            clone.setAttribute('height', H);
            const svgData = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, W * 2, H * 2);
                ctx.drawImage(img, 0, 0, W * 2, H * 2);
                resolve();
            };
            img.onerror = () => { console.error('Error renderizando frame SVG'); resolve(); };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        });
    }

    // Iniciar grabación
    recorder.start();

    const FPS = 60;
    const frameDuration = ejP.playSpeed;
    const framesPerTransition = Math.max(40, Math.round((frameDuration * 1.5 / 1000) * FPS));
    const holdFrames = 15;
    var totalSegs = ejP.frames.length - 1;
    var totalVideoFrames = totalSegs * framesPerTransition;
    var easeZone = 0.15;

    // Pausa inicial para ver posición de partida
    ejFrameRestore(ejP.frames[0]);
    ejP.currentFrame = 0;
    ejRenderSVG();
    for (let h = 0; h < holdFrames; h++) {
        await renderSVGToCanvas();
        await new Promise(r => setTimeout(r, 1000 / FPS));
    }

    // Loop global continuo con easing solo al inicio y final
    for (let vf = 0; vf <= totalVideoFrames; vf++) {
        var rawT = vf / totalVideoFrames; // 0→1 global
        var easedT;
        if (rawT < easeZone) {
            var local = rawT / easeZone;
            easedT = easeZone * (local * local * (3 - 2 * local));
        } else if (rawT > 1 - easeZone) {
            var local = (rawT - (1 - easeZone)) / easeZone;
            easedT = (1 - easeZone) + easeZone * (local * local * (3 - 2 * local));
        } else {
            easedT = rawT;
        }

        var globalPos = easedT * totalSegs;
        var seg = Math.min(Math.floor(globalPos), totalSegs - 1);
        var frac = globalPos - seg;

        var fA = ejP.frames[seg];
        var fB = ejP.frames[seg + 1];
        if (!fA || !fB) break;

        for (var pi = 0; pi < fA.players.length; pi++) {
            ejInterpolateElem(fA.players[pi].id, fA, fB, frac, seg, 'player');
        }
        for (var ei = 0; ei < fA.equipment.length; ei++) {
            ejInterpolateElem(fA.equipment[ei].id, fA, fB, frac, seg, 'equipment');
        }

        ejP.currentFrame = seg;
        ejRenderSVG();
        await renderSVGToCanvas();
        await new Promise(r => setTimeout(r, 1000 / FPS));
    }

    // Frame final
    await renderSVGToCanvas();
    await new Promise(r => setTimeout(r, 200));

    console.log('Animación renderizada, parando grabación...'); // Parar grabación y esperar a que termine
    recorder.onerror = (e) => { console.error('Recorder error:', e); }; const recordingDone = new Promise(resolve => { recorder.onstop = () => { console.log('Recorder parado OK'); resolve(); }; });
    recorder.stop();
    await recordingDone;

    // Restaurar estado
    ejP._exporting = false;
    ejFrameRestore(ejP.frames[savedFrame]);
    ejP.currentFrame = savedFrame;
    ejRenderSVG();
    ejRenderTimeline();

    console.log('Video generado, chunks:', chunks.length); if (msg) msg.textContent = 'Subiendo al servidor y convirtiendo a MP4...';

    const blob = new Blob(chunks, { type: 'video/webm' }); console.log('Blob creado, tamaño:', blob.size, 'bytes');
   console.log('Iniciando conversión a base64...');
    var progDiv2 = document.getElementById('ej-anim-msg');
    if (progDiv2) progDiv2.innerHTML = '<span style="color:#3b82f6;font-weight:600">📤 Subiendo al servidor y convirtiendo a MP4...</span>';
    try {
        const base64 = await new Promise((resolve, reject) => {
            const rd = new FileReader();
            rd.onload = () => { console.log('Base64 OK'); resolve(rd.result.split(',')[1]); };
            rd.onerror = () => reject(new Error('FileReader falló'));
            rd.readAsDataURL(blob);
        });
        console.log('Enviando al servidor, tamaño:', base64.length);
        var gpuUrl = 'https://gpu.toplidercoach.com/upload-video';
        var cpuUrl = 'https://toplidercoach.com/wp-content/uploads/ejercicios/upload-video.php';
        var uploadBody = JSON.stringify({ video: base64, id: String(ejEditandoId) });
        var uploadHeaders = { 'Content-Type': 'application/json', 'Authorization': 'Bearer toplider_thumb_2026' };
        var res;
        try {
            res = await fetch(gpuUrl, { method: 'POST', headers: uploadHeaders, body: uploadBody });
            if (!res.ok) throw new Error('GPU HTTP ' + res.status);
            console.log('Video procesado por GPU');
        } catch(gpuErr) {
            console.warn('GPU falló, usando CPU:', gpuErr.message);
            res = await fetch(cpuUrl, { method: 'POST', headers: uploadHeaders, body: uploadBody });
        }
        const data = await res.json();
        if (data.ok) {
            await supabaseClient.from('custom_exercises').update({ animation_url: data.url }).eq('id', ejEditandoId);
            const idx = ejBancoCache.findIndex(x => x.id === ejEditandoId);
            if (idx >= 0) ejBancoCache[idx].animation_url = data.url;
            ejP._exportingVideo = false; ejP._lastVideoUrl = data.url; ejRenderTimeline(); const msgFinal = document.getElementById('ej-anim-msg'); if (msgFinal) msgFinal.innerHTML = '✅ Vídeo MP4 guardado — <a href="' + data.url + '" target="_blank" style="color:#93c5fd;text-decoration:underline">Ver vídeo</a>';
            ejP._videoDesactualizado = false;
        } else {
            ejP._exportingVideo = false; ejRenderTimeline(); const msgErr = document.getElementById('ej-anim-msg'); if (msgErr) msgErr.textContent = '❌ Error: ' + (data.error || 'desconocido');
        }
    } catch(e) {
        console.error('Error exportando:', e);
        ejP._exportingVideo = false; ejRenderTimeline(); const msgCatch = document.getElementById('ej-anim-msg'); if (msgCatch) msgCatch.textContent = '❌ Error: ' + e.message;
    }
}
function ejConfirm(msg, onAceptar) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.6)"><p style="color:#f1f5f9;font-size:15px;margin:0 0 24px">' + msg + '</p><div style="display:flex;gap:12px;justify-content:center"><button id="ejc-cancel" style="padding:9px 22px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button><button id="ejc-ok" style="padding:9px 22px;border-radius:7px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#ejc-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#ejc-ok').onclick = () => { overlay.remove(); onAceptar(); };
}

function ejPrompt(msg, valorInicial, onAceptar) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.6)"><p style="color:#f1f5f9;font-size:15px;margin:0 0 16px">' + msg + '</p><input id="ejp-input" type="text" value="' + (valorInicial||'') + '" style="width:100%;padding:8px 12px;background:#0f172a;border:1px solid #475569;color:#fff;border-radius:6px;font-size:14px;margin-bottom:20px;box-sizing:border-box"/><div style="display:flex;gap:12px;justify-content:center"><button id="ejp-cancel" style="padding:9px 22px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button><button id="ejp-ok" style="padding:9px 22px;border-radius:7px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button></div></div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('#ejp-input');
    input.focus(); input.select();
    overlay.querySelector('#ejp-cancel').onclick = function() { overlay.remove(); };
    overlay.querySelector('#ejp-ok').onclick = function() { var v = input.value.trim(); overlay.remove(); if (v) onAceptar(v); };
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { var v = input.value.trim(); overlay.remove(); if (v) onAceptar(v); } });
}

// Escapa caracteres especiales para insertar texto de usuario dentro del SVG
function ejEscXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Modal de texto multilinea para la herramienta Texto de la pizarra
function ejPromptTexto(msg, valorInicial, onAceptar) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 32px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.6)"><p style="color:#f1f5f9;font-size:15px;margin:0 0 12px">' + msg + '</p><textarea id="ejpt-input" rows="3" style="width:100%;padding:8px 12px;background:#0f172a;border:1px solid #475569;color:#fff;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical;font-family:inherit;line-height:1.4"></textarea><div style="color:#64748b;font-size:11px;margin:6px 0 16px">Enter = nueva l\u00ednea \u00b7 Ctrl+Enter = aceptar</div><div style="display:flex;gap:12px;justify-content:center"><button id="ejpt-cancel" style="padding:9px 22px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button><button id="ejpt-ok" style="padding:9px 22px;border-radius:7px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button></div></div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('#ejpt-input');
    input.value = valorInicial || '';
    input.focus(); input.select();
    function aceptar() { var v = input.value.replace(/\s+$/, ''); overlay.remove(); if (v) onAceptar(v); }
    overlay.querySelector('#ejpt-cancel').onclick = function() { overlay.remove(); };
    overlay.querySelector('#ejpt-ok').onclick = aceptar;
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); aceptar(); } });
}

function ejToast(msg, tipo) {
    tipo = tipo || 'info';
    var cfg = { info: { bg: '#1e3a5f', icon: 'ℹ️' }, success: { bg: '#166534', icon: '✅' }, error: { bg: '#7f1d1d', icon: '❌' }, warning: { bg: '#78350f', icon: '⚠️' } }[tipo] || { bg: '#1e3a5f', icon: 'ℹ️' };
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + cfg.bg + ';color:#fff;padding:12px 22px;border-radius:8px;font-size:14px;z-index:99999;max-width:380px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);transition:opacity 0.4s;pointer-events:none;';
    t.textContent = cfg.icon + ' ' + msg;
    document.body.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 400); }, 3500);
}

function ejInit() {
    const root = document.getElementById('ejercicios-root');
    if (!root) return;

    // Extraer club/coach del contexto global si existe
    var _hubUser = JSON.parse(localStorage.getItem('hub_user') || '{}');
    delete window.ejCoachId;
    window.ejCoachId = null;
    (async function() {
        try {
            const { data, error } = await supabaseClient.rpc('fn_identidad_wp');
            if (!error && data) { window.ejCoachId = String(data); return; }
        } catch (e) {}
        if (_hubUser.wp_user_id) window.ejCoachId = String(_hubUser.wp_user_id);
    })();
    window.ejClubId  = (typeof cmState !== 'undefined' && cmState.activo && typeof clubId !== 'undefined') ? clubId : null;

    root.innerHTML = `
    <div class="ej-module">
        <!-- Sub-navegación interna -->
        <div class="ej-nav">
            <button class="ej-nav-btn ej-hub-btn" title="Mostrar u ocultar el menú del HUB" onclick="document.body.classList.toggle('tlc-hub-abierto')"><i class="ej-ico ej-ico-menu"></i></button>
            <button class="ej-nav-btn active" onclick="ejShowTab('pizarra',this)" title="Pizarra"><i class="ej-ico ej-ico-pizarra"></i><span class="ej-txt">Pizarra</span></button>
            <button class="ej-nav-btn" onclick="ejShowTab('ficha',this)" title="Ficha"><i class="ej-ico ej-ico-ficha"></i><span class="ej-txt">Ficha</span></button>
            <button class="ej-nav-btn" onclick="ejShowTab('banco',this)" title="Banco"><i class="ej-ico ej-ico-banco"></i><span class="ej-txt">Banco</span></button>
        </div>
        <div id="ej-tab-pizarra" class="ej-tab active">
            <div id="ej-pizarra-container"></div>
        </div>
        <div id="ej-tab-ficha" class="ej-tab" style="display:none">
            <div id="ej-ficha-container"></div>
        </div>
        <div id="ej-tab-banco" class="ej-tab" style="display:none">
            <div id="ej-banco-container"></div>
        </div>
    </div>`;

    ejBuildPizarraLayout();
    ejBuildFicha();
    ejBuildBanco();
}

function ejShowTab(tab, btn) {
    document.querySelectorAll('.ej-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.ej-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('ej-tab-' + tab).style.display = 'block';
    if (btn) btn.classList.add('active');
    if (tab === 'banco' && ejBancoCache.length === 0) ejBancoLoad();
    if (tab === 'pizarra') ejRenderToolbar();
    if (tab === 'ficha') ejComunidadBoton();
}

// =============================================
// REGISTRO DEL MÓDULO
// =============================================
registrarModulo('pizarra', ejInit);
// ===== MODO PRESENTACION (pantalla completa para el vestuario) =====
function ejPresentar() {
    var area = document.getElementById('ej-canvas-area');
    if (!area) return;
    var overlay = document.getElementById('ej-modo-overlay');
    if (overlay && overlay.style.display !== 'none') { ejToast('Elige primero el tipo de ejercicio', 'warning'); return; }
    var prev = document.getElementById('ej-present-controls');
    if (prev) prev.remove();
    var ctr = document.createElement('div');
    ctr.id = 'ej-present-controls';
    ctr.style.cssText = 'position:absolute;top:12px;right:12px;z-index:30;display:flex;gap:8px;';
    var playBtn = (ejP.animMode && ejP.frames.length > 1)
        ? '<button onclick="ejPresentPlay()" style="padding:9px 18px;background:#16a34a;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.5)">▶ Reproducir</button>'
        : '';
    ctr.innerHTML = playBtn
        + '<button onclick="ejSalirPresentacion()" style="padding:9px 18px;background:#0f172a;border:1px solid #475569;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,.5)">✕ Salir (Esc)</button>';
    area.appendChild(ctr);
    ejP._presentOn = true;
    ejPresentEstilos(true);
    if (area.requestFullscreen) { area.requestFullscreen().catch(function(){}); }
}
function ejPresentEstilos(on) {
    var area = document.getElementById('ej-canvas-area');
    var svg = document.getElementById('ej-svg');
    if (!area || !svg) return;
    if (on) {
        area.style.background = '#0b1220';
        area.style.display = 'flex';
        area.style.alignItems = 'center';
        area.style.justifyContent = 'center';
        area.style.position = 'fixed';
        area.style.inset = '0';
        area.style.zIndex = '99990';
        svg.style.maxHeight = '100vh';
        svg.style.maxWidth = '100vw';
        svg.style.width = 'auto';
        svg.style.height = '100%';
    } else {
        area.style.background = '';
        area.style.display = '';
        area.style.alignItems = '';
        area.style.justifyContent = '';
        area.style.position = 'relative';
        area.style.inset = '';
        area.style.zIndex = '';
        svg.style.maxHeight = '';
        svg.style.maxWidth = '';
        svg.style.width = '100%';
        svg.style.height = 'auto';
        var ctr = document.getElementById('ej-present-controls');
        if (ctr) ctr.remove();
    }
}
function ejSalirPresentacion() {
    ejP._presentOn = false;
    if (document.fullscreenElement) { document.exitFullscreen().catch(function(){}); }
    ejPresentEstilos(false);
}
function ejPresentPlay() { ejFrameStop(); ejFramePlay(0); }
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && ejP._presentOn) {
        ejP._presentOn = false;
        ejPresentEstilos(false);
    }
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && ejP._presentOn && !document.fullscreenElement) ejSalirPresentacion();
});
// ===== SELECCION MULTIPLE POR RECUADRO =====
function ejSeleccionarEnRecuadro() {
    var m = ejP._marquee;
    if (!m) return;
    var x1 = Math.min(m.x1, m.x2), x2 = Math.max(m.x1, m.x2);
    var y1 = Math.min(m.y1, m.y2), y2 = Math.max(m.y1, m.y2);
    if ((x2 - x1) < 8 && (y2 - y1) < 8) { ejP.multiSel = []; return; }
    function dentro(x, y) { return x >= x1 && x <= x2 && y >= y1 && y <= y2; }
    var sel = [];
    ejP.players.forEach(function(p) { if (dentro(p.x, p.y)) sel.push({ type: 'player', id: p.id }); });
    ejP.equipment.forEach(function(eq) { if (dentro(eq.x, eq.y)) sel.push({ type: 'equipment', id: eq.id }); });
    ejP.texts.forEach(function(t) { if (dentro(t.x, t.y)) sel.push({ type: 'text', id: t.id }); });
    ejP.shapes.forEach(function(s) {
        var cx = (s.x !== undefined) ? s.x + (s.w || 0) / 2 : s.cx;
        var cy = (s.y !== undefined) ? s.y + (s.h || 0) / 2 : s.cy;
        if (cx !== undefined && cy !== undefined && dentro(cx, cy)) sel.push({ type: 'shape', id: s.id });
    });
    ejP.lines.forEach(function(l) {
        if (l.x1 !== undefined && dentro((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2)) sel.push({ type: 'line', id: l.id });
    });
    ejP.multiSel = sel;
    if (sel.length > 0) {
        ejP.selectedId = null;
        ejToast(sel.length + ' elemento(s) seleccionados — arrastra uno para mover el bloque', 'success');
    }
}
function ejResizeMultiSel(dir) {
    if (!ejP.multiSel || ejP.multiSel.length === 0) return;
    const step = 0.15;
    ejP.multiSel.forEach(function(m) {
        if (m.type === 'player') {
            var p = ejP.players.find(function(x){ return x.id === m.id; });
            if (p) { var ns = dir === 'up' ? Math.min((p.scale ?? 1) + step, 2.5) : Math.max((p.scale ?? 1) - step, 0.3); p.scale = Math.round(ns * 100) / 100; }
        } else if (m.type === 'equipment') {
            var eq = ejP.equipment.find(function(x){ return x.id === m.id; });
            if (eq) { var ne = dir === 'up' ? Math.min((eq.scale ?? 1) + step, 3.0) : Math.max((eq.scale ?? 1) - step, 0.3); eq.scale = Math.round(ne * 100) / 100; }
        }
    });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejMoverMultiSel(dx, dy) {
    ejP.multiSel.forEach(function(m) {
        if (m.type === 'player') {
            var p = ejP.players.find(function(x){ return x.id === m.id; });
            if (p) { p.x += dx; p.y += dy; }
        } else if (m.type === 'equipment') {
            var eq = ejP.equipment.find(function(x){ return x.id === m.id; });
            if (eq) { eq.x += dx; eq.y += dy; }
        } else if (m.type === 'text') {
            var t = ejP.texts.find(function(x){ return x.id === m.id; });
            if (t) { t.x += dx; t.y += dy; }
        } else if (m.type === 'shape') {
            var s = ejP.shapes.find(function(x){ return x.id === m.id; });
            if (s) {
                if (s.x !== undefined) { s.x += dx; s.y += dy; }
                else if (s.cx !== undefined) { s.cx += dx; s.cy += dy; }
                if (s.points) s.points.forEach(function(pt){ pt.x += dx; pt.y += dy; });
            }
        } else if (m.type === 'line') {
            var l = ejP.lines.find(function(x){ return x.id === m.id; });
            if (l && l.x1 !== undefined) {
                l.x1 += dx; l.y1 += dy; l.x2 += dx; l.y2 += dy;
                if (l.cx !== undefined) { l.cx += dx; l.cy += dy; }
                if (l.points) l.points.forEach(function(pt){ pt.x += dx; pt.y += dy; });
            }
        }
    });
}
// ===== GUIAS TACTICAS: 5 CARRILES Y 3 ZONAS =====
function ejCarrilesZonasSVG() {
    if (!ejP.showCarriles && !ejP.showZonas) return '';
    var ft = ejP.fieldType;
    var x0 = 20, y0 = 15, w = 760, h = 470;
    var vertical = (ft === 'half' || ft === 'halfDown');
    var s = '<g style="pointer-events:none">';
    if (ejP.showCarriles) {
        if (!vertical) {
            var bh = h / 5;
            s += '<rect x="'+x0+'" y="'+(y0+bh)+'" width="'+w+'" height="'+bh+'" fill="rgba(255,255,255,0.06)"/>';
            s += '<rect x="'+x0+'" y="'+(y0+3*bh)+'" width="'+w+'" height="'+bh+'" fill="rgba(255,255,255,0.06)"/>';
            for (var i = 1; i < 5; i++) {
                var yy = y0 + i * bh;
                s += '<line x1="'+x0+'" y1="'+yy+'" x2="'+(x0+w)+'" y2="'+yy+'" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4"/>';
            }
        } else {
            var bw = w / 5;
            s += '<rect x="'+(x0+bw)+'" y="'+y0+'" width="'+bw+'" height="'+h+'" fill="rgba(255,255,255,0.06)"/>';
            s += '<rect x="'+(x0+3*bw)+'" y="'+y0+'" width="'+bw+'" height="'+h+'" fill="rgba(255,255,255,0.06)"/>';
            for (var j = 1; j < 5; j++) {
                var xx = x0 + j * bw;
                s += '<line x1="'+xx+'" y1="'+y0+'" x2="'+xx+'" y2="'+(y0+h)+'" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4"/>';
            }
        }
    }
    if (ejP.showZonas) {
        if (!vertical) {
            for (var k = 1; k < 3; k++) {
                var zx = x0 + k * (w / 3);
                s += '<line x1="'+zx+'" y1="'+y0+'" x2="'+zx+'" y2="'+(y0+h)+'" stroke="#facc15" stroke-width="1.5" stroke-dasharray="10 7" opacity="0.5"/>';
            }
        } else {
            for (var q = 1; q < 3; q++) {
                var zy = y0 + q * (h / 3);
                s += '<line x1="'+x0+'" y1="'+zy+'" x2="'+(x0+w)+'" y2="'+zy+'" stroke="#facc15" stroke-width="1.5" stroke-dasharray="10 7" opacity="0.5"/>';
            }
        }
    }
    return s + '</g>';
}
function ejToggleCarriles() { ejP.showCarriles = !ejP.showCarriles; ejRenderSVG(); ejRenderToolbar(); }
function ejToggleZonas() { ejP.showZonas = !ejP.showZonas; ejRenderSVG(); ejRenderToolbar(); }
function ejToggleRejilla() {
    ejP.showRejilla = !ejP.showRejilla;
    if (ejP.showRejilla && ejP.fieldType !== 'artificial') ejP.fieldType = 'artificial';
    ejRenderSVG(); ejRenderToolbar();
}
function ejRejillaMetrosSVG() {
    if (!ejP.showRejilla || ejP.fieldType !== 'artificial') return '';
    var x0 = 20, y0 = 15, w = 760, h = 470, largo = 105, ancho = 65;
    var sx = w / largo, sy = h / ancho;
    var s = '<g style="pointer-events:none">';
    var i, px, py;
    for (i = 5; i < largo; i += 5) {
        px = (x0 + i * sx).toFixed(1);
        s += '<line x1="' + px + '" y1="' + y0 + '" x2="' + px + '" y2="' + (y0 + h) + '" stroke="#ffffff" stroke-width="1" opacity="0.08"/>';
    }
    for (i = 5; i < ancho; i += 5) {
        py = (y0 + i * sy).toFixed(1);
        s += '<line x1="' + x0 + '" y1="' + py + '" x2="' + (x0 + w) + '" y2="' + py + '" stroke="#ffffff" stroke-width="1" opacity="0.08"/>';
    }
    for (i = 0; i <= largo; i += 5) {
        px = (x0 + i * sx).toFixed(1);
        s += '<line x1="' + px + '" y1="' + y0 + '" x2="' + px + '" y2="' + (y0 + 8) + '" stroke="#fff" stroke-width="1.3" opacity="0.9"/>';
        s += '<line x1="' + px + '" y1="' + (y0 + h - 8) + '" x2="' + px + '" y2="' + (y0 + h) + '" stroke="#fff" stroke-width="1.3" opacity="0.9"/>';
        if (i > 0 && i < largo) {
            s += '<text x="' + px + '" y="' + (y0 + 19) + '" font-size="9" fill="#fff" opacity="0.85" text-anchor="middle">' + i + '</text>';
            s += '<text x="' + px + '" y="' + (y0 + h - 12) + '" font-size="9" fill="#fff" opacity="0.85" text-anchor="middle">' + i + '</text>';
        }
    }
    for (i = 0; i <= ancho; i += 5) {
        py = y0 + i * sy;
        s += '<line x1="' + x0 + '" y1="' + py.toFixed(1) + '" x2="' + (x0 + 8) + '" y2="' + py.toFixed(1) + '" stroke="#fff" stroke-width="1.3" opacity="0.9"/>';
        s += '<line x1="' + (x0 + w - 8) + '" y1="' + py.toFixed(1) + '" x2="' + (x0 + w) + '" y2="' + py.toFixed(1) + '" stroke="#fff" stroke-width="1.3" opacity="0.9"/>';
        if (i > 0 && i < ancho) {
            s += '<text x="' + (x0 + 11) + '" y="' + (py + 3).toFixed(1) + '" font-size="9" fill="#fff" opacity="0.85" text-anchor="start">' + i + '</text>';
            s += '<text x="' + (x0 + w - 11) + '" y="' + (py + 3).toFixed(1) + '" font-size="9" fill="#fff" opacity="0.85" text-anchor="end">' + i + '</text>';
        }
    }
    return s + '</g>';
}
// ===== CAMARA EN PERSPECTIVA Y ZOOM =====
function ejSetCamara(a) {
    ejP.camAngle = a || 0;
    ejAplicarCamara();
    ejRenderToolbar();
}
function ejAplicarCamara() {
    var svg = document.getElementById('ej-svg');
    if (!svg) return;
    var a = ejP.camAngle || 0;
    if (a > 0) {
        svg.style.transform = 'perspective(1100px) rotateX(' + a + 'deg)';
        svg.style.transformOrigin = '50% 62%';
        svg.style.transition = 'transform 0.25s';
    } else {
        svg.style.transform = '';
    }
}
function ejAplicarViewBox() {
    var svg = document.getElementById('ej-svg');
    if (!svg) return;
    var z = ejP.zoom || 1;
    var w = ejP.svgW / z, h = ejP.svgH / z;
    var maxX = ejP.svgW - w, maxY = ejP.svgH - h;
    ejP.panX = Math.max(0, Math.min(maxX, ejP.panX || 0));
    ejP.panY = Math.max(0, Math.min(maxY, ejP.panY || 0));
    svg.setAttribute('viewBox', ejP.panX + ' ' + ejP.panY + ' ' + w + ' ' + h);
}
function ejZoomCambiar(d) {
    var zPrev = ejP.zoom || 1;
    var z = zPrev + d;
    if (z < 1) z = 1;
    if (z > 3) z = 3;
    var cx = (ejP.panX || 0) + ejP.svgW / zPrev / 2;
    var cy = (ejP.panY || 0) + ejP.svgH / zPrev / 2;
    ejP.zoom = z;
    ejP.panX = cx - ejP.svgW / z / 2;
    ejP.panY = cy - ejP.svgH / z / 2;
    ejAplicarViewBox();
    ejRenderToolbar();
}
function ejZoomReset() {
    ejP.zoom = 1; ejP.panX = 0; ejP.panY = 0;
    ejAplicarViewBox();
    ejRenderToolbar();
}
function ejPan(dx, dy) {
    var paso = 60 / (ejP.zoom || 1);
    ejP.panX = (ejP.panX || 0) + dx * paso;
    ejP.panY = (ejP.panY || 0) + dy * paso;
    ejAplicarViewBox();
}
document.addEventListener('wheel', function(e) {
    if (!e.ctrlKey) return;
    var svg = document.getElementById('ej-svg');
    if (!svg) return;
    if (e.target !== svg && !svg.contains(e.target)) return;
    e.preventDefault();
    var rect = svg.getBoundingClientRect();
    var relX = (e.clientX - rect.left) / rect.width;
    var relY = (e.clientY - rect.top) / rect.height;
    var zPrev = ejP.zoom || 1;
    var z = zPrev * (e.deltaY < 0 ? 1.15 : 0.87);
    if (z < 1) z = 1;
    if (z > 3) z = 3;
    var wPrev = ejP.svgW / zPrev, hPrev = ejP.svgH / zPrev;
    var fx = (ejP.panX || 0) + relX * wPrev;
    var fy = (ejP.panY || 0) + relY * hPrev;
    ejP.zoom = z;
    ejP.panX = fx - relX * (ejP.svgW / z);
    ejP.panY = fy - relY * (ejP.svgH / z);
    ejAplicarViewBox();
    var lbl = document.getElementById('ej-zoom-pct');
    if (lbl) lbl.textContent = Math.round(z * 100) + '%';
}, { passive: false });
// ===== CALIBRACION EXACTA DE CLICS EN VISTA PERSPECTIVA =====
function ejProyInversa(cX, cY) {
    var svgPts = ejP._calPts;
    if (!svgPts) return null;
    var scr = [];
    for (var i = 0; i < 4; i++) {
        var el = document.getElementById('ej-cal-' + i);
        if (!el) return null;
        var r = el.getBoundingClientRect();
        scr.push([r.left + r.width / 2, r.top + r.height / 2]);
    }
    var A = [], b = [];
    for (var j = 0; j < 4; j++) {
        var sx = scr[j][0], sy = scr[j][1], X = svgPts[j][0], Y = svgPts[j][1];
        A.push([sx, sy, 1, 0, 0, 0, -sx * X, -sy * X]); b.push(X);
        A.push([0, 0, 0, sx, sy, 1, -sx * Y, -sy * Y]); b.push(Y);
    }
    var h = ejResolver8(A, b);
    if (!h) return null;
    var den = h[6] * cX + h[7] * cY + 1;
    if (Math.abs(den) < 1e-9) return null;
    return {
        x: (h[0] * cX + h[1] * cY + h[2]) / den,
        y: (h[3] * cX + h[4] * cY + h[5]) / den
    };
}
function ejResolver8(A, b) {
    var n = 8, M = [];
    for (var i = 0; i < n; i++) M.push(A[i].concat([b[i]]));
    for (var c = 0; c < n; c++) {
        var piv = c;
        for (var f = c + 1; f < n; f++) if (Math.abs(M[f][c]) > Math.abs(M[piv][c])) piv = f;
        if (Math.abs(M[piv][c]) < 1e-12) return null;
        var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp;
        for (var f2 = 0; f2 < n; f2++) {
            if (f2 === c) continue;
            var fac = M[f2][c] / M[c][c];
            for (var col = c; col <= n; col++) M[f2][col] -= fac * M[c][col];
        }
    }
    var sol = [];
    for (var s = 0; s < n; s++) sol.push(M[s][n] / M[s][s]);
    return sol;
}

// ========== MONTAJES DE CAMPO (vinculados a una sesion) ==========
// Captura la pizarra actual como PNG y devuelve un dataURL
function ejMontajeCapturar() {
    return new Promise(function(resolve, reject) {
        try {
            ejP.selectedId = null;
            ejRenderSVG();
            setTimeout(function() {
                const svg = document.getElementById('ej-svg');
                if (!svg) { reject(new Error('pizarra no visible')); return; }
                const clone = svg.cloneNode(true);
                clone.setAttribute('width', ejP.svgW);
                clone.setAttribute('height', ejP.svgH);
                const data = new XMLSerializer().serializeToString(clone);
                const canvas = document.createElement('canvas');
                canvas.width = ejP.svgW * 2;
                canvas.height = ejP.svgH * 2;
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    ctx.scale(2, 2);
                    ctx.drawImage(img, 0, 0, ejP.svgW, ejP.svgH);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = function() { reject(new Error('no se pudo rasterizar')); };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
            }, 100);
        } catch (err) { reject(err); }
    });
}

async function ejMontajeAbrir() {
    try {
        const hoyISO = new Date().toISOString().slice(0, 10);
        const { data: ses } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date')
            .eq('club_id', clubId)
            .gte('session_date', hoyISO)
            .order('session_date', { ascending: true })
            .limit(15);
        let opts = '';
        (ses || []).forEach(function(s) {
            opts += '<option value="' + s.id + '">' + s.session_date + ' · ' + (s.name || 'Sesion') + '</option>';
        });
        if (!opts) { showToast('No hay sesiones futuras. Crea la sesion primero.'); return; }

        const ov = document.createElement('div');
        ov.id = 'ej-montaje-modal';
        ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:2147483000';
        ov.innerHTML =
            '<div style="background:#1e293b;border-radius:12px;padding:22px;width:380px;max-width:92%;color:#fff">' +
                '<h3 style="margin:0 0 14px;font-size:16px">🏟️ Guardar montaje de campo</h3>' +
                '<label style="display:block;color:#94a3b8;font-size:12px;margin-bottom:4px">Sesion</label>' +
                '<select id="ej-montaje-sesion" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:13px;margin-bottom:12px">' + opts + '</select>' +
                '<label style="display:block;color:#94a3b8;font-size:12px;margin-bottom:4px">Titulo del montaje</label>' +
                '<input type="text" id="ej-montaje-titulo" placeholder="Ej: Montaje 1 - Ej.1 dcha + Ej.2 izda" style="width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:13px;box-sizing:border-box">' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
                    '<button onclick="document.getElementById(\'ej-montaje-modal\').remove()" style="padding:8px 16px;border-radius:8px;border:1px solid #475569;background:transparent;color:#fff;cursor:pointer">Cancelar</button>' +
                    '<button id="ej-montaje-btn" onclick="ejMontajeGuardar()" style="padding:8px 16px;border-radius:8px;border:none;background:#f97316;color:#fff;font-weight:600;cursor:pointer">Guardar</button>' +
                '</div>' +
            '</div>';
        ov.addEventListener('click', function(ev) { if (ev.target === ov) ov.remove(); });
        document.body.appendChild(ov);
    } catch (err) {
        console.error('ejMontajeAbrir:', err);
        showToast('Error al preparar el montaje');
    }
}

async function ejMontajeGuardar() {
    const sesionId = document.getElementById('ej-montaje-sesion').value;
    const titulo = (document.getElementById('ej-montaje-titulo').value || '').trim();
    if (!sesionId) { showToast('Elige una sesion'); return; }
    const btn = document.getElementById('ej-montaje-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        const dataUrl = await ejMontajeCapturar();
        const blob = await (await fetch(dataUrl)).blob();
        const path = clubId + '/' + sesionId + '/' + Date.now() + '.png';
        const up = await supabaseClient.storage.from('sesion-montajes').upload(path, blob, { contentType: 'image/png' });
        if (up.error) throw up.error;

        const { data: prev } = await supabaseClient.from('sesion_montajes')
            .select('orden').eq('session_id', sesionId)
            .order('orden', { ascending: false }).limit(1);
        const orden = (prev && prev.length) ? (prev[0].orden + 1) : 1;

        const ins = await supabaseClient.from('sesion_montajes').insert({
            session_id: sesionId,
            club_id: clubId,
            orden: orden,
            titulo: titulo || ('Montaje ' + orden),
            image_path: path
        });
        if (ins.error) throw ins.error;

        showToast('Montaje ' + orden + ' guardado en la sesion');
        const m = document.getElementById('ej-montaje-modal');
        if (m) m.remove();
    } catch (err) {
        console.error('ejMontajeGuardar:', err);
        showToast('Error al guardar el montaje');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    }
}
function ejProyPlegar() {
    var b = document.getElementById('ej-proy-body');
    var btn = document.getElementById('ej-proy-min');
    if (!b) return;
    var plegado = b.style.display === 'none';
    b.style.display = plegado ? '' : 'none';
    if (btn) { btn.textContent = plegado ? '—' : '▢'; btn.title = plegado ? 'Plegar' : 'Desplegar'; }
}

// =====================================================================
// PIZARRA · BARRA DE JUGADORES, OBJETOS, FONDOS, CONFIGURACIÓN Y EQUIPACIÓN
// Barra superior de jugadores (equipos, fichas de tarea, formato de ficha, anónimo),
// ventanas de formación y plantilla, opciones junto al objeto, fondos de campo,
// configuración por club y equipación.
// =====================================================================
function ejAnimTrazoModo(mueve) {
    ejP.animTrazoMueve = !!mueve;
    ejRenderToolbar();
}
function ejAnimConmutar() {
    if (ejP.animMode && ejP.frames.length > 1) {
        ejConfirm('¿Quitar la animación? Se perderán los fotogramas.', function () { ejToggleAnimMode(); });
    } else {
        ejToggleAnimMode();
    }
}
function ejJugEquipo(rival) { ejP._addingRival = !!rival; ejP._tareaColor = null; ejP._jugModalPend = false; ejRenderToolbar(); }
function ejJugAnadir() {
    var rival = !!ejP._addingRival;
    var activo = ejP.activeTool === 'player' && !ejP._plantillaMode && !ejP._tareaColor;
    ejP._tareaColor = null;
    ejSetTool(activo ? 'select' : 'player');
    ejP._plantillaMode = false;
    ejP._addingRival = rival;
    ejRenderToolbar();
}
// Fichas de tarea: jugadores sin nombre de un color suelto (tercer equipo, comodines, petos)
function ejJugTarea(color) {
    var rival = !!ejP._addingRival;
    var activo = ejP.activeTool === 'player' && ejP._tareaColor === color;
    ejSetTool(activo ? 'select' : 'player');
    ejP._plantillaMode = false;
    ejP._addingRival = rival;
    ejP._tareaColor = activo ? null : color;
    ejRenderToolbar();
}
// Estilo de ficha (foto, círculo, camiseta) y botón "A" (fichas anónimas).
// Se guarda en cada jugador (estilo, anon), así viaja con el ejercicio y con deshacer.
function ejFichaSync() {
    if (!ejP.players.length) return;
    var ref = ejP.players.find(function (p) { return p.estilo; });
    ejP.fichaEstilo = ref ? ref.estilo : 'foto';
    ejP.fichaAnon = ref ? !!ref.anon : false;
}
function ejFichaEstilo(est) {
    ejSaveHistory();
    ejP.fichaEstilo = est;
    ejP.players.forEach(function (p) { p.estilo = est; p.anon = !!ejP.fichaAnon; });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejFichaAnonimo() {
    ejSaveHistory();
    ejP.fichaAnon = !ejP.fichaAnon;
    ejP.players.forEach(function (p) { p.anon = ejP.fichaAnon; p.estilo = ejP.fichaEstilo || 'foto'; });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejCamisetaSVG(r, fill, stroke, sel, numero, colorTexto, fs) {
    var k = r * 1.25;
    var pts = [[-0.42,-0.95],[-1.08,-0.58],[-0.86,-0.02],[-0.6,-0.2],[-0.6,0.98],[0.6,0.98],[0.6,-0.2],[0.86,-0.02],[1.08,-0.58],[0.42,-0.95]];
    var d = 'M' + pts.map(function (q) { return (q[0] * k).toFixed(1) + ',' + (q[1] * k).toFixed(1); }).join(' L') + ' Q0,' + (-0.5 * k).toFixed(1) + ' ' + (-0.42 * k).toFixed(1) + ',' + (-0.95 * k).toFixed(1) + ' Z';
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (sel ? 3 : 2) + '" stroke-linejoin="round"/>'
        + (numero !== '' && numero !== undefined && numero !== null ? '<text y="' + (0.22 * k).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="' + colorTexto + '" font-size="' + fs + '" font-weight="700" font-family="system-ui" style="pointer-events:none">' + numero + '</text>' : '');
}
// ---- Ventana de formaciones: campos en miniatura para elegir sistema ----
var EJ_FORM_GRUPOS = [
    ['11', 'Fútbol 11', ['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '4-5-1', '4-4-1-1', '4-3-2-1', '4-2-2-2', '3-5-2', '3-4-3', '3-4-2-1', '3-4-1-2', '5-3-2', '5-4-1', '5-2-3']],
    ['8', 'Fútbol 8', ['3-3-1', '3-2-2', '2-3-2', '2-4-1', '3-1-3', '3-1-2-1']],
    ['7', 'Fútbol 7', ['3-2-1', '2-3-1', '3-1-2', '2-2-2', '2-1-2-1', '1-3-2']],
    ['5', 'Fútbol sala', ['2-2', '1-2-1', '3-1', '1-3', '4-0']]
];
// Posiciones de un sistema a partir de sus líneas. Los cinco sistemas clásicos conservan su colocación afinada.
function ejFormacionPos(clave) {
    if (EJ_FORMATIONS[clave]) return EJ_FORMATIONS[clave];
    var lineas = clave.split('-').map(Number).filter(function (n) { return n > 0; });
    var reparto = { 1: [0.5], 2: [0.35, 0.65], 3: [0.25, 0.5, 0.75], 4: [0.15, 0.38, 0.62, 0.85], 5: [0.1, 0.3, 0.5, 0.7, 0.9] };
    var pos = [{ x: 0.06, y: 0.5 }];
    var x0 = 0.2, x1 = lineas.length > 3 ? 0.66 : 0.6;
    lineas.forEach(function (n, i) {
        var x = lineas.length === 1 ? 0.4 : x0 + i * (x1 - x0) / (lineas.length - 1);
        (reparto[n] || reparto[5]).forEach(function (y) { pos.push({ x: +x.toFixed(3), y: y }); });
    });
    EJ_FORMATIONS[clave] = pos;
    return pos;
}
function ejFormCerrar() { var m = document.getElementById('ej-form-modal'); if (m) m.remove(); }
function ejFormAbrir() {
    ejFormCerrar();
    var club = ejCfgClub();
    var fmt = club && club.team_format ? String(club.team_format) : '11';
    if (!ejP._formGrupo) ejP._formGrupo = EJ_FORM_GRUPOS.some(function (g) { return g[0] === fmt; }) ? fmt : '11';
    var m = document.createElement('div');
    m.id = 'ej-form-modal';
    m.onclick = function (e) { if (e.target === m) ejFormCerrar(); };
    document.body.appendChild(m);
    ejFormPintar();
}
function ejFormGrupo(g) { ejP._formGrupo = g; ejFormPintar(); }
function ejFormPintar() {
    var m = document.getElementById('ej-form-modal');
    if (!m) return;
    var rival = !!ejP._addingRival;
    var grupo = EJ_FORM_GRUPOS.find(function (g) { return g[0] === ejP._formGrupo; }) || EJ_FORM_GRUPOS[0];
    var cJug = ejFichaColores({ team: rival ? 'rival' : 'my', color: rival ? ejP.rivalColor : ejP.myColor, number: 0 }, rival ? ejP.rivalColor : ejP.myColor);
    var cGk = ejFichaColores({ team: rival ? 'rival' : 'my', color: rival ? ejP.rivalGkColor : ejP.myGkColor, number: 1 }, rival ? ejP.rivalGkColor : ejP.myGkColor);
    var campo = '<rect width="160" height="100" rx="5" fill="#1a6b30"/>'
        + [0, 2, 4, 6].map(function (i) { return '<rect x="' + (6 + i * 18.5) + '" y="5" width="18.5" height="90" fill="#217a38"/>'; }).join('')
        + '<g fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.85"><rect x="6" y="5" width="148" height="90"/><path d="M80 5v90"/><circle cx="80" cy="50" r="12"/><rect x="6" y="24" width="22" height="52"/><rect x="132" y="24" width="22" height="52"/></g>';
    var tarjetas = grupo[2].map(function (clave) {
        var pos = ejFormacionPos(clave);
        var puntos = pos.map(function (p, i) {
            var c = i === 0 ? cGk : cJug;
            var x = 6 + (rival ? 1 - p.x : p.x) * 148, y = 5 + p.y * 90;
            return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4.6" fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="1.2"/>';
        }).join('');
        return '<button type="button" class="ej-fm-card" onclick="ejFormElegir(\'' + clave + '\')"><svg viewBox="0 0 160 100">' + campo + puntos + '</svg><b>' + clave + '</b></button>';
    }).join('');
    m.innerHTML = '<div class="ej-jm-caja ej-fm-caja">'
        + '<div class="ej-jm-cab"><strong>' + (rival ? 'Formación del rival' : 'Formación de mi equipo') + '</strong><button type="button" class="ej-jm-x" onclick="ejFormCerrar()" title="Cerrar"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<div class="ej-fm-tabs">' + EJ_FORM_GRUPOS.map(function (g) { return '<button type="button" class="' + (g[0] === grupo[0] ? 'on' : '') + '" onclick="ejFormGrupo(\'' + g[0] + '\')">' + g[1] + '</button>'; }).join('') + '</div>'
        + '<div class="ej-jm-cuerpo"><div class="ej-fm-grid">' + tarjetas + '</div></div>'
        + '<div class="ej-jm-pie"><span>Al elegir una, sustituye a los jugadores ' + (rival ? 'del rival' : 'de tu equipo') + ' que haya en el campo. Las fichas de tarea no se tocan.</span>'
        + '<button type="button" class="ej-jm-cancel" onclick="ejFormCerrar()">Cancelar</button></div></div>';
}
function ejFormElegir(clave) {
    var rival = !!ejP._addingRival;
    ejFormacionPos(clave);
    ejSaveHistory();
    // Con el rival también se sustituye, igual que con mi equipo
    if (rival) ejP.players = ejP.players.filter(function (p) { return !ejEsRival(p); });
    ejApplyFormation(clave, rival);
    ejSaveHistory();
    if (ejP.animMode) ejFrameSaveCurrent();
    ejFormCerrar();
    ejRenderToolbar();
}
// ---- Ventana de jugadores: la plantilla por líneas, se marcan varios y entran de golpe ----
var EJ_JUG_GRUPOS = [['POR', 'Porteros', 0.06], ['DEF', 'Defensas', 0.20], ['MED', 'Centrocampistas', 0.36], ['DEL', 'Delanteros', 0.47], ['OTR', 'Sin posición', 0.28]];
function ejJugGrupo(pos) {
    var t = String(pos || '').toLowerCase();
    if (!t) return 'OTR';
    if (t.indexOf('porter') >= 0 || t === 'por') return 'POR';
    if (t.indexOf('medio') === 0 || t.indexOf('mc') === 0 || t.indexOf('mediapunta') >= 0 || t.indexOf('interior') >= 0 || t.indexOf('pivote') >= 0) return 'MED';
    if (t.indexOf('central') >= 0 || t.indexOf('lateral') >= 0 || t.indexOf('defensa') >= 0 || t.indexOf('lt ') === 0 || t.indexOf('carrilero') >= 0) return 'DEF';
    if (t.indexOf('delanter') >= 0 || t.indexOf('extremo') >= 0 || t.indexOf('ext ') === 0 || t.indexOf('punta') >= 0) return 'DEL';
    return 'OTR';
}
function ejJugLado(pos) {
    var t = String(pos || '').toLowerCase();
    if (t.indexOf('izq') >= 0 || t.indexOf('izdo') >= 0) return 0;
    if (t.indexOf('der') >= 0 || t.indexOf('dcho') >= 0) return 2;
    return 1;
}
function ejJugEnCampo(j, rival) {
    return ejP.players.some(function (p) { return p.name && p.name === j.name && ejEsRival(p) === rival && p.team !== 'tarea'; });
}
async function ejJugPlantilla() {
    var rival = !!ejP._addingRival;
    if (ejP._plantilla && ejP._plantilla.length && !!ejP._plantillaEsRival === rival) { ejJugModalAbrir(); return; }
    ejP._jugModalPend = true;
    if (rival) { ejCargarPlantillaRival(); return; }
    await ejCargarPlantilla();
    if (ejP._jugModalPend) { ejP._jugModalPend = false; ejToast('Tu plantilla está vacía. Añade jugadores en Mi Club.', 'warning'); }
}
function ejJugModalCerrar() {
    var m = document.getElementById('ej-jug-modal');
    if (m) m.remove();
}
function ejJugModalAbrir() {
    ejP._jugSel = {};
    ejJugModalCerrar();
    var m = document.createElement('div');
    m.id = 'ej-jug-modal';
    m.onclick = function (e) { if (e.target === m) ejJugModalCerrar(); };
    document.body.appendChild(m);
    ejJugModalPintar();
}
function ejJugModalPintar() {
    var m = document.getElementById('ej-jug-modal');
    if (!m) return;
    var rival = !!ejP._plantillaEsRival;
    var lista = ejP._plantilla || [];
    var sel = ejP._jugSel || {};
    var nSel = Object.keys(sel).length;
    var cuerpo = '';
    EJ_JUG_GRUPOS.forEach(function (g) {
        var idx = [];
        lista.forEach(function (j, i) { if (ejJugGrupo(j.position) === g[0]) idx.push(i); });
        if (!idx.length) return;
        var libres = idx.filter(function (i) { return !ejJugEnCampo(lista[i], rival); });
        var todos = libres.length && libres.every(function (i) { return sel[i]; });
        cuerpo += '<div class="ej-jm-grupo"><span>' + g[1] + ' · ' + idx.length + '</span>'
            + (libres.length ? '<button type="button" onclick="ejJugModalGrupo(\'' + g[0] + '\')">' + (todos ? 'Quitar todos' : 'Marcar todos') + '</button>' : '') + '</div><div class="ej-jm-grid">';
        idx.forEach(function (i) {
            var j = lista[i];
            var enCampo = ejJugEnCampo(j, rival);
            var esGk = g[0] === 'POR';
            var claveCol = rival ? (esGk ? ejP.rivalGkColor : ejP.rivalColor) : (esGk ? ejP.myGkColor : ejP.myColor);
            var col = ejFichaColores({ team: rival ? 'rival' : 'my', color: claveCol, number: esGk ? 1 : 0 }, claveCol);
            var num = (j.number === null || j.number === undefined) ? '' : j.number;
            var avatar = j.photo
                ? '<div class="ej-jm-av" style="background-image:url(\'' + String(j.photo).replace(/'/g, '%27') + '\');border-color:' + col.stroke + '"></div>'
                : '<div class="ej-jm-av" style="background:' + col.fill + ';border-color:' + col.stroke + '">' + num + '</div>';
            cuerpo += '<button type="button" class="ej-jm-card' + (sel[i] ? ' on' : '') + (enCampo ? ' en' : '') + '"' + (enCampo ? ' disabled' : ' onclick="ejJugModalToggle(' + i + ')"') + '>'
                + avatar + '<b>' + ejEscXml(j.name || '?') + '</b><i>' + (enCampo ? 'En el campo' : (num !== '' ? num + ' · ' : '') + ejEscXml(j.position || '')) + '</i></button>';
        });
        cuerpo += '</div>';
    });
    m.innerHTML = '<div class="ej-jm-caja">'
        + '<div class="ej-jm-cab"><strong>' + (rival ? 'Jugadores del rival' : 'Mis jugadores') + '</strong>'
        + (rival ? '<button type="button" class="ej-jm-otro" onclick="ejJugModalCerrar();ejP._jugModalPend=true;ejCargarPlantillaRival()">Cambiar de equipo</button>' : '')
        + '<button type="button" class="ej-jm-x" onclick="ejJugModalCerrar()" title="Cerrar"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<div class="ej-jm-cuerpo">' + cuerpo + '</div>'
        + '<div class="ej-jm-pie"><span>Cada jugador entra colocado en su línea; luego lo mueves donde quieras.</span>'
        + '<button type="button" class="ej-jm-cancel" onclick="ejJugModalCerrar()">Cancelar</button>'
        + '<button type="button" class="ej-jm-ok"' + (nSel ? '' : ' disabled') + ' onclick="ejJugModalAnadir()">' + (nSel ? 'Añadir ' + nSel + (nSel === 1 ? ' jugador' : ' jugadores') : 'Marca jugadores') + '</button></div></div>';
}
function ejJugModalToggle(i) {
    var cuerpo = document.querySelector('#ej-jug-modal .ej-jm-cuerpo');
    var sc = cuerpo ? cuerpo.scrollTop : 0;
    if (ejP._jugSel[i]) delete ejP._jugSel[i]; else ejP._jugSel[i] = true;
    ejJugModalPintar();
    cuerpo = document.querySelector('#ej-jug-modal .ej-jm-cuerpo');
    if (cuerpo) cuerpo.scrollTop = sc;
}
function ejJugModalGrupo(g) {
    var rival = !!ejP._plantillaEsRival;
    var libres = [];
    (ejP._plantilla || []).forEach(function (j, i) { if (ejJugGrupo(j.position) === g && !ejJugEnCampo(j, rival)) libres.push(i); });
    var todos = libres.every(function (i) { return ejP._jugSel[i]; });
    libres.forEach(function (i) { if (todos) delete ejP._jugSel[i]; else ejP._jugSel[i] = true; });
    var cuerpo = document.querySelector('#ej-jug-modal .ej-jm-cuerpo');
    var sc = cuerpo ? cuerpo.scrollTop : 0;
    ejJugModalPintar();
    cuerpo = document.querySelector('#ej-jug-modal .ej-jm-cuerpo');
    if (cuerpo) cuerpo.scrollTop = sc;
}
function ejJugModalAnadir() {
    var rival = !!ejP._plantillaEsRival;
    var lista = ejP._plantilla || [];
    var marcados = Object.keys(ejP._jugSel || {}).map(Number);
    if (!marcados.length) return;
    ejSaveHistory();
    var lab = ejP._plantillaLabel || 'both';
    if (lab === 'nofoto') lab = 'both';
    var scale = ejP.selectedSize === 'small' ? 0.6 : ejP.selectedSize === 'large' ? 1.4 : 1.0;
    EJ_JUG_GRUPOS.forEach(function (g) {
        var grupo = marcados.filter(function (i) { return ejJugGrupo(lista[i].position) === g[0]; });
        grupo.sort(function (a, b) { return (ejJugLado(lista[a].position) - ejJugLado(lista[b].position)) || ((lista[a].number || 0) - (lista[b].number || 0)); });
        if (rival) grupo.reverse();
        grupo.forEach(function (i, k) {
            var j = lista[i];
            var x = (rival ? 1 - g[2] : g[2]) * ejP.svgW;
            var y = 40 + (k + 0.5) / grupo.length * (ejP.svgH - 80);
            var libre = function () { return !ejP.players.some(function (p) { return Math.abs(p.x - x) < 16 && Math.abs(p.y - y) < 16; }); };
            for (var n = 0; n < 12 && !libre(); n++) x += rival ? -26 : 26;
            var esGk = g[0] === 'POR';
            ejP.players.push({
                id: ejP.nextId++, x: x, y: y,
                color: rival ? (esGk ? ejP.rivalGkColor : ejP.rivalColor) : (esGk ? ejP.myGkColor : ejP.myColor),
                team: rival ? 'rival' : 'my', scale: scale,
                number: (j.number === null || j.number === undefined) ? '' : j.number, name: j.name, photo: j.photo || null,
                showNumber: lab !== 'name' && lab !== 'solotexto', showName: lab !== 'num', soloTexto: lab === 'solotexto',
                hasVest: false, vestColor: ejP.vestColor,
                estilo: ejP.fichaEstilo || 'foto', anon: !!ejP.fichaAnon
            });
        });
    });
    ejP.selectedId = null;
    ejSaveHistory();
    if (ejP.animMode) ejFrameSaveCurrent();
    ejJugModalCerrar();
    ejRenderSVG();
    ejRenderToolbar();
    ejToast(marcados.length + (marcados.length === 1 ? ' jugador añadido' : ' jugadores añadidos'), 'success');
}
// Qué datos se ven en las fichas con nombre (dorsal, nombre, los dos o solo el nombre escrito)
function ejJugDatos(v) {
    ejP._plantillaLabel = v;
    ejP.showNumbers = v === 'num' || v === 'both';
    var afectados = ejP.players.filter(function (p) { return p.team !== 'tarea'; });
    if (afectados.length) {
        ejSaveHistory();
        afectados.forEach(function (p) {
            p.showNumber = ejP.showNumbers;
            if (!p.name) return;
            p.showName = v !== 'num';
            p.soloTexto = v === 'solotexto';
        });
        ejSaveHistory();
        if (ejP.animMode) ejFrameSaveCurrent();
    }
    ejRenderSVG();
    ejRenderToolbar();
}
// El panel de jugadores se queda con lo que no está en la barra de arriba: apariencia y jugador seleccionado
function ejRenderJugBar() {
    var nav = document.querySelector('.ej-nav');
    if (!nav) return;
    var bar = document.getElementById('ej-jugbar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'ej-jugbar';
        nav.appendChild(bar);
    }
    var rival = !!ejP._addingRival;
    var eq = ejEqCfg();
    var tarea = ejP.activeTool === 'player' ? (ejP._tareaColor || null) : null;
    var anadiendo = ejP.activeTool === 'player' && !ejP._plantillaMode && !tarea;
    ejFichaSync();
    var estilo = ejP.fichaEstilo || 'foto';
    var IC = { foto: '<circle cx="12" cy="9" r="3.2"/><path d="M5.5 19c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/>', circulo: '<circle cx="12" cy="12" r="7.5"/>', camiseta: '<path d="M9 4 4 6.5l1.5 4L8 9.5V20h8V9.5l2.5 1 1.5-4L15 4c-.8 1.4-5.2 1.4-6 0z"/>' };
    var NOM = { foto: 'Fichas con foto', circulo: 'Fichas en círculo con dorsal', camiseta: 'Fichas en camiseta con dorsal' };
    var estilos = ['foto', 'circulo', 'camiseta'].map(function (e) {
        return '<button type="button" class="' + (estilo === e ? 'on' : '') + '" onclick="ejFichaEstilo(\'' + e + '\')" title="' + NOM[e] + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[e] + '</svg></button>';
    }).join('');
    var puntos;
    if (eq) {
        // Papeles de tarea con los colores del club: portero, comodín y petos
        puntos = EQ_ROLES.map(function (r) {
            var c = eq.tarea[r[0]];
            return '<button type="button" class="ej-jb-dot' + (tarea === r[0] ? ' on' : '') + '" style="background:' + c + ';border-color:' + ejHexBorde(c) + '" onclick="ejJugTarea(\'' + r[0] + '\')" title="' + r[1] + ': cada clic en el campo coloca una ficha. Pulsa otra vez para soltar"></button>';
        }).join('');
    } else {
        puntos = Object.keys(EJ_TEAM_COLORS).filter(function (k) {
            return !EJ_TEAM_COLORS[k].striped && k !== ejP.myColor && k !== ejP.rivalColor;
        }).map(function (k) {
            var c = EJ_TEAM_COLORS[k];
            return '<button type="button" class="ej-jb-dot' + (tarea === k ? ' on' : '') + '" style="background:' + c.fill + ';border-color:' + c.stroke + '" onclick="ejJugTarea(\'' + k + '\')" title="Fichas de color ' + c.name.toLowerCase() + ': cada clic en el campo coloca una. Pulsa otra vez para soltar"></button>';
        }).join('');
    }
    var lab = ejP._plantillaLabel || 'both';
    if (lab === 'nofoto') lab = 'both';
    var datos = [['num', 'Dorsal'], ['name', 'Nombre'], ['both', 'Dorsal y nombre'], ['solotexto', 'Solo texto']].map(function (o) { return '<option value="' + o[0] + '"' + (lab === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    bar.innerHTML =
        '<div class="ej-jb-seg">'
        + '<button type="button" class="' + (!rival ? 'on my' : '') + '" onclick="ejJugEquipo(false)">Mi equipo</button>'
        + '<button type="button" class="' + (rival ? 'on riv' : '') + '" onclick="ejJugEquipo(true)">Rival</button>'
        + '</div>'
        + (eq && !rival ? '<button type="button" class="ej-jb-btn ej-jb-kit" onclick="ejJugKit()" title="' + (ejP.miKit === 2 ? 'Segunda equipación. Pulsa para cambiar a la primera' : 'Primera equipación. Pulsa para cambiar a la segunda') + '">' + eqCamisetaSVG(eq.kits[ejP.miKit === 2 ? 'jug2' : 'jug1'], 19) + (ejP.miKit === 2 ? '2ª' : '1ª') + '</button>' : '')
        + '<button type="button" class="ej-jb-btn' + (anadiendo ? ' on' : '') + '" onclick="ejJugAnadir()" title="Cada clic en el campo coloca un jugador. Pulsa otra vez para soltar">+<span class="ej-jb-txt"> Jugador</span></button>'
        + '<button type="button" class="ej-jb-btn ej-jb-x" onclick="ejFormAbrir()" title="Elegir una formación y colocar el equipo">Formación</button>'
        + '<button type="button" class="ej-jb-btn ej-jb-x" onclick="ejJugPlantilla()" title="Abrir la plantilla, marcar varios jugadores y añadirlos de golpe">Plantilla</button>'
        + '<div class="ej-jb-dots">' + puntos + '</div>'
        + '<select class="ej-jb-sel ej-jb-dat" onchange="ejJugDatos(this.value)" title="Qué se ve en las fichas de los jugadores con nombre">' + datos + '</select>'
        + '<div class="ej-jb-est">' + estilos + '</div>'
        + '<button type="button" class="ej-jb-btn ej-jb-a' + (!ejP.fichaAnon ? ' on' : '') + '" onclick="ejFichaAnonimo()" title="' + (ejP.fichaAnon ? 'Fichas anónimas. Pulsa para ver fotos, dorsales y nombres' : 'Pulsa para dejar las fichas anónimas: sin foto, dorsal ni nombre') + '">A</button>'
        + '<button type="button" class="ej-jb-btn ej-jb-cfg" onclick="ejCfgAbrir()" title="Configuración de la pizarra: campo, escudo, equipación y fichas"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg></button>';
}
// =====================================================================
// Entrega 5 · Opciones junto al objeto seleccionado
// Barra flotante (duplicar, voltear, girar, tamaño, color, borrar),
// borrar arrastrando al borde inferior y deshacer coherente.
// =====================================================================
function ejObjBuscar(id, type) {
    var en = function (lista, t) { var o = lista.find(function (x) { return x.id === id; }); return o ? { type: t, obj: o, lista: lista } : null; };
    if (type === 'player') return en(ejP.players, 'player');
    if (type === 'equipment') return en(ejP.equipment, 'equipment');
    if (type === 'text') return en(ejP.texts, 'text');
    if (type === 'shape') return en(ejP.shapes, 'shape');
    if (type === 'line') return en(ejP.lines, 'line');
    return en(ejP.players, 'player') || en(ejP.equipment, 'equipment') || en(ejP.texts, 'text') || en(ejP.shapes, 'shape') || en(ejP.lines, 'line');
}
function ejObjSel() {
    if (ejP.multiSel && ejP.multiSel.length > 0) {
        var items = ejP.multiSel.map(function (m) { return ejObjBuscar(m.id, m.type); }).filter(Boolean);
        return items.length ? { varios: true, items: items } : null;
    }
    if (!ejP.selectedId) return null;
    var it = ejObjBuscar(ejP.selectedId);
    return it ? { varios: false, items: [it] } : null;
}
// Puntos que definen la posición de un objeto (para moverlo, voltearlo o medir su caja)
function ejObjPuntos(it) {
    var o = it.obj;
    if (it.type === 'shape') {
        if (o.type === 'ellipse') return [{ x: o.cx - o.rx, y: o.cy - o.ry }, { x: o.cx + o.rx, y: o.cy + o.ry }];
        return [{ x: o.x, y: o.y }, { x: o.x + o.w, y: o.y + o.h }];
    }
    if (it.type === 'line') {
        if (o.points) return o.points;
        return [{ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }];
    }
    return [{ x: o.x, y: o.y }];
}
function ejObjMover(it, dx, dy) {
    var o = it.obj;
    if (it.type === 'shape' && o.type === 'ellipse') { o.cx += dx; o.cy += dy; return; }
    if (it.type === 'line') {
        if (o.points) { o.points = o.points.map(function (p) { return { x: p.x + dx, y: p.y + dy }; }); return; }
        o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy;
        if (o.cx !== undefined) { o.cx += dx; o.cy += dy; }
        return;
    }
    o.x += dx; o.y += dy;
}
function ejObjEspejo(it, eje, c) {
    var o = it.obj;
    var f = function (v) { return 2 * c - v; };
    var X = eje === 'h';
    if (it.type === 'shape') {
        if (o.type === 'ellipse') { if (X) o.cx = f(o.cx); else o.cy = f(o.cy); }
        else if (X) o.x = f(o.x) - o.w; else o.y = f(o.y) - o.h;
    } else if (it.type === 'line') {
        if (o.points) o.points = o.points.map(function (p) { return X ? { x: f(p.x), y: p.y } : { x: p.x, y: f(p.y) }; });
        else if (X) { o.x1 = f(o.x1); o.x2 = f(o.x2); if (o.cx !== undefined) o.cx = f(o.cx); }
        else { o.y1 = f(o.y1); o.y2 = f(o.y2); if (o.cy !== undefined) o.cy = f(o.cy); }
    } else {
        if (X) o.x = f(o.x); else o.y = f(o.y);
        if (it.type === 'equipment' && o.rotation) o.rotation = ((X ? 360 - o.rotation : 180 - o.rotation) % 360 + 360) % 360;
    }
}
function ejObjTrasCambio() {
    ejSaveHistory();
    if (ejP.animMode) ejFrameSaveCurrent();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejObjDuplicar() {
    var s = ejObjSel();
    if (!s) return;
    ejSaveHistory();
    var nuevos = [];
    s.items.forEach(function (it) {
        var copia = JSON.parse(JSON.stringify(it.obj));
        copia.id = ejP.nextId++;
        var c = { type: it.type, obj: copia, lista: it.lista };
        ejObjMover(c, 20, 20);
        it.lista.push(copia);
        nuevos.push({ id: copia.id, type: it.type });
    });
    if (s.varios) ejP.multiSel = nuevos; else ejP.selectedId = nuevos[0].id;
    ejObjTrasCambio();
}
function ejObjVoltear(eje) {
    var s = ejObjSel();
    if (!s) return;
    ejSaveHistory();
    var min = Infinity, max = -Infinity;
    s.items.forEach(function (it) { ejObjPuntos(it).forEach(function (p) { var v = eje === 'h' ? p.x : p.y; if (v < min) min = v; if (v > max) max = v; }); });
    var c = (min + max) / 2;
    s.items.forEach(function (it) { ejObjEspejo(it, eje, c); });
    ejObjTrasCambio();
}
function ejObjGirar(grados) {
    var s = ejObjSel();
    if (!s) return;
    ejSaveHistory();
    s.items.forEach(function (it) { if (it.type === 'equipment') it.obj.rotation = (((it.obj.rotation || 0) + grados) % 360 + 360) % 360; });
    ejObjTrasCambio();
}
function ejObjTam(dir) {
    var s = ejObjSel();
    if (!s) return;
    ejSaveHistory();
    s.items.forEach(function (it) {
        if (it.type !== 'player' && it.type !== 'equipment') return;
        var tope = it.type === 'player' ? 2.5 : 3.0;
        var v = (it.obj.scale != null ? it.obj.scale : 1) + (dir === 'up' ? 0.15 : -0.15);
        it.obj.scale = Math.round(Math.max(0.3, Math.min(tope, v)) * 100) / 100;
    });
    ejObjTrasCambio();
}
function ejObjColor(valor) {
    var s = ejObjSel();
    if (!s || s.varios) return;
    var it = s.items[0];
    ejSaveHistory();
    it.obj.color = valor === 'null' ? null : valor;
    ejP._objPaleta = false;
    ejObjTrasCambio();
}
function ejObjPaleta() { ejP._objPaleta = !ejP._objPaleta; ejObjBar(); }
function ejObjMas() {
    var s = ejObjSel();
    if (!s) return;
    var t = s.items[0].type;
    var sec = t === 'player' ? 'players' : t === 'equipment' ? 'material' : 'draw';
    ejP.expandedSection = ejP.expandedSection === sec ? null : sec;
    ejRenderToolbar();
}
function ejObjBorrar() { ejP._objPaleta = false; ejDelete(); }
var EJ_OBJ_IC = {
    dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
    fh: '<path d="M12 3v18"/><path d="M8 7 3 12l5 5z"/><path d="m16 7 5 5-5 5z"/>',
    fv: '<path d="M3 12h18"/><path d="M7 8l5-5 5 5z"/><path d="m7 16 5 5 5-5z"/>',
    gi: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    gd: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
    me: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>',
    ma: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/>',
    ed: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    mas: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    del: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};
function ejObjBar() {
    var area = document.getElementById('ej-canvas-area');
    var svg = document.getElementById('ej-svg');
    if (!area || !svg) return;
    var bar = document.getElementById('ej-objbar');
    if (!bar) { bar = document.createElement('div'); bar.id = 'ej-objbar'; area.appendChild(bar); }
    var s = ejObjSel();
    if (!s || ejP.activeTool !== 'select' || ejP.isDragging || ejP.isDrawing || ejP.isPlaying || ejP._presentOn || ejP._marquee) { bar.style.display = 'none'; ejP._objPaleta = false; return; }
    var uno = s.varios ? null : s.items[0];
    var hay = function (t) { return s.items.some(function (it) { return it.type === t; }); };
    var B = function (ic, fn, titulo, cls) {
        return '<button type="button"' + (cls ? ' class="' + cls + '"' : '') + ' onclick="' + fn + '" title="' + titulo + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + EJ_OBJ_IC[ic] + '</svg></button>';
    };
    var h = '';
    if (s.varios) h += '<span class="ej-ob-n">' + s.items.length + '</span>';
    h += B('dup', 'ejObjDuplicar()', 'Duplicar');
    if (s.varios || (uno && uno.type === 'line')) {
        h += B('fh', 'ejObjVoltear(\'h\')', s.varios ? 'Voltear el grupo en horizontal (espejo izquierda-derecha)' : 'Voltear en horizontal');
        h += B('fv', 'ejObjVoltear(\'v\')', s.varios ? 'Voltear el grupo en vertical (espejo arriba-abajo)' : 'Voltear en vertical');
    }
    if (hay('equipment')) { h += B('gi', 'ejObjGirar(-15)', 'Girar a la izquierda'); h += B('gd', 'ejObjGirar(15)', 'Girar a la derecha'); }
    if (hay('equipment') || hay('player')) { h += B('me', 'ejObjTam(\'down\')', 'Más pequeño'); h += B('ma', 'ejObjTam(\'up\')', 'Más grande'); }
    if (uno) {
        var col = uno.type === 'player' ? ejFichaColores(uno.obj, uno.obj.color).fill : (uno.obj.color || '#94a3b8');
        h += '<button type="button" class="ej-ob-col' + (ejP._objPaleta ? ' on' : '') + '" onclick="ejObjPaleta()" title="Color"><i style="background:' + col + '"></i></button>';
        if (uno.type === 'text') h += B('ed', 'ejEditarTexto()', 'Editar el texto');
        h += B('mas', 'ejObjMas()', 'Más opciones en el panel');
    }
    h += B('del', 'ejObjBorrar()', 'Borrar (también arrastrando al borde inferior del campo)', 'ej-ob-del');
    if (uno && ejP._objPaleta) {
        var ops = uno.type === 'player'
            ? Object.keys(EJ_TEAM_COLORS).map(function (k) { var c = EJ_TEAM_COLORS[k]; return [k, c.striped ? 'repeating-linear-gradient(90deg,' + c.fill + ' 0 4px,' + (c.fill2 || '#fff') + ' 4px 8px)' : c.fill, c.name]; })
            : uno.type === 'equipment'
                ? EJ_EQUIP_COLORS.map(function (c) { return [c.c === null ? 'null' : c.c, c.c || 'conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#ef4444)', c.n]; })
                : EJ_LINE_COLORS.map(function (c) { return [c.c, c.c, c.n]; });
        h += '<div class="ej-ob-pal">' + ops.map(function (o) { return '<button type="button" style="background:' + o[1] + '" title="' + o[2] + '" onclick="ejObjColor(\'' + o[0] + '\')"></button>'; }).join('') + '</div>';
    }
    bar.innerHTML = h;
    bar.style.display = 'flex';
    // Colocarla encima del objeto (o debajo si no cabe), sin salirse del área de trabajo
    var ar = area.getBoundingClientRect();
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    s.items.forEach(function (it) {
        var n = svg.querySelector('[data-id="' + it.obj.id + '"][data-type="' + it.type + '"]');
        if (!n) return;
        var r = n.getBoundingClientRect();
        if (r.left < x0) x0 = r.left; if (r.top < y0) y0 = r.top; if (r.right > x1) x1 = r.right; if (r.bottom > y1) y1 = r.bottom;
    });
    if (x0 === Infinity) { bar.style.display = 'none'; return; }
    var bw = bar.offsetWidth, bh = bar.offsetHeight;
    var left = (x0 + x1) / 2 - bw / 2 - ar.left;
    var top = y0 - ar.top - bh - 14;
    if (top < 4) top = y1 - ar.top + 14;
    if (top + bh > ar.height - 4) top = Math.max(4, ar.height - bh - 4);
    left = Math.max(4, Math.min(left, ar.width - bw - 4));
    bar.style.left = left + 'px';
    bar.style.top = top + 'px';
}
// ---- El panel lateral se abre sobre el césped de detrás de la portería, si hay sitio ----
function ejPanelHueco() {
    var wrap = document.getElementById('ej-pizarra-wrap');
    var svg = document.getElementById('ej-svg');
    if (!wrap || !svg) return;
    wrap.classList.add('ej-panel-encima');
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var escala = Math.min(r.width / ejP.svgW, r.height / ejP.svgH);
    var hueco = Math.floor((r.width - ejP.svgW * escala) / 2 + 9 * escala - 6);
    if (hueco < 160) { wrap.classList.remove('ej-panel-encima'); return; }
    wrap.style.setProperty('--ej-hueco', Math.min(hueco, 260) + 'px');
}
// ---- Borrar arrastrando al borde inferior del campo ----
function ejObjZonaBorrar(e) {
    if ((ejP.zoom || 1) !== 1 || (ejP.camAngle || 0) > 0) return false;
    return ejGetPos(e).y > 486;
}
function ejObjFranja(ver, encima) {
    var area = document.getElementById('ej-canvas-area');
    var svg = document.getElementById('ej-svg');
    if (!area || !svg) return;
    var f = document.getElementById('ej-objdel');
    if (!ver) { if (f) f.style.display = 'none'; return; }
    if (!f) { f = document.createElement('div'); f.id = 'ej-objdel'; f.textContent = '✕  Suelta aquí para borrar'; area.appendChild(f); }
    var m = svg.getScreenCTM(), ar = area.getBoundingClientRect();
    var p0 = svg.createSVGPoint(); p0.x = 0; p0.y = 486; p0 = p0.matrixTransform(m);
    var p1 = svg.createSVGPoint(); p1.x = ejP.svgW; p1.y = ejP.svgH; p1 = p1.matrixTransform(m);
    f.style.left = (p0.x - ar.left) + 'px';
    f.style.top = (p0.y - ar.top) + 'px';
    f.style.width = (p1.x - p0.x) + 'px';
    f.style.height = (p1.y - p0.y) + 'px';
    f.style.display = 'flex';
    f.className = encima ? 'on' : '';
}
// Borrar deja guardado el resultado, para que deshacer lo recupere
function ejDelete() {
    ejBorrarSeleccion();
    ejSaveHistory();
    if (ejP.animMode) ejFrameSaveCurrent();
    ejObjBar();
}
// Puntero sobre el campo: a la lógica de dibujo (ejPuntero…) se añaden las fichas de tarea,
// la barrita del objeto y el borrado arrastrando a la franja inferior
function ejSvgPointerDown(e) {
    ejP._objPaleta = false;
    var nJug = ejP.players.length;
    ejPunteroBajar(e);
    // Las fichas de tarea no llevan dorsal
    if (ejP._tareaColor && ejP.players.length > nJug) {
        var ficha = ejP.players[ejP.players.length - 1];
        ficha.showNumber = false;
        if (typeof EQ_ROLES !== 'undefined' && EQ_ROLES.some(function (r) { return r[0] === ejP._tareaColor; })) { ficha.rol = ejP._tareaColor; ficha.color = 'white'; }
        ejRenderSVG();
    }
    var mueve = ejP.isDragging && ejP.activeTool === 'select' && !ejP._ctrlId && !ejP._epDrag && !ejP._rszId && !ejP._trajCtrlId && !ejP._marquee && (ejP.selectedId || ejP._blockDrag);
    ejP._arr = mueve ? {
        x: e.clientX, y: e.clientY, movido: false,
        copia: { players: JSON.stringify(ejP.players), lines: JSON.stringify(ejP.lines), shapes: JSON.stringify(ejP.shapes), texts: JSON.stringify(ejP.texts), equipment: JSON.stringify(ejP.equipment) }
    } : null;
    ejObjBar();
}
function ejSvgPointerMove(e) {
    ejPunteroMover(e);
    var a = ejP._arr;
    if (!a || !ejP.isDragging) return;
    if (!a.movido && Math.abs(e.clientX - a.x) + Math.abs(e.clientY - a.y) > 8) a.movido = true;
    if (a.movido && (ejP.zoom || 1) === 1 && !((ejP.camAngle || 0) > 0)) ejObjFranja(true, ejObjZonaBorrar(e));
}
function ejSvgPointerUp(e) {
    var a = ejP._arr;
    ejP._arr = null;
    if (a && a.movido && ejP.isDragging && ejObjZonaBorrar(e)) {
        // Se suelta en la franja: el objeto vuelve a donde estaba y se borra, así deshacer lo recupera en su sitio
        ejP.players = JSON.parse(a.copia.players); ejP.lines = JSON.parse(a.copia.lines); ejP.shapes = JSON.parse(a.copia.shapes);
        ejP.texts = JSON.parse(a.copia.texts); ejP.equipment = JSON.parse(a.copia.equipment);
        ejP.isDragging = false; ejP._blockDrag = false;
        ejObjFranja(false);
        ejDelete();
        ejToast('Borrado. Puedes recuperarlo con Deshacer.', 'info');
        return;
    }
    ejPunteroSoltar(e);
    ejObjFranja(false);
    ejObjBar();
}
// =====================================================================
// Entrega 6a · Fondos de campo
// Doce fondos. Los siete de césped usan el color elegido; los otros
// cinco traen su propio color. Por defecto, corte cruzado.
// =====================================================================
var EJ_FONDOS = [
    { k: 'cruzado', n: 'Corte cruzado' },
    { k: 'verticales', n: 'Franjas verticales' },
    { k: 'horizontales', n: 'Franjas horizontales' },
    { k: 'damero', n: 'Damero' },
    { k: 'anillos', n: 'Anillos' },
    { k: 'diagonales', n: 'Diagonales' },
    { k: 'rombos', n: 'Rombos' },
    { k: 'noche', n: 'Noche con focos', color: '#0b3d20' },
    { k: 'tactico', n: 'Táctico oscuro', color: '#111a2b' },
    { k: 'tiza', n: 'Pizarra de tiza', color: '#23372f' },
    { k: 'cuaderno', n: 'Cuaderno cuadriculado', color: 'grid' },
    { k: 'claro', n: 'Claro técnico', color: '#eef2f6' }
];
function ejFondoDef(k) {
    k = k || ejP.fieldFondo || 'cruzado';
    return EJ_FONDOS.find(function (f) { return f.k === k; }) || EJ_FONDOS[0];
}
// Color con el que se pinta el campo según el fondo activo
function ejFondoColor(k) {
    var f = ejFondoDef(k);
    if (f.color) return f.color;
    return (!ejP.fieldColor || ejP.fieldColor === 'grid') ? '#1a6b30' : ejP.fieldColor;
}
// Dibujo del fondo dentro del terreno (x 20–780, y 15–485)
function ejFondoSVG(c1, c2, k, sfx) {
    k = k || ejFondoDef().k;
    sfx = sfx || '';
    var X = 20, Y = 15, W = 760, H = 470, s = '', i, j;
    var R = function (x, y, w, h, fill, extra) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + fill + '"' + (extra || '') + '/>'; };
    var clip = '<defs><clipPath id="ejFoClip' + sfx + '"><rect x="' + X + '" y="' + Y + '" width="' + W + '" height="' + H + '"/></clipPath></defs>';
    var vert = function (n) { var o = '', w = W / n; for (var a = 0; a < n; a++) if (a % 2 === 0) o += R(X + a * w, Y, w, H, c2); return o; };
    var claro = 'rgba(255,255,255,0.075)', oscuro = 'rgba(0,0,0,0.10)';
    if (k === 'verticales') return vert(12);
    if (k === 'cruzado') {
        s = vert(12);
        var hb = H / 8;
        for (i = 0; i < 8; i++) s += R(X, Y + i * hb, W, hb, i % 2 === 0 ? claro : oscuro);
        return s;
    }
    if (k === 'horizontales') { var h8 = H / 8; for (i = 0; i < 8; i++) if (i % 2 === 0) s += R(X, Y + i * h8, W, h8, c2); return s; }
    if (k === 'damero') {
        var cw = W / 12, ch = H / 8;
        for (i = 0; i < 12; i++) for (j = 0; j < 8; j++) if ((i + j) % 2 === 0) s += R(X + i * cw, Y + j * ch, cw, ch, c2);
        return s;
    }
    if (k === 'anillos') {
        s = clip + '<g clip-path="url(#ejFoClip' + sfx + ')">';
        for (i = 12; i >= 1; i--) s += '<circle cx="400" cy="250" r="' + (i * 38) + '" fill="' + (i % 2 === 0 ? c2 : c1) + '"/>';
        return s + '</g>';
    }
    if (k === 'diagonales' || k === 'rombos') {
        s = clip + '<g clip-path="url(#ejFoClip' + sfx + ')">';
        var banda = function (ang, fill) {
            var o = '<g transform="rotate(' + ang + ' 400 250)">';
            for (var a = -8; a < 20; a++) if (a % 2 === 0) o += R(-200 + a * 48, -300, 48, 1100, fill);
            return o + '</g>';
        };
        s += k === 'diagonales' ? banda(35, c2) : banda(35, claro) + banda(-35, oscuro);
        return s + '</g>';
    }
    if (k === 'noche') {
        s = vert(12);
        s += '<defs><radialGradient id="ejFoFoco' + sfx + '"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>';
        s += '<g clip-path="none">';
        [[X, Y], [X + W, Y], [X, Y + H], [X + W, Y + H]].forEach(function (p) {
            s += '<svg x="' + X + '" y="' + Y + '" width="' + W + '" height="' + H + '" viewBox="' + X + ' ' + Y + ' ' + W + ' ' + H + '" overflow="hidden"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="330" ry="250" fill="url(#ejFoFoco' + sfx + ')"/></svg>';
        });
        return s + '</g>';
    }
    if (k === 'tactico') {
        for (i = 1; i < 12; i++) s += R(X + i * W / 12 - 0.4, Y, 0.8, H, 'rgba(148,163,184,0.16)');
        for (i = 1; i < 8; i++) s += R(X, Y + i * H / 8 - 0.4, W, 0.8, 'rgba(148,163,184,0.16)');
        return s;
    }
    if (k === 'tiza') {
        s = '<defs><radialGradient id="ejFoTiza' + sfx + '"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.07"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>';
        [[210, 150, 230, 120], [560, 330, 260, 130], [420, 110, 170, 70], [150, 380, 150, 70]].forEach(function (e) {
            s += '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" fill="url(#ejFoTiza' + sfx + ')"/>';
        });
        return s;
    }
    if (k === 'claro') { var wv = W / 12; for (i = 0; i < 12; i++) if (i % 2 === 0) s += R(X + i * wv, Y, wv, H, '#e2e8f0'); return s; }
    return vert(12);
}
// Al abrir un ejercicio guardado se recupera el fondo con el que se guardó
function ejFondoCargar(bd) {
    ejP.miKit = 1; // la equipación la dirán los jugadores del ejercicio, si la llevan apuntada
    if (!bd || !bd.fondo || !EJ_FONDOS.some(function (f) { return f.k === bd.fondo; })) return;
    ejP.fieldFondo = bd.fondo;
    if (bd.fondoColor && bd.fondoColor !== 'grid') ejP.fieldColor = bd.fondoColor;
}
function ejSetFondo(k) {
    ejP.fieldFondo = k;
    ejRenderSVG();
    ejRenderToolbar();
}
function ejFondoMiniaturas(accion) {
    var act = ejFondoDef();
    return '<div class="ej-fondos">' + EJ_FONDOS.map(function (f) {
        var col = ejFondoColor(f.k), dibujo;
        if (col === 'grid') dibujo = '<rect x="20" y="15" width="760" height="470" fill="#fbfcfe"/><path d="M20 132h760M20 250h760M20 367h760M210 15v470M400 15v470M590 15v470" stroke="#b9c8de" stroke-width="5" fill="none"/>';
        else dibujo = '<rect x="20" y="15" width="760" height="470" fill="' + col + '"/>' + ejFondoSVG(col, ejLightenColor(col, 12), f.k, '_' + f.k);
        var linea = (f.k === 'claro' || f.k === 'cuaderno') ? '#334155' : '#ffffff';
        return '<button type="button" class="' + (act.k === f.k ? 'on' : '') + '" onclick="' + accion.replace('$k', f.k) + '" title="' + f.n + '"><svg viewBox="20 15 760 470" preserveAspectRatio="none">' + dibujo
            + '<g fill="none" stroke="' + linea + '" stroke-width="9" opacity="0.9"><rect x="24" y="19" width="752" height="462"/><path d="M400 19v462"/><circle cx="400" cy="250" r="70"/></g></svg></button>';
    }).join('') + '</div>';
}
// Miniaturas de los fondos en el panel Campo, encima de los colores
// =====================================================================
// Entrega 6b · Configuración de la pizarra, guardada por club
// Fondo y color, escudo en el círculo central, equipación y fichas.
// Se guarda en clubs.pizarra_config y se aplica al abrir la pizarra
// y al empezar una pizarra nueva.
// =====================================================================
function ejCfgClub() { return (typeof clubData !== 'undefined' && clubData) ? clubData : null; }
function ejCfgActual() {
    return {
        fondo: ejP.fieldFondo, color: ejP.fieldColor,
        escudo: { ver: !!ejP.escudo.ver, op: ejP.escudo.op, tam: ejP.escudo.tam },
        miColor: ejP.myColor, miGk: ejP.myGkColor, rivalColor: ejP.rivalColor, rivalGk: ejP.rivalGkColor,
        estilo: ejP.fichaEstilo || 'foto', datos: ejP._plantillaLabel || 'both', tam: ejP.selectedSize
    };
}
function ejCfgAplicar() {
    var club = ejCfgClub();
    var c = (club && club.pizarra_config) || {};
    ejP.miKit = 1;
    var col = function (v) { return v && EJ_TEAM_COLORS[v] ? v : null; };
    if (c.fondo && EJ_FONDOS.some(function (f) { return f.k === c.fondo; })) ejP.fieldFondo = c.fondo;
    if (c.color && /^#[0-9a-f]{6}$/i.test(c.color)) ejP.fieldColor = c.color;
    if (c.escudo) ejP.escudo = { ver: c.escudo.ver !== false, op: Math.max(0.05, Math.min(0.8, +c.escudo.op || 0.18)), tam: Math.max(0.4, Math.min(1.8, +c.escudo.tam || 1)) };
    if (col(c.miColor)) ejP.myColor = c.miColor;
    if (col(c.miGk)) ejP.myGkColor = c.miGk;
    if (col(c.rivalColor)) ejP.rivalColor = c.rivalColor;
    if (col(c.rivalGk)) ejP.rivalGkColor = c.rivalGk;
    if (['foto', 'circulo', 'camiseta'].indexOf(c.estilo) >= 0) ejP.fichaEstilo = c.estilo;
    if (['num', 'name', 'both', 'solotexto'].indexOf(c.datos) >= 0) { ejP._plantillaLabel = c.datos; ejP.showNumbers = c.datos === 'num' || c.datos === 'both'; }
    if (['small', 'medium', 'large'].indexOf(c.tam) >= 0) ejP.selectedSize = c.tam;
    ejEscudoPrecargar();
}
// El escudo se pasa a datos incrustados para que salga también en el PNG y en el vídeo
function ejEscudoPrecargar() {
    var club = ejCfgClub();
    var url = club && club.logo_url;
    if (!url || ejP._escudoUrl === url) return;
    ejP._escudoUrl = url;
    ejP._escudoData = null;
    if (url.indexOf('data:') === 0) { ejP._escudoData = url; return; }
    fetch(url).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
        if (!b) return;
        var fr = new FileReader();
        fr.onload = function () { ejP._escudoData = fr.result; ejRenderSVG(); };
        fr.readAsDataURL(b);
    }).catch(function () { /* si no se puede incrustar, se usa la dirección directa */ });
}
function ejEscudoSVG() {
    var club = ejCfgClub();
    var src = ejP._escudoData || (club && club.logo_url);
    if (!src || !ejP.escudo || !ejP.escudo.ver) return '';
    if (ejP.fieldType !== 'full' && ejP.fieldType !== 'artificial') return '';
    var lado = 104 * ejP.escudo.tam;
    return '<image href="' + ejEscXml(src) + '" x="' + (400 - lado / 2).toFixed(1) + '" y="' + (250 - lado / 2).toFixed(1) + '" width="' + lado.toFixed(1) + '" height="' + lado.toFixed(1)
        + '" opacity="' + ejP.escudo.op + '" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>';
}
function ejCfgEscudo(campo, valor) {
    if (campo === 'ver') ejP.escudo.ver = !!valor;
    else ejP.escudo[campo] = +valor;
    ejRenderSVG();
    var e = document.getElementById('ej-cfg-' + campo);
    if (e) e.textContent = campo === 'op' ? Math.round(ejP.escudo.op * 100) + ' %' : Math.round(ejP.escudo.tam * 100) + ' %';
}
function ejCfgCerrar() { var m = document.getElementById('ej-cfg-modal'); if (m) m.remove(); }
function ejCfgAbrir() {
    ejCfgCerrar();
    var m = document.createElement('div');
    m.id = 'ej-cfg-modal';
    m.onclick = function (e) { if (e.target === m) ejCfgCerrar(); };
    document.body.appendChild(m);
    ejCfgPintar();
}
function ejCfgHacer(fn, arg) {
    window[fn](arg);
    var caja = document.querySelector('#ej-cfg-modal .ej-cfg-cuerpo');
    var sc = caja ? caja.scrollTop : 0;
    ejCfgPintar();
    caja = document.querySelector('#ej-cfg-modal .ej-cfg-cuerpo');
    if (caja) caja.scrollTop = sc;
}
function ejCfgPintar() {
    var m = document.getElementById('ej-cfg-modal');
    if (!m) return;
    var club = ejCfgClub();
    var cesped = ['#1a6b30', '#1a8540', '#2d8a4e', '#0f4c2a', '#1e3a5f', '#0a1628', '#2c2c2c', '#ffffff'];
    var eqc = ejEqCfg();
    var propio = !!ejFondoDef().color;
    var h = '<div class="ej-cfg-caja">'
        + '<div class="ej-jm-cab"><strong>Configuración de la pizarra</strong><button type="button" class="ej-jm-x" onclick="ejCfgCerrar()" title="Cerrar"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<div class="ej-cfg-cuerpo">'
        + '<h4>Campo</h4><div class="ej-cfg-l">Fondo</div>' + ejFondoMiniaturas('ejCfgHacer(\'ejSetFondo\',\'$k\')')
        + '<div class="ej-cfg-l">Color del césped' + (propio ? ' <em>(este fondo trae el suyo)</em>' : '') + '</div><div class="ej-cfg-cols redondo' + (propio ? ' off' : '') + '">'
        + cesped.map(function (c) { return '<button type="button" class="' + (!propio && ejP.fieldColor === c ? 'on' : '') + '" style="background:' + c + '" onclick="ejCfgHacer(\'ejSetFieldColor\',\'' + c + '\')"></button>'; }).join('') + '</div>'
        + '<h4>Escudo en el círculo central</h4>';
    if (club && club.logo_url) {
        h += '<label class="ej-cfg-chk"><input type="checkbox"' + (ejP.escudo.ver ? ' checked' : '') + ' onchange="ejCfgEscudo(\'ver\', this.checked)"> Mostrar el escudo del club</label>'
            + '<div class="ej-cfg-rango"><span>Opacidad</span><input type="range" min="0.05" max="0.8" step="0.01" value="' + ejP.escudo.op + '" oninput="ejCfgEscudo(\'op\', this.value)"><b id="ej-cfg-op">' + Math.round(ejP.escudo.op * 100) + ' %</b></div>'
            + '<div class="ej-cfg-rango"><span>Tamaño</span><input type="range" min="0.4" max="1.8" step="0.02" value="' + ejP.escudo.tam + '" oninput="ejCfgEscudo(\'tam\', this.value)"><b id="ej-cfg-tam">' + Math.round(ejP.escudo.tam * 100) + ' %</b></div>'
            + '<div class="ej-cfg-nota">Se ve en el campo completo y en el artificial.</div>';
    } else {
        h += '<div class="ej-cfg-nota">Tu club todavía no tiene escudo. Súbelo en Mi Club y aparecerá aquí.</div>';
    }
    h += '<h4>Equipación y colores de tarea</h4>'
        + (eqc ? '<div class="ej-cfg-kits">' + ['jug1', 'jug2', 'por1', 'por2'].map(function (k) { return eqCamisetaSVG(eqc.kits[k], 40); }).join('') + '<button type="button" onclick="ejIrEquipacion()">Cambiar en Mi Club</button></div>'
            + '<div class="ej-cfg-nota">Las camisetas del club y los colores de portero, comodín y petos se eligen en Mi Club.</div>'
            : '<div class="ej-cfg-nota">Falta cargar equipacion.js para elegir la equipación del club.</div>')
        + '</div>'
        + '<div class="ej-jm-pie"><span>Se guardan también el formato de ficha, los datos y los colores del rival que tengas puestos ahora.</span>'
        + '<button type="button" class="ej-jm-ok" onclick="ejCfgGuardar()">Guardar para el club</button></div></div>';
    m.innerHTML = h;
}
async function ejCfgGuardar() {
    var club = ejCfgClub();
    var id = club ? club.id : (typeof clubId !== 'undefined' ? clubId : null);
    if (!id) { ejToast('No se ha podido identificar el club.', 'error'); return; }
    // Se parte de lo que el club tiene guardado ahora mismo (equipaciones y colores de tarea incluidos)
    // y solo se cambian los datos de la pizarra. Nunca se sustituye la configuración entera.
    var previo = (club && club.pizarra_config) || {};
    try {
        var leido = await supabaseClient.from('clubs').select('pizarra_config').eq('id', id).maybeSingle();
        if (leido && !leido.error && leido.data && leido.data.pizarra_config) previo = leido.data.pizarra_config;
    } catch (e) { /* si no se puede leer, se usa lo que hay en memoria */ }
    var cfg = Object.assign({}, previo, ejCfgActual());
    var r = await supabaseClient.from('clubs').update({ pizarra_config: cfg }).eq('id', id);
    if (r && r.error) { console.error('pizarra_config:', r.error); ejToast('No se ha podido guardar la configuración. Revisa que la columna pizarra_config exista.', 'error'); return; }
    if (club) club.pizarra_config = cfg;
    ejToast('Configuración guardada para el club', 'success');
    ejCfgCerrar();
}
// =====================================================================
// Equipación del club en la pizarra
// Mi equipo se dibuja con la camiseta definida en Mi Club (equipacion.js)
// y las fichas de tarea usan los colores de portero, comodín y petos.
// Se resuelve al pintar: si el club cambia de equipación, los ejercicios
// guardados la siguen.
// =====================================================================
function ejHexLum(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
}
function ejHexContraste(hex) { return ejHexLum(hex) > 150 ? '#1e293b' : '#ffffff'; }
function ejHexBorde(hex) {
    var l = ejHexLum(hex);
    if (l < 55) return '#cbd5e1';
    var f = function (i) { return Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.62).toString(16).padStart(2, '0'); };
    return '#' + f(1) + f(3) + f(5);
}
function ejEqCfg() {
    if (typeof eqConfig !== 'function') return null;
    var club = ejCfgClub();
    var origen = club ? club.pizarra_config : null;
    if (!ejP._eqCache || ejP._eqCacheDe !== origen) { ejP._eqCache = eqConfig(); ejP._eqCacheDe = origen; }
    return ejP._eqCache;
}
// ¿Este jugador va con la equipación del club? Los de mi equipo que conservan el color de equipo.
// Si a uno se le cambia el color a mano, deja de llevarla.
function ejKitDe(p) {
    var cfg = ejEqCfg();
    if (!cfg || ejP._sinKit || p.team === 'tarea' || ejEsRival(p)) return null;
    var esColorGk = p.color === ejP.myGkColor && ejP.myGkColor !== ejP.myColor;
    if (p.color !== ejP.myColor && !esColorGk) return null;
    var portero = esColorGk || p.number == 1;
    return cfg.kits[(portero ? 'por' : 'jug') + ((p.eq || ejP.miKit) === 2 ? '2' : '1')];
}
// Colores con los que se pinta una ficha. Sustituye a la consulta directa de EJ_TEAM_COLORS.
function ejFichaColores(p, colorClave) {
    var base = EJ_TEAM_COLORS[colorClave] || EJ_TEAM_COLORS.blue;
    var cfg = ejEqCfg();
    if (!cfg) return base;
    if (p.team === 'tarea') {
        var c = p.rol && cfg.tarea[p.rol];
        return c ? { fill: c, stroke: ejHexBorde(c), texto: ejHexContraste(c), name: p.rol } : base;
    }
    var kit = ejKitDe(p);
    if (!kit) return base;
    var out = { fill: kit.c1, stroke: ejHexBorde(kit.c1), texto: ejHexContraste(kit.c1), name: 'Equipación del club' };
    if (kit.d !== 'liso') {
        var R = 14 * (p.scale == null ? 1 : p.scale) * 1.45;
        // Parche liso detrás del dorsal, para que se lea sobre rayas o cuadros
        var r0 = R / 1.45, parche = '';
        if (p.showNumber && p.number && !p.anon && (p.estilo === 'camiseta' || p.estilo === 'circulo' || !p.photo)) {
            parche = '<circle cx="' + R.toFixed(1) + '" cy="' + (R + (p.estilo === 'camiseta' ? 0.275 * r0 : 0)).toFixed(1) + '" r="' + (r0 * 0.56).toFixed(1) + '" fill="' + kit.c1 + '"/>';
        }
        out.kitFill = 'url(#kit-' + p.id + ')';
        out.defs = '<defs><pattern id="kit-' + p.id + '" patternUnits="userSpaceOnUse" x="' + (-R).toFixed(1) + '" y="' + (-R).toFixed(1) + '" width="' + (2 * R).toFixed(1) + '" height="' + (2 * R).toFixed(1) + '">'
            + eqDibujo(kit.d, kit.c1, kit.c2, 0, 0, 2 * R, 2 * R) + parche + '</pattern></defs>';
    }
    return out;
}
// Primera o segunda equipación. Se apunta en cada jugador de mi equipo (eq: 1 o 2),
// así viaja con el ejercicio y con deshacer, igual que el formato de ficha.
function ejKitSync() {
    var mios = ejP.players.filter(function (p) { return p.team !== 'tarea' && !ejEsRival(p); });
    var ref = mios.find(function (p) { return p.eq; });
    if (ref) ejP.miKit = ref.eq;
    mios.forEach(function (p) { if (!p.eq) p.eq = ejP.miKit === 2 ? 2 : 1; });
}
function ejJugKit() {
    ejSaveHistory();
    ejP.miKit = ejP.miKit === 2 ? 1 : 2;
    ejP.players.forEach(function (p) { if (p.team !== 'tarea' && !ejEsRival(p)) p.eq = ejP.miKit; });
    ejSaveHistory();
    ejRenderSVG();
    ejRenderToolbar();
}
function ejIrEquipacion() {
    ejCfgCerrar();
    var tab = document.querySelector('.main-tab.config');
    if (tab) tab.click();
    var sub = document.querySelector('#modulo-config .sub-tab[onclick*="equipacion"]');
    if (sub) sub.click();
}
// Barras que acompañan a la pizarra: jugadores arriba, hueco del panel y opciones del objeto
function ejBarrasSync() {
    ejRenderJugBar();
    ejPanelHueco();
    ejObjBar();
    if (ejP._jugModalPend && ejP._plantilla && ejP._plantilla.length && !!ejP._plantillaEsRival === !!ejP._addingRival) { ejP._jugModalPend = false; ejJugModalAbrir(); }
}
window.addEventListener('resize', function () { ejPanelHueco(); ejObjBar(); });

// =====================================================================
// PIZARRA · VÍDEO DE LA ANIMACIÓN
// El MP4 se fabrica en el navegador imagen a imagen (cada una en su instante
// exacto), sin grabar la pantalla y sin pasar por el servidor. Se puede
// descargar sin tener el ejercicio guardado.
// Usa js/tlc-video.min.js (Mediabunny), que solo se carga al exportar.
// =====================================================================
var EJ_VIDEO_FORMATOS = {
    horizontal: { w: 1920, h: 1080, n: 'Horizontal', d: '1920 × 1080 · para proyectar o mandar por WhatsApp' },
    vertical:   { w: 1080, h: 1920, n: 'Vertical', d: '1080 × 1920 · para historias y reels' }
};
// El vídeo de la ficha lleva la proporción exacta del campo, sin franjas
var EJ_VIDEO_FICHA = { w: 1600, h: 1000, n: 'Ficha' };
var EJ_VIDEO_FPS = 30;
function ejVideoLib() {
    if (window.TLCVideo) return Promise.resolve(window.TLCVideo);
    if (ejP._videoLibProm) return ejP._videoLibProm;
    ejP._videoLibProm = new Promise(function (ok, mal) {
        var s = document.createElement('script');
        s.src = 'js/tlc-video.min.js';
        s.onload = function () { window.TLCVideo ? ok(window.TLCVideo) : mal(new Error('La librería de vídeo no se ha cargado bien')); };
        s.onerror = function () { ejP._videoLibProm = null; mal(new Error('No se ha podido cargar js/tlc-video.min.js')); };
        document.head.appendChild(s);
    });
    return ejP._videoLibProm;
}
function ejVideoCaja(html) {
    ejVideoCerrar();
    var m = document.createElement('div');
    m.id = 'ej-video-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;padding:12px';
    m.innerHTML = '<div style="background:#111a2b;border:1px solid #2f405c;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);width:460px;max-width:100%;max-height:96vh;overflow:auto;padding:18px 20px;color:#e2e8f0;font-family:system-ui,sans-serif">' + html + '</div>';
    document.body.appendChild(m);
    return m;
}
function ejVideoCerrar() {
    var m = document.getElementById('ej-video-modal');
    if (m) m.remove();
    if (ejP._videoUrlLocal) { URL.revokeObjectURL(ejP._videoUrlLocal); ejP._videoUrlLocal = null; }
}
function ejVideoAbrir() {
    if (ejP._videoHaciendo || ejP._exportingVideo) return;
    if (!ejP.animMode || ejP.frames.length < 2) { ejToast('Para sacar un vídeo hacen falta al menos 2 fotogramas.', 'warning'); return; }
    var tarjetas = Object.keys(EJ_VIDEO_FORMATOS).map(function (k) {
        var f = EJ_VIDEO_FORMATOS[k], vert = f.h > f.w;
        return '<button type="button" onclick="ejVideoExportar(\'' + k + '\')" style="display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:#0b1220;border:1px solid #2f405c;border-radius:10px;padding:12px 14px;color:#e2e8f0;cursor:pointer;margin-top:8px">'
            + '<span style="flex:none;display:block;width:' + (vert ? 20 : 34) + 'px;height:' + (vert ? 34 : 20) + 'px;border:2px solid #93c5fd;border-radius:4px;margin:0 ' + (vert ? 7 : 0) + 'px"></span>'
            + '<span><b style="display:block;font-size:14px">' + f.n + '</b><span style="font-size:12px;color:#94a3b8">' + f.d + '</span></span></button>';
    }).join('');
    ejVideoCaja('<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">Descargar vídeo</b>'
        + '<button type="button" onclick="ejVideoCerrar()" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<div style="font-size:12px;color:#94a3b8;margin-top:4px">' + ejP.frames.length + ' fotogramas. No hace falta guardar el ejercicio.</div>' + tarjetas);
}
// Coloca fichas y material en un punto de la animación: t va de 0 (primer fotograma) a 1 (último).
// Mismo movimiento que la reproducción: arranca y frena suave, y entre medias va a velocidad constante.
function ejAnimPosicionar(t) {
    var totalSegs = ejP.frames.length - 1, zona = 0.15, s, l;
    t = Math.max(0, Math.min(1, t));
    if (t < zona) { l = t / zona; s = zona * (l * l * (3 - 2 * l)); }
    else if (t > 1 - zona) { l = (t - (1 - zona)) / zona; s = (1 - zona) + zona * (l * l * (3 - 2 * l)); }
    else s = t;
    var pos = s * totalSegs, seg = Math.min(Math.floor(pos), totalSegs - 1), frac = pos - seg;
    var fA = ejP.frames[seg], fB = ejP.frames[seg + 1], i;
    for (i = 0; i < fA.players.length; i++) ejInterpolateElem(fA.players[i].id, fA, fB, frac, seg, 'player');
    for (i = 0; i < fA.equipment.length; i++) ejInterpolateElem(fA.equipment[i].id, fA, fB, frac, seg, 'equipment');
    ejP.currentFrame = seg;
    ejAnimGiros();
}
function ejVideoNombre() {
    var lbl = document.getElementById('ej-pizarra-nombre-label');
    var n = (lbl && lbl.textContent && lbl.textContent !== 'Pizarra libre') ? lbl.textContent : 'animacion';
    n = n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return (n || 'animacion') + '.mp4';
}
function ejVideoCancelar() { ejP._videoCancelar = true; }
// Crea el MP4 y lo devuelve (o null si se cancela). Deja la pizarra como estaba.
async function ejVideoCrear(f, alAvanzar) {
    var estado = null, salida = null, blob = null;
    try {
        var M = await ejVideoLib();
        if (typeof VideoEncoder === 'undefined' || !(await M.canEncodeVideo('avc', { width: f.w, height: f.h }))) {
            throw new Error('Este navegador no puede crear el vídeo. Prueba con Chrome o Edge actualizados.');
        }
        if (ejP.isPlaying) ejFrameStop();
        ejFrameSaveCurrent();
        await ejPrecargarFotosJugadores();
        estado = { frame: ejP.currentFrame, sel: ejP.selectedId, tipo: ejP.selectedType, multi: ejP.multiSel, exp: ejP._exporting };
        ejP.selectedId = null; ejP.multiSel = []; ejP._exporting = true; ejP._animDom = null; ejP._giros = null;

        var svg = document.getElementById('ej-svg');
        var lienzo = document.createElement('canvas');
        lienzo.width = f.w; lienzo.height = f.h;
        var ctx = lienzo.getContext('2d');
        var fondo = ejFondoColor(); if (fondo === 'grid') fondo = '#fbfcfe';
        // El campo entra entero, centrado, sin deformarse
        var esc = Math.min(f.w / ejP.svgW, f.h / ejP.svgH);
        var dw = Math.round(ejP.svgW * esc), dh = Math.round(ejP.svgH * esc), dx = Math.round((f.w - dw) / 2), dy = Math.round((f.h - dh) / 2);
        var pintar = async function () {
            ejRenderSVG();
            var copia = svg.cloneNode(true);
            copia.setAttribute('width', dw); copia.setAttribute('height', dh);
            copia.removeAttribute('style');
            var img = new Image();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copia));
            await img.decode();
            ctx.fillStyle = fondo; ctx.fillRect(0, 0, f.w, f.h);
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        salida = new M.Output({ format: new M.Mp4OutputFormat(), target: new M.BufferTarget() });
        var fuente = new M.CanvasSource(lienzo, { codec: 'avc', bitrate: 8e6 });
        salida.addVideoTrack(fuente, { frameRate: EJ_VIDEO_FPS });
        // Pista de sonido, si está activado y el navegador sabe codificarla (AAC, que suena en todas partes; si no, Opus)
        var fuenteAudio = null, golpes = [], segSonido = -1;
        if (ejSonidoActivo() && M.canEncodeAudio && typeof OfflineAudioContext !== 'undefined') {
            var codecAudio = (await M.canEncodeAudio('aac')) ? 'aac' : ((await M.canEncodeAudio('opus')) ? 'opus' : null);
            if (codecAudio) { fuenteAudio = new M.AudioBufferSource({ codec: codecAudio, bitrate: 128e3 }); salida.addAudioTrack(fuenteAudio); }
        }
        await salida.start();

        // Medio segundo quieto al principio, el movimiento, y casi un segundo quieto al final
        var segs = ejP.frames.length - 1;
        var nIni = Math.round(0.5 * EJ_VIDEO_FPS), nFin = Math.round(0.8 * EJ_VIDEO_FPS);
        var nMov = Math.max(2, Math.round(segs * (ejP.playSpeed * 1.2 / 1000) * EJ_VIDEO_FPS));
        var total = nIni + nMov + nFin;
        for (var i = 0; i < total; i++) {
            if (ejP._videoCancelar) break;
            var quieto = (i > 0 && i < nIni) || i > nIni + nMov;      // misma imagen que la anterior: no hace falta repintar
            if (!quieto) { ejAnimPosicionar(i < nIni ? 0 : Math.min(1, (i - nIni) / nMov)); await pintar(); }
            if (fuenteAudio && i >= nIni && i <= nIni + nMov && ejP.currentFrame !== segSonido) {
                segSonido = ejP.currentFrame;
                if (ejAnimGolpeEn(segSonido)) golpes.push(i / EJ_VIDEO_FPS);
            }
            await fuente.add(i / EJ_VIDEO_FPS, 1 / EJ_VIDEO_FPS);
            if (alAvanzar && (i % 3 === 0 || i === total - 1)) alAvanzar(Math.round((i + 1) / total * 100));
        }
        if (fuenteAudio && !ejP._videoCancelar) {
            var off = new OfflineAudioContext(2, Math.ceil(total / EJ_VIDEO_FPS * 48000), 48000);
            golpes.forEach(function (t) { ejSonidoGolpe(off, t); });
            await fuenteAudio.add(await off.startRendering());
        }
        if (ejP._videoCancelar) { await salida.cancel(); }
        else { await salida.finalize(); blob = new Blob([salida.target.buffer], { type: 'video/mp4' }); }
    } catch (e) {
        try { if (salida && salida.state !== 'finalized' && salida.state !== 'canceled') await salida.cancel(); } catch (e2) {}
        throw e;
    } finally {
        // La pizarra vuelve a como estaba
        ejP._giros = null;
        if (estado) {
            ejP._exporting = estado.exp || false;
            ejP.currentFrame = Math.min(estado.frame, ejP.frames.length - 1);
            ejFrameRestore(ejP.frames[ejP.currentFrame]);
            ejP.selectedId = estado.sel; ejP.selectedType = estado.tipo; ejP.multiSel = estado.multi || [];
            ejRenderSVG(); ejRenderTimeline();
        }
    }
    return blob;
}
async function ejVideoExportar(formato) {
    var f = EJ_VIDEO_FORMATOS[formato];
    if (!f || ejP._videoHaciendo || ejP._exportingVideo) return;
    if (!ejP.animMode || ejP.frames.length < 2) { ejVideoCerrar(); return; }
    ejP._videoHaciendo = true; ejP._videoCancelar = false;
    ejVideoCaja('<b style="font-size:16px">Creando el vídeo…</b>'
        + '<div style="height:10px;background:#0b1220;border:1px solid #2f405c;border-radius:6px;margin-top:14px;overflow:hidden"><div id="ej-video-barra" style="height:100%;width:0%;background:#22c55e;transition:width .15s linear"></div></div>'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px"><span id="ej-video-txt" style="font-size:12px;color:#94a3b8">Preparando…</span>'
        + '<button type="button" onclick="ejVideoCancelar()" style="background:#0b1220;border:1px solid #2f405c;color:#e2e8f0;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px">Cancelar</button></div>');
    var blob = null, fallo = null;
    try {
        blob = await ejVideoCrear(f, function (pc) {
            var barra = document.getElementById('ej-video-barra'), txt = document.getElementById('ej-video-txt');
            if (barra) barra.style.width = pc + '%';
            if (txt) txt.textContent = pc + ' %';
        });
    } catch (e) { console.error('ejVideoExportar:', e); fallo = e; }
    ejP._videoHaciendo = false;
    if (fallo) {
        ejVideoCaja('<b style="font-size:16px">No se ha podido crear el vídeo</b><div style="font-size:13px;color:#fca5a5;margin-top:8px">' + ejEscXml(fallo.message || String(fallo)) + '</div>'
            + '<div style="text-align:right;margin-top:14px"><button type="button" onclick="ejVideoCerrar()" style="background:#0b1220;border:1px solid #2f405c;color:#e2e8f0;border-radius:8px;padding:7px 16px;cursor:pointer">Cerrar</button></div>');
        return;
    }
    if (!blob) { ejVideoCerrar(); ejToast('Vídeo cancelado.', 'info'); return; }
    var nombre = ejVideoNombre();
    ejVideoCaja('<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">Vídeo listo</b>'
        + '<button type="button" onclick="ejVideoCerrar()" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<video id="ej-video-previa" controls autoplay loop muted playsinline style="display:block;width:100%;max-height:56vh;background:#000;border-radius:8px;margin-top:10px"></video>'
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px"><span style="font-size:12px;color:#94a3b8">' + f.n + ' · ' + (blob.size / 1048576).toFixed(1) + ' MB</span>'
        + '<a id="ej-video-bajar" download="' + nombre + '" style="background:#22c55e;color:#04210f;font-weight:700;border-radius:8px;padding:8px 18px;text-decoration:none;font-size:14px"><i class="ej-ico ej-ico-descargar"></i> Descargar</a></div>');
    ejP._videoUrlLocal = URL.createObjectURL(blob);
    document.getElementById('ej-video-previa').src = ejP._videoUrlLocal;
    var a = document.getElementById('ej-video-bajar');
    a.href = ejP._videoUrlLocal;
    a.click();
}
