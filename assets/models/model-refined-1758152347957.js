function createGeneratedItem(THREE) {
    const group = new THREE.Group();
    const scale = 0.1;
    const verticalOffset = -6.5 * scale; // Center the model vertically

    const armAngle = 30;

    const components = [{
        "name": "Torso_Hoodie",
        "shape": "box",
        "dimensions": { "x": 6, "y": 4.5, "z": 3.5 },
        "position": { "x": 0, "y": 7, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a6e45"
    }, {
        "name": "Hoodie_Pocket",
        "shape": "box",
        "dimensions": { "x": 3.5, "y": 1.8, "z": 0.2 },
        "position": { "x": 0, "y": 6, "z": 1.85 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a6e45"
    }, {
        "name": "Hood",
        "shape": "box",
        "dimensions": { "x": 4.5, "y": 5, "z": 5 },
        "position": { "x": 0, "y": 10.2, "z": -1 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a6e45"
    }, {
        "name": "Drawstring_L",
        "shape": "box",
        "dimensions": { "x": 0.2, "y": 1.8, "z": 0.2 },
        "position": { "x": -0.8, "y": 8.5, "z": 1.9 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#d1c7a8"
    }, {
        "name": "Drawstring_R",
        "shape": "box",
        "dimensions": { "x": 0.2, "y": 1.8, "z": 0.2 },
        "position": { "x": 0.8, "y": 8.5, "z": 1.9 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#d1c7a8"
    }, {
        "name": "Head",
        "shape": "box",
        "dimensions": { "x": 2.8, "y": 3.2, "z": 3.5 },
        "position": { "x": 0, "y": 10, "z": 1.5 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#8c5a44"
    }, {
        "name": "Blaze",
        "shape": "box",
        "dimensions": { "x": 1, "y": 2.5, "z": 0.1 },
        "position": { "x": 0, "y": 10.5, "z": 3.26 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#ffffff"
    }, {
        "name": "Snout",
        "shape": "box",
        "dimensions": { "x": 2, "y": 1.8, "z": 2 },
        "position": { "x": 0, "y": 9.5, "z": 3.5 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#e8a7a7"
    }, {
        "name": "Ear_L",
        "shape": "box",
        "dimensions": { "x": 1, "y": 2.2, "z": 0.5 },
        "position": { "x": -1.3, "y": 12.2, "z": 0 },
        "rotation": { "x": 20, "y": 0, "z": 15 },
        "color": "#8c5a44"
    }, {
        "name": "Ear_R",
        "shape": "box",
        "dimensions": { "x": 1, "y": 2.2, "z": 0.5 },
        "position": { "x": 1.3, "y": 12.2, "z": 0 },
        "rotation": { "x": 20, "y": 0, "z": -15 },
        "color": "#8c5a44"
    }, {
        "name": "Mane_Tuft",
        "shape": "box",
        "dimensions": { "x": 0.6, "y": 1, "z": 0.6 },
        "position": { "x": 0, "y": 12.5, "z": -0.2 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a3b35"
    }, {
        "name": "Leg_L",
        "shape": "box",
        "dimensions": { "x": 1.5, "y": 4, "z": 1.5 },
        "position": { "x": -1.5, "y": 3, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#8c5a44"
    }, {
        "name": "Hoof_L",
        "shape": "box",
        "dimensions": { "x": 1.8, "y": 1, "z": 1.8 },
        "position": { "x": -1.5, "y": 0.5, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a3b35"
    }, {
        "name": "Leg_R",
        "shape": "box",
        "dimensions": { "x": 1.5, "y": 4, "z": 1.5 },
        "position": { "x": 1.5, "y": 3, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#8c5a44"
    }, {
        "name": "Hoof_R",
        "shape": "box",
        "dimensions": { "x": 1.8, "y": 1, "z": 1.8 },
        "position": { "x": 1.5, "y": 0.5, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#4a3b35"
    }, {
        "name": "Arm_L",
        "shape": "box",
        "dimensions": { "x": 3, "y": 1.5, "z": 1.5 },
        "position": { "x": -3.5, "y": 8.5, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": armAngle },
        "color": "#4a6e45"
    }, {
        "name": "Hand_L",
        "shape": "box",
        "dimensions": { "x": 1.2, "y": 1.6, "z": 1.5 },
        "position": { "x": -4.9, "y": 7.2, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": armAngle },
        "color": "#8c5a44"
    }, {
        "name": "Arm_R",
        "shape": "box",
        "dimensions": { "x": 3, "y": 1.5, "z": 1.5 },
        "position": { "x": 3.5, "y": 8.5, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": -armAngle },
        "color": "#4a6e45"
    }, {
        "name": "Cuff_R",
        "shape": "box",
        "dimensions": { "x": 1.2, "y": 1.6, "z": 1.5 },
        "position": { "x": 4.9, "y": 7.2, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": -armAngle },
        "color": "#e0e0e0"
    }];

    const swordComponents = [{
        "name": "Sword_Blade",
        "shape": "box",
        "dimensions": { "x": 10, "y": 1.8, "z": 0.25 },
        "position": { "x": -6.6, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#60f9f3"
    }, {
        "name": "Sword_Guard",
        "shape": "box",
        "dimensions": { "x": 0.6, "y": 3, "z": 0.6 },
        "position": { "x": -1.3, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "color": "#f0c420"
    }, {
        "name": "Sword_Hilt",
        "shape": "cylinder",
        "dimensions": { "radius": 0.4, "height": 2 },
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 90 },
        "color": "#6b4a3a"
    }, {
        "name": "Sword_Pommel",
        "shape": "box",
        "dimensions": { "x": 1, "y": 1, "z": 1 },
        "position": { "x": 1.5, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 45, "z": 0 },
        "color": "#f0c420"
    }];

    components.forEach(c => {
        let geometry;
        const dims = c.dimensions;

        switch (c.shape) {
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(dims.radius * scale, dims.radius * scale, dims.height * scale, 12);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(dims.x * scale, dims.y * scale, dims.z * scale);
                break;
        }

        const material = new THREE.MeshLambertMaterial({ color: c.color });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            c.position.x * scale,
            c.position.y * scale + verticalOffset,
            c.position.z * scale
        );

        mesh.rotation.set(
            THREE.MathUtils.degToRad(c.rotation.x),
            THREE.MathUtils.degToRad(c.rotation.y),
            THREE.MathUtils.degToRad(c.rotation.z)
        );

        group.add(mesh);
    });

    const swordGroup = new THREE.Group();
    swordComponents.forEach(c => {
        let geometry;
        const dims = c.dimensions;

        switch (c.shape) {
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(dims.radius * scale, dims.radius * scale, dims.height * scale, 12);
                break;
            case 'box':
            default:
                geometry = new THREE.BoxGeometry(dims.x * scale, dims.y * scale, dims.z * scale);
                break;
        }

        const color = new THREE.Color(c.color);
        const material = new THREE.MeshLambertMaterial({ color: color });

        if (c.name === 'Sword_Blade') {
            material.emissive = color;
            material.emissiveIntensity = 0.9;
        }

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            c.position.x * scale,
            c.position.y * scale,
            c.position.z * scale
        );

        mesh.rotation.set(
            THREE.MathUtils.degToRad(c.rotation.x),
            THREE.MathUtils.degToRad(c.rotation.y),
            THREE.MathUtils.degToRad(c.rotation.z)
        );

        swordGroup.add(mesh);
    });

    const handLPosition = { x: -4.9, y: 7.2, z: 0 };
    swordGroup.position.set(
        handLPosition.x * scale,
        handLPosition.y * scale + verticalOffset,
        (handLPosition.z + 1.0) * scale
    );

    swordGroup.rotation.set(
        0,
        THREE.MathUtils.degToRad(-90),
        THREE.MathUtils.degToRad(armAngle)
    );

    group.add(swordGroup);
    
    return group;
}