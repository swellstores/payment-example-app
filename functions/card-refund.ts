import Razorpay from "./lib/razorpay";
import { getAppSettings } from "./lib/swell";
import { toSubunits } from "../components/lib/razorpay";

export const config: SwellConfig = {
  extension: "card",
  description: "Refund a Razorpay card payment",
  model: {
    events: ["payment.refund"],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  const { amount, currency, transaction_id } = req.data;

  try {
    const settings = await getAppSettings(req);
    const razorpay = new Razorpay(settings.key_id, settings.key_secret);
    const refund = await razorpay.refundPayment(transaction_id, {
      amount: toSubunits(amount, currency),
    });

    return {
      success: true,
      transaction_id: refund.id,
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
