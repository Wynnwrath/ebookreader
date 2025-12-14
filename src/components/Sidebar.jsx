import {
  IoHomeOutline,
  IoSettingsOutline,
  IoBook,
  IoLibraryOutline,
} from "react-icons/io5";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { RiExpandRightLine, RiExpandLeftLine } from "react-icons/ri";
import { NavLink } from "react-router-dom";

export default function Sidebar({ isExpanded, setIsExpanded }) {
  const navItems = [
    { icon: <IoHomeOutline size={25} />, label: "Home", path: "/home" },
    { icon: <IoLibraryOutline size={25} />, label: "Library", path: "/library" },
  ];

  return (
    <aside
      className={`
        /* This now uses your exact rgba(49,40,61,0.86) tint */
        bg-sidebar 
        backdrop-blur-md         
        text-text
        p-4 flex flex-col justify-between
        transition-all duration-300 h-full
        border-r border-border
      `}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center pt-4 transition-all duration-300 ${
          isExpanded ? "justify-start" : "justify-center"
        }`}
      >
        <IoBook size={36} className="text-text-dim" />
        {isExpanded && (
          <span className="text-xl font-semibold ml-3 text-text tracking-wide">
            Stellaron
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col mt-10 gap-3">
        {navItems.map(({ icon, label, path }, i) => (
          <NavLink
            key={i}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-md transition-all duration-200
              ${
                isActive
                  ? "bg-glass text-primary shadow-sm"
                  : "text-text-dim hover:text-primary hover:bg-glass"
              }
              ${isExpanded ? "justify-start" : "justify-center"}`
            }
          >
            {icon}
            {isExpanded && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse / Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center p-2 rounded-md hover:bg-glass transition-all duration-300 ${
          isExpanded ? "justify-start" : "justify-center"
        } text-text-dim hover:text-primary`}
      >
        {isExpanded ? (
          <RiExpandLeftLine size={26} />
        ) : (
          <RiExpandRightLine size={26} />
        )}
        {isExpanded && <span className="ml-2 text-sm font-medium">Collapse</span>}
      </button>
    </aside>
  );
}