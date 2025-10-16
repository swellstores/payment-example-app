import { validateCardNumber, generateTransactionId } from './lib/utils';

export const config: SwellConfig = {
  description: 'Charge a credit card payment',
  model: {
    events: ['payment.charge'],
    conditions: {},
  },
};

export default async function (req: SwellRequest) {
  let error;
  try {
    validateCardNumber(req);
  } catch (err) {
    error = err.message;
  }

  console.log('charge!')

  if (!error) {
    return {
      success: true,
      transaction_id: generateTransactionId('charge'),
    };
  } else {
    return {
      success: false,
      error: {
        code: 'ERR_INVALID_CARD',
        message: "Invalid card number",
      }
    };
  }
}