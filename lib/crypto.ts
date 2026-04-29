import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

export type KeyPair = {
  publicKey: string;
  secretKey: string;
};

const { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } = naclUtil;

export function generateKeyPair(): KeyPair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

export function shortIdFromPublicKey(publicKey: string): string {
  const bytes = decodeBase64(publicKey);
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[(bytes[i] ?? 0) % alphabet.length];
  }
  return out;
}

export function fingerprint(publicKey: string): string {
  const bytes = decodeBase64(publicKey);
  const hex: string[] = [];
  for (let i = 0; i < Math.min(8, bytes.length); i++) {
    const v = bytes[i] ?? 0;
    hex.push(v.toString(16).padStart(2, "0"));
  }
  return hex.join("");
}

export type EncryptedPayload = {
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
};

export function encryptMessage(
  plaintext: string,
  recipientPublicKey: string,
  senderSecretKey: string,
  senderPublicKey: string,
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = decodeUTF8(plaintext);
  const cipher = nacl.box(
    message,
    nonce,
    decodeBase64(recipientPublicKey),
    decodeBase64(senderSecretKey),
  );
  return {
    ciphertext: encodeBase64(cipher),
    nonce: encodeBase64(nonce),
    senderPublicKey,
  };
}

export function decryptMessage(
  payload: EncryptedPayload,
  recipientSecretKey: string,
): string | null {
  try {
    const decrypted = nacl.box.open(
      decodeBase64(payload.ciphertext),
      decodeBase64(payload.nonce),
      decodeBase64(payload.senderPublicKey),
      decodeBase64(recipientSecretKey),
    );
    if (!decrypted) return null;
    return encodeUTF8(decrypted);
  } catch {
    return null;
  }
}

export function signedFingerprint(publicKey: string): string {
  return "0x" + fingerprint(publicKey);
}
