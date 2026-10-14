const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('关卡表.xlsx');

const typeMap = {
  '普通': 'normal',
  '魔免': 'magicImm',
  '护甲': 'heavyArmor',
  '蚁群': 'swarm',
  'BOSS': 'boss',
  '宝箱': 'treasure',
};

function getImmunes(wt) {
  if (wt === 'magicImm') return { burnImmune: true,  slowImmune: true,  chainImmune: true,  frozenImmune: true  };
  if (wt === 'treasure') return { burnImmune: false, slowImmune: true,  chainImmune: false, frozenImmune: true  };
  return              { burnImmune: false, slowImmune: false, chainImmune: false, frozenImmune: false };
}

const stageNames = ['大关1', '大关2', '大关3'];
const groupLabels = ['W1  ~W5', 'W6~W10', 'W11~W15', 'W16~W20', 'W21~W25', 'W26~W30'];

let newBlock = '// 三大关原始数据（血量/防御/数量/速度 来自Excel，其余字段保持统一结构）\nconst STAGE_RAW_DATA = {\n';

stageNames.forEach((shName, si) => {
  const ws = wb.Sheets[shName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const dataRows = rows.slice(1).filter(r => r[0] && typeof r[0] === 'number');

  newBlock += `  ${si + 1}: [\n`;
  dataRows.forEach((row, idx) => {
    if (idx % 5 === 0) newBlock += `    // ${groupLabels[idx / 5]}\n`;
    const [waveNum, typeZh, count, hp, defense, speed, , expOrbs, drawReward] = row;
    const wt = typeMap[typeZh] || 'normal';
    const hpR = Math.round(hp);
    const im = getImmunes(wt);
    const isBoss = wt === 'boss', isTreasure = wt === 'treasure', isSwarm = wt === 'swarm';

    let line = `    { waveType:'${wt}',`;
    line += ` count:${count},`;
    line += ` hp:${hpR},`;
    line += ` defense:${defense},`;
    line += ` speed:${speed},`;
    line += ` boss:${isBoss},`;
    line += ` burnImmune:${im.burnImmune},`;
    line += ` slowImmune:${im.slowImmune},`;
    line += ` chainImmune:${im.chainImmune},`;
    line += ` frozenImmune:${im.frozenImmune},`;
    line += ` drawReward:${drawReward},`;
    if (isTreasure) {
      line += ` isTreasure:true, treasureReward:20, expOrbs:0`;
    } else if (isBoss) {
      line += ` reward:20, expOrbs:${waveNum === 30 ? 0 : 10}`;
    } else if (isSwarm) {
      line += ` spawnInterval:0.38, expOrbs:${expOrbs}`;
    } else {
      line += ` expOrbs:${expOrbs}`;
    }
    line += ' },\n';
    newBlock += line;
  });
  newBlock += `  ],\n`;
});
newBlock += '};';

// 读 game.js，用正则替换 STAGE_RAW_DATA 块
let src = fs.readFileSync('game.js', 'utf-8');
const re = /\/\/ 三大关原始数据[\s\S]*?^const STAGE_RAW_DATA = \{[\s\S]*?^\};/m;
if (!re.test(src)) {
  console.error('ERROR: Pattern not found');
  process.exit(1);
}
src = src.replace(re, newBlock);
fs.writeFileSync('game.js', src, 'utf-8');
console.log('game.js updated successfully');