import { WebsocketsService } from '../services/websockets.service'
import { authForClient, newAuthFromClient } from '../../../../src/interfaces/auth.interface'
import { SyncedCacheStore } from './syncedStore';
import { EVENTS_DICTIONARY } from '../../../../src/events/events.dictionary';

let store: AuthStore;

export class AuthStore extends SyncedCacheStore<string, authForClient> {

	/**
	 * Almacén de credenciales sincronizado.
	 * @param socketService Socket de conexión con el servidor
	 */
	constructor(private socketService: WebsocketsService) {

		super('_id', socketService, 'updateAuth', {
			get: { reject: EVENTS_DICTIONARY.AUTH.REJECT_GET_AUTH,
			       resolve: EVENTS_DICTIONARY.AUTH.RESOLVE_GET_AUTH,
				   request: EVENTS_DICTIONARY.AUTH.REQUEST_GET_AUTH },
			set: { reject: EVENTS_DICTIONARY.AUTH.REJECT_SAVE_AUTH,
				   resolve: EVENTS_DICTIONARY.AUTH.RESOLVE_SAVE_AUTH,
				   request: EVENTS_DICTIONARY.AUTH.REQUEST_SAVE_AUTH },
			delete: { reject: EVENTS_DICTIONARY.AUTH.REJECT_DELETE_AUTH,
					  resolve: EVENTS_DICTIONARY.AUTH.RESOLVE_DELETE_AUTH,
					  request: EVENTS_DICTIONARY.AUTH.REQUEST_DELETE_AUTH } })
		
		// Singleton.
		if (store) return store
		
		store = this;
	}

	public resolveAuthsOfServer(id: string) {
		return this.promisifyEvent({ resolve: 'resolvedServerCredentials', reject: '', request: 'getServerCredentials' }, id)
		.then((ev: authForClient[][]) => {
			const data = ev.flat();
			data.forEach(auth => {
				this.store.set(auth._id, auth);
			})
			return ev.flat();
		})
	}

	public override set(data: authForClient | newAuthFromClient) {
		return super.set(data)
		.then(a => {
			this.store.set(a._id, a);
			this.reflect = Array.from(this.store).map(([k, v]) => v);
			return a;
		})
	}

}