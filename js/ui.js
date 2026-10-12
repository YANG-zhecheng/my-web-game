// ===== UI 系统 =====
class GameUI {
  constructor(game) {
    this.game = game;
    this._levelUpTimer  = 0;
    this._skillToastTimer = 0;
    this._pendingItem   = null; // 待装备的道具

    // 缓存DOM
    this.dom = {
      hpBar:    document.getElementById('hp-bar'),
      hpText:   document.getElementById('hp-text'),
      mpBar:    document.getElementById('mp-bar'),
      mpText:   document.getElementById('mp-text'),
      expBar:   document.getElementById('exp-bar'),
      expText:  document.getElementById('exp-text'),
      lvText:   document.getElementById('level-text'),
      goldText: document.getElementById('gold-text'),
      waveInfo: document.getElementById('wave-info'),
      timer:    document.getElementById('game-timer'),
      lvToast:  document.getElementById('level-up-toast'),
      skToast:  document.getElementById('skill-toast'),
      resultScreen: document.getElementById('result-screen'),
      resultTitle:  document.getElementById('result-title'),
      resultMsg:    document.getElementById('result-msg'),
      xinfaSlot:    document.getElementById('xinfa-slot'),
      xinfaStatus:  document.getElementById('xinfa-status'),
      itemPanel:       document.getElementById('item-panel'),
      itemPanelTitle:  document.getElementById('item-panel-title'),
      itemPanelContent:document.getElementById('item-panel-content'),
    };

    // 角色属性面板 DOM
    this._psAtk      = document.getElementById('ps-atk');
    this._psArmor    = document.getElementById('ps-armor');
    this._psDmgBonus = document.getElementById('ps-dmgbonus');
    this._psDodge    = document.getElementById('ps-dodge');

    // 选中目标信息 DOM
    this._targetPanel  = document.getElementById('target-info');
    this._tiName       = document.getElementById('ti-name');
    this._tiLevel      = document.getElementById('ti-level');
    this._tiHpBar      = document.getElementById('ti-hp-bar');
    this._tiHpText     = document.getElementById('ti-hp-text');
    this._tiAtk        = document.getElementById('ti-atk');
    this._tiArmor      = document.getElementById('ti-armor');
    this._tiDrops      = document.getElementById('ti-drops');
    this._tiDropsList  = document.getElementById('ti-drops-list');

    this._skillSlots = [
      document.getElementById('skill-e'),
      document.getElementById('skill-r'),
      document.getElementById('skill-t'),
      document.getElementById('skill-y'),
      document.getElementById('skill-q'),
    ];
    this._cdEls = [
      document.getElementById('cd-e'),
      document.getElementById('cd-r'),
      document.getElementById('cd-t'),
      document.getElementById('cd-y'),
      document.getElementById('cd-q'),
    ];
    this._equipSlots = {
      weapon: document.getElementById('eq-weapon'),
      head:   document.getElementById('eq-head'),
      armor:  document.getElementById('eq-armor'),
      boots:  document.getElementById('eq-boots'),
      acc1:   document.getElementById('eq-acc1'),
      acc2:   document.getElementById('eq-acc2'),
    };

    // 技能槽点击：needTarget的进入待释放状态，否则直接释放
    this._skillSlots.forEach((el, i) => {
      el.addEventListener('click', () => {
        const sk = C.SKILLS[i];
        if (sk && !sk.needTarget) {
          this.game.player.useSkill(i);
        } else {
          this.game.player.selectSkill(i);
        }
      });
      // 技能悬停 tooltip
      el.addEventListener('mouseenter', (e) => this._showSkillTooltip(i, e));
      el.addEventListener('mousemove',  (e) => this._moveSkillTooltip(e));
      el.addEventListener('mouseleave', ()  => this._hideSkillTooltip());
    });

    // 全局 tooltip 元素
    this._skillTtEl = document.getElementById('skill-tooltip');

    // 装备槽点击 => 显示信息面板；悬停 => 显示 Tooltip
    this._activeEquipSlot = null; // 当前激活的装备槽
    for (const slot in this._equipSlots) {
      const el = this._equipSlots[slot];
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = this.game.player.equips[slot];
        if (!item) return;
        // 再次点击同一个槽 → 关闭
        if (this._activeEquipSlot === slot) {
          this._activeEquipSlot = null;
          this._hideEquipTip();
        } else {
          this._activeEquipSlot = slot;
          this._showEquipInfoPanel(item, el);
        }
      });
      // 悬停 Tooltip（与技能 tooltip 共用 #skill-tooltip）
      el.addEventListener('mouseenter', (e) => {
        const item = this.game.player.equips[slot];
        if (item) this._showEquipTooltip(item, e);
      });
      el.addEventListener('mousemove',  (e) => this._moveSkillTooltip(e));
      el.addEventListener('mouseleave', ()  => this._hideSkillTooltip());
    }
    // 点击其他地方关闭装备信息面板
    document.addEventListener('click', (ev) => {
      if (this._activeEquipSlot !== null) {
        // 点到 bag-item-tip 本身内部不关闭（用户可能在读内容）
        const tip = document.getElementById('bag-item-tip');
        if (tip && tip.contains(ev.target)) return;
        this._activeEquipSlot = null;
        this._hideEquipTip();
      }
    });

    // 心法槽点击
    this.dom.xinfaSlot.addEventListener('click', () => {
      if (!this.game.player.xinfa && this.game.player.level >= C.XINFA_UNLOCK) {
        document.getElementById('xinfa-panel').classList.remove('hidden');
      }
    });
  }

  /* ── 每帧刷新 ── */
  refresh() {
    const p = this.game.player;
    if (!p) return;

    // 血量
    const hpR = p.hp / p.maxHp;
    this.dom.hpBar.style.width = `${(hpR*100).toFixed(1)}%`;
    this.dom.hpText.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;

    // 法力
    const mpR = p.mp / p.maxMp;
    this.dom.mpBar.style.width = `${(mpR*100).toFixed(1)}%`;
    this.dom.mpText.textContent = `${Math.ceil(p.mp)}/${p.maxMp}`;

    // 经验
    const expNeeded = p.level < 100 ? C.EXP_TABLE[p.level] : 1;
    const expR = p.level >= 100 ? 1 : p.exp / expNeeded;
    this.dom.expBar.style.width = `${(expR*100).toFixed(1)}%`;
    this.dom.expText.textContent = p.level >= 100 ? 'MAX' : `${p.exp}/${expNeeded}`;

    // 等级 & 金币
    this.dom.lvText.textContent  = `Lv.${p.level}`;
    this.dom.goldText.textContent = `💰 ${p.gold}`;

    // 技能 CD
    C.SKILLS.forEach((sk, i) => {
      const slot = this._skillSlots[i];
      const cdEl = this._cdEls[i];
      const unlocked = p.skillUnlocked ? p.skillUnlocked[i] : false;

      slot.classList.toggle('locked', !unlocked);

      // ── 菩提棒法 buff 激活状态（slot 1）──
      const isBodhi = (i === 1) && p._bodhiBuff && p._bodhiBuff.active;
      if (isBodhi) {
        slot.classList.remove('on-cooldown');
        slot.classList.add('bodhi-active');
        cdEl.classList.add('active');
        const remaining = p._bodhiBuff.timer;
        const totalDur  = C.SKILLS[1].buffDur || 10000;
        const ratio = remaining / totalDur;
        // 绿色填充从底部往上消退
        cdEl.style.background = `linear-gradient(to top, rgba(40,200,100,0.75) ${(ratio*100).toFixed(0)}%, transparent ${(ratio*100).toFixed(0)}%)`;
        cdEl.textContent = '✨' + (remaining/1000).toFixed(1) + 's';
        cdEl.style.display = 'flex';
        cdEl.style.alignItems = 'flex-end';
        cdEl.style.justifyContent = 'center';
        cdEl.style.fontSize = '11px';
        cdEl.style.color = '#88ffbb';
        cdEl.style.fontWeight = 'bold';
        cdEl.style.paddingBottom = '4px';
      } else if (unlocked && p.skillCD[i] > 0) {
        slot.classList.remove('bodhi-active');
        slot.classList.add('on-cooldown');
        const ratio = p.skillCD[i] / sk.cd;
        cdEl.classList.add('active');
        cdEl.style.background = `linear-gradient(to top, rgba(0,0,0,0.75) ${(ratio*100).toFixed(0)}%, transparent ${(ratio*100).toFixed(0)}%)`;
        // 显示剩余秒数
        cdEl.textContent = (p.skillCD[i]/1000).toFixed(1) + 's';
        cdEl.style.display = 'flex';
        cdEl.style.alignItems = 'flex-end';
        cdEl.style.justifyContent = 'center';
        cdEl.style.fontSize = '12px';
        cdEl.style.color = '#fff';
        cdEl.style.fontWeight = 'bold';
        cdEl.style.paddingBottom = '4px';
      } else {
        slot.classList.remove('on-cooldown');
        slot.classList.remove('bodhi-active');
        cdEl.classList.remove('active');
        cdEl.style.background = '';
        cdEl.textContent = '';
      }
      // 高亮待释放技能（金色边框+脉冲）
      slot.classList.toggle('pending-skill', p.pendingSkill === i);
    });

    // 装备槽
    for (const slot in this._equipSlots) {
      const el = this._equipSlots[slot];
      const item = p.equips[slot];
      if (item) {
        el.textContent = '';
        el.removeAttribute('title');
        el.classList.add('equipped');
        el.style.borderColor = C.QUALITY_COLOR[item.quality];
        el.style.background = `rgba(${this._qualityRgb(item.quality)},0.15)`;
        // 显示装备图标 + 完整名称
        const iconSpan = document.createElement('span');
        iconSpan.className = 'eq-icon';
        iconSpan.textContent = item.icon || getSlotIcon(item.slot);
        el.appendChild(iconSpan);
        const nameSpan = document.createElement('span');
        nameSpan.className = 'eq-name';
        nameSpan.textContent = item.name;
        nameSpan.style.color = C.QUALITY_COLOR[item.quality];
        el.appendChild(nameSpan);
      } else {
        el.textContent = '';
        el.removeAttribute('title');
        el.classList.remove('equipped');
        el.style.borderColor = '';
        el.style.background = '';
        // 空槽：显示置灰占位图标
        const ph = document.createElement('span');
        ph.className = 'equip-slot-placeholder';
        ph.textContent = getSlotIcon(slot);
        el.appendChild(ph);
      }
    }

    // 心法
    const xinfaNames = { buddha:'☯️ 佛门心法', taoism:'☲ 道教心法' };
    if (p.xinfa) {
      this.dom.xinfaSlot.textContent = xinfaNames[p.xinfa];
      this.dom.xinfaSlot.className = `xinfa-${p.xinfa}`;
    } else if (p.level >= C.XINFA_UNLOCK) {
      this.dom.xinfaSlot.textContent = '点击修炼';
      this.dom.xinfaSlot.className = '';
      this.dom.xinfaSlot.style.color = '#c8a04a';
      this.dom.xinfaSlot.style.border = '2px dashed #c8a04a';
    } else {
      this.dom.xinfaSlot.textContent = `Lv${C.XINFA_UNLOCK}解锁`;
      this.dom.xinfaSlot.className = 'xinfa-none';
    }

    // 角色属性面板
    this._psAtk.textContent      = p.atk;
    this._psArmor.textContent    = p.armor;
    this._psDmgBonus.textContent = p.dmgBonus > 0 ? `+${(p.dmgBonus*100).toFixed(0)}%` : '0%';
    this._psDodge.textContent    = `${(p.dodge*100).toFixed(1)}%`;

    // 选中目标信息面板
    const tgt = this.game.selectedTarget;
    if (tgt && !tgt.dead) {
      this._targetPanel.classList.remove('hidden');
      this._tiName.textContent  = tgt.name || '未知';
      this._tiLevel.textContent = tgt.level ? `Lv.${tgt.level}` : '';
      const hpRatio = Math.max(0, Math.min(1, tgt.hp / tgt.maxHp));
      this._tiHpBar.style.width  = `${(hpRatio * 100).toFixed(1)}%`;
      this._tiHpText.textContent = `${Math.ceil(tgt.hp)}/${tgt.maxHp}`;
      this._tiAtk.textContent   = tgt.atk   != null ? tgt.atk   : '—';
      this._tiArmor.textContent = tgt.armor != null ? tgt.armor : '—';
      // 渲染掉落列表（从 monsterConfig 读取）
      const drops = tgt.monsterConfig && tgt.monsterConfig.drops;
      if (drops && drops.length > 0) {
        // 过滤掉经验球和金币，只显示装备/物品类掉落
        const filtered = drops.filter(d => d !== '经验球' && d !== '金币');
        if (filtered.length > 0) {
          this._tiDropsList.innerHTML = filtered.map(name => {
            const equip = (typeof getEquipByName === 'function') ? getEquipByName(name) : null;
            const item  = (!equip && typeof getItemByName === 'function') ? getItemByName(name) : null;
            const obj   = equip || item;
            const qColor = obj ? (C.QUALITY_COLOR[obj.quality] || '#ccc') : '#ccc';
            const icon   = obj ? (obj.icon || '') : '';
            return `<span class="ti-drop-tag" style="color:${qColor}">${icon}${name}</span>`;
          }).join('');
          this._tiDrops.classList.remove('hidden');
        } else {
          this._tiDrops.classList.add('hidden');
        }
      } else {
        this._tiDrops.classList.add('hidden');
      }
    } else {
      this._targetPanel.classList.add('hidden');
      if (tgt && tgt.dead) this.game.selectedTarget = null;
    }
  }

  _qualityRgb(q) {
    return { normal:'180,180,180', rare:'68,153,255', epic:'170,68,255', legend:'255,136,0' }[q] || '180,180,180';
  }

  /* ── 顶部信息 ── */
  updateTopBar(waveSystem, elapsedMs) {
    const cd = waveSystem.getNextCountdown();
    const alive = waveSystem.getAllEnemies().length;

    if (waveSystem._finished) {
      // 全部波次已触发且全灭
      this.dom.waveInfo.textContent = `✅ 全部波次已清！`;
      this.dom.waveInfo.style.color = '#44ff88';
    } else if (waveSystem.currentWave >= C.TOTAL_WAVES) {
      // 最后一波已刷，等待全灭
      this.dom.waveInfo.textContent = `⚔️ 第${waveSystem.currentWave}波 剩余:${alive}只`;
      this.dom.waveInfo.style.color = '#ff6644';
    } else if (alive > 0) {
      // 有存活波次怪，同时显示剩余数量和下波倒计时
      const sec = cd !== null ? Math.ceil(cd / 1000) : '--';
      this.dom.waveInfo.textContent = `⚔️ 第${waveSystem.currentWave}波 ${alive}只 | 下波:${sec}s`;
      this.dom.waveInfo.style.color = '#ff6644';
    } else if (cd !== null) {
      // 无存活怪，倒计时下一波
      const sec = Math.ceil(cd / 1000);
      this.dom.waveInfo.textContent = waveSystem.currentWave === 0
        ? `⏳ 首波入侵 ${sec}s`
        : `第${waveSystem.currentWave+1}波入侵 ${sec}s`;
      this.dom.waveInfo.style.color = '#ffcc44';
    } else {
      this.dom.waveInfo.textContent = `等待入侵...`;
      this.dom.waveInfo.style.color = '#ff9966';
    }
    this.dom.timer.textContent = Utils.formatTime(elapsedMs);
  }

  /* ── 升级提示 ── */
  showLevelUp(lv) {
    const el = this.dom.lvToast;
    el.textContent = `🎉 升至 ${lv} 级！`;
    el.classList.remove('hidden');
    clearTimeout(this._lvTimer);
    this._lvTimer = setTimeout(() => el.classList.add('hidden'), 2000);
  }

  /* ── 提示 Toast（多条同时显示，从上往下堆叠，各自独立计时 2000ms）── */
  showSkillToast(msg) {
    if (!this._activeToasts) this._activeToasts = [];

    const TOAST_H   = 54;
    const TOAST_GAP = 8;
    const BASE_TOP  = 0.38;

    const container  = document.getElementById('game-container') || document.body;
    const containerH = container.offsetHeight || 600;
    const baseTopPx  = containerH * BASE_TOP;

    // 当前已显示的条数决定本条的 top（创建后不再变动）
    const idx   = this._activeToasts.length;
    const topPx = baseTopPx + idx * (TOAST_H + TOAST_GAP);

    const el = document.createElement('div');
    el.className   = 'skill-toast';
    el.textContent = msg;
    el.style.top   = topPx + 'px';
    container.appendChild(el);

    this._activeToasts.push(el);

    // 2000ms 后仅移除该元素，不改变其他 Toast 的位置
    setTimeout(() => {
      el.remove();
      const i = this._activeToasts.indexOf(el);
      if (i !== -1) this._activeToasts.splice(i, 1);
    }, 2000);
  }

  /* ── 波次入侵提示（醒目横幅 + 顶部toast）── */
  showWaveAlert(wave, total) {
    // 技能toast提示
    this.showSkillToast(`🔥 第 ${wave}/${total} 波妖怪入侵！快回去保护唐僧！`);
    // 顶部波次信息同步更新颜色
    if (this.dom.waveInfo) {
      this.dom.waveInfo.style.color = '#ff4444';
    }
    // 复用横幅DOM：借用 quest-complete-banner 样式或用独立 wave-alert-banner
    let banner = document.getElementById('wave-alert-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wave-alert-banner';
      banner.style.cssText = [
        'position:fixed','top:20%','left:50%','transform:translateX(-50%)',
        'background:rgba(180,0,0,0.88)','color:#fff','padding:14px 32px',
        'border-radius:10px','font-size:22px','font-weight:bold',
        'z-index:9999','text-align:center','pointer-events:none',
        'box-shadow:0 4px 24px rgba(255,0,0,0.5)',
        'border:2px solid #ff6644',
        'transition:opacity 0.4s',
      ].join(';');
      document.body.appendChild(banner);
    }
    banner.innerHTML = `⚔️ 第 ${wave}/${total} 波妖怪入侵！<br><span style="font-size:14px;color:#ffcc66">速回主城保护唐僧！</span>`;
    banner.style.opacity = '1';
    banner.style.display = 'block';
    clearTimeout(this._waveAlertTimer);
    this._waveAlertTimer = setTimeout(() => {
      banner.style.opacity = '0';
      setTimeout(() => { banner.style.display = 'none'; }, 400);
    }, 4000);
  }

  /* ── 装备拾取提示 ── */
  showItemDrop(item) {
    this._pendingItem = item;
    this.dom.itemPanelTitle.textContent = `💎 获得装备！`;
    this.dom.itemPanelContent.innerHTML = Utils.describeEquip(item);
    this.dom.itemPanel.classList.remove('hidden');
  }

  _showItemDetail(item) {
    this._pendingItem = item;
    this.dom.itemPanelTitle.textContent = `📦 装备详情`;
    this.dom.itemPanelContent.innerHTML = Utils.describeEquip(item);
    document.getElementById('btn-equip-item').style.display = 'none'; // 已装备无需再装
    this.dom.itemPanel.classList.remove('hidden');
  }

  /* ── 胜负界面 ── */
  showResult(win, msg) {
    const title = this.dom.resultTitle;
    const msgEl = this.dom.resultMsg;
    title.textContent = win ? '🎉 恭喜！取经成功！' : '💀 唐僧遇难...';
    title.className   = win ? 'win' : 'lose';
    msgEl.textContent = msg;
    this.dom.resultScreen.classList.remove('hidden');
  }

  /* ── 显示死亡遮罩（带倒计时更新）── */
  showDeathOverlay(totalSec) {
    const overlay = document.getElementById('death-overlay');
    const timerEl = document.getElementById('death-timer');
    if (!overlay || !timerEl) return;
    // 重置动画
    overlay.classList.remove('hidden');
    overlay.style.animation = 'none';
    overlay.offsetHeight;
    overlay.style.animation = '';
    timerEl.textContent = `${totalSec} 秒后在师傅处复活`;
    this._deathTimerEl = timerEl;
    this._deathOverlayEl = overlay;
  }

  /* ── 更新死亡遮罩倒计时 ── */
  updateDeathTimer(remainMs) {
    if (!this._deathTimerEl) return;
    const sec = Math.ceil(remainMs / 1000);
    this._deathTimerEl.textContent = `${sec} 秒后在师傅处复活`;
    // 最后3秒变红色闪烁
    if (sec <= 3) {
      this._deathTimerEl.style.color = '#ff4444';
    } else {
      this._deathTimerEl.style.color = '';
    }
  }

  /* ── 隐藏死亡遮罩 ── */
  hideDeathOverlay() {
    if (!this._deathOverlayEl) return;
    const overlay = this._deathOverlayEl;
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '';
      overlay.style.transition = '';
    }, 500);
    this._deathTimerEl = null;
    this._deathOverlayEl = null;
  }

  /* ── 技能 Tooltip ── */
  _showSkillTooltip(idx, e) {
    if (!this._skillTtEl) return;
    const sk = C.SKILLS[idx];
    if (!sk) return;
    const p = this.game.player;
    const unlocked = p.skillUnlocked && p.skillUnlocked[idx];
    const unlockLv = C.SKILL_UNLOCK[idx];
    const cdSec = (sk.cd / 1000).toFixed(0);
    const mpCost = sk.mpCost;
    let html = `<div class="stt-name">${sk.key} · ${sk.name}</div>`;
    html += `<div class="stt-row"><span class="stt-label">冷却</span><span class="stt-val">${cdSec}s</span></div>`;
    if (mpCost > 0) {
      html += `<div class="stt-row"><span class="stt-label">消耗</span><span class="stt-val stt-mp">${mpCost} MP</span></div>`;
    } else {
      html += `<div class="stt-row"><span class="stt-label">消耗</span><span class="stt-val stt-mp">无</span></div>`;
    }
    html += `<div class="stt-desc">${sk.desc}</div>`;
    if (!unlocked) {
      html += `<div class="stt-lock">🔒 需达到 Lv.${unlockLv} 解锁</div>`;
    } else if (p.skillCD[idx] > 0) {
      html += `<div class="stt-lock" style="color:#ffaa44">⏳ 冷却中 ${(p.skillCD[idx]/1000).toFixed(1)}s</div>`;
    }
    this._skillTtEl.innerHTML = html;
    this._skillTtEl.classList.remove('hidden');
    this._moveSkillTooltip(e);
  }

  _moveSkillTooltip(e) {
    if (!this._skillTtEl || this._skillTtEl.classList.contains('hidden')) return;
    const ttw = this._skillTtEl.offsetWidth;
    const tth = this._skillTtEl.offsetHeight;
    let x = e.clientX + 12;
    let y = e.clientY - tth - 8;
    if (x + ttw > window.innerWidth - 8) x = e.clientX - ttw - 12;
    if (y < 8) y = e.clientY + 16;
    this._skillTtEl.style.left = x + 'px';
    this._skillTtEl.style.top  = y + 'px';
  }

  _hideSkillTooltip() {
    if (this._skillTtEl) this._skillTtEl.classList.add('hidden');
  }

  /* ── 底部装备格悬停 Tooltip（复用 #skill-tooltip）── */
  _showEquipTooltip(item, e) {
    if (!this._skillTtEl) return;
    const qInfo    = getQuality(item.quality);
    const qColor   = qInfo ? qInfo.color : '#c8c8c8';
    const slotName = C.EQUIP_SLOT_NAMES[item.slot] || item.slot || '';
    const qName    = C.QUALITY_NAME[item.quality]  || item.quality || '';
    const attrs    = item.attrs || {};

    // 标题行（品质颜色）
    let html = `<div class="stt-name" style="color:${qColor}">${item.icon || ''} ${item.name}</div>`;
    html += `<div class="stt-row"><span class="stt-label">部位</span><span class="stt-val">${slotName}</span></div>`;
    html += `<div class="stt-row"><span class="stt-label">品质</span><span class="stt-val" style="color:${qColor}">${qName}</span></div>`;

    // 数值属性行（与 describeEquip 保持一致的百分比判断逻辑）
    const PCT_KEYS = new Set(['dodge','atkSpeed','dmgBonus','dmgReduce','speed']);
    const ATTR_LABEL = {
      atk:'⚔️ 攻击', armor:'🛡️ 防御', hp:'❤️ 生命', mp:'💧 法力',
      dodge:'🌀 闪避', speed:'💨 移速', atkSpeed:'⚡ 攻速',
      dmgBonus:'💥 增伤', dmgReduce:'🛡 减伤',
    };
    for (const [key, label] of Object.entries(ATTR_LABEL)) {
      const v = attrs[key];
      if (v == null || v === 0) continue;
      const isPct = PCT_KEYS.has(key) && Math.abs(v) <= 1;
      const valStr = isPct ? `+${(v * 100).toFixed(1)}%` : `+${v}`;
      html += `<div class="stt-row"><span class="stt-label">${label}</span><span class="stt-val" style="color:#88ffbb">${valStr}</span></div>`;
    }

    // 效果原文（斜体小字，金色）
    if (item.effect) {
      html += `<div class="stt-desc" style="color:#c8a04a;margin-top:4px">✦ ${item.effect}</div>`;
    }

    this._skillTtEl.innerHTML = html;
    this._skillTtEl.classList.remove('hidden');
    this._moveSkillTooltip(e);
  }

  /* ── 装备栏点击信息面板（复用背包的 bag-item-tip）── */
  _showEquipInfoPanel(item, slotEl) {
    const el = document.getElementById('bag-item-tip');
    if (!el) return;
    el.innerHTML = Utils.describeEquip(item);
    const qInfo = getQuality(item.quality);
    el.style.borderColor = qInfo.border;
    el.style.setProperty('--tip-accent', qInfo.color);
    el.style.position = 'fixed';
    el.classList.remove('hidden');

    // 定位在装备槽上方
    requestAnimationFrame(() => {
      const slotRect = slotEl.getBoundingClientRect();
      const tw = el.offsetWidth || 220;
      const th = el.offsetHeight || 150;
      let x = slotRect.left + slotRect.width / 2 - tw / 2;
      let y = slotRect.top - th - 10;
      // 上方放不下 → 放到下方
      if (y < 8) y = slotRect.bottom + 10;
      // 左右越界
      if (x < 8) x = 8;
      if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    });
  }

  _hideEquipTip() {
    const el = document.getElementById('bag-item-tip');
    if (el) el.classList.add('hidden');
  }

  /* ── 刷新任务追踪面板（左上角）── */
  refreshQuests() {
    const panel = document.getElementById('quest-tracker');
    if (!panel) return;
    const qm = this.game.quest;
    if (!qm) return;
    const quests = qm.getActiveQuests();
    if (quests.length === 0) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    panel.innerHTML = quests.map(q => {
      const isPending = q.status === 'pending_turn_in';
      const condHtml = q.progress.map(p => {
        const done = p.current >= p.count;
        return `<div class="qt-cond ${done ? 'qt-cond-done' : ''}">
          ${done ? '✓' : '○'} ${p.label}：${p.current}/${p.count}
        </div>`;
      }).join('');
      const pendingHint = isPending
        ? `<div class="qt-turn-in-hint">📍 返回唐僧交付任务！</div>`
        : '';
      return `<div class="qt-item ${isPending ? 'qt-item-pending' : ''}">
        <div class="qt-title">${q.icon} ${q.title}${isPending ? ' <span class="qt-ready-tag">可交付</span>' : ''}</div>
        ${condHtml}
        ${pendingHint}
      </div>`;
    }).join('');
  }

  /* ── 任务完成横幅动画 ── */
  showQuestComplete(title) {
    let banner = document.getElementById('quest-complete-banner');
    if (!banner) return;
    banner.querySelector('#qcb-title').textContent = `✅ 任务完成：${title}`;
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    banner.offsetHeight; // reflow
    banner.style.animation = '';
    clearTimeout(this._qcbTimer);
    this._qcbTimer = setTimeout(() => {
      banner.style.transition = 'opacity 0.6s, transform 0.6s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(-16px)';
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.style.opacity = '';
        banner.style.transform = '';
        banner.style.transition = '';
      }, 600);
    }, 3500);
  }
}
