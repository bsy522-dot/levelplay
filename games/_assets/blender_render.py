"""
동물농장 8방향 스프라이트 자동 렌더 파이프라인
Blender 4.5.9 헤드리스 실행 전용

실행: blender.exe -b -P blender_render.py
출력: _assets/blender_sprites/[animal_name]/sheet.png (2048x256, 8프레임)
"""

import bpy
import os
import math
import sys

# ===== 설정 =====
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blender_sprites")
RES = 256
FRAMES = 8       # 8방향 (45도 간격)
CAM_DIST = 6.0
CAM_HEIGHT = 3.5

# ===== 동물 프리미티브 정의 =====
# 큐브+구체 조합으로 저폴리 동물 표현
ANIMALS = {
    "cow": {
        "body_color": (0.95, 0.95, 0.95, 1.0),   # 흰색 몸체
        "spot_color": (0.1, 0.1, 0.1, 1.0),       # 검은 무늬
        "body_size": (1.6, 0.9, 0.9),
        "head_size": 0.5,
        "leg_count": 4,
    },
    "pig": {
        "body_color": (1.0, 0.7, 0.75, 1.0),      # 핑크
        "spot_color": (0.9, 0.5, 0.55, 1.0),
        "body_size": (1.3, 0.85, 0.8),
        "head_size": 0.45,
        "leg_count": 4,
    },
    "chicken": {
        "body_color": (1.0, 1.0, 0.95, 1.0),      # 흰색
        "spot_color": (0.9, 0.2, 0.1, 1.0),       # 빨간 볏
        "body_size": (0.7, 0.55, 0.7),
        "head_size": 0.35,
        "leg_count": 2,
    },
}


def clear_scene():
    """씬 초기화."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # 모든 메시/머티리얼 제거
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)


def make_material(name, color):
    """단순 디퓨즈 머티리얼 생성."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        # Roughness 입력 인덱스가 버전마다 달라 이름으로 접근
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.85
    return mat


def add_cube(name, location, scale, material):
    """큐브 추가."""
    bpy.ops.mesh.primitive_cube_add(size=2.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def add_sphere(name, location, radius, material):
    """UV 구체 추가 (저폴리: 16세그먼트)."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16, ring_count=8, radius=radius, location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    # 셰이드 스무드
    bpy.ops.object.shade_smooth()
    return obj


def build_animal(animal_name):
    """프리미티브 조합으로 동물 모델 생성."""
    cfg = ANIMALS[animal_name]
    body_mat = make_material(f"{animal_name}_body", cfg["body_color"])
    spot_mat = make_material(f"{animal_name}_spot", cfg["spot_color"])

    parts = []

    # 몸통 (큐브, 살짝 둥글게 보이도록 스케일)
    body = add_cube(
        f"{animal_name}_body",
        location=(0, 0, 1.0),
        scale=cfg["body_size"],
        material=body_mat,
    )
    parts.append(body)

    # 머리 (구체, 몸통 앞쪽)
    head_x = cfg["body_size"][0] + cfg["head_size"] * 0.3
    head = add_sphere(
        f"{animal_name}_head",
        location=(head_x, 0, 1.3),
        radius=cfg["head_size"],
        material=body_mat,
    )
    parts.append(head)

    # 다리 (얇은 큐브)
    leg_count = cfg["leg_count"]
    leg_w = 0.18
    leg_h = 0.5
    body_x = cfg["body_size"][0] * 0.65
    body_y = cfg["body_size"][1] * 0.55
    if leg_count == 4:
        leg_positions = [
            (body_x, body_y, 0.25),
            (body_x, -body_y, 0.25),
            (-body_x, body_y, 0.25),
            (-body_x, -body_y, 0.25),
        ]
    else:  # 2족 (닭)
        leg_positions = [
            (0, body_y * 0.5, 0.25),
            (0, -body_y * 0.5, 0.25),
        ]
    for i, pos in enumerate(leg_positions):
        leg = add_cube(
            f"{animal_name}_leg_{i}",
            location=pos,
            scale=(leg_w, leg_w, leg_h),
            material=spot_mat,
        )
        parts.append(leg)

    # 닭은 부리 추가 (작은 빨간 큐브)
    if animal_name == "chicken":
        beak = add_cube(
            "chicken_beak",
            location=(head_x + cfg["head_size"], 0, 1.3),
            scale=(0.12, 0.08, 0.08),
            material=spot_mat,
        )
        parts.append(beak)

    # 소는 무늬 (작은 검은 큐브 2개)
    if animal_name == "cow":
        spot1 = add_cube(
            "cow_spot1",
            location=(0.3, cfg["body_size"][1] * 0.95, 1.4),
            scale=(0.4, 0.05, 0.25),
            material=spot_mat,
        )
        parts.append(spot1)

    # 모든 파트 부모 묶기 (회전 편의)
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)
    return body


def setup_camera_and_light():
    """카메라/조명 설정. 카메라는 원점을 향하도록."""
    # 카메라
    bpy.ops.object.camera_add(location=(CAM_DIST, 0, CAM_HEIGHT))
    cam = bpy.context.active_object
    cam.name = "RenderCam"
    # 카메라가 원점(0,0,1)을 보도록 트랙
    bpy.ops.object.empty_add(location=(0, 0, 1.0))
    target = bpy.context.active_object
    target.name = "CamTarget"
    constraint = cam.constraints.new(type='TRACK_TO')
    constraint.target = target
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    bpy.context.scene.camera = cam

    # Sun 라이트
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(30))

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, 3, 5))
    fill = bpy.context.active_object
    fill.data.energy = 200
    fill.data.size = 4.0

    return cam, target


def setup_render():
    """렌더 설정 (Eevee, 알파 투명, 256x256)."""
    scene = bpy.context.scene
    # Blender 4.x: EEVEE_NEXT 또는 BLENDER_EEVEE_NEXT
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        try:
            scene.render.engine = 'BLENDER_EEVEE'
        except Exception:
            scene.render.engine = 'CYCLES'
            scene.cycles.samples = 32

    scene.render.resolution_x = RES
    scene.render.resolution_y = RES
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    # 월드 배경 투명
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True


def render_8_directions(animal_name, target_empty):
    """8방향 회전 렌더 → 개별 PNG 저장."""
    out_path = os.path.join(OUT_DIR, animal_name)
    os.makedirs(out_path, exist_ok=True)
    cam = bpy.data.objects["RenderCam"]

    frames = []
    for i in range(FRAMES):
        angle = math.radians(i * (360.0 / FRAMES))
        # 카메라를 원점 주위로 회전
        cam.location = (
            CAM_DIST * math.cos(angle),
            CAM_DIST * math.sin(angle),
            CAM_HEIGHT,
        )
        frame_path = os.path.join(out_path, f"frame_{i:02d}.png")
        bpy.context.scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        frames.append(frame_path)
        print(f"  [{animal_name}] 방향 {i+1}/{FRAMES} 렌더 완료: {frame_path}")

    return out_path, frames


def composite_spritesheet(out_path, frames):
    """8장 PNG → 가로 스프라이트시트 (2048x256) 합성.
    Blender 내장 이미지 API 사용 (Pillow 의존성 없음).
    """
    sheet_w = RES * FRAMES
    sheet_h = RES
    sheet_path = os.path.join(out_path, "sheet.png")

    # 새 이미지 (RGBA, 알파)
    sheet_img = bpy.data.images.new(
        "spritesheet", width=sheet_w, height=sheet_h, alpha=True
    )

    # 픽셀 버퍼 (RGBA, flat, float)
    sheet_pixels = [0.0] * (sheet_w * sheet_h * 4)

    for idx, frame_path in enumerate(frames):
        frame_img = bpy.data.images.load(frame_path)
        frame_pixels = list(frame_img.pixels)  # flat RGBA
        offset_x = idx * RES

        # 행 단위 복사 (아래에서 위로 — Blender 좌표)
        for y in range(RES):
            src_row_start = y * RES * 4
            dst_row_start = (y * sheet_w + offset_x) * 4
            for x in range(RES):
                src = src_row_start + x * 4
                dst = dst_row_start + x * 4
                sheet_pixels[dst:dst + 4] = frame_pixels[src:src + 4]

        bpy.data.images.remove(frame_img)

    sheet_img.pixels = sheet_pixels
    sheet_img.filepath_raw = sheet_path
    sheet_img.file_format = 'PNG'
    sheet_img.save()
    print(f"  스프라이트시트 저장: {sheet_path} ({sheet_w}x{sheet_h})")
    return sheet_path


def render_animal(animal_name):
    """동물 1종 전체 파이프라인."""
    print(f"\n=== {animal_name.upper()} 렌더 시작 ===")
    clear_scene()
    build_animal(animal_name)
    setup_camera_and_light()
    setup_render()
    out_path, frames = render_8_directions(animal_name, None)
    composite_spritesheet(out_path, frames)
    print(f"=== {animal_name.upper()} 완료 ===\n")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"출력 폴더: {OUT_DIR}")
    print(f"렌더 동물: {list(ANIMALS.keys())}")

    for animal_name in ANIMALS.keys():
        try:
            render_animal(animal_name)
        except Exception as e:
            print(f"[ERROR] {animal_name} 렌더 실패: {e}")
            import traceback
            traceback.print_exc()

    print("\n[전체 완료] 모든 동물 스프라이트시트 생성 완료.")


if __name__ == "__main__":
    main()
