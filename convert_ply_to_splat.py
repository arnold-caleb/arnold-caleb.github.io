#!/usr/bin/env python3
"""Convert 3DGS PLY files to the antimatter15 .splat format (32 bytes/Gaussian).

Format per Gaussian (32 bytes total):
  - position:   3 x float32 (12 bytes)
  - scale:      3 x float32 (12 bytes)  [log-scale, same as PLY]
  - color:      4 x uint8   ( 4 bytes)  [RGBA, from SH DC + sigmoid(opacity)]
  - quaternion: 4 x uint8   ( 4 bytes)  [mapped: clamp(q*128+128, 0, 255)]
"""
import numpy as np
import struct, sys, os

SH_C0 = 0.28209479177387814

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def read_ply(path):
    """Read a 3DGS PLY file, return dict of arrays."""
    with open(path, 'rb') as f:
        header = b""
        while True:
            line = f.readline()
            header += line
            if b"end_header" in line:
                break
        # Parse header
        lines = header.decode('ascii', errors='ignore').strip().split('\n')
        n_vertices = 0
        props = []
        for l in lines:
            if l.startswith("element vertex"):
                n_vertices = int(l.split()[-1])
            elif l.startswith("property float"):
                props.append(l.split()[-1])
        
        # Read binary data
        dtype = np.dtype([(p, '<f4') for p in props])
        data = np.frombuffer(f.read(n_vertices * dtype.itemsize), dtype=dtype)
    
    return data, n_vertices

def ply_to_splat(ply_path, splat_path):
    data, n = read_ply(ply_path)
    print(f"  Read {n:,} Gaussians from {os.path.basename(ply_path)}")
    
    # Position (3 x float32)
    pos = np.column_stack([data['x'], data['y'], data['z']]).astype(np.float32)
    
    # Scale (3 x float32) — keep as log-scale (same as PLY stores them)
    scale = np.column_stack([data['scale_0'], data['scale_1'], data['scale_2']]).astype(np.float32)
    
    # Color (4 x uint8): RGB from SH DC, A from sigmoid(opacity)
    f_dc = np.column_stack([data['f_dc_0'], data['f_dc_1'], data['f_dc_2']])
    rgb = np.clip((0.5 + SH_C0 * f_dc) * 255.0, 0, 255).astype(np.uint8)
    alpha = np.clip(sigmoid(data['opacity'].astype(np.float64)) * 255.0, 0, 255).astype(np.uint8)
    color = np.column_stack([rgb, alpha])  # (N, 4) uint8
    
    # Quaternion (4 x uint8): normalize then map to [0, 255]
    quat = np.column_stack([data['rot_0'], data['rot_1'], data['rot_2'], data['rot_3']]).astype(np.float64)
    norms = np.linalg.norm(quat, axis=1, keepdims=True)
    norms[norms < 1e-10] = 1.0
    quat = quat / norms
    quat_u8 = np.clip(quat * 128.0 + 128.0, 0, 255).astype(np.uint8)
    
    # Pack: pos(12) + scale(12) + color(4) + quat(4) = 32 bytes per Gaussian
    buf = bytearray(n * 32)
    for i in range(n):
        offset = i * 32
        struct.pack_into('<3f', buf, offset, pos[i, 0], pos[i, 1], pos[i, 2])
        struct.pack_into('<3f', buf, offset + 12, scale[i, 0], scale[i, 1], scale[i, 2])
        buf[offset + 24] = color[i, 0]
        buf[offset + 25] = color[i, 1]
        buf[offset + 26] = color[i, 2]
        buf[offset + 27] = color[i, 3]
        buf[offset + 28] = quat_u8[i, 0]
        buf[offset + 29] = quat_u8[i, 1]
        buf[offset + 30] = quat_u8[i, 2]
        buf[offset + 31] = quat_u8[i, 3]
    
    with open(splat_path, 'wb') as f:
        f.write(buf)
    
    size_kb = len(buf) / 1024
    print(f"  Wrote {splat_path} ({size_kb:.0f} KB, {n:,} Gaussians)")

# --- Vectorized fast version ---
def ply_to_splat_fast(ply_path, splat_path):
    data, n = read_ply(ply_path)
    print(f"  Read {n:,} Gaussians from {os.path.basename(ply_path)}")
    
    pos = np.column_stack([data['x'], data['y'], data['z']]).astype('<f4')
    scale = np.column_stack([data['scale_0'], data['scale_1'], data['scale_2']]).astype('<f4')
    
    f_dc = np.column_stack([data['f_dc_0'], data['f_dc_1'], data['f_dc_2']])
    rgb = np.clip((0.5 + SH_C0 * f_dc) * 255.0, 0, 255).astype(np.uint8)
    alpha = np.clip(sigmoid(data['opacity'].astype(np.float64)) * 255.0, 0, 255).astype(np.uint8)
    
    quat = np.column_stack([data['rot_0'], data['rot_1'], data['rot_2'], data['rot_3']]).astype(np.float64)
    norms = np.linalg.norm(quat, axis=1, keepdims=True)
    norms[norms < 1e-10] = 1.0
    quat = quat / norms
    quat_u8 = np.clip(quat * 128.0 + 128.0, 0, 255).astype(np.uint8)
    
    # Build structured array for fast binary write
    dt = np.dtype([
        ('pos', '<f4', 3),
        ('scale', '<f4', 3),
        ('color', 'u1', 4),
        ('quat', 'u1', 4),
    ])
    arr = np.empty(n, dtype=dt)
    arr['pos'] = pos
    arr['scale'] = scale
    arr['color'] = np.column_stack([rgb, alpha])
    arr['quat'] = quat_u8
    
    arr.tofile(splat_path)
    size_kb = os.path.getsize(splat_path) / 1024
    print(f"  Wrote {splat_path} ({size_kb:.0f} KB, {n:,} Gaussians)")


if __name__ == "__main__":
    base_in = "/n/fs/aa-rldiff/view_synthesis/gaussian-splatting/output/static_4anchors"
    base_out = "/u/aa0008/arnold-caleb.github.io/assets"
    
    scenes = [
        ("frame0_20251104_103403",   "cut_roasted_beef_t0.splat"),
        ("frame75_20251104_103403",  "cut_roasted_beef_t25.splat"),
        ("frame150_20251104_103403", "cut_roasted_beef_t50.splat"),
        ("frame225_20251104_103403", "cut_roasted_beef_t75.splat"),
    ]
    
    for folder, out_name in scenes:
        ply_path = os.path.join(base_in, folder, "point_cloud", "iteration_30000", "point_cloud.ply")
        splat_path = os.path.join(base_out, out_name)
        print(f"\nConverting {folder}...")
        ply_to_splat_fast(ply_path, splat_path)
    
    # Also remove old broken splat
    old = os.path.join(base_out, "cut_roasted_beef.splat")
    if os.path.exists(old):
        os.remove(old)
        print(f"\nRemoved old {old}")
    
    print("\nDone! All .splat files written to", base_out)

