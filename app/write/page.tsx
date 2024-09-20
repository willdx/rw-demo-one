"use client";

import FlowChart from "./FlowChart";

export default function WritePage() {
  return (
    <div className="grid grid-cols-1 h-screen w-full md:grid-cols-2">
      <div className="bg-blue-200 overflow-auto">
        <div className="h-full w-full">
          <FlowChart />
        </div>
      </div>
      <div className="bg-green-200">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Right Column</h2>
          <p>This is the content for the right column.</p>
        </div>
      </div>
    </div>
  );
}
