import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-gray-200 dark:text-gray-800">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
          Page not found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-6">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
