import { Router } from 'express';
import userModel from './users';

const router = Router();

router.use('/users', userModel);

export default router;
