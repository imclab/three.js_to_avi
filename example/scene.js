
    		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;

			var MARGIN = 100;

    		var SCREEN_WIDTH = window.innerWidth;
			var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
			var FLOOR = -250;

			var camera, controls, scene2, renderer;
			var container, stats;

			var NEAR = 5, FAR = 3000;

			var sceneHUD, cameraOrtho, hudMaterial;

			var morph, morphs = [];

			var light;

			var clock = new THREE.Clock();


            var scene = {};
			scene.init = function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				// SCENE CAMERA

				camera = new THREE.PerspectiveCamera( 23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
				camera.position.set( 700, 50, 1900 );

				controls = new THREE.FirstPersonControls( camera );

				controls.lookSpeed = 0.0125;
				controls.movementSpeed = 500;
				controls.noFly = false;
				controls.lookVertical = true;
				controls.constrainVertical = true;
				controls.verticalMin = 1.5;
				controls.verticalMax = 2.0;

				controls.lon = -110;

				// SCENE

				scene2 = new THREE.Scene();
				scene2.fog = new THREE.Fog( 0xffaa55, 1000, FAR );
				THREE.ColorUtils.adjustHSV( scene2.fog.color, 0.02, -0.15, -0.65 );

				// LIGHTS

				var ambient = new THREE.AmbientLight( 0x444444 );
				scene2.add( ambient );

				light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
				light.position.set( 0, 1500, 1000 );
				light.target.position.set( 0, 0, 0 );

				light.castShadow = true;

				light.shadowCameraNear = 700;
				light.shadowCameraFar = camera.far;
				light.shadowCameraFov = 50;

				//light.shadowCameraVisible = true;

				light.shadowBias = 0.0001;
				light.shadowDarkness = 0.5;

				light.shadowMapWidth = SHADOW_MAP_WIDTH;
				light.shadowMapHeight = SHADOW_MAP_HEIGHT;

				scene2.add( light );

				createHUD();
				createScene();

				// RENDERER

				renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
				renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
				renderer.domElement.style.position = "relative";
				renderer.domElement.style.top = MARGIN + 'px';
				container.appendChild( renderer.domElement );

				renderer.setClearColor( scene2.fog.color, 1 );
				renderer.autoClear = false;

				//

				renderer.shadowMapEnabled = true;
				renderer.shadowMapType = THREE.PCFShadowMap;

				// STATS

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				stats.domElement.style.zIndex = 100;
				//container.appendChild( stats.domElement );

				//

			}


			function createHUD() {

				cameraOrtho = new THREE.OrthographicCamera( SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2,  SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10, 1000 );
				cameraOrtho.position.z = 10;

				var shader = THREE.UnpackDepthRGBAShader;
				var uniforms = new THREE.UniformsUtils.clone( shader.uniforms );

				hudMaterial = new THREE.ShaderMaterial( { vertexShader: shader.vertexShader, fragmentShader: shader.fragmentShader, uniforms: uniforms } );

				var hudGeo = new THREE.PlaneGeometry( SHADOW_MAP_WIDTH / 2, SHADOW_MAP_HEIGHT / 2 );
				var hudMesh = new THREE.Mesh( hudGeo, hudMaterial );
				hudMesh.position.x = ( SCREEN_WIDTH - SHADOW_MAP_WIDTH / 2 ) * -0.5;
				hudMesh.position.y = ( SCREEN_HEIGHT - SHADOW_MAP_HEIGHT / 2 ) * -0.5;
				hudMesh.rotation.x = Math.PI / 2;

				sceneHUD = new THREE.Scene();
				sceneHUD.add( hudMesh );

				cameraOrtho.lookAt( sceneHUD.position );

			}

			function createScene( ) {

				// GROUND

				var geometry = new THREE.PlaneGeometry( 100, 100 );
				var planeMaterial = new THREE.MeshPhongMaterial( { color: 0xffdd99 } );
				THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
				planeMaterial.ambient = planeMaterial.color;

				var ground = new THREE.Mesh( geometry, planeMaterial );

				ground.position.set( 0, FLOOR, 0 );
				ground.rotation.x = - Math.PI / 2;
				ground.scale.set( 100, 100, 100 );

				ground.castShadow = false;
				ground.receiveShadow = true;

				scene2.add( ground );

				// TEXT

				var textGeo = new THREE.TextGeometry( "THREE.JS", {

					size: 200,
					height: 50,
					curveSegments: 12,

					font: "helvetiker",
					weight: "bold",
					style: "normal",

					bevelThickness: 2,
					bevelSize: 5,
					bevelEnabled: true

				});

				textGeo.computeBoundingBox();
				var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

				var textMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, specular: 0xffffff, ambient: 0xaa0000 } );

				var mesh = new THREE.Mesh( textGeo, textMaterial );
				mesh.position.x = centerOffset;
				mesh.position.y = FLOOR + 67;

				mesh.castShadow = true;
				mesh.receiveShadow = true;

				scene2.add( mesh );

				// CUBES

				var mesh = new THREE.Mesh( new THREE.CubeGeometry( 1500, 220, 150 ), planeMaterial );

				mesh.position.y = FLOOR - 50;
				mesh.position.z = 20;

				mesh.castShadow = true;
				mesh.receiveShadow = true;

				scene2.add( mesh );

				var mesh = new THREE.Mesh( new THREE.CubeGeometry( 1600, 170, 250 ), planeMaterial );

				mesh.position.y = FLOOR - 50;
				mesh.position.z = 20;

				mesh.castShadow = true;
				mesh.receiveShadow = true;

				scene2.add( mesh );

				// MORPHS

				function addMorph( geometry, speed, duration, x, y, z, fudgeColor ) {

					var material = new THREE.MeshLambertMaterial( { color: 0xffaa55, morphTargets: true, vertexColors: THREE.FaceColors } );

					if ( fudgeColor ) {

						THREE.ColorUtils.adjustHSV( material.color, 0, 0.5 - Math.random(), 0.5 - Math.random() );
						material.ambient = material.color;

					}

					var meshAnim = new THREE.MorphAnimMesh( geometry, material );

					meshAnim.speed = speed;
					meshAnim.duration = duration;
					meshAnim.time = 600 * Math.random();

					meshAnim.position.set( x, y, z );
					meshAnim.rotation.y = Math.PI/2;

					meshAnim.castShadow = true;
					meshAnim.receiveShadow = true;

					scene2.add( meshAnim );

					morphs.push( meshAnim );

				}

				function morphColorsToFaceColors( geometry ) {

					if ( geometry.morphColors && geometry.morphColors.length ) {

						var colorMap = geometry.morphColors[ 0 ];

						for ( var i = 0; i < colorMap.colors.length; i ++ ) {

							geometry.faces[ i ].color = colorMap.colors[ i ];

						}

					}

				}

				var loader = new THREE.JSONLoader();

				loader.load( "../libs/models/horse.js", function( geometry ) {

					morphColorsToFaceColors( geometry );

					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, 300, true );
					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, 450, true );
					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, 600, true );

					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, -300, true );
					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, -450, true );
					addMorph( geometry, 550, 1000, 100 - Math.random() * 1000, FLOOR, -600, true );

				} );

			}

			//



			scene.render = function render() {

				var delta = clock.getDelta();

				for ( var i = 0; i < morphs.length; i ++ ) {

					morph = morphs[ i ];

					morph.updateAnimation( 1000 * delta );

					morph.position.x += morph.speed * delta;

					if ( morph.position.x  > 2000 )  {

						morph.position.x = -1000 - Math.random() * 500;

					}

				}

				controls.update( delta );

				renderer.clear();
				renderer.render( scene2, camera );

				// Render debug HUD with shadow map

				//hudMaterial.uniforms.tDiffuse.texture = light.shadowMap;
				//renderer.render( sceneHUD, cameraOrtho );

			}
