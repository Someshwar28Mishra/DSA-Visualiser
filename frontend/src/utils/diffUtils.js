/**
 * diffUtils.js — Utilities for computing what changed between two snapshots.
 */

/** Compare two arrays and return the operation (push/pop/swap/modify). */
export function diffArrays(prev, curr) {
  if (!Array.isArray(prev) || !Array.isArray(curr)) return null;

  if (curr.length > prev.length) {
    const added = curr.slice(prev.length);
    return { op: 'push', values: added };
  }
  if (curr.length < prev.length) {
    const removed = prev.slice(curr.length);
    return { op: 'pop', values: removed };
  }

  // Same length — find swapped/modified indices
  const changed = [];
  for (let i = 0; i < curr.length; i++) {
    if (JSON.stringify(curr[i]) !== JSON.stringify(prev[i])) {
      changed.push({ idx: i, from: prev[i], to: curr[i] });
    }
  }
  if (changed.length === 2) return { op: 'swap', changes: changed };
  if (changed.length > 0)   return { op: 'modify', changes: changed };
  return null;
}

/** Compare two dicts and return inserted/deleted/updated keys. */
export function diffMaps(prev, curr) {
  if (!prev || !curr) return { inserted: [], deleted: [], updated: [] };

  const inserted = Object.keys(curr).filter(k => !(k in prev));
  const deleted  = Object.keys(prev).filter(k => !(k in curr));
  const updated  = Object.keys(curr).filter(
    k => k in prev && JSON.stringify(prev[k]) !== JSON.stringify(curr[k])
  );
  return { inserted, deleted, updated };
}

/** Track movement of a pointer variable (integer index). */
export function diffPointer(prev, curr, name) {
  const pv = prev?.variables?.[name];
  const cv = curr?.variables?.[name];
  if (pv === undefined || cv === undefined || pv === cv) return null;
  return { name, from: pv, to: cv };
}

/** Get the primary list variable from a snapshot by preferred key. */
export function getListVar(vars, preferredKey) {
  if (preferredKey && Array.isArray(vars?.[preferredKey])) return [preferredKey, vars[preferredKey]];
  const entry = Object.entries(vars || {}).find(([, v]) => Array.isArray(v));
  return entry || [null, []];
}
