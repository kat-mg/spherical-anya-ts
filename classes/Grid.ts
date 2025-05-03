import { assert } from "@std/assert/assert";
import { readlines } from "../utils.ts";
import { Point } from './Point.ts';
import { minLat, maxLat, minLon, maxLon } from "../constants.ts";

interface LatLong {
    lat: number;
    long: number;
}

interface Index {
    i: number;  // row
    j: number;  // column
}

export class Grid {

    points: Point[][] = [];     // 2D array of points (used for HValue computation)
    tiles: boolean[][] = [];    // 2D array that indicatees what is and isn't an obstacle; true = blocked, false = traversable
    latLongIndex: Map<LatLong, Index> = new Map(); // Map of lat-long coordinates to their index in the grid
    width: number = 0;          // Width = number of columns
    height: number = 0;         // Height = number of rows

    constructor() {}

    async read(file: string) {
        const mapReader = readlines(file);
        const firstLine = (await mapReader.next()).value;

        assert(
            firstLine.toLowerCase() === "type octile",
            `Invalid file format: expected 'type octile' but got '${firstLine}'`,
        ); 

        const secondLine = (await mapReader.next()).value;
        const thirdLine = (await mapReader.next()).value;
        const [width, height] = [secondLine[1], thirdLine[1]].map(Number);

        assert(
            !isNaN(width) && !isNaN(height),
            `Invalid width or height: ${secondLine}, ${thirdLine}`,
        );

        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height).fill(true);

        // Convert the rest of the lines to points
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const line = (await mapReader.next()).value;
                const point = new Point(
                    minLat + (maxLat - minLat) * (i / height),
                    minLon + (maxLon - minLon) * (j / width),
                ); // COMPUTATION SUBJECT TO CHANGE TO DO !!
                
                assert(
                    line === '0' || line === '1',
                    `Invalid line character: expected 0 or 1 but got '${line}'`,
                );

                if (line === '1') {
                    this.tiles[i][j] = true; //  0 = valid, 1 = obstacle
                }
                else {
                    this.tiles[i][j] = false; // 0 = valid, 1 = obstacle
                }

                this.points[i][j] = point; // Store the point in the 2D array

                // Store the point in the map TO DO: check for epsilon constant
                const latLong: LatLong = { lat: point.lat, long: point.lon };
                const index: Index = { i, j };
                this.latLongIndex.set(latLong, index);
            }
        }
    }

    findIndex(lat: number, long: number): Index | undefined {
        const latLong: LatLong = { lat, long };
        return this.latLongIndex.get(latLong);
    } // Find the index of a point given its lat/lon (TO DO: epsilon constant check)

    isBlocked(i: number, j: number): boolean {
        if (i < 0 || j < 0 || i >= this.width || j >= this.height) return true; // out of bounds
        return this.tiles[i][j]; // true (1) is blocked, false (0) is traversable
    }

    // If current tile is locked to the bottom/top left/right of a blocked tile
    bottomLeftOfBlocked (i: number, j: number): boolean {
        return this.isBlocked(i+1,j-1);
    }

    bottomRightOfBlocked (i: number, j: number): boolean {
        return this.isBlocked(i+1,j+1);
    }

    topLeftOfBlocked (i: number, j: number): boolean {
        return this.isBlocked(i-1,j-1);
    }

    topRightOfBlocked (i: number, j: number): boolean {
        return this.isBlocked(i-1,j+1);
    }

}