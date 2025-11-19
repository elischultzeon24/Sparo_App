import mysql from 'npm:mysql2@^3.15.3/promise';

const dbConfig = {
    host: Deno.env.get('DB_HOST') || 'localhost',
    user: Deno.env.get('DB_USER') || '',
    password: Deno.env.get('DB_PASSWORD') || '',
    database: Deno.env.get('DB_DATABASE') || '',
    port: parseInt(Deno.env.get('DB_PORT') || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false
};

if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error('FEHLER: Datenbankkonfiguration unvollständig!');
    Deno.exit(1);
}

const pool = mysql.createPool(dbConfig);

(async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
    } catch (err) {
        console.error("FEHLER BEI DER DATENBANKVERBINDUNG:", err.message);
        console.error("   Code:", err.code);
        console.error("   SQL State:", err.sqlState);
    }
})();

export default pool;
