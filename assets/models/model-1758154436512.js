function createGeneratedItem(THREE) {
	const group = new THREE.Group();
	const scale = 0.018;
	const data = {
		"name": "Low-Poly Articulated Mario",
		"components": [{
			"name": "torso",
			"shape": "capsule",
			"dimensions": {
				"radius": 20,
				"height": 30
			},
			"position": {
				"x": 0,
				"y": 50,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "head",
			"shape": "prism",
			"dimensions": {
				"x": 35,
				"y": 30,
				"z": 30
			},
			"position": {
				"x": 0,
				"y": 80,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#F8B880"
		}, {
			"name": "hat_dome",
			"shape": "cylinder",
			"dimensions": {
				"radius": 22,
				"height": 15
			},
			"position": {
				"x": 0,
				"y": 93,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "hat_brim",
			"shape": "box",
			"dimensions": {
				"x": 50,
				"y": 4,
				"z": 20
			},
			"position": {
				"x": 0,
				"y": 88,
				"z": 15
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "hat_logo_base",
			"shape": "cylinder",
			"dimensions": {
				"radius": 7,
				"height": 1
			},
			"position": {
				"x": 0,
				"y": 95,
				"z": 22.5
			},
			"rotation": {
				"x": -15,
				"y": 0,
				"z": 0
			},
			"color": "#FFFFFF"
		}, {
			"name": "hat_logo_m",
			"shape": "prism",
			"dimensions": {
				"x": 8,
				"y": 8,
				"z": 1
			},
			"position": {
				"x": 0,
				"y": 95,
				"z": 23
			},
			"rotation": {
				"x": -15,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "nose",
			"shape": "capsule",
			"dimensions": {
				"radius": 7,
				"height": 5
			},
			"position": {
				"x": 0,
				"y": 78,
				"z": 15
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#F8B880"
		}, {
			"name": "mustache",
			"shape": "prism",
			"dimensions": {
				"x": 28,
				"y": 8,
				"z": 5
			},
			"position": {
				"x": 0,
				"y": 74,
				"z": 14
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#402008"
		}, {
			"name": "left_ear",
			"shape": "cylinder",
			"dimensions": {
				"radius": 5,
				"height": 2
			},
			"position": {
				"x": -17,
				"y": 80,
				"z": -2
			},
			"rotation": {
				"x": 0,
				"y": -90,
				"z": 0
			},
			"color": "#F8B880"
		}, {
			"name": "right_ear",
			"shape": "cylinder",
			"dimensions": {
				"radius": 5,
				"height": 2
			},
			"position": {
				"x": 17,
				"y": 80,
				"z": -2
			},
			"rotation": {
				"x": 0,
				"y": 90,
				"z": 0
			},
			"color": "#F8B880"
		}, {
			"name": "left_upper_leg",
			"shape": "box",
			"dimensions": {
				"x": 12,
				"y": 15,
				"z": 12
			},
			"position": {
				"x": -10,
				"y": 35,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "right_upper_leg",
			"shape": "box",
			"dimensions": {
				"x": 12,
				"y": 15,
				"z": 12
			},
			"position": {
				"x": 10,
				"y": 35,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 0
			},
			"color": "#D73A2A"
		}, {
			"name": "left_shoe",
			"shape": "capsule",
			"dimensions": {
				"radius": 7,
				"height": 15
			},
			"position": {
				"x": -10,
				"y": 17,
				"z": 2
			},
			"rotation": {
				"x": 90,
				"y": 0,
				"z": 0
			},
			"color": "#603010"
		}, {
			"name": "right_shoe",
			"shape": "capsule",
			"dimensions": {
				"radius": 7,
				"height": 15
			},
			"position": {
				"x": 10,
				"y": 17,
				"z": 2
			},
			"rotation": {
				"x": 90,
				"y": 0,
				"z": 0
			},
			"color": "#603010"
		}, {
			"name": "left_upper_arm",
			"shape": "cylinder",
			"dimensions": {
				"radius": 6,
				"height": 18
			},
			"position": {
				"x": -25,
				"y": 60,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 30
			},
			"color": "#1050D0"
		}, {
			"name": "right_upper_arm",
			"shape": "cylinder",
			"dimensions": {
				"radius": 6,
				"height": 18
			},
			"position": {
				"x": 25,
				"y": 60,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -30
			},
			"color": "#1050D0"
		}, {
			"name": "left_lower_arm",
			"shape": "cylinder",
			"dimensions": {
				"radius": 6,
				"height": 18
			},
			"position": {
				"x": -38,
				"y": 50,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 15
			},
			"color": "#1050D0"
		}, {
			"name": "right_lower_arm",
			"shape": "cylinder",
			"dimensions": {
				"radius": 6,
				"height": 18
			},
			"position": {
				"x": 38,
				"y": 50,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -15
			},
			"color": "#1050D0"
		}, {
			"name": "left_hand",
			"shape": "prism",
			"dimensions": {
				"x": 10,
				"y": 12,
				"z": 10
			},
			"position": {
				"x": -49,
				"y": 42,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": 15
			},
			"color": "#FFFFFF"
		}, {
			"name": "right_hand",
			"shape": "prism",
			"dimensions": {
				"x": 10,
				"y": 12,
				"z": 10
			},
			"position": {
				"x": 49,
				"y": 42,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 0,
				"z": -15
			},
			"color": "#FFFFFF"
		}, {
			"name": "left_button",
			"shape": "cylinder",
			"dimensions": {
				"radius": 4,
				"height": 1.5
			},
			"position": {
				"x": -8,
				"y": 60,
				"z": 19
			},
			"rotation": {
				"x": -10,
				"y": -15,
				"z": 0
			},
			"color": "#F8D820"
		}, {
			"name": "right_button",
			"shape": "cylinder",
			"dimensions": {
				"radius": 4,
				"height": 1.5
			},
			"position": {
				"x": 8,
				"y": 60,
				"z": 19
			},
			"rotation": {
				"x": -10,
				"y": 15,
				"z": 0
			},
			"color": "#F8D820"
		}, {
			"name": "left_shoulder_joint",
			"shape": "cylinder",
			"dimensions": {
				"radius": 2,
				"height": 8
			},
			"position": {
				"x": -20,
				"y": 62,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 90,
				"z": 0
			},
			"color": "#303030"
		}, {
			"name": "right_shoulder_joint",
			"shape": "cylinder",
			"dimensions": {
				"radius": 2,
				"height": 8
			},
			"position": {
				"x": 20,
				"y": 62,
				"z": 0
			},
			"rotation": {
				"x": 0,
				"y": 90,
				"z": 0
			},
			"color": "#303030"
		}]
	};

	const degToRad = (deg) => deg * Math.PI / 180;

	const createCapsule = (radius, height, material) => {
		const capsuleGroup = new THREE.Group();
		const cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(radius, radius, height, 8, 1),
			material
		);
		const topSphere = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 8, 6),
			material
		);
		topSphere.position.y = height / 2;
		const bottomSphere = new THREE.Mesh(
			new THREE.SphereGeometry(radius, 8, 6),
			material
		);
		bottomSphere.position.y = -height / 2;
		capsuleGroup.add(cylinder, topSphere, bottomSphere);
		return capsuleGroup;
	};

	data.components.forEach(component => {
		const material = new THREE.MeshLambertMaterial({
			color: component.color
		});
		let mesh;

		switch (component.shape) {
			case 'capsule':
				mesh = createCapsule(
					component.dimensions.radius * scale,
					component.dimensions.height * scale,
					material
				);
				break;
			case 'prism':
			case 'box':
				mesh = new THREE.Mesh(
					new THREE.BoxGeometry(
						component.dimensions.x * scale,
						component.dimensions.y * scale,
						component.dimensions.z * scale
					),
					material
				);
				break;
			case 'cylinder':
				const radialSegments = component.name.includes('logo_base') ? 12 : 8;
				mesh = new THREE.Mesh(
					new THREE.CylinderGeometry(
						component.dimensions.radius * scale,
						component.dimensions.radius * scale,
						component.dimensions.height * scale,
						radialSegments
					),
					material
				);
				break;
		}

		if (mesh) {
			mesh.position.set(
				component.position.x * scale,
				component.position.y * scale,
				component.position.z * scale
			);

			if (component.name === 'left_ear') {
				mesh.rotation.z = degToRad(90);
			} else if (component.name === 'right_ear') {
				mesh.rotation.z = degToRad(-90);
			} else if (component.name.includes('_joint')) {
				mesh.rotation.x = degToRad(90);
			} else {
				mesh.rotation.set(
					degToRad(component.rotation.x),
					degToRad(component.rotation.y),
					degToRad(component.rotation.z)
				);
			}

			group.add(mesh);
		}
	});
	return group;
}