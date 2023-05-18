/**
 * Diccionario de eventos 
 */
export const EVENTS_DICTIONARY = Object.freeze({

	PLATFORM: {
		GET_PARAMS: 'getPlatformParams'
	},
	AUTH: {
		REJECT_GET_AUTH: 'rejectedAuth',
		RESOLVE_GET_AUTH: 'resolvedAuth',
		REQUEST_GET_AUTH: 'getAuth',
		REJECT_SAVE_AUTH: 'rejectedSaveAuth',
		RESOLVE_SAVE_AUTH: 'resolvedSaveAuth',
		REQUEST_SAVE_AUTH: 'saveAuth',
		REJECT_DELETE_AUTH: 'rejectedDeleteAuth',
		RESOLVE_DELETE_AUTH: 'resolvedDeleteAuth',
		REQUEST_DELETE_AUTH: 'deleteAuth'
	}

})