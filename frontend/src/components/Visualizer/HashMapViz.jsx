/**
 * HashMapViz.jsx — Visual hash map with insert/delete/update change arrows.
 */
import { diffMaps } from '../../utils/diffUtils';

const MAX_DISPLAY = 16;

function formatVal(v) {
  if (Array.isArray(v)) return `[${v.join(', ')}]`;
  return String(v);
}

function hashColor(key) {
  let h = 0;
  for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const hue = (h % 360 + 360) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export default function HashMapViz({ snapshot, prevSnapshot }) {
  if (!snapshot) return null;
  const vars = snapshot.variables || {};
  const prevVars = prevSnapshot?.variables || {};

  const mapEntry =
    Object.entries(vars).find(([k, v]) => ['hashmap','freq','table'].includes(k) && typeof v === 'object' && !Array.isArray(v)) ||
    Object.entries(vars).find(([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v));

  const map     = mapEntry ? mapEntry[1] : {};
  const mapName = mapEntry ? mapEntry[0] : 'map';
  const prevMap = (prevVars[mapName] && typeof prevVars[mapName] === 'object' && !Array.isArray(prevVars[mapName]))
    ? prevVars[mapName] : {};

  const { inserted, deleted, updated } = diffMaps(prevMap, map);

  const entries = Object.entries(map).slice(0, MAX_DISPLAY);
  const sideVars = Object.entries(vars).filter(([k, v]) => k !== mapName && typeof v !== 'object');

  // Change summary banner
  const changes = [];
  if (inserted.length) changes.push({ type: 'insert', label: `+ INSERTED: ${inserted.map(k => `${k}→${formatVal(map[k])}`).join(', ')}`, color: '#00f5a0' });
  if (deleted.length)  changes.push({ type: 'delete', label: `− DELETED: ${deleted.join(', ')}`, color: '#ff4757' });
  if (updated.length)  changes.push({ type: 'update', label: `✎ UPDATED: ${updated.map(k => `${k}: ${formatVal(prevMap[k])}→${formatVal(map[k])}`).join(', ')}`, color: '#ff9f43' });

  return (
    <div className="ds-viz-container">
      <div className="hashmap-scene">
        {/* Change banners */}
        {changes.map((c, i) => (
          <div key={i} className="change-annotation" style={{ color: c.color, borderColor: `${c.color}44`, background: `${c.color}15` }}>
            <span className="change-annotation-arrow">{c.type === 'insert' ? '→' : c.type === 'delete' ? '✕' : '✎'}</span>
            <span className="change-annotation-label">{c.label}</span>
          </div>
        ))}

        <div className="hashmap-title">{mapName} — {Object.keys(map).length} entries</div>

        {entries.length === 0 && <div className="hashmap-empty">Empty HashMap</div>}

        <div className="hashmap-grid">
          {entries.map(([key, val], idx) => {
            const color = hashColor(key);
            const isInserted = inserted.includes(key);
            const isUpdated  = updated.includes(key);

            return (
              <div
                key={idx}
                className={`hashmap-bucket ${isInserted ? 'hashmap-bucket--inserted' : ''} ${isUpdated ? 'hashmap-bucket--updated' : ''}`}
                style={{ '--bucket-color': color }}
              >
                <div className="hashmap-bucket-idx">{idx}</div>

                {/* Change arrow indicator */}
                {isInserted && <span className="hashmap-change-badge" style={{ background: '#00f5a022', color: '#00f5a0', border: '1px solid #00f5a044' }}>↑ NEW</span>}
                {isUpdated  && <span className="hashmap-change-badge" style={{ background: '#ff9f4322', color: '#ff9f43', border: '1px solid #ff9f4344' }}>✎ UPD</span>}

                <div className="hashmap-kv">
                  <span className="hashmap-key">{String(key)}</span>
                  <span className="hashmap-arrow">→</span>
                  <span className="hashmap-val">
                    {isUpdated && <span style={{ color: '#5a5f7a', textDecoration: 'line-through', marginRight: 4, fontSize: '0.75rem' }}>{formatVal(prevMap[key])}</span>}
                    {formatVal(val)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Ghost deleted entries */}
          {deleted.map((key, i) => (
            <div key={`del-${i}`} className="hashmap-bucket hashmap-bucket--deleted" style={{ '--bucket-color': '#ff4757' }}>
              <div className="hashmap-bucket-idx">✕</div>
              <span className="hashmap-change-badge" style={{ background: '#ff475722', color: '#ff4757', border: '1px solid #ff475744' }}>DELETED</span>
              <div className="hashmap-kv">
                <span className="hashmap-key" style={{ textDecoration: 'line-through', color: '#ff4757' }}>{String(key)}</span>
                <span className="hashmap-arrow">→</span>
                <span className="hashmap-val" style={{ textDecoration: 'line-through', color: '#5a5f7a' }}>{formatVal(prevMap[key])}</span>
              </div>
            </div>
          ))}

          {Object.keys(map).length > MAX_DISPLAY && (
            <div className="hashmap-overflow">+{Object.keys(map).length - MAX_DISPLAY} more…</div>
          )}
        </div>
      </div>

      {sideVars.length > 0 && (
        <div className="ds-side-panel">
          <div className="ds-side-title">Variables</div>
          {sideVars.map(([k, v]) => {
            const changed = prevVars[k] !== undefined && prevVars[k] !== v;
            return (
              <div key={k} className="ds-var-row">
                <span className="ds-var-name">{k}</span>
                <span className="ds-var-eq">=</span>
                <span className="ds-var-val" style={changed ? { color: '#ff9f43' } : {}}>
                  {changed && <span style={{ marginRight: 4, fontSize: '0.65rem' }}>({String(prevVars[k])}→)</span>}
                  {String(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
