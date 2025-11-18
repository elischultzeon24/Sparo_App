import db from '../config/db.js';
import bcrypt from 'npm:bcryptjs@^2.4.3';
import jwt from 'npm:jsonwebtoken@^9.0.2';

export const register = async (ctx) => {
    const body = ctx.state.body || {};
    const { email, password } = body;
    let userId;

    if (!email || !password) {
        ctx.response.status = 400;
        ctx.response.body = { message: 'E-Mail und Passwort sind erforderlich.' };
        return;
    }
    
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const [results] = await db.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );
        
        userId = results.insertId;

        const token = jwt.sign(
            { id: userId, email: email },
            Deno.env.get('JWT_SECRET') || 'DEIN_SEHR_GEHEIMER_SCHLUESSEL',
            { expiresIn: '1d' }
        );

        ctx.response.status = 201;
        ctx.response.body = {
            message: 'Registrierung erfolgreich!',
            token: token,
            user: { id: userId, email: email }
        };

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            ctx.response.status = 409;
            ctx.response.body = { message: 'Diese E-Mail-Adresse wird bereits verwendet.' };
            return;
        }
        console.error("Registrierungsfehler:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: 'Interner Serverfehler bei der Registrierung.' };
    }
};

export const login = async (ctx) => {
    const body = ctx.state.body || {};
    const { email, password } = body;

    if (!email || !password) {
        ctx.response.status = 400;
        ctx.response.body = { message: 'E-Mail und Passwort sind erforderlich.' };
        return;
    }

    try {
        const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = userRows[0];

        if (!user) {
            ctx.response.status = 401;
            ctx.response.body = { message: 'Ungültige Anmeldedaten.' };
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            ctx.response.status = 401;
            ctx.response.body = { message: 'Ungültige Anmeldedaten.' };
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            Deno.env.get('JWT_SECRET') || 'DEIN_SEHR_GEHEIMER_SCHLUESSEL',
            { expiresIn: '1d' }
        );

        ctx.response.status = 200;
        ctx.response.body = {
            message: 'Anmeldung erfolgreich!',
            token: token,
            user: { id: user.id, email: user.email }
        };

    } catch (error) {
        console.error("Login-Fehler:", error);
        ctx.response.status = 500;
        ctx.response.body = { message: 'Interner Serverfehler beim Login.' };
    }
};
