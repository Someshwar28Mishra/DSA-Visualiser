"""
algorithms/strings.py — String algorithm templates.
"""

KMP = """\
def compute_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1
    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length != 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    return lps

def kmp_search(text, pattern):
    lps = compute_lps(pattern)
    matches = []
    i = j = 0
    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1
        if j == len(pattern):
            matches.append(i - j)
            j = lps[j - 1]
        elif i < len(text) and text[i] != pattern[j]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
    return matches

text = "ABABDABACDABABCABAB"
pattern = "ABABCABAB"
matches = kmp_search(text, pattern)
"""

RABIN_KARP = """\
def rabin_karp(text, pattern, q=101):
    d = 256
    m = len(pattern)
    n = len(text)
    h = pow(d, m - 1, q)
    p_hash = 0
    t_hash = 0
    matches = []

    for i in range(m):
        p_hash = (d * p_hash + ord(pattern[i])) % q
        t_hash = (d * t_hash + ord(text[i])) % q

    for i in range(n - m + 1):
        if p_hash == t_hash:
            if text[i:i + m] == pattern:
                matches.append(i)
        if i < n - m:
            t_hash = (d * (t_hash - ord(text[i]) * h) + ord(text[i + m])) % q
            if t_hash < 0:
                t_hash += q

    return matches

text = "GEEKS FOR GEEKS"
pattern = "GEEKS"
matches = rabin_karp(text, pattern)
"""

Z_ALGORITHM = """\
def z_function(s):
    n = len(s)
    z = [0] * n
    z[0] = n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def z_search(text, pattern):
    concat = pattern + "$" + text
    z = z_function(concat)
    matches = []
    for i in range(len(pattern) + 1, len(concat)):
        if z[i] == len(pattern):
            matches.append(i - len(pattern) - 1)
    return matches

text = "aabxaabxcaabxaaabx"
pattern = "aabx"
matches = z_search(text, pattern)
"""

ALGORITHMS = {
    "kmp":         {"label": "KMP Algorithm",   "code": KMP,         "type": "array", "category": "String Algorithms"},
    "rabin_karp":  {"label": "Rabin-Karp",      "code": RABIN_KARP,  "type": "array", "category": "String Algorithms"},
    "z_algorithm": {"label": "Z Algorithm",     "code": Z_ALGORITHM, "type": "array", "category": "String Algorithms"},
}
