const bootstrapDB = require("./initdb/bootstrap");
const app = require("./app");
require("dotenv").config();

async function start(params) {
    try {
        console.log("Starting applicashon majesty");
        await bootstrapDB();
        console.log("BootStrapped sire");

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Slacky API is running on port ${PORT}`);
        })

    } catch (error) {
        console.log("Error starting application brutha", error);
        process.exit(1);
    }
}

start();