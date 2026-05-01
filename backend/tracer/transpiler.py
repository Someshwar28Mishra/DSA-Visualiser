"""
transpiler.py — Smart DSA code transpiler.
Converts common DSA patterns from Java / C++ / JavaScript / C# to Python
so they can be traced and visualized step-by-step.
"""

import re

# ─── Shared replacements across all C-family languages ───────────────────────
_COMMON_OPS = [
    # Comments
    (r'//(.*)$',                         r'# \1'),
    (r'/\*.*?\*/',                        r'',       re.DOTALL),
    # Boolean literals
    (r'\btrue\b',                         'True'),
    (r'\bfalse\b',                        'False'),
    (r'\bnull\b',                         'None'),
    (r'\bundefined\b',                    'None'),
    # ── C-family for loops MUST be converted BEFORE i++ is expanded ──────────
    # Standard ascending for: for (type i = start; i < end; i++)
    (r'for\s*\(\s*(?:int|long|var|let|const)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    # Standard ascending for: for (type i = start; i <= end; i++)
    (r'for\s*\(\s*(?:int|long|var|let|const)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3 + 1):'),
    # Descending for: for (type i = start; i >= end; i--)
    (r'for\s*\(\s*(?:int|long|var|let|const)\s+(\w+)\s*=\s*([^;]+);\s*\1\s*>=\s*([^;]+);\s*\1--\)',
     r'for \1 in range(\2, \3 - 1, -1):'),
    # for loop starting with existing variable (no type)
    (r'for\s*\(\s*(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    # ─────────────────────────────────────────────────────────────────────────
    # Increment / decrement (after for-loop conversion)
    (r'\+\+(\w+)',                         r'\1 += 1'),
    (r'(\w+)\+\+',                         r'\1 += 1'),
    (r'--(\w+)',                           r'\1 -= 1'),
    (r'(\w+)--',                           r'\1 -= 1'),
    # Logical ops
    (r'\|\|',                              'or'),
    (r'&&',                                'and'),
    (r'(?<![!<>])!(?!=)',                  'not '),
    # Math.min / Math.max (JS/Java)
    (r'Math\.min\(',                       'min('),
    (r'Math\.max\(',                       'max('),
    (r'Math\.abs\(',                       'abs('),
    (r'Math\.floor\(',                     'int('),
    # String
    (r'\.length\b',                        '.length_PLACEHOLDER'),
    # Array creation
    (r'new int\[(\d+)\]',                 r'[0] * \1'),
    (r'new int\[(\w+)\]',                 r'[0] * \1'),
    (r'new boolean\[(\w+)\]',             r'[False] * \1'),
    (r'new double\[(\w+)\]',              r'[0.0] * \1'),
]


# ─── Java-specific ────────────────────────────────────────────────────────────
_JAVA_OPS = [
    # ── MUST BE FIRST: strip access/storage modifiers before type stripping ──
    # e.g. 'static int x = 0' → 'int x = 0' → 'x = 0'
    (r'\b(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?=(?:int|long|double|float|char|boolean|String|var)\s+\w)', r''),
    (r'\b(?:static|final)\s+(?=(?:int|long|double|float|char|boolean|String|var)\s+\w)', r''),
    (r'\b(?:static|final)\s+(?=(?:int|long|double|float|char|boolean|String)\[\])', r''),
    # Array literal initialisers — BEFORE generic type-var stripping
    (r'\b(?:int|long|double|float)\[\]\s+(\w+)\s*=\s*\{([^}]*)\}',     r'\1 = [\2]'),
    (r'\bString\[\]\s+(\w+)\s*=\s*\{([^}]*)\}',                        r'\1 = [\2]'),
    # Strip array type from method parameters (no initialiser) → keep only the var name
    # This avoids 'int[] arr' inside parens being turned into 'arr = []'
    (r'\b(?:int|long|double|float|String)\[\]\s+(\w+)(?!\s*[=,)])',     r'\1 = []'),   # local decl (standalone)
    (r'\b(?:int|long|double|float|String)\[\]\s+(\w+)',                  r'\1'),         # in method params
    (r'\b(?:int|long|double|float)\[\]\[\]\s+(\w+)',                     r'\1 = []'),
    # Type declarations → strip (AFTER array patterns)
    (r'\b(?:int|long|double|float|char|boolean|String|var)\s+(\w+)\s*=', r'\1 ='),
    (r'\b(?:int|long|double|float|char|boolean|String)\s+(\w+)\s*;',    r'\1 = 0  # was declared'),
    # Arrays.asList
    (r'Arrays\.asList\(([^)]+)\)',                                        r'[\1]'),
    # ArrayList
    (r'List<\w+>\s+(\w+)\s*=\s*new\s+ArrayList<[^>]*>\(\)',             r'\1 = []'),
    (r'(\w+)\.add\(',                                                     r'\1.append('),
    (r'(\w+)\.get\((\w+)\)',                                              r'\1[\2]'),
    (r'(\w+)\.set\((\w+),\s*',                                           r'\1[\2] = '),
    (r'(\w+)\.size\(\)',                                                   r'len(\1)'),
    (r'(\w+)\.isEmpty\(\)',                                               r'len(\1) == 0'),
    # HashMap
    (r'Map<[^>]+>\s+(\w+)\s*=\s*new\s+HashMap<[^>]*>\(\)',              r'\1 = {}'),
    (r'(\w+)\.put\((\w+),\s*',                                           r'\1[\2] = '),
    (r'(\w+)\.containsKey\(([^)]+)\)',                                    r'\2 in \1'),
    (r'(\w+)\.getOrDefault\(([^,]+),\s*([^)]+)\)',                       r'\1.get(\2, \3)'),
    # Stack
    (r'Deque<\w+>\s+(\w+)\s*=\s*new\s+ArrayDeque<[^>]*>\(\)',          r'\1 = []'),
    (r'Stack<\w+>\s+(\w+)\s*=\s*new\s+Stack<[^>]*>\(\)',               r'\1 = []'),
    (r'(\w+)\.push\(',                                                    r'\1.append('),
    (r'(\w+)\.pop\(\)',                                                   r'\1.pop()'),
    (r'(\w+)\.peek\(\)',                                                  r'\1[-1]'),
    # Queue
    (r'Queue<\w+>\s+(\w+)\s*=\s*new\s+LinkedList<[^>]*>\(\)',          r'\1 = []'),
    (r'(\w+)\.offer\(',                                                   r'\1.append('),
    (r'(\w+)\.poll\(\)',                                                  r'\1.pop(0)'),
    # System.out
    (r'System\.out\.println\(',                                           r'print('),
    # For-each
    (r'for\s*\(\w+\s+(\w+)\s*:\s*(\w+)\)',                              r'for \1 in \2:'),
    # Standard for loop
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3 + 1):'),
    # While
    (r'while\s*\(([^{]+)\)\s*\{',                                        r'while \1:'),
    # If/else
    (r'if\s*\(([^{]+)\)\s*\{',                                           r'if \1:'),
    (r'\}\s*else\s*if\s*\(([^{]+)\)\s*\{',                              r'elif \1:'),
    (r'\}\s*else\s*\{',                                                   r'else:'),
    # Strip braces and semicolons
    (r'\{',                                                               r''),
    (r'\}',                                                               r''),
    (r';',                                                                r''),
    # return type on method signatures
    (r'(?:public|private|protected|static|void|int|long|double|String|boolean)\s+\w+\s*\([^)]*\)',
     lambda m: 'def ' + _extract_method(m.group(0))),
    # .length for arrays
    (r'\.length_PLACEHOLDER',                                             r'LENGTH_PLACEHOLDER'),
]

def _clean_param(p: str) -> str:
    """
    Extract just the variable name from a (potentially already-converted) param.
    Handles:
      'int[] arr'   -> 'arr'
      'String[] args' -> 'args'
      'arr = []'    -> 'arr'   (int[] already converted to assignment by earlier rules)
      'int n'       -> 'n'
      'arr'         -> 'arr'
    """
    p = p.strip()
    if not p:
        return ''
    # If the param was already converted to 'name = something', take only the name part
    if '=' in p:
        p = p.split('=')[0].strip()
    if not p:
        return ''
    # Take the last whitespace-delimited token, then strip any trailing [] or &
    token = p.split()[-1].strip('&').rstrip('[]').rstrip('&')
    # Ensure the result is a valid Python identifier
    if re.fullmatch(r'\w+', token):
        return token
    # Fallback: strip all non-identifier chars
    clean = re.sub(r'[^\w]', '', token)
    return clean if clean else ''


def _extract_method(sig: str) -> str:
    """Extract def-style signature from Java method signature."""
    m = re.search(r'(\w+)\s*\(([^)]*)\)', sig)
    if not m: return sig
    name = m.group(1)
    params = m.group(2)
    # Skip keywords that look like method names but aren't
    if name in ('if', 'while', 'for', 'else', 'return', 'switch', 'case'):
        return sig
    clean_parts = [_clean_param(p) for p in params.split(',')]
    clean_params = ', '.join(x for x in clean_parts if x)
    return f'{name}({clean_params}):'


# ─── C++-specific ─────────────────────────────────────────────────────────────
_CPP_OPS = [
    # ── Strip C++ storage/cv qualifiers before type stripping ──
    (r'\b(?:static|const|constexpr|inline|extern|volatile|mutable)\s+(?=(?:int|long|double|float|char|bool|auto|unsigned)\s+\w)', r''),
    # Type declarations
    (r'\b(?:int|long|long long|double|float|char|bool|auto)\s+(\w+)\s*=', r'\1 ='),
    (r'\b(?:int|long|double|float|char|bool)\s+(\w+)\s*;',               r'\1 = 0'),
    # vector
    (r'vector<\w+>\s+(\w+)\s*=\s*\{([^}]*)\}',                          r'\1 = [\2]'),
    (r'vector<\w+>\s+(\w+)\s*\((\w+),\s*(\w+)\)',                        r'\1 = [\3] * \2'),
    (r'vector<\w+>\s+(\w+)',                                              r'\1 = []'),
    (r'vector<vector<\w+>>\s+(\w+)',                                      r'\1 = []'),
    (r'(\w+)\.push_back\(',                                               r'\1.append('),
    (r'(\w+)\.pop_back\(\)',                                              r'\1.pop()'),
    (r'(\w+)\.size\(\)',                                                   r'len(\1)'),
    (r'(\w+)\.empty\(\)',                                                  r'len(\1) == 0'),
    (r'(\w+)\.front\(\)',                                                  r'\1[0]'),
    (r'(\w+)\.back\(\)',                                                   r'\1[-1]'),
    # stack/queue
    (r'stack<\w+>\s+(\w+)',                                               r'\1 = []'),
    (r'queue<\w+>\s+(\w+)',                                               r'\1 = []'),
    (r'(\w+)\.push\(',                                                    r'\1.append('),
    (r'(\w+)\.pop\(\)',                                                    r'\1.pop()'),
    (r'(\w+)\.front\(\)',                                                  r'\1[0]'),
    (r'(\w+)\.top\(\)',                                                    r'\1[-1]'),
    # unordered_map
    (r'unordered_map<[^>]+>\s+(\w+)',                                     r'\1 = {}'),
    (r'(\w+)\.find\((\w+)\)\s*!=\s*\1\.end\(\)',                         r'\2 in \1'),
    (r'(\w+)\.count\((\w+)\)',                                             r'(\2 in \1)'),
    # set
    (r'(?:unordered_set|set)<\w+>\s+(\w+)',                               r'\1 = set()'),
    (r'(\w+)\.insert\(',                                                   r'\1.add('),
    # cout
    (r'cout\s*<<\s*([^;]+)',                                              r'print(\1)'),
    # for range loop
    (r'for\s*\((?:auto|int|long)\s+(\w+)\s*:\s*(\w+)\)',                 r'for \1 in \2:'),
    # standard for
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3 + 1):'),
    # while / if / else
    (r'while\s*\(([^{]+)\)\s*\{',                                        r'while \1:'),
    (r'if\s*\(([^{]+)\)\s*\{',                                           r'if \1:'),
    (r'\}\s*else\s*if\s*\(([^{]+)\)\s*\{',                              r'elif \1:'),
    (r'\}\s*else\s*\{',                                                   r'else:'),
    # swap
    (r'swap\((\w+),\s*(\w+)\)',                                           r'\1, \2 = \2, \1'),
    # Strip braces/semicolons
    (r'\{',   r''),
    (r'\}',   r''),
    (r';',    r''),
    # function signatures
    (r'(?:void|int|long|double|bool|string|auto)\s+(\w+)\s*\(([^)]*)\)\s*\{?',
     lambda m: _cpp_func(m)),
    (r'\.length_PLACEHOLDER',                                             r'LENGTH_PLACEHOLDER'),
]

def _cpp_func(m):
    sig = m.group(0)
    name_m = re.search(r'(\w+)\s*\(', sig)
    params_m = re.search(r'\(([^)]*)\)', sig)
    if not name_m: return sig
    name = name_m.group(1)
    if name in ('if', 'while', 'for', 'else', 'return', 'switch'):
        return sig
    params = params_m.group(1) if params_m else ''
    clean_parts = [_clean_param(p) for p in params.split(',')]
    clean = ', '.join(x for x in clean_parts if x)
    return f'def {name}({clean}):'


# ─── JavaScript-specific ──────────────────────────────────────────────────────
_JS_OPS = [
    # Variable declarations
    (r'\b(?:let|const|var)\s+(\w+)\s*=',                                 r'\1 ='),
    # console.log
    (r'console\.log\(',                                                    r'print('),
    # Arrow functions → def not supported inline, convert to lambda or skip
    (r'function\s+(\w+)\s*\(([^)]*)\)\s*\{',                            r'def \1(\2):'),
    (r'const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{',                     r'def \1(\2):'),
    (r'const\s+(\w+)\s*=\s*(\w+)\s*=>\s*\{',                           r'def \1(\2):'),
    # Array methods
    (r'\.push\(',                                                          r'.append('),
    (r'\.shift\(\)',                                                       r'.pop(0)'),
    (r'\.unshift\(',                                                       r'.insert(0, '),
    (r'\.includes\(',                                                      r'.__contains__('),
    (r'\.indexOf\(',                                                       r'.index('),
    (r'\.join\(',                                                          r"'.join(map(str, "),
    # Set / Map
    (r'new Set\(\)',                                                       r'set()'),
    (r'new Map\(\)',                                                       r'{}'),
    (r'\.has\(',                                                           r'.__contains__('),
    (r'\.delete\(',                                                        r'.discard('),
    # for...of
    (r'for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(\w+)\)',            r'for \1 in \2:'),
    # for...in
    (r'for\s*\(\s*(?:const|let|var)\s+(\w+)\s+in\s+(\w+)\)',            r'for \1 in \2:'),
    # Standard for
    (r'for\s*\(\s*(?:let|var|const)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    # while / if / else
    (r'while\s*\(([^{]+)\)\s*\{',                                        r'while \1:'),
    (r'if\s*\(([^{]+)\)\s*\{',                                           r'if \1:'),
    (r'\}\s*else\s*if\s*\(([^{]+)\)\s*\{',                              r'elif \1:'),
    (r'\}\s*else\s*\{',                                                   r'else:'),
    # Strict equality
    (r'===',                                                               r'=='),
    (r'!==',                                                               r'!='),
    # Strip braces/semicolons
    (r'\{',   r''),
    (r'\}',   r''),
    (r';',    r''),
    (r'\.length_PLACEHOLDER',                                             r'LENGTH_PLACEHOLDER'),
]


# ─── C#-specific ──────────────────────────────────────────────────────────────
_CSHARP_OPS = [
    # ── Strip C# access/storage modifiers before type stripping ──
    (r'\b(?:public|private|protected|internal)\s+(?:static\s+)?(?:readonly\s+)?(?=(?:int|long|double|float|char|bool|string|var)\s+\w)', r''),
    (r'\b(?:static|readonly|const)\s+(?=(?:int|long|double|float|char|bool|string|var)\s+\w)', r''),
    # Array literal initialisers MUST come before generic type-stripping
    (r'\b(?:int|long|double|float|bool)\[\]\s+(\w+)\s*=\s*\{([^}]*)\}', r'\1 = [\2]'),
    (r'\bstring\[\]\s+(\w+)\s*=\s*\{([^}]*)\}',                         r'\1 = [\2]'),
    (r'\b(?:int|long|double|float|bool|string)\[\]\s+(\w+)',             r'\1'),  # strip array type from params
    # arr.Length (C# uses capital L) -> len(arr)
    (r'(\w+)\.Length\b',                                                  r'len(\1)'),
    # Type declarations
    (r'\b(?:int|long|double|float|char|bool|string|var)\s+(\w+)\s*=',   r'\1 ='),
    (r'\b(?:int|long|double|float|char|bool|string)\s+(\w+)\s*;',        r'\1 = 0'),
    # List<T>
    (r'List<\w+>\s+(\w+)\s*=\s*new\s+List<\w+>\(\)',                    r'\1 = []'),
    (r'(\w+)\.Add\(',                                                      r'\1.append('),
    (r'(\w+)\.Remove\((\w+)\)',                                            r'\1.remove(\2)'),
    (r'(\w+)\.Count\b',                                                    r'len(\1)'),
    (r'(\w+)\.Contains\(',                                                 r'\2 in \1' ),
    # Dictionary
    (r'Dictionary<[^>]+>\s+(\w+)\s*=\s*new\s+Dictionary<[^>]+>\(\)',    r'\1 = {}'),
    (r'(\w+)\.ContainsKey\(([^)]+)\)',                                    r'\2 in \1'),
    (r'(\w+)\.TryGetValue\(([^,]+),\s*out\s+\w+\s+(\w+)\)',             r'\3 = \1.get(\2)'),
    # Stack/Queue
    (r'Stack<\w+>\s+(\w+)\s*=\s*new\s+Stack<\w+>\(\)',                  r'\1 = []'),
    (r'Queue<\w+>\s+(\w+)\s*=\s*new\s+Queue<\w+>\(\)',                  r'\1 = []'),
    (r'(\w+)\.Push\(',                                                     r'\1.append('),
    (r'(\w+)\.Pop\(\)',                                                    r'\1.pop()'),
    (r'(\w+)\.Peek\(\)',                                                   r'\1[-1]'),
    (r'(\w+)\.Enqueue\(',                                                  r'\1.append('),
    (r'(\w+)\.Dequeue\(\)',                                                r'\1.pop(0)'),
    # Console
    (r'Console\.WriteLine\(',                                              r'print('),
    (r'Console\.Write\(',                                                  r'print('),
    # foreach
    (r'foreach\s*\(\s*(?:var|\w+)\s+(\w+)\s+in\s+(\w+)\)',              r'for \1 in \2:'),
    # for
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3):'),
    (r'for\s*\(\s*(?:int|long)\s+(\w+)\s*=\s*(\d+);\s*\1\s*<=\s*([^;]+);\s*\1\+\+\)',
     r'for \1 in range(\2, \3 + 1):'),
    # while / if / else
    (r'while\s*\(([^{]+)\)\s*\{',                                        r'while \1:'),
    (r'if\s*\(([^{]+)\)\s*\{',                                           r'if \1:'),
    (r'\}\s*else\s*if\s*\(([^{]+)\)\s*\{',                              r'elif \1:'),
    (r'\}\s*else\s*\{',                                                   r'else:'),
    # Strip braces/semicolons
    (r'\{',   r''),
    (r'\}',   r''),
    (r';',    r''),
    # method signatures
    (r'(?:public|private|protected|static|override|virtual)?\s*(?:void|int|long|double|bool|string)\s+(\w+)\s*\(([^)]*)\)',
     lambda m: _csharp_method(m)),
    (r'\.length_PLACEHOLDER',                                             r'LENGTH_PLACEHOLDER'),
]

def _csharp_method(m):
    sig = m.group(0)
    name_m = re.search(r'(\w+)\s*\(', sig)
    params_m = re.search(r'\(([^)]*)\)', sig)
    if not name_m: return sig
    name = name_m.group(1)
    # Skip control-flow keywords that can look like method names
    if name in ('if', 'while', 'for', 'else', 'return', 'switch', 'foreach'):
        return sig
    params = params_m.group(1) if params_m else ''
    clean_parts = [_clean_param(p) for p in params.split(',')]
    clean = ', '.join(x for x in clean_parts if x)
    return f'def {name}({clean}):'


_LANG_OPS = {
    'java':       _JAVA_OPS,
    'cpp':        _CPP_OPS,
    'javascript': _JS_OPS,
    'csharp':     _CSHARP_OPS,
}


def _apply_ops(code: str, ops: list) -> str:
    for op in ops:
        if len(op) == 2:
            pat, repl = op
            flags = 0
        else:
            pat, repl, flags = op
        try:
            if callable(repl):
                code = re.sub(pat, repl, code, flags=flags | re.MULTILINE)
            else:
                code = re.sub(pat, repl, code, flags=flags | re.MULTILINE)
        except Exception:
            pass
    return code


def _fix_indentation(code: str) -> str:
    """Infer Python indentation from common block keywords."""
    lines = code.splitlines()
    result = []
    indent = 0
    indent_size = 4

    for raw in lines:
        line = raw.strip()
        if not line:
            result.append('')
            continue

        # Decrease indent before else/elif/except
        if re.match(r'^(elif|else|except|finally)\b', line):
            indent = max(0, indent - indent_size)

        result.append(' ' * indent + line)

        # Increase indent after block starters
        if line.endswith(':') and not line.startswith('#'):
            indent += indent_size
        # Decrease after return/break/continue
        if re.match(r'^(return|break|continue)\b', line):
            indent = max(0, indent - indent_size)

    return '\n'.join(result)


def _fix_len(code: str) -> str:
    """Fix all .length / placeholder forms -> len(var)."""
    # Handle fused form: arrLENGTH_PLACEHOLDER (dot got eaten)
    code = re.sub(r'(\w+)LENGTH_PLACEHOLDER', r'len(\1)', code)
    # Handle dotted form: arr.LENGTH_PLACEHOLDER
    code = re.sub(r'(\w+)\.LENGTH_PLACEHOLDER', r'len(\1)', code)
    # Handle dotted form: arr.length_PLACEHOLDER
    code = re.sub(r'(\w+)\.length_PLACEHOLDER', r'len(\1)', code)
    # Handle any remaining .length
    code = re.sub(r'(\w+)\.length\b', r'len(\1)', code)
    return code


def transpile_to_python(code: str, lang: str) -> dict:
    """
    Transpile code written in lang to Python.
    Returns { python_code, warnings }.
    """
    lang = lang.lower()
    if lang == 'python':
        return {'python_code': code, 'warnings': []}

    lang_ops = _LANG_OPS.get(lang)
    if not lang_ops:
        return {'python_code': code, 'warnings': [f'Language {lang} not supported for transpilation']}

    warnings = []
    result = code

    # 0. Strip raw boilerplate FIRST — before any regex that could corrupt it.
    #    e.g. _COMMON_OPS has (\w+)\+\+ which turns stdc++ → stdc += 1 inside #include lines.
    result = re.sub(r'#include\s*<[^>]+>',        '', result)
    result = re.sub(r'#include\s*"[^"]+"',        '', result)
    result = re.sub(r'using\s+namespace\s+\w+;?', '', result)
    result = re.sub(r'import\s+[\w.*]+\s*;?',     '', result)
    result = re.sub(r'using\s+[\w.]+;?',          '', result)
    result = re.sub(r'@Override',                  '', result)
    # Strip JavaScript IIFE wrapper: (function main() { ... })();
    result = re.sub(r'^\s*\(function\s+\w+\s*\(\s*\)\s*\{',  '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*\}\)\s*\(\s*\)\s*;?\s*$',           '', result, flags=re.MULTILINE)
    # Strip class declarations (Java / C# / C++)
    result = re.sub(r'(?:public\s+)?(?:class|interface)\s+\w+[^{]*\{?', '', result)

    # 1. Common ops (booleans, math, for-loop conversion, array creation)
    result = _apply_ops_tuple(result, _COMMON_OPS)

    # 2. Language-specific ops
    result = _apply_ops_tuple(result, lang_ops)

    # 3. Fix length
    result = _fix_len(result)

    # 4. Fix indentation
    result = _fix_indentation(result)

    # 5. Clean up blank lines (max 2 consecutive)
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = result.strip()

    # Warn about things that might not convert cleanly
    if 'class ' in code:
        warnings.append('Class definitions were stripped — only the method body is transpiled.')
    if 'new ' in code:
        warnings.append('Some "new" expressions may not have converted perfectly.')

    return {'python_code': result, 'warnings': warnings}



def _apply_ops_tuple(code: str, ops: list) -> str:
    """Apply a list of (pattern, replacement[, flags]) tuples."""
    for op in ops:
        pat = op[0]
        repl = op[1]
        flags = op[2] if len(op) > 2 else 0
        try:
            code = re.sub(pat, repl, code, flags=re.MULTILINE | flags)
        except Exception:
            pass
    return code
