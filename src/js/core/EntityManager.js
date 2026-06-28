import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { EventQueue, World } from '@dimforge/rapier3d';
import { PhysicsFactory } from './PhysicsFactory.js';
import { WorldDebugger } from './WorldDebugger.js';
import { Entity } from './Entity.js';
import { EntityAudio } from './EntityAudio.js';
import { EntityMaterial } from './EntityMaterial.js';
import { EntityMesh } from './EntityMesh.js';
import { EntityMixer } from './EntityMixer.js';
import { EntityModel } from './EntityModel.js';
import { EntityTexture } from './EntityTexture.js';
import { EntityTimer } from './EntityTimer.js';
import { EntityParticles } from './EntityParticles.js';
import { EntityPhysics } from './EntityPhysics.js';
import { EntityLightAmbient } from './EntityLightAmbient.js';
import { EntityLightDirectional } from './EntityLightDirectional.js';
import { EntityLightHemisphere } from './EntityLightHemisphere.js';
import { EntityLightPoint } from './EntityLightPoint.js';

/*
  The EntityManager class is responsible for managing all entities within
  the core scene. It handles entity creation, updates, rendering, loading
  from JSON descriptions, and serialization. It also integrates with the
  Rapier physics engine to manage the physics world and collision events.
*/

class EntityManager {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.world = new World({ x: 0, y: -9.81, z: 0 });
    this.world.numSolverIterations = 4; // Default = 4
    this.world.timestep = 1 / 60; // Default 1 / 60
    this.world.rigidBodyRemovalQueue = [];
    this.world.queueRigidBodyRemoval = rb => this.world.rigidBodyRemovalQueue.push(rb);
    this.worldDebugger = new WorldDebugger(this.world); // Add to scene to enable
    this.eventQueue = new EventQueue(true);
    this.entityTemplates = {};
    this.entityClasses = {};

    // Register core entity classes
    this.registerEntityClasses({
      Entity,
      EntityAudio,
      EntityMaterial,
      EntityMixer,
      EntityMesh,
      EntityModel,
      EntityTexture,
      EntityTimer,
      EntityParticles,
      EntityPhysics,
      EntityLightAmbient,
      EntityLightDirectional,
      EntityLightHemisphere,
      EntityLightPoint,
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
    this.scene.children.forEach(child => child.update?.(loop));

    // 5: Dispatch collision events to each entity pair
    this.eventQueue.drainCollisionEvents(this.onCollision);
  }

  render(loop) {
    // Render all scene entities
    this.scene.children.forEach(child => child.render?.(loop));
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

  spawn(options, parent = this.scene) {
    // Create and add entity to parent
    const entity = this.create(options);
    if (entity) {
      // Add entity to parent
      parent.add(entity);

      // Continue loading child entities recursively
      options.children?.forEach(childOptions => {
        this.spawn(childOptions, entity);
      });

      // Return entity
      return entity;
    }
  }

  create(options) {
    // Update options from template if specified
    if (options.template) {
      if (this.entityTemplates[options.template]) {
        // Store original template data (for serialization)
        options.tempData = { ...options };

        // Merge template data into options
        const template = structuredClone(this.entityTemplates[options.template]);
        Object.assign(options, template, options.tempData);
      }
      else {
        console.error(`Entity template "${options.template}" does not exist.`);
        return;
      }
    }

    // Create entity from registered class object
    let entity;
    if (this.entityClasses[options.class]) {
      entity = new this.entityClasses[options.class](options);
    }
    else {
      console.error(`Entity class "${ options.class }" does not exist.`);
      return;
    }

    
    // TODO: Replace all instanceof conditions with new entity.init() system
    entity.init(options, this);

    // Add model component if entity is an instance of EntityModel
    if (entity instanceof EntityModel) {
      this.assets.load(options.url, asset => {
        const model = clone(asset);
        entity.setModel(model, options);
        entity.add(model);
        entity.dispatchEvent({ type: 'loaded', model });
      });
    }
    else if (entity instanceof EntityAudio) {
      // Add audio component if entity is an instance of EntityAudio
      this.assets.load(options.url, audio => {
        entity.setAudio(audio, options);
        entity.add(audio);
        entity.dispatchEvent({ type: 'loaded', audio });
      });
    }
    else if (entity instanceof EntityMaterial) {
      // Add material component if entity is an instance of EntityMaterial
      this.assets.load(options.url, material => {
        entity.setMaterial(material, options);
        entity.dispatchEvent({ type: 'loaded', material });
      });
    }
    else if (entity instanceof EntityTexture) {
      // Add texture component if entity is an instance of EntityTexture
      this.assets.load(options.url, texture => {
        entity.setTexture(texture, options);
        entity.dispatchEvent({ type: 'loaded', texture });
      });
    }
    else if (entity instanceof EntityParticles) {
      // Add particles component if entity is an instance of EntityParticles
      if (options.urls) {
        this.assets.loadBatch(options.urls, textures => {
          entity.setTextures(textures, options);
          entity.dispatchEvent({ type: 'loaded', textures });
        });
      }
    }

    // Return newly created entity
    return entity;
  }

  remove(entity) {
    // Remove entity's rigid body from physics world
    entity.removeFromParent();

    // Queue rigid body for removal if entity has one
    if (entity instanceof EntityPhysics) {
      this.world.queueRigidBodyRemoval(entity.rigidBody);
    }
  }

  removeAll() {
    // Remove all entities from scene and physics world
    this.scene.children.forEach(child => {
      if (child.isEntity) this.remove(child);
    });
  }

  drainRigidBodyQueue() {
    while (this.world.rigidBodyRemovalQueue.length > 0) {
      const rigidBody = this.world.rigidBodyRemovalQueue.pop();
      this.world.removeRigidBody(rigidBody);
    }
  }

  async load(data, onLoad = () => {}) {
    // Fetch scene JSON and add entities to scene
    const sceneOptions = typeof data === 'string' ? await this.fetchJSON(data) : data;
    sceneOptions.children?.forEach(childOptions => {
      onLoad(this.spawn(childOptions));
    });
  }

  async fetchJSON(url) {
    // Load entity descriptions from JSON file
    let json = {};
    try { json = await (await fetch(url)).json(); }
    catch { console.error(`Error: ${ url } not found.`); }
    return json;
  }

  registerEntityClass(name, entityClass) {
    this.entityClasses[name] = entityClass;
  }

  registerEntityClasses(entities = {}) {
    Object.entries(entities).forEach(([name, entityClass]) => {
      this.registerEntityClass(name, entityClass);
    });
  }

  registerEntityTemplate(name, template) {
    this.entityTemplates[name] = template;
  }

  registerEntityTemplates(templates = {}) {
    Object.entries(templates).forEach(([name, template]) => {
      this.registerEntityTemplate(name, template);
    });
  }

  debug(state = true) {
    // Enable or disable physics world debugger
    if (state === true) this.scene.add(this.worldDebugger);
    else this.scene.remove(this.worldDebugger);
  }

  serialize(condition = () => true) {
    // Serialize scene to JSON
    const json = {
      name: this.scene.name,
      children: []
    };

    // Serialize scene entities
    this.scene.children.forEach(child => {
      if (child.isEntity && condition(child)) {
        json.children.push(child.serialize());
      }
    });

    return json;
  }
}

export { EntityManager }