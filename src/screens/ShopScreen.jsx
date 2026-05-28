import { useState } from 'react'
import { ITEMS } from '../data/items'
import { usePet } from '../hooks/usePet'

function CardLabel({ reason }) {
  if (reason === 'coming_soon') return <span className="text-xs text-gray-400 mt-1">Coming soon</span>
  if (reason === 'already_active') return <span className="text-xs text-gray-400 mt-1">Active</span>
  if (reason === 'already_owned') return <span className="text-xs text-gray-400 mt-1">Already have it</span>
  return null
}

function ItemCard({ item, purchaseState, onTap }) {
  const { canBuy, reason } = purchaseState
  const unavailable = !canBuy
  const costRed = reason === 'insufficient_coins'

  return (
    <button
      onClick={() => canBuy && onTap(item)}
      disabled={unavailable}
      className={`flex flex-col items-center justify-between p-4 rounded-2xl border-2 min-h-32 transition-transform active:scale-95
        ${unavailable ? 'bg-gray-100 border-gray-200' : 'bg-white border-yellow-300 shadow-sm'}`}
      aria-label={`${item.name}${unavailable ? ', unavailable' : ''}`}
    >
      <span className="text-4xl">{item.emoji}</span>
      <span className={`text-sm font-bold mt-1 ${unavailable ? 'text-gray-400' : 'text-gray-700'}`}>
        {item.name}
      </span>
      {reason === 'coming_soon' ? (
        <CardLabel reason={reason} />
      ) : reason === 'already_active' || reason === 'already_owned' ? (
        <CardLabel reason={reason} />
      ) : (
        <span className={`text-sm font-bold ${costRed ? 'text-red-400' : unavailable ? 'text-gray-400' : 'text-yellow-700'}`}>
          🪙 {item.cost}
        </span>
      )}
    </button>
  )
}

function ConfirmModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col items-center gap-4 shadow-xl">
        <span className="text-6xl">{item.emoji}</span>
        <p className="text-xl font-bold text-gray-800">{item.name}</p>
        <p className="text-2xl font-bold text-yellow-700">🪙 {item.cost} coins</p>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onCancel}
            className="flex-1 min-h-14 rounded-2xl border-2 border-gray-200 text-gray-500 text-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 min-h-14 rounded-2xl bg-yellow-400 text-yellow-900 text-lg font-bold active:scale-95"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShopScreen({ userId, onBack }) {
  const pet = usePet(userId)
  const [pending, setPending] = useState(null)
  const [flash, setFlash] = useState(null)

  function handleTap(item) {
    setPending(item)
  }

  function handleConfirm() {
    const result = pet.purchaseItem(pending.id)
    setPending(null)
    if (result.success) {
      setFlash('✓ Added to Jimmy\'s home!')
      setTimeout(() => setFlash(null), 2000)
    } else {
      setFlash(`Couldn't buy: ${result.reason}`)
      setTimeout(() => setFlash(null), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="min-h-16 min-w-16 flex items-center justify-center text-2xl rounded-2xl bg-white border-2 border-yellow-300 text-yellow-700"
          aria-label="Back"
        >
          ←
        </button>
        <p className="text-xl font-bold text-gray-700">Shop</p>
        <div className="text-lg font-bold text-yellow-800 bg-yellow-100 rounded-full px-3 py-1">
          🪙 {pet.stats.coins}
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div className="text-center text-sm font-bold text-green-700 bg-green-100 rounded-xl py-2 px-4">
          {flash}
        </div>
      )}

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            purchaseState={pet.canPurchase(item.id)}
            onTap={handleTap}
          />
        ))}
      </div>

      {/* Confirmation modal */}
      {pending && (
        <ConfirmModal
          item={pending}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
