'use client'

import { useState } from 'react'
import { HeroSection } from '@/app/components/hero-section'
import { Footer } from '@/app/components/footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <HeroSection title="Contact" subtitle="Get in touch with us" />
      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-16 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1E1E1E]">
            Get in touch
          </h2>
          <p className="text-xl font-normal leading-[1.2] text-[#757575]">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] focus:border-[#1E1E1E] focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] focus:border-[#1E1E1E] focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-base font-semibold leading-[1.4] text-[#1E1E1E]">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="rounded-lg border border-[#D9D9D9] bg-white px-4 py-3 text-base font-normal text-[#1E1E1E] focus:border-[#1E1E1E] focus:outline-none"
                placeholder="Your message"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-3 text-base font-normal text-white transition hover:bg-[#1E1E1E]"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  )
}

