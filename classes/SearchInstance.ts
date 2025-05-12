import { assert } from "@std/assert/assert";
import { Grid } from "./Grid.ts";
import { Point } from "./Point.ts";
import { PriorityQueue } from "./PriorityQueue.ts";
import { SearchNode } from "./SearchNode.ts";

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

    calcInitialIntervals() {
        let leftEnd = -1;
        let rightEnd = -1;
    }

}