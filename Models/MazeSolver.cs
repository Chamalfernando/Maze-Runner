using System.Runtime.CompilerServices;

namespace MazeRunner.Models;

public enum MazeSolveEventKind { Visit, Done }

public readonly record struct MazeSolveEvent(MazeSolveEventKind Kind, MazeCell? Current, IReadOnlyList<(int X, int Y)>? Path);

/// <summary>Breadth-first search from the top-left cell to the bottom-right cell — shortest path on an unweighted grid.</summary>
public static class MazeSolver
{
    public static async IAsyncEnumerable<MazeSolveEvent> SolveAsync(
        MazeGrid grid, int delayMs, [EnumeratorCancellation] CancellationToken ct = default)
    {
        grid.ResetVisited();
        var start = grid[0, 0];
        var goal = grid[grid.Width - 1, grid.Height - 1];
        var cameFrom = new Dictionary<MazeCell, MazeCell>();
        var queue = new Queue<MazeCell>();

        start.Visited = true;
        queue.Enqueue(start);

        while (queue.Count > 0)
        {
            ct.ThrowIfCancellationRequested();
            var current = queue.Dequeue();
            yield return new MazeSolveEvent(MazeSolveEventKind.Visit, current, null);

            if (current == goal) break;

            foreach (var (neighbor, dir) in grid.Neighbors(current))
            {
                if (neighbor.Visited || IsWalled(current.Walls, dir)) continue;
                neighbor.Visited = true;
                cameFrom[neighbor] = current;
                queue.Enqueue(neighbor);
            }

            if (delayMs > 0) await Task.Delay(delayMs, ct);
        }

        var path = new List<(int X, int Y)>();
        var node = goal;
        while (cameFrom.TryGetValue(node, out var prev) || node == start)
        {
            path.Add((node.X, node.Y));
            if (node == start) break;
            node = prev!;
        }
        path.Reverse();

        yield return new MazeSolveEvent(MazeSolveEventKind.Done, null, path);
    }

    private static bool IsWalled(Walls walls, Direction dir) => dir switch
    {
        Direction.North => walls.HasFlag(Walls.North),
        Direction.East => walls.HasFlag(Walls.East),
        Direction.South => walls.HasFlag(Walls.South),
        Direction.West => walls.HasFlag(Walls.West),
        _ => true
    };
}
