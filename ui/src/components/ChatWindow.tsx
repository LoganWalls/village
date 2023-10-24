import { onMount, type Component, createSignal, For } from "solid-js";
import styles from "./ChatWindow.module.css";
import { ChatMessage, ChatMessageData, ChatMessageStylesheets } from "./ChatMessage";

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
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      while (true) {
        const {done, value} = await reader.read();
        if (done){
          break
        }
        setCurrentMessage((prev) => prev + value);
      }
    } else {
      // TODO: show errors in UI
    }
  };

  return (
    <>
    <ChatMessageStylesheets/>
    <div class={styles.ChatWindow}>
      <div class={styles.chatHistory}>
        <For each={messages()}>{(data) => <ChatMessage data={data} />}</For>
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
