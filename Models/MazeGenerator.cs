using System.Runtime.CompilerServices;

namespace MazeRunner.Models;

public enum MazeGenEventKind { Carve, Backtrack, Done }

public readonly record struct MazeGenEvent(MazeGenEventKind Kind, MazeCell Current);

/// <summary>Recursive backtracker (randomized DFS): carves a perfect maze (exactly one path between any two cells).</summary>
public static class MazeGenerator
{
    public static async IAsyncEnumerable<MazeGenEvent> GenerateAsync(
        MazeGrid grid, Random rng, int delayMs, [EnumeratorCancellation] CancellationToken ct = default)
    {
        var stack = new Stack<MazeCell>();
        var start = grid[0, 0];
        start.Visited = true;
        stack.Push(start);

        while (stack.Count > 0)
        {
            ct.ThrowIfCancellationRequested();
            var current = stack.Peek();
            var unvisited = grid.Neighbors(current).Where(n => !n.Neighbor.Visited).ToList();

            if (unvisited.Count == 0)
            {
                stack.Pop();
                yield return new MazeGenEvent(MazeGenEventKind.Backtrack, current);
            }
            else
            {
                var (next, dir) = unvisited[rng.Next(unvisited.Count)];
                MazeGrid.RemoveWallBetween(current, next, dir);
                next.Visited = true;
                stack.Push(next);
                yield return new MazeGenEvent(MazeGenEventKind.Carve, next);
            }

            if (delayMs > 0) await Task.Delay(delayMs, ct);
        }

        yield return new MazeGenEvent(MazeGenEventKind.Done, grid[grid.Width - 1, grid.Height - 1]);
    }
}
