type name = 'UnknownError' | 'MissingKey' | 'InvalidKey';

const MESSAGE_DICT = Object.freeze({
	UnknownError: 'Unknown error',
	MissingKey: 'The encryption key is missing when an attempt has been made to decrypt an encrypted record.\n Enter the encryption key assigned to the database records in the DB_CYPHER environment variable.',
	InvalidKey: 'The encryption key does not meet the minimum length requirements.\n Set one of at least 32 characters.'
});

export class CypherError extends Error {

	constructor(readonly name: name) {

		super(MESSAGE_DICT[name] || MESSAGE_DICT.UnknownError);

	}
	
}