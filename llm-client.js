import "dotenv/config";
import Groq from "groq-sdk";

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY, // This is the default and can be omitted
  });

export async function askLLM(systemRole, userRole) {

  const completion = await client.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: userRole },
        ],
        response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
}
