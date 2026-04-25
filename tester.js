process.env.TEST_MODE = 'true';

import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs-extra';

// ─── MOCKS ───────────────────────────────────────────────────────────
const mockSock = {
  sendMessage: async (jid, content, opts) => {
    // console.log(`[sendMessage] -> ${jid}`, JSON.stringify(content).slice(0, 120));
    return { key: { id: 'mock-msg-id', remoteJid: jid } };
  },
  groupMetadata: async (jid) => ({
    id: jid,
    subject: 'Test Group',
    participants: [
      { id: '5215555555555@s.whatsapp.net', admin: 'admin' },
      { id: '5216666666666@s.whatsapp.net', admin: null },
    ],
  }),
  groupSettingUpdate: async (jid, setting) => {
    // console.log(`[groupSettingUpdate] -> ${jid}`, setting);
    return { status: 'ok' };
  },
  groupParticipantsUpdate: async (jid, participants, action) => {
    // console.log(`[groupParticipantsUpdate] -> ${jid}`, participants, action);
    return { status: 'ok' };
  },
  groupUpdateDescription: async (jid, description) => {
    // console.log(`[groupUpdateDescription] -> ${jid}`, description);
    return { status: 'ok' };
  },
  groupInviteCode: async (jid) => 'ABCD1234',
  user: { id: '5210000000000:1@s.whatsapp.net' },
};

function createMockM(overrides = {}) {
  return {
    key: {
      remoteJid: overrides.group ? '123456789@g.us' : '5215555555555@s.whatsapp.net',
      fromMe: false,
      participant: overrides.group ? '5215555555555@s.whatsapp.net' : undefined,
    },
    message: {
      conversation: overrides.text || '',
      extendedTextMessage: {
        text: overrides.text || '',
        contextInfo: {
          quotedMessage: overrides.quoted || null,
          mentionedJid: overrides.mentionedJid || [],
        },
      },
      imageMessage: overrides.imageMessage || null,
      videoMessage: overrides.videoMessage || null,
    },
    sender: overrides.sender || '5215555555555@s.whatsapp.net',
    pushName: overrides.pushName || 'TestUser',
    body: overrides.text ? `.${overrides.text}` : '.test',
    ...overrides,
  };
}

// Mock global.db para compatibilidad legacy
if (!global.db) {
  global.db = { data: { users: {}, chats: {}, settings: {} } };
}

// ─── CARGADOR DE COMANDOS ────────────────────────────────────────────
const commands = new Map();
const errors = [];

const loadCommands = async (dir = './commands') => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      await loadCommands(filePath);
    } else if (file.endsWith('.js')) {
      try {
        const module = await import(pathToFileURL(path.resolve(filePath)).href);
        const command = module.default || module;
        const name = command.name || (Array.isArray(command.command) ? command.command[0] : command.command);
        if (name) {
          commands.set(name, { ...command, _file: filePath });
          if (command.aliases) {
            command.aliases.forEach(alias => commands.set(alias, { ...command, _file: filePath }));
          }
        }
      } catch (e) {
        errors.push({ file: filePath, phase: 'LOAD', error: e.message || e });
      }
    }
  }
};

// ─── TESTER ──────────────────────────────────────────────────────────
async function runTests() {
  await loadCommands();
  console.log(`\n📂 ${commands.size} entradas cargadas (incluye aliases)\n`);

  // Filtrar únicos por archivo para no repetir tests
  const tested = new Set();
  for (const [key, cmd] of commands) {
    const file = cmd._file;
    if (tested.has(file)) continue;
    tested.add(file);

    const testName = cmd.name || key;
    const m = createMockM({ text: `${testName} prueba` });
    const from = m.key.remoteJid;
    const text = 'prueba';
    const quoted = null;
    const args = ['prueba'];
    const isAdmin = true;
    const isGroup = true;

    try {
      // Algunos comandos no exportan run, otros sí
      const runFn = cmd.run || cmd;
      if (typeof runFn !== 'function') {
        console.log(`⚠️  ${path.basename(file)} — sin función run`);
        continue;
      }

      // Llamamos a la función run con los parámetros que usa index.js
      await runFn(mockSock, m, from, text, quoted, args, isAdmin, isGroup);
      console.log(`✅ ${path.basename(file)} — OK`);
    } catch (e) {
      console.error(`❌ ${path.basename(file)} — ${e.message || e}`);
      errors.push({ file, phase: 'RUN', error: e.message || e, stack: e.stack });
    }
  }

  // ─── RESUMEN ──────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  if (errors.length === 0) {
    console.log('🎉 TODOS LOS COMANDOS PASARON EL TEST');
  } else {
    console.log(`⚠️  ${errors.length} ERROR(ES) ENCONTRADO(S):\n`);
    errors.forEach((err, i) => {
      console.log(`${i + 1}. 📁 ${err.file}`);
      console.log(`   Fase: ${err.phase}`);
      console.log(`   Error: ${err.error}`);
      if (err.stack) console.log(`   Stack: ${err.stack.split('\n').slice(0, 3).join('\n         ')}`);
      console.log('');
    });
  }
  console.log('═══════════════════════════════════════════\n');
}

runTests();
