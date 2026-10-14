// ===== 渲染器 + 小地图 =====

// 抛射物（攻击时产生的飞行线段特效）
class Projectile {
  constructor(x1, y1, x2, y2, color, dmg) {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.color = color;
    this.dmg = dmg;
    this.life = 200;
    this.maxLife = 200;
  }
  update(dt) { this.life -= dt; return this.life > 0; }
  draw(ctx, camera) {
    if (this.life <= 0) return;
    const {sx:sx1,sy:sy1} = camera.worldToScreen(this.x1, this.y1);
    const {sx:sx2,sy:sy2} = camera.worldToScreen(this.x2, this.y2);
    const a = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
    // 命中点光效
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx2, sy2, 4 * a, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

class Renderer {
  constructor(canvas, minimapCanvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.minimap = minimapCanvas;
    this.mmCtx   = minimapCanvas.getContext('2d');
    this.projectiles = [];

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight - 130; // 减去底部UI高度
  }

  getSize() {
    return { w: this.canvas.width, h: this.canvas.height };
  }

  addProjectile(x1, y1, x2, y2, color, dmg) {
    this.projectiles.push(new Projectile(x1, y1, x2, y2, color, dmg));
  }

  // 主渲染入口
  render(dt, gameMap, camera, player, tangSeng, bosses, waveSystem, miniEnemyGroups, lootManager, tuDiGong, merchant) {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;

    // ── 每帧开始前强制重置 ctx 状态，防止上一帧 save/restore 不匹配导致的帧间污染 ──
    // clearRect 只清内容，不清 globalAlpha/shadowBlur/transform 等状态
    ctx.globalAlpha    = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur     = 0;
    ctx.shadowColor    = 'transparent';
    ctx.filter         = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵

    ctx.clearRect(0, 0, w, h);

    // 1. 地图背景
    gameMap.draw(ctx, camera);

    // 2. 区域标签
    gameMap.drawLabels(ctx, camera);

    // 3. 唐僧
    tangSeng.draw(ctx, camera);

    // 4. 区域BOSS
    bosses.forEach(b => b.draw(ctx, camera));

    // 5. 小怪
    if (miniEnemyGroups) {
      miniEnemyGroups.forEach(group => {
        group.enemies.forEach(e => e.draw(ctx, camera));
      });
    }

    // 6. 波次怪
    waveSystem.draw(ctx, camera);

    // 7. 抛射物特效
    this.projectiles = this.projectiles.filter(p => {
      p.update(dt);
      p.draw(ctx, camera);
      return p.life > 0;
    });

    // 8. 地面掉落物（在玩家之前绘制，在地面层之上）
    if (lootManager) lootManager.draw(ctx, camera, player.x, player.y);

    // 9. 土地公NPC
    if (tuDiGong) tuDiGong.draw(ctx, camera);
    // 9b. 商人NPC
    if (merchant) merchant.draw(ctx, camera);

    // 10. 玩家（最后绘制确保在最上层）
    player.draw(ctx, camera);

    // 10b. 猴子猴孙分身（绘制在玩家上层）
    if (this._game && this._game.monkeyClones) {
      for (const clone of this._game.monkeyClones) {
        clone.draw(ctx, camera);
      }
    }

    // 小地图
    this._drawMinimap(player, tangSeng, bosses, waveSystem, miniEnemyGroups, camera, tuDiGong);
  }

  // 从 game 的 questManager 中提取当前【未完成】的 kill 目标名称集合
  _getQuestTargetNames() {
    const names = new Set();
    if (!this._game) return names;
    const qm = this._game.quest;
    if (!qm) return names;
    for (const quest of qm.getActiveQuests()) {
      if (quest.status !== 'active') continue;
      for (const p of quest.progress) {
        if (p.type === 'kill' && p.target !== '*' && p.current < p.count) {
          names.add(p.target);
        }
      }
    }
    return names;
  }

  // 小地图绘制
  _drawMinimap(player, tangSeng, bosses, waveSystem, miniEnemyGroups, camera, tuDiGong) {
    const mc = this.mmCtx;
    const mw = this.minimap.width;
    const mh = this.minimap.height;
    const scaleX = mw / C.WORLD_W;
    const scaleY = mh / C.WORLD_H;

    mc.clearRect(0, 0, mw, mh);

    // 绘制区域色块
    C.ZONES.forEach(zone => {
      const rx = zone.col * C.CELL * scaleX;
      const ry = zone.row * C.CELL * scaleY;
      const rw = C.CELL * scaleX;
      const rh = C.CELL * scaleY;
      mc.fillStyle = zone.bg;
      mc.fillRect(rx, ry, rw, rh);
      mc.strokeStyle = zone.border;
      mc.lineWidth = 1;
      mc.strokeRect(rx, ry, rw, rh);
      // 区域emoji（小字）
      mc.font = `${Math.floor(rw * 0.25)}px serif`;
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.globalAlpha = 0.5;
      mc.fillText(zone.emoji, rx + rw/2, ry + rh/2);
      mc.globalAlpha = 1;
    });

    // 获取当前任务未完成的 kill 目标名称集合
    const questTargets = this._getQuestTargetNames();

    // 辅助：在小地图上用纯文字替换红点（无圆点，无光晕）
    const _drawQuestMarker = (mx, my, name) => {
      mc.save();
      mc.font = 'bold 8px sans-serif';
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.strokeStyle = '#000';
      mc.lineWidth = 2.5;
      mc.strokeText(name, mx, my);
      mc.fillStyle = '#ffe066';
      mc.fillText(name, mx, my);
      mc.restore();
    };

    // BOSS位置（红点；若为任务目标则改为黄色名字标注）
    bosses.forEach(b => {
      if (b.dead) return;
      const bx = b.x * scaleX, by = b.y * scaleY;
      if (questTargets.has(b.name)) {
        _drawQuestMarker(bx, by, b.name);
      } else {
        mc.fillStyle = '#ff4444';
        mc.beginPath();
        mc.arc(bx, by, 2.5, 0, Math.PI * 2);
        mc.fill();
      }
    });

    // 小怪（绿点；若为任务目标则改为黄色名字标注）
    if (miniEnemyGroups) {
      miniEnemyGroups.forEach(group => {
        group.enemies.forEach(e => {
          if (e.dead) return;
          const ex = e.x * scaleX, ey = e.y * scaleY;
          if (questTargets.has(e.name)) {
            _drawQuestMarker(ex, ey, e.name);
          } else {
            mc.fillStyle = '#44dd66';
            mc.beginPath();
            mc.arc(ex, ey, 1.5, 0, Math.PI * 2);
            mc.fill();
          }
        });
      });
    }

    // 波次怪（橙点）
    waveSystem.getAllEnemies().forEach(e => {
      mc.fillStyle = '#ff8800';
      mc.beginPath();
      mc.arc(e.x * scaleX, e.y * scaleY, 1.5, 0, Math.PI*2);
      mc.fill();
    });

    // 唐僧（仅文字，永久标注，文字中心 = 世界坐标）
    if (tangSeng.alive) {
      const tx = tangSeng.x * scaleX, ty = tangSeng.y * scaleY;
      mc.save();
      mc.font = 'bold 7px sans-serif';
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.strokeStyle = '#000';
      mc.lineWidth = 2;
      mc.strokeText('唐僧', tx, ty);
      mc.fillStyle = '#ffd700';
      mc.fillText('唐僧', tx, ty);
      mc.restore();
    }

    // 土地公（仅文字，永久标注，文字中心 = 世界坐标；需20级且visible后才显示）
    if (tuDiGong && tuDiGong.visible) {
      const dx = tuDiGong.x * scaleX, dy = tuDiGong.y * scaleY;
      mc.save();
      mc.font = 'bold 7px sans-serif';
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      mc.strokeStyle = '#000';
      mc.lineWidth = 2;
      mc.strokeText('土地公', dx, dy);
      mc.fillStyle = '#66ff88';
      mc.fillText('土地公', dx, dy);
      mc.restore();
    }

    // 玩家（亮橙色，带外圈）
    const px = player.x * scaleX, py = player.y * scaleY;
    mc.strokeStyle = '#fff';
    mc.lineWidth = 1.5;
    mc.beginPath(); mc.arc(px, py, 4, 0, Math.PI*2); mc.stroke();
    mc.fillStyle = '#f5a623';
    mc.beginPath(); mc.arc(px, py, 3, 0, Math.PI*2); mc.fill();

    // 视口框（使用camera精确视口坐标）
    if (camera) {
      const vp = camera.getViewport();
      const vx = vp.vx * scaleX;
      const vy = vp.vy * scaleY;
      const vw = vp.vw * scaleX;
      const vh = vp.vh * scaleY;
      // 白色半透明描边 + 内嵌高亮
      mc.strokeStyle = 'rgba(255,255,255,0.7)';
      mc.lineWidth = 1.5;
      mc.strokeRect(
        Utils.clamp(vx, 0, mw - 2),
        Utils.clamp(vy, 0, mh - 2),
        Math.min(vw, mw),
        Math.min(vh, mh)
      );
    }
  }
}