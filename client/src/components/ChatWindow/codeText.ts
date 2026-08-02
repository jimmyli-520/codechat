import { isValidElement, type ReactNode } from "react";

export function getCodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getCodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getCodeText(node.props.children);
  }

  return "";
}

export function getClipboardCode(children: ReactNode) {
  return getCodeText(children).replace(/\n$/, "");
}
