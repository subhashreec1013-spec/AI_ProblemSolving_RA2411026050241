"""
A* Search Algorithm
====================
f(n) = g(n) + h(n)
  g(n) = actual cost from start to n
  h(n) = admissible heuristic estimate from n to goal
"""

import heapq
import math


# ── Heuristics ────────────────────────────────────────────────────────────

def manhattan(a, b):
    """Manhattan Distance — admissible for 4-directional grids."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def euclidean(a, b):
    """Euclidean Distance — admissible for any-direction movement."""
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


HEURISTICS = {"manhattan": manhattan, "euclidean": euclidean}


# ── Neighbour Helper ───────────────────────────────────────────────────────

def get_neighbours(grid, row, col):
    """
    Return [(r, c, weight), ...] for 4 cardinal directions.
    Cell value: 0=open(cost 1), 1=wall(skip), k>=2=traffic(cost k).
    """
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    result = []
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        r, c = row + dr, col + dc
        if 0 <= r < rows and 0 <= c < cols:
            cell = grid[r][c]
            if cell != 1:
                result.append((r, c, max(1, int(cell))))
    return result


# ── A* Core ───────────────────────────────────────────────────────────────

def astar_search(grid, start, end, heuristic_name="manhattan"):
    """
    A* search on a weighted grid.

    Returns dict: found, path, cost, nodes_explored,
                  visited_order, open_set_order
    """
    h       = HEURISTICS.get(heuristic_name, manhattan)
    counter = 0

    open_heap = []
    heapq.heappush(open_heap, (h(start, end), counter, start))

    g_score   = {start: 0}
    came_from = {}
    closed    = set()

    nodes_explored = 0
    visited_order  = []
    open_set_order = [list(start)]

    while open_heap:
        _, _, current = heapq.heappop(open_heap)
        if current in closed:
            continue

        closed.add(current)
        nodes_explored += 1
        visited_order.append(list(current))

        if current == end:
            return {
                "found":          True,
                "path":           _rebuild(came_from, current),
                "cost":           g_score[end],
                "nodes_explored": nodes_explored,
                "visited_order":  visited_order,
                "open_set_order": open_set_order,
            }

        for nr, nc, w in get_neighbours(grid, current[0], current[1]):
            nb = (nr, nc)
            if nb in closed:
                continue
            tg = g_score[current] + w
            if tg < g_score.get(nb, math.inf):
                came_from[nb] = current
                g_score[nb]   = tg
                counter += 1
                heapq.heappush(open_heap, (tg + h(nb, end), counter, nb))
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
