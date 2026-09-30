import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {requireHotelAdmin,newToken} from '@/lib/auth';
import {hashPassword} from '@/lib/password';
import {api,jsonBody,HttpError} from '@/lib/http';
const text=z.string().trim().min(1).max(150),optional=z.string().max(1000).default('');
const state=z.enum(['ACTIVE','INACTIVE']);
const roomSchema=z.object({roomNumber:text,roomName:optional,status:state,qrStatus:state});
const serviceSchema=z.object({name:text,description:optional,price:z.coerce.number().min(0).max(1000000),estimatedMinutes:z.coerce.number().int().min(1).max(1440),active:z.boolean()});
const menuSchema=z.object({name:text,description:optional,price:z.coerce.number().min(0).max(1000000),active:z.boolean()});
const staffSchema=z.object({name:text,email:z.string().email().transform(x=>x.toLowerCase().trim()),role:z.enum(['HOTEL_ADMIN','MANAGER','STAFF']),status:state,password:z.string().max(256).optional()});
const settingsSchema=z.object({name:text,address:optional,phone:z.string().max(40),email:z.union([z.string().email(),z.literal('')]),wifiName:z.string().max(100),wifiPassword:z.string().max(100),breakfastTime:z.string().max(100),checkinTime:z.string().max(100),checkoutTime:z.string().max(100),policies:z.string().max(3000),facilities:z.string().max(3000)});
export async function POST(req:Request,{params}:{params:Promise<{resource:string}>}){return api(async()=>{
 const user=await requireHotelAdmin(),{resource}=await params;
 if(user.role==='STAFF')throw new HttpError(403,'Manager access required');
 if(resource==='staff'&&user.role!=='HOTEL_ADMIN')throw new HttpError(403,'Hotel admin access required');
 const body=await jsonBody(req),id=z.string().optional().parse(body.id),hotelId=user.hotelId!;
 if(resource==='settings'){
  const {name,address,phone,email,...info}=settingsSchema.parse(body);
  await db.hotel.update({where:{id:hotelId},data:{name,address,phone,email,info:{upsert:{create:info,update:info}}}});
 }else if(resource==='rooms'){
  const data=roomSchema.parse(body);
  if(id){await db.$transaction(async tx=>{const result=await tx.room.updateMany({where:{id,hotelId},data});if(!result.count)throw new HttpError(404,'Room not found');if(data.status==='INACTIVE'||data.qrStatus==='INACTIVE')await tx.guestSession.updateMany({where:{roomId:id,hotelId},data:{expiresAt:new Date()}})})}
  else await db.room.create({data:{...data,hotelId,qrToken:newToken()}});
 }else if(resource==='services'){
  const data=serviceSchema.parse(body);
  if(id){const r=await db.service.updateMany({where:{id,hotelId},data});if(!r.count)throw new HttpError(404,'Service not found')}
  else await db.service.create({data:{...data,hotelId}});
 }else if(resource==='menu'){
  const data=menuSchema.parse(body);
  if(id){const r=await db.menuItem.updateMany({where:{id,hotelId},data});if(!r.count)throw new HttpError(404,'Menu item not found')}
  else await db.menuItem.create({data:{...data,hotelId}});
 }else if(resource==='staff'){
  const {password,...data}=staffSchema.parse(body);
  if((!id||password)&&(!password||password.length<12))throw new HttpError(400,'Use a password of at least 12 characters');
  if(id===user.id&&(data.status!=='ACTIVE'||data.role!=='HOTEL_ADMIN'))throw new HttpError(400,'You cannot disable or demote your own account');
  if(id)await db.$transaction(async tx=>{const result=await tx.user.updateMany({where:{id,hotelId},data:{...data,...(password?{passwordHash:hashPassword(password)}:{})}});if(!result.count)throw new HttpError(404,'Staff member not found');if(password||data.status==='INACTIVE')await tx.authSession.deleteMany({where:{userId:id}})});
  else await db.user.create({data:{...data,hotelId,passwordHash:hashPassword(password!)}});
 }else throw new HttpError(404,'Unknown resource');
 return NextResponse.json({ok:true});
})}
