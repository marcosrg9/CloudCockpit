import { serverStore } from 'src/app/data/servers.data';
import { developerFilterCollectionType, filteredActions, globalFilterCollectionType, serverCmdCollection, serversFilterCollectionType } from 'src/app/interfaces/filter.interface';
import { developerActions } from '../developer.commands';
import { serverActions } from '../servers.commands';

export abstract class ActionsFilter {

	/**
	 * Devuelve el filtro adecuado según el prefijo del criterio de búsqueda.
	 * @param criteria Criterio de búsqueda en crudo.
	 */
	public static filter(criteria: string): filteredActions {

		if (criteria.startsWith('srv>')) return this.srv(criteria.split('srv>')[1]);
		//if (criteria.startsWith('adm>')) return this.dev(criteria.split('adm>')[1]);
		if (criteria.startsWith('dev>')) return this.dev(criteria.split('dev>')[1]);

		return this.global(criteria);

	}

	/**
	 * Filtra y devuelve las acciones globales en base al criterio de búsqueda.
	 * @param criteria Criterio de búsqueda.
	 */
	public static global(criteria: string): globalFilterCollectionType {

		return {
			type: 'global',
			collection: [
				{ title: 'Cerra sesión', action: () => {} }
			]
		}

	}

	/**
	 * Filtra y devuelve las acciones respecto a servidores en base al criterio de búsqueda.
	 * @param criteria Criterio de búsqueda.
	 */
	private static srv(criteria: string): serversFilterCollectionType {

		const placeholder: serversFilterCollectionType = {
			type: 'servers',
			collection: []
		}

		if (serverStore.servers === null) return placeholder;

		// Todos los servidores que cumplen con el criterio de búsqueda.
		const primaryFilter = serverStore.servers.filter(server => {
			if (server.name.toLowerCase().includes(criteria.toLowerCase())) return server
		})

		// No ha encontrado ningún servidor que cumpla con el criterio, detiene el filtro.
		if (primaryFilter.length === 0) return placeholder;

		// Evalua cada servidor y mapea las acciones posibles.
		const secondaryFilter = primaryFilter.map(server => {

			// Filtra las acciones posibles.
			const actions = serverActions.filter(action => {
				if (!action.title.toLowerCase().includes(criteria.toLowerCase())) return
				if (!action.requirements) return action
				else if (action.requirements(server)) return action
			})

			// Decalara, asigna y devuelve la colección.
			return { server, actions }

		})

		return {
			type: 'servers',
			collection: secondaryFilter
		};
		
		// Debe devolver un serverCmdCollection[].

	}

	/**
	 * Filtra y devuelve las acciones de desarrollador en base al criterio de búsqueda.
	 * @param criteria Criterio de búsqueda.
	 */
	public static dev(criteria: string): developerFilterCollectionType {

		return {
			type: 'developer',
			collection: developerActions.filter(action => action.title.toLowerCase().includes(criteria.toLowerCase()))
		}
		
		
	}

}