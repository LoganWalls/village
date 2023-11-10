import { type Component, createSignal, Accessor, JSX, For } from "solid-js";
import "./ChatMessage.css";
import DOMPurify from "dompurify";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import syntaxThemeLight from "highlight.js/styles/atom-one-light.min.css?url";
import syntaxThemeDark from "highlight.js/styles/atom-one-dark.min.css?url";
import katexStyles from "../assets/katex.min.css?url";
import { template } from "solid-js/web";

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
    const src = DOMPurify.sanitize(marked.parse(message) as string);
    let elem = template(`<div>${src}</div>`) as unknown as HTMLDivElement;
    elem = elem.cloneNode(true) as HTMLDivElement;
    for (const code of elem.querySelectorAll(".hljs")) {
      const codeText = code.textContent || "";
      const button = document.createElement("button");
      button.classList.add("copy-button");
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(codeText);
        setTimeout(() => button.blur(), 1000);
      });
      code.appendChild(button);
    }
    return Array.from(elem.children);
  };
  return (
    <div
      classList={{
        ["chat-message"]: true,
        ai: role == "ai",
        user: role == "user",
      }}
    >
      {markdown()}
    </div>
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
  role: "ai" | "user" | "system";
  message: Accessor<string>;
}

export function messageDataFromString(
  role: "ai" | "user" | "system",
  message: string,
): ChatMessageData {
  const [messageSignal] = createSignal(message);
  return {
    role,
    message: messageSignal,
  };
}
