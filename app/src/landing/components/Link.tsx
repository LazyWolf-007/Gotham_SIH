import React from "react";

export default function Link({ href, children, className, onClick, ...props }: any) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    // If it's a relative link or CTA button, trigger navigation to the main workbench
    if (href === "/workbench" || href === "#link" || href === "#" || href === "/register") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("navigate-workbench"));
    }
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
