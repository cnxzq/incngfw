import { isInGfw } from 'incngfw';

const inGfw = await isInGfw();

if (inGfw === true) {
  console.log('当前网络出口可能位于 GFW 内');
} else if (inGfw === false) {
  console.log('当前网络出口位于 GFW 外');
} else {
  console.log('网络证据不足，暂时无法判断');
}
