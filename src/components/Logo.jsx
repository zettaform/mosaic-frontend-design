import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({ className = "h-8 w-auto", linkTo = "/", ...props }) {
  const logoImage = (
    <>
      <span className="sr-only">MLG</span>
      <img
        alt="MLG"
        src="/fav3-logo-512x512.png"
        className={className}
      />
    </>
  );

  if (!linkTo) {
    return (
      <div className="-m-1.5 p-1.5" {...props}>
        {logoImage}
      </div>
    );
  }

  return (
    <Link to={linkTo} className="-m-1.5 p-1.5" {...props}>
      {logoImage}
    </Link>
  );
}

export default Logo;