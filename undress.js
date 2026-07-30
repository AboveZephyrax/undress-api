import https from 'https';
import http from 'http';

const MAIL_API = 'https://api.mail.tm';
const TARGET = 'https://ai-undress.ai';
const TARGET_IP = '216.150.1.1';

const POSES = {
  undress: {
    undress:         { bt: 'sd_clothes_prompt_changer_auto_undress',           label: 'Undress' },
    bigBreasts:      { bt: 'sd_clothes_prompt_changer_auto_breast_enlargement', label: 'Big Breasts' },
    pregnant:        { bt: 'sd_clothes_prompt_changer_auto_pregnancy',          label: 'Pregnant' },
    wedding:         { bt: 'sd_clothes_prompt_changer_auto_wedding_dress',      label: 'Wedding' },
    maid:            { bt: 'sd_clothes_prompt_changer_auto_maid_outfit',        label: 'Maid' },
    jk:              { bt: 'sd_clothes_prompt_changer_auto_jk_uniform',         label: 'JK' },
    slim:            { bt: 'sd_clothes_prompt_changer_auto_thin',               label: 'Slim' },
    curvy:           { bt: 'sd_clothes_prompt_changer_auto_fat',                label: 'Curvy' },
    lingerie:        { bt: 'sd_lingerie_with_auto',                             label: 'Lingerie' },
    towel:           { bt: 'sd_towel_with_auto',                                label: 'Towel' },
    chineseDress:    { bt: 'sd_chinese_dress_with_auto',                        label: 'Chinese Dress' },
    bandeau:         { bt: 'sd_bandeau_with_auto',                              label: 'Bandeau' },
    microBikini:     { bt: 'sd_mini_micro_bikini_with_auto',                    label: 'Micro Bikini' },
    tattoo:          { bt: 'sd_tattoo_with_auto',                               label: 'Tattoo' },
    schoolSwimsuit:  { bt: 'sd_school_swimsuit_with_auto',                      label: 'School Swimsuit' },
    leatherBikini:   { bt: 'sd_leather_bikini_with_auto',                       label: 'Leather Bikini' },
    microBikiniTattoo:{ bt: 'sd_mini_micro_bikini_tattoo_with_auto',            label: 'Micro Bikini Tattoo' },
    animation:       { bt: 'sd_animation_auto',                                 label: 'Anime Style' },
  },
  'sex-pose': {
    orgasmFace:      { bt: 'sd_orgasm_face_with_auto',       label: 'Orgasm Face',
      dp: 'nude,no clothes, naked and orgasm face,female orgasm,orgasm, solo, open mouth, Expression of enjoyment' },
    cumFace:         { bt: 'sd_cum_face_with_auto',          label: 'Cum Face',
      dp: 'nude,no clothes, naked and cum on face and neck, covered in cum, cum in mouth, cum on tongue, cum on tits, cum on neck and collarbones, facial cumshot, cum on cleavage, mouth open, Ahegao' },
    cumOnClothes:    { bt: 'sd_cum_on_clothes_with_auto',    label: 'Cum on Clothes',
      dp: 'cum on characters clothes and neck, cum on cleavage' },
    mouthCum:        { bt: 'sd_mouth_cum_with_auto',         label: 'Mouth Cum',
      dp: 'open mouth, cum in mouth, cum on tongue, tongue out, cum' },
    pussyHair:       { bt: 'sd_pussy_hair_with_auto',        label: 'Pussy Hair',
      dp: 'nude,no clothes, naked and lying on her back with both knees bent, female pubic hair' },
    ballGag:         { bt: 'sd_gagged_mouth_with_auto',      label: 'Ball Gag',
      dp: 'nude,no clothes, naked and ball gag, gagged mouth' },
    bondage:         { bt: 'sd_bondage_with_auto',           label: 'Bondage',
      dp: 'nude,no clothes, naked and shibari, japanese bondage, rope' },
    chainTraction:   { bt: 'sd_chain_traction_with_auto',    label: 'Chain Traction',
      dp: 'nude,no clothes, naked and on a leash, wearing a collar around her neck' },
    nudeApron:       { bt: 'sd_nude_apron_with_auto',        label: 'Nude Apron',
      dp: 'Replace the clothes of the people in the image with a Apron, naked, personality, kitchen style, bare skin' },
    wetShirt:        { bt: 'sd_wet_shirt_with_auto',         label: 'Wet Shirt',
      dp: 'Replace the clothes of the people in the image with a sheer see through wet white shirt' },
    milkBath:        { bt: 'sd_milk_bath_with_auto',         label: 'Milk Bath',
      dp: 'nude,no clothes, naked in a bathtub, MilkyBathe, Bathtub, Milk Bath' },
    crotchlessPants: { bt: 'sd_open_crotch_pantyhose_auto',  label: 'Crotchless Pants',
      dp: 'Replace the clothes with crotchless pants, crotchless pantyhose' },
    fingering:       { bt: 'sd_fingering_auto',              label: 'Fingering',
      dp: 'nude,no clothes, naked lying in bed, Insert 2 two fingers of her right hand into her vagina' },
    cumBody:         { bt: 'sd_naked_body_auto',             label: 'Cum Body',
      dp: 'nude,no clothes, naked and cum on characters body, cum on characters pussy' },
    nippleClamps:    { bt: 'sd_nipple_clamps_with_auto',     label: 'Nipple Clamps',
      dp: 'nude,no clothes, naked and with breastclamp, nipple clamps' },
  }
};

const ALL_POSES = {};
for (const [mode, poses] of Object.entries(POSES)) {
  for (const [key, val] of Object.entries(poses)) {
    val.key = key;
    val.mode = mode;
    ALL_POSES[key] = val;
    ALL_POSES[mode + '/' + key] = val;
  }
}

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
    const opts = { hostname: host, port, path, method, rejectUnauthorized: false, headers: h };
    if (host === '216.150.1.1' || host === 'ai-undress.ai') opts.servername = 'ai-undress.ai';
    const req = mod.request(opts, (res) => {
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
  // Also trigger via trpc as backup
  try { await trpc('/api/trpc/auth.sendOtp?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: TARGET + otpPath, cookie: cookie() }, { '0': { json: { type: 'SIGNUP', identifier: mail.address }, meta: { values: {} } } }); } catch (e) {}
  await new Promise(r => setTimeout(r, 3000));

  const sessionId = await trpc('/api/trpc/auth.verifyOtp?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref(otpPath), cookie: cookie() }, {
    '0': { json: { code: await waitOtp(mail.token), type: 'SIGNUP', identifier: mail.address } }
  });
  if (!sessionId?.id) throw new Error('No session');

  const user = await trpc('/api/trpc/auth.user?batch=1&input=' + encodeURIComponent(JSON.stringify({ '0': { json: null, meta: { values: ['undefined'] } } })), { cookie: cookie(sessionId.id) });

  return { email: mail.address, password: mail.password, credits: user.credits, user_id: user.id, session: sessionId.id };
};

const NEEDS_POSE = {
  sd_clothes_prompt_changer_auto_undress: 1,
  sd_clothes_prompt_changer_auto_breast_enlargement: 1,
  sd_clothes_prompt_changer_auto_pregnancy: 1,
  sd_clothes_prompt_changer_auto_wedding_dress: 1,
  sd_clothes_prompt_changer_auto_maid_outfit: 1,
  sd_clothes_prompt_changer_auto_jk_uniform: 1,
  sd_clothes_prompt_changer_auto_thin: 1,
  sd_clothes_prompt_changer_auto_fat: 1,
};

export const getPoseList = () => POSES;

export const undressImage = async (session, userId, imageBuf, opts = {}) => {
  const { mode = 'undress', pose: poseKey = 'undress', prompt } = opts;
  const modePoses = POSES[mode];
  if (!modePoses) throw new Error('Invalid mode: ' + mode + '. Must be undress or sex-pose');
  const poseDef = modePoses[poseKey];
  if (!poseDef) throw new Error('Invalid pose: ' + poseKey + ' for mode: ' + mode);

  const path = 'temp/' + userId + '/' + Date.now() + '/original.jpg';
  const signed = await trpc('/api/trpc/uploads.signedUploadUrl?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=' + mode), cookie: cookie(session) }, { '0': { json: { path }, meta: { values: {} } } });

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

  let businessType = poseDef.bt;
  let apiParams;

  if (NEEDS_POSE[businessType]) {
    apiParams = { url: cdnUrl, pose: businessType, prompt: prompt ?? '', imageQuality: 'HD', styleMode: false, aspectRatio, featureSlug: 'undress' };
  } else {
    apiParams = { url: cdnUrl, prompt: prompt ?? poseDef.dp ?? 'nude,no clothes, naked', imageQuality: 'HD', styleMode: false, aspectRatio };
  }

  const taskId = await trpc('/api/trpc/workflow.runTask?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=' + mode), cookie: cookie(session) }, {
    '0': { json: { businessType, apiParams }, meta: { values: {} } }
  });

  for (let i = 0; i < 60; i++) {
    const r = await trpc('/api/trpc/workflow.getOrderTaskResult?batch=1', { 'x-trpc-source': 'client', origin: TARGET, referer: ref('/id/editor?type=' + mode), cookie: cookie(session) }, { '0': { json: { taskId: taskId.taskId }, meta: { values: {} } } });
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
