import { config } from "./config";

export async function callSmmApi(action: string, params: Record<string, any> = {}) {
  const apiKey = config.smmApiKey;
  const apiUrl = config.smmApiUrl;

  const bodyParams = new URLSearchParams();
  bodyParams.append("key", apiKey);
  bodyParams.append("action", action);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      bodyParams.append(key, String(value));
    }
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`SMM API HTTP error! Status: ${response.status}`);
  }

  const data = await response.json() as any;
  return data;
}

export async function getSmmBalance() {
  const result = await callSmmApi("balance");
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { balance: string; currency: string };
}

export async function getSmmServices() {
  const result = await callSmmApi("services");
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as Array<{
    service: number;
    name: string;
    rate: string;
    min: string;
    max: string;
    category: string;
    type: string;
    description?: string;
    dripfeed?: boolean;
    refill?: boolean;
    cancel?: boolean;
  }>;
}

export async function placeSmmOrder(serviceId: number, link: string, quantity: number) {
  const result = await callSmmApi("add", {
    service: serviceId,
    link,
    quantity,
  });
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { order: number };
}

export async function getSmmOrderStatus(orderId: number) {
  const result = await callSmmApi("status", { order: orderId });
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as {
    charge: string;
    start_count: string;
    status: string;
    remains: string;
    currency: string;
  };
}

export async function cancelSmmOrder(orderId: number) {
  const result = await callSmmApi("cancel", { order: orderId });
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { success?: string; error?: string };
}
