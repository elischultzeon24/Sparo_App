import db from '../config/db.js';
import bcrypt from 'npm:bcryptjs@^2.4.3';
import jwt from 'npm:jsonwebtoken@^9.0.2';

export const register = async (req, res) => {
    const { email, password } = req.body;
    let userId;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
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

        return res.status(201).json({
            message: 'Registrierung erfolgreich!',
            token: token,
            user: { id: userId, email: email }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Diese E-Mail-Adresse wird bereits verwendet.' });
        }
        console.error("Registrierungsfehler:", error);
        res.status(500).json({ message: 'Interner Serverfehler bei der Registrierung.' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = userRows[0];

        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            Deno.env.get('JWT_SECRET') || 'DEIN_SEHR_GEHEIMER_SCHLUESSEL',
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Anmeldung erfolgreich!',
            token: token,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error("Login-Fehler:", error);
        res.status(500).json({ message: 'Interner Serverfehler beim Login.' });
    }
};
