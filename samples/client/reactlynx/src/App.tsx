import { Suspense, useCallback, useEffect, useLynxGlobalEventListener, useState } from '@lynx-js/react'
import { Client, randomId } from './client'
import { v0_8 } from "@a2ui/lit";

import './App.css'
import { A2UIRender } from './A2UIRender';

export function App(props: {
  onRender?: () => void
}) {
  const [sendMessage, setSendMessage] = useState<{
    id: string,
    role: 'user' | 'agent',
    content: string,
    resource?: ()=> any
  }[]>([])
  const [inputValue, setInputValue] = useState('Top 5 Chinese restaurants in New York.')
  const [isLoading, setIsLoading] = useState(false)
  const [surfaces, setSurfaces] = useState<Map<string, v0_8.Types.Surface>>(new Map());
  let client: null | Client = null;
  const handleInput = useCallback((e: any) => {
    console.log('handleInput', e.detail.value);
    setInputValue(e.detail.value);
  }, [])

  const handleSend = useCallback(async () => {
    console.log('handleSend', inputValue);
    if (!inputValue.trim()) return
    setIsLoading(true)
    setInputValue('')
    try{
      if(!client){
        client = new Client();
      }
      const res = await client.makeRequest(inputValue);
      setSendMessage([...sendMessage, {
        id: randomId(),
        role: 'user',
        content: inputValue,
        resource: res
      }]);
    } finally {
      setIsLoading(false)
    }
  }, [inputValue])

  // useLynxGlobalEventListener('newSurface', (message) => {
  //   console.log('newSurface', message);
  //   setSendMessage([...sendMessage, {
  //     id: randomId(),
  //     role: 'agent',
  //     content: message,
  //   }]);
  // })

  return (
    <view className='container'>
      <scroll-view class='message-list' scroll-y>
        { sendMessage.map((item, index) => (
          item.role === 'user' ? <>
            <view key={`user-${item.id}`} class={`message-item user`}>
              <text class='user-text'>
                {item.content}
              </text>
            </view>
            <view key={`assistant-${item.id}`} class={`message-item assistant`}>
              <Suspense fallback={<text class='assistant-text'>Thinking...</text>}>
                <A2UIRender resource={item.resource} />
              </Suspense>
            </view>
          </>: <></>
        ))}
      </scroll-view>
      <view id='panel' class='input-area'>
        <input
          show-soft-input-onfocus
          adjust-mode='center'
          class='input'
          bindinput={handleInput}
          placeholder='Enter prompt...'
        />
        <view class='send-btn' bindtap={handleSend}>
          <text class='send-text'>Send</text>
        </view>
      </view>
    </view>
  )
}
