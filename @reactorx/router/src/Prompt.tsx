import { useEffect, useRef } from "react";
import { useRouter } from "./RouterContext";
import { usePrevious } from "./utils";

export interface IPromptProps {
  message: string;
  when?: boolean;
}

export function Prompt({ message, when = true }: IPromptProps) {
  const { history } = useRouter();
  const prevMessage = usePrevious(message);
  const releaseRef = useRef(() => {});

  useEffect(() => {
    if (!when) {
      return;
    }

    if (prevMessage == null || prevMessage !== message) {
      releaseRef.current();
      releaseRef.current = history.block(message);
    }

    return () => {
      releaseRef.current();
    };
  });

  return null;
}
