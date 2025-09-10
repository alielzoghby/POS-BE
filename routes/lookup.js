import express from 'express';
import CustomResponse from '../helpers/customResponse.js';
import { LookupController } from '../controllers/index.js';
import { validateQueryMiddleware } from '../helpers/validate_schema.js';
import { CategoryQuerySchema } from '../helpers/validate_schema.js';

const router = express.Router();

// GET /categories - Get all categories with filtering and pagination
router.get('/categories', validateQueryMiddleware(CategoryQuerySchema), async (req, res, next) => {
  const [err, data] = await LookupController.getAllProductCategories(req.query);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

//GET /clints - Get all clients
router.get('/clients', async (req, res, next) => {
  const [err, data] = await LookupController.getAllClients(req.query);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

export default router;
