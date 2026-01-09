const { de } = require("zod/locales");
const appPool = require("../db/appPool");

const ALLOWED_TRANSITIONS = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: []
};

async function createTicket(req, res, next) {

    const client = await appPool.connect();

    try {
        const { content, assignedTo } = req.body;
        const { projectId } = req.params;
        const userId = req.user.id;

        if(!content) {
            return res.status(400).json({
                error: "Ticket content is required",
            });
        }

        await client.query('BEGIN');

        const ticketResult = await client.query(`
            INSERT INTO tickets (content, project_id, created_by, status, assigned_to)
            VALUES ($1,$2, $3, 'open', $4) RETURNING id
            `, 
            [content, projectId, userId, assignedTo || null]);

        const ticketId = ticketResult.rows[0].id;

        await client.query(`
            INSERT INTO ticket_status_history (ticket_id, status, updated_by)
            VALUES ($1, 'open', $2)
            `, 
            [ticketId, userId]);

        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'create', 'ticket', $2)
            `, [userId, ticketId]);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Ticket created successfully",
            ticketId: ticketId,
        });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function updateTicketStatus(req, res, next) {
    const client = await appPool.connect();
    try {
        const { ticketId } = req.params;
        const { status: newStatus } = req.body;
        const userId = req.user.id;

        if (!newStatus) {
            return res.status(400).json({
                error: "New status is required",
            });
        }

        await client.query('BEGIN');

        const ticketResult = await client.query(`
            SELECT status, deleted_at FROM tickets WHERE id = $1
            FOR UPDATE
            `, [ticketId]);
        
        if (ticketResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: "Ticket not found",
            });
        }

        const ticket = ticketResult.rows[0];

        if (ticket.deleted_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "Cannot update a deleted ticket",
            });
        }

        const currentStatus = ticket.status;

        if (!ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
            });
        }

        await client.query(`
            UPDATE tickets SET status = $1 WHERE id = $2
            `, [newStatus, ticketId]);

        await client.query(`
            INSERT INTO ticket_status_history (ticket_id, status, updated_by)
            VALUES ($1, $2, $3)
            `, [ticketId, newStatus, userId]);

        await client.query('COMMIT');

        res.status(200).json({
            message: "Ticket status updated successfully",
        });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function deleteTicket(req, res, next) {
    const client = await appPool.connect();

    try {
        const { ticketId } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        const ticketResult = await client.query(`
            SELECT deleted_at FROM tickets WHERE id = $1
            FOR UPDATE
            `, [ticketId]);

        if (ticketResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: "Ticket not found",
            });
        }

        if (ticketResult.rows[0].deleted_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: "Ticket is already deleted",
            });
        }

        await client.query(`
            UPDATE tickets SET deleted_at = NOW() WHERE id = $1
            `, [ticketId]);
        
        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'delete', 'ticket', $2)
            `, [userId, ticketId]);
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: "Ticket deleted successfully",
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function listTickets(req, res, next) {
    try {
        const { projectId } = req.params;
        const { status, assignedTo, cursor, limit = 20 } = req.query;
        const userId = req.user.id;

        const values = [projectId];
        let idx = 2;

        let where = `
            WHERE project_id = $1 
            AND deleted_at IS NULL
        `;

        if (status) {
            where += ` AND status = $${idx++}`;
            values.push(status);
        }

        if (assignedTo) {
            where += ` AND assigned_to = $${idx++}`;
            values.push(assignedTo);
        }

        if (cursor) {
            where += ` AND created_at < $${idx++}`;
            values.push(cursor);
        }

        const query = `
            SELECT * FROM tickets ${where}
            ORDER BY created_at DESC
            LIMIT $${idx}
        `;

        values.push(Math.min(limit, 50));

        const result = await appPool.query(query, values);

        res.status(200).json({
            tickets: result.rows,
            nextCursor: 
                result.rows.length > 0 
                ? result.rows[result.rows.length -1].created_at 
                : null,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { createTicket, updateTicketStatus, deleteTicket, listTickets };