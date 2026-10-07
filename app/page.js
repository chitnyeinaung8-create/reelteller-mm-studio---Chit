'use client';
import {useMemo,useState} from 'react';
export default function Home(){
 const [file,setFile]=useState(null),[transcript,setTranscript]=useState(''),[script,setScript]=useState(''),[busy,setBusy]=useState(false),[msg,setMsg]=useState('Ready');
 const url=useMemo(()=>file?URL.createObjectURL(file):'', [file]);
 async function generate(){setBusy(true);setMsg('Generating Myanmar recap…');try{const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript})});const d=await r.json();if(!r.ok)throw new Error(d.error);setScript(d.script);setMsg('Recap generated');}catch(e){setMsg(e.message)}finally{setBusy(false)}}
 function downloadText(ext,content,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=`reelteller-mm.${ext}`;a.click()}
 function speak(){if(!script)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(script);u.lang='my-MM';speechSynthesis.speak(u);setMsg('Browser voice preview started');}
 return <main>
  <header><div className="brand"><div className="mark">R</div><div><b>ReelTeller MM</b><span>AI STUDIO</span></div></div><div className="status">● {msg}</div></header>
  <section className="hero"><p className="eyebrow">MYANMAR-FIRST CREATOR WORKFLOW</p><h1>Turn footage into a<br/><em>Myanmar recap.</em></h1><p>Upload your own or licensed video, prepare a transcript, generate an original Burmese narration, preview voice, and export your production assets.</p></section>
  <section className="grid">
   <div className="panel"><div className="step">01 · SOURCE</div><h2>Video</h2><label className="drop"><input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)}/><strong>{file?file.name:'Drop or choose a video'}</strong><small>MP4 · MOV · WEBM</small></label>{url&&<video src={url} controls/>}<p className="hint">For V1, video stays in your browser. Paste a transcript below; automatic long-video transcription can be added with a speech-to-text provider.</p></div>
   <div className="panel"><div className="step">02 · TRANSCRIPT</div><h2>Story source</h2><textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste the transcript or your scene notes here…"/><div className="count">{transcript.length.toLocaleString()} characters</div></div>
   <div className="panel wide"><div className="step">03 · AI WRITER</div><h2>Myanmar recap script</h2><div className="actions"><button className="primary" disabled={busy||!transcript.trim()} onClick={generate}>{busy?'Generating…':'Generate Myanmar Recap'}</button><button onClick={speak} disabled={!script}>▶ Voice preview</button><button onClick={()=>downloadText('txt',script)} disabled={!script}>↓ TXT</button></div><textarea className="output" value={script} onChange={e=>setScript(e.target.value)} placeholder="Your generated Myanmar narration appears here…"/></div>
  </section>
  <section className="pipeline"><span>UPLOAD</span><i>→</i><span>TRANSCRIPT</span><i>→</i><span>MYANMAR SCRIPT</span><i>→</i><span>VOICE PREVIEW</span><i>→</i><span>EDIT / EXPORT</span></section>
  <footer><b>ReelTeller MM AI Studio</b><span>Built for original, licensed, or public-domain footage.</span></footer>
 </main>
}
