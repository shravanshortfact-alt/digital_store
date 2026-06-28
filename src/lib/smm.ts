import { config } from "./config";

export type SmmEnv = {
  SMM_API_KEY?: string;
  SMM_API_URL?: string;
};

function getSmmConfig(env?: SmmEnv) {
  const apiKey = env?.SMM_API_KEY || config.smmApiKey;
  const apiUrl = env?.SMM_API_URL || config.smmApiUrl;

  if (!apiKey) {
    throw new Error("SMM_API_KEY is not configured.");
  }

  return { apiKey, apiUrl };
}

export async function callSmmApi(action: string, params: Record<string, any> = {}, env?: SmmEnv) {
  const { apiKey, apiUrl } = getSmmConfig(env);

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

export async function getSmmBalance(env?: SmmEnv) {
  const result = await callSmmApi("balance", {}, env);
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { balance: string; currency: string };
}

export async function getSmmServices(env?: SmmEnv) {
  const result = await callSmmApi("services", {}, env);
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

export async function placeSmmOrder(serviceId: number, link: string, quantity: number, env?: SmmEnv) {
  const result = await callSmmApi("add", {
    service: serviceId,
    link,
    quantity,
  }, env);
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { order: number };
}

export async function getSmmOrderStatus(orderId: number, env?: SmmEnv) {
  const result = await callSmmApi("status", { order: orderId }, env);
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

export async function cancelSmmOrder(orderId: number, env?: SmmEnv) {
  const result = await callSmmApi("cancel", { order: orderId }, env);
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result as { success?: string; error?: string };
}
