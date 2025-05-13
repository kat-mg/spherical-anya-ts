import { assert } from "@std/assert/assert";
import { readlines } from "../utils.ts";
import { Point } from './Point.ts';
import { EPSILON, MAX_DECIMAL_PLACES, minLat, maxLat, minLon, maxLon } from "../constants.ts";
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

    onlyLatInGrid(point: Point): number | undefined {
        for (const key of this.latLongIndex.keys()) {
            const [lat, lon] = key.split(',').map(Number);
            if (lat === point.lat && lon !== point.lon) {
                return lat;
            }
        }
        return undefined;
    }

    onlyLonInGrid(point: Point): number | undefined {
        for (const key of this.latLongIndex.keys()) {
            const [lat, lon] = key.split(',').map(Number);
            if (lat !== point.lat && lon === point.lon) {
                return lon;
            }
        }
        return undefined;
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

    isClosestPLeft(point: Point, closestP: Point): number {
        if ( Math.abs(point.lat - closestP.lat) < EPSILON) {
            return 0;
        }

        return point.lat < closestP.lat ? -1 : 1;
    } // Returns 0 if same column, negative if left, positive if right
    
    isClosestPBelow(point: Point, closestP: Point): number {
        if ( Math.abs(point.lon - closestP.lon) < EPSILON) {
            return 0;
        }

        return point.lon < closestP.lon ? -1 : 1;
    } // Returns 0 if same row, negative if below, positive if above

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
            const closestPointIndex = this.findClosestPoint(point);
            
            assert(
                closestPointIndex !== undefined,
                `No closest point found for point: ${point.toString()}`,
            ); // idk how this can happen (here just in case)

            let [i, j] = [closestPointIndex.i, closestPointIndex.j];

            if (this.isClosestPBelow(point, this.points[closestPointIndex.i][closestPointIndex.j]) < 0) {
                [i, j] = [closestPointIndex.i - 1, closestPointIndex.j];
            } // This tile index has the correct i (row) to check; if =0 or =1 then the closest is at the same or above 
            if (this.isClosestPLeft(point, this.points[closestPointIndex.i][closestPointIndex.j]) < 0) {
                [i, j] = [closestPointIndex.i, closestPointIndex.j - 1];
            } // This tile index has the correct j (column) to check; if =0 or =1 then the closest is at the same or left


            // Check if the point is at the edge end of the grid (TODO: CHANGE AFTER CONFIRMATION THAT TILES WRAP AROUND)
            //if (i === this.height || j === this.width) [i, j] = [this.adjustIndexAtLast(i, j).i, this.adjustIndexAtLast(i, j).j];
            let thisTileIndex = [{i, j}];

            const onlyLat = this.onlyLatInGrid(point);
            const onlyLon = this.onlyLonInGrid(point);

            if (onlyLat !== undefined) {
                if (this.isBlocked(thisTileIndex[0].i, thisTileIndex[0].j - 1)) {
                    thisTileIndex = [{i: thisTileIndex[0].i, j: thisTileIndex[0].j - 1}];
                } // Check if the tile to the left of the point is blocked
                else if (!this.isBlocked(thisTileIndex[0].i, thisTileIndex[0].j)) {
                    thisTileIndex = []
                } // Goes here if left and right are traversable

                return {
                    type: PointLocationType.ON_VERTICAL_EDGE,
                    tileIndex: thisTileIndex,
                    closestPoint: this.points[closestPointIndex.i][closestPointIndex.j],
                };
            } // Point is in a vertical edge (but not in grid.points)

            else if (onlyLon !== undefined) {
                if (this.isBlocked(thisTileIndex[0].i-1, thisTileIndex[0].j)) {
                    thisTileIndex = [{i: thisTileIndex[0].i-1, j: thisTileIndex[0].j}];
                } // Check if the tile on top of the point is blocked
                else if (!this.isBlocked(thisTileIndex[0].i, thisTileIndex[0].j)) {
                    thisTileIndex = []
                } // Goes here if top and bottom are traversable
                return {
                    type: PointLocationType.ON_HORIZONTAL_EDGE,
                    tileIndex: thisTileIndex,
                    closestPoint: this.points[closestPointIndex.i][closestPointIndex.j],
                };
            } // Point is in a horizontal edge (but not in grid.points)
            
            else {
                if (this.tiles[closestPointIndex.i][closestPointIndex.j]) {
                    return {
                        type: PointLocationType.INVALID,
                        tileIndex: -1,
                        closestPoint: this.points[closestPointIndex.i][closestPointIndex.j],
                    };
                } // the tile the point is inside of is blocked
                return {
                    type: PointLocationType.INSIDE_TILE,
                    tileIndex: [],
                    closestPoint: this.points[closestPointIndex.i][closestPointIndex.j],
                }; // Point is inside a traversable tile
            } // Point is inside a tile

        }  // Point is not in the grid (find the closest point)

        else {
            let [i, j] = [pointArrIndex.i, pointArrIndex.j];

            // Check if the point is at the edge end of the grid (TODO: CHANGE AFTER CONFIRMATION THAT TILES WRAP AROUND)
            //if (i === this.height || j === this.width) [i, j] = [this.adjustIndexAtLast(i, j).i, this.adjustIndexAtLast(i, j).j];

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
                if ((bottomLeftOfBlocked && topRightOfBlocked && !bottomRightOfBlocked && !topLeftOfBlocked) || 
                    (bottomRightOfBlocked && topLeftOfBlocked && !bottomLeftOfBlocked && !topRightOfBlocked)) {
                    const tilesIndices: Index[] = [];
                    if (bottomLeftOfBlocked) {
                        tilesIndices.push({ i: i - 1, j });
                        tilesIndices.push({ i , j: j - 1 });
                    } else {
                        tilesIndices.push({ i: i - 1, j: j - 1 });
                        tilesIndices.push({ i , j });
                    }
                    return {
                        type: PointLocationType.ON_AMBIG_CORNER,
                        tileIndex: tilesIndices,
                        closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                    };
                } // Point is on an ambiguous corner (2 tiles are blocked)
                else if (blockedTrue.length === 1) {
                    // Find which one is true in blockedResults
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
                        tileIndex: [thisTileIndex],     // This tile is the blocked tile that the point is a corner point to (which ever one is blocked)
                        closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                    };
                } // Point is on a corner point (1 tile is blocked)
                else if (blockedTrue.length === 3) {
                    // Find the only one that is false in blockedResults
                    const tileIndices: Index[] = [];
                    const unblockedTile = blockedRes.indexOf(false);
                    switch (unblockedTile) {
                        case 0: // bottom left of unblocked (push the other 3)
                            tileIndices.push({ i: i - 1, j: j - 1 }); // bottom right
                            tileIndices.push({ i, j }); // top left
                            tileIndices.push({ i, j: j - 1 }); // top right
                            break;
                        case 1: // bottom right of unblocked
                            tileIndices.push({ i: i - 1, j }); // bottom left
                            tileIndices.push({ i, j }); // top left
                            tileIndices.push({ i, j: j - 1 }); // top right
                            break;
                        case 2: // top left of unblocked
                            tileIndices.push({ i: i - 1, j }); // bottom left
                            tileIndices.push({ i: i - 1, j: j - 1 }); // bottom right
                            tileIndices.push({ i, j: j - 1 }); // top right
                            break;
                        case 3: // top right of unblocked
                            tileIndices.push({ i: i - 1, j }); // bottom left
                            tileIndices.push({ i: i - 1, j: j - 1 }); // bottom right
                            tileIndices.push({ i, j }); // top left
                            break;
                        default:
                            console.error("Error: no unblocked tile found how are you here??");
                            break;
                    }

                    return {
                        type: PointLocationType.ON_UNAMBIG_CORNER,
                        tileIndex: tileIndices,     // These tiles are the blocked tiles that the point is a corner point to (which ever one is blocked)
                        closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                    };

                } // Point is on a corner point (3 tiles are blocked)

                console.log("may blocked somewhere", blockedRes);
                return {
                    type: PointLocationType.ON_GRID_NON_CORNER,
                    tileIndex: [], // no tile index if ON_GRID_NON_CORNER
                    closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                };
            } else {
                console.log("walang blocked");
                return {
                    type: PointLocationType.ON_GRID_NON_CORNER,
                    tileIndex: [], // no tile index if ON_GRID_NON_CORNER
                    closestPoint: this.points[pointArrIndex.i][pointArrIndex.j],
                };
            }
        } // Point is in the grid (check if it is a corner point)

    }

    adjustIndexAtLast(i: number, j: number): Index {
        const index: Index = { i, j };
        if (i === this.points[i].length) {
            index.i = this.height - 1;
        }
        if (j === this.height) {
            index.j = this.width - 1;
        }
        return index;
    } // Adjust the index of the point to be within the grid

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