export function useRouter() {
  return {
    push: (url: string) => {
      if (url === "/workbench") {
        window.dispatchEvent(new CustomEvent("navigate-workbench"));
      } else {
        window.history.pushState(null, "", url);
      }
    },
    replace: (url: string) => {
      window.history.replaceState(null, "", url);
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
  };
}

export function useSearchParams() {
  return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
}

export function usePathname() {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}
