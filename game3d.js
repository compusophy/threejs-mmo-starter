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

        // Camera is always isometric - no mode switching

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
            0.5,  // Adjusted near clipping plane to prevent z-fighting
            800   // Reduced far clipping plane for better depth precision
        );

        // ISOMETRIC CAMERA: View from south at an angle
        this.camera.position.set(0, 45, 45); // Position south of origin, elevated
        this.camera.lookAt(0, 0, 0); // Looking at origin from isometric angle

        // Renderer setup - optimized for mobile performance
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: window.innerWidth > 768, // Disable antialiasing on mobile for performance
            powerPreference: "high-performance" // Prefer high-performance GPU
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // High quality soft shadows

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

        // Printer input typing (active only when focused)
        window.addEventListener('keydown', (e) => {
            if (!this.printerStation || !this.printerStation.userData?.active) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                this.generatePrinterImage();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                this.printerInputText = (this.printerInputText || '').slice(0, -1);
                return;
            }
            if (e.key.length === 1) {
                this.printerInputText = (this.printerInputText || '') + e.key;
            }
        });

        // Remove global menu hotkeys per design – menus open via in-world objects only
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun) - optimized for mobile performance
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 60, 10); // Moved more to the side and higher to reduce edge shadows
        directionalLight.castShadow = true;

        // High quality shadow mapping
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5; // Prevent z-fighting
        directionalLight.shadow.camera.far = 400; // Good shadow distance
        directionalLight.shadow.camera.left = -120; // Larger shadow area for quality
        directionalLight.shadow.camera.right = 120;
        directionalLight.shadow.camera.top = 120;
        directionalLight.shadow.camera.bottom = -120;

        // High quality shadow settings
        directionalLight.shadow.bias = -0.0001; // Fine-tuned bias for quality
        directionalLight.shadow.radius = 2; // Softer, higher quality shadows
        this.scene.add(directionalLight);

        // Add fog for atmospheric depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
    }

    createWorld() {
        // Ground plane with optimized geometry for mobile performance
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50); // Reduced subdivision for mobile

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
        this.createWorkbench(); // Add workbench near center
        this.createItemLoader(); // Add item loader nearby
        this.createPrinterStation(); // Add in-world image printer station

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
        console.log(`Creating ultra-detailed tree leaf texture (${size}x${size}) matching ground quality...`);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error('Failed to get 2D context for leaf texture');
            return new THREE.CanvasTexture(canvas);
        }

        // Create leaf pattern using SAME sophisticated noise system as ground
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Enhanced darker green leaf color palette - matching forest theme with more depth
        const leafColors = [
            [12, 65, 12],      // Ultra dark forest green
            [18, 85, 18],      // Very dark forest green
            [15, 75, 15],      // Deep forest green
            [22, 95, 22],      // Dark forest green
            [28, 115, 28],     // Medium-dark forest green
            [25, 105, 25],     // Standard dark forest green
            [32, 125, 32],     // Medium forest green
            [35, 135, 35],     // Standard forest green
        ];

        // Generate texture pixel by pixel with SAME LEVEL OF DETAIL as ground
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const pixelIndex = (y * size + x) * 4;

                // Use SAME sophisticated multi-layer noise system as ground texture
                const terrainNoise = this.noise(x * 0.013, y * 0.011, 0);     // Main leaf variation (irregular frequencies like ground)
                const detailNoise = this.noise(x * 0.027, y * 0.023, 1000);   // Fine details
                const colorNoise = this.noise(x * 0.051, y * 0.043, 2000);    // Color variation
                const textureNoise = this.noise(x * 0.091, y * 0.077, 3000);  // Surface texture
                const microNoise = this.noise(x * 0.163, y * 0.139, 4000);    // Micro details for extra realism

                // Combine with organic weights for natural leaf appearance - SAME as ground
                const combinedNoise = terrainNoise * 0.6 + detailNoise * 0.25 + colorNoise * 0.1 + textureNoise * 0.03 + microNoise * 0.02;

                // Add organic variation (maximum randomness to eliminate seams like ground)
                const organicVariation = (Math.random() - 0.5) * 0.35;

                // Smooth color blending for natural appearance - no hard bands
                let colorIndex;

                // Use smooth interpolation between colors based on noise - SAME as ground
                const smoothNoise = (terrainNoise + detailNoise * 0.3 + colorNoise * 0.2) / 1.5;

                // Map smooth noise to color range with natural blending
                colorIndex = Math.floor(smoothNoise * 8); // 0-7 range

                // Add maximum random variation to break up any patterns and seams
                const randomOffset = (Math.random() - 0.5) * 4; // ±2 variation (SAME as ground)
                colorIndex = Math.max(0, Math.min(7, colorIndex + randomOffset));

                // Additional noise-based variation for even more natural look
                const microVariation = (textureNoise - 0.5) * 2; // ±1
                colorIndex = Math.max(0, Math.min(7, Math.floor(colorIndex + microVariation)));

                const baseColor = leafColors[Math.min(colorIndex, leafColors.length - 1)];

                // Apply natural Age of Empires-style variation - SAME as ground
                const terrainVariation = (combinedNoise - 0.5) * 30; // ±15 variation (SAME as ground)
                const detailVariation = (detailNoise - 0.5) * 15; // ±7.5 detail variation
                const organicVariationValue = organicVariation * 25; // ±12.5 organic variation
                const microVariationValue = (microNoise - 0.5) * 8; // ±4 micro variation

                // Calculate final RGB values with clamping
                const r = Math.max(0, Math.min(255, baseColor[0] + terrainVariation + organicVariationValue + microVariationValue));
                const g = Math.max(0, Math.min(255, baseColor[1] + terrainVariation + organicVariationValue + microVariationValue));
                const b = Math.max(0, Math.min(255, baseColor[2] + terrainVariation + organicVariationValue + microVariationValue));

                // Set pixel data
                data[pixelIndex] = r;     // Red
                data[pixelIndex + 1] = g; // Green
                data[pixelIndex + 2] = b; // Blue
                data[pixelIndex + 3] = 255; // Alpha (fully opaque)
            }
        }

        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);

        // Add detailed leaf details using SAME techniques as ground
        ctx.globalCompositeOperation = 'overlay';

        // Add moss-like darker patches (like ground moss)
        ctx.fillStyle = 'rgba(15, 65, 15, 0.12)'; // Very dark green moss
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 4 + 1.5;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add vein-like details (darker lines)
        ctx.strokeStyle = 'rgba(10, 50, 10, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 25; i++) {
            const startX = Math.random() * size;
            const startY = Math.random() * size;
            const endX = startX + (Math.random() - 0.5) * 20;
            const endY = startY + (Math.random() - 0.5) * 20;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Add subtle highlights for leaf realism (enhanced)
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(60, 179, 113, 0.08)'; // Dark sea green highlights
        for (let i = 0; i < 20; i++) { // More highlights for detail
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 2.5 + 0.8;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add sunlight dappling effect
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 6 + 2;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3); // Leaf pattern repeat

        console.log('Ultra-detailed tree leaf texture created with ground-matching quality');
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
                // Place trees near the edges of the 200x200 world instead of center
                const worldHalfSize = 100; // World extends from -100 to 100
                const side = Math.floor(Math.random() * 4); // 0:North,1:East,2:South,3:West
                const edgeInset = 8 + Math.random() * 8; // keep inside walls and away from path edges
                const along = (Math.random() - 0.5) * 160; // range along the edge (-80..80)

                if (side === 0) { // North edge (+Z)
                    treeX = along;
                    treeZ = worldHalfSize - edgeInset;
                } else if (side === 1) { // East edge (+X)
                    treeX = worldHalfSize - edgeInset;
                    treeZ = along;
                } else if (side === 2) { // South edge (-Z)
                    treeX = along;
                    treeZ = -worldHalfSize + edgeInset;
                } else { // West edge (-X)
                    treeX = -worldHalfSize + edgeInset;
                    treeZ = along;
                }

                // Add slight jitter to avoid perfectly straight lines
                treeX += (Math.random() - 0.5) * 2;
                treeZ += (Math.random() - 0.5) * 2;

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

    createWorkbench() {
        // Create a wooden workbench near the center of the map
        const workbenchPosition = new THREE.Vector3(3, 0, 3); // Slightly offset from center

        // Create workbench group
        const workbench = new THREE.Group();
        workbench.position.copy(workbenchPosition);

        // Wood material for the workbench
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Saddle brown

        // Create the tabletop (flat surface)
        const tabletopGeometry = new THREE.BoxGeometry(3, 0.1, 2);
        const tabletop = new THREE.Mesh(tabletopGeometry, woodMaterial);
        tabletop.position.set(0, 0.8, 0); // Top surface at comfortable working height
        tabletop.castShadow = true;
        tabletop.receiveShadow = true;
        workbench.add(tabletop);

        // Create legs (4 legs at corners)
        const legGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
        const legPositions = [
            [-1.3, 0.35, -0.9], // Front left
            [1.3, 0.35, -0.9],  // Front right
            [-1.3, 0.35, 0.9],  // Back left
            [1.3, 0.35, 0.9]    // Back right
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, woodMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            workbench.add(leg);
        });

        // Add some tools on the workbench (optional decorative elements)
        // Hammer handle
        const hammerHandleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
        const hammerHandle = new THREE.Mesh(hammerHandleGeometry, woodMaterial);
        hammerHandle.position.set(0.5, 0.95, 0.3);
        hammerHandle.rotation.z = Math.PI / 4;
        hammerHandle.castShadow = true;
        workbench.add(hammerHandle);

        // Add character loader button to workbench
        const characterButtonGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
        const characterButtonMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5cf6 });
        const characterButton = new THREE.Mesh(characterButtonGeometry, characterButtonMaterial);
        characterButton.position.set(-0.5, 0.95, 0.5);
        characterButton.castShadow = true;
        characterButton.userData = { type: 'character_loader_button' };
        workbench.add(characterButton);

        // Add text label for character button
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Character Loader', 4, 20);
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshLambertMaterial({ map: texture, transparent: true });
        const textGeometry = new THREE.PlaneGeometry(0.6, 0.15);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(-0.5, 0.98, 0.5);
        textMesh.rotation.x = -Math.PI / 2;
        workbench.add(textMesh);

        // Hammer head
        const hammerHeadGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.15);
        const hammerHeadMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F }); // Dark gray
        const hammerHead = new THREE.Mesh(hammerHeadGeometry, hammerHeadMaterial);
        hammerHead.position.set(0.7, 0.95, 0.3);
        hammerHead.castShadow = true;
        workbench.add(hammerHead);

        // Add workbench to scene
        this.scene.add(workbench);

        // Create obstacle for collision detection
        const workbenchObstacle = new Obstacle(workbenchPosition, {
            type: 'workbench',
            collisionBounds: { width: 3, height: 2 },
            blocksMovement: true,
            blocksLineOfSight: false
        });
        this.obstacles.push(workbenchObstacle);
        workbench.userData = { type: 'workbench', obstacle: workbenchObstacle };

        console.log('Created workbench near center of map at:', workbenchPosition.x, workbenchPosition.z);
    }

    // === PRINTER STATION (In-world image generator) ===
    createPrinterStation() {
        const pos = new THREE.Vector3(-3, 0, 3);
        const printer = new THREE.Group();
        printer.position.copy(pos);

        // Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.0), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        base.position.y = 0.1;
        base.castShadow = true; base.receiveShadow = true;
        printer.add(base);

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.8), new THREE.MeshLambertMaterial({ color: 0x555555 }));
        body.position.y = 0.5;
        body.castShadow = true; body.receiveShadow = true;
        printer.add(body);

        // Output tray
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        tray.position.set(0, 0.25, 0.65);
        tray.castShadow = true; tray.receiveShadow = true;
        printer.add(tray);

        // 3D Prompt panel (type here)
        const panelGeo = new THREE.PlaneGeometry(0.9, 0.4);
        const panelMat = new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide });
        const promptPanel = new THREE.Mesh(panelGeo, panelMat);
        promptPanel.position.set(0, 0.7, -0.38);
        promptPanel.rotation.x = -Math.PI / 10;
        printer.add(promptPanel);

        // 3D text textures for system prompt and user prompt (rendered to canvas textures)
        const makeTextPlane = (text, w = 512, h = 128) => {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#8AB4F8'; ctx.font = 'bold 28px Arial';
            ctx.fillText(text, 16, 40);
            const tex = new THREE.CanvasTexture(canvas);
            tex.needsUpdate = true;
            const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true });
            const g = new THREE.PlaneGeometry(0.9, 0.2);
            const mesh = new THREE.Mesh(g, m);
            mesh.userData._canvas = canvas;
            mesh.userData._ctx = ctx;
            mesh.userData._tex = tex;
            return mesh;
        };

        // System prompt label (visible to user)
        const sysPrompt = makeTextPlane('System: Generate a clean subject on neutral bg');
        sysPrompt.position.set(0, 0.86, -0.35);
        sysPrompt.rotation.x = -Math.PI / 10;
        printer.add(sysPrompt);

        // User prompt content (editable via typing)
        const userPrompt = makeTextPlane('Type prompt here...');
        userPrompt.position.set(0, 0.63, -0.35);
        userPrompt.rotation.x = -Math.PI / 10;
        printer.add(userPrompt);

        // Output image plane placeholder
        const outMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const outGeo = new THREE.PlaneGeometry(0.6, 0.6);
        const outputImage = new THREE.Mesh(outGeo, outMat);
        outputImage.position.set(0, 0.3, 0.9);
        outputImage.rotation.x = -Math.PI / 2.2;
        outputImage.visible = false;
        printer.add(outputImage);

        // Interaction state
        printer.userData = {
            type: 'printer_station',
            active: false,
            userPrompt,
            sysPrompt,
            outputImage
        };

        // Obstacle/clickable
        const obstacle = new Obstacle(pos, {
            type: 'printer',
            collisionBounds: { width: 1.2, height: 1.0 },
            blocksMovement: true,
            blocksLineOfSight: false
        });
        this.obstacles.push(obstacle);

        this.scene.add(printer);
        this.printerStation = printer;
        console.log('Printer station created at:', pos.x, pos.z);
    }

    createItemLoader() {
        // Place an item loader station ~20 units from workbench
        const pos = new THREE.Vector3(20, 0, 3);
        const stand = new THREE.Group();
        stand.position.copy(pos);

        const mat = new THREE.MeshLambertMaterial({ color: 0x4B5563 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 16), mat);
        base.position.y = 0.2;
        base.castShadow = true; base.receiveShadow = true;
        stand.add(base);

        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.2, 12), mat);
        pillar.position.y = 1.3;
        pillar.castShadow = true; pillar.receiveShadow = true;
        stand.add(pillar);

        const pad = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), new THREE.MeshLambertMaterial({ color: 0x93C5FD }));
        pad.rotation.x = -Math.PI/2; pad.position.y = 0.02;
        pad.receiveShadow = true;
        stand.add(pad);

        stand.userData = { type: 'item_loader' };
        this.scene.add(stand);

        // Collision obstacle
        const obstacle = new Obstacle(pos, {
            type: 'item_loader',
            collisionBounds: { width: 3, height: 3 },
            blocksMovement: true
        });
        this.obstacles.push(obstacle);
        stand.userData.obstacle = obstacle;

        console.log('Created item loader at:', pos.x, pos.z);
    }

    // === WORKBENCH UI AND AI INTEGRATION ===
    openWorkbenchUI() {
        if (document.getElementById('workbench-ui')) {
            document.getElementById('workbench-ui').style.display = 'block';
            return;
        }

        const container = document.createElement('div');
        container.id = 'workbench-ui';
        container.style.cssText = 'position:fixed; right:16px; top:16px; width:360px; background:#1e1e1ecc; color:#fff; padding:12px; border-radius:8px; z-index:9999; font-family:Arial, sans-serif; backdrop-filter: blur(6px);';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:bold;">Workbench - AI Asset Generator</div>
                <button id="wb-close" style="background:#444; color:#fff; border:none; padding:4px 8px; cursor:pointer;">X</button>
            </div>
            <label style="font-size:12px;">Describe your item</label>
            <textarea id="wb-prompt" style="width:100%; height:70px; margin:4px 0; background:#2a2a2a; color:#fff; border:1px solid #555;">A low-poly medieval iron sword with wooden hilt, game-ready</textarea>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
                <button id="wb-generate" style="flex:1; background:#3b82f6; color:#fff; border:none; padding:6px; cursor:pointer;">Generate Image</button>
                <button id="wb-analyze" style="flex:1; background:#22c55e; color:#fff; border:none; padding:6px; cursor:pointer;">Analyze</button>
                <button id="wb-code" style="flex:1; background:#a855f7; color:#fff; border:none; padding:6px; cursor:pointer;">Generate 3D</button>
            </div>
            <div style="margin-top:6px;">
                <div style="font-size:12px; margin-bottom:4px;">Image</div>
                <img id="wb-image" style="width:100%; height:140px; object-fit:contain; background:#111; border:1px solid #333;" />
            </div>
            <div style="margin-top:6px;">
                <div style="font-size:12px; margin-bottom:4px;">Analysis</div>
                <textarea id="wb-analysis" style="width:100%; height:110px; background:#111; color:#9f9; border:1px solid #333; font-family:monospace;"></textarea>
            </div>
            <div style="margin-top:6px;">
                <div style="font-size:12px; margin-bottom:4px;">Code</div>
                <textarea id="wb-code-view" style="width:100%; height:140px; background:#111; color:#cff; border:1px solid #333; font-family:monospace;"></textarea>
            </div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button id="wb-preview" style="flex:1; background:#f59e0b; color:#111; border:none; padding:6px; cursor:pointer;">Preview in World</button>
                <button id="wb-save" style="flex:1; background:#e5e7eb; color:#111; border:none; padding:6px; cursor:pointer;">Save Asset</button>
            </div>
            <div style="display:flex; gap:6px; margin-top:6px;">
                <input id="wb-name" placeholder="Name (e.g., Iron Sword)" style="flex:1; background:#2a2a2a; color:#fff; border:1px solid #555; padding:6px;" />
                <button id="wb-save-lib" style="background:#3B82F6; color:#fff; border:none; padding:6px 10px; cursor:pointer;">Save to Library</button>
            </div>
            <div style="margin-top:6px; display:flex; gap:6px; align-items:center;">
                <button id="wb-improve" style="background:#10b981; color:#fff; border:none; padding:6px 10px; cursor:pointer;">Improve</button>
                <input id="wb-improve-notes" placeholder="Optional guidance (e.g., 'half the size')" style="flex:1; background:#2a2a2a; color:#fff; border:1px solid #555; padding:6px;" />
            </div>
            <div id="wb-status" style="margin-top:6px; font-size:12px; opacity:0.9;">Idle</div>
        `;
        document.body.appendChild(container);

        this.setupWorkbenchUIHandlers();
    }

    openItemLoaderUI() {
        if (document.getElementById('loader-ui')) {
            document.getElementById('loader-ui').style.display = 'block';
            this.refreshItemList();
            return;
        }
        const container = document.createElement('div');
        container.id = 'loader-ui';
        container.style.cssText = 'position:fixed; left:16px; top:16px; width:340px; background:#1e1e1ecc; color:#fff; padding:12px; border-radius:8px; z-index:9999; font-family:Arial, sans-serif; backdrop-filter: blur(6px);';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:bold;">Item Loader</div>
                <button id="ld-close" style="background:#444; color:#fff; border:none; padding:4px 8px; cursor:pointer;">X</button>
            </div>
            <div style="display:flex; gap:6px; margin-bottom:6px;">
                <input id="ld-filter" placeholder="Filter by name..." style="flex:1; background:#2a2a2a; color:#fff; border:1px solid #555; padding:6px;" />
                <button id="ld-refresh" style="background:#3B82F6; color:#fff; border:none; padding:6px 10px; cursor:pointer;">Refresh</button>
            </div>
            <div id="ld-list" style="max-height:220px; overflow:auto; background:#111; border:1px solid #333; padding:6px;"></div>
            <div style="display:flex; gap:6px; margin-top:8px;">
                <button id="ld-spawn" style="flex:1; background:#f59e0b; color:#111; border:none; padding:6px; cursor:pointer;">Spawn</button>
                <button id="ld-delete" style="flex:1; background:#ef4444; color:#fff; border:none; padding:6px; cursor:pointer;">Delete</button>
            </div>
            <!-- Button order matches labeling: Left on the left, Right on the right -->
            <div style="display:flex; gap:6px; margin-top:6px;">
                <button id="ld-equip-left" style="flex:1; background:#06b6d4; color:#fff; border:none; padding:6px; cursor:pointer;">Equip Left Hand</button>
                <button id="ld-equip-right" style="flex:1; background:#10b981; color:#fff; border:none; padding:6px; cursor:pointer;">Equip Right Hand</button>
            </div>
            <div id="ld-status" style="margin-top:6px; font-size:12px; opacity:0.9;">Idle</div>
        `;
        document.body.appendChild(container);

        const $ = (id) => document.getElementById(id);
        const status = (m) => { const s = $('ld-status'); if (s) s.textContent = m; };
        $('ld-close').onclick = () => { $('loader-ui').style.display = 'none'; };
        $('ld-refresh').onclick = () => this.refreshItemList();
        $('ld-spawn').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="ld-select"]:checked');
                if (!sel) { status('Select an item.'); return; }
                const itemId = sel.value;
                const item = await this.fetchItemById(itemId);
                if (!item?.code) { status('Item has no code.'); return; }
                const group = this.evaluateGeneratedCode(item.code);
                if (!group) { status('Code eval failed.'); return; }
                const wrapper = this.prepareGeneratedGroupForGroundPlacement(group);
                // Spawn in front of player
                const ahead = new THREE.Vector3(0,0, 1).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.rotation.y).multiplyScalar(3);
                wrapper.position.set(this.player.position.x + ahead.x, 0.02, this.player.position.z + ahead.z);
                wrapper.userData = { type: 'spawned_item', sourceId: itemId };
                this.scene.add(wrapper);
                status(`Spawned ${item.name}`);
            } catch (e) { console.error(e); status('Spawn failed.'); }
        };
        // Equip Right Hand button: equips to the hand on the screen's RIGHT side
        // Tip: set this.swapHandUI = true to invert mapping if your camera/mirror flips
        $('ld-equip-right').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="ld-select"]:checked');
                if (!sel) { status('Select an item.'); return; }
                const itemId = sel.value;
                const item = await this.fetchItemById(itemId);
                if (!item?.code) { status('Item has no code.'); return; }
                const ok = this.equipScreenRightHandFromCode(item.code);
                const mapped = this.getVisualRightHandName();
                status(ok ? `Equipped ${item.name} in ${this.swapHandUI ? (mapped==='right'?'left':'right') : mapped} hand.` : 'Equip failed.');
            } catch (e) { console.error(e); status('Equip failed.'); }
        };

        // Equip Left Hand button: equips to the hand on the screen's LEFT side
        // Tip: set this.swapHandUI = true to invert mapping if your camera/mirror flips
        $('ld-equip-left').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="ld-select"]:checked');
                if (!sel) { status('Select an item.'); return; }
                const itemId = sel.value;
                const item = await this.fetchItemById(itemId);
                if (!item?.code) { status('Item has no code.'); return; }
                const ok = this.equipScreenLeftHandFromCode(item.code);
                const mapped = this.getVisualRightHandName() === 'right' ? 'left' : 'right';
                status(ok ? `Equipped ${item.name} in ${this.swapHandUI ? (mapped==='right'?'left':'right') : mapped} hand.` : 'Equip failed.');
            } catch (e) { console.error(e); status('Equip failed.'); }
        };

        $('ld-delete').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="ld-select"]:checked');
                if (!sel) { status('Select an item to delete.'); return; }
                const itemId = sel.value;
                await fetch(`http://localhost:8787/api/items/${itemId}`, { method: 'DELETE' });
                status('Item deleted.');
                this.refreshItemList();
            } catch (e) { console.error(e); status('Delete failed.'); }
        };

        this.refreshItemList();
    }



    // === CHARACTER LOADER UI ===
    openCharacterLoaderUI() {
        if (document.getElementById('character-ui')) {
            document.getElementById('character-ui').style.display = 'block';
            this.refreshCharacterList();
            return;
        }

        const container = document.createElement('div');
        container.id = 'character-ui';
        container.style.cssText = 'position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:380px; background:#1e1e1ecc; color:#fff; padding:16px; border-radius:12px; z-index:9999; font-family:Arial, sans-serif; backdrop-filter: blur(6px); box-shadow:0 8px 32px rgba(0,0,0,0.3);';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-weight:bold; font-size:16px;">🧙 Character Loader</div>
                <button id="char-close" style="background:#444; color:#fff; border:none; padding:6px 10px; cursor:pointer; border-radius:4px;">✕</button>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <input id="char-filter" placeholder="Filter characters..." style="flex:1; background:#2a2a2a; color:#fff; border:1px solid #555; padding:8px; border-radius:4px;" />
                <button id="char-refresh" style="background:#3B82F6; color:#fff; border:none; padding:8px 12px; cursor:pointer; border-radius:4px;">🔄</button>
            </div>

            <div id="char-list" style="max-height:250px; overflow:auto; background:#111; border:1px solid #333; padding:8px; border-radius:4px; margin-bottom:12px;">
                Loading characters...
            </div>

            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button id="char-spawn" style="flex:2; background:#f59e0b; color:#111; border:none; padding:10px; cursor:pointer; border-radius:4px; font-weight:600;">🗺️ Spawn in World</button>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button id="char-preview" style="flex:1; background:#10b981; color:#fff; border:none; padding:8px; cursor:pointer; border-radius:4px; font-weight:600;">👁️ Preview</button>
                <button id="char-set-player" style="flex:1; background:#8b5cf6; color:#fff; border:none; padding:8px; cursor:pointer; border-radius:4px; font-weight:600;">👤 Set Player</button>
            </div>

            <div style="display:flex; gap:8px;">
                <button id="char-delete" style="flex:1; background:#ef4444; color:#fff; border:none; padding:8px; cursor:pointer; border-radius:4px; font-weight:600;">🗑️ Delete</button>
            </div>

            <div id="char-status" style="margin-top:12px; font-size:13px; opacity:0.9; text-align:center;">Ready to load characters</div>
        `;
        document.body.appendChild(container);

        const $ = (id) => document.getElementById(id);
        const status = (m) => { const s = $('char-status'); if (s) s.textContent = m; };

        $('char-close').onclick = () => { $('character-ui').style.display = 'none'; };
        $('char-refresh').onclick = () => this.refreshCharacterList();

        $('char-spawn').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="char-select"]:checked');
                if (!sel) { status('Select a character first.'); return; }
                const charId = sel.value;
                const character = await this.fetchItemById(charId);
                if (!character?.code) { status('Character has no code.'); return; }

                const group = this.evaluateGeneratedCode(character.code);
                if (!group) { status('Code evaluation failed.'); return; }

                const wrapper = this.prepareGeneratedGroupForGroundPlacement(group);
                const ahead = new THREE.Vector3(0,0, 1).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.rotation.y).multiplyScalar(4);
                wrapper.position.set(this.player.position.x + ahead.x, 0.02, this.player.position.z + ahead.z);
                wrapper.userData = { type: 'spawned_character', sourceId: charId };
                this.scene.add(wrapper);
                status(`Spawned ${character.name} in world`);
            } catch (e) { console.error(e); status('Spawn failed.'); }
        };

        $('char-preview').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="char-select"]:checked');
                if (!sel) { status('Select a character first.'); return; }
                const charId = sel.value;
                const character = await this.fetchItemById(charId);
                if (!character?.code) { status('Character has no code.'); return; }

                const group = this.evaluateGeneratedCode(character.code);
                if (!group) { status('Code evaluation failed.'); return; }

                const wrapper = this.prepareGeneratedGroupForGroundPlacement(group);
                wrapper.position.set(6, 0.02, 6); // Near workbench
                wrapper.userData = { type: 'character_preview', sourceId: charId };
                this.scene.add(wrapper);
                status(`Previewing ${character.name}`);
            } catch (e) { console.error(e); status('Preview failed.'); }
        };

        $('char-set-player').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="char-select"]:checked');
                if (!sel) { status('Select a character first.'); return; }
                const charId = sel.value;
                const character = await this.fetchItemById(charId);
                if (!character?.code) { status('Character has no code.'); return; }

                // Replace the current player with the new character
                const success = await this.setPlayerCharacter(character.code, character.name);
                if (success) {
                    status(`✅ Now playing as ${character.name}!`);
                } else {
                    status('❌ Failed to set character.');
                }
            } catch (e) { console.error(e); status('Failed to set character.'); }
        };

        $('char-delete').onclick = async () => {
            try {
                const sel = document.querySelector('input[name="char-select"]:checked');
                if (!sel) { status('Select a character to delete.'); return; }
                const charId = sel.value;
                await fetch(`http://localhost:8787/api/items/${charId}`, { method: 'DELETE' });
                status('Character deleted.');
                this.refreshCharacterList();
            } catch (e) { console.error(e); status('Delete failed.'); }
        };

        this.refreshCharacterList();
    }

    async refreshCharacterList() {
        const container = document.getElementById('char-list');
        if (!container) return;
        container.innerHTML = 'Loading characters...';
        try {
            const resp = await fetch('http://localhost:8787/api/items');
            const data = await resp.json();
            const characters = (data?.items || []).filter(item => item.category === 'character');
            const filter = (document.getElementById('char-filter')?.value || '').toLowerCase();
            const filtered = characters.filter(c => !filter || c.name.toLowerCase().includes(filter));

            if (filtered.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.7;">No characters found.<br/>Create one in the Workbench and save it!</div>';
                return;
            }

            container.innerHTML = filtered.map(c => `
                <label style="display:flex; align-items:center; gap:8px; padding:8px; border-bottom:1px solid #222; border-radius:4px; margin-bottom:4px; background:#1a1a1a;">
                    <input type="radio" name="char-select" value="${c.id}" style="margin:0;" />
                    <div style="flex:1;">
                        <div style="font-weight:600; color:#fff;">${c.name}</div>
                        <div style="opacity:0.7; font-size:12px; color:#ccc;">Character • ${new Date(c.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div style="font-size:18px;">${c.name.includes('Horse') ? '🐴' : c.name.includes('Human') ? '👤' : '🧙'}</div>
                </label>
            `).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = 'Failed to load characters.';
        }
    }

    async     setPlayerCharacter(code, name) {
        try {
            // Remove current player from scene
            if (this.player && this.player.parent) {
                this.player.parent.remove(this.player);
            }

            // Create new character from code
            const newCharacterGroup = this.evaluateGeneratedCode(code);
            if (!newCharacterGroup) {
                console.error('Failed to evaluate character code');
                return false;
            }

            // Mark this as a custom character for animation system
            newCharacterGroup.userData = {
                type: 'player',
                customCharacter: true,
                characterName: name
            };

            // Add component names to meshes for animation identification
            this.addComponentNamesToCharacter(newCharacterGroup, code);

            // Set up the new character as player
            this.player = newCharacterGroup;
            this.player.name = name || 'Custom Character';

            // FIX HORSE POSITIONING: Calculate proper ground level positioning
            this.fixCharacterGroundPosition(code);

            // Add to scene
            this.scene.add(this.player);

            // Update camera to follow new character
            if (this.camera && this.controls) {
                this.controls.target.copy(this.player.position);
                this.controls.target.y += 2; // Look at character's head area
            }

            console.log(`Player character changed to: ${name} (with animation support)`);
            return true;
        } catch (e) {
            console.error('Failed to set player character:', e);
            return false;
        }
    }

    addComponentNamesToCharacter(characterGroup, code) {
        try {
            // Parse component names from the code
            const componentMatches = code.match(/"name":\s*"([^"]+)"/g);
            if (!componentMatches) return;

            const componentNames = componentMatches.map(match =>
                match.replace(/"name":\s*"/, '').replace(/"/, '')
            );

            // Add component names to meshes in traversal order
            let componentIndex = 0;
            characterGroup.traverse((child) => {
                if (child.isMesh && componentIndex < componentNames.length) {
                    child.userData = child.userData || {};
                    child.userData.componentName = componentNames[componentIndex];
                    componentIndex++;
                }
            });

        } catch (e) {
            console.warn('Failed to add component names to character:', e);
        }
    }

    fixCharacterGroundPosition(code) {
        try {
            // Calculate bounding box to find the lowest point
            const bbox = new THREE.Box3().setFromObject(this.player);
            const lowestPoint = bbox.min.y;
            const highestPoint = bbox.max.y;
            const centerY = (lowestPoint + highestPoint) / 2;

            // Check if this character has a vertical offset in the code (common in generated characters)
            const verticalOffsetMatch = code.match(/verticalOffset\s*=\s*([^;]+)/);
            let verticalOffset = 0;

            if (verticalOffsetMatch) {
                const offsetExpression = verticalOffsetMatch[1].trim();
                const scaleMatch = code.match(/scale\s*=\s*([^;]+)/);
                if (scaleMatch) {
                    const scaleValue = parseFloat(scaleMatch[1].trim());
                    if (offsetExpression.includes('* scale') || offsetExpression.includes('-')) {
                        // Extract the negative multiplier (like -6.5)
                        const multiplierMatch = offsetExpression.match(/-?\d+\.?\d*/);
                        if (multiplierMatch) {
                            const multiplier = parseFloat(multiplierMatch[0]);
                            verticalOffset = multiplier * scaleValue;
                        }
                    }
                }
            }

            // Position so the lowest point (feet/hooves) touch the ground (Y=0)
            // Compensate for any vertical offset in the generated code
            let groundLevel = -lowestPoint;

            // If there's a negative vertical offset (pushing character down), compensate
            if (verticalOffset < 0) {
                groundLevel += Math.abs(verticalOffset);
            }

            // Apply the positioning
            this.player.position.set(0, groundLevel, 0);

            console.log(`Character positioned: lowest=${lowestPoint.toFixed(3)}, offset=${verticalOffset.toFixed(3)}, final Y=${groundLevel.toFixed(3)}`);

        } catch (e) {
            console.warn('Failed to fix character ground position, using default:', e);
            // Fallback to basic positioning
            this.player.position.set(0, 0, 0);
        }
    }

    async refreshItemList() {
        const container = document.getElementById('ld-list');
        if (!container) return;
        container.innerHTML = 'Loading...';
        try {
            const resp = await fetch('http://localhost:8787/api/items');
            const data = await resp.json();
            const items = (data?.items || []);
            const filter = (document.getElementById('ld-filter')?.value || '').toLowerCase();
            const filtered = items.filter(i => !filter || i.name.toLowerCase().includes(filter));
            container.innerHTML = filtered.map(i => `
                <label style="display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px solid #222;">
                    <input type="radio" name="ld-select" value="${i.id}" />
                    <div style="flex:1;">
                        <div style="font-weight:600;">${i.name}</div>
                        <div style="opacity:0.8; font-size:12px;">${i.category || 'misc'}</div>
                    </div>
                </label>
            `).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = 'Failed to load items.';
        }
    }

    async fetchItemById(id) {
        const resp = await fetch(`http://localhost:8787/api/items/${id}`);
        return await resp.json();
    }

    setupWorkbenchUIHandlers() {
        const $ = (id) => document.getElementById(id);
        const status = (msg) => { const s = $('wb-status'); if (s) s.textContent = msg; };

        $('wb-close').onclick = () => {
            const ui = $('workbench-ui');
            if (ui) ui.style.display = 'none';
        };

        $('wb-generate').onclick = async () => {
            try {
                status('Generating image...');
                const prompt = $('wb-prompt').value.trim();
                const resp = await fetch('http://localhost:8787/api/generate-image', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, fileNamePrefix: 'wb-item', forceGreenScreen: true })
                });
                const data = await resp.json();
                if (data?.image?.dataUrl) {
                    // Standardize to 1024x1024 PNG with transparent bg
                    const standardized = await this.standardizeImage(data.image.dataUrl, 1024, 1024);
                    $('wb-image').src = standardized;
                    status('Image generated.');
                } else {
                    status('No image received.');
                }
            } catch (e) {
                console.error(e);
                status('Image generation failed. Check server/GEMINI_API_KEY.');
            }
        };

        $('wb-analyze').onclick = async () => {
            try {
                status('Analyzing image...');
                const img = $('wb-image').src;
                if (!img) { status('No image to analyze.'); return; }
                const resp = await fetch('http://localhost:8787/api/analyze-image', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageDataUrl: img })
                });
                const data = await resp.json();
                this.latestWorkbenchAnalysis = data.analysis || data.raw || null;
                try { $('wb-analysis').value = JSON.stringify(this.latestWorkbenchAnalysis, null, 2); } catch {}
                status('Analysis complete.');
            } catch (e) {
                console.error(e);
                status('Analysis failed.');
            }
        };

        $('wb-code').onclick = async () => {
            try {
                status('Generating Three.js code...');
                if (!this.latestWorkbenchAnalysis) { status('Run Analyze first.'); return; }
                const promptAddon = 'Keep scale reasonable (max dimension ~2 units).';
                const resp = await fetch('http://localhost:8787/api/generate-threejs', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ analysis: this.latestWorkbenchAnalysis, promptAddon })
                });
                const data = await resp.json();
                if (data?.code) {
                    $('wb-code-view').value = data.code;
                    status('Three.js code generated.');
                } else {
                    status('No code received.');
                }
            } catch (e) {
                console.error(e);
                status('Code generation failed.');
            }
        };

        $('wb-preview').onclick = () => {
            try {
                status('Placing preview in world...');
                const code = $('wb-code-view').value;
                if (!code) { status('No code to preview.'); return; }
                const group = this.evaluateGeneratedCode(code);
                if (!group) { status('Failed to evaluate code.'); return; }
                // Prepare and place near workbench without ground clipping
                const wrapper = this.prepareGeneratedGroupForGroundPlacement(group);
                wrapper.position.set(6, 0.02, 3);
                wrapper.userData = { type: 'generated_item' };
                this.scene.add(wrapper);
                this.latestGeneratedGroup = wrapper;
                status('Preview placed.');
            } catch (e) {
                console.error(e);
                status('Preview failed.');
            }
        };

        $('wb-save').onclick = () => {
            try {
                status('Saving asset (client-side)...');
                const code = $('wb-code-view').value;
                if (!code) { status('No code to save.'); return; }
                const blob = new Blob([code], { type: 'text/javascript' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `generated-item-${Date.now()}.js`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                status('Asset saved (downloaded).');
            } catch (e) {
                console.error(e);
                status('Save failed.');
            }
        };

        $('wb-save-lib').onclick = async () => {
            try {
                status('Saving to library...');
                const name = document.getElementById('wb-name').value.trim() || `Item ${Date.now()}`;
                const code = document.getElementById('wb-code-view').value;
                if (!code) { status('No code to save.'); return; }
                const analysis = this.latestWorkbenchAnalysis || null;

                // Auto-detect if this is a character (has body parts, limbs, etc.)
                let category = 'weapon';

                // More comprehensive character detection patterns
                const isCharacter = (
                    // Head variations
                    code.includes('"name": "head"') ||
                    code.includes('"name": "Head"') ||
                    code.includes('"name": "HEAD"') ||
                    // Torso/body variations
                    code.includes('"name": "torso"') ||
                    code.includes('"name": "Torso"') ||
                    code.includes('"name": "TORSO"') ||
                    code.includes('"name": "body"') ||
                    code.includes('"name": "Body"') ||
                    // Arm variations
                    code.includes('"name": "left_upper_arm"') ||
                    code.includes('"name": "right_upper_arm"') ||
                    code.includes('"name": "left_arm"') ||
                    code.includes('"name": "right_arm"') ||
                    code.includes('"name": "Arm_') ||
                    code.includes('"name": "arm_') ||
                    // Leg variations
                    code.includes('"name": "left_upper_leg"') ||
                    code.includes('"name": "right_upper_leg"') ||
                    code.includes('"name": "left_leg"') ||
                    code.includes('"name": "right_leg"') ||
                    code.includes('"name": "Leg_') ||
                    code.includes('"name": "leg_') ||
                    // Hand variations
                    code.includes('"name": "left_hand"') ||
                    code.includes('"name": "right_hand"') ||
                    code.includes('"name": "Hand_') ||
                    code.includes('"name": "hand_') ||
                    // Foot/shoe variations
                    code.includes('"name": "left_foot"') ||
                    code.includes('"name": "right_foot"') ||
                    code.includes('"name": "left_shoe"') ||
                    code.includes('"name": "right_shoe"') ||
                    // General character indicators
                    code.includes('"name": "nose"') ||
                    code.includes('"name": "ear"') ||
                    code.includes('"name": "eye"')
                );

                if (isCharacter) {
                    category = 'character';
                }

                const resp = await fetch('http://localhost:8787/api/items', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, code, analysis, category })
                });
                const data = await resp.json();
                status(data?.ok ? `Saved to library as ${category}.` : 'Save failed.');
            } catch (e) { console.error(e); status('Save failed.'); }
        };

        $('wb-improve').onclick = async () => {
            try {
                status('Improving model...');
                const targetImg = $('wb-image').src;
                const notes = $('wb-improve-notes').value || '';
                const code = $('wb-code-view').value;
                if (!targetImg || !code || !this.latestGeneratedGroup) { status('Need target image, code, and a preview in world first.'); return; }

                // Capture current preview render from canvas
                const canvas = document.getElementById('game-canvas');
                if (!canvas) { status('Canvas not found.'); return; }
                const renderDataUrl = canvas.toDataURL('image/png');

                const resp = await fetch('http://localhost:8787/api/refine', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targetImageDataUrl: targetImg,
                        renderImageDataUrl: renderDataUrl,
                        currentCode: code,
                        instructions: notes,
                    })
                });
                const data = await resp.json();
                if (data?.code) {
                    $('wb-code-view').value = data.code;
                    status('Improved code received. Previewing...');
                    // Replace preview
                    if (this.latestGeneratedGroup) {
                        this.scene.remove(this.latestGeneratedGroup);
                    }
                    const group = this.evaluateGeneratedCode(data.code);
                    if (group) {
                        const wrapper = this.prepareGeneratedGroupForGroundPlacement(group);
                        wrapper.position.set(6, 0.02, 3);
                        wrapper.userData = { type: 'generated_item' };
                        this.scene.add(wrapper);
                        this.latestGeneratedGroup = wrapper;
                        status('Preview updated.');
                    } else {
                        status('Failed to preview improved code.');
                    }
                } else {
                    status('No improved code received.');
                }
            } catch (e) {
                console.error(e);
                status('Improve failed.');
            }
        };
    }

    evaluateGeneratedCode(code) {
        try {
            // Strip markdown fences if present
            const stripped = code.replace(/```[a-z]*\n([\s\S]*?)```/gi, '$1');
            // Create function returning the group
            const fn = new Function('THREE', `${stripped};\nreturn typeof createGeneratedItem==='function' ? createGeneratedItem(THREE) : null;`);
            const group = fn(THREE);
            if (group && group.isObject3D) return group;
            console.warn('Generated function did not return a THREE.Object3D');
            return null;
        } catch (e) {
            console.error('Evaluation error:', e);
            return null;
        }
    }

    async standardizeImage(dataUrl, width, height) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                // transparent background by default
                ctx.clearRect(0, 0, width, height);

                // Fit contain while preserving aspect
                const scale = Math.min(width / img.width, height / img.height);
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                const dx = (width - drawW) / 2;
                const dy = (height - drawH) / 2;
                ctx.drawImage(img, dx, dy, drawW, drawH);

                // Attempt chroma-key/flat background removal if background isn't transparent
                try {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const d = imageData.data;

                    // Sample four corners to detect solid background color
                    const samples = [
                        0,
                        (width - 1) * 4,
                        (width * (height - 1)) * 4,
                        ((width * height) - 1) * 4,
                    ].map(i => ({ r: d[i], g: d[i+1], b: d[i+2], a: d[i+3] }));

                    // If all corners are similar, treat as background
                    const similar = (a, b) => Math.abs(a - b) < 10;
                    const allSimilar = samples.every(s => samples.every(t => similar(s.r,t.r)&&similar(s.g,t.g)&&similar(s.b,t.b)));

                    if (allSimilar) {
                        const key = samples[0];
                        for (let i = 0; i < d.length; i += 4) {
                            if (Math.abs(d[i]-key.r)<12 && Math.abs(d[i+1]-key.g)<12 && Math.abs(d[i+2]-key.b)<12) {
                                d[i+3] = 0; // make transparent
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                } catch (e) {
                    // Ignore cleanup errors
                }
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    prepareGeneratedGroupForGroundPlacement(group) {
        try {
            // Enable shadows on children
            group.traverse(obj => {
                if (obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = false;
                }
            });

            const wrapper = new THREE.Group();
            wrapper.add(group);

            // Compute bounding box in current transform
            group.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(group);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const minY = box.min.y;

            // Recentre around origin (x,z) and put base at y=0 within wrapper
            group.position.x -= center.x;
            group.position.z -= center.z;
            group.position.y -= minY;

            return wrapper;
        } catch (e) {
            console.error('prepareGeneratedGroupForGroundPlacement error:', e);
            // Fallback: place original group at slight offset
            group.position.y = 0.02;
            return group;
        }
    }

    // Returns the hand that appears on the right side of the screen
    getVisualRightHand() {
        try {
            if (!this.camera) return this.rightHand || this.leftHand || null;
            if (!this.rightHand || !this.leftHand) return this.rightHand || this.leftHand || null;

            const toScreenX = (obj) => {
                const v = new THREE.Vector3();
                obj.getWorldPosition(v);
                v.project(this.camera);
                return v.x; // -1 (left) to +1 (right)
            };

            const xRight = toScreenX(this.rightHand);
            const xLeft = toScreenX(this.leftHand);
            return (xRight >= xLeft) ? this.rightHand : this.leftHand;
        } catch {
            return this.rightHand || this.leftHand || null;
        }
    }

    getVisualRightHandName() {
        const v = this.getVisualRightHand();
        return v === this.rightHand ? 'right' : 'left';
    }

    // Equip to the hand that appears on the screen's RIGHT side
    equipScreenRightHandFromCode(code) {
        const visualRight = this.getVisualRightHand();
        const targetHand = (this.swapHandUI ? (visualRight === this.rightHand ? this.leftHand : this.rightHand) : visualRight);
        return (targetHand === this.rightHand) ? this.equipRightHandFromCode(code) : this.equipLeftHandFromCode(code);
    }

    // Equip to the hand that appears on the screen's LEFT side
    equipScreenLeftHandFromCode(code) {
        const visualRight = this.getVisualRightHand();
        const visualLeft = (visualRight === this.rightHand) ? this.leftHand : this.rightHand;
        const targetHand = (this.swapHandUI ? (visualLeft === this.rightHand ? this.leftHand : this.rightHand) : visualLeft);
        return (targetHand === this.rightHand) ? this.equipRightHandFromCode(code) : this.equipLeftHandFromCode(code);
    }

    equipLeftHandFromCode(code) {
        try {
            // Remove any existing equipped item
            if (this.currentEquippedLeft && this.currentEquippedLeft.parent) {
                this.currentEquippedLeft.parent.remove(this.currentEquippedLeft);
            }

            const generated = this.evaluateGeneratedCode(code);
            if (!generated) return false;

            // Normalize scale
            const tmpBox = new THREE.Box3().setFromObject(generated);
            const tmpSize = new THREE.Vector3();
            tmpBox.getSize(tmpSize);
            const longestDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z) || 1;
            const targetMax = 1.0;
            const scaleFactor = Math.min(0.35, targetMax / longestDim);
            generated.scale.setScalar(scaleFactor);

            // Attachment on left palm (mirror of right): -X is character's left, +Z forward
            const attachment = new THREE.Group();
            attachment.position.set(-0.08, 0.10, 0.02);
            attachment.quaternion.copy(this.player.quaternion);
            this.leftHand.add(attachment);

            // Align +Y to +Z (forward)
            const upLocal = new THREE.Vector3(0, 1, 0);
            const forwardLocal = new THREE.Vector3(0, 0, 1);
            const alignQuat = new THREE.Quaternion().setFromUnitVectors(upLocal, forwardLocal);
            generated.setRotationFromQuaternion(alignQuat);

            // Auto-flip if needed
            const bbox = new THREE.Box3().setFromObject(generated);
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const farForward = new THREE.Vector3(0, 0, 1).multiplyScalar(0.5).add(center);
            const farBack = new THREE.Vector3(0, 0, -1).multiplyScalar(0.5).add(center);
            const lenForward = Math.abs(farForward.z - center.z);
            const lenBack = Math.abs(farBack.z - center.z);
            if (lenBack > lenForward) {
                generated.rotateOnAxis(forwardLocal, Math.PI);
            }

            // Roll 90° so blade edge isn't flat
            generated.rotateOnAxis(forwardLocal, Math.PI / 2);

            // Anchor: move sword so the middle of the HANDLE sits at the attachment origin
            // Heuristic: after aligning +Y->+Z, the handle lies toward minZ.
            const leftBox = new THREE.Box3().setFromObject(generated);
            const leftCenter = new THREE.Vector3();
            const leftSize = new THREE.Vector3();
            leftBox.getCenter(leftCenter);
            leftBox.getSize(leftSize);
            const leftMinZ = leftBox.min.z;
            // Choose a point near the handle middle: a bit forward from minZ (15% of length)
            const handleAnchorZ = leftMinZ + leftSize.z * 0.15;
            // Recenter X/Y to hand center, and Z so handle anchor is at 0
            generated.position.x -= leftCenter.x;
            generated.position.y -= leftCenter.y;
            generated.position.z -= handleAnchorZ;

            // Seat into palm: deeper inset so the handle firmly touches
            generated.position.z -= 0.06;

            attachment.add(generated);
            this.currentEquippedLeft = attachment;
            return true;
        } catch (e) {
            console.error('equipLeftHandFromCode failed:', e);
            return false;
        }
    }

    equipRightHandFromCode(code) {
        try {
            // Remove any existing equipped item
            if (this.currentEquippedRight && this.currentEquippedRight.parent) {
                this.currentEquippedRight.parent.remove(this.currentEquippedRight);
            }

            // Create the sword from code
            const generated = this.evaluateGeneratedCode(code);
            if (!generated) return false;

            // Normalize scale to a reasonable sword size (~1.2 units for better visibility)
            const tmpBox = new THREE.Box3().setFromObject(generated);
            const tmpSize = new THREE.Vector3();
            tmpBox.getSize(tmpSize);
            const longestDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z) || 1;
            const targetMax = 1.2; // increased for better sword visibility
            const scaleFactor = Math.min(0.6, targetMax / longestDim); // increased max scale
            generated.scale.setScalar(scaleFactor);

            // Prepare attachment anchored to actual right hand
            const attachment = new THREE.Group();
            // Better offset for sword grip: slightly higher and more forward
            attachment.position.set(0.06, 0.08, 0.08); // adjusted for better grip
            // Follow the player's facing
            attachment.quaternion.copy(this.player.quaternion);
            this.rightHand.add(attachment);

            // Simplified alignment: assume +Y is up, point blade forward (+Z)
            const upLocal = new THREE.Vector3(0, 1, 0);
            const forwardLocal = new THREE.Vector3(0, 0, 1);
            const alignQuat = new THREE.Quaternion().setFromUnitVectors(upLocal, forwardLocal);
            generated.setRotationFromQuaternion(alignQuat);

            // Smart blade orientation: ensure blade points forward
            const bbox = new THREE.Box3().setFromObject(generated);
            const center = new THREE.Vector3();
            bbox.getCenter(center);

            // Check if the sword is pointing the wrong way by comparing front vs back extents
            const swordLength = bbox.max.z - bbox.min.z;
            const frontExtent = Math.abs(bbox.max.z - center.z);
            const backExtent = Math.abs(bbox.min.z - center.z);

            // If more sword mass is behind center, flip it
            if (backExtent > frontExtent) {
                generated.rotateOnAxis(forwardLocal, Math.PI);
            }

            // Position sword handle in palm: center the grip area
            const swordBox = new THREE.Box3().setFromObject(generated);
            const swordCenter = new THREE.Vector3();
            const swordSize = new THREE.Vector3();
            swordBox.getCenter(swordCenter);
            swordBox.getSize(swordSize);

            // For a sword, the handle is typically the bottom 25-30% when blade is up
            const handleEndZ = swordBox.min.z + swordSize.z * 0.25;
            const gripCenterZ = swordBox.min.z + swordSize.z * 0.125; // middle of handle

            // Center horizontally and vertically, position handle properly
            generated.position.x -= swordCenter.x;
            generated.position.y -= swordCenter.y + 0.02; // slight upward adjustment
            generated.position.z -= gripCenterZ;

            attachment.add(generated);
            this.currentEquippedRight = attachment;
            return true;
        } catch (e) {
            console.error('equipRightHandFromCode failed:', e);
            return false;
        }
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

        // ACCURATE POSITIONING: Calculate exact feet-to-torso distance
        // The feet are positioned below the torso center
        const thighLength = legLength * 0.5; // 0.486
        const calfLength = legLength * 0.45; // 0.4374
        const footOffset = 0.04; // Small gap between calf and foot

        // Distance from torso center to feet:
        // hip(0) + thigh_center(0.243) + knee(0.486) + calf_center(0.2187) + foot(0.4774) = 1.4251
        const torsoToFeetDistance = thighLength/2 + thighLength + calfLength/2 + calfLength + footOffset;
        this.player.position.set(0, torsoToFeetDistance, 0); // Position so feet touch Y=0

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

        // Debug: nose marker to visualize forward-facing direction
        const noseMarkerGeometry = new THREE.SphereGeometry(headHeight * 0.08, 8, 8);
        const noseMarkerMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
        const noseMarker = new THREE.Mesh(noseMarkerGeometry, noseMarkerMaterial);
        // In player space, forward is +Z. Place the nose slightly in front of the head surface.
        noseMarker.position.set(0, 0, (headHeight * 0.52));
        noseMarker.castShadow = false;
        noseMarker.receiveShadow = false;
        noseMarker.userData = { type: 'debug_nose' };
        this.head.add(noseMarker);
        this.noseMarker = noseMarker;

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

        // === WOODCUTTING AXE ===
        this.createWoodcuttingAxe();

        this.scene.add(this.player);

        // Animation properties with realistic timing
        this.walkCycle = 0;
        this.isWalking = false;
        this.stepFrequency = 2; // Steps per second at normal walking speed
        this.armSwingMultiplier = 0.8; // Arms swing less than legs
    }

    createWoodcuttingAxe() {
        // Create axe handle (tapered wooden shaft)
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.8, 8); // Tapered from bottom to top
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wood color
        this.axeHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        this.axeHandle.castShadow = true;

        // Create stone axe head (rectangular stone blade)
        const headGeometry = new THREE.BoxGeometry(0.12, 0.15, 0.08); // Stone head dimensions
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }); // Original color (silver/gray stone)
        this.axeHead = new THREE.Mesh(headGeometry, headMaterial);
        this.axeHead.castShadow = true;

        // Position stone head at TOP of handle - handle emerges from bottom of stone head
        this.axeHead.position.set(0, 0.4, 0); // At very top of handle
        this.axeHead.rotation.set(0, Math.PI / 2, 0); // Rotate 90° around Y-axis to face forward (blade forward)

        // Create axe group and add parts
        this.axe = new THREE.Group();
        this.axe.add(this.axeHandle);
        this.axe.add(this.axeHead);

        // LEFT HAND - Natural woodcutting grip
        // Position the axe to curve through the left forearm
        // Handle extends outward and slightly upward, blade behind the user
        this.axe.position.set(-0.08, 0.25, 0.12); // LEFT side, align with forearm curve

        // More perpendicular shaft rotation - natural resting position
        // X: minimal upward angle, Y: slight left swing, Z: natural forearm curve
        this.axe.rotation.set(0.1, -0.3, 0.05); // More perpendicular to body plane

        // Attach to LEFT hand
        console.log('Adding axe to LEFT hand:', this.leftHand);
        this.leftHand.add(this.axe);
        this.currentEquippedLeft = this.axe;

        console.log('Stone woodcutting axe created and attached to LEFT hand (natural woodcutting position)');
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

        // No camera controls needed - isometric only
    }

    // Camera controls removed - isometric only
    // Camera is always in isometric mode

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
            let clickedObject = intersects[0].object;

            // Walk up parent chain to find meaningful userData.type
            let target = clickedObject;
            while (target && (!target.userData || (!target.userData.type && !target.userData.isGround)) && target.parent) {
                target = target.parent;
            }

            // Only interact if it's not the ground and has valid userData
            if (target && target !== this.scene.children[0] && target.userData && !target.userData.isGround) {
                this.handleObjectInteraction(target);
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
        const legLength = totalHeight * 0.54; // Same as createPlayer

        // ACCURATE POSITIONING: Same calculation as createPlayer
        const thighLength = legLength * 0.5;
        const calfLength = legLength * 0.45;
        const footOffset = 0.04;
        const torsoToFeetDistance = thighLength/2 + thighLength + calfLength/2 + calfLength + footOffset;
        this.targetPosition.y = torsoToFeetDistance; // Keep feet at ground level (Y=0)

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
        } else if (object.userData?.type === 'workbench') {
            this.openWorkbenchUI();
        } else if (object.userData?.type === 'item_loader') {
            this.openItemLoaderUI();
        } else if (object.userData?.type === 'character_loader_button') {
            // Deprecated: character loader via button is disabled in favor of world stations
            return;
        } else if (object.userData?.type === 'printer_station') {
            this.focusPrinterStation(object);
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

    async generatePrinterImage() {
        if (!this.printerStation) return;
        const text = (this.printerInputText || '').trim();
        if (!text) return;
        try {
            const sys = 'Generate a single centered subject on neutral background, high-contrast, no watermark.';
            const resp = await fetch('http://localhost:8787/api/generate-image', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: `${sys}\nUser: ${text}`, fileNamePrefix: 'printer', forceGreenScreen: false })
            });
            const data = await resp.json();
            const dataUrl = data?.image?.dataUrl;
            if (!dataUrl) return;
            const tex = await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const texture = new THREE.Texture(img);
                    texture.needsUpdate = true;
                    resolve(texture);
                };
                img.src = dataUrl;
            });
            const plane = this.printerStation.userData.outputImage;
            plane.material = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
            plane.visible = true;
            console.log('Printer output updated');
        } catch (e) {
            console.error('Printer image generation failed', e);
        }
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

        // Update printer station (blink cursor / input)
        this.updatePrinterStation(deltaTime);
    }

    // No keyboard movement functions - click to move only

    handleMovement(deltaTime = 16.67) {
        if (!this.targetPosition || !this.isMoving) {
            if (this.isWalking) {
                this.isWalking = false;
                this.resetPlayerPose();
                console.log('Stopped walking animation');
            }
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

        // Detect character type and apply appropriate animation
        this.animateCharacter(this.walkCycle);
    }

    animateCharacter(walkCycle) {
        // Detect if this is a custom character by checking for specific properties
        if (this.player && this.player.userData && this.player.userData.customCharacter) {
            this.animateCustomCharacter(walkCycle);
        } else {
            this.animateHumanCharacter(walkCycle);
        }
    }

    animateHumanCharacter(walkCycle) {
        // Original human animation
        if (!this.leftShoulder || !this.rightShoulder || !this.leftHip || !this.rightHip) return;

        // Simple arm swing - opposite to legs
        const armSwing = Math.sin(walkCycle) * 0.3;
        this.leftShoulder.rotation.x = armSwing;
        this.rightShoulder.rotation.x = -armSwing;

        // Simple leg swing - opposite to arms
        const legSwing = Math.sin(walkCycle) * 0.4;
        this.leftHip.rotation.x = -legSwing;
        this.rightHip.rotation.x = legSwing;

        // Very subtle knee bend
        const kneeBend = Math.abs(Math.sin(walkCycle)) * 0.1;
        if (this.leftKnee) this.leftKnee.rotation.x = kneeBend;
        if (this.rightKnee) this.rightKnee.rotation.x = kneeBend;
    }

    animateCustomCharacter(walkCycle) {
        // Find limbs in the custom character
        const character = this.player;
        const limbs = this.findCharacterLimbs(character);

        if (!limbs) return;

        // Apply appropriate animation based on character type
        if (limbs.isQuadrupedal) {
            this.animateQuadrupedalCharacter(walkCycle, limbs);
        } else {
            this.animateBipedalCharacter(walkCycle, limbs);
        }
    }

    findCharacterLimbs(character) {
        const limbs = {
            frontLeft: null,
            frontRight: null,
            backLeft: null,
            backRight: null,
            isQuadrupedal: false
        };

        // Search for limb components in the character
        character.traverse((child) => {
            if (child.userData && child.userData.componentName) {
                const name = child.userData.componentName.toLowerCase();

                // Detect quadrupedal vs bipedal
                if (name.includes('arm') || name.includes('leg') || name.includes('hand') || name.includes('hoof') ||
                    name.includes('foot') || name.includes('shoe')) {
                    limbs.isQuadrupedal = true;
                }

                // Identify specific limbs (support multiple naming patterns)
                if ((name.includes('left_upper_arm') || name.includes('left_arm') || name.includes('arm_l')) ||
                    (name.includes('left_upper_leg') || name.includes('left_leg') || name.includes('leg_l')) ||
                    (name.includes('left_hand') && !name.includes('right_hand')) ||
                    (name.includes('hand_l') && !name.includes('hand_r'))) {
                    limbs.frontLeft = child;
                } else if ((name.includes('right_upper_arm') || name.includes('right_arm') || name.includes('arm_r')) ||
                          (name.includes('right_upper_leg') || name.includes('right_leg') || name.includes('leg_r')) ||
                          name.includes('right_hand') || name.includes('hand_r')) {
                    limbs.frontRight = child;
                } else if (name.includes('left_hoof') || name.includes('left_foot') || name.includes('left_shoe') ||
                          (name.includes('hoof_l') || name.includes('foot_l'))) {
                    limbs.backLeft = child;
                } else if (name.includes('right_hoof') || name.includes('right_foot') || name.includes('right_shoe') ||
                          name.includes('hoof_r') || name.includes('foot_r')) {
                    limbs.backRight = child;
                }
            }
        });

        // If we found quadrupedal limbs, confirm it's quadrupedal
        if (limbs.frontLeft && limbs.frontRight && limbs.backLeft && limbs.backRight) {
            limbs.isQuadrupedal = true;
        }

        return (limbs.frontLeft || limbs.frontRight || limbs.backLeft || limbs.backRight) ? limbs : null;
    }

    animateQuadrupedalCharacter(walkCycle, limbs) {
        // Animate quadrupedal character (horse) using detected limbs
        const swingAmplitude = 0.4; // Limb swing amplitude

        // Front legs swing (opposite to back legs)
        const frontSwing = Math.sin(walkCycle) * swingAmplitude;

        // Back legs swing (opposite to front legs)
        const backSwing = Math.sin(walkCycle + Math.PI) * swingAmplitude;

        // Apply rotations to detected limbs
        if (limbs.frontLeft) {
            limbs.frontLeft.rotation.x = frontSwing;
        }
        if (limbs.frontRight) {
            limbs.frontRight.rotation.x = frontSwing;
        }
        if (limbs.backLeft) {
            limbs.backLeft.rotation.x = backSwing;
        }
        if (limbs.backRight) {
            limbs.backRight.rotation.x = backSwing;
        }

        // Very subtle body bob for realistic movement (much reduced)
        if (this.player) {
            this.player.position.y = Math.sin(walkCycle * 2) * 0.01; // Very subtle vertical movement
        }
    }

    animateBipedalCharacter(walkCycle, limbs) {
        // Generic bipedal animation for custom humanoid characters
        const armSwing = Math.sin(walkCycle) * 0.3;
        const legSwing = Math.sin(walkCycle + Math.PI) * 0.4;

        // Apply arm swings if found
        if (limbs.frontLeft) limbs.frontLeft.rotation.x = armSwing;
        if (limbs.frontRight) limbs.frontRight.rotation.x = -armSwing;

        // Apply leg swings if found
        if (limbs.backLeft) limbs.backLeft.rotation.x = -legSwing;
        if (limbs.backRight) limbs.backRight.rotation.x = legSwing;
    }

    resetPlayerPose() {
        // Check if this is a custom character
        if (this.player && this.player.userData && this.player.userData.customCharacter) {
            this.resetCustomCharacterPose();
        } else {
            this.resetHumanCharacterPose();
        }
    }

    resetHumanCharacterPose() {
        // Reset human joints to default position for standing still

        // Reset hip rotations
        if (this.leftHip) this.leftHip.rotation.x = 0;
        if (this.rightHip) this.rightHip.rotation.x = 0;

        // Reset knee bends
        if (this.leftKnee) this.leftKnee.rotation.x = 0;
        if (this.rightKnee) this.rightKnee.rotation.x = 0;

        // Reset shoulder rotations
        if (this.leftShoulder) this.leftShoulder.rotation.x = 0;
        if (this.rightShoulder) this.rightShoulder.rotation.x = 0;

        // Reset elbow bends
        if (this.leftElbow) this.leftElbow.rotation.x = 0;
        if (this.rightElbow) this.rightElbow.rotation.x = 0;

        // Reset body lean
        if (this.torso) this.torso.rotation.z = 0;

        // Reset head stabilization
        if (this.head) this.head.rotation.z = 0;

        // Reset vertical position (feet on ground level)
        const totalHeight = 1.8;
        const legLength = totalHeight * 0.54; // Same as createPlayer

        // ACCURATE POSITIONING: Same calculation as createPlayer
        const thighLength = legLength * 0.5;
        const calfLength = legLength * 0.45;
        const footOffset = 0.04;
        const torsoToFeetDistance = thighLength/2 + thighLength + calfLength/2 + calfLength + footOffset;
        this.player.position.y = torsoToFeetDistance; // Feet at Y=0
    }

    resetCustomCharacterPose() {
        // Reset custom character limbs to default position
        if (!this.player) return;

        // Reset all limb rotations to 0
        this.player.traverse((child) => {
            if (child.isMesh && child.userData && child.userData.componentName) {
                const name = child.userData.componentName.toLowerCase();

                // Reset limb rotations if they're animation targets
                if (name.includes('arm') || name.includes('leg') || name.includes('hand') ||
                    name.includes('hoof') || name.includes('foot') || name.includes('shoe')) {
                    child.rotation.x = 0;
                    child.rotation.y = 0;
                    child.rotation.z = 0;
                }
            }
        });

        // Keep the character at its proper ground level position
        // (Don't reset Y position - let fixCharacterGroundPosition handle that)
    }

    updateCamera() {
        // ISOMETRIC CAMERA: Always follow player from south at an angle
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
            } else if (child.userData && child.userData.type === 'workbench') {
                this.addObjectToMinimap(child.position, 'workbench');
            } else if (child.userData && child.userData.type === 'item_loader') {
                this.addObjectToMinimap(child.position, 'loader');
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
            } else if (objectType === 'workbench') {
                color = '#8B4513'; // Brown for workbench
                size = 5; // Medium size for workbench
            } else if (objectType === 'loader') {
                color = '#3B82F6'; // Blue for loader
                size = 5;
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

    focusPrinterStation(station) {
        if (!station || !station.userData) return;
        // Blur previous
        if (this.printerStation && this.printerStation.userData) {
            this.printerStation.userData.active = false;
        }
        this.printerStation = station;
        this.printerStation.userData.active = true;
        this.printerInputText = this.printerInputText || '';
        console.log('Printer focused');
    }

    updatePrinterStation(deltaTime = 16.67) {
        if (!this.printerStation || !this.printerStation.userData?.active) return;
        // Show caret blink on user prompt
        this._printerBlinkTime = (this._printerBlinkTime || 0) + deltaTime;
        const showCaret = Math.floor(this._printerBlinkTime / 500) % 2 === 0;
        const userPromptMesh = this.printerStation.userData.userPrompt;
        if (userPromptMesh?.userData?._ctx) {
            const ctx = userPromptMesh.userData._ctx;
            const canvas = userPromptMesh.userData._canvas;
            ctx.fillStyle = '#0b0b0b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#E5E7EB';
            ctx.font = '24px Arial';
            const text = (this.printerInputText || '');
            const display = text + (showCaret ? '|' : '');
            ctx.fillText(display, 16, 48);
            userPromptMesh.userData._tex.needsUpdate = true;
        }
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
