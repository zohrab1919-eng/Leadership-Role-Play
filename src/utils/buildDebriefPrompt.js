export function buildDebriefPrompt(config, conversationHistory, participantName) {
  const name = participantName || 'Manager';

  // Support both new format (name) and old format (personaName)
  const personaDisplayName = config.name || config.personaName || 'Employee';

  const transcript = conversationHistory
    .map(msg =>
      `${msg.role === 'user' ? name : personaDisplayName}: ${msg.content}`
    )
    .join('\n\n');

  // endInMind can be at session/config level (new) or persona level (old)
  const endInMind = config.endInMind || '';

  return `The following conversation was a role-play practice. ${name} was playing the role of manager, and the AI played ${personaDisplayName} (${config.role || config.personaRole || ''}).

CONVERSATION TRANSCRIPT:
${transcript}

---

Framework ${name} was supposed to apply: ${config.framework || ''}
Framework steps: ${config.frameworkSteps || 'Not specified'}
Desired end-in-mind: ${endInMind}

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

Be encouraging but honest. Write as a skilled leadership coach giving developmental feedback. Reference actual moments from the transcript.

Language: The manager may have communicated in English, Bahasa Malaysia, Bahasa Indonesia, or a natural mix of these (e.g. Manglish, mixed BM/English, mixed BI/English). Do not penalise any of these — evaluate the intent, technique, and impact of their communication, not grammatical perfection or language choice. All of these are valid and normal in Malaysian and Indonesian workplace contexts.

IMPORTANT: Regardless of the language used in the conversation, write your entire debrief response — all rationale, observations, suggestions, and the highlight quote explanation — in English only.`;
}
