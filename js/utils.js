// ===== 工具函数 =====
const Utils = {
  // 两点距离
  dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  },

  // 向量归一化
  normalize(dx, dy) {
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return { x:0, y:0 };
    return { x: dx/len, y: dy/len };
  },

  // 随机整数 [min, max]
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 随机浮点 [min, max)
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // 随机选择
  randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // 概率判断
  chance(prob) { // prob 0~1
    return Math.random() < prob;
  },

  // 数值限制
  clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  },

  // 时间格式化
  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  },

  // 获取点所在区域
  getZoneAt(wx, wy) {
    const col = Math.floor(wx / C.CELL);
    const row = Math.floor(wy / C.CELL);
    const safeCol = Utils.clamp(col, 0, 2);
    const safeRow = Utils.clamp(row, 0, 2);
    return C.ZONES.find(z => z.col === safeCol && z.row === safeRow) || C.ZONES[7]; // 默认主城
  },

  // 生成装备
  generateEquip(level, slotHint) {
    const slots = C.EQUIP_SLOTS;
    const slot = slotHint || Utils.randChoice(slots);
    const quality = (() => {
      const r = Math.random();
      if (r < 0.03) return 'legend';
      if (r < 0.12) return 'epic';
      if (r < 0.35) return 'rare';
      return 'normal';
    })();
    const qMul = { normal:1, rare:1.5, epic:2.2, legend:3.5 }[quality];
    const lv = Math.max(1, level);
    const basePow = Math.pow(lv, 1.3);

    const attrPool = [];
    if (slot === 'weapon') {
      attrPool.push({ key:'atk', val: Math.floor(basePow * 1.2 * qMul) });
      if (Utils.chance(0.5)) attrPool.push({ key:'atkSpeed', val: Utils.randFloat(0.05, 0.2) });
    } else if (slot === 'head') {
      attrPool.push({ key:'hp', val: Math.floor(basePow * 2 * qMul) });
      if (Utils.chance(0.4)) attrPool.push({ key:'armor', val: Math.floor(basePow * 0.5 * qMul) });
    } else if (slot === 'armor') {
      attrPool.push({ key:'armor', val: Math.floor(basePow * 1.5 * qMul) });
      attrPool.push({ key:'hp', val: Math.floor(basePow * 1.2 * qMul) });
    } else if (slot === 'boots') {
      attrPool.push({ key:'speed', val: Math.floor(20 * qMul) });
      if (Utils.chance(0.5)) attrPool.push({ key:'dodge', val: Utils.randFloat(0.01, 0.06) * qMul });
    } else {
      // acc
      const r2 = Math.random();
      if (r2 < 0.3) attrPool.push({ key:'atk', val: Math.floor(basePow * 0.8 * qMul) });
      else if (r2 < 0.6) attrPool.push({ key:'hp', val: Math.floor(basePow * 1.5 * qMul) });
      else attrPool.push({ key:'armor', val: Math.floor(basePow * 0.8 * qMul) });
      if (quality === 'epic' || quality === 'legend') {
        attrPool.push({ key:'dmgBonus', val: Utils.randFloat(0.05, 0.15) * (quality === 'legend' ? 2 : 1) });
      }
    }

    const names = {
      weapon: ['桃木剑','青铜剑','龙泉剑','神龙剑','斩妖剑','金箍棒','混天绫'],
      head: ['逍遥冠','道士冠','天庭冠','紫金冠','如意冠','毗卢帽'],
      armor: ['布衣','皮甲','铁甲','龙鳞甲','天衣无缝','玄铁甲'],
      boots: ['布鞋','飞云靴','踏雪靴','神行靴','龙爪靴'],
      acc: ['玉佩','法宝','定海针','九转金丹','舍利子','护符','灵符','辟邪符','天地符','混元符'],
    };
    const nameArr = names[slot] || names.acc;
    const name = Utils.randChoice(nameArr);
    const qualityPrefix = { normal:'', rare:'精良', epic:'罕见', legend:'传说' }[quality];

    return {
      id: `item_${Date.now()}_${Math.random()}`,
      name: qualityPrefix + name,
      slot,
      quality,
      level: lv,
      attrs: attrPool,
    };
  },

  // 乘法伤害计算
  calcDamage(atk, armor, dmgBonus = 0, dmgReduce = 0) {
    // 乘法公式：最终伤害 = ATK * (1 + dmgBonus) * armorFactor * (1 - dmgReduce)
    const armorFactor = 100 / (100 + armor);
    const raw = atk * (1 + dmgBonus) * armorFactor * (1 - dmgReduce);
    return Math.max(1, Math.floor(raw));
  },

  // 装备属性描述（兼容新 attrs:{key:val} 和旧 attrs:[{key,val}] 两种格式）
  describeEquip(item) {
    if (!item) return '';
    const qInfo = (typeof getQuality === 'function')
      ? getQuality(item.quality)
      : { color: C.QUALITY_COLOR[item.quality] || '#ccc', label: item.quality };
    const qColor = qInfo.color;
    const qName  = qInfo.label || C.QUALITY_NAME[item.quality] || item.quality;

    // ── 合成材料简化卡片 ──
    if (item.type === 'item') {
      const descHtml = item.desc
        ? `<div class="tip-desc">${item.desc}</div>` : '';
      return `
        <div class="tip-header">
          <div class="tip-name" style="color:${qColor}">${item.icon || '📦'} ${item.name}</div>
          <div class="tip-meta">
            <span style="color:${qColor}">●</span>
            <span>${qName}</span>
            <span>合成材料</span>
          </div>
        </div>
        ${descHtml}`;
    }

    // ── 装备卡片 ──
    const slotName = C.EQUIP_SLOT_NAMES[item.slot] || item.slot || '';
    const icon     = item.icon || '📦';

    // 属性中文名映射（完整版）
    const ATTR_NAME = {
      atk:              '攻击力',
      hp:               '生命值',
      armor:            '护甲',
      speed:            '移速',
      dodge:            '闪避率',
      atkSpeed:         '攻速',
      atkSpeedBonus:    '攻速',
      dmgBonus:         '增伤',
      dmgReduce:        '减伤',
      damageReduction:  '减伤',
      hpRegen:          '回血/s',
      critBonus:        '暴击率',
      mp:               '魔法值',
    };
    // 百分比属性 key 集合
    const PCT_KEYS = new Set([
      'dodge','atkSpeed','atkSpeedBonus','dmgBonus','dmgReduce',
      'damageReduction','critBonus',
    ]);
    // 速度字段可能是百分比小数（≤1）或绝对值（>1）
    const SPEED_ABS_THRESH = 1;

    let attrRowsHtml = '';
    const renderAttr = (k, v) => {
      const name = ATTR_NAME[k] || k;
      let valStr;
      if (PCT_KEYS.has(k)) {
        valStr = (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
      } else if (k === 'speed') {
        // speed <= 1 视为百分比，否则绝对值
        if (Math.abs(v) <= SPEED_ABS_THRESH) {
          valStr = (v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%';
        } else {
          valStr = (v >= 0 ? '+' : '') + v;
        }
      } else {
        valStr = (v >= 0 ? '+' : '') + v;
      }
      const valColor = v >= 0 ? '#88ee88' : '#ee8844';
      attrRowsHtml += `
        <div class="tip-attr-row">
          <span class="attr-key">${name}</span>
          <span class="attr-val" style="color:${valColor}">${valStr}</span>
        </div>`;
    };

    if (Array.isArray(item.attrs)) {
      item.attrs.forEach(a => renderAttr(a.key, a.val));
    } else if (item.attrs && typeof item.attrs === 'object') {
      for (const [k, v] of Object.entries(item.attrs)) renderAttr(k, v);
    }

    const attrsSection = attrRowsHtml
      ? `<div class="tip-attrs">${attrRowsHtml}</div>` : '';

    const descSection = item.desc
      ? `<div class="tip-desc">${item.desc}</div>` : '';

    return `
      <div class="tip-header">
        <div class="tip-name" style="color:${qColor}">${icon} ${item.name}</div>
        <div class="tip-meta">
          <span style="color:${qColor}">● ${qName}</span>
          <span>${slotName}</span>
        </div>
      </div>
      ${attrsSection}
      ${descSection}`;
  },

  // 从装备获取属性合计（兼容新旧两种 attrs 格式）
  sumEquipAttr(equips, key) {
    let total = 0;
    for (const slot in equips) {
      const item = equips[slot];
      if (!item || !item.attrs) continue;
      if (Array.isArray(item.attrs)) {
        // 旧格式
        item.attrs.forEach(a => { if (a.key === key) total += a.val; });
      } else {
        // 新格式：直接按key查找
        if (item.attrs[key] !== undefined) total += item.attrs[key];
      }
    }
    return total;
  },

  lerp(a, b, t) { return a + (b - a) * t; },
};
