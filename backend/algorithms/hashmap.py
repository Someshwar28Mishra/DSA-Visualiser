"""
algorithms/hashmap.py — HashMap / Hash Table algorithms.
"""

HASHMAP_OPS = """\
hashmap = {}

# Insert
hashmap['apple'] = 5
hashmap['banana'] = 3
hashmap['cherry'] = 8
hashmap['date'] = 2
hashmap['elderberry'] = 6

# Search
found = hashmap.get('banana', -1)
missing = hashmap.get('fig', -1)

# Update
hashmap['banana'] = 10

# Delete
del hashmap['date']

# Frequency count use case
words = ['cat', 'dog', 'cat', 'bird', 'dog', 'cat']
freq = {}
for word in words:
    freq[word] = freq.get(word, 0) + 1
"""

TWO_SUM = """\
nums = [2, 7, 11, 15]
target = 9
hashmap = {}
result = []

for i in range(len(nums)):
    complement = target - nums[i]
    if complement in hashmap:
        result = [hashmap[complement], i]
        break
    hashmap[nums[i]] = i
"""

SUBARRAY_SUM_K = """\
nums = [1, 1, 1, 2, 3, -1, 2]
k = 3
hashmap = {0: 1}
prefix_sum = 0
count = 0

for i in range(len(nums)):
    prefix_sum += nums[i]
    needed = prefix_sum - k
    if needed in hashmap:
        count += hashmap[needed]
    hashmap[prefix_sum] = hashmap.get(prefix_sum, 0) + 1
"""

LONGEST_CONSECUTIVE = """\
nums = [100, 4, 200, 1, 3, 2, 5, 6]
num_set = set(nums)
hashmap = {n: True for n in nums}
longest = 0

for n in nums:
    if n - 1 not in num_set:
        current = n
        length = 1
        while current + 1 in num_set:
            current += 1
            length += 1
        if length > longest:
            longest = length
"""

GROUP_ANAGRAMS = """\
words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']
hashmap = {}

for word in words:
    key = ''.join(sorted(word))
    if key not in hashmap:
        hashmap[key] = []
    hashmap[key].append(word)

groups = list(hashmap.values())
"""

TOP_K_FREQUENT = """\
nums = [1, 1, 1, 2, 2, 3, 4, 4, 4, 4]
k = 2

freq = {}
for n in nums:
    freq[n] = freq.get(n, 0) + 1

# Sort by frequency descending
sorted_freq = sorted(freq.items(), key=lambda x: x[1], reverse=True)
result = [item[0] for item in sorted_freq[:k]]
"""

ALGORITHMS = {
    "hashmap_ops":         {"label": "HashMap Insert/Search/Delete","code": HASHMAP_OPS,       "type": "hashmap", "category": "HashMap"},
    "two_sum":             {"label": "Two Sum",                    "code": TWO_SUM,           "type": "hashmap", "category": "HashMap"},
    "subarray_sum_k":      {"label": "Subarray Sum Equals K",      "code": SUBARRAY_SUM_K,    "type": "hashmap", "category": "HashMap"},
    "longest_consecutive": {"label": "Longest Consecutive Sequence","code": LONGEST_CONSECUTIVE,"type":"hashmap", "category": "HashMap"},
    "group_anagrams":      {"label": "Group Anagrams",             "code": GROUP_ANAGRAMS,    "type": "hashmap", "category": "HashMap"},
    "top_k_frequent":      {"label": "Top K Frequent Elements",    "code": TOP_K_FREQUENT,    "type": "hashmap", "category": "HashMap"},
}
