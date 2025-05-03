import { Point } from "./Point.ts";

export class SearchNode {
    parent: SearchNode | null;

    root: Point;
    right: Point;
    left: Point;

    g: number; // Cost from start to this node
    h: number; // Heuristic cost from this node to goal

    constructor(
        parent: SearchNode | null,
        root: Point,
        right: Point,
        left: Point,
        g: number,
        h: number,
    ) {
        this.parent = parent;
        this.root = root;
        this.right = right;
        this.left = left;
        this.g = g;
        this.h = h;
    }

    // Comaperers
    lt (other: SearchNode): boolean {
        if (this.f === other.f) {
            // If two nodes have the same f, the one with bigger g is "smaller"
            return this.g > other.g;
        }
      
          return this.f < other.f;
    }

    gt (other: SearchNode): boolean {
        return !this.lt(other);
    }

    get f(): number {
        return this.g + this.h;
    }

    toString(): string {
        return `SearchNode(${this.root.toString()}, [${this.right.toString()}, ${this.left.toString()}], f: ${
          this.f.toFixed(2)
        }, g: ${this.g}, h: ${this.h.toFixed(2)})`;
    }
}