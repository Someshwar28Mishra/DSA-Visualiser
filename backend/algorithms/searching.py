"""
algorithms/searching.py — Searching algorithm templates.
"""

LINEAR_SEARCH = """\
arr = [10, 25, 3, 47, 8, 66, 12, 99]
target = 47

result = -1
for i in range(len(arr)):
    if arr[i] == target:
        result = i
        break
"""

BINARY_SEARCH = """\
arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23

lo = 0
hi = len(arr) - 1
result = -1

while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target:
        result = mid
        break
    elif arr[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
"""

ALGORITHMS = {
    "linear_search": {"label": "Linear Search", "code": LINEAR_SEARCH, "type": "array", "category": "Searching"},
    "binary_search": {"label": "Binary Search", "code": BINARY_SEARCH, "type": "array", "category": "Searching"},
}
