# Example Solutions

These are reference solutions for each level. Try to solve them yourself first!

---

## Level 1: Echo

**Problem**: Copy the input tape exactly

**Approach**: Read each symbol and move right, accept when you hit blank

```json
{
  "q0": {
    "a": ["q0", "a", "R"],
    "b": ["q0", "b", "R"],
    "c": ["q0", "c", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {}
}
```

**Why it works**:
- `q0` reads any symbol, writes it back unchanged
- Move right each time
- Accept when hitting blank (end of input)

**Alternative** (More generic):
```json
{
  "q0": {
    "a": ["q0", "a", "R"],
    "b": ["q0", "b", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {}
}
```

---

## Level 2: Unary Increment

**Problem**: Add one to a unary number (e.g., `111` → `1111`)

**Approach**: 
1. Scan right past all `1`s
2. When you hit blank, replace it with `1`
3. Accept

```json
{
  "q0": {
    "1": ["q0", "1", "R"],
    "_": ["q1", "_", "L"]
  },
  "q1": {
    "1": ["q1", "1", "R"],
    "_": ["accept", "1", "N"]
  },
  "accept": {}
}
```

**Why it works**:
- `q0`: Scan right over all `1`s, when you hit `_`, move left to `q1`
- `q1`: Move right past the first `1`, then write a new `1` and accept

**Alternative** (Simpler):
```json
{
  "q0": {
    "1": ["q0", "1", "R"],
    "_": ["accept", "1", "N"]
  },
  "accept": {}
}
```

This replaces the blank immediately, which also works!

---

## Level 3: Strip Trailing Blanks

**Problem**: Remove trailing blanks (e.g., `"a___"` → `"a"`)

**Approach**:
1. Scan right to find the end
2. Scan back left to find the last non-blank
3. Accept when positioned correctly

```json
{
  "scan": {
    "a": ["scan", "a", "R"],
    "b": ["scan", "b", "R"],
    "c": ["scan", "c", "R"],
    "_": ["rewind", "_", "L"]
  },
  "rewind": {
    "a": ["accept", "a", "N"],
    "b": ["accept", "b", "N"],
    "c": ["accept", "c", "N"],
    "_": ["rewind", "_", "L"]
  },
  "accept": {}
}
```

**Why it works**:
- `scan`: Move right until hitting blank
- `rewind`: Move left until hitting a non-blank symbol
- `accept`: Halt positioned at the last real symbol

---

## Level 4: Palindrome Check

**Problem**: Verify if input is palindromic (reads same forwards and backwards)

**Approach**:
1. Compare leftmost and rightmost symbols
2. Move inward
3. Accept if all match, reject if any differ

```json
{
  "check_left": {
    "a": ["mark_left", "X", "R"],
    "b": ["mark_left", "Y", "R"],
    "c": ["mark_left", "Z", "R"],
    "X": ["check_left", "X", "R"],
    "Y": ["check_left", "Y", "R"],
    "Z": ["check_left", "Z", "R"],
    "_": ["accept", "_", "N"]
  },
  "mark_left": {
    "_": ["find_right", "_", "L"],
    "X": ["mark_left", "X", "R"],
    "Y": ["mark_left", "Y", "R"],
    "Z": ["mark_left", "Z", "R"]
  },
  "find_right": {
    "X": ["check_right", "X", "L"],
    "Y": ["check_right", "Y", "L"],
    "Z": ["check_right", "Z", "L"],
    "_": ["find_right", "_", "L"],
    "a": ["find_right", "a", "L"],
    "b": ["find_right", "b", "L"],
    "c": ["find_right", "c", "L"]
  },
  "check_right": {
    "a": ["next_pair", "X", "L"],
    "b": ["next_pair", "Y", "L"],
    "c": ["next_pair", "Z", "L"],
    "X": ["check_right", "X", "L"],
    "Y": ["check_right", "Y", "L"],
    "Z": ["check_right", "Z", "L"],
    "_": ["reject", "_", "N"]
  },
  "next_pair": {
    "X": ["next_pair", "X", "L"],
    "Y": ["next_pair", "Y", "L"],
    "Z": ["next_pair", "Z", "L"],
    "a": ["check_left", "X", "R"],
    "b": ["check_left", "Y", "R"],
    "c": ["check_left", "Z", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {},
  "reject": {}
}
```

**Simpler Version** (For 2-symbol alphabet):
```json
{
  "q0": {
    "a": ["mark_a", "X", "R"],
    "b": ["mark_b", "X", "R"],
    "X": ["q0", "X", "R"],
    "_": ["accept", "_", "N"]
  },
  "mark_a": {
    "X": ["mark_a", "X", "R"],
    "_": ["check_a", "_", "L"],
    "a": ["mark_a", "a", "R"],
    "b": ["mark_a", "b", "R"]
  },
  "mark_b": {
    "X": ["mark_b", "X", "R"],
    "_": ["check_b", "_", "L"],
    "a": ["mark_b", "a", "R"],
    "b": ["mark_b", "b", "R"]
  },
  "check_a": {
    "a": ["rewind_a", "X", "L"],
    "X": ["check_a", "X", "L"],
    "b": ["reject", "b", "N"],
    "_": ["reject", "_", "N"]
  },
  "check_b": {
    "b": ["rewind_b", "X", "L"],
    "X": ["check_b", "X", "L"],
    "a": ["reject", "a", "N"],
    "_": ["reject", "_", "N"]
  },
  "rewind_a": {
    "X": ["rewind_a", "X", "L"],
    "a": ["q0", "X", "R"],
    "b": ["q0", "X", "R"],
    "_": ["q0", "X", "R"]
  },
  "rewind_b": {
    "X": ["rewind_b", "X", "L"],
    "a": ["q0", "X", "R"],
    "b": ["q0", "X", "R"],
    "_": ["q0", "X", "R"]
  },
  "accept": {},
  "reject": {}
}
```

---

## Level 5: Mark Evens

**Problem**: Convert even-indexed symbols to uppercase (e.g., `"abab"` → `"AbAb"`)

**Approach**:
1. Process even positions (0, 2, 4...): convert to uppercase
2. Process odd positions (1, 3, 5...): leave as-is
3. Alternate between states

```json
{
  "q0": {
    "a": ["q1", "A", "R"],
    "b": ["q1", "B", "R"],
    "c": ["q1", "C", "R"],
    "_": ["accept", "_", "N"]
  },
  "q1": {
    "a": ["q0", "a", "R"],
    "b": ["q0", "b", "R"],
    "c": ["q0", "c", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {}
}
```

**Why it works**:
- `q0` (even position): Read symbol, convert to uppercase, move right, go to `q1`
- `q1` (odd position): Read symbol, keep as lowercase, move right, go back to `q0`
- Alternate automatically processes correct positions
- Accept when hitting blank

**Alternative** (More compact):
```json
{
  "even": {
    "a": ["odd", "A", "R"],
    "b": ["odd", "B", "R"],
    "c": ["odd", "C", "R"],
    "_": ["accept", "_", "N"]
  },
  "odd": {
    "a": ["even", "a", "R"],
    "b": ["even", "b", "R"],
    "c": ["even", "c", "R"],
    "_": ["accept", "_", "N"]
  },
  "accept": {}
}
```

---

## Tips for Writing Solutions

### Think in States
- What is the machine doing at each state?
- When does it transition?
- How does it halt?

### Handle All Cases
- Don't forget the blank symbol `_`
- If a symbol appears in input, handle it in all relevant states
- Make sure you reach an accept or reject state

### Test Edge Cases
- Empty input (just `_`)
- Single character
- Maximum length

### Optimize (After it works)
- Can you merge states?
- Can you use fewer transitions?
- Can you reach accept faster?

---

## If You're Still Stuck

1. **Read the hint** carefully - it often tells you the strategy
2. **Trace through manually**: Write out a tape and simulate by hand
3. **Build incrementally**: Get one test case working, then extend
4. **Ask yourself questions**:
   - What symbols do I need to handle?
   - How many passes over the tape?
   - When do I stop?

Remember: There are many correct solutions! The examples here are just one way to solve each problem.
