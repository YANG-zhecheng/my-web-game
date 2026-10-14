// ===== 装备数据表 & 品质系统 =====

// ── 5品质定义 ──
const QUALITY = {
  white:  { key:'white',  label:'白色', color:'#c8c8c8', border:'#aaaaaa', glow:'rgba(200,200,200,0.4)', bgStart:'rgba(40,40,40,0.9)',   bgEnd:'rgba(60,60,60,0.9)',   sellBase:25  },
  green:  { key:'green',  label:'绿色', color:'#44dd66', border:'#22bb44', glow:'rgba(68,221,102,0.5)', bgStart:'rgba(10,40,15,0.92)',  bgEnd:'rgba(20,60,25,0.92)',  sellBase:50  },
  blue:   { key:'blue',   label:'蓝色', color:'#44aaff', border:'#2277ee', glow:'rgba(68,170,255,0.5)', bgStart:'rgba(5,20,50,0.93)',   bgEnd:'rgba(10,35,70,0.93)',  sellBase:100 },
  purple: { key:'purple', label:'紫色', color:'#cc66ff', border:'#aa33ee', glow:'rgba(204,102,255,0.5)','bgStart':'rgba(30,5,50,0.93)', bgEnd:'rgba(50,10,75,0.93)',  sellBase:200 },
  orange: { key:'orange', label:'橙色', color:'#ff9933', border:'#ee6600', glow:'rgba(255,153,51,0.6)', bgStart:'rgba(50,20,0,0.94)',   bgEnd:'rgba(75,30,0,0.94)',   sellBase:400 },
};

// 兼容旧代码：将旧品质键 normal/rare/epic/legend 映射到新品质
const QUALITY_COMPAT = { normal:'white', rare:'green', epic:'blue', legend:'purple' };

// ── 槽位类型映射（中文名 → 槽位key）──
// 饰品统一映射到 'acc'（通配），装备时由背包逻辑自动选 acc1/acc2
const SLOT_BY_NAME = { '武器':'weapon','头饰':'head','盔甲':'armor','鞋子':'boots','饰品':'acc' };

// ── 槽位对应默认图标 & 默认置灰图标 ──
const SLOT_ICON = {
  weapon: '🏏',
  head:   '🪖',
  armor:  '🧥',
  boots:  '👢',
  acc1:   '💍',
  acc2:   '📿',
  acc:    '💍', // 通用饰品（兼容旧数据）
};

/** 根据槽位获取图标 */
function getSlotIcon(slot) { return SLOT_ICON[slot] || '📦'; }

// ── 解析效果字符串 → 属性对象 ──
// 效果格式："攻击+N" | "防御+N" | "移动+N%" | "闪避+N%" | "血量+N"
//           "攻速+N%" | "减伤+N%" | "回血+N/s" | "暴击+N%"
function parseEffect(effectStr) {
  const attrs = {};
  const parts = effectStr.split(/[，,]/);
  parts.forEach(part => {
    part = part.trim();
    // 匹配 "回血+N/s" 格式
    const regenM = part.match(/^回血([+\-])(\d+)\/s$/);
    if (regenM) {
      const val = (regenM[1] === '-' ? -1 : 1) * Number(regenM[2]);
      attrs['hpRegen'] = (attrs['hpRegen'] || 0) + val;
      return;
    }
    const m = part.match(/^(.+?)([+\-])(\d+)(%?)$/);
    if (!m) return;
    const [, key, sign, numStr, pct] = m;
    const val = (sign === '-' ? -1 : 1) * Number(numStr) * (pct === '%' ? 0.01 : 1);
    const keyMap = {
      '攻击':'atk', '防御':'armor', '移动':'speed', '移速':'speed', '闪避':'dodge',
      '血量':'hp',  '魔法':'mp',
      '攻速':'atkSpeedBonus', '减伤':'damageReduction', '增伤':'dmgBonus', '暴击':'critBonus', '溅射':'splashBonus',
    };
    const attrKey = keyMap[key];
    if (attrKey) attrs[attrKey] = (attrs[attrKey] || 0) + val;
  });
  return attrs;
}

// ── 推断槽位 ──
function inferSlot(name, effectStr) {
  // 白色
  if (['木棍'].includes(name))                                                                                     return 'weapon';
  if (['破帽','草帽'].includes(name))                                                                              return 'head';
  if (['破衣','布衣'].includes(name))                                                                              return 'armor';
  if (['破鞋','草鞋'].includes(name))                                                                              return 'boots';
  if (['牛鼻环','腰带'].includes(name))                                                                            return 'acc';
  // 绿色
  if (['铁棍'].includes(name))                                                                                     return 'weapon';
  if (['官帽'].includes(name))                                                                                     return 'head';
  if (['官衣','水甲'].includes(name))                                                                              return 'armor';
  if (['官靴','水靴'].includes(name))                                                                              return 'boots';
  if (['铁鼻环','钢鼻环','铁带子'].includes(name))                                                                return 'acc';
  // 蓝色
  if (['如意棒'].includes(name))                                                                                   return 'weapon';
  if (['马头盔','冰帽'].includes(name))                                                                            return 'head';
  if (['龟甲','龙甲','鬼衣','魔甲','冰甲'].includes(name))                                                       return 'armor';
  if (['夜叉鞋','龙靴','牛皮靴','牛王靴','银角靴','冰靴'].includes(name))                                       return 'boots';
  if (['钢腰带','牛王鼻环'].includes(name))                                                                       return 'acc';
  // 紫色
  if (['金箍棒','紫金神棒'].includes(name))                                                                       return 'weapon';
  if (['凤翅紫金冠','龙头冠'].includes(name))                                                                     return 'head';
  if (['黄金战甲','魔龙甲','冰霜战甲'].includes(name))                                                           return 'armor';
  if (['银牛靴','金牛靴'].includes(name))                                                                         return 'boots';
  if (['金腰带','银光神牛环','龙角环','芭蕉扇','冰心','冰龙之眼','冰霜法杖'].includes(name))                    return 'acc';
  // 金色（极寒战魂等）
  if (['极寒战魂'].includes(name))                                                                                return 'acc';
  // 橙色
  if (['毗卢帽'].includes(name))                                                                                  return 'head';
  if (['如来袈裟'].includes(name))                                                                                return 'armor';
  if (['莲花宝靴','筋斗云靴'].includes(name))                                                                    return 'boots';
  if (['定海神针'].includes(name))                                                                                  return 'weapon';
  if (['混天绫','七十二变','紫金葫芦','降妖宝塔','太白浮尘'].includes(name))                                      return 'acc';
  if (['玉皇宝冠'].includes(name))                                                                                    return 'head';
  // 后备：按效果推断
  if (effectStr.includes('攻击'))                                                                                  return 'weapon';
  if (effectStr.includes('移动') || effectStr.includes('移速') || effectStr.includes('闪避'))                   return 'boots';
  if (effectStr.includes('血量'))                                                                                  return 'acc';
  return 'armor';
}

// ── 品质key中文转换 ──
const QUALITY_CN = { '白':'white','绿':'green','蓝':'blue','紫':'purple','橙':'orange','金':'orange' };

// ── 装备原始数据（来自装备表.xlsx v1.9，全量）──
const EQUIP_RAW = [
  // ── 白色 ──
  { id: 1, name:'木棍',       quality:'白', effect:'攻击+10'                                   },
  { id: 2, name:'破帽',       quality:'白', effect:'防御+60'                                   },
  { id: 3, name:'草帽',       quality:'白', effect:'防御+40'                                   },
  { id: 4, name:'破衣',       quality:'白', effect:'血量+200'                                   },
  { id: 5, name:'布衣',       quality:'白', effect:'血量+400'                                   },
  { id: 6, name:'草鞋',       quality:'白', effect:'防御+50,移速+30%'                          },
  { id: 7, name:'破鞋',       quality:'白', effect:'防御+30,移速+15%'                          },
  { id: 8, name:'牛鼻环',     quality:'白', effect:'攻击+12'                                   },
  { id: 9, name:'腰带',       quality:'白', effect:'血量+200,回血+10/s'                        },
  // ── 绿色 ──
  { id:10, name:'铁棍',       quality:'绿', effect:'攻击+50,攻速+30%'                          },
  { id:11, name:'官帽',       quality:'绿', effect:'防御+100,血量+150'                         },
  { id:12, name:'官衣',       quality:'绿', effect:'血量+600,减伤+20%'                         },
  { id:13, name:'官靴',       quality:'绿', effect:'防御+75,攻速+30%,移速+40%'                },
  { id:14, name:'铁鼻环',     quality:'绿', effect:'攻击+25,暴击+5%'                           },
  { id:15, name:'铁带子',     quality:'绿', effect:'血量+400,回血+20/s'                        },
  { id:16, name:'水甲',       quality:'绿', effect:'防御+100,闪避+5%'                          },
  { id:17, name:'水靴',       quality:'绿', effect:'防御+50,攻速+35%,移速+45%'                },
  // ── 蓝色 ──
  { id:18, name:'钢鼻环',     quality:'蓝', effect:'攻击+40,暴击+10%'                          },
  { id:19, name:'钢腰带',     quality:'蓝', effect:'血量+600,攻速+20%,回血+25/s'              },
  { id:20, name:'如意棒',     quality:'蓝', effect:'攻击+120,攻速+80%,溅射+30%'               },
  { id:21, name:'龟甲',       quality:'蓝', effect:'防御+250,移速-15%'                         },
  { id:22, name:'夜叉鞋',     quality:'蓝', effect:'防御+150,移速+15%'                         },
  { id:23, name:'龙甲',       quality:'蓝', effect:'防御+300,血量+1000'                        },
  { id:24, name:'龙靴',       quality:'蓝', effect:'防御+150,攻速+40%,移速+45%'               },
  { id:25, name:'牛皮靴',     quality:'蓝', effect:'防御+300,移速+15%'                         },
  { id:26, name:'马头盔',     quality:'蓝', effect:'防御+300,血量+300'                         },
  { id:27, name:'鬼衣',       quality:'蓝', effect:'防御+50,血量+1000'                         },
  { id:28, name:'魔甲',       quality:'蓝', effect:'防御+400,血量+1000'                        },
  { id:29, name:'牛王靴',     quality:'蓝', effect:'防御+300,暴击+5%'                          },
  { id:30, name:'银角靴',     quality:'蓝', effect:'防御+300,血量+600'                         },
  { id:31, name:'牛王鼻环',   quality:'蓝', effect:'攻击+100,暴击+10%'                         },
  { id:32, name:'冰帽',       quality:'蓝', effect:'防御+300,血量+600'                         },
  { id:33, name:'冰甲',       quality:'蓝', effect:'防御+300,血量+600'                         },
  { id:34, name:'冰靴',       quality:'蓝', effect:'防御+300,移速+35%'                         },
  // ── 紫色 ──
  { id:35, name:'龙头冠',     quality:'紫', effect:'暴击+25%,防御+400,血量+1000,回血+60/s'    },
  { id:36, name:'龙角环',     quality:'紫', effect:'攻击+80,暴击+20%'                          },
  { id:37, name:'魔龙甲',     quality:'紫', effect:'防御+800,血量+2500'                        },
  { id:38, name:'金腰带',     quality:'紫', effect:'血量+1000,攻速+50%,回血+25/s,减伤+20%'   },
  { id:39, name:'银牛靴',     quality:'紫', effect:'防御+600,暴击+5%,攻速+50%,移速+50%'      },
  { id:40, name:'金牛靴',     quality:'紫', effect:'防御+600,血量+1000,攻速+50%,移速+60%'    },
  { id:41, name:'银光神牛环', quality:'紫', effect:'攻击+200,暴击+20%,回血+100/s'             },
  { id:42, name:'紫金神棒',   quality:'紫', effect:'攻击+350,攻速+100%,暴击+40%,溅射+30%'    },
  { id:43, name:'凤翅紫金冠', quality:'紫', effect:'防御+800,血量+2500'                        },
  { id:44, name:'黄金战甲',   quality:'紫', effect:'防御+800,血量+2500'                        },
  { id:45, name:'芭蕉扇',     quality:'紫', effect:'防御+800,血量+2500'                        },
  { id:46, name:'冰心',       quality:'紫', effect:'防御+600,血量+1000,减伤+15%'              },
  { id:47, name:'冰龙之眼',   quality:'紫', effect:'攻击+180,攻速+25%,暴击+20%'               },
  { id:48, name:'冰霜战甲',   quality:'紫', effect:'防御+800,血量+2500'                        },
  { id:49, name:'冰霜法杖',   quality:'紫', effect:'防御+600,攻速+50%'                         },
  // ── 橙色 ──
  { id:50, name:'极寒战魂',   quality:'橙', effect:'防御+800,血量+2500,攻速+75%,减伤+25%'    },
  { id:51, name:'莲花宝靴',   quality:'橙', effect:'防御+800,血量+2500'                        },
  { id:52, name:'定海神针',   quality:'橙', effect:'攻击+800,攻速+150%,暴击+50%,溅射+30%'    },
  { id:53, name:'混天绫',     quality:'橙', effect:'防御+800,血量+2500'                        },
  { id:54, name:'毗卢帽',     quality:'橙', effect:'防御+1200,血量+8000,增伤+30%'              },
  { id:55, name:'如来袈裟',   quality:'橙', effect:'防御+3000,血量+15000,减伤+30%'             },
  { id:56, name:'筋斗云靴',   quality:'橙', effect:'防御+500,移速+75%,闪避+25%'                },
  { id:57, name:'七十二变',   quality:'橙', effect:'攻击+80,闪避+30%,防御+50'                  },
  { id:58, name:'紫金葫芦',   quality:'橙', effect:'血量+8000,防御+60'                          },
  { id:59, name:'降妖宝塔',   quality:'橙', effect:'防御+1000,增伤+25%,减伤+25%'               },
  { id:60, name:'太白浮尘',   quality:'橙', effect:'血量+2500,闪避+25%,回血+200/s,移速+15%'   },
  { id:61, name:'玉皇宝冠',   quality:'橙', effect:'防御+5000,血量+10000,增伤+100%'             },
];

// ── 物品数据表（非装备合成材料/掉落物）──
const ITEM_TABLE = [
  { name:'精铁',     type:'item', quality:'white', icon:'🔩', desc:'合成材料：铁质原料' },
  { name:'精钢',     type:'item', quality:'green', icon:'🪨', desc:'合成材料：高品质钢铁，用于锻造更强的装备' },
  { name:'鱼鳞',     type:'item', quality:'white', icon:'🐟', desc:'合成材料：鱼妖身上的鳞片' },
  { name:'鲤鱼珠',   type:'item', quality:'green', icon:'🔮', desc:'合成材料：鲤鱼精的内丹' },
  { name:'龙头',     type:'item', quality:'blue',  icon:'🐲', desc:'合成材料：龙王的头冠部件' },
  { name:'龙王角',   type:'item', quality:'blue',  icon:'🦴', desc:'合成材料：龙王之角' },
  { name:'锦鲤符',   type:'item', quality:'blue',  icon:'🎏', desc:'合成材料：锦鲤之力的符咒' },
  { name:'银粉',     type:'item', quality:'blue',  icon:'🌫️', desc:'合成材料：银角大王身上的银色粉末' },
  { name:'金粉',     type:'item', quality:'purple',icon:'✨', desc:'合成材料：金角大王身上的金色粉末' },
  { name:'经验球',   type:'item', quality:'white', icon:'🔵', desc:'经验球：拾取后获得经验值' },
];

/** 按物品名查找（用于掉落），返回克隆副本 */
function getItemByName(name) {
  const tpl = ITEM_TABLE.find(i => i.name === name);
  if (!tpl) return null;
  return Object.assign({}, tpl);
}

// ── 完整装备表（处理后）──
const EQUIP_TABLE = EQUIP_RAW.map(raw => {
  const quality = QUALITY_CN[raw.quality] || 'white';
  const slot    = inferSlot(raw.name, raw.effect);
  const attrs   = parseEffect(raw.effect);
  return {
    id:      raw.id,
    name:    raw.name,
    quality,
    slot,
    effect:  raw.effect,
    attrs,   // { atk:10 } 等
    level:   1,
    icon:    getSlotIcon(inferSlot(raw.name, raw.effect)), // 按槽位分配图标
  };
});

// ── 工具函数 ──
function getEquipById(id) {
  return EQUIP_TABLE.find(e => e.id === id) || null;
}

/** 按装备名查找（用于配置表掉落），返回克隆副本避免引用污染 */
function getEquipByName(name) {
  const tpl = EQUIP_TABLE.find(e => e.name === name);
  if (!tpl) return null;
  return Object.assign({}, tpl, { attrs: Object.assign({}, tpl.attrs) });
}

function getEquipsByQuality(qualityKey) {
  return EQUIP_TABLE.filter(e => e.quality === qualityKey);
}

/** 根据品质key获取品质信息（颜色、边框等）*/
function getQuality(qualityKey) {
  // 兼容旧键
  const key = QUALITY_COMPAT[qualityKey] || qualityKey;
  return QUALITY[key] || QUALITY.white;
}

/** 克隆一件装备（用于掉落时生成实例）*/
function cloneEquip(id) {
  const tpl = getEquipById(id);
  if (!tpl) return null;
  return Object.assign({}, tpl, { attrs: Object.assign({}, tpl.attrs) });
}

// ── 合成配方表（来自装备表.xlsx v1.7「合成表」sheet）──
// result: 合成结果装备名；materials: 所需散件（可重复，代表需要多件）
const CRAFT_RECIPES = [
  // 白/材料 → 绿
  { result:'铁棍',       materials:['木棍','精铁']                            },
  { result:'官帽',       materials:['破帽','草帽']                            },
  { result:'官衣',       materials:['布衣','破衣']                            },
  { result:'官靴',       materials:['破鞋','草鞋']                            },
  { result:'铁鼻环',     materials:['牛鼻环','精铁']                          },
  { result:'铁带子',     materials:['腰带','精铁']                            },
  // 绿 → 蓝
  { result:'钢鼻环',     materials:['铁鼻环','精钢']                          },
  { result:'钢腰带',     materials:['铁带子','精钢']                          },
  { result:'龙头冠',     materials:['官帽','官衣','官靴','龙头']              },
  { result:'龙甲',       materials:['龟甲','水甲']                            },
  { result:'龙靴',       materials:['夜叉鞋','水靴']                          },
  // 物品合成
  { result:'锦鲤符',     materials:['鲤鱼珠','鱼鳞']                          },
  // 蓝+物品 → 蓝
  { result:'如意棒',     materials:['铁棍','锦鲤符']                          },
  // 蓝 → 蓝
  { result:'龙角环',     materials:['龙王角','钢鼻环']                        },
  { result:'魔甲',       materials:['鬼衣','马头盔','牛皮靴']                 },
  // 蓝+蓝 → 紫
  { result:'魔龙甲',     materials:['魔甲','龙甲']                            },
  { result:'银光神牛环', materials:['牛王鼻环','龙角环','银粉']               },
  { result:'金腰带',     materials:['钢腰带','金粉']                          },
  { result:'银牛靴',     materials:['银角靴','牛王靴','龙靴']                 },
  { result:'金牛靴',     materials:['银牛靴','金粉']                          },
  // 紫 → 紫（新增路线）
  { result:'紫金神棒',   materials:['如意棒','芭蕉扇']                        },
  // 冰系路线
  { result:'冰心',       materials:['冰帽','冰甲','冰靴']                     },
  { result:'定海神针',   materials:['冰龙之眼','冰心','紫金神棒']             },
  { result:'极寒战魂',   materials:['冰霜战甲','冰霜法杖','金腰带']           },
];

/** 获取所有合成配方 */
function getCraftRecipes() { return CRAFT_RECIPES; }

/**
 * 检测背包（slots数组）中可合成的配方列表
 * 返回 [{recipe, canMake, missing}]
 * canMake=true 时 missing=[]；否则 missing 为缺少的材料名列表
 */
function checkCraftable(slots) {
  // 统计背包中各名字的数量
  const counts = {};
  slots.forEach(item => {
    if (!item) return;
    counts[item.name] = (counts[item.name] || 0) + 1;
  });

  return CRAFT_RECIPES.map(recipe => {
    // 逐一扣除材料
    const tempCounts = Object.assign({}, counts);
    const missing = [];
    recipe.materials.forEach(mat => {
      if (tempCounts[mat] > 0) {
        tempCounts[mat]--;
      } else {
        missing.push(mat);
      }
    });
    return { recipe, canMake: missing.length === 0, missing };
  });
}

/**
 * 执行合成：从 slots 数组中消耗材料，返回合成结果装备（或 null）
 * 同时修改传入的 slots 数组（直接操作引用）
 */
function doCraft(slots, recipe) {
  // 再次验证材料是否足够
  const needed = [...recipe.materials];
  for (const mat of needed) {
    const idx = slots.findIndex(s => s && s.name === mat);
    if (idx === -1) return null; // 材料不足
    slots[idx] = null; // 消耗
  }
  // 生成结果装备（优先查装备表，再查物品表）
  return getEquipByName(recipe.result) || getItemByName(recipe.result);
}

/** 随机生成一件装备（按品质权重）*/
const QUALITY_WEIGHTS = { white:50, green:30, blue:15, purple:4, orange:1 };
function randomEquip(minQuality) {
  const pool = EQUIP_TABLE.filter(e => {
    if (!minQuality) return true;
    const order = ['white','green','blue','purple','orange'];
    return order.indexOf(e.quality) >= order.indexOf(minQuality);
  });
  if (pool.length === 0) return cloneEquip(EQUIP_TABLE[0].id);
  // 按品质权重筛选
  const weighted = [];
  pool.forEach(e => {
    const w = QUALITY_WEIGHTS[e.quality] || 1;
    for (let i = 0; i < w; i++) weighted.push(e);
  });
  const picked = weighted[Math.floor(Math.random() * weighted.length)];
  return cloneEquip(picked.id);
}