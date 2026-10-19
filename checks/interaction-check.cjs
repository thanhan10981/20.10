// Dependency-free logic checks. This is a DOM simulation, not a browser/layout test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../_20_10.html'),'utf8');
assert.match(html,/id="finish-writing"[^>]*>Hiện toàn bộ lời chúc <span aria-hidden="true">↗<\/span>/,'Vietnamese button text remains valid UTF-8');
const pending=new Set();
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={removeProperty(k){delete this[k];},setProperty(k,v){this[k]=v;}};this.hidden=false;this.attrs={};this.events={};this.textContent='';this.className='';this.classes=new Set();this.classList={add:(s)=>this.classes.add(s),remove:(s)=>this.classes.delete(s)};}
 append(...children){this.children.push(...children);} replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,fn){this.events[k]=fn;}focus(){document.activeElement=this;}select(){}
 remove(){this.removed=true;}click(){this.events.click?.();}
 get childElementCount(){return this.children.filter(c=>typeof c==='object'&&!c.removed).length;}
 querySelector(selector){return selector==='.seal'?new Element():null;}
 getBoundingClientRect(){return {left:30,top:100,width:390,height:700};}
 querySelectorAll(selector){const out=[];function visit(node){for(const c of node.children){if(typeof c!=='object')continue;if(selector==='.char'&&c.className==='char')out.push(c);visit(c);}}visit(this);return out;}
 animate(){let resolve,reject;const a={playState:'running',finished:new Promise((r,j)=>{resolve=r;reject=j;}),pause(){this.playState='paused';},play(){this.playState='running';},cancel(){pending.delete(this);reject(Error('cancelled'));},finish(){pending.delete(this);this.playState='finished';resolve();}};pending.add(a);return a;}
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique IDs');
const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
for(const id of ['journey','letter','envelope-wrap','music','share-fallback'])elements[id].hidden=true;
const brand=new Element();brand.firstChild={textContent:''};const footerBrand=new Element();
const body=new Element('body');
const document={body,hidden:false,activeElement:null,getElementById:id=>elements[id],createElement:tag=>new Element(tag),querySelector:selector=>selector==='[data-brand]'?brand:selector==='[data-footer-brand]'?footerBrand:null,querySelectorAll:()=>[],addEventListener(k,fn){this[k]=fn;},title:'',execCommand:()=>false};
class Audio{constructor(){this.volume=0;}getAttribute(){return this.src;}play(){return Promise.reject(Object.assign(Error('missing'),{name:'NotSupportedError'}));}pause(){}}
const motion={matches:false,addEventListener(){}};
const sandbox={document,Element,Audio,matchMedia:()=>motion,window:{scrollTo(){},addEventListener(){},isSecureContext:false},navigator:{},location:{protocol:'file:'},getComputedStyle:()=>({fontSize:'40px',fontStyle:'normal'}),setTimeout:()=>1,clearTimeout(){},cancelAnimationFrame(){},requestAnimationFrame:()=>1,performance:{now:()=>0},console,Blob,URL};
vm.createContext(sandbox);
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source.replace('populate();Motion.init();','populate();Motion.init();globalThis.__motion=Motion;globalThis.__rain=FlowerRain;globalThis.__writer=Typewriter;globalThis.__formation=RoseFormation;')).runInContext(sandbox);
const tick=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
async function click(id){elements[id].click();await tick();}
async function finishAll(){for(let i=0;i<20&&pending.size;i++){for(const a of [...pending])if(a.playState==='running')a.finish();await tick();}}
(async()=>{
 const coverLayer=body.children.find(c=>c.className==='cover-petal-layer');assert.ok(coverLayer&&!coverLayer.hidden,'peach petals visible on initial page');assert.equal(coverLayer.childElementCount,38,'mobile cover petal budget');
 await finishAll();
 assert.equal(elements.message.children.length,4,'four readable paragraphs');assert.match(elements.company.textContent,/HOÀNG PHÁT/);
 await click('open');assert.equal(coverLayer.hidden,true,'cover petals stop when opening');assert.equal(coverLayer.childElementCount,0,'cover petal nodes cleaned');assert.equal(elements.cover.hidden,true);assert.equal(elements.journey.hidden,false);assert.ok(pending.size>20,'letter flights created');
 document.hidden=true;document.visibilitychange();assert.ok([...pending].every(a=>a.playState==='paused'),'hidden tab pauses flights');
 document.hidden=false;document.visibilitychange();assert.ok([...pending].every(a=>a.playState==='running'),'visible tab resumes flights');
 await click('skip');assert.equal(elements.letter.hidden,false);assert.equal(elements['fly-layer'].children.length,0,'skip removes flights');await finishAll();assert.equal(pending.size,0,'letter effects settle');assert.equal(document.activeElement,elements['letter-title']);
 await click('replay');assert.equal(coverLayer.childElementCount,38,'cover rain returns without accumulating petals');assert.equal(elements.cover.hidden,false);assert.equal(elements.letter.hidden,true);assert.equal(document.activeElement,elements.open);
 await click('open');await finishAll();assert.equal(elements.letter.hidden,false,'full assembly and envelope reach letter');assert.equal(pending.size,0,'no perpetual animation loop');
 for(let i=0;i<5;i++){await click('replay');await click('open');await click('skip');await finishAll();assert.equal(pending.size,0,'replay leaves no stale animations');}
 sandbox.__motion.burst(100,100,100);const petalLayer=body.children[0];assert.equal(petalLayer.childElementCount,36,'petal count is capped');sandbox.__motion.burst(100,100,100);assert.equal(petalLayer.childElementCount,36,'repeated taps cannot exceed cap');await finishAll();assert.equal(petalLayer.childElementCount,0,'petals removed after effect');
 await click('share');assert.equal(elements['share-fallback'].hidden,false);assert.match(elements['share-text'].value,/Nhân ngày Phụ nữ Việt Nam/,'manual share fallback contains full copy');
 await click('replay');motion.matches=true;await click('open');assert.equal(elements.letter.hidden,false,'reduced motion opens immediately');assert.equal(pending.size,0);
 sandbox.__motion.burst(100,100);assert.equal(petalLayer.childElementCount,0,'reduced motion disables touch effects');
 assert.equal(elements.music.attrs['aria-pressed'],'false','missing music fails gracefully');
 // Exercise the canvas engine with a drawing stub and a controlled frame clock.
 let draws=0,rafID=0;const frames=new Map();
 const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),drawImage(){draws++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 Element.prototype.getContext=()=>context;
 sandbox.requestAnimationFrame=fn=>{frames.set(++rafID,fn);return rafID;};sandbox.cancelAnimationFrame=id=>frames.delete(id);
 Object.assign(sandbox.window,{innerWidth:390,innerHeight:844,devicePixelRatio:2});motion.matches=false;
 const advance=time=>{const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(time));};
 const originalRecipient=elements.recipient.textContent,originalBody=elements.message.children.map(p=>p.textContent);
 sandbox.__writer.start();assert.equal(elements['finish-writing'].hidden,false,'typing starts automatically');assert.equal(elements.recipient.children[1].textContent,'','ink starts empty');
 advance(16);advance(32);for(let t=48;t<900;t+=16)advance(t);assert.ok(elements.recipient.children[1].textContent.length>0,'characters advance');
 document.hidden=true;sandbox.__writer.visibility();assert.equal(frames.size,0,'typing pauses in hidden tab');document.hidden=false;sandbox.__writer.visibility();assert.equal(frames.size,1,'typing resumes once');
 for(let t=1000;t<40000;t+=16)advance(t);assert.equal(frames.size,0,'typing finishes its frame loop');assert.equal(elements['finish-writing'].hidden,true);assert.equal(elements.recipient.textContent,originalRecipient);assert.deepEqual(elements.message.children.map(p=>p.textContent),originalBody,'full Vietnamese copy preserved');
 sandbox.__writer.start();await click('finish-writing');assert.equal(frames.size,0,'show all cancels typing');assert.equal(elements['finish-writing'].hidden,true);
 for(let i=0;i<5;i++){sandbox.__writer.start();sandbox.__writer.start();assert.equal(frames.size,1,'restarting typing retains one loop');sandbox.__writer.finish();assert.equal(frames.size,0);}
 motion.matches=true;sandbox.__writer.start();assert.equal(frames.size,0,'reduced motion shows full copy');motion.matches=false;
 sandbox.__rain.start();const rainCanvas=body.children.find(c=>c.className==='flower-rain');assert.ok(rainCanvas&&!rainCanvas.hidden,'opening starts canvas rain');assert.equal(frames.size,1,'one rain loop');
 advance(16);assert.equal(draws,115,'mobile population stays within configured budget');
 document.hidden=true;sandbox.__rain.visibility();assert.equal(frames.size,0,'rain frame stops in hidden tab');document.hidden=false;sandbox.__rain.visibility();assert.equal(frames.size,1,'single loop resumes');
 advance(32);sandbox.__rain.calm();for(let t=48;t<4000;t+=16)advance(t);assert.equal(frames.size,0,'rain fades out and stops');assert.equal(rainCanvas.hidden,true,'finished canvas hidden');
 for(let i=0;i<5;i++){sandbox.__rain.start();assert.equal(frames.size,1,'restart keeps one loop');sandbox.__rain.stop();assert.equal(frames.size,0,'stop clears frame');}
 motion.matches=true;sandbox.__rain.start();assert.equal(frames.size,0,'reduced motion prevents rain');
 // A synthetic text mask tests formation lifecycle; it does not validate typography pixels.
 motion.matches=false;context.measureText=()=>({width:100});context.getImageData=(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(255)});
 let formed=false;const formation=sandbox.__formation.play().then(result=>{formed=result;});assert.equal(frames.size,1,'formation owns one loop');
 advance(16);assert.equal(formed,false,'formation does not finish before flowers gather');
 document.hidden=true;sandbox.__formation.visibility();assert.equal(frames.size,0,'formation pauses');document.hidden=false;sandbox.__formation.visibility();assert.equal(frames.size,1,'formation resumes once');
 for(let t=32;t<7200;t+=16)advance(t);await formation;assert.equal(formed,true,'swirl, gather, hold and release complete');assert.equal(frames.size,0,'formation loop is finite');
 const interrupted=sandbox.__formation.play();sandbox.__formation.stop();assert.equal(await interrupted,false,'skip cancels formation promise');assert.equal(frames.size,0);
 await click('replay');await click('open');assert.equal(elements.letter.hidden,true,'letter waits for flower formation');assert.equal(elements['envelope-wrap'].hidden,true,'envelope waits for flower formation');
 for(let t=16;t<7200;t+=16)advance(t);await tick();await finishAll();assert.equal(elements.letter.hidden,false,'formation transitions through envelope to typed letter');
 await click('replay');assert.equal(frames.size,0,'replay cleans rain, formation and typewriter loops');
 console.log('PASS: syntax, unique IDs, full copy, assembly/envelope, skip, five replays, focus, visibility pause/resume, share fallback, reduced motion, missing music, petal cap and cleanup.');
 console.log('PASS: canvas rain population, single frame loop, tab pause/resume, fade completion, five restarts and reduced motion.');
 console.log('PASS: automatic typing, incremental characters, full copy preservation, pause/resume, show all, restart cleanup and reduced motion.');
 console.log('PASS: rose formation timing, pause/resume, cancellation, envelope sequencing and replay cleanup with a synthetic mask.');
 console.log('PASS: peach petals present on first page, stop and clean up on opening, return on replay within budget.');
 console.log('NOT VERIFIED: real browser layout, font rendering, PNG pixels, physical iOS/Android, actual MP3 playback.');
})().catch(e=>{console.error(e);process.exitCode=1;});
