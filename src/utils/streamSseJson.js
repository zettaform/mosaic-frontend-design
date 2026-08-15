export async function streamSseJson(url, { token, signal, onMessage, onOpen, onError } = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    signal
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Streaming request failed (${response.status})`);
  }

  onOpen?.(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      const dataLines = lines
        .map((line) => line.trimEnd())
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''));
      if (!dataLines.length) continue;
      const payloadText = dataLines.join('\n');
      try {
        const payload = JSON.parse(payloadText);
        onMessage?.(payload);
      } catch (error) {
        onError?.(error);
      }
    }
  }
}
