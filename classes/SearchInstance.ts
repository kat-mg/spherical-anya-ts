import { assert } from "@std/assert/assert";
import { Grid } from "./Grid.ts";
import { Point } from "./Point.ts";
import { PriorityQueue } from "./PriorityQueue.ts";
import { SearchNode } from "./SearchNode.ts";

export class SearchInstance {
    grid: Grid;
    start: Point;
    end: Point;

    rightIEndpoints!: number[][]; // Right interval endpoints index
    leftIEndpoints!: number[][];  // Left interval endpoints index

    openList!: PriorityQueue<SearchNode>;

    nodesPushed: number = 0;
    finalNode!: SearchNode;

    constructor(grid: Grid, start: Point, end: Point) {
        this.grid = grid;
        this.start = start;
        this.end = end;

        const compare = (a: SearchNode, b: SearchNode) => a.lt(b);
        this.openList = new PriorityQueue<SearchNode>(compare);
        this.computeIntervals(grid); // Initialize the intervals
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

    computeIntervals(graph: Grid) {
        // Initialization of the intervals
        this.leftIEndpoints = Array.from({ length: graph.height + 1 }, () => Array(graph.width).fill(null));
        this.rightIEndpoints = Array.from({ length: graph.height + 1 }, () => Array(graph.width).fill(null));

        for (let i = 0; i < graph.height + 1; i++) {
            let lastBlocked = true; // the prev point was blocked
            let prevJ = -1; // the index of the last blocked point
        
            // Get the left endpoints
            for (let j = 0; j < graph.width + 1; j++) {
                this.leftIEndpoints[i][j] = prevJ;
                if (graph.isBlocked(i, j) != lastBlocked) {
                    lastBlocked = !lastBlocked; 
                    prevJ = j; 
                } // Whenever the state changes, we update the left endpoint
            }

            // Get the right endpoints
            lastBlocked = true;
            prevJ = graph.width + 1;    // Recall number of points in a row is width + 1 (so invalid index is width + 1)
            for (let j = graph.width; j >= 0; j--) {
                this.rightIEndpoints[i][j] = prevJ;
                if (graph.isBlocked(i, j) != lastBlocked) {
                    lastBlocked = !lastBlocked; 
                    prevJ = j; 
                } // Whenever the state changes, we update the right endpoint
            }
        }
    } // Compute the left and right endpoints

    /* Exploration (Projections) */

}