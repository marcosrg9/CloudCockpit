class StatusAndParams {

	/** Estado de visibilidad de ventanas modales. */
	modalVisibility = {
		/** Estado de visibilidad de la ventana modal para la acción de desarrollador de emisión de mensajes de socket arbitrarios. */
		arbitrarySocketEvents: false
	}

	globalVisibility = {
		userMenu: false,
		notifications: false,
		syncing: false
	}

	commandPaletteVisibility = false;

	webSocket = {
		connected: false,
		connecting: false
	}

	public toggleNotificationsPanel(force: boolean = false) {

		if (force) this.globalVisibility.notifications = force
		else this.globalVisibility.notifications = !this.globalVisibility.notifications

	}

	public closeAllModals() {
		this.modalVisibility = {
			arbitrarySocketEvents: false
		}
	}

}

export const statusAndParams = new StatusAndParams()