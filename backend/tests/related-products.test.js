import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankRelated } from '../controllers/productController.js';

const product = (overrides) => ({
  _id: overrides.id,
  name: overrides.name || 'Item',
  category: overrides.category || 'Electronics',
  sub_category: overrides.sub_category || '',
  tags: overrides.tags || [],
  average_rating: overrides.average_rating || 0,
  is_active: true,
});

const source = {
  _id: 'source',
  category: 'Electronics',
  sub_category: 'Audio',
  tags: ['wireless', 'bluetooth'],
};

test('related: the product being viewed is never suggested to itself', () => {
  const results = rankRelated([product({ id: 'source' }), product({ id: 'other' })], source, 6);
  assert.deepEqual(results.map((p) => p.id), ['other']);
});

test('related: a same-category product outranks a tag-only match', () => {
  const results = rankRelated(
    [
      product({ id: 'tag-only', category: 'Fashion', tags: ['wireless'], average_rating: 5 }),
      product({ id: 'same-category', category: 'Electronics', average_rating: 1 }),
    ],
    source,
    6,
  );
  assert.deepEqual(results.map((p) => p.id), ['same-category', 'tag-only']);
});

test('related: more shared tags outranks a higher rating', () => {
  const results = rankRelated(
    [
      product({ id: 'one-tag', category: 'Fashion', tags: ['wireless'], average_rating: 5 }),
      product({ id: 'two-tags', category: 'Fashion', tags: ['wireless', 'bluetooth'], average_rating: 1 }),
    ],
    source,
    6,
  );
  assert.deepEqual(results.map((p) => p.id), ['two-tags', 'one-tag']);
});

test('related: unrelated products are not suggested', () => {
  const results = rankRelated(
    [product({ id: 'unrelated', category: 'Fashion', tags: ['clothing'] })],
    source,
    6,
  );
  assert.deepEqual(results, []);
});

test('related: the result set respects the requested limit', () => {
  const candidates = Array.from({ length: 10 }, (_, i) => product({ id: `p${i}`, category: 'Electronics' }));
  assert.equal(rankRelated(candidates, source, 4).length, 4);
});

test('related: each suggestion carries the id shape the frontend expects', () => {
  const [first] = rankRelated([product({ id: 'abc123', name: 'Speaker' })], source, 6);
  assert.equal(first.id, 'abc123');
  assert.equal(first.name, 'Speaker');
});