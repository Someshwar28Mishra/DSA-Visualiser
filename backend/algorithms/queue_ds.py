"""
algorithms/queue_ds.py — Queue data structure algorithms.
"""

QUEUE_OPS = """\
queue = []

# Enqueue
queue.append(10)
queue.append(20)
queue.append(30)
queue.append(40)
queue.append(50)

# Peek front
front = queue[0] if queue else None

# Dequeue
dequeued = queue.pop(0)
dequeued2 = queue.pop(0)

# Enqueue more
queue.append(60)
queue.append(70)

front = queue[0] if queue else None
"""

CIRCULAR_QUEUE = """\
capacity = 5
queue = [None] * capacity
front = -1
rear = -1
size = 0

def enqueue(val):
    global front, rear, size
    if size == capacity:
        return False
    if front == -1:
        front = 0
    rear = (rear + 1) % capacity
    queue[rear] = val
    size += 1
    return True

def dequeue():
    global front, size
    if size == 0:
        return None
    val = queue[front]
    queue[front] = None
    front = (front + 1) % capacity
    size -= 1
    if size == 0:
        front = rear = -1
    return val

enqueue(10)
enqueue(20)
enqueue(30)
dequeue()
enqueue(40)
enqueue(50)
enqueue(60)
dequeue()
dequeue()
"""

QUEUE_USING_STACKS = """\
s1 = []  # push stack
s2 = []  # pop stack

def enqueue(val):
    s1.append(val)

def dequeue():
    if not s2:
        while s1:
            s2.append(s1.pop())
    return s2.pop() if s2 else None

enqueue(1)
enqueue(2)
enqueue(3)
val = dequeue()
enqueue(4)
val = dequeue()
val = dequeue()
enqueue(5)
val = dequeue()
val = dequeue()
"""

SLIDING_WINDOW_MAX = """\
from collections import deque

arr = [1, 3, -1, -3, 5, 3, 6, 7]
k = 3
n = len(arr)
result = []
dq = []  # stores indices

for i in range(n):
    # Remove out-of-window elements
    while dq and dq[0] < i - k + 1:
        dq.pop(0)
    # Remove smaller elements from rear
    while dq and arr[dq[-1]] < arr[i]:
        dq.pop()
    dq.append(i)
    if i >= k - 1:
        result.append(arr[dq[0]])
"""

ROTTEN_ORANGES = """\
grid = [
    [2, 1, 1],
    [1, 1, 0],
    [0, 1, 1],
]
rows, cols = len(grid), len(grid[0])
queue = []
fresh = 0
minutes = 0

for r in range(rows):
    for c in range(cols):
        if grid[r][c] == 2:
            queue.append((r, c, 0))
        elif grid[r][c] == 1:
            fresh += 1

dirs = [(-1,0),(1,0),(0,-1),(0,1)]

while queue:
    r, c, t = queue.pop(0)
    minutes = max(minutes, t)
    for dr, dc in dirs:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
            grid[nr][nc] = 2
            fresh -= 1
            queue.append((nr, nc, t + 1))

result = minutes if fresh == 0 else -1
"""

GENERATE_BINARY = """\
n = 10
queue = ['1']
result = []

for _ in range(n):
    front = queue.pop(0)
    result.append(front)
    queue.append(front + '0')
    queue.append(front + '1')
"""

ALGORITHMS = {
    "queue_ops":          {"label": "Queue Enqueue/Dequeue",      "code": QUEUE_OPS,          "type": "queue", "category": "Queue"},
    "circular_queue":     {"label": "Circular Queue",             "code": CIRCULAR_QUEUE,     "type": "queue", "category": "Queue"},
    "queue_using_stacks": {"label": "Queue using Two Stacks",     "code": QUEUE_USING_STACKS, "type": "stack", "category": "Queue"},
    "sliding_window_max": {"label": "Sliding Window Maximum",     "code": SLIDING_WINDOW_MAX, "type": "queue", "category": "Queue"},
    "rotten_oranges":     {"label": "Rotten Oranges (BFS)",       "code": ROTTEN_ORANGES,     "type": "queue", "category": "Queue"},
    "generate_binary":    {"label": "Generate Binary Numbers",    "code": GENERATE_BINARY,    "type": "queue", "category": "Queue"},
}
