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
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="copy-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      `.trim();
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
