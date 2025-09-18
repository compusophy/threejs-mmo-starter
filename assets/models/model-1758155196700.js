function createGeneratedItem(THREE) {
	const group = new THREE.Group();
	const data = {
		"name": "Monkey D. Luffy Low Poly",
		"components": [{
			"name": "head",
			"shape": "capsule",
			"dimensions": {
				"radius": 1.4,
				"height": 0.5
			},
			"position": {
				"x": 0,
				"y": 8,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "hair",
			"shape": "sphere",
			"dimensions": {
				"radius": 1.6
			},
			"position": {
				"x": 0,
				"y": 8.2,
				"z": -0.1
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#212121"
		}, {
			"name": "hat_crown",
			"shape": "cylinder",
			"dimensions": {
				"radius": 2,
				"height": 1.2
			},
			"position": {
				"x": 0,
				"y": 9,
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
				"radius": 2.05,
				"height": 0.4
			},
			"position": {
				"x": 0,
				"y": 8.5,
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
				"radius": 3.2,
				"height": 0.15
			},
			"position": {
				"x": 0,
				"y": 8.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#FBC40A"
		}, {
			"name": "neck",
			"shape": "cylinder",
			"dimensions": {
				"radius": 0.5,
				"height": 0.6
			},
			"position": {
				"x": 0,
				"y": 7,
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
				"x": 3,
				"y": 3.2,
				"z": 1.8
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
				"x": 1.4,
				"y": 2.8,
				"z": 0.2
			},
			"position": {
				"x": 0.8,
				"y": 5.5,
				"z": 0.9
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
				"x": 1.4,
				"y": 2.8,
				"z": 0.2
			},
			"position": {
				"x": -0.8,
				"y": 5.5,
				"z": 0.9
			},
			"rotation": {
				"x": 0,
				"y": 15,
				"z": 0
			},
			"color": "#D92525"
		}, {
			"name": "sash_waist",
			"shape": "cylinder",
			"dimensions": {
				"radius": 1.7,
				"height": 1.2
			},
			"position": {
				"x": 0,
				"y": 3.7,
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
				"x": 2.2,
				"y": 3.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -30
			},
			"color": "#FBC40A"
		}, {
			"name": "upper_arm_right",
			"shape": "box",
			"dimensions": {
				"x": 1.5,
				"y": 0.8,
				"z": 0.8
			},
			"position": {
				"x": -2.2,
				"y": 6.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 70
			},
			"color": "#EDC195"
		}, {
			"name": "forearm_right",
			"shape": "box",
			"dimensions": {
				"x": 1.8,
				"y": 0.7,
				"z": 0.7
			},
			"position": {
				"x": -3.8,
				"y": 6.8,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 5
			},
			"color": "#EDC195"
		}, {
			"name": "fist_right",
			"shape": "box",
			"dimensions": {
				"x": 1,
				"y": 1,
				"z": 1
			},
			"position": {
				"x": -5,
				"y": 6.8,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 5
			},
			"color": "#EDC195"
		}, {
			"name": "upper_arm_left",
			"shape": "box",
			"dimensions": {
				"x": 1.5,
				"y": 0.8,
				"z": 0.8
			},
			"position": {
				"x": 2.2,
				"y": 6.3,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -70
			},
			"color": "#EDC195"
		}, {
			"name": "forearm_left",
			"shape": "box",
			"dimensions": {
				"x": 1.8,
				"y": 0.7,
				"z": 0.7
			},
			"position": {
				"x": 3.2,
				"y": 5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 20
			},
			"color": "#EDC195"
		}, {
			"name": "fist_left",
			"shape": "box",
			"dimensions": {
				"x": 1,
				"y": 1,
				"z": 1
			},
			"position": {
				"x": 4.4,
				"y": 4.5,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 20
			},
			"color": "#EDC195"
		}, {
			"name": "thigh_left",
			"shape": "box",
			"dimensions": {
				"x": 1.4,
				"y": 2.4,
				"z": 1.4
			},
			"position": {
				"x": 1,
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
				"radius": 0.9,
				"height": 0.6
			},
			"position": {
				"x": 1,
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
				"y": 2.2,
				"z": 0.8
			},
			"position": {
				"x": 1.2,
				"y": 0.2,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "sandal_left",
			"shape": "box",
			"dimensions": {
				"x": 1,
				"y": 0.2,
				"z": 1.8
			},
			"position": {
				"x": 1.2,
				"y": -0.9,
				"z": 0.3
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#A47D55"
		}, {
			"name": "thigh_right",
			"shape": "box",
			"dimensions": {
				"x": 1.4,
				"y": 2.4,
				"z": 1.4
			},
			"position": {
				"x": -1,
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
				"radius": 0.9,
				"height": 0.6
			},
			"position": {
				"x": -1,
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
				"y": 2.2,
				"z": 0.8
			},
			"position": {
				"x": -1.2,
				"y": 0.2,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#EDC195"
		}, {
			"name": "sandal_right",
			"shape": "box",
			"dimensions": {
				"x": 1,
				"y": 0.2,
				"z": 1.8
			},
			"position": {
				"x": -1.2,
				"y": -0.9,
				"z": 0.3
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#A47D55"
		}]
	};

	const scale = 0.18;
	const toRadians = (degrees) => degrees * Math.PI / 180;

	data.components.forEach(component => {
		let geometry;
		const dims = component.dimensions;
		const color = parseInt(component.color.replace("#", "0x"));
		const material = new THREE.MeshLambertMaterial({
			color: color
		});

		switch (component.shape) {
			case 'box':
				geometry = new THREE.BoxGeometry(dims.x * scale, dims.y * scale, dims.z * scale);
				break;
			case 'cylinder':
				geometry = new THREE.CylinderGeometry(dims.radius * scale, dims.radius * scale, dims.height * scale, 16);
				break;
			case 'sphere':
				geometry = new THREE.SphereGeometry(dims.radius * scale, 16, 8);
				break;
			case 'capsule':
				geometry = new THREE.CylinderGeometry(dims.radius * scale, dims.radius * scale, dims.height * scale, 16);
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