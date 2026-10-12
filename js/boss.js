// ===== BOSS 系统 =====

// BOSS名字表（按区域）
const BOSS_NAMES = {
  human:       ['狼王','熊精','勇敢牛牛','浪里马'],
  heaven:      ['托塔天王','哪吒三太子','卷帘大将','天蓬元帅','二郎神'],
  dragon:      ['东海龙王','西海龙王','南海龙王','北海龙王','虾兵蟹将'],
  demon:       ['牛魔王','铁扇公主','玉兔精','六耳猕猴','火焰山魔'],
  divine:      ['太白金星','太上老君','玉皇大帝','王母娘娘','南极仙翁'],
  ice:         ['冰霜魔王','雪山妖怪','极寒冰灵','白虎妖将','北风寒将'],
  buddha_land: ['金蝉长老','阿弥陀佛','护法金刚','金光菩萨','舍利佛陀'],
};

// 小怪名字表（按区域，每片区域刷10只小怪）
const MINI_ENEMY_NAMES = {
  human:       ['小狼','小熊','牛马'],
  heaven:      ['天兵','天将','巡天神','雷神卒','金甲卫','天神','巡察兵','仙鹤卫','云骑兵','天机卒'],
  dragon:      ['虾兵','蟹将','鱼妖','水鬼','河怪','水猴','龙卒','蚌精','海螺精','珊瑚怪'],
  demon:       ['牛怪','猪精','狼妖','熊妖','虎精','妖兵','鬼卒','獠牙怪','小鬼兵','骷髅兵'],
  divine:      ['金甲神','护法金刚','天机卫','圣灵卫','玄武卒','仙卫','神兵','守护神','天机兵','灵官'],
  ice:         ['冰精','雪怪','霜妖','冰甲虫','雪狼','寒冰鬼','霜骑兵','北极熊妖','冰灵','冻怪'],
  buddha_land: ['毒蟒精','金蝉卒','护法童子','禅卫','灵猴精','莲花妖','金轮卒','佛光卫','护法罗汉','法力小鬼'],
};

// 波次小怪名字
const WAVE_ENEMY_NAMES = [
  '小鬼兵','妖卒','山精','野怪','游荡妖','暴走魔','狂暴兽',
  '幽魂','魔兵','骷髅卒','黑煞','恶灵','游魂','厉鬼','幽冥卒',
  '邪魔','身教兽','阴魂','邪灵','末路鬼'
];

// 颜色表
const BOSS_COLORS = {
  human:       { body:'#cc6633', border:'#ff4400', nameEmoji:'👹' },
  heaven:      { body:'#4488ff', border:'#0066dd', nameEmoji:'⚡' },
  dragon:      { body:'#2288aa', border:'#006688', nameEmoji:'🐉' },
  demon:       { body:'#882222', border:'#cc0000', nameEmoji:'💀' },
  divine:      { body:'#ddaa00', border:'#ffcc00', nameEmoji:'✨' },
  ice:         { body:'#88ccee', border:'#4488bb', nameEmoji:'❄️' },
  buddha_land: { body:'#cc8822', border:'#ffaa44', nameEmoji:'☯️' },
};

// 小怪颜色表
const MINI_COLORS = {
  human:       { body:'#aa5522', border:'#dd7733' },
  heaven:      { body:'#3366cc', border:'#5588ff' },
  dragon:      { body:'#1166aa', border:'#33aacc' },
  demon:       { body:'#660011', border:'#aa0022' },
  divine:      { body:'#aa8800', border:'#ddbb22' },
  ice:         { body:'#669aaa', border:'#88ccdd' },
  buddha_land: { body:'#aa6622', border:'#cc9944' },
};

// ============================================================
//   Q版狼 Sprite
//   sx/sy = 中心屏幕坐标，r = 基础半径，isBoss = 是否BOSS（放大+特效）
// ============================================================
function drawWolfSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;   // BOSS放大倍率
  const R = r * s;                  // 实际绘制半径

  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS专属：红色光晕脉冲 ──
  if (isBoss) {
    const pulse = 0.45 + Math.abs(Math.sin(t * 2.2)) * 0.35;
    const glowR = R * 1.55;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(200,30,30,${pulse * 0.6})`);
    grd.addColorStop(1, 'rgba(180,0,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.72, R * 0.82, R * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 尾巴（在身体之前画，遮挡感） ──
  ctx.save();
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = R * 0.28;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(R * 0.45, R * 0.15);
  ctx.quadraticCurveTo(R * 1.1, -R * 0.2, R * 0.9, -R * 0.7);
  ctx.stroke();
  // 尾巴尖（白色蓬毛）
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(R * 0.9, -R * 0.7, R * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 身体（椭圆，深灰蓝狼色） ──
  const bodyGrd = ctx.createRadialGradient(-R * 0.2, -R * 0.2, R * 0.1, 0, 0, R * 0.9);
  bodyGrd.addColorStop(0, isBoss ? '#c0a0b0' : '#a09090');
  bodyGrd.addColorStop(0.6, isBoss ? '#705060' : '#604848');
  bodyGrd.addColorStop(1,   isBoss ? '#4a1a2a' : '#3a1010');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 0.72, R * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#aa3344' : '#5a2222';
  ctx.lineWidth = isBoss ? R * 0.12 : R * 0.08;
  ctx.stroke();

  // ── 腹部浅色区 ──
  ctx.fillStyle = 'rgba(220,200,190,0.45)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.3, R * 0.38, R * 0.45, 0, 0, Math.PI * 2); ctx.fill();

  // ── 前爪（两只，在身体下方） ──
  const pawColor = isBoss ? '#5a2030' : '#402020';
  ctx.fillStyle = pawColor;
  // 左爪
  ctx.beginPath(); ctx.ellipse(-R * 0.38, R * 0.75, R * 0.22, R * 0.16, -0.3, 0, Math.PI * 2); ctx.fill();
  // 右爪
  ctx.beginPath(); ctx.ellipse(R * 0.38, R * 0.75, R * 0.22, R * 0.16, 0.3, 0, Math.PI * 2); ctx.fill();
  // 爪尖（小弧线）
  ctx.strokeStyle = '#111'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
  for (let ci = -1; ci <= 1; ci++) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.38 + ci * R * 0.08, R * 0.78);
    ctx.lineTo(-R * 0.38 + ci * R * 0.08, R * 0.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(R * 0.38 + ci * R * 0.08, R * 0.78);
    ctx.lineTo(R * 0.38 + ci * R * 0.08, R * 0.88);
    ctx.stroke();
  }

  // ── 头部（比身体圆，贴在身体上方） ──
  const headR = R * 0.62;
  const headY = -R * 0.52;
  const headGrd = ctx.createRadialGradient(-headR * 0.2, headY - headR * 0.3, headR * 0.1, 0, headY, headR);
  headGrd.addColorStop(0, isBoss ? '#c8b0b8' : '#b0a0a0');
  headGrd.addColorStop(0.65, isBoss ? '#704050' : '#503030');
  headGrd.addColorStop(1,    isBoss ? '#3a0818' : '#280808');
  ctx.fillStyle = headGrd;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#aa2233' : '#4a1010';
  ctx.lineWidth = isBoss ? headR * 0.13 : headR * 0.09;
  ctx.stroke();

  // ── 耳朵（尖耳，在头顶两侧） ──
  const earColor = isBoss ? '#80304a' : '#602020';
  const earInner = isBoss ? '#e07080' : '#c05060';
  // 左耳
  ctx.fillStyle = earColor;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.55, headY - headR * 0.55);
  ctx.lineTo(-headR * 0.85, headY - headR * 1.15);
  ctx.lineTo(-headR * 0.18, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.52, headY - headR * 0.6);
  ctx.lineTo(-headR * 0.78, headY - headR * 1.0);
  ctx.lineTo(-headR * 0.25, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  // 右耳
  ctx.fillStyle = earColor;
  ctx.beginPath();
  ctx.moveTo(headR * 0.55, headY - headR * 0.55);
  ctx.lineTo(headR * 0.85, headY - headR * 1.15);
  ctx.lineTo(headR * 0.18, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(headR * 0.52, headY - headR * 0.6);
  ctx.lineTo(headR * 0.78, headY - headR * 1.0);
  ctx.lineTo(headR * 0.25, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();

  // ── 口鼻（突出的狼嘴区） ──
  ctx.fillStyle = isBoss ? '#8a5060' : '#705050';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.28, headR * 0.42, headR * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  // 鼻子
  ctx.fillStyle = '#1a0808';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.05, headR * 0.16, headR * 0.11, 0, 0, Math.PI * 2); ctx.fill();
  // 鼻高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.ellipse(-headR * 0.04, headY + headR * 0.03, headR * 0.06, headR * 0.04, -0.5, 0, Math.PI * 2); ctx.fill();

  // ── 嘴（露出獠牙） ──
  ctx.strokeStyle = '#1a0808'; ctx.lineWidth = headR * 0.07; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.25, headY + headR * 0.22);
  ctx.lineTo(0, headY + headR * 0.32);
  ctx.lineTo(headR * 0.25, headY + headR * 0.22);
  ctx.stroke();
  // 獠牙（左右各一颗）
  ctx.fillStyle = '#f0ece0';
  ctx.beginPath(); ctx.moveTo(-headR * 0.2, headY + headR * 0.24);
  ctx.lineTo(-headR * 0.28, headY + headR * 0.48);
  ctx.lineTo(-headR * 0.1, headY + headR * 0.26); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headR * 0.2, headY + headR * 0.24);
  ctx.lineTo(headR * 0.28, headY + headR * 0.48);
  ctx.lineTo(headR * 0.1, headY + headR * 0.26); ctx.fill();

  // ── 眼睛 ──
  const eyeY = headY - headR * 0.1;
  // 眼白
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.2, headR * 0.16, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.2, headR * 0.16, 0.2, 0, Math.PI * 2); ctx.fill();
  // 瞳孔（BOSS瞳孔红色）
  ctx.fillStyle = isBoss ? '#cc0000' : '#1a0000';
  ctx.beginPath(); ctx.arc(-headR * 0.3, eyeY, headR * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.3, eyeY, headR * 0.12, 0, Math.PI * 2); ctx.fill();
  // 高光
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-headR * 0.26, eyeY - headR * 0.05, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.34, eyeY - headR * 0.05, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  // 眉毛（凶狠V形）
  ctx.strokeStyle = isBoss ? '#880020' : '#331010';
  ctx.lineWidth = headR * 0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR * 0.5, eyeY - headR * 0.28); ctx.lineTo(-headR * 0.16, eyeY - headR * 0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR * 0.5, eyeY - headR * 0.28); ctx.lineTo(headR * 0.16, eyeY - headR * 0.18); ctx.stroke();

  // ── BOSS：王冠/皇冠 ──
  if (isBoss) {
    const crownY = headY - headR * 1.05;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.55, crownY + headR * 0.18);
    ctx.lineTo(-headR * 0.55, crownY - headR * 0.1);
    ctx.lineTo(-headR * 0.28, crownY + headR * 0.05);
    ctx.lineTo(0, crownY - headR * 0.22);
    ctx.lineTo(headR * 0.28, crownY + headR * 0.05);
    ctx.lineTo(headR * 0.55, crownY - headR * 0.1);
    ctx.lineTo(headR * 0.55, crownY + headR * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = headR * 0.06; ctx.stroke();
    // 宝石
    ctx.fillStyle = '#ff2244';
    ctx.beginPath(); ctx.arc(0, crownY - headR * 0.15, headR * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff88aa';
    ctx.beginPath(); ctx.arc(-headR * 0.04, crownY - headR * 0.18, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//   Q版熊 Sprite
// ============================================================
function drawBearSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;

  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS专属：金色光晕脉冲 ──
  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t * 1.8)) * 0.4;
    const glowR = R * 1.6;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(160,80,20,${pulse * 0.65})`);
    grd.addColorStop(1, 'rgba(100,40,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.78, R * 0.88, R * 0.23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 身体（大圆，棕熊色） ──
  const bodyGrd = ctx.createRadialGradient(-R * 0.15, -R * 0.1, R * 0.05, 0, 0, R);
  bodyGrd.addColorStop(0, isBoss ? '#d09060' : '#b07840');
  bodyGrd.addColorStop(0.55, isBoss ? '#8a4818' : '#6a3010');
  bodyGrd.addColorStop(1,    isBoss ? '#4a1a00' : '#380e00');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.08, R * 0.82, R * 0.88, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#c06020' : '#7a3808';
  ctx.lineWidth = isBoss ? R * 0.12 : R * 0.08;
  ctx.stroke();

  // ── 腹部浅色椭圆 ──
  ctx.fillStyle = isBoss ? 'rgba(220,170,110,0.55)' : 'rgba(190,150,100,0.5)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.28, R * 0.44, R * 0.52, 0, 0, Math.PI * 2); ctx.fill();

  // ── 后腿/脚掌（两只圆脚，底部） ──
  const pawColor = isBoss ? '#6a2a00' : '#4a1800';
  ctx.fillStyle = pawColor;
  ctx.beginPath(); ctx.ellipse(-R * 0.42, R * 0.82, R * 0.28, R * 0.2, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R * 0.42, R * 0.82, R * 0.28, R * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
  // 爪尖
  ctx.strokeStyle = '#111'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
  for (let ci = -1; ci <= 1; ci++) {
    ctx.beginPath(); ctx.moveTo(-R * 0.42 + ci * R * 0.09, R * 0.88); ctx.lineTo(-R * 0.42 + ci * R * 0.09, R * 0.96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R * 0.42 + ci * R * 0.09, R * 0.88); ctx.lineTo(R * 0.42 + ci * R * 0.09, R * 0.96); ctx.stroke();
  }
  // 前掌（两只，身体两侧偏下）
  ctx.fillStyle = pawColor;
  ctx.beginPath(); ctx.ellipse(-R * 0.88, R * 0.35, R * 0.22, R * 0.3, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R * 0.88, R * 0.35, R * 0.22, R * 0.3, -0.4, 0, Math.PI * 2); ctx.fill();

  // ── 头部（大圆头，Q版比例） ──
  const headR = R * 0.68;
  const headY = -R * 0.55;
  const headGrd = ctx.createRadialGradient(-headR * 0.2, headY - headR * 0.2, headR * 0.08, 0, headY, headR);
  headGrd.addColorStop(0, isBoss ? '#d0a070' : '#b08050');
  headGrd.addColorStop(0.6, isBoss ? '#8a4a18' : '#6a3010');
  headGrd.addColorStop(1,   isBoss ? '#4a1a00' : '#380e00');
  ctx.fillStyle = headGrd;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#c06020' : '#6a2808';
  ctx.lineWidth = isBoss ? headR * 0.12 : headR * 0.08;
  ctx.stroke();

  // ── 熊耳（圆耳，头顶两侧） ──
  const earOuter = isBoss ? '#7a3810' : '#5a2808';
  const earInner = isBoss ? '#e0946a' : '#c07040';
  const earX = headR * 0.62;
  const earY = headY - headR * 0.7;
  // 左耳
  ctx.fillStyle = earOuter;
  ctx.beginPath(); ctx.arc(-earX, earY, headR * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = earInner;
  ctx.beginPath(); ctx.arc(-earX, earY, headR * 0.17, 0, Math.PI * 2); ctx.fill();
  // 右耳
  ctx.fillStyle = earOuter;
  ctx.beginPath(); ctx.arc(earX, earY, headR * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = earInner;
  ctx.beginPath(); ctx.arc(earX, earY, headR * 0.17, 0, Math.PI * 2); ctx.fill();

  // ── 口鼻（熊的大鼻区，半圆形） ──
  ctx.fillStyle = isBoss ? '#7a4a28' : '#604020';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.3, headR * 0.44, headR * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  // 鼻子（宽鼻子）
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.1, headR * 0.2, headR * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(-headR * 0.05, headY + headR * 0.07, headR * 0.08, headR * 0.05, -0.4, 0, Math.PI * 2); ctx.fill();

  // 嘴（"W"形熊嘴）
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = headR * 0.08; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.3, headY + headR * 0.28);
  ctx.quadraticCurveTo(-headR * 0.15, headY + headR * 0.42, 0, headY + headR * 0.32);
  ctx.quadraticCurveTo(headR * 0.15, headY + headR * 0.42, headR * 0.3, headY + headR * 0.28);
  ctx.stroke();

  // ── 眼睛（小圆眼，Q版） ──
  const eyeY = headY - headR * 0.12;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-headR * 0.28, eyeY, headR * 0.18, headR * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.28, eyeY, headR * 0.18, headR * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  // 瞳孔（BOSS深红色）
  ctx.fillStyle = isBoss ? '#990000' : '#1a0800';
  ctx.beginPath(); ctx.arc(-headR * 0.28, eyeY, headR * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.28, eyeY, headR * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-headR * 0.24, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.32, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  // 粗眉毛（微皱眉）
  ctx.strokeStyle = isBoss ? '#7a2800' : '#3a1400';
  ctx.lineWidth = headR * 0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR * 0.48, eyeY - headR * 0.24); ctx.lineTo(-headR * 0.1, eyeY - headR * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR * 0.48, eyeY - headR * 0.24); ctx.lineTo(headR * 0.1, eyeY - headR * 0.2); ctx.stroke();

  // ── BOSS：王冠 ──
  if (isBoss) {
    const crownY = headY - headR * 1.0;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.58, crownY + headR * 0.18);
    ctx.lineTo(-headR * 0.58, crownY - headR * 0.08);
    ctx.lineTo(-headR * 0.3, crownY + headR * 0.06);
    ctx.lineTo(0, crownY - headR * 0.24);
    ctx.lineTo(headR * 0.3, crownY + headR * 0.06);
    ctx.lineTo(headR * 0.58, crownY - headR * 0.08);
    ctx.lineTo(headR * 0.58, crownY + headR * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = headR * 0.07; ctx.stroke();
    ctx.fillStyle = '#44ddff';
    ctx.beginPath(); ctx.arc(0, crownY - headR * 0.17, headR * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aaeeff';
    ctx.beginPath(); ctx.arc(-headR * 0.04, crownY - headR * 0.2, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//   Q版牛马 Sprite（牛马结合体小怪）
//   牛角 + 马鬃 + 马尾 + 牛鼻孔
// ============================================================
function drawOxHorseSprite(ctx, sx, sy, r, isBoss) {
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // ── 影子 ──
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.78, R * 0.85, R * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 马尾（身体后方，先画在身体下面） ──
  ctx.save();
  ctx.strokeStyle = '#7a5030'; ctx.lineWidth = R * 0.22; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(R * 0.5, R * 0.2);
  ctx.quadraticCurveTo(R * 1.2, R * 0.5, R * 1.0, R * 1.1);
  ctx.stroke();
  // 尾部马毛丛
  for (let i = -2; i <= 2; i++) {
    ctx.strokeStyle = i % 2 === 0 ? '#c8a060' : '#8a5820';
    ctx.lineWidth = R * 0.08; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(R * 1.0, R * 1.1);
    ctx.lineTo(R * 1.0 + i * R * 0.12, R * 1.45 + Math.abs(i) * R * 0.08);
    ctx.stroke();
  }
  ctx.restore();

  // ── 身体（椭圆，黄棕双色混合——牛的深棕 + 马的浅黄） ──
  const bodyGrd = ctx.createRadialGradient(-R * 0.1, -R * 0.15, R * 0.05, 0, 0, R * 0.95);
  bodyGrd.addColorStop(0, '#d4a84b');   // 马色高光
  bodyGrd.addColorStop(0.5, '#8a5218'); // 牛棕中间
  bodyGrd.addColorStop(1, '#4a2208');   // 深棕轮廓
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 0.78, R * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5a2a08'; ctx.lineWidth = R * 0.09; ctx.stroke();

  // ── 腹部浅色区 ──
  ctx.fillStyle = 'rgba(230,190,120,0.42)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.32, R * 0.42, R * 0.5, 0, 0, Math.PI * 2); ctx.fill();

  // ── 四条腿（短粗，牛腿风格） ──
  const legColor = '#5a2808';
  const hoofColor = '#1a0800';
  const legPairs = [[-R*0.38, R*0.72], [R*0.38, R*0.72]];
  for (const [lx, ly] of legPairs) {
    ctx.fillStyle = legColor;
    ctx.beginPath(); ctx.ellipse(lx, ly, R * 0.18, R * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hoofColor;
    ctx.beginPath(); ctx.ellipse(lx, ly + R * 0.28, R * 0.18, R * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ── 头部 ──
  const headR = R * 0.64;
  const headY = -R * 0.54;
  const headGrd = ctx.createRadialGradient(-headR*0.2, headY-headR*0.2, headR*0.06, 0, headY, headR);
  headGrd.addColorStop(0, '#d4a84b');
  headGrd.addColorStop(0.6, '#8a5218');
  headGrd.addColorStop(1, '#4a2208');
  ctx.fillStyle = headGrd;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2208'; ctx.lineWidth = headR * 0.09; ctx.stroke();

  // ── 马鬃（头顶一簇，侧倾） ──
  const maneColors = ['#c8a060', '#a07030', '#8a5820', '#d4b070'];
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = maneColors[i % maneColors.length];
    ctx.lineWidth = R * 0.1; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.3 + i * headR * 0.15, headY - headR * 0.85);
    ctx.quadraticCurveTo(
      -headR * 0.5 + i * headR * 0.12, headY - headR * 1.35,
      -headR * 0.7 + i * headR * 0.18, headY - headR * 0.6
    );
    ctx.stroke();
  }

  // ── 牛角（两根弯曲大角） ──
  const hornColor = '#d4c090';
  const hornTip   = '#f0e8c0';
  ctx.strokeStyle = hornColor; ctx.lineWidth = R * 0.16; ctx.lineCap = 'round';
  // 左角
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, headY - headR * 0.68);
  ctx.quadraticCurveTo(-headR * 0.92, headY - headR * 1.45, -headR * 0.55, headY - headR * 1.7);
  ctx.stroke();
  ctx.strokeStyle = hornTip; ctx.lineWidth = R * 0.07;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.78, headY - headR * 1.4);
  ctx.quadraticCurveTo(-headR * 0.92, headY - headR * 1.55, -headR * 0.55, headY - headR * 1.7);
  ctx.stroke();
  // 右角
  ctx.strokeStyle = hornColor; ctx.lineWidth = R * 0.16;
  ctx.beginPath();
  ctx.moveTo(headR * 0.5, headY - headR * 0.68);
  ctx.quadraticCurveTo(headR * 0.92, headY - headR * 1.45, headR * 0.55, headY - headR * 1.7);
  ctx.stroke();
  ctx.strokeStyle = hornTip; ctx.lineWidth = R * 0.07;
  ctx.beginPath();
  ctx.moveTo(headR * 0.78, headY - headR * 1.4);
  ctx.quadraticCurveTo(headR * 0.92, headY - headR * 1.55, headR * 0.55, headY - headR * 1.7);
  ctx.stroke();

  // ── 牛鼻子（宽扁，两个鼻孔） ──
  ctx.fillStyle = '#7a4a20';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.35, headR * 0.46, headR * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.ellipse(-headR * 0.16, headY + headR * 0.32, headR * 0.1, headR * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.16, headY + headR * 0.32, headR * 0.1, headR * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  // 嘴线
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = headR * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR * 0.22, headY + headR * 0.48);
  ctx.quadraticCurveTo(0, headY + headR * 0.58, headR * 0.22, headY + headR * 0.48); ctx.stroke();

  // ── 眼睛 ──
  const eyeY = headY - headR * 0.08;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.19, headR * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.19, headR * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.arc(-headR * 0.3, eyeY, headR * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.3, eyeY, headR * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-headR * 0.26, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.34, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ============================================================
//   Q版勇敢牛牛 Sprite（BOSS牛）
//   壮实牛身 + 大牛角 + 鼻环 + 王冠
// ============================================================
function drawOxSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS光晕（橙棕脉冲） ──
  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t * 1.6)) * 0.4;
    const glowR = R * 1.65;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(180,90,20,${pulse * 0.65})`);
    grd.addColorStop(1, 'rgba(120,50,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.8, R * 0.9, R * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 身体（粗壮，深棕红）──
  const bodyGrd = ctx.createRadialGradient(-R*0.15, -R*0.1, R*0.05, 0, 0, R);
  bodyGrd.addColorStop(0, isBoss ? '#c07840' : '#a06030');
  bodyGrd.addColorStop(0.55, isBoss ? '#7a3010' : '#5a2008');
  bodyGrd.addColorStop(1, isBoss ? '#3a0c00' : '#2a0800');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 0.88, R * 0.92, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#c05010' : '#6a2408'; ctx.lineWidth = R * 0.1; ctx.stroke();

  // ── 腹部白色区 ──
  ctx.fillStyle = 'rgba(230,200,160,0.5)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.3, R * 0.48, R * 0.56, 0, 0, Math.PI * 2); ctx.fill();

  // ── 四腿（粗短，牛腿） ──
  const legC = isBoss ? '#5a2008' : '#4a1808';
  const hoofC = '#1a0800';
  for (const [lx] of [[-R*0.4], [R*0.4]]) {
    ctx.fillStyle = legC;
    ctx.beginPath(); ctx.ellipse(lx, R * 0.74, R * 0.2, R * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hoofC;
    ctx.beginPath(); ctx.ellipse(lx, R * 1.0, R * 0.2, R * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ── 头部（大圆头，正面感强）──
  const headR = R * 0.7;
  const headY = -R * 0.58;
  const headGrd = ctx.createRadialGradient(-headR*0.2, headY-headR*0.2, headR*0.06, 0, headY, headR);
  headGrd.addColorStop(0, isBoss ? '#c07840' : '#a06030');
  headGrd.addColorStop(0.6, isBoss ? '#7a3010' : '#5a2008');
  headGrd.addColorStop(1, isBoss ? '#3a0c00' : '#2a0800');
  ctx.fillStyle = headGrd;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#b04010' : '#5a2008'; ctx.lineWidth = headR * 0.1; ctx.stroke();

  // ── 牛角（宽大弯角，BOSS更粗更弯）──
  const hornW = isBoss ? R * 0.22 : R * 0.16;
  const hornColor = '#d8c890';
  const hornTip   = '#f5f0d8';
  ctx.lineCap = 'round';
  // 左角
  ctx.strokeStyle = hornColor; ctx.lineWidth = hornW;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.52, headY - headR * 0.72);
  ctx.quadraticCurveTo(-headR * 1.05, headY - headR * 1.6, -headR * 0.5, headY - headR * 1.95);
  ctx.stroke();
  ctx.strokeStyle = hornTip; ctx.lineWidth = hornW * 0.38;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.9, headY - headR * 1.5);
  ctx.quadraticCurveTo(-headR * 1.0, headY - headR * 1.72, -headR * 0.5, headY - headR * 1.95);
  ctx.stroke();
  // 右角
  ctx.strokeStyle = hornColor; ctx.lineWidth = hornW;
  ctx.beginPath();
  ctx.moveTo(headR * 0.52, headY - headR * 0.72);
  ctx.quadraticCurveTo(headR * 1.05, headY - headR * 1.6, headR * 0.5, headY - headR * 1.95);
  ctx.stroke();
  ctx.strokeStyle = hornTip; ctx.lineWidth = hornW * 0.38;
  ctx.beginPath();
  ctx.moveTo(headR * 0.9, headY - headR * 1.5);
  ctx.quadraticCurveTo(headR * 1.0, headY - headR * 1.72, headR * 0.5, headY - headR * 1.95);
  ctx.stroke();

  // ── 牛鼻子（宽大，带鼻环）──
  ctx.fillStyle = isBoss ? '#8a4a20' : '#7a3a18';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.38, headR * 0.5, headR * 0.34, 0, 0, Math.PI * 2); ctx.fill();
  // 两个鼻孔
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.ellipse(-headR * 0.18, headY + headR * 0.35, headR * 0.12, headR * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.18, headY + headR * 0.35, headR * 0.12, headR * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  // 鼻环（金色圆环）
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = headR * 0.1;
  ctx.beginPath(); ctx.arc(0, headY + headR * 0.52, headR * 0.2, 0, Math.PI * 2); ctx.stroke();
  // 嘴
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = headR * 0.08; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.25, headY + headR * 0.55);
  ctx.quadraticCurveTo(0, headY + headR * 0.68, headR * 0.25, headY + headR * 0.55);
  ctx.stroke();

  // ── 眼睛 ──
  const eyeY = headY - headR * 0.1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.2, headR * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.2, headR * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isBoss ? '#880000' : '#1a0800';
  ctx.beginPath(); ctx.arc(-headR * 0.3, eyeY, headR * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.3, eyeY, headR * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-headR * 0.26, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.34, eyeY - headR * 0.04, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  // 粗眉（凶狠）
  ctx.strokeStyle = isBoss ? '#7a2000' : '#3a1000';
  ctx.lineWidth = headR * 0.11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR * 0.52, eyeY - headR * 0.28); ctx.lineTo(-headR * 0.1, eyeY - headR * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR * 0.52, eyeY - headR * 0.28); ctx.lineTo(headR * 0.1, eyeY - headR * 0.2); ctx.stroke();

  // ── BOSS王冠 ──
  if (isBoss) {
    const crownY = headY - headR * 1.88;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.6, crownY + headR * 0.2);
    ctx.lineTo(-headR * 0.6, crownY - headR * 0.1);
    ctx.lineTo(-headR * 0.3, crownY + headR * 0.08);
    ctx.lineTo(0, crownY - headR * 0.26);
    ctx.lineTo(headR * 0.3, crownY + headR * 0.08);
    ctx.lineTo(headR * 0.6, crownY - headR * 0.1);
    ctx.lineTo(headR * 0.6, crownY + headR * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = headR * 0.07; ctx.stroke();
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(0, crownY - headR * 0.18, headR * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9966';
    ctx.beginPath(); ctx.arc(-headR * 0.04, crownY - headR * 0.22, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//   Q版浪里马 Sprite（BOSS马）
//   高挑马身 + 马鬃 + 马尾 + 马蹄 + 王冠
// ============================================================
function drawHorseSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS光晕（蓝紫波浪感） ──
  if (isBoss) {
    const pulse = 0.42 + Math.abs(Math.sin(t * 2.0)) * 0.38;
    const glowR = R * 1.6;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(60,120,220,${pulse * 0.6})`);
    grd.addColorStop(1, 'rgba(20,60,160,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.82, R * 0.88, R * 0.23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 马尾（流线型，先画在身体后面）──
  ctx.save();
  const tailColors = isBoss
    ? ['#4488ff', '#88bbff', '#2255cc', '#aaccff']
    : ['#8a6030', '#c4a060', '#6a4018', '#d4b070'];
  for (let i = -2; i <= 2; i++) {
    ctx.strokeStyle = tailColors[Math.abs(i) % tailColors.length];
    ctx.lineWidth = R * 0.1; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(R * 0.52, R * 0.05);
    ctx.quadraticCurveTo(R * 1.25, R * 0.55 + i * R * 0.05, R * 1.05 + i * R * 0.1, R * 1.2);
    ctx.stroke();
  }
  ctx.restore();

  // ── 身体（稍高挑，马的体型）──
  const bodyColor = isBoss ? '#5888d8' : '#a08850';
  const bodyGrd = ctx.createRadialGradient(-R*0.12, -R*0.15, R*0.05, 0, 0, R*0.95);
  bodyGrd.addColorStop(0, isBoss ? '#88aae8' : '#c4a870');
  bodyGrd.addColorStop(0.55, isBoss ? '#3860b8' : '#7a5828');
  bodyGrd.addColorStop(1,    isBoss ? '#1a3080' : '#3a2008');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.06, R * 0.74, R * 0.88, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#2244aa' : '#5a3808'; ctx.lineWidth = R * 0.09; ctx.stroke();

  // ── 腹部浅色 ──
  ctx.fillStyle = isBoss ? 'rgba(160,190,255,0.38)' : 'rgba(220,190,130,0.42)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.28, R * 0.4, R * 0.5, 0, 0, Math.PI * 2); ctx.fill();

  // ── 四腿（修长，马腿，有马蹄）──
  const legColor2 = isBoss ? '#2244aa' : '#5a3808';
  const hoofColor2 = '#111118';
  for (const [lx] of [[-R*0.35], [R*0.35]]) {
    // 腿
    ctx.fillStyle = legColor2;
    ctx.beginPath(); ctx.ellipse(lx, R * 0.76, R * 0.16, R * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    // 蹄（半圆弧，马蹄造型）
    ctx.fillStyle = hoofColor2;
    ctx.beginPath();
    ctx.ellipse(lx, R * 1.04, R * 0.18, R * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    // 蹄高光
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(lx - R*0.05, R * 1.02, R * 0.07, R * 0.04, -0.3, 0, Math.PI * 2); ctx.fill();
  }

  // ── 颈部（连接身体和头，稍高）──
  ctx.fillStyle = isBoss ? '#3860b8' : '#7a5828';
  ctx.beginPath();
  ctx.moveTo(-R * 0.22, -R * 0.72);
  ctx.bezierCurveTo(-R * 0.28, -R * 1.1, R * 0.22, -R * 1.1, R * 0.22, -R * 0.72);
  ctx.bezierCurveTo(R * 0.14, -R * 0.5, -R * 0.14, -R * 0.5, -R * 0.22, -R * 0.72);
  ctx.fill();

  // ── 头部（椭圆横置，马脸细长）──
  const headR = R * 0.5;
  const headY = -R * 1.12;
  const headGrd = ctx.createRadialGradient(-headR*0.15, headY-headR*0.15, headR*0.05, 0, headY, headR*1.4);
  headGrd.addColorStop(0, isBoss ? '#88aae8' : '#c4a870');
  headGrd.addColorStop(0.6, isBoss ? '#3860b8' : '#7a5828');
  headGrd.addColorStop(1,   isBoss ? '#1a3080' : '#3a2008');
  ctx.fillStyle = headGrd;
  // 马脸用横置椭圆（宽 > 高）
  ctx.beginPath(); ctx.ellipse(0, headY, headR * 1.45, headR * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#2244aa' : '#5a3808'; ctx.lineWidth = headR * 0.1; ctx.stroke();

  // ── 马耳（尖耳，头顶）──
  const earC = isBoss ? '#2244aa' : '#5a3808';
  const earIn = isBoss ? '#6699dd' : '#c4a870';
  // 左耳
  ctx.fillStyle = earC;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.55, headY - headR * 0.58);
  ctx.lineTo(-headR * 0.72, headY - headR * 1.18);
  ctx.lineTo(-headR * 0.22, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = earIn;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.52, headY - headR * 0.62);
  ctx.lineTo(-headR * 0.65, headY - headR * 1.05);
  ctx.lineTo(-headR * 0.28, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  // 右耳
  ctx.fillStyle = earC;
  ctx.beginPath();
  ctx.moveTo(headR * 0.55, headY - headR * 0.58);
  ctx.lineTo(headR * 0.72, headY - headR * 1.18);
  ctx.lineTo(headR * 0.22, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = earIn;
  ctx.beginPath();
  ctx.moveTo(headR * 0.52, headY - headR * 0.62);
  ctx.lineTo(headR * 0.65, headY - headR * 1.05);
  ctx.lineTo(headR * 0.28, headY - headR * 0.72);
  ctx.closePath(); ctx.fill();

  // ── 马鬃（头顶到颈部，多彩流苏）──
  const maneC = isBoss
    ? ['#4488ff', '#88bbff', '#2255cc', '#aaccff', '#66aaff']
    : ['#c4a060', '#8a5820', '#a07030', '#d4b070', '#7a4818'];
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = maneC[i % maneC.length];
    ctx.lineWidth = R * 0.11; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.2 + i * headR * 0.1, headY - headR * 0.65);
    ctx.quadraticCurveTo(
      -headR * 0.55 + i * headR * 0.12, headY - headR * 1.4,
      -headR * 0.7 + i * headR * 0.2, headY - headR * 0.55
    );
    ctx.stroke();
  }

  // ── 鼻子（马的长鼻端）──
  ctx.fillStyle = isBoss ? '#4466cc' : '#8a6030';
  ctx.beginPath(); ctx.ellipse(headR * 1.05, headY, headR * 0.38, headR * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(headR * 1.12, headY - headR * 0.08, headR * 0.1, headR * 0.07, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 1.12, headY + headR * 0.12, headR * 0.1, headR * 0.07, -0.3, 0, Math.PI * 2); ctx.fill();
  // 嘴
  ctx.strokeStyle = '#111'; ctx.lineWidth = headR * 0.07; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(headR * 0.88, headY + headR * 0.22);
  ctx.quadraticCurveTo(headR * 1.05, headY + headR * 0.35, headR * 1.22, headY + headR * 0.2);
  ctx.stroke();

  // ── 眼睛（马眼，侧面感）──
  const eyeX = -headR * 0.3;
  const eyeY2 = headY - headR * 0.12;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(eyeX, eyeY2, headR * 0.22, headR * 0.17, 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = isBoss ? '#0022aa' : '#1a0e00';
  ctx.beginPath(); ctx.arc(eyeX + headR * 0.04, eyeY2, headR * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(eyeX + headR * 0.06, eyeY2 - headR * 0.05, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = headR * 0.06;
  ctx.beginPath(); ctx.ellipse(eyeX, eyeY2, headR * 0.22, headR * 0.17, 0.15, 0, Math.PI * 2); ctx.stroke();

  // ── BOSS王冠 ──
  if (isBoss) {
    const crownY = headY - headR * 1.1;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.55, crownY + headR * 0.18);
    ctx.lineTo(-headR * 0.55, crownY - headR * 0.08);
    ctx.lineTo(-headR * 0.28, crownY + headR * 0.06);
    ctx.lineTo(0, crownY - headR * 0.25);
    ctx.lineTo(headR * 0.28, crownY + headR * 0.06);
    ctx.lineTo(headR * 0.55, crownY - headR * 0.08);
    ctx.lineTo(headR * 0.55, crownY + headR * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = headR * 0.07; ctx.stroke();
    ctx.fillStyle = '#44ddff';
    ctx.beginPath(); ctx.arc(0, crownY - headR * 0.18, headR * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aaeeff';
    ctx.beginPath(); ctx.arc(-headR * 0.04, crownY - headR * 0.22, headR * 0.05, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//   Q版龙王 Sprite（东海/西海/南海/北海龙王 BOSS）
//   龙头 + 龙角 + 龙须 + 龙袍 + 龙爪 + 王冠
// ============================================================
function drawDragonKingSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS专属：蓝绿海洋光晕脉冲 ──
  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t * 1.9)) * 0.4;
    const glowR = R * 1.65;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(20,180,220,${pulse * 0.6})`);
    grd.addColorStop(0.5, `rgba(0,100,180,${pulse * 0.3})`);
    grd.addColorStop(1, 'rgba(0,60,120,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.8, R * 0.88, R * 0.23, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 龙袍身体（宝蓝色，圆润Q版）──
  const bodyGrd = ctx.createRadialGradient(-R*0.18, -R*0.12, R*0.08, 0, 0, R);
  bodyGrd.addColorStop(0, isBoss ? '#88ddff' : '#66bbdd');
  bodyGrd.addColorStop(0.5, isBoss ? '#1188cc' : '#0066aa');
  bodyGrd.addColorStop(1, isBoss ? '#003888' : '#002266');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 0.82, R * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#00aaee' : '#0055aa';
  ctx.lineWidth = isBoss ? R * 0.12 : R * 0.08; ctx.stroke();

  // ── 龙袍纹路（金色横纹）──
  ctx.strokeStyle = isBoss ? 'rgba(255,215,0,0.6)' : 'rgba(200,170,0,0.4)';
  ctx.lineWidth = R * 0.06; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, R * 0.1 + i * R * 0.28);
    ctx.quadraticCurveTo(0, R * 0.05 + i * R * 0.28 + R * 0.06, R * 0.55, R * 0.1 + i * R * 0.28);
    ctx.stroke();
  }

  // ── 腹部珍珠白 ──
  ctx.fillStyle = 'rgba(220,240,255,0.45)';
  ctx.beginPath(); ctx.ellipse(0, R * 0.3, R * 0.42, R * 0.52, 0, 0, Math.PI * 2); ctx.fill();

  // ── 龙爪（左右各一，宽指）──
  const clawColor = isBoss ? '#005599' : '#004488';
  ctx.fillStyle = clawColor;
  ctx.beginPath(); ctx.ellipse(-R * 0.92, R * 0.22, R * 0.26, R * 0.2, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R * 0.92, R * 0.22, R * 0.26, R * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
  // 爪尖（3根）
  ctx.strokeStyle = '#aaddff'; ctx.lineWidth = R * 0.055; ctx.lineCap = 'round';
  for (let ci = -1; ci <= 1; ci++) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.92 + ci * R * 0.09, R * 0.26);
    ctx.lineTo(-R * 0.92 + ci * R * 0.12, R * 0.42); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(R * 0.92 + ci * R * 0.09, R * 0.26);
    ctx.lineTo(R * 0.92 + ci * R * 0.12, R * 0.42); ctx.stroke();
  }

  // ── 腿/脚（两只，藏在袍下）──
  ctx.fillStyle = clawColor;
  ctx.beginPath(); ctx.ellipse(-R * 0.38, R * 0.84, R * 0.24, R * 0.18, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R * 0.38, R * 0.84, R * 0.24, R * 0.18, 0.2, 0, Math.PI * 2); ctx.fill();

  // ── 头部（大圆头，威严）──
  const headR = R * 0.68;
  const headY = -R * 0.58;
  const headGrd = ctx.createRadialGradient(-headR*0.2, headY-headR*0.2, headR*0.08, 0, headY, headR);
  headGrd.addColorStop(0, isBoss ? '#88ddff' : '#66bbdd');
  headGrd.addColorStop(0.55, isBoss ? '#0077bb' : '#005599');
  headGrd.addColorStop(1, isBoss ? '#002266' : '#001144');
  ctx.fillStyle = headGrd;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isBoss ? '#00ccff' : '#0066aa';
  ctx.lineWidth = isBoss ? headR * 0.13 : headR * 0.09; ctx.stroke();

  // ── 龙角（两根弯曲鹿角形，特征鲜明）──
  const hornC = '#d4c870';
  ctx.lineCap = 'round';
  // 左角：向左上弯
  ctx.strokeStyle = hornC; ctx.lineWidth = R * 0.14;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.38, headY - headR * 0.68);
  ctx.quadraticCurveTo(-headR * 0.85, headY - headR * 1.4, -headR * 0.5, headY - headR * 1.85);
  ctx.stroke();
  // 左角分叉
  ctx.lineWidth = R * 0.08;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.72, headY - headR * 1.28);
  ctx.quadraticCurveTo(-headR * 1.1, headY - headR * 1.4, -headR * 1.05, headY - headR * 1.15);
  ctx.stroke();
  // 右角
  ctx.lineWidth = R * 0.14;
  ctx.beginPath();
  ctx.moveTo(headR * 0.38, headY - headR * 0.68);
  ctx.quadraticCurveTo(headR * 0.85, headY - headR * 1.4, headR * 0.5, headY - headR * 1.85);
  ctx.stroke();
  ctx.lineWidth = R * 0.08;
  ctx.beginPath();
  ctx.moveTo(headR * 0.72, headY - headR * 1.28);
  ctx.quadraticCurveTo(headR * 1.1, headY - headR * 1.4, headR * 1.05, headY - headR * 1.15);
  ctx.stroke();

  // ── 龙须（嘴角两侧，细长弯曲）──
  ctx.strokeStyle = isBoss ? '#88eeff' : '#66ccdd';
  ctx.lineWidth = R * 0.055;
  // 左须
  ctx.beginPath();
  ctx.moveTo(-headR * 0.42, headY + headR * 0.35);
  ctx.quadraticCurveTo(-headR * 0.9, headY + headR * 0.2, -headR * 1.0, headY - headR * 0.1);
  ctx.stroke();
  // 右须
  ctx.beginPath();
  ctx.moveTo(headR * 0.42, headY + headR * 0.35);
  ctx.quadraticCurveTo(headR * 0.9, headY + headR * 0.2, headR * 1.0, headY - headR * 0.1);
  ctx.stroke();

  // ── 鼻子（宽鼻，扁平）──
  ctx.fillStyle = isBoss ? '#005599' : '#004488';
  ctx.beginPath(); ctx.ellipse(0, headY + headR * 0.32, headR * 0.4, headR * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#002255';
  ctx.beginPath(); ctx.ellipse(-headR * 0.14, headY + headR * 0.28, headR * 0.1, headR * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.14, headY + headR * 0.28, headR * 0.1, headR * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  // 嘴
  ctx.strokeStyle = '#001133'; ctx.lineWidth = headR * 0.07; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.3, headY + headR * 0.5);
  ctx.quadraticCurveTo(0, headY + headR * 0.62, headR * 0.3, headY + headR * 0.5); ctx.stroke();

  // ── 眼睛（龙眼，竖瞳）──
  const eyeY = headY - headR * 0.1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.2, headR * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.2, headR * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  // 竖瞳
  ctx.fillStyle = isBoss ? '#ffaa00' : '#cc8800';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.08, headR * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.08, headR * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(-headR * 0.3, eyeY, headR * 0.04, headR * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR * 0.3, eyeY, headR * 0.04, headR * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(-headR * 0.26, eyeY - headR * 0.07, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR * 0.34, eyeY - headR * 0.07, headR * 0.04, 0, Math.PI * 2); ctx.fill();
  // 眉毛（威严斜眉）
  ctx.strokeStyle = isBoss ? '#003399' : '#002266';
  ctx.lineWidth = headR * 0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR * 0.52, eyeY - headR * 0.28); ctx.lineTo(-headR * 0.1, eyeY - headR * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR * 0.52, eyeY - headR * 0.28); ctx.lineTo(headR * 0.1, eyeY - headR * 0.2); ctx.stroke();

  // ── BOSS：龙王冠（双层，珠宝更多）──
  if (isBoss) {
    const crownY = headY - headR * 1.78;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.6, crownY + headR * 0.2);
    ctx.lineTo(-headR * 0.6, crownY - headR * 0.08);
    ctx.lineTo(-headR * 0.32, crownY + headR * 0.08);
    ctx.lineTo(0, crownY - headR * 0.3);
    ctx.lineTo(headR * 0.32, crownY + headR * 0.08);
    ctx.lineTo(headR * 0.6, crownY - headR * 0.08);
    ctx.lineTo(headR * 0.6, crownY + headR * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = headR * 0.07; ctx.stroke();
    // 宝石
    ctx.fillStyle = '#00ddff';
    ctx.beginPath(); ctx.arc(0, crownY - headR * 0.22, headR * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#88eeff';
    ctx.beginPath(); ctx.arc(-headR * 0.04, crownY - headR * 0.26, headR * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(-headR * 0.38, crownY - headR * 0.02, headR * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(headR * 0.38, crownY - headR * 0.02, headR * 0.07, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//   Q版龟丞相 Sprite（龙宫BOSS：虾兵蟹将）
//   龟壳身体 + 人形上半身 + 龟头 + 朝服冠帽 + 笏板
// ============================================================
function drawTurtlePrimeMinisterSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // ── BOSS专属：绿色涟漪光晕 ──
  if (isBoss) {
    const pulse = 0.35 + Math.abs(Math.sin(t * 1.6)) * 0.4;
    const glowR = R * 1.6;
    const grd = ctx.createRadialGradient(0, 0, R * 0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(60,180,80,${pulse * 0.55})`);
    grd.addColorStop(0.5, `rgba(20,100,40,${pulse * 0.25})`);
    grd.addColorStop(1, 'rgba(0,60,20,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
  }

  // ── 影子 ──
  ctx.save();
  ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.82, R*0.9, R*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 龟壳（下半身，六边形花纹）──
  const shellGrd = ctx.createRadialGradient(-R*0.1, R*0.1, R*0.05, 0, R*0.25, R*0.72);
  shellGrd.addColorStop(0, '#88cc44');
  shellGrd.addColorStop(0.5, '#447722');
  shellGrd.addColorStop(1, '#223311');
  ctx.fillStyle = shellGrd;
  ctx.beginPath();
  ctx.moveTo(-R*0.62, -R*0.05); ctx.lineTo(-R*0.72, R*0.35);
  ctx.lineTo(-R*0.42, R*0.75);  ctx.lineTo(R*0.42, R*0.75);
  ctx.lineTo(R*0.72, R*0.35);   ctx.lineTo(R*0.62, -R*0.05);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#335511'; ctx.lineWidth = R*0.08; ctx.stroke();
  // 龟壳六边形纹路
  ctx.strokeStyle = 'rgba(160,220,80,0.5)'; ctx.lineWidth = R*0.04;
  const hexPts = [[0, R*0.28], [-R*0.3, R*0.1], [R*0.3, R*0.1], [-R*0.3, R*0.5], [R*0.3, R*0.5]];
  hexPts.forEach(([hx, hy]) => {
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const angle = a * Math.PI / 3;
      const px = hx + Math.cos(angle) * R * 0.18;
      const py = hy + Math.sin(angle) * R * 0.18;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
  });

  // ── 四肢（龟脚，从壳边伸出）──
  ctx.fillStyle = '#5a9932';
  // 左前脚
  ctx.beginPath(); ctx.ellipse(-R*0.75, R*0.08, R*0.18, R*0.12, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#336611'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 右前脚
  ctx.beginPath(); ctx.ellipse(R*0.75, R*0.08, R*0.18, R*0.12, 0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 左后脚
  ctx.beginPath(); ctx.ellipse(-R*0.68, R*0.6, R*0.16, R*0.11, 0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 右后脚
  ctx.beginPath(); ctx.ellipse(R*0.68, R*0.6, R*0.16, R*0.11, -0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 爪子纹
  ctx.strokeStyle = '#224400'; ctx.lineWidth = R*0.03;
  [[-R*0.75, R*0.08], [R*0.75, R*0.08], [-R*0.68, R*0.6], [R*0.68, R*0.6]].forEach(([fx, fy]) => {
    for (let d = -1; d <= 1; d++) {
      ctx.beginPath(); ctx.moveTo(fx + d*R*0.06, fy - R*0.05); ctx.lineTo(fx + d*R*0.07, fy - R*0.14); ctx.stroke();
    }
  });

  // ── 人形上半身（绿色朝服）──
  ctx.fillStyle = '#2d6e3a';
  ctx.beginPath();
  ctx.moveTo(-R*0.42, -R*0.05);
  ctx.lineTo(-R*0.38, -R*0.55);
  ctx.lineTo(R*0.38, -R*0.55);
  ctx.lineTo(R*0.42, -R*0.05);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a4020'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 朝服金色纹领
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = R*0.06;
  ctx.beginPath(); ctx.moveTo(-R*0.1, -R*0.55); ctx.lineTo(0, -R*0.38); ctx.lineTo(R*0.1, -R*0.55); ctx.stroke();
  // 腰玉带
  ctx.fillStyle = '#f0c040';
  ctx.beginPath(); ctx.rect(-R*0.38, -R*0.12, R*0.76, R*0.1); ctx.fill();
  ctx.strokeStyle = '#b08800'; ctx.lineWidth = R*0.04; ctx.stroke();

  // ── 笏板（左手持，白玉色）──
  ctx.save();
  ctx.translate(-R*0.52, -R*0.38);
  ctx.rotate(-0.3);
  ctx.fillStyle = '#e8e0c8';
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(-R*0.06, -R*0.32, R*0.12, R*0.38, R*0.03); }
  else { ctx.rect(-R*0.06, -R*0.32, R*0.12, R*0.38); }
  ctx.fill();
  ctx.strokeStyle = '#a09070'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.restore();

  // ── 龟头（Q版大头，伸出朝服领口）──
  const headR2 = R * 0.38;
  const headY  = -R * 0.55 - headR2 * 0.6;
  ctx.fillStyle = '#5a9932';
  ctx.beginPath(); ctx.arc(0, headY, headR2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#336611'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 龟头纹路（绿色鳞片感）
  ctx.strokeStyle = 'rgba(120,200,60,0.45)'; ctx.lineWidth = R*0.03;
  ctx.beginPath(); ctx.arc(0, headY, headR2*0.55, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-headR2*0.3, headY-headR2*0.1, headR2*0.3, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(headR2*0.3, headY-headR2*0.1, headR2*0.3, 0, Math.PI*2); ctx.stroke();

  // ── 官帽（黑色乌纱帽）──
  const hatY2 = headY - headR2 * 0.55;
  // 帽翅（两侧扁翼）
  ctx.fillStyle = '#111111';
  ctx.beginPath(); ctx.ellipse(-headR2*1.15, hatY2+headR2*0.12, headR2*0.45, headR2*0.16, 0.15, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR2*1.15, hatY2+headR2*0.12, headR2*0.45, headR2*0.16, -0.15, 0, Math.PI*2); ctx.fill();
  // 帽身
  ctx.beginPath();
  ctx.moveTo(-headR2*0.85, hatY2+headR2*0.2);
  ctx.lineTo(-headR2*0.62, hatY2-headR2*0.55);
  ctx.arc(0, hatY2-headR2*0.55, headR2*0.62, Math.PI, 0, false);
  ctx.lineTo(headR2*0.85, hatY2+headR2*0.2);
  ctx.closePath();
  ctx.fillStyle = '#111111'; ctx.fill();
  ctx.strokeStyle = '#333333'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 帽底金边
  ctx.beginPath();
  ctx.ellipse(0, hatY2+headR2*0.2, headR2*0.88, headR2*0.2, 0, 0, Math.PI*2);
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = R*0.05; ctx.stroke();

  // ── 龟眼（圆眼+金色虹膜，凶相）──
  const eyeY = headY - headR2 * 0.08;
  // 眼白
  ctx.fillStyle = '#ffffee';
  ctx.beginPath(); ctx.ellipse(-headR2*0.38, eyeY, headR2*0.22, headR2*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR2*0.38, eyeY, headR2*0.22, headR2*0.18, 0, 0, Math.PI*2); ctx.fill();
  // 金色虹膜
  ctx.fillStyle = '#ddaa00';
  ctx.beginPath(); ctx.ellipse(-headR2*0.38, eyeY, headR2*0.14, headR2*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR2*0.38, eyeY, headR2*0.14, headR2*0.14, 0, 0, Math.PI*2); ctx.fill();
  // 瞳孔（竖瞳，爬行类特征）
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-headR2*0.38, eyeY, headR2*0.05, headR2*0.13, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR2*0.38, eyeY, headR2*0.05, headR2*0.13, 0, 0, Math.PI*2); ctx.fill();
  // 高光
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR2*0.34, eyeY-headR2*0.06, headR2*0.05, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR2*0.42, eyeY-headR2*0.06, headR2*0.05, 0, Math.PI*2); ctx.fill();

  // ── 嘴（扁平龟嘴，严肃）──
  ctx.beginPath();
  ctx.moveTo(-headR2*0.3, headY+headR2*0.32);
  ctx.lineTo(headR2*0.3, headY+headR2*0.32);
  ctx.strokeStyle = '#224400'; ctx.lineWidth = R*0.06; ctx.lineCap = 'round'; ctx.stroke();
  // 嘴角下压（威严感）
  ctx.beginPath(); ctx.moveTo(-headR2*0.3, headY+headR2*0.32); ctx.lineTo(-headR2*0.38, headY+headR2*0.44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR2*0.3, headY+headR2*0.32); ctx.lineTo(headR2*0.38, headY+headR2*0.44); ctx.stroke();

  // ── BOSS额外：金色官印 ──
  if (isBoss) {
    ctx.fillStyle = '#f0c040';
    ctx.beginPath(); ctx.arc(0, headY-headR2*0.5, headR2*0.18, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#b08000'; ctx.lineWidth = R*0.04; ctx.stroke();
    ctx.fillStyle = '#cc0000';
    ctx.font = `bold ${R*0.18}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('丞', 0, headY-headR2*0.5);
  }

  ctx.restore();
}

// ============================================================
//   Q版虾兵 Sprite（龙宫小怪）
//   虾身 + 两根大触须 + 钳子 + 复眼
// ============================================================
function drawShrimpSoldierSprite(ctx, sx, sy, r) {
  const R = r;
  ctx.save();
  ctx.translate(sx, sy);

  // 影子
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R * 0.8, R * 0.72, R * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── 虾身（分节椭圆，橙红色）──
  const bodyGrd = ctx.createRadialGradient(-R*0.1, -R*0.05, R*0.05, 0, 0, R*0.85);
  bodyGrd.addColorStop(0, '#ff9966'); bodyGrd.addColorStop(0.6, '#dd4422'); bodyGrd.addColorStop(1, '#881100');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(0, R * 0.1, R * 0.65, R * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aa2200'; ctx.lineWidth = R * 0.07; ctx.stroke();

  // 身体分节纹（横线）
  ctx.strokeStyle = 'rgba(200,80,20,0.5)'; ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
  for (let i = -1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, R * 0.12 + i * R * 0.2);
    ctx.quadraticCurveTo(0, R * 0.06 + i * R * 0.2, R * 0.5, R * 0.12 + i * R * 0.2);
    ctx.stroke();
  }

  // ── 虾尾（扇形，底部）──
  ctx.fillStyle = '#cc3311';
  const tailPts = [[-R*0.48, R*0.9], [-R*0.22, R*1.15], [0, R*1.2], [R*0.22, R*1.15], [R*0.48, R*0.9]];
  for (const [tx2, ty2] of tailPts) {
    ctx.beginPath();
    ctx.ellipse(tx2, ty2, R*0.14, R*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.04; ctx.stroke();
  }

  // ── 两根触须（长须，从头顶伸出）──
  ctx.strokeStyle = '#ff8855'; ctx.lineWidth = R * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-R*0.22, -R*0.55); ctx.quadraticCurveTo(-R*0.8, -R*1.1, -R*0.5, -R*1.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R*0.22, -R*0.55); ctx.quadraticCurveTo(R*0.8, -R*1.1, R*0.5, -R*1.6); ctx.stroke();

  // ── 头部（半球形，大复眼）──
  const headR = R * 0.55;
  const headY = -R * 0.52;
  ctx.fillStyle = '#ee5533';
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aa2200'; ctx.lineWidth = R * 0.07; ctx.stroke();

  // ── 复眼（大球形眼，虾的特征）──
  ctx.fillStyle = '#220000';
  ctx.beginPath(); ctx.ellipse(-headR*0.42, headY-headR*0.1, headR*0.32, headR*0.28, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR*0.42, headY-headR*0.1, headR*0.32, headR*0.28, 0.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.ellipse(-headR*0.42, headY-headR*0.1, headR*0.22, headR*0.2, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR*0.42, headY-headR*0.1, headR*0.22, headR*0.2, 0.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(-headR*0.46, headY-headR*0.18, headR*0.07, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR*0.38, headY-headR*0.18, headR*0.07, 0, Math.PI*2); ctx.fill();

  // ── 钳子（左右各一，向下展开）──
  const pincerColor = '#dd3311';
  ctx.fillStyle = pincerColor;
  // 左钳臂
  ctx.beginPath(); ctx.ellipse(-R*0.82, R*0.12, R*0.2, R*0.12, 0.8, 0, Math.PI*2); ctx.fill();
  // 左钳口（两片）
  ctx.beginPath(); ctx.ellipse(-R*1.05, R*0.05, R*0.2, R*0.1, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-R*1.05, R*0.2, R*0.2, R*0.1, -0.3, 0, Math.PI*2); ctx.fill();
  // 右钳臂
  ctx.beginPath(); ctx.ellipse(R*0.82, R*0.12, R*0.2, R*0.12, -0.8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*1.05, R*0.05, R*0.2, R*0.1, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*1.05, R*0.2, R*0.2, R*0.1, 0.3, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ============================================================
//   Q版蟹将 Sprite（龙宫小怪）
//   扁宽蟹壳 + 两只大蟹钳 + 8条腿 + 蟹眼杆
// ============================================================
function drawCrabGeneralSprite(ctx, sx, sy, r) {
  const R = r;
  ctx.save();
  ctx.translate(sx, sy);

  // 影子
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.72, R*0.95, R*0.2, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 8条腿（先画在壳下）──
  ctx.strokeStyle = '#882200'; ctx.lineCap = 'round';
  for (let i = -2; i <= 1; i++) {
    const lx = (i + 0.5) * R * 0.3;
    // 左侧腿
    ctx.lineWidth = R * 0.1;
    ctx.beginPath(); ctx.moveTo(-R*0.55 + Math.abs(i)*R*0.05, R*0.05 + i*R*0.1);
    ctx.quadraticCurveTo(-R*0.95 - Math.abs(i)*R*0.1, R*0.3 + i*R*0.12, -R*1.0 - Math.abs(i)*R*0.08, R*0.65 + i*R*0.05);
    ctx.stroke();
    // 右侧腿
    ctx.beginPath(); ctx.moveTo(R*0.55 - Math.abs(i)*R*0.05, R*0.05 + i*R*0.1);
    ctx.quadraticCurveTo(R*0.95 + Math.abs(i)*R*0.1, R*0.3 + i*R*0.12, R*1.0 + Math.abs(i)*R*0.08, R*0.65 + i*R*0.05);
    ctx.stroke();
  }

  // ── 蟹壳（宽扁六边形）──
  const shellGrd = ctx.createRadialGradient(-R*0.15, -R*0.15, R*0.05, 0, 0, R*0.85);
  shellGrd.addColorStop(0, '#ff8855'); shellGrd.addColorStop(0.55, '#cc3311'); shellGrd.addColorStop(1, '#771100');
  ctx.fillStyle = shellGrd;
  ctx.beginPath();
  ctx.moveTo(-R*0.85, -R*0.05); ctx.lineTo(-R*0.65, -R*0.42); ctx.lineTo(0, -R*0.52);
  ctx.lineTo(R*0.65, -R*0.42); ctx.lineTo(R*0.85, -R*0.05); ctx.lineTo(R*0.75, R*0.48);
  ctx.lineTo(0, R*0.58); ctx.lineTo(-R*0.75, R*0.48); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.08; ctx.stroke();

  // 壳纹
  ctx.strokeStyle = 'rgba(255,120,60,0.4)'; ctx.lineWidth = R*0.05;
  ctx.beginPath(); ctx.moveTo(-R*0.45, -R*0.18); ctx.quadraticCurveTo(0, -R*0.35, R*0.45, -R*0.18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-R*0.3, R*0.12); ctx.quadraticCurveTo(0, R*0.0, R*0.3, R*0.12); ctx.stroke();

  // ── 眼柄（竖起来的眼睛）──
  ctx.fillStyle = '#661100';
  ctx.beginPath(); ctx.rect(-R*0.32, -R*0.52, R*0.1, -R*0.28); ctx.fill();
  ctx.beginPath(); ctx.rect(R*0.22, -R*0.52, R*0.1, -R*0.28); ctx.fill();
  // 眼球
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-R*0.27, -R*0.82, R*0.14, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(R*0.27, -R*0.82, R*0.14, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ff3300';
  ctx.beginPath(); ctx.arc(-R*0.27, -R*0.82, R*0.09, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(R*0.27, -R*0.82, R*0.09, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(-R*0.3, -R*0.86, R*0.04, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(R*0.24, -R*0.86, R*0.04, 0, Math.PI*2); ctx.fill();

  // ── 大蟹钳（左右，夸张大）──
  const pinC = '#cc3311';
  // 左钳臂
  ctx.fillStyle = pinC;
  ctx.beginPath(); ctx.ellipse(-R*1.05, -R*0.1, R*0.28, R*0.18, 0.6, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 左钳两片
  ctx.fillStyle = '#dd4422';
  ctx.beginPath(); ctx.ellipse(-R*1.38, -R*0.22, R*0.26, R*0.14, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-R*1.38, R*0.05, R*0.26, R*0.14, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.05;
  ctx.stroke();
  // 右钳臂
  ctx.fillStyle = pinC;
  ctx.beginPath(); ctx.ellipse(R*1.05, -R*0.1, R*0.28, R*0.18, -0.6, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.06; ctx.stroke();
  ctx.fillStyle = '#dd4422';
  ctx.beginPath(); ctx.ellipse(R*1.38, -R*0.22, R*0.26, R*0.14, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*1.38, R*0.05, R*0.26, R*0.14, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.05; ctx.stroke();

  ctx.restore();
}

// ============================================================
//   Q版鱼妖/水鬼 Sprite（龙宫小怪：鱼妖、水鬼、河怪、水猴、蚌精等）
//   鱼形身体 + 鱼鳍 + 鱼尾 + 发光眼睛
// ============================================================
function drawFishDemonSprite(ctx, sx, sy, r) {
  const t = Date.now() / 1000;
  const R = r;
  ctx.save();
  ctx.translate(sx, sy);

  // 微摇摆动画（鱼的游动感）
  const wobble = Math.sin(t * 3.0) * 0.06;
  ctx.rotate(wobble);

  // 影子
  ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.75, R*0.68, R*0.16, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 尾鳍（先画，在身体后面）──
  ctx.fillStyle = '#118888';
  // 上叶
  ctx.beginPath();
  ctx.moveTo(R*0.4, R*0.08);
  ctx.quadraticCurveTo(R*1.0, -R*0.2, R*1.15, -R*0.5);
  ctx.quadraticCurveTo(R*0.8, -R*0.1, R*0.45, R*0.05);
  ctx.closePath(); ctx.fill();
  // 下叶
  ctx.beginPath();
  ctx.moveTo(R*0.4, R*0.1);
  ctx.quadraticCurveTo(R*1.0, R*0.35, R*1.15, R*0.62);
  ctx.quadraticCurveTo(R*0.8, R*0.28, R*0.45, R*0.12);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#005566'; ctx.lineWidth = R*0.06; ctx.lineCap = 'round';
  // 尾鳍线条
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(R*0.45, R*(0.05 + i*0.18) - R*0.3);
    ctx.lineTo(R*1.1, R*(0.05 + i*0.28) - R*0.45); ctx.stroke();
  }

  // ── 身体（鱼形，横置椭圆）──
  const bodyGrd = ctx.createRadialGradient(-R*0.1, -R*0.08, R*0.05, 0, 0, R*0.72);
  bodyGrd.addColorStop(0, '#66ddcc');
  bodyGrd.addColorStop(0.5, '#118877');
  bodyGrd.addColorStop(1, '#004455');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.ellipse(-R*0.05, R*0.08, R*0.62, R*0.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#005566'; ctx.lineWidth = R*0.07; ctx.stroke();

  // 鳞片纹（弧线组）
  ctx.strokeStyle = 'rgba(100,220,200,0.35)'; ctx.lineWidth = R*0.04;
  for (let i = -2; i <= 1; i++) {
    ctx.beginPath(); ctx.arc(i*R*0.22, R*0.08, R*0.2, 0, Math.PI); ctx.stroke();
  }

  // ── 背鳍（顶部三角形）──
  ctx.fillStyle = '#0d9977';
  ctx.beginPath();
  ctx.moveTo(-R*0.28, -R*0.42); ctx.lineTo(-R*0.05, -R*0.82); ctx.lineTo(R*0.22, -R*0.42);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#005544'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 鳍纹
  ctx.strokeStyle = '#006655'; ctx.lineWidth = R*0.04;
  ctx.beginPath(); ctx.moveTo(-R*0.12, -R*0.45); ctx.lineTo(-R*0.06, -R*0.75); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R*0.08, -R*0.45); ctx.lineTo(R*0.04, -R*0.72); ctx.stroke();

  // ── 腹鳍（两侧小翅）──
  ctx.fillStyle = '#0d9977';
  ctx.beginPath(); ctx.ellipse(-R*0.42, R*0.25, R*0.2, R*0.1, 0.8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*0.32, R*0.25, R*0.2, R*0.1, -0.8, 0, Math.PI*2); ctx.fill();

  // ── 头部（椭圆，贴在身体左侧）──
  const headR = R * 0.48;
  const headX = -R * 0.28;
  const headY2 = R * 0.06;
  ctx.fillStyle = '#1aa890';
  ctx.beginPath(); ctx.ellipse(headX, headY2, headR*0.85, headR, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#005566'; ctx.lineWidth = R*0.07; ctx.stroke();

  // ── 眼睛（发光圆眼，妖气感）──
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(headX-headR*0.05, headY2-headR*0.22, headR*0.3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath(); ctx.arc(headX-headR*0.05, headY2-headR*0.22, headR*0.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#003322';
  ctx.beginPath(); ctx.arc(headX-headR*0.05, headY2-headR*0.22, headR*0.1, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(headX-headR*0.1, headY2-headR*0.28, headR*0.07, 0, Math.PI*2); ctx.fill();

  // ── 嘴（斜裂鱼嘴，露小牙）──
  ctx.strokeStyle = '#002233'; ctx.lineWidth = headR*0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(headX-headR*0.72, headY2+headR*0.05);
  ctx.lineTo(headX-headR*0.3, headY2+headR*0.25); ctx.stroke();
  ctx.fillStyle = '#eeeedd';
  ctx.beginPath(); ctx.moveTo(headX-headR*0.68, headY2+headR*0.08);
  ctx.lineTo(headX-headR*0.72, headY2+headR*0.22);
  ctx.lineTo(headX-headR*0.55, headY2+headR*0.1); ctx.fill();

  ctx.restore();
}

// ============================================================
//   天庭小怪 通用金甲天兵 Sprite
//   金甲 + 头盔 + 长矛 + 盾牌
// ============================================================
function drawHeavenSoldierSprite(ctx, sx, sy, r) {
  const R = r;
  const t = Date.now() / 1000;
  ctx.save();
  ctx.translate(sx, sy);

  // 影子
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.82, R*0.75, R*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 长矛（先画在身体后）──
  ctx.save();
  ctx.translate(R*0.55, 0);
  ctx.fillStyle = '#c8a820';
  ctx.fillRect(-R*0.06, -R*1.65, R*0.12, R*1.4);  // 杆
  ctx.beginPath();  // 矛头（三角）
  ctx.moveTo(0, -R*1.65); ctx.lineTo(-R*0.14, -R*1.3); ctx.lineTo(R*0.14, -R*1.3);
  ctx.closePath(); ctx.fillStyle = '#e8e8e8'; ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = R*0.03; ctx.stroke();
  ctx.restore();

  // ── 盾牌（左侧）──
  ctx.save();
  ctx.translate(-R*0.6, -R*0.05);
  ctx.rotate(-0.15);
  // 盾面
  ctx.beginPath();
  ctx.moveTo(0, -R*0.52); ctx.lineTo(-R*0.3, -R*0.25);
  ctx.lineTo(-R*0.32, R*0.3); ctx.lineTo(0, R*0.5);
  ctx.lineTo(R*0.32, R*0.3); ctx.lineTo(R*0.3, -R*0.25);
  ctx.closePath();
  const shieldGrd = ctx.createLinearGradient(-R*0.3, 0, R*0.3, 0);
  shieldGrd.addColorStop(0, '#cc8800'); shieldGrd.addColorStop(0.5, '#ffcc44'); shieldGrd.addColorStop(1, '#cc8800');
  ctx.fillStyle = shieldGrd; ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 盾纹（圆+十字）
  ctx.beginPath(); ctx.arc(0, 0, R*0.18, 0, Math.PI*2);
  ctx.strokeStyle = '#aa6600'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.restore();

  // ── 身体（金甲）──
  const bodyGrd = ctx.createLinearGradient(-R*0.4, -R*0.45, R*0.4, R*0.5);
  bodyGrd.addColorStop(0, '#ffe066'); bodyGrd.addColorStop(0.4, '#cc8800'); bodyGrd.addColorStop(1, '#885500');
  ctx.beginPath(); ctx.ellipse(0, R*0.12, R*0.42, R*0.55, 0, 0, Math.PI*2);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.07; ctx.stroke();
  // 甲纹
  ctx.strokeStyle = 'rgba(255,220,80,0.5)'; ctx.lineWidth = R*0.04;
  ctx.beginPath(); ctx.moveTo(-R*0.3, -R*0.1); ctx.quadraticCurveTo(0, -R*0.22, R*0.3, -R*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-R*0.3, R*0.15); ctx.quadraticCurveTo(0, R*0.03, R*0.3, R*0.15); ctx.stroke();

  // ── 头盔 ──
  const headR = R * 0.38;
  const headY = -R * 0.52;
  // 脸部
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI*2);
  ctx.fillStyle = '#f5c890'; ctx.fill();
  ctx.strokeStyle = '#c07840'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 盔体（金色半圆盔）
  ctx.beginPath();
  ctx.arc(0, headY, headR*1.05, Math.PI*1.1, Math.PI*0.0, false);
  ctx.lineTo(headR*1.05, headY); ctx.lineTo(-headR*1.05, headY);
  ctx.closePath();
  const helmGrd = ctx.createLinearGradient(-headR, headY-headR, headR, headY);
  helmGrd.addColorStop(0, '#ffe066'); helmGrd.addColorStop(0.5, '#cc8800'); helmGrd.addColorStop(1, '#885500');
  ctx.fillStyle = helmGrd; ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 盔顶红缨（随时间飘动）
  const featherSway = Math.sin(t * 3.0) * 3;
  ctx.strokeStyle = '#cc1100'; ctx.lineWidth = R*0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, headY-headR); ctx.quadraticCurveTo(featherSway, headY-headR*1.5, featherSway*1.5, headY-headR*1.9); ctx.stroke();
  // 护颊（两侧金片）
  ctx.fillStyle = '#cc8800';
  ctx.beginPath(); ctx.ellipse(-headR*0.88, headY+headR*0.1, headR*0.22, headR*0.38, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR*0.88, headY+headR*0.1, headR*0.22, headR*0.38, 0.2, 0, Math.PI*2); ctx.fill();
  // 盔帘（下挡）
  ctx.fillStyle = '#aa6600';
  ctx.beginPath(); ctx.rect(-headR*0.72, headY+headR*0.35, headR*1.44, headR*0.38); ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.03; ctx.stroke();
  // 眼睛（平视，严肃）
  ctx.fillStyle = '#2a1500';
  ctx.beginPath(); ctx.ellipse(-headR*0.32, headY-headR*0.06, headR*0.14, headR*0.1, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR*0.32, headY-headR*0.06, headR*0.14, headR*0.1, 0, 0, Math.PI*2); ctx.fill();
  // 眉毛（横眉）
  ctx.strokeStyle = '#2a1500'; ctx.lineWidth = R*0.04; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR*0.46, headY-headR*0.22); ctx.lineTo(-headR*0.18, headY-headR*0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR*0.46, headY-headR*0.22); ctx.lineTo(headR*0.18, headY-headR*0.2); ctx.stroke();

  ctx.restore();
}

// ============================================================
//   Q版托塔天王 BOSS Sprite
//   金甲重装 + 托塔（手持宝塔）+ 威严面相
// ============================================================
function drawLiTianwangSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // BOSS光晕（金色）
  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t * 1.8)) * 0.4;
    const glowR = R * 1.6;
    const grd = ctx.createRadialGradient(0, 0, R*0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(255,200,50,${pulse*0.55})`);
    grd.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  }

  // 影子
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.85, R*0.92, R*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 宝塔（右手高举）──
  ctx.save();
  ctx.translate(R*0.62, -R*0.6);
  // 塔基
  ctx.fillStyle = '#ddaa00';
  ctx.beginPath(); ctx.rect(-R*0.22, R*0.1, R*0.44, R*0.28); ctx.fill();
  ctx.strokeStyle = '#886600'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 塔身3层（从下到上）
  const towerColors = ['#ffcc44','#ffdd66','#ffee88'];
  for (let i = 0; i < 3; i++) {
    const tw = R*(0.36 - i*0.07), th = R*0.2;
    const ty = R*0.1 - (i+1)*th;
    ctx.fillStyle = towerColors[i];
    ctx.beginPath(); ctx.rect(-tw/2, ty, tw, th); ctx.fill();
    ctx.strokeStyle = '#886600'; ctx.lineWidth = R*0.03; ctx.stroke();
    // 每层挑檐（梯形翘边）
    ctx.fillStyle = '#cc8800';
    ctx.beginPath();
    ctx.moveTo(-tw/2-R*0.04, ty+R*0.02); ctx.lineTo(tw/2+R*0.04, ty+R*0.02);
    ctx.lineTo(tw/2+R*0.06, ty); ctx.lineTo(-tw/2-R*0.06, ty);
    ctx.closePath(); ctx.fill();
  }
  // 塔顶尖
  ctx.fillStyle = '#ff4400';
  ctx.beginPath(); ctx.moveTo(0, -R*0.72); ctx.lineTo(-R*0.1, -R*0.52); ctx.lineTo(R*0.1, -R*0.52); ctx.closePath(); ctx.fill();
  // 塔发光（宝塔发光脉冲）
  ctx.globalAlpha = 0.35 + Math.abs(Math.sin(t*2.5))*0.2;
  ctx.fillStyle = '#ffffaa';
  ctx.beginPath(); ctx.arc(0, -R*0.3, R*0.28, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── 身体（重型金甲）──
  const bodyGrd = ctx.createRadialGradient(-R*0.15, -R*0.15, R*0.05, 0, 0, R*0.85);
  bodyGrd.addColorStop(0, '#ffe066'); bodyGrd.addColorStop(0.4, '#cc8800'); bodyGrd.addColorStop(1, '#774400');
  ctx.beginPath(); ctx.ellipse(0, R*0.1, R*0.55, R*0.75, 0, 0, Math.PI*2);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.1; ctx.stroke();
  // 甲纹（多道横纹）
  ctx.strokeStyle = 'rgba(255,200,50,0.5)'; ctx.lineWidth = R*0.05; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-R*0.42, i*R*0.22); ctx.quadraticCurveTo(0, i*R*0.22-R*0.06, R*0.42, i*R*0.22);
    ctx.stroke();
  }
  // 腰间宝带（红底金扣）
  ctx.fillStyle = '#cc1100';
  ctx.beginPath(); ctx.rect(-R*0.5, R*0.08, R*1.0, R*0.14); ctx.fill();
  ctx.fillStyle = '#ffcc44';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.arc(i*R*0.22, R*0.15, R*0.06, 0, Math.PI*2); ctx.fill();
  }

  // ── 左臂（持钺，金斧）──
  ctx.save();
  ctx.translate(-R*0.62, -R*0.25);
  ctx.rotate(0.3);
  ctx.fillStyle = '#c8a820'; ctx.beginPath(); ctx.rect(-R*0.05, -R*0.5, R*0.1, R*0.6); ctx.fill(); // 斧柄
  ctx.fillStyle = '#e8e0d0'; // 斧头
  ctx.beginPath(); ctx.moveTo(0, -R*0.5); ctx.lineTo(-R*0.28, -R*0.2); ctx.lineTo(-R*0.28, R*0.05); ctx.lineTo(0, -R*0.05); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.restore();

  // ── 头部（Q版大头 + 天王盔）──
  const headR2 = R*0.42;
  const headY2 = -R*0.72;
  // 脸
  ctx.beginPath(); ctx.arc(0, headY2, headR2, 0, Math.PI*2);
  ctx.fillStyle = '#d4884a'; ctx.fill();
  ctx.strokeStyle = '#a06030'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 三眼（天王特征：额头第三只眼）
  // 正常两眼
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.ellipse(-headR2*0.35, headY2-headR2*0.05, headR2*0.18, headR2*0.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR2*0.35, headY2-headR2*0.05, headR2*0.18, headR2*0.15, 0, 0, Math.PI*2); ctx.fill();
  // 高光
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR2*0.3, headY2-headR2*0.1, headR2*0.06, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR2*0.4, headY2-headR2*0.1, headR2*0.06, 0, Math.PI*2); ctx.fill();
  // 浓眉
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = R*0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR2*0.52, headY2-headR2*0.28); ctx.lineTo(-headR2*0.18, headY2-headR2*0.26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR2*0.52, headY2-headR2*0.28); ctx.lineTo(headR2*0.18, headY2-headR2*0.26); ctx.stroke();
  // 威严胡子（短须）
  ctx.strokeStyle = '#2a1000'; ctx.lineWidth = R*0.04;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i*R*0.1, headY2+headR2*0.35); ctx.lineTo(i*R*0.12, headY2+headR2*0.6); ctx.stroke();
  }
  // 嘴（抿嘴，威严）
  ctx.beginPath(); ctx.moveTo(-headR2*0.22, headY2+headR2*0.28); ctx.lineTo(headR2*0.22, headY2+headR2*0.28);
  ctx.strokeStyle = '#5a2000'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 天王盔（金色凤翅盔）
  const hatY3 = headY2 - headR2*0.42;
  ctx.fillStyle = '#cc8800';
  ctx.beginPath(); ctx.arc(0, hatY3, headR2*0.82, Math.PI*1.05, Math.PI*1.95, false);
  ctx.lineTo(headR2*0.82, hatY3); ctx.lineTo(-headR2*0.82, hatY3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 凤翅（两侧）
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.moveTo(-headR2*0.82, hatY3); ctx.lineTo(-headR2*1.5, hatY3-headR2*0.4); ctx.lineTo(-headR2*0.82, hatY3-headR2*0.55); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR2*0.82, hatY3); ctx.lineTo(headR2*1.5, hatY3-headR2*0.4); ctx.lineTo(headR2*0.82, hatY3-headR2*0.55); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#885500'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 盔顶红缨
  ctx.strokeStyle = '#cc1100'; ctx.lineWidth = R*0.08;
  ctx.beginPath(); ctx.moveTo(0, hatY3-headR2*0.8); ctx.lineTo(Math.sin(t*3)*R*0.08, hatY3-headR2*1.35); ctx.stroke();
  // 额前金印
  ctx.fillStyle = '#ffee00';
  ctx.beginPath(); ctx.arc(0, headY2-headR2*0.42, headR2*0.14, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#886600'; ctx.lineWidth = R*0.03; ctx.stroke();
  // BOSS才显示第三只眼（红色，发光）
  if (isBoss) {
    const eyeGlow = 0.6 + Math.abs(Math.sin(t*2))*0.4;
    ctx.fillStyle = `rgba(255,50,0,${eyeGlow})`;
    ctx.beginPath(); ctx.ellipse(0, headY2-headR2*0.42, headR2*0.1, headR2*0.08, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ff8800'; ctx.lineWidth = R*0.03; ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
//   Q版哪吒三太子 BOSS Sprite
//   乾坤圈 + 混天绫 + 风火轮 + 红肚兜
// ============================================================
function drawNezhaSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  // BOSS光晕（红金）
  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t * 2.2)) * 0.4;
    const glowR = R * 1.65;
    const grd = ctx.createRadialGradient(0, 0, R*0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(255,80,0,${pulse*0.5})`);
    grd.addColorStop(0.6, `rgba(255,180,0,${pulse*0.2})`);
    grd.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  }

  // 影子
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.82, R*0.7, R*0.17, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 风火轮（左右脚下，旋转）──
  const wheelAngle = t * 3.5;
  [-R*0.38, R*0.38].forEach((wx, i) => {
    ctx.save();
    ctx.translate(wx, R*0.62);
    ctx.rotate(i === 0 ? wheelAngle : -wheelAngle);
    // 轮框
    ctx.beginPath(); ctx.arc(0, 0, R*0.26, 0, Math.PI*2);
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = R*0.08; ctx.stroke();
    // 轮辐（4条）
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = R*0.05;
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI/2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(ang)*R*0.26, Math.sin(ang)*R*0.26); ctx.stroke();
    }
    // 火焰（每辐末端）
    ctx.fillStyle = '#ffcc00';
    for (let a = 0; a < 4; a++) {
      const ang = a * Math.PI/2;
      ctx.save(); ctx.translate(Math.cos(ang)*R*0.26, Math.sin(ang)*R*0.26);
      ctx.beginPath(); ctx.arc(0, 0, R*0.1, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });

  // ── 混天绫（斜缠红绸，飘动）──
  const silkSway = Math.sin(t * 2.5) * R * 0.08;
  ctx.strokeStyle = '#cc1100'; ctx.lineWidth = R*0.1; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-R*0.7, -R*0.2 + silkSway);
  ctx.quadraticCurveTo(-R*0.1, R*0.1, R*0.6, -R*0.45 - silkSway);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(R*0.7, R*0.1 - silkSway);
  ctx.quadraticCurveTo(R*0.1, -R*0.2, -R*0.5, R*0.35 + silkSway);
  ctx.stroke();

  // ── 身体（红肚兜+白裤）──
  // 白裤
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, R*0.3, R*0.32, R*0.42, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#cccccc'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 红肚兜
  ctx.fillStyle = '#dd1100';
  ctx.beginPath();
  ctx.moveTo(-R*0.28, -R*0.32); ctx.lineTo(0, -R*0.52); ctx.lineTo(R*0.28, -R*0.32);
  ctx.quadraticCurveTo(R*0.35, R*0.05, 0, R*0.12);
  ctx.quadraticCurveTo(-R*0.35, R*0.05, -R*0.28, -R*0.32); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#881100'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 肚兜金纹
  ctx.strokeStyle = '#ffcc44'; ctx.lineWidth = R*0.04;
  ctx.beginPath(); ctx.moveTo(-R*0.15, -R*0.22); ctx.lineTo(0, R*0.02); ctx.lineTo(R*0.15, -R*0.22); ctx.stroke();

  // ── 乾坤圈（头上方旋转光环）──
  ctx.save();
  ctx.translate(0, -R*0.9);
  ctx.rotate(t * 2.0);
  ctx.beginPath(); ctx.arc(0, 0, R*0.42, 0, Math.PI*2);
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = R*0.1; ctx.stroke();
  // 圈上金珠
  for (let i = 0; i < 6; i++) {
    const ang = i * Math.PI / 3;
    ctx.beginPath(); ctx.arc(Math.cos(ang)*R*0.42, Math.sin(ang)*R*0.42, R*0.07, 0, Math.PI*2);
    ctx.fillStyle = '#ffee44'; ctx.fill();
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = R*0.03; ctx.stroke();
  }
  ctx.restore();

  // ── 头部（大圆头，童颜）──
  const headR3 = R * 0.42;
  const headY3 = -R * 0.62;
  ctx.beginPath(); ctx.arc(0, headY3, headR3, 0, Math.PI*2);
  ctx.fillStyle = '#f5c078'; ctx.fill();
  ctx.strokeStyle = '#c07030'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 童发（两个发髻）
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.arc(-headR3*0.55, headY3-headR3*0.72, headR3*0.28, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR3*0.55, headY3-headR3*0.72, headR3*0.28, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc1100'; // 发髻红绳
  ctx.beginPath(); ctx.arc(-headR3*0.55, headY3-headR3*0.72, headR3*0.12, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR3*0.55, headY3-headR3*0.72, headR3*0.12, 0, Math.PI*2); ctx.fill();
  // 眼睛（大圆眼，活泼）
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.arc(-headR3*0.3, headY3-headR3*0.05, headR3*0.18, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR3*0.3, headY3-headR3*0.05, headR3*0.18, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR3*0.24, headY3-headR3*0.1, headR3*0.07, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR3*0.36, headY3-headR3*0.1, headR3*0.07, 0, Math.PI*2); ctx.fill();
  // 眉（上扬，英气）
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = R*0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR3*0.52, headY3-headR3*0.3); ctx.lineTo(-headR3*0.1, headY3-headR3*0.35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR3*0.52, headY3-headR3*0.3); ctx.lineTo(headR3*0.1, headY3-headR3*0.35); ctx.stroke();
  // 嘴（笑嘴）
  ctx.beginPath(); ctx.arc(0, headY3+headR3*0.2, headR3*0.2, 0.1, Math.PI-0.1, false);
  ctx.strokeStyle = '#8B3000'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 腮红
  ctx.globalAlpha = 0.3; ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.ellipse(-headR3*0.58, headY3+headR3*0.12, headR3*0.16, headR3*0.1, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR3*0.58, headY3+headR3*0.12, headR3*0.16, headR3*0.1, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ============================================================
//   Q版卷帘大将 BOSS Sprite
//   粗壮身形 + 流沙河神将装扮 + 卷帘棒（九头骷髅项链）
// ============================================================
function drawJuanLianSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  if (isBoss) {
    const pulse = 0.35 + Math.abs(Math.sin(t*1.7))*0.4;
    const glowR = R*1.6;
    const grd = ctx.createRadialGradient(0, 0, R*0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(80,120,180,${pulse*0.55})`);
    grd.addColorStop(1, 'rgba(20,60,120,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  }

  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.85, R*0.92, R*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 降妖杖（右手高举，九节杖）──
  ctx.save();
  ctx.translate(R*0.58, -R*0.2);
  ctx.rotate(-0.2);
  ctx.fillStyle = '#8B5E0A'; ctx.beginPath(); ctx.rect(-R*0.07, -R*1.1, R*0.14, R*1.3); ctx.fill();
  ctx.strokeStyle = '#553300'; ctx.lineWidth = R*0.03; ctx.stroke();
  // 杖节
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(0, -R*0.1 - i*R*0.2, R*0.09, 0, Math.PI*2);
    ctx.fillStyle = i%2===0 ? '#c8a820' : '#886600'; ctx.fill();
    ctx.strokeStyle = '#553300'; ctx.lineWidth = R*0.03; ctx.stroke();
  }
  // 杖顶骷髅头
  ctx.fillStyle = '#e8e0c8';
  ctx.beginPath(); ctx.arc(0, -R*1.1, R*0.14, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.ellipse(-R*0.05, -R*1.12, R*0.04, R*0.04, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(R*0.05, -R*1.12, R*0.04, R*0.04, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 粗壮身体（深蓝铠甲）──
  const bodyGrd = ctx.createRadialGradient(-R*0.15, -R*0.1, R*0.05, 0, 0, R*0.85);
  bodyGrd.addColorStop(0, '#6688cc'); bodyGrd.addColorStop(0.5, '#224488'); bodyGrd.addColorStop(1, '#112244');
  ctx.beginPath(); ctx.ellipse(0, R*0.08, R*0.58, R*0.78, 0, 0, Math.PI*2);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.strokeStyle = '#1a3366'; ctx.lineWidth = R*0.1; ctx.stroke();
  // 九头骷髅项链（标志性道具）
  for (let i = 0; i < 5; i++) {
    const ang = (i/(5-1) - 0.5) * Math.PI * 0.8;
    const nx = Math.sin(ang) * R*0.38;
    const ny = -R*0.45 + Math.cos(ang) * R*0.1;
    ctx.fillStyle = '#e8e0c8';
    ctx.beginPath(); ctx.arc(nx, ny, R*0.08, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = R*0.02; ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.ellipse(nx-R*0.03, ny-R*0.01, R*0.025, R*0.02, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(nx+R*0.03, ny-R*0.01, R*0.025, R*0.02, 0, 0, Math.PI*2); ctx.fill();
  }
  // 腰间蓝绸
  ctx.fillStyle = '#3355aa';
  ctx.beginPath(); ctx.rect(-R*0.54, R*0.05, R*1.08, R*0.16); ctx.fill();
  ctx.strokeStyle = '#1a3366'; ctx.lineWidth = R*0.04; ctx.stroke();

  // ── 大头（方脸，卷帘特征）──
  const headR4 = R*0.44;
  const headY4 = -R*0.78;
  ctx.beginPath(); ctx.arc(0, headY4, headR4, 0, Math.PI*2);
  ctx.fillStyle = '#6688cc'; ctx.fill(); // 神将蓝脸
  ctx.strokeStyle = '#224488'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 面部纹路（神将纹面）
  ctx.strokeStyle = '#1a3366'; ctx.lineWidth = R*0.04;
  ctx.beginPath(); ctx.moveTo(-headR4*0.4, headY4-headR4*0.1); ctx.lineTo(-headR4*0.1, headY4+headR4*0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR4*0.4, headY4-headR4*0.1); ctx.lineTo(headR4*0.1, headY4+headR4*0.3); ctx.stroke();
  // 眼（瞪眼，凶）
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.ellipse(-headR4*0.3, headY4-headR4*0.1, headR4*0.2, headR4*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR4*0.3, headY4-headR4*0.1, headR4*0.2, headR4*0.18, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-headR4*0.3, headY4-headR4*0.1, headR4*0.1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR4*0.3, headY4-headR4*0.1, headR4*0.1, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR4*0.26, headY4-headR4*0.16, headR4*0.04, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR4*0.34, headY4-headR4*0.16, headR4*0.04, 0, Math.PI*2); ctx.fill();
  // 八字须（卷帘标志）
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = R*0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR4*0.12, headY4+headR4*0.18); ctx.quadraticCurveTo(-headR4*0.4, headY4+headR4*0.3, -headR4*0.55, headY4+headR4*0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR4*0.12, headY4+headR4*0.18); ctx.quadraticCurveTo(headR4*0.4, headY4+headR4*0.3, headR4*0.55, headY4+headR4*0.2); ctx.stroke();
  // 卷帘盔（蓝黑色武将盔）
  const hatY4 = headY4 - headR4*0.48;
  ctx.beginPath(); ctx.arc(0, hatY4, headR4*0.85, Math.PI*1.1, Math.PI*1.9, false);
  ctx.lineTo(headR4*0.85, hatY4); ctx.lineTo(-headR4*0.85, hatY4); ctx.closePath();
  ctx.fillStyle = '#112244'; ctx.fill(); ctx.strokeStyle = '#3355aa'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 盔顶蓝缨
  ctx.strokeStyle = '#4466bb'; ctx.lineWidth = R*0.08;
  ctx.beginPath(); ctx.moveTo(0, hatY4-headR4*0.82); ctx.lineTo(Math.sin(t*2.5)*R*0.06, hatY4-headR4*1.3); ctx.stroke();
  // 盔额金章
  ctx.fillStyle = '#f0c040';
  ctx.beginPath(); ctx.ellipse(0, hatY4+headR4*0.15, headR4*0.22, headR4*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#886600'; ctx.lineWidth = R*0.03; ctx.stroke();

  ctx.restore();
}

// ============================================================
//   Q版天蓬元帅 BOSS Sprite
//   猪首人身 + 九齿钉耙 + 黑甲
// ============================================================
function drawTianpengSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  if (isBoss) {
    const pulse = 0.35 + Math.abs(Math.sin(t*1.5))*0.4;
    const glowR = R*1.6;
    const grd = ctx.createRadialGradient(0, 0, R*0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(60,60,60,${pulse*0.6})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  }

  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.85, R*0.95, R*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 九齿钉耙（右手扛）──
  ctx.save();
  ctx.translate(R*0.6, -R*0.15);
  ctx.rotate(-0.15);
  ctx.fillStyle = '#8B5E0A'; ctx.beginPath(); ctx.rect(-R*0.07, -R*1.0, R*0.14, R*1.2); ctx.fill();
  // 耙头（横杆+9齿）
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath(); ctx.rect(-R*0.35, -R*0.98, R*0.7, R*0.1); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = R*0.03; ctx.stroke();
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i*R*0.08, -R*0.9); ctx.lineTo(i*R*0.09, -R*1.28); ctx.strokeStyle = '#aaaaaa'; ctx.lineWidth = R*0.04; ctx.stroke();
  }
  ctx.restore();

  // ── 胖体型黑铁甲 ──
  const bodyGrd = ctx.createRadialGradient(-R*0.12, -R*0.08, R*0.05, 0, 0, R*0.95);
  bodyGrd.addColorStop(0, '#555555'); bodyGrd.addColorStop(0.5, '#222222'); bodyGrd.addColorStop(1, '#111111');
  ctx.beginPath(); ctx.ellipse(0, R*0.15, R*0.65, R*0.82, 0, 0, Math.PI*2);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.strokeStyle = '#111111'; ctx.lineWidth = R*0.1; ctx.stroke();
  // 甲纹（黑甲银纹）
  ctx.strokeStyle = 'rgba(160,160,160,0.4)'; ctx.lineWidth = R*0.05; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(-R*0.52, i*R*0.24); ctx.quadraticCurveTo(0, i*R*0.24-R*0.05, R*0.52, i*R*0.24); ctx.stroke();
  }
  // 腰带（银色）
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath(); ctx.rect(-R*0.58, R*0.1, R*1.16, R*0.15); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.arc(0, R*0.175, R*0.07, 0, Math.PI*2); ctx.fill();

  // ── 猪头（Q版，大鼻子+长耳）──
  const headR5 = R*0.48;
  const headY5 = -R*0.82;
  ctx.beginPath(); ctx.arc(0, headY5, headR5, 0, Math.PI*2);
  ctx.fillStyle = '#cc8877'; ctx.fill();
  ctx.strokeStyle = '#994444'; ctx.lineWidth = R*0.06; ctx.stroke();
  // 猪耳（两侧大耳）
  ctx.fillStyle = '#dd9988';
  ctx.beginPath(); ctx.ellipse(-headR5*0.82, headY5-headR5*0.52, headR5*0.32, headR5*0.45, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#994444'; ctx.lineWidth = R*0.05; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(headR5*0.82, headY5-headR5*0.52, headR5*0.32, headR5*0.45, 0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 耳内粉色
  ctx.fillStyle = '#ffbbaa';
  ctx.beginPath(); ctx.ellipse(-headR5*0.82, headY5-headR5*0.52, headR5*0.2, headR5*0.3, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR5*0.82, headY5-headR5*0.52, headR5*0.2, headR5*0.3, 0.4, 0, Math.PI*2); ctx.fill();
  // 大圆猪鼻
  ctx.fillStyle = '#dd8877';
  ctx.beginPath(); ctx.ellipse(0, headY5+headR5*0.35, headR5*0.42, headR5*0.28, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#994444'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 鼻孔
  ctx.fillStyle = '#882222';
  ctx.beginPath(); ctx.ellipse(-headR5*0.16, headY5+headR5*0.35, headR5*0.1, headR5*0.08, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR5*0.16, headY5+headR5*0.35, headR5*0.1, headR5*0.08, 0, 0, Math.PI*2); ctx.fill();
  // 眼（小眼）
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.arc(-headR5*0.32, headY5-headR5*0.12, headR5*0.13, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR5*0.32, headY5-headR5*0.12, headR5*0.13, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR5*0.28, headY5-headR5*0.17, headR5*0.05, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR5*0.36, headY5-headR5*0.17, headR5*0.05, 0, Math.PI*2); ctx.fill();
  // 黑甲头盔
  ctx.beginPath(); ctx.arc(0, headY5, headR5*1.02, Math.PI*1.15, Math.PI*1.85, false);
  ctx.lineTo(headR5*0.88, headY5-headR5*0.05); ctx.lineTo(-headR5*0.88, headY5-headR5*0.05); ctx.closePath();
  ctx.fillStyle = '#222222'; ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = R*0.04; ctx.stroke();
  // 盔缨（黑色）
  ctx.strokeStyle = '#333333'; ctx.lineWidth = R*0.07;
  ctx.beginPath(); ctx.moveTo(0, headY5-headR5); ctx.lineTo(Math.sin(t*2)*R*0.06, headY5-headR5*1.5); ctx.stroke();

  ctx.restore();
}

// ============================================================
//   Q版二郎神 BOSS Sprite
//   三眼 + 哮天犬 + 三尖两刃刀 + 白色战袍
// ============================================================
function drawErLangSprite(ctx, sx, sy, r, isBoss) {
  const t = Date.now() / 1000;
  const s = isBoss ? 1.55 : 1.0;
  const R = r * s;
  ctx.save();
  ctx.translate(sx, sy);

  if (isBoss) {
    const pulse = 0.4 + Math.abs(Math.sin(t*2.0))*0.4;
    const glowR = R*1.65;
    const grd = ctx.createRadialGradient(0, 0, R*0.3, 0, 0, glowR);
    grd.addColorStop(0, `rgba(120,200,255,${pulse*0.5})`);
    grd.addColorStop(1, 'rgba(50,100,200,0)');
    ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
  }

  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, R*0.84, R*0.9, R*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── 哮天犬（身旁小白犬）──
  ctx.save();
  ctx.translate(-R*0.88, R*0.35);
  const dogBob = Math.sin(t*4)*R*0.04;
  // 犬身
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath(); ctx.ellipse(0, dogBob, R*0.22, R*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#cccccc'; ctx.lineWidth = R*0.03; ctx.stroke();
  // 犬头
  ctx.beginPath(); ctx.arc(-R*0.18, dogBob-R*0.1, R*0.14, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 犬耳
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.ellipse(-R*0.24, dogBob-R*0.21, R*0.06, R*0.1, -0.4, 0, Math.PI*2); ctx.fill();
  // 犬眼
  ctx.fillStyle = '#1a0800'; ctx.beginPath(); ctx.arc(-R*0.23, dogBob-R*0.12, R*0.03, 0, Math.PI*2); ctx.fill();
  // 犬尾
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = R*0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(R*0.2, dogBob); ctx.quadraticCurveTo(R*0.35, dogBob-R*0.2, R*0.28, dogBob-R*0.32); ctx.stroke();
  ctx.restore();

  // ── 三尖两刃刀（右手持）──
  ctx.save();
  ctx.translate(R*0.62, -R*0.3);
  ctx.rotate(-0.15);
  // 刀杆
  ctx.fillStyle = '#8B5E0A'; ctx.beginPath(); ctx.rect(-R*0.06, -R*0.85, R*0.12, R*1.1); ctx.fill();
  // 刀刃（三尖，中间大，两侧小）
  ctx.fillStyle = '#d0d8e0';
  // 中尖
  ctx.beginPath(); ctx.moveTo(0, -R*0.85); ctx.lineTo(-R*0.16, -R*0.5); ctx.lineTo(R*0.16, -R*0.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#778'; ctx.lineWidth = R*0.03; ctx.stroke();
  // 左侧尖
  ctx.beginPath(); ctx.moveTo(-R*0.14, -R*0.62); ctx.lineTo(-R*0.32, -R*0.42); ctx.lineTo(-R*0.08, -R*0.38); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 右侧尖
  ctx.beginPath(); ctx.moveTo(R*0.14, -R*0.62); ctx.lineTo(R*0.32, -R*0.42); ctx.lineTo(R*0.08, -R*0.38); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 刃纹（蓝光）
  ctx.strokeStyle = 'rgba(100,180,255,0.6)'; ctx.lineWidth = R*0.03;
  ctx.beginPath(); ctx.moveTo(0, -R*0.85); ctx.lineTo(0, -R*0.5); ctx.stroke();
  ctx.restore();

  // ── 白色战袍 ──
  const bodyGrd = ctx.createRadialGradient(-R*0.1, -R*0.08, R*0.05, 0, 0, R*0.82);
  bodyGrd.addColorStop(0, '#ffffff'); bodyGrd.addColorStop(0.5, '#d8e8ff'); bodyGrd.addColorStop(1, '#9ab8ee');
  ctx.beginPath(); ctx.ellipse(0, R*0.1, R*0.52, R*0.72, 0, 0, Math.PI*2);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.strokeStyle = '#6688cc'; ctx.lineWidth = R*0.08; ctx.stroke();
  // 战袍金纹
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = R*0.045; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-R*0.08, -R*0.58); ctx.lineTo(0, -R*0.35); ctx.lineTo(R*0.08, -R*0.58); ctx.stroke();
  for (let i = -1; i <= 1; i+=2) {
    ctx.beginPath(); ctx.moveTo(i*R*0.12, -R*0.45); ctx.lineTo(i*R*0.35, R*0.2); ctx.stroke();
  }
  // 腰带（蓝色）
  ctx.fillStyle = '#3355aa';
  ctx.beginPath(); ctx.rect(-R*0.5, R*0.06, R*1.0, R*0.14); ctx.fill();
  ctx.strokeStyle = '#223388'; ctx.lineWidth = R*0.04; ctx.stroke();
  ctx.fillStyle = '#f0c040';
  ctx.beginPath(); ctx.arc(0, R*0.13, R*0.07, 0, Math.PI*2); ctx.fill();

  // ── Q版大头（英武）──
  const headR6 = R*0.4;
  const headY6 = -R*0.72;
  ctx.beginPath(); ctx.arc(0, headY6, headR6, 0, Math.PI*2);
  ctx.fillStyle = '#f5c888'; ctx.fill();
  ctx.strokeStyle = '#c07030'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 两眼（英武）
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.ellipse(-headR6*0.33, headY6-headR6*0.1, headR6*0.16, headR6*0.13, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR6*0.33, headY6-headR6*0.1, headR6*0.16, headR6*0.13, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-headR6*0.28, headY6-headR6*0.15, headR6*0.06, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(headR6*0.38, headY6-headR6*0.15, headR6*0.06, 0, Math.PI*2); ctx.fill();
  // 竖眉（英气）
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = R*0.055; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-headR6*0.5, headY6-headR6*0.32); ctx.lineTo(-headR6*0.18, headY6-headR6*0.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headR6*0.5, headY6-headR6*0.32); ctx.lineTo(headR6*0.18, headY6-headR6*0.28); ctx.stroke();
  // 嘴（抿嘴）
  ctx.beginPath(); ctx.moveTo(-headR6*0.2, headY6+headR6*0.28); ctx.lineTo(headR6*0.2, headY6+headR6*0.28);
  ctx.strokeStyle = '#5a2000'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 第三眼（额头，BOSS时发光）
  const thirdEyeGlow = isBoss ? (0.5 + Math.abs(Math.sin(t*2.5))*0.5) : 0.7;
  ctx.fillStyle = `rgba(100,180,255,${thirdEyeGlow})`;
  ctx.beginPath(); ctx.ellipse(0, headY6-headR6*0.42, headR6*0.12, headR6*0.1, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#88ccff'; ctx.lineWidth = R*0.03; ctx.stroke();
  // 白盔（英气飘缨）
  const hatY6 = headY6 - headR6*0.45;
  ctx.beginPath(); ctx.arc(0, hatY6, headR6*0.88, Math.PI*1.08, Math.PI*1.92, false);
  ctx.lineTo(headR6*0.88, hatY6); ctx.lineTo(-headR6*0.88, hatY6); ctx.closePath();
  ctx.fillStyle = '#ddeeff'; ctx.fill(); ctx.strokeStyle = '#6688cc'; ctx.lineWidth = R*0.05; ctx.stroke();
  // 白缨（飘动）
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = R*0.07;
  ctx.beginPath(); ctx.moveTo(0, hatY6-headR6*0.85); ctx.quadraticCurveTo(Math.sin(t*3)*R*0.1, hatY6-headR6*1.25, Math.sin(t*3)*R*0.14, hatY6-headR6*1.45); ctx.stroke();
  // 盔额蓝章
  ctx.fillStyle = '#4488cc';
  ctx.beginPath(); ctx.ellipse(0, hatY6+headR6*0.18, headR6*0.22, headR6*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#2266aa'; ctx.lineWidth = R*0.03; ctx.stroke();

  ctx.restore();
}

// ============================================================
//   Q版波次怪 Sprite（幽灵/骷髅风格，随波次变色）
//   半透明幽灵身 + 骷髅骨骼 + 飘动效果
// ============================================================
function drawWaveEnemySprite(ctx, sx, sy, r, wave) {
  const t = Date.now() / 1000;
  const R = r;
  // 波次颜色（随波次循环变化）
  const hue = (wave * 22) % 360;
  const bodyColor    = `hsl(${hue},75%,35%)`;
  const glowColor    = `hsl(${hue},90%,55%)`;
  const darkColor    = `hsl(${hue},60%,15%)`;
  const eyeColor     = `hsl(${hue},100%,70%)`;

  ctx.save();
  ctx.translate(sx, sy);

  // ── 幽灵飘动（上下微浮动）──
  const float = Math.sin(t * 2.8 + sx * 0.01) * R * 0.08;
  ctx.translate(0, float);

  // ── 背景辉光 ──
  const pulse = 0.3 + Math.abs(Math.sin(t * 2.5)) * 0.25;
  const glowGrd = ctx.createRadialGradient(0, 0, R*0.2, 0, 0, R*1.4);
  glowGrd.addColorStop(0, `hsla(${hue},90%,60%,${pulse})`);
  glowGrd.addColorStop(1, `hsla(${hue},80%,40%,0)`);
  ctx.beginPath(); ctx.arc(0, 0, R*1.4, 0, Math.PI*2);
  ctx.fillStyle = glowGrd; ctx.fill();

  // ── 幽灵身体（底部波浪裙摆）──
  ctx.beginPath();
  ctx.moveTo(-R*0.68, R*0.1);
  // 左侧弧
  ctx.quadraticCurveTo(-R*0.8, -R*0.5, -R*0.6, -R*0.8);
  ctx.quadraticCurveTo(-R*0.3, -R*1.02, 0, -R*1.0);
  ctx.quadraticCurveTo(R*0.3, -R*1.02, R*0.6, -R*0.8);
  ctx.quadraticCurveTo(R*0.8, -R*0.5, R*0.68, R*0.1);
  // 底部波浪裙摆（3个波峰）
  const waveAmp = Math.sin(t * 3.5) * R * 0.05;
  ctx.quadraticCurveTo(R*0.48, R*0.42 + waveAmp, R*0.32, R*0.28);
  ctx.quadraticCurveTo(R*0.16, R*0.12, 0, R*0.42 - waveAmp);
  ctx.quadraticCurveTo(-R*0.16, R*0.72 + waveAmp, -R*0.32, R*0.56);
  ctx.quadraticCurveTo(-R*0.48, R*0.38, -R*0.68, R*0.1);
  ctx.closePath();

  // 半透明填充
  ctx.globalAlpha = 0.82;
  const bodyGrd = ctx.createRadialGradient(-R*0.15, -R*0.4, R*0.1, 0, -R*0.2, R*0.9);
  bodyGrd.addColorStop(0, `hsl(${hue},80%,60%)`);
  bodyGrd.addColorStop(0.6, bodyColor);
  bodyGrd.addColorStop(1, darkColor);
  ctx.fillStyle = bodyGrd; ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.07; ctx.stroke();

  // ── 骷髅/妖怪眼睛（两个菱形发光眼）──
  const eyeY = -R * 0.45;
  // 左眼
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor; ctx.shadowBlur = R * 0.8;
  ctx.beginPath();
  ctx.moveTo(-R*0.3, eyeY-R*0.16); ctx.lineTo(-R*0.14, eyeY);
  ctx.lineTo(-R*0.3, eyeY+R*0.16); ctx.lineTo(-R*0.46, eyeY); ctx.closePath(); ctx.fill();
  // 右眼
  ctx.beginPath();
  ctx.moveTo(R*0.3, eyeY-R*0.16); ctx.lineTo(R*0.14, eyeY);
  ctx.lineTo(R*0.3, eyeY+R*0.16); ctx.lineTo(R*0.46, eyeY); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;

  // 眼核（深色瞳孔）
  ctx.fillStyle = darkColor;
  ctx.beginPath(); ctx.arc(-R*0.3, eyeY, R*0.07, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(R*0.3, eyeY, R*0.07, 0, Math.PI*2); ctx.fill();

  // ── 嘴（锯齿形骷髅嘴）──
  const mouthY = eyeY + R * 0.32;
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(-R*0.28, mouthY-R*0.04);
  for (let i = 0; i < 5; i++) {
    const mx = -R*0.28 + i * R*0.14;
    ctx.lineTo(mx + R*0.07, mouthY + R*0.1);
    ctx.lineTo(mx + R*0.14, mouthY - R*0.04);
  }
  ctx.lineTo(-R*0.28, mouthY-R*0.04); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.04; ctx.stroke();

  // ── 两只小爪手（波次更高时更大）──
  const armScale = Math.min(1.2, 0.7 + wave * 0.05);
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.06;
  // 左爪
  ctx.beginPath(); ctx.ellipse(-R*0.78, -R*0.1, R*0.22*armScale, R*0.16*armScale, 0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // 爪尖（3根）
  ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.05; ctx.lineCap = 'round';
  for (let ci = -1; ci <= 1; ci++) {
    ctx.beginPath(); ctx.moveTo(-R*0.78 + ci*R*0.08, -R*0.06);
    ctx.lineTo(-R*0.78 + ci*R*0.1*armScale, R*0.12); ctx.stroke();
  }
  // 右爪
  ctx.fillStyle = bodyColor; ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.06;
  ctx.beginPath(); ctx.ellipse(R*0.78, -R*0.1, R*0.22*armScale, R*0.16*armScale, -0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = glowColor; ctx.lineWidth = R*0.05;
  for (let ci = -1; ci <= 1; ci++) {
    ctx.beginPath(); ctx.moveTo(R*0.78 + ci*R*0.08, -R*0.06);
    ctx.lineTo(R*0.78 + ci*R*0.1*armScale, R*0.12); ctx.stroke();
  }

  // ── 波次数字标记（高波次显示小标记）──
  if (wave >= 5) {
    ctx.save();
    ctx.font = `bold ${R*0.5}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor; ctx.shadowBlur = R*0.5;
    ctx.fillText(wave, 0, -R*0.15);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.restore();
}

// ── 通用名字标签绘制工具 ──
function drawNameLabel(ctx, sx, sy, name, level, topY, borderColor) {
  const label = `${name} Lv.${level}`;
  ctx.font = 'bold 11px Microsoft YaHei';
  const tw = ctx.measureText(label).width;
  const padX = 6, padY = 3;
  const bw = tw + padX * 2;
  const bh = 16;
  const bx = sx - bw / 2;
  const by = topY - bh - 2;

  // 背景板
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = borderColor || '#ffcc44';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke();
  } else {
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = borderColor || '#ffcc44';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, bh);
  }
  // 文字
  ctx.fillStyle = '#ffe8a0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, sx, by + bh / 2);
  ctx.restore();
}

// ============================================================
//   BOSS 类
// ============================================================
class Boss {
  constructor(x, y, level, zoneId) {
    this.x = x;
    this.y = y;
    this.zoneId = zoneId;
    this.level = level;
    this.radius = 22 + Math.floor(level / 20);

    const namePool = BOSS_NAMES[zoneId] || ['神秘BOSS'];
    this.name = Utils.randChoice(namePool);

    this._calcStats();

    this.hp = this.maxHp;
    this.dead = false;
    this.respawnTimer = 0;

    // AI
    this._moveTimer = 0;
    this._moveDir = { x: 0, y: 1 };
    this._atkTimer = 0;
    this.aggro = null;
    this._roamTarget = { x, y };
    this._origX = x;
    this._origY = y;
    // Leash：最大追击距离（离出生点超过此距离则强制返回）
    this._leashRange = 700;
    this._returning  = false; // 正在回归出生点

    this.effects = [];
    this.dmgFloats = [];

    // ── 冲刺技能（狼王、勇敢牛牛专属）──
    // 名字在构造后由 game.js 覆盖，故此处先置标记，_initDashSkill() 在 name 确定后调用
    this._dashSkill = null; // 由 _initDashSkill() 赋值

    const col = BOSS_COLORS[zoneId] || { body:'#cc4422', border:'#ff2200', nameEmoji:'👿' };
    this.bodyColor   = col.body;
    this.borderColor = col.border;
    this.nameEmoji   = col.nameEmoji;
  }

  _calcStats() {
    const lv = this.level;
    const cfg = this.monsterConfig;
    // 若 monsterConfig 有具体数值，优先使用；否则用通用公式
    this.maxHp       = (cfg && cfg.hp  !== undefined) ? cfg.hp  : Math.floor(lv * 25 + 175);
    this.atk         = (cfg && cfg.atk !== undefined) ? cfg.atk : Math.floor(lv * 5 + 5);
    this.armor       = (cfg && cfg.armor !== undefined) ? cfg.armor : Math.floor(lv * 1.5);
    this.speed       = 220 + lv * 0.3;
    this.atkRange    = 150;
    this.atkInterval = 1000;
    this.dmgReduce   = 0;
    this.expReward   = lv * lv;        // BOSS经验 = level^2
    this.goldReward  = Math.floor(Utils.randInt(10 + lv * 2, 30 + lv * 4) * 0.5); // 直接奖励减少50%
  }

  /* ── 初始化冲刺技能（在 name 确定后由 game.js 调用）── */
  _initDashSkill() {
    const DASH_BOSSES = ['狼王', '勇敢牛牛'];
    if (!DASH_BOSSES.includes(this.name)) {
      this._dashSkill = null;
      return;
    }
    this._dashSkill = {
      phase:          'idle',   // 'idle' | 'charge' | 'dashing'
      cd:             5000,     // 首次进战后5s触发（后续20s CD），用ms计
      chargeTimer:    0,        // 蓄力剩余时间（ms）
      dir:            { x: 0, y: 1 },  // 冲刺方向（蓄力开始时锁定）
      traveled:       0,        // 本次已冲刺距离（px）
      hit:            false,    // 本次冲刺是否已打到玩家（每次只打一次）
      firstAggro:     false,    // 是否已进入过战斗
    };
  }

  takeDamage(dmg, source) {
    if (this.dead) return;
    if (Utils.chance(0.03)) { this._spawnFloat('MISS', '#aaffaa'); return; }
    const fd = Utils.calcDamage(dmg, this.armor, 0, this.dmgReduce);
    this.hp = Math.max(0, this.hp - fd);
    this._spawnFloat(`-${fd}`, '#ff6666');
    this.effects.push({ x:this.x, y:this.y, r:25, life:250, maxLife:250, color:'rgba(255,100,100,0.6)' });
    if (source) this.aggro = source;
    if (this.hp <= 0) this._onDead(source && source.game);
  }

  _spawnFloat(text, color) {
    this.dmgFloats.push({
      x:this.x, y:this.y - this.radius - 10, text, color,
      life:1000, maxLife:1000,
      vx:Utils.randFloat(-12,12), vy:Utils.randFloat(-50,-80),
    });
  }

  _onDead(game) {
    this.dead = true;
    this.respawnTimer = C.BOSS_RESPAWN;
    // 通知任务系统
    if (game && game.quest) game.quest.onEnemyKilled(this.name);
    // 击杀浪里马 → 解锁商人
    if (this.name === '浪里马' && game && game.merchant && !game.merchant.unlocked) {
      game.merchant.unlocked = true;
      if (game.ui) game.ui.showSkillToast('🛒 行脚商人出现了！前往主城找到他！');
    }
  }

  update(dt, player, tangSeng, game) {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dead = false;
        this._calcStats();
        this.hp = this.maxHp;
        this.x = this._origX;
        this.y = this._origY;
        this._returning = false;
      }
      return;
    }

    const distToOrig   = Utils.dist(this, { x:this._origX, y:this._origY });
    const distToPlayer = Utils.dist(this, player);
    const aggroRange   = 280 + this.level * 2;

    // ── Leash 逻辑 ──
    if (distToOrig > this._leashRange) {
      this._returning = true;
      this.aggro = null;
    }
    if (this._returning) {
      const dx = this._origX - this.x;
      const dy = this._origY - this.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 30) {
        this._returning = false;
      } else {
        const n = Utils.normalize(dx, dy);
        this.x += n.x * this.speed * 1.5 * dt / 1000;
        this.y += n.y * this.speed * 1.5 * dt / 1000;
      }
    } else {
      // 仇恨检测：只有玩家进入aggro范围才开始追击
      if (!player.dead && distToPlayer < aggroRange) {
        this.aggro = player;
      } else if (this.aggro === player && distToPlayer > aggroRange * 1.5) {
        this.aggro = null;
      }

      if (this.aggro && !this.aggro.dead) {
        // 冲刺技能蓄力/冲刺阶段禁止普通追击移动
        const _dashActive = this._dashSkill && (this._dashSkill.phase === 'charge' || this._dashSkill.phase === 'dashing');
        // 追击玩家（分轴山脉碰撞）
        const dx = this.aggro.x - this.x;
        const dy = this.aggro.y - this.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (!_dashActive && d > this.atkRange * 0.8) {
          const n = Utils.normalize(dx, dy);
          const nx = this.x + n.x * this.speed * dt / 1000;
          const ny = this.y + n.y * this.speed * dt / 1000;
          if (!C.isInMountain(nx, this.y, this.radius)) this.x = nx;
          if (!C.isInMountain(this.x, ny, this.radius)) this.y = ny;
          this._moveDir = n;
        }
      } else {
        // 待机：原地微抖动（无漫游），静止时每秒回复最大血量的10%
        this._idleTime = (this._idleTime || 0) + dt;
        const jitter = 0.5;
        this.x = this._origX + Math.sin(this._idleTime * 0.003) * jitter;
        this.y = this._origY + Math.cos(this._idleTime * 0.004) * jitter;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.10 * (dt / 1000));
      }
    }

    // 区域边界约束
    const zone = C.getZoneRect(
      C.getZoneById(this.zoneId).col,
      C.getZoneById(this.zoneId).row
    );
    this.x = Utils.clamp(this.x, zone.x + 40, zone.x + zone.w - 40);
    this.y = Utils.clamp(this.y, zone.y + 40, zone.y + zone.h - 40);

    // 攻击位移动画更新
    if (this._lunge) {
      this._lunge.timer += dt;
      const p = Math.min(this._lunge.timer / this._lunge.dur, 1);
      if (p >= 1) this._lunge = null;
    }

    // 攻击
    this._atkTimer -= dt;
    if (this._atkTimer <= 0) {
      this._atkTimer = this.atkInterval;
      this._tryAttack(player, tangSeng, game);
    }

    // ── 冲刺技能 AI（狼王、勇敢牛牛专属）──
    this._updateDash(dt, player, game);

    this.effects   = this.effects.filter(e => { e.life -= dt; return e.life > 0; });
    this.dmgFloats = this.dmgFloats.filter(f => {
      f.life -= dt; f.x += f.vx*(dt/1000); f.y += f.vy*(dt/1000); f.vy += 60*(dt/1000); return f.life > 0;
    });
  }

  /* ── 冲刺技能警告绘制（screen坐标）── */
  _drawDashWarning(ctx, sx, sy) {
    const sk = this._dashSkill;
    if (!sk || sk.phase === 'idle') return;

    ctx.save();

    if (sk.phase === 'charge') {
      // 蓄力阶段：橙色脉冲圆环 + 倒计时文字
      const progress = 1 - (sk.chargeTimer / 2000); // 0→1
      const pulseR   = this.radius + 18 + Math.sin(Date.now() * 0.01) * 6;

      // 外发光橙色脉冲圈
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 140, 0, ${0.5 + 0.5 * progress})`;
      ctx.lineWidth   = 4 + progress * 4;
      ctx.stroke();

      // 进度弧（橙→红）
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = `rgba(255, 60, 0, 0.9)`;
      ctx.lineWidth   = 5;
      ctx.stroke();

      // 冲刺方向预告路径（200px，红色半透明矩形）
      const DASH_TOTAL  = 200;
      const pathW       = this.radius * 1.6;
      const angle       = Math.atan2(sk.dir.y, sk.dir.x);

      ctx.translate(sx, sy);
      ctx.rotate(angle);

      // 路径矩形
      ctx.globalAlpha = 0.25 + 0.15 * progress;
      ctx.fillStyle   = '#ff3300';
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(0, -pathW / 2, DASH_TOTAL, pathW, 4)
        : ctx.rect(0, -pathW / 2, DASH_TOTAL, pathW);
      ctx.fill();

      // 路径边框
      ctx.globalAlpha = 0.55 + 0.15 * progress;
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth   = 2;
      ctx.stroke();

      // 箭头（终点）
      ctx.globalAlpha = 0.75;
      ctx.fillStyle   = '#ff3300';
      ctx.beginPath();
      ctx.moveTo(DASH_TOTAL + 18,    0);
      ctx.lineTo(DASH_TOTAL,         -pathW * 0.7);
      ctx.lineTo(DASH_TOTAL,          pathW * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.rotate(-angle);
      ctx.translate(-sx, -sy);

      // 蓄力文字（Boss正上方）
      ctx.globalAlpha = 1;
      ctx.font        = 'bold 14px Microsoft YaHei';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'bottom';
      const chargeLabel = `⚠️ 蓄力！${Math.ceil(sk.chargeTimer / 1000)}s`;
      const lw = ctx.measureText(chargeLabel).width + 14;
      const lh = 20;
      const lx = sx - lw / 2;
      const ly = sy - this.radius - 30;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(lx, ly - lh, lw, lh);
      ctx.fillStyle = '#ffaa00';
      ctx.fillText(chargeLabel, sx, ly);

    } else if (sk.phase === 'dashing') {
      // 冲刺阶段：红色残影路径（已走过的部分）
      const angle = Math.atan2(sk.dir.y, sk.dir.x);
      const pathW = this.radius * 1.8;

      ctx.translate(sx, sy);
      ctx.rotate(angle);

      ctx.globalAlpha = 0.35;
      ctx.fillStyle   = '#ff2200';
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(-sk.traveled, -pathW / 2, sk.traveled, pathW, 4)
        : ctx.rect(-sk.traveled, -pathW / 2, sk.traveled, pathW);
      ctx.fill();

      ctx.rotate(-angle);
      ctx.translate(-sx, -sy);
    }

    ctx.restore();
  }

  /* ── 冲刺技能逻辑（狼王、勇敢牛牛）── */
  _updateDash(dt, player, game) {
    const sk = this._dashSkill;
    if (!sk) return;

    // 冲刺期间禁止普通移动（在 update 里的追击移动之前已执行完），
    // 此处只处理冲刺阶段的强制位移和碰撞检测
    if (sk.phase === 'dashing') {
      const DASH_SPEED = 900; // px/s，远超普通速度
      const DASH_TOTAL = 200; // px
      const step = DASH_SPEED * dt / 1000;
      const remain = DASH_TOTAL - sk.traveled;
      const move = Math.min(step, remain);

      this.x += sk.dir.x * move;
      this.y += sk.dir.y * move;
      sk.traveled += move;

      // 碰撞检测：与玩家距离小于合并半径时造成300%伤害（每次冲刺只打一次）
      if (!sk.hit && !player.dead) {
        const hitDist = this.radius + (player.baseAtkRange || 30);
        if (Utils.dist(this, player) <= hitDist) {
          sk.hit = true;
          player.takeDamage(Math.floor(this.atk * 3), this);
          // 击退效果
          const kbDist = 60;
          const kbN = Utils.normalize(player.x - this.x, player.y - this.y);
          player.x += kbN.x * kbDist;
          player.y += kbN.y * kbDist;
          this.effects.push({ x:this.x, y:this.y, r:40, life:300, maxLife:300, color:'rgba(255,80,0,0.7)' });
          if (game && game.ui) game.ui.showSkillToast('💥 冲刺重击！');
        }
      }

      // 冲刺完成
      if (sk.traveled >= DASH_TOTAL) {
        sk.phase    = 'idle';
        sk.cd       = 20000; // 20s CD
        sk.traveled = 0;
        sk.hit      = false;
      }
      return; // 冲刺中不执行CD计时
    }

    // 蓄力阶段：倒计时2s，期间不移动
    if (sk.phase === 'charge') {
      sk.chargeTimer -= dt;
      if (sk.chargeTimer <= 0) {
        // 蓄力结束，切换到冲刺
        sk.phase    = 'dashing';
        sk.traveled = 0;
        sk.hit      = false;
        this.effects.push({ x:this.x, y:this.y, r:50, life:400, maxLife:400, color:'rgba(255,120,0,0.5)' });
      }
      return; // 蓄力中不执行CD计时
    }

    // idle 阶段：CD倒计时
    if (!this.aggro || this.aggro.dead) return; // 没有仇恨时不计时

    // 首次进战记录
    if (!sk.firstAggro) {
      sk.firstAggro = true;
      sk.cd = 5000; // 首次进战5s后释放
    }

    sk.cd -= dt;
    if (sk.cd <= 0) {
      // 开始蓄力：锁定朝向玩家的方向
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      sk.dir         = Utils.normalize(dx, dy);
      sk.phase       = 'charge';
      sk.chargeTimer = 2000; // 蓄力2s
    }
  }

  _tryAttack(player, tangSeng, game) {
    if (!player.dead && Utils.dist(this, player) <= this.atkRange + player.baseAtkRange * 0.5) {
      player.takeDamage(this.atk, this);
      this.effects.push({ x:this.x, y:this.y, r:30, life:200, maxLife:200, color:'rgba(255,50,50,0.5)' });
      // 触发冲刺动画
      const dx = player.x - this.x, dy = player.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this._lunge = { nx: dx/len, ny: dy/len, dist: 30, dur: 300, timer: 0 };
    }
  }

  draw(ctx, camera) {
    if (!camera.inView(this.x, this.y, 100)) return;
    if (this.dead) {
      const { sx, sy } = camera.worldToScreen(this.x, this.y);
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.font = '12px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8888';
      ctx.fillText(`${Math.ceil(this.respawnTimer/1000)}s后复活`, sx, sy);
      ctx.restore();
      return;
    }

    // 冲刺位移：前半段冲出，后半段退回
    let lox = 0, loy = 0;
    if (this._lunge) {
      const p = this._lunge.timer / this._lunge.dur;
      const offset = p < 0.5 ? p * 2 : (1 - p) * 2;
      lox = this._lunge.nx * this._lunge.dist * offset;
      loy = this._lunge.ny * this._lunge.dist * offset;
    }
    const { sx: _sx, sy: _sy } = camera.worldToScreen(this.x, this.y);
    const sx = _sx + lox, sy = _sy + loy;

    // 特效圈
    this.effects.forEach(e => {
      ctx.save();
      ctx.globalAlpha = (e.life/e.maxLife)*0.7;
      ctx.beginPath(); ctx.arc(sx, sy, e.r, 0, Math.PI*2);
      ctx.fillStyle = e.color; ctx.fill();
      ctx.restore();
    });

    // ── 冲刺技能警告绘制 ──
    this._drawDashWarning(ctx, sx, sy);

    // ── 根据名字选择 Sprite ──
    const isWolf    = this.name.includes('狼');
    const isBear    = this.name.includes('熊');
    const isOx      = this.name.includes('牛牛') || this.name === '勇敢牛牛';
    const isHorse   = this.name.includes('浪里马') || (this.name.includes('马') && !this.name.includes('牛马'));
    const isOxHorse = this.name.includes('牛马');
    const isDragon  = this.zoneId === 'dragon';
    if (isWolf) {
      drawWolfSprite(ctx, sx, sy, this.radius, true);
    } else if (isBear) {
      drawBearSprite(ctx, sx, sy, this.radius, true);
    } else if (isOx) {
      drawOxSprite(ctx, sx, sy, this.radius, true);
    } else if (isHorse) {
      drawHorseSprite(ctx, sx, sy, this.radius, true);
    } else if (isOxHorse) {
      drawOxHorseSprite(ctx, sx, sy, this.radius, true);
    } else if (isDragon && this.name === '虾兵蟹将') {
      drawTurtlePrimeMinisterSprite(ctx, sx, sy, this.radius, true);
    } else if (isDragon) {
      drawDragonKingSprite(ctx, sx, sy, this.radius, true);
    } else if (this.name === '托塔天王') {
      drawLiTianwangSprite(ctx, sx, sy, this.radius, true);
    } else if (this.name.includes('哪吒')) {
      drawNezhaSprite(ctx, sx, sy, this.radius, true);
    } else if (this.name.includes('卷帘')) {
      drawJuanLianSprite(ctx, sx, sy, this.radius, true);
    } else if (this.name.includes('天蓬')) {
      drawTianpengSprite(ctx, sx, sy, this.radius, true);
    } else if (this.name.includes('二郎神')) {
      drawErLangSprite(ctx, sx, sy, this.radius, true);
    } else {
      // 默认样式：影子 + 外发光 + 主体圆 + emoji
      ctx.save();
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(sx, sy+this.radius-4, this.radius*0.85, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      const t = Date.now();
      const pulse = Math.sin(t/400)*3;
      const grd = ctx.createRadialGradient(sx, sy, this.radius*0.3, sx, sy, this.radius+pulse+8);
      grd.addColorStop(0, this.bodyColor);
      grd.addColorStop(0.7, this.borderColor);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(sx, sy, this.radius+pulse+8, 0, Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
      ctx.fillStyle = this.bodyColor; ctx.fill();
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = 3 + Math.sin(t/300);
      ctx.stroke();
      ctx.font = `${this.radius*0.9}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.nameEmoji, sx, sy);
    }

    // ── 血条 ──
    const bw = 60, bh = 7;
    const bx = sx - bw/2;
    const hasTallSprite = isWolf || isBear || isOx || isHorse || isOxHorse || isDragon;
    const by = sy - this.radius * (hasTallSprite ? 2.15 : 1) - 12;
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = ratio>0.5?'#e74c3c':ratio>0.25?'#ff8800':'#ff0000';
    ctx.fillRect(bx, by, bw*ratio, bh);
    ctx.strokeStyle = '#800'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);

    // ── 名字标签（在血条上方）──
    drawNameLabel(ctx, sx, by, `${this.nameEmoji}${this.name}`, this.level, by, this.borderColor);

    // 伤害浮字
    this.dmgFloats.forEach(f => {
      const { sx:fx, sy:fy } = camera.worldToScreen(f.x, f.y);
      ctx.save();
      ctx.globalAlpha = f.life/f.maxLife;
      ctx.font = 'bold 15px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(f.text, fx, fy);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fx, fy);
      ctx.restore();
    });
  }
}

// ── 波次表（来自波次表.xlsx，共20波）──
const WAVE_DATA = [
  { count:10, level: 5,  atk:    10, armor:  0, hp:    40 }, // 波次 1
  { count:10, level:10,  atk:    20, armor:  0, hp:   100 }, // 波次 2
  { count:10, level:15,  atk:    40, armor:  0, hp:   200 }, // 波次 3
  { count:10, level:20,  atk:    80, armor:  0, hp:   400 }, // 波次 4
  { count:10, level:25,  atk:   160, armor:  0, hp:   800 }, // 波次 5
  { count:10, level:30,  atk:   240, armor:  0, hp:  1600 }, // 波次 6
  { count:10, level:35,  atk:   360, armor:  0, hp:  2400 }, // 波次 7
  { count:10, level:40,  atk:   540, armor:  0, hp:  3600 }, // 波次 8
  { count:10, level:45,  atk:   810, armor:  0, hp:  4680 }, // 波次 9
  { count:10, level:50,  atk:  1215, armor:  0, hp:  6084 }, // 波次10
  { count:10, level:55,  atk:  1458, armor:  0, hp:  7909 }, // 波次11
  { count:10, level:60,  atk:  1750, armor:  0, hp: 10282 }, // 波次12
  { count:10, level:65,  atk:  2100, armor:  0, hp: 13367 }, // 波次13
  { count:10, level:70,  atk:  2519, armor:  0, hp: 17377 }, // 波次14
  { count:10, level:75,  atk:  3023, armor:  0, hp: 22589 }, // 波次15
  { count:10, level:80,  atk:  3628, armor:  0, hp: 29366 }, // 波次16
  { count:10, level:85,  atk:  4354, armor:  0, hp: 38176 }, // 波次17
  { count:10, level:90,  atk:  5224, armor:  0, hp: 49629 }, // 波次18
  { count:10, level:95,  atk:  6269, armor:  0, hp: 64518 }, // 波次19
  { count:10, level:100, atk:  7523, armor:  0, hp: 83873 }, // 波次20
];

// ============================================================
//   波次入侵敌人 WaveEnemy
// ============================================================
class WaveEnemy {
  constructor(x, y, wave, idx) {
    this.x = x;
    this.y = y;
    // 查表：wave从1开始，对应WAVE_DATA[wave-1]
    const wd = WAVE_DATA[Math.min(wave, WAVE_DATA.length) - 1] || WAVE_DATA[WAVE_DATA.length - 1];
    this.level   = wd.level;
    this.maxHp   = wd.hp;
    this.hp      = this.maxHp;
    this.atk     = wd.atk;
    this.armor   = wd.armor;
    this.speed   = 230 + wave * 2;
    this.atkRange   = 120;
    this.atkInterval = 1000;
    this.dmgReduce   = 0;
    this.dead = false;
    this.radius = 14;
    this._atkTimer = 0;
    this.effects = [];
    this.dmgFloats = [];
    this.wave = wave;

    // 名字按波次顺序从 WAVE_ENEMY_NAMES 取（循环）
    this.name = WAVE_ENEMY_NAMES[(wave - 1) % WAVE_ENEMY_NAMES.length];

    const mainZone = C.getZoneRect(1, 2);
    this._targetX = mainZone.x + mainZone.w/2 - 60;
    this._targetY = mainZone.y + mainZone.h/2 + 40;
  }

  get alive() { return !this.dead; }

  takeDamage(dmg, source) {
    if (this.dead) return;
    const fd = Utils.calcDamage(dmg, this.armor, 0, this.dmgReduce);
    this.hp = Math.max(0, this.hp - fd);
    this.dmgFloats.push({
      x:this.x, y:this.y-20, text:`-${fd}`, color:'#ffcccc',
      life:800, maxLife:800,
      vx:Utils.randFloat(-10,10), vy:-60,
    });
    if (this.hp <= 0) {
      this.dead = true;
      // 通知任务系统
      if (source && source.game && source.game.quest) {
        source.game.quest.onEnemyKilled(this.name);
      }
      // 发放经验 = lv²
      if (source && source.game && source.game.player && !source.game.player.dead) {
        const expGain = this.level * this.level;
        source.game.player.addExp(expGain);
      }
    }
  }

  update(dt, player, tangSeng, game) {
    if (this.dead) return;

    // ── AI：优先追击悟空，悟空死亡或超出感知范围则转追唐僧 ──
    const AGGRO_RANGE = 800; // 感知悟空的最大距离
    const distToPlayer = Utils.dist(this, player);
    const chasePlayer  = !player.dead && distToPlayer <= AGGRO_RANGE;

    let tx, ty;
    if (chasePlayer) {
      // 追悟空
      tx = player.x;
      ty = player.y;
    } else if (tangSeng.alive) {
      // 追唐僧
      tx = tangSeng.x;
      ty = tangSeng.y;
    } else {
      // 默认目标（主城中心）
      tx = this._targetX;
      ty = this._targetY;
    }

    const dx = tx - this.x, dy = ty - this.y;
    const d  = Math.sqrt(dx*dx + dy*dy);
    if (d > this.atkRange) {
      const n = Utils.normalize(dx, dy);
      this.x += n.x * this.speed * dt / 1000;
      this.y += n.y * this.speed * dt / 1000;
    }
    // 攻击位移动画更新
    if (this._lunge) {
      this._lunge.timer += dt;
      if (this._lunge.timer >= this._lunge.dur) this._lunge = null;
    }

    this._atkTimer -= dt;
    if (this._atkTimer <= 0) {
      this._atkTimer = this.atkInterval;
      let hitTarget = null;
      if (!player.dead && Utils.dist(this, player) <= this.atkRange + 20) {
      player.takeDamage(this.atk, this);
      hitTarget = player;
    } else if (tangSeng.alive && Utils.dist(this, tangSeng) <= this.atkRange + 20) {
      tangSeng.takeDamage(this.atk, 0, game);
      hitTarget = tangSeng;
    }
    if (hitTarget) {
      const dx = hitTarget.x - this.x, dy = hitTarget.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this._lunge = { nx: dx/len, ny: dy/len, dist: 22, dur: 300, timer: 0 };
    }
  }
  this.effects   = this.effects.filter(e => { e.life -= dt; return e.life > 0; });
  this.dmgFloats = this.dmgFloats.filter(f => {
    f.life -= dt; f.x += f.vx*(dt/1000); f.y += f.vy*(dt/1000); f.vy += 80*(dt/1000); return f.life > 0;
  });
}

draw(ctx, camera) {
  if (this.dead || !camera.inView(this.x, this.y, 80)) return;
    // 冲刺位移
    let lox = 0, loy = 0;
    if (this._lunge) {
      const p = this._lunge.timer / this._lunge.dur;
      const offset = p < 0.5 ? p * 2 : (1 - p) * 2;
      lox = this._lunge.nx * this._lunge.dist * offset;
      loy = this._lunge.ny * this._lunge.dist * offset;
    }
    const { sx: _sx2, sy: _sy2 } = camera.worldToScreen(this.x, this.y);
    const sx = _sx2 + lox, sy = _sy2 + loy;

    // ── 幽灵 Sprite ──
    drawWaveEnemySprite(ctx, sx, sy, this.radius, this.wave);

    // ── 血条 ──
    const bw = 36, bh = 4;
    const bx = sx - bw/2;
    const by = sy - this.radius * 1.9 - 10;
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#400'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#f44'; ctx.fillRect(bx, by, bw*ratio, bh);
    ctx.strokeStyle = '#600'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);

    // ── 名字标签（在血条上方）──
    drawNameLabel(ctx, sx, by, this.name, this.level, by, `hsl(${(this.wave*15)%360},90%,55%)`);

    // 浮字
    this.dmgFloats.forEach(f => {
      const { sx:fx, sy:fy } = camera.worldToScreen(f.x, f.y);
      ctx.save();
      ctx.globalAlpha = f.life/f.maxLife;
      ctx.font = 'bold 13px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeText(f.text, fx, fy);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fx, fy);
      ctx.restore();
    });
  }
}

// ============================================================
//   小怪 MiniEnemy（固定出生点、30秒复活、leash）
// ============================================================
class MiniEnemy {
  constructor(x, y, level, zoneId) {
    this.x = x;
    this.y = y;
    this._origX = x;
    this._origY = y;
    this.zoneId = zoneId;
    this.level  = level;
    this.radius = 13;

    // 随机名字
    const namePool = MINI_ENEMY_NAMES[zoneId] || ['小妖'];
    this.name = Utils.randChoice(namePool);

    this._calcStats();
    this.hp   = this.maxHp;
    this.dead = false;
    this.respawnTimer = 0;
    this._rewarded    = false;

    // AI
    this._atkTimer   = 0;
    this._moveTimer  = 0;
    this._roamTarget = { x, y };
    this.aggro       = null;
    this._leashRange = 350; // 最大追击距离
    this._returning  = false;

    this.effects   = [];
    this.dmgFloats = [];

    const col = MINI_COLORS[zoneId] || { body:'#884422', border:'#bb6633' };
    this.bodyColor   = col.body;
    this.borderColor = col.border;
  }

  _calcStats() {
    const lv = this.level;
    // 根据怪物表锚点推导的线性公式：
    //   lv=3→HP≈30,ATK≈4; lv=6→HP≈40,ATK≈10; lv=13→HP≈100,ATK≈20
    const cfg = this.monsterConfig;
    // 若 monsterConfig 有具体数值，优先使用；否则用通用公式
    this.maxHp       = (cfg && cfg.hp  !== undefined) ? cfg.hp  : Math.floor(lv * 7 + 10);
    this.atk         = (cfg && cfg.atk !== undefined) ? cfg.atk : Math.floor(lv * 1.4);
    this.armor       = (cfg && cfg.armor !== undefined) ? cfg.armor : Math.floor(lv * 0.5);
    this.speed       = 230 + lv * 0.2;
    this.atkRange    = 120;
    this.atkInterval = 1000;
    this.dmgReduce   = 0;
    this.expReward   = lv * lv;        // 小怪经验 = level^2
    this.goldReward  = Math.floor(Utils.randInt(2 + lv, 6 + lv * 2) * 0.5); // 直接奖励减少50%
  }

  get alive() { return !this.dead; }

  takeDamage(dmg, source) {
    if (this.dead) return;
    if (Utils.chance(0.02)) { this._spawnFloat('MISS', '#aaffaa'); return; }
    const fd = Utils.calcDamage(dmg, this.armor, 0, this.dmgReduce);
    this.hp  = Math.max(0, this.hp - fd);
    this._spawnFloat(`-${fd}`, '#ff9999');
    this.effects.push({ x:this.x, y:this.y, r:18, life:200, maxLife:200, color:'rgba(255,100,100,0.5)' });
    if (source) this.aggro = source;
    if (this.hp <= 0) this._onDead(source && source.game);
  }

  _spawnFloat(text, color) {
    this.dmgFloats.push({
      x:this.x, y:this.y - this.radius - 8, text, color,
      life:800, maxLife:800,
      vx:Utils.randFloat(-10,10), vy:Utils.randFloat(-40,-65),
    });
  }

  _onDead(game) {
    this.dead = true;
    this.respawnTimer = C.MINIENEMY_RESPAWN; // 30秒复活
    // 通知任务系统
    if (game && game.quest) game.quest.onEnemyKilled(this.name);
  }

  update(dt, player, tangSeng, game) {
    // 复活计时
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dead      = false;
        this._rewarded = false;
        this._calcStats();
        this.hp = this.maxHp;
        this.x  = this._origX;
        this.y  = this._origY;
        this._returning = false;
      }
      return;
    }

    const distToOrig   = Utils.dist(this, { x:this._origX, y:this._origY });
    const distToPlayer = Utils.dist(this, player);
    const aggroRange   = 200;

    // ── Leash 逻辑 ──
    if (distToOrig > this._leashRange) {
      this._returning = true;
      this.aggro = null;
    }
    if (this._returning) {
      const dx = this._origX - this.x;
      const dy = this._origY - this.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 20) {
        this._returning = false;
      } else {
        const n = Utils.normalize(dx, dy);
        this.x += n.x * this.speed * 1.2 * dt / 1000;
        this.y += n.y * this.speed * 1.2 * dt / 1000;
      }
    } else {
      // 仇恨检测：仅当玩家进入aggro范围才追击
      if (!player.dead && distToPlayer < aggroRange) {
        this.aggro = player;
      } else if (this.aggro && distToPlayer > aggroRange * 1.6) {
        this.aggro = null;
      }

      if (this.aggro && !this.aggro.dead) {
        // 追击（分轴山脉碰撞）
        const dx = this.aggro.x - this.x;
        const dy = this.aggro.y - this.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d > this.atkRange * 0.9) {
          const n = Utils.normalize(dx, dy);
          const nx = this.x + n.x * this.speed * dt / 1000;
          const ny = this.y + n.y * this.speed * dt / 1000;
          if (!C.isInMountain(nx, this.y, this.radius)) this.x = nx;
          if (!C.isInMountain(this.x, ny, this.radius)) this.y = ny;
        }
      } else {
        // 待机：原地微抖动，静止时每秒回复最大血量的10%
        this._idleTime = (this._idleTime || 0) + dt;
        const jitter = 0.3;
        this.x = this._origX + Math.sin(this._idleTime * 0.004 + this._origX) * jitter;
        this.y = this._origY + Math.cos(this._idleTime * 0.005 + this._origY) * jitter;
        this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.10 * (dt / 1000));
      }
    }

    // 区域边界约束
    const zoneData = C.getZoneById(this.zoneId);
    if (zoneData) {
      const zone = C.getZoneRect(zoneData.col, zoneData.row);
      this.x = Utils.clamp(this.x, zone.x + 30, zone.x + zone.w - 30);
      this.y = Utils.clamp(this.y, zone.y + 30, zone.y + zone.h - 30);
    }

    // 攻击位移动画更新
    if (this._lunge) {
      this._lunge.timer += dt;
      if (this._lunge.timer >= this._lunge.dur) this._lunge = null;
    }

    // 攻击
    this._atkTimer -= dt;
    if (this._atkTimer <= 0) {
      this._atkTimer = this.atkInterval;
      if (this.aggro && !this.aggro.dead && Utils.dist(this, this.aggro) <= this.atkRange + 20) {
        this.aggro.takeDamage(this.atk);
        this.effects.push({ x:this.x, y:this.y, r:20, life:180, maxLife:180, color:'rgba(255,80,80,0.4)' });
        const dx = this.aggro.x - this.x, dy = this.aggro.y - this.y;
        const len = Math.hypot(dx, dy) || 1;
        this._lunge = { nx: dx/len, ny: dy/len, dist: 18, dur: 280, timer: 0 };
      }
    }

    this.effects   = this.effects.filter(e => { e.life -= dt; return e.life > 0; });
    this.dmgFloats = this.dmgFloats.filter(f => {
      f.life -= dt; f.x += f.vx*(dt/1000); f.y += f.vy*(dt/1000); f.vy += 70*(dt/1000); return f.life > 0;
    });
  }

  draw(ctx, camera) {
    if (!camera.inView(this.x, this.y, 80)) return;

    if (this.dead) {
      // 复活倒计时
      const { sx, sy } = camera.worldToScreen(this.x, this.y);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.font = '11px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaffaa';
      ctx.fillText(`${Math.ceil(this.respawnTimer/1000)}s`, sx, sy);
      ctx.restore();
      return;
    }

    // 冲刺位移
    let lox3 = 0, loy3 = 0;
    if (this._lunge) {
      const p = this._lunge.timer / this._lunge.dur;
      const offset = p < 0.5 ? p * 2 : (1 - p) * 2;
      lox3 = this._lunge.nx * this._lunge.dist * offset;
      loy3 = this._lunge.ny * this._lunge.dist * offset;
    }
    const { sx: _sx3, sy: _sy3 } = camera.worldToScreen(this.x, this.y);
    const sx = _sx3 + lox3, sy = _sy3 + loy3;

    // 特效
    this.effects.forEach(e => {
      ctx.save();
      ctx.globalAlpha = (e.life/e.maxLife)*0.6;
      ctx.beginPath(); ctx.arc(sx, sy, e.r, 0, Math.PI*2);
      ctx.fillStyle = e.color; ctx.fill();
      ctx.restore();
    });

    // ── 根据名字/区域选择 Sprite ──
    const isWolf    = this.name.includes('狼');
    const isBear    = this.name.includes('熊');
    const isOxHorse = this.name.includes('牛马');
    const isOx      = !isOxHorse && this.name.includes('牛');
    const isHorse   = !isOxHorse && this.name.includes('马');
    // 龙宫小怪分类
    const isShrimp  = this.zoneId === 'dragon' && (this.name.includes('虾'));
    const isCrab    = this.zoneId === 'dragon' && (this.name.includes('蟹'));
    const isFish    = this.zoneId === 'dragon' && !isShrimp && !isCrab;
    if (isWolf) {
      drawWolfSprite(ctx, sx, sy, this.radius, false);
    } else if (isBear) {
      drawBearSprite(ctx, sx, sy, this.radius, false);
    } else if (isOxHorse) {
      drawOxHorseSprite(ctx, sx, sy, this.radius, false);
    } else if (isOx) {
      drawOxSprite(ctx, sx, sy, this.radius, false);
    } else if (isHorse) {
      drawHorseSprite(ctx, sx, sy, this.radius, false);
    } else if (isShrimp) {
      drawShrimpSoldierSprite(ctx, sx, sy, this.radius);
    } else if (isCrab) {
      drawCrabGeneralSprite(ctx, sx, sy, this.radius);
    } else if (isFish) {
      drawFishDemonSprite(ctx, sx, sy, this.radius);
    } else if (this.zoneId === 'heaven') {
      drawHeavenSoldierSprite(ctx, sx, sy, this.radius);
    } else {
      // 默认：影子 + 圆形 + 眼睛
      ctx.save();
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(sx, sy+this.radius-2, this.radius*0.75, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.beginPath(); ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
      ctx.fillStyle = this.bodyColor; ctx.fill();
      ctx.strokeStyle = this.borderColor; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(sx-4, sy-3, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+4, sy-3, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#220000';
      ctx.beginPath(); ctx.arc(sx-4, sy-3, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx+4, sy-3, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx-7, sy-6); ctx.lineTo(sx-2, sy-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx+7, sy-6); ctx.lineTo(sx+2, sy-5); ctx.stroke();
    }

    // ── 血条 ──
    const bw = 32, bh = 4;
    const bx = sx - bw/2;
    const hasTallSprite = isWolf || isBear || isOx || isHorse || isOxHorse || isShrimp || isCrab || isFish;
    const by = sy - this.radius * (hasTallSprite ? 1.95 : 1) - 10;
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#300'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = ratio > 0.5 ? '#e74' : ratio > 0.25 ? '#f80' : '#f00';
    ctx.fillRect(bx, by, bw*ratio, bh);
    ctx.strokeStyle = '#500'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);

    // ── 名字标签（在血条上方）──
    drawNameLabel(ctx, sx, by, this.name, this.level, by, this.borderColor);

    // 浮字
    this.dmgFloats.forEach(f => {
      const { sx:fx, sy:fy } = camera.worldToScreen(f.x, f.y);
      ctx.save();
      ctx.globalAlpha = f.life/f.maxLife;
      ctx.font = 'bold 12px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeText(f.text, fx, fy);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fx, fy);
      ctx.restore();
    });
  }
}