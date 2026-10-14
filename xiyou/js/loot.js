// ===== 掉落物系统 =====
// 地面掉落物，60秒不拾取自动消失
// Q键触发范围拾取

class LootItem {
  /**
   * @param {number} x
   * @param {number} y
   * @param {object} item  装备对象，或 {type:'exp', value:N, name:'经验球'} / {type:'gold', value:N, name:'金币'}
   */
  constructor(x, y, item) {
    this.x = x + Utils.randFloat(-30, 30);
    this.y = y + Utils.randFloat(-30, 30);
    this.item = item;
    this.life = 60000;
    this.maxLife = 60000;
    this.picked = false;

    // 动画
    this._bobPhase  = Math.random() * Math.PI * 2;
    this._glowPhase = Math.random() * Math.PI * 2;
    // 弹出动画
    this._bounceVy = -120;
    this._bounceY  = 0;
    this._onGround = false;
  }

  update(dt) {
    if (this.picked) return false;
    this.life -= dt;
    if (this.life <= 0) return false;

    if (!this._onGround) {
      this._bounceVy += 300 * (dt / 1000);
      this._bounceY  += this._bounceVy * (dt / 1000);
      if (this._bounceY >= 0) {
        this._bounceY  = 0;
        this._bounceVy = -Math.abs(this._bounceVy) * 0.35;
        if (Math.abs(this._bounceVy) < 15) {
          this._onGround = true;
          this._bounceY  = 0;
        }
      }
    } else {
      this._bobPhase  += dt * 0.003;
      this._glowPhase += dt * 0.004;
    }
    return true;
  }

  draw(ctx, camera, playerX, playerY) {
    if (this.picked || !camera.inView(this.x, this.y, 60)) return;
    const { sx, sy } = camera.worldToScreen(this.x, this.y);
    const drawY = sy + this._bounceY - 12;

    // 闪烁消失预警（最后10秒）
    if (this.life < 10000 && Math.floor(this.life / 300) % 2 === 0) return;

    const type = this.item.type; // 'exp' | 'gold' | 'item' | undefined(装备)

    if (type === 'exp') {
      this._drawSpecial(ctx, sx, drawY, '#44ffaa', '#00cc66', '✦', '经验球');
    } else if (type === 'gold') {
      this._drawSpecial(ctx, sx, drawY, '#ffdd44', '#cc8800', '💰', '金币');
    } else if (type === 'item') {
      // 物品类掉落物（合成材料等）
      const ITEM_QUALITY_COLORS = { white:'#c8c8c8', green:'#44dd66', blue:'#44aaff', purple:'#cc66ff', orange:'#ff9933' };
      const color = ITEM_QUALITY_COLORS[this.item.quality] || '#c8c8c8';
      this._drawSpecial(ctx, sx, drawY, color, color, this.item.icon || '📦', this.item.name);
    } else {
      this._drawEquip(ctx, sx, drawY);
    }

    // 悬浮倒计时（最后15秒显示）
    if (this.life < 15000) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,100,100,0.85)';
      ctx.font = '9px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${Math.ceil(this.life / 1000)}s`, sx, drawY - 12);
      ctx.restore();
    }

    // [Q] 提示浮标（玩家靠近150px以内时显示）
    if (playerX !== undefined && playerY !== undefined) {
      const dx = this.x - playerX, dy = this.y - playerY;
      if (dx*dx + dy*dy <= 150 * 150) {
        ctx.save();
        ctx.font = 'bold 11px Microsoft YaHei';
        ctx.textAlign = 'center';
        const hint = '[Q]';
        const hw = ctx.measureText(hint).width + 8;
        const hx = sx - hw / 2;
        const hy = drawY - 30;
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        if (ctx.roundRect) {
          ctx.beginPath(); ctx.roundRect(hx, hy, hw, 16, 3); ctx.fill();
        } else {
          ctx.fillRect(hx, hy, hw, 16);
        }
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';
        ctx.fillText(hint, sx, hy + 2);
        ctx.restore();
      }
    }
  }

  _drawSpecial(ctx, sx, drawY, glowColor, borderColor, icon, label) {
    const glowR = 16 + Math.sin(this._glowPhase) * 4;
    // 光晕
    const grd = ctx.createRadialGradient(sx, drawY, 2, sx, drawY, glowR);
    grd.addColorStop(0, glowColor + 'bb');
    grd.addColorStop(1, glowColor + '00');
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, drawY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.restore();

    // 圆形底
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, drawY, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1a0acc'; ctx.fill();
    ctx.strokeStyle = borderColor; ctx.lineWidth = 2; ctx.stroke();

    // 图标文字
    ctx.fillStyle = glowColor;
    ctx.font = 'bold 11px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayIcon = icon === '💰' ? '金' : (icon === '✦' ? '✦' : icon);
    ctx.fillText(displayIcon, sx, drawY);
    ctx.restore();

    // 数值标注
    ctx.save();
    ctx.fillStyle = glowColor;
    ctx.font = '10px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.9;
    const labelText = this.item.value !== undefined ? `${this.item.name}×${this.item.value}` : this.item.name;
    ctx.fillText(labelText, sx, drawY + 13);
    ctx.restore();
  }

  _drawEquip(ctx, sx, drawY) {
    // ── 品质颜色映射（兼容新旧两套 key）──
    const QUALITY_COLORS = {
      white:  '#c8c8c8', green:  '#44dd66', blue:   '#44aaff',
      purple: '#cc66ff', orange: '#ff9933',
      normal: '#c8c8c8', rare:   '#44dd66', epic:   '#44aaff', legend: '#cc66ff',
    };
    const QUALITY_BORDER = {
      white:  '#888888', green:  '#22bb44', blue:   '#2277ee',
      purple: '#aa33ee', orange: '#ee6600',
      normal: '#888888', rare:   '#22bb44', epic:   '#2277ee', legend: '#aa33ee',
    };
    const quality = this.item.quality || 'white';
    const color  = QUALITY_COLORS[quality] || '#c8c8c8';
    const border = QUALITY_BORDER[quality] || '#888888';
    const slot   = this.item.slot || 'armor';

    // ── 光晕动画 ──
    const glowR = 18 + Math.sin(this._glowPhase) * 4;
    const grd = ctx.createRadialGradient(sx, drawY, 2, sx, drawY, glowR);
    grd.addColorStop(0, color + '88');
    grd.addColorStop(1, color + '00');
    ctx.save();
    ctx.beginPath(); ctx.arc(sx, drawY, glowR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.restore();

    // ── 正方形底板（带3D感） ──
    const S = 18; // 半尺寸
    ctx.save();
    // 底板阴影
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + Math.sin(this._glowPhase) * 3;
    // 底板背景
    ctx.fillStyle = 'rgba(10,8,20,0.88)';
    ctx.strokeStyle = border;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(sx - S, drawY - S, S*2, S*2, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── 根据槽位绘制不同小模型（纯Canvas路径）──
    ctx.save();
    ctx.translate(sx, drawY);

    if (slot === 'weapon') {
      // 剑型：竖向细长菱形刃 + 十字护手 + 短柄
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      // 刀刃（上尖菱形）
      ctx.fillStyle = color + 'cc';
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(3.5, -2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-3.5, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 护手横杠
      ctx.beginPath();
      ctx.moveTo(-7, 2); ctx.lineTo(7, 2);
      ctx.stroke();
      // 剑柄
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 2); ctx.lineTo(0, 11);
      ctx.stroke();
      // 剑柄末端圆
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 12, 2, 0, Math.PI * 2); ctx.fill();

    } else if (slot === 'head') {
      // 帽型：圆弧顶 + 帽檐
      ctx.fillStyle = color + 'bb';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      // 帽顶圆弧
      ctx.beginPath();
      ctx.arc(0, -4, 9, Math.PI, 0);
      ctx.lineTo(9, 4);
      ctx.lineTo(-9, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 帽檐（椭圆）
      ctx.beginPath();
      ctx.ellipse(0, 4, 12, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = color + '99';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      // 帽顶小突起
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (slot === 'armor') {
      // 甲型：梯形躯干 + 肩甲 + 腰线
      ctx.fillStyle = color + 'aa';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      // 躯干
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 左肩
      ctx.fillStyle = color + 'cc';
      ctx.beginPath();
      ctx.ellipse(-10, -9, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 右肩
      ctx.beginPath();
      ctx.ellipse(10, -9, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // 腰线装饰
      ctx.strokeStyle = color + 'dd';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-9, 1); ctx.lineTo(9, 1);
      ctx.stroke();

    } else if (slot === 'boots') {
      // 靴型：靴筒 + 鞋底
      ctx.fillStyle = color + 'aa';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      // 靴筒（矩形+圆角）
      ctx.beginPath();
      ctx.roundRect(-5, -13, 10, 15, 2);
      ctx.fill();
      ctx.stroke();
      // 鞋头（向右弯出的弧）
      ctx.fillStyle = color + 'cc';
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(10, 2);
      ctx.quadraticCurveTo(14, 5, 10, 10);
      ctx.lineTo(-5, 10);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 鞋底线
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(-5, 10); ctx.lineTo(10, 10);
      ctx.stroke();

    } else {
      // acc（饰品）：正六边形 + 中央宝石 + 十字光芒
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      // 外圈
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const r = 11;
        if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        else         ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath();
      ctx.fillStyle = color + '44';
      ctx.fill(); ctx.stroke();
      // 中央宝石（小菱形）
      ctx.fillStyle = color + 'ee';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(4.5, 0);
      ctx.lineTo(0, 6); ctx.lineTo(-4.5, 0);
      ctx.closePath();
      ctx.fill();
      // 十字光芒（4条短线）
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this._glowPhase * 1.5);
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(0, -6);
      ctx.moveTo(0, 6);  ctx.lineTo(0, 9);
      ctx.moveTo(-9, 0); ctx.lineTo(-6, 0);
      ctx.moveTo(6, 0);  ctx.lineTo(9, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // ── 品质星级点（右上角小圆点，1~5颗对应白绿蓝紫橙）──
    const STAR_COUNT = { white:1, green:2, blue:3, purple:4, orange:5, normal:1, rare:2, epic:3, legend:4 };
    const stars = STAR_COUNT[quality] || 1;
    ctx.save();
    for (let i = 0; i < stars; i++) {
      ctx.beginPath();
      ctx.arc(sx + S - 3 - i * 5, drawY - S + 3, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.restore();

    // ── 物品名（底部小字）──
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold 9px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.95;
    ctx.fillText(this.item.name, sx, drawY + S + 2);
    ctx.restore();
  }
}

// ===== 掉落物管理器 =====
class LootManager {
  constructor(game) {
    this.game = game;
    this.items = [];
    this.PICKUP_RADIUS = 150;
  }

  /* ── 在指定位置生成掉落物（item 可为装备或 {type,value,name}）── */
  spawn(x, y, item) {
    this.items.push(new LootItem(x, y, item));
  }

  /* ── 主更新 ── */
  update(dt) {
    this.items = this.items.filter(li => li.update(dt));
  }

  /* ── 范围拾取（Q键触发）── */
  pickupNearby(playerX, playerY) {
    const player = this.game.player;
    let countEquip = 0, totalExp = 0, totalGold = 0;

    for (const li of this.items) {
      if (li.picked) continue;
      const dx = li.x - playerX, dy = li.y - playerY;
      if (dx*dx + dy*dy > this.PICKUP_RADIUS * this.PICKUP_RADIUS) continue;

      li.picked = true;
      const t = li.item.type;

      if (t === 'exp') {
        player.addExp(li.item.value);
        totalExp += li.item.value;
      } else if (t === 'gold') {
        player.gold += li.item.value;
        totalGold += li.item.value;
      } else {
        // 装备 → 存背包
        if (this.game.bag && !this.game.bag.isFull()) {
          this.game.bag.addItem(li.item);
          countEquip++;
        } else {
          if (this.game.ui) this.game.ui.showSkillToast(`背包已满，丢弃了「${li.item.name}」！`);
        }
      }
    }

    this.items = this.items.filter(li => !li.picked);

    // 拾取提示
    const parts = [];
    if (countEquip > 0) parts.push(`装备×${countEquip}`);
    if (totalExp   > 0) parts.push(`经验+${totalExp}`);
    if (totalGold  > 0) parts.push(`金币+${totalGold}`);
    if (parts.length > 0 && this.game.ui) {
      this.game.ui.showSkillToast(`🎒 拾取：${parts.join('  ')}(B键查看背包)`);
    }
    return countEquip + (totalExp > 0 ? 1 : 0) + (totalGold > 0 ? 1 : 0);
  }

  /* ── 渲染所有掉落物 ── */
  draw(ctx, camera, playerX, playerY) {
    for (const li of this.items) {
      li.draw(ctx, camera, playerX, playerY);
    }
  }
}