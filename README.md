## Inspiration
Last week I had a call with the team in my project about new requirements from the business regarding displaying different business data. Again. New version. It is always a compromise between different departments about dashboards, page layouts etc. I said, "There should be AI Agent that prepares dynamic dashboards and then each User will see desired stuff.". One girl replied: "Please do not say it to the business.". I will not say it to them. I will show it to them.

## What it does
dashpers allows  to create personalized business dashboards through natural language commands.

## How we built it
Stack: lovable (React, TypeScript, Tailwind), fal.ai, pica, render, IIElevenLabs, supabase, edge functions
Used Anthropic framework of effective ai agent - [https://www.anthropic.com/research/building-effective-agents][Building effective agents]

## Challenges we ran into
- I had to run external Node.js server to be able to use pica SDK, it was not possible to use it via supabase edge functions,
- max stack limit calling IIElevenLabs,
- lovable changed unnecessary code from time to time.

## Accomplishments that we're proud of
In quite limited time and team (solo) I was able to provide some features that I am satisfied with. I was struggled at the beginning with some tools that I did not use before (probably I could deliver more with Cursor), but finally I am happy about the results.

## What we learned
This time instead of Cursor I decided to use new tech stack: **lovable, pica, fal.ai** - I did not use it before. It was fun!

## What's next for dashpers
**Publish quick demo for feedback and talk to users.**
Regarding tech improvements:
- better chat with all the contents and sources,
- more tools, mostly enterprise ones, for example connection to datalake like databricks,
- better grid configuration (e.g. moving widgets with drag and drop),
- speech to text - configure the dashboards with voice,
- more actions and interactions with components (like links, records editing etc.).
