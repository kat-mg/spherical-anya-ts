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
    INVALID,                //6
}

export interface PointLocation {
    type: PointLocationType;
    tileIndex: Index[] | -1;
    closestPoint: Point;
} 
// index[] is the array of blocked tiles associated with the point; 
// -1 if invalid tile