import { useState, useEffect } from "react";
import backgroundImage from "../images/quotebackground.jpg";

export default function QuoteGenerator() {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://quotes-api-self.vercel.app/quote");
      const data = await response.json();

      localStorage.setItem("quoteData", JSON.stringify(data));

      setQuote(data.quote);
      setAuthor(data.author);
    } catch (error) {
      console.error("Error fetching quote:", error);
      setQuote("Failed to load quote. Try again!");
      setAuthor("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedQuote = localStorage.getItem("quoteData");

    if (storedQuote) {
      const data = JSON.parse(storedQuote);
      setQuote(data.quote);
      setAuthor(data.author);
    } else {
      fetchQuote();
    }
  }, []);

  return (
    <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
      {/* Tag */}
      <div
        className="absolute top-6 left-6 sm:top-8 sm:left-8 md:top-10 md:left-10 
                   bg-blue-600 text-white px-3 sm:px-4 py-1 rounded-full 
                   text-xs sm:text-sm md:text-base font-semibold italic 
                   shadow-md shadow-black/40 z-20"
      >
        Quote Today
      </div>

      {/* Quote Box */}
      <div
        className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-lg "
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-10 text-stellar-light z-10">
          {loading ? (
            <p className="text-lg sm:text-xl md:text-2xl animate-pulse text-stellar-glow">
              Loading...
            </p>
          ) : (
            <>
              <p
                className="font-semibold mb-4 
                           text-[clamp(1rem,4vw,2.2rem)] 
                           leading-relaxed text-white drop-shadow-lg"
              >
                “{quote}”
              </p>
              <p className="italic text-[clamp(0.8rem,2.5vw,1.2rem)] text-stellar-glow/80">
                — {author}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
