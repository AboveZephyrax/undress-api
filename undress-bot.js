const API = 'https://undress-api-production.up.railway.app';

const handler = async (m) => {
  try {
    const text = m.text || '';
    const args = text.split(' ');
    const imgUrl = args[1];

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
    const data = await res.json();

    if (!data.success) {
      m.reply(`Error: ${data.error}`);
      return;
    }

    const img = Buffer.from(data.data.image_base64, 'base64');
    await m.reply({ image: img, caption: 'Done!' });
  } catch (e) {
    m.reply(`Error: ${e.message}`);
  }
};

handler.help = ['aiundress'];
handler.tags = ['tools'];
handler.command = ['aiundress'];

export default handler;
