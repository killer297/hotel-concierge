import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {hashPassword} from '../lib/password';
import {randomBytes} from 'node:crypto';
if(process.env.ALLOW_TEST_DATABASE!=='true')throw Error('Run only against a disposable test database with ALLOW_TEST_DATABASE=true');
const db=new PrismaClient(),base=process.env.TEST_BASE_URL||'http://localhost:3000';
const suffix=randomBytes(5).toString('hex'),password='Integration-password-123!';
const hotels:string[]=[];let passed=0;
function ok(condition:unknown,message:string){assert.ok(condition,message);console.log('PASS '+message);passed++}
async function call(path:string,{method='GET',cookie='',body=undefined as unknown,origin=base}:{method?:string;cookie?:string;body?:unknown;origin?:string}={}){
 const response=await fetch(base+path,{method,redirect:'manual',headers:{...(cookie?{cookie}:{}),...(body!==undefined?{'content-type':'application/json'}:{}),origin},body:body!==undefined?JSON.stringify(body):undefined});
 const raw=await response.text();let data:any;try{data=JSON.parse(raw)}catch{data=raw}
 return {status:response.status,data,headers:response.headers,cookie:response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
}
async function fixture(label:string){const h=await db.hotel.create({data:{name:'Test '+label,slug:'test-'+label+'-'+suffix}});hotels.push(h.id);const u=await db.user.create({data:{hotelId:h.id,name:'Test admin',email:label+'-'+suffix+'@example.com',passwordHash:hashPassword(password),role:'HOTEL_ADMIN'}});const room=await db.room.create({data:{hotelId:h.id,roomNumber:'901',qrToken:randomBytes(32).toString('hex')}});const service=await db.service.create({data:{hotelId:h.id,name:'Test towels'}});return{h,u,room,service}}
async function main(){try{
 const a=await fixture('a'),b=await fixture('b');
 let result=await call('/admin');ok([307,308].includes(result.status)&&result.headers.get('location')?.includes('/login'),'anonymous admin blocked');
 ok((await call('/api/dashboard')).status===401,'anonymous dashboard API blocked');
 ok((await call('/api/auth/login',{method:'POST',body:{email:a.u.email,password:'wrong'}})).status===401,'wrong password rejected');
 result=await call('/api/auth/login',{method:'POST',body:{email:a.u.email,password}});ok(result.status===200&&result.cookie.includes('dhc_session='),'admin login creates session');const admin=result.cookie;
 ok((await call('/api/dashboard',{cookie:'dhc_user='+a.u.id})).status===401,'legacy user-ID cookie is rejected');
 const adminB=(await call('/api/auth/login',{method:'POST',body:{email:b.u.email,password}})).cookie;
 ok((await call('/admin',{cookie:admin})).status===200,'authenticated admin dashboard renders');
 ok([307,308].includes((await call('/super-admin',{cookie:admin})).status),'hotel admin blocked from super-admin');
 ok((await call('/api/manage/rooms',{method:'POST',cookie:admin,origin:'https://evil.invalid',body:{}})).status===403,'cross-site admin mutation blocked');
 result=await call('/q/'+a.room.qrToken);ok(result.status===307&&result.cookie.includes('dhc_guest='),'room QR establishes guest session');const guest=result.cookie;
 result=await call(`/api/guest?roomId=${a.room.id}`,{cookie:guest});ok(result.status===200&&result.data.room.number==='901'&&result.data.hotel.name==='Test a','guest reads actual room and hotel data');
 ok((await call(`/api/guest?roomId=${b.room.id}`,{cookie:guest})).status===403,'cross-room tab access rejected');
 ok((await call('/api/requests',{method:'POST',body:{roomId:a.room.id,serviceId:a.service.id,quantity:1}})).status===401,'guest request without QR session rejected');
 ok((await call('/api/requests',{method:'POST',cookie:guest,body:{roomId:a.room.id,serviceId:b.service.id,quantity:1}})).status===400,'cross-hotel guest service rejected');
 ok((await call('/api/requests',{method:'POST',cookie:guest,body:{roomId:a.room.id,serviceId:a.service.id,quantity:0}})).status===400,'invalid quantity rejected');
 result=await call('/api/requests',{method:'POST',cookie:guest,body:{roomId:a.room.id,serviceId:a.service.id,quantity:2,note:'Integration request'}});ok(result.status===201&&result.data.id,'guest request persists');const id=result.data.id;
 ok((await db.serviceRequest.findUnique({where:{id}}))?.quantity===2,'stored request retains quantity');
 ok((await call('/api/requests/'+id,{method:'PATCH',body:{status:'ACCEPTED'}})).status===401,'anonymous request update blocked');
 ok((await call('/api/requests/'+id,{method:'PATCH',cookie:adminB,body:{status:'ACCEPTED'}})).status===404,'another hotel cannot update request');
 ok((await call('/api/requests/'+id,{method:'PATCH',cookie:admin,body:{status:'COMPLETED'}})).status===409,'skipped lifecycle state rejected');
 for(const status of ['ACCEPTED','IN_PROGRESS','COMPLETED'])ok((await call('/api/requests/'+id,{method:'PATCH',cookie:admin,body:{status}})).status===200,'request advances to '+status);
 ok((await call('/api/requests/'+id,{method:'PATCH',cookie:admin,body:{status:'NEW'}})).status===409,'completed request cannot reopen');
 result=await call('/api/requests?roomId='+a.room.id,{cookie:guest});ok(result.data[0].status==='COMPLETED','guest sees real completed status');
 ok((await call('/api/feedback',{method:'POST',cookie:guest,body:{requestId:id,rating:8}})).status===400,'rating outside 1–5 rejected');
 ok((await call('/api/feedback',{method:'POST',cookie:guest,body:{requestId:id,rating:5,comment:'Good service'}})).status===201,'guest feedback saved');
 ok((await call('/api/feedback',{method:'POST',cookie:guest,body:{requestId:id,rating:5}})).status===409,'duplicate feedback rejected');
 ok((await db.requestEvent.count({where:{requestId:id,changedBy:a.u.id}}))===3,'status changes record responsible staff');
 ok((await call('/api/manage/menu',{method:'POST',cookie:admin,body:{name:'Test menu',description:'Dish',price:125,active:true}})).status===200,'menu creation works');
 ok((await call('/api/manage/services',{method:'POST',cookie:admin,body:{id:a.service.id,name:'Updated towels',description:'Updated',price:0,estimatedMinutes:10,active:true}})).status===200,'service editing works');
 ok((await call('/api/manage/services',{method:'POST',cookie:adminB,body:{id:a.service.id,name:'Invalid cross-hotel edit',description:'',price:0,estimatedMinutes:10,active:true}})).status===404,'cross-hotel management blocked');
 ok((await call('/api/manage/settings',{method:'POST',cookie:admin,body:{name:'Updated hotel',address:'Test address',phone:'123',email:'',wifiName:'Test_WiFi',wifiPassword:'Test-wifi',breakfastTime:'7–10',checkinTime:'14:00',checkoutTime:'11:00',policies:'Quiet hours',facilities:'Wi-Fi'}})).status===200,'hotel settings save');
 result=await call(`/api/guest?roomId=${a.room.id}`,{cookie:guest});ok(result.data.hotel.info.wifiName==='Test_WiFi','guest sees saved Wi-Fi settings');
 result=await call('/api/qr/'+a.room.qrToken+'/image',{cookie:admin});ok(result.status===200&&result.headers.get('content-type')==='image/png','room QR PNG generated');
 ok((await call('/api/qr/'+a.room.qrToken+'/image',{cookie:adminB})).status===404,'other hotel cannot download QR');
 for(const page of ['rooms','services','menu','staff','settings','feedback','analytics','requests'])ok((await call('/admin/'+page,{cookie:admin})).status===200,'admin '+page+' page renders');
 const staffEmail='staff-'+suffix+'@example.com';ok((await call('/api/manage/staff',{method:'POST',cookie:admin,body:{name:'Test staff',email:staffEmail,password,role:'STAFF',status:'ACTIVE'}})).status===200,'staff creation works');
 const staff=(await call('/api/auth/login',{method:'POST',body:{email:staffEmail,password}})).cookie;
 ok((await call('/api/manage/menu',{method:'POST',cookie:staff,body:{name:'Forbidden',price:10,active:true}})).status===403,'staff cannot change management settings');
 ok((await call('/api/manage/rooms',{method:'POST',cookie:admin,body:{id:a.room.id,roomNumber:'901',roomName:'Test',status:'ACTIVE',qrStatus:'INACTIVE'}})).status===200,'QR deactivation saves');
 ok((await call('/q/'+a.room.qrToken)).status===403,'disabled printed QR blocked');
 ok((await call('/api/guest?roomId='+a.room.id,{cookie:guest})).status===403,'existing guest session blocked after QR deactivation');
 ok((await call('/api/auth/logout',{method:'POST',cookie:admin})).status===200,'logout succeeds');
 ok((await call('/api/dashboard',{cookie:admin})).status===401,'logged-out session cannot be reused');
 console.log(`INTEGRATION PASSED: ${passed} assertions`);
}finally{for(const id of hotels){await db.feedback.deleteMany({where:{hotelId:id}});await db.serviceRequest.deleteMany({where:{hotelId:id}});await db.hotel.delete({where:{id}})}await db.$disconnect()}

}
main().catch(e=>{console.error(e);process.exitCode=1});
