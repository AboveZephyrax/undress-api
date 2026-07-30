# Undress API

REST API for ai-undress.ai with auto account creation and OTP verification.

## Endpoints

### POST /api/undress
Undress an image from URL.

Request:
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Optional custom prompt (default: Make the characters in the image nude, no clothes, naked)"
}
```

Response:
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

### POST /api/undress/upload
Undress via file upload (multipart).

| Field | Type | Description |
|-------|------|-------------|
| image | File | JPEG/PNG, max 10MB |
| prompt | String | Optional custom prompt |

### POST /api/account
Create temp account only.

### GET /health
Health check.

## Aspect Ratios
Auto-detected: 1:1, 3:4, 4:3, 9:16, 16:9, 2:3, 3:2

## Deploy
1. Fork/clone this repo
2. Deploy on Railway / Zeabur / Render
3. PORT env optional (default 3000)
