'use client'

import { Suspense } from 'react'
import AdminSidebar from '@/components/AdminSidebar'

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
        <AdminSidebar />
      </Suspense>
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}

