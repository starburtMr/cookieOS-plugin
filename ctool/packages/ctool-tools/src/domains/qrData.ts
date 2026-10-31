// qrcode-generator Byte mode consumes single-byte strings; preserve UTF-8 bytes.
export const utf8QrData = (text: string) => Array.from(new TextEncoder().encode(text), b => String.fromCharCode(b)).join("");
