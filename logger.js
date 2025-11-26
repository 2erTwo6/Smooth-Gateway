// logger.js (最终修正版 V2 - 既是函数也是对象)

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

/**
 * 创建一个既能作为函数直接调用，又可以附加属性的日志记录器。
 * 直接调用 log(...) 时，执行此函数。
 * @param {...any} args
 */
function log(...args) {
  if (LOG_LEVEL !== 'silent') {
    console.log(new Date().toISOString(), ...args);
  }
}

/**
 * 在主函数上附加 .error 方法，用于记录错误。
 * 调用 log.error(...) 时，执行此函数。
 * 错误日志应该总是被打印。
 * @param {...any} args
 */
log.error = (...args) => {
  console.error(new Date().toISOString(), '[ERROR]', ...args);
};

// 导出这个经过特殊构造的 log 函数
export { log };
