# incngfw

English | [简体中文](../README.md)

Detect whether the effective Node.js network exit is inside the GFW. Supports ESM, CommonJS, TypeScript, and a CLI with zero dependencies and no build step.

> Results are heuristic reachability assessments, not geolocation. With a VPN, proxy, or transparent gateway, the result represents the network exit actually used by Node.js.

## Why this package exists

Many Node.js packages download additional assets during installation, initialization, or updates, such as binaries, models, templates, rule sets, or configuration from GitHub Raw. In mainland China, these overseas resources may time out or be unreachable, causing long installation delays, failures, or partially initialized software.

`incngfw` provides a quick network-exit and service-reachability signal before a download starts, allowing packages to choose a reliable and compliant resource strategy. For example:

- Use the project's official overseas source when outside the GFW or when GitHub Raw is reachable.
- When the network is probably inside the GFW, use a maintainer-provided and integrity-verified mainland mirror, such as Gitee, mainland object storage, or a compliant CDN.
- When the result is `unknown`, do not assume the user is inside the GFW. Offer an explicit choice, retry, or use a recoverable conservative path.

This package only reports network signals. It does not automatically change the npm registry, proxy, DNS, or download URL. Callers remain responsible for ensuring that fallback resources are authorized, match the official content, and comply with applicable regional and organizational security policies. It must not be used to bypass access controls or evade network policies.

## Requirements

- Node.js 16 or newer

## Installation

```sh
npm install incngfw
```

## Usage

```js
import { detectGfw, isInGfw } from 'incngfw';

const result = await detectGfw();
console.log(result.status);      // 'inside' | 'outside' | 'unknown'
console.log(result.confidence); // 'high' | 'medium' | 'none'
console.log(result.evidence);

const value = await isInGfw(); // true | false | null
```

CommonJS:

```js
const { detectGfw, isInGfw } = require('incngfw');
```

### Check GitHub Raw

```js
import { isGithubRawAccessible } from 'incngfw';

const accessible = await isGithubRawAccessible();
```

This method checks whether `https://raw.githubusercontent.com/` is reachable and returns a `boolean`. Its timeout and cache lifetime both default to `1000ms` and can be overridden with `{ timeout, cacheTtl }`. Concurrent calls with identical options share one check.

### Custom probes

```js
const result = await detectGfw({
  blocked: ['https://www.google.com/generate_204'],
  domestic: ['https://www.baidu.com/'],
  timeout: 1000,
  cacheTtl: 1000,
});
```

- `blocked`: HTTP(S) URLs normally restricted inside the GFW.
- `domestic`: HTTP(S) URLs expected to be reachable from mainland China.
- `timeout`: timeout for each target, defaulting to `1000ms`.
- `cacheTtl`: completed-result cache lifetime, defaulting to `1000ms`; use `0` to disable completed-result caching.

Concurrent calls with identical options share one check. The completed result is reused for one second. Even with caching disabled, concurrent calls are still coalesced.

By default, Google, YouTube, Baidu, and QQ are probed in parallel. Any reachable blocked target means outside; at least one reachable domestic target while every blocked target is unreachable means probably inside; if neither side is reachable, the result is `unknown`. The system time zone is included only as supporting evidence and never determines the result by itself.

## CLI

```sh
npx incngfw
npx incngfw --json
npx incngfw --timeout 1500 --no-cache
npx incngfw --blocked https://example.com --domestic https://example.cn
```

Run `npx incngfw --help` for all options. Exit codes are: inside `0`, outside `1`, unknown `2`, and invalid arguments `64`.

Human-readable mode reports progress on stderr. `--json` suppresses progress output so programs can parse stdout directly. The timeout is an overall deadline measured from request creation and includes DNS, TCP, and TLS connection setup.

## Development

See [`examples/`](../examples/README.md) for more usage patterns and production recommendations.

```sh
npm test
```

Tests use only Node.js built-ins and a local HTTP server, so they do not depend on the public network. The ESM, CommonJS, CLI, and TypeScript declaration files are maintained directly.
