#!/usr/bin/env python3
"""실물 스캔 자산(Poly Haven, CC0)을 내려받아 앱이 바로 읽는 가벼운 형식으로 바꾼다.

  python3 tools/fetch-real-assets.py [캐시 폴더]

- 모델: glTF(1k) → assets/real/<id>.bin (정점·법선·UV·인덱스) + 텍스처 webp
- 재질: 확산·노멀·거칠기 맵 → assets/real/tex/<id>_{d,n,r}.webp
- assets/real/manifest.json 에 크기·평균색·오프셋을 적는다.
런타임에는 glTF 로더가 필요 없다(src/three/real.js 가 manifest 를 읽는다).
"""
import io, json, os, struct, sys, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'real')
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'ph-cache')
API = 'https://api.polyhaven.com'

# 소품 모델: id → 텍스처 한 변(px)
MODELS = {
    'potted_plant_01': 1024, 'potted_plant_02': 1024, 'potted_plant_04': 512, 'ceramic_vase_01': 512, 'ceramic_vase_03': 512,
}
# 재질 텍스처: id → 한 변(px)
TEXTURES = {
    'oak_veneer_01': 1024, 'white_oak_veneer': 1024, 'walnut_veneer': 1024, 'black_oak_veneer': 1024, 'coated_pine': 1024,
    'rough_linen': 1024, 'cotton_jersey': 512, 'brown_leather': 1024,
    'laminate_floor_02': 1024, 'herringbone_parquet': 1024, 'wood_floor': 1024, 'dark_wooden_planks': 1024, 'wood_planks_grey': 1024,
    'painted_plaster_wall': 1024, 'hessian_230': 512,
}


def get(url, path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        req = urllib.request.Request(url, headers={'User-Agent': 'asset-fetch/1.0'})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, 'wb') as f:
            f.write(r.read())
    return path


def api(path):
    p = get(f'{API}/{path}', os.path.join(CACHE, 'api', path.replace('/', '_') + '.json'))
    return json.load(open(p))


def save_img(src, dst, size, mode=None, quality=82):
    im = Image.open(src)
    if mode == 'L':
        im = im.convert('L')
    elif im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA' if 'A' in im.getbands() or im.mode == 'P' else 'RGB')
    if im.mode == 'RGBA' and im.getextrema()[3][0] == 255:
        im = im.convert('RGB')
    if max(im.size) > size:
        im = im.resize((size, size), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', quality=quality, method=6)
    return im


def mean_srgb(im):
    a = np.asarray(im.convert('RGB').resize((64, 64), Image.BOX), dtype=np.float64) / 255
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4).reshape(-1, 3).mean(0)
    return [round(float(v), 4) for v in lin]  # 선형 평균(재질 색 보정에 쓴다)


# 마감 색을 입히는 재질(나무·원단·가죽·벽): 사진의 색은 버리고 결·짜임의 밝기 변화만 남긴다.
TINTED = {'oak_veneer_01', 'white_oak_veneer', 'walnut_veneer', 'black_oak_veneer', 'coated_pine', 'rough_linen', 'cotton_jersey', 'brown_leather', 'painted_plaster_wall', 'hessian_230'}


# 무늬 대비 조절: 벽은 얼룩이 은은해야 한다
CONTRAST = {'painted_plaster_wall': 0.3, 'cotton_jersey': 0.7}


def detail_map(im, contrast=1.0):
    """색을 평균으로 나눈 '무늬만' 맵. 0.5 = 평균 밝기(런타임에서 마감 색 × 2 를 곱한다)."""
    a = np.asarray(im.convert('RGB'), dtype=np.float64) / 255
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722])
    mean = lin.reshape(-1, 3).mean(0)
    ratio = lum / max(1e-6, lum.mean())
    # 색상 변화(결의 붉고 노란 차이)는 채널 평균이 충분할 때만 조금 남긴다
    chroma = np.where(mean > 0.03, lin / np.maximum(mean, 1e-6), ratio[..., None])
    out = np.clip(0.5 + ((0.65 * ratio[..., None] + 0.35 * chroma) * 0.5 - 0.5) * contrast, 0, 1)
    srgb = np.where(out <= 0.0031308, out * 12.92, 1.055 * out ** (1 / 2.4) - 0.055)
    return Image.fromarray(np.round(srgb * 255).astype(np.uint8), 'RGB')


# ───────────────────────────── 재질 텍스처
def do_texture(tid, size):
    files, info = api(f'files/{tid}'), api(f'info/{tid}')
    pick = lambda key: files[key]['1k']['jpg']['url'] if key in files else None
    out = {'mm': info.get('dimensions', [1000, 1000])[:2]}
    d = get(pick('Diffuse'), os.path.join(CACHE, tid, 'd.jpg'))
    im = save_img(d, os.path.join(OUT, 'tex', f'{tid}_d.webp'), size)
    out['mean'] = mean_srgb(im)
    if tid in TINTED:
        out['tint'] = True
        detail_map(im, CONTRAST.get(tid, 1.0)).save(os.path.join(OUT, 'tex', f'{tid}_d.webp'), 'WEBP', quality=84, method=6)
    get(pick('nor_gl'), os.path.join(CACHE, tid, 'n.jpg'))
    save_img(os.path.join(CACHE, tid, 'n.jpg'), os.path.join(OUT, 'tex', f'{tid}_n.webp'), size, quality=86)
    get(pick('Rough'), os.path.join(CACHE, tid, 'r.jpg'))
    rim = save_img(os.path.join(CACHE, tid, 'r.jpg'), os.path.join(OUT, 'tex', f'{tid}_r.webp'), max(256, size // 2), mode='L', quality=80)
    out['rough'] = round(float(np.asarray(rim, dtype=np.float64).mean() / 255), 3)
    return out


# ───────────────────────────── 모델
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def node_matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix'], dtype=np.float64).reshape(4, 4).T
    m = np.eye(4)
    m[:3, :3] = quat_mat(n.get('rotation', [0, 0, 0, 1])) * np.array(n.get('scale', [1, 1, 1]))
    m[:3, 3] = n.get('translation', [0, 0, 0])
    return m


def do_model(mid, size):
    files = api(f'files/{mid}')['gltf']['1k']['gltf']
    base = os.path.join(CACHE, mid)
    g = json.load(open(get(files['url'], os.path.join(base, 'model.gltf'))))
    for rel, f in files['include'].items():
        get(f['url'], os.path.join(base, rel))
    bufs = [open(os.path.join(base, b['uri']), 'rb').read() for b in g['buffers']]

    def acc(i):
        a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]; dt = CT[a['componentType']]; n = NC[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride', 0); item = np.dtype(dt).itemsize * n
        buf = bufs[bv['buffer']]
        if stride and stride != item:
            arr = np.stack([np.frombuffer(buf, dt, n, off + k * stride) for k in range(a['count'])])
        else:
            arr = np.frombuffer(buf, dt, a['count'] * n, off).reshape(a['count'], n)
        if a.get('normalized') and dt != np.float32:
            arr = arr.astype(np.float32) / np.iinfo(dt).max
        return arr

    groups = {}  # 재질 번호 → [pos, nor, uv, idx]

    def walk(ni, parent):
        n = g['nodes'][ni]; m = parent @ node_matrix(n)
        if 'mesh' in n:
            nm = np.linalg.inv(m[:3, :3]).T
            for p in g['meshes'][n['mesh']]['primitives']:
                if p.get('mode', 4) != 4 or 'POSITION' not in p['attributes']:
                    continue
                pos = acc(p['attributes']['POSITION']).astype(np.float64) @ m[:3, :3].T + m[:3, 3]
                nor = acc(p['attributes']['NORMAL']).astype(np.float64) @ nm.T if 'NORMAL' in p['attributes'] else np.tile([0, 1, 0], (len(pos), 1))
                nor /= np.maximum(1e-9, np.linalg.norm(nor, axis=1, keepdims=True))
                uv = acc(p['attributes']['TEXCOORD_0']).astype(np.float32) if 'TEXCOORD_0' in p['attributes'] else np.zeros((len(pos), 2), np.float32)
                idx = acc(p['indices']).reshape(-1).astype(np.uint32) if 'indices' in p else np.arange(len(pos), dtype=np.uint32)
                if np.linalg.det(m[:3, :3]) < 0:
                    idx = idx.reshape(-1, 3)[:, ::-1].reshape(-1)
                G = groups.setdefault(p.get('material', 0), [[], [], [], [], 0])
                G[0].append(pos); G[1].append(nor); G[2].append(uv); G[3].append(idx + G[4]); G[4] += len(pos)
        for c in n.get('children', []):
            walk(c, m)

    for root in g['scenes'][g.get('scene', 0)]['nodes']:
        walk(root, np.eye(4))

    def tex_file(ti):
        return g['images'][g['textures'][ti]['source']]['uri']

    blob = io.BytesIO(); meshes = []; lo = np.full(3, 1e9); hi = np.full(3, -1e9); tris = 0
    for mi, (P, N, U, I, _) in sorted(groups.items()):
        pos = (np.concatenate(P) * 1000).astype(np.float32); nor = np.concatenate(N); uv = np.concatenate(U); idx = np.concatenate(I)
        lo = np.minimum(lo, pos.min(0)); hi = np.maximum(hi, pos.max(0)); tris += len(idx) // 3
        n8 = np.zeros((len(pos), 4), np.int8); n8[:, :3] = np.clip(np.round(nor * 127), -127, 127)
        mat = g['materials'][mi]; pbr = mat.get('pbrMetallicRoughness', {}); md = {'double': bool(mat.get('doubleSided')), 'alpha': mat.get('alphaMode', 'OPAQUE')}
        for key, src, mode, sz, q in (('d', pbr.get('baseColorTexture'), None, size, 84), ('n', mat.get('normalTexture'), None, size, 86), ('r', pbr.get('metallicRoughnessTexture'), None, max(256, size // 2), 80)):
            if src is None:
                continue
            name = f'{mid}_{mi}_{key}.webp'
            im = save_img(os.path.join(base, tex_file(src['index'])), os.path.join(OUT, 'tex', name), sz, mode, q)
            md[key] = name
            if key == 'r':  # 채널이 서로 다르면 AO·거칠기·금속 묶음(ARM), 같으면 거칠기만
                a = np.asarray(im.convert('RGB').resize((32, 32)), dtype=np.int16)
                md['arm'] = bool(np.abs(a[..., 1] - a[..., 2]).mean() > 6)
            if key == 'd' and im.mode == 'RGBA' and md['alpha'] == 'OPAQUE':
                md['alpha'] = 'MASK'
        e = {'mat': md, 'verts': len(pos), 'idx': len(idx)}
        for key, arr in (('pos', pos), ('nor', n8), ('uv', uv), ('ind', idx)):
            while blob.tell() % 4:
                blob.write(b'\0')
            e[key] = blob.tell(); blob.write(arr.tobytes())
        meshes.append(e)
    open(os.path.join(OUT, f'{mid}.bin'), 'wb').write(blob.getvalue())
    return {'meshes': meshes, 'min': [round(float(v), 1) for v in lo], 'max': [round(float(v), 1) for v in hi], 'tris': tris, 'bytes': blob.tell()}


def main():
    os.makedirs(OUT, exist_ok=True)
    man = {'source': 'Poly Haven (polyhaven.com), CC0 1.0', 'models': {}, 'textures': {}}
    for tid, size in TEXTURES.items():
        man['textures'][tid] = do_texture(tid, size); print('tex', tid, man['textures'][tid])
    for mid, size in MODELS.items():
        m = do_model(mid, size); man['models'][mid] = m
        print('model', mid, m['tris'], 'tris', m['bytes'] // 1024, 'KB', [round(b - a) for a, b in zip(m['min'], m['max'])], [x['mat'] for x in m['meshes']])
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), separators=(',', ':'))
    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
    print('total', round(total / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
