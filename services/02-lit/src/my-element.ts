import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("my-element")
export class MyElement extends LitElement {
  static styles = css`h1 { color: #007bff; }`;
  render() {
    return html`<h1>Lit 3.2 — service starter</h1>`;
  }
}
