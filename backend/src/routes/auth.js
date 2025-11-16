import express from 'npm:express@^4.18.2';
import { register, login } from '../controller/authControllers.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export default router;
