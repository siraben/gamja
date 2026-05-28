import { html } from "../lib/index.js";

export function FormField(props) {
	let { label, hint, children, inputRef, ...rest } = props;
	let type = rest.type || "text";
	let inline = type === "checkbox" || type === "radio";

	if (inline) {
		return html`
			<label class="form-row form-row-inline">
				<input ...${rest} ref=${inputRef}/>
				<span>${label}</span>
				${children}
			</label>
		`;
	}

	return html`
		<label class="form-row">
			<span class="form-row-label">${label}</span>
			<input ...${rest} ref=${inputRef}/>
			${hint ? html`<span class="form-row-hint">${hint}</span>` : null}
			${children}
		</label>
	`;
}

export function FormActions(props) {
	return html`<div class="form-actions">${props.children}</div>`;
}
