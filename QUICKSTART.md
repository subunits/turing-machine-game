# Quick Start Guide

## 30-Second Setup

```bash
pip install pygame
python game.py
```

## Your First Level (Echo)

### Problem
Copy the input exactly. Input `"ab"` should output `"ab"`.

### Understanding
- The tape starts with `a`, `b`, then blanks: `[a][b][_][_]...`
- The head begins at position 0 (reading `a`)
- You need states to process each symbol, then accept

### Solution

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

### Explanation
- State `q0` handles reading all symbols
- When we read `a`, `b`, or `c`: write it back unchanged, move right, stay in `q0`
- When we read `_` (blank): write blank, don't move, go to `accept`
- `accept` state is terminal (machine halts)

### Steps to Enter
1. Press SPACE from main menu
2. Click "Level 1: Echo"
3. Press TAB to get a template
4. Clear it and paste the JSON above
5. Press ENTER to test
6. ✓ All tests pass!

---

## Level 2: Unary Increment (Harder)

### Problem
Input: `111` (three 1s) → Output: `1111` (four 1s)

### Solution

```json
{
  "q0": {
    "1": ["q0", "1", "R"],
    "_": ["q1", "_", "L"]
  },
  "q1": {
    "1": ["q2", "1", "R"],
    "_": ["q2", "1", "R"]
  },
  "q2": {
    "_": ["accept", "1", "N"]
  },
  "accept": {}
}
```

### Walkthrough for Input `"11"`

| Step | State | Head Pos | Tape | Action |
|------|-------|----------|------|--------|
| 0 | q0 | 0 | `[1][1][_]` | Read `1`, move R |
| 1 | q0 | 1 | `[1][1][_]` | Read `1`, move R |
| 2 | q0 | 2 | `[1][1][_]` | Read `_`, move L to q1 |
| 3 | q1 | 1 | `[1][1][_]` | Read `1`, move R to q2 |
| 4 | q2 | 2 | `[1][1][_]` | Read `_`, write `1`, accept |
| **Result** | | | `[1][1][1]` | ✓ Three 1s |

---

## Common Patterns

### Pattern 1: Scan Right Until Blank
```json
{
  "q0": {
    "a": ["q0", "a", "R"],
    "b": ["q0", "b", "R"],
    "_": ["done", "_", "N"]
  }
}
```
Used in: Echo, Increment, Strip Blanks

### Pattern 2: Replace and Accept
```json
{
  "q0": {
    "a": ["q0", "X", "R"],
    "b": ["q0", "Y", "R"],
    "_": ["accept", "_", "N"]
  }
}
```
Used in: Mark Evens, Symbol Replacement

### Pattern 3: Scan Right, Then Rewind
```json
{
  "scan_right": {
    "a": ["scan_right", "a", "R"],
    "b": ["scan_right", "b", "R"],
    "_": ["rewind", "_", "L"]
  },
  "rewind": {
    "a": ["rewind", "a", "L"],
    "b": ["rewind", "b", "L"],
    "_": ["accept", "_", "R"]
  }
}
```
Used in: Strip Blanks, Reversing

---

## JSON Cheatsheet

### Basic Structure
```json
{
  "state_name": {
    "input_symbol": ["next_state", "output_symbol", "direction"]
  }
}
```

### Multiple Transitions from One State
```json
{
  "q0": {
    "a": ["q1", "X", "R"],
    "b": ["q2", "Y", "L"],
    "c": ["q0", "c", "N"],
    "_": ["accept", "_", "N"]
  }
}
```

### Important Rules
- Use `_` for blank (infinite tape of blanks to the right)
- Directions: `R` (right), `L` (left), `N` (none)
- All strings must use `"` double quotes
- No trailing commas
- State names can be anything: `q0`, `scan`, `rewind`, `compare`, etc.

---

## Debugging Tips

**"Steps" is very high (1000+)?**
- Your machine might be stuck in an infinite loop
- Add a transition to exit states without outputs

**Output is correct but "Accepted" is false?**
- You didn't end in an accept state
- Make sure final transition goes to a state in `accept_states`

**"Invalid JSON" error?**
- Copy-paste from the example slowly or use an online JSON validator
- Common mistake: single quotes `'` instead of double `"`

**Test case fails silently?**
- The machine might be halting unexpectedly
- Add transitions for all symbols your machine might read

---

## Next Steps

1. ✓ Complete Level 1 (Echo)
2. ✓ Complete Level 2 (Increment)  
3. Try Level 3 (Strip Blanks) - more complex rewinding
4. Challenge yourself with Level 4 (Palindrome) - requires two-pass logic
5. Master Level 5 (Mark Evens) - state alternation

Each level teaches new Turing machine concepts!

---

## Getting Stuck?

**Hint System**
- Each level has a hint - press ESC then reopen level to see it

**Try the Examples**
- Copy the exact JSON from this guide first
- Modify one thing at a time
- Test after each change

**Think in States**
- What does each state do?
- When does it transition?
- When does it halt?

---

Good luck, and enjoy learning automata theory! 🎮
