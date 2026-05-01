"""
algorithms/greedy.py — Greedy algorithm templates.
"""

ACTIVITY_SELECTION = """\
# Activities as (start, end) pairs, sorted by end time
activities = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]
activities.sort(key=lambda x: x[1])

selected = [activities[0]]
last_end = activities[0][1]

for i in range(1, len(activities)):
    start, end = activities[i]
    if start >= last_end:
        selected.append(activities[i])
        last_end = end
"""

FRACTIONAL_KNAPSACK = """\
items = [(60, 10), (100, 20), (120, 30)]  # (value, weight)
capacity = 50

# Sort by value/weight ratio descending
items.sort(key=lambda x: x[0] / x[1], reverse=True)

total_value = 0.0
remaining = capacity

for value, weight in items:
    if remaining == 0:
        break
    take = min(weight, remaining)
    total_value += take * (value / weight)
    remaining -= take

result = total_value
"""

JOB_SCHEDULING = """\
# Jobs: (profit, deadline)
jobs = [(20, 2), (15, 2), (10, 1), (5, 3), (1, 3)]
jobs.sort(key=lambda x: x[0], reverse=True)

n = max(d for _, d in jobs)
slots = [None] * n
total_profit = 0

for profit, deadline in jobs:
    for slot in range(min(deadline, n) - 1, -1, -1):
        if slots[slot] is None:
            slots[slot] = profit
            total_profit += profit
            break
"""

ALGORITHMS = {
    "activity_selection":    {"label": "Activity Selection",      "code": ACTIVITY_SELECTION,    "type": "array", "category": "Greedy"},
    "fractional_knapsack":   {"label": "Fractional Knapsack",     "code": FRACTIONAL_KNAPSACK,   "type": "array", "category": "Greedy"},
    "job_scheduling":        {"label": "Job Scheduling",          "code": JOB_SCHEDULING,        "type": "array", "category": "Greedy"},
}
