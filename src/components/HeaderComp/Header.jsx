import { IoIosSearch } from "react-icons/io";
import HeaderRight from "./HeaderRight";

export default function Header() {
  return (
    <header
      className="
        w-full 
        bg-[rgb(26,20,34)] 
        backdrop-blur-md   
        flex items-center px-6 py-4 
        shadow-stellar-violet border-b border-white/10
      "
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-3xl ml-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => console.log("[Search] Query:", e.target.value)}
            className="
              w-full p-2 pl-10 rounded-full 
              bg-white/10 text-white placeholder-stellar-dim 
              backdrop-blur-md 
              focus:ring-2 focus:ring-stellar-glow 
              focus:outline-none 
              transition-all duration-200
            "
          />
          <IoIosSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-white/80 text-xl" />
        </div>
      </div>

      {/* Right Side */}
      <HeaderRight />
    </header>
  );
}
