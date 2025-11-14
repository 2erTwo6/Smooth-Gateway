// streamOptimizer.js

export class StreamOptimizer {
  constructor(config) {
    this.minDelay = config.minDelay;
    this.maxDelay = config.maxDelay;
    this.shortTextThreshold = config.shortTextThreshold;
    this.longTextThreshold = config.longTextThreshold;
    this.chunkSize = config.chunkSize;
  }

  _sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  calculateDelay(textLength) {
    if (textLength <= this.shortTextThreshold) {
      return this.maxDelay;
    }
    if (textLength >= this.longTextThreshold) {
      return this.minDelay;
    }
    const ratio = Math.log(textLength / this.shortTextThreshold) /
                  Math.log(this.longTextThreshold / this.shortTextThreshold);
    return this.maxDelay - ratio * (this.maxDelay - this.minDelay);
  }

  splitTextIntoChunks(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += this.chunkSize) {
      chunks.push(text.substring(i, i + this.chunkSize));
    }
    return chunks;
  }

  async *process(text) {
    if (!text) {
      return;
    }

    const delay = this.calculateDelay(text.length);

    if (text.length >= this.longTextThreshold) {
      const chunks = this.splitTextIntoChunks(text);
      for (const chunkText of chunks) {
        yield chunkText;
        await this._sleep(delay);
      }
    } else {
      for (const char of text) {
        yield char;
        await this._sleep(delay);
      }
    }
  }
}
