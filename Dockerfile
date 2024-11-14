# 构建阶段
FROM node:20-alpine AS builder

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 安装pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 只复制生产环境需要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"] 