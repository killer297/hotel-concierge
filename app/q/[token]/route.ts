import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newToken,tokenHash,cookieOptions,requireGuest } from '@/lib/auth';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const room=await db.room.findUnique({where:{qrToken:token},include:{hotel:true}});
 if(!room||room.status!=='ACTIVE'||room.qrStatus!=='ACTIVE'||room.hotel.status!=='ACTIVE')return new NextResponse('This room QR is inactive. Please contact reception.',{status:403});
 const destination=new URL(`/h/${room.hotelId}/r/${room.id}`,req.url);
 try{const current=await requireGuest();if(current.roomId===room.id)return NextResponse.redirect(destination)}catch{}
 const secret=newToken(),expiresAt=new Date(Date.now()+24*60*60*1000);
 await db.guestSession.create({data:{hotelId:room.hotelId,roomId:room.id,sessionToken:tokenHash(secret),expiresAt}});
 const r=NextResponse.redirect(destination);r.cookies.set('dhc_guest',secret,{...cookieOptions,expires:expiresAt});r.headers.set('Cache-Control','no-store');return r;
}
