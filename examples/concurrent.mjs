import { detectGfw } from 'incngfw';

// 相同配置的并发调用会共享同一个 Promise，不会重复发起网络探测。
const options = {
  timeout: 1000,
  cacheTtl: 1000,
};

const [forDownload, forUpdate, forTelemetry] = await Promise.all([
  detectGfw(options),
  detectGfw(options),
  detectGfw(options),
]);

console.log(forDownload === forUpdate); // true
console.log(forUpdate === forTelemetry); // true
