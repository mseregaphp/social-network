const { prisma } = require('../prisma/prisma-client');

const CommentController = {
    //создание комментраия
    createComment: async (req, res) => {
        const { postId, content } = req.body;
        const userId = req.user.userId;

        //проверка пустых полей иди поста и контента коментария
        if (!postId || !content) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const comment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content
                }
            });
            res.json(comment);
        } catch (error) {
            console.error('error create comment', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    deleteComment: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            //проверка существования коментраия
            const comment = await prisma.comment.findUnique({
                where: { id }
            });

            if (!comment) {
                return res.status(404).json({ error: 'Коментарий не найден' });
            }
            if (comment.userId !== userId) {
                return res.status(403).json({ error: 'Вы не можете удалять чужие коментарии' });
            }

            await prisma.comment.delete({ where: { id } });

            res.json(comment);
        } catch (error) {
            console.error('Error delete comment', error);

            res.status(500).json({ error: 'Internal server error' });
        }

    }
}

module.exports = CommentController;