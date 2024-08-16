
//-------------------------------------------------- import external modules
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

//////////////////////////////////////////////////
//----------------------------------------
// Function scripts
//----------------------------------------
//////////////////////////////////////////////////

export const LoadModel = async ( scene ) => {

  //////////////////////////////////////////////////
  // variables
  //////////////////////////////////////////////////

  let wallModel = null;
  let wallInsts = [];
  let floorModel = null;
  const regionId = 1;

  //////////////////////////////////////////////////
  // Methods
  //////////////////////////////////////////////////

  //-------------------------------------------------- Adjust wall instance
  const adjustWallInstance = ( wallInst, index, pivotPos, lengthX ) => {
    wallInst.scale.set( 1, 1, 1 );
    wallInst.position.set( pivotPos[ 0 ], pivotPos[ 1 ], pivotPos[ 2 ] );
    wallInst.rotateY( Math.PI / 6 + Math.PI / 3 * index );
    wallInst.translateZ( -lengthX * Math.sqrt( 3 ) / 2 );
  };

  //-------------------------------------------------- Place room instances
  const placeRoomInstance = ( modelData ) => {
    for ( let i = 0; i < 6; i++ ) {
      if ( modelData.opendPos?.indexOf( i + 1 ) === -1 ) {
        let wallInst = wallModel.clone();
        adjustWallInstance( wallInst, i, modelData.position, getLengthXOfModel( wallModel ) );
        scene.add( wallInst );
        wallInsts.push( wallInst );
      }
    }
  };

  //-------------------------------------------------- Adjust pivot of the object
  const adjustPivot = ( obj ) => {
    // const parent = new THREE.Object3D();
    const parent = new THREE.Mesh();
    parent.add( obj );
    const boundingBox = new THREE.Box3().setFromObject( obj );
    let centerOfObj = new THREE.Vector3( ( boundingBox.max.x + boundingBox.min.x ) / 2,
      ( boundingBox.max.y + boundingBox.min.y ) / 2,
      ( boundingBox.max.z + boundingBox.min.z ) / 2 );
    obj.position.set( -centerOfObj.x, -centerOfObj.y, -centerOfObj.z );

    return parent;
  };

  //-------------------------------------------------- Get X length of model
  const getLengthXOfModel = ( obj ) => {
    const boundingBox = new THREE.Box3().setFromObject( obj );

    return Math.abs( boundingBox.max.x - boundingBox.min.x );
  };

  //-------------------------------------------------- Load models
  const preloadModels = async () => {
    const loader_obj = new OBJLoader();
    const loader_gltf = new GLTFLoader();
    const material = new THREE.MeshPhysicalMaterial( {
      color: 0xe2c6a1, // Dark grey for metal
      metalness: 0,  // Fully metallic
      roughness: 0.9,   // Slightly rough for realism
      reflectivity: 0.1 // High reflectivity
    } );

    // Load the room model
    const obj1 = await loader_obj.loadAsync( '/models/wall/wall.obj', // Replace with the path to your OBJ file
      function ( obj ) {
        // change material

      },
      function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      function ( error ) {
        console.error( 'An error occurred:', error );
      }
    );

    obj1.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.material = material;
      }
    } );

    wallModel = adjustPivot( obj1 );

    // Load positions after the model is ready
    const resp = await fetch( `/model-positions-${ regionId }.json` );
    const models = await resp.json();

    models.models.forEach( ( modelData ) => {
      placeRoomInstance( modelData );
    } );

    // Load the floor model
    const floorModel = await loader_obj.loadAsync( '/models/wall/wall.obj' );
    const floor = adjustPivot( floorModel );
    floor.scale.set( 10, 10, 1 );
    floor.rotateOnWorldAxis( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );
    floor.position.set( 0, -1, 0 );
    scene.add( floor );

    // Load the roof model
    const roofModel = await loader_obj.loadAsync( '/models/wall/wall.obj' );
    const roof = adjustPivot( roofModel );
    roof.scale.set( 10, 10, 1 );
    roof.rotateOnWorldAxis( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );
    roof.position.set( 0, 1, 0 );
    scene.add( roof );
  };

  await preloadModels();

  //-------------------------------------------------- return
  return wallInsts;

};
