import { html, Component } from "../lib/index.js";
import { BufferListSortMode } from "../state.js";
import { FormField, FormActions } from "./form-field.js";

export default class SettingsForm extends Component {
	state = {};

	constructor(props) {
		super(props);

		this.state.secondsInTimestamps = props.settings.secondsInTimestamps;
		this.state.bufferEvents = props.settings.bufferEvents;
		this.state.bufferListSort = props.settings.bufferListSort || BufferListSortMode.ALPHABETICAL;

		this.handleInput = this.handleInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleInput(event) {
		let target = event.target;
		let value = target.type === "checkbox" ? target.checked : target.value;
		this.setState({ [target.name]: value }, () => {
			this.props.onChange(this.state);
		});
	}

	handleSubmit(event) {
		event.preventDefault();
		this.props.onClose();
	}

	registerProtocol() {
		let url = window.location.origin + window.location.pathname + "?open=%s";
		try {
			navigator.registerProtocolHandler("irc", url);
			navigator.registerProtocolHandler("ircs", url);
		} catch (err) {
			console.error("Failed to register protocol handler: ", err);
		}
	}

	render() {
		let protocolHandler = null;
		if (this.props.showProtocolHandler) {
			protocolHandler = html`
				<div class="protocol-handler">
					<div class="left">
						Set gamja as your default IRC client for this browser.
						IRC links will be automatically opened here.
					</div>
					<div class="right">
						<button type="button" onClick=${() => this.registerProtocol()}>
							Enable
						</button>
					</div>
				</div>
			`;
		}

		return html`
			<form onInput=${this.handleInput} onSubmit=${this.handleSubmit}>
				<${FormField}
					type="checkbox"
					name="secondsInTimestamps"
					checked=${this.state.secondsInTimestamps}
					label="Show seconds in time indicator"
				/>

				<fieldset class="form-row-group">
					<legend class="form-row-label">Chat events</legend>
					<${FormField}
						type="radio"
						name="bufferEvents"
						value="fold"
						checked=${this.state.bufferEvents === "fold"}
						label="Show and fold chat events"
					/>
					<${FormField}
						type="radio"
						name="bufferEvents"
						value="expand"
						checked=${this.state.bufferEvents === "expand"}
						label="Show and expand chat events"
					/>
					<${FormField}
						type="radio"
						name="bufferEvents"
						value="hide"
						checked=${this.state.bufferEvents === "hide"}
						label="Hide chat events"
					/>
				</fieldset>

				<fieldset class="form-row-group">
					<legend class="form-row-label">Buffer list order</legend>
					<${FormField}
						type="radio"
						name="bufferListSort"
						value=${BufferListSortMode.ALPHABETICAL}
						checked=${this.state.bufferListSort === BufferListSortMode.ALPHABETICAL}
						label="Sort buffers alphabetically"
					/>
					<${FormField}
						type="radio"
						name="bufferListSort"
						value=${BufferListSortMode.UNREAD}
						checked=${this.state.bufferListSort === BufferListSortMode.UNREAD}
						label="Sort unread buffers first"
					/>
					<${FormField}
						type="radio"
						name="bufferListSort"
						value=${BufferListSortMode.ACTIVITY}
						checked=${this.state.bufferListSort === BufferListSortMode.ACTIVITY}
						label="Sort by recent activity"
					/>
				</fieldset>

				${protocolHandler}

				<${FormActions}>
					<button type="button" class="danger" onClick=${() => this.props.onDisconnect()}>
						Disconnect
					</button>
					<button>
						Close
					</button>
				</>
			</form>
		`;
	}
}
