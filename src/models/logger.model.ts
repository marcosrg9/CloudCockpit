class Logger {

	/** Indica si todos los logs deben insertarse en el mismo lugar o por separado. */
	private unified: boolean = false;

	/**
	 * 
	 * @param tag Etiqueta para el log. Esta debe ser genérica para que pueda ser catalogda.
	 * @param message Mensaje a insertar en el log.
	 * @param id Identificador para mejorar el filtrado.
	 */
	public info(tag: string, message: string, id?: string) {

	}

	/**
	 * 
	 * @param tag Etiqueta para el log. Esta debe ser genérica para que pueda ser catalogda.
	 * @param message Mensaje de advertencia a insertar en el log.
	 * @param id Identificador para mejorar el filtrado.
	 */
	public warning(tag: string, message: string, id?: string) {
		console.error({tag, message, stack: new Error().stack})
	}

	/**
	 * 
	 * @param tag Etiqueta para el log. Esta debe ser genérica para que pueda ser catalogda.
	 * @param message Mensaje de error a insertar en el log.
	 * @param id Identificador para mejorar el filtrado.
	 */
	public error(tag: string, message: string, id?: string) {

		console.error({tag, message, stack: new Error().stack})
	}

	/**
	 * 
	 * @param tag Etiqueta para el log. Esta debe ser genérica para que pueda ser catalogda.
	 * @param message Mensaje de error a insertar en el log.
	 * @param id Identificador para mejorar el filtrado.
	 */
	public generic(section: string, tag: string, message: string, id?: string) {

	}

}

export const logger = new Logger();