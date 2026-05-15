const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING
});

async function connect() {
    try {
        if (global.connection)
            return global.connection.connect();

        const client = await pool.connect();
        await client.query('SET search_path TO teadmin');
        console.log("Criou pool de conexões no PostgreSQL!");

        const res = await client.query('SELECT NOW()');
        console.log(res.rows[0]);
        client.release();

        global.connection = pool;
        return pool.connect();
    } catch (e) {
        console.log(e);
    }
}

module.exports = { connect, pool };