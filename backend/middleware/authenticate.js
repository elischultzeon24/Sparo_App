import jwt from 'npm:jsonwebtoken@^9.0.2';

const SECRET_KEY = Deno.env.get('JWT_SECRET') || 'DEIN_SEHR_GEHEIMER_SCHLUESSEL';

export const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: "Zugriff verweigert. Login erforderlich." 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        req.user = { 
            id: decoded.id 
        };
        
        next();

    } catch (err) {
        return res.status(403).json({ 
            message: "Token ist ungültig oder abgelaufen." 
        });
    }
};

export default authenticateUser;
