import { Euler, Quaternion, Vector3 } from 'three';
import { ActiveCollisionTypes, ActiveEvents, ColliderDesc, RigidBodyDesc, RigidBodyType, TriMeshFlags } from '@dimforge/rapier3d';
import { MeshFactory } from './MeshFactory.js';

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
      PhysicsFactory.attachCollider(entity, colliderOptions, rigidBody);
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
    const rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBody.world = world;
    return rigidBody;
  }

  static createColliderDesc(options) {
    options = Object.assign({
      activeCollisionTypes: 'ALL', // 1: DYNAMIC_DYNAMIC, 2: DYNAMIC_FIXED, 12: DYNAMIC_KINEMATIC, 15: DEFAULT, 32: FIXED_FIXED, 8704: KINEMATIC_FIXED, 52224: KINEMATIC_KINEMATIC, 60943: ALL
      activeEvents: 'COLLISION_EVENTS', // 0: NONE, 1: COLLISION_EVENTS, 2: CONTACT_FORCE_EVENTS
      collisionGroups: 0xFFFFFFFF,
      contactForceEventThreshold: 0,
      density: 1,
      events: [],
      friction: 0.5,
      isSensor: false,
      mass: 0,
      restitution: 0,
      rotation: { x: 0, y: 0, z: 0 },
      shapeDesc: {
        type: null,
        arguments: []
      },
      solverGroups: 0xFFFFFFFF,
      translation: { x: 0, y: 0, z: 0 }
    }, options);

    // Create collider description using shape "type" (ex: "cuboid") with parameters (ex: 0.5, 0.5, 0.5)
    const colliderDesc = ColliderDesc[options.shapeDesc.type](...options.shapeDesc.arguments);
    const rotation = options.w ? _q.copy(options.rotation) : _q.setFromEuler(_e.setFromVector3(_v.copy(options.rotation), options.rotation.order || 'XYZ'));
    colliderDesc.setActiveCollisionTypes(isNaN(options.activeCollisionTypes) ? ActiveCollisionTypes[options.activeCollisionTypes] : options.activeCollisionTypes);
    colliderDesc.setActiveEvents(isNaN(options.activeEvents) ? ActiveEvents[options.activeEvents] : options.activeEvents);
    colliderDesc.setCollisionGroups(options.collisionGroups);
    colliderDesc.setContactForceEventThreshold(options.contactForceEventThreshold);
    colliderDesc.setMass(options.mass); // Must set before density
    colliderDesc.setDensity(options.density);
    colliderDesc.setFriction(options.friction);
    colliderDesc.setRestitution(options.restitution);
    colliderDesc.setRotation(rotation);
    colliderDesc.setSensor(options.isSensor);
    colliderDesc.setSolverGroups(options.solverGroups);
    colliderDesc.setTranslation(options.translation.x, options.translation.y, options.translation.z);
    return colliderDesc;
  }

  static createCollider(colliderDesc, rigidBody) {
    return rigidBody.world.createCollider(colliderDesc, rigidBody);
  }

  static attachCollider(entity, colliderOptions, rigidBody) {
    // Create collider immediately
    if (colliderOptions.shapeDesc.arguments) {
      const colliderDesc = PhysicsFactory.createColliderDesc(colliderOptions);
      PhysicsFactory.createCollider(colliderDesc, rigidBody);
    }
    else {
      // Create collider from sibling mesh data
      PhysicsFactory.createColliderFromSibling(entity, colliderOptions, rigidBody);
    }
  }

  static createColliderFromSibling(entity, colliderOptions, rigidBody) {
    // Get sibling data after adding entity to parent
    const onEntityAdded = () => {
      // Find the first sibling with mesh or model data
      const sibling = entity.parent.children.find(c => ['EntityModel', 'EntityMesh'].includes(c.class));
      
      // Create collider from sibling mesh data by class type
      if (sibling.class === 'EntityMesh') {
        PhysicsFactory.updateShapeDescFromMesh(sibling.mesh, colliderOptions);
        PhysicsFactory.attachCollider(entity, colliderOptions, rigidBody);
      }
      else if (sibling.class === 'EntityModel') {
        // Create collider from sibling model data AFTER loading model data
        const onModelLoaded = () => {
          PhysicsFactory.updateShapeDescFromMesh(sibling.model, colliderOptions);
          PhysicsFactory.attachCollider(entity, colliderOptions, rigidBody);
          sibling.removeEventListener('loaded', onModelLoaded);
        };

        // Add event listener for sibling to load a model asset
        if (sibling.model) onModelLoaded();
        else sibling.addEventListener('loaded', onModelLoaded);
      }

      // Remove event listener to avoid duplicate calls
      entity.removeEventListener('added', onEntityAdded);
    };

    // Wait for entity to be added to parent
    entity.addEventListener('added', onEntityAdded);
  }

  static updateShapeDescFromMesh = (mesh, colliderOptions) => {
    // Build collider from mesh then resume collider setup
    const { geometry } = MeshFactory.mergeObjectMeshes(mesh);
    colliderOptions.shapeDesc.arguments = [geometry.attributes.position.array, geometry.index.array, TriMeshFlags['FIX_INTERNAL_EDGES']];
  };

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