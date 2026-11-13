import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { GeoapifyError, searchAddresses } from '../services/geoapify.service';

const router = Router();
const addressSearchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Se alcanzó el límite de búsquedas. Esperá un minuto e intentá de nuevo.' },
});

router.get('/suggestions', addressSearchLimiter, async (req, res) => {
  const text = req.query.text;
  if (typeof text !== 'string' || text.trim().length < 3 || text.length > 200) {
    res.status(400).json({ message: 'Ingresá al menos 3 caracteres para buscar una dirección.' });
    return;
  }

  try {
    const suggestions = await searchAddresses(text.trim());
    res.json(suggestions);
  } catch (error) {
    if (error instanceof GeoapifyError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error al buscar direcciones:', error);
    res.status(500).json({ message: 'No se pudieron buscar direcciones.' });
  }
});

export default router;
