"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface GalaxyParameters {
  count: number;
  radius: number;
  branches: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
}

export interface GalaxyCanvasHandle {
  regenerate: (params: GalaxyParameters) => void;
  setCameraPosition: (preset: 'top' | 'side') => void;
}

type GalaxyCanvasProps = {
  initialParams: GalaxyParameters;
}

const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, GalaxyCanvasProps>(({ initialParams }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyRef = useRef<THREE.Group | null>(null);
  const blackHoleRef = useRef<THREE.Group | null>(null);
  const shipRef = useRef<THREE.Group | null>(null);


  const generateGalaxy = useCallback((parameters: GalaxyParameters) => {
    if (!sceneRef.current) return;
  
    // Dispose of old galaxy if it exists
    if (galaxyRef.current) {
        const oldGalaxy = galaxyRef.current;
        galaxyRef.current = null;
        sceneRef.current.remove(oldGalaxy);
        oldGalaxy.traverse((object) => {
            if (object instanceof THREE.Points) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
    
    // Create a new group for the galaxy
    const newGalaxy = new THREE.Group();
    sceneRef.current.add(newGalaxy);
    galaxyRef.current = newGalaxy;
    
    const insideColor = new THREE.Color();
    insideColor.setHSL(Math.random(), 0.8, 0.6);
    const outsideColor = new THREE.Color();
    outsideColor.setHSL(Math.random(), 0.8, 0.4);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);
    
    const colorInside = insideColor;
    const colorOutside = outsideColor;

    for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius * 0.5;
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        
        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.01,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    newGalaxy.add(points);
  }, []);

  useImperativeHandle(ref, () => ({
    regenerate: (params: GalaxyParameters) => {
      generateGalaxy(params);
    },
    setCameraPosition: (preset: 'top' | 'side') => {
      if (cameraRef.current && controlsRef.current) {
        controlsRef.current.reset();
        if (preset === 'top') {
          cameraRef.current.position.set(0, 10, 0.1);
        } else {
          cameraRef.current.position.set(10, 2, 0);
        }
        cameraRef.current.lookAt(0, 0, 0);
        controlsRef.current.update();
      }
    },
  }));

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.z = 8;
    camera.position.y = 3;
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controlsRef.current = controls;

    // Black hole
    const blackHoleGroup = new THREE.Group();
    scene.add(blackHoleGroup);
    blackHoleRef.current = blackHoleGroup;

    // Event Horizon
    const blackHoleGeometry = new THREE.SphereGeometry(1, 64, 64);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    blackHoleGroup.add(blackHoleMesh);

    // Accretion Disk
    const diskGeometry = new THREE.RingGeometry(1.2, 2.2, 128);
    const diskMaterial = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0xff8800) },
            color2: { value: new THREE.Color(0xff0000) },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;
            
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main() {
                float angle = atan(vUv.y - 0.5, vUv.x - 0.5) + time * 0.5;
                float radius = length(vUv - 0.5);
                
                float strength = (0.5 - abs(radius - 0.7)) * 2.0;
                strength = smoothstep(0.0, 1.0, strength);

                float colorMix = 0.5 + 0.5 * sin(angle * 5.0 + time * 2.0);
                vec3 color = mix(color1, color2, colorMix);

                float n = noise(vUv * 10.0 + time * 0.2);
                strength *= n * 0.5 + 0.5;
                
                gl_FragColor = vec4(color, strength * (1.0 - smoothstep(0.9, 1.0, radius)));
            }
        `
    });
    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.rotation.x = -Math.PI / 2;
    blackHoleGroup.add(diskMesh);
    
    // Spaceship
    const ship = new THREE.Group();
    const shipMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.4 });
    
    // Body
    const bodyGeometry = new THREE.ConeGeometry(0.1, 0.5, 32);
    const body = new THREE.Mesh(bodyGeometry, shipMaterial);
    body.rotation.x = Math.PI / 2;
    ship.add(body);

    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 0.5 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.15;
    ship.add(cockpit);

    // Engine
    const engineGeometry = new THREE.CylinderGeometry(0.07, 0.05, 0.1, 32);
    const engine = new THREE.Mesh(engineGeometry, shipMaterial);
    engine.position.y = -0.2;
    engine.rotation.x = Math.PI / 2;
    ship.add(engine);

    // Engine light
    const engineLight = new THREE.PointLight(0x00ffff, 2, 1);
    engineLight.position.y = -0.3;
    ship.add(engineLight);

    ship.position.set(2, 0.5, 4);
    ship.rotation.y = -Math.PI / 4;
    ship.rotation.x = -Math.PI / 12;

    scene.add(ship);
    shipRef.current = ship;

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    generateGalaxy(initialParams);

    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Animate accretion disk
      diskMaterial.uniforms.time.value = elapsedTime;

      // Animate ship
      if (shipRef.current) {
        shipRef.current.position.y = 0.5 + Math.sin(elapsedTime * 0.7) * 0.1;
      }


      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      if (galaxyRef.current) {
        sceneRef.current?.remove(galaxyRef.current);
        galaxyRef.current.traverse((object) => {
             if (object instanceof THREE.Points) {
                 object.geometry.dispose();
                 const material = object.material as THREE.Material | THREE.Material[];
                 if (Array.isArray(material)) {
                     material.forEach(m => m.dispose());
                 } else {
                     material.dispose();
                 }
             }
        });
      }

      if (blackHoleRef.current) {
        sceneRef.current?.remove(blackHoleRef.current);
        blackHoleRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                const material = object.material as THREE.Material | THREE.Material[];
                if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                } else {
                    material.dispose();
                }
            }
        });
      }
      if (shipRef.current) {
        sceneRef.current?.remove(shipRef.current);
        shipRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                const material = object.material as THREE.Material | THREE.Material[];
                if (Array.isArray(material)) {
                    material.forEach(m => m.dispose());
                } else {
                    material.dispose();
                }
            } else if (object instanceof THREE.PointLight) {
                object.dispose();
            }
        });
      }
      
      renderer.dispose();
      if (currentMount && renderer.domElement) {
        try {
            currentMount.removeChild(renderer.domElement);
        } catch (e) {
            console.error("Failed to remove canvas on cleanup.", e);
        }
      }
    };
  }, [generateGalaxy, initialParams]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
});

GalaxyCanvas.displayName = "GalaxyCanvas";
export default GalaxyCanvas;

    