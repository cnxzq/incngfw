/** GFW 检测状态。 */
export type DetectionStatus = 'inside' | 'outside' | 'unknown';

/** 检测结果的置信度。 */
export type DetectionConfidence = 'high' | 'medium' | 'none';

/** 网络探测失败原因。 */
export type ProbeError = 'timeout' | 'dns' | 'refused' | 'reset' | 'tls' | 'network';

/** GFW 检测配置。 */
export interface DetectOptions {
  /** 通常在 GFW 内受限的 HTTP(S) 地址。默认探测 Google 和 YouTube。 */
  blocked?: ReadonlyArray<string | URL>;
  /** 预计在中国大陆可访问的 HTTP(S) 地址。默认探测百度和 QQ。 */
  domestic?: ReadonlyArray<string | URL>;
  /** 每个目标的超时时间，单位为毫秒。默认为 `1000`。 */
  timeout?: number;
  /** 完成结果的缓存时间，单位为毫秒。默认为 `1000`，设为 `0` 可关闭缓存。 */
  cacheTtl?: number;
}

/** 单一地址可访问性检查配置。 */
export interface AccessibilityOptions {
  /** 请求超时时间，单位为毫秒。默认为 `1000`。 */
  timeout?: number;
  /** 完成结果的缓存时间，单位为毫秒。默认为 `1000`，设为 `0` 可关闭缓存。 */
  cacheTtl?: number;
}

/** 单个网络目标的探测结果。 */
export interface ProbeResult {
  /** 规范化后的探测地址。 */
  url: string;
  /** 是否收到目标服务器的 HTTP 响应。 */
  reachable: boolean;
  /** 探测耗时，单位为毫秒。 */
  durationMs: number;
  /** 目标返回的 HTTP 状态码；探测失败时不存在。 */
  statusCode?: number;
  /** 规范化后的失败原因；探测成功时不存在。 */
  error?: ProbeError;
}

/** GFW 网络环境检测的详细结果。 */
export interface DetectionResult {
  /** 是否位于 GFW 内；无法判断时为 `null`。 */
  inGfw: boolean | null;
  /** 检测状态：墙内、墙外或未知。 */
  status: DetectionStatus;
  /** 当前结论的置信度。 */
  confidence: DetectionConfidence;
  /** 整次检测的总耗时，单位为毫秒。 */
  durationMs: number;
  /** 用于形成结论的网络和系统证据。 */
  evidence: {
    /** 网络目标探测结果。 */
    network: {
      /** 境外受限目标的探测结果。 */
      blocked: ProbeResult[];
      /** 境内目标的探测结果。 */
      domestic: ProbeResult[];
    };
    /** 仅供参考、不单独决定结论的系统信息。 */
    system: {
      /** 当前系统时区；无法获取时为 `null`。 */
      timeZone: string | null;
      /** 当前时区是否属于中国时区；无法获取时为 `null`。 */
      isChinaTimeZone: boolean | null;
    };
  };
}

/** 默认的境外受限探测地址。 */
export declare const DEFAULT_BLOCKED: readonly string[];

/** 默认的中国大陆探测地址。 */
export declare const DEFAULT_DOMESTIC: readonly string[];

/**
 * 检测 Node.js 当前使用的网络出口是否位于 GFW 内。
 *
 * 相同配置的并发调用会共享同一次检查。普通网络错误会记录在结果中，
 * 不会导致 Promise 被拒绝。
 */
export declare function detectGfw(options?: DetectOptions): Promise<DetectionResult>;

/**
 * 检查 `https://raw.githubusercontent.com/` 是否可访问。
 *
 * 收到任意 HTTP 响应时返回 `true`；超时、DNS、TLS 或连接错误时返回 `false`。
 */
export declare function isGithubRawAccessible(options?: AccessibilityOptions): Promise<boolean>;

/**
 * 简单判断当前网络出口是否位于 GFW 内。
 *
 * @returns 位于墙内时为 `true`，位于墙外时为 `false`，无法判断时为 `null`。
 */
export declare function isInGfw(options?: DetectOptions): Promise<boolean | null>;
