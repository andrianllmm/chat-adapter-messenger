# chat-adapter-messenger

[![npm version](https://img.shields.io/npm/v/chat-adapter-messenger)](https://www.npmjs.com/package/chat-adapter-messenger)
[![npm downloads](https://img.shields.io/npm/dm/chat-adapter-messenger)](https://www.npmjs.com/package/chat-adapter-messenger)

Messenger adapter for [Chat SDK](https://chat-sdk.dev/docs).

## Installation

```bash
npm install chat chat-adapter-messenger
```

## Usage

```typescript
import { Chat } from "chat";
import { createMessengerAdapter } from "chat-adapter-messenger";

const bot = new Chat({
  userName: "mybot",
  adapters: {
    messenger: createMessengerAdapter(),
  },
});

bot.onNewMention(async (thread, message) => {
  await thread.post("Hello from Messenger!");
});
```

## Environment variables

| Variable                     | Required | Description                                              |
| ---------------------------- | -------- | -------------------------------------------------------- |
| `FACEBOOK_APP_SECRET`        | Yes      | Facebook app secret (required for Messenger integration) |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Yes      | Facebook page access token                               |
| `FACEBOOK_VERIFY_TOKEN`      | Yes      | Verification token for webhook setup                     |

## Platform setup

1. Create an app on the Facebook Developer dashboard
2. Add the Messenger use case to your app
3. Generate a Page Access Token for your Facebook Page
4. Set the webhook URL to `https://your-domain.com/api/webhooks/facebook`
5. Provide your `FACEBOOK_VERIFY_TOKEN` during webhook verification
6. Subscribe to the `messages` and `messaging_postbacks` events
7. Ensure your app is in live mode (or add test users during development)

## License

MIT
