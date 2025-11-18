import jwt from 'npm:jsonwebtoken@^9.0.2';

const SECRET_KEY = Deno.env.get('JWT_SECRET') || 'DEIN_SEHR_GEHEIMER_SCHLUESSEL';

export const authenticateUser = async (ctx, next) => {
    const authHeader = ctx.request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ctx.response.status = 401;
        ctx.response.body = { 
            message: "Zugriff verweigert. Login erforderlich." 
        };
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        ctx.state.user = { 
            id: decoded.id 
        };
        await next();

    } catch (err) {
        ctx.response.status = 403;
        ctx.response.body = { 
            message: "Token ist ungültig oder abgelaufen." 
        };
    }
};

export default authenticateUser;
