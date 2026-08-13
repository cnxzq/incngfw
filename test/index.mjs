import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

import * as esm from '../lib/index.js';

const require = createRequire(import.meta.url);
const cjs = require('../lib/index.cjs');

assert.equal(esm.detectGfw, cjs.detectGfw);
assert.equal(esm.isInGfw, cjs.isInGfw);

let requestCount = 0;
const server = http.createServer((request, response) => {
  requestCount += 1;
  const wait = request.url === '/slow' ? 200 : 0;
  setTimeout(() => {
    response.writeHead(204);
    response.end();
  }, wait);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const reachable = `http://127.0.0.1:${port}/ok`;
const slow = `http://127.0.0.1:${port}/slow`;
const unavailable = 'http://127.0.0.1:1/unavailable';

try {
  const outside = await esm.detectGfw({
    blocked: [reachable], domestic: [unavailable], timeout: 100, cacheTtl: 0,
  });
  assert.equal(outside.status, 'outside');
  assert.equal(outside.inGfw, false);
  assert.equal(outside.confidence, 'high');

  const inside = await esm.detectGfw({
    blocked: [unavailable], domestic: [reachable], timeout: 100, cacheTtl: 0,
  });
  assert.equal(inside.status, 'inside');
  assert.equal(inside.inGfw, true);
  assert.equal(inside.confidence, 'medium');
  assert.equal(await esm.isInGfw({
    blocked: [unavailable], domestic: [reachable], timeout: 100, cacheTtl: 0,
  }), true);

  const unknown = await esm.detectGfw({
    blocked: [unavailable], domestic: [unavailable], timeout: 100, cacheTtl: 0,
  });
  assert.equal(unknown.status, 'unknown');
  assert.equal(unknown.inGfw, null);
  assert.equal(unknown.confidence, 'none');

  const timeout = await esm.detectGfw({
    blocked: [slow], domestic: [unavailable], timeout: 20, cacheTtl: 0,
  });
  assert.equal(timeout.evidence.network.blocked[0].error, 'timeout');

  const concurrentOptions = {
    blocked: [reachable], domestic: [reachable], timeout: 100, cacheTtl: 50,
  };
  requestCount = 0;
  const concurrent = await Promise.all([
    esm.detectGfw(concurrentOptions),
    esm.detectGfw(concurrentOptions),
    esm.detectGfw(concurrentOptions),
  ]);
  assert.equal(requestCount, 2);
  assert.equal(concurrent[0], concurrent[1]);
  await esm.detectGfw(concurrentOptions);
  assert.equal(requestCount, 2);
  await delay(60);
  await esm.detectGfw(concurrentOptions);
  assert.equal(requestCount, 4);

  requestCount = 0;
  const noCache = { ...concurrentOptions, cacheTtl: 0 };
  await Promise.all([esm.detectGfw(noCache), esm.detectGfw(noCache)]);
  assert.equal(requestCount, 2);
  await esm.detectGfw(noCache);
  assert.equal(requestCount, 4);

  assert.throws(() => esm.detectGfw({ blocked: [], domestic: [reachable] }), /blocked/);
  assert.throws(() => esm.detectGfw({ blocked: [reachable], domestic: [] }), /domestic/);
  assert.throws(() => esm.detectGfw({ blocked: ['file:///tmp/x'], domestic: [reachable] }), /HTTP/);
  assert.throws(() => esm.detectGfw({ blocked: [reachable], domestic: [reachable], timeout: 0 }), /timeout/);
  assert.throws(() => esm.detectGfw({ blocked: [reachable], domestic: [reachable], cacheTtl: -1 }), /cacheTtl/);

  async function runCli(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['bin/ingfw.cjs', ...args], {
        cwd: new URL('..', import.meta.url),
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
      child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
      child.once('error', reject);
      child.once('close', (code) => resolve({ code, stdout, stderr }));
    });
  }

  const cliInside = await runCli([
    '--blocked', unavailable, '--domestic', reachable, '--timeout', '100', '--json', '--no-cache',
  ]);
  assert.equal(cliInside.code, 0);
  assert.equal(JSON.parse(cliInside.stdout).status, 'inside');
  const cliOutside = await runCli([
    '--blocked', reachable, '--domestic', unavailable, '--timeout', '100', '--no-cache',
  ]);
  assert.equal(cliOutside.code, 1);
  assert.match(cliOutside.stdout, /GFW 外/);
  const cliUnknown = await runCli([
    '--blocked', unavailable, '--domestic', unavailable, '--timeout', '100', '--no-cache',
  ]);
  assert.equal(cliUnknown.code, 2);
  const cliInvalid = await runCli(['--timeout', '0']);
  assert.equal(cliInvalid.code, 64);
  const cliHelp = await runCli(['--help']);
  assert.equal(cliHelp.code, 0);
  assert.match(cliHelp.stdout, /--json/);
  const cliVersion = await runCli(['--version']);
  assert.equal(cliVersion.stdout.trim(), '0.1.0');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
