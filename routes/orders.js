import express from 'express';
import CustomResponse from '../helpers/customResponse.js';
import { OrderController } from '../controllers/index.js';
import {
  validateParamsMiddleware,
  validateQueryMiddleware,
  validateMiddleware,
} from '../helpers/validate_schema.js';
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  CreateOrderWithProductsSchema,
  OrderQuerySchema,
  IdParamSchema,
} from '../helpers/validate_schema.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /orders - Get all orders with filtering and pagination
router.get('/', validateQueryMiddleware(OrderQuerySchema), async (req, res, next) => {
  const [err, data] = await OrderController.getAll(req.query);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

// GET /orders/:id - Get order by ID
router.get('/:id', validateParamsMiddleware(IdParamSchema), async (req, res, next) => {
  const [err, data] = await OrderController.getById(req.params.id);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

// POST /orders - Create a new order
router.post('/', authMiddleware, validateMiddleware(CreateOrderSchema), async (req, res, next) => {
  const [err, data] = await OrderController.create(req.validatedData, req.user.id);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

// POST /orders/with-products - Create order with products
router.post(
  '/with-products',
  authMiddleware,
  validateMiddleware(CreateOrderWithProductsSchema),
  async (req, res, next) => {
    const [err, orderResponse] = await OrderController.createWithProducts(
      req.validatedData,
      req.user.id
    );

    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }

    return orderResponse.send(res);
  }
);

// PUT /orders/:id - Update order
router.put(
  '/:id',
  validateParamsMiddleware(IdParamSchema),
  validateMiddleware(UpdateOrderSchema),
  async (req, res, next) => {
    const [err, data] = await OrderController.update(req.params.id, req.validatedData);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

// DELETE /orders/:id - Delete order
router.delete('/:id', validateParamsMiddleware(IdParamSchema), async (req, res, next) => {
  const [err, data] = await OrderController.remove(req.params.id);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

export default router;
