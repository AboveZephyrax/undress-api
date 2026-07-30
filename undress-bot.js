import { createAccount, undressImage } from './undress.js';

const handler = async (m) => {
  try {
    const text = m.text || '';
    const args = text.split(' ');
    const imgUrl = args[1];

    if (imgUrl && imgUrl.startsWith('http')) {
      m.reply('Creating account...');
      const acct = await createAccount();
      m.reply('Downloading image...');
      const img = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
      m.reply('Processing undress...');
      const result = await undressImage(acct.session, acct.user_id, img);
      await m.reply({ image: result.buffer, caption: 'Done!' });
      return;
    }

    const isImage = m.quoted?.message?.imageMessage || m.quoted?.message?.ptvMessage;
    if (isImage) {
      m.reply('Creating account...');
      const acct = await createAccount();
      m.reply('Downloading image...');
      const stream = await m.quoted.download();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const img = Buffer.concat(chunks);
      m.reply('Processing undress...');
      const result = await undressImage(acct.session, acct.user_id, img);
      await m.reply({ image: result.buffer, caption: 'Done!' });
      return;
    }

    const acct = await createAccount();
    m.reply(`Account: ${acct.email}\nCredits: ${acct.credits}\n\nReply to image with .aiundress`);
  } catch (e) {
    m.reply(`Error: ${e.message}`);
  }
};

handler.help = ['aiundress'];
handler.tags = ['tools'];
handler.command = ['aiundress'];

export default handler;
