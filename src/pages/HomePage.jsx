import React from "react";
import ContinueRead from "../components/ContinueRead";
import LastRead from "../components/LastRead";
import QuoteGenerator from "../components/QuoteGenerator";

export default function HomePage() {
  return (
    // CHANGED: Removed 'h-full' and 'overflow-hidden'. 
    // Added 'min-h-screen' and 'overflow-y-auto' to allow scrolling.
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] grid-rows-[350px_auto] [grid-template-areas:'quote''last''continue'] lg:[grid-template-areas:'quote_last''continue_continue'] gap-6 p-6 overflow-y-auto">
       <QuoteGenerator />
       <LastRead />
       <ContinueRead />
    </div>
  );
}