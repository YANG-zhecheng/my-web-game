# -*- coding: utf-8 -*-
import re, sys

path = r'C:\Project\tower-defense\tower-defense-v3.4\game.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

orig_len = len(code)
changes = []

def sub(old, new, label):
    global code
    new_code = code.replace(old, new, 1)
    if new_code != code:
        changes.append(f'[OK] {label}')
        code = new_code
    else:
        changes.append(f'[!!] NOT FOUND: {label}')

def re_sub(pattern, repl, label):
    global code
    new_code, n = re.subn(pattern, repl, code, flags=re.DOTALL)
    if n:
        changes.append(f'[OK x{n}] {label}')
        code = new_code
    else:
        changes.append(f'[!!] NOT FOUND: {label}')

# ── 1. drawMap4 整个函数
re_sub(r'\nfunction drawMap4\(\) \{[^~]*?\n\}\n(?=\n)', '\n', '删除 drawMap4 函数')

# ── 2. drawMap4 调用
sub('  if (selectedMapId === 4) { drawMap4(); return; }\n', '', '删除 drawMap4 调用')

# ── 3. CS/GS 三元简化
for var_name in ['_DCS', '_CS2', '_CS3', 'CS_hint']:
    prefix = '      ' if var_name == 'CS_hint' else '  '
    sub(f'{prefix}const {var_name} = selectedMapId === 4 ? MAP4_CELL : CELL;',
        f'{prefix}const {var_name} = CELL;',
        f'简化 {var_name}')
sub('  const CS = selectedMapId === 4 ? MAP4_CELL : CELL;', '  const CS = CELL;', '简化 CS')
sub('  const GS = selectedMapId === 4 ? MAP4_GRID : GRID;', '  const GS = GRID;', '简化 GS')

# ── 4. map4Phase 相关
sub("    map4Phase: 'build',   // 地图4专属阶段：'build'|'battle'\n", '', '删除 map4Phase 初始化')
sub("  if (selectedMapId === 4) { map4TowerSet = new Set(); state.rocks = {}; }\n  else { state.rocks = {}; }", '  state.rocks = {};', '删除 map4TowerSet 初始化')

# ── 5. map4TowerSet add/delete
sub('  if (selectedMapId === 4) map4TowerSet.add(key);\n', '', '删除 map4TowerSet.add')
sub('  if (selectedMapId === 4) map4TowerSet.delete(key);\n', '', '删除 map4TowerSet.delete')

# ── 6. map4 battle 卖塔检查
sub("  if (selectedMapId === 4 && state.map4Phase === 'battle') { spawnGoldPopup('⚔️ 战斗中无法卖塔！'); return; }\n", '', '删除卖塔 map4 检查')

# ── 7. isBlocked 三元（放置时）
sub(
    "    const isBlocked = selectedMapId === 4\n      ? (MAP4_WAYPOINTS.some(([wr,wc]) => wr===r && wc===c) || !!state.towers[key])\n      : PATH_SET.has(key);",
    "    const isBlocked = PATH_SET.has(key);",
    '简化 isBlocked（放置）'
)

# ── 8. isBlocked MAP4_WAYPOINTS（石头/卖塔）
sub(
    "    const isBlocked = MAP4_WAYPOINTS.some(([wr,wc]) => wr===r && wc===c)\n      || !!state.towers[key] || !!(state.rocks && state.rocks[key]);",
    "    const isBlocked = PATH_SET.has(key) || !!state.towers[key];",
    '简化 isBlocked（石头）'
)

# ── 9. battle-btn addEventListener 块
re_sub(r"\ndocument\.getElementById\('battle-btn'\)\.addEventListener\('click', \(\) => \{.*?\}\);", '', '删除 battle-btn 监听')

# ── 10. rock-btn addEventListener 块
re_sub(r"\ndocument\.getElementById\('rock-btn'\)\.addEventListener\('click', \(\) => \{.*?\}\);", '', '删除 rock-btn 监听')

# ── 11. renderMapSelector 简化
re_sub(
    r'function renderMapSelector\(\) \{.*?^\}',
    'function renderMapSelector() {\n  // 仅保留地图1，无需选择UI\n}',
    '简化 renderMapSelector'
)

# ── 12. setMapBtnsDisabled 函数
re_sub(r'\nfunction setMapBtnsDisabled\(disabled\) \{.*?\n\}\n', '\n', '删除 setMapBtnsDisabled')

# ── 13. updateMainActionBtn 里 build 阶段（地图4专属）
sub(
    "  } else if (phase === 'build') {\n    // 地图4专属建造阶段\n    btn.textContent = '🏗️ 建造中...';\n    btn.className = 'big-btn main-btn-disabled';\n    btn.disabled = true;\n  } else if (phase === 'spawning'",
    "  } else if (phase === 'spawning'",
    '删除 build 阶段按钮逻辑'
)

# ── 14. 注释
sub("//   build(地图4)  → 建造中...（灰色禁用，battle-btn 可用）\n", '', '删除 build 注释')

# ── 15. getRockCost / placeRock 函数
re_sub(r'\nfunction getRockCost\(\) \{.*?\n\}\n', '\n', '删除 getRockCost')
re_sub(r'\nfunction placeRock\(r, c\) \{.*?\n\}\n', '\n', '删除 placeRock')

# ── 16. waveEnd 里 map4Phase 重置块（battle → build）
re_sub(
    r"      if \(selectedMapId === 4\) \{\n        state\.map4Phase = 'build';\n.*?document\.getElementById\('battle-btn'\).*?\n      \}\n",
    '',
    '删除 waveEnd map4Phase 重置'
)

# ── 17. doRestart / openDrawModal 里的 selectedMapId === 4 分支（非 battle 相关的）
re_sub(
    r"    if \(selectedMapId === 4\) \{\n      state\.map4Phase = 'build';\n.*?document\.getElementById\('battle-btn'\).*?\n    \}\n",
    '',
    '删除 doRestart map4Phase 块'
)

# ── 18. isWp 检查行（placeTowerAt 里的 map4 路径点检查）
sub(
    "  if (selectedMapId === 4 && state.map4Phase === 'battle') {\n    spawnGoldPopup('⚠️ 战斗阶段无法建造！'); return;\n  }\n  if (selectedMapId === 4) {\n    const isWp = MAP4_WAYPOINTS.some(([wr,wc]) => wr===r && wc===c);\n    if (isWp || state.towers[key]) return;\n    if (!checkMap4PathAfterPlace(r, c)) { spawnGoldPopup('⚠️ 无法建造：会堵死怪物路径！'); return; }\n  } else {\n",
    "  {\n",
    '删除 placeTowerAt map4 检查块'
)

# ── 19. Monster 构造函数里 map4 分支（坐标初始化）
re_sub(
    r"    if \(selectedMapId === 4\) \{.*?this\.map4Path.*?this\.x.*?this\.y.*?\} else \{\n(.*?)\n    \}",
    lambda m: m.group(1),
    '简化 Monster map4 坐标分支'
)

# ── 20. 地图4 update 路径跟随里的 map4Path 分支
re_sub(
    r"        const tx = nc \* MAP4_CELL \+ MAP4_CELL / 2;\n        const ty = nr \* MAP4_CELL \+ MAP4_CELL / 2;\n",
    '',
    '删除 map4 tx/ty 计算'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

with open(r'C:\Project\tower-defense\tower-defense-v3.4\patch_map_result.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(changes))
    f.write(f'\n\n原始: {orig_len} bytes → 新: {len(code)} bytes，删减: {orig_len - len(code)} bytes')
