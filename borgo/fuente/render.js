const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
  const b=await chromium.launch({args:['--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  if(fs.existsSync(process.env.TL||'timeline.json')){const tl=JSON.parse(fs.readFileSync(process.env.TL||'timeline.json'));await p.addInitScript(tl=>{window.SC_OVERRIDE=tl.SC;window.TOTAL_OVERRIDE=tl.TOTAL;window.K0=tl.K0;window.K4=tl.K4;},tl);}
  p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction('window.ready===true');
  const OUT=process.env.OUT||'frames';fs.mkdirSync(OUT,{recursive:true});
  const total=await p.evaluate('TOTAL');
  for(const f of (only||[...Array(total).keys()])){
    const d=await p.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/png');},f);
    fs.writeFileSync(`${OUT}/f${String(f).padStart(4,'0')}.png`,Buffer.from(d.split(',')[1],'base64'));
  }
  await b.close();
})();
