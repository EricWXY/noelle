
export function listenDialogueBack(cb: (data: DialogueBackStream) => void, messageId: number) {
  const stop = window.api.onDialogueBack((stream: DialogueBackStream) => {
    cb(stream);
    if (stream.data.isEnd) {
    }
    stream.data.isEnd && stop()
  }, messageId)
  return stop;
}
