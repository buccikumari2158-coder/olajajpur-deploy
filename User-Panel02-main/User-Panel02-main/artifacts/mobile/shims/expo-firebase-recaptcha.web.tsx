/**
 * Web stub for expo-firebase-recaptcha.
 * expo-firebase-recaptcha uses a native WebView modal which does not exist on web.
 * On web, Firebase phone auth uses a different flow (RecaptchaVerifier from firebase/auth).
 * This stub prevents Metro from bundling the native version for web.
 */
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FirebaseRecaptchaVerifierModal = React.forwardRef(function FirebaseRecaptchaVerifierModal(
  _props: Record<string, unknown>,
  _ref: unknown
) {
  return null;
});

export function FirebaseRecaptchaBanner() {
  return null;
}
