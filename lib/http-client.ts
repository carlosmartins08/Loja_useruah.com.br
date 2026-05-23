export class HttpRequestError extends Error {
  status: number;
  url: string;
  method: string;

  constructor(method: string, url: string, status: number) {
    super(`${method} ${url} failed with ${status}`);
    this.status = status;
    this.url = url;
    this.method = method;
  }
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, method: 'GET' });
  if (!response.ok) {
    throw new HttpRequestError('GET', url, response.status);
  }
  return (await response.json()) as T;
}

export async function postJson<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new HttpRequestError('POST', url, response.status);
  }
  return (await response.json()) as T;
}
