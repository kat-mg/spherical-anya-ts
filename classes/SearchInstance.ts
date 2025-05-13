import { assert } from "@std/assert/assert";
import { Grid } from "./Grid.ts";
import { Point } from "./Point.ts";
import { PriorityQueue } from "./PriorityQueue.ts";
import { SearchNode } from "./SearchNode.ts";
import { EPSILON } from "../constants.ts";

export class SearchInstance {
    grid: Grid;
    start: Point;
    end: Point;

    openList!: PriorityQueue<SearchNode>;

    nodesPushed: number = 0;
    finalNode!: SearchNode;

    constructor(grid: Grid, start: Point, end: Point) {
        this.grid = grid;
        this.start = start;
        this.end = end;

        const compare = (a: SearchNode, b: SearchNode) => a.lt(b);
        this.openList = new PriorityQueue<SearchNode>(compare);
    }

    /* Functions to implement:
    FOR SPHERICAL ANYA SEARCH:
    -> getHValue
    -> genInitialNodes
    -> genSuccessors
    -> pushSuccessors
    -> search
    -> generatePath
    */

    getHValue(root: Point, right: Point, left: Point): number {
        if (root.equal(right) || root.equal(left)) {
            return root.distance(this.end);
        }

        const rightDistance = root.distance(right);
        const leftDistance = root.distance(left);
        const rightToEnd = right.distance(this.end);
        const leftToEnd = left.distance(this.end);

        return Math.min(
            rightDistance + rightToEnd,
            leftDistance + leftToEnd,
        );
    } // TODO : check if this is correct

    genInitialNodes() {
        let leftEnd = -1;
        let rightEnd = -1;

        const startLoc = this.grid.getPointLocation(this.start);
        const closestPoint = startLoc.closestPoint;
        const closestPointIndex = this.grid.findIndex(
            closestPoint._lat,
            closestPoint._lon,
        );

        assert(
            closestPointIndex,
            `Closest point index not found for point: ${closestPoint}`,
        ) // Should never happen

        // Check if the closest point is above (res < 0), below (res > 0), or on the same row (res = 0) as the start point
        const closestPLevel = this.grid.isClosestPBelow(this.start, closestPoint); 

        const currRow = this.grid.tiles[closestPointIndex.i];

        for (let j = closestPointIndex.j; j < currRow.length; j++) {
            const currentPoint = this.grid.points[closestPointIndex.i][j];
            const currentPointLoc = this.grid.getPointLocation(currentPoint);
            if (currentPointLoc.type === 0) {
                rightEnd = j;
                break;
            }
        } // Traverse the row to find the RIGHT end

        for (let j = closestPointIndex.j; j >= 0; j--) {
            const currentPoint = this.grid.points[closestPointIndex.i][j];
            const currentPointLoc = this.grid.getPointLocation(currentPoint);
            if (currentPointLoc.type === 0) {
                leftEnd = j;
                break;
            }
        } // Traverse the row to find the LEFT end
    }
}