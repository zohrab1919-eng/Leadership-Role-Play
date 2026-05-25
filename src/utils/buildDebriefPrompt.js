export function buildDebriefPrompt(config, conversationHistory, participantName) {
  const name = participantName || 'Manager';
  const transcript = conversationHistory
    .map(msg =>
      `${msg.role === 'user' ? name : config.personaName}: ${msg.content}`
    )
    .join('\n\n');

  return `The following conversation was a role-play practice. ${name} was playing the role of manager, and the AI played ${config.personaName} (${config.personaRole}).

CONVERSATION TRANSCRIPT:
${transcript}

---

Framework ${name} was supposed to apply: ${config.framework}
Framework steps: ${config.frameworkSteps || 'Not specified'}
Desired end-in-mind: ${config.endInMind}

Evaluate ${name}'s performance. Return ONLY valid JSON with exactly this structure, no other text:

{
  "ratings": {
    "frameworkApplication": { "score": <integer 1-5>, "rationale": "<one concise sentence>" },
    "conversationTechnique": { "score": <integer 1-5>, "rationale": "<one concise sentence>" },
    "achievementOfEndInMind": { "score": <integer 1-5>, "rationale": "<one concise sentence>" }
  },
  "whatWentWell": ["<specific observation referencing the conversation>", "<specific observation>", "<specific observation>"],
  "whatToImprove": ["<actionable suggestion>", "<actionable suggestion>", "<actionable suggestion>"],
  "highlightQuote": { "quote": "<direct quote from ${name}>", "explanation": "<why effective or missed opportunity>" }
}

Scoring:
- Framework Application: Did they follow the framework steps in sequence and with intent?
- Conversation Technique: Tone, questioning style, empathy, clarity, non-blaming language
- Achievement of End-in-Mind: Did the conversation reach or move meaningfully toward the desired outcome?

Be encouraging but honest. Write as a skilled leadership coach giving developmental feedback. Reference actual moments from the transcript.`;
}
