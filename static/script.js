
"use strict";

const State = {
  rows:20,cols:30,grid:[],startCell:null,endCell:null,
  drawMode:"start",weightValue:3,isMouseDown:false,isRunning:false,
  animSpeed:60,animateEnabled:true,algorithm:"astar",heuristic:"manhattan",
  animQueue:[],
};

const D = {
  gridContainer:  ()=>document.getElementById("grid-container"),
  gridStatus:     ()=>document.getElementById("grid-status"),
  gridCoords:     ()=>document.getElementById("grid-coords"),
  toast:          ()=>document.getElementById("toast"),
  rows:           ()=>document.getElementById("inp-rows"),
  cols:           ()=>document.getElementById("inp-cols"),
  speedSlider:    ()=>document.getElementById("speed-slider"),
  speedDisplay:   ()=>document.getElementById("speed-display"),
  weightSlider:   ()=>document.getElementById("weight-value"),
  weightDisplay:  ()=>document.getElementById("weight-display"),
  weightSelector: ()=>document.getElementById("weight-selector"),
  animToggle:     ()=>document.getElementById("animate-toggle"),
  btnRun:         ()=>document.getElementById("btn-run"),
  btnClearPath:   ()=>document.getElementById("btn-clear-path"),
  btnReset:       ()=>document.getElementById("btn-reset"),
  btnNewGrid:     ()=>document.getElementById("btn-new-grid"),
  btnMaze:        ()=>document.getElementById("btn-random-maze"),
  compareSection: ()=>document.getElementById("compare-section"),
  heuristicSection:()=>document.getElementById("heuristic-section"),
  resultsBox:     ()=>document.getElementById("results-box"),
  statOpen:       ()=>document.getElementById("stat-open"),
  statClosed:     ()=>document.getElementById("stat-closed"),
  statPath:       ()=>document.getElementById("stat-path"),
  statCost:       ()=>document.getElementById("stat-cost"),
};

document.addEventListener("DOMContentLoaded", ()=>{
  bindControls();
  generateGrid(State.rows, State.cols);
  setDefaultStartEnd();
});

function generateGrid(rows, cols){
  State.rows=rows; State.cols=cols;
  State.grid=Array.from({length:rows},()=>Array(cols).fill(0));
  State.startCell=null; State.endCell=null;
  renderGrid(); clearStats();
  D.resultsBox().innerHTML='<p class="results-placeholder">Run an algorithm to see results here.</p>';
  D.compareSection().style.display="none";
  setStatus("Click a cell to place Start \u2192 then End \u2192 draw walls or weights");
}

function renderGrid(){
  const c=D.gridContainer(); c.innerHTML="";
  c.style.gridTemplateColumns=`repeat(${State.cols},var(--cell-size))`;
  c.style.gridTemplateRows=`repeat(${State.rows},var(--cell-size))`;
  for(let r=0;r<State.rows;r++){
    for(let col=0;col<State.cols;col++){
      const el=document.createElement("div");
      el.className="cell"; el.dataset.r=r; el.dataset.c=col;
      applyClassFromGrid(el,r,col);
      el.addEventListener("mousedown",onCellMouseDown);
      el.addEventListener("mouseenter",onCellMouseEnter);
      el.addEventListener("mouseup",()=>{State.isMouseDown=false;});
      c.appendChild(el);
    }
  }
  document.addEventListener("mouseup",()=>{State.isMouseDown=false;});
}

function getCellEl(r,c){
  return D.gridContainer().querySelector(`[data-r="${r}"][data-c="${c}"]`);
}

function applyClassFromGrid(el,r,c){
  const v=State.grid[r][c]; el.className="cell"; el.innerHTML="";
  if(State.startCell&&State.startCell[0]===r&&State.startCell[1]===c) el.classList.add("start");
  else if(State.endCell&&State.endCell[0]===r&&State.endCell[1]===c) el.classList.add("end");
  else if(v===1) el.classList.add("wall");
  else if(v>=2){
    el.classList.add(`weight-${Math.min(v,9)}`);
    const lbl=document.createElement("span");
    lbl.className="weight-label"; lbl.textContent=v; el.appendChild(lbl);
  }
}

function setDefaultStartEnd(){
  const r1=Math.floor(State.rows/2),c1=2;
  const r2=Math.floor(State.rows/2),c2=State.cols-3;
  placeSpecial("start",r1,c1); placeSpecial("end",r2,c2);
  State.drawMode="wall"; updateModeButtons();
  setStatus("Draw walls, then click \u25BA Run Algorithm");
}

function onCellMouseDown(e){
  if(State.isRunning) return;
  e.preventDefault(); State.isMouseDown=true;
  handleCellAction(+e.target.dataset.r,+e.target.dataset.c);
}

function onCellMouseEnter(e){
  if(State.isRunning||!State.isMouseDown) return;
  if(State.drawMode==="start"||State.drawMode==="end") return;
  handleCellAction(+e.target.dataset.r,+e.target.dataset.c);
  D.gridCoords().textContent=`[${e.target.dataset.r},${e.target.dataset.c}]`;
}

function handleCellAction(r,c){
  const m=State.drawMode;
  if(m==="start"){ placeSpecial("start",r,c); setStatus("Start placed."); }
  else if(m==="end"){ placeSpecial("end",r,c); setStatus("End placed. Run algorithm."); }
  else if(m==="wall"){
    if(isSpecial(r,c)) return;
    State.grid[r][c]=1;
    const el=getCellEl(r,c); el.className="cell wall"; el.innerHTML="";
  } else if(m==="weight"){
    if(isSpecial(r,c)) return;
    State.grid[r][c]=State.weightValue;
    applyClassFromGrid(getCellEl(r,c),r,c);
  } else if(m==="erase"){
    if(isSpecial(r,c)) return;
    State.grid[r][c]=0;
    const el=getCellEl(r,c); el.className="cell"; el.innerHTML="";
  }
}

function isSpecial(r,c){
  if(State.startCell&&State.startCell[0]===r&&State.startCell[1]===c) return true;
  if(State.endCell&&State.endCell[0]===r&&State.endCell[1]===c) return true;
  return false;
}

function placeSpecial(type,r,c){
  const old=type==="start"?State.startCell:State.endCell;
  if(old){const oe=getCellEl(old[0],old[1]);if(oe)applyClassFromGrid(oe,old[0],old[1]);}
  if(type==="start") State.startCell=[r,c]; else State.endCell=[r,c];
  State.grid[r][c]=0;
  const el=getCellEl(r,c);
  if(el){el.className=`cell ${type}`;el.innerHTML="";}
}

async function runAlgorithm(){
  if(State.isRunning) return;
  if(!State.startCell||!State.endCell){showToast("Set both Start and End cells!","error");return;}
  clearPath(); cancelAnimation();
  State.isRunning=true; document.body.classList.add("running");
  D.btnRun().textContent="\u23F3 Running\u2026";
  const payload={grid:State.grid,start:State.startCell,end:State.endCell,heuristic:State.heuristic};
  try{
    if(State.algorithm==="compare"){ await runCompare(payload); }
    else{
      const res=await fetch(`/${State.algorithm}`,{method:"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json();
      await animateResult(data); renderSingleResult(data);
      D.compareSection().style.display="none";
    }
  } catch(err){ showToast("Server error: "+err.message,"error"); console.error(err); }
  finally{
    State.isRunning=false; document.body.classList.remove("running");
    D.btnRun().textContent="\u25BA Run Algorithm";
  }
}

async function animateResult(data){
  const vo=data.visited_order||[]; const path=data.path||[];
  if(State.animateEnabled){
    await animateCells(vo,"closed",State.animSpeed);
    await animateCells(path,"path",Math.max(20,State.animSpeed*2));
  } else { paintCells(vo,"closed"); paintCells(path,"path"); }
  restampSpecial();
  D.statOpen().textContent=(data.open_set_order||[]).length;
  D.statClosed().textContent=vo.length;
  D.statPath().textContent=path.length;
  D.statCost().textContent=data.cost||0;
  if(!data.found){showToast("No path found! Remove some walls.","warn");setStatus("\u274C No path found.");}
  else{setStatus(`\u2705 Path found! Cost: ${data.cost} | Nodes: ${data.nodes_explored}`);showToast(`Path found in ${data.execution_time_ms} ms`,"success");}
}

function animateCells(cells,cls,delay){
  return new Promise(resolve=>{
    let i=0;
    function step(){
      if(i>=cells.length){resolve();return;}
      const [r,c]=cells[i++];
      if(!isSpecial(r,c)){const el=getCellEl(r,c);if(el)el.classList.add(cls);}
      const tid=setTimeout(step,delay); State.animQueue.push(tid);
    }
    step();
  });
}

function paintCells(cells,cls){
  cells.forEach(([r,c])=>{if(!isSpecial(r,c)){const el=getCellEl(r,c);if(el)el.classList.add(cls);}});
}

function restampSpecial(){
  if(State.startCell){const el=getCellEl(...State.startCell);if(el){el.className="cell start";el.innerHTML="";}}
  if(State.endCell){const el=getCellEl(...State.endCell);if(el){el.className="cell end";el.innerHTML="";}}
}

async function runCompare(payload){
  const res=await fetch("/compare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json();
  const ad=data.astar;
  if(ad){
    if(State.animateEnabled){
      await animateCells(ad.visited_order||[],"closed",State.animSpeed);
      await animateCells(ad.path||[],"path",Math.max(20,State.animSpeed*2));
    } else { paintCells(ad.visited_order||[],"closed"); paintCells(ad.path||[],"path"); }
    restampSpecial();
  }
  renderCompareTable(data); renderCompareBars(data);
  D.compareSection().style.display="block";
  D.resultsBox().innerHTML='<p class="results-placeholder">See comparison table \u2192</p>';
  setStatus("Algorithm comparison complete."); showToast("Comparison complete!","success");
}

function renderCompareTable(data){
  ["astar","dijkstra","bfs"].forEach(a=>{
    const d=data[a]||{};
    document.getElementById(`cmp-${a}-found`).textContent=d.found?"\u2705 Yes":"\u274C No";
    document.getElementById(`cmp-${a}-cost`).textContent=d.cost??"—";
    document.getElementById(`cmp-${a}-nodes`).textContent=d.nodes_explored??"—";
    document.getElementById(`cmp-${a}-len`).textContent=(d.path||[]).length;
    document.getElementById(`cmp-${a}-time`).textContent=d.execution_time_ms!=null?d.execution_time_ms+" ms":"—";
  });
}

function renderCompareBars(data){
  const c=document.getElementById("compare-bars"); c.innerHTML="";
  const metrics=[
    {label:"Nodes Explored",key:"nodes_explored",colors:["#00f5d4","#4d79ff","#9c6dff"]},
    {label:"Path Cost",key:"cost",colors:["#00f5d4","#4d79ff","#9c6dff"]},
  ];
  metrics.forEach(m=>{
    const vals=["astar","dijkstra","bfs"].map(a=>(data[a]||{})[m.key]||0);
    const mx=Math.max(...vals,1);
    const grp=document.createElement("div"); grp.className="bar-group";
    const lbl=document.createElement("div"); lbl.className="bar-label"; lbl.textContent=m.label;
    grp.appendChild(lbl);
    ["A*","Dijkstra","BFS"].forEach((name,i)=>{
      const row=document.createElement("div");
      row.style.cssText="display:flex;align-items:center;gap:6px;margin-bottom:3px";
      const ne=document.createElement("span");
      ne.textContent=name;
      ne.style.cssText=`font-family:var(--font-mono);font-size:.58rem;color:${m.colors[i]};width:50px`;
      const tr=document.createElement("div"); tr.className="bar-track"; tr.style.flex="1";
      const fl=document.createElement("div"); fl.className="bar-fill";
      fl.style.background=m.colors[i]; fl.style.width=`${(vals[i]/mx)*100}%`;
      tr.appendChild(fl); row.appendChild(ne); row.appendChild(tr); grp.appendChild(row);
    });
    c.appendChild(grp);
  });
}

function renderSingleResult(data){
  const box=D.resultsBox();
  if(!data){box.innerHTML='<p class="results-placeholder">No data.</p>';return;}
  const rows=[
    ["Algorithm",data.algorithm||"—"],
    ["Path Found",data.found?"\u2705 Yes":"\u274C No"],
    ["Total Cost",data.cost??"—"],
    ["Nodes Explored",data.nodes_explored??"—"],
    ["Path Length",(data.path||[]).length],
    ["Exec Time",(data.execution_time_ms??"—")+" ms"],
  ];
  box.innerHTML=rows.map(([lbl,val])=>{
    const cls=val==="\u2705 Yes"?"found":val==="\u274C No"?"notfound":"";
    return `<div class="result-row"><span class="result-label">${lbl}</span><span class="result-val ${cls}">${val}</span></div>`;
  }).join("");
}

function clearPath(){
  cancelAnimation();
  D.gridContainer().querySelectorAll(".cell").forEach(el=>{el.classList.remove("open","closed","path");});
  restampSpecial(); clearStats();
}

function resetGrid(){ cancelAnimation(); generateGrid(State.rows,State.cols); setDefaultStartEnd(); }

function cancelAnimation(){ State.animQueue.forEach(t=>clearTimeout(t)); State.animQueue=[]; }

function clearStats(){
  ["stat-open","stat-closed","stat-path","stat-cost"].forEach(id=>{document.getElementById(id).textContent="0";});
}

function generateMaze(){
  cancelAnimation(); clearPath();
  for(let r=0;r<State.rows;r++) for(let c=0;c<State.cols;c++) State.grid[r][c]=1;
  carve(1,1);
  if(State.startCell) clearArea(...State.startCell);
  if(State.endCell)   clearArea(...State.endCell);
  renderGrid(); restampSpecial();
  setStatus("Maze generated! Click \u25BA Run Algorithm."); showToast("Maze ready!","success");
}

function carve(r,c){
  const dirs=shuffle([[-2,0],[2,0],[0,-2],[0,2]]); State.grid[r][c]=0;
  for(const [dr,dc] of dirs){
    const nr=r+dr,nc=c+dc;
    if(nr>0&&nr<State.rows-1&&nc>0&&nc<State.cols-1&&State.grid[nr][nc]===1){
      State.grid[r+dr/2][c+dc/2]=0; carve(nr,nc);
    }
  }
}

function clearArea(r,c){
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<State.rows&&nc>=0&&nc<State.cols) State.grid[nr][nc]=0;
  }
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}

function bindControls(){
  D.btnNewGrid().addEventListener("click",()=>{
    const r=parseInt(D.rows().value,10),c=parseInt(D.cols().value,10);
    if(r<5||r>40||c<5||c>60){showToast("Rows:5-40, Cols:5-60","error");return;}
    generateGrid(r,c); setDefaultStartEnd();
  });
  D.btnRun().addEventListener("click",runAlgorithm);
  D.btnClearPath().addEventListener("click",clearPath);
  D.btnReset().addEventListener("click",resetGrid);
  D.btnMaze().addEventListener("click",generateMaze);
  document.querySelectorAll(".mode-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      State.drawMode=btn.dataset.mode; updateModeButtons();
      D.weightSelector().style.display=State.drawMode==="weight"?"block":"none";
    });
  });
  D.weightSlider().addEventListener("input",e=>{State.weightValue=+e.target.value;D.weightDisplay().textContent=State.weightValue;});
  D.speedSlider().addEventListener("input",e=>{
    State.animSpeed=Math.round(110-+e.target.value);
    D.speedDisplay().textContent=State.animSpeed+"ms";
  });
  D.animToggle().addEventListener("change",e=>{State.animateEnabled=e.target.checked;});
  document.querySelectorAll('input[name="algorithm"]').forEach(r=>{
    r.addEventListener("change",e=>{
      State.algorithm=e.target.value;
      const sh=State.algorithm==="astar"||State.algorithm==="compare";
      D.heuristicSection().style.display=sh?"block":"none";
    });
  });
  document.querySelectorAll('input[name="heuristic"]').forEach(r=>{
    r.addEventListener("change",e=>{State.heuristic=e.target.value;});
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="r"||e.key==="R") runAlgorithm();
    if(e.key==="c"||e.key==="C") clearPath();
    if(e.key==="Escape") resetGrid();
    if(e.key==="1") setMode("start");
    if(e.key==="2") setMode("end");
    if(e.key==="3") setMode("wall");
    if(e.key==="4") setMode("weight");
    if(e.key==="5") setMode("erase");
  });
}

function setMode(m){ State.drawMode=m; updateModeButtons(); D.weightSelector().style.display=m==="weight"?"block":"none"; }
function updateModeButtons(){ document.querySelectorAll(".mode-btn").forEach(b=>{b.classList.toggle("active",b.dataset.mode===State.drawMode);}); }

let _toastTimer=null;
function showToast(msg,type="info"){
  const t=D.toast(); t.textContent=msg; t.className=`toast ${type} show`;
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>{t.classList.remove("show");},3200);
}
function setStatus(msg){ D.gridStatus().textContent=msg; }
