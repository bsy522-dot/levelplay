function loadMascot() {
  if (typeof THREE.GLTFLoader === 'undefined') { console.warn('GLTFLoader 없음'); return; }
  const loader = new THREE.GLTFLoader();
  loader.load('RobotExpressive.glb', gltf => {
    mascotModel = gltf.scene;
    mascotModel.scale.setScalar(0.7);
    mascotModel.position.set(0, 0, 0);
    mascotModel.rotation.y = Math.PI / 6;
    mascotModel.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(mascotModel);
    mascotMixer = new THREE.AnimationMixer(mascotModel);
    gltf.animations.forEach(clip => { mascotActions[clip.name] = mascotMixer.clipAction(clip); });
    // 메인 메뉴 진입 시 Dance, 5초마다 Punch 한 번
    const idle = mascotActions['Dance'] || mascotActions['Wave'] || mascotActions['Idle'];
    if (idle) idle.play();
    const punch = mascotActions['Punch'];
    if (punch && idle) {
      setInterval(() => {
        if (currentScreen !== 'main' || !mascotModel.visible) return;
        idle.fadeOut(0.2);
        punch.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
        punch.clampWhenFinished = true;
      }, 5000);
      mascotMixer.addEventListener('finished', e => {
        if (e.action === punch) {
          punch.fadeOut(0.3);
          idle.reset().fadeIn(0.3).play();
        }
      });
    }
    console.log('[Mascot] loaded:', Object.keys(mascotActions).join(', '));
  }, undefined, err => console.warn('[Mascot] load failed:', err));
}
