'use client'

import { Link, useNavigate } from 'react-router-dom'
import {
  Popover,
  PopoverButton,
  PopoverBackdrop,
  PopoverPanel,
} from '@headlessui/react'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { NavLink } from '@/components/NavLink'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

function MobileNavLink({ href, children, onClick }) {
  const { handleNavigationClick } = useSmoothScroll();
  const navigate = useNavigate();

  const handleClick = (event) => {
    if (href.startsWith('#')) {
      handleNavigationClick(event, href.substring(1));
    } else {
      event.preventDefault();
      navigate(href);
    }
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <PopoverButton
      as="button"
      onClick={handleClick}
      className="block w-full p-3 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200 text-sm font-medium"
    >
      {children}
    </PopoverButton>
  )
}

function MobileNavIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 overflow-visible stroke-slate-700"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path
        d="M0 1H14M0 7H14M0 13H14"
        className={clsx(
          'origin-center transition',
          open && 'scale-90 opacity-0',
        )}
      />
      <path
        d="M2 2L12 12M12 2L2 12"
        className={clsx(
          'origin-center transition',
          !open && 'scale-90 opacity-0',
        )}
      />
    </svg>
  )
}

function MobileNavigation() {
  return (
    <Popover>
      <PopoverButton
        className="relative z-10 flex h-8 w-8 items-center justify-center ui-not-focus-visible:outline-none text-gray-700 hover:text-gray-900 transition-colors duration-200"
        aria-label="Toggle Navigation"
      >
        {({ open }) => <MobileNavIcon open={open} />}
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 duration-150 data-[closed]:opacity-0 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <PopoverPanel
        transition
        className="absolute inset-x-0 top-full mt-4 flex origin-top flex-col rounded-lg bg-white p-4 text-sm font-medium text-gray-700 shadow-xl ring-1 ring-gray-200 data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <MobileNavLink href="/features">Features</MobileNavLink>
        <MobileNavLink href="#testimonials">Testimonials</MobileNavLink>
        <MobileNavLink href="#pricing">Pricing</MobileNavLink>
        <hr className="m-2 border-gray-200" />
        <MobileNavLink href="/signin">Sign in</MobileNavLink>
      </PopoverPanel>
    </Popover>
  )
}

export function Header() {
  const { handleNavigationClick } = useSmoothScroll();
  const navigate = useNavigate();

  const handleNavClick = (event, elementId) => {
    handleNavigationClick(event, elementId);
  };

  const handleFeaturesClick = () => {
    navigate('/features');
  };

  return (
    <header className="bg-white py-8 shadow-sm border-b border-gray-200">
      <Container>
        <nav className="relative z-50 flex justify-between items-center">
          <div className="flex items-center md:gap-x-12">
            <Link to="/" aria-label="Home">
              <Logo className="h-8 w-auto text-gray-900" />
            </Link>
            <div className="hidden md:flex md:gap-x-8">
              <button
                onClick={handleFeaturesClick}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Features
              </button>
              <button 
                onClick={(e) => handleNavClick(e, 'testimonials')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Testimonials
              </button>
              <button 
                onClick={(e) => handleNavClick(e, 'pricing')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Pricing
              </button>
            </div>
          </div>
          <div className="flex items-center gap-x-4">
            <div className="hidden md:block">
              <Button href="/signin" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200">
                Sign in
              </Button>
            </div>
            <Button href="/register" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200">
              Get started
            </Button>
            <div className="-mr-1 md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  )
}
