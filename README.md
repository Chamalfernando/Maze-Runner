# Maze Runner

A Blazor WebAssembly app that generates random mazes, animates how they're built and solved, and lets you play through them yourself with keyboard controls.

## Features

- **Animated maze generation** — mazes are carved using a randomized recursive backtracker (randomized depth-first search), producing a "perfect maze": exactly one path between any two cells, no loops, no isolated areas. Each carve/backtrack step is streamed to the UI so you can watch the maze build itself cell by cell.
- **Animated maze solving** — the **Solve** button runs a breadth-first search from the top-left cell to the bottom-right cell, guaranteeing the shortest possible path, and animates each cell as it's visited before highlighting the final route.
- **Play mode** — move a player from the top-left start to the green goal square at the bottom-right using the arrow keys or WASD. Movement is blocked by walls, and a move counter tracks how many steps you've taken. A win banner appears once you reach the goal.
- **Configurable grid size** — set the number of columns and rows (5–60 each) before generating a new maze.
- **Adjustable animation speed** — a slider controls the per-step delay (0–30 ms) for both generation and solving, from instant to a slow, watchable pace.
- **Reset Player** — send the player back to the start without regenerating the maze, so you can retry the same layout.
- **Canvas rendering** — the maze, walls, visited-cell trail, current cursor, solved path, goal marker, and an animated stick-figure player (complete with a walk cycle when moving) are all drawn on an HTML5 `<canvas>` via JavaScript interop, with maze state passed from .NET as compact hex-encoded strings for efficient per-frame updates.

## How it works

### Maze generation (`Models/MazeGenerator.cs`)
Starting from the top-left cell, the generator pushes the current cell onto a stack, picks a random unvisited neighbor, knocks down the wall between them, and pushes the neighbor. When a cell has no unvisited neighbors, it backtracks by popping the stack. This continues until the stack is empty, guaranteeing every cell is reachable via a single unique path from any other cell.

### Maze solving (`Models/MazeSolver.cs`)
The solver performs a breadth-first traversal from the start cell, expanding to open (non-walled) neighbors layer by layer, until it reaches the goal. Because BFS explores in increasing distance order on an unweighted grid, the first time it reaches the goal is guaranteed to be via the shortest path. The path is then reconstructed by walking back through the recorded predecessors.

### Maze model (`Models/MazeModels.cs`)
The grid is a 2D array of cells, each tracking which of its four walls (North/East/South/West) are still standing via a `[Flags]` enum, plus a `Visited` flag used by both the generator and the solver.

### Rendering (`Pages/Maze.razor` + `wwwroot/js/maze.js`)
On every animation frame, the Blazor component encodes the whole grid's walls and per-cell state (visited / current / on-solved-path) as two flat hex strings — one character per cell — and passes them to a JavaScript `draw` function via `IJSRuntime`. JavaScript then renders the walls, overlays, goal marker, and player onto a `<canvas>` each frame. This flat-string encoding avoids the overhead of serializing a JSON object per cell on every step of a fast-running animation.

## Tech stack

- [.NET 10](https://dotnet.microsoft.com/) / [Blazor WebAssembly](https://learn.microsoft.com/aspnet/core/blazor/)
- Bootstrap (bundled under `wwwroot/lib/bootstrap`) for layout and styling
- Plain JavaScript + HTML5 Canvas for rendering (`wwwroot/js/maze.js`), invoked from C# via JS interop

## Getting started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

### Run locally
```bash
dotnet run
```
The app launches at `http://localhost:5126` (or `https://localhost:7175` for the HTTPS profile) and opens automatically in your browser.

### Build
```bash
dotnet build
```

### Publish (static files, deployable anywhere that serves static content)
```bash
dotnet publish -c Release
```

## Controls

| Action | Input |
|---|---|
| Move player | Arrow keys or `W`/`A`/`S`/`D` |
| Generate a new maze | **Generate New Maze** button |
| Reveal shortest path | **Solve** button |
| Return player to start | **Reset Player** button |
| Change grid size | Columns / Rows number inputs |
| Change animation speed | Animation speed slider |
