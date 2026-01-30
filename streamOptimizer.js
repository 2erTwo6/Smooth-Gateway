// streamOptimizer.js
export class StreamOptimizer {
  constructor(config = {}) {
    this.minDelay = config.minDelay || 0.002;
    this.maxDelay = config.maxDelay || 0.02;
    this.bufferThreshold = 40;
    this.internalBuffer = "";
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  async *process(text) {
    this.internalBuffer += text;

    // 只要缓冲区有东西，就按照平滑速度吐字
    // 注意：这里的 while 循环会阻塞当前这一块 text 的处理直到缓冲区排空
    // 这正是我们想要的“平滑化”效果
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
        // 动态计算延迟，让字迹更自然
        const ratio = backlog / this.bufferThreshold;
        delay = this.maxDelay - (this.maxDelay - this.minDelay) * (1 - ratio);
      }

      const part = this.internalBuffer.substring(0, chunkSize);
      this.internalBuffer = this.internalBuffer.substring(chunkSize);

      yield part;

      if (delay > 0) {
        await this._sleep(delay);
      }

      // 如果缓冲区已经清空了，就跳出，等待下一次上游数据推入
      if (this.internalBuffer.length === 0) break;
    }
  }
}
