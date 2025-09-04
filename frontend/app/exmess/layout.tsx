import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen bg-neutral-200 overflow-hidden p-2">
      <main className="">{children}</main>
    </div>
  );
};

export default layout;
