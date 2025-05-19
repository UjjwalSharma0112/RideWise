import fs from 'fs';

const graph = JSON.parse(fs.readFileSync('./Dehradun,India.json'));

class PathFinder {
  constructor() {
    this.graph = graph;
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  findNearestNode(lat, lng) {
    let nearest = null, minDist = Infinity;
    for (let id in this.graph.nodes) {
      const node = this.graph.nodes[id];
      const dist = this.haversine(lat, lng, node.lat, node.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = id;
      }
    }
    return nearest;
  }

  aStar(start, goal) {
    const openSet = new Set([start]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (let node in this.graph.nodes) {
      gScore[node] = Infinity;
      fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = this.haversine(
      this.graph.nodes[start].lat,
      this.graph.nodes[start].lng,
      this.graph.nodes[goal].lat,
      this.graph.nodes[goal].lng
    );

    while (openSet.size > 0) {
      let current = [...openSet].reduce((a, b) =>
        fScore[a] < fScore[b] ? a : b
      );

      if (current === goal) {
        const path = [];
        while (current) {
          path.unshift(current);
          current = cameFrom[current];
        }
        return path;
      }

      openSet.delete(current);

      for (let neighbor of this.graph.edges[current] || []) {
        const tentativeGScore = gScore[current] + neighbor.weight;
        if (tentativeGScore < gScore[neighbor.to]) {
          cameFrom[neighbor.to] = current;
          gScore[neighbor.to] = tentativeGScore;
          fScore[neighbor.to] = tentativeGScore +
            this.haversine(
              this.graph.nodes[neighbor.to].lat,
              this.graph.nodes[neighbor.to].lng,
              this.graph.nodes[goal].lat,
              this.graph.nodes[goal].lng
            );
          openSet.add(neighbor.to);
        }
      }
    }

    return null; // No path found
  }

  getDistanceBetweenCoordinates(lat1, lng1, lat2, lng2) {
    const start = this.findNearestNode(lat1, lng1);
    const end = this.findNearestNode(lat2, lng2);
    const path = this.aStar(start, end);
    if (!path) return Infinity;

    let totalDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edges = this.graph.edges[path[i]];
      const edge = edges.find(e => e.to === path[i + 1]);
      if (edge) totalDist += edge.weight;
    }

    return totalDist;
  }
}

export default PathFinder;
