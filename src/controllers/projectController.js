const appPool = require('../appPool');

async function createProject (req, res, next) {
        try {
            const { workspaceId } = req.params;
            const { name } = req.body;

            const client = await appPool.connect();

            const result = await client.query(`
                INSERT INTO projects (name, workspace_id)
                VALUES ($1, $2) RETURNING id
                `, [name, workspaceId]);

            const projectId = result.rows[0].id;

            await client.query(`
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
                VALUES ($1, 'create', 'project', $2)
                `, [req.user.id, projectId]);
            
            res.status(201).json({
                message: "Project created successfully",
                projectId: projectId,
            });

        } catch (err) {
            next(err);
        }
    }

    module.exports = { createProject };