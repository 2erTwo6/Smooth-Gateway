// config.js (支持完全可配置)

export const config = {
  // 从环境变量读取端口，如果没有则默认为 3001
  port: process.env.PORT || 3001,
  
  // 从环境变量读取上游API地址，这是一个必需项
  upstreamApiUrl: process.env.UPSTREAM_API_URL,

  // 流式优化参数，现在全部可以通过环境变量进行配置
  // 如果环境变量未设置，则使用 || 后面的默认值
  optimizer: {
    // 浮点数，使用 parseFloat 转换
    minDelay: parseFloat(process.env.STREAM_MIN_DELAY) || 0.016,
    maxDelay: parseFloat(process.env.STREAM_MAX_DELAY) || 0.024,

    // 整数，使用 parseInt 转换
    shortTextThreshold: parseInt(process.env.STREAM_SHORT_TEXT_THRESHOLD) || 10,
    longTextThreshold: parseInt(process.env.STREAM_LONG_TEXT_THRESHOLD) || 50,
    chunkSize: parseInt(process.env.STREAM_CHUNK_SIZE) || 5,
  }
};
