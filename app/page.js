'use client';
import {useEffect,useMemo,useRef,useState} from 'react';

const fmt=s=>{s=Math.max(0,Number(s)||0);const m=Math.floor(s/60),x=Math.floor(s%60);return `${m}:${String(x).padStart(2,'0')}`};
export default function Home(){
 const [file,setFile]=useState(null),[transcript,setTranscript]=useState(''),[script,setScript]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('Ready');
 const [duration,setDuration]=useState(0),[start,setStart]=useState(0),[end,setEnd]=useState(0),[speed,setSpeed]=useState(1),[volume,setVolume]=useState(1),[ratio,setRatio]=useState('16:9');
 const [title,setTitle]=useState(''),[showSubs,setShowSubs]=useState(true),[narration,setNarration]=useState(null),[exporting,setExporting]=useState(false),[progress,setProgress]=useState(0);
 const videoRef=useRef(null),canvasRef=useRef(null),rafRef=useRef(null);
 const url=useMemo(()=>file?URL.createObjectURL(file):'', [file]);
 const narrationUrl=useMemo(()=>narration?URL.createObjectURL(narration):'', [narration]);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);if(narrationUrl)URL.revokeObjectURL(narrationUrl)},[url,narrationUrl]);
 async function generate(){setBusy(true);setMsg('Generating Myanmar recap…');try{const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Generation failed');setScript(d.script||'');setMsg('Recap generated');}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 function downloadText(ext,content,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=`reelteller-mm.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 function speak(){if(!script)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(script);u.lang='my-MM';speechSynthesis.speak(u);setMsg('Browser voice preview started')}
 function metadata(e){const d=e.currentTarget.duration||0;setDuration(d);setStart(0);setEnd(d);e.currentTarget.playbackRate=speed;e.currentTarget.volume=volume}
 function seek(v){if(videoRef.current)videoRef.current.currentTime=Number(v)}
 function applyPreview(){const v=videoRef.current;if(!v)return;v.playbackRate=speed;v.volume=volume;if(v.currentTime<start||v.currentTime>end)v.currentTime=start;v.play();setMsg(`Previewing ${fmt(start)}–${fmt(end)}`)}
 function stopPreview(){videoRef.current?.pause();speechSynthesis.cancel()}
 function drawFrame(ctx,w,h,v){
   ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
   const vr=v.videoWidth/v.videoHeight,cr=w/h;let dw,dh,dx,dy;if(vr>cr){dw=w;dh=w/vr;dx=0;dy=(h-dh)/2}else{dh=h;dw=h*vr;dy=0;dx=(w-dw)/2}ctx.drawImage(v,dx,dy,dw,dh);
   if(title){ctx.font=`700 ${Math.max(28,w/28)}px Arial`;ctx.textAlign='center';ctx.fillStyle='white';ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=8;ctx.strokeText(title,w/2,h*.12,w*.86);ctx.fillText(title,w/2,h*.12,w*.86)}
   if(showSubs&&script){const clean=script.replace(/\s+/g,' ').trim();const words=clean.split(' ');const clip=Math.max(.1,end-start);const p=Math.min(1,Math.max(0,(v.currentTime-start)/clip));const idx=Math.floor(p*words.length);const text=words.slice(Math.max(0,idx-7),Math.min(words.length,idx+8)).join(' ');ctx.font=`600 ${Math.max(24,w/34)}px Arial,"Noto Sans Myanmar"`;ctx.textAlign='center';const max=w*.82;const lines=[];let line='';for(const word of text.split(' ')){const test=(line+' '+word).trim();if(ctx.measureText(test).width>max&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);const shown=lines.slice(-2);const lh=Math.max(34,w/28);const y=h*.84;ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(w*.07,y-lh*1.15,w*.86,lh*(shown.length+0.6));ctx.strokeStyle='rgba(0,0,0,.9)';ctx.lineWidth=6;ctx.fillStyle='white';shown.forEach((ln,i)=>{ctx.strokeText(ln,w/2,y+i*lh,max);ctx.fillText(ln,w/2,y+i*lh,max)})}
 }
 async function exportVideo(){
   const v=videoRef.current,c=canvasRef.current;if(!v||!file)return; if(!window.MediaRecorder){setMsg('This browser cannot export video. Use Chrome or Edge.');return}
   setExporting(true);setProgress(0);setMsg('Preparing export…');
   try{
    const dims=ratio==='9:16'?[720,1280]:ratio==='1:1'?[900,900]:[1280,720];c.width=dims[0];c.height=dims[1];const ctx=c.getContext('2d');
    const canvasStream=c.captureStream(30);let finalStream=canvasStream;
    let audioCtx=null,narrAudio=null;
    try{audioCtx=new AudioContext();const dest=audioCtx.createMediaStreamDestination();if(volume>0){const src=audioCtx.createMediaElementSource(v);const gain=audioCtx.createGain();gain.gain.value=volume;src.connect(gain);gain.connect(dest);gain.connect(audioCtx.destination)}if(narrationUrl){narrAudio=new Audio(narrationUrl);narrAudio.crossOrigin='anonymous';const ns=audioCtx.createMediaElementSource(narrAudio);const ng=audioCtx.createGain();ng.gain.value=1;ns.connect(ng);ng.connect(dest);ng.connect(audioCtx.destination)}finalStream=new MediaStream([...canvasStream.getVideoTracks(),...dest.stream.getAudioTracks()]);await audioCtx.resume()}catch(_){setMsg('Audio mixing unavailable; exporting video track only…')}
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';const rec=new MediaRecorder(finalStream,{mimeType:mime,videoBitsPerSecond:6000000});const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    const done=new Promise(resolve=>rec.onstop=resolve);v.pause();v.currentTime=start;v.playbackRate=speed;await new Promise(r=>{const f=()=>Math.abs(v.currentTime-start)<.15?r():setTimeout(f,50);f()});rec.start(1000);await v.play();if(narrAudio){narrAudio.currentTime=0;await narrAudio.play().catch(()=>{})}
    await new Promise(resolve=>{const tick=()=>{drawFrame(ctx,c.width,c.height,v);const p=(v.currentTime-start)/Math.max(.1,end-start);setProgress(Math.round(Math.min(1,p)*100));if(v.currentTime>=end||v.ended){v.pause();narrAudio?.pause();resolve();return}rafRef.current=requestAnimationFrame(tick)};tick()});rec.stop();await done;rafRef.current&&cancelAnimationFrame(rafRef.current);const blob=new Blob(chunks,{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='reelteller-mm-edited.webm';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);setMsg('Edited video exported');setProgress(100);audioCtx?.close();
   }catch(e){setMsg(`Export error: ${e.message}`)}finally{setExporting(false)}
 }
 return <main>
  <header><div className="brand"><div className="mark">R</div><div><b>ReelTeller MM</b><span>AI STUDIO · V2</span></div></div><div className="status">● {msg}</div></header>
  <section className="hero"><p className="eyebrow">MYANMAR-FIRST CREATOR WORKFLOW</p><h1>Write. Edit. Export.<br/><em>One studio.</em></h1><p>Generate your Myanmar recap, trim footage, format it for YouTube or Shorts, add overlays and narration, then export an edited video directly in your browser.</p></section>
  <section className="grid">
   <div className="panel"><div className="step">01 · SOURCE</div><h2>Video</h2><label className="drop"><input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)}/><strong>{file?file.name:'Drop or choose a video'}</strong><small>MP4 · MOV · WEBM</small></label>{url&&<video ref={videoRef} src={url} controls onLoadedMetadata={metadata} onTimeUpdate={e=>{if(end&&e.currentTarget.currentTime>end)e.currentTarget.pause()}}/>}</div>
   <div className="panel"><div className="step">02 · TRANSCRIPT</div><h2>Story source</h2><textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste the transcript or scene notes…"/><div className="count">{transcript.length.toLocaleString()} characters</div></div>
   <div className="panel wide"><div className="step">03 · AI WRITER</div><h2>Myanmar recap script</h2><div className="actions"><button className="primary" disabled={busy||!transcript.trim()} onClick={generate}>{busy?'Generating…':'Generate Myanmar Recap'}</button><button onClick={speak} disabled={!script}>▶ Voice preview</button><button onClick={()=>downloadText('txt',script)} disabled={!script}>↓ TXT</button></div><textarea className="output" value={script} onChange={e=>setScript(e.target.value)} placeholder="Your generated Myanmar narration appears here…"/></div>
   <div className="panel wide editor"><div className="step">04 · VIDEO EDITOR</div><h2>Cut & format</h2>
    <div className="editorGrid"><div><label>Trim start <b>{fmt(start)}</b></label><input type="range" min="0" max={duration||1} step="0.1" value={start} onChange={e=>{const x=Math.min(Number(e.target.value),end-.1);setStart(x);seek(x)}}/><label>Trim end <b>{fmt(end)}</b></label><input type="range" min="0" max={duration||1} step="0.1" value={end} onChange={e=>setEnd(Math.max(Number(e.target.value),start+.1))}/></div>
     <div className="controlCard"><label>Aspect ratio</label><select value={ratio} onChange={e=>setRatio(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select><label>Speed</label><select value={speed} onChange={e=>{const x=Number(e.target.value);setSpeed(x);if(videoRef.current)videoRef.current.playbackRate=x}}><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select><label>Original audio {Math.round(volume*100)}%</label><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>{const x=Number(e.target.value);setVolume(x);if(videoRef.current)videoRef.current.volume=x}}/></div>
     <div className="controlCard"><label>Title overlay</label><input className="textInput" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. ဇာတ်ကားအကျဉ်း"/><label className="check"><input type="checkbox" checked={showSubs} onChange={e=>setShowSubs(e.target.checked)}/> Show script subtitles</label><label>Narration audio (optional)</label><input className="fileInput" type="file" accept="audio/*" onChange={e=>setNarration(e.target.files?.[0]||null)}/>{narration&&<small>{narration.name}</small>}</div></div>
    <div className="actions editActions"><button onClick={applyPreview} disabled={!file}>▶ Preview cut</button><button onClick={stopPreview} disabled={!file}>■ Stop</button><button className="primary" onClick={exportVideo} disabled={!file||exporting}>{exporting?`Exporting ${progress}%`:'↓ Export edited video'}</button></div>{exporting&&<div className="progress"><i style={{width:`${progress}%`}}/></div>}<p className="hint">Export format: WebM (Chrome/Edge). Your source video stays on your device; rendering happens in the browser. Use footage you own or have permission to edit.</p><canvas ref={canvasRef} className="hiddenCanvas"/>
   </div>
  </section>
  <section className="pipeline"><span>UPLOAD</span><i>→</i><span>AI SCRIPT</span><i>→</i><span>TRIM</span><i>→</i><span>OVERLAYS</span><i>→</i><span>NARRATION</span><i>→</i><span>EXPORT</span></section>
  <footer><b>ReelTeller MM AI Studio V2</b><span>For original, licensed, or public-domain footage.</span></footer>
 </main>
}
