/*
  Entity Templates define the structure and properties of various
  entities used within the game. All templates must only use
  serializable data types.
*/

const EntityTemplateLightHemisphere = {
  name: 'light-hemisphere',
  label: 'Light Hemisphere',
  class: 'EntityLightHemisphere',
  metaData: {
    isStorable: true
  },
  skyColor: '#ffffff',
  groundColor: '#aaaaaa',
  intensity: 3.14
}

const EntityTemplateLightSun = {
  name: 'light-sun',
  label: 'Light Sun',
  class: 'EntityLightSun',
  metaData: {
    isStorable: true
  },
  speed: 1,
  distance: 8,
  time: 6,
  color: '#ffffff',
  intensity: 3.14
}

const EntityTemplateBall = {
  name: 'ball',
  label: 'Ball',
  class: 'Entity',
  children: [
    {
      class: 'EntityMesh',
      type: 'Mesh',
      geometry: {
        type: 'SphereGeometry',
        arguments: [0.5, 32, 32],
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

const EntityTemplatePlayer = {
  name: 'player',
  label: 'Player',
  class: 'EntityPlayer',
  metaData: {
    isSelectable: true
  },
  children: [
    {
      class: 'EntityModel',
      url: 'glb/player.glb',
      children: [
        {
          class: 'EntityMixer'
        }
      ]
    },
    {
      class: 'EntityKCC'
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 2,
        colliders: [
          {
            shapeDesc: {
              type: 'capsule',
              arguments: [1 / 4, 1 / 4]
            },
            translation: { x: 0, y: 0.5, z: 0 }
          }
        ],
      }
    }
  ]
}

const EntityTemplateRamps = {
  name: 'ramps',
  label: 'Ramps',
  class: 'Entity',
  metaData: {
    isSelectable: true
  },
  children: [
    {
      class: 'EntityModel',
      url: 'glb/ramps.glb'
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
  EntityTemplateBall,
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplatePlane,
  EntityTemplatePlayer,
  EntityTemplateRamps
}