// Generic Obstacle class for collision detection and pathfinding
class Obstacle {
    constructor(position, options = {}) {
        this.position = position.clone();
        this.type = options.type || 'generic';
        this.collisionRadius = options.collisionRadius || 1;
        this.collisionBounds = options.collisionBounds || null; // For rectangular obstacles: {width, height}
        this.blocksMovement = options.blocksMovement !== false; // Default true
        this.blocksLineOfSight = options.blocksLineOfSight || false;
    }

    // Check if a point is inside this obstacle's collision area
    containsPoint(point) {
        if (this.collisionBounds) {
            // Rectangular collision
            const halfWidth = this.collisionBounds.width / 2;
            const halfHeight = this.collisionBounds.height / 2;
            return Math.abs(point.x - this.position.x) <= halfWidth &&
                   Math.abs(point.z - this.position.z) <= halfHeight;
        } else {
            // Circular collision
            const distance = Math.sqrt(
                Math.pow(point.x - this.position.x, 2) +
                Math.pow(point.z - this.position.z, 2)
            );
            return distance <= this.collisionRadius;
        }
    }

    // Check if a line segment intersects this obstacle
    intersectsLine(start, end) {
        if (this.collisionBounds) {
            // Rectangular intersection (simplified)
            return this.lineIntersectsRect(start, end, this.collisionBounds);
        } else {
            // Circular intersection
            return this.lineIntersectsCircle(start, end, this.collisionRadius);
        }
    }

    lineIntersectsCircle(start, end, radius) {
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);

        if (length === 0) return false;

        const ux = dx / length;
        const uz = dz / length;

        const relX = this.position.x - start.x;
        const relZ = this.position.z - start.z;

        const proj = relX * ux + relZ * uz;
        const closestX = start.x + proj * ux;
        const closestZ = start.z + proj * uz;

        const distance = Math.sqrt(
            Math.pow(closestX - this.position.x, 2) +
            Math.pow(closestZ - this.position.z, 2)
        );

        return distance <= radius && proj >= 0 && proj <= length;
    }

    lineIntersectsRect(start, end, bounds) {
        // Simplified rectangular intersection - check if line crosses any edge
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        const rect = {
            left: this.position.x - halfWidth,
            right: this.position.x + halfWidth,
            top: this.position.z - halfHeight,
            bottom: this.position.z + halfHeight
        };

        // Check if line intersects any of the 4 edges
        return this.lineIntersectsEdge(start, end, rect.left, rect.top, rect.right, rect.top) ||
               this.lineIntersectsEdge(start, end, rect.right, rect.top, rect.right, rect.bottom) ||
               this.lineIntersectsEdge(start, end, rect.right, rect.bottom, rect.left, rect.bottom) ||
               this.lineIntersectsEdge(start, end, rect.left, rect.bottom, rect.left, rect.top);
    }

    lineIntersectsEdge(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 0.001) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
}

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
        this.obstacles = []; // Generic obstacles for collision and pathfinding
        this.targetPosition = null;
        this.isMoving = false;
        this.moveSpeed = 0.15; // Increased for more responsive movement
        this.destinationMarker = null;
        this.waypointMarkers = []; // Array to store intermediate waypoint markers
        this.cameraLookAtTarget = null; // For smooth camera look-at interpolation
        this.lastTime = 0; // For delta time calculations

        // Zoom system
        this.baseFrustumSize = 50; // Base orthographic camera size
        this.currentZoom = 1.0; // Current zoom level (1.0 = normal)
        this.minZoom = 0.3; // Minimum zoom (zoomed in)
        this.maxZoom = 3.0; // Maximum zoom (zoomed out)
        this.zoomSpeed = 0.1; // Zoom speed multiplier

        // Touch zoom variables
        this.touchZoomEnabled = false;
        this.initialTouchDistance = 0;
        this.initialZoom = 1.0;

        // Pathfinding state
        this.pathPoints = [];
        this.currentPathIndex = 0;

        // Camera mode state
        this.currentCameraMode = 'isometric';

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Isometric Camera setup (Orthographic) with zoom support
        const aspect = window.innerWidth / window.innerHeight;
        this.updateCameraZoom(); // Initialize camera with zoom

        this.camera = new THREE.OrthographicCamera(
            this.baseFrustumSize * aspect / -2,
            this.baseFrustumSize * aspect / 2,
            this.baseFrustumSize / 2,
            this.baseFrustumSize / -2,
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

        // Directional light (sun) - angled for isometric feel, repositioned to reduce edge shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 60, 10); // Moved more to the side and higher to reduce edge shadows
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -120; // Extended slightly to cover walls
        directionalLight.shadow.camera.right = 120;
        directionalLight.shadow.camera.top = 120;
        directionalLight.shadow.camera.bottom = -120;

        // Reduce shadow harshness
        directionalLight.shadow.bias = -0.0001; // Small bias to reduce shadow acne
        directionalLight.shadow.radius = 2; // Soft shadows
        this.scene.add(directionalLight);

        // Add fog for atmospheric depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
    }

    createWorld() {
        // Ground plane with vertex-based procedural coloring (no tiling!)
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 100, 100); // Higher subdivision for smoother noise

        // Create high-resolution procedural texture instead of vertex colors
        const groundTexture = this.createGroundTexture(1024); // Much higher resolution!

        const groundMaterial = new THREE.MeshLambertMaterial({
            map: groundTexture,
            transparent: false
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
        // this.createBuildings(); // REMOVED: Buildings disabled
        this.createTrees();
        // this.createWater(); // REMOVED: Water disabled

        // Add world boundaries (walls)
        this.createWorldBoundaries();
    }

    createTreeBarkTexture(size = 512) {
        console.log(`Creating high-resolution tree bark texture (${size}x${size})...`);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get 2D context for bark texture');
            return new THREE.CanvasTexture(canvas);
        }

        // Create bark pattern using same noise system as ground
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Bark color palette - various browns and grays
        const barkColors = [
            [89, 63, 41],     // Dark chocolate brown
            [101, 67, 33],    // Dark brown
            [115, 85, 49],    // Medium brown
            [139, 69, 19],    // Saddle brown
            [160, 82, 45],    // Sienna
            [120, 100, 80],   // Grayish brown
            [110, 80, 60],    // Taupe brown
            [95, 75, 55],     // Deep taupe
        ];

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixelIndex = (y * size + x) * 4;

                // Use same sophisticated noise system as ground for consistency
                const terrainNoise = this.noise(x * 0.008, y * 0.008, 0);      // Main bark variation
                const detailNoise = this.noise(x * 0.016, y * 0.016, 1000);    // Fine bark details
                const colorNoise = this.noise(x * 0.032, y * 0.032, 2000);     // Color variation
                const textureNoise = this.noise(x * 0.064, y * 0.064, 3000);   // Surface texture

                // Combine with organic weights for natural bark appearance
                const combinedNoise = terrainNoise * 0.6 + detailNoise * 0.25 + colorNoise * 0.1 + textureNoise * 0.05;

                // Smooth color blending for natural appearance - no hard bands
                let colorIndex;

                // Use smooth interpolation between colors based on noise
                const smoothNoise = (terrainNoise + detailNoise * 0.3 + colorNoise * 0.2) / 1.5;

                // Map smooth noise to color range with natural blending
                colorIndex = Math.floor(smoothNoise * 8); // 0-7 range

                // Add significant random variation to break up any patterns
                const randomOffset = (Math.random() - 0.5) * 3; // ±1.5 variation
                colorIndex = Math.max(0, Math.min(7, colorIndex + randomOffset));

                // Additional noise-based variation for even more natural look
                const microVariation = (textureNoise - 0.5) * 2; // ±1
                colorIndex = Math.max(0, Math.min(7, Math.floor(colorIndex + microVariation)));

                const baseColor = barkColors[Math.min(colorIndex, barkColors.length - 1)];

                // Apply natural Age of Empires-style variation
                const terrainVariation = (combinedNoise - 0.5) * 25; // ±12.5 variation
                const detailVariation = (detailNoise - 0.5) * 12; // ±6 variation
                const randomVariation = (Math.random() - 0.5) * 8; // ±4 variation

                // Calculate final RGB values
                const r = Math.max(0, Math.min(255, baseColor[0] + terrainVariation + detailVariation + randomVariation)) / 255;
                const g = Math.max(0, Math.min(255, baseColor[1] + terrainVariation + detailVariation + randomVariation)) / 255;
                const b = Math.max(0, Math.min(255, baseColor[2] + terrainVariation + detailVariation + randomVariation)) / 255;

                // Add organic variation (more natural randomness to break patterns)
                const organicVariation = (Math.random() - 0.5) * 0.15;

                data[pixelIndex] = Math.max(0, Math.min(255, (r + organicVariation) * 255));
                data[pixelIndex + 1] = Math.max(0, Math.min(255, (g + organicVariation) * 255));
                data[pixelIndex + 2] = Math.max(0, Math.min(255, (b + organicVariation) * 255));
                data[pixelIndex + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 4); // Vertical bark pattern, single tile width

        console.log('High-resolution tree bark texture created');
        return texture;
    }

    createTreeLeafTexture(size = 512) {
        console.log(`Creating high-resolution tree leaf texture (${size}x${size}) with darker greens...`);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get 2D context for leaf texture');
            return new THREE.CanvasTexture(canvas);
        }

        // Create leaf pattern using same noise system as ground and bark
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Darker green leaf color palette - matching forest theme
        const leafColors = [
            [15, 80, 15],      // Very dark forest green
            [25, 110, 25],     // Dark forest green
            [20, 95, 20],      // Deep forest green
            [34, 139, 34],     // Forest green (base)
            [30, 120, 30],     // Medium forest green
            [40, 150, 40],     // Lighter forest green
            [45, 160, 45],     // Bright forest green
            [35, 135, 35],     // Standard forest green
        ];

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixelIndex = (y * size + x) * 4;

                // Use same sophisticated noise system as ground for consistency
                const terrainNoise = this.noise(x * 0.008, y * 0.008, 0);      // Main leaf variation
                const detailNoise = this.noise(x * 0.016, y * 0.016, 1000);    // Fine leaf details
                const colorNoise = this.noise(x * 0.032, y * 0.032, 2000);     // Color variation
                const textureNoise = this.noise(x * 0.064, y * 0.064, 3000);   // Surface texture

                // Combine with organic weights for natural leaf appearance
                const combinedNoise = terrainNoise * 0.6 + detailNoise * 0.25 + colorNoise * 0.1 + textureNoise * 0.05;

                // Smooth color blending for natural appearance - no hard bands
                let colorIndex;

                // Use smooth interpolation between colors based on noise
                const smoothNoise = (terrainNoise + detailNoise * 0.3 + colorNoise * 0.2) / 1.5;

                // Map smooth noise to color range with natural blending
                colorIndex = Math.floor(smoothNoise * 8); // 0-7 range

                // Add significant random variation to break up any patterns
                const randomOffset = (Math.random() - 0.5) * 3; // ±1.5 variation
                colorIndex = Math.max(0, Math.min(7, colorIndex + randomOffset));

                // Additional noise-based variation for even more natural look
                const microVariation = (textureNoise - 0.5) * 2; // ±1
                colorIndex = Math.max(0, Math.min(7, Math.floor(colorIndex + microVariation)));

                const baseColor = leafColors[Math.min(colorIndex, leafColors.length - 1)];

                // Apply natural Age of Empires-style variation
                const terrainVariation = (combinedNoise - 0.5) * 20; // ±10 variation (less than bark)
                const detailVariation = (detailNoise - 0.5) * 10; // ±5 variation
                const randomVariation = (Math.random() - 0.5) * 6; // ±3 variation

                // Calculate final RGB values
                const r = Math.max(0, Math.min(255, baseColor[0] + terrainVariation + detailVariation + randomVariation)) / 255;
                const g = Math.max(0, Math.min(255, baseColor[1] + terrainVariation + detailVariation + randomVariation)) / 255;
                const b = Math.max(0, Math.min(255, baseColor[2] + terrainVariation + detailVariation + randomVariation)) / 255;

                // Add organic variation (more natural randomness to break patterns)
                const organicVariation = (Math.random() - 0.5) * 0.12; // Slightly less than bark

                data[pixelIndex] = Math.max(0, Math.min(255, (r + organicVariation) * 255));
                data[pixelIndex + 1] = Math.max(0, Math.min(255, (g + organicVariation) * 255));
                data[pixelIndex + 2] = Math.max(0, Math.min(255, (b + organicVariation) * 255));
                data[pixelIndex + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Add subtle highlights for leaf realism
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(60, 179, 113, 0.08)'; // Dark sea green highlights
        for (let i = 0; i < 12; i++) { // More highlights than before
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 3 + 1;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3); // Leaf pattern repeat

        console.log('High-resolution tree leaf texture created with darker greens');
        return texture;
    }

    // Organic Age of Empires-style noise function (reusable class method)
    noise(x, y, seed = 0) {
        // Use multiple noise functions with different characteristics and more randomness
        const n1 = Math.sin(x * 0.01 + seed) * Math.cos(y * 0.01 + seed);
        const n2 = Math.sin(x * 0.03 + seed * 1.7) * Math.cos(y * 0.025 + seed * 2.1);
        const n3 = Math.sin(x * 0.07 + seed * 3.3) * Math.cos(y * 0.08 + seed * 2.9);
        const n4 = Math.sin(x * 0.15 + seed * 5.7) * Math.cos(y * 0.12 + seed * 4.1);

        // Add fractal-like variation with more complexity
        const fractal = Math.sin(x * 0.005 + y * 0.007 + seed) * 0.3;
        const fractal2 = Math.sin(x * 0.02 + y * 0.018 + seed * 1.3) * 0.2;

        // Add some additional randomness to break patterns
        const random1 = Math.sin(x * 0.041 + y * 0.037 + seed * 2.7) * 0.15;
        const random2 = Math.cos(x * 0.089 + y * 0.061 + seed * 4.1) * 0.1;

        const combined = n1 * 0.25 + n2 * 0.2 + n3 * 0.15 + n4 * 0.1 + fractal * 0.15 + fractal2 * 0.1 + random1 * 0.03 + random2 * 0.02;
        return (combined + 1) / 2; // Normalize to 0-1
    }

    applyVertexNoiseColoring(geometry) {
        console.log('Applying vertex-based noise coloring to ground...');

        const positions = geometry.attributes.position.array;
        const colors = [];

        // Forest green focused color palette - all variations of forest green
        const baseColors = [
            [34, 139, 34],    // Forest green (base)
            [25, 120, 25],    // Darker forest green
            [40, 150, 40],    // Lighter forest green
            [30, 130, 30],    // Medium forest green
            [45, 160, 45],    // Bright forest green
            [20, 110, 20],    // Very dark forest green
            [50, 170, 50],    // Very light forest green
            [35, 140, 35],    // Standard forest green
        ];

        // Process each vertex (every 3 positions = 1 vertex)
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];     // X coordinate (-100 to 100)
            const z = positions[i + 2]; // Z coordinate (-100 to 100)

            // Generate multiple noise layers for organic variation (higher frequency for more detail)
            const terrainNoise = this.noise(x * 0.02, z * 0.02, 0);
            const detailNoise = this.noise(x * 0.06, z * 0.06, 1000);
            const colorNoise = this.noise(x * 0.1, z * 0.1, 2000);

            // Combine noises with organic weights
            const combinedNoise = terrainNoise * 0.6 + detailNoise * 0.25 + colorNoise * 0.15;

            // Smooth color blending for natural appearance - no hard bands
            let colorIndex;

            // Use smooth interpolation between colors based on noise
            const smoothNoise = (terrainNoise + detailNoise * 0.3 + colorNoise * 0.2) / 1.5;

            // Map smooth noise to color range with natural blending
            colorIndex = Math.floor(smoothNoise * 8); // 0-7 range

            // Add maximum random variation to break up any patterns and seams
            const randomOffset = (Math.random() - 0.5) * 4; // ±2 variation
            colorIndex = Math.max(0, Math.min(7, colorIndex + randomOffset));

            // Additional noise-based variation for even more natural look
            const microVariation = (colorNoise - 0.5) * 2; // ±1
            colorIndex = Math.max(0, Math.min(7, Math.floor(colorIndex + microVariation)));

            const baseColor = baseColors[Math.min(colorIndex, baseColors.length - 1)];

            // Apply noise-based variation
            const terrainVariation = (combinedNoise - 0.5) * 30; // ±15
            const detailVariation = (detailNoise - 0.5) * 15; // ±7.5
            const randomVariation = (Math.random() - 0.5) * 10; // ±5

            // Calculate final RGB values
            const r = Math.max(0, Math.min(255, baseColor[0] + terrainVariation + detailVariation + randomVariation)) / 255;
            const g = Math.max(0, Math.min(255, baseColor[1] + terrainVariation + detailVariation + randomVariation)) / 255;
            const b = Math.max(0, Math.min(255, baseColor[2] + terrainVariation + detailVariation + randomVariation)) / 255;

            // Add to colors array (RGB values 0-1 for Three.js)
            colors.push(r, g, b);
        }

        // Set vertex colors on geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.color.needsUpdate = true;

        console.log('Applied vertex noise coloring - no tiling, truly unique across entire map!');
    }

    createGroundTexture(size = 1024) {
        console.log(`Creating high-resolution procedural ground texture (${size}x${size})...`);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get 2D context');
            return this.createFallbackTexture();
        }

        // Create image data for pixel-level manipulation
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Forest green focused color palette - all variations of forest green
        const baseColors = [
            [34, 139, 34],    // Forest green (base)
            [25, 120, 25],    // Darker forest green
            [40, 150, 40],    // Lighter forest green
            [30, 130, 30],    // Medium forest green
            [45, 160, 45],    // Bright forest green
            [20, 110, 20],    // Very dark forest green
            [50, 170, 50],    // Very light forest green
            [35, 140, 35],    // Standard forest green
        ];


        // Generate texture pixel by pixel
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixelIndex = (y * size + x) * 4;

                // Multiple organic noise layers for high-resolution grass terrain (adjusted for seam-free)
                const terrainNoise = this.noise(x * 0.013, y * 0.011, 0);     // Main terrain variation
                const detailNoise = this.noise(x * 0.027, y * 0.023, 1000);   // Fine details
                const colorNoise = this.noise(x * 0.051, y * 0.043, 2000);    // Color variation
                const textureNoise = this.noise(x * 0.091, y * 0.077, 3000);  // Texture pattern

                // Combine with organic weights for natural appearance
                const combinedNoise = terrainNoise * 0.6 + detailNoise * 0.25 + colorNoise * 0.1 + textureNoise * 0.05;

                // Add organic variation (maximum randomness to eliminate seams)
                const organicVariation = (Math.random() - 0.5) * 0.35;

                // Smooth color blending for natural appearance - no hard bands
                let colorIndex;

                // Use smooth interpolation between colors based on noise
                const smoothNoise = (terrainNoise + detailNoise * 0.3 + colorNoise * 0.2) / 1.5;

                // Map smooth noise to color range with natural blending
                colorIndex = Math.floor(smoothNoise * 8); // 0-7 range

                // Add maximum random variation to break up any patterns and seams
                const randomOffset = (Math.random() - 0.5) * 4; // ±2 variation
                colorIndex = Math.max(0, Math.min(7, colorIndex + randomOffset));

                // Additional noise-based variation for even more natural look
                const microVariation = (textureNoise - 0.5) * 2; // ±1
                colorIndex = Math.max(0, Math.min(7, Math.floor(colorIndex + microVariation)));

                const baseColor = baseColors[Math.min(colorIndex, baseColors.length - 1)];

                // Apply natural Age of Empires-style variation
                const terrainVariation = (combinedNoise - 0.5) * 30; // ±15 variation
                const detailVariation = (detailNoise - 0.5) * 15; // ±7.5 detail variation
                const organicVariationValue = organicVariation * 25; // ±12.5 organic variation

                // Calculate final RGB values with clamping
                const r = Math.max(0, Math.min(255, baseColor[0] + terrainVariation + organicVariationValue));
                const g = Math.max(0, Math.min(255, baseColor[1] + terrainVariation + organicVariationValue));
                const b = Math.max(0, Math.min(255, baseColor[2] + terrainVariation + organicVariationValue));

                // Set pixel data
                data[pixelIndex] = r;     // Red
                data[pixelIndex + 1] = g; // Green
                data[pixelIndex + 2] = b; // Blue
                data[pixelIndex + 3] = 255; // Alpha (fully opaque)
            }
        }

        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);

        // Add medieval European landscape details
        ctx.globalCompositeOperation = 'overlay';

        // Add subtle moss patches (darker green)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.08)'; // Forest green moss
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 2 + 0.5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add wildflowers/heather (purplish)
        ctx.fillStyle = 'rgba(138, 43, 226, 0.06)'; // Blue violet flowers
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 1.5 + 0.5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add subtle golden wildflowers
        ctx.fillStyle = 'rgba(218, 165, 32, 0.05)'; // Goldenrod flowers
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 1 + 0.5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1); // Single tile for full detail visibility
        texture.generateMipmaps = true; // Enable mipmaps for better performance

        console.log('Enhanced procedural ground texture created:', texture);
        return texture;
    }

    addTerrainHeightVariation(geometry) {
        const positions = geometry.attributes.position.array;

        // Simple terrain variation without complex noise
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];

            // Simple sinusoidal variation for gentle rolling terrain
            const elevation = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 0.5;

            // Apply subtle elevation to Y coordinate
            positions[i + 1] = elevation;
        }

        // Update geometry after modifying vertices
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals(); // Recalculate normals for proper lighting
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

        // Create obstacle for castle
        const castleObstacle = new Obstacle(castle.position, {
            type: 'building',
            collisionBounds: { width: 8, height: 8 },
            blocksMovement: true
        });
        this.obstacles.push(castleObstacle);
        castle.userData.obstacle = castleObstacle;

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

            // Create obstacle for each wall
            const wallObstacle = new Obstacle(wall.position, {
                type: 'wall',
                collisionBounds: { width: 0.5, height: 8 },
                blocksMovement: true
            });
            this.obstacles.push(wallObstacle);
            wall.userData.obstacle = wallObstacle;
        }
    }

    createTrees() {
        // Create tree textures
        const barkTexture = this.createTreeBarkTexture();
        const leafTexture = this.createTreeLeafTexture();

        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6);
        const treeMaterial = new THREE.MeshLambertMaterial({
            map: barkTexture,
            transparent: false
        });

        const leavesGeometry = new THREE.SphereGeometry(3);
        const leavesMaterial = new THREE.MeshLambertMaterial({
            map: leafTexture,
            transparent: false
        });

        const minTreeDistance = 8; // Minimum distance between trees
        const maxAttempts = 50; // Max attempts to find valid position

        for (let i = 0; i < 20; i++) {
            let validPosition = false;
            let attempts = 0;
            let treeX, treeZ;

            // Try to find a valid position that doesn't overlap with existing obstacles
            while (!validPosition && attempts < maxAttempts) {
                treeX = (Math.random() - 0.5) * 80;
                treeZ = (Math.random() - 0.5) * 80;

                const testPosition = new THREE.Vector3(treeX, 0, treeZ);
                validPosition = true;

                // Check distance from all existing obstacles
                for (const obstacle of this.obstacles) {
                    if (obstacle.containsPoint(testPosition) ||
                        obstacle.position.distanceTo(testPosition) < minTreeDistance) {
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

            const treePosition = new THREE.Vector3(treeX, 0, treeZ);

            // Create obstacle for this tree
            const treeObstacle = new Obstacle(treePosition, {
                type: 'tree',
                collisionRadius: 2.5,
                blocksMovement: true
            });
            this.obstacles.push(treeObstacle);

            // Tree trunk
            const trunk = new THREE.Mesh(treeGeometry, treeMaterial);
            trunk.position.set(treeX, 3, treeZ);
            trunk.castShadow = true;
            trunk.userData = { type: 'tree', id: i, obstacle: treeObstacle };
            this.scene.add(trunk);

            // Tree leaves
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(treeX, 3 + 4, treeZ);
            leaves.castShadow = true;
            leaves.userData = { type: 'tree_leaves', treeId: i };
            this.scene.add(leaves);
        }

        console.log(`Created ${this.obstacles.filter(o => o.type === 'tree').length} trees with proper spacing`);
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
        northWall.castShadow = false; // Disable shadows on boundary walls
        northWall.receiveShadow = true;
        northWall.userData = { type: 'wall', boundary: 'north' };
        this.scene.add(northWall);

        // Create obstacle for north wall
        const northObstacle = new Obstacle(northWall.position, {
            type: 'world_boundary',
            collisionBounds: { width: worldSize + wallThickness * 2, height: wallThickness },
            blocksMovement: true
        });
        this.obstacles.push(northObstacle);
        northWall.userData.obstacle = northObstacle;

        // South wall (negative Z)
        const southWallGeometry = new THREE.BoxGeometry(worldSize + wallThickness * 2, wallHeight, wallThickness);
        const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, wallHeight / 2, -worldSize / 2 - wallThickness / 2);
        southWall.castShadow = false; // Disable shadows on boundary walls
        southWall.receiveShadow = true;
        southWall.userData = { type: 'wall', boundary: 'south' };
        this.scene.add(southWall);

        // Create obstacle for south wall
        const southObstacle = new Obstacle(southWall.position, {
            type: 'world_boundary',
            collisionBounds: { width: worldSize + wallThickness * 2, height: wallThickness },
            blocksMovement: true
        });
        this.obstacles.push(southObstacle);
        southWall.userData.obstacle = southObstacle;

        // East wall (positive X)
        const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, worldSize);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(worldSize / 2 + wallThickness / 2, wallHeight / 2, 0);
        eastWall.castShadow = false; // Disable shadows on boundary walls to prevent edge artifacts
        eastWall.receiveShadow = true;
        eastWall.userData = { type: 'wall', boundary: 'east' };
        this.scene.add(eastWall);

        // Create obstacle for east wall
        const eastObstacle = new Obstacle(eastWall.position, {
            type: 'world_boundary',
            collisionBounds: { width: wallThickness, height: worldSize },
            blocksMovement: true
        });
        this.obstacles.push(eastObstacle);
        eastWall.userData.obstacle = eastObstacle;

        // West wall (negative X)
        const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, worldSize);
        const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-worldSize / 2 - wallThickness / 2, wallHeight / 2, 0);
        westWall.castShadow = false; // Disable shadows on boundary walls
        westWall.receiveShadow = true;
        westWall.userData = { type: 'wall', boundary: 'west' };
        this.scene.add(westWall);

        // Create obstacle for west wall
        const westObstacle = new Obstacle(westWall.position, {
            type: 'world_boundary',
            collisionBounds: { width: wallThickness, height: worldSize },
            blocksMovement: true
        });
        this.obstacles.push(westObstacle);
        westWall.userData.obstacle = westObstacle;

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
        // Foot position relative to player group origin:
        // torsoHeight/2 + hipToThighCenter + thighToKnee + kneeToCalfCenter + calfToFoot
        // = 0.288 + 0.243 + 0.486 + 0.219 + 0.477 = 1.713

        const torsoCenterY = torsoHeight / 2; // 0.288 (torso center from group origin)
        const hipToThighCenter = (legLength * 0.5) / 2; // 0.243 (thigh center below hip)
        const thighToKnee = legLength * 0.5; // 0.486 (knee below thigh center)
        const kneeToCalfCenter = (legLength * 0.45) / 2; // 0.219 (calf center below knee)
        const calfToFoot = (legLength * 0.45) + 0.04; // 0.477 (foot below calf)

        const feetOffset = torsoCenterY + hipToThighCenter + thighToKnee + kneeToCalfCenter + calfToFoot; // 1.713

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
            <div class="camera-controls">
                <button class="camera-btn active" id="isometric-btn" title="Isometric View">📐</button>
                <button class="camera-btn" id="first-person-btn" title="First Person View">👁️</button>
                <button class="camera-btn" id="birds-eye-btn" title="Bird's Eye View">🦅</button>
            </div>
        `;
        document.body.appendChild(minimap);

        // Add camera control event listeners
        this.setupCameraControls();
    }

    setupCameraControls() {
        const isometricBtn = document.getElementById('isometric-btn');
        const firstPersonBtn = document.getElementById('first-person-btn');
        const birdsEyeBtn = document.getElementById('birds-eye-btn');

        // Current camera mode tracking
        this.currentCameraMode = 'isometric';

        isometricBtn.addEventListener('click', () => {
            this.setCameraMode('isometric');
            this.updateCameraButtons('isometric');
        });

        firstPersonBtn.addEventListener('click', () => {
            this.setCameraMode('first-person');
            this.updateCameraButtons('first-person');
        });

        birdsEyeBtn.addEventListener('click', () => {
            this.setCameraMode('birds-eye');
            this.updateCameraButtons('birds-eye');
        });
    }

    setCameraMode(mode) {
        this.currentCameraMode = mode;

        switch(mode) {
            case 'isometric':
                // ISOMETRIC CAMERA: View from south at an angle
                this.camera.position.set(0, 45, 45); // Position south of origin, elevated
                this.camera.lookAt(0, 0, 0); // Looking at origin from isometric angle
                break;

            case 'first-person':
                // FIRST PERSON: Behind the player, eye-level
                const playerPos = this.player.position.clone();
                this.camera.position.set(playerPos.x, playerPos.y + 1.7, playerPos.z - 2); // Behind player
                this.camera.lookAt(playerPos.x, playerPos.y + 1.7, playerPos.z + 10); // Look ahead
                break;

            case 'birds-eye':
                // BIRD'S EYE: High above, looking straight down
                this.camera.position.set(0, 80, 0); // High above center
                this.camera.lookAt(0, 0, 0); // Look straight down
                break;
        }

        // Reset camera look-at target for smooth interpolation
        this.cameraLookAtTarget = null;
    }

    updateCameraButtons(activeMode) {
        // Remove active class from all buttons
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current mode button
        const activeBtn = document.getElementById(`${activeMode}-btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
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

        // MOBILE TOUCH SUPPORT - COMPREHENSIVE SINGLE LISTENER
        let touchStartTime = 0;
        let lastTouchEndTime = 0;

        canvas.addEventListener('touchstart', (event) => {
            touchStartTime = Date.now();
            // Handle zoom start for multi-touch
            if (event.touches.length === 2) {
                event.preventDefault();
                this.touchZoomEnabled = true;
                this.initialTouchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
                this.initialZoom = this.currentZoom;
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (event) => {
            // Handle zoom during multi-touch
            if (this.touchZoomEnabled && event.touches.length === 2) {
                event.preventDefault();
                const currentDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
                const zoomFactor = currentDistance / this.initialTouchDistance;
                const newZoom = this.initialZoom / zoomFactor;
                this.setZoom(newZoom);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (event) => {
            const currentTime = Date.now();
            const timeSinceStart = currentTime - touchStartTime;
            const timeSinceLastEnd = currentTime - lastTouchEndTime;

            // Prevent rapid-fire touches (debounce)
            if (timeSinceLastEnd < 200) {
                console.log('Ignoring rapid touch end');
                return;
            }

            // Only handle single touch taps (not multi-touch or long presses)
            if (event.changedTouches.length === 1 &&
                !this.touchZoomEnabled &&
                timeSinceStart < 500 && // Not a long press
                timeSinceStart > 50) { // Not too short

                event.preventDefault();
                const touch = event.changedTouches[0];

                console.log('Processing single touch tap at:', touch.clientX, touch.clientY);
                this.handleTouchMove(touch);

                lastTouchEndTime = currentTime;
            }

            // Reset zoom state when all touches end
            if (event.touches.length === 0) {
                this.touchZoomEnabled = false;
            }
        }, { passive: false });

        // Mouse wheel zoom (like WoW)
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? 0.1 : -0.1;
            this.setZoom(this.currentZoom + delta);
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
        console.log('=== NEW CLICK DETECTED ===');
        console.log('Raycaster set from camera with mouse coords:', this.mouse.x.toFixed(3), this.mouse.y.toFixed(3));

        // Use plane intersection for reliable click-to-move positioning
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 plane
            const planeIntersect = new THREE.Vector3();
        const intersectionResult = this.raycaster.ray.intersectPlane(plane, planeIntersect);

        console.log('Plane intersection result:', intersectionResult);
        console.log('Plane intersect point:', planeIntersect.x, planeIntersect.y, planeIntersect.z);

        let intersects = [];
            if (planeIntersect && !isNaN(planeIntersect.x) && !isNaN(planeIntersect.y) && !isNaN(planeIntersect.z)) {
                intersects = [{ point: planeIntersect }];
            console.log('Valid click position:', planeIntersect.x, planeIntersect.z);
        } else {
            console.log('Invalid plane intersection - no valid point found');
        }

        if (intersects.length > 0) {
            const targetPos = intersects[0].point;
            console.log('Target position:', targetPos.x, targetPos.y, targetPos.z);

            // Always allow clicking - let pathfinding handle obstacles (like League of Legends)
            const pathPoints = this.calculatePath(this.player.position, targetPos);
            if (pathPoints.length === 0) {
                console.log('Cannot find any path to position - completely surrounded');
                // Clear any existing path visuals since no path was found
                this.clearWaypointMarkers();
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
                // Clear any existing path visuals since no path was found
                this.clearWaypointMarkers();
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
        console.log('=== SETTING MOVEMENT TARGET ===');
        console.log('New target position:', targetPosition.x.toFixed(4), targetPosition.y.toFixed(4), targetPosition.z.toFixed(4));
        console.log('Current player position:', this.player.position.x.toFixed(4), this.player.position.z.toFixed(4));

        // Simple click-to-move: use exact click position
        this.targetPosition = targetPosition.clone();

        // Calculate the correct feet Y position
        const totalHeight = 1.8;
        const torsoHeight = totalHeight * 0.32;
        const legLength = totalHeight * 0.54;

        const torsoCenterY = torsoHeight / 2;
        const hipToThighCenter = (legLength * 0.5) / 2;
        const thighToKnee = legLength * 0.5;
        const kneeToCalfCenter = (legLength * 0.45) / 2;
        const calfToFoot = (legLength * 0.45) + 0.04;

        const feetOffset = torsoCenterY + hipToThighCenter + thighToKnee + kneeToCalfCenter + calfToFoot;
        this.targetPosition.y = feetOffset; // Keep feet at ground level

        // DON'T create destination markers for intermediate waypoints
        // Only the final destination should have a marker (handled in setPathMovement)

        // Start moving towards target
        this.isMoving = true;
        console.log('Movement started, isMoving =', this.isMoving);
    }

    createWaypointMarker(position, isFinalDestination = false) {
        // Create new marker - only final destination now, make it smaller
        const markerGeometry = new THREE.CircleGeometry(0.15, 12); // Much smaller size for destination marker
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00, // Yellow for destination
            transparent: true,
            opacity: 0.8, // Good opacity for destination
            side: THREE.DoubleSide
        });

        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(position);
        marker.position.y = 0.01; // Just above ground level
        marker.rotation.x = -Math.PI / 2; // Lay flat on ground

        // Store marker info for animation and cleanup
        marker.isFinalDestination = isFinalDestination;
        marker.animationTime = 0;

        // Add to scene and store reference
        this.scene.add(marker);
        this.waypointMarkers.push(marker);

        return marker;
    }

    clearWaypointMarkers() {
        // Remove all waypoint markers from scene
        this.waypointMarkers.forEach(marker => {
            this.scene.remove(marker);
        });
        this.waypointMarkers = [];
    }


    createDestinationMarker(position) {
        // Legacy method - now uses waypoint marker system
        return this.createWaypointMarker(position, true);
    }

    updateWaypointMarkers() {
        // Update animation for all waypoint markers
        this.waypointMarkers.forEach(marker => {
            marker.animationTime += 0.05;

            // Different animation patterns for different marker types
            if (marker.isFinalDestination) {
                // Final destination: steady pulsing
                marker.material.opacity = 0.8 + Math.sin(marker.animationTime * 5) * 0.2;
            } else {
                // Intermediate waypoints: faster, more subtle pulsing
                marker.material.opacity = 0.6 + Math.sin(marker.animationTime * 8) * 0.15;
            }
        });


    }

    updateDestinationMarker() {
        // Legacy method - now delegates to updateWaypointMarkers
        this.updateWaypointMarkers();
    }

    showClickEffect(position) {
        // DISABLED: Click effect removed to hide crosshair
        // No visual feedback when clicking
    }

    handleTouchMove(touch) {
        // Update mouse coordinates for raycasting (consistent with mouse handling)
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();

        // Store raw coordinates
        this.mouseX = touch.clientX;
        this.mouseY = touch.clientY;

        // Calculate normalized device coordinates (-1 to +1)
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        console.log('Touch coords - raw:', touch.clientX, touch.clientY, 'normalized:', this.mouse.x.toFixed(3), this.mouse.y.toFixed(3));

        // Create fake mouse event for consistency
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
        if (object.userData?.type === 'npc') {
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


    talkToNPC(npc) {
        console.log('Talking to NPC:', npc.userData.name);
        // Show dialogue
    }

    gatherResource(resource) {
        console.log('Gathering resource:', resource.userData.type);
        // Integrate with existing gathering system
    }

    forceStopMovement() {
        console.log('=== FORCE STOP MOVEMENT ===');
        // Snap to target position if it exists
        if (this.targetPosition) {
            this.player.position.x = this.targetPosition.x;
            this.player.position.z = this.targetPosition.z;
            this.player.position.y = this.targetPosition.y;
        }

        // Reset all movement state
        this.isMoving = false;
        this.targetPosition = null;
        this.pathPoints = [];
        this.currentPathIndex = 0;
        this.isWalking = false;
        this.resetPlayerPose();
        this.clearWaypointMarkers();
        console.log('Movement force-stopped, player at:', this.player.position.x.toFixed(2), this.player.position.z.toFixed(2));
    }

    update(deltaTime = 16.67) { // Default to ~60fps delta time
        // Handle player movement with delta time for consistency
        this.handleMovement(deltaTime);

        // No keyboard movement - only click to move

        // Update camera to follow player (camera already handles its own timing)
        this.updateCamera();

        // Update minimap
        this.updateMinimap();

        // Update waypoint markers
        this.updateWaypointMarkers();

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
        const rawDirection = new THREE.Vector3()
            .subVectors(this.targetPosition, this.player.position);

        // Check if direction vector is valid (not zero-length)
        if (rawDirection.length() < 0.001) {
            console.log('FORCE STOP: Direction vector too small, player already at target');
            this.forceStopMovement();
            return;
        }

        const direction = rawDirection.normalize();

        // Calculate distance to target
        const distance = this.player.position.distanceTo(this.targetPosition);
        console.log('Distance to target:', distance.toFixed(4), 'Position:', this.player.position.x.toFixed(2), this.player.position.z.toFixed(2), 'Target:', this.targetPosition.x.toFixed(2), this.targetPosition.z.toFixed(2));

        // Safety check: if distance is very small or NaN, force stop
        if (isNaN(distance) || distance < 0.05) { // Even more forgiving threshold
            console.log('FORCE STOP: Distance too small or invalid:', distance);
            this.forceStopMovement();
            return;
        }

        if (distance < 0.1) { // Increased threshold from 0.01 to 0.1 for touch imprecision
            // Reached current waypoint
            console.log('Reached waypoint:', this.currentPathIndex, 'Distance:', distance.toFixed(4));

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
                // Clear all waypoint markers when reaching final destination
                this.clearWaypointMarkers();
                return;
            }
        }

        // WORLD-CLASS SMOOTH MOVEMENT: Use delta time for consistent speed across frame rates
        const moveDistance = (this.moveSpeed * deltaTime) / 16.67; // Normalize to 60fps
        const moveVector = direction.multiplyScalar(moveDistance);

        // Check collision with obstacles before applying movement
        const newPosition = this.player.position.clone().add(moveVector);

        if (this.checkCollisions(newPosition)) {
            // Apply smooth movement if no collision
            this.player.position.add(moveVector);
            console.log('Moving player - Distance to target:', distance.toFixed(4), 'Move distance:', moveDistance.toFixed(4));
        } else {
            console.log('Movement blocked by obstacle');
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
        const torsoHeight = totalHeight * 0.32; // Same as createPlayer
        const legLength = totalHeight * 0.54; // Same calculation as in createPlayer

        // Use the same corrected calculation as createPlayer
        const torsoCenterY = torsoHeight / 2;
        const hipToThighCenter = (legLength * 0.5) / 2;
        const thighToKnee = legLength * 0.5;
        const kneeToCalfCenter = (legLength * 0.45) / 2;
        const calfToFoot = (legLength * 0.45) + 0.04;

        const feetOffset = torsoCenterY + hipToThighCenter + thighToKnee + kneeToCalfCenter + calfToFoot;
        this.player.position.y = feetOffset; // Feet at ground level (Y=0)
    }

    updateCamera() {
        // Only update camera position for isometric mode
        if (this.currentCameraMode === 'isometric') {
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
        } else if (this.currentCameraMode === 'first-person') {
            // FIRST PERSON: Keep camera behind player
            const playerPos = this.player.position.clone();
            this.camera.position.set(playerPos.x, playerPos.y + 1.7, playerPos.z - 2);
            this.camera.lookAt(playerPos.x, playerPos.y + 1.7, playerPos.z + 10);
        } else if (this.currentCameraMode === 'birds-eye') {
            // BIRD'S EYE: Stay high above center
            this.camera.position.set(0, 80, 0);
            this.camera.lookAt(0, 0, 0);
        }
    }

    // Zoom system methods
    setZoom(zoomLevel) {
        // Clamp zoom level within bounds
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));

        // Update camera frustum size
        this.updateCameraZoom();
    }

    zoomIn(delta = 0.1) {
        this.setZoom(this.currentZoom - delta);
    }

    zoomOut(delta = 0.1) {
        this.setZoom(this.currentZoom + delta);
    }

    updateCameraZoom() {
        if (!this.camera) return;

        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = this.baseFrustumSize * this.currentZoom;

        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;

        this.camera.updateProjectionMatrix();
    }

    // Calculate distance between two touch points
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    checkCollisions(position) {
        const playerRadius = 1; // Player collision radius

        // Check collision with all obstacles that block movement
        for (const obstacle of this.obstacles) {
            if (!obstacle.blocksMovement) continue;

            if (obstacle.containsPoint(position)) {
                return false; // Collision detected, don't allow movement
            }
        }

        return true; // No collision, allow movement
    }

    // Generic pathfinding methods for avoiding obstacles
    calculatePath(startPos, targetPos) {
        // First, try direct path
        if (this.checkDirectPath(startPos, targetPos)) {
            console.log('Direct path clear');
            return [targetPos.clone()];
        }

        console.log('Direct path blocked, finding detour...');

        // If direct path is blocked, find a detour around blocking obstacles
        const detourPoint = this.findDetourPoint(startPos, targetPos);
        if (detourPoint) {
            console.log('Found detour at:', detourPoint.x.toFixed(2), detourPoint.z.toFixed(2));
            return [detourPoint, targetPos.clone()];
        }

        console.log('No detour found - target may be unreachable');
        // If no detour found, return empty path (can't reach target)
        return [];
    }

    checkDirectPath(startPos, targetPos) {
        // Check if the straight line path is blocked by obstacles
        const direction = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();

        const distance = startPos.distanceTo(targetPos);

        // If distance is very small, consider it clear
        if (distance < 0.5) return true;

        const steps = Math.max(8, Math.floor(distance / 1.5)); // More thorough checking

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkPoint = new THREE.Vector3()
                .copy(startPos)
                .add(direction.clone().multiplyScalar(distance * t));

            if (!this.checkCollisions(checkPoint)) {
                return false; // Path is blocked
            }
        }

        return true; // Path is clear
    }

    findDetourPoint(startPos, targetPos) {
        // Find all obstacles that might be blocking the path
        const blockingObstacles = this.findAllBlockingObstacles(startPos, targetPos);

        if (blockingObstacles.length === 0) return null;

        // For each blocking obstacle, try to find a good detour
        for (const obstacle of blockingObstacles) {
            const detour = this.calculateObstacleDetour(startPos, targetPos, obstacle);
            if (detour) {
                return detour;
            }
        }

        // If no good detour found around individual obstacles, try a more aggressive approach
        return this.findAggressiveDetour(startPos, targetPos);
    }

    findAllBlockingObstacles(startPos, targetPos) {
        const blockingObstacles = [];
        const direction = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();

        const distance = startPos.distanceTo(targetPos);

        // Check all obstacles to see which ones intersect the path
        for (const obstacle of this.obstacles) {
            if (!obstacle.blocksMovement) continue;

            // Project obstacle position onto the path line
            const toObstacle = new THREE.Vector3(
                obstacle.position.x - startPos.x,
                0,
                obstacle.position.z - startPos.z
            );
            const projection = toObstacle.dot(direction);
            const projectedPoint = new THREE.Vector3()
                .copy(startPos)
                .add(direction.clone().multiplyScalar(projection));

            // Check if obstacle is close to the path
            const obstacleToPath = Math.sqrt(
                Math.pow(obstacle.position.x - projectedPoint.x, 2) +
                Math.pow(obstacle.position.z - projectedPoint.z, 2)
            );

            // Include obstacle if it's within reasonable distance of path and in the path direction
            const bufferDistance = obstacle.collisionRadius || 3;
            if (obstacleToPath < bufferDistance && projection > 0 && projection < distance) {
                blockingObstacles.push(obstacle);
            }
        }

        return blockingObstacles;
    }

    calculateObstacleDetour(startPos, targetPos, obstacle) {
        const obstacleVector = obstacle.position.clone();
        const obstacleRadius = obstacle.collisionRadius || 3;
        const detourDistance = obstacleRadius + 2.5; // Slightly larger detour

        // Calculate the direction from start to target
        const pathDirection = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();

        // Calculate perpendicular directions for detour
        const perpendicular = new THREE.Vector3(-pathDirection.z, 0, pathDirection.x);

        // Try both directions around the obstacle
        const detourDirections = [
            perpendicular.clone(),
            perpendicular.clone().negate()
        ];

        let bestDetour = null;
        let bestScore = Infinity;

        for (const dir of detourDirections) {
            // Calculate detour point
            const detourPoint = new THREE.Vector3()
                .copy(obstacleVector)
                .add(dir.clone().multiplyScalar(detourDistance));

            // Check if this detour is viable
            if (this.checkDirectPath(startPos, detourPoint) &&
                this.checkDirectPath(detourPoint, targetPos)) {

                // Calculate a score based on path efficiency
                const detourDistanceTotal = startPos.distanceTo(detourPoint) + detourPoint.distanceTo(targetPos);
                const directDistance = startPos.distanceTo(targetPos);
                const efficiencyScore = detourDistanceTotal / directDistance;

                // Prefer detours that are reasonably efficient (not too much longer than direct path)
                if (efficiencyScore < 2.0 && efficiencyScore < bestScore) {
                    bestScore = efficiencyScore;
                    bestDetour = detourPoint;
                }
            }
        }

        return bestDetour;
    }

    findAggressiveDetour(startPos, targetPos) {
        // More aggressive detour: try larger detour distances and more angles
        const detourDistances = [3, 4, 5]; // Increasing detour distances
        const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; // More angles

        let bestDetour = null;
        let bestScore = Infinity;

        for (const distance of detourDistances) {
            for (const angle of angles) {
                const radians = (angle * Math.PI) / 180;
                const detourPoint = new THREE.Vector3(
                    startPos.x + Math.cos(radians) * distance,
                    0,
                    startPos.z + Math.sin(radians) * distance
                );

                // Check if this detour leads to the target
                if (this.checkDirectPath(detourPoint, targetPos)) {
                    const detourDistanceTotal = startPos.distanceTo(detourPoint) + detourPoint.distanceTo(targetPos);
                    const directDistance = startPos.distanceTo(targetPos);
                    const efficiencyScore = detourDistanceTotal / directDistance;

                    if (efficiencyScore < bestScore) {
                        bestScore = efficiencyScore;
                        bestDetour = detourPoint;
                    }
                }
            }
        }

        return bestDetour;
    }


    setPathMovement(pathPoints) {
        this.pathPoints = pathPoints;
        this.currentPathIndex = 0;

        // Clear existing waypoint markers
        this.clearWaypointMarkers();

        if (pathPoints.length > 0) {
            // Only create marker for the final destination
            const finalDestination = pathPoints[pathPoints.length - 1];
            this.createWaypointMarker(finalDestination, true);

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
        // Update camera zoom to maintain current zoom level with new aspect ratio
        this.updateCameraZoom();
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

}

// Initialize 3D game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Game3D...');
    const game3D = new Game3D();

    // Make game3D available globally for integration with existing game
    window.game3D = game3D;
    console.log('Game3D initialization complete');
});
