import { Router } from 'express';
import userModel from './users';
import { login } from '../controllers/users';

const router = Router();

router.use('/users', userModel);
router.post('/signin', login);

export default router;
