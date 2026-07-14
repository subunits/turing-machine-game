#!/usr/bin/env python3
"""
Turing Machine Puzzle Game
Configure state transitions to solve computational challenges
"""

import pygame
import json
import sys
from enum import Enum
from turing_machine import TuringMachine
from game_levels import get_level, get_all_levels, validate_solution
from transition_editor import TransitionEditorUI

# Constants
WIDTH, HEIGHT = 1400, 900
FPS = 60

COLORS = {
    'bg': (15, 15, 25),
    'text': (230, 230, 240),
    'accent': (100, 200, 255),
    'success': (100, 255, 150),
    'error': (255, 100, 100),
    'warning': (255, 180, 80),
    'state_bg': (40, 40, 70),
    'tape_bg': (30, 50, 70),
    'border': (80, 100, 140),
}

class GameState(Enum):
    MENU = 1
    LEVEL_SELECT = 2
    LEVEL_EDITOR = 3
    TEST_REVIEW = 4
    LEVEL_COMPLETE = 5

class TuringMachineGame:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Turing Machine: Puzzle Game")
        self.clock = pygame.time.Clock()
        
        # Fonts
        self.font_title = pygame.font.Font(None, 42)
        self.font_large = pygame.font.Font(None, 32)
        self.font_normal = pygame.font.Font(None, 22)
        self.font_small = pygame.font.Font(None, 18)
        
        # Game state
        self.game_state = GameState.MENU
        self.current_level = None
        self.completed_levels = set()
        self.current_score = 0
        self.test_results = None
        
        # Editor
        self.editor = None
        
    def draw_menu(self):
        """Draw main menu"""
        self.screen.fill(COLORS['bg'])
        
        # Gradient-like effect with colored bars
        pygame.draw.line(self.screen, COLORS['accent'], (0, 60), (WIDTH, 60), 3)
        
        # Title
        title = self.font_title.render("⟨ TURING MACHINE ⟩", True, COLORS['accent'])
        title_rect = title.get_rect(center=(WIDTH//2, 80))
        self.screen.blit(title, title_rect)
        
        subtitle = self.font_large.render("PUZZLE GAME", True, COLORS['text'])
        subtitle_rect = subtitle.get_rect(center=(WIDTH//2, 140))
        self.screen.blit(subtitle, subtitle_rect)
        
        # Description
        desc_lines = [
            "Design Turing machine state transitions to solve computational puzzles.",
            "Learn automata theory through interactive challenges.",
            f"Levels completed: {len(self.completed_levels)}/{len(get_all_levels())}"
        ]
        
        y = 220
        for line in desc_lines:
            desc = self.font_small.render(line, True, COLORS['text'])
            self.screen.blit(desc, (WIDTH//2 - desc.get_width()//2, y))
            y += 40
        
        # Menu buttons
        pygame.draw.line(self.screen, COLORS['border'], (100, 350), (WIDTH-100, 350), 1)
        
        buttons = [
            ("START PLAYING", 1),
            ("ABOUT TURING MACHINES", 2),
            ("QUIT", 3),
        ]
        
        y = 400
        for text, key in buttons:
            btn = self.font_normal.render(f"({key}) {text}", True, COLORS['accent'])
            self.screen.blit(btn, (WIDTH//2 - btn.get_width()//2, y))
            y += 60
        
        # Footer
        footer = self.font_small.render("Press SPACE or click START PLAYING", True, COLORS['warning'])
        self.screen.blit(footer, (WIDTH//2 - footer.get_width()//2, HEIGHT - 50))
        
    def draw_level_select(self):
        """Draw level selection screen"""
        self.screen.fill(COLORS['bg'])
        
        # Header
        pygame.draw.line(self.screen, COLORS['accent'], (0, 60), (WIDTH, 60), 3)
        title = self.font_title.render("SELECT LEVEL", True, COLORS['accent'])
        self.screen.blit(title, (50, 20))
        
        # Progress
        completed = len(self.completed_levels)
        total = len(get_all_levels())
        progress = self.font_normal.render(f"Progress: {completed}/{total}", True, COLORS['success'] if completed > 0 else COLORS['text'])
        self.screen.blit(progress, (WIDTH - 350, 30))
        
        # Levels
        levels = get_all_levels()
        y = 100
        
        for level in levels:
            level_id = level["id"]
            is_completed = level_id in self.completed_levels
            
            # Level background
            level_rect = pygame.Rect(50, y, WIDTH - 100, 80)
            pygame.draw.rect(self.screen, COLORS['state_bg'], level_rect)
            pygame.draw.rect(self.screen, COLORS['border'] if is_completed else COLORS['accent'], level_rect, 2)
            
            # Status icon
            status = "✓" if is_completed else f"{level_id}"
            status_color = COLORS['success'] if is_completed else COLORS['accent']
            status_text = self.font_large.render(status, True, status_color)
            self.screen.blit(status_text, (70, y + 15))
            
            # Level info
            name = self.font_normal.render(f"Level {level_id}: {level['name']}", True, COLORS['accent'])
            self.screen.blit(name, (120, y + 10))
            
            desc = self.font_small.render(level['description'], True, COLORS['text'])
            self.screen.blit(desc, (120, y + 40))
            
            y += 100
        
        # Footer
        footer = self.font_small.render("Click a level to play | ESC to return to menu", True, COLORS['warning'])
        self.screen.blit(footer, (50, HEIGHT - 40))
        
    def draw_editor(self):
        """Draw level editor"""
        self.screen.fill(COLORS['bg'])
        level = self.current_level
        
        # Header
        pygame.draw.line(self.screen, COLORS['accent'], (0, 60), (WIDTH, 60), 3)
        
        title = self.font_title.render(f"Level {level['id']}: {level['name']}", True, COLORS['accent'])
        self.screen.blit(title, (20, 15))
        
        # Left panel: Problem description
        left_panel_width = 350
        
        desc = self.font_normal.render(level['description'], True, COLORS['text'])
        self.screen.blit(desc, (20, 100))
        
        hint_title = self.font_normal.render("💡 Hint:", True, COLORS['warning'])
        self.screen.blit(hint_title, (20, 150))
        
        hint_lines = self._wrap_text(level['hint'], 40)
        y = 180
        for line in hint_lines:
            hint_text = self.font_small.render(line, True, COLORS['text'])
            self.screen.blit(hint_text, (30, y))
            y += 25
        
        test_title = self.font_normal.render("Test Cases:", True, COLORS['accent'])
        self.screen.blit(test_title, (20, y + 20))
        
        y += 50
        for i, test in enumerate(level['test_cases']):
            test_text = self.font_small.render(
                f"{i+1}. '{test['input']}' → '{test['expected']}'",
                True, COLORS['text']
            )
            self.screen.blit(test_text, (30, y))
            y += 30
        
        # Draw divider
        pygame.draw.line(self.screen, COLORS['border'], (left_panel_width + 10, 80), 
                        (left_panel_width + 10, HEIGHT - 100), 2)
        
        # Right panel: Editor
        self.editor.draw(self.screen, level)
        
    def draw_test_review(self):
        """Draw test results"""
        self.screen.fill(COLORS['bg'])
        level = self.current_level
        results = self.test_results
        
        # Header
        pygame.draw.line(self.screen, COLORS['accent'], (0, 60), (WIDTH, 60), 3)
        title = self.font_title.render(f"Level {level['id']}: {level['name']}", True, COLORS['accent'])
        self.screen.blit(title, (20, 15))
        
        # Results summary
        passed = sum(1 for r in results if r['passed'])
        total = len(results)
        all_passed = passed == total
        
        summary_color = COLORS['success'] if all_passed else COLORS['error']
        summary = self.font_title.render(f"RESULTS: {passed}/{total} PASSED", True, summary_color)
        self.screen.blit(summary, (20, 80))
        
        # Detailed results
        y = 140
        for i, result in enumerate(results):
            # Test header
            status = "✓" if result['passed'] else "✗"
            status_color = COLORS['success'] if result['passed'] else COLORS['error']
            status_text = self.font_normal.render(f"{status} Test {i+1}: {result['description']}", True, status_color)
            self.screen.blit(status_text, (40, y))
            
            # Details
            input_line = self.font_small.render(f"Input: '{result['input']}'", True, COLORS['text'])
            self.screen.blit(input_line, (60, y + 35))
            
            expected_line = self.font_small.render(f"Expected: '{result['expected']}'", True, COLORS['text'])
            self.screen.blit(expected_line, (60, y + 55))
            
            actual_line = self.font_small.render(f"Actual: '{result['actual']}'", True, COLORS['text'])
            self.screen.blit(actual_line, (60, y + 75))
            
            steps_line = self.font_small.render(f"Steps: {result['steps']}", True, COLORS['text'])
            self.screen.blit(steps_line, (60, y + 95))
            
            y += 130
            if y > HEIGHT - 200:
                break
        
        # Footer
        pygame.draw.line(self.screen, COLORS['border'], (20, HEIGHT - 80), (WIDTH - 20, HEIGHT - 80), 1)
        
        if all_passed:
            nav = self.font_normal.render("✓ Level Complete! | SPACE for next level | ESC to menu", 
                                         True, COLORS['success'])
        else:
            nav = self.font_small.render("ESC to edit | R to retry", True, COLORS['warning'])
        
        self.screen.blit(nav, (20, HEIGHT - 50))
        
    def draw_level_complete(self):
        """Draw level completion screen"""
        self.screen.fill(COLORS['bg'])
        
        pygame.draw.line(self.screen, COLORS['success'], (0, 200), (WIDTH, 200), 4)
        pygame.draw.line(self.screen, COLORS['success'], (0, HEIGHT - 200), (WIDTH, HEIGHT - 200), 4)
        
        title = self.font_title.render("LEVEL COMPLETE!", True, COLORS['success'])
        self.screen.blit(title, (WIDTH//2 - title.get_width()//2, 150))
        
        remaining = len(get_all_levels()) - len(self.completed_levels)
        if remaining > 0:
            msg = self.font_large.render(f"{remaining} levels remaining", True, COLORS['text'])
        else:
            msg = self.font_large.render("ALL LEVELS COMPLETE!", True, COLORS['success'])
        self.screen.blit(msg, (WIDTH//2 - msg.get_width()//2, 350))
        
        nav = self.font_normal.render("SPACE to continue | ESC to menu", True, COLORS['warning'])
        self.screen.blit(nav, (WIDTH//2 - nav.get_width()//2, HEIGHT - 100))
        
    def handle_events(self):
        """Handle all events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.game_state in (GameState.LEVEL_SELECT, GameState.LEVEL_EDITOR, GameState.TEST_REVIEW):
                        self.game_state = GameState.MENU
                    elif self.game_state == GameState.LEVEL_COMPLETE:
                        self.game_state = GameState.LEVEL_SELECT
                        
                elif event.key == pygame.K_SPACE:
                    if self.game_state == GameState.MENU:
                        self.game_state = GameState.LEVEL_SELECT
                    elif self.game_state == GameState.TEST_REVIEW:
                        # Move to next level
                        if self.current_level['id'] < len(get_all_levels()):
                            self.current_level = get_level(self.current_level['id'] + 1)
                            self.game_state = GameState.LEVEL_EDITOR
                            self.editor = TransitionEditorUI(WIDTH, HEIGHT)
                            self.editor.set_template(self.current_level)
                        else:
                            self.game_state = GameState.MENU
                    elif self.game_state == GameState.LEVEL_COMPLETE:
                        if self.current_level['id'] < len(get_all_levels()):
                            self.current_level = get_level(self.current_level['id'] + 1)
                            self.game_state = GameState.LEVEL_EDITOR
                            self.editor = TransitionEditorUI(WIDTH, HEIGHT)
                            self.editor.set_template(self.current_level)
                        else:
                            self.game_state = GameState.MENU
                            
                elif event.key == pygame.K_RETURN:
                    if self.game_state == GameState.LEVEL_EDITOR:
                        self.test_solution()
                        
                elif event.key == pygame.K_r:
                    if self.game_state == GameState.TEST_REVIEW:
                        self.game_state = GameState.LEVEL_EDITOR
                        
                elif event.key == pygame.K_TAB:
                    if self.game_state == GameState.LEVEL_EDITOR:
                        self.editor.set_template(self.current_level)
            
            # Pass events to editor
            if self.game_state == GameState.LEVEL_EDITOR and self.editor:
                self.editor.handle_event(event)
            
            # Level select click
            elif event.type == pygame.MOUSEBUTTONDOWN and self.game_state == GameState.LEVEL_SELECT:
                self.handle_level_select_click(event.pos)
        
        return True
    
    def handle_level_select_click(self, pos):
        """Handle clicking a level"""
        levels = get_all_levels()
        y = 100
        
        for level in levels:
            level_rect = pygame.Rect(50, y, WIDTH - 100, 80)
            if level_rect.collidepoint(pos):
                self.current_level = level
                self.game_state = GameState.LEVEL_EDITOR
                self.editor = TransitionEditorUI(WIDTH, HEIGHT)
                self.editor.set_template(self.current_level)
                break
            y += 100
    
    def test_solution(self):
        """Test the player's solution"""
        transitions = self.editor.get_transitions()
        
        if not transitions:
            self.editor.error_message = "Please fix JSON syntax first"
            return
        
        # Create machine with player transitions
        try:
            machine = TuringMachine(
                transitions=transitions,
                initial_state=self.current_level['initial_state'],
                accept_states=self.current_level['accept_states'],
                reject_states=self.current_level.get('reject_states', [])
            )
            
            # Validate solution
            passed, total, results = validate_solution(
                machine,
                self.current_level['test_cases'],
                max_steps=10000
            )
            
            self.test_results = results
            
            if passed == total:
                self.completed_levels.add(self.current_level['id'])
                self.current_score += (100 * passed)
                self.game_state = GameState.LEVEL_COMPLETE
            else:
                self.game_state = GameState.TEST_REVIEW
                
        except Exception as e:
            self.editor.error_message = f"Error: {str(e)}"
    
    def _wrap_text(self, text, width):
        """Wrap text to width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            current_line.append(word)
            if len(' '.join(current_line)) > width:
                lines.append(' '.join(current_line[:-1]))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def run(self):
        """Main game loop"""
        running = True
        
        while running:
            running = self.handle_events()
            
            # Draw current state
            if self.game_state == GameState.MENU:
                self.draw_menu()
            elif self.game_state == GameState.LEVEL_SELECT:
                self.draw_level_select()
            elif self.game_state == GameState.LEVEL_EDITOR:
                self.draw_editor()
            elif self.game_state == GameState.TEST_REVIEW:
                self.draw_test_review()
            elif self.game_state == GameState.LEVEL_COMPLETE:
                self.draw_level_complete()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()

if __name__ == "__main__":
    game = TuringMachineGame()
    game.run()
