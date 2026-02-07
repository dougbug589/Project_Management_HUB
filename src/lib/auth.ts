import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(
  payload: any,
  expiresIn: string = "7d"
): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-key"
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): any {
  try {
    const secret = process.env.JWT_SECRET || "fallback-secret-key"
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}

export function decodeToken(token: string): any {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}

export function getUserFromRequest(req: Request): any {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload || !payload.userId) {
      return null
    }

    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      organizationRole: payload.organizationRole,
    }
  } catch (error) {
    return null
  }
}
