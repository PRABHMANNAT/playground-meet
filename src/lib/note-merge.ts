// A single edit to a textarea replaces one contiguous range of its previous value.
function change(base: string, value: string) {
  let start = 0;
  while (start < base.length && start < value.length && base[start] === value[start]) start++;
  let end = base.length,
    tail = value.length;
  while (end > start && tail > start && base[end - 1] === value[tail - 1]) {
    end--;
    tail--;
  }
  return { start, end, text: value.slice(start, tail) };
}

export function mergeNote(base: string, mine: string, latest: string) {
  if (latest === base || latest === mine) return mine;
  if (mine === base) return latest;
  const edits = [change(base, mine), change(base, latest)].sort((a, b) => a.start - b.start);
  const [first, second] = edits;
  if (first.end > second.start || first.start === second.start) return null;
  const result =
    base.slice(0, first.start) +
    first.text +
    base.slice(first.end, second.start) +
    second.text +
    base.slice(second.end);
  return result.length <= 20000 ? result : null;
}
