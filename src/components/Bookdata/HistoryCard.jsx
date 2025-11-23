export default function HistoryCard({ image, title, value }) {
  return (
    <div
      className="
        w-full sm:max-w-xs md:max-w-sm
        bg-white/10 backdrop-blur-md border border-white/20
        rounded-lg shadow-sm
        flex flex-col sm:flex-row items-center sm:items-center
        p-3 sm:p-4 md:p-5
        hover:shadow-[0_0_15px_rgba(255,153,51,0.3)]
        transition-all duration-300
      "
    >
      {/* Display the circular image/icon */}
      <img
        src={image}
        alt={title}
        className="
          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
          object-cover rounded-full
          mb-2 sm:mb-0
          border border-orange-400/40
        "
      />

      {/* Text container showing the value and title */}
      <div className="flex flex-col items-center sm:items-start text-white">
        {/* Highlighted numeric/stat value */}
        <h1
          className="
            font-bold
            text-xl sm:text-2xl md:text-3xl
            text-center sm:text-left
            leading-snug
            bg-gradient-to-r from-orange-400 to-violet-500 bg-clip-text text-transparent
          "
        >
          {value}
        </h1>

        {/* Label or description for the value */}
        <h2
          className="
            font-medium
            text-xs sm:text-sm md:text-base
            text-center sm:text-left
            text-gray-300
          "
        >
          {title}
        </h2>
      </div>
    </div>
  );
}