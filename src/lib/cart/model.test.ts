import { test } from "node:test";
import assert from "node:assert/strict";
import { cartReducer, emptyCart, reviveCart, selectCheckoutBlocker, selectTotals } from "./model.ts";
import type { CartAction, CartState } from "./model.ts";

const range = { from: "2030-06-10", to: "2030-06-13" }; // 3 суток
const tent = { itemId: "tent", title: "Палатка", category: "tents", pricePerDay: 650, deposit: 5000, available: 4 };
const sup = { itemId: "sup", title: "Сап", category: "sup", pricePerDay: 1500, deposit: 15000, available: 1 };

const run = (actions: CartAction[], start: CartState = emptyCart) => actions.reduce(cartReducer, start);

test("итог считается из состояния и одинаков после любого порядка действий", () => {
  const a = run([
    { type: "add", range, item: tent },
    { type: "add", range, item: sup },
    { type: "setQty", itemId: "tent", qty: 2 },
    { type: "toggleService", service: "delivery", enabled: true },
  ]);
  const b = run([
    { type: "toggleService", service: "delivery", enabled: true },
    { type: "add", range, item: sup },
    { type: "add", range, item: tent },
    { type: "add", range, item: tent },
  ]);
  const ta = selectTotals(a);
  const tb = selectTotals(b);
  assert.equal(ta.rent, 650 * 2 * 3 + 1500 * 3);
  assert.equal(ta.deposit, 5000 * 2 + 15000);
  assert.equal(ta.services.delivery, 700);
  assert.equal(ta.total, ta.rent + 700 + ta.deposit);
  assert.equal(ta.total, tb.total);
});

test("количество ограничено остатком", () => {
  const s = run([
    { type: "add", range, item: sup },
    { type: "setQty", itemId: "sup", qty: 5 },
  ]);
  assert.equal(s.lines[0].qty, 1);
});

test("смена дат делает корзину устаревшей до пересчёта", () => {
  let s = run([{ type: "add", range, item: tent }]);
  s = cartReducer(s, { type: "setRange", range: { from: "2030-07-01", to: "2030-07-02" } });
  assert.equal(s.status, "stale");
  assert.equal(selectCheckoutBlocker(s), "stale");
  // Ответ на старые даты игнорируется.
  const ignored = cartReducer(s, { type: "recalculated", range, lines: [{ ...tent, available: 4 }] });
  assert.equal(ignored, s);
  s = cartReducer(s, {
    type: "recalculated",
    range: { from: "2030-07-01", to: "2030-07-02" },
    lines: [{ ...tent, pricePerDay: 700, available: 4 }],
  });
  assert.equal(s.status, "fresh");
  assert.equal(s.lines[0].pricePerDay, 700);
  assert.equal(selectCheckoutBlocker(s), null);
});

test("409: недоступные выделены, остальные сохранены, затем убираются", () => {
  let s = run([
    { type: "add", range, item: tent },
    { type: "add", range, item: sup },
    { type: "setQty", itemId: "tent", qty: 3 },
  ]);
  s = cartReducer(s, {
    type: "conflict",
    items: [
      { itemId: "sup", available: 0 },
      { itemId: "tent", available: 1 },
    ],
  });
  assert.deepEqual(s.conflicts, ["sup", "tent"]);
  assert.equal(s.lines.length, 2);
  assert.equal(selectCheckoutBlocker(s), "shortage");
  s = cartReducer(s, { type: "dropUnavailable" });
  assert.deepEqual(s.lines.map((l) => [l.itemId, l.qty]), [["tent", 1]]);
  assert.equal(s.status, "stale");
});

test("испорченное хранилище превращается в пустую корзину", () => {
  assert.deepEqual(reviveCart("мусор"), emptyCart);
  assert.deepEqual(reviveCart({ lines: [{ itemId: 1 }] }).lines, []);
});
