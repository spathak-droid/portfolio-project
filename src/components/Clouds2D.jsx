import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import cloudImage from '../assets/cloud.png';

export default function Clouds2D({ count = 8 }) {
  const group = useRef();
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(cloudImage);
  }, []);
  
  // Create cloud data with random positions and scales
  const clouds = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      // Position clouds in a sphere around the scene
      const radius = 30 + Math.random() * 40; // Keep clouds at a distance
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      temp.push({
        position: new THREE.Vector3().setFromSphericalCoords(
          radius,
          phi,
          theta
        ),
        scale: 0.5 + Math.random() * 1.5,
        speed: 0.01 + Math.random() * 0.02
      });
    }
    return temp;
  }, [count]);

  // Animate clouds to slowly rotate
  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={group}>
      {clouds.map((cloud, i) => (
        <sprite
          key={i}
          position={cloud.position}
          scale={[10 * cloud.scale, 5 * cloud.scale, 1]}
        >
          <spriteMaterial 
            map={texture}
            transparent={true}
            opacity={0.3 + Math.random() * 0.3}
          />
        </sprite>
      ))}
    </group>
  );
}
