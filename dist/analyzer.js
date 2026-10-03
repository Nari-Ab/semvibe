// analyzer.ts
// Анализирует паттерны кода через Ollama (локально, бесплатно) или Anthropic API
// Детектируем какой backend использовать
function detectBackend() {
    if (process.env.ANTHROPIC_API_KEY)
        return "anthropic";
    return "ollama"; // по умолчанию — локально и бесплатно
}
// Ollama: локальная модель, полностью бесплатно
async function analyzeWithOllama(prompt, model) {
    const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
    const response = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
                temperature: 0.1, // низкая температура = более предсказуемый JSON
                num_predict: 4096,
            },
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama error (${response.status}): ${err}`);
    }
    const data = await response.json();
    return data.response;
}
// Anthropic: Claude API (платно, но точнее)
async function analyzeWithAnthropic(prompt) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
}
export async function analyzePatterns(files, ollamaModel = "qwen2.5-coder:7b" // лучшая модель для кода, бесплатно
) {
    const backend = detectBackend();
    const codeContext = files
        .map((f) => `[FILE: ${f.path}]\n${f.content}`)
        .join("\n\n---\n\n");
    const prompt = `You are an expert software architect analyzing a codebase for architectural inconsistencies.

Below are source files from a real codebase. Your job is to find patterns that are implemented in MULTIPLE DIFFERENT ways across the codebase.

Focus on finding inconsistencies like:
- Authentication/authorization done differently (middleware vs manual check vs decorator)
- Error handling approaches that differ (try/catch vs Result type vs error callback)
- Retry logic implemented multiple ways (exponential backoff vs fixed sleep vs no retry)
- Logging done inconsistently (console.log vs logger vs no logging)
- Database access patterns (ORM vs raw queries vs repositories)
- API response formats that differ
- Validation approaches (zod vs manual vs class-validator)

IMPORTANT RULES:
- Only report REAL inconsistencies you actually see in the code
- Do NOT report false positives — if there's only one approach, don't report it
- A pattern must appear in at LEAST 2 different ways across different files to count
- Be specific about which files have which approach
- Short code examples (1-3 lines) are enough

Return ONLY valid JSON, no markdown, no explanation, just JSON:
{
  "patterns": [
    {
      "name": "Pattern Name (e.g. Authentication)",
      "severity": "critical|high|medium|low",
      "variants": [
        {
          "approach": "Short name of this approach",
          "files": ["relative/path/to/file.ts"],
          "example": "short code example showing this approach"
        }
      ],
      "recommendation": "Which approach to standardize on and why",
      "impact": "Why this inconsistency causes problems"
    }
  ],
  "summary": "One sentence summary of the overall codebase health"
}

If no inconsistencies are found, return: {"patterns": [], "summary": "No architectural inconsistencies detected."}

SOURCE FILES:
${codeContext}`;
    // Вызываем нужный backend
    let responseText;
    let modelUsed;
    if (backend === "anthropic") {
        responseText = await analyzeWithAnthropic(prompt);
        modelUsed = "claude-opus-4-5 (Anthropic API)";
    }
    else {
        responseText = await analyzeWithOllama(prompt, ollamaModel);
        modelUsed = `${ollamaModel} (Ollama local)`;
    }
    // Вытаскиваем JSON из ответа (иногда модель оборачивает в ```json блоки)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error(`Model returned unexpected format.\n` +
            `Backend: ${backend}\n` +
            `Response: ${responseText.slice(0, 200)}...`);
    }
    let parsed;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    }
    catch {
        throw new Error(`Failed to parse JSON from model response. Try again or use a different model.`);
    }
    return {
        patterns: parsed.patterns || [],
        filesScanned: files.length,
        summary: parsed.summary || "",
        model: modelUsed,
    };
}
