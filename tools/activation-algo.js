/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// tools/activation-algo.js
// ALGORITHME Dâ€™ACTIVATION â€” SOURCE UNIQUE DE VÃ‰RITÃ‰

const SECRET = "PLANNING_PWA_SECRET_V1";

/**
 * GÃ©nÃ¨re un code dâ€™activation Ã  partir dâ€™un deviceId
 * @param {string} deviceId
 * @returns {string} code dâ€™activation (12 caractÃ¨res)
 */
export function generateActivationCode(deviceId) {
  if (!deviceId || typeof deviceId !== "string") {
    throw new Error("deviceId invalide");
  }

  const input = `${SECRET}:${deviceId}`;
  return sha256(input).slice(0, 12);
}

/* =======================
   SHA-256 â€” implÃ©mentation pure
   ======================= */

function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let mathPow = Math.pow;
  let maxWord = mathPow(2, 32);
  let result = "";

  let words = [];
  let asciiBitLength = ascii.length * 8;

  let hash = [];
  let k = [];
  let primeCounter = 0;

  let isPrime = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isPrime[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    let j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    let w = words.slice(j, (j += 16));
    let oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      let w15 = w[i - 15],
        w2 = w[i - 2];

      let a = hash[0],
        e = hash[4];

      let temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      let temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      let b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

