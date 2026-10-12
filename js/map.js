// ===== 地图系统 =====
class GameMap {
  constructor() {
    // 预绘制离屏地图（优化性能）
    this._offscreen = null;
    this._offscreenCtx = null;
    this._tileSize = 80; // 装饰图案间隔
  }

  // 预绘制整个地图到离屏Canvas（启动时调用一次）
  // 注意：10000x10000 的离屏 canvas 在部分浏览器/设备下会因内存限制静默失败，
  // 因此此方法仅作尝试，draw() 里有降级到实时绘制的方案。
  prerender() {
    try {
      const oc = document.createElement('canvas');
      oc.width  = C.WORLD_W;
      oc.height = C.WORLD_H;
      const octx = oc.getContext('2d');
      if (!octx) throw new Error('offscreen ctx null');
      this._drawAll(octx);
      // 验证：读取左上角一个像素，如果全透明说明绘制失败
      const pixel = octx.getImageData(C.CELL/2, C.CELL/2, 1, 1).data;
      if (pixel[3] === 0) throw new Error('offscreen draw failed (transparent)');
      this._offscreen = oc;
      this._offscreenCtx = octx;
    } catch(e) {
      console.warn('[GameMap] prerender failed, will use realtime draw:', e.message);
      this._offscreen = null;
      this._offscreenCtx = null;
    }
  }

  _drawAll(ctx) {
    ctx.clearRect(0, 0, C.WORLD_W, C.WORLD_H);

    // 绘制每个区域
    C.ZONES.forEach(zone => {
      const rect = C.getZoneRect(zone.col, zone.row);
      this._drawZone(ctx, zone, rect);
    });

    // ── 绘制弱水屏障 ──
    this._drawWeakWater(ctx);

    // 绘制区域边界线（弱水上面再描边）
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 6;
    for (let c = 1; c < 3; c++) {
      ctx.beginPath();
      ctx.moveTo(c * C.CELL, 0);
      ctx.lineTo(c * C.CELL, C.WORLD_H);
      ctx.stroke();
    }
    for (let r = 1; r < 3; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * C.CELL);
      ctx.lineTo(C.WORLD_W, r * C.CELL);
      ctx.stroke();
    }

    // 绘制区域名称大字
    C.ZONES.forEach(zone => {
      const rect = C.getZoneRect(zone.col, zone.row);
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.font = `bold ${Math.floor(C.CELL * 0.12)}px 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = zone.textColor;
      ctx.fillText(zone.emoji, cx, cy - 60);
      ctx.globalAlpha = 0.12;
      ctx.font = `bold ${Math.floor(C.CELL * 0.07)}px 'Microsoft YaHei', sans-serif`;
      ctx.fillText(zone.name, cx, cy + 80);
      ctx.restore();
    });
  }

  _drawZone(ctx, zone, rect) {
    const { x, y, w, h } = rect;

    // 背景底色
    ctx.fillStyle = zone.bg;
    ctx.fillRect(x, y, w, h);

    // 地形纹理（不同区域不同图案）
    this._drawTerrain(ctx, zone, rect);

    // ── 叠加关卡表格子层（阻隔=黄，弱水=蓝）──
    this._drawTiles(ctx, zone, rect);

    // 区域边框
    ctx.strokeStyle = zone.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  }

  // ── 根据 ZONE_TILES 绘制格子覆盖层 ──
  _drawTiles(ctx, zone, rect) {
    const tiles = C.ZONE_TILES && C.ZONE_TILES[zone.id];
    if (!tiles) return;
    const ts = C.TILE_SIZE; // 每格像素数（≈101）
    ctx.save();
    for (let r = 0; r < 33; r++) {
      for (let c = 0; c < 33; c++) {
        const t = tiles[r][c];
        if (t === 0) continue; // 可行走，不绘制覆盖色
        const tx = rect.x + c * ts;
        const ty = rect.y + r * ts;
        if (t === 1) {
          // 阻隔：半透明棕褐色山石感
          ctx.fillStyle = 'rgba(90, 60, 20, 0.72)';
          ctx.fillRect(tx, ty, ts, ts);
          // 描边
          ctx.strokeStyle = 'rgba(60, 40, 10, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
        } else if (t === 2) {
          // 弱水：深蓝半透明
          ctx.fillStyle = 'rgba(0, 60, 180, 0.65)';
          ctx.fillRect(tx, ty, ts, ts);
          ctx.strokeStyle = 'rgba(80, 180, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
        }
      }
    }
    ctx.restore();
  }

  _drawTerrain(ctx, zone, rect) {
    const { x, y, w, h } = rect;
    const seed = zone.id.charCodeAt(0) * 137;
    ctx.save();
    ctx.globalAlpha = 0.15;

    const ts = this._tileSize;
    const cols = Math.ceil(w / ts);
    const rows = Math.ceil(h / ts);

    for (let ci = 0; ci < cols; ci++) {
      for (let ri = 0; ri < rows; ri++) {
        const tx = x + ci * ts + ts/2;
        const ty = y + ri * ts + ts/2;
        // 用简单hash决定是否画装饰
        const hash = (ci * 31 + ri * 17 + seed) % 100;
        if (hash < 35) {
          ctx.font = `${20 + (hash % 14)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const decorMap = {
            ice:         ['❄','❅','❆','🌨','⛰'],
            divine:      ['✦','✧','★','⭐','✨'],
            buddha_land: ['🌸','☀','🌺','✿','🔔'],
            dragon:      ['🌊','~','≋','💧','🐟'],
            heaven:      ['☁','⛅','🌤','✦','✧'],
            demon:       ['🔥','💀','✖','▲','⬟'],
            wave_zone:   ['⚔','🗡','⛧','▸','◈'],
            main_city:   ['🌿','🌱','🌻','🌼','🏠'],
            human:       ['🌾','🌻','🌿','🌲','🏡'],
          };
          const decors = decorMap[zone.id] || ['·'];
          ctx.fillStyle = zone.textColor;
          ctx.fillText(decors[hash % decors.length], tx, ty);
        }
      }
    }
    ctx.restore();

    // ── 绘制山脉障碍（天庭、出怪区、主城、人间）──
    const mountainMap = {
      heaven:    C.HEAVEN_MOUNTAINS,
      wave_zone: C.WAVE_ZONE_MOUNTAINS,
      main_city: C.MAIN_CITY_MOUNTAINS,
      human:     C.HUMAN_MOUNTAINS,
    };
    if (mountainMap[zone.id]) {
      this._drawMountains(ctx, mountainMap[zone.id]);
    }
  }

  // ── 绘制山脉（通用方法，适用于任意区域）──
  _drawMountains(ctx, mountains) {
    mountains.forEach((m, idx) => {
      // 山体渐变
      const grd = ctx.createLinearGradient(m.x, m.y, m.x, m.y + m.h);
      grd.addColorStop(0,   '#8B7355');
      grd.addColorStop(0.3, '#6B5A3E');
      grd.addColorStop(0.7, '#5A4A30');
      grd.addColorStop(1,   '#8B7355');

      // 主山体（矩形圆角效果）
      ctx.save();
      ctx.fillStyle = grd;
      ctx.beginPath();
      const r = 12;
      ctx.moveTo(m.x + r, m.y);
      ctx.lineTo(m.x + m.w - r, m.y);
      ctx.quadraticCurveTo(m.x + m.w, m.y, m.x + m.w, m.y + r);
      ctx.lineTo(m.x + m.w, m.y + m.h - r);
      ctx.quadraticCurveTo(m.x + m.w, m.y + m.h, m.x + m.w - r, m.y + m.h);
      ctx.lineTo(m.x + r, m.y + m.h);
      ctx.quadraticCurveTo(m.x, m.y + m.h, m.x, m.y + m.h - r);
      ctx.lineTo(m.x, m.y + r);
      ctx.quadraticCurveTo(m.x, m.y, m.x + r, m.y);
      ctx.closePath();
      ctx.fill();

      // 山体轮廓
      ctx.strokeStyle = '#4A3828';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 山脊线（高光）
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#C4A882';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x + 8, m.y + 12);
      ctx.lineTo(m.x + m.w - 8, m.y + 12);
      ctx.stroke();

      // 山顶积雪（每个山块顶部画小三角雪帽）
      ctx.globalAlpha = 0.7;
      const snowStep = 120;
      for (let sx = m.x + 30; sx < m.x + m.w - 30; sx += snowStep) {
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(sx, m.y - 18);
        ctx.lineTo(sx - 22, m.y + 5);
        ctx.lineTo(sx + 22, m.y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ⛰ emoji装饰
      ctx.globalAlpha = 0.9;
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const emojiStep = 200;
      for (let ex = m.x + 60; ex < m.x + m.w - 60; ex += emojiStep) {
        ctx.fillText('⛰', ex, m.y + m.h / 2);
      }

      ctx.restore();
    });
  }

  // ── 弱水屏障绘制（预渲染到离屏画布上）──
  _drawWeakWater(ctx) {
    const rects = C.buildWeakWaterRects();
    rects.forEach(r => {
      // 底色：深蓝色半透明（弱水颜色）
      const grd = r.type === 'v'
        ? ctx.createLinearGradient(r.x, 0, r.x + r.w, 0)
        : ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      grd.addColorStop(0,   'rgba(0, 40, 120, 0.85)');
      grd.addColorStop(0.3, 'rgba(0, 80, 200, 0.92)');
      grd.addColorStop(0.5, 'rgba(10,120, 255, 0.95)');
      grd.addColorStop(0.7, 'rgba(0, 80, 200, 0.92)');
      grd.addColorStop(1,   'rgba(0, 40, 120, 0.85)');
      ctx.fillStyle = grd;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // 波纹纹理（横向条纹）
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#88ccff';
      ctx.lineWidth = 2;
      if (r.type === 'v') {
        // 竖向弱水 → 横向波纹
        for (let wy = r.y; wy < r.y + r.h; wy += 28) {
          const waveOff = Math.sin((wy * 0.04)) * 8;
          ctx.beginPath();
          ctx.moveTo(r.x, wy);
          ctx.quadraticCurveTo(r.x + r.w / 2 + waveOff, wy + 10, r.x + r.w, wy);
          ctx.stroke();
        }
      } else {
        // 横向弱水 → 竖向波纹
        for (let wx = r.x; wx < r.x + r.w; wx += 28) {
          const waveOff = Math.sin((wx * 0.04)) * 8;
          ctx.beginPath();
          ctx.moveTo(wx, r.y);
          ctx.quadraticCurveTo(wx + 10, r.y + r.h / 2 + waveOff, wx, r.y + r.h);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 边缘发光描边
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();

      // "弱水" 文字标注（每段最多1次）
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.font = 'bold 22px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#aaddff';
      ctx.fillText('弱水', cx, cy);
      ctx.restore();
    });
  }

  // 绘制视口内的地图
  draw(ctx, camera) {
    const { vx, vy, vw, vh } = camera.getViewport();
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    // 优先使用离屏预渲染（如果可用且尺寸合理）
    if (this._offscreen && this._offscreen.width > 0 && this._offscreen.height > 0) {
      // 确保 source 区域不越出离屏 canvas 边界
      const sx = Math.max(0, vx);
      const sy = Math.max(0, vy);
      const sw = Math.min(vw, this._offscreen.width  - sx);
      const sh = Math.min(vh, this._offscreen.height - sy);
      if (sw > 0 && sh > 0) {
        ctx.drawImage(
          this._offscreen,
          sx, sy, sw, sh,   // source（世界坐标，已钳制）
          0,  0,  cw, ch    // dest（屏幕实际像素）
        );
        return;
      }
    }

    // 降级方案：离屏 canvas 不可用时，直接在屏幕 ctx 上绘制视口内区域
    // 注意：不能调用 _drawAll（含clearRect），只绘制区域和弱水
    ctx.save();
    ctx.translate(-vx, -vy);
    C.ZONES.forEach(zone => {
      const rect = C.getZoneRect(zone.col, zone.row);
      this._drawZone(ctx, zone, rect);
    });
    this._drawWeakWater(ctx);
    ctx.restore();
  }

  // 绘制区域标签（在相机坐标系下）
  drawLabels(ctx, camera) {
    const { vx, vy, vw, vh } = camera.getViewport();
    ctx.save();
    C.ZONES.forEach(zone => {
      const rect = C.getZoneRect(zone.col, zone.row);
      // 区域中心世界坐标
      const wcx = rect.x + rect.w / 2;
      const wcy = rect.y + 80;
      // 是否在视口内
      if (wcx < vx || wcx > vx + vw || wcy < vy || wcy > vy + vh) return;
      // 转屏幕坐标
      const sx = wcx - vx;
      const sy = wcy - vy;

      // 背景板（兼容不支持 roundRect 的浏览器）
      const lx = sx - 60, ly = sy - 15, lw = 120, lh = 30, lr = 6;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(lx, ly, lw, lh, lr);
      } else {
        ctx.moveTo(lx + lr, ly);
        ctx.lineTo(lx + lw - lr, ly);
        ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + lr);
        ctx.lineTo(lx + lw, ly + lh - lr);
        ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - lr, ly + lh);
        ctx.lineTo(lx + lr, ly + lh);
        ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - lr);
        ctx.lineTo(lx, ly + lr);
        ctx.quadraticCurveTo(lx, ly, lx + lr, ly);
        ctx.closePath();
      }
      ctx.fill();

      // 边框
      ctx.strokeStyle = zone.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(lx, ly, lw, lh, lr);
      } else {
        ctx.moveTo(lx + lr, ly);
        ctx.lineTo(lx + lw - lr, ly);
        ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + lr);
        ctx.lineTo(lx + lw, ly + lh - lr);
        ctx.quadraticCurveTo(lx + lw, ly + lh, lx + lw - lr, ly + lh);
        ctx.lineTo(lx + lr, ly + lh);
        ctx.quadraticCurveTo(lx, ly + lh, lx, ly + lh - lr);
        ctx.lineTo(lx, ly + lr);
        ctx.quadraticCurveTo(lx, ly, lx + lr, ly);
        ctx.closePath();
      }
      ctx.stroke();

      // 文字
      ctx.font = 'bold 14px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(`${zone.emoji} ${zone.name}`, sx, sy);
    });
    ctx.restore();
  }
}

// ── 全局 Tile 碰撞查询（供 player.js 移动逻辑调用）──
// 返回 0=可行走, 1=阻隔, 2=弱水
function getTileAt(wx, wy) {
  if (!C.ZONE_TILES) return 0;
  const col = Math.floor(wx / C.CELL);
  const row = Math.floor(wy / C.CELL);
  if (col < 0 || col > 2 || row < 0 || row > 2) return 0;
  const zone = C.ZONES.find(z => z.col === col && z.row === row);
  if (!zone) return 0;
  const tiles = C.ZONE_TILES[zone.id];
  if (!tiles) return 0;
  const localX = wx - col * C.CELL;
  const localY = wy - row * C.CELL;
  const tc = Math.floor(localX / C.TILE_SIZE);
  const tr = Math.floor(localY / C.TILE_SIZE);
  if (tr < 0 || tr >= 33 || tc < 0 || tc >= 33) return 0;
  return tiles[tr][tc];
}

// 检查矩形区域内是否有 wall(1) 格
function isWallAt(wx, wy, radius = 20) {
  const points = [
    [wx - radius, wy - radius],
    [wx + radius, wy - radius],
    [wx - radius, wy + radius],
    [wx + radius, wy + radius],
    [wx,          wy         ],
  ];
  return points.some(([px, py]) => getTileAt(px, py) === 1);
}

// ===== 摄像机 =====
class Camera {
  constructor(viewW, viewH) {
    this.x = 0;  // 视口左上角世界坐标
    this.y = 0;
    this.vw = viewW;
    this.vh = viewH;
  }

  follow(target) {
    // 摄像机中心对准目标
    this.x = target.x - this.vw / 2;
    this.y = target.y - this.vh / 2;
    // 边界限制
    this.x = Utils.clamp(this.x, 0, C.WORLD_W - this.vw);
    this.y = Utils.clamp(this.y, 0, C.WORLD_H - this.vh);
  }

  getViewport() {
    return { vx: this.x, vy: this.y, vw: this.vw, vh: this.vh };
  }

  // 世界坐标 → 屏幕坐标
  worldToScreen(wx, wy) {
    return { sx: wx - this.x, sy: wy - this.y };
  }

  // 屏幕坐标 → 世界坐标
  screenToWorld(sx, sy) {
    return { wx: sx + this.x, wy: sy + this.y };
  }

  // 检查世界坐标是否在视口内（带margin）
  inView(wx, wy, margin = 100) {
    return wx >= this.x - margin && wx <= this.x + this.vw + margin &&
           wy >= this.y - margin && wy <= this.y + this.vh + margin;
  }
}
