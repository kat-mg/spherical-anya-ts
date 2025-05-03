# spherical-anya-ts
Spherical Anya in TypeScript (based on Spherical Polyanya)

Map format is going to be:
1st line: `type octile`
2nd line: `height y` where y is the amount of points for the map height
3rd line: `width x` where x is the amount of points for the map width
4th line: `map`
5th to (y+5)th lines: Map details where a `0` constitutes as a traversable point. `1` is an obstacle.