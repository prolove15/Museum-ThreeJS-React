// src/ThreeScene.js

import React, { useEffect, useRef } from 'react';
import { LoadModel } from './LoadModel';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer, TessellateModifier, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';

const ThreeScene = () => {
  const mountRef = useRef( null );
  const cameraRef = useRef( null );
  const sceneRef = useRef( null );
  let camera = null;

  useEffect( () => {
    // initialize
    const mount = mountRef.current;

    // Set up the scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set up the camera
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 0, 1, 0 );
    cameraRef.current = camera;

    // Set up the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    mount.appendChild( renderer.domElement );

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

    // const loader = new RGBELoader();
    // loader.load( '/skybox/sky.hdr', function ( hdrMap ) {
    //   // Create a PMREM texture from the HDR map for better lighting
    //   const pmremGenerator = new THREE.PMREMGenerator( renderer );
    //   const envMap = pmremGenerator.fromEquirectangular( hdrMap ).texture;
    //   scene.background = envMap;
    //   scene.environment = envMap;

    //   pmremGenerator.dispose(); // Clean up
    // } );

    // // Set up light
    // const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); // Color and intensity
    // directionalLight.position.set( 5, 10, 7 ); // Set position of the light
    // directionalLight.castShadow = true;
    // scene.add( directionalLight );

    // const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 ); // White light with intensity 0.5
    // scene.add( ambientLight );

    // const pointLight = new THREE.PointLight( 0xffffff, 1, 0.1 ); // White light with intensity 1
    // pointLight.position.set( 10, 10, 10 ); // Position the light in the scene
    // scene.add( pointLight );

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

    // Step 4: Add ambient light
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 ); // Dim ambient light
    scene.add( ambientLight );

    // // Step 5: Add point lights for room-like effect
    // // Light positioned above the center of the room
    // const pointLight = new THREE.PointLight( 0xffffff, 1, 50 );
    // pointLight.position.set( 0, 10, 0 ); // Position it above the scene
    // scene.add( pointLight );

    // // Optional: Add a soft color to simulate warm light
    // const pointLight2 = new THREE.PointLight( 0xffcc99, 0.5, 30 );
    // pointLight2.position.set( -5, 5, -5 ); // Another light for variation
    // scene.add( pointLight2 );

    // Add a light
    // const light = new THREE.PointLight( 0xffffff, 1, 100 );
    // light.position.set( 10, 10, 10 );
    // scene.add( light );

    // Add a mesh to affect with bloom
    const geometry = new THREE.SphereGeometry( 1, 32, 32 );
    const material = new THREE.MeshBasicMaterial( { color: 0xfeffe1 } );
    const sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere );

    camera.position.z = 5;

    // Setup EffectComposer
    const composer = new EffectComposer( renderer );

    // RenderPass
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    // UnrealBloomPass
    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    composer.addPass( bloomPass );

    // Adjust bloom parameters if required
    bloomPass.threshold = 0; // Adjust threshold for bloom effect
    bloomPass.strength = 1.5;  // Intensity of the bloom
    bloomPass.radius = 0.5;    // Radius of the bloom

    // Load model
    LoadModel( scene );

    // Animation loop
    const animate = () => {
      requestAnimationFrame( animate );
      composer.render();
    };
    animate();

    // Handle key
    window.addEventListener( 'keydown', handleKey );

    // Handle mouse control
    window.addEventListener( 'mousedown', handleMouseDown );
    window.addEventListener( 'mousemove', handleMouseMove );
    window.addEventListener( 'mouseup', handleMouseUp );

    // Handle mouse wheel
    window.addEventListener( 'wheel', handleMouseWheel );

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
      window.removeEventListener( 'keydown', handleKey );
      window.removeEventListener( 'mousedown', handleMouseDown );
      window.removeEventListener( 'mousemove', handleMouseMove );
      window.removeEventListener( 'mouseup', handleMouseUp );
      window.removeEventListener( 'wheel', handleMouseWheel );
      window.removeEventListener( 'resize', handleResizeWindow );
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
      update( elapsed );
    }

    requestAnimationFrame( gameLoop );
  };

  requestAnimationFrame( gameLoop );

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default ThreeScene;
