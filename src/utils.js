// utils.js
export function extractCity(address) {
    const parts = address.split(',');
    return parts.length > 1 ? parts[1].trim() : '';
  }
  