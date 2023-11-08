import { createSignal, type Component, Show, createResource, createEffect } from "solid-js";

import "./App.css";
import ChatWindow from "./components/ChatWindow";
import { ChatThread, Profile } from "./api";
import ProfileSelect from "./components/ProfileSelect";
import { apiClient } from "./client";

const App: Component = () => {
  const [activeProfile, setActiveProfile] = createSignal<Profile>();
  const [activeThread, setActiveThread] = createSignal<ChatThread>();
  const [threads] = createResource(activeProfile, async (profile) => {
    return await apiClient.default.profileThreadsProfileProfileIdThreadsGet(profile.id);
  });
  createEffect(() => {
    const t = threads();
    if (t && t.length > 0 && !activeThread()) {
      setActiveThread(t[0]);
    }
  })


  return (
    <div class="app">
      <Show when={activeProfile()} fallback={<ProfileSelect setActiveProfile={setActiveProfile}/>}>
        <Show when={activeThread()} fallback={<p>Loading</p>}>
          <ChatWindow profile={activeProfile()!} thread={activeThread()!} />
        </Show>
      </Show>
    </div>
  );
};

export default App;
