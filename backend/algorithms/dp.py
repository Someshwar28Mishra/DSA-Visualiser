"""
algorithms/dp.py — Dynamic Programming algorithm templates.
"""

FIBONACCI_DP = """\
n = 10
dp = [0] * (n + 1)
dp[1] = 1

for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

result = dp[n]
"""

KNAPSACK_01 = """\
weights = [1, 3, 4, 5]
values  = [1, 4, 5, 7]
capacity = 7
n = len(weights)

dp = [[0] * (capacity + 1) for _ in range(n + 1)]

for i in range(1, n + 1):
    for w in range(capacity + 1):
        if weights[i - 1] <= w:
            dp[i][w] = max(dp[i - 1][w],
                           dp[i - 1][w - weights[i - 1]] + values[i - 1])
        else:
            dp[i][w] = dp[i - 1][w]

result = dp[n][capacity]
"""

LCS = """\
s1 = "AGGTAB"
s2 = "GXTXAYB"
m, n = len(s1), len(s2)

dp = [[0] * (n + 1) for _ in range(m + 1)]

for i in range(1, m + 1):
    for j in range(1, n + 1):
        if s1[i - 1] == s2[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

result = dp[m][n]
"""

LIS = """\
arr = [10, 9, 2, 5, 3, 7, 101, 18]
n = len(arr)

dp = [1] * n

for i in range(1, n):
    for j in range(i):
        if arr[j] < arr[i]:
            dp[i] = max(dp[i], dp[j] + 1)

result = max(dp)
"""

MATRIX_CHAIN = """\
dims = [10, 30, 5, 60]
n = len(dims) - 1

dp = [[0] * n for _ in range(n)]

for length in range(2, n + 1):
    for i in range(n - length + 1):
        j = i + length - 1
        dp[i][j] = float('inf')
        for k in range(i, j):
            cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
            if cost < dp[i][j]:
                dp[i][j] = cost

result = dp[0][n - 1]
"""

COIN_CHANGE = """\
coins = [1, 5, 6, 9]
amount = 11

dp = [float('inf')] * (amount + 1)
dp[0] = 0

for i in range(1, amount + 1):
    for coin in coins:
        if coin <= i and dp[i - coin] + 1 < dp[i]:
            dp[i] = dp[i - coin] + 1

result = dp[amount] if dp[amount] != float('inf') else -1
"""

ALGORITHMS = {
    "fibonacci_dp":    {"label": "Fibonacci (DP)",               "code": FIBONACCI_DP,  "type": "array",  "category": "Dynamic Programming"},
    "knapsack_01":     {"label": "0/1 Knapsack",                 "code": KNAPSACK_01,   "type": "matrix", "category": "Dynamic Programming"},
    "lcs":             {"label": "Longest Common Subsequence",   "code": LCS,           "type": "matrix", "category": "Dynamic Programming"},
    "lis":             {"label": "Longest Increasing Subsequence","code": LIS,           "type": "array",  "category": "Dynamic Programming"},
    "matrix_chain":    {"label": "Matrix Chain Multiplication",  "code": MATRIX_CHAIN,  "type": "matrix", "category": "Dynamic Programming"},
    "coin_change":     {"label": "Coin Change",                  "code": COIN_CHANGE,   "type": "array",  "category": "Dynamic Programming"},
}
