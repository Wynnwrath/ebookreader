import BookHistory from "./BookHIstory";
import BookSlider from "./BookSlider";

export default function Library() {
  const continueReading = [
    { title: "The Silent Library", author: "Arthur Gray", coverImage: "/covers/book1.jpg" },
    { title: "Midnight Pages", author: "Clara Rivers", coverImage: "/covers/book2.jpg" },
    { title: "Whispers of Ink", author: "Daniel Cross", coverImage: "/covers/book3.jpg" },
    { title: "Shadows of Knowledge", author: "Evelyn Hart", coverImage: "/covers/book4.jpg" },
    { title: "The Forgotten Tome", author: "Felix Moore", coverImage: "/covers/book5.jpg" },
    { title: "Bound by Words", author: "Grace Lin", coverImage: "/covers/book6.jpg" },
    { title: "Echoes in the Stacks", author: "Henry Vale", coverImage: "/covers/book7.jpg" },
    { title: "Paper Hearts", author: "Isabella Frost", coverImage: "/covers/book8.jpg" },
    { title: "The Last Manuscript", author: "Jacob Wilde", coverImage: "/covers/book9.jpg" },
    { title: "The Traitor’s Pen", author: "Luna Ash", coverImage: "/covers/book10.jpg" },
    { title: "Through Dust and Pages", author: "Marcus Lane", coverImage: "/covers/book11.jpg" },
    { title: "A Reader’s Dream", author: "Nora Price", coverImage: "/covers/book12.jpg" },
    { title: "Tales of the Quiet", author: "Oliver Crane", coverImage: "/covers/book13.jpg" },
    { title: "Beneath the Cover", author: "Penelope Storm", coverImage: "/covers/book14.jpg" },
    { title: "Letters from Nowhere", author: "Quinn Hale", coverImage: "/covers/book15.jpg" },
    { title: "The Margins of Time", author: "Rowan Lee", coverImage: "/covers/book16.jpg" },
    { title: "Turning Pages", author: "Sienna Clarke", coverImage: "/covers/book17.jpg" },
    { title: "Fictional Lives", author: "Theo Rivers", coverImage: "/covers/book18.jpg" },
    { title: "Chronicles of Dust", author: "Uma Winters", coverImage: "/covers/book19.jpg" },
    { title: "The Inkwell Secret", author: "Victor Snow", coverImage: "/covers/book20.jpg" },
    { title: "Lost Chapters", author: "Willow Dane", coverImage: "/covers/book21.jpg" },
    { title: "Between Lines", author: "Xander Quinn", coverImage: "/covers/book22.jpg" },
    { title: "Pages of Tomorrow", author: "Yara Bloom", coverImage: "/covers/book23.jpg" },
  ];

  const recentlyAdded = [
    { title: "New Book 1", author: "Author X", coverImage: "/covers/new1.jpg" },
    { title: "New Book 2", author: "Author Y", coverImage: "/covers/new2.jpg" }
  ];

  const favorites = [
    { title: "Fav 1", author: "Author Z", coverImage: "/covers/fav1.jpg" },
  ];

  return (
    <div className="w-full flex flex-col gap-10 items-center">
      {/* Centered BookHistory */}
      <div className="flex ">
        <BookHistory />
      </div>

      {/* Book Sliders */}
      <div className="w-full">
        <BookSlider books={continueReading} title="Continue Reading" />
        <BookSlider books={recentlyAdded} title="Recently Added" />
        <BookSlider books={favorites} title="Favorites" />
      </div>
    </div>
  );
}
