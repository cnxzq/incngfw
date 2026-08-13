#!/usr/bin/env node
'use strict';

const { detectGfw } = require('../lib/index.cjs');
const { version } = require('../package.json');

const HELP = `用法: ingfw [选项]

判断 Node.js 当前网络出口是否位于 GFW 内。

选项:
  --blocked <url>   境外受限探测目标，可重复使用
  --domestic <url>  境内探测目标，可重复使用
  --timeout <ms>    单个探测的超时时间（默认: 1000）
  --no-cache        不缓存已完成的检测结果
  --json            输出完整 JSON 结果
  -h, --help        显示帮助
  -v, --version     显示版本
`;

function argumentError(message) {
  const error = new Error(message);
  error.isArgumentError = true;
  return error;
}

function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw argumentError(`${flag} 需要一个值`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {};
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--json') json = true;
    else if (flag === '--no-cache') options.cacheTtl = 0;
    else if (flag === '--blocked' || flag === '--domestic') {
      const name = flag.slice(2);
      const value = nextValue(argv, index, flag);
      if (!options[name]) options[name] = [];
      options[name].push(value);
      index += 1;
    } else if (flag === '--timeout') {
      const value = nextValue(argv, index, flag);
      if (!/^\d+(?:\.\d+)?$/.test(value) || Number(value) <= 0) {
        throw argumentError('--timeout 必须是正数');
      }
      options.timeout = Number(value);
      index += 1;
    } else {
      throw argumentError(`未知选项: ${flag}`);
    }
  }
  return { json, options };
}

function humanOutput(result) {
  const label = {
    inside: '当前网络出口可能位于 GFW 内',
    outside: '当前网络出口位于 GFW 外',
    unknown: '无法判断当前网络出口',
  }[result.status];
  const blocked = result.evidence.network.blocked.filter((item) => item.reachable).length;
  const domestic = result.evidence.network.domestic.filter((item) => item.reachable).length;
  return `${label}\n境外目标可达 ${blocked}/${result.evidence.network.blocked.length}，境内目标可达 ${domestic}/${result.evidence.network.domestic.length}，耗时 ${result.durationMs}ms\n`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP);
    return 0;
  }
  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`${version}\n`);
    return 0;
  }

  const { json, options } = parseArgs(args);
  const result = await detectGfw(options);
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : humanOutput(result));
  return result.status === 'inside' ? 0 : result.status === 'outside' ? 1 : 2;
}

main().then(
  (code) => { process.exitCode = code; },
  (error) => {
    process.stderr.write(`ingfw: ${error.message}\n`);
    process.exitCode = error.isArgumentError || error instanceof TypeError ? 64 : 2;
  },
);
