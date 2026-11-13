export const formatName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es'))
    .join(' ');

export const formatShortAddress = (address: string): string =>
  address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
