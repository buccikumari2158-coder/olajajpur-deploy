import type { ConfirmationResult } from "firebase/auth";

let _confirmationResult: ConfirmationResult | null = null;

export function setConfirmationResult(cr: ConfirmationResult) {
  _confirmationResult = cr;
}

export function getConfirmationResult(): ConfirmationResult | null {
  return _confirmationResult;
}

export function clearConfirmationResult() {
  _confirmationResult = null;
}
