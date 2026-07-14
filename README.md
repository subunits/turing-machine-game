# Turing Machine: Puzzle Game

A visual puzzle game where you design Turing machine state transitions to solve computational challenges. Learn automata theory through interactive problem-solving.

## Installation

### Requirements
- Python 3.7+
- Pygame

### Setup

```bash
# Install dependencies
pip install pygame

# Run the game
python game.py
```

## How to Play

### Overview
Each level presents a computational challenge. Your task is to configure the Turing machine's state transitions (in JSON format) to transform an input tape according to the problem requirements.

### Game Flow

1. **Main Menu**: Start the game, read instructions, or quit
2. **Level Select**: Choose which puzzle to tackle
3. **Level Editor**: Define your state transitions
4. **Test Review**: See if your solution passes all test cases
5. **Level Complete**: Move to the next challenge

### Understanding Turing Machines

A Turing machine processes a tape symbol-by-symbol using states and transitions:

```
States: q0 (initial) → q1 → accept (final)
Tape:   [a][b][_][_]...
Head:    ↑
```

Each transition is defined as:
```
"current_state": {
    "input_symbol": ["next_state", "output_symbol", "direction"]
}
```

### Transition Format

```json
{
  "q0": {
    "a": ["q1", "X", "R"],    // Read 'a', go to q1, write 'X', move Right
    "b": ["reject", "b", "N"], // Read 'b', reject, write 'b', don't move
    "_": ["accept", "_", "N"]  // Read blank, accept, write blank, don't move
  },
  "q1": {
    "a": ["q1", "a", "R"],
    "b": ["q2", "b", "R"],
    "_": ["accept", "_", "N"]
  },
  "q2": {
    "a": ["reject", "a", "N"]
  }
}
```

**Directions:**
- `R`: Move head Right
- `L`: Move head Left  
- `N`: Don't move (No move)

**Special symbols:**
- `_`: Blank symbol (infinite tape of blanks)

## Levels

### Level 1: Echo
**Goal**: Copy the input tape exactly

Test cases:
- `"a"` → `"a"`
- `"ab"` → `"ab"`
- `"aaa"` → `"aaa"`

**Strategy**: Read each symbol, move right, and eventually accept when you reach a blank.

### Level 2: Unary Increment
**Goal**: Add one to a unary number (string of 1s)

Test cases:
- `"1"` → `"11"`
- `"11"` → `"111"`
- `"111"` → `"1111"`

**Strategy**: Scan right past all 1s, write an additional 1, then accept.

### Level 3: Strip Trailing Blanks
**Goal**: Remove trailing blanks from the tape

Test cases:
- `"a___"` → `"a"`
- `"ab___"` → `"ab"`
- `"abc___"` → `"abc"`

**Strategy**: Scan right to find the end, move back to the last non-blank, then accept.

### Level 4: Palindrome Check
**Goal**: Verify if input is a palindrome

Test cases:
- `"a"` → `"a"` (accept)
- `"aa"` → `"aa"` (accept)
- `"aba"` → `"aba"` (accept)

**Strategy**: Compare symbols from outside-in, reject if any don't match.

### Level 5: Mark Evens
**Goal**: Convert even-indexed symbols to uppercase

Test cases:
- `"abab"` → `"AbAb"`
- `"aaaa"` → `"AaAa"`
- `"abc"` → `"AbC"`

**Strategy**: Alternate between states processing even and odd positions.

## Controls

| Key | Action |
|-----|--------|
| **SPACE** | Start playing / Next level |
| **ENTER** | Test your solution |
| **R** | Retry (after failed test) |
| **TAB** | Load template for current level |
| **ESC** | Go back / Return to menu |
| **Click** | Select level in level select screen |

## Tips for Success

1. **Start Simple**: Begin with Level 1 (Echo) to understand the format
2. **Use Templates**: Press TAB to get a skeleton with required states
3. **Test Often**: Press ENTER to test and see which test cases fail
4. **Read Errors**: JSON syntax errors are displayed—fix them carefully
5. **Think Step-by-Step**: 
   - What states do I need?
   - What transitions between them?
   - What symbols trigger what?
   - When do I halt (accept/reject)?

## Example Solution: Echo (Level 1)

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

This reads each symbol and moves right, accepting when it hits a blank.

## JSON Tips

- **Proper Formatting**: Use consistent spacing and indentation
- **Quotes**: Always use double quotes for keys and values
- **Commas**: Separate items with commas (not after the last item)
- **Brackets**: Arrays `[]`, Objects `{}`

Valid JSON:
```json
{"q0": {"a": ["q1", "x", "R"]}}
```

Invalid JSON:
```json
{q0: {a: [q1, x, R]}}  // Missing quotes
{'q0': {'a': ['q1', 'x', 'R']}}  // Single quotes not valid
```

## Game Architecture

- **`turing_machine.py`**: Core Turing machine simulator
- **`game_levels.py`**: Level definitions and test validation
- **`transition_editor.py`**: JSON transition editor UI component
- **`game.py`**: Main game controller and display logic

## Extending the Game

### Add New Levels

Edit `game_levels.py` and add to the `LEVELS` list:

```python
{
    "id": 6,
    "name": "Your Challenge Name",
    "description": "What the machine should do",
    "hint": "A helpful hint for the player",
    "test_cases": [
        {"input": "a", "expected": "b", "description": "Test description"}
    ],
    "starter_transitions": {"q0": {}, "accept": {}},
    "initial_state": "q0",
    "accept_states": ["accept"],
    "reject_states": ["reject"],
}
```

### Customize Appearance

Colors and fonts can be adjusted in `game.py`:

```python
COLORS = {
    'bg': (15, 15, 25),  # Background
    'accent': (100, 200, 255),  # Highlights
    'success': (100, 255, 150),  # Completion
    # ...
}
```

## Learning Resources

- **Turing Machines**: https://en.wikipedia.org/wiki/Turing_machine
- **Automata Theory**: https://en.wikipedia.org/wiki/Automata_theory
- **Computability**: https://en.wikipedia.org/wiki/Computability_theory

## Troubleshooting

**"JSON Error" when testing**
- Check for missing commas between items
- Ensure all strings use double quotes
- Verify brackets and braces are balanced

**Machine doesn't accept but should**
- Verify you reach an accept state
- Check that initial state matches `"initial_state"`
- Ensure all used symbols have transitions

**Tape not transforming correctly**
- Review which symbol triggers each transition
- Check output symbol in transition (3rd element)
- Verify head direction (R/L/N)

**Game crashes**
- Ensure Python 3.7+ is installed
- Reinstall pygame: `pip install --upgrade pygame`
- Run with: `python3 game.py`

## Future Enhancements

- [ ] Visual state diagram editor
- [ ] Animation of tape head movement
- [ ] Save/load solutions
- [ ] Leaderboards by efficiency (fewest states)
- [ ] Custom challenge creator
- [ ] Multi-tape Turing machines
- [ ] Sound effects and music
- [ ] Difficulty levels (easy/medium/hard)
- [ ] Tutorial mode with guided levels

## License

Educational project - feel free to modify and extend!

## Credits

Built as an interactive learning tool for automata theory and theoretical computer science.
