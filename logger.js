// logger.js

// 读取环境变量 LOG_LEVEL，如果没有设置，则默认为 'debug'
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

/**
 * 自定义的智能日志记录器。
 * 只有在 LOG_LEVEL 不为 'silent' 时才打印日志。
 * @param {...any} args - 要打印的内容，用法与 console.log 完全相同。
 */
export function log(...args) {
  if (LOG_LEVEL !== 'silent') {
    // 如果不是静默模式，就调用真正的 console.log
    console.log(...args);
  }
}
