import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  const cookieToken = req.cookies?.authToken as string | undefined;
  const token = bearerToken || cookieToken || null;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET is not defined');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};



// import { Request, Response, NextFunction } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';

// // 1. Better Typing (no 'as any')
// interface AuthRequest extends Request {
//   userId?: string;
// }

// export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

//   if (!token) {
//     return res.status(401).json({ error: 'Missing or malformed token' });
//   }

//   // 2. Remove the '!' - handle the missing secret explicitly
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     console.error("CRITICAL: JWT_SECRET is not defined");
//     return res.status(500).json({ error: 'Server configuration error' });
//   }

//   try {
//     const decoded = jwt.verify(token, secret);

//     // 3. Verify the payload actually contains what you need
//     if (typeof decoded !== 'string' && 'userId' in decoded) {
//       req.userId = (decoded as JwtPayload).userId;
//       return next();
//     }
    
//     throw new Error("Payload missing userId");
//   } catch (err) {
//     return res.status(401).json({ error: 'Invalid or expired token' });
//   }
// };
