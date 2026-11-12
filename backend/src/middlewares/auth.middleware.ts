import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(' ') ?? [];
  const jwtSecret = process.env.JWT_SECRET;

  if (scheme !== 'Bearer' || !token) {
    res.status(403).json({ message: 'Acceso denegado. Faltan credenciales.' });
    return;
  }

  if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    res.status(503).json({ message: 'La autenticación no está configurada correctamente.' });
    return;
  }

  try {
    const claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (typeof claims !== 'object' || claims.role !== 'admin') {
      res.status(401).json({ message: 'Token inválido o expirado.' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};
