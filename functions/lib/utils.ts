export function validateCard(req: SwellRequest) {
  const {
    data: { card },
  } = req;

  if (!card) {
    throw new Error("Card is required");
  }

  return true;
}

export function validateCardNumber(req: SwellRequest) {
  const {
    data: { card },
  } = req;

  if (!card?.number) {
    throw new Error("Card number is required");
  }

  const sanitizedNumber = sanitizeCardNumber(card.number);

  if (sanitizedNumber === "4242424242424242") {
    return true; // Valid test card number
  }

  return false;
}

export function sanitizeCardNumber(cardNumber: string): string {
  return String(cardNumber).replace(/[^\d]/g, "");
}

export function generateTransactionId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).substr(2, 9);
}
