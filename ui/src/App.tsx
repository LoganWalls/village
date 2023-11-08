import {
  createSignal,
  type Component,
  Show,
  createResource,
  createEffect,
} from "solid-js";

import "./App.css";
import ChatWindow from "./components/ChatWindow";
import { ChatThread, Profile } from "./api";
import ProfileSelect from "./components/ProfileSelect";
import { apiClient } from "./client";
import { SideBar } from "./components/SideBar";

const App: Component = () => {
  const [activeProfile, setActiveProfile] = createSignal<Profile>();
  const [activeThread, setActiveThread] = createSignal<ChatThread>();
  const [threads] = createResource(activeProfile, async (profile) => {
    return await apiClient.default.profileThreadsProfileProfileIdThreadsGet(
      profile.id,
    );
  });
  createEffect(() => {
    const t = threads();
    if (t && t.length > 0 && !activeThread()) {
      setActiveThread(t[0]);
    }
  });

  return (
    <div class="app">
      <Show
        when={activeProfile()}
        fallback={<ProfileSelect setActiveProfile={setActiveProfile} />}
      >
        <SideBar threads={threads} activeThread={[activeThread, setActiveThread]} />
        <ChatWindow profile={activeProfile()!} activeThread={activeThread} />
      </Show>
    </div>
  );
};

export default App;
