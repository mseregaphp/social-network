const express = require('express');
const router = express.Router();
const multer = require('multer');
const { UserController, PostController, CommentController, LikeController, FollowController } = require('../controllers');
const authenticateToken = require('../middleware/auth');

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

//роуты юзер
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authenticateToken, UserController.currentUser);
router.get('/users/:id', authenticateToken, UserController.getUserById);
router.put('/users/:id', authenticateToken, UserController.updateUser);

//роуты посты
router.post('/posts', authenticateToken, PostController.createPost);
router.get('/posts', authenticateToken, PostController.getAllPosts);
router.get('/posts/:id', authenticateToken, PostController.getPostById);
router.delete('/posts/:id', authenticateToken, PostController.deletePost);

//роуты коменты
router.post('/comments', authenticateToken, CommentController.createComment);
router.delete('/comments/:id', authenticateToken, CommentController.deleteComment);

//роуты like
router.post('/likes', authenticateToken, LikeController.likePost);
router.delete('/likes/:id', authenticateToken, LikeController.unlikePost);

//роуты follow
router.post('/follow', authenticateToken, FollowController.followUser);
router.delete('/unfollow', authenticateToken, FollowController.unfollowUser);



module.exports = router;