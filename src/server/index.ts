
import express from 'express';
import cors from 'cors';
import { Pica } from "@picahq/ai";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, Message } from "ai";

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { messages }: { messages: Message[] } = req.body;

    const pica = new Pica(process.env.PICA_SECRET_KEY as string);
    const system = await pica.generateSystemPrompt();

    const stream = await streamText({
      model: openai("gpt-4"),
      system,
      tools: {
        ...pica.oneTool,
      },
      messages: convertToCoreMessages(messages),
      maxSteps: 20,
    });

    res.json(await stream.toDataStreamResponse());
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
