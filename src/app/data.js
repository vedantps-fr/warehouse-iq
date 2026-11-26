/* ---------- Log and share section ---------- */
function renderData(){$('shareCode').value=opsToCode(ops.slice(0,cur));$('log').textContent=logLines.slice(-400).join('\n')||'No operations yet.';$('log').scrollTop=1e9}
onChange(renderData);
const copyTxt=(txt,el,msg)=>{const fail=()=>{$(el).textContent='Copy was blocked here. Select the text and copy it yourself.'};try{navigator.clipboard.writeText(txt).then(()=>$(el).textContent=msg,fail)}catch(e){fail()}};
$('copyLog').onclick=()=>copyTxt(logLines.join('\n'),'copyOut','Log copied.');$('copyJson').onclick=()=>copyTxt(JSON.stringify(ix.intervals()),'copyOut','Ranges copied as JSON.');
$('copyShare').onclick=()=>copyTxt($('shareCode').value,'importErr','Share code copied.');
$('importBtn').onclick=()=>{try{const list=codeToOps($('importCode').value);if(list.length>60000)throw new Error('That code is too long');
  ops=list;cur=list.length;opTimes=[];logLines=list.map((o,i)=>String(i+1).padStart(3,' ')+'  '+opText(o));query=null;rebuild();
  $('importErr').textContent='Loaded '+list.length+' operations. Open the Warehouse to see it.';say('<b>Imported.</b> '+list.length+' operations replayed.')}catch(e){$('importErr').textContent=e.message}};
$('importCode').addEventListener('input',()=>$('importErr').textContent='');
