#!/usr/bin/env python3
"""Cut a country-sized street map out of a Protomaps planet build, for Gati's offline map.

Reads only the parts of the remote PMTiles archive that cover the bounding box (HTTP range requests), and writes a
small, valid PMTiles v3 file. The bounding box comes from data/country.json ("map.maxBounds") unless --bbox is given.
Low zooms keep the whole box for context; from --clip-from up, only tiles inside the country outline (plus one tile
around it) are kept, which is what keeps the file small.

Usage:
  python scripts/make_offline_map.py --dry-run --maxzoom 11        # show tile count and size, download nothing
  python scripts/make_offline_map.py --maxzoom 11                  # write data/offline/basemap.pmtiles

Source: https://build.protomaps.com/<YYYYMMDD>.pmtiles (map data (c) OpenStreetMap contributors, ODbL).
Standard library only. Format: https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md
"""
import argparse, bisect, gzip, json, math, struct, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HDR = "<7sB11Q6B4iB2i"          # 127 bytes


def http_range(url, start, length, tries=4):
    req = urllib.request.Request(url, headers={"Range": f"bytes={start}-{start + length - 1}", "User-Agent": "gati-offline-map"})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            if len(data) == length:
                return data
        except OSError:
            pass
        time.sleep(2 ** i)
    raise SystemExit(f"Could not read bytes {start}+{length} from the source")


def read_varints(buf, pos, n):
    out = []
    for _ in range(n):
        v = shift = 0
        while True:
            b = buf[pos]; pos += 1
            v |= (b & 0x7F) << shift
            if b < 0x80:
                break
            shift += 7
        out.append(v)
    return out, pos


def write_varint(v, out):
    while v >= 0x80:
        out.append((v & 0x7F) | 0x80); v >>= 7
    out.append(v)


def parse_dir(raw):
    """-> list of (tile_id, offset, length, run_length); run_length 0 marks a leaf directory."""
    buf = gzip.decompress(raw)
    (n,), pos = read_varints(buf, 0, 1)
    deltas, pos = read_varints(buf, pos, n)
    runs, pos = read_varints(buf, pos, n)
    lens, pos = read_varints(buf, pos, n)
    offs, pos = read_varints(buf, pos, n)
    out, tid = [], 0
    for i in range(n):
        tid += deltas[i]
        off = out[i - 1][1] + out[i - 1][2] if (offs[i] == 0 and i > 0) else offs[i] - 1
        out.append((tid, off, lens[i], runs[i]))
    return out


def build_dir(entries):
    out = bytearray()
    write_varint(len(entries), out)
    last = 0
    for e in entries:
        write_varint(e[0] - last, out); last = e[0]
    for e in entries:
        write_varint(e[3], out)
    for e in entries:
        write_varint(e[2], out)
    for i, e in enumerate(entries):
        prev = entries[i - 1] if i else None
        write_varint(0 if (prev and e[1] == prev[1] + prev[2]) else e[1] + 1, out)
    return gzip.compress(bytes(out), mtime=0)


def tile_id(z, x, y):
    acc = (4 ** z - 1) // 3
    d, s = 0, (1 << z) >> 1
    while s > 0:
        rx, ry = (1 if x & s else 0), (1 if y & s else 0)
        d += s * s * ((3 * rx) ^ ry)
        if ry == 0:
            if rx == 1:
                x, y = s - 1 - x, s - 1 - y
            x, y = y, x
        s >>= 1
    return acc + d


def tiles_for(bbox, z):
    w, s, e, n = bbox
    def xy(lon, lat):
        k = 1 << z
        x = int((lon + 180) / 360 * k)
        y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * k)
        return min(k - 1, max(0, x)), min(k - 1, max(0, y))
    x0, y0 = xy(w, n); x1, y1 = xy(e, s)
    return [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]


def tile_xy(lon, lat, z):
    k = 1 << z
    x = int((lon + 180) / 360 * k)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * k)
    return min(k - 1, max(0, x)), min(k - 1, max(0, y))


def rings_of(geojson):
    for f in geojson["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            yield poly[0]                      # outer ring is enough for "is this tile in the country"


def tiles_in_rings(rings, z, buffer=1):
    """Tiles at zoom z that touch the outlines or lie inside them, grown by `buffer` tiles."""
    tiles = set()
    for ring in rings:
        xs, ys = [], []
        for (lon0, lat0), (lon1, lat1) in zip(ring, ring[1:]):
            x0, y0 = tile_xy(lon0, lat0, z); x1, y1 = tile_xy(lon1, lat1, z)
            n = max(abs(x1 - x0), abs(y1 - y0), 1) * 2
            for i in range(n + 1):
                tiles.add(tile_xy(lon0 + (lon1 - lon0) * i / n, lat0 + (lat1 - lat0) * i / n, z))
            xs += [x0, x1]; ys += [y0, y1]
        k = 1 << z
        for x in range(min(xs), max(xs) + 1):      # fill the inside: test each tile centre against the ring
            lon = (x + 0.5) / k * 360 - 180
            for y in range(min(ys), max(ys) + 1):
                if (x, y) in tiles:
                    continue
                lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 0.5) / k))))
                inside = False
                for (ax, ay), (bx, by) in zip(ring, ring[1:]):
                    if (ay > lat) != (by > lat) and lon < (bx - ax) * (lat - ay) / (by - ay) + ax:
                        inside = not inside
                if inside:
                    tiles.add((x, y))
    out = set()
    for x, y in tiles:
        for dx in range(-buffer, buffer + 1):
            for dy in range(-buffer, buffer + 1):
                out.add((z, x + dx, y + dy))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--source", default="", help="URL of the planet PMTiles; default: the newest daily build found")
    ap.add_argument("--bbox", default="", help="west,south,east,north; default: data/country.json map.maxBounds")
    ap.add_argument("--maxzoom", type=int, default=11)
    ap.add_argument("--out", default=str(ROOT / "data" / "offline" / "basemap.pmtiles"))
    ap.add_argument("--clip", default="", help="GeoJSON outline; detailed zooms keep only tiles inside it. Default: the district file in data/country.json")
    ap.add_argument("--clip-from", type=int, default=9, help="first zoom that is clipped to the outline (lower zooms keep the whole box)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)

    if a.bbox:
        bbox = [float(v) for v in a.bbox.split(",")]
    else:
        (s, w), (n, e) = json.loads((ROOT / "data" / "country.json").read_text(encoding="utf-8"))["map"]["maxBounds"]
        bbox = [w, s, e, n]
    src = a.source
    if not src:
        t = time.time()
        for back in range(1, 10):
            day = time.strftime("%Y%m%d", time.gmtime(t - back * 86400))
            try:
                urllib.request.urlopen(urllib.request.Request(f"https://build.protomaps.com/{day}.pmtiles", method="HEAD"), timeout=30)
                src = f"https://build.protomaps.com/{day}.pmtiles"; break
            except OSError:
                continue
        if not src:
            raise SystemExit("No recent build found; pass --source")
    print("source:", src, "bbox:", bbox, "maxzoom:", a.maxzoom)

    head = http_range(src, 0, 16384)
    h = list(struct.unpack(HDR, head[:127]))
    if h[0] != b"PMTiles" or h[1] != 3:
        raise SystemExit("Not a PMTiles v3 archive")
    root_off, root_len, meta_off, meta_len, leaf_off, _leaf_len, data_off = h[2:9]
    if h[14] != 2:
        raise SystemExit("Only gzip-compressed directories are supported")
    root = parse_dir(head[root_off:root_off + root_len] if root_off + root_len <= len(head) else http_range(src, root_off, root_len))
    metadata = http_range(src, meta_off, meta_len)
    maxzoom = min(a.maxzoom, h[18])

    cj = json.loads((ROOT / "data" / "country.json").read_text(encoding="utf-8"))
    clip = a.clip or str(ROOT / cj["adminLevels"]["district"]["geometry"])
    rings = list(rings_of(json.loads(Path(clip).read_text(encoding="utf-8"))))
    tiles = set()
    for z in range(0, maxzoom + 1):
        box = set(tiles_for(bbox, z))
        tiles |= box if z < a.clip_from else (box & tiles_in_rings(rings, z))
    wanted = sorted(tile_id(*t) for t in tiles)
    leaves = {}
    def lookup(tid, directory, depth=0):
        ids = [e[0] for e in directory]
        i = bisect.bisect_right(ids, tid) - 1
        if i < 0:
            return None
        t, off, ln, run = directory[i]
        if run == 0:
            if depth > 3:
                return None
            if off not in leaves:
                d = parse_dir(http_range(src, leaf_off + off, ln)); leaves[off] = (d, [e[0] for e in d])
            return lookup(tid, leaves[off][0], depth + 1)
        return (off, ln) if tid < t + run else None
    found = {}
    for n, tid in enumerate(wanted):
        r = lookup(tid, root)
        if r:
            found[tid] = r
    blobs = sorted(set(found.values()))
    total = sum(l for _, l in blobs)
    print(f"tiles wanted {len(wanted)}, present {len(found)}, distinct {len(blobs)}, tile data {total / 1e6:.1f} MB, leaf directories read {len(leaves)}")
    if a.dry_run:
        return 0

    # Download tile data, merging neighbouring byte ranges into one request.
    groups, GAP = [], 256 * 1024
    for off, ln in blobs:
        if groups and off - (groups[-1][0] + groups[-1][1]) <= GAP and groups[-1][1] < 24 * 1024 * 1024:
            groups[-1][1] = off + ln - groups[-1][0]; groups[-1][2].append((off, ln))
        else:
            groups.append([off, ln, [(off, ln)]])
    print(f"downloading in {len(groups)} requests ...")
    newpos, data = {}, bytearray()
    for gi, (goff, glen, members) in enumerate(groups):
        chunk = http_range(src, data_off + goff, glen)
        for off, ln in members:
            newpos[(off, ln)] = len(data)
            data += chunk[off - goff:off - goff + ln]
        if gi % 20 == 0:
            print(f"  {gi}/{len(groups)}  {len(data) / 1e6:.1f} MB", flush=True)

    entries = []
    for tid in sorted(found):
        off, ln = found[tid]; pos = newpos[(off, ln)]
        if entries and entries[-1][1] == pos and entries[-1][0] + entries[-1][3] == tid:
            entries[-1][3] += 1
        else:
            entries.append([tid, pos, ln, 1])
    root_bytes, leaf_bytes = build_dir(entries), b""
    if len(root_bytes) > 16384 - 127:
        per = 2048
        while True:
            leaf_bytes, tops = b"", []
            for i in range(0, len(entries), per):
                lb = build_dir(entries[i:i + per])
                tops.append([entries[i][0], len(leaf_bytes), len(lb), 0]); leaf_bytes += lb
            root_bytes = build_dir(tops)
            if len(root_bytes) <= 16384 - 127:
                break
            per *= 2
    w, s, e, n = bbox
    o_root = 127; o_meta = o_root + len(root_bytes); o_leaf = o_meta + len(metadata); o_data = o_leaf + len(leaf_bytes)
    h[2:13] = [o_root, len(root_bytes), o_meta, len(metadata), o_leaf, len(leaf_bytes), o_data, len(data), len(found), len(entries), len(blobs)]
    h[13] = 1
    h[17], h[18] = 0, maxzoom
    h[19:23] = [int(w * 1e7), int(s * 1e7), int(e * 1e7), int(n * 1e7)]
    h[23] = min(maxzoom, 7)
    h[24:26] = [int((w + e) / 2 * 1e7), int((s + n) / 2 * 1e7)]
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        f.write(struct.pack(HDR, *h)); f.write(root_bytes); f.write(metadata); f.write(leaf_bytes); f.write(data)
    info = {"file": out.name, "bytes": out.stat().st_size, "maxzoom": maxzoom, "bbox": bbox, "source": src,
            "built": time.strftime("%Y-%m-%d", time.gmtime()), "attribution": "© OpenStreetMap contributors (ODbL), Protomaps"}
    (out.parent / "basemap.json").write_text(json.dumps(info, indent=1) + "\n", encoding="utf-8")
    print("wrote", out, f"{info['bytes'] / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
