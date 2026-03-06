'use client'

interface InventoryContentProps {
  alert?: { type: 'success' | 'error'; message: string } | null
  setAlert?: (a: { type: 'success' | 'error'; message: string } | null) => void
  byCategory?: Array<{ category: string; label: string; count: number; value: number }>
  searchTerm?: string
  setSearchTerm?: (v: string) => void
  showAddModal?: boolean
  setShowAddModal?: (v: boolean) => void
  showConfigModal?: boolean
  setShowConfigModal?: (v: boolean) => void
  groupedByLot?: Array<{ lot: string; items: unknown[]; totalValue: number }>
  uniqueLots?: Array<{ lot: string; formattedDate?: string }>
  uniqueDates?: string[]
  uniqueProducts?: Array<{ name: string; unit: string; category: string }>
  filterLot?: string
  setFilterLot?: (v: string) => void
  filterDate?: string
  setFilterDate?: (v: string) => void
  filterProduct?: string
  setFilterProduct?: (v: string) => void
  filterProductType?: string[]
  setFilterProductType?: (v: string[]) => void
  productTypeOptions?: Array<{ value: string; label: string }>
  filteredItems?: unknown[]
  itemsWithLots?: number
  operationalItems?: unknown[]
  totalValue?: number
  totalAssetsValue?: number
  totalRegulatedValue?: number
  [key: string]: unknown
}

export default function InventoryContent(props: InventoryContentProps = {}) {
  const {
    alert,
    setAlert,
    byCategory = [],
    searchTerm = '',
    setSearchTerm = () => {},
    showAddModal,
    setShowAddModal = () => {},
    setShowConfigModal = () => {},
    groupedByLot = [],
    uniqueLots = [],
    uniqueDates = [],
    uniqueProducts = [],
    filterLot = '',
    setFilterLot = () => {},
    filterDate = '',
    setFilterDate = () => {},
    filterProduct = '',
    setFilterProduct = () => {},
    filterProductType = [],
    setFilterProductType = () => {},
    productTypeOptions = [],
    filteredItems = [],
    itemsWithLots = 0,
    operationalItems = [],
    totalValue = 0,
    totalAssetsValue = 0,
    totalRegulatedValue = 0
  } = props

  return (
    <div className="py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-xl flex items-center gap-3 ${
              alert.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <span className="text-xl font-bold">{alert.type === 'success' ? '✓' : '✕'}</span>
            <span className="font-medium text-sm sm:text-base">{alert.message}</span>
            {setAlert && (
              <button onClick={() => setAlert(null)} className="ml-4 text-white hover:text-stone-200" aria-label="Cerrar">
                ✕
              </button>
            )}
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <a href="/admin" className="px-2 py-1.5 text-arandano-600 hover:text-arandano-800 text-base font-medium">
              ←
            </a>
            <h1 className="flex-1 text-center text-xl sm:text-2xl font-bold text-arandano-950">Inventario Interno</h1>
            <div className="w-8" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-1 focus:ring-arandano-500"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-arandano-600 hover:bg-arandano-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Agregar</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-arandano-600 hover:text-arandano-700 hover:bg-arandano-50 rounded-lg"
              title="Configuraciones"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-arandano-50 rounded-lg border border-arandano-200">
              <span className="text-xs font-semibold text-arandano-700">Lote</span>
              <select
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                className="flex-1 text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 min-w-0"
              >
                <option value="">Todos</option>
                {uniqueLots.map((l) => (
                  <option key={l.lot} value={l.lot}>{l.lot}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-arandano-50 rounded-lg border border-arandano-200">
              <span className="text-xs font-semibold text-arandano-700">Fecha</span>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="flex-1 text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 min-w-0"
              >
                <option value="">Todas</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-arandano-50 rounded-lg border border-arandano-200">
              <span className="text-xs font-semibold text-arandano-700">Producto</span>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="flex-1 text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 min-w-0"
              >
                <option value="">Todos</option>
                {uniqueProducts.map((p) => {
                  const key = `${p.name.toLowerCase().trim()}_${p.unit.toLowerCase().trim()}`
                  return (
                    <option key={key} value={key}>
                      {p.name} ({p.unit})
                    </option>
                  )
                })}
              </select>
            </div>

            <details className="bg-arandano-50 rounded-lg border border-arandano-200 px-3 py-2">
              <summary className="cursor-pointer text-xs font-semibold text-arandano-700 select-none">
                Tipo {filterProductType.length > 0 ? `(${filterProductType.length})` : ''}
              </summary>
              <div className="pt-2 space-y-1.5">
                {productTypeOptions.map((opt) => {
                  const checked = filterProductType.includes(opt.value)
                  return (
                    <label key={opt.value} className="flex items-center gap-2 text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setFilterProductType([...filterProductType, opt.value])
                          else setFilterProductType(filterProductType.filter((x) => x !== opt.value))
                        }}
                        className="accent-[rgb(47,77,107)]"
                      />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  )
                })}
                {filterProductType.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterProductType([])}
                    className="mt-1 w-full px-2 py-1.5 text-xs font-semibold text-arandano-700 hover:text-arandano-800 hover:bg-arandano-100 rounded-lg transition-colors"
                  >
                    Limpiar tipos
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>

        <div className="bg-gradient-to-br from-arandano-50 to-arandano-100 border-2 border-arandano-200 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <span className="bg-arandano-600 text-white rounded px-1.5 py-0.5 font-bold">{groupedByLot.length}</span>
              <span className="text-stone-600">lotes</span>
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-700 font-medium">{filteredItems.length} ítems</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-600">{itemsWithLots} con lote</span>
          </div>
          <div className="pt-2 border-t border-arandano-200 mt-2">
            <span className="text-arandano-700 font-bold">${totalValue.toLocaleString('es-CO')}</span>
            <span className="text-stone-600 text-xs ml-1">valor operativo</span>
          </div>
        </div>
        {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-arandano-950">Lista de inventario</h2>
              <span className="text-xs sm:text-sm text-stone-500">
                Mostrando {filteredItems.length} ítem{filteredItems.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Nombre</th>
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Categoría</th>
                    <th className="px-2 py-2 text-right font-semibold text-stone-700">Cantidad</th>
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Unidad</th>
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Lote</th>
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Proveedor</th>
                    <th className="px-2 py-2 text-left font-semibold text-stone-700">Fecha compra</th>
                    <th className="px-2 py-2 text-right font-semibold text-stone-700">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredItems as any[]).map((item, idx) => (
                    <tr key={item.id ?? idx} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-2 py-1.5 font-medium text-stone-800 max-w-[160px] truncate" title={item.name}>
                        {item.name}
                      </td>
                      <td className="px-2 py-1.5 text-stone-600">{item.category}</td>
                      <td className="px-2 py-1.5 text-right text-stone-800">
                        {item.quantity?.toLocaleString?.('es-CO') ?? item.quantity ?? '-'}
                      </td>
                      <td className="px-2 py-1.5 text-stone-600">{item.unit}</td>
                      <td className="px-2 py-1.5 text-stone-600 max-w-[120px] truncate" title={item.lot}>
                        {item.lot || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-stone-600 max-w-[140px] truncate" title={item.supplier}>
                        {item.supplier || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-stone-600">
                        {item.purchaseDate
                          ? String(item.purchaseDate).split('T')[0]
                          : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-arandano-700">
                        {typeof item.totalValue === 'number'
                          ? `$${item.totalValue.toLocaleString('es-CO')}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-4 text-center text-stone-600">
            <p className="text-sm">
              No hay ítems de inventario para los filtros actuales.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
