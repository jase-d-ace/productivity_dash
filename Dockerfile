# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Run Python backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
COPY --from=build /app/web/dist ./web/dist

ENV PORT=8000
CMD uvicorn src.server:app --host 0.0.0.0 --port $PORT
