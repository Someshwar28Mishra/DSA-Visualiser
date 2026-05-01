/**
 * langSnippets.js
 * Reference code for each algorithm in Java, C++, JavaScript, C#.
 * Python code is fetched from the backend; these are display-only.
 */

export const LANG_META = [
  { id: 'python',     label: 'Python',      monaco: 'python',     canTrace: true  },
  { id: 'java',       label: 'Java',        monaco: 'java',       canTrace: false },
  { id: 'cpp',        label: 'C++',         monaco: 'cpp',        canTrace: false },
  { id: 'javascript', label: 'JavaScript',  monaco: 'javascript', canTrace: false },
  { id: 'csharp',     label: 'C#',          monaco: 'csharp',     canTrace: false },
];

const SNIPPETS = {
  // ── Searching ─────────────────────────────────────────────────────────────
  linear_search: {
    java: `int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++)
        if (arr[i] == target) return i;
    return -1;
}`,
    cpp: `int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++)
        if (arr[i] == target) return i;
    return -1;
}`,
    javascript: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++)
    if (arr[i] === target) return i;
  return -1;
}`,
    csharp: `int LinearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.Length; i++)
        if (arr[i] == target) return i;
    return -1;
}`,
  },

  binary_search: {
    java: `int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
    cpp: `int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
    javascript: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`,
    csharp: `int BinarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.Length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
  },

  // ── Sorting ───────────────────────────────────────────────────────────────
  bubble_sort: {
    java: `void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
            }
}`,
    cpp: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n-i-1; j++)
            if (arr[j] > arr[j+1]) swap(arr[j], arr[j+1]);
}`,
    javascript: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n-i-1; j++)
      if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
  return arr;
}`,
    csharp: `void BubbleSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n-i-1; j++)
            if (arr[j] > arr[j+1]) { int t=arr[j]; arr[j]=arr[j+1]; arr[j+1]=t; }
}`,
  },

  selection_sort: {
    java: `void selectionSort(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        int min = i;
        for (int j = i+1; j < arr.length; j++)
            if (arr[j] < arr[min]) min = j;
        int tmp = arr[i]; arr[i] = arr[min]; arr[min] = tmp;
    }
}`,
    cpp: `void selectionSort(vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        int mn = i;
        for (int j = i+1; j < arr.size(); j++)
            if (arr[j] < arr[mn]) mn = j;
        swap(arr[i], arr[mn]);
    }
}`,
    javascript: `function selectionSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let min = i;
    for (let j = i+1; j < arr.length; j++)
      if (arr[j] < arr[min]) min = j;
    [arr[i], arr[min]] = [arr[min], arr[i]];
  }
  return arr;
}`,
    csharp: `void SelectionSort(int[] arr) {
    for (int i = 0; i < arr.Length; i++) {
        int min = i;
        for (int j = i+1; j < arr.Length; j++)
            if (arr[j] < arr[min]) min = j;
        int t = arr[i]; arr[i] = arr[min]; arr[min] = t;
    }
}`,
  },

  insertion_sort: {
    java: `void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) arr[j+1] = arr[j--];
        arr[j+1] = key;
    }
}`,
    cpp: `void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) arr[j+1] = arr[j--];
        arr[j+1] = key;
    }
}`,
    javascript: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) arr[j+1] = arr[j--];
    arr[j+1] = key;
  }
  return arr;
}`,
    csharp: `void InsertionSort(int[] arr) {
    for (int i = 1; i < arr.Length; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) arr[j+1] = arr[j--];
        arr[j+1] = key;
    }
}`,
  },

  merge_sort: {
    java: `int[] mergeSort(int[] arr) {
    if (arr.length <= 1) return arr;
    int mid = arr.length / 2;
    int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));
    int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
    return merge(left, right);
}
int[] merge(int[] l, int[] r) {
    int[] res = new int[l.length + r.length];
    int i = 0, j = 0, k = 0;
    while (i < l.length && j < r.length)
        res[k++] = l[i] <= r[j] ? l[i++] : r[j++];
    while (i < l.length) res[k++] = l[i++];
    while (j < r.length) res[k++] = r[j++];
    return res;
}`,
    cpp: `vector<int> mergeSort(vector<int> arr) {
    if (arr.size() <= 1) return arr;
    int mid = arr.size() / 2;
    auto left  = mergeSort({arr.begin(), arr.begin()+mid});
    auto right = mergeSort({arr.begin()+mid, arr.end()});
    vector<int> res;
    merge(left.begin(),left.end(),right.begin(),right.end(),back_inserter(res));
    return res;
}`,
    javascript: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  const res = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length)
    res.push(left[i] <= right[j] ? left[i++] : right[j++]);
  return res.concat(left.slice(i)).concat(right.slice(j));
}`,
    csharp: `int[] MergeSort(int[] arr) {
    if (arr.Length <= 1) return arr;
    int mid = arr.Length / 2;
    var left = MergeSort(arr[..mid]);
    var right = MergeSort(arr[mid..]);
    return Merge(left, right);
}`,
  },

  quick_sort: {
    java: `void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
int partition(int[] arr, int low, int high) {
    int pivot = arr[high], i = low - 1;
    for (int j = low; j < high; j++)
        if (arr[j] <= pivot) { i++; int t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    int t=arr[i+1]; arr[i+1]=arr[high]; arr[high]=t;
    return i + 1;
}`,
    cpp: `int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high], i = low - 1;
    for (int j = low; j < high; j++)
        if (arr[j] <= pivot) swap(arr[++i], arr[j]);
    swap(arr[i+1], arr[high]);
    return i + 1;
}
void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi-1);
        quickSort(arr, pi+1, high);
    }
}`,
    javascript: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}
function partition(arr, low, high) {
  const pivot = arr[high]; let i = low - 1;
  for (let j = low; j < high; j++)
    if (arr[j] <= pivot) [arr[++i], arr[j]] = [arr[j], arr[i]];
  [arr[i+1], arr[high]] = [arr[high], arr[i+1]];
  return i + 1;
}`,
    csharp: `void QuickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = Partition(arr, low, high);
        QuickSort(arr, low, pi - 1);
        QuickSort(arr, pi + 1, high);
    }
}`,
  },

  // ── Graph ─────────────────────────────────────────────────────────────────
  bfs: {
    java: `void bfs(Map<Integer,List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    queue.add(start); visited.add(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int nb : graph.get(node))
            if (!visited.contains(nb)) { visited.add(nb); queue.add(nb); }
    }
}`,
    cpp: `void bfs(unordered_map<int,vector<int>>& graph, int start) {
    unordered_set<int> visited;
    queue<int> q;
    q.push(start); visited.insert(start);
    while (!q.empty()) {
        int node = q.front(); q.pop();
        for (int nb : graph[node])
            if (!visited.count(nb)) { visited.insert(nb); q.push(nb); }
    }
}`,
    javascript: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift();
    for (const nb of graph[node])
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
  }
}`,
    csharp: `void Bfs(Dictionary<int,List<int>> graph, int start) {
    var visited = new HashSet<int> { start };
    var queue = new Queue<int>(); queue.Enqueue(start);
    while (queue.Count > 0) {
        int node = queue.Dequeue();
        foreach (int nb in graph[node])
            if (!visited.Contains(nb)) { visited.Add(nb); queue.Enqueue(nb); }
    }
}`,
  },

  dfs: {
    java: `void dfs(Map<Integer,List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);
        for (int nb : graph.get(node)) stack.push(nb);
    }
}`,
    cpp: `void dfs(unordered_map<int,vector<int>>& graph, int start) {
    unordered_set<int> visited;
    stack<int> st; st.push(start);
    while (!st.empty()) {
        int node = st.top(); st.pop();
        if (visited.count(node)) continue;
        visited.insert(node);
        for (int nb : graph[node]) st.push(nb);
    }
}`,
    javascript: `function dfs(graph, start) {
  const visited = new Set();
  const stack = [start];
  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    for (const nb of graph[node]) stack.push(nb);
  }
}`,
    csharp: `void Dfs(Dictionary<int,List<int>> graph, int start) {
    var visited = new HashSet<int>();
    var stack = new Stack<int>(); stack.Push(start);
    while (stack.Count > 0) {
        int node = stack.Pop();
        if (!visited.Add(node)) continue;
        foreach (int nb in graph[node]) stack.Push(nb);
    }
}`,
  },

  // ── Tree ──────────────────────────────────────────────────────────────────
  inorder: {
    java: `void inorder(TreeNode root) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        result.add(curr.val);
        curr = curr.right;
    }
}`,
    cpp: `void inorder(TreeNode* root, vector<int>& res) {
    stack<TreeNode*> st; auto curr = root;
    while (curr || !st.empty()) {
        while (curr) { st.push(curr); curr = curr->left; }
        curr = st.top(); st.pop();
        res.push_back(curr->val);
        curr = curr->right;
    }
}`,
    javascript: `function inorder(root) {
  const result = [], stack = [];
  let curr = root;
  while (curr || stack.length) {
    while (curr) { stack.push(curr); curr = curr.left; }
    curr = stack.pop();
    result.push(curr.val);
    curr = curr.right;
  }
  return result;
}`,
    csharp: `IList<int> Inorder(TreeNode root) {
    var res = new List<int>(); var stack = new Stack<TreeNode>();
    var curr = root;
    while (curr != null || stack.Count > 0) {
        while (curr != null) { stack.Push(curr); curr = curr.left; }
        curr = stack.Pop(); res.Add(curr.val); curr = curr.right;
    }
    return res;
}`,
  },

  level_order: {
    java: `List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> q = new LinkedList<>(); q.add(root);
    while (!q.isEmpty()) {
        int size = q.size(); List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll(); level.add(node.val);
            if (node.left != null) q.add(node.left);
            if (node.right != null) q.add(node.right);
        }
        res.add(level);
    }
    return res;
}`,
    cpp: `vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> res; if (!root) return res;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int sz = q.size(); vector<int> level;
        for (int i = 0; i < sz; i++) {
            auto node = q.front(); q.pop(); level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        res.push_back(level);
    }
    return res;
}`,
    javascript: `function levelOrder(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}`,
    csharp: `IList<IList<int>> LevelOrder(TreeNode root) {
    var res = new List<IList<int>>(); if (root == null) return res;
    var q = new Queue<TreeNode>(); q.Enqueue(root);
    while (q.Count > 0) {
        int sz = q.Count; var level = new List<int>();
        for (int i = 0; i < sz; i++) {
            var node = q.Dequeue(); level.Add(node.val);
            if (node.left != null) q.Enqueue(node.left);
            if (node.right != null) q.Enqueue(node.right);
        }
        res.Add(level);
    }
    return res;
}`,
  },

  // ── DP ────────────────────────────────────────────────────────────────────
  fibonacci_dp: {
    java: `int fibonacci(int n) {
    int[] dp = new int[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}`,
    cpp: `int fibonacci(int n) {
    vector<int> dp(n+1, 0); dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}`,
    javascript: `function fibonacci(n) {
  const dp = Array(n+1).fill(0); dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
  return dp[n];
}`,
    csharp: `int Fibonacci(int n) {
    int[] dp = new int[n+1]; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}`,
  },

  lcs: {
    java: `int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m+1][n+1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1)==s2.charAt(j-1) ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}`,
    cpp: `int lcs(string s1, string s2) {
    int m=s1.size(), n=s2.size();
    vector<vector<int>> dp(m+1, vector<int>(n+1,0));
    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++)
        dp[i][j]=s1[i-1]==s2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,
    javascript: `function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j]=s1[i-1]===s2[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}`,
    csharp: `int Lcs(string s1, string s2) {
    int m=s1.Length, n=s2.Length;
    var dp=new int[m+1,n+1];
    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++)
        dp[i,j]=s1[i-1]==s2[j-1]?dp[i-1,j-1]+1:Math.Max(dp[i-1,j],dp[i,j-1]);
    return dp[m,n];
}`,
  },
};

/** Get snippet for an algorithm in a given language. Falls back to a placeholder. */
export function getSnippet(algoId, langId) {
  const algo = SNIPPETS[algoId];
  if (!algo) return `// No ${langId} snippet available for this algorithm.\n// Switch to Python to run & trace it.`;
  return algo[langId] || `// No ${langId} snippet available for this algorithm.\n// Switch to Python to run & trace it.`;
}
