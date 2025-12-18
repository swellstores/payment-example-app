type RazorpayHandler = (response: Record<string, any>) => void;
type RazorpayOnDismiss = () => void;

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

interface RazorpayCustomer {
  id: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  customer_id: string;
  recurring: string;
  handler: RazorpayHandler;
  modal: {
    ondismiss: RazorpayOnDismiss;
  };
}

const MINOR_UNITS = Object.freeze({
  INR: 100,
  USD: 100,
  EUR: 100,
  GBP: 100,
  AUD: 100,
  CAD: 100,
  JPY: 1,
});

type SupportedCurrency = keyof typeof MINOR_UNITS;

function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return currency in MINOR_UNITS;
}

export function toSubunits(amount: number, currency: string) {
  const factor = isSupportedCurrency(currency) ? MINOR_UNITS[currency] : 100;

  return Math.round(amount * factor);
}

export function getIntentData(cart: Record<string, any>) {
  const { capture_total, currency } = cart;

  return {
    amount: toSubunits(capture_total, currency),
    currency,
    method: "card",
    token: {
      max_amount: 1000000,
      frequency: "as_presented",
    },
    payment: {
      capture: "manual",
      capture_options: {
        manual_expiry_period: 7200,
        refund_speed: "normal",
      },
    },
  };
}

export function getRazorpayOptions(
  order: RazorpayOrder,
  customer: RazorpayCustomer,
  settings: SwellSettings,
  handler: RazorpayHandler,
  ondismiss: RazorpayOnDismiss
): RazorpayOptions {
  return {
    key: settings.key_id,
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
    customer_id: customer.id,
    recurring: "1",
    handler,
    modal: {
      ondismiss,
    },
  };
}
