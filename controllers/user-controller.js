const { prisma } = require('../prisma/prisma-client');
const bcrypt = require('bcryptjs');
const Jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// сделать функцию на проверку пустых полей req

const UserController = {
    //регистрация
    register: async (req, res) => {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Все поля обязательны!' });
        }

        try {
            //проверка на существование юзера с указаной почтой
            const existingUser = await prisma.user.findUnique(({ where: { email } }));
            if (existingUser) {
                return res.status(400).json({ error: 'Данная почта уже используеться!' })
            }

            //хешируем пароль
            const hashedPassword = await bcrypt.hash(password, 10);

            //генерируем аватар
            const png = Jdenticon.toPng(name, 200);
            //название для аватара
            const avatarName = `${name}_${Date.now()}.png`;
            //путь загрузки аватара
            const avatarPath = path.join(__dirname, '/../uploads', avatarName);

            //сохраняем сгенерированый png файл на жеском диске
            fs.writeFileSync(avatarPath, png);

            //записываем юзера в бд
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/uploads/${avatarName}`
                }
            });

            //возвращаем данные из бд о новом пользователе
            res.json(user)

        } catch (error) {
            console.error('Error in register', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    //вход
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.error(400).json({ error: 'Все поля обязательны' });
        }

        try {
            //ищем пользователя в бд
            const user = await prisma.user.findUnique({ where: { email } });

            //проверяем наличие юзера в базе
            if (!user) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            //проверка пароля который пришел с тем что находиться в базе
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            //генирируем jvt токен
            const token = jwt.sign(({ userId: user.id }), process.env.SECRET_KEY);

            //отправляем токен
            res.json({ token });

        } catch (error) {
            console.error('Login error', error);

            res.status(500).json({ error: 'Internal server error' });
        }
    },
    //получение юзера по ид
    getUserById: async (req, res) => {

        //берем ид из парамсов(адресной строки)
        const { id } = req.params;
        //берем ид пользователя который отправил запрос
        const userId = req.user.userId;
        try {

            //берем из базы фоловеров пользователя с указанным ид
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    followers: true,
                    following: true
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            //подписан ли текущий юзер на юзера которого он ищет
            const isFollowing = await prisma.follows.findFirst({
                where: {
                    AND: [
                        { followerId: userId },
                        { followingId: id }
                    ]
                }
            });
            res.json({ ...user, isFollowing: Boolean(isFollowing) });
        } catch (error) {
            console.error('Get curren user error', error);
            res.status(500).json({ error: 'Internal server error' });
        }


    },
    //обновления информации юзера
    updateUser: async (req, res) => {
        //берем ид с парамсов
        const { id } = req.params;

        //значения из тела запроса
        const { email, name, dateOfBirth, bio, location } = req.body;

        //если файл аватара и путь пришел, сохраняем его
        let filePath;
        if (req.file && req.file.path) {
            filePath = req.file.path;
        }

        //проверка ид с парамсов и ид текущего пользователя
        if (id !== req.user.userId) {
            return res.status(403).json({ error: 'У вас нет прав на изменение данных о данном пользователе' })
        }

        try {

            //проверяем на наличие пользователя с такой же почтой
            if (email) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        email: email
                    }
                });
                if (existingUser && existingUser.id !== id) {
                    return res.status(400).json({ error: 'Почта уже используеться' });
                }
            }

            //обновляем данные о пользователе в базе данных
            const user = await prisma.user.update({
                where: { id: id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined
                }
            });

            //отправляем изменения на клиент
            res.json(user);

        } catch (error) {
            console.error('Update user error', error);
            res.status(500).json({ error: 'Interval server error' });
        }
    },
    //почучени информации о текущем юзере(мой профиль)
    currentUser: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId
                },
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    },
                    following: {
                        include: {
                            following: true
                        }
                    }
                }
            });
            if (!user) {
                return res.status(400).json({ error: 'Пользователь не найден' });
            }
            res.json(user);
        } catch (error) {
            console.error('current user error', error);
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

module.exports = UserController;