import { onMount, type Component, createSignal, Accessor, For } from "solid-js";
import styles from "./App.module.css";

// TODO: replace with pydantic-generated model?
// How to handle signal?
interface ChatMessageData {
  role: "ai" | "user"
  message: Accessor<string>
}

function messageDataFromString(role: "ai" | "user", message: string): ChatMessageData{
  const [messageSignal] = createSignal(message);
  return {
    role,
    message: messageSignal
  }
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
    }
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
      }
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
        <For each={messages()}>
          {(data) => <ChatMessage data={data} />}
        </For>
        <ChatMessage data={messageDataFromString("ai", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus et cursus ligula. Donec at purus eu ante vestibulum commodo. Duis auctor luctus risus in sagittis. Suspendisse potenti. Nunc dapibus, lacus aliquet rhoncus commodo, dolor odio pharetra massa, nec efficitur eros tellus eu diam. Curabitur pellentesque vitae mi nec maximus. Maecenas sed fermentum massa, eget hendrerit sem. Nulla efficitur finibus feugiat. Vestibulum at velit in magna lobortis lacinia. Donec gravida nunc at erat sagittis cursus. Cras pretium sapien at varius sollicitudin. In hac habitasse platea dictumst. Duis at leo sit amet risus feugiat gravida vel eu lacus. Nunc semper, eros eget faucibus dignissim, dolor enim malesuada odio, vel euismod mauris orci id ante. Integer finibus leo nec orci lacinia ornare. Nulla facilisi. Vestibulum laoreet vehicula felis, non mattis enim scelerisque in. Proin nec condimentum elit, nec tempus elit. Pellentesque vel elit et nisi mollis consequat. Aliquam feugiat sed risus porta maximus. Vivamus tortor nisi, commodo a mattis eu, fermentum in purus. Vestibulum ante enim, pretium nec neque vel, hendrerit blandit augue. Donec accumsan sapien nisi, quis interdum magna commodo ut. Aliquam ut vehicula nibh. Sed feugiat id massa non cursus. Aenean vulputate sodales nisl, id sagittis sapien aliquam vel. Proin eget sapien interdum, molestie arcu eget, ullamcorper nisi. Etiam ullamcorper, lectus at luctus rutrum, sapien sapien dignissim turpis, sit amet accumsan dui mauris at odio. ")} />
        <ChatMessage data={messageDataFromString("user", "Test 1")} />
      </div>
      <InputBar sendMessage={sendMessage} />
    </div>
  );
};

export default ChatWindow;

const ChatMessage: Component<{ data: ChatMessageData }> = (
  props,
) => {
  const data = props.data
  // TODO: take in user vs. bot and format messages accordingly
  return <div classList={{
    [styles.ChatMessage]: true,
    [styles.ai]: data.role == "ai",
    [styles.user]: data.role == "user",
  }}>{data.message()}</div>;
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
