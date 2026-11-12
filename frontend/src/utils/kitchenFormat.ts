export const formatTrayToKitchen = (trays: number): string => {
  if (trays === 1) return '1 bandeja (1/2 doc.)';
  if (trays === 2) return '2 bandejas (1 doc.)';
  if (trays === 3) return '3 bandejas (1 doc. y media)';
  if (trays === 4) return '4 bandejas (2 doc.)';
  return `${trays} bandejas (${trays * 0.5} doc.)`;
};