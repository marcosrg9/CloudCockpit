import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm';
import { EntityIdentifiedById } from './AbstractID';

@Entity()
export class Platform extends EntityIdentifiedById {

	@Column()
	initialized: boolean;

	@Column()
	port: number;

	@Column()
	tls: { pem: string, cert: string };

}