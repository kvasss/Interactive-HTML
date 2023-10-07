import * as THREE from "three";
import { useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Html,
  Mask,
  useMask,
  OrthographicCamera,
  Clone,
  Float as FloatImpl
} from "@react-three/drei";
import useSpline from "@splinetool/r3f-spline";
import Embed from "./Embed";

export function App() {
  const container = useRef();
  const domContent = useRef();
  return (
    <div ref={container} className="content-container">
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden"
        }}
        ref={domContent}
      />
      <Canvas
        shadows
        flat
        linear
        style={{ pointerEvents: "none" }}
        eventSource={container}
        eventPrefix="page"
      >
        <directionalLight
          castShadow
          intensity={0.4}
          position={[-10, 50, 300]}
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.002}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[-2000, 2000, 2000, -2000, -10000, 10000]}
          />
        </directionalLight>
        <OrthographicCamera
          makeDefault={true}
          far={100000}
          near={-100000}
          position={[0, 0, 1000]}
        />
        <hemisphereLight intensity={0.5} color="#eaeaea" position={[0, 1, 0]} />
        <Scene portal={domContent} position={[0, -50, 0]} />
      </Canvas>
    </div>
  );
}

function Scene({ portal, ...props }) {
  let timeout = null;
  const v = new THREE.Vector3();
  const wheel = useRef(0);
  const hand = useRef();
  const [clicked, click] = useState(false);
  const { nodes } = useSpline("/scroll.splinecode");
  const stencil = useMask(1, true);
  // console.log(nodes);
  useLayoutEffect(() => {
    Object.values(nodes).forEach((node) => {
      if (node.children?.length > 0 && node.name !== "hand-r") {
        node.children.forEach((node) => Object.assign(node.material, stencil));
      }
    });
  }, []);

  useFrame((state) => {
    v.copy({ x: state.pointer.x, y: state.pointer.y, z: 0 });
    v.unproject(state.camera);
    hand.current.rotation.x = THREE.MathUtils.lerp(
      hand.current.rotation.x,
      clicked ? -0.7 : -0.5,
      0.2
    );
    hand.current.position.lerp(
      {
        x: v.x - 100,
        y: wheel.current + v.y,
        z: v.z
      },
      0.4
    );
    state.camera.zoom = THREE.MathUtils.lerp(
      state.camera.zoom,
      clicked ? 0.9 : 0.7,
      clicked ? 0.025 : 0.15
    );
    state.camera.position.lerp(
      {
        x: -state.pointer.x * 400,
        y: -state.pointer.y * 200,
        z: 1000
      },
      0.1
    );
    state.camera.lookAt(0, 0, 0);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group {...props} dispose={null}>
      <group ref={hand}>
        <Clone object={nodes["hand-r"]} rotation-y={0.35} />
      </group>
      <FloatImpl floatIntensity={100} rotationIntensity={0.5} speed={1}>
        <group position={[0, -50, 0]} rotation={[-0.15, 0, 0]}>
          <Clone object={nodes["hand-l"]} position={[80, 100, -150]} />
          <group name="phone" position={[-50, 0, -68]}>
            <Clone
              object={[
                nodes["Rectangle 4"],
                nodes["Rectangle 3"],
                nodes["Boolean 2"]
              ]}
            />
            <Mask
              id={1}
              colorWrite={false}
              depthWrite={false}
              geometry={nodes.screen.geometry}
              castShadow
              receiveShadow
              position={[0, 0, 9.89]}
            >
              <Html
                className="content-embed"
                portal={portal}
                scale={40}
                transform
                zIndexRange={[-1, 0]}
              >
                <Embed />
              </Html>
            </Mask>
            <mesh
              onWheel={(e) => {
                wheel.current = -e.deltaY / 2;
                clearTimeout(timeout);
                timeout = setTimeout(() => (wheel.current = 0), 100);
              }}
              onPointerDown={(e) => {
                e.target.setPointerCapture(e.pointerId);
                click(true);
              }}
              onPointerUp={(e) => {
                e.target.releasePointerCapture(e.pointerId);
                click(false);
              }}
              receiveShadow
              geometry={nodes.screen.geometry}
            >
              <meshStandardMaterial transparent opacity={0.1} />
            </mesh>
          </group>
        </group>
      </FloatImpl>
    </group>
  );
}
