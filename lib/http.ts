import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
export class HttpError extends Error { constructor(public status:number,message:string){super(message)} }
export function checkOrigin(req:Request) {
  const origin=req.headers.get('origin');
  const allowed=process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : new URL(req.url).origin;
  if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==allowed)) throw new HttpError(403,'Cross-site request rejected');
}
export async function jsonBody(req:Request) {
  checkOrigin(req);
  if(!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415,'JSON required');
  const text=await req.text();
  if(text.length>16384) throw new HttpError(413,'Request too large');
  try{return JSON.parse(text)}catch{throw new HttpError(400,'Invalid JSON')}
}
export async function api(run:()=>Promise<Response>) {
  try{return await run()}catch(e){
    if(e instanceof HttpError)return NextResponse.json({error:e.message},{status:e.status});
    if(e instanceof ZodError)return NextResponse.json({error:'Invalid input',details:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`)},{status:400});
    if((e as {code?:string}).code==='P2002')return NextResponse.json({error:'This record already exists'},{status:409});
    console.error(e);return NextResponse.json({error:'Unable to complete request'},{status:500});
  }
}
