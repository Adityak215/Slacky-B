const express = require('express');
const authWare = require('../middleware/auth');
const authorizeWorkspace = require('../middleware/authorizeWorkspace');
const app = require('../app');
const projectController = require('../controllers/projectController');

const router = express.Router();

//gonna clean it later but for now this is the whole route
app.post("/workspaces/:workspaceId/projects",
    authWare,
    authorizeWorkspace(['admin']),
    projectController.createProject)