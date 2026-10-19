import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogHref, clampPage, parseCatalogQuery } from "./catalog.ts";
import { validateRange } from "./dates.ts";

const today = "2030-06-01";

test("корректная ссылка восстанавливается без замечаний и сериализуется обратно", () => {
  const href =
    "/catalog?from=2030-06-10&to=2030-06-12&category=sup&priceMin=500&priceMax=2000&available=1&sort=price_asc&page=2";
  const raw = Object.fromEntries(new URL(href, "http://x").searchParams);
  const { query, notices } = parseCatalogQuery(raw, today);
  assert.deepEqual(notices, []);
  assert.equal(catalogHref(query), href);
});

test("некорректные дата и страница заменяются безопасными значениями с объяснением", () => {
  const { query, notices } = parseCatalogQuery({ from: "2030-02-31", to: "2030-06-12", page: "-3" }, today);
  assert.deepEqual(query.range, { from: "2030-06-02", to: "2030-06-04" });
  assert.equal(query.page, 1);
  assert.deepEqual(notices.map((n) => n.param).sort(), ["dates", "page"]);
});

test("страница за пределами выдачи заменяется последней", () => {
  const { query } = parseCatalogQuery({ page: "40" }, today);
  const clamped = clampPage(query, 4);
  assert.equal(clamped.query.page, 4);
  assert.ok(clamped.notice);
});

test("перепутанные границы цены меняются местами", () => {
  const { query, notices } = parseCatalogQuery({ priceMin: "3000", priceMax: "100" }, today);
  assert.equal(query.priceMin, 100);
  assert.equal(query.priceMax, 3000);
  assert.equal(notices.length, 1);
});

test("диапазон дат: прошлое, порядок, длительность", () => {
  assert.equal(validateRange("2030-05-30", "2030-06-02", today).ok, false);
  assert.equal(validateRange("2030-06-05", "2030-06-05", today).ok, false);
  assert.equal(validateRange("2030-06-05", "2030-07-05", today).ok, false);
  assert.equal(validateRange("2030-06-05", "2030-06-06", today).ok, true);
});
