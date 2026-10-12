// ===== 背包系统 =====
class Bag {
  constructor(game) {
    this.game = game;
    this.COLS = 10;
    this.ROWS = 10;
    // 格子数组，null=空
    this.slots = new Array(this.COLS * this.ROWS).fill(null);
    this.visible = false;

    // 拖拽状态
    this._drag = null; // { item, fromType, fromIdx, el, ghostEl }

    // 选中格（单击高亮）
    this._selected = null; // { type, idx }

    this._buildDOM();
    this._bindEvents();
  }

  /* ── 入背包 ── */
  addItem(item) {
    const idx = this.slots.indexOf(null);
    if (idx === -1) return false; // 背包满
    this.slots[idx] = item;
    this._renderSlots();
    return true;
  }

  isFull() {
    return this.slots.indexOf(null) === -1;
  }

  /* ── 构建DOM ── */
  _buildDOM() {
    const panel = document.createElement('div');
    panel.id = 'bag-panel';
    panel.className = 'hidden';
    panel.innerHTML = `
      <div id="bag-header">
        <span id="bag-title">🎒 背包</span>
        <button id="bag-close-btn">✕</button>
      </div>
      <div id="bag-body">
        <div id="bag-grid-wrap">
          <div id="bag-grid"></div>
        </div>
        <div id="bag-equip-wrap">
          <div id="bag-equip-title">已装备</div>
          <div id="bag-equip-slots"></div>
        </div>
      </div>
      <div id="bag-craft-bar" class="hidden">
        <span id="bag-craft-label">⚗️ 可合成：</span>
      </div>
      <div id="bag-footer">
        <button id="bag-sell-btn">💰 批量售卖（选中）</button>
        <button id="bag-sell-all-btn">💰 售卖所有普通</button>
        <span id="bag-count-text"></span>
      </div>
      <div id="bag-item-tip" class="hidden"></div>`;
    document.getElementById('game-container').appendChild(panel);
    this._panel = panel;

    // 快捷键B打开背包
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyB') this.toggle();
    });
  }

  /* ── 绑定按钮事件 ── */
  _bindEvents() {
    document.getElementById('bag-close-btn').addEventListener('click', () => this.hide());
    document.getElementById('bag-sell-btn').addEventListener('click', () => this._sellSelected());
    document.getElementById('bag-sell-all-btn').addEventListener('click', () => this._sellAllNormal());

    // 全局点击：若点击区域不在 tip 面板、背包格、装备格内，则关闭详情并清除选中
    document.addEventListener('click', (ev) => {
      const tip = document.getElementById('bag-item-tip');
      if (!tip || tip.classList.contains('hidden')) return;
      // 点到 tip 本身 / 合成按钮内 → 不关闭
      if (tip.contains(ev.target)) return;
      // 点到背包格或装备格 → _onCellClick 会自行处理，也不关闭（避免双重处理）
      if (ev.target.closest('#bag-grid') || ev.target.closest('#bag-equip-slots')) return;
      // 其他任意位置 → 关闭
      this._hideItemInfoPanel();
      this._selected = null;
      this._renderSlots();
      this._renderEquipSlots();
    });
  }

  /* ── 显示/隐藏 ── */
  toggle() { this.visible ? this.hide() : this.show(); }

  show() {
    this.visible = true;
    this._panel.classList.remove('hidden');
    this._renderSlots();
    this._renderEquipSlots();
  }

  hide() {
    this.visible = false;
    this._panel.classList.add('hidden');
    this._selected = null;
    document.getElementById('bag-item-tip').classList.add('hidden');
  }

  /* ── 渲染背包格子 ── */
  _renderSlots() {
    const grid = document.getElementById('bag-grid');
    grid.innerHTML = '';
    const total = this.COLS * this.ROWS;

    // ── 预计算哪些格子属于"可合成配方"的所需材料 ──
    const combinedPool = this._buildCombinedPool();
    const craftStatus  = checkCraftable(combinedPool);
    // 收集所有"可合成配方"需要的材料名集合（只要有至少一条可合成）
    const craftableMats = new Set();
    craftStatus.forEach(cs => {
      if (cs.canMake) {
        cs.recipe.materials.forEach(m => craftableMats.add(m));
      }
    });

    for (let i = 0; i < total; i++) {
      const cell = document.createElement('div');
      cell.className = 'bag-cell';
      cell.dataset.type = 'bag';
      cell.dataset.idx = i;
      const item = this.slots[i];

      if (item) {
        // ── 有物品：品质底色 + 图标 ──
        cell.classList.add('has-item');
        const qInfo = getQuality(item.quality);
        cell.classList.add(`quality-${qInfo.key}`);
        cell.style.borderColor = qInfo.border;

        // ── 可合成材料高亮 ──
        if (craftableMats.has(item.name)) {
          cell.classList.add('craftable-highlight');
        }

        const inner = document.createElement('div');
        inner.className = 'bag-cell-inner';
        inner.textContent = item.icon || getSlotIcon(item.slot);
        cell.appendChild(inner);

        // 物品名标签（底部小字）
        const nameTag = document.createElement('div');
        nameTag.className = 'bag-cell-name';
        nameTag.textContent = item.name;
        nameTag.style.color = qInfo.color;
        cell.appendChild(nameTag);

        // 拖拽 & 点击 & 双击穿装
        cell.draggable = true;
        cell.addEventListener('dragstart', ev => this._onDragStart(ev, 'bag', i));
        cell.addEventListener('click', ev => { ev.stopPropagation(); this._onCellClick('bag', i); });
        cell.addEventListener('dblclick', ev => { ev.stopPropagation(); this._onCellDblClick(i); });

        // （已移除悬停tooltip，改为click显示信息面板）

        // 选中高亮
        if (this._selected && this._selected.type === 'bag' && this._selected.idx === i) {
          cell.classList.add('selected');
        }
      } else {
        // ── 空格：置灰的槽位图标（背包格无固定槽，用通用空格图标）──
        const placeholder = document.createElement('div');
        placeholder.className = 'bag-cell-placeholder';
        placeholder.textContent = '📦';
        cell.appendChild(placeholder);
      }

      cell.addEventListener('dragover', ev => ev.preventDefault());
      cell.addEventListener('drop', ev => this._onDrop(ev, 'bag', i));
      grid.appendChild(cell);
    }
    // 更新数量文字
    const used = this.slots.filter(s => s !== null).length;
    document.getElementById('bag-count-text').textContent = `${used}/${total}`;
  }

  /* ── 渲染装备槽 ── */
  _renderEquipSlots() {
    const wrap = document.getElementById('bag-equip-slots');
    wrap.innerHTML = '';
    const equips = this.game.player.equips;
    const icons = { weapon:'⚔️', head:'👑', armor:'🧥', boots:'👢', acc1:'💍', acc2:'📿' };
    C.EQUIP_SLOTS.forEach(slot => {
      const cell = document.createElement('div');
      cell.className = 'bag-equip-cell';
      cell.dataset.type = 'equip';
      cell.dataset.slot = slot;
      const item = equips[slot];
      if (item) {
        // ── 已装备：品质底色 + 图标 ──
        cell.classList.add('has-item');
        const qInfoE = getQuality(item.quality);
        cell.classList.add(`quality-${qInfoE.key}`);
        cell.style.borderColor = qInfoE.border;

        // 图标+名字包裹容器（横向排列用）
        const iconWrap = document.createElement('div');
        iconWrap.className = 'bag-equip-icon-wrap';
        iconWrap.style.display = 'flex';
        iconWrap.style.flexDirection = 'column';
        iconWrap.style.alignItems = 'center';
        iconWrap.style.justifyContent = 'center';
        iconWrap.style.flexShrink = '0';
        iconWrap.style.width = '32px';

        const inner = document.createElement('div');
        inner.className = 'bag-cell-inner';
        inner.style.position = 'static'; // 脱离 absolute 上下文
        inner.textContent = item.icon || getSlotIcon(slot);
        iconWrap.appendChild(inner);
        cell.appendChild(iconWrap);

        // 物品名（flex 子项，紧随图标后）
        const nameTag = document.createElement('div');
        nameTag.className = 'bag-equip-item-name';
        nameTag.textContent = item.name;
        nameTag.style.color = qInfoE.color;
        nameTag.style.fontSize = '11px';
        nameTag.style.fontWeight = 'bold';
        nameTag.style.flex = '1';
        nameTag.style.minWidth = '0';
        nameTag.style.overflow = 'hidden';
        nameTag.style.textOverflow = 'ellipsis';
        nameTag.style.whiteSpace = 'nowrap';
        cell.appendChild(nameTag);

        // ── 选中高亮：仅当 _selected 指向这个装备槽时显示金边 ──
        if (this._selected && this._selected.type === 'equip' && this._selected.idx === slot) {
          cell.classList.add('selected');
          cell.style.borderColor = ''; // 清除 inline borderColor，让 CSS selected 样式生效
        }

        cell.draggable = true;
        cell.addEventListener('dragstart', ev => this._onDragStart(ev, 'equip', slot));
        // （已移除悬停tooltip，改为click显示信息面板）
        cell.addEventListener('click', ev => { ev.stopPropagation(); this._onCellClick('equip', slot); });
        // 双击装备槽：脱下装备放回背包
        cell.addEventListener('dblclick', ev => { ev.stopPropagation(); this._onEquipSlotDblClick(slot); });
      } else {
        // ── 空槽：对应槽位图标置灰 ──
        const placeholder = document.createElement('div');
        placeholder.className = 'bag-cell-placeholder';
        placeholder.textContent = icons[slot];
        placeholder.style.flexShrink = '0';
        cell.appendChild(placeholder);
      }
      // 槽名标签（始终在最右）
      const label = document.createElement('div');
      label.className = 'bag-equip-label';
      label.textContent = C.EQUIP_SLOT_NAMES[slot];
      cell.appendChild(label);
      cell.addEventListener('dragover', ev => ev.preventDefault());
      cell.addEventListener('drop', ev => this._onDrop(ev, 'equip', slot));
      wrap.appendChild(cell);
    });
  }

  /* ── 拖拽开始 ── */
  _onDragStart(ev, fromType, fromIdx) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', JSON.stringify({ fromType, fromIdx }));
  }

  /* ── 拖拽放下 ── */
  _onDrop(ev, toType, toIdx) {
    ev.preventDefault();
    let data;
    try { data = JSON.parse(ev.dataTransfer.getData('text/plain')); } catch(e) { return; }
    const { fromType, fromIdx } = data;

    const player = this.game.player;

    // 取源物品
    let srcItem = null;
    if (fromType === 'bag') srcItem = this.slots[fromIdx];
    else if (fromType === 'equip') srcItem = player.equips[fromIdx];
    if (!srcItem) return;

    // 取目标物品
    let dstItem = null;
    if (toType === 'bag') dstItem = this.slots[toIdx];
    else if (toType === 'equip') dstItem = player.equips[toIdx];

    // === 背包 → 背包：互换 ===
    if (fromType === 'bag' && toType === 'bag') {
      this.slots[fromIdx] = dstItem;
      this.slots[toIdx]   = srcItem;
    }
    // === 背包 → 装备槽：装备（饰品 acc 可放入 acc1/acc2，其余槽严格匹配）===
    else if (fromType === 'bag' && toType === 'equip') {
      const isAccSlot = (toIdx === 'acc1' || toIdx === 'acc2');
      const itemFits  = srcItem.slot === toIdx || (isAccSlot && srcItem.slot === 'acc');
      if (!itemFits) return;
      player.equips[toIdx] = srcItem;
      this.slots[fromIdx] = dstItem; // 把原来装备放回背包
      player._recalcStats();
      if (this.game.ui) this.game.ui.refresh();
    }
    // === 装备槽 → 背包：卸下 ===
    else if (fromType === 'equip' && toType === 'bag') {
      // 饰品槽卸下时：目标背包格若有同类饰品，互换到装备槽
      const dstIsAcc = dstItem && dstItem.slot === 'acc';
      const srcIsAccSlot = (fromIdx === 'acc1' || fromIdx === 'acc2');
      if (dstItem && (dstItem.slot === fromIdx || (srcIsAccSlot && dstIsAcc))) {
        player.equips[fromIdx] = dstItem;
      } else {
        player.equips[fromIdx] = null;
      }
      this.slots[toIdx] = srcItem;
      player._recalcStats();
      if (this.game.ui) this.game.ui.refresh();
    }
    // === 装备槽 → 装备槽：同槽位才能互换（饰品槽间可互换）===
    else if (fromType === 'equip' && toType === 'equip') {
      const bothAcc = (fromIdx === 'acc1' || fromIdx === 'acc2') && (toIdx === 'acc1' || toIdx === 'acc2');
      if (fromIdx !== toIdx && !bothAcc) return;
      // 互换两个槽位的装备
      player.equips[fromIdx] = dstItem || null;
      player.equips[toIdx]   = srcItem;
      player._recalcStats();
      if (this.game.ui) this.game.ui.refresh();
    }

    this._renderSlots();
    this._renderEquipSlots();
  }

  /* ── 双击格子：快速穿装备 ── */
  _onCellDblClick(bagIdx) {
    const item = this.slots[bagIdx];
    if (!item || !item.slot) return; // 非装备类（无 slot 属性）不处理

    const player = this.game.player;
    const slot   = item.slot;

    // 饰品特殊处理：优先塞 acc1，其次 acc2
    if (slot === 'acc') {
      const targetSlot = (!player.equips.acc1) ? 'acc1'
                       : (!player.equips.acc2) ? 'acc2'
                       : 'acc1'; // 两槽都满则替换 acc1（旧装备退回背包）
      const displaced = player.equips[targetSlot] || null;
      player.equips[targetSlot] = item;
      this.slots[bagIdx] = displaced;
      player._recalcStats();
      if (this.game.ui) this.game.ui.refresh();
      if (this.game.ui) this.game.ui.showSkillToast(`✅ 已装备【${item.name}】→ ${C.EQUIP_SLOT_NAMES[targetSlot]}`);
    } else {
      // 普通槽位：旧装备退回背包，新装备上身
      const displaced = player.equips[slot] || null;
      player.equips[slot] = item;
      this.slots[bagIdx] = displaced;
      player._recalcStats();
      if (this.game.ui) this.game.ui.refresh();
      if (this.game.ui) this.game.ui.showSkillToast(`✅ 已装备【${item.name}】→ ${C.EQUIP_SLOT_NAMES[slot] || slot}`);
    }

    this._selected = null;
    this._renderSlots();
    this._renderEquipSlots();
  }

  /* ── 双击装备槽：脱下装备放回背包 ── */
  _onEquipSlotDblClick(slot) {
    const player = this.game.player;
    const item   = player.equips[slot];
    if (!item) return;

    // 找背包空位
    const emptyIdx = this.slots.indexOf(null);
    if (emptyIdx === -1) {
      // 背包已满：提示玩家
      if (this.game.ui) this.game.ui.showSkillToast('❌ 背包已满，无法脱下装备！');
      return;
    }

    // 脱下：移到背包
    this.slots[emptyIdx] = item;
    player.equips[slot]  = null;
    player._recalcStats();
    if (this.game.ui) this.game.ui.refresh();
    if (this.game.ui) this.game.ui.showSkillToast(`✅ 已脱下【${item.name}】`);

    this._selected = null;
    this._hideItemInfoPanel();
    this._renderSlots();
    this._renderEquipSlots();
  }

  /* ── 单击格子 ── */
  _onCellClick(type, idx) {
    // 再次点击同一个 → 取消选中并关闭面板
    if (this._selected && this._selected.type === type && this._selected.idx === idx) {
      this._selected = null;
      this._hideItemInfoPanel();
    } else {
      this._selected = { type, idx };
      // 获取点击的物品
      let item = null;
      if (type === 'bag') item = this.slots[idx];
      else if (type === 'equip') item = this.game.player.equips[idx];
      // 显示信息面板
      if (item) {
        this._showItemInfoPanel(item);
      } else {
        this._hideItemInfoPanel();
      }
    }
    this._renderSlots();
    this._renderEquipSlots();
  }

  /* ── 显示物品信息面板（固定在背包右侧）── */
  _showItemInfoPanel(item) {
    const tip = document.getElementById('bag-item-tip');
    if (!tip) return;
    const qInfo = getQuality(item.quality);

    // 构建：右上角关闭按钮 + 装备详情 + 合成信息 + 售卖区
    let html = `<button class="tip-close-btn" id="tip-close-btn" title="关闭">✕</button>`;
    html += Utils.describeEquip(item);
    html += this._buildCraftSection(item);

    // 售卖价格 + 快捷售卖按钮（仅背包中物品显示，装备槽物品不允许直接售卖）
    const price = this._sellPrice(item);
    html += `<div class="tip-sell-bar">
      <span class="tip-sell-price">💰 售价：<b>${price}</b> 金币</span>
      <button class="tip-sell-btn" id="tip-sell-now-btn">出售</button>
    </div>`;

    tip.innerHTML = html;
    tip.style.borderColor = qInfo.border;
    tip.style.setProperty('--tip-accent', qInfo.color);

    // 固定在背包面板右侧
    const panel = this._panel;
    const panelRect = panel.getBoundingClientRect();
    tip.style.position = 'fixed';
    tip.style.left = (panelRect.right + 10) + 'px';
    tip.style.top  = panelRect.top + 'px';
    tip.classList.remove('hidden');

    // 边界修正：如果右侧放不下，放到左侧
    requestAnimationFrame(() => {
      const tipRect = tip.getBoundingClientRect();
      if (tipRect.right > window.innerWidth - 8) {
        tip.style.left = (panelRect.left - tipRect.width - 10) + 'px';
      }
      if (tipRect.bottom > window.innerHeight - 8) {
        tip.style.top = Math.max(8, window.innerHeight - tipRect.height - 8) + 'px';
      }
    });

    // 绑定快捷售卖按钮 + 关闭按钮
    setTimeout(() => {
      const closeBtn = document.getElementById('tip-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._hideItemInfoPanel();
          this._selected = null;
          this._renderSlots();
          this._renderEquipSlots();
        });
      }

      const sellBtn = document.getElementById('tip-sell-now-btn');
      if (!sellBtn) return;
      sellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // 只允许售卖背包中的物品（装备槽物品不能直接售卖）
        if (!this._selected || this._selected.type !== 'bag') {
          if (this.game.ui) this.game.ui.showSkillToast('⚠️ 请先在背包中选中要售卖的物品');
          return;
        }
        const idx = this._selected.idx;
        const sellItem = this.slots[idx];
        if (!sellItem) return;
        const sellPrice = this._sellPrice(sellItem);
        this.game.player.gold += sellPrice;
        this.slots[idx] = null;
        this._selected = null;
        this._hideItemInfoPanel();
        if (this.game.ui) {
          this.game.ui.showSkillToast(`💰 售出「${sellItem.name}」获得 ${sellPrice} 金币`);
          this.game.ui.refresh();
        }
        this._renderSlots();
        this._renderEquipSlots();
      });
    }, 0);
  }

  /* ── 隐藏物品信息面板 ── */
  _hideItemInfoPanel() {
    const tip = document.getElementById('bag-item-tip');
    if (tip) tip.classList.add('hidden');
  }

  /* ── 构建合并材料池：背包 + 穿戴中装备 ── */
  _buildCombinedPool() {
    const pool = [...this.slots]; // 背包格子（含 null）
    const equips = this.game.player.equips;
    Object.values(equips).forEach(item => {
      if (item) pool.push(item); // 把已装备的也当作一个"虚拟格子"加入
    });
    return pool;
  }

  /* ── 构建合成信息区域HTML ── */
  _buildCraftSection(item) {
    const recipes = getCraftRecipes();
    // 只显示"该物品能合成什么"（作为材料的配方），不显示"该物品本身由什么合成"
    const uniqueRelated = recipes.filter(r => r.materials.includes(item.name));

    if (uniqueRelated.length === 0) return '';

    // 检查可合成状态（背包 + 穿戴中装备均计入）
    const combinedPool = this._buildCombinedPool();
    const craftStatus = checkCraftable(combinedPool);
    const craftMap = {};
    craftStatus.forEach(cs => { craftMap[cs.recipe.result] = cs; });

    let html = '<div class="tip-craft-section">';
    html += '<div class="tip-craft-title">⚗️ 合成配方</div>';

    uniqueRelated.forEach(recipe => {
      const cs = craftMap[recipe.result];
      const canMake = cs ? cs.canMake : false;

      // 材料列表
      const matCount = {};
      recipe.materials.forEach(m => { matCount[m] = (matCount[m]||0)+1; });

      // 统计背包 + 穿戴中每种材料的拥有数量
      const bagCounts = {};
      combinedPool.forEach(s => { if (s) bagCounts[s.name] = (bagCounts[s.name]||0)+1; });

      // 每个材料名：可点击，点击后在该材料下方内联展开来源
      const matHtml = Object.entries(matCount).map(([name, need]) => {
        const have = bagCounts[name] || 0;
        const enough = have >= need;
        const matObj = getEquipByName(name) || getItemByName(name);
        const matColor = matObj ? getQuality(matObj.quality).color : '#e0d0a0';
        const safeId = `msrc-${name.replace(/[^\w]/g, '_')}_${recipe.result.replace(/[^\w]/g, '_')}`;
        // 生成该材料的来源HTML
        const mSrc = this._getItemSource(name);
        let mSrcLines = [];
        mSrc.droppers.forEach(d => {
          const typeLabel = d.type === 'boss' ? '🔴BOSS' : '⚪小怪';
          mSrcLines.push(`${typeLabel} 击杀 <b>${d.name}</b> 掉落`);
        });
        mSrc.recipes.forEach(mats => {
          const unique = [...new Set(mats)];
          mSrcLines.push(`⚗️ 由 <b>${unique.join(' + ')}</b> 合成`);
        });
        if (mSrcLines.length === 0) mSrcLines.push('暂无已知来源');
        const mSrcHtml = mSrcLines.map(l => `<div class="item-src-line">${l}</div>`).join('');
        return `<span class="tip-craft-mat-wrap"><span class="tip-craft-mat tip-craft-clickable ${enough ? 'mat-ok' : 'mat-missing'}" style="color:${matColor}" data-src-id="${safeId}">${name}${need>1?'×'+need:''}<span class="mat-count">(${have}/${need})</span></span><div class="item-src-detail hidden" id="${safeId}">${mSrcHtml}</div></span>`;
      }).join('<span class="craft-plus"> + </span>');

      // 结果装备/物品信息
      const resultEquip = getEquipByName(recipe.result);
      const resultItem  = !resultEquip ? getItemByName(recipe.result) : null;
      const resultObj   = resultEquip || resultItem;
      const resultQInfo = resultObj ? getQuality(resultObj.quality) : null;
      const resultColor = resultQInfo ? resultQInfo.color : '#fff';

      // 结果名：同样可点击展开来源
      const resultSafeId = `rsrc-${recipe.result.replace(/[^\w]/g, '_')}`;
      const rSrc = this._getItemSource(recipe.result);
      let rSrcLines = [];
      rSrc.droppers.forEach(d => {
        const typeLabel = d.type === 'boss' ? '🔴BOSS' : '⚪小怪';
        rSrcLines.push(`${typeLabel} 击杀 <b>${d.name}</b> 掉落`);
      });
      rSrc.recipes.forEach(mats => {
        const unique = [...new Set(mats)];
        rSrcLines.push(`⚗️ 由 <b>${unique.join(' + ')}</b> 合成`);
      });
      if (rSrcLines.length === 0) rSrcLines.push('暂无已知来源');
      const rSrcHtml = rSrcLines.map(l => `<div class="item-src-line">${l}</div>`).join('');

      html += `<div class="tip-craft-recipe ${canMake ? 'craft-available' : 'craft-unavailable'}">`;
      html += `<div class="tip-craft-formula">${matHtml} <span class="craft-arrow">⇒</span> <span class="tip-craft-mat-wrap"><span class="tip-craft-result tip-craft-clickable" style="color:${resultColor}" data-src-id="${resultSafeId}">【${recipe.result}】</span><div class="item-src-detail hidden" id="${resultSafeId}">${rSrcHtml}</div></span></div>`;
      if (resultEquip) {
        html += `<div class="tip-craft-effect">${resultEquip.effect}</div>`;
      } else if (resultItem) {
        html += `<div class="tip-craft-effect">${resultItem.desc || '合成材料'}</div>`;
      }
      if (canMake) {
        html += `<button class="tip-craft-btn craft-btn-glow" data-recipe="${recipe.result}">✨ 合成</button>`;
      } else {
        html += `<span class="tip-craft-disabled">材料不足</span>`;
      }
      html += '</div>';
    });

    html += '</div>';

    // 异步绑定：合成按钮 + 可点击名字展开来源
    setTimeout(() => {
      const btns = document.querySelectorAll('.tip-craft-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const recipeName = btn.dataset.recipe;
          const recipe = recipes.find(r => r.result === recipeName);
          if (recipe) this._craftItem(recipe);
        });
      });

      // 名字点击展开/折叠来源（材料名 + 结果名统一处理）
      const clickables = document.querySelectorAll('.tip-craft-clickable');
      clickables.forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const srcId  = el.dataset.srcId;
          const detail = document.getElementById(srcId);
          if (!detail) return;
          const isHidden = detail.classList.contains('hidden');
          // 先收起所有已展开的
          document.querySelectorAll('.item-src-detail').forEach(d => d.classList.add('hidden'));
          document.querySelectorAll('.tip-craft-clickable').forEach(t => t.classList.remove('src-toggle-active'));
          // 若原来是收起状态，则展开本条
          if (isHidden) {
            detail.classList.remove('hidden');
            el.classList.add('src-toggle-active');
          }
        });
      });
    }, 0);

    return html;
  }

  /* ── 查询物品来源（掉落 + 合成）── */
  _getItemSource(itemName) {
    // 1. 遍历所有区域怪物，找出 drops 中包含该物品的怪物
    const droppers = [];
    if (typeof C !== 'undefined' && C.ZONES) {
      C.ZONES.forEach(zone => {
        if (!zone.monsters) return;
        zone.monsters.forEach(m => {
          if (m.drops && m.drops.includes(itemName)) {
            droppers.push({ name: m.name, type: m.type, zone: zone.name });
          }
        });
      });
    }

    // 2. 遍历合成配方，找出以该物品为结果的配方
    const recipes = [];
    const allRecipes = typeof getCraftRecipes === 'function' ? getCraftRecipes() : [];
    allRecipes.forEach(r => {
      if (r.result === itemName) {
        recipes.push(r.materials);
      }
    });

    return { droppers, recipes };
  }

  /* ── 更新合成提示栏（保留旧逻辑兼容）── */
  _updateCraftBar() {
    // 合成栏现在集成到信息面板中，旧的bag-craft-bar隐藏
    const bar = document.getElementById('bag-craft-bar');
    if (bar) bar.classList.add('hidden');
  }

  /* ── 执行合成 ── */
  _craftItem(recipe) {
    const player = this.game.player;

    // ① 用合并池（背包 + 穿戴装备）统一验证材料是否足够
    const combinedPool = this._buildCombinedPool();
    const status = checkCraftable(combinedPool);
    const cs = status.find(s => s.recipe.result === recipe.result);
    if (!cs || !cs.canMake) {
      if (this.game.ui) this.game.ui.showSkillToast('❌ 材料不足，合成失败！');
      return;
    }

    // ② 逐材料消耗：优先背包 slots，背包没有再找穿戴装备槽
    //    recipe.materials 允许重复（表示需要多件），必须逐项处理
    for (const mat of recipe.materials) {
      const bagIdx = this.slots.findIndex(s => s && s.name === mat);
      if (bagIdx !== -1) {
        // 背包中找到 → 消耗
        this.slots[bagIdx] = null;
      } else {
        // 穿戴槽中找 → 消耗
        const equipSlot = Object.keys(player.equips).find(
          k => player.equips[k] && player.equips[k].name === mat
        );
        if (!equipSlot) {
          // 理论上不会走到这里（前面 checkCraftable 已验证），保险处理
          if (this.game.ui) this.game.ui.showSkillToast('❌ 材料不足，合成失败！');
          return;
        }
        player.equips[equipSlot] = null;
        player._recalcStats();
        if (this.game.ui) this.game.ui.refresh();
      }
    }

    // ③ 生成结果：优先用 cloneEquip（按名字查 id），保证每次是独立对象
    const resultTpl = getEquipByName(recipe.result);
    let result;
    if (resultTpl) {
      result = Object.assign({}, resultTpl, resultTpl.attrs ? { attrs: Object.assign({}, resultTpl.attrs) } : {});
    } else {
      const itemTpl = getItemByName(recipe.result);
      result = itemTpl ? Object.assign({}, itemTpl) : null;
    }
    if (!result) {
      if (this.game.ui) this.game.ui.showSkillToast('❌ 合成结果未找到！');
      return;
    }

    // ④ 放入背包（若满则掉落地面）
    const emptyIdx = this.slots.indexOf(null);
    if (emptyIdx === -1) {
      if (this.game.loot) this.game.loot.spawn(this.game.player.x, this.game.player.y, result);
    } else {
      this.slots[emptyIdx] = result;
    }

    // ⑤ 提示 + 刷新界面
    if (this.game.ui) this.game.ui.showSkillToast(`✨ 合成成功！获得【${result.name}】`);
    this._hideItemInfoPanel();
    this._selected = null;
    this._renderSlots();
    this._renderEquipSlots();
    this._updateCraftBar();
  }

  /* ── 售卖选中物品 ── */
  _sellSelected() {
    if (!this._selected || this._selected.type !== 'bag') {
      if (this.game.ui) this.game.ui.showSkillToast('请先在背包中选中一件物品！');
      return;
    }
    const idx = this._selected.idx;
    const item = this.slots[idx];
    if (!item) return;
    const price = this._sellPrice(item);
    this.game.player.gold += price;
    this.slots[idx] = null;
    this._selected = null;
    if (this.game.ui) this.game.ui.showSkillToast(`💰 售出「${item.name}」获得 ${price} 金币`);
    this._renderSlots();
    this._renderEquipSlots();
  }

  /* ── 一键售卖所有白色（普通）品质 ── */
  _sellAllNormal() {
    let total = 0, count = 0;
    for (let i = 0; i < this.slots.length; i++) {
      const item = this.slots[i];
      // 同时兼容旧键 normal 和新键 white
      if (item && (item.quality === 'white' || item.quality === 'normal')) {
        total += this._sellPrice(item);
        count++;
        this.slots[i] = null;
      }
    }
    this.game.player.gold += total;
    if (this.game.ui) this.game.ui.showSkillToast(count > 0
      ? `💰 售出 ${count} 件普通装备，获得 ${total} 金币`
      : '背包中没有普通装备');
    this._renderSlots();
    this._renderEquipSlots();
  }

  _sellPrice(item) {
    // 固定售价：白色25、绿色50、蓝色100、紫色200、橙色400
    return {
      white:25, green:50, blue:100, purple:200, orange:400,
      normal:25, rare:50, epic:100, legend:200,
    }[item.quality] || 25;
  }

  /* ── 悬停提示 ── */
  _showTip(item, e) {
    const el = document.getElementById('bag-item-tip');
    el.innerHTML = Utils.describeEquip(item);
    const qInfo = getQuality(item.quality);
    el.style.borderColor = qInfo.border;
    el.style.setProperty('--tip-accent', qInfo.color);
    // 先放到鼠标旁（隐藏状态先不可见），移除 hidden 后等一帧再做边界修正
    el.style.left = (e.clientX + 14) + 'px';
    el.style.top  = (e.clientY + 16) + 'px';
    el.classList.remove('hidden');
    // rAF 保证浏览器已计算 offsetWidth/offsetHeight 后再修正位置
    requestAnimationFrame(() => this._moveTip(e));
  }

  _moveTip(e) {
    const el = document.getElementById('bag-item-tip');
    if (el.classList.contains('hidden')) return;
    const tw = el.offsetWidth  || 200;  // 兜底值，防止仍为 0
    const th = el.offsetHeight || 120;
    let x = e.clientX + 14;
    let y = e.clientY - th - 8;
    // 右边越界 → 显示在鼠标左侧
    if (x + tw > window.innerWidth - 8)  x = e.clientX - tw - 14;
    // 上边越界 → 显示在鼠标下方
    if (y < 8) y = e.clientY + 16;
    // 下边越界 → 顶住底部
    if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }

  _hideTip() {
    document.getElementById('bag-item-tip').classList.add('hidden');
  }
}
