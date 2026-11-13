'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000, ROOT=path.join(__dirname,'public');
const scenes=['lobby','race','doors','world','music','chaos','charades','crackers','finale'];
const worldNames={home:'Home Alone: Defend the House',nightmare:'Nightmare: Save the Presents',wonderful:"It's a Wonderful Life: Ring the Bells"};
const jokes=[
 ['🥔','GRAMPY ATE THE SPROUTS!','Everyone must impersonate a Brussels sprout for 5 seconds.','-5'],
 ['🥣',"NANNY OGIE’S STUFFING!",'Invent the most dramatic stuffing recipe.','+8'],
 ['🥫','THE CRANBERRY SAUCE IS MISSING!','Everyone points at their most suspicious family member.','-3'],
 ['📦','WHO HAS THE SELLOTAPE?!','Mime wrapping a present without using your hands.','+5'],
 ['🥔',"NANNY’S PRINGLES HAVE VANISHED!",'A brave volunteer must defend themselves in court.','+6'],
 ['🎁','WRAPPING PAPER ATTACK!','The family has been ambushed by festive paper. Duck!','-4'],
 ['🚨','FIRE ALARM — CAN YOU PLEASE EXIT THE BUILDING!','All animals retreat towards the imaginary exit.','-6'],
 ['🚂','POLAR EXPRESS DELAYED!','Someone must make a convincing steam-train noise.','+5'],
 ['🎄','MANDATORY CHRISTMAS FUN!','Everybody performs a 5-second festive dance.','+6'],
 ['🧀','THE CHEESE BOARD INCIDENT!','An animal stops for an emergency snack.','-2'],
 ['🎤',"DAD’S CHRISTMAS CROON-OFF!",'A willing crooner performs a dramatic festive line.','+10'],
 ['🎅','SANTA’S KEY IS IN THE MINCE PIE!','Who has eaten the evidence?','+7'],
 ['🧣','TURKISH DELIGHT CONFUSION!','Someone shouts: “You look like a Turk!”','+4']
];
// Each Christmas world has an expanded question bank. Questions are asked in sequence;
// the question order rotates for each new room, to provide variety on repeat plays.
const questions={
 home:[
 ['In Home Alone, where is Kevin accidentally left behind?',['New York','Chicago','London'],1],
 ['Which item is a famously troublesome Home Alone-style trap?',['A swinging paint can','A sleeping pillow','A bag of marshmallows'],0],
 ['What does Kevin use to make his house look like a party?',['Cardboard silhouettes and music','A giant inflatable penguin','A Christmas tree on wheels'],0],
 ['Which of these is traditionally hung on a front door at Christmas?',['A wreath','A swimming cap','A pancake'],0],
 ['What do you hang on the fireplace for Santa to fill?',['Stockings','Wellies','Tea towels'],0],
 ['Which sweet treat is often made into a little house?',['Gingerbread','Shortbread','Porridge'],0],
 ['How many gifts are given on day one of The Twelve Days of Christmas?',['One','Two','Twelve'],0],
 ['Which festive plant has prickly leaves and red berries?',['Holly','Daffodil','Lavender'],0],
 ['Which drink is traditionally left out for Santa in some UK homes?',['Sherry or milk','Lemon squash only','Hot soup'],0],
 ['What do people traditionally pull at a Christmas dinner in the UK?',['A cracker','A party popper only','A curtain'],0]
 ],
 nightmare:[
 ['What is the name of the Pumpkin King in The Nightmare Before Christmas?',['Jack Skellington','Sandy Claws','Oogie Boogie'],0],
 ['What holiday does Jack discover?',['Christmas','Easter','Bonfire Night'],0],
 ['Which character is a rag doll who cares for Jack?',['Sally','Cindy','Elsa'],0],
 ['What is the name Jack gives to Santa?',['Sandy Claws','Mr Frost','Captain Noel'],0],
 ['Which of these is NOT one of Santa’s traditional reindeer?',['Comet','Bramble','Dancer'],1],
 ['Who is the villain associated with a sack of bugs?',['Oogie Boogie','Zero','The Mayor'],0],
 ['What is the name of Jack’s ghostly dog?',['Zero','Rudolph','Biscuit'],0],
 ['What colour is the Grinch usually shown as?',['Green','Purple','Blue'],0],
 ['Which of these creatures traditionally pulls Santa’s sleigh?',['Reindeer','Penguins','Polar bears'],0],
 ['What do carol singers traditionally do?',['Sing seasonal songs','Deliver parcels','Make snowmen'],0]
 ],
 wonderful:[
 ['What is the name of the central character in It’s a Wonderful Life?',['George Bailey','Harry Potter','Ebenezer Scrooge'],0],
 ['What is George Bailey’s guardian angel called?',['Clarence','Gabriel','Oliver'],0],
 ['What happens when a bell rings, according to the film?',['An angel gets its wings','A reindeer takes off','Someone wins a cracker'],0],
 ['Who is the wealthy antagonist in It’s a Wonderful Life?',['Mr Potter','Mr Scrooge','Mr Snow'],0],
 ['Which evergreen plant is traditionally hung for a Christmas kiss?',['Ivy','Mistletoe','Rosemary'],1],
 ['Which city is associated with the 1946 film setting Bedford Falls?',['A fictional town','Paris','Tokyo'],0],
 ['In A Christmas Carol, who visits Scrooge first as a ghost?',['Jacob Marley','Tiny Tim','Bob Cratchit'],0],
 ['How many Spirits of Christmas visit Scrooge after Marley?',['Three','Two','Five'],0],
 ['What does the word “Noel” relate to?',['Christmas','Halloween','New Year only'],0],
 ['What item is often placed at the top of a Christmas tree?',['A star or angel','A teapot','A wellington boot'],0]
 ]
};
const songQuestions=[
 ['In the traditional song “Jingle Bells”, what kind of sleigh is mentioned?',['One-horse open sleigh','Three-duck racing sleigh','A wheelbarrow'],0],
 ['Complete this traditional carol title: “Deck the…”',['Tables','Halls','Snowmen'],1],
 ['In “The Twelve Days of Christmas”, which bird is in a pear tree?',['Partridge','Penguin','Peacock'],0],
 ['Finish this traditional carol title: “Silent…”',['Night','Sleigh','Sprout'],0],
 ['Which traditional song features a bright red-nosed reindeer?',['Rudolph the Red-Nosed Reindeer','Auld Lang Syne','Silent Night'],0],
 ['What is the name of the snowman in the animated film The Snowman?',['He has no given name','Frosty','Olaf'],0],
 ['Which band originally released the pop song “Last Christmas”?',['Wham!','Queen','ABBA'],0],
 ['Who famously recorded “White Christmas” in 1942?',['Bing Crosby','Elvis Presley','Michael Bublé'],0],
 ['Which carol asks people to come to Bethlehem?',['O Come, All Ye Faithful','Jingle Bells','We Wish You a Merry Christmas'],0],
 ['Which Christmas song title names a type of weather?',['Let It Snow!','Rockin’ Around the Christmas Tree','Feliz Navidad'],0],
 ['Which Christmas carol has a town named in its title?',['O Little Town of Bethlehem','Deck the Halls','The Holly and the Ivy'],0],
 ['Which singer is closely associated with the album Christmas released in 2011?',['Michael Bublé','Ed Sheeran','Adele'],0],
 ['What sort of instrument is mentioned in the title “Little Drummer Boy”?',['Drum','Violin','Piano'],0],
 ['Which song title is also a common festive greeting in Spanish?',['Feliz Navidad','Silent Night','Sleigh Ride'],0],
 ['Which group released “Merry Xmas Everybody” in 1973?',['Slade','The Beatles','Take That'],0],
 ['In the carol “Good King Wenceslas”, what feast day is mentioned?',['Stephen','Valentine','Patrick'],0],
 ['Which Christmas song was written by José Feliciano?',['Feliz Navidad','Jingle Bell Rock','The Christmas Song'],0],
 ['Who sang the original version of “Rockin’ Around the Christmas Tree”?',['Brenda Lee','Mariah Carey','Dolly Parton'],0]
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
const charadePrompts=[
 'A reindeer trying to use a photocopier', 'Nanny Ogie making her famous stuffing',
 'Santa stuck in a chimney', 'Michael Bublé performing in a snowstorm',
 'Grampy discovering the sprouts are missing', 'A penguin wrapping a gigantic present',
 'Someone searching for the missing sellotape', 'A snail winning a Christmas race',
 'The Polar Express running out of steam', 'A cat decorating a Christmas tree',
 'Someone hearing the fire alarm halfway through Christmas dinner',
 'A Christmas pudding attempting to escape', 'A snowman learning to dance',
 'Someone trying to open a very stubborn Christmas cracker'
];
const crackerJokes=[
 ['Why did the snowman look through the carrots?','He was picking his nose!'],
 ['What do you call a reindeer with bad manners?','Rude-olph!'],
 ['Why did the Christmas tree go to the barber?','It needed a trim!'],
 ['What do you call an old snowman?','Water!'],
 ['What do elves learn in school?','The elf-abet!'],
 ['Why was the turkey in the band?','Because it had the drumsticks!'],
 ['What do snowmen eat for breakfast?','Frosted flakes!'],
 ['What do you call a cat on the beach at Christmas?','Sandy Claws!'],
 ['Why was the Christmas cracker so pleased?','It was a smashing success!'],
 ['What do you call Santa when he takes a break?','Santa Pause!'],
 ['Why did the ornament go to school?','To become a little brighter!'],
 ['What did the gingerbread man put on his bed?','A cookie sheet!']
];
const rooms=new Map();
const makeRoom=(id)=>({id,scene:'lobby',round:0,stageStarted:Date.now(),players:{},spirit:35,race:{duration:30,started:0,ends:0,positions:{},winner:null,events:[]},votes:{},world:'home',quizIndex:0,answers:{},musicIndex:0,currentBuble:null,chaosIndex:0,currentChaos:null,charades:{actor:null,actorName:null,prompt:null,started:0,round:0},crackers:{first:null,second:null,setup:null,punchline:null,revealed:false,round:0},finalMessage:'',history:[],updated:Date.now()});
function room(id){const key=String(id||'FAMILY1').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,25)||'FAMILY1';if(!rooms.has(key))rooms.set(key,makeRoom(key));return rooms.get(key)}
function send(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(data))}
function readBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>30000){reject(Error('too large'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}})})}
const safe=(s,n=30)=>String(s||'').replace(/[<>]/g,'').slice(0,n);
function broadcast(r,msg){r.history.unshift({at:Date.now(),message:msg});r.history=r.history.slice(0,9);r.updated=Date.now()}
function advance(r){let i=scenes.indexOf(r.scene);if(i>=scenes.length-1)return;r.scene=scenes[i+1];r.stageStarted=Date.now();r.answers={};if(r.scene==='race'){r.race.positions={};r.race.started=0;r.race.ends=0;r.race.winner=null;r.race.events=[]}if(r.scene==='doors')r.votes={};if(r.scene==='world'){let tally={home:0,nightmare:0,wonderful:0};Object.values(r.votes).forEach(x=>{if(x in tally)tally[x]++});r.world=Object.keys(tally).sort((a,b)=>tally[b]-tally[a])[0]||'home';r.quizIndex=0}if(r.scene==='music'){r.musicIndex=0;r.currentBuble=null;}if(r.scene==='chaos'){r.chaosIndex=0;r.currentChaos=null}if(r.scene==='charades')r.charades={actor:null,actorName:null,prompt:null,started:0,round:0};if(r.scene==='crackers')r.crackers={first:null,second:null,setup:null,punchline:null,revealed:false,round:0};if(r.scene==='finale'){r.finalMessage=r.spirit>=70?'CHRISTMAS IS SAVED!':'ONE FINAL FAMILY CHALLENGE TO SAVE CHRISTMAS!'}broadcast(r,'Next chapter: '+r.scene)}
function perform(r,action,p){
 switch(action){
 case 'join':{let primary=safe(p.name,24).trim()||'Festive Mystery';let partner=p.paired?safe(p.partner,24).trim():'';if(p.paired&&!partner)throw Error('Please add the second person’s name.');if(partner.toLowerCase()===primary.toLowerCase())throw Error('Please use two different names for your pair.');let name=partner?primary+' & '+partner:primary;if(Object.keys(r.players).length>=80)throw Error('The adventure is full (80 max).');const id=crypto.randomUUID();r.players[id]={id,name,members:partner?[primary,partner]:[primary],animal:safe(p.animal,12),outfit:safe(p.outfit,12),snack:safe(p.snack,12),vehicle:safe(p.vehicle,12),color:safe(p.color,12),joined:Date.now()};broadcast(r,name+' boarded the Polar Express!');return {playerId:id}}
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
 case 'charade-pick':{
  if(r.scene!=='charades')throw Error('Not at charades yet.');
  let ids=Object.keys(r.players);if(!ids.length)throw Error('No family players have joined.');
  let previous=r.charades.actor;
  let eligible=ids.length>1?ids.filter(id=>id!==previous):ids;
  let actor=eligible[Math.floor(Math.random()*eligible.length)];
  let actorName=(r.players[actor].members||[r.players[actor].name])[Math.floor(Math.random()*(r.players[actor].members||[r.players[actor].name]).length)];
  let prompt=charadePrompts[Math.floor(Math.random()*charadePrompts.length)];
  r.charades={actor,actorName,prompt,started:Date.now(),round:r.charades.round+1};
  broadcast(r,'🎭 '+actorName+' has been chosen for charades!');return {};
 }
 case 'charade-score':{
  if(r.scene!=='charades'||!r.charades.actor)throw Error('Pick a charades player first.');
  r.spirit=Math.min(100,r.spirit+8);broadcast(r,'🎭 Charades solved! +8 Christmas Spirit');return {};
 }
 case 'cracker-pull':{
  if(r.scene!=='crackers')throw Error('Not at crackers yet.');
  let ids=Object.keys(r.players);if(!ids.length)throw Error('No family players have joined.');
  let first=ids[Math.floor(Math.random()*ids.length)];
  let other=ids.filter(id=>id!==first);
  let second=other.length?other[Math.floor(Math.random()*other.length)]:first;
  let joke=crackerJokes[Math.floor(Math.random()*crackerJokes.length)];
  r.crackers={first,second,setup:joke[0],punchline:joke[1],revealed:false,round:r.crackers.round+1};
  broadcast(r,'🧨 '+r.players[first].name+' and '+r.players[second].name+' pulled a cracker!');return {};
 }
 case 'cracker-reveal':{
  if(r.scene!=='crackers'||!r.crackers.setup)throw Error('Pull a cracker first.');
  if(!r.crackers.revealed){r.crackers.revealed=true;r.spirit=Math.min(100,r.spirit+5);broadcast(r,'😂 Christmas cracker punchline revealed! +5 Spirit');}return {};
 }
 case 'reset':{let fresh=makeRoom(r.id);rooms.set(r.id,fresh);return {}}
 case 'practice':{if(Object.keys(r.players).length)throw Error('Practice can only be added to an empty room.');let sample=['Nanny Ogie','Grampy','Sallie','Mr Bailey','Christmas Otter','Captain Sprout'];sample.forEach((name,i)=>{let id='practice-'+i;r.players[id]={id,name,members:partner?[primary,partner]:[primary],animal:['🦦','🐌','🐱','🐶','🐸','🦌'][i],outfit:'🎅',snack:'🍪',vehicle:'🛷',color:['#d96261','#55a9ab','#f0b84e','#ad83d4','#5a93cd','#8bc788'][i]}});broadcast(r,'Practice players have arrived!');return {}}
 default:throw Error('Unknown action')
 }
}
function updateRaces(){for(let r of rooms.values()){let q=r.race;if(r.scene!=='race'||!q.started||q.winner)continue;let now=Date.now(),remain=q.ends-now,elapsed=(now-q.started)/1000;let participants=Object.keys(r.players);for(let id of participants){let current=q.positions[id]||0;let base=100/(q.duration*4)*(.78+Math.random()*.50);q.positions[id]=Math.min(99.8,current+base)}let eventPoints=[.17,.34,.51,.68,.83];eventPoints.forEach((at,i)=>{if(elapsed>=q.duration*at&&!q.events.some(e=>e.index===i)){let j=jokes[Math.floor(Math.random()*jokes.length)];let target=participants[Math.floor(Math.random()*participants.length)];if(target){let d=Math.random()>.5?7:-9;q.positions[target]=Math.max(0,Math.min(99,q.positions[target]+d));}q.events.push({index:i,at:now,emoji:j[0],title:j[1],description:j[2],playerId:target});broadcast(r,j[1])}});if(remain<=0){let winners=participants.map(id=>({id,p:q.positions[id]+Math.random()*5})).sort((a,b)=>b.p-a.p);q.winner=winners[0]?.id||null;if(q.winner){q.positions[q.winner]=100;r.spirit=Math.min(100,r.spirit+15);broadcast(r,'🏆 '+r.players[q.winner].name+' wins! +15 Christmas Spirit');}q.ends=now;r.updated=now;}}}
setInterval(updateRaces,250);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');if(url.pathname==='/api/state'){let r=room(url.searchParams.get('room'));let pid=url.searchParams.get('playerId');let charades={...r.charades,prompt:pid&&pid===r.charades.actor?r.charades.prompt:null};return send(res,200,{...r,charades,question:r.scene==='world'?questions[r.world][r.quizIndex]:r.scene==='music'?songQuestions[r.musicIndex]:null,worldName:worldNames[r.world],buble,jokesCount:jokes.length,serverTime:Date.now()})}if(url.pathname==='/api/action'&&req.method==='POST'){let p=await readBody(req),r=room(p.room),result=perform(r,p.action,p);return send(res,200,{ok:true,...result})}let requestPath=url.pathname==='/'?'/index.html':url.pathname;let file=path.resolve(ROOT,'.'+decodeURIComponent(requestPath));if(!file.startsWith(ROOT+path.sep))return send(res,403,{error:'forbidden'});fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(buf)})}catch(e){send(res,400,{error:e.message||'Something went wrong'})}});
server.listen(PORT,'0.0.0.0',()=>console.log('Christmas Catastrophe listening on '+PORT));
