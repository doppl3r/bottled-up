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
  groundColor: '#ffffff',
  intensity: Math.PI * 0.5
}

const EntityTemplateLightSun = {
  name: 'light-sun',
  label: 'Light Sun',
  class: 'EntityLightSun',
  color: '#ffffff',
  intensity: Math.PI * 0.5,
  time: 12,
  speed: 0,
  targetName: 'ball',
  shadowArea: 64,
  shadowQuality: 32
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

const EntityTemplateBallMesh = {
  name: 'ball',
  label: 'Ball',
  class: 'EntityMesh',
  castShadow: true,
  receiveShadow: true,
  geometry: {
    type: 'SphereGeometry',
    arguments: [0.5, 16, 16]
  },
  material: {
    type: 'MeshStandardMaterial',
    arguments: [{ color: '#42bfe8' }],
  }
}

const EntityTemplatePlayer = {
  name: 'player',
  label: 'Player',
  class: 'Entity',
  children: [
    {
      class: 'EntityBallController'
    },
    {
      template: 'EntityTemplateBallMesh',
      children: [
        {
          class: 'EntityDecal',
          url: 'png/smile.png',
          position: { x: 0, y: 0, z: 0.5 },
          normal: { x: 0, y: 0, z: 1 },
          scale: { x: 0.9, y: 0.9, z: 0.9 }
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

const EntityTemplateSkybox = {
  name: 'skybox',
  label: 'Skybox',
  class: 'EntitySkybox',
  urls: [
    'png/skybox-1-px.png',
    'png/skybox-1-nx.png',
    'png/skybox-1-py.png',
    'png/skybox-1-ny.png',
    'png/skybox-1-pz.png',
    'png/skybox-1-nz.png',
  ]
}

const EntityTemplateRain = {
  name: 'rain',
  label: 'Rain',
  class: 'EntityRain',
  attenuation: 0.5,
  capacity: 100,
  range: 100,
  speed: 0.01,
  urls: [
    'png/icon16.png'
  ]
}

export const EntityTemplates = {
  EntityTemplateBallMesh,
  EntityTemplateCube,
  EntityTemplateLevel,
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplatePlane,
  EntityTemplatePlayer,
  EntityTemplateRain,
  EntityTemplateSkybox,
}