export namespace CloudCockpit {
	export class Clipboard {
	
		/** Indica si se ha permitido el acceso al portapapeles. */
		private _allowed = false;
	
		/** Indica si se ha solicitado acceso al portapapeles. */
		private _requestedAccess = false;
	
		/** Almacena la instancia del portapapeles del navegador. */
		private cliboard = navigator.clipboard;
	
		/**
		 * Lee el contenido (como texto) del portapapeles.
		 * @returns Promise<string>
		 */
		public readText() {
			return this.cliboard.readText()
				.then((data) => {
					this._requestedAccess = true;
					this._allowed = true;
					return data;
				})
				.catch(err => this.errorHandler)
		}
	
		/**
		 * Escribe texto en el portapapeles.
		 * @param text Texto a introducir en el portapapeles. 
		 * @returns Promise<void>
		 */
		public writeText(text: string) {
			return this.cliboard.writeText(text)
				.then(() => {
					this._requestedAccess = true;
					this._allowed = true;
				})
				.catch(err => this.errorHandler)
		}
	
		/**
		 * Solicita acceso al portapapeles y devuelve una promesa con el resultado.
		 * @returns Promise<void>
		 */
		public requestAccess() {
			if (this._requestedAccess) return Promise.resolve();
			return this.cliboard.read()
				.then(() => {
					this._requestedAccess = true;
					this._allowed = true;
				})
				.catch(err => this.errorHandler);
		}
	
		/**
		 * Maneja el error para establecer parámetros.
		 * @param err Error.
		 * @returns Error.
		 */
		private errorHandler(err: DOMException) {
			this._requestedAccess = true;
			if (err.message === 'Read permission denied.') this._allowed = false;
			return err;
		}
	
		/** Indica si se ha solicitado acceso al portapapeles (desde que se cargó CloudCockpit). */
		get requestedAccess() {
			return this._requestedAccess;
		}
	
		/** Indica si se tiene permiso al portapapeles. */
		get allowed() {
			return this._allowed;
		}
	}

}

export const clipboard = new CloudCockpit.Clipboard();