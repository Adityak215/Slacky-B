const appPool = require('../db/appPool');

async function createWorkspace (req, res, next) {
    const client = await appPool.connect();
    try {
        const { name } = req.body;

        const result = await client.query(`
            INSERT INTO workspaces (name)
            VALUES ($1) RETURNING id
            `, [name]);

        const workspaceId = result.rows[0].id;

        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'create', 'workspace', $2)
            `, [req.user.id, workspaceId]);

        res.status(201).json({
            message: "Workspace created successfully",
            workspaceId: workspaceId,
        });

    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
}

async function addUserToWorkspace(req, res, next) {

    const client = await appPool.connect();
    try {
        const { workspaceId } = req.params;
        const { userId, role } = req.body;

        if (!userId || !role || !workspaceId) {
            return res.status(400).json({
                error: "Missing userId, role, or workspaceId",
            });
        }

        await client.query(`BEGIN`);

        const check = await client.query(`
            SELECT * FROM user_workspaces WHERE user_id = $1 AND workspace_id = $2 AND role = $3 AND deleted_at IS NULL
            `, [userId, workspaceId, role]);

        if(check.rowCount > 0) {
            return  res.status(409).json({
                error: "User is already at the assigned role in the workspace",
            });
        }

        await client.query(`
            INSERT INTO user_workspaces (user_id, workspace_id, role)
            VALUES ($1, $2, $3)
            `, [userId, workspaceId, role]);

        await client.query(`
            INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
            VALUES ($1, 'add_user', 'workspace', $2)
            `, [req.user.id, workspaceId]);

        res.status(200).json({
            message: "User added to workspace successfully",
        });

    } catch (err) {
        next(err);
    } finally {
        client.release();
    }
}

async function createProject (req, res, next) {

        const client = await appPool.connect();
        try {
            const { workspaceId } = req.params;
            const { name } = req.body;

            const result = await client.query(`
                INSERT INTO projects (name, workspace_id)
                VALUES ($1, $2) RETURNING id
                `, [name, workspaceId]);

            const projectId = result.rows[0].id;

            await client.query(`
                INSERT INTO audit_logs (performed_by, action, entity_type, entity_id)
                VALUES ($1, 'create', 'project', $2)
                `, [req.user.id, projectId]);
            
            res.status(201).json({
                message: "Project created successfully",
                projectId: projectId,
            });

        } catch (err) {
            next(err);
        } finally {
            client.release();
        }
    }

    module.exports = { createProject, createWorkspace, addUserToWorkspace };