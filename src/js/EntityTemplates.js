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
          { color: '#ffffff', opacity: 0, transparent: true }
        ],
      }
    },
    {
      class: 'EntityMesh',
      type: 'GridHelper',
      arguments: [10, 10, '#331F28', '#331F28'],
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

export const EntityTemplates = {
  EntityTemplatePlane,
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplatePlayer
}