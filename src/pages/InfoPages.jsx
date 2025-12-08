function InfoPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-gray-300 max-w-xl">{description}</p>
    </div>
  );
}

export function SettingsPage() {
  return (
    <InfoPage
      title="Settings"
      description="Adjust your reading preferences, display options, and account settings."
    />
  );
}

export function HelpPage() {
  return (
    <InfoPage
      title="Help"
      description="Find answers to common questions or contact support for further assistance."
    />
  );
}