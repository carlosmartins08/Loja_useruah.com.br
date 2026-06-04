export interface AddressBookEntry {
  id: string;
  label: string;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  source: 'saved' | 'order';
}

export interface ShippingAddressInput {
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  city: string;
  state: string;
  country: string;
}

const STORAGE_PREFIX = 'ruah_address_book';

export function addressStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readAddressBook(userId: string): AddressBookEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(addressStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AddressBookEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAddressBook(userId: string, addresses: AddressBookEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(addressStorageKey(userId), JSON.stringify(addresses));
}

export function toAddressBookEntry(
  input: ShippingAddressInput,
  options?: Partial<Pick<AddressBookEntry, 'id' | 'label' | 'isDefault' | 'source'>>
): AddressBookEntry {
  return {
    id: options?.id ?? crypto.randomUUID(),
    label: options?.label ?? 'Endereco salvo',
    recipientName: input.recipientName,
    cep: input.cep,
    street: input.street,
    number: input.number,
    city: input.city,
    state: input.state,
    country: input.country,
    isDefault: options?.isDefault ?? false,
    source: options?.source ?? 'saved',
  };
}

export function toShippingAddress(entry: AddressBookEntry): ShippingAddressInput {
  return {
    recipientName: entry.recipientName,
    cep: entry.cep,
    street: entry.street,
    number: entry.number,
    city: entry.city,
    state: entry.state,
    country: entry.country,
  };
}

export function formatAddressLine(entry: Pick<AddressBookEntry, 'street' | 'number' | 'city' | 'state' | 'cep'>) {
  return `${entry.street}, ${entry.number} • ${entry.city}/${entry.state} • ${entry.cep}`;
}

export function dedupeAddresses(addresses: AddressBookEntry[]) {
  const seen = new Set<string>();
  return addresses.filter((entry) => {
    const key = [
      entry.recipientName.trim().toLowerCase(),
      entry.cep.trim().toLowerCase(),
      entry.street.trim().toLowerCase(),
      entry.number.trim().toLowerCase(),
      entry.city.trim().toLowerCase(),
      entry.state.trim().toLowerCase(),
      entry.country.trim().toLowerCase(),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
