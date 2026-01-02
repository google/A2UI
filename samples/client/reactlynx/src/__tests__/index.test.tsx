// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import '@testing-library/jest-dom'
import { expect, test, vi } from 'vitest'
import { render, getQueriesForElement } from '@lynx-js/react/testing-library'

import { App } from '../App.jsx'

test('App', async () => {
  const cb = vi.fn()

  render(
    <App
      onRender={() => {
        cb(`__MAIN_THREAD__: ${__MAIN_THREAD__}`)
      }}
    />,
  )
  expect(cb).toBeCalledTimes(1)
  expect(cb.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "__MAIN_THREAD__: false",
      ],
    ]
  `)
  expect(elementTree.root).toMatchInlineSnapshot(`
    <page>
      <view>
        <view
          class="Background"
        />
        <view
          class="App"
        >
          <view
            class="Banner"
          >
            <view
              class="Logo"
            >
              <image
                class="Logo--lynx"
                src="/src/assets/lynx-logo.png"
              />
            </view>
            <text
              class="Title"
            >
              React
            </text>
            <text
              class="Subtitle"
            >
              on Lynx
            </text>
          </view>
          <view
            class="Content"
          >
            <image
              class="Arrow"
              src="/src/assets/arrow.png"
            />
            <text
              class="Description"
            >
              Tap the logo and have fun!
            </text>
            <text
              class="Hint"
            >
              Edit
              <text
                style="font-style:italic;color:rgba(255, 255, 255, 0.85)"
              >
                 src/App.tsx 
              </text>
              to see updates!
            </text>
          </view>
          <view
            style="flex:1"
          />
        </view>
      </view>
    </page>
  `)
  const {
    findByText,
  } = getQueriesForElement(elementTree.root!)
  const element = await findByText('Tap the logo and have fun!')
  expect(element).toBeInTheDocument()
  expect(element).toMatchInlineSnapshot(`
    <text
      class="Description"
    >
      Tap the logo and have fun!
    </text>
  `)
})
