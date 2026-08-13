import api from './core.cjs';

/** 默认的境外受限探测地址。 */
export const DEFAULT_BLOCKED = api.DEFAULT_BLOCKED;

/** 默认的中国大陆探测地址。 */
export const DEFAULT_DOMESTIC = api.DEFAULT_DOMESTIC;

/** 检测当前网络出口是否位于 GFW 内，并返回详细结果。 */
export const detectGfw = api.detectGfw;

/** 检查 `https://raw.githubusercontent.com/` 是否可访问。 */
export const isGithubRawAccessible = api.isGithubRawAccessible;

/** 简单判断当前网络出口是否位于 GFW 内。 */
export const isInGfw = api.isInGfw;
