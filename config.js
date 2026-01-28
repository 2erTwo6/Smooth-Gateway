// config.js
/**
 * 智能流控网关配置文件
 * 支持通过环境变量 (Environment Variables) 实时调整参数
 */
export const config = {
  // 网关服务监听端口
  port: process.env.PORT || 3001,

  // 上游 AI API 的基础地址 (例如: https://api.deepseek.com/v1)
  // 启动时必须设置此环境变量
  upstreamApiUrl: process.env.UPSTREAM_API_URL || '',

  // 流式输出优化器参数
  optimizer: {
    /**
     * 最小延迟 (秒)
     * 当缓冲区积压严重时使用的延迟。
     * 0.001 代表 1ms，几乎感知不到延迟，用于极速追赶上游进度。
     */
    minDelay: parseFloat(process.env.STREAM_MIN_DELAY) || 0.001,

    /**
     * 最大延迟 (秒)
     * 当输出顺畅、无积压时使用的标准打字机延迟。
     * 0.015 ~ 0.02 之间能提供非常优雅的视觉阅读节奏。
     */
    maxDelay: parseFloat(process.env.STREAM_MAX_DELAY) || 0.015,

    /**
     * 缓冲区积压阈值 (字符数)
     * 当网关中积压的字符超过这个数值时，优化器会开始加速输出。
     * 对于 150 Tokens/s 的模型，建议设置在 30-50 之间。
     */
    bufferThreshold: parseInt(process.env.STREAM_BUFFER_THRESHOLD) || 30,

    /**
     * 默认分块大小 (字符数)
     * 在非极端积压情况下，单次吐字的最小单位。
     */
    chunkSize: parseInt(process.env.STREAM_CHUNK_SIZE) || 1,
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: process.env.LOG_ENABLED !== 'false'
  }
};
