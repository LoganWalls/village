import {
  onMount,
  type Component,
  createSignal,
  For,
  createResource,
  createEffect,
} from "solid-js";
import styles from "./ChatWindow.module.css";
import {
  ChatMessage,
  ChatMessageData,
  ChatMessageStylesheets,
  messageDataFromString,
} from "./ChatMessage";
import { ChatThread, Profile } from "../api";
import { apiClient } from "../client";

const ChatWindow: Component<{
  profile: Profile;
  thread: ChatThread;
}> = (props) => {
  const { profile, thread } = props;
  // NOTE: We use column-reverse to handle automatic scrolling
  // when we display messages, so they are ordered as most-recent first.
  const [messages, setMessages] = createSignal<ChatMessageData[]>([]);
  const [history] = createResource<ChatMessageData[]>(async () => {
    const response =
      await apiClient.default.threadHistoryThreadThreadIdHistoryGet(thread.id);
    return response
      .map((m) => messageDataFromString(m.role, m.content))
      .reverse();
  });
  createEffect(() => {
    const h = history();
    if (h) {
      setMessages(h);
    }
  });

  const sendMessage = async (message: string) => {
    const [sentMessage] = createSignal(message);
    const sentData: ChatMessageData = {
      role: "user",
      message: sentMessage,
    };
    setMessages((prev) => [sentData, ...prev]);
    // TODO: use apiClient for this request once we figure out
    // how to specify streaming responses in the schema
    const response = await fetch("http://localhost:8000/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: profile.id,
        thread_id: thread.id,
        message: message,
      }),
    });
    if (response.ok && response.body) {
      const [currentMessage, setCurrentMessage] = createSignal("");
      const currentData: ChatMessageData = {
        role: "ai",
        message: currentMessage,
      };
      setMessages((prev) => [currentData, ...prev]);
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        for (let char of value) {
          setCurrentMessage((prev) => prev + char);
        }
      }
    } else {
      // TODO: show errors in UI
    }
  };

  return (
    <>
      <ChatMessageStylesheets />
      <div class={styles.ChatWindow}>
        <div class={styles.chatHistory}>
          <For each={messages().filter((m) => m.role !== "system")}>
            {(data) => <ChatMessage data={data} />}
          </For>
        </div>
        <InputBar sendMessage={sendMessage} />
      </div>
    </>
  );
};

export default ChatWindow;

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
          autosize(textInputRef);
        }}
        disabled={content() == ""}
      >
        <div class={styles.textSendIcon}></div>
      </button>
    </div>
  );
};
