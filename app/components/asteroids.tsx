'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
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

interface Powerup {
  mesh: THREE.Mesh;
  velocity: THREE.Vector2;
  rotationSpeed: number;
  type: 'autofire' | 'burst360';
}

interface AsteroidsGameProps {
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  isPlaying?: boolean; // When false, disables collision detection (terminal is open)
}

const AsteroidsGame = ({ onScoreChange, onGameOver, isPlaying = false }: AsteroidsGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shipRef = useRef<THREE.LineLoop | null>(null);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const shipVelocityRef = useRef(new THREE.Vector2(0, 0));
  const shipRotationRef = useRef(0);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const isDeadRef = useRef(false);
  const invincibleRef = useRef(false);
  const invincibleTimerRef = useRef(0);
  const livesRef = useRef(3);
  const isPlayingRef = useRef(isPlaying);
  const autofireRef = useRef(false);
  const autofireTimerRef = useRef(0);
  const powerupActiveRef = useRef(false);
  const burst360ActiveRef = useRef(false);
  const burst360TimerRef = useRef(0);
  const asteroidSpeedMultiplierRef = useRef(1);
  const bulletSizeMultiplierRef = useRef(1);
  
  // Keep isPlayingRef in sync with prop
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [powerupActive, setPowerupActive] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent default touch behaviors on mobile (only when playing)
  useEffect(() => {
    if (!isMobile || !isPlaying) return;
    
    const preventDefaults = (e: TouchEvent) => {
      // Allow touches on scrollable elements, links, and non-game buttons
      const target = e.target as HTMLElement;
      // Allow scrolling in terminal, any scrollable container, links, and regular buttons
      if (
        target.closest('[data-scrollable]') ||
        target.closest('.overflow-y-auto') ||
        target.closest('.overflow-auto') ||
        target.closest('.overflow-scroll') ||
        target.closest('a') ||
        target.closest('button:not([data-game-control])')
      ) {
        return;
      }
      e.preventDefault();
    };
    
    // Prevent pull-to-refresh and other gestures
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    document.addEventListener('touchmove', preventDefaults, { passive: false });
    
    return () => {
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
      document.removeEventListener('touchmove', preventDefaults);
    };
  }, [isMobile, isPlaying]);

  // Touch control handlers
  const handleTouchControl = useCallback((action: string, isPressed: boolean) => {
    setShowInstructions(false);
    if (isPressed) {
      keysRef.current.add(action);
    } else {
      keysRef.current.delete(action);
    }
  }, []);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('asteroids-highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Save high score when it changes
  const updateHighScore = useCallback((newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('asteroids-highscore', newScore.toString());
    }
  }, [highScore]);

  // Reset game
  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    livesRef.current = 3;
    setLives(3);
    isDeadRef.current = false;
    setGameOver(false);
    invincibleRef.current = true;
    invincibleTimerRef.current = 180; // 3 seconds of invincibility on start
    
    // Reset powerup state
    powerupActiveRef.current = false;
    autofireRef.current = false;
    autofireTimerRef.current = 0;
    burst360ActiveRef.current = false;
    burst360TimerRef.current = 0;
    setPowerupActive(false);
    
    // Reset asteroid speed multiplier
    asteroidSpeedMultiplierRef.current = 1;
    
    // Reset bullet size multiplier
    bulletSizeMultiplierRef.current = 1;
    
    // Reset ship position
    if (shipRef.current && cameraRef.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / height;
      const frustumSize = 100;
      
      const terminalWidth = Math.min(896, width - 64);
      const terminalLeft = (width - terminalWidth) / 2;
      const terminalRightEdge = ((terminalLeft + terminalWidth) / width) * 2 - 1;
      const terminalRightWorld = terminalRightEdge * (frustumSize * aspect / 2);
      const rightEdge = frustumSize * aspect / 2;
      
      shipRef.current.position.set(
        terminalRightWorld + (rightEdge - terminalRightWorld) / 2,
        0,
        0
      );
      shipRef.current.visible = true;
      shipVelocityRef.current.set(0, 0);
      
      // Reset ship color to green
      if (shipRef.current.material && 'color' in shipRef.current.material) {
        (shipRef.current.material as THREE.LineBasicMaterial).color.setHex(0x39FF14);
      }
    }
  }, []);

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
    
    // Position ship to point at the red dot in terminal header
    const terminalWidth = Math.min(896, width - 64);
    const terminalLeft = (width - terminalWidth) / 2;
    const redDotScreenX = terminalLeft + 16 + 6;
    const redDotScreenY = 32 + 12 + 6;
    
    const ndcX = (redDotScreenX / width) * 2 - 1;
    const ndcY = -(redDotScreenY / height) * 2 + 1;
    
    const redDotWorldX = ndcX * (frustumSize * aspect / 2);
    const redDotWorldY = ndcY * (frustumSize / 2);
    
    const terminalRightEdge = ((terminalLeft + terminalWidth) / width) * 2 - 1;
    const terminalRightWorld = terminalRightEdge * (frustumSize * aspect / 2);
    
    const rightEdge = frustumSize * aspect / 2;
    const shipStartX = terminalRightWorld + (rightEdge - terminalRightWorld) / 2;
    const shipStartY = redDotWorldY;
    
    const angleToRedDot = Math.atan2(redDotWorldY - shipStartY, redDotWorldX - shipStartX);
    
    ship.position.set(shipStartX, shipStartY, 0);
    ship.rotation.z = angleToRedDot;
    shipRotationRef.current = angleToRedDot;
    
    scene.add(ship);
    shipRef.current = ship;

    // Start with invincibility (3 seconds at 60fps)
    invincibleRef.current = true;
    invincibleTimerRef.current = 180;

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
        color: 0xFF6600,
        opacity: 0.7,
        transparent: true
      });
      const asteroid = new THREE.LineLoop(geometry, material);
      
      if (x === undefined || y === undefined) {
        const edge = Math.floor(Math.random() * 4);
        const bounds = frustumSize * aspect / 2;
        switch (edge) {
          case 0:
            x = (Math.random() - 0.5) * bounds * 2;
            y = frustumSize / 2 + asteroidSize;
            break;
          case 1:
            x = bounds + asteroidSize;
            y = (Math.random() - 0.5) * frustumSize;
            break;
          case 2:
            x = (Math.random() - 0.5) * bounds * 2;
            y = -frustumSize / 2 - asteroidSize;
            break;
          default:
            x = -bounds - asteroidSize;
            y = (Math.random() - 0.5) * frustumSize;
        }
      }
      
      asteroid.position.set(x, y, 0);
      scene.add(asteroid);
      
      // Base speed increases by 20% for every 1000 points
      const baseSpeed = 0.15;
      const speed = baseSpeed * asteroidSpeedMultiplierRef.current;
      
      asteroidsRef.current.push({
        mesh: asteroid,
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * speed,
          (Math.random() - 0.5) * speed
        ),
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        size: asteroidSize
      });
    };

    // Spawn powerup (cyan diamond that gives autofire + invincibility)
    const spawnPowerup = () => {
      // Create diamond shape
      const size = 3;
      const shape = new THREE.Shape();
      shape.moveTo(0, size);
      shape.lineTo(size * 0.7, 0);
      shape.lineTo(0, -size);
      shape.lineTo(-size * 0.7, 0);
      shape.lineTo(0, size);
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00FFFF, // Cyan
        transparent: true,
        opacity: 0.9
      });
      const powerup = new THREE.Mesh(geometry, material);
      
      // Spawn at random edge
      const edge = Math.floor(Math.random() * 4);
      const bounds = frustumSize * aspect / 2;
      let x = 0, y = 0;
      switch (edge) {
        case 0:
          x = (Math.random() - 0.5) * bounds * 2;
          y = frustumSize / 2 + size;
          break;
        case 1:
          x = bounds + size;
          y = (Math.random() - 0.5) * frustumSize;
          break;
        case 2:
          x = (Math.random() - 0.5) * bounds * 2;
          y = -frustumSize / 2 - size;
          break;
        default:
          x = -bounds - size;
          y = (Math.random() - 0.5) * frustumSize;
      }
      
      powerup.position.set(x, y, 0);
      scene.add(powerup);
      
      powerupsRef.current.push({
        mesh: powerup,
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        rotationSpeed: 0.03,
        type: 'autofire'
      });
    };

    // Spawn 360-burst powerup (magenta star that shoots in all directions)
    const spawn360BurstPowerup = () => {
      // Create star shape
      const size = 3;
      const shape = new THREE.Shape();
      const points = 6; // 6-pointed star
      const outerRadius = size;
      const innerRadius = size * 0.4;
      
      for (let i = 0; i <= points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) {
          shape.moveTo(px, py);
        } else {
          shape.lineTo(px, py);
        }
      }
      
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xFF00FF, // Magenta
        transparent: true,
        opacity: 0.9
      });
      const powerup = new THREE.Mesh(geometry, material);
      
      // Spawn at random edge
      const edge = Math.floor(Math.random() * 4);
      const bounds = frustumSize * aspect / 2;
      let x = 0, y = 0;
      switch (edge) {
        case 0:
          x = (Math.random() - 0.5) * bounds * 2;
          y = frustumSize / 2 + size;
          break;
        case 1:
          x = bounds + size;
          y = (Math.random() - 0.5) * frustumSize;
          break;
        case 2:
          x = (Math.random() - 0.5) * bounds * 2;
          y = -frustumSize / 2 - size;
          break;
        default:
          x = -bounds - size;
          y = (Math.random() - 0.5) * frustumSize;
      }
      
      powerup.position.set(x, y, 0);
      scene.add(powerup);
      
      powerupsRef.current.push({
        mesh: powerup,
        velocity: new THREE.Vector2(
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.15
        ),
        rotationSpeed: 0.05,
        type: 'burst360'
      });
    };

    // Initial asteroids
    for (let i = 0; i < 6; i++) {
      spawnAsteroid();
    }

    // Fire bullet function (used by both keyboard and touch)
    const fireBullet = () => {
      if (isDeadRef.current) return;
      if (shipRef.current && bulletsRef.current.length < 5) {
        // Calculate bullet size based on score milestones
        const baseSize = 0.5;
        const size = baseSize * bulletSizeMultiplierRef.current;
        const segments = 16;
        
        // Transition from filled circle to hollow ring as size increases
        // At 1x size: fully filled, at 2x+ size: hollow ring
        const hollowness = Math.min(1, (bulletSizeMultiplierRef.current - 1) / 1); // 0 to 1
        const innerRadius = size * hollowness * 0.6; // Inner hole grows with size
        
        let bulletGeometry: THREE.BufferGeometry;
        if (innerRadius > 0.1) {
          // Create ring geometry (hollow disc)
          bulletGeometry = new THREE.RingGeometry(innerRadius, size, segments);
        } else {
          // Create filled circle
          bulletGeometry = new THREE.CircleGeometry(size, segments);
        }
        
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x39FF14,
          transparent: true,
          opacity: 0.9
        });
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
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      
      // Hide instructions on first input
      setShowInstructions(false);
      
      if (e.key === ' ') {
        e.preventDefault();
        fireBullet();
      }
      
      // Restart on R key when game over
      if (e.key.toLowerCase() === 'r' && isDeadRef.current) {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    // Touch fire handler (for mobile button)
    const handleTouchFire = (e: Event) => {
      e.preventDefault();
      setShowInstructions(false);
      fireBullet();
    };

    // Add touch fire listener to window for mobile
    window.addEventListener('touchfire' as keyof WindowEventMap, handleTouchFire as EventListener);

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

    // Autofire frame counter
    let autofireCounter = 0;
    let burst360Counter = 0;
    let autopilotFireCounter = 0;

    // Fire bullet in a specific direction (used by 360-burst)
    const fireBulletAtAngle = (angle: number) => {
      if (isDeadRef.current || !shipRef.current) return;
      
      // Calculate bullet size based on score milestones (slightly smaller for burst)
      const baseSize = 0.4;
      const size = baseSize * bulletSizeMultiplierRef.current;
      const segments = 16;
      
      // Transition from filled circle to hollow ring as size increases
      const hollowness = Math.min(1, (bulletSizeMultiplierRef.current - 1) / 1);
      const innerRadius = size * hollowness * 0.6;
      
      let bulletGeometry: THREE.BufferGeometry;
      if (innerRadius > 0.08) {
        bulletGeometry = new THREE.RingGeometry(innerRadius, size, segments);
      } else {
        bulletGeometry = new THREE.CircleGeometry(size, segments);
      }
      
      const bulletMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF00FF, // Magenta bullets
        transparent: true,
        opacity: 0.9
      });
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
      
      bullet.position.copy(shipRef.current.position);
      bullet.position.x += Math.cos(angle) * 3;
      bullet.position.y += Math.sin(angle) * 3;
      
      scene.add(bullet);
      bulletsRef.current.push({
        mesh: bullet,
        velocity: new THREE.Vector2(
          Math.cos(angle) * 1.2,
          Math.sin(angle) * 1.2
        ),
        life: 45 // Slightly shorter life for 360 bullets
      });
    };

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const ship = shipRef.current;
      const camera = cameraRef.current;
      if (!ship || !camera) return;

      // Handle invincibility timer (but not powerup invincibility which is tracked separately)
      if (invincibleRef.current && !powerupActiveRef.current) {
        invincibleTimerRef.current--;
        // Blink ship during invincibility
        ship.visible = Math.floor(invincibleTimerRef.current / 5) % 2 === 0;
        if (invincibleTimerRef.current <= 0) {
          invincibleRef.current = false;
          ship.visible = true;
        }
      }

      // Handle powerup timer (autofire + invincibility)
      if (powerupActiveRef.current) {
        autofireTimerRef.current--;
        // Rainbow blink effect during powerup
        const hue = (autofireTimerRef.current * 5) % 360;
        if (ship.material && 'color' in ship.material) {
          (ship.material as THREE.LineBasicMaterial).color.setHSL(hue / 360, 1, 0.5);
        }
        ship.visible = true; // Always visible during powerup
        
        if (autofireTimerRef.current <= 0) {
          powerupActiveRef.current = false;
          autofireRef.current = false;
          // Only disable invincibility if burst360 is also not active
          if (!burst360ActiveRef.current) {
            invincibleRef.current = false;
          }
          setPowerupActive(false);
          // Reset ship color to green (only if burst360 not active)
          if (!burst360ActiveRef.current && ship.material && 'color' in ship.material) {
            (ship.material as THREE.LineBasicMaterial).color.setHex(0x39FF14);
          }
        }
      }

      // Handle 360-burst powerup timer
      if (burst360ActiveRef.current) {
        burst360TimerRef.current--;
        // Magenta pulsing effect during 360-burst
        const pulse = 0.5 + Math.sin(burst360TimerRef.current * 0.2) * 0.5;
        if (!powerupActiveRef.current && ship.material && 'color' in ship.material) {
          (ship.material as THREE.LineBasicMaterial).color.setHSL(0.833, 1, pulse * 0.5 + 0.25); // Magenta hue
        }
        ship.visible = true;
        
        if (burst360TimerRef.current <= 0) {
          burst360ActiveRef.current = false;
          // Only disable invincibility if autofire powerup is also not active
          if (!powerupActiveRef.current) {
            invincibleRef.current = false;
          }
          // Reset ship color to green (only if autofire not active)
          if (!powerupActiveRef.current && ship.material && 'color' in ship.material) {
            (ship.material as THREE.LineBasicMaterial).color.setHex(0x39FF14);
          }
        }
      }

      // Autofire during powerup
      if (autofireRef.current && !isDeadRef.current) {
        autofireCounter++;
        if (autofireCounter >= 8) { // Fire every 8 frames (~7.5 shots/sec)
          autofireCounter = 0;
          fireBullet();
        }
      }

      // 360-burst firing during burst powerup
      if (burst360ActiveRef.current && !isDeadRef.current) {
        burst360Counter++;
        if (burst360Counter >= 15) { // Fire every 15 frames (~4 bursts/sec)
          burst360Counter = 0;
          // Fire 12 bullets in all directions (every 30 degrees)
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            fireBulletAtAngle(angle);
          }
        }
      }

      // Skip controls if dead
      if (!isDeadRef.current) {
        // AUTOPILOT MODE: When terminal is open (isPlaying is false) - SLOW & GRACEFUL
        if (!isPlayingRef.current && asteroidsRef.current.length > 0) {
          const autopilotRotationSpeed = 0.015;  // Reduced from 0.04 - slower turning
          const autopilotThrust = 0.004;         // Reduced from 0.012 - gentler acceleration
          const autopilotFriction = 0.992;       // More friction for smoother movement
          const autopilotMaxSpeed = 0.25;        // Reduced from 0.6 - slower cruising
          
          // Find nearest asteroid
          let nearestAsteroid: Asteroid | null = null;
          let nearestDist = Infinity;
          let nearestThreat: Asteroid | null = null;
          let nearestThreatDist = Infinity;
          
          for (const asteroid of asteroidsRef.current) {
            if (!asteroid || !asteroid.mesh) continue;
            const dist = ship.position.distanceTo(asteroid.mesh.position);
            
            // Track nearest asteroid for targeting
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestAsteroid = asteroid;
            }
            
            // Track nearest threat (asteroid within danger zone)
            if (dist < 20 && dist < nearestThreatDist) {
              nearestThreatDist = dist;
              nearestThreat = asteroid;
            }
          }
          
          // Calculate target angle
          let targetAngle = shipRotationRef.current;
          
          if (nearestThreat) {
            // EVASION: If an asteroid is too close, turn away from it
            const threatAngle = Math.atan2(
              nearestThreat.mesh.position.y - ship.position.y,
              nearestThreat.mesh.position.x - ship.position.x
            );
            // Turn perpendicular to the threat (90 degrees away)
            targetAngle = threatAngle + Math.PI / 2;
            
            // Apply thrust to escape
            shipVelocityRef.current.x += Math.cos(targetAngle) * autopilotThrust * 1.5;
            shipVelocityRef.current.y += Math.sin(targetAngle) * autopilotThrust * 1.5;
          } else if (nearestAsteroid) {
            // TARGETING: Aim at the nearest asteroid
            targetAngle = Math.atan2(
              nearestAsteroid.mesh.position.y - ship.position.y,
              nearestAsteroid.mesh.position.x - ship.position.x
            );
            
            // Gentle thrust towards target
            if (nearestDist > 30) {
              shipVelocityRef.current.x += Math.cos(targetAngle) * autopilotThrust * 0.5;
              shipVelocityRef.current.y += Math.sin(targetAngle) * autopilotThrust * 0.5;
            }
          }
          
          // Smoothly rotate towards target angle
          let angleDiff = targetAngle - shipRotationRef.current;
          // Normalize angle difference to -PI to PI
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          if (Math.abs(angleDiff) > 0.05) {
            shipRotationRef.current += Math.sign(angleDiff) * autopilotRotationSpeed;
          }
          
          // Apply speed limit and friction
          const speed = shipVelocityRef.current.length();
          if (speed > autopilotMaxSpeed) {
            shipVelocityRef.current.multiplyScalar(autopilotMaxSpeed / speed);
          }
          shipVelocityRef.current.multiplyScalar(autopilotFriction);
          
          // Update ship position and rotation
          ship.position.x += shipVelocityRef.current.x;
          ship.position.y += shipVelocityRef.current.y;
          ship.rotation.z = shipRotationRef.current;
          
          // Screen wrapping
          const bounds = {
            x: (camera.right || 50) + 5,
            y: (camera.top || 50) + 5
          };
          if (ship.position.x > bounds.x) ship.position.x = -bounds.x;
          if (ship.position.x < -bounds.x) ship.position.x = bounds.x;
          if (ship.position.y > bounds.y) ship.position.y = -bounds.y;
          if (ship.position.y < -bounds.y) ship.position.y = bounds.y;
          
          // Auto-fire when aimed at asteroid (within 15 degrees)
          if (nearestAsteroid && Math.abs(angleDiff) < 0.26) {
            autopilotFireCounter++;
            if (autopilotFireCounter >= 30) { // Fire every 30 frames (~2 shots/sec) - slower & deliberate
              autopilotFireCounter = 0;
              fireBullet();
            }
          }
        } else {
          // MANUAL CONTROL MODE: When game is active (isPlaying is true)
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

          const speed = shipVelocityRef.current.length();
          if (speed > maxSpeed) {
            shipVelocityRef.current.multiplyScalar(maxSpeed / speed);
          }

          shipVelocityRef.current.multiplyScalar(friction);

          ship.position.x += shipVelocityRef.current.x;
          ship.position.y += shipVelocityRef.current.y;
          ship.rotation.z = shipRotationRef.current;

          const bounds = {
            x: (camera.right || 50) + 5,
            y: (camera.top || 50) + 5
          };

          if (ship.position.x > bounds.x) ship.position.x = -bounds.x;
          if (ship.position.x < -bounds.x) ship.position.x = bounds.x;
          if (ship.position.y > bounds.y) ship.position.y = -bounds.y;
          if (ship.position.y < -bounds.y) ship.position.y = bounds.y;

          // Check ship collision with asteroids (only if playing and not invincible)
          if (isPlayingRef.current && !invincibleRef.current) {
            for (const asteroid of asteroidsRef.current) {
              // Safety check: ensure asteroid has valid mesh and position
              if (!asteroid || !asteroid.mesh || !asteroid.mesh.position) continue;
              
              const dist = ship.position.distanceTo(asteroid.mesh.position);
              // Reduced ship collision radius for more forgiving hit detection
              // Ship visual is ~4 units, but we use 1 for the hitbox (center only)
              const shipRadius = 1;
              // Also reduce asteroid hitbox to 50% of visual size for more forgiving detection
              const asteroidHitbox = asteroid.size * 0.5;
              
              // Only count as collision if distance is really small
              if (dist < asteroidHitbox + shipRadius) {
                // Ship hit!
                livesRef.current--;
                setLives(livesRef.current);
                
                if (livesRef.current <= 0) {
                  // Game over
                  isDeadRef.current = true;
                  setGameOver(true);
                  ship.visible = false;
                  updateHighScore(scoreRef.current);
                  onGameOver?.();
                } else {
                  // Respawn with 3 seconds of invincibility (180 frames at 60fps)
                  invincibleRef.current = true;
                  invincibleTimerRef.current = 180;
                  ship.position.set(shipStartX, shipStartY, 0);
                  shipVelocityRef.current.set(0, 0);
                }
                break;
              }
            }
          }

          // Check ship collision with powerups (only if playing)
          if (isPlayingRef.current) {
            for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
              const powerup = powerupsRef.current[i];
              if (!powerup || !powerup.mesh || !powerup.mesh.position) continue;
              
              const dist = ship.position.distanceTo(powerup.mesh.position);
              if (dist < 5) { // Generous pickup radius
                // Collected powerup!
                scene.remove(powerup.mesh);
                const powerupType = powerup.type;
                powerupsRef.current.splice(i, 1);
                
                if (powerupType === 'autofire') {
                  // Activate autofire powerup: 30 seconds of autofire + invincibility
                  powerupActiveRef.current = true;
                  autofireRef.current = true;
                  invincibleRef.current = true;
                  autofireTimerRef.current = 1800; // 30 seconds at 60fps
                  setPowerupActive(true);
                  
                  // Bonus points
                  scoreRef.current += 500;
                } else if (powerupType === 'burst360') {
                  // Activate 360-burst powerup: 30 seconds of 360-degree firing + invincibility
                  burst360ActiveRef.current = true;
                  invincibleRef.current = true;
                  burst360TimerRef.current = 1800; // 30 seconds at 60fps
                  
                  // Bonus points (more valuable since rarer)
                  scoreRef.current += 1000;
                }
                
                setScore(scoreRef.current);
                onScoreChange?.(scoreRef.current);
                
                // Update asteroid speed multiplier
                asteroidSpeedMultiplierRef.current = 1 + Math.floor(scoreRef.current / 1000) * 0.2;
                // Update bullet size multiplier (25% larger per 1000 points)
                bulletSizeMultiplierRef.current = 1 + Math.floor(scoreRef.current / 1000) * 0.25;
              }
            }
          }
        }
      }

      // Update asteroids
      const bounds = {
        x: (camera.right || 50) + 5,
        y: (camera.top || 50) + 5
      };
      
      asteroidsRef.current.forEach((asteroid) => {
        asteroid.mesh.position.x += asteroid.velocity.x;
        asteroid.mesh.position.y += asteroid.velocity.y;
        asteroid.mesh.rotation.z += asteroid.rotationSpeed;

        const asteroidBounds = bounds.x + asteroid.size;
        if (asteroid.mesh.position.x > asteroidBounds) asteroid.mesh.position.x = -asteroidBounds;
        if (asteroid.mesh.position.x < -asteroidBounds) asteroid.mesh.position.x = asteroidBounds;
        if (asteroid.mesh.position.y > bounds.y + asteroid.size) asteroid.mesh.position.y = -(bounds.y + asteroid.size);
        if (asteroid.mesh.position.y < -(bounds.y + asteroid.size)) asteroid.mesh.position.y = bounds.y + asteroid.size;
      });

      // Update powerups
      powerupsRef.current.forEach((powerup) => {
        powerup.mesh.position.x += powerup.velocity.x;
        powerup.mesh.position.y += powerup.velocity.y;
        powerup.mesh.rotation.z += powerup.rotationSpeed;

        // Wrap around screen
        if (powerup.mesh.position.x > bounds.x + 5) powerup.mesh.position.x = -(bounds.x + 5);
        if (powerup.mesh.position.x < -(bounds.x + 5)) powerup.mesh.position.x = bounds.x + 5;
        if (powerup.mesh.position.y > bounds.y + 5) powerup.mesh.position.y = -(bounds.y + 5);
        if (powerup.mesh.position.y < -(bounds.y + 5)) powerup.mesh.position.y = bounds.y + 5;
      });

      // Update bullets
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.mesh.position.x += bullet.velocity.x;
        bullet.mesh.position.y += bullet.velocity.y;
        bullet.life--;

        for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
          const asteroid = asteroidsRef.current[i];
          const dist = bullet.mesh.position.distanceTo(asteroid.mesh.position);
          
          if (dist < asteroid.size) {
            scene.remove(asteroid.mesh);
            asteroidsRef.current.splice(i, 1);
            
            // Add score based on asteroid size
            const points = asteroid.size > 4 ? 20 : asteroid.size > 2 ? 50 : 100;
            scoreRef.current += points;
            setScore(scoreRef.current);
            onScoreChange?.(scoreRef.current);
            
            // Increase asteroid speed by 20% for every 1000 points
            asteroidSpeedMultiplierRef.current = 1 + Math.floor(scoreRef.current / 1000) * 0.2;
            // Increase bullet size by 25% for every 1000 points
            bulletSizeMultiplierRef.current = 1 + Math.floor(scoreRef.current / 1000) * 0.25;
            
            // Give brief invincibility when destroying asteroid (30 frames = 0.5 seconds)
            // This prevents immediate death from child asteroids spawning on the ship
            if (!invincibleRef.current) {
              invincibleRef.current = true;
              invincibleTimerRef.current = 30;
            }
            
            if (asteroid.size > 2) {
              for (let j = 0; j < 2; j++) {
                const newSize = asteroid.size * 0.5;
                // Spawn children further away from parent position
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = asteroid.size + newSize + 3; // Push children away
                const offsetX = Math.cos(angle) * spawnDist;
                const offsetY = Math.sin(angle) * spawnDist;
                spawnAsteroid(
                  asteroid.mesh.position.x + offsetX,
                  asteroid.mesh.position.y + offsetY,
                  newSize
                );
              }
            }
            
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

      // Spawn new asteroids when count is low
      if (asteroidsRef.current.length < 5 && Math.random() < 0.012) {
        spawnAsteroid();
      }

      // Rare chance to spawn a powerup (only if none exist and not already powered up)
      if (powerupsRef.current.length === 0 && !powerupActiveRef.current && !burst360ActiveRef.current) {
        const rand = Math.random();
        if (rand < 0.001) {
          // Cyan autofire powerup (0.1% chance per frame)
          spawnPowerup();
        } else if (rand < 0.00125) {
          // Magenta 360-burst powerup (0.025% chance per frame - 4x rarer than autofire)
          spawn360BurstPowerup();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchfire' as keyof WindowEventMap, handleTouchFire as EventListener);
      cancelAnimationFrame(frameRef.current);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      rendererRef.current?.dispose();
    };
  }, [onScoreChange, onGameOver, resetGame, updateHighScore]);

  // Fire bullet via custom event (for mobile)
  const handleFireTouch = useCallback(() => {
    setShowInstructions(false);
    window.dispatchEvent(new CustomEvent('touchfire'));
  }, []);

  return (
    <>
      <div 
        ref={containerRef} 
        className={`fixed inset-0 z-0 ${isPlaying ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ 
          touchAction: isPlaying ? 'none' : 'auto',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        onTouchStart={isPlaying ? (e) => e.preventDefault() : undefined}
        onTouchMove={isPlaying ? (e) => e.preventDefault() : undefined}
      />
      
      {/* Arcade-style HUD - only show when playing */}
      {isPlaying && (
      <div className="fixed top-4 right-4 z-20 font-mono text-right pointer-events-none">
        {/* Score display - arcade cabinet style */}
        <div className="mb-2">
          <div className="text-[10px] text-gray-500 tracking-widest">SCORE</div>
          <div 
            className="text-2xl text-neonGreen tracking-wider"
            style={{ 
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              textShadow: '0 0 10px rgba(57, 255, 20, 0.8), 0 0 20px rgba(57, 255, 20, 0.4)'
            }}
          >
            {score.toString().padStart(6, '0')}
          </div>
        </div>
        
        {/* High score */}
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 tracking-widest">HI-SCORE</div>
          <div 
            className="text-lg text-orange-500 tracking-wider"
            style={{ 
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              textShadow: '0 0 10px rgba(249, 115, 22, 0.8), 0 0 20px rgba(249, 115, 22, 0.4)'
            }}
          >
            {highScore.toString().padStart(6, '0')}
          </div>
        </div>
        
        {/* Lives */}
        <div>
          <div className="text-[10px] text-gray-500 tracking-widest mb-1">LIVES</div>
          <div className="flex justify-end gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <svg
                key={i}
                width="16"
                height="16"
                viewBox="0 0 20 20"
                className={`${i < lives ? 'text-neonGreen' : 'text-gray-700'}`}
                style={{ 
                  filter: i < lives ? 'drop-shadow(0 0 4px rgba(57, 255, 20, 0.8))' : 'none'
                }}
              >
                <polygon
                  points="15,10 5,15 7,10 5,5"
                  fill="currentColor"
                />
              </svg>
            ))}
          </div>
        </div>

        {/* Powerup indicator */}
        {powerupActive && (
          <div className="mt-3">
            <div className="text-[10px] text-cyan-400 tracking-widest animate-pulse">
              ⚡ POWERUP ⚡
            </div>
          </div>
        )}
      </div>
      )}
      
      {/* Instructions - desktop only, when playing */}
      {isPlaying && showInstructions && !gameOver && !isMobile && (
        <div className="fixed bottom-4 right-4 z-20 text-right pointer-events-none">
          <div 
            className="text-[8px] text-gray-500 leading-relaxed"
            style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
          >
            <div>← → ROTATE</div>
            <div>↑ THRUST</div>
            <div>SPACE FIRE</div>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls - only show when playing */}
      {isPlaying && isMobile && !gameOver && (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-between items-end pointer-events-auto">
          {/* Left side - D-pad style rotation + thrust */}
          <div className="flex flex-col items-center gap-2">
            {/* Thrust button */}
            <button
              data-game-control
              className="w-14 h-14 rounded-full bg-black/60 border-2 border-neonGreen flex items-center justify-center active:bg-neonGreen/30 select-none"
              style={{ 
                boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
                touchAction: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none'
              }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowup', true); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowup', false); }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-neonGreen">
                <path d="M12 4L20 16H4L12 4Z" fill="currentColor"/>
              </svg>
            </button>
            {/* Left/Right rotation */}
            <div className="flex gap-2">
              <button
                data-game-control
                className="w-12 h-12 rounded-full bg-black/60 border-2 border-neonGreen flex items-center justify-center active:bg-neonGreen/30 select-none"
                style={{ 
                  boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none'
                }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowleft', true); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowleft', false); }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neonGreen">
                  <path d="M15 4L7 12L15 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                data-game-control
                className="w-12 h-12 rounded-full bg-black/60 border-2 border-neonGreen flex items-center justify-center active:bg-neonGreen/30 select-none"
                style={{ 
                  boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none'
                }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowright', true); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleTouchControl('arrowright', false); }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neonGreen">
                  <path d="M9 4L17 12L9 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Right side - Fire button */}
          <button
            data-game-control
            className="w-20 h-20 rounded-full bg-black/60 border-3 border-orange-500 flex items-center justify-center active:bg-orange-500/30 select-none"
            style={{ 
              boxShadow: '0 0 15px rgba(249, 115, 22, 0.6)',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none'
            }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleFireTouch(); }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span 
              className="text-orange-500 text-xs font-bold"
              style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
            >
              FIRE
            </span>
          </button>
        </div>
      )}
      
      {/* Game Over overlay - only show when playing */}
      {isPlaying && gameOver && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div 
            className="text-center p-8 bg-black/80 border-2 border-red-500"
            style={{ 
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 30px rgba(239, 68, 68, 0.1)'
            }}
          >
            <div 
              className="text-3xl text-red-500 mb-4"
              style={{ 
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                textShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
              }}
            >
              GAME OVER
            </div>
            <div 
              className="text-lg text-neonGreen mb-2"
              style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
            >
              SCORE: {score.toString().padStart(6, '0')}
            </div>
            {score >= highScore && score > 0 && (
              <div 
                className="text-sm text-orange-500 mb-4 animate-pulse"
                style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
              >
                NEW HIGH SCORE!
              </div>
            )}
            {isMobile ? (
              <button
                className="text-xs text-gray-400 pointer-events-auto px-4 py-2 border border-gray-600 active:bg-gray-800"
                style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
                onClick={resetGame}
              >
                TAP TO RESTART
              </button>
            ) : (
              <div 
                className="text-xs text-gray-400 pointer-events-auto"
                style={{ fontFamily: '"Press Start 2P", "Courier New", monospace' }}
              >
                PRESS R TO RESTART
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AsteroidsGame;
