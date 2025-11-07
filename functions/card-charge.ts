import { validateCard, generateTransactionId } from "./lib/utils";

export const config: SwellConfig = {
  extension: "card",
  description: "Charge a credit card payment",
  model: {
    events: ["payment.charge"],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  let error;

  console.log("charge!");

  try {
    validateCard(req);
  } catch (err) {
    error = err.message;
  }

  if (!error) {
    return {
      success: true,
      transaction_id: generateTransactionId("charge"),
    };
  } else {
    return {
      success: false,
      error: {
        code: "ERR_INVALID_CARD",
        message: "Invalid card number",
      },
    };
  }
}
