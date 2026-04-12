import test from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../src/utils/debounce.js';

test('debounce only invokes the latest call', async () => {
  const calls = [];
  const debounced = debounce((value) => calls.push(value), 20);

  debounced('first');
  debounced('second');
  debounced('final');

  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.deepEqual(calls, ['final']);
});
