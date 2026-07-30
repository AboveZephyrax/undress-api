import express from 'express';
import multer from 'multer';
import { createAccount, undressImage } from './undress.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/account', async (req, res) => {
  try {
    const acct = await createAccount();
    res.json({ success: true, data: acct });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/undress', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ success: false, error: 'imageUrl required' });

    const acct = await createAccount();
    const img = Buffer.from(await (await fetch(imageUrl)).arrayBuffer());
    const result = await undressImage(acct.session, acct.user_id, img);

    res.json({
      success: true,
      data: {
        account: { email: acct.email, credits: acct.credits },
        result_url: result.url,
        image_base64: result.buffer.toString('base64')
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/undress/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'image required' });

    const acct = await createAccount();
    const result = await undressImage(acct.session, acct.user_id, req.file.buffer);

    res.json({
      success: true,
      data: {
        account: { email: acct.email, credits: acct.credits },
        result_url: result.url,
        image_base64: result.buffer.toString('base64')
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Undress API running on port ' + PORT));
