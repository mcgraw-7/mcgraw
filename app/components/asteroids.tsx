'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Asteroid {
  mesh: THREE.LineLoop;
  velocity: THREE.Vector2;
  rotationSpeed: number;
  size: number;
}

interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector2;
  life: number;
}

const AsteroidsGame = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shipRef = useRef<THREE.LineLoop | null>(null);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const shipVelocityRef = useRef(new THREE.Vector2(0, 0));
  const shipRotationRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Get container dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    // Orthographic camera for 2D feel
    const frustumSize = 100;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create ship (classic triangle shape)
    const shipGeometry = new THREE.BufferGeometry();
    const shipVertices = new Float32Array([
      2, 0, 0,      // nose
      -1.5, 1.2, 0, // left wing
      -1, 0, 0,     // back indent
      -1.5, -1.2, 0,// right wing
      2, 0, 0       // back to nose
    ]);
    shipGeometry.setAttribute('position', new THREE.BufferAttribute(shipVertices, 3));
    const shipMaterial = new THREE.LineBasicMaterial({ color: 0x39FF14 }); // neonGreen
    const ship = new THREE.LineLoop(shipGeometry, shipMaterial);
    ship.scale.set(2, 2, 2);
    scene.add(ship);
    shipRef.current = ship;

    // Create asteroids
    const createAsteroidGeometry = (size: number) => {
      const geometry = new THREE.BufferGeometry();
      const points: number[] = [];
      const numPoints = 8 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const radius = size * (0.7 + Math.random() * 0.6);
        points.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        );
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      return geometry;
    };

    const spawnAsteroid = (x?: number, y?: number, size?: number) => {
      const asteroidSize = size || 3 + Math.random() * 4;
      const geometry = createAsteroidGeometry(asteroidSize);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xFF6600, // orange
        opacity: 0.7,
        transparent: true
      });
      const asteroid = new THREE.LineLoop(geometry, material);
      
      // Random position at screen edges if not specified
      if (x === undefined || y === undefined) {
        const edge = Math.floor(Math.random() * 4);
        const bounds = frustumSize * aspect / 2;
        switch (edge) {
          case 0: // top
            x = (Math.random() - 0.5) * bounds * 2;
            y = frustumSize / 2 + asteroidSize;
            break;
          case 1: // right
            x = bounds + asteroidSize;
            y = (Math.random() - 0.5) * frustumSize;
            break;
          case 2: // bottom
            x = (Math.random() - 0.5) * bounds * 2;
            y = -frustumSize / 2 - asteroidSize;
            break;
          default: // left
            x = -bounds - asteroidSize;
            y = (Math.random() - 0.5) * frustumSize;
        }
      }
      
      asteroid.position.set(x, y, 0);
      scene.add(asteroid);
      
      asteroidsRef.current.push({
        mesh: asteroid,
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        ),
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        size: asteroidSize
      });
    };

    // Initial asteroids
    for (let i = 0; i < 8; i++) {
      spawnAsteroid();
    }

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === ' ') {
        e.preventDefault();
        // Fire bullet
        if (shipRef.current && bulletsRef.current.length < 5) {
          const bulletGeometry = new THREE.CircleGeometry(0.5, 8);
          const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x39FF14 });
          const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
          
          const angle = shipRotationRef.current;
          bullet.position.copy(shipRef.current.position);
          bullet.position.x += Math.cos(angle) * 3;
          bullet.position.y += Math.sin(angle) * 3;
          
          scene.add(bullet);
          bulletsRef.current.push({
            mesh: bullet,
            velocity: new THREE.Vector2(
              Math.cos(angle) * 1.5,
              Math.sin(angle) * 1.5
            ),
            life: 60
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newAspect = newWidth / newHeight;
      
      if (cameraRef.current) {
        cameraRef.current.left = -frustumSize * newAspect / 2;
        cameraRef.current.right = frustumSize * newAspect / 2;
        cameraRef.current.updateProjectionMatrix();
      }
      
      rendererRef.current?.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const ship = shipRef.current;
      const camera = cameraRef.current;
      if (!ship || !camera) return;

      // Ship controls
      const keys = keysRef.current;
      const rotationSpeed = 0.05;
      const thrust = 0.015;
      const friction = 0.995;
      const maxSpeed = 0.8;

      if (keys.has('arrowleft') || keys.has('a')) {
        shipRotationRef.current += rotationSpeed;
      }
      if (keys.has('arrowright') || keys.has('d')) {
        shipRotationRef.current -= rotationSpeed;
      }
      if (keys.has('arrowup') || keys.has('w')) {
        shipVelocityRef.current.x += Math.cos(shipRotationRef.current) * thrust;
        shipVelocityRef.current.y += Math.sin(shipRotationRef.current) * thrust;
      }

      // Clamp velocity
      const speed = shipVelocityRef.current.length();
      if (speed > maxSpeed) {
        shipVelocityRef.current.multiplyScalar(maxSpeed / speed);
      }

      // Apply friction
      shipVelocityRef.current.multiplyScalar(friction);

      // Update ship position and rotation
      ship.position.x += shipVelocityRef.current.x;
      ship.position.y += shipVelocityRef.current.y;
      ship.rotation.z = shipRotationRef.current;

      // Screen wrapping for ship
      const bounds = {
        x: (camera.right || 50) + 5,
        y: (camera.top || 50) + 5
      };

      if (ship.position.x > bounds.x) ship.position.x = -bounds.x;
      if (ship.position.x < -bounds.x) ship.position.x = bounds.x;
      if (ship.position.y > bounds.y) ship.position.y = -bounds.y;
      if (ship.position.y < -bounds.y) ship.position.y = bounds.y;

      // Update asteroids
      asteroidsRef.current.forEach((asteroid) => {
        asteroid.mesh.position.x += asteroid.velocity.x;
        asteroid.mesh.position.y += asteroid.velocity.y;
        asteroid.mesh.rotation.z += asteroid.rotationSpeed;

        // Screen wrapping
        const asteroidBounds = bounds.x + asteroid.size;
        if (asteroid.mesh.position.x > asteroidBounds) asteroid.mesh.position.x = -asteroidBounds;
        if (asteroid.mesh.position.x < -asteroidBounds) asteroid.mesh.position.x = asteroidBounds;
        if (asteroid.mesh.position.y > bounds.y + asteroid.size) asteroid.mesh.position.y = -(bounds.y + asteroid.size);
        if (asteroid.mesh.position.y < -(bounds.y + asteroid.size)) asteroid.mesh.position.y = bounds.y + asteroid.size;
      });

      // Update bullets
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.mesh.position.x += bullet.velocity.x;
        bullet.mesh.position.y += bullet.velocity.y;
        bullet.life--;

        // Check collision with asteroids
        for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
          const asteroid = asteroidsRef.current[i];
          const dist = bullet.mesh.position.distanceTo(asteroid.mesh.position);
          
          if (dist < asteroid.size) {
            // Remove asteroid
            scene.remove(asteroid.mesh);
            asteroidsRef.current.splice(i, 1);
            
            // Spawn smaller asteroids if big enough
            if (asteroid.size > 2) {
              for (let j = 0; j < 2; j++) {
                const newSize = asteroid.size * 0.5;
                const offsetX = (Math.random() - 0.5) * 3;
                const offsetY = (Math.random() - 0.5) * 3;
                spawnAsteroid(
                  asteroid.mesh.position.x + offsetX,
                  asteroid.mesh.position.y + offsetY,
                  newSize
                );
              }
            }
            
            // Remove bullet
            scene.remove(bullet.mesh);
            return false;
          }
        }

        if (bullet.life <= 0 || 
            Math.abs(bullet.mesh.position.x) > bounds.x || 
            Math.abs(bullet.mesh.position.y) > bounds.y) {
          scene.remove(bullet.mesh);
          return false;
        }
        return true;
      });

      // Spawn new asteroids periodically if too few
      if (asteroidsRef.current.length < 5 && Math.random() < 0.01) {
        spawnAsteroid();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-auto"
      style={{ touchAction: 'none' }}
    />
  );
};

export default AsteroidsGame;
