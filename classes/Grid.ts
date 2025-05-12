import { assert } from "@std/assert/assert";
import { readlines } from "../utils.ts";
import { Point } from './Point.ts';
import { MAX_DECIMAL_PLACES, minLat, maxLat, minLon, maxLon } from "../constants.ts";
import { Index, PointLocationType, PointLocation } from "../types.ts";

export class Grid {

    points!: Point[][];     // 2D array of points (used for HValue computation)
    tiles!: boolean[][];    // 2D array that indicatees what is and isn't an obstacle; true = blocked, false = traversable
    latLongIndex: Map<string, Index> = new Map(); // Map of the set lat/long coordinates to the index of the point in the grid
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

        const secondLine = (await mapReader.next()).value.split(' ');
        const thirdLine = (await mapReader.next()).value.split(' ');
        const [height, width] = [secondLine[1], thirdLine[1]].map(Number);

        assert(
            !isNaN(width) && !isNaN(height),
            `Invalid width or height: ${secondLine}, ${thirdLine}`,
        );

        this.width = width;
        this.height = height;
        this.tiles = new Array(width * height).fill(true);

        // Initialize the points array and tiles array
        this.points = Array.from({ length: this.height + 1 }, () => Array(this.width + 1).fill(null));
        this.tiles = Array.from({ length: this.height }, () => Array(this.width).fill(false));

        // Convert the rest of the lines to points
        for (let i = 0; i < height + 1; i++) {
            let line: string[] = [];
            if (i < height) {
                line = (await mapReader.next()).value.split(' ');

                assert(
                    line.length === width,
                    `Invalid line length: expected ${width} but got ${line.length}`,
                );
            }

            for (let j = 0; j < width + 1; j++) {
                // Get the tile traversability; size is tiles[height][width] (0 = traversable, 1 = blocked)
                if (i < height && j < width) {
                    const currentTile = line[j];

                    assert(
                        currentTile === '0' || currentTile === '1',
                        `Invalid line character: expected 0 or 1 but got '${currentTile}' at (${i}, ${j})`,
                    );

                    this.tiles[i][j] = currentTile === '1' ? true : false;
                }

                // Get the point coordinates; size is points[height+1][width+1]
                const point = this.arrayIndexToPoint(i, j);
                this.points[i][j] = point;


                // Store the point in the map TODO: check for epsilon constant
                const index: Index = { i, j };
                const latLongKey = this.latLongToString(point._lat, point._lon);
                this.latLongIndex.set(latLongKey, index);
            }
        }
    }

    latLongToString(lat: number, lon: number): string {
        return `${lat.toFixed(MAX_DECIMAL_PLACES)},${lon.toFixed(MAX_DECIMAL_PLACES)}`;
    }

    arrayIndexToPoint(i: number, j: number): Point {
        const lat = parseFloat(((j / this.width) * 2 * maxLat - maxLat).toFixed(MAX_DECIMAL_PLACES));
        const long = parseFloat((maxLon - (i / this.height) * 2 * maxLon).toFixed(MAX_DECIMAL_PLACES));
        return new Point(lat, long);
    }

    findIndex(lat: number, long: number): Index | undefined {
        const latLongKey = this.latLongToString(lat, long);
        return this.latLongIndex.get(latLongKey);
    } // Find the index of a point given its lat/lon (TODO: epsilon constant check)

    onlyLatInGrid(point: Point) {
        for (const key of this.latLongIndex.keys()) {
            const [lat, lon] = key.split(',').map(Number);
            if (lat === point.lat && lon !== point.lon) {
                return true;
            }
        }
        return false;
    }

    onlyLonInGrid(point: Point) {
        for (const key of this.latLongIndex.keys()) {
            const [lat, lon] = key.split(',').map(Number);
            if (lat !== point.lat && lon === point.lon) {
                return true;
            }
        }
        return false;
    }

    findClosestPoint(point: Point): Index | undefined {
        // Find the closest point in the grid to the given point
        let closestPoint: Index | undefined;
        let minDistance = Infinity;

        for (let i = 0; i < this.height + 1; i++) {
            for (let j = 0; j < this.width + 1; j++) {
                const distance = this.points[i][j].distance(point);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = { i, j };
                }
            }
        }

        return closestPoint;
    }

    getPointLocation(point: Point) : PointLocation {
        if (point.lat < minLat || point.lat > maxLat || point.lon < minLon || point.lon > maxLon) {
            return {
                type: PointLocationType.INVALID,
                tileIndex: -1,
                closestPoint: point,
            }
        }

        const pointArrIndex = this.findIndex(point.lat, point.lon);

        if (pointArrIndex === undefined) {
            const closestPoint = this.findClosestPoint(point);
            
            assert(
                closestPoint !== undefined,
                `No closest point found for point: ${point.toString()}`,
            ); // idk how this can happen (here just in case)

            if (this.onlyLatInGrid(point)) {
                return {
                    type: PointLocationType.ON_VERTICAL_EDGE,
                    tileIndex: -1,
                    closestPoint: this.points[closestPoint.i][closestPoint.j],
                };
            } // Point is in a vertical edge (but not in grid.points)
            else if (this.onlyLonInGrid(point)) {
                return {
                    type: PointLocationType.ON_HORIZONTAL_EDGE,
                    tileIndex: -1,
                    closestPoint: this.points[closestPoint.i][closestPoint.j],
                };
            } // Point is in a horizontal edge (but not in grid.points)
            else {
                if (closestPoint.i === this.height) {
                    closestPoint.i = this.height - 1;
                }
                if (closestPoint.j === this.width) {
                    closestPoint.j = this.width - 1;
                }
                if (this.tiles[closestPoint.i][closestPoint.j]) {
                    return {
                        type: PointLocationType.INVALID,
                        tileIndex: closestPoint,
                        closestPoint: this.points[closestPoint.i][closestPoint.j],
                    };
                } // the tile the point is inside of is blocked
                return {
                    type: PointLocationType.INSIDE_TILE,
                    tileIndex: closestPoint,
                    closestPoint: this.points[closestPoint.i][closestPoint.j],
                }; // Point is inside a traversable tile
            } // Point is inside a tile
        }  // Point is not in the grid (find the closest point)
        else {
            let [i, j] = [pointArrIndex.i, pointArrIndex.j];

            // Check if the point is at the edge end of the grid
            if (i === this.height) {
                i = this.height - 1;
            }
            if (j === this.width) {
                j = this.width - 1;
            }

            // Check if the point is a corner point
            const bottomLeftOfBlocked = this.bottomLeftOfBlocked(i, j);
            const bottomRightOfBlocked = this.bottomRightOfBlocked(i, j);
            const topLeftOfBlocked = this.topLeftOfBlocked(i, j);
            const topRightOfBlocked = this.topRightOfBlocked(i, j);
            const blockedRes = [bottomLeftOfBlocked, bottomRightOfBlocked, topLeftOfBlocked, topRightOfBlocked];
            const blockedTrue = blockedRes.filter(Boolean);

            if (blockedTrue.length === 4) {
                return {
                    type: PointLocationType.INVALID,
                    tileIndex: -1,
                    closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                }; // the tile the point is surrounded by blocked tiles
            }

            if (bottomLeftOfBlocked || bottomRightOfBlocked || topLeftOfBlocked || topRightOfBlocked) {
                if ((bottomLeftOfBlocked && topRightOfBlocked) || (bottomRightOfBlocked && topLeftOfBlocked)) {
                    const tilesIndices: Index[] = [];
                    if (bottomLeftOfBlocked) {
                        //console.log("bottomLeftOfBlocked");
                        tilesIndices.push({ i: i - 1, j });
                        tilesIndices.push({ i , j: j - 1 });
                    } else {
                        //console.log("bottomRightOfBlocked");
                        tilesIndices.push({ i: i - 1, j: j - 1 });
                        tilesIndices.push({ i , j });
                    }
                    return {
                        type: PointLocationType.ON_AMBIG_CORNER,
                        tileIndex: tilesIndices,
                        closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                    };
                }
                else if (blockedTrue.length === 1) {
                    // Find whic one is true in blockedResults
                    let thisTileIndex: Index = { i: -1, j: -1 };
                    switch (blockedTrue[0]) {
                        case bottomLeftOfBlocked:
                            thisTileIndex = { i: i - 1, j };
                            break;
                        case bottomRightOfBlocked:
                            thisTileIndex = { i: i - 1, j: j - 1 };
                            break;
                        case topLeftOfBlocked:
                            thisTileIndex = { i, j };
                            break;
                        case topRightOfBlocked:
                            thisTileIndex = { i, j: j - 1 };
                            break;
                        default:
                            console.error("Error: no blocked tile found");
                            break;
                    } // Find the index of the blocked tile

                    return {
                        type: PointLocationType.ON_UNAMBIG_CORNER,
                        tileIndex: thisTileIndex,     // This tile is the blocked tile that the point is a corner point to (which ever one is blocked) TODO
                        closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                    };
                }

                return {
                    type: PointLocationType.ON_GRID_NON_CORNER,
                    tileIndex: -1,
                    closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                };
            } else {
                return {
                    type: PointLocationType.ON_GRID_NON_CORNER,
                    tileIndex: -1,
                    closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                };
            }
        } // Point is in the grid (check if it is a corner point)

    }

    isBlocked(i: number, j: number): boolean {
        if (i < 0 || j < 0 || j >= this.width || i >= this.height) return true; // out of bounds
        return this.tiles[i][j]; // true (1) is blocked, false (0) is traversable
    }

    // If current tile is locked to the bottom/top left/right of a blocked tile
    bottomLeftOfBlocked (i: number, j: number): boolean {
        //console.log(`bottomLeftOfBlocked(${i-1}, ${j})`);
        return this.isBlocked(i-1,j);
    } // Look at the top right tile

    bottomRightOfBlocked (i: number, j: number): boolean {
        //console.log(`bottomRightOfBlocked(${i-1}, ${j-1})`);
        return this.isBlocked(i-1,j-1);
    } // look at the top left tile

    topLeftOfBlocked (i: number, j: number): boolean {
        //console.log(`topLeftOfBlocked(${i}, ${j})`);
        return this.isBlocked(i,j);
    } // look at the bottoom right tile

    topRightOfBlocked (i: number, j: number): boolean {
        //console.log(`topRightOfBlocked(${i}, ${j-1})`);
        return this.isBlocked(i,j-1);
    } // look at the bottom left tile

}