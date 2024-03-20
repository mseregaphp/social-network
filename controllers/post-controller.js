const { prisma } = require('../prisma/prisma-client');

const PostController = {
    //создать пост
    createPost: async (req, res) => {
        const { content } = req.body;

        const authorId = req.user.userId;

        if (!content) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const post = await prisma.post.create({
                data: {
                    content,
                    authorId
                }
            });
            res.json(post);
        } catch (error) {

            console.error('Create post error', error);

            res.status(500).json({ error: 'Internal server error' });

        }
    },
    //получить все посты
    getAllPosts: async (req, res) => {
        const userId = req.user.userId;

        try {
            //получаем все посты из базы сортировка по убыванию desc
            const posts = await prisma.post.findMany({
                include: {
                    likes: true,
                    author: true,
                    comments: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            //добавляем бул поле, которое говорит о том что данный пользователь лайкал пост
            const postWithLikeInfo = posts.map(post => ({
                ...post,
                likedByUser: post.likes.some(like => like.iserId === userId)
            }));
            res.json(postWithLikeInfo);
        } catch (error) {
            console.error('get all post error', error);

            res.status(500).json({ error: 'Internal server error' });
        }
    },
    //получить пост по ид
    getPostById: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    comments: {
                        include: {
                            user: true
                        }
                    },
                    likes: true,
                    author: true
                }
            });
            if (!post) {
                return res.status(404).json({ error: 'Пост не найден' });
            }

            //добавляем поле с статусом лайка от данного полязователя
            const postWithLikeInfo = {
                ...post,
                likesByUser: post.likes.some(loke => loke.userId === userId)
            }

            res.json(postWithLikeInfo);
        } catch (error) {
            console.error('getPostby id error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    //удалить пост
    deletePost: async (req, res) => {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: {
                id
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        if (post.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'Вы не можете удалять чужые посты' });
        }

        try {
            const transaction = await prisma.$transaction([
                prisma.comment.deleteMany({ where: { postId: id } }),
                prisma.like.deleteMany({ where: { postId: id } }),
                prisma.post.delete({ where: { id } })
            ]);

            res.json(transaction);

        } catch (error) {
            console.error('delete post error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = PostController;