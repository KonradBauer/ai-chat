import { useState } from "react";
import { ChatLayout } from "@/components/chat/chat-layout";
import { LaunchAnimation } from "@/components/launch-animation";

export function App() {
  const [launched, setLaunched] = useState(false);

  return (
    <>
      <ChatLayout />
      {!launched && <LaunchAnimation onComplete={() => setLaunched(true)} />}
    </>
  );
}
