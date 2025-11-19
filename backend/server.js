import { Application, Router } from 'https://deno.land/x/oak@v16.0.0/mod.ts';
import { join, dirname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';

try {
    const env = await load();
    
    for (const [key, value] of Object.entries(env)) {
        const trimmedKey = key.trim();
        const trimmedValue = typeof value === 'string' ? value.trim() : value;

        if (trimmedValue && !Deno.env.get(trimmedKey)) {
            Deno.env.set(trimmedKey, trimmedValue);
        }
    }
} catch (err) {
    try {
        const envPath = join(Deno.cwd(), '.env');
        const env = await load({ envPath });
        for (const [key, value] of Object.entries(env)) {
            if (value && typeof value === 'string') {
                Deno.env.set(key.trim(), value.trim());
            }
        }
    } catch (err2) {
    }
}

const dbHost = Deno.env.get('DB_HOST');
const dbUser = Deno.env.get('DB_USER');
const dbDatabase = Deno.env.get('DB_DATABASE');
const dbPassword = Deno.env.get('DB_PASSWORD');


if (!dbUser || !dbPassword || !dbDatabase) {
    console.error('FEHLER: Datenbank-Umgebungsvariablen nicht vollständig gesetzt!');
    console.error('Bitte prüfe die .env Datei im backend/ Ordner.');
    Deno.exit(1);
}

const dbModule = await import('./src/config/db.js');
const authRoutesModule = await import('./src/routes/auth.js');
const transactionRoutesModule = await import('./src/routes/transactions.js');

const db = dbModule.default;
const authRoutes = authRoutesModule.default;
const transactionRoutes = transactionRoutesModule.default;

const app = new Application();
const PORT = parseInt(Deno.env.get('PORT') || '8080');

app.use(async (ctx, next) => {
    const origin = ctx.request.headers.get('origin');
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        Deno.env.get('FRONTEND_URL')
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
        ctx.response.headers.set('Access-Control-Allow-Origin', origin || '*');
        ctx.response.headers.set('Access-Control-Allow-Credentials', 'true');
        ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    
    if (ctx.request.method === 'OPTIONS') {
        ctx.response.status = 204;
        return;
    }
    
    await next();
});

app.use(async (ctx, next) => {
    ctx.state.body = {};
    if (ctx.request.hasBody) {
        try {
            const bodyReader = ctx.request.body;
            const bodyType = await bodyReader.type();
            if (bodyType === 'json') {
                ctx.state.body = await bodyReader.json();
            } else {
                ctx.state.body = await bodyReader.text();
            }
        } catch (error) {
            console.error('Body Parser Fehler:', error.message);
            ctx.state.body = {};
        }
    }
    await next();
});

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error('Unbehandelter Fehler:', err);
        ctx.response.status = err.status || 500;
        ctx.response.body = { message: err.message || 'Interner Serverfehler' };
    }
});

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(transactionRoutes.routes());
app.use(transactionRoutes.allowedMethods());

const currentFile = new URL(import.meta.url).pathname;
const __dirname = dirname(currentFile);
const staticFilesPath = join(__dirname, 'public');

app.use(async (ctx, next) => {
    const path = ctx.request.url.pathname;
    
    if (path.startsWith('/api')) {
        if (!ctx.response.status || ctx.response.status === 404) {
            ctx.response.status = 404;
            ctx.response.body = { message: 'API Endpoint not found' };
        }
        return;
    }
 
    try {
        const filePath = join(staticFilesPath, path === '/' ? 'index.html' : path);
        const fileInfo = await Deno.stat(filePath);

        if (fileInfo.isFile) {
            ctx.response.body = await Deno.readFile(filePath);
            const ext = path.split('.').pop() || '';
            const contentTypeMap = {
                'html': 'text/html',
                'js': 'application/javascript',
                'css': 'text/css',
                'json': 'application/json',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'svg': 'image/svg+xml'
            };
            ctx.response.headers.set('Content-Type', contentTypeMap[ext] || 'text/plain');
            return;
        }
    } catch (error) {
        // Datei nicht gefunden
    }

    try {
        const indexPath = join(staticFilesPath, 'index.html');
        ctx.response.body = await Deno.readFile(indexPath);
        ctx.response.headers.set('Content-Type', 'text/html');
    } catch (error) {
        ctx.response.status = 404;
        ctx.response.body = { message: 'Not found' };
    }
});

try {
    await app.listen({ port: PORT, hostname: '0.0.0.0' });
} catch (error) {
    console.error('FEHLER beim Starten des Servers:', error);
    Deno.exit(1);
}
