import { isIP } from 'net';
import joi from 'joi';

/**
 * Comprueba si un puerto es válido.
 * @param port Puerto.
 */
 export const isValidPort = (port: string | number) => {

	// Si el puerto es de tipo string, lo pasa a entero.
	if (typeof port === 'string') port = parseInt(port);

	// El puerto no es un número.
	if (isNaN(port)) return false;

	// El puerto no es válido.
	if (port < 1 || port > 65535) return false;

	// El puerto es válido.
	return true;

}

/**
 * Comprueba si una dirección dada es válida.
 * Valida direcciones lógicas (v4 y v6) y esquemas de subdominio, dominio y TLD.
 * 
 * Las siguiente direcciones cumplen con el esquema de validación:
 * - 192.168.1.1
 * - 192.168.1.1:443
 * - example.com
 * - example.com:443
 * - sub.example.com
 * - sub.example.com:443
 * 
 * Las siguientes no cumplen con el esquema de validación:
 * - https://*
 * - 256.256.256.256
 * - [2001:0db8:1234::0001]
 * - 192.168.1.1:
 * @param address Dirección.
 */
export const isValidAddress = (address: string) => {
	
	// Comprueba si es una dirección IP.
	if (isIP(address) !== 0) return true;
	
	// https://marcosrg9.dev => No válida
	// marcosrg9.dev => Válida
	// 192.168.1.1 => Válida
	// 192.168.1.1:22 => Válida

	// La dirección contiene un protocolo (https://...) o CIDR (0.0.0.0/24).
	if (address.includes('/')) return false;

	// La dirección no contiene parte o la totalidad de lo siguiente:
	// 	subdominio + dominio + TLD.
	// 	dominio + TLD.
	//	IPv4 (0.0.0.0).
	//	IPv6 (2001:0db8:1234::0001)
	if (!address.includes(':') && !address.includes('.')) return false;

	/**
	 * 
	 * Validador falla en esta IPv6.
	 * [2001:0db8:1234::0001]:443
	 * 
	 * 
	 */

	// Divide la cadena.
	const splitted = address.split(':');

	// Es una IPv4 o dominio con separador de puerto, pero sin puerto.
	// 192.168.1.1:
	// com.example.dev:
	if (splitted.length === 2 && splitted[1] === '') return false;

	// Puede ser una IPv4 o un dominio con puerto.
	if (splitted.length === 2) {

		// Se trata de una IPv4.
		if (isIP(splitted[0]) === 4) {

			if (isValidPort(splitted[1])) return true
			else return false

		// Puede ser un dominio.
		} else {

			// Es un dominio con puerto.
			if (splitted[0].split('.').length > 1) {

				// Comprueba que el puerto es válido.
				if (isValidPort(splitted[1])) return true
				else return false;

			// No es un dominio.
			} else return false;

		}

	// Un dominio sin puerto o IPv6.
	}
	
	// Es un dominio sin puerto.
	if (address.split('.').length > 1 && address.split('.').length < 4) return true

	// Puede ser una dirección IPv6 con puerto.
	if (address.includes('[') && address.includes(']')) {

		// Recorta la sección entre corchetes.
		const ip = address.slice(address.indexOf('[') + 1, address.lastIndexOf(']'));

		// Si no es una IPv6, devuelve falso directamente.
		if (isIP(ip) !== 6) return false;
		
		// Comprueba si contiene un separador de puerto.
		if (address[address.lastIndexOf(']') + 1] === ':') {

			// Comprueba la validez del puerto.
			if (!isValidPort(address.slice(address.lastIndexOf(']:') + 2, address.length))) return false;

		// Una IPv6 con corchetes sin puerto no es válida.
		} else return false;

		return true;

	}

	// La dirección dada no ha pasado ninguna de las validaciones.
	return false;

}

/**
 * Comprueba si una dirección física hexadecimal es válida.
 * @param address Dirección.
 */
export const isValidPhysicalAddress = (address: string) => {

	let macSplitted: string[];

	// Divide la dirección por los separadores.
	if (address.split(':').length === 6) macSplitted = address.split(':')
	else if (address.split('-').length === 6) macSplitted = address.split('-')
	// Ninguno de los 2 tipos de separadores satisface la división, dirección no válida.
	else return false;

	for (let segment of macSplitted) {

		// Comprueba si tiene caracteres que no sean hexadecimales.
		if (!/^[0-9A-F]+$/.test(segment)) return false;

		// Parsea la cadena.
		const parsed = parseInt(segment, 16);

		// Comprueba si es un número.
		if (isNaN(parsed)) return false;

		// Si es menor a 0 o mayor que 255 (no debería ocurrir), la dirección no es válida.
		if (parsed < 0 || parsed > 255) return false;

	}

	return true;

}

export const joiHostValidation: joi.CustomValidator = (value, helper) => {

	if (isValidAddress(value)) return value;
	else return helper.error('Invalid host address.')

}

export const joiPortValidation: joi.CustomValidator = (value, helper) => {

	if (value === '') return value;

	if (isValidPort(value)) return value
	else return helper.error('Invalid port.')

} 

export const joiMACValidation: joi.CustomValidator = (value, helper) => {

	if (isValidPhysicalAddress(value)) return value;
	else return helper.error('Invalid mac address.')

}