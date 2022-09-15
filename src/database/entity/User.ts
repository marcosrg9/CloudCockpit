import { Entity, Column, Unique, ObjectID } from 'typeorm'
import { user } from '../user.db';
import { EntityIdentifiedById } from './AbstractID';

@Entity()
@Unique(['username'])
/**
 * Entidad de cuentas de usuarios para el acceso a la plataforma.
 */
export class User extends EntityIdentifiedById {

    /** Nombre de usuario para el inicio de sesión. */
    @Column()
    username: string;    

    /** Contraseña de inicio de sesión. */
    @Column()
    password: string;

    /** Rol del usuario. */
    @Column({ default: true })
    role: user['role'] = 'standard';

}
