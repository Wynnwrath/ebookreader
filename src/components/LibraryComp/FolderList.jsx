import FolderItem from "./FolderItem";

export default function FolderList({ folders, toggleExpand }) {
  return (
    <>
      {folders.map((folder, index) => (
        <FolderItem
          key={index}
          folder={folder}
          index={index}
          toggleExpand={toggleExpand}
        />
      ))}
    </>
  );
}
