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
import { beforeAll, describe, expect, test } from "@jest/globals"
import { artemisService } from "./artemis-service";
import { SortDirection } from './table/types'
import { userService, parseMBeanName } from '@hawtio/react'

beforeAll(async () => {
  // needed to determine Jolokia URL
  await userService.fetchUser().catch(e => {
    console.error("error fetching user:", e)
  })
})

/**
 * A set of tests that run against a running broker instance to test the integration API
 */
describe("Artemis Service basic tests", () => {

  test("Jolokia instance creation", async () => {
    expect.assertions(1)
    let addresses = artemisService.getAddresses(
        1, 50,
        { column: "0", order: SortDirection.ASCENDING },
        { tab: 'addresses', column: "", operation: "CONTAINS", input: "" }
    )
    await expect(addresses).resolves.toContain("DLQ");
  })

  test("Splitting ObjectNames", () => {
    const mbean = "org.apache.activemq.artemis:broker=\"0.0.0.0:61616\",component=acceptors,filter=\"x,y,z=a\",name=amqp"
    const parsed = parseMBeanName(mbean)
    expect(parsed.domain).toEqual("org.apache.activemq.artemis")
    expect(parsed.properties["broker"]).toEqual("\"0.0.0.0:61616\"")
    expect(parsed.properties["filter"]).toEqual("\"x,y,z=a\"")
    expect(parsed.properties["name"]).toEqual("amqp")
  })

})

/**
 * Tests for permission checking methods
 */
describe("Artemis Service permission checks", () => {

  const createMockBrokerNode = (hasInvokeRights: (sig: string) => boolean) => ({
    hasInvokeRights,
    name: "mockBroker",
    objectName: "org.apache.activemq.artemis:broker=mockBroker"
  } as any)

  test("canListConnections returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listConnections(java.lang.String,int,int)")
    expect(artemisService.canListConnections(mockBroker)).toBe(true)
  })

  test("canListConnections returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListConnections(mockBroker)).toBe(false)
  })

  test("canListConnections returns false when broker is undefined", () => {
    expect(artemisService.canListConnections(undefined)).toBe(false)
  })

  test("canListSessions returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listSessions(java.lang.String,int,int)")
    expect(artemisService.canListSessions(mockBroker)).toBe(true)
  })

  test("canListSessions returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListSessions(mockBroker)).toBe(false)
  })

  test("canListSessions returns false when broker is undefined", () => {
    expect(artemisService.canListSessions(undefined)).toBe(false)
  })

  test("canListConsumers returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listConsumers(java.lang.String,int,int)")
    expect(artemisService.canListConsumers(mockBroker)).toBe(true)
  })

  test("canListConsumers returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListConsumers(mockBroker)).toBe(false)
  })

  test("canListConsumers returns false when broker is undefined", () => {
    expect(artemisService.canListConsumers(undefined)).toBe(false)
  })

  test("canListProducers returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listProducers(java.lang.String,int,int)")
    expect(artemisService.canListProducers(mockBroker)).toBe(true)
  })

  test("canListProducers returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListProducers(mockBroker)).toBe(false)
  })

  test("canListProducers returns false when broker is undefined", () => {
    expect(artemisService.canListProducers(undefined)).toBe(false)
  })

  test("canListAddresses returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listAddresses(java.lang.String,int,int)")
    expect(artemisService.canListAddresses(mockBroker)).toBe(true)
  })

  test("canListAddresses returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListAddresses(mockBroker)).toBe(false)
  })

  test("canListAddresses returns false when broker is undefined", () => {
    expect(artemisService.canListAddresses(undefined)).toBe(false)
  })

  test("canListQueues returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listQueues(java.lang.String,int,int)")
    expect(artemisService.canListQueues(mockBroker)).toBe(true)
  })

  test("canListQueues returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListQueues(mockBroker)).toBe(false)
  })

  test("canListQueues returns false when broker is undefined", () => {
    expect(artemisService.canListQueues(undefined)).toBe(false)
  })

  test("canListNetworkTopology returns true when broker has invoke rights", () => {
    const mockBroker = createMockBrokerNode((sig) => sig === "listNetworkTopology")
    expect(artemisService.canListNetworkTopology(mockBroker)).toBe(true)
  })

  test("canListNetworkTopology returns false when broker lacks invoke rights", () => {
    const mockBroker = createMockBrokerNode(() => false)
    expect(artemisService.canListNetworkTopology(mockBroker)).toBe(false)
  })

  test("canListNetworkTopology returns false when broker is undefined", () => {
    expect(artemisService.canListNetworkTopology(undefined)).toBe(false)
  })

})

/**
 * Tests for converting the result of QueueControl#listDeliveringMessagesAsJSON()
 */
describe("Artemis Service delivering messages", () => {

  test("flattenDeliveringMessages adds consumer to each message", () => {
    const consumer1 = "ServerConsumer [id=87656187:ce3772ef-d138-11f1-a927-0250f2559b12:0, filter=null, binding=LocalQueueBinding [address=q, queue=QueueImpl[name=q, temp=false]@4edc1bbf]]"
    const consumer2 = "ServerConsumer [id=1234:abcd-ef:3, filter=null, binding=LocalQueueBinding [address=q]]"
    const json = JSON.stringify([
      { consumerName: consumer1, elements: [{ messageID: 1, priority: 4 }, { messageID: 2, priority: 4, myProp: "x" }] },
      { consumerName: consumer2, elements: [{ messageID: 3, durable: true }] }
    ])
    const ids1 = { connectionID: "87656187", sessionID: "ce3772ef-d138-11f1-a927-0250f2559b12", consumerID: "0", consumer: consumer1 }
    const ids2 = { connectionID: "1234", sessionID: "abcd-ef", consumerID: "3", consumer: consumer2 }
    expect(artemisService.flattenDeliveringMessages(json)).toEqual([
      { messageID: 1, priority: 4, ...ids1 },
      { messageID: 2, priority: 4, myProp: "x", ...ids1 },
      { messageID: 3, durable: true, ...ids2 }
    ])
  })

  test("parseConsumerName handles sessions and unknown formats", () => {
    expect(artemisService.parseConsumerName("ServerSession [id=1234:abcd-ef]"))
      .toEqual({ connectionID: "1234", sessionID: "abcd-ef", consumerID: undefined })
    expect(artemisService.parseConsumerName("something else")).toEqual({})
  })

  test("mergeMessages appends delivering messages after waiting messages", () => {
    // 3 waiting + 4 delivering messages, 5 per page
    const delivering = [{ status: "In delivery", messages: [{ messageID: 11 }, { messageID: 12 }, { messageID: 13 }, { messageID: 14 }] }]
    const page1 = artemisService.mergeMessages([{ messageID: 1 }, { messageID: 2 }, { messageID: 3 }], delivering, 7, 1, 5)
    expect(page1).toEqual([
      { messageID: 1, status: "Waiting" },
      { messageID: 2, status: "Waiting" },
      { messageID: 3, status: "Waiting" },
      { messageID: 11, status: "In delivery" },
      { messageID: 12, status: "In delivery" }
    ])
    // browse() returns nothing for page 2
    const page2 = artemisService.mergeMessages([], delivering, 7, 2, 5)
    expect(page2).toEqual([
      { messageID: 13, status: "In delivery" },
      { messageID: 14, status: "In delivery" }
    ])
  })

  test("mergeMessages with only delivering messages", () => {
    const delivering = [{ status: "In delivery", messages: [{ messageID: 11 }, { messageID: 12 }] }]
    expect(artemisService.mergeMessages([], delivering, 2, 1, 10)).toEqual([
      { messageID: 11, status: "In delivery" },
      { messageID: 12, status: "In delivery" }
    ])
  })

  test("mergeMessages shows scheduled messages after delivering messages", () => {
    // 1 waiting + 2 delivering + 2 scheduled messages, 2 per page
    const others = [
      { status: "In delivery", messages: [{ messageID: 11 }, { messageID: 12 }] },
      { status: "Scheduled", messages: [{ messageID: 21 }, { messageID: 22 }] }
    ]
    expect(artemisService.mergeMessages([{ messageID: 1 }], others, 5, 1, 2)).toEqual([
      { messageID: 1, status: "Waiting" },
      { messageID: 11, status: "In delivery" }
    ])
    expect(artemisService.mergeMessages([], others, 5, 2, 2)).toEqual([
      { messageID: 12, status: "In delivery" },
      { messageID: 21, status: "Scheduled" }
    ])
    expect(artemisService.mergeMessages([], others, 5, 3, 2)).toEqual([
      { messageID: 22, status: "Scheduled" }
    ])
  })

  test("hasOperationSignature tells overloads apart", () => {
    const operations = {
      listScheduledMessagesAsJSON: { args: [], ret: "java.lang.String" },
      browse: [
        { args: [], ret: "[Ljavax.management.openmbean.CompositeData;" },
        { args: [{ type: "java.lang.String" }], ret: "[Ljavax.management.openmbean.CompositeData;" }
      ]
    }
    expect(artemisService.hasOperationSignature(operations, "listScheduledMessagesAsJSON()")).toBe(true)
    expect(artemisService.hasOperationSignature(operations, "listScheduledMessagesAsJSON(java.lang.String)")).toBe(false)
    expect(artemisService.hasOperationSignature(operations, "browse(java.lang.String)")).toBe(true)
    expect(artemisService.hasOperationSignature(operations, "browse(int,int)")).toBe(false)
    expect(artemisService.hasOperationSignature(operations, "listDeliveringMessagesAsJSON()")).toBe(false)
    expect(artemisService.hasOperationSignature(undefined, "browse()")).toBe(false)
  })

  test("flattenDeliveringMessages handles no delivering messages", () => {
    expect(artemisService.flattenDeliveringMessages("[]")).toEqual([])
    expect(artemisService.flattenDeliveringMessages("")).toEqual([])
  })

})
