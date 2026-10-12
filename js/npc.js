// ===== NPC 人物绘制函数 =====

/**
 * 绘制土地公 Q版人物（头大身小）
 * cx/cy = 人物脚底中心点，scale = 整体缩放（默认1，radius≈22时用1）
 */
function drawTuDiGong(ctx, cx, cy, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ── 拐杖（最底层，先画）──
  const bodyTop = -28 * s;
  const handY   = bodyTop - 2 * s;
  ctx.beginPath();
  ctx.moveTo(-16 * s, handY + 4 * s);
  ctx.lineTo(-18 * s, bodyTop - 18 * s);
  ctx.strokeStyle = '#7a4a08';
  ctx.lineWidth = 3 * s;
  ctx.stroke();
  // 弯钩
  ctx.beginPath();
  ctx.arc(-21 * s, bodyTop - 18 * s, 3 * s, Math.PI * 0.5, Math.PI * 1.6, false);
  ctx.strokeStyle = '#7a4a08';
  ctx.lineWidth = 3 * s;
  ctx.stroke();

  // ── 身体（矮胖红袍）──
  ctx.beginPath();
  ctx.ellipse(0, bodyTop + 10 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#cc2200';
  ctx.fill();
  ctx.strokeStyle = '#881000';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  // 腰带
  ctx.beginPath();
  ctx.ellipse(0, bodyTop + 7 * s, 10 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f0c040';
  ctx.fill();
  ctx.strokeStyle = '#b08800';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // ── 左手（持杖） ──
  ctx.beginPath();
  ctx.arc(-16 * s, handY + 4 * s, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c890';
  ctx.fill();
  ctx.strokeStyle = '#c07840';
  ctx.lineWidth = 1 * s;
  ctx.stroke();
  // ── 右手 ──
  ctx.beginPath();
  ctx.arc(14 * s, handY + 4 * s, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c890';
  ctx.fill();
  ctx.strokeStyle = '#c07840';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // ── 脖子 ──
  ctx.fillStyle = '#f5c890';
  ctx.fillRect(-3 * s, bodyTop - 3 * s, 6 * s, 5 * s);

  // ══════════════════════════════
  //  大头（纯色+硬轮廓，无渐变）
  // ══════════════════════════════
  const headR  = 16 * s;
  const headCY = bodyTop - headR;

  // 头部底色（纯肤色）
  ctx.beginPath();
  ctx.arc(0, headCY, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c078';
  ctx.fill();
  ctx.strokeStyle = '#c07030';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  // ── 红官帽 ──
  const hatY = headCY - headR * 0.25;
  // 帽身（填充梯形）
  ctx.beginPath();
  ctx.moveTo(-headR * 0.88, hatY);
  ctx.lineTo(-headR * 0.52, headCY - headR * 1.0);
  ctx.lineTo(headR * 0.52, headCY - headR * 1.0);
  ctx.lineTo(headR * 0.88, hatY);
  ctx.closePath();
  ctx.fillStyle = '#dd1100';
  ctx.fill();
  ctx.strokeStyle = '#991000';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  // 帽顶弧面
  ctx.beginPath();
  ctx.arc(0, headCY - headR * 0.98, headR * 0.52, Math.PI, 0, false);
  ctx.fillStyle = '#cc0f00';
  ctx.fill();
  // 帽檐（扁椭圆）
  ctx.beginPath();
  ctx.ellipse(0, hatY, headR * 1.08, 5 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#cc1100';
  ctx.fill();
  ctx.strokeStyle = '#f0c040';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  // 帽顶金珠
  ctx.beginPath();
  ctx.arc(0, headCY - headR * 1.18, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f8d030';
  ctx.fill();
  ctx.strokeStyle = '#b08000';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // ── 白寿眉（实心填充月牙形）──
  function drawBrow(bx) {
    ctx.save();
    ctx.translate(bx, headCY - headR * 0.3);
    ctx.scale(bx < 0 ? 1 : -1, 1); // 镜像右眉
    ctx.beginPath();
    ctx.moveTo(-7 * s, 0);
    ctx.quadraticCurveTo(-4 * s, -5 * s, 2 * s, -2 * s);
    ctx.quadraticCurveTo(-4 * s, -1 * s, -7 * s, 2 * s);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  drawBrow(-headR * 0.36);
  drawBrow( headR * 0.36);

  // ── 眯眼（实心月牙）──
  function drawEye(ex) {
    ctx.save();
    ctx.translate(ex, headCY - headR * 0.08);
    ctx.beginPath();
    ctx.moveTo(-4 * s, 0);
    ctx.quadraticCurveTo(0, -4 * s, 4 * s, 0);
    ctx.quadraticCurveTo(0, 1 * s, -4 * s, 0);
    ctx.closePath();
    ctx.fillStyle = '#2a1500';
    ctx.fill();
    ctx.restore();
  }
  drawEye(-headR * 0.32);
  drawEye( headR * 0.32);

  // ── 圆鼻头 ──
  ctx.beginPath();
  ctx.arc(0, headCY + headR * 0.1, 3.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#d4894a';
  ctx.fill();
  ctx.strokeStyle = '#b06030';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // ── 笑口（实心半椭圆嘴）──
  ctx.beginPath();
  ctx.ellipse(0, headCY + headR * 0.26, 6 * s, 3.5 * s, 0, 0, Math.PI, false);
  ctx.fillStyle = '#6a2000';
  ctx.fill();
  // 上唇线
  ctx.beginPath();
  ctx.moveTo(-6 * s, headCY + headR * 0.26);
  ctx.lineTo(6 * s, headCY + headR * 0.26);
  ctx.strokeStyle = '#3a1000';
  ctx.lineWidth = 1.2 * s;
  ctx.stroke();

  // ── 白胡须（线条式，清晰可辨）──
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * s;
  // 左侧三根
  ctx.beginPath(); ctx.moveTo(-4*s, headCY+headR*0.38); ctx.quadraticCurveTo(-10*s, headCY+headR*0.55, -9*s, headCY+headR*0.78); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2*s, headCY+headR*0.4);  ctx.quadraticCurveTo(-6*s,  headCY+headR*0.62, -4*s, headCY+headR*0.85); ctx.stroke();
  // 中间两根
  ctx.beginPath(); ctx.moveTo(0,    headCY+headR*0.42); ctx.lineTo(0, headCY+headR*0.88); ctx.stroke();
  // 右侧三根
  ctx.beginPath(); ctx.moveTo(2*s,  headCY+headR*0.4);  ctx.quadraticCurveTo(6*s,   headCY+headR*0.62, 4*s,  headCY+headR*0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4*s,  headCY+headR*0.38); ctx.quadraticCurveTo(10*s,  headCY+headR*0.55, 9*s,  headCY+headR*0.78); ctx.stroke();

  // ── 腮红（淡粉，透明度低）──
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ff6666';
  ctx.beginPath(); ctx.ellipse(-headR*0.54, headCY+headR*0.1, 5*s, 3*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( headR*0.54, headCY+headR*0.1, 5*s, 3*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/**
 * 绘制商人 Q版人物（头大身小）
 * cx/cy = 人物脚底中心点，scale = 整体缩放
 */
function drawMerchant(ctx, cx, cy, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.translate(cx, cy);

  // ── 身体（绿色短褂）──
  const bodyW = 17 * s, bodyH = 15 * s;
  const bodyTop = -26 * s;
  const coatGrd = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyH);
  coatGrd.addColorStop(0, '#2d8c4e');
  coatGrd.addColorStop(1, '#1a5c30');
  ctx.beginPath();
  ctx.ellipse(0, bodyTop + bodyH * 0.55, bodyW * 0.5, bodyH * 0.52, 0, 0, Math.PI * 2);
  ctx.fillStyle = coatGrd;
  ctx.fill();
  // 衣领白边
  ctx.beginPath();
  ctx.moveTo(-5 * s, bodyTop);
  ctx.lineTo(0, bodyTop + 6 * s);
  ctx.lineTo(5 * s, bodyTop);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 * s;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // 腰带（棕色）
  ctx.beginPath();
  ctx.ellipse(0, bodyTop + bodyH * 0.5, bodyW * 0.44, 3 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8B5E0A';
  ctx.fill();

  // ── 背包（右肩）──
  const packX = bodyW * 0.55, packY = bodyTop + bodyH * 0.1;
  ctx.beginPath();
  ctx.roundRect ? (ctx.beginPath(), ctx.roundRect(packX - 2 * s, packY - 4 * s, 12 * s, 14 * s, 3 * s), ctx.fillStyle = '#a05c10', ctx.fill())
                : (() => { ctx.rect(packX - 2 * s, packY - 4 * s, 12 * s, 14 * s); ctx.fillStyle = '#a05c10'; ctx.fill(); })();
  // 背包扣
  ctx.beginPath();
  ctx.rect(packX + 2 * s, packY + 2 * s, 5 * s, 3 * s);
  ctx.fillStyle = '#f0c040';
  ctx.fill();
  // 背包带
  ctx.beginPath();
  ctx.moveTo(packX - 2 * s, packY - 2 * s);
  ctx.lineTo(-2 * s, bodyTop - 2 * s);
  ctx.strokeStyle = '#7a4510';
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  // ── 双手 ──
  const handY = bodyTop + bodyH * 0.28;
  ctx.beginPath();
  ctx.arc(-bodyW * 0.58, handY, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f5cfa0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyW * 0.58, handY, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#f5cfa0';
  ctx.fill();
  // 左手持算盘杆
  ctx.beginPath();
  ctx.moveTo(-bodyW * 0.58, handY);
  ctx.lineTo(-bodyW * 0.65, bodyTop - 4 * s);
  ctx.strokeStyle = '#8B5E0A';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.stroke();
  // 算盘框
  const abX = -bodyW * 0.65 - 6 * s, abY = bodyTop - 13 * s;
  ctx.strokeStyle = '#8B5E0A';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(abX, abY, 12 * s, 10 * s);
  // 算盘横线
  ctx.beginPath();
  ctx.moveTo(abX, abY + 4 * s);
  ctx.lineTo(abX + 12 * s, abY + 4 * s);
  ctx.stroke();
  // 算珠
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(abX + 2 * s + i * 4 * s, abY + 2 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c040';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(abX + 2 * s + i * 4 * s, abY + 7 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#f0c040';
    ctx.fill();
  }

  // ── 脖子 ──
  ctx.beginPath();
  ctx.rect(-3.5 * s, bodyTop - 3 * s, 7 * s, 5 * s);
  ctx.fillStyle = '#f5cfa0';
  ctx.fill();

  // ── 大头 ──
  const headR = 15 * s;
  const headCY = bodyTop - headR + 2 * s;
  const skinGrd = ctx.createRadialGradient(-3 * s, headCY - 3 * s, 2 * s, 0, headCY, headR);
  skinGrd.addColorStop(0, '#ffe0b8');
  skinGrd.addColorStop(1, '#f0a870');
  ctx.beginPath();
  ctx.arc(0, headCY, headR, 0, Math.PI * 2);
  ctx.fillStyle = skinGrd;
  ctx.fill();
  ctx.strokeStyle = '#c07840';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // ── 草帽 ──
  // 帽身（锥形）
  ctx.beginPath();
  ctx.moveTo(-headR * 1.3, headCY - headR * 0.2);
  ctx.lineTo(0, headCY - headR * 1.15);
  ctx.lineTo(headR * 1.3, headCY - headR * 0.2);
  ctx.closePath();
  ctx.fillStyle = '#d4a840';
  ctx.fill();
  ctx.strokeStyle = '#a07820';
  ctx.lineWidth = 1 * s;
  ctx.stroke();
  // 帽檐（椭圆）
  ctx.beginPath();
  ctx.ellipse(0, headCY - headR * 0.18, headR * 1.35, 5.5 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c8992a';
  ctx.fill();
  ctx.strokeStyle = '#906810';
  ctx.lineWidth = 1 * s;
  ctx.stroke();
  // 帽带
  ctx.beginPath();
  ctx.arc(0, headCY - headR * 0.15, headR * 1.0, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.strokeStyle = '#e05010';
  ctx.lineWidth = 2 * s;
  ctx.stroke();

  // ── 眉毛 ──
  ctx.strokeStyle = '#5a3510';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, headCY - headR * 0.28);
  ctx.quadraticCurveTo(-headR * 0.28, headCY - headR * 0.4, -headR * 0.1, headCY - headR * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(headR * 0.5, headCY - headR * 0.28);
  ctx.quadraticCurveTo(headR * 0.28, headCY - headR * 0.4, headR * 0.1, headCY - headR * 0.3);
  ctx.stroke();

  // ── 眼睛（圆眼睛+高光）──
  const eyeLX = -headR * 0.3, eyeRX = headR * 0.3, eyeY = headCY - headR * 0.1;
  ctx.fillStyle = '#3a2000';
  ctx.beginPath(); ctx.arc(eyeLX, eyeY, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeRX, eyeY, 3.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(eyeLX + 1.2 * s, eyeY - 1.2 * s, 1.2 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeRX + 1.2 * s, eyeY - 1.2 * s, 1.2 * s, 0, Math.PI * 2); ctx.fill();

  // ── 鼻子 ──
  ctx.beginPath();
  ctx.arc(0, headCY + headR * 0.08, 3 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#e09060';
  ctx.fill();

  // ── 笑口（咧嘴）──
  ctx.beginPath();
  ctx.arc(0, headCY + headR * 0.12, 7 * s, 0.05, Math.PI - 0.05, false);
  ctx.strokeStyle = '#8B3000';
  ctx.lineWidth = 1.8 * s;
  ctx.stroke();
  // 两颗门牙
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3.5 * s, headCY + headR * 0.12, 3 * s, 3.5 * s);
  ctx.fillRect(0.5 * s, headCY + headR * 0.12, 3 * s, 3.5 * s);

  // ── 腮红 ──
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ff8888';
  ctx.beginPath();
  ctx.ellipse(-headR * 0.52, headCY + headR * 0.1, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(headR * 0.52, headCY + headR * 0.1, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ===== 土地公 NPC =====
// 玩家达到20级后，在主城上方刷新土地公，点击可传送至各区域

class TuDiGong {
  constructor(game) {
    this.game = game;

    // 关卡表坐标：主城(1,2) 格[74,49] → 世界坐标(5000, 7525)，向下移动333px至7858
    this.x = 5000;
    this.y = 7858;
    this.radius = 22;

    // 各区域传送目标点（各区域底部200px处中央）
    this.teleportTargets = C.ZONES
      .filter(z => z.id !== 'main_city')
      .map(z => {
        const rect = C.getZoneRect(z.col, z.row);
        return {
          zoneId: z.id,
          name:   z.name,
          emoji:  z.emoji,
          x: rect.x + rect.w / 2,           // 区域中心X
          y: rect.y + rect.h - 200,          // 区域底部往上200px
        };
      });

    // 动画
    this._bobTime = 0;
    this._glowPhase = 0;

    // 交互状态
    this.visible = false;   // 20级才显示
    this._panelOpen = false;
    this.nearPlayer = false; // 玩家是否在交互范围内

    // 创建传送面板DOM
    this._buildPanel();
  }

  /* ── 各区域传送所需等级 ── */
  static get UNLOCK_LEVELS() {
    return {
      dragon:      20,
      demon:       30,
      ice:         40,
      heaven:      50,
      buddha_land: 50,
      divine:      80,
    };
  }

  /* ── 创建传送面板DOM ── */
  _buildPanel() {
    const el = document.createElement('div');
    el.id = 'tudigong-panel';
    el.className = 'hidden';
    el.innerHTML = `
      <div class="panel-title">🏮 土地公传送</div>
      <div class="tdg-desc">老夫可送你前往各处，选好去处！</div>
      <div id="tdg-zone-list"></div>
      <button onclick="document.getElementById('tudigong-panel').classList.add('hidden')">关闭</button>
    `;
    document.getElementById('game-container').appendChild(el);
    this._panel = el;
    // 按钮在 _openPanel 里动态渲染，此处不填充
  }

  /* ── 动态渲染区域按钮（每次打开面板时调用，反映当前等级）── */
  _renderZoneList() {
    const list = this._panel.querySelector('#tdg-zone-list');
    if (!list) return;
    list.innerHTML = '';
    const playerLv = (this.game.player && this.game.player.level) || 1;
    const unlockMap = TuDiGong.UNLOCK_LEVELS;

    // 过滤掉 wave_zone 和 human，并按解锁等级由低到高排序
    const targets = this.teleportTargets
      .filter(t => t.zoneId !== 'wave_zone' && t.zoneId !== 'human')
      .sort((a, b) => {
        const la = unlockMap[a.zoneId] || 0;
        const lb = unlockMap[b.zoneId] || 0;
        return la - lb;
      });

    targets.forEach(target => {
      const reqLv    = unlockMap[target.zoneId] || 0;
      const unlocked = playerLv >= reqLv;

      const btn = document.createElement('button');
      btn.className = 'tdg-zone-btn' + (unlocked ? '' : ' tdg-locked');
      btn.disabled  = !unlocked;

      if (unlocked) {
        btn.innerHTML = `${target.emoji} ${target.name}`;
        btn.onclick   = () => this._teleportTo(target);
      } else {
        // 整体置灰：用 style 直接覆盖，确保 emoji 和文字一并变灰
        btn.innerHTML = `🔒 ${target.emoji} ${target.name} <span class="tdg-req-lv">Lv.${reqLv}</span>`;
        btn.title     = `需要 Lv.${reqLv} 解锁`;
        btn.style.filter  = 'grayscale(1)';
        btn.style.opacity = '0.45';
      }
      list.appendChild(btn);
    });
  }

  /* ── Q键交互（game.js调用）── */
  tryInteract() {
    if (!this.visible || !this.nearPlayer) return false;
    this._openPanel();
    return true;
  }

  /* ── 打开传送面板 ── */
  _openPanel() {
    // 每次打开都重新渲染按钮，反映当前等级
    this._renderZoneList();
    this._panel.classList.remove('hidden');
    this._panelOpen = true;
    if (this.game.ui) this.game.ui.showSkillToast('🏮 土地公：老夫可送你前往各处！');
  }

  /* ── 执行传送 ── */
  _teleportTo(target) {
    const player = this.game.player;
    if (!player || player.dead) {
      if (this.game.ui) this.game.ui.showSkillToast('你已阵亡，无法传送！');
      return;
    }
    // 等级双重校验（防止按钮状态与实际等级不同步）
    const reqLv = TuDiGong.UNLOCK_LEVELS[target.zoneId] || 0;
    if (player.level < reqLv) {
      if (this.game.ui) this.game.ui.showSkillToast(`⚠️ 需要达到 Lv.${reqLv} 才能前往${target.name}！`);
      return;
    }
    player.x = target.x;
    player.y = target.y;
    // 传送特效
    player.effects.push({
      x: player.x, y: player.y, r: 0, maxR: 160,
      life: 800, maxLife: 800, color: 'rgba(255,215,0,0.75)', type: 'teleport'
    });
    if (this.game.ui) this.game.ui.showSkillToast(`☁️ 土地公送你前往 ${target.emoji}${target.name}！`);
    // 关闭面板
    this._panel.classList.add('hidden');
    this._panelOpen = false;
  }

  /* ── 显示土地公出现横幅（带自动消失）── */
  _showBanner() {
    const banner = document.getElementById('tudigong-banner');
    if (!banner) return;
    // 重置动画
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    banner.offsetHeight; // reflow
    banner.style.animation = '';
    // 5秒后自动滑出消失
    clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => {
      banner.style.transition = 'opacity 0.8s, transform 0.8s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.style.opacity = '';
        banner.style.transform = '';
        banner.style.transition = '';
      }, 800);
    }, 5000);
  }

  /* ── 更新（每帧调用）── */
  update(dt, playerLevel) {
    // 20级后显示
    if (!this.visible && playerLevel >= 20) {
      this.visible = true;
      this._showBanner();
    }
    this._bobTime   += dt * 0.002;
    this._glowPhase += dt * 0.003;

    // 检测玩家距离，控制 nearPlayer 状态及面板自动关闭
    const player = this.game.player;
    if (this.visible && player && !player.dead) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (!this.nearPlayer && dist <= 120) {
        this.nearPlayer = true;
      } else if (this.nearPlayer && dist > 150) {
        this.nearPlayer = false;
        // 走远自动关闭面板
        if (this._panelOpen) {
          this._panel.classList.add('hidden');
          this._panelOpen = false;
        }
      }
    }
  }

  /* ── 绘制 ── */
  draw(ctx, camera) {
    if (!this.visible) return;
    if (!camera.inView(this.x, this.y, 100)) return;

    const { sx, sy } = camera.worldToScreen(this.x, this.y);
    const bob = Math.sin(this._bobTime) * 5;       // 上下漂浮
    const drawY = sy + bob;
    const glow = Math.abs(Math.sin(this._glowPhase));

    ctx.save();

    // 外发光光晕
    const glowR = this.radius + 10 + glow * 8;
    const grd = ctx.createRadialGradient(sx, drawY, this.radius * 0.3, sx, drawY, glowR);
    grd.addColorStop(0, `rgba(255,200,50,${0.4 + glow * 0.3})`);
    grd.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.beginPath();
    ctx.arc(sx, drawY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // 脚底坐标（人物绘制函数以脚底为原点向上画）
    const footY = drawY + this.radius;

    // 影子（脚底处）
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, footY, this.radius * 0.8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Q版土地公人物（传脚底坐标）
    drawTuDiGong(ctx, sx, footY, 1);

    // 靠近时外轮廓高亮（人物中心约在脚底上方30px）
    if (this.nearPlayer) {
      ctx.beginPath();
      ctx.arc(sx, footY - 30, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 名字标签（人物顶端约在脚底上方62px）
    ctx.font = 'bold 12px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = '🏮 土地公';
    const lw = ctx.measureText(label).width + 12;
    const lh = 18;
    const lx = sx - lw / 2;
    const ly = footY - 62;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(lx, ly - lh, lw, lh, 4); ctx.fill();
    } else {
      ctx.fillRect(lx, ly - lh, lw, lh);
    }
    ctx.fillStyle = '#ffe88a';
    ctx.fillText(label, sx, ly);

    // 靠近时显示 [Q] 交互提示（脚底下方8px）
    if (this.nearPlayer) {
      ctx.font = 'bold 12px Microsoft YaHei';
      const hint = '[Q] 交互';
      const hw = ctx.measureText(hint).width + 10;
      const hx = sx - hw / 2;
      const hy = footY + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(hx, hy, hw, 18, 3); ctx.fill();
      } else {
        ctx.fillRect(hx, hy, hw, 18);
      }
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(hint, sx, hy + 3);
    }

    ctx.restore();
  }
}

// ===== 商人 NPC =====
// 关卡表坐标：主城(1,2) 格[12,20] → 世界坐标(5350, 7850)
// 玩家进入主城即可与商人交互（[Q] 交互），购买精铁（2000金币/个）

class Merchant {
  constructor(game) {
    this.game   = game;
    // 关卡表位置：主城区域 格[78,53] → 世界(5404, 7929)
    this.x      = 5404;
    this.y      = 7929;
    this.radius = 20;

    this._bobTime   = 0;
    this._glowPhase = 0;
    this.nearPlayer = false;
    this._panelOpen = false;
    // 击杀浪里马后才解锁
    this.unlocked   = false;

    // 商品列表
    this.goods = [
      { name: '精铁', price: 300,  icon: '🔩', desc: '合成材料：铁质原料',                   type: 'material' },
      { name: '精钢', price: 600,  icon: '🪨', desc: '合成材料：高品质钢铁，用于锻造更强的装备', type: 'material' },
      { name: '大力丸', price: 1000, icon: '💊', desc: '永久增加 2 点攻击',                    type: 'consumable', stock: 10, bonusAttrs: { atk: 2 } },
      { name: '金刚丸', price: 600,  icon: '🔵', desc: '永久增加 2 点防御',                    type: 'consumable', stock: 10, bonusAttrs: { armor: 2 } },
      { name: '急急丸', price: 1800, icon: '⚡', desc: '永久增加 1% 攻速和 1% 移速',           type: 'consumable', stock: 10, bonusAttrs: { atkSpeedPct: 0.01, speedPct: 0.01 } },
    ];

    this._buildPanel();
  }

  /* ── 创建购买面板DOM ── */
  _buildPanel() {
    const el = document.createElement('div');
    el.id = 'merchant-panel';
    el.className = 'hidden';
    el.innerHTML = `
      <div class="panel-title">🛒 行脚商人</div>
      <div class="merchant-desc">客官，看看俺的好货！</div>
      <div id="merchant-goods-list"></div>
      <button onclick="document.getElementById('merchant-panel').classList.add('hidden')">关闭</button>
    `;
    document.getElementById('game-container').appendChild(el);
    this._panel = el;
    this._renderGoods();
  }

  /* ── 动态渲染商品列表（每次打开面板时调用，反映最新库存）── */
  _renderGoods() {
    const list = this._panel.querySelector('#merchant-goods-list');
    if (!list) return;
    list.innerHTML = '';
    this.goods.forEach(good => {
      const isConsumable = good.type === 'consumable';
      const soldOut = isConsumable && good.stock <= 0;
      const row = document.createElement('div');
      row.className = 'merchant-good-row';

      // 库存标签（仅消耗品显示）
      const stockHtml = isConsumable
        ? `<span class="mg-stock" data-name="${good.name}">库存: ${good.stock}</span>`
        : '';

      row.innerHTML = `
        <span class="mg-icon">${good.icon}</span>
        <span class="mg-name">${good.name}</span>
        <span class="mg-desc">${good.desc}</span>
        ${stockHtml}
        <span class="mg-price">💰 ${good.price}</span>
        <button class="mg-buy-btn" data-name="${good.name}"
          ${soldOut ? 'disabled' : ''}
          style="${soldOut ? 'opacity:0.4;cursor:not-allowed;' : ''}">
          ${soldOut ? '已售罄' : '购买'}
        </button>
      `;
      row.querySelector('.mg-buy-btn').addEventListener('click', () => {
        if (!soldOut) this._buy(good);
      });
      list.appendChild(row);
    });
  }

  /* ── 购买商品 ── */
  _buy(good) {
    const player = this.game.player;
    if (!player) return;
    if (player.gold < good.price) {
      if (this.game.ui) this.game.ui.showSkillToast(`💸 金币不足！需要 ${good.price} 金币`);
      return;
    }

    // ── 消耗品（丹药）：直接生效，不占背包 ──
    if (good.type === 'consumable') {
      if (good.stock <= 0) {
        if (this.game.ui) this.game.ui.showSkillToast(`❌「${good.name}」已售罄！`);
        return;
      }
      player.gold  -= good.price;
      good.stock   -= 1;
      player.applyConsumable(good.bonusAttrs);
      if (this.game.ui) {
        this.game.ui.showSkillToast(`✅ 使用「${good.name}」，${good.desc}！剩余库存: ${good.stock}`);
        this.game.ui.refresh();
      }
      // 刷新面板按钮/库存状态
      this._refreshGoodRow(good);
      return;
    }

    // ── 普通材料：放入背包 ──
    const bag = this.game.bag;
    const emptyIdx = bag ? bag.slots.indexOf(null) : -1;
    if (emptyIdx === -1) {
      if (this.game.ui) this.game.ui.showSkillToast('❌ 背包已满，无法购买！');
      return;
    }
    // 扣钱 + 放入背包
    player.gold -= good.price;
    // 生成物品对象（精铁是合成材料，type:'item'）
    const item = typeof getItemByName === 'function' ? getItemByName(good.name) : null;
    const itemObj = item || {
      name: good.name, type: 'item', quality: 'white',
      icon: good.icon, desc: good.desc,
      attrs: {},
    };
    bag.slots[emptyIdx] = Object.assign({}, itemObj);
    if (this.game.ui) {
      this.game.ui.showSkillToast(`✅ 购买「${good.name}」×1，花费 ${good.price} 金币`);
      this.game.ui.refresh();
    }
  }

  /* ── 刷新单行商品的库存显示和按钮状态 ── */
  _refreshGoodRow(good) {
    const list = this._panel.querySelector('#merchant-goods-list');
    if (!list) return;
    // 找到对应按钮行（通过 data-name 定位按钮）
    const btn = list.querySelector(`.mg-buy-btn[data-name="${good.name}"]`);
    if (btn) {
      if (good.stock <= 0) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.textContent = '已售罄';
      }
    }
    const stockEl = list.querySelector(`.mg-stock[data-name="${good.name}"]`);
    if (stockEl) {
      stockEl.textContent = `库存: ${good.stock}`;
    }
  }

  /* ── Q键交互 ── */
  tryInteract() {
    if (!this.unlocked || !this.nearPlayer) return false;
    this._renderGoods();  // 每次打开刷新库存状态
    this._panel.classList.remove('hidden');
    this._panelOpen = true;
    if (this.game.ui) this.game.ui.showSkillToast('🛒 商人：客官，瞧一瞧看一看！');
    return true;
  }

  /* ── 每帧更新 ── */
  update(dt) {
    if (!this.unlocked) return;
    this._bobTime   += dt * 0.0018;
    this._glowPhase += dt * 0.0025;
    const player = this.game.player;
    if (player && !player.dead) {
      const dx   = player.x - this.x;
      const dy   = player.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (!this.nearPlayer && dist <= 120) {
        this.nearPlayer = true;
      } else if (this.nearPlayer && dist > 150) {
        this.nearPlayer = false;
        if (this._panelOpen) {
          this._panel.classList.add('hidden');
          this._panelOpen = false;
        }
      }
    }
  }

  /* ── 绘制 ── */
  draw(ctx, camera) {
    if (!this.unlocked) return;
    if (!camera.inView(this.x, this.y, 100)) return;
    const { sx, sy } = camera.worldToScreen(this.x, this.y);
    const bob   = Math.sin(this._bobTime) * 4;
    const drawY = sy + bob;
    const glow  = Math.abs(Math.sin(this._glowPhase));

    ctx.save();

    // 外发光
    const glowR = this.radius + 8 + glow * 6;
    const grd = ctx.createRadialGradient(sx, drawY, this.radius * 0.3, sx, drawY, glowR);
    grd.addColorStop(0, `rgba(80,220,120,${0.35 + glow * 0.25})`);
    grd.addColorStop(1, 'rgba(0,180,80,0)');
    ctx.beginPath();
    ctx.arc(sx, drawY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // 脚底坐标（人物绘制函数以脚底为原点向上画）
    const footY = drawY + this.radius;

    // 影子（脚底处）
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, footY, this.radius * 0.75, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Q版商人人物（传脚底坐标）
    drawMerchant(ctx, sx, footY, 1);

    // 靠近时外轮廓高亮（人物中心约在脚底上方28px）
    if (this.nearPlayer) {
      ctx.beginPath();
      ctx.arc(sx, footY - 28, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 名字标签（人物顶端约在脚底上方58px）
    ctx.font = 'bold 12px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = '🛒 商人';
    const lw = ctx.measureText(label).width + 12;
    const lh = 18;
    const lx = sx - lw / 2;
    const ly = footY - 58;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(lx, ly - lh, lw, lh, 4); ctx.fill();
    } else {
      ctx.fillRect(lx, ly - lh, lw, lh);
    }
    ctx.fillStyle = '#aaffcc';
    ctx.fillText(label, sx, ly);

    // 靠近时显示 [Q] 交互提示（脚底下方8px）
    if (this.nearPlayer) {
      const hint = '[Q] 交互';
      const hw = ctx.measureText(hint).width + 10;
      const hx = sx - hw / 2;
      const hy = footY + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(hx, hy, hw, 18, 3); ctx.fill();
      } else {
        ctx.fillRect(hx, hy, hw, 18);
      }
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(hint, sx, hy + 3);
    }

    ctx.restore();
  }
}