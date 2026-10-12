// ===== 玩家角色 =====
class Player {
  constructor(game) {
    this.game = game;
    const mz = C.getZoneRect(1, 2);
    this.x = mz.x + mz.w / 2;
    this.y = mz.y + mz.h / 2;
    this.radius = 20;

    this.level = 1;
    this.exp   = 0;
    this.gold  = 0;

    this.equips = { weapon:null, head:null, armor:null, boots:null, acc1:null, acc2:null };
    this.xinfa  = null; // 'buddha' | 'taoism'

    this.skillCD = [0, 0, 0, 0, 0];  // 5个技能
    // 各技能是否已解锁（独立判断，支持非顺序解锁）
    this.skillUnlocked = C.SKILL_UNLOCK.map(unlockLv => this.level >= unlockLv);
    this.pendingSkill = -1;           // 待释放技能索引（-1=无）
    // 蓄力状态（用于当头一棒）
    this._charging = false;
    this._chargeTimer = 0;
    this._chargeTarget = null;  // 蓄力目标方向 {wx, wy}
    // 起跳状态（当头一棒新增）
    this._jumping = false;
    this._jumpTimer = 0;
    this._jumpTotalTime = 500; // 0.5s
    this._jumpOffsetY = 0;     // 当前屏幕y偏移（负=向上）
    this._jumpPeakY = 60;      // 跳跃最高点（屏幕像素）

    // ── 消耗品永久加成（丹药等，累计值）──
    this.bonus = {
      atk:          0,   // 大力丸：永久攻击加成
      armor:        0,   // 金刚丸：永久防御加成
      atkSpeedPct:  0,   // 急急丸：永久攻速百分比（0.01 = 1%）
      speedPct:     0,   // 急急丸：永久移速百分比（0.01 = 1%）
    };

    this._recalcStats();
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    this._atkTimer   = 0;
    this._invincible = 0;
    this.dead = false;

    // ── GM 标志 ──
    this.gmSpeedBoost    = false;  // 移速 +200%
    this.gmAtkBoost      = false;  // 攻击 +500%
    this.gmInvincible    = false;  // GM 永久无敌

    this.effects   = [];
    this.dmgFloats = [];
    this.keys = {};

    // ── 右键指令 ──
    this._rClickMoveTarget = null;   // {x, y} 地面移动目标
    this._rClickAtkTarget  = null;   // 敌人对象（追击攻击目标）
    // 点击指示器（地面绿圈 / 敌人红圈）
    this._clickIndicators  = [];

    // ── 动画状态 ──
    // 朝向：8方向，用角度表示（0=右, 顺时针增加）
    this.facing = { x: 0, y: 1 };   // 默认朝下
    this._animState = 'idle';        // 'idle' | 'walk' | 'attack'
    this._animTimer  = 0;            // 当前动画帧计时 ms
    this._walkCycle  = 0;            // 走路摆臂相位 0~2π
    this._atkAnim    = 0;            // 攻击动画进度 0~1（0=起手, 0.5=挥出, 1=收回）
    this._atkAnimTimer = 0;          // 攻击动画计时
    this._atkAnimDur   = 350;        // 完整攻击动作时长 ms
    this._idleBob    = 0;            // 待机呼吸相位

    // ── 菩提棒法 buff ──
    this._bodhiBuff = {
      active: false,
      timer:  0,       // 剩余时间 ms
    };

    // ── 滚花乱舞 buff ──
    this._danceBuff = {
      active:    false,
      timer:     0,     // 剩余时间 ms
      totalTime: 2000,  // 持续2秒
      tickTimer: 0,     // 伤害 tick 计时（每1000ms一次）
      spinAngle: 0,     // 棍影旋转角（用于特效）
    };
    this._danceParticles = []; // 舞棍粒子
  }

  _recalcStats() {
    const lv = this.level, b = C.PLAYER_BASE, g = C.LV_GROWTH;

    // ── 分段成长：1-20级线性，21-100级每级×1.05 ──
    // Lv1 基础：atk=10, armor=0, hp=200
    // Lv2~20：每级 atk+2/armor+5/hp+25（共19级线性）
    // Lv20 时：atk=10+19*2=48, armor=0+19*5=95, hp=200+19*25=675
    const LV_LINEAR_END = 20;
    const ATK_PER_LV = 2, ARMOR_PER_LV = 5, HP_PER_LV = 25;  // 1-20级每级攻击+2
    const LV_SCALE = 1.05; // 21级起每级倍率

    let baseAtk20   = b.atk   + (LV_LINEAR_END - 1) * ATK_PER_LV;   // 48
    let baseArmor20 = b.armor + (LV_LINEAR_END - 1) * ARMOR_PER_LV; // 95
    let baseHp20    = b.hp    + (LV_LINEAR_END - 1) * HP_PER_LV;    // 675

    if (lv <= LV_LINEAR_END) {
      this.baseAtk   = b.atk   + (lv - 1) * ATK_PER_LV;
      this.baseArmor = b.armor + (lv - 1) * ARMOR_PER_LV;
      this.baseMaxHp = b.hp    + (lv - 1) * HP_PER_LV;
    } else {
      const over = lv - LV_LINEAR_END;
      this.baseAtk   = Math.floor(baseAtk20   * Math.pow(LV_SCALE, over));
      this.baseArmor = Math.floor(baseArmor20 * Math.pow(LV_SCALE, over));
      this.baseMaxHp = Math.floor(baseHp20    * Math.pow(LV_SCALE, over));
    }

    this.baseMaxMp       = Math.floor(b.mp * Math.pow(g.mp, lv - 1));
    this.baseAtkRange    = b.atkRange;
    this.baseAtkInterval = b.atkInterval;

    const eq = this.equips;
    const eqAtk    = Utils.sumEquipAttr(eq,'atk');
    const eqHp     = Utils.sumEquipAttr(eq,'hp');
    const eqArmor  = Utils.sumEquipAttr(eq,'armor');
    const eqSpeed  = Utils.sumEquipAttr(eq,'speed');
    const eqDodge  = Utils.sumEquipAttr(eq,'dodge');
    // 兼容新旧字段：atkSpeedBonus（新装备表）/ atkSpeed（旧）
    const eqAtkSpd = Utils.sumEquipAttr(eq,'atkSpeedBonus') + Utils.sumEquipAttr(eq,'atkSpeed');
    this.dmgBonus   = Utils.sumEquipAttr(eq,'dmgBonus');
    // damageReduction（新装备表）/ dmgReduce（旧）均累加
    this.dmgReduce  = Utils.sumEquipAttr(eq,'damageReduction') + Utils.sumEquipAttr(eq,'dmgReduce');
    // 溅射：普攻命中后对主目标周围150px范围内其他敌人造成额外伤害（百分比）
    this.splashBonus = Utils.sumEquipAttr(eq,'splashBonus');
    // 装备回血：hp/s，存入 this.equipHpRegen 供 update tick 使用
    this.equipHpRegen = Utils.sumEquipAttr(eq,'hpRegen');

    this.maxHp       = this.baseMaxHp  + eqHp;
    this.maxMp       = this.baseMaxMp;
    this.atk         = this.baseAtk    + eqAtk;
    this.armor       = this.baseArmor  + eqArmor;
    this.dodge       = Utils.clamp(b.dodge + eqDodge, 0, 0.75);
    // eqSpeed 可能是绝对值（旧格式 +20）或百分比小数（新格式 +0.10=10%）
    // 若 eqSpeed <= 2 则视为百分比，乘以基础速度
    const speedBonus = Math.abs(eqSpeed) <= 2
      ? Math.floor(b.speed * eqSpeed)  // 百分比
      : eqSpeed;                        // 绝对值
    this.speed       = b.speed         + speedBonus;
    // 菩提棒法 buff：攻击间隔×0.75（即攻速+33%），在所有装备加成之后叠加
    const bodhi = (this._bodhiBuff && this._bodhiBuff.active) ? 0.75 : 1.0;
    this.atkInterval = Math.max(400, this.baseAtkInterval / (1 + eqAtkSpd) * bodhi);

    if (this.xinfa === 'buddha') {
      // 佛门：减伤+20%，技能冷却-25%（getCDMul 返回 0.75）
      this.dmgReduce = Utils.clamp(this.dmgReduce + 0.20, 0, 0.8);
    } else if (this.xinfa === 'taoism') {
      // 道教：攻击间隔-25%（即×0.75），普攻伤害+33%
      this.atkInterval = Math.max(400, this.atkInterval * 0.75);
    }

    // ── 消耗品永久加成（丹药）──
    if (this.bonus) {
      this.atk         += this.bonus.atk   || 0;
      this.armor       += this.bonus.armor || 0;
      // 攻速：bonus.atkSpeedPct 叠加到 atkInterval，与装备攻速计算方式一致
      if (this.bonus.atkSpeedPct) {
        this.atkInterval = Math.max(400, this.atkInterval / (1 + this.bonus.atkSpeedPct));
      }
      // 移速：bonus.speedPct 叠加百分比
      if (this.bonus.speedPct) {
        this.speed = Math.floor(this.speed * (1 + this.bonus.speedPct));
      }
    }

    // ── GM 加成（在所有计算之后叠加）──
    if (this.gmSpeedBoost) this.speed = this.speed * 3;      // +200% → 原速度×3
    if (this.gmAtkBoost)   this.atk   = Math.floor(this.atk * 6); // +500% → 原攻击×6
  }

  /* ── GM 直接升一级 ── */
  gmLevelUp() {
    if (this.level >= 100) {
      if (this.game.ui) this.game.ui.showSkillToast('已满级 Lv.100！');
      return;
    }
    const prevMax = this.maxHp;
    const hpRatio = this.hp / prevMax;  // 记录升级前血量比例
    this.level++;
    this._recalcStats();
    this.hp = Utils.clamp(Math.floor(hpRatio * this.maxHp), 1, this.maxHp);  // 升级后保持血量比例
    this.mp = this.maxMp;
    this._checkSkillUnlocks();
    if (this.level === C.XINFA_UNLOCK && !this.xinfa) {
      setTimeout(() => document.getElementById('xinfa-panel').classList.remove('hidden'), 600);
    }
    if (this.game.ui) this.game.ui.showLevelUp(this.level);
  }

  /* ── 检查并更新技能解锁状态 ── */
  _checkSkillUnlocks() {
    for (let i = 0; i < C.SKILL_UNLOCK.length; i++) {
      if (!this.skillUnlocked[i] && this.level >= C.SKILL_UNLOCK[i]) {
        this.skillUnlocked[i] = true;
        if (this.game.ui) this.game.ui.showSkillToast(`🔓 解锁技能：${C.SKILLS[i].name}！`);
      }
    }
  }

  addExp(amount) {
    if (this.level >= 100) return;
    this.exp += amount;
    while (this.level < 100 && this.exp >= C.EXP_TABLE[this.level]) {
      this.exp -= C.EXP_TABLE[this.level];
      const prevMax = this.maxHp;
      const hpRatio = this.hp / prevMax;  // 记录升级前血量比例
      this.level++;
      this._recalcStats();
      this.hp = Utils.clamp(Math.floor(hpRatio * this.maxHp), 1, this.maxHp);  // 升级后保持血量比例
      this._checkSkillUnlocks();
      if (this.level === C.XINFA_UNLOCK && !this.xinfa) {
        setTimeout(() => document.getElementById('xinfa-panel').classList.remove('hidden'), 600);
      }
      if (this.game.ui) this.game.ui.showLevelUp(this.level);
    }
  }

  /* ── 消耗品永久加成（丹药）── */
  applyConsumable(attrs) {
    if (!this.bonus) this.bonus = { atk:0, armor:0, atkSpeedPct:0, speedPct:0 };
    for (const key in attrs) {
      if (this.bonus[key] !== undefined) {
        this.bonus[key] += attrs[key];
      }
    }
    this._recalcStats();
    if (this.game.ui) this.game.ui.refresh();
  }

  learnXinfa(type) {
    this.xinfa = type;
    this._recalcStats();
    this.hp = Utils.clamp(this.hp, 1, this.maxHp);
    if (this.game.ui) this.game.ui.refresh();
  }

  equipItem(item) {
    // 饰品通配：slot='acc' 的装备优先装入 acc1，acc1 已有则装 acc2
    if (item.slot === 'acc') {
      if (!this.equips.acc1) {
        this.equips.acc1 = item;
      } else if (!this.equips.acc2) {
        this.equips.acc2 = item;
      } else {
        // 两格都有：替换 acc1，原 acc1 退回背包
        const old = this.equips.acc1;
        this.equips.acc1 = item;
        if (this.game.bag) this.game.bag.addItem(old);
      }
    } else {
      this.equips[item.slot] = item;
    }
    this._recalcStats();
    this.hp = Utils.clamp(this.hp, 1, this.maxHp);
    if (this.game.ui) this.game.ui.refresh();
  }

  takeDamage(dmg, attacker) {
    if (this.dead || this._invincible > 0 || this.gmInvincible) return;
    if (Utils.chance(this.dodge)) { this._float('MISS','#aaffaa'); return; }
    // 唐僧光环：在范围内额外叠加 20% 减伤
    const auraReduce = this.inTangSengAura ? 0.20 : 0;
    const fd = Utils.calcDamage(dmg, this.armor, 0, Math.min(this.dmgReduce + auraReduce, 0.9));
    this.hp = Math.max(0, this.hp - fd);
    this._float(`-${fd}`, '#ff4444');

    // ── 被攻击自动反击：无键盘输入时，自动将攻击者设为追击目标（模拟右键点击敌人） ──
    if (attacker && attacker !== this && !attacker.dead) {
      const hasKeyInput = this.keys && (
        this.keys['KeyW'] || this.keys['ArrowUp'] ||
        this.keys['KeyS'] || this.keys['ArrowDown'] ||
        this.keys['KeyA'] || this.keys['ArrowLeft'] ||
        this.keys['KeyD'] || this.keys['ArrowRight']
      );
      // 无键盘方向输入时，自动追击攻击者
      // （即使有移动目标也覆盖，确保反击优先级高于右键移动）
      if (!hasKeyInput) {
        this._rClickMoveTarget = null;   // 取消移动目标，转为追击
        this._rClickAtkTarget  = attacker;
      }
    }
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:40, life:300, maxLife:300, color:'rgba(255,80,80,0.6)', type:'hit' });
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this._respawnTimer = 10000; // 10秒后复活
      // 死亡时立即清除跳跃/蓄力状态，防止复活后状态残留
      this._jumping = false;
      this._jumpTimer = 0;
      this._jumpOffsetY = 0;
      this._chargeTarget = null;
      this._charging = false;
      this.pendingSkill = -1;
      // 显示死亡遮罩
      if (this.game.ui) this.game.ui.showDeathOverlay(10);
      this.game.onPlayerDead();   // 通知game切换摄像机视角至唐僧
    }
  }

  _float(text, color) {
    this.dmgFloats.push({
      x:this.x, y:this.y-30, text, color,
      life:C.DMGFLOAT_DURATION, maxLife:C.DMGFLOAT_DURATION,
      vx:Utils.randFloat(-15,15), vy:Utils.randFloat(-60,-100)
    });
  }

  _tryAutoAtk(dt, enemies) {
    this._atkTimer += dt;
    if (this._atkTimer < this.atkInterval) return;
    let best = null, bestD = this.baseAtkRange + 20;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Utils.dist(this, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return;
    this._atkTimer = 0;
    // 触发攻击动画（朝向目标）
    this._triggerAtkAnim(best.x, best.y);
    // 道教心法：普攻伤害+33%
    const taoismMul = this.xinfa === 'taoism' ? 1.33 : 1.0;
    const dmg = Math.floor(Utils.calcDamage(this.atk, best.armor, this.dmgBonus, best.dmgReduce || 0) * taoismMul);
    best.takeDamage(dmg, this);
    this.game.spawnProjectile(this.x, this.y, best.x, best.y, '#ffdd44', dmg);

    // ── 菩提棒法吸血 + 爆炸：每次普攻吸血25%，50%概率触发爆炸 ──
    if (this._bodhiBuff && this._bodhiBuff.active && dmg > 0) {
      const leech = Math.ceil(dmg * 0.25);
      this.hp = Math.min(this.maxHp, this.hp + leech);
      this._float(`+${leech}`, '#44ffaa');
      // 50% 概率爆炸
      if (Utils.chance(0.5)) {
        const explodeR  = 150;
        const explodeDmg = Math.ceil(this.atk * 0.5);
        const allEnemies = this.game.getAllEnemies();
        for (const ae of allEnemies) {
          if (ae.dead || ae === best) continue;
          if (Utils.dist({x: best.x, y: best.y}, ae) <= explodeR) {
            const ed = Utils.calcDamage(explodeDmg, ae.armor, this.dmgBonus, ae.dmgReduce || 0);
            ae.takeDamage(ed, this);
          }
        }
        // 爆炸特效：橙红大圈 + 白闪 + 火花粒子
        this.effects.push({ x: best.x, y: best.y, r: 0, maxR: explodeR, life: 380, maxLife: 380, color: 'rgba(255,120,20,0.75)', type: 'aoe' });
        this.effects.push({ x: best.x, y: best.y, r: 0, maxR: explodeR * 0.5, life: 180, maxLife: 180, color: 'rgba(255,240,180,0.95)', type: 'aoe' });
        if (!this._atkParticles) this._atkParticles = [];
        for (let i = 0; i < 12; i++) {
          const ang = Utils.randFloat(0, Math.PI * 2);
          const spd = Utils.randFloat(120, 260);
          this._atkParticles.push({
            x: best.x, y: best.y,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            life: Utils.randFloat(200, 380), maxLife: 380,
            len: Utils.randFloat(8, 18),
            color: Utils.chance(0.5) ? '#ff8833' : '#ffee44',
          });
        }
        if (this.game.camera && this.game.camera.shake) this.game.camera.shake(5, 180);
      }
    }

    // ── 溅射：splashBonus > 0 时，对主目标周围150px内其他敌人造成溅射伤害 ──
    if (this.splashBonus > 0) {
      const splashR = 150;
      const splashDmg = Math.floor(dmg * this.splashBonus);
      const allEnemies = this.game.getAllEnemies();
      let splashHit = false;
      for (const se of allEnemies) {
        if (se.dead || se === best) continue;
        if (Utils.dist({ x: best.x, y: best.y }, se) <= splashR) {
          const sd = Utils.calcDamage(splashDmg, se.armor, this.dmgBonus, se.dmgReduce || 0);
          se.takeDamage(sd, this);
          splashHit = true;
        }
      }
      // 溅射特效：蓝白色扩散圈
      if (splashHit) {
        this.effects.push({ x: best.x, y: best.y, r: 0, maxR: splashR, life: 350, maxLife: 350, color: 'rgba(80,200,255,0.55)', type: 'aoe' });
        this.effects.push({ x: best.x, y: best.y, r: 0, maxR: splashR * 0.5, life: 180, maxLife: 180, color: 'rgba(200,240,255,0.8)', type: 'aoe' });
      }
    }

    // ── 命中特效：金白爆炸闪光（sparkle） ──
    this.effects.push({ x:best.x, y:best.y, r:0, maxR:34, life:320, maxLife:320, color:'rgba(255,220,60,0.85)', type:'atk' });
    // 命中冲击白闪（极短亮白圈）
    this.effects.push({ x:best.x, y:best.y, r:0, maxR:18, life:120, maxLife:120, color:'rgba(255,255,220,0.95)', type:'atk' });
    // 棍击放射粒子（存入专用列表）
    const hitDir = Utils.normalize(best.x - this.x, best.y - this.y);
    if (!this._atkParticles) this._atkParticles = [];
    for (let i = 0; i < 7; i++) {
      const ang = Math.atan2(hitDir.y, hitDir.x) + Utils.randFloat(-0.8, 0.8);
      const spd = Utils.randFloat(80, 180);
      this._atkParticles.push({
        x: best.x, y: best.y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: Utils.randFloat(150, 280), maxLife: 280,
        len: Utils.randFloat(6, 14),
        color: Utils.chance(0.4) ? '#fff8aa' : '#ffcc00',
      });
    }
    // knock位移感：敌人受击时附加一个小颜色标记（橙红闪）
    this.effects.push({ x:best.x, y:best.y, r:0, maxR:22, life:180, maxLife:180, color:'rgba(255,80,20,0.6)', type:'knock' });
  }

  getCDMul() { return this.xinfa==='buddha' ? 0.75 : 1.0; }

  // ── 选中技能（进入待释放状态）──
  selectSkill(idx) {
    if (this.dead) return;
    if (!this.skillUnlocked[idx]) {
      if (this.game.ui) this.game.ui.showSkillToast(`技能尚未解锁！(需Lv.${C.SKILL_UNLOCK[idx]})`);
      return;
    }
    if (this.skillCD[idx] > 0) {
      if (this.game.ui) this.game.ui.showSkillToast(`技能冷却中…`);
      return;
    }
    if (this._charging || this._jumping) return; // 蓄力/起跳中不可切换
    if (this.pendingSkill >= 0) return;           // 已有待释放技能，不重复选中
    const sk = C.SKILLS[idx];
    if (this.mp < sk.mpCost) {
      if (this.game.ui) this.game.ui.showSkillToast('MP不足！');
      return;
    }
    // needTarget:false 的技能（菩提棒法、筋斗云）直接触发，无需等待点击
    if (!sk.needTarget) {
      this.useSkill(idx);
      return;
    }
    this.pendingSkill = idx;
    if (this.game.ui) this.game.ui.showSkillToast(`🎯 ${sk.name} ── 点击地面释放`);
  }

  // ── 取消待释放 ──
  cancelSkill() {
    if (this.pendingSkill >= 0) {
      this.pendingSkill = -1;
    }
  }

  // ── 鼠标点击地面，在指定坐标释放待定技能 ──
  releaseSkillAt(wx, wy) {
    const idx = this.pendingSkill;
    if (idx < 0) return;
    this.pendingSkill = -1;
    this.useSkill(idx, wx, wy);
  }

  // ── 释放技能（内部调用）──
  useSkill(idx, wx, wy) {
    if (this.dead) return;
    if (!this.skillUnlocked[idx] || this.skillCD[idx] > 0) return;
    // 起跳期间不允许再次触发任何技能（防止状态冲突卡死）
    if (this._jumping) return;
    const sk = C.SKILLS[idx];
    if (this.mp < sk.mpCost) return;

    // 第5技能（筋斗云·传送）不消耗MP，直接执行，不需要坐标
    if (idx === 4) {
      if (this.skillCD[4] > 0) return;
      this.skillCD[4] = sk.cd * this.getCDMul();
      this._teleportToTangSeng();
      return;
    }

    this.mp -= sk.mpCost;
    this.skillCD[idx] = sk.cd * this.getCDMul();

    // 目标坐标（点击地面位置 or 鼠标位置）
    const tx = wx !== undefined ? wx : (this.game.mouseWorldX || this.x + 1);
    const ty = wy !== undefined ? wy : (this.game.mouseWorldY || this.y);
    this._triggerAtkAnim(tx, ty);

    if (idx === 0) {
      // 当头一棒：先起跳0.5s，落地后释放
      this._startJump(tx, ty);
    } else if (idx === 1) {
      // 菩提棒法：激活 buff，持续 buffDur ms
      const buffDur = C.SKILLS[1].buffDur || 10000;
      this._bodhiBuff.active = true;
      this._bodhiBuff.timer  = buffDur;
      this._recalcStats(); // 立即应用攻速加成
      // 激活特效
      this.effects.push({ x:this.x, y:this.y, r:0, maxR:100, life:500, maxLife:500, color:'rgba(80,255,160,0.7)', type:'aoe' });
      this.effects.push({ x:this.x, y:this.y, r:0, maxR:50,  life:250, maxLife:250, color:'rgba(200,255,220,0.9)', type:'aoe' });
      if (this.game.ui) this.game.ui.showSkillToast('✨ 菩提棒法激活！攻速↑ 吸血激活 5s');
    } else {
      if (idx === 2) {
        this._startDance();
      } else if (idx === 3) {
        // 猴子猴孙：召唤4个分身
        this._summonMonkeyClones();
      }
    }
  }

  // ── 召唤猴子猴孙分身 ──
  _summonMonkeyClones() {
    if (!this.game.monkeyClones) this.game.monkeyClones = [];
    const COUNT = 4;
    // 4个分身分散在玩家四周（均匀分布，半径80）
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + Math.PI / 4;
      const spawnX = this.x + Math.cos(angle) * 85;
      const spawnY = this.y + Math.sin(angle) * 85;
      const clone = new MonkeyClone(this, spawnX, spawnY, i);
      this.game.monkeyClones.push(clone);
    }
    // 玩家位置爆发特效
    this.effects.push({
      x: this.x, y: this.y, r: 0, maxR: 120,
      life: 600, maxLife: 600,
      color: 'rgba(255,215,0,0.75)', type: 'aoe'
    });
    this.effects.push({
      x: this.x, y: this.y, r: 0, maxR: 55,
      life: 320, maxLife: 320,
      color: 'rgba(255,255,180,0.9)', type: 'aoe'
    });
    if (this.game.ui) this.game.ui.showSkillToast('🐒 猴子猴孙！分身4出！');
  }

  // ── 复活 ──
  _respawn() {
    const ts = this.game.tangSeng;
    // 复活位置：唐僧身边
    if (ts && ts.alive) {
      const angle = Math.random() * Math.PI * 2;
      this.x = ts.x + Math.cos(angle) * 80;
      this.y = ts.y + Math.sin(angle) * 80;
    }
    this.dead = false;
    this.hp = this.maxHp;   // 满血复活
    this.mp = this.maxMp;
    this._invincible = 1000; // 复活无敌1秒
    this._respawnTimer = 0;
    this._charging = false;
    this._jumping = false;
    this._jumpTimer = 0;
    this._jumpOffsetY = 0;
    this.pendingSkill = -1;
    // 隐藏死亡遮罩
    if (this.game.ui) this.game.ui.hideDeathOverlay();
    // 复活特效
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:150, life:800, maxLife:800, color:'rgba(255,215,0,0.8)', type:'respawn' });
    if (this.game.ui) this.game.ui.showSkillToast('✨ 复活！保护师傅！');
    // game.over 由唐僧死亡/通关控制，此处无需重置
  }

  // ── 传送到唐僧身边 ──
  _teleportToTangSeng() {
    const ts = this.game.tangSeng;
    if (!ts || !ts.alive) {
      if (this.game.ui) this.game.ui.showSkillToast('师傅已不在人世！');
      return;
    }
    // 在唐僧旁边随机偏移一点
    const angle = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 40;
    this.x = ts.x + Math.cos(angle) * r;
    this.y = ts.y + Math.sin(angle) * r;
    // 金色传送特效
    this.effects.push({ x: this.x, y: this.y, r: 0, maxR: 120, life: 600, maxLife: 600, color: 'rgba(255,215,0,0.7)', type: 'teleport' });
    if (this.game.ui) this.game.ui.showSkillToast('☁️ 筋斗云！一个跟头十万八千里！');
  }

  // ── 开始起跳（当头一棒）──
  _startJump(tx, ty) {
    this._jumping = true;
    this._jumpTimer = 0;
    this._chargeTarget = { tx, ty };
    this._jumpOffsetY = 0;
    // 起跳音效特效（蓄力光圈缩短为起跳时间）
    this.effects.push({ x: this.x, y: this.y, r: 0, maxR: 40, life: 500, maxLife: 500, color: 'rgba(255,220,80,0.5)', type: 'charge' });
  }

  // ── 当头一棒：向目标方向劈出宽60px、长600px竖条区域 ──
  _strikeForward(enemies, atkVal, tx, ty) {
    // 朝向：优先使用蓄力目标方向，否则用facing
    let dir;
    if (tx !== undefined && ty !== undefined) {
      dir = Utils.normalize(tx - this.x, ty - this.y);
    } else {
      dir = Utils.normalize(this.facing.x, this.facing.y);
    }
    const perpX =  dir.y;   // 垂直于朝向
    const perpY = -dir.x;
    const strikeLen = 600;  // 长度600px（前方）
    const strikeHalf = 60;  // 宽度的半宽

    // 对矩形内的敌人判断
    let hit = 0;
    for (const e of enemies) {
      if (e.dead) continue;
      // 转换到局部坐标（以玩家为原点，朝向为前方）
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const localFwd  = dx * dir.x   + dy * dir.y;    // 沿朝向分量
      const localSide = dx * perpX   + dy * perpY;    // 侧方分量
      if (localFwd >= -10 && localFwd <= strikeLen && Math.abs(localSide) <= strikeHalf) {
        const dmg = Utils.calcDamage(atkVal, e.armor, this.dmgBonus, e.dmgReduce||0);
        e.takeDamage(dmg, this);
        hit++;
      }
    }

    // 添加竖条特效
    this._strikeEffect = {
      life: 400, maxLife: 400,
      dir: { ...dir }, perpX, perpY,
      strikeLen, strikeHalf,
      x: this.x, y: this.y,
    };
  }

  _aoe(enemies, r, atkVal, color) {
    for (const e of enemies) {
      if (e.dead) continue;
      if (Utils.dist(this,e) <= r) {
        const dmg = Utils.calcDamage(atkVal, e.armor, this.dmgBonus, e.dmgReduce||0);
        e.takeDamage(dmg, this);
      }
    }
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:r, life:500, maxLife:500, color, type:'aoe' });
  }

  // ── 以指定坐标为中心的AOE（用于如来神掌）──
  _aoeAt(enemies, r, atkVal, color, cx, cy) {
    const ax = cx !== undefined ? cx : this.x;
    const ay = cy !== undefined ? cy : this.y;
    for (const e of enemies) {
      if (e.dead) continue;
      if (Utils.dist({x:ax,y:ay}, e) <= r) {
        const dmg = Utils.calcDamage(atkVal, e.armor, this.dmgBonus, e.dmgReduce||0);
        e.takeDamage(dmg, this);
      }
    }
    this.effects.push({ x:ax, y:ay, r:0, maxR:r, life:600, maxLife:600, color, type:'aoe' });
  }

  _dash(enemies, atkVal, color, tx, ty) {
    const mx = tx !== undefined ? tx : (this.game.mouseWorldX||this.x+1);
    const my = ty !== undefined ? ty : (this.game.mouseWorldY||this.y);
    const dir = Utils.normalize(mx-this.x, my-this.y);
    const ex = Utils.clamp(this.x+dir.x*300, 50, C.WORLD_W-50);
    const ey = Utils.clamp(this.y+dir.y*300, 50, C.WORLD_H-50);
    for (const e of enemies) {
      if (e.dead) continue;
      if (this._ptSegDist(e.x,e.y,this.x,this.y,ex,ey) <= 70) {
        const dmg = Utils.calcDamage(atkVal, e.armor, this.dmgBonus, e.dmgReduce||0);
        e.takeDamage(dmg, this);
      }
    }
    this.x=ex; this.y=ey;
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:150, life:600, maxLife:600, color, type:'dash' });
  }

  // ── 右键移动指令 ──
  setRClickMove(wx, wy) {
    this._rClickMoveTarget = { x: wx, y: wy };
    this._rClickAtkTarget  = null;   // 取消追击目标
    // 生成绿色点击指示器
    this._clickIndicators.push({ x: wx, y: wy, type: 'move', life: 700, maxLife: 700 });
  }

  // ── 右键攻击指令 ──
  setRClickAttack(enemy) {
    this._rClickAtkTarget  = enemy;
    this._rClickMoveTarget = null;   // 取消移动目标
    // 生成红色点击指示器（位置在敌人身上）
    this._clickIndicators.push({ x: enemy.x, y: enemy.y, type: 'atk', life: 700, maxLife: 700, target: enemy });
  }

  // ── 落地震裂 & 尘埃粒子 ──
  _spawnLandingEffect() {
    if (!this._landParticles) this._landParticles = [];
    // 裂纹（放射状线段）
    const CRACK_COUNT = 8;
    for (let i = 0; i < CRACK_COUNT; i++) {
      const ang = (i / CRACK_COUNT) * Math.PI * 2 + Utils.randFloat(-0.2, 0.2);
      const len = Utils.randFloat(30, 70);
      this._landParticles.push({
        type: 'crack',
        x: this.x, y: this.y,
        ang, len,
        life: 600, maxLife: 600,
      });
    }
    // 尘埃粒子
    for (let i = 0; i < 14; i++) {
      const ang = Utils.randFloat(0, Math.PI * 2);
      const spd = Utils.randFloat(60, 160);
      this._landParticles.push({
        type: 'dust',
        x: this.x, y: this.y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - Utils.randFloat(20, 60),
        r: Utils.randFloat(3, 8),
        life: Utils.randFloat(300, 550), maxLife: 550,
      });
    }
  }

  // ── 开始滚花乱舞 ──
  _startDance() {
    this._danceBuff.active    = true;
    this._danceBuff.timer     = this._danceBuff.totalTime;
    this._danceBuff.tickTimer = 0;
    this._danceBuff.spinAngle = 0;
    // 激活光环特效
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:300, life:400, maxLife:400, color:'rgba(80,200,255,0.5)', type:'aoe' });
    this.effects.push({ x:this.x, y:this.y, r:0, maxR:150, life:200, maxLife:200, color:'rgba(255,255,255,0.85)', type:'aoe' });
    if (this.game.ui) this.game.ui.showSkillToast('🌀 滚花乱舞！');
  }

  _ptSegDist(px,py,ax,ay,bx,by) {
    const dx=bx-ax, dy=by-ay, lenSq=dx*dx+dy*dy;
    if (!lenSq) return Utils.dist({x:px,y:py},{x:ax,y:ay});
    const t = Utils.clamp(((px-ax)*dx+(py-ay)*dy)/lenSq, 0, 1);
    return Utils.dist({x:px,y:py},{x:ax+t*dx,y:ay+t*dy});
  }

  update(dt, enemies) {
    // ── 死亡/复活倒计时 ──
    if (this.dead) {
      if (this._respawnTimer > 0) {
        this._respawnTimer -= dt;
        // 更新死亡遮罩倒计时（每帧更新）
        if (this.game.ui) {
          this.game.ui.updateDeathTimer(Math.max(0, this._respawnTimer));
        }
        if (this._respawnTimer <= 0) {
          this._respawn();
        }
      }
      return;
    }
    if (this._invincible > 0) this._invincible -= dt;
    this.mp = Math.min(this.maxMp, this.mp + 0.025*dt);

    // ── 装备回血（每帧按 hpRegen hp/s 恢复）──
    if (this.equipHpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.equipHpRegen * (dt / 1000));
    }

    // ── 菩提棒法 buff 倒计时 ──
    if (this._bodhiBuff && this._bodhiBuff.active) {
      this._bodhiBuff.timer -= dt;
      if (this._bodhiBuff.timer <= 0) {
        this._bodhiBuff.active = false;
        this._bodhiBuff.timer  = 0;
        this._recalcStats(); // 恢复正常攻速
        if (this.game.ui) this.game.ui.showSkillToast('菩提棒法 结束');
      }
    }

    // ── 滚花乱舞计时与伤害 tick ──
    if (this._danceBuff && this._danceBuff.active) {
      this._danceBuff.timer     -= dt;
      this._danceBuff.tickTimer += dt;
      this._danceBuff.spinAngle += dt * 0.015; // 棍影旋转速度

      // 每1000ms造成一次300%伤害
      if (this._danceBuff.tickTimer >= 1000) {
        this._danceBuff.tickTimer -= 1000;
        const danceAtkVal = this.atk * 3.0;
        const danceR      = 300;
        const danceEnemies = this.game.getAllEnemies();
        let hitCount = 0;
        for (const de of danceEnemies) {
          if (de.dead) continue;
          if (Utils.dist(this, de) <= danceR) {
            const dd = Utils.calcDamage(danceAtkVal, de.armor, this.dmgBonus, de.dmgReduce || 0);
            de.takeDamage(dd, this);
            hitCount++;
          }
        }
        // 每次伤害 tick 的冲击特效（多层旋转圈）
        this.effects.push({ x:this.x, y:this.y, r:0, maxR:danceR,       life:500, maxLife:500, color:'rgba(60,180,255,0.55)', type:'aoe' });
        this.effects.push({ x:this.x, y:this.y, r:0, maxR:danceR*0.6,  life:300, maxLife:300, color:'rgba(255,240,80,0.7)',  type:'aoe' });
        this.effects.push({ x:this.x, y:this.y, r:0, maxR:danceR*0.25, life:180, maxLife:180, color:'rgba(255,255,255,0.9)', type:'aoe' });
        if (hitCount > 0 && this.game.camera && this.game.camera.shake) this.game.camera.shake(4, 150);
      }

      // 每帧持续产生旋转棍影粒子
      if (!this._danceParticles) this._danceParticles = [];
      const DANCE_R = 300;
      // 每帧随机从玩家周围 DANCE_R 范围内喷出棍影
      for (let i = 0; i < 3; i++) {
        const ang  = this._danceBuff.spinAngle + (i / 3) * Math.PI * 2 + Utils.randFloat(-0.2, 0.2);
        const dist = Utils.randFloat(40, DANCE_R);
        this._danceParticles.push({
          x: this.x + Math.cos(ang) * dist,
          y: this.y + Math.sin(ang) * dist,
          ang,
          len:   Utils.randFloat(30, 80),
          width: Utils.randFloat(2, 5),
          life:  Utils.randFloat(80, 200),
          maxLife: 200,
          color: ['#44ddff','#ffee44','#ff8833','#ffffff','#88ffcc'][Math.floor(Math.random() * 5)],
          alpha: Utils.randFloat(0.5, 0.9),
        });
      }
      // 外圈光弧粒子（绕轨道散射）
      for (let i = 0; i < 2; i++) {
        const ang2 = Utils.randFloat(0, Math.PI * 2);
        const spd  = Utils.randFloat(60, 160);
        this._danceParticles.push({
          x: this.x + Math.cos(ang2) * Utils.randFloat(0, DANCE_R * 0.8),
          y: this.y + Math.sin(ang2) * Utils.randFloat(0, DANCE_R * 0.8),
          vx: Math.cos(ang2 + Math.PI / 2) * spd,
          vy: Math.sin(ang2 + Math.PI / 2) * spd,
          ang: ang2,
          len: Utils.randFloat(10, 25),
          width: Utils.randFloat(1, 3),
          life: Utils.randFloat(100, 220),
          maxLife: 220,
          color: Utils.chance(0.5) ? '#44ddff' : '#ffe066',
          alpha: 0.8,
          drift: true,
        });
      }

      // 结束判断
      if (this._danceBuff.timer <= 0) {
        this._danceBuff.active = false;
        this._danceBuff.timer  = 0;
        if (this.game.ui) this.game.ui.showSkillToast('滚花乱舞 结束');
      }
    }

    // ── 舞棍粒子更新 ──
    if (this._danceParticles && this._danceParticles.length > 0) {
      this._danceParticles = this._danceParticles.filter(p => {
        p.life -= dt;
        if (p.drift) {
          p.x += p.vx * (dt / 1000);
          p.y += p.vy * (dt / 1000);
          p.vx *= 0.92; p.vy *= 0.92;
        }
        return p.life > 0;
      });
    }

    // ── 移动 + 弱水碰撞（起跳期间锁定移动）──
    let dx=0, dy=0;

    // 键盘有输入时，清除右键指令（键盘优先）
    const keyboardInput = !this._jumping && (
      this.keys['KeyW']||this.keys['ArrowUp']||
      this.keys['KeyS']||this.keys['ArrowDown']||
      this.keys['KeyA']||this.keys['ArrowLeft']||
      this.keys['KeyD']||this.keys['ArrowRight']
    );
    if (keyboardInput) {
      this._rClickMoveTarget = null;
      this._rClickAtkTarget  = null;
    }

    if (!this._jumping) {
      if (this.keys['KeyW']||this.keys['ArrowUp'])    dy=-1;
      if (this.keys['KeyS']||this.keys['ArrowDown'])  dy= 1;
      if (this.keys['KeyA']||this.keys['ArrowLeft'])  dx=-1;
      if (this.keys['KeyD']||this.keys['ArrowRight']) dx= 1;

      // ── 右键追击目标移动 ──
      if (dx===0 && dy===0 && this._rClickAtkTarget) {
        const at = this._rClickAtkTarget;
        if (at.dead) {
          this._rClickAtkTarget = null; // 目标死亡，清除
        } else {
          const ddx = at.x - this.x, ddy = at.y - this.y;
          const dd = Math.sqrt(ddx*ddx + ddy*ddy);
          if (dd > this.baseAtkRange * 0.85) {
            // 还未进入攻击范围，继续追击
            const n2 = Utils.normalize(ddx, ddy);
            dx = n2.x; dy = n2.y;
          }
          // 已在攻击范围内：停步等待自动攻击，但保持朝向
          const nf = Utils.normalize(ddx, ddy);
          if (nf.x !== 0 || nf.y !== 0) this.facing = nf;
        }
      }

      // ── 右键移动目标 ──
      if (dx===0 && dy===0 && this._rClickMoveTarget) {
        const mt = this._rClickMoveTarget;
        const mdx = mt.x - this.x, mdy = mt.y - this.y;
        const md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 18) {
          this._rClickMoveTarget = null; // 到达目标点
        } else {
          const nm = Utils.normalize(mdx, mdy);
          dx = nm.x; dy = nm.y;
        }
      }
    }

    const isMoving = (dx!==0||dy!==0);
    if (isMoving) {
      const n = Utils.normalize(dx,dy);
      this.facing = n;
      const nx = Utils.clamp(this.x+n.x*this.speed*(dt/1000), 20, C.WORLD_W-20);
      const ny = Utils.clamp(this.y+n.y*this.speed*(dt/1000), 20, C.WORLD_H-20);
      // 分轴弱水 + 山脉碰撞：先试X轴
      if (!this._inWeakWater(nx, this.y) && !C.isInMountain(nx, this.y, this.radius)) {
        this.x = nx;
      }
      if (!this._inWeakWater(this.x, ny) && !C.isInMountain(this.x, ny, this.radius)) {
        this.y = ny;
      }
    }

    // ── 自动攻击（攻击时更新朝向）──
    // 若有右键攻击目标，将其强制塞入敌人列表首位（提升优先级）
    let atkEnemies = enemies;
    if (this._rClickAtkTarget && !this._rClickAtkTarget.dead) {
      const t = this._rClickAtkTarget;
      atkEnemies = [t, ...enemies.filter(e => e !== t)];
    }
    this._tryAutoAtk(dt, atkEnemies);

    // ── 技能 CD ──
    for (let i=0;i<5;i++) if (this.skillCD[i]>0) this.skillCD[i]=Math.max(0,this.skillCD[i]-dt);

    // ── 起跳计时（当头一棒）──
    if (this._jumping) {
      this._jumpTimer += dt;
      // 硬上限保护：超过1.5倍跳跃时长仍未落地则强制清除（防卡死兜底）
      // 注意：此处必须用独立 if，不能嵌套在 else 中，否则永远无法触发
      const MAX_JUMP_TIME = this._jumpTotalTime * 1.5;
      if (this._jumpTimer > MAX_JUMP_TIME) {
        // 兜底强制清除：防止 _jumping 永久卡死
        this._jumping = false;
        this._jumpOffsetY = 0;
        this._jumpTimer = 0;
        this._chargeTarget = null;
      } else {
        const t = Math.min(this._jumpTimer / this._jumpTotalTime, 1.0); // 0→1
        // 弧线：sin(t*π) 在 t=0.5 时最高
        this._jumpOffsetY = -this._jumpPeakY * Math.sin(t * Math.PI);

        if (this._jumpTimer >= this._jumpTotalTime) {
          // 落地！
          this._jumping = false;
          this._jumpOffsetY = 0;
          this._jumpTimer = 0;
          // 安全解构：_chargeTarget 若因异常为 null 则退化为玩家当前朝向
          const target = this._chargeTarget;
          this._chargeTarget = null;
          const tx = target ? target.tx : (this.x + this.facing.x * 100);
          const ty = target ? target.ty : (this.y + this.facing.y * 100);
          const enemies = this.game.getAllEnemies();
          this._strikeForward(enemies, this.atk * 2.0, tx, ty);
          // 落地主冲击波（更大更亮）
          this.effects.push({ x: this.x, y: this.y, r: 0, maxR: 150, life: 500, maxLife: 500, color: 'rgba(255,210,40,0.85)', type: 'aoe' });
          // 白色内闪
          this.effects.push({ x: this.x, y: this.y, r: 0, maxR: 60, life: 200, maxLife: 200, color: 'rgba(255,255,200,0.95)', type: 'aoe' });
          // 落地裂纹 & 尘埃粒子
          this._spawnLandingEffect();
          // 更强震屏
          if (this.game.camera && this.game.camera.shake) this.game.camera.shake(14, 350);
        }
      }
    }

    // ── 动画状态机 ──
    this._idleBob  += dt * 0.003;   // 待机呼吸频率
    if (this._animState === 'attack') {
      // 攻击动画优先，不被打断
      this._atkAnimTimer += dt;
      this._atkAnim = Utils.clamp(this._atkAnimTimer / this._atkAnimDur, 0, 1);
      if (this._atkAnimTimer >= this._atkAnimDur) {
        this._animState = isMoving ? 'walk' : 'idle';
        this._atkAnimTimer = 0;
        this._atkAnim = 0;
      }
    } else if (isMoving) {
      this._animState = 'walk';
      this._walkCycle += dt * 0.008; // 走路摆臂频率
    } else {
      this._animState = 'idle';
    }

    // ── 当头一棒特效计时 ──
    if (this._strikeEffect) {
      this._strikeEffect.life -= dt;
      if (this._strikeEffect.life <= 0) this._strikeEffect = null;
    }

    // ── 特效 & 浮字 ──
    this.effects = this.effects.filter(e => { e.life-=dt; e.r=e.maxR*(1-e.life/e.maxLife); return e.life>0; });
    this.dmgFloats = this.dmgFloats.filter(f => {
      f.life-=dt; f.x+=f.vx*(dt/1000); f.y+=f.vy*(dt/1000); f.vy+=80*(dt/1000); return f.life>0;
    });
    // ── 攻击放射粒子更新 ──
    if (this._atkParticles) {
      this._atkParticles = this._atkParticles.filter(p => {
        p.life -= dt;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.vx *= 0.88; p.vy *= 0.88;
        return p.life > 0;
      });
    }
    // ── 点击指示器更新 ──
    this._clickIndicators = this._clickIndicators.filter(ind => {
      ind.life -= dt;
      return ind.life > 0;
    });

    // ── 落地粒子更新 ──
    if (this._landParticles) {
      this._landParticles = this._landParticles.filter(p => {
        p.life -= dt;
        if (p.type === 'dust') {
          p.x += p.vx * (dt / 1000);
          p.y += p.vy * (dt / 1000);
          p.vy += 120 * (dt / 1000); // 重力
          p.vx *= 0.94;
        }
        return p.life > 0;
      });
    }
    // ── 残影帧更新（起跳时） ──
    if (this._ghostFrames) {
      this._ghostFrames = this._ghostFrames.filter(g => { g.life -= dt; return g.life > 0; });
    }
    if (this._jumping && this._ghostTimer !== undefined) {
      this._ghostTimer -= dt;
      if (this._ghostTimer <= 0) {
        this._ghostTimer = 55;
        if (!this._ghostFrames) this._ghostFrames = [];
        this._ghostFrames.push({ x: this.x, y: this.y, offsetY: this._jumpOffsetY, life: 220, maxLife: 220 });
      }
    } else {
      this._ghostTimer = 0;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    // 不做 inView 检查：相机始终跟随玩家，玩家永远在视口中心，该检查只会在边界异常时误杀渲染
    const {sx, sy: syBase} = camera.worldToScreen(this.x, this.y);
    // 起跳时人物跟随弧线上移（_jumpOffsetY为负=向上）
    const sy = syBase + this._jumpOffsetY;

    // ── 点击指示器绘制（地面绿圈 / 敌人红圈） ──
    for (const ind of this._clickIndicators) {
      const a = ind.life / ind.maxLife;
      // 跟随移动目标（atk 类型跟随敌人坐标）
      const ix = (ind.type === 'atk' && ind.target && !ind.target.dead) ? ind.target.x : ind.x;
      const iy = (ind.type === 'atk' && ind.target && !ind.target.dead) ? ind.target.y : ind.y;
      const { sx: isx, sy: isy } = camera.worldToScreen(ix, iy);
      const t = Date.now() / 1000;
      // 外扩动画：圆圈从大到小收缩进来
      const expandR = (ind.type === 'atk' ? 28 : 24) * (0.5 + a * 0.5);
      const color   = ind.type === 'atk' ? '#ff4444' : '#44ff88';
      const glow    = ind.type === 'atk' ? 'rgba(255,60,60,' : 'rgba(60,255,120,';
      ctx.save();
      // 外圈（收缩动画）
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(isx, isy, expandR, 0, Math.PI * 2); ctx.stroke();
      // 内圈（固定小圈，脉冲缩放）
      const innerR = (ind.type === 'atk' ? 10 : 8) * (0.85 + Math.sin(t * 8) * 0.15);
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(isx, isy, innerR, 0, Math.PI * 2); ctx.stroke();
      // 十字准星（4条短线）
      ctx.globalAlpha = a * 0.75;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      const cl = 7, cg = 4;
      ctx.beginPath();
      ctx.moveTo(isx - cl - cg, isy); ctx.lineTo(isx - cg, isy);
      ctx.moveTo(isx + cg, isy);      ctx.lineTo(isx + cl + cg, isy);
      ctx.moveTo(isx, isy - cl - cg); ctx.lineTo(isx, isy - cg);
      ctx.moveTo(isx, isy + cg);      ctx.lineTo(isx, isy + cl + cg);
      ctx.stroke();
      // 光晕填充
      ctx.globalAlpha = a * 0.12;
      ctx.fillStyle = glow + a * 0.4 + ')';
      ctx.beginPath(); ctx.arc(isx, isy, expandR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── 残影绘制（起跳时，在主体之前） ──
    if (this._ghostFrames && this._ghostFrames.length > 0) {
      for (const g of this._ghostFrames) {
        const ga = (g.life / g.maxLife) * 0.38;
        const { sx: gsx, sy: gsyBase } = camera.worldToScreen(g.x, g.y);
        const gsy = gsyBase + g.offsetY;
        ctx.save();
        ctx.globalAlpha = ga;
        // 用金黄色剪影代表残影
        ctx.fillStyle = '#ffe040';
        ctx.beginPath(); ctx.arc(gsx, gsy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(gsx, gsy + 12, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    // AOE光圈特效
    for (const e of this.effects) {
      if (e.type==='aoe'||e.type==='dash') {
        const a = e.life/e.maxLife;
        const {sx:ex,sy:ey}=camera.worldToScreen(e.x,e.y);
        ctx.save();
        ctx.globalAlpha = a*0.45; ctx.strokeStyle=e.color; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(ex,ey,e.r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha = a*0.12; ctx.fillStyle=e.color; ctx.fill();
        ctx.restore();
      }
    }
    // 普通特效圈（atk / hit / knock）
    for (const e of this.effects) {
      if (e.type==='atk'||e.type==='hit'||e.type==='knock') {
        const a = e.life/e.maxLife;
        const {sx:ex,sy:ey}=camera.worldToScreen(e.x,e.y);
        ctx.save(); ctx.globalAlpha=a*0.8;
        ctx.beginPath(); ctx.arc(ex,ey,e.r,0,Math.PI*2);
        ctx.fillStyle=e.color; ctx.fill(); ctx.restore();
      }
    }
    // ── 攻击放射粒子绘制 ──
    if (this._atkParticles && this._atkParticles.length > 0) {
      ctx.save();
      for (const p of this._atkParticles) {
        const pa = p.life / p.maxLife;
        const { sx: px, sy: py } = camera.worldToScreen(p.x, p.y);
        const ang = Math.atan2(p.vy, p.vx);
        ctx.globalAlpha = pa * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - Math.cos(ang) * p.len * pa, py - Math.sin(ang) * p.len * pa);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── 滚花乱舞棍影粒子绘制 ──
    if (this._danceParticles && this._danceParticles.length > 0) {
      ctx.save();
      for (const p of this._danceParticles) {
        const pa = p.life / p.maxLife;
        const { sx: dpx, sy: dpy } = camera.worldToScreen(p.x, p.y);
        ctx.globalAlpha = pa * p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = (p.width || 2) * (0.4 + pa * 0.6);
        ctx.lineCap     = 'round';
        // 棍影：以粒子位置为中心，沿 ang 方向画线段
        const halfLen = (p.len || 30) * pa * 0.5;
        const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6 * pa;
        ctx.beginPath();
        ctx.moveTo(dpx - ca * halfLen, dpy - sa * halfLen);
        ctx.lineTo(dpx + ca * halfLen, dpy + sa * halfLen);
        ctx.stroke();
        // 亮点核心
        ctx.globalAlpha = pa * 0.7;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(dpx, dpy, (p.width || 2) * pa, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── 舞棍范围指示圈（激活期间持续显示）──
    if (this._danceBuff && this._danceBuff.active) {
      const { sx: dsx, sy: dsy } = camera.worldToScreen(this.x, this.y);
      const progress = 1 - this._danceBuff.timer / this._danceBuff.totalTime;
      const pulseA   = 0.15 + 0.1 * Math.sin(Date.now() * 0.008);
      ctx.save();
      // 外圈虚线旋转边框
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#44ddff';
      ctx.lineWidth   = 2;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -(Date.now() / 60) % 20;
      ctx.beginPath(); ctx.arc(dsx, dsy, 300, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // 内填充光晕
      ctx.globalAlpha = pulseA;
      const grad = ctx.createRadialGradient(dsx, dsy, 0, dsx, dsy, 300);
      grad.addColorStop(0,   'rgba(60,220,255,0.3)');
      grad.addColorStop(0.6, 'rgba(60,180,255,0.1)');
      grad.addColorStop(1,   'rgba(60,180,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(dsx, dsy, 300, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // ── 落地裂纹 & 尘埃粒子绘制 ──
    if (this._landParticles && this._landParticles.length > 0) {
      ctx.save();
      for (const p of this._landParticles) {
        const pa = p.life / p.maxLife;
        if (p.type === 'crack') {
          const { sx: cx, sy: cy } = camera.worldToScreen(p.x, p.y);
          ctx.globalAlpha = pa * 0.8;
          ctx.strokeStyle = '#cc9922';
          ctx.lineWidth = 1.8 * pa;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(p.ang) * p.len * (1 - pa * 0.3), cy + Math.sin(p.ang) * p.len * (1 - pa * 0.3));
          ctx.stroke();
          // 裂纹内侧亮线
          ctx.globalAlpha = pa * 0.5;
          ctx.strokeStyle = '#ffee88';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(p.ang) * p.len * 0.5 * (1 - pa * 0.3), cy + Math.sin(p.ang) * p.len * 0.5 * (1 - pa * 0.3));
          ctx.stroke();
        } else if (p.type === 'dust') {
          const { sx: dx2, sy: dy2 } = camera.worldToScreen(p.x, p.y);
          ctx.globalAlpha = pa * 0.55;
          ctx.fillStyle = '#d4b483';
          ctx.beginPath(); ctx.arc(dx2, dy2, p.r * (0.5 + pa * 0.5), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    // 阴影（起跳时留在地面并随高度缩小）
    ctx.save();
    const jumpRatio = this._jumpOffsetY === 0 ? 1 : (1 - Math.abs(this._jumpOffsetY) / this._jumpPeakY);
    const shadowScaleX = 20 * (0.4 + jumpRatio * 0.6);
    const shadowScaleY = 7  * (0.4 + jumpRatio * 0.6);
    const shadowAlpha  = 0.25 * (0.3 + jumpRatio * 0.7);
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, syBase + 18, shadowScaleX, shadowScaleY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── 心法脚底光环（道教太极 / 佛门万字） ──
    if (this.xinfa) {
      const now = Date.now() / 1000;
      const R = 50; // 半径50（屏幕px，视觉上约100px直径）
      ctx.save();
      ctx.translate(sx, syBase + 10); // 在脚底位置

      if (this.xinfa === 'taoism') {
        // ── 道教：旋转太极符 ──
        const rot = now * 0.6; // 慢速旋转
        ctx.rotate(rot);
        const pulse = 0.55 + 0.15 * Math.sin(now * 2.5);
        ctx.globalAlpha = pulse;

        // 外圈发光
        ctx.shadowColor = '#44ddaa';
        ctx.shadowBlur  = 16;

        // 太极外圆
        ctx.strokeStyle = '#44ddaa';
        ctx.lineWidth   = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

        // 太极底色（左黑右白）
        ctx.globalAlpha = pulse * 0.35;
        ctx.fillStyle   = '#112211';
        ctx.beginPath();
        ctx.arc(0, 0, R, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.fillStyle   = '#aaffcc';
        ctx.beginPath();
        ctx.arc(0, 0, R, Math.PI * 1.5, Math.PI * 0.5);
        ctx.fill();
        ctx.globalAlpha = pulse;

        // S形分界线（用两个半圆模拟）
        ctx.strokeStyle = '#44ffaa';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(0, -R/2, R/2, Math.PI * 1.5, Math.PI * 0.5); // 上半小圆（白侧）
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,  R/2, R/2, Math.PI * 0.5, Math.PI * 1.5); // 下半小圆（黑侧）
        ctx.stroke();

        // 两个小圆心
        ctx.fillStyle = '#aaffcc';
        ctx.beginPath(); ctx.arc(0, -R/2, R/6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#112211';
        ctx.beginPath(); ctx.arc(0,  R/2, R/6, 0, Math.PI*2); ctx.fill();

        // 外圈刻度（8个短线）
        ctx.strokeStyle = '#44ddaa';
        ctx.lineWidth   = 1.2;
        ctx.globalAlpha = pulse * 0.7;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6));
          ctx.lineTo(Math.cos(a) * (R + 4), Math.sin(a) * (R + 4));
          ctx.stroke();
        }

      } else if (this.xinfa === 'buddha') {
        // ── 佛门：旋转万字符（卍）──
        const rot = now * 0.4; // 更慢的旋转
        ctx.rotate(rot);
        const pulse = 0.5 + 0.15 * Math.sin(now * 2.0);
        ctx.globalAlpha = pulse;

        // 外圈发光
        ctx.shadowColor = '#ffaa22';
        ctx.shadowBlur  = 18;

        // 外圆
        ctx.strokeStyle = '#ffcc55';
        ctx.lineWidth   = 1.8;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

        // 底层晕光
        ctx.globalAlpha = pulse * 0.18;
        const grd = ctx.createRadialGradient(0, 0, R*0.2, 0, 0, R);
        grd.addColorStop(0, '#ffdd88');
        grd.addColorStop(1, 'rgba(255,180,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = pulse;

        // 卍字符（4条臂，每条臂=中心短横+末端折钩）
        const arm = R * 0.48; // 臂长
        const thick = R * 0.12; // 线宽
        ctx.strokeStyle = '#ffcc55';
        ctx.lineWidth   = thick;
        ctx.lineCap     = 'square';

        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate(i * Math.PI / 2);
          // 中心横臂（向右）
          ctx.beginPath();
          ctx.moveTo(-arm * 0.1, 0);
          ctx.lineTo( arm, 0);
          ctx.stroke();
          // 末端折钩（向下）
          ctx.beginPath();
          ctx.moveTo(arm, 0);
          ctx.lineTo(arm, arm * 0.7);
          ctx.stroke();
          ctx.restore();
        }

        // 中心小方块
        ctx.fillStyle = '#ffcc55';
        ctx.fillRect(-thick * 0.7, -thick * 0.7, thick * 1.4, thick * 1.4);

        // 外圈光点（8粒）
        ctx.lineWidth = 0;
        ctx.globalAlpha = pulse * 0.8;
        for (let i = 0; i < 8; i++) {
          const a   = (i / 8) * Math.PI * 2;
          const pr  = R + 6 + 3 * Math.sin(now * 3 + i);
          ctx.fillStyle = i % 2 === 0 ? '#ffdd88' : '#ff9922';
          ctx.beginPath();
          ctx.arc(Math.cos(a)*pr, Math.sin(a)*pr, 2.5, 0, Math.PI*2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // ── 当头一棒竖条特效 ──
    if (this._strikeEffect) {
      const se = this._strikeEffect;
      const alpha = se.life / se.maxLife;
      const progress = 1 - alpha; // 0=刚劈出, 1=消失
      // 特效位置跟随当前玩家坐标（而非固定到特效录制位置）
      const ex = sx, ey = sy;
      const { dir, perpX, perpY, strikeLen, strikeHalf } = se;

      ctx.save();
      // 矩形顶点（世界→屏幕已在camera处理，这里直接在屏幕坐标）
      const p0x = ex - perpX * strikeHalf;
      const p0y = ey - perpY * strikeHalf;
      const p1x = ex + perpX * strikeHalf;
      const p1y = ey + perpY * strikeHalf;
      const p2x = p1x + dir.x * strikeLen;
      const p2y = p1y + dir.y * strikeLen;
      const p3x = p0x + dir.x * strikeLen;
      const p3y = p0y + dir.y * strikeLen;

      // 创建沿劈击方向的渐变
      const sgrd = ctx.createLinearGradient(ex, ey, ex + dir.x*strikeLen, ey + dir.y*strikeLen);
      sgrd.addColorStop(0,   `rgba(255,240,80,${alpha*0.9})`);
      sgrd.addColorStop(0.3, `rgba(255,180,0,${alpha*0.8})`);
      sgrd.addColorStop(0.7, `rgba(255,100,0,${alpha*0.5})`);
      sgrd.addColorStop(1,   `rgba(255,50,0,0)`);

      // 填充矩形
      ctx.beginPath();
      ctx.moveTo(p0x, p0y); ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y); ctx.lineTo(p3x, p3y);
      ctx.closePath();
      ctx.fillStyle = sgrd;
      ctx.fill();

      // 边缘描边（亮金色）
      ctx.strokeStyle = `rgba(255,240,100,${alpha*0.8})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 中线（棍影）
      ctx.strokeStyle = `rgba(255,255,200,${alpha*0.9})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + dir.x*strikeLen, ey + dir.y*strikeLen);
      ctx.stroke();

      // 劈击尾端冲击波（横线）
      const impactAlpha = Math.max(0, 1 - progress*3) * alpha;
      if (impactAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = impactAlpha;
        ctx.strokeStyle = '#fff8aa';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        const tipX = ex + dir.x*strikeLen;
        const tipY = ey + dir.y*strikeLen;
        ctx.beginPath();
        ctx.moveTo(tipX - perpX*strikeHalf*1.4, tipY - perpY*strikeHalf*1.4);
        ctx.lineTo(tipX + perpX*strikeHalf*1.4, tipY + perpY*strikeHalf*1.4);
        ctx.stroke();
        ctx.restore();
      }

      // 技能名浮字（仅出现初期）
      if (alpha > 0.7) {
        ctx.save();
        ctx.globalAlpha = (alpha-0.7)/0.3;
        ctx.font = 'bold 18px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText('当头一棒！', ex + dir.x*60, ey + dir.y*60 - 18);
        ctx.fillStyle = '#ffe040';
        ctx.fillText('当头一棒！', ex + dir.x*60, ey + dir.y*60 - 18);
        ctx.restore();
      }

      ctx.restore();
    }

    this._drawSprite(ctx, sx, sy);
    this._drawHpBar(ctx, sx, sy);

    // 伤害浮字
    for (const f of this.dmgFloats) {
      const {sx:fx,sy:fy}=camera.worldToScreen(f.x,f.y);
      ctx.save(); ctx.globalAlpha=f.life/f.maxLife;
      ctx.font=`bold ${f.text==='MISS'?14:18}px Microsoft YaHei`;
      ctx.textAlign='center';
      ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.strokeText(f.text,fx,fy);
      ctx.fillStyle=f.color; ctx.fillText(f.text,fx,fy);
      ctx.restore();
    }
  }

  // 触发攻击动画（自动攻击命中时调用）
  _triggerAtkAnim(targetX, targetY) {
    if (this._animState !== 'attack') {
      // 更新朝向到目标方向
      const n = Utils.normalize(targetX - this.x, targetY - this.y);
      if (n.x !== 0 || n.y !== 0) this.facing = n;
      this._animState = 'attack';
      this._atkAnimTimer = 0;
      this._atkAnim = 0;
    }
  }

  _drawSprite(ctx, sx, sy) {
    ctx.save();

    // 受击闪烁
    const flash = this._invincible>0 && Math.floor(this._invincible/80)%2===0;
    if (flash) ctx.globalAlpha = 0.35;

    const fx = this.facing.x, fy = this.facing.y;
    const facingAngle = Math.atan2(fy, fx);
    const facingUp = fy < -0.4;

    // 偏移参数
    const eyeOffX = fx * 5;
    const eyeOffY = fy * 3.5;
    const bobY = this._animState==='idle' ? Math.sin(this._idleBob)*2 : 0;
    const walkPhase = Math.sin(this._walkCycle);

    // ── 起跳特效圆圈（在人物主体之前绘制，位置在地面处）──
    if (this._jumping) {
      const jt = this._jumpTimer / this._jumpTotalTime; // 0→1
      // 起跳瞬间（jt<0.25）：从地面扩散的气流圈
      if (jt < 0.25) {
        const a = (1 - jt / 0.25) * 0.6;
        const r = jt / 0.25 * 50;
        // 防护：r=0 时 ctx.ellipse 在部分浏览器会抛 DOMException 导致主循环崩溃
        if (r > 0.5) {
          ctx.save();
          ctx.globalAlpha = a;
          ctx.strokeStyle = '#ffe060';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(sx, syBase + 18, r, Math.max(r * 0.35, 0.5), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      // 最高点（jt 0.4~0.6）：光芒闪烁
      if (jt > 0.35 && jt < 0.65) {
        const peakA = Math.sin((jt - 0.35) / 0.3 * Math.PI) * 0.5;
        ctx.save();
        ctx.globalAlpha = peakA;
        const gr = ctx.createRadialGradient(sx, sy, 5, sx, sy, 35);
        gr.addColorStop(0, 'rgba(255,255,180,1)');
        gr.addColorStop(1, 'rgba(255,200,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(sx, sy, 35, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // 下落阶段（jt>0.75）：落地前加速气流（向下的小线条）
      if (jt > 0.75) {
        const fallA = (jt - 0.75) / 0.25 * 0.55;
        ctx.save();
        ctx.globalAlpha = fallA;
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          const lx = sx + i * 10;
          ctx.beginPath();
          ctx.moveTo(lx, sy + 28);
          ctx.lineTo(lx, sy + 28 + 14 + Math.abs(i) * 4);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── 攻击动画参数 ──
    let staffAngle  = facingAngle;
    let staffExtend = 1.0;
    let staffTrail  = false;
    if (this._animState==='attack') {
      const t = this._atkAnim;
      if (t < 0.35) {
        const p = t/0.35;
        staffAngle  = facingAngle + Utils.lerp(0, -Math.PI*0.7, p);
        staffExtend = Utils.lerp(1, 0.25, p);
      } else if (t < 0.65) {
        const p = (t-0.35)/0.30;
        staffAngle  = facingAngle + Utils.lerp(-Math.PI*0.7, Math.PI*0.35, p);
        staffExtend = Utils.lerp(0.25, 1.5, p);
        staffTrail  = p > 0.2;
      } else {
        const p = (t-0.65)/0.35;
        staffAngle  = facingAngle + Utils.lerp(Math.PI*0.35, 0, p);
        staffExtend = Utils.lerp(1.5, 1.0, p);
      }
    }

    // ── 棍子坐标（右侧持棍）──
    const handR = 12;
    const perpX =  fy * handR;
    const perpY = -fx * handR;
    const handX = sx + perpX;
    const handY = sy + perpY + bobY - 2;
    const staffLen = 60 * staffExtend;
    const sCos = Math.cos(staffAngle), sSin = Math.sin(staffAngle);
    const staffTailX = handX - sCos * staffLen * 0.3;
    const staffTailY = handY - sSin * staffLen * 0.3;
    const staffHeadX = handX + sCos * staffLen * 0.7;
    const staffHeadY = handY + sSin * staffLen * 0.7;

    // ── 挥舞拖尾 ──
    if (staffTrail) {
      const ta = (this._atkAnim-0.35)/0.30;
      ctx.save();
      ctx.globalAlpha = ta * 0.65;
      const prevAng = staffAngle - Math.PI*0.4;
      const trailX = handX + Math.cos(prevAng)*staffLen*0.5;
      const trailY = handY + Math.sin(prevAng)*staffLen*0.5;
      const tg = ctx.createLinearGradient(trailX, trailY, staffHeadX, staffHeadY);
      tg.addColorStop(0, 'rgba(255,220,50,0)');
      tg.addColorStop(1, 'rgba(255,180,0,0.9)');
      ctx.strokeStyle = tg; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(trailX, trailY);
      ctx.quadraticCurveTo(handX, handY, staffHeadX, staffHeadY); ctx.stroke();
      ctx.restore();
    }

    // ══════════════════════════════════════════
    //   Q版人物绘制（从脚到头，从后到前）
    // ══════════════════════════════════════════

    // ── Q版比例：腿更短更粗 ──
    const legW=7, legH=8;
    const bootW=9, bootH=5;
    const legY = sy + 19 + bobY;
    if (this._animState==='walk') {
      const sw = walkPhase * 7;
      // 左腿（虎皮短裤色）
      const lx = sx - 7 + fx*(-sw*0.5);
      const ly = legY + fy*sw;
      ctx.fillStyle = '#c87820';
      ctx.beginPath(); ctx.ellipse(lx, ly, legW*0.8, legH*0.75, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5c2d00';
      ctx.beginPath(); ctx.ellipse(lx + fx*2, ly+legH*0.5+fy, bootW*0.85, bootH*0.8, 0.2, 0, Math.PI*2); ctx.fill();
      // 靴子金边
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(lx + fx*2, ly+legH*0.5+fy, bootW*0.85, bootH*0.8, 0.2, 0, Math.PI*2); ctx.stroke();
      // 右腿（反相位）
      const rx = sx + 7 + fx*(sw*0.5);
      const ry = legY - fy*sw;
      ctx.fillStyle = '#c87820';
      ctx.beginPath(); ctx.ellipse(rx, ry, legW*0.8, legH*0.75, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5c2d00';
      ctx.beginPath(); ctx.ellipse(rx + fx*2, ry+legH*0.5-fy, bootW*0.85, bootH*0.8, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(rx + fx*2, ry+legH*0.5-fy, bootW*0.85, bootH*0.8, -0.2, 0, Math.PI*2); ctx.stroke();
    } else {
      ctx.fillStyle = '#c87820';
      ctx.beginPath(); ctx.ellipse(sx-7, legY, legW*0.8, legH*0.8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+7, legY, legW*0.8, legH*0.8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5c2d00';
      ctx.beginPath(); ctx.ellipse(sx-7, legY+legH*0.55, bootW*0.9, bootH*0.8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx+7, legY+legH*0.55, bootW*0.9, bootH*0.8, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(sx-7, legY+legH*0.55, bootW*0.9, bootH*0.8, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(sx+7, legY+legH*0.55, bootW*0.9, bootH*0.8, 0, 0, Math.PI*2); ctx.stroke();
    }

    // ── 身体（橙红战袍 + 虎皮短裙腰带）──
    const bodyY = sy + 3 + bobY;
    const bodyW2 = 14, bodyH2 = 15;
    // 战袍底色（橙红，比之前更鲜亮）
    ctx.fillStyle = '#d9530a';
    ctx.beginPath(); ctx.ellipse(sx, bodyY, bodyW2, bodyH2, 0, 0, Math.PI*2); ctx.fill();
    // 战袍高光
    const bodyGrd = ctx.createLinearGradient(sx, bodyY-bodyH2, sx, bodyY+bodyH2);
    bodyGrd.addColorStop(0, 'rgba(255,160,60,0.75)');
    bodyGrd.addColorStop(0.4, 'rgba(240,100,20,0.3)');
    bodyGrd.addColorStop(1, 'rgba(100,30,0,0.55)');
    ctx.fillStyle = bodyGrd;
    ctx.beginPath(); ctx.ellipse(sx, bodyY, bodyW2, bodyH2, 0, 0, Math.PI*2); ctx.fill();
    // 战袍轮廓
    ctx.strokeStyle = '#7a2200'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(sx, bodyY, bodyW2, bodyH2, 0, 0, Math.PI*2); ctx.stroke();
    // 领口（金色V领）
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx-5, bodyY-bodyH2+3);
    ctx.lineTo(sx, bodyY-bodyH2+9);
    ctx.lineTo(sx+5, bodyY-bodyH2+3);
    ctx.stroke();
    // ── 虎皮腰带（黄底+黑斑纹）──
    ctx.fillStyle = '#d4a017';
    ctx.beginPath(); ctx.ellipse(sx, bodyY+5, bodyW2*0.88, 4, 0, 0, Math.PI*2); ctx.fill();
    // 虎斑纹（3条小黑弧）
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
    for (let ti = -1; ti <= 1; ti++) {
      ctx.beginPath();
      ctx.arc(sx + ti * 6, bodyY + 5, 2.5, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(sx, bodyY+5, bodyW2*0.88, 4, 0, 0, Math.PI*2); ctx.stroke();
    // 腰带扣（金方块）
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(sx-4, bodyY+2, 8, 6);
    ctx.strokeStyle = '#cc8800'; ctx.lineWidth = 1;
    ctx.strokeRect(sx-4, bodyY+2, 8, 6);

    // ── 手臂（走路时摆动）──
    const armSwing = this._animState==='walk' ? walkPhase * 5 : 0;
    // 左臂
    ctx.strokeStyle = '#c87820'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx-bodyW2*0.85, bodyY-3);
    ctx.lineTo(sx-bodyW2*0.85-3+armSwing, bodyY+8);
    ctx.stroke();
    // 右臂
    ctx.beginPath();
    ctx.moveTo(sx+bodyW2*0.85, bodyY-3);
    ctx.lineTo(sx+bodyW2*0.85+3-armSwing, bodyY+8);
    ctx.stroke();
    // ── 腕环（金色）──
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(sx-bodyW2*0.85-1+armSwing*0.5, bodyY+7, 4, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx+bodyW2*0.85+1-armSwing*0.5, bodyY+7, 4, 0, Math.PI*2); ctx.stroke();

    // ── 头部（稍大的Q版头，更有猴子感）──
    const headR  = 20;  // 比原来18略大，Q版大头
    const headX  = sx + fx*3;
    const headY2 = sy - bodyH2 + 5 + fy*2 + bobY;

    // ── 猴子后脑毛（蓬松黑毛，在脸皮之前绘制）──
    ctx.fillStyle = '#1c1008';
    // 后脑大毛团
    ctx.beginPath();
    ctx.arc(headX - fx*4, headY2 - fy*2, headR*0.95, Math.PI*0.8, Math.PI*2.2);
    ctx.fill();
    // 侧面蓬毛（左右各一块）
    ctx.beginPath(); ctx.ellipse(headX - fx*headR*0.65 - fy*headR*0.5, headY2 + fx*headR*0.2, 6, 9, facingAngle-0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headX - fx*headR*0.65 + fy*headR*0.5, headY2 - fx*headR*0.2, 6, 9, facingAngle+0.5, 0, Math.PI*2); ctx.fill();

    // ── 猴耳朵（在脸皮之前绘制，耳根用肤色覆盖）──
    // 左耳
    const earLX = headX - fx*headR*0.3 - fy*headR*0.85;
    const earLY = headY2 + fx*headR*0.5 - fy*headR*0.1;
    ctx.fillStyle = '#2a1a08'; // 耳外（深棕）
    ctx.beginPath(); ctx.ellipse(earLX, earLY, 6, 8, facingAngle - 0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8905a'; // 耳内（浅粉棕）
    ctx.beginPath(); ctx.ellipse(earLX, earLY, 3.5, 5, facingAngle - 0.3, 0, Math.PI*2); ctx.fill();
    // 右耳
    const earRX = headX - fx*headR*0.3 + fy*headR*0.85;
    const earRY = headY2 - fx*headR*0.5 - fy*headR*0.1;
    ctx.fillStyle = '#2a1a08';
    ctx.beginPath(); ctx.ellipse(earRX, earRY, 6, 8, facingAngle + 0.3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8905a';
    ctx.beginPath(); ctx.ellipse(earRX, earRY, 3.5, 5, facingAngle + 0.3, 0, Math.PI*2); ctx.fill();

    // ── 脸皮（菱形/尖脸：上圆下窄，用贝塞尔曲线代替正圆）──
    ctx.save();
    const skinGrd = ctx.createRadialGradient(headX-2, headY2-5, 2, headX, headY2, headR);
    skinGrd.addColorStop(0, '#ffe0a8');
    skinGrd.addColorStop(0.55, '#d4925a');  // 金棕肤色（孙悟空特征）
    skinGrd.addColorStop(1, '#a85820');
    ctx.fillStyle = skinGrd;
    // 尖脸路径：上宽下窄的菱形脸
    ctx.beginPath();
    ctx.moveTo(headX, headY2 - headR);                              // 顶部
    ctx.bezierCurveTo(headX + headR*0.95, headY2 - headR*0.3,      // 右上控制
                      headX + headR*0.75, headY2 + headR*0.6,       // 右下控制
                      headX, headY2 + headR*0.82);                  // 下颏尖
    ctx.bezierCurveTo(headX - headR*0.75, headY2 + headR*0.6,
                      headX - headR*0.95, headY2 - headR*0.3,
                      headX, headY2 - headR);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a4010'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.restore();

    // ── 面部细节（仅正面时绘制）──
    if (!facingUp) {
      const eX1 = headX - 6 + eyeOffX;
      const eX2 = headX + 6 + eyeOffX;
      const eY  = headY2 - 1 + eyeOffY;

      // ── 眉毛（浓眉，攻击时皱眉）──
      ctx.strokeStyle = '#2a1a00'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      if (this._animState === 'attack') {
        // 皱眉V形（内侧下压）
        ctx.beginPath(); ctx.moveTo(eX1-4, eY-5); ctx.lineTo(eX1+2, eY-3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(eX2+4, eY-5); ctx.lineTo(eX2-2, eY-3); ctx.stroke();
      } else {
        // 平眉微挑
        ctx.beginPath(); ctx.moveTo(eX1-4, eY-5); ctx.lineTo(eX1+3, eY-4.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(eX2-3, eY-4.5); ctx.lineTo(eX2+4, eY-5); ctx.stroke();
      }

      // 眼白（杏仁形，更有神）
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(eX1, eY, 4.5, 3.5, -0.15, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(eX2, eY, 4.5, 3.5, 0.15, 0, Math.PI*2); ctx.fill();

      // 瞳孔（深棕，偏大，更有神）
      ctx.fillStyle = '#2a0e00';
      ctx.beginPath(); ctx.arc(eX1+fx*1.5, eY+fy*1.2, 2.8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eX2+fx*1.5, eY+fy*1.2, 2.8, 0, Math.PI*2); ctx.fill();
      // 攻击时瞳孔微红光（狠劲）
      if (this._animState === 'attack') {
        ctx.save(); ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#ff2200';
        ctx.beginPath(); ctx.arc(eX1+fx*1.5, eY+fy*1.2, 2.8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(eX2+fx*1.5, eY+fy*1.2, 2.8, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
      // 高光
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(eX1+fx*1.5-0.7, eY+fy*1.2-1, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eX2+fx*1.5-0.7, eY+fy*1.2-1, 1, 0, Math.PI*2); ctx.fill();
      // 眼眶描边
      ctx.strokeStyle = '#4a2200'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(eX1, eY, 4.5, 3.5, -0.15, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(eX2, eY, 4.5, 3.5, 0.15, 0, Math.PI*2); ctx.stroke();

      // ── 猴嘴（突出的嘴唇/龅牙）──
      const mouthY = headY2 + headR*0.35 + eyeOffY*0.5;
      // 猴子口鼻突出区（浅色椭圆）
      ctx.fillStyle = '#e8a870';
      ctx.beginPath(); ctx.ellipse(headX + eyeOffX*0.5, mouthY - 2, 8, 7, 0, 0, Math.PI*2); ctx.fill();
      if (this._animState === 'attack') {
        // 张嘴龅牙（咆哮）
        ctx.fillStyle = '#cc3300';
        ctx.beginPath(); ctx.arc(headX+eyeOffX*0.5, mouthY+1, 6, 0, Math.PI); ctx.fill(); // 嘴内红
        ctx.fillStyle = '#fff';
        // 上排两颗大龅牙
        ctx.beginPath(); ctx.roundRect(headX+eyeOffX*0.5-5, mouthY-3, 4, 6, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(headX+eyeOffX*0.5+1, mouthY-3, 4, 6, 1); ctx.fill();
      } else {
        // 闭嘴微笑线 + 龅牙微露
        ctx.strokeStyle = '#7a3300'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(headX+eyeOffX*0.5, mouthY-2, 5, 0.25, Math.PI-0.25);
        ctx.stroke();
        // 下唇弧
        ctx.strokeStyle = '#c07040'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(headX+eyeOffX*0.5, mouthY+2, 4, -Math.PI+0.4, -0.4);
        ctx.stroke();
      }

      // 鼻子（两个鼻孔小点）
      ctx.fillStyle = '#8a4010';
      ctx.beginPath(); ctx.arc(headX+eyeOffX*0.5-2.5, mouthY-5, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(headX+eyeOffX*0.5+2.5, mouthY-5, 1.5, 0, Math.PI*2); ctx.fill();
    }

    // ── 金箍（动态圆环）──
    const hoopY = headY2 - 3 + bobY*0.3;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4;
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(headX, hoopY, headR*0.88, headR*0.28, 0, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
    // 金箍宝石（正面中央）
    ctx.fillStyle = '#ff3333';
    ctx.strokeStyle = '#aa0000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(headX + fx*headR*0.78, hoopY + fy*headR*0.22, 3.5, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // 宝石高光
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(headX + fx*headR*0.78 - 0.8, hoopY + fy*headR*0.22 - 1, 1, 0, Math.PI*2); ctx.fill();

    // ── 金箍棒（最顶层渲染）──
    // 棍身（更粗更长）
    ctx.strokeStyle = '#b8902a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,200,50,0.6)'; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.moveTo(staffTailX, staffTailY); ctx.lineTo(staffHeadX, staffHeadY); ctx.stroke();
    ctx.shadowBlur = 0;
    // 棍身高光线（偏移1px）
    ctx.save();
    ctx.strokeStyle = 'rgba(255,240,160,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(staffTailX - sSin*1.5, staffTailY + sCos*1.5);
    ctx.lineTo(staffHeadX - sSin*1.5, staffHeadY + sCos*1.5);
    ctx.stroke();
    ctx.restore();
    // 棍身花纹（3个金环：1/4、1/2、3/4处）
    const midX = (staffTailX+staffHeadX)/2, midY = (staffTailY+staffHeadY)/2;
    const q1X = staffTailX*0.75+staffHeadX*0.25, q1Y = staffTailY*0.75+staffHeadY*0.25;
    const q3X = staffTailX*0.25+staffHeadX*0.75, q3Y = staffTailY*0.25+staffHeadY*0.75;
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3.5;
    [[midX,midY],[q1X,q1Y],[q3X,q3Y]].forEach(([rx,ry]) => {
      ctx.beginPath();
      ctx.moveTo(rx - sSin*5, ry + sCos*5);
      ctx.lineTo(rx + sSin*5, ry - sCos*5);
      ctx.stroke();
    });
    // 尾端金球
    ctx.fillStyle = '#ffd700'; ctx.strokeStyle = '#aa7700'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(staffTailX, staffTailY, 6.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // 头端金球（攻击时更大更亮）
    const hbr = this._animState==='attack' && this._atkAnim>0.3 && this._atkAnim<0.7 ? 10 : 7;
    ctx.fillStyle = this._animState==='attack' ? '#ffe040' : '#ffd700';
    ctx.beginPath(); ctx.arc(staffHeadX, staffHeadY, hbr, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // 攻击时棍头发光（范围更大）
    if (this._animState==='attack' && this._atkAnim>0.3 && this._atkAnim<0.7) {
      const ga = Math.sin((this._atkAnim-0.3)/0.4*Math.PI)*0.9;
      ctx.save(); ctx.globalAlpha=ga;
      const grd2 = ctx.createRadialGradient(staffHeadX, staffHeadY, 2, staffHeadX, staffHeadY, 30);
      grd2.addColorStop(0, 'rgba(255,240,80,1)');
      grd2.addColorStop(1, 'rgba(255,120,0,0)');
      ctx.fillStyle = grd2;
      ctx.beginPath(); ctx.arc(staffHeadX, staffHeadY, 30, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // 检查世界坐标是否在弱水中
  _inWeakWater(wx, wy) {
    const r = this.radius || 20;
    const wwRects = this.game._weakWaterRects;
    if (!wwRects) return false;
    for (const rr of wwRects) {
      if (wx + r > rr.x && wx - r < rr.x + rr.w &&
          wy + r > rr.y && wy - r < rr.y + rr.h) {
        return true;
      }
    }
    return false;
  }

  _drawHpBar(ctx, sx, sy) {
    const bw=50, bh=6, bx=sx-bw/2, by=sy-this.radius-18;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,by,bw,bh);
    const r=this.hp/this.maxHp;
    ctx.fillStyle=r>0.5?'#2ecc71':r>0.25?'#f39c12':'#e74c3c';
    ctx.fillRect(bx,by,bw*r,bh);
    ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);
    ctx.restore();
  }
}

// ===== 唐僧 NPC =====
class TangSeng {
  constructor(game) {
    this.game = game;
    // 关卡表坐标：主城(1,2) 格[81,49] → 世界坐标(5000, 8232)
    this.x = 5000;
    this.y = 8232;
    this.maxHp = C.TANGSENG_HP;
    this.hp    = this.maxHp;
    this.armor = 0; this.dmgReduce = 0;
    this.alive = true;
    this.dmgFloats = [];
    this._t = 0;

    // ── 任务交互状态 ──
    this.nearPlayer = false;   // 玩家是否在交互范围内
    this._INTERACT_RANGE = 100; // 触发范围（世界坐标px）
    this._LEAVE_RANGE    = 130; // 离开范围

    // 创建唐僧任务弹窗
    this._buildQuestPanel();
  }

  /* ── 创建任务弹窗DOM ── */
  _buildQuestPanel() {
    const el = document.createElement('div');
    el.id = 'tangseng-quest-panel';
    el.className = 'hidden npc-quest-panel';
    el.innerHTML = `
      <div class="npc-quest-header">
        <span class="npc-quest-avatar">🧘</span>
        <div>
          <div class="npc-quest-npcname">唐僧</div>
          <div class="npc-quest-title" id="ts-quest-title">—</div>
        </div>
      </div>
      <div class="npc-quest-desc" id="ts-quest-desc"></div>
      <div class="npc-quest-conds" id="ts-quest-conds"></div>
      <div class="npc-quest-footer">
        <button id="ts-quest-accept-btn">接取任务</button>
        <button class="btn-close" onclick="document.getElementById('tangseng-quest-panel').classList.add('hidden')">关闭</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(el);
    this._questPanel = el;

    document.getElementById('ts-quest-accept-btn').addEventListener('click', () => {
      const qm = this.game.quest;
      if (!qm) return;
      const quest = qm.acceptQuest('tangseng');
      if (quest) {
        if (this.game.ui) this.game.ui.showSkillToast(`📜 接取任务：${quest.title}`);
        // 接取成功后直接关闭弹窗
        this._questPanel.classList.add('hidden');
        return;
      }
      // 无可接任务时刷新面板内容
      this._refreshQuestPanel();
    });
  }

  /* ── 刷新弹窗内容 ── */
  _refreshQuestPanel() {
    const qm = this.game.quest;
    const titleEl   = document.getElementById('ts-quest-title');
    const descEl    = document.getElementById('ts-quest-desc');
    const condsEl   = document.getElementById('ts-quest-conds');
    const acceptBtn = document.getElementById('ts-quest-accept-btn');

    if (!qm) return;

    const activeQuest = qm._active['tangseng'];
    if (activeQuest) {
      if (activeQuest.status === 'pending_turn_in') {
        // ── 待交付状态 ──
        titleEl.innerHTML = `${activeQuest.icon} ${activeQuest.title} <span style="color:#ffe44a;font-size:11px">【可交付！】</span>`;
        descEl.textContent = '任务已完成，交付给贫僧吧！';
        condsEl.innerHTML = activeQuest.progress.map(p =>
          `<div class="npc-quest-cond cond-all-done">✓ ${p.label}：${p.current}/${p.count}</div>`
        ).join('');
        // 奖励预览
        const rewardHtml = activeQuest.def.rewards.map(r => {
          if (r.type === 'exp')  return `<span class="reward-tag exp">经验+${r.value}</span>`;
          if (r.type === 'gold') return `<span class="reward-tag gold">金币+${r.value}</span>`;
          if (r.type === 'item') return `<span class="reward-tag item">「${r.itemDef.name}」</span>`;
          return '';
        }).join(' ');
        condsEl.innerHTML += `<div class="npc-quest-reward">奖励：${rewardHtml}</div>`;
        acceptBtn.textContent = '✅ 提交任务';
        acceptBtn.disabled = false;
        acceptBtn.classList.add('btn-turn-in');
      } else {
        // ── 进行中状态 ──
        titleEl.textContent = `${activeQuest.icon} ${activeQuest.title}`;
        descEl.textContent  = activeQuest.desc;
        condsEl.innerHTML = activeQuest.progress.map(p =>
          `<div class="npc-quest-cond">
            ${p.label}：<span class="${p.current >= p.count ? 'cond-done' : ''}">${p.current}/${p.count}</span>
           </div>`
        ).join('');
        acceptBtn.textContent = '进行中…';
        acceptBtn.disabled = true;
        acceptBtn.classList.remove('btn-turn-in');
      }
    } else {
      acceptBtn.classList.remove('btn-turn-in');
      const available = qm.getAvailableQuest('tangseng');
      if (available) {
        titleEl.textContent = `${available.icon} ${available.title}`;
        descEl.textContent  = available.desc;
        condsEl.innerHTML = available.conditions.map(c =>
          `<div class="npc-quest-cond">${c.label}：0/${c.count}</div>`
        ).join('');
        // 奖励预览
        const rewardHtml = available.rewards.map(r => {
          if (r.type === 'exp')  return `<span class="reward-tag exp">经验+${r.value}</span>`;
          if (r.type === 'gold') return `<span class="reward-tag gold">金币+${r.value}</span>`;
          if (r.type === 'item') return `<span class="reward-tag item">「${r.itemDef.name}」</span>`;
          return '';
        }).join(' ');
        condsEl.innerHTML += `<div class="npc-quest-reward">奖励：${rewardHtml}</div>`;
        acceptBtn.textContent = '接取任务';
        acceptBtn.disabled = false;
      } else {
        titleEl.textContent = '无可接任务';
        descEl.textContent  = '贫僧暂时没有任务交予悟空，好好保护为师吧！';
        condsEl.innerHTML   = '';
        acceptBtn.textContent = '——';
        acceptBtn.disabled = true;
      }
    }
  }

  /* ── Q键交互（game.js调用）── */
  tryInteract() {
    if (!this.nearPlayer) return false;
    const qm = this.game.quest;
    // 若有待交付任务 → 直接静默交付，不打开弹窗
    if (qm && qm.hasPendingTurnIn('tangseng')) {
      qm.turnIn('tangseng');
      return true;
    }
    // 否则打开任务弹窗
    this._refreshQuestPanel();
    this._questPanel.classList.remove('hidden');
    return true;
  }

  takeDamage(dmg) {
    if (!this.alive) return;
    const fd = Utils.calcDamage(dmg, this.armor, 0, this.dmgReduce);
    this.hp = Math.max(0, this.hp - fd);
    this.dmgFloats.push({
      x:this.x, y:this.y-30, text:`-${fd}`, color:'#ff8800',
      life:1200, maxLife:1200, vx:Utils.randFloat(-10,10), vy:-70
    });
    if (this.hp<=0) { this.hp=0; this.alive=false; this.game.onTangSengDead(); }
  }

  update(dt) {
    this._t += dt;

    // ── 检测玩家距离，更新 nearPlayer 状态 ──
    const player = this.game.player;
    if (player && !player.dead) {
      const dx = player.x - this.x, dy = player.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (!this.nearPlayer && dist <= this._INTERACT_RANGE) {
        this.nearPlayer = true;
      } else if (this.nearPlayer && dist > this._LEAVE_RANGE) {
        this.nearPlayer = false;
        // 走远自动关闭任务弹窗
        if (this._questPanel) this._questPanel.classList.add('hidden');
      }
    }

    // 每 10 秒回复 1% 最大生命
    this._healTimer = (this._healTimer || 0) + dt;
    if (this._healTimer >= 10000) {
      this._healTimer -= 10000;
      if (this.alive) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.01);
    }

    // 每分钟 maxHp 成长 5%（maxHp *= 1.05）
    this._minuteGrowTimer = (this._minuteGrowTimer || 0) + dt;
    if (this._minuteGrowTimer >= 60000) {
      this._minuteGrowTimer -= 60000;
      if (this.alive) {
        this.maxHp = Math.floor(this.maxHp * 1.05);
      }
    }
    this.dmgFloats = this.dmgFloats.filter(f => {
      f.life-=dt; f.x+=f.vx*(dt/1000); f.y+=f.vy*(dt/1000); f.vy+=80*(dt/1000); return f.life>0;
    });
  }

  draw(ctx, camera) {
    if (!camera.inView(this.x, this.y, 120)) return;
    const {sx,sy} = camera.worldToScreen(this.x, this.y);
    const r = 18;
    ctx.save();

    // ── 唐僧光环（500px 世界坐标 → 屏幕半径）──
    const auraWorldR  = 500;
    const auraScreenR = auraWorldR; // Camera 1:1 映射，世界单位 = 屏幕像素
    const auraPulse   = 0.06 + 0.03 * Math.sin(this._t / 600);
    const auraGrad = ctx.createRadialGradient(sx, sy, auraScreenR * 0.7, sx, sy, auraScreenR);
    auraGrad.addColorStop(0,   `rgba(80, 220, 120, 0)`);
    auraGrad.addColorStop(0.7, `rgba(80, 220, 120, ${(auraPulse * 0.6).toFixed(3)})`);
    auraGrad.addColorStop(1,   `rgba(80, 220, 120, ${auraPulse.toFixed(3)})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, auraScreenR, 0, Math.PI * 2);
    ctx.fill();
    // 光环边缘描边
    ctx.strokeStyle = `rgba(100, 240, 140, ${(auraPulse * 2.5).toFixed(3)})`;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(sx, sy, auraScreenR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 光晕动画
    ctx.globalAlpha = 0.18+0.08*Math.sin(this._t/400);
    ctx.fillStyle='#fffacd';
    ctx.beginPath(); ctx.arc(sx,sy,r+14,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;

    // 影子
    ctx.globalAlpha=0.2; ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(sx,sy+r-3,r*0.8,5,0,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;

    // 白袍
    ctx.fillStyle='#fffaf0';
    ctx.beginPath(); ctx.ellipse(sx,sy+6,12,14,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ddd0aa'; ctx.lineWidth=2; ctx.stroke();
    // 袈裟橙条
    ctx.strokeStyle='#ff8800'; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.arc(sx,sy+6,10,0.4,Math.PI-0.4); ctx.stroke();

    // 头
    ctx.fillStyle='#ffe4c4';
    ctx.beginPath(); ctx.arc(sx,sy-11,r*0.85,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ddd0aa'; ctx.lineWidth=1.5; ctx.stroke();

    // 毗卢帽
    ctx.fillStyle='#cc9900';
    ctx.beginPath();
    ctx.moveTo(sx-14,sy-22); ctx.lineTo(sx+14,sy-22);
    ctx.lineTo(sx+9,sy-36); ctx.lineTo(sx-9,sy-36);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffdd00'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#ff4444';
    ctx.beginPath(); ctx.arc(sx,sy-37,4,0,Math.PI*2); ctx.fill();

    // 眼睛（闭目）
    ctx.strokeStyle='#333'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(sx-5,sy-12,3,-0.1,Math.PI+0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx+5,sy-12,3,-0.1,Math.PI+0.1); ctx.stroke();

    // 血条（金色）
    const bw=64, bh=8, bx=sx-bw/2, by=sy-r-26;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,by,bw,bh);
    const rat=this.hp/this.maxHp;
    ctx.fillStyle=rat>0.5?'#ffd700':rat>0.25?'#ff8800':'#ff3300';
    ctx.fillRect(bx,by,bw*rat,bh);
    ctx.strokeStyle='#aa8800'; ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);

    // 名字（绘制在血条上方）
    ctx.font='bold 12px Microsoft YaHei';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle='#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=2;
    ctx.strokeText('唐僧',sx,by-2); ctx.fillText('唐僧',sx,by-2);

    // 靠近时显示 [Q] 交互提示（待交付时高亮金色闪烁提示）
    if (this.nearPlayer) {
      const qm = this.game.quest;
      const isPending = qm && qm.hasPendingTurnIn('tangseng');
      const hint = isPending ? '[Q] 交付任务' : '[Q] 接任务';
      const textColor = isPending ? '#ffe44a' : '#ffe88a';
      const bgColor   = isPending ? 'rgba(120,80,0,0.88)' : 'rgba(0,0,0,0.78)';
      ctx.font = 'bold 12px Microsoft YaHei';
      const hw = ctx.measureText(hint).width + 10;
      const hx = sx - hw / 2;
      const hy = by - 40;
      ctx.fillStyle = bgColor;
      if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(hx, hy, hw, 18, 3); ctx.fill();
      } else {
        ctx.fillRect(hx, hy, hw, 18);
      }
      // 待交付时描边发光
      if (isPending) {
        ctx.strokeStyle = '#ffe44a';
        ctx.lineWidth = 1;
        if (ctx.roundRect) {
          ctx.beginPath(); ctx.roundRect(hx, hy, hw, 18, 3); ctx.stroke();
        } else {
          ctx.strokeRect(hx, hy, hw, 18);
        }
      }
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';
      ctx.fillText(hint, sx, hy + 3);
    }

    // 浮字
    for (const f of this.dmgFloats) {
      const {sx:fx,sy:fy}=camera.worldToScreen(f.x,f.y);
      ctx.globalAlpha=f.life/f.maxLife;
      ctx.font='bold 15px Microsoft YaHei'; ctx.textAlign='center';
      ctx.strokeStyle='#000'; ctx.lineWidth=2;
      ctx.strokeText(f.text,fx,fy); ctx.fillStyle=f.color; ctx.fillText(f.text,fx,fy);
    }
    ctx.restore();
  }
}

// ════════════════════════════════════════════════════════
//  MonkeyClone  —— 猴子猴孙分身（v2）
//  外观/属性完全继承玩家，复用 Player._drawSprite 绘制
// ════════════════════════════════════════════════════════
class MonkeyClone {
  /**
   * @param {Player}  owner - 召唤者（玩家）
   * @param {number}  x/y   - 初始生成坐标
   * @param {number}  idx   - 分身序号（0-3）
   */
  constructor(owner, x, y, idx) {
    this.owner = owner;
    this.game  = owner.game;
    this.x     = x;
    this.y     = y;
    this.idx   = idx;
    this.alive = true;

    // ── 完整继承玩家战斗属性 ──
    this.atk       = owner.atk;
    this.armor     = owner.armor;
    this.maxHp     = owner.maxHp;
    this.hp        = owner.maxHp;
    this.speed     = owner.speed;
    this.critRate  = owner.critRate  || 0;
    this.critMul   = owner.critMul   || 1.5;
    this.dmgReduce = owner.dmgReduce || 0;
    // 攻击间隔：与玩家相同
    this._atkInterval = owner.atkInterval || 1200;
    this._atkCd  = 0;

    // ── 生命周期 ──
    this.LIFESPAN      = 5000;  // 5 秒
    this.lifeTimer     = 0;
    this.dissolving    = false;
    this.dissolveTimer = 0;
    this.DISSOLVE_DUR  = 600;   // 消融动画时长

    // ── 渲染用状态（复用 _drawSprite 所需字段）──
    // 朝向向量（初始朝向4个不同方向）
    const initAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    const ang = initAngles[idx % 4];
    this.facing = { x: Math.cos(ang), y: Math.sin(ang) };
    this._animState     = 'idle';
    this._idleBob       = idx * 1.5;           // 错开呼吸相位
    this._walkCycle     = idx * (Math.PI / 2); // 错开走路相位
    this._atkAnim       = 0;
    this._atkAnimTimer  = 0;
    this._atkAnimDur    = 350;
    this._invincible    = 0;
    this._jumping       = false;
    this._jumpTimer     = 0;
    this._jumpTotalTime = 500;
    this._jumpOffsetY   = 0;
    this._bodhiBuff     = { active: false };
    this._danceBuff     = { active: false };

    // dissolve 程度 0→1
    this._dissolveAlpha = 0;

    // 飘字 / 特效
    this.dmgFloats = [];
    this.effects   = [];
  }

  // ──────────────────────────── update ────────────────────────────
  update(dt) {
    if (!this.alive) return;

    // ── 消融阶段 ──
    if (this.dissolving) {
      this.dissolveTimer  += dt;
      this._dissolveAlpha  = this.dissolveTimer / this.DISSOLVE_DUR;
      this._tickFloats(dt);
      if (this.dissolveTimer >= this.DISSOLVE_DUR) this.alive = false;
      return;
    }

    // ── 生命倒计时 ──
    this.lifeTimer += dt;
    if (this.lifeTimer >= this.LIFESPAN) {
      this._startDissolve();
      return;
    }

    // ── 动画状态更新 ──
    if (this._animState === 'idle') {
      this._idleBob += dt * 0.003;
    } else if (this._animState === 'walk') {
      this._walkCycle += dt * 0.007;
    } else if (this._animState === 'attack') {
      this._atkAnimTimer += dt;
      this._atkAnim = Math.min(1, this._atkAnimTimer / this._atkAnimDur);
      if (this._atkAnimTimer >= this._atkAnimDur) {
        this._animState    = 'idle';
        this._atkAnim      = 0;
        this._atkAnimTimer = 0;
      }
    }

    // ── 攻击冷却 ──
    if (this._atkCd > 0) this._atkCd -= dt;

    // ── 寻找最近存活敌人 ──
    const enemies = this.game.getAllEnemies ? this.game.getAllEnemies() : [];
    let target = null, nearestDist = Infinity;
    for (const e of enemies) {
      if (e.dead || e.hp <= 0) continue;
      const dx = e.x - this.x, dy = e.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) { nearestDist = d; target = e; }
    }

    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 朝向目标
      this.facing = { x: dx / dist, y: dy / dist };

      const ATTACK_RANGE = 60;
      if (dist > ATTACK_RANGE) {
        // 追击目标
        this._animState = 'walk';
        const spd = this.speed * dt / 1000;
        const nx = this.x + (dx / dist) * spd;
        const ny = this.y + (dy / dist) * spd;
        if (!isWallAt(nx, this.y, 18)) this.x = nx;
        if (!isWallAt(this.x, ny, 18)) this.y = ny;
      } else {
        // 在射程内：原地待机并发动攻击
        if (this._animState !== 'attack') this._animState = 'idle';
        if (this._atkCd <= 0) {
          this._doAttack(target);
          this._atkCd        = this._atkInterval;
          this._animState    = 'attack';
          this._atkAnim      = 0;
          this._atkAnimTimer = 0;
        }
      }
    } else {
      // 无目标：原地待机
      this._animState = 'idle';
    }

    this._tickFloats(dt);
  }

  _tickFloats(dt) {
    this.dmgFloats = this.dmgFloats.filter(f => {
      f.life -= dt;
      f.x += f.vx * dt / 1000;
      f.y += f.vy * dt / 1000;
      f.vy += 80 * dt / 1000;
      return f.life > 0;
    });
    for (const e of this.effects) { e.r += (e.maxR - e.r) * 0.18; e.life -= dt; }
    this.effects = this.effects.filter(e => e.life > 0);
  }

  _doAttack(target) {
    const isCrit = Math.random() < (this.critRate || 0);
    let dmg = this.atk * (0.9 + Math.random() * 0.2);
    if (isCrit) dmg *= (this.critMul || 1.5);
    dmg = Math.round(dmg);

    if (typeof target.takeDamage === 'function') {
      target.takeDamage(dmg, this);
    } else {
      target.hp = Math.max(0, (target.hp || 0) - dmg);
    }

    // 通知任务系统
    if (target.hp <= 0 && this.game.quest) {
      this.game.quest.onEnemyKilled(target.name);
    }

    // 飘字
    this.dmgFloats.push({
      x: target.x, y: target.y - 20,
      text: isCrit ? `💥${dmg}` : `-${dmg}`,
      color: isCrit ? '#ff4400' : '#ffe44a',
      life: 900, maxLife: 900,
      vx: (Math.random() - 0.5) * 30,
      vy: -80,
    });
    // 击中特效
    this.effects.push({
      x: target.x, y: target.y,
      r: 0, maxR: isCrit ? 45 : 28,
      life: 220, maxLife: 220,
      color: isCrit ? 'rgba(255,80,0,0.7)' : 'rgba(255,220,60,0.55)',
      type: 'hit',
    });
  }

  _startDissolve() {
    this.dissolving     = true;
    this.dissolveTimer  = 0;
    this._dissolveAlpha = 0;
    this.effects.push({
      x: this.x, y: this.y, r: 0, maxR: 70,
      life: 500, maxLife: 500,
      color: 'rgba(255,230,80,0.7)', type: 'aoe',
    });
  }

  // ──────────────────────────── draw ────────────────────────────
  draw(ctx, camera) {
    if (!this.alive) return;

    const { sx, sy } = camera.worldToScreen(this.x, this.y);

    ctx.save();

    // 整体透明度：dissolve 时淡出，正常时略透明以区别玩家
    const baseAlpha = this.dissolving
      ? Math.max(0, 1 - this._dissolveAlpha)
      : 0.78;
    ctx.globalAlpha = baseAlpha;

    // ── 复用玩家 _drawSprite，将 this 作为上下文传入 ──
    // _drawSprite 依赖的字段：facing / _animState / _idleBob / _walkCycle /
    // _atkAnim / _invincible / _jumping 等，分身已全部维护。
    Player.prototype._drawSprite.call(this, ctx, sx, sy);

    ctx.globalAlpha = 1;

    // ── 分身标识：蓝白色光晕轮廓 ──
    if (!this.dissolving) {
      const pulse = 0.25 + 0.15 * Math.sin(this.lifeTimer * 0.005 + this.idx);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = 'rgba(120,200,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 3, 20, 32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── 剩余不足 1.5s 时闪烁警告 ──
    const timeLeft = this.LIFESPAN - this.lifeTimer;
    if (timeLeft < 1500 && !this.dissolving) {
      if (Math.floor(timeLeft / 200) % 2 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'rgba(255,255,100,0.5)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 22, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ── 飘字 ──
    ctx.font = 'bold 14px Microsoft YaHei, Arial';
    ctx.textAlign = 'center';
    for (const f of this.dmgFloats) {
      const alpha = f.life / f.maxLife;
      const fx = f.x - camera.x, fy = f.y - camera.y;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText(f.text, fx, fy);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, fx, fy);
      ctx.restore();
    }
    ctx.textAlign = 'left';

    // ── 特效圈 ──
    for (const e of this.effects) {
      const ea = e.life / e.maxLife * 0.5;
      ctx.save();
      ctx.globalAlpha = ea;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x - camera.x, e.y - camera.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}
