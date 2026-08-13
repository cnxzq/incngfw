export type DetectionStatus = 'inside' | 'outside' | 'unknown';
export type DetectionConfidence = 'high' | 'medium' | 'none';
export type ProbeError = 'timeout' | 'dns' | 'refused' | 'reset' | 'tls' | 'network';

export interface DetectOptions {
  /** URLs normally restricted by the GFW. */
  blocked?: ReadonlyArray<string | URL>;
  /** URLs expected to be reachable from mainland China. */
  domestic?: ReadonlyArray<string | URL>;
  /** Timeout for each probe in milliseconds. Defaults to 1000. */
  timeout?: number;
  /** Completed-result cache lifetime in milliseconds. Defaults to 1000. */
  cacheTtl?: number;
}

export interface ProbeResult {
  url: string;
  reachable: boolean;
  durationMs: number;
  statusCode?: number;
  error?: ProbeError;
}

export interface DetectionResult {
  inGfw: boolean | null;
  status: DetectionStatus;
  confidence: DetectionConfidence;
  durationMs: number;
  evidence: {
    network: {
      blocked: ProbeResult[];
      domestic: ProbeResult[];
    };
    system: {
      timeZone: string | null;
      isChinaTimeZone: boolean | null;
    };
  };
}

export declare const DEFAULT_BLOCKED: readonly string[];
export declare const DEFAULT_DOMESTIC: readonly string[];
export declare function detectGfw(options?: DetectOptions): Promise<DetectionResult>;
export declare function isInGfw(options?: DetectOptions): Promise<boolean | null>;
