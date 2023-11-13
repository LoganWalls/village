import { type Component, Show } from "solid-js";

import "./App.css";
import ChatWindow from "./components/ChatWindow";
import ProfileSelect from "./components/ProfileSelect";
import { SideBar } from "./components/SideBar";
import { useAppState } from "./state";

const App: Component = () => {
  const state = useAppState();
  const [activeProfile, setActiveProfile] = state.activeProfile;
  return (
    <div class="app">
      <Show
        when={activeProfile()}
        fallback={<ProfileSelect setActiveProfile={setActiveProfile} />}
      >
        <SideBar />
        <ChatWindow />
      </Show>
    </div>
  );
};

export default App;
