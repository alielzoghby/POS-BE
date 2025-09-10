import prisma from '../utils/prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import CustomResponse from '../helpers/customResponse.js';


export async function isAuthenticatedController(token) {
    try {
        if (!token) {
            return [new CustomResponse(401, 'Token not provided'), null];
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { user_id: decoded.id },
            select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
                role: true,
            },
        });

        if (!user) {
            return [new CustomResponse(401, 'User not found'), null];
        }

        return [null, new CustomResponse(200, 'User authenticated successfully', user)];
    } catch (err) {
        return [new CustomResponse(401, 'Invalid or expired token'), null];
    }
}

export async function loginController({ email, password }) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return [new CustomResponse(401, 'Invalid credentials'), null];
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return [new CustomResponse(401, 'Invalid credentials'), null];
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userData = {
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
        };

        return [null, new CustomResponse(200, 'User logged in successfully', { 
            token, 
            user: userData 
        })];
    } catch (error) {
        console.log(error);
        return [new CustomResponse(500, 'Login failed', { error: error.message }), null];
    }
}
