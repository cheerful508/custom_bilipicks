/* BiliPicks 乐学版 · 共用内核
 * 档案 / 数据合并 / 星星·等级·徽章·连续打卡 / 庆祝特效 / 乐探究模板与弹窗
 * index.html 和 editor.html 都会加载它。所有孩子的数据只存在本机浏览器 localStorage（键名以 bp2- 开头）。
 * 写法保持保守（不用 ?. 和 ??），电视、投影仪的老浏览器也能跑。
 */
(function (global) {
'use strict';
var BP = global.BP = {hooks: {}};
var listeners = {};

/* ---------- 小工具 ---------- */
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function p2(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
var PUBLISHED = (global.BP_PUBLISHED && global.BP_PUBLISHED.items) || {};
function jget(k, f) {
  try {
    var raw = localStorage.getItem(k);
    if (raw == null && PUBLISHED[k] != null) raw = PUBLISHED[k];
    var v = JSON.parse(raw);
    return v == null ? f : v;
  } catch (e) { return f; }
}
function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
BP.clone = clone; BP.esc = esc; BP.ymd = ymd; BP.uid = uid; BP.jget = jget; BP.jset = jset;
BP.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
BP.emit = function (ev, a) { (listeners[ev] || []).forEach(function (f) { try { f(a); } catch (e) {} }); };
BP.say = function (msg) { if (BP.hooks.toast) BP.hooks.toast(msg); };

/* ---------- 档案（每个孩子一个） ---------- */
BP.THEMES = ['#2f86e0', '#2fa866', '#e9558a', '#f07c2a', '#a05bd8', '#0f9fa3', '#d49a00', '#6b6ff0'];
BP.AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐙', '🦖', '🚀', '🤖', '🦄', '🐬', '🦉', '⚡'];
var DEFAULT_PROFILES = [
  {id: 'p1', name: '哥哥', avatar: '🦊', age: 11, theme: '#2f86e0', slogan: '好奇心就是我的超能力', goal: 2, sound: true},
  {id: 'p2', name: '弟弟', avatar: '🐼', age: 9, theme: '#2fa866', slogan: '每天进步一点点', goal: 2, sound: true}
];
BP.profiles = function () {
  var a = jget('bp2-profiles', null);
  if (!a || !a.length) { a = clone(DEFAULT_PROFILES); jset('bp2-profiles', a); }
  return a;
};
BP.saveProfiles = function (a) { jset('bp2-profiles', a); BP.emit('profiles'); };
BP.currentId = function () {
  var id = jget('bp2-current', null), ps = BP.profiles();
  for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return id;
  return null;
};
BP.needsChooser = function () { return !BP.currentId(); };
BP.profile = function (id) {
  var ps = BP.profiles();
  id = id || BP.currentId() || ps[0].id;
  for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
  return ps[0];
};
BP.setCurrent = function (id) { jset('bp2-current', id); };
BP.updateProfile = function (id, patch) {
  var ps = BP.profiles();
  ps.forEach(function (p) { if (p.id === id) for (var k in patch) p[k] = patch[k]; });
  BP.saveProfiles(ps);
};
BP.addProfile = function (name) {
  var ps = BP.profiles(), n = ps.length;
  var p = {id: uid('p'), name: name || ('小伙伴' + (n + 1)), avatar: BP.AVATARS[n % BP.AVATARS.length], age: 10,
    theme: BP.THEMES[n % BP.THEMES.length], slogan: '今天也要探索新知识', goal: 2, sound: true};
  ps.push(p);
  BP.saveProfiles(ps);
  return p;
};
BP.removeProfile = function (id) {
  var ps = BP.profiles();
  if (ps.length <= 1) return false;
  var left = ps.filter(function (p) { return p.id !== id; });
  BP.saveProfiles(left);
  var prefix = 'bp2-' + id + '-', del = [];
  try {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) del.push(k); }
    del.forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) {}
  if (jget('bp2-current', null) === id) jset('bp2-current', null);
  return true;
};
BP.pkey = function (name, pid) { return 'bp2-' + (pid || BP.profile().id) + '-' + name; };
BP.load = function (name, fb, pid) { return jget(BP.pkey(name, pid), fb); };
BP.save = function (name, v, pid) { return jset(BP.pkey(name, pid), v); };

/* 家长口令（可选）：只挡住「标记已兑现」「进入编辑器」，不是真正的安全措施 */
BP.pin = function () { return String(jget('bp2-pin', '') || ''); };
BP.setPin = function (v) { jset('bp2-pin', String(v || '')); };
BP.askPin = function (msg) {
  var pin = BP.pin();
  if (!pin) return true;
  var v = global.prompt(msg || '请家长输入口令');
  if (v === null) return false;
  if (String(v) === pin) return true;
  global.alert('口令不对');
  return false;
};

/* ---------- 个性化数据：在公共清单（data.js）上叠加每个孩子自己的修改 ---------- */
BP.defaultWishes = function () {
  return [
    {id: 'w1', emoji: '🎮', name: '周末多玩 30 分钟游戏', cost: 30},
    {id: 'w2', emoji: '🍦', name: '一次冰淇淋或奶茶', cost: 40},
    {id: 'w3', emoji: '🎬', name: '家庭电影夜（自己选片）', cost: 60},
    {id: 'w4', emoji: '🧩', name: '挑一份新的手工 / 科学材料包', cost: 90},
    {id: 'w5', emoji: '🏞️', name: '周末探险日（自己定去哪儿）', cost: 150}
  ];
};
BP.getCustom = function (pid) {
  var c = BP.load('custom', null, pid) || {};
  c.hiddenVideos = c.hiddenVideos || {};
  c.videoEdits = c.videoEdits || {};
  c.addedVideos = c.addedVideos || [];
  c.path = c.path || null;
  c.exploreByVideo = c.exploreByVideo || {};
  c.quests = c.quests || [];
  if (!c.wishes) c.wishes = BP.defaultWishes();
  return c;
};
BP.saveCustom = function (c, pid) { BP.save('custom', c, pid); BP.emit('custom'); };

function ensureKeys(path) {
  (path.stages || []).forEach(function (s, i) { if (!s.key) s.key = 's' + (i + 1); s.items = s.items || []; s.subject = s.subject || '未分类'; });
  return path;
}
BP.subjectsOf = function (D) {
  var order = D.categories || [], seen = {}, out = [];
  (D.path.stages || []).forEach(function (s) { if (!seen[s.subject]) { seen[s.subject] = true; out.push(s.subject); } });
  out.sort(function (a, b) {
    var ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia < 0) ia = order.length; if (ib < 0) ib = order.length;
    return ia - ib;
  });
  return out;
};
var DATA0 = (typeof DATA !== 'undefined') ? DATA : {videos: [], categories: [], path: {title: '成长路线', intro: '', tips: [], stages: []}};
BP.base = clone(DATA0);                       // 公共清单的原样副本，永远不改
BP.basePath = function () { return ensureKeys(clone(BP.base.path || {title: '成长路线', intro: '', tips: [], stages: []})); };

BP.buildData = function (base, custom) {
  var D = clone(base);
  D.path = ensureKeys(D.path || {title: '成长路线', intro: '', tips: [], stages: []});
  var edits = custom.videoEdits || {}, hidden = custom.hiddenVideos || {};
  var have = {};
  D.videos.forEach(function (v) {
    var e = edits[v.id];
    if (e) for (var k in e) v[k] = e[k];
    have[v.id] = true;
  });
  (custom.addedVideos || []).forEach(function (a) {
    if (have[a.id]) return;
    var v = clone(a); v.custom = true;
    D.videos.push(v); have[v.id] = true;
  });
  D.videos.forEach(function (v) { if (hidden[v.id]) { v.hidden = true; v.dead = true; } });
  D.categories = (D.categories || []).slice();
  D.videos.forEach(function (v) { if (v.category && D.categories.indexOf(v.category) < 0) D.categories.push(v.category); });
  if (custom.path) D.path = ensureKeys(clone(custom.path));
  return D;
};
BP.applyTo = function (D, pid) {
  var m = BP.buildData(BP.base, BP.getCustom(pid));
  D.videos = m.videos; D.categories = m.categories; D.path = m.path;
  return D;
};
BP.applyTo(DATA0);

/* ---------- 星星、等级、徽章、连续打卡 ---------- */
BP.LEVELS = [
  {min: 0, icon: '🌱', name: '好奇小芽'}, {min: 25, icon: '🔭', name: '探索学徒'},
  {min: 70, icon: '🧪', name: '实验新星'}, {min: 140, icon: '🛠️', name: '创造小能手'},
  {min: 240, icon: '🚀', name: '星际探险家'}, {min: 380, icon: '🧠', name: '思考达人'},
  {min: 560, icon: '🏆', name: '科学大侠'}, {min: 800, icon: '🌟', name: '宇宙传奇'}
];
BP.level = function (earned) {
  var i = 0;
  for (var k = 0; k < BP.LEVELS.length; k++) if (earned >= BP.LEVELS[k].min) i = k;
  var cur = BP.LEVELS[i], nx = BP.LEVELS[i + 1];
  return {i: i, no: i + 1, icon: cur.icon, name: cur.name, min: cur.min, next: nx ? nx.min : null, nextName: nx ? nx.name : '',
    pct: nx ? Math.round((earned - cur.min) / (nx.min - cur.min) * 100) : 100};
};
BP.game = function (pid) {
  var g = BP.load('game', null, pid) || {};
  g.earned = g.earned || 0; g.spent = g.spent || 0; g.log = g.log || []; g.keys = g.keys || {};
  g.badges = g.badges || {}; g.days = g.days || {}; g.redeemed = g.redeemed || [];
  return g;
};
BP.saveGame = function (g, pid) { BP.save('game', g, pid); };
BP.stars = function (pid) { var g = BP.game(pid); return g.earned - g.spent; };
BP.streak = function (g) {
  g = g || BP.game();
  var d = new Date(), n = 0;
  if (!g.days[ymd(d)]) d.setDate(d.getDate() - 1);
  while (g.days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
};
BP.todayCount = function (g) { g = g || BP.game(); return g.days[ymd()] || 0; };
BP.last7 = function (g) {
  g = g || BP.game();
  var out = [], names = ['日', '一', '二', '三', '四', '五', '六'];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    out.push({label: names[d.getDay()], n: g.days[ymd(d)] || 0, today: i === 0});
  }
  return out;
};

BP.BADGES = [
  {id: 'first', icon: '🚩', name: '出发！', desc: '看完第 1 条视频', ok: function (c) { return c.done >= 1; }},
  {id: 'v10', icon: '📺', name: '十连看', desc: '看完 10 条视频', ok: function (c) { return c.done >= 10; }},
  {id: 'v30', icon: '🚂', name: '知识小火车', desc: '看完 30 条视频', ok: function (c) { return c.done >= 30; }},
  {id: 'st1', icon: '🏅', name: '首关通关', desc: '通过第 1 个关卡', ok: function (c) { return c.stages >= 1; }},
  {id: 'st3', icon: '🥇', name: '三关达人', desc: '通过 3 个关卡', ok: function (c) { return c.stages >= 3; }},
  {id: 'm1', icon: '🔧', name: '动手派', desc: '完成第 1 个动手任务', ok: function (c) { return c.missions >= 1; }},
  {id: 'm3', icon: '🛠️', name: '小工程师', desc: '完成 3 个动手任务', ok: function (c) { return c.missions >= 3; }},
  {id: 'x1', icon: '🔬', name: '小小探究员', desc: '完成第 1 次乐探究', ok: function (c) { return c.explores >= 1; }},
  {id: 'x5', icon: '🧐', name: '爱提问的人', desc: '完成 5 次乐探究', ok: function (c) { return c.explores >= 5; }},
  {id: 'x10', icon: '🧪', name: '探究达人', desc: '完成 10 次乐探究', ok: function (c) { return c.explores >= 10; }},
  {id: 'hands', icon: '🔨', name: '动手实验家', desc: '3 次探究里真的动手做了', ok: function (c) { return c.hands >= 3; }},
  {id: 'teach', icon: '🗣️', name: '小老师', desc: '把发现讲给家人听 3 次', ok: function (c) { return c.taught >= 3; }},
  {id: 'quest3', icon: '🧭', name: '课题探险家', desc: '完成 3 个不同的探究课题', ok: function (c) { return c.quests >= 3; }},
  {id: 's3', icon: '🔥', name: '坚持三天', desc: '连续 3 天学习', ok: function (c) { return c.streak >= 3; }},
  {id: 's7', icon: '🌋', name: '坚持一周', desc: '连续 7 天学习', ok: function (c) { return c.streak >= 7; }},
  {id: 'r100', icon: '💎', name: '百星闪耀', desc: '累计获得 100 颗星星', ok: function (c) { return c.earned >= 100; }}
];
BP.stats = function (pid) {
  var recs = BP.load('explore', [], pid), g = BP.game(pid);
  var fin = recs.filter(function (r) { return r.done; }), qs = {};
  fin.forEach(function (r) { if (r.kind === 'quest') qs[r.ref] = 1; });
  return {
    done: Object.keys(BP.load('done', {}, pid)).length,
    missions: Object.keys(BP.load('missions', {}, pid)).length,
    explores: fin.length,
    hands: fin.filter(function (r) { return r.did; }).length,
    taught: fin.filter(function (r) { return r.taught; }).length,
    quests: Object.keys(qs).length,
    stages: BP.hooks.stagesCleared ? BP.hooks.stagesCleared() : 0,
    earned: g.earned, streak: BP.streak(g)
  };
};
BP.checkBadges = function () {
  var g = BP.game(), c = BP.stats(), out = [];
  BP.BADGES.forEach(function (b) { if (!g.badges[b.id] && b.ok(c)) { g.badges[b.id] = Date.now(); out.push(b); } });
  if (out.length) BP.saveGame(g);
  return out;
};

/* 发星星。items 可以是一个 {key, n, label} 或数组；同一个 key 只发一次（取消再勾选刷不了星星）。
 * opt.before(stars) / opt.after(stars) 返回要弹出的庆祝卡片，升级和新徽章夹在中间。 */
BP.reward = function (items, opt) {
  opt = opt || {};
  items = items.length === undefined ? [items] : items;
  var g = BP.game(), sum = 0, labels = [], before = BP.level(g.earned);
  items.forEach(function (it) {
    if (g.keys[it.key]) return;
    g.keys[it.key] = Date.now();
    sum += it.n; labels.push(it.label);
  });
  if (!sum) return {ok: false, stars: 0};
  g.earned += sum;
  g.log.unshift({t: Date.now(), n: sum, label: labels.join('、')});
  if (g.log.length > 80) g.log.length = 80;
  g.days[ymd()] = (g.days[ymd()] || 0) + 1;
  BP.saveGame(g);
  var cheers = [];
  if (opt.before) cheers = cheers.concat(opt.before(sum) || []);
  var after = BP.level(g.earned);
  if (after.i > before.i) cheers.push({icon: after.icon, title: '升级啦！Lv.' + after.no + ' ' + after.name, sub: '累计获得 ' + g.earned + ' 颗星星', big: true});
  BP.checkBadges().forEach(function (b) { cheers.push({icon: b.icon, title: '获得徽章：' + b.name, sub: b.desc, badge: true}); });
  if (opt.after) cheers = cheers.concat(opt.after(sum) || []);
  if (cheers.length) BP.cheer(cheers);
  BP.emit('change');
  return {ok: true, stars: sum};
};

BP.redeem = function (wish) {
  var g = BP.game();
  if (g.earned - g.spent < wish.cost) return {ok: false, msg: '星星还不够，再加把劲！'};
  g.spent += wish.cost;
  g.redeemed.unshift({id: uid('r'), emoji: wish.emoji, name: wish.name, cost: wish.cost, t: Date.now(), used: false});
  if (g.redeemed.length > 60) g.redeemed.length = 60;
  BP.saveGame(g);
  BP.emit('change');
  return {ok: true};
};
BP.markUsed = function (rid) {
  var g = BP.game();
  g.redeemed.forEach(function (r) { if (r.id === rid) r.used = !r.used; });
  BP.saveGame(g);
};

/* ---------- 庆祝：弹窗、撒花、音效 ---------- */
var cssDone = false;
function injectCSS() {
  if (cssDone) return;
  cssDone = true;
  var st = document.createElement('style');
  st.textContent = [
    '.bp-modal{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,16,26,.5);animation:bp-fade .18s ease}',
    '@keyframes bp-fade{from{opacity:0}}',
    '@keyframes bp-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}',
    '@keyframes bp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}',
    '@keyframes bp-rise{0%{transform:translate(-50%,0);opacity:0}15%{opacity:1}100%{transform:translate(-50%,-70px);opacity:0}}',
    '.bp-card{background:var(--surface,#fff);color:var(--ink,#152033);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.35);max-width:100%;font-family:inherit}',
    '.bp-cheer{width:min(380px,100%);padding:28px 24px 22px;text-align:center;animation:bp-pop .35s ease}',
    '.bp-cheer .bp-emoji{font-size:64px;line-height:1.1;animation:bp-bounce .9s ease .3s 2}',
    '.bp-cheer.big .bp-emoji{font-size:84px}',
    '.bp-cheer h2{margin:8px 0 6px;font-size:22px;font-weight:800;line-height:1.35}',
    '.bp-cheer p{margin:0;color:var(--muted,#5b6880);line-height:1.7;font-size:14.5px}',
    '.bp-gain{display:inline-block;margin-top:12px;padding:4px 16px;border-radius:999px;background:#ffc531;color:#5a3d00;font-weight:900;font-size:20px}',
    '.bp-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px}',
    '.bp-btn{min-height:44px;padding:0 20px;border-radius:999px;font:inherit;font-weight:800;border:0;cursor:pointer;background:var(--soft,#e8eef6);color:var(--ink,#152033)}',
    '.bp-btn.primary{background:var(--accent,#0a76bd);color:var(--on-accent,#fff)}',
    '.bp-confetti{position:fixed;inset:0;z-index:310;pointer-events:none}',
    '.bp-pop{position:fixed;z-index:320;transform:translate(-50%,0);font-weight:900;font-size:20px;color:#b87400;text-shadow:0 1px 0 #fff,0 0 8px #ffe7a0;pointer-events:none;animation:bp-rise 1.1s ease forwards}',
    /* 乐探究弹窗 */
    '.bp-ex-card{width:min(680px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;overflow:hidden;animation:bp-pop .3s ease}',
    '.bp-ex-head{flex:none;display:flex;align-items:center;gap:12px;padding:14px 16px 12px 20px;border-bottom:1px solid var(--line,#d9e2ee)}',
    '.bp-ex-head .em{font-size:30px}',
    '.bp-ex-head b{display:block;font-size:17px;font-weight:800}',
    '.bp-ex-head small{display:block;color:var(--muted,#5b6880);font-size:13px;line-height:1.4;margin-top:1px}',
    '.bp-ex-head .x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:none;cursor:pointer;font-size:18px;color:var(--muted,#5b6880)}',
    '.bp-ex-head .x:hover{background:var(--soft,#e8eef6)}',
    '.bp-ex-body{flex:1;overflow-y:auto;padding:6px 20px 12px;overscroll-behavior:contain}',
    '.bp-ex-body section{margin-top:16px}',
    '.bp-ex-body h3{margin:0 0 8px;font-size:16px;font-weight:800}',
    '.bp-ex-body .note{margin:0 0 8px;color:var(--muted,#5b6880);font-size:13.5px;line-height:1.7}',
    '.bp-ex-body .safe{margin:0 0 10px;padding:9px 12px;border-radius:12px;background:rgba(255,197,49,.2);color:var(--warn,#9a5b00);font-size:13.5px;line-height:1.65;font-weight:600}',
    '.bp-ex-body label.q{display:block;margin:0 0 12px;font-weight:700;line-height:1.55;font-size:14.5px}',
    '.bp-ex-body label.q small{display:block;color:var(--muted,#5b6880);font-weight:500;font-size:12.5px}',
    '.bp-ex-body textarea,.bp-ex-body input[type=text]{width:100%;margin-top:6px;padding:9px 12px;border-radius:12px;border:1.5px solid var(--line,#d9e2ee);background:var(--bg,#f1f5fa);color:inherit;font:inherit;font-weight:500;line-height:1.6;resize:vertical;outline:none}',
    '.bp-ex-body textarea{min-height:64px}',
    '.bp-ex-body textarea:focus,.bp-ex-body input[type=text]:focus{border-color:var(--accent,#0a76bd);background:var(--surface,#fff)}',
    '.bp-ex-body ol.stp{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}',
    '.bp-ex-body ol.stp label{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:var(--bg,#f1f5fa);cursor:pointer;line-height:1.55;font-size:14.5px}',
    '.bp-ex-body ol.stp input{width:20px;height:20px;margin-top:2px;accent-color:var(--ok,#0f9457);flex:none}',
    '.bp-ex-body .mat{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}',
    '.bp-ex-body .mat span{padding:3px 10px;border-radius:999px;background:var(--soft,#e8eef6);font-size:13px;font-weight:600}',
    '.bp-ex-body .teach{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:700}',
    '.bp-ex-body .teach input[type=text]{width:140px;margin:0}',
    '.bp-ex-body .teach input[type=checkbox]{width:20px;height:20px;accent-color:var(--ok,#0f9457)}',
    '.bp-rate{display:flex;gap:4px;margin:2px 0 12px}',
    '.bp-rate button{border:0;background:none;font-size:30px;line-height:1;cursor:pointer;padding:2px;filter:grayscale(1);opacity:.35}',
    '.bp-rate button.on{filter:none;opacity:1}',
    '.bp-ex-foot{flex:none;display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid var(--line,#d9e2ee)}',
    '.bp-ex-foot .st{flex:1;color:var(--muted,#5b6880);font-size:12.5px}',
    '@media(max-width:520px){.bp-modal{padding:0;align-items:flex-end}.bp-ex-card{border-radius:22px 22px 0 0;max-height:94vh}.bp-cheer{margin-bottom:12vh}}',
    '@media(prefers-reduced-motion:reduce){.bp-modal,.bp-card,.bp-cheer .bp-emoji{animation:none!important}}'
  ].join('\n');
  document.head.appendChild(st);
}
BP.injectCSS = injectCSS;

var actx;
BP.sound = function (kind) {
  try {
    if (BP.profile().sound === false) return;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    actx = actx || new AC();
    if (actx.state === 'suspended') actx.resume();
    var seqs = {ok: [[660, 0], [880, .11]], badge: [[784, 0], [988, .1], [1319, .2]], big: [[523, 0], [659, .12], [784, .24], [1046, .36], [1319, .5]]};
    (seqs[kind] || seqs.ok).forEach(function (n) {
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + n[1];
      o.type = 'triangle'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(.16, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + .3);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + .32);
    });
  } catch (e) {}
};

BP.confetti = function (level) {
  if (!level) return;
  try { if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  injectCSS();
  var cv = document.createElement('canvas');
  cv.className = 'bp-confetti';
  var W = cv.width = global.innerWidth, H = cv.height = global.innerHeight;
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(cv);
  var colors = ['#e9558a', '#f07c2a', '#ffc531', '#2fa866', '#0f9fa3', '#2f86e0', '#a05bd8'], ps = [], N = level >= 2 ? 220 : 110;
  for (var i = 0; i < N; i++) {
    ps.push({x: W / 2 + (Math.random() - .5) * W * .3, y: H * .4, vx: (Math.random() - .5) * (level >= 2 ? 17 : 12),
      vy: -(Math.random() * 12 + 5), g: .3 + Math.random() * .15, s: 6 + Math.random() * 8, r: Math.random() * 6.28,
      vr: (Math.random() - .5) * .4, c: colors[i % colors.length], shape: i % 3});
  }
  var t0 = Date.now();
  (function frame() {
    var dt = Date.now() - t0;
    ctx.clearRect(0, 0, W, H);
    ps.forEach(function (p) {
      p.vy += p.g; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - dt / 2700);
      if (p.shape === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.2, 0, 6.3); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 2, p.s * .8, p.s * .8);
      ctx.restore();
    });
    if (dt < 2800) global.requestAnimationFrame(frame); else if (cv.parentNode) cv.parentNode.removeChild(cv);
  })();
};

BP.starPop = function (n, el) {
  injectCSS();
  var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : {left: global.innerWidth / 2, top: global.innerHeight / 2, width: 0};
  var d = document.createElement('div');
  d.className = 'bp-pop';
  d.textContent = '+' + n + ' ⭐';
  d.style.left = (r.left + r.width / 2) + 'px';
  d.style.top = r.top + 'px';
  document.body.appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1200);
};

var cheerQ = [], cheerOn = false;
BP.cheer = function (list) {
  (list.length === undefined ? [list] : list).forEach(function (c) { cheerQ.push(c); });
  if (!cheerOn) nextCheer();
};
function nextCheer() {
  var c = cheerQ.shift();
  if (!c) { cheerOn = false; return; }
  cheerOn = true;
  showCheer(c);
}
function showCheer(c) {
  injectCSS();
  var btns = c.buttons && c.buttons.length ? c.buttons : [{label: '太棒了！', primary: true}];
  var wrap = document.createElement('div');
  wrap.className = 'bp-modal';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = '<div class="bp-card bp-cheer' + (c.big ? ' big' : '') + '"><div class="bp-emoji">' + esc(c.icon || '🎉') + '</div><h2>' + esc(c.title) + '</h2>' +
    (c.sub ? '<p>' + esc(c.sub) + '</p>' : '') + (c.stars ? '<div class="bp-gain">+' + c.stars + ' ⭐</div>' : '') +
    '<div class="bp-btns">' + btns.map(function (b, i) { return '<button type="button" class="bp-btn' + (b.primary ? ' primary' : '') + '" data-i="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div></div>';
  document.body.appendChild(wrap);
  BP.sound(c.big ? 'big' : c.badge ? 'badge' : 'ok');
  BP.confetti(c.confetti === false ? 0 : c.big ? 2 : 1);
  var first = wrap.querySelector('.bp-btn.primary') || wrap.querySelector('.bp-btn');
  if (first) first.focus();
  function close(i) {
    document.removeEventListener('keydown', onKey, true);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    var b = btns[i];
    if (b && b.onClick) { cheerQ.length = 0; cheerOn = false; b.onClick(); } else nextCheer();
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(btns.length - 1); } }
  document.addEventListener('keydown', onKey, true);
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.bp-btn') : null;
    if (b) close(+b.getAttribute('data-i'));
  });
}

/* ---------- 乐探究：模板 ---------- */
var UNIVERSAL_HINT = '用自己的话写，不用抄视频里的原话。';
var T = {};
T['科学实验'] = {
  think: ['视频里发生了什么？你觉得最关键的一步是哪一步？', '如果换一个条件（更多、更少、更热、更冷……），结果会变吗？先写下你的猜想。', '生活里还有哪里也有类似的现象？'],
  build: {title: '做一个小对比实验', materials: ['纸和笔', '家里安全的小物件（杯子、水、勺子、纸）', '手机计时器'],
    steps: ['选一个条件来变，其他条件都保持不变（这叫控制变量）', '先写下你猜会发生什么', '做 3 次，把每次的结果都记下来', '比较结果，和你的猜想一样吗？'],
    safety: '不碰火、插座和有刺激性的东西；要用热水、刀具时请大人陪着。'},
  challenge: '能不能设计一个办法，让结果更大、更快或更远？'
};
T['AI 入门'] = {
  think: ['AI 在这里是怎么"学"的？它看了什么，又从哪里得到反馈？', '如果 AI 学错了，可能是哪里出了问题？', '哪些事情人比 AI 做得好？为什么？'],
  build: {title: '当一回"人肉 AI"', materials: ['10 张小卡片', '笔', '一位家人当"AI"'],
    steps: ['在 10 张卡片上各画一个简单图案（猫、狗、树、房子……）', '拿其中 6 张给家人"训练"：告诉他每张是什么', '再拿 4 张没给他看过的，让他猜', '记下猜对几张；想想哪种图案容易猜错，为什么'],
    safety: '不要把真人照片或个人信息上传到任何网站。'},
  challenge: '想一个能用 AI 帮忙的生活小问题，画出它需要哪些"数据"。'
};
T['AI 进阶'] = T['AI 入门'];
T['数学'] = {
  think: ['视频里用了什么小窍门？能用自己的话讲一遍吗？', '它和你学过的哪个知识有联系？', '照着视频的思路，出一道题考考家人。'],
  build: {title: '出题与验证', materials: ['纸和笔', '骰子或一副扑克牌'],
    steps: ['用骰子或扑克牌随机产生几个数', '按视频里的方法算一算', '换另一种办法验算，答案一样吗？', '把最有趣的一题记下来，做成"出题卡"'],
    safety: '无特别危险。'},
  challenge: '有没有更快的办法？试着发现一个规律，并解释它为什么成立。'
};
T['计算机编程'] = {
  think: ['这段程序（或思路）由哪几步组成？顺序能换吗？', '哪里可能出错（bug）？你会怎么检查？', '你想用编程解决生活里的哪个小问题？'],
  build: {title: '画一张流程图，或做一个小程序', materials: ['纸和笔，或 Scratch 网站'],
    steps: ['把一件日常小事（比如泡面）写成一步一步的流程', '标出里面的"如果……就……"和"重复"', '让家人当"计算机"，严格按你的步骤执行', '发现错误就改一改（这叫调试）'],
    safety: '真的用厨房、热水时请大人陪着，可以先"假装做"。'},
  challenge: '在 Scratch 里做出一个小游戏的最小版本：能动、能得分。'
};
T['自然动物'] = {
  think: ['这种动物有什么特别的本领？身体的哪个部分在帮它？', '它生活的环境有什么特点？', '如果环境变了，它会遇到什么困难？'],
  build: {title: '做一次观察记录', materials: ['笔记本和笔', '放大镜（可选）', '小区或公园里的一个角落'],
    steps: ['找一种身边的小生物或植物', '安静观察 10 分钟，画下它的样子', '记录：它在做什么？周围环境怎么样？', '写下 1 个你想继续弄清楚的问题'],
    safety: '不要触摸陌生的动物和不认识的植物；不离开大人的视线，保持距离观察。'},
  challenge: '一周后再观察一次，看看有什么变化。'
};
T['地理天文'] = {
  think: ['视频里最让你惊讶的数字或现象是什么？', '它和我们的日常（昼夜、季节、天气）有什么关系？', '怎样才能自己验证一下？'],
  build: {title: '做一个"小模型"', materials: ['手电筒或台灯', '一个橘子或小球', '笔'],
    steps: ['手电筒当太阳，小球当地球', '慢慢转动小球，观察昼夜怎么变', '把小球的轴倾斜一点，观察光照面积的变化', '用自己的话解释：季节是怎么来的？'],
    safety: '不要直视太阳或强光。'},
  challenge: '查一查今天的日出日落时间，并解释为什么每天都在变。'
};
T['历史文博'] = {
  think: ['当时的人为什么会那样选择？', '如果你是当时的人，你会怎么做？', '这件事对今天的我们有什么影响？'],
  build: {title: '做一条"时间线"', materials: ['纸和彩笔'],
    steps: ['把视频里的 5 个关键事件按时间排好', '用一句话写每个事件的"原因"和"结果"', '画一件有代表性的物品', '给家人当一次小小讲解员'],
    safety: '无特别危险。'},
  challenge: '找一件和这段历史有关的文物或一个地方，规划一次参观。'
};
T['动手创造'] = {
  think: ['它是怎么被造出来的？用了哪些材料和工具？', '如果让你改进一个地方，你会改哪里？', '怎样才能更省材料、更结实？'],
  build: {title: '做一个小作品并测试', materials: ['纸板、纸杯、吸管、胶带等废旧材料', '剪刀（大人在旁）'],
    steps: ['先画设计草图', '动手做出第一版', '测试：它能做到什么？哪里最先坏？', '改进做第二版，对比两版的差别'],
    safety: '用剪刀、热熔胶、电池时请大人在旁边；不要拆有电的家电。'},
  challenge: '给作品定一个指标（承重、飞行距离……），用数据证明第二版更好。'
};
var T_DEFAULT = {
  think: ['这个视频讲的最关键的一个想法是什么？', '它和你已经知道的什么东西有联系？', '你还想知道什么？可以去哪里找答案？'],
  build: {title: '做一个小尝试', materials: ['纸和笔'],
    steps: ['选视频里一个你想验证的小想法', '先写下你猜会怎样', '想办法试一试，把过程和结果记下来', '和猜想一样吗？为什么？'],
    safety: '动手前先想一想：材料安全吗？需不需要大人陪着？'},
  challenge: '把你学到的东西教给一个人，看他能不能听懂。'
};
BP.EXPLORE_TEMPLATES = T;

function shortTitle(s) { s = String(s || ''); return s.length > 22 ? s.slice(0, 22) + '…' : s; }
BP.exploreCard = function (v, custom) {
  custom = custom || BP.getCustom();
  var t = T[v.category] || T_DEFAULT, age = BP.profile().age || 10;
  var think = [{q: '看完《' + shortTitle(v.title) + '》，你最想记住的一件事是什么？为什么？', h: UNIVERSAL_HINT}, {q: t.think[0]}, {q: t.think[1]}];
  if (age >= 11) think.push({q: t.think[2]});
  var card = {title: '乐探究：' + shortTitle(v.title), think: think, build: clone(t.build), challenge: t.challenge,
    share: '用 1 分钟，把今天最有趣的发现讲给家人听，让他们也能听懂。'};
  var o = custom.exploreByVideo[v.id];
  if (o) {
    if (o.think && o.think.length) card.think = clone(o.think);
    if (o.build) card.build = clone(o.build);
    if (o.challenge != null) card.challenge = o.challenge;
    if (o.share != null) card.share = o.share;
  }
  return card;
};

/* 自由探究课题库（不用先看视频，随时可以做；家长和孩子都能在编辑器里添加自己的） */
BP.QUESTS = [
  {id: 'q-plane', icon: '✈️', title: '纸飞机大比拼', age: 9, why: '学会"一次只改一个条件"来公平比较。',
    materials: ['A4 纸 4 张', '卷尺或用步数量', '回形针（可选）'],
    steps: ['折两种不同的纸飞机（比如宽翼和窄翼）', '每种飞 5 次，量一量飞多远，记下来', '算每种的平均距离', '只改一个条件（机翼折角、加回形针、纸张大小）再试一轮', '哪个条件影响最大？写下你的结论'],
    think: ['你猜哪种飞得更远？为什么？', '为什么每种要飞 5 次，而不是 1 次？', '如果每次投掷的力气不一样，比较还公平吗？'],
    safety: '在空旷的地方玩，不要朝人和宠物投掷。', challenge: '设计一架在空中停留时间最长的纸飞机。'},
  {id: 'q-float', icon: '🍊', title: '沉还是浮？', age: 9, why: '先猜想、再验证，像科学家一样。',
    materials: ['一盆水', '盐', '橘子、苹果、硬币、塑料瓶盖等小物件'],
    steps: ['先猜：哪些会浮，哪些会沉？写下来', '逐个放进水里验证', '带皮的橘子和剥了皮的橘子各试一次', '往水里加盐搅匀，再试那些沉下去的东西'],
    think: ['你是靠大小、轻重，还是别的来判断的？', '为什么带皮橘子会浮？', '加盐之后发生了什么？说说你的解释。'],
    safety: '注意擦干地面防滑；不要尝实验用的盐水。', challenge: '用橡皮泥做一艘能装最多硬币的小船。'},
  {id: 'q-bridge', icon: '🌉', title: '纸桥承重', age: 9, why: '同样的纸，不同的形状，强度差很多。',
    materials: ['A4 纸若干', '两摞书当桥墩', '硬币或回形针', '胶带'],
    steps: ['把一张纸平放在两摞书之间，看能放几枚硬币', '把纸折成瓦楞状或卷成筒，再试一次', '记录每种结构的承重数量', '找出最结实的结构，想想为什么'],
    think: ['为什么折过的纸更结实？', '生活里哪里用到了类似的结构？', '怎样用最少的纸承最多的重？'],
    safety: '别让书倒下来砸到脚。', challenge: '用 2 张纸造一座能承受 100 枚硬币的桥。'},
  {id: 'q-shadow', icon: '🌞', title: '影子测高度', age: 11, why: '用比例，不爬上去也能量出大树有多高。',
    materials: ['卷尺或直尺', '一个晴天', '纸笔'],
    steps: ['选一棵树或一栋楼，量它的影子长度', '量一位已知身高的人的影子长度', '用比例算出树或楼的高度', '换一个时间再测一次，结果一样吗？'],
    think: ['影子为什么会变长变短？', '为什么要找已知身高的人做对照？', '你的测量可能有哪些误差？'],
    safety: '不要直视太阳；在安全的地方测量，远离马路。', challenge: '一天里每小时测一次影子，画出变化曲线。'},
  {id: 'q-react', icon: '📏', title: '反应速度尺', age: 9, why: '用一把直尺，把"反应快慢"变成数据。',
    materials: ['30cm 直尺', '一位家人', '纸笔'],
    steps: ['家人捏住直尺上端，你的手放在 0 刻度处准备', '家人突然松手，你尽快夹住，读出落下的距离', '重复 10 次并记录', '换另一只手，或者闭上眼睛听口令，再测 10 次', '比较两组的平均值'],
    think: ['落下的距离越大，说明什么？', '你的反应会受哪些因素影响（专心、疲劳、用哪只手）？', '怎样才算公平比较？'],
    safety: '别用有尖角的金属尺。', challenge: '找一个能让平均成绩变好的办法，并用数据验证。'},
  {id: 'q-sprout', icon: '🌱', title: '种子发芽观察', age: 9, why: '用一周时间，亲眼看生命如何开始。',
    materials: ['绿豆或黄豆', '棉花或湿纸巾', '透明杯子', '笔记本'],
    steps: ['把种子放在湿棉花上，放进杯子', '每天固定时间画图或拍照，量一量根和芽的长度', '一半放在有光处，一半放在暗处，对比', '写下 7 天里的变化'],
    think: ['种子发芽需要什么条件？你是怎么验证的？', '有光和没光有什么不同？', '水太多会怎样？你想怎么试？'],
    safety: '实验用过的种子不要吃；做完洗手。', challenge: '设计实验：盐水会不会影响发芽？'},
  {id: 'q-humanai', icon: '🤖', title: '我来当一回 AI', age: 9, why: '亲手"训练"一个家人，弄懂机器学习的核心。',
    materials: ['10 张小卡片', '笔', '一位家人'],
    steps: ['在 10 张卡片上各画一个简单图案', '拿 6 张给家人"训练"：告诉他每张是什么', '再拿 4 张没给他看过的，让他猜', '记下猜对几张，想想哪种容易猜错、为什么'],
    think: ['哪种图案最容易猜错？为什么？', '只给 AI 看 2 张训练图会怎样？给 100 张呢？', 'AI 如果只见过黑猫，会不会认不出白猫？'],
    safety: '不要把真人照片或个人信息上传到任何网站。', challenge: '为"训练数据"设计一份更公平的清单（颜色、大小、角度都要有）。'},
  {id: 'q-algo', icon: '🍜', title: '生活里的程序', age: 11, why: '把日常小事写成"一步一步"，就是写程序的第一步。',
    materials: ['纸和笔', '一位家人'],
    steps: ['选一件日常小事（泡面、整理书包、刷牙）', '写成一步一步的清单，具体到不会产生歧义', '标出里面的"如果……就……"和"重复"', '请家人只按你的步骤做，不许自己发挥', '发现哪里没写清楚？修改后再来一遍'],
    think: ['为什么计算机需要写得特别具体？', '哪一步最容易出错（bug）？', '怎样让步骤更短又不丢信息？'],
    safety: '用厨房、热水前请大人陪同，这次可以只"假装做"。', challenge: '用 Scratch 把你的步骤做成一个小程序。'},
  {id: 'q-sound', icon: '🎵', title: '水杯音阶', age: 9, why: '声音的高低，藏着水位的秘密。',
    materials: ['5 个相同的杯子', '水', '筷子'],
    steps: ['在杯子里倒入不同高度的水', '用筷子轻轻敲杯壁，听音高', '按音高给杯子排队，看水位和音高有什么关系', '调出几个音，试着敲一首短曲'],
    think: ['水位高，音调变高还是变低？', '吹杯口和敲杯壁，规律一样吗？', '声音是怎么"传"到耳朵里的？'],
    safety: '用不易碎的杯子，轻轻敲；碎了请大人处理。', challenge: '做一个能演奏 8 个音的水杯乐器，并录下来。'}
];
BP.allQuests = function (custom) {
  custom = custom || BP.getCustom();
  return custom.quests.map(function (q) { var x = clone(q); x.mine = true; return x; }).concat(BP.QUESTS);
};
BP.questCard = function (q) {
  return {title: q.title, think: (q.think || []).map(function (s) { return {q: s}; }),
    build: {title: '动手步骤', materials: q.materials || [], steps: q.steps || [], safety: q.safety || ''},
    challenge: q.challenge || '', share: '用 1 分钟，把你的发现讲给家人听。'};
};

/* ---------- 乐探究：记录和弹窗 ---------- */
BP.records = function (pid) { return BP.load('explore', [], pid); };
function saveRec(rec) {
  var a = BP.records(), found = false;
  rec.u = Date.now();
  for (var i = 0; i < a.length; i++) if (a[i].id === rec.id) { a[i] = rec; found = true; }
  if (!found) a.push(rec);
  BP.save('explore', a);
}
BP.findRecord = function (kind, ref) {
  var a = BP.records();
  for (var i = a.length - 1; i >= 0; i--) if (a[i].kind === kind && a[i].ref === ref) return a[i];
  return null;
};
BP.deleteRecord = function (id) { BP.save('explore', BP.records().filter(function (r) { return r.id !== id; })); BP.emit('change'); };
BP.recordText = function (r) {
  var c = r.card || {}, L = ['【乐探究】' + (r.title || c.title || ''), '日期：' + ymd(new Date(r.u || r.t))];
  (c.think || []).forEach(function (q, i) { L.push('', '想一想：' + q.q, '我的想法：' + ((r.think || {})[i] || '')); });
  if (c.build) {
    L.push('', '动手做：' + (c.build.title || ''));
    (c.build.steps || []).forEach(function (s, i) { L.push(((r.steps || {})[i] ? '[x] ' : '[ ] ') + (i + 1) + '. ' + s); });
    L.push('我做了什么、发现了什么：' + (r.found || ''));
  }
  if (r.taught) L.push('', '我讲给「' + (r.who || '家人') + '」听了');
  if (r.rating) L.push('自评：' + new Array(r.rating + 1).join('★'));
  if (r.more) L.push('我还想知道：' + r.more);
  return L.join('\n');
};

BP.openExplore = function (opt) {
  injectCSS();
  var rec = opt.rec || (!opt.fresh ? BP.findRecord(opt.kind, opt.ref) : null);
  if (!rec) {
    rec = {id: uid('e'), kind: opt.kind, ref: opt.ref, title: opt.title, t: Date.now(), done: false, think: {}, steps: {}, found: '', did: false,
      taught: false, who: '', rating: 0, more: '', chal: '', card: clone(opt.card)};
  }
  if (!rec.card) rec.card = clone(opt.card);
  var c = rec.card, wrap = document.createElement('div'), timer, preview = !!opt.preview;
  wrap.className = 'bp-modal';
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
  var think = (c.think || []).map(function (q, i) {
    return '<label class="q">' + esc(q.q) + (q.h ? '<small>' + esc(q.h) + '</small>' : '') + '<textarea data-k="think" data-i="' + i + '" placeholder="写下你的想法……">' + esc((rec.think || {})[i] || '') + '</textarea></label>';
  }).join('');
  var b = c.build || {};
  var build = (b.steps && b.steps.length) || b.title ? '<section><h3>🔨 动手做：' + esc(b.title || '') + '</h3>' +
    (b.safety ? '<p class="safe">🛡️ 安全小提示：' + esc(b.safety) + '</p>' : '') +
    ((b.materials || []).length ? '<div class="mat">' + b.materials.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>' : '') +
    '<ol class="stp">' + (b.steps || []).map(function (s, i) { return '<li><label><input type="checkbox" data-k="step" data-i="' + i + '"' + ((rec.steps || {})[i] ? ' checked' : '') + '><span>' + esc(s) + '</span></label></li>'; }).join('') + '</ol>' +
    '<label class="q">我做了什么？发现了什么？<small>可以写数据、画图的想法，或者哪里和你猜的不一样。</small><textarea data-k="found" placeholder="记录你的发现……">' + esc(rec.found || '') + '</textarea></label></section>' : '';
  var chal = c.challenge ? '<section><h3>🚀 挑战（选做）</h3><p class="note">' + esc(c.challenge) + '</p><label class="q"><textarea data-k="chal" placeholder="你的挑战想法或结果……">' + esc(rec.chal || '') + '</textarea></label></section>' : '';
  wrap.innerHTML = '<div class="bp-card bp-ex-card"><div class="bp-ex-head"><span class="em">🔬</span><div><b>乐探究</b><small>' + esc(rec.title || c.title || '') + '</small></div>' +
    '<button type="button" class="x" data-act="close" aria-label="关闭">✕</button></div><div class="bp-ex-body">' +
    '<section><h3>🤔 想一想</h3><p class="note">不用写得很长，写下你真实的想法最重要。没有标准答案。</p>' + think + '</section>' + build + chal +
    '<section><h3>🗣️ 讲给家人听</h3>' + (c.share ? '<p class="note">' + esc(c.share) + '</p>' : '') +
    '<div class="teach"><label><input type="checkbox" data-k="taught"' + (rec.taught ? ' checked' : '') + '> 我讲给</label><input type="text" data-k="who" placeholder="谁？" value="' + esc(rec.who || '') + '"><span>听了</span></div></section>' +
    '<section><h3>⭐ 回顾</h3><p class="note">这次探究你给自己打几颗星？</p><div class="bp-rate">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-act="rate" data-n="' + n + '" class="' + (rec.rating >= n ? 'on' : '') + '" aria-label="' + n + ' 星">⭐</button>'; }).join('') + '</div>' +
    '<label class="q">我还想知道……<textarea data-k="more" placeholder="下一个好问题是什么？">' + esc(rec.more || '') + '</textarea></label></section>' +
    '</div><div class="bp-ex-foot"><span class="st" id="bp-ex-st">' + (preview ? '预览：不会保存，也不发星星' : rec.done ? '已完成，可以继续修改' : '写到哪存到哪，随时可以回来') + '</span>' +
    '<button type="button" class="bp-btn" data-act="close">先存着</button><button type="button" class="bp-btn primary" data-act="finish">' + (rec.done ? '更新探究' : '完成探究 🎉') + '</button></div></div>';
  document.body.appendChild(wrap);
  var st = wrap.querySelector('#bp-ex-st');
  function flush() { clearTimeout(timer); if (preview) return; saveRec(rec); if (st) st.textContent = '已自动保存 ✓'; }
  function close() {
    flush();
    document.removeEventListener('keydown', onKey, true);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    BP.emit('change');
    if (opt.onClose) opt.onClose(rec);
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
  document.addEventListener('keydown', onKey, true);
  function bind(el) {
    var k = el.getAttribute('data-k'), i = el.getAttribute('data-i');
    if (!k) return;
    var v = el.type === 'checkbox' ? el.checked : el.value;
    if (k === 'think') rec.think[i] = v;
    else if (k === 'step') rec.steps[i] = v;
    else rec[k] = v;
    clearTimeout(timer); timer = setTimeout(flush, 500);
  }
  wrap.addEventListener('input', function (e) { bind(e.target); });
  wrap.addEventListener('change', function (e) { bind(e.target); });
  wrap.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'close') close();
    else if (act === 'rate') {
      rec.rating = +a.getAttribute('data-n');
      var bs = wrap.querySelectorAll('.bp-rate button');
      for (var i = 0; i < bs.length; i++) bs[i].className = (i < rec.rating) ? 'on' : '';
      flush();
    } else if (act === 'finish') {
      if (preview) { close(); BP.say('这是预览，没有保存也没有发星星'); return; }
      var filled = Object.keys(rec.think).filter(function (k) { return String(rec.think[k] || '').trim().length >= 2; }).length;
      if (!filled) { BP.say('先写下至少一个想法吧 ✍️'); return; }
      var wasDone = rec.done;
      rec.done = true; rec.doneAt = Date.now();
      rec.did = Object.keys(rec.steps).some(function (k) { return rec.steps[k]; }) || String(rec.found || '').trim().length >= 4;
      flush();
      var g = BP.game(), base = 'x:' + rec.kind + ':' + rec.ref, items = [];
      if (rec.kind === 'quest' && g.keys[base]) items.push({key: 'xq:' + rec.id, n: 3, label: '再做一次课题'});
      else items.push({key: base, n: rec.kind === 'quest' ? 10 : 6, label: '完成乐探究'});
      if (rec.did) items.push({key: 'xb:' + rec.kind + ':' + rec.ref, n: 6, label: '真的动手做了'});
      if (rec.taught) items.push({key: 'xt:' + rec.kind + ':' + rec.ref, n: 2, label: '讲给家人听'});
      document.removeEventListener('keydown', onKey, true);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      var res = BP.reward(items, {before: function (s) {
        return [{icon: '🔬', title: '探究完成！', sub: rec.did ? '你想了，也做了。这就是科学家的方式！' : '想法记下来啦。下次试着再动手验证一下吧！', stars: s, big: true}];
      }});
      if (!res.ok) BP.say(wasDone ? '探究已更新 ✓' : '已保存 ✓');
      BP.emit('change');
      if (opt.onClose) opt.onClose(rec);
    }
  });
  var first = wrap.querySelector('textarea');
  if (first && global.innerWidth > 700) first.focus();
};

/* ---------- 备份与恢复（编辑器用） ---------- */
BP.exportAll = function () {
  var items = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('bp2-') === 0) items[k] = localStorage.getItem(k);
    }
  } catch (e) {}
  return {app: 'bilipicks-kids', version: 2, exported: new Date().toISOString(), items: items};
};
BP.importAll = function (obj, replace) {
  if (!obj || obj.app !== 'bilipicks-kids' || !obj.items) return {ok: false, msg: '这不是乐学版的备份文件'};
  try {
    if (replace) {
      var del = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('bp2-') === 0) del.push(k); }
      del.forEach(function (k) { localStorage.removeItem(k); });
    }
    var n = 0;
    for (var key in obj.items) if (key.indexOf('bp2-') === 0 && typeof obj.items[key] === 'string') { localStorage.setItem(key, obj.items[key]); n++; }
    return {ok: true, n: n};
  } catch (e) { return {ok: false, msg: '写入失败：' + e.message}; }
};

/* ---------- 一键发布到线上（把本机数据推到 GitHub，Cloudflare Pages 自动重新部署） ---------- */
BP.GH_REPO = {owner: 'cheerful508', repo: 'custom_bilipicks', branch: 'main', path: 'profiles-data.js'};
function b64encode(str) {
  var bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p) { return String.fromCharCode(parseInt(p, 16)); });
  return global.btoa(bytes);
}
BP.publish = function (token) {
  var R = BP.GH_REPO;
  var api = 'https://api.github.com/repos/' + R.owner + '/' + R.repo + '/contents/' + R.path;
  var headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json'};
  var content = b64encode('window.BP_PUBLISHED = ' + JSON.stringify(BP.exportAll()) + ';\n');
  function readJson(r) { return r.json().catch(function () { return {}; }); }
  function getSha() {
    return fetch(api + '?ref=' + R.branch, {headers: headers}).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) return readJson(r).then(function (j) { return Promise.reject({status: r.status, msg: j.message}); });
      return readJson(r).then(function (j) { return j.sha; });
    });
  }
  function put(sha) {
    var body = {message: '发布：' + ymd() + ' ' + new Date().toTimeString().slice(0, 8), content: content, branch: R.branch};
    if (sha) body.sha = sha;
    return fetch(api, {method: 'PUT', headers: headers, body: JSON.stringify(body)}).then(function (r) {
      if (r.ok) return {ok: true};
      return readJson(r).then(function (j) { return Promise.reject({status: r.status, msg: j.message}); });
    });
  }
  function attempt(retrying) {
    return getSha().then(put).catch(function (e) {
      if (e && e.status === 409 && !retrying) return attempt(true);
      return Promise.reject(e);
    });
  }
  return attempt(false).then(function (res) {
    jset('bp2-last-published', new Date().toISOString());
    return res;
  }).catch(function (e) {
    var status = e && e.status, msg = e && e.msg;
    if (status === 401) return {ok: false, msg: '令牌不对或已过期，去 GitHub 重新生成一个'};
    if (status === 403) return {ok: false, msg: '这个令牌没有这个仓库的写入权限'};
    if (status === 409) return {ok: false, msg: '版本有冲突，请再点一次发布'};
    if (status) return {ok: false, msg: '发布失败（' + status + '）' + (msg ? '：' + msg : '')};
    return {ok: false, msg: '网络错误，请检查网络后重试'};
  });
};

/* ---------- 从 B 站读取视频信息（JSONP，和原项目取封面是同一个办法） ---------- */
BP.parseBvid = function (s) {
  var m = String(s || '').match(/BV[0-9A-Za-z]{10}/);
  return m ? m[0] : '';
};
var jsonpSeq = 0;
BP.biliInfo = function (bvid) {
  return new Promise(function (resolve) {
    var cb = '__bpInfo' + (++jsonpSeq), sc = document.createElement('script'), done = false;
    function fin(v) {
      if (done) return; done = true;
      global[cb] = function () {};
      if (sc.parentNode) sc.parentNode.removeChild(sc);
      resolve(v);
    }
    var timer = setTimeout(function () { fin(null); }, 8000);
    global[cb] = function (j) {
      clearTimeout(timer);
      if (!j || j.code !== 0 || !j.data) return fin(null);
      var d = j.data, pic = d.pic || '';
      if (pic.indexOf('//') === 0) pic = 'https:' + pic;
      if (pic.indexOf('http://') === 0) pic = 'https://' + pic.slice(7);
      var cover = '';
      try { var u = new URL(pic); if (/(^|\.)(hdslb|biliimg)\.com$/.test(u.hostname)) cover = u.origin + u.pathname + '@672w_378h_1c.webp'; } catch (e) {}
      fin({title: d.title || '', channel: d.owner ? d.owner.name : '', mid: d.owner ? d.owner.mid : 0, duration: d.duration || 0, cover: cover, parts: d.videos || 1});
    };
    sc.onerror = function () { clearTimeout(timer); fin(null); };
    sc.src = 'https://api.bilibili.com/x/web-interface/view?bvid=' + encodeURIComponent(bvid) + '&jsonp=jsonp&callback=' + cb;
    document.head.appendChild(sc);
  });
};

})(window);
