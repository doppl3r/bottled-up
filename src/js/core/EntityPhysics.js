import { clone } from 'three/examples/jsm/utils/SkeletonUtils';
import { Euler, Quaternion, Vector3 } from 'three';
import { TriMeshFlags } from '@dimforge/rapier3d';
import { PhysicsFactory } from './PhysicsFactory.js';
import { MeshFactory } from './MeshFactory.js';
import { Entity } from './Entity.js';

/*
  EntityPhysics is a specialized entity that integrates with the
  Rapier.js physics engine's rigid body component.
*/

// Initialize module-scoped variables
const _eventUpdatedRigidBody = { type: 'updatedRigidBody', loop: null };
const _eventRenderedRigidBody = { type: 'renderedRigidBody', loop: null };
const _eventOnCollision = { handle: null, pair: null, started: true, type: 'collision' };
const _eventOnWake = { type: 'onWake' };
const _eventOnSleep = { type: 'onSleep' };
const _v = new Vector3();
const _e = new Euler();
const _q = new Quaternion();

class EntityPhysics extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Store options
    this.options = options;

    // Declare entity components
    this.position0 = new Vector3();
    this.quaternion0 = this.quaternion.clone();
    this.rigidBody;
    this.sleeping = false;

    // Store reference to the physics world
    this.world = core.entityManager.world;

    // Load mesh data from asset if defined
    const url = options.url;
    if (url) {
      core.assets.load(url, asset => {
        // Clone the loaded asset
        const model = clone(asset);

        // Reset object matrix before merging meshes
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);

        // Apply parent scale
        if (this.parent) model.scale.copy(this.parent.scale);

        // Update the clone's world matrix to reflect the applied transform
        model.updateWorldMatrix(true, true);

        // Merge geometry from the (disposable) cloned model
        const mesh = MeshFactory.mergeObjectMeshes(model);
        this.url = options.url;

        // Add merged mesh data to collider shape 
        options.rigidBody.colliders?.forEach(colliderOptions => {
          colliderOptions.shapeDesc.arguments = [
            mesh.geometry.attributes.position.array,
            mesh.geometry.index.array,
            TriMeshFlags['FIX_INTERNAL_EDGES']];
        });

        // Create rigid body
        PhysicsFactory.create(this, options.rigidBody, this.world);

        // Resync transform
        this.syncTransformFromParent();

        // Update entity state
        this.ready();
      });
    }
    else {
      // Create physics component immediately
      PhysicsFactory.create(this, options.rigidBody, this.world);
      this.ready();
    }

    // Add event listeners
    this.addEventListener('added', this.onAdded);
    this.addEventListener('removed', this.onRemoved);
  }

  update(loop) {
    // Update transformation components from rigid body
    this.saveState();

    // Update the sleep state of the rigid body
    this.updateSleepState();

    // Dispatch event after updating
    _eventUpdatedRigidBody.loop = loop;
    this.dispatchEvent(_eventUpdatedRigidBody);

    // Perform base entity update
    super.update(loop);
  }
  
  render(loop) {
    // Interpolate parent entity transform for smooth rendering
    this.parent.position.lerpVectors(this.position0, this.position, loop.alpha);
    this.parent.quaternion.slerpQuaternions(this.quaternion0, this.quaternion, loop.alpha);

    // Dispatch 'rendered' events after updating
    _eventRenderedRigidBody.loop = loop;
    this.dispatchEvent(_eventRenderedRigidBody);

    // Perform base entity render
    super.render(loop);
  }

  saveState() {
    this.position0.copy(this.position);
    this.quaternion0.copy(this.quaternion);
    this.position.copy(this.getPosition());
    this.quaternion.copy(this.getRotation());
  }

  setRigidBody(rigidBody) {
    this.rigidBody = rigidBody;
    this.rigidBody.entity = this;
    this.sleeping = this.rigidBody.isSleeping();
    this.saveState();
  }

  getPosition() {
    if (this.rigidBody === undefined) return this.position;
    return this.rigidBody.translation();
  }

  setPosition(position, wakeUp = true) {
    this.rigidBody?.setTranslation(position, wakeUp);
    this.position0.copy(position);
    this.position.copy(position);
  }

  setNextKinematicPosition(position) {
    if (!this.rigidBody) return;
    this.rigidBody.setNextKinematicTranslation(position);
  }

  getRotation() {
    if (this.rigidBody === undefined) return this.quaternion;
    return this.rigidBody.rotation();
  }

  setRotation(rotation, wakeUp = true) {
    // Resolve Euler rotation type before assigning rotation
    rotation = rotation.w ? rotation : _q.setFromEuler(_e.setFromVector3(_v.copy(rotation)));

    // Check rigidBody type before assigning
    this.rigidBody?.setRotation(rotation, wakeUp);
    this.quaternion0.copy(this.quaternion);
    this.quaternion.copy(rotation);
  }

  setNextKinematicRotation(rotation) {
    if (!this.rigidBody) return;
    rotation = rotation.w ? rotation : _q.setFromEuler(_e.setFromVector3(_v.copy(rotation)));
    this.rigidBody.setNextKinematicRotation(rotation);
  }

  getSpeed() {
    if (this.rigidBody === undefined) return 0;
    return _v.copy(this.rigidBody.linvel()).length();
  }

  syncTransformFromParent() {
    // Inherit parent transform if available
    if (!this.parent) return;
    this.setPosition(this.parent.position);
    this.setRotation(this.parent.rotation);
  }

  updateSleepState() {
    if (!this.rigidBody) return;

    // Dispatch onWake/onSleep only on state transitions
    const sleeping = this.rigidBody.isSleeping();
    if (sleeping !== this.sleeping) {
      this.sleeping = sleeping;
      this.dispatchEvent(sleeping ? _eventOnSleep : _eventOnWake);
    }
  }

  onAdded = event => {
    // Inherit transform from parent properties
    this.syncTransformFromParent();

    // Save initial state
    this.saveState();

    // Add event listener to parent entity
    this.parent.addEventListener('removed', this.onParentRemoved);
  }

  onRemoved = event => {
    // Queue rigid body for removal and remove event listener from parent entity
    this.world?.queueRigidBodyRemoval(this.rigidBody);
    this.removeEventListener('removed', this.onRemoved);
  }

  onParentRemoved = event => {
    // Queue rigid body for removal and remove event listener from parent entity
    this.world?.queueRigidBodyRemoval(this.rigidBody);
    this.parent.removeEventListener('removed', this.onParentRemoved);
  }

  dispatchCollisionEvent = (handle, pair, started) => {
    _eventOnCollision.handle = handle;
    _eventOnCollision.pair = pair;
    _eventOnCollision.started = started;
    this.dispatchEvent(_eventOnCollision);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    if (this.url) json.url = this.url;
    if (this.options.rigidBody) {
      json.rigidBody = JSON.parse(JSON.stringify(this.options.rigidBody));
    }
    return json;
  }

  static template = {
    rigidBody: {}
  }
}

export { EntityPhysics }