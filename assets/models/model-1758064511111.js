function createGeneratedItem(THREE) {
	const group = new THREE.Group();
	const scale = 0.2;

	const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
	const hiltMaterial = new THREE.MeshLambertMaterial({ color: 0x8C644C });

	// blade
	const bladeGeometry = new THREE.BoxGeometry(1.5 * scale, 8 * scale, 0.2 * scale);
	const blade = new THREE.Mesh(bladeGeometry, metalMaterial);
	blade.position.set(0, 4.25 * scale, 0);
	group.add(blade);

	// guard
	const guardGeometry = new THREE.BoxGeometry(4 * scale, 0.5 * scale, 0.6 * scale);
	const guard = new THREE.Mesh(guardGeometry, metalMaterial);
	guard.position.set(0, 0, 0);
	group.add(guard);

	// hilt
	const hiltGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 2.5 * scale, 8);
	const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
	hilt.position.set(0, -1.5 * scale, 0);
	group.add(hilt);

	// pommel
	const pommelGeometry = new THREE.SphereGeometry(0.4 * scale, 6, 4);
	const pommel = new THREE.Mesh(pommelGeometry, metalMaterial);
	pommel.position.set(0, -3 * scale, 0);
	group.add(pommel);

	return group;
}