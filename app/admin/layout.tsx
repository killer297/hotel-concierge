import AdminShell from '@/components/AdminShell';import {getAdminHotel} from '@/lib/auth';import AutoRefresh from '@/components/AutoRefresh';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){await getAdminHotel();return <AdminShell><AutoRefresh/>{children}</AdminShell>}
