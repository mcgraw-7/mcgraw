'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Snowball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
}

interface Present {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  rotationSpeed: number;
  type: 'shield' | 'slowmo' | 'points';
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface PlayerConfig {
  name: string;
  color: string;
  imageUrl?: string;
}

interface SnowballSurvivalProps {
  player?: PlayerConfig;
  onGameOver?: (score: number) => void;
  onBack?: () => void;
}

const SnowballSurvival = ({ player, onGameOver, onBack }: SnowballSurvivalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const snowballsRef = useRef<Snowball[]>([]);
  const presentsRef = useRef<Present[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const difficultyRef = useRef(1);
  const shieldActiveRef = useRef(false);
  const slowmoActiveRef = useRef(false);
  const shieldTimerRef = useRef(0);
  const slowmoTimerRef = useRef(0);
  const gameOverRef = useRef(false);
  const playerPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [shieldActive, setShieldActive] = useState(false);
  const [slowmoActive, setSlowmoActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snowball-survival-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const createSnowflakeParticles = useCallback((scene: THREE.Scene) => {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = Math.random() * 20;
      positions[i + 2] = (Math.random() - 0.5) * 40;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    
    const snow = new THREE.Points(geometry, material);
    snow.name = 'snowfall';
    scene.add(snow);
    return snow;
  }, []);

  const createPlayer = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    // Body (snowman style)
    const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: player?.color ? parseInt(player.color.replace('#', '0x')) : 0x87CEEB,
      shininess: 100 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFE4C4, shininess: 50 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    group.add(head);
    
    // Santa hat
    const hatGeometry = new THREE.ConeGeometry(0.3, 0.5, 32);
    const hatMaterial = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 1.6;
    hat.rotation.z = 0.2;
    group.add(hat);
    
    // Hat pom-pom
    const pomGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pomMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const pom = new THREE.Mesh(pomGeometry, pomMaterial);
    pom.position.set(0.15, 1.85, 0);
    group.add(pom);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.25, 0.3);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.25, 0.3);
    group.add(rightEye);
    
    // Shield ring (hidden initially)
    const shieldGeometry = new THREE.TorusGeometry(0.8, 0.05, 16, 100);
    const shieldMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.5,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.rotation.x = Math.PI / 2;
    shield.position.y = 0.5;
    shield.visible = false;
    shield.name = 'shield';
    group.add(shield);
    
    group.position.y = 0;
    scene.add(group);
    return group;
  }, [player]);

  const createSnowball = useCallback((scene: THREE.Scene, difficulty: number) => {
    const geometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      shininess: 100,
      specular: 0x444444
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Spawn from edges
    const side = Math.floor(Math.random() * 4);
    const offset = (Math.random() - 0.5) * 16;
    
    switch (side) {
      case 0: mesh.position.set(offset, 0.3, -10); break;
      case 1: mesh.position.set(offset, 0.3, 10); break;
      case 2: mesh.position.set(-10, 0.3, offset); break;
      case 3: mesh.position.set(10, 0.3, offset); break;
    }
    
    // Aim towards player with some randomness
    const playerPos = playerPositionRef.current;
    const direction = new THREE.Vector3(
      playerPos.x - mesh.position.x + (Math.random() - 0.5) * 2,
      0,
      playerPos.z - mesh.position.z + (Math.random() - 0.5) * 2
    ).normalize();
    
    const speed = 0.08 + difficulty * 0.015;
    
    scene.add(mesh);
    
    return {
      mesh,
      velocity: direction.multiplyScalar(speed),
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      )
    };
  }, []);

  const createPresent = useCallback((scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    const types: ('shield' | 'slowmo' | 'points')[] = ['shield', 'slowmo', 'points'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const colors = {
      shield: 0x00ff00,
      slowmo: 0x00ffff,
      points: 0xffff00
    };
    
    // Box
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshPhongMaterial({ 
      color: colors[type],
      shininess: 100
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    group.add(box);
    
    // Ribbon
    const ribbonGeometry = new THREE.BoxGeometry(0.55, 0.1, 0.1);
    const ribbonMaterial = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
    const ribbon1 = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    group.add(ribbon1);
    const ribbon2 = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    ribbon2.rotation.y = Math.PI / 2;
    group.add(ribbon2);
    
    // Bow
    const bowGeometry = new THREE.TorusGeometry(0.1, 0.03, 8, 16, Math.PI);
    const bow1 = new THREE.Mesh(bowGeometry, ribbonMaterial);
    bow1.position.set(-0.1, 0.3, 0);
    bow1.rotation.z = Math.PI / 4;
    group.add(bow1);
    const bow2 = new THREE.Mesh(bowGeometry, ribbonMaterial);
    bow2.position.set(0.1, 0.3, 0);
    bow2.rotation.z = -Math.PI / 4;
    group.add(bow2);
    
    // Random spawn position
    group.position.set(
      (Math.random() - 0.5) * 14,
      0.5,
      (Math.random() - 0.5) * 14
    );
    
    scene.add(group);
    
    return {
      mesh: group,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: 0.02,
      type
    };
  }, []);

  const createExplosion = useCallback((scene: THREE.Scene, position: THREE.Vector3, color: number) => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      
      scene.add(mesh);
      particles.push({ mesh, velocity, life: 1 });
    }
    
    particlesRef.current.push(...particles);
  }, []);

  const handleHit = useCallback(() => {
    if (shieldActiveRef.current) {
      shieldActiveRef.current = false;
      setShieldActive(false);
      return;
    }
    
    gameOverRef.current = true;
    setGameOver(true);
    
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('snowball-survival-highscore', scoreRef.current.toString());
    }
    
    onGameOver?.(scoreRef.current);
  }, [highScore, onGameOver]);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    difficultyRef.current = 1;
    gameOverRef.current = false;
    shieldActiveRef.current = false;
    slowmoActiveRef.current = false;
    
    setScore(0);
    setGameOver(false);
    setShieldActive(false);
    setSlowmoActive(false);
    setShowInstructions(false);
    
    // Clear snowballs
    snowballsRef.current.forEach(s => sceneRef.current?.remove(s.mesh));
    snowballsRef.current = [];
    
    // Clear presents
    presentsRef.current.forEach(p => sceneRef.current?.remove(p.mesh));
    presentsRef.current = [];
    
    // Clear particles
    particlesRef.current.forEach(p => sceneRef.current?.remove(p.mesh));
    particlesRef.current = [];
    
    // Reset player position
    if (playerRef.current) {
      playerRef.current.position.set(0, 0, 0);
      playerPositionRef.current.set(0, 0, 0);
      targetPositionRef.current.set(0, 0, 0);
    }
  }, []);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 25);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 12, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground (snowy field)
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf0f8ff,
      shininess: 10
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    groundPlaneRef.current = ground;

    // Border walls (snow banks)
    const wallGeometry = new THREE.BoxGeometry(20, 1, 0.5);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xe8e8e8 });
    
    const walls = [
      { pos: [0, 0.5, -10], rot: 0 },
      { pos: [0, 0.5, 10], rot: 0 },
      { pos: [-10, 0.5, 0], rot: Math.PI / 2 },
      { pos: [10, 0.5, 0], rot: Math.PI / 2 }
    ];
    
    walls.forEach(({ pos, rot }) => {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.rotation.y = rot;
      scene.add(wall);
    });

    // Christmas trees scattered around
    const treePositions = [
      [-8, -8], [-8, 8], [8, -8], [8, 8],
      [-6, 0], [6, 0], [0, -7], [0, 7]
    ];
    
    treePositions.forEach(([x, z]) => {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8);
      const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.25;
      treeGroup.add(trunk);
      
      // Tree layers
      const layers = [
        { y: 0.8, radius: 0.6, height: 0.8 },
        { y: 1.4, radius: 0.45, height: 0.6 },
        { y: 1.85, radius: 0.3, height: 0.5 }
      ];
      
      layers.forEach(({ y, radius, height }) => {
        const coneGeometry = new THREE.ConeGeometry(radius, height, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.y = y;
        treeGroup.add(cone);
      });
      
      // Star on top
      const starGeometry = new THREE.OctahedronGeometry(0.1);
      const starMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.y = 2.2;
      treeGroup.add(star);
      
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    });

    // Snowfall
    createSnowflakeParticles(scene);

    // Player
    playerRef.current = createPlayer(scene);

    // Input handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      if (gameOverRef.current || showInstructions) return;
      
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (groundPlaneRef.current) {
        const intersects = raycaster.intersectObject(groundPlaneRef.current);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          // Clamp to play area
          targetPositionRef.current.set(
            Math.max(-9, Math.min(9, point.x)),
            0,
            Math.max(-9, Math.min(9, point.z))
          );
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameOverRef.current || showInstructions) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (groundPlaneRef.current) {
        const intersects = raycaster.intersectObject(groundPlaneRef.current);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          targetPositionRef.current.set(
            Math.max(-9, Math.min(9, point.x)),
            0,
            Math.max(-9, Math.min(9, point.z))
          );
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Game loop
    let lastSnowballTime = 0;
    let lastPresentTime = 0;
    
    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (showInstructions || gameOverRef.current) {
        renderer.render(scene, camera);
        return;
      }

      const timeScale = slowmoActiveRef.current ? 0.3 : 1;

      // Move player towards target
      if (playerRef.current) {
        const player = playerRef.current;
        const target = targetPositionRef.current;
        const current = playerPositionRef.current;
        
        current.lerp(target, 0.1);
        player.position.copy(current);
        
        // Face direction of movement
        const direction = target.clone().sub(current);
        if (direction.length() > 0.01) {
          player.rotation.y = Math.atan2(direction.x, direction.z);
        }
        
        // Update shield visibility
        const shield = player.getObjectByName('shield');
        if (shield) {
          shield.visible = shieldActiveRef.current;
          if (shieldActiveRef.current) {
            shield.rotation.z += 0.05;
          }
        }
      }

      // Spawn snowballs
      if (time - lastSnowballTime > (2000 - difficultyRef.current * 100) / timeScale) {
        const count = Math.min(3, Math.floor(difficultyRef.current / 3) + 1);
        for (let i = 0; i < count; i++) {
          snowballsRef.current.push(createSnowball(scene, difficultyRef.current));
        }
        lastSnowballTime = time;
      }

      // Spawn presents
      if (time - lastPresentTime > 8000 && presentsRef.current.length < 3) {
        presentsRef.current.push(createPresent(scene));
        lastPresentTime = time;
      }

      // Update snowballs
      const playerPos = playerPositionRef.current;
      
      snowballsRef.current = snowballsRef.current.filter(snowball => {
        snowball.mesh.position.add(snowball.velocity.clone().multiplyScalar(timeScale));
        snowball.mesh.rotation.x += snowball.rotationSpeed.x * timeScale;
        snowball.mesh.rotation.y += snowball.rotationSpeed.y * timeScale;
        snowball.mesh.rotation.z += snowball.rotationSpeed.z * timeScale;
        
        // Check collision with player
        const dist = snowball.mesh.position.distanceTo(new THREE.Vector3(playerPos.x, 0.5, playerPos.z));
        if (dist < 0.8) {
          createExplosion(scene, snowball.mesh.position, 0xffffff);
          scene.remove(snowball.mesh);
          handleHit();
          return false;
        }
        
        // Remove if out of bounds
        if (Math.abs(snowball.mesh.position.x) > 12 || Math.abs(snowball.mesh.position.z) > 12) {
          scene.remove(snowball.mesh);
          return false;
        }
        
        return true;
      });

      // Update presents
      presentsRef.current = presentsRef.current.filter(present => {
        present.mesh.rotation.y += present.rotationSpeed;
        present.mesh.position.y = 0.5 + Math.sin(time * 0.003) * 0.1;
        
        // Check collision with player
        const dist = present.mesh.position.distanceTo(new THREE.Vector3(playerPos.x, 0.5, playerPos.z));
        if (dist < 1) {
          createExplosion(scene, present.mesh.position, 
            present.type === 'shield' ? 0x00ff00 : 
            present.type === 'slowmo' ? 0x00ffff : 0xffff00
          );
          scene.remove(present.mesh);
          
          // Apply powerup
          switch (present.type) {
            case 'shield':
              shieldActiveRef.current = true;
              setShieldActive(true);
              shieldTimerRef.current = time + 10000;
              break;
            case 'slowmo':
              slowmoActiveRef.current = true;
              setSlowmoActive(true);
              slowmoTimerRef.current = time + 5000;
              break;
            case 'points':
              scoreRef.current += 500;
              setScore(scoreRef.current);
              break;
          }
          
          return false;
        }
        
        return true;
      });

      // Update powerup timers
      if (shieldActiveRef.current && time > shieldTimerRef.current) {
        shieldActiveRef.current = false;
        setShieldActive(false);
      }
      if (slowmoActiveRef.current && time > slowmoTimerRef.current) {
        slowmoActiveRef.current = false;
        setSlowmoActive(false);
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.01;
        particle.life -= 0.02;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life;
        
        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          return false;
        }
        return true;
      });

      // Update snowfall
      const snowfall = scene.getObjectByName('snowfall') as THREE.Points;
      if (snowfall) {
        const positions = snowfall.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.02 * timeScale;
          if (positions[i] < 0) positions[i] = 20;
        }
        snowfall.geometry.attributes.position.needsUpdate = true;
      }

      // Update score & difficulty
      scoreRef.current += 1;
      setScore(scoreRef.current);
      
      if (scoreRef.current % 1000 === 0) {
        difficultyRef.current += 0.5;
      }

      renderer.render(scene, camera);
    };

    animate(0);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [createSnowflakeParticles, createPlayer, createSnowball, createPresent, createExplosion, handleHit, showInstructions]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
          <button 
            onClick={onBack}
            className="text-white hover:text-red-400 transition-colors mb-2 text-sm"
          >
            ← Back
          </button>
          <div className="text-white font-mono">
            <div className="text-2xl font-bold text-green-400">{score.toLocaleString()}</div>
            <div className="text-xs text-gray-400">HIGH: {highScore.toLocaleString()}</div>
          </div>
        </div>
        
        {/* Powerup indicators */}
        <div className="flex gap-2">
          {shieldActive && (
            <div className="bg-green-500/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-mono">
              🛡️ SHIELD
            </div>
          )}
          {slowmoActive && (
            <div className="bg-cyan-500/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-mono">
              ⏱️ SLOW-MO
            </div>
          )}
        </div>
      </div>

      {/* Instructions overlay */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-8 max-w-md text-center">
            <h2 className="text-3xl font-bold text-white mb-4">❄️ Snowball Survival ❄️</h2>
            <p className="text-gray-300 mb-4">
              {player?.name ? `${player.name}, dodge` : 'Dodge'} the incoming snowballs!
            </p>
            <div className="text-left text-gray-400 text-sm mb-6 space-y-2">
              <p>🖱️ <span className="text-white">Move mouse/finger</span> to control your character</p>
              <p>🎁 <span className="text-green-400">Green present</span> = Shield (blocks 1 hit)</p>
              <p>🎁 <span className="text-cyan-400">Cyan present</span> = Slow motion</p>
              <p>🎁 <span className="text-yellow-400">Yellow present</span> = Bonus points</p>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              START GAME
            </button>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-8 max-w-md text-center">
            <h2 className="text-3xl font-bold text-red-500 mb-4">💥 GAME OVER 💥</h2>
            <div className="text-white text-2xl mb-2">{score.toLocaleString()} points</div>
            {score >= highScore && score > 0 && (
              <div className="text-yellow-400 text-sm mb-4">🏆 NEW HIGH SCORE!</div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                BACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnowballSurvival;
