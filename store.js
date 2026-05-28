import { ReceiptType, Unread } from "./state.js";
import debounce from "./lib/debounce.js";

const PREFIX = "gamja_";

class Item {
	constructor(k) {
		this.k = PREFIX + k;
	}

	load() {
		let v = localStorage.getItem(this.k);
		if (!v) {
			return null;
		}
		return JSON.parse(v);
	}

	put(v) {
		if (v) {
			localStorage.setItem(this.k, JSON.stringify(v));
		} else {
			localStorage.removeItem(this.k);
		}
	}
}

export const autoconnect = new Item("autoconnect");
export const naggedProtocolHandler = new Item("naggedProtocolHandler");
export const settings = new Item("settings");

class BufferBackedStore {
	m = null;

	constructor(raw) {
		this.raw = raw;

		let obj = raw.load();
		this.m = new Map(Object.entries(obj || {}));

		let saveImmediately = this.save.bind(this);
		this.save = debounce(saveImmediately, 500);

		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") {
				saveImmediately();
			}
		});
	}

	key(buf) {
		// TODO: use case-mapping here somehow
		return JSON.stringify({
			name: buf.name.toLowerCase(),
			server: {
				bouncerNetwork: buf.server.bouncerNetwork,
			},
		});
	}

	save() {
		if (this.m.size > 0) {
			this.raw.put(Object.fromEntries(this.m));
		} else {
			this.raw.put(null);
		}
	}
}

export class Draft {
	constructor() {
		this.store = new BufferBackedStore(new Item("drafts"));
	}

	get(buf) {
		return this.store.m.get(this.store.key(buf));
	}

	put(buf) {
		let key = this.store.key(buf);
		let text = buf.text || "";

		if (text) {
			this.store.m.set(key, {
				name: buf.name,
				text,
				server: {
					bouncerNetwork: buf.server.bouncerNetwork,
				},
			});
		} else {
			this.store.m.delete(key);
		}

		this.store.save();
	}

	delete(buf) {
		this.store.m.delete(this.store.key(buf));
		this.store.save();
	}

	clear(server) {
		if (server) {
			for (const draft of this.store.m.values()) {
				if (draft.server.bouncerNetwork === server.bouncerNetwork) {
					this.store.m.delete(this.store.key(draft));
				}
			}
		} else {
			this.store.m = new Map();
		}
		this.store.save();
	}
}

export class Buffer {
	store = null;

	constructor() {
		this.store = new BufferBackedStore(new Item("buffers"));
	}

	key(buf) {
		return this.store.key(buf);
	}

	save() {
		this.store.save();
	}

	get(buf) {
		return this.store.m.get(this.key(buf));
	}

	put(buf) {
		let key = this.key(buf);

		let updated = !this.store.m.has(key);
		let prev = this.store.m.get(key) || {};

		let unread = prev.unread || Unread.NONE;
		if (buf.unread !== undefined && buf.unread !== prev.unread) {
			unread = buf.unread;
			updated = true;
		}

		let unreadCount = prev.unreadCount || 0;
		if (buf.unreadCount !== undefined && buf.unreadCount !== prev.unreadCount) {
			unreadCount = buf.unreadCount;
			updated = true;
		}

		let favorite = prev.favorite || false;
		if (buf.favorite !== undefined && buf.favorite !== prev.favorite) {
			favorite = buf.favorite;
			updated = true;
		}

		let receipts = { ...prev.receipts };
		if (buf.receipts) {
			Object.keys(buf.receipts).forEach((k) => {
				// Use a not-equals comparison here so that no-op receipt
				// changes are correctly handled
				if (!receipts[k] || receipts[k].time < buf.receipts[k].time) {
					receipts[k] = buf.receipts[k];
					updated = true;
				}
			});
			if (receipts[ReceiptType.DELIVERED] < receipts[ReceiptType.READ]) {
				receipts[ReceiptType.DELIVERED] = receipts[ReceiptType.READ];
				updated = true;
			}
		}

		let closed = prev.closed || false;
		if (buf.closed !== undefined && buf.closed !== prev.closed) {
			closed = buf.closed;
			updated = true;
		}

		if (!updated) {
			return false;
		}

		this.store.m.set(this.key(buf), {
			name: buf.name,
			unread,
			unreadCount,
			favorite,
			receipts,
			closed,
			server: {
				bouncerNetwork: buf.server.bouncerNetwork,
			},
		});

		this.save();
		return true;
	}

	delete(buf) {
		this.store.m.delete(this.key(buf));
		this.save();
	}

	list(server) {
		// Some gamja versions would store the same buffer multiple times
		let names = new Set();
		let buffers = [];
		for (const buf of this.store.m.values()) {
			if (buf.server.bouncerNetwork !== server.bouncerNetwork) {
				continue;
			}
			if (names.has(buf.name)) {
				continue;
			}
			buffers.push(buf);
			names.add(buf.name);
		}
		return buffers;
	}

	clear(server) {
		if (server) {
			for (const buf of this.list(server)) {
				this.store.m.delete(this.key(buf));
			}
		} else {
			this.store.m = new Map();
		}
		this.save();
	}
}
