const express = require("express");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../schemas/authSchema");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", 
    validate(registerSchema), 
    authController.register);

router.post("/login", 
    validate(loginSchema),
    authController.login);

module.exports = router;