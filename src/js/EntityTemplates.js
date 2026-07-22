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
  intensity: Math.PI
}

const EntityTemplateLightSun = {
  name: 'light-sun',
  label: 'Light Sun',
  class: 'EntityLightSun',
  color: '#ffffff',
  intensity: Math.PI,
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

const EntityTemplateBall = {
  name: 'ball',
  label: 'Ball',
  class: 'EntityMesh',
  castShadow: false,
  receiveShadow: true,
  geometry: {
    type: 'SphereGeometry',
    arguments: [0.25, 16, 16]
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
      template: 'EntityTemplateBall',
      children: [
        {
          class: 'EntityDecal',
          url: 'png/smile.png',
          position: { x: 0, y: 0, z: 0.25 },
          normal: { x: 0, y: 0, z: 1 },
          scale: { x: 0.5, y: 0.5, z: 0.5 }
        }
      ]
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 0,
        softCcdPrediction: 1.0,
        colliders: [
          {
            shapeDesc: {
              type: 'ball',
              arguments: [0.25]
            }
          }
        ]
      }
    },
    {
      class: 'EntityShadow',
      distance: 64,
      scale: { x: 0.5, y: 0.5, z: 0.5 }
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

const EntityTemplateTrimesh = {
  name: 'trimesh',
  label: 'Trimesh',
  class: 'Entity',
  children: [
    {
      class: 'EntityModel',
      url: ''
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
        ]
      }
    }
  ]
}

export const EntityTemplates = {
  EntityTemplateBall,
  EntityTemplateCube,
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplatePlane,
  EntityTemplatePlayer,
  EntityTemplateRain,
  EntityTemplateSkybox,
  EntityTemplateTrimesh,
}

// Assign shorthand names for parsing from .glb object names
EntityTemplates['LightHemisphere'] = EntityTemplateLightHemisphere;
EntityTemplates['LightSun'] = EntityTemplateLightSun;
EntityTemplates['Player'] = EntityTemplatePlayer;
EntityTemplates['Trimesh'] = EntityTemplateTrimesh;