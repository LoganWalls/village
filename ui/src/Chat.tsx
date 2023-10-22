import { onMount, type Component, createSignal, Accessor, For } from "solid-js";
import styles from "./App.module.css";
import DOMPurify from "dompurify";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

// Configure marked to highlight code
const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

const codeExample = `
Sure, here's an example code snippet that implements a simple Hello World web service using Axum:
\`\`\`rust
use axum::{routing::get, Json};
use serde_json::json;

#[derive(Debug)]
struct MyResponse {
    message: String,
}

#[tokio::main]
async fn main() {
    let app = get("/", |_| {
        async move {
            Ok(Json(MyResponse {
                message: "Hello World!".to_string(),
            }))
        }
    });

    axum::Server::bind("127.0.0.1:3000")
        .serve(app.into_make_service())
        .await
        .unwrap();
}
\`\`\`
In this example, we're using the \`get()\` function to define a route that responds to GET requests on the root path (i.e., \`/\`). The implementation of this route is an asynchronous closure that returns a JSON-encoded response containing a message. We're then creating an Axum server and serving it on localhost:3000. Let me know if you have any questions or need further assistance!
`;

// TODO: replace with pydantic-generated model?
// How to handle signal?
interface ChatMessageData {
  role: "ai" | "user";
  message: Accessor<string>;
}

function messageDataFromString(
  role: "ai" | "user",
  message: string,
): ChatMessageData {
  const [messageSignal] = createSignal(message);
  return {
    role,
    message: messageSignal,
  };
}

const ChatWindow: Component = () => {
  // NOTE: We use column-reverse to handle automatic scrolling
  // when we display messages, so they are ordered as most-recent first.
  const [messages, setMessages] = createSignal<ChatMessageData[]>([]);
  const sendMessage = async (message: string) => {
    const [sentMessage] = createSignal(message);
    const sentData: ChatMessageData = {
      role: "user",
      message: sentMessage,
    };
    setMessages((prev) => [sentData, ...prev]);

    const response = await fetch("http://localhost:8000/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });
    if (response.ok && response.body) {
      const [currentMessage, setCurrentMessage] = createSignal("");
      const currentData: ChatMessageData = {
        role: "ai",
        message: currentMessage,
      };
      setMessages((prev) => [currentData, ...prev]);

      // Type-casts are a work-around for typescript limitation:
      // https://github.com/microsoft/TypeScript/issues/29867
      const stream = response.body.pipeThrough(
        new TextDecoderStream(),
      ) as unknown as AsyncIterable<string>;
      for await (const chunk of stream) {
        setCurrentMessage((prev) => prev + chunk);
      }
    } else {
      // TODO: show errors in UI
    }
  };
  // createEffect(() => console.log(messages()));
  return (
    <div class={styles.ChatWindow}>
      <div class={styles.chatHistory}>
        <For each={messages()}>{(data) => <ChatMessage data={data} />}</For>
        <ChatMessage
          data={messageDataFromString("ai", codeExample)}
        />
        <ChatMessage data={messageDataFromString("user", "Can you write a hello world in rust using axum?")} />
      </div>
      <InputBar sendMessage={sendMessage} />
    </div>
  );
};

export default ChatWindow;

const ChatMessage: Component<{ data: ChatMessageData }> = (props) => {
  const role = props.data.role;
  const markdown = () => {
    const message = props.data
      .message()
      // Remove zero-width characters that mess with marked
      .replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
    return DOMPurify.sanitize(marked.parse(message));
  };
  return (
    <div
      classList={{
        [styles.ChatMessage]: true,
        [styles.ai]: role == "ai",
        [styles.user]: role == "user",
      }}
      innerHTML={markdown()}
    ></div>
  );
};

const InputBar: Component<{ sendMessage: (m: string) => void }> = (props) => {
  // Auto-adjust the size of the text-area
  function autosize(element: HTMLTextAreaElement) {
    element.style.height = "0";
    element.style.height = element.scrollHeight + "px";
  }
  // Set the initial size on load.
  onMount(() => {
    let el = document.querySelector(".text-input");
    if (el !== null) {
      autosize(el as HTMLTextAreaElement);
    }
  });

  const [content, setContent] = createSignal("");
  let sendButtonRef: HTMLButtonElement | undefined;
  let textInputRef: HTMLTextAreaElement | undefined;
  return (
    <div class={styles.InputBar}>
      <textarea
        ref={textInputRef}
        rows="1"
        cols="80"
        placeholder="Type something here..."
        class={styles.textInput}
        name="message"
        onInput={(e) => {
          autosize(e.target);
          setContent(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendButtonRef) return;
            sendButtonRef.click();
          }
        }}
      ></textarea>
      <button
        ref={sendButtonRef}
        class={styles.textSendButton}
        type="submit"
        onClick={() => {
          props.sendMessage(content());
          if (!textInputRef) return;
          textInputRef.value = "";
          setContent("");
        }}
        disabled={content() == ""}
      >
        <div class={styles.textSendIcon}></div>
      </button>
    </div>
  );
};
