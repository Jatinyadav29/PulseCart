const firstNames = [
  "Alex",
  "Avery",
  "Casey",
  "Drew",
  "Emery",
  "Finley",
  "Jordan",
  "Morgan",
  "Quinn",
  "Riley",
];

const lastNames = [
  "Adams",
  "Bennett",
  "Carter",
  "Davis",
  "Ellis",
  "Foster",
  "Griffin",
  "Hayes",
  "Parker",
  "Reed",
];

export const createUser = (index, domain = "seed.pulsecart.local") => {
  const firstName = firstNames[index % firstNames.length];
  const lastName =
    lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const suffix = String(index + 1).padStart(4, "0");
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${suffix}`;

  return {
    username,
    email: `${username}@${domain}`,
  };
};

export const createUserSample = (count, domain) =>
  Array.from({ length: count }, (_, index) => createUser(index, domain));
