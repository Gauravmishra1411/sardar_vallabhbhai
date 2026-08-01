import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { category, subCategory, description, priority } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    const fallbackReason = `${priority} priority assigned due to immediate impact on ${category || 'hostel'} facilities (${subCategory || 'maintenance'}).`;

    if (!apiKey) {
      return NextResponse.json({ text: fallbackReason });
    }

    const prompt = `
You are an AI assistant helping a hostel warden assign maintenance staff to a grievance. 
The grievance has been marked as "${priority}" priority.
Grievance Details:
- Category: ${category}
- Sub-Category: ${subCategory}
- Description: ${description}

Provide a short, professional, one-sentence reason why this issue is "${priority}" priority. 
For example, if it's High Priority, explain what the immediate risk or impact is.
Only output the reason sentence, nothing else.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return NextResponse.json({ text: text.trim() });
      }
    }

    return NextResponse.json({ text: fallbackReason });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({
      text: 'Priority assigned based on maintenance category requirements.',
    });
  }
}
