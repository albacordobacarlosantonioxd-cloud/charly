// Utilidades globales del bot

/**
 * Genera un retraso en milisegundos
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtiene un elemento aleatorio de un array
 */
export const pickRandom = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Envía una reacción de forma segura, sin lanzar errores si el key no es válido
 */
export const safeReact = async (sock, from, emoji, key) => {
  if (!sock || !from || !emoji || !key || !key.id) {
    console.warn('[safeReact] Datos insuficientes para reaccionar:', { from, emoji, keyId: key?.id });
    return;
  }
  try {
    await sock.sendMessage(from, { react: { text: emoji, key } });
  } catch (err) {
    console.error('[safeReact] Error al reaccionar:', err.message || err);
  }
};
