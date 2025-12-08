import { useNavigate } from "react-router-dom";
import BookHistory from "./BookHistory";
import BookSlider from "./BookSlider";

/**
 * Library
 * - Displays reading stats and several book sliders (continue reading, etc.).
 * - Uses mock data for now.
 * - `handleBookOpen` defines the navigation behavior when a book is clicked,
 *   so backend/Tauri integration or reader opening can be centralized there.
 */
export default function Library() {
  const navigate = useNavigate();

  const continueReading = [
  {
    title: "The Silent Library",
    author: "Arthur Gray",
    coverImage: "/covers/book1.jpg",
    currentPage: 120,
    pages: 350,
  },
  {
    title: "Midnight Pages",
    author: "Clara Rivers",
    coverImage: "/covers/book2.jpg",
    currentPage: 40,
    pages: 200,
  }
  ];  


  const recentlyAdded = [
    { title: "New Book 1", author: "Author X", coverImage: "/covers/new1.jpg" },
    { title: "New Book 2", author: "Author Y", coverImage: "/covers/new2.jpg" },
  ];

  const favorites = [
    { title: "Fav 1", author: "Author Z", coverImage: "/covers/fav1.jpg" },
  ];

  /**
   * Central place to handle what happens when any book is clicked
   * from any slider on the Library page.
   *
   * Right now:
   * - Logs the clicked book
   * - Navigates to `/book/:id` and passes the full book object in route state.
   *
   * Later:
   * - You can call Tauri commands here (e.g. `invoke("open_book", { ... })`)
   *   or trigger a dedicated reader view.
   */
  const handleBookOpen = (book) => {
    console.log("[Library] Clicked book:", book);

    const bookId = book.id ?? encodeURIComponent(book.title);
    navigate(`/book/${bookId}`, { state: { book } });
  };

  return (
    <div className="w-full flex flex-col gap-10 items-center">
      {/* Centered BookHistory */}
      <div className="flex">
        <BookHistory />
      </div>

      {/* Book Sliders */}
      <div className="w-full">
        <BookSlider
          books={continueReading}
          title="Continue Reading"
          onBookClick={handleBookOpen}
        />
        <BookSlider
          books={recentlyAdded}
          title="Recently Added"
          onBookClick={handleBookOpen}
        />
        <BookSlider
          books={favorites}
          title="Favorites"
          onBookClick={handleBookOpen}
        />
      </div>
    </div>
  );
}
