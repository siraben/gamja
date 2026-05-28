import { html, Component } from "../lib/index.js";
import { FormField, FormActions } from "./form-field.js";

export default class JoinForm extends Component {
	state = {
		channel: "#",
	};

	constructor(props) {
		super(props);

		this.handleInput = this.handleInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

		if (props.channel) {
			this.state.channel = props.channel;
		}
	}

	handleInput(event) {
		let target = event.target;
		let value = target.type === "checkbox" ? target.checked : target.value;
		this.setState({ [target.name]: value });
	}

	handleSubmit(event) {
		event.preventDefault();

		let params = {
			channel: this.state.channel,
		};

		this.props.onSubmit(params);
	}

	render() {
		return html`
			<form onInput=${this.handleInput} onSubmit=${this.handleSubmit}>
				<${FormField}
					label="Channel"
					type="text"
					name="channel"
					value=${this.state.channel}
					autofocus
					required
				/>
				<${FormActions}>
					<button>Join</button>
				</>
			</form>
		`;
	}
}
