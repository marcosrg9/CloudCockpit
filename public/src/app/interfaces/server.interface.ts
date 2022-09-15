export interface credential {

	_id: string;
	username: string;
	description?: string;

}

export interface server {
	/** Identificador del servidor. */
	_id: 		string;
	/** Nombre asignado al servidor. */
	name: 		string;
	/** Dirección del servidor. */
	host: 		string;
	/** Puerto de escucha para el servicio SSH. */
	port?: 		number;
	/** Dirección física de la interfaz del servidor. */
	MAC?: 		string;
	/** Puerto de acceso de wake on lan. */
	wolPort?: 	number;
	/** Identificador de cuenta de autenticación. */
	auths: 		credential[];
	/** Icono identificativo del servidor. */
	icon?: 		string;
	/**
	 * Indica si se trata del servidor que corre CloudCockpit.
	 * @deprecated Este parámetro se debería evaluar en el frontend.
	 */
	metal?:		boolean;
	/** Conjunto de comandos predefinidos. */
	snippets?:	snippet[];
	/** Accesos directos a aplicaciones. */
	webApps?:	{ name: string, url: string }[];
}

/** Comando predefinido. */
export interface snippet {
	/** Nombre del snippet. */
	name: string;
	/** Comando. */
	command: string
}

/** Acceso directo a una aplicación accesible desde un navegador. */
export interface webApp {
	/** Nombre de la aplicación. */
	name: string;
	/** Dirección de acceso a la aplicación. */
	url: string;
}