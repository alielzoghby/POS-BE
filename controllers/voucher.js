import prisma from '../utils/prismaClient.js';
import {
  CreateVoucherSchema,
  UpdateVoucherSchema,
  validateSchema,
  IdParamSchema,
} from '../helpers/validate_schema.js';
import CustomResponse from '../helpers/customResponse.js';
import { generateReference } from '../helpers/generate-reference.js';

// Create voucher (voucher_reference auto-generated unless provided)
const create = async (data) => {
  const validation = validateSchema(CreateVoucherSchema, data);
  if (!validation.success) {
    return [new CustomResponse(400, 'Validation failed', validation.error), null];
  }

  const { amount, percentage, voucher_reference, ...validationData } = validation.data;

  if (voucher_reference) {
    const exists = await prisma.voucher_table.findUnique({ where: { voucher_reference } });
    if (exists) {
      return [new CustomResponse(409, 'Voucher with this reference already exists'), null];
    }
  }

  const voucher = await prisma.voucher_table.create({
    data: {
      amount: amount ?? null,
      percentage: percentage ?? null,
      voucher_reference: voucher_reference ?? generateReference(),
      ...validationData,
    },
  });
  return [null, new CustomResponse(201, 'Voucher created successfully', voucher)];
};

// List vouchers with search functionality
const getAll = async (query = {}) => {
  const page = parseInt(query.page ?? 1);
  const limit = parseInt(query.limit ?? 10);
  const skip = (page - 1) * limit;
  const search = query.search || '';

  // Build where clause for search
  const whereClause = search
    ? {
        voucher_reference: {
          contains: search,
        },
      }
    : {};

  const [vouchers, totalCount] = await Promise.all([
    prisma.voucher_table.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { voucher_id: 'desc' },
    }),
    prisma.voucher_table.count({ where: whereClause }),
  ]);

  return [
    null,
    new CustomResponse(200, 'Vouchers retrieved successfully', {
      vouchers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalDocuments: totalCount,
        itemsPerPage: limit,
      },
    }),
  ];
};

const getById = async (id) => {
  const parsed = validateSchema(IdParamSchema, { id: String(id) });
  if (!parsed.success) {
    return [new CustomResponse(400, 'Invalid voucher ID', parsed.error), null];
  }
  const voucher = await prisma.voucher_table.findUnique({ where: { voucher_id: parsed.data.id } });
  if (!voucher) {
    return [new CustomResponse(404, 'Voucher not found'), null];
  }
  return [null, new CustomResponse(200, 'Voucher retrieved successfully', voucher)];
};

const getByReference = async (voucher_reference) => {
  const voucher = await prisma.voucher_table.findUnique({ where: { voucher_reference } });
  if (!voucher) {
    return [new CustomResponse(404, 'Voucher not found'), null];
  }
  return [null, new CustomResponse(200, 'Voucher retrieved successfully', voucher)];
};

// Helper function to validate voucher usage
const validateVoucherForOrder = async (voucher_reference) => {
  if (!voucher_reference) return { valid: true };

  const voucher = await prisma.voucher_table.findUnique({
    where: { voucher_reference: voucher_reference },
    include: { orders: true },
  });

  if (!voucher) {
    return { valid: false, error: 'Voucher not found' };
  }

  // Check if voucher is active
  if (!voucher.active) {
    return { valid: false, error: 'Voucher is inactive' };
  }

  // Check if voucher is expired
  if (voucher.expired_at && new Date() > voucher.expired_at) {
    return { valid: false, error: 'Voucher has expired' };
  }

  // Check if voucher can be used multiple times
  if (!voucher.multiple && voucher.orders.length > 0) {
    return { valid: false, error: 'Voucher can only be used once and has already been used' };
  }

  return { valid: true, voucher };
};

const update = async (id, data) => {
  const parsed = validateSchema(IdParamSchema, { id: String(id) });
  if (!parsed.success) {
    return [new CustomResponse(400, 'Invalid voucher ID', parsed.error), null];
  }

  const validation = validateSchema(UpdateVoucherSchema, data);
  if (!validation.success) {
    return [new CustomResponse(400, 'Validation failed', validation.error), null];
  }

  // Ensure voucher exists
  const existing = await prisma.voucher_table.findUnique({ where: { voucher_id: parsed.data.id } });
  if (!existing) {
    return [new CustomResponse(404, 'Voucher not found'), null];
  }

  const { voucher_id, ...validationData } = validation.data;

  // Apply XOR semantics in update: only one field is set, the other must be null
  const updateData = {
    ...validationData,
    amount: null,
    percentage: null,
    ...('amount' in validationData ? { amount: validationData.amount } : {}),
    ...('percentage' in validationData ? { percentage: validationData.percentage } : {}),
  };

  const updated = await prisma.voucher_table.update({
    where: { voucher_id: parsed.data.id },
    data: updateData,
  });
  return [null, new CustomResponse(200, 'Voucher updated successfully', updated)];
};

const remove = async (id) => {
  const parsed = validateSchema(IdParamSchema, { id: String(id) });
  if (!parsed.success) {
    return [new CustomResponse(400, 'Invalid voucher ID', parsed.error), null];
  }

  const existing = await prisma.voucher_table.findUnique({ where: { voucher_id: parsed.data.id } });
  if (!existing) {
    return [new CustomResponse(404, 'Voucher not found'), null];
  }

  // Prevent deleting voucher in use by any order
  const usedOrder = await prisma.order.findFirst({
    where: { voucher_reference: existing.voucher_reference },
  });
  if (usedOrder) {
    return [new CustomResponse(400, 'Cannot delete voucher referenced by existing orders'), null];
  }

  await prisma.voucher_table.delete({ where: { voucher_id: parsed.data.id } });
  return [null, new CustomResponse(200, 'Voucher deleted successfully')];
};

export default {
  create,
  getAll,
  getById,
  getByReference,
  update,
  remove,
  validateVoucherForOrder,
};
