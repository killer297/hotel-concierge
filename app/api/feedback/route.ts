import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {z} from 'zod';
import {api,jsonBody,HttpError} from '@/lib/http';
import {requireGuest} from '@/lib/auth';
export async function POST(req:Request){return api(async()=>{const s=await requireGuest();const b=z.object({requestId:z.string().min(1),rating:z.number().int().min(1).max(5),comment:z.string().max(1000).optional()}).parse(await jsonBody(req));const request=await db.serviceRequest.findFirst({where:{id:b.requestId,sessionId:s.id,hotelId:s.hotelId,roomId:s.roomId,status:'COMPLETED'},include:{feedback:true}});if(!request)throw new HttpError(404,'Completed request not found');if(request.feedback)throw new HttpError(409,'Feedback already submitted');const f=await db.feedback.create({data:{hotelId:s.hotelId,roomId:s.roomId,requestId:request.id,rating:b.rating,comment:b.comment}});return NextResponse.json(f,{status:201})})}
