import { z } from 'zod';

// Enums validation schemas
export const UserRoleSchema = z.enum(['ADMIN', 'CASHIER']);
export const TitleSchema = z.enum(['M', 'Mme']);
export const StockStatusEnumSchema = z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK']);
export const StockStatusInputSchema = z.enum(['in stock', 'out of stock', 'low stock']);
export const UnitSchema = z.enum([
  'PIECE',
  'KILOGRAM',
  'GRAM',
  'LITER',
  'MILLILITER',
  'METER',
  'CENTIMETER',
  'PACK',
  'BOX',
  'BOTTLE',
]);
export const PhoneTypeSchema = z.enum(['MOBILE', 'HOME', 'WORK', 'FAX']);
export const PaidStatusSchema = z.enum(['IN_PROGRESS', 'PAID']);

const normalizeStockStatus = (value) => {
  if (!value) return undefined;
  const map = {
    'in stock': 'IN_STOCK',
    'out of stock': 'OUT_OF_STOCK',
    'low stock': 'LOW_STOCK',
    IN_STOCK: 'IN_STOCK',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    LOW_STOCK: 'LOW_STOCK',
  };
  return map[value];
};

// User validation schemas
export const UserSchema = z.object({
  user_id: z.number().int().positive(),
  email: z.string().email().max(100),
  first_name: z.string().min(1).max(30),
  last_name: z.string().min(1).max(30),
  password: z.string().min(6).max(100),
  role: UserRoleSchema,
});

export const CreateUserSchema = z.object({
  email: z.string().email().max(100),
  first_name: z.string().min(1).max(30),
  last_name: z.string().min(1).max(30),
  password: z.string().min(6).max(100),
  role: UserRoleSchema.optional().default('CASHIER'),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().max(100).optional(),
  first_name: z.string().min(1).max(30).optional(),
  last_name: z.string().min(1).max(30).optional(),
  password: z.string().min(6).max(100).optional(),
  role: UserRoleSchema.optional(), // No default value for updates
});

// Auth validation schemas
export const LoginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(100),
});

export const TokenSchema = z.object({
  token: z.string().min(1),
});

// Client validation schemas
export const ClientSchema = z.object({
  client_id: z.number().int().positive(),
  title: TitleSchema.optional(),
  first_name: z.string().min(1).max(30),
  last_name: z.string().min(1).max(30),
  email: z.string().email().max(100),
  company: z.string().max(50).optional(),
  sales: z.number().int().min(0).optional(),
  active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateClientSchema = z.object({
  title: TitleSchema.optional(),
  first_name: z.string().min(1, 'First name is required').max(30, 'Max 30 characters'),
  last_name: z.string().min(1, 'Last name is required').max(30, 'Max 30 characters'),
  email: z.string().email('Invalid email format').max(100, 'Max 100 characters'),
  company: z.string().max(50, 'Max 50 characters').optional(),
  sales: z.number().int().min(0, 'Sales must be >= 0').optional(),
  active: z.boolean().optional().default(true),
  addresses: z
    .array(
      z.object({
        street: z.string().min(1),
        country: z.string().min(1),
        state: z.string().min(1),
        city: z.string().min(1),
        postal_code: z.string().optional(),
        is_primary: z.boolean().optional().default(false),
      })
    )
    .optional(),
  phoneNumbers: z
    .array(
      z.object({
        phone_number: z.string().min(1),
        phone_type: z.string().optional(),
        is_primary: z.boolean().optional().default(false),
      })
    )
    .optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

// Address validation schemas
export const AddressSchema = z.object({
  address_id: z.number().int().positive(),
  client_id: z.number().int().positive(),
  street: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().min(1).max(50),
  is_primary: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateAddressSchema = z.object({
  client_id: z.number().int().positive(),
  street: z.string().min(1).max(100),
  city: z.string().min(1).max(50),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().min(1).max(50),
  is_primary: z.boolean().optional().default(false),
});

export const UpdateAddressSchema = z.object({
  street: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(50).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().min(1).max(50).optional(),
  is_primary: z.boolean().optional(),
});

// Phone Number validation schemas
export const PhoneNumberSchema = z.object({
  phone_id: z.number().int().positive(),
  client_id: z.number().int().positive(),
  phone_number: z.string().min(1).max(20),
  phone_type: PhoneTypeSchema,
  is_primary: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreatePhoneNumberSchema = z.object({
  client_id: z.number().int().positive(),
  phone_number: z.string().min(1).max(20),
  phone_type: PhoneTypeSchema.optional().default('MOBILE'),
  is_primary: z.boolean().optional().default(false),
});

export const UpdatePhoneNumberSchema = z.object({
  phone_number: z.string().min(1).max(20).optional(),
  phone_type: PhoneTypeSchema.optional(),
  is_primary: z.boolean().optional(),
});

// Category validation schemas
export const CategorySchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  created_at: z.date(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Product validation schemas
export const ProductSchema = z.object({
  product_id: z.number().int().positive(),
  image: z.string().max(500).optional(),
  name: z.string().min(1).max(50),
  reference: z.string().min(3).max(20),
  category_id: z.number().int().positive(),
  base_price: z.number().min(0),
  final_price: z.number().min(0),
  status: StockStatusEnumSchema,
  quantity: z.number().int().min(0),
  unit: UnitSchema,
  unit_value: z.number().min(1),
  unit_price: z.number().min(0),
  show_online: z.boolean(),
  sub_product: z.boolean(),
  expiration_date: z.string().max(30).optional(),
  lot: z.string().max(50).optional(),
});

export const CreateProductSchema = z.object({
  image: z.string().max(500).optional(),
  name: z.string().min(1).max(50),
  reference: z.string().min(3).max(20),
  category_id: z.number().int().positive(),
  base_price: z.number().min(0),
  final_price: z.number().min(0),
  status: z
    .union([StockStatusEnumSchema, StockStatusInputSchema])
    .optional()
    .transform((val) => normalizeStockStatus(val) ?? 'IN_STOCK'),
  quantity: z.number().int().min(0),
  unit: UnitSchema.optional().default('PIECE'),
  unit_value: z.number().min(1).optional().default(1),
  unit_price: z.number().min(0).optional().default(0),
  show_online: z.boolean().optional().default(true),
  sub_product: z.boolean().optional().default(false),
  expiration_date: z.string().max(30).optional(),
  lot: z.string().max(50).optional(),
});

export const UpdateProductSchema = z.object({
  image: z.string().max(500).optional(),
  name: z.string().min(1).max(50).optional(),
  reference: z.string().min(3).max(20).optional(),
  category_id: z.number().int().positive().optional(),
  base_price: z.number().min(0).optional(),
  final_price: z.number().min(0).optional(),
  status: z
    .union([StockStatusEnumSchema, StockStatusInputSchema])
    .optional()
    .transform((val) => (val ? normalizeStockStatus(val) : undefined)),
  quantity: z.number().int().min(0).optional(),
  unit: UnitSchema.optional(),
  unit_value: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
  show_online: z.boolean().optional(),
  sub_product: z.boolean().optional(),
  expiration_date: z.string().max(30).optional(),
  lot: z.string().max(50).optional(),
});

export const CreateSubProductSchema = z.object({
  reference: z.string().min(3).max(20),
  unit_value: z.number().min(0).optional().default(0),
});

// Order validation schemas
export const OrderSchema = z.object({
  order_id: z.number().int().positive(),
  client_id: z.number().int().positive().optional(),
  reference: z.string().min(1).optional(),
  voucher_reference: z.string().min(1).optional(),
  payment_method: z.enum(['CASH', 'CARD']).optional(),
  tip: z.number().min(0).optional(),
  payment_reference: z.string().min(1).optional(),
  total_price: z.number().min(0),
});

// Voucher validation schemas (exactly one of amount or percentage)
export const CreateVoucherSchema = z
  .object({
    amount: z.number().int().min(1).optional(),
    percentage: z.number().int().min(1).max(100).optional(),
    voucher_reference: z.string().optional(),
    active: z.boolean().optional().default(true),
    expired_at: z.coerce.date().optional(),
    multiple: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      const hasAmount = typeof data.amount === 'number';
      const hasPercentage = typeof data.percentage === 'number';
      return (hasAmount || hasPercentage) && !(hasAmount && hasPercentage);
    },
    {
      message: 'Provide exactly one of amount or percentage',
    }
  );

export const UpdateVoucherSchema = z
  .object({
    amount: z.number().int().min(1).optional(),
    percentage: z.number().int().min(1).max(100).optional(),
    voucher_reference: z.string().optional(),
    voucher_id: z.number().int().positive().optional(),
    active: z.boolean().optional(),
    expired_at: z.coerce.date().optional(),
    multiple: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const hasAmount = typeof data.amount === 'number';
      const hasPercentage = typeof data.percentage === 'number';
      return (hasAmount || hasPercentage) && !(hasAmount && hasPercentage);
    },
    {
      message: 'Provide exactly one of amount or percentage',
    }
  );

export const VoucherQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
});

// Configration validation schemas
export const ConfigurationSchema = z.object({
  id: z.number().int().positive(),
  tax: z.number().int().min(0).max(100),
});

export const SetConfigurationSchema = z.object({
  tax: z.number().int().min(0).max(100),
});

export const CreateOrderSchema = z.object({
  client_id: z.number().int().positive().optional(),
  voucher_reference: z.string().optional(),
  payment_method: z.enum(['CASH', 'CARD']).optional(),
  tip: z.number().min(0).optional(),
  paid: z.number().min(0).optional().default(0),
});

export const UpdateOrderSchema = z.object({
  client_id: z.number().int().positive().optional(),
  total_price: z.number().min(0).optional(),
  voucher_reference: z.string().optional(),
  payment_method: z.enum(['CASH', 'CARD']).optional(),
  tip: z.number().min(0).optional(),
  reference: z.string().optional(),
  paid: z.number().min(0).optional(),
  products: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        price: z.number().min(0),
      })
    )
    .optional(),
});

// ProductOrder validation schemas
export const ProductOrderSchema = z.object({
  product_id: z.number().int().positive(),
  order_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
});

export const CreateProductOrderSchema = z.object({
  product_id: z.number().int().positive(),
  order_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
});

export const UpdateProductOrderSchema = CreateProductOrderSchema.partial();

// Complex validation schemas for creating orders with products
export const CreateOrderWithProductsSchema = z.object({
  client_id: z.number().int().positive().optional(),
  products: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        price: z.number().min(0),
      })
    )
    .min(1),
  voucher_reference: z.string().optional(),
  payment_method: z.enum(['CASH', 'CARD']).optional(),
  tip: z.number().min(0).optional(),
  paid: z.number().min(0).optional().default(0),
});

// Query parameter validation schemas
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const ClientQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  company: z.string().optional(),
});

export const ProductQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  reference: z.string().optional(),
  category_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? normalizeStockStatus(val) : undefined)),
});

export const OrderQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  reference: z.string().optional(),
  client_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
});

export const CategoryQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
});

export const UserQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
});

// ID parameter validation
export const IdParamSchema = z.object({
  id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ID must be a positive integer',
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

// Validation utility functions
export const validateSchema = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.errors,
    };
  }
};

export const validateAsync = async (schema, data) => {
  try {
    const result = await schema.parseAsync(data);
    return {
      success: true,
      data: result,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.errors,
    };
  }
};

// Middleware for validation
export const validateMiddleware = (schema) => {
  return (req, res, next) => {
    const result = validateSchema(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        status: 400,
        message: 'Validation failed',
        data: {
          errors: result.error,
        },
      });
    }
    req.validatedData = result.data;
    next();
  };
};

export const validateParamsMiddleware = (schema) => {
  return (req, res, next) => {
    const result = validateSchema(schema, req.params);
    if (!result.success) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid parameters',
        data: {
          errors: result.error,
        },
      });
    }
    req.validatedParams = result.data;
    next();
  };
};

export const validateQueryMiddleware = (schema) => {
  return (req, res, next) => {
    const result = validateSchema(schema, req.query);
    if (!result.success) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid query parameters',
        data: {
          errors: result.error,
        },
      });
    }
    req.validatedQuery = result.data;
    next();
  };
};
