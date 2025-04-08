import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-r from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-6 animate-in fade-in duration-1000">
          Welcome to <span className="text-indigo-600">AnythingInAnyKeys</span>
        </h1>

        <p className="mt-3 text-2xl text-gray-600 mb-8 animate-in fade-in duration-1000 delay-300">
          Your personal key management solution.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full animate-in fade-in duration-1000 delay-500">
          {/* ここに機能紹介などのカードを追加できます */}
          <div className="p-6 mt-6 text-left border w-96 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
            <h3 className="text-2xl font-bold text-indigo-700">Secure Storage &rarr;</h3>
            <p className="mt-4 text-lg text-gray-500">
              Safely store and manage your API keys and other sensitive credentials.
            </p>
          </div>

          <div className="p-6 mt-6 text-left border w-96 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
            <h3 className="text-2xl font-bold text-indigo-700">Easy Access &rarr;</h3>
            <p className="mt-4 text-lg text-gray-500">
              Access your keys whenever you need them, securely and quickly.
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
