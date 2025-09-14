"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
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
  triggerWarp: () => void;
}

type GalaxyCanvasProps = {
  initialParams: GalaxyParameters;
  onObjectClick: (objectType: string) => void;
}

const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, GalaxyCanvasProps>(({ initialParams, onObjectClick }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyRef = useRef<THREE.Group | null>(null);
  const blackHoleRef = useRef<THREE.Group | null>(null);
  const asteroidBeltsRef = useRef<THREE.Group[]>([]);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);

  const [isWarping, setIsWarping] = useState(false);
  const warpStartTimeRef = useRef(0);
  const [currentParams, setCurrentParams] = useState(initialParams);

  const generateAsteroidBelt = useCallback((scene: THREE.Scene, radius: number, count: number, speed: number, beltIndex: number) => {
    if (asteroidBeltsRef.current[beltIndex]) {
        scene.remove(asteroidBeltsRef.current[beltIndex]);
        asteroidBeltsRef.current[beltIndex].traverse((object) => {
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

    const belt = new THREE.Group();
    belt.userData = { speed };
    const asteroidGeometries: THREE.BufferGeometry[] = [];
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.5
    });

    for(let i=0; i<30; i++) {
        const geo = new THREE.IcosahedronGeometry(Math.random() * 0.05 + 0.02, 0);
        asteroidGeometries.push(geo);
    }
    
    for (let i = 0; i < count; i++) {
        const geometryIndex = Math.floor(Math.random() * asteroidGeometries.length);
        const asteroid = new THREE.Mesh(asteroidGeometries[geometryIndex], asteroidMaterial);

        const angle = Math.random() * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 0.5;
        const y = (Math.random() - 0.5) * 0.1;
        
        asteroid.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        belt.add(asteroid);
    }
    
    scene.add(belt);
    asteroidBeltsRef.current[beltIndex] = belt;

    asteroidGeometries.forEach(geo => geo.dispose());
  }, []);

  const generateGalaxy = useCallback((parameters: GalaxyParameters) => {
    if (!sceneRef.current) return;
  
    if (galaxyRef.current) {
        const oldGalaxy = galaxyRef.current;
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
        galaxyRef.current = null;
    }
    
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
    generateAsteroidBelt(sceneRef.current, parameters.radius * 1.2, 300, 0.0005, 0);
    generateAsteroidBelt(sceneRef.current, parameters.radius * 1.5, 400, 0.0003, 1);
  }, [generateAsteroidBelt]);


  useImperativeHandle(ref, () => ({
    regenerate: (params: GalaxyParameters) => {
      setCurrentParams(params);
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
    triggerWarp: () => {
        if (isWarping || !controlsRef.current) return;
        setIsWarping(true);
        warpStartTimeRef.current = performance.now();
        controlsRef.current.autoRotate = false;
    }
  }));

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

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

    const blackHoleGroup = new THREE.Group();
    blackHoleGroup.name = 'black-hole';
    scene.add(blackHoleGroup);
    blackHoleRef.current = blackHoleGroup;

    const blackHoleGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    blackHoleMesh.name = 'black-hole'; // For raycasting
    blackHoleGroup.add(blackHoleMesh);

    const diskGeometry = new THREE.RingGeometry(1.7, 3.5, 128);
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
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);

    generateGalaxy(currentParams);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      diskMaterial.uniforms.time.value = elapsedTime;
      asteroidBeltsRef.current.forEach(belt => {
        if (belt) {
            belt.rotation.y += belt.userData.speed;
        }
      });

      if (isWarping && galaxyRef.current && cameraRef.current && controlsRef.current) {
        const warpDuration = 1500; // 1.5 seconds
        const warpProgress = (performance.now() - warpStartTimeRef.current) / warpDuration;

        if (warpProgress < 1) {
          const easeProgress = 1.0 - Math.pow(1.0 - warpProgress, 4.0);
          galaxyRef.current.scale.z = 1.0 + easeProgress * 25.0;
          cameraRef.current.fov = 75 + easeProgress * 50;
          cameraRef.current.updateProjectionMatrix();
        } else {
            // End of warp: reset and generate new galaxy
            galaxyRef.current.scale.z = 1.0;
            cameraRef.current.fov = 75;
            cameraRef.current.updateProjectionMatrix();
            setIsWarping(false);
            controlsRef.current.autoRotate = true;
            const newParams = {
                count: Math.floor(10000 + Math.random() * 190000),
                radius: 4 + Math.random() * 6,
                branches: Math.floor(3 + Math.random() * 17),
                spin: Math.random() * 4 - 2,
                randomness: Math.random() * 2,
                randomnessPower: 1 + Math.random() * 9,
            };
            setCurrentParams(newParams)
            generateGalaxy(newParams);
        }
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
    
    const handleClick = (event: MouseEvent) => {
        if (!raycasterRef.current || !mouseRef.current || !cameraRef.current || !sceneRef.current) return;

        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
        
        for (const intersect of intersects) {
            let currentObject = intersect.object;
            while(currentObject) {
                if (currentObject.name === 'black-hole') {
                    onObjectClick('black-hole');
                    return;
                }
                currentObject = currentObject.parent as THREE.Object3D;
            }
        }
    };
    window.addEventListener('click', handleClick);


    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      const disposeGroup = (group: THREE.Group | null) => {
          if (!group) return;
          sceneRef.current?.remove(group);
          group.traverse((object) => {
              if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                  object.geometry.dispose();
                  const material = object.material as THREE.Material | THREE.Material[];
                  if (Array.isArray(material)) {
                      material.forEach(m => m.dispose());
                  } else {
                      material.dispose();
                  }
              }
          });
      };
      
      disposeGroup(galaxyRef.current);
      disposeGroup(blackHoleRef.current);
      asteroidBeltsRef.current.forEach(belt => disposeGroup(belt));
      
      renderer.dispose();
      if (currentMount && renderer.domElement) {
        try {
            currentMount.removeChild(renderer.domElement);
        } catch (e) {
            console.error("Failed to remove canvas on cleanup.", e);
        }
      }
    };
  }, [generateGalaxy, isWarping, onObjectClick]);

  useEffect(() => {
    generateGalaxy(currentParams);
  }, [currentParams, generateGalaxy]);


  return <div ref={mountRef} className="absolute inset-0 z-0" />;
});

GalaxyCanvas.displayName = "GalaxyCanvas";
export default GalaxyCanvas;
