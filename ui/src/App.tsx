import { createSignal, type Component, Show } from "solid-js";

import styles from "./App.module.css";
import ChatWindow from "./components/ChatWindow";
import { Profile } from "./api";
import ProfileSelect from "./components/ProfileSelect";

const App: Component = () => {
  const [activeProfile, setActiveProfile] = createSignal<Profile>();
  return (
    <div class={styles.App}>
      <Show when={activeProfile()} fallback={<ProfileSelect setActiveProfile={setActiveProfile}/>}>
        <ChatWindow activeProfile={activeProfile()!} />
      </Show>
    </div>
  );
};

export default App;
