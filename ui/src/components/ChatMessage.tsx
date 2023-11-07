import { type Component, createSignal, Accessor } from "solid-js";
import styles from "./ChatMessage.module.css";
import DOMPurify from "dompurify";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import syntaxThemeLight from "highlight.js/styles/atom-one-light.min.css?url";
import syntaxThemeDark from "highlight.js/styles/atom-one-dark.min.css?url";
import katexStyles from "../assets/katex.min.css?url";

// Configure marked to highlight code
const marked = new Marked(
  // Put katex before highlight so that it can catch ```latex code blocks.
  markedKatex({
    throwOnError: false,
  }),
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

export const ChatMessage: Component<{ data: ChatMessageData }> = (props) => {
  const role = props.data.role;
  const markdown = () => {
    const message = props.data
      .message()
      // Remove zero-width characters that mess with marked
      .replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, "");
    return DOMPurify.sanitize(marked.parse(message) as string);
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

// Stylesheets required for math redering / syntax highlighting
export const ChatMessageStylesheets: Component = () => {
  return (
    <>
      <link rel="stylesheet" href={katexStyles} />
      <link
        rel="stylesheet"
        href={syntaxThemeLight}
        media="screen and (prefers-color-scheme: light)"
      />
      <link
        rel="stylesheet"
        href={syntaxThemeDark}
        media="screen and (prefers-color-scheme: dark)"
      />
    </>
  );
};

export interface ChatMessageData {
  role: "ai" | "user";
  message: Accessor<string>;
}

export function messageDataFromString(
  role: "ai" | "user",
  message: string,
): ChatMessageData {
  const [messageSignal] = createSignal(message);
  return {
    role,
    message: messageSignal,
  };
}
