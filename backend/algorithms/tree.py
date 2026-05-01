"""
algorithms/tree.py — Tree traversal templates.
"""

INORDER = """\
# Binary Tree: node -> (left_child, right_child); None = no child
tree = {
    1: (2, 3),
    2: (4, 5),
    3: (None, 6),
    4: (None, None),
    5: (None, None),
    6: (None, None),
}
root = 1

result = []
stack = []
current = root

while current is not None or stack:
    while current is not None:
        stack.append(current)
        left, right = tree.get(current, (None, None))
        current = left
    current = stack.pop()
    result.append(current)
    left, right = tree.get(current, (None, None))
    current = right
"""

PREORDER = """\
tree = {
    1: (2, 3),
    2: (4, 5),
    3: (None, 6),
    4: (None, None),
    5: (None, None),
    6: (None, None),
}
root = 1

result = []
stack = [root]

while stack:
    node = stack.pop()
    if node is None:
        continue
    result.append(node)
    left, right = tree.get(node, (None, None))
    if right is not None:
        stack.append(right)
    if left is not None:
        stack.append(left)
"""

POSTORDER = """\
tree = {
    1: (2, 3),
    2: (4, 5),
    3: (None, 6),
    4: (None, None),
    5: (None, None),
    6: (None, None),
}
root = 1

result = []
stack = [root]

while stack:
    node = stack.pop()
    if node is None:
        continue
    result.append(node)
    left, right = tree.get(node, (None, None))
    if left is not None:
        stack.append(left)
    if right is not None:
        stack.append(right)

result.reverse()
"""

LEVEL_ORDER = """\
tree = {
    1: (2, 3),
    2: (4, 5),
    3: (None, 6),
    4: (None, None),
    5: (None, None),
    6: (None, None),
}
root = 1

result = []
queue = [root]

while queue:
    node = queue.pop(0)
    result.append(node)
    left, right = tree.get(node, (None, None))
    if left is not None:
        queue.append(left)
    if right is not None:
        queue.append(right)
"""

BST_INSERT_SEARCH = """\
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def insert(root, val):
    if root is None:
        return Node(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def search(root, target):
    path = []
    while root:
        path.append(root.val)
        if root.val == target:
            return path
        elif target < root.val:
            root = root.left
        else:
            root = root.right
    return path

values = [8, 3, 10, 1, 6, 14, 4, 7, 13]
root = None
for v in values:
    root = insert(root, v)

path = search(root, 7)
"""

LCA = """\
tree = {
    1: (2, 3),
    2: (4, 5),
    3: (None, 6),
    4: (None, None),
    5: (None, None),
    6: (None, None),
}
root = 1

def lca(node, p, q):
    if node is None:
        return None
    if node == p or node == q:
        return node
    left_child, right_child = tree.get(node, (None, None))
    left = lca(left_child, p, q)
    right = lca(right_child, p, q)
    if left and right:
        return node
    return left if left else right

result = lca(root, 4, 6)
"""

ALGORITHMS = {
    "inorder":     {"label": "Inorder Traversal",       "code": INORDER,          "type": "tree", "category": "Trees"},
    "preorder":    {"label": "Preorder Traversal",       "code": PREORDER,         "type": "tree", "category": "Trees"},
    "postorder":   {"label": "Postorder Traversal",      "code": POSTORDER,        "type": "tree", "category": "Trees"},
    "level_order": {"label": "Level Order Traversal",    "code": LEVEL_ORDER,      "type": "tree", "category": "Trees"},
    "lca":         {"label": "Lowest Common Ancestor",   "code": LCA,              "type": "tree", "category": "Trees"},
    "bst_ops":     {"label": "BST Insert & Search",      "code": BST_INSERT_SEARCH,"type": "array","category": "Trees"},
}
