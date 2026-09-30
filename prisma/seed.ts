import {PrismaClient} from '@prisma/client';
import {randomBytes} from 'node:crypto';
import {hashPassword} from '../lib/password';
const db=new PrismaClient();
async function main(){
 const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase(),password=process.env.ADMIN_PASSWORD||'';
 if(!email||password.length<12)throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env before seeding.');
 await db.$transaction(async tx=>{
  const h=await tx.hotel.upsert({where:{slug:'shivam-hotel'},update:{},create:{name:'Shivam Hotel',slug:'shivam-hotel',address:'Yusuf Sarai, New Delhi'}});
  const existing=await tx.user.findUnique({where:{email}});
  if(existing&&existing.hotelId!==h.id)throw Error('ADMIN_EMAIL already belongs to a different hotel.');
  if(!existing)await tx.user.create({data:{hotelId:h.id,name:'Hotel Admin',email,passwordHash:hashPassword(password),role:'HOTEL_ADMIN'}});
  else if(!existing.passwordHash.startsWith('scrypt:'))await tx.user.update({where:{id:existing.id},data:{passwordHash:hashPassword(password)}});
  await tx.hotelInfo.upsert({where:{hotelId:h.id},update:{},create:{hotelId:h.id,breakfastTime:'7:30 AM – 10:30 AM',checkinTime:'2:00 PM',checkoutTime:'11:00 AM',facilities:'Reception, Housekeeping'}});
  for(const roomNumber of ['101','102','103','104','105','201','202','203','204','205'])await tx.room.upsert({where:{hotelId_roomNumber:{hotelId:h.id,roomNumber}},update:{},create:{hotelId:h.id,roomNumber,roomName:'Guest room',qrToken:randomBytes(32).toString('hex')}});
  const oldRooms=await tx.room.findMany({where:{hotelId:h.id}});
  for(const room of oldRooms)if(/^shivam-\d+-demo-token$/.test(room.qrToken))await tx.room.update({where:{id:room.id},data:{qrToken:randomBytes(32).toString('hex')}});
  for(const [name,minutes] of [['Freshen Room',20],['Extra Towels',10],['Drinking Water',5],['Maintenance Request',30],['Room Service',25],['Wake-up Call',5]] as const){if(!await tx.service.findFirst({where:{hotelId:h.id,name}}))await tx.service.create({data:{hotelId:h.id,name,estimatedMinutes:minutes}})}
  for(const [name,price] of [['Masala Omelette',180],['Paneer Tikka',320],['Butter Chicken',420],['Dal Makhani',280],['Fresh Lime Soda',120]] as const){if(!await tx.menuItem.findFirst({where:{hotelId:h.id,name}}))await tx.menuItem.create({data:{hotelId:h.id,name,price}})}
 });console.log('Setup complete. Existing records preserved. Sign in using ADMIN_EMAIL and ADMIN_PASSWORD.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect());
