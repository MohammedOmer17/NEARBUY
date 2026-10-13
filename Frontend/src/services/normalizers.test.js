import assert from 'node:assert/strict'
import test from 'node:test'
import { groupProductsByIdentity, normalizeProduct } from './normalizers.js'

test('groups same branded product offers while preserving shop IDs and prices', () => {
  const base = { name: 'Bath Soap', brand: 'Fresh Day', category: 'Personal Care', unit: 'piece' }
  const groups = groupProductsByIdentity([
    { ...base, id: 'meera-soap', shopId: 'meera', shopName: 'Meera', price: 38 },
    { ...base, id: 'asha-soap', shopId: 'asha', shopName: 'Asha', price: 35 },
    { ...base, id: 'ravi-soap', shopId: 'ravi', shopName: 'Ravi', price: 40 },
  ])

  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].offers.map(({ id, shopId, price }) => [id, shopId, price]), [
    ['asha-soap', 'asha', 35],
    ['meera-soap', 'meera', 38],
    ['ravi-soap', 'ravi', 40],
  ])
})

test('keeps different brands and pack sizes separate', () => {
  const base = { name: 'Bath Soap', brand: 'Fresh Day', category: 'Personal Care', unit: 'piece', packSize: '1 piece' }
  const groups = groupProductsByIdentity([
    { ...base, id: 'regular' },
    { ...base, id: 'other-size', packSize: '3 pieces' },
    { ...base, id: 'other-brand', brand: 'Clean Day' },
  ])

  assert.equal(groups.length, 3)
  assert.ok(groups.every((group) => group.offers.length === 1))
})

test('does not merge records when identity is too weak and normalizes shop offer details', () => {
  const groups = groupProductsByIdentity([
    { id: 'unbranded-a', name: 'Bath Soap', unit: 'piece' },
    { id: 'unbranded-b', name: 'Bath Soap', unit: 'piece' },
  ])
  const offer = normalizeProduct({
    _id: 'shop-product',
    name: 'Bath Soap',
    brand: 'Fresh Day',
    unit: 'piece',
    price: 35,
    isAvailable: true,
    shop: { _id: 'shop-1', shopName: "Asha's Fresh Mart" },
  })

  assert.equal(groups.length, 2)
  assert.equal(offer.id, 'shop-product')
  assert.equal(offer.shopId, 'shop-1')
  assert.equal(offer.shopName, "Asha's Fresh Mart")
  assert.equal(offer.price, 35)
})
