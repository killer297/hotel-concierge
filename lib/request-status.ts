import type {RequestStatus} from '@prisma/client';
export const transitions:Record<RequestStatus,RequestStatus[]>={NEW:['ACCEPTED','CANCELLED'],ACCEPTED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
