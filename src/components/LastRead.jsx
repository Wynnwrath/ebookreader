import StarRate from '../assets/StarRate';
import ebookCover from '../images/bookCover.png';

export default function LastRead() {

  const handleContinueReading = () => {
  console.log("[LastRead] READ TODAY clicked");
  // later:
  // navigate(`/reader/${bookId}`);
  // invoke("continue_reading", { bookId });
  };

  return (
    <div className="[grid-area: last] p-4 sm:p-6 lg:p-8 flex justify-center items-center h-full">
      {/* Outer Card */}
      <div
        className="
          w-full h-auto 
          flex flex-col sm:flex-row 
          items-center sm:items-start justify-center 
          rounded-xl shadow-md 
          bg-[rgba(42,36,50,0.86)] 
          backdrop-blur-md  text-stellar-light
          border border-white/10
          p-5
          transition-all duration-300
        "
      >
        {/* Book Cover */}
        <div className="flex justify-center sm:justify-start mb-4 sm:mb-0">
          <img
            src={ebookCover}
            alt="Book cover"
            className="
              h-40 w-28
              sm:h-48 sm:w-32
              md:h-56 md:w-36
              lg:h-64 lg:w-44
              rounded-lg shadow-md object-cover
              transition-transform duration-300 hover:scale-105
            "
          />
        </div>

        {/* Book Details */}
        <div
          className="
            flex flex-col 
            gap-2 sm:gap-3 md:gap-4 
            sm:ml-4 md:ml-6 
            text-center sm:text-left 
            w-full sm:w-auto
          "
        >
          {/* Title */}
          <h1
            className="
              text-sm sm:text-base md:text-lg lg:text-xl 
              leading-snug font-medium
            "
          >
            Did you read{" "}
            <b className="whitespace-nowrap">The Lost World</b> by Arthur Conan Doyle?
          </h1>

          {/* Rating */}
          <div className="flex justify-center sm:justify-start">
            <StarRate rating={4} />
          </div>

          {/* CTA Button */}
          <div className="flex justify-center sm:justify-start mt-3 sm:mt-4">
            <button
              className="
                bg-gray-500 hover:bg-gray-600 
                flex items-center justify-center 
                h-9 sm:h-10 md:h-11 
                px-5 sm:px-8 md:px-10 
                text-xs sm:text-sm md:text-base 
                rounded-full shadow-md shadow-black/40
                w-full sm:w-auto max-w-[200px]
                transition-colors active:bg-gray-700 duration-150
              "
              onClick={handleContinueReading}
            >
              READ TODAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
