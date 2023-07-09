import { getProject, types } from "@theatre/core";
import studio from "@theatre/studio";
//@ts-expect-error - no types
import * as THREE from "three";

studio.initialize();

// const project = getProject("home-page");
// const sheet = project.sheet("animation");

// Credits: https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/

const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x609dc8,
};

let sky: Sky;
let sea: Sea;

let hemisphereLight: THREE.HemisphereLight;
let shadowLight: THREE.DirectionalLight;
let ambientLight: THREE.AmbientLight;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let HEIGHT: number;
let WIDTH: number;
let aspectRatio: number;
let fieldOfView: number;
let nearPlane: number;
let farPlane: number;
let container: HTMLElement | null;
let renderer: THREE.WebGLRenderer;

const logos = ["/nextjs.png", "/blitz.png", "/tanstack.png", "/github.png"];

let z = 0;
class Cloud {
  mesh: THREE.Object3D;
  constructor() {
    this.mesh = new THREE.Object3D();
    const geom = new THREE.BoxGeometry(20, 20, 20);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
    });
    const texture = new THREE.TextureLoader().load("/logos" + logos[z]);
    if (z < logos.length - 1) {
      z++;
    } else {
      z = 0;
    }
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      })
    );
    cloud.position.y = Math.random() * 10;
    cloud.position.z = -5 + Math.random() * 5;
    cloud.rotation.z = -Math.PI;
    cloud.castShadow = true;
    cloud.receiveShadow = true;
    this.mesh.add(cloud);
  }
}

class Sky {
  mesh: THREE.Object3D;
  nClouds: number;
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    const stepAngle = (Math.PI * 2) / this.nClouds;
    for (let i = 0; i < this.nClouds; i++) {
      const c = new Cloud();
      const a = stepAngle * i;
      const h = 750 + Math.random() * 200;
      const s = 1 + Math.random() * 2;
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;
      c.mesh.position.z = -400 - Math.random() * 300;
      c.mesh.rotation.z = a + Math.PI / 2;
      c.mesh.scale.set(s, s, s);
      this.mesh.add(c.mesh);
    }
  }
}

class Sea {
  mesh: THREE.Object3D;
  waves: any[];
  constructor() {
    const geom = new THREE.SphereGeometry(700, 50, 50);

    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.mergeVertices();

    const l = geom.vertices.length;
    this.waves = [];

    for (let i = 0; i < l; i++) {
      const v = geom.vertices[i];
      this.waves.push({
        x: v.x,
        y: v.y,
        z: v.z,
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 15,
        speed: 0.016 + Math.random() * 0.032,
      });
    }

    const mat = new THREE.MeshLambertMaterial({
      color: Colors.blue,
      shading: THREE.FlatShading,
      transparent: true,
      opacity: 0.8,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }
  moveWaves() {
    const verts = this.mesh.geometry.vertices;
    const l = verts.length;

    for (let i = 0; i < l; i++) {
      const v = verts[i];
      const vprops = this.waves[i];

      v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

      vprops.ang += vprops.speed;
    }

    this.mesh.geometry.verticesNeedUpdate = true;
    sea.mesh.rotation.z += 0.005;
  }
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  sky.mesh.position.z = 400;
  scene.add(sky.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -700;
  sea.mesh.position.z = -300;
  scene.add(sea.mesh);
}

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;

  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(ambientLight);
  scene.add(shadowLight);
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc9c9b0, 100, 950);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 65;
  nearPlane = 0.1;
  farPlane = 10000;

  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.y = 100;
  camera.position.z = 170;

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById("world");
  container?.appendChild(renderer.domElement);

  window.addEventListener("resize", handleWindowResize, false);
}

function loop() {
  sea.moveWaves();
  sky.mesh.rotation.z += 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function init() {
  createScene();
  createLights();
  createSea();
  createSky();
  loop();
}

window.addEventListener("load", init, false);
