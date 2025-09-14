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

export interface GalaxyCanvasHandle {
  regenerate: () => void;
  setCameraPosition: (preset: 'top' | 'side') => void;
}

const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, {}>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const galaxyRef = useRef<THREE.Group | null>(null);

  const generateGalaxy = useCallback(() => {
    if (!sceneRef.current) return;

    if (galaxyRef.current) {
      while(galaxyRef.current.children.length > 0){ 
        const object = galaxyRef.current.children[0];
        if (object instanceof THREE.Points) {
            object.geometry.dispose();
            (object.material as THREE.Material).dispose();
        }
        galaxyRef.current.remove(object); 
      }
    } else {
      galaxyRef.current = new THREE.Group();
      sceneRef.current.add(galaxyRef.current);
    }

    const parameters = {
      count: 100000,
      size: 0.01,
      radius: 5,
      branches: 3 + Math.floor(Math.random() * 7),
      spin: Math.random() - 0.5,
      randomness: 0.2 + Math.random() * 1.8,
      randomnessPower: 2 + Math.random() * 3,
      insideColor: new THREE.Color(),
      outsideColor: new THREE.Color(),
    };

    parameters.insideColor.setHSL(Math.random(), 0.8, 0.6);
    parameters.outsideColor.setHSL(Math.random(), 0.8, 0.4);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);
    
    const colorInside = parameters.insideColor;
    const colorOutside = parameters.outsideColor;

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
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    galaxyRef.current.add(points);
  }, []);

  useImperativeHandle(ref, () => ({
    regenerate: () => {
      generateGalaxy();
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
    
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
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

    generateGalaxy();

    let animationFrameId: number;
    const animate = () => {
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
         while(galaxyRef.current.children.length > 0){ 
            const object = galaxyRef.current.children[0];
            if (object instanceof THREE.Points) {
                object.geometry.dispose();
                (object.material as THREE.Material).dispose();
            }
            galaxyRef.current.remove(object); 
         }
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
  }, [generateGalaxy]);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
});

GalaxyCanvas.displayName = "GalaxyCanvas";
export default GalaxyCanvas;
