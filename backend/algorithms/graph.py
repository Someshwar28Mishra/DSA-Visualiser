"""
algorithms/graph.py — Graph algorithm templates.
"""

BFS = """\
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1],
    4: [1],
    5: [2],
}

start = 0
visited = []
queue = [start]
seen = {start}

while queue:
    node = queue.pop(0)
    visited.append(node)
    for neighbor in graph[node]:
        if neighbor not in seen:
            seen.add(neighbor)
            queue.append(neighbor)
"""

DFS = """\
graph = {
    0: [1, 2],
    1: [0, 3, 4],
    2: [0, 5],
    3: [1],
    4: [1],
    5: [2],
}

start = 0
visited = []
stack = [start]
seen = {start}

while stack:
    node = stack.pop()
    visited.append(node)
    for neighbor in graph[node]:
        if neighbor not in seen:
            seen.add(neighbor)
            stack.append(neighbor)
"""

DIJKSTRA = """\
import heapq

graph = {
    0: [(1, 4), (2, 1)],
    1: [(3, 1)],
    2: [(1, 2), (3, 5)],
    3: [],
}

start = 0
dist = {node: float('inf') for node in graph}
prev = {node: None for node in graph}
dist[start] = 0
heap = [(0, start)]
visited = []

while heap:
    cost, node = heapq.heappop(heap)
    if node in visited:
        continue
    visited.append(node)
    for neighbor, weight in graph[node]:
        new_cost = cost + weight
        if new_cost < dist[neighbor]:
            dist[neighbor] = new_cost
            prev[neighbor] = node
            heapq.heappush(heap, (new_cost, neighbor))
"""

BELLMAN_FORD = """\
vertices = 5
edges = [
    (0, 1, -1),
    (0, 2,  4),
    (1, 2,  3),
    (1, 3,  2),
    (1, 4,  2),
    (3, 2,  5),
    (3, 1,  1),
    (4, 3, -3),
]

dist = [float('inf')] * vertices
dist[0] = 0

for i in range(vertices - 1):
    for u, v, w in edges:
        if dist[u] != float('inf') and dist[u] + w < dist[v]:
            dist[v] = dist[u] + w

# Check for negative-weight cycles
for u, v, w in edges:
    if dist[u] != float('inf') and dist[u] + w < dist[v]:
        negative_cycle = True
"""

FLOYD_WARSHALL = """\
INF = float('inf')
dist = [
    [0,   3,   INF, 7  ],
    [8,   0,   2,   INF],
    [5,   INF, 0,   1  ],
    [2,   INF, INF, 0  ],
]

n = len(dist)
# Try each vertex k as an intermediate node
for k in range(n):
    # Update shortest path between every pair (i, j)
    for i in range(n):
        for j in range(n):
            via_k = dist[i][k] + dist[k][j]
            if via_k < dist[i][j]:
                dist[i][j] = via_k
"""

KRUSKAL = """\
edges = [
    (1, 0, 1),
    (2, 0, 2),
    (3, 1, 2),
    (4, 1, 3),
    (5, 2, 3),
    (6, 2, 4),
    (7, 3, 4),
]

parent = list(range(5))

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(x, y):
    px, py = find(x), find(y)
    if px == py:
        return False
    parent[px] = py
    return True

edges.sort()
mst = []
mst_cost = 0

for weight, u, v in edges:
    if union(u, v):
        mst.append((u, v, weight))
        mst_cost += weight
"""

PRIM = """\
import heapq

graph = {
    0: [(2, 1), (3, 2)],
    1: [(2, 0), (1, 3), (5, 4)],
    2: [(3, 0), (1, 1), (1, 3)],
    3: [(2, 1), (1, 2), (4, 4)],
    4: [(5, 1), (4, 3)],
}

start = 0
visited = set()
heap = [(0, start, -1)]
mst = []
mst_cost = 0

while heap:
    cost, node, parent = heapq.heappop(heap)
    if node in visited:
        continue
    visited.add(node)
    if parent != -1:
        mst.append((parent, node, cost))
        mst_cost += cost
    for weight, neighbor in graph[node]:
        if neighbor not in visited:
            heapq.heappush(heap, (weight, neighbor, node))
"""

ALGORITHMS = {
    "bfs":          {"label": "BFS (Breadth-First Search)", "code": BFS,          "type": "graph",  "category": "Graph"},
    "dfs":          {"label": "DFS (Depth-First Search)",   "code": DFS,          "type": "graph",  "category": "Graph"},
    "dijkstra":     {"label": "Dijkstra's Algorithm",       "code": DIJKSTRA,     "type": "graph",  "category": "Graph"},
    "bellman_ford": {"label": "Bellman-Ford",               "code": BELLMAN_FORD, "type": "array",  "category": "Graph"},
    "floyd_warshall":{"label": "Floyd-Warshall",            "code": FLOYD_WARSHALL,"type": "matrix","category": "Graph"},
    "kruskal":      {"label": "Kruskal's Algorithm (MST)",  "code": KRUSKAL,      "type": "array",  "category": "Graph"},
    "prim":         {"label": "Prim's Algorithm (MST)",     "code": PRIM,         "type": "array",  "category": "Graph"},
}
