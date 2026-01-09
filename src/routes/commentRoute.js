const express = require("express");
const authWare = require("../middleware/auth");
const authorizeWorkspace = require("../middleware/authorizeWorkspace");
const commentController = require("../controllers/commentController");

const router = express.Router();

router.post(
    "/projects/:projectId/tickets/:ticketId/comments",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    commentController.createComment
);

router.delete(
    "/projects/:projectId/tickets/:ticketId/comments/:commentId",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    commentController.deleteComment
);

router.get(
    "/projects/:projectId/tickets/:ticketId/comments",
    authWare,
    authorizeWorkspace(['admin', 'member', 'viewer']),
    commentController.listComments
);

module.exports = router;