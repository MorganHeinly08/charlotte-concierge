export default function Home() {
  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #0f62fe 0%, #161616 100%)'}}>
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#1192e8] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-6xl font-bold text-white mb-2">
            Charlotte Concierge
          </h1>
          <p className="text-2xl text-gray-100">
            Your guide to the Queen City 👑
          </p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-[#21272a] rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎉 Welcome to Charlotte Concierge!
          </h2>
          <p className="text-gray-300 text-xl">
            Your app is running with IBM Carbon Dark Blue theme!
          </p>
        </div>
      </main>
    </div>
  )
}