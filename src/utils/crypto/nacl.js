import nacl from 'tweetnacl';

export const verify = nacl.sign.detached.verify;
export const sign = nacl.sign.detached;