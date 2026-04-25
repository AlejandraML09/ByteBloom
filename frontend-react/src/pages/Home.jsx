import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { HeroSection } from '../components/home/HeroSection'
import { ServicesGrid } from '../components/home/ServicesGrid'
import { CtaBanner } from '../components/home/CtaBanner'
import '../css/home.css'

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <HeroSection />
      <ServicesGrid />
      <CtaBanner />
      <Footer />
    </div>
  )
}
