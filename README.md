# Code Village 🏘️

> A 2D pixel RPG where you restore a broken village by solving coding puzzles. Built with the Maki framework for Maki Hackathon 2026.

## What is Code Village?
Code Village is a top-down RPG about helping a village recover from a mysterious crash. You explore the hub, meet broken NPCs, and solve short logic puzzles that teach programming fundamentals through play.

Each restored building represents a core coding concept. The game is designed to be approachable, readable, and fully playable in a browser, with lightweight pixel-art styling and simple WebAudio sound effects.

## How to Run
```bash
npm install
maki dev
```
Then open http://localhost:5173

## How to Play
- Arrow keys / WASD: Move
- SPACE: Talk to NPCs / advance dialogue
- ENTER: Enter buildings
- R: Restart (at credits screen)

## Testing Puzzles
**End-to-End Flow Test:**
1. Start the game (default Hub scene)
2. Walk up-left to the **Library** building (blue roof, "Press ENTER to enter" hint visible)
3. Press ENTER to enter the Library
4. Press SPACE to start dialogue with Zara  
5. After dialogue, the **Sequence Puzzle** appears showing 3 story cards
6. **Click each story card in the correct order** (1st → 2nd → 3rd)
   - Each click should highlight the card green and advance to the next step
   - After 3 clicks, the puzzle closes and dialogue continues
7. Press SPACE to finish dialogue and return to Hub
8. The Library door should now be **green** (fixed!)
9. Repeat for other buildings: Farm (Loops), Market (Variables), School (Conditions)
10. After all 4 buildings are fixed, visit the **Mayor's House** for the ending

**Quick Puzzle Test:**
- Go to any building and press SPACE to start dialogue
- Skip dialogue by pressing SPACE repeatedly
- When puzzle appears, **click any option/button** to test interaction
- Buttons should respond with visual feedback (color change, state update)

## Concepts Taught
| Zone | NPC | Bug | Concept |
|------|-----|-----|---------|
| Library | Zara | Scrambled chapters | Sequences |
| Farm | Bob | Infinite loop | Loops + Stop conditions |
| Market | Meg | Reused variable names | Variables |
| School | Rex | Missing else block | If/Else Conditions |
| Mayor's House | Gerald | Missing semicolon | The twist |

## Built With
- [Maki Framework](https://github.com/tial-ops/maki)
- Phaser 3 (via Maki)
- Vite

## Team
Your name here

## Hackathon
Maki Hackathon 2026 — Beginner Friendly Design Gaming
