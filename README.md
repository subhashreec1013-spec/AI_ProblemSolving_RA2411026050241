# GPS-Based City Route Finder using A* Algorithm

## Problem Description
A GPS navigation system must find the optimal route between two city locations.
The city is modelled as a 2-D weighted grid:
  - 0  → open road (cost 1)
  - 1  → wall/obstacle (impassable)
  - 2-9→ traffic zone (cost = cell value)

## A* Algorithm
  f(n) = g(n) + h(n)
  g(n) = actual cost from start to n
  h(n) = heuristic estimate from n to goal (Manhattan or Euclidean)
  f(n) = total estimated path cost

## Heuristics
  Manhattan : |Δrow| + |Δcol|  — best for 4-directional grids
  Euclidean : √(Δrow²+Δcol²)   — best for any-angle movement

## Algorithm Comparison
  A*       : f=g+h  → optimal, fewest nodes explored
  Dijkstra : f=g    → optimal, explores more nodes (no heuristic)
  BFS      : f=hops → optimal by hops only, ignores weights

## Quick Start
  pip install -r requirements.txt
  python app.py
  # open http://localhost:5000

## API Endpoints
  POST /astar     → A* search
  POST /dijkstra  → Dijkstra search
  POST /bfs       → BFS search
  POST /compare   → All three algorithms compared

## Request Body
  {"grid":[[0,0,1,...]],"start":[r,c],"end":[r,c],"heuristic":"manhattan"}

## Response
  {"found":true,"path":[[r,c],...],"cost":N,"nodes_explored":N,"execution_time_ms":N}
