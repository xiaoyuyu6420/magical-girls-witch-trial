#!/bin/bash
set -e

DEPLOY_DIR="/home/magical-girls"
GITHUB_RAW="https://raw.githubusercontent.com/xiaoyuyu6420/magical-girls-witch-trial/main"
GITHUB_PROXY="https://ghfast.top/https://raw.githubusercontent.com/xiaoyuyu6420/magical-girls-witch-trial/main"

mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "=== 更新 Magical Girls Witch Trial ==="

# 0. 磁盘自清理（2026-09-02 线上事故：频繁部署把磁盘塞满，cp backup 直接 No space）
#    - compose 备份只留最近 1 份（每次部署都会生成一个）
#    - 清掉未被运行容器使用的 Docker 镜像/构建缓存（运行中的容器与数据卷不受影响）
ls -t docker-compose.yml.backup.* 2>/dev/null | tail -n +2 | xargs -r rm -f
docker image prune -af >/dev/null 2>&1 || true
docker builder prune -af >/dev/null 2>&1 || true
docker system prune -f >/dev/null 2>&1 || true
echo "磁盘清理后：$(df -h / | tail -1 | awk '{print $4 " 可用"}')"

# 1. 检查 .env
if [ ! -f .env ] || ! grep -q "^ADMIN_PASSWORD=.\+" .env; then
  echo ""
  read -sp "请设置管理员密码: " password
  echo ""
  if [ -z "$password" ]; then
    echo "错误: 密码不能为空"
    exit 1
  fi
  {
    echo "ADMIN_PASSWORD=$password"
    grep -v "^ADMIN_PASSWORD=" .env 2>/dev/null || true
  } > .env.tmp && mv .env.tmp .env
  echo ".env 已保存"
else
  echo ".env 已存在，跳过"
fi

# 2. 备份并更新 docker-compose.yml
if [ -f docker-compose.yml ]; then
  cp docker-compose.yml "docker-compose.yml.backup.$(date +%Y%m%d%H%M%S)"
fi

echo "下载最新 docker-compose.yml..."
if ! curl -sSf --connect-timeout 10 -o docker-compose.yml "$GITHUB_RAW/docker-compose.yml" 2>/dev/null; then
  echo "  直连失败，尝试镜像加速..."
  curl -sSf --connect-timeout 10 -o docker-compose.yml "$GITHUB_PROXY/docker-compose.yml"
fi

# 3. 拉取镜像并重启
echo "拉取镜像..."
docker compose pull

echo "重启服务..."
# --force-recreate：latest tag 内容变化但 compose 配置未变时，
# 默认不会重建容器（旧镜像一直跑）；强制按新镜像重建
docker compose up -d --force-recreate

# 4. 顺带检查 HTTPS 证书续期（acme.sh 装在部署用户家目录，缺省跳过）
if [ -f "$HOME/.acme.sh/acme.sh" ]; then
  "$HOME/.acme.sh/acme.sh" --cron --home "$HOME/.acme.sh" >/dev/null 2>&1 || true
fi

echo ""
echo "✅ 更新完成"
docker compose ps
