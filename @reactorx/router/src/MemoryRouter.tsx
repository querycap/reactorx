import React, { ReactNode, useState } from "react";
import { Router } from "./Router";
import { createMemoryHistory, MemoryHistoryBuildOptions } from "history";

export interface IMemoryRouterProps extends MemoryHistoryBuildOptions {
  children: ReactNode;
}

export function MemoryRouter({ children, ...opts }: IMemoryRouterProps) {
  const [history] = useState(() => createMemoryHistory(opts));

  return <Router history={history} children={children} />;
}
