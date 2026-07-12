/*
  Entity Templates define the structure and properties of various
  entities used within the game. All templates must only use
  serializable data types.
*/

const EntityTemplateLightHemisphere = {
  name: 'light-hemisphere',
  label: 'Light Hemisphere',
  class: 'EntityLightHemisphere',
  skyColor: '#ffffff',
  groundColor: '#aaaaaa',
  intensity: 3.14
}

const EntityTemplateLightSun = {
  name: 'light-sun',
  label: 'Light Sun',
  class: 'EntityLightSun',
  speed: 1,
  distance: 8,
  time: 6,
  color: '#ffffff',
  intensity: 3.14
}

const EntityTemplateCube = {
  name: 'cube',
  label: 'Cube',
  class: 'Entity',
  children: [
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 1,
        colliders: [
          {
            shapeDesc: {
              type: 'cuboid',
              arguments: [1, 1, 1]
            }
          }
        ]
      }
    },
    {
      class: 'EntityMesh',
      geometry: {
        type: 'BoxGeometry',
        arguments: [1, 1, 1]
      },
      material: {
        type: 'MeshStandardMaterial',
        arguments: [{ color: '#ffffff' }],
      }
    }
  ]
}

const EntityTemplatePlane = {
  name: 'plane',
  label: 'Plane',
  class: 'Entity',
  children: [
    {
      class: 'EntityMesh',
      type: 'Mesh',
      rotation: { x: -Math.PI / 2, y: 0, z: 0 },
      geometry: {
        type: 'PlaneGeometry',
        arguments: [10, 10, 10, 10],
      },
      material: {
        type: 'MeshBasicMaterial',
        arguments: [
          { color: '#ffffff', opacity: 1, transparent: true }
        ],
      }
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 1,
        colliders: [
          {
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            shapeDesc: {
              type: 'trimesh'
            }
          }
        ]
      }
    }
  ]
}

const EntityTemplateBall = {
  name: 'ball',
  label: 'Ball',
  class: 'Entity',
  children: [
    {
      class: 'EntityBallController'
    },
    {
      class: 'EntityMesh',
      geometry: {
        type: 'SphereGeometry',
        arguments: [0.5, 16, 16]
      },
      material: {
        type: 'MeshStandardMaterial',
        arguments: [{ color: '#FC7400' }],
      },
      children: [
        {
          class: 'EntityDecal',
          url: 'png/boxel.png',
          position: { x: 0, y: 0, z: 0.5 },
          normal: { x: 0, y: 0, z: 1 },
          scale: { x: 0.75, y: 0.75, z: 0.75 }
        }
      ]
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 0,
        softCcdPrediction: 0.5,
        colliders: [
          {
            shapeDesc: {
              type: 'ball',
              arguments: [0.5]
            }
          }
        ]
      }
    }
  ]
}

const EntityTemplateLevel = {
  name: 'level',
  label: 'Level',
  class: 'Entity',
  children: [
    {
      class: 'EntityModel',
      url: 'glb/dungeon-forge.glb',
      position: { x: 0, y: -4, z: 0 },
      rotation: { x: 0, y: -Math.PI / 4, z: 0 },
      scale: { x: 2, y: 2, z: 2 },
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 1,
        colliders: [
          {
            shapeDesc: {
              type: 'trimesh'
            }
          }
        ],
      }
    }
  ]
}

export const EntityTemplates = {
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplateLevel,
  EntityTemplatePlane,
  EntityTemplateBall,
  EntityTemplateCube
}