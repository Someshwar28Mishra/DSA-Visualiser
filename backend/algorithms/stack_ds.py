"""
algorithms/stack_ds.py — Stack data structure algorithms.
"""

STACK_OPS = """\
stack = []

# Push operations
stack.append(10)
stack.append(25)
stack.append(7)
stack.append(42)
stack.append(18)

# Peek top
top = stack[-1] if stack else None

# Pop operations
popped = stack.pop()
popped2 = stack.pop()

# Peek again
top = stack[-1] if stack else None
"""

BALANCED_PARENS = """\
s = "({[({})]})"
stack = []
result = True
i = 0

while i < len(s):
    char = s[i]
    if char in '({[':
        stack.append(char)
    elif char in ')}]':
        if not stack:
            result = False
            break
        top = stack.pop()
        if (char == ')' and top != '(') or \
           (char == '}' and top != '{') or \
           (char == ']' and top != '['):
            result = False
            break
    i += 1

result = result and len(stack) == 0
"""

NEXT_GREATER = """\
arr = [4, 5, 2, 25, 7, 8, 6, 3]
n = len(arr)
nge = [-1] * n
stack = []

for i in range(n - 1, -1, -1):
    while stack and stack[-1] <= arr[i]:
        stack.pop()
    if stack:
        nge[i] = stack[-1]
    stack.append(arr[i])
"""

INFIX_TO_POSTFIX = """\
def precedence(op):
    if op in ('+', '-'): return 1
    if op in ('*', '/'): return 2
    return 0

infix = "A+B*C-D/E"
stack = []
postfix = []

for char in infix:
    if char.isalpha():
        postfix.append(char)
    elif char == '(':
        stack.append(char)
    elif char == ')':
        while stack and stack[-1] != '(':
            postfix.append(stack.pop())
        if stack:
            stack.pop()
    else:
        while stack and precedence(stack[-1]) >= precedence(char):
            postfix.append(stack.pop())
        stack.append(char)

while stack:
    postfix.append(stack.pop())

result = ''.join(postfix)
"""

EVAL_POSTFIX = """\
postfix = "231*+9-"
stack = []

for char in postfix:
    if char.isdigit():
        stack.append(int(char))
    else:
        b = stack.pop()
        a = stack.pop()
        if char == '+': stack.append(a + b)
        elif char == '-': stack.append(a - b)
        elif char == '*': stack.append(a * b)
        elif char == '/': stack.append(a // b)

result = stack[0]
"""

MIN_STACK = """\
stack = []
min_stack = []

def push(val):
    stack.append(val)
    if not min_stack or val <= min_stack[-1]:
        min_stack.append(val)

def pop():
    val = stack.pop()
    if val == min_stack[-1]:
        min_stack.pop()
    return val

def get_min():
    return min_stack[-1] if min_stack else None

push(5)
push(3)
push(7)
push(2)
push(4)
current_min = get_min()
pop()
current_min = get_min()
pop()
current_min = get_min()
"""

LARGEST_RECT_HISTOGRAM = """\
heights = [2, 1, 5, 6, 2, 3]
n = len(heights)
stack = []
max_area = 0
i = 0

while i <= n:
    h = 0 if i == n else heights[i]
    while stack and heights[stack[-1]] > h:
        height = heights[stack.pop()]
        width = i if not stack else i - stack[-1] - 1
        area = height * width
        if area > max_area:
            max_area = area
    stack.append(i)
    i += 1
"""

DAILY_TEMPERATURES = """\
temps = [73, 74, 75, 71, 69, 72, 76, 73]
n = len(temps)
wait = [0] * n
stack = []

for i in range(n):
    while stack and temps[i] > temps[stack[-1]]:
        idx = stack.pop()
        wait[idx] = i - idx
    stack.append(i)
"""

ALGORITHMS = {
    "stack_ops":        {"label": "Stack Push/Pop/Peek",         "code": STACK_OPS,            "type": "stack", "category": "Stack"},
    "balanced_parens":  {"label": "Balanced Parentheses",        "code": BALANCED_PARENS,      "type": "stack", "category": "Stack"},
    "next_greater":     {"label": "Next Greater Element",        "code": NEXT_GREATER,         "type": "stack", "category": "Stack"},
    "infix_postfix":    {"label": "Infix → Postfix Conversion",  "code": INFIX_TO_POSTFIX,     "type": "stack", "category": "Stack"},
    "eval_postfix":     {"label": "Evaluate Postfix Expression", "code": EVAL_POSTFIX,         "type": "stack", "category": "Stack"},
    "min_stack":        {"label": "Min Stack (Design)",          "code": MIN_STACK,            "type": "stack", "category": "Stack"},
    "largest_rect":     {"label": "Largest Rectangle in Histogram","code": LARGEST_RECT_HISTOGRAM,"type": "stack","category": "Stack"},
    "daily_temps":      {"label": "Daily Temperatures",          "code": DAILY_TEMPERATURES,   "type": "stack", "category": "Stack"},
}
