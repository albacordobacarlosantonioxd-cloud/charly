const groupMetadataCache = new Map()
const lidCache = new Map()
const metadataTTL = 5000 

function getCachedMetadata(groupChatId) {

  const cached = groupMetadataCache.get(groupChatId)
  if (!cached || Date.now() - cached.timestamp > metadataTTL) return null
  return cached.metadata
}

function normalizeToJid(phone) {
  if (!phone) return null
  const base = typeof phone === 'number' ? phone.toString() : phone.replace(/\D/g, '')
  return base ? `${base}@s.whatsapp.net` : null
}


// Así debe quedar la exportación para "type": "module"
export async function resolveLidToRealJid(lid, client, groupChatId) {
    // 1. Si lid no existe, regresamos null de inmediato y evitamos el crash
    if (!lid) return null;

    // 2. Usar String() es mucho más seguro que .toString() en Node v24
    const input = String(lid).trim();
    
    // 3. Si el input es el texto "undefined" o no hay grupo, abortamos
    if (!input || input === "undefined" || !groupChatId?.endsWith('@g.us')) return input;

    if (input.endsWith('@s.whatsapp.net')) return input;

    if (lidCache.has(input)) return lidCache.get(input);

    const lidBase = input.split('@')[0];
    let metadata = getCachedMetadata(groupChatId);

    if (!metadata) {
        try {
            metadata = await client.groupMetadata(groupChatId);
            groupMetadataCache.set(groupChatId, { metadata, timestamp: Date.now() });
        } catch {
            return lidCache.set(input, input), input;
        }
    }

    for (const p of metadata.participants || []) {
        const idBase = p?.id?.split('@')[0]?.trim();
        const phoneRaw = p?.phoneNumber;
        const phone = normalizeToJid(phoneRaw);
        if (!idBase || !phone) continue;
        if (idBase === lidBase) return lidCache.set(input, phone), phone;
    }

    return lidCache.set(input, input), input;
}
