import { GoogleGenAI } from '@google/genai';
export async function POST(req){
  try{
    const { transcript, duration='10 minutes', tone='Cinematic' }=await req.json();
    if(!transcript?.trim()) return Response.json({error:'Transcript is required'},{status:400});
    if(!process.env.GEMINI_API_KEY) return Response.json({error:'Add GEMINI_API_KEY in Vercel Environment Variables.'},{status:500});
    const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const prompt=`You are ReelTeller MM, a professional Myanmar-language movie recap writer. Transform the supplied transcript into an original, concise ${duration} recap in natural spoken Burmese. Tone: ${tone}. Do not copy dialogue verbatim. Preserve plot accuracy, avoid invented facts, and structure it for voice-over with a strong hook, clear story progression, and ending.\n\nTRANSCRIPT:\n${transcript}`;
    const r=await ai.models.generateContent({model:'gemini-2.5-flash',contents:prompt});
    return Response.json({script:r.text});
  }catch(e){return Response.json({error:e.message||'Generation failed'},{status:500})}
}
