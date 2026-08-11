import { EventQueue, World } from '@dimforge/rapier3d';
import { WorldDebugger } from './WorldDebugger.js';
import { Entity } from './Entity.js';
import { EntityAudio } from './EntityAudio.js';
import { EntityBall } from './EntityBall.js';
import { EntityCube } from './EntityCube.js';
import { EntityDecal } from './EntityDecal.js';
import { EntityEnvironment } from './EntityEnvironment.js';
import { EntityFog } from './EntityFog.js';
import { EntityMaterial } from './EntityMaterial.js';
import { EntityMesh } from './EntityMesh.js';
import { EntityMixer } from './EntityMixer.js';
import { EntityModel } from './EntityModel.js';
import { EntityText } from './EntityText.js';
import { EntityTexture } from './EntityTexture.js';
import { EntityTimer } from './EntityTimer.js';
import { EntityParticles } from './EntityParticles.js';
import { EntityPhysics } from './EntityPhysics.js';
import { EntityPlatform } from './EntityPlatform.js';
import { EntityLightAmbient } from './EntityLightAmbient.js';
import { EntityLightDirectional } from './EntityLightDirectional.js';
import { EntityLightHemisphere } from './EntityLightHemisphere.js';
import { EntityLightPoint } from './EntityLightPoint.js';
import { EntityLightSun } from './EntityLightSun.js';
import { EntitySkyBox } from './EntitySkyBox.js';
import { EntitySkySphere } from './EntitySkySphere.js';
import { EntityTrimesh } from './EntityTrimesh.js';

/*
  The EntityManager class is responsible for managing all entities within
  the core scene. It handles entity creation, updates, rendering, loading
  from JSON descriptions, and serialization. It also integrates with the
  Rapier physics engine to manage the physics world and collision events.
*/

class EntityManager {
  constructor(core) {
    this.core = core;
    this.world = new World({ x: 0, y: -9.81, z: 0 });
    this.world.numSolverIterations = 4; // Default = 4
    this.world.timestep = 1 / 60; // Default 1 / 60
    this.world.maxCcdSubsteps = 0;
    this.world.rigidBodyRemovalQueue = [];
    this.world.queueRigidBodyRemoval = rb => this.world.rigidBodyRemovalQueue.push(rb);
    this.worldDebugger = new WorldDebugger(this.world); // Add to scene to enable
    this.eventQueue = new EventQueue(true);
    this.entityClasses = {};

    // Register core entity classes
    this.registerEntityClasses({
      Entity,
      EntityAudio,
      EntityBall,
      EntityCube,
      EntityDecal,
      EntityEnvironment,
      EntityFog,
      EntityMaterial,
      EntityMixer,
      EntityMesh,
      EntityModel,
      EntityText,
      EntityTexture,
      EntityTimer,
      EntityParticles,
      EntityPhysics,
      EntityPlatform,
      EntityLightAmbient,
      EntityLightDirectional,
      EntityLightHemisphere,
      EntityLightPoint,
      EntitySkyBox,
      EntitySkySphere,
      EntityTrimesh,
    });
  }

  update(loop) {
    // 1: Drain queued rigid body removals before stepping
    this.drainRigidBodyQueue();

    // 2: Advance the simulation by one time step
    this.world.step(this.eventQueue);

    // 3: Update debugger from world buffer
    this.worldDebugger.update();

    // 4: Update all scene entities
    this.core.scene.children.forEach(child => child.update?.(loop));

    // 5: Dispatch collision events to each entity pair
    this.eventQueue.drainCollisionEvents(this.onCollision);
  }

  render(loop) {
    // Render all scene entities
    this.core.scene.children.forEach(child => child.render?.(loop));
  }

  async load(data, onLoad = () => {}) {
    // Spawn all entities defined in the scene JSON
    const entities = [];
    const sceneOptions = (typeof data === 'string') ? await this.fetchJSON(data) : data;
    sceneOptions.children?.forEach(childOptions => {
      this.spawn(childOptions, this.core.scene, entities);
    });

    // Filter list of entities that are not yet loaded
    const pendingEntities = entities.filter(entity => !entity.isLoaded);

    // Define scene loaded handler
    const onSceneLoaded = () => {
      this.core.scene.dispatchEvent({ type: 'loaded' });
      onLoad();
    };

    // Load scene immediately if no pending entities
    if (pendingEntities.length === 0) {
      onSceneLoaded();
      return;
    }

    // Loop through pending entities
    let remaining = pendingEntities.length;
    pendingEntities.forEach(entity => {
      // Create loaded entity handler
      const onEntityLoaded = () => {
        entity.removeEventListener('loaded', onEntityLoaded);
        remaining--;
        if (remaining === 0) onSceneLoaded();
      };

      // Add loaded event listener
      entity.addEventListener('loaded', onEntityLoaded);
    });
  }

  async fetchJSON(url) {
    // Load entity descriptions from JSON file
    let json = {};
    try { json = await (await fetch(url)).json(); }
    catch { console.error(`Error: ${ url } not found.`); }
    return json;
  }

  convertModelToJSON(obj) {
    const json = {};

    // Add local transform properties (position, rotation, scale)
    if (obj.position) json.position = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
    if (obj.rotation) json.rotation = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
    if (obj.scale) json.scale = { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z };

    // Assign name
    if (obj.name) json.name = obj.name;

    // Assign 3D object userData to JSON object (may override json name)
    if (obj.userData) Object.assign(json, obj.userData);
    
    // Assign entity class name (for template creation)
    const className = this.findClassName(obj.name);
    if (className) json.class = className;

    // Store url reference if specified in template
    const template = this.entityClasses[className]?.template;
    if (template?.url !== undefined) {
      // Store mesh as an asset
      this.core.assets.assign(obj.uuid, obj);
      json.url = obj.uuid;
    }
    else {
      // Recursively create JSON for child entities
      obj.children?.forEach(child => {
        const childJSON = this.convertModelToJSON(child);
        json.children = json.children ?? [];
        json.children.push(childJSON);
      });
    }

    // Return JSON data
    return json;
  }

  findClassName(name) {
    const lName = name.toLowerCase();
    let bestMatch = null;
    let longestLength = 0;
    
    // Find the best match based on the name
    for (const [key, className] of Object.entries(this.entityClasses)) {
      if (lName.includes(key.toLowerCase()) && key.length > longestLength) {
        bestMatch = key;
        longestLength = key.length;
      }
    }
    return bestMatch;
  }

  spawn(options, parent = this.core.scene, entities = null) {
    // Create and add entity to parent
    const entity = this.create(options);
    if (entity) {
      // Add entity to parent
      parent.add(entity);

      // Track entity for initialization
      if (entities) entities.push(entity);

      // Continue loading child entities recursively
      options.children?.forEach(childOptions => {
        this.spawn(childOptions, entity, entities);
      });

      // Return entity
      return entity;
    }
  }

  create(options) {
    // Merge options from class template
    if (options.class) {
      const entityTemplate = this.entityClasses[options.class].template;
      if (entityTemplate) {
        const template = structuredClone(entityTemplate);
        Object.assign(template, options); // Merge options into cloned template
        Object.assign(options, template); // Merge template back into options
      }
    }

    // Create entity from registered class object
    let entity;
    if (this.entityClasses[options.class]) {
      entity = new this.entityClasses[options.class](options);
      entity.load(options, this.core);
      return entity;
    }
    else {
      console.error(`Entity class "${ options.class }" does not exist.`, options);
      return;
    }
  }

  remove(entity) {
    // Remove entity's rigid body from physics world
    entity.removeFromParent();
  }

  removeAll() {
    // Remove all entities from scene and physics world
    for (let i = this.core.scene.children.length - 1; i >= 0; i--) {
      const child = this.core.scene.children[i];
      if (child.isEntity) this.remove(child);
    }
  }

  drainRigidBodyQueue() {
    while (this.world.rigidBodyRemovalQueue.length > 0) {
      const rigidBody = this.world.rigidBodyRemovalQueue.pop();
      this.world.removeRigidBody(rigidBody);
    }
  }

  onCollision = (handle1, handle2, started) => {
    const collider1 = this.world.getCollider(handle1);
    const collider2 = this.world.getCollider(handle2);
    if (!collider1 || !collider2) return;
    const entity1 = collider1._parent?.entity;
    const entity2 = collider2._parent?.entity;
    if (!entity1 || !entity2) return;
    const event1 = { handle: handle1, pair: entity2, started: started, type: 'collision' };
    const event2 = { handle: handle2, pair: entity1, started: started, type: 'collision' };
    entity1.dispatchEvent(event1);
    entity2.dispatchEvent(event2);
  }

  registerEntityClass(name, entityClass) {
    this.entityClasses[name] = entityClass;
  }

  registerEntityClasses(entities = {}) {
    Object.entries(entities).forEach(([name, entityClass]) => {
      this.registerEntityClass(name, entityClass);
    });
  }

  debug(state = true) {
    // Enable or disable physics world debugger
    if (state === true) this.core.scene.add(this.worldDebugger);
    else this.core.scene.remove(this.worldDebugger);
  }

  serialize(condition = () => true) {
    // Serialize scene to JSON
    const json = {
      name: this.core.scene.name,
      children: []
    };

    // Serialize scene entities
    this.core.scene.children.forEach(child => {
      if (child.isEntity && condition(child)) {
        json.children.push(child.serialize());
      }
    });

    return json;
  }
}

export { EntityManager }