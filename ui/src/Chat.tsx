import { onMount, type Component, createSignal, Accessor } from "solid-js";
import styles from "./App.module.css";

const ChatWindow: Component = () => {
  const [messages, setMessages] = createSignal<any[]>([]);
  return (
    <div class={styles.ChatWindow}>
      <MessageHistory messages={messages} />
      <InputBar />
    </div>
  );
};

export default ChatWindow;

const MessageHistory: Component<{ messages: Accessor<any[]> }> = (props) => {
  return <div>{props.messages().toString()}</div>;
};

const InputBar: Component = () => {
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

  return (
    <div class={styles.InputBar}>
      <textarea
        rows="1"
        cols="80"
        placeholder="Type something here..."
        class={styles.textInput}
        name="message"
        onInput={(e) => {
          autosize(e.target);
          setContent(e.target.value);
        }}
      ></textarea>
      <button
        class={styles.textSendButton}
        type="submit"
        disabled={content() == ""}
      >
        <div class={styles.textSendIcon}></div>
      </button>
    </div>
  );
};
