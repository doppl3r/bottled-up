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

const EntityTemplateBall = {
  name: 'ball',
  label: 'Ball',
  class: 'Entity',
  children: [
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
      }
    },
    {
      class: 'EntityPhysics',
      rigidBody: {
        status: 1,
        colliders: [
          {
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

const EntityTemplateTrimesh = {
  name: 'trimesh',
  label: 'Trimesh',
  class: 'Entity',
  children: [
    {
      class: 'EntityModel'
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

const EntityTemplateModel = {
  name: 'model',
  label: 'Model',
  class: 'Entity',
  children: [
    {
      class: 'EntityModel'
    }
  ]
}

export const EntityTemplates = {
  EntityTemplateBall,
  EntityTemplateCube,
  EntityTemplateLightHemisphere,
  EntityTemplateLightSun,
  EntityTemplateModel,
  EntityTemplateTrimesh,
}

// Assign shorthand names for parsing from .glb object names
EntityTemplates['Ball'] = EntityTemplateBall;
EntityTemplates['Cube'] = EntityTemplateCube;
EntityTemplates['LightHemisphere'] = EntityTemplateLightHemisphere;
EntityTemplates['LightSun'] = EntityTemplateLightSun;
EntityTemplates['Model'] = EntityTemplateModel;
EntityTemplates['Trimesh'] = EntityTemplateTrimesh;