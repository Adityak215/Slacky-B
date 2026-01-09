const appPool = require("../db/appPool");

const expectedTables = [
    "users",
    "workspaces",
    "user_workspaces",
    "projects",
    "tickets",
    "ticket_status_history",
    "comments",
    "audit_logs"
];

async function verifySchemaExistence() {
    console.log("Checking database schema...");

    const tableQuery = `
        SELECT table_name
        from information_schema.tables
        WHERE table_schema='public'
        `;

    const res = await appPool.query(tableQuery);

    const existingTables = res.rows.map(row => row.table_name);

    const missingTables = expectedTables.filter(
        table => !existingTables.includes(table)
    );

    if(existingTables.length === 0) {
        console.log("No tables found. Creating all fresh.");
        for (const table of expectedTables) {
            console.log(`Creating table: ${table}`);
            await createSchema(table);
            console.log(`Created table: ${table}`);
        }
        console.log("Created all tables and indexes fresh.");
    } else if (missingTables.length === 0) {
        console.log("All expected tables already exist.");
    } else {
        console.log("Partial Schema. Some tables are missing.");
        console.log("Missing tables:", missingTables);
        console.log("Usually would do quick fail here and manually handle,");
        console.log("but since i am not deloying this now, will just log it.");
        console.log("Create missing ones and we move on - in real world scenarios, fail & handle properly.");
        for (const table of missingTables) {
            console.log(`Creating table: ${table}`);
            await createSchema(table);
            console.log(`Created table: ${table}`);
        }
        console.log("Created missing tables.");
    }
    await verifyIndex();
    console.log("Schema verification completed.");
}

async function createSchema(tableName) {
    switch (tableName) {
        case "users":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(25) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`);
                break;
        case "workspaces":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS workspaces (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`);
                break;
        case "user_workspaces":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS user_workspaces (
                    user_id INT NOT NULL,
                    workspace_id INT NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    deleted_at TIMESTAMP default null,
                    PRIMARY KEY (user_id, workspace_id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
                )`);
                break;
        case "projects":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    workspace_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
                )`);
                break;
        case "tickets":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS tickets (
                    id SERIAL PRIMARY KEY,
                    content VARCHAR(255) NOT NULL,
                    project_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by INT NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    assigned_to INT,
                    deleted_at TIMESTAMP default null,
                    FOREIGN KEY (created_by) REFERENCES users(id),
                    FOREIGN KEY (assigned_to) REFERENCES users(id),
                    FOREIGN KEY (project_id) REFERENCES projects(id),
                    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'closed', 'resolved'))
                    )`);
                break;
        case "ticket_status_history":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS ticket_status_history (
                    id SERIAL PRIMARY KEY,
                    ticket_id INT NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    updated_by INT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                    FOREIGN KEY (updated_by) REFERENCES users(id),
                    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'closed', 'resolved'))
                    )`);
                break;
        case "comments":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS comments (
                    id SERIAL PRIMARY KEY,
                    ticket_id INT NOT NULL,
                    user_id INT NOT NULL,
                    content VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`);
                break;
        case "audit_logs":
            await appPool.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    performed_by INT NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id INT NOT NULL,
                    metadata JSONB,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (performed_by) REFERENCES users(id)
                )`);
                break;

    }
}

async function verifyIndex(){
    //Could edit this logic to check and work like tables existence... for now this is fine.
    //too much code for one file if i do that rn.
    console.log("Verifying indexes...");

    //workspace_id index on user_workspaces
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_user_workspaces_workspace
        ON user_workspaces (workspace_id);`
    );
    console.log("Verified index on user_workspaces.workspace_id");

    //workspace_id index on projects
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_projects_workspace
        ON projects (workspace_id);`
    );
    console.log("Verified index on projects.workspace_id");

    //project_id index on tickets
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_tickets_project
        ON tickets (project_id);`
    );
    console.log("Verified index on tickets.project_id");

    //created_by index on tickets
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_tickets_created_by
        ON tickets (created_by);`
    );
    console.log("Verified index on tickets.created_by");

    //assigned_to index on tickets
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to
        ON tickets (assigned_to);`
    );
    console.log("Verified index on tickets.assigned_to");

    //active tickets index on tickets partial index
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_tickets_active
        ON tickets (status) WHERE deleted_at IS NULL;`
    );
    console.log("Verified partial index on active tickets");

    //ticket_id index on ticket_status_history
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id
        ON ticket_status_history (ticket_id);`
    );
    console.log("Verified index on ticket_status_history.ticket_id");

    //ticket status timeline index on ticket_status_history
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_ticket_status_timeline 
        ON ticket_status_history (ticket_id, updated_at DESC);`
    );
    console.log("Verified index on ticket_status_timeline");

    //ticket_id index on comments
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_comments_ticket_id
        ON comments(ticket_id);`
    );
    console.log("Verified index on comments.ticket_id");

    //user_id index on comments
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_comments_user_id
        ON comments(user_id);`
    );
    console.log("Verified index on comments.user_id");

    //timestamp index on audit_logs
    await appPool.query(
        `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
        ON audit_logs(timestamp);`
    );
    console.log("Verified index on audit_logs.timestamp");
}

module.exports = verifySchemaExistence;