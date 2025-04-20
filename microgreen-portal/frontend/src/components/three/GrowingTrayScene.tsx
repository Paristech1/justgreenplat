import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  RoundedBox, 
  Edges, 
  Text, 
  Environment, 
  Float, 
  MeshReflectorMaterial 
} from '@react-three/drei';
import * as THREE from 'three';

interface TrayProps {
  position: [number, number, number];
  status: string;
  variety: string;
  progress: number;
}

const TRAY_SIZE: [number, number, number] = [4, 0.8, 2.5];

// Individual tray component
const Tray = ({ position, status, variety, progress }: TrayProps) => {
  // Reference to mesh for animation
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Different colors for different statuses
  const colors = {
    planted: '#8BC34A',  // Light green
    growing: '#4CAF50', // Medium green
    ready: '#2E7D32',   // Dark green
    harvested: '#795548', // Brown
  };
  
  const statusColor = status === 'planted' ? colors.planted : 
                      status === 'growing' ? colors.growing : 
                      status === 'ready' ? colors.ready : colors.harvested;
  
  // Color intensity based on progress
  const intensity = 0.6 + (progress * 0.4);
  
  // Animate the growth based on progress
  useFrame((state) => {
    if (meshRef.current && status === 'growing') {
      // Subtle animation for growing trays
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  // Microgreens height based on progress (for growing trays)
  const sproutHeight = status === 'planted' ? 0.05 : 
                      status === 'growing' ? 0.05 + (progress * 0.4) : 
                      status === 'ready' ? 0.45 : 0;

  return (
    <group position={position}>
      {/* Tray container */}
      <RoundedBox args={TRAY_SIZE} radius={0.1} smoothness={4}>
        <MeshReflectorMaterial 
          color="#333333" 
          metalness={0.2}
          roughness={0.8}
        />
        <Edges color="#222222" />
      </RoundedBox>
      
      {/* Soil */}
      <RoundedBox 
        args={[TRAY_SIZE[0] - 0.2, 0.3, TRAY_SIZE[2] - 0.2]} 
        position={[0, 0.25, 0]} 
        radius={0.05} 
        smoothness={4}
      >
        <meshStandardMaterial color="#3E2723" roughness={1} />
      </RoundedBox>
      
      {/* Microgreens (only if not harvested) */}
      {status !== 'harvested' && (
        <group ref={meshRef}>
          <instancedMesh 
            args={[undefined, undefined, 150]} 
            position={[0, 0.4, 0]}
          >
            <cylinderGeometry args={[0.02, 0.04, sproutHeight, 4]} />
            <meshStandardMaterial 
              color={statusColor} 
              roughness={0.8} 
              emissive={statusColor}
              emissiveIntensity={intensity}
            />
          </instancedMesh>
          
          {/* Generate random sprouts */}
          {Array.from({ length: 150 }).map((_, i) => {
            const x = (Math.random() - 0.5) * (TRAY_SIZE[0] - 0.4);
            const z = (Math.random() - 0.5) * (TRAY_SIZE[2] - 0.4);
            const height = 0.3 + (Math.random() * 0.2);
            
            return (
              <mesh 
                key={i} 
                position={[x, 0.4 + (sproutHeight/2), z]}
                scale={[1, Math.random() * 0.5 + 0.5, 1]}
                rotation={[0, 0, (Math.random() - 0.5) * 0.5]}
              >
                <cylinderGeometry args={[0.02, 0.04, sproutHeight, 4]} />
                <meshStandardMaterial 
                  color={statusColor} 
                  roughness={0.8} 
                  emissive={statusColor}
                  emissiveIntensity={intensity}
                />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Label */}
      <Float speed={2} floatIntensity={0.2} rotationIntensity={0.2}>
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {variety}
        </Text>
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.2}
          color="#dddddd"
          anchorX="center"
          anchorY="middle"
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
          {status === 'growing' && ` (${Math.round(progress * 100)}%)`}
        </Text>
      </Float>
    </group>
  );
};

// Scene setup
const Scene = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(8, 8, 12);
  }, [camera]);
  
  // Sample data - in a real app this would come from props/API
  const trays = [
    { position: [-5, 0, -2] as [number, number, number], status: 'planted', variety: 'Sunflower', progress: 0.1 },
    { position: [0, 0, -2] as [number, number, number], status: 'growing', variety: 'Pea Shoots', progress: 0.4 },
    { position: [5, 0, -2] as [number, number, number], status: 'growing', variety: 'Radish', progress: 0.8 },
    { position: [-5, 0, 2] as [number, number, number], status: 'ready', variety: 'Broccoli', progress: 1 },
    { position: [0, 0, 2] as [number, number, number], status: 'harvested', variety: 'Arugula', progress: 0 },
    { position: [5, 0, 2] as [number, number, number], status: 'planted', variety: 'Kale', progress: 0.2 },
  ];
  
  return (
    <>
      {/* Environment and lighting */}
      <Environment preset="warehouse" />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <MeshReflectorMaterial 
          mirror={0.5}
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={10}
          roughness={0.9}
          depthScale={1}
          color="#f0f0f0"
          metalness={0.1}
        />
      </mesh>
      
      {/* Render all trays */}
      {trays.map((tray, index) => (
        <Tray 
          key={index}
          position={tray.position}
          status={tray.status}
          variety={tray.variety}
          progress={tray.progress}
        />
      ))}
      
      {/* Camera controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

// Main canvas wrapper
const GrowingTrayScene = () => {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 5, 10], fov: 50 }}>
      <Scene />
    </Canvas>
  );
};

export default GrowingTrayScene; 