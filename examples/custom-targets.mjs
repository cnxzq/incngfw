import { detectGfw } from 'incngfw';

const result = await detectGfw({
  blocked: [
    'https://www.google.com/generate_204',
    'https://www.youtube.com/',
  ],
  domestic: [
    'https://www.baidu.com/',
    'https://www.qq.com/',
  ],
  timeout: 1500,
  cacheTtl: 5000,
});

console.log(result);
