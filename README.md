# incngfw

[English](./docs/README.en.md) | 简体中文

判断 Node.js 当前网络出口是否位于 GFW 内。支持 ESM、CommonJS、TypeScript 和 CLI，零依赖、无需构建。

> 检测结果是根据目标可达性得出的启发式判断，不是地理定位。使用 VPN、代理或透明网关时，结果表示 Node.js 实际使用的网络出口。

## 为什么创建这个包

许多 Node.js 软件包会在安装、初始化或更新阶段下载额外资源，例如二进制文件、模型、模板、规则库或 GitHub Raw 上的配置。在中国大陆网络环境中，这些境外资源可能超时或不可访问，导致安装过程长时间等待、失败，甚至留下不完整状态。

`incngfw` 用于在执行下载前快速判断当前网络出口和关键服务的可达性，让软件包能够选择更可靠且合规的资源策略。例如：

- 墙外或 GitHub Raw 可访问时，使用项目的官方境外资源。
- 可能位于 GFW 内时，使用项目维护者明确提供、内容经过校验的境内镜像，例如 Gitee、境内对象存储或合规 CDN。
- 检测结果为 `unknown` 时，不应直接假定用户位于墙内；应提示用户选择、允许重试，或使用可恢复的保守策略。

这个包只提供网络环境信号，不会自动修改 npm registry、代理、DNS 或下载地址。调用方应自行确保备用资源拥有合法授权、与官方内容一致，并符合所在地区及组织的安全与合规要求。它不应用于绕过访问控制或规避网络政策。

## 环境要求

- Node.js 16 或更高版本

## 安装

```sh
npm install incngfw
```

## 使用

```js
import { detectGfw, isInGfw } from 'incngfw';

const result = await detectGfw();
console.log(result.status);     // 'inside' | 'outside' | 'unknown'
console.log(result.confidence); // 'high' | 'medium' | 'none'
console.log(result.evidence);

const value = await isInGfw(); // true | false | null
```

CommonJS：

```js
const { detectGfw, isInGfw } = require('incngfw');
```

### 检查 GitHub Raw

```js
import { isGithubRawAccessible } from 'incngfw';

const accessible = await isGithubRawAccessible();
```

该方法专门检查 `https://raw.githubusercontent.com/` 是否可访问，返回 `boolean`。默认超时和缓存时间均为 `1000ms`，可传入 `{ timeout, cacheTtl }` 覆盖；相同配置的并发调用会共享同一次检查。

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
npx incngfw
npx incngfw --json
npx incngfw --timeout 1500 --no-cache
npx incngfw --blocked https://example.com --domestic https://example.cn
```

执行 `npx incngfw --help` 查看所有参数。退出码为：墙内 `0`、墙外 `1`、未知 `2`、参数错误 `64`。

普通模式会在 stderr 显示检测进度；`--json` 模式不会输出进度信息，便于程序直接解析 stdout。`timeout` 是从创建请求开始计算的整体截止时间，包含 DNS、TCP 和 TLS 建连阶段。

## 开发

更多用法和生产环境建议参见 [`examples/`](./examples/README.md)。

```sh
npm test
```

测试只使用 Node.js 内置模块和本地 HTTP 服务，不依赖实际公网环境。ESM、CommonJS、CLI 与 TypeScript 声明文件均直接维护。
