"""
Puzzle levels for the Turing Machine game
"""

LEVELS = [
    {
        "id": 1,
        "name": "Echo",
        "description": "Copy the input tape exactly",
        "hint": "Move right reading input, write same symbol, reach accept state",
        "test_cases": [
            {"input": "a", "expected": "a", "description": "Single symbol"},
            {"input": "ab", "expected": "ab", "description": "Two symbols"},
            {"input": "aaa", "expected": "aaa", "description": "Three symbols"},
        ],
        "starter_transitions": {
            "q0": {},  # Player fills this in
            "accept": {}
        },
        "initial_state": "q0",
        "accept_states": ["accept"],
        "reject_states": ["reject"],
    },
    {
        "id": 2,
        "name": "Unary Increment",
        "description": "Add one to a unary number (string of 1s)",
        "hint": "Scan to the right end, write one more 1, then accept",
        "test_cases": [
            {"input": "1", "expected": "11", "description": "One becomes two"},
            {"input": "11", "expected": "111", "description": "Two becomes three"},
            {"input": "111", "expected": "1111", "description": "Three becomes four"},
        ],
        "starter_transitions": {
            "q0": {},  # Player fills this in
            "accept": {}
        },
        "initial_state": "q0",
        "accept_states": ["accept"],
        "reject_states": ["reject"],
    },
    {
        "id": 3,
        "name": "Strip Trailing Blanks",
        "description": "Remove all trailing blanks from the tape",
        "hint": "Scan to the right, replace blanks with blanks, move left at the end",
        "test_cases": [
            {"input": "a___", "expected": "a", "description": "One symbol with blanks"},
            {"input": "ab___", "expected": "ab", "description": "Two symbols with blanks"},
            {"input": "abc___", "expected": "abc", "description": "Three symbols with blanks"},
        ],
        "starter_transitions": {
            "scan": {},
            "rewind": {},
            "accept": {}
        },
        "initial_state": "scan",
        "accept_states": ["accept"],
        "reject_states": ["reject"],
    },
    {
        "id": 4,
        "name": "Reverse Polish Check",
        "description": "Verify the input is palindromic (reads same forwards and backwards)",
        "hint": "Compare first and last symbols iteratively, moving inward",
        "test_cases": [
            {"input": "a", "expected": "a", "description": "Single symbol (always palindrome)"},
            {"input": "aa", "expected": "aa", "description": "Two identical symbols"},
            {"input": "aba", "expected": "aba", "description": "Classic palindrome"},
        ],
        "starter_transitions": {
            "check_left": {},
            "check_right": {},
            "accept": {},
            "reject": {}
        },
        "initial_state": "check_left",
        "accept_states": ["accept"],
        "reject_states": ["reject"],
    },
    {
        "id": 5,
        "name": "Mark Evens",
        "description": "Convert even-indexed symbols to uppercase, keep odd-indexed as-is",
        "hint": "Alternate between processing even and odd positions",
        "test_cases": [
            {"input": "abab", "expected": "AbAb", "description": "Alternating pattern"},
            {"input": "aaaa", "expected": "AaAa", "description": "Repeated symbol"},
            {"input": "abc", "expected": "AbC", "description": "Ascending pattern"},
        ],
        "starter_transitions": {
            "q0": {},
            "q1": {},
            "accept": {}
        },
        "initial_state": "q0",
        "accept_states": ["accept"],
        "reject_states": ["reject"],
    },
]

def get_level(level_id):
    """Get a level by ID"""
    for level in LEVELS:
        if level["id"] == level_id:
            return level
    return None

def get_all_levels():
    """Get all levels"""
    return LEVELS

def validate_solution(machine, test_cases, max_steps=1000):
    """
    Test a machine against all test cases
    Returns (passed, total, results)
    """
    results = []
    passed = 0
    
    for test_case in test_cases:
        input_tape = test_case["input"]
        expected_output = test_case["expected"]
        description = test_case["description"]
        
        machine.initialize(input_tape)
        machine.run_to_completion(max_steps)
        
        actual_output = machine.get_tape_string()
        test_passed = actual_output == expected_output and machine.accepted
        
        if test_passed:
            passed += 1
        
        results.append({
            "description": description,
            "input": input_tape,
            "expected": expected_output,
            "actual": actual_output,
            "passed": test_passed,
            "accepted": machine.accepted,
            "steps": machine.step_count
        })
    
    return passed, len(test_cases), results
