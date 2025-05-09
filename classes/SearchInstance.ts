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
        this.leftIEndpoints = Array.from({ length: graph.height }, () => Array(graph.width).fill(null));
        this.rightIEndpoints = Array.from({ length: graph.height }, () => Array(graph.width).fill(null));

        for (let i = 0; i < graph.height; i++) {
            let lastBlocked = true; // the prev point was blocked
            let prevJ = -1; // the index of the last blocked point
        
            // Get the left endpoints
            for (let j = 0; j < graph.width; j++) {
                this.leftIEndpoints[i][j] = prevJ;
                if (graph.isBlocked(i, j) != lastBlocked) {
                    lastBlocked = !lastBlocked; 
                    prevJ = j; 
                } // Whenever the state changes, we update the left endpoint
            }

            // Get the right endpoints
            lastBlocked = true;
            prevJ = graph.width;
            for (let j = graph.width-1; j >= 0; j--) {
                this.rightIEndpoints[i][j] = prevJ;
                if (graph.isBlocked(i, j) != lastBlocked) {
                    lastBlocked = !lastBlocked; 
                    prevJ = j; 
                } // Whenever the state changes, we update the right endpoint
            }
        }
    } // Compute the left and right endpoints

    getInitialNodes() {
        // Get the index of the start point given its lat/lon
        const startIndex = this.grid.findIndex(this.start._lat, this.start._lon);
        assert(startIndex !== undefined, "Start point not found in the grid.");

        // Might need to revise check Check image
        const blOfBlocked = this.grid.bottomLeftOfBlocked(this.start._lat, this.start._lon)
        const brOfBlocked = this.grid.bottomRightOfBlocked(this.start._lat, this.start._lon)
        const tlOfBlocked = this.grid.topLeftOfBlocked(this.start._lat, this.start._lon)
        const trOfBlocked = this.grid.topRightOfBlocked(this.start._lat, this.start._lon)

        if (!blOfBlocked || !brOfBlocked) {
            let leftMost, rightMost;    // Get the interval endpoints

            if (blOfBlocked) {
                // Explore left up
                leftMost = this.leftIEndpoints[startIndex.i-1][startIndex.j]; // find left endpoint
                rightMost = startIndex.j; // already at right endpoint
            } else if (brOfBlocked) {
                // Explore right up
                leftMost = startIndex.j; // already at left endpoint
                rightMost = this.rightIEndpoints[startIndex.i-1][startIndex.j]; // find right endpoint
            } else {
                // Explore up
                leftMost = this.leftIEndpoints[startIndex.i-1][startIndex.j]; // find left endpoint
                rightMost = this.rightIEndpoints[startIndex.i-1][startIndex.j]; // find right endpoint
            }

            // TO DO: generateUpStartNodes
        } // Generate search nodes above (the point is not the bl or br of a blocked t)

        if (!tlOfBlocked || !trOfBlocked) {
            let leftMost, rightMost;    // Get the interval endpoints

            if (tlOfBlocked) {
                // Explore left down
                leftMost = this.leftIEndpoints[startIndex.i+1][startIndex.j]; // find left endpoint
                rightMost = startIndex.j; // already at right endpoint
            } else if (trOfBlocked) {
                // Explore right down
                leftMost = startIndex.j; // already at left endpoint
                rightMost = this.rightIEndpoints[startIndex.i+1][startIndex.j]; // find right endpoint
            } else {
                // Explore down
                leftMost = this.leftIEndpoints[startIndex.i+1][startIndex.j]; // find left endpoint
                rightMost = this.rightIEndpoints[startIndex.i+1][startIndex.j]; // find right endpoint
            }

            // TO DO: generateDownStartNodes
        } // Generate search nodes below (the point is not the tl or tr of a blocked t)

        // TO DO: Generate search nodes to the left and right

    }

    addSuccessor(source: SearchNode, successor: SearchNode) {
        // Check if the successor is already in the open list
    }

}