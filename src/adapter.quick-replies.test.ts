import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { Actions, Button, Card, CardText, ConsoleLogger } from "chat";
import { MessengerAdapter } from "./adapter";

describe("MessengerAdapter quick replies", () => {
  it("renders card buttons as Messenger quick replies", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ recipient_id: "user-1", message_id: "mid-1" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const adapter = new MessengerAdapter({
      appSecret: "app-secret",
      pageAccessToken: "page-token",
      verifyToken: "verify-token",
      logger: new ConsoleLogger("error"),
    });

    await adapter.postMessage("messenger:user-1", {
      card: Card({
        title: "Order",
        children: [
          CardText("Choose an action"),
          Actions([
            Button({ id: "approve", label: "Approve", value: "yes" }),
            Button({ id: "reject", label: "Reject", value: "no" }),
          ]),
        ],
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body)) as {
      message: {
        quick_replies?: Array<{
          content_type: string;
          title: string;
          payload: string;
        }>;
        text: string;
      };
    };

    expect(body.message.text).toContain("Order");
    expect(body.message.quick_replies).toHaveLength(2);
    expect(body.message.quick_replies?.[0]?.title).toBe("Approve");

    const payload = JSON.parse(
      body.message.quick_replies?.[0]?.payload ?? "{}",
    ) as {
      actionId?: string;
      source?: string;
      value?: string;
    };

    expect(payload.source).toBe("chat-sdk-button");
    expect(payload.actionId).toBe("approve");
    expect(payload.value).toBe("yes");

    vi.unstubAllGlobals();
  });

  it("routes quick reply payloads to processAction", async () => {
    const appSecret = "app-secret";
    const payload = {
      object: "page",
      entry: [
        {
          id: "page-1",
          time: Date.now(),
          messaging: [
            {
              sender: { id: "user-1" },
              recipient: { id: "page-1" },
              timestamp: Date.now(),
              message: {
                mid: "m_1",
                text: "Approve",
                quick_reply: {
                  payload: JSON.stringify({
                    source: "chat-sdk-button",
                    actionId: "approve",
                    value: "yes",
                  }),
                },
              },
            },
          ],
        },
      ],
    };

    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", appSecret)
      .update(body, "utf8")
      .digest("hex");

    const processAction = vi.fn();
    const processMessage = vi.fn();

    const adapter = new MessengerAdapter({
      appSecret,
      pageAccessToken: "page-token",
      verifyToken: "verify-token",
      logger: new ConsoleLogger("error"),
    });

    (adapter as unknown as { chat: unknown }).chat = {
      processAction,
      processMessage,
    };

    const request = new Request("https://example.com/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": `sha256=${signature}`,
      },
      body,
    });

    const response = await adapter.handleWebhook(request);

    expect(response.status).toBe(200);
    expect(processAction).toHaveBeenCalledTimes(1);
    expect(processMessage).not.toHaveBeenCalled();

    const actionEvent = processAction.mock.calls[0]?.[0] as {
      actionId: string;
      value?: string;
      messageId: string;
      threadId: string;
    };

    expect(actionEvent.actionId).toBe("approve");
    expect(actionEvent.value).toBe("yes");
    expect(actionEvent.messageId).toBe("m_1");
    expect(actionEvent.threadId).toBe("messenger:user-1");
  });
});
