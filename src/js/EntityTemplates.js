/*
  Entity Templates define the structure and properties of various
  entities used within the game. All templates must only use
  serializable data types.
*/

const EntityTemplatePlayer = {
  name: 'player',
  label: 'Player',
  class: 'Entity',
  children: [
    {
      class: 'EntityBallController'
    },
    {
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
      },
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

const EntityTemplatePrompt = {
  name: 'prompt',
  label: 'Prompt',
  class: 'EntityPrompt',
  keyCode: 'Space',
  children: [
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 1,
        colliders: [
          {
            isSensor: true,
            shapeDesc: {
              type: 'ball',
              arguments: [0.25]
            }
          }
        ]
      }
    }
  ]
}

const EntityTemplateSkybox = {
  name: 'skybox',
  label: 'Skybox',
  class: 'EntitySkybox',
  urls: [
    'png/skybox-forge-1-px.png',
    'png/skybox-forge-1-nx.png',
    'png/skybox-forge-1-py.png',
    'png/skybox-forge-1-ny.png',
    'png/skybox-forge-1-pz.png',
    'png/skybox-forge-1-nz.png'
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
  EntityTemplatePlayer,
  EntityTemplatePrompt,
  EntityTemplateRain,
  EntityTemplateSkybox
}

// Assign shorthand names for parsing from .glb object names
EntityTemplates['Player'] = EntityTemplatePlayer;
EntityTemplates['Prompt'] = EntityTemplatePrompt;
EntityTemplates['Rain'] = EntityTemplateRain;
EntityTemplates['Skybox'] = EntityTemplateSkybox;