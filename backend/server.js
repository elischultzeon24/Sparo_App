import express from 'npm:express@^4.18.2';
import cors from 'npm:cors@^2.8.5';
import { join, dirname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';


try {

    const env = await load();
    

    for (const [key, value] of Object.entries(env)) {
        const trimmedKey = key.trim();
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        // Wichtig: Werte aus .env NUR setzen, wenn noch keine Variable existiert.
        // So überschreibt .env NICHT die Werte, die z.B. von Docker Compose kommen.
        if (trimmedValue && !Deno.env.get(trimmedKey)) {
            Deno.env.set(trimmedKey, trimmedValue);
        }
    }
    console.log('.env Datei geladen');
} catch (err) {
    console.log('Fehler beim Laden der .env Datei:', err.message);

    try {
        const envPath = join(Deno.cwd(), '.env');
        const env = await load({ envPath });
        for (const [key, value] of Object.entries(env)) {
            if (value && typeof value === 'string') {
                Deno.env.set(key.trim(), value.trim());
            }
        }
        console.log('.env Datei aus alternativem Pfad geladen');
    } catch (err2) {
        console.log('Keine .env Datei gefunden. Stelle sicher, dass .env im backend/ Ordner existiert.');
    }
}


const dbHost = Deno.env.get('DB_HOST');
const dbUser = Deno.env.get('DB_USER');
const dbDatabase = Deno.env.get('DB_DATABASE');
const dbPassword = Deno.env.get('DB_PASSWORD');

console.log('🔍 Umgebungsvariablen nach .env Laden:');
console.log('  PORT:', Deno.env.get('PORT') || 'NICHT GESETZT (Standard: 8080)');
console.log('  DB_HOST:', dbHost || 'NICHT GESETZT');
console.log('  DB_USER:', dbUser || 'NICHT GESETZT');
console.log('  DB_DATABASE:', dbDatabase || 'NICHT GESETZT');
console.log('  DB_PASSWORD:', dbPassword ? 'GESETZT' : 'NICHT GESETZT');


if (!dbUser || !dbPassword || !dbDatabase) {
    console.error('FEHLER: Datenbank-Umgebungsvariablen nicht vollständig gesetzt!');
    console.error('   Bitte prüfe die .env Datei im backend/ Ordner.');
    Deno.exit(1);
}


const dbModule = await import('./src/config/db.js');
const authRoutesModule = await import('./src/routes/auth.js');
const transactionRoutesModule = await import('./src/routes/transactions.js');

const db = dbModule.default;
const authRoutes = authRoutesModule.default;
const transactionRoutes = transactionRoutesModule.default;

const app = express();


const PORT = Deno.env.get('PORT') || '8080';


const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            Deno.env.get('FRONTEND_URL')
        ].filter(Boolean);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);


const currentFile = new URL(import.meta.url).pathname;
const __dirname = dirname(currentFile);
const staticFilesPath = join(__dirname, 'public');

app.use(express.static(staticFilesPath));


app.get(/.*/, (req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).send({ message: 'API Endpoint not found' });
    }
    res.sendFile(join(staticFilesPath, 'index.html'));
});


app.listen(parseInt(PORT), () => {
    console.log(`Sparo Backend hört auf http://localhost:${PORT}`);
    console.log(`Frontend wird von: ${staticFilesPath} gehostet.`);
});
