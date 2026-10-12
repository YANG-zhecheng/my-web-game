// ===== 任务系统 =====
// QuestManager 管理所有任务的定义、接取、进度追踪与完成奖励

// ── 任务奖励类型：exp / gold / item ──
// ── 任务条件类型：kill（击杀任意/指定怪物 N 次）──

// 全部任务定义表（按 npcId 分组，chain 表示链式顺序）
const QUEST_DEFS = {
  tangseng: [
    {
      id:         'ts_01',
      npcId:      'tangseng',
      chain:      1,           // 第1个任务（接取顺序）
      title:      '降妖除魔',
      desc:       '悟空，保护好师傅！先斩妖10只！',
      icon:       '⚔️',
      conditions: [
        { type: 'kill', target: '*', count: 10, label: '击杀妖怪' }
      ],
      rewards: [
        { type: 'item', itemDef: {
            id: 'wooden_stick', name: '木棍', slot: 'weapon', quality: 'white',
            effect: '攻击+10',
            attrs: { atk: 10 },
            icon: '🏏',
            desc: '普通的木棍，打妖精用的。'
          }
        }
      ],
    },
    {
      id:         'ts_02',
      npcId:      'tangseng',
      chain:      2,
      title:      '狼肉与熊掌要兼得',
      desc:       '贫僧法号玄奘，俗家弟子，既想吃狼肉，又想啃熊掌……悟空，去斩那狼王与熊精各一头来！',
      icon:       '🐺🐻',
      conditions: [
        { type: 'kill', target: '狼王', count: 1, label: '击杀狼王' },
        { type: 'kill', target: '熊精', count: 1, label: '击杀熊精' }
      ],
      rewards: [
        { type: 'exp', value: 3000 }
      ],
    },
    {
      id:         'ts_03',
      npcId:      'tangseng',
      chain:      3,
      title:      '牛马之战',
      desc:       '悟空，听说西行路上有勇敢牛牛与浪里马横行，快去各斩一只，为师等你凯旋！',
      icon:       '🐂🐴',
      conditions: [
        { type: 'kill', target: '勇敢牛牛', count: 1, label: '击杀勇敢牛牛' },
        { type: 'kill', target: '浪里马',   count: 1, label: '击杀浪里马'   }
      ],
      rewards: [
        { type: 'item', itemDef: {
            name: '精铁', type: 'item', quality: 'white',
            icon: '🔩', desc: '合成材料：铁质原料'
          }
        },
        { type: 'exp', value: 6000 }
      ],
    },
    {
      id:         'ts_04',
      npcId:      'tangseng',
      chain:      4,
      title:      '龙宫先锋',
      desc:       '悟空，龙宫里的虾兵蟹将欺压百姓，快去各斩5只，为师在此静候！',
      icon:       '🦐🦀',
      conditions: [
        { type: 'kill', target: '虾兵', count: 5, label: '击杀虾兵' },
        { type: 'kill', target: '蟹将', count: 5, label: '击杀蟹将' }
      ],
      rewards: [
        { type: 'exp', value: 5000 }
      ],
    },
    {
      id:         'ts_05',
      npcId:      'tangseng',
      chain:      5,
      title:      '斩龙除患',
      desc:       '悟空，那龙王兴风作浪，祸害一方，你去将那龙王斩了，为西行除一大患！',
      icon:       '🐉',
      conditions: [
        { type: 'kill', target: '龙王', count: 1, label: '击杀龙王' }
      ],
      rewards: [
        { type: 'exp', value: 10000 },
        { type: 'gold', value: 300 }
      ],
    },
    {
      id:         'ts_06',
      npcId:      'tangseng',
      chain:      6,
      title:      '金银双煞',
      desc:       '悟空，金角大王与银角大王联手为患，你速去将此二妖斩于棍下，为师拜托了！',
      icon:       '🥇🥈',
      conditions: [
        { type: 'kill', target: '银角大王', count: 1, label: '击杀银角大王' },
        { type: 'kill', target: '金角大王', count: 1, label: '击杀金角大王' }
      ],
      rewards: [
        { type: 'exp', value: 20000 },
        { type: 'gold', value: 500 }
      ],
    },
    {
      id:         'ts_07',
      npcId:      'tangseng',
      chain:      7,
      title:      '冰山三煞',
      desc:       '悟空，西行路上冰山横亘，冰狼、霜熊、雪妖横行无忌，寒气逼人！去各斩五只，打通这冰山要道！',
      icon:       '❄️',
      conditions: [
        { type: 'kill', target: '冰狼', count: 5, label: '击杀冰狼' },
        { type: 'kill', target: '霜熊', count: 5, label: '击杀霜熊' },
        { type: 'kill', target: '雪妖', count: 5, label: '击杀雪妖' }
      ],
      rewards: [
        { type: 'exp', value: 15000 },
        { type: 'gold', value: 400 }
      ],
    },
    {
      id:         'ts_08',
      npcId:      'tangseng',
      chain:      8,
      title:      '扇息烈火',
      desc:       '悟空，那铁扇公主手持芭蕉扇，一扇便可灭天下之火！你去将她降服，为西行除此大患！',
      icon:       '🪭',
      conditions: [
        { type: 'kill', target: '铁扇公主', count: 1, label: '击杀铁扇公主' }
      ],
      rewards: [
        { type: 'exp', value: 20000 },
        { type: 'gold', value: 600 }
      ],
    },
    {
      id:         'ts_09',
      npcId:      'tangseng',
      chain:      9,
      title:      '屠龙之战',
      desc:       '悟空，冰山深处盘踞着一条冰龙，寒气弥漫，祸害四方！为师命你斩龙除害，打通西行冰道！',
      icon:       '🐲',
      conditions: [
        { type: 'kill', target: '冰龙', count: 1, label: '击杀冰龙' }
      ],
      rewards: [
        { type: 'exp', value: 25000 },
        { type: 'gold', value: 800 }
      ],
    },
    {
      id:         'ts_10',
      npcId:      'tangseng',
      chain:      10,
      title:      '破冰封魔',
      desc:       '悟空，那玄冰法师乃冰山之主，法力通天，冻山封路！你去将他斩杀，方能继续西行！',
      icon:       '🧊',
      conditions: [
        { type: 'kill', target: '玄冰法师', count: 1, label: '击杀玄冰法师' }
      ],
      rewards: [
        { type: 'exp', value: 50000 },
        { type: 'gold', value: 1000 }
      ],
    },
  ],
};

// ── 单条任务实例 ──
class Quest {
  constructor(def) {
    this.def = def;
    this.id    = def.id;
    this.title = def.title;
    this.desc  = def.desc;
    this.icon  = def.icon;
    // 初始化进度（每个条件一个计数器）
    this.progress = def.conditions.map(c => ({ ...c, current: 0 }));
    this.status = 'active'; // 'active' | 'pending_turn_in' | 'done'
  }

  // 检测条件是否全部满足（不代表已交付）
  isConditionsMet() {
    return this.progress.every(p => p.current >= p.count);
  }

  // 处理击杀事件，返回是否有进度变化
  onKill(enemyName) {
    if (this.status !== 'active') return false;
    let changed = false;
    for (const p of this.progress) {
      if (p.type !== 'kill') continue;
      if (p.current >= p.count) continue;         // 该条件已完成
      if (p.target === '*' || p.target === enemyName) {
        p.current++;
        changed = true;
      }
    }
    return changed;
  }
}

// ── 任务管理器 ──
class QuestManager {
  constructor(game) {
    this.game = game;
    // 各 NPC 当前接取的任务实例（同一NPC同一时间只允许1个）
    // key = npcId, value = Quest 实例
    this._active = {};
    // 各 NPC 已完成的链式序号（key = npcId, value = 最后完成的 chain 编号）
    this._chainProgress = {};
  }

  /* ── 获取指定NPC下一条可接任务（未完成的最低 chain 号）── */
  getAvailableQuest(npcId) {
    const defs = QUEST_DEFS[npcId];
    if (!defs) return null;
    // 已有进行中任务则不返回新任务
    if (this._active[npcId]) return null;
    const done = this._chainProgress[npcId] || 0;
    const next = defs.find(d => d.chain === done + 1);
    return next || null;
  }

  /* ── 接取任务（由 NPC tryInteract() 调用）── */
  acceptQuest(npcId) {
    if (this._active[npcId]) return null; // 已有进行中
    const def = this.getAvailableQuest(npcId);
    if (!def) return null;
    const quest = new Quest(def);
    this._active[npcId] = quest;
    if (this.game.ui) this.game.ui.refreshQuests();

    // 「降妖除魔」：接取后追加引导提示到队列（等第一条显示完后自动显示）
    if (def.id === 'ts_01') {
      if (this.game.ui) {
        this.game.ui.showSkillToast('🗺️ 提示：前往地图右下角击杀妖怪！');
      }
    }

    return quest;
  }

  /* ── 击杀通知（boss.js / wave.js 的 _onDead 调用）── */
  onEnemyKilled(enemyName) {
    let anyChanged = false;
    for (const npcId in this._active) {
      const quest = this._active[npcId];
      if (!quest || quest.status !== 'active') continue;
      const changed = quest.onKill(enemyName);
      if (changed) anyChanged = true;
      if (quest.isConditionsMet()) {
        // 条件满足 → 进入待交付状态，提示玩家回来交付
        quest.status = 'pending_turn_in';
        anyChanged = true;
        if (this.game.ui) {
          this.game.ui.showSkillToast(`📜 任务「${quest.title}」已完成！返回唐僧交付！`);
          this.game.ui.refreshQuests();
        }
        return;
      }
    }
    if (anyChanged && this.game.ui) this.game.ui.refreshQuests();
  }

  /* ── 交付任务（玩家回到 NPC 处按 Q 触发）── */
  turnIn(npcId) {
    const quest = this._active[npcId];
    if (!quest || quest.status !== 'pending_turn_in') return false;

    // 正式完成，从 active 移除，更新链进度
    quest.status = 'done';
    delete this._active[npcId];
    this._chainProgress[npcId] = quest.def.chain;

    const player = this.game.player;
    const msgs   = [];

    for (const r of quest.def.rewards) {
      if (r.type === 'exp') {
        player.addExp(r.value);
        msgs.push(`经验 +${r.value}`);
      } else if (r.type === 'gold') {
        player.gold += r.value;
        msgs.push(`金币 +${r.value}`);
      } else if (r.type === 'item') {
        if (this.game.bag && !this.game.bag.isFull()) {
          this.game.bag.addItem({ ...r.itemDef });
          msgs.push(`获得「${r.itemDef.name}」`);
        } else {
          if (this.game.loot) {
            this.game.loot.spawn(player.x, player.y, { ...r.itemDef });
          }
          msgs.push(`获得「${r.itemDef.name}」（背包满，掉落地面）`);
        }
        // 如果奖励物品是装备槽位道具，延迟提醒玩家前往背包装备
        if (r.itemDef.slot === 'weapon' || r.itemDef.slot === 'head' ||
            r.itemDef.slot === 'armor'  || r.itemDef.slot === 'boots' ||
            r.itemDef.slot === 'acc') {
          // ts_01「降妖除魔」奖励木棍：直接自动装备，无需玩家手动操作
          if (quest.id === 'ts_01' && r.itemDef.slot === 'weapon') {
            const weaponSlot = 'weapon';
            const old = player.equips[weaponSlot];
            player.equips[weaponSlot] = { ...r.itemDef };
            // 若背包里刚才放入了木棍，把它取出（改为直接装备，不占背包）
            if (this.game.bag) {
              const bagIdx = this.game.bag.slots.findIndex(s => s && s.name === r.itemDef.name);
              if (bagIdx !== -1) this.game.bag.slots[bagIdx] = old || null;
              else if (old) this.game.bag.addItem(old); // 原武器放回背包
            }
            player._recalcStats();
            if (this.game.ui) this.game.ui.refresh();
            setTimeout(() => {
              if (this.game.ui) {
                this.game.ui.showSkillToast('🏏 木棍已自动装备！攻击力提升了！');
              }
            }, 2200);
          } else {
            setTimeout(() => {
              if (this.game.ui) {
                this.game.ui.showSkillToast(`💡 提示：打开背包（B键）装备「${r.itemDef.name}」吧！`);
              }
            }, 2200);
          }
        }
      }
    }

    if (this.game.ui) {
      this.game.ui.showSkillToast(`✅ 任务完成：${quest.title}！奖励：${msgs.join(' / ')}`);
      this.game.ui.refreshQuests();
      this.game.ui.showQuestComplete(quest.title);
    }
    return true;
  }

  /* ── 获取指定NPC是否有待交付任务 ── */
  hasPendingTurnIn(npcId) {
    const q = this._active[npcId];
    return !!(q && q.status === 'pending_turn_in');
  }

  /* ── 获取当前所有进行中/待交付任务列表（用于UI显示）── */
  getActiveQuests() {
    return Object.values(this._active).filter(Boolean);
  }

  /* ── 检查 NPC 是否还有更多任务可接 ── */
  hasMoreQuests(npcId) {
    return !!this.getAvailableQuest(npcId);
  }
}
