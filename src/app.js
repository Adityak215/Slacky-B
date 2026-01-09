const express = require("express");
const authRoutes = require("./routes/authRoute");

const projectRoutes = require("./routes/projectRoute");
const ticketRoutes = require("./routes/ticketRoute");
const commentRoutes = require("./routes/commentRoute");
const { globalLimiter, authLimiter } = require("./middleware/rateLimit");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

app.use(globalLimiter);

app.use("/auth", authLimiter);

app.use(helmet());

app.use(
    cors({
        origin: process.env.ORIGIN || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Slacky API is running",
    })
});

app.use("/auth", authRoutes);
app.use("/workspaces", projectRoutes);
app.use("/", ticketRoutes);
app.use("/", commentRoutes);

// app.get("/protec", authWare, (req, res) => {
//     res.status(200).json({
//         message: "This is a protected route",
//         user: req.user,
//     });
// });

app.use((req, res, next) => {
    console.log(`Unknown endpoint ${req.method} ${req.url}`);
    res.status(404).json({
        error: "Not found",
    });
});

app.use((err, req, res, next) => {
    console.error("Internal server error dawh:", err);

    res.status(500).json({
        error: "Internal server error",
    })
})

module.exports = app;