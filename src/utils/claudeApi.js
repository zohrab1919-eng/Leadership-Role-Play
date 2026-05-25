const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

export async function sendMessage(systemPrompt, conversationHistory, userMessage, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `API error ${response.status}`);
  }
  return data.choices[0].message.content;
}

export async function requestDebrief(debriefPrompt, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: 'You are a skilled leadership development coach. Return only valid JSON when asked.' },
        { role: 'user', content: debriefPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `API error ${response.status}`);
  }
  return data.choices[0].message.content;
}

export async function sendPreviewRequest(prompt, apiKey) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `API error ${response.status}`);
  }
  return data.choices[0].message.content;
}
