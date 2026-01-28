// streamOptimizer.js (修复竞争逻辑的救火版)
export class StreamOptimizer {
  constructor(config) {
    this.minDelay = config.minDelay || 0.001;
    this.maxDelay = config.maxDelay || 0.015;
    // 这里的阈值现在用来判断单个包的大小
    this.bufferThreshold = config.bufferThreshold || 30;
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * 修复后的逻辑：
   * 不再使用全局 Buffer，避免多进程抢夺。
   * 直接对当前传入的文本块进行平滑分发。
   */
  async *process(text) {
    if (!text) return;

    const len = text.length;
    
    // 如果单个包很大（说明上游在憋大招或者积压了），我们就加大步长，减小延迟
    if (len > this.bufferThreshold) {
      // 这里的 5 是步长，意味着大包时一次吐 5 个字
      for (let i = 0; i < len; i += 5) {
        yield text.substring(i, i + 5);
        await this._sleep(this.minDelay);
      }
    } 
    // 如果是常见的小包（1-3个字），这是高频流
    else if (len <= 3) {
      // 极速流模式：直接原样吐出，只给极小的延迟或者不延迟
      // 这样才能跑满 150 Tokens/s
      yield text;
      await this._sleep(this.minDelay); 
    }
    // 中等大小的包，逐字平滑
    else {
      for (const char of text) {
        yield char;
        await this._sleep(this.maxDelay);
      }
    }
  }
}
