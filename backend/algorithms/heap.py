"""
algorithms/heap.py — Heap and Priority Queue templates.
"""

HEAPIFY = """\
def heapify_down(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify_down(arr, n, largest)

def build_heap(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify_down(arr, n, i)

arr = [3, 9, 2, 1, 4, 5]
build_heap(arr)
"""

HEAP_SORT = """\
def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2
    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

arr = [12, 11, 13, 5, 6, 7]
n = len(arr)

for i in range(n // 2 - 1, -1, -1):
    heapify(arr, n, i)

for i in range(n - 1, 0, -1):
    arr[0], arr[i] = arr[i], arr[0]
    heapify(arr, i, 0)
"""

PRIORITY_QUEUE = """\
import heapq

pq = []
operations = []

heapq.heappush(pq, (1, "task_low"))
operations.append(("push", 1))

heapq.heappush(pq, (5, "task_high"))
operations.append(("push", 5))

heapq.heappush(pq, (3, "task_mid"))
operations.append(("push", 3))

top = heapq.heappop(pq)
operations.append(("pop", top[0]))

heapq.heappush(pq, (2, "task_urgent"))
operations.append(("push", 2))

result = []
while pq:
    result.append(heapq.heappop(pq)[0])
"""

ALGORITHMS = {
    "heapify":        {"label": "Heapify (Build Max Heap)",  "code": HEAPIFY,        "type": "array", "category": "Heap / Priority Queue"},
    "heap_sort_pq":   {"label": "Heap Sort",                 "code": HEAP_SORT,      "type": "array", "category": "Heap / Priority Queue"},
    "priority_queue": {"label": "Priority Queue Operations", "code": PRIORITY_QUEUE, "type": "array", "category": "Heap / Priority Queue"},
}
