export class DialogStore<T = null, R = boolean> {
	isOpen = $state(false);
	data = $state<T | null>(null);
	#initialData: T | null;

	// Internal resolver for promise-based dialogs
	#resolver: ((value: R | null) => void) | null = null;

	constructor(initialState = false, initialData: T | null = null) {
		this.isOpen = initialState;
		this.data = initialData;
		this.#initialData = initialData;
	}

	open = (data?: T | null) => {
		this.isOpen = true;
		this.data = data !== undefined ? data : this.#initialData;
	};

	ask = (data?: T | null): Promise<R | null> => {
		this.open(data);
		return new Promise<R | null>((resolve) => {
			this.#resolver = resolve;
		});
	};

	respond = (value: R | null) => {
		const resolve = this.#resolver;
		this.#resolver = null;
		this.close();
		if (resolve) {
			resolve(value);
		}
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
