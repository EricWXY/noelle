
export function listenDialogueBack(cb: (data: DialogueBackStream) => void) {
  window.api.onDialogueBack((stream: DialogueBackStream) => {
    cb(stream);
    if(stream.data.isEnd ){
    }
    stream.data.isEnd && window.api.removeDialogueBackListener()
  })
}
