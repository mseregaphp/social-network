const express = require('express');
const router = express.Router();
const multer = require('multer');

//папка для загрузок
const uploadDestination = 'uploads';

//показываем где хранить файлы
const storage = multer.diskStorage({
    destination: uploadDestination,
    //доступ к файлу по имени с которым он создавался
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

//хранилище
const uploads = multer({ storage: storage });

//роутер регистрации
router.get('/register', (req, res) => {
    res.send('register router');
});




module.exports = router;