const formatRemainingTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days} día(s)`);
  if (remainingHours > 0) parts.push(`${remainingHours} hora(s)`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes} minuto(s)`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds} segundo(s)`);
  
  return parts.join(" ");
};

export default formatRemainingTime;
