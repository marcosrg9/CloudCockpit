import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class addressesValidator {

	// TODO: Añadir soporte para IPv6.
	static hostValidator(control: AbstractControl): ValidationErrors | null {

		const err = { addressError: true }

		const value = control.value as string;

		let lastSegmentWithPort: string = '';

		// Empieza por los protocolos http o https, es un dominio.
		if (value.startsWith('http://') || value.startsWith('https://')) {

			// Obtiene la dirección dividia por puntos.
			const splitted = value.split('.');
			
			// Si el resultado de la divisón es inferior a 2 significa que no contiene TLD.
			if (splitted.length < 2) return err;
			
			// Obtiene el dominio de nivel superior (.com, .es, .dev, etc...).
			const TLD = splitted[splitted.length - 1]

			// La longitud del TLD es inferior a 1 (Ejemplo: ['http://marcosrg9', ''])
			if (TLD.length < 1) return err;

			// El TLD empieza por :, ha insertado un puerto pero no el TLD.
			// Ejemplo: ':22' no pasa la validación, pero '.dev:22' si la pasa.
			if (TLD[0] === ':') return err;
			
			// Comprueba si el TLD incluye separador de puerto.
			if (!TLD.includes(':')) return null;

			// Asigna el segmento a la variable para continuar en la segunda etapa.
			lastSegmentWithPort = TLD;

		// Se trata de una dirección IP.
		} else {

			let version: 4 | 6;

			// Comprueba si es un IPv4.
			if (value.split('.').length === 4) version = 4;
			// Comprueba si es un IPv6.
			else if (value.split(':').length === 8) version = 6;
			// En cualquier otro caso, devuelve error.
			else return err;

			// Comienza las comprobaciones de IPv4.
			if (version === 4) {

				// Obtiene todos los segmentos de la dirección.
				const segments = value.split('.');

				const defaultCheck = (segment: string) => {

					const parsedSegment = parseInt(segment);

					if (!/^[0-9]+$/i.test(segment)) return err;
					if (isNaN(parsedSegment)) return err;
					if (parsedSegment < 1 || parsedSegment > 255) return err;

				}

				for (let i = 0; i < segments.length; i++) {

					// Asigna el segmento.
					const segment = segments[i];

					// Realiza comprobaciones adicionales.
					if (i === 3) {

						// El último segmento de la dirección contiene un separador de puerto.
						if (segment.includes(':')) {

							// Divide el segmento.
							const splittedSegment = segment.split(':');

							// Ha introducido un separador, pero no el puerto.
							if (splittedSegment.length === 1) return err;

							// Ha introducido varios separadores.
							if (splittedSegment.length > 2) return err;

							// No ha introducido un puerto.
							if (splittedSegment[1] === '') return err;

							// El puerto introducido no es un número.
							if (isNaN(parseInt(splittedSegment[1]))) return err;

							// Asigna el último segmento.
							lastSegmentWithPort = segment;

						// Continúa la comprobación normal.
						} else {
							const out = defaultCheck(segment);
							if (out) return out;
						};

					} else {
						const out = defaultCheck(segment);
						if (out) return out;
					};

				}

			}
			
		}

		// Segunda etapa de validación, obtiene el puerto.

		// Obtiene el último segmento para determinar el puerto.
		const splittedSegment = lastSegmentWithPort.split(':');
		
		// No ha introducido el separador.
		if (splittedSegment.length === 1) return null;

		// Ha introducido un separador de puerto, pero no el puerto.
		// Ejemplo: 'http://marcosrg9.dev:' o bien '0.0.0.0:'
		if (splittedSegment[1].length < 1) return err;

		// Parsea y declara el puerto.
		const port = parseInt(splittedSegment[1]);

		// El puerto no es un número.
		// Pueden darse casos como 'dev:2w' o 'dev:2q', error de escritura.
		if (isNaN(port)) return err;

		// El puerto no entra dentro del rango válido.
		if (port < 1 || port > 65535) return err;

		// Obtiene el control del puerto.
		const portControl = control.parent?.get('port');

		portControl?.removeValidators(addressesValidator.SSHPortValidator);
		
		// El puerto es un número, se asigna al control de puerto.
		control.parent?.get('port')?.setValue(port);

		portControl?.addValidators(addressesValidator.SSHPortValidator);

		return null;

	}

	static MacValidator(control: AbstractControl): ValidationErrors | null {

		// Obtiene el control checkbox
		const enableCheckbox = control.parent?.get('enableWol');

		// Obtiene el control de la dirección mac.
		const macAddressControl = control

		// Comprueba si el checkbox está activo.
		if (enableCheckbox && !enableCheckbox.value) return null;

		// Obtiene el valor de la dirección mac.
		const value: string = macAddressControl?.value;

		if (value.length !== 17) return { macError: true }
		
		// Comprueba si existe una mac dividida por dos puntos o guiones.
		if (value.split(':').length === 1 && value.split('-').length === 1) return { macError: true };

		let macAddress;

		// Asigna la dirección.
		if (value.split(':').length === 6) macAddress = value.split(':')
		else if (value.split('-').length === 6) macAddress = value.split('-')
		// Si las comprobaciones fallan, devuelve error.
		else return { macError: true }

		const check = /[0-9A-Fa-f]{6}/g;

		if(check.test(macAddress.join(''))) return null
		else {
			return { macError: true }
		}

	}

	static checkCleanUp(control: AbstractControl): ValidationErrors  | null {

		const checked = control.value;

		if (!checked) {

			control.parent?.get('macAddress')?.disable();
			control.parent?.get('wolPort')?.disable();

		} else {

			control.parent?.get('macAddress')?.enable();
			control.parent?.get('wolPort')?.enable();

		}
		
		return null
	}

	static portValidator(control: AbstractControl): ValidationErrors | null {

		const { value } = control;

		// Si el puerto no está definido se usa el estándar (SSH 22 - WOL 7/9).
		if (!value) return null
		else if (typeof value !== 'number') return { portError: true }
		else if (value > 65535 || value < 1) return { portError: true }

		return null;

	}

	static SSHPortValidator(control: AbstractControl): ValidationErrors | null {

		// Obtiene el valor del control.
		const port = control.value;

		const checkPort = addressesValidator.checkPort(port);

		// Comprueba si es un puerto válido.
		if (!checkPort) return { portError: true }

		// No hay padre (estado de instanciación del componente).
		if (!control.parent) return null;

		// Obtiene el control de la dirección del host.
		const addressCtrl = control.parent?.get('host');
		
		const address = addressCtrl!.value as string;
		
		// Si no existe la dirección, devuelve una salida válida.
		if (!address) return null;

		// Comprueba si la dirección contiene separador de puerto.
		if (address.includes(':')) {

			// Obtiene el último puerto.
			const lastPort = address.slice(address.lastIndexOf(':'), address.length);

			// El último índice de : es el separado del protocolo.
			if (isNaN(parseInt(lastPort.split(':')[1]))) return null;

			let newAddress = '';

			if (port) {

				if (lastPort.length === 0) newAddress = address;
				else if (lastPort.length === 1) newAddress = address + port
				else newAddress = address.replace(lastPort, `:${port}`);

				
			} else {
				
				newAddress = address.slice(0, address.lastIndexOf(':'))
				
			}
			
			// Elimina el validador de direcciones. (Previene errores de pila de llamadas desbordada.)
			addressCtrl?.removeValidators(addressesValidator.hostValidator);

			// Asigna la nueva dirección.
			addressCtrl?.setValue(newAddress);

			// Vuelve a asignar el validador.
			addressCtrl?.addValidators(addressesValidator.hostValidator);
		}

		return null;
	}

	static WOLPortValidator(control: AbstractControl): ValidationErrors | null {

		if (!addressesValidator.checkPort(control.value)) return { portError: true }
		return null;

	}

	static checkPort(port: number) {
		
		
		// Si el puerto no está definido se usa el estándar (SSH 22 - WOL 7/9). Salida válida.
		if (!port && port !== 0) return true
		if (typeof port === 'string') return false
		else if (port < 1 || port > 65535) return false

		return true;
		
	}

}