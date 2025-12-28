import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import HowItWorks from '@/components/HowItWorks'
import LegalNotice from '@/components/LegalNotice'
import LocationSchedule from '@/components/LocationSchedule'
import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Services />
        <HowItWorks />
        <LocationSchedule />
        <Footer />
        <FloatingWhatsApp />
      </main>
    </>
  )
}

