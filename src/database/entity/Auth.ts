import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { EntityIdentifiedById } from './AbstractID';

@Entity()
export class Auth extends EntityIdentifiedById {

	/** Nombre de la cuenta de usuario. */
	@Column()
	username: string;

	/** Contraseña del usuario de la cuenta. */
	@Column()
	password: string;
	
	/** Descripción de la cuenta. */
	@Column()
	description: string;

}