import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { ObjectId } from "mongodb";
import { wakeUpOnLan } from '../../helpers/wakeOnLan.helper';
import { snippet, webApp } from '../servers.db';
import { EntityIdentifiedById } from './AbstractID';

@Entity()
/**
 * Entidad de servidores disponibles en la plataforma.
 */
export class Server extends EntityIdentifiedById {

	@Column()
	name:		string;

	@Column()
	host:		string;

	@Column()
	port: 		string;

	@Column()
	owner:		ObjectId[] = [];

	@Column()
	auths: 		ObjectId[] = [];

	@Column()
	MAC?: 		string;

	@Column()
	wolPort?: 	number;

	@Column()
	icon?: 		string;

	@Column()
	snippets?: 	snippet[];

	@Column()
	webApps?: 	webApp[];
	
	/**
	 * Enciende el servidor si existen los parámetros requerido.
	 */
	/* public powerOn() {

		// Comprueba si faltan alguno de los parámetros requeridos.
		if (!this.MAC || !this.host) return Promise.reject('Missing required params.');

		// Devuelve la promesa de la función WoL.
		return wakeUpOnLan(this.MAC, this.host, this.wolPort);

	} */

}