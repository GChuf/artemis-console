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
import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Content,
  DataList,
  DataListCell,
  DataListCheck,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  FlexItem,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Pagination,
  PaginationVariant,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core'
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { ArrowLeftIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-left-icon'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { eventService, jolokiaService } from '@hawtio/react'

import { artemisPluginPath } from '../globals'
import { artemisService, Queue } from '../artemis-service'
import { artemisPreferencesService, columnStorage } from '../artemis-preferences-service'
import { ColumnType, type TableColumn, type TableRow } from '../table/types'
import { closeWithEscape } from '../table/utils'
import { createQueueObjectName } from '../util/jmx'

export type DeliveringMessagesTableProps = {
  queue?: Queue
}

// Headers returned by org.apache.activemq.artemis.api.core.Message#toMap(). Remaining fields are message properties.
const HEADER_FIELDS = ['connectionID', 'sessionID', 'consumerID', 'consumer', 'messageID', 'userID', 'address', 'durable', 'priority', 'timestamp', 'expiration']

// a function, because artemisPreferencesService.loadColumnPreferences() modifies the passed columns
const createColumns = (): TableColumn[] => [
  { id: 'messageID', type: ColumnType.STRING, name: 'Message ID', visible: true, sortable: false, filterable: false },
  { id: 'connectionID', type: ColumnType.STRING, name: 'Connection ID', visible: false, sortable: false, filterable: false },
  { id: 'sessionID', type: ColumnType.STRING, name: 'Session ID', visible: false, sortable: false, filterable: false },
  { id: 'userID', type: ColumnType.STRING, name: 'User ID', visible: true, sortable: false, filterable: false },
  { id: 'durable', type: ColumnType.BOOLEAN, name: 'Durable', visible: true, sortable: false, filterable: false },
  { id: 'priority', type: ColumnType.NUMBER, name: 'Priority', visible: true, sortable: false, filterable: false },
  { id: 'timestamp', type: ColumnType.NUMBER, name: 'Timestamp', visible: true, sortable: false, filterable: false },
  { id: 'expiration', type: ColumnType.NUMBER, name: 'Expires', visible: true, sortable: false, filterable: false },
]

const formatValue = (row: TableRow, id: string): string => {
  if (typeof row[id] === 'boolean') {
    return String(row[id])
  }
  return artemisService.getKeyByValue(row, id)
}

/**
 * Read-only list of messages which were dispatched to consumers of a queue, but not acknowledged yet.
 * Such messages are counted in "Message Count" and "Delivering Count", but are not returned by `browse()`.
 * Data comes from `QueueControl#listDeliveringMessagesAsJSON()`, which is not paged at the broker side and
 * doesn't include message bodies.
 */
export const DeliveringMessagesTable: React.FunctionComponent<DeliveringMessagesTableProps> = props => {

  const navigate = useNavigate()
  const { search } = useLocation()

  const [rows, setRows] = useState<TableRow[]>([])
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(artemisPreferencesService.loadTablePageSize(columnStorage.deliveringMessages))
  const [refreshCount, setRefreshCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<TableRow | undefined>()
  const [columns, setColumns] = useState<TableColumn[]>(() => artemisPreferencesService.loadColumnPreferences(columnStorage.deliveringMessages, createColumns()))
  const [columnsModalOpen, setColumnsModalOpen] = useState(false)

  useEffect(() => {
    let apply = true
    const listMessages = async () => {
      if (props.queue) {
        const brokerObjectName = await artemisService.getBrokerObjectName()
        const queueMBean = createQueueObjectName(brokerObjectName, props.queue.address, props.queue.routingType, props.queue.name)
        return await artemisService.getDeliveringMessages(queueMBean)
      }
      return []
    }
    listMessages().then(data => {
      if (apply) {
        setRows(data)
      }
    }).catch(error => {
      eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(error) })
    })

    return () => {
      apply = false
    }
  }, [props.queue, refreshCount])

  const filteredRows = useMemo(() => {
    const text = filter.trim().toLowerCase()
    if (!text) {
      return rows
    }
    return rows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(text)))
  }, [rows, filter])

  if (!props.queue) {
    return <Navigate to={{ pathname: `${artemisPluginPath}/queues`, search }} replace />
  }

  const pageRows = filteredRows.slice((page - 1) * perPage, page * perPage)

  const applyFilter = () => {
    setPage(1)
    setFilter(inputValue)
  }

  const handlePerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number, _newPage: number) => {
    artemisPreferencesService.saveTablePageSize(columnStorage.deliveringMessages, newPerPage)
    setPerPage(newPerPage)
    setPage(1)
  }

  const setAllColumnsVisible = (visible: boolean) => {
    setColumns(columns.map(column => ({ ...column, visible })))
  }

  const toggleColumn = (index: number) => {
    setColumns(columns.map((column, i) => i === index ? { ...column, visible: !column.visible } : column))
  }

  const cancelColumnsModal = () => {
    // discard unsaved changes
    setColumns(artemisPreferencesService.loadColumnPreferences(columnStorage.deliveringMessages, createColumns()))
    setColumnsModalOpen(false)
  }

  const saveColumns = () => {
    artemisPreferencesService.saveColumnPreferences(columnStorage.deliveringMessages, columns)
    setColumnsModalOpen(false)
  }

  const visibleColumns = columns.filter(column => column.visible)

  const headerEntries = (message: TableRow) => HEADER_FIELDS
    .filter(key => key in message)
    .map(key => [key, formatValue(message, key)])

  const propertyEntries = (message: TableRow) => Object.keys(message)
    .filter(key => !HEADER_FIELDS.includes(key))
    .sort()
    .map(key => [key, String(message[key])])

  return (
    <>
      <Flex direction={{ default: 'row' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
        <FlexItem>
          <Title headingLevel='h2'>Messages in delivery on {props.queue.name}</Title>
        </FlexItem>
        <FlexItem>
          <Button variant='link' onClick={() => {
            navigate({ pathname: `${artemisPluginPath}/queues`, search })
          }}>
            <Icon><ArrowLeftIcon /></Icon> Back to Queue list
          </Button>
        </FlexItem>
      </Flex>
      <Toolbar id='delivering-messages-toolbar'>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label='Search messages in delivery'
              placeholder='Search all fields'
              onChange={(_event, value) => setInputValue(value)}
              value={inputValue}
              onClear={() => {
                setInputValue('')
                setPage(1)
                setFilter('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilter()
                }
              }}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={applyFilter} size='sm'>Filter</Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button onClick={() => setRefreshCount(c => c + 1)} size='sm' variant='secondary'>Refresh</Button>
          </ToolbarItem>
          <ToolbarItem variant='separator' />
          <ToolbarItem>
            <Button variant='link' onClick={() => setColumnsModalOpen(true)}>Manage Columns ({visibleColumns.length}/{columns.length})</Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <InnerScrollContainer>
        <Table id='delivering-message-table' isStickyHeader variant='compact' aria-label='Delivering Message Table'>
          <Thead>
            <Tr>
              {visibleColumns.map(column => <Th key={column.id}>{column.name}</Th>)}
            </Tr>
          </Thead>
          <Tbody>
            {pageRows.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                {visibleColumns.map(column => column.id === 'messageID'
                  ? <Td key={column.id}><Button variant='link' isInline onClick={() => setSelectedMessage(row)}>{formatValue(row, column.id)}</Button></Td>
                  : <Td key={column.id}>{formatValue(row, column.id)}</Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </InnerScrollContainer>

      <Pagination
        itemCount={filteredRows.length}
        page={page}
        perPage={perPage}
        onSetPage={(_event, newPage) => setPage(newPage)}
        onPerPageSelect={handlePerPageSelect}
        variant={PaginationVariant.bottom}
        titles={{
          paginationAriaLabel: `${PaginationVariant.bottom} pagination`
        }}
      />

      <Modal aria-label='delivering-message-modal' variant={ModalVariant.medium} isOpen={selectedMessage !== undefined}
             onClose={() => setSelectedMessage(undefined)}
             onKeyDown={closeWithEscape(() => setSelectedMessage(undefined))}>
        <ModalHeader title={`Delivering message ${selectedMessage?.messageID ?? ''}`} />
        <ModalBody>
          {selectedMessage && <>
            <Table variant='compact' isStriped aria-label='Delivering Message Headers'>
              <Thead>
                <Tr>
                  <Th>header</Th>
                  <Th>value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {headerEntries(selectedMessage).map(([key, value]) => (
                  <Tr key={key}><Td>{key}</Td><Td modifier='breakWord'>{value}</Td></Tr>
                ))}
              </Tbody>
            </Table>
            {propertyEntries(selectedMessage).length > 0
              ? <Table variant='compact' isStriped aria-label='Delivering Message Properties'>
                  <Thead>
                    <Tr>
                      <Th>property</Th>
                      <Th>value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {propertyEntries(selectedMessage).map(([key, value]) => (
                      <Tr key={key}><Td>{key}</Td><Td modifier='breakWord'>{value}</Td></Tr>
                    ))}
                  </Tbody>
                </Table>
              : <Alert isPlain isInline variant='info' title='Message doesn&apos;t contain any properties' />}
          </>}
        </ModalBody>
        <ModalFooter>
          <Button variant='secondary' onClick={() => setSelectedMessage(undefined)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={columnsModalOpen} variant='small' onClose={cancelColumnsModal}>
        <ModalHeader>
          <Title headingLevel='h2' size='lg'>Manage Columns</Title>
          <Content>Selected categories are displayed in the table.</Content>
          <Content>
            <Button isInline onClick={() => setAllColumnsVisible(true)} variant='link'>
              Select all
            </Button>{ ' | ' }
            <Button isInline onClick={() => setAllColumnsVisible(false)} variant='link'>
              Unselect all
            </Button>
          </Content>
        </ModalHeader>
        <ModalBody>
          <DataList aria-label='Delivering messages column management' id='delivering-column-management' isCompact>
            {columns.map((column, index) => (
              <DataListItem key={`delivering-column-management-${column.id}`} aria-labelledby={`delivering-column-management-${column.id}`}>
                <DataListItemRow>
                  <DataListCheck
                    aria-labelledby={`delivering-column-management-item-${column.id}`}
                    isChecked={column.visible}
                    name={`delivering-check-${column.id}`}
                    id={`delivering-check-${column.id}`}
                    onChange={() => toggleColumn(index)}
                  />
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell id={`delivering-column-management-item-${column.id}`} key={`delivering-column-management-item-${column.id}`}>
                        <label htmlFor={`delivering-check-${column.id}`}>{column.name}</label>
                      </DataListCell>
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            ))}
          </DataList>
        </ModalBody>
        <ModalFooter>
          <Button key='save' variant='primary' onClick={saveColumns}>
            Save
          </Button>
          <Button key='close' variant='link' onClick={cancelColumnsModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
