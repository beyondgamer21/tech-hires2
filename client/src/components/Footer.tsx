import { Briefcase } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white mt-12">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <h2 className="ml-2 text-xl font-bold text-gray-800">Tech Hire's By Shrayash and team</h2>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
