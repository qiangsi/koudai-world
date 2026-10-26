'use strict';
/* 口袋世界 · 联机服务端
 * 零第三方依赖：http 静态托管 + 手写 WebSocket 握手/分帧 + JSON 文件持久化
 * 启动：node server.js        默认 0.0.0.0:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const GAMEDATA = {"types":{"flora":{"id":"flora","name":"草叶","color":"#6ec96e"},"blaze":{"id":"blaze","name":"焰心","color":"#f0864f"},"tide":{"id":"tide","name":"潮汐","color":"#5aa9e6"},"stone":{"id":"stone","name":"岩垒","color":"#c0a878"},"gale":{"id":"gale","name":"疾风","color":"#a78bfa"}},"chart":{"flora":{"tide":1.6,"stone":1.6,"blaze":0.6,"gale":0.6},"blaze":{"flora":1.6,"gale":1.6,"tide":0.6,"stone":0.6},"tide":{"blaze":1.6,"stone":1.6,"flora":0.6,"gale":0.6},"stone":{"blaze":1.6,"gale":1.6,"flora":0.6,"tide":0.6},"gale":{"flora":1.6,"tide":1.6,"stone":0.6,"blaze":0.6}},"moves":{"tengman":{"name":"藤蔓缠","type":"flora","power":35,"acc":1,"pp":30},"yeren":{"name":"叶刃","type":"flora","power":45,"acc":0.95,"pp":25},"huami":{"name":"花蜜吐息","type":"flora","power":50,"acc":0.92,"pp":18},"luoye":{"name":"落叶乱舞","type":"flora","power":62,"acc":0.85,"pp":10},"meihui":{"name":"煤灰扑","type":"blaze","power":32,"acc":1,"pp":30},"huohua":{"name":"火花","type":"blaze","power":42,"acc":0.98,"pp":25},"tangzhao":{"name":"烫焰爪","type":"blaze","power":52,"acc":0.92,"pp":16},"chifeng":{"name":"炽风","type":"blaze","power":64,"acc":0.85,"pp":10},"paomoyao":{"name":"泡沫咬","type":"tide","power":36,"acc":1,"pp":30},"shuibao":{"name":"水泡弹","type":"tide","power":44,"acc":0.98,"pp":25},"chaoyong":{"name":"潮涌","type":"tide","power":55,"acc":0.92,"pp":15},"wolun":{"name":"涡流冲","type":"tide","power":66,"acc":0.85,"pp":8},"yanci":{"name":"岩刺","type":"stone","power":38,"acc":1,"pp":30},"suishi":{"name":"碎石击","type":"stone","power":46,"acc":0.95,"pp":25},"yingke":{"name":"硬壳顶","type":"stone","power":52,"acc":0.95,"pp":16},"gunshi":{"name":"滚石压","type":"stone","power":64,"acc":0.85,"pp":10},"jiyu":{"name":"疾羽","type":"gale","power":34,"acc":1,"pp":30},"fengren":{"name":"风刃","type":"gale","power":42,"acc":0.95,"pp":25},"kongqi":{"name":"空音波","type":"gale","power":50,"acc":0.95,"pp":16},"xuanfeng":{"name":"旋风卷","type":"gale","power":60,"acc":0.88,"pp":12},"pinyin":{"name":"拼命撞","type":"none","power":32,"acc":1,"pp":0}},"species":{"taichou":{"name":"苔球兽","type":"flora","base":{"hp":46,"atk":50,"def":48,"spd":46},"catch":150,"exp":12,"evolve":{"to":"taiguan","lv":9},"learn":[{"lv":1,"m":"tengman"},{"lv":1,"m":"yeren"},{"lv":2,"m":"huami"},{"lv":5,"m":"luoye"}]},"taiguan":{"name":"苔冠兽","type":"flora","base":{"hp":62,"atk":68,"def":70,"spd":58},"catch":55,"exp":26,"evolve":null,"learn":[{"lv":1,"m":"yeren"},{"lv":1,"m":"tengman"},{"lv":12,"m":"huami"},{"lv":15,"m":"luoye"}]},"yanwei":{"name":"焰尾貂","type":"blaze","base":{"hp":44,"atk":54,"def":42,"spd":56},"catch":150,"exp":12,"evolve":{"to":"yanzong","lv":9},"learn":[{"lv":1,"m":"huohua"},{"lv":1,"m":"meihui"},{"lv":2,"m":"tangzhao"},{"lv":5,"m":"chifeng"}]},"yanzong":{"name":"焰鬃貂","type":"blaze","base":{"hp":60,"atk":74,"def":58,"spd":72},"catch":55,"exp":26,"evolve":null,"learn":[{"lv":1,"m":"tangzhao"},{"lv":1,"m":"huohua"},{"lv":12,"m":"chifeng"},{"lv":16,"m":"meihui"}]},"dilu":{"name":"滴露蛙","type":"tide","base":{"hp":48,"atk":48,"def":50,"spd":44},"catch":150,"exp":12,"evolve":{"to":"yongquan","lv":9},"learn":[{"lv":1,"m":"shuibao"},{"lv":1,"m":"paomoyao"},{"lv":2,"m":"chaoyong"},{"lv":5,"m":"wolun"}]},"yongquan":{"name":"涌泉蛙","type":"tide","base":{"hp":66,"atk":66,"def":70,"spd":56},"catch":55,"exp":26,"evolve":null,"learn":[{"lv":1,"m":"chaoyong"},{"lv":1,"m":"shuibao"},{"lv":12,"m":"wolun"},{"lv":16,"m":"paomoyao"}]},"yati":{"name":"芽蹄鹿","type":"flora","base":{"hp":52,"atk":52,"def":48,"spd":52},"catch":110,"exp":16,"evolve":null,"learn":[{"lv":1,"m":"yeren"},{"lv":1,"m":"tengman"},{"lv":3,"m":"huami"},{"lv":9,"m":"luoye"}]},"tanjiao":{"name":"炭角羊","type":"blaze","base":{"hp":56,"atk":58,"def":54,"spd":40},"catch":100,"exp":18,"evolve":null,"learn":[{"lv":1,"m":"huohua"},{"lv":1,"m":"meihui"},{"lv":3,"m":"tangzhao"},{"lv":9,"m":"chifeng"}]},"langwen":{"name":"浪纹鲵","type":"tide","base":{"hp":54,"atk":50,"def":52,"spd":56},"catch":105,"exp":17,"evolve":null,"learn":[{"lv":1,"m":"shuibao"},{"lv":1,"m":"paomoyao"},{"lv":3,"m":"chaoyong"},{"lv":9,"m":"wolun"}]},"lijia":{"name":"砾甲虫","type":"stone","base":{"hp":50,"atk":56,"def":66,"spd":34},"catch":115,"exp":16,"evolve":null,"learn":[{"lv":1,"m":"yanci"},{"lv":1,"m":"suishi"},{"lv":3,"m":"yingke"},{"lv":9,"m":"gunshi"}]},"chenwei":{"name":"尘尾鼬","type":"stone","base":{"hp":58,"atk":64,"def":56,"spd":62},"catch":85,"exp":24,"evolve":null,"learn":[{"lv":1,"m":"suishi"},{"lv":1,"m":"yanci"},{"lv":4,"m":"yingke"},{"lv":10,"m":"gunshi"}]},"jifei":{"name":"疾羽雀","type":"gale","base":{"hp":46,"atk":54,"def":44,"spd":64},"catch":120,"exp":15,"evolve":null,"learn":[{"lv":1,"m":"jiyu"},{"lv":1,"m":"fengren"},{"lv":3,"m":"kongqi"},{"lv":9,"m":"xuanfeng"}]},"rongxiao":{"name":"绒尾枭","type":"gale","base":{"hp":60,"atk":60,"def":56,"spd":58},"catch":80,"exp":25,"evolve":null,"learn":[{"lv":1,"m":"fengren"},{"lv":1,"m":"jiyu"},{"lv":4,"m":"kongqi"},{"lv":10,"m":"xuanfeng"}]}},"items":{"lingqiu":{"name":"灵球","price":60,"ball":1,"heal":0},"yinlingqiu":{"name":"银灵球","price":170,"ball":1.55,"heal":0},"yaoshui":{"name":"疗愈药水","price":40,"ball":1,"heal":30},"nongyao":{"name":"浓缩药水","price":110,"ball":1,"heal":75}},"maps":{"town":{"name":"青禾镇","rows":["TTTTTTTTTTTTTTTTTTTTTT","T,,,,,,,,,,,,,,,,,,,,T","T,,HHHHH,,,,,HHHHH,,,T","T,,HHHHH,,,,,HHHHH,,,T","T,,HDDDH,,,,,HDDDH,,,T","T,,,,,,,,..,,,,,,,,,,T","T,,S,,,,,..,,,,,,,,,,T","T,,,,,,,,..,,,,,,,,,,T","T,,,C,,,,..,,,A,,,,,,T","T,,,,,,,,..,,,,,,,,,,T","T,,GGGG,,,..,,,GGGG,,T","T,,GGGG,,,..,,,GGGG,,T","T,,,,,,,,..,,,,,,,,,,T","T,,,,,,,,..,,,,,,,,,,T","TTTTTTTTTT===TTTTTTTTT","TTTTTTTTTTTTTTTTTTTTTT"],"exits":{"10,14":{"to":"meadow","x":11,"y":1,"dir":"down"},"11,14":{"to":"meadow","x":12,"y":1,"dir":"down"},"12,14":{"to":"meadow","x":13,"y":1,"dir":"down"}},"enc":{"rate":0.1,"table":[{"sp":"yati","w":3,"lv":[2,4]},{"sp":"jifei","w":3,"lv":[2,4]},{"sp":"lijia","w":2,"lv":[2,5]}]}},"meadow":{"name":"萤草坡","rows":["TTTTTTTTTTT===TTTTTTTTTT","T,,,,,,,,,,,,,,,,,,,,,,T","T,,GGGG,,,,,GGGG,,,,,,,T","T,,GGGG,,,,,GGGG,,,,,,,T","T,,,,,,,,,..,,,,,,,,,,,T","T,,,,,,,TT,..,,,,,,,,,,T","T,GGG,,,,,,..,,,,GGG,,,T","T,GGG,,,,WWWW,,,GGG,,,,T","T,GGG,,,WWWWWW,,GGG,,,,=","T,,,,,,,WWWWWW,,,,,,,,,=","T,,,,,,,,WWWW,,,,,,,,,,T","T,,GGGGG,,,,,,,,GGGGG,,T","T,,GGGGG,,,,,,,,GGGGG,,T","T,,,,,,,,,,,,,,,,,,,,,,T","T,,,,TT,,,,,,TT,,,,,,,,T","T,,,,,,,,,..,,,,,,,,,,,T","T,,,,,,,,,..,,,,,,,,,,,T","TTTTTTTTTTTTTTTTTTTTTTTT"],"exits":{"11,0":{"to":"town","x":10,"y":13,"dir":"up"},"12,0":{"to":"town","x":11,"y":13,"dir":"up"},"13,0":{"to":"town","x":12,"y":13,"dir":"up"},"23,8":{"to":"grove","x":1,"y":8,"dir":"right"},"23,9":{"to":"grove","x":1,"y":9,"dir":"right"}},"enc":{"rate":0.13,"table":[{"sp":"yati","w":3,"lv":[2,5]},{"sp":"jifei","w":3,"lv":[2,5]},{"sp":"tanjiao","w":3,"lv":[3,6]},{"sp":"langwen","w":3,"lv":[3,6]},{"sp":"lijia","w":2,"lv":[3,6]}]}},"grove":{"name":"碎星林","rows":["TTTTTTTTTTTTTTTTTTTTTTTT","T,,,,,,,,,,,,,,,,,,,,,,T","T,TTTT,,,GGGGG,,,,TTTT,T","T,TTTT,,,GGGGG,,,,TTTT,T","T,,,,,,,,GGGGG,,,,,,,,,T","T,,,,WWWW,,,,,,,,,,,WWW,","T,,,,WWWW,,,TTTT,,,,WWW,","T,,,,,,,,,,,TTTT,,,,,,,,","=,,,,,,,,,,,,,,,,,,,,,,,","=,,,,,,,,,,,,,,,,,,,,TTT,","T,,,,GGGGG,,,,,GGGGG,,,T","T,,,,GGGGG,,,,,GGGGG,,,T","T,,,TTTTTT,,,,,TTTTT,,,T","T,,,,,,,,,,,GGGG,,,,,,,T","T,,,,,,,,,,,GGGG,,,,,,,T","T,,,,,,,,,,,,,,,,,,,,,,T","T,,,,,,,,,,,,,,,,,,,,,,T","TTTTTTTTTTTTTTTTTTTTTTTT"],"exits":{"0,8":{"to":"meadow","x":22,"y":8,"dir":"left"},"0,9":{"to":"meadow","x":22,"y":9,"dir":"left"}},"enc":{"rate":0.14,"table":[{"sp":"chenwei","w":3,"lv":[7,11]},{"sp":"rongxiao","w":3,"lv":[8,12]},{"sp":"langwen","w":2,"lv":[6,9]},{"sp":"tanjiao","w":2,"lv":[6,9]},{"sp":"taiguan","w":1,"lv":[11,12]}]}}},"starters":["taichou","yanwei","dilu"]};
const { types: TYPES, chart: CHART, moves: MOVES, species: SPECIES, items: ITEMS, maps: MAPS, starters: STARTERS } = GAMEDATA;

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const SAVE_FILE = path.join(DATA_DIR, 'players.json');
const CLIENT_FILE = '口袋世界-联机版.html';
const BLOCKED = 'TWHDSxCRA';
const TICK_MS = 80;                  // 12.5Hz 位置广播
const CHAT_MAX = 120;                // 单条字数上限
const CHAT_BURST = 5, CHAT_WINDOW = 10000;

/* ---------------- 数值：与客户端保持一致 ---------------- */
function statsOf(mon) {
  const b = SPECIES[mon.sp].base, L = mon.lvl;
  return {
    hp: Math.floor(2 * b.hp * L / 100) + L + 12,
    atk: Math.floor(2 * b.atk * L / 100) + 5,
    def: Math.floor(2 * b.def * L / 100) + 5,
    spd: Math.floor(2 * b.spd * L / 100) + 5
  };
}
const maxHpOf = (mon) => statsOf(mon).hp;
const expToNext = (lvl) => Math.round(18 + 1.6 * lvl * lvl + 5 * lvl);

function movesFor(sp, lvl) {
  let list = [];
  SPECIES[sp].learn.forEach((e) => { if (e.lv <= lvl && list.indexOf(e.m) < 0) list.push(e.m); });
  if (list.length > 4) list = list.slice(list.length - 4);
  if (!list.length) list = ['pinyin'];
  return list.map((id) => ({ id, pp: MOVES[id].pp }));
}
function makeMon(sp, lvl) {
  const mon = { sp, lvl, exp: 0, hp: 0, moves: movesFor(sp, lvl) };
  mon.hp = maxHpOf(mon);
  return mon;
}
function typeMult(a, d) {
  if (!a || !d || a === 'none') return 1;
  const row = CHART[a];
  if (!row) return 1;
  const v = row[d];
  return v === undefined ? 1 : v;
}
function learnMoves(mon) {
  SPECIES[mon.sp].learn.forEach((e) => {
    if (e.lv !== mon.lvl) return;
    if (mon.moves.some((m) => m.id === e.m)) return;
    const rec = { id: e.m, pp: MOVES[e.m].pp };
    if (mon.moves.length < 4) mon.moves.push(rec); else mon.moves[0] = rec;
  });
}
function growMon(mon, amount) {
  mon.exp += amount;
  let ups = 0;
  while (mon.exp >= expToNext(mon.lvl) && mon.lvl < 60) {
    mon.exp -= expToNext(mon.lvl);
    const oldMax = maxHpOf(mon);
    mon.lvl++;
    mon.hp = Math.min(maxHpOf(mon), mon.hp + (maxHpOf(mon) - oldMax));
    learnMoves(mon);
    ups++;
  }
  const evo = SPECIES[mon.sp].evolve;
  if (evo && mon.lvl >= evo.lv) {
    const oldMax = maxHpOf(mon);
    mon.sp = evo.to;
    mon.hp = Math.min(maxHpOf(mon), mon.hp + (maxHpOf(mon) - oldMax));
    learnMoves(mon);
  }
  return ups;
}
function computeDamage(atkMon, defMon, mv, rng) {
  const a = statsOf(atkMon), d = statsOf(defMon);
  const eff = mv.type && mv.type !== 'none' ? typeMult(mv.type, SPECIES[defMon.sp].type) : 1;
  const stab = mv.type && mv.type === SPECIES[atkMon.sp].type ? 1.3 : 1;
  const crit = rng() < 1 / 16 ? 1.5 : 1;
  const roll = 0.86 + rng() * 0.15;
  const raw = ((2 * atkMon.lvl / 5 + 2) * mv.power * a.atk / Math.max(1, d.def)) / 50 + 2;
  return { dmg: Math.max(1, Math.floor(raw * eff * stab * crit * roll)), eff, crit: crit > 1 };
}
function catchChance(sp, lvl, hpRatio, ball) {
  const base = SPECIES[sp].catch / 255;
  const bonus = (ITEMS[ball] && ITEMS[ball].ball) || 1;
  const lvFactor = Math.max(0.72, Math.min(1, 1 - (lvl - 5) * 0.015));
  return Math.max(0.04, Math.min(0.95, hpRatio * base * bonus * 1.65 * lvFactor));
}

/* ---------------- 存档 ---------------- */
let store = { version: 1, seq: 1, players: {} };
function loadStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(SAVE_FILE)) {
      const d = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
      if (d && d.players) { store = d; store.seq = store.seq || 1; }
    }
  } catch (e) { console.error('[存档] 读取失败，从空档开始：', e.message); }
}
let saveTimer = null;
function saveStore() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(SAVE_FILE, JSON.stringify(store), 'utf8');
    } catch (e) { console.error('[存档] 写入失败：', e.message); }
  }, 400);
}
function saveNow() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SAVE_FILE, JSON.stringify(store), 'utf8');
  } catch (e) { console.error('[存档] 写入失败：', e.message); }
}

/* ---------------- 玩家档案 ---------------- */
function newProfile(name, starter) {
  const pid = 'p' + (store.seq++).toString(36) + crypto.randomBytes(3).toString('hex');
  const sp = STARTERS.indexOf(starter) >= 0 ? starter : STARTERS[0];
  const party = [makeMon(sp, 5)];
  return {
    pid, name, token: crypto.randomBytes(16).toString('hex'),
    created: Date.now(), lastSeen: Date.now(),
    money: 300,
    items: { lingqiu: 5, yinlingqiu: 0, yaoshui: 2, nongyao: 0 },
    dex: { [sp]: { seen: true, caught: 1 } },
    wins: 0,
    party,
    pos: { map: 'town', x: 10, y: 8, dir: 'down' }
  };
}
function publicProfile(p) {
  return {
    pid: p.pid, name: p.name, token: p.token, money: p.money, items: p.items,
    dex: p.dex, wins: p.wins, party: p.party, pos: p.pos, created: p.created
  };
}
function nameTaken(name, exceptPid) {
  return Object.values(store.players).some((p) => p.pid !== exceptPid && p.name.toLowerCase() === name.toLowerCase());
}
function sanitizeName(raw) {
  let n = String(raw == null ? '' : raw).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12);
  if (!n) n = '旅人';
  return n;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- WebSocket ---------------- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const conns = new Set();

class Conn {
  constructor(sock, req) {
    this.sock = sock; this.buf = Buffer.alloc(0); this.open = true;
    this.pid = null; this.name = null; this.remote = (req.socket.remoteAddress || '').replace('::ffff:', '');
    this.chatTimes = []; this.moveTimes = []; this.msgCount = 0; this.msgWindow = Date.now();
    this.duelId = null;
    sock.on('data', (d) => this.onData(d));
    sock.on('close', () => this.onClose());
    sock.on('error', () => this.onClose());
  }
  onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = b.readUInt32BE(2) * 4294967296 + b.readUInt32BE(6); off = 10; }
      if (len > 1 << 20) { this.close(); return; }
      let mask = null;
      if (masked) { if (b.length < off + 4) return; mask = b.subarray(off, off + 4); off += 4; }
      if (b.length < off + len) return;
      let payload = Buffer.from(b.subarray(off, off + len));
      this.buf = b.subarray(off + len);
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      if (op === 8) { this.close(); return; }
      if (op === 9) { this.sendFrame(10, payload); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 0) {
        let msg;
        try { msg = JSON.parse(payload.toString('utf8')); } catch (e) { continue; }
        try { this.handle(msg); } catch (e) { console.error('[消息] 处理异常：', e.message); }
      }
    }
  }
  sendFrame(op, payload) {
    if (!this.open) return;
    const len = payload.length;
    let head;
    if (len < 126) { head = Buffer.from([0x80 | op, len]); }
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeUInt32BE(0, 2); head.writeUInt32BE(len, 6); }
    try { this.sock.write(Buffer.concat([head, payload])); } catch (e) { this.close(); }
  }
  send(obj) { this.sendFrame(1, Buffer.from(JSON.stringify(obj), 'utf8')); }
  close() {
    if (!this.open) return;
    this.open = false;
    try { this.sock.end(); } catch (e) {}
    conns.delete(this);
    this.onLeave();
  }
  onClose() { this.open = false; conns.delete(this); this.onLeave(); }
  onLeave() {
    if (this.pid && store.players[this.pid]) { store.players[this.pid].lastSeen = Date.now(); saveStore(); }
    const d = this.duelId && duels[this.duelId];
    if (d) endDuel(d, d.a === this.pid ? d.b : d.a, '对手掉线了');
    this.pid = null;
  }
  rateLimited() {
    const now = Date.now();
    if (now - this.msgWindow > 10000) { this.msgWindow = now; this.msgCount = 0; }
    this.msgCount++;
    return this.msgCount > 200;
  }
  handle(m) {
    if (!m || typeof m.t !== 'string') return;
    if (this.rateLimited()) { this.send({ t: 'error', msg: '消息太频繁了，稍等一下' }); return; }
    switch (m.t) {
      case 'ping': this.send({ t: 'pong', at: Date.now() }); break;
      case 'join': return this.onJoin(m);
      case 'move': return this.onMove(m);
      case 'chat': return this.onChat(m);
      case 'duel': return this.onDuel(m);
      case 'duelReply': return this.onDuelReply(m);
      case 'duelAction': return this.onDuelAction(m);
      case 'claim': return this.onClaim(m);
      case 'who': return this.sendPeers();
      default: this.send({ t: 'error', msg: '未知的指令：' + m.t });
    }
  }
}

/* ---------------- 会话 ---------------- */
function sessionOf(pid) {
  for (const c of conns) if (c.pid === pid) return c;
  return null;
}
function onlineCount() { let n = 0; for (const c of conns) if (c.pid) n++; return n; }

Conn.prototype.onJoin = function (m) {
  let profile = null;
  if (m.token) {
    profile = Object.values(store.players).find((p) => p.token === m.token) || null;
  }
  if (profile) {
    const old = sessionOf(profile.pid);
    if (old && old !== this) { old.send({ t: 'kicked', msg: '同一账号在别处登录了' }); old.close(); }
    if (m.name && sanitizeName(m.name) !== profile.name && !nameTaken(sanitizeName(m.name), profile.pid)) {
      profile.name = sanitizeName(m.name);
    }
  } else {
    let name = sanitizeName(m.name);
    if (nameTaken(name)) {
      let i = 2;
      while (nameTaken(name + i)) i++;
      const old = name;
      name = name + i;
      this.nameNote = '昵称「' + old + '」已被占用，你在这个服务器上叫「' + name + '」';
    }
    profile = newProfile(name, m.starter);
    store.players[profile.pid] = profile;
  }
  profile.lastSeen = Date.now();
  this.pid = profile.pid;
  this.name = profile.name;
  saveStore();
  this.send({
    t: 'welcome',
    pid: profile.pid, token: profile.token, name: profile.name,
    note: this.nameNote || null,
    profile: publicProfile(profile),
    online: onlineCount(),
    maps: Object.fromEntries(Object.entries(MAPS).map(([k, v]) => [k, v.name])),
    chat: recentChat.slice(-12)
  });
  broadcastChat({ t: 'sys', msg: '「' + profile.name + '」进入了世界' });
  sendPeersAll();
};

Conn.prototype.onMove = function (m) {
  if (!this.pid) return;
  const p = store.players[this.pid];
  if (!p) return;
  const map = MAPS[m.map];
  if (!map) return;
  const x = m.x | 0, y = m.y | 0;
  if (x < 0 || y < 0 || y >= map.rows.length || x >= map.rows[y].length) return;
  if (BLOCKED.indexOf(map.rows[y][x]) >= 0) return;
  const dist = Math.abs(x - p.pos.x) + Math.abs(y - p.pos.y);
  if (m.map === p.pos.map && dist > 1) return;       // 只允许走到相邻格
  const now = Date.now();
  this.moveTimes = this.moveTimes.filter((t) => now - t < 1000);
  if (this.moveTimes.length > 14) return;            // 移动频率上限
  this.moveTimes.push(now);
  p.pos = { map: m.map, x, y, dir: String(m.dir || 'down').slice(0, 5) };
  p.lastSeen = now;
};

Conn.prototype.onChat = function (m) {
  if (!this.pid) return;
  const now = Date.now();
  this.chatTimes = this.chatTimes.filter((t) => now - t < CHAT_WINDOW);
  if (this.chatTimes.length >= CHAT_BURST) { this.send({ t: 'error', msg: '聊天太快了，歇一下再发' }); return; }
  const text = String(m.msg == null ? '' : m.msg).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, CHAT_MAX);
  if (!text) return;
  this.chatTimes.push(now);
  const p = store.players[this.pid];
  const entry = { t: 'chat', channel: m.channel === 'near' ? 'near' : 'world', from: this.name, pid: this.pid, msg: escapeHtml(text), at: now };
  recentChat.push(entry);
  if (recentChat.length > 40) recentChat.shift();
  if (entry.channel === 'world') { broadcastChat(entry); return; }
  for (const c of conns) {
    if (!c.pid) continue;
    const q = store.players[c.pid];
    if (!q || q.pos.map !== p.pos.map) continue;
    if (Math.abs(q.pos.x - p.pos.x) + Math.abs(q.pos.y - p.pos.y) > 8) continue;
    c.send(entry);
  }
};
const recentChat = [];
function broadcastChat(entry) { for (const c of conns) if (c.pid) c.send(entry); }

/* ---------------- 位置广播 ---------------- */
function peersOf(mapId) {
  const list = [];
  for (const c of conns) {
    if (!c.pid) continue;
    const p = store.players[c.pid];
    if (!p || p.pos.map !== mapId) continue;
    list.push({ pid: p.pid, name: p.name, x: p.pos.x, y: p.pos.y, dir: p.pos.dir, lvl: (p.party[0] || {}).lvl || 1 });
  }
  return list;
}
function sendPeersAll() {
  for (const c of conns) {
    if (!c.pid) continue;
    const p = store.players[c.pid];
    if (!p) continue;
    c.send({ t: 'peers', map: p.pos.map, list: peersOf(p.pos.map), at: Date.now() });
  }
}
let tickId = null;
function startTick() {
  clearInterval(tickId);
  tickId = setInterval(() => {
    sendPeersAll();
    const now = Date.now();
    Object.keys(duels).forEach((id) => {
      const d = duels[id];
      if (d.over) return;
      if (now - d.lastAction > 30000) {
        if (!d.actions[d.a]) d.actions[d.a] = { move: 0 };
        if (!d.actions[d.b]) d.actions[d.b] = { move: 0 };
        resolveDuel(d);
      }
    });
  }, TICK_MS);
}

/* ---------------- 玩家对战 ---------------- */
const duels = {};
let duelSeq = 1;
function activeMon(p) {
  return p.party.find((m) => m.hp > 0) || p.party[0];
}
Conn.prototype.onDuel = function (m) {
  if (!this.pid) return;
  const target = sessionOf(String(m.to || ''));
  if (!target || !target.pid) { this.send({ t: 'error', msg: '对方已经不在线了' }); return; }
  if (target.pid === this.pid) { this.send({ t: 'error', msg: '不能挑战自己' }); return; }
  const me = store.players[this.pid], opp = store.players[target.pid];
  if (!me || !opp) return;
  if (Object.values(duels).some((d) => !d.over && (d.a === this.pid || d.b === this.pid))) { this.send({ t: 'error', msg: '你已经在另一场对战里了' }); return; }
  target.send({ t: 'duelInvite', from: { pid: me.pid, name: me.name, lvl: activeMon(me).lvl, sp: activeMon(me).sp } });
  this.send({ t: 'duelWait', to: opp.name });
};
Conn.prototype.onDuelReply = function (m) {
  if (!this.pid) return;
  const from = sessionOf(String(m.from || ''));
  if (!from || !from.pid) { this.send({ t: 'error', msg: '挑战者已经离线' }); return; }
  if (!m.accept) { from.send({ t: 'duelDeclined', by: this.name }); this.send({ t: 'info', msg: '你拒绝了挑战' }); return; }
  const a = store.players[from.pid], b = store.players[this.pid];
  if (!a || !b) return;
  const id = 'd' + (duelSeq++);
  const d = { id, a: a.pid, b: b.pid, turn: 1, actions: {}, over: false, lastAction: Date.now() };
  d.mon = {};
  d.mon[a.pid] = JSON.parse(JSON.stringify(activeMon(a)));
  d.mon[b.pid] = JSON.parse(JSON.stringify(activeMon(b)));
  duels[id] = d;
  from.duelId = id; this.duelId = id;
  startDuelTurn(d);
};
function duelStateFor(d, pid) {
  const other = pid === d.a ? d.b : d.a;
  const mine = d.mon[pid], theirs = d.mon[other];
  return {
    t: 'duelState', id: d.id, turn: d.turn,
    you: { name: store.players[pid].name, sp: mine.sp, lvl: mine.lvl, hp: mine.hp, max: maxHpOf(mine), moves: mine.moves.map((x) => ({ id: x.id, pp: x.pp })) },
    opp: { name: store.players[other].name, sp: theirs.sp, lvl: theirs.lvl, hp: theirs.hp, max: maxHpOf(theirs), moves: theirs.moves.map((x) => ({ id: x.id, pp: x.pp })) },
    log: d.lastLog || [], over: !!d.over, winner: d.winner || null
  };
}
function startDuelTurn(d) {
  d.actions = {};
  d.lastAction = Date.now();
  [d.a, d.b].forEach((pid) => {
    const c = sessionOf(pid);
    if (c) c.send(duelStateFor(d, pid));
  });
}
Conn.prototype.onDuelAction = function (m) {
  if (!this.pid) return;
  const d = duels[m.id];
  if (!d || d.over || (d.a !== this.pid && d.b !== this.pid)) return;
  if (d.actions[this.pid] !== undefined) return;
  const mon = d.mon[this.pid];
  const idx = Math.max(0, Math.min(3, m.move | 0));
  const slot = mon.moves[idx];
  if (!slot || slot.pp <= 0) { this.send({ t: 'error', msg: '这个技能没有 PP 了' }); return; }
  d.actions[this.pid] = { move: idx };
  const oppC = sessionOf(this.pid === d.a ? d.b : d.a);
  if (oppC) oppC.send({ t: 'duelReady', msg: this.name + ' 已经选好了' });
  if (Object.keys(d.actions).length === 2) resolveDuel(d);
};
function resolveDuel(d) {
  if (d.over) return;
  const log = [];
  const pids = [d.a, d.b];
  const rng = () => Math.random();
  const order = pids.slice().sort((x, y) => statsOf(d.mon[y]).spd - statsOf(d.mon[x]).spd);
  for (const pid of order) {
    if (d.over) break;
    const foe = pid === d.a ? d.b : d.a;
    const attacker = d.mon[pid], defender = d.mon[foe];
    if (attacker.hp <= 0 || defender.hp <= 0) continue;
    const act = d.actions[pid] || { move: 0 };
    let slot = attacker.moves[act.move];
    if (!slot || slot.pp <= 0) slot = attacker.moves.find((s) => s.pp > 0);
    if (!slot) { log.push(store.players[pid].name + ' 没有可用的技能，只能干瞪眼。'); continue; }
    slot.pp--;
    const mv = MOVES[slot.id];
    log.push(store.players[pid].name + ' 的' + SPECIES[attacker.sp].name + ' 使出了 ' + mv.name + '！');
    if (rng() > mv.acc) { log.push('但是没有命中。'); continue; }
    const res = computeDamage(attacker, defender, mv, rng);
    defender.hp = Math.max(0, defender.hp - res.dmg);
    log.push(store.players[foe].name + ' 的' + SPECIES[defender.sp].name + ' 受到 ' + res.dmg + ' 点伤害' + (res.eff > 1 ? '，效果很好！' : res.eff < 1 ? '，效果不太好……' : '。'));
    if (defender.hp <= 0) {
      log.push(SPECIES[defender.sp].name + ' 倒下了。');
      d.over = true;
      d.winner = pid;
      endDuel(d, pid, SPECIES[defender.sp].name + ' 倒下了');
    }
  }
  d.lastLog = log;
  d.turn++;
  if (!d.over) startDuelTurn(d);
}
function endDuel(d, winnerPid, reason) {
  if (!d.over) { d.over = true; d.winner = winnerPid; }
  d.over = true;
  if (winnerPid) {
    const w = store.players[winnerPid];
    if (w) { w.money += 40; w.wins = (w.wins || 0) + 1; saveStore(); }
  }
  [d.a, d.b].forEach((pid) => {
    const c = sessionOf(pid);
    if (!c) return;
    c.duelId = null;
    const p = store.players[pid];
    c.send({
      t: 'duelEnd', id: d.id, winner: d.winner || null, reason: reason || '',
      you: p ? publicProfile(p) : null
    });
  });
  delete duels[d.id];
}

/* ---------------- 单人战斗 / 交易的服务端校验 ---------------- */
Conn.prototype.reject = function (msg) { this.send({ t: 'claimResult', ok: false, msg }); };
Conn.prototype.onClaim = function (m) {
  if (!this.pid) return;
  const p = store.players[this.pid];
  if (!p) return;
  const kind = m.kind;
  if (kind === 'win' || kind === 'catch') {
    const map = MAPS[m.map];
    const sp = String(m.sp || '');
    const lv = m.lv | 0;
    if (!map || !map.enc || !SPECIES[sp]) return this.reject('地图或灵兽无效');
    const hit = map.enc.table.find((t) => t.sp === sp && lv >= t.lv[0] && lv <= t.lv[1]);
    if (!hit) return this.reject('这只灵兽不该出现在这里');
    const mon = p.party[0];
    if (!mon) return this.reject('队伍异常');
    if (kind === 'win') {
      const gainExp = Math.round(SPECIES[sp].exp * lv * 0.8 + 6);
      const gainGold = 8 + lv * 4 + Math.floor(Math.random() * 6);
      p.money += gainGold;
      p.wins = (p.wins || 0) + 1;
      p.dex[sp] = p.dex[sp] || { seen: false, caught: 0 };
      p.dex[sp].seen = true;
      const ups = growMon(mon, gainExp);
      saveStore();
      this.send({ t: 'claimResult', ok: true, kind, exp: gainExp, gold: gainGold, ups, profile: publicProfile(p) });
      return;
    }
    const ball = String(m.ball || 'lingqiu');
    if (!ITEMS[ball] || !ITEMS[ball].ball) return this.reject('捕获装置无效');
    let hpRatio = Number(m.hpRatio);
    if (!isFinite(hpRatio)) hpRatio = 1;
    hpRatio = Math.max(0, Math.min(1, hpRatio));
    p.items[ball] = Math.max(0, (p.items[ball] || 0) - 1);
    const pChance = catchChance(sp, lv, hpRatio, ball);
    const ok = Math.random() < pChance;
    p.dex[sp] = p.dex[sp] || { seen: false, caught: 0 };
    p.dex[sp].seen = true;
    if (ok) {
      const caught = makeMon(sp, lv);
      if (p.party.length < 6) p.party.push(caught); else (p.box = p.box || []).push(caught);
      p.dex[sp].caught = (p.dex[sp].caught || 0) + 1;
    }
    saveStore();
    this.send({ t: 'claimResult', ok: true, kind, caught: ok, chance: Math.round(pChance * 100), profile: publicProfile(p) });
    return;
  }
  if (kind === 'buy') {
    const it = ITEMS[m.item];
    if (!it) return this.reject('商品不存在');
    if (p.money < it.price) return this.reject('金币不够');
    p.money -= it.price;
    p.items[m.item] = (p.items[m.item] || 0) + 1;
    saveStore();
    this.send({ t: 'claimResult', ok: true, kind, profile: publicProfile(p) });
    return;
  }
  if (kind === 'potion') {
    const it = ITEMS[m.item];
    if (!it || !it.heal) return this.reject('药品无效');
    if ((p.items[m.item] || 0) <= 0) return this.reject('数量不足');
    const slot = m.slot | 0;
    const mon = p.party[slot];
    if (!mon) return this.reject('队伍位置无效');
    p.items[m.item]--;
    mon.hp = Math.min(maxHpOf(mon), mon.hp + it.heal);
    saveStore();
    this.send({ t: 'claimResult', ok: true, kind, profile: publicProfile(p) });
    return;
  }
  if (kind === 'heal') {
    p.party.forEach((mon) => { mon.hp = maxHpOf(mon); });
    saveStore();
    this.send({ t: 'claimResult', ok: true, kind, profile: publicProfile(p) });
    return;
  }
  if (kind === 'revive') {
    p.party.forEach((mon) => { mon.hp = maxHpOf(mon); });
    saveStore();
    this.send({ t: 'claimResult', ok: true, kind, profile: publicProfile(p) });
    return;
  }
  return this.reject('未知的校验类型');
};

/* ---------------- HTTP ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/health') {
    const body = JSON.stringify({ ok: true, online: onlineCount(), players: Object.keys(store.players).length, duels: Object.keys(duels).length, uptime: Math.round(process.uptime()) });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
    return;
  }
  let file = null;
  if (urlPath === '/' || urlPath === '/index.html') file = CLIENT_FILE;
  else if (urlPath === '/' + CLIENT_FILE) file = CLIENT_FILE;
  else if (urlPath === '/联机说明.md' || urlPath === '/README.md') file = '联机说明.md';
  else if (/^\/[\u4e00-\u9fa5\w.-]+\.(html|md)$/.test(urlPath)) file = urlPath.slice(1);
  if (!file || file.indexOf('..') >= 0 || file.indexOf('/') >= 0) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 只有游戏页面和说明文档可以被访问');
    return;
  }
  const full = path.join(ROOT, file);
  fs.readFile(full, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><meta charset="utf-8"><h1>找不到 ' + escapeHtml(file) + '</h1><p>请确认该文件与 server.js 放在同一目录。</p>');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  const c = new Conn(sock, req);
  conns.add(c);
  console.log('[连接] ' + c.remote + ' 已接入，当前连接数 ' + conns.size);
});

/* ---------------- 启动 ---------------- */
function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach((name) => {
    (nets[name] || []).forEach((n) => {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    });
  });
  return out;
}
loadStore();
startTick();
server.listen(PORT, HOST, () => {
  const lan = lanAddresses();
  console.log('');
  console.log('  口袋世界 · 联机服务端已启动');
  console.log('  ─────────────────────────────');
  console.log('  本机访问   http://localhost:' + PORT + '/');
  console.log('  本机 IP    http://127.0.0.1:' + PORT + '/');
  if (lan.length) {
    lan.forEach((ip) => console.log('  局域网     http://' + ip + ':' + PORT + '/'));
    console.log('  给朋友这个局域网地址即可（同一 WiFi 下）');
  } else {
    console.log('  局域网     未检测到外部网卡地址（可能是容器或离线环境）');
  }
  console.log('  监听地址   ' + HOST + ':' + PORT);
  console.log('  存档文件   ' + SAVE_FILE);
  console.log('  在线人数   0');
  console.log('');
});
process.on('SIGINT', () => {
  console.log('\n[退出] 正在保存存档……');
  saveNow();
  process.exit(0);
});
process.on('SIGTERM', () => { saveNow(); process.exit(0); });
