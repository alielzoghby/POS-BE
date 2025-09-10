import prisma from '../utils/prismaClient.js';
import bcrypt from 'bcryptjs';
import CustomResponse from '../helpers/customResponse.js';

export async function getAllUsersController(queryParams = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'user_id',
      sortOrder = 'asc',
    } = queryParams;

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const totalPages = Math.ceil(totalUsers / limit);

    const paginationData = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalDocuments: totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        itemsPerPage: limit,
      },
    };

    return [null, new CustomResponse(200, 'Users retrieved successfully', paginationData)];
  } catch (error) {
    return [new CustomResponse(500, 'Failed to fetch users', { error: error.message }), null];
  }
}

export async function getUserByIdController(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });

    if (!user) {
      return [new CustomResponse(404, 'User not found'), null];
    }

    return [null, new CustomResponse(200, 'User retrieved successfully', user)];
  } catch (error) {
    return [new CustomResponse(500, 'Failed to fetch user', { error: error.message }), null];
  }
}

export async function createUserController(userData, currentUser) {
  try {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return [new CustomResponse(403, 'Only admins can create users'), null];
    }

    const { email, first_name, last_name, password, role = 'CASHIER' } = userData;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return [new CustomResponse(409, 'Email already in use'), null];
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        first_name,
        last_name,
        password: hashedPassword,
        role,
      },
    });

    const userData2 = {
      user_id: newUser.user_id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      role: newUser.role,
    };

    return [null, new CustomResponse(201, 'User created successfully', userData2)];
  } catch (error) {
    console.log(error);
    return [new CustomResponse(500, 'Failed to create user', { error: error.message }), null];
  }
}

export async function updateUserController(userId, updateData, currentUser) {
  try {
    // Check authentication
    if (!currentUser) {
      return [new CustomResponse(401, 'Authentication required'), null];
    }

    const isAdmin = currentUser.role === 'ADMIN';
    const isOwnProfile = currentUser.user_id === userId;

    // Authorization: user can update their own profile OR admin can update any profile
    if (!isAdmin && !isOwnProfile) {
      return [new CustomResponse(403, 'You can only update your own profile'), null];
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return [new CustomResponse(404, 'User not found'), null];
    }

    // Prepare data to update
    const dataToUpdate = { ...updateData };

    // Role change restrictions - only admins can change roles
    if (dataToUpdate.role && !isAdmin) {
      return [new CustomResponse(403, 'Only admins can change user roles'), null];
    }

    // Non-admin users can only update certain fields
    if (!isAdmin) {
      // Only allow updating: first_name, last_name, email, password
      const allowedFields = ['first_name', 'last_name', 'email', 'password'];
      Object.keys(dataToUpdate).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete dataToUpdate[key];
        }
      });
    }

    // Check if email is being updated and if it's already in use
    if (dataToUpdate.email && dataToUpdate.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: dataToUpdate.email },
      });
      if (emailExists) {
        return [new CustomResponse(409, 'Email already in use'), null];
      }
    }

    // Hash password if it's being updated
    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: dataToUpdate,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });

    return [null, new CustomResponse(200, 'User updated successfully', updatedUser)];
  } catch (error) {
    console.log(error);
    return [new CustomResponse(500, 'Failed to update user', { error: error.message }), null];
  }
}
