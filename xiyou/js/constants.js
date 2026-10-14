// ===== 游戏常量 =====
const C = {
  // 世界尺寸
  WORLD_W: 10000,
  WORLD_H: 10000,

  // 九宫格区域定义 (x, y, w, h) 均为世界坐标
  // 每格约3333x3333
  CELL: 3333,

  // 泽民屏障宽度（区域间不可通行）
  WEAK_WATER_W: 300,

  // 区域ID
  ZONE: {
    MAIN_CITY:   'main_city',
    WAVE_ZONE:   'wave_zone',
    HUMAN:       'human',
    HEAVEN:      'heaven',
    DRAGON:      'dragon',
    DEMON:       'demon',
    DIVINE:      'divine',
    ICE:         'ice',
    BUDDHA:      'buddha_land',
  },

  // 各区域配置（新增 monsterMinLv/monsterMaxLv 数值）
  // 区域格子坐标速查（col*3333, row*3333，每格3333x3333）
  // 冰山 col:0,row:0 → x:0~3333,   y:0~3333
  // 神域 col:1,row:0 → x:3333~6666, y:0~3333
  // 佛教 col:2,row:0 → x:6666~10000,y:0~3333
  // 龙宫 col:0,row:1 → x:0~3333,   y:3333~6666
  // 天庭 col:1,row:1 → x:3333~6666, y:3333~6666
  // 妖魔 col:2,row:1 → x:6666~10000,y:3333~6666
  // 波次 col:0,row:2 → x:0~3333,   y:6666~10000
  // 主城 col:1,row:2 → x:3333~6666, y:6666~10000
  // 人间 col:2,row:2 → x:6666~10000,y:6666~10000
  ZONES: [
    { id:'ice',         col:0, row:0, name:'冰山',     bg:'#b8deff', border:'#5599dd', bossMin:55, bossMax:70,  monsterMinLv:50, monsterMaxLv:70,  hasBoss:true,  emoji:'❄️', textColor:'#003366',
      monsters: [
        { name:'冰狼',     type:'mini', level:50, spawnX:1263,  spawnY:2576,  atk:900,   hp:4000,  armor:50,  drops:['冰靴','金币'] },
        { name:'霜熊',     type:'mini', level:58, spawnX: 556,  spawnY:2273,  atk:1200,  hp:6000,  armor:50,  drops:['冰甲','金币'] },
        { name:'雪妖',     type:'mini', level:65, spawnX:1364,  spawnY:1465,  atk:1500,  hp:8000,  armor:50,  drops:['冰帽','金币'] },
        { name:'冰龙',     type:'boss', level:65, spawnX: 455,  spawnY: 556,  atk:8000,  hp:18000, armor:75,  drops:['冰龙之眼'] },
        { name:'寒冰将军', type:'boss', level:70, spawnX:1566,  spawnY: 657,  atk:9000,  hp:22000, armor:150, drops:['冰霜战甲','金币'] },
        { name:'玄冰法师', type:'boss', level:75, spawnX:2475,  spawnY: 657,  atk:12000, hp:20000, armor:150, drops:['冰霜法杖','金币'] },
      ]
    },
    { id:'divine',      col:1, row:0, name:'神域',     bg:'#fff4cc', border:'#ddaa00', bossMin:90, bossMax:100, monsterMinLv:90, monsterMaxLv:100, hasBoss:true,  emoji:'✨', textColor:'#664400',
      monsters: [
        { name:'天神',       type:'mini', level:90,  spawnX:4899,  spawnY:2071,  atk:2500,  hp:15000, armor:35, drops:['经验球','金币'] },
        { name:'神将',       type:'mini', level:95,  spawnX:4899,  spawnY:1364,  atk:3000,  hp:18000, armor:40, drops:['经验球','金币'] },
        { name:'元神',       type:'mini', level:95,  spawnX:3990,  spawnY:1263,  atk:3500,  hp:20000, armor:40, drops:['经验球','金币'] },
        { name:'混沌魔神',   type:'boss', level:90,  spawnX:5808,  spawnY: 960,  atk:50000,  hp:100000, armor:50, drops:['毗卢帽'] },
        { name:'六耳猕猴',   type:'boss', level:95,  spawnX:4899,  spawnY: 758,  atk:75000,  hp:100000, armor:50, drops:['七十二变'] },
        { name:'真假美猴王', type:'boss', level:100, spawnX:4798,  spawnY: 354,  atk:100000, hp:100000, armor:60, drops:['如来袈裟','紫金葫芦'] },
      ]
    },
    { id:'buddha_land', col:2, row:0, name:'佛教',     bg:'#ffe0b2', border:'#dd8800', bossMin:65, bossMax:90,  monsterMinLv:60, monsterMaxLv:90,  hasBoss:true,  emoji:'☯️', textColor:'#553300',
      monsters: [
        { name:'金刚',       type:'mini', level:60, spawnX:8232,  spawnY:2273,  atk:1000, hp:6000,  armor:20, drops:['经验球','金币'] },
        { name:'护法',       type:'mini', level:75, spawnX:7626,  spawnY:2071,  atk:1500, hp:9000,  armor:25, drops:['经验球','金币'] },
        { name:'罗汉',       type:'mini', level:85, spawnX:9141,  spawnY:1869,  atk:2000, hp:12000, armor:30, drops:['经验球','金币'] },
        { name:'金池长老',   type:'boss', level:65, spawnX:9242,  spawnY: 758,  atk:18000,  hp:15000, armor:100, drops:['毗卢帽','金币'] },
        { name:'大鹏金翅鸟', type:'boss', level:75, spawnX:7424,  spawnY: 657,  atk:20000,  hp:18000, armor:100, drops:['筋斗云靴','金币'] },
        { name:'如来',       type:'boss', level:90, spawnX:8333,  spawnY: 455,  atk:50000, hp:100000,armor:100, drops:['如来袈裟'] },
      ]
    },
    // ── 战斗区域（上方两行：龙宫/天庭/妖魔 在 row0，波次/主城/人间 在 row1/row2）──
    // 注意：坐标全部来自关卡表.xlsx解析（每格100px），世界坐标 = col*3300 + ci*100 + 50
    { id:'dragon',      col:0, row:1, name:'龙宫',     bg:'#c8e8ff', border:'#2277cc', bossMin:22, bossMax:40,  monsterMinLv:20, monsterMaxLv:40,  hasBoss:true,  emoji:'🐉', textColor:'#003388',
      monsters: [
        // 来自关卡表 左中(0,1) — 世界左上角(0,3300)
        { name:'虾兵',   type:'mini', level:20, spawnX:1162,  spawnY:5909,  atk:100,  hp:600,  armor:0,  drops:['水靴','金币'] },
        { name:'蟹将',   type:'mini', level:22, spawnX:1970,  spawnY:5606,  atk:100,  hp:600,  armor:20, drops:['水甲','金币'] },
        { name:'鱼妖',   type:'mini', level:30, spawnX: 455,  spawnY:5000,  atk:200,  hp:1200, armor:0,  drops:['鱼鳞','金币'] },
        { name:'龟丞相', type:'boss', level:32, spawnX:1667,  spawnY:4697,  atk:600,  hp:2000, armor:50, drops:['龟甲','金币'] },
        { name:'母夜叉', type:'boss', level:35, spawnX:2374,  spawnY:4091,  atk:1200, hp:1800, armor:0,  drops:['夜叉鞋','金币'] },
        { name:'鲤鱼精', type:'boss', level:35, spawnX: 455,  spawnY:4192,  atk:1200, hp:1500, armor:0,  drops:['鲤鱼珠'] },
        { name:'龙王',   type:'boss', level:40, spawnX:1566,  spawnY:3687,  atk:1800, hp:3500, armor:50, drops:['龙王角','龙头'] },
      ]
    },
    { id:'heaven',      col:1, row:1, name:'天庭',     bg:'#e8f8ff', border:'#4499cc', bossMin:45, bossMax:80,  monsterMinLv:40, monsterMaxLv:80,  hasBoss:true,  emoji:'⚡', textColor:'#002266',
      monsters: [
        // 来自关卡表 中(1,1) — 世界左上角(3300,3300)
        { name:'天兵',     type:'mini', level:40, spawnX:4899,  spawnY:5909,  atk:2000,  hp:3000,  armor:10,  drops:['经验球','金币'] },
        { name:'天将',     type:'mini', level:55, spawnX:4899,  spawnY:5404,  atk:3000,  hp:5000,  armor:15,  drops:['经验球','金币'] },
        { name:'托塔天王', type:'boss', level:70, spawnX:4091,  spawnY:4798,  atk:18000, hp:18000, armor:100, drops:['降妖宝塔','金币'] },
        { name:'太白金星', type:'boss', level:75, spawnX:5707,  spawnY:4798,  atk:20000, hp:22000, armor:100, drops:['太白浮尘','金币'] },
        { name:'玉皇大帝', type:'boss', level:100,spawnX:4899,  spawnY:4192,  atk:100000,hp:250000,armor:100, drops:['玉皇宝冠'] },
      ]
    },
    { id:'demon',       col:2, row:1, name:'妖魔',     bg:'#ffd8d8', border:'#cc2222', bossMin:32, bossMax:60,  monsterMinLv:30, monsterMaxLv:60,  hasBoss:true,  emoji:'👹', textColor:'#660000',
      monsters: [
        // 来自关卡表 右中(2,1) — 世界左上角(6600,3300)
        { name:'小鬼',    type:'mini', level:30, spawnX:8333,  spawnY:6010,  atk:300,  hp:1800,  armor:20,  drops:['鬼衣','金币'] },
        { name:'牛头',    type:'mini', level:36, spawnX:7525,  spawnY:5404,  atk:330,  hp:2500,  armor:20,  drops:['牛皮靴','金币'] },
        { name:'马面',    type:'mini', level:38, spawnX:8939,  spawnY:5404,  atk:460,  hp:2500,  armor:20,  drops:['马头盔','金币'] },
        { name:'银角大王',type:'boss', level:40, spawnX:8737,  spawnY:4394,  atk:2400, hp:8000,  armor:50,  drops:['银角靴','银粉'] },
        { name:'金角大王',type:'boss', level:50, spawnX:9545,  spawnY:3990,  atk:3000, hp:12000, armor:50,  drops:['金粉','龙角环'] },
        { name:'牛魔王',  type:'boss', level:48, spawnX:7525,  spawnY:4394,  atk:2400, hp:10000, armor:100, drops:['牛王靴','牛王鼻环'] },
        { name:'铁扇公主',type:'boss', level:60, spawnX:7020,  spawnY:4091,  atk:5000, hp:12000, armor:80,  drops:['钢腰带','龙角环'] },
      ]
    },
    { id:'wave_zone',   col:0, row:2, name:'波次入侵', bg:'#2a2a2a', border:'#cc4400', bossMin:0,  bossMax:0,   monsterMinLv:1,  monsterMaxLv:80,  hasBoss:false, emoji:'⚔️', textColor:'#ff6622' },
    { id:'main_city',   col:1, row:2, name:'主城',     bg:'#e8f5e0', border:'#44aa44', bossMin:0,  bossMax:0,   monsterMinLv:0,  monsterMaxLv:0,   hasBoss:false, emoji:'🏯', textColor:'#225522' },
    { id:'human',       col:2, row:2, name:'人间',     bg:'#f5f0dc', border:'#aa8833', bossMin:5,  bossMax:20,  monsterMinLv:3,  monsterMaxLv:20,  hasBoss:true,  emoji:'🌾', textColor:'#443311',
      monsters: [
        // 来自关卡表 右下(2,2) — 世界左上角(6600,6600)
        { name:'小狼',     type:'mini', level:3,  spawnX:6919,  spawnY:8131,  atk:4,   hp:30,  armor:0,  drops:['破鞋'] },
        { name:'小熊',     type:'mini', level:6,  spawnX:7828,  spawnY:8636,  atk:10,  hp:40,  armor:0,  drops:['破帽'] },
        { name:'牛马',     type:'mini', level:13, spawnX:9141,  spawnY:8131,  atk:36,  hp:100, armor:0,  drops:['破衣'] },
        { name:'狼王',     type:'boss', level:5,  spawnX:7121,  spawnY:6919,  atk:40,  hp:300, armor:0,  drops:['草鞋'] },
        { name:'熊精',     type:'boss', level:8,  spawnX:7222,  spawnY:9545,  atk:50,  hp:400, armor:0,  drops:['草帽','布衣'] },
        { name:'勇敢牛牛', type:'boss', level:15, spawnX:9444,  spawnY:9343,  atk:250, hp:600, armor:20, drops:['牛鼻环','腰带'] },
        { name:'浪里马',   type:'boss', level:20, spawnX:9646,  spawnY:6919,  atk:350, hp:650, armor:20, drops:['精铁'] },
      ]
    },
  ],

  // zeti屏障连接规则：不加泽民的相邻对（小区域id对）
  // 三个底行区域（wave_zone, main_city, human）彼此间不设功绩
  WEAK_WATER_EXEMPT_PAIRS: [
    ['wave_zone', 'main_city'],
    ['main_city', 'human'],
    ['wave_zone', 'human'],
  ],

  // 玩家初始属性（Lv1 基础值）
  PLAYER_BASE: {
    hp: 200, mp: 100, atk: 10, armor: 0, dodge: 0.05,
    speed: 300, atkRange: 80, atkInterval: 1200, // ms
  },

  // 升级经验表（每级所需经验 = lv² + lv^2.5）
  EXP_TABLE: (() => {
    const t = [0];
    for (let lv = 1; lv <= 100; lv++) {
      t.push(Math.round(lv * lv + Math.pow(lv, 2.5)));
    }
    return t;
  })(),

  // 等级成长系数（仅 mp 保留指数成长；atk/armor/hp 改为分段线性+百分比，见 player.js）
  LV_GROWTH: {
    mp:    1.04,
  },

  // 技能解锁等级（当头一棒Lv3, 金箍棒旋Lv10, 筋斗云冲Lv20, 猴子猴孙Lv40, 筋斗云Lv1）
  SKILL_UNLOCK: [3, 10, 20, 40, 1],

  // 心法解锁等级
  XINFA_UNLOCK: 50,

  // 技能配置
  SKILLS: [
    { id:'skill_e', name:'当头一棒', key:'E', cd:8000,  mpCost:0,  desc:'蓄力1秒，向指定方向劈出600px金箍棒，造成200%攻击伤害', needTarget:true },
    { id:'skill_r', name:'菩提棒法', key:'R', cd:20000, mpCost:20, desc:'激活菩提棒法，持续5秒：攻击间隔-25%（攻速+33%），每次普攻吸血25%，并有50%概率触发爆炸（150px范围，50%伤害）', needTarget:false, buffDur:5000 },
    { id:'skill_t', name:'滚花乱舞', key:'T', cd:15000, mpCost:30, desc:'就地舞动金箍棒2秒，持续在300px范围内每秒造成300%伤害，期间可自由走路', needTarget:false },
    { id:'skill_y', name:'猴子猴孙', key:'Y', cd:25000, mpCost:40, desc:'召唤4个分身替你战斗，继承全部属性，持续5秒自动攻击最近敌人', needTarget:false },
    { id:'skill_q', name:'筋斗云',   key:'G', cd:10000, mpCost:0,  desc:'驾驶筋斗云，瞬间传送至师傅身边', needTarget:false },
  ],

  // 装备槽（acc1/acc2 为两个独立饰品槽，但两槽通用：任意饰品可装入任一槽）
  EQUIP_SLOTS: ['weapon','head','armor','boots','acc1','acc2'],
  EQUIP_SLOT_NAMES: { weapon:'武器', head:'头饰', armor:'盔甲', boots:'鞋子', acc1:'饰品1', acc2:'饰品2' },

  // 装备品质颜色（5品质：白绿蓝紫橙）
  // 注意：getQuality(key) 定义在 equipments.js，这里保留兼容映射供旧代码使用
  QUALITY_COLOR: {
    // 新5品质
    white:'#c8c8c8', green:'#44dd66', blue:'#44aaff', purple:'#cc66ff', orange:'#ff9933',
    // 旧品质别名（向后兼容）
    normal:'#c8c8c8', rare:'#44dd66', epic:'#44aaff', legend:'#cc66ff',
  },
  QUALITY_NAME: {
    white:'白色', green:'绿色', blue:'蓝色', purple:'紫色', orange:'橙色',
    normal:'白色', rare:'绿色', epic:'蓝色', legend:'紫色',
  },
  // 品质顺序（升序）
  QUALITY_ORDER: ['white','green','blue','purple','orange'],

  // BOSS复活时间
  BOSS_RESPAWN: 60000,

  // 小怪复活时间
  MINIENEMY_RESPAWN: 30000,

  // 波次配置
  WAVE_INTERVAL: 120000, // 2分钟
  TOTAL_WAVES: 20,

  // 唐僧血量
  TANGSENG_HP: 3000,

  // 攻击特效持续时间
  EFFECT_DURATION: 300,

  // 伤害数字持续时间
  DMGFLOAT_DURATION: 1200,

  // 颜色
  COLOR: {
    PLAYER: '#f5a623',
    TANGSENG: '#ffffff',
    BOSS: '#ff4444',
    WAVE_ENEMY: '#ff6666',
    BULLET: '#ffff00',
    SKILL_AOE: 'rgba(255,200,50,0.3)',
  }
};

// 区域坐标计算辅助
C.getZoneRect = function(col, row) {
  return {
    x: col * C.CELL,
    y: row * C.CELL,
    w: C.CELL,
    h: C.CELL,
  };
};

C.getZoneById = function(id) {
  return C.ZONES.find(z => z.id === id);
};

// ── ttet区域列表（静态生成，启动时调用一次）──
// 每条ttet是一个矩形 {x,y,w,h}，绕着格子边线居中放置
C.buildWeakWaterRects = function() {
  const rects = [];
  const W = C.WEAK_WATER_W;
  const half = W / 2;

  // 检查两个区域是否豁免
  function isExempt(idA, idB) {
    return C.WEAK_WATER_EXEMPT_PAIRS.some(
      p => (p[0]===idA && p[1]===idB) || (p[0]===idB && p[1]===idA)
    );
  }

  // 竖向边界 col=1（x=3333）、col=2（x=6666）
  for (let col = 1; col <= 2; col++) {
    for (let row = 0; row <= 2; row++) {
      const leftZone  = C.ZONES.find(z => z.col === col-1 && z.row === row);
      const rightZone = C.ZONES.find(z => z.col === col   && z.row === row);
      if (!leftZone || !rightZone) continue;
      if (isExempt(leftZone.id, rightZone.id)) continue;
      rects.push({
        x: col * C.CELL - half,
        y: row * C.CELL,
        w: W,
        h: C.CELL,
        type: 'v'
      });
    }
  }

  // 横向边界 row=1（y=3333）、row=2（y=6666）
  for (let row = 1; row <= 2; row++) {
    for (let col = 0; col <= 2; col++) {
      const topZone    = C.ZONES.find(z => z.col === col && z.row === row-1);
      const bottomZone = C.ZONES.find(z => z.col === col && z.row === row);
      if (!topZone || !bottomZone) continue;
      if (isExempt(topZone.id, bottomZone.id)) continue;
      rects.push({
        x: col * C.CELL,
        y: row * C.CELL - half,
        w: C.CELL,
        h: W,
        type: 'h'
      });
    }
  }

  return rects;
};

// ── 山脉障碍数据（由关卡表.xlsx 33×33格导出，每格=100px，金黄色=山地障碍）──
// 坐标已按游戏实际区域偏移修正（每格3333px，关卡表33格=3300px，差值吸收在弱水边缘）

// 天庭区域山脉障碍 —— 游戏坐标左上角(3333, 3333)
// 关卡表解析：7个矩形，基于(3300,3300)，加偏移(+33,+33)
C.HEAVEN_MOUNTAINS = [
  { x: 3433, y: 3433, w: 3100, h: 500 },
  { x: 3433, y: 3933, w: 1100, h: 500 },
  { x: 5333, y: 3933, w: 1200, h: 500 },
  { x: 3433, y: 4433, w: 500,  h: 2100 },
  { x: 6033, y: 4433, w: 500,  h: 2100 },
  { x: 3933, y: 5233, w: 600,  h: 1300 },
  { x: 5433, y: 5233, w: 600,  h: 1300 },
];

// 出怪区（波次入侵）山脉障碍 —— 游戏坐标左上角(0, 6666)
// 关卡表解析：3个矩形，基于(0,6600)，y+66
C.WAVE_ZONE_MOUNTAINS = [
  { x:    0, y: 6766, w: 3300, h:  900 },
  { x:    0, y: 7666, w: 2000, h: 2300 },
  { x: 2000, y: 8666, w: 1300, h: 1300 },
];

// 主城山脉障碍 —— 游戏坐标左上角(3333, 6666)
// 关卡表解析：4个矩形，基于(3300,6600)，x+33, y+66
C.MAIN_CITY_MOUNTAINS = [
  { x: 3333, y: 6766, w:  900, h:  500 },
  { x: 5733, y: 6766, w:  900, h:  500 },
  { x: 5733, y: 9166, w:  900, h:  800 },
  { x: 3333, y: 9266, w:  900, h:  700 },
];

// 人间区域山脉障碍 —— 游戏坐标左上角(6666, 6666)
// 关卡表解析：9个矩形，基于(6600,6600)，x+66, y+66
C.HUMAN_MOUNTAINS = [
  { x: 6666, y: 6766, w:  200, h:  900 },
  { x: 8966, y: 6766, w:  200, h:  700 },
  { x: 7566, y: 6966, w: 1000, h:  100 },
  { x: 6866, y: 7466, w:  400, h:  200 },
  { x: 9466, y: 7566, w:  500, h:  100 },
  { x: 7666, y: 7866, w:  900, h:  200 },
  { x: 8366, y: 8066, w:  200, h: 1900 },
  { x: 6666, y: 8666, w:  500, h:  200 },
  { x: 6666, y: 8866, w:  200, h: 1100 },
];

// 所有山脉合并（用于统一碰撞检测）
C.ALL_MOUNTAINS = [].concat(
  C.HEAVEN_MOUNTAINS,
  C.WAVE_ZONE_MOUNTAINS,
  C.MAIN_CITY_MOUNTAINS,
  C.HUMAN_MOUNTAINS
);

// 碰撞检测：点是否在任意山脉矩形内（带角色半径）
C.isInMountain = function(wx, wy, radius) {
  radius = radius || 0;
  for (const m of C.ALL_MOUNTAINS) {
    if (wx + radius > m.x && wx - radius < m.x + m.w &&
        wy + radius > m.y && wy - radius < m.y + m.h) {
      return true;
    }
  }
  return false;
};

// 小怪区坐标（每个区域2片，每片10只小怪）
C.buildMiniEnemyZones = function() {
  const zones = [];
  C.ZONES.forEach(zone => {
    if (zone.id === 'main_city' || zone.id === 'wave_zone') return;
    const rect = C.getZoneRect(zone.col, zone.row);
    const margin = 400;
    const pw = C.WEAK_WATER_W;

    if (zone.monsters) {
      // 按配置表：每条 type:'mini' 的行生成独立一组10只
      const miniList = zone.monsters.filter(m => m.type === 'mini');
      const totalGroups = miniList.length;
      // 将区域平均切成 totalGroups 列，每组各占一列
      const colW = (rect.w - margin*2 - pw*2) / Math.max(totalGroups, 1);
      miniList.forEach((m, idx) => {
        const gx = rect.x + margin + pw + idx * colW;
        const gy = rect.y + margin + pw;
        const gw = Math.min(colW - 50, 600);
        const gh = Math.min(rect.h - margin*2 - pw*2, 600);
        zones.push({
          zoneId: zone.id,
          x: gx, y: gy,
          w: gw, h: gh,
          count: 5,
          groupLv: m.level,
          forceName: m.name,      // 固定名字
          monsterConfig: m,       // 配置表引用（掉落用）
        });
      });
    } else {
      // 旧逻辑：每个区域2片小怪区，随机等级
      const positions = [
        { rx: rect.x + margin + pw, ry: rect.y + margin + pw,  rw: 500, rh: 500 },
        { rx: rect.x + rect.w - margin - pw - 500, ry: rect.y + rect.h - margin - pw - 500, rw: 500, rh: 500 },
      ];
      positions.forEach(pos => {
        const groupLv = Utils.randInt(zone.monsterMinLv || 1, zone.monsterMaxLv || 10);
        zones.push({
          zoneId: zone.id,
          x: pos.rx, y: pos.ry,
          w: pos.rw, h: pos.rh,
          count: 5,
          groupLv,
        });
      });
    }
  });
  return zones;
};
