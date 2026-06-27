/**
 * Razorpay Checkout HTML builder.
 *
 * The mobile app loads this HTML inside a react-native-webview (on native) or
 * an iframe-equivalent (on web). The page initializes Razorpay's hosted
 * checkout and posts the result back via `window.ReactNativeWebView.postMessage`.
 *
 * The shape of the messages is fixed — see RazorpayMessage below — so the
 * caller can branch on `type`.
 */

export type RazorpayMessage =
  | { type: "success"; paymentId: string; orderId: string; signature: string }
  | { type: "dismissed" }
  | { type: "failed"; code?: string; description?: string };

export interface RazorpayHtmlOptions {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name: string;
  phone: string;
  description: string;
}

/**
 * On Expo web, react-native-webview does NOT render — using it crashes the
 * checkout flow. Instead, load Razorpay's checkout.js directly into the host
 * page and invoke it. Returns a single promise that resolves with the same
 * RazorpayMessage shape the WebView path uses, so callers can branch on
 * Platform.OS and converge on a shared handler.
 */
let checkoutScriptPromise: Promise<void> | null = null;
function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { Razorpay?: unknown };
  if (w.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      // Clear the cached promise so the next attempt re-tries the load
      // instead of returning the cached failure forever.
      checkoutScriptPromise = null;
      s.remove();
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.head.appendChild(s);
  });
  return checkoutScriptPromise;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): {
    open(): void;
    on(event: string, handler: (response: { error: { code: string; description: string } }) => void): void;
  };
}

export async function openRazorpayWeb(opts: RazorpayHtmlOptions): Promise<RazorpayMessage> {
  if (typeof window === "undefined") {
    return { type: "failed", description: "Razorpay web only runs in a browser" };
  }
  try {
    await loadCheckoutScript();
  } catch (err) {
    return {
      type: "failed",
      description: err instanceof Error ? err.message : "Razorpay script failed to load",
    };
  }
  return new Promise<RazorpayMessage>((resolve) => {
    const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
    let settled = false;
    const settle = (msg: RazorpayMessage) => {
      if (settled) return;
      settled = true;
      resolve(msg);
    };
    const options: Record<string, unknown> = {
      key: opts.keyId,
      amount: opts.amountPaise,
      currency: "INR",
      name: "Jajpur Jatri",
      description: opts.description,
      order_id: opts.orderId,
      prefill: { name: opts.name, contact: opts.phone },
      theme: { color: "#32FF7E" },
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        settle({
          type: "success",
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: { ondismiss: () => settle({ type: "dismissed" }) },
    };
    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      settle({
        type: "failed",
        code: response.error.code,
        description: response.error.description,
      });
    });
    rzp.open();
  });
}

export function buildRazorpayHtml(opts: RazorpayHtmlOptions): string {
  const { keyId, orderId, amountPaise, name, phone, description } = opts;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
    .loading { color: #32FF7E; font-size: 16px; }
  </style>
</head>
<body>
  <div class="loading">Opening payment…</div>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function post(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      } else if (window.parent) {
        window.parent.postMessage(JSON.stringify(msg), "*");
      }
    }
    window.onload = function() {
      var options = {
        key: ${JSON.stringify(keyId)},
        amount: ${amountPaise},
        currency: "INR",
        name: "Jajpur Jatri",
        description: ${JSON.stringify(description)},
        order_id: ${JSON.stringify(orderId)},
        prefill: { name: ${JSON.stringify(name)}, contact: ${JSON.stringify(phone)} },
        theme: { color: "#32FF7E" },
        handler: function(response) {
          post({
            type: "success",
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        },
        modal: { ondismiss: function() { post({ type: "dismissed" }); } }
      };
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function(response) {
        post({ type: "failed", code: response.error.code, description: response.error.description });
      });
      rzp.open();
    };
  </script>
</body>
</html>`;
}
