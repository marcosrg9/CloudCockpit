const { cpus, totalmem } = require('os');

console.log(`
Iniciando pruebas de rendimiento.
Velocidad de lectura y acceso a estructuras de datos.
	- Arrays.
	- Objetos.
	- Mapas (hash).
`)

console.log('\nProcesadores:')

// Muestra los procesadores.
const processors = { };
cpus().forEach(a => {
	if (processors[a.model]) processors[a.model] = processors[a.model] + 1
	else processors[a.model] = 1;
})
Object.entries(processors).forEach(([k, v]) => { console.log(v, k)})

// Muestra la memoria total del sistema.
console.log(`\nMemoria:\n${ totalmem() / 1024 / 1024 / 1024 } GB`)

// Registros totales para la prueba.
const n = 2**24;
// Declaraciones del mapa y array.
const map = new Map();
const array = new Array(n);
const object = { };

/**
 * Notas del rellenado de datos.
 * 	- El tamaño máximo de un mapa es de 2**24 (16.777.216).
 * 	- Solamente puede tratar con arrays de hasta 2**32-2 registros (4.294.967.294).
 */

if (n > 2**24) {
	console.error(`El número de registros es mayor al máximo manejable por node (${2**24})`);
	process.exit(1)
}

console.log(`\nRealizando pruebas con ${n} registros.\n`);

console.time('Data fill')

// Rellena el array de datos.
array.fill(1, 0, n);

// Asignación al mapa y objeto.
array.forEach((va, index) => {
	map.set(index, va);
	object[index] = va;
})
console.log('Rellenado de datos');
console.timeEnd('Data fill');

// Conteo de tiempo de procesamiento para recorrer el array (en el peor de los casos).
console.log('\nRecorrido de array en el peor de los casos (última posición)');
console.time('Array'); for (let i = 0; i < array.length; i++) { }; console.timeEnd('Array');

// Conteo de tiempo de procesamiento de acceso a índice objecto.
console.log('\nAcceso a índice de array.');
console.time('Array by index'); array[n - 1]; console.timeEnd('Array by index');

// Conteo de tiempo de procesamiento de acceso a índice de objeto.
console.log('\nAcceso a propiedad de objeto.');
console.time('Object by index'); object[n - 1]; console.timeEnd('Object by index');

// Conteo de tiempo de procesamiento de acceso a registro por hash.
console.log('\nAcceso a hash de mapa.');
console.time('Map'); map.get(n - 1); console.timeEnd('Map');

// Bytes / Kilobytes / Megabytes / Gigabytes.
console.log(`\nTamaño del montón: ${ process.memoryUsage().heapUsed / 1024 / 1024 / 1024 } GB`);

/** Salida:
 * 
 * Procesadores:
 * 4 Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz
 * 
 * Memoria:
 * 16 GB
 * 
 * Realizando pruebas con 16777216 registros.
 * 
 * Data fill: 8.181s
 * Array: 23.261ms
 * Array by index: 0.008ms
 * Object by index: 0.007ms
 * Map: 0.015ms
 * 
 * Tamaño del montón: 1.3274729177355766 GB
 * 
 */