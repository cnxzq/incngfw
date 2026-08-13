import { detectGfw } from 'incngfw';

const result = await detectGfw();

console.log(`状态: ${result.status}`);
console.log(`置信度: ${result.confidence}`);
console.log(`耗时: ${result.durationMs}ms`);

for (const probe of result.evidence.network.blocked) {
  console.log('境外目标:', probe);
}

for (const probe of result.evidence.network.domestic) {
  console.log('境内目标:', probe);
}

// 时区仅是辅助证据，不应单独作为 GFW 判断依据。
console.log('系统时区:', result.evidence.system.timeZone);
