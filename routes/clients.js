import express from "express";
import CustomResponse from '../helpers/customResponse.js';
import { ClientController } from '../controllers/index.js';
import { validateParamsMiddleware, validateQueryMiddleware, validateMiddleware } from '../helpers/validate_schema.js';
import { CreateClientSchema, UpdateClientSchema, ClientQuerySchema, IdParamSchema } from '../helpers/validate_schema.js';

const router = express.Router();

// GET /clients - Get all clients with filtering and pagination
router.get('/', 
  validateQueryMiddleware(ClientQuerySchema),
  async (req, res, next) => {
    const [err, data] = await ClientController.getAll(req.query);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

// GET /clients/:id - Get client by ID
router.get('/:id', 
  validateParamsMiddleware(IdParamSchema),
  async (req, res, next) => {
    const [err, data] = await ClientController.getById(req.params.id);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

// POST /clients - Create new client
router.post('/', 
  validateMiddleware(CreateClientSchema),
  async (req, res, next) => {
    try {
      // Convert string booleans to actual booleans for validation
      if (req.body.active !== undefined) req.body.active = req.body.active === 'true';
      if (req.body.sales) req.body.sales = parseInt(req.body.sales);

      // Call the controller
      const [err, data] = await ClientController.create(req.validatedData || req.body);
      if (err) {
        return new CustomResponse(err.status, err.message, err.data).send(res);
      }
      return data.send(res);

    } catch (error) {
      return new CustomResponse(500, error.message).send(res);
    }
  }
);

// PUT /clients/:id - Update client by ID
router.put('/:id',
  validateParamsMiddleware(IdParamSchema),
  validateMiddleware(UpdateClientSchema),
  async (req, res, next) => {
    try {
      // Convert string booleans to actual booleans for validation
      if (req.body.active !== undefined) req.body.active = req.body.active === 'true';
      if (req.body.sales) req.body.sales = parseInt(req.body.sales);

      // Call the controller
      const [err, data] = await ClientController.update(req.params.id, req.validatedData || req.body);
      if (err) {
        return new CustomResponse(err.status, err.message, err.data).send(res);
      }
      return data.send(res);

    } catch (error) {
      return new CustomResponse(500, error.message).send(res);
    }
  }
);

// DELETE /clients/:id - Delete client by ID
router.delete('/:id',
  validateParamsMiddleware(IdParamSchema),
  async (req, res) => {
    const [err, data] = await ClientController.delete(req.params.id);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

export default router;
