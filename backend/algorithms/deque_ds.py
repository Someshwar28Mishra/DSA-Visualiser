"""
algorithms/deque_ds.py — Deque (Double-Ended Queue) algorithms.
"""

DEQUE_OPS = """\
dq = []

# Insert at rear
dq.append(10)
dq.append(20)
dq.append(30)

# Insert at front
dq.insert(0, 5)
dq.insert(0, 1)

# Peek front and rear
front = dq[0] if dq else None
rear = dq[-1] if dq else None

# Delete from front
removed_front = dq.pop(0)

# Delete from rear
removed_rear = dq.pop()

# Insert more
dq.append(40)
dq.insert(0, 0)
"""

MONOTONIC_DEQUE = """\
# Sliding Window Maximum using Monotonic Deque
arr = [1, 3, -1, -3, 5, 3, 6, 7]
k = 3
n = len(arr)
dq = []   # stores indices; front = max in window
result = []

for i in range(n):
    # Remove indices outside window
    while dq and dq[0] <= i - k:
        dq.pop(0)

    # Remove smaller elements from rear (maintain decreasing order)
    while dq and arr[dq[-1]] < arr[i]:
        dq.pop()

    dq.append(i)

    if i >= k - 1:
        result.append(arr[dq[0]])
"""

SHORTEST_SUBARRAY = """\
# Shortest Subarray with Sum >= K
arr = [2, -1, 2, 3, -2, 4, -3]
k = 5
n = len(arr)

prefix = [0] * (n + 1)
for i in range(n):
    prefix[i + 1] = prefix[i] + arr[i]

dq = []   # stores indices of prefix sums
result = float('inf')
result = n + 1

for i in range(n + 1):
    while dq and prefix[i] - prefix[dq[0]] >= k:
        length = i - dq.pop(0)
        if length < result:
            result = length
    while dq and prefix[i] <= prefix[dq[-1]]:
        dq.pop()
    dq.append(i)

result = result if result <= n else -1
"""

CIRCULAR_DEQUE = """\
capacity = 6
dq = [None] * capacity
front = -1
rear = 0
size = 0

def insert_front(val):
    global front, size
    if size == capacity:
        return False
    if front == -1:
        front = rear = 0
    else:
        front = (front - 1) % capacity
    dq[front] = val
    size += 1
    return True

def insert_rear(val):
    global rear, front, size
    if size == capacity:
        return False
    if front == -1:
        front = rear = 0
    else:
        rear = (rear + 1) % capacity
    dq[rear] = val
    size += 1
    return True

def delete_front():
    global front, size
    if size == 0:
        return None
    val = dq[front]
    dq[front] = None
    front = (front + 1) % capacity
    size -= 1
    if size == 0:
        front = -1; rear = 0
    return val

def delete_rear():
    global rear, size
    if size == 0:
        return None
    val = dq[rear]
    dq[rear] = None
    rear = (rear - 1) % capacity
    size -= 1
    if size == 0:
        front = -1; rear = 0
    return val

insert_rear(10)
insert_rear(20)
insert_front(5)
insert_rear(30)
insert_front(1)
delete_front()
delete_rear()
insert_rear(40)
"""

ALGORITHMS = {
    "deque_ops":         {"label": "Deque Insert/Delete (Both Ends)", "code": DEQUE_OPS,        "type": "deque", "category": "Deque"},
    "monotonic_deque":   {"label": "Monotonic Deque (Sliding Max)",   "code": MONOTONIC_DEQUE,  "type": "deque", "category": "Deque"},
    "shortest_subarray": {"label": "Shortest Subarray with Sum ≥ K",  "code": SHORTEST_SUBARRAY,"type": "deque", "category": "Deque"},
    "circular_deque":    {"label": "Design Circular Deque",           "code": CIRCULAR_DEQUE,   "type": "deque", "category": "Deque"},
}
