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
    setback_diff: "Setback Difference",
    label_pedal_pos: "Pedal Pos",
    btn_reset_pedal: "Reset",
    tip_saddle_length: "The overall saddle length measured from the tip to the back",
    tip_ref_nose: "The distance from the tip of the saddle to where the saddle measures 80mm in width",
    tip_ischial_back: "The distance from the back of the saddle to where the ischial tuberosities rest, typically the part at which the saddle is widest.",
    tip_extension: "Distance from center of bottom bracket to the top of the saddle at the reference point where the saddle measures 80mm wide.",
    tip_setback: "The horizontal distance between the vertical planes of the bottom bracket and the reference point of the saddle where it measures 80mm wide",
    tip_femur: "Femur bone length from the hip to the lateral epicondyle of the femur (the tuberosity felt to the outer side of the knee at the patella height)",
    tip_tibia: "Tibia bone length measured from the end point of the femur measurement to the outer ankle bone.",
    tip_crank: "Length of the crank (refer to product specification or measure from pedal spindle to center of bottom bracket)",
    tip_foot_length: "Length of your foot, from the tip to the back of your ankle.",
    tip_contact_tip: "Distance from the tip of your foot to the point where it connects to the pedal spindle",
    tip_heel_angle: "Angle of your heel measured from the horizontal plane at the pedal spindle height when the pedal is at the 5 o'clock position."
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
    setback_diff: "Diferencia Retroceso",
    label_pedal_pos: "Pos. Pedal",
    btn_reset_pedal: "Reiniciar",
    tip_saddle_length: "Longitud total del sillín medida desde la punta hasta la parte trasera",
    tip_ref_nose: "La distancia desde la punta del sillín hasta donde el sillín mide 80 mm de ancho",
    tip_ischial_back: "La distancia desde la parte trasera del sillín hasta donde descansan las tuberosidades isquiáticas, típicamente la parte más ancha.",
    tip_extension: "Distancia desde el centro del eje de pedalier hasta la parte superior del sillín en el punto de referencia de 80 mm de ancho.",
    tip_setback: "La distancia horizontal entre los planos verticales del eje de pedalier y el punto de referencia del sillín de 80 mm de ancho",
    tip_femur: "Longitud del fémur desde la cadera hasta el epicóndilo lateral del fémur (el bulto al lado exterior de la rodilla)",
    tip_tibia: "Longitud de la tibia medida desde el punto final del fémur hasta el hueso exterior del tobillo.",
    tip_crank: "Longitud de la biela (ver especificaciones o medir desde el eje del pedal hasta el centro del eje de pedalier)",
    tip_foot_length: "Longitud del pie, desde la punta hasta la parte posterior del tobillo.",
    tip_contact_tip: "Distancia desde la punta del pie hasta el punto de conexión con el eje del pedal",
    tip_heel_angle: "Ángulo del talón medido desde el plano horizontal a la altura del pedal cuando está en la posición de las 5 en punto."
  }
};

let globalCrankAngleMath = -60 * (Math.PI / 180); // Default: 5 o'clock
let lastAnimTime = 0;

function getHeelMultiplier(clock) {
  let c = clock;
  if (c === 12) c = 0;
  if (c >= 0 && c < 3) return 0.8 - 0.8 * (c / 3.0);
  if (c >= 3 && c <= 5) return (c - 3) / 2.0;
  if (c > 5 && c <= 6) return 1.0 + 0.2 * (c - 5);
  if (c > 6 && c <= 9) return 1.2 - 0.7 * ((c - 6) / 3.0);
  if (c > 9 && c < 12) return 0.5 + 0.3 * ((c - 9) / 3.0);
  return 1.0;
}

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

  const pedalX = bb.x + crank * Math.cos(globalCrankAngleMath);
  const pedalY = bb.y + crank * Math.sin(globalCrankAngleMath);
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

  // Ankle: heel raised based on dynamic heel lift angle
  let clockPos = 3 - (globalCrankAngleMath / DEG) / 30;
  clockPos = ((clockPos % 12) + 12) % 12;
  if (clockPos === 0) clockPos = 12;
  const mult = getHeelMultiplier(clockPos);
  const adjustedHeelAngle = heelAngle * mult;
  const heelRad = adjustedHeelAngle * DEG;
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

  return { bb, pedal, saddleRef, nose, back, ischial, hip, ankle, heel, toe, ball, knee, warning, kneeAngleDeg, heelRad };
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

  // Pedal platform (matches heel angle)
  {
    const canvasAngle = -geo.heelRad;
    const hw = 14; // half-width in px
    ctx.beginPath();
    ctx.moveTo(cPedal.x + hw * Math.cos(canvasAngle), cPedal.y + hw * Math.sin(canvasAngle));
    ctx.lineTo(cPedal.x - hw * Math.cos(canvasAngle), cPedal.y - hw * Math.sin(canvasAngle));
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

// ─── Tooltip logic ────────────────────────────────────────────────────────────
const tooltipIllustrations = {
  saddle_length: `<svg viewBox="0 0 100 50"><path d="M 20 15 C 40 15, 60 22, 90 23 A 4 2 0 0 1 90 27 C 60 28, 40 35, 20 35 C 10 35, 10 15, 20 15 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 12 42 L 92 42 M 12 39 L 12 45 M 92 39 L 92 45" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  ref_nose: `<svg viewBox="0 0 100 50"><path d="M 20 15 C 40 15, 60 22, 90 23 A 4 2 0 0 1 90 27 C 60 28, 40 35, 20 35 C 10 35, 10 15, 20 15 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 60 22 L 60 32" stroke="#7986a3" stroke-width="1" stroke-dasharray="2 2"/><path d="M 60 42 L 92 42 M 60 39 L 60 45 M 92 39 L 92 45" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  ischial_back: `<svg viewBox="0 0 100 50"><path d="M 20 15 C 40 15, 60 22, 90 23 A 4 2 0 0 1 90 27 C 60 28, 40 35, 20 35 C 10 35, 10 15, 20 15 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><circle cx="28" cy="20" r="2.5" fill="#4FC3F7"/><circle cx="28" cy="30" r="2.5" fill="#4FC3F7"/><path d="M 12 42 L 28 42 M 12 39 L 12 45 M 28 39 L 28 45" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  extension: `<svg viewBox="0 0 100 100"><circle cx="70" cy="80" r="4" stroke="#7986a3" fill="none" stroke-width="1.5"/><path d="M 15 20 C 25 20, 45 22, 65 24 C 65 26, 55 28, 45 28 C 30 28, 20 32, 15 28 C 10 24, 10 20, 15 20 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 70 80 L 45 22" stroke="#4FC3F7" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="45" cy="22" r="2.5" fill="#4FC3F7"/></svg>`,
  setback: `<svg viewBox="0 0 100 100"><circle cx="70" cy="80" r="4" stroke="#7986a3" fill="none" stroke-width="1.5"/><path d="M 15 20 C 25 20, 45 22, 65 24 C 65 26, 55 28, 45 28 C 30 28, 20 32, 15 28 C 10 24, 10 20, 15 20 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 70 80 L 70 10 M 45 30 L 45 10" stroke="#7986a3" stroke-width="1" stroke-dasharray="2 2"/><path d="M 70 15 L 45 15 M 70 12 L 70 18 M 45 12 L 45 18" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  femur: `<svg viewBox="0 0 60 100"><path d="M 40 5 C 50 5, 55 15, 50 20" fill="none" stroke="#4a5568" stroke-width="1"/><path d="M 25 20 C 25 10, 45 10, 45 20 C 45 25, 35 30, 35 40 L 35 70 C 35 80, 45 85, 45 90 C 45 100, 15 100, 15 90 C 15 85, 25 80, 25 70 L 25 40 C 25 30, 15 25, 25 20 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><circle cx="35" cy="15" r="2.5" fill="#4FC3F7"/><circle cx="15" cy="90" r="2.5" fill="#4FC3F7"/><path d="M 35 15 L 15 90" stroke="#4FC3F7" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`,
  tibia: `<svg viewBox="0 0 60 100"><path d="M 15 10 C 15 20, 45 20, 45 10" fill="none" stroke="#4a5568" stroke-width="1"/><path d="M 15 20 C 15 10, 45 10, 45 20 C 45 30, 35 35, 35 45 L 35 75 C 35 85, 40 90, 40 95 C 40 105, 10 105, 10 95 C 10 90, 25 85, 25 75 L 25 45 C 25 35, 15 30, 15 20 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><circle cx="15" cy="20" r="2.5" fill="#4FC3F7"/><circle cx="10" cy="95" r="2.5" fill="#4FC3F7"/><path d="M 15 20 L 10 95" stroke="#4FC3F7" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`,
  crank: `<svg viewBox="0 0 100 60"><circle cx="30" cy="25" r="8" stroke="#7986a3" fill="none" stroke-width="1.5"/><path d="M 30 25 L 70 25" stroke="#7986a3" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="25" r="3" fill="#4FC3F7"/><circle cx="30" cy="25" r="2" fill="#4FC3F7"/><path d="M 30 40 L 70 40 M 30 37 L 30 43 M 70 37 L 70 43" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  foot_length: `<svg viewBox="0 0 100 60"><path d="M 30 10 L 30 30 C 20 35, 15 45, 25 50 L 70 50 C 85 50, 90 45, 85 40 C 75 35, 55 30, 45 25 L 45 10 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 18 55 L 88 55 M 18 52 L 18 58 M 88 52 L 88 58" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  contact_tip: `<svg viewBox="0 0 100 60"><path d="M 30 10 L 30 30 C 20 35, 15 45, 25 50 L 70 50 C 85 50, 90 45, 85 40 C 75 35, 55 30, 45 25 L 45 10 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><circle cx="60" cy="50" r="2.5" fill="#4FC3F7"/><path d="M 60 55 L 88 55 M 60 52 L 60 58 M 88 52 L 88 58" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  heel_angle: `<svg viewBox="0 0 100 80"><path d="M 10 60 L 90 60" stroke="#7986a3" stroke-dasharray="2 2" stroke-width="1"/><g transform="rotate(20 60 60)"><path d="M 30 20 L 30 40 C 20 45, 15 55, 25 60 L 70 60 C 85 60, 90 55, 85 50 C 75 45, 55 40, 45 35 L 45 20 Z" fill="none" stroke="#7986a3" stroke-width="1.5"/><path d="M 60 60 L 25 60" stroke="#4FC3F7" stroke-width="1.5"/></g><circle cx="60" cy="60" r="2.5" fill="#4FC3F7"/><path d="M 40 60 A 20 20 0 0 1 41.2 53.1" fill="none" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
};

function initTooltips() {
  const tooltipEl = document.getElementById('tooltip');
  const tooltipIllustration = document.getElementById('tooltipIllustration');
  const tooltipText = document.getElementById('tooltipText');

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const key = el.getAttribute('data-tooltip');
      const text = t(`tip_${key}`);
      const illustration = tooltipIllustrations[key] || '';

      tooltipText.innerText = text;
      tooltipIllustration.innerHTML = illustration;
      tooltipEl.classList.remove('hidden');
      tooltipEl.style.display = 'flex';

      const rect = el.getBoundingClientRect();
      tooltipEl.style.left = (rect.left + rect.width / 2 - 120) + 'px';
      tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + 'px';
    });

    el.addEventListener('mouseleave', () => {
      tooltipEl.classList.add('hidden');
      tooltipEl.style.display = 'none';
    });
  });
}

// ─── Initial render ───────────────────────────────────────────────────────────

function updateAnimation(timestamp) {
  if (!lastAnimTime) lastAnimTime = timestamp;
  const dt = timestamp - lastAnimTime;
  lastAnimTime = timestamp;

  const modWheel = document.getElementById('modWheel');
  const wheelVal = parseFloat(modWheel.value);

  if (wheelVal !== 0) {
    const maxSpeedRad = -0.45 * DEG; 
    const speed = (wheelVal / 100) * maxSpeedRad;
    globalCrankAngleMath += speed * dt;
    
    globalCrankAngleMath = globalCrankAngleMath % (2 * Math.PI);
    
    let clock = 3 - (globalCrankAngleMath / DEG) / 30;
    clock = ((clock % 12) + 12) % 12;
    if (clock === 0) clock = 12;
    document.getElementById('clockPos').value = Math.round(clock);

    render(true);
  }
  
  requestAnimationFrame(updateAnimation);
}

window.addEventListener('load', () => {
  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage;
  const defaultLang = browserLang.startsWith('es') ? 'es' : 'en';
  
  const langSelector = document.getElementById('langSelector');
  langSelector.value = defaultLang;
  langSelector.addEventListener('change', (e) => updateLanguage(e.target.value));
  
  updateLanguage(defaultLang);
  initTooltips();
  
  // Setup Animation Event Listeners
  const resetModWheel = () => {
    document.getElementById('modWheel').value = 0;
  };
  const modWheelEl = document.getElementById('modWheel');
  modWheelEl.addEventListener('mouseup', resetModWheel);
  modWheelEl.addEventListener('mouseleave', resetModWheel);
  modWheelEl.addEventListener('touchend', resetModWheel);

  const clockPosEl = document.getElementById('clockPos');
  clockPosEl.addEventListener('input', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1 || val > 12) return;
    globalCrankAngleMath = -(val - 3) * 30 * DEG;
    render(true);
  });

  document.getElementById('btnResetPedal').addEventListener('click', () => {
    globalCrankAngleMath = -60 * DEG; // 5 o'clock
    clockPosEl.value = '5';
    resetModWheel();
    render(true);
  });

  requestAnimationFrame(updateAnimation);
  render(false);
});
