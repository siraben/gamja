import { html, Component } from "../lib/index.js";
import { strip as stripANSI } from "../lib/ansi.js";

const SEARCH_LIMIT = 50;
const SNIPPET_RADIUS = 60;

function getMessageText(msg) {
	if (!msg.params || msg.params.length < 1) {
		return "";
	}
	return stripANSI(msg.params[msg.params.length - 1] || "");
}

function getMessageNick(msg) {
	return (msg.prefix && msg.prefix.name) || "";
}

function formatTimestamp(date) {
	if (!date || isNaN(date.getTime())) {
		return "--:--";
	}
	let hh = date.getHours().toString().padStart(2, "0");
	let mm = date.getMinutes().toString().padStart(2, "0");
	let d = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	return `${d} ${hh}:${mm}`;
}

function buildSnippet(text, query) {
	if (!query) {
		return [{ text, match: false }];
	}
	let lower = text.toLowerCase();
	let q = query.toLowerCase();
	let idx = lower.indexOf(q);
	if (idx === -1) {
		return [{ text, match: false }];
	}

	let start = Math.max(0, idx - SNIPPET_RADIUS);
	let end = Math.min(text.length, idx + q.length + SNIPPET_RADIUS);
	let parts = [];

	if (start > 0) {
		parts.push({ text: "…", match: false });
	}
	if (idx > start) {
		parts.push({ text: text.slice(start, idx), match: false });
	}
	parts.push({ text: text.slice(idx, idx + q.length), match: true });
	if (end > idx + q.length) {
		parts.push({ text: text.slice(idx + q.length, end), match: false });
	}
	if (end < text.length) {
		parts.push({ text: "…", match: false });
	}
	return parts;
}

export default class SearchForm extends Component {
	state = {
		query: "",
		selected: 0,
	};

	constructor(props) {
		super(props);

		this.handleInput = this.handleInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	getMatches() {
		let q = this.state.query.trim().toLowerCase();
		if (!q) {
			return [];
		}
		let messages = (this.props.buffer && this.props.buffer.messages) || [];
		let matches = [];
		for (let i = messages.length - 1; i >= 0; i--) {
			let msg = messages[i];
			if (msg.command !== "PRIVMSG" && msg.command !== "NOTICE") {
				continue;
			}
			let text = getMessageText(msg);
			if (text.toLowerCase().includes(q)) {
				matches.push(msg);
				if (matches.length >= SEARCH_LIMIT) {
					break;
				}
			}
		}
		return matches;
	}

	handleInput(event) {
		this.setState({ [event.target.name]: event.target.value, selected: 0 });
	}

	handleSubmit(event) {
		event.preventDefault();
		let matches = this.getMatches();
		let pick = matches[this.state.selected];
		if (pick) {
			this.props.onSubmit(pick);
		}
	}

	handleKeyDown(event) {
		switch (event.key) {
		case "ArrowUp":
			event.preventDefault();
			event.stopPropagation();
			this.move(-1);
			break;
		case "ArrowDown":
			event.preventDefault();
			event.stopPropagation();
			this.move(1);
			break;
		}
	}

	move(delta) {
		let n = this.getMatches().length;
		if (!n) {
			return;
		}
		this.setState((state) => {
			return { selected: (state.selected + delta + n) % n };
		});
	}

	render() {
		let matches = this.getMatches();
		let query = this.state.query.trim();

		let status;
		if (!query) {
			status = html`<p class="search-empty">Type to search this buffer.</p>`;
		} else if (matches.length === 0) {
			status = html`<p class="search-empty">No matches.</p>`;
		} else {
			status = null;
		}

		let items = matches.map((msg, i) => {
			let text = getMessageText(msg);
			let nick = getMessageNick(msg);
			let date = msg.tags && msg.tags.time ? new Date(msg.tags.time) : null;
			let snippet = buildSnippet(text, query);
			let selected = i === this.state.selected;

			return html`
				<li>
					<button
						type="button"
						class=${"search-result" + (selected ? " selected" : "")}
						aria-selected=${selected}
						onClick=${() => this.props.onSubmit(msg)}
					>
						<span class="search-meta">
							<span class="search-nick">${nick}</span>
							<span class="search-time">${formatTimestamp(date)}</span>
						</span>
						<span class="search-snippet">
							${snippet.map((p) => p.match
								? html`<mark>${p.text}</mark>`
								: html`<span>${p.text}</span>`)}
						</span>
					</button>
				</li>
			`;
		});

		return html`
			<form
				class="search-form"
				onInput=${this.handleInput}
				onSubmit=${this.handleSubmit}
				onKeyDown=${this.handleKeyDown}
			>
				<input
					type="search"
					name="query"
					value=${this.state.query}
					placeholder="Search this buffer"
					autocomplete="off"
					autofocus
					aria-label="Search query"
				/>
				${status}
				${matches.length > 0 ? html`
					<ul class="search-list" role="listbox" aria-label="Search results">
						${items}
					</ul>
				` : null}
			</form>
		`;
	}
}
