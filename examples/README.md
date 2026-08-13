# 最佳实践示例

这些示例可以在项目根目录直接运行，不需要安装额外依赖。

## 示例列表

- [`basic.mjs`](./basic.mjs)：正确处理墙内、墙外和未知三种状态。
- [`details.mjs`](./details.mjs)：读取详细结果和网络证据。
- [`custom-targets.mjs`](./custom-targets.mjs)：自定义探测目标、超时和缓存。
- [`github-raw.mjs`](./github-raw.mjs)：检查 GitHub Raw 是否可访问。
- [`concurrent.mjs`](./concurrent.mjs)：在多个业务位置共享同一次检查。
- [`commonjs.cjs`](./commonjs.cjs)：在 CommonJS 项目中使用。

例如：

```sh
node examples/basic.mjs
```

## 使用建议

- 始终处理 `null` 或 `unknown`，不要把断网直接解释为位于 GFW 内。
- 优先复用默认的 1 秒缓存；同一配置的并发调用会自动合并。
- 只有在明确了解目标可达性时才覆盖默认探测地址。
- 不要使用检测结果推断用户的物理位置；结果表示 Node.js 当前网络出口。
- 如果业务只依赖 GitHub Raw，请使用 `isGithubRawAccessible()`，无需执行完整 GFW 检测。
- 在安装阶段选择下载源时，只使用项目维护者提供并经过完整性校验的备用资源，例如 Gitee、境内对象存储或合规 CDN。
- `unknown` 时应允许重试、手动选择或安全失败，不要静默切换到来源不明的镜像。
- 检测只用于提高安装可靠性和选择合规资源，不应用于绕过访问控制或网络政策。
