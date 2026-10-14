// ========== 常量 ==========
const GRID = 11;
const CELL = 64;
const CANVAS_SIZE = GRID * CELL;
const PATH_COLOR = '#8B7355';
const BUILD_COLOR = '#2d5a27';
const PATH_BORDER = '#6B5335';

// ========== 地图路径定义 ==========
// 经典S形（新版三段式）：
//   段1：(0,0)→(0,5)→(3,5)→(3,2)→(7,2)→(7,5)→(10,5)→(10,0) 目标点1
//   段2：(10,0)→(10,5)→(7,5)→(7,8)→(3,8)→(3,5)→(0,5)→(0,10) 目标点2
//   段3：(0,10)→(0,5)→(3,5)→(3,2)→(7,2)→(7,5)→(10,5)→(10,10) 终点
// 检查点：目标点1 = PATH_CELLS 索引对应 (10,0)，目标点2 = (0,10)
const PATH_CHECKPOINT1 = [10, 0];  // 目标点1坐标 [row, col]
const PATH_CHECKPOINT2 = [0, 10];  // 目标点2坐标 [row, col]
function buildPath1() {
  const p = [];
  // 段1：(0,0)→(0,5) 顶部右行
  for (let c = 0; c <= 5; c++) p.push([0, c]);
  // 段1：(0,5)→(3,5) 向下
  for (let r = 1; r <= 3; r++) p.push([r, 5]);
  // 段1：(3,5)→(3,2) 向左
  for (let c = 4; c >= 2; c--) p.push([3, c]);
  // 段1：(3,2)→(7,2) 向下
  for (let r = 4; r <= 7; r++) p.push([r, 2]);
  // 段1：(7,2)→(7,5) 向右
  for (let c = 3; c <= 5; c++) p.push([7, c]);
  // 段1：(7,5)→(10,5) 向下
  for (let r = 8; r <= 10; r++) p.push([r, 5]);
  // 段1：(10,5)→(10,0) 向左 → 到达目标点1 (10,0)
  for (let c = 4; c >= 0; c--) p.push([10, c]);
  // 段2：(10,0)→(10,5) 向右
  for (let c = 1; c <= 5; c++) p.push([10, c]);
  // 段2：(10,5)→(7,5) 向上
  for (let r = 9; r >= 7; r--) p.push([r, 5]);
  // 段2：(7,5)→(7,8) 向右
  for (let c = 6; c <= 8; c++) p.push([7, c]);
  // 段2：(7,8)→(3,8) 向上
  for (let r = 6; r >= 3; r--) p.push([r, 8]);
  // 段2：(3,8)→(3,5) 向左
  for (let c = 7; c >= 5; c--) p.push([3, c]);
  // 段2：(3,5)→(0,5) 向上
  for (let r = 2; r >= 0; r--) p.push([r, 5]);
  // 段2：(0,5)→(0,10) 向右 → 到达目标点2 (0,10)
  for (let c = 6; c <= 10; c++) p.push([0, c]);
  // 段3：(0,10)→(0,5) 向左
  for (let c = 9; c >= 5; c--) p.push([0, c]);
  // 段3：(0,5)→(3,5) 向下
  for (let r = 1; r <= 3; r++) p.push([r, 5]);
  // 段3：(3,5)→(3,2) 向左
  for (let c = 4; c >= 2; c--) p.push([3, c]);
  // 段3：(3,2)→(7,2) 向下
  for (let r = 4; r <= 7; r++) p.push([r, 2]);
  // 段3：(7,2)→(7,5) 向右
  for (let c = 3; c <= 5; c++) p.push([7, c]);
  // 段3：(7,5)→(10,5) 向下
  for (let r = 8; r <= 10; r++) p.push([r, 5]);
  // 段3：(10,5)→(10,10) 向右 → 终点 (10,10)
  for (let c = 6; c <= 10; c++) p.push([10, c]);
  return p;
}

// 路径（固定经典S形）
let PATH_CELLS = buildPath1();
let PATH_SET = new Set(PATH_CELLS.map(([r,c])=>`${r},${c}`));

// ========== 经验值系统常量（全局）==========
const EXP_PER_KILL     = 3;   // 普通怪击杀经验
const EXP_PER_BOSS     = 30;  // BOSS击杀经验
const EXP_PER_LEVEL    = 100; // 每级所需经验
const MAX_PLAYER_LEVEL = 5;   // 玩家最高等级

// ========== 5种基础塔定义（每种6级，每级数值翻倍）==========
// Lv1基础值，每升一级×2
// 红精灵：单体高攻击（dmg:30, range:2.0, rate:0.6）附加灼烧
// 黄精灵：单体超高攻速（dmg:15, range:2.8, rate:3.0）
// 蓝精灵：单体减速攻击（dmg:15, range:2.8, rate:1.0）
// 绿精灵：单体低攻击带毒（dmg:15, range:2.4, rate:1.0）
// 白精灵：群体低攻击（dmg:15, range:2.8, rate:1.0，攻击最近3个）
// 黑精灵：单体中攻击+减甲（dmg:30, range:2.4, rate:1.0）
const BASE_TOWER_DEFS = {
  fire:    { name:'红精灵', icon:'🔴', color:'#ff4500', desc:'单体攻击，附加持续灼烧',     dmg:30,  range:2.0, rate:0.6,  effect:'burn',           effectPower:20, aoeRange:0 },
  thunder: { name:'黄精灵', icon:'🟡', color:'#ffd700', desc:'单体超高攻速攻击',           dmg:15,  range:2.8, rate:3.0,  effect:'thunderSingle',  effectPower:0,  aoeRange:0 },
  ice:     { name:'蓝精灵', icon:'🔵', color:'#00bfff', desc:'单体攻击，命中减速3秒',      dmg:15,  range:2.8, rate:1.0,  effect:'iceBuff',        effectPower:0.8, aoeRange:0 },
  poison:  { name:'绿精灵', icon:'🟢', color:'#44bb44', desc:'单体攻击，附加持续毒素8秒',  dmg:15,  range:2.4, rate:1.0,  effect:'poison',         effectPower:8,  aoeRange:0 },
  white:   { name:'白精灵', icon:'⚪', color:'#ccddff', desc:'同时攻击最近3个目标，群体伤害',dmg:15, range:2.8, rate:1.0,  effect:'whiteAoe',       effectPower:0,  aoeRange:0 },
  black:   { name:'黑精灵', icon:'⚫', color:'#554477', desc:'单体攻击，命中削减护甲2点',   dmg:30,  range:2.4, rate:1.0,  effect:'blackArmorBreak',effectPower:2,  aoeRange:0 },
};

// 每种塔6级，每级 dmg = 上一级×2（Lv1基础值见BASE_TOWER_DEFS）
// effectPower 是否跟随翻倍取决于效果类型：
//   · burn / poison：每秒伤害量，跟随翻倍 ✓
//   · blackArmorBreak：减甲点数，跟随翻倍 ✓
//   · iceBuff：减速比例（固定值0.8），不翻倍，保持原值 ✗
//   · thunderSingle / whiteAoe：effectPower=0，无影响
// 通过 getBaseTowerCfg(type, level) 获取对应等级的完整cfg
const EFFECT_POWER_SCALES = {
  burn:            true,   // 灼烧伤害/s，随等级翻倍
  poison:          true,   // 毒素伤害/s，随等级翻倍
  blackArmorBreak: true,   // 减甲点数，随等级翻倍
  iceBuff:         false,  // 减速比例固定，不翻倍
  thunderSingle:   false,  // effectPower=0，无影响
  whiteAoe:        false,  // effectPower=0，无影响
};
function getBaseTowerCfg(type, level) {
  const base = BASE_TOWER_DEFS[type];
  if (!base) return null;
  // Lv1=×1, Lv2=×2, Lv3=×4, Lv4=×8, Lv5=×16, Lv6=×64（Lv6是Lv5的4倍）
  const mult = level < 6 ? Math.pow(2, level - 1) : Math.pow(2, level);
  const scaleEP = EFFECT_POWER_SCALES[base.effect] !== false; // 默认跟随翻倍
  return Object.assign({}, base, {
    dmg:         Math.round(base.dmg * mult),
    effectPower: scaleEP ? parseFloat((base.effectPower * mult).toFixed(2)) : base.effectPower,
    // range 和 rate 不随等级变化
  });
}

// 为向后兼容保留 TOWER_RECIPES（供特殊配方和GM面板使用，指向基础塔Lv1 cfg）
const TOWER_RECIPES = {
  fire:    BASE_TOWER_DEFS.fire,
  thunder: BASE_TOWER_DEFS.thunder,
  ice:     BASE_TOWER_DEFS.ice,
  poison:  BASE_TOWER_DEFS.poison,
  white:   BASE_TOWER_DEFS.white,
  black:   BASE_TOWER_DEFS.black,
};

function recipeKey(cards) {
  // 旧接口保留，新系统不再使用三张合成
  const m = { fire:'fire', thunder:'thunder', ice:'ice', poison:'poison', white:'white', black:'black' };
  return cards.map(c => m[c] || c).sort().join(',');
}

// 工具：hex颜色转rgba字符串
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// ========== 特殊塔配方 ==========
// ingredients: [{effect, level}, ...] 消耗塔列表（不含触发塔本身）
// trigger: {effect, level} 点击哪种塔时出现按钮（也是消耗之一）
// result: 特殊塔配置
const SPECIAL_RECIPES = [
  // ── 行1：火系 ─────────────────────────────────────
  {
    id: 'volcano',
    name: '小火山',
    icon: '🌋',
    color: '#ff6600',
    ingredients: [
      { effect: 'burn',            level: 2 },   // 红精灵 lv2
      { effect: 'burn',            level: 1 },   // 红精灵 lv1
      { effect: 'blackArmorBreak', level: 1 },   // 黑精灵 lv1
    ],
    desc: '无法攻击，持续对半径3格内所有敌人造成80/s灼烧伤害（魔免免疫）',
    cfg: {
      name:'小火山', icon:'🌋', color:'#ff6600',
      desc:'持续灼烧AOE（80/s），半径3格，无法攻击，魔免免疫',
      dmg: 0, range: 0, rate: 0, effect: 'volcanoAura', effectPower: 80,
      aoeRange: 3, special: true,
    },
  },
  {
    id: 'bigVolcano',
    name: '大火山',
    icon: '🌋',
    color: '#ff4400',
    ingredients: [
      { effect: 'volcanoAura',     level: 1 },   // 小火山
      { effect: 'burn',            level: 4 },   // 红精灵 lv4
      { effect: 'blackArmorBreak', level: 3 },   // 黑精灵 lv3
    ],
    desc: '无法攻击，持续对半径4格内所有敌人造成180/s灼烧伤害（小火山的增强版，范围更大、伤害更高）',
    cfg: {
      name:'大火山', icon:'🌋', color:'#ff4400',
      desc:'持续AOE灼烧（180/s），半径4格，无法攻击，受burnImmune免疫',
      dmg: 0, range: 0, rate: 0, effect: 'bigVolcanoAura', effectPower: 180,
      aoeRange: 4, special: true,
    },
  },
  {
    id: 'phoenix',
    name: '凤凰',
    icon: '🦅',
    color: '#ff6600',
    ingredients: [
      { effect: 'bigVolcanoAura', level: 1 },   // 大火山
      { effect: 'burn',           level: 5 },   // 红精灵 lv5
      { effect: 'burn',           level: 4 },   // 红精灵 lv4
    ],
    desc: '无法攻击，持续对半径5格内所有非魔免敌人施加灼烧（500/s）；同时5格内所有敌人受到伤害+25%；魔免单位不受灼烧但仍受伤害加深效果',
    cfg: {
      name:'凤凰', icon:'🦅', color:'#ff6600',
      desc:'持续AOE灼烧（500/s），半径5格，对魔免单位无效；5格内敌人受到伤害+25%',
      dmg: 0, range: 0, rate: 0, effect: 'phoenixAura', effectPower: 500,
      aoeRange: 5, burnMagicAmp: 0, special: true,
    },
  },
  {
    id: 'goldMachine',
    name: '点金手',
    icon: '🪙',
    color: '#ffd700',
    ingredients: [
      { effect: 'poison',        level: 3 },   // 绿精灵 lv3
      { effect: 'thunderSingle', level: 3 },   // 黄精灵 lv3
      { effect: 'whiteAoe',      level: 3 },   // 白精灵 lv3
    ],
    desc: '每回合向范围内一个普通小兵投掷金块将其秒杀，额外掉落2个钱袋（各值10💰），每回合仅限一次，不对精英/BOSS生效；【全局】场上有此塔时怪物死亡有10%概率额外爆出金币袋（10💰）',
    cfg: {
      name:'点金手', icon:'🪙', color:'#ffd700',
      desc:'每回合秒杀一个普通小兵并额外掉落2个钱袋（各10💰），每回合限1次，不对精英/BOSS生效；【全局】场上有此塔时怪物死亡有10%概率额外爆出金币袋（10💰）',
      dmg: 0, range: 2.5, rate: 0, effect: 'goldMachineGen', effectPower: 2,
      aoeRange: 0, special: true, alchemyGold: 2,
    },
  },
  {
    id: 'bank',
    name: '炼金术士',
    icon: '⚗️',
    color: '#ffd700',
    ingredients: [
      { effect: 'goldMachineGen', level: 1 },  // 点金手
      { effect: 'whiteAoe',       level: 5 },  // 白精灵 lv5
      { effect: 'poison',         level: 5 },  // 绿精灵 lv5
    ],
    desc: '单体攻击（攻速3/s，伤害500），击杀时额外生成2个钱袋（各值10💰）；【全局】场上有此塔时怪物死亡有10%概率额外爆出金币袋（10💰）',
    cfg: {
      name:'炼金术士', icon:'⚗️', color:'#ffd700',
      desc:'单体攻击，伤害500，攻速3/s，范围2.8格；击杀时生成2个钱袋（各10💰）；【全局】场上有此塔时怪物死亡有10%概率额外爆出金币袋（10💰）',
      dmg: 500, range: 2.8, rate: 3, effect: 'bankAtk', effectPower: 0,
      aoeRange: 0, special: true, alchemyGold: 2,
    },
  },
  // ── 行2：冰/雷系 ─────────────────────────────────────────
  {
    id: 'jelly',
    name: '雷公',
    icon: '🪼',
    color: '#88aaff',
    ingredients: [
      { effect: 'thunderSingle', level: 1 },   // 黄精灵 lv1
      { effect: 'iceBuff',       level: 1 },   // 蓝精灵 lv1
      { effect: 'poison',        level: 1 },   // 绿精灵 lv1
    ],
    desc: '高攻速单体攻击，命中35%概率触发闪电链弹射4-5个目标',
    cfg: {
      name:'雷公', icon:'🪼', color:'#88aaff',
      desc:'单体攻击（60伤），攻速3/s；35%概率闪电链弹4-5目标（各100%伤害），范围3格',
      dmg: 60, range: 3.0, rate: 3.0, effect: 'jellyAtk', effectPower: 0.35,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'thunderKing',
    name: '雷王',
    icon: '⚡',
    color: '#ffe066',
    ingredients: [
      { effect: 'jellyAtk',      level: 1 },   // 雷公
      { effect: 'thunderSingle', level: 3 },   // 黄精灵 lv3
      { effect: 'poison',        level: 2 },   // 绿精灵 lv2
    ],
    desc: '雷公的增强版：单体攻击伤害更高，攻速更快，弹射概率55%（弹射4-5目标），范围更广',
    cfg: {
      name:'雷王', icon:'⚡', color:'#ffe066',
      desc:'单体攻击（120伤），攻速3.5/s；55%概率闪电链弹4-5目标（各100%伤），范围3.2格',
      dmg: 120, range: 3.2, rate: 3.5, effect: 'thunderKingAtk', effectPower: 0.55,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'stormGoddess',
    name: '宙斯',
    icon: '\uD83C\uDF29\uFE0F',
    color: '#bb88ff',
    ingredients: [
      { effect: 'jellyAtk',       level: 1 },   // 雷公
      { effect: 'thunderKingAtk', level: 1 },   // 雷王
      { effect: 'thunderSingle',  level: 5 },   // 黄精灵 lv5
    ],
    desc: '攻击分两轮：第一轮物理攻击最多5个目标（含魔免，600伤/个，受护甲影响）；第二轮叉状闪电对最多5个非魔免目标造成等量魔法伤害（无视护甲）',
    cfg: {
      name:'宙斯', icon:'\uD83C\uDF29\uFE0F', color:'#bb88ff',
      desc:'物理攻击最多5个目标（600伤），同时叉状闪电对最多5个目标造成魔法伤害（600伤），攻速1/s，范围3.5格',
      dmg: 600, range: 3.5, rate: 1.0, effect: 'stormGoddessAtk', effectPower: 0,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'frostArrow',
    name: '寒冰',
    icon: '🌊',
    color: '#44ccff',
    ingredients: [
      { effect: 'iceBuff',  level: 3 },   // 蓝精灵 lv3
      { effect: 'iceBuff',  level: 2 },   // 蓝精灵 lv2
      { effect: 'whiteAoe', level: 2 },   // 白精灵 lv2
    ],
    desc: '同时攻击5个目标，每次命中造成50%减速3秒',
    cfg: {
      name:'寒冰', icon:'🌊', color:'#44ccff',
      desc:'同时攻击5个目标（120伤/个），命中附加50%减速3秒，攻速1.0/s，范围3格',
      dmg: 120, range: 3.0, rate: 1.0, effect: 'frostArrowAtk', effectPower: 0.5,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'snowKing',
    name: '冰女',
    icon: '⛄',
    color: '#88ddff',
    ingredients: [
      { effect: 'frostArrowAtk', level: 1 },   // 寒冰
      { effect: 'iceBuff',       level: 4 },   // 蓝精灵 lv4
      { effect: 'iceBuff',       level: 5 },   // 蓝精灵 lv5
    ],
    desc: '攻击5个目标，命中50%概率冰冻0.5s；持续60%减速光环（半径4格）；每8秒在怪物处降暴风雪（半径1格，持续AOE伤害+80%减速2秒）',
    cfg: {
      name:'冰女', icon:'⛄', color:'#88ddff',
      desc:'5目标攻击，50%冰冻0.5s；持续60%减速光环（4格）；每8s暴风雪AOE（持续2s，80%减速）',
      dmg: 250, range: 3.0, rate: 0.9, effect: 'snowKingAtk', effectPower: 0.5,
      aoeRange: 4, special: true,
    },
  },
  // ── 行3：物理/攻速系 ─────────────────────────────────────
  {
    id: 'vajra',
    name: '金刚',
    icon: '💎',
    color: '#ffe066',
    ingredients: [
      { effect: 'thunderSingle', level: 1 },   // 黄精灵 lv1
      { effect: 'whiteAoe',      level: 1 },   // 白精灵 lv1
      { effect: 'iceBuff',       level: 1 },   // 蓝精灵 lv1
    ],
    desc: '高额单体物理攻击，无附加效果',
    cfg: {
      name:'金刚', icon:'💎', color:'#ffe066',
      desc:'高额单体物理伤害（400），无附加效果，攻速1.0/s，范围3格',
      dmg: 400, range: 3.0, rate: 1.0, effect: 'vajraAtk', effectPower: 0,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'greatVajra',
    name: '大金刚',
    icon: '🔷',
    color: '#ffcc00',
    ingredients: [
      { effect: 'vajraAtk',      level: 1 },   // 金刚
      { effect: 'whiteAoe',      level: 3 },   // 白精灵 lv3
      { effect: 'thunderSingle', level: 2 },   // 黄精灵 lv2
    ],
    desc: '超高额单体物理攻击，每次命中溅射50%伤害至周围1.5格范围内其他敌人',
    cfg: {
      name:'大金刚', icon:'🔷', color:'#ffcc00',
      desc:'超高单体伤害（800），命中溅射50%伤害（范围1.5格），攻速1.0/s，范围3格',
      dmg: 800, range: 3.0, rate: 1.0, effect: 'greatVajraAtk', effectPower: 0.5,
      aoeRange: 1.5, special: true,
    },
  },
  {
    id: 'skyLord',
    name: '流浪剑客',
    icon: '⚔️',
    color: '#ffd700',
    ingredients: [
      { effect: 'vajraAtk',      level: 1 },   // 金刚
      { effect: 'greatVajraAtk', level: 1 },   // 大金刚
      { effect: 'whiteAoe',      level: 5 },   // 白精灵 lv5
    ],
    desc: '极高额单体物理攻击，命中后对1.5格范围内所有其他敌人造成100%溅射伤害',
    cfg: {
      name:'流浪剑客', icon:'⚔️', color:'#ffd700',
      desc:'极高单体伤害（2600），命中后1.5格内100%溅射，攻速1.0/s，范围3.5格',
      dmg: 2600, range: 3.5, rate: 1.0, effect: 'skyLordAtk', effectPower: 1.0,
      aoeRange: 1.5, special: true,
    },
  },
  {
    id: 'crystal',
    name: '结晶',
    icon: '💎',
    color: '#ff88cc',
    ingredients: [
      { effect: 'burn',          level: 2 },   // 红精灵 lv2
      { effect: 'poison',        level: 2 },   // 绿精灵 lv2
      { effect: 'thunderSingle', level: 2 },   // 黄精灵 lv2
    ],
    desc: '单体高伤攻击，每次攻击10%概率触发5倍暴击，攻速1.2/s，范围3格',
    cfg: {
      name:'结晶', icon:'💎', color:'#ff88cc',
      desc:'单体攻击（555伤），10%概率5倍暴击（2775伤），攻速1.2/s，范围3格',
      dmg: 555, range: 3.0, rate: 1.2, effect: 'crystalAtk', effectPower: 0.1,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'blackStone',
    name: '黑石',
    icon: '🪨',
    color: '#554477',
    ingredients: [
      { effect: 'blackArmorBreak', level: 2 },   // 黑精灵 lv2
      { effect: 'poison',          level: 2 },   // 绿精灵 lv2
      { effect: 'blackArmorBreak', level: 3 },   // 黑精灵 lv3
    ],
    desc: '同时攻击3个目标，每次命中累计削减护甲12点，攻速1.2/s，范围3格',
    cfg: {
      name:'黑石', icon:'🪨', color:'#554477',
      desc:'3目标攻击（150伤），命中削甲12/次，攻速1.2/s，范围3格',
      dmg: 150, range: 3.0, rate: 1.2, effect: 'blackStoneAtk', effectPower: 12,
      aoeRange: 0, special: true,
    },
  },
  {
    id: 'phantomAssassin',
    name: '幻影刺客',
    icon: '🗡️',
    color: '#cc44ff',
    ingredients: [
      { effect: 'blackStoneAtk',   level: 1 },   // 黑石
      { effect: 'crystalAtk',      level: 1 },   // 结晶
      { effect: 'blackArmorBreak', level: 5 },   // 黑精灵 lv5
    ],
    desc: '高攻速单体物理攻击，10%概率触发20倍暴击；【光环】周围2.5格内所有塔攻击力+20%',
    cfg: {
      name:'幻影刺客', icon:'🗡️', color:'#cc44ff',
      desc:'单体攻击（444伤），攻速3/s，10%概率20倍暴击（8880伤），范围3.2格；【光环】周围2.5格内所有塔攻击力+20%',
      dmg: 444, range: 3.2, rate: 3.0, effect: 'phantomAssassinAtk', effectPower: 0.1,
      aoeRange: 2.5, atkBuffAdd: 1.2, special: true,
    },
  },
  {
    id: 'shadowDemon',
    name: '影魔',
    icon: '👿',
    color: '#9933cc',
    ingredients: [
      { effect: 'blackStoneAtk',   level: 1 },   // 黑石
      { effect: 'blackArmorBreak', level: 4 },   // 黑精灵 lv4
      { effect: 'burn',            level: 4 },   // 红精灵 lv4
    ],
    desc: '单体物理攻击900，攻击附带减甲15，每次击杀收集灵魂（动画为紫色线条抽取），每个灵魂+50攻击',
    cfg: {
      name:'影魔', icon:'👿', color:'#9933cc',
      desc:'单体物理900，减甲15，击杀收集灵魂（每魂+50攻），攻速1/s，范围3.5格，弹道为紫色球',
      dmg: 900, range: 3.5, rate: 1.0, effect: 'shadowDemonAtk', effectPower: 15,
      aoeRange: 0, special: true,
    },
  },
  // ── 辅助/支援系 ─────────────────────────────────────
  {
    id: 'scope',
    name: '望远镜',
    icon: '🔭',
    color: '#88ccff',
    ingredients: [
      { effect: 'burn',    level: 3 },   // 红精灵 lv3
      { effect: 'iceBuff', level: 3 },   // 蓝精灵 lv3
      { effect: 'poison',  level: 3 },   // 绿精灵 lv3
    ],
    desc: '单体攻击（150伤/1.0攻速），同时为周围1.5格内所有普通塔提供+2射程光环',
    cfg: {
      name:'望远镜', icon:'🔭', color:'#88ccff',
      desc:'单体攻击150/1s，光环：周围1.5格内普通塔射程+2格',
      dmg: 150, range: 3.0, rate: 1.0, effect: 'scopeAura', effectPower: 1,
      aoeRange: 1.5, rangeBonus: 2, special: true,
    },
  },
  {
    id: 'gunner',
    name: '火枪手',
    icon: '🔫',
    color: '#ffaa44',
    ingredients: [
      { effect: 'scopeAura',     level: 1 },   // 望远镜
      { effect: 'thunderSingle', level: 4 },   // 黄精灵 lv4
      { effect: 'whiteAoe',      level: 4 },   // 白精灵 lv4
    ],
    desc: '单体攻击，同时为周围1.5格内所有普通塔提供+2射程和+30%攻速光环',
    cfg: {
      name:'火枪手', icon:'🔫', color:'#ffaa44',
      desc:'单体攻击（350伤），攻速1.5/s，范围3格；光环：周围1.5格内普通塔射程+2格、攻速×1.3',
      dmg: 350, range: 3.0, rate: 1.5, effect: 'gunnerAura', effectPower: 1.3,
      aoeRange: 1.5, rangeBonus: 2, special: true,
    },
  },
  {
    id: 'sniper',
    name: '神枪手',
    icon: '🎯',
    color: '#ff6622',
    ingredients: [
      { effect: 'gunnerAura', level: 1 },   // 火枪手
      { effect: 'poison',     level: 4 },   // 绿精灵 lv4
      { effect: 'whiteAoe',   level: 5 },   // 白精灵 lv5
    ],
    desc: '单体攻击，同时为周围1.5格内所有普通塔提供+3射程和+100%攻速光环（攻速翻倍）',
    cfg: {
      name:'神枪手', icon:'🎯', color:'#ff6622',
      desc:'单体攻击（600伤），攻速1.2/s，范围3.5格；光环：周围1.5格内普通塔射程+3格、攻速×2.0（+100%）',
      dmg: 600, range: 3.5, rate: 1.2, effect: 'sniperAura', effectPower: 2.0,
      aoeRange: 1.5, rangeBonus: 3, special: true,
    },
  },
  {
    id: 'rainbow',
    name: '彩精灵',
    icon: '🌈',
    color: '#ff88ff',
    ingredients: [
      { effect: 'burn',           level: 5 },  // 红精灵 lv5
      { effect: 'iceBuff',        level: 5 },  // 蓝精灵 lv5
      { effect: 'thunderSingle',  level: 5 },  // 黄精灵 lv5
    ],
    desc: '无法攻击，使自身左右各1格的塔攻击力+70%（在两侧塔之间持续显示彩色动态光线）',
    cfg: {
      name:'彩精灵', icon:'🌈', color:'#ff88ff',
      desc:'光环：使左右各1格的塔攻击力×1.7（+70%），以彩色光线相连',
      dmg: 0, range: 0, rate: 0, effect: 'rainbowAura', effectPower: 1.7,
      aoeRange: 1, special: true,
    },
  },
  {
    id: 'yanluo',
    name: '阎王',
    icon: '👹',
    color: '#cc0000',
    ingredients: [
      { effect: 'shadowDemonAtk',  level: 1 },  // 影魔
      { effect: 'blackArmorBreak', level: 5 },  // 黑精灵 lv5
      { effect: 'poison',          level: 5 },  // 绿精灵 lv5
    ],
    desc: '双体物理攻击1200，继承影魔灵魂并继续收集（每魂+50攻），每12秒恐惧波（范围4格，受伤+30%，反向走1.5s，怪物变紫）；持续光环：周围4格内怪物护甲-20',
    cfg: {
      name:'阎王', icon:'👹', color:'#cc0000',
      desc:'双体物理1200（+魂×50），继承&收集灵魂（每魂+50攻），攻速1/s，范围3.5格；每12s恐惧波（范围4格，受伤+30%，反向走1.5s）；持续光环：周围4格内怪物护甲-20',
      dmg: 1200, range: 3.5, rate: 1.0, effect: 'yanluoAtk', effectPower: 0,
      aoeRange: 4, armorDebuffAura: 20, special: true,
    },
  },
];

// 每帧更新：检测满足特殊配方的塔，写入高亮集合
let specialHighlightKeys = new Set();

function updateSpecialRecipeHighlights() {
  specialHighlightKeys.clear();
  const towers = state.towers;
  SPECIAL_RECIPES.forEach(recipe => {
    // 收集所有需求项（含触发塔）
    const needed = [...recipe.ingredients]; // [{effect, level}]
    // 找所有满足需求的候选分组（简单贪心匹配）
    const available = Object.entries(towers).map(([key, t]) => ({
      key, effect: t.cfg.effect, level: t.level || 1,
    }));
    // 尝试为每一个需求项找到对应的塔
    const used = new Set();
    const matched = [];
    let allFound = true;
    for (const req of needed) {
      const found = available.find(t => !used.has(t.key) && t.effect === req.effect && t.level === req.level);
      if (!found) { allFound = false; break; }
      used.add(found.key);
      matched.push(found.key);
    }
    if (allFound) {
      matched.forEach(k => specialHighlightKeys.add(k));
    }
  });
}

// 检测某座塔（key）点击时，可触发哪条配方（返回recipe或null）
function getAvailableSpecialRecipe(clickedKey) {
  const clickedTower = state.towers[clickedKey];
  if (!clickedTower) return null;

  // 解析 clickedKey 的行列坐标，用于就近原则排序
  const [clickedRow, clickedCol] = clickedKey.split(',').map(Number);
  function distToClicked(key) {
    const [r, c] = key.split(',').map(Number);
    return (r - clickedRow) ** 2 + (c - clickedCol) ** 2;
  }

  for (const recipe of SPECIAL_RECIPES) {
    const clickedEffect = clickedTower.cfg.effect;
    const clickedLevel  = clickedTower.level || 1;

    // 检查被点击的塔是否满足配方中某个食材需求
    const clickedMatchIdx = recipe.ingredients.findIndex(
      req => req.effect === clickedEffect && req.level === clickedLevel
    );
    if (clickedMatchIdx === -1) continue; // 点击的塔与此配方无关，跳过

    // 将被点击的塔强制锁入匹配，再贪心匹配剩余食材
    // 候选列表按离 clickedKey 的距离升序排列（就近原则）
    const available = Object.entries(state.towers)
      .filter(([k]) => k !== clickedKey)
      .map(([key, t]) => ({ key, effect: t.cfg.effect, level: t.level || 1 }))
      .sort((a, b) => distToClicked(a.key) - distToClicked(b.key));

    const used = new Set([clickedKey]); // clickedKey 已占用
    const matchedKeys = [];
    // 将配方食材列表中排除掉 clickedMatchIdx 对应的那一项，其余贪心匹配
    let allFound = true;
    const remainingReqs = recipe.ingredients.filter((_, i) => i !== clickedMatchIdx);
    for (const req of remainingReqs) {
      const found = available.find(t => !used.has(t.key) && t.effect === req.effect && t.level === req.level);
      if (!found) { allFound = false; break; }
      used.add(found.key);
      matchedKeys.push(found.key);
    }
    if (!allFound) continue;

    // clickedKey 放在 matchedKeys 第一位（合成结果将留在此处）
    return { recipe, matchedKeys: [clickedKey, ...matchedKeys] };
  }
  return null;
}

// 执行特殊合成：消耗所有食材，在触发塔位置生成特殊塔
function craftSpecialTower(clickedKey) {
  const result = getAvailableSpecialRecipe(clickedKey);
  if (!result) return;
  const { recipe, matchedKeys } = result;
  // 删除所有食材塔（保留clicked位置用于放置新塔）
  matchedKeys.forEach(k => {
    if (k !== clickedKey) delete state.towers[k];
  });
  // 生成特殊塔
  // 阎王合成时继承影魔灵魂数量
  let inheritedSouls = 0;
  if (recipe.id === 'yanluo') {
    matchedKeys.forEach(k => {
      const t = state.towers[k];
      if (t && (t.cfg.effect === 'shadowDemonAtk') && t.souls) {
        inheritedSouls = Math.max(inheritedSouls, t.souls);
      }
    });
  }
  state.towers[clickedKey] = {
    cfg: recipe.cfg,
    level: 1,
    cooldown: 0,
    buffMult: 1,
    atkBuffMult: 1,
    specialCooldown: 0,  // 冰霜波冷却
    isSpecial: true,
    souls: inheritedSouls, // 灵魂计数（影魔/阎王专用）
  };
  hideTowerTooltip();
  state.selectedTowerKey = null;
  // 合成粒子特效
  const [r, c] = clickedKey.split(',').map(Number);
  const px = c*CELL+CELL/2, py = r*CELL+CELL/2;
  for (let i = 0; i < 30; i++) {
    state.particles.push(new Particle(px, py,
      (Math.random()-0.5)*200, (Math.random()-0.5)*200,
      recipe.cfg.color, Math.random()*6+3, 0.8));
  }
  // 若合成了银行，立即同步更新核弹按钮价格
  if (recipe.cfg.effect === 'bankAtk') {
    updateNukeUI();
  }
  renderRecipes();
}

// ========== 波次生成 ==========
// 共30波数据，按大关编号(1/2/3)分别使用不同强度（来自关卡表.xlsx）
// 类型：normal/boss/swarm/magicImm/heavyArmor/treasure

// 三大关原始数据（血量/防御/数量/速度 来自Excel，其余字段保持统一结构）
const STAGE_RAW_DATA = {
  1: [
    // W1  ~W5
    { waveType:'normal', count:5, hp:120, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:217, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:330, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:6, hp:421, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:7, hp:260, defense:2, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W6~W10
    { waveType:'normal', count:8, hp:631, defense:4, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:9, hp:756, defense:6, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:897, defense:8, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'swarm', count:20, hp:529, defense:10, speed:175, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:9963, defense:10, speed:70, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W11~W15
    { waveType:'normal', count:10, hp:1463, defense:12, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:567, defense:60, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:2020, defense:14, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:2379, defense:16, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:1403, defense:18, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W16~W20
    { waveType:'treasure', count:1, hp:33190, defense:20, speed:72, boss:false, burnImmune:false, slowImmune:true, chainImmune:false, frozenImmune:true, drawReward:1, isTreasure:true, treasureReward:20, expOrbs:0 },
    { waveType:'normal', count:10, hp:3936, defense:22, speed:74, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:4680, defense:24, speed:76, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:2790, defense:24, speed:195, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:40034, defense:25, speed:80, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W21~W25
    { waveType:'normal', count:10, hp:7999, defense:25, speed:82, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:3172, defense:100, speed:84, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:11577, defense:26, speed:86, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:13974, defense:28, speed:88, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:8449, defense:30, speed:90, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W26~W30
    { waveType:'normal', count:10, hp:20468, defense:32, speed:92, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:24831, defense:34, speed:94, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:30164, defense:36, speed:96, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:18343, defense:38, speed:245, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:223323, defense:40, speed:100, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:0, reward:20, expOrbs:0 },
  ],
  2: [
    // W1  ~W5
    { waveType:'normal', count:5, hp:150, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:266, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:396, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:6, hp:506, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:7, hp:315, defense:2, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W6~W10
    { waveType:'normal', count:8, hp:770, defense:4, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:9, hp:930, defense:6, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:1116, defense:8, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'swarm', count:20, hp:667, defense:10, speed:175, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:12717, defense:10, speed:70, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W11~W15
    { waveType:'normal', count:10, hp:1894, defense:12, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:745, defense:60, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:2697, defense:14, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:3228, defense:16, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:1936, defense:18, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W16~W20
    { waveType:'treasure', count:1, hp:46593, defense:20, speed:72, boss:false, burnImmune:false, slowImmune:true, chainImmune:false, frozenImmune:true, drawReward:1, isTreasure:true, treasureReward:20, expOrbs:0 },
    { waveType:'normal', count:10, hp:5621, defense:22, speed:74, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:6801, defense:24, speed:76, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:4125, defense:24, speed:195, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:60211, defense:25, speed:80, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W21~W25
    { waveType:'normal', count:10, hp:12235, defense:25, speed:82, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:4933, defense:100, speed:84, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:18301, defense:26, speed:86, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:22445, defense:28, speed:88, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:13785, defense:30, speed:90, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W26~W30
    { waveType:'normal', count:10, hp:33911, defense:32, speed:92, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:41762, defense:34, speed:94, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:51483, defense:36, speed:96, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:31762, defense:38, speed:245, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:392214, defense:40, speed:100, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:0, reward:20, expOrbs:0 },
  ],
  3: [
    // W1  ~W5
    { waveType:'normal', count:5, hp:180, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:316, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:5, hp:464, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:6, hp:596, defense:2, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:7, hp:373, defense:2, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W6~W10
    { waveType:'normal', count:8, hp:920, defense:4, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:9, hp:1123, defense:6, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:1363, defense:8, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'swarm', count:20, hp:824, defense:10, speed:175, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:15921, defense:10, speed:70, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W11~W15
    { waveType:'normal', count:10, hp:2405, defense:12, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:960, defense:60, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:3528, defense:14, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:4289, defense:16, speed:70, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:2614, defense:18, speed:70, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W16~W20
    { waveType:'treasure', count:1, hp:63916, defense:20, speed:72, boss:false, burnImmune:false, slowImmune:true, chainImmune:false, frozenImmune:true, drawReward:1, isTreasure:true, treasureReward:20, expOrbs:0 },
    { waveType:'normal', count:10, hp:7837, defense:22, speed:74, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:9635, defense:24, speed:76, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:5938, defense:24, speed:195, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:88045, defense:25, speed:80, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, reward:20, expOrbs:10 },
    // W21~W25
    { waveType:'normal', count:10, hp:18170, defense:25, speed:82, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'heavyArmor', count:10, hp:7439, defense:100, speed:84, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:28014, defense:26, speed:86, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:34866, defense:28, speed:88, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'magicImm', count:10, hp:21725, defense:30, speed:90, boss:false, burnImmune:true, slowImmune:true, chainImmune:true, frozenImmune:true, drawReward:2, expOrbs:1 },
    // W26~W30
    { waveType:'normal', count:10, hp:54206, defense:32, speed:92, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'normal', count:10, hp:67691, defense:34, speed:94, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, expOrbs:1 },
    { waveType:'normal', count:10, hp:84599, defense:36, speed:96, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:1, expOrbs:1 },
    { waveType:'swarm', count:25, hp:52902, defense:38, speed:245, boss:false, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:2, spawnInterval:0.38, expOrbs:1 },
    { waveType:'boss', count:1, hp:661996, defense:40, speed:100, boss:true, burnImmune:false, slowImmune:false, chainImmune:false, frozenImmune:false, drawReward:0, reward:20, expOrbs:0 },
  ],
};

function buildWavesForStage(stage) {
  const RAW = STAGE_RAW_DATA[stage] || STAGE_RAW_DATA[1];
  return RAW.map(w => ({
    count:          w.count,
    hp:             w.hp,
    speed:          w.speed,
    defense:        w.defense,
    reward:         w.reward ?? 20,
    boss:           w.boss,
    burnImmune:     w.burnImmune,
    slowImmune:     w.slowImmune,
    chainImmune:    w.chainImmune,
    frozenImmune:   w.frozenImmune ?? false,
    waveType:       w.waveType,
    drawReward:     w.drawReward,
    expOrbs:        w.expOrbs ?? 1,
    ...(w.isTreasure    ? { isTreasure: true, treasureReward: w.treasureReward } : {}),
    ...(w.spawnInterval ? { spawnInterval: w.spawnInterval } : {}),
  }));
}

// ========== 全局关卡状态 ==========
let currentStage = 1; // 当前大关编号（1/2/3）
let WAVES = buildWavesForStage(currentStage);

// ========== 游戏状态 ==========
let state = {};

// 难度选择已移除，关卡难度由 WAVES 数据直接体现（三大关）

function initState() {
  state = {
    gold: 100,
    escaped: 0,
    wave: 0,
    phase: 'idle',
    difficulty: 'normal',
    diffMult: 1,
    monsters: [],
    towers: {},
    particles: [],
    projectiles: [],
    coinDrops: [],        // 掉落金币列表
    expOrbs:   [],        // 掉落经验球列表
    snowstorms: [],       // 雪王暴风雪区域
    nukes: 0,             // 持有核弹数量
    nukingMode: false,    // 是否处于核弹选点模式
    nukeEffects: [],      // 核弹爆炸特效列表
    placingTower: null,
    placingRock: false,
    hoverCell: null,
    mouseX: 0, mouseY: 0,
    selectedTowerKey: null,
    upgradingTower: null,
    waveTimer: 0,
    spawnTimer: 0,
    spawnQueue: 0,
    speedMult: 1,
    tick: 0,
    drawModalCards: [],
    drawModalSelected: null,
    placingFromDraw: false,
    // 新抽卡系统：每次抽5张，直接出 X级Y塔，选1张放置
    drawCost: 100,        // 抽卡费用固定100金币（内部保留，刷新仍用）
    drawLevel: 1,         // 向后兼容字段，等同于playerLevel
    playerLevel: 1,       // 玩家等级（1-5），影响抽出各等级卡的概率
    exp: 0,               // 当前经验值（0~99）
    lastDrawCost: 0,
    drawTickets: 2,       // 免费抽卡次数：开局赠2次，每波结束+2
    globalAtkMult: 1,     // 全局攻击力倍率（升级后累积）
  };
  state.rocks = {};
}

// ========== 怪物 ==========
class Monster {
  constructor(hp, speed, reward, isBoss, defense, opts = {}) {
    this.pathIdx = 0;
    this.progress = 0;
    this.isMap4 = false;
    this.map4Path = null;
    const [sr, sc] = PATH_CELLS[0];
    this.x = sc * CELL + CELL / 2;
    this.y = sr * CELL + CELL / 2;
    this.maxHp = hp;
    this.hp = hp;
    this.speed = speed;
    this.reward = reward;
    this.isBoss = isBoss;
    this.defense = defense || 0;
    this.dead = false;
    this.escaped = false;
    this.dir = 'right';
    this.animTick = Math.random() * Math.PI * 2;
    this.slowLayers = [];       // [{factor:0~1, timer:秒}] 乘法叠加减速层
    this.burnTimer = 0;
    this.burnDmg = 0;
    this.poisonTimer = 0;
    this.poisonDmg = 0;
    this.poisonSourceKey = null;
    this.frozen = false;
    this.frozenTimer = 0;
    this.defDebuff = 0;        // 兼容旧字段（光环等仍使用）
    this.defDebuffTimer = 0;   // 兼容旧字段
    // 新：按 debuffType 独立计时的减甲 Map
    // key: debuffType string, value: { value(累计减甲值), timer(剩余秒) }
    this.armorDebuffs = new Map();
    this.armorPctDebuff = 0; // 百分比减甲（凤凰专用，0~1，值越高护甲越低）
    // 恐惧状态（阎王专用）
    this.fearTimer = 0;       // 恐惧持续时间
    this.fearDamageMult = 1;  // 恐惧期间受伤倍率（1.3）
    // 魔免属性
    this.burnImmune   = opts.burnImmune   || false;
    this.slowImmune   = opts.slowImmune   || false;
    this.chainImmune  = opts.chainImmune  || false;
    this.frozenImmune = opts.frozenImmune || false;
    this.isMagicImm   = opts.burnImmune || opts.slowImmune || opts.chainImmune || opts.frozenImmune;
    // 宝箱关专属
    this.isTreasure      = opts.isTreasure      || false;
    this.treasureReward  = opts.treasureReward  || 0;
    // 下一次掉金币时的血量阈值：每损失 maxHp/40 触发一次
    this.treasureNextCoinHp = hp - Math.floor(hp / 40);
    // 检查点扣金币标记（每只怪每个检查点仅触发一次）
    this.cp1Hit = false;
    this.cp2Hit = false;
    this.id = Math.random();
  }

  update(dt) {
    // 动画速率与实际移动速度成正比：速度20→系数0.8，速度200→系数8
    const effSlow = calcEffectiveSlow(this);
    const effSpeed = this.speed * effSlow * state.speedMult;
    const animRate = Math.max(0.8, Math.min(8, effSpeed / 25));
    this.animTick += dt * animRate;
    // 灼烧 tick（魔法伤害：不计护甲，魔免单位免疫）
    if (!this.burnImmune && this.burnTimer > 0) {
      this.burnTimer -= dt;
      const fearMult = (this.fearTimer > 0) ? (this.fearDamageMult || 1.3) : 1;
      const burnTick = this.burnDmg * dt * fearMult;
      this.hp -= burnTick;
      if (this.burnSourceKey && state.towers[this.burnSourceKey]) {
        state.towers[this.burnSourceKey].damageDealt = (state.towers[this.burnSourceKey].damageDealt || 0) + burnTick;
        state.towers[this.burnSourceKey].magicDmg = (state.towers[this.burnSourceKey].magicDmg || 0) + burnTick;
      }
      if (this.hp <= 0) { this.die(); return; }
    }
    // 毒素 tick（独立字段，淡紫色，无魔免检测）
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      const poisonTick = this.poisonDmg * dt;
      this.hp -= poisonTick;
      if (this.poisonSourceKey && state.towers[this.poisonSourceKey]) {
        state.towers[this.poisonSourceKey].damageDealt =
          (state.towers[this.poisonSourceKey].damageDealt || 0) + poisonTick;
        state.towers[this.poisonSourceKey].magicDmg = (state.towers[this.poisonSourceKey].magicDmg || 0) + poisonTick;
      }
      if (this.hp <= 0) { this.die(); return; }
    }
    // 宝箱关：每损失 maxHp/40 掉一颗金币
    if (this.isTreasure && this.hp < this.treasureNextCoinHp && this.hp > 0) {
      const step = Math.floor(this.maxHp / 40);
      while (this.hp < this.treasureNextCoinHp && this.treasureNextCoinHp > 0) {
        spawnCoinDrop(this.x, this.y, this.treasureReward);
        this.treasureNextCoinHp -= step;
      }
    }
    // frozen
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      this.frozen = this.frozenTimer > 0;
    }
    // 减速层衰减（slowLayers 每帧递减 timer，过期移除）
    if (this.slowImmune) {
      this.slowLayers = [];
    } else if (this.slowLayers.length > 0) {
      this.slowLayers = this.slowLayers.filter(layer => {
        layer.timer -= dt;
        return layer.timer > 0;
      });
    }
    // defDebuff timer（旧字段，用于光环等）
    if (this.defDebuffTimer > 0) {
      this.defDebuffTimer -= dt;
      if (this.defDebuffTimer <= 0) this.defDebuff = 0;
    }
    // 新：独立 debuffType 计时，过期则移除
    if (this.armorDebuffs && this.armorDebuffs.size > 0) {
      for (const [type, entry] of this.armorDebuffs) {
        entry.timer -= dt;
        if (entry.timer <= 0) this.armorDebuffs.delete(type);
      }
    }
    // 恐惧状态计时
    if (this.fearTimer > 0) {
      this.fearTimer -= dt;
      if (this.fearTimer <= 0) {
        this.fearTimer = 0;
        this.fearDamageMult = 1;
      }
    }
    if (this.frozen) return;

    // 移速下限 10（clamp），配合 calcEffectiveSlow 乘法叠加+70%衰减
    const rawSpd = this.speed * calcEffectiveSlow(this) * state.speedMult;
    const spd = Math.max(rawSpd, 10 * state.speedMult);
    const totalDist = spd * dt;
    let rem = totalDist;

    {
      // ── 恐惧状态：沿路径反向移动
      if (this.fearTimer > 0 && this.pathIdx > 0) {
        let fearRem = totalDist;
        while (fearRem > 0 && this.pathIdx > 0) {
          const [pr, pc] = PATH_CELLS[this.pathIdx - 1];
          const tx2 = pc * CELL + CELL / 2, ty2 = pr * CELL + CELL / 2;
          const dx2 = tx2 - this.x, dy2 = ty2 - this.y;
          const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
          if (dist2 < 1) { this.pathIdx--; continue; }
          if (Math.abs(dx2) > Math.abs(dy2)) this.dir = dx2 > 0 ? 'right' : 'left';
          else this.dir = dy2 > 0 ? 'down' : 'up';
          if (fearRem >= dist2) {
            fearRem -= dist2; this.x = tx2; this.y = ty2; this.pathIdx--;
          } else {
            const ratio = fearRem / dist2;
            this.x += dx2*ratio; this.y += dy2*ratio; fearRem = 0;
          }
        }
        return;
      }
      while (rem > 0 && this.pathIdx < PATH_CELLS.length - 1) {
        const [cr, cc] = PATH_CELLS[this.pathIdx];
        const [nr, nc] = PATH_CELLS[this.pathIdx + 1];
        const tx = nc * CELL + CELL / 2, ty = nr * CELL + CELL / 2;
        const dx = tx - this.x, dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 1) { this.pathIdx++; continue; }
        if (rem >= dist) {
          rem -= dist; this.x = tx; this.y = ty; this.pathIdx++;
          if (dx > 1) this.dir = 'right'; else if (dx < -1) this.dir = 'left';
          else if (dy > 1) this.dir = 'down'; else this.dir = 'up';
        } else {
          const ratio = rem / dist;
          this.x += dx*ratio; this.y += dy*ratio; rem = 0;
          if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
          else this.dir = dy > 0 ? 'down' : 'up';
        }
      }
      if (this.pathIdx >= PATH_CELLS.length - 1) { this.escaped = true; this.dead = true; }
      // ── 检查点扣金币 ──
      if (!this.dead) {
        const curCell = PATH_CELLS[this.pathIdx];
        if (curCell) {
          const [cr2, cc2] = curCell;
          // 目标点1 (10,0)：扣3金币
          if (!this.cp1Hit && cr2 === PATH_CHECKPOINT1[0] && cc2 === PATH_CHECKPOINT1[1]) {
            this.cp1Hit = true;
            state.gold = Math.max(0, state.gold - 3);
            updateHUD();
            spawnCheckpointPenalty(this.x, this.y, '-3💰 目标点1');
          }
          // 目标点2 (0,10)：扣5金币
          if (!this.cp2Hit && cr2 === PATH_CHECKPOINT2[0] && cc2 === PATH_CHECKPOINT2[1]) {
            this.cp2Hit = true;
            state.gold = Math.max(0, state.gold - 5);
            updateHUD();
            spawnCheckpointPenalty(this.x, this.y, '-5💰 目标点2');
          }
        }
      }
    }
  }

  die() {
    this.dead = true;
    // 掉落经验球：从当前波次配置读取每只怪掉落的经验球数量
    const waveIdx = Math.max(0, (state.wave || 1) - 1);
    const waveDef = WAVES[waveIdx] || {};
    const orbCount = waveDef.expOrbs ?? 1;
    if (orbCount > 0) {
      for (let b = 0; b < orbCount; b++) {
        const ox = orbCount > 1 ? (Math.random() - 0.5) * 56 : 0;
        const oy = orbCount > 1 ? (Math.random() - 0.5) * 56 : 0;
        spawnExpOrb(this.x + ox, this.y + oy);
      }
    }
    // death particles
    for (let i = 0; i < 14; i++) {
      state.particles.push(new Particle(
        this.x, this.y,
        (Math.random()-0.5)*160, (Math.random()-0.5)*160,
        this.isBoss ? '#ffd700' : '#ff6655',
        Math.random()*5+3, 0.7
      ));
    }
  }
}

// ========== 粒子 ==========
class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 120 * dt;
    this.vx *= 0.95;
    this.life -= dt;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ========== 子弹 ==========
class Projectile {
  constructor(x, y, target, dmg, color, effect, effectPower, towerKey) {
    this.x = x; this.y = y;
    this.target = target;
    this.dmg = dmg;
    this.color = color;
    this.effect = effect;
    this.effectPower = effectPower;
    this.towerKey = towerKey;
    this.speed = 320;
    this.dead = false;
    this.size = effect === 'chain' || effect === 'plasma' ? 8 : 5;
    // 烈焰塔火球：记录尾迹点
    this.trail = [];
  }
  update(dt) {
    if (!this.target || this.target.dead) { this.dead = true; return; }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 10) {
      this.hit();
      return;
    }
    const spd = this.speed * state.speedMult;
    // 烈焰塔火球：记录尾迹
    if (this.effect === 'burn') {
      this.trail.push({ x: this.x, y: this.y, life: 1 });
      if (this.trail.length > 8) this.trail.shift();
      this.trail.forEach(t => t.life -= dt * 4);
      this.trail = this.trail.filter(t => t.life > 0);
    }
    this.x += (dx/dist)*spd*dt;
    this.y += (dy/dist)*spd*dt;
  }
  hit() {
    this.dead = true;
    if (!this.target || this.target.dead) return;
    applyEffect(this.target, this.dmg, this.effect, this.effectPower, this.x, this.y, this.towerKey);
    // hit spark
    for (let i = 0; i < 5; i++) {
      state.particles.push(new Particle(
        this.target.x, this.target.y,
        (Math.random()-0.5)*80, (Math.random()-0.5)*80,
        this.color, Math.random()*3+2, 0.3
      ));
    }
  }
  draw(ctx) {
    const now = Date.now() / 1000;
    const sz = this.size;
    const px = this.x, py = this.y;

    if (this.effect === 'burn') {
      // ── 烈焰塔火球：橙黄渐变圆球 + 尾焰
      this.trail.forEach((t, i) => {
        ctx.globalAlpha = t.life * 0.5;
        const r = sz * t.life * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ffaa00';
        ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0.5, r), 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      const grad = ctx.createRadialGradient(px-1, py-1, 0, px, py, sz+2);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#ffee00');
      grad.addColorStop(0.7, '#ff6600'); grad.addColorStop(1, 'rgba(200,40,0,0)');
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, sz+2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (this.effect === 'lavaWave') {
      // ── 熔岩塔：橙红熔岩球 + 熔融外圈
      const lGrad = ctx.createRadialGradient(px-1, py-1, 0, px, py, sz+3);
      lGrad.addColorStop(0, '#ffffff');
      lGrad.addColorStop(0.2, '#ffcc00');
      lGrad.addColorStop(0.6, '#ff4400');
      lGrad.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 12;
      ctx.fillStyle = lGrad;
      ctx.beginPath(); ctx.arc(px, py, sz+3, 0, Math.PI*2); ctx.fill();
      // 熔融流滴（3个小泡）
      for (let i = 0; i < 3; i++) {
        const a = now*4 + i*Math.PI*2/3;
        const bx = px + Math.cos(a) * (sz+1), by = py + Math.sin(a) * (sz+1);
        ctx.fillStyle = 'rgba(255,180,0,0.6)';
        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;

    } else if (this.effect === 'dualFrost') {
      // ── 冰炎塔：蓝白双色旋转冰晶
      ctx.save(); ctx.translate(px, py); ctx.rotate(now * 4);
      // 外辉光
      const fGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz+3);
      fGrad.addColorStop(0, '#ffffff');
      fGrad.addColorStop(0.4, '#88ddff');
      fGrad.addColorStop(1, 'rgba(50,150,255,0)');
      ctx.fillStyle = fGrad;
      ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, sz+3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 六角冰晶
      ctx.strokeStyle = 'rgba(180,240,255,0.85)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = i*Math.PI/3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*(sz+1), Math.sin(a)*(sz+1)); ctx.stroke();
      }
      ctx.restore();

    } else if (this.effect === 'chainLightning') {
      // ── 风雷塔：紫色电球 + 小电弧
      const eGrad = ctx.createRadialGradient(px, py, 0, px, py, sz+4);
      eGrad.addColorStop(0, '#ffffff');
      eGrad.addColorStop(0.3, '#dd88ff');
      eGrad.addColorStop(0.7, '#9944cc');
      eGrad.addColorStop(1, 'rgba(80,20,120,0)');
      ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 14;
      ctx.fillStyle = eGrad;
      ctx.beginPath(); ctx.arc(px, py, sz+4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 表面闪烁小电弧
      ctx.strokeStyle = 'rgba(220,180,255,0.7)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const a = now*5 + i*Math.PI*2/3;
        const ex = px + Math.cos(a)*(sz-1), ey = py + Math.sin(a)*(sz-1);
        const ex2 = px + Math.cos(a+0.5)*(sz+3), ey2 = py + Math.sin(a+0.5)*(sz+3);
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex2, ey2); ctx.stroke();
      }

    } else if (this.effect === 'jellyAtk') {
      // ── 水母塔：蓝色水母形弹丸
      ctx.save(); ctx.translate(px, py);
      const jGrad = ctx.createRadialGradient(0, -sz*0.3, 0, 0, 0, sz+4);
      jGrad.addColorStop(0, '#eeffff');
      jGrad.addColorStop(0.5, '#66aaff');
      jGrad.addColorStop(1, 'rgba(30,80,200,0)');
      ctx.shadowColor = '#4488ff'; ctx.shadowBlur = 12;
      ctx.fillStyle = jGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 触手（4条短线）
      ctx.strokeStyle = 'rgba(100,180,255,0.6)'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const ta = now*3 + i*Math.PI/2;
        const tx = Math.cos(ta)*sz, ty = Math.sin(ta)*sz;
        ctx.beginPath(); ctx.moveTo(tx*0.6, ty*0.6);
        ctx.quadraticCurveTo(tx*0.9+Math.sin(now*5+i)*3, ty*0.9, tx+Math.cos(now*5+i)*2, ty+2);
        ctx.stroke();
      }
      ctx.restore();

    } else if (this.effect === 'hailstorm') {
      // ── 风暴塔：蓝白冰雹球
      const hGrad = ctx.createRadialGradient(px-1, py-1, 0, px, py, sz+2);
      hGrad.addColorStop(0, '#ffffff');
      hGrad.addColorStop(0.5, '#aaddff');
      hGrad.addColorStop(1, 'rgba(50,150,220,0)');
      ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 8;
      ctx.fillStyle = hGrad;
      ctx.beginPath(); ctx.arc(px, py, sz+2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;

    } else if (this.effect === 'frostArrowAtk') {
      // ── 寒冰：蓝色冰矛弹丸
      ctx.save(); ctx.translate(px, py);
      const faGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz+3);
      faGrad.addColorStop(0, '#ffffff');
      faGrad.addColorStop(0.4, '#88eeff');
      faGrad.addColorStop(1, 'rgba(20,150,220,0)');
      ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 10;
      ctx.fillStyle = faGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+3, 0, Math.PI*2); ctx.fill();
      // 冰晶闪光（4条短线）
      ctx.strokeStyle = 'rgba(180,240,255,0.8)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const a = now*6 + i * Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*sz*0.4, Math.sin(a)*sz*0.4);
        ctx.lineTo(Math.cos(a)*(sz+3), Math.sin(a)*(sz+3));
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

    } else if (this.effect === 'snowKing') {
      // ── 雪王：六角冰晶弹丸
      ctx.save(); ctx.translate(px, py); ctx.rotate(now*2);
      ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ccf0ff'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = i*Math.PI/3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*(sz+3), Math.sin(a)*(sz+3)); ctx.stroke();
        // 小分叉
        const mid = (sz+3)*0.6;
        const a2 = a+0.3, a3 = a-0.3;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*mid, Math.sin(a)*mid);
        ctx.lineTo(Math.cos(a2)*(mid+3), Math.sin(a2)*(mid+3)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*mid, Math.sin(a)*mid);
        ctx.lineTo(Math.cos(a3)*(mid+3), Math.sin(a3)*(mid+3)); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

    } else if (this.effect === 'vajraAtk') {
      // ── 金刚：金色能量球 + 旋转光环
      ctx.save(); ctx.translate(px, py);
      const vGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz+4);
      vGrad.addColorStop(0, '#ffffff');
      vGrad.addColorStop(0.3, '#ffe44a');
      vGrad.addColorStop(0.7, '#ff9900');
      vGrad.addColorStop(1, 'rgba(180,80,0,0)');
      ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 16;
      ctx.fillStyle = vGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 旋转光环
      ctx.rotate(now*3);
      ctx.strokeStyle = 'rgba(255,220,80,0.7)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.arc(0, 0, sz+2, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

    } else if (this.effect === 'greatVajraAtk') {
      // ── 大金刚：更大的金橙色能量球 + 双旋转光环
      ctx.save(); ctx.translate(px, py);
      const gvGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz+6);
      gvGrad.addColorStop(0, '#ffffff');
      gvGrad.addColorStop(0.25, '#ffdd00');
      gvGrad.addColorStop(0.6, '#ff8800');
      gvGrad.addColorStop(1, 'rgba(200,60,0,0)');
      ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 22;
      ctx.fillStyle = gvGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+6, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 外旋转光环
      ctx.rotate(now * 4);
      ctx.strokeStyle = 'rgba(255,200,0,0.75)'; ctx.lineWidth = 2;
      ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.arc(0, 0, sz+5, 0, Math.PI*2); ctx.stroke();
      // 内旋转光环（反向）
      ctx.rotate(-now * 8);
      ctx.strokeStyle = 'rgba(255,255,180,0.5)'; ctx.lineWidth = 1;
      ctx.setLineDash([3,5]);
      ctx.beginPath(); ctx.arc(0, 0, sz+2, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

    } else if (this.effect === 'skyLord') {
      // ── 流浪剑客（原天帝）：彩虹光球
      ctx.save(); ctx.translate(px, py);
      const sGrad = ctx.createRadialGradient(0, -1, 0, 0, 0, sz+5);
      sGrad.addColorStop(0,   '#ffffff');
      sGrad.addColorStop(0.2, '#ffeeaa');
      sGrad.addColorStop(0.45,'#88ffcc');
      sGrad.addColorStop(0.7, '#8888ff');
      sGrad.addColorStop(1,   'rgba(100,50,200,0)');
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18;
      ctx.fillStyle = sGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 旋转光晕环
      ctx.rotate(now*1.5);
      ctx.strokeStyle = 'rgba(200,200,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6,5]);
      ctx.beginPath(); ctx.arc(0, 0, sz+3, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

    } else if (this.effect === 'shadowDemonAtk') {
      // ── 影魔：紫色魔气球 + 旋转灵魂光环
      ctx.save(); ctx.translate(px, py);
      const sdGrad = ctx.createRadialGradient(0, -1, 0, 0, 0, sz+5);
      sdGrad.addColorStop(0, '#ffffff');
      sdGrad.addColorStop(0.25, '#dd88ff');
      sdGrad.addColorStop(0.6, '#9933cc');
      sdGrad.addColorStop(1, 'rgba(60,0,100,0)');
      ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 16;
      ctx.fillStyle = sdGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 旋转紫色光弧（3条）
      ctx.rotate(now * 4);
      ctx.strokeStyle = 'rgba(200,100,255,0.7)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a1 = i * Math.PI*2/3, a2 = a1 + Math.PI*0.6;
        ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(0, 0, sz+3, a1, a2); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.restore();

    } else if (this.effect === 'yanluoAtk') {
      // ── 阎王：红黑炎球 + 黑色旋转碎片
      ctx.save(); ctx.translate(px, py);
      const ylGrad = ctx.createRadialGradient(0, -1, 0, 0, 0, sz+5);
      ylGrad.addColorStop(0, '#ff4444');
      ylGrad.addColorStop(0.3, '#cc0000');
      ylGrad.addColorStop(0.65, '#440000');
      ylGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.shadowColor = '#cc0000'; ctx.shadowBlur = 16;
      ctx.fillStyle = ylGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 旋转黑色碎片（4片）
      ctx.rotate(-now * 3);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI/2;
        const bx = Math.cos(a) * (sz+2), by = Math.sin(a) * (sz+2);
        ctx.fillStyle = `rgba(30,0,0,0.85)`;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(a + now*3);
        ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(3,0); ctx.lineTo(0,4); ctx.lineTo(-3,0); ctx.closePath();
        ctx.fill(); ctx.restore();
      }
      // 内核红色高光
      ctx.fillStyle = 'rgba(255,80,0,0.5)';
      ctx.beginPath(); ctx.arc(0, 0, sz*0.5, 0, Math.PI*2); ctx.fill();
      ctx.restore();

    } else if (this.effect === 'bankAtk') {
      // ── 银行：金币形弹丸（圆形+竖向椭圆压扁）
      ctx.save(); ctx.translate(px, py);
      // 外辉光
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 14;
      // 金币圆形主体
      const bkGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, sz+3);
      bkGrad.addColorStop(0, '#ffffff');
      bkGrad.addColorStop(0.3, '#ffe566');
      bkGrad.addColorStop(0.7, '#cc9900');
      bkGrad.addColorStop(1, 'rgba(100,60,0,0)');
      ctx.fillStyle = bkGrad;
      ctx.beginPath(); ctx.arc(0, 0, sz+3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 金币纹（¥符号或内圈）
      ctx.strokeStyle = 'rgba(180,120,0,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, sz, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(160,100,0,0.6)';
      ctx.font = `bold ${sz+2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.5);
      ctx.restore();

    } else {
      // 其他子弹：辉光圆球
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// 计算实际伤害：atk * 10 / (defense + 10)，最少造成1点
/**
 * 伤害计算
 * @param {number} rawDmg
 * @param {object} monster
 * @param {boolean} isPhysical  true=物理（走护甲公式），false=魔法（无护甲，魔免无效）
 */
function calcDmg(rawDmg, monster, isPhysical = true) {
  // 恐惧状态：受伤+30%
  const fearMult = (monster.fearTimer > 0) ? (monster.fearDamageMult || 1.3) : 1;
  // 凤凰光环：范围内敌人受到伤害+25%
  const damageTakenMult = monster.damageTakenMult || 1;
  if (!isPhysical) {
    // 魔法伤害：魔免单位免疫，非魔免直接全伤
    if (monster.isMagicImm) return 0;
    return Math.max(1, rawDmg * fearMult * damageTakenMult);
  }
  // 物理伤害：护甲公式
  // 先加减减甲（defDebuff + armorDebuffs之和），再乘百分比减甲（armorPctDebuff）
  let totalArmorDebuff = (monster.defDebuff || 0);
  if (monster.armorDebuffs && monster.armorDebuffs.size > 0) {
    for (const entry of monster.armorDebuffs.values()) totalArmorDebuff += entry.value;
  }
  const defAfterFlat = Math.max(0, (monster.defense || 0) - totalArmorDebuff);
  const defFinal     = defAfterFlat * (1 - (monster.armorPctDebuff || 0));
  return Math.max(1, rawDmg * fearMult * damageTakenMult * 10 / (defFinal + 10));
}

// ========== 作用效果 ==========
function applyEffect(monster, dmg, effect, power, px, py, towerKey) {
  // ── 通用单体伤害 helper（isPhysical: true=物理计算护甲，false=魔法无护甲/魔免无效）
  function dealDmg(m, d, isPhysical = true) {
    const realDmg = calcDmg(d, m, isPhysical);
    if (realDmg === 0) return false; // 魔免免疫，无伤害
    m.hp -= realDmg;
    spawnDmgNumber(m.x, m.y, realDmg);
    // 统计伤害（区分物理/魔法）
    if (towerKey && state.towers[towerKey]) {
      state.towers[towerKey].damageDealt = (state.towers[towerKey].damageDealt || 0) + realDmg;
      if (isPhysical) {
        state.towers[towerKey].physDmg = (state.towers[towerKey].physDmg || 0) + realDmg;
      } else {
        state.towers[towerKey].magicDmg = (state.towers[towerKey].magicDmg || 0) + realDmg;
      }
    }
    if (m.hp <= 0 && !m.dead) {
      if (effect === 'tri') spawnCoinDrop(m.x, m.y, Math.round(m.reward * power));
      m.die();
      // 点金手/炼金术士全局效果：怪物死亡时10%概率额外爆出金币袋（宝箱怪除外）
      if (!m.isTreasure) {
        const hasGoldTower = Object.values(state.towers).some(t => t.cfg && (t.cfg.effect === 'goldMachineGen' || t.cfg.effect === 'bankAtk'));
        if (hasGoldTower && Math.random() < 0.10) {
          spawnCoinDrop(m.x + (Math.random() - 0.5) * 12, m.y, 10);
        }
      }
      return true;
    }
    return false;
  }

  switch (effect) {

    // 烈焰塔：主炮物理，灼烧tick为魔法
    case 'burn': {
      if (dealDmg(monster, dmg, true)) break; // 物理主炮
      if (!monster.burnImmune) {
        monster.burnTimer = 3;
        monster.burnDmg = power;
        monster.burnSourceKey = towerKey; // 统计来源
      }
      for (let i = 0; i < 5; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*80, -Math.random()*80, '#ff6600', 4, 0.5));
      break;
    }

    // 雷霆塔：物理单体
    case 'thunderBuff': {
      dealDmg(monster, dmg, true);
      for (let i = 0; i < 4; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*100, (Math.random()-0.5)*100, '#ffd700', 3, 0.3));
      break;
    }

    // 冰霜塔：物理双体，命中施加减速（3秒，强度由 effectPower 决定=ICE_SLOW_FACTOR[lvl-1]）
    case 'iceBuff': {
      dealDmg(monster, dmg, true);
      applySlowLayer(monster, power, 3, 'attack');  // power = ICE_SLOW_FACTOR[level-1]
      state.particles.push(new Particle(monster.x, monster.y, 0, -30, '#aaddff', 4, 0.4));
      break;
    }

    // 普通单体（锻炉攻击/雷塔单体）：物理
    case 'normal':
    case 'thunderSingle': {
      dealDmg(monster, dmg, true);
      for (let i = 0; i < 3; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*80, (Math.random()-0.5)*80, '#ffd700', 2, 0.25));
      break;
    }

    // 白精灵：群体物理伤害（原windAoe）
    case 'whiteAoe': {
      dealDmg(monster, dmg, true);
      for (let i = 0; i < 5; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*100, (Math.random()-0.5)*100, '#ccddff', 3, 0.3));
      break;
    }

    // 黑精灵：单体中伤+减甲（独立debuff，3s，替换不叠加，再次命中只重置计时）
    case 'blackArmorBreak': {
      if (dealDmg(monster, dmg, true)) break;
      monster.armorDebuffs.set('blackArmorBreak', { value: power, timer: 3 });
      for (let i = 0; i < 4; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*70, (Math.random()-0.5)*70, '#9966cc', 3, 0.35));
      break;
    }

    // 幻影刺客：单体攻击，power=1表示暴击（已预乘20倍）
    case 'phantomAssassinAtk': {
      const isCritHit = power === 1;
      const hitX = monster.x, hitY = monster.y;
      dealDmg(monster, dmg, true);
      if (isCritHit) {
        // 暴击粒子爆发（紫白色）
        for (let i = 0; i < 20; i++) {
          const cols = ['#cc44ff', '#ffffff', '#ff88ff', '#aa00ff', '#ffccff'];
          state.particles.push(new Particle(hitX, hitY,
            (Math.random()-0.5)*140, (Math.random()-0.5)*140,
            cols[Math.floor(Math.random()*cols.length)],
            Math.random()*5+3, 0.55));
        }
        spawnDmgNumber(hitX, hitY - 10, `${dmg}!`, 'crit');
      } else {
        // 普通命中粒子
        for (let i = 0; i < 5; i++)
          state.particles.push(new Particle(hitX, hitY,
            (Math.random()-0.5)*80, (Math.random()-0.5)*80,
            '#cc44ff', 3, 0.35));
      }
      break;
    }

    // 结晶：单体攻击，power=1表示暴击（已预乘5倍），生成彩色粒子
    case 'crystalAtk': {
      const isCritHit = power === 1;
      dealDmg(monster, dmg, true);
      // 暴击时生成大量彩色爆裂粒子
      const pCount = isCritHit ? 16 : 6;
      for (let i = 0; i < pCount; i++) {
        const colors = ['#ff88cc', '#ffffff', '#ffddff', '#ff44aa', '#ffaaee'];
        state.particles.push(new Particle(
          monster.x, monster.y,
          (Math.random()-0.5)*120, (Math.random()-0.5)*120,
          colors[Math.floor(Math.random()*colors.length)],
          isCritHit ? 5 : 3, isCritHit ? 0.55 : 0.35));
      }
      if (isCritHit) spawnDmgNumber(monster.x, monster.y - 10, `${dmg}!`, 'crit');
      break;
    }

    // 黑石：3目标攻击+强力减甲（独立debuff，3s，替换不叠加，再次命中只重置计时）
    case 'blackStoneAtk': {
      if (dealDmg(monster, dmg, true)) break;
      monster.armorDebuffs.set('blackStoneAtk', { value: power, timer: 3 });
      // 黑色碎石粒子
      for (let i = 0; i < 6; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*90, (Math.random()-0.5)*90, '#7744aa', 4, 0.4));
      break;
    }

    // 毒塔：物理低伤+持续毒素（类似burn但绿色）
    case 'poison': {
      if (dealDmg(monster, dmg, true)) break;
      {
        // 毒素：独立字段，持续8秒，淡紫色视觉
        monster.poisonTimer = 8;
        monster.poisonDmg = power;
        monster.poisonSourceKey = towerKey;
      }
      for (let i = 0; i < 4; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*60, -Math.random()*60, '#44bb44', 3, 0.4));
      break;
    }

    // 熔岩塔：波形扩散+减甲 → 魔法伤害
    case 'lavaWave': {
      // 生成视觉波形（从塔位置扩散到aoeRange末端）
      const tower = state.towers[towerKey];
      if (tower) {
        const [tr2, tc2] = towerKey.split(',').map(Number);
        const twx = tc2*CELL+CELL/2, twy = tr2*CELL+CELL/2;
        const maxR = (tower.cfg.aoeRange || 2.5) * CELL;
        const duration = 0.5;
        lavaWaves.push({ cx: twx, cy: twy, r: 0, maxR, life: duration, maxLife: duration });
      }
      if (dealDmg(monster, dmg, false)) break; // 魔法
      // 减甲取最高值（不叠加，power已由updateTowers按等级传入）
      if (power > (monster.defDebuff || 0)) {
        monster.defDebuff = power;
      }
      monster.defDebuffTimer = 4;
      for (let i = 0; i < 4; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#cc4400', 3, 0.4));
      break;
    }

    // 三元素塔：物理单体+击杀金币
    case 'tri': {
      dealDmg(monster, dmg, true);
      break;
    }

    // 风雷塔：主炮物理，跳链为魔法
    case 'chainLightning': {
      dealDmg(monster, dmg, true); // 物理主炮
      // 主目标坐标（用于闪电链起点）
      lightningArcs.push({ points: [{ x: monster.x, y: monster.y }], life: 0.22 });
      if (!monster.chainImmune && Math.random() < 0.3) {
        const chainCount = Math.random() < 0.5 ? 2 : 3;
        const nearby = state.monsters.filter(m => !m.dead && m !== monster && !m.chainImmune)
          .sort((a, b) => {
            const da = Math.sqrt((a.x - monster.x)**2 + (a.y - monster.y)**2);
            const db = Math.sqrt((b.x - monster.x)**2 + (b.y - monster.y)**2);
            return da - db;
          }).slice(0, chainCount);
        let prev = monster;
        const arc = lightningArcs[lightningArcs.length - 1];
        nearby.forEach(m => {
          const chainDmg = Math.max(1, Math.round(dmg * power));
          arc.points.push({ x: m.x, y: m.y });
          const realChain = calcDmg(chainDmg, m, false); // 跳链=魔法
          m.hp -= realChain;
          spawnDmgNumber(m.x, m.y, realChain);
          if (towerKey && state.towers[towerKey]) {
            state.towers[towerKey].damageDealt = (state.towers[towerKey].damageDealt || 0) + realChain;
            state.towers[towerKey].magicDmg = (state.towers[towerKey].magicDmg || 0) + realChain;
          }
          if (m.hp <= 0 && !m.dead) m.die();
          prev = m;
        });
      }
      for (let i = 0; i < 3; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*80, (Math.random()-0.5)*80, '#9966ff', 3, 0.25));
      break;
    }

    // 冰炎塔：物理主炮，命中施加减速（按等级ICE_SLOW_FACTOR），40%概率冰冻
    case 'dualFrost': {
      if (dealDmg(monster, dmg, true)) break; // 物理
      // 命中减速（使用与冰霜塔相同的减速分级，持续3秒）
      applySlowLayer(monster, power, 3, 'attack'); // power = 按等级 ICE_SLOW_FACTOR 传入
      if (Math.random() < 0.4 && !monster.frozenImmune) {
        const dfFreezeIdx = (state.towers[towerKey]?.level || 1) - 1;
        monster.frozenTimer = DUAL_FROST_FREEZE[Math.min(dfFreezeIdx, DUAL_FROST_FREEZE.length - 1)];
        monster.frozen = true;
        for (let i = 0; i < 4; i++)
          state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#aaddff', 3, 0.3));
      }
      break;
    }

    // 风暴塔：冰雹落下 → 落地后才造成AOE伤害+减速（魔法）
    case 'hailstorm': {
      const aoeR = (state.towers[towerKey]?.cfg.aoeRange || 1.5) * CELL;
      // 冰雹从上方落下视觉，携带伤害参数，落地后在 updateTowers 中结算
      hailParticles.push({
        x: monster.x, y: monster.y - 120,
        startY: monster.y - 120, targetY: monster.y,
        vy: 400, exploded: false, dealtDmg: false,
        aoeR, life: 0.7, maxLife: 0.7,
        dmg, power, towerKey
      });
      break;
    }

    // 流浪剑客：主炮物理，1格内100%溅射
    case 'skyLord': {
      const hitX = monster.x, hitY = monster.y;
      dealDmg(monster, dmg, true); // 物理主炮
      // 溅射：命中后对周围1.5格内其他怪物造成100%物理伤害（走护甲公式）
      const splashR = 1.5 * CELL;
      const splashDmg = Math.round(dmg * 1.0);
      state.monsters.forEach(m => {
        if (m.dead || m === monster) return;
        const dx = m.x - hitX, dy = m.y - hitY;
        if (Math.sqrt(dx*dx+dy*dy) <= splashR) {
          const realSplash = calcDmg(splashDmg, m, true);
          m.hp -= realSplash;
          spawnDmgNumber(m.x, m.y, realSplash);
          if (towerKey && state.towers[towerKey]) {
            state.towers[towerKey].damageDealt = (state.towers[towerKey].damageDealt || 0) + realSplash;
            state.towers[towerKey].physDmg = (state.towers[towerKey].physDmg || 0) + realSplash;
          }
          if (m.hp <= 0 && !m.dead) m.die();
        }
      });
      // 溅射粒子效果（金色光芒向外飞散）
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 50 + Math.random() * 100;
        state.particles.push(new Particle(hitX, hitY,
          Math.cos(a)*spd, Math.sin(a)*spd,
          Math.random() < 0.5 ? '#ffd700' : '#ffffff',
          Math.random()*4+2, 0.45));
      }
      break;
    }

    // 金刚：超高单体物理，击杀额外生成10金币
    case 'vajraAtk': {
      dealDmg(monster, dmg, true); // 物理伤害，无附加效果
      // 金色击中粒子
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        state.particles.push(new Particle(monster.x, monster.y,
          Math.cos(a)*80, Math.sin(a)*80, '#ffe066', Math.random()*4+2, 0.35));
      }
      break;
    }

    // 大金刚：单体高额物理攻击，命中溅射 effectPower(50%) 伤害至周围 1.5 格内其他敌人
    case 'greatVajraAtk': {
      dealDmg(monster, dmg, true);
      // 溅射：对周围1.5格内其他存活怪物造成 dmg*50% 物理伤害
      const splashDmg = Math.round(dmg * power);
      const splashR   = 1.5 * CELL;
      state.monsters.forEach(m => {
        if (m.dead || m === monster) return;
        const dx = m.x - monster.x, dy = m.y - monster.y;
        if (dx*dx + dy*dy <= splashR*splashR) {
          dealDmg(m, splashDmg, true);
          // 橙色溅射粒子
          for (let i = 0; i < 4; i++) {
            const a = Math.random() * Math.PI * 2;
            state.particles.push(new Particle(m.x, m.y,
              Math.cos(a)*60, Math.sin(a)*60, '#ffcc00', Math.random()*3+1, 0.3));
          }
        }
      });
      // 主目标金色粒子
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        state.particles.push(new Particle(monster.x, monster.y,
          Math.cos(a)*90, Math.sin(a)*90, '#ffcc00', Math.random()*5+2, 0.4));
      }
      break;
    }

    // 水母：物理伤害，触发概率由effectPower控制，触发闪电链（弹4-5目标，100%伤害）
    case 'jellyAtk': {
      dealDmg(monster, dmg, true); // 物理
      if (Math.random() < power) {
        // 闪电链：从命中目标出发，弹4-5个最近的怪
        const chainCount = 4 + Math.floor(Math.random() * 2); // 4或5
        const chainDmg = Math.round(dmg * 1.0);
        let lastPos = { x: monster.x, y: monster.y };
        const hit = new Set([monster]);
        for (let c = 0; c < chainCount; c++) {
          let nearest = null, nearDist = Infinity;
          state.monsters.forEach(m => {
            if (m.dead || hit.has(m)) return;
            const dx = m.x - lastPos.x, dy = m.y - lastPos.y;
            const d = Math.sqrt(dx*dx+dy*dy);
            if (d < nearDist) { nearDist = d; nearest = m; }
          });
          if (!nearest || nearDist > 4 * CELL) break;
          lightningArcs.push({
            points: [{ x: lastPos.x, y: lastPos.y }, { x: nearest.x, y: nearest.y }],
            life: 0.28, maxLife: 0.28, color: '#88aaff', isJelly: true,
          });
          const realChain = calcDmg(chainDmg, nearest, false);
          nearest.hp -= realChain;
          spawnDmgNumber(nearest.x, nearest.y, realChain);
          if (towerKey && state.towers[towerKey]) {
            state.towers[towerKey].damageDealt = (state.towers[towerKey].damageDealt || 0) + realChain;
            state.towers[towerKey].magicDmg = (state.towers[towerKey].magicDmg || 0) + realChain;
          }
          if (nearest.hp <= 0 && !nearest.dead) nearest.die();
          hit.add(nearest);
          lastPos = { x: nearest.x, y: nearest.y };
        }
      }
      break;
    }

    // 寒冰：物理伤害，命中附加50%减速3秒
    case 'frostArrowAtk': {
      if (dealDmg(monster, dmg, true)) break; // 物理
      applySlowLayer(monster, 1 - power, 3, 'attack'); // power=0.5 → 50%减速
      for (let i = 0; i < 4; i++)
        state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#44ccff', 3, 0.3));
      break;
    }

    // 雪王：物理主炮，50%概率冰冻0.5s
    case 'snowKing': {
      if (dealDmg(monster, dmg, true)) break; // 物理
      if (Math.random() < 0.5 && !monster.frozenImmune) {
        monster.frozenTimer = 0.5;
        monster.frozen = true;
        for (let i = 0; i < 4; i++)
          state.particles.push(new Particle(monster.x, monster.y, (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#cceeff', 3, 0.3));
      }
      break;
    }

    // 影魔：物理单体+减甲30（独立debuff，3s，再次命中重置计时），击杀收集灵魂
    case 'shadowDemonAtk': {
      // 先附加减甲再造伤（确保本次攻击也受益）
      {
        const armorVal = power || 15;
        monster.armorDebuffs.set('shadowDemonAtk', { value: armorVal, timer: 3 });
      }
      const killed = dealDmg(monster, dmg, true);
      if (killed) {
        // 收集灵魂：找到影魔塔增加souls计数
        if (towerKey && state.towers[towerKey]) {
          const sdTower = state.towers[towerKey];
          sdTower.souls = (sdTower.souls || 0) + 1;
          // 每魂+50攻击（动态更新cfg.dmg）
          sdTower.cfg = Object.assign({}, sdTower.cfg, {
            dmg: 900 + sdTower.souls * 50,
          });
          // 灵魂抽取动画（紫色线条从被击杀怪到影魔）
          const [tr2, tc2] = towerKey.split(',').map(Number);
          const twx = tc2*CELL+CELL/2, twy = tr2*CELL+CELL/2;
          state.soulArcs = state.soulArcs || [];
          state.soulArcs.push({
            fromX: monster.x, fromY: monster.y,
            toX: twx, toY: twy,
            life: 0.6, maxLife: 0.6,
            color: '#cc44ff', isYanluo: false,
          });
        }
      } else {
        // 击中粒子（紫色）
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * Math.PI * 2;
          state.particles.push(new Particle(monster.x, monster.y,
            Math.cos(a)*60, Math.sin(a)*60, '#cc44ff', Math.random()*3+2, 0.3));
        }
      }
      break;
    }

    // 阎王：物理双体+减甲40，击杀收集灵魂
    case 'yanluoAtk': {
      // 攻击不再施加减甲（减甲仅由持续光环提供）
      const killed2 = dealDmg(monster, dmg, true);
      if (killed2) {
        if (towerKey && state.towers[towerKey]) {
          const ylTower = state.towers[towerKey];
          ylTower.souls = (ylTower.souls || 0) + 1;
          ylTower.cfg = Object.assign({}, ylTower.cfg, {
            dmg: 900 + ylTower.souls * 50,
          });
          // 灵魂抽取动画（红黑色线条）
          const [tr3, tc3] = towerKey.split(',').map(Number);
          const twx3 = tc3*CELL+CELL/2, twy3 = tr3*CELL+CELL/2;
          state.soulArcs = state.soulArcs || [];
          state.soulArcs.push({
            fromX: monster.x, fromY: monster.y,
            toX: twx3, toY: twy3,
            life: 0.6, maxLife: 0.6,
            color: '#cc0000', isYanluo: true,
          });
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * Math.PI * 2;
          state.particles.push(new Particle(monster.x, monster.y,
            Math.cos(a)*60, Math.sin(a)*60, '#cc2200', Math.random()*3+2, 0.3));
        }
      }
      break;
    }

    // 炼金术士：物理伤害，命中时金色粒子；击杀时额外生成2个钱袋（各10金）
    case 'bankAtk': {
      const killed = dealDmg(monster, dmg, true);
      // 命中金色粒子
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        state.particles.push(new Particle(monster.x, monster.y,
          Math.cos(a)*50, Math.sin(a)*50, '#ffd700', Math.random()*3+2, 0.3));
      }
      // 击杀时额外掉落2个钱袋（各10金）+ 金色爆发
      if (killed) {
        spawnCoinDrop(px - 8, py, 10);
        spawnCoinDrop(px + 8, py, 10);
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          state.particles.push(new Particle(px, py,
            Math.cos(a) * (50 + Math.random()*80), Math.sin(a) * (50 + Math.random()*80),
            Math.random() < 0.5 ? '#ffd700' : '#ffe066',
            Math.random() * 4 + 2, 0.6));
        }
      }
      break;
    }

    // 默认通用
    default: {
      dealDmg(monster, dmg);
      break;
    }
  }
}

// ========== 绘图系统 ==========
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const mainArea = document.getElementById('main-area');
  const rect = mainArea.getBoundingClientRect();
  const available = Math.min(rect.height - 16, rect.width - 216);
  const size = Math.max(320, Math.floor(available / GRID) * GRID);
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
}

// ── 地皮纹理辅助：基于坐标的伪随机哈希（无抖动）
function tileHash(r, c, seed) {
  let h = (r * 73856093) ^ (c * 19349663) ^ (seed * 83492791);
  h = ((h >> 16) ^ h) * 0x45d9f3b | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b | 0;
  h = (h >> 16) ^ h;
  return (h & 0x7fffffff) / 0x7fffffff; // 0~1
}


function drawMap() {
  // ── 背景底色（深绿渐变，暗角效果）
  const bgGrad = ctx.createRadialGradient(
    CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE*0.1,
    CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE*0.78
  );
  bgGrad.addColorStop(0, '#52a34e');
  bgGrad.addColorStop(1, '#2d5e25');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const x = c * CELL, y = r * CELL;
      const key = `${r},${c}`;
      const isPath = PATH_SET.has(key);

      if (isPath) {
        // ── 路径格：石板路风格 ──
        // 1. 底色：用轻微色调变化模拟不同石板
        const tone = tileHash(r, c, 1) * 16 - 8; // -8 ~ +8
        const base = 162 + Math.round(tone);   // 提亮：139→162
        ctx.fillStyle = `rgb(${base}, ${Math.round(base*0.84)}, ${Math.round(base*0.62)})`;
        ctx.fillRect(x, y, CELL, CELL);

        // 2. 石板缝隙（内嵌深色边框模拟砖缝）
        const inset = 2;
        ctx.strokeStyle = 'rgba(60,40,15,0.45)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, CELL - inset*2 - 1, CELL - inset*2 - 1);

        // 3. 砾石/纹理点：6~8个随机分布的小点
        const dotCount = 6 + Math.floor(tileHash(r, c, 2) * 3);
        for (let i = 0; i < dotCount; i++) {
          const dx = tileHash(r, c, i*3+10) * (CELL - 10) + 5;
          const dy = tileHash(r, c, i*3+11) * (CELL - 10) + 5;
          const ds = tileHash(r, c, i*3+12) * 2.5 + 0.8;
          const da = tileHash(r, c, i*3+13) * 0.12 + 0.04;
          ctx.fillStyle = tileHash(r, c, i*5+20) > 0.5
            ? `rgba(0,0,0,${da})` : `rgba(255,255,200,${da*0.6})`;
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, ds, ds * 0.7, tileHash(r, c, i+30) * Math.PI, 0, Math.PI*2);
          ctx.fill();
        }

        // 4. 对角高光：左上角浅色光泽感
        const lg = ctx.createLinearGradient(x, y, x+CELL, y+CELL);
        lg.addColorStop(0,   'rgba(255,255,200,0.10)');
        lg.addColorStop(0.4, 'rgba(255,255,200,0.03)');
        lg.addColorStop(1,   'rgba(0,0,0,0.07)');
        ctx.fillStyle = lg;
        ctx.fillRect(x, y, CELL, CELL);

      } else {
        // ── 草地格：有机绿草风格 ──
        // 1. 底色：轻微色调扰动
        const gTone = tileHash(r, c, 5) * 18 - 9;
        const gBase = 84 + Math.round(gTone);   // 再提亮：66→84
        ctx.fillStyle = `rgb(${Math.round(gBase*0.55)}, ${gBase}, ${Math.round(gBase*0.42)})`;
        ctx.fillRect(x, y, CELL, CELL);

        // 2. 草叶笔触：5~7条短曲线
        const bladeCount = 5 + Math.floor(tileHash(r, c, 6) * 3);
        ctx.lineWidth = 1.2;
        for (let i = 0; i < bladeCount; i++) {
          const bx = x + tileHash(r, c, i*4+40) * (CELL - 12) + 6;
          const by = y + tileHash(r, c, i*4+41) * (CELL - 12) + 6;
          const bh = tileHash(r, c, i*4+42) * 10 + 6;  // 高度6~16
          const bw = tileHash(r, c, i*4+43) * 3 - 1.5; // 横向偏移
          const alpha = tileHash(r, c, i*4+44) * 0.22 + 0.10;
          ctx.strokeStyle = `rgba(100,230,70,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + bw, by - bh*0.5, bx + bw*1.4, by - bh);
          ctx.stroke();
        }

        // 3. 棋盘格亮暗扰动（增加层次感）
        const checker = ((r + c) % 2 === 0) ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)';
        ctx.fillStyle = checker;
        ctx.fillRect(x, y, CELL, CELL);

        // 4. 格子边缘细线
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x+0.5, y+0.5, CELL-1, CELL-1);

        // 5. 若相邻路径格，在对应边绘制阴影过渡（路径压草地感）
        const neighbors = [[-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']];
        for (const [dr, dc, side] of neighbors) {
          if (PATH_SET.has(`${r+dr},${c+dc}`)) {
            let gx1=x, gy1=y, gx2=x, gy2=y;
            const sw = 10; // shadow width
            if (side==='top')    { gy2 = y+sw; }
            if (side==='bottom') { gy1 = y+CELL-sw; gy2 = y+CELL; }
            if (side==='left')   { gx2 = x+sw; }
            if (side==='right')  { gx1 = x+CELL-sw; gx2 = x+CELL; }
            const sg = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
            sg.addColorStop(0, 'rgba(0,0,0,0.30)');
            sg.addColorStop(1, 'rgba(0,0,0,0.00)');
            ctx.fillStyle = sg;
            ctx.fillRect(x, y, CELL, CELL);
          }
        }
      }

      // ── Hover highlight
      if (state.hoverCell && state.hoverCell[0] === r && state.hoverCell[1] === c) {
        if (!isPath && !state.towers[key]) {
          ctx.fillStyle = state.placingTower ? 'rgba(100,255,100,0.25)' : 'rgba(255,255,255,0.12)';
          ctx.fillRect(x, y, CELL, CELL);
        } else if (isPath || state.towers[key]) {
          ctx.fillStyle = 'rgba(255,80,80,0.18)';
          ctx.fillRect(x, y, CELL, CELL);
        }
      }
    }
  }

  // ── 起点标记（绿色入口箭头）
  const [sr, sc] = PATH_CELLS[0];
  // 入口背景光晕
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#66ff66';
  ctx.beginPath(); ctx.arc(sc*CELL+CELL/2, sr*CELL+CELL/2, CELL*0.38, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(80,255,80,0.92)';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶', sc*CELL+CELL/2, sr*CELL+CELL/2);
  ctx.restore();

  // ── 终点标记（红色星形出口）
  const [er, ec] = PATH_CELLS[PATH_CELLS.length-1];
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = '#ff6666';
  ctx.beginPath(); ctx.arc(ec*CELL+CELL/2, er*CELL+CELL/2, CELL*0.38, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⭐', ec*CELL+CELL/2, er*CELL+CELL/2);
  ctx.restore();

  // ── 目标点1标记（淡黄色光圈 + 数字"1"）
  {
    const [cp1r, cp1c] = PATH_CHECKPOINT1;
    const cx1 = cp1c * CELL + CELL/2, cy1 = cp1r * CELL + CELL/2;
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(cx1, cy1, CELL * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8dc';
    ctx.fillText('1', cx1, cy1);
    ctx.restore();
  }

  // ── 目标点2标记（淡黄色光圈 + 数字"2"）
  {
    const [cp2r, cp2c] = PATH_CHECKPOINT2;
    const cx2 = cp2c * CELL + CELL/2, cy2 = cp2r * CELL + CELL/2;
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(cx2, cy2, CELL * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff8dc';
    ctx.fillText('2', cx2, cy2);
    ctx.restore();
  }
}

// ── 特殊塔外观绘制
function drawSpecialTower(ctx, tower, x, y, cfg, key, CS) {
  if (CS === undefined) CS = CELL; // 默认值兼容
  const t = (Date.now() / 1000);
  const isSel = state.selectedTowerKey === key;

  if (cfg.effect === 'phoenixAura') {
    // ── 凤凰塔：火焰光轮底座 + 羽翼 + 凤凰图标
    // 底部熔岩发光圈
    const aoeR = cfg.aoeRange * CS;
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, aoeR, 0, Math.PI*2);
      ctx.strokeStyle = '#ff440066'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff220011'; ctx.fill();
    }
    // 旋转羽翼（6片）
    for (let i = 0; i < 6; i++) {
      const angle = t * 1.5 + i * Math.PI / 3;
      const wx = x + Math.cos(angle) * 22, wy = y + Math.sin(angle) * 22;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(angle + Math.PI/2);
      ctx.fillStyle = i % 2 === 0 ? '#ff6600cc' : '#ffaa00cc';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    // 底座
    ctx.fillStyle = '#661100';
    ctx.beginPath(); ctx.ellipse(x, y+10, 18, 7, 0, 0, Math.PI*2); ctx.fill();
    // 中心发光
    const grad = ctx.createRadialGradient(x, y, 2, x, y, 20);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ffcc00');
    grad.addColorStop(0.7, '#ff4400');
    grad.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 18 + Math.sin(t*3)*6;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y-4, 18, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 图标
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🦅', x, y - 10);

  } else if (cfg.effect === 'permafrostAura') {
    // ── 极寒之塔：冰晶柱 + 旋转雪花 + 冰雾光环
    ctx.save();
    const aoeR = cfg.aoeRange * CS;
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, aoeR, 0, Math.PI*2);
      ctx.strokeStyle = '#00eeff66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#00eeff09'; ctx.fill();
    }
    // 底座阴影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y+20, 20, 7, 0, 0, Math.PI*2); ctx.fill();
    // 底座冰台（亮蓝色）
    const baseGrad = ctx.createRadialGradient(x, y+10, 2, x, y+10, 22);
    baseGrad.addColorStop(0, '#aaddff');
    baseGrad.addColorStop(0.6, '#4499cc');
    baseGrad.addColorStop(1, '#1155aa');
    ctx.fillStyle = baseGrad;
    ctx.beginPath(); ctx.ellipse(x, y+12, 20, 8, 0, 0, Math.PI*2); ctx.fill();
    // 底座顶面高光
    ctx.strokeStyle = '#88ddff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y+10, 18, 6, 0, 0, Math.PI*2); ctx.stroke();
    // 主体冰柱（实心）
    const pillarGrad = ctx.createLinearGradient(x-10, y-18, x+10, y+10);
    pillarGrad.addColorStop(0, '#eef8ff');
    pillarGrad.addColorStop(0.4, '#aaddff');
    pillarGrad.addColorStop(1, '#3388cc');
    ctx.shadowColor = '#00ccff'; ctx.shadowBlur = 14;
    ctx.fillStyle = pillarGrad;
    ctx.beginPath();
    ctx.moveTo(x-10, y+8);
    ctx.lineTo(x-8, y-18);
    ctx.lineTo(x+8, y-18);
    ctx.lineTo(x+10, y+8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // 柱体描边
    ctx.strokeStyle = '#88ddff'; ctx.lineWidth = 1.2;
    ctx.stroke();
    // 冰雾光环（脉冲发光环绕主柱）
    const pulse = 0.5 + 0.35 * Math.sin(t * 2);
    ctx.strokeStyle = `rgba(0,220,255,${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 12 + pulse * 10;
    ctx.beginPath(); ctx.arc(x, y-4, 18, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    // 旋转冰晶碎片（3片绕柱旋转）
    for (let i = 0; i < 3; i++) {
      const a = t * 1.2 + i * Math.PI * 2 / 3;
      const cx2 = x + Math.cos(a) * 16, cy2 = y + Math.sin(a) * 10 - 4;
      ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(a + t * 0.5);
      ctx.fillStyle = `rgba(180,240,255,0.9)`;
      ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(4, 0); ctx.lineTo(0, 4); ctx.lineTo(-4, 0); ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // 顶部冰晶图标（旋转）
    ctx.save(); ctx.translate(x, y-22); ctx.rotate(t * 0.6);
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🧊', 0, 0);
    ctx.restore();
    ctx.restore();

  } else if (cfg.effect === 'frostArrowAtk') {
    // ── 寒冰：冰弓塔——六棱冰柱底座 + 旋转冰箭光环 + 蓝色脉冲光晕
    ctx.save();
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#44ccff66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#44ccff0a'; ctx.fill();
    }
    // 底座阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y+20, 19, 7, 0, 0, Math.PI*2); ctx.fill();
    // 六棱冰晶底台
    ctx.save();
    ctx.translate(x, y+10);
    const hexGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
    hexGrad.addColorStop(0, '#99eeff');
    hexGrad.addColorStop(0.5, '#2299cc');
    hexGrad.addColorStop(1, '#0055aa');
    ctx.fillStyle = hexGrad;
    ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ha = i * Math.PI / 3 - Math.PI/6;
      const hx2 = Math.cos(ha) * 18, hy2 = Math.sin(ha) * 7;
      i === 0 ? ctx.moveTo(hx2, hy2) : ctx.lineTo(hx2, hy2);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#88ddff'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
    // 主塔身（冰蓝竖柱）
    const bodyGrad = ctx.createLinearGradient(x-9, y-20, x+9, y+8);
    bodyGrad.addColorStop(0, '#eef8ff');
    bodyGrad.addColorStop(0.35, '#88ccff');
    bodyGrad.addColorStop(1, '#1166bb');
    ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 12;
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(x-9, y+8); ctx.lineTo(x-6, y-20);
    ctx.lineTo(x+6, y-20); ctx.lineTo(x+9, y+8);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 1; ctx.stroke();
    // 旋转冰箭（5支，绕塔旋转，象征同时攻击5目标）
    const pulse = 0.5 + 0.35 * Math.sin(t * 2.5);
    for (let i = 0; i < 5; i++) {
      const a = t * 1.4 + i * Math.PI * 2 / 5;
      const rx = x + Math.cos(a) * 20, ry = y + Math.sin(a) * 12 - 4;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = `rgba(100,210,255,${0.75 + pulse * 0.2})`;
      ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 5;
      // 箭头形状：顶尖+两翼
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(3, 0); ctx.lineTo(0, 3); ctx.lineTo(-3, 0);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // 顶部脉冲光环
    ctx.strokeStyle = `rgba(68,204,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 10 + pulse * 8;
    ctx.beginPath(); ctx.arc(x, y-6, 14, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

  } else if (cfg.effect === 'skyLordAtk') {
    // ══════════════════════════════════════════════════
    // ── 流浪剑客：蓝色盔甲壮汉 + 鹿角黑头盔 + 双手持巨剑 + 脚下绿色光环
    // ══════════════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);

    if (isSel) {
      ctx.beginPath(); ctx.arc(0, 0, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#44ff8866'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 攻击摆动动画
    const swingAngle = Math.sin(t * 2.8) * 0.12;
    ctx.rotate(swingAngle);

    // ── 0. 脚下绿色地面光环
    const slRingR = 21 + Math.sin(t * 2.5) * 1.5;
    const slRingGrad = ctx.createRadialGradient(0, 6, slRingR - 5, 0, 6, slRingR + 5);
    slRingGrad.addColorStop(0, 'rgba(0,255,80,0)');
    slRingGrad.addColorStop(0.4, 'rgba(0,255,80,0.5)');
    slRingGrad.addColorStop(1, 'rgba(0,255,80,0)');
    ctx.fillStyle = slRingGrad;
    ctx.beginPath(); ctx.arc(0, 6, slRingR + 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 6, slRingR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,255,80,${0.65 + 0.3 * Math.sin(t * 3.5)})`;
    ctx.lineWidth = 2.5; ctx.stroke();

    // ── 1. 腿部（深灰金属甲裤）
    const legGrad = ctx.createLinearGradient(-10, 4, 10, 18);
    legGrad.addColorStop(0, '#4a5a7a'); legGrad.addColorStop(1, '#2a3450');
    ctx.fillStyle = legGrad;
    ctx.beginPath(); ctx.roundRect(-9, 4, 7, 14, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, 4, 7, 14, 2); ctx.fill();
    // 腿部高光
    ctx.fillStyle = 'rgba(120,150,220,0.25)';
    ctx.beginPath(); ctx.roundRect(-8, 5, 3, 5, 1); ctx.fill();
    ctx.beginPath(); ctx.roundRect(3, 5, 3, 5, 1); ctx.fill();
    // 靴子（厚重黑甲）
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath(); ctx.roundRect(-10, 16, 10, 5, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(0, 16, 10, 5, 2); ctx.fill();
    ctx.strokeStyle = '#5566aa'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(-10, 16, 10, 5, 2); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(0, 16, 10, 5, 2); ctx.stroke();

    // ── 2. 躯干（蓝色重甲）
    const torsoGrad = ctx.createLinearGradient(-11, -10, 11, 6);
    torsoGrad.addColorStop(0, '#6688cc');
    torsoGrad.addColorStop(0.35, '#4466aa');
    torsoGrad.addColorStop(0.7, '#224488');
    torsoGrad.addColorStop(1, '#1a3366');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath(); ctx.roundRect(-11, -10, 22, 16, 3); ctx.fill();
    // 胸甲高光
    ctx.fillStyle = 'rgba(150,190,255,0.28)';
    ctx.beginPath(); ctx.roundRect(-9, -9, 9, 6, 2); ctx.fill();
    // 胸甲纹路
    ctx.strokeStyle = '#3355aa'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 6); ctx.stroke();
    // 胸甲中央装饰圆
    ctx.fillStyle = '#88aaff';
    ctx.shadowColor = '#aaccff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, -3, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath(); ctx.arc(0, -3, 1.5, 0, Math.PI*2); ctx.fill();

    // ── 3. 肩甲（左右凸起）
    ctx.fillStyle = '#5577bb';
    ctx.beginPath(); ctx.ellipse(-13, -8, 5, 4, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -8, 5, 4, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#88aadd'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-13, -8, 5, 4, -0.3, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(13, -8, 5, 4, 0.3, 0, Math.PI*2); ctx.stroke();

    // ── 4. 左臂（向左下斜持剑）
    ctx.save();
    ctx.translate(-11, -5);
    ctx.rotate(0.35);
    const lArmGrad = ctx.createLinearGradient(-3, 0, 3, 12);
    lArmGrad.addColorStop(0, '#5577bb'); lArmGrad.addColorStop(1, '#334488');
    ctx.fillStyle = lArmGrad;
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 12, 2); ctx.fill();
    ctx.restore();

    // ── 5. 右臂（向右上方挥剑）
    ctx.save();
    ctx.translate(11, -5);
    ctx.rotate(-0.35 + Math.sin(t * 2.8) * 0.18);
    const rArmGrad = ctx.createLinearGradient(-3, 0, 3, 12);
    rArmGrad.addColorStop(0, '#5577bb'); rArmGrad.addColorStop(1, '#334488');
    ctx.fillStyle = rArmGrad;
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 12, 2); ctx.fill();
    ctx.restore();

    // ── 6. 巨剑（斜向右上，双手握持）
    ctx.save();
    ctx.rotate(-0.45 + Math.sin(t * 2.8) * 0.12);
    // 剑柄（金属深色）
    const hiltGrad = ctx.createLinearGradient(-3, 8, 3, 20);
    hiltGrad.addColorStop(0, '#887744'); hiltGrad.addColorStop(1, '#554422');
    ctx.fillStyle = hiltGrad;
    ctx.beginPath(); ctx.roundRect(-3, 6, 6, 14, 2); ctx.fill();
    // 护手横档
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath(); ctx.roundRect(-8, 5, 16, 4, 2); ctx.fill();
    ctx.fillStyle = '#cccccc';
    ctx.beginPath(); ctx.roundRect(-7, 6, 6, 2, 1); ctx.fill();
    // 剑身（长银色刀刃）
    const bladeGrad = ctx.createLinearGradient(-3, -28, 3, 6);
    bladeGrad.addColorStop(0, '#ffffff');
    bladeGrad.addColorStop(0.2, '#ddeeff');
    bladeGrad.addColorStop(0.6, '#aabbdd');
    bladeGrad.addColorStop(1, '#667799');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-3, 6);
    ctx.lineTo(-1.5, -28);
    ctx.lineTo(0, -32);
    ctx.lineTo(1.5, -28);
    ctx.lineTo(3, 6);
    ctx.closePath();
    ctx.fill();
    // 剑身高光线（中脊）
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -30); ctx.stroke();
    // 剑刃发光
    ctx.shadowColor = '#aaddff'; ctx.shadowBlur = 8 + Math.sin(t * 3) * 3;
    ctx.strokeStyle = 'rgba(180,220,255,0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -30); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── 7. 颈部
    ctx.fillStyle = '#d4a070';
    ctx.beginPath(); ctx.roundRect(-4, -18, 8, 6, 1); ctx.fill();

    // ── 8. 脸部（方脸，硬朗）
    const faceG = ctx.createRadialGradient(-1, -24, 1, 0, -23, 9);
    faceG.addColorStop(0, '#e8b878'); faceG.addColorStop(1, '#c08040');
    ctx.fillStyle = faceG;
    ctx.beginPath(); ctx.roundRect(-8, -31, 16, 14, 3); ctx.fill();
    // 眼睛（窄眼，凶悍感）
    ctx.fillStyle = '#ff4422';
    ctx.beginPath(); ctx.ellipse(-4, -26, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -26, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.arc(-4, -26, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -26, 1, 0, Math.PI*2); ctx.fill();
    // 皱眉（粗眉）
    ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, -29); ctx.lineTo(-1, -28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -29); ctx.lineTo(1, -28); ctx.stroke();

    // ── 9. 黑色头盔（重甲头盔 + 顶部鹿角）
    // 头盔主体
    const helmGrad = ctx.createLinearGradient(-9, -42, 9, -30);
    helmGrad.addColorStop(0, '#3a3a4a');
    helmGrad.addColorStop(0.4, '#222233');
    helmGrad.addColorStop(1, '#111122');
    ctx.fillStyle = helmGrad;
    ctx.beginPath(); ctx.roundRect(-9, -42, 18, 12, [8,8,3,3]); ctx.fill();
    // 头盔高光
    ctx.fillStyle = 'rgba(100,120,180,0.3)';
    ctx.beginPath(); ctx.roundRect(-7, -41, 7, 5, 3); ctx.fill();
    // 头盔护颊（左右下沿）
    ctx.fillStyle = '#1e1e2e';
    ctx.beginPath(); ctx.roundRect(-10, -34, 5, 7, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(5, -34, 5, 7, 2); ctx.fill();
    // 头盔装饰线
    ctx.strokeStyle = '#5566aa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(9, -36); ctx.stroke();

    // 鹿角（左角）
    ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -42);
    ctx.lineTo(-10, -52);
    ctx.lineTo(-14, -48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -52);
    ctx.lineTo(-7, -56);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -52);
    ctx.lineTo(-13, -57);
    ctx.stroke();
    // 鹿角（右角）
    ctx.beginPath();
    ctx.moveTo(5, -42);
    ctx.lineTo(10, -52);
    ctx.lineTo(14, -48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -52);
    ctx.lineTo(7, -56);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -52);
    ctx.lineTo(13, -57);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // 鹿角蓝色发光点
    ctx.fillStyle = '#44aaff';
    ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(-13, -57, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -57, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

  } else if (cfg.effect === 'stormGoddessAtk') {
    // ══════════════════════════════════════════════════
    // ── 电母：多层紫色闪电动态光效
    // ══════════════════════════════════════════════════
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#bb88ff66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 层1：外圈脉冲紫色光晕
    {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
      const outerR = 38;
      const opGrad = ctx.createRadialGradient(x, y, outerR * 0.3, x, y, outerR);
      opGrad.addColorStop(0, `rgba(180,100,255,${(0.06 + pulse * 0.08).toFixed(3)})`);
      opGrad.addColorStop(1, 'rgba(100,50,200,0)');
      ctx.fillStyle = opGrad;
      ctx.beginPath(); ctx.arc(x, y, outerR, 0, Math.PI*2); ctx.fill();
      // 旋转虚线外圈
      ctx.save(); ctx.translate(x, y); ctx.rotate(-t * 1.0);
      ctx.strokeStyle = `rgba(200,130,255,${0.4 + pulse * 0.3})`;
      ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      ctx.shadowColor = '#cc88ff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, outerR, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.restore();
    }

    // 层2：反向旋转内虚线圈（半径20）
    {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.6);
      ctx.strokeStyle = 'rgba(220,160,255,0.5)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    // 层3：5条动态分叉闪电（折线，每帧微抖）
    for (let i = 0; i < 5; i++) {
      const baseAngle = t * 2.5 + i * Math.PI * 2 / 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(baseAngle);
      const jit = () => (Math.random() - 0.5) * 5;
      const alpha = 0.55 + 0.35 * Math.sin(t * 4 + i * 1.3);
      // 外辉光层
      ctx.strokeStyle = `rgba(180,100,255,${alpha * 0.4})`;
      ctx.lineWidth = 3.5; ctx.shadowColor = '#cc66ff'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(jit(), -10 + jit()); ctx.lineTo(4+jit(), -20+jit());
      ctx.lineTo(-2+jit(), -27+jit()); ctx.lineTo(6+jit(), -36+jit()); ctx.stroke();
      // 白芯
      ctx.strokeStyle = `rgba(240,210,255,${alpha * 0.9})`;
      ctx.lineWidth = 1.2; ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(jit()*0.4, -10+jit()*0.4); ctx.lineTo(4+jit()*0.4, -20+jit()*0.4);
      ctx.lineTo(-2+jit()*0.4, -27+jit()*0.4); ctx.lineTo(6+jit()*0.4, -36+jit()*0.4); ctx.stroke();
      // 分叉支路（向外偏）
      const forkAlpha = alpha * 0.5;
      ctx.strokeStyle = `rgba(200,140,255,${forkAlpha})`;
      ctx.lineWidth = 0.8; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.moveTo(-1+jit(), -22+jit()); ctx.lineTo(-7+jit(), -28+jit()); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    }

    // 层4：6个轨道电弧粒子（随机闪烁）
    for (let i = 0; i < 6; i++) {
      const orbitA = t * 2.2 + i * Math.PI / 3;
      const orbitR = 26 + Math.sin(t * 5 + i) * 5;
      const px2 = x + Math.cos(orbitA) * orbitR;
      const py2 = y + Math.sin(orbitA) * orbitR;
      const sparkAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 6 + i * 2.1));
      ctx.fillStyle = `rgba(210,160,255,${sparkAlpha})`;
      ctx.shadowColor = '#cc88ff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px2, py2, 2 + Math.sin(t*3+i)*0.8, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 层5：中心紫白渐变核心球（呼吸）
    {
      const corePulse = 0.6 + 0.4 * Math.sin(t * 3.2);
      const cpGrad = ctx.createRadialGradient(x-1, y-1, 0, x, y, 20 + corePulse * 3);
      cpGrad.addColorStop(0, '#ffffff');
      cpGrad.addColorStop(0.3, '#eebbff');
      cpGrad.addColorStop(0.65, '#cc88ff');
      cpGrad.addColorStop(1, 'rgba(100,40,180,0)');
      ctx.shadowColor = '#bb88ff'; ctx.shadowBlur = 20 + corePulse * 8;
      ctx.fillStyle = cpGrad;
      ctx.beginPath(); ctx.arc(x, y, 20 + corePulse * 2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 图标 + 等级
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌩️', x, y - 4);

  } else if (cfg.effect === 'snowKingAtk') {
    // ── 雪王：雪人造型（大圆肚+圆头+王冠+红披风+冰杖）
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#88ddff66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(x, y);

    // ═══ 尺寸常量：两节结构——大头(HR=13) + 大身体(BR=16)，紧贴
    const HR = 13;
    const BR = 16;
    const BY = 14;                       // 身体圆心Y
    const HY = BY - BR - HR + 5;        // 头圆心Y，重叠5px紧凑贴合（≈-10）

    // ── 底座阴影
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#006699';
    ctx.beginPath(); ctx.ellipse(0, BY + BR + 2, BR + 3, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // ── 红披风（颈部向下覆盖身体）
    ctx.save();
    ctx.fillStyle = '#cc1111';
    const neckY = HY + HR - 2;   // 颈接触点
    // 左披风
    ctx.beginPath();
    ctx.moveTo(-4, neckY);
    ctx.quadraticCurveTo(-BR - 8, BY - 4, -BR - 4, BY + BR - 4);
    ctx.quadraticCurveTo(-BR + 2, BY + BR + 3, -5, BY + BR - 2);
    ctx.quadraticCurveTo(-BR + 4, BY, -4, neckY + 6);
    ctx.closePath();
    ctx.fill();
    // 右披风（较短，留冰杖位置）
    ctx.beginPath();
    ctx.moveTo(4, neckY);
    ctx.quadraticCurveTo(BR + 2, BY - 6, BR + 1, BY + 6);
    ctx.quadraticCurveTo(BR - 2, BY + BR - 2, 5, BY + BR - 5);
    ctx.quadraticCurveTo(BR - 6, BY, 4, neckY + 4);
    ctx.closePath();
    ctx.fill();
    // 领口亮红椭圆
    ctx.fillStyle = '#ee3333';
    ctx.beginPath(); ctx.ellipse(0, neckY + 2, 6, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // ── 大身体球
    const bodyGrad = ctx.createRadialGradient(-5, BY - 6, 2, 0, BY, BR);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.55, '#dff3ff');
    bodyGrad.addColorStop(1, '#aaddee');
    ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 10 + Math.sin(t * 2) * 3;
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.arc(0, BY, BR, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 纽扣 3颗
    [BY - 7, BY, BY + 7].forEach(by => {
      ctx.fillStyle = '#336699';
      ctx.beginPath(); ctx.arc(0, by, 1.8, 0, Math.PI*2); ctx.fill();
    });

    // ── 左臂（从身体左侧伸出）
    ctx.strokeStyle = '#cceeff'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-BR + 2, BY - 4);
    ctx.quadraticCurveTo(-BR - 8, BY - 10, -BR - 10, BY - 2);
    ctx.stroke();
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath(); ctx.arc(-BR - 10, BY - 2, 3.5, 0, Math.PI*2); ctx.fill();

    // ── 右臂（握住冰杖）
    ctx.strokeStyle = '#cceeff'; ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(BR - 2, BY - 4);
    ctx.quadraticCurveTo(BR + 6, BY - 10, BR + 8, BY - 3);
    ctx.stroke();

    // ── 冰杖（右侧，轻微摇晃）
    ctx.save();
    ctx.translate(BR + 10, BY - 6);
    ctx.rotate(0.12 + Math.sin(t * 1.5) * 0.04);
    // 杖杆（从身体底到头顶冰晶上方）
    const staffGrad = ctx.createLinearGradient(0, BR + 8, 0, -(BR + HR + 10));
    staffGrad.addColorStop(0, '#88bbdd');
    staffGrad.addColorStop(0.5, '#eef8ff');
    staffGrad.addColorStop(1, '#88ccff');
    ctx.strokeStyle = staffGrad; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, BR + 6); ctx.lineTo(0, -(BR + HR + 2)); ctx.stroke();
    // 杖顶六角冰晶（旋转发光）
    ctx.save();
    ctx.translate(0, -(BR + HR + 4));
    ctx.rotate(t * 0.8);
    ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 7 + Math.sin(t * 3) * 3;
    for (let i = 0; i < 6; i++) {
      const ia = (i / 6) * Math.PI * 2;
      const ix = Math.cos(ia) * 6, iy = Math.sin(ia) * 6;
      ctx.strokeStyle = '#88ddff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ix, iy); ctx.stroke();
      ctx.fillStyle = i % 2 === 0 ? '#ccf0ff' : '#eefaff';
      ctx.beginPath(); ctx.arc(ix, iy, 1.8, 0, Math.PI*2); ctx.fill();
    }
    const crystalCore = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
    crystalCore.addColorStop(0, '#ffffff');
    crystalCore.addColorStop(1, 'rgba(136,220,255,0)');
    ctx.fillStyle = crystalCore;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore(); // 冰晶旋转
    ctx.restore(); // 冰杖translate

    // ── 头部（大圆头，最后画在最上层）
    const headGrad = ctx.createRadialGradient(-4, HY - 4, 2, 0, HY, HR);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(1, '#cce8f8');
    ctx.fillStyle = headGrad;
    ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // ── 王冠（头顶，5个尖齿，宽度随头大而增大）
    ctx.save();
    ctx.translate(0, HY - HR);  // 贴着头顶
    const crownGrad = ctx.createLinearGradient(-10, -6, 10, 0);
    crownGrad.addColorStop(0, '#ffe066');
    crownGrad.addColorStop(0.5, '#fffacc');
    crownGrad.addColorStop(1, '#ffd700');
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = '#cc9900'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-8, -6); ctx.lineTo(-5,  -1);
    ctx.lineTo(-1, -8); ctx.lineTo( 1,  -1);
    ctx.lineTo( 4, -6); ctx.lineTo( 7,   0);
    ctx.lineTo( 9, -5); ctx.lineTo(10,   0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // 中央蓝宝石
    ctx.fillStyle = '#88ddff';
    ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(0, -4, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore(); // 王冠

    // ── 脸部五官（跟随头部圆心HY）
    // 眼睛
    ctx.fillStyle = '#1a55cc';
    ctx.beginPath(); ctx.arc(-4.5, HY - 2, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 4.5, HY - 2, 2.5, 0, Math.PI*2); ctx.fill();
    // 眼睛高光
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(-3.5, HY - 3, 1.0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 5.5, HY - 3, 1.0, 0, Math.PI*2); ctx.fill();
    // 胡萝卜鼻（橙色水平小圆柱）
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(0, HY + 1); ctx.lineTo(-2, HY + 2.5); ctx.lineTo(5.5, HY + 1.5); ctx.closePath();
    ctx.fill();
    // 微笑弧线
    ctx.strokeStyle = '#1a44aa'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, HY + 3, 5, 0.2, Math.PI - 0.2); ctx.stroke();


    ctx.restore(); // translate(x,y)

    // 绘制场上活跃暴风雪区域（增强版）
    if (state.snowstorms) {
      const nowS = Date.now() / 1000;
      state.snowstorms.forEach(s => {
        const lifeR = s.life / s.maxLife;
        const alpha = lifeR * 0.55;

        // 1. 冻结地面填充
        const sfg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        sfg.addColorStop(0, `rgba(160,225,255,${alpha * 0.45})`);
        sfg.addColorStop(1, 'rgba(100,180,255,0)');
        ctx.fillStyle = sfg;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();

        // 2. 脉冲外圈
        const pulse = 0.5 + 0.5 * Math.sin(nowS * 4);
        ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 10;
        ctx.strokeStyle = `rgba(140,220,255,${alpha + 0.15 + pulse * 0.1})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. 内旋虚线圈
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(nowS * 1.5);
        ctx.strokeStyle = `rgba(200,240,255,${alpha * 0.6})`;
        ctx.lineWidth = 1; ctx.setLineDash([5, 6]);
        ctx.beginPath(); ctx.arc(0, 0, s.r * 0.65, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();

        // 4. 飘落雪花粒子（伪随机固定位置+时间偏移）
        for (let i = 0; i < 8; i++) {
          const flakeAngle = (i / 8) * Math.PI * 2;
          const flakeDist = s.r * (0.2 + 0.6 * tileHash(Math.floor(s.x), i, 55));
          const flakePhase = tileHash(Math.floor(s.y), i, 56) * Math.PI * 2;
          const fallOffset = ((nowS * 0.8 + flakePhase) % 1.0);
          const fx = s.x + Math.cos(flakeAngle + nowS * 0.3) * flakeDist;
          const fy = s.y - s.r * 0.4 + fallOffset * s.r * 0.8;
          const fa = Math.sin(fallOffset * Math.PI) * alpha * 0.9;
          ctx.fillStyle = `rgba(220,245,255,${fa})`;
          ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI*2); ctx.fill();
          // 雪花十字
          ctx.strokeStyle = `rgba(200,235,255,${fa * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(fx-2.5, fy); ctx.lineTo(fx+2.5, fy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx, fy-2.5); ctx.lineTo(fx, fy+2.5); ctx.stroke();
        }
      });
    }
  } else if (cfg.effect === 'volcanoAura') {
    // ── 小火山：熔岩口 + 喷火粒子 + 橙红核心
    const aoeR = cfg.aoeRange * CS;
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, aoeR, 0, Math.PI*2);
      ctx.strokeStyle = '#ff440066'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff220009'; ctx.fill();
    }
    // 橙红渐变核心（先画，在底层）
    const vGrad = ctx.createRadialGradient(x, y, 2, x, y, 18);
    vGrad.addColorStop(0, '#ffffaa');
    vGrad.addColorStop(0.4, '#ff6600');
    vGrad.addColorStop(1, 'rgba(180,0,0,0)');
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12 + Math.sin(t * 3) * 5;
    ctx.fillStyle = vGrad;
    ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 图标（核心之上）
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌋', x, y - 3);
    // 旋转熔岩石块（4个，在图标之上轨道环绕）
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * Math.PI / 2;
      const rx = x + Math.cos(a) * 22, ry = y + Math.sin(a) * 22;
      ctx.shadowColor = i % 2 === 0 ? '#ff2200' : '#ff8800'; ctx.shadowBlur = 6;
      ctx.fillStyle = i % 2 === 0 ? '#cc3300' : '#ff6600';
      ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  } else if (cfg.effect === 'bigVolcanoAura') {
    // ── 大火山：更大核心 + 6颗旋转熔岩石 + 双层光晕 + AOE范围圈
    const bigAoeR = cfg.aoeRange * CS;
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, bigAoeR, 0, Math.PI*2);
      ctx.strokeStyle = '#ff220088'; ctx.lineWidth = 2; ctx.setLineDash([5,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff110012'; ctx.fill();
    }
    // 底座熔岩底盘
    ctx.fillStyle = '#440000';
    ctx.beginPath(); ctx.ellipse(x, y + 12, 22, 9, 0, 0, Math.PI*2); ctx.fill();
    // 外层脉冲光晕
    const bvPulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 18 + bvPulse * 12;
    const bvOuter = ctx.createRadialGradient(x, y, 4, x, y, 26);
    bvOuter.addColorStop(0, '#ffffff');
    bvOuter.addColorStop(0.3, '#ff8800');
    bvOuter.addColorStop(0.7, '#cc2200');
    bvOuter.addColorStop(1, 'rgba(150,0,0,0)');
    ctx.fillStyle = bvOuter;
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 图标（更大字号）
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌋', x, y - 4);
    // 旋转熔岩石块（6个，轨道更大，交替快慢）
    for (let i = 0; i < 6; i++) {
      const a = t * (i % 2 === 0 ? 1.2 : -0.8) + i * Math.PI / 3;
      const rx = x + Math.cos(a) * 26, ry = y + Math.sin(a) * 26;
      ctx.shadowColor = i % 3 === 0 ? '#ff0000' : '#ff8800'; ctx.shadowBlur = 8;
      ctx.fillStyle = i % 3 === 0 ? '#aa1100' : (i % 3 === 1 ? '#ff5500' : '#ffaa00');
      ctx.beginPath(); ctx.arc(rx, ry, 6 + (i % 2) * 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  } else if (cfg.effect === 'vajraAtk') {
    // ── 金刚：旋转金色棱形碎片 + 金色核心
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ffe06666'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 6片旋转棱形（交替金/橙）
    for (let i = 0; i < 6; i++) {
      const a = t * 1.8 + i * Math.PI / 3;
      const rx = x + Math.cos(a) * 18, ry = y + Math.sin(a) * 18;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(a + t * 1.8);
      ctx.fillStyle = i % 2 === 0 ? '#ffe066' : '#ffaa00';
      ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(4,0); ctx.lineTo(0,6); ctx.lineTo(-4,0); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // 金色渐变核心
    const vjGrad = ctx.createRadialGradient(x, y, 2, x, y, 17);
    vjGrad.addColorStop(0, '#ffffff');
    vjGrad.addColorStop(0.35, '#ffe066');
    vjGrad.addColorStop(1, 'rgba(200,120,0,0)');
    ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 16 + Math.sin(t * 2.5) * 5;
    ctx.fillStyle = vjGrad;
    ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💎', x, y - 3);
  } else if (cfg.effect === 'greatVajraAtk') {
    // ── 大金刚：更大的旋转金橙棱形 + 双层核心
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ffcc0066'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 8片旋转棱形（双层）
    for (let i = 0; i < 8; i++) {
      const a = t * 2.2 + i * Math.PI / 4;
      const dist = i % 2 === 0 ? 22 : 15;
      const rx = x + Math.cos(a) * dist, ry = y + Math.sin(a) * dist;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(a + t * 2.2);
      ctx.fillStyle = i % 2 === 0 ? '#ffcc00' : '#ff8800';
      ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(5,0); ctx.lineTo(0,7); ctx.lineTo(-5,0); ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    // 双层渐变核心
    const gvCore = ctx.createRadialGradient(x, y, 2, x, y, 20);
    gvCore.addColorStop(0, '#ffffff');
    gvCore.addColorStop(0.3, '#ffdd00');
    gvCore.addColorStop(0.7, '#ff8800');
    gvCore.addColorStop(1, 'rgba(200,80,0,0)');
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 20 + Math.sin(t * 3) * 6;
    ctx.fillStyle = gvCore;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔷', x, y - 3);
  } else if (cfg.effect === 'jellyAtk') {
    // ── 雷公：半透明触手 + 蓝紫核心
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#88aaff66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 8条摆动触手
    for (let i = 0; i < 8; i++) {
      const baseA = i * Math.PI / 4 + t * 0.7;
      const wave = Math.sin(t * 3 + i) * 0.3;
      ctx.save(); ctx.translate(x, y); ctx.rotate(baseA + wave);
      ctx.strokeStyle = `rgba(140,160,255,${0.5 + Math.sin(t*2+i)*0.2})`;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(4, 18, 0, 26); ctx.stroke();
      ctx.restore();
    }
    // 蓝紫渐变核心
    const jGrad = ctx.createRadialGradient(x, y, 2, x, y, 15);
    jGrad.addColorStop(0, '#ffffff');
    jGrad.addColorStop(0.4, '#88aaff');
    jGrad.addColorStop(1, 'rgba(80,0,180,0)');
    ctx.shadowColor = '#6688ff'; ctx.shadowBlur = 10 + Math.sin(t*3)*4;
    ctx.fillStyle = jGrad;
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🪼', x, y - 2);
  } else if (cfg.effect === 'thunderKingAtk') {
    // ── 雷王：更大的放电球核心 + 旋转闪电弧 + 金黄色光环
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ffe06666'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 旋转闪电弧（6条）
    for (let i = 0; i < 6; i++) {
      const baseA = i * Math.PI / 3 + t * 2.0;
      ctx.save(); ctx.translate(x, y); ctx.rotate(baseA);
      ctx.strokeStyle = `rgba(255,220,80,${0.6 + Math.sin(t*4+i)*0.3})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(3, 16);
      ctx.lineTo(-2, 20);
      ctx.lineTo(1, 28);
      ctx.stroke();
      ctx.restore();
    }
    // 金黄色外光圈
    const tkRing = ctx.createRadialGradient(x, y, 10, x, y, 24);
    tkRing.addColorStop(0, 'rgba(255,230,80,0.18)');
    tkRing.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = tkRing;
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI*2); ctx.fill();
    // 金黄渐变核心（比雷公更亮更大）
    const tkGrad = ctx.createRadialGradient(x, y, 2, x, y, 18);
    tkGrad.addColorStop(0, '#ffffff');
    tkGrad.addColorStop(0.35, '#ffe066');
    tkGrad.addColorStop(0.7, '#ffaa00');
    tkGrad.addColorStop(1, 'rgba(200,100,0,0)');
    ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 16 + Math.sin(t*4)*6;
    ctx.fillStyle = tkGrad;
    ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡', x, y - 2);
  } else if (cfg.effect === 'gunnerAura') {
    // ══════════════════════════════════════════
    // ── 火枪手：矮壮老兵 + 长步枪 + 绿色地面光环（0.8x缩放）
    // ══════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.8, 0.8);

    // 0. 脚下旋转绿色光环
    const gRingR = 20 + Math.sin(t * 2) * 1.5;
    const gRingGrad = ctx.createRadialGradient(0, 0, gRingR - 4, 0, 0, gRingR + 4);
    gRingGrad.addColorStop(0, 'rgba(0,255,80,0)');
    gRingGrad.addColorStop(0.4, 'rgba(0,255,80,0.55)');
    gRingGrad.addColorStop(1, 'rgba(0,255,80,0)');
    ctx.fillStyle = gRingGrad;
    ctx.beginPath(); ctx.arc(0, 0, gRingR + 4, 0, Math.PI * 2); ctx.fill();
    // 绿色光环实线
    ctx.beginPath(); ctx.arc(0, 0, gRingR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,80,${0.7 + 0.3 * Math.sin(t * 3)})`;
    ctx.lineWidth = 2.2; ctx.stroke();

    // 选中时加虚线范围圈
    if (isSel) {
      ctx.beginPath(); ctx.arc(0, 0, cfg.aoeRange * CS, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffaa4455'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 微小呼吸：枪口随时间左右摆动
    const sway = Math.sin(t * 1.8) * 0.04;
    ctx.rotate(sway);

    // --- 1. 腿部（深褐色裤子，两腿略分开）---
    ctx.fillStyle = '#4a3010';
    // 左腿
    ctx.beginPath();
    ctx.roundRect(-8, 5, 6, 11, 2);
    ctx.fill();
    // 右腿
    ctx.beginPath();
    ctx.roundRect(2, 5, 6, 11, 2);
    ctx.fill();
    // 靴子（深色）
    ctx.fillStyle = '#2a1a06';
    ctx.beginPath(); ctx.roundRect(-9, 14, 8, 4, 1); ctx.fill();
    ctx.beginPath(); ctx.roundRect(1, 14, 8, 4, 1); ctx.fill();

    // --- 2. 躯干（金属盔甲）---
    // 盔甲主体
    const armorGrad = ctx.createLinearGradient(-10, -8, 10, 6);
    armorGrad.addColorStop(0, '#c8b87a');
    armorGrad.addColorStop(0.4, '#a09060');
    armorGrad.addColorStop(1, '#706840');
    ctx.fillStyle = armorGrad;
    ctx.beginPath(); ctx.roundRect(-9, -8, 18, 14, 3); ctx.fill();
    // 盔甲高光（左上角反光）
    ctx.fillStyle = 'rgba(255,245,200,0.30)';
    ctx.beginPath(); ctx.roundRect(-8, -7, 7, 5, 2); ctx.fill();
    // 盔甲横纹（腰带）
    ctx.strokeStyle = '#5a4820'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, 2); ctx.stroke();

    // --- 3. 左臂（持枪，伸向右后方）---
    ctx.fillStyle = '#c8b87a';
    ctx.save();
    ctx.translate(-5, -2);
    ctx.rotate(0.25);
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 10, 2); ctx.fill();
    ctx.restore();

    // --- 4. 右臂（伸直向右，扶枪管）---
    ctx.fillStyle = '#c8b87a';
    ctx.save();
    ctx.translate(6, -1);
    ctx.rotate(-0.18);
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 8, 2); ctx.fill();
    ctx.restore();

    // --- 5. 长步枪（斜向右上，从腰部穿出）---
    ctx.save();
    ctx.rotate(-0.38); // 向右上倾斜约22度
    // 枪托（木纹色，粗）
    const stockGrad = ctx.createLinearGradient(-4, 2, 4, 18);
    stockGrad.addColorStop(0, '#8B5e2a');
    stockGrad.addColorStop(1, '#5a3a12');
    ctx.fillStyle = stockGrad;
    ctx.beginPath(); ctx.roundRect(-3, 2, 7, 16, 2); ctx.fill();
    // 枪管（金属灰，细长）
    const barrelGrad = ctx.createLinearGradient(-2, -22, 2, 2);
    barrelGrad.addColorStop(0, '#e0e0e0');
    barrelGrad.addColorStop(0.5, '#909090');
    barrelGrad.addColorStop(1, '#505050');
    ctx.fillStyle = barrelGrad;
    ctx.beginPath(); ctx.roundRect(-2, -22, 5, 26, 1); ctx.fill();
    // 准星（枪口处小横条）
    ctx.fillStyle = '#cccccc';
    ctx.beginPath(); ctx.rect(-4, -23, 9, 2); ctx.fill();
    // 枪管箍（金属环）
    ctx.fillStyle = '#888888';
    ctx.beginPath(); ctx.rect(-3, -8, 7, 3); ctx.fill();
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath(); ctx.rect(-3, -8, 7, 1); ctx.fill();
    ctx.restore();

    // --- 6. 头部（矮壮老头）---
    // 颈部
    ctx.fillStyle = '#d4a070';
    ctx.beginPath(); ctx.roundRect(-4, -16, 8, 6, 1); ctx.fill();
    // 脸（方圆形，粉棕皮肤）
    const faceGrad = ctx.createRadialGradient(-1, -21, 1, 0, -20, 9);
    faceGrad.addColorStop(0, '#f0c080');
    faceGrad.addColorStop(1, '#c07840');
    ctx.fillStyle = faceGrad;
    ctx.beginPath(); ctx.arc(0, -21, 8, 0, Math.PI * 2); ctx.fill();
    // 白胡须
    ctx.fillStyle = '#e8e8e0';
    ctx.beginPath(); ctx.ellipse(0, -16, 6, 4, 0, 0, Math.PI); ctx.fill();
    // 眉毛（白色浓眉）
    ctx.strokeStyle = '#ddddcc'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-6, -23); ctx.quadraticCurveTo(-3, -25, 0, -23); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -23); ctx.quadraticCurveTo(3, -25, 0, -23); ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#2a1a00';
    ctx.beginPath(); ctx.arc(-3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    // 眼白高光
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-2.5, -22.5, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -22.5, 0.6, 0, Math.PI * 2); ctx.fill();

    // --- 7. 蓝色帽子（标志性大帽子）---
    // 帽身
    const hatGrad = ctx.createLinearGradient(-9, -36, 9, -24);
    hatGrad.addColorStop(0, '#4488ee');
    hatGrad.addColorStop(0.5, '#2255bb');
    hatGrad.addColorStop(1, '#1133aa');
    ctx.fillStyle = hatGrad;
    ctx.beginPath();
    ctx.moveTo(-8, -29);
    ctx.lineTo(-7, -38);
    ctx.lineTo(7, -38);
    ctx.lineTo(8, -29);
    ctx.closePath();
    ctx.fill();
    // 帽沿
    ctx.fillStyle = '#3366cc';
    ctx.beginPath(); ctx.roundRect(-11, -30, 22, 4, 2); ctx.fill();
    // 帽子高光
    ctx.fillStyle = 'rgba(150,200,255,0.35)';
    ctx.beginPath(); ctx.roundRect(-6, -37, 5, 6, 1); ctx.fill();
    // 帽子徽章（小金色圆）
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(0, -33, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.arc(0, -33, 1.2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

  } else if (cfg.effect === 'scopeAura') {
    // ── 望远镜：光圈 + 旋转镜片 + 中心图标
    const ringColor = '#88ccff';
    const icon = '🔭';
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.aoeRange * CS, 0, Math.PI*2);
      ctx.strokeStyle = ringColor + '55'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * Math.PI * 2 / 4;
      const rr = 18 + Math.sin(t * 2 + i) * 3;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = `${ringColor}${Math.round((0.4 + Math.sin(t*2+i)*0.2) * 255).toString(16).padStart(2,'0')}`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, rr); ctx.stroke();
      ctx.restore();
    }
    const sRing = ctx.createRadialGradient(x, y, 8, x, y, 22);
    sRing.addColorStop(0, `${ringColor}44`);
    sRing.addColorStop(1, `${ringColor}00`);
    ctx.fillStyle = sRing;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fill();
    const sGrad = ctx.createRadialGradient(x, y, 2, x, y, 14);
    sGrad.addColorStop(0, '#ffffff');
    sGrad.addColorStop(0.5, ringColor);
    sGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.shadowColor = ringColor; ctx.shadowBlur = 10 + Math.sin(t*3)*4;
    ctx.fillStyle = sGrad;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y - 1);

  } else if (cfg.effect === 'sniperAura') {
    // ══════════════════════════════════════════
    // ── 神枪手：与火枪手同款老兵，橙红色光环 + 红色帽徽（1.0x = 火枪手的1.25倍）
    // ══════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.0, 1.0);

    // 0. 脚下旋转橙红色光环
    const snRingR = 20 + Math.sin(t * 2) * 1.5;
    const snRingGrad = ctx.createRadialGradient(0, 0, snRingR - 4, 0, 0, snRingR + 4);
    snRingGrad.addColorStop(0, 'rgba(255,80,0,0)');
    snRingGrad.addColorStop(0.4, 'rgba(255,80,0,0.55)');
    snRingGrad.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = snRingGrad;
    ctx.beginPath(); ctx.arc(0, 0, snRingR + 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, snRingR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,100,0,${0.7 + 0.3 * Math.sin(t * 3)})`;
    ctx.lineWidth = 2.2; ctx.stroke();

    if (isSel) {
      ctx.beginPath(); ctx.arc(0, 0, cfg.aoeRange * CS, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff662255'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }

    const snSway = Math.sin(t * 1.8) * 0.04;
    ctx.rotate(snSway);

    // 1. 腿部（深褐色裤子）
    ctx.fillStyle = '#4a3010';
    ctx.beginPath(); ctx.roundRect(-8, 5, 6, 11, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, 5, 6, 11, 2); ctx.fill();
    ctx.fillStyle = '#2a1a06';
    ctx.beginPath(); ctx.roundRect(-9, 14, 8, 4, 1); ctx.fill();
    ctx.beginPath(); ctx.roundRect(1, 14, 8, 4, 1); ctx.fill();

    // 2. 躯干（金属盔甲）
    const snArmorGrad = ctx.createLinearGradient(-10, -8, 10, 6);
    snArmorGrad.addColorStop(0, '#c8b87a');
    snArmorGrad.addColorStop(0.4, '#a09060');
    snArmorGrad.addColorStop(1, '#706840');
    ctx.fillStyle = snArmorGrad;
    ctx.beginPath(); ctx.roundRect(-9, -8, 18, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,0.30)';
    ctx.beginPath(); ctx.roundRect(-8, -7, 7, 5, 2); ctx.fill();
    ctx.strokeStyle = '#5a4820'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, 2); ctx.stroke();

    // 3. 左臂
    ctx.fillStyle = '#c8b87a';
    ctx.save();
    ctx.translate(-5, -2); ctx.rotate(0.25);
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 10, 2); ctx.fill();
    ctx.restore();

    // 4. 右臂
    ctx.fillStyle = '#c8b87a';
    ctx.save();
    ctx.translate(6, -1); ctx.rotate(-0.18);
    ctx.beginPath(); ctx.roundRect(-3, 0, 6, 8, 2); ctx.fill();
    ctx.restore();

    // 5. 长步枪（橙红色枪口发光）
    ctx.save();
    ctx.rotate(-0.38);
    const snStockGrad = ctx.createLinearGradient(-4, 2, 4, 18);
    snStockGrad.addColorStop(0, '#8B5e2a'); snStockGrad.addColorStop(1, '#5a3a12');
    ctx.fillStyle = snStockGrad;
    ctx.beginPath(); ctx.roundRect(-3, 2, 7, 16, 2); ctx.fill();
    const snBarrelGrad = ctx.createLinearGradient(-2, -22, 2, 2);
    snBarrelGrad.addColorStop(0, '#e0e0e0'); snBarrelGrad.addColorStop(0.5, '#909090'); snBarrelGrad.addColorStop(1, '#505050');
    ctx.fillStyle = snBarrelGrad;
    ctx.beginPath(); ctx.roundRect(-2, -22, 5, 26, 1); ctx.fill();
    ctx.fillStyle = '#cccccc';
    ctx.beginPath(); ctx.rect(-4, -23, 9, 2); ctx.fill();
    ctx.fillStyle = '#888888';
    ctx.beginPath(); ctx.rect(-3, -8, 7, 3); ctx.fill();
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath(); ctx.rect(-3, -8, 7, 1); ctx.fill();
    // 橙红色枪口辉光
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
    ctx.strokeStyle = 'rgba(255,100,0,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -18); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 6. 颈部
    ctx.fillStyle = '#d4a070';
    ctx.beginPath(); ctx.roundRect(-4, -16, 8, 6, 1); ctx.fill();

    // 7. 脸部
    const snFaceGrad = ctx.createRadialGradient(-1, -21, 1, 0, -20, 9);
    snFaceGrad.addColorStop(0, '#f0c080'); snFaceGrad.addColorStop(1, '#c07840');
    ctx.fillStyle = snFaceGrad;
    ctx.beginPath(); ctx.arc(0, -21, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e8e0';
    ctx.beginPath(); ctx.ellipse(0, -16, 6, 4, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#ddddcc'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-6, -23); ctx.quadraticCurveTo(-3, -25, 0, -23); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -23); ctx.quadraticCurveTo(3, -25, 0, -23); ctx.stroke();
    ctx.fillStyle = '#2a1a00';
    ctx.beginPath(); ctx.arc(-3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-2.5, -22.5, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -22.5, 0.6, 0, Math.PI * 2); ctx.fill();

    // 8. 蓝色帽子（与火枪手一致）
    const snHatGrad = ctx.createLinearGradient(-9, -36, 9, -24);
    snHatGrad.addColorStop(0, '#4488ee');
    snHatGrad.addColorStop(0.5, '#2255bb');
    snHatGrad.addColorStop(1, '#1133aa');
    ctx.fillStyle = snHatGrad;
    ctx.beginPath();
    ctx.moveTo(-8, -29); ctx.lineTo(-7, -38); ctx.lineTo(7, -38); ctx.lineTo(8, -29);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3366cc';
    ctx.beginPath(); ctx.roundRect(-11, -30, 22, 4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(150,200,255,0.35)';
    ctx.beginPath(); ctx.roundRect(-6, -37, 5, 6, 1); ctx.fill();
    // 帽子徽章（红色，区分神枪手）
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff5500'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, -33, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8866';
    ctx.beginPath(); ctx.arc(0, -33, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

  } else if (cfg.effect === 'rainbowAura') {
    // ══════════════════════════════════════════════════
    // ── 彩精灵：七彩旋转光球本体 + 向右边塔的动态彩虹光线
    // ══════════════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);

    // 选中时显示左右各1格范围提示
    if (isSel) {
      const CS_hint = CELL;
      ctx.strokeStyle = 'rgba(255,200,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]);
      // 左边1格
      ctx.beginPath(); ctx.rect(-CS_hint, -CS_hint/2, CS_hint, CS_hint); ctx.stroke();
      // 右边1格
      ctx.beginPath(); ctx.rect(0, -CS_hint/2, CS_hint, CS_hint); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 1. 七彩旋转光晕（外环）
    const rbColors = ['#ff4444','#ff8800','#ffee00','#44dd44','#44aaff','#8844ff','#ff44cc'];
    for (let i = 0; i < rbColors.length; i++) {
      const a = t * 1.8 + i * Math.PI * 2 / rbColors.length;
      const rx = Math.cos(a) * 16, ry = Math.sin(a) * 16;
      const alpha = 0.5 + 0.4 * Math.sin(t * 3 + i * 0.9);
      ctx.fillStyle = rbColors[i].replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', '');
      ctx.shadowColor = rbColors[i]; ctx.shadowBlur = 8;
      // 直接画彩色小球
      ctx.fillStyle = rbColors[i];
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(rx, ry, 4.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    // ── 2. 中央七彩渐变核心球
    const rbCoreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    const coreHue = (t * 60) % 360;
    rbCoreGrad.addColorStop(0, '#ffffff');
    rbCoreGrad.addColorStop(0.3, `hsl(${coreHue},100%,70%)`);
    rbCoreGrad.addColorStop(0.7, `hsl(${(coreHue+120)%360},100%,55%)`);
    rbCoreGrad.addColorStop(1, `hsl(${(coreHue+240)%360},100%,40%)`);
    ctx.shadowColor = `hsl(${coreHue},100%,70%)`; ctx.shadowBlur = 14 + Math.sin(t*3)*4;
    ctx.fillStyle = rbCoreGrad;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // ── 3. 动态彩虹光线连接到左右两侧的塔
    // 绘制单侧彩虹连线的辅助函数
    function drawRainbowLine(targetKey) {
      const [sr2, sc2] = key.split(',').map(Number);
      const [tr2, tc2] = targetKey.split(',').map(Number);
      const dtx = (tc2 - sc2) * CS;
      const dty = (tr2 - sr2) * CS;
      const startX = dtx > 0 ? 12 : -12; // 向右出发点 +12，向左出发点 -12
      const endX   = dtx > 0 ? dtx - 12 : dtx + 12;
      for (let li = 0; li < rbColors.length; li++) {
        const phaseOffset = li * Math.PI * 2 / rbColors.length;
        const lineAlpha = 0.55 + 0.3 * Math.sin(t * 4 + phaseOffset);
        ctx.save();
        ctx.globalAlpha = lineAlpha;
        ctx.strokeStyle = rbColors[li];
        ctx.lineWidth = 2;
        ctx.shadowColor = rbColors[li]; ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        const waveAmp = 8 * Math.sin(t * 3 + phaseOffset);
        const midX = dtx * 0.5;
        const midY = dty * 0.5 + waveAmp;
        ctx.quadraticCurveTo(midX, midY, endX, dty);
        ctx.stroke();
        ctx.restore();
      }
      for (let pi2 = 0; pi2 < 5; pi2++) {
        const pProgress = ((t * 0.9 + pi2 * 0.2) % 1);
        const ppx = startX + (endX - startX) * pProgress;
        const ppy = dty * pProgress + 6 * Math.sin(pProgress * Math.PI * 4 + t * 3);
        const pcol = rbColors[Math.floor((t * 5 + pi2) % rbColors.length)];
        const palpha = pProgress < 0.1 ? pProgress / 0.1
                     : pProgress > 0.9 ? (1 - pProgress) / 0.1 : 1;
        ctx.globalAlpha = palpha * 0.9;
        ctx.fillStyle = pcol;
        ctx.shadowColor = pcol; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(ppx, ppy, 3, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    if (tower && tower.rainbowTarget)     drawRainbowLine(tower.rainbowTarget);
    if (tower && tower.rainbowTargetLeft) drawRainbowLine(tower.rainbowTargetLeft);

    ctx.restore();

  } else if (cfg.effect === 'goldMachineGen') {
    // ── 金币机：旋转金币环 + 金色脉冲核心 + 倒计时进度弧
    // 旋转金币（8枚）
    for (let i = 0; i < 8; i++) {
      const a = t * 1.1 + i * Math.PI / 4;
      const rx = x + Math.cos(a) * 19, ry = y + Math.sin(a) * 19;
      ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#ffaa00';
      ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI*2); ctx.fill();
      // 高光
      ctx.fillStyle = 'rgba(255,255,200,0.6)';
      ctx.beginPath(); ctx.arc(rx - 1, ry - 1, 1.5, 0, Math.PI*2); ctx.fill();
    }
    // 金色渐变核心（随冷却脉冲）
    const cd = tower.specialCooldown || 0;
    const pulse = 0.6 + 0.4 * Math.sin(t * (cd < 1 ? 8 : 2));
    const gmGrad = ctx.createRadialGradient(x, y, 2, x, y, 16);
    gmGrad.addColorStop(0, '#ffffff');
    gmGrad.addColorStop(0.4, `rgba(255,215,0,${pulse})`);
    gmGrad.addColorStop(1, 'rgba(180,100,0,0)');
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 12 + Math.sin(t * 2) * 4;
    ctx.fillStyle = gmGrad;
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 冷却进度弧（绿色）
    const progress = 1 - Math.min(cd / 6, 1);
    ctx.beginPath();
    ctx.arc(x, y, 20, -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
    ctx.strokeStyle = cd < 0.5 ? '#00ff88' : '#ffd70088';
    ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏦', x, y - 3);

  } else if (cfg.effect === 'phantomAssassinAtk') {
    // ══════════════════════════════════════════════════
    // ── 幻影刺客：暗紫披风 + 蓝色发光头冠 + 长剑 + 紫/蓝能量氛围
    // ══════════════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);

    if (isSel) {
      ctx.beginPath(); ctx.arc(0, 0, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#cc44ff44'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 0. 地面暗紫色阴影光晕
    const paFloor = ctx.createRadialGradient(0, 10, 2, 0, 10, 22);
    paFloor.addColorStop(0, 'rgba(100,0,180,0.45)');
    paFloor.addColorStop(1, 'rgba(60,0,120,0)');
    ctx.fillStyle = paFloor;
    ctx.beginPath(); ctx.ellipse(0, 10, 22, 8, 0, 0, Math.PI*2); ctx.fill();

    // 1. 漂浮的蓝紫能量粒子（周围绕转）
    for (let i = 0; i < 6; i++) {
      const pa = t * 2.0 + i * Math.PI / 3;
      const pr = 18 + Math.sin(t * 3 + i * 1.2) * 3;
      const px2 = Math.cos(pa) * pr;
      const py2 = -4 + Math.sin(pa) * pr * 0.45;
      const alpha = 0.4 + 0.4 * Math.sin(t * 4 + i);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(100,160,255,${alpha})`
        : `rgba(180,80,255,${alpha})`;
      ctx.shadowColor = i % 2 === 0 ? '#44aaff' : '#aa44ff';
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px2, py2, 1.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 轻微呼吸摆动
    const paSway = Math.sin(t * 1.6) * 0.05;
    ctx.rotate(paSway);

    // 2. 腿部（深黑裤+靴）
    ctx.fillStyle = '#18102a';
    ctx.beginPath(); ctx.roundRect(-7, 4, 5, 13, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, 4, 5, 13, 2); ctx.fill();
    // 靴子
    ctx.fillStyle = '#0e0818';
    ctx.beginPath(); ctx.roundRect(-8, 15, 7, 5, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(1, 15, 7, 5, 2); ctx.fill();
    ctx.strokeStyle = '#4422aa'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(-8, 15, 7, 5, 2); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(1, 15, 7, 5, 2); ctx.stroke();

    // 3. 飘逸暗紫披风（宽，向两侧展开）
    ctx.save();
    const capeL = ctx.createLinearGradient(-20, -5, 0, 14);
    capeL.addColorStop(0, 'rgba(40,10,70,0.92)');
    capeL.addColorStop(0.5, 'rgba(70,20,110,0.80)');
    capeL.addColorStop(1, 'rgba(20,5,40,0.0)');
    ctx.fillStyle = capeL;
    const capeSwayL = Math.sin(t * 1.4) * 3;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.quadraticCurveTo(-15 + capeSwayL, 2, -22 + capeSwayL * 1.5, 14);
    ctx.lineTo(-18 + capeSwayL, 18);
    ctx.quadraticCurveTo(-10 + capeSwayL * 0.5, 6, -7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    const capeR = ctx.createLinearGradient(20, -5, 0, 14);
    capeR.addColorStop(0, 'rgba(40,10,70,0.92)');
    capeR.addColorStop(0.5, 'rgba(70,20,110,0.80)');
    capeR.addColorStop(1, 'rgba(20,5,40,0.0)');
    ctx.fillStyle = capeR;
    const capeSwayR = Math.sin(t * 1.4 + 0.8) * 3;
    ctx.beginPath();
    ctx.moveTo(8, -4);
    ctx.quadraticCurveTo(15 - capeSwayR, 2, 22 - capeSwayR * 1.5, 14);
    ctx.lineTo(18 - capeSwayR, 18);
    ctx.quadraticCurveTo(10 - capeSwayR * 0.5, 6, 7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. 躯干（暗色甲胄，镶嵌蓝紫宝石）
    const paTorso = ctx.createLinearGradient(-9, -10, 9, 6);
    paTorso.addColorStop(0, '#2a1a44');
    paTorso.addColorStop(0.5, '#1a1030');
    paTorso.addColorStop(1, '#0e0820');
    ctx.fillStyle = paTorso;
    ctx.beginPath(); ctx.roundRect(-9, -10, 18, 16, 3); ctx.fill();
    // 甲胄纹路
    ctx.strokeStyle = '#5533aa'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(9, -1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 6); ctx.stroke();
    // 胸前蓝色宝石
    ctx.fillStyle = '#4499ff';
    ctx.shadowColor = '#66bbff'; ctx.shadowBlur = 8 + Math.sin(t * 3) * 3;
    ctx.beginPath(); ctx.arc(0, -4, 3, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaddff';
    ctx.beginPath(); ctx.arc(-0.8, -4.8, 1.2, 0, Math.PI*2); ctx.fill();

    // 5. 左臂（自然下垂，略向外）
    ctx.save();
    ctx.translate(-9, -4);
    ctx.rotate(0.2);
    ctx.fillStyle = '#2a1a44';
    ctx.beginPath(); ctx.roundRect(-3, 0, 5, 11, 2); ctx.fill();
    ctx.restore();

    // 6. 右臂（持剑，向前伸出）
    ctx.save();
    ctx.translate(9, -5);
    ctx.rotate(-0.2 + Math.sin(t * 2.2) * 0.1);
    ctx.fillStyle = '#2a1a44';
    ctx.beginPath(); ctx.roundRect(-3, 0, 5, 10, 2); ctx.fill();
    ctx.restore();

    // 7. 长剑（斜持，散发蓝紫能量）
    ctx.save();
    ctx.rotate(-0.55 + Math.sin(t * 1.8) * 0.06);
    // 剑柄
    const paHiltG = ctx.createLinearGradient(-2, 4, 2, 16);
    paHiltG.addColorStop(0, '#5533aa'); paHiltG.addColorStop(1, '#2a1a55');
    ctx.fillStyle = paHiltG;
    ctx.beginPath(); ctx.roundRect(-2, 4, 5, 12, 2); ctx.fill();
    // 护手
    ctx.fillStyle = '#334488';
    ctx.beginPath(); ctx.roundRect(-7, 3, 14, 4, 2); ctx.fill();
    ctx.strokeStyle = '#5566cc'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.roundRect(-7, 3, 14, 4, 2); ctx.stroke();
    // 剑身（细长，蓝紫渐变）
    const paBladeG = ctx.createLinearGradient(-2, -26, 2, 4);
    paBladeG.addColorStop(0, '#aaddff');
    paBladeG.addColorStop(0.25, '#7799ff');
    paBladeG.addColorStop(0.6, '#5544cc');
    paBladeG.addColorStop(1, '#2a1a55');
    ctx.fillStyle = paBladeG;
    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.lineTo(-1, -26);
    ctx.lineTo(0, -30);
    ctx.lineTo(1, -26);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();
    // 剑刃中脊高光
    ctx.strokeStyle = 'rgba(200,230,255,0.75)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -28); ctx.stroke();
    // 剑刃能量光晕
    ctx.shadowColor = '#6688ff'; ctx.shadowBlur = 10 + Math.sin(t * 3) * 4;
    ctx.strokeStyle = 'rgba(100,150,255,0.45)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -28); ctx.stroke();
    ctx.shadowBlur = 0;
    // 剑锋小蓝点
    ctx.fillStyle = '#88ccff';
    ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, -30, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 8. 颈部
    ctx.fillStyle = '#1a1030';
    ctx.beginPath(); ctx.roundRect(-4, -18, 8, 6, 1); ctx.fill();

    // 9. 脸（精致，偏阴柔）
    const paFaceG = ctx.createRadialGradient(-1, -23, 1, 0, -22, 8);
    paFaceG.addColorStop(0, '#d0b8e8');
    paFaceG.addColorStop(1, '#8860b0');
    ctx.fillStyle = paFaceG;
    ctx.beginPath(); ctx.ellipse(0, -23, 7, 8.5, 0, 0, Math.PI*2); ctx.fill();
    // 发光眼睛（蓝色）
    ctx.fillStyle = '#3399ff';
    ctx.shadowColor = '#55aaff'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(-3.5, -24, 2, 1.2, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.5, -24, 2, 1.2, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(180,230,255,0.8)';
    ctx.beginPath(); ctx.arc(-3, -24.5, 0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -24.5, 0.7, 0, Math.PI*2); ctx.fill();

    // 10. 蓝色发光头冠（三叉形，标志性）
    // 头冠底座
    const crownBase = ctx.createLinearGradient(-8, -33, 8, -28);
    crownBase.addColorStop(0, '#223388');
    crownBase.addColorStop(0.5, '#1133aa');
    crownBase.addColorStop(1, '#112277');
    ctx.fillStyle = crownBase;
    ctx.beginPath(); ctx.roundRect(-8, -33, 16, 5, [4,4,0,0]); ctx.fill();
    // 三个尖角
    const crownSpikes = [[-5, -33, -4, -43], [0, -33, 0, -47], [5, -33, 4, -43]];
    crownSpikes.forEach(([bx, by, tx, ty]) => {
      const spG = ctx.createLinearGradient(bx, by, tx, ty);
      spG.addColorStop(0, '#3355cc');
      spG.addColorStop(1, '#88ccff');
      ctx.fillStyle = spG;
      ctx.beginPath();
      ctx.moveTo(bx - 2.5, by);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx + 2.5, by);
      ctx.closePath();
      ctx.fill();
    });
    // 顶部蓝光宝石
    ctx.fillStyle = '#66bbff';
    ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 12 + Math.sin(t * 3) * 4;
    ctx.beginPath(); ctx.arc(0, -47, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-4, -43, 1.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -43, 1.8, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#cceeff';
    ctx.beginPath(); ctx.arc(0, -47.8, 1, 0, Math.PI*2); ctx.fill();

    ctx.restore();

  } else if (cfg.effect === 'crystalAtk') {
    // ── 结晶：旋转棱柱 + 彩虹折射光 + 粉色核心
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ff88cc66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 旋转彩色光射线（6条）
    for (let i = 0; i < 6; i++) {
      const a = t * 1.8 + i * Math.PI / 3;
      const cr = 16 + Math.sin(t * 3 + i) * 4;
      const colors = ['#ff88cc', '#ffaaee', '#ff44aa', '#ffddff', '#ff66bb', '#ffffff'];
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6 + Math.sin(t*3+i)*0.3;
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, cr);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // 外发光圈
    const crRing = ctx.createRadialGradient(x, y, 8, x, y, 22);
    crRing.addColorStop(0, 'rgba(255,136,204,0.25)');
    crRing.addColorStop(1, 'rgba(255,68,170,0)');
    ctx.fillStyle = crRing;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fill();
    // 粉色渐变核心
    const crGrad = ctx.createRadialGradient(x, y, 2, x, y, 14);
    crGrad.addColorStop(0, '#ffffff');
    crGrad.addColorStop(0.4, '#ff88cc');
    crGrad.addColorStop(0.8, '#cc2266');
    crGrad.addColorStop(1, 'rgba(180,0,80,0)');
    ctx.shadowColor = '#ff44aa'; ctx.shadowBlur = 14 + Math.sin(t*4)*5;
    ctx.fillStyle = crGrad;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💎', x, y - 1);

  } else if (cfg.effect === 'blackStoneAtk') {
    // ── 黑石：黑色岩石底座 + 紫色减甲光环 + 旋转石块
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#7744aa66'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 旋转石块（3个，代表攻击3目标）
    for (let i = 0; i < 3; i++) {
      const a = t * 1.4 + i * Math.PI * 2 / 3;
      const rx = x + Math.cos(a) * 20, ry = y + Math.sin(a) * 20;
      ctx.save();
      ctx.translate(rx, ry); ctx.rotate(t * 2 + i);
      ctx.fillStyle = i === 0 ? '#443355' : i === 1 ? '#553366' : '#664477';
      ctx.beginPath();
      ctx.roundRect(-5, -5, 10, 10, 2);
      ctx.fill();
      ctx.strokeStyle = '#9966cc'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    // 紫色底座光晕
    const bsRing = ctx.createRadialGradient(x, y, 8, x, y, 22);
    bsRing.addColorStop(0, 'rgba(100,50,170,0.3)');
    bsRing.addColorStop(1, 'rgba(60,20,100,0)');
    ctx.fillStyle = bsRing;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fill();
    // 中心黑岩核心
    const bsGrad = ctx.createRadialGradient(x, y, 2, x, y, 14);
    bsGrad.addColorStop(0, '#9966cc');
    bsGrad.addColorStop(0.5, '#443355');
    bsGrad.addColorStop(1, 'rgba(30,10,50,0)');
    ctx.shadowColor = '#9933cc'; ctx.shadowBlur = 12 + Math.sin(t*2)*4;
    ctx.fillStyle = bsGrad;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🪨', x, y - 1);

  } else if (cfg.effect === 'shadowDemonAtk') {
    // ── 影魔：紫色魔柱塔体 + 悬浮面具 + 灵魂光环
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#cc44ff44'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#66008811'; ctx.fill();
    }
    {
      const floatY = Math.sin(t * 2.2) * 2.5;
      // 底座石台
      ctx.fillStyle = '#1a0030';
      ctx.beginPath(); ctx.roundRect(x-12, y+10, 24, 8, 3); ctx.fill();
      ctx.fillStyle = '#330055';
      ctx.beginPath(); ctx.roundRect(x-10, y+6, 20, 8, 3); ctx.fill();

      // 旋转灵魂光弧（外圈）
      ctx.save(); ctx.translate(x, y - 4 + floatY); ctx.rotate(t * 1.5);
      for (let i = 0; i < 6; i++) {
        const a1 = i * Math.PI/3, a2 = a1 + Math.PI/4;
        ctx.strokeStyle = `rgba(180,60,255,${0.5 + 0.3*Math.sin(t*3+i)})`; ctx.lineWidth = 1.5;
        ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(0, 0, 18, a1, a2); ctx.stroke();
      }
      ctx.shadowBlur = 0; ctx.restore();

      // 塔柱主体（多边形）
      ctx.save(); ctx.translate(x, y + 2);
      const pillarG = ctx.createLinearGradient(-9, -16, 9, 16);
      pillarG.addColorStop(0, '#cc66ff'); pillarG.addColorStop(0.5, '#6600aa'); pillarG.addColorStop(1, '#1a0033');
      ctx.fillStyle = pillarG;
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(9, -8); ctx.lineTo(9, 10);
      ctx.lineTo(0, 14); ctx.lineTo(-9, 10); ctx.lineTo(-9, -8); ctx.closePath();
      ctx.shadowColor = '#8800ff'; ctx.shadowBlur = 12 + Math.sin(t*3)*4;
      ctx.fill(); ctx.shadowBlur = 0;
      // 柱面纹路（横线）
      ctx.strokeStyle = 'rgba(200,100,255,0.35)'; ctx.lineWidth = 1;
      for (let li = -10; li <= 8; li += 6) {
        const hw = 8 - Math.abs(li) * 0.15;
        ctx.beginPath(); ctx.moveTo(-hw, li); ctx.lineTo(hw, li); ctx.stroke();
      }
      ctx.restore();

      // 悬浮魔纹面具（小尺寸）
      ctx.save(); ctx.translate(x, y - 10 + floatY);
      // 面具底盘（六边形，紧凑）
      ctx.fillStyle = '#220044';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI/3 - Math.PI/6;
        i === 0 ? ctx.moveTo(Math.cos(a)*11, Math.sin(a)*11) : ctx.lineTo(Math.cos(a)*11, Math.sin(a)*11);
      }
      ctx.closePath();
      ctx.shadowColor = '#9900ff'; ctx.shadowBlur = 10 + Math.sin(t*4)*4;
      ctx.fill(); ctx.shadowBlur = 0;
      // 面具边框
      ctx.strokeStyle = '#bb66ff'; ctx.lineWidth = 1.2;
      ctx.stroke();
      // 双眼（狭缝状）
      const eyePulse = Math.sin(t * 5) > 0.85 ? 0.15 : 1;
      ctx.fillStyle = `rgba(255,0,255,${eyePulse})`;
      ctx.beginPath(); ctx.ellipse(-4, 0, 2.5, 1.5, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, 0, 2.5, 1.5, 0.3, 0, Math.PI*2); ctx.fill();
      // 嘴（锯齿小缝）
      ctx.strokeStyle = '#cc44ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(-2, 5.5); ctx.lineTo(0, 4); ctx.lineTo(2, 5.5); ctx.lineTo(4, 4); ctx.stroke();
      // 额头符文
      ctx.fillStyle = '#ff88ff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('魔', 0, -4);
      ctx.restore();

    }

  } else if (cfg.effect === 'yanluoAtk') {
    // ── 阎王：红黑魔柱塔体 + 悬浮王冠面具 + 旋转死灵骨
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#cc000044'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#44000011'; ctx.fill();
      // 恐惧波范围（4格）
      ctx.beginPath(); ctx.arc(x, y, 4 * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#9900cc33'; ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    {
      const ylFloat = Math.sin(t * 1.8) * 2;
      // 底座血池
      ctx.fillStyle = '#1a0000';
      ctx.beginPath(); ctx.roundRect(x-13, y+10, 26, 8, 3); ctx.fill();
      ctx.fillStyle = '#440000';
      ctx.beginPath(); ctx.roundRect(x-11, y+7, 22, 7, 3); ctx.fill();

      // 旋转死灵碎骨（反向慢转）
      ctx.save(); ctx.translate(x, y - 2 + ylFloat); ctx.rotate(-t * 1.2);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI/3;
        const bx = Math.cos(a)*17, by = Math.sin(a)*17;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(a + Math.PI/4);
        ctx.fillStyle = `rgba(${120+Math.round(60*Math.sin(t*2+i))},0,0,0.85)`;
        ctx.beginPath();
        ctx.moveTo(0, -4); ctx.lineTo(2.5, 0); ctx.lineTo(0, 4); ctx.lineTo(-2.5, 0); ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 塔柱主体（梯形，上窄下宽）
      ctx.save(); ctx.translate(x, y + 2);
      const ylPillarG = ctx.createLinearGradient(-10, -18, 10, 14);
      ylPillarG.addColorStop(0, '#cc2200'); ylPillarG.addColorStop(0.5, '#770000'); ylPillarG.addColorStop(1, '#1a0000');
      ctx.fillStyle = ylPillarG;
      ctx.beginPath();
      ctx.moveTo(-6, -18); ctx.lineTo(6, -18); ctx.lineTo(10, 12);
      ctx.lineTo(0, 14); ctx.lineTo(-10, 12); ctx.closePath();
      ctx.shadowColor = '#aa0000'; ctx.shadowBlur = 14 + Math.sin(t*2.5)*5;
      ctx.fill(); ctx.shadowBlur = 0;
      // 柱面装甲纹（横格）
      ctx.strokeStyle = 'rgba(255,60,0,0.3)'; ctx.lineWidth = 1;
      for (let li = -12; li <= 8; li += 5) {
        const hw = 5 + (li + 18) * 0.22;
        ctx.beginPath(); ctx.moveTo(-hw, li); ctx.lineTo(hw, li); ctx.stroke();
      }
      ctx.restore();

      // 悬浮阎王令牌（小菱形）
      ctx.save(); ctx.translate(x, y - 12 + ylFloat);
      ctx.rotate(Math.PI/4); // 菱形旋转45°
      const ylTokenG = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
      ylTokenG.addColorStop(0, '#ff5533'); ylTokenG.addColorStop(0.5, '#990000'); ylTokenG.addColorStop(1, '#1a0000');
      ctx.fillStyle = ylTokenG;
      ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 12 + Math.sin(t*3)*5;
      ctx.beginPath(); ctx.rect(-9, -9, 18, 18); ctx.fill(); ctx.shadowBlur = 0;
      // 令牌边框
      ctx.strokeStyle = '#cc3300'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.rotate(-Math.PI/4); // 恢复，绘制内容
      // 双眼（红色竖缝）
      const ylEyeShift = Math.sin(t * 2.2) * 1.8;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.ellipse(-3.5 + ylEyeShift, 0, 1.8, 3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3.5 + ylEyeShift, 0, 1.8, 3, 0, 0, Math.PI*2); ctx.fill();
      // 令牌符文
      ctx.fillStyle = '#ff8866'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('王', 0, -5);
      ctx.restore();

      // 恐惧冷却弧
      const ylCD = tower.specialCooldown || 0;
      const ylProg = 1 - Math.min(ylCD / 12, 1);
      ctx.beginPath(); ctx.arc(x, y, 20, -Math.PI/2, -Math.PI/2 + ylProg * Math.PI * 2);
      ctx.strokeStyle = ylCD < 1 ? '#ff00aa' : '#660011'; ctx.lineWidth = 2.5; ctx.stroke();

    }

  } else if (cfg.effect === 'bankAtk') {
    // ══════════════════════════════════════════════════
    // ── 炼金术士：矮胖绿色巨魔 + 背上骑小地精 + 脚下绿色光环
    // ══════════════════════════════════════════════════
    ctx.save();
    ctx.translate(x, y);

    if (isSel) {
      ctx.beginPath(); ctx.arc(0, 0, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#44ff8844'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // ── 0. 脚下绿色地面光环（炼金能量）
    const bkRingR = 22 + Math.sin(t * 2.2) * 1.5;
    const bkRingG = ctx.createRadialGradient(0, 8, bkRingR - 5, 0, 8, bkRingR + 5);
    bkRingG.addColorStop(0, 'rgba(0,220,80,0)');
    bkRingG.addColorStop(0.4, 'rgba(0,220,80,0.5)');
    bkRingG.addColorStop(1, 'rgba(0,220,80,0)');
    ctx.fillStyle = bkRingG;
    ctx.beginPath(); ctx.arc(0, 8, bkRingR + 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 8, bkRingR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(0,220,80,${0.65 + 0.28 * Math.sin(t * 3.2)})`;
    ctx.lineWidth = 2.8; ctx.stroke();

    // 冷却进度弧（叠加在光环上，亮绿=可用）
    const bkCD = tower.specialCooldown || 0;
    const bkProg = 1 - Math.min(bkCD / 6, 1);
    ctx.beginPath();
    ctx.arc(0, 8, bkRingR + 3, -Math.PI / 2, -Math.PI / 2 + bkProg * Math.PI * 2);
    ctx.strokeStyle = bkCD < 0.5 ? '#88ffaa' : 'rgba(180,255,180,0.35)';
    ctx.lineWidth = 2; ctx.stroke();

    // 微小呼吸摆动
    ctx.rotate(Math.sin(t * 1.2) * 0.03);

    // ── 1. 腿部（粗短，深绿甲裤）
    const bkLegG = ctx.createLinearGradient(-12, 6, 12, 20);
    bkLegG.addColorStop(0, '#3a6a30'); bkLegG.addColorStop(1, '#224420');
    ctx.fillStyle = bkLegG;
    ctx.beginPath(); ctx.roundRect(-11, 5, 9, 14, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, 5, 9, 14, 3); ctx.fill();
    // 腿部高光
    ctx.fillStyle = 'rgba(100,180,80,0.22)';
    ctx.beginPath(); ctx.roundRect(-10, 6, 4, 5, 1); ctx.fill();
    ctx.beginPath(); ctx.roundRect(3, 6, 4, 5, 1); ctx.fill();
    // 大脚（圆头靴）
    ctx.fillStyle = '#1a3310';
    ctx.beginPath(); ctx.ellipse(-6, 19, 8, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, 19, 8, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2a5520'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-6, 19, 8, 5, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, 19, 8, 5, 0, 0, Math.PI*2); ctx.stroke();

    // ── 2. 躯干（大肚子，绿色圆滚滚）
    const bkBodyG = ctx.createRadialGradient(-2, -4, 2, 0, -2, 18);
    bkBodyG.addColorStop(0, '#5a9a40');
    bkBodyG.addColorStop(0.5, '#3a7030');
    bkBodyG.addColorStop(1, '#1e4018');
    ctx.fillStyle = bkBodyG;
    ctx.beginPath(); ctx.ellipse(0, -2, 16, 18, 0, 0, Math.PI*2); ctx.fill();
    // 腹部高光（右上角反光）
    ctx.fillStyle = 'rgba(140,220,100,0.22)';
    ctx.beginPath(); ctx.ellipse(-4, -8, 7, 5, -0.3, 0, Math.PI*2); ctx.fill();
    // 腹部横纹（甲带）
    ctx.strokeStyle = '#2a5520'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(0, 7, 14, 4); ctx.stroke();

    // ── 3. 肩膀（宽厚，凸出）
    ctx.fillStyle = '#4a8035';
    ctx.beginPath(); ctx.ellipse(-17, -8, 7, 6, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(17, -8, 7, 6, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2a5520'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-17, -8, 7, 6, -0.2, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(17, -8, 7, 6, 0.2, 0, Math.PI*2); ctx.stroke();

    // ── 4. 左臂（粗短，自然下垂）
    ctx.save();
    ctx.translate(-16, -4);
    ctx.rotate(0.3 + Math.sin(t * 1.4) * 0.08);
    const bkLArmG = ctx.createLinearGradient(-4, 0, 4, 14);
    bkLArmG.addColorStop(0, '#4a8035'); bkLArmG.addColorStop(1, '#2a5020');
    ctx.fillStyle = bkLArmG;
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 14, 3); ctx.fill();
    // 拳头
    ctx.fillStyle = '#3a6a28';
    ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // ── 5. 右臂（粗短，略微抬起）
    ctx.save();
    ctx.translate(16, -4);
    ctx.rotate(-0.3 - Math.sin(t * 1.4 + 0.5) * 0.08);
    const bkRArmG = ctx.createLinearGradient(-4, 0, 4, 14);
    bkRArmG.addColorStop(0, '#4a8035'); bkRArmG.addColorStop(1, '#2a5020');
    ctx.fillStyle = bkRArmG;
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 14, 3); ctx.fill();
    ctx.fillStyle = '#3a6a28';
    ctx.beginPath(); ctx.arc(0, 15, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    // ── 6. 脖子
    ctx.fillStyle = '#3a7030';
    ctx.beginPath(); ctx.roundRect(-5, -20, 10, 8, 2); ctx.fill();

    // ── 7. 大头（圆，深绿，凶相）
    const bkHeadG = ctx.createRadialGradient(-2, -28, 2, 0, -26, 13);
    bkHeadG.addColorStop(0, '#5aaa40');
    bkHeadG.addColorStop(0.6, '#3a8028');
    bkHeadG.addColorStop(1, '#1e5015');
    ctx.fillStyle = bkHeadG;
    ctx.beginPath(); ctx.ellipse(0, -27, 12, 11, 0, 0, Math.PI*2); ctx.fill();
    // 头部高光
    ctx.fillStyle = 'rgba(140,220,100,0.2)';
    ctx.beginPath(); ctx.ellipse(-4, -31, 5, 4, -0.4, 0, Math.PI*2); ctx.fill();
    // 凶相眼睛（小，红色，深陷）
    ctx.fillStyle = '#cc2200';
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.ellipse(-5, -28, 2.5, 2, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -28, 2.5, 2, -0.1, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a0000';
    ctx.beginPath(); ctx.arc(-5, -28, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -28, 1.2, 0, Math.PI*2); ctx.fill();
    // 眼白高光
    ctx.fillStyle = 'rgba(255,200,200,0.7)';
    ctx.beginPath(); ctx.arc(-4.2, -28.7, 0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.8, -28.7, 0.7, 0, Math.PI*2); ctx.fill();
    // 厚嘴唇（突出）
    ctx.fillStyle = '#2a5018';
    ctx.beginPath(); ctx.roundRect(-6, -23, 12, 5, [0, 0, 4, 4]); ctx.fill();
    // 獠牙（两颗白牙）
    ctx.fillStyle = '#f0f0e0';
    ctx.beginPath(); ctx.moveTo(-4, -22); ctx.lineTo(-3, -18); ctx.lineTo(-2, -22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(2, -22); ctx.lineTo(3, -18); ctx.lineTo(4, -22); ctx.closePath(); ctx.fill();
    // 鼻子（宽扁）
    ctx.fillStyle = '#1e4815';
    ctx.beginPath(); ctx.ellipse(0, -25, 4, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0e2a08';
    ctx.beginPath(); ctx.ellipse(-1.8, -25, 1.2, 1, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.8, -25, 1.2, 1, 0, 0, Math.PI*2); ctx.fill();

    // ── 8. 背上的小地精（骑手）
    ctx.save();
    ctx.translate(0, -36);
    ctx.rotate(Math.sin(t * 1.8) * 0.06); // 随大怪呼吸摆动

    // 小地精身体（棕褐色，小巧）
    ctx.fillStyle = '#886622';
    ctx.beginPath(); ctx.roundRect(-5, -2, 10, 10, 3); ctx.fill();
    // 小地精腿（两条小腿夹在巨魔肩上）
    ctx.fillStyle = '#664410';
    ctx.beginPath(); ctx.roundRect(-7, 5, 4, 7, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(3, 5, 4, 7, 2); ctx.fill();
    // 小地精头（白色大头）
    ctx.fillStyle = '#f0e8d0';
    ctx.beginPath(); ctx.ellipse(0, -6, 6, 7, 0, 0, Math.PI*2); ctx.fill();
    // 白发（凌乱）
    ctx.strokeStyle = '#e8e8e0'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-6, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-3, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -17); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(3, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(6, -15); ctx.stroke();
    ctx.lineCap = 'butt';
    // 小地精眼睛（蓝色大眼）
    ctx.fillStyle = '#2266cc';
    ctx.beginPath(); ctx.ellipse(-2.5, -6, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.5, -6, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000830';
    ctx.beginPath(); ctx.arc(-2.5, -6, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -6, 1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(-1.8, -6.7, 0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.2, -6.7, 0.6, 0, Math.PI*2); ctx.fill();
    // 小地精鼻子（鹰钩鼻）
    ctx.fillStyle = '#d0a860';
    ctx.beginPath(); ctx.moveTo(-1, -4); ctx.quadraticCurveTo(-3, -2, -2, -1); ctx.lineTo(0, -2); ctx.closePath(); ctx.fill();
    // 小地精手持木棍
    ctx.save();
    ctx.translate(6, 0);
    ctx.rotate(-0.3 + Math.sin(t * 2.5) * 0.15);
    ctx.strokeStyle = '#886633'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
    // 棍子顶端的金色圆球
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(0, -17, 3, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore(); // 小地精结束

    ctx.restore(); // 炼金术士整体结束

  } else if (cfg.effect === 'furnaceAura') {
    // ── 天炉：石砖底台 + 立体熔炉 + 烟囱 + 旋转熔岩光环
    if (isSel) {
      ctx.beginPath(); ctx.arc(x, y, 2 * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ff880044'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff440011'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 3.5 * CS, 0, Math.PI*2);
      ctx.strokeStyle = '#ff440033'; ctx.lineWidth = 1.2;
      ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 底部熔岩流光
    const lavaGlowG = ctx.createRadialGradient(x, y+14, 2, x, y+12, 22);
    lavaGlowG.addColorStop(0, 'rgba(255,80,0,0.7)');
    lavaGlowG.addColorStop(0.5, 'rgba(180,30,0,0.35)');
    lavaGlowG.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.fillStyle = lavaGlowG;
    ctx.beginPath(); ctx.ellipse(x, y+12, 22, 10, 0, 0, Math.PI*2); ctx.fill();
    // 石砖底台
    ctx.fillStyle = '#3a1400';
    ctx.beginPath(); ctx.roundRect(x-14, y+8, 28, 10, 2); ctx.fill();
    ctx.fillStyle = '#5a2800';
    ctx.beginPath(); ctx.roundRect(x-12, y+6, 24, 8, 2); ctx.fill();
    // 熔炉主体（梯形侧面立体感）
    ctx.fillStyle = '#441100';
    ctx.beginPath(); ctx.moveTo(x-13, y+6); ctx.lineTo(x-10, y-12); ctx.lineTo(x+10, y-12); ctx.lineTo(x+13, y+6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#662200';
    ctx.beginPath(); ctx.moveTo(x-11, y+5); ctx.lineTo(x-8, y-10); ctx.lineTo(x+8, y-10); ctx.lineTo(x+11, y+5); ctx.closePath(); ctx.fill();
    // 砖缝横纹
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
    for (let li = -8; li <= 4; li += 4) {
      ctx.beginPath(); ctx.moveTo(x-10+Math.abs(li)*0.12, y+li); ctx.lineTo(x+10-Math.abs(li)*0.12, y+li); ctx.stroke();
    }
    // 熔炉口（圆形发光洞口）
    ctx.fillStyle = '#220800';
    ctx.beginPath(); ctx.ellipse(x, y-1, 9, 7, 0, 0, Math.PI*2); ctx.fill();
    const fgG = ctx.createRadialGradient(x, y-1, 1, x, y-1, 9);
    fgG.addColorStop(0, '#ffffff');
    fgG.addColorStop(0.2, '#ffcc44');
    fgG.addColorStop(0.6, '#ff4400');
    fgG.addColorStop(1, 'rgba(80,0,0,0)');
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 18 + Math.sin(t*4)*7;
    ctx.fillStyle = fgG;
    ctx.beginPath(); ctx.ellipse(x, y-1, 8, 6, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 左右双烟囱
    const chimneyH = 12 + Math.sin(t*2)*1;
    [[x-5, y-10], [x+5, y-10]].forEach(([cx2, cy2]) => {
      ctx.fillStyle = '#331100';
      ctx.beginPath(); ctx.roundRect(cx2-2.5, cy2-chimneyH, 5, chimneyH, 1); ctx.fill();
      // 烟囱顶端发光
      ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 6 + Math.sin(t*5)*3;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath(); ctx.arc(cx2, cy2-chimneyH, 3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    });
    // 旋转热浪粒子（4片，慢速）
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.8);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI/2;
      const hx = Math.cos(a)*15, hy = Math.sin(a)*15;
      const alpha = 0.5 + 0.3 * Math.sin(t*3 + i*1.5);
      ctx.fillStyle = i%2===0 ? `rgba(255,120,0,${alpha})` : `rgba(255,220,60,${alpha})`;
      ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawTower(tower, r, c, key) {
  const CS = CELL;
  const x = c * CS + CS/2;
  const y = r * CS + CS/2;
  const cfg = tower.cfg;
  // 持续光环机制：无timer，直接判断倍率是否大于1
  const isBuff = (tower.buffMult || 1) > 1;

  // Range circle when selected（含 rangeBonus 光环加成）
  if (state.selectedTowerKey === key) {
    const displayRange = (cfg.range + (tower.rangeBonus || 0)) * CS;
    ctx.beginPath();
    ctx.arc(x, y, displayRange, 0, Math.PI*2);
    ctx.strokeStyle = cfg.color + '99';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cfg.color + '18';
    ctx.fill();
    // 若有射程加成，额外画一个基础射程的虚线圆（提示加成量）
    if (tower.rangeBonus > 0) {
      ctx.beginPath();
      ctx.arc(x, y, cfg.range * CS, 0, Math.PI*2);
      ctx.strokeStyle = cfg.color + '44';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── 特殊塔：独立外观绘制
  if (cfg.special) {
    drawSpecialTower(ctx, tower, x, y, cfg, key, CS);
    return;
  }

  // ── 基础精灵塔绘制（发光精灵风格）
  drawSpriteGlow(ctx, x, y, cfg, tower, isBuff);
}

/**
 * 绘制发光精灵（参考图：圆形核心+光晕+射线+飞舞光粒）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {object} cfg 塔配置（含color）
 * @param {object} tower 塔对象（含level，animTick等）
 * @param {boolean} isBuff 是否受光环增益
 */
function drawSpriteGlow(ctx, x, y, cfg, tower, isBuff) {
  const t   = Date.now() / 1000;
  const lvl = tower.level || 1;       // 1~6
  const col = cfg.color;

  // ── RGB分量
  const cr = parseInt(col.replace('#','').substring(0,2),16);
  const cg = parseInt(col.replace('#','').substring(2,4),16);
  const cb = parseInt(col.replace('#','').substring(4,6),16);

  // ── 尺寸计算（严格约束在单元格内）
  // 单元格64px，内切圆半径32px，留4px安全边距 → 最大可用半径28px
  // 核心半径固定查表：Lv1=12, Lv2=14, Lv3=16, Lv4=18, Lv5=20, Lv6=24
  const BASE_R_TABLE = [12, 14, 16, 18, 20, 24];
  const MAX_GLOW = 28;                              // 光晕不超出单元格的最大半径
  const baseR = BASE_R_TABLE[Math.min(lvl - 1, 5)];
  const glowR = Math.min(baseR * 1.6, MAX_GLOW);   // 光晕=核心1.6倍，但不超过28px

  // ── 等级归一化（0=Lv1最暗, 1=Lv6最亮）
  const lvlN = (lvl - 1) / 5;                  // 0.0 ~ 1.0

  // ── 各层亮度（线性从暗到亮）
  // 光晕降低强度，与核心形成明暗+色彩差异：光晕偏深偏暗，核心偏白偏亮
  const outerAlpha  = 0.04 + lvlN * 0.05;      // 0.04(Lv1) ~ 0.09(Lv6)  外层大光晕（降低50%）
  const innerAlpha0 = 0.18 + lvlN * 0.14;      // 0.18(Lv1) ~ 0.32(Lv6)  内层光晕中心（降低约50%）
  const innerAlpha1 = 0.10 + lvlN * 0.10;      // 0.10(Lv1) ~ 0.20(Lv6)  内层光晕中段（降低约40%）
  const coreAlpha0  = 0.70 + lvlN * 0.25;      // 0.70(Lv1) ~ 0.95(Lv6)  核心白光顶部（提高，更突出）
  const coreAlpha1  = 0.55 + lvlN * 0.30;      // 0.55(Lv1) ~ 0.85(Lv6)  核心主色边缘（提高，更实）
  const rayAlpha    = 0.08 + lvlN * 0.10;      // 0.08(Lv1) ~ 0.18(Lv6)  射线（降低）
  const shadowStr   = 3  + lvlN * 5;           // 3(Lv1) ~ 8(Lv6)        核心发光强度

  // ── 深色调：光晕用主色压深（混入黑色 40%），让光晕与核心产生色彩层次
  const dr = Math.round(cr * 0.55);
  const dg = Math.round(cg * 0.55);
  const db = Math.round(cb * 0.55);

  // ── 1. 底部彩色阴影（椭圆，低透明度）
  ctx.save();
  ctx.globalAlpha = 0.12 + lvlN * 0.10;
  ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
  ctx.beginPath();
  ctx.ellipse(x, y + baseR + 3, baseR * 1.1, baseR * 0.35, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // ── 2. 外层大光晕（深色调，与核心区分；严格限制在MAX_GLOW内）
  const outerGrad = ctx.createRadialGradient(x, y, baseR * 0.4, x, y, glowR);
  outerGrad.addColorStop(0,   `rgba(${dr},${dg},${db},${outerAlpha})`);
  outerGrad.addColorStop(0.6, `rgba(${dr},${dg},${db},${outerAlpha * 0.4})`);
  outerGrad.addColorStop(1,   `rgba(${dr},${dg},${db},0)`);
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI*2);
  ctx.fill();

  // ── 3. 旋转射线（Lv1=4条，Lv6=8条，长度严格≤glowR）
  const rayCount = 4 + Math.floor(lvlN * 4);   // 4(Lv1)~8(Lv6)
  const rayLen   = glowR * (0.85 + 0.10 * Math.sin(t * 1.8));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.5);
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const w     = (i % 2 === 0) ? 1.5 : 0.8;
    const a     = rayAlpha * (i % 2 === 0 ? 1.0 : 0.5);
    const grad  = ctx.createLinearGradient(0, 0, Math.cos(angle)*rayLen, Math.sin(angle)*rayLen);
    grad.addColorStop(0,   `rgba(255,255,255,${a * 0.8})`);
    grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${a})`);
    grad.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = w;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * baseR * 0.8, Math.sin(angle) * baseR * 0.8);
    ctx.lineTo(Math.cos(angle) * rayLen,       Math.sin(angle) * rayLen);
    ctx.stroke();
  }
  ctx.restore();

  // ── 4. 飘浮光粒（Lv1=2粒，Lv6=6粒，轨道≤glowR）
  const particleCount = 2 + Math.round(lvlN * 4);  // 2(Lv1)~6(Lv6)
  for (let i = 0; i < particleCount; i++) {
    const phi   = t * 1.3 + (i / particleCount) * Math.PI * 2;
    const orbit = baseR * (1.2 + 0.3 * Math.sin(t * 2.2 + i));
    const px    = x + Math.cos(phi) * orbit;
    const py    = y + Math.sin(phi) * orbit * 0.6;
    const pr    = 0.8 + lvlN * 1.0 + Math.sin(t * 3 + i) * 0.5;
    const pa    = (0.3 + lvlN * 0.25) * (0.7 + 0.3 * Math.sin(t * 2 + i));
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.3, pr), 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${pa})`;
    ctx.shadowColor = col;
    ctx.shadowBlur  = 3 + lvlN * 3;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── 5. 内层光晕（深色调过渡，核心与光晕形成色差）
  // 中心用极淡白色（取代主色），向外过渡为深色主色调，再淡出
  const innerGrad = ctx.createRadialGradient(x, y, 0, x, y, glowR * 0.75);
  innerGrad.addColorStop(0,    `rgba(255,255,255,${innerAlpha0 * 0.5})`);  // 中心极淡白（让核心更突出）
  innerGrad.addColorStop(0.3,  `rgba(${dr},${dg},${db},${innerAlpha1})`);  // 过渡到深色主色
  innerGrad.addColorStop(0.65, `rgba(${dr},${dg},${db},${innerAlpha1 * 0.3})`);
  innerGrad.addColorStop(1,    `rgba(${dr},${dg},${db},0)`);
  ctx.shadowColor = `rgb(${dr},${dg},${db})`;                              // shadowColor 也用深色
  ctx.shadowBlur  = shadowStr * 0.6 + Math.sin(t * 2.2) * 1.5;           // 光晕shadowBlur减弱
  ctx.fillStyle   = innerGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowR * 0.75, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── 6. 核心实体圆（亮度随等级变化，无纯白过曝）
  const coreGrad = ctx.createRadialGradient(x - baseR*0.2, y - baseR*0.2, 0, x, y, baseR);
  coreGrad.addColorStop(0,   `rgba(255,255,255,${coreAlpha0})`);
  coreGrad.addColorStop(0.55,`rgba(${cr},${cg},${cb},${coreAlpha1 * 1.4})`);
  coreGrad.addColorStop(1,   `rgba(${cr},${cg},${cb},${coreAlpha1})`);
  ctx.shadowColor = col;
  ctx.shadowBlur  = shadowStr * 0.8;
  ctx.fillStyle   = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, baseR, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── 7. 等级标记（Lv2以上，紧贴核心下方）
  if (lvl >= 2) {
    ctx.font          = `bold ${7 + Math.min(lvl - 1, 3)}px sans-serif`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillStyle     = `rgba(255,255,255,${0.6 + lvlN * 0.35})`;
    ctx.shadowColor   = col;
    ctx.shadowBlur    = 3;
    ctx.fillText(`L${lvl}`, x, y + baseR + 7);
    ctx.shadowBlur = 0;
  }

  // ── 8. Buff金色光环
  if (isBuff) {
    ctx.strokeStyle = `rgba(255,215,0,${0.5 + lvlN * 0.2})`;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(glowR + 3, MAX_GLOW), 0, Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function shadeColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num>>16) + amount));
  const g = Math.min(255, Math.max(0, ((num>>8)&0xff) + amount));
  const b = Math.min(255, Math.max(0, (num&0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

function drawTreasureMonster(m) {
  const x = m.x, y = m.y;
  const t = m.animTick;

  // ── 宝箱尺寸
  const S = 22;  // 宝箱半宽/半高
  // ── 腿步行参数
  const freq = 5;
  const legSwing  = Math.sin(t * freq) * 6;
  const legSwing2 = Math.sin(t * freq + Math.PI) * 6;
  const bounce    = Math.abs(Math.sin(t * freq * 0.5)) * 3;
  const bodyTilt  = Math.sin(t * freq * 0.5) * 2;

  // ── 地面阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + S + 5, S * 0.7, 4, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y - bounce);
  ctx.rotate(bodyTilt * Math.PI / 180);

  // ── 4条长腿（根据朝向调整伸出方向）
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  const dir = m.dir;
  // 腿的基座：箱体底部左右两侧
  const legBaseY = S * 0.5;
  const legBaseXL = -S * 0.55;
  const legBaseXR =  S * 0.55;
  // 前腿/后腿摆幅随方向变化：正面/背面腿向两侧伸，侧面腿向前后伸
  const legLen = S * 1.25;
  if (dir === 'left' || dir === 'right') {
    // 侧视：2条腿可见（前后），交替摆动
    const fwd = dir === 'right' ? 1 : -1;
    // 前腿
    ctx.beginPath(); ctx.moveTo(legBaseXL, legBaseY);
    ctx.lineTo(legBaseXL + fwd*(legLen*0.5 + legSwing*0.4), legBaseY + legLen*0.7); ctx.stroke();
    // 后腿
    ctx.beginPath(); ctx.moveTo(legBaseXR, legBaseY);
    ctx.lineTo(legBaseXR + fwd*(legLen*0.3 - legSwing2*0.4), legBaseY + legLen*0.7); ctx.stroke();
    // 另外2条隐约腿（略细，透明度低）
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(legBaseXL*0.5, legBaseY);
    ctx.lineTo(legBaseXL*0.5 + fwd*(legLen*0.4 + legSwing*0.3), legBaseY + legLen*0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(legBaseXR*0.5, legBaseY);
    ctx.lineTo(legBaseXR*0.5 + fwd*(legLen*0.2 - legSwing2*0.3), legBaseY + legLen*0.6); ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    // 正面/背面：4条腿对称向外摆动
    const swing = [legSwing, -legSwing2, legSwing2, -legSwing];
    const baseXs = [-S*0.65, -S*0.25, S*0.25, S*0.65];
    baseXs.forEach((bx, i) => {
      const spreadX = bx * 1.4 + swing[i] * 0.5;
      ctx.beginPath(); ctx.moveTo(bx, legBaseY);
      ctx.lineTo(spreadX, legBaseY + legLen * 0.85); ctx.stroke();
    });
  }

  // ── 宝箱主体（箱身）
  const boxGrad = ctx.createLinearGradient(-S, -S*0.1, S, S*0.5);
  boxGrad.addColorStop(0,   '#d4920a');
  boxGrad.addColorStop(0.4, '#f5c518');
  boxGrad.addColorStop(0.8, '#c47b05');
  boxGrad.addColorStop(1,   '#8B5E0A');
  ctx.fillStyle = boxGrad;
  // 箱身圆角矩形
  const bx = -S, by = -S*0.1, bw = S*2, bh = S*1.1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 5);
  ctx.fill();
  ctx.strokeStyle = '#7a4f00'; ctx.lineWidth = 2;
  ctx.stroke();

  // ── 箱盖（上半部分，朝向不同时盖子微开）
  const lidOpenAngle = (dir === 'up') ? -0.18 : (dir === 'down') ? 0.06 : 0;
  ctx.save();
  ctx.translate(0, -S*0.1); // 盖子铰链在箱身顶部
  ctx.rotate(lidOpenAngle);
  const lidGrad = ctx.createLinearGradient(-S, -S*0.85, S, -S*0.1);
  lidGrad.addColorStop(0,   '#f5c518');
  lidGrad.addColorStop(0.5, '#e8a800');
  lidGrad.addColorStop(1,   '#c47b05');
  ctx.fillStyle = lidGrad;
  ctx.beginPath();
  ctx.roundRect(-S, -S*0.85, S*2, S*0.8, [5, 5, 2, 2]);
  ctx.fill();
  ctx.strokeStyle = '#7a4f00'; ctx.lineWidth = 2; ctx.stroke();
  // 盖子装饰弧
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -S*0.5, S*0.45, Math.PI*1.1, Math.PI*1.9); ctx.stroke();
  ctx.restore();

  // ── 箱扣（正中金色椭圆锁扣）
  ctx.fillStyle = '#ffd700';
  ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, S*0.2, 5, 6.5, 0, 0, Math.PI*2);
  ctx.fill(); ctx.stroke();
  // 锁孔
  ctx.fillStyle = '#5a3b00';
  ctx.beginPath(); ctx.arc(0, S*0.18, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.rect(-1.2, S*0.18, 2.4, 3.5); ctx.fill();

  // ── 箱体铆钉装饰
  ctx.fillStyle = '#ffd700';
  [[-S+5, S*0.12], [S-5, S*0.12], [-S+5, -S*0.02+2], [S-5, -S*0.02+2]].forEach(([nx, ny]) => {
    ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI*2); ctx.fill();
  });

  // ── 侧面木纹线（随朝向选择绘制位置）
  ctx.strokeStyle = 'rgba(100,60,0,0.35)'; ctx.lineWidth = 1;
  [-S*0.45, S*0.45].forEach(nx => {
    ctx.beginPath(); ctx.moveTo(nx, -S*0.08); ctx.lineTo(nx, S*0.95); ctx.stroke();
  });

  // ── 皇冠（宝箱关的特有标识，金色小王冠）
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(-9, -S-2); ctx.lineTo(-9, -S-8);
  ctx.lineTo(-4.5, -S-4); ctx.lineTo(0, -S-11);
  ctx.lineTo(4.5, -S-4); ctx.lineTo(9, -S-8);
  ctx.lineTo(9, -S-2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff3366'; ctx.shadowColor='#ff0044'; ctx.shadowBlur=4;
  ctx.beginPath(); ctx.arc(0, -S-7, 2.2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // ── 金币闪烁粒子（随血量变低增多，表示快散架了）
  const hpRatio = m.hp / m.maxHp;
  const sparkCount = Math.floor((1 - hpRatio) * 5);
  for (let i = 0; i < sparkCount; i++) {
    const phase = i * 2.1 + t * 3.2;
    const sx = Math.sin(phase) * S * 1.2;
    const sy = Math.cos(phase * 1.3) * S * 0.8;
    const sa = Math.abs(Math.sin(phase * 2)) * 0.7 + 0.3;
    ctx.globalAlpha = sa;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;

  ctx.restore();

  // ── 慢速光环（蓝色光晕，与普通怪一致）
  if (calcEffectiveSlow(m) < 0.99) {
    const slowAlpha = 0.3 + 0.2 * Math.sin(t * 4);
    ctx.save();
    ctx.globalAlpha = slowAlpha;
    ctx.fillStyle = '#4488ff';
    ctx.beginPath(); ctx.ellipse(x, y, S*1.2, S*0.55, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // ── 灼烧特效（火苗，与普通怪一致）
  if (m.burnTimer > 0 && !m.burnImmune) {
    const burnIntensity = Math.min(1, m.burnTimer / 2);
    ctx.save();
    ctx.translate(x, y - bounce);
    ctx.shadowColor = '#ff3300'; ctx.shadowBlur = 18 * burnIntensity;
    ctx.globalAlpha = 0.4 * burnIntensity;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.ellipse(0, 0, S*1.1, S*1.0, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    const flameCount = 5 + Math.floor(burnIntensity * 3);
    for (let i = 0; i < flameCount; i++) {
      const phase = i * 1.618 + t * (2.8 + i * 0.35);
      const fx = Math.sin(phase * 1.7) * S * 0.85;
      const fyBase = S * 0.5 + Math.cos(phase * 2.3) * S * 0.3;
      const flameH = S * (0.8 + 0.4 * Math.abs(Math.sin(t * 4.2 + i * 1.3))) * burnIntensity;
      const flameW = S * (0.18 + 0.07 * Math.sin(t * 3 + i));
      const flameGrad = ctx.createLinearGradient(fx, fyBase, fx, fyBase - flameH);
      flameGrad.addColorStop(0,   `rgba(220,20,0,${0.95*burnIntensity})`);
      flameGrad.addColorStop(0.4, `rgba(255,120,0,${0.8*burnIntensity})`);
      flameGrad.addColorStop(0.8, `rgba(255,230,0,${0.5*burnIntensity})`);
      flameGrad.addColorStop(1,   'rgba(255,255,200,0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.ellipse(fx, fyBase - flameH*0.5, flameW, flameH*0.5, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // ── 毒素特效（淡紫色气泡上浮）
  if (m.poisonTimer > 0) {
    const poisonIntensity = Math.min(1, m.poisonTimer / 3);
    ctx.save();
    ctx.translate(x, y - bounce);
    // 全身淡紫色光晕
    ctx.shadowColor = '#cc44ff'; ctx.shadowBlur = 14 * poisonIntensity;
    ctx.globalAlpha = 0.28 * poisonIntensity;
    ctx.fillStyle = '#aa44cc';
    ctx.beginPath(); ctx.ellipse(0, 0, S*1.05, S*1.05, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    // 上浮紫色气泡（6个，均匀散布，向上漂移）
    const bubbleCount = 6;
    for (let i = 0; i < bubbleCount; i++) {
      const phase = i / bubbleCount;
      // 每个气泡独立上浮偏移（用时间+偏移相位循环）
      const cycle = ((t * 0.8 + phase) % 1);
      const bx = Math.sin(phase * Math.PI * 2 + t * 0.5) * S * 0.75;
      const by = S * 0.6 - cycle * S * 2.2;          // 从底部往上飘
      const br = S * (0.12 + 0.06 * Math.sin(t * 3 + i)) * poisonIntensity;
      const alpha = cycle < 0.15 ? cycle / 0.15       // 淡入
                  : cycle > 0.75 ? (1 - cycle) / 0.25 // 淡出
                  : 1;
      ctx.globalAlpha = alpha * 0.85 * poisonIntensity;
      // 气泡：紫到透明的径向渐变小圆
      const bubbleGrad = ctx.createRadialGradient(bx - br*0.3, by - br*0.3, 0, bx, by, br);
      bubbleGrad.addColorStop(0, 'rgba(220,180,255,0.95)');
      bubbleGrad.addColorStop(0.5, 'rgba(160,80,220,0.7)');
      bubbleGrad.addColorStop(1, 'rgba(100,20,180,0)');
      ctx.fillStyle = bubbleGrad;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
      // 气泡高光小点
      ctx.globalAlpha = alpha * 0.6 * poisonIntensity;
      ctx.fillStyle = 'rgba(240,220,255,0.9)';
      ctx.beginPath(); ctx.arc(bx - br*0.28, by - br*0.28, br*0.28, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── 血条
  const _barW = 52, _barH = 7;
  const _barX = x - _barW/2, _barY = y - S - bounce - 14;
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.roundRect(_barX, _barY, _barW, _barH, 2); ctx.fill();
  const _hpRatio = Math.max(0, m.hp / m.maxHp);
  const _hpColor = _hpRatio > 0.6 ? '#44ff44' : _hpRatio > 0.3 ? '#ffcc00' : '#ff4444';
  if (_hpRatio > 0) {
    ctx.fillStyle = _hpColor;
    ctx.beginPath(); ctx.roundRect(_barX, _barY, _barW * _hpRatio, _barH, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.roundRect(_barX, _barY, _barW * _hpRatio, _barH/2, 1); ctx.fill();
  }
  ctx.strokeStyle = '#444'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.roundRect(_barX, _barY, _barW, _barH, 2); ctx.stroke();
}

function drawMonster(m) {
  // 宝箱关怪物走独立绘制分支
  if (m.isTreasure) { drawTreasureMonster(m); return; }

  const x = m.x, y = m.y;
  const t = m.animTick;
  const isBoss      = m.isBoss;
  const waveType    = m.waveType || 'normal';
  const isMagicImm  = m.isMagicImm;
  const isSwarm     = waveType === 'swarm';
  const isHeavy     = waveType === 'heavyArmor';

  // ── 外形尺寸（蚁群更小，重甲更大，Boss最大）
  const size = isBoss ? 22 : isHeavy ? 18 : isSwarm ? 10 : 16;

  // ── 颜色主题
  let bodyColor, darkColor, accentColor;
  if (isBoss) {
    bodyColor = '#cc2244'; darkColor = '#881122'; accentColor = '#ff6688';
  } else if (isHeavy) {
    bodyColor = '#8855aa'; darkColor = '#552277'; accentColor = '#cc99ff';
  } else if (isSwarm) {
    bodyColor = '#bb6600'; darkColor = '#884400'; accentColor = '#ffaa44';
  } else if (isMagicImm) {
    bodyColor = '#4466cc'; darkColor = '#223388'; accentColor = '#88bbff';
  } else {
    bodyColor = '#44bb44'; darkColor = '#228822'; accentColor = '#88ff88';
  }
  // ── 恐惧状态：全身覆盖紫色
  if (m.fearTimer > 0) {
    bodyColor   = '#8833bb';
    darkColor   = '#551188';
    accentColor = '#dd88ff';
  }
  const eyeColor = m.fearTimer > 0 ? '#ff00ff' : '#ffee00';

  // ── 行走动画参数（蚁群频率更快，重甲更慢，Boss慢）
  const freq   = isBoss ? 4 : isSwarm ? 10 : isHeavy ? 5 : 7;
  const legAmp = isBoss ? 7 : isSwarm ? 4 : isHeavy ? 8 : 6;
  const legSwing  = Math.sin(t * freq) * legAmp;
  const legSwing2 = Math.sin(t * freq + Math.PI) * legAmp; // 交替腿
  const bounce    = Math.abs(Math.sin(t * freq * 0.5)) * (isBoss ? 3 : isSwarm ? 2 : 4);
  const bodyTilt  = Math.sin(t * freq * 0.5) * (isBoss ? 1 : 3); // 身体左右微摇

  // ── 地面阴影（随弹跳伸缩）
  const shadowScale = 1 - bounce * 0.02;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + size + 3, size * 0.65 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI*2);
  ctx.fill();

  // ── 冰冻效果（冰晶包围 + 蓝色光晕）
  if (m.frozen) {
    // 蓝色光晕
    ctx.save();
    const frostGrad = ctx.createRadialGradient(x, y, size*0.5, x, y, size+8);
    frostGrad.addColorStop(0, 'rgba(180,230,255,0.55)');
    frostGrad.addColorStop(1, 'rgba(100,180,255,0)');
    ctx.fillStyle = frostGrad;
    ctx.beginPath(); ctx.arc(x, y, size+8, 0, Math.PI*2); ctx.fill();
    // 冰晶棱柱（6个）
    ctx.shadowColor = '#aaddff'; ctx.shadowBlur = 6;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI/3 + t*0.3;
      const cx2 = x + Math.cos(a) * (size+4), cy2 = y + Math.sin(a) * (size+4);
      ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(a);
      ctx.fillStyle = `rgba(${180+i*10},${220},255,0.85)`;
      ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(2.5,0); ctx.lineTo(0,5); ctx.lineTo(-2.5,0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y - bounce);
  ctx.rotate(bodyTilt * Math.PI / 180);

  // ── 重甲：肩甲/护板
  if (isHeavy) {
    ctx.fillStyle = '#aa88cc';
    ctx.beginPath(); ctx.ellipse(0, -size*0.1, size*0.95, size*1.05, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#ddbbff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -size*0.1, size*0.95, size*1.05, 0, 0, Math.PI*2); ctx.stroke();
    // 肩甲
    ctx.fillStyle = '#cc99ff';
    ctx.beginPath(); ctx.ellipse(-size*0.8, -size*0.3, size*0.35, size*0.25, -0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size*0.8, -size*0.3, size*0.35, size*0.25, 0.4, 0, Math.PI*2); ctx.fill();
  }

  // ── BOSS：外圈暗红光晕
  if (isBoss) {
    const bossGrad = ctx.createRadialGradient(0, 0, size*0.4, 0, 0, size*1.6);
    bossGrad.addColorStop(0, 'rgba(200,30,60,0)');
    bossGrad.addColorStop(0.7, 'rgba(200,30,60,0.25)');
    bossGrad.addColorStop(1, 'rgba(200,30,60,0)');
    ctx.fillStyle = bossGrad;
    ctx.beginPath(); ctx.arc(0, 0, size*1.6, 0, Math.PI*2); ctx.fill();
  }

  // ── 蚁群：扁平卵形身体 + 6条细腿
  if (isSwarm) {
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.ellipse(0, 0, size*1.2, size*0.7, 0, 0, Math.PI*2); ctx.fill();
    // 腹节纹
    ctx.strokeStyle = darkColor; ctx.lineWidth = 1;
    for (let seg = 1; seg <= 2; seg++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, size*(1.2-seg*0.35), size*(0.7-seg*0.1), 0, 0, Math.PI*2);
      ctx.stroke();
    }
    // 6条腿（前2中2后2）
    ctx.strokeStyle = darkColor; ctx.lineWidth = 1.2;
    const legPairs = [[-size*0.7, 0], [0, 0], [size*0.7, 0]];
    legPairs.forEach(([lx, ly], pi) => {
      const swing = Math.sin(t * freq + pi * 1.2) * 4;
      ctx.beginPath(); ctx.moveTo(lx, ly - size*0.3);
      ctx.lineTo(lx - size*0.8, ly - size*0.3 + swing - size*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, ly + size*0.3);
      ctx.lineTo(lx + size*0.8, ly + size*0.3 - swing + size*0.5); ctx.stroke();
    });
    // 眼睛（小圆）
    const eDir = m.dir === 'left' ? -1 : 1;
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(eDir*size*0.8, -size*0.1, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(eDir*size*0.8+0.5, -size*0.1-0.5, 1.2, 0, Math.PI*2); ctx.fill();
  } else {
    // ── 普通/重甲/魔免/Boss 共用身体
    // 身体主体
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, size*0.78, size*0.9, 0, 0, Math.PI*2);
    ctx.fill();
    // 腹部高光
    const bellyGrad = ctx.createRadialGradient(-size*0.2, -size*0.2, 0, 0, 0, size*0.8);
    bellyGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
    bellyGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, size*0.78, size*0.9, 0, 0, Math.PI*2); ctx.fill();
    // 腹部浅色斑
    ctx.fillStyle = shadeColor(bodyColor, 35);
    ctx.beginPath(); ctx.ellipse(0, size*0.15, size*0.42, size*0.5, 0, 0, Math.PI*2); ctx.fill();

    // ── 腿（4条，前后各2，交替摆动）
    ctx.fillStyle = darkColor;
    const legW = isBoss ? 7 : isHeavy ? 8 : 6;
    const legH_f = size*0.48 + legSwing;
    const legH_b = size*0.48 + legSwing2;
    switch (m.dir) {
      case 'right': case 'left': {
        const fx = m.dir === 'right' ? -1 : 1;
        // 后腿（先画，在身体下方）
        ctx.fillRect(fx*-4, size*0.45, legW, legH_b);
        ctx.fillRect(fx*4,  size*0.45, legW, legH_f);
        break;
      }
      case 'down': case 'up': {
        ctx.fillRect(-size*0.55, size*0.45, legW, legH_f);
        ctx.fillRect(size*0.2,   size*0.45, legW, legH_b);
        break;
      }
    }

    // ── 脸部（方向相关）
    const faceX = m.dir === 'right' ? size*0.32 : m.dir === 'left' ? -size*0.32 : 0;
    const faceY = (m.dir === 'down' || m.dir === 'up') ? -size*0.2 : -size*0.15;
    const eyeSpread = (m.dir === 'down' || m.dir === 'up') ? size*0.22 : 0;
    const eyeCount  = (m.dir === 'down' || m.dir === 'up') ? 2 : 1;
    for (let e = 0; e < eyeCount; e++) {
      const ex = faceX + (e === 0 ? -eyeSpread : eyeSpread);
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(ex, faceY, isBoss ? 5 : 3.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = eyeColor;
      ctx.beginPath(); ctx.arc(ex+0.8, faceY-0.8, isBoss ? 2.5 : 1.8, 0, Math.PI*2); ctx.fill();
      // 瞳孔
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(ex+0.5, faceY-0.5, isBoss ? 1.2 : 0.8, 0, Math.PI*2); ctx.fill();
    }
    if (m.dir !== 'up') {
      const mouthY = faceY + size*0.28;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(m.dir === 'left' ? -size*0.35 : m.dir === 'right' ? size*0.35 : 0,
              mouthY, isBoss ? 5 : 4, 0, Math.PI);
      ctx.stroke();
    }

    // ── Boss 皇冠
    if (isBoss) {
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-11, -size-2); ctx.lineTo(-11, -size-11);
      ctx.lineTo(-5.5, -size-6); ctx.lineTo(0, -size-14);
      ctx.lineTo(5.5, -size-6); ctx.lineTo(11, -size-11);
      ctx.lineTo(11, -size-2); ctx.closePath(); ctx.fill();
      // 宝石
      ctx.fillStyle = '#ff3366'; ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(0, -size-9, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(-0.8, -size-9.8, 1.2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ── 魔免盾牌（半透明盾形）
    if (isMagicImm) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 3);
      ctx.fillStyle = '#5588ff';
      ctx.strokeStyle = '#aaccff'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -size*1.25);
      ctx.bezierCurveTo(-size*0.75, -size*1.1, -size*0.75, size*0.2, 0, size*0.6);
      ctx.bezierCurveTo(size*0.75, size*0.2, size*0.75, -size*1.1, 0, -size*1.25);
      ctx.fill(); ctx.stroke();
      ctx.font = `${Math.round(size*0.7)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🛡', 0, -size*0.35);
      ctx.restore();
    }
  }

  // ── 灼烧特效：身体上多条跳动大火苗（burnImmune怪物无视）
  if (m.burnTimer > 0 && !m.burnImmune) {
    const burnIntensity = Math.min(1, m.burnTimer / 2);

    // 强烈的底部橙红光晕（明显的全身发光）
    ctx.save();
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 22 * burnIntensity;
    ctx.globalAlpha = 0.45 * burnIntensity;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.ellipse(0, 0, size * 1.05, size * 1.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.restore();

    // 6~9条独立跳动大火苗（散布在怪物身体轮廓上）
    const flameCount = 6 + Math.floor(burnIntensity * 3);
    for (let i = 0; i < flameCount; i++) {
      const phase = i * 1.618 + t * (2.8 + i * 0.35);
      const spread = size * 0.8;
      // 火苗锚点均匀分布在身体轮廓
      const fx = Math.sin(phase * 1.7) * spread;
      const fyBase = size * 0.5 + Math.cos(phase * 2.3) * size * 0.25; // 从身体中下部冒出
      // 火苗高度：大幅提升，至少有 size*0.9 高
      const flameH = size * (0.9 + 0.5 * Math.abs(Math.sin(t * 4.2 + i * 1.3))) * burnIntensity;
      const flameW = size * (0.22 + 0.08 * Math.sin(t * 3 + i));
      // 火苗颜色：底深红→橙→黄→透明
      const flameGrad = ctx.createLinearGradient(fx, fyBase, fx, fyBase - flameH);
      flameGrad.addColorStop(0,    `rgba(220,20,0,${0.95 * burnIntensity})`);
      flameGrad.addColorStop(0.25, `rgba(255,80,0,${0.92 * burnIntensity})`);
      flameGrad.addColorStop(0.55, `rgba(255,190,0,${0.75 * burnIntensity})`);
      flameGrad.addColorStop(0.8,  `rgba(255,250,100,${0.35 * burnIntensity})`);
      flameGrad.addColorStop(1,    'rgba(255,255,200,0)');
      ctx.fillStyle = flameGrad;
      // 火苗形状：底宽上窄，带左右摇摆
      const lean = Math.sin(t * 3.2 + i * 0.9) * flameW * 0.7;
      ctx.beginPath();
      ctx.moveTo(fx - flameW, fyBase);
      ctx.quadraticCurveTo(fx - flameW * 0.4, fyBase - flameH * 0.5, fx + lean, fyBase - flameH);
      ctx.quadraticCurveTo(fx + flameW * 0.4, fyBase - flameH * 0.5, fx + flameW, fyBase);
      ctx.closePath();
      ctx.fill();
      // 火苗亮芯（白橙高光）
      const coreGrad = ctx.createLinearGradient(fx, fyBase - flameH * 0.05, fx, fyBase - flameH * 0.65);
      coreGrad.addColorStop(0, `rgba(255,200,80,${0.75 * burnIntensity})`);
      coreGrad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.ellipse(fx + lean * 0.5, fyBase - flameH * 0.28, flameW * 0.42, flameH * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 顶部火花散射（小亮点）
    for (let i = 0; i < 4; i++) {
      const sp = i * 2.1 + t * 5.5;
      const sx = Math.sin(sp) * size * (0.4 + 0.3 * Math.cos(t * 3 + i));
      const sy = -size * (1.2 + 0.4 * Math.abs(Math.sin(t * 4 + i * 0.8))) * burnIntensity;
      const sr2 = size * (0.04 + 0.03 * Math.sin(t * 6 + i));
      ctx.globalAlpha = (0.6 + 0.3 * Math.sin(t * 7 + i)) * burnIntensity;
      ctx.fillStyle = '#ffee44';
      ctx.beginPath(); ctx.arc(sx, sy, sr2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── 毒素特效（淡紫色气泡上浮，普通怪版）
  if (m.poisonTimer > 0) {
    const poisonIntensity = Math.min(1, m.poisonTimer / 3);
    // 全身淡紫色光晕（相对坐标，已在translate块内）
    ctx.shadowColor = '#cc44ff'; ctx.shadowBlur = 14 * poisonIntensity;
    ctx.globalAlpha = 0.28 * poisonIntensity;
    ctx.fillStyle = '#aa44cc';
    ctx.beginPath(); ctx.ellipse(0, 0, size * 1.05, size * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    // 上浮紫色气泡（6个）
    for (let i = 0; i < 6; i++) {
      const phase = i / 6;
      const cycle = ((t * 0.8 + phase) % 1);
      const bx = Math.sin(phase * Math.PI * 2 + t * 0.5) * size * 0.75;
      const by = size * 0.6 - cycle * size * 2.2;
      const br = size * (0.12 + 0.06 * Math.sin(t * 3 + i)) * poisonIntensity;
      const alpha = cycle < 0.15 ? cycle / 0.15
                  : cycle > 0.75 ? (1 - cycle) / 0.25
                  : 1;
      ctx.globalAlpha = alpha * 0.85 * poisonIntensity;
      const bubbleGrad = ctx.createRadialGradient(bx - br*0.3, by - br*0.3, 0, bx, by, br);
      bubbleGrad.addColorStop(0, 'rgba(220,180,255,0.95)');
      bubbleGrad.addColorStop(0.5, 'rgba(160,80,220,0.7)');
      bubbleGrad.addColorStop(1, 'rgba(100,20,180,0)');
      ctx.fillStyle = bubbleGrad;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = alpha * 0.6 * poisonIntensity;
      ctx.fillStyle = 'rgba(240,220,255,0.9)';
      ctx.beginPath(); ctx.arc(bx - br*0.28, by - br*0.28, br*0.28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── 减速变蓝（用 calcEffectiveSlow 读真实减速系数，减速越深越蓝）
  // 注意：此处处于 ctx.translate(x, y-bounce) 块内，需使用相对坐标 (0, 0)
  if (!m.slowImmune) {
    const effSlow = calcEffectiveSlow(m);  // 1=无减速, 0=完全停止
    if (effSlow < 1) {
      const depth = 1 - effSlow;  // 0~1，减速越大depth越大
      const bR = Math.round(160 - depth * 80);   // 160→80
      const bG = Math.round(200 - depth * 80);   // 200→120
      const bB = Math.round(255 - depth * 40);   // 255→215，不那么刺眼
      // 椭圆比例与各类型怪物主体保持一致
      const slowRX = isSwarm ? size*1.2 : size*0.78;
      const slowRY = isSwarm ? size*0.7  : size*0.9;
      ctx.globalAlpha = Math.min(0.55, depth * 0.65);  // 透明度回调
      ctx.fillStyle = `rgb(${bR},${bG},${bB})`;
      ctx.beginPath(); ctx.ellipse(0, 0, slowRX, slowRY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ── 减甲裂纹（橙色闪电状裂缝）
  {
    let _totalDebuff = (m.defDebuff || 0);
    if (m.armorDebuffs && m.armorDebuffs.size > 0) {
      for (const entry of m.armorDebuffs.values()) _totalDebuff += entry.value;
    }
    if (_totalDebuff > 0) {
    const crackAlpha = Math.min(0.85, _totalDebuff * 0.02);
    ctx.globalAlpha = crackAlpha;
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 4;
    for (let i = 0; i < 4; i++) {
      const ba = (i * Math.PI/2) + Math.sin(t * 1.5 + i) * 0.15;
      const x0 = Math.cos(ba)*size*0.15, y0 = Math.sin(ba)*size*0.15;
      const x1 = Math.cos(ba+0.3)*size*0.85, y1 = Math.sin(ba+0.3)*size*0.85;
      const xm = (x0+x1)/2 + Math.cos(ba+1.2)*size*0.3;
      const ym = (y0+y1)/2 + Math.sin(ba+1.2)*size*0.3;
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(xm,ym); ctx.lineTo(x1,y1); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    } // end if (_totalDebuff > 0)
  } // end armorDebuffs block

  ctx.restore();

  // ── HP 血条（更精细：圆角+描边）
  const barW  = isBoss ? 52 : isHeavy ? 42 : isSwarm ? 24 : 36;
  const barH  = isBoss ? 7 : 5;
  const barX  = x - barW/2;
  const barY  = y - size - bounce - 14;
  // 背景
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2); ctx.fill();
  const hpRatio = Math.max(0, m.hp / m.maxHp);
  const hpColor = hpRatio > 0.6 ? '#44ff44' : hpRatio > 0.3 ? '#ffcc00' : '#ff4444';
  // 填充
  if (hpRatio > 0) {
    ctx.fillStyle = hpColor;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * hpRatio, barH, 2); ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * hpRatio, barH/2, 1); ctx.fill();
  }
  // 描边
  ctx.strokeStyle = '#444'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2); ctx.stroke();
}

// 三元素塔各级击杀金币倍率（额外奖励 = reward × mult）
const TRI_GOLD_MULT = [0.2, 0.3, 0.4, 0.5, 0.6];
// 雷霆塔各级攻速光环倍率
// 雷霆塔攻速光环倍率：Lv1~4 → +30/60/90/120%（即×1.3/1.6/1.9/2.2），Lv5复用Lv4
const THUNDER_BUFF_MULT = [1.3, 1.6, 1.9, 2.2, 2.2];
// 锻炉各级攻击力光环倍率
const ATKBUFF_MULT = [1.6, 1.8, 2.0, 2.5, 3.0];
// 冰霜塔各级减速因子：1-5级对应减速20%/30%/40%/50%/60%
const ICE_SLOW_FACTOR = [0.80, 0.70, 0.60, 0.50, 0.40];

// ========== 减速工具函数 ==========
/**
 * 向怪物施加一层减速
 * @param {object} m - 怪物
 * @param {number} factor - 减速系数（如0.7表示减速30%，即移速乘以0.7）
 * @param {number} duration - 持续时间（秒）
 */
/**
 * 施加减速层
 * @param {object} m        - 怪物对象
 * @param {number} factor   - 移速系数，0~1（0.4 = 减速60%）
 * @param {number} duration - 持续时间（秒）
 * @param {string} type     - 来源类型：'attack'|'aura'|'other'
 *   attack : 命中型减速（冰霜塔/冰炎塔/寒冰），同类只取最大值
 *   aura   : 持续光环减速（极寒/雪王/暴风雪），同类只取最大值
 *   other  : 其余（冰雹爆炸/冰霜波等），全部乘法叠加
 */
function applySlowLayer(m, factor, duration, type) {
  if (!m || m.dead || m.slowImmune) return;
  m.slowLayers = m.slowLayers || [];
  m.slowLayers.push({ factor, timer: duration, type: type || 'other' });
}

/**
 * 计算怪物当前有效减速系数
 * 规则：
 *   attack 层 → 只取 factor 最小值（即减速最强那一个）
 *   aura   层 → 只取 factor 最小值
 *   other  层 → 全部乘法叠加
 * 三组结果再乘法合并，最终超过70%减速部分按30%折算
 * 返回值范围 (0, 1]，1表示无减速
 */
function calcEffectiveSlow(m) {
  if (!m.slowLayers || m.slowLayers.length === 0) return 1;

  // 分组
  const attackLayers = m.slowLayers.filter(l => l.type === 'attack');
  const auraLayers   = m.slowLayers.filter(l => l.type === 'aura');
  const otherLayers  = m.slowLayers.filter(l => l.type !== 'attack' && l.type !== 'aura');

  // 每组计算各自的移速系数
  // attack：取 factor 最小值（减速最强），无则为1
  const attackFactor = attackLayers.length > 0
    ? Math.min(...attackLayers.map(l => l.factor))
    : 1;

  // aura：取 factor 最小值，无则为1
  const auraFactor = auraLayers.length > 0
    ? Math.min(...auraLayers.map(l => l.factor))
    : 1;

  // other：全部乘法叠加，无则为1
  let otherFactor = 1;
  otherLayers.forEach(l => { otherFactor *= l.factor; });

  // 三组乘法合并
  let product = attackFactor * auraFactor * otherFactor;
  product = Math.max(0.01, product); // 不允许完全停止

  // 超70%减速折算
  const slowPct = 1 - product;
  if (slowPct <= 0.7) {
    return product;
  } else {
    const extraSlow = slowPct - 0.7;
    const effectiveSlow = 0.7 + extraSlow * 0.3;
    return 1 - effectiveSlow;
  }
}
// 熔岩塔各级减甲值：1-5级依次为8/11/14/17/20
const LAVA_DEF_DEBUFF = [8, 11, 14, 17, 20];
// 升级攻击力倍率：1/2/3/4/5/6级相对1级分别×1/2/4/8/16/32（新基础塔每级翻倍）
const LVL_DMG_MULT = [1, 2, 4, 8, 16, 32];
// 金币塔每8秒产出金币（Lv1~5）
const GOLD_GEN_AMOUNT = [6, 12, 24, 48, 96];
// 熔岩塔波技能伤害（Lv1~5）
const LAVA_WAVE_DMG = [30, 60, 120, 240, 500];
// 冰炎塔各级冰冻时间：1-5级依次为0.5/0.625/0.75/0.875/1.0秒
const DUAL_FROST_FREEZE = [0.5, 0.625, 0.75, 0.875, 1.0];

// 闪电链效果列表 [{points:[{x,y},...], life}]
let lightningArcs = [];
// 冰雹粒子 [{x,y,vy,exploded,aoeR,life}]
let hailParticles = [];
// 熔岩波形 [{cx,cy,r,maxR,life}]
let lavaWaves = [];
// 金币爆发特效 [{x,y,coins:[{vx,vy,x,y,life,maxLife}],life}]
let coinBursts = [];

// ========== 塔的攻击逻辑 ==========
function updateTowers(dt) {
  // 更新特殊配方高亮
  updateSpecialRecipeHighlights();

  // 衰减视觉粒子
  lightningArcs = lightningArcs.filter(a => { a.life -= dt; return a.life > 0; });
  hailParticles = hailParticles.filter(h => { h.life -= dt; return h.life > 0; });
  lavaWaves     = lavaWaves.filter(w => { w.life -= dt; return w.life > 0; });
  // 灵魂抽取线条衰减
  state.soulArcs = (state.soulArcs || []).filter(a => { a.life -= dt; return a.life > 0; });
  // 更新核弹爆炸特效
  state.nukeEffects = (state.nukeEffects || []).filter(n => { n.life -= dt; return n.life > 0; });
  // 金币爆发粒子更新
  coinBursts = coinBursts.filter(burst => {
    burst.life -= dt;
    burst.coins.forEach(c => {
      c.x  += c.vx * dt;
      c.y  += c.vy * dt;
      c.vy += 220 * dt; // 重力
      c.life -= dt;
    });
    burst.coins = burst.coins.filter(c => c.life > 0);
    return burst.life > 0;
  });
  // 更新冰雹粒子位置；落地瞬间结算AOE伤害+减速
  hailParticles.forEach(h => {
    if (!h.exploded) {
      h.y += h.vy * dt * state.speedMult;
      if (h.y >= h.targetY) {
        h.y = h.targetY;
        h.exploded = true;
        // 落地才执行伤害和减速（dealtDmg 防止重复计算）
        if (!h.dealtDmg) {
          h.dealtDmg = true;
          // 爆炸粒子
          for (let i = 0; i < 10; i++)
            state.particles.push(new Particle(h.x, h.targetY, (Math.random()-0.5)*120, (Math.random()-0.5)*120, '#aaddff', Math.random()*5+3, 0.5));
          // AOE伤害+减速
          state.monsters.filter(m => !m.dead).forEach(m => {
            const dx = m.x - h.x, dy = m.y - h.targetY;
            if (Math.sqrt(dx*dx+dy*dy) <= h.aoeR) {
              const realDmg = calcDmg(h.dmg, m, false); // 魔法
              m.hp -= realDmg;
              spawnDmgNumber(m.x, m.y, realDmg);
              if (h.towerKey && state.towers[h.towerKey]) {
                state.towers[h.towerKey].damageDealt = (state.towers[h.towerKey].damageDealt || 0) + realDmg;
                state.towers[h.towerKey].magicDmg = (state.towers[h.towerKey].magicDmg || 0) + realDmg;
              }
              if (m.hp <= 0 && !m.dead) { m.die(); return; }
              applySlowLayer(m, 1 - h.power, 2.5, 'other'); // 冰雹AOE减速
              state.particles.push(new Particle(m.x, m.y, 0, -20, '#aaddff', 3, 0.3));
            }
          });
        }
      }
    }
  });
  // 扩散熔岩波
  lavaWaves.forEach(w => {
    const progress = 1 - (w.life / w.maxLife);
    w.r = w.maxR * progress;
  });

  // ── 雪王暴风雪区域持续伤害+减速+粗冰雹粒子
  if (state.snowstorms) {
    state.snowstorms = state.snowstorms.filter(s => { s.life -= dt * state.speedMult; return s.life > 0; });
    state.snowstorms.forEach(s => {
      // 初始化冰雹粒子列表
      if (!s.hails) s.hails = [];
      // 每帧随机在范围顶部生成粗冰雹（每帧概率生成2~4颗）
      const spawnRate = 4 * state.speedMult;
      const spawnCount = Math.random() < (spawnRate * dt) ? Math.floor(Math.random()*2)+1 : 0;
      for (let si = 0; si < spawnCount; si++) {
        const angle = Math.random() * Math.PI * 2;
        const radOffset = Math.random() * s.r;
        s.hails.push({
          x: s.x + Math.cos(angle) * radOffset,
          y: s.y - s.r * 1.2, // 从区域顶部上方生成
          vy: 180 + Math.random() * 100, // 下落速度
          vx: (Math.random() - 0.5) * 30,
          size: 4 + Math.random() * 4,   // 粒子大小（比普通大）
          maxLife: 0.35 + Math.random() * 0.2,
          life: 0.35 + Math.random() * 0.2,
          hit: false,
          hitTimer: 0,
        });
      }
      // 更新冰雹运动
      s.hails = s.hails.filter(h => h.life > 0);
      s.hails.forEach(h => {
        h.life -= dt * state.speedMult;
        if (!h.hit) {
          h.y += h.vy * dt * state.speedMult;
          h.x += h.vx * dt * state.speedMult;
          // 到达落点（目标y=s.y）则砸地
          if (h.y >= s.y) {
            h.hit = true;
            h.y = s.y;
            h.hitTimer = 0.12;
          }
        } else {
          h.hitTimer -= dt * state.speedMult;
        }
      });

      // 怪物伤害和减速
      state.monsters.forEach(m => {
        if (m.dead) return;
        const dx = m.x - s.x, dy = m.y - s.y;
        if (Math.sqrt(dx*dx+dy*dy) <= s.r) {
          if (!m.isMagicImm) {
            const snowDmg = s.dps * dt;
            m.hp -= snowDmg;
            if (s.towerKey && state.towers[s.towerKey]) {
              state.towers[s.towerKey].damageDealt = (state.towers[s.towerKey].damageDealt || 0) + snowDmg;
              state.towers[s.towerKey].magicDmg = (state.towers[s.towerKey].magicDmg || 0) + snowDmg;
            }
            if (m.hp <= 0 && !m.dead) { m.die(); return; }
          }
          applySlowLayer(m, 0.2, 0.2, 'aura'); // 雪王暴风雪光环80%减速，每帧续0.2s
        }
      });
    });
  }

  // ── 阶段1：每帧将所有塔的 buff 重置为基础值
  Object.values(state.towers).forEach(tower => {
    tower.buffMult      = 1;  // 攻速倍率
    tower.atkBuffMult   = 1;  // 攻击力倍率（光环加成）
    tower.rangeBonus    = 0;  // 射程加成（格数，望远镜/火枪手/神枪手光环）
  });
  state.monsters.forEach(m => { m.armorPctDebuff = 0; m.damageTakenMult = 1; });

  // build phase: skip tower attack/buff logic; visual effects update normally
  if (state.phase === 'build') return;


  // ── 阶段2：光环塔持续施加 buff（塔存在即生效，无时间限制）
  const _CS2 = CELL;
  Object.entries(state.towers).forEach(([key, tower]) => {
    const cfg = tower.cfg;
    if (cfg.effect !== 'thunderBuff' && cfg.effect !== 'atkBuff' && cfg.effect !== 'scopeAura' && cfg.effect !== 'gunnerAura' && cfg.effect !== 'sniperAura' && cfg.effect !== 'rainbowAura' && cfg.effect !== 'phantomAssassinAtk' && cfg.effect !== 'phoenixAura') return;
    const lvl = tower.level || 1;
    const [r, c] = key.split(',').map(Number);
    const tx = c * _CS2 + _CS2/2, ty = r * _CS2 + _CS2/2;
    const aoeR = cfg.aoeRange * _CS2;
    if (cfg.effect === 'thunderBuff') {
      const spMult = THUNDER_BUFF_MULT[Math.min(lvl - 1, THUNDER_BUFF_MULT.length - 1)];
      // 自身也受光环加成
      if (spMult > tower.buffMult) tower.buffMult = spMult;
      Object.entries(state.towers).forEach(([k2, t2]) => {
        if (k2 === key) return; // 已单独处理自身
        if (t2.cfg.effect === 'thunderBuff' || t2.cfg.effect === 'atkBuff' || t2.cfg.effect === 'shadowGodAtk') return; // 光环塔不互相叠加
        const [r2, c2] = k2.split(',').map(Number);
        const dx = c2*_CS2+_CS2/2 - tx, dy = r2*_CS2+_CS2/2 - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= aoeR) {
          if (spMult > t2.buffMult) t2.buffMult = spMult;
        }
      });
    }
    if (cfg.effect === 'atkBuff') {
      const atkMult = ATKBUFF_MULT[Math.min(lvl - 1, ATKBUFF_MULT.length - 1)];
      // 自身也受攻击力光环加成
      if (atkMult > tower.atkBuffMult) tower.atkBuffMult = atkMult;
      Object.entries(state.towers).forEach(([k2, t2]) => {
        if (k2 === key) return;
        if (t2.cfg.effect === 'thunderBuff' || t2.cfg.effect === 'atkBuff' || t2.cfg.effect === 'shadowGodAtk') return; // 光环塔不互相叠加
        const [r2, c2] = k2.split(',').map(Number);
        const dx = c2*_CS2+_CS2/2 - tx, dy = r2*_CS2+_CS2/2 - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= aoeR) {
          if (atkMult > t2.atkBuffMult) t2.atkBuffMult = atkMult;
        }
      });
    }
    // 彩精灵：使左边1格（同行-1列）和右边1格（同行+1列）的塔 atkBuffMult *= 1.7
    if (cfg.effect === 'rainbowAura') {
      const [rbR, rbC] = key.split(',').map(Number);
      const leftKey  = `${rbR},${rbC - 1}`;
      const rightKey = `${rbR},${rbC + 1}`;
      const leftTower  = state.towers[leftKey];
      const rightTower = state.towers[rightKey];
      if (leftTower)  leftTower.atkBuffMult  = (leftTower.atkBuffMult  || 1) * (cfg.effectPower || 1.7);
      if (rightTower) rightTower.atkBuffMult = (rightTower.atkBuffMult || 1) * (cfg.effectPower || 1.7);
      // 标记此帧加成的目标（用于绘制双向光线）
      tower.rainbowTarget      = rightTower ? rightKey : null;
      tower.rainbowTargetLeft  = leftTower  ? leftKey  : null;
    }
    // 望远镜：单体攻击（dmg=150，rate=1.0）
    if (cfg.effect === 'scopeAura' && cfg.dmg > 0) {
      tower.cooldown = (tower.cooldown || 0) - dt * state.speedMult;
      if (tower.cooldown <= 0) {
        const scopeRangeP = cfg.range * _CS2;
        const scopeTargets = state.monsters.filter(m => {
          if (m.dead) return false;
          const dx = m.x - tx, dy = m.y - ty;
          return Math.sqrt(dx*dx+dy*dy) <= scopeRangeP;
        }).sort((a, b) => b.pathIdx - a.pathIdx);
        if (scopeTargets.length > 0) {
          const effectiveRate = cfg.rate * (tower.buffMult || 1);
          const scopeDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
          state.projectiles.push(new Projectile(tx, ty, scopeTargets[0], scopeDmg, cfg.color, 'thunderSingle', 0, key));
          tower.cooldown = 1 / effectiveRate;
        }
      }
    }
    // 望远镜/火枪手/神枪手：自身及周围1.5格塔获得射程加成（rangeBonus）和攻速加成（buffMult）
    if (cfg.effect === 'scopeAura' || cfg.effect === 'gunnerAura' || cfg.effect === 'sniperAura') {
      const scopeAoeR = (cfg.aoeRange || 1) * _CS2;
      const rangeAdd  = cfg.rangeBonus  || 0;    // 射程格数加成
      const speedMult = cfg.effectPower || 1;    // 攻速倍率
      // 自身也受光环加成
      tower.rangeBonus = (tower.rangeBonus || 0) + rangeAdd;
      if (speedMult > (tower.buffMult || 1)) tower.buffMult = speedMult;
      Object.entries(state.towers).forEach(([k2, t2]) => {
        if (k2 === key) return; // 自身已单独处理
        // 仅排除 buff/辅助光环塔本身（避免光环塔互相叠加），特殊合成战斗塔可以接受 buff
        if (t2.cfg.effect === 'thunderBuff' || t2.cfg.effect === 'atkBuff' || t2.cfg.effect === 'scopeAura' || t2.cfg.effect === 'gunnerAura' || t2.cfg.effect === 'sniperAura') return;
        const [r2, c2] = k2.split(',').map(Number);
        const dx = c2*_CS2+_CS2/2 - tx, dy = r2*_CS2+_CS2/2 - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= scopeAoeR) {
          t2.rangeBonus = (t2.rangeBonus || 0) + rangeAdd;
          if (speedMult > (t2.buffMult || 1)) t2.buffMult = speedMult;
        }
      });
    }
    // 幻影刺客：周围2.5格内所有塔攻击力+20%（atkBuffMult *= 1.2）
    if (cfg.effect === 'phantomAssassinAtk') {
      const paAoeR = (cfg.aoeRange || 2.5) * _CS2;
      const atkAdd = cfg.atkBuffAdd || 1.2;
      Object.entries(state.towers).forEach(([k2, t2]) => {
        if (k2 === key) return;
        const [r2, c2] = k2.split(',').map(Number);
        const dx = c2*_CS2+_CS2/2 - tx, dy = r2*_CS2+_CS2/2 - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= paAoeR) {
          t2.atkBuffMult = (t2.atkBuffMult || 1) * atkAdd;
        }
      });
    }
    // 凤凰：范围内所有敌人（包括魔免）受伤+25%，在阶段2提前赋值确保当帧所有塔攻击都能生效
    if (cfg.effect === 'phoenixAura') {
      const phxAoeR = cfg.aoeRange * _CS2;
      state.monsters.forEach(m => {
        if (m.dead) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= phxAoeR) {
          m.damageTakenMult = Math.max(m.damageTakenMult || 1, 1.25);
        }
      });
    }
  });

  // ── 阶段3：各塔正常攻击循环
  const _CS3 = CELL;
  Object.entries(state.towers).forEach(([key, tower]) => {
    const cfg = tower.cfg;
    const [r, c] = key.split(',').map(Number);
    const tx = c * _CS3 + _CS3/2, ty = r * _CS3 + _CS3/2;
    // ── 特殊塔：凤凰（AOE灼烧350/s + 光环：范围5格内敌人受到伤害+10%）
    if (cfg.effect === 'phoenixAura') {
      const aoeR = cfg.aoeRange * _CS3;
      state.monsters.forEach(m => {
        if (m.dead) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= aoeR) {
          // 灼烧（仅对非魔免单位生效，damageTakenMult 已在阶段2统一设置）
          if (!m.burnImmune) {
            m.burnTimer = Math.max(m.burnTimer || 0, 0.5);
            m.burnDmg   = Math.max(m.burnDmg   || 0, cfg.effectPower);
            m.burnSourceKey = key; // 修复：统计来源交给 burnTick 统一处理
          }
        }
      });
      // 凤凰塔旋转翼光粒子
      if (Math.random() < 0.4) {
        const angle = state.tick * 3 + Math.random() * Math.PI * 2;
        const pr = (cfg.aoeRange * 0.6) * _CS3 * Math.random();
        state.particles.push(new Particle(
          tx + Math.cos(angle) * pr, ty + Math.sin(angle) * pr,
          Math.cos(angle + Math.PI/2) * 30, -50 + Math.random()*20,
          Math.random() < 0.5 ? '#ff6600' : '#ffcc00', Math.random()*4+2, 0.5
        ));
      }
      return;
    }

    // ── 特殊塔：极寒之塔（60%持续减速+冰霜波）
    if (cfg.effect === 'permafrostAura') {
      const aoeR = cfg.aoeRange * _CS3;
      // 持续60%减速（每帧刷新0.2s，只要怪在范围内就持续受减速）
      state.monsters.forEach(m => {
        if (m.dead) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= aoeR) {
          applySlowLayer(m, 0.4, 0.2, 'aura'); // 极寒光环60%减速，每帧续0.2s
        }
      });
      // 冰霜波（6秒一次）
      tower.specialCooldown = (tower.specialCooldown || 0) - dt * state.speedMult;
      if (tower.specialCooldown <= 0) {
        tower.specialCooldown = 6;
        const waveR = 6 * _CS3;
        // 冰霜波伤害（用固定150点基础伤害）
        const frostDmg = 150;
        state.monsters.forEach(m => {
          if (m.dead) return;
          const dx = m.x - tx, dy = m.y - ty;
          if (Math.sqrt(dx*dx+dy*dy) <= waveR) {
            const realDmg = calcDmg(frostDmg, m, false); // 冰霜波=魔法
            if (realDmg === 0) return; // 魔免免疫
            m.hp -= realDmg;
            spawnDmgNumber(m.x, m.y, realDmg);
            tower.damageDealt = (tower.damageDealt || 0) + realDmg;
            tower.magicDmg = (tower.magicDmg || 0) + realDmg;
            if (m.hp <= 0 && !m.dead) { m.die(); return; }
            applySlowLayer(m, 0.2, 1.5, 'other'); // 冰霜波 80%减速，持续1.5s
          }
        });
        // 冰霜波视觉：大型扩散蓝圈
        lavaWaves.push({ cx: tx, cy: ty, r: 0, maxR: waveR, life: 0.8, maxLife: 0.8, isFrost: true });
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2;
          const rd = Math.random() * waveR;
          state.particles.push(new Particle(tx + Math.cos(a)*rd, ty + Math.sin(a)*rd,
            (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#aaddff', Math.random()*5+2, 0.6));
        }
      }
      // 持续粒子
      if (Math.random() < 0.3) {
        const a = Math.random() * Math.PI * 2;
        const rd = Math.random() * aoeR;
        state.particles.push(new Particle(tx + Math.cos(a)*rd, ty + Math.sin(a)*rd,
          0, -20, '#00eeff', Math.random()*3+1, 0.4));
      }
      return;
    }

    // ── 特殊塔：天帝（超高单体伤害，击杀双倍金币）
    if (cfg.effect === 'skyLordAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const target = inRange[0];
      // 发射金色高伤子弹，标记双倍金币
      const proj = new Projectile(tx, ty, target, Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1)), cfg.color, 'skyLord', cfg.effectPower, key);
      state.projectiles.push(proj);
      tower.cooldown = 1 / effectiveRate;
      // 天帝光效粒子
      if (Math.random() < 0.5) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*80, (Math.random()-0.5)*80, '#ffd700', Math.random()*4+2, 0.4));
      }
      return;
    }

    // ── 特殊塔：宙斯（物理攻击5目标含魔免 + 叉状闪电5目标魔法伤害不含魔免）
    if (cfg.effect === 'stormGoddessAtk') {
      tower.cooldown = (tower.cooldown || 0) - dt * state.speedMult;
      if (tower.cooldown > 0) return;
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const dmgEach = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      // 所有目标（含魔免），按路程排序，取最多5个
      const allInRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (allInRange.length === 0) return;
      const physTargets = allInRange.slice(0, 5);
      // 第一轮：物理攻击（含魔免，受护甲减免）
      physTargets.forEach(m => {
        const realDmg = calcDmg(dmgEach, m);
        const hitX = m.x, hitY = m.y;
        m.hp -= realDmg;
        spawnDmgNumber(hitX, hitY, realDmg);
        tower.damageDealt = (tower.damageDealt || 0) + realDmg;
        tower.physDmg = (tower.physDmg || 0) + realDmg;
        if (m.hp <= 0 && !m.dead) m.die();
      });
      // 第二轮：叉状闪电（魔法伤害，跳过魔免怪，无视护甲）
      const magicTargets = allInRange.filter(m => !m.isMagicImm).slice(0, 5);
      const lightningPositions = magicTargets.map(m => ({ x: m.x, y: m.y, m }));
      lightningPositions.forEach(({ x: lx, y: ly, m }) => {
        if (m.dead) return;
        m.hp -= dmgEach;
        spawnDmgNumber(lx, ly - 12, dmgEach, 'magic');
        tower.damageDealt = (tower.damageDealt || 0) + dmgEach;
        tower.magicDmg = (tower.magicDmg || 0) + dmgEach;
        if (m.hp <= 0 && !m.dead) m.die();
        lightningArcs.push({
          points: [{ x: tx, y: ty }, { x: lx, y: ly }],
          life: 0.22, maxLife: 0.22, color: '#bb88ff',
        });
      });
      tower.cooldown = 1 / effectiveRate;
      return;
    }


    // ── 特殊塔：火枪手/神枪手（单体攻击；光环在阶段2处理）
    if (cfg.effect === 'gunnerAura' || cfg.effect === 'sniperAura') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const gnRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const gnTarget = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= gnRange;
      }).sort((a, b) => b.pathIdx - a.pathIdx)[0];
      if (!gnTarget) return;
      const gnDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      state.projectiles.push(new Projectile(tx, ty, gnTarget, gnDmg, cfg.color, 'normal', 0, key));
      tower.cooldown = 1 / effectiveRate;
      // 射击火花粒子
      if (Math.random() < 0.7) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*60, (Math.random()-0.5)*60,
          cfg.effect === 'sniperAura' ? '#ff6622' : '#ffaa44',
          Math.random()*3+2, 0.35));
      }
      return;
    }

    // ── 特殊塔：寒冰（同时攻击5个目标，命中50%减速3秒）
    if (cfg.effect === 'frostArrowAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const targets = inRange.slice(0, 5); // 同时攻击最多5个
      const frostDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      targets.forEach(m => {
        const proj = new Projectile(tx, ty, m, frostDmg, cfg.color, 'frostArrowAtk', cfg.effectPower, key);
        state.projectiles.push(proj);
      });
      tower.cooldown = 1 / effectiveRate;
      // 蓝色冰霜粒子
      if (Math.random() < 0.5) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#44ccff', Math.random()*4+2, 0.35));
      }
      return;
    }

    // ── 特殊塔：雪王（5目标攻击+50%冰冻+60%减速光环4格+8s暴风雪持续2s）
    if (cfg.effect === 'snowKingAtk') {
      // 持续60%减速光环（半径4格，每帧刷新）
      const slowAoeR = (cfg.aoeRange || 4) * _CS3;
      state.monsters.forEach(m => {
        if (m.dead) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= slowAoeR) {
          applySlowLayer(m, 0.4, 0.2, 'aura'); // 雪王光环60%减速，每帧续0.2s
        }
      });

      // 暴风雪冷却（8秒一次）
      tower.specialCooldown = (tower.specialCooldown || 0) - dt * state.speedMult;
      if (tower.specialCooldown <= 0) {
        tower.specialCooldown = 8;
        // 选路程最远的怪物位置作为暴风雪落点
        const allLive = state.monsters.filter(m => !m.dead);
        if (allLive.length > 0) {
          allLive.sort((a, b) => b.pathIdx - a.pathIdx);
          const target = allLive[0];
          // 创建暴风雪区域（持续2秒）
          state.snowstorms.push({
            x: target.x, y: target.y,
            r: 1 * _CS3,   // 半径1格
            life: 2.0, maxLife: 2.0,
            dps: 80,       // 每秒伤害
            towerKey: key, // 伤害统计来源
          });
          // 暴风雪落下视觉
          for (let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            state.particles.push(new Particle(
              target.x + Math.cos(a) * _CS3 * Math.random(),
              target.y + Math.sin(a) * _CS3 * Math.random(),
              (Math.random()-0.5)*40, -60 - Math.random()*40,
              '#cceeff', Math.random()*5+2, 0.7
            ));
          }
        }
      }
      // 正常攻击（5目标）
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const targets2 = inRange.slice(0, 5); // 5个目标
      targets2.forEach(m => {
        state.projectiles.push(new Projectile(tx, ty, m, Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1)), cfg.color, 'snowKing', cfg.effectPower, key));
      });
      tower.cooldown = 1 / effectiveRate;
      return;
    }

    // ── 特殊塔：金刚（超高单体，每击减甲10，最多-50）
    if (cfg.effect === 'vajraAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const target = inRange[0];
      state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1)), cfg.color, 'vajraAtk', cfg.effectPower, key));
      tower.cooldown = 1 / effectiveRate;
      // 金色粒子
      if (Math.random() < 0.5) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*70, (Math.random()-0.5)*70, '#ffe066', Math.random()*4+2, 0.4));
      }
      return;
    }

    // ── 特殊塔：大金刚（超高单体，溅射50%至周围1格）
    if (cfg.effect === 'greatVajraAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const target = inRange[0];
      const dmgGV = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      state.projectiles.push(new Projectile(tx, ty, target, dmgGV, cfg.color, 'greatVajraAtk', cfg.effectPower, key));
      tower.cooldown = 1 / effectiveRate;
      if (Math.random() < 0.6) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*80, (Math.random()-0.5)*80, '#ffcc00', Math.random()*4+2, 0.4));
      }
      return;
    }

    // ── 特殊塔：幻影刺客（高攻速单体，10%概率20倍暴击）
    if (cfg.effect === 'phantomAssassinAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const paRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const paTargets = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= paRange;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (paTargets.length === 0) return;
      const target = paTargets[0];
      const isCrit = Math.random() < cfg.effectPower; // 10%暴击
      const baseDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      const finalDmg = isCrit ? baseDmg * 20 : baseDmg;
      // power字段：isCrit=1，非暴击=0
      state.projectiles.push(new Projectile(tx, ty, target, finalDmg,
        isCrit ? '#ffffff' : cfg.color, 'phantomAssassinAtk', isCrit ? 1 : 0, key));
      tower.cooldown = 1 / effectiveRate;
      return;
    }

    // ── 特殊塔：结晶（单体攻击，10%概率5倍暴击）
    if (cfg.effect === 'crystalAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const crRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const crTargets = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= crRange;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (crTargets.length === 0) return;
      const target = crTargets[0];
      const isCrit = Math.random() < cfg.effectPower; // 10%暴击
      const baseDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      const finalDmg = isCrit ? baseDmg * 5 : baseDmg;
      state.projectiles.push(new Projectile(tx, ty, target, finalDmg, isCrit ? '#ffffff' : cfg.color, 'crystalAtk', isCrit ? 1 : 0, key));
      tower.cooldown = 1 / effectiveRate;
      return;
    }

    // ── 特殊塔：黑石（3目标攻击，命中削甲12/次，最多-80）
    if (cfg.effect === 'blackStoneAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const bsRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const bsTargets = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= bsRange;
      }).sort((a, b) => b.pathIdx - a.pathIdx).slice(0, 3);
      if (bsTargets.length === 0) return;
      const bsDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      bsTargets.forEach(m => {
        state.projectiles.push(new Projectile(tx, ty, m, bsDmg, cfg.color, 'blackStoneAtk', cfg.effectPower, key));
      });
      tower.cooldown = 1 / effectiveRate;
      return;
    }

    // ── 特殊塔：影魔（单体物理700，减甲30，击杀收集灵魂+10攻/魂）
    if (cfg.effect === 'shadowDemonAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const target = inRange[0];
      const dmg = Math.round((900 + (tower.souls || 0) * 50) * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      state.projectiles.push(new Projectile(tx, ty, target, dmg, cfg.color || '#cc44ff', 'shadowDemonAtk', 15, key));
      tower.cooldown = 1 / effectiveRate;
      if (Math.random() < 0.5) {
        state.particles.push(new Particle(tx, ty,
          (Math.random()-0.5)*50, (Math.random()-0.5)*50, '#cc44ff', Math.random()*3+2, 0.35));
      }
      return;
    }

    // ── 特殊塔：阎王（双体物理1200，减甲40，灵魂收集，每12秒恐惧波范围4；持续减甲光环30）
    if (cfg.effect === 'yanluoAtk') {
      // 持续减甲光环：每帧对范围内怪物施加 defDebuff（取较大值）
      if (cfg.armorDebuffAura) {
        const ylAuraR = cfg.aoeRange * _CS3;
        state.monsters.forEach(m => {
          if (m.dead) return;
          const dx = m.x - tx, dy = m.y - ty;
          if (Math.sqrt(dx*dx+dy*dy) <= ylAuraR) {
            if (cfg.armorDebuffAura > (m.defDebuff || 0)) {
              m.defDebuff = cfg.armorDebuffAura;
            }
            m.defDebuffTimer = Math.max(m.defDebuffTimer || 0, 0.5); // 每帧刷新
          }
        });
      }
      // 恐惧波计时
      tower.specialCooldown = (tower.specialCooldown || 0) - dt * state.speedMult;
      if (tower.specialCooldown <= 0) {
        tower.specialCooldown = 12;
        const fearAoeR = 4 * _CS3;
        state.monsters.forEach(m => {
          if (m.dead) return;
          const dx = m.x - tx, dy = m.y - ty;
          if (Math.sqrt(dx*dx+dy*dy) <= fearAoeR) {
            m.fearTimer = 1.5;
            m.fearDamageMult = 1.3;
          }
        });
        // 恐惧波视觉：紫色扩散圆环
        lavaWaves.push({ cx: tx, cy: ty, r: 0, maxR: fearAoeR, life: 0.9, maxLife: 0.9, isFear: true });
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          const rd = Math.random() * fearAoeR;
          state.particles.push(new Particle(tx + Math.cos(a)*rd, ty + Math.sin(a)*rd,
            (Math.random()-0.5)*50, (Math.random()-0.5)*50, '#9933cc', Math.random()*4+2, 0.7));
        }
      }
      // 正常攻击（双体）
      const effectiveRateYL = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangePYL = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRangeYL = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangePYL;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRangeYL.length === 0) return;
      const ylTargets = inRangeYL.slice(0, 2);
      const ylDmg = Math.round((900 + (tower.souls || 0) * 50) * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      ylTargets.forEach(m => {
        state.projectiles.push(new Projectile(tx, ty, m, ylDmg, cfg.color || '#cc0000', 'yanluoAtk', 0, key));
      });
      tower.cooldown = 1 / effectiveRateYL;
      return;
    }

    // ── 特殊塔：炼金术士（单体攻击500伤/3次/s，发射金币弹道，击杀时生成2个钱袋各10金）
    if (cfg.effect === 'bankAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      tower.cooldown = (tower.cooldown || 0) - dt * state.speedMult;
      if (tower.cooldown > 0) return;
      const alchRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const target = state.monsters
        .filter(m => !m.dead && Math.sqrt((m.x-tx)**2 + (m.y-ty)**2) <= alchRange)
        .sort((a, b) => b.pathIdx - a.pathIdx)[0];
      if (!target) return;
      tower.cooldown = 1 / effectiveRate;
      const alchDmg = Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1));
      // 发射金币弹道，命中时通过 applyEffect('bankAtk') 处理伤害+钱袋特效
      state.projectiles.push(new Projectile(tx, ty, target, alchDmg, '#ffd700', 'bankAtk', 0, key));
      return;
    }


    // ── 特殊塔：雷公/雷王（高攻速单体，概率触发闪电链4-5目标）
    if (cfg.effect === 'jellyAtk' || cfg.effect === 'thunderKingAtk') {
      const effectiveRate = cfg.rate * (tower.buffMult || 1);
      if (tower.cooldown > 0) { tower.cooldown -= dt * state.speedMult; return; }
      const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
      const inRange = state.monsters.filter(m => {
        if (m.dead) return false;
        const dx = m.x - tx, dy = m.y - ty;
        return Math.sqrt(dx*dx+dy*dy) <= rangeP;
      }).sort((a, b) => b.pathIdx - a.pathIdx);
      if (inRange.length === 0) return;
      const target = inRange[0];
      state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * (tower.atkBuffMult || 1) * (state.globalAtkMult || 1)), cfg.color, 'jellyAtk', cfg.effectPower, key));
      tower.cooldown = 1 / effectiveRate;
      return;
    }

    // ── 特殊塔：点金手（每回合直接秒杀一个普通小兵，掉落2个钱袋各20金）
    if (cfg.effect === 'goldMachineGen') {
      if (!tower.alchemyUsed) {
        const alchRange = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
        const target = state.monsters
          .filter(m => !m.dead && !m.isBoss && !m.isElite && !m.isMagicImm
            && !m.isTreasure && m.waveType !== 'boss'
            && Math.sqrt((m.x-tx)**2 + (m.y-ty)**2) <= alchRange)
          .sort((a, b) => b.pathIdx - a.pathIdx)[0];
        if (target) {
          tower.alchemyUsed = true;
          const kx = target.x, ky = target.y;
          tower.damageDealt = (tower.damageDealt || 0) + target.hp;
          tower.physDmg = (tower.physDmg || 0) + target.hp;
          target.hp = 0;
          target.die();
          // 秒杀后额外掉落2个钱袋，每个价值10金
          spawnCoinDrop(kx - 8, ky, 10);
          spawnCoinDrop(kx + 8, ky, 10);
          // 金色炼化粒子爆发
          for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 40 + Math.random() * 80;
            state.particles.push(new Particle(kx, ky,
              Math.cos(a) * spd, Math.sin(a) * spd,
              '#ffd700', Math.random() * 3 + 2, 0.6));
          }
        }
      }
      return;
    }

    // ── 特殊塔：小火山（持续灼烧AOE 100/s，魔法伤害，魔免无效）
    if (cfg.effect === 'volcanoAura') {
      const aoeR = cfg.aoeRange * _CS3;
      state.monsters.forEach(m => {
        if (m.dead || m.burnImmune) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= aoeR) {
          m.burnTimer = Math.max(m.burnTimer || 0, 0.5);
          m.burnDmg   = Math.max(m.burnDmg   || 0, cfg.effectPower);
          m.burnSourceKey = key; // 统计来源交给 burnTick 统一处理，移除重复统计
        }
      });
      if (Math.random() < 0.35) {
        state.particles.push(new Particle(tx, ty - 8,
          (Math.random()-0.5)*50, -60 - Math.random()*40,
          Math.random() < 0.5 ? '#ff4400' : '#ffaa00',
          Math.random()*3+2, 0.45));
      }
      return;
    }

    // ── 特殊塔：大火山（持续灼烧AOE 180/s，魔法伤害，魔免无效，小火山增强版）
    if (cfg.effect === 'bigVolcanoAura') {
      const bigAoeR = cfg.aoeRange * _CS3;
      state.monsters.forEach(m => {
        if (m.dead || m.burnImmune) return;
        const dx = m.x - tx, dy = m.y - ty;
        if (Math.sqrt(dx*dx+dy*dy) <= bigAoeR) {
          m.burnTimer = Math.max(m.burnTimer || 0, 0.5);
          m.burnDmg   = Math.max(m.burnDmg   || 0, cfg.effectPower);
          m.burnSourceKey = key; // 统计来源交给 burnTick 统一处理，移除重复统计
        }
      });
      // 更猛烈的喷发粒子
      if (Math.random() < 0.5) {
        state.particles.push(new Particle(tx, ty - 8,
          (Math.random()-0.5)*70, -80 - Math.random()*50,
          Math.random() < 0.5 ? '#ff2200' : '#ff8800',
          Math.random()*4+3, 0.5));
      }
      return;
    }

    // ── 金币塔：被动产金
    if (cfg.effect === 'goldGen') {
      tower.cooldown -= dt * state.speedMult;
      if (tower.cooldown <= 0) {
        const amount = GOLD_GEN_AMOUNT[Math.min((tower.level || 1) - 1, GOLD_GEN_AMOUNT.length - 1)];
        spawnCoinDrop(tx, ty, amount);
        for (let i = 0; i < 6; i++) {
          state.particles.push(new Particle(tx, ty,
            (Math.random()-0.5)*60, (Math.random()-0.5)*60, '#ffd700', 3, 0.5));
        }
        tower.cooldown = 1 / cfg.rate;
      }
      return;
    }

    // 注：冰炎塔和冰霜塔光环已移除，减速改为命中时 applySlowLayer

    // Cooldown（攻速buff由buffMult控制）
    const effectiveRate = cfg.rate * (tower.buffMult || 1);
    if (tower.cooldown > 0) tower.cooldown -= dt * state.speedMult;
    if (tower.cooldown > 0) return;

    const rangeP = (cfg.range + (tower.rangeBonus || 0)) * _CS3;
    const lvl = tower.level || 1;

    // 获取范围内按路径进度排序的怪物列表
    const inRange = state.monsters.filter(m => {
      if (m.dead) return false;
      const dx = m.x - tx, dy = m.y - ty;
      return Math.sqrt(dx*dx+dy*dy) <= rangeP;
    }).sort((a, b) => b.pathIdx - a.pathIdx);

    if (inRange.length === 0) return;

    // ── 计算攻击力：光环加成（atkBuffMult）× 全局升级加成（globalAtkMult）独立乘区
    const atkMult = (tower.atkBuffMult || 1) * (state.globalAtkMult || 1);

    switch (cfg.effect) {

      // 烈焰塔：单体最靠前目标，高伤+灼烧
      case 'burn': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'burn', cfg.effectPower, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 雷霆塔（旧版）：单体攻击
      case 'thunderBuff': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'normal', 0, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 雷塔（新版）：单体高攻速攻击
      case 'thunderSingle': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'thunderSingle', 0, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 白精灵：攻击最近3个目标，群体低伤
      case 'whiteAoe': {
        const whiteTargets = inRange.slice(0, 3);
        whiteTargets.forEach(m => {
          state.projectiles.push(new Projectile(tx, ty, m, Math.round(cfg.dmg * atkMult), cfg.color, 'whiteAoe', 0, key));
        });
        if (whiteTargets.length > 0) tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 黑精灵：单体中伤+减甲
      case 'blackArmorBreak': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'blackArmorBreak', cfg.effectPower, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 绿精灵：单体低伤+持续毒素
      case 'poison': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'poison', cfg.effectPower, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 冰霜塔：双体攻击，命中施加减速3秒（强度按等级分级，无光环）
      case 'iceBuff': {
        const iceSlowFactor = ICE_SLOW_FACTOR[Math.min(lvl - 1, ICE_SLOW_FACTOR.length - 1)];
        const targets = inRange.slice(0, 2);
        targets.forEach(t => {
          state.projectiles.push(new Projectile(tx, ty, t, Math.round(cfg.dmg * atkMult), cfg.color, 'iceBuff', iceSlowFactor, key));
        });
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 锻炉：低伤单体（攻击力光环已在阶段2每帧持续施加，此处只处理攻击）
      case 'atkBuff': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'normal', 0, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 熔岩塔：技能波（不受攻击/攻速加成，固定冷却，伤害按等级查表）
      case 'lavaWave': {
        if (inRange.length > 0) {
          const lavaDebuff = LAVA_DEF_DEBUFF[Math.min(lvl - 1, LAVA_DEF_DEBUFF.length - 1)];
          const lavaDmg = LAVA_WAVE_DMG[Math.min(lvl - 1, LAVA_WAVE_DMG.length - 1)]; // 技能固定伤害
          inRange.forEach(m => {
            applyEffect(m, lavaDmg, 'lavaWave', lavaDebuff, tx, ty, key);
          });
          tower.cooldown = 1 / cfg.rate; // 固定冷却，不受 effectiveRate（攻速光环）影响
        }
        break;
      }

      // 三元素塔：攻击最靠前3个目标
      case 'tri': {
        const triTargets = inRange.slice(0, 3);
        const ep = TRI_GOLD_MULT[Math.min(lvl - 1, TRI_GOLD_MULT.length - 1)];
        triTargets.forEach(m => {
          state.projectiles.push(new Projectile(tx, ty, m, Math.round(cfg.dmg * atkMult), cfg.color, 'tri', ep, key));
        });
        if (triTargets.length > 0) tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 风雷塔：单体+30%概率闪电链
      case 'chainLightning': {
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, 'chainLightning', cfg.effectPower, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 冰炎塔：攻击最近2个目标，冰冻时间按等级分级
      case 'dualFrost': {
        // power 传减速系数，冰冻时间在 applyEffect 中通过 towerKey 查表
        const dfSlowFactor = ICE_SLOW_FACTOR[Math.min(lvl - 1, ICE_SLOW_FACTOR.length - 1)];
        // 按距离排序取最近2个
        const nearTargets = state.monsters.filter(m => {
          if (m.dead) return false;
          const dx = m.x - tx, dy = m.y - ty;
          return Math.sqrt(dx*dx+dy*dy) <= rangeP;
        }).sort((a, b) => {
          const da = Math.sqrt((a.x-tx)**2+(a.y-ty)**2);
          const db = Math.sqrt((b.x-tx)**2+(b.y-ty)**2);
          return da - db;
        }).slice(0, 2);
        nearTargets.forEach(m => {
          state.projectiles.push(new Projectile(tx, ty, m, Math.round(cfg.dmg * atkMult), cfg.color, 'dualFrost', dfSlowFactor, key));
        });
        if (nearTargets.length > 0) tower.cooldown = 1 / effectiveRate;
        break;
      }

      // 风暴塔：全屏随机目标，直接触发冰雹AOE（无子弹）
      case 'hailstorm': {
        const allMonsters = state.monsters.filter(m => !m.dead);
        if (allMonsters.length > 0) {
          const target = allMonsters[Math.floor(Math.random() * allMonsters.length)];
          applyEffect(target, Math.round(cfg.dmg * atkMult), 'hailstorm', cfg.effectPower, tx, ty, key);
          tower.cooldown = 1 / effectiveRate;
        }
        break;
      }

      default: {
        // 通用单体攻击
        const target = inRange[0];
        state.projectiles.push(new Projectile(tx, ty, target, Math.round(cfg.dmg * atkMult), cfg.color, cfg.effect, cfg.effectPower, key));
        tower.cooldown = 1 / effectiveRate;
        break;
      }
    }
  });
}

// ========== 主游戏循环 ==========
let lastTime = 0;
let animId = null;

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.1);
  lastTime = ts;

  // ── 暂停逻辑：跳过所有 update，但继续渲染画面（防黑屏）
  if (state.paused) {
    draw();
    animId = requestAnimationFrame(gameLoop);
    return;
  }

  state.tick += dt;

  if (state.phase === 'spawning') {
    // spawnTimer 随加速倍率同步缩短，使出怪速度与游戏倍速一致
    state.spawnTimer -= dt * state.speedMult;
    if (state.spawnTimer <= 0 && state.spawnQueue > 0) {
      const wCfg = WAVES[state.wave - 1];
      const isBossSpawn = wCfg.boss && state.spawnQueue === 1;
      state.monsters.push(new Monster(
        Math.round(wCfg.hp * (state.diffMult || 1)),  // 难度HP倍率
        wCfg.speed,
        wCfg.reward,
        isBossSpawn,
        wCfg.defense || 0,
        {
          burnImmune:     wCfg.burnImmune,
          slowImmune:     wCfg.slowImmune,
          chainImmune:    wCfg.chainImmune,
          frozenImmune:   wCfg.frozenImmune,
          isTreasure:     wCfg.isTreasure     || false,
          treasureReward: wCfg.treasureReward || 0,
        }
      ));
      state.spawnQueue--;
      const interval = wCfg.spawnInterval || 0.8;
      state.spawnTimer = interval;
    }

    // Update monsters
    state.monsters.forEach(m => { if (!m.dead) m.update(dt); });
    // Handle escaped
    state.monsters.filter(m => m.escaped).forEach(m => {
      if (!m._counted) {
        m._counted = true;
        // 爆炸粒子 + HUD闪烁
        for (let i = 0; i < 18; i++) {
          state.particles.push(new Particle(
            m.x, m.y,
            (Math.random()-0.5)*200, (Math.random()-0.5)*200,
            Math.random()>0.5?'#ff4444':'#ff8800',
            Math.random()*6+4, 0.7
          ));
        }
        const escapedEl = document.getElementById('escaped-display');
        if (escapedEl) {
          escapedEl.classList.remove('flash');
          void escapedEl.offsetWidth;
          escapedEl.classList.add('flash');
          setTimeout(() => escapedEl.classList.remove('flash'), 500);
        }
        if (!m.isTreasure) {
          state.escaped += m.boss ? 5 : 1;
          updateHUD();
          if (state.escaped >= 20) { endGame(false); return; }
        } else {
          // 宝箱怪到达终点不扣玩家血量，仅做视觉效果
          updateHUD();
        }
      }
    });
    state.monsters = state.monsters.filter(m => !m.dead);

    updateTowers(dt);

    state.projectiles.forEach(p => p.update(dt));
    state.projectiles = state.projectiles.filter(p => !p.dead);

    state.particles.forEach(p => p.update(dt));
    state.particles = state.particles.filter(p => p.life > 0);

    // Wave complete?
    if (state.spawnQueue === 0 && state.monsters.length === 0) {
      // 通关全部30波：最终胜利
      if (state.wave >= 30) {
        autoCollectCoins();
        autoCollectExpOrbs();
        // 判断是否无伤通关（0逃脱）
        endGame(true, state.escaped === 0);
        return;
      }
      // 自动拾取地图上所有掉落金币和经验球
      autoCollectCoins();
      autoCollectExpOrbs();
      // 波次奖励：固定 +100 金币
      const waveBonus = 100;
      state.gold += waveBonus;
      // 赠送抽卡券：按当波 drawReward 字段决定次数
      const wCfgDone = WAVES[state.wave - 1];
      const drawReward = (wCfgDone && wCfgDone.drawReward != null) ? wCfgDone.drawReward : 1;
      state.drawTickets = (state.drawTickets || 0) + drawReward;
      updateHUD();
      const drawRewardLabel = drawReward > 0 ? ` 🎴×${drawReward}` : '';
      spawnGoldPopup(`+${waveBonus}💰 波次奖励${drawRewardLabel}`);
      // 第10/20波结束时弹出商店
      if (state.wave === 10 || state.wave === 20) {
        setTimeout(() => openShopModal(), 600);
      }
      // 进入"等待抽卡"阶段：高亮主操作按钮，玩家抽卡放置一座塔后自动开启下一波
      state.phase = 'waiting-draw';
      state.drawRefreshCost = 100; // 每回合重置刷新价格
      updateRefreshBtn();
      showWaveTransitionWithSkip(`第 ${state.wave} 波清除！ +${waveBonus}💰${drawRewardLabel}`, drawReward > 0 ? '🎴 抽卡后可开始下一波' : '➡️ 可直接开始下一波');
      updateMainActionBtn();
    }
  } else if (state.phase === 'build') {
    // 地图4建造阶段：只停塔的攻击（updateTowers传0），所有视觉特效照常消耗直到自然结束
    updateTowers(dt); // build: pass real dt so effects decay;
    // 子弹/粒子
    state.projectiles.forEach(p => p.update(dt));
    state.projectiles = state.projectiles.filter(p => !p.dead);
    state.particles.forEach(p => p.update(dt));
    state.particles = state.particles.filter(p => p.life > 0);
    // 冰雹粒子（含落地AOE结算，怪物已清空所以不会新造伤害）
    hailParticles = hailParticles.filter(h => { h.life -= dt; return h.life > 0; });
    // 熔岩/冰霜/恐惧波圈
    lavaWaves = lavaWaves.filter(w => { w.life -= dt; return w.life > 0; });
    // 灵魂弧线
    state.soulArcs = (state.soulArcs || []).filter(a => { a.life -= dt; return a.life > 0; });
    // 核弹爆炸特效
    state.nukeEffects = (state.nukeEffects || []).filter(n => { n.life -= dt; return n.life > 0; });
    // 金币爆发粒子
    coinBursts = coinBursts.filter(burst => {
      burst.life -= dt;
      burst.coins.forEach(c => { c.x += c.vx*dt; c.y += c.vy*dt; c.vy += 220*dt; c.life -= dt; });
      burst.coins = burst.coins.filter(c => c.life > 0);
      return burst.life > 0;
    });
    // 雪王暴风雪（自然衰减，不新增）
    if (state.snowstorms) {
      state.snowstorms = state.snowstorms.filter(s => { s.life -= dt; return s.life > 0; });
    }
    // DOM金币：build阶段允许玩家手动拾取，不强制回收
  } else if (state.phase === 'transition') {
    // 仅用于游戏初始启动（waveTimer极短=0.1s），倒计时后立刻开波
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      startWave();
    }
    // 过渡阶段继续更新塔/粒子/抛射物，画面保持活跃
    updateTowers(dt);
    state.projectiles.forEach(p => p.update(dt));
    state.projectiles = state.projectiles.filter(p => !p.dead);
    state.particles.forEach(p => p.update(dt));
    state.particles = state.particles.filter(p => p.life > 0);
  } else if (state.phase === 'waiting-draw') {
    // 等待玩家抽卡放置：塔/粒子/抛射物继续更新，画面保持活跃
    updateTowers(dt);
    state.projectiles.forEach(p => p.update(dt));
    state.projectiles = state.projectiles.filter(p => !p.dead);
    state.particles.forEach(p => p.update(dt));
    state.particles = state.particles.filter(p => p.life > 0);
  }

  // Draw
  draw();
  animId = requestAnimationFrame(gameLoop);
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawMap();

  // Draw towers
  Object.entries(state.towers).forEach(([key, tower]) => {
    const [r, c] = key.split(',').map(Number);
    drawTower(tower, r, c, key);
  });

  // Draw projectiles
  state.projectiles.forEach(p => p.draw(ctx));

  // Draw monsters
  state.monsters.forEach(m => { if (!m.dead) drawMonster(m); });

  // Draw particles
  state.particles.forEach(p => p.draw(ctx));

  // ── 熔岩波形
  lavaWaves.forEach(w => {
    const alpha = (w.life / w.maxLife) * 0.55;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220,80,20,${alpha})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  });

  // ── 核弹爆炸特效（蘑菇云：大球形云帽 + 细腰茎柱 + 底部火焰裙）
  (state.nukeEffects || []).forEach(n => {
    const prog = 1 - n.life / n.maxLife;  // 0→1（动画进度）
    // fadeOut：前70%全亮，后30%渐出
    const fadeOut = prog < 0.7 ? 1 : Math.max(0, 1 - (prog - 0.7) / 0.3);
    ctx.save();

    // ── 0. 爆炸瞬间白色全屏闪光（0~0.08）
    if (prog < 0.08) {
      const flashA = Math.pow(1 - prog / 0.08, 2) * 0.95;
      ctx.globalAlpha = flashA;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.globalAlpha = 1;
    }

    // ─────────────────────────────────────────────────────
    // 真实蘑菇云比例参考：
    //   总高度 ≈ nukeR * 1.8
    //   云帽圆半径 ≈ nukeR * 0.68（大圆球，占总高约75%）
    //   茎柱高度 ≈ nukeR * 1.1，底宽 nukeR*0.2，顶宽 nukeR*0.08（细腰）
    //   底部火焰裙横向半径 ≈ nukeR * 0.65，极扁
    // ─────────────────────────────────────────────────────

    // ── 1. 底部地面火焰裙（0~0.65，极扁椭圆向外扩散，橙黄→红→暗红）
    {
      const fProg = Math.min(1, prog / 0.50);
      const fireA = fadeOut * Math.max(0, 1 - Math.max(0, fProg - 0.55) / 0.45);
      if (fireA > 0.01) {
        const fireRX = n.r * (0.08 + fProg * 0.62);  // 横向扩散
        const fireRY = n.r * (0.06 + fProg * 0.18);  // 纵向较扁
        // 层1：最内白热核
        const g0 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, fireRX * 0.35);
        g0.addColorStop(0, `rgba(255,255,220,${fireA})`);
        g0.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.fillStyle = g0;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, fireRX * 0.35, fireRY * 0.35, 0, 0, Math.PI*2); ctx.fill();
        // 层2：橙黄色火焰主体
        const g1 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, fireRX);
        g1.addColorStop(0,   `rgba(255,200,50,${fireA * 0.95})`);
        g1.addColorStop(0.35,`rgba(255,120,10,${fireA * 0.85})`);
        g1.addColorStop(0.65,`rgba(220,50,5,${fireA * 0.7})`);
        g1.addColorStop(0.85,`rgba(140,20,0,${fireA * 0.45})`);
        g1.addColorStop(1,   'rgba(60,0,0,0)');
        ctx.fillStyle = g1;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, fireRX, fireRY, 0, 0, Math.PI*2); ctx.fill();
        // 层3：外缘暗红烟尘（稍大）
        const g2 = ctx.createRadialGradient(n.x, n.y, fireRX * 0.5, n.x, n.y, fireRX * 1.3);
        g2.addColorStop(0, `rgba(100,20,0,${fireA * 0.35})`);
        g2.addColorStop(1, 'rgba(40,5,0,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, fireRX * 1.3, fireRY * 1.2, 0, 0, Math.PI*2); ctx.fill();
      }
    }

    // ── 2. 茎柱（0.10~结束，细腰形，底宽顶细，浓烈橙褐色）
    if (prog > 0.10) {
      const stemProg = Math.min(1, (prog - 0.10) / 0.36);
      // 云帽底边（与第3步公式完全同步，防止茎戳穿云帽）
      // capCY = n.y - n.r*(0.28 + capProg*0.78)，capRY = n.r*(0.10 + capProg*0.38)
      // capBottom = capCY + capRY = n.y - n.r*(0.18 + capProg*0.40)
      const capProgForStem = Math.min(1, Math.max(0, (prog - 0.18) / 0.42));
      const capBottomY = n.y - n.r * (0.18 + capProgForStem * 0.40);  // 云帽底边Y
      // 茎顶自然上升值（用于动画过渡）
      const stemTopRaw = n.y - n.r * (0.20 + stemProg * 0.55);
      // 钳制：茎顶不能高于云帽底边（Y值不能小于capBottomY）
      const stemBottom = n.y;                              // 地面
      const stemTop    = Math.max(stemTopRaw, capBottomY); // 钳制到云帽底边
      const stemH      = stemBottom - stemTop;
      const wBot = n.r * 0.20;   // 底宽
      const wMid = n.r * 0.07;   // 腰部（最细处，约在1/3高）
      const wTop = n.r * 0.13;   // 顶宽（连接云帽，略微展开）
      const stemA = fadeOut * Math.min(1, stemProg * 3);

      // 贝塞尔细腰茎（左右各一段）
      const sg = ctx.createLinearGradient(n.x, stemBottom, n.x, stemTop);
      sg.addColorStop(0,    `rgba(230,100,15,${stemA})`);
      sg.addColorStop(0.25, `rgba(180,70,12,${stemA * 0.92})`);
      sg.addColorStop(0.55, `rgba(110,50,18,${stemA * 0.82})`);
      sg.addColorStop(0.80, `rgba(75,38,16,${stemA * 0.7})`);
      sg.addColorStop(1,    `rgba(55,30,14,${stemA * 0.55})`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      const sy1 = stemTop + stemH * 0.30;   // 腰最细处Y
      // 左侧轮廓
      ctx.moveTo(n.x - wBot, stemBottom);
      ctx.bezierCurveTo(n.x - wBot * 0.6, stemBottom - stemH * 0.18,
                        n.x - wMid,        sy1,
                        n.x - wTop,        stemTop);
      // 顶端
      ctx.lineTo(n.x + wTop, stemTop);
      // 右侧轮廓（对称）
      ctx.bezierCurveTo(n.x + wMid,        sy1,
                        n.x + wBot * 0.6,  stemBottom - stemH * 0.18,
                        n.x + wBot,        stemBottom);
      ctx.closePath(); ctx.fill();

      // 茎侧面高光（让茎有圆柱体积感）
      const shL = ctx.createLinearGradient(n.x - wBot, 0, n.x + wBot, 0);
      shL.addColorStop(0,    `rgba(20,8,0,${stemA * 0.5})`);
      shL.addColorStop(0.28, `rgba(255,160,40,${stemA * 0.22})`);
      shL.addColorStop(0.50, `rgba(255,220,100,${stemA * 0.12})`);
      shL.addColorStop(0.72, `rgba(255,160,40,${stemA * 0.22})`);
      shL.addColorStop(1,    `rgba(20,8,0,${stemA * 0.5})`);
      ctx.fillStyle = shL;
      ctx.beginPath();
      ctx.moveTo(n.x - wBot, stemBottom);
      ctx.bezierCurveTo(n.x - wBot * 0.6, stemBottom - stemH * 0.18, n.x - wMid, sy1, n.x - wTop, stemTop);
      ctx.lineTo(n.x + wTop, stemTop);
      ctx.bezierCurveTo(n.x + wMid, sy1, n.x + wBot * 0.6, stemBottom - stemH * 0.18, n.x + wBot, stemBottom);
      ctx.closePath(); ctx.fill();
    }

    // ── 3. 蘑菇云帽（0.18~结束）
    // 形状：横向宽扁椭圆体（宽高比约 1.9:1），不是圆球
    // 顶部被压平，周边有凹凸鼓包沿椭圆弧排布
    if (prog > 0.18) {
      const capProg = Math.min(1, (prog - 0.18) / 0.42);
      // 云帽中心（随时间平缓上升，最终高度 ~1.0R）
      const capCY = n.y - n.r * (0.28 + capProg * 0.78);
      // 横轴（宽）/ 纵轴（矮），宽高比约 1.85
      const capRX = n.r * (0.20 + capProg * 0.72);   // 横半径（宽）
      const capRY = n.r * (0.10 + capProg * 0.38);   // 纵半径（矮），约是横的55%
      const capA  = fadeOut * Math.min(1, capProg * 2.2);

      if (capA > 0.01) {
        // ── 3a. 底部暗影（压扁椭圆，增加厚度感）
        // 在主体之前绘制，沉在最底层
        const shadowG = ctx.createRadialGradient(
          n.x, capCY + capRY * 0.55, 0,
          n.x, capCY + capRY * 0.20, capRX * 1.1
        );
        shadowG.addColorStop(0,   `rgba(20,5,0,${capA * 0.70})`);
        shadowG.addColorStop(0.50,`rgba(40,10,0,${capA * 0.38})`);
        shadowG.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = shadowG;
        ctx.beginPath();
        ctx.ellipse(n.x, capCY + capRY * 0.25, capRX * 1.1, capRY * 0.65, 0, 0, Math.PI*2);
        ctx.fill();

        // ── 3b. 主扁椭圆体（偏心渐变，亮核偏左上）
        // 使用 ctx.scale 把 arc 压扁成椭圆，配合径向渐变
        const scaleY = capRY / capRX;   // 纵向压缩比
        ctx.save();
        ctx.translate(n.x, capCY);
        ctx.scale(1, scaleY);           // Y轴压扁
        const mainG = ctx.createRadialGradient(
          -capRX * 0.26, -capRX * 0.28, capRX * 0.03,  // 内核亮点（压扁坐标系内）
           0, 0, capRX
        );
        mainG.addColorStop(0,    `rgba(255,235,110,${capA})`);
        mainG.addColorStop(0.10, `rgba(255,185,45,${capA * 0.98})`);
        mainG.addColorStop(0.25, `rgba(250,110,18,${capA * 0.95})`);
        mainG.addColorStop(0.44, `rgba(220,62,8,${capA * 0.90})`);
        mainG.addColorStop(0.62, `rgba(170,35,5,${capA * 0.82})`);
        mainG.addColorStop(0.80, `rgba(110,18,3,${capA * 0.62})`);
        mainG.addColorStop(0.92, `rgba(60,10,1,${capA * 0.38})`);
        mainG.addColorStop(1,    'rgba(20,3,0,0)');
        ctx.fillStyle = mainG;
        ctx.beginPath(); ctx.arc(0, 0, capRX, 0, Math.PI*2); ctx.fill();
        ctx.restore();  // 恢复 scale

        // ── 3c. 沿椭圆弧排布的凹凸鼓包（上半弧为主，模拟真实蘑菇云边缘团状）
        // 每个鼓包用角度定位，沿椭圆外缘分布，半径比主体稍大
        // [角度(deg), 鼓包r/capRX, 亮度0-1, 向外偏移比]
        const bumpDefs = [
          [-90,  0.34, 0.92, 0.72],  // 正顶（最大最亮）
          [-135, 0.28, 0.78, 0.68],  // 左上45°
          [-45,  0.27, 0.74, 0.68],  // 右上45°
          [-160, 0.22, 0.60, 0.62],  // 左上70°
          [-20,  0.21, 0.57, 0.62],  // 右上70°
          [ 170, 0.18, 0.42, 0.55],  // 左侧略下
          [  10, 0.17, 0.40, 0.55],  // 右侧略下
          [-112, 0.20, 0.70, 0.65],  // 左上中间
          [-68,  0.19, 0.67, 0.65],  // 右上中间
          [-90,  0.15, 0.85, 0.38],  // 顶部内层小包
        ];
        bumpDefs.forEach(([angleDeg, bdr, bright, outOff]) => {
          const rad = angleDeg * Math.PI / 180;
          // 椭圆弧上的坐标（内切点）
          const ex = n.x + capRX * outOff * Math.cos(rad);
          const ey = capCY + capRY * outOff * Math.sin(rad);
          const bR = bdr * capRX;
          // 偏心渐变（亮核偏向圆心方向）
          const inX = ex + bR * 0.28 * (-Math.cos(rad));
          const inY = ey + bR * 0.28 * (-Math.sin(rad));
          const bg = ctx.createRadialGradient(inX, inY, 0, ex, ey, bR);
          bg.addColorStop(0,    `rgba(255,${Math.min(255,Math.round(195*bright+60))},${Math.min(255,Math.round(55*bright+5))},${capA * 0.90})`);
          bg.addColorStop(0.28, `rgba(248,${Math.min(255,Math.round(115*bright+18))},${Math.round(12*bright)},${capA * 0.78})`);
          bg.addColorStop(0.55, `rgba(195,${Math.min(255,Math.round(48*bright+5))},4,${capA * 0.60})`);
          bg.addColorStop(0.80, `rgba(120,${Math.round(18*bright)},2,${capA * 0.38})`);
          bg.addColorStop(1,    'rgba(40,5,0,0)');
          ctx.fillStyle = bg;
          ctx.beginPath(); ctx.arc(ex, ey, bR, 0, Math.PI*2); ctx.fill();
        });

        // ── 3d. 云帽底裙（扁环，连接茎柱顶部，呈蘑菇"伞缘"）
        const skirtRX = capRX * 1.12;
        const skirtRY = capRY * 0.32;
        const skirtCY = capCY + capRY * 0.52;
        const skirtA  = capA * Math.min(1, capProg * 2.2);
        // 分内外两层：内层橙红，外层暗红消散
        const skG1 = ctx.createRadialGradient(n.x, skirtCY, capRX * 0.12, n.x, skirtCY, skirtRX);
        skG1.addColorStop(0.0,  `rgba(200,70,8,0)`);         // 中心洞（茎柱区透明）
        skG1.addColorStop(0.22, `rgba(235,95,12,${skirtA * 0.65})`);
        skG1.addColorStop(0.55, `rgba(180,48,6,${skirtA * 0.48})`);
        skG1.addColorStop(0.80, `rgba(100,22,2,${skirtA * 0.25})`);
        skG1.addColorStop(1,    'rgba(40,8,0,0)');
        ctx.fillStyle = skG1;
        ctx.beginPath(); ctx.ellipse(n.x, skirtCY, skirtRX, skirtRY, 0, 0, Math.PI*2); ctx.fill();

        // ── 3e. 顶面高光（模拟光源从右上照射，扁椭圆形高光斑）
        const hlX = n.x + capRX * 0.22;
        const hlY = capCY - capRY * 0.45;
        const hlRX = capRX * 0.42;
        const hlRY = capRY * 0.30;
        const hlG = ctx.createRadialGradient(hlX - hlRX*0.2, hlY - hlRY*0.2, 0, hlX, hlY, hlRX);
        hlG.addColorStop(0,   `rgba(255,255,215,${capA * 0.52})`);
        hlG.addColorStop(0.40,`rgba(255,205,85,${capA * 0.22})`);
        hlG.addColorStop(0.75,`rgba(255,130,25,${capA * 0.08})`);
        hlG.addColorStop(1,   'rgba(200,80,10,0)');
        ctx.fillStyle = hlG;
        ctx.beginPath(); ctx.ellipse(hlX, hlY, hlRX, hlRY, 0, 0, Math.PI*2); ctx.fill();
      }
    }

    // ── 4. 冲击波（3圈，橙红色，0~0.55快速向外扩散）
    for (let wi = 0; wi < 3; wi++) {
      const wDelay = wi * 0.06;
      const wProg  = Math.min(1, Math.max(0, (prog - wDelay) / 0.55));
      if (wProg <= 0) continue;
      const wR = n.r * wProg;
      const wA = Math.pow(1 - wProg, 1.6) * fadeOut * (1 - wi * 0.25);
      if (wA < 0.01) continue;
      ctx.strokeStyle = `rgba(255,${Math.round(200 - wi*50)},${Math.round(60 - wi*15)},${wA.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, (5 - wi * 1.2) * (1 - wProg * 0.5));
      ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 16 - wi*4;
      ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(2, wR), 0, Math.PI*2); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // ── 5. 最外缘白色冲击波
    {
      const rProg = Math.min(1, prog / 0.38);
      const rA = Math.pow(1 - rProg, 1.8) * fadeOut * 0.80;
      if (rA > 0.01) {
        ctx.strokeStyle = `rgba(255,255,200,${rA.toFixed(3)})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffffaa'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * rProg, 0, Math.PI*2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  });

  // ── 冰雹视觉（增强版）
  hailParticles.forEach(h => {
    ctx.save();
    if (!h.exploded) {
      // ── 下落阶段 ──
      const fallProgress = Math.max(0, 1 - (h.y - h.startY || 0) / (h.targetY - (h.startY || h.y - 120)));
      // 拖尾（3个淡出点）
      const trailLen = 3;
      for (let i = 1; i <= trailLen; i++) {
        const fy = h.y - i * h.vy * 0.016 * (-1); // 向上偏移
        const ta = (1 - i / (trailLen + 1)) * 0.4;
        ctx.globalAlpha = ta;
        ctx.fillStyle = '#aaddff';
        ctx.beginPath(); ctx.arc(h.x, h.y - i * 9, 5 - i, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 冰晶外辉光
      const hg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 11);
      hg.addColorStop(0, 'rgba(255,255,255,0.95)');
      hg.addColorStop(0.4, 'rgba(160,225,255,0.85)');
      hg.addColorStop(1, 'rgba(80,180,255,0)');
      ctx.fillStyle = hg;
      ctx.shadowColor = '#aaeeff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(h.x, h.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // 冰晶六芒星
      ctx.save(); ctx.translate(h.x, h.y);
      ctx.strokeStyle = 'rgba(200,240,255,0.8)'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.stroke();
      }
      ctx.restore();
    } else {
      // ── 爆炸阶段 ──
      const lifeRatio = h.life / (h.maxLife || 0.7);
      const expandR = h.aoeR * (1 - lifeRatio) + h.aoeR * 0.15;

      // 冻结地面光晕（填充）
      const groundGrad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.aoeR);
      groundGrad.addColorStop(0, `rgba(180,235,255,${lifeRatio * 0.25})`);
      groundGrad.addColorStop(1, 'rgba(100,180,255,0)');
      ctx.fillStyle = groundGrad;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.aoeR, 0, Math.PI * 2); ctx.fill();

      // 外扩主冲击圈（蓝色）
      ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 14;
      ctx.strokeStyle = `rgba(140,210,255,${lifeRatio * 0.85})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(h.x, h.y, expandR, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      // 内圈亮白（略小）
      ctx.strokeStyle = `rgba(220,245,255,${lifeRatio * 0.6})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(h.x, h.y, expandR * 0.55, 0, Math.PI * 2); ctx.stroke();

      // 冰碎片射线（8条）
      if (lifeRatio > 0.5) {
        const fragAlpha = (lifeRatio - 0.5) / 0.5;
        ctx.save(); ctx.translate(h.x, h.y);
        ctx.strokeStyle = `rgba(200,240,255,${fragAlpha * 0.7})`;
        ctx.lineWidth = 1;
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          const r1 = h.aoeR * 0.2, r2 = h.aoeR * (0.5 + (1 - lifeRatio) * 0.5);
          ctx.beginPath(); ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1);
          ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2); ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  });

  // ── 闪电链视觉（增强：多层辉光+折线抖动+分叉）
  lightningArcs.forEach(arc => {
    if (!arc.points || arc.points.length < 2) return;
    const lifeRatio = Math.min(1, arc.life / (arc.maxLife || 0.22));
    const alpha = lifeRatio;
    const baseColor = arc.color || '#cc88ff';

    // ── 辅助：在两点间生成多段折线（细分+抖动）
    function buildLightningPath(x1, y1, x2, y2, jitter, segs) {
      const pts = [];
      for (let s = 0; s <= segs; s++) {
        const t2 = s / segs;
        const bx = x1 + (x2 - x1) * t2;
        const by = y1 + (y2 - y1) * t2;
        const perp = { x: -(y2 - y1), y: (x2 - x1) };
        const pLen = Math.sqrt(perp.x*perp.x + perp.y*perp.y) || 1;
        const j = s > 0 && s < segs ? (Math.random()-0.5) * jitter : 0;
        pts.push({ x: bx + perp.x/pLen*j, y: by + perp.y/pLen*j });
      }
      return pts;
    }

    // 逐段绘制（链上每两个相邻点之间为一段）
    for (let seg = 0; seg < arc.points.length - 1; seg++) {
      const p0 = arc.points[seg];
      const p1 = arc.points[seg + 1];
      const segAlpha = alpha * (1.0 - seg * 0.25); // 跳链衰减
      const isJelly = arc.isJelly; // 水母叉状闪电标记
      const jitter = isJelly ? 18 : 14;
      const segs = isJelly ? 10 : 8;
      const mainWidth = isJelly ? 3.0 - seg * 0.5 : 2.5 - seg * 0.4;

      const pts = buildLightningPath(p0.x, p0.y, p1.x, p1.y, jitter, segs);

      ctx.save();

      // 层1：宽外辉光（蓝/紫）
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = baseColor.startsWith('#')
        ? hexToRgba(baseColor, segAlpha * 0.35)
        : `rgba(160,120,255,${segAlpha * 0.35})`;
      ctx.lineWidth = (mainWidth + 4) * Math.max(0.2, segAlpha);
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 14;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 层2：中间辉光（亮白）
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = `rgba(220,200,255,${segAlpha * 0.70})`;
      ctx.lineWidth = mainWidth * Math.max(0.2, segAlpha);
      ctx.stroke();

      // 层3：白芯（最亮最细）
      const rebulidPts = buildLightningPath(p0.x, p0.y, p1.x, p1.y, jitter * 0.5, segs);
      ctx.beginPath();
      ctx.moveTo(rebulidPts[0].x, rebulidPts[0].y);
      for (let k = 1; k < rebulidPts.length; k++) ctx.lineTo(rebulidPts[k].x, rebulidPts[k].y);
      ctx.strokeStyle = `rgba(255,255,255,${segAlpha * 0.90})`;
      ctx.lineWidth = Math.max(0.5, (mainWidth - 1) * segAlpha);
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 叉状分支（水母塔 或 第一段有10%概率出现）
      if ((isJelly && seg === 0) || (!isJelly && seg === 0 && Math.random() < 0.4)) {
        const forkCount = isJelly ? 2 : 1;
        for (let f = 0; f < forkCount; f++) {
          // 分叉起点：主链中间某个点
          const fi = Math.floor(pts.length * (0.3 + Math.random() * 0.4));
          const fp0 = pts[fi];
          const len = 20 + Math.random() * 25;
          const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) + (Math.random()-0.5) * 1.2;
          const fp1 = { x: fp0.x + Math.cos(angle)*len, y: fp0.y + Math.sin(angle)*len };
          const fPts = buildLightningPath(fp0.x, fp0.y, fp1.x, fp1.y, 8, 5);
          const fAlpha = segAlpha * 0.5;

          ctx.beginPath();
          ctx.moveTo(fPts[0].x, fPts[0].y);
          for (let k = 1; k < fPts.length; k++) ctx.lineTo(fPts[k].x, fPts[k].y);
          ctx.strokeStyle = `rgba(180,160,255,${fAlpha * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // 分叉白芯
          ctx.beginPath();
          ctx.moveTo(fPts[0].x, fPts[0].y);
          for (let k = 1; k < fPts.length; k++) ctx.lineTo(fPts[k].x, fPts[k].y);
          ctx.strokeStyle = `rgba(255,255,255,${fAlpha * 0.8})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // ── 节点光球（每个跳链目标点）
      if (seg > 0) {
        ctx.beginPath(); ctx.arc(p0.x, p0.y, 4 * segAlpha, 0, Math.PI*2);
        ctx.fillStyle = `rgba(220,200,255,${segAlpha * 0.8})`;
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // 终点节点
    const last = arc.points[arc.points.length - 1];
    ctx.save();
    ctx.beginPath(); ctx.arc(last.x, last.y, 5 * alpha, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
    ctx.shadowColor = baseColor; ctx.shadowBlur = 12;
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.restore();
  });

  // ── 特殊配方满足高亮（脉冲彩色边框）
  specialHighlightKeys.forEach(key => {
    const [row, col] = key.split(',').map(Number);
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
    ctx.save();
    ctx.strokeStyle = `rgba(255,220,50,${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffdd22';
    ctx.shadowBlur = 10 + pulse * 8;
    ctx.strokeRect(col*CELL+2, row*CELL+2, CELL-4, CELL-4);
    ctx.restore();
  });

  // ── 冰霜波：蓝色扩散圈（复用 lavaWaves 数组，isFrost 标记）
  lavaWaves.forEach(w => {
    if (!w.isFrost) return;
    const alpha = (w.life / w.maxLife) * 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,220,255,${alpha})`;
    ctx.lineWidth = 5;
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
  });

  // ── 天帝爆炸圈：金色扩散圈（isGold 标记）
  lavaWaves.forEach(w => {
    if (!w.isGold) return;
    const alpha = (w.life / w.maxLife) * 0.85;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 16;
    ctx.stroke();
    // 内圈白色
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r * 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  // ── 恐惧波：紫色扩散圈（isFear 标记）
  lavaWaves.forEach(w => {
    if (!w.isFear) return;
    const alpha = (w.life / w.maxLife) * 0.75;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,50,255,${alpha})`;
    ctx.lineWidth = 5;
    ctx.shadowColor = '#9900ff';
    ctx.shadowBlur = 18;
    ctx.stroke();
    // 内圈深紫
    ctx.beginPath();
    ctx.arc(w.cx, w.cy, Math.max(1, w.r * 0.65), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80,0,120,${alpha * 0.6})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  // ── 暴风雪冰雹粒子渲染
  if (state.snowstorms) {
    state.snowstorms.forEach(s => {
      if (!s.hails) return;
      // 绘制暴风雪区域底部圆形冰霜光晕
      const snowFade = Math.min(s.life / s.maxLife, 1);
      ctx.save();
      const snowAreaG = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      snowAreaG.addColorStop(0, `rgba(150,220,255,${0.18 * snowFade})`);
      snowAreaG.addColorStop(0.6, `rgba(80,180,255,${0.10 * snowFade})`);
      snowAreaG.addColorStop(1, 'rgba(0,120,200,0)');
      ctx.fillStyle = snowAreaG;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      s.hails.forEach(h => {
        const lifeRatio = Math.max(0, h.life / h.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.min(lifeRatio * 1.5, 1);
        if (!h.hit) {
          // 下落中：绘制粗冰雹椭圆（拉长效果体现速度）
          const speed = h.vy;
          const stretch = Math.min(speed / 80, 3);
          ctx.save();
          ctx.translate(h.x, h.y);
          // 外层发光
          ctx.shadowColor = '#aaddff'; ctx.shadowBlur = 6;
          // 冰雹主体（渐变圆/椭圆）
          const hg = ctx.createRadialGradient(0, -h.size*0.3, 0, 0, 0, h.size);
          hg.addColorStop(0, '#ffffff');
          hg.addColorStop(0.3, '#cceeff');
          hg.addColorStop(0.7, '#88bbdd');
          hg.addColorStop(1, 'rgba(40,100,160,0)');
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.ellipse(0, 0, h.size * 0.7, h.size * stretch, 0, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          // 速度尾迹（细线）
          ctx.strokeStyle = `rgba(180,230,255,${lifeRatio * 0.5})`;
          ctx.lineWidth = h.size * 0.4;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h.size * stretch * 2); ctx.stroke();
          ctx.restore();
        } else {
          // 砸地：绽放碎冰效果（小放射线）
          const hitRatio = Math.max(0, h.hitTimer / 0.12);
          const splashR = h.size * (2 + (1 - hitRatio) * 3);
          ctx.save(); ctx.translate(h.x, h.y);
          ctx.globalAlpha = hitRatio * 0.8;
          for (let si2 = 0; si2 < 6; si2++) {
            const sa = si2 * Math.PI / 3 + (1 - hitRatio) * 0.5;
            ctx.strokeStyle = si2 % 2 === 0 ? '#aaddff' : '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(sa) * splashR, Math.sin(sa) * splashR * 0.5);
            ctx.stroke();
          }
          // 碎冰中心
          const sg2 = ctx.createRadialGradient(0, 0, 0, 0, 0, h.size * 1.5);
          sg2.addColorStop(0, `rgba(255,255,255,${hitRatio})`);
          sg2.addColorStop(1, 'rgba(100,180,255,0)');
          ctx.fillStyle = sg2;
          ctx.beginPath(); ctx.arc(0, 0, h.size * 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      });
    });
  }

  // ── 灵魂抽取弧线动画（影魔：紫色；阎王：红黑色）
  (state.soulArcs || []).forEach(arc => {
    const t = 1 - arc.life / arc.maxLife; // 0→1 表示进度
    const alpha = Math.min(arc.life / arc.maxLife * 2.5, 1);
    // 曲线终点随时间推进：插值贝塞尔
    const cx1 = arc.fromX + (arc.toX - arc.fromX) * 0.25 - 30;
    const cy1 = arc.fromY + (arc.toY - arc.fromY) * 0.25 - 40;
    const cx2 = arc.fromX + (arc.toX - arc.fromX) * 0.75 + 30;
    const cy2 = arc.fromY + (arc.toY - arc.fromY) * 0.75 - 40;
    // 沿贝塞尔曲线采样多个点，绘到当前 t 位置
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = arc.isYanluo ? 2.5 : 2;
    ctx.shadowColor = arc.color;
    ctx.shadowBlur = arc.isYanluo ? 10 : 8;
    ctx.setLineDash([]);
    ctx.beginPath();
    const steps = 20;
    for (let i = 0; i <= Math.floor(t * steps); i++) {
      const u = i / steps;
      const bx = Math.pow(1-u,3)*arc.fromX + 3*Math.pow(1-u,2)*u*cx1 + 3*(1-u)*u*u*cx2 + Math.pow(u,3)*arc.toX;
      const by = Math.pow(1-u,3)*arc.fromY + 3*Math.pow(1-u,2)*u*cy1 + 3*(1-u)*u*u*cy2 + Math.pow(u,3)*arc.toY;
      if (i === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // ── 爆金币/爆经验球特效：弧线轨迹粒子
  coinBursts.forEach(burst => {
    const isExp = burst.isExp === true;
    burst.coins.forEach(c => {
      const lifeRatio = Math.max(0, c.life / (c.maxLife || 0.6));
      const alpha = lifeRatio;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (isExp) {
        // 经验球粒子（绿色渐变）
        const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
        cg.addColorStop(0, '#ffffff');
        cg.addColorStop(0.4, '#4ade80');
        cg.addColorStop(1, 'rgba(22,163,74,0)');
        ctx.fillStyle = cg;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
      } else {
        // 金币圆形粒子（金黄渐变）
        const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
        cg.addColorStop(0, '#ffffff');
        cg.addColorStop(0.4, '#ffe44a');
        cg.addColorStop(1, 'rgba(200,140,0,0)');
        ctx.fillStyle = cg;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
      }
      ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      // 小高光
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
      ctx.beginPath(); ctx.arc(c.x - c.size*0.25, c.y - c.size*0.25, c.size*0.3, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
    // 爆发中心光晕（仅前0.15秒）
    const burstMaxLife = isExp ? 0.5 : 0.65;
    const burstRatio = burst.life / burstMaxLife;
    if (burstRatio > 0.75) {
      const flashAlpha = (burstRatio - 0.75) / 0.25;
      ctx.save();
      ctx.globalAlpha = flashAlpha * 0.6;
      const bg = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, 18);
      if (isExp) {
        bg.addColorStop(0, '#aaffcc'); bg.addColorStop(1, 'rgba(34,197,94,0)');
      } else {
        bg.addColorStop(0, '#fffaaa'); bg.addColorStop(1, 'rgba(255,200,0,0)');
      }
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(burst.x, burst.y, 18, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });

  // Draw upgrade highlights (升级模式：高亮可/不可吞噬的塔)
  const _DCS = CELL;
  if (state.upgradingTower) {
    const from = state.towers[state.upgradingTower];
    if (from) {
      Object.entries(state.towers).forEach(([key, tower]) => {
        if (key === state.upgradingTower) return;
        const [row, col] = key.split(',').map(Number);
        const tx = col * _DCS, ty = row * _DCS;
        const canEat = tower.cfg.effect === from.cfg.effect && tower.level === from.level;
        ctx.fillStyle = canEat ? 'rgba(80,255,80,0.38)' : 'rgba(255,40,40,0.28)';
        ctx.fillRect(tx, ty, _DCS, _DCS);
        ctx.strokeStyle = canEat ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx+1, ty+1, _DCS-2, _DCS-2);
      });
    }
  }

  // ── 光环塔高亮：选中光环系塔时，高亮范围内友方塔
  if (state.selectedTowerKey && !state.upgradingTower) {
    const selTower = state.towers[state.selectedTowerKey];
    const AURA_EFFECTS = ['thunderBuff', 'atkBuff', 'scopeAura', 'gunnerAura', 'sniperAura'];
    if (selTower && AURA_EFFECTS.includes(selTower.cfg.effect)) {
      const [sr, sc] = state.selectedTowerKey.split(',').map(Number);
      const stx = sc*_DCS+_DCS/2, sty = sr*_DCS+_DCS/2;
      const auraR = selTower.cfg.aoeRange * _DCS;
      Object.entries(state.towers).forEach(([key, tower]) => {
        if (key === state.selectedTowerKey) return;
        const [row, col] = key.split(',').map(Number);
        const dx = col*_DCS+_DCS/2 - stx, dy = row*_DCS+_DCS/2 - sty;
        if (Math.sqrt(dx*dx+dy*dy) <= auraR) {
          ctx.save();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.strokeRect(col*_DCS+2, row*_DCS+2, _DCS-4, _DCS-4);
          ctx.restore();
        }
      });
    }
  }

  // Draw placing preview
  if (state.placingTower && state.hoverCell) {
    const [r, c] = state.hoverCell;
    const key = `${r},${c}`;
    const isBlocked = PATH_SET.has(key) || !!state.towers[key];
    if (!isBlocked) {
      const cx = c*_DCS+_DCS/2, cy = r*_DCS+_DCS/2;
      const cfg = state.placingTower.cfg;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.arc(cx, cy, cfg.range*_DCS, 0, Math.PI*2);
      ctx.fillStyle = cfg.color + '22';
      ctx.fill();
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4,4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = cfg.color;
      ctx.globalAlpha = 0.8;
      ctx.fillText(cfg.icon, cx, cy);
      ctx.globalAlpha = 1;
    }
  }


  // ── 核弹选点预览圈
  if (state.nukingMode && state.nukeMousePos) {
    const { x: mx, y: my } = state.nukeMousePos;
    const previewR = 3 * CELL;
    ctx.save();
    // 红色半透明填充
    const nukeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, previewR);
    nukeGrad.addColorStop(0,   'rgba(255,40,0,0.18)');
    nukeGrad.addColorStop(0.7, 'rgba(255,80,0,0.12)');
    nukeGrad.addColorStop(1,   'rgba(255,0,0,0)');
    ctx.fillStyle = nukeGrad;
    ctx.beginPath(); ctx.arc(mx, my, previewR, 0, Math.PI * 2); ctx.fill();
    // 红色脉冲边框（闪烁用 Date.now 驱动）
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 220);
    ctx.strokeStyle = `rgba(255,60,0,${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 12;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.arc(mx, my, previewR, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    // 准心十字
    ctx.strokeStyle = `rgba(255,80,0,${pulse})`;
    ctx.lineWidth = 1.5;
    const cs = 10; // 准心大小
    ctx.beginPath();
    ctx.moveTo(mx - cs, my); ctx.lineTo(mx + cs, my);
    ctx.moveTo(mx, my - cs); ctx.lineTo(mx, my + cs);
    ctx.stroke();
    ctx.restore();
  }
}

// ========== 波次管理 ==========
function startWave() {
  state.wave++;
  const wCfg = WAVES[state.wave - 1];
  state.spawnQueue = wCfg.count;
  state.spawnTimer = 0;
  state.phase = 'spawning';
  state.waveStartTime = Date.now(); // 记录波次开始时间，用于计算持续时间
  // 下关开始时清空各塔伤害统计，并重置炼化标志
  Object.values(state.towers).forEach(t => { t.damageDealt = 0; t.physDmg = 0; t.magicDmg = 0; t.alchemyUsed = false; });
  document.getElementById('wave-transition').classList.add('hidden');
  document.getElementById('wave-display').textContent = state.wave;
  updateMainActionBtn();

  // 特殊关卡提示
  const typeLabels = {
    boss:       '💀 BOSS关卡',
    magicImm:   '🛡️ 魔免关卡',
    heavyArmor: '🛡 高护甲关卡！魔法攻击更有效',
    swarm:      '🐜 蚁群入侵！大量快速小怪',
    hiddenBoss: '☠️ 隐藏BOSS！极限挑战',
    hidden:     '👁 隐藏关卡',
  };
  const label = typeLabels[wCfg.waveType];
  if (label && wCfg.waveType !== 'normal') {
    showWaveTransition(`🔥 第 ${state.wave} 波 — ${label}`);
    setTimeout(() => {
      document.getElementById('wave-transition')?.classList.add('hidden');
    }, 2500);
  }
}

// ========== 关卡商店 ==========
const SHOP_ITEMS = [
  { id: 'draw2',  cost: 800, name: '抽卡券 ×2',   desc: '立即获得两次抽卡机会' },
  { id: 'draw1',  cost: 350, name: '抽卡券 ×1',   desc: '立即获得一次抽卡机会' },
  { id: 'dmgup',  cost: 200, name: '战斗强化',     desc: '所有塔伤害永久 +3%（可叠加）' },
];

function openShopModal() {
  // 更新弹窗中的金币显示
  const el = document.getElementById('shop-gold-amount');
  if (el) el.textContent = state.gold;
  // 更新各商品按钮的可购买状态
  SHOP_ITEMS.forEach((item, idx) => {
    const card = document.getElementById(`shop-item-${idx}`);
    if (!card) return;
    if (state.gold < item.cost) {
      card.classList.add('disabled');
    } else {
      card.classList.remove('disabled');
    }
  });
  document.getElementById('shop-modal')?.classList.remove('hidden');
}

function closeShopModal() {
  document.getElementById('shop-modal')?.classList.add('hidden');
}

// 全局暴露，供 HTML onclick 调用
function shopBuy(idx) {
  const item = SHOP_ITEMS[idx];
  if (!item) return;
  if (state.gold < item.cost) {
    spawnGoldPopup('💰 金币不足！');
    return;
  }
  state.gold -= item.cost;
  if (item.id === 'draw2') {
    state.drawTickets = (state.drawTickets || 0) + 2;
    spawnGoldPopup('🎴 获得抽卡券 ×2！');
  } else if (item.id === 'draw1') {
    state.drawTickets = (state.drawTickets || 0) + 1;
    spawnGoldPopup('🎴 获得抽卡券 ×1！');
  } else if (item.id === 'dmgup') {
    state.globalAtkMult = Math.round(((state.globalAtkMult || 1) * 1.03) * 1000) / 1000;
    spawnGoldPopup(`⚔️ 全局伤害提升至 ×${state.globalAtkMult.toFixed(3)}`);
  }
  updateHUD();
  closeShopModal();
}

function shopSkip() {
  closeShopModal();
}

function showWaveTransition(msg) {
  const txt = document.getElementById('wave-text');
  if (txt) txt.textContent = msg;
  const wt = document.getElementById('wave-transition');
  if (wt) wt.classList.remove('hidden');
}

// 带"跳过→立即开始"按钮的波次过渡提示（用于 waiting-draw 阶段）
function showWaveTransitionWithSkip(waveMsg, hint) {
  const wt = document.getElementById('wave-transition');
  if (!wt) return;
  const txt = document.getElementById('wave-text');
  if (txt) {
    txt.innerHTML = `
      <span>${waveMsg}</span>
      <span style="font-size:13px;color:#ffd700;display:block;margin-top:4px;">${hint}</span>
      <button id="wave-skip-btn" style="
        margin-top:8px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.4);
        border-radius:8px;padding:4px 14px;cursor:pointer;font-size:12px;font-weight:bold;
        backdrop-filter:blur(4px);transition:background 0.15s;
      ">⏭ 跳过，立即开始下一波</button>
    `;
    const skipBtn = txt.querySelector('#wave-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (state.phase === 'waiting-draw') {
          wt.classList.add('hidden');
          startWave();
        }
      });
    }
  }
  wt.classList.remove('hidden');
  // 3 秒后自动隐藏提示条（玩家仍可通过抽卡放置或跳过按钮触发下一波）
  setTimeout(() => {
    if (state.phase === 'waiting-draw') wt.classList.add('hidden');
  }, 3000);
}

function endGame(win, finalVictory = false) {
  state.phase = win ? 'victory' : 'gameover';
  state.paused = false; // 结束时清除暂停状态
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  updatePauseBtn(); // 游戏结束后禁用暂停按钮
  updateMainActionBtn();
  const overlay = document.getElementById('overlay');
  overlay.classList.remove('hidden');

  const extraEl = document.getElementById('overlay-extra');
  const continueBtn = document.getElementById('overlay-continue-btn');
  const nextBtn = document.getElementById('overlay-next-btn');

  if (continueBtn) continueBtn.classList.add('hidden'); // 永远隐藏旧继续按钮

  // 控制"下一关"按钮显隐
  if (nextBtn) {
    if (win && currentStage < 3) {
      nextBtn.textContent = `➡️ 进入第 ${currentStage + 1} 关`;
      nextBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.add('hidden');
    }
  }

  if (win && currentStage === 3 && finalVictory) {
    // 第三关完美通关
    document.getElementById('overlay-title').textContent = '🏆 最终完美通关！';
    document.getElementById('overlay-msg').textContent =
      `🎊 恭喜完美通关三大关全部30波！金币: ${state.gold}`;
    if (extraEl) extraEl.innerHTML = `👑 <b>零伤亡！你是真正的塔防大师！</b>`;
  } else if (win && currentStage === 3 && !finalVictory) {
    // 第三关普通通关
    document.getElementById('overlay-title').textContent = '🏆 最终通关！';
    document.getElementById('overlay-msg').textContent =
      `✅ 恭喜通关全部三大关！金币: ${state.gold} | 逃脱: ${state.escaped}`;
    if (extraEl) extraEl.innerHTML = `🎖️ <b>三大关全部制霸！</b>`;
  } else if (win && finalVictory) {
    // 非第三关完美通关
    document.getElementById('overlay-title').textContent = `🌟 第 ${currentStage} 关完美胜利！`;
    document.getElementById('overlay-msg').textContent =
      `🎊 完美通关第 ${currentStage} 关全部30波！金币: ${state.gold}`;
    if (extraEl) extraEl.innerHTML = `👑 <b>零伤亡！进入下一关挑战吧！</b>`;
  } else if (win && !finalVictory) {
    // 非第三关普通通关
    document.getElementById('overlay-title').textContent = `🎉 第 ${currentStage} 关胜利！`;
    document.getElementById('overlay-msg').textContent =
      `✅ 通关第 ${currentStage} 关全部30波！金币: ${state.gold} | 逃脱: ${state.escaped}`;
    if (extraEl) extraEl.innerHTML = `🏆 <b>挑战完成！准备好迎接下一关了吗？</b>`;
  } else {
    // 失败
    document.getElementById('overlay-title').textContent = '💀 失败';
    document.getElementById('overlay-msg').textContent =
      `${state.escaped}只怪物到达终点，防线崩溃！`;
    if (extraEl) extraEl.innerHTML = '';
  }
}

// 进入下一关（关卡编号+1，完全重置但保留难度选择）
function doNextStage() {
  document.querySelectorAll('.dmg-number, .coin-drop, .gold-popup, .exp-orb, .exp-popup').forEach(el => el.remove());
  document.getElementById('draw-modal').classList.add('hidden');
  document.getElementById('upgrade-banner').classList.add('hidden');
  document.getElementById('place-banner').classList.add('hidden');
  document.getElementById('tower-tooltip').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('wave-transition').classList.add('hidden');
  const srOvl = document.getElementById('special-recipe-overlay');
  if (srOvl) srOvl.remove();
  setDrawBtnHighlight(false);

  if (animId) { cancelAnimationFrame(animId); animId = null; }

  // 清空视觉列表
  lightningArcs = []; hailParticles = []; lavaWaves = []; coinBursts = [];

  currentStage = Math.min(currentStage + 1, 3);
  WAVES = buildWavesForStage(currentStage);
  initState();
  updateHUD();
  updateNukeUI();
  renderRecipes();
  updateDrawCostDisplay();
  updatePauseBtn();
  updateMainActionBtn();
  setDifficultyBtnsDisabled(false);
  draw();
}

// ========== HUD ==========
function updateHUD() {
  document.getElementById('gold-display').textContent = state.gold;
  document.getElementById('escaped-display').textContent = state.escaped;
  document.getElementById('wave-display').textContent = state.wave;
  // 同步关卡显示
  const stageEl = document.getElementById('stage-display');
  const stageWrap = document.getElementById('stage-hud-item');
  if (stageEl) stageEl.textContent = currentStage;
  if (stageWrap) stageWrap.style.display = currentStage > 1 ? '' : 'none';
  // 同步经验条
  updateExpBar();
}

function flashGold() {
  const el = document.getElementById('gold-display');
  el.style.color = '#ff4444';
  setTimeout(() => el.style.color = '#ffd700', 400);
}

// 检查点扣金币飘字（显示在地图上怪物位置）
function spawnCheckpointPenalty(worldX, worldY, msg) {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width  / canvas.width;
  const scaleY = rect.height / canvas.height;
  const pop = document.createElement('div');
  pop.className = 'checkpoint-penalty';
  pop.textContent = msg;
  pop.style.left = (rect.left + worldX * scaleX - 40) + 'px';
  pop.style.top  = (rect.top  + worldY * scaleY - 20) + 'px';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1300);
}

// 波次奖励金币弹出提示（显示在HUD金币旁）
function spawnGoldPopup(msg) {
  const pop = document.createElement('div');
  pop.className = 'gold-popup';
  pop.textContent = msg;
  const goldEl = document.getElementById('gold-display');
  const rect = goldEl ? goldEl.getBoundingClientRect() : { left: 80, top: 20 };
  pop.style.left = rect.left + 'px';
  pop.style.top  = (rect.top - 8) + 'px';
  pop.style.fontSize = '13px';
  pop.style.color = '#ffd700';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1200);
}

// ========== 玩家等级抽卡配置 ==========
// 玩家等级1-5，通过击杀怪物获得经验值自动升级（每级100exp）

// 各玩家等级对应的塔级别概率池
// playerLevel 1: 只能抽1级塔
// playerLevel 2: 1级50%，2级50%
// playerLevel 3: 1级20%，2级40%，3级40%
// playerLevel 4: 1级10%，2级20%，3级40%，4级30%
// playerLevel 5: 1级10%，2级20%，3级30%，4级20%，5级10%，6级10%
const PLAYER_LEVEL_POOLS = [
  [1],                                                          // playerLevel 1：100%
  [1,1,1,1,1,2,2,2,2,2],                                       // playerLevel 2：50/50
  [1,1,1,2,2,2,2,3,3,3],                                       // playerLevel 3：30/40/30
  [1,1,1,2,2,2,2,2,3,3,3,3,3,3,3,3,4,4,4,4],                  // playerLevel 4：15/25/40/20
  [1,1,2,2,2,3,3,3,3,3,3,4,4,4,4,4,5,5,5,5],                  // playerLevel 5：10/15/30/25/20
];

// 6种精灵塔类型
const CARD_TYPES = ['fire', 'thunder', 'ice', 'poison', 'white', 'black'];
const CARD_ICONS = {
  fire:'🔴', thunder:'🟡', ice:'🔵', poison:'🟢', white:'⚪', black:'⚫'
};
const CARD_NAMES = {
  fire:'红精灵', thunder:'黄精灵', ice:'蓝精灵', poison:'绿精灵', white:'白精灵', black:'黑精灵'
};
const CARD_COLORS = {
  fire:'#ff4500', thunder:'#ffd700', ice:'#00bfff', poison:'#44bb44', white:'#ccddff', black:'#554477'
};

/** 根据玩家等级随机抽取一张卡（返回 {type, level}） */
function drawOneCard() {
  const pl = state.playerLevel || 1;
  const pool = PLAYER_LEVEL_POOLS[Math.min(pl - 1, PLAYER_LEVEL_POOLS.length - 1)];
  const level = pool[Math.floor(Math.random() * pool.length)];
  const type = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
  return { type, level, id: Math.random() };
}

const DRAW_COST = 100; // 抽卡固定费用，不再变化

function calcDrawCost() {
  return DRAW_COST;
}

function updateDrawCostDisplay() {
  // 刷新抽卡价格显示（固定100）
  const label = document.getElementById('draw-cost-label');
  if (label) label.textContent = `${DRAW_COST}💰`;

  // 隐藏高级抽卡和档位tab
  const premiumBtn = document.getElementById('premium-draw-btn');
  if (premiumBtn) premiumBtn.style.display = 'none';
  const tierTabs = document.getElementById('draw-tier-tabs');
  if (tierTabs) tierTabs.innerHTML = '';

  // 升级按钮改为显示经验条信息（隐藏按钮本身）
  const upgradeBtn = document.getElementById('draw-upgrade-btn');
  if (upgradeBtn) upgradeBtn.style.display = 'none';
  // 同步 drawLevel 兼容字段
  state.drawLevel = state.playerLevel || 1;
}

// ========== 经验值系统（击杀自动获取） ==========
// 常量已在文件顶部定义（EXP_PER_KILL / EXP_PER_BOSS / EXP_PER_LEVEL / MAX_PLAYER_LEVEL）

function gainExp(amount) {
  if ((state.playerLevel || 1) >= MAX_PLAYER_LEVEL) return; // 满级不再积累
  state.exp = (state.exp || 0) + amount;
  // 升级检测（可连升多级，但最高5级）
  while (state.exp >= EXP_PER_LEVEL && (state.playerLevel || 1) < MAX_PLAYER_LEVEL) {
    state.exp -= EXP_PER_LEVEL;
    state.playerLevel = (state.playerLevel || 1) + 1;
    state.drawLevel = state.playerLevel;
    spawnGoldPopup(`⬆️ 玩家升至 Lv${state.playerLevel}！可抽更高级精灵！`);
  }
  if ((state.playerLevel || 1) >= MAX_PLAYER_LEVEL) state.exp = 0;
  updateExpBar();
  updateHUD();
}

// 刷新经验条显示
function updateExpBar() {
  const pl  = state.playerLevel || 1;
  const exp = state.exp || 0;
  const bar = document.getElementById('exp-bar-fill');
  const lbl = document.getElementById('exp-bar-label');
  if (!bar || !lbl) return;
  if (pl >= MAX_PLAYER_LEVEL) {
    bar.style.width = '100%';
    lbl.textContent = `Lv${pl} MAX`;
  } else {
    bar.style.width = `${(exp / EXP_PER_LEVEL) * 100}%`;
    lbl.textContent = `Lv${pl}  ${exp}/${EXP_PER_LEVEL}`;
  }
}

// （保留空函数以防旧调用）
function upgradeDrawLevel() {}

// ========== 新抽卡系统（每次抽5张，选1张直接放置）==========

function openDrawModal() {
  // ── 若已有未使用的旧牌，直接显示旧牌，不消耗新 ticket ──
  const hasOldCards = (state.drawModalCards || []).length > 0;
  if (!hasOldCards) {
    // 无旧牌：需要消耗一次抽卡券
    if ((state.drawTickets || 0) <= 0) {
      spawnGoldPopup('🎴 无抽卡次数！');
      return;
    }
    state.drawTickets = Math.max(0, (state.drawTickets || 0) - 1);
    // 抽5张卡，每张直接是 X级Y塔
    state.drawModalCards = Array.from({ length: 5 }, () => drawOneCard());
    state.drawModalSelected = null; // 新系统：单选，null=未选
    updateHUD();
  }

  state._pausedBeforeDraw = state.paused; // 记录抽卡前的暂停状态
  state.paused = true; // 抽卡期间暂停游戏
  updatePauseBtn();
  updateMainActionBtn();

  // 更新弹窗标题
  const title = document.querySelector('#draw-modal-inner .modal-title');
  if (title) title.textContent = '🎴 选择1张塔放置';
  const modalInner = document.getElementById('draw-modal-inner');
  if (modalInner) modalInner.classList.remove('premium-mode');

  updateRefreshBtn();                // 同步显示当前刷新价格
  renderDrawModal();
  renderDrawInlineRecipe();          // 渲染右侧内嵌秘方
  document.getElementById('draw-modal').classList.remove('hidden');
}

// 高级抽卡入口（向后兼容，直接调用普通抽卡）
function openPremiumDrawModal() {
  openDrawModal();
}

function renderDrawModal() {
  const container = document.getElementById('draw-cards');
  container.innerHTML = '';

  // 隐藏combo预览区（新系统不需要）
  const preview = document.getElementById('draw-combo-preview');
  if (preview) preview.style.display = 'none';

  // 抽卡悬停 tooltip 容器（懒创建，复用同一个）
  let dcTooltip = document.getElementById('draw-card-tooltip');
  if (!dcTooltip) {
    dcTooltip = document.createElement('div');
    dcTooltip.id = 'draw-card-tooltip';
    dcTooltip.style.cssText = [
      'position:fixed',
      'z-index:99999',
      'background:linear-gradient(135deg,#1e1a2e,#12101e)',
      'border:1.5px solid #7744aa',
      'border-radius:10px',
      'padding:10px 13px',
      'color:#eee',
      'font-size:12px',
      'line-height:1.7',
      'pointer-events:none',
      'display:none',
      'box-shadow:0 4px 24px #00000099',
      'max-width:260px',
      'white-space:normal',
    ].join(';');
    document.body.appendChild(dcTooltip);
  }

  state.drawModalCards.forEach((card, i) => {
    const div = document.createElement('div');
    const sel = state.drawModalSelected === i;
    div.className = `dcard ${card.type}${sel ? ' selected' : ''}`;
    if (sel) {
      div.style.borderColor = '#fbbf24';
      div.style.transform = 'translateY(-8px)';
      div.style.boxShadow = '0 0 16px rgba(251,191,36,0.6)';
    }
    const cfg = getBaseTowerCfg(card.type, card.level);
    // 构建 tooltip 内容
    const baseDef = BASE_TOWER_DEFS[card.type];

    // ── 查找此卡（effect+level）参与的所有秘方
    const cardEffect = cfg ? cfg.effect : null;
    const relatedRecipes = cardEffect ? SPECIAL_RECIPES.filter(r =>
      r.ingredients.some(ing => ing.effect === cardEffect && ing.level === card.level)
    ) : [];

    // ── 已建造的塔集合（用于标记材料是否已有）
    const builtList = Object.values(state.towers || {}).map(t => ({
      effect: t.cfg.effect, level: t.level || 1,
    }));

    // 生成可合成秘方 HTML 片段
    let recipesHtml = '';
    if (relatedRecipes.length > 0) {
      recipesHtml = `<div style="margin-top:8px;border-top:1px solid #7744aa55;padding-top:6px;">
        <div style="font-size:10px;color:#cc88ff;font-weight:bold;margin-bottom:4px;">🔮 可参与合成：</div>`;
      relatedRecipes.forEach(r => {
        // 统计此秘方还差几个材料
        const pool = [...builtList];
        let missing = 0;
        r.ingredients.forEach(req => {
          const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
          if (idx === -1) missing++;
          else pool.splice(idx, 1);
        });
        const statusColor = missing === 0 ? '#44ff66' : missing === r.ingredients.length ? '#887799' : '#ffdd44';
        const statusText  = missing === 0 ? '✅ 可合成' : `缺 ${missing} 件`;
        recipesHtml += `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:3px;">
          <span style="font-size:12px;">${r.icon} <span style="color:${r.color};">${r.name}</span></span>
          <span style="font-size:10px;color:${statusColor};">${statusText}</span>
        </div>`;
      });
      recipesHtml += `</div>`;
    }

    const tooltipHtml = cfg ? `
      <div style="font-weight:bold;font-size:13px;color:#ffd700;margin-bottom:4px;">
        ${CARD_ICONS[card.type]} ${CARD_NAMES[card.type]} <span style="color:#aaa;font-size:11px;">Lv${card.level}</span>
      </div>
      <div>⚔️ 攻击: <b style="color:#ff8866;">${cfg.dmg}</b></div>
      <div>🎯 范围: <b style="color:#66ccff;">${cfg.range}</b> 格</div>
      <div>⚡ 攻速: <b style="color:#ffdd44;">${cfg.rate}</b>/s</div>
      ${baseDef ? `<div style="margin-top:4px;font-size:11px;color:#ccaaff;">${baseDef.desc || ''}</div>` : ''}
      ${recipesHtml}
    ` : '';
    // 扑克牌卡面：左上角标识 + 中央大图标 + 底部名字/等级
    // 图标大小：L1=30px, L3=45px, L5=60px（线性插值，每级+7.5px）
    const iconSize = 30 + (card.level - 1) * 7.5;
    // 亮度：L1=0.75, L2=0.875, L3=1.0, L4=1.125, L5=1.25（每级+0.125）
    const iconBrightness = (0.75 + (card.level - 1) * 0.125).toFixed(3);
    div.innerHTML = `
      <div class="dcard-corner">
        <span class="dcard-corner-icon">${CARD_ICONS[card.type]}</span>
        <span class="dcard-corner-lv">L${card.level}</span>
      </div>
      <div class="dcard-icon" style="font-size:${iconSize}px;filter:brightness(${iconBrightness});">${CARD_ICONS[card.type]}</div>
      <div class="dcard-footer">
        <div class="dcard-name">${CARD_NAMES[card.type]}</div>
        <div class="dcard-level">Lv${card.level}</div>
      </div>
    `;
    div.addEventListener('click', () => selectDrawCard(i));
    // 悬停显示 tooltip
    div.addEventListener('mouseenter', e => {
      dcTooltip.innerHTML = tooltipHtml;
      dcTooltip.style.display = 'block';
      const rect = div.getBoundingClientRect();
      // 优先显示在卡片上方，防止超出屏幕则显示在下方
      const ttH = 160; // 估算高度（含秘方行）
      const top = rect.top - ttH - 8;
      dcTooltip.style.left = Math.max(4, rect.left + rect.width/2 - 130) + 'px';
      dcTooltip.style.top  = (top < 4 ? rect.bottom + 8 : top) + 'px';
      // ── 高亮右侧秘方面板中含此卡的秘方
      if (cardEffect) renderDrawInlineRecipe(cardEffect, card.level);
    });
    div.addEventListener('mouseleave', () => {
      dcTooltip.style.display = 'none';
      // 离开卡片后，若有选中卡则恢复为选中卡高亮，否则无高亮
      if (state.drawModalSelected !== null) {
        const selCard = state.drawModalCards[state.drawModalSelected];
        const selCfg = getBaseTowerCfg(selCard.type, selCard.level);
        const selEffect = selCfg ? selCfg.effect : null;
        if (selEffect) renderDrawInlineRecipe(selEffect, selCard.level);
        else renderDrawInlineRecipe();
      } else {
        renderDrawInlineRecipe();
      }
    });
    container.appendChild(div);
  });

  // 更新确认按钮
  const confirmBtn = document.getElementById('confirm-draw-btn');
  if (confirmBtn) {
    if (state.drawModalSelected !== null) {
      const card = state.drawModalCards[state.drawModalSelected];
      confirmBtn.disabled = false;
      confirmBtn.textContent = `✅ 放置 ${CARD_ICONS[card.type]}${CARD_NAMES[card.type]} Lv${card.level}`;
    } else {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '请选择1张塔';
    }
  }

  // ── 合成按钮：选中后检测是否有另一张相同 type+level 的卡
  const existingMergeBtn = document.getElementById('merge-draw-btn');
  if (existingMergeBtn) existingMergeBtn.remove();

  if (state.drawModalSelected !== null) {
    const selCard = state.drawModalCards[state.drawModalSelected];
    // 找到第一张与选中卡 type 和 level 完全相同的其他卡
    const matchIdx = state.drawModalCards.findIndex(
      (c, idx) => idx !== state.drawModalSelected && c.type === selCard.type && c.level === selCard.level
    );
    if (matchIdx !== -1) {
      const mergeBtn = document.createElement('button');
      mergeBtn.id = 'merge-draw-btn';
      const nextLevel = selCard.level + 1;
      const icon = CARD_ICONS[selCard.type];
      const name = CARD_NAMES[selCard.type];
      mergeBtn.innerHTML = `✨ 合成 ${icon}${name} <span style="color:#ffd700;font-weight:bold;">Lv${nextLevel}</span>`;
      mergeBtn.title = `消耗两张 ${name} Lv${selCard.level}，直接放置 Lv${nextLevel}`;
      // 插入到 modal-actions 里，紧跟 confirm 按钮
      const actions = document.querySelector('.modal-actions');
      if (actions) actions.insertBefore(mergeBtn, actions.firstChild);
      mergeBtn.addEventListener('click', () => confirmMergeDraw(state.drawModalSelected, matchIdx));
      // 悬停合成按钮时：高亮右侧秘方中含"合成目标（level+1）"的秘方
      mergeBtn.addEventListener('mouseenter', () => {
        const cfg = getBaseTowerCfg(selCard.type, nextLevel);
        const mergeEffect = cfg ? cfg.effect : null;
        if (mergeEffect) renderDrawInlineRecipe(mergeEffect, nextLevel);
      });
      mergeBtn.addEventListener('mouseleave', () => {
        // 离开后恢复为当前选中卡的高亮（或无高亮）
        const selCfg = getBaseTowerCfg(selCard.type, selCard.level);
        const selEffect = selCfg ? selCfg.effect : null;
        if (selEffect) renderDrawInlineRecipe(selEffect, selCard.level);
        else renderDrawInlineRecipe();
      });
    }
  }

  // ── 选中卡后立即高亮秘方（无悬停覆盖时的默认状态）
  if (state.drawModalSelected !== null) {
    const selCard = state.drawModalCards[state.drawModalSelected];
    const selCfg = getBaseTowerCfg(selCard.type, selCard.level);
    const selEffect = selCfg ? selCfg.effect : null;
    if (selEffect) renderDrawInlineRecipe(selEffect, selCard.level);
    else renderDrawInlineRecipe();
  }
}

function selectDrawCard(i) {
  state.drawModalSelected = (state.drawModalSelected === i) ? null : i;
  renderDrawModal();
}

// 兼容旧接口（新系统不再使用）
function toggleDrawCard(i) { selectDrawCard(i); }
function updateDrawCombo() {}

// ── 合成放置：消耗选中卡+匹配卡，放置高一级
function confirmMergeDraw(selIdx, matchIdx) {
  const card = state.drawModalCards[selIdx];
  if (!card) return;
  const nextLevel = card.level + 1;
  const cfg = getBaseTowerCfg(card.type, nextLevel);
  if (!cfg) {
    // 超出最高级，回退为普通放置选中卡
    confirmDraw();
    return;
  }

  // 关闭弹窗，清理 tooltip 和合成按钮
  const dcTip = document.getElementById('draw-card-tooltip');
  if (dcTip) dcTip.style.display = 'none';
  const mergeBtn = document.getElementById('merge-draw-btn');
  if (mergeBtn) mergeBtn.remove();
  document.getElementById('draw-modal').classList.add('hidden');
  // 恢复抽卡前的暂停状态（而非强制 false），放置塔不依赖游戏运行
  state.paused = state._pausedBeforeDraw || false;
  state._pausedBeforeDraw = undefined;
  updatePauseBtn();
  state.lastDrawCost = 0;

  // 标记两张被消耗的卡（从卡池中移除，但不影响其余卡）
  // 简单做法：置空这两个槽位（放置后剩余卡不再展示）
  state.drawModalCards[selIdx] = null;
  state.drawModalCards[matchIdx] = null;
  state.drawModalSelected = null;

  // 进入放置模式，放置高一级的塔
  const baseCfg = BASE_TOWER_DEFS[card.type];
  state.placingTower = { cfg, baseCfg, startLevel: nextLevel };

  document.getElementById('place-banner').classList.remove('hidden');
  document.getElementById('upgrade-banner').classList.add('hidden');
}

function confirmDraw() {
  if (state.drawModalSelected === null) return;
  const card = state.drawModalCards[state.drawModalSelected];
  if (!card) return;

  // 关闭弹窗，进入放置模式，隐藏 tooltip
  const dcTip = document.getElementById('draw-card-tooltip');
  if (dcTip) dcTip.style.display = 'none';
  document.getElementById('draw-modal').classList.add('hidden');
  // 恢复抽卡前的暂停状态（而非强制 false），放置塔不依赖游戏运行
  state.paused = state._pausedBeforeDraw || false;
  state._pausedBeforeDraw = undefined;
  updatePauseBtn();
  state.lastDrawCost = 0;

  // 直接使用抽到的 X级Y塔
  const cfg = getBaseTowerCfg(card.type, card.level);
  if (!cfg) return;
  const baseCfg = BASE_TOWER_DEFS[card.type];
  state.placingTower = { cfg, baseCfg, startLevel: card.level };
  state.placingFromDraw = true; // 标记：本次放置来自抽卡，取消时需重新打开弹窗

  document.getElementById('place-banner').classList.remove('hidden');
  document.getElementById('upgrade-banner').classList.add('hidden');
  canvas.style.cursor = 'crosshair';
}

function updateRefreshBtn() {
  const cost = state.drawRefreshCost || 100;
  const btn = document.getElementById('refresh-draw-btn');
  if (btn) btn.innerHTML = `<span class="refresh-icon">🎴</span> 刷新卡池（${cost} 💰）`;
}

function refreshDraw() {
  if (!state.drawRefreshCost) state.drawRefreshCost = 100;
  const cost = state.drawRefreshCost;
  if (state.gold < cost) { flashGold(); spawnGoldPopup(`💸 金币不足，无法刷新！（需要${cost}💰）`); return; }
  state.gold -= cost;
  state.drawRefreshCost += 100; // 每次刷新后下次价格+100
  updateHUD();
  updateRefreshBtn();
  // 重新抽5张牌，保持弹窗打开
  state.drawModalCards = Array.from({ length: 5 }, drawOneCard);
  state.drawModalSelected = null;
  document.getElementById('confirm-draw-btn').disabled = true;
  renderDrawModal();
}

// ========== 放置塔 ==========
function cancelPlacing() {
  const fromDraw = state.placingFromDraw;
  state.placingTower = null;
  state.placingRock = false;
  state.placingFromDraw = false;
  document.getElementById('place-banner').classList.add('hidden');
  canvas.style.cursor = '';
  draw();
  // 若本次放置来自抽卡，取消时重新打开弹窗（显示同一批旧牌，不消耗新次数）
  if (fromDraw && (state.drawModalCards || []).length > 0) {
    state._pausedBeforeDraw = state.paused;
    state.paused = true;
    updatePauseBtn();
    updateMainActionBtn();
    state.drawModalSelected = null; // 清空选中状态
    renderDrawModal();
    renderDrawInlineRecipe();
    document.getElementById('draw-modal').classList.remove('hidden');
  }
}

function placeTowerAt(r, c) {
  const key = `${r},${c}`;
  if (PATH_SET.has(key) || state.towers[key]) return;
  if (!state.placingTower) return;

  const lvl = state.placingTower.startLevel || 1;
  const base = state.placingTower.baseCfg || state.placingTower.cfg;
  const isSpecialTower = !!(state.placingTower.cfg.special);

  // 新抽卡系统：cfg 已经包含了正确的等级数值（由 getBaseTowerCfg 计算），直接使用
  // 若是GM生成或旧路径（lvl>1 且 cfg==baseCfg），则重新缩放
  let scaledCfg = state.placingTower.cfg;
  if (!isSpecialTower && lvl > 1 && scaledCfg === base) {
    // 只有当 cfg 未被预先缩放（GM放置路径）才在此缩放
    const mult = LVL_DMG_MULT[Math.min(lvl - 1, LVL_DMG_MULT.length - 1)];
    scaledCfg = Object.assign({}, base, {
      dmg: Math.round(base.dmg * mult),
      effectPower: calcEffectPower(base, lvl),
    });
  }

  state.towers[key] = {
    cfg: scaledCfg,
    baseCfg: base,
    level: lvl,
    cooldown: 0,
    buffTimer: 0,
    buffMult: 1,
    atkBuffMult: 1,
    damageDealt: 0,
    // 特殊塔额外字段
    ...(isSpecialTower ? { specialCooldown: 0, isSpecial: true } : {}),
  };

  state.drawModalCards = [];    // 清空旧牌：本次抽卡已使用，下次打开重新抽
  state.drawModalSelected = null;
  state.placingFromDraw = false;
  cancelPlacing();
  renderRecipes();
  // 若放置了银行，立即更新核弹价格UI
  if (scaledCfg.effect === 'bankAtk') updateNukeUI();

  // ── 若当前处于"等待抽卡"阶段且次数已用尽，放置成功后自动开启下一波
  if (state.phase === 'waiting-draw' && (state.drawTickets || 0) <= 0) {
    document.getElementById('wave-transition').classList.add('hidden');
    // 短暂延迟让玩家看到放置动画后再开波
    setTimeout(() => {
      if (state.phase === 'waiting-draw' && (state.drawTickets || 0) <= 0) startWave();
    }, 600);
  }
  updateMainActionBtn();
}

// ========== 升级系统（同级吞噬 Lv1-4：×3成长；Lv5-9：+5%伤害/级，花费500-1000；最高Lv10） ==========
// 5级后升级费用表：升级到Lv6/7/8/9/10 对应花费 500/600/700/800/900/1000
const ADVANCE_UPGRADE_COST = [500, 600, 700, 800, 900, 1000];

function startUpgrade(fromKey) {
  if (!state.towers[fromKey]) return;
  const tower = state.towers[fromKey];
  // 特殊塔不可升级
  if (tower.isSpecial) {
    const content = document.getElementById('tooltip-content');
    if (content) {
      const old = content.innerHTML;
      content.innerHTML += `<div style="color:#ff6666;margin-top:4px">⚠️ 特殊塔无法升级！</div>`;
      setTimeout(() => { content.innerHTML = old; }, 1800);
    }
    return;
  }
  if (tower.level >= 6) {
    const content = document.getElementById('tooltip-content');
    if (content) {
      const old = content.innerHTML;
      content.innerHTML += `<div style="color:#ff6666;margin-top:4px">⚠️ 已达最高等级(Lv6)!</div>`;
      setTimeout(() => { content.innerHTML = old; }, 1800);
    }
    return;
  }
  // 新系统：Lv1→6 全部走吞噬同类升级路径
  state.upgradingTower = fromKey;
  state.selectedTowerKey = null;
  hideTooltip();
  document.getElementById('upgrade-banner').classList.remove('hidden');
  document.getElementById('place-banner').classList.add('hidden');
  canvas.style.cursor = 'cell';
}

function cancelUpgrade() {
  state.upgradingTower = null;
  document.getElementById('upgrade-banner').classList.add('hidden');
  canvas.style.cursor = '';
}

// ========== 核弹系统 ==========
function getNukePrice() {
  const hasBank = Object.values(state.towers).some(t => t.cfg && t.cfg.effect === 'bankAtk');
  return hasBank ? 400 : 800;
}

function buyNuke() {
  if (state.phase === 'idle') return; // 游戏未开始不能买
  const nukePrice = getNukePrice();
  if (state.gold < nukePrice) {
    // 金币不足提示
    const btn = document.getElementById('nuke-btn');
    const old = btn.innerHTML;
    btn.innerHTML = '❌ 金币不足！';
    btn.style.background = '#555';
    setTimeout(() => { btn.innerHTML = old; btn.style.background = 'linear-gradient(90deg,#7f0000,#cc0000)'; }, 1200);
    return;
  }
  state.gold -= nukePrice;
  state.nukes = (state.nukes || 0) + 1;
  updateNukeUI();
  updateHUD();
  // 立即进入选点模式
  enterNukeMode();
}

function enterNukeMode() {
  if ((state.nukes || 0) <= 0) return;
  state.nukingMode = true;
  document.getElementById('nuke-banner').classList.remove('hidden');
  canvas.style.cursor = 'crosshair';
}

function cancelNuke() {
  state.nukingMode = false;
  document.getElementById('nuke-banner').classList.add('hidden');
  canvas.style.cursor = '';
  // 退款
  state.gold += 800;
  state.nukes = Math.max(0, (state.nukes || 0) - 1);
  updateNukeUI();
  updateHUD();
}

function detonateNuke(x, y) {
  if ((state.nukes || 0) <= 0) return;
  state.nukes--;
  state.nukingMode = false;
  document.getElementById('nuke-banner').classList.add('hidden');
  canvas.style.cursor = '';
  updateNukeUI();

  const nukeR = 3 * CELL;
  // 对范围内所有怪物造成99999物理伤害
  state.monsters.forEach(m => {
    if (m.dead) return;
    const dx = m.x - x, dy = m.y - y;
    if (Math.sqrt(dx*dx+dy*dy) <= nukeR) {
      const realDmg = calcDmg(99999, m, true);
      m.hp -= realDmg;
      spawnDmgNumber(m.x, m.y, realDmg);
      if (m.hp <= 0 && !m.dead) m.die();
    }
  });

  // 添加核弹爆炸特效（延长至2.5s，蘑菇云动画）
  state.nukeEffects = state.nukeEffects || [];
  state.nukeEffects.push({ x, y, r: nukeR, life: 5.0, maxLife: 5.0 });

  // 大量冲击粒子
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 150 + Math.random() * 300;
    state.particles.push(new Particle(x, y,
      Math.cos(a)*spd, Math.sin(a)*spd,
      ['#ff4400','#ffaa00','#ffffff','#ffff00','#ff8800'][Math.floor(Math.random()*5)],
      Math.random()*8+4, 1.0));
  }
}

function updateNukeUI() {
  const cnt = state.nukes || 0;
  const el = document.getElementById('nuke-count');
  if (el) el.textContent = cnt > 0 ? `☢️ 持有核弹 ×${cnt}` : '';
  // 银行折扣：更新核弹按钮价格（title + 按钮内文字）
  const btn = document.getElementById('nuke-btn');
  if (btn) {
    const hasBank = Object.values(state.towers || {}).some(t => t.cfg && t.cfg.effect === 'bankAtk');
    const price = hasBank ? 400 : 800;
    const priceLabel = hasBank ? `<span style="color:#ffee88;">${price}💰</span> <span style="color:#aaffaa;font-size:11px">（炼金5折）</span>` : `<span style="color:#ffee88;">${price}💰</span>`;
    btn.innerHTML = `☢️ 购买核弹 ${priceLabel}`;
    btn.title = hasBank ? `购买核弹 (${price}金币 · 炼金术士折扣50%)` : `购买核弹 (${price}金币)`;
    btn.dataset.priceLabel = String(price);
  }
}

// 元素塔(tri)金币加成倍率按等级表：Lv1~5
const TRI_EFFECT_POWER = [0.2, 0.3, 0.4, 0.45, 0.6];

// 计算指定塔在给定等级下的 effectPower
function calcEffectPower(baseCfg, level) {
  if (baseCfg.effect === 'tri') {
    return TRI_EFFECT_POWER[Math.min(level, 5) - 1] ?? baseCfg.effectPower;
  }
  // 其余塔 effectPower 不随等级变化（由 buffMult/其他机制处理）
  return baseCfg.effectPower;
}

function doUpgrade(targetKey) {
  const from = state.towers[state.upgradingTower];
  const target = state.towers[targetKey];
  if (!from || !target) return;
  // 必须：同效果 + 同等级（Lv1-5 的同类吞噬升级，新系统最高Lv6）
  if (from.cfg.effect !== target.cfg.effect || from.level !== target.level) return;
  // Lv1-5 才走吞噬路径（Lv6 已是满级）
  if (from.level >= 6) return;

  delete state.towers[targetKey];
  from.level = from.level + 1; // 吞噬后升1级（最高升到6）
  // 新系统：用 getBaseTowerCfg 重新计算该等级的cfg（每级×2）
  // 先从 baseCfg 获取塔类型，再调用 getBaseTowerCfg
  const towerType = Object.keys(BASE_TOWER_DEFS).find(t => BASE_TOWER_DEFS[t].effect === from.baseCfg.effect);
  if (towerType) {
    // 新基础塔：用 getBaseTowerCfg 获取正确数值
    const newCfg = getBaseTowerCfg(towerType, from.level);
    if (newCfg) {
      from.cfg = newCfg;
      cancelUpgrade();
      renderRecipes();
      draw();
      return;
    }
  }
  // 降级处理：用传统multiplier缩放（兼容旧塔或特殊塔）
  const mult = LVL_DMG_MULT[Math.min(from.level - 1, LVL_DMG_MULT.length - 1)];
  const newEffectPower = calcEffectPower(from.baseCfg, from.level);
  from.cfg = Object.assign({}, from.baseCfg, {
    dmg: Math.round(from.baseCfg.dmg * mult),
    effectPower: newEffectPower,
  });
  cancelUpgrade();
  renderRecipes();
  draw();
}

// ========== 出售塔 ==========
// 新系统：Lv1-6各级对应出售价格；特殊塔固定200
const SELL_PRICES = [20, 30, 50, 80, 130, 200];
function calcSellPrice(tower) {
  if (tower.isSpecial) return 200;
  const lvl = tower.level || 1;
  const idx = Math.min(lvl - 1, SELL_PRICES.length - 1);
  return SELL_PRICES[idx];
}
function sellTower(key) {
  if (!state.towers[key]) return;
  const tower = state.towers[key];
  const refund = calcSellPrice(tower);
  const wasBank = tower.cfg && tower.cfg.effect === 'bankAtk';
  delete state.towers[key];
  state.gold += refund;
  state.selectedTowerKey = null;
  hideTooltip();
  updateHUD();
  // 若卖掉的是银行，立即恢复核弹原价UI
  if (wasBank) updateNukeUI();
  renderRecipes();
  draw();
}


// ========== 怪物详情Tooltip ==========
function showMonsterTooltip(m, e) {
  const tooltip = document.getElementById('tower-tooltip');
  const content = document.getElementById('tooltip-content');
  const actions = document.getElementById('tooltip-actions');

  let totalArmorDebuffUI = (m.defDebuff || 0);
  if (m.armorDebuffs && m.armorDebuffs.size > 0) {
    for (const entry of m.armorDebuffs.values()) totalArmorDebuffUI += entry.value;
  }
  const defAfterFlat = Math.max(0, (m.defense || 0) - totalArmorDebuffUI);
  const defFinal     = defAfterFlat * (1 - (m.armorPctDebuff || 0));
  const effSlow = calcEffectiveSlow(m);
  const slowPct = Math.round((1 - effSlow) * 100);
  const layerCount = (m.slowLayers || []).length;
  const currentSpd = Math.max(m.speed * effSlow, 10).toFixed(0);
  const debuffs = [];
  if (m.burnTimer > 0 && !m.burnImmune) debuffs.push(`🔥灼烧${m.burnDmg?.toFixed(1)}/s`);
  if (m.poisonTimer > 0) debuffs.push(`🟣毒素${m.poisonDmg?.toFixed(1)}/s`);
  if (slowPct > 0 && !m.slowImmune) debuffs.push(`❄️减速${slowPct}%（${layerCount}层）`);
  if (m.frozen) debuffs.push('🧊冰冻');
  if (totalArmorDebuffUI > 0) debuffs.push(`🛡️减甲-${totalArmorDebuffUI}`);
  if (m.armorPctDebuff > 0) debuffs.push(`🔥减甲-${Math.round(m.armorPctDebuff*100)}%`);
  if ((m.damageTakenMult || 1) > 1) debuffs.push(`🦅受伤+${Math.round(((m.damageTakenMult||1)-1)*100)}%`);
  const immuneList = [];
  if (m.burnImmune)   immuneList.push('灼烧');
  if (m.slowImmune)   immuneList.push('减速');
  if (m.chainImmune)  immuneList.push('闪电链');
  if (m.frozenImmune) immuneList.push('冰冻');

  // 减伤比例 = 1 - 10/(defFinal+10)  即护甲吸收掉的百分比
  const dmgReduce = ((1 - 10 / (defFinal + 10)) * 100).toFixed(1);
  const dmgColor = defFinal > 30 ? '#44ff88' : defFinal > 10 ? '#ffaa44' : '#ff6666';
  const spdColor = slowPct > 0 ? '#88ccff' : '#aaffaa';
  content.innerHTML = `
    <div style="color:${m.isBoss?'#ff4466':'#44ee66'};font-weight:bold;font-size:14px">${m.isBoss?'👑 BOSS':'👾 普通怪'}</div>
    <div>❤️ 生命: <b>${Math.ceil(m.hp)}</b> / ${m.maxHp}</div>
    <div>🛡️ 护甲: <b>${m.defense||0}</b>${totalArmorDebuffUI>0?` <span style="color:#ff6600">(-${totalArmorDebuffUI})</span>`:''}${m.armorPctDebuff>0?` <span style="color:#ff9900">(-${Math.round(m.armorPctDebuff*100)}%)</span>`:''} <span style="color:${dmgColor};font-size:11px">减伤 ${dmgReduce}%</span></div>
    <div>🏃 移速: <b style="color:${spdColor}">${currentSpd}</b> <small style="color:#888">/ 基础 ${m.speed}</small>${slowPct > 0 ? ` <span style="color:#88ccff;font-size:11px">（减速${slowPct}%，${layerCount}层叠加）</span>` : ''}</div>
    ${debuffs.length ? `<div style="color:#aaffaa;font-size:11px">debuff: ${debuffs.join(' ')}</div>` : ''}
    ${immuneList.length ? `<div style="color:#ff9944;font-size:11px">🛡 免疫: ${immuneList.join('/')}</div>` : ''}`;

  actions.innerHTML = `<button class="tooltip-btn sell" onclick="document.getElementById('tower-tooltip').classList.add('hidden')">✕ 关闭</button>`;

  tooltip.classList.remove('hidden');
  const tx = e.clientX + 14, ty = e.clientY - 10;
  tooltip.style.left = Math.min(tx, window.innerWidth - 210) + 'px';
  tooltip.style.top  = Math.min(ty, window.innerHeight - 150) + 'px';
}

// ========== 塔Tooltip ==========
function showTowerTooltip(key, e) {
  const tower = state.towers[key];
  if (!tower) return;
  const cfg = tower.cfg;
  const lvl = tower.level || 1;
  const tooltip = document.getElementById('tower-tooltip');
  const content = document.getElementById('tooltip-content');
  const actions = document.getElementById('tooltip-actions');

  // 根据效果类型生成精简介绍
  function genEffectDesc(cfg, lvl) {
    const p = cfg.effectPower;
    switch(cfg.effect) {
      case 'burn':              return `🔴 红精灵：单体高伤，灼烧 ${p}/秒持续3秒（Lv${lvl}）`;
      case 'thunderSingle':     return `🟡 黄精灵：单体超高攻速物理攻击（Lv${lvl}）`;
      case 'whiteAoe':          return `⚪ 白精灵：群体攻击，同时打最近3个目标（Lv${lvl}）`;
      case 'blackArmorBreak':   return `⚫ 黑精灵：单体中伤，命中削减护甲${p}点/次（Lv${lvl}）`;
      case 'poison': {
        return `🟢 绿精灵：单体攻击，毒素 ${p}/秒持续8秒（Lv${lvl}）`;
      }
      case 'thunderBuff': {
        const tbIdx = Math.min(lvl - 1, THUNDER_BUFF_MULT.length - 1);
        const tbMult = THUNDER_BUFF_MULT[tbIdx];
        return `⚡ 攻速光环：半径${cfg.aoeRange}格内友塔攻速×${tbMult}（Lv${lvl}，最高×${THUNDER_BUFF_MULT[THUNDER_BUFF_MULT.length-1]}）`;
      }
      case 'iceBuff': {
        const iceIdx = Math.min(lvl - 1, ICE_SLOW_FACTOR.length - 1);
        const slowPct = Math.round((1 - ICE_SLOW_FACTOR[iceIdx]) * 100);
        return `❄️ 命中减速：攻击最近2个目标，命中附加减速 <b>${slowPct}%</b> 持续3秒（Lv${lvl}，最高60%）`;
      }
      case 'atkBuff': {
        const abIdx = Math.min(lvl - 1, ATKBUFF_MULT.length - 1);
        const abMult = ATKBUFF_MULT[abIdx];
        const abPct  = Math.round((abMult - 1) * 100);
        const abMaxPct = Math.round((ATKBUFF_MULT[ATKBUFF_MULT.length-1] - 1) * 100);
        return `💪 攻击力光环：半径${cfg.aoeRange}格内友塔伤害+${abPct}%（Lv${lvl}，最高+${abMaxPct}%）`;
      }
      case 'lavaWave': {
        const lavaIdx = Math.min(lvl - 1, LAVA_DEF_DEBUFF.length - 1);
        const lavaDmgTip = LAVA_WAVE_DMG[Math.min(lvl - 1, LAVA_WAVE_DMG.length - 1)];
        return `🌋 技能波：${lavaDmgTip}魔法伤害 + 降甲${LAVA_DEF_DEBUFF[lavaIdx]}点持续4秒（不受攻击/攻速加成，Lv${lvl}）`;
      }
      case 'tri':          return `🌈 三连击：同时攻击最近3个目标，击杀额外奖励×${p}金币`;
      case 'chainLightning': return `⛓️ 闪电链：30%概率跳跃2-3个目标，链伤×${p}`;
      case 'dualFrost': {
        const frostIdx = Math.min(lvl - 1, DUAL_FROST_FREEZE.length - 1);
        return `💠 双击+冻结：攻击2个目标，40%概率冰冻${DUAL_FROST_FREEZE[frostIdx]}秒（Lv${lvl}）`;
      }
      case 'hailstorm':    return `🌨️ 全屏冰雹：AOE半径${cfg.aoeRange}格，爆炸伤害+减速${Math.round(p*100)}%`;
      case 'goldGen':      return `💰 每8秒产出 ${GOLD_GEN_AMOUNT[Math.min(lvl-1, GOLD_GEN_AMOUNT.length-1)]} 金币（Lv${lvl}）`;
      case 'volcanoAura':  return `🌋 持续灼烧AOE：半径${cfg.aoeRange}格，${p}/s（魔免免疫）`;
      case 'phoenixAura':  return `🦅 灼烧AOE：半径${cfg.aoeRange}格，${p}/s（对魔免单位无效）；<span style="color:#ff4444;font-weight:bold">范围内所有敌人受到伤害+25%（含魔免）</span>`;
      default:             return cfg.desc || '';
    }
  }
  const effectDesc = genEffectDesc(cfg, lvl);

  // ── 攻速Buff加成显示
  // 持续光环机制：buff存在即生效（无timer，直接判断倍率）
  const hasSpeedBuff = (tower.buffMult || 1) > 1;
  const hasAtkBuff    = (tower.atkBuffMult || 1) > 1;
  const globalAtkMult = state.globalAtkMult || 1;
  const hasGlobalBuff = globalAtkMult > 1;
  const baseRate = cfg.rate;
  const effectiveRate = baseRate * (tower.buffMult || 1);
  const baseDmg = cfg.dmg;
  // 最终伤害 = 基础 × 光环加成 × 全局升级加成（独立乘区）
  const effectiveDmg = Math.round(baseDmg * (tower.atkBuffMult || 1) * globalAtkMult);

  // 攻速行：若有加成显示绿色 (+X%)
  let rateStr = `${baseRate}/s`;
  if (hasSpeedBuff) {
    const pct = Math.round((tower.buffMult - 1) * 100);
    rateStr = `${effectiveRate.toFixed(2)}/s <span style="color:#44ff88">(+${pct}%⚡)</span>`;
  }
  // 伤害行：基础值（+光环加成）+全局加成
  let dmgStr = `${baseDmg}`;
  if (hasAtkBuff || hasGlobalBuff) {
    const bonus = effectiveDmg - baseDmg;
    dmgStr = `${baseDmg}<span style="color:#44ff88">（+${bonus}）</span>`;
  }

  // 影魔/阎王灵魂计数
  const souls = tower.souls || 0;
  const soulsLine = (cfg.effect === 'shadowDemonAtk' || cfg.effect === 'yanluoAtk') && souls > 0
    ? `<div style="color:#ff88ff;font-size:12px;margin-top:2px">🔮 灵魂: ${souls} 个（攻击力 +${souls * 50}）</div>`
    : '';

  content.innerHTML = `
    <div style="color:${cfg.color};font-weight:bold;font-size:14px">${cfg.icon} ${cfg.name}${tower.isSpecial ? '' : ` <small>Lv${lvl}</small>`}</div>
    <div>伤害: <b>${dmgStr}</b> | 范围: ${tower.rangeBonus > 0 ? `<b style="color:#44ff88;">${(cfg.range + tower.rangeBonus).toFixed(1)}</b><span style="color:#888;font-size:10px;">（${cfg.range}+${tower.rangeBonus}）</span>` : cfg.range}格 | 攻速: ${rateStr}</div>
    ${hasSpeedBuff  ? `<div style="color:#44ff88;font-size:11px">⚡ 攻速加成中 ×${tower.buffMult.toFixed(2)}（光环持续生效）</div>` : ''}
    ${tower.rangeBonus > 0 ? `<div style="color:#44ff88;font-size:11px">🎯 射程加成 +${tower.rangeBonus}格（光环持续生效）</div>` : ''}
    ${hasAtkBuff    ? `<div style="color:#44ff88;font-size:11px">💪 攻击力光环 +${Math.round((tower.atkBuffMult-1)*100)}%</div>` : ''}
    ${hasGlobalBuff ? `<div style="color:#cc88ff;font-size:11px">⬆️ 全局升级加成 ×${globalAtkMult.toFixed(2)}（独立乘区）</div>` : ''}
    ${soulsLine}
    <div style="color:#cca;font-size:11px;margin-top:3px">${effectDesc}</div>`;

  const isSpecialTower = !!(tower.isSpecial);
  // 升级按钮标签：特殊塔锁定 | Lv6满级 | Lv1-5 吞噬同类
  let upgradeLabel, upgradeDisabled;
  if (isSpecialTower) {
    upgradeLabel = '🔒 特殊塔';
    upgradeDisabled = true;
  } else if (lvl >= 6) {
    upgradeLabel = '🏆 已满级(Lv6)';
    upgradeDisabled = true;
  } else {
    upgradeLabel = '🔼 升级 (吞噬同类)';
    upgradeDisabled = false;
  }
  const refund = calcSellPrice(tower);

  // 特殊升级按钮：检测是否满足配方（特殊塔也可作为食材触发更高级的配方，如小火山→凤凰）
  const specialResult = getAvailableSpecialRecipe(key);
  const specialBtn = specialResult
    ? `<button class="tooltip-btn special-upgrade" onclick="craftSpecialTower('${key}')" style="background:linear-gradient(90deg,#ff8800,#ffcc00);color:#000;font-weight:bold;border:none;">✨ 特殊升级 → ${specialResult.recipe.name}</button>`
    : '';

  actions.innerHTML = `
    ${specialBtn}
    <button class="tooltip-btn upgrade" onclick="startUpgrade('${key}')" ${upgradeDisabled?'disabled':''}>${upgradeLabel}</button>
    <button class="tooltip-btn sell" onclick="sellTower('${key}')">💰 出售(+${refund})</button>`;

  // 显示在鼠标附近
  tooltip.classList.remove('hidden');
  const tx = e.clientX + 14, ty = e.clientY - 10;
  tooltip.style.left = Math.min(tx, window.innerWidth - 210) + 'px';
  tooltip.style.top = Math.min(ty, window.innerHeight - 150) + 'px';
}

function hideTooltip() {
  document.getElementById('tower-tooltip').classList.add('hidden');
  state.selectedTowerKey = null;
}

function showTooltipMsg(msg) {
  const el = document.getElementById('draw-combo-preview');
  if (el) { el.textContent = msg; return; }
  // fallback
  const banner = document.getElementById('upgrade-banner');
  if (banner) { const old = banner.textContent; banner.textContent = msg; setTimeout(()=>banner.textContent=old,1500); }
}

// ========== 配方列表 ==========
function renderRecipes() {
  const container = document.getElementById('recipes');
  if (!container) return;

  // 清理上次挂载到 body 的 tooltip 节点，避免重复堆积
  document.querySelectorAll('.recipe-tooltip').forEach(el => el.remove());

  container.innerHTML = '';

  // ── 检测已建造 / 可合成状态 ──────────────────────
  const builtList = Object.values(state.towers || {}).map(t => ({
    effect: t.cfg.effect, level: t.level || 1,
  }));

  function recipeCanCraft(r) {
    const pool = [...builtList];
    for (const req of r.ingredients) {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      if (idx === -1) return false;
      pool.splice(idx, 1);
    }
    return true;
  }

  // ── 构建 tooltip 内容 ──────────────────────────
  const specialEffectSet = new Set(SPECIAL_RECIPES.map(sr => sr.cfg?.effect).filter(Boolean));

  function buildTooltipHtml(r, isBuilt, canCraft) {
    const pool = [...builtList];
    let ingRows = '';
    const sorted = [...r.ingredients].sort((a, b) => {
      const aS = specialEffectSet.has(a.effect), bS = specialEffectSet.has(b.effect);
      if (aS !== bS) return aS ? 1 : -1;
      return a.level - b.level;
    });
    sorted.forEach(req => {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      const owned = idx !== -1;
      if (owned) pool.splice(idx, 1);
      const tCfg = Object.values(TOWER_RECIPES || {}).find(t => t.effect === req.effect)
        || SPECIAL_RECIPES.find(sr => sr.cfg && sr.cfg.effect === req.effect);
      const tName = tCfg ? (tCfg.name || tCfg.cfg?.name || req.effect) : req.effect;
      const tIcon = tCfg ? (tCfg.icon || tCfg.cfg?.icon || '?') : '?';
      const isSpecialIng = specialEffectSet.has(req.effect);
      const levelTxt = isSpecialIng ? '' : ` <span style="color:#ddaaff">Lv${req.level}</span>`;
      const color = owned ? '#88ffaa' : '#aa8888';
      const check = owned ? '✓ ' : '✗ ';
      ingRows += `<div style="display:flex;align-items:center;gap:3px;font-size:10px;color:${color};margin-top:2px;">
        <span>${tIcon}</span><span>${check}${tName}${levelTxt}</span>
      </div>`;
    });

    const statusBadge = isBuilt
      ? `<span style="display:inline-block;background:#ffd70033;border:1px solid #ffd700;color:#ffd700;border-radius:3px;padding:1px 5px;font-size:9px;margin-bottom:4px;">⭐ 已合成</span>`
      : canCraft
        ? `<span style="display:inline-block;background:#44ff6633;border:1px solid #44ff66;color:#44ff66;border-radius:3px;padding:1px 5px;font-size:9px;margin-bottom:4px;">✅ 可合成</span>`
        : '';

    return `
      <div style="font-size:9px;color:#aa88cc;margin-bottom:2px;">📖 效果</div>
      <div style="font-size:10px;color:#e0d0ff;line-height:1.45;margin-bottom:6px;">${r.desc}</div>
      <div style="font-size:9px;color:#aa88cc;margin-bottom:1px;">⚗️ 合成材料</div>
      <div>${ingRows}</div>
      ${statusBadge ? '<div style="margin-top:6px;">' + statusBadge + '</div>' : ''}
    `;
  }

  // ── 渲染秘方塔卡片（2列网格）─────────────────────
  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:4px;`;
  container.appendChild(grid);

  SPECIAL_RECIPES.forEach(r => {
    const isBuilt  = Object.values(state.towers || {}).some(t => t.cfg && t.cfg.effect === r.cfg.effect);
    const canCraft = !isBuilt && recipeCanCraft(r);

    let border, bg, shadow, opacity, nameColor;
    if (isBuilt) {
      border = '#ffd700'; bg = 'rgba(26,22,0,0.9)'; shadow = '0 0 8px #ffd70066'; opacity = 1;
      nameColor = '#ffd700';
    } else if (canCraft) {
      border = '#44ff66'; bg = 'rgba(10,40,10,0.9)'; shadow = '0 0 8px #44ff6655'; opacity = 1;
      nameColor = '#88ff99';
    } else {
      border = '#3a2a4a'; bg = 'rgba(20,14,30,0.8)'; shadow = 'none'; opacity = 0.45;
      nameColor = r.color;
    }

    const card = document.createElement('div');
    card.className = 'recipe-special-card';
    card.style.cssText = `
      background:${bg};border:1.5px solid ${border};border-radius:7px;
      padding:5px 3px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;
      box-shadow:${shadow};opacity:${opacity};cursor:default;
      transition:opacity 0.15s,box-shadow 0.15s;position:relative;
      overflow:visible;
    `;

    card.innerHTML = `
      <div style="font-size:18px;line-height:1;">${r.icon}</div>
      <div style="font-size:9.5px;font-weight:bold;color:${nameColor};text-align:center;
           white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;max-width:68px;">
        ${r.name}
      </div>
    `;

    // ── 悬停 Tooltip ──────────────────────────────
    const tt = document.createElement('div');
    tt.className = 'recipe-tooltip';
    tt.style.cssText = `
      display:none;position:fixed;z-index:9999;
      background:#1a0e2a;border:1.5px solid ${isBuilt ? '#ffd700' : canCraft ? '#44ff66' : '#6644aa'};
      border-radius:8px;padding:8px 10px;min-width:160px;max-width:210px;
      box-shadow:0 4px 18px rgba(0,0,0,0.7);pointer-events:none;
    `;
    const headerColor = isBuilt ? '#ffd700' : canCraft ? '#88ff99' : r.color;
    tt.innerHTML = `
      <div style="font-size:12px;font-weight:bold;color:${headerColor};margin-bottom:5px;display:flex;align-items:center;gap:5px;">
        <span>${r.icon}</span><span>${r.name}</span>
      </div>
      ${buildTooltipHtml(r, isBuilt, canCraft)}
    `;
    document.body.appendChild(tt);

    card.addEventListener('mouseenter', e => {
      tt.style.display = 'block';
      _positionRecipeTooltip(tt, e);
    });
    card.addEventListener('mousemove', e => {
      _positionRecipeTooltip(tt, e);
    });
    card.addEventListener('mouseleave', () => {
      tt.style.display = 'none';
    });

    grid.appendChild(card);
  });
}

// 定位 tooltip，确保不超出视口
function _positionRecipeTooltip(tt, e) {
  const margin = 8;
  const tw = tt.offsetWidth || 180;
  const th = tt.offsetHeight || 120;
  let left = e.clientX + 12;
  let top  = e.clientY + 12;
  if (left + tw + margin > window.innerWidth)  left = e.clientX - tw - 12;
  if (top  + th + margin > window.innerHeight) top  = e.clientY - th - 12;
  if (left < margin) left = margin;
  if (top  < margin) top  = margin;
  tt.style.left = left + 'px';
  tt.style.top  = top  + 'px';
}

// ========== Canvas 事件 ==========
function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_SIZE / rect.width;
  const scaleY = CANVAS_SIZE / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;
  const CS = CELL;
  const GS = GRID;
  const c = Math.floor(cx / CS);
  const r = Math.floor(cy / CS);
  if (r < 0 || r >= GS || c < 0 || c >= GS) return null;
  return [r, c];
}

canvas.addEventListener('mousemove', e => {
  state.hoverCell = getCell(e);
  // 核弹选点模式：记录鼠标精确坐标供预览圈使用
  if (state.nukingMode) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width, scaleY = CANVAS_SIZE / rect.height;
    state.nukeMousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY
    };
  } else {
    state.nukeMousePos = null;
  }
  // idle阶段gameLoop未运行，手动重绘以显示hover预览
  if (!animId) draw();
});

canvas.addEventListener('mouseleave', () => {
  state.hoverCell = null;
  state.nukeMousePos = null;
});

canvas.addEventListener('click', e => {
  // ── idle 阶段：有放置任务则先走放置逻辑；否则点 (0,0) = 开始游戏
  if (state.phase === 'idle') {
    if (state.placingTower) {
      // 走下面通用的放置逻辑（不 return，继续执行）
    } else {
      const cell = getCell(e);
      if (cell && cell[0] === 0 && cell[1] === 0) {
        document.getElementById('main-action-btn').click();
      }
      return;
    }
  }

  // 核弹选点模式：点击地图任意位置释放核弹
  if (state.nukingMode) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width, scaleY = CANVAS_SIZE / rect.height;
    const nx = (e.clientX - rect.left) * scaleX;
    const ny = (e.clientY - rect.top)  * scaleY;
    detonateNuke(nx, ny);
    return;
  }

  const cell = getCell(e);
  if (!cell) return;
  const [r, c] = cell;
  const key = `${r},${c}`;

  // 放置模式
  if (state.placingTower) {
    placeTowerAt(r, c);
    return;
  }

  // 升级模式：点击同类型塔
  if (state.upgradingTower) {
    if (state.towers[key] && key !== state.upgradingTower) {
      doUpgrade(key);
    } else if (key === state.upgradingTower) {
      cancelUpgrade();
    }
    return;
  }

  // 点击怪物 → 显示悬浮详情
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_SIZE / rect.width, scaleY = CANVAS_SIZE / rect.height;
  const cx2 = (e.clientX - rect.left) * scaleX;
  const cy2 = (e.clientY - rect.top) * scaleY;
  const clickedMonster = state.monsters.find(m => {
    if (m.dead) return false;
    const dx = m.x - cx2, dy = m.y - cy2;
    return Math.sqrt(dx*dx+dy*dy) <= (m.isBoss ? 24 : 18);
  });
  if (clickedMonster) {
    showMonsterTooltip(clickedMonster, e);
    return;
  }

  // 点击塔 → 显示Tooltip
  if (state.towers[key]) {
    if (state.selectedTowerKey === key) {
      hideTooltip();
    } else {
      state.selectedTowerKey = key;
      showTowerTooltip(key, e);
    }
    draw();
    return;
  }

  // 点击空地 → 隐藏Tooltip
  hideTooltip();
  draw();
});

// 升级模式：hover 高亮可吞噬的塔
canvas.addEventListener('mousemove', e => {
  if (state.upgradingTower) {
    const cell = getCell(e);
    if (cell) {
      const [r, c] = cell;
      const key = `${r},${c}`;
      const from = state.towers[state.upgradingTower];
      if (state.towers[key] && key !== state.upgradingTower && from) {
        canvas.style.cursor = state.towers[key].cfg.effect === from.cfg.effect ? 'copy' : 'not-allowed';
        return;
      }
    }
    canvas.style.cursor = 'cell';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    cancelPlacing();
    cancelUpgrade();
    hideTooltip();
  }
});

// ========== 按钮事件 ==========

// ── 主操作按钮：抽卡(初始/波间) / 开始游戏 / 下一波 / 进行中（多状态合一）
document.getElementById('main-action-btn').addEventListener('click', () => {
  const phase = state.phase;
  const tickets = state.drawTickets || 0;

  if (phase === 'idle' && tickets > 0) {
    // ─ 游戏未开始 + 仍有抽卡次数：直接打开抽卡弹窗（先布阵）
    openDrawModal();
  } else if (phase === 'idle' && tickets <= 0) {
    // ─ 游戏未开始 + 次数已用完：正式启动游戏
    setDifficultyBtnsDisabled(true);
    lastTime = performance.now();
    state.phase = 'transition';
    state.waveTimer = 0.1;
    showWaveTransition('游戏开始！');
    animId = requestAnimationFrame(gameLoop);
    updatePauseBtn();
    updateMainActionBtn();
  } else if (phase === 'waiting-draw' && tickets > 0) {
    // ─ 波次间有次数：打开抽卡弹窗
    openDrawModal();
  } else if (phase === 'waiting-draw' && tickets <= 0) {
    // ─ 波次间次数已用尽：开始下一波
    document.getElementById('wave-transition')?.classList.add('hidden');
    startWave();
  } else if (phase === 'transition') {
    state.waveTimer = 0;
  }
});

document.getElementById('speed-btn').addEventListener('click', () => {
  if (state.speedMult === 1) state.speedMult = 2;
  else if (state.speedMult === 2) state.speedMult = 4;
  else state.speedMult = 1;
  const btn = document.getElementById('speed-btn');
  // 显示当前实际倍速
  if (state.speedMult === 1) { btn.textContent = '⚡ 1x'; btn.classList.remove('active'); btn.style.background=''; }
  else if (state.speedMult === 2) { btn.textContent = '⚡ 2x'; btn.classList.add('active'); btn.style.background='linear-gradient(135deg,#f59e0b,#d97706)'; }
  else { btn.textContent = '⚡ 4x'; btn.classList.add('active'); btn.style.background='linear-gradient(135deg,#ef4444,#b91c1c)'; }
});

document.getElementById('draw-btn').addEventListener('click', openDrawModal);
// draw-upgrade-btn 已改为经验值自动升级，按钮已隐藏，保留空绑定避免报错
// document.getElementById('draw-upgrade-btn').addEventListener('click', upgradeDrawLevel);
document.getElementById('premium-draw-btn').addEventListener('click', openPremiumDrawModal);
document.getElementById('confirm-draw-btn').addEventListener('click', confirmDraw);
document.getElementById('refresh-draw-btn').addEventListener('click', refreshDraw);
// 抽卡弹窗关闭按钮：归还本次抽卡消耗的次数，恢复暂停状态
document.getElementById('draw-close-btn').addEventListener('click', () => {
  document.getElementById('draw-modal').classList.add('hidden');
  // 归还本次消耗的 ticket：只要存在旧牌（即已消耗过ticket但未确认），就归还1次
  if ((state.drawModalCards || []).length > 0) {
    state.drawTickets = (state.drawTickets || 0) + 1;
  }
  // 清空旧牌，确保下次打开重新生成新卡池
  state.drawModalCards = [];
  state.drawModalSelected = null;
  // 恢复抽卡前的暂停状态
  state.paused = state._pausedBeforeDraw || false;
  state._pausedBeforeDraw = undefined;
  updatePauseBtn();
  updateHUD(); // 同步主界面抽卡次数等显示
  updateMainActionBtn();
});
document.getElementById('cancel-upgrade-btn').addEventListener('click', cancelUpgrade);
document.getElementById('cancel-place-btn').addEventListener('click', cancelPlacing);

function doRestart() {
  document.querySelectorAll('.dmg-number, .coin-drop, .gold-popup, .exp-orb, .exp-popup').forEach(el => el.remove());
  document.getElementById('draw-modal').classList.add('hidden');
  document.getElementById('upgrade-banner').classList.add('hidden');
  document.getElementById('place-banner').classList.add('hidden');
  document.getElementById('tower-tooltip').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('wave-transition').classList.add('hidden');
  // 清除秘方弹窗（如果存在）
  const srOvl = document.getElementById('special-recipe-overlay');
  if (srOvl) srOvl.remove();
  setDrawBtnHighlight(false); // 清除抽卡高亮

  if (animId) { cancelAnimationFrame(animId); animId = null; }

  // 清空视觉列表
  lightningArcs = []; hailParticles = []; lavaWaves = []; coinBursts = [];

  currentStage = 1;
  WAVES = buildWavesForStage(currentStage);
  initState();
  updateHUD();
  updateNukeUI();
  renderRecipes();
  updateDrawCostDisplay();
  updatePauseBtn(); // 重置暂停按钮（禁用 + 重置文字）
  updateMainActionBtn();
  setDifficultyBtnsDisabled(false);
  draw();
}

// 继续按钮（隐藏关卡入口）已移除，30波通关直接结算

document.getElementById('overlay-btn').addEventListener('click', doRestart);
document.getElementById('overlay-next-btn').addEventListener('click', doNextStage);
document.getElementById('restart-btn').addEventListener('click', () => {
  doRestart();
});

// ========== 难度按钮 ==========
function setDifficultyBtnsDisabled(disabled) {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.disabled = disabled;
    if (disabled) {
      // 游戏开始后：只显示当前选中的难度
      btn.style.display = btn.classList.contains('selected') ? '' : 'none';
    } else {
      // 游戏结束/重置后：恢复显示所有难度
      btn.style.display = '';
    }
  });
}

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    selectedDifficulty = btn.dataset.diff;
    // 更新选中样式
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // 同步到state（如果还在idle阶段）
    if (state.phase === 'idle') {
      state.diffMult = DIFFICULTY_MULT[selectedDifficulty] || 1;
      state.difficulty = selectedDifficulty;
    }
  });
});


// ========== 功能3: 伤害数字弹出 ==========
function spawnDmgNumber(x, y, dmg, type = 'normal') {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / CANVAS_SIZE;
  const scaleY = rect.height / CANVAS_SIZE;
  const el = document.createElement('div');
  el.className = `dmg-number ${type}`;
  if (type === 'crit') {
    el.textContent = typeof dmg === 'string' ? dmg : `${Math.round(dmg)}!`;
  } else if (type === 'dot') {
    el.textContent = `-${Math.round(dmg)}`;
  } else {
    el.textContent = `-${Math.round(dmg)}`;
  }
  el.style.left = (rect.left + x * scaleX + (Math.random()-0.5)*20) + 'px';
  el.style.top  = (rect.top  + y * scaleY - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ========== 功能8: 金币掉落与拾取 ==========
// 自动拾取地图上所有掉落金币（关卡结束时调用）
function autoCollectCoins() {
  if (!state.coinDrops || state.coinDrops.length === 0) return;
  const pending = state.coinDrops.filter(({ el }) => el && !el.dataset.collected);
  state.coinDrops = [];
  // 每枚金币依次触发飞行动画，与手动拾取完全一致，每枚间隔 80ms
  pending.forEach(({ el, x, y, amount }, i) => {
    setTimeout(() => {
      collectCoin(el, x, y, parseInt(amount || 0));
    }, i * 80);
  });
}

function autoCollectExpOrbs() {
  if (!state.expOrbs || state.expOrbs.length === 0) return;
  const pending = state.expOrbs.filter(({ el }) => el && !el.dataset.collected);
  state.expOrbs = [];
  // 每颗经验球依次触发飞行动画，与手动拾取完全一致，每颗间隔 60ms
  pending.forEach(({ el, x, y }, i) => {
    setTimeout(() => {
      collectExpOrb(el, x, y);
    }, i * 60);
  });
}

function spawnCoinDrop(cx, cy, amount) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / CANVAS_SIZE;
  const scaleY = rect.height / CANVAS_SIZE;
  const el = document.createElement('div');
  el.className = 'coin-drop';
  el.textContent = '💰';
  el.dataset.amount = amount;
  const screenX = rect.left + cx * scaleX;
  const screenY = rect.top  + cy * scaleY;
  el.style.left = screenX + 'px';
  el.style.top  = screenY + 'px';
  document.body.appendChild(el);

  // 鼠标经过拾取
  el.addEventListener('mouseenter', () => collectCoin(el, screenX, screenY, amount));
  state.coinDrops.push({ el, x: screenX, y: screenY, amount });

  // ── Canvas 爆金币特效：弧线轨迹金币粒子
  const coinCount = Math.min(8, 3 + Math.floor(amount / 5));
  const coins = [];
  for (let i = 0; i < coinCount; i++) {
    const angle = (Math.random()-0.5) * Math.PI * 1.6 - Math.PI/2; // 大致向上扩散
    const spd   = 60 + Math.random() * 100;
    coins.push({
      x: cx, y: cy,
      vx: Math.cos(angle)*spd,
      vy: Math.sin(angle)*spd,
      life: 0.35 + Math.random()*0.25,
      maxLife: 0.6,
      size: 3 + Math.random()*2,
    });
  }
  coinBursts.push({ x: cx, y: cy, coins, life: 0.65 });
}

function collectCoin(el, fx, fy, amount) {
  if (el.dataset.collected) return;
  el.dataset.collected = '1';

  // 获取金币UI位置
  const goldEl = document.getElementById('gold-display');
  const goldRect = goldEl.getBoundingClientRect();
  const tx = goldRect.left + goldRect.width/2;
  const ty = goldRect.top  + goldRect.height/2;
  const dx = tx - fx, dy = ty - fy;

  el.style.setProperty('--fly-x', dx + 'px');
  el.style.setProperty('--fly-y', dy + 'px');
  el.classList.add('collected');

  setTimeout(() => {
    state.gold += parseInt(el.dataset.amount || 0);
    updateHUD();
    // +N 弹出
    const pop = document.createElement('div');
    pop.className = 'gold-popup';
    pop.textContent = `+${amount}💰`;
    pop.style.left = (goldRect.left - 10) + 'px';
    pop.style.top  = (goldRect.top - 10) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
    el.remove();
  }, 550);
}

// ========== 经验球掉落 ==========
function spawnExpOrb(cx, cy) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width  / CANVAS_SIZE;
  const scaleY = rect.height / CANVAS_SIZE;
  const el = document.createElement('div');
  el.className = 'exp-orb';
  el.textContent = '🟢';
  const screenX = rect.left + cx * scaleX;
  const screenY = rect.top  + cy * scaleY;
  el.style.left = screenX + 'px';
  el.style.top  = screenY + 'px';
  document.body.appendChild(el);

  // 鼠标经过拾取
  el.addEventListener('mouseenter', () => collectExpOrb(el, screenX, screenY));
  state.expOrbs.push({ el, x: screenX, y: screenY });

  // Canvas 爆绿色粒子特效
  const orbParticles = [];
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 70;
    orbParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      size: 2 + Math.random() * 2,
    });
  }
  coinBursts.push({ x: cx, y: cy, coins: orbParticles, life: 0.5, isExp: true });
}

function collectExpOrb(el, fx, fy) {
  if (el.dataset.collected) return;
  el.dataset.collected = '1';

  // 获取经验条UI位置（飞向经验条）
  const barEl = document.getElementById('exp-bar-fill');
  const barWrap = document.getElementById('exp-bar-wrap');
  const barRect = (barWrap || barEl || document.getElementById('exp-bar-label')).getBoundingClientRect();
  const tx = barRect.left + barRect.width / 2;
  const ty = barRect.top  + barRect.height / 2;
  const dx = tx - fx, dy = ty - fy;

  el.style.setProperty('--fly-x', dx + 'px');
  el.style.setProperty('--fly-y', dy + 'px');
  el.classList.add('collected');

  // 移除出 state.expOrbs
  const idx = state.expOrbs.findIndex(o => o.el === el);
  if (idx !== -1) state.expOrbs.splice(idx, 1);

  setTimeout(() => {
    gainExp(2);
    // +2EXP 浮动文字
    const pop = document.createElement('div');
    pop.className = 'exp-popup';
    pop.textContent = '+2 EXP';
    pop.style.left = (barRect.left + barRect.width / 2 - 20) + 'px';
    pop.style.top  = (barRect.top - 14) + 'px';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
    el.remove();
  }, 550);
}

// 鼠标移动时检查金币拾取（canvas上移动也能拾取）
canvas.addEventListener('mousemove', e => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
  // 检查所有coin-drop元素
  document.querySelectorAll('.coin-drop:not([data-collected])').forEach(coin => {
    const r = coin.getBoundingClientRect();
    if (e.clientX >= r.left-16 && e.clientX <= r.right+16 && e.clientY >= r.top-16 && e.clientY <= r.bottom+16) {
      collectCoin(coin, parseFloat(coin.style.left), parseFloat(coin.style.top), parseInt(coin.dataset.amount));
    }
  });
  // 检查所有exp-orb元素（鼠标划取）
  document.querySelectorAll('.exp-orb:not([data-collected])').forEach(orb => {
    const r = orb.getBoundingClientRect();
    if (e.clientX >= r.left-18 && e.clientX <= r.right+18 && e.clientY >= r.top-18 && e.clientY <= r.bottom+18) {
      collectExpOrb(orb, parseFloat(orb.style.left), parseFloat(orb.style.top));
    }
  });
});

// 右键取消各种操作模式
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (state.nukingMode) cancelNuke();
  else if (state.upgradingTower) cancelUpgrade();
  else if (state.placingTower) cancelPlacing();
});

// ========== 伤害统计面板 ==========
function updateDmgStats() {
  const list = document.getElementById('dmg-stats-list');
  if (!list) return;
  const towers = Object.entries(state.towers);
  if (towers.length === 0) {
    list.innerHTML = '<div style="color:#666;font-size:10px;text-align:center;padding:4px;">暂无伤害数据</div>';
    return;
  }
  // 按总伤害（物理+魔法）降序排列
  const sorted = towers
    .map(([key, t]) => ({
      key, t,
      dmg:   t.damageDealt || 0,
      phys:  t.physDmg  || 0,
      magic: t.magicDmg || 0,
    }))
    .filter(item => item.dmg > 0)
    .sort((a, b) => b.dmg - a.dmg);
  if (sorted.length === 0) {
    list.innerHTML = '<div style="color:#666;font-size:10px;text-align:center;padding:4px;">本关暂无伤害</div>';
    return;
  }
  const maxDmg = sorted[0].dmg;
  list.innerHTML = sorted.map(({ key, t, dmg, phys, magic }) => {
    const icon = t.cfg.icon || '🗼';
    const name = t.cfg.name || '未知';
    const lvl  = t.level || 1;
    const totalPct  = maxDmg > 0 ? (dmg   / maxDmg * 100) : 0;
    const physPct   = dmg   > 0 ? (phys  / dmg   * 100) : 0;
    const magicPct  = dmg   > 0 ? (magic / dmg   * 100) : 0;
    const dmgStr = dmg >= 10000 ? (dmg / 10000).toFixed(1) + '万' : Math.round(dmg).toString();
    return `<div style="margin-bottom:5px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
        <span style="color:#ddd;font-size:11px;">${icon} ${name}${t.isSpecial ? '' : ` <span style="color:#888;font-size:10px;">Lv${lvl}</span>`}</span>
        <span style="color:#fbbf24;font-size:11px;font-weight:bold;">${dmgStr}</span>
      </div>
      <div style="background:#1e293b;border-radius:3px;height:5px;overflow:hidden;display:flex;">
        <div style="width:${(totalPct * physPct / 100).toFixed(1)}%;height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444);flex-shrink:0;"></div>
        <div style="width:${(totalPct * magicPct / 100).toFixed(1)}%;height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);flex-shrink:0;"></div>
      </div>
    </div>`;
  }).join('');
}

// 每2秒刷新一次伤害统计
setInterval(updateDmgStats, 2000);

// ========== 初始化 ==========
window.addEventListener('load', () => {
  resizeCanvas();
  initState();
  updateHUD();
  renderRecipes();
  updateDrawCostDisplay(); // 含升级按钮费用刷新
  updatePauseBtn();        // 初始状态：禁用暂停按钮
  updateMainActionBtn();   // 初始化主操作按钮状态
  draw();
  lastTime = performance.now();
});

document.getElementById('special-recipe-btn').addEventListener('click', () => showSpecialRecipeModal());

// ========== 暂停按钮 ==========
function updatePauseBtn() {
  const btn = document.getElementById('pause-btn');
  if (!btn) return;
  const isIdle = !state || state.phase === 'idle';
  // 游戏未开始或已结束时禁用
  const isOver = state && (state.phase === 'victory' || state.phase === 'gameover');
  btn.disabled = isIdle || isOver;
  if (state && state.paused) {
    btn.textContent = '▶ 继续';
    btn.classList.add('active');
  } else {
    btn.textContent = '⏸ 暂停';
    btn.classList.remove('active');
  }
}

document.getElementById('pause-btn').addEventListener('click', () => {
  if (!state || state.phase === 'idle') return;
  if (state.phase === 'victory' || state.phase === 'gameover') return;
  // 抽卡/秘方期间不允许手动切换（由对应弹窗控制）
  state.paused = !state.paused;
  updatePauseBtn();
});

// 空格键快捷键暂停/继续
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    const btn = document.getElementById('pause-btn');
    if (btn && !btn.disabled) btn.click();
  }
});

// 抽卡界面"查看秘方"按钮已移除（秘方已内嵌于抽卡弹窗右侧）
document.getElementById('nuke-btn').addEventListener('click', buyNuke);
document.getElementById('cancel-nuke-btn').addEventListener('click', cancelNuke);

window.addEventListener('resize', resizeCanvas);

// ========== 特殊配方弹窗 ==========
// 当前展开的秘方卡片id（null=全部折叠）
let _srExpanded = null;

// onClose 为可选回调，关闭秘方界面时调用（例如从抽卡界面打开时，关闭后重显抽卡）
function showSpecialRecipeModal(onClose) {
  if (document.getElementById('special-recipe-overlay')) return; // 防止重复打开
  if (state._pausedBeforeDraw === undefined) {
    state._pausedBeforeDraw = state.paused; // 记录打开秘方前的暂停状态
  }
  state.paused = true; // 查看秘方时暂停游戏
  updatePauseBtn();
  const overlay = document.createElement('div');
  overlay.id = 'special-recipe-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9998;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#1a1226;border:2px solid #aa44ff;border-radius:14px;padding:0;width:min(96vw,900px);max-height:88vh;color:#fff;box-shadow:0 0 40px #aa44ff88;display:flex;flex-direction:column;">
      <div style="padding:12px 20px 10px;font-size:16px;font-weight:bold;color:#dd88ff;border-bottom:1px solid #7744aa55;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
        <span>✨ 配方详情</span>
        <button id="sr-close-btn" style="background:#555;color:#fff;border:none;border-radius:6px;padding:4px 14px;cursor:pointer;font-size:13px;">${onClose ? '← 返回抽卡' : '✕ 关闭'}</button>
      </div>
      <div id="sr-grid" style="padding:14px 16px;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;overflow-y:auto;"></div>
    </div>`;
  document.body.appendChild(overlay);
  const closeOverlay = () => {
    _srExpanded = null;
    overlay.remove();
    if (typeof onClose === 'function') {
      onClose(); // 从抽卡界面打开时，回到抽卡弹窗，保持 paused=true
    } else {
      // 恢复秘方打开前的暂停状态
      state.paused = state._pausedBeforeDraw || false;
      state._pausedBeforeDraw = undefined;
      updatePauseBtn();
    }
  };
  overlay.querySelector('#sr-close-btn').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  _renderSrGrid();
}

function _renderSrGrid() {
  const grid = document.getElementById('sr-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // ── 计算当前地图上已建造的塔（effect+level 集合，允许重复计数）
  const builtList = Object.values(state.towers || {}).map(t => ({
    effect: t.cfg.effect,
    level:  t.level || 1,
  }));

  // 判断一条配方的所有材料是否都在地图上存在
  function recipeCanCraft(recipe) {
    const pool = [...builtList];
    for (const req of recipe.ingredients) {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      if (idx === -1) return false;
      pool.splice(idx, 1); // 每个材料只匹配一次
    }
    return true;
  }

  // 判断配方是否"部分满足"（至少有1个材料已在地图上）
  function recipeHasAny(recipe) {
    const pool = [...builtList];
    for (const req of recipe.ingredients) {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      if (idx !== -1) return true;
    }
    return false;
  }

  SPECIAL_RECIPES.forEach(r => {
    const isOpen    = _srExpanded === r.id;
    // 判断是否已在地图上存在该特殊塔实例
    const isBuilt   = Object.values(state.towers || {}).some(t => t.cfg && t.cfg.effect === r.cfg.effect);
    const canCraft  = !isBuilt && recipeCanCraft(r);   // 未建造且材料全齐 → 可合成
    const hasAny    = !isBuilt && recipeHasAny(r);     // 有部分材料 → 正常
    // 四档显示：isBuilt=金色框已合成 | canCraft=绿框可合成 | hasAny=正常 | 都没有=暗沉

    // 解析材料（含每个材料是否已建造）
    const ingLines = r.ingredients.map(ing => {
      const tCfg = Object.values(TOWER_RECIPES).find(t => t.effect === ing.effect)
        || SPECIAL_RECIPES.find(sr => sr.cfg && sr.cfg.effect === ing.effect);
      const tName = tCfg ? (tCfg.name || tCfg.cfg?.name || ing.effect) : ing.effect;
      const tIcon = tCfg ? (tCfg.icon || tCfg.cfg?.icon || '?') : '?';
      // 此材料是否已在地图上存在
      const owned = builtList.some(t => t.effect === ing.effect && t.level === ing.level);
      return { icon: tIcon, name: tName, level: ing.level, owned };
    });

    // 卡片样式
    let bgColor, borderColor, boxShadow, opacity;
    if (isBuilt) {
      bgColor     = isOpen ? '#2a2200' : '#1a1600';
      borderColor = '#ffd700';
      boxShadow   = `0 0 18px #ffd70099`;
      opacity     = '1';
    } else if (canCraft) {
      bgColor     = isOpen ? '#1a3a1a' : '#0f2a0f';
      borderColor = '#44ff66';
      boxShadow   = `0 0 16px #44ff6688`;
      opacity     = '1';
    } else if (hasAny) {
      bgColor     = isOpen ? '#3a1a5e' : '#221533';
      borderColor = isOpen ? r.color : '#5a3a88';
      boxShadow   = isOpen ? `0 0 12px ${r.color}55` : 'none';
      opacity     = '1';
    } else {
      bgColor     = '#16101f';
      borderColor = '#3a2a4a';
      boxShadow   = 'none';
      opacity     = '0.45';
    }

    const card = document.createElement('div');
    card.style.cssText = `
      background:${bgColor};
      border:1.5px solid ${borderColor};
      border-radius:10px;padding:10px 8px;
      display:flex;flex-direction:column;gap:4px;
      cursor:pointer;transition:all 0.15s;
      box-shadow:${boxShadow};
      opacity:${opacity};`;

    // 状态徽标：已合成优先，其次可合成
    const craftBadge = isBuilt
      ? `<div style="text-align:center;font-size:9px;font-weight:bold;color:#ffd700;background:#33220088;border-radius:4px;padding:1px 4px;margin-bottom:2px;">⭐ 已合成</div>`
      : canCraft
        ? `<div style="text-align:center;font-size:9px;font-weight:bold;color:#44ff66;background:#00330088;border-radius:4px;padding:1px 4px;margin-bottom:2px;">✅ 可合成</div>`
        : '';

    // 折叠态：图标 + 名字 + 材料
    let innerHtml = craftBadge + `
      <div style="font-size:24px;text-align:center;line-height:1.1;">${r.icon}</div>
      <div style="font-size:12px;font-weight:bold;color:${isBuilt ? '#ffd700' : canCraft ? '#88ff99' : r.color};text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
      <div style="display:flex;flex-direction:column;gap:2px;margin-top:2px;">`;

    ingLines.forEach(ing => {
      // 已拥有的材料行：绿色高亮；缺少的材料：暗灰色
      const rowColor  = ing.owned ? '#88ffaa' : '#887799';
      const lvBg      = ing.owned ? '#22663388' : '#44226688';
      const lvColor   = ing.owned ? '#aaffcc'   : '#ddaaff';
      const checkMark = ing.owned ? '✓ ' : '';
      innerHtml += `<div style="display:flex;align-items:center;gap:3px;font-size:10px;color:${rowColor};">
        <span style="font-size:11px;">${ing.icon}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${checkMark}${ing.name}</span>
        <span style="background:${lvBg};border-radius:3px;padding:0 3px;color:${lvColor};flex-shrink:0;">Lv${ing.level}</span>
      </div>`;
    });
    innerHtml += `</div>`;

    // 展开态：追加详细介绍
    if (isOpen) {
      innerHtml += `<div style="margin-top:6px;border-top:1px solid #7744aa55;padding-top:6px;font-size:10px;color:#ccc;line-height:1.5;">${r.desc}</div>`;
      innerHtml += `<div style="font-size:9px;color:#aa88cc;margin-top:2px;text-align:center;">▲ 点击收起</div>`;
    } else {
      innerHtml += `<div style="font-size:9px;color:#7755aa;margin-top:2px;text-align:center;">▼ 点击查看详情</div>`;
    }
    card.innerHTML = innerHtml;
    card.addEventListener('click', () => {
      _srExpanded = isOpen ? null : r.id;
      _renderSrGrid();
    });
    grid.appendChild(card);
  });
}

function hideTowerTooltip() {
  document.getElementById('tower-tooltip').classList.add('hidden');
  state.selectedTowerKey = null;
}

// ========== GM 面板 ==========
document.getElementById('help-btn').addEventListener('click', () => {
  document.getElementById('help-modal').classList.remove('hidden');
});
document.getElementById('help-close-btn').addEventListener('click', () => {
  document.getElementById('help-modal').classList.add('hidden');
});
document.getElementById('help-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('help-modal')) {
    document.getElementById('help-modal').classList.add('hidden');
  }
});

document.getElementById('gm-btn').addEventListener('click', () => {
  document.getElementById('gm-panel').classList.toggle('hidden');
});
document.getElementById('gm-close-btn').addEventListener('click', () => {
  document.getElementById('gm-panel').classList.add('hidden');
});
document.getElementById('gm-gold-btn').addEventListener('click', () => {
  state.gold += 999;
  updateHUD();
  spawnGoldPopup('+999💰 GM加金');
});
document.getElementById('gm-exp-btn').addEventListener('click', () => {
  gainExp(100);
  spawnGoldPopup('⭐ GM +100 经验');
});
document.getElementById('gm-skip-wave20-btn').addEventListener('click', () => {
  // 若游戏未开始则提示
  if (state.phase === 'idle') {
    spawnGoldPopup('⚠️ 请先开始游戏');
    return;
  }
  // 清除场上所有怪物
  state.monsters.forEach(m => { m.dead = true; });
  state.monsters = [];
  state.projectiles = [];
  // 跳至第29关完成状态（下一波即为第30关）
  state.wave = 29;
  state.spawnQueue = 0;
  // 进入 transition 状态，倒计时后自动触发 startWave() 开始第30关
  state.phase = 'transition';
  state.waveTimer = 1.5;
  updateHUD();
  document.getElementById('gm-panel').classList.add('hidden');
  showWaveTransition('⏩ GM：即将开始第 30 波...');
  spawnGoldPopup('⏩ GM：跳至第30关');
});

document.getElementById('gm-clear-btn').addEventListener('click', () => {
  state.monsters.forEach(m => {
    if (!m.dead) {
      m.dead = true;
      // 死亡粒子效果
      for (let i = 0; i < 10; i++) {
        state.particles.push(new Particle(
          m.x, m.y,
          (Math.random()-0.5)*160, (Math.random()-0.5)*160,
          m.isBoss ? '#ffd700' : '#ff6655',
          Math.random()*5+3, 0.6
        ));
      }
    }
  });
  state.monsters = [];
  state.projectiles = [];
  spawnGoldPopup('🧹 GM清屏完成');
});

// ========== GM：生成塔 ==========
document.getElementById('gm-spawn-btn').addEventListener('click', () => {
  // 关闭GM主面板，打开二级选择面板
  document.getElementById('gm-panel').classList.add('hidden');
  openGmSpawnPanel();
});

document.getElementById('gm-spawn-close-btn').addEventListener('click', () => {
  document.getElementById('gm-spawn-panel').classList.add('hidden');
});

/** 构建并展示 GM 生成塔选择面板 */
function openGmSpawnPanel() {
  const panel = document.getElementById('gm-spawn-panel');
  const list  = document.getElementById('gm-spawn-list');
  list.innerHTML = '';

  // ---- 基础塔（5种×6级）----
  const maxLvShow = 6; // GM不受玩家等级限制，全显示Lv1-6

  Object.entries(BASE_TOWER_DEFS).forEach(([type, baseDef]) => {
    for (let lv = 1; lv <= maxLvShow; lv++) {
      const cfg = getBaseTowerCfg(type, lv);
      const btn = document.createElement('button');
      btn.style.cssText = `
        background:#1a2a1a; border:1.5px solid ${cfg.color};
        border-radius:8px; padding:7px 10px; cursor:pointer;
        color:#fff; text-align:left; font-size:12px;
        display:flex; align-items:center; gap:6px;
        transition:background 0.15s;
      `;
      btn.innerHTML = `<span style="font-size:16px">${cfg.icon}</span>
        <span>
          <span style="color:${cfg.color};font-weight:bold">${cfg.name}</span>
          <span style="color:#aaa;font-size:11px"> Lv${lv}</span>
        </span>`;
      btn.addEventListener('mouseenter', () => { btn.style.background = '#223322'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#1a2a1a'; });
      btn.addEventListener('click', () => {
        startGmSpawnPlace(cfg, lv);
        document.getElementById('gm-spawn-panel').classList.add('hidden');
      });
      list.appendChild(btn);
    }
  });

  // ---- 特殊塔（SPECIAL_RECIPES），固定Lv1 ----
  SPECIAL_RECIPES.forEach(recipe => {
    const cfg = recipe.cfg;
    const btn = document.createElement('button');
    btn.style.cssText = `
      background:#1a1a2a; border:2px solid ${recipe.color};
      border-radius:8px; padding:7px 10px; cursor:pointer;
      color:#fff; text-align:left; font-size:12px;
      display:flex; align-items:center; gap:6px;
      grid-column: span 2;
      transition:background 0.15s;
    `;
    btn.innerHTML = `<span style="font-size:18px">${recipe.icon}</span>
      <span>
        <span style="color:${recipe.color};font-weight:bold">${recipe.name}</span>
        <span style="color:#888;font-size:11px"> [特殊]</span>
        <span style="color:#666;font-size:10px;display:block;margin-top:1px">${recipe.desc}</span>
      </span>`;
    btn.addEventListener('mouseenter', () => { btn.style.background = '#1a1a3a'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#1a1a2a'; });
    btn.addEventListener('click', () => {
      startGmSpawnPlace(cfg, 1, true);
      document.getElementById('gm-spawn-panel').classList.add('hidden');
    });
    list.appendChild(btn);
  });

  panel.classList.remove('hidden');
}

/**
 * 进入GM放置模式
 * @param {object} cfg      — TOWER_RECIPES 中的 cfg 或特殊塔 cfg
 * @param {number} level    — 期望放置等级
 * @param {boolean} special — 是否为特殊塔
 */
function startGmSpawnPlace(cfg, level, special = false) {
  state.placingTower = {
    cfg: cfg,
    baseCfg: cfg,
    startLevel: level,
    gmMode: true,   // 标记为GM放置，不消耗金币
  };
  document.getElementById('place-banner').classList.remove('hidden');
  document.getElementById('upgrade-banner').classList.add('hidden');
  canvas.style.cursor = 'crosshair';
  // 关闭Tooltip
  hideTowerTooltip();
  spawnGoldPopup(`\uD83C\uDFD7\uFE0F GM放置模式：${cfg.name} Lv${level}`);
}

// ========== 经验条悬停 Tooltip：各等级抽卡概率 ==========
(function initExpLevelTooltip() {
  // 各玩家等级对应精灵塔级别的出现概率（文字描述）
  const LEVEL_PROBS = [
    { lv: 1, label: 'Lv 1',  probs: [{ stars: 1, pct: '100%' }] },
    { lv: 2, label: 'Lv 2',  probs: [{ stars: 1, pct: '50%' }, { stars: 2, pct: '50%' }] },
    { lv: 3, label: 'Lv 3',  probs: [{ stars: 1, pct: '30%' }, { stars: 2, pct: '40%' }, { stars: 3, pct: '30%' }] },
    { lv: 4, label: 'Lv 4',  probs: [{ stars: 1, pct: '15%' }, { stars: 2, pct: '25%' }, { stars: 3, pct: '40%' }, { stars: 4, pct: '20%' }] },
    { lv: 5, label: 'Lv 5',  probs: [{ stars: 1, pct: '10%' }, { stars: 2, pct: '15%' }, { stars: 3, pct: '30%' }, { stars: 4, pct: '25%' }, { stars: 5, pct: '20%' }] },
  ];

  function buildTooltipHTML(currentLv) {
    let html = `<div class="elt-title">⭐ 各等级抽卡概率</div>`;
    LEVEL_PROBS.forEach(row => {
      const isActive = row.lv === currentLv;
      const probsHtml = row.probs.map(p => {
        const stars = '★'.repeat(p.stars);
        return `<span class="elt-prob-item"><span class="elt-stars">${stars}</span><span class="elt-pct">${p.pct}</span></span>`;
      }).join('');
      html += `
        <div class="elt-row${isActive ? ' active' : ''}">
          <span class="elt-lv">${row.label}${isActive ? ' ◀ 当前' : ''}</span>
          <div class="elt-probs">${probsHtml}</div>
        </div>`;
    });
    return html;
  }

  const wrap    = document.getElementById('exp-bar-wrap');
  const tooltip = document.getElementById('exp-level-tooltip');
  if (!wrap || !tooltip) return;

  wrap.addEventListener('mouseenter', () => {
    const pl = (state && state.playerLevel) || 1;
    tooltip.innerHTML = buildTooltipHTML(pl);
    tooltip.classList.remove('hidden');

    // 定位：紧靠 exp-bar-wrap 上方，左对齐
    const rect = wrap.getBoundingClientRect();
    const ttH  = 250; // 预估高度
    let top  = rect.top - ttH - 6;
    let left = rect.left;
    // 防止超出屏幕右边
    if (left + 192 > window.innerWidth - 8) left = window.innerWidth - 200;
    // 防止超出顶部（退化到下方）
    if (top < 8) top = rect.bottom + 6;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
  });

  wrap.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
  });

  // 鼠标在 wrap 上移动时，实时刷新当前等级（升级时立即反映）
  wrap.addEventListener('mousemove', () => {
    const pl = (state && state.playerLevel) || 1;
    const rows = tooltip.querySelectorAll('.elt-row');
    rows.forEach((row, i) => {
      row.classList.toggle('active', i + 1 === pl);
      const lvEl = row.querySelector('.elt-lv');
      if (lvEl) {
        lvEl.textContent = `Lv ${i + 1}${i + 1 === pl ? ' ◀ 当前' : ''}`;
      }
    });
  });
})();

// ========== 抽卡按钮高亮（兼容旧调用，已不再使用主 draw-btn）==========
function setDrawBtnHighlight(on) {
  // draw-btn 已合并至 main-action-btn，此函数保留以防旧代码残留调用
  updateMainActionBtn();
}

// ========== 主操作按钮：多状态管理 ==========
// 状态说明：
//   idle          → ▶ 开始游戏（绿色）
//   build(地图4)  → 建造中...（灰色禁用，battle-btn 可用）
//   spawning      → ⏳ 进行中...（灰色禁用）
//   transition    → ⏳ 进行中...（灰色禁用）
//   waiting-draw + tickets>0 → 🎴 抽卡（剩X次）（高亮脉冲）
//   waiting-draw + tickets=0 → ⚔️ 下一波（红色）
//   victory/gameover → 隐藏
function updateMainActionBtn() {
  const btn = document.getElementById('main-action-btn');
  if (!btn) return;
  const phase = state ? state.phase : 'idle';
  const tickets = state ? (state.drawTickets || 0) : 0;

  // 重置所有状态类
  btn.classList.remove('main-btn-start', 'main-btn-draw', 'main-btn-next', 'main-btn-disabled');
  btn.disabled = false;

  if (!state || phase === 'idle') {
    if (tickets > 0) {
      // idle 阶段仍有抽卡次数：显示抽卡按钮（带脉冲）
      btn.textContent = `🎴 抽卡（剩${tickets}次）`;
      btn.className = 'big-btn main-btn-draw';
      btn.disabled = false;
    } else {
      // idle 阶段次数已用完：显示开始游戏
      btn.textContent = '▶ 开始游戏';
      btn.className = 'big-btn main-btn-start';
      btn.disabled = false;
    }
  } else if (phase === 'build') {
    // 地图4专属建造阶段
    btn.textContent = '🏗️ 建造中...';
    btn.className = 'big-btn main-btn-disabled';
    btn.disabled = true;
  } else if (phase === 'spawning' || phase === 'transition') {
    btn.textContent = '⏳ 进行中...';
    btn.className = 'big-btn main-btn-disabled';
    btn.disabled = true;
  } else if (phase === 'waiting-draw') {
    if (tickets > 0) {
      btn.textContent = `🎴 抽卡（剩${tickets}次）`;
      btn.className = 'big-btn main-btn-draw';
      btn.disabled = false;
    } else {
      btn.textContent = '⚔️ 下一波';
      btn.className = 'big-btn main-btn-next';
      btn.disabled = false;
    }
  } else if (phase === 'victory' || phase === 'gameover') {
    btn.textContent = '⏳ 游戏结束';
    btn.className = 'big-btn main-btn-disabled';
    btn.disabled = true;
  } else {
    btn.textContent = '⏳ 进行中...';
    btn.className = 'big-btn main-btn-disabled';
    btn.disabled = true;
  }
}

// ========== 抽卡弹窗右侧：内嵌秘方面板 ==========
// 高亮当前抽卡手牌中的塔（effect+level）
let _drawHighlightEffect = null; // { effect, level } | null

function renderDrawInlineRecipe(highlightEffect, highlightLevel) {
  const grid = document.getElementById('draw-inline-recipe');
  if (!grid) return;
  grid.innerHTML = '';

  // 已建造的塔集合
  const builtList = Object.values(state.towers || {}).map(t => ({
    effect: t.cfg.effect, level: t.level || 1,
  }));

  // 当前抽卡手牌集合（用于辅助判断"手牌中有"）
  const handList = (state.drawModalCards || []).map(c => {
    const cfg = getBaseTowerCfg(c.type, c.level);
    return cfg ? { effect: cfg.effect, level: c.level } : null;
  }).filter(Boolean);

  // 判断材料是否已满足（建造+手牌各计一次）
  function recipeCanCraft(r) {
    const pool = [...builtList];
    for (const req of r.ingredients) {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      if (idx === -1) return false;
      pool.splice(idx, 1);
    }
    return true;
  }

  SPECIAL_RECIPES.forEach(r => {
    const isBuilt  = Object.values(state.towers || {}).some(t => t.cfg && t.cfg.effect === r.cfg.effect);
    const canCraft = !isBuilt && recipeCanCraft(r);

    // 是否含有高亮塔
    const isHighlighted = highlightEffect
      ? r.ingredients.some(ing => ing.effect === highlightEffect && ing.level === highlightLevel)
      : false;

    // 解析每个材料的拥有情况
    const pool = [...builtList];
    const ingStatus = r.ingredients.map(req => {
      const idx = pool.findIndex(t => t.effect === req.effect && t.level === req.level);
      const owned = idx !== -1;
      if (owned) pool.splice(idx, 1);
      // 是否为手牌中的高亮塔
      const isThisCard = (req.effect === highlightEffect && req.level === highlightLevel);
      return { ...req, owned, isThisCard };
    });

    // 外框样式
    let border, bg, shadow;
    if (isBuilt) {
      border = '#ffd700'; bg = '#1a1600'; shadow = '0 0 10px #ffd70066';
    } else if (canCraft) {
      border = '#44ff66'; bg = '#0f2a0f'; shadow = '0 0 10px #44ff6666';
    } else if (isHighlighted) {
      border = '#cc88ff'; bg = '#2a1840'; shadow = `0 0 10px ${r.color}55`;
    } else {
      border = '#3a2a4a'; bg = '#16101f'; shadow = 'none';
    }

    const card = document.createElement('div');
    // 5列布局：减少水平 padding，高度/字号保持原来大小
    card.style.cssText = `
      background:${bg};border:1.5px solid ${border};border-radius:8px;
      padding:8px 4px;display:flex;flex-direction:column;gap:3px;
      box-shadow:${shadow};opacity:${isBuilt||canCraft||isHighlighted ? 1 : 0.45};
      transition:all 0.15s;cursor:default;overflow:hidden;
    `;

    // 状态徽章（原字号，左右紧凑）
    const badge = isBuilt
      ? `<div style="font-size:9px;color:#ffd700;background:#33220088;border-radius:3px;padding:1px 2px;text-align:center;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">⭐ 已合成</div>`
      : canCraft
        ? `<div style="font-size:9px;color:#44ff66;background:#00330088;border-radius:3px;padding:1px 2px;text-align:center;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">✅ 可合成</div>`
        : '';

    // 材料列表：图标 + 名字（截断）+ 等级；合成塔材料不显示等级
    // 预构建合成塔 effect 集合，用于快速判断
    const specialEffectSet = new Set(SPECIAL_RECIPES.map(sr => sr.cfg?.effect).filter(Boolean));
    // 排序：普通塔按 level 升序，合成塔排在最后
    const sortedIngStatus = [...ingStatus].sort((a, b) => {
      const aIsSpecial = specialEffectSet.has(a.effect);
      const bIsSpecial = specialEffectSet.has(b.effect);
      if (aIsSpecial !== bIsSpecial) return aIsSpecial ? 1 : -1;
      return a.level - b.level;
    });
    let ingHtml = '';
    sortedIngStatus.forEach(ing => {
      const tCfg = Object.values(TOWER_RECIPES).find(t => t.effect === ing.effect)
        || SPECIAL_RECIPES.find(sr => sr.cfg && sr.cfg.effect === ing.effect);
      const tName = tCfg ? (tCfg.name || tCfg.cfg?.name || ing.effect) : ing.effect;
      const tIcon = tCfg ? (tCfg.icon || tCfg.cfg?.icon || '?') : '?';
      const rowColor  = ing.isThisCard ? '#ffee55' : ing.owned ? '#88ffaa' : '#887799';
      const checkMark = ing.isThisCard ? '★ ' : ing.owned ? '✓ ' : '';
      // 合成塔（秘方产物）不显示等级，普通塔显示
      const isSpecialTower = specialEffectSet.has(ing.effect);
      const levelTag = isSpecialTower
        ? ''
        : `<span style="color:#ddaaff;flex-shrink:0;">L${ing.level}</span>`;
      ingHtml += `<div style="display:flex;align-items:center;gap:2px;font-size:9.5px;color:${rowColor};">
        <span style="flex-shrink:0;">${tIcon}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">${checkMark}${tName}</span>
        ${levelTag}
      </div>`;
    });

    card.innerHTML = badge + `
      <div style="font-size:20px;text-align:center;line-height:1;">${r.icon}</div>
      <div style="font-size:11px;font-weight:bold;color:${isBuilt?'#ffd700':canCraft?'#88ff99':r.color};text-align:center;
           white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
      <div style="display:flex;flex-direction:column;gap:1px;margin-top:2px;">${ingHtml}</div>
    `;
    grid.appendChild(card);
  });
}
