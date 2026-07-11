/**
 * Prompt Templates for Gram Seva AI.
 * Centralised prompt management — all system prompts and templates live here.
 * Keep prompts version-controlled for reproducibility.
 */

/**
 * Core system prompt for the Gram Seva AI assistant.
 * This persona is injected as the system message on every Claude/Gemini call.
 */
const SYSTEM_PROMPT = `You are Gram Seva AI, an intelligent assistant for rural governance in India.
Your role is to help citizens:
- Discover government schemes they may be eligible for
- Check their eligibility for specific schemes
- Apply for schemes by collecting their information
- Track the status of their applications
- Upload and manage documents
- Raise complaints and grievances

Guidelines:
- Always respond in simple, clear language that rural citizens can understand.
- If the user writes in Hindi or a regional Indian language, respond in the same language.
- Be empathetic, patient, and helpful.
- Never ask for passwords, OTPs, or sensitive financial information beyond what is needed.
- When uncertain, ask for clarification rather than making assumptions.
- Always recommend the citizen visit their local Panchayat office for complex issues.
- You have access to tools to look up schemes, check eligibility, and track applications.
  Use these tools instead of guessing from training data.`;

/**
 * Prompt template for eligibility checking.
 * @param {object} citizen - Citizen profile
 * @param {object} scheme - Scheme details
 * @param {object[]} rules - Eligibility rules
 * @param {object} result - Engine result { eligible, failedRules }
 */
const buildEligibilityExplanationPrompt = (citizen, scheme, rules, result) => {
  return `A citizen has requested eligibility check for a government scheme.

Citizen Profile:
- Name: ${citizen.fullName}
- Age: ${citizen.age}
- Gender: ${citizen.gender}
- Annual Income: ₹${citizen.annualIncome}
- Occupation: ${citizen.occupation}
- Caste: ${citizen.caste || 'Not specified'}

Scheme: ${scheme.schemeName}
Department: ${scheme.department}
Benefit: ${scheme.benefit}

Eligibility Rules:
${rules.map((r, i) => `${i + 1}. ${formatRule(r)}`).join('\n')}

Engine Result: ${result.eligible ? 'ELIGIBLE ✅' : 'NOT ELIGIBLE ❌'}
${result.failedRules?.length > 0 ? `\nFailed Criteria:\n${result.failedRules.map((f) => `- ${f}`).join('\n')}` : ''}

Please provide a clear, empathetic explanation of this result in 2-3 sentences. 
If eligible, congratulate and explain next steps. 
If not eligible, explain why gently and suggest alternative schemes if possible.`;
};

/**
 * Prompt for scheme discovery from a natural language query.
 */
const buildSchemeDiscoveryPrompt = (citizenProfile, query) => {
  return `A citizen is looking for government schemes with the following profile and query:

Citizen Profile:
- Age: ${citizenProfile.age}
- Gender: ${citizenProfile.gender}
- Annual Income: ₹${citizenProfile.annualIncome}
- Occupation: ${citizenProfile.occupation}
- Caste: ${citizenProfile.caste || 'Not specified'}

Citizen Query: "${query}"

Based on this profile, help identify relevant government schemes and explain how to apply.
Be specific and practical.`;
};

/**
 * Prompt for complaint summary generation.
 */
const buildComplaintPrompt = (citizenName, complaintDetails) => {
  return `A citizen named ${citizenName} has raised the following complaint:

"${complaintDetails}"

Please:
1. Acknowledge the complaint empathetically.
2. Summarise the key issue in one sentence.
3. List 2-3 actionable steps the citizen can take.
4. Mention the relevant authority they should contact.`;
};

/**
 * Prompt for WhatsApp-style conversational responses (short and simple).
 */
const buildWhatsAppPrompt = (userMessage, context = '') => {
  return `${context ? `Context: ${context}\n\n` : ''}User WhatsApp message: "${userMessage}"

Respond in under 150 words in a conversational style suitable for WhatsApp.
Use simple language. If the user seems to need more help, ask one clarifying question.`;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRule = (rule) => {
  const parts = [];
  if (rule.minAge) parts.push(`Min Age: ${rule.minAge}`);
  if (rule.maxAge) parts.push(`Max Age: ${rule.maxAge}`);
  if (rule.maxIncome) parts.push(`Max Annual Income: ₹${rule.maxIncome}`);
  if (rule.occupation) parts.push(`Occupation: ${rule.occupation}`);
  if (rule.caste) parts.push(`Caste: ${rule.caste}`);
  if (rule.gender) parts.push(`Gender: ${rule.gender}`);
  return parts.length > 0 ? parts.join(', ') : 'No specific restrictions';
};

module.exports = {
  SYSTEM_PROMPT,
  buildEligibilityExplanationPrompt,
  buildSchemeDiscoveryPrompt,
  buildComplaintPrompt,
  buildWhatsAppPrompt,
};
