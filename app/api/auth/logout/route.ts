import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { tokenHash,cookieOptions } from '@/lib/auth';
import { api,checkOrigin } from '@/lib/http';
export async function POST(req:Request){return api(async()=>{checkOrigin(req);const token=(await cookies()).get('dhc_session')?.value;if(token)await db.authSession.deleteMany({where:{tokenHash:tokenHash(token)}});const r=NextResponse.json({ok:true});r.cookies.set('dhc_session','',{...cookieOptions,maxAge:0});r.cookies.set('dhc_user','',{...cookieOptions,maxAge:0});return r})}
