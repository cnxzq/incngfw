# ingfw

[English](./docs/README.en.md) | 简体中文

判断 Node.js 当前网络出口是否位于 GFW 内。支持 ESM、CommonJS、TypeScript 和 CLI，零依赖、无需构建。

> 检测结果是根据目标可达性得出的启发式判断，不是地理定位。使用 VPN、代理或透明网关时，结果表示 Node.js 实际使用的网络出口。

## 环境要求

- Node.js 16 或更高版本

## 安装

```sh
npm install ingfw
```

## 使用

```js
import { detectGfw, isInGfw } from 'ingfw';

const result = await detectGfw();
console.log(result.status);     // 'inside' | 'outside' | 'unknown'
console.log(result.confidence); // 'high' | 'medium' | 'none'
console.log(result.evidence);

const value = await isInGfw(); // true | false | null
```

CommonJS：

```js
const { detectGfw, isInGfw } = require('ingfw');
```

### 自定义检测

```js
const result = await detectGfw({
  blocked: ['https://www.google.com/generate_204'],
  domestic: ['https://www.baidu.com/'],
  timeout: 1000,
  cacheTtl: 1000,
});
```

- `blocked`：通常在 GFW 内受限的 HTTP(S) 地址数组。
- `domestic`：预计在中国大陆可访问的 HTTP(S) 地址数组。
- `timeout`：每个目标的超时时间，默认 `1000ms`。
- `cacheTtl`：完成结果的缓存时间，默认 `1000ms`；设为 `0` 可关闭完成结果缓存。

相同配置的并发调用共享同一次检测。检查完成后的 1 秒内也会复用同一个结果；即使关闭缓存，同时发生的调用仍会合并。

默认并行探测 Google、YouTube、百度和 QQ。境外目标任一可达时判断为墙外；境外目标均不可达且境内目标至少一个可达时判断为可能在墙内；两侧均不可达时返回 `unknown`。中国时区只作为辅助证据，不单独影响结论。

## CLI

```sh
npx ingfw
npx ingfw --json
npx ingfw --timeout 1500 --no-cache
npx ingfw --blocked https://example.com --domestic https://example.cn
```

执行 `npx ingfw --help` 查看所有参数。退出码为：墙内 `0`、墙外 `1`、未知 `2`、参数错误 `64`。

## 开发

```sh
npm test
```

测试只使用 Node.js 内置模块和本地 HTTP 服务，不依赖实际公网环境。ESM、CommonJS、CLI 与 TypeScript 声明文件均直接维护。
