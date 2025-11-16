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


console.log('  Datenbankkonfiguration:');
console.log('  Host:', dbConfig.host);
console.log('  User:', dbConfig.user || 'NICHT GESETZT');
console.log('  Database:', dbConfig.database || 'NICHT GESETZT');
console.log('  Port:', dbConfig.port);
console.log('  Password:', dbConfig.password ? 'GESETZT' : 'NICHT GESETZT');


if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error('FEHLER: Datenbankkonfiguration unvollständig!');
    console.error('   Stelle sicher, dass DB_USER, DB_PASSWORD und DB_DATABASE in der .env gesetzt sind.');
    Deno.exit(1);
}

const pool = mysql.createPool(dbConfig);


(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Datenbankverbindung erfolgreich hergestellt!");
        connection.release();
    } catch (err) {
        console.error("FEHLER BEI DER DATENBANKVERBINDUNG:", err.message);
        console.error("   Code:", err.code);
        console.error("   SQL State:", err.sqlState);
        Deno.exit(1);
    }
})();


export default pool;
