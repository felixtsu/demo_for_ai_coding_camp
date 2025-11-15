import Link from 'next/link'

const footerLinks = {
  useCases: [
    'UI design',
    'UX design',
    'Wireframing',
    'Diagramming',
    'Brainstorming',
    'Online whiteboard',
    'Team collaboration',
  ],
  explore: [
    'Design',
    'Prototyping',
    'Development features',
    'Design systems',
    'Collaboration features',
    'Design process',
    'FigJam',
  ],
  resources: [
    'Blog',
    'Best practices',
    'Colors',
    'Color wheel',
    'Support',
    'Developers',
    'Resource library',
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-[#D9D9D9] bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap gap-4 px-8 pb-40 pt-8">
        <div className="flex w-[262px] flex-col gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E1E1E] text-sm font-semibold text-white">
            AI
          </div>
        </div>

        <div className="flex w-[262px] flex-col gap-3">
          <h3 className="pb-4 text-base font-semibold leading-[1.4] text-[#1E1E1E]">Use cases</h3>
          {footerLinks.useCases.map((link) => (
            <Link
              key={link}
              href="/"
              className="text-base font-normal leading-[1.4] text-[#1E1E1E] hover:underline"
            >
              {link}
            </Link>
          ))}
        </div>

        <div className="flex w-[262px] flex-col gap-3">
          <h3 className="pb-4 text-base font-semibold leading-[1.4] text-[#1E1E1E]">Explore</h3>
          {footerLinks.explore.map((link) => (
            <Link
              key={link}
              href="/"
              className="text-base font-normal leading-[1.4] text-[#1E1E1E] hover:underline"
            >
              {link}
            </Link>
          ))}
        </div>

        <div className="flex w-[262px] flex-col gap-3">
          <h3 className="pb-4 text-base font-semibold leading-[1.4] text-[#1E1E1E]">Resources</h3>
          {footerLinks.resources.map((link) => (
            <Link
              key={link}
              href="/"
              className="text-base font-normal leading-[1.4] text-[#1E1E1E] hover:underline"
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

