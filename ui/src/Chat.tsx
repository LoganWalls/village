import { onMount, type Component, createSignal, Accessor, For } from "solid-js";
import styles from "./App.module.css";

const ChatWindow: Component = () => {
  const [messages, setMessages] = createSignal<Accessor<string>[]>([]);
  const sendMessage = async (message: string) => {
    const [sentMessage] = createSignal(message);
    setMessages((prev) => [...prev, sentMessage]);

    const response = await fetch("http://localhost:8000/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });
    if (response.ok && response.body) {
      const [currentMessage, setCurrentMessage] = createSignal("");
      setMessages((prev) => [...prev, currentMessage]);
      
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
        <ChatMessage message="Hi! Testing"/>
        <ChatMessage message="Hi! Testing 2"/>
        <For each={messages()}>{(m) => <ChatMessage message={m()} />}</For>
      </div>
      <InputBar sendMessage={sendMessage} />
    </div>
  );
};

export default ChatWindow;

const ChatMessage: Component<{ message: string }> = (props) => {
  // TODO: take in user vs. bot and format messages accordingly
  return <div class={styles.ChatMessage}>{props.message}</div>;
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
          if (e.key === "Enter" && !e.shiftKey){
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
        }}
        disabled={content() == ""}
      >
        <div class={styles.textSendIcon}></div>
      </button>
    </div>
  );
};
