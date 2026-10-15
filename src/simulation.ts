export type Tyre="SOFT"|"MEDIUM"|"HARD";
export type Pace="CONSERVE"|"BALANCED"|"PUSH";
export type RaceStatus="ready"|"running"|"paused"|"finished"|"gameover";
export type GameMode="championship"|"endless";
import{RIVAL_STYLE_BY_TEAM,type RivalStyle,rivalPaceFactor,rivalWearFactor,rivalConditionFactor}from "./rivals";
export const CAMPAIGN_LENGTH=20;
export const POINTS_BY_POSITION=[25,18,15,12,10,8,6,4,2,1]as const;
export type UpgradeType="aero"|"power"|"suspension"|"reliability";
export type RunTrait="tyre-saver"|"pit-crew"|"risk-reward"|"sponsor-network"|"reliability-first";
export interface UpgradeModules{aero:number;power:number;suspension:number;reliability:number;}
export interface InstalledUpgrade{id:string;title:string;subtitle:string;rarity:UpgradeRarity;effect:string;upgradeType?:UpgradeType;amount?:number;cashBonus?:number;trait?:RunTrait;}
export function buildSynergies(modules:UpgradeModules):string[]{
const active:string[]=[];
if(modules.aero>=2&&modules.power>=2)active.push("AERO + POWER INTEGRATION");
if(modules.suspension>=2&&modules.reliability>=2)active.push("ENDURANCE PLATFORM");
return active;
}
export type UpgradeRarity="COMMON"|"RARE"|"EPIC";
export interface UpgradeCard{
id:string;
title:string;
subtitle:string;
rarity:UpgradeRarity;
description:string;
effect:string;
upgradeType?:UpgradeType;
amount?:number;
cashBonus?:number;
trait?:RunTrait;
buildPath?:string;
}
const UPGRADE_CARD_POOL:UpgradeCard[]=[
{id:"front-wing",title:"Reprofiled Front Wing",subtitle:"AERO PACKAGE",rarity:"COMMON",description:"A cleaner front-wing profile gives the drivers more confidence through medium-speed corners.",effect:"Aerodynamics +1",upgradeType:"aero",amount:1},
{id:"floor-edge",title:"Revised Floor Edge",subtitle:"AERO PACKAGE",rarity:"RARE",description:"A more stable underfloor platform unlocks a bigger step in cornering performance.",effect:"Aerodynamics +2",upgradeType:"aero",amount:2},
{id:"active-flow",title:"Active Flow Concept",subtitle:"AERO PACKAGE",rarity:"EPIC",description:"A breakthrough airflow concept delivers an unusually large aerodynamic gain.",effect:"Aerodynamics +3",upgradeType:"aero",amount:3},
{id:"energy-map",title:"Aggressive Energy Map",subtitle:"POWER UNIT",rarity:"COMMON",description:"Revised deployment gives the car a stronger launch and better acceleration.",effect:"Power unit +1",upgradeType:"power",amount:1},
{id:"combustion",title:"Combustion Breakthrough",subtitle:"POWER UNIT",rarity:"RARE",description:"A promising combustion and deployment package adds a meaningful pace advantage.",effect:"Power unit +2",upgradeType:"power",amount:2},
{id:"hybrid-leap",title:"Hybrid System Leap",subtitle:"POWER UNIT",rarity:"EPIC",description:"A major hybrid deployment discovery creates a substantial performance step.",effect:"Power unit +3",upgradeType:"power",amount:3},
{id:"suspension-geometry",title:"Revised Suspension Geometry",subtitle:"MECHANICAL GRIP",rarity:"COMMON",description:"A revised kinematic setup helps keep the tyres in their working window.",effect:"Suspension +1",upgradeType:"suspension",amount:1},
{id:"tyre-whisperer",title:"Tyre Whisperer Programme",subtitle:"MECHANICAL GRIP",rarity:"RARE",description:"Long-run analysis reveals a setup that is kinder to the tyres over a stint.",effect:"Suspension +2",upgradeType:"suspension",amount:2},
{id:"compliance-test",title:"Endurance Test Rig",subtitle:"RELIABILITY",rarity:"COMMON",description:"More rigorous component testing catches weaknesses before they become race-day problems.",effect:"Reliability +1",upgradeType:"reliability",amount:1},
{id:"cooling-loop",title:"Advanced Cooling Loop",subtitle:"RELIABILITY",rarity:"RARE",description:"Improved thermal management protects the car through long, demanding race stints.",effect:"Reliability +2",upgradeType:"reliability",amount:2},
{id:"sponsor-windfall",title:"Sponsor Performance Bonus",subtitle:"COMMERCIAL WIN",rarity:"COMMON",description:"A sponsor rewards the team for completing the weekend and delivering useful exposure.",effect:"+RM250,000 team funds",cashBonus:250000},
{id:"technical-partner",title:"Technical Partner Windfall",subtitle:"COMMERCIAL WIN",rarity:"RARE",description:"A technical partner offers extra funding after seeing the team's development potential.",effect:"+RM450,000 team funds",cashBonus:450000},
{id:"long-run-programme",title:"Long-Run Tyre Programme",subtitle:"ENDURANCE BUILD",rarity:"RARE",description:"Trade headline pace for tyre life and more flexible stints.",effect:"Tyre wear −15% for the whole run",trait:"tyre-saver",buildPath:"endurance"},
{id:"rapid-pit-drills",title:"Rapid Pit-Crew Drills",subtitle:"OPERATIONS BUILD",rarity:"COMMON",description:"Repeated crew rehearsals shave precious time from every stop.",effect:"Your pit stops take half as long",trait:"pit-crew",buildPath:"operations"},
{id:"edge-of-grip",title:"Edge-of-Grip Package",subtitle:"HIGH-RISK BUILD",rarity:"EPIC",description:"Extract more lap time, but stressed components wear faster and incidents hurt more.",effect:"Lap pace +1.5% · component wear increased",trait:"risk-reward",buildPath:"high-risk"},
{id:"sponsor-relations",title:"Paddock Sponsor Network",subtitle:"COMMERCIAL BUILD",rarity:"RARE",description:"Turn race weekends into better sponsor returns rather than outright pace.",effect:"+RM120,000 prize bonus after each race",trait:"sponsor-network",buildPath:"sponsor-network"},
{id:"bulletproof-process",title:"Bulletproof Reliability Process",subtitle:"SURVIVAL BUILD",rarity:"RARE",description:"Limit damage and component wear at the cost of a little outright speed.",effect:"Component wear and incident damage reduced · pace −0.3%",trait:"reliability-first",buildPath:"reliability-first"},
];
export function draftUpgradeCards(state:RaceState):UpgradeCard[]{
const pool=[...UPGRADE_CARD_POOL];
let seed=(state.seed ^ Math.imul(state.weekendNumber+17,2654435761))>>>0;
const nextRandom=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed / 4294967296;};
for(let i=pool.length - 1;i>0;i--){
const j=Math.floor(nextRandom()*(i+1));
[pool[i],pool[j]]=[pool[j],pool[i]];
}
const selected:UpgradeCard[]=[];
const categories=new Set<string>();
for(const card of pool){
const category=card.buildPath??card.upgradeType??"commercial";
if(selected.length<3&&!categories.has(category)){selected.push(card);categories.add(category);}
}
for(const card of pool)if(selected.length<3&&!selected.some((item)=>item.id===card.id))selected.push(card);
return selected;
}
export interface DriverProfile{
id:string;
name:string;
role:string;
pace:number;
racecraft:number;
tyreManagement:number;
consistency:number;
potential:number;
color:string;
}
export const DRIVER_MARKET:DriverProfile[]=[
{id:"alex-mercer",name:"Luca Moretti",role:"ALL-ROUNDER",pace:86,racecraft:82,tyreManagement:79,consistency:83,potential:87,color:"#f04438"},
{id:"mika-tanaka",name:"Emil Novak",role:"TYRE SPECIALIST",pace:82,racecraft:80,tyreManagement:91,consistency:86,potential:89,color:"#48a9a6"},
{id:"leo-varga",name:"Theo Laurent",role:"QUALIFYING ACE",pace:93,racecraft:77,tyreManagement:72,consistency:78,potential:90,color:"#e4b45c"},
{id:"amara-okafor",name:"Mateo Silva",role:"RACECRAFT EXPERT",pace:83,racecraft:94,tyreManagement:84,consistency:81,potential:92,color:"#8b7cf6"},
{id:"ines-navarro",name:"Soren Lind",role:"CONSISTENCY",pace:81,racecraft:82,tyreManagement:88,consistency:94,potential:86,color:"#6d9dfc"},
{id:"kai-watanabe",name:"Kenji Arata",role:"YOUNG PROSPECT",pace:79,racecraft:78,tyreManagement:80,consistency:76,potential:97,color:"#f36b8b"},
{id:"rafael-costa",name:"Rafael Costa",role:"VETERAN",pace:85,racecraft:88,tyreManagement:83,consistency:90,potential:81,color:"#5f9d63"},
{id:"chloe-martin",name:"Adrian Keller",role:"BALANCED PACKAGE",pace:84,racecraft:84,tyreManagement:84,consistency:84,potential:88,color:"#ad8bf4"},
];
export interface CarState{
id:string;
driver:string;
driverPace:number;
driverRacecraft:number;
driverTyreManagement:number;
driverConsistency:number;
driverPotential:number;
team:string;
teamColor:string;
playerCar:boolean;
rivalStyle?:RivalStyle;
progress:number;
lapTime:number;
tyre:Tyre;
nextTyre:Tyre;
tyreWear:number;
fuel:number;
pace:Pace;
pitLap:number;
pitStops:number;
pitDelay:number;
condition:number;
lastLap:number;
bestLap:number;
finishTime:number|null;
finished:boolean;
}
export interface RaceEvent{id:number;lap:number;message:string;kind:"info"|"pit"|"battle"|"warning"|"finish";}
export interface PaddockChoice{id:string;label:string;description:string;cashDelta:number;moraleDelta:number;reputationDelta:number;}
export interface PaddockEvent{id:string;category:"FIA PROTEST"|"PADDOCK POLITICS"|"TEAM DRAMA"|"COMMERCIAL";title:string;source:string;story:string;choices:PaddockChoice[];}
export interface DriverContract{id:string;driverName:string;salaryPerRace:number;expiresAtRound:number;renewed:boolean;loyalty:number;}
export interface RaceState{
version:1;
mode?:GameMode;
status:RaceStatus;
lap:number;
totalLaps:number;
elapsedSeconds:number;
seed:number;
eventSequence:number;
cars:CarState[];
events:RaceEvent[];
cash:number;
upgradeLevel:number;
upgradeModules:UpgradeModules;
installedUpgrades?:InstalledUpgrade[];
buildTraits?:RunTrait[];
permanentPerks?:Record<string,number>;
weekendNumber:number;
teamPoints?:Record<string,number>;
rivalryWins?:Record<string,number>;
rivalryBattles?:Record<string,number>;
raceDramaLap?:number;
raceDramaTriggered?:boolean;
playerTeamName?:string;
playerPrincipalName?:string;
playerTeamColor?:string;
playerTeamSecondaryColor?:string;
circuitSeed?:number;
circuitName?:string;
circuitLengthFactor?:number;
safetyCarTicks?:number;
safetyCarActive?:boolean;
incidentCount?:number;
teamMorale?:number;
teamReputation?:number;
pendingPaddockEvent?:PaddockEvent|null;
paddockEventRound?:number;
resolvedPaddockEvents?:string[];
driverContracts?:DriverContract[];
endReason?:"bankruptcy"|"championship";
lastOperatingCost?:number;
lastSponsorIncome?:number;
}
const TYRE_PACE_FACTOR:Record<Tyre,number>={SOFT:0.985,MEDIUM:1,HARD:1.018};
const TYRE_WEAR_RATE:Record<Tyre,number>={SOFT:1.4,MEDIUM:1,HARD:0.72};
const PACE_FACTOR:Record<Pace,number>={CONSERVE:1.018,BALANCED:1,PUSH:0.982};
function random(state:RaceState):number{
state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0;
return state.seed / 4294967296;
}
function addEvent(state:RaceState,message:string,kind:RaceEvent["kind"]="info"){
state.events.unshift({id:++state.eventSequence,lap:Math.min(state.lap,state.totalLaps),message,kind});
state.events=state.events.slice(0,14);
}
function makeCar(id:string,driver:string,team:string,teamColor:string,playerCar:boolean,progress:number,n:number,profile?:DriverProfile):CarState{
const fallbackStats={pace:76+(n*7 % 13),racecraft:75+(n*5 % 15),tyreManagement:74+(n*3 % 16),consistency:75+(n*11 % 14),potential:78+(n*9 % 18)};
const stats=profile??fallbackStats;
return{
id,driver,driverPace:stats.pace,driverRacecraft:stats.racecraft,driverTyreManagement:stats.tyreManagement,driverConsistency:stats.consistency,driverPotential:stats.potential,team,teamColor,playerCar,progress,lapTime:91.4+n*0.11 -(stats.pace - 80)*0.045,
tyre:n % 3===0?"SOFT":n % 3===1?"MEDIUM":"HARD",
nextTyre:n % 3===0?"MEDIUM":"HARD",
tyreWear:0.04+n*0.012,fuel:100,pace:"BALANCED",pitLap:playerCar?7:6+n % 4,
pitStops:0,pitDelay:0,condition:100,lastLap:0,bestLap:0,finishTime:null,finished:false,
};
}
export function createRace(seed=8241,upgradeLevel=0,cash=2500000,weekendNumber=1,playerTeamName="Redline GP",firstDriverName="Alex Mercer",secondDriverName="Mika Tanaka",playerPrincipalName="Team Principal",mode:GameMode="championship"):RaceState{
const safeTeamName=playerTeamName.trim().slice(0,24)||"Redline GP";
const circuitSeed=(seed ^ Math.imul(weekendNumber+37,2246822519))>>>0;
const circuitNames=["Copperhead Ring","Monsoon Park","Granite Valley","Nightfall Circuit","Cobalt Coast","Redwood Raceway","Sundown Autodrome","Ironclad Park","Tempest Circuit","Silver Basin","Emberstone GP","Highland Loop","Mirage International","Blackstone Raceway","Aurora Park","Thunder Ridge","Mariner Circuit","Crimson Dunes","Summit Ring","Neon Harbour"];
const circuitName=circuitNames[(circuitSeed>>>8)% circuitNames.length];
const circuitLengthFactor=0.94+((circuitSeed>>>16)% 1200)/ 10000;
const state:RaceState={version:1,mode,status:"ready",lap:1,totalLaps:18,elapsedSeconds:0,seed,eventSequence:0,cash,upgradeLevel,upgradeModules:{aero:0,power:0,suspension:0,reliability:0},buildTraits:[],weekendNumber,playerTeamName:safeTeamName,playerPrincipalName:playerPrincipalName.trim().slice(0,32)||"Team Principal",circuitSeed,circuitName,circuitLengthFactor,teamPoints:{},rivalryWins:{},rivalryBattles:{},raceDramaLap:5+((circuitSeed>>>4)% 8),raceDramaTriggered:false,cars:[],events:[],teamMorale:62,teamReputation:45,pendingPaddockEvent:null,paddockEventRound:0,resolvedPaddockEvents:[],driverContracts:[]};
const roster:Array<{id:string;driver:string;team:string;color:string;player:boolean;progress:number}>=[
{id:"rp-1",driver:firstDriverName,team:safeTeamName,color:"#f04438",player:true,progress:0.025},
{id:"rp-2",driver:secondDriverName,team:safeTeamName,color:"#f04438",player:true,progress:0},
{id:"r-1",driver:"Luca Moretti",team:"Vortex Racing",color:"#48a9a6",player:false,progress:0.018},
{id:"r-2",driver:"Noah Bennett",team:"Vortex Racing",color:"#48a9a6",player:false,progress:0},
{id:"r-3",driver:"Sofia Laurent",team:"Apex Motorsport",color:"#8b7cf6",player:false,progress:0.012},
{id:"r-4",driver:"Ethan Cole",team:"Apex Motorsport",color:"#8b7cf6",player:false,progress:0},
{id:"r-5",driver:"Yuki Sato",team:"Northstar",color:"#e4b45c",player:false,progress:0.006},
{id:"r-6",driver:"Oliver Reed",team:"Northstar",color:"#e4b45c",player:false,progress:0},
{id:"r-7",driver:"Amara Okafor",team:"Velocity Works",color:"#6d9dfc",player:false,progress:0.003},
{id:"r-8",driver:"Felix Weber",team:"Velocity Works",color:"#6d9dfc",player:false,progress:0},
{id:"r-9",driver:"Mateo Silva",team:"Titan Autosport",color:"#e8793f",player:false,progress:0.015},
{id:"r-10",driver:"Isla Campbell",team:"Titan Autosport",color:"#e8793f",player:false,progress:0},
{id:"r-11",driver:"Kenji Watanabe",team:"Solaris Racing",color:"#e8d44d",player:false,progress:0.009},
{id:"r-12",driver:"Elena Rossi",team:"Solaris Racing",color:"#e8d44d",player:false,progress:0},
{id:"r-13",driver:"Theo Laurent",team:"Orion Motorsport",color:"#ad8bf4",player:false,progress:0.021},
{id:"r-14",driver:"Priya Nair",team:"Orion Motorsport",color:"#ad8bf4",player:false,progress:0},
{id:"r-15",driver:"Javier Costa",team:"Ember GP",color:"#f36b8b",player:false,progress:0.011},
{id:"r-16",driver:"Hana Suzuki",team:"Ember GP",color:"#f36b8b",player:false,progress:0},
{id:"r-17",driver:"Oscar Lindberg",team:"Summit Racing",color:"#d0d3dc",player:false,progress:0.004},
{id:"r-18",driver:"Zara Khan",team:"Summit Racing",color:"#d0d3dc",player:false,progress:0},
{id:"r-19",driver:"Rafael Costa",team:"Kestrel Performance",color:"#5f9d63",player:false,progress:0.008},
{id:"r-20",driver:"Chloe Martin",team:"Kestrel Performance",color:"#5f9d63",player:false,progress:0}
];
state.cars=roster.map((entry,index)=>{const car=makeCar(entry.id,entry.driver,entry.team,entry.color,entry.player,entry.progress,index,entry.player?DRIVER_MARKET.find((driver)=>driver.name===entry.driver):undefined);car.rivalStyle=entry.player?undefined:RIVAL_STYLE_BY_TEAM[entry.team];if(car.rivalStyle==='strategy-gambler')car.pitLap=5;if(car.rivalStyle==='consistency-expert')car.driverConsistency=Math.min(99,car.driverConsistency+8);return car;});
state.cars.forEach((car)=>{state.teamPoints![car.team]??=0;});
addEvent(state,"Race control: formation complete. Twenty-two cars ready.");
addEvent(state,"Engineer: monitor tyre life around the middle stint.");
return state;
}
export function ensureFullGrid(saved:RaceState):RaceState{
const migratedCars=saved.cars.map((car,index)=>{
const profile=DRIVER_MARKET.find((driver)=>driver.name===car.driver);
return{
...car,
driverPace:car.driverPace??profile?.pace??76+(index*7 % 13),
driverRacecraft:car.driverRacecraft??profile?.racecraft??75+(index*5 % 15),
driverTyreManagement:car.driverTyreManagement??profile?.tyreManagement??74+(index*3 % 16),
driverConsistency:car.driverConsistency??profile?.consistency??75+(index*11 % 14),
driverPotential:car.driverPotential??profile?.potential??78+(index*9 % 18),
};
});
if(migratedCars.length>=22)return{...saved,cars:migratedCars};
const fresh=createRace(saved.seed,saved.upgradeLevel,saved.cash,saved.weekendNumber,saved.playerTeamName??saved.cars.find((car)=>car.playerCar)?.team??"Redline GP",saved.cars.find((car)=>car.id==="rp-1")?.driver??"Alex Mercer",saved.cars.find((car)=>car.id==="rp-2")?.driver??"Mika Tanaka",saved.playerPrincipalName??"Team Principal");
const existingIds=new Set(migratedCars.map((car)=>car.id));
const missing=fresh.cars.filter((car)=>!existingIds.has(car.id));
return{...saved,cars:[...migratedCars,...missing],teamPoints:saved.teamPoints??{}};
}
export function stepRace(current:RaceState):RaceState{
if(current.status!=="running")return current;
const state:RaceState=structuredClone(current);
state.elapsedSeconds+=5;
state.safetyCarTicks=Math.max(0,state.safetyCarTicks??0);
state.safetyCarActive=state.safetyCarTicks>0;
if(state.safetyCarTicks>0){state.safetyCarTicks -=1;if(state.safetyCarTicks===0){state.safetyCarActive=false;addEvent(state,"Race control: safety car in this lap. Racing resumes.","warning");}}
const oldOrder=[...state.cars].sort((a,b)=>b.progress - a.progress);
const oldPositions=new Map(oldOrder.map((car,index)=>[car.id,index]));
const oldLap=state.lap;
for(const car of state.cars){
if(car.finished)continue;
if(car.pitDelay>0){car.pitDelay -=1;car.fuel=Math.max(0,car.fuel - 0.08);continue;}
const tyrePenalty=car.tyreWear>0.82?(car.tyreWear - 0.82)*13:car.tyreWear>0.58?(car.tyreWear - 0.58)*5:0;
const fuelPenalty=car.fuel<8?2.4:(100 - car.fuel)*0.009;
const reliabilityPenalty=(100 - car.condition)*0.025;
const modules=state.upgradeModules??{aero:0,power:0,suspension:0,reliability:0};
const synergyPaceBonus=modules.aero>=2&&modules.power>=2?0.10:0;
const upgradeBonus=car.playerCar?modules.aero*0.08+modules.power*0.12+synergyPaceBonus:0;
const consistencyNoise=1+(80 - car.driverConsistency)*0.012;
const noise=(random(state)- 0.5)*0.85*consistencyNoise;
const racecraftBonus=(car.driverRacecraft - 80)*0.009;
const rivalPace=car.playerCar?1:car.rivalStyle==='qualifying-ace'?0.991:car.rivalStyle==='aggressive-racer'?0.986:car.rivalStyle==='high-risk-attacker'?0.981:car.rivalStyle==='development-team'&&state.weekendNumber>=8?0.988:car.rivalStyle==='opportunist'&&state.safetyCarActive?0.975:1;
const safetyCarFactor=state.safetyCarActive?1.34:1;
const traits=state.buildTraits??[];
const traitPaceFactor=car.playerCar?(traits.includes("risk-reward")?0.985:1)*(traits.includes("reliability-first")?1.003:1):1;
const lapSeconds=Math.max(85,car.lapTime*(state.circuitLengthFactor??1)*PACE_FACTOR[car.pace]*TYRE_PACE_FACTOR[car.tyre]*safetyCarFactor*traitPaceFactor*rivalPace+tyrePenalty+fuelPenalty+reliabilityPenalty - upgradeBonus - racecraftBonus+noise);
car.lastLap=lapSeconds;
car.bestLap=car.bestLap===0?lapSeconds:Math.min(car.bestLap,lapSeconds);
const previousProgress=car.progress;
const progressDelta=5 / lapSeconds;
car.progress+=progressDelta;
const driverTyreCare=Math.max(0.72,1 -(car.driverTyreManagement - 80)*0.004);
const traitWearFactor=car.playerCar?((state.buildTraits??[]).includes("tyre-saver")?0.85:1)*((state.buildTraits??[]).includes("risk-reward")?1.18:1)*((state.buildTraits??[]).includes("reliability-first")?0.72:1):car.rivalStyle==="tyre-specialist"?0.78:car.rivalStyle==="aggressive-racer"?1.22:car.rivalStyle==="high-risk-attacker"?1.32:1;
const wearReduction=(car.playerCar?Math.max(0.65,1 -(state.upgradeModules?.suspension??0)*0.06):1)*driverTyreCare*traitWearFactor;
const aeroTyreLoad=car.playerCar?1+(state.upgradeModules?.aero??0)*0.025:1;
const enduranceWearBonus=car.playerCar&&modules.suspension>=2&&modules.reliability>=2?0.9:1;
const strategyWear=car.pace==="PUSH"?0.095:car.pace==="CONSERVE"?0.05:0.07;
car.tyreWear=Math.min(1,car.tyreWear+strategyWear*TYRE_WEAR_RATE[car.tyre]*progressDelta*wearReduction*aeroTyreLoad*enduranceWearBonus*(state.safetyCarActive?0.42:1));
const powerFuelLoad=car.playerCar?1+(state.upgradeModules?.power??0)*0.025:1;
car.fuel=Math.max(0,car.fuel -(car.pace==="PUSH"?0.78:car.pace==="CONSERVE"?0.53:0.65)*progressDelta*powerFuelLoad*(state.safetyCarActive?0.5:1));
const reliabilityProtection=car.playerCar?Math.min(0.75,(state.upgradeModules?.reliability??0)*0.005):0;
const enduranceConditionBonus=car.playerCar&&modules.suspension>=2&&modules.reliability>=2?0.9:1;
const traitConditionFactor=car.playerCar?((state.buildTraits??[]).includes("risk-reward")?1.8:1)*((state.buildTraits??[]).includes("reliability-first")?0.65:1):1;
const rivalCondition=!car.playerCar&&car.rivalStyle==="reliability-leader"?0.48:!car.playerCar&&car.rivalStyle==="high-risk-attacker"?1.7:1;
car.condition=Math.max(62,car.condition - 0.002*(1 - reliabilityProtection)*enduranceConditionBonus*traitConditionFactor*rivalCondition);
if(Math.floor(car.progress)>Math.floor(previousProgress)){
const completedLap=Math.floor(car.progress);
if(car.pitStops===0&&completedLap>=car.pitLap&&car.progress<state.totalLaps){
car.pitDelay=car.playerCar&&((state.buildTraits??[]).includes("pit-crew")||(state.permanentPerks?.["pit-crew-training"]??0)>0)?1:2;car.pitStops+=1;car.tyreWear=0.02;
car.tyre=car.nextTyre;
addEvent(state,car.playerCar?car.driver+" pits for "+car.tyre.toLowerCase()+" tyres.":car.driver+" ("+car.team+") pits.","pit");
}
if(completedLap>=state.totalLaps){
car.finished=true;car.progress=state.totalLaps;car.finishTime=state.elapsedSeconds;
addEvent(state,car.driver+" takes the chequered flag.","finish");
}
}
}
const order=[...state.cars].sort((a,b)=>b.progress - a.progress);
for(const car of order.filter((item)=>item.playerCar)){
const before=oldPositions.get(car.id);
const after=order.findIndex((item)=>item.id===car.id);
if(before!==undefined&&after<before){
const passed=oldOrder[before - 1];
if(passed&&passed.id!==car.id&&Math.abs(passed.progress - car.progress)<0.08)addEvent(state,car.driver+" gains a position in traffic.","battle");
}
}
if(!state.safetyCarActive&&(state.safetyCarTicks??0)===0&&random(state)<0.018){
const runningCars=order.filter((car)=>!car.finished);
const candidate=runningCars.find((car,index)=>index>0&&Math.abs(car.progress - runningCars[index - 1].progress)<0.055)??runningCars[Math.floor(random(state)*Math.max(1,runningCars.length))];
if(candidate){
state.incidentCount=(state.incidentCount??0)+1;
if(random(state)<0.34){
state.safetyCarTicks=3;state.safetyCarActive=true;
addEvent(state,"SAFETY CAR — "+candidate.driver+" has stopped off-line after an incident. The field is neutralised; tyre wear and fuel use are reduced.","warning");
}else{
const incidentDamage=candidate.playerCar&&(state.buildTraits??[]).includes("reliability-first")?4:candidate.playerCar&&(state.buildTraits??[]).includes("risk-reward")?12:8;
candidate.condition=Math.max(45,candidate.condition - incidentDamage);
candidate.progress=Math.max(0,candidate.progress - 0.025);
addEvent(state,"Incident: "+candidate.driver+" runs wide in traffic. Lost time and minor component damage.","warning");
}
}
}
const leader=order[0];
state.lap=Math.min(state.totalLaps,Math.max(1,Math.floor(leader.progress)+1));
if(!state.raceDramaTriggered&&state.lap>=(state.raceDramaLap??8)&&state.lap<state.totalLaps){
state.raceDramaTriggered=true;
const dramaType=(state.circuitSeed??state.seed)% 3;
if(dramaType===0){
state.safetyCarTicks=Math.max(state.safetyCarTicks??0,3);state.safetyCarActive=true;
addEvent(state,"RACE DRAMA — Debris on track. Safety car deployed; review both cars' pit windows.","warning");
}else if(dramaType===1){
const target=order.find((car)=>!car.playerCar&&!car.finished&&car.progress>0.15);
if(target){target.condition=Math.max(55,target.condition - 14);target.progress=Math.max(0,target.progress - 0.035);addEvent(state,"RACE DRAMA — "+target.team+" reports a technical issue on "+target.driver+"'s car. Lost time and reduced component condition.","warning");}
}else{
const target=state.cars.find((car)=>!car.playerCar&&!car.finished&&car.pitStops===0&&car.rivalStyle==="strategy-gambler");
if(target){target.pitDelay=2;target.pitStops+=1;target.tyreWear=0.02;target.tyre=target.nextTyre;addEvent(state,"RACE DRAMA — "+target.team+" gambles on an unscheduled tyre stop. Track position sacrificed for fresh rubber.","pit");}
else{state.safetyCarTicks=2;state.safetyCarActive=true;addEvent(state,"RACE DRAMA — A late incident brings out the safety car. Reassess both cars' strategy.","warning");}
}
}
if(state.lap!==oldLap&&state.lap<=state.totalLaps)addEvent(state,"Lap "+state.lap+" of "+state.totalLaps+" — "+leader.driver+" leads the field.");
if(state.cars.every((car)=>car.finished)){
state.status="finished";
state.cars.sort((a,b)=>(a.finishTime??Infinity)-(b.finishTime??Infinity));
const firstPlayer=state.cars.findIndex((car)=>car.playerCar)+1;
const payout=firstPlayer===1?1100000:firstPlayer<=3?750000:firstPlayer<=6?520000:350000;
const sponsorBonus=(state.buildTraits??[]).includes("sponsor-network")?120000:0;
state.cash+=payout+sponsorBonus;
if(sponsorBonus)addEvent(state,"Commercial build pays off: sponsor network adds RM120,000 to the race return.","info");
state.teamPoints??={};
state.rivalryWins??={};
const playerPosition=state.cars.findIndex((car)=>car.playerCar)+1;
const beatenTeams=new Set<string>();
for(const rival of state.cars.filter((car)=>!car.playerCar)){
const rivalPosition=state.cars.findIndex((car)=>car.team===rival.team)+1;
if(playerPosition>0&&rivalPosition>playerPosition)beatenTeams.add(rival.team);
}
for(const team of beatenTeams)state.rivalryWins[team]=(state.rivalryWins[team]??0)+1;
const rivalryBonus=Math.min(150000,beatenTeams.size*15000);
if(rivalryBonus>0){state.cash+=rivalryBonus;addEvent(state,"Rivalry bonus: "+beatenTeams.size+" rival teams beaten. Commercial partners add RM"+rivalryBonus.toLocaleString("en-MY")+".","info");}
state.cars.forEach((car,index)=>{
const points=POINTS_BY_POSITION[index]??0;
state.teamPoints![car.team]=(state.teamPoints![car.team]??0)+points;
});
if((state.mode??"championship")==="championship"&&state.weekendNumber>=CAMPAIGN_LENGTH){
state.status="gameover";
addEvent(state,"Campaign complete. Final championship points have been locked.","finish");
}else{
addEvent(state,"Race complete. Prize income added to the team budget.","finish");
}
}
return state;
}
export interface StrategyAdvice{
headline:string;
reason:string;
action:Pace|"PIT";
actionLabel:string;
}
export function getStrategyAdvice(state:RaceState,carId:string):StrategyAdvice|null{
if(state.status!=="running")return null;
const car=state.cars.find((item)=>item.id===carId&&item.playerCar);
if(!car||car.finished)return null;
const remainingLaps=Math.max(0,state.totalLaps - car.progress);
const ahead=state.cars
.filter((item)=>!item.finished&&item.id!==car.id&&item.progress>car.progress)
.sort((a,b)=>a.progress - b.progress)[0];
const gapAhead=ahead?ahead.progress - car.progress:Infinity;
const canPit=car.pitStops===0&&remainingLaps>1.2;
if(canPit&&state.safetyCarActive&&car.tyreWear>=0.3){
return{headline:"Use the safety-car window",reason:"The field is neutralised, so this is a lower-loss opportunity to change tyres before green-flag running resumes.",action:"PIT",actionLabel:"PIT NEXT LAP"};
}
if(canPit&&car.tyreWear>=0.8){
return{headline:"Tyres are past their peak",reason:"Heavy wear is costing lap time. A stop is likely to recover more pace than extending this stint.",action:"PIT",actionLabel:"PIT NEXT LAP"};
}
if(car.fuel<=14){
return{headline:"Protect the fuel margin",reason:"Fuel is running low. Conserve pace reduces consumption and lowers the risk of losing time late in the race.",action:"CONSERVE",actionLabel:"CONSERVE FUEL"};
}
if(car.tyreWear>=0.64){
return{headline:"Manage the tyre drop-off",reason:"Tyre wear is entering the steep degradation range. Conserve pace can keep the stint competitive for longer.",action:"CONSERVE",actionLabel:"SAVE THE TYRES"};
}
if(gapAhead<0.035&&car.fuel>22&&car.tyreWear<0.62&&car.pace!=="PUSH"){
return{headline:"Attack the car ahead",reason:"The gap is small enough to pressure the rival. Push pace may create an overtaking chance, at the cost of extra tyre wear and fuel.",action:"PUSH",actionLabel:"ATTACK"};
}
if(car.pace==="PUSH"&&(car.tyreWear>=0.42||car.fuel<32)){
return{headline:"Reset to sustainable pace",reason:"The current push is consuming a meaningful resource margin. Balanced running protects the stint without fully giving up pace.",action:"BALANCED",actionLabel:"BALANCE PACE"};
}
if(remainingLaps>2&&car.tyreWear<0.25&&car.fuel>55&&car.pace!=="PUSH"){
return{headline:"There is room to push",reason:"Tyre life and fuel are healthy. A short push phase could gain time before the next strategy decision.",action:"PUSH",actionLabel:"PUSH FOR PACE"};
}
return{headline:"Hold a balanced stint",reason:"Current tyre and fuel levels do not justify a more aggressive call. Reassess as traffic, wear and fuel margins change.",action:"BALANCED",actionLabel:"SET BALANCED"};
}
export function setDriverStrategy(state:RaceState,carId:string,patch:Partial<Pick<CarState,"pace"|"nextTyre"|"pitLap">>):RaceState{
const next=structuredClone(state);
const car=next.cars.find((item)=>item.id===carId);
if(!car||!car.playerCar||next.status==="finished")return state;
Object.assign(car,patch);
if(patch.pace)addEvent(next,car.driver+" switches to "+patch.pace.toLowerCase()+" pace: "+(patch.pace==="PUSH"?"more speed, higher tyre wear and fuel use.":patch.pace==="CONSERVE"?"protecting tyres and fuel at the cost of lap time.":"balanced pace and resource use."));
else if(patch.nextTyre)addEvent(next,car.driver+" will fit "+patch.nextTyre.toLowerCase()+" tyres at the next stop.");
else if(patch.pitLap)addEvent(next,car.driver+" pit window moved to lap "+patch.pitLap+".");
return next;
}
export function applyStartingUpgrade(state:RaceState,cardId:string):RaceState{
if(state.status!=="ready"||state.upgradeLevel!==0||state.weekendNumber!==1)return state;
const card=draftUpgradeCards(state).find((item)=>item.id===cardId);
if(!card)return state;
const next=structuredClone(state);
next.upgradeModules??={aero:0,power:0,suspension:0,reliability:0};
if(card.upgradeType&&card.amount)next.upgradeModules[card.upgradeType]+=card.amount;
if(card.cashBonus)next.cash+=card.cashBonus;
next.installedUpgrades=[...(next.installedUpgrades??[]),{id:card.id,title:card.title,subtitle:card.subtitle,rarity:card.rarity,effect:card.effect,upgradeType:card.upgradeType,amount:card.amount,cashBonus:card.cashBonus}];
if(card.trait)next.buildTraits=[...new Set([...(next.buildTraits??[]),card.trait])];
next.upgradeLevel=1;
addEvent(next,"Pre-season development pick: "+card.title+". "+card.effect);
return next;
}
export function upgradeCar(state:RaceState,cardId:string):RaceState{
if(state.status!=="finished")return state;
const card=draftUpgradeCards(state).find((item)=>item.id===cardId);
if(!card)return state;
const next=structuredClone(state);
next.upgradeModules??={aero:0,power:0,suspension:0,reliability:0};
if(card.upgradeType&&card.amount)next.upgradeModules[card.upgradeType]+=card.amount;
if(card.cashBonus)next.cash+=card.cashBonus;
next.installedUpgrades=[...(next.installedUpgrades??[]),{id:card.id,title:card.title,subtitle:card.subtitle,rarity:card.rarity,effect:card.effect,upgradeType:card.upgradeType,amount:card.amount,cashBonus:card.cashBonus}];
if(card.trait)next.buildTraits=[...new Set([...(next.buildTraits??[]),card.trait])];
next.upgradeLevel+=1;
next.weekendNumber+=1;next.status="ready";next.lap=1;next.elapsedSeconds=0;
next.seed=(next.seed+947)>>>0;next.eventSequence=0;next.events=[];
const fresh=createRace(next.seed,next.upgradeLevel,next.cash,next.weekendNumber,next.playerTeamName??next.cars.find((car)=>car.playerCar)?.team??"Redline GP",next.cars.find((car)=>car.id==="rp-1")?.driver??"Alex Mercer",next.cars.find((car)=>car.id==="rp-2")?.driver??"Mika Tanaka",next.playerPrincipalName??"Team Principal");
next.cars=fresh.cars;
next.cars.forEach((car)=>{car.condition=Math.max(72,car.condition -(car.playerCar?2.5:0));if(car.playerCar){car.tyre="MEDIUM";car.nextTyre="HARD";car.tyreWear=0.02;car.fuel=100;car.pitLap=7;}});
addEvent(next,"Weekend "+(next.weekendNumber - 1)+": drafted "+card.title+". "+card.effect);
return next;
}
export function standings(state:RaceState):CarState[]{return[...state.cars].sort((a,b)=>{if(a.finished&&b.finished)return(a.finishTime??Infinity)-(b.finishTime??Infinity);if(a.finished)return -1;if(b.finished)return 1;return b.progress - a.progress;});}
export function formatLapTime(seconds:number):string{
if(!seconds||!Number.isFinite(seconds))return "—";
const minutes=Math.floor(seconds / 60);
return minutes+":"+(seconds % 60).toFixed(3).padStart(6,"0");
}
