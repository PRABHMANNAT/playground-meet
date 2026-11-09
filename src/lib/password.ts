import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,salt,64,(error,key)=>error?reject(error):resolve(key)));
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+(await derive(password,salt)).toString('hex');}
export async function verifyPassword(password:string,stored:string){const [salt,hex]=stored.split(':');if(!salt||!hex||hex.length!==128)return false;const key=await derive(password,salt);return timingSafeEqual(key,Buffer.from(hex,'hex'));}
