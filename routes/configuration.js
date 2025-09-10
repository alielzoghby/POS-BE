import express from 'express';
import CustomResponse from '../helpers/customResponse.js';
import { ConfigurationController } from '../controllers/index.js';
import { validateMiddleware } from '../helpers/validate_schema.js';
import { SetConfigurationSchema } from '../helpers/validate_schema.js';

const router = express.Router();

// GET /configuration
router.get('/', async (req, res) => {
  const [err, data] = await ConfigurationController.get();
  if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
  return data.send(res);
});

// POST /configuration
router.post('/', validateMiddleware(SetConfigurationSchema), async (req, res) => {
  const [err, data] = await ConfigurationController.set(req.validatedData);
  if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
  return data.send(res);
});

export default router;
