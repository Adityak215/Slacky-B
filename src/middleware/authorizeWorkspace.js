const appPool = require("../db/appPool");

function authorizeWorkspace(allowedRoles) {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            let workspaceId = req.params.workspaceId;

            if (!workspaceId) {
                // Try to get workspaceId from projectId
                if (req.params.projectId) {
                    const projectResult = await appPool.query(
                        `SELECT workspace_id FROM projects WHERE id = $1`,
                        [req.params.projectId]
                    );
                    if (projectResult.rows.length === 0) {
                        return res.status(404).json({
                            error: "Project not found",
                        });
                    }
                    workspaceId = projectResult.rows[0].workspace_id;
                } else {
                    return res.status(400).json({
                        error: "Workspace ID or Project ID required",
                    });
                }
            }

            const result = await appPool.query(
                `SELECT role FROM user_workspaces 
                 WHERE user_id = $1 AND workspace_id = $2 AND
                 deleted_at IS NULL`,
                [userId, workspaceId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    error: "Access to workspace denied",
                });
            }

            const userRole = result.rows[0].role;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: "Insufficient permissions for this workspace",
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    }
}

module.exports = authorizeWorkspace;