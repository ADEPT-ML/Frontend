FROM node:19.3-slim AS builder
WORKDIR /app
COPY package.json package-lock.json .env ./
RUN npm install
COPY ./resources ./resources
COPY ./src ./src
ARG BACKEND_BASE_URL
RUN npx parcel build --no-source-maps ./src/index.html

FROM nginx:1.23.2-alpine
COPY --from=builder /app/dist /usr/share/nginx/html