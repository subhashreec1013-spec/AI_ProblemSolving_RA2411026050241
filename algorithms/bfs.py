"""
Breadth-First Search (BFS)
===========================
Explores nodes level-by-level (FIFO queue).
Finds shortest path in terms of HOPS (not cost).
Does NOT consider edge weights during search.
"""

from collections import deque
from algorithms.astar import get_neighbours


def bfs_search(grid, start, end):
    """BFS on a grid (unweighted shortest path)."""
    queue     = deque([start])
    visited   = {start}
    came_from = {}

    nodes_explored = 0
    visited_order  = []
    open_set_order = [list(start)]

    while queue:
        current = queue.popleft()
        nodes_explored += 1
        visited_order.append(list(current))

        if current == end:
            path = _rebuild(came_from, current)
            return {
                "found":          True,
                "path":           path,
                "cost":           _cost(grid, path),
                "nodes_explored": nodes_explored,
                "visited_order":  visited_order,
                "open_set_order": open_set_order,
            }

        for nr, nc, _ in get_neighbours(grid, current[0], current[1]):
            nb = (nr, nc)
            if nb not in visited:
                visited.add(nb)
                came_from[nb] = current
                queue.append(nb)
                open_set_order.append(list(nb))

    return {"found": False, "path": [], "cost": 0,
            "nodes_explored": nodes_explored,
            "visited_order": visited_order,
            "open_set_order": open_set_order}


def _rebuild(came_from, current):
    path = [list(current)]
    while current in came_from:
        current = came_from[current]
        path.append(list(current))
    path.reverse()
    return path


def _cost(grid, path):
    """Compute the actual weighted cost of the BFS path."""
    total = 0
    for i, (r, c) in enumerate(path):
        if i == 0:
            continue
        cell = grid[r][c]
        total += max(1, int(cell)) if cell != 1 else 0
    return total
