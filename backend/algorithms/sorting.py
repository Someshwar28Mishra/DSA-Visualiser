"""
algorithms/sorting.py — Sorting algorithm templates.
"""

BUBBLE_SORT = """\
arr = [64, 34, 25, 12, 22, 11, 90]

n = len(arr)
for i in range(n):
    for j in range(0, n - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]
"""

SELECTION_SORT = """\
arr = [64, 25, 12, 22, 11]

n = len(arr)
for i in range(n):
    min_idx = i
    for j in range(i + 1, n):
        if arr[j] < arr[min_idx]:
            min_idx = j
    arr[i], arr[min_idx] = arr[min_idx], arr[i]
"""

INSERTION_SORT = """\
arr = [12, 11, 13, 5, 6]

n = len(arr)
for i in range(1, n):
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
        arr[j + 1] = arr[j]
        j -= 1
    arr[j + 1] = key
"""

MERGE_SORT = """\
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

arr = [38, 27, 43, 3, 9, 82, 10]
arr = merge_sort(arr)
"""

QUICK_SORT = """\
def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

arr = [10, 80, 30, 90, 40, 50, 70]
quick_sort(arr, 0, len(arr) - 1)
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

def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)

arr = [12, 11, 13, 5, 6, 7]
heap_sort(arr)
"""

ALGORITHMS = {
    "bubble_sort":    {"label": "Bubble Sort",    "code": BUBBLE_SORT,    "type": "array", "category": "Sorting"},
    "selection_sort": {"label": "Selection Sort", "code": SELECTION_SORT, "type": "array", "category": "Sorting"},
    "insertion_sort": {"label": "Insertion Sort", "code": INSERTION_SORT, "type": "array", "category": "Sorting"},
    "merge_sort":     {"label": "Merge Sort",     "code": MERGE_SORT,     "type": "array", "category": "Sorting"},
    "quick_sort":     {"label": "Quick Sort",     "code": QUICK_SORT,     "type": "array", "category": "Sorting"},
    "heap_sort":      {"label": "Heap Sort",      "code": HEAP_SORT,      "type": "array", "category": "Sorting"},
}
