namespace MazeRunner.Models;

[Flags]
public enum Walls
{
    None = 0,
    North = 1,
    East = 2,
    South = 4,
    West = 8,
    All = North | East | South | West
}

public enum Direction { North, East, South, West }

public class MazeCell(int x, int y)
{
    public int X { get; } = x;
    public int Y { get; } = y;
    public Walls Walls { get; set; } = Walls.All;
    public bool Visited { get; set; }
}

public class MazeGrid
{
    public int Width { get; }
    public int Height { get; }
    private readonly MazeCell[,] _cells;

    public MazeGrid(int width, int height)
    {
        Width = width;
        Height = height;
        _cells = new MazeCell[width, height];
        for (var x = 0; x < width; x++)
            for (var y = 0; y < height; y++)
                _cells[x, y] = new MazeCell(x, y);
    }

    public MazeCell this[int x, int y] => _cells[x, y];

    public IEnumerable<(MazeCell Neighbor, Direction Dir)> Neighbors(MazeCell cell)
    {
        if (cell.Y > 0) yield return (_cells[cell.X, cell.Y - 1], Direction.North);
        if (cell.X < Width - 1) yield return (_cells[cell.X + 1, cell.Y], Direction.East);
        if (cell.Y < Height - 1) yield return (_cells[cell.X, cell.Y + 1], Direction.South);
        if (cell.X > 0) yield return (_cells[cell.X - 1, cell.Y], Direction.West);
    }

    public static void RemoveWallBetween(MazeCell from, MazeCell to, Direction dir)
    {
        switch (dir)
        {
            case Direction.North:
                from.Walls &= ~Walls.North;
                to.Walls &= ~Walls.South;
                break;
            case Direction.South:
                from.Walls &= ~Walls.South;
                to.Walls &= ~Walls.North;
                break;
            case Direction.East:
                from.Walls &= ~Walls.East;
                to.Walls &= ~Walls.West;
                break;
            case Direction.West:
                from.Walls &= ~Walls.West;
                to.Walls &= ~Walls.East;
                break;
        }
    }

    public void ResetVisited()
    {
        for (var x = 0; x < Width; x++)
            for (var y = 0; y < Height; y++)
                _cells[x, y].Visited = false;
    }
}
