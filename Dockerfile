# Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение (Vite + esbuild)
RUN npm run build

# Подготовка финального образа
FROM node:20-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем только production-зависимости
ENV NODE_ENV=production
RUN npm ci --omit=dev

# Копируем собранный dist из билдера
COPY --from=builder /app/dist ./dist

# Указываем порт для приложения
ENV PORT=3000
EXPOSE 3000

# Запускаем полностековое приложение
CMD ["npm", "start"]
