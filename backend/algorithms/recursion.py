"""
algorithms/recursion.py — Recursion & Backtracking templates.
"""

TOWER_OF_HANOI = """\
moves = []

def hanoi(n, source, target, auxiliary):
    if n == 1:
        moves.append((source, target))
        return
    hanoi(n - 1, source, auxiliary, target)
    moves.append((source, target))
    hanoi(n - 1, auxiliary, target, source)

hanoi(3, 'A', 'C', 'B')
"""

N_QUEENS = """\
def is_safe(board, row, col, n):
    for i in range(row):
        if board[i] == col:
            return False
        if abs(board[i] - col) == abs(i - row):
            return False
    return True

def solve_nqueens(n):
    solutions = []
    board = [-1] * n

    def backtrack(row):
        if row == n:
            solutions.append(board[:])
            return
        for col in range(n):
            if is_safe(board, row, col, n):
                board[row] = col
                backtrack(row + 1)
                board[row] = -1

    backtrack(0)
    return solutions

n = 4
solutions = solve_nqueens(n)
"""

SUBSET_GENERATION = """\
def subsets(nums):
    result = [[]]
    for num in nums:
        new_subsets = [s + [num] for s in result]
        result.extend(new_subsets)
    return result

nums = [1, 2, 3]
result = subsets(nums)
"""

PERMUTATIONS = """\
def permute(nums):
    result = []

    def backtrack(start):
        if start == len(nums):
            result.append(nums[:])
            return
        for i in range(start, len(nums)):
            nums[start], nums[i] = nums[i], nums[start]
            backtrack(start + 1)
            nums[start], nums[i] = nums[i], nums[start]

    backtrack(0)
    return result

nums = [1, 2, 3]
result = permute(nums)
"""

ALGORITHMS = {
    "tower_of_hanoi":   {"label": "Tower of Hanoi",      "code": TOWER_OF_HANOI,   "type": "array", "category": "Recursion & Backtracking"},
    "n_queens":         {"label": "N-Queens Problem",    "code": N_QUEENS,         "type": "array", "category": "Recursion & Backtracking"},
    "subset_generation":{"label": "Subset Generation",  "code": SUBSET_GENERATION,"type": "array", "category": "Recursion & Backtracking"},
    "permutations":     {"label": "Permutation Generation","code": PERMUTATIONS,   "type": "array", "category": "Recursion & Backtracking"},
}
