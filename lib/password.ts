import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPassword(password:string) {
  const salt=randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password:string,stored:string) {
  const [algorithm,salt,value]=stored.split(':');
  if(algorithm!=='scrypt'||!salt||!value) return false;
  const expected=Buffer.from(value,'hex');
  const actual=scryptSync(password,salt,64);
  return expected.length===actual.length && timingSafeEqual(actual,expected);
}
