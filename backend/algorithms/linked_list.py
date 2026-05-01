"""
algorithms/linked_list.py — Linked List algorithms.
Representation: ll = [[value, next_index], ...], head = start_index, -1 = null pointer
"""

LL_OPS = """\
# Linked list: ll[i] = [value, next_index], -1 = null
ll = [[10, 1], [20, 2], [30, 3], [40, -1]]
head = 0

# Traverse
current = head
result = []
while current != -1:
    result.append(ll[current][0])
    current = ll[current][1]

# Insert at beginning (new node at index 4)
ll.append([5, head])
head = 4

# Traverse again
current = head
result2 = []
while current != -1:
    result2.append(ll[current][0])
    current = ll[current][1]
"""

REVERSE_LL = """\
ll = [[1, 1], [2, 2], [3, 3], [4, 4], [5, -1]]
head = 0

prev = -1
current = head

while current != -1:
    next_node = ll[current][1]
    ll[current][1] = prev
    prev = current
    current = next_node

head = prev

# Traverse reversed list
node = head
result = []
while node != -1:
    result.append(ll[node][0])
    node = ll[node][1]
"""

DETECT_CYCLE = """\
# Linked list with cycle: node 3 points back to node 1
ll = [[3, 1], [2, 2], [0, 3], [4, 1]]
head = 0

slow = head
fast = head
has_cycle = False

while fast != -1 and ll[fast][1] != -1:
    slow = ll[slow][1]
    fast = ll[ll[fast][1]][1]
    if slow == fast:
        has_cycle = True
        break
"""

FIND_MIDDLE = """\
ll = [[1, 1], [2, 2], [3, 3], [4, 4], [5, -1]]
head = 0

slow = head
fast = head

while fast != -1 and ll[fast][1] != -1:
    slow = ll[slow][1]
    fast = ll[ll[fast][1]][1]

middle = ll[slow][0]
"""

MERGE_SORTED_LL = """\
# List 1: 1->3->5->7
# List 2: 2->4->6->8
# All nodes in one array; l1_head=0, l2_head=4
ll = [[1,1],[3,2],[5,3],[7,-1],[2,5],[4,6],[6,7],[8,-1]]
l1 = 0
l2 = 4

# Merge using a dummy node approach (index 8 = dummy)
ll.append([-1, -1])
dummy = 8
current = dummy

while l1 != -1 and l2 != -1:
    if ll[l1][0] <= ll[l2][0]:
        ll[current][1] = l1
        current = l1
        l1 = ll[l1][1]
    else:
        ll[current][1] = l2
        current = l2
        l2 = ll[l2][1]

ll[current][1] = l1 if l1 != -1 else l2
head = ll[dummy][1]
"""

REMOVE_NTH_FROM_END = """\
ll = [[1,1],[2,2],[3,3],[4,4],[5,-1]]
head = 0
n = 2

# Add dummy at index 5
ll.append([-1, head])
dummy = 5

fast = dummy
slow = dummy

for _ in range(n + 1):
    fast = ll[fast][1]

while fast != -1:
    fast = ll[fast][1]
    slow = ll[slow][1]

# Remove the nth node from end
ll[slow][1] = ll[ll[slow][1]][1]
head = ll[dummy][1]
"""

TWO_SUM_LL = """\
# Add two numbers: 342 + 465 = 807
# l1: 2->4->3, l2: 5->6->4
ll = [[2,1],[4,2],[3,-1],[5,4],[6,5],[4,-1]]
l1 = 0
l2 = 3

result_ll = []
carry = 0
p = l1
q = l2

while p != -1 or q != -1 or carry:
    val = carry
    if p != -1:
        val += ll[p][0]
        p = ll[p][1]
    if q != -1:
        val += ll[q][0]
        q = ll[q][1]
    carry = val // 10
    result_ll.append(val % 10)
"""

ALGORITHMS = {
    "ll_ops":            {"label": "Linked List Insert/Traverse",    "code": LL_OPS,           "type": "linked_list", "category": "Linked List"},
    "reverse_ll":        {"label": "Reverse Linked List",           "code": REVERSE_LL,       "type": "linked_list", "category": "Linked List"},
    "detect_cycle":      {"label": "Detect Cycle (Floyd's)",        "code": DETECT_CYCLE,     "type": "linked_list", "category": "Linked List"},
    "find_middle":       {"label": "Find Middle (Slow & Fast)",     "code": FIND_MIDDLE,      "type": "linked_list", "category": "Linked List"},
    "merge_sorted_ll":   {"label": "Merge Two Sorted Lists",        "code": MERGE_SORTED_LL,  "type": "linked_list", "category": "Linked List"},
    "remove_nth":        {"label": "Remove Nth Node from End",      "code": REMOVE_NTH_FROM_END,"type":"linked_list","category": "Linked List"},
    "two_sum_ll":        {"label": "Add Two Numbers (LL)",          "code": TWO_SUM_LL,       "type": "linked_list", "category": "Linked List"},
}
