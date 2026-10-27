/*
  DOCS:
    - Create the Authorization Transaction: https://razorpay.com/docs/api/payments/recurring-payments/cards/create-authorization-transaction/
    - Fetch and Manage Tokens: https://razorpay.com/docs/api/payments/recurring-payments/cards/tokens/
    - Create Subsequent Payments: https://razorpay.com/docs/api/payments/recurring-payments/cards/create-subsequent-payments/
*/

import { useEffect, useRef } from "preact/hooks";
import type {
  ComponentProps,
  PaymentContext,
  PaymentSubmitResult,
} from "@swell/apps-sdk/components";
import { getIntentData, getRazorpayOptions } from "./lib/razorpay";

declare const window: Window & { Razorpay: any };

const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const config = {
  description: "Razorpay client side integration",
  extension: { id: "card" },
  targets: [{ id: "checkout.payment.methods" }],
};

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay could not be loaded"));
    document.head.appendChild(script);
  });
}

export default function Razorpay({
  context,
  settings,
  on,
  call,
}: ComponentProps<never, PaymentContext>) {
  // The submit handler is registered once, so it reads the latest cart from a ref
  const latest = useRef(context);
  latest.current = context;
  const cardSettings = settings.card as SwellSettings;

  useEffect(() => {
    void loadRazorpay().catch(() => {});

    return on("submit", async (): Promise<PaymentSubmitResult> => {
      await loadRazorpay();
      const intentData = getIntentData(latest.current.cart);
      const { order, customer } = await call<Record<string, any>>(
        "createIntent",
        intentData
      );

      const paymentDetails = await new Promise<Record<string, any>>(
        (resolve, reject) => {
          const razorpayOptions = getRazorpayOptions(
            order,
            customer,
            cardSettings,
            resolve,
            reject
          );
          const razorpay = new window.Razorpay(razorpayOptions);

          razorpay.open();
        }
      );

      const payment = await call<Record<string, any>>("getIntent", paymentDetails);
      const { token } = payment;

      if (!token?.card) {
        throw new Error("Payment is not tokenized.");
      }

      const { card } = token;

      return {
        billing: {
          card: {
            token: token.id,
            last4: card.last4,
            brand: card.network,
            exp_month: card.expiry_month,
            exp_year: card.expiry_year,
          },
          intent: {
            razorpay: {
              id: payment.id,
            },
          },
        },
      };
    });
  }, [on, call, cardSettings]);

  return (
    <p style={{ margin: 0 }}>
      You will enter your card details in a secure Razorpay window.
    </p>
  );
}
