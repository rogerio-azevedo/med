/**
 * Geocoding via HERE API (server-side only).
 * Use this in services/actions instead of calling /api/geocode via HTTP.
 */

export interface AddressInput {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

interface HereDiscoverItem {
    position: { lat: number; lng: number };
}

interface HereDiscoverApiResponse {
    items?: HereDiscoverItem[];
}

function buildAddressQuery(data: AddressInput): string {
    let query = "";
    if (data.street) query += data.street;
    if (data.number) query += `, ${data.number}`;
    if (data.neighborhood) query += `, ${data.neighborhood}`;
    if (data.city) query += ` - ${data.city}`;
    if (data.state) query += `, ${data.state}`;
    if (data.zipCode) query += `, ${data.zipCode}`;
    return query;
}

/**
 * Geocodes an address using HERE API. Returns lat/lng or null if not found.
 */
export async function geocodeAddress(
    data: AddressInput
): Promise<{ lat: number; lng: number } | null> {
    const query = buildAddressQuery(data);
    if (!query.trim()) return null;

    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) {
        console.warn("HERE_API_KEY not set, geocoding skipped");
        return null;
    }

    try {
        const url = new URL("https://discover.search.hereapi.com/v1/geocode");
        url.searchParams.set("q", query);
        url.searchParams.set("in", "countryCode:BRA");
        url.searchParams.set("limit", "1");
        url.searchParams.set("apiKey", apiKey);

        const response = await fetch(url.toString());
        const result: HereDiscoverApiResponse = await response.json();

        if (result.items && result.items.length > 0) {
            const { lat, lng } = result.items[0].position;
            return { lat, lng };
        }
        return null;
    } catch (e) {
        console.error("Geocoding failed:", e);
        return null;
    }
}
