import { Entity } from './core/Entity.js';
import { Tweens } from './core/Tweens.js';

class EntityBoxel extends Entity {
  constructor(options, core) {
    // Inherit Entity properties
    super(options, core);

    // Animations
    this.tweens = new Tweens();
    this.time = 0;

    // Update child entity options
    for (let i = 0; i < options.children.length; i++) {
      let child = options.children[i];
      if (child.class === 'EntityMesh') {
        // Randomize face texture and color
        const index = Math.floor(Math.random() * EntityBoxel.faces.length);

        // Update body and face URL
        child.material.arguments[0].color = EntityBoxel.faces[index].color;
        child.children[0].children[0].url = EntityBoxel.faces[index].url;
      }
      if (child.class === 'EntityPhysics') {
        // Update shape scale
        const colliders = child.rigidBody.colliders;
        colliders.forEach(colliderOptions => {
          const args = [options.scale.x, options.scale.y, options.scale.z];
          colliderOptions.shapeDesc.arguments = args;
        });
      }
    }

    // Update entity state
    this.isCollected = false;
    this.isReady = true;

    // Add child events
    this.addEventListener('childadded', this.onChildAdded);
  }

  render(loop) {
    // Animate mesh
    this.time += loop.delta;
    this.get('EntityMesh').position.y = Math.cos(this.time * 0.0025) * 0.25;
    this.get('EntityMesh').rotation.y += loop.delta * 0.0025;

    // Update tweens
    this.tweens.update(loop.delta);

    // Update render
    super.render(loop);
  }

  onChildAdded = event => {
    const child = event.child;
    if (child.class === 'EntityPhysics') {
      child.addEventListener('collision', this.onCollision);
    }
  }

  onCollision = event => {
    if (event.started && this.isCollected === false && event.pair.parent.class === 'EntityPlayer') {
      this.isCollected = true;

      // Store scale values for tweening
      const scale = this.scale.clone();
      const scaleMax = scale.clone().multiplyScalar(2);
      const scaleMin = scale.clone().set(0, 0, 0);

      // Animate scale
      const tweenIn = this.tweens.tween({ object: this.scale, to: scaleMax, duration: 250, easing: 'Cubic.Out' });
      const tweenOut = this.tweens.tween({ object: this.scale, to: scaleMin, duration: 500, easing: 'Cubic.Out', start: false, onComplete: () => this.removeFromParent() });
      tweenIn.chain(tweenOut);
    }
  }

  static template = {
    children: [
      {
        class: 'EntityPhysics',
        rigidBody: {
          status: 1,
          colliders: [
            {
              isSensor: true,
              shapeDesc: {
                type: 'cuboid',
                arguments: [0.25, 0.25, 0.25]
              }
            }
          ]
        }
      },
      {
        class: 'EntityMesh',
        geometry: {
          type: 'RoundedBoxGeometry',
          arguments: [1, 1, 1, 2, 0.1]
        },
        material: {
          type: 'MeshStandardMaterial',
          arguments: [{ color: '#FFCB4C' }],
        },
        children: [
          {
            class: 'EntityMesh',
            scale: { x: 1, y: 1, z: 1 },
            position: { x: 0, y: 0, z: 0.55 },
            castShadow: false,
            receiveShadow: true,
            renderOrder: 1,
            geometry: {
              type: 'PlaneGeometry',
              arguments: [1, 1]
            },
            material: {
              type: 'MeshStandardMaterial',
              arguments: [{ color: '#ffffff', transparent: true }],
            },
            children: [
              {
                class: 'EntityTexture',
                url: 'png/smile.png',
                minFilter: 1003,
                magFilter: 1003,
                repeat: { x: 1, y: 1 },
              }
            ]
          },
        ]
      }
    ]
  }

  static faces = [
    {
      url: 'png/angry.png',
      color: '#DA2F47'
    },
    {
      url: 'png/cool.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/grimacing.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/kitty.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/lover.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/puke.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/sad.png',
      color: '#FFCB4C'
    },
    {
      url: 'png/sick.png',
      color: '#77AF57'
    },
  ]
}

export { EntityBoxel }