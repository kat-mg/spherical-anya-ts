import { assert } from "@std/assert/assert";
import { readlines } from "../utils.ts";
import { Point } from './Point.ts';
import { minLat, maxLat, minLon, maxLon } from "../constants.ts";

export class GridOld {
    validPoints: Point[] = [];
    obstaclePoints: Point[] = [];
    width: number = 0;
    height: number = 0;

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

        // Convert the rest of the lines to points
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const line = (await mapReader.next()).value;
                const point = new Point(
                    minLat + (maxLat - minLat) * (i / height),
                    minLon + (maxLon - minLon) * (j / width),
                );
                
                assert(
                    line === "." || line === "@",
                    `Invalid line character: expected '.' or '@' but got '${line}'`,
                );

                if (line === ".") {
                    this.validPoints.push(point);
                }
                else if (line === "@") {
                    this.obstaclePoints.push(point);
                }
            }
        }
    }

    convertToPoint(x: number, y: number): Point {
        assert(
            x >= 0 && x < this.width && y >= 0 && y < this.height,
            `Point out of bounds: (${x}, ${y})`,
        );

        const lat = minLat + (maxLat - minLat) * (y / this.height);
        const lon = minLon + (maxLon - minLon) * (x / this.width);

        return new Point(lat, lon);
    }
}