# --- Stage 1: Build ---
# 使用一个官方的、轻量的 Node.js 镜像作为基础
# 'alpine' 版本非常小，非常适合生产环境
FROM node:18-alpine

# 在容器内创建一个工作目录，后续所有操作都在这里进行
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果有的话)
# 这一步非常关键！利用 Docker 的层缓存机制。
# 只有当这两个文件变化时，才会重新执行下一步的 npm install，大大加快后续构建速度。
COPY package*.json ./

# 安装生产环境所需要的依赖
# --production 标志会忽略 devDependencies，让镜像更小
RUN npm install --production

# 将项目的所有剩余文件（.js, .md 等）复制到工作目录中
COPY . .

# --- Stage 2: Run ---
# 文档化说明容器内应用将监听的端口。
# 这不会自动将端口暴露到宿主机，实际映射由用户在 `docker run` 时通过 -p 参数决定
EXPOSE 3001

# 设置容器内的默认环境变量。用户可以在 `docker run` 时用 -e 参数覆盖它。
# 我们默认以静默模式运行，保持生产环境的整洁
ENV LOG_LEVEL=silent

# 定义容器启动时要执行的最终命令
CMD [ "node", "server.js" ]
