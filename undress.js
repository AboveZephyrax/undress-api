import https from 'https';
import http from 'http';

const MAIL_API = 'https://api.mail.tm';
const TARGET = 'https://ai-undress.ai';
const TARGET_IP = '216.150.1.1';

const rand = (n) => {
  let r = '';
  for (let i = 0; i < n; i++) r += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)];
  return r;
};


const getImageSize = (buf) => {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2;
    while (i < buf.length - 1) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const m = buf[i + 1];
      if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
      }
      if (m === 0xD9 || m === 0xDA) break;
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  if (buf.readUInt32BE(0) === 0x52494646 && buf.readUInt32BE(8) === 0x57454250) {
    if (buf[15] === 0x20) return { w: buf.readUInt16LE(26) & 0x3FFF, h: buf.readUInt16LE(28) & 0x3FFF };
    if (buf[15] === 0x4C) { const s = buf.readUInt32LE(18); return { w: (s & 0x3FFF) + 1, h: ((s >> 14) & 0x3FFF) + 1 }; }
  }
  return null;
};

const httpsReq = (host, port, path, method, headers, body) => {
  return new Promise((resolve, reject) => {
    const mod = port === 443 ? https : http;
    const h = { ...headers };
    if (body) h['content-length'] = Buffer.byteLength(body);
    const chunks = [];
    const req = mod.request({ hostname: host, port, path, method, rejectUnauthorized: false, headers: h }, (res) => {
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), url: res.headers.location || '' }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

const trpc = async (path, headers, body) => {
  const isPost = !!body;
  const b = body ? JSON.stringify(body) : null;
  const res = await new Promise((resolve, reject) => {
    const chunks = [];
    const req = https.request({
      hostname: TARGET_IP, port: 443, path, method: isPost ? 'POST' : 'GET',
      servername: 'ai-undress.ai', rejectUnauthorized: true,
      headers: {
        host: 'ai-undress.ai', 'user-agent': 'Mozilla/5.0 (Android)',
        accept: '*/*', ...headers,
        ...(isPost ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(b || '') } : {})
      }
    }, (res) => {
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }));
    });
    req.on('error', reject);
    if (b) req.write(b);
    req.end();
  });
  if (res.status !== 200) throw new Error('trpc ' + path + ': ' + res.status);
  const r = res.data?.[0]?.result?.data?.json;
  if (res.data?.[0]?.error) throw new Error(res.data[0].error.message);
  return r;
};

const getMailDomain = async () => {
  const d = await (await fetch(MAIL_API + '/domains')).json();
  const m = d['hydra:member']?.find(d => d.isActive && !d.isPrivate);
  if (!m) throw new Error('No domain');
  return m.domain;
};

const createMail = async () => {
  const domain = await getMailDomain();
  const user = rand(8), pass = rand(12);
  const addr = user + '@' + domain;
  const r = await (await fetch(MAIL_API + '/accounts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: addr, password: pass }) })).json();
  if (!r.id) throw new Error('Mail failed');
  const t = (await (await fetch(MAIL_API + '/token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: addr, password: pass }) })).json()).token;
  return { address: addr, password: pass, token: t };
};

const waitOtp = async (token) => {
  const start = Date.now();
  while (Date.now() - start < 150000) {
    const msgs = await (await fetch(MAIL_API + '/messages', { headers: { authorization: 'Bearer ' + token } })).json();
    const list = msgs['hydra:member'] || [];
    if (list.length) {
      const m = await (await fetch(MAIL_API + '/messages/' + list[0].id, { headers: { authorization: 'Bearer ' + token } })).json();
      const txt = [m.subject, m.text, (m.html?.[0] || '').replace(/<[^>]*>/g, ' ')].filter(Boolean).join(' ');
      const otp = txt.match(/\b(\d{6})\b/);
      if (otp) return otp[1];
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('OTP timeout');
};

const getCfToken = async () => {
  const res = await fetch('https://api.blckrose.my.id/bypass/turnstile-min?url=' + encodeURIComponent(TARGET) + '&siteKey=0x4AAAAAADPFLZJFuHj6IioC&apikey=abovezephyrax');
  const d = await res.json();
  return d.token || d.result?.token || d.result;
};

const cookie = (session) => 'NEXT_LOCALE=id' + (session ? '; auth_session=' + session : '');
const ref = (p) => TARGET + p;

export const createAccount = async () => {
  const mail = await createMail();
  const cf = await getCfToken();
  if (!cf) throw new Error('Turnstile failed');

  await trpc('/api/trpc/auth.signup?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/auth/signup'), cookie: cookie() }, {
    '0': { json: { email: mail.address, password: mail.password, callbackUrl: TARGET + '/auth/verify', turnstileToken: cf, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, clickId: null }, meta: { values: { utmSource: ['undefined'], utmMedium: ['undefined'], utmCampaign: ['undefined'], utmContent: ['undefined'], clickId: ['undefined'] } } }
  });

  const otpPath = '/id/auth/otp?type=SIGNUP&redirectTo=%2F&identifier=' + encodeURIComponent(mail.address);
  await httpsReq(TARGET_IP, 443, otpPath, 'GET', { Host: 'ai-undress.ai', 'User-Agent': 'Mozilla/5.0', Cookie: cookie() });
  await new Promise(r => setTimeout(r, 3000));

  const sessionId = await trpc('/api/trpc/auth.verifyOtp?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref(otpPath), cookie: cookie() }, {
    '0': { json: { code: await waitOtp(mail.token), type: 'SIGNUP', identifier: mail.address } }
  });
  if (!sessionId?.id) throw new Error('No session');

  const user = await trpc('/api/trpc/auth.user?batch=1&input=' + encodeURIComponent(JSON.stringify({ '0': { json: null, meta: { values: ['undefined'] } } })), { cookie: cookie(sessionId.id) });

  return { email: mail.address, password: mail.password, credits: user.credits, user_id: user.id, session: sessionId.id };
};

export const undressImage = async (session, userId, imageBuf) => {
  const path = 'temp/' + userId + '/' + Date.now() + '/original.jpg';
  const signed = await trpc('/api/trpc/uploads.signedUploadUrl?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=undress'), cookie: cookie(session) }, { '0': { json: { path }, meta: { values: {} } } });

  const up = new URL(signed);
  const upload = await httpsReq(up.hostname, 443, up.pathname + up.search, 'PUT', { 'Content-Type': 'image/jpeg', 'user-agent': 'Mozilla/5.0' }, imageBuf);
  if (upload.status !== 200) throw new Error('Upload failed: ' + upload.status);

  const cdnUrl = 'https://cdn.treekee.com/ai-undress/' + path;
  const imgSize = getImageSize(imageBuf);
  const aspectRatio = imgSize ? (() => {
    const ar = imgSize.w / imgSize.h;
    const ratios = [{"r":"1:1","v":1},{"r":"3:4","v":0.75},{"r":"4:3","v":1.3333333333333333},{"r":"9:16","v":0.5625},{"r":"16:9","v":1.7777777777777777},{"r":"2:3","v":0.6666666666666666},{"r":"3:2","v":1.5}];
    return ratios.reduce((a, b) => Math.abs(a.v - ar) < Math.abs(b.v - ar) ? a : b).r;
  })() : '1:1';
  const apiParams = { url: cdnUrl, prompt: 'Make the characters in the image nude,no clothes, naked', imageQuality: 'HD', styleMode: false, aspectRatio };
  const taskId = await trpc('/api/trpc/workflow.runTask?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=sex-pose'), cookie: cookie(session) }, {
    '0': { json: { businessType: 'f1_undress_effects', apiParams }, meta: { values: {} } }
  });

  for (let i = 0; i < 60; i++) {
    const r = await trpc('/api/trpc/workflow.getOrderTaskResult?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=undress'), cookie: cookie(session) }, { '0': { json: { taskId: taskId.taskId }, meta: { values: {} } } });
    if (r.status === 'COMPLETED') {
      const u = new URL(r.result_url);
      const dl = await httpsReq(u.hostname, u.protocol === 'https:' ? 443 : 80, u.pathname + u.search, 'GET', {});
      return { buffer: dl.body, url: r.result_url };
    }
    if (r.status === 'FAILED') throw new Error('Task failed');
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Task timeout');
};
