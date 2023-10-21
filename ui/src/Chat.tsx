import { onMount, type Component } from "solid-js";
import styles from "./App.module.css";

const ChatWindow: Component = () => {
  return (
    <div class={styles.ChatWindow}>
      <InputBar />
    </div>
  );
};

export default ChatWindow;

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

  return (
    <div class={styles.InputBar}>
      <textarea
        rows="1"
        cols="80"
        placeholder="Type something here..."
        class={styles.textInput}
        name="message"
        onInput={(e) => autosize(e.target)}
      ></textarea>
      <button class={styles.textSendButton} type="submit">
        <div class={styles.textSendIcon}></div>
      </button>
    </div>
  );
};
