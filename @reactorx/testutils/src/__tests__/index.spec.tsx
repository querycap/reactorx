import { mount } from "../index";
import React, { useEffect } from "react";

function App({ count }: { count: number }) {
  useEffect(() => {
    console.log("mount");
  }, []);

  return <div>{count}</div>;
}

test("mount", async () => {
  const node = await mount(<App count={0} />);
  expect(node.innerHTML).toContain(0);

  for (let i = 1; i < 10; i++) {
    await mount(<App count={i} />, node);
    expect(node.innerHTML).toContain(i);
  }
});
