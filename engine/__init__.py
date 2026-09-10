"""Gotham graph engine. Graph is the brain."""

__all__ = ["build_kernel"]


def __getattr__(name):
    if name == "build_kernel":
        from engine.pipeline import build_kernel

        return build_kernel
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
