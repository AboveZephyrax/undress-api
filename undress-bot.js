const API = 'https://undress-api-production.up.railway.app';

const handler = async (m, { conn, text }) => {
  try {
    const imgUrl = text?.trim();

    if (!imgUrl || !imgUrl.startsWith('http')) {
      m.reply('Usage: .aiundress <image_url>');
      return;
    }

    m.reply('Processing...');
    const res = await fetch(`${API}/api/undress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: imgUrl })
    });

    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }

    if (!data || !data.success) {
      m.reply(`Error: ${data?.error || 'API unreachable, try again'}`);
      return;
    }

    const img = Buffer.from(data.data.image_base64, 'base64');
    await conn.sendFile(m.chat, img, 'result.jpg', 'Done!', m);
  } catch (e) {
    m.reply(`Error: ${e.message || 'Unknown'}`);
  }
};

handler.help = ['aiundress'];
handler.tags = ['tools'];
handler.command = ['aiundress'];

export default handler;
