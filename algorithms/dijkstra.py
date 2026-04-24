"""
Dijkstra's Algorithm
======================
Special case of A* where h(n) = 0.
Guarantees shortest path on non-negative weighted graphs.
Explores more nodes than A* but is still optimal.
"""

import heapq
import math
from algorithms.astar import get_neighbours


def dijkstra_search(grid, start, end):
    """Dijkstra's algorithm on a weighted grid."""
    counter   = 0
    open_heap = [(0, counter, start)]
    dist      = {start: 0}
    came_from = {}
    closed    = set()

    nodes_explored = 0
    visited_order  = []
    open_set_order = [list(start)]

    while open_heap:
        cost, _, current = heapq.heappop(open_heap)
        if current in closed:
            continue

        closed.add(current)
        nodes_explored += 1
        visited_order.append(list(current))

        if current == end:
            return {
                "found":          True,
                "path":           _rebuild(came_from, current),
                "cost":           dist[end],
                "nodes_explored": nodes_explored,
                "visited_order":  visited_order,
                "open_set_order": open_set_order,
            }

        for nr, nc, w in get_neighbours(grid, current[0], current[1]):
            nb = (nr, nc)
            if nb in closed:
                continue
            nd = dist[current] + w
            if nd < dist.get(nb, math.inf):
                dist[nb]      = nd
                came_from[nb] = current
                counter += 1
                heapq.heappush(open_heap, (nd, counter, nb))
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
