// streamOptimizer.js (终极丝滑平衡版)
export class StreamOptimizer {
  constructor(config) {
    this.minDelay = config.minDelay || 0.001;
    this.maxDelay = config.maxDelay || 0.015;
    this.bufferThreshold = config.bufferThreshold || 30;
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  async *process(text) {
    if (!text) return;
    const len = text.length;

    /**
     * 核心公式：动态步长与动态延迟
     * 1. 步长(step)：10个字以内的包逐字出，超过10个字的包按比例增加一次出的字数
     * 2. 延迟(delay)：根据包的长度，在 maxDelay 和 minDelay 之间平滑插值
     */
    
    // 步长：最少1个字，最多不超过10个字一组
    const step = len <= 10 ? 1 : Math.min(Math.ceil(len / 5), 10);
    
    // 延迟：根据长度线性平滑收缩，不再有突变
    const ratio = Math.min(len / this.bufferThreshold, 1);
    const currentDelay = this.maxDelay - (this.maxDelay - this.minDelay) * ratio;

    for (let i = 0; i < len; i += step) {
      yield text.substring(i, i + step);
      
      // 只有当包比较小的时候，sleep 才有意义，否则直接跑满
      if (currentDelay > 0.001) {
        await this._sleep(currentDelay);
      }
    }
  }
}
