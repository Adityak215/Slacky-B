const express = require("express");
const authWare = require("../middleware/auth");
const authorizeWorkspace = require("../middleware/authorizeWorkspace");
const commentController = require("../controllers/commentController");

const router = express.Router();

router.post(
    "/tickets/:ticketId/comments",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    commentController.createComment
);

router.delete(
    "/comments/:commentId",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    commentController.deleteComment
);

router.get(
    "/tickets/:ticketId/comments",
    authWare,
    authorizeWorkspace(['admin', 'member', 'viewer']),
    commentController.listComments
);