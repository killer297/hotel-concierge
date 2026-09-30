import {requireGuest} from '@/lib/auth';import {HttpError} from '@/lib/http';import GuestApp from '@/components/GuestApp';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{hotelId:string;roomId:string}>}){
 const {hotelId,roomId}=await params;
 try{const session=await requireGuest();if(session.hotelId!==hotelId||session.roomId!==roomId)throw new HttpError(403,'Please scan the QR code in this room.');return <GuestApp roomId={roomId}/>}
 catch(e){if(!(e instanceof HttpError))throw e;return <main className="container"><div className="card" style={{padding:28}}><h1>Room access required</h1><p>{e.message}</p><p>Ask reception for an active room QR code.</p></div></main>}
}
