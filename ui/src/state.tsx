import {
  Resource,
  Signal,
  createContext,
  createEffect,
  createResource,
  createSignal,
  useContext,
  ParentComponent,
} from "solid-js";
import { ChatThread, Profile } from "./api";
import { apiClient } from "./client";

export type AppState = {
  activeProfile: Signal<Profile | undefined>;
  activeThread: Signal<ChatThread | undefined>;
  threads: [Resource<ChatThread[]>, any];
};

const AppStateContext = createContext<AppState>();

export const AppStateProvider: ParentComponent = (props) => {
  const [activeProfile, setActiveProfile] = createSignal<Profile>();
  const [activeThread, setActiveThread] = createSignal<ChatThread>();
  const [threads, { refetch: refetchThreads }] = createResource(
    activeProfile,
    async (profile) => {
      return await apiClient.default.profileThreadsProfileProfileIdThreadsGet(
        profile.id,
      );
    },
  );
  createEffect(() => {
    const t = threads();
    if (t && t.length > 0 && !activeThread()) {
      setActiveThread(t[0]);
    }
  });
  const state: AppState = {
    activeProfile: [activeProfile, setActiveProfile],
    activeThread: [activeThread, setActiveThread],
    threads: [threads, refetchThreads],
  };
  return (
    <AppStateContext.Provider value={state}>
      {props.children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  return useContext(AppStateContext)!;
}
