"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";

export function AuthBackgroundKoi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDisposed = false;
    let animId: number;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function initThree() {
      try {
        // Dynamically load Three.js from CDN (consistent with landing page)
        const THREE = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"
        );
        const { GLTFLoader } = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js"
        );
        const { RoomEnvironment } = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js"
        );

        if (isDisposed || !canvas) return;

        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.9;

        const scene = new THREE.Scene();

        // Soft calm environment
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        scene.environment = pmrem.fromScene(room, 0.04).texture;

        // Soft atmospheric purple lighting
        const hemiLight = new THREE.HemisphereLight(0xc6b2ff, 0x2a1c80, 0.65);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xffc8f0, 1.2);
        keyLight.position.set(3, 4, 5);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x8c7bff, 2.0);
        rimLight.position.set(-4, -1, -3);
        scene.add(rimLight);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          30,
          window.innerWidth / window.innerHeight,
          0.1,
          100
        );
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);

        function getFrustum() {
          const fh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 10;
          const fw = fh * (window.innerWidth / window.innerHeight);
          return { fh, fw };
        }

        const rig = new THREE.Group();
        const body = new THREE.Group();
        rig.add(body);
        scene.add(rig);

        // Swim shader deformation uniforms (slow, calm undulation)
        const swimUniforms = {
          uTime: { value: 0.0 },
          uFreq: { value: 2.8 },
          uSpeed: { value: 1.4 },
          uAmp: { value: 0.035 },
        };

        const loader = new GLTFLoader();
        const modelUrl =
          "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_151843_47d87652-1c40-465c-b0d6-cd94c22a9d3e.glb";

        loader.load(
          modelUrl,
          (gltf: { scene: { traverse: (cb: (child: any) => void) => void } }) => {
            if (isDisposed) return;
            let baseTexture = null;
            let meshObj: any = null;

            gltf.scene.traverse((child: any) => {
              if (child.isMesh) {
                meshObj = child;
                if (child.material && child.material.map) {
                  baseTexture = child.material.map;
                }
              }
            });

            if (!meshObj) return;

            // Geometry normalization
            meshObj.updateMatrixWorld(true);
            meshObj.geometry.applyMatrix4(meshObj.matrixWorld);
            meshObj.position.set(0, 0, 0);
            meshObj.rotation.set(0, 0, 0);
            meshObj.scale.set(1, 1, 1);

            meshObj.geometry.computeBoundingBox();
            const bbox = meshObj.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);

            if (size.z > size.x && size.z > size.y) {
              meshObj.geometry.rotateY(Math.PI / 2);
            } else if (size.y > size.x && size.y > size.z) {
              meshObj.geometry.rotateZ(-Math.PI / 2);
            }

            // Orient nose to +X
            meshObj.geometry.rotateY(Math.PI);

            meshObj.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            meshObj.geometry.boundingBox.getCenter(center);
            meshObj.geometry.translate(-center.x, -center.y, -center.z);

            meshObj.geometry.computeBoundingBox();
            const length =
              meshObj.geometry.boundingBox.max.x - meshObj.geometry.boundingBox.min.x;
            if (length > 0) {
              meshObj.geometry.scale(1 / length, 1 / length, 1 / length);
            }
            meshObj.geometry.computeVertexNormals();

            // Calmer, softer crystal material with gentle translucency
            const material = new THREE.MeshPhysicalMaterial({
              color: baseTexture ? 0xc9b4ff : 0xb8a4ff,
              map: baseTexture,
              emissiveMap: baseTexture,
              roughness: 0.25,
              metalness: 0.12,
              clearcoat: 0.9,
              clearcoatRoughness: 0.15,
              iridescence: 0.75,
              iridescenceIOR: 1.35,
              thickness: 400,
              emissive: new THREE.Color(0x7a46ff),
              emissiveIntensity: 0.4,
              sheen: 0.2,
              sheenColor: new THREE.Color(0xff9ce6),
              transparent: true,
              opacity: 0.88,
              envMapIntensity: 0.65,
              side: THREE.DoubleSide,
            });

            material.onBeforeCompile = (shader: any) => {
              shader.uniforms.uTime = swimUniforms.uTime;
              shader.uniforms.uFreq = swimUniforms.uFreq;
              shader.uniforms.uSpeed = swimUniforms.uSpeed;
              shader.uniforms.uAmp = swimUniforms.uAmp;

              shader.vertexShader =
                `
                uniform float uTime;
                uniform float uFreq;
                uniform float uSpeed;
                uniform float uAmp;
              ` + shader.vertexShader;

              shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                `
                #include <begin_vertex>
                float tail = clamp((0.32 - transformed.x) / 0.82, 0.0, 1.0);
                transformed.z += sin(transformed.x * uFreq - uTime * uSpeed) * uAmp * (0.15 + 1.2 * tail * tail);
                transformed.y += cos(transformed.x * uFreq * 0.5 - uTime * uSpeed * 0.5) * uAmp * 0.1 * tail;
                `
              );
            };

            meshObj.material = material;
            body.add(meshObj);
          },
          undefined,
          (err: unknown) => {
            console.warn("[AuthBackgroundKoi] Optional 3D model could not be loaded:", err);
          }
        );

        const handleResize = () => {
          if (isDisposed) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        let lastTime = performance.now();
        const startTime = performance.now();

        const render = (now: number) => {
          if (isDisposed) return;
          animId = requestAnimationFrame(render);

          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;
          const elapsed = (now - startTime) / 1000;

          if (!prefersReduced) {
            swimUniforms.uTime.value += dt;
          }

          const { fw, fh } = getFrustum();

          // Peaceful resting pose: Upper-right background floating gracefully
          const isMobile = window.innerWidth < 820;
          const targetX = isMobile ? 0.2 : 0.42;
          const targetY = isMobile ? -0.2 : 0.15;
          const targetS = isMobile ? 0.35 : 0.48;

          // Gentle slow breathing bob
          const bob = prefersReduced ? 0 : Math.sin(0.4 * elapsed) * 0.012;
          rig.position.set(targetX * (fw / 2), (targetY + bob) * (fh / 2), 0);

          const subtleRoll = prefersReduced ? 0.05 : 0.05 + Math.sin(0.3 * elapsed) * 0.02;
          const subtleYaw = prefersReduced ? -0.3 : -0.3 + Math.sin(0.25 * elapsed) * 0.03;
          const subtlePitch = 0.12;

          rig.rotation.set(subtleRoll, subtleYaw, subtlePitch, "XYZ");
          body.scale.setScalar(targetS * fh);

          renderer.render(scene, camera);
        };

        animId = requestAnimationFrame(render);
      } catch (err) {
        console.warn("[AuthBackgroundKoi] Three.js background init failed:", err);
      }
    }

    initThree();

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Peaceful purple/lilac pond still plate */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage:
            'url("https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_151305_25ef1f45-0886-491c-a7a8-81e296402d5a.png&w=2400&q=85")',
          opacity: 0.85,
        }}
      />

      {/* Atmospheric deep violet & lilac calm ambient overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(13, 8, 48, 0.84) 0%, rgba(18, 12, 60, 0.80) 50%, rgba(11, 6, 38, 0.90) 100%)",
        }}
      />

      {/* Soft radial atmospheric glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 65% 35%, rgba(141, 148, 255, 0.15) 0%, transparent 65%)",
        }}
      />

      {/* Calm 3D Koi WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
