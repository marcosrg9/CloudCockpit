import { Column, ObjectID, ObjectIdColumn } from 'typeorm';

/**
 * Abstracción para implementar en entidades identificadas por id único.
 * Necesario para usarlo en modelos de entidades que heredan de la
 * abstracción AbstractDataManagerById.
 */
export abstract class EntityIdentifiedById {

	@ObjectIdColumn()
	_id: string;

	/** Indicador de estado de cifrado. */
	@Column({ default: true })
	enc: boolean = false;
	
}