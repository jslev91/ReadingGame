const COSMETIC_SPRITES = {
  hat:   '/images/cosmetics/hat.png',
  scarf: '/images/cosmetics/scarf.png',
}

export function getCosmeticSprite(itemId) {
  return COSMETIC_SPRITES[itemId] ?? null
}
