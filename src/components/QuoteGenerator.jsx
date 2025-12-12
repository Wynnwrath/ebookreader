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
      setQuote("Never give up on your dreams.");
      setAuthor("Unknown");
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
    // [grid-area:quote] matches HomePage.
    <div className="[grid-area:quote] w-full h-full p-2">
      
      <div className="
        relative w-full h-full 
        rounded-2xl overflow-hidden 
        shadow-lg shadow-black/20
        border border-white/10
        group
      ">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col p-6 sm:p-8">
          
          {/* Tag */}
          <div className="w-full flex justify-start">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
              Quote Today
            </span>
          </div>

          {/* Text Centered */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            {loading ? (
              <p className="text-white/50 animate-pulse">Loading...</p>
            ) : (
              <>
                <p className="font-serif text-xl sm:text-2xl md:text-3xl text-white leading-relaxed drop-shadow-lg max-w-2xl">
                  “{quote}”
                </p>
                <div className="w-12 h-1 bg-blue-500 rounded-full my-4 opacity-50" />
                <p className="text-gray-300 italic text-sm sm:text-base">
                  — {author}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}