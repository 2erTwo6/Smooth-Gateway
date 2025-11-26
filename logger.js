// logger.js (最终修正版)

// 读取环境变量 LOG_LEVEL，如果没有设置，则默认为 'debug'
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

// 创建一个日志对象，包含 log 和 error 两个方法
const logger = {
  /**
   * 打印常规日志 (info/debug)。
   * 如果 LOG_LEVEL 设置为 'silent'，则此日志不输出。
   * @param {...any} args - 要打印的内容。
   */
  log: (...args) => {
    if (LOG_LEVEL !== 'silent') {
      // 增加时间戳，便于调试
      console.log(new Date().toISOString(), ...args);
    }
  },

  /**
   * 打印错误日志。
   * 错误日志是关键信息，不应被静默模式抑制，确保任何时候都能看到问题。
   * @param {...any} args - 要打印的错误信息。
   */
  error: (...args) => {
    // 使用 console.error，并始终打印
    console.error(new Date().toISOString(), '[ERROR]', ...args);
  }
};

// 导出整个日志对象
export const log = logger;
