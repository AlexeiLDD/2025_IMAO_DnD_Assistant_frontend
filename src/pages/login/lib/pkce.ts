export const generateCodeVerifier = (length: number = 64): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const array = new Uint32Array(length);

  crypto.getRandomValues(array);

  return Array.from(array, (num) => chars[num % chars.length]).join('');
};

export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
