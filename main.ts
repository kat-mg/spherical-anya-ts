// export function add(a: number, b: number): number {
//   return a + b;
// }

// // Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
// if (import.meta.main) {
//   console.log("Add 2 + 3 =", add(2, 3));
// }
import { Grid } from "./classes/Grid.ts";

const grid = new Grid();
await grid.read("maps/map1.txt");
console.log(grid.points.length, grid.points[0].length);