const systemPool = require('../db/systemPool');
const verifySchemaExistence = require('./schema');

async function bootstrapDB(params) {
    const appDBName = "slacky_db";
    console.log("Bootstrapping database dawgg");

    const result = await systemPool.query('SELECT NOW()');
    console.log("DB Time:", result.rows[0]);

    const checkDBExistsQuery = `
        SELECT 1 
        FROM pg_database 
        WHERE datname=$1`;

    const res = await systemPool.query(checkDBExistsQuery, [appDBName]);
    if (res.rowCount === 0) {
        console.log(`Database ${appDBName} does not exist. Creating...`);
        try{
            await systemPool.query(`CREATE DATABASE ${appDBName}`);
            console.log(`Database ${appDBName} created successfully.`);
        } catch (error) {
            if (error.code === '42P04') { // duplicate_database
                console.log(`Database ${appDBName} already exists (race condition).`);
            } else {
                console.error("Error creating database:", error);
                throw error; //handled in index.js (calling func)
            }
        }
    } else {
        console.log(`Database ${appDBName} already exists.`);
    }

    await systemPool.end();
    console.log("System pool connection closed.");

    await verifySchemaExistence();
    console.log("Database schema verified.");
}

module.exports = bootstrapDB;