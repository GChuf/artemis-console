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

// This module declares some constant values and arrays used in relation to
// ArtemisTable and related components

import type { CSSProperties } from 'react'
import { FilterOperation } from './types'

export const operationOptions: { id: FilterOperation, name: string, symbol: string }[] = [
  { id: 'CONTAINS', name: 'Contains', symbol: '~' },
  { id: 'NOT_CONTAINS', name: 'Does not Contain', symbol: '!~' },
  { id: 'EQUALS', name: 'Equals', symbol: '=' },
  { id: 'NOT_EQUALS', name: 'Not Equals', symbol: '!=' },
  { id: 'GREATER_THAN', name: 'Greater Than', symbol: '>' },
  { id: 'LESS_THAN', name: 'Less Than', symbol: '<' }
]

export const pageSizeOptions: { title: string, value: number }[] = [
  { title: '10 per page', value: 10 },
  { title: '20 per page', value: 20 },
  { title: '50 per page', value: 50 },
  { title: '100 per page', value: 100 },
  { title: 'All items', value: -1 },
]

export const defaultRowsPerPage = 10

/** Width of the trailing column with the row actions (kebab) menu */
export const actionsColumnWidth = '4.5rem'

/**
 * Minimal width of a column without a fixed width. When the visible columns can't all get at least this width,
 * the table scrolls horizontally instead of squeezing them.
 */
export const minColumnWidth = '8rem'

/**
 * Style for compact tables, setting PatternFly's component variable for the top padding of the header cells from
 * 12px to the same 8px as their bottom padding.
 */
export const evenCompactHeaderPadding = {
  '--pf-v6-c-table--m-compact__th--PaddingBlockStart': 'var(--pf-t--global--spacer--sm)'
} as CSSProperties

/**
 * Style for compact tables with sortable columns, setting the top padding of the header cells to 0. The sort button
 * inside a header cell has its own 8px top padding (its bottom padding is cancelled by a negative margin), so the
 * column names get the same 8px above as below.
 */
export const sortableCompactHeaderPadding = {
  '--pf-v6-c-table--m-compact__th--PaddingBlockStart': '0'
} as CSSProperties
