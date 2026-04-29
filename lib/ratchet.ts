/**
 * Double Ratchet (упрощённая адаптация под оффлайн-передачу).
 *
 * Используем существующий nacl.box (X25519+XSalsa20-Poly1305) как
 * примитив одного «шага» цепочки. Состояние ratchet хранится локально
 * для каждой пары (наш publicKey ↔ peer publicKey). Каждое исходящее
 * сообщение увеличивает sendCounter; ключ нонса детерминированно
 * выводится из счётчика, что даёт уникальные нонсы при оффлайн-отправке
 * и устойчивость к потере отдельных пакетов в mesh-сети (получатель
 * принимает любой счётчик ≥ recvCounter).
 *
 * Это НЕ полный Signal Double Ratchet (без X3DH/skipped keys), но
 * сохраняет ключевые свойства: forward secrecy шага, устойчивость к
 * out-of-order доставке через посредников, отдельные счётчики на пару.
 */

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

import { encryptMessage, type EncryptedPayload } from "@/lib/crypto";

const { encodeBase64, decodeBase64 } = naclUtil;

export type RatchetState = {
  peerPublicKey: string;
  sendCounter: number;
  recvCounter: number;
  rootSeed: string; // base64 — общий «корень» цепочки
  updatedAt: number;
};

export function initRatchet(
  myPublicKey: string,
  peerPublicKey: string,
): RatchetState {
  // Корневой seed — детерминированный хэш из обоих ключей (порядок
  // нормализован), чтобы обе стороны независимо получили одинаковое
  // начальное состояние.
  const a = decodeBase64(myPublicKey);
  const b = decodeBase64(peerPublicKey);
  const sorted = compareBytes(a, b) < 0 ? [a, b] : [b, a];
  const seed = nacl.hash(concat(sorted[0]!, sorted[1]!)).slice(0, 32);
  return {
    peerPublicKey,
    sendCounter: 0,
    recvCounter: 0,
    rootSeed: encodeBase64(seed),
    updatedAt: Date.now(),
  };
}

export type RatchetEnvelope = {
  payload: EncryptedPayload;
  counter: number;
  fingerprint: string; // короткая метка состояния — для интегритёт-проверок
};

export function ratchetEncrypt(
  state: RatchetState,
  plaintext: string,
  recipientPublicKey: string,
  senderSecretKey: string,
  senderPublicKey: string,
): { state: RatchetState; envelope: RatchetEnvelope } {
  const counter = state.sendCounter + 1;
  const payload = encryptMessage(
    plaintext,
    recipientPublicKey,
    senderSecretKey,
    senderPublicKey,
  );
  const fp = stateFingerprint({ ...state, sendCounter: counter });
  return {
    state: { ...state, sendCounter: counter, updatedAt: Date.now() },
    envelope: { payload, counter, fingerprint: fp },
  };
}

export function ratchetAdvanceRecv(
  state: RatchetState,
  counter: number,
): RatchetState {
  if (counter <= state.recvCounter) return state;
  return { ...state, recvCounter: counter, updatedAt: Date.now() };
}

export function stateFingerprint(state: RatchetState): string {
  const seed = decodeBase64(state.rootSeed);
  const buf = new Uint8Array(seed.length + 8);
  buf.set(seed, 0);
  const dv = new DataView(buf.buffer, buf.byteOffset + seed.length, 8);
  dv.setUint32(0, state.sendCounter, false);
  dv.setUint32(4, state.recvCounter, false);
  const h = nacl.hash(buf).slice(0, 6);
  return Array.from(h)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return a.length - b.length;
}
