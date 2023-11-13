import { Component, For, createSignal } from "solid-js";
import "./SideBar.css";
import { apiClient } from "../client";
import { useAppState } from "../state";

export const SideBar: Component = () => {
  const [open, setOpen] = createSignal(false);
  const {
    activeProfile: [activeProfile],
    activeThread: [activeThread, setActiveThread],
    threads: [threads, refetchThreads],
  } = useAppState();
  const newThread = async () => {
    await apiClient.default.newThreadThreadsNewPost({
      profile_id: activeProfile()!.id,
    });
    await refetchThreads();
  };
  return (
    <div class="side-bar-container">
      <div classList={{ "side-bar": true, open: open() }}>
        <div class="threads-header">Threads</div>
        <For each={threads()}>
          {(t) => (
            <div
              classList={{
                thread: true,
                selected: t.id === activeThread()?.id,
              }}
              onClick={() => setActiveThread(t)}
            >
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="thread-icon"
              >
                <path
                  fillRule="evenodd"
                  d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.783.783 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
                  clipRule="evenodd"
                />
              </svg>
              {t.name}
            </div>
          )}
        </For>
        <div
          onClick={newThread}
          class="thread"
          style="justify-content: center;"
        >
          +
        </div>
      </div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        classList={{ "side-bar-button": true, open: open() }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="side-bar-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
    </div>
  );
};
