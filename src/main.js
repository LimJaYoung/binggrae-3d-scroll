import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import modelUrl from '../output/banana-milk.glb?url';

const stage=document.querySelector('#stage'), loading=document.querySelector('#loading');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
catch { loading.textContent='3D 화면을 열 수 없어요. WebGL을 지원하는 브라우저에서 다시 열어주세요.'; }
if(renderer) init();
function init(){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
stage.appendChild(renderer.domElement);
renderer.domElement.style.pointerEvents='none';
const canvas=document.createElement('div');stage.appendChild(canvas);
Object.assign(canvas.style,{position:'absolute',pointerEvents:'auto',touchAction:'none',cursor:'grab'});
canvas.dataset.rotationControl='true';canvas.tabIndex=0;canvas.setAttribute('aria-label','3D 병: 드래그 또는 방향키로 회전, Home 키로 정면 복원');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,100);camera.position.set(0,0,12);
const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff,0xc5a655,2));
const light=new THREE.DirectionalLight(0xfff9df,3);light.position.set(-3,5,6);scene.add(light);
const pivot=new THREE.Group();scene.add(pivot);
const userRotation=new THREE.Quaternion(), deltaRotation=new THREE.Quaternion();
const axis=new THREE.Vector3(), baseEuler=new THREE.Euler(), baseRotation=new THREE.Quaternion();
const hitBounds=new THREE.Box3(), corner=new THREE.Vector3();
function rotate(dx,dy){
 const distance=Math.hypot(dx,dy);if(!distance)return;
 axis.set(dy,dx,0).normalize();deltaRotation.setFromAxisAngle(axis,distance);
 userRotation.premultiply(deltaRotation).normalize();dragX+=dx;dragY+=dy;
}
let loaded=false,progress=0,dragX=0,dragY=0,auto=false,zoom=1,drag=null,lastTime=0;
const anchors=[...document.querySelectorAll('.chapter')], dots=[...document.querySelectorAll('.chapter-nav a')];
let positions=[];
const state={progress:0,rotation:0,x:0,scale:1,loaded:false};
// Exposed read-only snapshot for verifying the real scroll/drag scene transforms.
window.getBottleState=()=>({...state,quaternion:pivot.quaternion.toArray(),verticalRotation:dragY});
new GLTFLoader().load(modelUrl,gltf=>{
 const model=gltf.scene;
 const bounds=new THREE.Box3().setFromObject(model), center=bounds.getCenter(new THREE.Vector3());
 model.position.sub(center);pivot.add(model);
 model.traverse(ob=>{if(ob.isMesh){ob.frustumCulled=false;if(ob.material){ob.material.envMapIntensity=.8;if(ob.material.transparent){ob.material.depthWrite=false;ob.renderOrder=2;}}}});
 loaded=true;state.loaded=true;loading.remove();document.body.dataset.model='ready';
},undefined,error=>{console.error(error);loading.textContent='모델을 불러오지 못했어요. 새로고침해 주세요.';document.body.dataset.model='error';});
function resize(){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 positions=anchors.map(el=>el.offsetTop);
}
resize();addEventListener('resize',resize);
function scrollProgress(){
 const y=scrollY;
 for(let i=0;i<positions.length-1;i++)if(y<positions[i+1])return i+THREE.MathUtils.clamp((y-positions[i])/(positions[i+1]-positions[i]),0,1);
 return 3;
}
function reset(){userRotation.identity();dragX=0;dragY=0;zoom=1;auto=false;document.querySelector('#zoom').value='1';document.querySelector('#spin').setAttribute('aria-pressed','false');document.querySelector('#spin').textContent='자동 회전';}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{if(!drag)return;rotate((e.clientX-drag.x)*.009,(e.clientY-drag.y)*.009);drag={x:e.clientX,y:e.clientY};});
function stop(){drag=null;canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
canvas.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'];if(!keys.includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();if(e.key==='ArrowLeft')rotate(-.15,0);if(e.key==='ArrowRight')rotate(.15,0);if(e.key==='ArrowUp')rotate(0,-.15);if(e.key==='ArrowDown')rotate(0,.15);});
document.querySelector('#reset').onclick=reset;
document.querySelector('#spin').onclick=e=>{auto=!auto;e.currentTarget.setAttribute('aria-pressed',String(auto));e.currentTarget.textContent=auto?'회전 멈추기':'자동 회전';};
document.querySelector('#zoom').oninput=e=>zoom=Number(e.target.value);
const desktop=[{x:2.2,y:-.05,r:0,z:-.12,s:1},{x:-2.3,y:-.1,r:Math.PI*.95,z:.15,s:1},{x:2.5,y:-.15,r:Math.PI*1.8,z:-.18,s:1.17},{x:0,y:-.9,r:Math.PI*2,z:0,s:.85}];
const mobile=[{x:.12,y:-1.18,r:0,z:-.08,s:.57},{x:0,y:-1,r:Math.PI*.95,z:.13,s:.61},{x:.1,y:-1.05,r:Math.PI*1.8,z:-.13,s:.66},{x:0,y:-.55,r:Math.PI*2,z:0,s:.57}];
renderer.setAnimationLoop(time=>{
 const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
 if(document.hidden)return;
 const target=scrollProgress();progress=reduced?target:THREE.MathUtils.lerp(progress,target,1-Math.exp(-dt*9));
 const i=Math.min(2,Math.floor(progress)),t=THREE.MathUtils.smoothstep(progress-i,0,1),poses=innerWidth<=700?mobile:desktop;
 const a=poses[i],b=poses[i+1],mix=k=>THREE.MathUtils.lerp(a[k],b[k],t);
 if(auto)rotate(dt*.6,0);
 pivot.position.set(mix('x'),mix('y'),0);baseRotation.setFromEuler(baseEuler.set(0,mix('r'),mix('z')));pivot.quaternion.copy(baseRotation).premultiply(userRotation);pivot.scale.setScalar(mix('s')*zoom);
 Object.assign(state,{progress,rotation:mix('r')+dragX,x:pivot.position.x,scale:pivot.scale.x});
 const chapter=Math.min(3,Math.round(target));dots.forEach((el,n)=>{el.classList.toggle('active',n===chapter);if(n===chapter)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 document.querySelector('#progress').textContent=`0${chapter+1} / 04`;
 document.querySelector('#hint').textContent=chapter===3?'DRAG TO EXPLORE ↔':'SCROLL TO DISCOVER ↓';
 if(loaded){
  // Only the bottle consumes touch drags. Swiping the surrounding page still scrolls.
  pivot.updateMatrixWorld(true);camera.updateMatrixWorld(true);hitBounds.setFromObject(pivot);
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(let j=0;j<8;j++){
   corner.set(j&1?hitBounds.max.x:hitBounds.min.x,j&2?hitBounds.max.y:hitBounds.min.y,j&4?hitBounds.max.z:hitBounds.min.z).project(camera);
   const x=(corner.x*.5+.5)*innerWidth,y=(-corner.y*.5+.5)*innerHeight;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  Object.assign(canvas.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`});
  renderer.render(scene,camera);
 }
});
}
