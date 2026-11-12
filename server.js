'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000, ROOT=path.join(__dirname,'public');
const scenes=['lobby','race','doors','world','music','chaos','finale'];
const worldNames={home:'Home Alone: Defend the House',nightmare:'Nightmare: Save the Presents',wonderful:"It's a Wonderful Life: Ring the Bells"};
const jokes=[
 ['🥔','GRAMPY ATE THE SPROUTS!','Everyone must impersonate a Brussels sprout for 5 seconds.','-5'],
 ['🥣',"NANNY OGIE’S STUFFING!",'Invent the most dramatic stuffing recipe.','+8'],
 ['🥫','THE CRANBERRY SAUCE IS MISSING!','Everyone points at their most suspicious family member.','-3'],
 ['📦','WHO HAS THE SELLOTAPE?!','Mime wrapping a present without using your hands.','+5'],
 ['🥔',"NANNY’S PRINGLES HAVE VANISHED!",'A brave volunteer must defend themselves in court.','+6'],
 ['🎁','WRAPPING PAPER ATTACK!','The family has been ambushed by festive paper. Duck!','-4'],
 ['💻','BLACKBOARD IS DOWN!','Have you tried turning Christmas off and on again?','-5'],
 ['🚨','FIRE ALARM — CAN YOU PLEASE EXIT THE BUILDING!','All animals retreat towards the imaginary exit.','-6'],
 ['🚂','POLAR EXPRESS DELAYED!','Someone must make a convincing steam-train noise.','+5'],
 ['🎄','MANDATORY CHRISTMAS FUN!','Everybody performs a 5-second festive dance.','+6'],
 ['🧀','THE CHEESE BOARD INCIDENT!','An animal stops for an emergency snack.','-2'],
 ['🎤',"DAD’S CHRISTMAS CROON-OFF!",'A willing crooner performs a dramatic festive line.','+10'],
 ['🎅','SANTA’S KEY IS IN THE MINCE PIE!','Who has eaten the evidence?','+7'],
 ['🧣','TURKISH DELIGHT CONFUSION!','Someone shouts: “You look like a Turk!”','+4']
];
const questions={
 home:[['Which item makes the best imaginary burglar trap?',['A swinging paint can','A sleepy marshmallow','A chocolate teapot'],0],['How many ghosts visit Scrooge, including Marley?',['Two','Four','Six'],1]],
 nightmare:[['Which of these is NOT one of Santa’s traditional reindeer?',['Comet','Bramble','Dancer'],1],['What is a group of singing Christmas visitors often called?',['Carol singers','Snow pirates','The Sprout Council'],0]],
 wonderful:[['What might you hear ringing at Christmas?',['A jingle bell','A bicycle horn only','A microwave'],0],['Which evergreen plant is traditionally hung for a Christmas kiss?',['Ivy','Mistletoe','Rosemary'],1]]
};
const songQuestions=[
 ['In the traditional carol “Jingle Bells”, what kind of sleigh is mentioned?',['One-horse open sleigh','Three-duck racing sleigh','A wheelbarrow'],0],
 ['Complete this public-domain carol title: “Deck the…”',['Tables','Halls','Snowmen'],1],
 ['In “The Twelve Days of Christmas”, what bird is in a pear tree?',['Partridge','Penguin','Peacock'],0],
 ['Finish the title: “Silent…”',['Night','Sleigh','Sprout'],0]
];
const buble=[
 'Michael Bublé says… croon your name like a Christmas superstar!',
 'Michael Bublé says… strike your best festive album-cover pose!',
 'Michael Bublé says… mime an enormous Christmas snowball!',
 'Sing like a reindeer! (But Bublé DID NOT say!)',
 'Michael Bublé says… dance with an imaginary Christmas pudding!',
 'Michael Bublé says… wave to your adoring imaginary audience!',
 'SPECIAL EVENT: DAD’S CHRISTMAS CROON-OFF! 🎤'
];
const rooms=new Map();
const makeRoom=(id)=>({id,scene:'lobby',round:0,stageStarted:Date.now(),players:{},spirit:35,race:{duration:30,started:0,ends:0,positions:{},winner:null,events:[]},votes:{},world:'home',quizIndex:0,answers:{},musicIndex:0,currentBuble:null,chaosIndex:0,currentChaos:null,finalMessage:'',history:[],updated:Date.now()});
function room(id){const key=String(id||'FAMILY1').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,25)||'FAMILY1';if(!rooms.has(key))rooms.set(key,makeRoom(key));return rooms.get(key)}
function send(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(data))}
function readBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>30000){reject(Error('too large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}})})}
const safe=(s,n=30)=>String(s||'').replace(/[<>]/g,'').slice(0,n);
function broadcast(r,msg){r.history.unshift({at:Date.now(),message:msg});r.history=r.history.slice(0,9);r.updated=Date.now()}
function advance(r){let i=scenes.indexOf(r.scene);if(i>=scenes.length-1)return;r.scene=scenes[i+1];r.stageStarted=Date.now();r.answers={};if(r.scene==='race'){r.race.positions={};r.race.started=0;r.race.ends=0;r.race.winner=null;r.race.events=[]}if(r.scene==='doors')r.votes={};if(r.scene==='world'){let tally={home:0,nightmare:0,wonderful:0};Object.values(r.votes).forEach(x=>{if(x in tally)tally[x]++});r.world=Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0]||'home';r.quizIndex=0}if(r.scene==='music'){r.musicIndex=0;r.currentBuble=null;}if(r.scene==='chaos'){r.chaosIndex=0;r.currentChaos=null}if(r.scene==='finale'){r.finalMessage=r.spirit>=70?'CHRISTMAS IS SAVED!':'ONE FINAL FAMILY CHALLENGE TO SAVE CHRISTMAS!'}broadcast(r,'Next chapter: '+r.scene)}
function perform(r,action,p){
 switch(action){
 case 'join':{let name=safe(p.name,24).trim()||'Festive Mystery';if(Object.keys(r.players).length>=80)throw Error('The adventure is full (80 max).');const id=crypto.randomUUID();r.players[id]={id,name,animal:safe(p.animal,12),outfit:safe(p.outfit,12),snack:safe(p.snack,12),vehicle:safe(p.vehicle,12),color:safe(p.color,12),joined:Date.now()};broadcast(r,name+' boarded the Polar Express!');return {playerId:id}}
 case 'vote':if(r.scene!=='doors')throw Error('The doors have closed.');if(!r.players[p.playerId])throw Error('Join the game first.');if(!['home','nightmare','wonderful'].includes(p.choice))throw Error('Invalid door.');r.votes[p.playerId]=p.choice;r.updated=Date.now();return {};
 case 'answer':if(!r.players[p.playerId])throw Error('Join the game first.');if(!['world','music'].includes(r.scene))throw Error('No question is open.');{let key=r.scene+'-'+(r.scene==='world'?r.quizIndex:r.musicIndex);r.answers[p.playerId]={key,choice:Number(p.choice)};r.updated=Date.now();return {}}
 case 'set-duration':r.race.duration=Math.max(10,Math.min(180,Number(p.duration)||30));r.updated=Date.now();return {};
 case 'start-race':if(r.scene!=='race'||r.race.started)throw Error('Race not ready');if(Object.keys(r.players).length<1)throw Error('Add a racer first.');r.race.started=Date.now();r.race.ends=r.race.started+r.race.duration*1000;r.race.positions=Object.fromEntries(Object.keys(r.players).map(k=>[k,0]));r.race.events=[];broadcast(r,'🏁 The Great Christmas Race has begun!');return {};
 case 'next':advance(r);return {};
 case 'previous':{let i=scenes.indexOf(r.scene);if(i>0){r.scene=scenes[i-1];r.stageStarted=Date.now();r.answers={};broadcast(r,'Returned to '+r.scene)}return {}}
 case 'score':r.spirit=Math.max(0,Math.min(100,r.spirit+Number(p.delta||0)));broadcast(r,(p.delta>0?'+':'')+p.delta+' Christmas Spirit!');return {};
 case 'reveal':{let item=r.scene==='world'?questions[r.world][r.quizIndex]:songQuestions[r.musicIndex];if(!item)throw Error('All questions completed. Open the next chapter.');let key=r.scene+'-'+(r.scene==='world'?r.quizIndex:r.musicIndex);let good=Object.values(r.answers).filter(a=>a.key===key&&a.choice===item[2]).length;let gained=Math.min(15,good*2);r.spirit=Math.min(100,r.spirit+gained);broadcast(r,good+' correct! +'+gained+' Christmas Spirit.');if(r.scene==='world')r.quizIndex=Math.min(r.quizIndex+1,questions[r.world].length);else r.musicIndex=Math.min(r.musicIndex+1,songQuestions.length);r.answers={};return {correct:item[2],count:good,gained}}
 case 'buble':r.currentBuble=buble[Math.floor(Math.random()*buble.length)];broadcast(r,r.currentBuble);return {};
 case 'chaos':{let idx=Math.floor(Math.random()*jokes.length);r.currentChaos={emoji:jokes[idx][0],title:jokes[idx][1],description:jokes[idx][2],delta:Number(jokes[idx][3])};r.spirit=Math.max(0,Math.min(100,r.spirit+r.currentChaos.delta));r.chaosIndex++;broadcast(r,r.currentChaos.title);return {}}
 case 'reset':{let fresh=makeRoom(r.id);rooms.set(r.id,fresh);return {}}
 case 'practice':{if(Object.keys(r.players).length)throw Error('Practice can only be added to an empty room.');let sample=['Nanny Ogie','Grampy','Sallie','Mr Bailey','Christmas Otter','Captain Sprout'];sample.forEach((name,i)=>{let id='practice-'+i;r.players[id]={id,name,animal:['🦦','🐌','🐱','🐶','🐸','🦌'][i],outfit:'🎅',snack:'🍪',vehicle:'🛷',color:['#d96261','#55a9ab','#f0b84e','#ad83d4','#5a93cd','#8bc788'][i]}});broadcast(r,'Practice players have arrived!');return {}}
 default:throw Error('Unknown action')
 }
}
function updateRaces(){for(let r of rooms.values()){let q=r.race;if(r.scene!=='race'||!q.started||q.winner)continue;let now=Date.now(),remain=q.ends-now,elapsed=(now-q.started)/1000;let participants=Object.keys(r.players);for(let id of participants){let current=q.positions[id]||0;let base=100/(q.duration*4)*(.78+Math.random()*.50);q.positions[id]=Math.min(99.8,current+base)}let eventPoints=[.17,.34,.51,.68,.83];eventPoints.forEach((at,i)=>{if(elapsed>=q.duration*at&&!q.events.some(e=>e.index===i)){let j=jokes[Math.floor(Math.random()*jokes.length)];let target=participants[Math.floor(Math.random()*participants.length)];if(target){let d=Math.random()>.5?7:-9;q.positions[target]=Math.max(0,Math.min(99,q.positions[target]+d));}q.events.push({index:i,at:now,emoji:j[0],title:j[1],description:j[2],playerId:target});broadcast(r,j[1])}});if(remain<=0){let winners=participants.map(id=>({id,p:q.positions[id]+Math.random()*5})).sort((a,b)=>b.p-a.p);q.winner=winners[0]?.id||null;if(q.winner){q.positions[q.winner]=100;r.spirit=Math.min(100,r.spirit+15);broadcast(r,'🏆 '+r.players[q.winner].name+' wins! +15 Christmas Spirit');}q.ends=now;r.updated=now;}}}
setInterval(updateRaces,250);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');if(url.pathname==='/api/state'){let r=room(url.searchParams.get('room'));return send(res,200,{...r,question:r.scene==='world'?questions[r.world][r.quizIndex]:r.scene==='music'?songQuestions[r.musicIndex]:null,worldName:worldNames[r.world],buble,jokesCount:jokes.length,serverTime:Date.now()})}if(url.pathname==='/api/action'&&req.method==='POST'){let p=await readBody(req),r=room(p.room),result=perform(r,p.action,p);return send(res,200,{ok:true,...result})}let requestPath=url.pathname==='/'?'/index.html':url.pathname;let file=path.resolve(ROOT,'.'+decodeURIComponent(requestPath));if(!file.startsWith(ROOT+path.sep))return send(res,403,{error:'forbidden'});fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(buf)})}catch(e){send(res,400,{error:e.message||'Something went wrong'})}});
server.listen(PORT,'0.0.0.0',()=>console.log('Christmas Catastrophe listening on '+PORT));
