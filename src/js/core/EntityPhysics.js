import { Euler, Quaternion, Vector3 } from 'three';
import { PhysicsFactory } from './PhysicsFactory.js';
import { Entity } from './Entity.js';

/*
  EntityPhysics is a specialized entity that integrates with the
  Rapier.js physics engine's rigid body component.
*/

// Initialize module-scoped variables
const _eventUpdatedRigidBody = { type: 'updatedRigidBody', loop: null };
const _eventRenderedRigidBody = { type: 'renderedRigidBody', loop: null };
const _v = new Vector3();
const _e = new Euler();
const _q = new Quaternion();

class EntityPhysics extends Entity {
  constructor(options = {}) {
    // Set default options
    options = Object.assign({
      class: 'EntityPhysics',
      rigidBody: {}
    }, options);

    // Inherit Entity properties
    super(options);

    // Declare entity components
    this.position0 = new Vector3();
    this.quaternion0 = this.quaternion.clone();
    this.rigidBodyOptions = options.rigidBody;
    this.rigidBody;

    // Add event listeners
    this.addEventListener('added', this.onAdded);
  }

  init(options, core) {
    // Inherit position from parent options
    if (options.rigidBody.position === undefined && options.parent.position) {
      options.rigidBody.position = options.parent.position;
    }

    // Inherit rotation from parent options
    if (options.rigidBody.rotation === undefined && options.parent.rotation) {
      options.rigidBody.rotation = options.parent.rotation;
    }

    // Inherit scale from parent options
    if (options.parent.scale) {
      options.rigidBody.colliders?.forEach(colliderOptions => {
        if (colliderOptions.shapeDesc.type === 'cuboid') {
          colliderOptions.shapeDesc.arguments = Object.values(options.parent.scale).map(v => v * 0.5);
        }
      });
    }

    // Add physics component if entity is an instance of EntityPhysics
    PhysicsFactory.create(this, options.rigidBody, core.entityManager.world);
  }

  update(loop) {
    // Update transformation components from rigid body
    this.saveState();

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
    this.saveState();
  }

  getPosition() {
    if (this.rigidBody === undefined) return this.position;
    else if (this.rigidBody.isKinematic()) return this.rigidBody.nextTranslation();
    return this.rigidBody.translation();
  }

  setPosition(position) {
    if (this.rigidBody?.isKinematic()) this.rigidBody?.setNextKinematicTranslation(position);
    else this.rigidBody?.setTranslation(position);
    this.position0.copy(position);
    this.position.copy(position);
  }

  getRotation() {
    if (this.rigidBody === undefined) return this.quaternion;
    else if (this.rigidBody.isKinematic()) return this.rigidBody.nextRotation();
    return this.rigidBody.rotation();
  }

  setRotation(rotation) {
    // Resolve Euler rotation type before assigning rotation
    rotation = rotation.w ? rotation : _q.setFromEuler(_e.setFromVector3(_v.copy(rotation)));

    // Check rigidBody type before assigning
    if (this.rigidBody?.isKinematic()) this.rigidBody?.setNextKinematicRotation(rotation);
    else this.rigidBody?.setRotation(rotation);
    this.quaternion0.copy(rotation);
    this.quaternion.copy(rotation);
  }

  onAdded = event => {
    // Save initial state
    this.saveState();

    // Add event listener to parent entity
    event.target.parent.addEventListener('removed', this.onParentRemoved);
  }

  onParentRemoved = event => {
    // Queue rigid body for removal and remove event listener from parent entity
    this.rigidBody?.world?.queueRigidBodyRemoval(this.rigidBody);
    event.target.removeEventListener('removed', this.onParentRemoved);
  }

  serialize() {
    // Serialize entity to JSON
    const json = super.serialize();
    json.rigidBody = JSON.parse(JSON.stringify(this.rigidBodyOptions));
    return json;
  }
}

export { EntityPhysics }