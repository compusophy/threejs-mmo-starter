// 3D Game System for Simple Runescape - Version 1.9.2
class Game3D {
    constructor() {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error('Three.js is not loaded! Please check your internet connection and refresh the page.');
            return;
        }

        console.log('🎮 Three.js version:', THREE.REVISION);
        console.log('🎮 Game3D constructor called - Version 1.9.2 - CLEAN INTERFACE - NO MODALS');
        console.log('🎮 File loaded at:', new Date().toISOString());

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.world = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.gameObjects = [];
        this.enemies = [];
        this.npcs = [];
        this.targetPosition = null;
        this.isMoving = false;
        this.moveSpeed = 0.15; // Increased for more responsive movement
        this.destinationMarker = null;
        this.cameraLookAtTarget = null; // For smooth camera look-at interpolation
        this.lastTime = 0; // For delta time calculations

        // Pathfinding state
        this.pathPoints = [];
        this.currentPathIndex = 0;

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Isometric Camera setup (Orthographic)
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 50;

        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,    // Increased near clipping plane
            1000
        );

        // ISOMETRIC CAMERA: View from south at an angle
        this.camera.position.set(0, 45, 45); // Position south of origin, elevated
        this.camera.lookAt(0, 0, 0); // Looking at origin from isometric angle

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        this.setupLighting();

        // World generation
        this.createWorld();

        // Player character
        this.createPlayer();

        // UI - Only minimap, no HUD
        this.createMinimap();

        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun) - angled for isometric feel
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Add fog for atmospheric depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
    }

    createWorld() {
        // Ground plane with isometric grid (larger and properly positioned)
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0; // Ground at Y=0 for top-down view
        ground.receiveShadow = true;
        ground.userData = { isGround: true, type: 'ground' };
        this.scene.add(ground);


        // Store ground reference for raycasting
        this.ground = ground;

        // Add some basic structures
        this.createBuildings();
        this.createTrees();
        this.createWater();

        // Add world boundaries (walls)
        this.createWorldBoundaries();
    }


    createBuildings() {
        // Lumbridge Castle
        const castleGeometry = new THREE.BoxGeometry(8, 12, 8);
        const castleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const castle = new THREE.Mesh(castleGeometry, castleMaterial);
        castle.position.set(0, 6, -20);
        castle.castShadow = true;
        castle.userData = { type: 'building', buildingType: 'castle', name: 'Lumbridge Castle' };
        this.scene.add(castle);

        // Add castle walls
        for (let i = 0; i < 4; i++) {
            const wallGeometry = new THREE.BoxGeometry(0.5, 8, 8);
            const wall = new THREE.Mesh(wallGeometry, castleMaterial);
            wall.position.set(
                Math.cos(i * Math.PI / 2) * 4,
                4,
                Math.sin(i * Math.PI / 2) * 4 - 20
            );
            wall.castShadow = true;
            wall.userData = { type: 'building', buildingType: 'castle_wall', wallIndex: i };
            this.scene.add(wall);
        }
    }

    createTrees() {
        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6);
        const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const leavesGeometry = new THREE.SphereGeometry(3);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });

        // Store tree positions for collision checking
        this.treePositions = [];
        const minTreeDistance = 8; // Minimum distance between trees
        const maxAttempts = 50; // Max attempts to find valid position

        for (let i = 0; i < 20; i++) {
            let validPosition = false;
            let attempts = 0;
            let treeX, treeZ;

            // Try to find a valid position that doesn't overlap with existing trees
            while (!validPosition && attempts < maxAttempts) {
                treeX = (Math.random() - 0.5) * 80;
                treeZ = (Math.random() - 0.5) * 80;

                validPosition = true;
                // Check distance from all existing trees
                for (const existingPos of this.treePositions) {
                    const distance = Math.sqrt(
                        Math.pow(treeX - existingPos.x, 2) +
                        Math.pow(treeZ - existingPos.z, 2)
                    );
                    if (distance < minTreeDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }

            // If we couldn't find a valid position, skip this tree
            if (!validPosition) {
                console.warn(`Could not find valid position for tree ${i} after ${maxAttempts} attempts`);
                continue;
            }

            // Store the position for future collision checks
            this.treePositions.push({ x: treeX, z: treeZ });

            // Tree trunk
            const trunk = new THREE.Mesh(treeGeometry, treeMaterial);
            trunk.position.set(treeX, 3, treeZ);
            trunk.castShadow = true;
            trunk.userData = { type: 'tree', id: i, collisionRadius: 2.5 };
            this.scene.add(trunk);

            // Tree leaves
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(treeX, 3 + 4, treeZ);
            leaves.castShadow = true;
            leaves.userData = { type: 'tree_leaves', treeId: i, collisionRadius: 3 };
            this.scene.add(leaves);
        }

        console.log(`Created ${this.treePositions.length} trees with proper spacing`);
    }

    createWater() {
        const waterGeometry = new THREE.PlaneGeometry(15, 10);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x4169E1,
            transparent: true,
            opacity: 0.7
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(30, 0.1, 0);
        water.userData = { type: 'water', name: 'River' };
        this.scene.add(water);
    }

    createWorldBoundaries() {
        const wallHeight = 8;
        const wallThickness = 2;
        const worldSize = 200;
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown like ground

        // North wall (positive Z)
        const northWallGeometry = new THREE.BoxGeometry(worldSize + wallThickness * 2, wallHeight, wallThickness);
        const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, wallHeight / 2, worldSize / 2 + wallThickness / 2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        northWall.userData = { type: 'wall', boundary: 'north' };
        this.scene.add(northWall);

        // South wall (negative Z)
        const southWallGeometry = new THREE.BoxGeometry(worldSize + wallThickness * 2, wallHeight, wallThickness);
        const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight / 2, -worldSize / 2 - wallThickness / 2);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        southWall.userData = { type: 'wall', boundary: 'south' };
        this.scene.add(southWall);

        // East wall (positive X)
        const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, worldSize);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(worldSize / 2 + wallThickness / 2, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        eastWall.userData = { type: 'wall', boundary: 'east' };
        this.scene.add(eastWall);

        // West wall (negative X)
        const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, worldSize);
        const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-worldSize / 2 - wallThickness / 2, wallHeight / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        westWall.userData = { type: 'wall', boundary: 'west' };
        this.scene.add(westWall);

        // Store wall references for collision detection
        this.worldWalls = [northWall, southWall, eastWall, westWall];
    }

    createPlayer() {
        // More realistic human proportions (total height ~1.8 units)
        const totalHeight = 1.8;
        const headHeight = totalHeight / 7; // ~0.257 (larger head)
        const torsoHeight = totalHeight * 0.32; // ~0.576 (slightly shorter torso)
        const armLength = totalHeight * 0.44; // ~0.792 (proportionate arms)
        const legLength = totalHeight * 0.54; // ~0.972 (longer legs)

        // Player character group with realistic human proportions
        this.player = new THREE.Group();

        // Calculate the exact Y offset needed so feet touch ground at Y=0
        // The feet are positioned at: -(legLength * 0.5) - (legLength * 0.45) - 0.04 from hip
        const feetOffset = (legLength * 0.5) + (legLength * 0.45) + 0.04; // ~0.963

        this.player.position.set(0, feetOffset, 0); // Position so feet touch Y=0

        // Colors for different body parts
        const skinColor = 0xFFDBAC;
        const bodyColor = 0xFF6347;
        const limbColor = 0xFF6347;
        const pantsColor = 0x000080;

        // === TORSO ===
        const torsoGeometry = new THREE.BoxGeometry(0.45, torsoHeight, 0.25);
        const torsoMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        this.torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        this.torso.position.y = torsoHeight / 2;
        this.torso.castShadow = true;
        this.player.add(this.torso);

        // === HEAD ===
        const headGeometry = new THREE.SphereGeometry(headHeight / 2, 12, 12);
        const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = torsoHeight + (headHeight / 2);
        this.head.castShadow = true;
        this.player.add(this.head);

        // === LEFT ARM HIERARCHY ===
        this.leftShoulder = new THREE.Group();
        this.leftShoulder.position.set(-0.26, torsoHeight * 0.75, 0);
        this.torso.add(this.leftShoulder);

        // Upper left arm
        const upperArmGeometry = new THREE.BoxGeometry(0.13, armLength * 0.45, 0.13);
        const upperArmMaterial = new THREE.MeshLambertMaterial({ color: limbColor });
        this.leftUpperArm = new THREE.Mesh(upperArmGeometry, upperArmMaterial);
        this.leftUpperArm.position.y = -(armLength * 0.45) / 2;
        this.leftUpperArm.castShadow = true;
        this.leftShoulder.add(this.leftUpperArm);

        // Left elbow joint
        this.leftElbow = new THREE.Group();
        this.leftElbow.position.y = -(armLength * 0.45);
        this.leftUpperArm.add(this.leftElbow);

        // Lower left arm (forearm)
        const lowerArmGeometry = new THREE.BoxGeometry(0.11, armLength * 0.4, 0.11);
        this.leftLowerArm = new THREE.Mesh(lowerArmGeometry, upperArmMaterial);
        this.leftLowerArm.position.y = -(armLength * 0.4) / 2;
        this.leftLowerArm.castShadow = true;
        this.leftElbow.add(this.leftLowerArm);

        // Left hand
        const handGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.15);
        this.leftHand = new THREE.Mesh(handGeometry, new THREE.MeshLambertMaterial({ color: skinColor }));
        this.leftHand.position.y = -(armLength * 0.4) - 0.04;
        this.leftHand.castShadow = true;
        this.leftLowerArm.add(this.leftHand);

        // === RIGHT ARM HIERARCHY ===
        this.rightShoulder = new THREE.Group();
        this.rightShoulder.position.set(0.26, torsoHeight * 0.75, 0);
        this.torso.add(this.rightShoulder);

        // Upper right arm
        this.rightUpperArm = new THREE.Mesh(upperArmGeometry, upperArmMaterial);
        this.rightUpperArm.position.y = -(armLength * 0.45) / 2;
        this.rightUpperArm.castShadow = true;
        this.rightShoulder.add(this.rightUpperArm);

        // Right elbow joint
        this.rightElbow = new THREE.Group();
        this.rightElbow.position.y = -(armLength * 0.45);
        this.rightUpperArm.add(this.rightElbow);

        // Lower right arm (forearm)
        this.rightLowerArm = new THREE.Mesh(lowerArmGeometry, upperArmMaterial);
        this.rightLowerArm.position.y = -(armLength * 0.4) / 2;
        this.rightLowerArm.castShadow = true;
        this.rightElbow.add(this.rightLowerArm);

        // Right hand
        this.rightHand = new THREE.Mesh(handGeometry, new THREE.MeshLambertMaterial({ color: skinColor }));
        this.rightHand.position.y = -(armLength * 0.4) - 0.04;
        this.rightHand.castShadow = true;
        this.rightLowerArm.add(this.rightHand);

        // === LEFT LEG HIERARCHY ===
        this.leftHip = new THREE.Group();
        this.leftHip.position.set(-0.15, 0, 0);
        this.torso.add(this.leftHip);

        // Upper left leg (thigh)
        const thighGeometry = new THREE.BoxGeometry(0.16, legLength * 0.5, 0.16);
        const thighMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });
        this.leftThigh = new THREE.Mesh(thighGeometry, thighMaterial);
        this.leftThigh.position.y = -(legLength * 0.5) / 2;
        this.leftThigh.castShadow = true;
        this.leftHip.add(this.leftThigh);

        // Left knee joint
        this.leftKnee = new THREE.Group();
        this.leftKnee.position.y = -(legLength * 0.5);
        this.leftThigh.add(this.leftKnee);

        // Lower left leg (calf)
        const calfGeometry = new THREE.BoxGeometry(0.14, legLength * 0.45, 0.14);
        this.leftCalf = new THREE.Mesh(calfGeometry, thighMaterial);
        this.leftCalf.position.y = -(legLength * 0.45) / 2;
        this.leftCalf.castShadow = true;
        this.leftKnee.add(this.leftCalf);

        // Left foot
        const footGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.35);
        this.leftFoot = new THREE.Mesh(footGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        this.leftFoot.position.set(0, -(legLength * 0.45) - 0.04, 0.1);
        this.leftFoot.castShadow = true;
        this.leftCalf.add(this.leftFoot);

        // === RIGHT LEG HIERARCHY ===
        this.rightHip = new THREE.Group();
        this.rightHip.position.set(0.15, 0, 0);
        this.torso.add(this.rightHip);

        // Upper right leg (thigh)
        this.rightThigh = new THREE.Mesh(thighGeometry, thighMaterial);
        this.rightThigh.position.y = -(legLength * 0.5) / 2;
        this.rightThigh.castShadow = true;
        this.rightHip.add(this.rightThigh);

        // Right knee joint
        this.rightKnee = new THREE.Group();
        this.rightKnee.position.y = -(legLength * 0.5);
        this.rightThigh.add(this.rightKnee);

        // Lower right leg (calf)
        this.rightCalf = new THREE.Mesh(calfGeometry, thighMaterial);
        this.rightCalf.position.y = -(legLength * 0.45) / 2;
        this.rightCalf.castShadow = true;
        this.rightKnee.add(this.rightCalf);

        // Right foot
        this.rightFoot = new THREE.Mesh(footGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        this.rightFoot.position.set(0, -(legLength * 0.45) - 0.04, 0.1);
        this.rightFoot.castShadow = true;
        this.rightCalf.add(this.rightFoot);

        this.scene.add(this.player);


        // Animation properties with realistic timing
        this.walkCycle = 0;
        this.isWalking = false;
        this.stepFrequency = 2; // Steps per second at normal walking speed
        this.armSwingMultiplier = 0.8; // Arms swing less than legs
    }


    // Removed createHUD - no player stats modal

    createMinimap() {
        const minimap = document.createElement('div');
        minimap.id = 'minimap';
        minimap.innerHTML = `
            <div class="minimap-content">
                <div class="minimap-player" id="minimap-player"></div>
                <!-- World boundary indicators -->
                <div class="minimap-boundary minimap-north" style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #8B4513;"></div>
                <div class="minimap-boundary minimap-south" style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #8B4513;"></div>
                <div class="minimap-boundary minimap-east" style="position: absolute; top: 0; right: 0; bottom: 0; width: 2px; background: #8B4513;"></div>
                <div class="minimap-boundary minimap-west" style="position: absolute; top: 0; left: 0; bottom: 0; width: 2px; background: #8B4513;"></div>
            </div>
        `;
        document.body.appendChild(minimap);
    }

    setupEventListeners() {
        console.log('Setting up event listeners');

        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        console.log('Canvas found:', canvas);

        // Mouse controls for isometric click-to-move
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });

        // Left-click to move (primary movement)
        canvas.addEventListener('click', (event) => {
            console.log('Canvas click event fired at:', event.clientX, event.clientY);
            console.log('Canvas element:', canvas);
            console.log('Canvas dimensions:', canvas.width, canvas.height);
            this.handleMoveClick(event);
        });

        // Right-click to interact (prevent context menu)
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.handleClick(event);
        });

        // Mobile touch support
        document.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 1) {
                // Single touch = move
                const touch = event.touches[0];
                this.handleTouchMove(touch);
            } else if (event.touches.length === 2) {
                // Two finger touch = interact
                const touch = event.touches[0];
                this.handleTouchInteract(touch);
            }
        }, { passive: false });

        document.addEventListener('touchend', (event) => {
            event.preventDefault();
        }, { passive: false });

        // No keyboard movement - only click to move

        // No particle effect hotkeys - clean interface
    }

    handleMoveClick(event) {
        console.log('Left-click detected at:', event.clientX, event.clientY);
        console.log('Ground exists:', !!this.ground);
        console.log('Camera exists:', !!this.camera);
        console.log('Raycaster exists:', !!this.raycaster);

        // Mouse coordinates are already updated in the mousemove listener
        console.log('Mouse coords:', this.mouse.x.toFixed(3), this.mouse.y.toFixed(3));

        // Raycast to ground plane for movement destination
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Use plane intersection for reliable click-to-move positioning
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 plane
            const planeIntersect = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(plane, planeIntersect);

        let intersects = [];
            if (planeIntersect && !isNaN(planeIntersect.x) && !isNaN(planeIntersect.y) && !isNaN(planeIntersect.z)) {
                intersects = [{ point: planeIntersect }];
            console.log('Click position:', planeIntersect.x, planeIntersect.z);
        }

        if (intersects.length > 0) {
            const targetPos = intersects[0].point;
            console.log('Target position:', targetPos.x, targetPos.y, targetPos.z);

            // Always allow clicking - let pathfinding handle obstacles (like League of Legends)
            const pathPoints = this.calculatePath(this.player.position, targetPos);
            if (pathPoints.length === 0) {
                console.log('Cannot find any path to position - completely surrounded');
                // Only block if absolutely no path exists
                this.showClickEffect(targetPos);
                return;
            }

            // Visual feedback for click
            this.showClickEffect(targetPos);
            this.setPathMovement(pathPoints);
        } else {
            console.log('No intersection found!');

            // Still show some visual feedback even if raycasting fails
            const fallbackPos = new THREE.Vector3(
                this.mouse.x * 50,
                0,
                this.mouse.y * 50
            );

            // Always allow clicking fallback - let pathfinding handle obstacles
            const fallbackPath = this.calculatePath(this.player.position, fallbackPos);
            if (fallbackPath.length === 0) {
                console.log('Cannot find any path to fallback position - completely surrounded');
                this.showClickEffect(fallbackPos);
                return;
            }

            this.showClickEffect(fallbackPos);
            this.setPathMovement(fallbackPath);
            console.log('Showing fallback click effect at:', fallbackPos);
        }
    }

    handleClick(event) {
        console.log('Right-click detected at:', event.clientX, event.clientY);

        // Update mouse position for right-click (use window coordinates)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find clicked object for interaction
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        console.log('Right-click intersects:', intersects.length);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;

            // Only interact if it's not the ground and has valid userData
            if (clickedObject !== this.scene.children[0] && clickedObject.userData && !clickedObject.userData.isGround) {
                this.handleObjectInteraction(clickedObject);
            } else {
                console.log('Clicked on ground or invalid object');
            }
        } else {
            console.log('No objects intersected with right-click');
        }
    }

    updateMouseInteraction() {
        // Update mouse position for hover effects
        this.mouse.x = (this.mouseX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(this.mouseY / window.innerHeight) * 2 + 1;

        // Raycast for hover effects
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Reset cursor
        document.body.style.cursor = 'default';

        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;

            // Change cursor based on object type
            if (hoveredObject.userData.type === 'npc') {
                document.body.style.cursor = 'pointer';
            } else if (hoveredObject.userData.type === 'resource') {
                document.body.style.cursor = 'grab';
            } else if (hoveredObject.userData.isGround) {
                document.body.style.cursor = 'pointer';
            }
        }
    }

    setMovementTarget(targetPosition) {
        console.log('Setting movement target:', targetPosition.x, targetPosition.y, targetPosition.z);

        // Simple click-to-move: use exact click position
        this.targetPosition = targetPosition.clone();
        this.targetPosition.y = 0.675; // Keep at correct player height

        // Create or update destination marker
        this.createDestinationMarker(this.targetPosition);

        // Start moving towards target
        this.isMoving = true;
        console.log('Movement started, isMoving =', this.isMoving);
    }

    createDestinationMarker(position) {
        // Remove existing marker
        if (this.destinationMarker) {
            this.scene.remove(this.destinationMarker);
        }

        // Create new marker - smaller yellow circle at exact click position
        const markerGeometry = new THREE.CircleGeometry(0.2, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        this.destinationMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.destinationMarker.position.copy(position);
        this.destinationMarker.position.y = 0.01; // Just above ground level
        this.destinationMarker.rotation.x = -Math.PI / 2; // Lay flat on ground

        // Add pulsing animation
        this.markerTime = 0;
        this.scene.add(this.destinationMarker);
    }

    updateDestinationMarker() {
        if (this.destinationMarker) {
            this.markerTime += 0.05;
            this.destinationMarker.material.opacity = 0.8 + Math.sin(this.markerTime * 5) * 0.2;
        }
    }

    showClickEffect(position) {
        // DISABLED: Click effect removed to hide crosshair
        // No visual feedback when clicking
    }

    handleTouchMove(touch) {
        // Update mouse coordinates for raycasting (same as mousemove handler)
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        this.mouseX = touch.clientX;
        this.mouseY = touch.clientY;

        // Convert touch to mouse coordinates for click handler
        const event = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        this.handleMoveClick(event);
    }

    handleTouchInteract(touch) {
        // Update mouse coordinates for raycasting (same as mousemove handler)
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        this.mouseX = touch.clientX;
        this.mouseY = touch.clientY;

        // Convert touch to mouse coordinates for click handler
        const event = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        this.handleClick(event);
    }

    handleObjectInteraction(object) {
        console.log('Interacting with object:', object);
        console.log('Object position:', object?.position);
        console.log('Object userData:', object?.userData);

        // Handle different object types
        if (object.userData?.type === 'enemy') {
            this.attackEnemy(object);
        } else if (object.userData?.type === 'npc') {
            this.talkToNPC(object);
        } else if (object.userData?.type === 'resource') {
            this.gatherResource(object);
        } else {
            // Move player to clicked location
            if (object && object.position && typeof object.position.x === 'number' && !isNaN(object.position.x)) {
                console.log('Moving to object position:', object.position);
            this.movePlayerTo(object.position);
            } else {
                console.warn('Cannot move to object - invalid position:', object?.position);
            }
        }
    }

    movePlayerTo(targetPosition) {
        // Simple movement towards target
        if (!targetPosition || !this.player) {
            console.warn('movePlayerTo: Invalid targetPosition or player');
            return;
        }

        // Validate targetPosition has valid coordinates
        if (typeof targetPosition.x !== 'number' || typeof targetPosition.y !== 'number' || typeof targetPosition.z !== 'number' ||
            isNaN(targetPosition.x) || isNaN(targetPosition.y) || isNaN(targetPosition.z)) {
            console.warn('movePlayerTo: Invalid targetPosition coordinates:', targetPosition);
            return;
        }

        // Validate player position
        if (!this.player.position || typeof this.player.position.x !== 'number' || isNaN(this.player.position.x)) {
            console.warn('movePlayerTo: Invalid player position:', this.player.position);
            return;
        }

        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.player.position)
            .normalize();

        // Check if direction is valid (not NaN)
        if (isNaN(direction.x) || isNaN(direction.y) || isNaN(direction.z)) {
            console.warn('movePlayerTo: Invalid direction calculated');
            return;
        }

        console.log('Moving player towards:', targetPosition.x.toFixed(2), targetPosition.z.toFixed(2));
        this.player.position.add(direction.multiplyScalar(0.1));
    }

    attackEnemy(enemy) {
        // Trigger combat system
        console.log('Attacking enemy:', enemy.userData.name);
        // Integrate with existing combat system
    }

    talkToNPC(npc) {
        console.log('Talking to NPC:', npc.userData.name);
        // Show dialogue
    }

    gatherResource(resource) {
        console.log('Gathering resource:', resource.userData.type);
        // Integrate with existing gathering system
    }

    update(deltaTime = 16.67) { // Default to ~60fps delta time
        // Handle player movement with delta time for consistency
        this.handleMovement(deltaTime);

        // No keyboard movement - only click to move

        // Update camera to follow player (camera already handles its own timing)
        this.updateCamera();

        // Update minimap
        this.updateMinimap();

        // Update destination marker
        this.updateDestinationMarker();

        // Update mouse interaction (cursor changes)
        this.updateMouseInteraction();
    }

    // No keyboard movement functions - click to move only

    handleMovement(deltaTime = 16.67) {
        if (!this.targetPosition || !this.isMoving) {
            this.isWalking = false;
            this.resetPlayerPose();
            return;
        }

        this.isWalking = true;

        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.player.position)
            .normalize();

        // Calculate distance to target
        const distance = this.player.position.distanceTo(this.targetPosition);

        if (distance < 0.01) {
            // Reached current waypoint
            console.log('Reached waypoint:', this.currentPathIndex);

            // Move to next waypoint in path
            this.currentPathIndex++;

            if (this.currentPathIndex < this.pathPoints.length) {
                // More waypoints to go
                console.log('Moving to next waypoint:', this.currentPathIndex);
                this.setMovementTarget(this.pathPoints[this.currentPathIndex]);
                return;
            } else {
                // Reached final destination
                console.log('Reached final destination');
                this.player.position.x = this.targetPosition.x;
                this.player.position.z = this.targetPosition.z;
                this.player.position.y = this.targetPosition.y; // Keep target Y
                this.isMoving = false;
                this.targetPosition = null;
                this.pathPoints = [];
                this.currentPathIndex = 0;
                this.isWalking = false;
                this.resetPlayerPose();
                if (this.destinationMarker) {
                    this.scene.remove(this.destinationMarker);
                    this.destinationMarker = null;
                }
                return;
            }
        }

        // WORLD-CLASS SMOOTH MOVEMENT: Use delta time for consistent speed across frame rates
        const moveDistance = (this.moveSpeed * deltaTime) / 16.67; // Normalize to 60fps
        const moveVector = direction.multiplyScalar(moveDistance);

        // Check collision with world boundaries and trees before applying movement
        const newPosition = this.player.position.clone().add(moveVector);
        if (this.checkWorldBoundaries(newPosition) && this.checkTreeCollisions(newPosition)) {
            // Apply smooth movement if no collision
            this.player.position.add(moveVector);
        }

        // Smooth player rotation to face movement direction
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.player.rotation.y;

        // Smooth rotation interpolation to prevent jerky turning
        let angleDiff = targetAngle - currentAngle;

        // Handle angle wrapping (keep within -PI to PI)
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Smooth rotation with delta time
        const rotationSpeed = 0.005 * deltaTime; // Adjust rotation smoothness
        const newAngle = currentAngle + (angleDiff * Math.min(rotationSpeed, 1));

        this.player.rotation.y = newAngle;

        // Walking animation
        this.updateWalkAnimation();
    }

    updateWalkAnimation(deltaTime = 16.67) {
        if (!this.isWalking) return;

        // SYNCHRONIZED WALKING ANIMATION: Match animation speed to actual movement
        // Calculate step length (distance per step) - increased for much slower animation
        const stepLength = 4.0; // Even larger step length = much slower animation
        // Animation speed should complete one full cycle per step
        const animationSpeed = (this.moveSpeed / stepLength) * (deltaTime / 16.67);
        this.walkCycle += animationSpeed;

        // Simple arm swing - opposite to legs
        const armSwing = Math.sin(this.walkCycle) * 0.3;
        this.leftShoulder.rotation.x = armSwing;
        this.rightShoulder.rotation.x = -armSwing;

        // Simple leg swing - opposite to arms
        const legSwing = Math.sin(this.walkCycle) * 0.4;
        this.leftHip.rotation.x = -legSwing;
        this.rightHip.rotation.x = legSwing;

        // Very subtle knee bend
        const kneeBend = Math.abs(Math.sin(this.walkCycle)) * 0.1;
        this.leftKnee.rotation.x = kneeBend;
        this.rightKnee.rotation.x = kneeBend;
    }

    resetPlayerPose() {
        // Reset all joints to default position for standing still

        // Reset hip rotations
        this.leftHip.rotation.x = 0;
        this.rightHip.rotation.x = 0;

        // Reset knee bends
        this.leftKnee.rotation.x = 0;
        this.rightKnee.rotation.x = 0;

        // Reset shoulder rotations
        this.leftShoulder.rotation.x = 0;
        this.rightShoulder.rotation.x = 0;

        // Reset elbow bends
        this.leftElbow.rotation.x = 0;
        this.rightElbow.rotation.x = 0;

        // Reset body lean
        this.torso.rotation.z = 0;

        // Reset head stabilization
        this.head.rotation.z = 0;

        // Reset vertical position (feet on ground level)
        const totalHeight = 1.8;
        const legLength = totalHeight * 0.54; // Same calculation as in createPlayer
        const feetOffset = (legLength * 0.5) + (legLength * 0.45) + 0.04;
        this.player.position.y = feetOffset; // Feet at ground level (Y=0)
    }

    updateCamera() {
        // ISOMETRIC CAMERA: Follow player from south at an angle
        const cameraHeight = 45;
        const cameraDistance = 45;

        // Position camera south of player, maintaining isometric angle
        const idealPosition = new THREE.Vector3(
            this.player.position.x,           // Same X as player
            cameraHeight,                     // Fixed height above
            this.player.position.z + cameraDistance  // South of player
        );

        // Smooth camera following
        const lerpFactor = this.isMoving ? 0.15 : 0.1;
        this.camera.position.lerp(idealPosition, lerpFactor);

        // Look at player position from isometric angle
        const lookAtTarget = new THREE.Vector3(
            this.player.position.x,     // Look at player's X
            0,                         // Look at ground level
            this.player.position.z      // Look at player's Z
        );

        // Smooth look-at interpolation to prevent rotation jitter
        if (!this.cameraLookAtTarget) {
            this.cameraLookAtTarget = lookAtTarget.clone();
        }

        // Interpolate look-at target for ultra-smooth rotation
        this.cameraLookAtTarget.lerp(lookAtTarget, lerpFactor);

        // Apply smooth look-at
        this.camera.lookAt(this.cameraLookAtTarget);
    }

    checkWorldBoundaries(position) {
        const worldBoundary = 99; // Match wall positions (±101) minus player size
        const playerRadius = 1; // Approximate player collision radius

        // Check if new position would hit world boundaries (walls at ±101)
        if (Math.abs(position.x) > worldBoundary - playerRadius ||
            Math.abs(position.z) > worldBoundary - playerRadius) {
            return false; // Collision detected, don't allow movement
        }

        return true; // No collision, allow movement
    }

    checkTreeCollisions(position) {
        if (!this.treePositions) return true; // No trees to check

        const playerRadius = 1; // Player collision radius

        // Check collision with each tree trunk (not leaves)
        for (let i = 0; i < this.treePositions.length; i++) {
            const treePos = this.treePositions[i];
            const distance = Math.sqrt(
                Math.pow(position.x - treePos.x, 2) +
                Math.pow(position.z - treePos.z, 2)
            );

            // Only collide with tree trunk (smaller radius)
            const trunkRadius = 1.2; // Much smaller - only the actual trunk

            if (distance < playerRadius + trunkRadius) {
                return false; // Collision with trunk detected, don't allow movement
            }
        }

        return true; // No collision with tree trunks, allow movement
    }

    // Pathfinding methods for avoiding trees
    calculatePath(startPos, targetPos) {
        // First, try direct path
        if (this.checkDirectPath(startPos, targetPos)) {
            return [targetPos.clone()];
        }

        // If direct path is blocked, find a detour around the nearest tree
        const detourPoint = this.findDetourPoint(startPos, targetPos);
        if (detourPoint) {
            return [detourPoint, targetPos.clone()];
        }

        // If no detour found, return empty path (can't reach target)
        return [];
    }

    checkDirectPath(startPos, targetPos) {
        // Check if the straight line path is blocked by trees
        const direction = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();

        const distance = startPos.distanceTo(targetPos);
        const steps = Math.max(5, Math.floor(distance / 2)); // Check multiple points along the path

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkPoint = new THREE.Vector3()
                .copy(startPos)
                .add(direction.clone().multiplyScalar(distance * t));

            if (!this.checkTreeCollisions(checkPoint)) {
                return false; // Path is blocked
            }
        }

        return true; // Path is clear
    }

    findDetourPoint(startPos, targetPos) {
        // Find the tree that's blocking the direct path
        const blockingTree = this.findNearestBlockingTree(startPos, targetPos);
        if (!blockingTree) return null;

        // Calculate detour points around the tree
        const treePos = new THREE.Vector3(blockingTree.x, 0, blockingTree.z);
        const trunkRadius = 1.2; // Same as collision radius
        const detourDistance = trunkRadius + 2; // Go around the trunk (smaller detour)

        // Try several detour directions
        const directions = [
            new THREE.Vector3(1, 0, 0),   // Right
            new THREE.Vector3(-1, 0, 0),  // Left
            new THREE.Vector3(0, 0, 1),   // Forward
            new THREE.Vector3(0, 0, -1),  // Back
            new THREE.Vector3(0.7, 0, 0.7),  // Diagonal
            new THREE.Vector3(-0.7, 0, 0.7),
            new THREE.Vector3(0.7, 0, -0.7),
            new THREE.Vector3(-0.7, 0, -0.7)
        ];

        let bestDetour = null;
        let bestDistance = Infinity;

        for (const dir of directions) {
            const detourPoint = new THREE.Vector3()
                .copy(treePos)
                .add(dir.clone().multiplyScalar(detourDistance));

            // Check if this detour point is reachable and closer to target
            if (this.checkDirectPath(startPos, detourPoint) &&
                this.checkDirectPath(detourPoint, targetPos)) {

                const detourToTarget = detourPoint.distanceTo(targetPos);
                if (detourToTarget < bestDistance) {
                    bestDistance = detourToTarget;
                    bestDetour = detourPoint;
                }
            }
        }

        return bestDetour;
    }

    findNearestBlockingTree(startPos, targetPos) {
        if (!this.treePositions) return null;

        const direction = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();

        const distance = startPos.distanceTo(targetPos);
        let nearestTree = null;
        let nearestDistance = Infinity;

        // Check all trees to find which one is blocking the path
        for (const treePos of this.treePositions) {
            // Project tree position onto the path line
            const toTree = new THREE.Vector3(treePos.x - startPos.x, 0, treePos.z - startPos.z);
            const projection = toTree.dot(direction);
            const projectedPoint = new THREE.Vector3()
                .copy(startPos)
                .add(direction.clone().multiplyScalar(projection));

            // Check if tree is close to the path
            const treeToPath = Math.sqrt(
                Math.pow(treePos.x - projectedPoint.x, 2) +
                Math.pow(treePos.z - projectedPoint.z, 2)
            );

            if (treeToPath < 2.5 && projection > 0 && projection < distance) {
                const distToStart = projectedPoint.distanceTo(startPos);
                if (distToStart < nearestDistance) {
                    nearestDistance = distToStart;
                    nearestTree = treePos;
                }
            }
        }

        return nearestTree;
    }

    setPathMovement(pathPoints) {
        this.pathPoints = pathPoints;
        this.currentPathIndex = 0;

        if (pathPoints.length > 0) {
            this.setMovementTarget(pathPoints[0]);
        }
    }

    updateMinimap() {
        const player = document.getElementById('minimap-player');
        if (player) {
            // FULL WORLD MINIMAP: Shows entire 200x200 world
            const scale = 150 / 200; // 150 pixels represents 200 world units

            // DIRECT MAPPING: Game X → Minimap X, Game Z → Minimap Y
            // Move RIGHT in game → move RIGHT on minimap
            // Move DOWN in game → move DOWN on minimap
            // Move LEFT in game → move LEFT on minimap
            const minimapX = (this.player.position.x * scale) + 75;
            const minimapY = (this.player.position.z * scale) + 75;

            // Position player dot on minimap (clamped to bounds)
            player.style.left = `${Math.max(0, Math.min(142, minimapX))}px`;
            player.style.top = `${Math.max(0, Math.min(142, minimapY))}px`;
        }

        // Update minimap objects (trees, buildings, etc.)
        this.updateMinimapObjects();
    }

    updateMinimapObjects() {
        // Clear existing minimap objects
        const existingObjects = document.querySelectorAll('.minimap-object');
        existingObjects.forEach(obj => obj.remove());

        // Add objects to minimap
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.type === 'tree') {
                this.addObjectToMinimap(child.position, 'tree');
            } else if (child.userData && child.userData.type === 'building') {
                this.addObjectToMinimap(child.position, 'building');
            } else if (child.userData && child.userData.type === 'water') {
                this.addObjectToMinimap(child.position, 'water');
            }
        });
    }

    addObjectToMinimap(worldPosition, objectType) {
        const minimapContainer = document.querySelector('.minimap-content');
        if (!minimapContainer) return;

        // FULL WORLD MINIMAP: Same scale as player
        const scale = 150 / 200; // 150 pixels represents 200 world units

        // Apply same direct mapping as player coordinates
        const minimapX = (worldPosition.x * scale) + 75;
        const minimapY = (worldPosition.z * scale) + 75;

        // Only show objects within minimap bounds
        if (minimapX >= 0 && minimapX <= 150 && minimapY >= 0 && minimapY <= 150) {
            const objectDot = document.createElement('div');
            objectDot.className = `minimap-object minimap-${objectType}`;

            // Different colors and sizes for different object types
            let color = '#696969'; // Default gray for buildings
            let size = 4;

            if (objectType === 'tree') {
                color = '#228B22'; // Green for trees
                size = 3; // Smaller dots for trees
            } else if (objectType === 'water') {
                color = '#4169E1'; // Blue for water
                size = 6; // Larger dots for water features
            }

            objectDot.style.cssText = `
                position: absolute;
                left: ${minimapX - size/2}px;
                top: ${minimapY - size/2}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 0;
                pointer-events: none;
                opacity: 0.8;
            `;
            minimapContainer.appendChild(objectDot);
        }
    }

    // Removed updateHUD - no player stats modal to update

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 50;

        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));

        // Calculate delta time for consistent movement across different frame rates
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps (e.g., when tab is inactive)
        const clampedDeltaTime = Math.min(deltaTime, 100); // Max 100ms

        this.update(clampedDeltaTime);

        this.renderer.render(this.scene, this.camera);
    }

    // No particle system - clean gameplay

    // No particle effects - clean gameplay

    // Clean combat methods - no particle effects
    attackEnemy(enemy) {
        console.log('Attacking enemy:', enemy.userData.name);

        // Simple damage calculation
        const damage = Math.floor(Math.random() * 10) + 5;
        console.log(`You deal ${damage} damage to ${enemy.userData.name}!`);

        // Show damage number
        this.showDamageNumber(damage, enemy.position);

        // Remove enemy after combat (simplified)
        setTimeout(() => {
            this.scene.remove(enemy);
            console.log(`${enemy.userData.name} defeated!`);
        }, 1000);
    }

    showDamageNumber(damage, position) {
        // Create a simple text element for damage numbers
        const damageDiv = document.createElement('div');
        damageDiv.textContent = damage;
        damageDiv.style.position = 'absolute';
        damageDiv.style.color = '#ff0000';
        damageDiv.style.fontSize = '20px';
        damageDiv.style.fontWeight = 'bold';
        damageDiv.style.pointerEvents = 'none';
        damageDiv.style.zIndex = '1000';
        damageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';

        // Position the damage number above the enemy
        const screenPos = position.clone();
        screenPos.project(this.camera);
        damageDiv.style.left = (screenPos.x * 0.5 + 0.5) * window.innerWidth + 'px';
        damageDiv.style.top = (-screenPos.y * 0.5 + 0.5) * window.innerHeight - 50 + 'px';

        document.body.appendChild(damageDiv);

        // Animate the damage number
        let opacity = 1;
        let yPos = parseFloat(damageDiv.style.top);
        const animate = () => {
            opacity -= 0.02;
            yPos -= 1;
            damageDiv.style.opacity = opacity;
            damageDiv.style.top = yPos + 'px';

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(damageDiv);
            }
        };
        animate();
    }

    // No weather effects - clean gameplay
}

// Initialize 3D game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Game3D...');
    const game3D = new Game3D();

    // Make game3D available globally for integration with existing game
    window.game3D = game3D;
    console.log('Game3D initialization complete');
});
