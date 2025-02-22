
const API_URL = 'http://localhost:3001';

export const chatWithPica = async (messages: any[]) => {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error('Failed to chat with Pica');
  }

  return response.json();
};
