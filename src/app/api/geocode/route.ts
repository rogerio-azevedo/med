import { NextRequest } from "next/server";
import { z } from "zod";

export interface HereDiscoverItemType {
    id: string;
    title: string;
    address: {
        street: string;
        houseNumber?: string;
        district?: string;
        city: string;
        stateCode: string;
        state: string;
        postalCode: string;
        countryName: string;
    };
    position: {
        lat: number;
        lng: number;
    };
}

export interface HereDiscoverApiResponseType {
    items: HereDiscoverItemType[];
}

const addressStringSchema = z.object({
    address: z.string().min(1, { message: "Endereço obrigatório" }),
});

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const isString = addressStringSchema.safeParse(data);

        if (!isString.success) {
            const errors = isString.error.flatten().fieldErrors;
            return new Response(
                JSON.stringify({ error: `Geocode validation error ${JSON.stringify(errors)}` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const query = isString.data.address;

        const url = new URL("https://discover.search.hereapi.com/v1/geocode");
        url.searchParams.set("q", query);
        url.searchParams.set("in", "countryCode:BRA");
        url.searchParams.set("limit", "5"); // Return up to 5 results for user choice
        url.searchParams.set("apiKey", process.env.HERE_API_KEY!);

        const response = await fetch(url.toString());
        const addresses: HereDiscoverApiResponseType = await response.json();

        return new Response(JSON.stringify({ items: addresses.items || [] }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: `Error fetching geocode ${error}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
