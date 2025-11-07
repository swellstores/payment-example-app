import { generateTransactionId } from "./lib/utils";

export const config: SwellConfig = {
  extension: "card",
  description: "Refund a credit card payment",
  model: {
    events: ["payment.refund"],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  console.log("refund!");
  return {
    success: true,
    transaction_id: generateTransactionId("refund"),
  };
}
