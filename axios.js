import fs from 'fs';
import path from 'path';

const commandsDir = './commands'; 

const fixEvoUrls = (dir) => {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixEvoUrls(filePath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // Buscamos cualquier variante de la URL rota y la corregimos
            if (content.includes('api.axios.org')) {
                console.log(`🔧 Corrigiendo URL en: ${filePath}`);
                
                // El cambio mágico a la URL real
                content = content.replace(/api\.axios\.org/g, 'api.evogb.org');
                
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
};

if (fs.existsSync(commandsDir)) {
    console.log("--- Corrigiendo todas las URLs de EvoGB ---");
    fixEvoUrls(commandsDir);
    console.log("--- ✅ ¡Listo! Todos los comandos apuntan a api.evogb.org ---");
} else {
    console.error("❌ No encontré la carpeta 'commands'.");
}
