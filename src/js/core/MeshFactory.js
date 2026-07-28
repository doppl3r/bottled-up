/*
  The MeshFactory creates any Three.js mesh using basic JSON instructions
*/

import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  BoxGeometry, BufferAttribute, BufferGeometry, CapsuleGeometry, CircleGeometry,
  ConeGeometry, CylinderGeometry,  DodecahedronGeometry, EdgesGeometry,
  ExtrudeGeometry, GridHelper, IcosahedronGeometry,  InstancedMesh,
  LatheGeometry, LineBasicMaterial, LineDashedMaterial, LineSegments,
  Material, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshDistanceMaterial,
  MeshLambertMaterial,  MeshMatcapMaterial, MeshNormalMaterial,
  MeshPhongMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  MeshToonMaterial, Object3D, OctahedronGeometry, PlaneGeometry,
  PointsMaterial, PolyhedronGeometry, RawShaderMaterial, RingGeometry,
  ShaderMaterial, ShadowMaterial, ShapeGeometry, SphereGeometry,
  SpriteMaterial, TetrahedronGeometry, TorusGeometry, TorusKnotGeometry,
  TubeGeometry, WireframeGeometry
} from 'three';

class MeshFactory {
  static create(options) {
    // Set default options
    options = Object.assign({
      type: 'Mesh',
      geometry: {
        type: 'BoxGeometry',
        arguments: [1, 1, 1]
      },
      material: {
        type: 'MeshStandardMaterial',
        arguments: [{ color: '#ff00ff' }]
      }
    }, options);

    // Create mesh with geometry and material
    const geometry = new MeshFactory[options.geometry.type](...options.geometry.arguments);
    const material = new MeshFactory[options.material.type](...options.material.arguments);
    const mesh = new MeshFactory[options.type](geometry, material)
    return mesh;
  }

  static createInstancedMesh(object3D, coordinates) {
    // Create instanced mesh
    const { geometry, materials } = this.mergeObjectMeshes(object3D);
    const count = coordinates.length / 3;
    const instancedMesh = new InstancedMesh(geometry, materials, count);

    // Update each instance matrix
    const dummy = new Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        coordinates[(i * 3)] + 0.5,
        coordinates[(i * 3) + 1] + 0.5,
        coordinates[(i * 3) + 2] + 0.5
      );
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    // Return object 3D instanced mesh
    return instancedMesh;
  }

  static mergeObjectMeshes(object3D) {
    // Combine geometries
    let geometry;
    let geometries = [];
    let materials = [];

    // Update object data before traversing
    object3D.updateWorldMatrix(true, true);

    // Traverse and add geometries/materials to array
    object3D.traverse(obj => {
      if (obj.isMesh) {
        // Clone geometry to avoid mutating the original
        let geo = obj.geometry.clone();
        
        // Apply the world matrix to bake all transforms (position, rotation, scale)
        geo.applyMatrix4(obj.matrixWorld);

        // Push geometry to array for merge
        geometries.push(geo);

        // Assign material
        materials.push(obj.material);
      }
    });

    // Resolve missing attributes across geometries
    geometries = this.normalizeAttributes(geometries);
    
    // Return singular geometry and materials array
    geometry = mergeGeometries(geometries, true);
    geometry = mergeVertices(geometry);
    const mesh = new Mesh(geometry, materials);
    return mesh;
  }

  static normalizeAttributes(geometries, discardMissingKeys = false) {
    // Count shared keys
    const keys = {}
    geometries.forEach(geometry => {
      Object.keys(geometry.attributes).forEach(key => {
        if (!keys[key]) keys[key] = { count: 0, bufferCount: 0, bufferItemSize: 0 };
        keys[key].count += 1;
        keys[key].bufferCount = geometry.getAttribute(key).count;
        keys[key].bufferItemSize = geometry.getAttribute(key).itemSize;
      });
    });

    // Create array of unshared keys
    const missingKeys = Object.keys(keys).filter(key => keys[key].count < geometries.length);

    // Loop through all missing keys
    missingKeys.forEach(key => {
      // Loop through all geometries
      geometries.forEach(geometry => {
        if (discardMissingKeys === true) {
          // Delete missing key to reduce memory allocations
          geometry.deleteAttribute(key);
        }
        else {
          // Create missing attribute
          if (geometry.hasAttribute(key) === false) {
            const float32Array = new Float32Array(keys[key].bufferCount * keys[key].bufferItemSize);
            const bufferAttribute = new BufferAttribute(float32Array, keys[key].bufferItemSize);
            geometry.setAttribute(key, bufferAttribute);
          }
        }
      });
    });

    // Return geometries with shared attributes
    return geometries;
  }

  // Assign all Three.js Mesh classes as static fields
  static BoxGeometry = BoxGeometry;
  static BufferGeometry = BufferGeometry;
  static CapsuleGeometry = CapsuleGeometry;
  static CircleGeometry = CircleGeometry;
  static ConeGeometry = ConeGeometry;
  static CylinderGeometry = CylinderGeometry;
  static DodecahedronGeometry = DodecahedronGeometry;
  static EdgesGeometry = EdgesGeometry;
  static ExtrudeGeometry = ExtrudeGeometry;
  static GridHelper = GridHelper;
  static IcosahedronGeometry = IcosahedronGeometry;
  static LatheGeometry = LatheGeometry;
  static LineBasicMaterial = LineBasicMaterial;
  static LineDashedMaterial = LineDashedMaterial;
  static LineSegments = LineSegments;
  static Material = Material;
  static Mesh = Mesh;
  static MeshBasicMaterial = MeshBasicMaterial;
  static MeshDepthMaterial = MeshDepthMaterial;
  static MeshDistanceMaterial = MeshDistanceMaterial;
  static MeshLambertMaterial = MeshLambertMaterial;
  static MeshMatcapMaterial = MeshMatcapMaterial;
  static MeshNormalMaterial = MeshNormalMaterial;
  static MeshPhongMaterial = MeshPhongMaterial;
  static MeshPhysicalMaterial = MeshPhysicalMaterial;
  static MeshStandardMaterial = MeshStandardMaterial;
  static MeshToonMaterial = MeshToonMaterial;
  static OctahedronGeometry = OctahedronGeometry;
  static PlaneGeometry = PlaneGeometry;
  static PointsMaterial = PointsMaterial;
  static PolyhedronGeometry = PolyhedronGeometry;
  static RawShaderMaterial = RawShaderMaterial;
  static RingGeometry = RingGeometry;
  static RoundedBoxGeometry = RoundedBoxGeometry;
  static ShaderMaterial = ShaderMaterial;
  static ShadowMaterial = ShadowMaterial;
  static ShapeGeometry = ShapeGeometry;
  static SphereGeometry = SphereGeometry;
  static SpriteMaterial = SpriteMaterial;
  static TetrahedronGeometry = TetrahedronGeometry;
  static TorusGeometry = TorusGeometry;
  static TorusKnotGeometry = TorusKnotGeometry;
  static TubeGeometry = TubeGeometry;
  static WireframeGeometry = WireframeGeometry;
}

export { MeshFactory }