const appPool = require("../db/appPool");

async function authorizeWorkspace(allowedRoles) {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const workspaceId = req.params.workspaceId;
            
            if(!workspaceId) {
                return res.status(400).json({
                    error: "Workspace ID is required",
                });
            }

            const result = await appPool.query(
                `SELECT role FROM workspace_members 
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