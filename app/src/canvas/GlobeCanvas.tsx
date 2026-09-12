import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GraphNode, GraphEdge, LinkType, ObjectType } from "../types";
import { filterCaseNetwork, GlobeNode, GlobeArc, CaseGlobeData, VERIFIED_HUBS } from "./caseGeoFilter";
import worldLandPolylines from "./world-land.json";
import {
  Globe,
  RotateCcw,
  Plus,
  Minus,
  Crosshair,
  MapPin,
  Shield,
  Activity,
  PhoneCall,
  DollarSign,
  Compass,
  Grid,
  ChevronRight,
  ExternalLink,
  Layers,
  FileText,
  User,
  Building2,
  CreditCard,
  Camera as CameraIcon,
  Truck,
  Smartphone,
  ChevronDown,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface GlobeCanvasProps {
  caseId: string;
  caseName: string;
  caseAgency: string;
  caseStatus: string;
  casePriority: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  theme?: "dark" | "light";
  onOpenDossier?: () => void;
  onOpenTimeline?: () => void;
  onOpenEvidence?: () => void;
  onResetFilters?: () => void;
}

const GLOBE_RADIUS = 100;

function latLngToVector3(lat: number, lng: number, radius: number = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = ({
  caseId,
  caseName,
  caseAgency,
  caseStatus,
  casePriority,
  nodes: rawNodes,
  edges: rawEdges,
  selectedNodeId,
  onSelectNode,
  theme = "dark",
  onOpenDossier,
  onOpenTimeline,
  onOpenEvidence,
  onResetFilters,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters & toggles
  const [activeLinkFilter, setActiveLinkFilter] = useState<"ALL" | "CALLS" | "MONEY" | "MOVEMENT">("ALL");
  const [activeEntityFilter, setActiveEntityFilter] = useState<string>("ALL");
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isCasePanelCollapsed, setIsCasePanelCollapsed] = useState<boolean>(false);

  // Hover & Tooltip state
  const [hoveredNode, setHoveredNode] = useState<GlobeNode | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<{ x: number; y: number } | null>(null);

  // 2D Screen projected labels for major hubs
  const [projectedLabels, setProjectedLabels] = useState<{ label: string; x: number; y: number; visible: boolean }[]>([]);

  // Compass rotation angle
  const [compassAngle, setCompassAngle] = useState<number>(0);

  const isLight = theme === "light";

  // 1. STRICT CASE SCOPING: Filter dataset
  const caseData: CaseGlobeData = useMemo(() => {
    let typeFilter: Set<LinkType> | undefined;
    if (activeLinkFilter === "CALLS") {
      typeFilter = new Set<LinkType>(["CALLED"]);
    } else if (activeLinkFilter === "MONEY") {
      typeFilter = new Set<LinkType>(["PAID"]);
    } else if (activeLinkFilter === "MOVEMENT") {
      typeFilter = new Set<LinkType>(["SEEN_AT"]);
    }
    return filterCaseNetwork(caseId, rawNodes, rawEdges, typeFilter);
  }, [caseId, rawNodes, rawEdges, activeLinkFilter]);

  // Entity counts by ObjectType
  const entityTypeCounts = useMemo(() => {
    const counts: Record<ObjectType, number> = {
      Person: 0,
      Phone: 0,
      Account: 0,
      Organization: 0,
      FIR: 0,
      Location: 0,
      Camera: 0,
      Vehicle: 0,
    };
    caseData.nodes.forEach((n) => {
      if (counts[n.type] !== undefined) {
        counts[n.type]++;
      }
    });
    return counts;
  }, [caseData.nodes]);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const reqAnimIdRef = useRef<number | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedRingRef = useRef<THREE.Mesh | null>(null);
  const gridLinesRef = useRef<THREE.LineSegments | null>(null);
  const resumeRotateTimerRef = useRef<number | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const arcCurvesRef = useRef<THREE.QuadraticBezierCurve3[]>([]);
  const arcParticlesRef = useRef<THREE.InstancedMesh | null>(null);

  // 2. Initialize Three.js WebGL Scene with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: positioned to encompass South Asia, Middle East (Dubai) and Singapore
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2500);
    const initialCamPos = latLngToVector3(20.0, 72.0, 260);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.75;
    controls.minDistance = 125;
    controls.maxDistance = 450;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.35;
    controlsRef.current = controls;

    // Pause auto-rotation on user drag, resume 3s after release if autoRotate is enabled
    const handleControlStart = () => {
      // Immediately cancel any programmatic camera lerp
      targetCamPosRef.current = null;
      if (resumeRotateTimerRef.current) {
        window.clearTimeout(resumeRotateTimerRef.current);
        resumeRotateTimerRef.current = null;
      }
      controls.autoRotate = false;
    };

    const handleControlEnd = () => {
      if (resumeRotateTimerRef.current) window.clearTimeout(resumeRotateTimerRef.current);
      resumeRotateTimerRef.current = window.setTimeout(() => {
        if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
      }, 3000);
    };

    controls.addEventListener("start", handleControlStart);
    controls.addEventListener("end", handleControlEnd);

    // Lighting
    const ambientLight = new THREE.AmbientLight(isLight ? 0xffffff : 0x64748b, isLight ? 1.6 : 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isLight ? 1.4 : 1.6);
    dirLight1.position.set(250, 180, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(isLight ? 0xe2e8f0 : 0x1e293b, 0.9);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    // Earth Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf1f5f9 : 0x07090e,
      roughness: isLight ? 0.95 : 0.9,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const globeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globeSphere);

    // Atmospheric Glow Rim
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x94a3b8 : 0x1e293b,
      transparent: true,
      opacity: isLight ? 0.12 : 0.22,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // Latitude / Longitude Tactical Grid
    const gridPoints: THREE.Vector3[] = [];
    const gridRadius = GLOBE_RADIUS * 1.001;

    for (let lat = -80; lat <= 80; lat += 20) {
      const segs = 72;
      for (let s = 0; s < segs; s++) {
        const lng1 = (s / segs) * 360 - 180;
        const lng2 = ((s + 1) / segs) * 360 - 180;
        gridPoints.push(latLngToVector3(lat, lng1, gridRadius));
        gridPoints.push(latLngToVector3(lat, lng2, gridRadius));
      }
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const segs = 48;
      for (let s = 0; s < segs; s++) {
        const lat1 = (s / segs) * 180 - 90;
        const lat2 = ((s + 1) / segs) * 180 - 90;
        gridPoints.push(latLngToVector3(lat1, lng, gridRadius));
        gridPoints.push(latLngToVector3(lat2, lng, gridRadius));
      }
    }

    const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
    const gridMat = new THREE.LineBasicMaterial({
      color: isLight ? 0xcbd5e1 : 0x1f2937,
      transparent: true,
      opacity: isLight ? 0.6 : 0.45,
    });
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    scene.add(gridLines);
    gridLinesRef.current = gridLines;

    // Continent Vector Outlines
    const landPoints: THREE.Vector3[] = [];
    const landRadius = GLOBE_RADIUS * 1.002;

    for (const ring of (worldLandPolylines as number[][][])) {
      if (!Array.isArray(ring) || ring.length < 2) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = ring[i];
        const p2 = ring[i + 1];
        landPoints.push(latLngToVector3(p1[1], p1[0], landRadius));
        landPoints.push(latLngToVector3(p2[1], p2[0], landRadius));
      }
    }

    const landGeo = new THREE.BufferGeometry().setFromPoints(landPoints);
    const landMat = new THREE.LineBasicMaterial({
      color: isLight ? 0x334155 : 0x334155,
      transparent: true,
      opacity: isLight ? 0.95 : 0.75,
    });
    const landLines = new THREE.LineSegments(landGeo, landMat);
    scene.add(landLines);

    // Selection Pulsing Indicator Ring
    const ringGeo = new THREE.RingGeometry(2.4, 3.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.visible = false;
    scene.add(selectionRing);
    selectedRingRef.current = selectionRing;

    // Animation Loop
    let lastFrameTime = 0;
    let labelUpdateCounter = 0;
    const dummyMatrix = new THREE.Matrix4();

    const animate = (time: number) => {
      reqAnimIdRef.current = requestAnimationFrame(animate);
      const delta = (time - lastFrameTime) / 1000;
      lastFrameTime = time;

      // Handle smooth camera focus lerping
      if (targetCamPosRef.current && camera) {
        camera.position.lerp(targetCamPosRef.current, 0.06);
        if (camera.position.distanceTo(targetCamPosRef.current) < 1.0) {
          targetCamPosRef.current = null;
        }
      }

      controls.update();

      // Rotate selection ring gently
      if (selectedRingRef.current && selectedRingRef.current.visible) {
        selectedRingRef.current.rotation.z += delta * 1.6;
      }

      // Animate flowing pulses along real arcs
      if (arcParticlesRef.current && arcCurvesRef.current.length > 0) {
        const mesh = arcParticlesRef.current;
        const curves = arcCurvesRef.current;
        const numCurves = curves.length;
        const tBase = (time * 0.0003) % 1.0;

        for (let i = 0; i < numCurves; i++) {
          const t = (tBase + (i / numCurves)) % 1.0;
          const pt = curves[i].getPoint(t);
          dummyMatrix.setPosition(pt.x, pt.y, pt.z);
          mesh.setMatrixAt(i, dummyMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);

        // Update compass heading and 2D hub labels every frame for buttery smooth tracking
        labelUpdateCounter++;
        if (containerRef.current) {
          const camAngle = Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI);
          setCompassAngle(camAngle);

          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          const updatedLabels: { label: string; x: number; y: number; visible: boolean }[] = [];

          for (const hub of caseData.majorHubs) {
            const hub3d = latLngToVector3(hub.lat, hub.lng, GLOBE_RADIUS * 1.02);
            // Vector from hub to camera
            const toCam = camera.position.clone().sub(hub3d).normalize();
            // Surface normal at hub
            const norm = hub3d.clone().normalize();
            // Strict horizon occlusion check: only show if hub is facing the camera
            const facing = norm.dot(toCam);

            if (facing > 0.18) {
              const projected = hub3d.clone().project(camera);
              // Ensure projected coordinate is within screen viewport and not clipped
              if (
                projected.z < 1.0 &&
                projected.x >= -0.95 &&
                projected.x <= 0.95 &&
                projected.y >= -0.95 &&
                projected.y <= 0.95
              ) {
                const sx = ((projected.x + 1) / 2) * w;
                const sy = ((-projected.y + 1) / 2) * h;
                updatedLabels.push({
                  label: hub.label,
                  x: sx,
                  y: sy,
                  visible: true,
                });
              }
            }
          }
          setProjectedLabels(updatedLabels);
        }
      }
    };
    reqAnimIdRef.current = requestAnimationFrame(animate);

    // Dynamic ResizeObserver ensures globe remains perfectly centered when sidebar or window toggles
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      controls.removeEventListener("start", handleControlStart);
      controls.removeEventListener("end", handleControlEnd);
      if (resumeRotateTimerRef.current) window.clearTimeout(resumeRotateTimerRef.current);
      if (reqAnimIdRef.current) cancelAnimationFrame(reqAnimIdRef.current);
      controls.dispose();
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      landGeo.dispose();
      landMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [theme, caseData.majorHubs]);

  // Update Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Toggle Grid
  useEffect(() => {
    if (gridLinesRef.current) {
      gridLinesRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // 3. Mount Case-Scoped Nodes & Arcs into Scene with Visual Geometries
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const existingGroup = scene.getObjectByName("caseGroup");
    if (existingGroup) {
      scene.remove(existingGroup);
      existingGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.InstancedMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    }

    nodeMeshesRef.current.clear();
    arcCurvesRef.current = [];
    arcParticlesRef.current = null;

    const caseGroup = new THREE.Group();
    caseGroup.name = "caseGroup";

    // 1. Orbital Ring Guide for Unanchored Intelligence Layer
    const orbitPts: THREE.Vector3[] = [];
    const tilt = 18 * (Math.PI / 180);
    const orbitRadius = GLOBE_RADIUS * 1.28;
    for (let i = 0; i <= 64; i++) {
      const phi = (2 * Math.PI * i) / 64;
      const x = orbitRadius * Math.cos(phi);
      const y = orbitRadius * Math.sin(phi) * Math.sin(tilt);
      const z = orbitRadius * Math.sin(phi) * Math.cos(tilt);
      orbitPts.push(new THREE.Vector3(x, y, z));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat = new THREE.LineBasicMaterial({
      color: isLight ? 0x94a3b8 : 0x334155,
      transparent: true,
      opacity: isLight ? 0.45 : 0.3,
    });
    const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    caseGroup.add(orbitLine);

    // Geometries
    const keyPersonGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const personGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const unanchoredPersonGeo = new THREE.SphereGeometry(1.3, 14, 14);

    const phoneGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.6, 12);
    const unanchoredPhoneGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.9, 10);

    const accountGeo = new THREE.OctahedronGeometry(1.9, 0);
    const unanchoredAccountGeo = new THREE.OctahedronGeometry(1.3, 0);

    const orgGeo = new THREE.BoxGeometry(2.3, 2.3, 2.3);
    const unanchoredOrgGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);

    const firGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.7, 16);
    const unanchoredFirGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.5, 12);

    const locGeo = new THREE.ConeGeometry(1.8, 3.2, 12);
    const cameraGeo = new THREE.TetrahedronGeometry(1.8, 0);
    const unanchoredCameraGeo = new THREE.TetrahedronGeometry(1.3, 0);

    const vehicleGeo = new THREE.BoxGeometry(2.8, 1.3, 1.3);
    const unanchoredVehicleGeo = new THREE.BoxGeometry(2.0, 0.9, 0.9);

    // Semantic Materials - Consistent across Light & Dark Modes
    const personMat = new THREE.MeshStandardMaterial({
      color: 0xe21b23,
      emissive: 0xe21b23,
      emissiveIntensity: isLight ? 0.4 : 0.85,
      roughness: 0.2,
      metalness: 0.1,
    });
    const keyPersonMat = new THREE.MeshStandardMaterial({
      color: 0xff1e42,
      emissive: 0xff0033,
      emissiveIntensity: isLight ? 0.6 : 1.3,
      roughness: 0.1,
      metalness: 0.2,
    });
    const phoneMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: isLight ? 0.4 : 0.8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const accountMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x059669,
      emissiveIntensity: isLight ? 0.4 : 0.8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const orgMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xd97706,
      emissiveIntensity: isLight ? 0.4 : 0.8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const firMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xdc2626,
      emissiveIntensity: isLight ? 0.4 : 0.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    const locMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x334155 : 0x475569,
      emissive: isLight ? 0x1e293b : 0x64748b,
      emissiveIntensity: isLight ? 0.4 : 0.7,
      roughness: 0.3,
      metalness: 0.2,
    });
    const camMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      emissive: 0x0d9488,
      emissiveIntensity: isLight ? 0.4 : 0.8,
      roughness: 0.2,
      metalness: 0.2,
    });
    const vehMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x475569 : 0x52525b,
      emissive: isLight ? 0x334155 : 0x71717a,
      emissiveIntensity: isLight ? 0.4 : 0.7,
      roughness: 0.3,
      metalness: 0.2,
    });

    const getNodeVisuals = (gNode: GlobeNode) => {
      const isKey = gNode.isKeyNode || gNode.isMajorHub;
      const isAnchored = gNode.hasGeo;

      switch (gNode.type) {
        case "Person":
          return { geo: isKey ? keyPersonGeo : isAnchored ? personGeo : unanchoredPersonGeo, mat: isKey ? keyPersonMat : personMat };
        case "Phone":
          return { geo: isAnchored ? phoneGeo : unanchoredPhoneGeo, mat: phoneMat };
        case "Account":
          return { geo: isAnchored ? accountGeo : unanchoredAccountGeo, mat: accountMat };
        case "Organization":
          return { geo: isAnchored ? orgGeo : unanchoredOrgGeo, mat: orgMat };
        case "FIR":
          return { geo: isAnchored ? firGeo : unanchoredFirGeo, mat: firMat };
        case "Location":
          return { geo: locGeo, mat: locMat };
        case "Camera":
          return { geo: isAnchored ? cameraGeo : unanchoredCameraGeo, mat: camMat };
        case "Vehicle":
          return { geo: isAnchored ? vehicleGeo : unanchoredVehicleGeo, mat: vehMat };
        default:
          return { geo: isAnchored ? personGeo : unanchoredPersonGeo, mat: personMat };
      }
    };

    const get3DNodePosition = (gNode: GlobeNode): THREE.Vector3 => {
      if (gNode.hasGeo) {
        return latLngToVector3(gNode.lat, gNode.lng, GLOBE_RADIUS * 1.018);
      } else {
        const total = gNode.orbitalCount || 24;
        const idx = gNode.orbitalIndex || 0;
        const phi = (2 * Math.PI * idx) / total;
        const orbitR = GLOBE_RADIUS * 1.28;
        const orbitTilt = 18 * (Math.PI / 180);
        const x = orbitR * Math.cos(phi);
        const y = orbitR * Math.sin(phi) * Math.sin(orbitTilt);
        const z = orbitR * Math.sin(phi) * Math.cos(orbitTilt);
        return new THREE.Vector3(x, y, z);
      }
    };

    // A. Render ALL Case Nodes (Both Layer A Anchored & Layer B Orbital)
    for (const gNode of caseData.nodes) {
      // Filter by entity type if selected
      if (activeEntityFilter !== "ALL") {
        if (activeEntityFilter === "UNANCHORED") {
          if (gNode.hasGeo) continue;
        } else if (gNode.type !== activeEntityFilter) {
          continue;
        }
      }

      const { geo, mat } = getNodeVisuals(gNode);
      const mesh = new THREE.Mesh(geo, mat);
      const pos = get3DNodePosition(gNode);
      mesh.position.copy(pos);
      mesh.lookAt(0, 0, 0);

      if (gNode.type === "Location") {
        mesh.rotateX(Math.PI);
      }

      mesh.userData = { node: gNode };
      caseGroup.add(mesh);
      nodeMeshesRef.current.set(gNode.id, mesh);

      // Multi-tier Glowing radial pulse halos for hubs and key targets
      if (gNode.isKeyNode || gNode.isMajorHub) {
        const innerAuraGeo = new THREE.RingGeometry(2.2, 4.5, 32);
        const innerAuraMat = new THREE.MeshBasicMaterial({
          color: 0xff0033,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isLight ? 0.35 : 0.45,
        });
        const innerAuraMesh = new THREE.Mesh(innerAuraGeo, innerAuraMat);
        innerAuraMesh.position.copy(pos);
        innerAuraMesh.lookAt(0, 0, 0);
        caseGroup.add(innerAuraMesh);

        const outerAuraGeo = new THREE.RingGeometry(4.5, 8.5, 32);
        const outerAuraMat = new THREE.MeshBasicMaterial({
          color: 0xe21b23,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isLight ? 0.14 : 0.2,
        });
        const outerAuraMesh = new THREE.Mesh(outerAuraGeo, outerAuraMat);
        outerAuraMesh.position.copy(pos);
        outerAuraMesh.lookAt(0, 0, 0);
        caseGroup.add(outerAuraMesh);
      }
    }

    // B. Render All Relationships with Visual Hierarchy
    const arcCurves: THREE.QuadraticBezierCurve3[] = [];

    for (const arc of caseData.arcs) {
      const srcMesh = nodeMeshesRef.current.get(arc.source);
      const tgtMesh = nodeMeshesRef.current.get(arc.target);
      if (!srcMesh || !tgtMesh) continue;

      const v1 = srcMesh.position;
      const v2 = tgtMesh.position;
      const dist = v1.distanceTo(v2);
      if (dist < 0.5) continue;

      // Surface-to-surface arc (Both anchored)
      if (arc.sourceNode.hasGeo && arc.targetNode.hasGeo) {
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        const elevation = Math.min(32, Math.max(6, dist * 0.26));
        mid.normalize().multiplyScalar(GLOBE_RADIUS + elevation);

        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        arcCurves.push(curve);

        const points = curve.getPoints(32);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

        const isPrimary = arc.primaryType === "PAID" || arc.primaryType === "CALLED" || arc.isCrossRegional;
        let arcColor = 0xef4444;
        if (arc.primaryType === "PAID") arcColor = 0x10b981;
        else if (arc.primaryType === "CALLED") arcColor = 0x0284c7;

        const arcMat = new THREE.LineBasicMaterial({
          color: arcColor,
          transparent: true,
          opacity: isPrimary ? (isLight ? 0.85 : 0.9) : (isLight ? 0.45 : 0.4),
        });

        const line = new THREE.Line(arcGeo, arcMat);
        caseGroup.add(line);
      } else {
        // Orbital / Hybrid link
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const points = curve.getPoints(20);
        const edgeGeo = new THREE.BufferGeometry().setFromPoints(points);
        const edgeMat = new THREE.LineBasicMaterial({
          color: isLight ? 0x64748b : 0x475569,
          transparent: true,
          opacity: isLight ? 0.45 : 0.35,
        });
        const line = new THREE.Line(edgeGeo, edgeMat);
        caseGroup.add(line);
      }
    }

    arcCurvesRef.current = arcCurves;

    // C. Pulse Flow Particles on Primary Arcs
    if (arcCurves.length > 0) {
      const particleGeo = new THREE.SphereGeometry(0.85, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xff3355,
        transparent: true,
        opacity: 0.9,
      });
      const instancedParticles = new THREE.InstancedMesh(particleGeo, particleMat, arcCurves.length);
      instancedParticles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      caseGroup.add(instancedParticles);
      arcParticlesRef.current = instancedParticles;
    }

    scene.add(caseGroup);

    return () => {
      personGeo.dispose();
      keyPersonGeo.dispose();
      unanchoredPersonGeo.dispose();
      phoneGeo.dispose();
      unanchoredPhoneGeo.dispose();
      accountGeo.dispose();
      unanchoredAccountGeo.dispose();
      orgGeo.dispose();
      unanchoredOrgGeo.dispose();
      firGeo.dispose();
      unanchoredFirGeo.dispose();
      locGeo.dispose();
      cameraGeo.dispose();
      unanchoredCameraGeo.dispose();
      vehicleGeo.dispose();
      unanchoredVehicleGeo.dispose();
      orbitGeo.dispose();
      orbitMat.dispose();
      personMat.dispose();
      keyPersonMat.dispose();
      phoneMat.dispose();
      accountMat.dispose();
      orgMat.dispose();
      firMat.dispose();
      locMat.dispose();
      camMat.dispose();
      vehMat.dispose();
    };
  }, [caseData, activeEntityFilter, isLight]);

  // Selection Indicator Ring (positions the ring without forcibly pulling camera)
  useEffect(() => {
    if (!selectedRingRef.current) return;
    const ring = selectedRingRef.current;

    if (!selectedNodeId) {
      ring.visible = false;
      return;
    }

    const mesh = nodeMeshesRef.current.get(selectedNodeId);
    if (mesh) {
      ring.position.copy(mesh.position);
      ring.lookAt(0, 0, 0);
      ring.position.add(mesh.position.clone().normalize().multiplyScalar(0.2));
      ring.visible = true;
    } else {
      ring.visible = false;
    }
  }, [selectedNodeId, caseData]);

  // Smoothly re-frame globe ONCE when active case ID actually changes
  const prevCaseIdRef = useRef<string>(caseId);
  useEffect(() => {
    if (prevCaseIdRef.current !== caseId) {
      prevCaseIdRef.current = caseId;
      if (cameraRef.current && controlsRef.current) {
        targetCamPosRef.current = latLngToVector3(caseData.centerCoords.lat, caseData.centerCoords.lng, 260);
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [caseId, caseData.centerCoords]);

  // Raycasting
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const meshes = Array.from(nodeMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const topMesh = intersects[0].object as THREE.Mesh;
      const gNode: GlobeNode = topMesh.userData.node;
      setHoveredNode(gNode);
      setMouseScreenPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      container.style.cursor = "pointer";
    } else {
      setHoveredNode(null);
      setMouseScreenPos(null);
      container.style.cursor = "default";
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const meshes = Array.from(nodeMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const topMesh = intersects[0].object as THREE.Mesh;
      const gNode: GlobeNode = topMesh.userData.node;
      onSelectNode(gNode.id);
    } else {
      onSelectNode(null);
    }
  }, [onSelectNode]);

  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    targetCamPosRef.current = latLngToVector3(20.0, 72.0, 260);
    controlsRef.current.target.set(0, 0, 0);
  };

  const handleZoom = (dir: "in" | "out") => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    const factor = dir === "in" ? 0.85 : 1.15;
    cam.position.multiplyScalar(factor);
    cam.position.clampLength(125, 450);
  };

  const renderTypeIcon = (type: ObjectType) => {
    switch (type) {
      case "Person":
        return <User className="w-3.5 h-3.5 text-[#E21B23]" />;
      case "Phone":
        return <Smartphone className="w-3.5 h-3.5 text-[#0284C7]" />;
      case "Account":
        return <CreditCard className="w-3.5 h-3.5 text-[#059669]" />;
      case "Organization":
        return <Building2 className="w-3.5 h-3.5 text-[#D97706]" />;
      case "FIR":
        return <FileText className="w-3.5 h-3.5 text-[#DC2626]" />;
      case "Location":
        return <MapPin className="w-3.5 h-3.5 text-[#64748B]" />;
      case "Camera":
        return <CameraIcon className="w-3.5 h-3.5 text-[#0D9488]" />;
      case "Vehicle":
        return <Truck className="w-3.5 h-3.5 text-[#71717A]" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div
      className={`w-full h-full relative overflow-hidden select-none font-sans transition-colors duration-200 ${
        isLight ? "bg-[#F8FAFC] text-slate-900" : "bg-[#050607] text-[#F2F2F2]"
      }`}
    >
      {/* =========================================================================
          1. FULL-WIDTH 3D THREE.JS CANVAS BACKGROUND
          ========================================================================= */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      />

      {/* =========================================================================
          2. FLOATING CITY / HUB LABELS PROJECTED DIRECTLY OVER REAL 3D COORDINATES
          ========================================================================= */}
      {projectedLabels.map((pl) => (
        <div
          key={pl.label}
          className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${pl.x}px`,
            top: `${pl.y}px`,
            display: pl.visible ? "block" : "none",
          }}
        >
          <div
            className={`text-[11px] md:text-xs font-mono font-bold tracking-wider px-1 ${
              isLight
                ? "text-slate-900 drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]"
                : "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            }`}
          >
            {pl.label}
          </div>
        </div>
      ))}

      {/* =========================================================================
          3. RETRACTABLE FLOATING CASE SCOPE CARD (Top-Left Glassmorphic Overlay)
          ========================================================================= */}
      <div className="absolute top-3 left-3 z-20 transition-all duration-300 pointer-events-auto">
        {isCasePanelCollapsed ? (
          <button
            onClick={() => setIsCasePanelCollapsed(false)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xl text-xs font-mono font-bold cursor-pointer backdrop-blur-xl transition-all ${
              isLight
                ? "bg-white/95 hover:bg-slate-50 border-slate-300 text-slate-800 shadow-slate-300/50"
                : "bg-[#090C10]/90 hover:bg-[#151B23] border-white/10 text-white"
            }`}
            title="Expand Case Scope & Details"
          >
            <span className="w-2 h-2 rounded-full bg-[#E21B23] animate-pulse" />
            <span className="text-[11px] font-bold text-[#E21B23]">{caseId}</span>
            <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>• Case Scope</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#E21B23]" />
          </button>
        ) : (
          <div
            className={`rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 p-3.5 w-72 max-h-[calc(100vh-230px)] overflow-y-auto space-y-2.5 ${
              isLight
                ? "bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50"
                : "bg-[#090C10]/90 border-white/10 text-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-1.5 border-b border-zinc-500/20 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E21B23] shadow-[0_0_8px_#E21B23] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs md:text-sm font-bold truncate leading-tight">{caseName}</h3>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono truncate">{caseAgency}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                    isLight
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "bg-red-950/80 border-red-800/80 text-[#FF3038]"
                  }`}
                >
                  {caseId}
                </span>
                <button
                  onClick={() => setIsCasePanelCollapsed(true)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                    isLight
                      ? "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
                      : "text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                  }`}
                  title="Retract Case Panel"
                >
                  <span>Hide</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Case Summary Description */}
            <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-700" : "text-zinc-300"}`}>
              Financial routing network spanning India, UAE and South-East Asia. Links to front companies, hawala channels and coordinated transactions.
            </p>

            {/* 3 Metric Stat Tiles */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              <div className={`p-2 rounded-xl border ${isLight ? "bg-slate-100 border-slate-300" : "bg-[#0E1216]/90 border-[#20252A]"}`}>
                <div className="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase">ENTITIES</div>
                <div className={`text-sm font-bold mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>{caseData.nodes.length}</div>
              </div>
              <div className={`p-2 rounded-xl border ${isLight ? "bg-slate-100 border-slate-300" : "bg-[#0E1216]/90 border-[#20252A]"}`}>
                <div className="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase">RELATIONSHIPS</div>
                <div className="text-sm font-bold text-[#E21B23] mt-0.5">{caseData.arcs.length}</div>
              </div>
              <div className={`p-2 rounded-xl border ${isLight ? "bg-slate-100 border-slate-300" : "bg-[#0E1216]/90 border-[#20252A]"}`}>
                <div className="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase">LOCATIONS</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{caseData.geocodedCount}</div>
              </div>
            </div>

            {/* Unanchored notice */}
            {caseData.unanchoredCount > 0 && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-mono pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{caseData.unanchoredCount} unanchored entities (Orbital Layer)</span>
              </div>
            )}

            {/* Entity Types Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-500/20 font-mono text-[11px]">
              <div className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                ENTITY TYPES
              </div>
              <div className="space-y-1">
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
                    <span>Person</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Person}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                    <span>Phone</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Phone}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span>Account</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Account}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>Organization</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Organization}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    <span>FIR</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.FIR}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#475569]" />
                    <span>Location</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Location}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    <span>Camera</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Camera}</span>
                </div>
                <div className={`flex items-center justify-between ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#71717A]" />
                    <span>Vehicle</span>
                  </div>
                  <span className="font-bold">{entityTypeCounts.Vehicle}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. FLOATING TOP-CENTER ARCS FILTER PILLS
          ========================================================================= */}
      <div className="absolute top-3 right-4 z-40 flex items-center gap-1.5 flex-wrap pointer-events-auto">
        <div
          className={`flex items-center rounded-xl p-1 shadow-2xl text-xs font-mono border backdrop-blur-xl ${
            isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0B0F15]/85 border-white/10 text-white"
          }`}
        >
          <button
            onClick={() => setActiveLinkFilter("ALL")}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold ${
              activeLinkFilter === "ALL"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-slate-700 hover:bg-slate-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            All Arcs
          </button>
          <button
            onClick={() => setActiveLinkFilter("CALLS")}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-1 ${
              activeLinkFilter === "CALLS"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-slate-700 hover:bg-slate-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            <PhoneCall className="w-3 h-3 text-[#0284C7]" />
            <span>Calls</span>
          </button>
          <button
            onClick={() => setActiveLinkFilter("MONEY")}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-1 ${
              activeLinkFilter === "MONEY"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-slate-700 hover:bg-slate-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            <DollarSign className="w-3 h-3 text-[#059669]" />
            <span>Money</span>
          </button>
          <button
            onClick={() => setActiveLinkFilter("MOVEMENT")}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-1 ${
              activeLinkFilter === "MOVEMENT"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-slate-700 hover:bg-slate-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            <MapPin className="w-3 h-3 text-[#64748B]" />
            <span>Movement</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. FLOATING BOTTOM-CENTER ENTITY TYPE FILTER & LEGEND
          ========================================================================= */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 pointer-events-auto">
        <div
          className={`flex items-center rounded-xl p-1 shadow-2xl text-[11px] font-mono border backdrop-blur-xl overflow-x-auto max-w-[85vw] ${
            isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0B0F15]/85 border-white/10 text-white"
          }`}
        >
          <button
            onClick={() => setActiveEntityFilter("ALL")}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold ${
              activeEntityFilter === "ALL"
                ? "bg-[#E21B23] text-white"
                : isLight
                ? "text-slate-600 hover:text-slate-900"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All Entities
          </button>
          <button
            onClick={() => setActiveEntityFilter("Person")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Person"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
            <span>Persons</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Phone")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Phone"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
            <span>Phones</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Account")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Account"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>Accounts</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Organization")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Organization"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span>Organizations</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("FIR")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "FIR"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>FIRs</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Location")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Location"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#475569]" />
            <span>Locations</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Camera")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Camera"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <span>Cameras</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("Vehicle")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "Vehicle"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#71717A]" />
            <span>Vehicles</span>
          </button>
          <button
            onClick={() => setActiveEntityFilter("UNANCHORED")}
            className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeEntityFilter === "UNANCHORED"
                ? isLight ? "bg-slate-200 text-slate-900 font-bold" : "bg-[#20252A] text-white font-bold"
                : isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full border border-amber-500 bg-amber-500/30" />
            <span>Orbital</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          6. FLOATING TOP-RIGHT AUTO ROTATE TOGGLE & TACTICAL CONTROLS
          ========================================================================= */}
      <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Auto Rotate Button at Top Right */}
        <div
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xl text-xs font-mono cursor-pointer backdrop-blur-xl transition-all ${
            isLight
              ? "bg-white/95 hover:bg-slate-50 border-slate-300 text-slate-900 shadow-slate-300/50"
              : "bg-[#0B0F15]/90 hover:bg-[#151B23] border-white/10 text-white"
          }`}
          title="Toggle Auto Rotation"
        >
          <span className="font-bold text-[11px]">Auto Rotate</span>
          <div
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
              autoRotate ? "bg-[#E21B23] justify-end" : "bg-zinc-400 dark:bg-zinc-600 justify-start"
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-white shadow-md" />
          </div>
        </div>

        {/* Right Tactical Control Buttons (Compass, Zoom, Re-Center, Grid) */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-2xl cursor-pointer transition-colors backdrop-blur-xl ${
              isLight ? "border-slate-300 bg-white/95 hover:bg-slate-100 shadow-slate-300/50" : "border-white/10 bg-[#0A0D10]/90 hover:bg-[#20252A]"
            }`}
            title="Reset North Heading"
            onClick={handleResetView}
          >
            <Compass
              className="w-4 h-4 text-[#E21B23] transition-transform duration-100"
              style={{ transform: `rotate(${-compassAngle}deg)` }}
            />
          </div>

          <div
            className={`flex flex-col rounded-xl p-1 shadow-2xl gap-1 text-xs border backdrop-blur-xl ${
              isLight ? "bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/50" : "bg-[#0A0D10]/90 border-white/10 text-white"
            }`}
          >
            <button
              title="Zoom In"
              onClick={() => handleZoom("in")}
              className="p-1.5 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              title="Zoom Out"
              onClick={() => handleZoom("out")}
              className="p-1.5 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className={`h-[1px] my-0.5 ${isLight ? "bg-slate-200" : "bg-zinc-800"}`} />
            <button
              title="Re-Center Globe View"
              onClick={handleResetView}
              className="p-1.5 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer text-[#E21B23]"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              title="Toggle Latitude / Longitude Grid"
              onClick={() => setShowGrid((prev) => !prev)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showGrid
                  ? isLight
                    ? "bg-slate-200 text-black font-bold"
                    : "bg-[#20252A] text-white font-bold"
                  : "hover:bg-zinc-500/20"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. HOVER TACTICAL INTELLIGENCE TOOLTIP
          ========================================================================= */}
      {hoveredNode && mouseScreenPos && (
        <div
          className={`absolute pointer-events-none z-30 p-3 rounded-xl border shadow-2xl text-xs font-mono max-w-xs transition-transform duration-75 backdrop-blur-xl ${
            isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0A0D10]/95 border-white/10 text-white"
          }`}
          style={{
            transform: `translate(${mouseScreenPos.x + 16}px, ${mouseScreenPos.y + 16}px)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5 border-zinc-500/20">
            <div className="flex items-center gap-1.5">
              {renderTypeIcon(hoveredNode.type)}
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                isLight ? "bg-slate-100 text-slate-800 border border-slate-300" : "bg-zinc-800 text-zinc-200 border border-zinc-700"
              }`}>
                {hoveredNode.type}
              </span>
            </div>
            {hoveredNode.isKeyNode && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E21B23] text-white font-bold">
                KEY TARGET
              </span>
            )}
            {!hoveredNode.hasGeo && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-700 text-amber-300 font-bold">
                UNANCHORED
              </span>
            )}
          </div>

          <div className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{hoveredNode.label}</div>
          <div className="text-[10px] text-zinc-500 truncate font-mono">{hoveredNode.id}</div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-500/20 text-[10px]">
            <div>
              <span className="text-zinc-500">Case: </span>
              <span className="font-bold text-[#E21B23]">{caseId}</span>
            </div>
            {hoveredNode.degree !== undefined && (
              <div>
                <span className="text-zinc-500">Degree: </span>
                <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{hoveredNode.degree}</span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-1.5 border-t border-zinc-500/20 flex items-center gap-1 text-[10px]">
            <MapPin className="w-3 h-3 shrink-0 text-[#E21B23]" />
            <span className={`truncate font-semibold ${hoveredNode.hasGeo ? "text-[#E21B23]" : "text-amber-600 dark:text-amber-400"}`}>
              {hoveredNode.locationName}
            </span>
          </div>

          <div className="mt-2 text-[9px] text-[#E21B23] font-bold tracking-wider text-right">
            CLICK TO SELECT & SYNC DOSSIER ›
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobeCanvas;
