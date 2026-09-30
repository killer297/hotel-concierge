import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {z} from 'zod';
import {api,jsonBody,HttpError} from '@/lib/http';
import {requireGuest} from '@/lib/auth';
const schema=z.object({roomId:z.string().min(1),serviceId:z.string().min(1),quantity:z.number().int().min(1).max(20),note:z.string().max(500).optional()});
export async function POST(req:Request){return api(async()=>{
 const s=await requireGuest(),b=schema.parse(await jsonBody(req));
 if(b.roomId!==s.roomId)throw new HttpError(403,"Room session changed. Scan this room QR again.");
 const service=await db.service.findFirst({where:{id:b.serviceId,hotelId:s.hotelId,active:true,OR:[{categoryId:null},{category:{active:true}}]}});
 if(!service)throw new HttpError(400,'Service unavailable');
 const r=await db.$transaction(async tx=>{
  await tx.guestSession.update({where:{id:s.id},data:{lastSeenAt:new Date()}});
  const recent=await tx.serviceRequest.count({where:{roomId:s.roomId,createdAt:{gte:new Date(Date.now()-60000)}}});
  if(recent>=5)throw new HttpError(429,'Please wait a minute before requesting again');
  return tx.serviceRequest.create({data:{hotelId:s.hotelId,roomId:s.roomId,sessionId:s.id,serviceId:service.id,quantity:b.quantity,note:b.note,events:{create:{status:'NEW'}}}});
 });return NextResponse.json(r,{status:201});
})}
export async function GET(req:Request){return api(async()=>{const s=await requireGuest();if(new URL(req.url).searchParams.get("roomId")!==s.roomId)throw new HttpError(403,"Room session changed. Scan this room QR again.");const requests=await db.serviceRequest.findMany({where:{sessionId:s.id,hotelId:s.hotelId,roomId:s.roomId},include:{service:{select:{name:true}},feedback:{select:{rating:true,comment:true}}},orderBy:{createdAt:'desc'},take:100});return NextResponse.json(requests,{headers:{'Cache-Control':'no-store'}})})}
