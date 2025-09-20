import { BaseProvider } from './BaseProvider';

import OpenAI from 'openai';


function _transformChunk(chunk: OpenAI.Chat.Completions.ChatCompletionChunk): UniversalChunk {
  const choice = chunk.choices[0];
  return {
    isEnd: choice?.finish_reason === 'stop',
    result: choice?.delta?.content ?? '',
  }
}
export class OpenAIProvider extends BaseProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL: string) {
    super();
    this.client = new OpenAI({ apiKey, baseURL });
  }
  async chat(messages: DialogueMessageProps[], model: string): Promise<AsyncIterable<UniversalChunk>> {
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      stream: true
    })

    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of stream) {
          yield _transformChunk(chunk);
        }
      }
    }
  }
}
