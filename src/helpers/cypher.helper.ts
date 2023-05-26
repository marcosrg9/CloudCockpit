import { randomBytes, createCipheriv, createDecipheriv, CipherCCMTypes } from 'crypto';
import { CypherError } from '../errors/cypher.error';

/**
 * Extrae la clave de cifrado de la variable de entorno.
 */
 const getCipherKey = () => {

	// Obtiene la clave del cifrador de las variables de entorno.
	const { DB_CYPH: key } = process.env;
	
	// Comprueba si la clave existe.
	if (!key) return Promise.reject(new CypherError('MissingKey'));

	// Comprueba si la clave no tiene la longitud adecuada.
	if (key.length !== 32) return Promise.reject(new CypherError('InvalidKey'));

	return Promise.resolve(key);

}

/**
 * Genera un vector de incialización.
 */
const generateIV = () => {
	
	return randomBytes(16).toString("hex").slice(0, 16);

}

/**
 * Indica si el cifrado está disponible.
 */
export const cipherAvailable = () => {
	
	return getCipherKey()
	.then(() => true)
	.catch(() => false)

}

/**
 * Extrae el vector de inicialización de una cadena.
 * @param data Datos que contienen el vector de inicialización concatenado.
 */
const splitIV = (data: string) => {

	// Extrae el vector de inicialización.
	const iv = data.substring(data.length - 16, data.length);

	// Extrae el mensaje.
	const msg = data.substring(0, data.length - 16);

	return { iv, msg }

}

/**
 * Cifra una cadena dada con el algoritmo aes 256 cbc.
 * @param data Datos a cifrar.
 */
export const encrypt = async(data: string) => {

	try {

		// Obtiene la clave de la variable de entorno.
		const key = await getCipherKey();
	
		// Genera un vector de inicialización.
		const iv = generateIV();
	
		// Crea el cifrador.
		const e = createCipheriv('aes-256-cbc', key, iv);
	
		// Cifra los datos de utf-8 y pasa a hexadecimal como salida.
		let message = e.update(data, 'utf-8', 'hex');
	
		// Detiene el cifrado y devuelve la información.
		return Promise.resolve({
			/** Dato cifrado. */
			cyphed: message += e.final('hex'),
			/** Vector de inicialización asociado al dato cifrado. */
			iv
		});

	} catch(err) {

		// Devuelve una promesa rechazada con el error.
		return Promise.reject(err);

	}
	

}

export const decrypt = async(data: string, iv?: string) => {

	try {

		// Obtiene la clave de cifrado.
		const key = await getCipherKey();

		// Si el parámetro IV no existe significa que va concatenado en los datos.
		if (!iv) {
	
			// Extrae el iv de los datos.
			const { iv: vector, msg } = splitIV(data);
	
			// Asigna el vector de incialización y los datos.
			data = msg;
			iv = vector;
	
		}
	
		// Crea un descifrador con la clave y el vector de inicialización.
		const decrypter = createDecipheriv("aes-256-cbc", key, iv);

		// Añade el dato al descifrador.
		let decryptedMsg = decrypter.update(data, "hex", "utf8");

		// Detiene el cifrado.
		decryptedMsg += decrypter.final("utf8");

		// Devuelve el mensaje descifrado.
		return Promise.resolve(decryptedMsg);

		
	} catch (err) {

		// Devuelve una promesa rechazada con el error.
		return Promise.reject(err);
		
	}

}