import swaggerAutogen from 'swagger-autogen';

const swaggerAutogenInstance = swaggerAutogen({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'Freelance Management API',
    description: 'Complete API documentation for freelance management system with products, orders, clients, and more',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    { 
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          user_id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Doe' },
          role: { type: 'string', enum: ['ADMIN', 'CASHIER'], example: 'CASHIER' }
        }
      },
      CreateUser: {
        type: 'object',
        required: ['email', 'first_name', 'last_name', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Doe' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          role: { type: 'string', enum: ['ADMIN', 'CASHIER'], default: 'CASHIER' }
        }
      },
      // Client schemas
      Client: {
        type: 'object',
        properties: {
          client_id: { type: 'integer', example: 1 },
          title: { type: 'string', enum: ['M', 'Mme'], example: 'M' },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Smith' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          company: { type: 'string', example: 'Tech Corp' },
          sales: { type: 'integer', example: 1500 },
          active: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      CreateClient: {
        type: 'object',
        required: ['first_name', 'last_name', 'email'],
        properties: {
          title: { type: 'string', enum: ['M', 'Mme'] },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Smith' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          company: { type: 'string', example: 'Tech Corp' },
          sales: { type: 'integer', minimum: 0, example: 1500 },
          active: { type: 'boolean', default: true }
        }
      },
      // Address schemas
      Address: {
        type: 'object',
        properties: {
          address_id: { type: 'integer', example: 1 },
          client_id: { type: 'integer', example: 1 },
          street: { type: 'string', example: '123 Main St' },
          city: { type: 'string', example: 'New York' },
          state: { type: 'string', example: 'NY' },
          postal_code: { type: 'string', example: '10001' },
          country: { type: 'string', example: 'USA' },
          is_primary: { type: 'boolean', example: true }
        }
      },
      // Phone Number schemas
      PhoneNumber: {
        type: 'object',
        properties: {
          phone_id: { type: 'integer', example: 1 },
          client_id: { type: 'integer', example: 1 },
          phone_number: { type: 'string', example: '+1234567890' },
          phone_type: { type: 'string', enum: ['MOBILE', 'HOME', 'WORK', 'FAX'], example: 'MOBILE' },
          is_primary: { type: 'boolean', example: true }
        }
      },
      // Product schemas
      Product: {
        type: 'object',
        properties: {
          product_id: { type: 'integer', example: 1 },
          image: { type: 'string', example: 'https://example.com/image.jpg' },
          name: { type: 'string', example: 'Product Name' },
          reference: { type: 'string', example: 'PRD001' },
          category_id: { type: 'integer', example: 1 },
          base_price: { type: 'number', format: 'float', example: 99.99 },
          final_price: { type: 'number', format: 'float', example: 89.99 },
          status: { type: 'string', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK'], example: 'IN_STOCK' },
          quantity: { type: 'integer', minimum: 0, example: 100 },
          unit: { type: 'string', enum: ['PIECE', 'KILOGRAM', 'GRAM', 'LITER', 'MILLILITER', 'METER', 'CENTIMETER', 'PACK', 'BOX', 'BOTTLE'], example: 'PIECE' },
          unit_value: { type: 'integer', minimum: 1, example: 1 },
          unit_price: { type: 'integer', minimum: 0, example: 0 },
          show_online: { type: 'boolean', example: true },
          sub_product: { type: 'boolean', example: false },
          expiration_date: { type: 'string', example: '2024-12-31' },
          lot: { type: 'string', example: 'LOT001' }
        }
      },
      CreateProduct: {
        type: 'object',
        required: ['name', 'reference', 'category_id', 'base_price', 'final_price', 'quantity'],
        properties: {
          image: { type: 'string', example: 'https://example.com/image.jpg' },
          name: { type: 'string', example: 'Product Name' },
          reference: { type: 'string', minLength: 3, maxLength: 20, example: 'PRD001' },
          category_id: { type: 'integer', example: 1 },
          base_price: { type: 'number', format: 'float', minimum: 0, example: 99.99 },
          final_price: { type: 'number', format: 'float', minimum: 0, example: 89.99 },
          status: { type: 'string', enum: ['in stock', 'out of stock', 'low stock'], default: 'in stock' },
          quantity: { type: 'integer', minimum: 0, example: 100 },
          unit: { type: 'string', enum: ['PIECE', 'KILOGRAM', 'GRAM', 'LITER', 'MILLILITER', 'METER', 'CENTIMETER', 'PACK', 'BOX', 'BOTTLE'], default: 'PIECE' },
          unit_value: { type: 'integer', minimum: 1, default: 1 },
          unit_price: { type: 'integer', minimum: 0, default: 0 },
          show_online: { type: 'boolean', default: true },
          sub_product: { type: 'boolean', default: false },
          expiration_date: { type: 'string', example: '2024-12-31' },
          lot: { type: 'string', example: 'LOT001' }
        }
      },
      // Category schemas
      Category: {
        type: 'object',
        properties: {
          category_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Electronics' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      CreateCategory: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50, example: 'Electronics' }
        }
      },
      // Order schemas
      Order: {
        type: 'object',
        properties: {
          order_id: { type: 'integer', example: 1 },
          client_id: { type: 'integer', example: 1 },
          reference: { type: 'string', example: 'ORD-123456' },
          total_price: { type: 'number', format: 'float', example: 199.99 },
          tip: { type: 'number', format: 'float', example: 10.00 },
          payment_methoud: { type: 'string', enum: ['CASH', 'CARD'], example: 'CARD' },
          voucher_refrence: { type: 'string', example: 'VOUCHER-123' },
          payment_refrence: { type: 'string', example: 'PAY-123456' }
        }
      },
      CreateOrder: {
        type: 'object',
        properties: {
          client_id: { type: 'integer', example: 1 },
          voucher_refrence: { type: 'string', example: 'VOUCHER-123' },
          payment_methoud: { type: 'string', enum: ['CASH', 'CARD'], example: 'CARD' },
          tip: { type: 'number', format: 'float', minimum: 0, example: 10.00 }
        }
      },
      CreateOrderWithProducts: {
        type: 'object',
        required: ['products'],
        properties: {
          client_id: { type: 'integer', example: 1 },
          products: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['product_id', 'quantity', 'price'],
              properties: {
                product_id: { type: 'integer', example: 1 },
                quantity: { type: 'integer', minimum: 1, example: 2 },
                price: { type: 'number', format: 'float', minimum: 0, example: 99.99 }
              }
            }
          },
          voucher_refrence: { type: 'string', example: 'VOUCHER-123' },
          payment_methoud: { type: 'string', enum: ['CASH', 'CARD'], example: 'CARD' },
          tip: { type: 'number', format: 'float', minimum: 0, example: 10.00 }
        }
      },
      // Voucher schemas
      Voucher: {
        type: 'object',
        properties: {
          voucher_id: { type: 'integer', example: 1 },
          amount: { type: 'integer', example: 50 },
          percentage: { type: 'integer', example: 10 },
          voucher_refrence: { type: 'string', example: 'VOUCHER-123' }
        }
      },
      CreateVoucher: {
        type: 'object',
        properties: {
          amount: { type: 'integer', minimum: 1, example: 50 },
          percentage: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
          voucher_refrence: { type: 'string', example: 'VOUCHER-123' }
        }
      },
      // Response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Error message' },
          data: { type: 'object' }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Validation failed' },
          data: {
            type: 'object',
            properties: {
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    expected: { type: 'string' },
                    received: { type: 'string' },
                    path: { type: 'array', items: { type: 'string' } },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Clients',
      description: 'Client management endpoints'
    },
    {
      name: 'Products',
      description: 'Product management endpoints'
    },
    {
      name: 'Categories',
      description: 'Category management endpoints'
    },
    {
      name: 'Orders',
      description: 'Order management endpoints'
    },
    {
      name: 'Vouchers',
      description: 'Voucher management endpoints'
    },
    {
      name: 'Configuration',
      description: 'System configuration endpoints'
    },
    {
      name: 'Lookup',
      description: 'Lookup data endpoints'
    }
  ]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/index.js'];

// Generate swagger-output.json automatically
swaggerAutogenInstance(outputFile, endpointsFiles, doc);
