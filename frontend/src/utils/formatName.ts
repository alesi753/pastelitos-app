export const formatName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es'))
    .join(' ');
