const API_URL = "https://api.razorpay.com/v1";

async function hmacSha256(message: string, secret: string) {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default class Razorpay {
  #keyId: string;
  #keySecret: string;

  constructor(keyId: string, keySecret: string) {
    if (!keyId || !keySecret) {
      throw new Error("keyId and keySecret are required");
    }

    this.#keyId = keyId;
    this.#keySecret = keySecret;
  }

  async request(
    path: string,
    method: string = "GET",
    body?: Record<string, any> | null
  ) {
    let url = `${API_URL}${path}`;
    const headers = new Headers();

    headers.set(
      "Authorization",
      "Basic " + btoa(`${this.#keyId}:${this.#keySecret}`)
    );
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Razorpay API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async getCustomerByEmail(email: string) {
    const response = await this.request(`/customers?email=${email}`, "GET");

    return response.items[0] || null;
  }

  createCustomer(data: Record<string, any>) {
    return this.request("/customers", "POST", data);
  }

  createOrder(data: Record<string, any>) {
    return this.request("/orders", "POST", data);
  }

  getPayment(id: string, expand?: string) {
    return this.request(
      `/payments/${id}${expand ? `?expand[]=${expand}` : ""}`,
      "GET"
    );
  }

  capturePayment(id: string, data: Record<string, any>) {
    return this.request(`/payments/${id}/capture`, "POST", data);
  }

  createRecurringPayment(data: Record<string, any>) {
    return this.request(`/payments/create/recurring`, "POST", data);
  }

  refundPayment(id: string, data: Record<string, any>) {
    return this.request(`/payments/${id}/refund`, "POST", data);
  }

  getToken(customerId: string, tokenId: string) {
    return this.request(`/customers/${customerId}/tokens/${tokenId}`, "GET");
  }

  async verifySignature(orderId: string, paymentId: string, signature: string) {
    const message = `${orderId}|${paymentId}`;
    const generatedSignature = await hmacSha256(message, this.#keySecret);

    if (generatedSignature !== signature) {
      throw new Error("Invalid payment signature");
    }
  }
}
