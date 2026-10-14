// 三大关原始数据（血量/防御/数量/速度 来自Excel，其余字段保持统一结构）
const STAGE_RAW_DATA = {
  1: [
    // W1  ~W5
    { waveType:'normal     ', count: 5,  hp:    120,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    217,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    330,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 6,  hp:    421,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count: 7,  hp:    260,  defense:  2,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W6~W10
    { waveType:'normal     ', count: 8,  hp:    631,  defense:  4,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 9,  hp:    756,  defense:  6,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:    897,  defense:  8,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'swarm      ', count:20,  hp:    529,  defense: 10,  speed:175,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:   9963,  defense: 10,  speed: 70,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W11~W15
    { waveType:'normal     ', count:10,  hp:   1463,  defense: 12,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:    567,  defense: 60,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   2020,  defense: 14,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   2379,  defense: 16,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:   1403,  defense: 18,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W16~W20
    { waveType:'treasure   ', count: 1,  hp:  33190,  defense: 20,  speed: 72,  boss:false,  burnImmune:false,  slowImmune:true ,  chainImmune:false,  frozenImmune:true ,  drawReward:1,  isTreasure:true,  treasureReward:20,  expOrbs:0 },
    { waveType:'normal     ', count:10,  hp:   3936,  defense: 22,  speed: 74,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   4680,  defense: 24,  speed: 76,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:   2790,  defense: 24,  speed:195,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:  40034,  defense: 25,  speed: 80,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W21~W25
    { waveType:'normal     ', count:10,  hp:   7999,  defense: 25,  speed: 82,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:   3172,  defense:100,  speed: 84,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  11577,  defense: 26,  speed: 86,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  13974,  defense: 28,  speed: 88,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:   8449,  defense: 30,  speed: 90,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W26~W30
    { waveType:'normal     ', count:10,  hp:  20468,  defense: 32,  speed: 92,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  24831,  defense: 34,  speed: 94,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  30164,  defense: 36,  speed: 96,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:  18343,  defense: 38,  speed:245,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp: 223323,  defense: 40,  speed:100,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:0,  reward:20,  expOrbs:0 },
  ],
  2: [
    // W1  ~W5
    { waveType:'normal     ', count: 5,  hp:    150,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    266,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    396,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 6,  hp:    506,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count: 7,  hp:    315,  defense:  2,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W6~W10
    { waveType:'normal     ', count: 8,  hp:    770,  defense:  4,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 9,  hp:    930,  defense:  6,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   1116,  defense:  8,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'swarm      ', count:20,  hp:    667,  defense: 10,  speed:175,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:  12717,  defense: 10,  speed: 70,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W11~W15
    { waveType:'normal     ', count:10,  hp:   1894,  defense: 12,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:    745,  defense: 60,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   2697,  defense: 14,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   3228,  defense: 16,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:   1936,  defense: 18,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W16~W20
    { waveType:'treasure   ', count: 1,  hp:  46593,  defense: 20,  speed: 72,  boss:false,  burnImmune:false,  slowImmune:true ,  chainImmune:false,  frozenImmune:true ,  drawReward:1,  isTreasure:true,  treasureReward:20,  expOrbs:0 },
    { waveType:'normal     ', count:10,  hp:   5621,  defense: 22,  speed: 74,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   6801,  defense: 24,  speed: 76,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:   4125,  defense: 24,  speed:195,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:  60211,  defense: 25,  speed: 80,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W21~W25
    { waveType:'normal     ', count:10,  hp:  12235,  defense: 25,  speed: 82,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:   4933,  defense:100,  speed: 84,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  18301,  defense: 26,  speed: 86,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  22445,  defense: 28,  speed: 88,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:  13785,  defense: 30,  speed: 90,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W26~W30
    { waveType:'normal     ', count:10,  hp:  33911,  defense: 32,  speed: 92,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  41762,  defense: 34,  speed: 94,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  51483,  defense: 36,  speed: 96,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:  31762,  defense: 38,  speed:245,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp: 392214,  defense: 40,  speed:100,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:0,  reward:20,  expOrbs:0 },
  ],
  3: [
    // W1  ~W5
    { waveType:'normal     ', count: 5,  hp:    180,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    316,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count: 5,  hp:    464,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 6,  hp:    596,  defense:  2,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count: 7,  hp:    373,  defense:  2,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W6~W10
    { waveType:'normal     ', count: 8,  hp:    920,  defense:  4,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count: 9,  hp:   1123,  defense:  6,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   1363,  defense:  8,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'swarm      ', count:20,  hp:    824,  defense: 10,  speed:175,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:  15921,  defense: 10,  speed: 70,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W11~W15
    { waveType:'normal     ', count:10,  hp:   2405,  defense: 12,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:    960,  defense: 60,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   3528,  defense: 14,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   4289,  defense: 16,  speed: 70,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:   2614,  defense: 18,  speed: 70,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W16~W20
    { waveType:'treasure   ', count: 1,  hp:  63916,  defense: 20,  speed: 72,  boss:false,  burnImmune:false,  slowImmune:true ,  chainImmune:false,  frozenImmune:true ,  drawReward:1,  isTreasure:true,  treasureReward:20,  expOrbs:0 },
    { waveType:'normal     ', count:10,  hp:   7837,  defense: 22,  speed: 74,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:   9635,  defense: 24,  speed: 76,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:   5938,  defense: 24,  speed:195,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp:  88045,  defense: 25,  speed: 80,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  reward:20,  expOrbs:10 },
    // W21~W25
    { waveType:'normal     ', count:10,  hp:  18170,  defense: 25,  speed: 82,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'heavyArmor ', count:10,  hp:   7439,  defense:100,  speed: 84,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  28014,  defense: 26,  speed: 86,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  34866,  defense: 28,  speed: 88,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'magicImm   ', count:10,  hp:  21725,  defense: 30,  speed: 90,  boss:false,  burnImmune:true ,  slowImmune:true ,  chainImmune:true ,  frozenImmune:true ,  drawReward:2,  expOrbs:1 },
    // W26~W30
    { waveType:'normal     ', count:10,  hp:  54206,  defense: 32,  speed: 92,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  67691,  defense: 34,  speed: 94,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  expOrbs:1 },
    { waveType:'normal     ', count:10,  hp:  84599,  defense: 36,  speed: 96,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:1,  expOrbs:1 },
    { waveType:'swarm      ', count:25,  hp:  52902,  defense: 38,  speed:245,  boss:false,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:2,  spawnInterval:0.38,  expOrbs:1 },
    { waveType:'boss       ', count: 1,  hp: 661996,  defense: 40,  speed:100,  boss:true ,  burnImmune:false,  slowImmune:false,  chainImmune:false,  frozenImmune:false,  drawReward:0,  reward:20,  expOrbs:0 },
  ],
};
