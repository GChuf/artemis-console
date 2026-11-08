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
import { eventService, jolokiaService } from '@hawtio/react'

import type { TableRow } from '../table/types'
import type { Message } from './MessageView'

export type MessageAtIndex = {
  message: Message | null
  totalCount: number
}

/**
 * Position of a message in the list it was opened from. It doesn't depend on the list component, which is
 * unmounted while the details of a message are shown.
 */
export type MessageNavigation = {
  index: number
  totalCount: number
  fetchMessageAt: (index: number) => Promise<MessageAtIndex>
}

export type MessagesPage = {
  data: TableRow[]
  count: number
}

/**
 * Creates the navigation for a message at `index` of a list.
 *
 * @param fetchPage returns the given (1-based) page of the list
 * @param perPage the size of the pages of the list
 * @param loaded the page of the list which is already loaded
 * @param index index of the message in the whole list
 */
export const createMessageNavigation = (
  fetchPage: (page: number) => Promise<MessagesPage>,
  perPage: number,
  loaded: { page: number, rows: TableRow[], count: number },
  index: number
): MessageNavigation => {
  const pages = new Map<number, TableRow[]>([[loaded.page, loaded.rows]])
  let totalCount = loaded.count

  const fetchMessageAt = async (messageIndex: number): Promise<MessageAtIndex> => {
    const targetPage = Math.floor(messageIndex / perPage) + 1
    let rows = pages.get(targetPage)
    if (!rows) {
      try {
        const response = await fetchPage(targetPage)
        if (response.count !== totalCount) {
          // the list has changed, so the pages fetched earlier are shifted
          pages.clear()
          totalCount = response.count
        }
        rows = response.data
        // an empty page may also be the result of a failed call, which can be retried
        if (rows.length > 0) {
          pages.set(targetPage, rows)
        }
      } catch (error) {
        eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(error) })
        return { message: null, totalCount }
      }
    }
    return { message: (rows[messageIndex % perPage] as Message) ?? null, totalCount }
  }

  return { index, totalCount, fetchMessageAt }
}
