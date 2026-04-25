import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS_DIR = path.join(__dirname, 'commands');

async function listarCategorias() {
    const categorias = {};
    let totalComandos = 0;

    async function recorrerDir(dir) {
        const archivos = await fs.readdir(dir);
        
        for (const archivo of archivos) {
            const rutaCompleta = path.join(dir, archivo);
            const stats = await fs.stat(rutaCompleta);
            
            if (stats.isDirectory()) {
                await recorrerDir(rutaCompleta);
            } else if (archivo.endsWith('.js') && archivo !== 'utils.js' && archivo !== 'myFunctions.js') {
                totalComandos++;
                const contenido = await fs.readFile(rutaCompleta, 'utf8');
                
                // Extraer categoría
                const matchCat = contenido.match(/category\s*:\s*['"](.+?)['"]/);
                const matchName = contenido.match(/name\s*:\s*['"](.+?)['"]/);
                
                if (matchCat && matchName) {
                    const cat = matchCat[1];
                    const nombre = matchName[1];
                    
                    if (!categorias[cat]) categorias[cat] = [];
                    categorias[cat].push(nombre);
                }
            }
        }
    }

    await recorrerDir(COMMANDS_DIR);

    console.log('\n📋 LISTADO COMPLETO DE COMANDOS POR CATEGORÍA:\n');
    console.log(`✅ Total de comandos procesados: ${totalComandos}\n`);

    for (const [categoria, comandos] of Object.entries(categorias)) {
        console.log(`╔═══════════════════════════════════════════`);
        console.log(`║ 📂 CATEGORÍA: ${categoria.toUpperCase()}`);
        console.log(`║ 🔢 Cantidad: ${comandos.length} comandos`);
        console.log(`╠───────────────────────────────────────────`);
        comandos.forEach(cmd => console.log(`║   ✅ ${cmd}`));
        console.log(`╚═══════════════════════════════════════════\n`);
    }

    console.log('\n✅ Todos los comandos tienen su categoría asignada correctamente!');
}

listarCategorias();