import { useEffect, useRef } from 'react';

export function useAutoScroll(dependency) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    // Scroll on mount and when content changes
    scrollToBottom();

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(scrollToBottom);
    
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => {
      if (scrollRef.current) {
        resizeObserver.unobserve(scrollRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [dependency]);

  return scrollRef;
}