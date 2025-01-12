export function shortenAddress(address, width) {
  if (!address) return '';
  
  if (width > 420) return address;
  if (width > 380) return `${address.slice(0, 15)}...${address.slice(-20)}`;
  if (width > 350) return `${address.slice(0, 13)}...${address.slice(-15)}`;
  if (width > 325) return `${address.slice(0, 11)}...${address.slice(-12)}`;
  if (width > 300) return `${address.slice(0, 9)}...${address.slice(-10)}`;
  if (width > 275) return `${address.slice(0, 7)}...${address.slice(-8)}`;
  if (width > 250) return `${address.slice(0, 6)}...${address.slice(-6)}`;
  if (width > 225) return `${address.slice(0, 4)}...${address.slice(-4)}`;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}