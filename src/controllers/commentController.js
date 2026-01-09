const appPool = require("../db/appPool");

async function createComment(req, res, next) {
    const client = await appPool.connect();

    try {
        const { ticketId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({
                error: "Comment content is required",
            });
        }

        await client.query('BEGIN');

        const ticketResult = await client.query(
            `SELECT id FROM tickets WHERE id = $1 AND deleted_at IS NULL`,
            [ticketId]
        );

        if (ticketResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: "Ticket not found or has been deleted",
            });
        }

        const result = await client.query(
            `INSERT INTO comments (ticket_id, user_id, content) VALUES ($1, $2, $3) RETURNING id`,
            [ticketId, userId, content]
        );

        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'create', 'comment', $2)
            `, [userId, result.rows[0].id]);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Comment created successfully",
            commentId: result.rows[0].id,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function deleteComment(req, res, next) {
    const client = await appPool.connect();

    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        const commentResult = await client.query(
            `SELECT id FROM comments WHERE id = $1 AND user_id = $2`,
            [commentId, userId]
        );

        if (commentResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: "Comment not found or does not belong to the user",
            });
        }

        await client.query(
            `DELETE FROM comments WHERE id = $1`,
            [commentId]
        );

        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'delete', 'comment', $2)
            `, [userId, commentId]);

        await client.query('COMMIT');

        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function listComments(req, res, next) {
    const client = await appPool.connect();

    try {
        const { ticketId } = req.params;
        const { created_by, cursor, limit = 20 } = req.query;
        const userId = req.user.id;

        const ticketResult = await client.query(
            `SELECT id FROM tickets WHERE id = $1 AND deleted_at IS NULL`,
            [ticketId]
        );

        if (ticketResult.rowCount === 0) {
            return res.status(404).json({
                error: "Ticket not found or has been deleted",
            });
        }

        const values = [ticketId];
        let idx = 1;

        const where = `
            WHERE ticket_id = $${idx++}
        `;

        if (created_by) {
            values.push(created_by);
            where += ` AND user_id = $${idx++} `;
        }

        if (cursor) {
            values.push(cursor);
            where += ` AND id < $${idx++} `;
        }

        values.push(Math.min(limit, 50));

        const query = `
            SELECT * FROM comments
            ${where}
            ORDER BY created_at DESC
            LIMIT $${idx}
        `;

        const result = await client.query(query, values);
        res.json(result.rows);

    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
}

module.exports = {
  createComment,
  deleteComment,
  listComments,
};