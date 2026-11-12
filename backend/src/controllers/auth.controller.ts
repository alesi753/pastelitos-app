import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const login = (req: Request, res: Response): void => {
  const { password } = req.body as { password?: unknown };
  const adminPassword = process.env.ADMIN_PASS;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminPassword || !jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    res.status(503).json({ message: 'El acceso de administrador no está configurado correctamente.' });
    return;
  }

  if (typeof password !== 'string') {
    res.status(401).json({ message: 'Clave incorrecta.' });
    return;
  }

  const suppliedPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(adminPassword);
  const passwordMatches = suppliedPassword.length === expectedPassword.length
    && timingSafeEqual(suppliedPassword, expectedPassword);

  if (!passwordMatches) {
    res.status(401).json({ message: 'Clave incorrecta.' });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '8h',
  });
  res.json({ token });
};
