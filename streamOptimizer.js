// streamOptimizer.js
export class StreamOptimizer {
  constructor(config) {
    this.minDelay = config.minDelay || 0.002; // 极速模式下的延迟
    this.maxDelay = config.maxDelay || 0.02;  // 优雅模式下的延迟
    this.bufferThreshold = 40; // 缓冲区警戒线：积压超过40个字符就开始“冲刺”
    this.internalBuffer = "";
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * 核心逻辑：根据当前缓冲区积压情况，动态决定本次吐字量和延迟
   */
  async *process(text) {
    this.internalBuffer += text;

    while (this.internalBuffer.length > 0) {
      const backlog = this.internalBuffer.length;
      let chunkSize = 1;
      let delay = this.maxDelay;

      if (backlog > this.bufferThreshold * 2) {
        // 严重积压：进入“狂暴模式”，大块输出，极低延迟
        chunkSize = Math.min(backlog, 15); 
        delay = this.minDelay;
      } else if (backlog > this.bufferThreshold) {
        // 轻度积压：加速追赶
        chunkSize = Math.min(backlog, 5);
        delay = this.minDelay * 2;
      } else {
        // 缓冲区轻松：优雅打字机模式
        chunkSize = 1;
        // 越接近空缓冲区，延迟越接近 maxDelay
        const ratio = backlog / this.bufferThreshold;
        delay = this.maxDelay - (this.maxDelay - this.minDelay) * (1 - ratio);
      }

      // 提取并输出
      const part = this.internalBuffer.substring(0, chunkSize);
      this.internalBuffer = this.internalBuffer.substring(chunkSize);
      
      yield part;

      // 关键：如果上游速度极快，我们需要通过减小 sleep 时间来让路
      if (delay > 0) {
        await this._sleep(delay);
      }
    }
  }
}
