import { useCallback, useRef } from 'react';

export function useInfiniteScroll(onLoadMore) {
  const observer = useRef(null);
  
  const lastElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMore();
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [onLoadMore]);

  return lastElementRef;
}