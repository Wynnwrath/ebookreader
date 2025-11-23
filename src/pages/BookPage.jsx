// src/pages/BookPage.jsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import BookHeader from "../components/BookComp/BookHeader";
import BookDetails from "../components/BookComp/BookDetails";

export default function BookPage() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const handleMenu = () => {
    AlertDialog("Menu option");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRelatedBookClick = (relatedBook) => {
    const bookId = relatedBook.id ?? encodeURIComponent(relatedBook.title);
    navigate(`/book/${bookId}`, {
      state: { book: relatedBook },
    });
  };

  // Static example - backend-friendly shape
  const fallbackBook = {
    id,
    title: "The Lost World",
    author: "Arthur Conan Doyle",
    rating: 4,
    tags: ["Adventure", "Science Fiction", "Classic"],
    coverImage: "https://m.media-amazon.com/images/I/81Bdms8XQxL.jpg",
    filePath: "/books/the-lost-world.epub",
    type: "EPUB",
    size: "1.8 MB",
    pages: 320,
    language: "English",
    publishedYear: 1912,
    synopsis:
      "Deep in the uncharted Amazon jungle, an eccentric professor claims to have discovered a plateau where prehistoric creatures still roam. Accompanied by a skeptical journalist and a small expedition team, he returns to prove his unbelievable story. Their daring journey quickly turns into a fight for survival as they encounter dinosaurs, primitive tribes, and dangers beyond imagination.",
    authorBio:
      "Sir Arthur Conan Doyle (1859–1930) was a British writer best known for creating the detective Sherlock Holmes. Beyond mysteries, he wrote historical novels, science fiction, plays, and poetry. 'The Lost World' is one of his most influential adventure stories, inspiring countless adaptations and modern dinosaur tales.",
    relatedBooks: [
      {
        id: "journey-to-the-center-of-the-earth",
        title: "Journey to the Center of the Earth",
        author: "Jules Verne",
        rating: 4,
        tags: ["Adventure", "Science Fiction"],
        coverImage:
          "https://m.media-amazon.com/images/I/81n7FMmHtPL._SL1500_.jpg",
        type: "EPUB",
        filePath: "/books/journey-to-the-center.epub",
      },
      {
        id: "twenty-thousand-leagues",
        title: "Twenty Thousand Leagues Under the Sea",
        author: "Jules Verne",
        rating: 5,
        tags: ["Adventure", "Classic"],
        coverImage:
          "https://m.media-amazon.com/images/I/81l3rZK4lnL._SL1500_.jpg",
        type: "PDF",
        filePath: "/books/20000-leagues.pdf",
      },
      {
        id: "time-machine",
        title: "The Time Machine",
        author: "H. G. Wells",
        rating: 4,
        tags: ["Science Fiction", "Classic"],
        coverImage:
          "https://m.media-amazon.com/images/I/71oM2FfF2hL._SL1360_.jpg",
        type: "MOBI",
        filePath: "/books/time-machine.mobi",
      },
    ],
  };

  const book = location.state?.book || fallbackBook;

  return (
    <div className="px-4 py-6 md:px-10 md:py-10 lg:px-20 lg:py-10 rounded-2xl min-h-full">
      <BookHeader onMenu={handleMenu} onBack={handleBack} />
      <BookDetails
        book={book}
        relatedBooks={book.relatedBooks || []}
        onRelatedBookClick={handleRelatedBookClick}
      />
    </div>
  );
}
