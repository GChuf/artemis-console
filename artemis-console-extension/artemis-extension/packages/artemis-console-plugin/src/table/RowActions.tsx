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
import React, { useEffect, useRef, useState } from 'react'
import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle, Tooltip } from '@patternfly/react-core'
import { type IAction, type IRowData } from '@patternfly/react-table'
import { RhUiEllipsisVerticalFillIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-ellipsis-vertical-fill-icon.js'

export type RowActionsProps = {
  /** Returns the actions of the row. Called only once the menu is opened. Without it, the toggle is disabled */
  getActions?: () => IAction[]
  /** Index of the row, passed to `IAction.onClick` */
  rowIndex: number
  /** Data of the row, passed to `IAction.onClick` */
  rowData: IRowData
  popperProps?: React.ComponentProps<typeof Dropdown>['popperProps']
}

/**
 * Kebab menu with the actions of a single table row - a lazy replacement of PatternFly's `<ActionsColumn>`.
 *
 * `<ActionsColumn>` mounts a `<Dropdown>` for every row, even if its menu is never opened. Each one comes with
 * a `<Popper>`, which registers event listeners and schedules timers on mount, and all the row actions have to be
 * created up front. With hundreds of rows this is a large part of every table render. This component renders only
 * a plain toggle and mounts the dropdown (and asks for the actions) after the toggle is clicked for the first time.
 */
export const RowActions: React.FunctionComponent<RowActionsProps> = ({
  getActions,
  rowIndex,
  rowData,
  popperProps = { position: 'end' }
}) => {
  const [isActivated, setIsActivated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // The toggle is always rendered here, never by the dropdown, so its DOM element is not replaced when the dropdown
  // gets mounted. Replacing an element inside a table cell makes the browser lay out the whole table again, which is
  // slow for big tables. The dropdown gets only a reference to the toggle, which it uses to position the menu, to
  // tell clicks on the toggle from outside clicks and to return the focus on Escape.
  const toggle = (
    <MenuToggle
      ref={toggleRef}
      aria-label='Kebab toggle'
      variant='plain'
      icon={<RhUiEllipsisVerticalFillIcon />}
      isDisabled={!getActions}
      isExpanded={isOpen}
      onClick={() => isActivated ? setIsOpen(!isOpen) : setIsActivated(true)}
    />
  )

  // Open the menu only after the dropdown was mounted closed. When <Popper> is mounted already visible, it doesn't
  // pick up the menu element, never positions it and the menu stays at the top left corner of the page.
  useEffect(() => {
    if (isActivated) {
      setIsOpen(true)
    }
  }, [isActivated])

  // the structure is the same with or without the dropdown, so React keeps the toggle element
  return (<>
    {toggle}
    {getActions && isActivated && <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      popperProps={popperProps}
      toggle={{ toggleRef, toggleNode: null }}
    >
      <DropdownList>
        {getActions().map((action, index) => {
          // same handling of IAction as in <ActionsColumn>, except for isOutsideDropdown, which isn't supported
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { title, itemKey, onClick, tooltipProps, isSeparator, shouldCloseOnClick = true, isOutsideDropdown, variant, ...props } = action
          const key = itemKey ?? index
          if (isSeparator) {
            return <Divider key={key} data-key={key} />
          }
          const item = (
            <DropdownItem
              {...props}
              key={key}
              data-key={key}
              onClick={(event: React.MouseEvent) => {
                if (onClick) {
                  event.preventDefault()
                  onClick(event, rowIndex, rowData, { rowIndex })
                }
                if (shouldCloseOnClick) {
                  setIsOpen(false)
                }
              }}
            >
              {title}
            </DropdownItem>
          )
          return tooltipProps?.content ? <Tooltip key={key} {...tooltipProps}>{item}</Tooltip> : item
        })}
      </DropdownList>
    </Dropdown>}
  </>)
}
