import { Briefcase } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-500" />
            <h1 className="ml-2 text-2xl font-bold text-gray-800">Tech Hire's By Shrayash and team</h1>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-gray-600 text-sm italic">
          An AI powered job listing solution made by the team. We are insight of finding solutions to overcome the problems every student has to face in today's generation. Hope so it will contribute to this society. Made with love by Shrayash and team.
        </p>
      </div>
    </header>
  );
}
