import { uploader } from '../lib/uploader.js';

const API = 'https://undress-api-production.up.railway.app';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    let imgUrl = null;
    let prompt = null;

    if (m.mtype === 'imageMessage') {
      const buffer = await m.download();
      imgUrl = await uploader(buffer);
      prompt = text?.trim() || null;
    } else if (m.quoted?.mtype === 'imageMessage') {
      const buffer = await m.quoted.download();
      imgUrl = await uploader(buffer);
      prompt = text?.trim() || null;
    } else if (text?.trim().startsWith('http')) {
      const parts = text.trim().split(/\s+/);
      imgUrl = parts[0];
      prompt = parts.slice(1).join(' ') || null;
    }

    if (!imgUrl) {
      m.reply(`_*› Usage:*_ ${usedPrefix}${command} [url] [prompt]`);
      return;
    }
    
    await m.reply('_*› ᴘʀᴏᴄᴇssɪɴɢ ɴᴀᴋᴇᴅ . . .*_');
    
    const body = { imageUrl: imgUrl };
    if (prompt) body.prompt = prompt;

    try {
      const res = await fetch(`${API}/api/undress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300000)
      });

      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = null; }

      if (!data || !data.success) {
        m.reply(`Error: ${data?.error || 'API unreachable, try again'}`);
        return;
      }

      const img = Buffer.from(data.data.image_base64, 'base64');
      await conn.sendFile(m.chat, img, 'result.jpg', '', m);
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        m.reply('⏱️ *Timeout!* API lambat, coba lagi nanti');
      } else {
        m.reply(`Network Error: ${fetchError.message}`);
      }
    }
  } catch (e) {
    m.reply(`Error: ${e.message || 'Unknown'}`);
  }
};

handler.help = ['bugil *( kirim gambar )*'];
handler.tags = ['ai-nsfw'];
handler.command = ['undres', 'undress', 'naked', 'bugil', 'tobugil', 'bugilin', 'telanjang', 'telanjangin'];
handler.owner = true;

export default handler;
