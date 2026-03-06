'use client'

import AdminSidebar from '@/components/AdminSidebar'

export function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 py-4 sm:py-8 px-4">
        {children}
      </main>
    </div>
  )
}
