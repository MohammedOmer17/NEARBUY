import { Outlet } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import PhoneFrame from './PhoneFrame'

export default function AuthLayout() {
  return (
    <PhoneFrame className="flex flex-col bg-brand-900">
      <div className="bg-linear-to-b from-brand-900 to-brand-700 px-6 pb-14 pt-[calc(3.5rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><MapPin className="h-5 w-5" /></span>
          <span className="text-2xl font-extrabold tracking-tight">NearBuy</span>
        </div>
        <p className="mt-5 text-[26px] font-bold leading-8">Groceries from the shops around the corner.</p>
        <p className="mt-2 text-[15px] text-white/75">Order from kirana stores near you, for pickup or delivery.</p>
      </div>
      <main className="-mt-6 flex-1 rounded-t-3xl bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7">
        <Outlet />
      </main>
    </PhoneFrame>
  )
}
