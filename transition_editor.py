import pygame
import json
from turing_machine import TuringMachine
from game_levels import get_level, validate_solution

COLORS = {
    'bg': (20, 20, 30),
    'text': (220, 220, 220),
    'accent': (100, 200, 255),
    'success': (100, 255, 150),
    'error': (255, 100, 100),
    'warning': (255, 200, 100),
    'input_bg': (40, 40, 60),
    'input_border': (100, 100, 150),
    'border': (80, 80, 120),
}

class TransitionEditorUI:
    def __init__(self, width=1200, height=800):
        self.width = width
        self.height = height
        self.font_normal = pygame.font.Font(None, 20)
        self.font_small = pygame.font.Font(None, 16)
        self.font_title = pygame.font.Font(None, 28)
        
        # Editor state
        self.input_text = ""
        self.cursor_pos = 0
        self.active = True
        self.error_message = ""
        self.last_valid_json = None
        
    def handle_event(self, event):
        """Handle keyboard input for the editor"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_BACKSPACE:
                self.input_text = self.input_text[:max(0, self.cursor_pos-1)] + self.input_text[self.cursor_pos:]
                self.cursor_pos = max(0, self.cursor_pos - 1)
                self.error_message = ""
            elif event.key == pygame.K_DELETE:
                self.input_text = self.input_text[:self.cursor_pos] + self.input_text[self.cursor_pos+1:]
            elif event.key == pygame.K_LEFT:
                self.cursor_pos = max(0, self.cursor_pos - 1)
            elif event.key == pygame.K_RIGHT:
                self.cursor_pos = min(len(self.input_text), self.cursor_pos + 1)
            elif event.key == pygame.K_HOME:
                self.cursor_pos = 0
            elif event.key == pygame.K_END:
                self.cursor_pos = len(self.input_text)
            elif event.key == pygame.K_v and pygame.key.get_mods() & pygame.KMOD_CTRL:
                # Paste from clipboard (simplified)
                pass
            else:
                # Regular character
                if event.unicode and event.unicode.isprintable():
                    self.input_text = (self.input_text[:self.cursor_pos] + 
                                     event.unicode + 
                                     self.input_text[self.cursor_pos:])
                    self.cursor_pos += 1
                    self.error_message = ""
        
        elif event.type == pygame.MOUSEBUTTONDOWN:
            # Click in text area
            if self.input_rect.collidepoint(event.pos):
                self.active = True
    
    def validate_json(self):
        """Try to parse and validate the JSON"""
        if not self.input_text.strip():
            return None
        
        try:
            data = json.loads(self.input_text)
            self.last_valid_json = data
            self.error_message = ""
            return data
        except json.JSONDecodeError as e:
            self.error_message = f"JSON Error: {str(e)}"
            return None
    
    def draw(self, screen, level):
        """Draw the transition editor"""
        # Editor title
        title = pygame.font.Font(None, 28).render("Define State Transitions (JSON)", True, COLORS['accent'])
        screen.blit(title, (20, 20))
        
        # Instructions
        instructions = [
            "Format: {\"state_name\": {\"input_symbol\": [\"next_state\", \"output_symbol\", \"direction\"]}}",
            "Directions: R (right), L (left), N (no move)",
            "Use '_' for blank symbol",
            "Example: {\"q0\": {\"a\": [\"q1\", \"X\", \"R\"], \"_\": [\"accept\", \"_\", \"N\"]}}"
        ]
        
        y = 60
        for instr in instructions:
            text = self.font_small.render(instr, True, COLORS['text'])
            screen.blit(text, (40, y))
            y += 25
        
        # Input box
        self.input_rect = pygame.Rect(20, y + 20, self.width - 40, 250)
        pygame.draw.rect(screen, COLORS['input_bg'], self.input_rect)
        pygame.draw.rect(screen, COLORS['input_border'], self.input_rect, 2)
        
        # Draw text content with word wrap
        lines = self.input_text.split('\n')
        text_y = self.input_rect.top + 10
        
        for line in lines:
            if text_y > self.input_rect.bottom - 20:
                break
            text_surf = self.font_small.render(line, True, COLORS['text'])
            screen.blit(text_surf, (self.input_rect.left + 10, text_y))
            text_y += 20
        
        # Draw cursor
        if self.active and int(pygame.time.get_ticks() / 500) % 2:
            cursor_x = self.input_rect.left + 10 + len(self.input_text[:self.cursor_pos]) * 8
            cursor_y_line = len(self.input_text[:self.cursor_pos].split('\n')) - 1
            cursor_y = self.input_rect.top + 10 + cursor_y_line * 20
            pygame.draw.line(screen, COLORS['accent'], (cursor_x, cursor_y), (cursor_x, cursor_y + 16))
        
        # Error message
        y = self.input_rect.bottom + 10
        if self.error_message:
            error_text = self.font_normal.render(self.error_message, True, COLORS['error'])
            screen.blit(error_text, (20, y))
        else:
            # Show validation status
            status_text = self.font_small.render("✓ Valid JSON" if self.validate_json() else "Invalid or empty", 
                                                True, COLORS['success'] if self.validate_json() else COLORS['warning'])
            screen.blit(status_text, (20, y))
        
        # Show test preview
        y += 40
        preview_title = self.font_title.render("Test Preview:", True, COLORS['accent'])
        screen.blit(preview_title, (20, y))
        
        y += 35
        for i, test_case in enumerate(level['test_cases'][:3]):  # Show first 3 tests
            test_text = self.font_small.render(
                f"Test {i+1}: '{test_case['input']}' → '{test_case['expected']}'",
                True, COLORS['text']
            )
            screen.blit(test_text, (40, y))
            y += 25
        
        # Submit hint
        hint = self.font_small.render("Press ENTER to test | ESC to go back | TAB for JSON template", 
                                     True, COLORS['warning'])
        screen.blit(hint, (20, self.height - 30))
    
    def get_transitions(self):
        """Get the parsed transitions"""
        return self.validate_json()
    
    def set_template(self, level):
        """Load a template for the current level"""
        states = level['starter_transitions'].keys()
        template = {}
        for state in states:
            template[state] = {}
        self.input_text = json.dumps(template, indent=2)
        self.cursor_pos = len(self.input_text)
