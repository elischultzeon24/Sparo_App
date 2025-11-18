import { Router } from 'https://deno.land/x/oak@v16.0.0/mod.ts';
import { register, login } from '../controller/authControllers.js';

const router = new Router();

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);

export default router;
