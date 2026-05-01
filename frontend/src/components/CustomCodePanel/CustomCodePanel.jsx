/**
 * CustomCodePanel.jsx
 * Python-only sandbox — write Python code and visualize it step-by-step.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Sparkles, RotateCcw, ChevronDown, Layers } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const DS_TYPES = [
  { value: 'auto',        label: '🤖 Auto Detect' },
  { value: 'array',       label: '📊 Array / List' },
  { value: 'matrix',      label: '🔢 Matrix / 2D DP' },
  { value: 'graph',       label: '🕸 Graph' },
  { value: 'tree',        label: '🌳 Tree' },
  { value: 'stack',       label: '📚 Stack' },
  { value: 'queue',       label: '🚶 Queue' },
  { value: 'deque',       label: '↔ Deque' },
  { value: 'linked_list', label: '🔗 Linked List' },
  { value: 'hashmap',     label: '🗂 HashMap / Dict' },
];

// ─── Python-only starter code per DS type ─────────────────────────────────
const DEFAULT_CODE = {
  python: {
    default: `# Python — Bubble Sort
arr = [5, 3, 8, 1, 9, 2, 7, 4, 6]

for i in range(len(arr)):
    for j in range(0, len(arr) - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
`,
    graph: `# Python — BFS
graph = {0:[1,2], 1:[0,3,4], 2:[0,5], 3:[1], 4:[1,5], 5:[2,4]}
visited = set()
queue = [0]
visited.add(0)
while queue:
    node = queue.pop(0)
    for nb in graph[node]:
        if nb not in visited:
            visited.add(nb)
            queue.append(nb)
`,
    stack: `# Python — Stack
stack = []
for val in [10, 20, 30, 40, 50]:
    stack.append(val)
while stack:
    top = stack.pop()
`,
    queue: `# Python — Queue
queue = []
for val in [1, 2, 3, 4, 5]:
    queue.append(val)
while queue:
    front = queue.pop(0)
`,
    hashmap: `# Python — HashMap
freq = {}
nums = [1, 2, 3, 2, 1, 3, 3, 4]
for num in nums:
    if num in freq:
        freq[num] = freq[num] + 1
    else:
        freq[num] = 1
`,
  },
  java: {
    default:
`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        // Java — Bubble Sort
        int[] arr = {5, 3, 8, 1, 9, 2, 7, 4, 6};
        int n = arr.length;

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
}
`,
    graph:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Java — BFS
        Map<Integer, List<Integer>> graph = new HashMap<>();
        graph.put(0, Arrays.asList(1, 2));
        graph.put(1, Arrays.asList(0, 3, 4));
        graph.put(2, Arrays.asList(0, 5));
        graph.put(3, Arrays.asList(1));
        graph.put(4, Arrays.asList(1, 5));
        graph.put(5, Arrays.asList(2, 4));

        Set<Integer> visited = new HashSet<>();
        Queue<Integer> bfsQueue = new LinkedList<>();
        bfsQueue.add(0);
        visited.add(0);

        while (!bfsQueue.isEmpty()) {
            int node = bfsQueue.poll();
            System.out.println("Visiting node: " + node);
            for (int nb : graph.get(node)) {
                if (!visited.contains(nb)) {
                    visited.add(nb);
                    bfsQueue.add(nb);
                }
            }
        }
    }
}
`,
    stack:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Java — Stack
        Stack<Integer> stack = new Stack<>();
        int[] vals = {10, 20, 30, 40, 50};
        for (int val : vals) {
            stack.push(val);
        }
        while (!stack.isEmpty()) {
            int top = stack.pop();
        }
    }
}
`,
    queue:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Java — Queue (FIFO)
        Queue<Integer> queue = new LinkedList<>();
        int[] vals = {1, 2, 3, 4, 5};
        for (int val : vals) {
            queue.offer(val);
        }
        while (!queue.isEmpty()) {
            int front = queue.poll();
            System.out.println("Dequeued: " + front);
        }
    }
}
`,
    hashmap:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Java — HashMap frequency counter
        Map<Integer, Integer> freq = new HashMap<>();
        int[] nums = {1, 2, 3, 2, 1, 3, 3, 4};
        for (int num : nums) {
            if (freq.containsKey(num)) {
                freq.put(num, freq.get(num) + 1);
            } else {
                freq.put(num, 1);
            }
        }
        System.out.println("Frequencies: " + freq);
    }
}
`,
  },
  cpp: {
    default:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // C++ — Bubble Sort
    vector<int> arr = {5, 3, 8, 1, 9, 2, 7, 4, 6};
    int n = arr.size();

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
    return 0;
}
`,
    graph:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // C++ — BFS
    unordered_map<int, vector<int>> graph;
    graph[0] = {1, 2};
    graph[1] = {0, 3, 4};
    graph[2] = {0, 5};
    graph[3] = {1};
    graph[4] = {1, 5};
    graph[5] = {2, 4};

    unordered_set<int> visited;
    queue<int> q;
    q.push(0);
    visited.insert(0);

    while (!q.empty()) {
        int node = q.front(); q.pop();
        cout << "Visiting: " << node << endl;
        for (int nb : graph[node]) {
            if (!visited.count(nb)) {
                visited.insert(nb);
                q.push(nb);
            }
        }
    }
    return 0;
}
`,
    stack:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // C++ — Stack
    stack<int> st;
    vector<int> vals = {10, 20, 30, 40, 50};
    for (int val : vals) {
        st.push(val);
    }
    while (!st.empty()) {
        int top = st.top();
        st.pop();
    }
    return 0;
}
`,
    queue:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // C++ — Queue (FIFO)
    queue<int> q;
    vector<int> vals = {1, 2, 3, 4, 5};
    for (int val : vals) {
        q.push(val);
    }
    while (!q.empty()) {
        int front = q.front();
        cout << "Dequeued: " << front << endl;
        q.pop();
    }
    return 0;
}
`,
    hashmap:
`#include <bits/stdc++.h>
using namespace std;

int main() {
    // C++ — HashMap (unordered_map)
    unordered_map<int, int> freq;
    vector<int> nums = {1, 2, 3, 2, 1, 3, 3, 4};
    for (int num : nums) {
        freq[num] = freq[num] + 1;
    }
    return 0;
}
`,
  },
  javascript: {
    default:
`// JavaScript — Bubble Sort
(function main() {
    let arr = [5, 3, 8, 1, 9, 2, 7, 4, 6];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    console.log('Sorted:', arr);
})();
`,
    graph:
`// JavaScript — BFS
(function main() {
    const graph = {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 5],
        3: [1],
        4: [1, 5],
        5: [2, 4],
    };
    const visited = new Set([0]);
    const queue = [0];

    while (queue.length > 0) {
        const node = queue.shift();
        console.log('Visiting:', node);
        for (const nb of graph[node]) {
            if (!visited.has(nb)) {
                visited.add(nb);
                queue.push(nb);
            }
        }
    }
})();
`,
    stack:
`// JavaScript — Stack
(function main() {
    let stack = [];
    for (const val of [10, 20, 30, 40, 50]) {
        stack.push(val);
    }
    while (stack.length > 0) {
        const top = stack.pop();
    }
})();
`,
    queue:
`// JavaScript — Queue (FIFO)
(function main() {
    let queue = [];
    for (const val of [1, 2, 3, 4, 5]) {
        queue.push(val);
    }
    while (queue.length > 0) {
        const front = queue.shift();
        console.log('Dequeued:', front);
    }
})();
`,
    hashmap:
`// JavaScript — HashMap (object)
(function main() {
    const freq = {};
    const nums = [1, 2, 3, 2, 1, 3, 3, 4];
    for (const num of nums) {
        if (freq[num] !== undefined) {
            freq[num] = freq[num] + 1;
        } else {
            freq[num] = 1;
        }
    }
    console.log('Frequencies:', JSON.stringify(freq));
})();
`,
  },
  csharp: {
    default:
`using System;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        // C# — Bubble Sort
        int[] arr = {5, 3, 8, 1, 9, 2, 7, 4, 6};
        int n = arr.Length;

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        Console.WriteLine("Done!");
    }
}
`,
    graph:
`using System;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        // C# — BFS
        Dictionary<int, List<int>> graph = new Dictionary<int, List<int>>();
        graph[0] = new List<int> {1, 2};
        graph[1] = new List<int> {0, 3, 4};
        graph[2] = new List<int> {0, 5};
        graph[3] = new List<int> {1};
        graph[4] = new List<int> {1, 5};
        graph[5] = new List<int> {2, 4};

        HashSet<int> visited = new HashSet<int> {0};
        Queue<int> bfsQueue = new Queue<int>();
        bfsQueue.Enqueue(0);

        while (bfsQueue.Count > 0) {
            int node = bfsQueue.Dequeue();
            Console.WriteLine("Visiting: " + node);
            foreach (int nb in graph[node]) {
                if (!visited.Contains(nb)) {
                    visited.Add(nb);
                    bfsQueue.Enqueue(nb);
                }
            }
        }
    }
}
`,
    stack:
`using System;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        // C# — Stack
        Stack<int> stack = new Stack<int>();
        int[] vals = {10, 20, 30, 40, 50};
        foreach (int val in vals) {
            stack.Push(val);
        }
        while (stack.Count > 0) {
            int top = stack.Pop();
        }
    }
}
`,
    queue:
`using System;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        // C# — Queue (FIFO)
        Queue<int> queue = new Queue<int>();
        int[] vals = {1, 2, 3, 4, 5};
        foreach (int val in vals) {
            queue.Enqueue(val);
        }
        while (queue.Count > 0) {
            int front = queue.Dequeue();
            Console.WriteLine("Dequeued: " + front);
        }
    }
}
`,
    hashmap:
`using System;
using System.Collections.Generic;

class Program {
    static void Main(string[] args) {
        // C# — Dictionary frequency counter
        Dictionary<int, int> freq = new Dictionary<int, int>();
        int[] nums = {1, 2, 3, 2, 1, 3, 3, 4};
        foreach (int num in nums) {
            if (freq.ContainsKey(num)) {
                freq[num] = freq[num] + 1;
            } else {
                freq[num] = 1;
            }
        }
        Console.WriteLine("Done!");
    }
}
`,
  },
};

function getStarterCode(dsType) {
  const codes = DEFAULT_CODE.python;
  return codes[dsType] || codes['default'] || '# Write your code here\n';
}

export default function CustomCodePanel({
  onRun,
  onReset,
  loading,
  snapshots,
  currentStep,
  isPlaying,
  onMount,
  currentSnapshot,
  transpileInfo,   // { warnings, python } from last run
  // Live-sync callbacks so the header Run & Test button always has current state
  onCodeChange,
  onLangChange,
  onDsHintChange,
  children,
}) {
  const lang = 'python'; // Python-only sandbox
  const [dsHint, setDsHint]             = useState('auto');
  const [code, setCode]                 = useState(getStarterCode('default'));
  const [templates, setTemplates]       = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editorRef, setEditorRef]       = useState(null);
  const [highlightLine, setHighlightLine] = useState(null);
  const templateRef = useRef(null);

  // Load templates
  useEffect(() => {
    axios.get(`${API_BASE}/api/templates`)
      .then(r => setTemplates(r.data.templates || []))
      .catch(() => {});
  }, []);

  // Highlight current line (all languages, since all can run now)
  useEffect(() => {
    if (!editorRef || !currentSnapshot) return;
    const lineNo = currentSnapshot.line;
    setHighlightLine(lineNo);
    editorRef.revealLineInCenter(lineNo);
  }, [currentSnapshot, editorRef]);

  useEffect(() => {
    if (!editorRef || !highlightLine) return;
    const monaco = window.monaco;
    if (!monaco) return;
    const decs = editorRef.createDecorationsCollection([{
      range: new monaco.Range(highlightLine, 1, highlightLine, 1),
      options: {
        isWholeLine: true,
        className: 'active-line-highlight',
        glyphMarginClassName: 'active-line-glyph',
      },
    }]);
    return () => decs.clear();
  }, [highlightLine, editorRef]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (templateRef.current && !templateRef.current.contains(e.target)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMount = useCallback((editor, monaco) => {
    setEditorRef(editor);
    if (onMount) onMount(editor, monaco);
    monaco.editor.defineTheme('dsa-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'keyword',    foreground: '6c63ff', fontStyle: 'bold' },
        { token: 'string',     foreground: '00f5a0' },
        { token: 'number',     foreground: 'ff9f43' },
        { token: 'comment',    foreground: '5a5f7a', fontStyle: 'italic' },
        { token: 'identifier', foreground: 'f0f0ff' },
        { token: 'type',       foreground: '00d4ff' },
      ],
      colors: {
        'editor.background':              '#111318',
        'editor.foreground':              '#f0f0ff',
        'editorLineNumber.foreground':    '#5a5f7a',
        'editorLineNumber.activeForeground': '#6c63ff',
        'editor.selectionBackground':     '#6c63ff33',
        'editor.lineHighlightBackground': '#6c63ff18',
        'editorCursor.foreground':        '#6c63ff',
        'scrollbar.shadow':               '#00000000',
      },
    });
    monaco.editor.setTheme('dsa-dark');
  }, [onMount]);

  // Notify App.jsx of the initial code on first render
  useEffect(() => {
    if (onCodeChange) onCodeChange(code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = () => {
    onRun(code, dsHint, lang);
  };

  const handleTemplateSelect = (tpl) => {
    const newDsHint = tpl.type || 'auto';
    setDsHint(newDsHint);
    setShowTemplates(false);
    const newCode = tpl.code || getStarterCode(tpl.type !== 'auto' ? tpl.type : 'default');
    setCode(newCode);
    if (onDsHintChange) onDsHintChange(newDsHint);
    if (onCodeChange)   onCodeChange(newCode);
  };

  const handleDsHintChange = (val) => {
    setDsHint(val);
    if (onDsHintChange) onDsHintChange(val);
    if (snapshots.length === 0) {
      const newCode = getStarterCode(val !== 'auto' ? val : 'default');
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode);
    }
  };

  // Keep App.jsx in sync whenever the user types in the editor
  const handleCodeChange = (v) => {
    const val = v || '';
    setCode(val);
    if (onCodeChange) onCodeChange(val);
  };

  return (
    <div className="custom-code-panel">

      {/* ── Controls row ── */}
      <div className="ccp-controls-row">
        <div className="ccp-ds-select-wrap">
          <Layers size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            className="ccp-ds-select"
            value={dsHint}
            onChange={e => handleDsHintChange(e.target.value)}
            title="Force a specific visualizer type"
          >
            {DS_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Templates */}
        <div className="ccp-template-wrap" ref={templateRef}>
          <button className="ccp-template-btn" onClick={() => setShowTemplates(v => !v)}>
            <Sparkles size={13} />
            Templates
            <ChevronDown size={11} style={{ marginLeft: 2, transform: showTemplates ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
          </button>
          {showTemplates && (
            <div className="ccp-template-dropdown">
              <div className="ccp-template-header">Starter Templates</div>
              {templates.map(tpl => (
                <button key={tpl.id} className="ccp-template-item" onClick={() => handleTemplateSelect(tpl)}>
                  <span className="ccp-tpl-name">{tpl.label}</span>
                  <span className="ccp-tpl-type">{tpl.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {snapshots.length > 0 && (
          <button className="ccp-reset-btn" onClick={onReset} title="Reset">
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* ── Python Editor ── */}
      <div className="ccp-editor-wrap">
        <Editor
          height="100%"
          language="python"
          value={code}
          onChange={handleCodeChange}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: false,
            lineDecorationsWidth: 8,
            renderLineHighlight: 'line',
            wordWrap: 'on',
            tabSize: 4,
            padding: { top: 12 },
            smoothScrolling: true,
            readOnly: false,
          }}
        />
      </div>

      {/* Playback Controls */}
      {children}
    </div>
  );
}
