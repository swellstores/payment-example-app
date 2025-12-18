import { useCallback, useEffect } from "preact/hooks";
import { memo } from "preact/compat";
import { getIntentData, getRazorpayOptions } from "./lib/razorpay";

declare const window: Window & { Razorpay: any };

const RAZORPAY_SCRIPT_ID = "razorpay";
const RAZORPAY_SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const config: SwellConfig = {
  extension: "card",
  description: "Razorpay client side integration",
};

function Razorpay({
  settings,
  loadLib,
  registerHandlers,
  getIntent,
  createIntent,
  updateCart,
  onReady,
}: SwellData) {
  const onSubmit = useCallback(
    async (cart: Record<string, any>) => {
      const intentData = getIntentData(cart);
      const { order, customer } = await createIntent(intentData);

      const paymentDetails = await new Promise<Record<string, any>>(
        (resolve, reject) => {
          const razorpayOptions = getRazorpayOptions(
            order,
            customer,
            settings,
            resolve,
            reject
          );
          const razorpay = new window.Razorpay(razorpayOptions);

          razorpay.open();
        }
      );

      const payment = await getIntent(paymentDetails);
      const { token } = payment;

      if (!token?.card) {
        throw new Error("Payment is not tokenized.");
      }

      const { card } = token;

      return updateCart({
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
      });
    },
    [settings, getIntent, createIntent, updateCart]
  );

  useEffect(() => {
    registerHandlers({
      onSubmit,
    });
    loadLib(RAZORPAY_SCRIPT_ID, RAZORPAY_SDK_URL).then(onReady);
  }, [registerHandlers, loadLib, onReady, onSubmit]);

  return null;
}

export default memo(Razorpay);
