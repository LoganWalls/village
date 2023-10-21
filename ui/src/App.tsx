import { type Component } from "solid-js";

import styles from "./App.module.css";
import ChatWindow from "./Chat";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <ChatWindow/>
    </div>
  );
};

export default App;
