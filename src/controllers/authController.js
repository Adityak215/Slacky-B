const { hashPass, verifyPass } = require("../auth/password");
const { generateToken } = require("../auth/token");
const appPool = require("../db/appPool");

async function register(req, res) {
    try {
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Missing required fields",
            });
        }

        const hashedPass = await hashPass(password);

        await appPool.query(
            `INSERT INTO USERS 
            (name, email, hash) 
            VALUES ($1, $2, $3)`, 
            [name, email, hashedPass]
        );

        res.status(201).json({
            message: "User registered successfully",
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({
                error: "Email already registered",
            });
        }
        next(err);
    }
}

async function login(req, res, next){
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Missing email or password",
            });
        }   

        const result = await appPool.query(
            `SELECT id, hash FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid credentials",
            });
        }

        const user = result.rows[0];

        const isValid = await verifyPass(password, user.hash);

        if (!isValid) {
            return res.status(401).json({
                error: "Invalid credentials",
            });
        }
        const token = generateToken({ id: user.id,});
        res.status(200).json({
            message: "Login successful",
            token,
        });

    } catch (err) {
        next(err);
    }
}

module.exports = { register, login };