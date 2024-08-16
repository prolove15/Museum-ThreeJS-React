
//-------------------------------------------------- import external modules
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer, RoomEnvironment, TessellateModifier, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import * as MW from '../external/modules/meshwalk.module';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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
  const cameraRef = useRef( null );
  const sceneRef = useRef( null );
  let scene = null;
  let camera = null;
  let world = {};
  let octree = null;
  let composer = {};

  let customInputControlAllow = true;
  let isInited = false;
  let wallInsts = null;
  let playerController = {};
  let playerObjectHolder = {};
  let pointerLock = {};
  let isPointerLocked = {};

  const clock = new THREE.Clock();
  let sphere = {};

  //////////////////////////////////////////////////
  // useEffect
  //////////////////////////////////////////////////

  useEffect( () => {
    // async function fectchData () {

    //-------------------------------------------------- initialize
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

    //-------------------------------------------------- Set up the physical world
    const setupPhysicalWorld = () => {
      world = new MW.World();
      octree = new MW.Octree();
      world.add( octree );

      const box = new THREE.Mesh(
        new THREE.BoxGeometry( 100, 1, 100 ),
        new THREE.MeshNormalMaterial()
      );
      box.position.set( 0, -2, 0 );
      scene.add( box );

      const boxHelper = new THREE.LineSegments( new THREE.WireframeGeometry( box.geometry ) );
      boxHelper.position.copy( box.position );
      scene.add( boxHelper );
      octree.addGraphNode( box );
    };

    setupPhysicalWorld();

    //-------------------------------------------------- Set up the camera
    const setupCamera = () => {
      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
      camera.position.set( 0, 2, 2 );
      cameraRef.current = camera;
    };

    setupCamera();

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

    setupEffectComposer();

    //-------------------------------------------------- Generate cube
    let cubeMesh = {};

    const generateCube = () => {
      const normalMaterial = new THREE.MeshNormalMaterial();

      const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
      cubeMesh = new THREE.Mesh( cubeGeometry, normalMaterial );
      cubeMesh.position.set( 0, 1, -1 );
      cubeMesh.castShadow = true;
      scene.add( cubeMesh );
    };

    generateCube();

    //-------------------------------------------------- Lock cursor
    let lockValidTime = true;

    const setupCursor = () => {
      pointerLock = new PointerLockControls( camera, document.body );
      // pointerLock.disconnect();
      // pointerLock.minPolarAngle = -Math.PI * ( 60 / 180 );
      pointerLock.maxPolarAngle = -Math.PI * ( 60 / 180 );
      pointerLock.minPolarAngle = -Math.PI * ( 120 / 180 );
      isPointerLocked = false;

      pointerLock.addEventListener( 'lock', ( event ) => {
        console.log( 'addEventListener, lock' );
        isPointerLocked = true;
      } );

      pointerLock.addEventListener( 'unlock', ( event ) => {
        console.log( 'addEventListener, unlock' );
        lockValidTime = false;
        setTimeout( () => { lockValidTime = true; }, 2000 );
        isPointerLocked = false;
      } );

      renderer.domElement.addEventListener( 'mousedown', function ( event ) {
        if ( lockValidTime ) {
          pointerLock.lock();
        }
      } );
    };

    setupCursor();

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
      playerController.teleport( 0, 10, 0 );
      world.add( playerController );
    };

    setupPlayerController();

    //-------------------------------------------------- Load model
    // wallInsts = await LoadModel( scene );
    wallInsts = LoadModel( scene );

    //-------------------------------------------------- Handle user input on PC
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

    //-------------------------------------------------- Handle resize window
    const handleResizeWindow = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      composer.setSize( window.innerWidth, window.innerHeight );
    };
    window.addEventListener( 'resize', handleResizeWindow );
    // }
    // fectchData();

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

      isInited = true;
    };
  }, [] );
  // } )();

  //////////////////////////////////////////////////
  // Methods
  //////////////////////////////////////////////////

  //-------------------------------------------------- Handle key
  const handleKey = ( event ) => {
    if ( !isPointerLocked ) {
      return;
    }

    switch ( event.keyCode ) {
      case 87: // forward w, uparrow
      case 38:
        translateZPlayerController( 1 );
        break;
      case 83: // backward s, downarrow
      case 40:
        translateZPlayerController( -1 );
        break;
      case 65: // left a, leftarrow
      case 37:
        // playerController.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), 1 * rotCoef );
        break;
      case 68: // right d, rightarrow
      case 39:
        // playerController.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), -1 * rotCoef );
        break;
      default:
        break;
    }
  };

  const translateZPlayerController = ( dir ) => {
    const moveCoef = 0.1;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection( camDir );
    camDir.normalize();

    playerController.position.x = playerObjectHolder.position.x + camDir.x * dir * moveCoef;
    playerController.position.z = playerObjectHolder.position.z + camDir.z * dir * moveCoef;
  };

  //-------------------------------------------------- Handle Mouse Move
  let isMouseDown = false;
  let previousMousePosition = { x: 0, y: 0 };

  const handleMouseDown = ( event ) => {
    // console.log( 'handleMouseDown, isPointerLocked =', isPointerLocked, ', event = ', event );
    if ( !isPointerLocked ) {
      return;
    }

    if ( event.button === 0 ) { // Left mouse button
      isMouseDown = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseMove = ( event ) => {
    // console.log( 'handleMouseMove, isPointerLocked =', isPointerLocked, ', event = ', event );
    if ( !isPointerLocked ) {
      return;
    }

    const deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
    // console.log( 'deltaMove = ', deltaMove );

    camera.rotateOnWorldAxis( new THREE.Vector3( 0, 1, 0 ), -deltaMove.x * 0.005 ); // Horizontal movement
    camera.rotateX( -deltaMove.y * 0.005 ); // Vertical movement
    // camera.rotation.x = Math.max( -Math.PI / 2, Math.min( Math.PI / 2, camera.rotation.x ) ); // Look limits

    previousMousePosition = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = () => {
    // console.log( 'handleMouseUp, isPointerLocked =', isPointerLocked );
    if ( !isPointerLocked ) {
      return;
    }

    isMouseDown = false;
  };

  //-------------------------------------------------- Handle mouse wheel
  const handleMouseWheel = ( event ) => {
    if ( !isPointerLocked ) {
      return;
    }

    // event.preventDefault();
    const delta = event.deltaY;

    cameraScrollLerp( delta );
  };

  const cameraScrollLerp = ( delta ) => {
    const moveCoef = 0.005;
    camera.translateZ( delta * moveCoef );
  };

  //-------------------------------------------------- Handle update
  let lastTime = 0;
  const targetFPS = 60;
  const interval = 1000 / targetFPS; // desired interval in milliseconds
  let delta = {};

  const update = ( deltaTime ) => {
    composer.render();

    delta = Math.min( clock.getDelta(), 0.1 );
    world.fixedUpdate();
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

  //--------------------------------------------------
  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;

};

export default ThreeScene;
