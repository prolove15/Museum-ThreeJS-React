import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

export const LoadModel = ( scene ) => {
  let roomModel = null;
  let doorModel = null;
  const regionId = 1;

  const adjustRoomInstance = ( roomInst ) => {
    roomInst.rotateY( Math.PI / 2 );
    roomInst.scale.set( 150, 50, 150 );
    roomInst.translateX( 10 );
    roomInst.translateZ( 10 );
  };

  const placeRoomInstance = ( modelData ) => {
    if ( !roomModel ) return; // Check if roomModel is loaded
    const roomInst = roomModel.clone();
    // adjustRoomInstance( roomInst );
    scene.add( roomInst );
    roomInst.position.set(
      roomInst.position.x + modelData.position[ 0 ],
      roomInst.position.y + modelData.position[ 1 ],
      roomInst.position.z + modelData.position[ 2 ]
    );
  };

  const preloadModels = () => {
    const loader_obj = new OBJLoader();
    const loader_gltf = new GLTFLoader();
    const material = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0.5 } );

    // Load the room model
    loader_obj.load(
      '/wall/wall.obj', // Replace with the path to your OBJ file
      function ( obj ) {
        obj.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.material = material;
          }
        } );
        roomModel = obj;
        // Load positions after the model is ready
        fetch( `/model-positions-${ regionId }.json` )
          .then( ( response ) => response.json() )
          .then( ( data ) => {
            data.models.forEach( ( modelData ) => {
              placeRoomInstance( modelData );
            } );
          } )
          .catch( ( error ) => console.error( 'Error loading JSON file:', error ) );
      },
      function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      function ( error ) {
        console.error( 'An error occurred:', error );
      }
    );

    // Load the door model
    loader_gltf.load( '/warrior.glb', ( gltf ) => {
      doorModel = gltf.scene;
      scene.add( doorModel );
    },
      ( xhr ) => {

      },
      ( error ) => {
        console.error( 'Error loading door model:', error );
      } );
  };

  preloadModels();

  return null; // No DOM representation needed
};
