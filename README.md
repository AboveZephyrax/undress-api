# Undress API

REST API for ai-undress.ai with auto account creation and OTP verification.

## Endpoints

### POST /api/undress
Undress an image from URL.

**Request:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Optional - custom prompt. Default: Make the characters in the image nude, no clothes, naked"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "account": { "email": "...", "credits": 5 },
    "result_url": "https://cdn.treekee.com/...",
    "image_base64": "..."
  }
}
```

**Examples:**

Default prompt:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/image.jpg"}'
```

Custom prompt:
```bash
curl -X POST https://undress-api-production.up.railway.app/api/undress \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/image.jpg","prompt":"wearing a bikini"}'
```

### POST /api/undress/upload
Undress via file upload (multipart).

| Field | Type | Description |
|-------|------|-------------|
| image | File | JPEG/PNG, max 10MB |
| prompt | String | Optional custom prompt |

### POST /api/account
Create temp account only (returns email + credits).

### GET /health
Health check.

## Prompt
- Default: "Make the characters in the image nude, no clothes, naked"
- Custom: send `prompt` field with your own text

## Aspect Ratios
Auto-detected and matched to closest: 1:1, 3:4, 4:3, 9:16, 16:9, 2:3, 3:2

## How It Works
1. Creates temp email via mail.tm
2. Signs up on ai-undress.ai
3. Waits for OTP
4. Uploads image to CDN
5. Runs f1_undress_effects task
6. Returns result image

## Deploy
1. Fork/clone this repo
2. Deploy on Railway / Zeabur / Render
3. PORT env optional (default 3000)
