const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(root+'/index.html','utf8');

class FakeClassList {
  constructor(){this.names=new Set();}
  toggle(name,force){if(force===undefined) force=!this.names.has(name); force?this.names.add(name):this.names.delete(name); return force;}
}
class FakeStyle {
  constructor(){this.values={};}
  setProperty(name,value){this.values[name]=String(value);}
}
class FakeElement {
  constructor(localName='div',id=''){
    this.nodeType=1;
    this.localName=localName;
    this.id=id;
    this.attributes={};
    this.dataset={};
    this.children=[];
    this.listeners={};
    this.style=new FakeStyle();
    this.classList=new FakeClassList();
    this.value='';
    this.checked=false;
    this.hidden=false;
    this.disabled=false;
    this.textContent='';
    this.parentElement=null;
    this.offsetWidth=794;
    this.offsetHeight=1123;
  }
  setAttribute(name,value){
    this.attributes[name]=String(value);
    if(name==='viewBox'){
      const [x,y,width,height]=String(value).trim().split(/\s+/).map(Number);
      this.viewBox={baseVal:{x,y,width,height}};
    }
  }
  getAttribute(name){return Object.prototype.hasOwnProperty.call(this.attributes,name)?this.attributes[name]:null;}
  removeAttribute(name){delete this.attributes[name];}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  appendChild(node){this.append(node);return node;}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  add(option){this.append(option);}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(item=>item!==this);}
  click(){this.dispatch('click');}
  addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
  dispatch(type){for(const listener of this.listeners[type]||[])listener({target:this});}
  querySelector(selector){return selector==='.control-label'?this.controlLabel:null;}
  querySelectorAll(selector){
    if(selector!=='line, path')return [];
    return this.children.filter(child=>child.localName==='line'||child.localName==='path');
  }
  get selectedOptions(){
    const selected=this.children.find(option=>option.value===this.value);
    return selected?[selected]:[];
  }
  getScreenCTM(){return this.localName==='svg'?{a:1,b:0,c:0,d:1,e:0,f:0}:svgTransformMatrix(this);}
  getCTM(){return this.getScreenCTM();}
}

const elements={};
for(const match of html.matchAll(/id="([^"]+)"/g)) elements[match[1]]=new FakeElement('div',match[1]);
const tags={paperSize:'select',orientation:'select',presetSelect:'select',favoriteSelect:'select',margin:'input',systems:'input',staffGap:'input',lineWeight:'input',fretboardFrets:'input',showTabLabel:'input',showTitle:'input',showDate:'input',staffSvg:'svg',paper:'article'};
for(const [id,tag] of Object.entries(tags)) elements[id].localName=tag;
elements.staffSvg.namespaceURI='http://www.w3.org/2000/svg';
Object.assign(elements.paperSize,{value:'a4'});
Object.assign(elements.orientation,{value:'portrait'});
Object.assign(elements.margin,{value:'15'});
Object.assign(elements.systems,{value:'10'});
Object.assign(elements.staffGap,{value:'22'});
Object.assign(elements.lineWeight,{value:'2'});
Object.assign(elements.fretboardFrets,{value:'15'});
elements.showTabLabel.checked=true;
elements.showTitle.checked=true;
elements.showDate.checked=true;
elements.paper.dataset={};
elements.barControls.controlLabel=new FakeElement('div');
const paperMeta=new FakeElement('div');
const paperWrap=new FakeElement('div');
const dataElements={};
for(const match of html.matchAll(/<button\b([^>]*)>/g)){
  const attrs=match[1];
  const dataMatch=attrs.match(/data-([a-z]+)="([^"]+)"/);
  if(!dataMatch)continue;
  const button=new FakeElement('button');
  button.dataset[dataMatch[1]]=dataMatch[2];
  (dataElements[dataMatch[1]]??=[]).push(button);
}
for(const match of html.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)){
  const option=new FakeElement('option');
  option.value=match[1];
  option.textContent=match[2];
  if(match[1] in {a4:1,b5:1,letter:1}) elements.paperSize.append(option);
  else if(match[1] in {portrait:1,landscape:1}) elements.orientation.append(option);
  else elements.presetSelect.append(option);
}
const head=new FakeElement('head');
const body=new FakeElement('body');
function findElementById(rootElement,id){
  if(rootElement.id===id)return rootElement;
  for(const child of rootElement.children){
    const found=findElementById(child,id);
    if(found)return found;
  }
  return null;
}
const document={
  head,body,fonts:{ready:Promise.resolve()},
  getElementById(id){return elements[id]||findElementById(head,id)||findElementById(body,id);},
  createElementNS(ns,name){return new FakeElement(name);},
  createElement(name){return new FakeElement(name);},
  querySelector(selector){if(selector==='.paper-meta')return paperMeta;if(selector==='.paper-wrap')return paperWrap;return null;},
  querySelectorAll(selector){const match=selector.match(/^\[data-([a-z]+)\]$/);return match?(dataElements[match[1]]||[]):[];}
};
const storage=new Map();
const localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
class FakeOption extends FakeElement {constructor(text,value){super('option');this.textContent=text;this.value=value;}}
global.document=document;
global.window=global;
global.localStorage=localStorage;
global.Option=FakeOption;
global.requestAnimationFrame=callback=>callback();
const windowListeners={};
global.addEventListener=(type,listener)=>(windowListeners[type]??=[]).push(listener);
global.print=()=>{};
global.prompt=()=>null;
global.confirm=()=>true;
global.getComputedStyle=element=>({
  display:'block',visibility:'visible',opacity:'1',color:'rgb(32, 38, 34)',
  getPropertyValue(name){
    const fallbacks={fill:'none',stroke:'none','fill-opacity':'1','stroke-opacity':'1','stroke-width':'1','stroke-linecap':'butt','stroke-linejoin':'miter','stroke-miterlimit':'4','stroke-dasharray':'none','vector-effect':'none'};
    return element.getAttribute(name)||fallbacks[name]||'';
  }
});
if(!global.URL.createObjectURL)global.URL.createObjectURL=()=> 'blob:test';
if(!global.URL.revokeObjectURL)global.URL.revokeObjectURL=()=>{};

vm.runInThisContext(fs.readFileSync(root+'/pdf-export.js','utf8'),{filename:'pdf-export.js'});
vm.runInThisContext(fs.readFileSync(root+'/app.js','utf8'),{filename:'app.js'});

function dataButton(kind,value){return (dataElements[kind]||[]).find(button=>button.dataset[kind]===String(value));}
function press(kind,value){const button=dataButton(kind,value);assert(button,`missing ${kind}=${value}`);button.dispatch('click');}
function input(id,value){elements[id].value=String(value);elements[id].dispatch('input');}
function dispatchWindow(type){for(const listener of windowListeners[type]||[])listener({type,target:global});}
function multiplyMatrix(left,right){
  return {
    a:left.a*right.a+left.c*right.b,
    b:left.b*right.a+left.d*right.b,
    c:left.a*right.c+left.c*right.d,
    d:left.b*right.c+left.d*right.d,
    e:left.a*right.e+left.c*right.f+left.e,
    f:left.b*right.e+left.d*right.f+left.f
  };
}
function svgTransformMatrix(element){
  const raw=element.getAttribute('transform')||'';
  let matrix={a:1,b:0,c:0,d:1,e:0,f:0};
  let cursor=0;
  const pattern=/([A-Za-z]+)\(([^)]*)\)/g;
  for(let match;(match=pattern.exec(raw));){
    assert.strictEqual(raw.slice(cursor,match.index).trim(),'','未対応のtransform構文');
    cursor=pattern.lastIndex;
    const values=match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    assert(values.every(Number.isFinite),'transformに有限でない値があります');
    let operation;
    if(match[1]==='translate'&&[1,2].includes(values.length)){
      operation={a:1,b:0,c:0,d:1,e:values[0],f:values[1]??0};
    }else if(match[1]==='scale'&&[1,2].includes(values.length)){
      operation={a:values[0],b:0,c:0,d:values[1]??values[0],e:0,f:0};
    }else if(match[1]==='matrix'&&values.length===6){
      operation={a:values[0],b:values[1],c:values[2],d:values[3],e:values[4],f:values[5]};
    }else{
      assert.fail(`未対応のtransform: ${match[0]}`);
    }
    matrix=multiplyMatrix(matrix,operation);
  }
  assert.strictEqual(raw.slice(cursor).trim(),'','未対応のtransform末尾');
  return matrix;
}
function transformedPathControlPoints(path){
  const data=path.getAttribute('d')||'';
  const numberPattern=/[-+]?(?:(?:\d+\.\d*)|(?:\.\d+)|(?:\d+))(?:[eE][-+]?\d+)?/g;
  const numbers=[...data.matchAll(numberPattern)].map(match=>Number(match[0]));
  const residue=data.replace(numberPattern,'').replace(/[MCLZ,\s]/g,'');
  assert.strictEqual(residue,'','境界検証に未対応のpath命令があります');
  assert.strictEqual(numbers.length%2,0,'path座標が組になっていません');
  const matrix=svgTransformMatrix(path);
  const points=[];
  for(let index=0;index<numbers.length;index+=2){
    const x=numbers[index],y=numbers[index+1];
    points.push({x:matrix.a*x+matrix.c*y+matrix.e,y:matrix.b*x+matrix.d*y+matrix.f});
  }
  return {points,matrix};
}
function svgBounds(){
  const svg=elements.staffSvg;
  const box=svg.viewBox.baseVal;
  const epsilon=.002;
  const minX=box.x,maxX=box.x+box.width,minY=box.y,maxY=box.y+box.height;
  const assertRange=(value,min,max,label)=>assert(value>=min-epsilon&&value<=max+epsilon,`${label} out of bounds ${value}/${min}..${max}`);
  for(const line of svg.children.filter(child=>child.localName==='line')){
    const x1=Number(line.getAttribute('x1')),x2=Number(line.getAttribute('x2'));
    const y1=Number(line.getAttribute('y1')),y2=Number(line.getAttribute('y2'));
    const strokeWidth=Number(line.getAttribute('stroke-width'));
    assert([x1,x2,y1,y2,strokeWidth].every(Number.isFinite),'lineに有限でない座標または線幅があります');
    const length=Math.hypot(x2-x1,y2-y1);
    const half=strokeWidth/2;
    let xPad=length?half*Math.abs(y2-y1)/length:half;
    let yPad=length?half*Math.abs(x2-x1)/length:half;
    const lineCap=line.getAttribute('stroke-linecap')||'butt';
    if(lineCap!=='butt'&&length){
      xPad+=half*Math.abs(x2-x1)/length;
      yPad+=half*Math.abs(y2-y1)/length;
    }
    assertRange(Math.min(x1,x2)-xPad,minX,maxX,'line painted minX');
    assertRange(Math.max(x1,x2)+xPad,minX,maxX,'line painted maxX');
    assertRange(Math.min(y1,y2)-yPad,minY,maxY,'line painted minY');
    assertRange(Math.max(y1,y2)+yPad,minY,maxY,'line painted maxY');
  }
  for(const pathElement of svg.children.filter(child=>child.localName==='path')){
    const {points,matrix}=transformedPathControlPoints(pathElement);
    assert(points.length>0,'pathに座標がありません');
    const stroke=pathElement.getAttribute('stroke');
    const rawStrokeWidth=Number(pathElement.getAttribute('stroke-width')||0);
    const scale=Math.max(Math.hypot(matrix.a,matrix.b),Math.hypot(matrix.c,matrix.d));
    const pad=stroke&&stroke!=='none'?rawStrokeWidth*scale/2:0;
    for(const point of points){
      assertRange(point.x-pad,minX,maxX,'path painted minX');
      assertRange(point.x+pad,minX,maxX,'path painted maxX');
      assertRange(point.y-pad,minY,maxY,'path painted minY');
      assertRange(point.y+pad,minY,maxY,'path painted maxY');
    }
  }
}
function rightEdgeVerticalLines(){
  const svg=elements.staffSvg;
  const box=svg.viewBox.baseVal;
  return svg.children.filter(child=>{
    if(child.localName!=='line')return false;
    const x1=Number(child.getAttribute('x1')),x2=Number(child.getAttribute('x2'));
    const y1=Number(child.getAttribute('y1')),y2=Number(child.getAttribute('y2'));
    const strokeWidth=Number(child.getAttribute('stroke-width'));
    return Math.abs(x1-x2)<=.001&&Math.abs(y1-y2)>.001&&Math.abs(x1-(box.width-strokeWidth/2))<=.0011;
  });
}
function closeTo(actual,expected,tolerance=1e-5,message=''){
  assert(Math.abs(actual-expected)<=tolerance,message||`${actual} != ${expected}`);
}
const pendingPdfChecks=[];
function validatePdfBlob(blob,{pageW,pageH,orientation,label}){
  assert(blob&&typeof blob.arrayBuffer==='function',`${label}: PDF Blobではありません`);
  assert.strictEqual(blob.type,'application/pdf',`${label}: MIME type`);
  pendingPdfChecks.push(blob.arrayBuffer().then(arrayBuffer=>{
    const bytes=Buffer.from(arrayBuffer);
    const text=bytes.toString('latin1');
    assert(text.startsWith('%PDF-1.4\n%'),`${label}: PDFヘッダー`);
    assert(bytes.length>1000,`${label}: PDFバイト数`);

    const mediaBox=/\/MediaBox \[([^\]]+)\]/.exec(text);
    assert(mediaBox,`${label}: MediaBoxがありません`);
    const mediaValues=mediaBox[1].trim().split(/\s+/).map(Number);
    assert.strictEqual(mediaValues.length,4,`${label}: MediaBox要素数`);
    assert(mediaValues.every(Number.isFinite),`${label}: MediaBoxが有限値ではありません`);
    closeTo(mediaValues[0],0,.00001,`${label}: MediaBox x0`);
    closeTo(mediaValues[1],0,.00001,`${label}: MediaBox y0`);
    closeTo(mediaValues[2],pageW*72/25.4,.00001,`${label}: MediaBox幅`);
    closeTo(mediaValues[3],pageH*72/25.4,.00001,`${label}: MediaBox高さ`);
    assert.strictEqual(mediaValues[2]>mediaValues[3],orientation==='landscape',`${label}: 用紙の縦横`);

    const stream=/4 0 obj\n<< \/Length \d+ >>\nstream\n([\s\S]*?)endstream/.exec(text);
    assert(stream,`${label}: 描画streamがありません`);
    assert(stream[1].includes('(DATE) Tj'),`${label}: DATEがありません`);
    const graphicsCommands=stream[1].split(/\r?\n/).map(line=>line.trim()).filter(line=>line==='q'||line==='Q');
    assert(graphicsCommands.includes('q'),`${label}: qがありません`);
    let graphicsDepth=0;
    for(const command of graphicsCommands){
      graphicsDepth+=command==='q'?1:-1;
      assert(graphicsDepth>=0,`${label}: Qがqより先にあります`);
    }
    assert.strictEqual(graphicsDepth,0,`${label}: q/Qが不均衡です`);
    assert.strictEqual(graphicsCommands.filter(command=>command==='q').length,graphicsCommands.filter(command=>command==='Q').length,`${label}: q/Q数`);

    const eof=/startxref\n(\d+)\n%%EOF\n$/.exec(text);
    assert(eof,`${label}: startxrefまたはEOFがありません`);
    const xrefOffset=Number(eof[1]);
    assert.strictEqual(text.slice(xrefOffset,xrefOffset+5),'xref\n',`${label}: startxref位置`);
    const trailerOffset=text.indexOf('trailer\n',xrefOffset);
    assert(trailerOffset>xrefOffset,`${label}: trailer位置`);
    const xrefLines=text.slice(xrefOffset,trailerOffset).replace(/\n$/,'').split('\n');
    assert.strictEqual(xrefLines[0],'xref',`${label}: xref見出し`);
    const [firstObject,objectCount]=xrefLines[1].split(/\s+/).map(Number);
    assert.strictEqual(firstObject,0,`${label}: xref開始番号`);
    assert.strictEqual(xrefLines.length,2+objectCount,`${label}: xref件数`);
    assert(/^0000000000 65535 f $/.test(xrefLines[2]),`${label}: xref free entry`);
    for(let objectNumber=1;objectNumber<objectCount;objectNumber++){
      const entry=/^(\d{10}) 00000 n $/.exec(xrefLines[2+objectNumber]);
      assert(entry,`${label}: xref entry ${objectNumber}`);
      const objectOffset=Number(entry[1]);
      assert.strictEqual(text.slice(objectOffset,objectOffset+`${objectNumber} 0 obj\n`.length),`${objectNumber} 0 obj\n`,`${label}: object ${objectNumber} offset`);
    }
    assert(text.endsWith('%%EOF\n'),`${label}: EOF終端`);
  }));
}
function chordGridFirstDiagramGeometry(lines,strings,frets,diagramOrientation){
  const epsilon=.0011;
  const groupSize=strings+frets+1;
  assert.strictEqual(lines.length%groupSize,0,'ダイアグラムごとの線数で割り切れません');
  const firstDiagram=lines.slice(0,groupSize);
  const stringLines=firstDiagram.slice(0,strings);
  const fretLines=firstDiagram.slice(strings);
  assert.strictEqual(stringLines.length,strings,'弦線数');
  assert.strictEqual(fretLines.length,frets+1,'フレット境界線数');
  const horizontal=diagramOrientation==='horizontal';
  const isHorizontal=line=>Math.abs(Number(line.getAttribute('y1'))-Number(line.getAttribute('y2')))<=epsilon;
  const isVertical=line=>Math.abs(Number(line.getAttribute('x1'))-Number(line.getAttribute('x2')))<=epsilon;
  assert(stringLines.every(horizontal?isHorizontal:isVertical),horizontal?'横型の弦線は水平':'縦型の弦線は垂直');
  assert(fretLines.every(horizontal?isVertical:isHorizontal),horizontal?'横型のフレット線は垂直':'縦型のフレット線は水平');

  const normalStroke={1:.22,2:.32,3:.46}[Number(elements.lineWeight.value)];
  const nutStroke=Math.max(normalStroke,.42);
  closeTo(Number(fretLines[0].getAttribute('stroke-width')),nutStroke,epsilon,'ナットの線幅');
  fretLines.slice(1).forEach(line=>closeTo(Number(line.getAttribute('stroke-width')),normalStroke,epsilon,'通常フレット線の線幅'));

  const axis=horizontal?'x1':'y1';
  const positions=fretLines.map(line=>Number(line.getAttribute(axis)));
  for(let index=0;index<=frets;index++){
    const expected=positions[0]+(positions[frets]-positions[0])*index/frets;
    closeTo(positions[index],expected,epsilon,`${frets}フレットの等間隔位置 ${index}`);
  }
  if(horizontal){
    closeTo(positions[0],Number(stringLines[0].getAttribute('x1')),epsilon,'横型ナットは左端');
    closeTo(positions[frets],Number(stringLines[0].getAttribute('x2')),epsilon,'横型最終フレット線は右端');
  }else{
    closeTo(positions[0],Number(stringLines[0].getAttribute('y1')),epsilon,'縦型ナットは上端');
    closeTo(positions[frets],Number(stringLines[0].getAttribute('y2')),epsilon,'縦型最終フレット線は下端');
  }
}
function chordChartGeometry(columns,divisions,requestedRows){
  const epsilon=.0011;
  const svg=elements.staffSvg;
  const lines=svg.children.filter(child=>child.localName==='line');
  const horizontal=lines.filter(line=>{
    const x1=Number(line.getAttribute('x1'));
    const x2=Number(line.getAttribute('x2'));
    const y1=Number(line.getAttribute('y1'));
    const y2=Number(line.getAttribute('y2'));
    return Math.abs(y1-y2)<=epsilon&&Math.abs(x1-x2)>epsilon;
  });
  const vertical=lines.filter(line=>{
    const x1=Number(line.getAttribute('x1'));
    const x2=Number(line.getAttribute('x2'));
    const y1=Number(line.getAttribute('y1'));
    const y2=Number(line.getAttribute('y2'));
    return Math.abs(x1-x2)<=epsilon&&Math.abs(y1-y2)>epsilon;
  });
  assert.strictEqual(horizontal.length+vertical.length,lines.length,'コード譜に斜線が混在しています');
  const rowGroups=new Map();
  for(const line of horizontal){
    const y=Number(line.getAttribute('y1'));
    const key=y.toFixed(6);
    if(!rowGroups.has(key))rowGroups.set(key,{y,lines:[]});
    rowGroups.get(key).lines.push(line);
  }
  const rows=[...rowGroups.values()].sort((left,right)=>left.y-right.y);
  const renderedRows=rows.length;
  assert(renderedRows>=1&&renderedRows<=requestedRows,`表示行数 ${renderedRows}/${requestedRows}`);
  assert.strictEqual(horizontal.length,renderedRows*columns,'横線数');
  assert.strictEqual(vertical.length,divisions>0?renderedRows*columns*(divisions+1):0,'縦目盛り数');

  for(const row of rows){
    const intervals=row.lines.map(line=>{
      const x1=Number(line.getAttribute('x1'));
      const x2=Number(line.getAttribute('x2'));
      return {x1:Math.min(x1,x2),x2:Math.max(x1,x2)};
    }).sort((left,right)=>left.x1-right.x1);
    assert.strictEqual(intervals.length,columns,'同じY座標の列数');
    if(columns===2){
      assert(intervals[0].x2<intervals[1].x1,'左右列が重なっています');
      assert(intervals[1].x1-intervals[0].x2>=12-epsilon,'列間隔が12mm未満です');
      closeTo(intervals[0].x2-intervals[0].x1,intervals[1].x2-intervals[1].x1,epsilon,'左右列の幅が異なります');
      closeTo(intervals[0].x1,svg.viewBox.baseVal.width-intervals[1].x2,epsilon,'左右の外側余白が非対称です');
    }
    for(const interval of intervals){
      const ticks=vertical.filter(line=>{
        const x=Number(line.getAttribute('x1'));
        const middleY=(Number(line.getAttribute('y1'))+Number(line.getAttribute('y2')))/2;
        return Math.abs(middleY-row.y)<=epsilon&&x>=interval.x1-epsilon&&x<=interval.x2+epsilon;
      }).sort((left,right)=>Number(left.getAttribute('x1'))-Number(right.getAttribute('x1')));
      assert.strictEqual(ticks.length,divisions>0?divisions+1:0,'各行の縦目盛り数');
      if(divisions>0){
        ticks.forEach((tick,index)=>{
          const expectedX=interval.x1+(interval.x2-interval.x1)*index/divisions;
          closeTo(Number(tick.getAttribute('x1')),expectedX,epsilon,`目盛り位置 ${tick.getAttribute('x1')} != ${expectedX}; divisions=${divisions}; index=${index}; interval=${interval.x1}-${interval.x2}`);
        });
      }
    }
  }
  if(rows.length>1){
    const expectedStep=Math.max(8,Number(stored().chordChartSpacing)/10*9.2);
    for(let index=1;index<rows.length;index++)closeTo(rows[index].y-rows[index-1].y,expectedStep,epsilon,'行間');
  }
  return renderedRows;
}
function stored(){return JSON.parse(storage.get('staffPaperSettings'));}

assert.strictEqual(stored().schemaVersion,11);
assert.strictEqual((dataElements.score||[]).length,8);
assert.strictEqual((dataElements.score||[]).filter(button=>button.dataset.score==='tab').length,1);
assert.strictEqual(dataButton('score','guitar'),undefined);
assert.strictEqual(dataButton('score','bass'),undefined);
assert.strictEqual(dataButton('score','rhythm'),undefined);
assert.strictEqual(PRESETS.rhythm,undefined);
assert.strictEqual((html.match(/\baria-live=/g)||[]).length,1,'aria-liveは1か所だけにします');
const appStatusTag=(/<div\b[^>]*\bid="appStatus"[^>]*>/.exec(html)||[])[0];
assert(appStatusTag,'appStatusがありません');
assert(/\brole="status"/.test(appStatusTag),'appStatusのrole');
assert(/\baria-live="polite"/.test(appStatusTag),'appStatusのaria-live');
assert(/\baria-atomic="true"/.test(appStatusTag),'appStatusのaria-atomic');
assert(html.includes('<h2 class="sr-only">用紙の設定</h2>'),'「用紙の設定」の見出し');
assert(html.includes('aria-label="用紙タイプ"'),'「用紙タイプ」のグループ名');
assert(!html.includes('譜面タイプ'),'旧称「譜面タイプ」が残っています');
assert(html.includes('ダイアグラムのフレット数'));
assert(/id="fretboardFretsOut"[^>]*>15 フレット<\/output>/.test(html),'指板フレット数の表記');
assert(!html.includes('コード図'),'旧称「コード図」がHTMLに残っています');
const appSource=fs.readFileSync(root+'/app.js','utf8');
const enhancementsSource=fs.readFileSync(root+'/enhancements.css','utf8');
assert(!appSource.includes('コード図'),'旧称「コード図」が画面文言に残っています');
assert(!appSource.includes('図よこ')&&!appSource.includes('図たて'),'旧い向き表記が画面文言に残っています');
assert(enhancementsSource.includes('@media screen and (min-width: 851px)'),'画面用の中間幅レイアウトは印刷へ適用しません');
assert(enhancementsSource.includes('break-inside: avoid')&&enhancementsSource.includes('page-break-inside: avoid'),'印刷用紙の改ページ防止');
assert.strictEqual((dataElements.frets||[]).length,3);
for(const frets of [4,5,6]){
  assert(new RegExp(`data-frets="${frets}"[^>]*aria-label="[^"]*${frets}フレット[^"]*"`).test(html),`${frets}フレットの用語またはARIA`);
}
const migratedV5=normalizeState({schemaVersion:5,scoreType:'staff',systems:'9',staffGap:'24',barDivision:'2'});
assert.strictEqual(migratedV5.schemaVersion,11);
assert.strictEqual(migratedV5.systems,'9');
assert.strictEqual(migratedV5.staffGap,'24');
assert.strictEqual(migratedV5.pianoSystems,'9');
assert.strictEqual(migratedV5.pianoStaffGap,'24');
assert.strictEqual(migratedV5.tabSystems,'9');
assert.strictEqual(migratedV5.tabStaffGap,'24');
assert.strictEqual(migratedV5.tabStrings,6);
assert(!('rhythmRows' in migratedV5));
assert(!('guitarStrings' in migratedV5));
assert(!('bassStrings' in migratedV5));
const migratedV7ChordChart=normalizeState({
  schemaVersion:7,scoreType:'chordChart',chordChartRows:'11',chordChartSpacing:'31',chordChartDivisions:'5'
});
assert.strictEqual(migratedV7ChordChart.schemaVersion,11);
assert.strictEqual(migratedV7ChordChart.chordChartColumns,'1');
assert.strictEqual(migratedV7ChordChart.chordChartRows,'11');
assert.strictEqual(migratedV7ChordChart.chordChartSpacing,'31');
assert.strictEqual(migratedV7ChordChart.chordChartDivisions,'5');
for(const [value,expected] of [[1,'1'],['1','1'],[2,'2'],['2','2'],[0,'1'],[3,'1'],[-1,'1'],['x','1'],['','1'],[null,'1'],[undefined,'1']]){
  const normalized=normalizeState({schemaVersion:8,scoreType:'chordChart',chordChartColumns:value});
  assert.strictEqual(normalized.chordChartColumns,expected,`chordChartColumns=${String(value)}`);
}
const migratedV8ChordGrid=normalizeState({schemaVersion:8,scoreType:'chordGrid',chordGridLayout:'4x6',chordGridScale:'18'});
assert.strictEqual(migratedV8ChordGrid.schemaVersion,11);
assert.strictEqual(migratedV8ChordGrid.chordGridOrientation,'vertical');
assert.strictEqual(migratedV8ChordGrid.chordGridFrets,5);
for(const [value,expected] of [['vertical','vertical'],['horizontal','horizontal'],['sideways','vertical'],['','vertical'],[null,'vertical'],[undefined,'vertical']]){
  const normalized=normalizeState({schemaVersion:9,scoreType:'chordGrid',chordGridOrientation:value});
  assert.strictEqual(normalized.chordGridOrientation,expected,`chordGridOrientation=${String(value)}`);
}
for(const [value,expected] of [[4,4],['4',4],[5,5],['5',5],[6,6],['6',6],[3,5],[7,5],[-1,5],['x',5],['',5],[null,5],[undefined,5]]){
  const normalized=normalizeState({schemaVersion:10,scoreType:'chordGrid',chordGridFrets:value});
  assert.strictEqual(normalized.chordGridFrets,expected,`chordGridFrets=${String(value)}`);
}
const independentModeState=normalizeState({
  schemaVersion:11,scoreType:'tab',systems:'12',staffGap:'31',
  pianoSystems:'4',pianoStaffGap:'19',tabSystems:'9',tabStaffGap:'27'
});
assert.deepStrictEqual(
  [independentModeState.systems,independentModeState.staffGap,independentModeState.pianoSystems,independentModeState.pianoStaffGap,independentModeState.tabSystems,independentModeState.tabStaffGap],
  ['12','31','4','19','9','27']
);
for(const [legacyCount,expected] of [[12,'3x4'],[15,'3x5'],[16,'4x4'],[20,'4x5'],[24,'4x6'],[25,'5x5'],[28,'4x7'],[30,'5x6'],[35,'5x7'],[18,'5x5']]){
  assert.strictEqual(normalizeState({schemaVersion:2,scoreType:'chordGrid',chordGridCount:legacyCount}).chordGridLayout,expected,`legacy chordGridCount=${legacyCount}`);
}
assert.strictEqual(PRESETS.chordChart.chordChartColumns,'1');
assert.strictEqual(PRESETS.chordChart2.chordChartColumns,'2');
for(const preset of ['chordGrid','chordGrid24','chordGrid28','bassChordGrid']){
  assert.strictEqual(PRESETS[preset].chordGridOrientation,'vertical');
  assert.strictEqual(PRESETS[preset].chordGridFrets,5);
}
for(const [legacy,expected] of [
  [{schemaVersion:6,scoreType:'guitar',guitarStrings:6,bassStrings:4},6],
  [{schemaVersion:6,scoreType:'guitar',guitarStrings:7,bassStrings:4},7],
  [{schemaVersion:6,scoreType:'bass',guitarStrings:6,bassStrings:4},4],
  [{schemaVersion:6,scoreType:'bass',guitarStrings:6,bassStrings:5},5],
  [{schemaVersion:2,scoreType:'guitar7'},7],
  [{schemaVersion:2,scoreType:'bass5'},5]
]){
  const migrated=normalizeState(legacy);
  assert.strictEqual(migrated.scoreType,'tab');
  assert.strictEqual(migrated.tabStrings,expected);
}
for(const strings of [4,5,6,7]){
  const normalized=normalizeState({schemaVersion:7,scoreType:'tab',tabStrings:strings});
  assert.strictEqual(normalized.scoreType,'tab');
  assert.strictEqual(normalized.tabStrings,strings);
}
const removedRhythm=normalizeState({schemaVersion:6,scoreType:'rhythm',rhythmRows:'12',rhythmSpacing:'22',rhythmBars:'4'});
assert.strictEqual(removedRhythm.scoreType,'staff');
assert(!Object.keys(removedRhythm).some(key=>key.startsWith('rhythm')));
storage.set('staffPaperFavoritesV1',JSON.stringify({schemaVersion:1,items:[
  {id:'g',name:'旧ギター',state:{schemaVersion:6,scoreType:'guitar',guitarStrings:7}},
  {id:'b',name:'旧ベース',state:{schemaVersion:6,scoreType:'bass',bassStrings:5}},
  {id:'c1',name:'旧1列コード譜',state:{schemaVersion:7,scoreType:'chordChart',chordChartRows:'11',chordChartSpacing:'31',chordChartDivisions:'5'}},
  {id:'c2',name:'2列コード譜',state:{schemaVersion:8,scoreType:'chordChart',chordChartRows:'12',chordChartSpacing:'22',chordChartDivisions:'4',chordChartColumns:'2'}},
  {id:'cg',name:'旧横型ダイアグラム',state:{schemaVersion:9,scoreType:'chordGrid',chordGridLayout:'4x6',chordGridScale:'18',chordGridStrings:6,chordGridOrientation:'horizontal'}},
  {id:'cg6',name:'6フレットダイアグラム',state:{schemaVersion:10,scoreType:'chordGrid',chordGridLayout:'5x5',chordGridScale:'20',chordGridStrings:7,chordGridOrientation:'vertical',chordGridFrets:6}},
  {id:'r',name:'旧リズム',state:{schemaVersion:6,scoreType:'rhythm',rhythmRows:'12'}}
]}));
const migratedFavorites=readFavorites();
assert.strictEqual(migratedFavorites.length,6);
assert.deepStrictEqual(migratedFavorites.slice(0,2).map(item=>[item.id,item.state.scoreType,item.state.tabStrings]),[['g','tab',7],['b','tab',5]]);
assert.deepStrictEqual(migratedFavorites.slice(2,4).map(item=>[item.id,item.state.scoreType,item.state.chordChartColumns]),[
  ['c1','chordChart','1'],['c2','chordChart','2']
]);
assert.deepStrictEqual(migratedFavorites[4]&&[
  migratedFavorites[4].id,migratedFavorites[4].state.scoreType,migratedFavorites[4].state.chordGridOrientation,migratedFavorites[4].state.chordGridFrets
],['cg','chordGrid','horizontal',5]);
assert.deepStrictEqual(migratedFavorites[5]&&[
  migratedFavorites[5].id,migratedFavorites[5].state.scoreType,migratedFavorites[5].state.chordGridOrientation,migratedFavorites[5].state.chordGridFrets
],['cg6','chordGrid','vertical',6]);
const rewrittenFavorites=JSON.parse(storage.get('staffPaperFavoritesV1'));
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='c1').state.schemaVersion,11);
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='c1').state.chordChartColumns,'1');
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='cg').state.chordGridOrientation,'horizontal');
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='cg').state.chordGridFrets,5);
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='cg6').state.schemaVersion,11);
assert.strictEqual(rewrittenFavorites.items.find(item=>item.id==='cg6').state.chordGridFrets,6);
const favoriteScanSource=Array.from({length:25},(_,index)=>index%2
  ?{id:'invalid-'+index,name:'',state:{schemaVersion:11,scoreType:'staff'}}
  :{id:'rhythm-'+index,name:'旧リズム'+index,state:{schemaVersion:6,scoreType:'rhythm'}}
).concat(Array.from({length:20},(_,index)=>({
  id:'valid-'+index,name:'有効'+index,state:{...defaults,scoreType:'staff',systems:String(index%16+1)}
})));
storage.set('staffPaperFavoritesV1',JSON.stringify({schemaVersion:1,items:favoriteScanSource}));
const scannedFavorites=readFavorites();
assert.strictEqual(scannedFavorites.length,20);
assert.deepStrictEqual(scannedFavorites.map(item=>item.id),Array.from({length:20},(_,index)=>'valid-'+index));
input('systems',12);
assert.strictEqual(stored().systems,'12');
press('score','staffTab');
assert.strictEqual(elements.systems.value,'5');
assert.strictEqual(stored().staffTabSystems,'5');
assert(elements.staffSvg.children.some(child=>child.localName==='path'));
press('bars','4');
press('strings','4');
assert.strictEqual(stored().staffTabStrings,4);
assert(elements.staffSvg.getAttribute('aria-label').includes('4弦TAB譜'));
assert.strictEqual(rightEdgeVerticalLines().length,0,'五線譜＋TABの右端を縦線で閉じません');
svgBounds();
press('score','staff');
assert.strictEqual(elements.systems.value,'12');

applyState({...defaults,scoreType:'staff',systems:'12',staffGap:'31',pianoSystems:'4',pianoStaffGap:'19',tabSystems:'9',tabStaffGap:'27'});
press('score','piano');
assert.strictEqual(elements.systems.value,'4');
assert.strictEqual(elements.staffGap.value,'19');
input('systems',6);
input('staffGap',25);
press('score','tab');
assert.strictEqual(elements.systems.value,'9');
assert.strictEqual(elements.staffGap.value,'27');
input('systems',11);
input('staffGap',29);
press('score','staff');
assert.strictEqual(elements.systems.value,'12');
assert.strictEqual(elements.staffGap.value,'31');
assert.deepStrictEqual(
  [stored().systems,stored().staffGap,stored().pianoSystems,stored().pianoStaffGap,stored().tabSystems,stored().tabStaffGap],
  ['12','31','6','25','11','29']
);

applyState({...defaults,paperSize:'b5',orientation:'portrait',margin:'30',scoreType:'piano',pianoSystems:'16',pianoStaffGap:'35'});
assert.strictEqual(elements.systems.value,'16');
assert(Number.parseInt(elements.systemsOut.value,10)<16);
assert.strictEqual(stored().pianoSystems,'16');
press('score','staff');
press('score','piano');
assert.strictEqual(elements.systems.value,'16');
assert.strictEqual(stored().pianoSystems,'16');

applyState({...defaults,paperSize:'b5',orientation:'portrait',margin:'30',scoreType:'staff',systems:'16',staffGap:'35',clef:'none',groupSize:3,lineWeight:'3'});
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='path').length,0,'clef noneでは記号pathを描画しません');
const thickBracketWidth=Math.max(.42,.46*1.35);
const thickBracketLines=elements.staffSvg.children.filter(child=>child.localName==='line'&&Math.abs(Number(child.getAttribute('stroke-width'))-thickBracketWidth)<.000001);
assert(thickBracketLines.length>=3,'太線の括弧がありません');
assert(elements.staffSvg.getAttribute('aria-label').includes('複数段'));
svgBounds();

press('score','keyboard');
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,565);
assert.strictEqual(elements.staffSvg.getAttribute('aria-label'),'記入用鍵盤図、横長5段');
svgBounds();
press('keyboard','memo');
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,470);
svgBounds();
input('paperSize','b5');
input('orientation','landscape');
input('margin',30);
input('staffGap',30);
svgBounds();
assert.strictEqual(stored().keyboardLayout,'memo');
assert.strictEqual(stored().keyboardScale,'30');
const keyboardPage=currentPage();
const pdfBlob=window.StaffPaperPdf.download({svg:elements.staffSvg,pageW:keyboardPage.w,pageH:keyboardPage.h,margin:30,metaHeight:17,showTitle:true,showDate:true,filename:'test.pdf'});
assert(pdfBlob.size>1000);
validatePdfBlob(pdfBlob,{pageW:keyboardPage.w,pageH:keyboardPage.h,orientation:'landscape',label:'B5横向き鍵盤図'});
assert.throws(()=>window.StaffPaperPdf.download({
  svg:elements.staffSvg,pageW:182,pageH:257,margin:30,metaHeight:17,
  showTitle:true,showDate:true,filename:'mismatched-page.pdf'
}),/縦横比/);

input('paperSize','a4');
input('orientation','portrait');
input('margin',15);
press('score','tab');
assert.strictEqual(dataButton('bars','0').hidden,false);
assert((dataElements.strings||[]).every(button=>button.hidden===false));
for(const strings of [4,5,6,7]){
  press('strings',strings);
  assert.strictEqual(stored().scoreType,'tab');
  assert.strictEqual(stored().tabStrings,strings);
  const renderedSystems=Number.parseInt(elements.systemsOut.value,10);
  assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,renderedSystems*(strings+Math.max(0,Number(stored().barDivision)-1)));
  assert.strictEqual(rightEdgeVerticalLines().length,0,'TAB譜の右端を縦線で閉じません');
  assert(elements.staffSvg.getAttribute('aria-label').includes(strings+'弦'));
  assert(elements.pageInfo.textContent.includes((strings<=5?'ベース':'ギター')+'TAB・'+strings+'弦'));
  svgBounds();
}
press('strings','5');
press('score','staffTab');
press('strings','7');
assert.strictEqual(stored().staffTabStrings,7);
press('score','tab');
assert.strictEqual(stored().tabStrings,5);
assert(dataButton('strings','5').classList.names.has('active'));

for(const [preset,strings] of [['guitar',6],['guitar7',7],['bass',4],['bass5',5]]){
  applyState(PRESETS[preset]);
  assert.strictEqual(stored().scoreType,'tab');
  assert.strictEqual(stored().tabStrings,strings);
  assert.strictEqual(stored().tabSystems,PRESETS[preset].tabSystems);
}

for(const paperSize of ['a4','b5','letter']){
  input('paperSize',paperSize);
  for(const orientation of ['portrait','landscape']){
    input('orientation',orientation);
    for(const margin of [8,30]){
      input('margin',margin);
      for(const weight of [1,3]){
        input('lineWeight',weight);
        for(const spacing of [14,35]){
          input('staffGap',spacing);
          for(const strings of [4,5,6,7]){
            press('strings',strings);
            for(const bars of [0,8]){
              press('bars',bars);
              for(const showTabLabel of [false,true]){
                elements.showTabLabel.checked=showTabLabel;
                elements.showTabLabel.dispatch('input');
                const renderedSystems=Number.parseInt(elements.systemsOut.value,10);
                const lineCount=elements.staffSvg.children.filter(child=>child.localName==='line').length;
                const pathCount=elements.staffSvg.children.filter(child=>child.localName==='path').length;
                assert.strictEqual(lineCount,renderedSystems*(strings+Math.max(0,bars-1)));
                assert.strictEqual(rightEdgeVerticalLines().length,0,'TAB譜の右端を縦線で閉じません');
                assert.strictEqual(pathCount,showTabLabel?renderedSystems:0);
                assert.strictEqual(stored().tabStrings,strings);
                svgBounds();
              }
            }
          }
        }
      }
    }
  }
}
elements.showTabLabel.checked=true;
elements.showTabLabel.dispatch('input');
const tabPage=currentPage();
const tabPdf=window.StaffPaperPdf.download({svg:elements.staffSvg,pageW:tabPage.w,pageH:tabPage.h,margin:30,metaHeight:17,showTitle:true,showDate:true,filename:'tab.pdf'});
assert(tabPdf.size>1000);

const systemsBeforeChordGrid=stored().systems;
assert.strictEqual(elements.chordGridOrientationControls.style.display,'none');
assert.strictEqual(elements.chordGridFretControls.style.display,'none');
press('score','chordGrid');
assert.strictEqual(elements.chordGridOrientationControls.style.display,'block');
assert.strictEqual(elements.chordGridFretControls.style.display,'block');
assert(dataButton('diagram','vertical').classList.names.has('active'));
assert(dataButton('frets','5').classList.names.has('active'));
assert.strictEqual(dataButton('frets','5').getAttribute('aria-pressed'),'true');
press('frets',6);
assert.strictEqual(stored().chordGridFrets,6);
press('diagram','horizontal');
assert.strictEqual(stored().chordGridOrientation,'horizontal');
assert.strictEqual(stored().chordGridFrets,6);
assert(dataButton('diagram','horizontal').classList.names.has('active'));
assert.strictEqual(dataButton('diagram','horizontal').getAttribute('aria-pressed'),'true');
assert.strictEqual(dataButton('diagram','vertical').getAttribute('aria-pressed'),'false');
assert(dataButton('frets','6').classList.names.has('active'));
assert(elements.staffSvg.getAttribute('aria-label').includes('横向き'));
assert(elements.staffSvg.getAttribute('aria-label').includes('6フレット'));
assert(elements.staffSvg.getAttribute('aria-label').includes('ダイアグラム'));
assert(!elements.staffSvg.getAttribute('aria-label').includes('コード図'));
assert(elements.pageInfo.textContent.includes('横型'));
assert(elements.pageInfo.textContent.includes('6フレット'));
assert(elements.pageInfo.textContent.includes('ダイアグラム'));
press('diagram','vertical');
assert.strictEqual(stored().chordGridFrets,6);
press('frets',4);
press('diagram','horizontal');
assert.strictEqual(stored().chordGridOrientation,'horizontal');
assert.strictEqual(stored().chordGridFrets,4);
assert(dataButton('frets','4').classList.names.has('active'));
press('score','fretboard');
assert.strictEqual(elements.chordGridFretControls.style.display,'none');
assert.strictEqual(elements.fretControls.style.display,'block');
assert.strictEqual(elements.fretboardFrets.value,'15');
input('systems',7);
input('staffGap',35);
assert(Number.parseInt(elements.systemsOut.value,10)<7);
assert.strictEqual(elements.systems.value,'7');
assert.strictEqual(stored().fretboardCount,'7');
press('score','chordGrid');
assert.strictEqual(elements.chordGridFretControls.style.display,'block');
assert.strictEqual(stored().chordGridFrets,4);
assert.strictEqual(stored().fretboardCount,'7');
assert(dataButton('frets','4').classList.names.has('active'));
press('diagram','vertical');
press('layout','4x7');
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,308);
press('frets',6);
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,364);
press('frets',5);
assert.strictEqual(elements.staffSvg.children.filter(child=>child.localName==='line').length,336);
assert.strictEqual(stored().chordGridLayout,'4x7');
assert.strictEqual(stored().chordGridOrientation,'vertical');
assert.strictEqual(stored().chordGridFrets,5);
svgBounds();
assert.strictEqual(stored().systems,systemsBeforeChordGrid);

const layouts={
  '3x4':[3,4],'3x5':[3,5],'4x4':[4,4],'4x5':[4,5],'4x6':[4,6],
  '5x5':[5,5],'4x7':[4,7],'5x6':[5,6],'5x7':[5,7]
};
let chordGridMatrixCases=0;
for(const paperSize of ['a4','b5','letter']){
  input('paperSize',paperSize);
  for(const paperOrientation of ['portrait','landscape']){
    input('orientation',paperOrientation);
    for(const margin of [8,30]){
      input('margin',margin);
      for(const weight of [1,3]){
        input('lineWeight',weight);
        for(const scale of [4,35]){
          input('staffGap',scale);
          for(const strings of [4,5,6,7]){
            press('strings',strings);
            for(const [key,[canonicalColumns,canonicalRows]] of Object.entries(layouts)){
              for(const diagramOrientation of ['vertical','horizontal']){
                press('layout',key);
                press('diagram',diagramOrientation);
                for(const frets of [4,5,6]){
                  press('frets',frets);
                  chordGridMatrixCases++;
                  const expectedCount=canonicalColumns*canonicalRows;
                  const lines=elements.staffSvg.children.filter(child=>child.localName==='line');
                  const horizontalLines=lines.filter(line=>Math.abs(Number(line.getAttribute('y1'))-Number(line.getAttribute('y2')))<=.001);
                  const verticalLines=lines.filter(line=>Math.abs(Number(line.getAttribute('x1'))-Number(line.getAttribute('x2')))<=.001);
                  assert.strictEqual(lines.length,expectedCount*(strings+frets+1),`${key}, ${paperSize}, ${paperOrientation}, ${margin}, ${weight}, ${scale}, ${strings}, ${frets}, ${diagramOrientation}`);
                  assert.strictEqual(horizontalLines.length,expectedCount*(diagramOrientation==='horizontal'?strings:frets+1),'水平線数');
                  assert.strictEqual(verticalLines.length,expectedCount*(diagramOrientation==='horizontal'?frets+1:strings),'垂直線数');
                  assert.strictEqual(horizontalLines.length+verticalLines.length,lines.length,'斜線が混在しています');
                  chordGridFirstDiagramGeometry(lines,strings,frets,diagramOrientation);
                  const renderedColumns=paperOrientation==='landscape'?canonicalRows:canonicalColumns;
                  const renderedRows=paperOrientation==='landscape'?canonicalColumns:canonicalRows;
                  const svgLabel=elements.staffSvg.getAttribute('aria-label');
                  assert(svgLabel.includes(`配置${renderedColumns}列×${renderedRows}行`));
                  assert(svgLabel.includes(diagramOrientation==='horizontal'?'横向き':'縦向き'));
                  assert(svgLabel.includes(`${strings}弦、${frets}フレット`));
                  assert(svgLabel.includes('ダイアグラム'));
                  assert(!svgLabel.includes('コード図'));
                  assert(elements.pageInfo.textContent.includes(diagramOrientation==='horizontal'?'横型':'縦型'));
                  assert(elements.pageInfo.textContent.includes(`${strings}弦・${frets}フレット`));
                  assert(elements.pageInfo.textContent.includes('ダイアグラム'));
                  assert(elements.systemsOut.value.includes(`${frets}フレット`));
                  assert.strictEqual(stored().schemaVersion,11);
                  assert.strictEqual(stored().chordGridLayout,key);
                  assert.strictEqual(stored().chordGridScale,String(scale));
                  assert.strictEqual(stored().chordGridStrings,strings);
                  assert.strictEqual(stored().chordGridOrientation,diagramOrientation);
                  assert.strictEqual(stored().chordGridFrets,frets);
                  assert(dataButton('diagram',diagramOrientation).classList.names.has('active'));
                  assert(dataButton('frets',frets).classList.names.has('active'));
                  assert.strictEqual(dataButton('frets',frets).getAttribute('aria-pressed'),'true');
                  assert(elements.paper.getAttribute('aria-label').includes('ダイアグラム用紙'));
                  svgBounds();
                }
              }
            }
          }
        }
      }
    }
  }
}
assert.strictEqual(chordGridMatrixCases,10368);

function chordGridPdf(diagramOrientation,frets){
  applyState({...defaults,paperSize:'a4',orientation:'portrait',margin:'15',lineWeight:'1',scoreType:'chordGrid',
    chordGridLayout:'4x4',chordGridScale:'14',chordGridStrings:6,chordGridOrientation:diagramOrientation,chordGridFrets:frets,
    showTitle:true,showDate:true});
  const lines=elements.staffSvg.children.filter(child=>child.localName==='line');
  assert.strictEqual(lines.length,16*(6+frets+1));
  chordGridFirstDiagramGeometry(lines,6,frets,diagramOrientation);
  assert.strictEqual(stored().chordGridOrientation,diagramOrientation);
  assert.strictEqual(stored().chordGridFrets,frets);
  svgBounds();
  const page=currentPage();
  return window.StaffPaperPdf.download({
    svg:elements.staffSvg,pageW:page.w,pageH:page.h,margin:15,metaHeight:17,
    showTitle:true,showDate:true,filename:`diagram-${diagramOrientation}-${frets}-frets.pdf`
  });
}
const chordGridPdfs=[];
for(const diagramOrientation of ['vertical','horizontal']){
  for(const frets of [4,5,6]){
    const pdf=chordGridPdf(diagramOrientation,frets);
    assert(pdf.size>1000,`${diagramOrientation}・${frets}フレットPDF`);
    if(diagramOrientation==='vertical'&&frets===4){
      validatePdfBlob(pdf,{pageW:210,pageH:297,orientation:'portrait',label:'A4縦向きダイアグラム'});
    }
    chordGridPdfs.push(pdf);
  }
}
assert.strictEqual(chordGridPdfs.length,6);
assert.strictEqual(stored().chordGridOrientation,'horizontal');
assert.strictEqual(stored().chordGridFrets,6);

applyState({...defaults,scoreType:'staff',systems:'9',staffGap:'23',showTitle:true,showDate:true});
assert.strictEqual(elements.chordChartLayoutControls.style.display,'none');
press('score','chordChart');
assert.strictEqual(elements.chordChartLayoutControls.style.display,'block');
assert.strictEqual(elements.systemsLabel.textContent,'行数');
input('systems',11);
input('staffGap',18);
press('bars',5);
press('chart',2);
assert.strictEqual(stored().scoreType,'chordChart');
assert.strictEqual(stored().chordChartRows,'11');
assert.strictEqual(stored().chordChartSpacing,'18');
assert.strictEqual(stored().chordChartDivisions,'5');
assert.strictEqual(stored().chordChartColumns,'2');
assert.strictEqual(elements.systemsLabel.textContent,'1列の行数');
assert(dataButton('chart','2').classList.names.has('active'));
assert.strictEqual(dataButton('chart','2').getAttribute('aria-pressed'),'true');
assert.strictEqual(dataButton('chart','1').getAttribute('aria-pressed'),'false');
assert(elements.systemsOut.value.includes('2列'));
assert(elements.systemsOut.value.includes('計 22行'));
assert(elements.pageInfo.textContent.includes('2列×11行'));
assert(elements.staffSvg.getAttribute('aria-label').includes('2列、1列11行、全22行'));
assert.strictEqual(chordChartGeometry(2,5,11),11);
svgBounds();
press('score','staff');
assert.strictEqual(elements.chordChartLayoutControls.style.display,'none');
assert.strictEqual(elements.systems.value,'9');
assert.strictEqual(elements.staffGap.value,'23');
press('score','chordChart');
assert.strictEqual(elements.systems.value,'11');
assert.strictEqual(elements.staffGap.value,'18');
assert(dataButton('chart','2').classList.names.has('active'));
assert(dataButton('bars','5').classList.names.has('active'));

applyState(PRESETS.chordChart);
assert.strictEqual(stored().chordChartColumns,'1');
assert(dataButton('chart','1').classList.names.has('active'));
assert.strictEqual(elements.chordChartLayoutControls.style.display,'block');
applyState(PRESETS.chordChart2);
assert.strictEqual(stored().chordChartColumns,'2');
assert(dataButton('chart','2').classList.names.has('active'));
assert(elements.pageInfo.textContent.includes('2列'));

applyState({...defaults,scoreType:'chordChart',chordChartRows:'12',chordChartSpacing:'22',chordChartDivisions:'4',chordChartColumns:'1',showTitle:true,showDate:true});
for(const paperSize of ['a4','b5','letter']){
  input('paperSize',paperSize);
  for(const orientation of ['portrait','landscape']){
    input('orientation',orientation);
    for(const margin of [8,30]){
      input('margin',margin);
      for(const weight of [1,3]){
        input('lineWeight',weight);
        for(const spacing of [8,50]){
          input('staffGap',spacing);
          for(const requestedRows of [1,12]){
            input('systems',requestedRows);
            for(const divisions of [0,4,8]){
              press('bars',divisions);
              for(const columns of [1,2]){
                press('chart',columns);
                const renderedRows=chordChartGeometry(columns,divisions,requestedRows);
                const state=stored();
                assert.strictEqual(state.schemaVersion,11);
                assert.strictEqual(state.scoreType,'chordChart');
                assert.strictEqual(state.chordChartRows,String(requestedRows));
                assert.strictEqual(state.chordChartSpacing,String(spacing));
                assert.strictEqual(state.chordChartDivisions,String(divisions));
                assert.strictEqual(state.chordChartColumns,String(columns));
                assert(dataButton('chart',columns).classList.names.has('active'));
                assert.strictEqual(dataButton('chart',columns).getAttribute('aria-pressed'),'true');
                assert(elements.staffSvg.getAttribute('aria-label').includes(`${columns}列、1列${renderedRows}行、全${renderedRows*columns}行`));
                if(columns===2){
                  assert.strictEqual(elements.systemsLabel.textContent,'1列の行数');
                  assert(elements.systemsOut.value.includes('2列'));
                  assert(elements.systemsOut.value.includes(`計 ${renderedRows*2}行`));
                  assert(elements.pageInfo.textContent.includes(`2列×${renderedRows}行`));
                }else{
                  assert.strictEqual(elements.systemsLabel.textContent,'行数');
                  assert(!elements.systemsOut.value.includes('2列'));
                  assert(elements.pageInfo.textContent.includes(`コード譜 · ${renderedRows}行`));
                }
                if(renderedRows<requestedRows)assert(elements.systemsLimit.textContent.includes('現在の用紙と行間では'));
                const page=currentPage();
                closeTo(elements.staffSvg.viewBox.baseVal.width,page.w-margin*2);
                closeTo(elements.staffSvg.viewBox.baseVal.height,page.h-margin*2-17);
                closeTo(Number(elements.paper.dataset.width),page.w);
                closeTo(Number(elements.paper.dataset.height),page.h);
                svgBounds();
              }
            }
          }
        }
      }
    }
  }
}

function chordChartPdf(columns){
  applyState({...defaults,paperSize:'a4',orientation:'landscape',margin:'15',scoreType:'chordChart',
    chordChartRows:'12',chordChartSpacing:'14',chordChartDivisions:'4',chordChartColumns:String(columns),
    showTitle:true,showDate:true});
  const page=currentPage();
  svgBounds();
  return window.StaffPaperPdf.download({
    svg:elements.staffSvg,pageW:page.w,pageH:page.h,margin:15,metaHeight:17,
    showTitle:true,showDate:true,filename:`chord-chart-${columns}-column.pdf`
  });
}
const oneColumnChordPdf=chordChartPdf(1);
const twoColumnChordPdf=chordChartPdf(2);
assert(oneColumnChordPdf.size>1000);
assert(twoColumnChordPdf.size>oneColumnChordPdf.size);
assert.strictEqual(stored().chordChartColumns,'2');

assert.strictEqual((windowListeners.beforeprint||[]).length,1,'beforeprintリスナー数');
assert.strictEqual((windowListeners.afterprint||[]).length,1,'afterprintリスナー数');
for(const printCase of [
  {paperSize:'a4',orientation:'portrait',expected:'@page{size:210mm 297mm;margin:0}'},
  {paperSize:'letter',orientation:'landscape',expected:'@page{size:279.4mm 215.9mm;margin:0}'}
]){
  applyState({...defaults,paperSize:printCase.paperSize,orientation:printCase.orientation});
  dispatchWindow('beforeprint');
  const printStyles=head.children.filter(child=>child.id==='printPage');
  assert.strictEqual(printStyles.length,1,'動的@pageは1件だけです');
  assert.strictEqual(printStyles[0].textContent,printCase.expected,'動的@pageの用紙サイズ');
  dispatchWindow('afterprint');
  assert.strictEqual(document.getElementById('printPage'),null,'afterprint後に動的@pageが残っています');
}

const futureSettingsRaw=JSON.stringify({...defaults,schemaVersion:99,scoreType:'staff',systems:'14',futureOnly:'keep'});
storage.set('staffPaperSettings',futureSettingsRaw);
load();
assert.strictEqual(storage.get('staffPaperSettings'),futureSettingsRaw);
input('systems',13);
assert.strictEqual(storage.get('staffPaperSettings'),futureSettingsRaw);
elements.resetBtn.dispatch('click');
assert.strictEqual(stored().schemaVersion,11);

const corruptSettingsRaw='{corrupt settings';
storage.set('staffPaperSettings',corruptSettingsRaw);
load();
assert.strictEqual(storage.get('staffPaperSettings'),corruptSettingsRaw);
input('systems',12);
assert.strictEqual(storage.get('staffPaperSettings'),corruptSettingsRaw);
elements.resetBtn.dispatch('click');
assert.strictEqual(stored().schemaVersion,11);

for(const malformedSettingsRaw of ['[]','null','"not settings"','{}','{"futureOnly":"keep"}']){
  storage.set('staffPaperSettings',malformedSettingsRaw);
  load();
  assert.strictEqual(storage.get('staffPaperSettings'),malformedSettingsRaw,'JSONとして正しくても設定形式でない値を保持します');
  elements.zoomOut.dispatch('click');
  assert(elements.appStatus.textContent.includes('プレビュー倍率'),'一時的な操作通知を表示します');
  input('systems',11);
  assert.strictEqual(storage.get('staffPaperSettings'),malformedSettingsRaw,'不正形式の設定を自動上書きしません');
  assert(elements.appStatus.textContent.includes('自動上書きを停止しました'),'一時通知後も保存ブロック警告を再表示します');
  storage.delete('staffPaperSettings');
  load();
  assert.strictEqual(stored().schemaVersion,11);
}

const originalSetItem=localStorage.setItem;
localStorage.setItem=()=>{throw new Error('quota');};
input('systems',10);
assert(elements.appStatus.textContent.includes('設定を保存できませんでした'),'保存失敗を表示します');
elements.zoomOut.dispatch('click');
assert(elements.appStatus.textContent.includes('プレビュー倍率'),'保存失敗後の一時通知を表示します');
input('systems',9);
assert(elements.appStatus.textContent.includes('設定を保存できませんでした'),'一時通知後も保存失敗の警告を再表示します');
localStorage.setItem=originalSetItem;
input('systems',8);
assert(elements.appStatus.textContent.includes('保存できる状態に戻りました'),'保存復旧を表示します');

const futureFavoritesRaw=JSON.stringify({schemaVersion:2,items:[{
  id:'future',name:'将来版',state:{...defaults,schemaVersion:99,futureOnly:'keep'}
}]});
storage.set('staffPaperFavoritesV1',futureFavoritesRaw);
readFavorites();
assert.strictEqual(writeFavorites([]),false);
assert.strictEqual(storage.get('staffPaperFavoritesV1'),futureFavoritesRaw);
storage.set('staffPaperFavoritesV1',JSON.stringify({schemaVersion:1,items:[]}));
readFavorites();
assert.strictEqual(writeFavorites([]),true);

const corruptFavoritesRaw='{corrupt favorites';
storage.set('staffPaperFavoritesV1',corruptFavoritesRaw);
assert.deepStrictEqual(readFavorites(),[]);
assert.strictEqual(writeFavorites([]),false);
assert.strictEqual(storage.get('staffPaperFavoritesV1'),corruptFavoritesRaw);
storage.delete('staffPaperFavoritesV1');
readFavorites();
assert.strictEqual(writeFavorites([]),true);

for(const malformedFavoritesRaw of ['{}','null','"not favorites"']){
  storage.set('staffPaperFavoritesV1',malformedFavoritesRaw);
  assert.deepStrictEqual(readFavorites(),[]);
  assert.strictEqual(writeFavorites([]),false);
  assert.strictEqual(storage.get('staffPaperFavoritesV1'),malformedFavoritesRaw,'不正形式のお気に入りを自動上書きしません');
  storage.delete('staffPaperFavoritesV1');
  readFavorites();
}

storage.set('staffPaperFavoritesV1',JSON.stringify([{name:'余白だけの旧お気に入り',margin:'28'}]));
const migratedSparseFavorite=readFavorites();
assert.strictEqual(migratedSparseFavorite.length,1,'共通項目だけの旧お気に入りも移行します');
assert.strictEqual(migratedSparseFavorite[0].state.margin,'28');
assert.strictEqual(JSON.parse(storage.get('staffPaperFavoritesV1')).items.length,1,'移行時に旧お気に入りを削除しません');

Promise.all(pendingPdfChecks).then(()=>{
  console.log('PASS: schema 11, independent requested staff/piano/TAB state, 8 score types, legacy TAB/chord-chart/diagram migration, unified TAB across 768 conditions, keyboard full/memo, staff+TAB, 9 diagram layouts × 4/5/6 frets in vertical/horizontal orientation across 10,368 conditions, chord-chart 1/2 columns across 576 conditions, painted SVG bounds, dynamic print pages, PDF byte structure/orientation, terminology/state/presets/favorites, guarded storage, 6 diagram vector PDFs');
}).catch(error=>{
  console.error(error);
  process.exitCode=1;
});
