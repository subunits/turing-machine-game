class TuringMachine:
    def __init__(self, transitions, initial_state, accept_states, reject_states=None):
        """
        transitions: dict of form {state: {symbol: (new_state, write_symbol, direction)}}
        initial_state: starting state
        accept_states: list of accepting states
        reject_states: list of rejecting states (optional)
        """
        self.transitions = transitions
        self.initial_state = initial_state
        self.accept_states = accept_states
        self.reject_states = reject_states or []
        
        self.tape = []
        self.head_position = 0
        self.current_state = initial_state
        self.history = []
        self.halted = False
        self.accepted = False
        self.step_count = 0
        
    def initialize(self, input_tape):
        """Load an input onto the tape"""
        self.tape = list(input_tape)
        self.head_position = 0
        self.current_state = self.initial_state
        self.history = []
        self.halted = False
        self.accepted = False
        self.step_count = 0
        
    def get_symbol_at_head(self):
        """Get the symbol under the tape head"""
        if 0 <= self.head_position < len(self.tape):
            return self.tape[self.head_position]
        return '_'  # Blank symbol
        
    def step(self):
        """Execute one step of the machine"""
        if self.halted:
            return False
            
        symbol = self.get_symbol_at_head()
        
        # Check if we can transition
        if self.current_state not in self.transitions:
            self.halted = True
            self.accepted = self.current_state in self.accept_states
            return False
            
        if symbol not in self.transitions[self.current_state]:
            self.halted = True
            self.accepted = self.current_state in self.accept_states
            return False
        
        # Record history
        self.history.append({
            'state': self.current_state,
            'head_pos': self.head_position,
            'tape': self.tape.copy(),
            'symbol': symbol
        })
        
        # Execute transition
        new_state, write_symbol, direction = self.transitions[self.current_state][symbol]
        
        # Write to tape
        if self.head_position >= len(self.tape):
            self.tape.extend(['_'] * (self.head_position - len(self.tape) + 1))
        self.tape[self.head_position] = write_symbol
        
        # Move head
        if direction == 'L':
            self.head_position -= 1
        elif direction == 'R':
            self.head_position += 1
        
        # Update state
        self.current_state = new_state
        self.step_count += 1
        
        # Check for halt
        if self.current_state in self.accept_states or self.current_state in self.reject_states:
            self.halted = True
            self.accepted = self.current_state in self.accept_states
            return False
            
        return True
    
    def run_to_completion(self, max_steps=1000):
        """Run the machine until it halts or max_steps is reached"""
        step = 0
        while step < max_steps and not self.halted:
            if not self.step():
                break
            step += 1
        return self.accepted
    
    def get_tape_string(self):
        """Get current tape content as string"""
        return ''.join(self.tape).rstrip('_') or '_'
