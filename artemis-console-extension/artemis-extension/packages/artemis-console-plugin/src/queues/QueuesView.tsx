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
import React, { useState } from 'react'
import { Route, Routes } from 'react-router'

import { MESSAGE_STATUS_DELIVERING, MESSAGE_STATUS_SCHEDULED, Queue } from '../artemis-service'
import { QueuesTable } from './QueuesTable'
import { MESSAGE_LIST_PATHS, MessagesTable } from '../messages/MessagesTable'
import { DeliveringMessagesTable } from '../messages/DeliveringMessagesTable'
import { Message, MessageView } from '../messages/MessageView'
import type { MessageNavigation } from '../messages/message-navigation'
import type { ArtemisTableFilterProps } from '../table/ArtemisTable'

// Queues View is more sophisticated than other "Artemis Tabs", because it's not just a list of queues. This view
// also presents list of messages for a queue and finally a particular message details.
// This complexity makes this component another routes collection (queues, messages, details)
export const QueuesView: React.FunctionComponent<ArtemisTableFilterProps> = props => {

  // state used for sub-routes for the messages of the queue ...
  const [currentQueue, setCurrentQueue] = useState<Queue>()
  // ... and for the details of particular message
  const [currentMessage, setCurrentMessage] = useState<Message>()
  // ... and its position in the list of messages
  const [currentNavigation, setCurrentNavigation] = useState<MessageNavigation>()

  const selectQueue = (queue: Queue) => {
    setCurrentQueue(queue)
  }

  const selectMessage = (message: Message, navigation: MessageNavigation) => {
    setCurrentMessage(message)
    setCurrentNavigation(navigation)
  }

  return (
      <Routes>
        <Route key='messages' path='messages' element={<MessagesTable queue={currentQueue} selectMessage={selectMessage} showTitle showBackToQueues />} />
        <Route key='message-details' path='message/details' element={<MessageView queue={currentQueue} message={currentMessage} navigation={currentNavigation} onNavigate={selectMessage} />} />
        {[MESSAGE_STATUS_DELIVERING, MESSAGE_STATUS_SCHEDULED].flatMap(status => [
          <Route key={status} path={MESSAGE_LIST_PATHS[status]} element={<MessagesTable queue={currentQueue} selectMessage={selectMessage} showTitle showBackToQueues onlyStatus={status} />} />,
          <Route key={`${status}-details`} path={`${MESSAGE_LIST_PATHS[status]}/details`} element={<MessageView queue={currentQueue} message={currentMessage} messageListPath={MESSAGE_LIST_PATHS[status]} navigation={currentNavigation} onNavigate={selectMessage} />} />
        ])}
        <Route key='delivering' path='delivering' element={<DeliveringMessagesTable queue={currentQueue} />} />
        <Route key='queues' path='' element={<QueuesTable switchTab={props.switchTab} filters={props.filters} selectQueue={selectQueue} editGlobalFilter={props.editGlobalFilter} />} />
      </Routes>
  )
}
