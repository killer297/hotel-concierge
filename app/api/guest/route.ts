import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireGuest } from '@/lib/auth';
import { api,HttpError } from '@/lib/http';
export async function GET(req:Request){return api(async()=>{const s=await requireGuest();if(new URL(req.url).searchParams.get("roomId")!==s.roomId)throw new HttpError(403,"Room session changed. Scan this room QR again.");const hotel=await db.hotel.findUnique({where:{id:s.hotelId},select:{name:true,address:true,phone:true,info:true}});const services=await db.service.findMany({where:{hotelId:s.hotelId,active:true,OR:[{categoryId:null},{category:{active:true}}]},orderBy:{name:'asc'}});const menu=await db.menuItem.findMany({where:{hotelId:s.hotelId,active:true,OR:[{categoryId:null},{category:{active:true}}]},include:{category:true},orderBy:{name:'asc'}});return NextResponse.json({hotel,room:{id:s.roomId,number:s.room.roomNumber},services,menu},{headers:{'Cache-Control':'no-store'}})})}
