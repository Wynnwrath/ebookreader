import React from "react";
import HistoryCard from "./HistoryCard";
import BookStackImg from "../../images/bookstack.png";
import BookAuthor from "../../images/bookAuthor.png";
import Reading from "../../images/Reading.png";

{/* BookHistory Component to display reading statistics */}
export default function BookHistory() {
  return (
    <div className="w-full flex gap-10">
      <HistoryCard image={BookStackImg} value={25} title={"Read Books"}/>
      <HistoryCard image={BookAuthor} value={6} title={"Read Authors"}/>
      <HistoryCard image={Reading} value={36} title={"Reading"}/>
    </div>
  );
}

