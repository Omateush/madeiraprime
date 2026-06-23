import React from 'react'
import './App.css'
import { LanguageProvider } from './contexts/LanguageContext'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Proprietarios from './components/Proprietarios'
import Testimonials from './components/Testimonials'
import Investidores from './components/Investidores'
import ProjetosInvestimento from './components/ProjetosInvestimento'
import Galeria from './components/Galeria'
import Garantia from './components/Garantia'
import Imoveis from './components/Imoveis'
import Booking from './components/Booking'
import Footer from './components/Footer'
import AdminPanel from './components/AdminPanel'
import BookingSuccess from './components/BookingSuccess'
import BookingCancelled from './components/BookingCancelled'

const params   = new URLSearchParams(window.location.search)
const pathname = window.location.pathname
const isAdmin     = params.has('admin')
const isSuccess   = pathname === '/success' || params.has('success')
const isCancelled = pathname === '/cancel'  || params.has('cancelled')

export default function App() {
  if (isAdmin)     return <AdminPanel />
  if (isSuccess)   return <BookingSuccess />
  if (isCancelled) return <BookingCancelled />

  return (
    <LanguageProvider>
      <div className="app">
        <Navbar />
        <main>
          <Hero />
          <Stats />
          <Proprietarios />
          <Testimonials />
          <Investidores />
          <ProjetosInvestimento />
          {/* <Galeria /> */}
          <Garantia />
          <Imoveis />
          <Booking />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  )
}
