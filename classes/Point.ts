import { assert } from "@std/assert/assert";
import { EPSILON, TO_DEG, TO_RAD } from "../constants.ts";

export class Point {
    _lat: number;       // x is lat
    _lon: number;       // y is lon

    // Constructor
    constructor(lat: number, lon: number) {
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