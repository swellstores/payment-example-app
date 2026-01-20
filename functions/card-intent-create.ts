import Razorpay from "./lib/razorpay";
import { getAppSettings } from "./lib/swell";

export const config: SwellConfig = {
  extension: "card",
  description: "Initiate a payment",
  model: {
    events: ["payment.create_intent"],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  const { account, intent } = req.data;

  try {
    const settings = await getAppSettings(req);
    const razorpay = new Razorpay(settings.key_id, settings.key_secret);
    const phone =
      account.phone || account.billing?.phone || account.shipping?.phone;

    const customer = await razorpay.createCustomer({
      name: account.name,
      email: account.email,
      contact: phone,
      fail_existing: "0", // If a customer with the same details already exists, fetches details of the existing customer.
    });

    const order = await razorpay.createOrder({
      ...intent,
      customer_id: customer.id,
    });

    return {
      result: { customer, order },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: String(error) };
  }
}
