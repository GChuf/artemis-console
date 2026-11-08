/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, jest, test } from '@jest/globals'
import { eventService } from '@hawtio/react'

import { createMessageNavigation, MessagesPage } from './message-navigation'

const PER_PAGE = 2

// a list of messages with IDs m0, m1, ...
const pageOf = (count: number, page: number): MessagesPage => {
  const first = (page - 1) * PER_PAGE
  const size = Math.max(0, Math.min(PER_PAGE, count - first))
  return { data: Array.from({ length: size }, (_, i) => ({ messageID: `m${first + i}` })), count }
}

const fetcher = (count: number) => jest.fn(async (page: number) => pageOf(count, page))

const navigationFor = (fetchPage: (page: number) => Promise<MessagesPage>, count: number) =>
  createMessageNavigation(fetchPage, PER_PAGE, { page: 2, rows: pageOf(count, 2).data, count }, 2)

describe('createMessageNavigation', () => {

  test('keeps the position in the list', () => {
    const navigation = navigationFor(fetcher(5), 5)
    expect(navigation.index).toBe(2)
    expect(navigation.totalCount).toBe(5)
  })

  test('uses the already loaded page', async () => {
    const fetchPage = fetcher(5)
    const result = await navigationFor(fetchPage, 5).fetchMessageAt(3)
    expect(result.message?.messageID).toBe('m3')
    expect(fetchPage).not.toHaveBeenCalled()
  })

  test('fetches other pages only once', async () => {
    const fetchPage = fetcher(5)
    const navigation = navigationFor(fetchPage, 5)

    expect((await navigation.fetchMessageAt(4)).message?.messageID).toBe('m4')
    expect((await navigation.fetchMessageAt(1)).message?.messageID).toBe('m1')
    expect((await navigation.fetchMessageAt(0)).message?.messageID).toBe('m0')
    expect((await navigation.fetchMessageAt(4)).message?.messageID).toBe('m4')

    expect(fetchPage.mock.calls.map(call => call[0])).toEqual([3, 1])
  })

  test('drops fetched pages when the size of the list changes', async () => {
    let count = 5
    const fetchPage = jest.fn(async (page: number) => pageOf(count, page))
    const navigation = navigationFor(fetchPage, 5)

    await navigation.fetchMessageAt(0)
    count = 4
    const result = await navigation.fetchMessageAt(4)
    expect(result).toEqual({ message: null, totalCount: 4 })

    await navigation.fetchMessageAt(3)
    expect(fetchPage.mock.calls.map(call => call[0])).toEqual([1, 3, 2])
  })

  test('retries a page which came back empty', async () => {
    const fetchPage = jest.fn(async (page: number) => pageOf(5, page))
    fetchPage.mockResolvedValueOnce({ data: [], count: 0 })
    const navigation = navigationFor(fetchPage, 5)

    expect(await navigation.fetchMessageAt(4)).toEqual({ message: null, totalCount: 0 })
    expect((await navigation.fetchMessageAt(4)).message?.messageID).toBe('m4')
    expect((await navigation.fetchMessageAt(4)).totalCount).toBe(5)
  })

  test('reports a failed call and keeps the known size', async () => {
    const notify = jest.spyOn(eventService, 'notify').mockImplementation(() => undefined)
    const fetchPage = jest.fn(async (_page: number): Promise<MessagesPage> => {
      throw new Error('no connection')
    })

    expect(await navigationFor(fetchPage, 5).fetchMessageAt(0)).toEqual({ message: null, totalCount: 5 })
    expect(notify).toHaveBeenCalledTimes(1)
  })
})
