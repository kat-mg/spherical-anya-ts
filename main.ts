// export function add(a: number, b: number): number {
//   return a + b;
// }

// // Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
// if (import.meta.main) {
//   console.log("Add 2 + 3 =", add(2, 3));
// }
import { Grid } from "./classes/Grid.ts";
import { Point } from "./classes/Point.ts";

const grid = new Grid();
await grid.read("maps/map1.txt");

console.log("Grid width: ", grid.width, "Grid height", grid.height);

const stringifiedPoints = [];
for (let i = 0; i < grid.height + 1; i++) {
    let thisPointLine = "";
    for (let j = 0; j < grid.points[i].length; j++) {
        thisPointLine = thisPointLine.concat(grid.points[i][j].toString(), " ");
    }
    stringifiedPoints.push(thisPointLine);
}

for (let i = 0; i < grid.height; i++) {
    console.log(stringifiedPoints[i]);
    console.log(JSON.stringify(grid.tiles[i]));
    if (i === grid.height - 1) {
        console.log(stringifiedPoints[i + 1]);
    }
}

function getPointLocTests(grid: Grid, points: Point[]) {
    for (const point of points) {
        console.log("=================================");
        console.log(`Point: ${point}`);
        const pointLocation = grid.getPointLocation(point);
        console.log("Point Location: ", pointLocation);
        console.log("Point Index: ", grid.findIndex(pointLocation.closestPoint._lat, pointLocation.closestPoint._lon));
    }
}

/* getPointLocation tests */
const point1 = new Point(-72, 128.57143);
const point2 = new Point(-81, 180);
const point3 = new Point(-54, 100);
const point4 = new Point(62, -140.1231);
const point5 = new Point(72, 25.71429);
const points = [point1, point2, point3, point4, point5];

getPointLocTests(grid, points);