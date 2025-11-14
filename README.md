# 🚀 Smooth Gateway - 流式优化网关
一个轻量、高效的 Node.js API 网关，专为优化大语言模型（LLM）的流式响应而设计，提供丝般顺滑的“打字机”效果。
## ✨ 特性
- **丝滑流式体验**: 将上游 API 不稳定的“块状”输出，智能转换为平滑、连续的字符流。
- **动态延迟**: 根据文本块的长度自动调整“打字”速度，短文本从容，长文本高效。
- **完全可配置**: 所有优化参数（延迟、阈值等）、端口、上游地址均可通过环境变量配置。
- **通用代理**: 智能区分流式与非流式请求，完美兼容如“标题生成”等一次性JSON响应功能。
- **Docker化**: 提供 Dockerfile，一键构建和部署，与宿主环境完全解耦。
- **轻量高效**: 基于 Node.js 和 Express，资源占用低，并发性能强。
## ⚙️ 配置
通过环境变量进行配置：
| 环境变量                      | 描述                               | 默认值   |
| ----------------------------- | ---------------------------------- | -------- |
| `UPSTREAM_API_URL`            | **必需！** 您的上游API地址。     | (无)     |
| `PORT`                        | 网关监听的端口。                   | `3001`   |
| `LOG_LEVEL`                   | 日志级别 `debug` 或 `silent`)。   | `silent` |
| `STREAM_MIN_DELAY`            | 流式输出的最小延迟（秒）。         | `0.016`  |
| `STREAM_MAX_DELAY`            | 流式输出的最大延迟（秒）。         | `0.024`  |
| `STREAM_SHORT_TEXT_THRESHOLD` | 短文本阈值（字符）。               | `10`     |
| `STREAM_LONG_TEXT_THRESHOLD`  | 长文本阈值（字符）。               | `50`     |
| `STREAM_CHUNK_SIZE`           | 长文本分块大小（字符）。           | `5`      |
## 🚀 快速开始
**前提**: 您已安装 [Docker](https://www.docker.com/)。
1.  **克隆或下载本仓库**:
    ```bash
    git clone https://github.com/2erTwo6/Smooth-Gateway.git
    cd Smooth-Gateway
    ```
2.  **构建 Docker 镜像**:
    ```bash
    docker build -t smooth-gateway .
    ```
3.  **运行容器**:
    ```bash
    docker run -d \
      --name my-smooth-gateway \
      -p 3001:3001 \
      -e "UPSTREAM_API_URL=http://your-upstream-api.com/v1/chat/completions" \
      --restart unless-stopped \
      smooth-gateway
    ```
    现在，您的流式优化网关已在 `http://localhost:3001` 上运行！

## 🙏 致谢
本项目的核心思想受到了 [snailyp/gemini-balance](https://github.com/snailyp/gemini-balance) 项目的启发，在此向原作者表示感谢！

## 📄 许可证
本项目采用 [MIT](LICENSE) 许可证。
