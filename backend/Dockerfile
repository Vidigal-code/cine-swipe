FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
