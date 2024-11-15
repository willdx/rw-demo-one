This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on ECS with Docker

暂时还没有配置CI/CD，所以我们使用本地构建镜像的方式构建代码，线上就使用docker-compose来启动代码

### build阶段: RUN pnpm build

当代码更改后，我们在本地手动构建多架构的业务镜像并推送到自己的阿里云镜像仓库

```shell
docker buildx create --name mybuilder --use

docker buildx build --platform linux/amd64,linux/arm64 \
  -t registry.cn-hangzhou.aliyuncs.com/willdx1992/rw-demo:latest \
  --push .
```

依赖服务的镜像

```shell
docker buildx build --platform linux/amd64,linux/arm64 \
  -t registry.cn-hangzhou.aliyuncs.com/willdx1992/caddy:latest \
  -f caddy.Dockerfile \
  --push .


docker buildx build \                                   
  --platform linux/amd64,linux/arm64 \
  -t registry.cn-hangzhou.aliyuncs.com/willdx1992/rw-demo-neo4j-apoc:latest \
  -f neo4j.Dockerfile \
  --push .
```

### start阶段: CMD ["pnpm", "start"] 

项目的docker-compose文件中配置了服务的启动方式

```shell
# 依赖一个Caddyfile文件，用来做反向代理
volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile

# 使用阿里云最新的镜像来启动服务
nextjs-app:
    image: registry.cn-hangzhou.aliyuncs.com/willdx1992/rw-demo:latest
    platform: ${DOCKER_PLATFORM:-linux/amd64}
```


### 启动项目

```shell
docker login --username=willdx1992 registry.cn-hangzhou.aliyuncs.com
cp .env.example .env.production  # 拷贝配置文件，并修改线上的环境变量
docker compose --env-file .env.production down
docker compose --env-file .env.production up
```


