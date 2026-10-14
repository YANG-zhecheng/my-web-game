# -*- coding: utf-8 -*-
"""
patch.py — 批量修改 game.js
用法: python patch.py
"""
import re

SRC = r'C:\Project\tower-defense\tower-defense-v3.4\game.js'

with open(SRC, 'r', encoding='utf-8') as f:
    code = f.read()

changes = 0

def replace_once(old, new, label):
    global code, changes
    if old in code:
        code = code.replace(old, new, 1)
        changes += 1
        print(f'  [OK] {label}')
    else:
        print(f'  [!!] NOT FOUND: {label}')

# ─────────────────────────────────────────────
# A. 回合结束卡死修复
# ─────────────────────────────────────────────

# A4. waveDuration 修复
replace_once(
    "      state.phase = 'waiting-draw';",
    "      const waveDuration = state.waveStartTime ? ((Date.now() - state.waveStartTime) / 1000).toFixed(1) : '?';\n      state.phase = 'waiting-draw';",
    'A4 waveDuration'
)

# A5. Object.entries 防护
replace_once(
    'Object.entries(state.towers).forEach(([key, tower]) => {',
    'Object.entries(state.towers || {}).forEach(([key, tower]) => {',
    'A5 Object.entries 防护'
)

# ─────────────────────────────────────────────
# B. 减甲 buff 系统
# ─────────────────────────────────────────────

# B1. Monster 构造函数
replace_once(
    '    this.defDebuff = 0;\n    this.defDebuffTimer = 0;',
    '    this.armorDebuffs = []; // [{ id, power, timer }]',
    'B1 Monster 构造函数'
)

# B2. Monster.update defDebuff timer
replace_once(
    '    // defDebuff timer\n    if (this.defDebuffTimer > 0) {\n      this.defDebuffTimer -= dt;\n      if (this.defDebuffTimer <= 0) this.defDebuff = 0;\n    }',
    '    // armorDebuffs tick\n    if (this.armorDebuffs && this.armorDebuffs.length > 0) {\n      this.armorDebuffs.forEach(b => { b.timer -= dt; });\n      this.armorDebuffs = this.armorDebuffs.filter(b => b.timer > 0);\n    }',
    'B2 Monster.update armorDebuffs tick'
)

# B3. calcDmg 减甲读取
replace_once(
    '  const defAfterFlat = Math.max(0, (monster.defense || 0) - (monster.defDebuff || 0));',
    '  const totalArmorBreak = (monster.armorDebuffs && monster.armorDebuffs.length > 0)\n    ? monster.armorDebuffs.reduce((sum, b) => sum + (b.power || 0), 0) : 0;\n  const defAfterFlat = Math.max(0, (monster.defense || 0) - totalArmorBreak);',
    'B3 calcDmg 减甲读取'
)

# B4. applyArmorDebuff helper（插入到 applyEffect 前）
replace_once(
    '// ========== 作用效果 ==========',
    '''function applyArmorDebuff(monster, buffId, power, duration) {
  if (!monster || monster.dead) return;
  monster.armorDebuffs = monster.armorDebuffs || [];
  const existing = monster.armorDebuffs.find(b => b.id === buffId);
  if (existing) { existing.timer = duration; }
  else { monster.armorDebuffs.push({ id: buffId, power, timer: duration }); }
}

// ========== 作用效果 ==========''',
    'B4 applyArmorDebuff helper'
)

# B5. blackArmorBreak case 减甲逻辑
replace_once(
    "      monster.defDebuff = Math.min(50, (monster.defDebuff || 0) + power);\n      for (let i = 0; i < 4; i++)",
    "      const bkLevel = (towerKey && state.towers[towerKey]) ? (state.towers[towerKey].level || 1) : 1;\n      const bkBuffId = `${towerKey}:${bkLevel}`;\n      applyArmorDebuff(monster, bkBuffId, power, 3);\n      for (let i = 0; i < 4; i++)",
    'B5 blackArmorBreak buff'
)

# B9. blackStoneAtk case
replace_once(
    "      monster.defDebuff = Math.min(80, (monster.defDebuff || 0) + power);",
    "      applyArmorDebuff(monster, `${towerKey}:blackStone`, power, 3);",
    'B9 blackStoneAtk buff'
)

# B11. drawMonster 裂纹显示
replace_once(
    '  if (m.defDebuff > 0 && m.defDebuffTimer > 0) {\n    const crackAlpha = Math.min(0.85, m.defDebuff * 0.02);',
    '  const totalArmorDebuffVis = (m.armorDebuffs && m.armorDebuffs.length > 0)\n    ? m.armorDebuffs.reduce((s, b) => s + (b.power || 0), 0) : 0;\n  if (totalArmorDebuffVis > 0) {\n    const crackAlpha = Math.min(0.85, totalArmorDebuffVis * 0.02);',
    'B11 drawMonster 裂纹'
)

# B12a. tooltip calcDmg
replace_once(
    '  const defAfterFlat = Math.max(0, (m.defense || 0) - (m.defDebuff || 0));',
    '  const totalArmorBreakTooltip = (m.armorDebuffs && m.armorDebuffs.length > 0)\n    ? m.armorDebuffs.reduce((s, b) => s + (b.power || 0), 0) : 0;\n  const defAfterFlat = Math.max(0, (m.defense || 0) - totalArmorBreakTooltip);',
    'B12a tooltip defAfterFlat'
)

# B12b. tooltip debuffs.push
replace_once(
    "  if (m.defDebuff > 0) debuffs.push(`🛡️减甲-${m.defDebuff}`);",
    "  if (totalArmorBreakTooltip > 0) debuffs.push(`🛡️减甲-${totalArmorBreakTooltip}（${(m.armorDebuffs||[]).length}层）`);",
    'B12b tooltip debuffs push'
)

# B12c. tooltip 护甲行 m.defDebuff>0
replace_once(
    'm.defDebuff>0?` <span style="color:#ff6600">(-${m.defDebuff})</span>`:\'\'',
    'totalArmorBreakTooltip>0?` <span style="color:#ff6600">(-${totalArmorBreakTooltip})</span>`:\'\'',
    'B12c tooltip 护甲行'
)

# ─────────────────────────────────────────────
# C. 数值调整
# ─────────────────────────────────────────────

# C1. BASE_TOWER_DEFS 射程（一次性替换整行）
replace_once(
    "  fire:    { name:'红精灵', icon:'🔴', color:'#ff4500', desc:'单体攻击，附加持续灼烧',     dmg:30,  range:1.4, rate:0.6,",
    "  fire:    { name:'红精灵', icon:'🔴', color:'#ff4500', desc:'单体攻击，附加持续灼烧',     dmg:30,  range:2.0, rate:0.6,",
    'C1 red range'
)
replace_once(
    "  thunder: { name:'黄精灵', icon:'🟡', color:'#ffd700', desc:'单体超高攻速攻击',           dmg:15,  range:2.5, rate:3.0,",
    "  thunder: { name:'黄精灵', icon:'🟡', color:'#ffd700', desc:'单体超高攻速攻击',           dmg:15,  range:3.0, rate:3.0,",
    'C1 yellow range'
)
replace_once(
    "  ice:     { name:'蓝精灵', icon:'🔵', color:'#00bfff', desc:'单体攻击，命中减速3秒',      dmg:15,  range:2.5, rate:1.0,",
    "  ice:     { name:'蓝精灵', icon:'🔵', color:'#00bfff', desc:'单体攻击，命中减速3秒',      dmg:15,  range:3.0, rate:1.0,",
    'C1 ice range'
)
replace_once(
    "  poison:  { name:'绿精灵', icon:'🟢', color:'#44bb44', desc:'单体攻击，附加持续毒素8秒',  dmg:15,  range:2.0, rate:1.0,",
    "  poison:  { name:'绿精灵', icon:'🟢', color:'#44bb44', desc:'单体攻击，附加持续毒素8秒',  dmg:15,  range:2.5, rate:1.0,",
    'C1 poison range'
)
replace_once(
    "  white:   { name:'白精灵', icon:'⚪', color:'#ccddff', desc:'同时攻击最近3个目标，群体伤害',dmg:15, range:2.8, rate:1.0,",
    "  white:   { name:'白精灵', icon:'⚪', color:'#ccddff', desc:'同时攻击最近3个目标，群体伤害',dmg:15, range:3.0, rate:1.0,",
    'C1 white range'
)
replace_once(
    "  black:   { name:'黑精灵', icon:'⚫', color:'#554477', desc:'单体攻击，命中削减护甲2点',   dmg:30,  range:2.2, rate:1.0,",
    "  black:   { name:'黑精灵', icon:'⚫', color:'#554477', desc:'单体攻击，命中削弱护甲2点/次（同类减甲不叠加）',   dmg:30,  range:2.5, rate:1.0,",
    'C1 black range+desc'
)

# C3. 望远镜 scopeAura effectPower
replace_once(
    "    desc: '单体攻击（150伤/1.0攻速），同时为周围1.5格内所有普通塔提供+1射程光环',\n    cfg: {\n      name:'望远镜', icon:'🔭', color:'#88ccff',\n      desc:'单体攻击150/1s，光环：周围1.5格内普通塔射程+1格',\n      dmg: 150, range: 3.0, rate: 1.0, effect: 'scopeAura', effectPower: 1,",
    "    desc: '单体攻击（150伤/1.0攻速），同时为周围1.5格内所有普通塔提供+2射程光环',\n    cfg: {\n      name:'望远镜', icon:'🔭', color:'#88ccff',\n      desc:'单体攻击150/1s，光环：周围1.5格内普通塔射程+2格',\n      dmg: 150, range: 3.0, rate: 1.0, effect: 'scopeAura', effectPower: 2,",
    'C3 望远镜 +2射程'
)

# C4. BOSS关卡 count
replace_once(
    '    // W10 BOSS\n    { waveType:\'boss\',      count:10, hp:5096,',
    '    // W10 BOSS\n    { waveType:\'boss\',      count:1,  hp:5096,',
    'C4 W10 BOSS count=1'
)
replace_once(
    '    // W20 BOSS\n    { waveType:\'boss\',      count:10, hp:23169,',
    '    // W20 BOSS\n    { waveType:\'boss\',      count:1,  hp:23169,',
    'C4 W20 BOSS count=1'
)

# C5. 黑石描述
replace_once(
    "    desc: '同时攻击3个目标，每次命中累计削减护甲20点（最多-80），攻速1.2/s，范围3格',\n    cfg: {\n      name:'黑石', icon:'🪨', color:'#554477',\n      desc:'3目标攻击（150伤），命中削甲20/次（最多-80），攻速1.2/s，范围3格',",
    "    desc: '同时攻击3个目标，每次命中削弱护甲20点/次（持续3秒，同类不叠加），攻速1.2/s，范围3格',\n    cfg: {\n      name:'黑石', icon:'🪨', color:'#554477',\n      desc:'3目标攻击（150伤），命中削弱护甲20/次（持续3秒，同类不叠加），攻速1.2/s，范围3格',",
    'C5 黑石描述'
)

# C5. 影魔描述
replace_once(
    "    desc: '单体物理攻击700，攻击附带减甲30，每次击杀收集灵魂（动画为紫色线条抽取），每个灵魂+10攻击',\n    cfg: {\n      name:'影魔', icon:'👿', color:'#9933cc',\n      desc:'单体物理900，减甲30，击杀收集灵魂（每魂+50攻），攻速1/s，弹道为紫色球',",
    "    desc: '单体物理攻击900，攻击附带减甲30（持续3秒，同类不叠加），每次击杀收集灵魂（动画为紫色线条抽取），每个灵魂+50攻击',\n    cfg: {\n      name:'影魔', icon:'👿', color:'#9933cc',\n      desc:'单体物理900，减甲30（持续3秒，同类不叠加），击杀收集灵魂（每魂+50攻），攻速1/s，弹道为紫色球',",
    'C5 影魔描述'
)

# C5. 阎王描述
replace_once(
    "    desc: '双体物理攻击700，减甲40，继承影魔灵魂并继续收集（每魂+10攻），每12秒恐惧波（范围4格，受伤+30%，反向走1.5s，怪物变紫）；持续光环：周围4格内怪物护甲-30',\n    cfg: {\n      name:'阎王', icon:'👹', color:'#cc0000',\n      desc:'双体物理700（+魂×10），减甲40，继承&收集灵魂（每魂+10攻），攻速1/s；每12s恐惧波（范围4格，受伤+30%，反向走1.5s）；持续光环：周围4格内怪物护甲-30',",
    "    desc: '双体物理攻击1200，减甲40（持续3秒，同类不叠加），继承影魔灵魂并继续收集（每魂+50攻），每12秒恐惧波（范围4格，受伤+30%，反向走1.5s，怪物变紫）；持续光环：周围4格内怪物护甲-30',\n    cfg: {\n      name:'阎王', icon:'👹', color:'#cc0000',\n      desc:'双体物理1200（+魂×50），减甲40（持续3秒，同类不叠加），继承&收集灵魂（每魂+50攻），攻速1/s；每12s恐惧波（范围4格，受伤+30%，反向走1.5s）；持续光环：周围4格内怪物护甲-30',",
    'C5 阎王描述'
)

# C6. 凤凰 damageTakenMult
replace_once(
    'damageTakenMult = Math.max(m.damageTakenMult || 1, 1.1);',
    'damageTakenMult = Math.max(m.damageTakenMult || 1, 1.2);',
    'C6 凤凰 damageTakenMult'
)
replace_once(
    "    desc: '无法攻击，持续对半径5格内所有非魔免敌人施加灼烧（350/s）；同时5格内所有敌人受到伤害+10%；魔免单位不受灼烧但仍受伤害加深效果',\n    cfg: {\n      name:'凤凰', icon:'🦅', color:'#ff6600',\n      desc:'持续AOE灼烧（350/s），半径5格，对魔免单位无效；5格内敌人受到伤害+10%',",
    "    desc: '无法攻击，持续对半径5格内所有非魔免敌人施加灼烧（350/s）；同时5格内所有敌人受到伤害+20%；魔免单位不受灼烧但仍受伤害加深效果',\n    cfg: {\n      name:'凤凰', icon:'🦅', color:'#ff6600',\n      desc:'持续AOE灼烧（350/s），半径5格，对魔免单位无效；光环：半径5格内所有敌人受到伤害+20%（魔免单位同样生效）',",
    'C6 凤凰描述'
)
replace_once(
    "      case 'phoenixAura':  return `🦅 灼烧AOE：半径${cfg.aoeRange}格，${p}/s，<span style=\"color:#ff9900\">对魔免单位无效</span>`;",
    "      case 'phoenixAura':  return `🦅 灼烧AOE：半径${cfg.aoeRange}格，${p}/s，<span style=\"color:#ff9900\">对魔免单位无效</span>；光环：范围内所有敌人受到伤害+20%（魔免同样生效）`;",
    'C6 凤凰 genEffectDesc'
)

# C7. 点金手 desc
replace_once(
    "    desc: '每回合向范围内一个普通小兵投掷金块将其秒杀，额外掉落2个钱袋（各值10💰），每回合仅限一次',\n    cfg: {\n      name:'点金手', icon:'🪙', color:'#ffd700',\n      desc:'每回合秒杀一个普通小兵并额外掉落2个钱袋（各10💰），每回合限1次，不对精英/BOSS生效',",
    "    desc: '每回合向范围内一个普通小兵投掷金块将其秒杀，额外掉落2个钱袋（各值10💰），每回合仅限一次；【全局被动】场上存在时，所有怪物死亡10%概率额外掉落1个钱袋（10💰）',\n    cfg: {\n      name:'点金手', icon:'🪙', color:'#ffd700',\n      desc:'每回合秒杀一个普通小兵并额外掉落2个钱袋（各10💰），每回合限1次，不对精英/BOSS生效；【全局被动】所有怪物死亡10%概率掉落钱袋（10💰）',",
    'C7 点金手描述'
)
replace_once(
    "    desc: '单体攻击（攻速3/s，伤害500），击杀时额外生成2个钱袋（各值10💰）',\n    cfg: {\n      name:'炼金术士', icon:'⚗️', color:'#ffd700',\n      desc:'单体攻击，伤害500，攻速3/s，范围2.8格；击杀时生成2个钱袋（各10💰）',",
    "    desc: '单体攻击（攻速3/s，伤害500），击杀时额外生成2个钱袋（各值10💰）；【全局被动】场上存在时，所有怪物死亡10%概率额外掉落1个钱袋（10💰）',\n    cfg: {\n      name:'炼金术士', icon:'⚗️', color:'#ffd700',\n      desc:'单体攻击，伤害500，攻速3/s，范围2.8格；击杀时生成2个钱袋（各10💰）；【全局被动】所有怪物死亡10%概率掉落钱袋（10💰）',",
    'C7 炼金术士描述'
)

# ─────────────────────────────────────────────
# D. 去掉难度选择
# ─────────────────────────────────────────────

replace_once(
    "const DIFFICULTY_MULT = { easy: 0.6, normal: 1, hard: 1.5, brutal: 3 };\nlet selectedDifficulty = 'normal'; // 默认中等",
    "// 难度选择已移除，关卡难度由 WAVES 数据直接体现",
    'D1 删除难度变量'
)
replace_once(
    "    difficulty: selectedDifficulty,           // 锁定当局难度\n    diffMult: DIFFICULTY_MULT[selectedDifficulty] || 1,  // HP倍率",
    "    difficulty: 'normal',\n    diffMult: 1,",
    'D2 initState diffMult=1'
)

print(f'\n完成！共应用 {changes} 处修改')
