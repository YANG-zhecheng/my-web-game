// ===== 主游戏控制器 =====
class Game {
  constructor() {
    this.canvas    = document.getElementById('gameCanvas');
    this.minimap   = document.getElementById('minimap');

    // 子系统
    this.renderer  = new Renderer(this.canvas, this.minimap);
    this.renderer._game = this; // 供小地图任务标注读取 questManager
    this.gameMap   = new GameMap();
    this.camera    = new Camera(this.renderer.getSize().w, this.renderer.getSize().h);
    this.player    = new Player(this);
    this.tangSeng  = new TangSeng(this);
    this.waveSystem= new WaveSystem(this);
    this.ui        = new GameUI(this);
    this.bag       = new Bag(this);
    this.loot      = new LootManager(this);
    this.tuDiGong  = new TuDiGong(this);
    this.merchant  = new Merchant(this);
    this.quest     = new QuestManager(this);

    // 弱水区域矩形（碰撞用）
    this._weakWaterRects = C.buildWeakWaterRects();

    // 生成区域BOSS
    this.bosses = this._spawnBosses();

    // 生成小怪区
    this.miniEnemyGroups = this._spawnMiniEnemies();

    // 游戏状态
    this.running   = false;
    this.over      = false;
    this.won       = false;
    this.elapsed   = 0; // 游戏时间ms

    // 选中目标（右键点击敌人时记录）
    this.selectedTarget = null;

    // 鼠标世界坐标（技能方向用）
    this.mouseWorldX = 0;
    this.mouseWorldY = 0;

    // 待拾取装备队列
    this._itemQueue = [];

    // 绑定输入
    this._bindInput();

    // 预渲染地图（耗时操作，初始化时做一次）
    this.gameMap.prerender();

    // 调整摄像机视口（窗口resize时同步）
    window.addEventListener('resize', () => {
      const {w,h} = this.renderer.getSize();
      this.camera.vw = w;
      this.camera.vh = h;
    });

    // 启动
    this._start();
  }

  /* ── 生成区域BOSS ── */
  _spawnBosses() {
    const bosses = [];
    C.ZONES.forEach(zone => {
      if (!zone.hasBoss) return;
      const rect = C.getZoneRect(zone.col, zone.row);
      const margin = 300;

      if (zone.monsters) {
        // 按怪物表逐行生成：type=boss 每行生成1个，等级固定
        let bossIdx = 0;
        zone.monsters.filter(m => m.type === 'boss').forEach(m => {
          // 优先使用配置的 spawnX/spawnY，否则按格子分区随机
          let x, y;
          if (m.spawnX !== undefined && m.spawnY !== undefined) {
            x = m.spawnX;
            y = m.spawnY;
          } else {
            const cols = 2, rows = 2;
            const cw = (rect.w - margin*2) / cols;
            const ch = (rect.h - margin*2) / rows;
            const gc = bossIdx % cols;
            const gr = Math.floor(bossIdx / cols) % rows;
            x = rect.x + margin + gc * cw + Math.random() * cw;
            y = rect.y + margin + gr * ch + Math.random() * ch;
          }
          const boss = new Boss(x, y, m.level, zone.id);
          boss.name = m.name;           // 覆盖随机名字
          boss.monsterConfig = m;       // 保存配置表引用（掉落用）
          boss._calcStats();            // 用 monsterConfig 数值重算属性
          boss._initDashSkill();        // 初始化冲刺技能（需在 name 确定后调用）
          boss.hp = boss.maxHp;
          bosses.push(boss);
          bossIdx++;
        });
      } else {
        // 旧逻辑：随机名字池，随机等级，生成3个
        for (let i = 0; i < 3; i++) {
          const lv = Utils.randInt(zone.bossMin, zone.bossMax);
          const x = rect.x + margin + Math.random() * (rect.w - margin*2);
          const y = rect.y + margin + Math.random() * (rect.h - margin*2);
          bosses.push(new Boss(x, y, lv, zone.id));
        }
      }
    });
    return bosses;
  }

  /* ── 输入绑定 ── */
  _bindInput() {
    // 键盘
    window.addEventListener('keydown', e => {
      this.player.keys[e.code] = true;
      // 技能快捷键：E/R/T/Y 需要点地面释放，Q 直接释放
      if (e.code === 'KeyE') this.player.selectSkill(0);
      if (e.code === 'KeyR') this.player.selectSkill(1);
      if (e.code === 'KeyT') this.player.selectSkill(2);
      if (e.code === 'KeyY') this.player.selectSkill(3);
      if (e.code === 'KeyQ') {
        // Q键：优先触发靠近的 NPC 交互，否则范围拾取掉落物
        let npcHandled = false;
        if (this.tangSeng && this.tangSeng.tryInteract()) npcHandled = true;
        if (!npcHandled && this.tuDiGong && this.tuDiGong.tryInteract()) npcHandled = true;
        if (!npcHandled && this.merchant && this.merchant.tryInteract()) npcHandled = true;
        // 未来可在此处继续追加其他 NPC 的 tryInteract() 判断
        if (!npcHandled && this.loot) this.loot.pickupNearby(this.player.x, this.player.y);
      }
      if (e.code === 'KeyG') {
        // G键：筋斗云传送
        this.player.useSkill(4);
      }
      if (e.code === 'Escape') this.player.cancelSkill();   // 取消待释放
    });
    window.addEventListener('keyup', e => {
      this.player.keys[e.code] = false;
    });

    // ── 公共坐标转换：把 CSS 鼠标坐标换算为 canvas 逻辑坐标 ──
    const toCanvasXY = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width  / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        sx: (e.clientX - rect.left) * scaleX,
        sy: (e.clientY - rect.top)  * scaleY,
      };
    };

    // 鼠标位置 → 世界坐标
    this.canvas.addEventListener('mousemove', e => {
      const { sx, sy } = toCanvasXY(e);
      const wc = this.camera.screenToWorld(sx, sy);
      this.mouseWorldX = wc.wx;
      this.mouseWorldY = wc.wy;
    });

    // ── 左键：释放待定技能 / 仅选中目标（不移动不攻击）──
    this.canvas.addEventListener('click', e => {
      const { sx, sy } = toCanvasXY(e);
      const { wx, wy } = this.camera.screenToWorld(sx, sy);

      // 优先：释放待定技能
      if (this.player.pendingSkill >= 0) {
        this.player.releaseSkillAt(wx, wy);
        return;
      }

      if (this.player.dead) return;

      // 左键点击敌人 → 仅选中，不追击
      const allEnemies = this.getAllEnemies();
      let hitEnemy = null;
      let hitDist = Infinity;
      for (const en of allEnemies) {
        if (en.dead) continue;
        const d = Utils.dist({ x: wx, y: wy }, en);
        const tol = (en.radius || 16) + 8;
        if (d <= tol && d < hitDist) {
          hitDist = d;
          hitEnemy = en;
        }
      }

      if (hitEnemy) {
        // 仅记录选中目标，不触发移动/攻击
        this.selectedTarget = hitEnemy;
      } else {
        // 左键点空地 → 取消选中（不移动）
        this.selectedTarget = null;
      }
    });

    // ── 右键：主操作 — 点敌人=选中+追击攻击，点地面=移动；有待释放技能时取消 ──
    this.canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (this.player.dead) return;

      // 若有待释放技能，右键取消
      if (this.player.pendingSkill >= 0) {
        this.player.cancelSkill();
        return;
      }

      const { sx, sy } = toCanvasXY(e);
      const { wx, wy } = this.camera.screenToWorld(sx, sy);

      // 检测是否命中敌人
      const allEnemies = this.getAllEnemies();
      let hitEnemy = null;
      let hitDist = Infinity;
      for (const en of allEnemies) {
        if (en.dead) continue;
        const d = Utils.dist({ x: wx, y: wy }, en);
        const tol = (en.radius || 16) + 8;
        if (d <= tol && d < hitDist) {
          hitDist = d;
          hitEnemy = en;
        }
      }

      if (hitEnemy) {
        // 右键命中敌人 → 选中并追击攻击
        this.selectedTarget = hitEnemy;
        this.player.setRClickAttack(hitEnemy);
      } else {
        // 右键点地面 → 移动到目标点
        this.player.setRClickMove(wx, wy);
      }
    });
  }

  /* ── 启动 ── */
  _start() {
    this.running = true;
    this.waveSystem.start();
    this.ui.refresh();
    // 开局引导提示（仅首次）
    this._showIntroGuide();
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(now - last, 100); // 最大100ms防爆帧
      last = now;
      try {
        this._update(dt);
        this._render(dt);
      } catch (err) {
        // 捕获任何运行时异常，防止主循环因未捕获错误而冻结
        console.error('[Game Loop Error]', err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ── 主更新 ── */
  _update(dt) {
    // this.over 仅由唐僧死亡 / 通关设置，真正硬停
    // 玩家死亡(player.dead)时仍需运行 player.update（复活倒计时），但跳过其余逻辑
    if (this.over) return;
    this.elapsed += dt;

    const allEnemies = this.getAllEnemies();

    // 更新玩家
    this.player.update(dt, allEnemies);

    // 更新唐僧
    this.tangSeng.update(dt);

    // 更新摄像机跟随：玩家死亡时跟随唐僧
    const camTarget = this.player.dead ? this.tangSeng : this.player;
    this.camera.follow(camTarget);

    // 更新区域BOSS
    this.bosses.forEach(b => {
      b.update(dt, this.player, this.tangSeng, this);
      // BOSS死亡时给玩家奖励
      if (b.dead && !b._rewarded) {
        b._rewarded = true;
        this._grantBossReward(b);
      }
      // BOSS复活后清除奖励标记
      if (!b.dead && b._rewarded) {
        b._rewarded = false;
      }
    });

    // 更新小怪区
    this._updateMiniEnemies(dt);

    // 更新波次系统
    this.waveSystem.update(dt, this.player, this.tangSeng);
    // 波次怪死亡奖励
    this.waveSystem.enemies.forEach(e => {
      if (e.dead && !e._rewarded) {
        e._rewarded = true;
        const expGain  = Math.floor(5 * (1 + (e.wave - 1) * 0.15));
        const goldGain = Utils.randInt(1, 3 + e.wave);
        // 波次怪：只给经验和金币，不掉任何装备
        this.player.addExp(expGain);
        this.player.gold += goldGain;
      }
    });

    // 检查待拾取装备
    if (this._itemQueue.length > 0 && !document.getElementById('item-panel').classList.contains('hidden') === false) {
      // 装备面板已关闭，弹出下一个
    }

    // 更新掉落物
    if (this.loot) this.loot.update(dt);

    // 更新土地公NPC
    if (this.tuDiGong) this.tuDiGong.update(dt, this.player.level);
    // 更新商人NPC
    if (this.merchant) this.merchant.update(dt);

    // ── 更新猴子猴孙分身 ──
    if (this.monkeyClones && this.monkeyClones.length > 0) {
      for (const clone of this.monkeyClones) clone.update(dt);
      // 清除彻底死亡的分身（dissolve 结束后 alive=false）
      this.monkeyClones = this.monkeyClones.filter(c => c.alive);
    }

    // ── 唐僧光环：对范围内友军施加回血 + 减伤 ──
    this._updateTangSengAura(dt);

    // ── 单位碰撞分离 ──
    this._resolveUnitCollisions();

    // UI刷新
    this.ui.refresh();
    this.ui.updateTopBar(this.waveSystem, this.elapsed);
  }

  /* ── 唐僧光环效果 ──
   * 光环半径 500px，对范围内的友军（主角）：
   *   - 每秒回复 10% 最大生命（按帧 dt 折算）
   *   - 施加 20% 减伤（通过 inTangSengAura 标志位，takeDamage 中读取）
   */
  _updateTangSengAura(dt) {
    const AURA_R  = 500;
    const HEAL_PS = 0.10; // 每秒回复比例

    // 友军列表：目前只有主角（后续可扩展）
    const allies = [this.player];

    for (const ally of allies) {
      if (!ally || ally.dead) continue;
      const inAura = Utils.dist(ally, this.tangSeng) <= AURA_R;
      ally.inTangSengAura = inAura;
      if (inAura) {
        const heal = ally.maxHp * HEAL_PS * (dt / 1000);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      }
    }
  }

  /* ── 单位间碰撞推开（圆形碰撞检测）──
   * 在所有单位 update 完成后统一执行，避免互相耦合。
   * 规则：
   *   - 玩家 vs 怪物：玩家被推开 20%，怪物被推开 80%（防止怪物堆在玩家身上）
   *   - 怪物 vs 怪物：对等各推 50%
   * 每帧最多执行1轮（性能优先），分离量用 soft-push（渐进式，防止抖动）
   */
  _resolveUnitCollisions() {
    if (this.player.dead) return;

    // 收集所有活着的单位（玩家 + 怪物）
    const player  = this.player;
    const enemies = this.getAllEnemies().filter(e => !e.dead);

    // ── 玩家 vs 怪物 ──
    for (const e of enemies) {
      const minD = player.radius + e.radius;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < minD * minD && dist2 > 0.01) {
        const dist = Math.sqrt(dist2);
        const overlap = minD - dist;
        // 将重叠量沿分离方向分配（玩家20%，怪物80%）
        const nx = dx / dist;
        const ny = dy / dist;
        const pushE = overlap * 0.8;  // 怪物被推得多
        const pushP = overlap * 0.2;  // 玩家被轻微推开
        // 玩家推开（钳制在世界边界内）
        player.x = Utils.clamp(player.x + nx * pushP, player.radius, C.WORLD_W - player.radius);
        player.y = Utils.clamp(player.y + ny * pushP, player.radius, C.WORLD_H - player.radius);
        // 怪物推开（不能穿越弱水）
        const newEX = Utils.clamp(e.x - nx * pushE, e.radius, C.WORLD_W - e.radius);
        const newEY = Utils.clamp(e.y - ny * pushE, e.radius, C.WORLD_H - e.radius);
        if (!this._inWeakWater(newEX, e.y)) e.x = newEX;
        if (!this._inWeakWater(e.x, newEY)) e.y = newEY;
      }
    }

    // ── 怪物 vs 怪物 ──
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j];
        // 只处理在同一区域附近的怪物（剪枝：距离超过 2*maxRadius 直接跳过）
        const quickDx = a.x - b.x;
        const quickDy = a.y - b.y;
        const minD = a.radius + b.radius;
        if (Math.abs(quickDx) > minD || Math.abs(quickDy) > minD) continue;
        const dist2 = quickDx * quickDx + quickDy * quickDy;
        if (dist2 < minD * minD && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const overlap = (minD - dist) * 0.5; // 各推50%
          const nx = quickDx / dist;
          const ny = quickDy / dist;
          const newAX = Utils.clamp(a.x + nx * overlap, a.radius, C.WORLD_W - a.radius);
          const newAY = Utils.clamp(a.y + ny * overlap, a.radius, C.WORLD_H - a.radius);
          const newBX = Utils.clamp(b.x - nx * overlap, b.radius, C.WORLD_W - b.radius);
          const newBY = Utils.clamp(b.y - ny * overlap, b.radius, C.WORLD_H - b.radius);
          if (!this._inWeakWater(newAX, a.y)) a.x = newAX;
          if (!this._inWeakWater(a.x, newAY)) a.y = newAY;
          if (!this._inWeakWater(newBX, b.y)) b.x = newBX;
          if (!this._inWeakWater(b.x, newBY)) b.y = newBY;
        }
      }
    }
  }

  /* ── 弱水碰撞辅助（供碰撞分离复用）── */
  _inWeakWater(wx, wy) {
    if (!this._weakWaterRects) {
      this._weakWaterRects = C.buildWeakWaterRects();
    }
    for (const r of this._weakWaterRects) {
      if (wx > r.x && wx < r.x + r.w && wy > r.y && wy < r.y + r.h) return true;
    }
    return false;
  }

  /* ── 主渲染 ── */
  _render(dt) {
    this.renderer.render(
      dt,
      this.gameMap,
      this.camera,
      this.player,
      this.tangSeng,
      this.bosses,
      this.waveSystem,
      this.miniEnemyGroups,
      this.loot,
      this.tuDiGong,
      this.merchant
    );
  }

  /**
   * 统一掉落入口：从 drops[] 中随机取1个掉到地面
   * @param {string[]} drops  配置表掉落列表（可含'经验球'/'金币'/装备名）
   * @param {number}   x      掉落世界坐标X
   * @param {number}   y      掉落世界坐标Y
   * @param {number}   [expBase=30]   经验球的经验量基准
   * @param {number}   [goldBase=10]  金币的金币量基准
   */
  _spawnOneDrop(drops, x, y, expBase = 30, goldBase = 10) {
    if (!drops || drops.length === 0) return;
    const valid = drops.filter(d => d && d.trim());
    if (valid.length === 0) return;

    // 从1-4个中随机选1个（先随机池大小再随机选）
    const poolSize = Utils.randInt(1, Math.min(4, valid.length));
    const shuffled = [...valid].sort(() => Math.random() - 0.5);
    const dropName = shuffled[Utils.randInt(0, poolSize - 1)];

    const ox = x + Utils.randFloat(-20, 20);
    const oy = y + Utils.randFloat(-20, 20);

    if (dropName === '经验球') {
      const val = Math.max(1, Math.round(expBase * 5 * Utils.randFloat(0.8, 1.5)));
      if (this.loot) this.loot.spawn(ox, oy, { type: 'exp', value: val, name: '经验球' });
    } else if (dropName === '金币') {
      const val = Math.max(1, Math.round(goldBase * Utils.randFloat(0.8, 2.0)));
      if (this.loot) this.loot.spawn(ox, oy, { type: 'gold', value: val, name: '金币' });
    } else {
      // 优先查装备表，找不到则查物品表
      const item = getEquipByName(dropName) || getItemByName(dropName);
      if (item && this.loot) {
        if (item.type === 'item') {
          // 物品类掉落物
          this.loot.spawn(ox, oy, Object.assign({}, item));
        } else {
          this.loot.spawn(ox, oy, Object.assign({}, item, { attrs: Object.assign({}, item.attrs) }));
        }
      }
    }
  }

  /* ── BOSS奖励 ── */
  _grantBossReward(boss) {
    this.player.addExp(boss.expReward);
    this.player.gold += boss.goldReward;

    const drops = boss.monsterConfig && boss.monsterConfig.drops;
    if (drops && drops.length > 0) {
      // BOSS 100% 掉落：从配置表随机1个丢地面
      // 地面金币 = 直接奖励的3倍
      this._spawnOneDrop(drops, boss.x, boss.y, boss.expReward, boss.goldReward * 3);
    } else {
      // 无配置表：100% 掉落随机装备
      const item = Utils.generateEquip(boss.level);
      if (this.loot) this.loot.spawn(boss.x, boss.y, item);
    }
  }

  /* ── 装备掉落 → 生成地面掉落物（需传入坐标）── */
  spawnLoot(x, y, item) {
    if (this.loot) {
      this.loot.spawn(x, y, item);
    }
  }

  /* ── 旧的直接入背包流程（背包满时fallback）── */
  _queueItem(item, x, y) {
    // 优先生成地面掉落物
    if (this.loot && x !== undefined && y !== undefined) {
      this.loot.spawn(x, y, item);
      return;
    }
    // 没有坐标时直接入背包
    if (this.bag && !this.bag.isFull()) {
      this.bag.addItem(item);
      if (this.ui) this.ui.showSkillToast(`🎒 获得「${item.name}」(B键查看背包)`);
      return;
    }
    // 背包满弹窗
    this._itemQueue.push(item);
    if (this._itemQueue.length === 1) this._showNextItem();
  }

  _showNextItem() {
    if (this._itemQueue.length === 0) return;
    const item = this._itemQueue[0];
    this.ui.dom.itemPanelTitle.textContent = `💎 背包已满！${C.QUALITY_NAME[item.quality]}装备`;
    this.ui.dom.itemPanelContent.innerHTML = Utils.describeEquip(item);
    document.getElementById('btn-equip-item').style.display = 'inline-block';
    this.ui._pendingItem = item;
    this.ui.dom.itemPanel.classList.remove('hidden');
  }

  /* ── 装备当前待装备道具（背包满时的旧流程）── */
  equipPendingItem() {
    const item = this.ui._pendingItem;
    if (!item) return;
    this.player.equipItem(item);
    this.ui.dom.itemPanel.classList.add('hidden');
    this._itemQueue.shift();
    setTimeout(() => this._showNextItem(), 300);
  }

  /* ── 学习心法（HTML按钮调用）── */
  learnXinfa(type) {
    this.player.learnXinfa(type);
    document.getElementById('xinfa-panel').classList.add('hidden');
    this.ui.showSkillToast(type === 'buddha' ? '☯️ 已修炼佛门心法！' : '☲ 已修炼道教心法！');
  }

  /* ── 生成抛射物特效 ── */
  spawnProjectile(x1, y1, x2, y2, color, dmg) {
    this.renderer.addProjectile(x1, y1, x2, y2, color, dmg);
  }

  /* ── 生成小怪区 ── */
  _spawnMiniEnemies() {
    const zones = C.buildMiniEnemyZones();
    const groups = [];
    zones.forEach(zone => {
      const group = { zone, enemies: [] };
      const lv = zone.groupLv;
      const count = zone.count;
      const forceName = zone.forceName || null;
      const monsterConfig = zone.monsterConfig || null;
      // 若配置了 spawnX/spawnY，以此为中心随机散开；否则用原逻辑
      const cfg = monsterConfig;
      const hasCfgSpawn = cfg && cfg.spawnX !== undefined && cfg.spawnY !== undefined;
      for (let i = 0; i < count; i++) {
        let x, y;
        if (hasCfgSpawn) {
          // 以配置坐标为中心，在 ±150px 范围内随机散开
          x = cfg.spawnX + Utils.randFloat(-150, 150);
          y = cfg.spawnY + Utils.randFloat(-150, 150);
        } else {
          x = zone.x + Math.random() * zone.w;
          y = zone.y + Math.random() * zone.h;
        }
        const e = new MiniEnemy(x, y, lv, zone.zoneId);
        if (forceName) e.name = forceName;         // 覆盖随机名字
        if (monsterConfig) {
          e.monsterConfig = monsterConfig; // 掉落配置
          e._calcStats();                  // 用 monsterConfig 数值重算属性
          e.hp = e.maxHp;
        }
        group.enemies.push(e);
      }
      groups.push(group);
    });
    return groups;
  }

  /* ── 更新小怪（在主update中调用）── */
  _updateMiniEnemies(dt) {
    this.miniEnemyGroups.forEach(group => {
      group.enemies.forEach(e => {
        e.update(dt, this.player, this.tangSeng, this);
        // 小怪死亡奖励
        if (e.dead && !e._rewarded) {
          e._rewarded = true;
          this.player.addExp(e.expReward);
          this.player.gold += e.goldReward;

          // 25% 概率掉落地面物品
          if (Utils.chance(0.25)) {
            const drops = e.monsterConfig && e.monsterConfig.drops && e.monsterConfig.drops.filter(d => d);
            if (drops && drops.length > 0) {
              // 地面金币 = 直接奖励的3倍
              this._spawnOneDrop(drops, e.x, e.y, e.expReward, e.goldReward * 3);
            } else {
              // 无配置表：掉随机装备
              if (this.loot) this.loot.spawn(e.x, e.y, Utils.generateEquip(e.level));
            }
          }
        }
      });
    });
  }

  /* ── 获取所有敌人 ── */
  getAllEnemies() {
    const bossLive  = this.bosses.filter(b => !b.dead);
    const waveLive  = this.waveSystem.getAllEnemies();
    const miniLive  = this.miniEnemyGroups
      ? this.miniEnemyGroups.flatMap(g => g.enemies.filter(e => !e.dead))
      : [];
    return [...bossLive, ...waveLive, ...miniLive];
  }

  /* ── 事件回调 ── */
  onPlayerDead() {
    // 不立即结束游戏——等待玩家复活倒计时（player._respawn()处理）
    // 不设置 this.over，让 _update 继续运行（复活逻辑 / 唐僧存活检测均需继续）
  }

  onTangSengDead() {
    // 无论玩家是否死亡，唐僧陨落都必须触发失败
    if (this.over) return; // 防止通关与唐僧死亡同帧重复触发
    this.over = true;
    setTimeout(() => {
      this.ui.showResult(false, `唐僧遇难！妖怪突破了防线！已抵御 ${this.waveSystem.currentWave} 波入侵。`);
    }, 800);
  }

  onWavesCleared() {
    if (this.over) return;
    this.over = true;
    setTimeout(() => {
      this.ui.showResult(true, `成功抵御全部 ${C.TOTAL_WAVES} 波妖怪入侵！唐僧平安西行，取经大功告成！耗时 ${Utils.formatTime(this.elapsed)}`);
    }, 1000);
  }

  /* ── 重新开始 ── */
  restart() {
    location.reload();
  }

  /* ═══════ GM 指令 ═══════ */

  /** 切换 移速+200% */
  gmToggleSpeed() {
    const p = this.player;
    if (!p) return;
    p.gmSpeedBoost = !p.gmSpeedBoost;
    p._recalcStats();
    const btn = document.getElementById('gm-btn-speed');
    if (btn) btn.classList.toggle('active', p.gmSpeedBoost);
    if (this.ui) this.ui.showSkillToast(p.gmSpeedBoost ? '🚀 GM移速已开启！' : '🚀 GM移速已关闭');
  }

  /** 切换 攻击+500% */
  gmToggleAtk() {
    const p = this.player;
    if (!p) return;
    p.gmAtkBoost = !p.gmAtkBoost;
    p._recalcStats();
    const btn = document.getElementById('gm-btn-atk');
    if (btn) btn.classList.toggle('active', p.gmAtkBoost);
    if (this.ui) this.ui.showSkillToast(p.gmAtkBoost ? '⚔️ GM攻击已开启！' : '⚔️ GM攻击已关闭');
  }

  /** 切换 无敌 */
  gmToggleInvincible() {
    const p = this.player;
    if (!p) return;
    p.gmInvincible = !p.gmInvincible;
    const btn = document.getElementById('gm-btn-invincible');
    if (btn) btn.classList.toggle('active', p.gmInvincible);
    if (this.ui) this.ui.showSkillToast(p.gmInvincible ? '🛡️ GM无敌已开启！' : '🛡️ GM无敌已关闭');
  }

  /** 直接升一级 */
  gmLevelUp() {
    const p = this.player;
    if (!p) return;
    p.gmLevelUp();
  }

  /**
   * GM 获得道具
   * @param {'exp'|'gold'|'equip'|'random'} type
   * @param {number|string|null} value  经验球/金币时为数量，指定装备时为装备名，随机装备时为品质key或null
   */
  gmGiveItem(type, value) {
    const p = this.player;
    if (!p) return;
    const x = p.x, y = p.y;

    if (type === 'exp') {
      const val = Math.max(1, parseInt(value) || 500);
      if (this.loot) this.loot.spawn(x, y, { type: 'exp', value: val, name: '经验球' });
      if (this.ui) this.ui.showSkillToast(`🎁 GM：生成经验球×${val}`);

    } else if (type === 'gold') {
      const val = Math.max(1, parseInt(value) || 100);
      if (this.loot) this.loot.spawn(x, y, { type: 'gold', value: val, name: '金币' });
      if (this.ui) this.ui.showSkillToast(`🎁 GM：生成金币×${val}`);

    } else if (type === 'equip') {
      const item = getEquipByName(value);
      if (item && this.loot) {
        this.loot.spawn(x, y, Object.assign({}, item, { attrs: Object.assign({}, item.attrs) }));
        if (this.ui) this.ui.showSkillToast(`🎁 GM：生成「${item.name}」`);
      }

    } else if (type === 'random') {
      // value 为品质key（'white'/'green'/'blue'/'purple'/'orange'）或 null（完全随机）
      const qualityKey = value;
      // 从 EQUIP_RAW 中按品质筛选，再随机取一件
      const qualityCnMap = { white:'白', green:'绿', blue:'蓝', purple:'紫', orange:'橙' };
      let pool = EQUIP_RAW;
      if (qualityKey && qualityCnMap[qualityKey]) {
        pool = EQUIP_RAW.filter(e => e.quality === qualityCnMap[qualityKey]);
      }
      if (pool.length === 0) return;
      const raw = pool[Math.floor(Math.random() * pool.length)];
      const item = getEquipByName(raw.name);
      if (item && this.loot) {
        this.loot.spawn(x, y, Object.assign({}, item, { attrs: Object.assign({}, item.attrs) }));
        if (this.ui) this.ui.showSkillToast(`🎁 GM：生成随机「${item.name}」`);
      }
    }
  }

  /* ── 开局引导提示 ──
   * 仅在首次游戏时显示（localStorage 记录），500ms 后淡入，
   * 7s 后自动淡出消失；玩家点击任意位置或按任意键也会提前关闭。
   */
  _showIntroGuide() {
    // 不使用 localStorage（刷新重新载入即重置，保留引导体验）
    const el = document.getElementById('intro-guide');
    if (!el) return;

    // 延迟 500ms 后显示（等待画面渲染完毕）
    setTimeout(() => {
      el.classList.remove('hidden');

      // 7s 后自动淡出
      const hide = () => {
        if (el.classList.contains('hidden')) return;
        el.classList.add('ig-hiding');
        setTimeout(() => {
          el.classList.add('hidden');
          el.classList.remove('ig-hiding');
        }, 500);
        // 解绑提前关闭监听
        document.removeEventListener('keydown', onKey, { once: true });
        document.removeEventListener('mousedown', onMouse, { once: true });
      };

      const autoTimer = setTimeout(hide, 7000);

      // 提前关闭：任意键 / 点击画布
      const onKey   = () => { clearTimeout(autoTimer); hide(); };
      const onMouse = (ev) => {
        // 排除点击到引导框本身
        if (el.contains(ev.target)) return;
        clearTimeout(autoTimer);
        hide();
      };
      document.addEventListener('keydown',   onKey,   { once: true });
      document.addEventListener('mousedown', onMouse, { once: true });
    }, 500);
  }
}

// ===== 全局入口 =====
let game;
window.addEventListener('load', () => {
  game = new Game();
  craftBook  = new CraftBook();
  equipCodex = new EquipCodex(game);
});

// ===== GM 获得道具面板控制（全局函数，供 HTML onclick 调用）=====
let _gmItemCurrentType = null;

function gmItemPanelOpen() {
  // 构建装备列表（每次打开时重建，确保数据最新）
  const list = document.getElementById('gm-item-equip-list');
  if (list && list.childElementCount === 0) {
    const qualityColor = { white:'#c8c8c8', green:'#44dd66', blue:'#44aaff', purple:'#cc66ff', orange:'#ff9933' };
    const qualityCnToKey = { '白':'white', '绿':'green', '蓝':'blue', '紫':'purple', '橙':'orange' };
    EQUIP_RAW.forEach(raw => {
      const qKey = qualityCnToKey[raw.quality] || 'white';
      const color = qualityColor[qKey] || '#aaa';
      const btn = document.createElement('button');
      btn.className = 'gm-equip-btn';
      btn.style.borderColor = color;
      btn.style.color = color;
      btn.textContent = `${raw.name}  [${raw.quality}]`;
      btn.title = raw.effect;
      btn.onclick = () => {
        game.gmGiveItem('equip', raw.name);
        document.getElementById('gm-item-panel').classList.add('hidden');
      };
      list.appendChild(btn);
    });
  }

  // 重置到第一步
  document.getElementById('gm-item-step1').classList.remove('hidden');
  document.getElementById('gm-item-step2').classList.add('hidden');
  document.getElementById('gm-item-panel').classList.remove('hidden');
}

function gmItemSelectType(type) {
  _gmItemCurrentType = type;
  document.getElementById('gm-item-step1').classList.add('hidden');
  document.getElementById('gm-item-step2').classList.remove('hidden');

  // 隐藏所有子面板
  ['gm-item-amount-panel','gm-item-equip-panel','gm-item-random-panel'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  if (type === 'exp') {
    document.getElementById('gm-item-amount-label').textContent = '经验球数量';
    document.getElementById('gm-item-amount-input').value = '500';
    document.getElementById('gm-item-amount-panel').classList.remove('hidden');
  } else if (type === 'gold') {
    document.getElementById('gm-item-amount-label').textContent = '金币数量';
    document.getElementById('gm-item-amount-input').value = '100';
    document.getElementById('gm-item-amount-panel').classList.remove('hidden');
  } else if (type === 'equip') {
    document.getElementById('gm-item-equip-panel').classList.remove('hidden');
  } else if (type === 'random') {
    document.getElementById('gm-item-random-panel').classList.remove('hidden');
  }
}

function gmItemConfirmAmount() {
  const val = parseInt(document.getElementById('gm-item-amount-input').value) || 0;
  if (val <= 0) return;
  game.gmGiveItem(_gmItemCurrentType, val);
  document.getElementById('gm-item-panel').classList.add('hidden');
}

function gmItemConfirmRandom(qualityKey) {
  game.gmGiveItem('random', qualityKey);
  document.getElementById('gm-item-panel').classList.add('hidden');
}

function gmItemBack() {
  document.getElementById('gm-item-step1').classList.remove('hidden');
  document.getElementById('gm-item-step2').classList.add('hidden');
}

// ===== 合成图鉴控制器（重构版：含来源信息）=====
let craftBook;
let equipCodex;
class CraftBook {
  constructor() {
    this._panel      = document.getElementById('craft-book-panel');
    this._recipeList = document.getElementById('cb-recipe-list');
    this._detailPanel= document.getElementById('cb-detail-panel');
    this._built      = false;

    // 预构建来源索引（装备/物品名 → 来源列表）
    this._sourceMap  = this._buildSourceMap();

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._panel.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  /** 构建"装备来源"索引：遍历所有区域怪物掉落 + 商人商品 */
  _buildSourceMap() {
    const map = {}; // name -> [{type:'drop',monster,region} | {type:'shop'}]
    const add = (name, entry) => {
      if (!map[name]) map[name] = [];
      // 去重：同名来源只记一次
      const key = JSON.stringify(entry);
      if (!map[name].some(e => JSON.stringify(e) === key)) map[name].push(entry);
    };

    // 怪物掉落
    (C.REGIONS || []).forEach(region => {
      (region.monsters || []).forEach(monster => {
        (monster.drops || []).forEach(dropName => {
          add(dropName, { type: 'drop', monster: monster.name, monsterType: monster.type, region: region.name });
        });
      });
    });

    // 商人购买（精铁、精钢）
    const shopGoods = ['精铁', '精钢'];
    shopGoods.forEach(name => add(name, { type: 'shop' }));

    return map;
  }

  toggle() {
    if (this._panel.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    if (!this._built) this._build();
    this._panel.classList.remove('hidden');
  }

  hide() {
    this._panel.classList.add('hidden');
  }

  /** 构建全部配方行（仅首次） */
  _build() {
    this._built = true;
    this._recipeList.innerHTML = '';

    // 品质排序权重
    const Q_ORDER = { white:0, green:1, blue:2, purple:3, orange:4 };

    // 按结果装备品质分组排序
    const recipes = getCraftRecipes().slice().sort((a, b) => {
      const qa = this._qualityOf(a.result);
      const qb = this._qualityOf(b.result);
      return (Q_ORDER[qa] || 0) - (Q_ORDER[qb] || 0);
    });

    // 当前品质段标题
    let lastQuality = null;

    recipes.forEach(recipe => {
      const resItem = getEquipByName(recipe.result) || getItemByName(recipe.result);
      const resQuality = resItem ? resItem.quality : 'white';

      // 插入品质分隔标题
      if (resQuality !== lastQuality) {
        lastQuality = resQuality;
        const sep = document.createElement('div');
        sep.className = 'cb-quality-sep';
        const qInfo = getQuality(resQuality);
        sep.textContent = (C.QUALITY_NAME && C.QUALITY_NAME[resQuality]) || resQuality;
        sep.style.color = qInfo ? qInfo.color : '#ccc';
        sep.style.borderColor = qInfo ? qInfo.border : '#444';
        this._recipeList.appendChild(sep);
      }

      // 配方行
      const row = document.createElement('div');
      row.className = 'cb-recipe-row';

      // 材料部分
      const matsDiv = document.createElement('div');
      matsDiv.className = 'cb-mats';

      // 统计材料重复数
      const matCounts = {};
      recipe.materials.forEach(m => { matCounts[m] = (matCounts[m] || 0) + 1; });

      // 去重后渲染材料标签
      const rendered = new Set();
      recipe.materials.forEach(matName => {
        if (rendered.has(matName)) return;
        rendered.add(matName);
        const count = matCounts[matName];
        const matItem = getEquipByName(matName) || getItemByName(matName);
        const matQInfo = matItem ? getQuality(matItem.quality) : null;
        const matColor = matQInfo ? matQInfo.color : '#c8c8c8';
        const matIcon  = matItem ? (matItem.icon || '📦') : '📦';

        const tag = document.createElement('span');
        tag.className = 'cb-mat-tag';
        tag.style.color = matColor;
        tag.style.borderColor = matColor;
        tag.innerHTML = `${matIcon}<span class="cb-mat-name">${matName}</span>${count > 1 ? `<span class="cb-mat-count">×${count}</span>` : ''}`;
        tag.title = `点击查看 ${matName} 属性`;
        tag.addEventListener('click', (e) => {
          e.stopPropagation();
          this._showDetail(matItem, tag);
        });
        matsDiv.appendChild(tag);
      });

      // 箭头
      const arrow = document.createElement('span');
      arrow.className = 'cb-arrow';
      arrow.textContent = '→';

      // 结果装备
      const resDiv = document.createElement('div');
      resDiv.className = 'cb-result';
      const resQInfo = resItem ? getQuality(resItem.quality) : null;
      const resColor = resQInfo ? resQInfo.color : '#c8c8c8';
      const resIcon  = resItem ? (resItem.icon || '📦') : '📦';
      resDiv.innerHTML = `<span class="cb-res-tag" style="color:${resColor};border-color:${resColor}">${resIcon} ${recipe.result}</span>`;
      resDiv.title = `点击查看 ${recipe.result} 属性`;
      resDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showDetail(resItem, resDiv.querySelector('.cb-res-tag'));
      });

      row.appendChild(matsDiv);
      row.appendChild(arrow);
      row.appendChild(resDiv);
      this._recipeList.appendChild(row);
    });
  }

  /** 获取装备/物品的品质key */
  _qualityOf(name) {
    const item = getEquipByName(name) || getItemByName(name);
    return item ? item.quality : 'white';
  }

  /** 在右侧详情区展示装备属性 */
  _showDetail(item, triggerEl) {
    if (!item) {
      this._detailPanel.innerHTML = '<div class="cb-detail-hint">暂无数据</div>';
      return;
    }

    // 高亮选中标签
    this._recipeList.querySelectorAll('.cb-mat-tag.cb-selected, .cb-res-tag.cb-selected')
      .forEach(el => el.classList.remove('cb-selected'));
    if (triggerEl) triggerEl.classList.add('cb-selected');

    const qInfo  = getQuality(item.quality);
    const qColor = qInfo ? qInfo.color : '#c8c8c8';
    const qBorder= qInfo ? qInfo.border : '#555';
    const slotName = (C.EQUIP_SLOT_NAMES && C.EQUIP_SLOT_NAMES[item.slot]) || item.slot || '';
    const qName  = (C.QUALITY_NAME && C.QUALITY_NAME[item.quality]) || item.quality || '';
    const attrs  = item.attrs || {};

    const PCT_KEYS = new Set(['dodge','atkSpeedBonus','dmgBonus','damageReduction','speed','critBonus']);
    const ATTR_LABEL = {
      atk:'⚔️ 攻击', armor:'🛡️ 防御', hp:'❤️ 生命', mp:'💧 法力',
      dodge:'🌀 闪避', speed:'💨 移速', atkSpeedBonus:'⚡ 攻速',
      dmgBonus:'💥 增伤', damageReduction:'🛡 减伤', critBonus:'🎯 暴击',
      hpRegen:'💚 回血',
    };

    let html = `<div class="cb-det-title" style="color:${qColor}">${item.icon || '📦'} ${item.name}</div>`;
    html += `<div class="cb-det-row"><span class="cb-det-label">部位</span><span class="cb-det-val">${slotName}</span></div>`;
    html += `<div class="cb-det-row"><span class="cb-det-label">品质</span><span class="cb-det-val" style="color:${qColor}">${qName}</span></div>`;
    html += `<div class="cb-det-divider"></div>`;

    let hasAttr = false;
    for (const [key, label] of Object.entries(ATTR_LABEL)) {
      const v = attrs[key];
      if (v == null || v === 0) continue;
      hasAttr = true;
      let valStr;
      if (key === 'hpRegen') {
        valStr = `+${v}/s`;
      } else if (PCT_KEYS.has(key)) {
        valStr = v <= 1 && v > 0 ? `+${(v * 100).toFixed(1)}%` : `${v > 0 ? '+' : ''}${v}`;
      } else {
        valStr = `${v > 0 ? '+' : ''}${v}`;
      }
      html += `<div class="cb-det-row"><span class="cb-det-label">${label}</span><span class="cb-det-val cb-det-green">${valStr}</span></div>`;
    }
    if (!hasAttr) {
      html += `<div class="cb-det-row"><span class="cb-det-label" style="color:#888">暂无属性</span></div>`;
    }

    if (item.effect) {
      html += `<div class="cb-det-divider"></div>`;
      html += `<div class="cb-det-effect">✦ ${item.effect}</div>`;
    }

    // ── 装备来源 ──
    const sources = this._sourceMap[item.name] || [];
    html += `<div class="cb-det-divider"></div>`;
    html += `<div class="cb-det-use-title">📍 获取来源</div>`;
    if (sources.length === 0) {
      html += `<div class="cb-det-source-row cb-det-source-craft">🔨 仅可通过合成获得</div>`;
    } else {
      sources.forEach(src => {
        if (src.type === 'shop') {
          html += `<div class="cb-det-source-row cb-det-source-shop">🛒 行脚商人购买</div>`;
        } else if (src.type === 'drop') {
          const typeIcon = src.monsterType === 'boss' ? '👑' : '👾';
          html += `<div class="cb-det-source-row cb-det-source-drop">${typeIcon} ${src.region} · ${src.monster} 掉落</div>`;
        }
      });
    }

    // ── 可用于合成 ──
    const relatedRecipes = CRAFT_RECIPES.filter(r => r.materials.includes(item.name));
    if (relatedRecipes.length > 0) {
      html += `<div class="cb-det-divider"></div>`;
      html += `<div class="cb-det-use-title">🔨 可用于合成</div>`;
      relatedRecipes.forEach(r => {
        const rItem = getEquipByName(r.result);
        const rQInfo = rItem ? getQuality(rItem.quality) : null;
        const rColor = rQInfo ? rQInfo.color : '#c8c8c8';
        html += `<div class="cb-det-use-row" style="color:${rColor}">→ ${r.result}</div>`;
      });
    }

    this._detailPanel.innerHTML = html;
    this._detailPanel.style.borderColor = qBorder;
  }
}
