// Utilidades compartidas para comandos

/**
 * Devuelve un elemento aleatorio de un array
 */
export const pickRandom = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Formatea un número como moneda
 */
export const toRupiah = (number) => {
  return new Intl.NumberFormat('id-ID').format(number);
};

/**
 * Delay/pausa en milisegundos
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
