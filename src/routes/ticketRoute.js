const express = require("express");
const authWare = require("../middleware/auth");
const authorizeWorkspace = require("../middleware/authorizeWorkspace");
const ticketController = require("../controllers/ticketController");

const router = express.Router();

router.post(
    "/projects/:projectId/tickets",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    ticketController.createTicket
);

router.patch(
    "/tickets/:ticketId/status",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    ticketController.updateTicketStatus
);

router.delete(
    "/tickets/:ticketId",
    authWare,
    authorizeWorkspace(['admin', 'member']),
    ticketController.deleteTicket
);

router.get(
    "/projects/:projectId/tickets",
    authWare,
    authorizeWorkspace(['admin', 'member', 'viewer']),
    ticketController.listTickets
);