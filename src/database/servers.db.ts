import { ObjectId } from 'mongodb'
import { serverValidator } from '../validators/server.validator';
import { AppDataSource } from './data-source';
import { AbstractDataManagerById } from './database_abstraction';
import { Server } from './entity/Server';
import { userStore } from './stores/user.store';

export interface server {
	/** Identificador del servidor. */
	id?: 		string;
	/** Nombre asignado al servidor. */
	name: 		string;
	/** Dirección del servidor. */
	host: 		string;
	/** Propietario/s del servidor. */
	owner:		string[];
	/** Identificador de cuenta/s de autenticación. */
	auths?: 	string[];
	/** Puerto de escucha para el servicio SSH. */
	port?: 		number;
	/** Dirección física de la interfaz del servidor. */
	MAC?: 		string;
	/** Puerto de acceso de wake on lan. */
	wolPort?: 	number;
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

export interface newServer {

	/** Nombre del servidor. */
	name: string;
	/** Dirección del servidor. */
	host: string;
	/** Puerto del servidor. */
	port: string;
	/** Propietario del servidor. */
	owner: any;
	/** Dirección física de la interfaz de red de acceso al servidor. */
	MAC?: string;
	/** Puerto para el envío de paquetes WOL. */
	wolPort?: string;
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

class ServersManager extends AbstractDataManagerById<Server> {

	constructor() {
		console.log(`${new Date().toISOString()} – ✓ Cargando administrador de servidores...`)
		super(Server);
	}

	/**
	 * Inserta un nuevo servidor en la base de datos por unos parámetros dados.
	 * @param srv Parámetros del servidor a insertar en la base de datos.
	 */
	public async createServer(srv: server) {

		try {

			// Inicia la validación de los campos.
			const validation = serverValidator.validate(srv, { stripUnknown: true, abortEarly: false });

			// Devuelve una promesa rechazada con los errores producidos durante la validación.
			if (validation.error) return Promise.reject(validation.error);


			// Busca un duplicado
			const search = await AppDataSource.manager.findOneBy(Server, { host: validation.value.host });

			// Comprueba si la dirección y el puerto coinciden.
			if (search.host && search.port === validation.value.port) return Promise.reject('Server exists');
			
			// Crea una nueva instancia de servidor.
			const server = new Server();
			
			// Copia todas las propiedades dadas en la instancia del servidor.
			Object.assign(server, srv);
	
			// Devuelve el resultado de la consulta.
			return AppDataSource.manager.insert(Server, server)
			.then(() => {

				const user = userStore.get(validation.value.id.toString());

				// Emite un evento de nuevo servidor.
				userStore.get(validation.value.id.toString()).broadcast('newServer');

			})
			
		} catch (error) { Promise.reject(error) };

	}

	/**
	 * Obtiene todos los servidores asignados a un usuario.
	 * @param id Identificador del usuario.
	 */
	public getServersOfUser(id: string) {

		try {

			const uid = new ObjectId(id)
	
			return AppDataSource.manager.find(Server, {
				where: {owner: [uid]}
			})

		} catch (error) {
			return Promise.reject('Invalid user id.')
		}

	}

}

/** Instancia única del acceso al administrador de servidores. */
export const servers = new ServersManager();