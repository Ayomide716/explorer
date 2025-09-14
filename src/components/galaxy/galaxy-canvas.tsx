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
}

const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, GalaxyCanvasProps>(({ initialParams }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyRef = useRef<THREE.Group | null>(null);
  const blackHoleRef = useRef<THREE.Group | null>(null);

  const [isWarping, setIsWarping] = useState(false);
  const warpStartTimeRef = useRef(0);

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
    scene.add(blackHoleGroup);
    blackHoleRef.current = blackHoleGroup;

    const blackHoleGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
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
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    generateGalaxy(initialParams);

    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      diskMaterial.uniforms.time.value = elapsedTime;

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
            generateGalaxy({
                count: Math.floor(10000 + Math.random() * 190000),
                radius: 4 + Math.random() * 6,
                branches: Math.floor(3 + Math.random() * 17),
                spin: Math.random() * 4 - 2,
                randomness: Math.random() * 2,
                randomnessPower: 1 + Math.random() * 9,
            });
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
      
      renderer.dispose();
      if (currentMount && renderer.domElement) {
        try {
            currentMount.removeChild(renderer.domElement);
        } catch (e) {
            console.error("Failed to remove canvas on cleanup.", e);
        }
      }
    };
  }, [generateGalaxy, initialParams, isWarping]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
});

GalaxyCanvas.displayName = "GalaxyCanvas";
export default GalaxyCanvas;
