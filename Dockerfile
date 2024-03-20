#Используем образ линукс Alpine версия node 14
FROM node:19.5.0-alpine

#Указываем нашу рабочую директорию
WORKDIR /app

#Скопировать package.json и package-lock.json внутрь контейнера
COPY package*.json ./

#Устанавливаем зависимости
RUN npm install

#Копируем все остальное
COPY . .

#Устанавливаем призму
RUN npm install -g prisma

#Генерим призма клиент
RUN prisma generate

#Копируем призма схему
COPY prisma/schema.prisma ./prisma/

#Открываем порт
EXPOSE 3000

#Запускае сервер
CMD ["npm", "start"]