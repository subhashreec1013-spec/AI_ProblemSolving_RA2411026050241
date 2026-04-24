"""
GPS-Based City Route Finder using A* Algorithm
Flask Backend - Main Application Entry Point
"""

from flask import Flask, request, jsonify, render_template
from algorithms.astar import astar_search
from algorithms.dijkstra import dijkstra_search
from algorithms.bfs import bfs_search
import time

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")


def parse_grid_input(data):
    """
    Parse incoming JSON payload into algorithm-ready format.

    Expected JSON:
    {
        "grid": [[0,0,1,...], ...],   # 0=open, 1=wall, >1=weight
        "start": [row, col],
        "end":   [row, col],
        "heuristic": "manhattan" | "euclidean"
    }
    """
    grid      = data.get("grid", [])
    start     = tuple(data.get("start", [0, 0]))
    end       = tuple(data.get("end",   [0, 0]))
    heuristic = data.get("heuristic", "manhattan")
    return grid, start, end, heuristic


@app.route("/astar", methods=["POST"])
def run_astar():
    """A* Search endpoint."""
    data = request.get_json()
    grid, start, end, heuristic = parse_grid_input(data)
    t0     = time.perf_counter()
    result = astar_search(grid, start, end, heuristic)
    result["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    result["algorithm"] = "A*"
    return jsonify(result)


@app.route("/dijkstra", methods=["POST"])
def run_dijkstra():
    """Dijkstra's Algorithm endpoint."""
    data = request.get_json()
    grid, start, end, _ = parse_grid_input(data)
    t0     = time.perf_counter()
    result = dijkstra_search(grid, start, end)
    result["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    result["algorithm"] = "Dijkstra"
    return jsonify(result)


@app.route("/bfs", methods=["POST"])
def run_bfs():
    """BFS endpoint."""
    data = request.get_json()
    grid, start, end, _ = parse_grid_input(data)
    t0     = time.perf_counter()
    result = bfs_search(grid, start, end)
    result["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    result["algorithm"] = "BFS"
    return jsonify(result)


@app.route("/compare", methods=["POST"])
def run_compare():
    """Run all three algorithms and return combined results."""
    data = request.get_json()
    grid, start, end, heuristic = parse_grid_input(data)
    results = {}

    t0 = time.perf_counter()
    r  = astar_search(grid, start, end, heuristic)
    r["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    r["algorithm"] = "A*"
    results["astar"] = r

    t0 = time.perf_counter()
    r  = dijkstra_search(grid, start, end)
    r["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    r["algorithm"] = "Dijkstra"
    results["dijkstra"] = r

    t0 = time.perf_counter()
    r  = bfs_search(grid, start, end)
    r["execution_time_ms"] = round((time.perf_counter() - t0) * 1000, 4)
    r["algorithm"] = "BFS"
    results["bfs"] = r

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
