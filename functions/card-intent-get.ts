import Razorpay from "./lib/razorpay";
import { getAppSettings } from "./lib/swell";

export const config: SwellConfig = {
  extension: "card",
  description: "Retrieve payment details",
  model: {
    events: ["payment.get_intent"],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.data.intent;

  try {
    const settings = await getAppSettings(req);
    const razorpay = new Razorpay(settings.key_id, settings.key_secret);

    await razorpay.verifySignature(orderId, paymentId, signature);

    const payment = await razorpay.getPayment(paymentId, "token");

    return {
      result: payment,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: String(error) };
  }
}
