// src/ThreeScene.js

import React, { useEffect, useRef } from 'react';
import { LoadModel } from './LoadModel';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer, TessellateModifier, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import * as CANNON from 'cannon-es';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const ThreeScene = () => {
  const mountRef = useRef( null );
  const cameraRef = useRef( null );
  const sceneRef = useRef( null );
  let scene = null;
  let camera = null;
  let customInputControlAllow = false;
  let isInited = false;
  let wallInsts = null;

  useEffect( () => {
    // initialize
    const mount = mountRef.current;

    // Set up the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    mount.appendChild( renderer.domElement );

    // Set up the scene
    const setupScene = () => {
      scene = new THREE.Scene();
      scene.add( new THREE.AxesHelper( 5 ) );
      sceneRef.current = scene;
    };
    setupScene();

    // Set up the camera
    let controls = null;
    const setupCamera = () => {
      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
      controls = new OrbitControls( camera, renderer.domElement );
      controls.enableDamping = true;
      controls.target.y = 0.5;
      camera.position.set( 0, 2, 2 );
      cameraRef.current = camera;
    };
    setupCamera();

    // Set up skybox
    // const skyboxLoader = new THREE.CubeTextureLoader();
    // const skyboxTexture = skyboxLoader.load( [
    //   '/skybox/1.jpg', // right
    //   '/skybox/2.jpg', // left
    //   '/skybox/3.jpg', // top
    //   '/skybox/4.jpg', // bottom
    //   '/skybox/5.jpg', // back
    //   '/skybox/6.jpg'  // front
    // ] );
    // scene.background = skyboxTexture;

    // Step 2: Create the background;
    // scene.background = new THREE.Color( 0xaaaaaa ); // Light grey for contrast

    // // Step 3: Add a light wooden wall
    // const wallGeometry = new THREE.BoxGeometry( 10, 5, 0.1 );
    // const wallMaterial = new THREE.MeshStandardMaterial( {
    //   color: 0xe2c6a1,  // Light wooden color
    //   roughness: 0.5,
    //   metalness: 0.1,
    // } );

    // const wall = new THREE.Mesh( wallGeometry, wallMaterial );
    // wall.position.set( 0, 0, -5 ); // Position it in front of the camera
    // scene.add( wall );

    // Add a light
    const setupLight = () => {
      // const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 ); // Dim ambient light
      // scene.add( ambientLight );
      const light1 = new THREE.SpotLight( 0xffffff, 20 );
      light1.position.set( 2.5, 5, 5 );
      light1.angle = Math.PI / 4;
      light1.penumbra = 0.5;
      light1.castShadow = true;
      light1.shadow.mapSize.width = 1024;
      light1.shadow.mapSize.height = 1024;
      light1.shadow.camera.near = 0.5;
      light1.shadow.camera.far = 20;
      scene.add( light1 );
    };
    setupLight();

    // Set up EffectComposer
    const composer = new EffectComposer( renderer );
    const setupEffectComposer = () => {
      //
      const renderPass = new RenderPass( scene, camera );
      composer.addPass( renderPass );

      const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
      composer.addPass( bloomPass );

      bloomPass.threshold = 0; // Adjust threshold for bloom effect
      bloomPass.strength = 1.5;  // Intensity of the bloom
      bloomPass.radius = 0.5;    // Radius of the bloom

      // Add a mesh to affect with bloom
      const geometry = new THREE.SphereGeometry( 1, 32, 32 );
      const material = new THREE.MeshBasicMaterial( { color: 0xfeffe1 } );
      const sphere = new THREE.Mesh( geometry, material );
      scene.add( sphere );
    };
    setupEffectComposer();

    // Set up physics
    const clock = new THREE.Clock();
    let delta;
    let world = null;
    let cubeMesh = null, cubeBody = null;
    const setupPhysics = () => {
      world = new CANNON.World();
      world.gravity.set( 0, -9.82, 0 );
      // world.broadphase = new CANNON.NaiveBroadphase()
      // ;(world.solver as CANNON.GSSolver).iterations = 10
      // world.allowSleep = true

      const normalMaterial = new THREE.MeshNormalMaterial();
      const phongMaterial = new THREE.MeshPhongMaterial();

      const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
      cubeMesh = new THREE.Mesh( cubeGeometry, normalMaterial );
      cubeMesh.position.set( 0, 1, -1 );
      cubeMesh.castShadow = true;
      scene.add( cubeMesh );
      const cubeShape = new CANNON.Box( new CANNON.Vec3( 0.5, 0.5, 0.5 ) );
      cubeBody = new CANNON.Body( { mass: 1 } );
      cubeBody.addShape( cubeShape );
      cubeBody.position.x = cubeMesh.position.x;
      cubeBody.position.y = cubeMesh.position.y;
      cubeBody.position.z = cubeMesh.position.z;
      world.addBody( cubeBody );
    };
    setupPhysics();

    //
    const createSphere = () => {
      // const geometry = new THREE.BoxGeometry( 1, 1, 1, 1, 1, 1 );
      // const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
      // cameraSphere = new THREE.Mesh( geometry, material );
      // cameraSphere.position.set( 0, 0, -1 );
      // scene.add( cameraSphere );
      // camera.add( cameraSphere );
      // console.log( 'camera = ', camera );

      //
      // const geometry2 = new THREE.BufferGeometry();

      // const vertices = new Float32Array( [
      //   -1.0, -1.0, 1.0, // v0
      //   1.0, -1.0, 1.0, // v1
      //   1.0, 1.0, 1.0, // v2
      //   -1.0, 1.0, 1.0, // v3
      // ] );

      // const indices = [
      //   0, 1, 2,
      //   2, 3, 0,
      // ];

      // geometry2.setIndex( indices );
      // geometry2.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

      // const material2 = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
      // const mesh = new THREE.Mesh( geometry2, material2 );
      // console.log( 'mesh = ', mesh );
      // scene.add( mesh );
    };
    createSphere();

    // Load model
    wallInsts = LoadModel( scene );

    const handleUserInputOnPC = () => {
      if ( !customInputControlAllow ) {
        return;
      }

      // Handle key
      window.addEventListener( 'keydown', handleKey );

      // Handle mouse control
      window.addEventListener( 'mousedown', handleMouseDown );
      window.addEventListener( 'mousemove', handleMouseMove );
      window.addEventListener( 'mouseup', handleMouseUp );

      // Handle mouse wheel
      window.addEventListener( 'wheel', handleMouseWheel );
    };
    handleUserInputOnPC();

    // Animation loop
    const animate = () => {
      requestAnimationFrame( animate );

      composer.render();

      controls.update();

      //delta = clock.getDelta()
      delta = Math.min( clock.getDelta(), 0.1 );
      // world.step( delta );

      // Copy coordinates from Cannon to Three.js
      cubeMesh.position.set( cubeBody.position.x, cubeBody.position.y, cubeBody.position.z );
      cubeMesh.quaternion.set( cubeBody.quaternion.x, cubeBody.quaternion.y, cubeBody.quaternion.z, cubeBody.quaternion.w );
    };
    animate();

    // handle resize window
    const handleResizeWindow = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      composer.setSize( window.innerWidth, window.innerHeight );
    };
    window.addEventListener( 'resize', handleResizeWindow );

    return () => {
      mountRef.current.removeChild( renderer.domElement );

      if ( customInputControlAllow ) {
        window.removeEventListener( 'keydown', handleKey );
        window.removeEventListener( 'mousedown', handleMouseDown );
        window.removeEventListener( 'mousemove', handleMouseMove );
        window.removeEventListener( 'mouseup', handleMouseUp );
        window.removeEventListener( 'wheel', handleMouseWheel );
      }

      window.removeEventListener( 'resize', handleResizeWindow );

      isInited = true;
    };
  }, [] );

  // Handle key
  const handleKey = ( event ) => {
    const moveCoef = 0.1;
    const rotCoef = 0.03;

    switch ( event.keyCode ) {
      case 87:
      case 38:
        camera.translateZ( -1 * moveCoef );
        break;
      case 83:
      case 40:
        camera.translateZ( 1 * moveCoef );
        break;
      case 65:
      case 37:
        camera.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), 1 * rotCoef );
        break;
      case 68:
      case 39:
        camera.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), -1 * rotCoef );
        break;
      default:
        break;
    }
  };

  // Handle Mouse Move
  let isMouseDown = false;
  let isScrollDown = false;
  let previousMousePosition = { x: 0, y: 0 };

  const handleMouseDown = ( event ) => {
    if ( event.button === 0 ) { // Left mouse button
      isMouseDown = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    if ( event.button === 1 ) {
      isScrollDown = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseMove = ( event ) => {
    const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
    if ( isMouseDown ) {
      camera.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), -deltaMove.x * 0.005 ); // Horizontal movement
      camera.rotateX( -deltaMove.y * 0.005 ); // Vertical movement
      // camera.rotation.x = Math.max( -Math.PI / 2, Math.min( Math.PI / 2, camera.rotation.x ) ); // Look limits

      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    if ( isScrollDown ) {
      const moveCoef = 0.01;
      camera.translateX( -deltaMove.x * moveCoef );
      camera.translateY( deltaMove.y * moveCoef );
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseUp = () => {
    isMouseDown = false;
    isScrollDown = false;
  };

  // Handle mouse wheel
  const handleMouseWheel = ( event ) => {
    // event.preventDefault();
    const delta = event.deltaY;

    cameraScrollLerp( delta );
  };

  const cameraScrollLerp = ( delta ) => {

    const moveCoef = 0.005;
    camera.translateZ( delta * moveCoef );
  };

  // Handle update
  let lastTime = 0;
  const targetFPS = 60;
  const interval = 1000 / targetFPS; // desired interval in milliseconds

  const update = ( deltaTime ) => {

  };

  const gameLoop = ( timestamp ) => {
    const elapsed = timestamp - lastTime;

    if ( elapsed >= interval ) {
      lastTime = timestamp - ( elapsed % interval ); // Adjust for overrun
      if ( isInited ) {
        update( elapsed );
      }
    }

    requestAnimationFrame( gameLoop );
  };

  requestAnimationFrame( gameLoop );

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;

};

export default ThreeScene;
