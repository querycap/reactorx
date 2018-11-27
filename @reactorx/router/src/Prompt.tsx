import { useEffect, useRef } from "react";
import { useRouterContext } from "./RouterContext";
import { usePrevious } from "./utils";

export interface IPromptProps {
  message: string;
  when: boolean;
}

export function Prompt({ message, when = true }: IPromptProps) {
  const { history } = useRouterContext();
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
