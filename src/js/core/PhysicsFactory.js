import { Euler, Quaternion, Vector3 } from 'three';
import { ActiveCollisionTypes, ActiveEvents, ColliderDesc, Compound, RigidBodyDesc, RigidBodyType, TriMeshFlags } from '@dimforge/rapier3d';

/*
  PhysicsFactory is a static factory class responsible for creating
  entity physics components.
*/

// Initialize module-scoped variables
const _v = new Vector3();
const _e = new Euler();
const _q = new Quaternion();

class PhysicsFactory {
  static create(entity, options, world) {
    if (entity === undefined) return;
    
    // Create rigid body
    const rigidBodyDesc = PhysicsFactory.createRigidBodyDesc(options);
    const rigidBody = PhysicsFactory.createRigidBody(rigidBodyDesc, world);
    entity.setRigidBody(rigidBody);

    // Add colliders to rigid body
    options.colliders?.forEach(colliderOptions => {
      const colliderDesc = PhysicsFactory.createColliderDesc(colliderOptions);
      PhysicsFactory.createCollider(colliderDesc, rigidBody, world);
    });
  }

  static createRigidBodyDesc(options) {
    // Define default options
    options = Object.assign({
      angularDamping: 0,
      ccd: false,
      enabledRotations: { x: true, y: true, z: true },
      enabledTranslations: { x: true, y: true, z: true },
      isEnabled: true,
      linearDamping: 0,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      sleeping: false,
      softCcdPrediction: 0,
      status: 0, // 0: Dynamic, 1: Fixed, 2: KinematicPositionBased, 3: KinematicVelocityBased
      userData: {}
    }, options);

    const rigidBodyDesc = new RigidBodyDesc(isNaN(options.status) ? RigidBodyType[options.status] : options.status);
    const rotation = options.w ? _q.copy(options.rotation) : _q.setFromEuler(_e.setFromVector3(_v.copy(options.rotation), options.rotation.order || 'XYZ'));
    rigidBodyDesc.enabledRotations(options.enabledRotations.x, options.enabledRotations.y, options.enabledRotations.z);
    rigidBodyDesc.enabledTranslations(options.enabledTranslations.x, options.enabledTranslations.y, options.enabledTranslations.z);
    rigidBodyDesc.setAngularDamping(options.angularDamping);
    rigidBodyDesc.setCcdEnabled(options.ccd);
    rigidBodyDesc.setEnabled(options.isEnabled);
    rigidBodyDesc.setLinearDamping(options.linearDamping);
    rigidBodyDesc.setRotation(rotation);
    rigidBodyDesc.setSleeping(options.sleeping);
    rigidBodyDesc.setSoftCcdPrediction(options.softCcdPrediction);
    rigidBodyDesc.setTranslation(options.position.x, options.position.y, options.position.z);
    rigidBodyDesc.setUserData(options.userData);
    return rigidBodyDesc;
  }

  static createRigidBody(rigidBodyDesc, world) {
    return world.createRigidBody(rigidBodyDesc);
  }

  static createColliderDesc(options) {
    options = Object.assign({
      activeCollisionTypes: 'ALL', // 1: DYNAMIC_DYNAMIC, 2: DYNAMIC_FIXED, 12: DYNAMIC_KINEMATIC, 15: DEFAULT, 32: FIXED_FIXED, 8704: KINEMATIC_FIXED, 52224: KINEMATIC_KINEMATIC, 60943: ALL
      activeEvents: 'COLLISION_EVENTS', // 0: NONE, 1: COLLISION_EVENTS, 2: CONTACT_FORCE_EVENTS
      collisionGroups: 0xFFFFFFFF,
      contactForceEventThreshold: 0,
      density: 1,
      enabled: true,
      friction: 0.5,
      isSensor: false,
      mass: 0,
      restitution: 0,
      rotation: { x: 0, y: 0, z: 0 },
      shape: undefined,
      shapes: undefined,
      solverGroups: 0xFFFFFFFF,
      translation: { x: 0, y: 0, z: 0 }
    }, options);

    const shape = PhysicsFactory.createShape(options.shape || options.shapes);
    const colliderDesc = new ColliderDesc(shape);
    const rotation = options.w ? _q.copy(options.rotation) : _q.setFromEuler(_e.setFromVector3(_v.copy(options.rotation), options.rotation.order || 'XYZ'));
    colliderDesc.setActiveCollisionTypes(isNaN(options.activeCollisionTypes) ? ActiveCollisionTypes[options.activeCollisionTypes] : options.activeCollisionTypes);
    colliderDesc.setActiveEvents(isNaN(options.activeEvents) ? ActiveEvents[options.activeEvents] : options.activeEvents);
    colliderDesc.setCollisionGroups(options.collisionGroups);
    colliderDesc.setContactForceEventThreshold(options.contactForceEventThreshold);
    colliderDesc.setMass(options.mass); // Must set before density
    colliderDesc.setDensity(options.density);
    colliderDesc.setEnabled(options.enabled);
    colliderDesc.setFriction(options.friction);
    colliderDesc.setRestitution(options.restitution);
    colliderDesc.setRotation(rotation);
    colliderDesc.setSensor(options.isSensor);
    colliderDesc.setSolverGroups(options.solverGroups);
    colliderDesc.setTranslation(options.translation.x, options.translation.y, options.translation.z);
    return colliderDesc;
  }

  static createCollider(colliderDesc, rigidBody, world) {
    return world.createCollider(colliderDesc, rigidBody);
  }

  static createShape(shapeDesc) {
    const compoundParts = Array.isArray(shapeDesc) ? shapeDesc : [];
    if (compoundParts.length < 1) return ColliderDesc[shapeDesc.type](...shapeDesc.arguments || []).shape;

    const shapes = [];
    const positions = [];
    const rotations = [];

    // Process each part of the compound shape
    compoundParts.forEach(part => {
      const shape = PhysicsFactory.createShape(part);
      const translation = part.translation ?? { x: 0, y: 0, z: 0 };
      const rotation = part.rotation ?? { x: 0, y: 0, z: 0 };
      const quaternion = rotation.w ? rotation : _q.setFromEuler(_e.setFromVector3(_v.copy(rotation)));

      shapes.push(shape);
      positions.push(translation);
      rotations.push(quaternion);
    });

    return new Compound(shapes, positions, rotations);
  }

  static createController(entity, options, world) {
    // Set base options
    options = Object.assign({
      applyImpulsesMass: 1,
      applyImpulsesToDynamicBodies: true,
      autostepMaxHeight: 0.5,
      autostepMinWidth: 0.2,
      autostepIncludeDynamicBodies: true,
      maxSlopeClimbAngle: 45 * Math.PI / 180,
      minSlopeClimbAngle: 30 * Math.PI / 180,
      offset: 0.01,
      slideEnabled: true,
      snapToGroundDistance: 0
    }, options);

    // Create character controller from world
    const controller = world.createCharacterController(options.offset); // Spacing

    // Update controller settings
    controller.setSlideEnabled(options.slideEnabled); // Allow sliding down hill
    controller.setMaxSlopeClimbAngle(options.maxSlopeClimbAngle); // Don’t allow climbing slopes larger than 45 degrees.
    controller.setMinSlopeSlideAngle(options.minSlopeClimbAngle); // Automatically slide down on slopes smaller than 30 degrees.
    controller.enableAutostep(options.autostepMaxHeight, options.autostepMinWidth, options.autostepIncludeDynamicBodies); // (maxHeight, minWidth, includeDynamicBodies) Stair behavior
    controller.enableSnapToGround(options.snapToGroundDistance); // (distance) Set ground snap behavior
    controller.setApplyImpulsesToDynamicBodies(options.applyImpulsesToDynamicBodies); // Add push behavior
    controller.setCharacterMass(options.applyImpulsesMass); // (mass) Set character mass

    // Assign controller to entity
    entity.setController(controller);
    return controller;
  }
}

export { PhysicsFactory }