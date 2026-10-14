// ===== 装备图鉴 =====
class EquipCodex {
  constructor(game) {
    this.game        = game;
    this._panel      = document.getElementById('craft-book-panel');
    this._list       = document.getElementById('cb-recipe-list');
    this._detail     = document.getElementById('cb-detail-panel');
    this._activeTab  = 'all';
    this._selectedId = null;

    this._bindTabs();
  }

  /* ── 开关面板 ── */
  toggle() {
    const hidden = this._panel.classList.toggle('hidden');
    if (!hidden) this._render();
  }

  /* ── 绑定顶部品质 Tab ── */
  _bindTabs() {
    this._panel.querySelectorAll('.cb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._panel.querySelectorAll('.cb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._activeTab  = tab.dataset.quality;
        this._selectedId = null;
        this._render();
      });
    });
  }

  /* ── 获取玩家已拥有的所有装备名称集合 ── */
  _getOwnedNames() {
    const owned = new Set();
    const bag   = this.game && this.game.bag;
    const player = this.game && this.game.player;

    // 背包中
    if (bag) {
      bag.slots.forEach(s => { if (s && s.name) owned.add(s.name); });
    }
    // 已装备
    if (player && player.equips) {
      Object.values(player.equips).forEach(e => { if (e && e.name) owned.add(e.name); });
    }
    return owned;
  }

  /* ── 获取装备的所有来源（掉落 + 合成）── */
  _getSources(equipName) {
    const droppers = [];
    if (typeof C !== 'undefined' && C.ZONES) {
      C.ZONES.forEach(zone => {
        if (!zone.monsters) return;
        zone.monsters.forEach(m => {
          if (m.drops && m.drops.includes(equipName)) {
            const typeLabel = m.type === 'boss' ? '🔴' : '⚪';
            droppers.push(`${typeLabel} 击杀 <b>${m.name}</b>`);
          }
        });
      });
    }

    const craftSources = [];
    if (typeof getCraftRecipes === 'function') {
      getCraftRecipes().forEach(r => {
        if (r.result === equipName) {
          const unique = [...new Set(r.materials)];
          craftSources.push(`⚗️ <b>${unique.join('</b> + <b>')}</b> 合成`);
        }
      });
    }
    return { droppers, craftSources };
  }

  /* ── 渲染左侧装备列表 ── */
  _render() {
    const owned    = this._getOwnedNames();
    const recipes  = typeof getCraftRecipes === 'function' ? getCraftRecipes() : [];
    const recipeResultSet = new Set(recipes.map(r => r.result));

    // 品质筛选
    const allEquips = typeof EQUIP_RAW !== 'undefined' ? EQUIP_RAW : [];
    const filtered  = this._activeTab === 'all'
      ? allEquips
      : allEquips.filter(e => e.quality === this._activeTab);

    // 品质排序权重
    const QUALITY_ORDER = { '白':0, '绿':1, '蓝':2, '紫':3, '金':4, '橙':4 };
    const sorted = [...filtered].sort((a, b) => {
      const qa = QUALITY_ORDER[a.quality] ?? 5;
      const qb = QUALITY_ORDER[b.quality] ?? 5;
      return qa !== qb ? qa - qb : a.id - b.id;
    });

    // 品质颜色映射
    const QUALITY_COLORS = {
      '白': '#c8c8c8', '绿': '#44dd66', '蓝': '#44aaff',
      '紫': '#cc66ff', '金': '#ff9933', '橙': '#ff9933',
    };
    const QUALITY_LABEL = {
      '白': '白色', '绿': '绿色', '蓝': '蓝色',
      '紫': '紫色', '金': '橙色', '橙': '橙色',
    };

    this._list.innerHTML = '';

    let lastQuality = null;
    sorted.forEach(equip => {
      // 品质分组标题
      if (equip.quality !== lastQuality) {
        lastQuality = equip.quality;
        const sep = document.createElement('div');
        sep.className = 'cb-quality-sep';
        sep.style.color = QUALITY_COLORS[equip.quality] || '#fff';
        sep.textContent = `── ${QUALITY_LABEL[equip.quality] || equip.quality} ──`;
        this._list.appendChild(sep);
      }

      const isOwned   = owned.has(equip.name);
      const hasCraft  = recipeResultSet.has(equip.name);
      const isSelected = this._selectedId === equip.id;
      const qColor    = QUALITY_COLORS[equip.quality] || '#fff';
      const slot      = typeof inferSlot === 'function' ? inferSlot(equip.name, equip.effect) : '';
      const slotIcon  = typeof getSlotIcon === 'function' ? getSlotIcon(slot) : '📦';

      const card = document.createElement('div');
      card.className = `cb-equip-card${isOwned ? ' cb-owned' : ''}${isSelected ? ' cb-selected' : ''}`;
      card.style.setProperty('--q-color', qColor);
      card.innerHTML = `
        <span class="cb-card-icon">${slotIcon}</span>
        <span class="cb-card-name" style="color:${qColor}">${equip.name}</span>
        ${isOwned ? '<span class="cb-owned-badge">✓ 已拥有</span>' : ''}
        ${hasCraft ? '<span class="cb-craft-badge">⚗️</span>' : ''}
      `;
      card.addEventListener('click', () => {
        this._selectedId = equip.id;
        this._showDetail(equip, owned);
        // 更新选中高亮
        this._list.querySelectorAll('.cb-equip-card').forEach(c => c.classList.remove('cb-selected'));
        card.classList.add('cb-selected');
      });
      this._list.appendChild(card);
    });

    // 若有已选中项，刷新详情
    if (this._selectedId !== null) {
      const sel = sorted.find(e => e.id === this._selectedId);
      if (sel) this._showDetail(sel, owned);
    }
  }

  /* ── 渲染右侧装备详情 ── */
  _showDetail(equip, owned) {
    const QUALITY_COLORS = {
      '白': '#c8c8c8', '绿': '#44dd66', '蓝': '#44aaff',
      '紫': '#cc66ff', '金': '#ff9933', '橙': '#ff9933',
    };
    const QUALITY_LABEL = {
      '白': '白色', '绿': '绿色', '蓝': '蓝色',
      '紫': '紫色', '金': '橙色', '橙': '橙色',
    };

    const qColor   = QUALITY_COLORS[equip.quality] || '#fff';
    const qLabel   = QUALITY_LABEL[equip.quality]  || equip.quality;
    const slot     = typeof inferSlot    === 'function' ? inferSlot(equip.name, equip.effect) : '';
    const slotName = typeof C !== 'undefined' && C.EQUIP_SLOT_NAMES ? (C.EQUIP_SLOT_NAMES[slot] || slot) : slot;
    const slotIcon = typeof getSlotIcon  === 'function' ? getSlotIcon(slot) : '📦';
    const isOwned  = owned.has(equip.name);

    // 属性列表
    const attrs = typeof parseEffect === 'function' ? parseEffect(equip.effect) : {};
    const ATTR_NAMES = {
      atk:'攻击', armor:'防御', hp:'血量', mp:'魔法',
      speed:'移速', dodge:'闪避', atkSpeedBonus:'攻速',
      damageReduction:'减伤', dmgBonus:'增伤', critBonus:'暴击',
      splashBonus:'溅射', hpRegen:'回血',
    };
    const attrHtml = Object.entries(attrs).map(([k, v]) => {
      const label = ATTR_NAMES[k] || k;
      const isPercent = ['dodge','atkSpeedBonus','damageReduction','dmgBonus','critBonus','splashBonus','speed'].includes(k);
      const isRegen   = k === 'hpRegen';
      const val = isPercent ? `+${Math.round(v*100)}%`
                : isRegen   ? `+${v}/s`
                : (v > 0 ? `+${v}` : `${v}`);
      return `<div class="cd-attr-row"><span class="cd-attr-name">${label}</span><span class="cd-attr-val" style="color:#88ff88">${val}</span></div>`;
    }).join('');

    // 来源
    const { droppers, craftSources } = this._getSources(equip.name);
    let sourceHtml = '';
    if (droppers.length > 0 || craftSources.length > 0) {
      sourceHtml = '<div class="cd-source-title">📌 获取来源</div>';
      [...droppers, ...craftSources].forEach(line => {
        sourceHtml += `<div class="cd-source-line">${line}</div>`;
      });
    } else {
      sourceHtml = '<div class="cd-source-title">📌 获取来源</div><div class="cd-source-line cd-no-source">暂无已知来源</div>';
    }

    // 合成配方（该装备作为材料能合成什么）
    const recipes = typeof getCraftRecipes === 'function' ? getCraftRecipes() : [];
    const asMatRecipes = recipes.filter(r => r.materials.includes(equip.name));
    let craftHtml = '';
    if (asMatRecipes.length > 0) {
      craftHtml = '<div class="cd-source-title">⚗️ 可用于合成</div>';
      asMatRecipes.forEach(r => {
        const resultEquip = typeof getEquipByName === 'function' ? getEquipByName(r.result) : null;
        const rColor = resultEquip ? (QUALITY_COLORS[resultEquip.quality] || '#fff') : '#fff';
        const mats   = [...new Set(r.materials)].join(' + ');
        craftHtml += `<div class="cd-craft-row"><span class="cd-craft-mats">${mats}</span><span class="cd-craft-arrow">⇒</span><span class="cd-craft-result" style="color:${rColor}">【${r.result}】</span></div>`;
      });
    }

    this._detail.innerHTML = `
      <div class="cd-name" style="color:${qColor}">
        ${slotIcon} ${equip.name}
        ${isOwned ? '<span class="cd-owned-tag">✓ 已拥有</span>' : ''}
      </div>
      <div class="cd-meta">
        <span style="color:${qColor}">${qLabel}</span>
        <span class="cd-slot">${slotName}</span>
      </div>
      <div class="cd-divider"></div>
      <div class="cd-attrs">${attrHtml}</div>
      <div class="cd-divider"></div>
      ${sourceHtml}
      ${craftHtml ? '<div class="cd-divider"></div>' + craftHtml : ''}
    `;
  }
}
