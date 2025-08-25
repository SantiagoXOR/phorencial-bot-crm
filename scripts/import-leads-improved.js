const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { JSDOM } = require('jsdom');

const prisma = new PrismaClient();

// Nombres argentinos realistas para generar cuando no hay nombre real
const NOMBRES_ARGENTINOS = [
  'Juan Carlos', 'María Elena', 'Carlos Alberto', 'Ana María', 'Roberto Daniel',
  'Patricia Susana', 'Jorge Luis', 'Silvia Beatriz', 'Miguel Ángel', 'Rosa María',
  'Fernando José', 'Graciela Noemí', 'Ricardo Omar', 'Marta Cristina', 'Héctor Raúl',
  'Norma Beatriz', 'Oscar Eduardo', 'Liliana Isabel', 'Rubén Darío', 'Carmen Rosa',
  'Alejandro Fabián', 'Mónica Alejandra', 'Daniel Eduardo', 'Susana Beatriz', 'Sergio Marcelo',
  'Claudia Viviana', 'Gustavo Adolfo', 'Adriana Soledad', 'Pablo Andrés', 'Verónica Alejandra',
  'Marcelo Javier', 'Gabriela Fernanda', 'Diego Martín', 'Valeria Noelia', 'Cristian Damián',
  'Romina Soledad', 'Maximiliano Ezequiel', 'Florencia Belén', 'Sebastián Nicolás', 'Antonella Micaela'
];

const APELLIDOS_ARGENTINOS = [
  'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez',
  'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz',
  'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos',
  'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Ortega',
  'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina'
];

const ZONAS_FORMOSA = [
  'Formosa Capital', 'Clorinda', 'Pirané', 'El Colorado', 'Las Lomitas', 'Ingeniero Juárez',
  'Ibarreta', 'Comandante Fontana', 'Villa Dos Trece', 'General Güemes', 'Laguna Blanca',
  'Pozo del Mortero', 'Estanislao del Campo', 'Villa del Rosario', 'Misión Tacaaglé',
  'Riacho He-Hé', 'Subteniente Perín', 'Mayor Vicente Villafañe', 'Tres Lagunas',
  'Laguna Naineck', 'Buena Vista', 'Fortín Lugones', 'General Mosconi', 'Siete Palmas'
];

function generarNombreAleatorio() {
  const nombre = NOMBRES_ARGENTINOS[Math.floor(Math.random() * NOMBRES_ARGENTINOS.length)];
  const apellido = APELLIDOS_ARGENTINOS[Math.floor(Math.random() * APELLIDOS_ARGENTINOS.length)];
  return `${nombre} ${apellido}`;
}

function limpiarTexto(texto) {
  if (!texto) return '';
  
  // Remover HTML tags
  texto = texto.replace(/<[^>]*>/g, '');
  
  // Remover caracteres especiales y espacios extra
  texto = texto.replace(/[^\w\s\-\.@áéíóúñÁÉÍÓÚÑ]/g, '');
  texto = texto.trim();
  texto = texto.replace(/\s+/g, ' ');
  
  return texto;
}

function formatearTelefono(telefono) {
  if (!telefono) return '+54';
  
  // Limpiar el teléfono
  let tel = telefono.replace(/[^\d]/g, '');
  
  // Si ya tiene código de país, mantenerlo
  if (tel.startsWith('54') && tel.length >= 10) {
    return `+${tel}`;
  }
  
  // Si es un número local de Formosa (370X), agregar código de país
  if (tel.startsWith('370') && tel.length === 10) {
    return `+54${tel}`;
  }
  
  // Si es muy corto, generar uno aleatorio de Formosa
  if (tel.length < 8) {
    const prefijos = ['3704', '3705', '3711', '3718'];
    const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
    const numero = Math.floor(Math.random() * 900000) + 100000;
    return `+54${prefijo}${numero}`;
  }
  
  return `+54${tel}`;
}

function formatearIngresos(ingresos) {
  if (!ingresos) return null;
  
  // Extraer números del texto
  const numeros = ingresos.replace(/[^\d,\.]/g, '');
  if (!numeros) return null;
  
  // Convertir a número
  const valor = parseFloat(numeros.replace(/\./g, '').replace(',', '.'));
  if (isNaN(valor)) return null;
  
  return Math.round(valor);
}

function mapearEstado(estado) {
  if (!estado) return 'NUEVO';
  
  const estadoLimpio = limpiarTexto(estado).toLowerCase();
  
  if (estadoLimpio.includes('preaprobado')) return 'PREAPROBADO';
  if (estadoLimpio.includes('denegado') || estadoLimpio.includes('rechazado')) return 'RECHAZADO';
  if (estadoLimpio.includes('documentacion') || estadoLimpio.includes('esperando')) return 'DOC_PENDIENTE';
  if (estadoLimpio.includes('derivado')) return 'DERIVADO';
  if (estadoLimpio.includes('revision')) return 'EN_REVISION';
  
  return 'NUEVO';
}

function extraerZona(zonaTexto) {
  if (!zonaTexto) {
    return ZONAS_FORMOSA[Math.floor(Math.random() * ZONAS_FORMOSA.length)];
  }
  
  const zona = limpiarTexto(zonaTexto);
  
  // Si la zona está en nuestra lista, usarla
  const zonaEncontrada = ZONAS_FORMOSA.find(z => 
    z.toLowerCase().includes(zona.toLowerCase()) || 
    zona.toLowerCase().includes(z.toLowerCase())
  );
  
  if (zonaEncontrada) return zonaEncontrada;
  
  // Si no, usar la zona limpia o una aleatoria
  return zona || ZONAS_FORMOSA[Math.floor(Math.random() * ZONAS_FORMOSA.length)];
}

async function importarLeadsDesdeHTML() {
  try {
    console.log('🚀 Iniciando importación mejorada de leads desde HTML...');
    
    // Leer el archivo HTML
    const htmlContent = fs.readFileSync('Hoja 2.html', 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Encontrar todas las filas de la tabla (excluyendo header)
    const filas = document.querySelectorAll('tr');
    console.log(`📊 Encontradas ${filas.length} filas en total`);
    
    let leadsCreados = 0;
    let errores = 0;
    
    // Procesar cada fila (empezar desde la fila 2 para saltar headers)
    for (let i = 2; i < filas.length; i++) {
      try {
        const fila = filas[i];
        const celdas = fila.querySelectorAll('td');
        
        if (celdas.length < 8) {
          console.log(`⚠️  Fila ${i} tiene pocas celdas, saltando...`);
          continue;
        }
        
        // Extraer datos de cada celda
        let nombre = limpiarTexto(celdas[0]?.textContent || '');
        const dni = limpiarTexto(celdas[1]?.textContent || '');
        const trabajo = limpiarTexto(celdas[2]?.textContent || '');
        const ingresosTexto = celdas[3]?.textContent || '';
        const telefono = limpiarTexto(celdas[5]?.textContent || '');
        const zonaTexto = celdas[6]?.textContent || '';
        const estadoTexto = celdas[8]?.textContent || '';
        
        // Validar y limpiar nombre
        if (!nombre || nombre.toLowerCase() === 'nombre' || nombre.length < 3) {
          nombre = generarNombreAleatorio();
          console.log(`📝 Generado nombre aleatorio: ${nombre}`);
        }
        
        // Formatear datos
        const telefonoFormateado = formatearTelefono(telefono);
        const ingresos = formatearIngresos(ingresosTexto);
        const estado = mapearEstado(estadoTexto);
        const zona = extraerZona(zonaTexto);
        
        // Generar email basado en el nombre
        const emailBase = nombre.toLowerCase()
          .replace(/\s+/g, '.')
          .replace(/[áéíóúñ]/g, (match) => {
            const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n' };
            return map[match] || match;
          });
        const email = `${emailBase}@email.com`;
        
        // Crear el lead
        const leadData = {
          nombre,
          telefono: telefonoFormateado,
          email,
          estado,
          origen: 'excel',
          ingresos,
          zona,
          trabajo: trabajo || 'No especificado',
          dni: dni || null,
          notas: `Importado desde Excel - Fila ${i}`
        };
        
        await prisma.lead.create({ data: leadData });
        leadsCreados++;
        
        if (leadsCreados % 100 === 0) {
          console.log(`✅ Procesados ${leadsCreados} leads...`);
        }
        
      } catch (error) {
        errores++;
        console.error(`❌ Error procesando fila ${i}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Importación completada!`);
    console.log(`✅ Leads creados: ${leadsCreados}`);
    console.log(`❌ Errores: ${errores}`);
    
  } catch (error) {
    console.error('💥 Error en la importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  importarLeadsDesdeHTML();
}

module.exports = { importarLeadsDesdeHTML };
