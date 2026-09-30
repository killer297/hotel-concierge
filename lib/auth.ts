import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import { redirect } from 'next/navigation';
import { db } from './db';
import { HttpError } from './http';
export const cookieOptions={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/'};
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export const newToken=()=>randomBytes(32).toString('hex');
export async function getAdminUser(){
  const token=(await cookies()).get('dhc_session')?.value;
  if(!token)return null;
  const session=await db.authSession.findUnique({where:{tokenHash:tokenHash(token)},include:{user:{include:{hotel:true}}}});
  if(!session||session.expiresAt<=new Date()||session.user.status!=='ACTIVE')return null;
  if(session.user.role!=='SUPER_ADMIN'&&session.user.hotel?.status!=='ACTIVE')return null;
  return session.user;
}
export async function requireAdmin(){const u=await getAdminUser();if(!u)throw new HttpError(401,'Please sign in');return u}
export async function requireHotelAdmin(){const u=await requireAdmin();if(!u.hotelId||u.hotel?.status!=='ACTIVE')throw new HttpError(403,'Hotel access required');return u}
export async function getAdminHotel(){const u=await getAdminUser();if(!u)redirect('/login');if(!u.hotelId||!u.hotel)redirect('/super-admin');return u.hotel}
export async function requireGuest(){
  const token=(await cookies()).get('dhc_guest')?.value;
  if(!token)throw new HttpError(401,'Please scan your room QR again');
  const s=await db.guestSession.findUnique({where:{sessionToken:tokenHash(token)},include:{room:true,hotel:true}});
  if(!s||s.expiresAt<=new Date()||s.room.hotelId!==s.hotelId||s.room.status!=='ACTIVE'||s.room.qrStatus!=='ACTIVE'||s.hotel.status!=='ACTIVE')throw new HttpError(403,'Guest access inactive. Please contact reception.');
  return s;
}
