import * as irc from "../lib/irc.js";
import { strip as stripANSI } from "../lib/ansi.js";
import { html } from "../lib/index.js";
import { BufferType, BufferListSortMode, Unread, ServerStatus, compareBuffers, getBufferURL, getServerName } from "../state.js";

function lastMessageTime(buf) {
	if (buf.messages.length === 0) {
		return "";
	}
	let msg = buf.messages[buf.messages.length - 1];
	return msg.tags.time || "";
}

function compareBufferListItems(props, a, b) {
	let defaultOrder = compareBuffers(props, a, b);
	if (a.server !== b.server || a.type === BufferType.SERVER || b.type === BufferType.SERVER) {
		return defaultOrder;
	}

	if (a.favorite !== b.favorite) {
		return a.favorite ? -1 : 1;
	}

	switch (props.settings.bufferListSort) {
	case BufferListSortMode.UNREAD:
		let unread = Unread.compare(b.unread, a.unread);
		if (unread !== 0) {
			return unread;
		}
		let unreadCount = (b.unreadCount || 0) - (a.unreadCount || 0);
		if (unreadCount !== 0) {
			return unreadCount;
		}
		break;
	case BufferListSortMode.ACTIVITY:
		let activity = lastMessageTime(b).localeCompare(lastMessageTime(a));
		if (activity !== 0) {
			return activity;
		}
		break;
	}

	return defaultOrder;
}

function BufferItem(props) {
	function handleClick(event) {
		event.preventDefault();
		props.onClick();
	}
	function handleMouseDown(event) {
		if (event.button === 1) { // middle click
			event.preventDefault();
			props.onClose();
		}
	}
	function handleFavoriteClick(event) {
		event.preventDefault();
		event.stopPropagation();
		props.onFavorite(!props.buffer.favorite);
	}

	let name = props.buffer.name;
	if (props.buffer.type === BufferType.SERVER) {
		name = getServerName(props.server, props.bouncerNetwork);
	}

	let title;
	let unreadCount = props.buffer.unreadCount || 0;
	let classes = ["type-" + props.buffer.type];
	if (props.active) {
		classes.push("active");
	}
	if (props.buffer.favorite) {
		classes.push("favorite");
	}
	if (props.buffer.unread !== Unread.NONE) {
		classes.push("unread-" + props.buffer.unread);
	}
	switch (props.buffer.type) {
	case BufferType.SERVER:
		let isError = props.server.status === ServerStatus.DISCONNECTED;
		if (props.bouncerNetwork && props.bouncerNetwork.error) {
			isError = true;
		}
		if (isError) {
			classes.push("error");
		}
		break;
	case BufferType.NICK:
		let user = props.server.users.get(name);
		if (user && irc.isMeaningfulRealname(user.realname, name)) {
			title = stripANSI(user.realname);
		}
		break;
	}

	let favoriteButton = null;
	if (props.buffer.type === BufferType.CHANNEL) {
		let label = props.buffer.favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`;
		favoriteButton = html`
			<button
				type="button"
				class="buffer-favorite"
				aria-label=${label}
				title=${label}
				aria-pressed=${props.buffer.favorite}
				onClick=${handleFavoriteClick}
			>
				${props.buffer.favorite ? "★" : "☆"}
			</button>
		`;
	}

	let unreadBadge = null;
	if (unreadCount > 0) {
		unreadBadge = html`
			<span class="buffer-unread-count" aria-label="${unreadCount} unread messages">
				${unreadCount > 99 ? "99+" : unreadCount}
			</span>
		`;
	}

	return html`
		<li class="${classes.join(" ")}" role="tab" aria-selected="${props.active}">
			${favoriteButton}
			<a
				href=${getBufferURL(props.buffer)}
				title=${title}
				onClick=${handleClick}
				onMouseDown=${handleMouseDown}
			>
				<span class="buffer-name">${name}</span>
				${unreadBadge}
			</a>
		</li>
	`;
}

export default function BufferList(props) {
	let items = Array.from(props.buffers.values()).sort((a, b) => {
		return compareBufferListItems(props, a, b);
	}).map((buf) => {
		let server = props.servers.get(buf.server);

		let bouncerNetwork = null;
		if (server.bouncerNetID) {
			bouncerNetwork = props.bouncerNetworks.get(server.bouncerNetID);
		}

		return html`
			<${BufferItem}
				key=${buf.id}
				buffer=${buf}
				server=${server}
				bouncerNetwork=${bouncerNetwork}
				onClick=${() => props.onBufferClick(buf)}
				onClose=${() => props.onBufferClose(buf)}
				onFavorite=${(favorite) => props.onBufferFavorite(buf, favorite)}
				active=${props.activeBuffer === buf.id}
			/>
		`;
	});

	return html`
		<ul role="tablist" aria-label="Buffer list">
			${items}
		</ul>
	`;
}
