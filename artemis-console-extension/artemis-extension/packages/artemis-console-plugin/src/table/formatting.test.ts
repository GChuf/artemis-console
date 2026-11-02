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
import { describe, expect, test } from "@jest/globals"
import { artemisService } from "../artemis-service"
import { formatValue } from './utils'

/**
 * Values of the list operations, which are strings on brokers returning JSON and typed on brokers returning
 * structured data
 */
describe("Formatting of list values", () => {

  test("formatValue converts structured values to text", () => {
    expect(formatValue(null)).toBe("")
    expect(formatValue(undefined)).toBe("")
    expect(formatValue(false)).toBe("false")
    expect(formatValue(true)).toBe("true")
    expect(formatValue(42)).toBe("42")
    expect(formatValue(["ANYCAST", "MULTICAST"])).toBe("ANYCAST, MULTICAST")
    expect(formatValue("text")).toBe("text")
  })

  test("formatTime formats epoch milliseconds and keeps text", () => {
    const time = new Date(2020, 0, 2, 3, 4, 5).getTime()
    expect(artemisService.formatTime(time)).toBe("2020-01-02 03:04:05")
    expect(artemisService.formatTime("Wed Jan 01 12:00:00 CET 2020")).toBe("Wed Jan 01 12:00:00 CET 2020")
    expect(artemisService.formatTime(null)).toBe("")
  })
})
