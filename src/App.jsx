import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Upload, Download, Share2, RefreshCw, Camera, Sparkles, Check, X as CloseIcon, ZoomIn } from "lucide-react";

/* ============================================================
   HH GOA 2026 — FRAME / BUILDER ID GENERATOR
   ============================================================ */

const COLORS = {
  green: "#1B6B4A",       // wordmark / foliage green
  darkGreen: "#0A3D2A",   // deep pine — borders, ink text
  ink: "#1C1206",
  cream: "#F7ECC9",       // parchment card background
  creamDim: "#ECDCA8",    // secondary panels / dot texture
  sand: "#D8B366",        // hairline dividers, road, dashed trims
  yellow: "#F3B430",      // warm Goa-sun gold
  terracotta: "#D6491F",  // scooter / roof-tile / coral accent
  pink: "#D6491F",        // alias kept so existing --pink CSS vars read as coral/terracotta
  white: "#FFFFFF",
};

const TITLES = [
  "THE BEACH HACKER", "GOA CODE NOMAD", "SUNSET BUILDER", "COASTAL ARCHITECT",
  "PALM TREE PROTOCOL", "THE COCONUT COMPILER", "BEACH BYTE BANDIT", "GOA STACK WIZARD",
  "DEBUGGING IN PARADISE", "SUNSET SYSTEMS ENGINEER", "TROPICAL TERMINAL", "THE GOA DEBUGGER",
  "BEACH MODE DEVELOPER", "COASTAL CODE MONK", "PALM TREE PROGRAMMER", "SUNSET SHIPPER",
  "GOA GIT PUSHER", "COCONUT CYBERPUNK", "THE WAVE RUNNER", "PARADISE PROTOCOL",
  "BEACH BUILD ENGINEER", "SUNSET DEV", "TROPICAL TECHNOMANCER", "GOA API ARCHITECT",
  "COASTAL CODE CRAFTER", "THE BEACH DEPLOYER", "PALM STACK ENGINEER", "GOA MACHINE BUILDER",
  "SUNSET SOFTWARE SMITH", "HACKING IN PARADISE",
];

const EXAMPLES = [
  { initials: "AK", role: "BUILDER", badge: "\uD83E\uDDE9", title: "TROPICAL TECHNOMANCER", rot: -4, leaf: "\uD83C\uDF34" },
  { initials: "RS", role: "SECRET WEAPON", badge: "\uD83E\uDD65", title: "THE GOA DEBUGGER", rot: 3, leaf: "\uD83C\uDF3B" },
  { initials: "MP", role: "404 \u2014 NOT FOUND!", badge: "\uD83D\uDD0D", title: "SUNSET SHIPPER", rot: -2, leaf: "\uD83C\uDF43" },
  { initials: "TN", role: "JACK OF ALL TRADES", badge: "\uD83C\uDFAF", title: "COASTAL CODE CRAFTER", rot: 4, leaf: "\uD83C\uDF3F" },
];

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap";

/* ---------------- canvas drawing helpers ---------------- */

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPalm(ctx, x, y, scale, color, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -scale : scale, scale);
  ctx.fillStyle = color;
  // trunk
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.quadraticCurveTo(10, -60, 4, -120);
  ctx.lineTo(-4, -120);
  ctx.quadraticCurveTo(-2, -60, -14, 0);
  ctx.closePath();
  ctx.fill();
  // leaves
  const leaves = [
    [-4, -120, -90, -170, -150, -150],
    [-4, -120, -60, -190, -60, -230],
    [-4, -120, 10, -195, 40, -230],
    [-4, -120, 60, -165, 130, -140],
    [-4, -120, -20, -175, -80, -195],
    [-4, -120, 30, -178, 90, -175],
  ];
  leaves.forEach(([sx, sy, cx, cy, ex, ey]) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();
  });
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color, rayColor, rays = 12) {
  ctx.save();
  ctx.strokeStyle = rayColor;
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = "round";
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const r1 = r * 1.35;
    const r2 = r * (i % 2 === 0 ? 1.9 : 1.65);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawWaveStrip(ctx, x, y, w, h, color, phase = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  const waves = 5;
  for (let i = 0; i <= waves; i++) {
    const px = x + (w / waves) * i;
    const py = y + Math.sin(i + phase) * (h * 0.35) + h * 0.4;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function coverFitRect(imgW, imgH, dstW, dstH, zoom, fx, fy) {
  const baseScale = Math.max(dstW / imgW, dstH / imgH);
  const scale = baseScale * zoom;
  let sw = dstW / scale;
  let sh = dstH / scale;
  let sx = imgW * fx - sw / 2;
  let sy = imgH * fy - sh / 2;
  sx = Math.max(0, Math.min(imgW - sw, sx));
  sy = Math.max(0, Math.min(imgH - sh, sy));
  return { sx, sy, sw, sh };
}

function fitFontSize(ctx, text, maxWidth, family, weight, maxPx, minPx) {
  let size = maxPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minPx) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function hashStr(str) {
  let h = 0;
  const s = str || "guest";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function builderIdNumber(seed) {
  const h = hashStr(seed);
  return "HHG-" + (1000 + (h % 9000));
}

function drawBarcode(ctx, x, y, w, h, seed) {
  let h32 = hashStr(seed) || 1;
  const rand = () => { h32 = (h32 * 1103515245 + 12345) >>> 0; return (h32 % 1000) / 1000; };
  let cx = x;
  ctx.save();
  while (cx < x + w) {
    const bw = 1 + rand() * (w * 0.012);
    if (rand() > 0.42) {
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(cx, y, bw, h);
    }
    cx += bw + rand() * (w * 0.006);
  }
  ctx.restore();
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load("400 80px Anton"),
      document.fonts.load("700 40px 'Space Mono'"),
      document.fonts.load("800 40px Inter"),
    ]);
  } catch (e) {
    /* fonts may already be loaded / unavailable, continue anyway */
  }
}

/* ---------------- main render pipeline ---------------- */

function textOnArcAngle(ctx, str, radius) {
  return ctx.measureText(str).width / radius;
}

function drawArcText(ctx, str, cx, cy, radius, startAngle, clockwise, font, color, spacing = 0) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(cx, cy);
  ctx.rotate(startAngle);
  const dir = clockwise ? 1 : -1;
  let total = 0;
  for (const ch of str) total += textOnArcAngle(ctx, ch, radius) + spacing / radius;
  ctx.rotate((-total / 2) * dir);
  for (const ch of str) {
    const a = textOnArcAngle(ctx, ch, radius) + spacing / radius;
    ctx.rotate((a / 2) * dir);
    ctx.save();
    ctx.translate(0, -radius);
    if (!clockwise) ctx.rotate(Math.PI);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    ctx.rotate((a / 2) * dir);
  }
  ctx.restore();
}

function drawDashedCircle(ctx, cx, cy, r, color, width, dash) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSticker(ctx, cx, cy, text, rotationDeg, bg, fg, fontPx) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.font = `700 ${fontPx}px 'Space Mono', monospace`;
  const tw = ctx.measureText(text).width;
  const padX = fontPx * 0.7, padY = fontPx * 0.55;
  const w = tw + padX * 2, h = fontPx + padY * 1.3;
  ctx.shadowColor = "rgba(4,51,35,0.35)";
  ctx.shadowBlur = fontPx * 0.4;
  ctx.shadowOffsetY = fontPx * 0.12;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = fontPx * 0.06;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, fontPx * 0.04);
  ctx.restore();
}

function drawStamp(ctx, cx, cy, size, rotationDeg) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.shadowColor = "rgba(4,51,35,0.3)";
  ctx.shadowBlur = size * 0.1;
  roundRectPath(ctx, -size / 2, -size / 2, size, size, size * 0.08);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, -size / 2, -size / 2, size, size, size * 0.08);
  ctx.clip();
  ctx.fillStyle = "rgba(11,107,58,0.14)";
  ctx.fillRect(-size / 2, size * 0.08, size, size * 0.1);
  ctx.fillRect(-size / 2, size * 0.24, size, size * 0.06);
  ctx.restore();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size * 0.22}px sans-serif`;
  ctx.fillText("\uD83C\uDF34", 0, -size * 0.06);
  ctx.fillStyle = COLORS.darkGreen;
  ctx.font = `700 ${size * 0.11}px 'Space Mono', monospace`;
  ctx.fillText("GOA", 0, size * 0.36);
  ctx.font = `700 ${size * 0.075}px 'Space Mono', monospace`;
  ctx.fillText("INDIA", 0, size * 0.47);
  roundRectPath(ctx, -size / 2, -size / 2, size, size, size * 0.08);
  ctx.setLineDash([size * 0.045, size * 0.04]);
  ctx.lineWidth = size * 0.035;
  ctx.strokeStyle = COLORS.pink;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawHillBand(ctx, x, y, w, amp, color, floorY) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + w * 0.25, y - amp, x + w * 0.5, y);
  ctx.quadraticCurveTo(x + w * 0.75, y + amp, x + w, y);
  ctx.lineTo(x + w, floorY);
  ctx.lineTo(x, floorY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawArchBuilding(ctx, cx, baseY, w, h, colorWall, colorRoof, colorLine) {
  ctx.save();
  ctx.translate(cx, baseY);
  ctx.fillStyle = colorWall;
  ctx.fillRect(-w / 2, -h, w, h);
  // roof gable
  ctx.beginPath();
  ctx.moveTo(-w / 2 - w * 0.06, -h);
  ctx.lineTo(0, -h - h * 0.3);
  ctx.lineTo(w / 2 + w * 0.06, -h);
  ctx.closePath();
  ctx.fillStyle = colorRoof;
  ctx.fill();
  // side pinnacles
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(s * (w / 2), -h);
    ctx.lineTo(s * (w / 2), -h - h * 0.16);
    ctx.lineTo(s * (w / 2 - w * 0.055), -h - h * 0.16);
    ctx.closePath();
    ctx.fillStyle = colorRoof;
    ctx.fill();
  });
  // cross finial
  ctx.strokeStyle = colorLine;
  ctx.lineWidth = Math.max(1.4, w * 0.014);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -h - h * 0.3);
  ctx.lineTo(0, -h - h * 0.46);
  ctx.moveTo(-w * 0.035, -h - h * 0.4);
  ctx.lineTo(w * 0.035, -h - h * 0.4);
  ctx.stroke();
  // central arch doorway
  const aw = w * 0.3, ah = h * 0.56;
  ctx.beginPath();
  ctx.moveTo(-aw / 2, 0);
  ctx.lineTo(-aw / 2, -ah * 0.55);
  ctx.arc(0, -ah * 0.55, aw / 2, Math.PI, 0);
  ctx.lineTo(aw / 2, 0);
  ctx.closePath();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = colorLine;
  ctx.fill();
  ctx.globalAlpha = 1;
  // little arched facade windows
  ctx.strokeStyle = colorLine;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = Math.max(1, w * 0.01);
  [-0.32, 0.32].forEach((fx) => {
    ctx.beginPath();
    ctx.arc(fx * w, -h * 0.74, w * 0.05, Math.PI, 0);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawScooter(ctx, cx, cy, scale, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath(); ctx.arc(-18, 11, 7.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(21, 11, 7.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, 11);
  ctx.quadraticCurveTo(-11, -5, 3, -3);
  ctx.quadraticCurveTo(15, -2, 21, 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, -3);
  ctx.lineTo(-3, -15);
  ctx.moveTo(-9, -15); ctx.lineTo(2, -15);
  ctx.moveTo(7, -3); ctx.lineTo(11, -17);
  ctx.moveTo(7, -17); ctx.lineTo(15, -17);
  ctx.stroke();
  ctx.restore();
}

function drawBirdV(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.75, x, y);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.75, x + size, y);
  ctx.stroke();
  ctx.restore();
}

function drawSurfboard(ctx, cx, cy, angleDeg, len, color, stripeColor) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  const w = len * 0.22;
  roundRectPath(ctx, -w / 2, -len / 2, w, len, w / 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(10,61,42,0.25)";
  ctx.lineWidth = len * 0.012;
  ctx.stroke();
  ctx.fillStyle = stripeColor;
  ctx.fillRect(-w / 2, -len * 0.08, w, len * 0.1);
  ctx.restore();
}

function drawFlatPill(ctx, cx, cy, text, bg, fg, fontPx, outline) {
  ctx.save();
  ctx.font = `700 ${fontPx}px 'Space Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width;
  const padX = fontPx * 0.95, padY = fontPx * 0.6;
  const w = tw + padX * 2, h = fontPx + padY * 1.5;
  const x = cx - w / 2, y = cy - h / 2;
  roundRectPath(ctx, x, y, w, h, h / 2);
  if (outline) {
    ctx.fillStyle = COLORS.cream;
    ctx.fill();
    ctx.strokeStyle = bg;
    ctx.lineWidth = fontPx * 0.1;
    ctx.stroke();
    ctx.fillStyle = bg;
  } else {
    ctx.shadowColor = "rgba(10,61,42,0.3)";
    ctx.shadowBlur = fontPx * 0.4;
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = fg;
  }
  ctx.fillText(text, cx, cy + fontPx * 0.05);
  ctx.restore();
  return h;
}

function drawRoundIconBadge(ctx, cx, cy, r, emoji, label, bg, fg, rotDeg = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.shadowColor = "rgba(10,61,42,0.4)";
  ctx.shadowBlur = r * 0.4;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = COLORS.cream;
  ctx.lineWidth = r * 0.16;
  ctx.stroke();
  ctx.font = `${r * 1.05}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 0, r * 0.02);
  ctx.restore();
  if (label) {
    drawFlatPill(ctx, cx, cy + r * 1.2, label, COLORS.darkGreen, fg || COLORS.darkGreen, r * 0.5, true);
  }
}

function drawDashedLine(ctx, x, y, w, color, lineW = 2, dash = [7, 7]) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawClockIcon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.42, cy + r * 0.16);
  ctx.stroke();
  ctx.restore();
}

function drawCornerRivet(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = r * 0.6;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fill();
  ctx.restore();
}

function drawTapePiece(ctx, cx, cy, w, h, rotDeg, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(10,61,42,0.28)";
  ctx.lineWidth = Math.max(1, h * 0.07);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawCloud(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - s * 0.6, cy, s * 0.5, 0, Math.PI * 2);
  ctx.arc(cx, cy - s * 0.22, s * 0.6, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.65, cy, s * 0.45, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIconChip(ctx, cx, cy, r, emoji, label, ringColor, textColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cream;
  ctx.shadowColor = "rgba(10,61,42,0.25)";
  ctx.shadowBlur = r * 0.3;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = ringColor;
  ctx.setLineDash([r * 0.34, r * 0.26]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `${r * 1.05}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + r * 0.02);
  ctx.restore();
  if (label) {
    ctx.save();
    ctx.font = `700 ${r * 0.4}px 'Space Mono', monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + r * 1.6);
    ctx.restore();
  }
}

/* Shared Goa postcard scene — hills, arch building, road + scooter, palms,
   birds, clouds — drawn inside a bounding box behind the photo medallion. */
function drawGoaScene(ctx, x, y, w, h, seed = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const floor = y + h;
  drawHillBand(ctx, x, y + h * 0.42, w, h * 0.16, "rgba(214,73,31,0.14)", floor);
  drawHillBand(ctx, x, y + h * 0.52, w, h * 0.12, "rgba(27,107,74,0.22)", floor);
  drawHillBand(ctx, x, y + h * 0.62, w, h * 0.09, "rgba(27,107,74,0.34)", floor);

  // clouds
  drawCloud(ctx, x + w * 0.14, y + h * 0.12, w * 0.045, "rgba(247,236,201,0.8)");
  drawCloud(ctx, x + w * 0.62, y + h * 0.06, w * 0.036, "rgba(247,236,201,0.7)");

  // little sun
  drawSun(ctx, x + w * 0.82, y + h * 0.18, w * 0.045, "rgba(243,180,48,0.9)", "rgba(243,180,48,0.35)", 10);

  // birds — a small flock, staggered
  drawBirdV(ctx, x + w * 0.22, y + h * 0.14, w * 0.018, "rgba(10,61,42,0.35)");
  drawBirdV(ctx, x + w * 0.3, y + h * 0.22, w * 0.014, "rgba(10,61,42,0.28)");
  drawBirdV(ctx, x + w * 0.4, y + h * 0.11, w * 0.012, "rgba(10,61,42,0.24)");
  drawBirdV(ctx, x + w * 0.06, y + h * 0.3, w * 0.011, "rgba(10,61,42,0.22)");

  // small second cottage, offset, smaller scale
  drawArchBuilding(ctx, x + w * 0.2, y + h * 0.66, w * 0.13, h * 0.13, "rgba(247,236,201,0.75)", "rgba(27,107,74,0.5)", "rgba(10,61,42,0.45)");

  // main arch building, centered, sitting on the hill line
  drawArchBuilding(ctx, x + w * 0.5, y + h * 0.63, w * 0.24, h * 0.22, "rgba(247,236,201,0.9)", "rgba(214,73,31,0.55)", "rgba(10,61,42,0.55)");

  // road + scooter
  ctx.save();
  ctx.strokeStyle = "rgba(10,61,42,0.28)";
  ctx.lineWidth = w * 0.012;
  ctx.setLineDash([w * 0.02, w * 0.014]);
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.66, x + w, y + h * 0.74);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  drawScooter(ctx, x + w * (seed % 2 === 0 ? 0.72 : 0.26), y + h * 0.7, w * 0.0075, "rgba(214,73,31,0.7)");

  // palms flanking the scene
  ctx.save();
  ctx.globalAlpha = 0.6;
  drawPalm(ctx, x + w * 0.06, floor, w * 0.00075, "rgba(27,107,74,0.85)", false);
  drawPalm(ctx, x + w * 0.96, floor, w * 0.00065, "rgba(27,107,74,0.85)", true);
  ctx.restore();

  // thin beach-wave line along the very bottom of the scene box
  drawWaveStrip(ctx, x, y + h * 0.9, w, h * 0.12, "rgba(27,107,74,0.16)", 0.6);

  ctx.restore();
}

function renderPFP(ctx, W, H, img, crop, name) {
  ctx.clearRect(0, 0, W, H);

  // parchment background
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = COLORS.creamDim;
  for (let yy = 0; yy < H; yy += 30) {
    for (let xx = (yy / 30) % 2 === 0 ? 0 : 15; xx < W; xx += 30) {
      ctx.beginPath();
      ctx.arc(xx, yy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // postcard scene tucked behind the medallion
  drawGoaScene(ctx, W * 0.08, H * 0.06, W * 0.84, H * 0.62, 0);

  // outer torn-sticker border + corner rivets
  drawDashedLine(ctx, W * 0.04, H * 0.04, W * 0.92, "rgba(10,61,42,0.4)", W * 0.006, [W * 0.018, W * 0.012]);
  ctx.lineWidth = W * 0.028;
  ctx.strokeStyle = COLORS.darkGreen;
  ctx.strokeRect(W * 0.016, H * 0.016, W * 0.968, H * 0.968);
  ctx.lineWidth = W * 0.004;
  ctx.strokeStyle = "rgba(247,236,201,0.5)";
  ctx.strokeRect(W * 0.03, H * 0.03, W * 0.94, H * 0.94);
  [[0.03, 0.03], [0.97, 0.03], [0.03, 0.97], [0.97, 0.97]].forEach(([fx, fy]) => {
    drawCornerRivet(ctx, W * fx, H * fy, W * 0.011, COLORS.yellow);
  });

  // faint dashed "flight path" connecting the two top stickers
  ctx.save();
  ctx.strokeStyle = "rgba(10,61,42,0.25)";
  ctx.lineWidth = W * 0.003;
  ctx.setLineDash([W * 0.01, W * 0.012]);
  ctx.beginPath();
  ctx.moveTo(W * 0.135, H * 0.1);
  ctx.quadraticCurveTo(W * 0.5, H * 0.045, W * 0.855, H * 0.115);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // wordmark
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.green;
  ctx.font = `400 ${W * 0.075}px Anton, sans-serif`;
  ctx.fillText("HACKER HOUSE", W * 0.5, H * 0.11);
  ctx.fillStyle = COLORS.terracotta;
  ctx.font = `700 ${W * 0.02}px 'Space Mono', monospace`;
  ctx.fillText("\u2726  G O A  \u2022  2 0 2 6  \u2726", W * 0.5, H * 0.145);
  ctx.fillStyle = "rgba(10,61,42,0.55)";
  ctx.font = `700 ${W * 0.013}px 'Space Mono', monospace`;
  ctx.fillText("15.2993\u00b0N \u00b7 74.1240\u00b0E", W * 0.5, H * 0.168);
  ctx.restore();

  // ---- circular photo medallion ----
  const cx = W * 0.5, cy = H * 0.485;
  const rPhoto = W * 0.255;
  const ringW = W * 0.032;
  const rRing = rPhoto + ringW;

  ctx.beginPath();
  ctx.arc(cx, cy, rRing, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cream;
  ctx.shadowColor = "rgba(10,61,42,0.4)";
  ctx.shadowBlur = W * 0.03;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rPhoto, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const { sx, sy, sw, sh } = coverFitRect(img.naturalWidth, img.naturalHeight, rPhoto * 2, rPhoto * 2, crop.zoom, crop.fx, crop.fy);
    ctx.drawImage(img, sx, sy, sw, sh, cx - rPhoto, cy - rPhoto, rPhoto * 2, rPhoto * 2);
  } else {
    ctx.fillStyle = COLORS.creamDim;
    ctx.fillRect(cx - rPhoto, cy - rPhoto, rPhoto * 2, rPhoto * 2);
    ctx.fillStyle = COLORS.green;
    ctx.textAlign = "center";
    ctx.font = `700 ${W * 0.02}px 'Space Mono', monospace`;
    ctx.fillText("NO PHOTO YET", cx, cy);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, rPhoto, 0, Math.PI * 2);
  ctx.lineWidth = W * 0.012;
  ctx.strokeStyle = COLORS.green;
  ctx.stroke();
  drawDashedCircle(ctx, cx, cy, rRing + W * 0.006, COLORS.darkGreen, W * 0.005, [W * 0.014, W * 0.01]);

  // role/builder badge overlapping the medallion, bottom-left
  drawRoundIconBadge(ctx, cx - rPhoto * 0.72, cy + rPhoto * 0.72, W * 0.052, "\uD83C\uDF34", "BUILDER", COLORS.terracotta, COLORS.cream, -8);
  // small decorative accent badge, bottom-right (no label, just texture)
  drawRoundIconBadge(ctx, cx + rPhoto * 0.78, cy + rPhoto * 0.48, W * 0.032, "\uD83E\uDD65", null, COLORS.green, COLORS.cream, 10);

  // postage stamp, top-left
  drawStamp(ctx, W * 0.135, H * 0.1, W * 0.16, -7);

  // "LET'S BUILD!" sticker, top-right
  drawSticker(ctx, W * 0.855, H * 0.115, "LET'S BUILD! \u2728", 8, COLORS.terracotta, COLORS.cream, W * 0.022);

  // name + tagline pills
  let py = H * 0.79;
  if (name) {
    const h1 = drawFlatPill(ctx, W / 2, py, name.toUpperCase(), COLORS.darkGreen, COLORS.cream, Math.min(W * 0.042, fitFontSize(ctx, name.toUpperCase(), W * 0.8, "'Space Mono'", 700, W * 0.042, W * 0.022)));
    py += h1 * 0.5 + W * 0.045;
  }
  drawFlatPill(ctx, W / 2, py, "#FrameInGoa", COLORS.terracotta, COLORS.cream, W * 0.024);

  // footer — builder id + hosted-by strip, like the reference pass
  const fy = H * 0.945;
  drawDashedLine(ctx, W * 0.08, fy - H * 0.028, W * 0.84, "rgba(10,61,42,0.35)", W * 0.004, [W * 0.012, W * 0.01]);
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.darkGreen;
  ctx.font = `700 ${W * 0.017}px 'Space Mono', monospace`;
  ctx.fillText(`BUILDER ID \u2022 ${builderIdNumber(name || "guest")}`, W * 0.08, fy);
  ctx.textAlign = "right";
  ctx.fillText("\uD83D\uDCCD GOA, INDIA \u2022 28\u201331 OCT", W * 0.92, fy);
  ctx.restore();
}

function renderID(ctx, W, H, img, crop, fields) {
  const { name, stack, title } = fields;
  ctx.clearRect(0, 0, W, H);
  const idSeed = `${name}|${stack}|${title}`;

  // parchment background + dot texture
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = COLORS.creamDim;
  for (let yy = 0; yy < H; yy += 34) {
    for (let xx = (yy / 34) % 2 === 0 ? 0 : 17; xx < W; xx += 34) {
      ctx.beginPath();
      ctx.arc(xx, yy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // corner tape pieces — torn-paper pass feel
  drawTapePiece(ctx, W * 0.13, H * 0.018, W * 0.09, H * 0.017, -6, COLORS.sand);
  drawTapePiece(ctx, W * 0.87, H * 0.018, W * 0.09, H * 0.017, 5, COLORS.sand);
  drawTapePiece(ctx, W * 0.5, H * 0.007, W * 0.1, H * 0.015, -2, "rgba(214,73,31,0.35)");

  // tall side palms flanking the whole card
  ctx.save();
  ctx.globalAlpha = 0.9;
  drawPalm(ctx, W * 0.045, H * 1.01, 0.62, COLORS.green, false);
  drawPalm(ctx, W * 0.985, H * 1.01, 0.5, COLORS.green, true);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.35;
  drawSurfboard(ctx, W * 0.11, H * 0.62, -8, H * 0.16, COLORS.terracotta, COLORS.cream);
  drawSurfboard(ctx, W * 0.9, H * 0.6, 9, H * 0.14, COLORS.green, COLORS.cream);
  ctx.restore();

  // birds, top corners
  drawBirdV(ctx, W * 0.16, H * 0.045, W * 0.014, "rgba(10,61,42,0.4)");
  drawBirdV(ctx, W * 0.22, H * 0.07, W * 0.011, "rgba(10,61,42,0.3)");
  drawBirdV(ctx, W * 0.82, H * 0.06, W * 0.013, "rgba(10,61,42,0.4)");

  // wordmark header
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.green;
  ctx.font = `400 ${W * 0.07}px Anton, sans-serif`;
  ctx.fillText("HACKER HOUSE", W * 0.5, H * 0.05);
  ctx.fillStyle = COLORS.terracotta;
  ctx.font = `700 ${W * 0.019}px 'Space Mono', monospace`;
  ctx.fillText("\u2726  G O A  \u2022  2 0 2 6  \u2726", W * 0.5, H * 0.084);
  ctx.fillStyle = "rgba(10,61,42,0.55)";
  ctx.font = `700 ${W * 0.0105}px 'Space Mono', monospace`;
  ctx.fillText("15.2993\u00b0N \u00b7 74.1240\u00b0E \u00b7 OFFICIAL BUILDER PASS", W * 0.5, H * 0.1);
  ctx.restore();

  // hills + arch-building scene behind the photo medallion
  drawGoaScene(ctx, W * 0.14, H * 0.108, W * 0.72, H * 0.32, name ? name.length : 0);

  // ---- circular photo medallion ----
  const cx = W * 0.5, cy = H * 0.275;
  const rPhoto = W * 0.185;
  const ringW = W * 0.028;
  const rRing = rPhoto + ringW;

  ctx.beginPath();
  ctx.arc(cx, cy, rRing, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.cream;
  ctx.shadowColor = "rgba(10,61,42,0.4)";
  ctx.shadowBlur = W * 0.025;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rPhoto, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const { sx, sy, sw, sh } = coverFitRect(img.naturalWidth, img.naturalHeight, rPhoto * 2, rPhoto * 2, crop.zoom, crop.fx, crop.fy);
    ctx.drawImage(img, sx, sy, sw, sh, cx - rPhoto, cy - rPhoto, rPhoto * 2, rPhoto * 2);
  } else {
    ctx.fillStyle = COLORS.creamDim;
    ctx.fillRect(cx - rPhoto, cy - rPhoto, rPhoto * 2, rPhoto * 2);
    ctx.fillStyle = COLORS.green;
    ctx.textAlign = "center";
    ctx.font = `700 ${W * 0.017}px 'Space Mono', monospace`;
    ctx.fillText("NO PHOTO YET", cx, cy);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, rPhoto, 0, Math.PI * 2);
  ctx.lineWidth = W * 0.01;
  ctx.strokeStyle = COLORS.green;
  ctx.stroke();
  drawDashedCircle(ctx, cx, cy, rRing + W * 0.005, COLORS.darkGreen, W * 0.004, [W * 0.012, W * 0.008]);

  // role badge overlapping bottom-left of medallion
  const roleEmoji = ["\uD83E\uDDE9", "\uD83E\uDD65", "\uD83D\uDD0D", "\uD83C\uDFAF", "\uD83D\uDC1A"][hashStr(stack || "builder") % 5];
  drawRoundIconBadge(ctx, cx - rPhoto * 0.68, cy + rPhoto * 0.68, W * 0.034, roleEmoji, null, COLORS.terracotta, COLORS.cream, -8);
  drawRoundIconBadge(ctx, cx + rPhoto * 0.74, cy + rPhoto * 0.46, W * 0.022, "\u2600\uFE0F", null, COLORS.green, COLORS.cream, 12);

  // ---- pill stack: name / stack / title ----
  let py = cy + rPhoto + W * 0.09;
  ctx.save();
  ctx.textAlign = "center";

  const nameText = (name || "YOUR NAME").toUpperCase();
  ctx.font = `700 ${W * 0.03}px 'Space Mono', monospace`;
  const nameFont = fitFontSize(ctx, nameText, W * 0.78, "'Space Mono'", 700, W * 0.03, W * 0.02);
  const h1 = drawFlatPill(ctx, W / 2, py, nameText, COLORS.darkGreen, COLORS.cream, nameFont);
  py += h1 / 2 + W * 0.035;

  const stackText = (stack || "BUILDER").toUpperCase();
  const stackFont = fitFontSize(ctx, stackText, W * 0.7, "'Space Mono'", 700, W * 0.024, W * 0.016);
  const h2 = drawFlatPill(ctx, W / 2, py, stackText, COLORS.terracotta, COLORS.cream, stackFont);
  py += h2 / 2 + W * 0.032;

  const titleText = (title || "BUILDER").toUpperCase();
  const titleFont = fitFontSize(ctx, titleText, W * 0.72, "'Space Mono'", 700, W * 0.022, W * 0.015);
  drawFlatPill(ctx, W / 2, py, titleText, COLORS.green, COLORS.cream, titleFont, true);
  ctx.restore();

  py += W * 0.06;

  // dashed divider
  const lx = W * 0.09;
  drawDashedLine(ctx, lx, py, W - lx * 2, "rgba(10,61,42,0.3)", W * 0.004, [W * 0.014, W * 0.01]);
  py += H * 0.032;

  // footer: BUILDER ID left / HOSTED BY + time right
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.green;
  ctx.font = `700 ${W * 0.016}px 'Space Mono', monospace`;
  ctx.fillText("BUILDER ID \u2192", lx, py);
  ctx.fillStyle = COLORS.darkGreen;
  ctx.font = `400 ${W * 0.032}px Anton, sans-serif`;
  ctx.fillText(builderIdNumber(idSeed), lx, py + H * 0.032);

  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.green;
  ctx.font = `700 ${W * 0.016}px 'Space Mono', monospace`;
  ctx.fillText("HOSTED BY", W - lx, py);
  ctx.fillStyle = COLORS.darkGreen;
  ctx.font = `400 ${W * 0.028}px Anton, sans-serif`;
  ctx.fillText("28\u201331 OCT STUDIO", W - lx, py + H * 0.032);
  drawClockIcon(ctx, W - lx - W * 0.24, py + H * 0.024, W * 0.012, COLORS.terracotta);

  py += H * 0.065;

  // dashed divider before the icon row
  drawDashedLine(ctx, lx, py, W - lx * 2, "rgba(10,61,42,0.28)", W * 0.003, [W * 0.012, W * 0.009]);
  py += H * 0.028;

  // icon row — what builders came here to do
  const dockIcons = [
    { emoji: "\uD83D\uDEE0\uFE0F", label: "BUILD" },
    { emoji: "\uD83D\uDE80", label: "SHIP" },
    { emoji: "\uD83E\uDD1D", label: "CONNECT" },
    { emoji: "\uD83E\uDDED", label: "EXPLORE" },
  ];
  const iconR = W * 0.032;
  const iconY = py + iconR + H * 0.006;
  const usableW = W - lx * 2;
  dockIcons.forEach((ic, i) => {
    const ix = lx + (usableW * (i + 0.5)) / dockIcons.length;
    drawIconChip(ctx, ix, iconY, iconR, ic.emoji, ic.label, COLORS.green, COLORS.darkGreen);
  });
  py = iconY + iconR * 1.6 + H * 0.02;

  // tagline ribbon
  const tagH = drawFlatPill(ctx, W / 2, py, "BUILT DIFFERENT \u00b7 BUILT IN GOA", COLORS.terracotta, COLORS.cream, W * 0.017);
  py += tagH / 2 + H * 0.022;

  // decorative barcode strip — at the very end of the card
  drawBarcode(ctx, lx, py, W - lx * 2, H * 0.022, idSeed);
  py += H * 0.04;

  // waves + tagline footer
  drawWaveStrip(ctx, 0, H * 0.955, W, H * 0.045, "rgba(27,107,74,0.14)", 0);
  const fy = H * 0.982;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.darkGreen;
  ctx.font = `700 ${W * 0.017}px 'Space Mono', monospace`;
  ctx.fillText("GOA \u2022 INDIA", lx, fy);
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.terracotta;
  ctx.fillText("#FrameInGoa", W - lx, fy);

  // outer sticker cutline + border + corner rivets
  drawDashedLine(ctx, W * 0.024, H * 0.02, W * 0.952, "rgba(10,61,42,0.32)", W * 0.003, [W * 0.014, W * 0.01]);
  ctx.lineWidth = W * 0.009;
  ctx.strokeStyle = COLORS.green;
  ctx.strokeRect(W * 0.012, W * 0.012, W - W * 0.024, H - W * 0.024);
  [[0.026, 0.014], [0.974, 0.014], [0.026, 0.986], [0.974, 0.986]].forEach(([fx, fy2]) => {
    drawCornerRivet(ctx, W * fx, H * fy2, W * 0.009, COLORS.yellow);
  });
}

/* ---------------- UI subcomponents ---------------- */

function TropicalBackdrop() {
  return (
    <div className="hhg-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="hhg-bg-svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6B4A" />
            <stop offset="100%" stopColor="#0A3D2A" />
          </linearGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#skyGrad)" />
        <g className="hhg-sun">
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r1 = 150, r2 = i % 2 === 0 ? 230 : 200;
            return (
              <line
                key={i}
                x1={800 + Math.cos(a) * r1}
                y1={220 + Math.sin(a) * r1}
                x2={800 + Math.cos(a) * r2}
                y2={220 + Math.sin(a) * r2}
                stroke="#F3B430"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.65"
              />
            );
          })}
          <circle cx="800" cy="220" r="110" fill="#F3B430" />
        </g>
        <g opacity="0.5">
          <path d="M0,470 Q220,410 500,460 T1000,450 T1600,470" stroke="#D6491F" strokeWidth="6" fill="none" strokeDasharray="2 22" strokeLinecap="round" />
        </g>
        <path d="M0,500 Q400,450 800,500 T1600,500 V900 H0 Z" fill="#1F7A52" opacity="0.9" />
        <path d="M0,560 Q400,520 800,560 T1600,560 V900 H0 Z" fill="#0E7A44" opacity="0.9" />
        <path d="M0,620 Q400,580 800,620 T1600,620 V900 H0 Z" fill="#0A5E37" />

        {/* arch-building silhouette, centered on the hillside like a Goan chapel */}
        <g transform="translate(800,555)" opacity="0.9">
          <rect x="-95" y="-140" width="190" height="140" fill="#F7ECC9" opacity="0.92" />
          <path d="M-101,-140 L0,-210 L101,-140 Z" fill="#D6491F" opacity="0.85" />
          <path d="M-95,-140 L-95,-168 L-68,-168 Z" fill="#D6491F" opacity="0.85" />
          <path d="M95,-140 L95,-168 L68,-168 Z" fill="#D6491F" opacity="0.85" />
          <line x1="0" y1="-210" x2="0" y2="-244" stroke="#0A3D2A" strokeWidth="5" strokeLinecap="round" />
          <line x1="-16" y1="-228" x2="16" y2="-228" stroke="#0A3D2A" strokeWidth="5" strokeLinecap="round" />
          <path d="M-38,0 L-38,-56 A38,38 0 0 1 38,-56 L38,0 Z" fill="#0A3D2A" opacity="0.3" />
          <path d="M-58,-104 A22,22 0 0 1 -14,-104 Z" fill="none" stroke="#0A3D2A" strokeWidth="4" opacity="0.4" />
          <path d="M14,-104 A22,22 0 0 1 58,-104 Z" fill="none" stroke="#0A3D2A" strokeWidth="4" opacity="0.4" />
        </g>
        {/* little scooter on the coast road */}
        <g transform="translate(1010,588) scale(1.6)" stroke="#D6491F" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85">
          <circle cx="-18" cy="11" r="7.5" />
          <circle cx="21" cy="11" r="7.5" />
          <path d="M-18,11 Q-11,-5 3,-3 Q15,-2 21,11" />
          <path d="M-3,-3 L-3,-15 M-9,-15 L2,-15 M7,-3 L11,-17 M7,-17 L15,-17" />
        </g>

        <g className="hhg-palm hhg-palm-l">
          <path d="M120,900 Q170,760 145,600" stroke="#0A3D2A" strokeWidth="16" fill="none" strokeLinecap="round" />
          <g stroke="#0A3D2A" strokeWidth="14" strokeLinecap="round" fill="none">
            <path d="M145,600 Q80,540 20,560" />
            <path d="M145,600 Q100,500 60,430" />
            <path d="M145,600 Q160,480 150,400" />
            <path d="M145,600 Q210,510 260,460" />
            <path d="M145,600 Q220,560 290,570" />
          </g>
        </g>
        <g className="hhg-palm hhg-palm-r">
          <path d="M1480,900 Q1430,760 1455,600" stroke="#0A3D2A" strokeWidth="16" fill="none" strokeLinecap="round" />
          <g stroke="#0A3D2A" strokeWidth="14" strokeLinecap="round" fill="none">
            <path d="M1455,600 Q1520,540 1580,560" />
            <path d="M1455,600 Q1500,500 1540,430" />
            <path d="M1455,600 Q1440,480 1450,400" />
            <path d="M1455,600 Q1390,510 1340,460" />
            <path d="M1455,600 Q1380,560 1310,570" />
          </g>
        </g>
        <g stroke="#F7ECC9" strokeWidth="4" strokeLinecap="round" opacity="0.4" fill="none">
          <path d="M330,150 Q350,120 370,150 Q390,120 410,150" />
          <path d="M1120,190 Q1136,166 1152,190 Q1168,166 1184,190" />
        </g>
        <g fill="#F7ECC9" opacity="0.35">
          <circle className="hhg-spark" cx="300" cy="180" r="4" />
          <circle className="hhg-spark hhg-spark-2" cx="1200" cy="140" r="3" />
          <circle className="hhg-spark hhg-spark-3" cx="950" cy="260" r="3" />
          <circle className="hhg-spark" cx="500" cy="320" r="2.5" />
        </g>
      </svg>
    </div>
  );
}

function SegButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`hhg-seg ${active ? "hhg-seg-active" : ""}`}>
      {children}
    </button>
  );
}

/* ---------------- main app ---------------- */

export default function HHGoaApp() {
  const [format, setFormat] = useState("id"); // 'id' | 'pfp'
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [title, setTitle] = useState(TITLES[Math.floor(Math.random() * TITLES.length)]);
  const [imgObj, setImgObj] = useState(null);
  const [crop, setCrop] = useState({ zoom: 1, fx: 0.5, fy: 0.42 });
  const [error, setError] = useState("");
  const [stage, setStage] = useState("build"); // 'build' | 'developing' | 'result'
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const W = format === "pfp" ? 1080 : 1600;
  const H = format === "pfp" ? 1080 : 2000;

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    await ensureFonts();
    if (format === "pfp") {
      renderPFP(ctx, W, H, imgObj, crop, name);
    } else {
      renderID(ctx, W, H, imgObj, crop, { name, stack, title });
    }
  }, [W, H, format, imgObj, crop, name, stack, title]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { redraw(); });
    return () => cancelAnimationFrame(id);
  }, [redraw]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    const okTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!okTypes.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setError("That photo didn't make it to Goa. Try a JPG, PNG or WEBP \uD83C\uDF34");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("That file's too big for the boat. Try something under 25MB \uD83C\uDF0A");
      return;
    }
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      setImgObj(im);
      setCrop({ zoom: 1, fx: 0.5, fy: 0.42 });
    };
    im.onerror = () => {
      setError("That photo didn't make it to Goa. Try another one \uD83C\uDF34");
      URL.revokeObjectURL(url);
    };
    im.src = url;
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  };

  // ---- in-browser camera (works on laptop webcam AND phone camera) ----
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError("");
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      // Camera denied, unavailable, or unsupported (e.g. non-HTTPS) — fall back to native file picker
      setShowCamera(false);
      if (cameraInputRef.current) cameraInputRef.current.click();
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setShowCamera(false);
    setCameraError("");
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const cnv = document.createElement("canvas");
    cnv.width = video.videoWidth;
    cnv.height = video.videoHeight;
    const ctx = cnv.getContext("2d");
    ctx.drawImage(video, 0, 0);
    cnv.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  useEffect(() => () => stopCameraStream(), []);

  const shuffleTitle = () => {
    setTitle((prev) => {
      let next = prev;
      while (next === prev) next = TITLES[Math.floor(Math.random() * TITLES.length)];
      return next;
    });
  };

  const doGenerate = () => {
    if (!imgObj) {
      setError("Drop a photo first \u2014 we need you in the frame \uD83C\uDF34");
      return;
    }
    setStage("developing");
    setTimeout(() => setStage("result"), 700);
  };

  const filename = useMemo(() => {
    const n = (name || "Builder").trim().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "Builder";
    return format === "pfp" ? `HH-Goa-2026-${n}-Frame.png` : `HH-Goa-2026-${n}-Builder-ID.png`;
  }, [name, format]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png", 1);
  };

  const shareText = `Just generated my Hacker House Goa 2026 ${format === "pfp" ? "Frame" : "Builder ID"} \uD83C\uDF34\uD83D\uDCBB\u2600\uFE0F\n\nBuilding from Goa.\n\n#FrameInGoa #HackerHouse`;

  const handleShare = () => {
    handleDownload();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyHashtag = () => {
    navigator.clipboard?.writeText("#FrameInGoa").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  return (
    <div className="hhg-root">
      <style>{`
        @import url('${FONT_LINK}');
        :root {
          --green: ${COLORS.green};
          --dark-green: ${COLORS.darkGreen};
          --ink: ${COLORS.ink};
          --cream: ${COLORS.cream};
          --cream-dim: ${COLORS.creamDim};
          --yellow: ${COLORS.yellow};
          --pink: ${COLORS.pink};
        }
        * { box-sizing: border-box; }
        .hhg-root {
          font-family: 'Inter', sans-serif;
          background: var(--cream);
          color: var(--ink);
          min-height: 100%;
          overflow-x: hidden;
          position: relative;
        }
        .hhg-root h1, .hhg-root h2, .hhg-root .hhg-display {
          font-family: 'Anton', sans-serif;
          font-weight: 400;
          letter-spacing: 0.01em;
          line-height: 0.92;
          text-transform: uppercase;
        }
        .hhg-mono { font-family: 'Space Mono', monospace; }

        /* ---- hero ---- */
        .hhg-hero {
          position: relative;
          min-height: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 90px 20px 130px;
          color: var(--cream);
          overflow: hidden;
        }
        .hhg-backdrop { position: absolute; inset: 0; z-index: 0; }
        .hhg-bg-svg { width: 100%; height: 100%; display: block; }
        .hhg-sun { transform-origin: 800px 220px; animation: hhg-sun-spin 40s linear infinite; }
        @keyframes hhg-sun-spin { to { transform: rotate(360deg); } }
        .hhg-palm-l { animation: hhg-sway 6s ease-in-out infinite; transform-origin: 145px 600px; }
        .hhg-palm-r { animation: hhg-sway 6.5s ease-in-out infinite 0.3s reverse; transform-origin: 1455px 600px; }
        @keyframes hhg-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        .hhg-spark { animation: hhg-twinkle 3s ease-in-out infinite; }
        .hhg-spark-2 { animation-delay: 1s; }
        .hhg-spark-3 { animation-delay: 1.8s; }
        @keyframes hhg-twinkle { 0%,100% { opacity: 0.1; } 50% { opacity: 0.6; } }

        .hhg-eyebrow {
          position: relative; z-index: 1;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          letter-spacing: 0.25em;
          font-size: 13px;
          background: var(--pink);
          color: white;
          padding: 7px 16px;
          border-radius: 999px;
          margin-bottom: 26px;
        }
        .hhg-hero h1 {
          position: relative; z-index: 1;
          font-size: clamp(46px, 9vw, 108px);
          margin: 0;
        }
        .hhg-hero h1 span { color: var(--yellow); }
        .hhg-hero-sub {
          position: relative; z-index: 1;
          font-family: 'Inter', sans-serif;
          font-size: clamp(15px, 2vw, 19px);
          max-width: 520px;
          margin: 24px auto 36px;
          opacity: 0.92;
        }
        .hhg-cta-row { position: relative; z-index: 1; display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .hhg-btn {
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.06em;
          border: none;
          border-radius: 999px;
          padding: 16px 30px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }
        .hhg-btn:active { transform: scale(0.96); }
        .hhg-btn-primary { background: var(--yellow); color: var(--dark-green); }
        .hhg-btn-primary:hover { box-shadow: 0 8px 22px rgba(255,212,0,0.4); transform: translateY(-2px); }
        .hhg-btn-secondary { background: transparent; color: var(--cream); border: 2px solid var(--cream); }
        .hhg-btn-secondary:hover { background: rgba(255,246,227,0.12); transform: translateY(-2px); }
        .hhg-btn-pink { background: var(--pink); color: white; }
        .hhg-btn-pink:hover { box-shadow: 0 8px 22px rgba(255,46,126,0.4); transform: translateY(-2px); }
        .hhg-btn-outline { background: transparent; color: var(--dark-green); border: 2px solid var(--dark-green); }
        .hhg-btn-outline:hover { background: rgba(11,107,58,0.08); }
        .hhg-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ---- generator ---- */
        .hhg-section { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
        .hhg-generator-wrap { margin-top: -70px; position: relative; z-index: 2; padding-bottom: 90px; }
        .hhg-generator {
          background: var(--cream);
          border: 3px solid var(--dark-green);
          border-radius: 32px;
          box-shadow: 0 24px 60px rgba(4,51,35,0.25);
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
        }
        @media (max-width: 860px) { .hhg-generator { grid-template-columns: 1fr; } }

        .hhg-panel { padding: 40px; }
        .hhg-panel-left { border-right: 3px dashed rgba(4,51,35,0.15); }
        @media (max-width: 860px) {
          .hhg-panel-left { border-right: none; border-bottom: 3px dashed rgba(4,51,35,0.15); order: 2; }
          .hhg-panel-right { order: 1; }
        }

        .hhg-seg-row { display: flex; gap: 8px; margin-bottom: 26px; background: var(--cream-dim); padding: 6px; border-radius: 999px; }
        .hhg-seg {
          flex: 1; padding: 12px 10px; border: none; border-radius: 999px; cursor: pointer;
          font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px; letter-spacing: 0.05em;
          background: transparent; color: var(--dark-green); transition: all 0.15s ease;
        }
        .hhg-seg-active { background: var(--dark-green); color: var(--cream); }

        .hhg-upload {
          border: 3px dashed var(--green);
          border-radius: 22px;
          padding: 34px 20px;
          text-align: center;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          background: rgba(11,107,58,0.03);
        }
        .hhg-upload:hover, .hhg-upload.hhg-drag { background: rgba(11,107,58,0.08); border-color: var(--pink); }
        .hhg-upload input { display: none; }
        .hhg-upload-title { font-family: 'Anton', sans-serif; font-size: 22px; color: var(--dark-green); margin: 14px 0 4px; text-transform: uppercase; }
        .hhg-upload-sub { font-size: 13px; opacity: 0.65; margin: 0; }
        .hhg-upload-actions { display: flex; gap: 10px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }

        .hhg-field { margin-top: 20px; }
        .hhg-label {
          display: block; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 12px;
          letter-spacing: 0.1em; color: var(--green); margin-bottom: 8px; text-transform: uppercase;
        }
        .hhg-input {
          width: 100%; padding: 14px 16px; border-radius: 14px; border: 2px solid rgba(4,51,35,0.18);
          font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; color: var(--ink);
          background: white; transition: border-color 0.15s ease;
        }
        .hhg-input:focus { outline: none; border-color: var(--pink); }
        .hhg-title-row { display: flex; gap: 10px; align-items: stretch; }
        .hhg-title-row .hhg-input { flex: 1; }
        .hhg-shuffle {
          border: 2px solid var(--dark-green); background: var(--yellow); border-radius: 14px;
          width: 52px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .hhg-shuffle:active { transform: scale(0.92); }
        .hhg-shuffle.spin svg { animation: hhg-spin 0.5s ease; }
        @keyframes hhg-spin { to { transform: rotate(180deg); } }

        .hhg-zoom-row { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
        .hhg-zoom-row input[type=range] { flex: 1; accent-color: var(--pink); }

        .hhg-error { margin-top: 16px; padding: 12px 16px; background: rgba(255,46,126,0.1); border: 2px solid var(--pink); border-radius: 12px; font-size: 14px; color: #7a0033; font-weight: 600; }

        .hhg-generate-btn { width: 100%; margin-top: 28px; padding: 18px; font-size: 15px; }

        .hhg-panel-right { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: var(--dark-green); position: relative; }
        .hhg-preview-canvas { width: 100%; max-width: 380px; height: auto; border-radius: 18px; box-shadow: 0 18px 40px rgba(0,0,0,0.35); display: block; background: var(--green); }
        .hhg-preview-tag { font-family: 'Space Mono', monospace; color: var(--cream); opacity: 0.6; font-size: 11px; letter-spacing: 0.15em; margin-top: 16px; text-transform: uppercase; }

        /* ---- how it works ---- */
        .hhg-how { padding: 100px 20px 40px; }
        .hhg-how h2 { text-align: center; font-size: clamp(30px, 5vw, 48px); color: var(--dark-green); margin-bottom: 50px; }
        .hhg-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1000px; margin: 0 auto; }
        @media (max-width: 760px) { .hhg-how-grid { grid-template-columns: 1fr; } }
        .hhg-how-card { background: white; border: 3px solid var(--dark-green); border-radius: 22px; padding: 30px 24px; }
        .hhg-how-num { font-family: 'Anton', sans-serif; font-size: 40px; color: var(--pink); }
        .hhg-how-card h3 { font-family: 'Anton', sans-serif; font-size: 22px; color: var(--dark-green); margin: 6px 0 8px; text-transform: uppercase; }
        .hhg-how-card p { font-size: 14px; opacity: 0.7; margin: 0; line-height: 1.5; }

        /* ---- built for builders ---- */
        .hhg-builders { padding: 60px 20px 100px; }
        .hhg-builders h2 { text-align: center; font-size: clamp(30px, 5vw, 48px); color: var(--dark-green); margin-bottom: 12px; }
        .hhg-builders-sub { text-align: center; opacity: 0.65; margin-bottom: 44px; }
        .hhg-example-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 34px 24px; max-width: 1100px; margin: 0 auto; padding: 10px; }
        @media (max-width: 900px) { .hhg-example-grid { grid-template-columns: repeat(2, 1fr); } }
        .hhg-example-card {
          border-radius: 20px; padding: 26px 18px 20px; color: var(--dark-green); position: relative; overflow: hidden;
          min-height: 230px; display: flex; flex-direction: column; justify-content: flex-end;
          background: var(--cream); border: 3px solid var(--dark-green); box-shadow: 0 12px 26px rgba(10,61,42,0.22);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hhg-example-card:hover { transform: rotate(0deg) scale(1.04) !important; box-shadow: 0 18px 34px rgba(10,61,42,0.3); }
        .hhg-example-leaf-bg {
          position: absolute; inset: 0; opacity: 0.16; font-size: 130px; display: flex;
          align-items: center; justify-content: center; transform: rotate(-12deg) scale(1.4);
          pointer-events: none; user-select: none;
        }
        .hhg-example-tape {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(-4deg);
          width: 64px; height: 22px; background: rgba(216,179,102,0.55); border: 1px solid rgba(10,61,42,0.25);
        }
        .hhg-example-avatar-wrap { position: relative; width: fit-content; margin-bottom: 14px; z-index: 1; }
        .hhg-example-avatar {
          width: 60px; height: 60px; border-radius: 50%;
          background: rgba(27,107,74,0.1); display: flex; align-items: center; justify-content: center;
          font-family: 'Anton', sans-serif; font-size: 21px; color: var(--dark-green);
          border: 2px dashed var(--green);
        }
        .hhg-example-badge {
          position: absolute; bottom: -6px; left: -6px; width: 26px; height: 26px; border-radius: 50%;
          background: var(--pink); border: 2px solid var(--cream); display: flex; align-items: center;
          justify-content: center; font-size: 13px; box-shadow: 0 4px 8px rgba(10,61,42,0.3);
        }
        .hhg-example-role {
          font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--cream);
          margin-bottom: 8px; position: relative; z-index: 1;
          background: var(--dark-green); display: inline-block; padding: 4px 10px; border-radius: 999px; width: fit-content;
        }
        .hhg-example-title { font-family: 'Anton', sans-serif; font-size: 19px; text-transform: uppercase; line-height: 1.05; position: relative; z-index: 1; color: var(--dark-green); }

        /* ---- footer ---- */
        .hhg-footer { background: var(--dark-green); color: var(--cream); padding: 50px 20px; text-align: center; }
        .hhg-footer .hhg-display { font-size: 28px; margin-bottom: 6px; }
        .hhg-footer p { opacity: 0.6; font-size: 13px; margin: 0; font-family: 'Space Mono', monospace; }

        /* ---- result overlay ---- */
        .hhg-overlay {
          position: fixed; inset: 0; z-index: 50; background: rgba(4,51,35,0.92);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          backdrop-filter: blur(6px);
        }
        .hhg-result-card {
          background: var(--cream); border-radius: 28px; max-width: 460px; width: 100%;
          padding: 36px 28px; text-align: center; max-height: 92vh; overflow-y: auto;
          border: 3px solid var(--ink);
        }
        .hhg-result-card h2 { font-size: 40px; color: var(--dark-green); margin: 0; }
        .hhg-result-card .hhg-sub2 { font-family: 'Space Mono', monospace; color: var(--pink); font-weight: 700; letter-spacing: 0.1em; margin: 6px 0 22px; font-size: 13px; }
        .hhg-result-img { width: 100%; max-width: 280px; border-radius: 16px; box-shadow: 0 14px 34px rgba(0,0,0,0.25); margin-bottom: 24px; }
        .hhg-result-actions { display: flex; flex-direction: column; gap: 12px; }
        .hhg-hashtag-row { margin-top: 20px; display: flex; align-items: center; justify-content: center; gap: 10px; font-family: 'Space Mono', monospace; font-weight: 700; color: var(--dark-green); }
        .hhg-copy-btn { background: var(--cream-dim); border: 2px solid var(--dark-green); border-radius: 999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .hhg-close-x { position: absolute; top: 18px; right: 18px; background: rgba(4,51,35,0.08); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--dark-green); }
        .hhg-camera-overlay { position: fixed; inset: 0; background: rgba(10,20,15,0.82); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 20px; }
        .hhg-camera-box { position: relative; background: var(--cream); border-radius: 18px; padding: 20px; width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .hhg-camera-video { width: 100%; max-height: 60vh; border-radius: 12px; background: #000; object-fit: cover; transform: scaleX(-1); }
        .hhg-camera-error { padding: 24px 12px; text-align: center; font-weight: 600; }
        .hhg-camera-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

        .hhg-developing { display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--cream); }
        .hhg-developing-icon { font-size: 46px; animation: hhg-bounce 1s ease-in-out infinite; }
        @keyframes hhg-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .hhg-developing p { font-family: 'Space Mono', monospace; letter-spacing: 0.1em; font-size: 13px; }

        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

        .hhg-btn:focus-visible, .hhg-input:focus-visible, .hhg-upload:focus-visible, .hhg-seg:focus-visible, .hhg-shuffle:focus-visible, .hhg-copy-btn:focus-visible, .hhg-close-x:focus-visible {
          outline: 3px solid var(--pink); outline-offset: 2px;
        }
      `}</style>

      {/* HERO */}
      <section className="hhg-hero">
        <TropicalBackdrop />
        <span className="hhg-eyebrow">HACKER HOUSE GOA 2026</span>
        <h1>MAKE YOUR FRAME.<br /><span>BRING THE GOA ENERGY.</span></h1>
        <p className="hhg-hero-sub">Turn any photo into your official HH Goa 2026 identity.</p>
        <div className="hhg-cta-row">
          <button className="hhg-btn hhg-btn-primary" onClick={() => { setFormat("pfp"); document.getElementById("hhg-generator")?.scrollIntoView({ behavior: "smooth" }); }}>
            CREATE MY FRAME
          </button>
          <button className="hhg-btn hhg-btn-secondary" onClick={() => { setFormat("id"); document.getElementById("hhg-generator")?.scrollIntoView({ behavior: "smooth" }); }}>
            BUILD MY ID
          </button>
        </div>
      </section>

      {/* GENERATOR */}
      <div className="hhg-generator-wrap hhg-section" id="hhg-generator">
        <div className="hhg-generator">
          <div className="hhg-panel hhg-panel-left">
            <div className="hhg-seg-row" role="tablist" aria-label="Choose format">
              <SegButton active={format === "id"} onClick={() => setFormat("id")}>BUILDER ID CARD</SegButton>
              <SegButton active={format === "pfp"} onClick={() => setFormat("pfp")}>PFP FRAME</SegButton>
            </div>

            <div
              className={`hhg-upload ${dragOver ? "hhg-drag" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload your photo"
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            >
              <Upload size={30} color={COLORS.green} aria-hidden="true" />
              <p className="hhg-upload-title">{imgObj ? "PHOTO LOADED \u2713" : "DROP YOUR PHOTO HERE"}</p>
              <p className="hhg-upload-sub">or choose from your device \u00b7 JPG, PNG, WEBP, HEIC</p>
              <div className="hhg-upload-actions" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="hhg-btn hhg-btn-outline" onClick={() => fileInputRef.current?.click()}>CHOOSE PHOTO</button>
                <button type="button" className="hhg-btn hhg-btn-outline" onClick={openCamera}>
                  <Camera size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} aria-hidden="true" />
                  TAKE A PHOTO
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" aria-label="Choose a photo file" onChange={(e) => handleFile(e.target.files?.[0])} />
              {/* Hidden fallback input — only used if getUserMedia camera access fails/is unsupported */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" aria-label="Take a photo" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
            </div>

            {imgObj && (
              <div className="hhg-zoom-row">
                <ZoomIn size={18} color={COLORS.green} aria-hidden="true" />
                <input
                  type="range" min="1" max="2" step="0.01" value={crop.zoom}
                  aria-label="Zoom and reposition photo"
                  onChange={(e) => setCrop((c) => ({ ...c, zoom: parseFloat(e.target.value) }))}
                />
              </div>
            )}

            {error && <div className="hhg-error" role="alert">{error}</div>}

            {format === "id" && (
              <>
                <div className="hhg-field">
                  <label className="hhg-label" htmlFor="hhg-name">Name</label>
                  <input id="hhg-name" className="hhg-input" placeholder="Your name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="hhg-field">
                  <label className="hhg-label" htmlFor="hhg-stack">Stack / Role</label>
                  <input id="hhg-stack" className="hhg-input" placeholder="e.g. Full Stack, AI, Cybersecurity" value={stack} maxLength={40} onChange={(e) => setStack(e.target.value)} />
                </div>
                <div className="hhg-field">
                  <label className="hhg-label" htmlFor="hhg-title">Builder Title (optional)</label>
                  <div className="hhg-title-row">
                    <input id="hhg-title" className="hhg-input" placeholder="Auto-generated if left blank" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
                    <button type="button" className="hhg-shuffle" aria-label="Generate a new builder title" onClick={shuffleTitle}>
                      <RefreshCw size={18} color={COLORS.darkGreen} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {format === "pfp" && (
              <div className="hhg-field">
                <label className="hhg-label" htmlFor="hhg-name-pfp">Name (optional badge)</label>
                <input id="hhg-name-pfp" className="hhg-input" placeholder="Your name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <button className="hhg-btn hhg-btn-pink hhg-generate-btn" onClick={doGenerate}>
              <Sparkles size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} aria-hidden="true" />
              GENERATE MY FRAME
            </button>
          </div>

          <div className="hhg-panel hhg-panel-right">
            <canvas ref={canvasRef} className="hhg-preview-canvas" role="img" aria-label="Live preview of your HH Goa 2026 frame" />
            <p className="hhg-preview-tag">Live Preview \u00b7 Updates Instantly</p>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="hhg-how hhg-section">
        <h2 className="hhg-display">How It Works</h2>
        <div className="hhg-how-grid">
          <div className="hhg-how-card">
            <div className="hhg-how-num hhg-mono">01</div>
            <h3>Drop Your Photo</h3>
            <p>Any photo works \u2014 portrait, landscape, selfie. We fit it automatically, no cropping needed.</p>
          </div>
          <div className="hhg-how-card">
            <div className="hhg-how-num hhg-mono">02</div>
            <h3>Pick Your Identity</h3>
            <p>Choose a PFP Frame or a full Builder ID Card, add your name and stack.</p>
          </div>
          <div className="hhg-how-card">
            <div className="hhg-how-num hhg-mono">03</div>
            <h3>Share Your Goa Frame</h3>
            <p>Download the PNG or post straight to X with #FrameInGoa.</p>
          </div>
        </div>
      </section>

      {/* BUILT FOR BUILDERS */}
      <section className="hhg-builders hhg-section">
        <h2 className="hhg-display">Built For Builders</h2>
        <p className="hhg-builders-sub">A few identities already washed up on shore.</p>
        <div className="hhg-example-grid">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="hhg-example-card" style={{ transform: `rotate(${ex.rot}deg)` }}>
              <div className="hhg-example-tape" aria-hidden="true" />
              <div className="hhg-example-leaf-bg" aria-hidden="true">{ex.leaf}</div>
              <div className="hhg-example-avatar-wrap">
                <div className="hhg-example-avatar">{ex.initials}</div>
                <div className="hhg-example-badge" aria-hidden="true">{ex.badge}</div>
              </div>
              <div className="hhg-example-role hhg-mono">{ex.role}</div>
              <div className="hhg-example-title">{ex.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hhg-footer">
        <div className="hhg-display">HACKER HOUSE GOA 2026</div>
        <p>28\u201331 OCT 2026 \u00b7 GOA, INDIA \u00b7 #FrameInGoa</p>
      </footer>

      {/* RESULT / DEVELOPING OVERLAY */}
      {stage !== "build" && (
        <div className="hhg-overlay" role="dialog" aria-modal="true" aria-label="Generated frame result">
          {stage === "developing" && (
            <div className="hhg-developing">
              <div className="hhg-developing-icon" aria-hidden="true">\u2600\uFE0F</div>
              <p className="hhg-mono">BUILDING YOUR GOA ID...</p>
            </div>
          )}
          {stage === "result" && (
            <div className="hhg-result-card">
              <button className="hhg-close-x" aria-label="Close" onClick={() => setStage("build")}>
                <CloseIcon size={18} />
              </button>
              <h2 className="hhg-display">YOU'RE IN. \uD83C\uDF34</h2>
              <p className="hhg-sub2">WELCOME TO HH GOA 2026</p>
              <img className="hhg-result-img" src={canvasRef.current?.toDataURL("image/png")} alt="Your generated HH Goa 2026 frame" />
              <div className="hhg-result-actions">
                <button className="hhg-btn hhg-btn-primary" onClick={handleDownload}>
                  <Download size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} aria-hidden="true" />
                  DOWNLOAD PNG
                </button>
                <button className="hhg-btn hhg-btn-pink" onClick={handleShare}>
                  <Share2 size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} aria-hidden="true" />
                  SHARE TO X \u2192
                </button>
                <button className="hhg-btn hhg-btn-outline" onClick={() => setStage("build")}>
                  MAKE ANOTHER
                </button>
              </div>
              <div className="hhg-hashtag-row">
                <span>#FrameInGoa</span>
                <button className="hhg-copy-btn" aria-label="Copy hashtag" onClick={copyHashtag}>
                  {copied ? <Check size={16} /> : <span style={{ fontSize: 12 }}>\u2398</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCamera && (
        <div className="hhg-camera-overlay" role="dialog" aria-modal="true" aria-label="Take a photo">
          <div className="hhg-camera-box">
            <button type="button" className="hhg-close-x" aria-label="Close camera" onClick={closeCamera}>
              <CloseIcon size={18} />
            </button>
            {cameraError ? (
              <p className="hhg-camera-error">{cameraError}</p>
            ) : (
              <video ref={videoRef} className="hhg-camera-video" playsInline muted />
            )}
            <div className="hhg-camera-actions">
              <button type="button" className="hhg-btn hhg-btn-primary" onClick={capturePhoto}>
                <Camera size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} aria-hidden="true" />
                CAPTURE
              </button>
              <button type="button" className="hhg-btn hhg-btn-outline" onClick={closeCamera}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
