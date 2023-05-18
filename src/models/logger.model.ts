import { writeFile } from 'fs/promises';

class Logger {

	/** Indica si todos los logs deben insertarse en el mismo lugar o por separado. */
	private unified: boolean = false;

	protected currentWriter: Promise<void> | undefined;

	/** Indica si el proceso corre en entorno de desarrollo.  */
	private readonly devEnv = process.env.NODE_ENV ? true : false;

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
		//const { stack } = new Error()
		//if (this. devEnv) console.error({ tag, message, stack })
		//console.log(stack)
	}

	/**
	 * 
	 * @param tag Etiqueta para el log. Esta debe ser genérica para que pueda ser catalogda.
	 * @param message Mensaje de error a insertar en el log.
	 * @param id Identificador para mejorar el filtrado.
	 */
	public error(tag: string, message: string, id?: string) {
		console.error(message)
		//const { stack } = new Error()
		//if (this.devEnv) console.error({ tag, message, stack })
		//console.log(stack)

		//this.currentWriter = writeFile('das', 'dsa', { encoding: 'utf-8'})
		//this.currentWriter
		//	.finally(() => this.currentWriter = undefined )
		
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

export const logger = new Logger()