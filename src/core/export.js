// export.js — 3D(STL·OBJ)·재단(DXF·CSV)·도면(SVG·PDF) 내보내기. 브라우저와 Node 양쪽에서 동작하는 순수 함수.

import { orientedMesh, localMesh, triangulate, faceNormal, bboxOf, V } from './geom.js';
import { nest, flatPiece } from './cutlist.js';
import { fmt } from './scale.js';

// ---------------------------------------------------------------- 삼각형 수집
/** 모델의 삼각형을 미니어처 mm, Z-up 좌표로 모은다. */
export function modelTriangles(model, { includeOpt = false } = {}) {
  const N = model.N, out = [];
  for (const p of model.parts) {
    if (p.inner || (p.opt && !includeOpt)) continue;
    const m = orientedMesh(p, 1), tris = [];
    const pts = m.v.map((q) => [(q[0] + p.pos[0]) / N, -(q[2] + p.pos[2]) / N, (q[1] + p.pos[1]) / N]);
    for (const f of m.f) for (const t of triangulate(m.v, f)) tris.push(t);
    out.push({ part: p, pts, tris });
  }
  return out;
}

/** 부품을 눕혀 출력판에 나란히 놓은 키트(3D 프린트용). */
export function kitTriangles(model, { bed = 200, gap = 3 } = {}) {
  const N = model.N, items = [];
  for (const p of model.parts) {
    if (p.inner || p.opt) continue;
    const m = localMesh(p, 1), bb = bboxOf(m.v);
    const ax = [0, 1, 2].sort((a, b) => bb.size[a] - bb.size[b]); // 가장 얇은 축을 Z로
    const [zc, yc, xc] = ax;
    const pts = m.v.map((q) => [(q[xc] - bb.min[xc]) / N, (q[yc] - bb.min[yc]) / N, (q[zc] - bb.min[zc]) / N]);
    // 축 순열이 홀순열이면 면 방향을 뒤집는다.
    const odd = (xc === 0 && yc === 2) || (xc === 1 && yc === 0) || (xc === 2 && yc === 1);
    const tris = [];
    for (const f of m.f) for (const t of triangulate(m.v, f)) tris.push(odd ? [t[0], t[2], t[1]] : t);
    items.push({ part: p, pts, tris, w: bb.size[xc] / N, h: bb.size[yc] / N });
  }
  items.sort((a, b) => b.h - a.h);
  let x = 0, y = 0, rowH = 0, plate = 0;
  const plates = [[]];
  for (const it of items) {
    if (x + it.w > bed && x > 0) { x = 0; y += rowH + gap; rowH = 0; }
    if (y + it.h > bed && y > 0) { plate++; plates.push([]); x = 0; y = 0; rowH = 0; }
    plates[plate].push({ ...it, pts: it.pts.map((q) => [q[0] + x, q[1] + y, q[2]]) });
    x += it.w + gap; rowH = Math.max(rowH, it.h);
  }
  return plates;
}

// ---------------------------------------------------------------- STL / OBJ
export function toSTL(groups) {
  let n = 0;
  for (const g of groups) n += g.tris.length;
  const buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf);
  const head = 'MINIATYR binary STL (mm)';
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
  dv.setUint32(80, n, true);
  let o = 84;
  for (const g of groups) for (const t of g.tris) {
    const a = g.pts[t[0]], b = g.pts[t[1]], c = g.pts[t[2]];
    const nr = V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
    for (const v of [nr, a, b, c]) { dv.setFloat32(o, v[0], true); dv.setFloat32(o + 4, v[1], true); dv.setFloat32(o + 8, v[2], true); o += 12; }
    o += 2;
  }
  return buf;
}

export function toOBJ(groups, colorOf) {
  let obj = '# MINIATYR OBJ (mm)\nmtllib model.mtl\n', mtl = '', base = 1;
  const mats = new Map();
  for (const g of groups) {
    const c = colorOf ? colorOf(g.part) : null, key = c ? c.key : 'default';
    if (c && !mats.has(key)) {
      mats.set(key, c);
      const h = c.c, rgb = [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
      mtl += `newmtl ${key}\nKd ${rgb}\nd ${c.t === 'glass' ? 0.3 : 1}\n\n`;
    }
    obj += `o ${g.part.id}_${g.part.name.replace(/\s+/g, '_')}\nusemtl ${key}\n`;
    for (const p of g.pts) obj += `v ${p[0].toFixed(3)} ${p[1].toFixed(3)} ${p[2].toFixed(3)}\n`;
    for (const t of g.tris) obj += `f ${t[0] + base} ${t[1] + base} ${t[2] + base}\n`;
    base += g.pts.length;
  }
  return { obj, mtl };
}

// ---------------------------------------------------------------- DXF (레이저·커팅 플로터)
export function toDXF(list, { sheetW = 300, sheetH = 200 } = {}) {
  const nested = nest(list, { sheetW, sheetH, gap: 2 });
  let ent = '', oy = 0;
  const poly = (pts, layer) => {
    ent += `0\nLWPOLYLINE\n8\n${layer}\n90\n${pts.length}\n70\n1\n`;
    for (const p of pts) ent += `10\n${p[0].toFixed(3)}\n20\n${p[1].toFixed(3)}\n`;
  };
  for (const g of nested.groups) {
    const layer = `T${fmt(g.t, 1).replace('.', '_')}_${g.kind === '투명판' ? 'CLEAR' : g.kind === '띠' ? 'BAND' : g.kind === '종이 전개도' ? 'PAPER' : 'SHEET'}`;
    for (const sh of g.sheets) {
      poly([[0, oy], [sheetW, oy], [sheetW, oy + sheetH], [0, oy + sheetH]], 'FRAME');
      for (const p of sh.placed) {
        const x = p.x, y = oy + sheetH - p.y; // DXF는 Y가 위
        if (p.pts) poly(p.pts.map((q) => [x + q[0], y - q[1]]), layer);
        else if (p.circle) ent += `0\nCIRCLE\n8\n${layer}\n10\n${(x + p.w / 2).toFixed(3)}\n20\n${(y - p.h / 2).toFixed(3)}\n40\n${(p.w / 2).toFixed(3)}\n`;
        else poly([[x, y], [x + p.w, y], [x + p.w, y - p.h], [x, y - p.h]], layer);
        ent += `0\nTEXT\n8\nLABEL\n10\n${(x + p.w / 2).toFixed(3)}\n20\n${(y - p.h / 2).toFixed(3)}\n40\n${Math.max(1.5, Math.min(4, Math.min(p.w, p.h) * 0.4)).toFixed(2)}\n1\n${p.label}\n`;
      }
      oy += sheetH + 10;
    }
  }
  return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${ent}0\nENDSEC\n0\nEOF\n`;
}

export function toCSV(list, item) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['부호', '부품', '수량', '재료 형태', '미니어처 치수(mm)', '실물 치수(mm)', '추천 재료', '조립 단계', '비고']];
  for (const r of list.rows) rows.push([r.label, r.name, r.qty, r.info.ko, r.dim, r.dimReal, r.material, r.step, [r.opt ? '선택' : '', r.note, r.warn].filter(Boolean).join(' / ')]);
  return `﻿${item.name} ${item.type} — 축척 1:${list.N}\n${rows.map((r) => r.map(q).join(',')).join('\n')}\n`;
}

// ---------------------------------------------------------------- ZIP (무압축 저장)
const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const bytes = (d) => (typeof d === 'string' ? new TextEncoder().encode(d) : d instanceof ArrayBuffer ? new Uint8Array(d) : d);

/** files: [{ name, data: string | ArrayBuffer | Uint8Array }] → Uint8Array */
export function zip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = bytes(f.data), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), name);
    off += 30 + name.length + data.length;
  }
  const csize = central.reduce((a, c) => a + c.length, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)], out = new Uint8Array(all.reduce((a, c) => a + c.length, 0));
  let o = 0;
  for (const c of all) { out.set(c, o); o += c.length; }
  return out;
}

// ---------------------------------------------------------------- PDF (JPEG 페이지 묶음)
/** pages: [{ jpeg: Uint8Array, wPx, hPx }] — 각 페이지를 A4 가로(297×210mm)에 꽉 채운다. */
export function pdfFromJpegs(pages, { wMm = 297, hMm = 210 } = {}) {
  const W = (wMm / 25.4) * 72, H = (hMm / 25.4) * 72, enc = new TextEncoder(), chunks = [], offs = [];
  let pos = 0;
  const push = (d) => { const u = typeof d === 'string' ? enc.encode(d) : d; chunks.push(u); pos += u.length; };
  const obj = (id, body, stream) => { offs[id] = pos; push(`${id} 0 obj\n${body}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length, kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  pages.forEach((p, i) => {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2, content = `q ${W.toFixed(2)} 0 0 ${H.toFixed(2)} 0 0 cm /Im0 Do Q`;
    obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
    obj(cid, `<< /Length ${content.length} >>`, content);
    obj(iid, `<< /Type /XObject /Subtype /Image /Width ${p.wPx} /Height ${p.hPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`, p.jpeg);
  });
  const xref = pos, total = 3 + n * 3;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += `${String(offs[i]).padStart(10, '0')} 00000 n \n`;
  push(`${x}trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(pos);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

/** 3D 프린트 가능성 점검: 축척에서 너무 얇아지는 부품을 찾는다. */
export function printability(list, minWall = 0.8) {
  const thin = [];
  for (const r of list.rows) {
    if (r.opt) continue;
    const m = r.mini, t = r.stock === 'stick' ? m.b : r.stock === 'rod' || r.stock === 'wire' || r.stock === 'turn' ? m.d : m.t;
    if (t != null && t < minWall) thin.push({ label: r.label, name: r.name, t });
  }
  return { ok: thin.length === 0, thin, minWall };
}

export { flatPiece, faceNormal };
