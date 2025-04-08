import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-r from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-800 mb-6 animate-in fade-in duration-1000">
          Welcome to <span className="text-indigo-600">AnythingInAnyKeys</span>
        </h1>

        <p className="mt-3 text-lg sm:text-2xl text-gray-600 mb-8 max-w-2xl animate-in fade-in duration-1000 delay-300">
          Your platform for managing, sharing, and practicing musical phrases in any key.
        </p>

        <div className="flex flex-wrap items-center justify-center max-w-4xl mt-6 sm:w-full animate-in fade-in duration-1000 delay-500">
          <div className="p-6 mt-6 text-left border w-full sm:w-96 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out mx-2">
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-700">Master Any Phrase &rarr;</h3>
            <p className="mt-4 text-md sm:text-lg text-gray-500">
              Register phrases in ABC notation and practice them transposed to all 12 keys instantly.
            </p>
          </div>

          <div className="p-6 mt-6 text-left border w-full sm:w-96 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out mx-2">
            <h3 className="text-xl sm:text-2xl font-bold text-indigo-700">Build Your Vocabulary &rarr;</h3>
            <p className="mt-4 text-md sm:text-lg text-gray-500">
              Create your personal phrase library and discover new ideas shared by other musicians.
            </p>
          </div>
        </div>

        <div className="mt-12 animate-in fade-in duration-1000 delay-700">
          <AuthButton />
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t border-gray-300 mt-12">
        <p className="text-gray-500">
          Powered by AnythingInAnyKeys
        </p>
      </footer>
    </div>
  );
}
