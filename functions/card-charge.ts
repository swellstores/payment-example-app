import Razorpay from "./lib/razorpay";
import { getAppSettings } from "./lib/swell";
import { toSubunits } from "../components/lib/razorpay";

export const config: SwellConfig = {
  extension: "card",
  description: "Charge a Razorpay card payment",
  model: {
    events: ["payment.charge"],
    conditions: {},
  },
};

async function createPayment(req: SwellRequest, razorpay: Razorpay) {
  const { account_id: accountId, card, amount, currency, captured } = req.data;

  const account = await req.swell.get(`/accounts/${accountId}`);
  const customer = await razorpay.getCustomerByEmail(account.email);

  if (!customer) {
    throw new Error("Razorpay customer not found");
  }

  const razorpayAmount = toSubunits(amount, currency);
  const order = await razorpay.createOrder({
    amount: razorpayAmount,
    currency,
    payment_capture: captured !== false,
    notification: {
      token_id: card.token,
    },
  });

  const { razorpay_payment_id: paymentId } =
    await razorpay.createRecurringPayment({
      email: account.email,
      contact: account.phone,
      amount: razorpayAmount,
      currency,
      order_id: order.id,
      customer_id: customer.id,
      token: card.token,
      recurring: true,
    });

  return razorpay.getPayment(paymentId);
}

function getPayment(req: SwellRequest, razorpay: Razorpay) {
  const { intent, transaction_id } = req.data;
  const paymentId = intent?.razorpay?.id || transaction_id;

  return paymentId
    ? razorpay.getPayment(paymentId)
    : createPayment(req, razorpay);
}

export default async function (req: SwellRequest) {
  const { amount, currency, captured } = req.data;

  try {
    const settings = await getAppSettings(req);
    const razorpay = new Razorpay(settings.key_id, settings.key_secret);
    const payment = await getPayment(req, razorpay);

    if (payment.status !== "authorized") {
      throw new Error(`Payment is not capturable (status: ${payment.status})`);
    }

    if (captured !== false) {
      await razorpay.capturePayment(payment.id, {
        amount: toSubunits(amount, currency),
        currency,
      });
    }

    return {
      success: true,
      transaction_id: payment.id,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
