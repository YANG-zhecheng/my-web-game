// ===== 波次系统 =====
class WaveSystem {
  constructor(game) {
    this.game = game;
    this.currentWave = 0;
    this.enemies = [];
    // 新逻辑：纯定时驱动，每 WAVE_INTERVAL(2分钟) 准点触发一波，不等待全灭
    this._waveTimer = C.WAVE_INTERVAL; // 倒计时器，初始2分钟后出第一波
    this._started = false;
    this._finished = false;           // 全部波次已触发
  }

  start() {
    this._started = true;
  }

  _spawnWave(waveNum) {
    const wz = C.getZoneRect(0, 2); // 波次入侵区（左下）
    // 按波次表的 count 数值生成（查 WAVE_DATA，wave从1开始）
    const wd = (typeof WAVE_DATA !== 'undefined')
      ? (WAVE_DATA[Math.min(waveNum, WAVE_DATA.length) - 1] || WAVE_DATA[WAVE_DATA.length - 1])
      : null;
    const count = wd ? wd.count : 10;
    for (let i = 0; i < count; i++) {
      const x = wz.x + Utils.randFloat(100, wz.w - 100);
      const y = wz.y + Utils.randFloat(100, wz.h - 100);
      this.enemies.push(new WaveEnemy(x, y, waveNum, i));
    }
    // 向主界面推送提示
    if (this.game.ui) this.game.ui.showWaveAlert(waveNum, C.TOTAL_WAVES);
  }

  update(dt, player, tangSeng) {
    if (!this._started || this._finished) return;

    // 更新所有波次怪（保留有浮字的死亡敌人，用于渲染浮字）
    this.enemies.forEach(e => e.update(dt, player, tangSeng, this.game));

    // 清理完全结束的死亡敌人
    this.enemies = this.enemies.filter(e => !e.dead || e.dmgFloats.length > 0);

    // 检查是否全部波次的怪都死光（通关判定）
    // 只有在最后一波已触发后才做此判定
    if (this.currentWave >= C.TOTAL_WAVES) {
      const aliveCount = this.enemies.filter(e => !e.dead).length;
      if (aliveCount === 0) {
        this._finished = true;
        this.game.onWavesCleared();
        return;
      }
    }

    // 准点定时刷新：每 WAVE_INTERVAL 触发一波（不等待击杀）
    if (this.currentWave < C.TOTAL_WAVES) {
      this._waveTimer -= dt;
      if (this._waveTimer <= 0) {
        this.currentWave++;
        this._spawnWave(this.currentWave);
        this._waveTimer = C.WAVE_INTERVAL; // 重置为下一波倒计时
      }
    }
  }

  getAllEnemies() {
    return this.enemies.filter(e => !e.dead);
  }

  // 返回距下一波的剩余毫秒数（始终存在直到所有波次触发完）
  getNextCountdown() {
    if (this.currentWave >= C.TOTAL_WAVES) return null;
    return Math.max(0, this._waveTimer);
  }

  draw(ctx, camera) {
    this.enemies.forEach(e => e.draw(ctx, camera));
  }
}
