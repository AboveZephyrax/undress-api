# Undress API

REST API untuk [ai-undress.ai](https://ai-undress.ai) undress & sex-pose features. Auto account creation, aspect-ratio handling, full pose selection.

## Base URL

`https://undress-api-production.up.railway.app`

## Endpoints

### `GET /`
Cek status API.

### `GET /health`
Health check.

### `GET /api/poses`
Dapatkan daftar semua mode dan pose yang tersedia.

### `POST /api/account`
Buat akun baru (dipakai internal, tidak perlu dipanggil manual).

### `POST /api/undress`
Proses gambar dari URL.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageUrl` | string | ✅ | URL gambar (JPEG/PNG/WebP) |
| `mode` | string | ❌ | `undress` (default) atau `sex-pose` |
| `pose` | string | ❌ | Pose dalam mode (default: `undress`) |
| `prompt` | string | ❌ | Custom prompt (optional) |

**Response:**
```json
{
  "success": true,
  "data": {
    "account": { "email": "...", "credits": 0 },
    "result_url": "https://cdn.treekee.com/...",
    "image_base64": "/9j/4AAQ..."
  }
}
```

### `POST /api/undress/upload`
Proses gambar dari upload file (multipart/form-data).

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | ✅ | File gambar (JPEG/PNG/WebP, max 10MB) |
| `mode` | string | ❌ | `undress` atau `sex-pose` |
| `pose` | string | ❌ | Pose dalam mode |
| `prompt` | string | ❌ | Custom prompt |

## Mode & Pose

### Undress Mode (`mode: "undress"`)
Lepas pakaian / ganti pakaian. Default `pose: "undress"`.

| Pose Key | Deskripsi |
|----------|-----------|
| `undress` | Lepas pakaian (default) |
| `bigBreasts` | Payudara besar |
| `pregnant` | Hamil |
| `wedding` | Gaun pengantin |
| `maid` | Maid outfit |
| `jk` | Seragam sekolah Jepang |
| `slim` | Tubuh kurus |
| `curvy` | Tubuh berisi |
| `lingerie` | Pakaian dalam |
| `towel` | Handuk |
| `chineseDress` | Cheongsam |
| `bandeau` | Bandeau |
| `microBikini` | Micro bikini |
| `tattoo` | Tato |
| `schoolSwimsuit` | Baju renang sekolah |
| `leatherBikini` | Bikini kulit |
| `microBikiniTattoo` | Micro bikini + tato |
| `animation` | Gaya anime |

### Sex Pose Mode (`mode: "sex-pose"`)
Pose seksual / efek NSFW. Default `pose: "orgasmFace"`.

| Pose Key | Deskripsi |
|----------|-----------|
| `orgasmFace` | Ekspresi orgasme |
| `cumFace` | Cum di wajah |
| `cumOnClothes` | Cum di pakaian |
| `mouthCum` | Cum di mulut |
| `pussyHair` | Rambut kemaluan |
| `ballGag` | Ball gag |
| `bondage` | Shibari / bondage |
| `chainTraction` | Leash / collar |
| `nudeApron` | Celemek telanjang |
| `wetShirt` | Baju basah transparan |
| `milkBath` | Mandi susu |
| `crotchlessPants` | Celana crotchless |
| `fingering` | Fingering |
| `cumBody` | Cum di tubuh |
| `nippleClamps` | Nipple clamps |

## Contoh

### Default undress:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H 'Content-Type: application/json' \
  -d '{"imageUrl": "https://example.com/photo.jpg"}'
```

### Undress with pose:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H 'Content-Type: application/json' \
  -d '{"imageUrl": "https://example.com/photo.jpg", "pose": "lingerie"}'
```

### Sex pose:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H 'Content-Type: application/json' \
  -d '{"imageUrl": "https://example.com/photo.jpg", "mode": "sex-pose", "pose": "bondage"}'
```

### Custom prompt:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H 'Content-Type: application/json' \
  -d '{"imageUrl": "https://example.com/photo.jpg", "prompt": "wearing a bikini"}'
```

### Upload file:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress/upload \
  -F 'image=@photo.jpg' \
  -F 'mode=sex-pose' \
  -F 'pose=cumFace'
```

## Catatan

- Aspect ratio otomatis disesuaikan dengan gambar sumber
- Akun dibuat otomatis setiap request (email temporary via mail.tm)
- Default prompt undress: kosong (AI akan memproses sesuai pose)
- Default prompt sex-pose: prompt spesifik sesuai pose yang dipilih
- Jika `prompt` dikirim di mode undress, sistem akan switch ke `f1_undress_effects` (custom prompt engine)
- Timeout 10 menit per request
