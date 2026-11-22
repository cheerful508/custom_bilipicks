/* BiliPicks 乐学版 · 界面扩展：档案切换、成长看板、我的成长、乐探究、庆祝
 * 在 index.html 的主脚本之前加载；这里的函数只在运行时才用到 $、state、go 等主脚本里的东西。
 */
var E = BP.esc;
var exploreTab = 'quests';

/* ---------- 主题色 ---------- */
function mixHex(hex, to, t) {
  function p(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  var a = p(hex), b = p(to), o = [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); });
  return '#' + o.map(function (n) { return (n < 16 ? '0' : '') + n.toString(16); }).join('');
}
function lumOf(hex) {
  var h = hex.replace('#', ''), r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function kidsAccent(dark) {
  var c = BP.profile().theme || '#2f86e0', col = dark ? mixHex(c, '#ffffff', 0.3) : c, st = document.documentElement.style;
  st.setProperty('--accent', col);
  st.setProperty('--on-accent', lumOf(col) > 0.6 ? '#10202f' : '#ffffff');
}

/* ---------- 顶栏：头像 + 星星 + 切换菜单 ---------- */
function renderProfileBtn() {
  var p = BP.profile(), b = document.getElementById('btn-profile');
  if (!b) return;
  b.innerHTML = '<span class="pb-av">' + E(p.avatar) + '</span><span class="pb-st">⭐ ' + BP.stars() + '</span>';
  b.setAttribute('aria-label', p.name + ' 的档案，' + BP.stars() + ' 颗星星');
  var lt = document.querySelector('.logo-t');
  if (lt) lt.textContent = p.name + '的学习站';
  document.title = p.name + '的学习站 · BiliPicks 乐学版';
}
function renderProfileMenu() {
  var m = document.getElementById('pmenu'), cur = BP.profile().id;
  m.innerHTML = '<p class="pm-t">换一位小学员</p>' + BP.profiles().map(function (p) {
    return '<button type="button" class="pm-item' + (p.id === cur ? ' on' : '') + '" data-switch="' + E(p.id) + '"><span class="pm-av">' + E(p.avatar) + '</span><b>' + E(p.name) + '</b><em>' + p.age + ' 岁 · ⭐ ' + BP.stars(p.id) + '</em></button>';
  }).join('') + '<hr><button type="button" class="pm-link" data-pm="me">🏆 我的成长</button><button type="button" class="pm-link" data-pm="explore">🔬 乐探究</button>' +
    '<a class="pm-link" href="editor.html#profile">✏️ 编辑我的页面</a>' +
    '<a class="pm-link" href="tv.html">📺 大屏版</a>' +
    '<button type="button" class="pm-link" data-pm="sound">' + (BP.profile().sound === false ? '🔇 音效：关' : '🔊 音效：开') + '</button>';
}
function switchProfile(id) {
  BP.setCurrent(id);
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  location.reload();
}
function showChooser() {
  BP.injectCSS();
  var w = document.createElement('div');
  w.className = 'bp-modal chooser';
  w.innerHTML = '<div class="bp-card chooser-card"><h2>你是谁？</h2><p>点一下自己的头像，进入你的学习站。</p><div class="chooser-row">' +
    BP.profiles().map(function (p) {
      return '<button type="button" class="chooser-p" data-switch="' + E(p.id) + '" style="--c:' + E(p.theme) + '"><span class="av">' + E(p.avatar) + '</span><b>' + E(p.name) + '</b><em>' + p.age + ' 岁</em></button>';
    }).join('') + '</div><a class="chooser-parent" href="editor.html">我是家长，去编辑器</a></div>';
  document.body.appendChild(w);
  w.addEventListener('click', function (e) {
    var b = e.target.closest('[data-switch]');
    if (b) switchProfile(b.getAttribute('data-switch'));
  });
}

/* ---------- 首页成长看板 ---------- */
function renderKidbar() {
  var el = document.getElementById('kidbar');
  if (!el) return;
  var p = BP.profile(), g = BP.game(), lv = BP.level(g.earned), bal = g.earned - g.spent, streak = BP.streak(g), today = BP.todayCount(g), goal = p.goal || 2;
  el.innerHTML = '<button type="button" class="kidbar" data-go="me" aria-label="打开我的成长">' +
    '<span class="kb-av">' + E(p.avatar) + '</span>' +
    '<span class="kb-hello"><b>你好，' + E(p.name) + '！</b><span class="kb-slogan">' + E(p.slogan || '') + '</span>' +
    '<span class="kb-lv"><i class="kb-lvbar"><i style="width:' + lv.pct + '%"></i></i><em>Lv.' + lv.no + ' ' + lv.icon + ' ' + E(lv.name) + (lv.next ? '，还差 ' + (lv.next - g.earned) + ' ⭐ 升级' : '，满级啦！') + '</em></span></span>' +
    '<span class="kb-stats">' +
    '<span class="kb-stat"><b>⭐ ' + bal + '</b><span>星星</span></span>' +
    '<span class="kb-stat"><b>🔥 ' + streak + '</b><span>连续天数</span></span>' +
    '<span class="kb-stat' + (today >= goal ? ' ok' : '') + '"><b>' + (today >= goal ? '✅ ' : '🎯 ') + Math.min(today, 99) + '/' + goal + '</b><span>今日目标</span></span>' +
    '</span></button>';
}

/* ---------- 看完视频 / 动手任务：发星星、庆祝、邀请去乐探究 ---------- */
var PRAISE = ['又学会一个新知识！', '好奇心满格！', '你离答案又近了一步。', '坚持就是超能力！', '大脑刚刚升级了一点点。'];
function openVideoExplore(v, slide) {
  BP.openExplore({kind: 'video', ref: v.id, title: v.title, card: BP.exploreCard(v), onClose: function () { if (slide) paintExplore(slide, v); }});
}
function paintExplore(slide, v) {
  var b = slide && slide.querySelector('[data-act="explore"]');
  if (!b) return;
  var r = BP.findRecord('video', v.id);
  b.textContent = r && r.done ? '🔬 探究 ✓' : '🔬 乐探究';
  b.classList.toggle('on', !!(r && r.done));
}
function kidsAfterDone(v, st, cleared, slide) {
  var items = [{key: 'v:' + v.id, n: 3, label: '看完一条视频'}];
  if (cleared) items.push({key: 'stage:' + st.key, n: 15, label: '第 ' + st.no + ' 关通关'});
  var rec = BP.findRecord('video', v.id), invite = !(rec && rec.done);
  var go = function () { openVideoExplore(v, slide); };
  var res = BP.reward(items, {
    before: function (s) {
      if (cleared) return [{icon: st.icon || '🏆', title: '第 ' + st.no + ' 关通关！', sub: '「' + st.name + '」全部看完了。别忘了这一关的动手任务！', stars: s, big: true}];
      return [{icon: '🎉', title: '看完啦！', sub: invite ? PRAISE[Math.floor(Math.random() * PRAISE.length)] + ' 趁热打铁，来一次 5 分钟的乐探究，还能再得星星。' : PRAISE[Math.floor(Math.random() * PRAISE.length)],
        stars: s, buttons: invite ? [{label: '🔬 去乐探究', primary: true, onClick: go}, {label: '继续看'}] : null}];
    },
    after: function () {
      return cleared && invite ? [{icon: '🔬', title: '来一次乐探究？', sub: '花 5 分钟想一想、动动手，还能再得星星。', confetti: false,
        buttons: [{label: '🔬 去乐探究', primary: true, onClick: go}, {label: '以后再说'}]}] : [];
    }
  });
  if (!res.ok) toast('记下了（同一条视频的星星只发一次哦）');
}
function kidsMissionDone(key, no) {
  var res = BP.reward({key: 'm:' + key, n: 10, label: '动手任务'}, {before: function (s) {
    return [{icon: '🔧', title: '第 ' + no + ' 关动手任务完成！', sub: '亲手做出来的东西，才是真的学会了。', stars: s}];
  }});
  if (!res.ok) toast('第 ' + no + ' 关的动手任务完成，了不起');
}

/* ---------- 我的成长 ---------- */
function fmtDate(t) {
  var d = new Date(t);
  return (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
}
function renderMe() {
  var p = BP.profile(), g = BP.game(), lv = BP.level(g.earned), bal = g.earned - g.spent, st = BP.stats(), c = BP.getCustom();
  var week = BP.last7(g), maxN = Math.max(1, Math.max.apply(null, week.map(function (d) { return d.n; })));
  var badges = BP.BADGES.map(function (b) {
    var got = g.badges[b.id];
    return '<div class="badge' + (got ? ' got' : '') + '" title="' + E(b.desc) + '"><span class="bi">' + (got ? b.icon : '🔒') + '</span><b>' + E(b.name) + '</b><small>' + E(b.desc) + '</small></div>';
  }).join('');
  var wishes = c.wishes.map(function (w) {
    var can = bal >= w.cost;
    return '<div class="wish"><span class="em">' + E(w.emoji || '🎁') + '</span><div class="wi"><b>' + E(w.name) + '</b><small>' + w.cost + ' ⭐' + (can ? '' : '，还差 ' + (w.cost - bal)) + '</small></div>' +
      '<button type="button" class="btn sm ' + (can ? 'primary' : '') + '" data-redeem="' + E(w.id) + '"' + (can ? '' : ' disabled') + '>兑换</button></div>';
  }).join('') || '<p class="fine">还没有心愿。去编辑器里添一个吧。</p>';
  var hist = g.redeemed.slice(0, 8).map(function (r) {
    return '<div class="wish hist' + (r.used ? ' used' : '') + '"><span class="em">' + E(r.emoji || '🎁') + '</span><div class="wi"><b>' + E(r.name) + '</b><small>' + fmtDate(r.t) + ' 兑换，花了 ' + r.cost + ' ⭐</small></div>' +
      '<button type="button" class="btn sm" data-used="' + E(r.id) + '">' + (r.used ? '✓ 已兑现' : '家长确认兑现') + '</button></div>';
  }).join('');
  var log = g.log.slice(0, 8).map(function (l) { return '<li><b>+' + l.n + ' ⭐</b> ' + E(l.label) + '<small>' + fmtDate(l.t) + '</small></li>'; }).join('');
  document.getElementById('me-root').innerHTML =
    '<div class="me-card"><span class="me-av">' + E(p.avatar) + '</span><div class="me-id"><h1>' + E(p.name) + '</h1><p>' + p.age + ' 岁 · ' + E(p.slogan || '') + '</p>' +
    '<div class="kb-lv"><i class="kb-lvbar"><i style="width:' + lv.pct + '%"></i></i><em>Lv.' + lv.no + ' ' + lv.icon + ' ' + E(lv.name) + (lv.next ? '，距离「' + E(lv.nextName) + '」还差 ' + (lv.next - g.earned) + ' ⭐' : '，已经是最高等级！') + '</em></div></div>' +
    '<a class="btn sm" href="editor.html#profile">✏️ 编辑</a></div>' +
    '<div class="me-kpis"><div class="kpi"><b>⭐ ' + bal + '</b><span>可用星星</span></div><div class="kpi"><b>' + st.done + '</b><span>看完的视频</span></div><div class="kpi"><b>' + st.explores + '</b><span>完成的探究</span></div><div class="kpi"><b>🔥 ' + st.streak + '</b><span>连续学习天数</span></div></div>' +
    '<h2 class="sec">最近 7 天</h2><div class="week">' + week.map(function (d) {
      return '<div class="wd' + (d.today ? ' today' : '') + '"><i style="height:' + (6 + Math.round(d.n / maxN * 44)) + 'px" class="' + (d.n ? 'on' : '') + '"></i><span>' + (d.today ? '今' : d.label) + '</span><small>' + (d.n || '') + '</small></div>';
    }).join('') + '</div>' +
    '<h2 class="sec">徽章墙 <small>' + Object.keys(g.badges).length + ' / ' + BP.BADGES.length + '</small></h2><div class="badges-wall">' + badges + '</div>' +
    '<h2 class="sec">心愿商店</h2><p class="lead">用星星兑换自己定的奖励。奖励内容可以和家长一起在编辑器里商量着改。</p><div class="wishes">' + wishes + '</div>' +
    (hist ? '<h3 class="sub">兑换记录</h3><div class="wishes">' + hist + '</div>' : '') +
    (log ? '<h2 class="sec">最近的星星</h2><ul class="starlog">' + log + '</ul>' : '') +
    '<p class="fine"><a href="#" data-pm="explore">🔬 去乐探究</a>　·　<a href="#" data-pm="tiers">B 站频道榜</a>　·　<a href="#" data-pm="about">关于</a>　·　<a href="editor.html">✏️ 打开编辑器</a></p>';
}

/* ---------- 乐探究 ---------- */
function copyText(t) {
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制，可以粘贴给家人'); } catch (e) { toast('复制失败，请手动选择文字'); }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('已复制，可以粘贴给家人'); }, fallback);
  else fallback();
}
function questCardHTML(q) {
  var recs = BP.records().filter(function (r) { return r.kind === 'quest' && r.ref === q.id && r.done; });
  var age = BP.profile().age || 10;
  return '<div class="quest">' +
    '<div class="qh"><span class="qi">' + E(q.icon || '🔬') + '</span><div><b>' + E(q.title) + '</b><small>' + (q.mine ? '自己加的 · ' : '') + (q.age || 9) + ' 岁+' + (q.age > age ? ' · 稍有挑战' : '') + '</small></div></div>' +
    '<p>' + E(q.why || '') + '</p>' +
    '<div class="qm">' + (q.materials || []).slice(0, 4).map(function (m) { return '<span>' + E(m) + '</span>'; }).join('') + '</div>' +
    '<div class="qf"><span class="count">' + (recs.length ? '完成过 ' + recs.length + ' 次' : '还没做过') + '</span>' +
    '<button type="button" class="btn sm primary" data-quest="' + E(q.id) + '">' + (recs.length ? '再做一次' : '开始探究') + '</button></div></div>';
}
function renderExplore() {
  var recs = BP.records().slice().sort(function (a, b) { return (b.u || b.t) - (a.u || a.t); });
  var quests = BP.allQuests(), age = BP.profile().age || 10;
  var doneVideos = (typeof pathItems !== 'undefined' ? DATA.videos : []).filter(function (v) { return !v.dead && isDone(v.id) && !(BP.findRecord('video', v.id) || {}).done; }).slice(0, 6);
  var html = '<h1>🔬 乐探究</h1><p class="lead">看完视频不是终点。<b>想一想、动手做、讲出来</b>，才算真的学会。每次探究都有星星奖励，真的动手做了奖励更多。</p>' +
    '<div class="filters"><button type="button" class="chip ' + (exploreTab === 'quests' ? 'on' : '') + '" data-xt="quests">探究课题库</button>' +
    '<button type="button" class="chip ' + (exploreTab === 'journal' ? 'on' : '') + '" data-xt="journal">我的探究本（' + recs.length + '）</button></div>';
  if (exploreTab === 'quests') {
    if (doneVideos.length) {
      html += '<h2 class="sec">看过了，还没探究</h2><div class="xlist">' + doneVideos.map(function (v) {
        return '<div class="xrow"><span class="xi">📺</span><div class="xt"><b>' + E(v.title) + '</b><small>' + E(v.category) + '</small></div><button type="button" class="btn sm primary" data-vexplore="' + E(v.id) + '">去探究</button></div>';
      }).join('') + '</div>';
    }
    quests.sort(function (a, b) { return (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || Math.abs((a.age || 9) - age) - Math.abs((b.age || 9) - age); });
    html += '<h2 class="sec">自由探究课题</h2><p class="lead">不用先看视频，随时都能玩。一个课题第一次完成最多得 10 ⭐，再做一次也有 3 ⭐。</p><div class="quests">' + quests.map(questCardHTML).join('') + '</div>' +
      '<p class="fine">想加自己的课题？去<a href="editor.html#explore">编辑器</a>的「乐探究」页，写下问题、材料和步骤就行。</p>';
  } else if (!recs.length) {
    html += '<p class="empty">探究本还是空的。去「探究课题库」挑一个，或者看完视频后点「🔬 乐探究」。</p>';
  } else {
    html += '<div class="journal-tools"><button type="button" class="btn sm" data-print>🖨️ 打印探究本</button></div><div class="journal">' + recs.map(function (r) {
      var first = '';
      var th = r.think || {};
      for (var k in th) if (String(th[k] || '').trim()) { first = String(th[k]).trim(); break; }
      return '<article class="jr' + (r.done ? '' : ' draft') + '"><div class="jh"><span class="ji">' + (r.kind === 'quest' ? '🧭' : '🔬') + '</span><div class="jt"><b>' + E(r.title || (r.card && r.card.title) || '探究') + '</b>' +
        '<small>' + fmtDate(r.u || r.t) + (r.done ? '' : ' · 草稿') + (r.did ? ' · 动手了' : '') + (r.taught ? ' · 讲给' + E(r.who || '家人') + '听' : '') + (r.rating ? ' · ' + new Array(r.rating + 1).join('⭐') : '') + '</small></div></div>' +
        (first ? '<p>' + E(first.length > 90 ? first.slice(0, 90) + '…' : first) + '</p>' : '') +
        (r.found ? '<p class="jf"><b>发现：</b>' + E(r.found.length > 90 ? r.found.slice(0, 90) + '…' : r.found) + '</p>' : '') +
        '<div class="jb"><button type="button" class="btn sm" data-ropen="' + E(r.id) + '">打开</button><button type="button" class="btn sm" data-rcopy="' + E(r.id) + '">复制文字</button><button type="button" class="btn sm" data-rdel="' + E(r.id) + '">删除</button></div></article>';
    }).join('') + '</div>';
  }
  document.getElementById('explore-root').innerHTML = html;
}
function openQuest(id) {
  var q = BP.allQuests().filter(function (x) { return x.id === id; })[0];
  if (!q) return;
  var had = BP.records().some(function (r) { return r.kind === 'quest' && r.ref === id && r.done; });
  BP.openExplore({kind: 'quest', ref: id, title: q.title, card: BP.questCard(q), fresh: had, onClose: function () { if (state.view === 'explore') renderExplore(); }});
}

/* ---------- 初始化：事件 ---------- */
function kidsInit() {
  BP.hooks.toast = toast;
  BP.hooks.stagesCleared = function () { return stages.filter(function (s) { return s.vids.length && doneCount(s.vids) === s.vids.length; }).length; };
  var menu = document.getElementById('pmenu'), btn = document.getElementById('btn-profile');
  function closeMenu() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) { renderProfileMenu(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); } else closeMenu();
  });
  document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('#pmenu') && !e.target.closest('#btn-profile')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });
  menu.addEventListener('click', function (e) {
    var s = e.target.closest('[data-switch]'), m = e.target.closest('[data-pm]');
    if (s) { if (s.getAttribute('data-switch') !== BP.profile().id) switchProfile(s.getAttribute('data-switch')); else closeMenu(); return; }
    if (m) {
      var k = m.getAttribute('data-pm');
      if (k === 'sound') {
        var p = BP.profile();
        BP.updateProfile(p.id, {sound: p.sound === false});
        renderProfileMenu();
        if (BP.profile().sound !== false) BP.sound('ok');
        return;
      }
      closeMenu(); go(k);
    }
  });
  document.getElementById('kidbar').addEventListener('click', function (e) { if (e.target.closest('[data-go]')) go('me'); });

  document.getElementById('me-root').addEventListener('click', function (e) {
    var r = e.target.closest('[data-redeem]'), u = e.target.closest('[data-used]'), pm = e.target.closest('[data-pm]');
    if (pm) { e.preventDefault(); go(pm.getAttribute('data-pm')); return; }
    if (r) {
      var w = BP.getCustom().wishes.filter(function (x) { return x.id === r.getAttribute('data-redeem'); })[0];
      if (!w || !confirm('用 ' + w.cost + ' ⭐ 兑换「' + w.name + '」吗？')) return;
      var res = BP.redeem(w);
      if (!res.ok) { toast(res.msg); return; }
      BP.cheer({icon: w.emoji || '🎁', title: '兑换成功！', sub: '去找爸爸妈妈兑现吧：' + w.name, big: true});
    } else if (u) {
      if (BP.askPin('请家长输入口令确认')) { BP.markUsed(u.getAttribute('data-used')); renderMe(); }
    }
  });
  document.getElementById('explore-root').addEventListener('click', function (e) {
    var t = e.target.closest('[data-xt]'), q = e.target.closest('[data-quest]'), v = e.target.closest('[data-vexplore]'),
      ro = e.target.closest('[data-ropen]'), rc = e.target.closest('[data-rcopy]'), rd = e.target.closest('[data-rdel]'), pr = e.target.closest('[data-print]');
    if (t) { exploreTab = t.getAttribute('data-xt'); renderExplore(); }
    else if (q) openQuest(q.getAttribute('data-quest'));
    else if (v) {
      var vid = DATA.videos.filter(function (x) { return x.id === v.getAttribute('data-vexplore'); })[0];
      if (vid) BP.openExplore({kind: 'video', ref: vid.id, title: vid.title, card: BP.exploreCard(vid), onClose: renderExplore});
    } else if (ro) {
      var rec = BP.records().filter(function (x) { return x.id === ro.getAttribute('data-ropen'); })[0];
      if (rec) BP.openExplore({rec: rec, kind: rec.kind, ref: rec.ref, title: rec.title, card: rec.card, onClose: renderExplore});
    } else if (rc) {
      var rr = BP.records().filter(function (x) { return x.id === rc.getAttribute('data-rcopy'); })[0];
      if (rr) copyText(BP.recordText(rr));
    } else if (rd) {
      if (confirm('确定删除这条探究记录吗？删掉就找不回来了。')) { BP.deleteRecord(rd.getAttribute('data-rdel')); renderExplore(); }
    } else if (pr) window.print();
  });
  BP.on('change', function () {
    renderProfileBtn();
    if (state.view === 'home') renderKidbar();
    else if (state.view === 'me') renderMe();
    else if (state.view === 'explore') renderExplore();
  });
  renderProfileBtn();
  if (BP.needsChooser()) showChooser();
}
