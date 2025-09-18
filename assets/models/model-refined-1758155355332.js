function createGeneratedItem(THREE) {
	const group = new THREE.Group();
	const data = {
		"name": "Monkey D. Luffy Low Poly",
		"components": [{
			"name": "hat_crown",
			"shape": "cylinder",
			"dimensions": {
				"radius": 1.8,
				"height": 1.0
			},
			"position": {
				"x": 0,
				"y": 9.1,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "hat_band",
			"shape": "cylinder",
			"dimensions": {
				"radius": 1.85,
				"height": 0.4
			},
			"position": {
				"x": 0,
				"y": 8.7,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D92525"
		}, {
			"name": "hat_brim",
			"shape": "cylinder",
			"dimensions": {
				"radius": 2.8,
				"height": 0.15
			},
			"position": {
				"x": 0,
				"y": 8.4,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "hair",
			"shape": "sphere",
			"dimensions": {
				"radius": 1.6
			},
			"position": {
				"x": 0,
				"y": 8.2,
				"z": -0.2
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#212121"
		}, {
			"name": "head",
			"shape": "sphere",
			"dimensions": {
				"radius": 1.5
			},
			"position": {
				"x": 0,
				"y": 8.0,
				"z": 0.1
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "eye_left",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.15,
				"height": 0.1
			},
			"position": {
				"x": 0.5,
				"y": 8.2,
				"z": 1.5
			},
			"rotation": {
				"x": 90,
				"y": 0,
				"z": 0
			},
			"color": "#000000"
		}, {
			"name": "eye_right",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.15,
				"height": 0.1
			},
			"position": {
				"x": -0.5,
				"y": 8.2,
				"z": 1.5
			},
			"rotation": {
				"x": 90,
				"y": 0,
				"z": 0
			},
			"color": "#000000"
		}, {
			"name": "mouth",
			"shape": "box",
			"dimensions": {
				"x": 1.2,
				"y": 0.2,
				"z": 0.1
			},
			"position": {
				"x": 0,
				"y": 7.5,
				"z": 1.5
			},
			"rotation": {
				"x": -10,
				"y": 0,
				"z": 0
			},
			"color": "#FFFFFF"
		}, {
			"name": "scar_1",
			"shape": "box",
			"dimensions": {
				"x": 0.3,
				"y": 0.05,
				"z": 0.05
			},
			"position": {
				"x": 0.5,
				"y": 7.85,
				"z": 1.5
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 20
			},
			"color": "#BF9A78"
		}, {
			"name": "scar_2",
			"shape": "box",
			"dimensions": {
				"x": 0.3,
				"y": 0.05,
				"z": 0.05
			},
			"position": {
				"x": 0.5,
				"y": 7.75,
				"z": 1.5
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 20
			},
			"color": "#BF9A78"
		}, {
			"name": "neck",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.6,
				"height": 0.5
			},
			"position": {
				"x": 0,
				"y": 7.0,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "torso",
			"shape": "box",
			"dimensions": {
				"x": 3.2,
				"y": 3.0,
				"z": 1.5
			},
			"position": {
				"x": 0,
				"y": 5.4,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "vest_left",
			"shape": "box",
			"dimensions": {
				"x": 1.5,
				"y": 2.8,
				"z": 0.2
			},
			"position": {
				"x": 0.9,
				"y": 5.5,
				"z": 0.75
			},
			"rotation": {
				"x": 0,
				"y": -15,
				"z": 0
			},
			"color": "#D92525"
		}, {
			"name": "vest_right",
			"shape": "box",
			"dimensions": {
				"x": 1.5,
				"y": 2.8,
				"z": 0.2
			},
			"position": {
				"x": -0.9,
				"y": 5.5,
				"z": 0.75
			},
			"rotation": {
				"x": 0,
				"y": 15,
				"z": 0
			},
			"color": "#D92525"
		}, {
			"name": "button_1",
			"shape": "sphere",
			"dimensions": {
				"radius": 0.15
			},
			"position": {
				"x": 0,
				"y": 6.2,
				"z": 0.75
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "button_2",
			"shape": "sphere",
			"dimensions": {
				"radius": 0.15
			},
			"position": {
				"x": 0,
				"y": 5.5,
				"z": 0.75
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "button_3",
			"shape": "sphere",
			"dimensions": {
				"radius": 0.15
			},
			"position": {
				"x": 0,
				"y": 4.8,
				"z": 0.75
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "sash_waist",
			"shape": "cylinder",
			"dimensions": {
				"radius": 1.6,
				"height": 1.0
			},
			"position": {
				"x": 0,
				"y": 3.8,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "sash_tail",
			"shape": "box",
			"dimensions": {
				"x": 2.5,
				"y": 0.8,
				"z": 0.2
			},
			"position": {
				"x": 1.8,
				"y": 3.6,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -30
			},
			"color": "#FBC40A"
		}, {
			"name": "upper_arm_left",
			"shape": "box",
			"dimensions": {
				"x": 0.8,
				"y": 1.8,
				"z": 0.8
			},
			"position": {
				"x": 2.0,
				"y": 6.0,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -15
			},
			"color": "#EDC195"
		}, {
			"name": "forearm_left",
			"shape": "box",
			"dimensions": {
				"x": 0.7,
				"y": 1.8,
				"z": 0.7
			},
			"position": {
				"x": 2.4,
				"y": 4.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -10
			},
			"color": "#EDC195"
		}, {
			"name": "fist_left",
			"shape": "box",
			"dimensions": {
				"x": 0.9,
				"y": 0.9,
				"z": 0.9
			},
			"position": {
				"x": 2.7,
				"y": 3.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -10
			},
			"color": "#EDC195"
		}, {
			"name": "upper_arm_right",
			"shape": "box",
			"dimensions": {
				"x": 0.8,
				"y": 1.8,
				"z": 0.8
			},
			"position": {
				"x": -2.0,
				"y": 6.0,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 15
			},
			"color": "#EDC195"
		}, {
			"name": "forearm_right",
			"shape": "box",
			"dimensions": {
				"x": 0.7,
				"y": 1.8,
				"z": 0.7
			},
			"position": {
				"x": -2.4,
				"y": 4.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 10
			},
			"color": "#EDC195"
		}, {
			"name": "fist_right",
			"shape": "box",
			"dimensions": {
				"x": 0.9,
				"y": 0.9,
				"z": 0.9
			},
			"position": {
				"x": -2.7,
				"y": 3.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 10
			},
			"color": "#EDC195"
		}, {
			"name": "thigh_left",
			"shape": "box",
			"dimensions": {
				"x": 1.2,
				"y": 2.4,
				"z": 1.2
			},
			"position": {
				"x": 1.0,
				"y": 2.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#30589F"
		}, {
			"name": "cuff_left",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.8,
				"height": 0.6
			},
			"position": {
				"x": 1.0,
				"y": 1.4,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EFEFEF"
		}, {
			"name": "shin_left",
			"shape": "box",
			"dimensions": {
				"x": 0.8,
				"y": 2.0,
				"z": 0.8
			},
			"position": {
				"x": 1.0,
				"y": 0.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "sandal_sole_left",
			"shape": "box",
			"dimensions": {
				"x": 1.0,
				"y": 0.2,
				"z": 2.0
			},
			"position": {
				"x": 1.0,
				"y": -0.8,
				"z": 0.4
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#A47D55"
		}, {
			"name": "sandal_strap_left",
			"shape": "box",
			"dimensions": {
				"x": 1.2,
				"y": 0.2,
				"z": 0.2
			},
			"position": {
				"x": 1.0,
				"y": -0.6,
				"z": 0.2
			},
			"rotation": {
				"x": 20,
				"y": 0,
				"z": 0
			},
			"color": "#212121"
		}, {
			"name": "thigh_right",
			"shape": "box",
			"dimensions": {
				"x": 1.2,
				"y": 2.4,
				"z": 1.2
			},
			"position": {
				"x": -1.0,
				"y": 2.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#30589F"
		}, {
			"name": "cuff_right",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.8,
				"height": 0.6
			},
			"position": {
				"x": -1.0,
				"y": 1.4,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EFEFEF"
		}, {
			"name": "shin_right",
			"shape": "box",
			"dimensions": {
				"x": 0.8,
				"y": 2.0,
				"z": 0.8
			},
			"position": {
				"x": -1.0,
				"y": 0.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "sandal_sole_right",
			"shape": "box",
			"dimensions": {
				"x": 1.0,
				"y": 0.2,
				"z": 2.0
			},
			"position": {
				"x": -1.0,
				"y": -0.8,
				"z": 0.4
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#A47D55"
		}, {
			"name": "sandal_strap_right",
			"shape": "box",
			"dimensions": {
				"x": 1.2,
				"y": 0.2,
				"z": 0.2
			},
			"position": {
				"x": -1.0,
				"y": -0.6,
				"z": 0.2
			},
			"rotation": {
				"x": 20,
				"y": 0,
				"z": 0
			},
			"color": "#212121"
		}]
	};

	const scale = 0.18;
	const toRadians = (degrees) => degrees * Math.PI / 180;

	data.components.forEach(component => {
		let geometry;
		const dims = component.dimensions;
		const color = parseInt(component.color.replace("#", "0x"));
		const material = new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.7,
			metalness: 0.1
		});

		switch (component.shape) {
			case 'box':
				geometry = new THREE.BoxGeometry(dims.x * scale, dims.y * scale, dims.z * scale);
				break;
			case 'cylinder':
				geometry = new THREE.CylinderGeometry(dims.radius * scale, dims.radius * scale, dims.height * scale, 16);
				break;
			case 'sphere':
				geometry = new THREE.SphereGeometry(dims.radius * scale, 16, 12);
				break;
			case 'capsule': // Fallback for capsule
				geometry = new THREE.CapsuleGeometry(dims.radius * scale, dims.height * scale, 4, 8);
				break;
		}

		if (geometry) {
			const mesh = new THREE.Mesh(geometry, material);
			const pos = component.position;
			const rot = component.rotation;

			mesh.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
			mesh.rotation.set(toRadians(rot.x), toRadians(rot.y), toRadians(rot.z));

			group.add(mesh);
		}
	});

	const box = new THREE.Box3().setFromObject(group);
	const center = new THREE.Vector3();
	box.getCenter(center);
	group.position.sub(center);

	return group;
}