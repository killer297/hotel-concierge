import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { api,jsonBody,HttpError } from '@/lib/http';
import { verifyPassword,hashPassword } from '@/lib/password';
import { newToken,tokenHash,cookieOptions } from '@/lib/auth';
const dummy=hashPassword('invalid-password-placeholder');
export async function POST(req:Request){return api(async()=>{
 const b=z.object({email:z.string().email().transform(x=>x.toLowerCase().trim()),password:z.string().min(1).max(256)}).parse(await jsonBody(req));
 const key=tokenHash(b.email),now=new Date();
 await db.loginThrottle.deleteMany({where:{key,expiresAt:{lte:now}}});
 const attempts=await db.loginThrottle.upsert({where:{key},create:{key,expiresAt:new Date(Date.now()+15*60*1000)},update:{count:{increment:1}}});
 if(attempts.count>10)throw new HttpError(429,'Too many attempts. Try again in 15 minutes.');
 const u=await db.user.findUnique({where:{email:b.email},include:{hotel:true}});
 const valid=verifyPassword(b.password,u?.passwordHash||dummy);
 if(!u||!valid||u.status!=='ACTIVE'||(u.role!=='SUPER_ADMIN'&&u.hotel?.status!=='ACTIVE'))throw new HttpError(401,'Invalid credentials');
 const token=newToken(),expiresAt=new Date(Date.now()+8*60*60*1000);
 await db.authSession.create({data:{userId:u.id,tokenHash:tokenHash(token),expiresAt}});
 const response=NextResponse.json({ok:true,redirect:u.role==='SUPER_ADMIN'?'/super-admin':'/admin'});
 response.cookies.set('dhc_session',token,{...cookieOptions,expires:expiresAt});
 response.cookies.set('dhc_user','',{...cookieOptions,maxAge:0});
 return response;
})}
