import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-base-100">
      <Hero />
      <Features />
      <Footer />
    </main>
  )
}
