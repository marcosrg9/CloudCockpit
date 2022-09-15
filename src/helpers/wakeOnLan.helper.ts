import { wake } from 'wol';

/**
 * Envía un paquete mágico que enciende un dispositivo siempre que sea alcanzable.\
 * Nota: Este método no funcionará si el dispositivo no se encuentra registrado en la tabla ARP del enrutador o conmutador del destino.\
 * Las tablas ARP son almacenadas en memoria y las entradas caducan pasado cierto tiempo.
 * 
 * @param mac Dirección física de la interfaz del dispositivo.
 * @param ip Dirección IP del dispositivo dentro de la red local en la que se encuentra.
 * @param port Puerto de acceso a la interfaz del dispositivo (por defecto 9).
 */
export const wakeUpOnLan = (mac: string, ip: string, port = 9) => {

	/**
	 * La librería no comprueba si una dirección ip dada es correcta.
	 * Si esta no es asignada a los parámetros de WakeOptions, se usa una dirección de difusión.
	 * CloudCockpit no se planea usar principalmente en un servidor de una red local, sino en una
	 * instancia de Heroku o Railway, por lo que el servidor no sería alcanzable desde dicho punto.
	 * 
	 * https://github.com/song940/wake-on-lan/blob/05144409171cc9aa5d314c95a8715110994d3a73/index.js
	 */

	// Divide la ip en grupos de segmentos por los puntos.
	ip.split('.').forEach(segment => {
		
		// Convierte el grupo en un número.
		const group = parseInt(segment);

		// Comprueba que el resultado de la conversión sea numérico y que se ajuste a los esquemas de una ip.
		if (typeof group !== 'number' || group > 255 || group < 1) Promise.reject('Bad IP');

	});

	// Reemplaza los dos puntos por guiones si existen.
	mac = mac.replace(':', '-');

	// Intenta emitir el paquete wol.
	return wake(mac, { address: ip, port })
	
}