const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
  const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
  const b=await chromium.launch({args:['--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.resolve('index.html'));await p.waitForFunction('window.ready===true');
  fs.mkdirSync('frames',{recursive:true});
  const total=await p.evaluate('TOTAL');
  for(const f of (only||[...Array(total).keys()])){
    const d=await p.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/png');},f);
    fs.writeFileSync(`frames/f${String(f).padStart(4,'0')}.png`,Buffer.from(d.split(',')[1],'base64'));
  }
  await b.close();
})();
