export class DialogStore<T = null> {
	isOpen = $state(false);
	data = $state<T | null>(null);
	#initialData: T | null;

	constructor(initialState = false, initialData: T | null = null) {
		this.isOpen = initialState;
		this.data = initialData;
		this.#initialData = initialData;
	}

	open = (data?: T | null) => {
		this.isOpen = true;
		this.data = data !== undefined ? data : this.#initialData;
	};

	close = () => {
		this.isOpen = false;
	};

	toggle = () => {
		this.isOpen = !this.isOpen;
	};
}
export function createDialogStore<T = null>(initialState = false, initialData: T | null = null) {
	return new DialogStore<T>(initialState, initialData);
}
