import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {z} from 'zod';
import {api,jsonBody,HttpError} from '@/lib/http';
import {requireHotelAdmin} from '@/lib/auth';
import {transitions} from '@/lib/request-status';
const schema=z.object({status:z.enum(['NEW','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED']),note:z.string().max(500).optional()});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){return api(async()=>{
 const u=await requireHotelAdmin(),{id}=await params,b=schema.parse(await jsonBody(req));
 await db.$transaction(async tx=>{
  const current=await tx.serviceRequest.findFirst({where:{id,hotelId:u.hotelId!}});
  if(!current)throw new HttpError(404,'Not found');
  if(!transitions[current.status].includes(b.status))throw new HttpError(409,'Invalid status transition');
  const result=await tx.serviceRequest.updateMany({where:{id,hotelId:u.hotelId!,status:current.status},data:{status:b.status,completedAt:b.status==='COMPLETED'?new Date():null}});
  if(result.count!==1)throw new HttpError(409,'Request changed. Please refresh.');
  await tx.requestEvent.create({data:{requestId:id,status:b.status,note:b.note,changedBy:u.id}});
 });return NextResponse.json({ok:true});
})}
