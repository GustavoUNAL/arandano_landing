'use client'

/** Parsea YYYY-MM-DD como fecha local para que el día de la semana coincida. */
function parseSaleDateLocal(dateStr: string, hour?: number): Date {
  const s = dateStr.split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (hour !== undefined) date.setHours(hour, 0, 0, 0)
    return date
  }
  const date = new Date(dateStr)
  if (hour !== undefined) date.setHours(hour, 0, 0, 0)
  return date
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Sale {
  id: string
  date: string
  hour: number
  items: SaleItem[]
  total: number
  subtotal?: number
  discount?: number
  discountType?: 'percentage' | 'amount'
  discountValue?: number
  comment?: string
  channel: 'presencial' | 'whatsapp'
  paymentMethod?: 'efectivo' | 'nequi'
  ticketNumber?: string
}

interface DaySalesBlockProps {
  dayKey: string
  daySales: Sale[]
  isExpanded: boolean
  onToggleExpand: () => void
  onSelectSale: (sale: Sale) => void
  formatPrice: (price: number) => string
  getDayTotal: (sales: Sale[]) => number
  getDayByPayment: (sales: Sale[]) => { efectivo: number; nequi: number; sinPago: number }
  getSaleItemsSummary: (sale: Sale, maxItems?: number) => string
  getDayLabel: (dayKey: string) => string
  isEmpty?: boolean
}

export function DaySalesBlock({
  dayKey,
  daySales,
  isExpanded,
  onToggleExpand,
  onSelectSale,
  formatPrice,
  getDayTotal,
  getDayByPayment,
  getSaleItemsSummary,
  getDayLabel,
  isEmpty = false
}: DaySalesBlockProps) {
  const dayTotal = isEmpty ? 0 : getDayTotal(daySales)
  const dayLabel = getDayLabel(dayKey)
  const byPay = isEmpty ? { efectivo: 0, nequi: 0, sinPago: 0 } : getDayByPayment(daySales)

  return (
    <div className="border border-berry-200 rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-all mb-4">
      <button
        onClick={onToggleExpand}
        className="w-full bg-gradient-to-r from-berry-600 to-purple-600 px-4 py-3 border-b border-berry-300 text-left hover:from-berry-700 hover:to-purple-700 transition-all"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-white transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <div className="w-1 h-6 bg-white/30 rounded-full" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{dayLabel}</h4>
              <span className="text-[10px] text-white/90 font-medium bg-white/20 px-2 py-0.5 rounded-full">
                {isEmpty
                  ? 'Sin ventas'
                  : `${daySales.length} ${daySales.length === 1 ? 'venta' : 'ventas'}`}
              </span>
            </div>
          </div>
          <div className="bg-white/95 px-4 py-2 rounded-lg shadow-md border border-white/50">
            <span className="text-sm font-bold text-berry-700">
              ${formatPrice(dayTotal)}
            </span>
          </div>
        </div>
        {!isEmpty && (byPay.efectivo > 0 || byPay.nequi > 0 || byPay.sinPago > 0) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-white/20 text-[10px] text-white/90">
            {byPay.efectivo > 0 && <span>Efectivo: ${formatPrice(byPay.efectivo)}</span>}
            {byPay.nequi > 0 && <span>Nequi: ${formatPrice(byPay.nequi)}</span>}
            {byPay.sinPago > 0 && <span>Sin pago: ${formatPrice(byPay.sinPago)}</span>}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="divide-y divide-stone-100">
          {isEmpty ? (
            <div className="p-8 text-center text-stone-500">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm font-medium">No hay ventas registradas este día</p>
            </div>
          ) : (
            daySales
              .sort((a, b) => parseSaleDateLocal(b.date, b.hour).getTime() - parseSaleDateLocal(a.date, a.hour).getTime())
              .map((sale) => {
                const saleDate = parseSaleDateLocal(sale.date, sale.hour)
                return (
                  <div
                    key={sale.id}
                    className="p-4 hover:bg-berry-50/50 transition-all border-l-4 border-transparent hover:border-berry-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-1 px-2 py-1 bg-berry-100 rounded-lg border border-berry-200">
                            <span className="text-xs text-berry-600">🕐</span>
                            <span className="text-xs font-semibold text-berry-900">
                              {saleDate.toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {sale.paymentMethod && (
                            <span
                              className={`text-[10px] px-2 py-1 rounded-lg font-medium border ${
                                sale.paymentMethod === 'efectivo'
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              {sale.paymentMethod}
                            </span>
                          )}
                          {!sale.paymentMethod && (
                            <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                              Sin pago
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 mb-1.5 line-clamp-2">
                          {getSaleItemsSummary(sale)}
                        </p>
                        {sale.comment && (
                          <div className="text-[10px] text-stone-700 italic line-clamp-1 bg-berry-50 px-2.5 py-1 rounded-lg border-l-2 border-berry-400">
                            💬 {sale.comment}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={() => onSelectSale(sale)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-berry-700 hover:text-berry-800 bg-berry-100 hover:bg-berry-200 rounded-lg border border-berry-200 transition-colors"
                          title="Ver detalle y editar"
                        >
                          Ver detalle
                        </button>
                        <div className="bg-gradient-to-br from-berry-500 to-purple-500 px-3.5 py-2 rounded-lg border border-berry-300 shadow-sm">
                          <span className="text-sm font-bold text-white whitespace-nowrap">
                            ${formatPrice(sale.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      )}
    </div>
  )
}
