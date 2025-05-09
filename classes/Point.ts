import { assert } from "@std/assert/assert";
import { EPSILON, TO_DEG, TO_RAD } from "../constants.ts";

export class Point {
    _lat: number;       // x is lat
    _lon: number;       // y is lon

    x!: number; // x coordinate in 3D space
    y!: number; // y coordinate in 3D space
    z!: number; // z coordinate in 3D space

    // Constructor
    constructor(lat: number, lon: number, fromCartesian: boolean = false) {
        assert(
            lat >= -90 && lat <= 90,
            `Latitude must be between -90 and 90 degrees: ${lat}`,
        );

        assert(
        lon >= -180 && lon <= 180,
        `Longitude must be between -180 and 180 degrees: ${lon}`,
        );

        this._lat = lat;
        this._lon = lon;

        if (!fromCartesian) {
            const latRad = lat * TO_RAD;
            const lonRad = lon * TO_RAD;
      
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);
            const cosLon = Math.cos(lonRad);
            const sinLon = Math.sin(lonRad);
      
            this.x = cosLat * cosLon;
            this.y = cosLat * sinLon;
            this.z = sinLat;
          }
    }

    // Compare if two points are equal
    equal(other: Point): boolean {
        if (Math.abs(this.lat - other.lat) < EPSILON) {
            // Polar coordinates
            if (
                Math.abs(Math.abs(this.lat) - 90) < EPSILON && 
                Math.abs(Math.abs(other.lat) - 90) < EPSILON
            ) {
                return true;
            }

            return Math.abs(this.lon - other.lon) < EPSILON;
        }

        return false;
    }

    // Distance between two points
    cosDistance(other: Point): number {
        const lat1 = this.lat * TO_RAD;
        const lat2 = other.lat * TO_RAD;
        const dLon = (this.lon - other.lon) * TO_RAD;

        const a = Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);

        return Math.acos(a) * TO_DEG;
    }

    havDistance(other: Point): number {
        const lat1 = this.lat * TO_RAD;
        const lon1 = this.lon * TO_RAD;
        const lat2 = other.lat * TO_RAD;
        const lon2 = other.lon * TO_RAD;

        const dLat = Math.abs(lat1 - lat2);
        const dLon = Math.abs(lon1 - lon2);

        const sinLat = Math.sin(dLat / 2);
        const sinLon = Math.sin(dLon / 2);

        const a = sinLat * sinLat +
            Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

        return 2 * Math.asin(Math.sqrt(a)) * TO_DEG;
    }

    distance(other: Point): number {
        if (this.equal(other)) {
            return 0;
        }

        return this.cosDistance(other);
    }

    // Automatically normalises the point (needed for getIntersection)
    static fromCartesian(
        x: number,
        y: number,
        z: number,
        normalise: boolean = true,
    ): Point {
        const norm = Math.sqrt(x * x + y * y + z * z);

        assert(norm > EPSILON, `Cannot create point from zero vector`);

        const lat = Math.asin(z / norm) * TO_DEG;
        const lon = Math.atan2(y, x) * TO_DEG;

        assert(!isNaN(lat), `Latitude is NaN: Math.asin(${z} / ${norm})`);
        assert(!isNaN(lon), `Longitude is NaN`);

        // debug(`Point.fromCartesian: x=${x}, y=${y}, z=${z}, lat=${lat}, lon=${lon}`);

        const point = new Point(lat, lon, true);

        if (!normalise) {
        point.x = x;
        point.y = y;
        point.z = z;

        return point;
        }

        point.x = x / norm;
        point.y = y / norm;
        point.z = z / norm;

        return point;
    }

    // Needed for getIntersection
    negate(): Point {
        return new Point(-this.lat, (this.lon + 360) % 360 - 180);
    }

    // Needed to get the great circle lines; Needed for spherical anya projection
    getIntersection(
        p1: Point,
        p2: Point,
        p3: Point,
        p4: Point,
      ): [Point, Point] | false {
        // Cross p1 and p2
        const ax = p1.y * p2.z - p1.z * p2.y;
        const ay = p1.z * p2.x - p1.x * p2.z;
        const az = p1.x * p2.y - p1.y * p2.x;
    
        // Cross p3 and p4
        const bx = p3.y * p4.z - p3.z * p4.y;
        const by = p3.z * p4.x - p3.x * p4.z;
        const bz = p3.x * p4.y - p3.y * p4.x;
    
        // Cross a and b
        const cx = ay * bz - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;
    
        // Check magnitude
        if (cx * cx + cy * cy + cz * cz < EPSILON * EPSILON) {
          // Circles are identical
          return false;
        }
    
        const intersection = Point.fromCartesian(cx, cy, cz);
    
        return [intersection, intersection.negate()];
    }

    // Getters and Setters
    get lat(): number {
        return this._lat;
    }

    set lat(lat: number) {
        assert(
            lat >= -90 && lat <= 90,
            `Latitude must be between -90 and 90 degrees: ${lat}`,
        );
        this._lat = lat;
    }

    get lon(): number {
        return this._lon;
    }
    
    set lon(lon: number) {
        assert(
            lon >= -180 && lon <= 180,
            `Longitude must be between -180 and 180 degrees: ${lon}`,
        );
        this._lon = lon;
    }

    toString(): string {
        return `Point(${String(this._lat.toFixed(5))}, ${String(this._lon.toFixed(5))})`;
    }
}