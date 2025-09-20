import { ChatCompletion } from '@baiducloud/qianfan';
import { BaseProvider } from './BaseProvider';

export class QianfanProvider extends BaseProvider {
  private client: InstanceType<typeof ChatCompletion>;
  constructor(accessKey: string, secretKey: string) {
    super();
    this.client = new ChatCompletion({
      QIANFAN_ACCESS_KEY: accessKey,
      QIANFAN_SECRET_KEY: secretKey,
    });
  }

  async chat(messages: DialogueMessageProps[], model: string): Promise<AsyncIterable<UniversalChunk>> {
    const stream = await this.client.chat({
      messages, stream: true
    }, model)
    return {
      async *[Symbol.asyncIterator]() {
        for await (const chunk of stream as AsyncIterable<any>) {
          yield {
            isEnd: chunk.is_end,
            result: chunk.result,
          } as UniversalChunk;
        }
      }
    }
  }
}
