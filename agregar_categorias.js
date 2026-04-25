
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS_DIR = path.join(__dirname, 'commands');

async function procesarDirectorio(dir, categoria) {
    const archivos = await fs.readdir(dir);
    
    for (const archivo of archivos) {
        const rutaCompleta = path.join(dir, archivo);
        const stats = await fs.stat(rutaCompleta);
        
        if (stats.isDirectory()) {
            await procesarDirectorio(rutaCompleta, archivo);
        } else if (archivo.endsWith('.js') && archivo !== 'utils.js' && archivo !== 'myFunctions.js') {
            await agregarCategoria(rutaCompleta, categoria);
        }
    }
}

async function agregarCategoria(rutaArchivo, categoria) {
    try {
        let contenido = await fs.readFile(rutaArchivo, 'utf8');
        
        // Verificar si ya tiene categoría
        if (contenido.includes('category:')) {
            console.log(`✅ Ya tiene categoría: ${rutaArchivo}`);
            return;
        }
        
        // Buscar el export default { ... }
        const regexExport = /export\s+default\s+\{([\s\S]*?)\}[\s;]*$/;
        const coincidencia = contenido.match(regexExport);
        
        if (coincidencia) {
            // Insertar la categoría después del name y aliases
            let contenidoObjeto = coincidencia[1];
            
            // Patrón para encontrar después de name o aliases
            const patronInsercion = /(name\s*:\s*['"].+?['"],?|aliases\s*:\s*\[.+?\],?)/s;
            
            if (patronInsercion.test(contenidoObjeto)) {
                const nuevoContenido = contenido.replace(patronInsercion, (match) => {
                    return `${match}\n    category: '${categoria}',`;
                });
                
                await fs.writeFile(rutaArchivo, nuevoContenido, 'utf8');
                console.log(`✅ Agregada categoría '${categoria}' a: ${rutaArchivo}`);
            } else {
                console.log(`⚠️ No se pudo insertar en: ${rutaArchivo}`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error procesando ${rutaArchivo}:`, error.message);
    }
}

console.log('🔄 Iniciando proceso para agregar categorías a todos los comandos...\n');
procesarDirectorio(COMMANDS_DIR)
    .then(() => {
        console.log('\n✅ PROCESO COMPLETADO: Todos los comandos ahora tienen su categoría asignada');
        console.log('✅ Cada comando tiene la categoría correspondiente a la carpeta donde se encuentra');
    })
    .catch(err => console.error('❌ Error general:', err));
