import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement <dialog> methods yet; emulate the parts we use.
if (
  typeof HTMLDialogElement !== "undefined" &&
  typeof HTMLDialogElement.prototype.showModal !== "function"
) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
    close(this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
}
