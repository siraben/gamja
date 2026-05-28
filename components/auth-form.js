import { html, Component } from "../lib/index.js";
import { FormField, FormActions } from "./form-field.js";

export default class AuthForm extends Component {
	state = {
		username: "",
		password: "",
	};

	constructor(props) {
		super(props);

		this.handleInput = this.handleInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

		if (props.username) {
			this.state.username = props.username;
		}
	}

	handleInput(event) {
		let target = event.target;
		let value = target.type === "checkbox" ? target.checked : target.value;
		this.setState({ [target.name]: value });
	}

	handleSubmit(event) {
		event.preventDefault();

		this.props.onSubmit(this.state.username, this.state.password);
	}

	render() {
		return html`
			<form onInput=${this.handleInput} onSubmit=${this.handleSubmit}>
				<${FormField}
					label="Username"
					type="username"
					name="username"
					value=${this.state.username}
					required
				/>
				<${FormField}
					label="Password"
					type="password"
					name="password"
					value=${this.state.password}
					required
					autofocus
				/>
				<${FormActions}>
					<button>Login</button>
				</>
			</form>
		`;
	}
}
