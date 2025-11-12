import { Router } from 'express';
import userRouter from './users';
import { login } from '../controllers/users';

const router = Router();

router.use('/users', userRouter);
router.post('/signin', login);

export default router;
