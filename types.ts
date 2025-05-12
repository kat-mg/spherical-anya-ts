import { Point } from './classes/Point.ts';

export interface Index {
    i: number;  // row
    j: number;  // column
}

export enum PointLocationType {
    ON_UNAMBIG_CORNER,      //0
    ON_AMBIG_CORNER,        //1
    ON_GRID_NON_CORNER,     //2
    ON_HORIZONTAL_EDGE,     //3
    ON_VERTICAL_EDGE,       //4
    INSIDE_TILE,            //5
}

export interface PointLocation {
    type: PointLocationType;
    tileIndex: Index[] | Index | -1;  // -1 if not a corner point or in a tile
    closestPoint: Point;
}