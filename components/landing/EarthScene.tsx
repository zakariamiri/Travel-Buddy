'use client'

import { Float, OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null)
  const earthMap = useMemo(() => {
    const texture = new THREE.TextureLoader().load('/earth-color.jpg')
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return texture
  }, [])

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.065
  })

  return (
    <group rotation={[0.15, 0, -0.16]}>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1.45, 96, 96]} />
        <meshStandardMaterial
          color="#ffffff"
          map={earthMap}
          metalness={0.02}
          roughness={0.62}
        />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[1.45, 96, 96]} />
        <meshBasicMaterial
          color="#66cfff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight
        position={[3.5, 3, 5]}
        intensity={2.4}
        color="#fff3d1"
        castShadow
      />
      <hemisphereLight args={['#dff8ff', '#f1d3ad', 1.15]} />
      <pointLight position={[-4, -1, 2]} intensity={1.45} color="#C9603A" />
      <pointLight position={[2, -3, -2]} intensity={1.1} color="#5E7A5A" />
      <Stars radius={38} depth={20} count={900} factor={2.4} fade speed={0.35} />
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.3}>
        <Earth />
      </Float>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </>
  )
}

export default function EarthScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 4.35], fov: 42 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
