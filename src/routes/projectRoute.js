const express = require('express');
const authWare = require('../middleware/auth');
const authorizeWorkspace = require('../middleware/authorizeWorkspace');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.post("/",
    authWare,
    projectController.createWorkspace);

router.post("/:workspaceId/invite",
    authWare,
    authorizeWorkspace(['admin']),
    projectController.addUserToWorkspace);

router.post("/:workspaceId/projects",
    authWare,
    authorizeWorkspace(['admin']),
    projectController.createProject);

module.exports = router;