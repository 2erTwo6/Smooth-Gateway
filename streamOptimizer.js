export class StreamOptimizer {
  constructor(config = {}) {
    this.minDelay = config.minDelay || 0.002; 
    this.maxDelay = config.maxDelay || 0.02;  
    this.bufferThreshold = 40; 
    this.internalBuffer = "";
    this.isProcessing = false; // 防止重入竞争
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * 采用推入模式，由外部控制循环
   */
  push(text) {
    this.internalBuffer += text;
  }

  async *consume() {
    // 只要缓冲区有内容，就持续平滑输出
    while (this.internalBuffer.length > 0) {
      const backlog = this.internalBuffer.length;
      let chunkSize = 1;
      let delay = this.maxDelay;

      if (backlog > this.bufferThreshold * 2) {
        chunkSize = Math.min(backlog, 15); 
        delay = this.minDelay;
      } else if (backlog > this.bufferThreshold) {
        chunkSize = Math.min(backlog, 5);
        delay = this.minDelay * 2;
      } else {
        const ratio = backlog / this.bufferThreshold;
        delay = this.maxDelay - (this.maxDelay - this.minDelay) * (1 - ratio);
      }

      const part = this.internalBuffer.substring(0, chunkSize);
      this.internalBuffer = this.internalBuffer.substring(chunkSize);
      
      yield part;

      if (delay > 0) {
        await this._sleep(delay);
      }
    }
  }
}
