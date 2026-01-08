const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(30),
        email: z.email(),
        password: z.string().min(6).max(40),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(6).max(40),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
};