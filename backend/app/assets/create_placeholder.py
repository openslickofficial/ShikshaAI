import os
import zlib
import struct

def generate_avatar_png(filepath: str, width=400, height=400):
    """Generates a valid RGBA PNG avatar placeholder image."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # Dark slate background with a warm amber center avatar circle
    raw_rows = []
    center_x, center_y = width / 2, height / 2
    head_radius = 80
    body_radius_x, body_radius_y = 120, 100

    for y in range(height):
        row_bytes = bytearray([0]) # filter type 0 (None)
        for x in range(width):
            dx = x - center_x
            dy = y - center_y

            # Head circle check
            head_dist_sq = dx*dx + (dy + 30)*(dy + 30)
            # Body shoulders check
            body_dist_sq = (dx*dx) / (body_radius_x*body_radius_x) + ((dy - 80)*(dy - 80)) / (body_radius_y*body_radius_y)

            if head_dist_sq <= head_radius * head_radius:
                # Amber avatar head (RGB: 251, 191, 36)
                row_bytes.extend([251, 191, 36, 255])
            elif body_dist_sq <= 1.0 and dy > 0:
                # Amber avatar shoulders (RGB: 245, 158, 11)
                row_bytes.extend([245, 158, 11, 255])
            else:
                # Dark slate background (RGB: 15, 23, 42)
                row_bytes.extend([15, 23, 42, 255])
        raw_rows.append(bytes(row_bytes))

    raw_data = b"".join(raw_rows)
    compressed_data = zlib.compress(raw_data)

    def chunk(name, data):
        return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xffffffff)

    png_bytes = (
        b"\x89PNG\r\n\x1a\n" +
        chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) +
        chunk(b"IDAT", compressed_data) +
        chunk(b"IEND", b"")
    )

    with open(filepath, "wb") as f:
        f.write(png_bytes)
    print(f"Generated PNG avatar placeholder at {filepath} ({len(png_bytes)} bytes)")

if __name__ == "__main__":
    assets_dir = os.path.dirname(__file__)
    target_path = os.path.join(assets_dir, "avatar_placeholder.png")
    generate_avatar_png(target_path)
