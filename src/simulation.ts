import{RIVAL_STYLE_BY_TEAM,type RivalStyle,}from "./rivals";
export type Tyre="SOFT"|"MEDIUM"|"HARD";
export type Pace="CONSERVE"|"BALANCED"|"PUSH";
export type BattleMode="STANDARD"|"OVERTAKE"|"DEFEND";
export type FuelMode="NORMAL"|"SAVE"|"DEPLOY";
export type RaceStatus="ready"|"running"|"paused"|"finished"|"gameover";
export type GameMode="championship"|"endless";
export type RunMutatorId="tyre-stress"|"power-surge"|"rival-rush"|"sponsor-boom"|"fragile-components"|"budget-crunch";
export interface RunMutator { id: RunMutatorId; title: string; tag: string; description: string; effect: string; }
export const RUN_MUTATORS: RunMutator[] = [
{id:"tyre-stress",title:"Tyre Stress Test",tag:"HIGH DEGRADATION",description:"Tyres wear 25% faster. The Tyre Saver build softens the penalty, making endurance upgrades especially valuable.",effect:"TYRE WEAR +25% · TYRE-SAVER SYNERGY"},
{id:"power-surge",title:"Power Surge",tag:"PERFORMANCE WINDOW",description:"Your cars gain a 1.5% pace advantage for the whole run. Stack it with power-unit upgrades to push your advantage.",effect:"PLAYER PACE +1.5%"},
{id:"rival-rush",title:"Rival Rush",tag:"GRID PRESSURE",description:"Every rival gets a 1.5% pace boost. Overtaking and smart fuel deployment matter more than ever.",effect:"RIVAL PACE +1.5%"},
{id:"sponsor-boom",title:"Sponsor Boom",tag:"COMMERCIAL UPSIDE",description:"Sponsor income rises by 35% between race weekends. Use the extra breathing room to invest in your build.",effect:"SPONSOR INCOME +35%"},
{id:"fragile-components",title:"Fragile Components",tag:"RELIABILITY CHALLENGE",description:"Your cars lose condition faster. Reliability-first upgrades reduce the extra wear.",effect:"PLAYER COMPONENT WEAR +55% · RELIABILITY SYNERGY"},
{id:"budget-crunch",title:"Budget Crunch",tag:"SURVIVAL ECONOMY",description:"Operating costs are 15% higher. Commercial upgrades and consistent results can keep the team afloat.",effect:"OPERATING COSTS +15%"}
];
export function getRunMutator(seed:number):RunMutator {
const mixed=(Math.imul(seed>>>0,2246822519) ^ (seed>>>13) ^ 0x9e3779b9)>>>0;
return RUN_MUTATORS[mixed % RUN_MUTATORS.length];
}
export const CAMPAIGN_LENGTH=20;
export const POINTS_BY_POSITION=[25,18,15,12,10,8,6,4,2,1]as const;
export interface ChampionshipAchievement { id:string; title:string; detail:string; round:number; cashReward:number; researchReward:number; }
export const CHAMPIONSHIP_ACHIEVEMENTS=[
{id:"first-points",title:"FIRST POINTS",description:"Finish a race inside the top ten.",cashReward:50000,researchReward:1},
{id:"first-podium",title:"FIRST PODIUM",description:"Finish a race inside the top three.",cashReward:75000,researchReward:2},
{id:"first-win",title:"FIRST VICTORY",description:"Win your first race.",cashReward:100000,researchReward:2},
{id:"five-points-finishes",title:"POINTS REGULAR",description:"Record five top-ten finishes in one championship.",cashReward:125000,researchReward:2},
{id:"three-points-streak",title:"ON THE CHARGE",description:"Score points in three consecutive rounds.",cashReward:100000,researchReward:2},
{id:"century-club",title:"CENTURY CLUB",description:"Earn 100 championship points.",cashReward:150000,researchReward:3},
{id:"top-three-season",title:"PODIUM CAMPAIGN",description:"Finish the 20-round season in the top three.",cashReward:250000,researchReward:4},
{id:"world-champion",title:"WORLD CHAMPION",description:"Finish the season first in the championship.",cashReward:500000,researchReward:6},
] as const;
export type UpgradeType="aero"|"power"|"suspension"|"reliability";
export type RunTrait="tyre-saver"|"pit-crew"|"risk-reward"|"sponsor-network"|"reliability-first";
export interface UpgradeModules{aero:number;power:number;suspension:number;reliability:number;}
export interface InstalledUpgrade{id:string;title:string;subtitle:string;rarity:UpgradeRarity;effect:string;upgradeType?:UpgradeType;amount?:number;cashBonus?:number;trait?:RunTrait;}
export interface UpgradeEvolution {
id:string;
title:string;
description:string;
requiredUpgradeIds:string[];
rewardText:string;
moduleBonus?:Partial<UpgradeModules>;
cashBonus?:number;
}
export const UPGRADE_EVOLUTIONS:UpgradeEvolution[]=[
{id:"aero-deployment-matrix",title:"Aero-Deployment Matrix",description:"Synchronise front-wing balance with the first-generation energy map for a more complete performance package.",requiredUpgradeIds:["front-wing","energy-map"],rewardText:"Aerodynamics +1 · Power unit +1",moduleBonus:{aero:1,power:1}},
{id:"ground-effect-package",title:"Ground Effect Package",description:"Pair a revised floor edge with detailed underfloor sealing to unlock a more stable ground-effect platform.",requiredUpgradeIds:["floor-edge","underfloor-sealing"],rewardText:"Aerodynamics +2",moduleBonus:{aero:2}},
{id:"hybrid-efficiency-suite",title:"Hybrid Efficiency Suite",description:"Combine combustion development with torque-vector calibration for stronger and more usable deployment.",requiredUpgradeIds:["combustion","torque-vector-map"],rewardText:"Power unit +2",moduleBonus:{power:2}},
{id:"endurance-platform-evolution",title:"Endurance Platform Evolution",description:"A tyre-aware suspension package paired with endurance component testing creates a tougher long-run platform.",requiredUpgradeIds:["tyre-whisperer","compliance-test"],rewardText:"Reliability +1",moduleBonus:{reliability:1}},
{id:"bulletproof-cooling-architecture",title:"Bulletproof Cooling Architecture",description:"Combine the reliability process with an advanced cooling loop to make the whole package more resilient.",requiredUpgradeIds:["bulletproof-process","cooling-loop"],rewardText:"Reliability +2",moduleBonus:{reliability:2}},
{id:"commercial-flywheel",title:"Commercial Flywheel",description:"A sponsor network and technical partner reinforce each other, converting a broader engineering story into extra budget.",requiredUpgradeIds:["sponsor-relations","technical-partner"],rewardText:"+RM250,000 team funds",cashBonus:250000},
{id:"high-downforce-qualifying-kit",title:"High-Downforce Qualifying Kit",description:"Pair an extreme airflow concept with the edge-of-grip package for a specialised high-risk qualifying build.",requiredUpgradeIds:["active-flow","edge-of-grip"],rewardText:"Aerodynamics +1",moduleBonus:{aero:1}},
{id:"tyre-saving-chassis",title:"Tyre-Saving Chassis",description:"Combine the long-run tyre programme with the bulletproof reliability process for a more forgiving race platform.",requiredUpgradeIds:["long-run-programme","bulletproof-process"],rewardText:"Suspension +1 · Reliability +1",moduleBonus:{suspension:1,reliability:1}},
];
export function buildSynergies(modules:UpgradeModules):string[]{
const active:string[]=[];
if(modules.aero>=2&&modules.power>=2)active.push("AERO + POWER INTEGRATION");
if(modules.suspension>=2&&modules.reliability>=2)active.push("ENDURANCE PLATFORM");
return active;
}
export type UpgradeRarity="COMMON"|"UNCOMMON"|"RARE"|"EPIC"|"LEGENDARY";
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
export const UPGRADE_CARD_POOL:UpgradeCard[]=[
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
{id:"underfloor-sealing",title:"Underfloor Sealing Study",subtitle:"AERO PACKAGE",rarity:"UNCOMMON",description:"Careful edge sealing stabilises the floor platform and adds a measured cornering gain.",effect:"Aerodynamics +1",upgradeType:"aero",amount:1},
{id:"active-suspension-map",title:"Active Suspension Map",subtitle:"MECHANICAL GRIP",rarity:"UNCOMMON",description:"A revised mechanical map improves tyre contact through changing loads.",effect:"Suspension +1",upgradeType:"suspension",amount:1},
{id:"composite-uprights",title:"Composite Upright Package",subtitle:"MECHANICAL GRIP",rarity:"RARE",description:"Lighter uprights sharpen the mechanical platform without compromising its baseline.",effect:"Suspension +2",upgradeType:"suspension",amount:2},
{id:"kinematic-breakthrough",title:"Kinematic Breakthrough",subtitle:"MECHANICAL GRIP",rarity:"LEGENDARY",description:"A rare suspension concept unlocks an exceptional step in mechanical grip.",effect:"Suspension +3",upgradeType:"suspension",amount:3},
{id:"combustion-calibration",title:"Combustion Calibration",subtitle:"POWER UNIT",rarity:"UNCOMMON",description:"Fine-grained combustion calibration improves usable power across the lap.",effect:"Power unit +1",upgradeType:"power",amount:1},
{id:"energy-density-cell",title:"High-Density Energy Cell",subtitle:"POWER UNIT",rarity:"LEGENDARY",description:"A breakthrough energy cell provides an exceptional power-unit gain.",effect:"Power unit +3",upgradeType:"power",amount:3},
{id:"floor-vortex-array",title:"Floor Vortex Array",subtitle:"AERO PACKAGE",rarity:"LEGENDARY",description:"A highly experimental floor vortex system creates a major aerodynamic step.",effect:"Aerodynamics +3",upgradeType:"aero",amount:3},
{id:"micro-aero-rakes",title:"Micro-Aero Correlation",subtitle:"AERO PACKAGE",rarity:"UNCOMMON",description:"Improved wind-tunnel correlation turns small aerodynamic changes into reliable gains.",effect:"Aerodynamics +1",upgradeType:"aero",amount:1},
{id:"thermal-barrier",title:"Thermal Barrier Coating",subtitle:"RELIABILITY",rarity:"UNCOMMON",description:"Protective coatings help components tolerate repeated high-temperature cycles.",effect:"Reliability +1",upgradeType:"reliability",amount:1},
{id:"predictive-fatigue",title:"Predictive Fatigue Model",subtitle:"RELIABILITY",rarity:"EPIC",description:"A predictive stress model allows the team to develop a tougher package.",effect:"Reliability +3",upgradeType:"reliability",amount:3},
{id:"gearbox-materials",title:"Gearbox Materials Programme",subtitle:"RELIABILITY",rarity:"RARE",description:"Improved materials raise the reliability baseline for demanding race weekends.",effect:"Reliability +2",upgradeType:"reliability",amount:2},
{id:"power-recovery-map",title:"Power Recovery Map",subtitle:"POWER UNIT",rarity:"RARE",description:"A revised recovery map improves deployment consistency and usable output.",effect:"Power unit +2",upgradeType:"power",amount:2},
{id:"aero-platform-v2",title:"Aero Platform Revision II",subtitle:"AERO PACKAGE",rarity:"EPIC",description:"A complete platform revision delivers a large, balanced aerodynamic improvement.",effect:"Aerodynamics +2",upgradeType:"aero",amount:2},
{id:"suspension-load-cell",title:"Suspension Load-Cell Study",subtitle:"MECHANICAL GRIP",rarity:"COMMON",description:"Additional load data helps the engineers make a small but dependable chassis improvement.",effect:"Suspension +1",upgradeType:"suspension",amount:1},
{id:"spare-parts-rebate",title:"Supplier Volume Rebate",subtitle:"COMMERCIAL WIN",rarity:"UNCOMMON",description:"A negotiated parts agreement returns cash to the team's development budget.",effect:"+RM175,000 team funds",cashBonus:175000},
{id:"sponsor-signing-bonus",title:"New Sponsor Signing Bonus",subtitle:"COMMERCIAL WIN",rarity:"EPIC",description:"A new technical sponsor commits funding after reviewing the team's engineering roadmap.",effect:"+RM600,000 team funds",cashBonus:600000},
{id:"development-grant",title:"Innovation Development Grant",subtitle:"COMMERCIAL WIN",rarity:"LEGENDARY",description:"A motorsport innovation grant gives the team a major one-off cash injection.",effect:"+RM800,000 team funds",cashBonus:800000},
{id:"rear-diffuser-strakes",title:"Rear Diffuser Strakes",subtitle:"AERO PACKAGE",rarity:"UNCOMMON",description:"Revised diffuser strakes improve the consistency of the aerodynamic platform.",effect:"Aerodynamics +1",upgradeType:"aero",amount:1},
{id:"torque-vector-map",title:"Torque Vector Calibration",subtitle:"POWER UNIT",rarity:"UNCOMMON",description:"More precise deployment calibration improves usable traction and acceleration.",effect:"Power unit +1",upgradeType:"power",amount:1},
{id:"carbon-chassis-weave",title:"Carbon Chassis Weave",subtitle:"MECHANICAL GRIP",rarity:"RARE",description:"A refined composite layup improves the chassis platform under load.",effect:"Suspension +2",upgradeType:"suspension",amount:2},
{id:"coolant-channel-revision",title:"Coolant Channel Revision",subtitle:"RELIABILITY",rarity:"UNCOMMON",description:"Improved internal coolant routing helps protect components over long runs.",effect:"Reliability +1",upgradeType:"reliability",amount:1},
{id:"rear-wing-efficiency",title:"Rear-Wing Efficiency Study",subtitle:"AERO PACKAGE",rarity:"EPIC",description:"A refined rear-wing profile delivers a meaningful aerodynamic improvement.",effect:"Aerodynamics +2",upgradeType:"aero",amount:2},
{id:"gear-ratio-optimisation",title:"Gear Ratio Optimisation",subtitle:"POWER UNIT",rarity:"RARE",description:"A revised ratio package improves power delivery across the circuit's key speed ranges.",effect:"Power unit +2",upgradeType:"power",amount:2},
{id:"upright-load-analysis",title:"Upright Load Analysis",subtitle:"MECHANICAL GRIP",rarity:"EPIC",description:"Advanced load analysis unlocks a stronger mechanical platform.",effect:"Suspension +2",upgradeType:"suspension",amount:2},
{id:"fatigue-resistant-alloy",title:"Fatigue-Resistant Alloy",subtitle:"RELIABILITY",rarity:"RARE",description:"A stronger alloy mix increases confidence in high-stress components.",effect:"Reliability +2",upgradeType:"reliability",amount:2},
{id:"supplier-volume-rebate",title:"Supplier Volume Rebate",subtitle:"COMMERCIAL WIN",rarity:"UNCOMMON",description:"A negotiated parts agreement returns cash to the team's development budget.",effect:"+RM175,000 team funds",cashBonus:175000},
{id:"component-stress-testing",title:"Component Stress Testing",subtitle:"RELIABILITY",rarity:"EPIC",description:"A more demanding validation programme gives the reliability department a substantial baseline improvement.",effect:"Reliability +2",upgradeType:"reliability",amount:2}
];
export function draftUpgradeCards(state:RaceState,progression:{discoveredCount?:number}={}):UpgradeCard[]{
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
const rarityRank:Record<UpgradeRarity,number>={COMMON:0,UNCOMMON:1,RARE:2,EPIC:3,LEGENDARY:4};
const categoryOf=(card:UpgradeCard)=>card.buildPath??card.upgradeType??"commercial";
const ensureRarity=(minimumRank:number)=>{
if(selected.some((card)=>rarityRank[card.rarity]>=minimumRank))return;
const candidate=pool.find((card)=>rarityRank[card.rarity]>=minimumRank&&!selected.some((item)=>item.id===card.id));
if(!candidate)return;
let replaceIndex=selected.findIndex((card,index)=>!selected.some((other,otherIndex)=>otherIndex!==index&&categoryOf(other)===categoryOf(card)));
if(replaceIndex<0)replaceIndex=selected.reduce((weakest,card,index)=>rarityRank[card.rarity]<rarityRank[selected[weakest].rarity]?index:weakest,0);
selected[replaceIndex]=candidate;
};
const discoveries=Math.max(0,Math.floor(progression.discoveredCount??0));
if(discoveries>=10)ensureRarity(2);
if(discoveries>=20)ensureRarity(3);
if(discoveries>=30)ensureRarity(4);
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
unlockCost?:number;
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
{id:"marco-bianchi",name:"Marco Bianchi",role:"LATE BRAKING SPECIALIST",pace:87,racecraft:91,tyreManagement:76,consistency:82,potential:88,color:"#f07828",unlockCost:3},
{id:"priya-nair",name:"Priya Nair",role:"TECHNICAL THINKER",pace:84,racecraft:85,tyreManagement:86,consistency:89,potential:91,color:"#48b9d1",unlockCost:3},
{id:"jules-martin",name:"Jules Martin",role:"QUALIFYING PROSPECT",pace:91,racecraft:78,tyreManagement:75,consistency:80,potential:94,color:"#b28bf4",unlockCost:4},
{id:"daniel-reyes",name:"Daniel Reyes",role:"OVERTAKING ACE",pace:85,racecraft:92,tyreManagement:80,consistency:79,potential:90,color:"#e4b45c",unlockCost:4},
{id:"aisha-rahman",name:"Aisha Rahman",role:"TYRE WHISPERER",pace:82,racecraft:83,tyreManagement:94,consistency:88,potential:93,color:"#ec4f9b",unlockCost:4},
{id:"oliver-shaw",name:"Oliver Shaw",role:"VETERAN LEADER",pace:88,racecraft:89,tyreManagement:87,consistency:93,potential:84,color:"#8a929f",unlockCost:5},
{id:"yuki-sato",name:"Yuki Sato",role:"HIGH-POTENTIAL ROOKIE",pace:80,racecraft:81,tyreManagement:84,consistency:78,potential:98,color:"#e85b5b",unlockCost:5},
{id:"gabriel-costa",name:"Gabriel Costa",role:"WET-WEATHER ACE",pace:84,racecraft:88,tyreManagement:91,consistency:86,potential:92,color:"#5f9d63",unlockCost:6},
{id:"maya-chen",name:"Maya Chen",role:"CONSISTENT SCORER",pace:86,racecraft:84,tyreManagement:90,consistency:95,potential:89,color:"#ad8bf4",unlockCost:6},
{id:"liam-oconnell",name:"Liam O'Connell",role:"PURE PACE",pace:94,racecraft:80,tyreManagement:74,consistency:79,potential:91,color:"#f04438",unlockCost:7},
{id:"sofia-petrov",name:"Sofia Petrov",role:"COMPLETE PACKAGE",pace:89,racecraft:90,tyreManagement:89,consistency:90,potential:93,color:"#49b9d1",unlockCost:7},
{id:"alexei-volkov",name:"Alexei Volkov",role:"ELITE ALL-ROUNDER",pace:95,racecraft:93,tyreManagement:91,consistency:89,potential:94,color:"#ffc16f",unlockCost:9},
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
battleMode:BattleMode;
fuelMode:FuelMode;
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
export interface PaddockChoice{id:string;label:string;description:string;cashDelta:number;moraleDelta:number;reputationDelta:number;weekendEffect?:"wet-prepared"|"wet-unprepared"|"directive-compliant"|"directive-restricted"|"spares-secured"|"parts-shortage"|"feud-attack"|"feud-composed";}
export interface PaddockEvent{id:string;category:"FIA PROTEST"|"PADDOCK POLITICS"|"TEAM DRAMA"|"COMMERCIAL"|"CHAOS WEEKEND";title:string;source:string;story:string;choices:PaddockChoice[];}
export interface DriverContract{id:string;driverName:string;salaryPerRace:number;expiresAtRound:number;renewed:boolean;loyalty:number;}
export interface ChampionshipObjective{id:"score-points"|"podium"|"double-points"|"beat-nemesis";title:string;detail:string;targetTeam?:string;reward:number;completed?:boolean;}
export interface RaceState{
version:1;
runMutator?:RunMutatorId;
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
activeEvolutions?:string[];
buildTraits?:RunTrait[];
permanentPerks?:Record<string,number>;
weekendNumber:number;
teamPoints?:Record<string,number>;
championshipMilestones?:number[];
championshipAchievements?:string[];
championshipRaceResults?:{round:number;position:number;points:number}[];
latestChampionshipAchievements?:ChampionshipAchievement[];
latestChampionshipMilestone?:{round:number;title:string;detail:string;reward:number;position:number;};
championshipObjective?:ChampionshipObjective;
rivalryWins?:Record<string,number>;
rivalryBattles?:Record<string,number>;
rivalryHistory?:Record<string,number[]>;
nemesisTeam?:string;
nemesisTarget?:"pace"|"racecraft"|"tyre-management"|"consistency";
nemesisShowdown?:boolean;
rivalryFeudTeam?:string;
rivalryFeudBonus?:number;
weekendEffect?:"wet-prepared"|"wet-unprepared"|"directive-compliant"|"directive-restricted"|"spares-secured"|"parts-shortage"|"feud-attack"|"feud-composed";
weekendEffectTitle?:string;
nextWeekendEffect?:"wet-prepared"|"wet-unprepared"|"directive-compliant"|"directive-restricted"|"spares-secured"|"parts-shortage"|"feud-attack"|"feud-composed";
nextWeekendEffectTitle?:string;
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
tyreWear:0.04+n*0.012,fuel:100,pace:"BALANCED",battleMode:"STANDARD",fuelMode:"NORMAL",pitLap:playerCar?7:6+n % 4,
pitStops:0,pitDelay:0,condition:100,lastLap:0,bestLap:0,finishTime:null,finished:false,
};
}
export function createRace(seed=8241,upgradeLevel=0,cash=2500000,weekendNumber=1,playerTeamName="Redline GP",firstDriverName="Alex Mercer",secondDriverName="Mika Tanaka",playerPrincipalName="Team Principal",mode:GameMode="championship"):RaceState{
const safeTeamName=playerTeamName.trim().slice(0,24)||"Redline GP";
const circuitSeed=(seed ^ Math.imul(weekendNumber+37,2246822519))>>>0;
const circuitNames=["Copperhead Ring","Monsoon Park","Granite Valley","Nightfall Circuit","Cobalt Coast","Redwood Raceway","Sundown Autodrome","Ironclad Park","Tempest Circuit","Silver Basin","Emberstone GP","Highland Loop","Mirage International","Blackstone Raceway","Aurora Park","Thunder Ridge","Mariner Circuit","Crimson Dunes","Summit Ring","Neon Harbour"];
const circuitName=circuitNames[(circuitSeed>>>8)% circuitNames.length];
const circuitLengthFactor=0.94+((circuitSeed>>>16)% 1200)/ 10000;
const state:RaceState={version:1,mode,status:"ready",lap:1,totalLaps:18,elapsedSeconds:0,seed,eventSequence:0,cash,upgradeLevel,upgradeModules:{aero:0,power:0,suspension:0,reliability:0},buildTraits:[],weekendNumber,playerTeamName:safeTeamName,playerPrincipalName:playerPrincipalName.trim().slice(0,32)||"Team Principal",circuitSeed,circuitName,circuitLengthFactor,teamPoints:{},championshipObjective:mode!=="championship"?undefined:weekendNumber%4===0?{id:"podium",title:"Podium Push",detail:"Finish in the top three to impress the board and commercial partners.",reward:170000}:weekendNumber%3===0?{id:"double-points",title:"Double Points",detail:"Get both of your drivers into the top ten.",reward:145000}:{id:"score-points",title:"Score Points",detail:"Bring at least one car home in the top ten.",reward:100000},rivalryWins:{},rivalryBattles:{},rivalryHistory:{},raceDramaLap:5+((circuitSeed>>>4)% 8),raceDramaTriggered:false,cars:[],events:[],teamMorale:62,teamReputation:45,pendingPaddockEvent:null,paddockEventRound:0,resolvedPaddockEvents:[],driverContracts:[]};
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
rivalStyle:car.playerCar?undefined:car.rivalStyle??RIVAL_STYLE_BY_TEAM[car.team],
driverPace:car.driverPace??profile?.pace??76+(index*7 % 13),
driverRacecraft:car.driverRacecraft??profile?.racecraft??75+(index*5 % 15),
driverTyreManagement:car.driverTyreManagement??profile?.tyreManagement??74+(index*3 % 16),
driverConsistency:car.driverConsistency??profile?.consistency??75+(index*11 % 14),
driverPotential:car.driverPotential??profile?.potential??78+(index*9 % 18),
battleMode:car.battleMode??"STANDARD",
fuelMode:car.fuelMode??"NORMAL",
};
});
if(migratedCars.length>=22)return{...saved,cars:migratedCars,rivalryHistory:saved.rivalryHistory??{}};
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
const nemesisConsistencyPenalty=car.playerCar&&state.mode==='championship'&&state.nemesisTarget==='consistency'&&state.nemesisTeam?0.16:0;
 const noise=(random(state)- 0.5)*(0.85+nemesisConsistencyPenalty)*consistencyNoise;
const racecraftBonus=(car.driverRacecraft - 80)*0.009;
const baseRivalPace=car.playerCar?1:car.rivalStyle==='qualifying-ace'?0.991:car.rivalStyle==='aggressive-racer'?0.986:car.rivalStyle==='high-risk-attacker'?0.981:car.rivalStyle==='defensive-specialist'&&state.cars.some((other)=>other.playerCar&&Math.abs(other.progress-car.progress)<0.055)?0.99:car.rivalStyle==='development-team'&&state.weekendNumber>=8?0.988:car.rivalStyle==='opportunist'&&state.safetyCarActive?0.975:1;
 const nemesisEngaged=!car.playerCar&&state.mode==='championship'&&car.team===state.nemesisTeam;
 const nemesisPaceFactor=nemesisEngaged?(state.nemesisShowdown?0.965:state.nemesisTarget==='pace'?0.975:0.985):1;
 const nemesisCloseAttack=nemesisEngaged&&state.nemesisTarget==='racecraft'&&state.cars.some((other)=>other.playerCar&&Math.abs(other.progress-car.progress)<0.055)?0.99:1;
 const rivalPace=baseRivalPace*nemesisPaceFactor*nemesisCloseAttack;
const rivalryPressure=!car.playerCar?Math.min(0.012,(state.rivalryBattles?.[car.team]??0)*0.003):0;
const safetyCarFactor=state.safetyCarActive?1.34:1;
const traits=state.buildTraits??[];
const traitPaceFactor=car.playerCar?(traits.includes("risk-reward")?0.985:1)*(traits.includes("reliability-first")?1.003:1):1;
const weekendPaceFactor=state.weekendEffect==="wet-prepared"?(car.playerCar?0.975:1.012):state.weekendEffect==="wet-unprepared"?(car.playerCar?1.025:1):state.weekendEffect==="directive-compliant"?(car.playerCar?1.006:1):state.weekendEffect==="directive-restricted"?(car.playerCar?1.018:1):state.weekendEffect==="feud-attack"?(car.playerCar?0.982:car.team===state.rivalryFeudTeam?1.025:1):state.weekendEffect==="feud-composed"?(car.playerCar?0.995:car.team===state.rivalryFeudTeam?1.01:1):1;
const mutatorPaceFactor=state.runMutator==="power-surge"&&car.playerCar?0.985:state.runMutator==="rival-rush"&&!car.playerCar?0.985:1;
const rivalAhead=state.cars.some((other)=>!other.finished&&other.id!==car.id&&other.progress>car.progress&&other.progress-car.progress<0.065);
const rivalBehind=state.cars.some((other)=>!other.finished&&other.id!==car.id&&other.progress<car.progress&&car.progress-other.progress<0.045);
const battlePaceFactor=car.battleMode==="OVERTAKE"&&rivalAhead?0.978:car.battleMode==="DEFEND"&&rivalBehind?0.99:1;
const fuelPaceFactor=car.fuelMode==="DEPLOY"?0.985:car.fuelMode==="SAVE"?1.012:1;
const lapSeconds=Math.max(85,car.lapTime*(state.circuitLengthFactor??1)*PACE_FACTOR[car.pace]*TYRE_PACE_FACTOR[car.tyre]*safetyCarFactor*traitPaceFactor*rivalPace*(1-rivalryPressure)*weekendPaceFactor*mutatorPaceFactor*battlePaceFactor*fuelPaceFactor+tyrePenalty+fuelPenalty+reliabilityPenalty - upgradeBonus - racecraftBonus+noise);
car.lastLap=lapSeconds;
car.bestLap=car.bestLap===0?lapSeconds:Math.min(car.bestLap,lapSeconds);
const previousProgress=car.progress;
const progressDelta=5 / lapSeconds;
car.progress+=progressDelta;
const driverTyreCare=Math.max(0.72,1 -(car.driverTyreManagement - 80)*0.004);
const traitWearFactor=car.playerCar?((state.buildTraits??[]).includes("tyre-saver")?0.85:1)*((state.buildTraits??[]).includes("risk-reward")?1.18:1)*((state.buildTraits??[]).includes("reliability-first")?0.72:1)*(state.mode==="championship"&&state.nemesisTarget==="tyre-management"&&state.nemesisTeam?1.08:1):car.rivalStyle==="tyre-specialist"?0.78:car.rivalStyle==="aggressive-racer"?1.22:car.rivalStyle==="high-risk-attacker"?1.32:1;
const wearReduction=(car.playerCar?Math.max(0.65,1 -(state.upgradeModules?.suspension??0)*0.06):1)*driverTyreCare*traitWearFactor;
const aeroTyreLoad=car.playerCar?1+(state.upgradeModules?.aero??0)*0.025:1;
const enduranceWearBonus=car.playerCar&&modules.suspension>=2&&modules.reliability>=2?0.9:1;
const strategyWear=(car.pace==="PUSH"?0.095:car.pace==="CONSERVE"?0.05:0.07)*(car.battleMode==="OVERTAKE"&&rivalAhead?1.16:1);
const weekendWearFactor=state.weekendEffect==="wet-prepared"?0.92:state.weekendEffect==="parts-shortage"?1.08:1;
const mutatorWearFactor=state.runMutator==="tyre-stress"?((state.buildTraits??[]).includes("tyre-saver")?1.05:1.25):1;
car.tyreWear=Math.min(1,car.tyreWear+strategyWear*TYRE_WEAR_RATE[car.tyre]*progressDelta*wearReduction*aeroTyreLoad*enduranceWearBonus*weekendWearFactor*mutatorWearFactor*(state.safetyCarActive?0.42:1));
const powerFuelLoad=car.playerCar?1+(state.upgradeModules?.power??0)*0.025:1;
const fuelModeFactor=car.fuelMode==="DEPLOY"?1.22:car.fuelMode==="SAVE"?0.68:1;
car.fuel=Math.max(0,car.fuel -(car.pace==="PUSH"?0.78:car.pace==="CONSERVE"?0.53:0.65)*progressDelta*powerFuelLoad*fuelModeFactor*(state.safetyCarActive?0.5:1));
const reliabilityProtection=car.playerCar?Math.min(0.75,(state.upgradeModules?.reliability??0)*0.005):0;
const enduranceConditionBonus=car.playerCar&&modules.suspension>=2&&modules.reliability>=2?0.9:1;
const traitConditionFactor=car.playerCar?((state.buildTraits??[]).includes("risk-reward")?1.8:1)*((state.buildTraits??[]).includes("reliability-first")?0.65:1):1;
const mutatorConditionFactor=car.playerCar&&state.runMutator==="fragile-components"?((state.buildTraits??[]).includes("reliability-first")?1.2:1.55):1;
const rivalCondition=!car.playerCar&&car.rivalStyle==="reliability-leader"?0.48:!car.playerCar&&car.rivalStyle==="high-risk-attacker"?1.7:1;
const weekendConditionFactor=state.weekendEffect==="spares-secured"?0.55:state.weekendEffect==="parts-shortage"?1.8:1;
car.condition=Math.max(62,car.condition - 0.002*(1 - reliabilityProtection)*enduranceConditionBonus*traitConditionFactor*mutatorConditionFactor*rivalCondition*weekendConditionFactor);
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
state.rivalryBattles??={};
const playerPosition=state.cars.findIndex((car)=>car.playerCar)+1;
const beatenTeams=new Set<string>();
for(const rival of state.cars.filter((car)=>!car.playerCar)){
const rivalPosition=state.cars.findIndex((car)=>car.team===rival.team)+1;
if(playerPosition>0&&rivalPosition>playerPosition)beatenTeams.add(rival.team);
}
const rivalTeams=[...new Set(state.cars.filter((car)=>!car.playerCar).map((car)=>car.team))];
for(const team of rivalTeams){
if(beatenTeams.has(team)){
state.rivalryWins[team]=(state.rivalryWins[team]??0)+1;
state.rivalryBattles![team]=Math.min(10,(state.rivalryBattles![team]??0)+1);
}else state.rivalryBattles![team]=0;
const rivalPosition=state.cars.findIndex((car)=>car.team===team)+1;
state.rivalryHistory??={};
state.rivalryHistory[team]=[...(state.rivalryHistory[team]??[]),rivalPosition].slice(-5);
}
const mostMotivated=rivalTeams.map((team)=>({team,streak:state.rivalryBattles![team]??0})).sort((a,b)=>b.streak-a.streak)[0];
if(mostMotivated&&mostMotivated.streak>=2)addEvent(state,"RIVALRY ALERT — "+mostMotivated.team+" have lost "+mostMotivated.streak+" straight battles to your team. Their engineers are targeting you next weekend.","warning");
if(state.rivalryFeudTeam&&beatenTeams.has(state.rivalryFeudTeam)){
const feudBonus=state.rivalryFeudBonus??100000;
state.cash+=feudBonus;
addEvent(state,"NEMESIS DEFEATED — "+state.rivalryFeudTeam+" finally fall to your team. Rivalry sponsors award RM"+feudBonus.toLocaleString("en-MY")+".","finish");
state.rivalryFeudTeam=undefined;
state.rivalryFeudBonus=undefined;
}
if(!state.rivalryFeudTeam&&mostMotivated&&mostMotivated.streak>=3){
state.rivalryFeudTeam=mostMotivated.team;
state.rivalryFeudBonus=100000;
const feudStyle=RIVAL_STYLE_BY_TEAM[mostMotivated.team];
const feudStory=feudStyle==="qualifying-ace"?"Their qualifying group vows to outpace you next weekend.":feudStyle==="aggressive-racer"||feudStyle==="high-risk-attacker"?"Their drivers promise an all-out attack next weekend.":feudStyle==="strategy-gambler"||feudStyle==="opportunist"?"Their strategists are preparing a counter-punch in the pit lane.":feudStyle==="tyre-specialist"?"Their engineers are building a tyre strategy specifically to beat you.":"Their principal has made beating your team the next priority.";
addEvent(state,"FEUD IGNITED — "+mostMotivated.team+" are now your nemesis. "+feudStory+" Beat them in a future race for a RM100,000 rivalry reward.","warning");
}
if((state.mode??"championship")==="championship"&&state.championshipObjective){
const objective=state.championshipObjective;
const playerPositions=state.cars.map((car,index)=>({car,position:index+1})).filter((entry)=>entry.car.playerCar).map((entry)=>entry.position);
const objectiveComplete=objective.id==="score-points"?playerPosition<=10:objective.id==="podium"?playerPosition<=3:objective.id==="double-points"?playerPositions.length>=2&&playerPositions.every((position)=>position<=10):!!objective.targetTeam&&beatenTeams.has(objective.targetTeam);
objective.completed=objectiveComplete;
if(objectiveComplete){
state.cash+=objective.reward;
state.teamReputation=Math.min(100,(state.teamReputation??45)+3);
state.teamMorale=Math.min(100,(state.teamMorale??62)+4);
addEvent(state,"CHAMPIONSHIP OBJECTIVE COMPLETE — "+objective.title+". Board confidence rises; reward: RM"+objective.reward.toLocaleString("en-MY")+".","finish");
}else{
addEvent(state,"CHAMPIONSHIP OBJECTIVE MISSED — "+objective.title+". The board expected a stronger result this weekend.","warning");
}
}
const rivalryBonus=Math.min(150000,beatenTeams.size*15000);
if(rivalryBonus>0){state.cash+=rivalryBonus;addEvent(state,"Rivalry bonus: "+beatenTeams.size+" rival teams beaten. Commercial partners add RM"+rivalryBonus.toLocaleString("en-MY")+".","info");}
state.cars.forEach((car,index)=>{
const points=POINTS_BY_POSITION[index]??0;
state.teamPoints![car.team]=(state.teamPoints![car.team]??0)+points;
});
state.latestChampionshipAchievements=[];
if((state.mode??"championship")==="championship"){
const playerPoints=POINTS_BY_POSITION[playerPosition-1]??0;
state.championshipRaceResults=[...(state.championshipRaceResults??[]),{round:state.weekendNumber,position:playerPosition,points:playerPoints}];
state.championshipAchievements??=[];
const results=state.championshipRaceResults;
const pointsFinishes=results.filter((result)=>result.position>0&&result.position<=10).length;
const lastThree=results.slice(-3);
const playerTeam=state.playerTeamName??state.cars.find((car)=>car.playerCar)?.team??"Redline GP";
const championshipOrder=Object.entries(state.teamPoints!).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
const seasonPosition=championshipOrder.findIndex(([team])=>team===playerTeam)+1;
const eligible=[
{...CHAMPIONSHIP_ACHIEVEMENTS[0],unlocked:playerPosition<=10},
{...CHAMPIONSHIP_ACHIEVEMENTS[1],unlocked:playerPosition<=3},
{...CHAMPIONSHIP_ACHIEVEMENTS[2],unlocked:playerPosition===1},
{...CHAMPIONSHIP_ACHIEVEMENTS[3],unlocked:pointsFinishes>=5},
{...CHAMPIONSHIP_ACHIEVEMENTS[4],unlocked:lastThree.length===3&&lastThree.every((result)=>result.position<=10)},
{...CHAMPIONSHIP_ACHIEVEMENTS[5],unlocked:(state.teamPoints![playerTeam]??0)>=100},
{...CHAMPIONSHIP_ACHIEVEMENTS[6],unlocked:state.weekendNumber>=CAMPAIGN_LENGTH&&seasonPosition<=3},
{...CHAMPIONSHIP_ACHIEVEMENTS[7],unlocked:state.weekendNumber>=CAMPAIGN_LENGTH&&seasonPosition===1},
];
for(const achievement of eligible){
if(achievement.unlocked&&!state.championshipAchievements.includes(achievement.id)){
const unlocked:ChampionshipAchievement={id:achievement.id,title:achievement.title,detail:achievement.description,round:state.weekendNumber,cashReward:achievement.cashReward,researchReward:achievement.researchReward};
state.championshipAchievements.push(achievement.id);
state.latestChampionshipAchievements.push(unlocked);
state.cash+=achievement.cashReward;
addEvent(state,"ACHIEVEMENT UNLOCKED — "+achievement.title+". "+achievement.description+" Reward: RM"+achievement.cashReward.toLocaleString("en-MY")+" and "+achievement.researchReward+" Research Points.","finish");
}
}
}
if((state.mode??"championship")==="championship"&&state.weekendNumber%5===0&&!(state.championshipMilestones??[]).includes(state.weekendNumber)){
const playerTeam=state.playerTeamName??state.cars.find((car)=>car.playerCar)?.team??"Redline GP";
const championshipOrder=Object.entries(state.teamPoints!).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
const championshipPosition=championshipOrder.findIndex(([team])=>team===playerTeam)+1;
const standingReward=championshipPosition===1?250000:championshipPosition<=3?175000:championshipPosition<=5?125000:championshipPosition<=10?75000:35000;
const raceWinBonus=playerPosition===1?75000:0;
const reward=standingReward+raceWinBonus;
const title=state.weekendNumber===CAMPAIGN_LENGTH?"SEASON FINALE MILESTONE":"ROUND "+state.weekendNumber+" CHAMPIONSHIP MILESTONE";
const standingLabel=championshipPosition===1?"leading the championship":championshipPosition<=3?"inside the championship top three":championshipPosition<=5?"inside the championship top five":championshipPosition<=10?"inside the championship points top ten":"outside the current championship top ten";
const detail="Your team is "+standingLabel+". "+(raceWinBonus?"Race victory bonus included. ":"")+"Milestone commercial reward secured.";
state.cash+=reward;
state.championshipMilestones=[...(state.championshipMilestones??[]),state.weekendNumber];
state.latestChampionshipMilestone={round:state.weekendNumber,title,detail,reward,position:championshipPosition};
addEvent(state,"CHAMPIONSHIP MILESTONE — "+title+". Championship position: P"+championshipPosition+". Commercial partners award RM"+reward.toLocaleString("en-MY")+".","finish");
}
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
action:Pace|"PIT"|"OVERTAKE"|"DEFEND"|"FUEL_SAVE";
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
const behind=state.cars.filter((item)=>!item.finished&&item.id!==car.id&&item.progress<car.progress).sort((a,b)=>b.progress-a.progress)[0];
const gapBehind=behind?car.progress-behind.progress:Infinity;
const canPit=car.pitStops===0&&remainingLaps>1.2;
if(canPit&&state.safetyCarActive&&car.tyreWear>=0.3){
return{headline:"Use the safety-car window",reason:"The field is neutralised, so this is a lower-loss opportunity to change tyres before green-flag running resumes.",action:"PIT",actionLabel:"PIT NEXT LAP"};
}
if(canPit&&car.tyreWear>=0.8){
return{headline:"Tyres are past their peak",reason:"Heavy wear is costing lap time. A stop is likely to recover more pace than extending this stint.",action:"PIT",actionLabel:"PIT NEXT LAP"};
}
if(car.fuel<=14&&car.fuelMode!=="SAVE"){
return{headline:"Protect the fuel margin",reason:"Fuel is running low. Fuel Save cuts consumption beyond the normal pace setting, trading a little lap time for a safer finish.",action:"FUEL_SAVE",actionLabel:"SAVE FUEL"};
}
if(car.tyreWear>=0.64){
return{headline:"Manage the tyre drop-off",reason:"Tyre wear is entering the steep degradation range. Conserve pace can keep the stint competitive for longer.",action:"CONSERVE",actionLabel:"SAVE THE TYRES"};
}
if(gapAhead<0.035&&car.fuel>22&&car.tyreWear<0.62&&car.battleMode!=="OVERTAKE"){
return{headline:"Attack the car ahead",reason:"A rival is within striking distance. Overtake mode adds a short-burst pace advantage in traffic, but increases tyre wear while fighting.",action:"OVERTAKE",actionLabel:"OVERTAKE"};
}
if(gapBehind<0.035&&car.battleMode!=="DEFEND"){
return{headline:"Rival is entering attack range",reason:"A car behind is close enough to threaten track position. Defend mode prioritises holding the line when a rival is within range.",action:"DEFEND",actionLabel:"DEFEND POSITION"};
}
if(car.pace==="PUSH"&&(car.tyreWear>=0.42||car.fuel<32)){
return{headline:"Reset to sustainable pace",reason:"The current push is consuming a meaningful resource margin. Balanced running protects the stint without fully giving up pace.",action:"BALANCED",actionLabel:"BALANCE PACE"};
}
if(remainingLaps>2&&car.tyreWear<0.25&&car.fuel>55&&car.pace!=="PUSH"){
return{headline:"There is room to push",reason:"Tyre life and fuel are healthy. A short push phase could gain time before the next strategy decision.",action:"PUSH",actionLabel:"PUSH FOR PACE"};
}
return{headline:"Hold a balanced stint",reason:"Current tyre and fuel levels do not justify a more aggressive call. Reassess as traffic, wear and fuel margins change.",action:"BALANCED",actionLabel:"SET BALANCED"};
}
export function setDriverStrategy(state:RaceState,carId:string,patch:Partial<Pick<CarState,"pace"|"nextTyre"|"pitLap"|"battleMode"|"fuelMode">>):RaceState{
const next=structuredClone(state);
const car=next.cars.find((item)=>item.id===carId);
if(!car||!car.playerCar||next.status==="finished")return state;
Object.assign(car,patch);
if(patch.pace)addEvent(next,car.driver+" switches to "+patch.pace.toLowerCase()+" pace: "+(patch.pace==="PUSH"?"more speed, higher tyre wear and fuel use.":patch.pace==="CONSERVE"?"protecting tyres and fuel at the cost of lap time.":"balanced pace and resource use."));
else if(patch.nextTyre)addEvent(next,car.driver+" will fit "+patch.nextTyre.toLowerCase()+" tyres at the next stop.");
else if(patch.pitLap)addEvent(next,car.driver+" pit window moved to lap "+patch.pitLap+".");
else if(patch.battleMode)addEvent(next,car.driver+" switches racecraft to "+patch.battleMode.toLowerCase()+".");
else if(patch.fuelMode)addEvent(next,car.driver+" switches fuel deployment to "+patch.fuelMode.toLowerCase()+".");
return next;
}
function activateUpgradeEvolutions(state:RaceState):RaceState{
const installedIds=new Set((state.installedUpgrades??[]).map((upgrade)=>upgrade.id));
const active=new Set(state.activeEvolutions??[]);
for(const evolution of UPGRADE_EVOLUTIONS){
if(active.has(evolution.id)||!evolution.requiredUpgradeIds.every((id)=>installedIds.has(id)))continue;
state.upgradeModules??={aero:0,power:0,suspension:0,reliability:0};
if(evolution.moduleBonus){
state.upgradeModules.aero+=evolution.moduleBonus.aero??0;
state.upgradeModules.power+=evolution.moduleBonus.power??0;
state.upgradeModules.suspension+=evolution.moduleBonus.suspension??0;
state.upgradeModules.reliability+=evolution.moduleBonus.reliability??0;
}
if(evolution.cashBonus)state.cash+=evolution.cashBonus;
active.add(evolution.id);
addEvent(state,"TECH EVOLUTION UNLOCKED: "+evolution.title+". "+evolution.rewardText,"info");
}
state.activeEvolutions=[...active];
return state;
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
activateUpgradeEvolutions(next);
next.upgradeLevel=1;
addEvent(next,"Pre-season development pick: "+card.title+". "+card.effect);
return next;
}
export function upgradeCar(state:RaceState,cardId:string):RaceState{
if(state.status!=="finished")return state;
const previouslyActiveEvolutions=new Set(state.activeEvolutions??[]);
const card=draftUpgradeCards(state).find((item)=>item.id===cardId);
if(!card)return state;
const next=structuredClone(state);
next.upgradeModules??={aero:0,power:0,suspension:0,reliability:0};
if(card.upgradeType&&card.amount)next.upgradeModules[card.upgradeType]+=card.amount;
if(card.cashBonus)next.cash+=card.cashBonus;
next.installedUpgrades=[...(next.installedUpgrades??[]),{id:card.id,title:card.title,subtitle:card.subtitle,rarity:card.rarity,effect:card.effect,upgradeType:card.upgradeType,amount:card.amount,cashBonus:card.cashBonus}];
if(card.trait)next.buildTraits=[...new Set([...(next.buildTraits??[]),card.trait])];
activateUpgradeEvolutions(next);
next.upgradeLevel+=1;
next.weekendNumber+=1;next.latestChampionshipMilestone=undefined;next.latestChampionshipAchievements=[];next.status="ready";next.lap=1;next.elapsedSeconds=0;
next.seed=(next.seed+947)>>>0;next.eventSequence=0;next.events=[];
const fresh=createRace(next.seed,next.upgradeLevel,next.cash,next.weekendNumber,next.playerTeamName??next.cars.find((car)=>car.playerCar)?.team??"Redline GP",next.cars.find((car)=>car.id==="rp-1")?.driver??"Alex Mercer",next.cars.find((car)=>car.id==="rp-2")?.driver??"Mika Tanaka",next.playerPrincipalName??"Team Principal");
next.cars=fresh.cars;
next.cars.forEach((car)=>{car.condition=Math.max(72,car.condition -(car.playerCar?2.5:0));if(car.playerCar){car.tyre="MEDIUM";car.nextTyre="HARD";car.tyreWear=0.02;car.fuel=100;car.pitLap=7;}});
addEvent(next,"Weekend "+(next.weekendNumber - 1)+": drafted "+card.title+". "+card.effect);
for(const evolutionId of next.activeEvolutions??[]){if(previouslyActiveEvolutions.has(evolutionId))continue;const evolution=UPGRADE_EVOLUTIONS.find((item)=>item.id===evolutionId);if(evolution)addEvent(next,"TECH EVOLUTION UNLOCKED: "+evolution.title+". "+evolution.rewardText,"info");}
return next;
}
export function standings(state:RaceState):CarState[]{return[...state.cars].sort((a,b)=>{if(a.finished&&b.finished)return(a.finishTime??Infinity)-(b.finishTime??Infinity);if(a.finished)return -1;if(b.finished)return 1;return b.progress - a.progress;});}
export function formatLapTime(seconds:number):string{
if(!seconds||!Number.isFinite(seconds))return "—";
const minutes=Math.floor(seconds / 60);
return minutes+":"+(seconds % 60).toFixed(3).padStart(6,"0");
}
