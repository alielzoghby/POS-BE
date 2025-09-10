import express from 'express';
import productsRouter from './products.js';
import clientsRouter from './clients.js';
import categoriesRouter from './categories.js';
import ordersRouter from './orders.js';
import usersRouter from './users.js';
import authRouter from './auth.js';
import lookupRouter from './lookup.js';
import vouchersRouter from './vouchers.js';
import configurationRouter from './configuration.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/products', productsRouter);
router.use('/clients', clientsRouter);
router.use('/categories', categoriesRouter);
router.use('/orders', ordersRouter);
router.use('/lookup', lookupRouter);
router.use('/vouchers', vouchersRouter);
router.use('/configuration', configurationRouter);

export default router;
