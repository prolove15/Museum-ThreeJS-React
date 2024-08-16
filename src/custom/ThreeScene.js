
//-------------------------------------------------- import external modules
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer, RoomEnvironment, TessellateModifier, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import * as MW from '../external/modules/meshwalk.module';

//-------------------------------------------------- import custom modules
import { LoadModel } from './LoadModel';

//////////////////////////////////////////////////
//----------------------------------------
// Function scripts
//----------------------------------------
//////////////////////////////////////////////////

const ThreeScene = () => {

  ////////////////////////////////////////////////// 
  // variables
  //////////////////////////////////////////////////

  const mountRef = useRef( null );
  const sceneRef = useRef( null );

  let scene = {};
  let camera = null;
  let world = {};
  let octree = null;
  let composer = {};

  let customInputControlAllow = true;
  let isEnvLoaded = false;
  let wallInsts = null;
  let playerController = {};
  let playerObjectHolder = {};
  const clock = new THREE.Clock();
  let sphere = {};

  //////////////////////////////////////////////////
  // useEffect : mount
  //////////////////////////////////////////////////

  useEffect( () => {

    //-------------------------------------------------- Set mount
    const mount = mountRef.current;

    //-------------------------------------------------- Set up the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    mount.appendChild( renderer.domElement );

    //-------------------------------------------------- Set up the scene
    const setupScene = () => {
      scene = new THREE.Scene();
      scene.add( new THREE.AxesHelper( 5 ) );
      sceneRef.current = scene;
    };

    setupScene();

    //-------------------------------------------------- Set up the light
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

    //-------------------------------------------------- Set up the EffectComposer
    composer = new EffectComposer( renderer );

    const setupEffectComposer = () => {
      //
      const renderPass = new RenderPass( scene, camera );
      composer.addPass( renderPass );

      // const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
      // composer.addPass( bloomPass );

      // bloomPass.threshold = 0; // Adjust threshold for bloom effect
      // bloomPass.strength = 1.5;  // Intensity of the bloom
      // bloomPass.radius = 0.5;    // Radius of the bloom

      // Add a mesh to affect with bloom
      // const geometry = new THREE.SphereGeometry( 1, 32, 32 );
      // const material = new THREE.MeshBasicMaterial( { color: 0xfeffe1 } );
      // const sphere = new THREE.Mesh( geometry, material );
      // scene.add( sphere );
    };

    //-------------------------------------------------- Handle resize window
    const handleResizeWindow = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      composer.setSize( window.innerWidth, window.innerHeight );
    };
    window.addEventListener( 'resize', handleResizeWindow );

    //-------------------------------------------------- Load model
    const prepareEnv = async () => {
      wallInsts = await LoadModel( scene );

      setupPhysicalWorld();

      setupCamera();

      setupPlayerController();

      setupUserInputOnPC();

      setupEffectComposer();

      isEnvLoaded = true;
    };

    prepareEnv();

    //-------------------------------------------------- return
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
    };

  }, [] );

  //////////////////////////////////////////////////
  // Set up
  //////////////////////////////////////////////////

  //-------------------------------------------------- Set up the physical world
  const setupPhysicalWorld = () => {
    world = new MW.World();
    octree = new MW.Octree();
    world.add( octree );


    const itemChild = wallInsts[ 0 ].children[ 0 ].children[ 41 ];
    // itemChild.position.set( item.position );
    const wallBox = new THREE.Mesh(
      new THREE.BoxGeometry( 3.2, 5, 1 ),
      new THREE.MeshNormalMaterial()
    );
    console.log( 'wallInsts[0].position = ', wallInsts[ 0 ].position, ', wallInsts[0].rotation = ', wallInsts[ 0 ].rotation );
    // wallBox.position.set( wallInsts[ 0 ].position.x, wallInsts[ 0 ].position.y, wallInsts[ 0 ].position.z );
    wallBox.rotateX( Math.PI / 2 * 0.05 );
    wallBox.position.set( -4.15, 0, -2.4 );
    // wallBox.rotation.set( wallInsts[ 0 ].rotation.x, wallInsts[ 0 ].rotation.y, wallInsts[ 0 ].rotation.z );
    console.log( 'wallBox.position = ', wallBox.position, ', wallBox.rotation = ', wallBox.rotation );
    scene.add( wallBox );

    // octree.addGraphNode( item.children[ 0 ] );
    const wallBoxHelper = new THREE.LineSegments( new THREE.WireframeGeometry( wallBox.geometry ) );
    wallBoxHelper.position.copy( wallBox.position );
    // wallBoxHelper.rotation.copy( wallBox.rotation );
    console.log( 'wallBoxHelper.position = ', wallBoxHelper.position, ', wallBoxHelper.rotation = ', wallBoxHelper.rotation );
    scene.add( wallBoxHelper );
    octree.addGraphNode( wallBox );


    const box = new THREE.Mesh(
      new THREE.BoxGeometry( 100, 1, 100 ),
      new THREE.MeshNormalMaterial()
    );
    box.position.set( 0, -2, 0 );
    console.log( 'box = ', box );
    // scene.add( box );

    // const boxHelper = new THREE.LineSegments( new THREE.WireframeGeometry( box.geometry ) );
    // boxHelper.position.copy( box.position );
    // scene.add( boxHelper );
    octree.addGraphNode( box );


    wallInsts.map( item => {
    } );
  };

  //-------------------------------------------------- Set up the camera
  const setupCamera = () => {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 2, 2 );
  };

  //-------------------------------------------------- Set up the player controller
  const setupPlayerController = () => {
    const playerRadius = .75;
    playerObjectHolder = new THREE.Object3D();
    scene.add( playerObjectHolder );

    sphere = new THREE.Mesh(
      new THREE.SphereGeometry( playerRadius, 16, 16 ),
      new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } )
    );
    playerObjectHolder.add( sphere );
    sphere.position.set( 0, 0, 0 );

    playerObjectHolder.add( camera );
    camera.position.set( 0, 1, 0 );

    playerController = new MW.CharacterController( playerObjectHolder, playerRadius );
    // playerController.teleport( 0, 10, 0 );
    playerController.teleport( -4.15, 5, -2.4 );
    world.add( playerController );
  };

  //-------------------------------------------------- Set up user input on PC
  const setupUserInputOnPC = () => {
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

  //////////////////////////////////////////////////
  // Various methods
  //////////////////////////////////////////////////

  //-------------------------------------------------- Handle key
  const handleKey = ( event ) => {
    switch ( event.keyCode ) {
      case 87: // forward w, uparrow
      case 38:
        translatePlayerController( true, 1 );
        break;
      case 83: // backward s, downarrow
      case 40:
        translatePlayerController( true, -1 );
        break;
      case 65: // left a, leftarrow
      case 37:
        translatePlayerController( false, 1 );
        break;
      case 68: // right d, rightarrow
      case 39:
        translatePlayerController( false, -1 );
        break;
      default:
        break;
    }
  };

  const translatePlayerController = ( isZDir, isPlusDir ) => {
    const moveCoef = 0.1;
    let camDir = new THREE.Vector3();
    camera.getWorldDirection( camDir );
    camDir.normalize();
    if ( !isZDir ) {
      camDir = camDir.applyMatrix4( new THREE.Matrix4().makeRotationY( Math.PI / 2 ) );
    }

    playerController.position.x = playerObjectHolder.position.x + camDir.x * isPlusDir * moveCoef;
    playerController.position.z = playerObjectHolder.position.z + camDir.z * isPlusDir * moveCoef;
  };

  //-------------------------------------------------- Handle Mouse Move
  let isMouseDown = false;
  let previousMousePosition = { x: 0, y: 0 };

  const handleMouseDown = ( event ) => {
    if ( event.button === 0 ) { // Left mouse button
      isMouseDown = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseMove = ( event ) => {
    if ( !isMouseDown ) {
      return;
    }

    const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };

    camera.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), -deltaMove.x * 0.005 ); // Horizontal movement
    camera.rotateX( -deltaMove.y * 0.005 ); // Vertical movement

    previousMousePosition = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    isMouseDown = false;
  };

  //-------------------------------------------------- Handle mouse wheel
  const handleMouseWheel = ( event ) => {
    const delta = event.deltaY;

    cameraScrollLerp( delta );
  };

  const cameraScrollLerp = ( delta ) => {
    const moveCoef = 0.005;
    camera.translateZ( delta * moveCoef );
  };

  //--------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  //////////////////////////////////////////////////
  // Update
  //////////////////////////////////////////////////

  //-------------------------------------------------- Handle update
  let lastTime = 0;
  const targetFPS = 60;
  const interval = 1000 / targetFPS; // desired interval in milliseconds
  let delta = {};

  const update = ( deltaTime ) => {
    if ( !isEnvLoaded ) {
      return;
    }

    composer.render();

    delta = Math.min( clock.getDelta(), 0.1 );
    world.fixedUpdate();
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

  //--------------------------------------------------
  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;

};

export default ThreeScene;
