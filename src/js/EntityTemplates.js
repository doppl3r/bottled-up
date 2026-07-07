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
        arguments: [{ color: '#ffffff' }],
      }
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 0,
        ccd: true,
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

const EntityTemplateRamps = {
  name: 'ramps',
  label: 'Ramps',
  class: 'Entity',
  children: [
    {
      class: 'EntityModel',
      url: 'glb/dungeon-forge.glb'
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
  EntityTemplatePlane,
  EntityTemplateBall,
  EntityTemplateRamps,
  EntityTemplateCube
}