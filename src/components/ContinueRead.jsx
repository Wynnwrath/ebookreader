import TheTraitorBook from "../images/thetraitorbook.png";
import Library from "./Bookdata/Library";

export default function ContinueRead() {
  const books = [
    { title: "Book 1", author: "Author A", coverImage: TheTraitorBook } ,
    { title: "Book 2", author: "Author B", coverImage: "/covers/book2.jpg" },
    { title: "Book 3", author: "Author C", coverImage: "/covers/book3.jpg" },
    { title: "Book 4", author: "Author D", coverImage: "/covers/book4.jpg" },
    { title: "Book 5", author: "Author E", coverImage: "/covers/book5.jpg" },
    { title: "Book 6", author: "Author F", coverImage: "/covers/book6.jpg" },
    { title: "Book 7", author: "Author G", coverImage: "/covers/book7.jpg" },
    { title: "Book 8", author: "Author H", coverImage: "/covers/book8.jpg" },
    { title: "Book 9", author: "Author I", coverImage: "/covers/book9.jpg" },
    { title: "Book 10", author: "Author J", coverImage: "/covers/book10.jpg" },
    {title: "Book 11", author: "Author K", coverImage: "/covers/book11.jpg" },
    {title: "Book 12", author: "Author L", coverImage: "/covers/book12.jpg" }
  ];
  
  return (
    <div className="h-full flex flex-col justify-between  items-center w-full flex-1 [grid-area: continue] p-4 col-span-2 row-span-1">
      <div className="w-full">
        <Library></Library>
      </div>
    </div>
  );
}