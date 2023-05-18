import { Socket } from 'socket.io';
import joi from 'joi';
import { AbstractSocket } from '../abstractSocket.events';
import { servers } from '../../database/servers.db';
import { Auth } from '../../database/entity/Auth';
import { logger } from '../../models/logger.model';
import { authForClient, isNewAuth, newAuthFromClient } from '../../interfaces/auth.interface';
import { auths } from '../../database/auth.db';
import { EVENTS_DICTIONARY } from '../events.dictionary';
import { TypeORMError } from 'typeorm';

export class ServerEvents extends AbstractSocket {

	constructor(private socket: Socket) {
		
		super(socket, ['getServerCredentials', EVENTS_DICTIONARY.AUTH.REQUEST_SAVE_AUTH, EVENTS_DICTIONARY.AUTH.REQUEST_DELETE_AUTH]);

		this.listenEvents()
	}

	private listenEvents() {

		// Escucha los eventos de petición de credenciales de servidor.
		this.socket.on('getServerCredentials', this.onGetServerCredentials.bind(this));

		// Escucha los eventos de almacenamiento de credenciales.
		this.socket.on(EVENTS_DICTIONARY.AUTH.REQUEST_SAVE_AUTH, this.onSaveAuth.bind(this));

		// Escucha los eventos para eliminar credenciales.
		this.socket.on(EVENTS_DICTIONARY.AUTH.REQUEST_DELETE_AUTH, this.onDeleteAuth.bind(this));

	}

	private onGetServerCredentials(id: string) {

		servers.resolveAuths(id)
		.then(auths => {

			const resolved: Omit<Auth, 'password' | 'enc'>[] = []
			
			auths.forEach(v => {
				if (v.status === 'fulfilled') {
					const { password, enc, ...r } = v.value;
					resolved.push(r)
				}
			});

			this.socket.emit('resolvedServerCredentials', resolved)

		})
		.catch(err => {
			logger.error('serverEvents', err);
		})

	}

	private onSaveAuth(auth: (authForClient | newAuthFromClient) & { server: string }) {
		
		// Si la credencial es nueva (incluye la propiedad 'new').
		if (isNewAuth(auth)) {
			auths.newCredential(auth.server, auth)
			.then((a) => {
				this.socket.emit(EVENTS_DICTIONARY.AUTH.RESOLVE_SAVE_AUTH, a);
			})
			.catch(e => {
				this.socket.emit(EVENTS_DICTIONARY.AUTH.REJECT_SAVE_AUTH, e)
			})
		// En caso contrario, se trata de una actualización.
		} else {
			auths.updateRecord(auth._id, auth)
			.then(a => {
				a._id = a._id.toString();
				const { _id, description, username }: authForClient = a;
				this.socket.emit(EVENTS_DICTIONARY.AUTH.RESOLVE_SAVE_AUTH, { _id, description, username })
			})
			.catch(e => {
				if (e instanceof joi.ValidationError) {
					this.socket.emit(EVENTS_DICTIONARY.AUTH.REJECT_SAVE_AUTH, e)
				}
				if (e instanceof TypeORMError) {
					if (e.name === 'EntityNotFoundError') {
						this.socket.emit(EVENTS_DICTIONARY.AUTH.REJECT_SAVE_AUTH, e)
					}
				}
			})
			//auths.updateRecord(auth._id, auth)
		}
		
	}

	private onDeleteAuth(id: string) {

		auths.deleteRecord(id)
		.then(() => {
			this.socket.emit(EVENTS_DICTIONARY.AUTH.RESOLVE_DELETE_AUTH);
		})
		.catch((err) => {
			this.socket.emit(EVENTS_DICTIONARY.AUTH.REJECT_DELETE_AUTH, err);

		})

	}

}