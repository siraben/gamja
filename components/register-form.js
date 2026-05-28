import { html, Component } from "../lib/index.js";
import { FormField, FormActions } from "./form-field.js";

export default class RegisterForm extends Component {
	state = {
		email: "",
		password: "",
	};

	constructor(props) {
		super(props);

		this.handleInput = this.handleInput.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleInput(event) {
		let target = event.target;
		let value = target.type === "checkbox" ? target.checked : target.value;
		this.setState({ [target.name]: value });
	}

	handleSubmit(event) {
		event.preventDefault();

		this.props.onSubmit(this.state.email, this.state.password);
	}

	render() {
		return html`
			<form onInput=${this.handleInput} onSubmit=${this.handleSubmit}>
				<${FormField}
					label="E-mail"
					type="email"
					name="email"
					value=${this.state.email}
					required=${this.props.emailRequired}
					placeholder=${this.props.emailRequired ? null : "(optional)"}
					autofocus
				/>
				<${FormField}
					label="Password"
					type="password"
					name="password"
					value=${this.state.password}
					required
				/>
				<${FormActions}>
					<button>Register</button>
				</>
			</form>
		`;
	}
}
