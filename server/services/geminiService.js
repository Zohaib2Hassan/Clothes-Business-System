import { GoogleGenAI } from '@google/genai';

// ────────────────────────────────────────────────────────
// Gemini Service – clean, reusable layer for AI generation
// ────────────────────────────────────────────────────────

let aiClient = null;

/**
 * Lazily initialise the Gemini client.
 * Throws a descriptive error if the API key is missing.
 */
function getClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set in environment variables. ' +
        'Please add it to your .env file.'
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ── System instructions ─────────────────────────────────

const BUSINESS_ASSISTANT_SYSTEM = `You are an AI Business Assistant for a clothing business management system called "Threadly".

CORE RULES:
- You help clothing business owners understand their sales, inventory, customers, and expenses.
- When business data is provided in the context, use ONLY that data for numbers and facts. NEVER invent or fabricate business figures.
- When data is insufficient, clearly say so: "Based on the available data..." or "There isn't enough data to determine..."
- Clearly distinguish between actual data, calculated estimates, and general recommendations.
- Use PKR (Pakistani Rupees) as the currency.
- Give actionable, practical recommendations suitable for a clothing business owner.
- Keep responses concise, well-structured, and professional.
- Use bullet points, headings, and short paragraphs for readability.
- Understand clothing categories (Shalwar Kameez, Kurta, Shirts, Trousers, etc.) and seasonal trends.
- Consider sales, inventory, customers, and expenses together when giving holistic advice.
- When the user asks to suggest, find, or recommend products within a budget or price range (e.g., 'suggest me product under 5000', 'tell me product under 10000'):
  Check the Available In-Stock Products Catalog in the business data context. Suggest matching products by their exact names, categories, exact price in PKR, and available stock. Present them in clean bullet points with brief reasoning. If no items match the exact price, mention the closest in-stock items.

RESPONSE FORMAT:
- Use **bold** for important numbers and terms.
- Use bullet points (•) for lists.
- Use clear section headings.
- Keep responses focused — avoid unnecessary filler text.
- End with 1-3 actionable recommendations when relevant.

IMPORTANT: You are NOT the source of truth for business numbers. The database provides the real data.
You are responsible for interpreting, explaining, and recommending based on that data.`;

/**
 * Generate a single text response from Gemini.
 *
 * @param {string} userPrompt    – The user's question / request
 * @param {string} businessContext – Structured business data context (optional)
 * @param {Array}  chatHistory   – Previous messages [{role, content}] (optional, limited)
 * @returns {Promise<string>}    – Gemini's text response
 */
export async function generateResponse(userPrompt, businessContext = '', chatHistory = []) {
  const ai = getClient();

  // Build the full prompt with context
  let fullPrompt = '';

  if (businessContext) {
    fullPrompt += `=== BUSINESS DATA CONTEXT ===\n${businessContext}\n=== END CONTEXT ===\n\n`;
  }

  // Include limited chat history for multi-turn conversation
  if (chatHistory.length > 0) {
    fullPrompt += '=== CONVERSATION HISTORY ===\n';
    // Only keep last 6 messages to control token usage
    const recentHistory = chatHistory.slice(-6);
    recentHistory.forEach((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      fullPrompt += `${role}: ${msg.content}\n`;
    });
    fullPrompt += '=== END HISTORY ===\n\n';
  }

  fullPrompt += `User's current question: ${userPrompt}`;

  try {
    return await callGemini({
      contents: fullPrompt,
      config: {
        systemInstruction: BUSINESS_ASSISTANT_SYSTEM,
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });
  } catch (error) {
    console.error('Gemini generateResponse Error:', error);
    throw error;
  }
}

/**
 * Generate a product description using Gemini.
 *
 * @param {Object} productInfo – Product details (name, category, material, color, price, etc.)
 * @returns {Promise<string>}  – Generated product description
 */
export async function generateProductDescription(productInfo) {
  const prompt = `Generate a professional product description for a clothing item with these details:

Product Name: ${productInfo.name || 'N/A'}
Category: ${productInfo.category || 'N/A'}
Material: ${productInfo.material || 'Not specified'}
Color: ${productInfo.color || 'Not specified'}
Size: ${productInfo.size || 'Various sizes available'}
Price: PKR ${productInfo.price || 'N/A'}
Features: ${productInfo.features || 'None specified'}
Target Customer: ${productInfo.targetCustomer || 'General'}

Please generate:
1. **Product Title** – An attractive, SEO-friendly title
2. **Short Description** – 1-2 sentences for quick view
3. **Detailed Description** – 3-4 paragraphs covering fabric, fit, occasions, and care
4. **Key Selling Points** – 4-5 bullet points
5. **SEO Keywords** – 8-10 relevant keywords

Keep the tone professional and suitable for a Pakistani clothing business.`;

  try {
    return await callGemini({
      contents: prompt,
      config: {
        systemInstruction: 'You are a professional copywriter specializing in clothing and fashion for the Pakistani market. Write compelling, accurate product descriptions. Use PKR as currency.',
        maxOutputTokens: 1500,
        temperature: 0.8,
      },
    });
  } catch (error) {
    console.error('Gemini Product Description Error:', error);
    throw new Error('Failed to generate product description. Please try again.');
  }
}

/**
 * Generate forecast explanation using Gemini.
 *
 * @param {Object} forecastData – Structured forecast results from the backend
 * @returns {Promise<string>}   – Natural language explanation
 */
export async function explainForecast(forecastData) {
  const prompt = `Analyze and explain the following business forecast data for a clothing business:

${JSON.stringify(forecastData, null, 2)}

Please provide:
1. **Summary** – What the forecast indicates overall
2. **Growth Areas** – What categories/products are expected to grow
3. **Risk Areas** – Categories or products that may decline or face stockouts
4. **Inventory Recommendations** – Which items to restock and how much
5. **Opportunities** – Potential business opportunities based on the trends

Keep it concise and actionable. Use PKR for any monetary values.
All numbers must come from the provided data — do not invent figures.`;

  try {
    return await callGemini({
      contents: prompt,
      config: {
        systemInstruction: BUSINESS_ASSISTANT_SYSTEM,
        maxOutputTokens: 1500,
        temperature: 0.6,
      },
    });
  } catch (error) {
    console.error('Gemini Forecast Explanation Error:', error);
    throw new Error('Failed to generate forecast explanation. Please try again.');
  }
}

/**
 * Generate AI insights from business data.
 *
 * @param {Object} businessData – Aggregated business metrics
 * @returns {Promise<string>}   – JSON string of structured insights
 */
export async function generateInsights(businessData) {
  const prompt = `Based on the following real business data from a clothing store, generate exactly 5-8 actionable business insights.

BUSINESS DATA:
${JSON.stringify(businessData, null, 2)}

For each insight, provide a JSON object with:
- "title": Short insight title
- "description": 2-3 sentence explanation
- "type": one of "opportunity", "risk", "info", "warning"  
- "severity": one of "high", "medium", "low"
- "action": One recommended action

Return ONLY a valid JSON array of insight objects. No extra text.
All insights must be based on the provided data. Do not fabricate numbers.
If data is insufficient for an insight, mention that clearly.`;

  try {
    return await callGemini({
      contents: prompt,
      config: {
        systemInstruction: 'You are a business analyst. Return ONLY valid JSON arrays. No markdown, no code blocks, no extra text.',
        maxOutputTokens: 2000,
        temperature: 0.5,
      },
    });
  } catch (error) {
    console.error('Gemini Insights Error:', error);
    throw new Error('Failed to generate business insights. Please try again.');
  }
}

/**
 * Generate structured or direct completion with custom prompt & system instruction.
 */
export async function generateStructuredResponse(prompt, systemInstruction = '', temperature = 0.4) {
  try {
    return await callGemini({
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an AI assistant for a retail clothing store POS.',
        maxOutputTokens: 1500,
        temperature,
      },
    });
  } catch (error) {
    console.error('Gemini generateStructuredResponse Error:', error);
    throw error;
  }
}

// ── Helpers ─────────────────────────────────────────────

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

/**
 * Get the configured model name. Defaults to gemini-3.5-flash.
 */
function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash';
}

/**
 * Robust caller with multi-model fallback in case of rate-limits or transient capacity spikes.
 */
async function callGemini(generateOptions) {
  const ai = getClient();
  const primaryModel = getModelName();
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...generateOptions,
        model,
      });

      const text =
        response.text ||
        response.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
        '';

      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (error) {
      lastError = error;
      const isFatal =
        error.message?.includes('403') ||
        error.message?.includes('PERMISSION_DENIED') ||
        error.message?.includes('API_KEY_INVALID');

      if (isFatal) {
        throw new Error('AI API key is invalid or has been revoked. Please check GEMINI_API_KEY in your .env file.');
      }
      console.warn(`Gemini model ${model} temporarily unavailable (${error.status || error.message?.slice(0, 60)}). Trying fallback...`);
    }
  }

  console.error('All Gemini model attempts failed:', lastError);

  if (lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('AI service is temporarily busy (rate limit). Please wait a moment and try again.');
  }
  if (lastError?.message?.includes('403') || lastError?.message?.includes('PERMISSION_DENIED')) {
    throw new Error('AI API key is invalid or has been revoked. Please check GEMINI_API_KEY in your .env file.');
  }

  throw new Error('AI service is temporarily experiencing high demand. Please try again in a few moments.');
}
