'use strict';

const http = require('node:http');
const https = require('node:https');

const DEFAULT_BLOCKED = Object.freeze([
  'https://www.google.com/generate_204',
  'https://www.youtube.com/',
]);
const DEFAULT_DOMESTIC = Object.freeze([
  'https://www.baidu.com/',
  'https://www.qq.com/',
]);
const DEFAULT_TIMEOUT = 1000;
const DEFAULT_CACHE_TTL = 1000;
const CHINA_TIME_ZONES = new Set([
  'Asia/Shanghai',
  'Asia/Chongqing',
  'Asia/Urumqi',
  'Asia/Beijing',
  'PRC',
]);

const sharedChecks = new Map();

function normalizeUrl(value, optionName) {
  let url;
  try {
    url = value instanceof URL ? new URL(value.href) : new URL(value);
  } catch {
    throw new TypeError(`${optionName} must contain valid URLs`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError(`${optionName} only supports HTTP(S) URLs`);
  }
  return url.href;
}

function normalizeOptions(options) {
  if (options == null) options = {};
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }

  const blockedInput = options.blocked === undefined ? DEFAULT_BLOCKED : options.blocked;
  const domesticInput = options.domestic === undefined ? DEFAULT_DOMESTIC : options.domestic;
  if (!Array.isArray(blockedInput) || blockedInput.length === 0) {
    throw new TypeError('blocked must be a non-empty array');
  }
  if (!Array.isArray(domesticInput) || domesticInput.length === 0) {
    throw new TypeError('domestic must be a non-empty array');
  }

  const timeout = options.timeout === undefined ? DEFAULT_TIMEOUT : options.timeout;
  const cacheTtl = options.cacheTtl === undefined ? DEFAULT_CACHE_TTL : options.cacheTtl;
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new TypeError('timeout must be a positive finite number');
  }
  if (!Number.isFinite(cacheTtl) || cacheTtl < 0) {
    throw new TypeError('cacheTtl must be a non-negative finite number');
  }

  return {
    blocked: blockedInput.map((value) => normalizeUrl(value, 'blocked')),
    domestic: domesticInput.map((value) => normalizeUrl(value, 'domestic')),
    timeout,
    cacheTtl,
  };
}

function normalizeError(error, timedOut) {
  if (timedOut) return 'timeout';
  const code = error && typeof error.code === 'string' ? error.code : '';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'dns';
  if (code === 'ECONNREFUSED') return 'refused';
  if (code === 'ECONNRESET' || code === 'EPIPE') return 'reset';
  if (code === 'ETIMEDOUT') return 'timeout';
  if (code.startsWith('CERT_') || code.includes('TLS')) return 'tls';
  return 'network';
}

function probe(url, timeout) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let settled = false;
    let timedOut = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve({ url, durationMs: Date.now() - startedAt, ...value });
    };
    const transport = url.startsWith('https:') ? https : http;
    const request = transport.request(url, { method: 'HEAD' }, (response) => {
      response.resume();
      finish({ reachable: true, statusCode: response.statusCode });
      request.destroy();
    });
    request.setTimeout(timeout, () => {
      timedOut = true;
      request.destroy(new Error('Probe timed out'));
    });
    request.once('error', (error) => {
      finish({ reachable: false, error: normalizeError(error, timedOut) });
    });
    request.end();
  });
}

function systemEvidence() {
  let timeZone = null;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    // Intl data may be unavailable in custom Node.js builds.
  }
  return {
    timeZone,
    isChinaTimeZone: timeZone === null ? null : CHINA_TIME_ZONES.has(timeZone),
  };
}

async function runCheck(options) {
  const startedAt = Date.now();
  const [blocked, domestic] = await Promise.all([
    Promise.all(options.blocked.map((url) => probe(url, options.timeout))),
    Promise.all(options.domestic.map((url) => probe(url, options.timeout))),
  ]);

  let inGfw = null;
  let status = 'unknown';
  let confidence = 'none';
  if (blocked.some((item) => item.reachable)) {
    inGfw = false;
    status = 'outside';
    confidence = 'high';
  } else if (domestic.some((item) => item.reachable)) {
    inGfw = true;
    status = 'inside';
    confidence = 'medium';
  }

  return {
    inGfw,
    status,
    confidence,
    durationMs: Date.now() - startedAt,
    evidence: {
      network: { blocked, domestic },
      system: systemEvidence(),
    },
  };
}

function detectGfw(options) {
  const normalized = normalizeOptions(options);
  const key = JSON.stringify(normalized);
  const now = Date.now();
  const existing = sharedChecks.get(key);
  if (existing) {
    if (existing.promise) return existing.promise;
    if (existing.expiresAt > now) return Promise.resolve(existing.result);
    sharedChecks.delete(key);
  }

  const entry = {};
  const promise = runCheck(normalized).then(
    (result) => {
      if (normalized.cacheTtl > 0) {
        entry.promise = null;
        entry.result = result;
        entry.expiresAt = Date.now() + normalized.cacheTtl;
        entry.timer = setTimeout(() => {
          if (sharedChecks.get(key) === entry) sharedChecks.delete(key);
        }, normalized.cacheTtl);
        if (typeof entry.timer.unref === 'function') entry.timer.unref();
      } else {
        sharedChecks.delete(key);
      }
      return result;
    },
    (error) => {
      sharedChecks.delete(key);
      throw error;
    },
  );
  entry.promise = promise;
  sharedChecks.set(key, entry);
  return promise;
}

async function isInGfw(options) {
  return (await detectGfw(options)).inGfw;
}

module.exports = {
  DEFAULT_BLOCKED,
  DEFAULT_DOMESTIC,
  detectGfw,
  isInGfw,
};
