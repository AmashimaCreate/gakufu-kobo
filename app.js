const $ = id => document.getElementById(id);
const els = {
  paperSize: $('paperSize'), orientation: $('orientation'), margin: $('margin'),
  systems: $('systems'), staffGap: $('staffGap'), lineWeight: $('lineWeight'),
  fretboardFrets: $('fretboardFrets'), showTabLabel: $('showTabLabel'),
  showTitle: $('showTitle'), showDate: $('showDate')
};
let clef = 'treble';
let scoreType = 'staff';
let barDivision = '0';
let regularSystems = '10';
let regularStaffGap = '22';
let pianoSystems = '5';
let pianoStaffGap = '22';
let tabSystems = '10';
let tabStaffGap = '22';
let staffTabSystems = '5';
let staffTabGap = '22';
let keyboardLayout = 'full';
let keyboardScale = '22';
let staffTabStrings = 6;
let chordGridLayout = '5x5';
let chordGridScale = '35';
let chordGridStrings = 6;
let chordGridOrientation = 'vertical';
let chordGridFrets = 5;
let chordChartRows = '12';
let chordChartSpacing = '22';
let chordChartDivisions = '4';
let chordChartColumns = '1';
let fretboardCount = '5';
let fretboardScale = '22';
let fretboardStrings = 6;
let fretboardFrets = '15';
let groupSize = 1;
let tabStrings = 6;
let zoom = 1;
let storageWarningShown = false;
const unreadableStorageKeys=new Set();
const futureStorageKeys=new Set();
const storageBlockWarnings=new Set();
const MIN_ZOOM=.25, MAX_ZOOM=2;
const CHORD_GRID_LAYOUTS={
  '3x4':{columns:3,rows:4,label:'3×4'},
  '3x5':{columns:3,rows:5,label:'3×5'},
  '4x4':{columns:4,rows:4,label:'4×4'},
  '4x5':{columns:4,rows:5,label:'4×5'},
  '4x6':{columns:4,rows:6,label:'4×6'},
  '5x5':{columns:5,rows:5,label:'5×5'},
  '4x7':{columns:4,rows:7,label:'4×7'},
  '5x6':{columns:5,rows:6,label:'5×6'},
  '5x7':{columns:5,rows:7,label:'5×7'}
};
const SCHEMA_VERSION=11;
const FAVORITES_SCHEMA_VERSION=1;
const CHORD_GRID_SCALE_MIN=4, CHORD_GRID_SCALE_MAX=35;
const CHORD_CHART_MAX_ROWS=12, CHORD_CHART_MIN_SPACING=8, CHORD_CHART_MAX_SPACING=50;
const KEYBOARD_SCALE_MIN=14, KEYBOARD_SCALE_MAX=30;
const sizes = {a4:{label:'A4',p:[210,297]},b5:{label:'B5',p:[182,257]},letter:{label:'Letter',p:[215.9,279.4]}};
const weights = {1:[.22,'細め'],2:[.32,'標準'],3:[.46,'濃いめ']};
const SETTINGS_KEY = 'staffPaperSettings';
const FAVORITES_KEY = 'staffPaperFavoritesV1';
const FAVORITES_LIMIT = 20;
const STATE_SOURCE_KEYS=[
  'schemaVersion','paperSize','orientation','margin','systems','staffGap','lineWeight',
  'showTabLabel','showTitle','showDate','showName','scoreType','scoreFamily','clef','barDivision','measureCount','groupSize','staffLayout',
  'pianoSystems','pianoStaffGap','tabSystems','tabStaffGap',
  'staffTabSystems','staffTabGap','staffTabStrings','keyboardLayout','keyboardScale',
  'chordGridLayout','chordGridCount','chordGridScale','chordGridStrings','chordGridOrientation','chordGridFrets',
  'chordChartRows','chordChartSpacing','chordChartDivisions','chordChartColumns',
  'tabStrings','guitarStrings','bassStrings',
  'fretboardCount','fretboardScale','fretboardStrings','fretboardFrets'
];
const defaults = {
  schemaVersion: SCHEMA_VERSION, paperSize:'a4', orientation:'portrait', margin:'15', systems:'10',
  staffGap:'22', lineWeight:'2', showTabLabel:true, showTitle:true, showDate:true,
  clef:'treble', scoreType:'staff', barDivision:'0', groupSize:1,
  pianoSystems:'5', pianoStaffGap:'22', tabSystems:'10', tabStaffGap:'22',
  tabStrings:6, staffTabStrings:6, staffTabSystems:'5', staffTabGap:'22',
  keyboardLayout:'full', keyboardScale:'22',
  chordGridLayout:'5x5', chordGridScale:'35', chordGridStrings:6, chordGridOrientation:'vertical', chordGridFrets:5,
  chordChartRows:'12', chordChartSpacing:'22', chordChartDivisions:'4', chordChartColumns:'1',
  fretboardCount:'5', fretboardScale:'22', fretboardStrings:6, fretboardFrets:'15'
};
const MUSIC_PATHS={
  treble:'M 420 206 C 400 210 381 212 362 212 C 219 212 97 112 97 -39 C 97 -161 183 -270 271 -346 C 288 -361 304 -375 319 -390 C 328 -336 335 -289 342 -248 C 251 -221 189 -125 189 -31 C 189 39 244 135 324 135 C 332 135 341 131 341 122 C 341 113 331 108 319 100 C 280 76 258 50 258 1 C 258 -60 303 -109 362 -123 Z M 332 -822 C 341 -862 387 -967 439 -967 C 454 -967 478 -918 478 -849 C 478 -745 401 -667 332 -599 C 326 -639 321 -678 321 -720 C 321 -757 324 -791 332 -822 Z M 562 21 C 562 92 533 165 462 194 C 441 74 414 -85 407 -129 C 497 -129 562 -68 562 21 Z M 122 513 C 122 579 173 666 308 666 C 355 666 396 654 432 632 C 486 594 500 528 500 465 C 500 426 494 381 484 324 C 481 304 475 274 469 235 C 567 203 640 101 640 -2 C 640 -153 533 -255 387 -255 C 377 -315 367 -374 358 -430 C 464 -541 537 -666 537 -825 C 537 -916 509 -990 493 -1026 C 469 -1077 440 -1112 422 -1112 C 415 -1112 384 -1100 351 -1061 C 287 -985 269 -857 269 -773 C 269 -719 274 -670 291 -558 C 290 -557 238 -504 217 -487 C 126 -402 0 -281 0 -81 C 0 106 163 253 349 253 C 378 253 405 250 428 246 C 447 342 458 412 458 465 C 458 569 405 624 304 624 C 280 624 259 619 257 619 C 256 618 254 617 254 616 C 254 614 256 613 259 612 C 306 605 353 565 353 501 C 353 447 312 390 237 390 C 167 390 122 447 122 513 Z',
  bass:'M 568 -124 C 568 -96 590 -74 616 -74 C 642 -74 664 -96 664 -124 C 664 -152 642 -175 616 -175 C 590 -175 568 -152 568 -124 Z M 254 -251 C 178 -251 117 -207 116 -207 C 57 -164 19 -98 19 -25 C 19 48 61 102 135 102 C 199 102 249 59 249 -7 C 249 -64 199 -111 143 -111 C 131 -111 120 -109 111 -106 C 101 -102 84 -92 76 -85 C 83 -129 113 -173 152 -194 C 177 -208 209 -214 244 -214 C 346 -214 396 -132 396 36 C 396 166 313 353 215 441 C 111 536 13 581 12 581 C 12 581 0 588 0 600 C 0 602 1 603 1 605 C 4 615 13 617 19 617 C 20 617 23 616 24 616 C 25 616 139 569 230 498 C 370 397 528 219 528 35 C 528 -139 434 -251 254 -251 Z M 568 123 C 568 151 590 174 616 174 C 642 174 664 151 664 123 C 664 95 642 72 616 72 C 590 72 568 95 568 123 Z',
  tab6:'M 219 -126 L 278 56 L 159 56 Z M 242 360 C 280 360 322 361 322 410 C 322 452 291 462 254 462 L 141 462 L 141 360 Z M 255 539 C 294 539 331 549 331 596 C 331 648 300 662 254 662 L 141 662 L 141 539 Z M 0 231 L 101 231 L 133 136 L 303 136 L 334 231 L 439 231 L 275 -232 L 165 -232 Z M 36 -746 L 36 -665 L 173 -665 L 173 -291 L 269 -291 L 269 -665 L 405 -665 L 405 -746 Z M 273 279 L 49 279 L 49 743 L 260 743 C 323 743 373 731 408 677 C 422 655 429 630 429 603 C 429 551 407 513 357 494 C 398 474 414 447 414 400 C 414 316 352 280 273 279 Z',
  tab4:'M 147 -85 L 186 37 L 107 37 Z M 162 241 C 177 241 190 242 199 245 C 210 250 216 259 216 274 C 216 288 212 296 203 302 C 194 307 184 309 170 309 L 94 309 L 94 241 Z M 171 361 C 197 361 222 367 222 399 C 222 418 215 431 202 438 C 194 441 184 443 170 443 L 94 443 L 94 361 Z M 0 154 L 68 154 L 89 91 L 203 91 L 224 154 L 294 154 L 184 -156 L 111 -156 Z M 24 -500 L 24 -446 L 116 -446 L 116 -195 L 180 -195 L 180 -446 L 271 -446 L 271 -500 Z M 183 186 L 33 186 L 33 497 L 174 497 C 188 497 202 496 216 493 C 230 491 242 485 252 477 C 274 462 287 429 287 404 C 287 367 272 345 239 330 C 250 325 258 320 263 313 C 273 302 277 286 277 268 C 277 211 237 187 183 186 Z',
  brace:'M 9 -500 C 27 -519 62 -558 62 -630 C 62 -721 23 -813 23 -870 C 23 -931 58 -988 60 -990 C 60 -991 60 -991 60 -992 C 60 -993 60 -994 59 -995 C 58 -995 56 -995 55 -993 C 54 -992 0 -938 0 -856 C 0 -768 35 -706 35 -591 C 35 -569 26 -534 1 -503 C 0 -503 0 -501 0 -500 C -1 -499 0 -498 1 -497 C 26 -466 35 -431 35 -409 C 35 -294 0 -232 0 -144 C 0 -63 54 -8 55 -7 C 56 -5 58 -4 59 -5 C 60 -6 61 -7 60 -8 C 60 -8 60 -9 60 -10 C 58 -12 23 -69 23 -130 C 23 -187 62 -279 62 -370 C 62 -443 27 -481 9 -500 Z'
};

const PRESETS = {
  standard: {...defaults},
  large: {...defaults, systems:'7', staffGap:'30'},
  memo: {...defaults, systems:'8', staffGap:'26', barDivision:'4', showDate:false},
  piano: {...defaults, scoreType:'piano', systems:'5', pianoSystems:'5', barDivision:'4'},
  guitarStaffTab: {...defaults, scoreType:'staffTab', staffTabSystems:'5', staffTabStrings:6, barDivision:'4'},
  bassStaffTab: {...defaults, scoreType:'staffTab', staffTabSystems:'5', staffTabStrings:4, clef:'bass', barDivision:'4'},
  guitar: {...defaults, scoreType:'tab', systems:'10', tabSystems:'10', tabStrings:6},
  guitar7: {...defaults, scoreType:'tab', systems:'9', tabSystems:'9', tabStrings:7},
  bass: {...defaults, scoreType:'tab', systems:'12', tabSystems:'12', tabStrings:4},
  bass5: {...defaults, scoreType:'tab', systems:'11', tabSystems:'11', tabStrings:5},
  chordGrid: {...defaults, scoreType:'chordGrid', chordGridLayout:'5x5', chordGridScale:'35', showDate:false},
  chordGrid24: {...defaults, scoreType:'chordGrid', chordGridLayout:'4x6', chordGridScale:'35', showDate:false},
  chordGrid28: {...defaults, scoreType:'chordGrid', chordGridLayout:'4x7', chordGridScale:'35', showDate:false},
  bassChordGrid: {...defaults, scoreType:'chordGrid', chordGridLayout:'5x5', chordGridScale:'35', chordGridStrings:4, showDate:false},
  chordChart: {...defaults, scoreType:'chordChart', chordChartRows:'12', chordChartSpacing:'22', chordChartDivisions:'4', chordChartColumns:'1', showDate:false},
  chordChart2: {...defaults, orientation:'landscape', scoreType:'chordChart', chordChartRows:'12', chordChartSpacing:'12', chordChartDivisions:'4', chordChartColumns:'2', showDate:false},
  fretboard: {...defaults, scoreType:'fretboard', fretboardCount:'5', fretboardScale:'22', fretboardStrings:6, showDate:false},
  bassFretboard: {...defaults, scoreType:'fretboard', fretboardCount:'5', fretboardScale:'22', fretboardStrings:4, showDate:false},
  keyboardFull: {...defaults, scoreType:'keyboard', keyboardLayout:'full', keyboardScale:'22', showDate:false},
  keyboardMemo: {...defaults, scoreType:'keyboard', keyboardLayout:'memo', keyboardScale:'22', showDate:false}
};

function svgEl(name, attrs={}) {
  const el=document.createElementNS('http://www.w3.org/2000/svg',name);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
  return el;
}
function musicSymbol(name,x,y,fontSize) {
  return musicSymbolScaled(name,x,y,fontSize/1000,fontSize/1000);
}
function musicSymbolScaled(name,x,y,scaleX,scaleY) {
  return svgEl('path',{
    d:MUSIC_PATHS[name],
    fill:'#202622',
    transform:'translate('+x+' '+y+') scale('+scaleX+' '+scaleY+')'
  });
}
function announce(message) {
  $('appStatus').textContent='';
  requestAnimationFrame(()=>$('appStatus').textContent=message);
}
function announceStorageBlock(key,reason) {
  const token=key+':'+reason;
  const label=key===FAVORITES_KEY?'お気に入り':'設定';
  const message=reason==='future'
    ?label+'は新しいバージョンで保存されています。内容を守るため、この画面からの上書きを停止しました'
    :label+'の保存データを読み込めませんでした。内容を守るため、自動上書きを停止しました';
  if (storageBlockWarnings.has(token)&&$('appStatus').textContent===message) return;
  storageBlockWarnings.add(token);
  announce(message);
}
function clearStorageBlock(key) {
  unreadableStorageKeys.delete(key);
  futureStorageKeys.delete(key);
  [...storageBlockWarnings].forEach(token=>{
    if (token.startsWith(key+':')) storageBlockWarnings.delete(token);
  });
}
function hasFutureSchema(value,currentVersion=SCHEMA_VERSION) {
  if (!value||typeof value!=='object'||Array.isArray(value)) return false;
  const version=Number(value.schemaVersion);
  return Number.isFinite(version)&&version>currentVersion;
}
function clampInt(value,min,max,fallback) {
  if (value===null||value===undefined||String(value).trim()==='') return fallback;
  const number=Number(value);
  return Number.isFinite(number)?Math.min(max,Math.max(min,Math.round(number))):fallback;
}
function normalizeChordGridLayout(value,legacyCount,fallback='5x5') {
  const layout=String(value||'');
  if (Object.prototype.hasOwnProperty.call(CHORD_GRID_LAYOUTS,layout)) return layout;
  const count=Number(legacyCount);
  const legacyLayouts={12:'3x4',15:'3x5',16:'4x4',20:'4x5',24:'4x6',25:'5x5',28:'4x7',30:'5x6',35:'5x7'};
  if (Number.isFinite(count)&&Object.prototype.hasOwnProperty.call(legacyLayouts,count)) return legacyLayouts[count];
  return fallback;
}
function normalizeDiagramStrings(value,fallback=6) {
  const strings=Number(value);
  return [4,5,6,7].includes(strings)?strings:fallback;
}
function normalizeChordGridOrientation(value,fallback='vertical') {
  return ['vertical','horizontal'].includes(value)?value:fallback;
}
function normalizeChordGridFrets(value,fallback=5) {
  const frets=Number(value);
  return [4,5,6].includes(frets)?frets:fallback;
}
function normalizeChordChartColumns(value,fallback='1') {
  const columns=Number(value);
  return [1,2].includes(columns)?String(columns):String(fallback);
}
function boolValue(value,fallback) {
  if (typeof value==='boolean') return value;
  if (value==='true') return true;
  if (value==='false') return false;
  return fallback;
}
function isRecord(value) {
  return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}
function normalizeState(raw) {
  const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const sourceType=String(source.scoreType||source.scoreFamily||defaults.scoreType);
  const sourceSchema=Number(source.schemaVersion);
  const isLegacySchema=!Number.isFinite(sourceSchema)||sourceSchema<3;
  let type=sourceType;
  let normalizedGroup=clampInt(source.groupSize,1,3,1);
  let normalizedGuitar=clampInt(source.guitarStrings,6,7,6);
  let normalizedBass=clampInt(source.bassStrings,4,5,4);
  let normalizedTab=normalizeDiagramStrings(source.tabStrings,defaults.tabStrings);
  if (type==='guitar7') { type='guitar'; normalizedGuitar=7; }
  if (type==='bass5') { type='bass'; normalizedBass=5; }
  if (type==='guitar') { type='tab'; normalizedTab=normalizedGuitar; }
  if (type==='bass') { type='tab'; normalizedTab=normalizedBass; }
  if (type==='chord') type='chordGrid';
  if (type==='chordSheet') type='chordChart';
  if (type==='fingerboard') type='fretboard';
  if (type==='grand'||source.staffLayout==='piano') type='piano';
  if (source.staffLayout==='group2') normalizedGroup=2;
  if (source.staffLayout==='group3') normalizedGroup=3;
  if (!['staff','piano','staffTab','tab','chordGrid','chordChart','fretboard','keyboard'].includes(type)) type='staff';
  const isLegacySpecial=isLegacySchema&&['chordGrid','chordChart','fretboard'].includes(type);
  if (![6,7].includes(normalizedGuitar)) normalizedGuitar=6;
  if (![4,5].includes(normalizedBass)) normalizedBass=4;
  const migratedDate=source.showDate===undefined?source.showName:source.showDate;
  const migrateSharedRegularState=!Number.isFinite(sourceSchema)||sourceSchema<11;
  const normalizedRegularSystems=String(clampInt(isLegacySpecial?undefined:source.systems,1,16,Number(defaults.systems)));
  const normalizedRegularGap=String(clampInt(isLegacySpecial?undefined:source.staffGap,14,35,Number(defaults.staffGap)));
  return {
    schemaVersion:SCHEMA_VERSION,
    paperSize:Object.prototype.hasOwnProperty.call(sizes,source.paperSize)?source.paperSize:defaults.paperSize,
    orientation:['portrait','landscape'].includes(source.orientation)?source.orientation:defaults.orientation,
    margin:String(clampInt(source.margin,8,30,Number(defaults.margin))),
    systems:normalizedRegularSystems,
    staffGap:normalizedRegularGap,
    lineWeight:['1','2','3'].includes(String(source.lineWeight))?String(source.lineWeight):defaults.lineWeight,
    showTabLabel:boolValue(source.showTabLabel,defaults.showTabLabel),
    showTitle:boolValue(source.showTitle,defaults.showTitle),
    showDate:boolValue(migratedDate,defaults.showDate),
    clef:['treble','bass','none'].includes(source.clef)?source.clef:defaults.clef,
    scoreType:type,
    barDivision:String(clampInt(isLegacySpecial?undefined:(source.barDivision??source.measureCount),0,8,0)),
    groupSize:normalizedGroup,
    pianoSystems:String(clampInt(
      source.pianoSystems??(migrateSharedRegularState?normalizedRegularSystems:undefined),1,16,Number(defaults.pianoSystems)
    )),
    pianoStaffGap:String(clampInt(
      source.pianoStaffGap??(migrateSharedRegularState?normalizedRegularGap:undefined),14,35,Number(defaults.pianoStaffGap)
    )),
    tabSystems:String(clampInt(
      source.tabSystems??(migrateSharedRegularState?normalizedRegularSystems:undefined),1,16,Number(defaults.tabSystems)
    )),
    tabStaffGap:String(clampInt(
      source.tabStaffGap??(migrateSharedRegularState?normalizedRegularGap:undefined),14,35,Number(defaults.tabStaffGap)
    )),
    tabStrings:normalizedTab,
    staffTabStrings:normalizeDiagramStrings(source.staffTabStrings,defaults.staffTabStrings),
    staffTabSystems:String(clampInt(source.staffTabSystems,1,16,Number(defaults.staffTabSystems))),
    staffTabGap:String(clampInt(source.staffTabGap,14,35,Number(defaults.staffTabGap))),
    keyboardLayout:['full','memo'].includes(source.keyboardLayout)?source.keyboardLayout:defaults.keyboardLayout,
    keyboardScale:String(clampInt(source.keyboardScale,KEYBOARD_SCALE_MIN,KEYBOARD_SCALE_MAX,Number(defaults.keyboardScale))),
    chordGridLayout:normalizeChordGridLayout(
      source.chordGridLayout,
      source.chordGridCount??(isLegacySchema&&type==='chordGrid'?source.systems:undefined),
      defaults.chordGridLayout
    ),
    chordGridScale:String(clampInt(
      source.chordGridScale??(isLegacySchema&&type==='chordGrid'?source.staffGap:undefined),CHORD_GRID_SCALE_MIN,CHORD_GRID_SCALE_MAX,Number(defaults.chordGridScale)
    )),
    chordGridStrings:normalizeDiagramStrings(source.chordGridStrings,defaults.chordGridStrings),
    chordGridOrientation:normalizeChordGridOrientation(source.chordGridOrientation,defaults.chordGridOrientation),
    chordGridFrets:normalizeChordGridFrets(source.chordGridFrets,defaults.chordGridFrets),
    chordChartRows:String(clampInt(
      source.chordChartRows??(isLegacySchema&&type==='chordChart'?source.systems:undefined),1,CHORD_CHART_MAX_ROWS,Number(defaults.chordChartRows)
    )),
    chordChartSpacing:String(clampInt(
      source.chordChartSpacing??(isLegacySchema&&type==='chordChart'?source.staffGap:undefined),CHORD_CHART_MIN_SPACING,CHORD_CHART_MAX_SPACING,Number(defaults.chordChartSpacing)
    )),
    chordChartDivisions:String(clampInt(
      source.chordChartDivisions??(isLegacySchema&&type==='chordChart'?(source.barDivision??source.measureCount):undefined),0,8,Number(defaults.chordChartDivisions)
    )),
    chordChartColumns:normalizeChordChartColumns(source.chordChartColumns,defaults.chordChartColumns),
    fretboardCount:String(clampInt(
      source.fretboardCount??(isLegacySchema&&type==='fretboard'?source.systems:undefined),1,7,Number(defaults.fretboardCount)
    )),
    fretboardScale:String(clampInt(
      source.fretboardScale??(isLegacySchema&&type==='fretboard'?source.staffGap:undefined),14,35,Number(defaults.fretboardScale)
    )),
    fretboardStrings:normalizeDiagramStrings(source.fretboardStrings,defaults.fretboardStrings),
    fretboardFrets:String(clampInt(source.fretboardFrets,12,24,Number(defaults.fretboardFrets)))
  };
}
function safeRead(key,validator=null) {
  try {
    const value=localStorage.getItem(key);
    if (value===null) {
      unreadableStorageKeys.delete(key);
      return null;
    }
    const parsed=JSON.parse(value);
    if (validator&&!validator(parsed)) throw new TypeError('保存形式が正しくありません');
    unreadableStorageKeys.delete(key);
    return parsed;
  } catch {
    unreadableStorageKeys.add(key);
    announceStorageBlock(key,'unreadable');
    return null;
  }
}
function safeWrite(key,value) {
  if (unreadableStorageKeys.has(key)) {
    announceStorageBlock(key,'unreadable');
    return false;
  }
  if (futureStorageKeys.has(key)) {
    announceStorageBlock(key,'future');
    return false;
  }
  try {
    localStorage.setItem(key,JSON.stringify(value));
    if (storageWarningShown) {
      storageWarningShown=false;
      announce('設定を保存できる状態に戻りました');
    }
    return true;
  } catch {
    const message='設定を保存できませんでした。この画面ではそのまま使えます';
    if (!storageWarningShown||$('appStatus').textContent!==message) announce(message);
    storageWarningShown=true;
    return false;
  }
}
function captureState() {
  return normalizeState({
    schemaVersion:defaults.schemaVersion,
    paperSize:els.paperSize.value, orientation:els.orientation.value,
    margin:els.margin.value, systems:regularSystems, staffGap:regularStaffGap,
    lineWeight:els.lineWeight.value, showTabLabel:els.showTabLabel.checked,
    showTitle:els.showTitle.checked, showDate:els.showDate.checked,
    clef, scoreType, barDivision, groupSize,
    pianoSystems, pianoStaffGap, tabSystems, tabStaffGap, tabStrings,
    staffTabStrings, staffTabSystems, staffTabGap,
    keyboardLayout, keyboardScale,
    chordGridLayout, chordGridScale, chordGridStrings, chordGridOrientation, chordGridFrets, chordChartRows, chordChartSpacing, chordChartDivisions, chordChartColumns,
    fretboardCount, fretboardScale, fretboardStrings, fretboardFrets
  });
}
function currentPage() {
  const size=sizes[els.paperSize.value];
  const landscape=els.orientation.value==='landscape';
  const dimensions=landscape?[size.p[1],size.p[0]]:size.p;
  return {size,landscape,w:dimensions[0],h:dimensions[1]};
}
function isRegularScore(type=scoreType) {
  return ['staff','piano','staffTab','tab'].includes(type);
}
function activeDivision(type=scoreType) {
  return type==='chordChart'?chordChartDivisions:barDivision;
}
function commitActiveControls(type=scoreType) {
  if (type==='chordGrid') {
    chordGridScale=String(clampInt(els.staffGap.value,CHORD_GRID_SCALE_MIN,CHORD_GRID_SCALE_MAX,Number(chordGridScale)));
  } else if (type==='chordChart') {
    chordChartRows=String(clampInt(els.systems.value,1,CHORD_CHART_MAX_ROWS,Number(chordChartRows)));
    chordChartSpacing=String(clampInt(els.staffGap.value,CHORD_CHART_MIN_SPACING,CHORD_CHART_MAX_SPACING,Number(chordChartSpacing)));
  } else if (type==='fretboard') {
    fretboardCount=String(clampInt(els.systems.value,1,7,Number(fretboardCount)));
    fretboardScale=String(clampInt(els.staffGap.value,14,35,Number(fretboardScale)));
  } else if (type==='keyboard') {
    keyboardScale=String(clampInt(els.staffGap.value,KEYBOARD_SCALE_MIN,KEYBOARD_SCALE_MAX,Number(keyboardScale)));
  } else if (type==='staffTab') {
    staffTabSystems=String(clampInt(els.systems.value,1,16,Number(staffTabSystems)));
    staffTabGap=String(clampInt(els.staffGap.value,14,35,Number(staffTabGap)));
  } else if (type==='piano') {
    pianoSystems=String(clampInt(els.systems.value,1,16,Number(pianoSystems)));
    pianoStaffGap=String(clampInt(els.staffGap.value,14,35,Number(pianoStaffGap)));
  } else if (type==='tab') {
    tabSystems=String(clampInt(els.systems.value,1,16,Number(tabSystems)));
    tabStaffGap=String(clampInt(els.staffGap.value,14,35,Number(tabStaffGap)));
  } else {
    regularSystems=String(clampInt(els.systems.value,1,16,Number(regularSystems)));
    regularStaffGap=String(clampInt(els.staffGap.value,14,35,Number(regularStaffGap)));
  }
}
function hydrateActiveControls(type=scoreType) {
  els.systems.min='1';
  els.systems.step='1';
  els.staffGap.min='14';
  els.staffGap.max='35';
  els.staffGap.step='1';
  if (type==='chordGrid') {
    els.staffGap.min=String(CHORD_GRID_SCALE_MIN);
    els.staffGap.max=String(CHORD_GRID_SCALE_MAX);
    els.staffGap.value=chordGridScale;
  } else if (type==='chordChart') {
    els.systems.max=String(CHORD_CHART_MAX_ROWS);
    els.systems.value=chordChartRows;
    els.staffGap.min=String(CHORD_CHART_MIN_SPACING);
    els.staffGap.max=String(CHORD_CHART_MAX_SPACING);
    els.staffGap.value=chordChartSpacing;
  } else if (type==='fretboard') {
    els.systems.max='7';
    els.systems.value=fretboardCount;
    els.staffGap.value=fretboardScale;
  } else if (type==='keyboard') {
    els.staffGap.min=String(KEYBOARD_SCALE_MIN);
    els.staffGap.max=String(KEYBOARD_SCALE_MAX);
    els.staffGap.value=keyboardScale;
  } else if (type==='staffTab') {
    els.systems.max='16';
    els.systems.value=staffTabSystems;
    els.staffGap.value=staffTabGap;
  } else if (type==='piano') {
    els.systems.max='16';
    els.systems.value=pianoSystems;
    els.staffGap.value=pianoStaffGap;
  } else if (type==='tab') {
    els.systems.max='16';
    els.systems.value=tabSystems;
    els.staffGap.value=tabStaffGap;
  } else {
    els.systems.max='16';
    els.systems.value=regularSystems;
    els.staffGap.value=regularStaffGap;
  }
  selectButtons('bars',activeDivision(type));
}
function buildLayout(gap) {
  let staves;
  let innerGap=0;
  let groupMark=null;
  if (scoreType==='piano') {
    staves=[{lines:5,clef:'treble',isTab:false},{lines:5,clef:'bass',isTab:false}];
    innerGap=gap*3.5;
    groupMark='brace';
  } else if (scoreType==='staff') {
    staves=Array.from({length:groupSize},()=>({lines:5,clef,isTab:false}));
    if (groupSize>1) {
      innerGap=gap*4.5;
      groupMark='bracket';
    }
  } else if (scoreType==='staffTab') {
    staves=[
      {lines:5,clef,isTab:false},
      {lines:staffTabStrings,clef:null,isTab:true}
    ];
    innerGap=gap*3.5;
    groupMark='line';
  } else {
    staves=[{lines:tabStrings,clef:null,isTab:true}];
  }
  let cursor=0;
  staves.forEach((staff,index)=>{
    staff.y=cursor;
    staff.height=gap*(staff.lines-1);
    cursor+=staff.height+(index<staves.length-1?innerGap:0);
  });
  return {staves,innerGap,groupMark,isTab:staves.some(staff=>staff.isTab),baseHeight:cursor};
}
function layoutBounds(layout,gap,showTabLabel) {
  let minY=0;
  let maxY=layout.baseHeight;
  layout.staves.forEach(staff=>{
    if (staff.isTab&&showTabLabel) {
      const scale=staff.lines*gap/1489;
      const center=staff.y+staff.height/2;
      minY=Math.min(minY,center-746*scale);
      maxY=Math.max(maxY,center+743*scale);
    }
    if (staff.clef==='treble') {
      const scale=gap*4/1000;
      const origin=staff.y+gap*3;
      minY=Math.min(minY,origin-1112*scale);
      maxY=Math.max(maxY,origin+666*scale);
    } else if (staff.clef==='bass') {
      const scale=gap*4/1000;
      const origin=staff.y+gap;
      minY=Math.min(minY,origin-251*scale);
      maxY=Math.max(maxY,origin+617*scale);
    }
  });
  return {minY,maxY};
}
function addRule(svg,x1,y1,x2,y2,stroke,width) {
  svg.append(svgEl('line',{
    x1:x1.toFixed(3),y1:y1.toFixed(3),x2:x2.toFixed(3),y2:y2.toFixed(3),
    stroke,'stroke-width':width
  }));
}
function drawGroupMark(svg,layout,x,y,gap,stroke) {
  if (!layout.groupMark) return;
  const bottom=y+layout.baseHeight;
  const staffStartX=x;
  addRule(svg,staffStartX,y,staffStartX,bottom,'#252b27',stroke);
  if (layout.groupMark==='line') return;
  if (layout.groupMark==='brace') {
    const braceWidth=Math.max(2.7,gap*1.45);
    const braceRightGap=gap*.2;
    const braceX=Math.max(.4,staffStartX-braceRightGap-(62/63)*braceWidth);
    svg.append(musicSymbolScaled('brace',braceX,bottom,braceWidth/63,layout.baseHeight/995));
  } else {
    const outerX=.9;
    const bracketWidth=Math.max(.42,stroke*1.35);
    addRule(svg,outerX,y,outerX,bottom,'#252b27',bracketWidth);
    addRule(svg,outerX,y,staffStartX,y,'#252b27',bracketWidth);
    addRule(svg,outerX,bottom,staffStartX,bottom,'#252b27',bracketWidth);
  }
}
function applyPaperFrame(page,margin,metaHeight) {
  const paper=$('paper');
  paper.style.width=page.w+'mm';
  paper.style.height=page.h+'mm';
  paper.style.setProperty('--margin',margin+'mm');
  paper.classList.toggle('landscape',page.landscape);
  paper.dataset.width=String(page.w);
  paper.dataset.height=String(page.h);
  updateStage();
  $('titleField').style.display=els.showTitle.checked?'flex':'none';
  const meta=document.querySelector('.paper-meta');
  meta.classList.toggle('title-centered',els.showTitle.checked);
  meta.style.height=metaHeight+'mm';
  $('dateField').style.display=els.showDate.checked?'flex':'none';
}
function updateCommonOutputs(margin) {
  $('marginOut').value=margin+' mm';
  $('lineWeightOut').value=weights[els.lineWeight.value][1];
  els.margin.setAttribute('aria-valuetext',margin+'ミリメートル');
  els.lineWeight.setAttribute('aria-valuetext',weights[els.lineWeight.value][1]);
}
function chordGridFit(layoutKey,innerW,usableH,stroke,landscape=false,diagramOrientation='vertical',fretCells=5) {
  const canonical=CHORD_GRID_LAYOUTS[layoutKey];
  const rotated=landscape&&canonical.rows>canonical.columns;
  const layout={
    ...canonical,
    columns:rotated?canonical.rows:canonical.columns,
    rows:rotated?canonical.columns:canonical.rows,
    renderedLabel:rotated?canonical.rows+'×'+canonical.columns:canonical.label
  };
  const minimumGap=4;
  const topLineWidth=Math.max(stroke,.42);
  const horizontal=diagramOrientation==='horizontal';
  const longFactor=.4224*normalizeChordGridFrets(fretCells,defaults.chordGridFrets);
  const widthFactor=horizontal?longFactor:1.32;
  const heightFactor=horizontal?1.32:longFactor;
  const widthPadding=horizontal?(topLineWidth+stroke)/2:stroke;
  const heightPadding=horizontal?stroke:(topLineWidth+stroke)/2;
  const scaleX=(innerW-layout.columns*widthPadding-(layout.columns+1)*minimumGap)/(widthFactor*layout.columns);
  const scaleY=(usableH-layout.rows*heightPadding-(layout.rows+1)*minimumGap)/(heightFactor*layout.rows);
  return {
    layout,minimumGap,topLineWidth,horizontal,widthFactor,heightFactor,widthPadding,heightPadding,
    maxScale:Math.max(1,Math.min(CHORD_GRID_SCALE_MAX,Math.floor(Math.min(scaleX,scaleY))))
  };
}
function drawChordGridPage(page,margin,gap,stroke,metaHeight,usableH,innerW) {
  const svg=$('staffSvg');
  const requestedLayout=normalizeChordGridLayout(chordGridLayout,null,defaults.chordGridLayout);
  const orientation=normalizeChordGridOrientation(chordGridOrientation,defaults.chordGridOrientation);
  chordGridOrientation=orientation;
  const frets=normalizeChordGridFrets(chordGridFrets,defaults.chordGridFrets);
  chordGridFrets=frets;
  const fits=Object.fromEntries(Object.keys(CHORD_GRID_LAYOUTS).map(key=>[key,chordGridFit(key,innerW,usableH,stroke,page.landscape,orientation,frets)]));
  const layoutKey=requestedLayout;
  document.querySelectorAll('[data-layout]').forEach(button=>{
    button.disabled=false;
    button.removeAttribute('title');
  });
  const fit=fits[layoutKey];
  const layout=fit.layout;
  const {columns,rows}=layout;
  const count=columns*rows;
  selectButtons('layout',layoutKey);
  const strings=normalizeDiagramStrings(chordGridStrings,6);
  chordGridStrings=strings;
  const instrument=strings<=5?'ベース':'ギター';
  const {topLineWidth,maxScale,horizontal,widthFactor,heightFactor,widthPadding,heightPadding}=fit;
  const requestedScale=clampInt(chordGridScale,CHORD_GRID_SCALE_MIN,CHORD_GRID_SCALE_MAX,maxScale);
  const scale=Math.min(requestedScale,maxScale);
  els.staffGap.min=String(CHORD_GRID_SCALE_MIN);
  els.staffGap.max=String(CHORD_GRID_SCALE_MAX);
  els.staffGap.value=String(requestedScale);
  const diagramW=scale*widthFactor;
  const diagramH=scale*heightFactor;
  const visualW=diagramW+widthPadding;
  const visualH=diagramH+heightPadding;
  const columnGap=Math.max(0,(innerW-visualW*columns)/(columns+1));
  const rowGap=Math.max(0,(usableH-visualH*rows)/(rows+1));
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 '+innerW+' '+usableH);
  const orientationLabel=horizontal?'横向き':'縦向き';
  svg.setAttribute('aria-label','記入用'+instrument+'ダイアグラム、'+strings+'弦、'+frets+'フレット、'+orientationLabel+'、選択'+layout.label+'、配置'+columns+'列×'+rows+'行');
  for (let index=0;index<count;index++) {
    const column=index%columns;
    const row=Math.floor(index/columns);
    const x=columnGap+(horizontal?topLineWidth/2:stroke/2)+column*(visualW+columnGap);
    const y=rowGap+(horizontal?stroke/2:topLineWidth/2)+row*(visualH+rowGap);
    if (horizontal) {
      for (let stringIndex=0;stringIndex<strings;stringIndex++) {
        const lineY=y+diagramH*stringIndex/(strings-1);
        addRule(svg,x,lineY,x+diagramW,lineY,'#252b27',stroke);
      }
      for (let fretIndex=0;fretIndex<=frets;fretIndex++) {
        const lineX=x+diagramW*fretIndex/frets;
        const width=fretIndex===0?topLineWidth:stroke;
        addRule(svg,lineX,y,lineX,y+diagramH,'#252b27',width);
      }
    } else {
      for (let stringIndex=0;stringIndex<strings;stringIndex++) {
        const lineX=x+diagramW*stringIndex/(strings-1);
        addRule(svg,lineX,y,lineX,y+diagramH,'#252b27',stroke);
      }
      for (let fretIndex=0;fretIndex<=frets;fretIndex++) {
        const lineY=y+diagramH*fretIndex/frets;
        const width=fretIndex===0?topLineWidth:stroke;
        addRule(svg,x,lineY,x+diagramW,lineY,'#252b27',width);
      }
    }
  }
  applyPaperFrame(page,margin,metaHeight);
  updateCommonOutputs(margin);
  const layoutSummary=layout.label===layout.renderedLabel
    ?layout.label
    :layout.label+' → 配置 '+layout.renderedLabel;
  $('systemsOut').value=layoutSummary+'（'+count+'枠）・'+frets+'フレット';
  const compact=Math.min(diagramW,diagramH)<11.5;
  const fitted=scale<requestedScale;
  $('staffGapOut').value=(fitted?'自動調整：':'')+diagramW.toFixed(1)+' × '+diagramH.toFixed(1)+' mm'+(compact?'・細かめ':'');
  els.staffGap.setAttribute('aria-valuetext','ダイアグラムの設定サイズ'+requestedScale+(fitted?'、用紙に合わせて自動調整':'')+'、表示幅'+diagramW.toFixed(1)+'ミリメートル、高さ'+diagramH.toFixed(1)+'ミリメートル'+(compact?'、細かめ':''));
  $('systemsLimit').textContent='';
  $('pageInfo').textContent=page.size.label+' · '+(page.landscape?'よこ':'たて')+' · '+instrument+'ダイアグラム・'+strings+'弦・'+frets+'フレット · '+(horizontal?'横型':'縦型')+' · '+layout.renderedLabel;
  safeWrite(SETTINGS_KEY,captureState());
}
function drawChordChartPage(page,margin,gap,stroke,metaHeight,usableH,innerW) {
  const svg=$('staffSvg');
  const requestedRows=clampInt(chordChartRows,1,CHORD_CHART_MAX_ROWS,12);
  const spacing=clampInt(chordChartSpacing,CHORD_CHART_MIN_SPACING,CHORD_CHART_MAX_SPACING,22);
  const spacingGap=spacing/10;
  const tickHalf=Math.max(1.2,spacingGap*.6);
  const safeTickInset=tickHalf+stroke/2;
  const aestheticInset=Math.min(usableH*.22,Math.max(8,spacingGap*5.5));
  const verticalInset=Math.max(safeTickInset,aestheticInset);
  const desiredStep=Math.max(8,spacingGap*9.2);
  const maxRows=Math.max(1,Math.min(CHORD_CHART_MAX_ROWS,
    Math.floor(Math.max(0,usableH-verticalInset*2)/desiredStep)+1));
  const rows=Math.min(requestedRows,maxRows);
  const columns=Number(normalizeChordChartColumns(chordChartColumns,'1'));
  chordChartRows=String(requestedRows);
  chordChartSpacing=String(spacing);
  chordChartColumns=String(columns);
  els.systems.max=String(CHORD_CHART_MAX_ROWS);
  els.systems.value=String(requestedRows);
  els.staffGap.min=String(CHORD_CHART_MIN_SPACING);
  els.staffGap.max=String(CHORD_CHART_MAX_SPACING);
  els.staffGap.value=String(spacing);
  const usedHeight=rows>1?(rows-1)*desiredStep:0;
  const firstY=rows===1?usableH/2:(usableH-usedHeight)/2;
  const divisions=clampInt(chordChartDivisions,0,8,4);
  const edgeInset=Math.max(.2,stroke/2);
  const contentW=Math.max(1,innerW-edgeInset*2);
  const desiredColumnGap=Math.min(28,Math.max(12,contentW*.10));
  const columnGap=columns===2?Math.min(desiredColumnGap,Math.max(0,contentW-48)):0;
  const columnW=(contentW-columnGap*(columns-1))/columns;
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 '+innerW+' '+usableH);
  const divisionLabel=divisions?'1行'+divisions+'区切り':'区切りなし';
  svg.setAttribute('aria-label','記入用コード譜、'+columns+'列、1列'+rows+'行、全'+(rows*columns)+'行、'+divisionLabel);
  for (let column=0;column<columns;column++) {
    const x1=edgeInset+column*(columnW+columnGap);
    const x2=x1+columnW;
    for (let row=0;row<rows;row++) {
      const y=firstY+row*desiredStep;
      addRule(svg,x1,y,x2,y,'#252b27',stroke);
      if (divisions>0) {
        for (let tick=0;tick<=divisions;tick++) {
          const x=x1+(x2-x1)*tick/divisions;
          addRule(svg,x,y-tickHalf,x,y+tickHalf,'#252b27',stroke);
        }
      }
    }
  }
  applyPaperFrame(page,margin,metaHeight);
  updateCommonOutputs(margin);
  if (columns===2) {
    $('systemsOut').value=rows+' 行 × 2列（計 '+(rows*2)+'行）'+(rows===requestedRows?'':'・指定 '+requestedRows+'行');
  } else {
    $('systemsOut').value=rows===requestedRows?rows+' 行':rows+' 行（指定 '+requestedRows+'）';
  }
  $('staffGapOut').value=desiredStep.toFixed(1)+' mm';
  els.systems.setAttribute('aria-valuetext',columns===2
    ?'1列あたり'+(rows===requestedRows?rows+'行':'指定'+requestedRows+'行、現在表示'+rows+'行')+'、2列、合計'+(rows*2)+'行'
    :(rows===requestedRows?rows+'行':'指定'+requestedRows+'行、現在表示'+rows+'行'));
  els.staffGap.setAttribute('aria-valuetext','行の間隔'+desiredStep.toFixed(1)+'ミリメートル');
  $('systemsLimit').textContent=requestedRows>maxRows
    ?(columns===2?'1列あたり':'')+'指定'+requestedRows+'行のうち、現在の用紙と行間では'+rows+'行を表示'
    :maxRows<CHORD_CHART_MAX_ROWS?'現在の用紙と行間では1列あたり最大 '+maxRows+' 行':'';
  $('pageInfo').textContent=page.size.label+' · '+(page.landscape?'よこ':'たて')+' · コード譜 · '+(columns===2?'2列×'+rows+'行':rows+'行')+' · '+(divisions?divisions+'分割':'区切りなし');
  selectButtons('chart',columns);
  safeWrite(SETTINGS_KEY,captureState());
}
function circlePath(cx,cy,r) {
  const k=r*.5522847498;
  return 'M '+(cx+r)+' '+cy+
    ' C '+(cx+r)+' '+(cy-k)+' '+(cx+k)+' '+(cy-r)+' '+cx+' '+(cy-r)+
    ' C '+(cx-k)+' '+(cy-r)+' '+(cx-r)+' '+(cy-k)+' '+(cx-r)+' '+cy+
    ' C '+(cx-r)+' '+(cy+k)+' '+(cx-k)+' '+(cy+r)+' '+cx+' '+(cy+r)+
    ' C '+(cx+k)+' '+(cy+r)+' '+(cx+r)+' '+(cy+k)+' '+(cx+r)+' '+cy+' Z';
}
function drawFretboardPage(page,margin,gap,stroke,metaHeight,usableH,innerW) {
  const svg=$('staffSvg');
  const strings=normalizeDiagramStrings(fretboardStrings,6);
  const frets=clampInt(els.fretboardFrets.value,12,24,Number(fretboardFrets));
  fretboardStrings=strings;
  fretboardFrets=String(frets);
  els.fretboardFrets.value=String(frets);
  const instrument=strings<=5?'ベース':'ギター';
  const nutWidth=Math.max(.8,stroke*2.5);
  const inset=Math.max(stroke/2,nutWidth/2);
  const boardW=Math.max(1,innerW-inset*2);
  const boardH=Math.max(12,gap*13.5);
  const minBoardGap=7;
  const safeHeight=Math.max(1,usableH-stroke);
  const maxBoards=Math.max(1,Math.min(7,Math.floor((safeHeight+minBoardGap)/(boardH+minBoardGap))));
  const requested=clampInt(fretboardCount,1,7,5);
  const count=Math.min(requested,maxBoards);
  fretboardCount=String(requested);
  els.systems.max='7';
  els.systems.value=String(requested);
  const boardGap=count>1?Math.min(boardH,Math.max(minBoardGap,(safeHeight-boardH*count)/(count-1))):0;
  const groupHeight=boardH*count+boardGap*(count-1);
  const groupTop=stroke/2+Math.max(0,(safeHeight-groupHeight)/2);
  const markerFrets=[3,5,7,9,12,15,17,19,21,24].filter(fret=>fret<=frets);
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 '+innerW+' '+usableH);
  svg.setAttribute('aria-label','記入用'+instrument+'指板図、'+strings+'弦、'+frets+'フレット');
  for (let board=0;board<count;board++) {
    const y=groupTop+board*(boardH+boardGap);
    for (let stringIndex=0;stringIndex<strings;stringIndex++) {
      const lineY=y+boardH*stringIndex/(strings-1);
      addRule(svg,inset,lineY,inset+boardW,lineY,'#252b27',stroke);
    }
    for (let fret=0;fret<=frets;fret++) {
      const x=inset+boardW*fret/frets;
      const width=fret===0?nutWidth:stroke;
      addRule(svg,x,y,x,y+boardH,'#252b27',width);
    }
    const radius=Math.max(.75,Math.min(1.5,boardH*.055));
    const markerGapRatio=target=>{
      const intervals=strings-1;
      const gapIndex=Math.min(intervals-1,Math.max(0,Math.round(target*intervals-.5)));
      return (gapIndex+.5)/intervals;
    };
    markerFrets.forEach(fret=>{
      const x=inset+boardW*(fret-.5)/frets;
      if (fret%12===0) {
        svg.append(svgEl('path',{d:circlePath(x,y+boardH*markerGapRatio(.3),radius),fill:'#aeb3af'}));
        svg.append(svgEl('path',{d:circlePath(x,y+boardH*markerGapRatio(.7),radius),fill:'#aeb3af'}));
      } else {
        svg.append(svgEl('path',{d:circlePath(x,y+boardH*markerGapRatio(.5),radius),fill:'#aeb3af'}));
      }
    });
  }
  applyPaperFrame(page,margin,metaHeight);
  updateCommonOutputs(margin);
  const fitted=count<requested;
  $('systemsOut').value=count+' 本'+(fitted?'（指定 '+requested+'本）':'');
  $('staffGapOut').value='高さ '+boardH.toFixed(1)+' mm';
  $('fretboardFretsOut').value=frets+' フレット';
  els.systems.setAttribute('aria-valuetext',fitted
    ?'表示'+count+'本、指定'+requested+'本の指板'
    :count+'本の指板');
  els.staffGap.setAttribute('aria-valuetext','指板の高さ'+boardH.toFixed(1)+'ミリメートル');
  els.fretboardFrets.setAttribute('aria-valuetext',frets+'フレット');
  $('systemsLimit').textContent=maxBoards<7?'この設定では最大 '+maxBoards+' 本':'';
  $('pageInfo').textContent=page.size.label+' · '+(page.landscape?'よこ':'たて')+' · '+instrument+'指板図・'+strings+'弦・'+frets+'フレット · '+count+'本'+(fitted?'（指定'+requested+'本）':'');
  safeWrite(SETTINGS_KEY,captureState());
}
function drawKeyboardDiagram(svg,x,y,width,height,whiteKeys,stroke) {
  const keyWidth=width/whiteKeys;
  const blackDepth=height*.62;
  const blackWidth=keyWidth*.62;
  const blackOffsets=new Set([1,2,4,5,6]);
  addRule(svg,x,y,x+width,y,'#252b27',stroke);
  addRule(svg,x,y+height,x+width,y+height,'#252b27',stroke);
  for (let boundary=0;boundary<=whiteKeys;boundary++) {
    const lineX=x+boundary*keyWidth;
    const hasBlack=boundary>0&&boundary<whiteKeys&&blackOffsets.has(boundary%7);
    addRule(svg,lineX,y+(hasBlack?blackDepth:0),lineX,y+height,'#252b27',stroke);
  }
  for (let boundary=1;boundary<whiteKeys;boundary++) {
    if (!blackOffsets.has(boundary%7)) continue;
    const center=x+boundary*keyWidth;
    const left=center-blackWidth/2;
    const right=center+blackWidth/2;
    addRule(svg,left,y,left,y+blackDepth,'#252b27',stroke);
    addRule(svg,right,y,right,y+blackDepth,'#252b27',stroke);
    addRule(svg,left,y+blackDepth,right,y+blackDepth,'#252b27',stroke);
  }
}
function drawKeyboardPage(page,margin,stroke,metaHeight,usableH,innerW) {
  const svg=$('staffSvg');
  const layout=keyboardLayout==='memo'?'memo':'full';
  const requestedHeight=clampInt(keyboardScale,KEYBOARD_SCALE_MIN,KEYBOARD_SCALE_MAX,Number(defaults.keyboardScale));
  const columns=layout==='memo'?2:1;
  const rows=5;
  const whiteKeys=layout==='memo'?14:35;
  const memoHeight=0;
  const minimumRowGap=7;
  const maximumBoardHeight=(usableH-minimumRowGap*(rows+1)-memoHeight*rows)/rows;
  const boardHeight=Math.max(7,Math.min(requestedHeight,maximumBoardHeight));
  const cellHeight=boardHeight+memoHeight;
  const rowGap=Math.max(0,(usableH-cellHeight*rows)/(rows+1));
  const columnGap=layout==='memo'?Math.max(12,innerW*.12):0;
  const boardWidth=layout==='memo'?(innerW-columnGap-stroke)/2:innerW-stroke;
  const leftInset=stroke/2;
  keyboardLayout=layout;
  keyboardScale=String(requestedHeight);
  els.staffGap.min=String(KEYBOARD_SCALE_MIN);
  els.staffGap.max=String(KEYBOARD_SCALE_MAX);
  els.staffGap.value=String(requestedHeight);
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 '+innerW+' '+usableH);
  svg.setAttribute('aria-label',layout==='memo'?'記入用鍵盤図、2列5段':'記入用鍵盤図、横長5段');
  for (let row=0;row<rows;row++) {
    const y=rowGap+row*(cellHeight+rowGap);
    for (let column=0;column<columns;column++) {
      const x=leftInset+column*(boardWidth+columnGap);
      drawKeyboardDiagram(svg,x,y,boardWidth,boardHeight,whiteKeys,stroke);
    }
  }
  applyPaperFrame(page,margin,metaHeight);
  updateCommonOutputs(margin);
  $('systemsOut').value=layout==='memo'?'2列×5段':'横長5段';
  const fitted=boardHeight<requestedHeight;
  $('staffGapOut').value=boardHeight.toFixed(1)+' mm'+(fitted?'（設定 '+requestedHeight+'）':'');
  els.staffGap.setAttribute('aria-valuetext',fitted
    ?'鍵盤の表示高さ'+boardHeight.toFixed(1)+'ミリメートル、設定'+requestedHeight+'ミリメートル'
    :'鍵盤の高さ'+requestedHeight+'ミリメートル');
  $('systemsLimit').textContent='';
  $('pageInfo').textContent=page.size.label+' · '+(page.landscape?'よこ':'たて')+' · 鍵盤図 · '+(layout==='memo'?'2列×5段':'横長5段');
  safeWrite(SETTINGS_KEY,captureState());
}
function draw() {
  commitActiveControls(scoreType);
  const page=currentPage();
  const w=page.w;
  const h=page.h;
  const margin=Number(els.margin.value);
  const gap=Number(els.staffGap.value)/10;
  const stroke=weights[els.lineWeight.value][0];
  const metaHeight=(els.showTitle.checked||els.showDate.checked)?17:3;
  const usableH=Math.max(1,h-margin*2-metaHeight);
  const innerW=Math.max(1,w-margin*2);
  if (scoreType==='chordGrid') {
    drawChordGridPage(page,margin,gap,stroke,metaHeight,usableH,innerW);
    return;
  }
  if (scoreType==='chordChart') {
    drawChordChartPage(page,margin,gap,stroke,metaHeight,usableH,innerW);
    return;
  }
  if (scoreType==='fretboard') {
    drawFretboardPage(page,margin,gap,stroke,metaHeight,usableH,innerW);
    return;
  }
  if (scoreType==='keyboard') {
    drawKeyboardPage(page,margin,stroke,metaHeight,usableH,innerW);
    return;
  }
  const layout=buildLayout(gap);
  const bounds=layoutBounds(layout,gap,els.showTabLabel.checked);
  const groupEdgePad=layout.groupMark==='bracket'?Math.max(.42,stroke*1.35)/2:stroke/2;
  const topPad=Math.max(groupEdgePad,-bounds.minY);
  const bottomPad=Math.max(groupEdgePad,bounds.maxY-layout.baseHeight);
  const visualH=topPad+layout.baseHeight+bottomPad;
  const grouped=layout.staves.length>1;
  const minClearance=grouped?Math.max(7,gap*4):Math.max(4,gap*1.5);
  const possible=Math.floor((usableH+minClearance)/(visualH+minClearance));
  const maxSystems=Math.max(1,Math.min(16,possible));
  const requestedSystems=clampInt(els.systems.value,1,16,1);
  els.systems.min='1';
  els.systems.max='16';
  els.systems.value=String(requestedSystems);
  const systems=Math.min(requestedSystems,maxSystems);
  const step=systems===1?0:Math.max(0,(usableH-visualH)/(systems-1));
  const svg=$('staffSvg');
  const tabStaff=layout.staves.find(staff=>staff.isTab);
  const hasTabGlyph=Boolean(tabStaff)&&els.showTabLabel.checked;
  const tabScale=tabStaff?tabStaff.lines*gap/1489:0;
  const tabX=.7;
  const rawTabGutter=hasTabGlyph?tabX+439*tabScale+gap*.8:0;
  const staffStartX=layout.groupMark==='line'
    ?Math.max(rawTabGutter,stroke/2)
    :layout.groupMark?Math.max(7,gap*2.8):stroke/2;
  const tabGutter=hasTabGlyph?Math.max(rawTabGutter,staffStartX):staffStartX;
  const clefX=staffStartX+2.2;
  const hasClef=layout.staves.some(staff=>staff.clef&&staff.clef!=='none');
  const clefGutter=hasClef?clefX+gap*3.9:staffStartX;
  const measureStart=Math.max(tabGutter,clefGutter);
  svg.replaceChildren();
  svg.setAttribute('viewBox','0 0 '+innerW+' '+usableH);
  svg.setAttribute('aria-label',scoreType==='staffTab'
    ?'印刷用五線譜と'+staffTabStrings+'弦TAB譜'
    :scoreType==='tab'
      ?'印刷用'+(tabStrings<=5?'ベース':'ギター')+'TAB譜、'+tabStrings+'弦'
      :'印刷用'+(grouped?'複数段の':'')+'五線');

  for (let systemIndex=0;systemIndex<systems;systemIndex++) {
    const systemY=topPad+systemIndex*step;
    drawGroupMark(svg,layout,staffStartX,systemY,gap,stroke);
    layout.staves.forEach(staff=>{
      const staffY=systemY+staff.y;
      const startX=staff.isTab?tabGutter:staffStartX;
      for (let lineIndex=0;lineIndex<staff.lines;lineIndex++) {
        const lineY=staffY+lineIndex*gap;
        addRule(svg,startX,lineY,innerW-stroke/2,lineY,'#252b27',stroke);
      }
      if (staff.isTab&&hasTabGlyph) {
        svg.append(musicSymbolScaled('tab6',tabX,staffY+staff.height/2,tabScale,tabScale));
      } else if (staff.clef&&staff.clef!=='none') {
        if (staff.clef==='treble') {
          svg.append(musicSymbol('treble',clefX,staffY+gap*3,gap*4));
        } else {
          svg.append(musicSymbol('bass',clefX,staffY+gap,gap*4));
        }
      }
    });
    const measures=Number(barDivision);
    if (measures>0) {
      const barTop=systemY+layout.staves[0].y;
      const lastStaff=layout.staves[layout.staves.length-1];
      const barBottom=systemY+lastStaff.y+lastStaff.height;
      const dividerCount=layout.isTab?measures-1:measures;
      for (let measure=1;measure<=dividerCount;measure++) {
        const x=measureStart+(innerW-stroke/2-measureStart)*measure/measures;
        addRule(svg,x,barTop,x,barBottom,'#252b27',stroke);
      }
    }
  }

  const paper=$('paper');
  paper.style.width=w+'mm';
  paper.style.height=h+'mm';
  paper.style.setProperty('--margin',margin+'mm');
  paper.classList.toggle('landscape',page.landscape);
  paper.dataset.width=String(w);
  paper.dataset.height=String(h);
  updateStage();
  $('titleField').style.display=els.showTitle.checked?'flex':'none';
  const meta=document.querySelector('.paper-meta');
  meta.classList.toggle('title-centered',els.showTitle.checked);
  meta.style.height=metaHeight+'mm';
  $('dateField').style.display=els.showDate.checked?'flex':'none';
  const totalStaves=systems*layout.staves.length;
  const requestedSuffix=systems<requestedSystems?'（指定 '+requestedSystems+(grouped?'組':'段')+'）':'';
  const systemsText=(grouped?systems+' 組（'+totalStaves+' 段）':systems+' 段')+requestedSuffix;
  $('marginOut').value=margin+' mm';
  $('systemsOut').value=systemsText;
  $('staffGapOut').value=gap.toFixed(1)+' mm';
  $('lineWeightOut').value=weights[els.lineWeight.value][1];
  els.margin.setAttribute('aria-valuetext',margin+'ミリメートル');
  els.systems.setAttribute('aria-valuetext',systemsText);
  els.staffGap.setAttribute('aria-valuetext',gap.toFixed(1)+'ミリメートル');
  els.lineWeight.setAttribute('aria-valuetext',weights[els.lineWeight.value][1]);
  $('systemsLimit').textContent=maxSystems<16?'この設定では最大 '+maxSystems+(grouped?' 組':' 段'):'';
  let typeLabel='五線譜';
  if (scoreType==='piano') typeLabel='ピアノ大譜表';
  if (scoreType==='staff'&&groupSize>1) typeLabel=groupSize+'段組';
  if (scoreType==='tab') typeLabel=(tabStrings<=5?'ベース':'ギター')+'TAB・'+tabStrings+'弦';
  if (scoreType==='staffTab') typeLabel='五線譜＋'+(staffTabStrings<=5?'ベース':'ギター')+'TAB・'+staffTabStrings+'弦';
  $('pageInfo').textContent=page.size.label+' · '+(page.landscape?'よこ':'たて')+' · '+typeLabel+' · '+systemsText;
  safeWrite(SETTINGS_KEY,captureState());
}
function updateStage() {
  const paper=$('paper');
  const w=Number(paper.dataset.width||210);
  const h=Number(paper.dataset.height||297);
  const stage=$('paperStage');
  stage.style.width=w*zoom+'mm';
  stage.style.height=h*zoom+'mm';
}
function setZoom(next,precise=false) {
  const value=precise?next:Math.round(next*10)/10;
  zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));
  const percentage=Math.round(zoom*100);
  $('paper').style.setProperty('--zoom',zoom);
  $('zoomOutLabel').value=percentage+'%';
  $('actualSize').setAttribute('aria-label','現在のプレビュー倍率'+percentage+'パーセント。100パーセントに戻す');
  $('zoomOut').disabled=zoom<=MIN_ZOOM;
  $('zoomIn').disabled=zoom>=MAX_ZOOM;
  updateStage();
}
function fitZoom(mode) {
  const wrap=document.querySelector('.paper-wrap');
  const paper=$('paper');
  const padding=20;
  const width=(wrap.clientWidth-padding)/paper.offsetWidth;
  const height=(wrap.clientHeight-padding)/paper.offsetHeight;
  if (Number.isFinite(width)&&Number.isFinite(height)) {
    setZoom(mode==='page'?Math.min(width,height):width,true);
  }
}
function selectButtons(attribute,value) {
  document.querySelectorAll('[data-'+attribute+']').forEach(button=>{
    const selected=button.dataset[attribute]===String(value);
    button.classList.toggle('active',selected);
    button.setAttribute('aria-pressed',String(selected));
    button.tabIndex=selected?0:-1;
  });
}
function enableSegmentedKeyboardNavigation() {
  document.querySelectorAll('.segmented[role="group"]').forEach(group=>{
    group.addEventListener('keydown',event=>{
      if (event.altKey||event.ctrlKey||event.metaKey) return;
      const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
      if (!keys.includes(event.key)) return;
      const buttons=[...group.querySelectorAll('button')].filter(button=>!button.hidden&&!button.disabled);
      const current=buttons.indexOf(event.target);
      if (current<0||buttons.length<2) return;
      event.preventDefault();
      let next=current;
      const firstRowTop=buttons[0].offsetTop;
      const columns=Math.max(1,buttons.filter(button=>Math.abs(button.offsetTop-firstRowTop)<1).length);
      if (event.key==='Home') next=0;
      else if (event.key==='End') next=buttons.length-1;
      else if (event.key==='ArrowRight') next=(current+1)%buttons.length;
      else if (event.key==='ArrowLeft') next=(current-1+buttons.length)%buttons.length;
      else if (event.key==='ArrowDown') next=(current+columns)%buttons.length;
      else next=(current-columns+buttons.length)%buttons.length;
      if (next===current) return;
      buttons[next].focus();
      buttons[next].click();
    });
  });
}
function syncConditionalUI() {
  const isStaff=scoreType==='staff';
  const isTab=scoreType==='tab';
  const isStaffTab=scoreType==='staffTab';
  const isChordGrid=scoreType==='chordGrid';
  const isChordChart=scoreType==='chordChart';
  const isFretboard=scoreType==='fretboard';
  const isKeyboard=scoreType==='keyboard';
  const isGrouped=scoreType==='piano'||(isStaff&&groupSize>1);
  $('clefControls').style.display=isStaff||isStaffTab?'grid':'none';
  $('groupControls').style.display=isStaff?'block':'none';
  $('stringControls').style.display=isTab||isStaffTab||isChordGrid||isFretboard?'block':'none';
  $('fretControls').style.display=isFretboard?'block':'none';
  $('chordGridOrientationControls').style.display=isChordGrid?'block':'none';
  $('chordGridFretControls').style.display=isChordGrid?'block':'none';
  $('chordLayoutControls').style.display=isChordGrid?'block':'none';
  $('chordChartLayoutControls').style.display=isChordChart?'block':'none';
  $('keyboardLayoutControls').style.display=isKeyboard?'block':'none';
  $('systemsField').style.display=isChordGrid||isKeyboard?'none':'block';
  $('stringControlsLabel').textContent=isChordGrid?'ダイアグラムの弦数':isFretboard?'指板の弦数':isStaffTab||isTab?'TABの弦数':'弦数';
  $('tabLabelControl').style.display=isTab||isStaffTab?'flex':'none';
  $('barControls').style.display=isChordGrid||isFretboard||isKeyboard?'none':'block';
  $('systemsLabel').textContent=isChordGrid?'ダイアグラムの配置':isChordChart?(chordChartColumns==='2'?'1列の行数':'行数'):isFretboard?'指板数':isStaffTab||isGrouped?'組数':'段数';
  $('staffGapLabel').textContent=isChordGrid?'ダイアグラムの大きさ':isChordChart?'行の間隔':isFretboard?'指板の高さ':isKeyboard?'鍵盤の高さ':'線の間隔';
  $('barControls').querySelector('.control-label').textContent=isChordChart?'1行の区切り数':'小節数';
  $('barTypeButtons').setAttribute('aria-label',isChordChart?'1行の区切り数':'1段あたりの小節数');
  const diagramInstrument=(scoreType==='chordGrid'?chordGridStrings:fretboardStrings)<=5?'ベース':'ギター';
  const paperLabel={
    staff:'五線紙',piano:'ピアノ大譜表用紙',staffTab:'五線譜とTAB譜の用紙',tab:(tabStrings<=5?'ベース':'ギター')+'TAB譜用紙',
    chordGrid:(chordGridOrientation==='horizontal'?'横型':'縦型')+diagramInstrument+'ダイアグラム用紙、'+chordGridStrings+'弦、'+chordGridFrets+'フレット',chordChart:(chordChartColumns==='2'?'2列':'1列')+'コード譜用紙',fretboard:diagramInstrument+'指板図用紙',keyboard:'鍵盤図用紙'
  }[scoreType]||'五線紙';
  $('paper').setAttribute('aria-label',paperLabel);
  document.querySelector('.paper-wrap').setAttribute('aria-label','拡大縮小できる'+paperLabel+'プレビュー');
  document.querySelectorAll('[data-bars]').forEach(button=>{
    const value=button.dataset.bars;
    button.hidden=false;
    button.setAttribute('aria-label',value==='0'?(isChordChart?'区切りなし':'小節線なし'):value+(isChordChart?'区切り':'小節'));
  });
  document.querySelectorAll('[data-strings]').forEach(button=>{
    const strings=Number(button.dataset.strings);
    const relevant=(isTab||isStaffTab||isChordGrid||isFretboard)&&[4,5,6,7].includes(strings);
    button.hidden=!relevant;
  });
  selectButtons('score',scoreType);
  selectButtons('clef',clef);
  selectButtons('bars',activeDivision());
  selectButtons('group',groupSize);
  selectButtons('layout',chordGridLayout);
  selectButtons('diagram',chordGridOrientation);
  selectButtons('frets',chordGridFrets);
  selectButtons('chart',chordChartColumns);
  selectButtons('keyboard',keyboardLayout);
  const selectedStrings=isTab?tabStrings:scoreType==='staffTab'?staffTabStrings:scoreType==='chordGrid'?chordGridStrings:scoreType==='fretboard'?fretboardStrings:tabStrings;
  selectButtons('strings',selectedStrings);
}
function clearFavoriteSelection() {
  $('favoriteSelect').value='';
  $('deleteFavorite').disabled=true;
}
function clearPresetSelection() {
  $('presetSelect').value='';
}
function markCustomSettings() {
  clearFavoriteSelection();
  clearPresetSelection();
  if (!unreadableStorageKeys.size&&!futureStorageKeys.size&&!storageWarningShown) $('appStatus').textContent='';
}
function applyState(raw,options={}) {
  const state=normalizeState(raw);
  els.paperSize.value=state.paperSize;
  els.orientation.value=state.orientation;
  els.margin.value=state.margin;
  els.lineWeight.value=state.lineWeight;
  els.showTabLabel.checked=state.showTabLabel;
  els.showTitle.checked=state.showTitle;
  els.showDate.checked=state.showDate;
  clef=state.clef;
  scoreType=state.scoreType;
  barDivision=state.barDivision;
  regularSystems=state.systems;
  regularStaffGap=state.staffGap;
  pianoSystems=state.pianoSystems;
  pianoStaffGap=state.pianoStaffGap;
  tabSystems=state.tabSystems;
  tabStaffGap=state.tabStaffGap;
  staffTabSystems=state.staffTabSystems;
  staffTabGap=state.staffTabGap;
  staffTabStrings=state.staffTabStrings;
  keyboardLayout=state.keyboardLayout;
  keyboardScale=state.keyboardScale;
  chordGridLayout=state.chordGridLayout;
  chordGridScale=state.chordGridScale;
  chordGridStrings=state.chordGridStrings;
  chordGridOrientation=state.chordGridOrientation;
  chordGridFrets=state.chordGridFrets;
  chordChartRows=state.chordChartRows;
  chordChartSpacing=state.chordChartSpacing;
  chordChartDivisions=state.chordChartDivisions;
  chordChartColumns=state.chordChartColumns;
  fretboardCount=state.fretboardCount;
  fretboardScale=state.fretboardScale;
  fretboardStrings=state.fretboardStrings;
  fretboardFrets=state.fretboardFrets;
  els.fretboardFrets.value=fretboardFrets;
  groupSize=state.groupSize;
  tabStrings=state.tabStrings;
  hydrateActiveControls(scoreType);
  syncConditionalUI();
  if (options.resetZoom) setZoom(1);
  draw();
  if (options.message) announce(options.message);
}
function legacyFavoriteId(name,index) {
  let hash=0;
  for (let position=0;position<name.length;position++) {
    hash=(hash*31+name.charCodeAt(position))|0;
  }
  return 'legacy-'+index+'-'+Math.abs(hash).toString(36);
}
function readFavorites() {
  const stored=safeRead(FAVORITES_KEY,value=>Array.isArray(value)||(isRecord(value)&&Array.isArray(value.items)));
  const source=Array.isArray(stored)?stored:stored&&Array.isArray(stored.items)?stored.items:[];
  futureStorageKeys.delete(FAVORITES_KEY);
  if (hasFutureSchema(stored,FAVORITES_SCHEMA_VERSION)||source.some(item=>{
    if (!item||typeof item!=='object'||Array.isArray(item)) return false;
    const state=item.state&&typeof item.state==='object'&&!Array.isArray(item.state)?item.state:item;
    return hasFutureSchema(state);
  })) {
    futureStorageKeys.add(FAVORITES_KEY);
    announceStorageBlock(FAVORITES_KEY,'future');
  }
  const usedIds=new Set();
  const items=[];
  let migrated=Array.isArray(stored);
  for (let index=0;index<source.length;index++) {
    if (items.length>=FAVORITES_LIMIT) {
      migrated=true;
      break;
    }
    const item=source[index];
    if (!item||typeof item!=='object'||Array.isArray(item)||typeof item.name!=='string'||!item.name.trim()) {
      migrated=true;
      continue;
    }
    const nestedCandidate=item.state&&typeof item.state==='object'&&!Array.isArray(item.state)?item.state:null;
    const nestedState=nestedCandidate&&STATE_SOURCE_KEYS.some(key=>Object.prototype.hasOwnProperty.call(nestedCandidate,key))?nestedCandidate:null;
    const flatState=STATE_SOURCE_KEYS.some(key=>Object.prototype.hasOwnProperty.call(item,key))?item:null;
    const stateSource=nestedState||flatState;
    if (!stateSource) {
      migrated=true;
      continue;
    }
    if (String(stateSource.scoreType)==='rhythm') {
      migrated=true;
      continue;
    }
    const name=item.name.trim().slice(0,30);
    let id=item.id===undefined||item.id===null||String(item.id).trim()===''
      ?legacyFavoriteId(name,index):String(item.id);
    if (!item.id) migrated=true;
    if (usedIds.has(id)) {
      const base=id;
      let suffix=2;
      while (usedIds.has(id)) id=base+'-'+suffix++;
      migrated=true;
    }
    usedIds.add(id);
    const normalizedState=normalizeState(stateSource);
    const normalizedKeys=Object.keys(normalizedState);
    if (normalizedKeys.some(key=>stateSource[key]!==normalizedState[key])||
        Object.keys(stateSource).some(key=>!Object.prototype.hasOwnProperty.call(normalizedState,key))) {
      migrated=true;
    }
    const now=new Date().toISOString();
    items.push({
      id,name,state:normalizedState,
      createdAt:item.createdAt||now,
      updatedAt:item.updatedAt||item.createdAt||now
    });
    if (flatState||name!==item.name) migrated=true;
  }
  if (migrated) safeWrite(FAVORITES_KEY,{schemaVersion:FAVORITES_SCHEMA_VERSION,items});
  return items;
}
function writeFavorites(items) {
  return safeWrite(FAVORITES_KEY,{schemaVersion:FAVORITES_SCHEMA_VERSION,items});
}
function renderFavorites(selectedId='') {
  const select=$('favoriteSelect');
  const items=readFavorites();
  select.replaceChildren(new Option('保存した設定を選択',''));
  items.forEach(item=>select.add(new Option(item.name,item.id)));
  if (items.some(item=>item.id===selectedId)) select.value=selectedId;
  $('deleteFavorite').disabled=!select.value;
}
function saveFavorite() {
  const requested=window.prompt('お気に入り名を入力してください（30文字まで）','');
  if (requested===null) return;
  const name=requested.trim();
  if (!name) {
    announce('お気に入り名を入力してください');
    return;
  }
  if (name.length>30) {
    announce('お気に入り名は30文字以内にしてください');
    return;
  }
  const items=readFavorites();
  const existing=items.find(item=>item.name===name);
  const now=new Date().toISOString();
  let selectedId;
  if (existing) {
    if (!window.confirm('「'+name+'」を現在の設定で上書きしますか？')) return;
    existing.state=captureState();
    existing.updatedAt=now;
    selectedId=existing.id;
  } else {
    if (items.length>=FAVORITES_LIMIT) {
      announce('お気に入りは最大'+FAVORITES_LIMIT+'件です');
      return;
    }
    selectedId=globalThis.crypto&&globalThis.crypto.randomUUID?globalThis.crypto.randomUUID():String(Date.now());
    items.push({id:selectedId,name,state:captureState(),createdAt:now,updatedAt:now});
  }
  if (writeFavorites(items)) {
    renderFavorites(selectedId);
    announce('「'+name+'」をお気に入りに保存しました');
  }
}
function deleteFavorite() {
  const id=$('favoriteSelect').value;
  if (!id) return;
  const items=readFavorites();
  const target=items.find(item=>item.id===id);
  if (!target) {
    renderFavorites();
    return;
  }
  if (!window.confirm('「'+target.name+'」を削除しますか？')) return;
  if (writeFavorites(items.filter(item=>item.id!==id))) {
    renderFavorites();
    announce('お気に入りを削除しました');
  }
}
async function printDocument() {
  announce('印刷画面を開きます');
  if (document.fonts&&document.fonts.ready) await document.fonts.ready;
  window.print();
}
async function downloadPdf() {
  if (!window.StaffPaperPdf||typeof window.StaffPaperPdf.download!=='function') {
    announce('PDF出力の準備ができていません');
    return;
  }
  try {
    draw();
    const page=currentPage();
    const metaHeight=(els.showTitle.checked||els.showDate.checked)?17:3;
    await window.StaffPaperPdf.download({
      svg:$('staffSvg'),pageW:page.w,pageH:page.h,margin:Number(els.margin.value),
      metaHeight,showTitle:els.showTitle.checked,showDate:els.showDate.checked,
      filename:'gakufu-kobo-'+page.size.label.toLowerCase()+'.pdf'
    });
    announce('PDFを保存しました');
  } catch (error) {
    console.error(error);
    announce('PDFを作成できませんでした');
  }
}
function load() {
  renderFavorites();
  const storedSettings=safeRead(SETTINGS_KEY,value=>isRecord(value)&&STATE_SOURCE_KEYS.some(key=>Object.prototype.hasOwnProperty.call(value,key)));
  futureStorageKeys.delete(SETTINGS_KEY);
  if (hasFutureSchema(storedSettings)) {
    futureStorageKeys.add(SETTINGS_KEY);
    announceStorageBlock(SETTINGS_KEY,'future');
  }
  applyState(storedSettings||defaults,{resetZoom:true});
}

Object.values(els).forEach(element=>element.addEventListener('input',()=>{
  markCustomSettings();
  draw();
}));
document.querySelectorAll('[data-clef]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  clef=button.dataset.clef;
  syncConditionalUI();
  draw();
}));
document.querySelectorAll('[data-score]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  commitActiveControls(scoreType);
  scoreType=button.dataset.score;
  hydrateActiveControls(scoreType);
  syncConditionalUI();
  draw();
}));
document.querySelectorAll('[data-strings]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  const strings=Number(button.dataset.strings);
  if (scoreType==='tab'&&[4,5,6,7].includes(strings)) tabStrings=strings;
  if (scoreType==='staffTab'&&[4,5,6,7].includes(strings)) staffTabStrings=strings;
  if (scoreType==='chordGrid'&&[4,5,6,7].includes(strings)) chordGridStrings=strings;
  if (scoreType==='fretboard'&&[4,5,6,7].includes(strings)) fretboardStrings=strings;
  syncConditionalUI();
  draw();
}));
document.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  const layout=button.dataset.layout;
  if (!Object.prototype.hasOwnProperty.call(CHORD_GRID_LAYOUTS,layout)) return;
  chordGridLayout=layout;
  selectButtons('layout',layout);
  draw();
  announce(CHORD_GRID_LAYOUTS[layout].label+'、'+(CHORD_GRID_LAYOUTS[layout].columns*CHORD_GRID_LAYOUTS[layout].rows)+'枠を選択しました');
}));
document.querySelectorAll('[data-diagram]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  chordGridOrientation=normalizeChordGridOrientation(button.dataset.diagram,defaults.chordGridOrientation);
  syncConditionalUI();
  draw();
  announce('ダイアグラムを'+(chordGridOrientation==='horizontal'?'横型、弦が横':'縦型、弦が縦')+'にしました');
}));
document.querySelectorAll('[data-frets]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  chordGridFrets=normalizeChordGridFrets(button.dataset.frets,defaults.chordGridFrets);
  syncConditionalUI();
  draw();
  announce('ダイアグラムを'+chordGridFrets+'フレットにしました');
}));
document.querySelectorAll('[data-chart]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  chordChartColumns=normalizeChordChartColumns(button.dataset.chart,'1');
  syncConditionalUI();
  draw();
  announce('コード譜を横'+chordChartColumns+'列にしました');
}));
document.querySelectorAll('[data-keyboard]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  const layout=button.dataset.keyboard;
  if (!['full','memo'].includes(layout)) return;
  keyboardLayout=layout;
  selectButtons('keyboard',layout);
  draw();
}));
document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  groupSize=clampInt(button.dataset.group,1,3,1);
  syncConditionalUI();
  draw();
}));
document.querySelectorAll('[data-bars]').forEach(button=>button.addEventListener('click',()=>{
  markCustomSettings();
  const division=String(clampInt(button.dataset.bars,0,8,0));
  if (scoreType==='chordChart') chordChartDivisions=division;
  else barDivision=division;
  selectButtons('bars',activeDivision());
  draw();
}));
$('presetSelect').addEventListener('change',event=>{
  const key=event.target.value;
  if (!key||!PRESETS[key]) return;
  const label=event.target.selectedOptions[0].textContent;
  clearFavoriteSelection();
  applyState(PRESETS[key],{message:label+'を適用しました'});
});
$('favoriteSelect').addEventListener('change',event=>{
  const id=event.target.value;
  $('deleteFavorite').disabled=!id;
  if (!id) return;
  clearPresetSelection();
  const item=readFavorites().find(favorite=>favorite.id===id);
  if (item) applyState(item.state,{message:'「'+item.name+'」を呼び出しました'});
});
$('saveFavorite').addEventListener('click',saveFavorite);
$('deleteFavorite').addEventListener('click',deleteFavorite);
$('zoomOut').addEventListener('click',()=>{setZoom(zoom-.1);announce('プレビュー倍率を'+Math.round(zoom*100)+'%にしました');});
$('zoomIn').addEventListener('click',()=>{setZoom(zoom+.1);announce('プレビュー倍率を'+Math.round(zoom*100)+'%にしました');});
$('fitPage').addEventListener('click',()=>{fitZoom('page');announce('用紙全体を表示しました。倍率'+Math.round(zoom*100)+'%');});
$('fitWidth').addEventListener('click',()=>{fitZoom('width');announce('用紙を表示幅に合わせました。倍率'+Math.round(zoom*100)+'%');});
$('actualSize').addEventListener('click',()=>{setZoom(1);announce('プレビュー倍率を100%にしました');});
$('printBtn').addEventListener('click',printDocument);
$('pdfBtn').addEventListener('click',downloadPdf);
$('resetBtn').addEventListener('click',()=>{
  if (!window.confirm('現在の設定を初期設定に戻しますか？ お気に入りは削除されません。')) return;
  let removed=false;
  try {
    localStorage.removeItem(SETTINGS_KEY);
    removed=true;
  } catch {}
  if (removed) clearStorageBlock(SETTINGS_KEY);
  clearPresetSelection();
  clearFavoriteSelection();
  applyState(defaults,{
    resetZoom:true,
    message:removed?'初期設定に戻しました':'画面だけ初期設定に戻しました。保存データは削除できませんでした'
  });
});
window.addEventListener('beforeprint',()=>{
  const page=currentPage();
  document.getElementById('printPage')?.remove();
  const style=document.createElement('style');
  style.id='printPage';
  style.textContent='@page{size:'+page.w+'mm '+page.h+'mm;margin:0}';
  document.head.append(style);
});
window.addEventListener('afterprint',()=>{
  document.getElementById('printPage')?.remove();
});
enableSegmentedKeyboardNavigation();
load();
window.MusicPaperBoot?.ready();
