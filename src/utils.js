// utils.js
export function extractCity(address) {
  const parts = address.split(",");
  return parts.length > 1 ? parts[1].trim() : "";
}

export function extractStreet(address) {
  const parts = address.split(",");
  const firstPart = parts.length > 1 ? parts[0].trim() : "";
  return firstPart.replace(/^\d+\s*/, "");
}

export function extractZip(address) {
  const parts = address.split(",");
  return parts.length > 1 ? parts[3].trim() : "";
}

export function parseMessage(text) {
  const userRegex = /@(\w+)/g;
  const hashTagRegex = /#(\w+)/g;

  return text
    .replace(userRegex, '<a href="/$1">@$1</a>')
    .replace(hashTagRegex, '<a href="/tag/$1">#$1</a>');
}
