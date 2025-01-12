import bs58 from 'bs58';

export function decodeBase58(str) {
  return bs58.decode(str);
}

export function encodeBase58(bytes) {
  return bs58.encode(bytes);
}