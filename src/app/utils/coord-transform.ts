
// Constants for the GCJ-02 (Mars Geodetic System) conversion
const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
const pi = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLon(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
    return ret;
}

/**
 * WGS-84 to GCJ-02 (standard GPS to Gaode/Tencent/GoogleChina)
 */
export function wgs84ToGcj02(lat: number, lng: number): [number, number] {
    if (outOfChina(lat, lng)) {
        return [lat, lng];
    }
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLon = transformLon(lng - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * pi;
    const magic = Math.sin(radLat);
    const sqrtMagic = Math.sqrt(1 - ee * magic * magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
    return [lat + dLat, lng + dLon];
}

/**
 * GCJ-02 to WGS-84 (Gaode/Tencent/GoogleChina to standard GPS)
 */
export function gcj02ToWgs84(lat: number, lng: number): [number, number] {
    if (outOfChina(lat, lng)) {
        return [lat, lng];
    }
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLon = transformLon(lng - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * pi;
    const magic = Math.sin(radLat);
    const sqrtMagic = Math.sqrt(1 - ee * magic * magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
    const mglat = lat + dLat;
    const mglng = lng + dLon;
    return [lat * 2 - mglat, lng * 2 - mglng];
}

function outOfChina(lat: number, lon: number): boolean {
    if (lon < 72.004 || lon > 137.8347) {
        return true;
    }
    if (lat < 0.8293 || lat > 55.8271) {
        return true;
    }
    return false;
}
