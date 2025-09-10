import prisma from '../utils/prismaClient.js';
import { SetConfigurationSchema, validateSchema } from '../helpers/validate_schema.js';
import CustomResponse from '../helpers/customResponse.js';

// Get current configuration (single row, id=1)
const get = async () => {
  const config = await prisma.configuration.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, tax: 0 }
  });
  return [null, new CustomResponse(200, 'Configuration retrieved successfully', config)];
};

// Set/update tax
const set = async (data) => {
  const validation = validateSchema(SetConfigurationSchema, data);
  if (!validation.success) {
    return [new CustomResponse(400, 'Validation failed', validation.error), null];
  }
  const updated = await prisma.configuration.upsert({
    where: { id: 1 },
    update: { tax: validation.data.tax },
    create: { id: 1, tax: validation.data.tax }
  });
  return [null, new CustomResponse(200, 'Configuration updated successfully', updated)];
};

export default { get, set };


