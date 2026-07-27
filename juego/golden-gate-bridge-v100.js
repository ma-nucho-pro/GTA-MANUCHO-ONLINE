import * as THREE from './bosque/libs/three.module.js';

// ============================================================
// GOLDEN GATE BRIDGE - Función completa lista para insertar
// en otro proyecto Three.js. Requiere que THREE ya esté cargado.
// ============================================================

// Color "International Orange" del puente
const bridgeColor = 0xc0362c;

// Llama a buildBridge(scene) pasando tu escena Three.js existente
export function buildBridge(scene) {
    const bridgeGroup = new THREE.Group();

    // Especificaciones del puente (proporciones aproximadas)
    const spanLength = 1200; // Distancia entre torres
    const towerHeight = 250; // Altura sobre el agua
    const towerWidth = 60;
    const towerDepth = 30;
    const roadWidth = 45;
    const roadHeight = 75; // Altura de la carretera sobre el agua
    const sideSpanLength = 600;

    // Materiales
    const materialOrange = new THREE.MeshStandardMaterial({
        color: bridgeColor,
        roughness: 0.6,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const materialRoad = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });
    const materialConcrete = new THREE.MeshStandardMaterial({
        color: 0xc4c4c4,
        roughness: 0.9,
        metalness: 0.05
    });

    // 1. Bases de concreto (anclajes y pilares de torre)
    const createBase = (x, z, width, length, height, isAnchor = false) => {
        const geo = new THREE.BoxGeometry(width, height, length);
        const mesh = new THREE.Mesh(geo, materialConcrete);
        mesh.position.set(x, height / 2 - 10, z);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        if (!isAnchor) {
            const detailGeo = new THREE.BoxGeometry(width * 1.1, height * 0.8, length * 0.8);
            const detailMesh = new THREE.Mesh(detailGeo, materialConcrete);
            detailMesh.position.set(0, 0, 0);
            mesh.add(detailMesh);
        }
        return mesh;
    };

    bridgeGroup.add(createBase(-spanLength / 2, 0, 80, 100, 40));
    bridgeGroup.add(createBase(spanLength / 2, 0, 80, 100, 40));
    bridgeGroup.add(createBase(-spanLength / 2 - sideSpanLength - 120, 0, 100, 150, 90, true));
    bridgeGroup.add(createBase(spanLength / 2 + sideSpanLength + 120, 0, 100, 150, 90, true));

    // 2. Torres detalladas
    const createTower = (xPos) => {
        const towerGroup = new THREE.Group();

        const createLeg = (zOffset) => {
            const legGroup = new THREE.Group();

            const bottomGeo = new THREE.BoxGeometry(towerDepth, roadHeight, towerWidth * 0.35);
            const bottom = new THREE.Mesh(bottomGeo, materialOrange);
            bottom.position.set(0, roadHeight / 2, zOffset);
            bottom.castShadow = true; bottom.receiveShadow = true;

            const midGeo = new THREE.BoxGeometry(towerDepth * 0.8, (towerHeight - roadHeight) * 0.6, towerWidth * 0.25);
            const mid = new THREE.Mesh(midGeo, materialOrange);
            mid.position.set(0, roadHeight + ((towerHeight - roadHeight) * 0.6) / 2, zOffset);
            mid.castShadow = true; mid.receiveShadow = true;

            const topGeo = new THREE.BoxGeometry(towerDepth * 0.6, (towerHeight - roadHeight) * 0.4 + 20, towerWidth * 0.2);
            const top = new THREE.Mesh(topGeo, materialOrange);
            top.position.set(0, roadHeight + (towerHeight - roadHeight) * 0.6 + ((towerHeight - roadHeight) * 0.4 + 20) / 2, zOffset);
            top.castShadow = true; top.receiveShadow = true;

            const ribMat = new THREE.MeshStandardMaterial({ color: bridgeColor, roughness: 0.7, metalness: 0.1 });
            const ribGeo = new THREE.PlaneGeometry(2, towerHeight);
            const rib1 = new THREE.Mesh(ribGeo, ribMat);
            rib1.position.set(towerDepth / 2 + 0.1, towerHeight / 2, zOffset - 2);
            rib1.rotation.y = Math.PI / 2;
            const rib2 = rib1.clone();
            rib2.position.set(towerDepth / 2 + 0.1, towerHeight / 2, zOffset + 2);

            legGroup.add(bottom, mid, top, rib1, rib2);
            return legGroup;
        };

        const legLeft = createLeg(towerWidth / 2 - (towerWidth * 0.15));
        const legRight = createLeg(-towerWidth / 2 + (towerWidth * 0.15));
        towerGroup.add(legLeft, legRight);

        const createStrut = (yPos, height, type) => {
            const strutGroup = new THREE.Group();
            const width = towerWidth * 0.8;

            const beamGeo = new THREE.BoxGeometry(towerDepth * 0.7, height * 0.2, width);
            const beam = new THREE.Mesh(beamGeo, materialOrange);
            beam.position.set(0, yPos, 0);
            beam.castShadow = true; beam.receiveShadow = true;
            strutGroup.add(beam);

            if (type === 'arch') {
                const archShape = new THREE.Shape();
                const innerW = width * 0.7;
                archShape.moveTo(-innerW / 2, 0);
                archShape.lineTo(-innerW / 2, height * 0.5);
                archShape.quadraticCurveTo(0, height, innerW / 2, height * 0.5);
                archShape.lineTo(innerW / 2, 0);
                archShape.lineTo(-innerW / 2, 0);

                const outerShape = new THREE.Shape();
                outerShape.moveTo(-width / 2, 0);
                outerShape.lineTo(-width / 2, height);
                outerShape.lineTo(width / 2, height);
                outerShape.lineTo(width / 2, 0);
                outerShape.holes.push(archShape);

                const extrudeSettings = { depth: towerDepth * 0.5, bevelEnabled: false };
                const archGeo = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);

                const archMesh = new THREE.Mesh(archGeo, materialOrange);
                archMesh.position.set(0, yPos, -width / 2);
                archMesh.rotation.y = Math.PI / 2;
                archMesh.position.z = -towerDepth * 0.25;

                archMesh.castShadow = true; archMesh.receiveShadow = true;
                strutGroup.add(archMesh);

            } else if (type === 'x-brace') {
                const braceHeight = height;
                const braceWidth = width * 0.8;

                const diag1Length = Math.sqrt(braceWidth * braceWidth + braceHeight * braceHeight);
                const angle1 = Math.atan2(braceHeight, braceWidth);
                const diagGeo = new THREE.BoxGeometry(towerDepth * 0.5, 4, diag1Length);

                const diag1 = new THREE.Mesh(diagGeo, materialOrange);
                diag1.position.set(0, yPos + braceHeight / 2, 0);
                diag1.rotation.x = angle1;
                diag1.castShadow = true;

                const diag2 = new THREE.Mesh(diagGeo, materialOrange);
                diag2.position.set(0, yPos + braceHeight / 2, 0);
                diag2.rotation.x = -angle1;
                diag2.castShadow = true;

                strutGroup.add(diag1, diag2);

                const topBoxGeo = new THREE.BoxGeometry(towerDepth * 0.6, 6, width);
                const topBox = new THREE.Mesh(topBoxGeo, materialOrange);
                topBox.position.set(0, yPos + braceHeight, 0);
                strutGroup.add(topBox);
            }

            return strutGroup;
        };

        towerGroup.add(createStrut(roadHeight * 0.2, roadHeight * 0.7, 'x-brace'));
        towerGroup.add(createStrut(roadHeight, (towerHeight - roadHeight) * 0.25, 'arch'));
        const midStrutHeight = (towerHeight - roadHeight) * 0.15;
        const midStrutY = roadHeight + (towerHeight - roadHeight) * 0.45;
        const midStrutGeo = new THREE.BoxGeometry(towerDepth * 0.6, midStrutHeight, towerWidth * 0.8);
        const midStrut = new THREE.Mesh(midStrutGeo, materialOrange);
        midStrut.position.set(0, midStrutY, 0);
        midStrut.castShadow = true;
        towerGroup.add(midStrut);

        towerGroup.add(createStrut(towerHeight - 40, 35, 'arch'));

        towerGroup.position.set(xPos, 0, 0);
        return towerGroup;
    };

    bridgeGroup.add(createTower(-spanLength / 2));
    bridgeGroup.add(createTower(spanLength / 2));

    // 3. Cubierta (carretera) y sistema de armadura
    const totalLength = spanLength + (sideSpanLength * 2);

    const deckGeo = new THREE.BoxGeometry(totalLength, 2, roadWidth);
    const deck = new THREE.Mesh(deckGeo, materialRoad);
    deck.position.set(0, roadHeight, 0);
    deck.castShadow = true; deck.receiveShadow = true;
    bridgeGroup.add(deck);

    const sidewalkGeo = new THREE.BoxGeometry(totalLength, 3, 2);
    const swMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const sw1 = new THREE.Mesh(sidewalkGeo, swMat);
    sw1.position.set(0, roadHeight + 1, roadWidth / 2 - 1);
    const sw2 = new THREE.Mesh(sidewalkGeo, swMat);
    sw2.position.set(0, roadHeight + 1, -roadWidth / 2 + 1);
    bridgeGroup.add(sw1, sw2);

    const trussDepth = 8;
    const createTruss = () => {
        const trussGroup = new THREE.Group();
        const chordGeo = new THREE.BoxGeometry(totalLength, 0.5, 0.5);
        const bottomChord1 = new THREE.Mesh(chordGeo, materialOrange);
        bottomChord1.position.set(0, roadHeight - trussDepth, roadWidth / 2 - 1);
        const bottomChord2 = new THREE.Mesh(chordGeo, materialOrange);
        bottomChord2.position.set(0, roadHeight - trussDepth, -roadWidth / 2 + 1);
        trussGroup.add(bottomChord1, bottomChord2);

        const trussBoxGeo = new THREE.BoxGeometry(totalLength, trussDepth, roadWidth - 2);
        const solidTrussMat = new THREE.MeshStandardMaterial({ color: 0x8a241c, roughness: 0.8 });
        const trussBody = new THREE.Mesh(trussBoxGeo, solidTrussMat);
        trussBody.position.set(0, roadHeight - trussDepth / 2, 0);

        const stiffenerGeo = new THREE.BoxGeometry(1, trussDepth, roadWidth - 1.5);
        const stiffenerMat = new THREE.MeshStandardMaterial({ color: bridgeColor });
        for (let x = -totalLength / 2 + 10; x < totalLength / 2; x += 20) {
            const stiffener = new THREE.Mesh(stiffenerGeo, stiffenerMat);
            stiffener.position.set(x, roadHeight - trussDepth / 2, 0);
            trussGroup.add(stiffener);
        }

        trussGroup.add(trussBody);
        return trussGroup;
    };
    bridgeGroup.add(createTruss());

    // 4. Cables principales
    const cableRadius = 1.5;
    const cableZOffset = roadWidth / 2 - 0.5;

    const createMainCable = (zOffset) => {
        const curvePts = [];
        curvePts.push(new THREE.Vector3(-spanLength / 2 - sideSpanLength - 80, roadHeight - 10, zOffset));

        for (let i = 1; i <= 10; i++) {
            const t = i / 10;
            const x = -spanLength / 2 - sideSpanLength * (1 - t);
            const y = (roadHeight) + (towerHeight + 10 - roadHeight) * (t * t);
            curvePts.push(new THREE.Vector3(x, y, zOffset));
        }

        for (let i = 1; i <= 20; i++) {
            const t = i / 21;
            const x = -spanLength / 2 + spanLength * t;
            const tMapped = (t - 0.5) * 2;
            const y = roadHeight + 5 + (towerHeight + 10 - roadHeight - 5) * (tMapped * tMapped);
            curvePts.push(new THREE.Vector3(x, y, zOffset));
        }

        for (let i = 0; i < 10; i++) {
            const t = i / 10;
            const x = spanLength / 2 + sideSpanLength * t;
            const y = (towerHeight + 10) - (towerHeight + 10 - roadHeight + 10) * (t * t);
            curvePts.push(new THREE.Vector3(x, y, zOffset));
        }
        curvePts.push(new THREE.Vector3(spanLength / 2 + sideSpanLength + 80, roadHeight - 10, zOffset));

        const curve = new THREE.CatmullRomCurve3(curvePts);
        const tubeGeo = new THREE.TubeGeometry(curve, 150, cableRadius, 12, false);
        const cableMesh = new THREE.Mesh(tubeGeo, materialOrange);
        cableMesh.castShadow = true;

        return { mesh: cableMesh, curve: curve };
    };

    const cableLeft = createMainCable(cableZOffset);
    const cableRight = createMainCable(-cableZOffset);
    bridgeGroup.add(cableLeft.mesh, cableRight.mesh);

    // 5. Tirantes verticales y farolas
    const createDetails = (cableCurve, zOffset) => {
        const detailsGroup = new THREE.Group();
        const suspenderGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 4);
        const lightPoleGeo = new THREE.CylinderGeometry(0.15, 0.25, 6, 8);
        const lightBulbGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffddaa });

        const numSuspenders = 100;
        for (let i = 1; i < numSuspenders; i++) {
            const t = i / numSuspenders;
            const cablePt = cableCurve.getPointAt(t);

            if (cablePt.y > roadHeight + 3 && Math.abs(cablePt.x) !== spanLength / 2) {
                const suspHeight = cablePt.y - roadHeight;
                const susp = new THREE.Mesh(suspenderGeo, materialOrange);

                susp.scale.y = suspHeight;
                susp.position.set(cablePt.x, roadHeight + suspHeight / 2, zOffset);
                susp.castShadow = true;
                detailsGroup.add(susp);

                if (i % 3 === 0) {
                    const pole = new THREE.Mesh(lightPoleGeo, materialConcrete);
                    pole.position.set(cablePt.x, roadHeight + 3, zOffset > 0 ? zOffset - 2 : zOffset + 2);

                    const armGeo = new THREE.BoxGeometry(2, 0.2, 0.2);
                    const arm = new THREE.Mesh(armGeo, materialConcrete);
                    arm.position.set(cablePt.x, roadHeight + 6, pole.position.z + (zOffset > 0 ? -1 : 1));
                    arm.rotation.y = Math.PI / 2;

                    const bulb = new THREE.Mesh(lightBulbGeo, lightMat);
                    bulb.position.set(arm.position.x, arm.position.y - 0.2, arm.position.z + (zOffset > 0 ? -1 : 1));

                    detailsGroup.add(pole, arm, bulb);
                }
            }
        }
        return detailsGroup;
    };

    bridgeGroup.add(createDetails(cableLeft.curve, cableZOffset));
    bridgeGroup.add(createDetails(cableRight.curve, -cableZOffset));

    // Sube todo el puente un poco para que las bases queden en el agua
    bridgeGroup.position.y = 5;
    scene.add(bridgeGroup);

    return bridgeGroup; // Por si quieres mover/rotar/escalar el puente completo
}

// ============================================================================
// Integración GTA MANUCHO V100
// La geometría anterior es exactamente la entregada por el usuario. Esta capa
// únicamente la coloca entre las dos islas y añade superficies manejables.
// ============================================================================

const WATER_LEVEL = -14 * 16;
const BRIDGE_SCALE = 3.4;
// V102: EL PUENTE SUBE. Estaba a y=-219 y con la escala 3.4 su pista quedaba a
// y=53, mientras las palmeras de las islas llegan a y~149: la palmera atravesaba
// la calzada. Subiéndolo 197 unidades la pista queda a y=250, unos 100 por
// encima de la palmera más alta, y se pasa por debajo del puente con la balsa.
const BRIDGE_CENTER = new THREE.Vector3(320, WATER_LEVEL + 202, 34720);
const BRIDGE_YAW = -Math.atan2(36640 - 32800, 3920 - (-3280));
const tempWorld = new THREE.Vector3();
const tempLocal = new THREE.Vector3();
let game = null;
let bridge = null;
let originalGetGroundY = null;
let installed = false;
let bridgeLights = [];

// Cota LOCAL del final de la rampa. En mundo debe caer sobre la arena de las
// islas (y ~ -48), y el grupo está a WATER_LEVEL+202 con escala 3.4.
// V106: la rampa terminaba EXACTAMENTE en y=-48, que es la cota de la cima de
// la isla. Dos superficies en el mismo plano se pelean por el mismo píxel
// (z-fighting) y eso es el parpadeo que se ve en la isla del norte, bajo el
// puente. Ahora muere 34 unidades por encima de la arena: se sigue pudiendo
// subir sin problema y ya no hay dos caras compitiendo.
const RAMP_END_LOCAL_Y = ((-48 + 34) - (WATER_LEVEL + 202)) / BRIDGE_SCALE - 5;

function cableHeightAt(localX) {
    const distance = Math.abs(localX);
    if (distance <= 600) {
        const t = distance / 600;
        return 80 + (260 - 80) * t * t;
    }
    if (distance <= 1280) {
        const t = (1280 - distance) / 680;
        return 65 + (260 - 65) * t * t;
    }
    return -Infinity;
}

function localSurfaceAt(localX, localZ) {
    // Los dos cables principales son caminos estrechos. Al salir de sus 2.8 m
    // locales de anchura ya no hay suelo: la moto pierde el equilibrio y cae.
    const nearCable = Math.min(Math.abs(localZ - 22), Math.abs(localZ + 22));
    if (nearCable <= 2.8 && Math.abs(localX) <= 1280) {
        return cableHeightAt(localX) + 1.5;
    }
    if (Math.abs(localX) <= 1200 && Math.abs(localZ) <= 22.5) return 76.5;
    // V102: la rampa es más larga (1200 -> 1660 local, unos 1560 mundo) porque
    // ahora tiene que bajar desde una pista mucho más alta hasta la arena de la
    // isla. La pendiente resultante es del 13 %, subible de sobra en moto.
    if (Math.abs(localX) > 1200 && Math.abs(localX) <= 1660 && Math.abs(localZ) <= 22.5) {
        const t = (Math.abs(localX) - 1200) / 460;
        return 76.5 - (76.5 - RAMP_END_LOCAL_Y) * t;
    }
    return -Infinity;
}

function worldToBridgeLocal(x, z) {
    if (!bridge) return tempLocal.set(Infinity, 0, Infinity);
    tempWorld.set(x, bridge.position.y, z);
    tempLocal.copy(tempWorld);
    bridge.worldToLocal(tempLocal);
    return tempLocal;
}

function surfaceAt(x, z) {
    if (!bridge) return -Infinity;
    const local = worldToBridgeLocal(x, z);
    const localY = localSurfaceAt(local.x, local.z);
    if (!Number.isFinite(localY)) return -Infinity;
    tempLocal.set(local.x, localY, local.z);
    bridge.localToWorld(tempLocal);
    return tempLocal.y;
}

function containsAirspace(x, z) {
    if (!bridge) return false;
    const local = worldToBridgeLocal(x, z);
    return Math.abs(local.x) <= 1700 && Math.abs(local.z) <= 95;
}

function addApproachRamps() {
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });
    // Refuerzo contra el parpadeo: la calzada gana siempre el desempate.
    if (roadMaterial) {
        roadMaterial.polygonOffset = true;
        roadMaterial.polygonOffsetFactor = -4;
        roadMaterial.polygonOffsetUnits = -4;
        roadMaterial.needsUpdate = true;
    }
    const drop = 76.5 - RAMP_END_LOCAL_Y;
    const length = Math.hypot(460, drop);
    const angle = Math.atan2(drop, 460);
    for (const side of [-1, 1]) {
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(length, 2.2, 45), roadMaterial);
        ramp.name = side < 0 ? 'ACCESO_OESTE_GOLDEN_GATE' : 'ACCESO_ESTE_GOLDEN_GATE';
        ramp.position.set(side * 1430, (76.5 + RAMP_END_LOCAL_Y) / 2, 0);
        ramp.rotation.z = side < 0 ? angle : -angle;
        ramp.receiveShadow = true;
        bridge.add(ramp);
    }
}

function optimizeBridge() {
    const lowPower = (navigator.hardwareConcurrency || 4) <= 4 ||
        Number(navigator.deviceMemory || 8) <= 4;
    bridge.traverse(object => {
        if (!object.isMesh) return;
        object.frustumCulled = true;
        if (lowPower) object.castShadow = false;
    });
}

function addNightLights() {
    const count = (navigator.hardwareConcurrency || 4) <= 4 ? 4 : 8;
    for (let i = 0; i < count; i++) {
        const light = new THREE.PointLight(0xffb15a, 0, 520, 2);
        const t = count === 1 ? 0 : i / (count - 1);
        light.position.set(-1120 + t * 2240, 83, 0);
        bridge.add(light);
        bridgeLights.push(light);
    }
}

function patchGround() {
    if (game.__v100GoldenGateGroundPatched || typeof game.getGroundY !== 'function') return;
    game.__v100GoldenGateGroundPatched = true;
    originalGetGroundY = game.getGroundY.bind(game);
    game.getGroundY = function v100GoldenGateGround(x, y, z, strict = true) {
        let base;
        try { base = originalGetGroundY(x, y, z, strict); } catch { base = -Infinity; }
        const bridgeY = surfaceAt(x, z);
        if (!Number.isFinite(bridgeY) || Number(y) < bridgeY - 140) return base;
        return Math.max(Number.isFinite(base) ? base : -Infinity, bridgeY);
    };
}

function updateLights() {
    if (!Number.isFinite(game?.gameTimeMinutes)) return;
    const hour = ((game.gameTimeMinutes % 1440) + 1440) % 1440 / 60;
    const intensity = hour >= 19 || hour < 6 ? 2.1 : 0;
    for (const light of bridgeLights) light.intensity = intensity;
}

function install() {
    if (installed) return true;
    game = window.__VICE_CITY_GAME__;
    if (!game?.scene || typeof game.getGroundY !== 'function') return false;
    installed = true;
    bridge = buildBridge(game.scene);
    bridge.name = 'GOLDEN_GATE_ADJUNTO_V100';
    bridge.position.copy(BRIDGE_CENTER);
    bridge.rotation.y = BRIDGE_YAW;
    bridge.scale.setScalar(BRIDGE_SCALE);
    bridge.updateMatrixWorld(true);
    addApproachRamps();
    addNightLights();
    optimizeBridge();
    patchGround();
    window.__GTA_GOLDEN_GATE__ = {
        bridge,
        surfaceAt,
        containsAirspace,
        get roadHeight() { return BRIDGE_CENTER.y + 76.5 * BRIDGE_SCALE; }
    };
    setInterval(updateLights, 1000);
    updateLights();
    return true;
}

const wait = setInterval(() => {
    if (!install()) return;
    clearInterval(wait);
}, 180);
setTimeout(() => clearInterval(wait), 30000);
