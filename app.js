/**
 * Saddle Position Comparer — app.js
 * Geometry engine + Canvas renderer
 *
 * World coordinate system:
 *   Origin = Bottom Bracket center
 *   X+ = forward (right in side view)
 *   Y+ = upward
 * Canvas maps world→screen with Y-flip.
 */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const DEG = Math.PI / 180;
const COLOR_A = '#4FC3F7';
const COLOR_B = '#FFB74D';
const COLOR_GRID = 'rgba(255,255,255,0.04)';
const COLOR_BB   = 'rgba(255,255,255,0.25)';

// ─── Translations ────────────────────────────────────────────────────────────
const translations = {
  en: {
    app_title: "Saddle Position Comparer",
    app_subtitle: "Bike fit visualizer with skeletal leg simulation",
    set_a: "Set A",
    set_b: "Set B",
    pos_a: "Position A",
    pos_b: "Position B",
    group_saddle: "Saddle Geometry",
    group_position: "Position",
    group_rider: "Rider & Crank",
    label_saddle_length: "Saddle Length",
    label_ref_nose: "Ref from Nose",
    label_ischial_back: "Ischial Ref from Back",
    label_extension: "Extension",
    label_setback: "Setback",
    label_femur: "Femur Length",
    label_tibia: "Tibia Length",
    label_crank: "Crank Length",
    label_foot_length: "Foot Length",
    label_contact_tip: "Pedal Contact from Tip",
    label_heel_angle: "Heel Lift Angle",
    btn_update: "Update Diagram",
    btn_reset: "Reset Defaults",
    legend_title: "Legend",
    legend_femur_tibia: "Femur / Tibia",
    legend_extension_ref: "Extension ref",
    legend_foot: "Foot",
    canvas_hint: "Adjust inputs and click <strong>Update Diagram</strong> · Scroll to zoom · Drag to pan",
    warn_same_pos: "Hip and ankle are at the same position.",
    warn_overextended: "Over-extended: hip→ankle distance {dist} mm exceeds femur+tibia {sum} mm. Try raising the saddle or increasing leg lengths.",
    warn_compressed: "Too compressed: hip→ankle distance {dist} mm is less than |femur-tibia| {diff} mm.",
    canvas_ext: "ext",
    canvas_sb: "sb",
    canvas_knee: "knee",
    canvas_bb: "BB",
    ext_diff: "Ext Difference",
    height_diff: "Height Difference",
    setback_diff: "Setback Difference"
  },
  es: {
    app_title: "Comparador de Sillín",
    app_subtitle: "Visualizador de ajuste de bicicleta con simulación de pierna",
    set_a: "Conjunto A",
    set_b: "Conjunto B",
    pos_a: "Posición A",
    pos_b: "Posición B",
    group_saddle: "Geometría del Sillín",
    group_position: "Posición",
    group_rider: "Ciclista y Biela",
    label_saddle_length: "Longitud del Sillín",
    label_ref_nose: "Ref desde la Punta",
    label_ischial_back: "Ref Isquiática desde Atrás",
    label_extension: "Extensión",
    label_setback: "Retroceso",
    label_femur: "Longitud del Fémur",
    label_tibia: "Longitud de la Tibia",
    label_crank: "Longitud de la Biela",
    label_foot_length: "Longitud del Pie",
    label_contact_tip: "Contacto Pedal desde Punta",
    label_heel_angle: "Ángulo de Elevación del Talón",
    btn_update: "Actualizar Diagrama",
    btn_reset: "Restablecer Valores",
    legend_title: "Leyenda",
    legend_femur_tibia: "Fémur / Tibia",
    legend_extension_ref: "Ref Extensión",
    legend_foot: "Pie",
    canvas_hint: "Ajusta los valores y haz clic en <strong>Actualizar Diagrama</strong> · Scroll para zoom · Arrastra para pan",
    warn_same_pos: "La cadera y el tobillo están en la misma posición.",
    warn_overextended: "Sobre-extendido: distancia cadera→tobillo {dist} mm excede fémur+tibia {sum} mm. Intenta subir el sillín o aumentar la longitud de la pierna.",
    warn_compressed: "Demasiado comprimido: distancia cadera→tobillo {dist} mm es menor que |fémur-tibia| {diff} mm.",
    canvas_ext: "ext",
    canvas_sb: "ret",
    canvas_knee: "rodilla",
    canvas_bb: "BB",
    ext_diff: "Diferencia Ext.",
    height_diff: "Diferencia Altura",
    setback_diff: "Diferencia Retroceso"
  }
};

let currentLang = 'en';

function t(key, params = {}) {
  let str = translations[currentLang][key] || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

function updateLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key);
  });

  document.querySelectorAll('[data-i18n-val]').forEach(el => {
    const key = el.getAttribute('data-i18n-val');
    if (el.value === t(key, {}, lang === 'en' ? 'es' : 'en') || el.value === 'Position A' || el.value === 'Position B' || el.value === 'Posición A' || el.value === 'Posición B') {
       el.value = t(key);
    }
  });

  render(true);
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  a_saddleLength: 260,
  a_refFromNose: 70,
  a_ischialFromBack: 70,
  a_extension: 670,
  a_setback: 160,
  a_femur: 400,
  a_tibia: 440,
  a_crank: 170,
  a_footLength: 275,
  a_contactFromTip: 75,
  a_heelAngle: 20,

  b_saddleLength: 260,
  b_refFromNose: 70,
  b_ischialFromBack: 70,
  b_extension: 670,
  b_setback: 140,
  b_femur: 400,
  b_tibia: 440,
  b_crank: 170,
  b_footLength: 275,
  b_contactFromTip: 75,
  b_heelAngle: 15,
};

// ─── Geometry ────────────────────────────────────────────────────────────────
/**
 * Compute all world-space points for one set of parameters.
 * @param {Object} p - parameter object
 * @returns {Object} - named world-space points + optional warning string
 */
function computeGeometry(p) {
  const { saddleLength, refFromNose, ischialFromBack,
    extension, setback, femur, tibia, crank, footLength, contactFromTip, heelAngle } = p;

  // Bottom Bracket — world origin
  const bb = { x: 0, y: 0 };

  // Crank at 5 o'clock (150° clockwise from 12 = 60° below forward horizontal)
  // World (Y-up): 5-o'clock vector = (sin150°, -cos150°) = (0.5, 0.866) then Y negative for below
  // Angle from positive-X axis, clockwise = -60° in standard math
  const crankAngleMath = -60 * DEG;        // 5 o'clock below the forward-horizontal
  const pedalX = bb.x + crank * Math.cos(crankAngleMath);
  const pedalY = bb.y + crank * Math.sin(crankAngleMath);
  const pedal = { x: pedalX, y: pedalY };

  // Saddle reference point (80-mm width measurement point)
  //   setback is horizontal distance BEHIND BB  → negative X
  //   extension is vertical height ABOVE BB     → positive Y
  const saddleRef = { x: -setback, y: extension };

  // Saddle line: nose is refFromNose mm FORWARD of ref; back is the remainder rearward
  const nose = { x: saddleRef.x + refFromNose,                     y: saddleRef.y };
  const back = { x: saddleRef.x - (saddleLength - refFromNose),    y: saddleRef.y };

  // Ischial point — ischialFromBack mm measured from the back toward the nose
  const ischial = { x: back.x + ischialFromBack, y: saddleRef.y };

  // Hip joint = ischial contact point on saddle surface
  const hip = { x: ischial.x, y: ischial.y };

  // Ball of foot = pedal axle location
  const ball = { x: pedal.x, y: pedal.y };

  // Ankle: heel raised at heelAngle degrees above horizontal from ball
  //   ankle is behind and above the ball
  const heelRad = heelAngle * DEG;
  const ballToAnkle = footLength * 0.40; // anatomical ratio: ~40% of foot length
  const ankle = {
    x: ball.x - ballToAnkle * Math.cos(heelRad),
    y: ball.y + ballToAnkle * Math.sin(heelRad),
  };

  // Heel stub (visual only, 30% of foot length behind ankle)
  const heelToAnkle = footLength * 0.30;
  const heel = {
    x: ankle.x - heelToAnkle * Math.cos(heelRad),
    y: ankle.y + heelToAnkle * Math.sin(heelRad),
  };

  // Toe tip: contactFromTip mm forward of the ball along the foot direction
  const toe = {
    x: ball.x + contactFromTip * Math.cos(heelRad),
    y: ball.y - contactFromTip * Math.sin(heelRad),
  };

  // ── Knee via two-circle intersection ──────────────────────────────────────
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const dist = Math.hypot(dx, dy);

  let knee = null;
  let warning = null;

  if (dist < 1e-6) {
    warning = t('warn_same_pos');
    knee = { x: hip.x + femur, y: hip.y };
  } else if (dist > femur + tibia) {
    warning = t('warn_overextended', { dist: dist.toFixed(0), sum: (femur + tibia).toFixed(0) });
    // Place knee along hip→ankle direction at femur length (fully extended)
    const u = { x: dx / dist, y: dy / dist };
    knee = { x: hip.x + femur * u.x, y: hip.y + femur * u.y };
  } else if (dist < Math.abs(femur - tibia)) {
    warning = t('warn_compressed', { dist: dist.toFixed(0), diff: Math.abs(femur - tibia).toFixed(0) });
    const u = { x: dx / dist, y: dy / dist };
    knee = { x: hip.x + femur * u.x, y: hip.y + femur * u.y };
  } else {
    // Law of cosines — angle at hip between hip→ankle and hip→knee
    const cosAlpha = (femur * femur + dist * dist - tibia * tibia) / (2 * femur * dist);
    const alpha = Math.acos(Math.min(1, Math.max(-1, cosAlpha)));

    // Unit vector hip → ankle
    const ux = dx / dist;
    const uy = dy / dist;

    // Counter-clockwise perpendicular puts knee on the FORWARD (right) side:
    //   perp_CCW = (-uy, ux)
    //   With hip upper-left and ankle lower-right: ux>0, uy<0
    //   perp_CCW = (−(−|uy|), ux) = (+, +) → forward & upward ✓
    const px = -uy;
    const py =  ux;

    knee = {
      x: hip.x + femur * Math.cos(alpha) * ux + femur * Math.sin(alpha) * px,
      y: hip.y + femur * Math.cos(alpha) * uy + femur * Math.sin(alpha) * py,
    };
  }

  // Knee angle for info display (angle at the knee joint)
  let kneeAngleDeg = null;
  if (knee) {
    const v1 = { x: hip.x - knee.x,   y: hip.y - knee.y   }; // knee→hip
    const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y }; // knee→ankle
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
    if (mag > 0) kneeAngleDeg = Math.acos(Math.min(1, Math.max(-1, dot / mag))) / DEG;
  }

  return { bb, pedal, saddleRef, nose, back, ischial, hip, ankle, heel, toe, ball, knee, warning, kneeAngleDeg };
}

// ─── Canvas & Pan/Zoom state ─────────────────────────────────────────────────
const canvas = document.getElementById('diagramCanvas');
const ctx = canvas.getContext('2d');

let viewScale  = 0.8;   // px per mm
let viewOrigin = { x: 0, y: 0 }; // canvas pixel offset for world (0,0)
let isPanning  = false;
let panStart   = { x: 0, y: 0 };

// ─── Coordinate helpers ───────────────────────────────────────────────────────
/** World → Canvas */
function w2c(wx, wy) {
  return {
    x: viewOrigin.x + wx * viewScale,
    y: viewOrigin.y - wy * viewScale,   // Y-flip
  };
}

function drawCircle(cx, cy, r, fillColor, strokeColor, lineWidth) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (fillColor)  { ctx.fillStyle = fillColor;   ctx.fill(); }
  if (strokeColor){ ctx.strokeStyle = strokeColor; ctx.lineWidth = lineWidth || 1.5; ctx.stroke(); }
}

function drawLine(x1, y1, x2, y2, color, width, dash) {
  ctx.beginPath();
  ctx.setLineDash(dash || []);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Auto-fit ────────────────────────────────────────────────────────────────
function autoFit(geoA, geoB) {
  const pts = [];
  for (const g of [geoA, geoB]) {
    if (!g) continue;
    for (const k of ['bb','pedal','saddleRef','nose','back','ischial','hip','ankle','heel','toe','ball','knee']) {
      if (g[k]) pts.push(g[k]);
    }
  }
  if (pts.length === 0) return;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Use CSS pixel dimensions for fitting
  const W = canvasW || canvas.width;
  const H = canvasH || canvas.height;
  const PAD = 80; // px
  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const scaleX = (W - PAD * 2) / worldW;
  const scaleY = (H - PAD * 2) / worldH;
  viewScale = Math.min(scaleX, scaleY, 1.4);

  // Center the bounding box on the canvas (CSS pixel space)
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  viewOrigin.x = W / 2 - cx * viewScale;
  viewOrigin.y = H / 2 + cy * viewScale;
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function drawGrid() {
  // Dynamic grid interval based on zoom
  const mmPerCell = viewScale > 0.6 ? 50 : 100;
  const cellPx = mmPerCell * viewScale;

  const startX = Math.floor((-viewOrigin.x / viewScale) / mmPerCell) * mmPerCell;
  const startY = Math.floor((( viewOrigin.y - canvas.height) / viewScale) / mmPerCell) * mmPerCell;

  ctx.setLineDash([]);
  ctx.strokeStyle = COLOR_GRID;
  ctx.lineWidth = 0.5;

  for (let wx = startX; wx < startX + canvas.width  / viewScale + mmPerCell; wx += mmPerCell) {
    const cx2 = viewOrigin.x + wx * viewScale;
    ctx.beginPath(); ctx.moveTo(cx2, 0); ctx.lineTo(cx2, canvas.height); ctx.stroke();
  }
  for (let wy = startY; wy < startY + canvas.height / viewScale + mmPerCell; wy += mmPerCell) {
    const cy2 = viewOrigin.y - wy * viewScale;
    ctx.beginPath(); ctx.moveTo(0, cy2); ctx.lineTo(canvas.width, cy2); ctx.stroke();
  }

  // Axes through BB
  const bbC = w2c(0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, bbC.y); ctx.lineTo(canvas.width, bbC.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bbC.x, 0); ctx.lineTo(bbC.x, canvas.height); ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Draw one geometry set ───────────────────────────────────────────────────
function drawSet(geo, color, label) {
  if (!geo) return;

  const alpha60  = color + '99';   // ~60% opacity
  const alpha35  = color + '59';   // ~35%
  const alpha20  = color + '33';   // ~20%

  // Helper: world point → canvas coords (destructured)
  const C = (pt) => w2c(pt.x, pt.y);

  // ── Reference lines (dashed) ─────────────────────────────────────────────
  // BB → Saddle Reference Point (shows extension + setback relationship)
  const cBB  = C(geo.bb);
  const cRef = C(geo.saddleRef);
  drawLine(cBB.x, cBB.y, cRef.x, cRef.y, alpha35, 1.5, [8, 5]);

  // Vertical extension line (BB → point directly below saddleRef)
  const cExtBase = w2c(geo.saddleRef.x, 0);
  drawLine(cExtBase.x, cBB.y, cExtBase.x, cRef.y, alpha20, 1, [4, 4]);

  // Horizontal setback line (BB ← saddleRef x)
  drawLine(cBB.x, cBB.y, cExtBase.x, cBB.y, alpha20, 1, [4, 4]);

  // ── Crank arm ────────────────────────────────────────────────────────────
  const cPedal = C(geo.pedal);
  drawLine(cBB.x, cBB.y, cPedal.x, cPedal.y, color, 3);

  // Pedal platform (small rect perpendicular to crank)
  {
    const crankAngle = Math.atan2(cBB.y - cPedal.y, cBB.x - cPedal.x);
    const perpAngle  = crankAngle + Math.PI / 2;
    const hw = 14; // half-width in px
    ctx.beginPath();
    ctx.moveTo(cPedal.x + hw * Math.cos(perpAngle), cPedal.y + hw * Math.sin(perpAngle));
    ctx.lineTo(cPedal.x - hw * Math.cos(perpAngle), cPedal.y - hw * Math.sin(perpAngle));
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  // ── Saddle ───────────────────────────────────────────────────────────────
  const cNose   = C(geo.nose);
  const cBack   = C(geo.back);
  const cIsch   = C(geo.ischial);

  drawLine(cNose.x, cNose.y, cBack.x, cBack.y, color, 4);

  // Saddle nose tick
  ctx.beginPath();
  ctx.moveTo(cNose.x, cNose.y - 6);
  ctx.lineTo(cNose.x, cNose.y + 6);
  ctx.strokeStyle = alpha60;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Saddle reference point diamond
  const cSRef = C(geo.saddleRef);
  const d = 5;
  ctx.beginPath();
  ctx.moveTo(cSRef.x,     cSRef.y - d);
  ctx.lineTo(cSRef.x + d, cSRef.y);
  ctx.lineTo(cSRef.x,     cSRef.y + d);
  ctx.lineTo(cSRef.x - d, cSRef.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Ischial reference point
  drawCircle(cIsch.x, cIsch.y, 5, alpha60, color, 1.5);

  // ── Leg ──────────────────────────────────────────────────────────────────
  const cHip   = C(geo.hip);
  const cKnee  = C(geo.knee);
  const cAnkle = C(geo.ankle);
  const cBall  = C(geo.ball);
  const cHeel  = C(geo.heel);
  const cToe   = C(geo.toe);

  // Hip marker (circle on saddle)
  drawCircle(cHip.x, cHip.y, 7, 'rgba(0,0,0,0.4)', color, 2);

  // Femur
  drawLine(cHip.x, cHip.y, cKnee.x, cKnee.y, color, 2.5);

  // Tibia
  drawLine(cKnee.x, cKnee.y, cAnkle.x, cAnkle.y, color, 2.5);

  // Foot: heel ── ankle ── ball ── toe
  drawLine(cHeel.x, cHeel.y, cAnkle.x, cAnkle.y, alpha60, 2);
  drawLine(cAnkle.x, cAnkle.y, cBall.x, cBall.y, color, 2.5);
  drawLine(cBall.x, cBall.y, cToe.x, cToe.y, alpha60, 2);

  // Joint circles
  drawCircle(cKnee.x,  cKnee.y,  5, 'rgba(0,0,0,0.5)', color, 2);
  drawCircle(cAnkle.x, cAnkle.y, 4, 'rgba(0,0,0,0.5)', color, 2);
  drawCircle(cBall.x,  cBall.y,  3, color, null, 0);

  // ── Measurements label (small info near saddle ref) ───────────────────────
  ctx.font = '500 10px Inter, sans-serif';
  ctx.fillStyle = alpha60;
  const labelX = cRef.x + 8;
  const labelY = cRef.y - 6;
  ctx.fillText(`${label}: ${t('canvas_ext')} ${geo.saddleRef.y.toFixed(0)}mm  ${t('canvas_sb')} ${(-geo.saddleRef.x).toFixed(0)}mm`, labelX, labelY);
  if (geo.kneeAngleDeg !== null) {
    ctx.fillText(`${t('canvas_knee')} ${geo.kneeAngleDeg.toFixed(1)}°`, cKnee.x + 7, cKnee.y + 4);
  }
}

// ─── BB + global markers ─────────────────────────────────────────────────────
function drawBB() {
  const cBB = w2c(0, 0);
  // Cross-hair
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(cBB.x - 14, cBB.y); ctx.lineTo(cBB.x + 14, cBB.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cBB.x, cBB.y - 14); ctx.lineTo(cBB.x, cBB.y + 14); ctx.stroke();
  ctx.setLineDash([]);
  // Outer ring
  drawCircle(cBB.x, cBB.y, 10, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.4)', 1.5);
  // Inner dot
  drawCircle(cBB.x, cBB.y, 3, 'rgba(255,255,255,0.8)', null, 0);
  // Label
  ctx.font = '500 10px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(t('canvas_bb'), cBB.x + 13, cBB.y + 4);
}

// ─── Main render ─────────────────────────────────────────────────────────────
let geoA = null, geoB = null;
const visibility = { a: true, b: true };

function readParams(prefix) {
  const g = (id) => parseFloat(document.getElementById(`${prefix}_${id}`).value) || 0;
  return {
    saddleLength:    g('saddleLength'),
    refFromNose:     g('refFromNose'),
    ischialFromBack: g('ischialFromBack'),
    extension:       g('extension'),
    setback:         g('setback'),
    femur:           g('femur'),
    tibia:           g('tibia'),
    crank:           g('crank'),
    footLength:      g('footLength'),
    contactFromTip:  g('contactFromTip'),
    heelAngle:       g('heelAngle'),
  };
}

// Track current CSS pixel dimensions
let canvasW = 0, canvasH = 0;

function resizeCanvas() {
  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const pw   = Math.round(rect.width  * dpr);
  const ph   = Math.round(rect.height * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width  = pw;
    canvas.height = ph;
    canvasW = rect.width;
    canvasH = rect.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale once, permanently
    return true;
  }
  canvasW = rect.width;
  canvasH = rect.height;
  return false;
}

function render(skipFit) {
  const didResize = resizeCanvas();
  const W = canvasW;
  const H = canvasH;

  // Compute geometries
  geoA = computeGeometry(readParams('a'));
  geoB = computeGeometry(readParams('b'));

  // Auto-fit on first render, explicit draw, or after resize
  if (!skipFit || didResize) autoFit(geoA, geoB);

  // ── Clear ─────────────────────────────────────────────────────────────────
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#080d1a');
  bgGrad.addColorStop(1, '#0a1020');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Grid
  drawGrid();

  // Sets (draw B first so A is on top where they overlap)
  const labelB = document.getElementById('labelB').value || 'B';
  const labelA = document.getElementById('labelA').value || 'A';
  if (visibility.b) drawSet(geoB, COLOR_B, labelB);
  if (visibility.a) drawSet(geoA, COLOR_A, labelA);

  // BB marker always on top
  drawBB();

  // Warnings
  const warnBox = document.getElementById('warningBox');
  const warnings = [];
  if (geoA && geoA.warning) warnings.push(`Set A: ${geoA.warning}`);
  if (geoB && geoB.warning) warnings.push(`Set B: ${geoB.warning}`);
  if (warnings.length > 0) {
    warnBox.classList.remove('hidden');
    warnBox.innerHTML = warnings.map(w => `⚠ ${w}`).join('<br>');
  } else {
    warnBox.classList.add('hidden');
  }

  updateSummary();
}

function updateSummary() {
  if (!geoA || !geoB) return;

  const hA = geoA.saddleRef.y;
  const sA = -geoA.saddleRef.x;
  const dA = Math.hypot(hA, sA);

  const hB = geoB.saddleRef.y;
  const sB = -geoB.saddleRef.x;
  const dB = Math.hypot(hB, sB);

  const format = (val) => {
    const v = Math.round(val);
    const sign = v > 0 ? '+' : (v < 0 ? '' : ''); // - sign is already in string if negative
    return `${sign}${v} mm`;
  };

  document.getElementById('diffExt').textContent     = format(dB - dA);
  document.getElementById('diffHeight').textContent  = format(hB - hA);
  document.getElementById('diffSetback').textContent = format(sB - sA);
}

// ─── Resize observer ─────────────────────────────────────────────────────────
const resizeObserver = new ResizeObserver(() => render(true));
resizeObserver.observe(canvas);

// ─── Pan & Zoom ──────────────────────────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  isPanning = true;
  panStart = { x: e.clientX - viewOrigin.x, y: e.clientY - viewOrigin.y };
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  viewOrigin.x = e.clientX - panStart.x;
  viewOrigin.y = e.clientY - panStart.y;
  render(true);
});

window.addEventListener('mouseup', () => { isPanning = false; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  // Zoom toward cursor
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // World coords under cursor before zoom
  const wx = (mx - viewOrigin.x) / viewScale;
  const wy = (viewOrigin.y - my) / viewScale;
  viewScale *= factor;
  viewScale  = Math.min(Math.max(viewScale, 0.1), 5);
  // Adjust origin so world point under cursor stays fixed
  viewOrigin.x = mx - wx * viewScale;
  viewOrigin.y = my + wy * viewScale;
  render(true);
}, { passive: false });

// Touch pan/zoom (mobile)
let lastTouches = [];
canvas.addEventListener('touchstart', (e) => { lastTouches = [...e.touches]; });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && lastTouches.length === 1) {
    const dx = e.touches[0].clientX - lastTouches[0].clientX;
    const dy = e.touches[0].clientY - lastTouches[0].clientY;
    viewOrigin.x += dx;
    viewOrigin.y += dy;
  } else if (e.touches.length === 2 && lastTouches.length === 2) {
    const d1 = Math.hypot(lastTouches[0].clientX - lastTouches[1].clientX, lastTouches[0].clientY - lastTouches[1].clientY);
    const d2 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (d1 > 0) { viewScale *= d2 / d1; viewScale = Math.min(Math.max(viewScale, 0.1), 5); }
  }
  lastTouches = [...e.touches];
  render(true);
}, { passive: false });

// ─── Button handlers ─────────────────────────────────────────────────────────
document.getElementById('btnDraw').addEventListener('click', () => render(false));

document.getElementById('btnReset').addEventListener('click', () => {
  for (const [key, val] of Object.entries(DEFAULTS)) {
    const el = document.getElementById(key);
    if (el) el.value = val;
  }
  document.getElementById('labelA').value = t('pos_a');
  document.getElementById('labelB').value = t('pos_b');
  render(false);
});

// Live preview on input change (debounced)
let liveTimer = null;
document.querySelectorAll('input[type="number"]').forEach(inp => {
  inp.addEventListener('input', () => {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => render(false), 350);
  });
});

// ─── Collapsible set cards ────────────────────────────────────────────────────
function setupToggle(headerId, bodyId, chevronId) {
  const header  = document.getElementById(headerId);
  const body    = document.getElementById(bodyId);
  if (!header || !body) return;
  header.addEventListener('click', () => {
    const expanded = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('collapsed', expanded);
  });
}
setupToggle('headerA', 'bodyA', 'chevronA');
setupToggle('headerB', 'bodyB', 'chevronB');

// ─── Visibility toggles ───────────────────────────────────────────────────────
function setupVisToggle(btnId, cardId, key) {
  const btn  = document.getElementById(btnId);
  const card = document.getElementById(cardId);
  if (!btn || !card) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    visibility[key] = !visibility[key];
    card.classList.toggle('set-hidden', !visibility[key]);
    btn.setAttribute('aria-label', visibility[key] ? `Hide Set ${key.toUpperCase()}` : `Show Set ${key.toUpperCase()}`);
    render(true); // redraw without re-fitting
  });
}
setupVisToggle('visToggleA', 'setCardA', 'a');
setupVisToggle('visToggleB', 'setCardB', 'b');

// ─── Initial render ───────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage;
  const defaultLang = browserLang.startsWith('es') ? 'es' : 'en';
  
  const langSelector = document.getElementById('langSelector');
  langSelector.value = defaultLang;
  langSelector.addEventListener('change', (e) => updateLanguage(e.target.value));
  
  updateLanguage(defaultLang);
  render(false);
});
