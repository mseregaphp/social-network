const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    //получаем токен из хедеров
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    //проверяем наличие токена
    if (!token) {
        return res.status(401).json({ error: 'Неавторизован' });
    }

    //проверяем сам токен
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Токен не валидный' });
        }
        //запишем пользователя для каждого запроса на сервер
        req.user = user;

        next();
    });

}

module.exports = authenticateToken;